const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const User = require('../models/User');
const Log = require('../models/Log');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/stats', [verifyToken, isAdmin], async (req, res) => {
  try {
    // Run queries in parallel for better performance
    const [totalBooks, activeUsers, recentBooks, logs] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(), // You could add a filter here for recently active
      Book.find().sort({ createdAt: -1 }).limit(4),
      Log.find().sort({ createdAt: -1 }).limit(4)
    ]);

    // In a real production app, Downloads and API Requests would be tracked in their own DB collections.
    // For this implementation, we will return structural data ready to be replaced by actual metrics.
    res.json({
      stats: {
        totalBooks,
        activeUsers,
        totalDownloads: 14320, // Replace with actual Download.countDocuments() when implemented
        apiRequests: '45.2K'   // Replace with actual API tracking middleware counts
      },
      recentBooks,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

module.exports = router;