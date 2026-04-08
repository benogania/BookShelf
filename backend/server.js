const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path'); 

require('dotenv').config();

// --- NEW: Import the System Models ---
const SystemStat = require('./models/SystemStat');
const SystemLog = require('./models/SystemLog');

const app = express();

app.use(cors({
  origin: '*', 
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    res.set('Access-Control-Allow-Origin', '*'); 
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
    res.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range');
  }
}));

// --- NEW: Global API Request Counter Middleware ---
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await SystemStat.findOneAndUpdate(
        {}, 
        { $inc: { totalApiRequests: 1 } }, 
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("Stat tracking error:", err);
    }
  }
  next(); 
});

// Routes
app.use('/api/books', require('./routes/books'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/users'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/user-notifications', require('./routes/userNotifications'));
app.use('/api/annotations', require('./routes/annotations'));

// --- NEW: System Route for the Dashboard ---
app.use('/api/system', require('./routes/system'));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected');
    
    // --- NEW: Log Server Startup Event ---
    try {
      await SystemLog.create({
        title: 'System Initialized',
        description: 'All services running perfectly. Database connected.',
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to log startup:", err);
    }

    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));
  })
  .catch(err => console.error(err));