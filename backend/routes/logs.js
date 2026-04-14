const express = require("express");
const router = express.Router();
const Log = require("../models/Log");
const Book = require("../models/Book");
const { verifyToken, isAdmin } = require("../middleware/auth");

router.post("/download/:bookId", verifyToken, async (req, res) => {
  try {
    const userId = req.userId || (req.user && (req.user.id || req.user._id));
    const book = await Book.findById(req.params.bookId);

    if (!book) return res.status(404).json({ message: "Book not found" });

    const newLog = new Log({
      user: userId,
      book: book._id,
      action: "DOWNLOAD",
      details: `Downloaded book: ${book.title}`,
    });

    await newLog.save();
    res.status(201).json({ message: "Download logged successfully" });
  } catch (error) {
    console.error("Logging error:", error);
    res.status(500).json({ message: "Server error logging download" });
  }
});

router.get("/", [verifyToken, isAdmin], async (req, res) => {
  try {
    const logs = await Log.find()
      .populate("user", "username email")
      .populate("book", "title format")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    console.error("Fetch logs error:", error);
    res.status(500).json({ message: "Server error fetching logs" });
  }
});

const User = require("../models/User"); 

router.get("/stats", [verifyToken, isAdmin], async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalDownloads = await Log.countDocuments({ action: "DOWNLOAD" });

    res.json({
      totalBooks,
      totalUsers,
      totalDownloads,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    res.status(500).json({ message: "Server error fetching stats" });
  }
});

module.exports = router;
