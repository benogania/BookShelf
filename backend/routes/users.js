const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');

// PUT /api/users/profile - Update own credentials
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    
    // req.userId comes from our verifyToken middleware
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update username if provided
    if (username) {
      user.username = username;
    }

    // Update and hash new password if provided
    if (newPassword) {
      const bcrypt = require('bcryptjs'); // Ensure bcrypt is imported at the top!
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', username: user.username });
    
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
});


// GET all users (Admin only) with Search, Filter, and Sort
router.get('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { search, role, sort } = req.query;
    let query = {};

    // 1. Search Logic (by username)
    if (search) {
      query.username = { $regex: search, $options: 'i' };
    }

    // 2. Role Filter Logic (Show Admins or Users)
    if (role && role !== 'all') {
      query.role = role;
    }

    // 3. Sorting Logic
    let sortOption = { createdAt: -1 }; // Default: Newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'name_asc') sortOption = { username: 1 };
    if (sort === 'name_desc') sortOption = { username: -1 };
    if (sort === 'last_active') sortOption = { lastActive: -1 };

    const users = await User.find(query).select('-password').sort(sortOption);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});


// PUT update a user's role (Admin only)
router.put('/:id/role', [verifyToken, isAdmin], async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided' });
    }

    // Prevent the admin from accidentally demoting themselves
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { role }, 
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// GET current user's saved library
router.get('/library', verifyToken, async (req, res) => {
  try {
    // Populate replaces the ObjectIds with the actual book data
    const user = await User.findById(req.userId).populate('savedBooks');
    res.json(user.savedBooks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching library' });
  }
});

// POST toggle a book in the user's library
router.post('/library/:bookId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const bookId = req.params.bookId;

    // Check if the book is already in the array
    const isSaved = user.savedBooks.includes(bookId);

    if (isSaved) {
      // Remove it
      user.savedBooks = user.savedBooks.filter(id => id.toString() !== bookId);
    } else {
      // Add it
      user.savedBooks.push(bookId);
    }

    await user.save();
    res.json({ message: isSaved ? 'Removed from library' : 'Added to library', savedBooks: user.savedBooks });
  } catch (error) {
    res.status(500).json({ message: 'Error updating library' });
  }
});

// DELETE a user (Admin only)
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    // Prevent the admin from deleting themselves
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user' });
  }
});

module.exports = router;