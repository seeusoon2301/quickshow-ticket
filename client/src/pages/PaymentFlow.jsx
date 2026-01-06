import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import toast from 'react-hot-toast';
import { Tag, ArrowLeft } from 'lucide-react'; 
import MoMoCheckout from './MoMoCheckout.jsx';

const PaymentFlow = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user: backendUser, authFetch } = useAuth();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [showMoMoUI, setShowMoMoUI] = useState(false); 

  const cartItems = state?.cartItems || null;
  const customer = state?.customer || null;

  // --- State cho Voucher ---
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Tính tạm tính
  const subtotal = useMemo(() => {
    if (!cartItems) return 0;
    return cartItems.reduce((total, it) => {
      const itemPrice = (it.seats && it.seats.reduce((s, x) => s + (x.price || it.price || 0), 0)) 
                        || (it.price * (it.quantity || 0));
      return total + itemPrice;
    }, 0);
  }, [cartItems]);

  const finalTotal = subtotal - discountAmount;

  // --- Hàm áp dụng Voucher ---
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsValidating(true);
    try {
      const response = await authFetch('/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: voucherCode,
          totalAmount: subtotal,
          concertId: cartItems?.[0]?.eventId
        }),
      });
      const result = await response.json();
      if (result.success && result.valid) {
        setAppliedVoucher(result.data.voucher);
        setDiscountAmount(result.data.calculated_discount);
        toast.success(`Giảm giá thành công: ${result.data.calculated_discount.toLocaleString()}đ`);
      } else {
        setAppliedVoucher(null);
        setDiscountAmount(0);
        toast.error(result.message || 'Mã không hợp lệ');
      }
    } catch (err) {
      toast.error('Lỗi kiểm tra voucher');
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    // Chuyển sang UI MoMo
    setTimeout(() => {
      setLoading(false);
      setShowMoMoUI(true); 
    }, 800);
  };

  const handleFinalMoMoPayment = async () => {
    setLoading(true);
    toast.loading('Đang xử lý giao dịch MoMo...');
    setTimeout(() => {
      clearCart();
      toast.dismiss();
      toast.success('Thanh toán thành công!');
      navigate('/my-tickets');
    }, 2000);
  };

  // --- MÀN HÌNH 2: GIAO DIỆN MOMO ---
  if (showMoMoUI) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          <button onClick={() => setShowMoMoUI(false)} className="mb-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={18} /> Quay lại
          </button>
          <MoMoCheckout 
            subtotal={subtotal}
            discountAmount={discountAmount}
            finalTotal={finalTotal}
            voucherCode={voucherCode}
            onVoucherChange={setVoucherCode}
            onApplyVoucher={handleApplyVoucher}
            onConfirm={handleFinalMoMoPayment}
            loading={loading}
            isValidating={isValidating}
          />
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH 1: TÓM TẮT ĐƠN HÀNG ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Xác nhận thanh toán</h1>
      
      <div className="bg-gray-800 p-6 rounded-2xl mb-6 shadow-xl border border-gray-700">
        <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Chi tiết vé</div>
        {cartItems?.map((it) => (
          <div key={it.id} className="flex justify-between py-2 border-b border-gray-700/50 text-white last:border-0">
            <div>
              <div className="font-bold">{it.eventTitle}</div>
              <div className="text-xs text-gray-400">{it.ticketClassName} · {it.seats?.length || it.quantity} vé</div>
            </div>
            <div className="font-semibold">{((it.seats?.reduce((s, x) => s + (x.price || 0), 0)) || (it.price * it.quantity)).toLocaleString()}đ</div>
          </div>
        ))}

        {/* PHẦN NHẬP MÃ GIẢM GIÁ (ĐÃ QUAY TRỞ LẠI) */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Tag size={14} /> Bạn có mã giảm giá?
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã voucher..."
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-white outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleApplyVoucher}
              disabled={isValidating || !voucherCode}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition disabled:opacity-50"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* TỔNG TIỀN */}
        <div className="mt-6 pt-4 border-t border-gray-700 space-y-2">
          <div className="flex justify-between text-gray-400 text-sm">
            <span>Tạm tính</span>
            <span>{subtotal.toLocaleString()}đ</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-400 text-sm font-medium">
              <span>Đã giảm</span>
              <span>-{discountAmount.toLocaleString()}đ</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-black text-white pt-2">
            <span>Tổng cộng</span>
            <span className="text-indigo-400">{finalTotal.toLocaleString()}đ</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="flex-1 py-4 bg-gray-800 text-gray-400 font-bold rounded-2xl border border-gray-700 hover:bg-gray-700 transition">Quay lại</button>
        <button 
          onClick={handleConfirmPayment} 
          disabled={loading || !cartItems} 
          className="flex-[2] py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition"
        >
          {loading ? 'Đang khởi tạo...' : 'XÁC NHẬN ĐƠN HÀNG'}
        </button>
      </div>
    </div>
  );
};

export default PaymentFlow;
