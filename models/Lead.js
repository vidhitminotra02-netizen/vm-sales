const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  company: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  interest: { type: String },
  message: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
