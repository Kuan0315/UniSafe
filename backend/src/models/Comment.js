// backend/models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  anonymous: {
    type: Boolean,
    default: false
  },
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Report",
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment"
  }],
  replyCount: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model("Comment", commentSchema);