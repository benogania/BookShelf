const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const { verifyToken, isAdmin } = require("../middleware/auth");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const DownloadLog = require("../models/DownloadLog");
const User = require("../models/User");
const Notification = require("../models/Notification");
const axios = require("axios");

const dirs = ["./uploads/bookcovers", "./uploads/books"];
dirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover_image") cb(null, "./uploads/bookcovers");
    else if (file.fieldname === "book_file") cb(null, "./uploads/books");
  },
  filename: (req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "-");
    cb(null, `${Date.now()}-${cleanName}`);
  },
});


const upload = multer({ storage });

router.get("/read-pdf", async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).send("No URL provided");

    const response = await axios.get(url, { responseType: "stream" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Access-Control-Allow-Origin", "*");

    response.data.pipe(res);
  } catch (error) {
    console.error("PDF Proxy Error:", error.message);
    res.status(500).send("Failed to fetch PDF");
  }
});

router.get("/random", verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const books = await Book.aggregate([
      { $match: { isActive: { $ne: false } } },
      { $sample: { size: limit } },
    ]);

    res.json({ data: books });
  } catch (error) {
    res.status(500).json({ message: "Error fetching random books" });
  }
});


router.get("/admin/restricted", [verifyToken, isAdmin], async (req, res) => {
  try {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const books = await Book.find({
      $or: [{ createdAt: { $lt: fiveYearsAgo } }, { unrestricted: true }],
    }).sort({ createdAt: -1 });

    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.put(
  "/admin/restrict-toggle/:id",
  [verifyToken, isAdmin],
  async (req, res) => {
    try {
      const { action } = req.body; 
      let updateData = {};

      if (action === "restrict") {
        
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 6);
        updateData = { createdAt: pastDate, unrestricted: false };
      } else if (action === "unrestrict") {
        updateData = { createdAt: new Date(), unrestricted: true };
      }

      const updatedBook = await Book.findByIdAndUpdate(
        req.params.id,
        { $set: updateData },
        { new: true, timestamps: false, strict: false },
      );

      res.json(updatedBook);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

router.get("/categories", async (req, res) => {
  try {
    const categories = await Book.distinct("category");
    const cleanCategories = categories.filter(
      (cat) => cat && cat.trim() !== "",
    );
    res.json(cleanCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

router.post("/bulk", [verifyToken, isAdmin], async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res
        .status(400)
        .json({ message: "Payload must be a JSON array of books." });
    }

    const booksToInsert = req.body.map((book) => {
      if (typeof book.genre === "string") {
        book.genre = book.genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      }
      return book;
    });

    const insertedBooks = await Book.insertMany(booksToInsert);

    res.status(201).json({
      message: `${insertedBooks.length} books added successfully!`,
      data: insertedBooks,
    });
  } catch (error) {
    console.error("❌ BULK INSERT ERROR:", error.message);
    res.status(400).json({ message: error.message });
  }
});

router.post("/:id/log-download", verifyToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const extractedId = req.userId || req.user?.id || req.user?._id || req.user;

    if (!extractedId) {
      return res
        .status(400)
        .json({
          message: "Token verified, but no User ID was found inside it.",
        });
    }

    const user = await User.findById(extractedId);
    if (!user)
      return res.status(404).json({ message: "User not found in database" });

    const newLog = new DownloadLog({
      bookId: book._id,
      bookTitle: book.title,
      userId: user._id,
      userName: user.name || user.username || user.firstName || "Unknown User",
      userEmail: user.email || "No email provided",
    });

    await newLog.save();

    await Notification.create({
      message: `A user downloaded: ${book.title}`,
      type: "download",
    });

    res.status(200).json({ message: "Download logged successfully" });
  } catch (error) {
    console.error("❌ ERROR LOGGING DOWNLOAD:", error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get(
  "/logs/downloads/count",
  [verifyToken, isAdmin],
  async (req, res) => {
    try {
      const count = await DownloadLog.countDocuments();
      res.json({ totalDownloads: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch count" });
    }
  },
);

router.get("/logs/downloads", [verifyToken, isAdmin], async (req, res) => {
  try {
    const logs = await DownloadLog.find().sort({ downloadedAt: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch download logs" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }
    res.json(book);
  } catch (error) {
    console.error("Error fetching single book:", error);
    res.status(500).json({ message: "Invalid Book ID" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { search, category, status, age, page = 1, limit = 10 } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ];
    }

    if (category) query.category = category;
    if (status === "available") query.isActive = { $ne: false };
    else if (status === "hidden") query.isActive = false;

    if (age === "old") {
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

      query.createdAt = { $lt: fiveYearsAgo };
      query.unrestricted = { $ne: true };
    }

    const books = await Book.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Book.countDocuments(query);

    res.json({
      data: books,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalItems: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put(
  "/:id",
  [
    verifyToken,
    isAdmin,
    upload.fields([{ name: "cover_image" }, { name: "book_file" }]),
  ],
  async (req, res) => {
    try {
      let updateData = { ...req.body };

      if (req.files) {
        if (req.files.cover_image) {
          updateData.cover_image = `http://localhost:5000/uploads/bookcovers/${req.files.cover_image[0].filename}`;
        }
        if (req.files.book_file) {
          updateData.download_link = `http://localhost:5000/uploads/books/${req.files.book_file[0].filename}`;
        }
      }

      if (typeof updateData.genre === "string") {
        updateData.genre = updateData.genre
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean);
      }

      const updatedBook = await Book.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      );

      if (!updatedBook) {
        return res.status(404).json({ message: "Book not found" });
      }

      res.json(updatedBook);
    } catch (error) {
      console.error("Error updating book:", error);
      res.status(500).json({ message: error.message });
    }
  },
);

router.delete("/:id", [verifyToken, isAdmin], async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
