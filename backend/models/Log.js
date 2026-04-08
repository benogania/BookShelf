const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  action: { type: String, required: true }, // e.g., "DOWNLOAD"
  details: { type: String, required: true }, // e.g., "Downloaded: Mathematics for Game Programming"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Log', logSchema);