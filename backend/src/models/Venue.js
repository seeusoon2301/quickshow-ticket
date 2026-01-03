import mongoose from 'mongoose';

/**
 * Venue Model - Represents event locations
 */
const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    trim: true
  },
  total_capacity: {
    type: Number,
    required: true,
    min: 1
  },
  map_image: {
    type: String // URL to venue seating map image
  },
  google_maps_url: String
}, { timestamps: true });

venueSchema.index({ name: 'text', address: 'text' });
venueSchema.index({ city: 1 });

const Venue = mongoose.model('Venue', venueSchema);
export default Venue;
