const mongoose = require('mongoose');

const systemStatSchema = new mongoose.Schema({
  // A single document will hold the grand total
  totalApiRequests: { type: Number, default: 0 }
});

module.exports = mongoose.model('SystemStat', systemStatSchema);