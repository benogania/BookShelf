const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publisher: String,
  publish_date: String,
  genre: { 
    type: [String], 
    default: [], 
    set: v => Array.isArray(v) ? v.map(str => str.trim()) : v 
  },
  format: { type: String, enum: ['PDF', 'EPUB', 'Audiobook'], default: 'PDF' },
  language: String,
  size: String,
  isbn: String,
  description: String,
  cover_image: String,
  download_link: String,
  
  // --- NEW FIELD ADDED HERE ---
  isActive: { type: Boolean, default: true } 
  
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);