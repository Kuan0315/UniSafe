// backend/models/SafetyAlert.js
const mongoose = require("mongoose");

const safetyAlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ["critical", "warning", "info"], 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ["high", "medium", "low"], 
    required: true 
  },
  category: { type: String, required: true },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Staff", 
    required: true 
  },
  expiresAt: Date,
  timeLimit: Number,
  scheduledAt: Date,
  isActive: { type: Boolean, default: true },
  isAutoDeactivated: { type: Boolean, default: false },
  isScheduled: { type: Boolean, default: false },
  sendPushNotification: { type: Boolean, default: true },
  sendEmail: { type: Boolean, default: false },
  sendSMS: { type: Boolean, default: false },
  recipients: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receivedAt: Date,
    readAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model("SafetyAlert", safetyAlertSchema);