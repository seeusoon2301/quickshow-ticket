import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { 
  ArrowLeft, CreditCard, Smartphone, Building2, 
  CheckCircle, Loader2, Shield, Clock, AlertTriangle 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isSignedIn } = useUser();
  const { authFetch, backendUser } = useAuth();
  const { clearCart } = useCart();
  
  const { event, selectedSeats, ticketClass, quantity, subtotal, serviceFee, discount, total, voucher, orderId: existingOrderId } = location.state || {};
  
  const [paymentMethod, setPaymentMethod] = useState("vnpay");
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'processing', 'success', 'failed'
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes to complete payment
  const [orderId, setOrderId] = useState(existingOrderId || null);
  const [orderCode, setOrderCode] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    fullName: user?.fullName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
  });

  // Check for VNPay return params
  useEffect(() => {
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    const vnpOrderInfo = searchParams.get("vnp_OrderInfo");
    
    if (vnpResponseCode) {
      if (vnpResponseCode === "00") {
        setPaymentStatus("success");
        clearCart();
        toast.success("Payment successful!");
        
        // Extract order ID from order info
        const orderIdMatch = vnpOrderInfo?.match(/Order: (.+)/);
        if (orderIdMatch) {
          setOrderCode(orderIdMatch[1]);
        }
        
        // Redirect to tickets after 2 seconds
        setTimeout(() => {
          navigate("/my-tickets", {
            state: { newPurchase: true }
          });
        }, 2000);
      } else {
        setPaymentStatus("failed");
        toast.error("Payment failed. Please try again.");
      }
    }
  }, [searchParams, clearCart, navigate]);

  useEffect(() => {
    // Only check if we don't have VNPay return params
    const vnpResponseCode = searchParams.get("vnp_ResponseCode");
    if (!vnpResponseCode && !event && !total) {
      navigate("/");
    }
  }, [event, total, navigate, searchParams]);

  // Payment timeout countdown
  useEffect(() => {
    if (paymentStatus === "processing") return;
    
    if (timeLeft <= 0) {
      alert("Payment session expired. Please try again.");
      navigate(`/event/${event?._id}`);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate, event, paymentStatus]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const paymentMethods = [
    {
      id: "momo",
      name: "MoMo",
      icon: Smartphone,
      color: "bg-pink-600",
      description: "Pay with MoMo e-wallet",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: CreditCard,
      color: "bg-blue-600",
      description: "VNPay QR / ATM / Visa / Master",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      icon: Smartphone,
      color: "bg-blue-500",
      description: "Pay with ZaloPay e-wallet",
    },
    {
      id: "bank",
      name: "Bank Transfer",
      icon: Building2,
      color: "bg-green-600",
      description: "Direct bank transfer",
    },
  ];

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in all customer information");
      return;
    }

    if (!isSignedIn) {
      toast.error("Please sign in to continue");
      return;
    }

    setProcessing(true);
    setPaymentStatus("processing");

    try {
      // Step 1: Lock seats if we have selected seats
      let lockedSeatIds = [];
      if (selectedSeats && selectedSeats.length > 0) {
        const lockResponse = await authFetch(`${API_URL}/orders/lock-seats`, {
          method: "POST",
          body: JSON.stringify({
            concertId: event._id,
            seatIds: selectedSeats.map(s => s.showSeatId || s._id)
          })
        });
        
        const lockData = await lockResponse.json();
        if (!lockResponse.ok) {
          throw new Error(lockData.message || "Failed to lock seats");
        }
        lockedSeatIds = lockData.data.lockedSeats.map(s => s.showSeatId);
      }

      // Step 2: Create order
      const orderResponse = await authFetch(`${API_URL}/orders`, {
        method: "POST",
        body: JSON.stringify({
          concertId: event._id,
          seatIds: lockedSeatIds.length > 0 ? lockedSeatIds : selectedSeats?.map(s => s.showSeatId || s._id) || [],
          voucherCode: voucher?.code,
          customerInfo: {
            fullName: customerInfo.fullName,
            email: customerInfo.email,
            phone: customerInfo.phone
          }
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        throw new Error(orderData.message || "Failed to create order");
      }

      const newOrderId = orderData.data.order._id;
      setOrderId(newOrderId);
      setOrderCode(orderData.data.order.code);

      // Step 3: Create payment with VNPay
      if (paymentMethod === "vnpay") {
        const paymentResponse = await authFetch(`${API_URL}/payments/create`, {
          method: "POST",
          body: JSON.stringify({
            orderId: newOrderId,
            method: "VNPAY",
            returnUrl: `${window.location.origin}/payment`
          })
        });

        const paymentData = await paymentResponse.json();
        if (!paymentResponse.ok) {
          throw new Error(paymentData.message || "Failed to create payment");
        }

        // Redirect to VNPay
        if (paymentData.data.paymentUrl) {
          window.location.href = paymentData.data.paymentUrl;
          return;
        }
      } else {
        // For other payment methods, show mock success for now
        toast.success("Order created! Payment method coming soon.");
        setPaymentStatus("success");
        clearCart();
        
        setTimeout(() => {
          navigate("/my-tickets", {
            state: { newPurchase: true, orderCode: orderData.data.order.code }
          });
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed");
      setPaymentStatus("failed");
    } finally {
      setProcessing(false);
    }
  };

  const retryPayment = () => {
    setPaymentStatus(null);
    setPaymentMethod("");
  };

  if (!event) {
    return <div className="pt-32 px-6 text-white">Loading...</div>;
  }

  // Success Screen
  if (paymentStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
          <p className="text-gray-400 mb-2">
            Your tickets have been sent to your email
          </p>
          <p className="text-primary font-semibold">{customerInfo.email}</p>
          <p className="text-gray-500 mt-6">Redirecting to your tickets...</p>
        </div>
      </div>
    );
  }

  // Failed Screen
  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-14 h-14 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Payment Failed</h1>
          <p className="text-gray-400 mb-6">
            Something went wrong. Please try again.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={retryPayment}
              className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dull"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/event/${event._id}`)}
              className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
            >
              Back to Event
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Processing Screen
  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-2">Processing Payment...</h1>
          <p className="text-gray-400">Please do not close this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 md:px-16 lg:px-24 text-white">
      {/* Timer Warning */}
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full flex items-center gap-3 ${
        timeLeft < 60 ? "bg-red-600" : "bg-gray-700"
      }`}>
        <Clock className="w-5 h-5" />
        <span className="font-semibold">
          Complete payment in: {formatTime(timeLeft)}
        </span>
      </div>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to checkout
      </button>

      <h1 className="text-3xl font-bold mb-8">Payment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Payment Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Full Name *</label>
                <input
                  type="text"
                  value={customerInfo.fullName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary focus:outline-none"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Email *</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary focus:outline-none"
                  placeholder="your@email.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary focus:outline-none placeholder:text-gray-500"
                  placeholder="0901234567"
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center`}>
                      <method.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{method.name}</p>
                      <p className="text-gray-400 text-sm">{method.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-3 p-4 bg-green-900/20 border border-green-700 rounded-xl">
            <Shield className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-medium">Secure Payment</p>
              <p className="text-gray-400 text-sm">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6 sticky top-32">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            {/* Event Info */}
            <div className="flex gap-3 mb-4 pb-4 border-b border-gray-700">
              <img
                src={event.image || event.thumbnail}
                alt={event.name || event.title}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <p className="font-semibold line-clamp-2">{event.name || event.title}</p>
                <p className="text-gray-400 text-sm">{ticketClass?.name || "General"}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{subtotal?.toLocaleString() || 0}đ</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Service Fee</span>
                <span>{serviceFee?.toLocaleString() || 0}đ</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{discount.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-700 pt-4 mb-6">
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{total?.toLocaleString() || 0}đ</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing || !paymentMethod || !customerInfo.fullName.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()}
              className="w-full py-4 bg-primary text-black font-bold text-lg rounded-lg hover:bg-primary-dull transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay ${total?.toLocaleString() || 0}đ`
              )}
            </button>

            <p className="text-gray-500 text-xs text-center mt-4">
              By proceeding, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
