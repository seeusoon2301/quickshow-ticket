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
  const { authFetch } = useAuth();
  const { clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [showMoMoUI, setShowMoMoUI] = useState(false); 

  // Lấy dữ liệu từ trang trước truyền sang
  const cartItems = state?.cartItems || null;
  const orderId = state?.orderId || null; // Giả định ID đơn hàng đã có ở đây

  const [voucherCode, setVoucherCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  // Tính tiền tạm tính
  const subtotal = useMemo(() => {
    if (!cartItems) return 0;
    return cartItems.reduce((total, it) => {
      const price = (it.seats?.reduce((s, x) => s + (x.price || 0), 0)) || (it.price * it.quantity);
      return total + price;
    }, 0);
  }, [cartItems]);

  const finalTotal = subtotal - discountAmount;

  // --- HÀM 1: CHUYỂN SANG MÀN HÌNH MOMO (KHÔNG GỌI API ORDER) ---
  const handleNextStep = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowMoMoUI(true); 
    }, 500);
  };

  // --- HÀM 2: GỌI API THANH TOÁN MOMO THẬT ---
  const handleFinalMoMoPayment = async () => {
    const idToPay = orderId || "677b83000000000000000001"; 
    const eventName = cartItems?.[0]?.eventTitle || "Vé sự kiện";
    const ticketCount = cartItems?.reduce((total, it) => total + (it.seats?.length || it.quantity), 0);
    const customOrderInfo = `Vé: ${eventName} (x${ticketCount})`;
    setLoading(true);
    const toastId = toast.loading('Đang kết nối MoMo...');
    
    try {
      const response = await authFetch('/payment', {
        method: 'POST',
        body: JSON.stringify({
          orderId: idToPay,
          paymentMethod: 'MOMO',
          amount: Math.round(finalTotal).toString(), // MoMo thích kiểu string hơn
          orderInfo: customOrderInfo // Nên thêm trường này
        }),
      });

      const result = await response.json();

      // KIỂM TRA LẠI Ở ĐÂY: 
      // MoMo trả về resultCode = 0 nghĩa là thành công
      // Trường link thanh toán của MoMo là payUrl (không phải paymentUrl)
      if (result.resultCode === 0 && result.payUrl) {
        toast.success('Thành công! Đang chuyển hướng...', { id: toastId });
        
        // Đợi 1 giây để user kịp nhìn thấy dấu tích xanh rồi mới chuyển trang
        setTimeout(() => {
          window.location.href = result.payUrl;
        }, 1000);
      } else {
        // Nếu resultCode khác 0, MoMo sẽ trả về lý do trong result.message
        toast.error(result.message || 'Lỗi khởi tạo thanh toán', { id: toastId });
      }
    } catch (err) {
      console.error("Payment Error:", err);
      toast.error('Lỗi kết nối server thanh toán', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // (Giữ nguyên hàm handleApplyVoucher nếu bạn vẫn muốn dùng giảm giá)
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsValidating(true);
    try {
      const res = await authFetch('/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({ code: voucherCode, totalAmount: subtotal, concertId: cartItems?.[0]?.eventId }),
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setDiscountAmount(data.data.calculated_discount);
        toast.success('Áp dụng voucher thành công');
      } else {
        toast.error(data.message || 'Mã không hợp lệ');
      }
    } catch (err) { toast.error('Lỗi voucher'); } finally { setIsValidating(false); }
  };

  if (showMoMoUI) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-md">
          <button onClick={() => setShowMoMoUI(false)} className="mb-4 flex items-center gap-2 text-gray-400">
            <ArrowLeft size={18} /> Quay lại
          </button>
          <MoMoCheckout 
            items={cartItems}
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-white text-center">Thanh toán</h1>
      <div className="bg-gray-800 p-6 rounded-2xl mb-6 shadow-xl border border-gray-700">
        <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-4">Đơn hàng của bạn</div>
        {cartItems?.map((it) => (
          <div key={it.id} className="flex justify-between py-2 text-white border-b border-gray-700 last:border-0">
            <span>{it.eventTitle} (x{it.seats?.length || it.quantity})</span>
            <span className="font-semibold">{((it.seats?.reduce((s, x) => s + (x.price || 0), 0)) || (it.price * it.quantity)).toLocaleString()}đ</span>
          </div>
        ))}
        <div className="mt-6 pt-4 border-t border-gray-700 text-2xl font-black text-white flex justify-between">
          <span>Tổng:</span>
          <span className="text-indigo-400">{finalTotal.toLocaleString()}đ</span>
        </div>
      </div>

      <button 
        onClick={handleNextStep} 
        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg"
      >
        XÁC NHẬN ĐƠN HÀNG
      </button>
    </div>
  );
};

export default PaymentFlow;
