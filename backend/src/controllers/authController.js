// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const Staff = require("../models/Staff");

const client = new OAuth2Client();

const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Signup
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = user.password && await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    if (role && user.role !== role) return res.status(403).json({ message: "Role mismatch" });

    res.json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Google login
exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        role: "student"
      });
    }

    res.json({ token: generateToken(user), user });
  } catch (err) {
    res.status(500).json({ message: "Google login failed", error: err.message });
  }
};

// Staff signup
exports.staffSignup = async (req, res) => {
  try {
    const { name, email, password, staffId, department, role, badge } = req.body;
    
    // Check if email already exists
    const existingEmail = await Staff.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Check if staff ID already exists
    const existingStaffId = await Staff.findOne({ staffId });
    if (existingStaffId) {
      return res.status(400).json({ message: "Staff ID already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const staff = await Staff.create({
      name,
      email,
      password: hashedPassword,
      staffId,
      department,
      role,
      badge
    });

    res.status(201).json({ 
      token: generateToken({ 
        id: staff._id, 
        email: staff.email, 
        role: "staff" 
      }), 
      user: staff 
    });
  } catch (err) {
    res.status(500).json({ message: "Staff signup failed", error: err.message });
  }
};

// Staff login
exports.staffLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = staff.password && await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    res.json({ 
      token: generateToken({ 
        id: staff._id, 
        email: staff.email, 
        role: "staff" 
      }), 
      user: staff 
    });
  } catch (err) {
    res.status(500).json({ message: "Staff login failed", error: err.message });
  }
};
