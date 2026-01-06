import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import toast from 'react-hot-toast';

const PaymentFlow = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user: backendUser, authFetch } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  const cartItems = state?.cartItems || null;
  const customer = state?.customer || null;

  useEffect(() => {
    try {
      const eventId = (cartItems && cartItems[0] && cartItems[0].eventId) || null;
      const eventTitle = (cartItems && cartItems[0] && cartItems[0].eventTitle) || null;
      if (eventId) sessionStorage.setItem('purchase_progress', JSON.stringify({ eventId, eventTitle, step: 'payment', ts: Date.now() }));
    } catch (e) {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      // Simulate payment success, then update user's phone in backend if provided
      if (backendUser && customer?.phone) {
        await authFetch(`/users/${backendUser._id}`, {
          method: 'PUT',
          body: JSON.stringify({ phone: customer.phone }),
        });
      }

      // Clear cart after successful payment
      clearCart();
      try { sessionStorage.removeItem('purchase_progress'); } catch (e) {}
      toast.success('Payment successful — phone updated');
      navigate('/my-tickets');
    } catch (err) {
      console.error('Payment/update error', err);
      toast.error('Payment failed or update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Thanh toán</h1>
      <p className="mb-4">Hoàn tất thanh toán để xác nhận đơn hàng.</p>

      <div className="bg-gray-800 p-4 rounded mb-4">
        <div className="text-sm text-gray-300 mb-2">Tóm tắt đơn hàng</div>
        {cartItems ? (
          cartItems.map((it) => (
            <div key={it.id} className="flex justify-between py-2 border-b border-gray-700">
              <div>{it.eventTitle} · {it.ticketClassName} · {it.seats ? it.seats.length : it.quantity} vé</div>
              <div className="font-semibold">{((it.seats && it.seats.reduce((s, x) => s + (x.price || it.price || 0), 0)) || (it.price * (it.quantity || 0))).toLocaleString()} đ</div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">Không có đơn hàng</div>
        )}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-300 mb-2">Thông tin khách hàng</div>
        <div className="bg-gray-800 p-4 rounded">
          <div>Tên: {customer?.fullName || backendUser?.fullName}</div>
          <div>Email: {customer?.email || backendUser?.email}</div>
          <div>Số điện thoại: {customer?.phone || backendUser?.phone || '—'}</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 rounded">Quay lại</button>
        <button onClick={handleConfirmPayment} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}</button>
      </div>
    </div>
  );
};

export default PaymentFlow;
