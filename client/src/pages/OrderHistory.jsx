import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingBag, Calendar, ChevronDown, ChevronUp, 
  Eye, Download, RefreshCw, Search, Filter,
  CheckCircle, XCircle, Clock, CreditCard
} from "lucide-react";

const OrderHistory = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/");
    }
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    // Mock fetch orders
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const mockOrders = [
          {
            _id: "ord1",
            code: "ORD2026ABCD1234",
            status: "PAID",
            createdAt: "2026-01-01T10:30:00",
            total_amount: 2625000,
            discount_amount: 0,
            items: [
              {
                event: {
                  name: "SOOBIN LIVE CONCERT 2026",
                  date: "2026-02-15",
                  image: "https://salt.tkbcdn.com/ts/ds/9c/9e/c1/2edd538cb4df21a0d13f95588cb44dc4.png",
                },
                ticketClass: "VIP",
                quantity: 1,
                price: 2500000,
              },
            ],
            payment: {
              method: "MOMO",
              trans_id: "MOMO123456",
              pay_time: "2026-01-01T10:32:00",
            },
          },
          {
            _id: "ord2",
            code: "ORD2026EFGH5678",
            status: "PAID",
            createdAt: "2026-01-10T14:20:00",
            total_amount: 840000,
            discount_amount: 80000,
            voucher: { code: "SAVE10", discount_percent: 10 },
            items: [
              {
                event: {
                  name: "ANH TRAI SAY HI CONCERT",
                  date: "2026-03-20",
                  image: "https://salt.tkbcdn.com/ts/ds/39/73/a8/28010109be7d4dea1121714d90cd803e.png",
                },
                ticketClass: "Standard",
                quantity: 1,
                price: 800000,
              },
            ],
            payment: {
              method: "VNPAY",
              trans_id: "VNP987654",
              pay_time: "2026-01-10T14:25:00",
            },
          },
          {
            _id: "ord3",
            code: "ORD2025IJKL9012",
            status: "CANCEL",
            createdAt: "2025-11-15T09:00:00",
            total_amount: 1500000,
            discount_amount: 0,
            items: [
              {
                event: {
                  name: "Jazz Night Special",
                  date: "2025-12-01",
                  image: "https://via.placeholder.com/400x300?text=Jazz+Night",
                },
                ticketClass: "Premium",
                quantity: 2,
                price: 750000,
              },
            ],
            cancellation: {
              reason: "Event cancelled by organizer",
              refundAmount: 1500000,
              refundedAt: "2025-11-20",
            },
          },
          {
            _id: "ord4",
            code: "ORD2026MNOP3456",
            status: "PENDING",
            createdAt: "2026-01-02T16:45:00",
            total_amount: 600000,
            discount_amount: 0,
            items: [
              {
                event: {
                  name: "Comedy Night Show",
                  date: "2026-02-10",
                  image: "https://via.placeholder.com/400x300?text=Comedy+Show",
                },
                ticketClass: "Standard",
                quantity: 2,
                price: 300000,
              },
            ],
          },
        ];

        setTimeout(() => {
          setOrders(mockOrders);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchOrders();
    }
  }, [isSignedIn]);

  const filteredOrders = orders.filter((order) => {
    let matchFilter = true;
    if (filter !== "all") matchFilter = order.status === filter;

    const matchSearch = 
      order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some((item) =>
        item.event.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchFilter && matchSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "CANCEL":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PAID: "bg-green-600/30 text-green-400",
      PENDING: "bg-yellow-600/30 text-yellow-400",
      CANCEL: "bg-red-600/30 text-red-400",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    return <CreditCard className="w-4 h-4" />;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("vi-VN");
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-6 md:px-16 lg:px-24 text-white">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Order History</h1>
          <div className="flex items-center gap-2 text-gray-400">
            <ShoppingBag className="w-5 h-5" />
            <span>{orders.length} orders</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[rgb(37,36,36)] border border-gray-700 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            {["all", "PAID", "PENDING", "CANCEL"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg capitalize transition ${
                  filter === f
                    ? "bg-primary text-black font-semibold"
                    : "bg-[rgb(37,36,36)] text-gray-400 hover:text-white"
                }`}
              >
                {f === "all" ? "All" : f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(37,36,36)] rounded-xl">
            <ShoppingBag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400">No orders found</h3>
            <p className="text-gray-500 mt-2">
              {filter === "all"
                ? "You haven't made any orders yet"
                : `No ${filter.toLowerCase()} orders`}
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-6 px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dull"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-[rgb(37,36,36)] rounded-xl overflow-hidden"
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order._id ? null : order._id)
                  }
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.status)}
                      <span className="font-mono text-sm text-gray-400">
                        {order.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      {expandedOrder === order._id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <img
                      src={order.items[0].event.image}
                      alt={order.items[0].event.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold">{order.items[0].event.name}</h3>
                      {order.items.length > 1 && (
                        <p className="text-gray-400 text-sm">
                          +{order.items.length - 1} more item(s)
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold text-lg">
                        {order.total_amount.toLocaleString()}đ
                      </p>
                      {order.discount_amount > 0 && (
                        <p className="text-green-400 text-sm">
                          -{order.discount_amount.toLocaleString()}đ
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order._id && (
                  <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      <h4 className="font-semibold text-gray-400">Items</h4>
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-black/20 p-3 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{item.event.name}</p>
                            <p className="text-gray-400 text-sm">
                              {item.ticketClass} × {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {(item.price * item.quantity).toLocaleString()}đ
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Payment Info */}
                    {order.payment && (
                      <div className="bg-black/20 p-4 rounded-lg mb-4">
                        <h4 className="font-semibold text-gray-400 mb-2">Payment</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Method</p>
                            <div className="flex items-center gap-2">
                              {getPaymentMethodIcon(order.payment.method)}
                              <span>{order.payment.method}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-500">Transaction ID</p>
                            <p className="font-mono">{order.payment.trans_id}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Paid at</p>
                            <p>{formatDate(order.payment.pay_time)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Voucher */}
                    {order.voucher && (
                      <div className="bg-green-900/20 border border-green-700 p-3 rounded-lg mb-4">
                        <p className="text-green-400 text-sm">
                          Voucher applied: <span className="font-semibold">{order.voucher.code}</span> ({order.voucher.discount_percent}% off)
                        </p>
                      </div>
                    )}

                    {/* Cancellation Info */}
                    {order.cancellation && (
                      <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg mb-4">
                        <p className="text-red-400 text-sm">
                          <strong>Cancelled:</strong> {order.cancellation.reason}
                        </p>
                        {order.cancellation.refundAmount && (
                          <p className="text-gray-400 text-sm mt-1">
                            Refunded: {order.cancellation.refundAmount.toLocaleString()}đ on {order.cancellation.refundedAt}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {order.status === "PAID" && (
                        <>
                          <button
                            onClick={() => navigate("/my-tickets")}
                            className="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary-dull flex items-center justify-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Tickets
                          </button>
                          <button className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Invoice
                          </button>
                        </>
                      )}
                      {order.status === "PENDING" && (
                        <button className="flex-1 px-4 py-2 bg-yellow-600 text-black font-semibold rounded-lg hover:bg-yellow-500 flex items-center justify-center gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Complete Payment
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
