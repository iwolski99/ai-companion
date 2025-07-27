const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  personality: { type: String, default: 'sweet' },
  companionGender: { type: String, default: 'female' },
  attraction: {
    level: { type: String, default: 'neutral' },
    points: { type: Number, default: 0 },
    nextLevel: { type: Number, default: 10 }
  },
  chatHistory: [{
    role: String,
    parts: [{ text: String }],
    timestamp: { type: Date, default: Date.now }
  }],
  profilePictureURL: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);