// backend/controllers/reportController.js
const Report = require("../models/Report");
const Comment = require("../models/Comment");
const User = require("../models/User");

// Get all reports with filtering and sorting
exports.getReports = async (req, res) => {
  try {
    const { search, type, sortBy } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    // Filter by type
    if (type && type !== "all") {
      query.type = type;
    }
    
    // Search in title, description, or location
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    // Determine sort order
    let sort = {};
    switch (sortBy) {
      case "latest":
        sort = { createdAt: -1 };
        break;
      case "hottest":
        sort = { upvoteCount: -1, createdAt: -1 };
        break;
      case "nearest":
        // For nearest, you would need geospatial data
        // This is a placeholder implementation
        sort = { createdAt: -1 };
        break;
      case "most_commented":
        sort = { commentCount: -1, createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    // Get reports with populated author info
    const reports = await Report.find(query)
      .populate("author", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Check if current user has upvoted each report
    const reportsWithUserStatus = reports.map(report => {
      const isUpvoted = report.upvotes && report.upvotes.some(
        upvote => upvote._id && upvote._id.toString() === req.user.id
      );
      
      return {
        ...report,
        isUpvoted: !!isUpvoted,
        upvotes: undefined // Remove the upvotes array to reduce payload size
      };
    });

    // Get total count for pagination
    const total = await Report.countDocuments(query);

    res.json({
      reports: reportsWithUserStatus,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching reports", error: err.message });
  }
};

// Create a new report
exports.createReport = async (req, res) => {
  try {
    const { type, title, description, location, anonymous, media } = req.body;

    const report = new Report({
      type,
      title,
      description,
      location,
      author: req.user.id,
      anonymous,
      media: media || []
    });

    await report.save();
    
    // Populate author info for response
    await report.populate("author", "name avatar");
    
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: "Error creating report", error: err.message });
  }
};

// Get a single report with comments
exports.getReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id)
      .populate("author", "name avatar")
      .populate({
        path: "comments",
        populate: [
          {
            path: "author",
            select: "name avatar"
          },
          {
            path: "replies",
            populate: {
              path: "author",
              select: "name avatar"
            }
          }
        ]
      });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    // Check if current user has upvoted
    const isUpvoted = report.upvotes.some(
      upvote => upvote.toString() === req.user.id
    );

    const reportObj = report.toObject();
    reportObj.isUpvoted = isUpvoted;
    delete reportObj.upvotes;

    res.json(reportObj);
  } catch (err) {
    res.status(500).json({ message: "Error fetching report", error: err.message });
  }
};

// Upvote a report
exports.upvoteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const userId = req.user.id;
    const isUpvoted = report.upvotes.includes(userId);

    if (isUpvoted) {
      // Remove upvote
      report.upvotes.pull(userId);
      report.upvoteCount -= 1;
    } else {
      // Add upvote
      report.upvotes.push(userId);
      report.upvoteCount += 1;
    }

    await report.save();
    res.json({ 
      upvoted: !isUpvoted, 
      upvoteCount: report.upvoteCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Error upvoting report", error: err.message });
  }
};

// Add a comment to a report
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, anonymous, parentCommentId } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const comment = new Comment({
      text,
      author: req.user.id,
      anonymous: anonymous || false,
      report: id,
      parentComment: parentCommentId || null
    });

    await comment.save();
    
    // Add comment to report
    report.comments.push(comment._id);
    report.commentCount += 1;
    await report.save();

    // If this is a reply, add it to the parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        parentComment.replies.push(comment._id);
        parentComment.replyCount += 1;
        await parentComment.save();
      }
    }

    // Populate author info for response
    await comment.populate("author", "name avatar");
    
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: "Error adding comment", error: err.message });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const userId = req.user.id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // Remove like
      comment.likes.pull(userId);
      comment.likeCount -= 1;
    } else {
      // Add like
      comment.likes.push(userId);
      comment.likeCount += 1;
    }

    await comment.save();
    res.json({ 
      liked: !isLiked, 
      likeCount: comment.likeCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Error liking comment", error: err.message });
  }
};

// Report a comment
exports.reportComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    comment.reported = true;
    comment.reportReason = reason || "";
    await comment.save();

    res.json({ message: "Comment reported successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error reporting comment", error: err.message });
  }
};

// Get comments for a report
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ report: id, parentComment: null })
      .populate("author", "name avatar")
      .populate({
        path: "replies",
        populate: {
          path: "author",
          select: "name avatar"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Check if current user has liked each comment
    const commentsWithUserStatus = comments.map(comment => {
      const isLiked = comment.likes && comment.likes.some(
        like => like.toString() === req.user.id
      );
      
      return {
        ...comment,
        isLiked: !!isLiked,
        likes: undefined // Remove the likes array to reduce payload size
      };
    });

    const total = await Comment.countDocuments({ report: id, parentComment: null });

    res.json({
      comments: commentsWithUserStatus,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching comments", error: err.message });
  }
};