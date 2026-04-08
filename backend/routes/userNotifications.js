const express = require('express');
const router = express.Router();
const UserNotification = require('../models/UserNotification');
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// --- ADMIN: Broadcast System Notification to ALL users ---
router.post('/broadcast', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const users = await User.find({});
    
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      message,
      type: type || 'info'
    }));

    if (notifications.length > 0) {
      await UserNotification.insertMany(notifications);
    }
    
    res.status(200).json({ message: 'Success', deliveredCount: notifications.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER: Get unread count ---
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const count = await UserNotification.countDocuments({ userId: extractedId, isRead: false });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER: Get all notifications ---
router.get('/my-notifications', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const notifications = await UserNotification.find({ userId: extractedId }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER: Mark a specific notification as read ---
router.put('/mark-read/:id', verifyToken, async (req, res) => {
  try {
    await UserNotification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER: Mark ALL notifications as read ---
router.put('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    await UserNotification.updateMany({ userId: extractedId, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;