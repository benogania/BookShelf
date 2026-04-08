const express = require('express');
const router = express.Router();
const BookRequest = require('../models/BookRequest');
const Book = require('../models/Book');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { verifyToken, isAdmin } = require('../middleware/auth');

// POST: User requests an archived book
router.post('/', verifyToken, async (req, res) => {
  try {
    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;
    const { bookId, bookTitle } = req.body;

    // 1. Check if they already requested it
    const existing = await BookRequest.findOne({ userId: extractedId, bookId, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'Request already pending' });

    const user = await User.findById(extractedId);

    // 2. Save the request
    const newReq = await BookRequest.create({
      userId: extractedId,
      userName: user ? (user.name || user.username || 'Unknown User') : 'Unknown User',
      bookId,
      bookTitle
    });

    // 3. Trigger a notification for the Admin!
    await Notification.create({
      message: `${newReq.userName} requested access to: ${bookTitle}`,
      type: 'message' 
    });

    res.status(201).json(newReq);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET: Admin fetches all requests
router.get('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const requests = await BookRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Admin APPROVES a request
router.put('/:id/approve', [verifyToken, isAdmin], async (req, res) => {
  try {
    const request = await BookRequest.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    
    // THE MAGIC: "Renew" the book by setting its creation date to right now!
    // This removes it from the 5-year archive and puts it back in the main store.
    await Book.findByIdAndUpdate(request.bookId, { createdAt: Date.now() });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT: Admin REJECTS a request
router.put('/:id/reject', [verifyToken, isAdmin], async (req, res) => {
  try {
    const request = await BookRequest.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;