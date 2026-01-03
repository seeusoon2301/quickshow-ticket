import { Router } from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueSeats,
  saveVenueSeats,
  addSeats,
  deleteSeats,
  updateSeat,
  getVenueCapacity,
  generateSeats
} from '../controllers/venue.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

/**
 * Venue Routes
 * Base path: /api/venues
 * 
 * NEW STRUCTURE:
 * - Venues have Seats directly (no zones)
 * - Seat layouts are templates for the venue
 * - TicketClasses are per-event, managed via concert routes
 */

// Public routes
router.get('/', getVenues);
router.get('/:id', getVenueById);
router.get('/:id/seats', getVenueSeats);
router.get('/:id/capacity', getVenueCapacity);

// Admin routes - Venue CRUD
router.post('/', authenticate, isAdmin, createVenue);
router.put('/:id', authenticate, isAdmin, updateVenue);
router.delete('/:id', authenticate, isAdmin, deleteVenue);

// Admin routes - Seat Management
router.post('/:id/seats', authenticate, isAdmin, addSeats);
router.put('/:id/seats', authenticate, isAdmin, saveVenueSeats);
router.delete('/:id/seats', authenticate, isAdmin, deleteSeats);
router.put('/:id/seats/:seatId', authenticate, isAdmin, updateSeat);
router.post('/:id/generate-seats', authenticate, isAdmin, generateSeats);

export default router;
