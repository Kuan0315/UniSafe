import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { useGuardianContext } from '../../contexts/GuardianContext';

const GuardianScreen = () => {
  const {
    currentTrip,
    socketConnected,
    checkinReminder,
    startTrip,
    loadActiveTrip,
    updateProgress,
    endTrip,
    respondToCheckinReminder,
    sendLocation
  } = useGuardianContext();

  const [tripProgress, setTripProgress] = useState(0);

  // Load active trip on mount
  useEffect(() => {
    loadActiveTrip();
  }, []);

  // Watch user location and send updates
  useEffect(() => {
    if (currentTrip && socketConnected) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          sendLocation({ lat: latitude, lng: longitude });
          
          // Simulate progress update (in real app, calculate based on route)
          const newProgress = Math.min(100, tripProgress + 5);
          setTripProgress(newProgress);
          updateProgress(newProgress);
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [currentTrip, socketConnected]);

  // Handle check-in reminders
  useEffect(() => {
    if (checkinReminder) {
      Alert.alert(
        'Safety Check-in',
        'Are you okay? Please confirm your safety.',
        [
          {
            text: 'I\'m Safe',
            onPress: () => respondToCheckinReminder(checkinReminder.checkinId, true, 'I am safe')
          },
          {
            text: 'I Need Help',
            style: 'destructive',
            onPress: () => respondToCheckinReminder(checkinReminder.checkinId, false, 'I need help')
          }
        ]
      );
    }
  }, [checkinReminder]);

  const handleStartTrip = async () => {
    const tripData = {
      destination: {
        name: 'University Library',
        coordinates: { lat: 3.1390, lng: 101.6869 } // Example coordinates
      },
      startLocation: {
        name: 'Student Dormitory',
        coordinates: { lat: 3.1400, lng: 101.6870 } // Example coordinates
      },
      eta: 15, // minutes
      checkInInterval: 5, // minutes
      trustedContacts: [] // Array of user IDs
    };

    const result = await startTrip(tripData);
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  const handleEndTrip = async () => {
    const result = await endTrip();
    if (!result.success) {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Guardian Mode
      </Text>

      <Text>Socket Status: {socketConnected ? 'Connected' : 'Disconnected'}</Text>

      {currentTrip ? (
        <>
          <Text>Trip to: {currentTrip.destination.name}</Text>
          <Text>Progress: {currentTrip.progress}%</Text>
          <Text>ETA: {currentTrip.eta} minutes</Text>
          
          <Button title="End Trip" onPress={handleEndTrip} />
        </>
      ) : (
        <Button title="Start New Trip" onPress={handleStartTrip} />
      )}
    </View>
  );
};

export default GuardianScreen;