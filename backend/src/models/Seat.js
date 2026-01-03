import mongoose from 'mongoose';

/**
 * Seat Model - Physical seats within a VENUE
 * This is the seat layout template for the venue.
 * Seats are assigned to TicketClasses per event via ShowSeat.
 */
const seatSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  row: {
    type: String,
    required: true,
    trim: true // A, B, C, etc.
  },
  number: {
    type: Number,
    required: true,
    min: 1
  },
  label: {
    type: String, // Custom label like "A1", "VIP-1", etc.
    trim: true
  },
  seatType: {
    type: String,
    enum: ['NORMAL', 'WHEELCHAIR', 'RESTRICTED'],
    default: 'NORMAL' // Physical seat type (accessibility, etc.)
  },
  isActive: {
    type: Boolean,
    default: true // Can be deactivated for maintenance
  },
  // Visual position on canvas (in pixels)
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
  rotation: { type: Number, default: 0 } // Rotation angle in degrees
}, { timestamps: true });

// Compound unique index: each seat is unique within a venue
seatSchema.index({ venue: 1, row: 1, number: 1 }, { unique: true });
seatSchema.index({ venue: 1 }); // For fetching all seats of a venue

// Enable virtuals in JSON
seatSchema.set('toJSON', { virtuals: true });
seatSchema.set('toObject', { virtuals: true });

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
