import mongoose from 'mongoose';

/**
 * Seat Model - Physical seats within a zone
 */
const seatSchema = new mongoose.Schema({
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
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
  type: {
    type: String,
    enum: ['NORMAL', 'VIP', 'WHEELCHAIR', 'RESTRICTED'],
    default: 'NORMAL'
  }
}, { timestamps: true });

// Compound unique index: each seat is unique within a zone
seatSchema.index({ zone: 1, row: 1, number: 1 }, { unique: true });

// Virtual for display label
seatSchema.virtual('label').get(function() {
  return `${this.row}${this.number}`;
});

// Enable virtuals in JSON
seatSchema.set('toJSON', { virtuals: true });
seatSchema.set('toObject', { virtuals: true });

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
