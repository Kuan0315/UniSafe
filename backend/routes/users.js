import express from 'express';
import {
  testConnection,
  getAllUsers,
  getUserById,
  createUser,
  updateUserLocation,
  getUsersWithLocations,
  getNearbyUsers,
  deleteUser,
  addTestData
} from '../controllers/userController.js';

const router = express.Router();

// Test routes
router.get('/test-connection', testConnection);
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id/location', updateUserLocation);
router.get('/users-with-locations', getUsersWithLocations);
router.get('/nearby-users', getNearbyUsers);
router.delete('/users/:id', deleteUser);
router.post('/test-data', addTestData);

export default router;