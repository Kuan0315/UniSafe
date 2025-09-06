import User from '../models/User.js';
import { sequelize } from '../config/database.js';
import { Op } from 'sequelize';


// Get user profile
export const getProfile = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                createdAt: req.user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all users (admin only)
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { username, email },
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Test connection
export const testConnection = async (req, res) => {
  try {
    const count = await User.count();
    res.json({ success: true, message: "DB connected", totalUsers: count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'role', 'isActive', 'lastSeen', 'createdAt']
    });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt
      })),
      total: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        lastSeen: user.lastSeen,
        location: user.location,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new user (for testing)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const user = await User.create({
      name,
      email,
      password, // Will be automatically hashed by the model hook
      phone,
      role: role || 'student'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        error: 'Email already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update user location
export const updateUserLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. lat and lng must be numbers.'
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.update({
      location: sequelize.literal(`ST_GeomFromText('POINT(${lng} ${lat})')`),
      lastSeen: new Date()
    });

    res.json({
      success: true,
      message: 'Location updated successfully',
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get users with locations
export const getUsersWithLocations = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        location: { [Op.ne]: null }
      },
      attributes: [
        'id',
        'name',
        'email',
        'role',
        'location',
        'lastSeen',
        [
          sequelize.literal('ST_AsText(location)'),
          'locationText'
        ]
      ]
    });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        lastSeen: user.lastSeen,
        locationText: user.get('locationText')
      })),
      total: users.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Find nearby users within radius
export const getNearbyUsers = async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const nearbyUsers = await User.findNearbyUsers(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius),
      req.user?.id // Exclude current user if authenticated
    );

    res.json({
      success: true,
      nearbyUsers: nearbyUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        location: user.location,
        lastSeen: user.lastSeen,
        distance: user.get('distance')
      })),
      total: nearbyUsers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete user (for testing cleanup)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.destroy();
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Add sample test data
export const addTestData = async (req, res) => {
  try {
    const testUsers = [
      {
        name: 'Test Student',
        email: 'student@example.com',
        password: 'password123',
        phone: '+60123456789',
        role: 'student',
        location: sequelize.literal("ST_GeomFromText('POINT(101.6869 3.1390)')"),
        lastSeen: new Date()
      },
      {
        name: 'Test Staff',
        email: 'staff@example.com',
        password: 'password123',
        phone: '+60198765432',
        role: 'staff',
        location: sequelize.literal("ST_GeomFromText('POINT(101.6870 3.1391)')"),
        lastSeen: new Date()
      },
      {
        name: 'Test Security',
        email: 'security@example.com',
        password: 'password123',
        phone: '+60111223344',
        role: 'security',
        location: sequelize.literal("ST_GeomFromText('POINT(101.6868 3.1392)')"),
        lastSeen: new Date()
      }
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await User.create(userData);
      createdUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }

    res.status(201).json({
      success: true,
      message: 'Test data added successfully',
      users: createdUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};