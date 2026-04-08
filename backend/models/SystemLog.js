const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  // 'info' = blue, 'success' = green, 'warning' = yellow, 'error' = red
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);