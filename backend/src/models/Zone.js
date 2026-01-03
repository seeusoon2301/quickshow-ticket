import mongoose from 'mongoose';

/**
 * Zone Model - Represents seating zones within a venue
 * E.g., Zone A, Zone B, VIP Zone
 * All zones have individual numbered seats
 */
const zoneSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true // Zone A, VIP, etc.
  },
  price: {
    type: Number,
    default: 0 // Base price for this zone
  },
  color: {
    type: String, // Color for seat map display
    default: '#3B82F6'
  },
  // Position of zone on the canvas (for visual editor)
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  description: String
}, { timestamps: true });

zoneSchema.index({ venue: 1, name: 1 }, { unique: true });

const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
