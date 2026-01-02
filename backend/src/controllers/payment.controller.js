import crypto from 'crypto';
import querystring from 'querystring';
import Payment from '../models/Payment.js';
import Order from '../models/Order.js';
import OrderDetail from '../models/OrderDetail.js';
import ShowSeat from '../models/ShowSeat.js';
import Ticket from '../models/Ticket.js';
import { ApiError } from '../middleware/errorHandler.js';
import config from '../config/index.js';

/**
 * Payment Controller
 * Handles payment processing with VNPay and MoMo
 */

// VNPay configuration
const vnpayConfig = {
  vnp_TmnCode: config.vnpay?.tmnCode || process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: config.vnpay?.hashSecret || process.env.VNPAY_HASH_SECRET,
  vnp_Url: config.vnpay?.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: config.vnpay?.returnUrl || process.env.VNPAY_RETURN_URL,
  vnp_IpnUrl: config.vnpay?.ipnUrl || process.env.VNPAY_IPN_URL
};

/**
 * @desc    Create payment URL for order
 * @route   POST /api/payments/create
 * @access  Private
 */
export const createPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod = 'VNPAY', bankCode } = req.body;

    const order = await Order.findById(orderId).populate('customer');
    
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.customer._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }

    if (order.status !== 'PENDING') {
      throw new ApiError(400, `Cannot pay for order with status: ${order.status}`);
    }

    // Check if order has expired (10 minutes from creation)
    const now = new Date();
    const orderAge = (now - order.createdAt) / 1000 / 60; // minutes
    if (orderAge > 10) {
      await releaseOrderSeats(order._id);
      order.status = 'EXPIRED';
      await order.save();
      throw new ApiError(400, 'Order has expired. Please create a new order.');
    }

    // Create payment record
    const payment = new Payment({
      order: order._id,
      amount: order.total_amount,
      method: paymentMethod,
      status: 'PENDING',
      transaction_id: `TXN${Date.now()}`
    });
    await payment.save();

    let paymentUrl;

    if (paymentMethod === 'VNPAY') {
      paymentUrl = createVNPayUrl(order, payment, bankCode, req);
    } else if (paymentMethod === 'MOMO') {
      paymentUrl = await createMoMoUrl(order, payment);
    } else {
      throw new ApiError(400, 'Invalid payment method');
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl,
        expiresAt: new Date(order.createdAt.getTime() + 10 * 60 * 1000)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create VNPay payment URL
 */
function createVNPayUrl(order, payment, bankCode, req) {
  const date = new Date();
  const createDate = formatVNPayDate(date);
  const expireDate = formatVNPayDate(new Date(date.getTime() + 15 * 60 * 1000));

  const ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1';
  const orderId = `${order._id.toString().slice(-8)}${Date.now()}`.slice(0, 20);

  let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnpayConfig.vnp_TmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: orderId,
    vnp_OrderInfo: `Thanh toan don hang ${order.code}`,
    vnp_OrderType: 'billpayment',
    vnp_Amount: order.total_amount * 100,
    vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate
  };

  if (bankCode) {
    vnp_Params.vnp_BankCode = bankCode;
  }

  // Sort params
  vnp_Params = sortObject(vnp_Params);

  // Create signature
  const signData = querystring.stringify(vnp_Params, { encode: false });
  const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params.vnp_SecureHash = signed;

  // Update payment with transaction ref
  payment.transaction_id = orderId;
  payment.save();

  return vnpayConfig.vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });
}

/**
 * @desc    VNPay return URL handler
 * @route   GET /api/payments/vnpay/return
 * @access  Public
 */
export const vnpayReturn = async (req, res, next) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.redirect(`${config.clientUrl}/payment/failed?message=Invalid signature`);
    }

    const responseCode = vnp_Params.vnp_ResponseCode;
    const txnRef = vnp_Params.vnp_TxnRef;

    // Find payment
    const payment = await Payment.findOne({ transaction_id: txnRef }).populate('order');

    if (!payment) {
      return res.redirect(`${config.clientUrl}/payment/failed?message=Payment not found`);
    }

    if (responseCode === '00') {
      // Payment successful
      payment.status = 'COMPLETED';
      payment.paid_at = new Date();
      payment.vnpay_response = vnp_Params;
      await payment.save();

      // Update order
      const order = payment.order;
      order.status = 'PAID';
      order.payment_status = 'PAID';
      await order.save();

      // Generate tickets
      await generateTickets(order._id);

      return res.redirect(`${config.clientUrl}/payment/success?orderId=${order._id}`);
    } else {
      payment.status = 'FAILED';
      payment.vnpay_response = vnp_Params;
      await payment.save();

      return res.redirect(`${config.clientUrl}/payment/failed?code=${responseCode}`);
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.redirect(`${config.clientUrl}/payment/failed?message=Server error`);
  }
};

/**
 * @desc    VNPay IPN (Instant Payment Notification) handler
 * @route   GET /api/payments/vnpay/ipn
 * @access  Public (VNPay servers)
 */
export const vnpayIPN = async (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params.vnp_SecureHash;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const txnRef = vnp_Params.vnp_TxnRef;
    const payment = await Payment.findOne({ transaction_id: txnRef }).populate('order');

    if (!payment) {
      return res.json({ RspCode: '01', Message: 'Order not found' });
    }

    if (payment.status === 'COMPLETED') {
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    const amount = parseInt(vnp_Params.vnp_Amount) / 100;
    if (amount !== payment.amount) {
      return res.json({ RspCode: '04', Message: 'Invalid amount' });
    }

    const responseCode = vnp_Params.vnp_ResponseCode;

    if (responseCode === '00') {
      payment.status = 'COMPLETED';
      payment.paid_at = new Date();
      payment.vnpay_response = vnp_Params;
      await payment.save();

      const order = payment.order;
      order.status = 'PAID';
      order.payment_status = 'PAID';
      await order.save();

      await generateTickets(order._id);

      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      payment.status = 'FAILED';
      payment.vnpay_response = vnp_Params;
      await payment.save();

      // Release seats
      await releaseOrderSeats(payment.order._id);

      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

/**
 * @desc    Create MoMo payment URL
 */
async function createMoMoUrl(order, payment) {
  // MoMo integration placeholder
  // In production, integrate with MoMo API
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const requestId = `${order._id}_${Date.now()}`;
  const orderId = `MOMO_${order._id}`;
  const orderInfo = `Thanh toan don hang ${order.code}`;
  const redirectUrl = `${config.clientUrl}/payment/momo/return`;
  const ipnUrl = `${config.apiUrl}/api/payments/momo/ipn`;
  const amount = order.total_amount.toString();
  const requestType = 'captureWallet';
  const extraData = '';

  // Placeholder - return a mock URL for now
  // In production, sign request and call MoMo API
  return `https://test-payment.momo.vn/v2/gateway/pay?orderId=${orderId}&amount=${amount}`;
}

/**
 * @desc    MoMo IPN handler
 * @route   POST /api/payments/momo/ipn
 * @access  Public (MoMo servers)
 */
export const momoIPN = async (req, res) => {
  try {
    const { orderId, resultCode, message, transId } = req.body;

    // Find order by MoMo orderId
    const orderIdClean = orderId.replace('MOMO_', '');
    const payment = await Payment.findOne({ order: orderIdClean, method: 'MOMO' }).populate('order');

    if (!payment) {
      return res.json({ status: 1, message: 'Order not found' });
    }

    if (resultCode === 0) {
      // Payment successful
      payment.status = 'COMPLETED';
      payment.paid_at = new Date();
      payment.transaction_id = transId;
      await payment.save();

      const order = payment.order;
      order.status = 'PAID';
      order.payment_status = 'PAID';
      await order.save();

      await generateTickets(order._id);
    } else {
      payment.status = 'FAILED';
      await payment.save();
      await releaseOrderSeats(payment.order._id);
    }

    res.json({ status: 0, message: 'Success' });
  } catch (error) {
    console.error('MoMo IPN error:', error);
    res.json({ status: 1, message: 'Error' });
  }
};

/**
 * @desc    Get payment status
 * @route   GET /api/payments/:id/status
 * @access  Private
 */
export const getPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'code status total_amount');

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment._id,
          status: payment.status,
          method: payment.method,
          amount: payment.amount,
          paidAt: payment.paid_at
        },
        order: payment.order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get payment history
 * @route   GET /api/payments/history
 * @access  Private
 */
export const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get user's orders first
    const orders = await Order.find({ customer: req.user._id }).select('_id');
    const orderIds = orders.map(o => o._id);

    const [payments, total] = await Promise.all([
      Payment.find({ order: { $in: orderIds } })
        .populate('order', 'code total_amount status createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Payment.countDocuments({ order: { $in: orderIds } })
    ]);

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process refund
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin)
 */
export const processRefund = async (req, res, next) => {
  try {
    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id).populate('order');

    if (!payment) {
      throw new ApiError(404, 'Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new ApiError(400, 'Can only refund completed payments');
    }

    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      throw new ApiError(400, 'Refund amount cannot exceed payment amount');
    }

    // In production, call payment gateway refund API
    // For now, just update status

    payment.status = refundAmount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    payment.refund_amount = refundAmount;
    payment.refund_reason = reason;
    payment.refunded_at = new Date();
    await payment.save();

    // Update order
    const order = payment.order;
    order.status = 'REFUNDED';
    order.refund_amount = refundAmount;
    await order.save();

    // Update tickets
    await Ticket.updateMany(
      { concert: order.concert },
      { status: 'REFUNDED' }
    );

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { payment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Generate tickets after successful payment
 */
async function generateTickets(orderId) {
  const orderDetails = await OrderDetail.find({ order: orderId })
    .populate({
      path: 'showSeat',
      populate: { path: 'ticketClass' }
    });

  const order = await Order.findById(orderId);

  for (const detail of orderDetails) {
    // Create ticket
    const ticket = new Ticket({
      concert: order.concert,
      customer: order.customer,
      ticketClass: detail.showSeat.ticketClass._id,
      showSeat: detail.showSeat._id,
      price: detail.price
    });

    await ticket.save();

    // Update order detail
    detail.ticket = ticket._id;
    await detail.save();

    // Update showSeat status
    await ShowSeat.findByIdAndUpdate(detail.showSeat._id, { status: 'SOLD' });
  }

  console.log(`Generated ${orderDetails.length} tickets for order ${order.code}`);
}

/**
 * Helper: Release seats when order expires or fails
 */
async function releaseOrderSeats(orderId) {
  const orderDetails = await OrderDetail.find({ order: orderId });
  
  for (const detail of orderDetails) {
    await ShowSeat.findByIdAndUpdate(detail.showSeat, {
      status: 'AVAILABLE',
      $unset: { locked_by: '', locked_until: '' }
    });
  }
}

/**
 * Helper: Sort object for VNPay signature
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+');
  });
  return sorted;
}

/**
 * Helper: Format date for VNPay
 */
function formatVNPayDate(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

export default {
  createPayment,
  vnpayReturn,
  vnpayIPN,
  momoIPN,
  getPaymentStatus,
  getPaymentHistory,
  processRefund
};
