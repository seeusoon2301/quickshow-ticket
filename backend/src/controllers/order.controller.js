import Order from '../models/Order.js';
import OrderDetail from '../models/OrderDetail.js';
import Ticket from '../models/Ticket.js';
import ShowSeat from '../models/ShowSeat.js';
import TicketClass from '../models/TicketClass.js';
import Concert from '../models/Concert.js';
import Voucher from '../models/Voucher.js';
import Payment from '../models/Payment.js';
import { ApiError } from '../middleware/errorHandler.js';
import crypto from 'crypto';

/**
 * Order Controller
 * Handles ticket booking, order management
 */

/**
 * @desc    Lock seats for booking (Step 1)
 * @route   POST /api/orders/lock-seats
 * @access  Private
 */
export const lockSeats = async (req, res, next) => {
  try {
    const { concertId, seatIds } = req.body;

    if (!concertId || !seatIds || seatIds.length === 0) {
      throw new ApiError(400, 'Please provide concertId and seatIds');
    }

    if (seatIds.length > 10) {
      throw new ApiError(400, 'Maximum 10 seats per booking');
    }

    // Release any expired locks first
    await ShowSeat.releaseExpiredLocks();

    // Check if concert exists and is published
    const concert = await Concert.findById(concertId);
    if (!concert || concert.status !== 'PUB') {
      throw new ApiError(404, 'Concert not found or not available');
    }

    // Lock seats
    const lockedSeats = [];
    const failedSeats = [];

    for (const seatId of seatIds) {
      const showSeat = await ShowSeat.findOne({
        _id: seatId,
        concert: concertId
      }).populate('seat');

      if (!showSeat) {
        failedSeats.push({ seatId, reason: 'Seat not found' });
        continue;
      }

      if (showSeat.status !== 'AVAILABLE') {
        failedSeats.push({ 
          seatId, 
          reason: showSeat.status === 'SOLD' ? 'Seat already sold' : 'Seat is being held by another user' 
        });
        continue;
      }

      try {
        await showSeat.lock(req.user._id, 10); // 10 minute lock
        lockedSeats.push({
          showSeatId: showSeat._id,
          seatId: showSeat.seat._id,
          row: showSeat.seat.row,
          number: showSeat.seat.number,
          label: showSeat.seat.label,
          price: showSeat.price
        });
      } catch (err) {
        failedSeats.push({ seatId, reason: err.message });
      }
    }

    if (lockedSeats.length === 0) {
      throw new ApiError(400, 'Could not lock any seats', failedSeats);
    }

    // Calculate totals
    const subtotal = lockedSeats.reduce((sum, seat) => sum + seat.price, 0);
    const serviceFee = Math.round(subtotal * 0.05);
    const total = subtotal + serviceFee;

    res.json({
      success: true,
      message: `Locked ${lockedSeats.length} seats for 10 minutes`,
      data: {
        lockedSeats,
        failedSeats: failedSeats.length > 0 ? failedSeats : undefined,
        pricing: {
          subtotal,
          serviceFee,
          total
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Release locked seats
 * @route   POST /api/orders/release-seats
 * @access  Private
 */
export const releaseSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;

    const result = await ShowSeat.updateMany(
      {
        _id: { $in: seatIds },
        locked_by: req.user._id,
        status: 'LOCKED'
      },
      {
        status: 'AVAILABLE',
        locked_by: null,
        lock_expire_time: null
      }
    );

    res.json({
      success: true,
      message: `Released ${result.modifiedCount} seats`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create order (Step 2 - after locking seats)
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res, next) => {
  try {
    const { concertId, seatIds, voucherCode, customerInfo } = req.body;

    if (!concertId || !seatIds || seatIds.length === 0) {
      throw new ApiError(400, 'Please provide concertId and seatIds');
    }

    // Verify all seats are locked by this user
    const showSeats = await ShowSeat.find({
      _id: { $in: seatIds },
      concert: concertId,
      locked_by: req.user._id,
      status: 'LOCKED'
    }).populate('seat ticketClass');

    if (showSeats.length !== seatIds.length) {
      throw new ApiError(400, 'Some seats are no longer reserved for you. Please select again.');
    }

    const concert = await Concert.findById(concertId);

    // Calculate totals
    let subtotal = showSeats.reduce((sum, ss) => sum + (ss.price || 0), 0);
    const serviceFee = Math.round(subtotal * 0.05);
    let discount = 0;
    let voucher = null;

    // Apply voucher if provided
    if (voucherCode) {
      voucher = await Voucher.findOne({ code: voucherCode.toUpperCase() });
      if (voucher) {
        const validation = voucher.isValid(subtotal, req.user._id, concertId);
        if (validation.valid) {
          discount = voucher.calculateDiscount(subtotal);
        } else {
          // Voucher invalid but don't fail the order
          voucher = null;
        }
      }
    }

    const total = subtotal + serviceFee - discount;

    // Create order
    const order = await Order.create({
      customer: req.user._id,
      concert: concertId,
      subtotal,
      service_fee: serviceFee,
      discount_amount: discount,
      total_amount: total,
      voucher: voucher?._id,
      customer_info: customerInfo || {
        fullName: req.user.fullName,
        email: req.user.email,
        phone: req.user.phone
      },
      status: 'PENDING'
    });

    // Create tickets and order details
    for (const showSeat of showSeats) {
      // Create ticket
      const ticket = await Ticket.create({
        showSeat: showSeat._id,
        ticketClass: showSeat.ticketClass?._id,
        concert: concertId,
        customer: req.user._id,
        ticket_code: 'TKT' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString('hex').toUpperCase(),
        qr_hash: crypto.createHash('sha256').update(Date.now().toString() + showSeat._id.toString()).digest('hex'),
        status: 'VALID'
      });

      // Create order detail
      await OrderDetail.create({
        order: order._id,
        ticket: ticket._id,
        price_snapshot: showSeat.price || 0,
        ticket_info: {
          concert_title: concert.title,
          ticket_class: showSeat.ticketClass?.name,
          seat_label: showSeat.seat?.label,
          zone_name: showSeat.ticketClass?.zone?.name
        }
      });
    }

    // Update voucher usage
    if (voucher) {
      await voucher.use();
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment within 15 minutes.',
      data: {
        order: {
          _id: order._id,
          code: order.code,
          subtotal: order.subtotal,
          serviceFee: order.service_fee,
          discount: order.discount_amount,
          total: order.total_amount,
          status: order.status,
          expiresAt: order.expires_at
        },
        concert: {
          _id: concert._id,
          title: concert.title,
          start_time: concert.start_time
        },
        tickets: showSeats.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's orders
 * @route   GET /api/orders
 * @access  Private
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = { customer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('concert', 'title thumbnail start_time venue')
        .populate('voucher', 'code discount_percent')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
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
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('concert')
      .populate('voucher')
      .populate('customer', 'username email fullName phone');

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check ownership (unless admin)
    if (req.user.role !== 'ADMIN' && order.customer._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }

    // Get order details with tickets
    const orderDetails = await OrderDetail.find({ order: order._id })
      .populate({
        path: 'ticket',
        populate: {
          path: 'showSeat',
          populate: { path: 'seat' }
        }
      });

    // Get payment info
    const payment = await Payment.findOne({ order: order._id });

    res.json({
      success: true,
      data: {
        order,
        orderDetails,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by code
 * @route   GET /api/orders/code/:code
 * @access  Private
 */
export const getOrderByCode = async (req, res, next) => {
  try {
    const order = await Order.findOne({ code: req.params.code })
      .populate('concert')
      .populate('customer', 'username email fullName');

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check ownership (unless admin/staff)
    if (!['ADMIN', 'STAFF'].includes(req.user.role) && 
        order.customer._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }

    const orderDetails = await OrderDetail.find({ order: order._id })
      .populate('ticket');

    res.json({
      success: true,
      data: { order, orderDetails }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order (request refund)
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findById(req.params.id)
      .populate('concert');

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    // Check ownership
    if (req.user.role !== 'ADMIN' && order.customer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Access denied');
    }

    // Check if order can be cancelled
    if (!['PENDING', 'PAID'].includes(order.status)) {
      throw new ApiError(400, `Cannot cancel order with status: ${order.status}`);
    }

    // Calculate refund based on concert date
    const now = new Date();
    const concertDate = new Date(order.concert.start_time);
    const daysUntilConcert = Math.ceil((concertDate - now) / (1000 * 60 * 60 * 24));

    let refundPercent = 0;
    let refundMessage = '';

    if (daysUntilConcert >= 7) {
      refundPercent = 100;
      refundMessage = '100% refund (more than 7 days before event)';
    } else if (daysUntilConcert >= 3) {
      refundPercent = 50;
      refundMessage = '50% refund (3-7 days before event)';
    } else {
      refundPercent = 0;
      refundMessage = 'No refund available (less than 3 days before event)';
    }

    // Cancel the order
    await order.cancel(reason);

    // Update cancellation info
    order.cancellation = {
      ...order.cancellation,
      reason,
      refund_amount: Math.round(order.total_amount * refundPercent / 100),
      status: order.status === 'PAID' ? 'PENDING' : 'APPROVED'
    };
    await order.save();

    res.json({
      success: true,
      message: `Order cancelled. ${refundMessage}`,
      data: {
        order,
        refundAmount: order.cancellation.refund_amount,
        refundStatus: order.cancellation.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Admin
 */
export const getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      concert,
      customer,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (concert) query.concert = concert;
    if (customer) query.customer = customer;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customer', 'username email fullName')
        .populate('concert', 'title start_time')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        orders,
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
 * @desc    Process refund request (Admin)
 * @route   PUT /api/orders/:id/refund
 * @access  Admin
 */
export const processRefund = async (req, res, next) => {
  try {
    const { approve, refundAmount } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (!order.cancellation || order.cancellation.status !== 'PENDING') {
      throw new ApiError(400, 'No pending refund request for this order');
    }

    order.cancellation.processed_at = new Date();
    order.cancellation.processed_by = req.user._id;

    if (approve) {
      order.cancellation.status = 'APPROVED';
      order.cancellation.refund_amount = refundAmount || order.cancellation.refund_amount;
      order.status = 'REFUNDED';

      // TODO: Process actual refund through payment gateway
    } else {
      order.cancellation.status = 'REJECTED';
      order.status = 'PAID'; // Revert status
    }

    await order.save();

    res.json({
      success: true,
      message: approve ? 'Refund approved' : 'Refund rejected',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/admin/stats
 * @access  Admin
 */
export const getOrderStats = async (req, res, next) => {
  try {
    const { startDate, endDate, concert } = req.query;

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    if (concert) matchStage.concert = concert;

    const [
      totalStats,
      statusStats,
      revenueByDay,
      topConcerts
    ] = await Promise.all([
      // Total stats
      Order.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$total_amount', 0] } },
            avgOrderValue: { $avg: '$total_amount' }
          }
        }
      ]),
      // By status
      Order.aggregate([
        { $match: matchStage },
        { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total_amount' } } }
      ]),
      // Revenue by day (last 30 days)
      Order.aggregate([
        {
          $match: {
            status: 'PAID',
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total_amount' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      // Top concerts by revenue
      Order.aggregate([
        { $match: { ...matchStage, status: 'PAID' } },
        {
          $group: {
            _id: '$concert',
            revenue: { $sum: '$total_amount' },
            ticketsSold: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'concerts',
            localField: '_id',
            foreignField: '_id',
            as: 'concert'
          }
        },
        { $unwind: '$concert' }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: totalStats[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
        byStatus: statusStats,
        revenueByDay,
        topConcerts
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  lockSeats,
  releaseSeats,
  createOrder,
  getMyOrders,
  getOrderById,
  getOrderByCode,
  cancelOrder,
  getAllOrders,
  processRefund,
  getOrderStats
};
