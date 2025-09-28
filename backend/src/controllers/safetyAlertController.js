// controllers/safetyAlertController.js
const SafetyAlert = require("../models/SafetyAlert");
const User = require("../models/User");
const Staff = require("../models/Staff");

// Get all safety alerts
exports.getSafetyAlerts = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, priority, active } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (type && type !== "all") query.type = type;
    if (priority && priority !== "all") query.priority = priority;
    if (active !== undefined) query.isActive = active === "true";

    const alerts = await SafetyAlert.find(query)
      .populate("createdBy", "name email department role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SafetyAlert.countDocuments(query);

    res.json({
      alerts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching safety alerts", error: err.message });
  }
};

// Create a new safety alert
exports.createSafetyAlert = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority,
      category,
      expiresAt,
      timeLimit,
      scheduledAt,
      isScheduled,
      sendPushNotification,
      sendEmail,
      sendSMS
    } = req.body;

    // Validate required fields
    if (!title || !message || !type || !priority || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const alertData = {
      title,
      message,
      type,
      priority,
      category,
      createdBy: req.user.id,
      sendPushNotification: sendPushNotification !== undefined ? sendPushNotification : true,
      sendEmail: sendEmail !== undefined ? sendEmail : false,
      sendSMS: sendSMS !== undefined ? sendSMS : false
    };

    // Handle expiration
    if (timeLimit) {
      alertData.timeLimit = timeLimit;
      alertData.expiresAt = new Date(Date.now() + timeLimit * 60 * 60 * 1000);
      alertData.isAutoDeactivated = true;
    } else if (expiresAt) {
      alertData.expiresAt = new Date(expiresAt);
      alertData.isAutoDeactivated = true;
    }

    // Handle scheduling
    if (isScheduled && scheduledAt) {
      alertData.scheduledAt = new Date(scheduledAt);
      alertData.isScheduled = true;
      alertData.isActive = false; // Scheduled alerts are not active until their time
    }

    const safetyAlert = new SafetyAlert(alertData);
    await safetyAlert.save();

    // Populate createdBy for response
    await safetyAlert.populate("createdBy", "name email department role");

    // If not scheduled, send immediately
    if (!isScheduled) {
      // In a real implementation, you would send notifications here
      // For now, we'll just mark it as sent
      console.log(`Sending alert: ${title}`);
    }

    res.status(201).json(safetyAlert);
  } catch (err) {
    res.status(500).json({ message: "Error creating safety alert", error: err.message });
  }
};

// Update a safety alert
exports.updateSafetyAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const safetyAlert = await SafetyAlert.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate("createdBy", "name email department role");

    if (!safetyAlert) {
      return res.status(404).json({ message: "Safety alert not found" });
    }

    res.json(safetyAlert);
  } catch (err) {
    res.status(500).json({ message: "Error updating safety alert", error: err.message });
  }
};

// Delete a safety alert
exports.deleteSafetyAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const safetyAlert = await SafetyAlert.findByIdAndDelete(id);

    if (!safetyAlert) {
      return res.status(404).json({ message: "Safety alert not found" });
    }

    res.json({ message: "Safety alert deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting safety alert", error: err.message });
  }
};

// Toggle alert status
exports.toggleAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const safetyAlert = await SafetyAlert.findById(id);
    if (!safetyAlert) {
      return res.status(404).json({ message: "Safety alert not found" });
    }

    safetyAlert.isActive = !safetyAlert.isActive;
    await safetyAlert.save();

    res.json(safetyAlert);
  } catch (err) {
    res.status(500).json({ message: "Error toggling alert status", error: err.message });
  }
};

// Get alert statistics
exports.getAlertStats = async (req, res) => {
  try {
    const total = await SafetyAlert.countDocuments();
    const active = await SafetyAlert.countDocuments({ isActive: true });
    const highPriority = await SafetyAlert.countDocuments({ priority: "high" });
    const expired = await SafetyAlert.countDocuments({ 
      expiresAt: { $lt: new Date() } 
    });

    res.json({
      total,
      active,
      highPriority,
      expired
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching alert stats", error: err.message });
  }
};