const Comment = require('../models/Comment');

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ claim_id: req.params.claimId }).sort({ created_at: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const newComment = new Comment({
      ...req.body,
      author_id: req.user.id
    });
    await newComment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
