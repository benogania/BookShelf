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
      User.countDocuments(), 
      Book.find().sort({ createdAt: -1 }).limit(4),
      Log.find().sort({ createdAt: -1 }).limit(4)
    ]);


    res.json({
      stats: {
        totalBooks,
        activeUsers,
        totalDownloads: 14320, 
        apiRequests: '45.2K'   
      },
      recentBooks,
      logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

module.exports = router;