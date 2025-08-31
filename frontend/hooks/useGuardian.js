import { useState, useEffect, useCallback } from 'react';
import { 
  initSocketConnection, 
  createTrip, 
  getActiveTrip, 
  updateTripProgress, 
  completeTrip, 
  respondToCheckin, 
  sendLocationUpdate, 
  setupCheckinListener,
  disconnectSocket 
} from '../services/guardianService';

export const useGuardian = () => {
  const [currentTrip, setCurrentTrip] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [checkinReminder, setCheckinReminder] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const socket = initSocketConnection(token);
      
      socket.on('connect', () => {
        setSocketConnected(true);
        console.log('Socket connected');
      });

      socket.on('disconnect', () => {
        setSocketConnected(false);
        console.log('Socket disconnected');
      });

      // Set up check-in reminder listener
      setupCheckinListener((data) => {
        setCheckinReminder(data);
      });

      return () => {
        disconnectSocket();
      };
    }
  }, []);

  // Start a new trip
  const startTrip = useCallback(async (tripData) => {
    const result = await createTrip(tripData);
    if (result.success) {
      setCurrentTrip(result.trip);
    }
    return result;
  }, []);

  // Load active trip
  const loadActiveTrip = useCallback(async () => {
    const result = await getActiveTrip();
    if (result.success) {
      setCurrentTrip(result.trip);
    }
    return result;
  }, []);

  // Update progress
  const updateProgress = useCallback(async (progress) => {
    const result = await updateTripProgress(progress);
    if (result.success && result.trip) {
      setCurrentTrip(result.trip);
    }
    return result;
  }, []);

  // End trip
  const endTrip = useCallback(async () => {
    const result = await completeTrip();
    if (result.success) {
      setCurrentTrip(null);
    }
    return result;
  }, []);

  // Respond to check-in
  const respondToCheckinReminder = useCallback(async (checkinId, isSafe, message) => {
    const result = await respondToCheckin(checkinId, isSafe, message);
    if (result.success) {
      setCheckinReminder(null);
    }
    return result;
  }, []);

  // Send location update
  const sendLocation = useCallback((coordinates, address = '') => {
    if (currentTrip) {
      return sendLocationUpdate(currentTrip._id, coordinates, address);
    }
    return false;
  }, [currentTrip]);

  return {
    currentTrip,
    socketConnected,
    checkinReminder,
    startTrip,
    loadActiveTrip,
    updateProgress,
    endTrip,
    respondToCheckinReminder,
    sendLocation
  };
};