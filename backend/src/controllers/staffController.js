// controllers/staffController.js
const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");

// Get staff profile
exports.getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user.id).select("-password");
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff profile", error: err.message });
  }
};

// Update staff profile
exports.updateStaffProfile = async (req, res) => {
  try {
    const { name, department, role, shift, badge } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (department) updateData.department = department;
    if (role) updateData.role = role;
    if (shift) updateData.shift = shift;
    if (badge) updateData.badge = badge;

    const staff = await Staff.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error updating staff profile", error: err.message });
  }
};

// Update staff avatar
exports.updateStaffAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    const staff = await Staff.findByIdAndUpdate(
      req.user.id,
      { avatar },
      { new: true }
    ).select("-password");

    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error updating avatar", error: err.message });
  }
};

// Get all staff members (for admin)
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find().select("-password");
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: "Error fetching staff", error: err.message });
  }
};