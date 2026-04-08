const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  
  // The exact text the user highlighted
  highlightedText: { type: String, required: true },
  
  // The user's personal note/comment on that highlight
  comment: { type: String, default: '' },
  
  // The exact location on the page (provided by the PDF reader)
  position: { type: Object, required: true }, 
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Annotation', annotationSchema);