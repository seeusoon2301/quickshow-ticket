import mongoose from 'mongoose';

/**
 * TicketClass Model - Defines ticket pricing for a concert
 * E.g., Early Bird, VIP, Standard, etc.
 */
const ticketClassSchema = new mongoose.Schema({
  concert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Concert',
    required: true
  },
  zone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true // Early Bird, VIP, Standard, etc.
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quota: {
    type: Number,
    required: true,
    min: 0 // Total tickets available for this class
  },
  sold_qty: {
    type: Number,
    default: 0,
    min: 0
  },
  open_time: {
    type: Date // When tickets become available for sale
  },
  close_time: {
    type: Date // When ticket sales end
  },
  description: String,
  benefits: [String] // VIP lounge access, Meet & greet, etc.
}, { timestamps: true });

// Index
ticketClassSchema.index({ concert: 1, zone: 1 });
ticketClassSchema.index({ concert: 1, name: 1 });

// Virtual: available quantity
ticketClassSchema.virtual('available_qty').get(function() {
  return this.quota - this.sold_qty;
});

// Enable virtuals
ticketClassSchema.set('toJSON', { virtuals: true });
ticketClassSchema.set('toObject', { virtuals: true });

// Check if tickets are available
ticketClassSchema.methods.isAvailable = function(quantity = 1) {
  return this.available_qty >= quantity;
};

// Check if sales are open
ticketClassSchema.methods.isSalesOpen = function() {
  const now = new Date();
  if (this.open_time && now < this.open_time) return false;
  if (this.close_time && now > this.close_time) return false;
  return true;
};

const TicketClass = mongoose.model('TicketClass', ticketClassSchema);
export default TicketClass;
