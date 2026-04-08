const express = require('express');
const router = express.Router();
const Annotation = require('../models/Annotation');
const { verifyToken } = require('../middleware/auth');

// POST: Save a new highlight/comment
router.post('/', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const { bookId, highlightedText, comment, position } = req.body;

    const newAnnotation = await Annotation.create({
      userId: extractedId,
      bookId,
      highlightedText,
      comment,
      position
    });

    res.status(201).json(newAnnotation);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save annotation' });
  }
});

// GET: Fetch all highlights for a specific book for the logged-in user
router.get('/:bookId', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const annotations = await Annotation.find({ 
      userId: extractedId, 
      bookId: req.params.bookId 
    });
    
    res.json(annotations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch annotations' });
  }
});

// DELETE: Remove a highlight
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    await Annotation.findOneAndDelete({ _id: req.params.id, userId: extractedId });
    res.json({ message: 'Annotation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete annotation' });
  }
});

module.exports = router;