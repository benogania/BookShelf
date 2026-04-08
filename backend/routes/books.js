const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET random available books for the user storefront
router.get('/random', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    // MongoDB's aggregate $sample pulls a truly random set of documents
    const books = await Book.aggregate([
      { $match: { isActive: { $ne: false } } }, // Only get available books
      { $sample: { size: limit } }              // Randomly pick up to 'limit'
    ]);

    res.json({ data: books });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching random books' });
  }
});

// GET all books with Pagination, Search, and Filters
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || ''; // <-- New Status param

    let query = {};
    
    // 1. Search Logic
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 2. Category Filter Logic
    if (category) {
      query.genre = { $regex: new RegExp(`^${category}$`, 'i') }; 
    }

    // 3. Status Filter Logic (Visibility)
    if (status === 'available') {
      query.isActive = { $ne: false }; // Matches true OR undefined (for older records)
    } else if (status === 'hidden') {
      query.isActive = false; // Strictly matches false
    }

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      data: books,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET all unique genres (Add this BEFORE router.get('/:id'))
router.get('/genres', verifyToken, async (req, res) => {
  try {
    // MongoDB's 'distinct' grabs all unique values from the genre array across all books
    const genres = await Book.distinct('genre');
    // Filter out any empty strings or nulls just to be clean
    res.json(genres.filter(g => g));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST multiple books (Bulk Insert - Admin Only)
router.post('/bulk', [verifyToken, isAdmin], async (req, res) => {
  try {
    const booksArray = req.body;
    
    if (!Array.isArray(booksArray)) {
      return res.status(400).json({ message: 'Input must be a JSON array [...]' });
    }

    // Process genres for each book just like we do for single entries
    const sanitizedBooks = booksArray.map(book => ({
      ...book,
      genre: Array.isArray(book.genre) 
        ? book.genre 
        : (typeof book.genre === 'string' ? book.genre.split(',').map(g => g.trim()).filter(Boolean) : [])
    }));

    // Insert all books at once using Mongoose's insertMany
    const insertedBooks = await Book.insertMany(sanitizedBooks);
    res.status(201).json({ 
      message: `Successfully added ${insertedBooks.length} books.`, 
      count: insertedBooks.length 
    });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Failed to bulk insert books.' });
  }
});

// POST new book (Admin Only)
router.post('/', [verifyToken, isAdmin], async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT update book (Admin Only)
router.put('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updatedBook) return res.status(404).json({ message: 'Book not found' });
    res.json(updatedBook);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE book (Admin Only)
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Implement PUT and DELETE similarly using [verifyToken, isAdmin]...
module.exports = router;