import { Router } from 'express';
import {
  getConcerts,
  getConcertById,
  createConcert,
  updateConcert,
  deleteConcert,
  getConcertSeats,
  publishConcert,
  cancelConcert,
  getMyConcerts,
  getFeaturedConcerts
} from '../controllers/concert.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authorize, isAdmin, isOrganizerOrAdmin } from '../middleware/roles.js';

const router = Router();

/**
 * Concert Routes
 * Base path: /api/concerts
 */

// Public routes (optional auth for personalization)
router.get('/', optionalAuth, getConcerts);
router.get('/featured', getFeaturedConcerts);
router.get('/:id', optionalAuth, getConcertById);
router.get('/:id/seats', getConcertSeats);

// Organizer routes
router.get('/organizer/my-concerts', authenticate, authorize('ORG', 'ADMIN'), getMyConcerts);

// Admin & Organizer routes
router.post('/', authenticate, isOrganizerOrAdmin, createConcert);
router.put('/:id', authenticate, isOrganizerOrAdmin, updateConcert);

// Admin only routes
router.delete('/:id', authenticate, isAdmin, deleteConcert);
router.put('/:id/publish', authenticate, isAdmin, publishConcert);
router.put('/:id/cancel', authenticate, isAdmin, cancelConcert);

export default router;
