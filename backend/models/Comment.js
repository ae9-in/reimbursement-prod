const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  claim_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Claim', required: true },
  author_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', CommentSchema);
