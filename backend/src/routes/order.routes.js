import { Router } from 'express';
import {
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
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

/**
 * Order Routes
 * Base path: /api/orders
 */

// All routes require authentication
router.use(authenticate);

// Booking flow
router.post('/lock-seats', lockSeats);
router.post('/release-seats', releaseSeats);
router.post('/', createOrder);

// User orders
router.get('/', getMyOrders);
router.get('/code/:code', getOrderByCode);
router.get('/:id', getOrderById);
router.post('/:id/cancel', cancelOrder);

// Admin routes
router.get('/admin/all', isAdmin, getAllOrders);
router.get('/admin/stats', isAdmin, getOrderStats);
router.put('/:id/refund', isAdmin, processRefund);

export default router;
