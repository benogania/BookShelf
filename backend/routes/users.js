const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken, isAdmin } = require('../middleware/auth');
const bcrypt = require('bcryptjs');


// PUT update logged-in user's profile (Username / Password)
router.put('/profile', verifyToken, async (req, res) => {
  try {
    console.log("\n======================================");
    console.log("🛠️ STARTING PROFILE UPDATE");
    console.log("1. Incoming Data from Frontend/Postman:", req.body);
    
    const userId = req.userId || (req.user && (req.user.id || req.user._id));
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Explicitly grab the password
    const incomingPassword = req.body.password || req.body.newPassword; 
    console.log("2. Password extracted by backend:", incomingPassword ? "[HIDDEN - RECEIVED]" : "EMPTY/NULL");

    let updates = {};

    // Check Username
    if (req.body.username && req.body.username.trim() !== '' && req.body.username !== user.username) {
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }
      updates.username = req.body.username;
      console.log("3. Username update queued:", updates.username);
    }

    // Check Password
    if (incomingPassword && incomingPassword.trim() !== '') {
      console.log("4. Hashing new password...");
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(incomingPassword, salt);
      console.log("5. New hash generated successfully!");
    } else {
      console.log("4. SKIPPED password hashing because incomingPassword was empty.");
    }

    console.log("6. Final Update Object sending to DB:", Object.keys(updates));

    if (Object.keys(updates).length > 0) {
      // Forcefully update the database, bypassing all model restrictions
      const dbResult = await User.updateOne({ _id: userId }, { $set: updates });
      console.log("7. Database Update Result:", dbResult);
      
      return res.json({ 
        message: 'Profile updated successfully!', 
        username: updates.username || user.username 
      });

    } else {
      console.log("❌ ERROR: No changes were queued.");
      return res.status(400).json({ message: 'No changes were detected.' });
    }

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});


// GET all users (Admin only) with Search, Filter, and Sort
router.get('/', [verifyToken, isAdmin], async (req, res) => {
  console.log('This all the users')
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