const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET all logs with Pagination and Filter
router.get('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Show 10 logs per page
    const type = req.query.type || '';

    let query = {};
    if (type && type !== 'all') {
      query.type = type;
    }

    const total = await Log.countDocuments(query);
    const logs = await Log.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      data: logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching logs' });
  }
});

// POST a new log (Useful for tracking downloads later)
router.post('/', verifyToken, async (req, res) => {
  try {
    const newLog = new Log(req.body);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;