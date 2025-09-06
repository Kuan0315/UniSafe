import express from 'express';
import { sequelize } from '../config/database.js';
import User from '../models/User.js';

const router = express.Router();

const PORT = process.env.PORT || 5000;
// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Yuyu2004@#',
  database: 'unisave_db'
};

// Test database connection
router.get('/test-db', async (req, res) => {
  try {
    // Test raw connection
    await sequelize.authenticate();
    
    // Test query
    const userCount = await User.count();
    
    res.json({
      success: true,
      message: 'Database connection successful! 🎉',
      database: sequelize.config.database,
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      database: sequelize.config.database
    });
  }
});

// Test data retrieval
router.get('/test-data', async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role'],
      limit: 5
    });

    res.json({
      success: true,
      users: users,
      total: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test create operation
router.post('/test-create', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const user = await User.create({
      name: name || 'Test User',
      email: email || 'test@example.com',
      password: password || 'test123',
      phone: phone || '+60123456789'
    });

    res.json({
      success: true,
      message: 'User created successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;