const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

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
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();
    res.json({ message: 'Profile updated successfully', username: user.username });
    
  } catch (error) {
    // Handle MongoDB duplicate key error for usernames
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;