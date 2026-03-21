const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., 'Batch sync completed', 'New User Registration'
  details: { type: String },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  timeAgo: { type: String } // Storing a friendly string for simplicity in this demo, usually you'd calculate this on the frontend from timestamps
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);