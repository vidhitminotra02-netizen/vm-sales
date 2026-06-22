require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Lead = require('./models/Lead');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('No MONGO_URI provided. Skipping database connection (leads will only be logged).');
}

// Routes
app.post('/api/leads', async (req, res) => {
  try {
    const { firstName, lastName, company, email, phone, interest, message } = req.body;

    // Validate
    if (!firstName || !email) {
      return res.status(400).json({ error: 'First name and email are required.' });
    }

    // Save to database if configured
    if (mongoose.connection.readyState === 1) {
      const newLead = new Lead({
        firstName,
        lastName,
        company,
        email,
        phone,
        interest,
        message
      });
      await newLead.save();
      console.log('New lead saved to database:', newLead._id);
    } else {
      console.log('New lead received (not saved, DB disconnected):', req.body);
    }

    res.status(201).json({ message: 'Lead submitted successfully' });
  } catch (error) {
    console.error('Error handling lead submission:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
