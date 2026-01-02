import mongoose from 'mongoose';

/**
 * Artist Model - Performers/bands
 */
const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 2000
  },
  genre: {
    type: String,
    trim: true // Pop, Rock, Jazz, etc.
  },
  image: {
    type: String // URL to artist image
  },
  country: {
    type: String,
    trim: true
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    youtube: String,
    spotify: String
  }
}, { timestamps: true });

artistSchema.index({ name: 'text' });
artistSchema.index({ genre: 1 });

const Artist = mongoose.model('Artist', artistSchema);
export default Artist;
