const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { verifyToken } = require('../middleware/auth');

// Get notes for a specific book
router.get('/:bookId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const note = await Note.findOne({ userId, bookId: req.params.bookId });
    res.json(note || { content: '' });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notes' });
  }
});

// Save/Update notes
router.post('/:bookId', verifyToken, async (req, res) => {
  try {
    const userId = req.userId || req.user?.id;
    const { content } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { userId, bookId: req.params.bookId },
      { content, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Error saving notes' });
  }
});

module.exports = router;