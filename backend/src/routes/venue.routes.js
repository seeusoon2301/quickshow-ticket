import { Router } from 'express';
import {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  createZone,
  updateZone,
  deleteZone,
  generateSeats,
  getZoneSeats
} from '../controllers/venue.controller.js';
import { authenticate } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

/**
 * Venue Routes
 * Base path: /api/venues
 */

// Public routes
router.get('/', getVenues);
router.get('/:id', getVenueById);
router.get('/:venueId/zones/:zoneId/seats', getZoneSeats);

// Admin routes
router.post('/', authenticate, isAdmin, createVenue);
router.put('/:id', authenticate, isAdmin, updateVenue);
router.delete('/:id', authenticate, isAdmin, deleteVenue);

// Zone management (Admin)
router.post('/:id/zones', authenticate, isAdmin, createZone);
router.put('/:venueId/zones/:zoneId', authenticate, isAdmin, updateZone);
router.delete('/:venueId/zones/:zoneId', authenticate, isAdmin, deleteZone);

// Seat generation (Admin)
router.post('/:venueId/zones/:zoneId/generate-seats', authenticate, isAdmin, generateSeats);

export default router;
