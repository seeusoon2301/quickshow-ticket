// import crypto from 'crypto';
// import querystring from 'querystring';
// import Payment from '../models/Payment.js';
// import Order from '../models/Order.js';
// import OrderDetail from '../models/OrderDetail.js';
// import ShowSeat from '../models/ShowSeat.js';
// import Ticket from '../models/Ticket.js';
// import { ApiError } from '../middleware/errorHandler.js';
// import config from '../config/index.js';
// import axios from 'axios'; 
// /**
//  * Payment Controller
//  * Handles payment processing with VNPay and MoMo
//  */

// // VNPay configuration
// const vnpayConfig = {
//   vnp_TmnCode: config.vnpay?.tmnCode || process.env.VNPAY_TMN_CODE,
//   vnp_HashSecret: config.vnpay?.hashSecret || process.env.VNPAY_HASH_SECRET,
//   vnp_Url: config.vnpay?.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
//   vnp_ReturnUrl: config.vnpay?.returnUrl || process.env.VNPAY_RETURN_URL,
//   vnp_IpnUrl: config.vnpay?.ipnUrl || process.env.VNPAY_IPN_URL
// };

// /**
//  * @desc    Create payment URL for order
//  * @route   POST /api/payments/create
//  * @access  Private
//  */
// export const createPayment = async (req, res, next) => {
//   try {
//     const { orderId, paymentMethod = 'VNPAY', bankCode } = req.body;

//     const order = await Order.findById(orderId).populate('customer');
    
//     if (!order) {
//       throw new ApiError(404, 'Order not found');
//     }

//     if (order.customer._id.toString() !== req.user._id.toString()) {
//       throw new ApiError(403, 'Access denied');
//     }

//     if (order.status !== 'PENDING') {
//       throw new ApiError(400, `Cannot pay for order with status: ${order.status}`);
//     }

//     // Check if order has expired (10 minutes from creation)
//     const now = new Date();
//     const orderAge = (now - order.createdAt) / 1000 / 60; // minutes
//     if (orderAge > 10) {
//       await releaseOrderSeats(order._id);
//       order.status = 'EXPIRED';
//       await order.save();
//       throw new ApiError(400, 'Order has expired. Please create a new order.');
//     }

//     // Create payment record
//     const payment = new Payment({
//       order: order._id,
//       amount: order.total_amount,
//       method: paymentMethod,
//       status: 'PENDING',
//       trans_id: `TXN${Date.now()}`
//     });
//     await payment.save();

//     let paymentUrl;

//     if (paymentMethod === 'VNPAY') {
//       paymentUrl = createVNPayUrl(order, payment, bankCode, req);
//     } else if (paymentMethod === 'MOMO') {
//       paymentUrl = await createMoMoUrl(order, payment);
//     } else {
//       throw new ApiError(400, 'Invalid payment method');
//     }

//     res.json({
//       success: true,
//       data: {
//         paymentId: payment._id,
//         paymentUrl,
//         expiresAt: new Date(order.createdAt.getTime() + 10 * 60 * 1000)
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Create VNPay payment URL
//  */
// function createVNPayUrl(order, payment, bankCode, req) {
//   const date = new Date();
//   const createDate = formatVNPayDate(date);
//   const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60 * 1000));

//   const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
//   const orderId = `${order._id.toString().slice(-8)}${Date.now()}`.slice(0, 20);

//   let vnp_Params = {
//     vnp_Version: '2.1.0',
//     vnp_Command: 'pay',
//     vnp_TmnCode: vnpayConfig.vnp_TmnCode,
//     vnp_Locale: 'vn',
//     vnp_CurrCode: 'VND',
//     vnp_TxnRef: orderId,
//     vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
//     vnp_OrderType: 'billpayment',
//     vnp_Amount: order.total_amount * 100,
//     vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
//     vnp_IpAddr: ipAddr,
//     vnp_CreateDate: createDate,
//     vnp_ExpireDate: expireDate
//   };

//   if (bankCode) {
//     vnp_Params.vnp_BankCode = bankCode;
//   }

//   // Sort params
//   vnp_Params = sortObject(vnp_Params);

//   // Create signature
//   const signData = querystring.stringify(vnp_Params, { encode: false });
//   const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
//   const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
//   vnp_Params.vnp_SecureHash = signed;

//   // Update payment with transaction ref
//   payment.transaction_id = orderId;
//   payment.save();

//   return vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
// }

// /**
//  * @desc    VNPay return URL handler
//  * @route   GET /api/payments/vnpay/return
//  * @access  Public
//  */
// export const vnpayReturn = async (req, res, next) => {
//   try {
//     let vnp_Params = req.query;
//     const secureHash = vnp_Params.vnp_SecureHash;

//     delete vnp_Params.vnp_SecureHash;
//     delete vnp_Params.vnp_SecureHashType;

//     vnp_Params = sortObject(vnp_Params);
//     const signData = querystring.stringify(vnp_Params, { encode: false });
//     const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
//     const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

//     if (secureHash !== signed) {
//       return res.redirect(`${config.clientUrl}/payment/failed?message=Invalid signature`);
//     }

//     const responseCode = vnp_Params.vnp_ResponseCode;
//     const txnRef = vnp_Params.vnp_TxnRef;

//     // Find payment
//     const payment = await Payment.findOne({ transaction_id: txnRef }).populate('order');

//     if (!payment) {
//       return res.redirect(`${config.clientUrl}/payment/failed?message=Payment not found`);
//     }

//     if (responseCode === '00') {
//       // Payment successful
//       payment.status = 'COMPLETED';
//       payment.paid_at = new Date();
//       payment.vnpay_response = vnp_Params;
//       await payment.save();

//       // Update order
//       const order = payment.order;
//       order.status = 'PAID';
//       order.payment_status = 'PAID';
//       await order.save();

//       // Generate tickets
//       await generateTickets(order._id);

//       return res.redirect(`${config.clientUrl}/payment/success?orderId=${order._id}`);
//     } else {
//       payment.status = 'FAILED';
//       payment.vnpay_response = vnp_Params;
//       await payment.save();

//       return res.redirect(`${config.clientUrl}/payment/failed?code=${responseCode}`);
//     }
//   } catch (error) {
//     console.error('VNPay return error:', error);
//     res.redirect(`${config.clientUrl}/payment/failed?message=Server error`);
//   }
// };

// /**
//  * @desc    VNPay IPN (Instant Payment Notification) handler
//  * @route   GET /api/payments/vnpay/ipn
//  * @access  Public (VNPay servers)
//  */
// export const vnpayIPN = async (req, res) => {
//   try {
//     let vnp_Params = req.query;
//     const secureHash = vnp_Params.vnp_SecureHash;

//     delete vnp_Params.vnp_SecureHash;
//     delete vnp_Params.vnp_SecureHashType;

//     vnp_Params = sortObject(vnp_Params);
//     const signData = querystring.stringify(vnp_Params, { encode: false });
//     const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
//     const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

//     if (secureHash !== signed) {
//       return res.json({ RspCode: '97', Message: 'Invalid signature' });
//     }

//     const txnRef = vnp_Params.vnp_TxnRef;
//     const payment = await Payment.findOne({ transaction_id: txnRef }).populate('order');

//     if (!payment) {
//       return res.json({ RspCode: '01', Message: 'Order not found' });
//     }

//     if (payment.status === 'COMPLETED') {
//       return res.json({ RspCode: '02', Message: 'Order already confirmed' });
//     }

//     const amount = parseInt(vnp_Params.vnp_Amount) / 100;
//     if (amount !== payment.amount) {
//       return res.json({ RspCode: '04', Message: 'Invalid amount' });
//     }

//     const responseCode = vnp_Params.vnp_ResponseCode;

//     if (responseCode === '00') {
//       payment.status = 'COMPLETED';
//       payment.paid_at = new Date();
//       payment.vnpay_response = vnp_Params;
//       await payment.save();

//       const order = payment.order;
//       order.status = 'PAID';
//       order.payment_status = 'PAID';
//       await order.save();

//       await generateTickets(order._id);

//       return res.json({ RspCode: '00', Message: 'Confirm Success' });
//     } else {
//       payment.status = 'FAILED';
//       payment.vnpay_response = vnp_Params;
//       await payment.save();

//       // Release seats
//       await releaseOrderSeats(payment.order._id);

//       return res.json({ RspCode: '00', Message: 'Confirm Success' });
//     }
//   } catch (error) {
//     console.error('VNPay IPN error:', error);
//     res.json({ RspCode: '99', Message: 'Unknown error' });
//   }
// };

// /**
//  * @desc    Create MoMo payment URL
//  */
// async function createMoMoUrl(order, payment) {
//   const partnerCode = 'MOMOBKUN20180529';
//   const accessKey = 'klm0566394464242';
//   const secretKey = 'at67qH6mk8w5Y1n71y45UX97u0vR0ZnL';
//   const momoEndpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

//   const requestId = Date.now().toString();
//   const orderId = requestId;
//   // Ép kiểu chắc chắn là số nguyên và chuyển thành string
//   const amount = String(Math.round(order.total_amount)); 
//   const orderInfo = 'ThanhToanDonHang'; // Thử dùng chuỗi tĩnh đơn giản nhất để test
//   const redirectUrl = 'http://localhost:5173/payment/success';
//   const ipnUrl = 'https://webhook.site/test';
//   const extraData = '';
//   const requestType = 'captureWallet';

//   // 1. TẠO CHUỖI RAW - KIỂM TRA TỪNG DẤU = VÀ &
//   const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

//   // 2. TẠO CHỮ KÝ
//   const signature = crypto
//   .createHmac('sha256', secretKey)
//   .update(Buffer.from(rawSignature, 'utf-8'))
//   .digest('hex');

//   // 3. TẠO REQUEST BODY
//   const requestBody = {
//     partnerCode,
//     requestId,
//     orderId,
//     amount: Number(amount), // Phải là số
//     orderInfo,
//     redirectUrl,
//     ipnUrl,
//     extraData,
//     requestType,
//     signature, // Chữ ký đã tạo từ rawSignature
//     lang: 'vi'
//   };

//   try {
//     const response = await axios.post(momoEndpoint, requestBody);
    
//     if (response.data && response.data.payUrl) {
//       payment.trans_id = orderId;
//       await payment.save();
//       return response.data.payUrl;
//     }
//     throw new Error(response.data.message);
//   } catch (error) {
//     // In ra chuỗi bạn đã ký để so sánh với chuỗi MoMo yêu cầu trong log lỗi
//     console.log("--- CHUỖI BẠN ĐÃ KÝ ---");
//     console.log(rawSignature); 
//     console.log("--- DATA GỬI ĐI ---");
//     console.log(JSON.stringify(requestBody));
    
//     throw new Error("Lỗi MoMo: " + (error.response?.data?.message || error.message));
//   }
// }




// /**
//  * @desc    MoMo IPN handler
//  * @route   POST /api/payments/momo/ipn
//  * @access  Public (MoMo servers)
//  */
// export const momoIPN = async (req, res) => {
//   try {
//     const { orderId, resultCode, transId, message, signature } = req.body;

//     // Tìm Payment dựa trên orderId (transaction_id mà chúng ta đã lưu)
//     const payment = await Payment.findOne({ transaction_id: orderId }).populate('order');

//     if (!payment) {
//       return res.status(404).json({ message: 'Payment not found' });
//     }

//     if (resultCode === 0) {
//       // 1. Cập nhật trạng thái Payment thành công
//       payment.status = 'COMPLETED';
//       payment.paid_at = new Date();
//       payment.gateway_response = req.body;
//       await payment.save();

//       // 2. Cập nhật trạng thái Đơn hàng
//       const order = payment.order;
//       order.status = 'PAID';
//       order.payment_status = 'PAID';
//       await order.save();

//       // 3. TỰ ĐỘNG XUẤT VÉ (Ticket)
//       await generateTickets(order._id);

//       console.log(`[MoMo] Đơn hàng ${order.code} thanh toán thành công.`);
//     } else {
//       // Thanh toán thất bại
//       payment.status = 'FAILED';
//       await payment.save();
//       await releaseOrderSeats(payment.order._id);
//       console.log(`[MoMo] Đơn hàng thất bại: ${message}`);
//     }

//     // MoMo yêu cầu trả về status 204 hoặc 200 kèm nội dung cụ thể
//     res.status(204).send();
//   } catch (error) {
//     console.error('MoMo IPN Callback Error:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };


// /**
//  * @desc    Get payment status
//  * @route   GET /api/payments/:id/status
//  * @access  Private
//  */
// export const getPaymentStatus = async (req, res, next) => {
//   try {
//     const payment = await Payment.findById(req.params.id)
//       .populate('order', 'code status total_amount');

//     if (!payment) {
//       throw new ApiError(404, 'Payment not found');
//     }

//     res.json({
//       success: true,
//       data: {
//         payment: {
//           id: payment._id,
//           status: payment.status,
//           method: payment.method,
//           amount: payment.amount,
//           paidAt: payment.paid_at
//         },
//         order: payment.order
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * @desc    Get payment history
//  * @route   GET /api/payments/history
//  * @access  Private
//  */
// export const getPaymentHistory = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 20 } = req.query;
//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // Get user's orders first
//     const orders = await Order.find({ customer: req.user._id }).select('_id');
//     const orderIds = orders.map(o => o._id);

//     const [payments, total] = await Promise.all([
//       Payment.find({ order: { $in: orderIds } })
//         .populate('order', 'code total_amount status createdAt')
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(parseInt(limit)),
//       Payment.countDocuments({ order: { $in: orderIds } })
//     ]);

//     res.json({
//       success: true,
//       data: {
//         payments,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / parseInt(limit))
//         }
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * @desc    Process refund
//  * @route   POST /api/payments/:id/refund
//  * @access  Private (Admin)
//  */
// export const processRefund = async (req, res, next) => {
//   try {
//     const { amount, reason } = req.body;

//     const payment = await Payment.findById(req.params.id).populate('order');

//     if (!payment) {
//       throw new ApiError(404, 'Payment not found');
//     }

//     if (payment.status !== 'COMPLETED') {
//       throw new ApiError(400, 'Can only refund completed payments');
//     }

//     const refundAmount = amount || payment.amount;
    
//     if (refundAmount > payment.amount) {
//       throw new ApiError(400, 'Refund amount cannot exceed payment amount');
//     }

//     // In production, call payment gateway refund API
//     // For now, just update status

//     payment.status = refundAmount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
//     payment.refund_amount = refundAmount;
//     payment.refund_reason = reason;
//     payment.refunded_at = new Date();
//     await payment.save();

//     // Update order
//     const order = payment.order;
//     order.status = 'REFUNDED';
//     order.refund_amount = refundAmount;
//     await order.save();

//     // Update tickets
//     await Ticket.updateMany(
//       { concert: order.concert },
//       { status: 'REFUNDED' }
//     );

//     res.json({
//       success: true,
//       message: 'Refund processed successfully',
//       data: { payment }
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Helper: Generate tickets after successful payment
//  */
// async function generateTickets(orderId) {
//   const orderDetails = await OrderDetail.find({ order: orderId })
//     .populate({
//       path: 'showSeat',
//       populate: { path: 'ticketClass' }
//     });

//   const order = await Order.findById(orderId);

//   for (const detail of orderDetails) {
//     // Create ticket
//     const ticket = new Ticket({
//       concert: order.concert,
//       customer: order.customer,
//       ticketClass: detail.showSeat.ticketClass._id,
//       showSeat: detail.showSeat._id,
//       price: detail.price
//     });

//     await ticket.save();

//     // Update order detail
//     detail.ticket = ticket._id;
//     await detail.save();

//     // Update showSeat status
//     await ShowSeat.findByIdAndUpdate(detail.showSeat._id, { status: 'SOLD' });
//   }

//   console.log(`Generated ${orderDetails.length} tickets for order ${order.code}`);
// }

// /**
//  * Helper: Release seats when order expires or fails
//  */
// async function releaseOrderSeats(orderId) {
//   const orderDetails = await OrderDetail.find({ order: orderId });
  
//   for (const detail of orderDetails) {
//     await ShowSeat.findByIdAndUpdate(detail.showSeat, {
//       status: 'AVAILABLE',
//       $unset: { locked_by: '', locked_until: '' }
//     });
//   }
// }

// /**
//  * Helper: Sort object for VNPay signature
//  */
// function sortObject(obj) {
//   const sorted = {};
//   const keys = Object.keys(obj).sort();
//   keys.forEach(key => {
//     sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
//   });
//   return sorted;
// }

// /**
//  * Helper: Format date for VNPay
//  */
// function formatVNPayDate(date) {
//   const pad = (n) => n.toString().padStart(2, '0');
//   return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
// }

// export const queryMomoTransaction = async (req, res) => {
//   try {
//     const { orderId } = req.body; // Đây là mã orderId bạn gửi sang MoMo (ví dụ: MOMO1767709997422)

//     const partnerCode = 'MOMOBKUN20180529';
//     const accessKey = 'klm0566394464242';
//     const secretKey = 'at67qH6mk8w5Y1n71y45UX97u0vR0ZnL';
//     const requestId = Date.now().toString();

//     // 1. Tạo chữ ký cho yêu cầu kiểm tra
//     const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}`;
//     const signature = crypto
//       .createHmac('sha256', secretKey)
//       .update(rawSignature)
//       .digest('hex');

//     // 2. Gửi yêu cầu tới MoMo Query Endpoint
//     const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/query', {
//       partnerCode,
//       requestId,
//       orderId,
//       signature,
//       lang: 'vi'
//     });

//     // 3. Trả kết quả về cho Frontend
//     // Nếu response.data.resultCode === 0 nghĩa là đã thanh toán thành công
//     res.json({
//       success: true,
//       momoStatus: response.data
//     });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };


// export default {
//   createPayment,
//   vnpayReturn,
//   vnpayIPN,
//   momoIPN,
//   getPaymentStatus,
//   getPaymentHistory,
//   processRefund
// };