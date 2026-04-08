const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  bookTitle: { type: String, required: true },
  
  // --- NEW USER FIELDS ---
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  
  downloadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DownloadLog', downloadLogSchema);