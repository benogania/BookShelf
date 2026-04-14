const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['registration', 'message', 'download', 'system'], 
    default: 'system' 
  },
  isRead: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: 4320000 
  }
});

module.exports = mongoose.model('Notification', notificationSchema);