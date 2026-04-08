const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  sender: { type: String, enum: ['user', 'admin'], required: true },
  text: { type: String },
  fileUrl: { type: String },
  fileName: { type: String },
  isRead: { type: Boolean, default: false },
  
  // --- BOOK REQUEST FIELDS ---
  isBookRequest: { type: Boolean, default: false },
  requestedBookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  requestStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  // ---------------------------

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);