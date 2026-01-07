import express from 'express';
import {
  createPayment,
  vnpayReturn,
  vnpayIPN,
  momoIPN,
  getPaymentStatus,
  getPaymentHistory,
  processRefund
} from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';
import { checkMomoStatus } from '../controllers/momo.controller.js';
const router = express.Router();

/**
 * Public routes (payment gateway callbacks)
 */
// VNPay callback routes
router.get('/vnpay/return', vnpayReturn);
router.get('/vnpay/ipn', vnpayIPN);

// MoMo callback route
router.post('/momo/ipn', momoIPN);

/**
 * Protected routes
 */
router.use(protect);
router.post('/momo/check-status', checkMomoStatus);
// Create payment
router.post('/create', createPayment);



// Get payment history
router.get('/history', getPaymentHistory);

/**
 * Admin routes
 */
// Process refund
router.post('/:id/refund', isAdmin, processRefund);

export default router;
