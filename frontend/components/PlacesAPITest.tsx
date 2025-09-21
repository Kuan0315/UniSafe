import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { MAPS_CONFIG } from '../config/maps';

export const PlacesAPITest = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testPlacesAPI = async () => {
    setLoading(true);
    setTestResult('Testing...');
    
    try {
      const query = 'universiti';
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${MAPS_CONFIG.GOOGLE_MAPS_API_KEY}&language=en&components=country:my`;
      
      console.log('Testing Places API URL:', url.replace(MAPS_CONFIG.GOOGLE_MAPS_API_KEY, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Places API Response:', data);
      
      if (data.status === 'OK') {
        setTestResult(`✅ SUCCESS: Found ${data.predictions?.length || 0} suggestions`);
        if (data.predictions?.length > 0) {
          console.log('First suggestion:', data.predictions[0]);
        }
      } else {
        setTestResult(`❌ ERROR: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Places API Test Error:', error);
      setTestResult(`❌ NETWORK ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Places API Test</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={testPlacesAPI}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test Places API'}
        </Text>
      </TouchableOpacity>
      {testResult ? (
        <Text style={styles.result}>{testResult}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  result: {
    fontSize: 12,
    color: '#333',
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 5,
  },
});