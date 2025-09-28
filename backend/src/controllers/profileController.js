// backend/controllers/profileController.js
const User = require("../models/User");
const TrustedContact = require("../models/TrustedContact");

// Get user profile with trusted contacts
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get trusted contacts
    const trustedContacts = await TrustedContact.find({ userId: req.user.id });
    
    res.json({ user, trustedContacts });
  } catch (err) {
    res.status(500).json({ message: "Error fetching profile", error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, studentId, anonymousMode, notificationsEnabled, locationSharing, ttsEnabled, autoCaptureSOS, alarmType } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (studentId !== undefined) updateData.studentId = studentId;
    if (anonymousMode !== undefined) updateData.anonymousMode = anonymousMode;
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    if (locationSharing !== undefined) updateData.locationSharing = locationSharing;
    if (ttsEnabled !== undefined) updateData.ttsEnabled = ttsEnabled;
    if (autoCaptureSOS !== undefined) updateData.autoCaptureSOS = autoCaptureSOS;
    if (alarmType) updateData.alarmType = alarmType;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

// Update avatar
exports.updateAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select("-password");
    
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error updating avatar", error: err.message });
  }
};

// Add trusted contact
exports.addTrustedContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    
    const contact = new TrustedContact({
      userId: req.user.id,
      name,
      phone,
      relationship
    });
    
    await contact.save();
    res.status(201).json({ contact });
  } catch (err) {
    res.status(500).json({ message: "Error adding trusted contact", error: err.message });
  }
};

// Remove trusted contact
exports.removeTrustedContact = async (req, res) => {
  try {
    const { id } = req.params;
    
    const contact = await TrustedContact.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });
    
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    
    res.json({ message: "Contact removed successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error removing contact", error: err.message });
  }
};