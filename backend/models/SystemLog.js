const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
 
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SystemLog', systemLogSchema);