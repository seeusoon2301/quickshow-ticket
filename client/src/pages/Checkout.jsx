import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Clock, MapPin, Calendar, Ticket, AlertCircle, Trash2, ShoppingCart } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useUser, useClerk } from "@clerk/clerk-react";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    getCartTotals, 
    formatTimeRemaining, 
    hasItems,
    isExpiringSoon 
  } = useCart();
  
  // Support both cart items and direct checkout (from EventDetail)
  const directCheckout = location.state?.event;
  const { event, selectedSeats, ticketClass } = location.state || {};
  
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Redirect to home if no items and no direct checkout
  useEffect(() => {
    if (!hasItems && !directCheckout) {
      navigate("/");
    }
  }, [hasItems, directCheckout, navigate]);

  // Redirect to login if not signed in
  useEffect(() => {
    if (!isSignedIn) {
      openSignIn();
    }
  }, [isSignedIn, openSignIn]);

  const { subtotal, serviceFee, total: cartTotal, itemCount } = getCartTotals();
  const finalTotal = cartTotal - discount;

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    
    setLoading(true);
    try {
      // Call voucher API
      const response = await fetch(`http://localhost:5000/api/vouchers/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: voucherCode }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const voucher = data.data;
        let discountAmount = Math.round((subtotal * voucher.discount_percent) / 100);
        if (discountAmount > voucher.max_amount) {
          discountAmount = voucher.max_amount;
        }
        setDiscount(discountAmount);
        setVoucherApplied({ ...voucher, code: voucherCode.toUpperCase() });
      } else {
        // Fallback to mock vouchers
        const mockVouchers = {
          "WELCOME10": { discount_percent: 10, max_amount: 200000 },
          "NEWYEAR2026": { discount_percent: 15, max_amount: 300000 },
          "VIP20": { discount_percent: 20, max_amount: 500000 },
        };

        const voucher = mockVouchers[voucherCode.toUpperCase()];
        if (voucher) {
          let discountAmount = Math.round((subtotal * voucher.discount_percent) / 100);
          if (discountAmount > voucher.max_amount) {
            discountAmount = voucher.max_amount;
          }
          setDiscount(discountAmount);
          setVoucherApplied({ ...voucher, code: voucherCode.toUpperCase() });
        } else {
          alert("Invalid voucher code");
          setVoucherApplied(null);
          setDiscount(0);
        }
      }
    } catch (error) {
      console.error("Error applying voucher:", error);
      alert("Failed to validate voucher");
    } finally {
      setLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucherCode("");
    setVoucherApplied(null);
    setDiscount(0);
  };

  const handleProceedPayment = () => {
    navigate("/payment", {
      state: {
        cartItems,
        subtotal,
        serviceFee,
        discount,
        total: finalTotal,
        voucher: voucherApplied,
      },
    });
  };

  // Show empty cart state
  if (!hasItems && !directCheckout) {
    return (
      <div className="min-h-screen pt-28 pb-12 px-6 md:px-16 lg:px-24 text-white flex flex-col items-center justify-center">
        <ShoppingCart className="w-24 h-24 text-gray-600 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-400 mb-6">Browse events and add tickets to your cart</p>
        <button
          onClick={() => navigate("/")}
          className="px-8 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary-dull transition"
        >
          Browse Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 md:px-16 lg:px-24 text-white">
      {/* Timer Warning */}
      {hasItems && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-full flex items-center gap-3 ${
          isExpiringSoon() ? "bg-red-600" : "bg-yellow-600"
        }`}>
          <Clock className="w-5 h-5" />
          <span className="font-semibold">
            Cart expires in: {formatTimeRemaining()}
          </span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Continue Shopping
      </button>

      <h1 className="text-3xl font-bold mb-8">Checkout ({itemCount} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Cart</h2>
              {cartItems.length > 1 && (
                <button 
                  onClick={clearCart}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.eventThumbnail}
                      alt={item.eventTitle}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.eventTitle}</h3>
                      <p className="text-primary text-sm">{item.ticketClassName}</p>
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{item.eventVenue}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold">
                        {item.price.toLocaleString()}đ
                      </p>
                      <p className="text-gray-400 text-sm">per ticket</p>
                    </div>
                  </div>

                  {/* Quantity & Remove */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">
                        {(item.price * item.quantity).toLocaleString()}đ
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Voucher Code */}
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Voucher Code</h2>
            
            {voucherApplied ? (
              <div className="flex items-center justify-between bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-semibold text-green-400">{voucherApplied.code}</p>
                    <p className="text-sm text-gray-400">
                      {voucherApplied.discount_percent}% off (Max: {voucherApplied.max_amount.toLocaleString()}đ)
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeVoucher}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter voucher code"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary focus:outline-none"
                />
                <button
                  onClick={applyVoucher}
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dull transition disabled:opacity-50"
                >
                  {loading ? "..." : "Apply"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[rgb(37,36,36)] rounded-xl p-6 sticky top-32">
            <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between text-gray-400">
                <span>Tickets ({itemCount}x)</span>
                <span>{subtotal.toLocaleString()}đ</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Service Fee (5%)</span>
                <span>{serviceFee.toLocaleString()}đ</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Voucher Discount</span>
                  <span>-{discount.toLocaleString()}đ</span>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">{finalTotal.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleProceedPayment}
              className="w-full mt-6 py-4 bg-primary text-black font-bold text-lg rounded-lg hover:bg-primary-dull transition"
            >
              Proceed to Payment
            </button>

            <div className="mt-4 flex items-start gap-2 text-gray-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                By proceeding, you agree to our Terms of Service and understand that tickets are non-refundable unless the event is cancelled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
