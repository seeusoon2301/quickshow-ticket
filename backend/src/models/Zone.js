import mongoose from 'mongoose';

/**
 * Zone Model - Represents seating zones within a venue
 * E.g., Zone A, Zone B, VIP Zone, Standing Zone
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
    trim: true // Zone A, VIP, Standing, etc.
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  color: {
    type: String, // Color for seat map display
    default: '#3B82F6'
  },
  description: String
}, { timestamps: true });

zoneSchema.index({ venue: 1, name: 1 }, { unique: true });

const Zone = mongoose.model('Zone', zoneSchema);
export default Zone;
