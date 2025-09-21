import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { MAPS_CONFIG } from '../config/maps';

export default function GooglePlacesDebug() {
  const testPlacesAPI = async () => {
    const apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      Alert.alert("Debug Error", "Google Maps API key is missing!");
      return;
    }

    console.log("Testing Google Places API...");
    console.log("API Key:", apiKey.substring(0, 10) + "...");

    try {
      // Test with a simple query
      const testQuery = "kuala lumpur";
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${testQuery}&key=${apiKey}&language=en&types=establishment|geocode&components=country:my`;
      
      console.log("Test URL:", url.replace(apiKey, "API_KEY_HIDDEN"));
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log("API Response Status:", response.status);
      console.log("API Response Data:", data);
      
      if (data.status === "OK") {
        Alert.alert(
          "✅ API Working!", 
          `Found ${data.predictions?.length || 0} results for "${testQuery}"`
        );
      } else {
        Alert.alert(
          "❌ API Error", 
          `Status: ${data.status}\nError: ${data.error_message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      Alert.alert("❌ Network Error", "Failed to connect to Google Places API");
    }
  };

  const checkAPIKeyFormat = () => {
    const apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      Alert.alert("❌ No API Key", "EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
      return;
    }

    const keyInfo = [
      `Length: ${apiKey.length}`,
      `Starts with: ${apiKey.substring(0, 10)}...`,
      `Expected format: AIza...`,
      `Valid format: ${apiKey.startsWith('AIza') ? '✅' : '❌'}`
    ].join('\n');

    Alert.alert("🔑 API Key Info", keyInfo);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Google Places API Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkAPIKeyFormat}>
        <Text style={styles.buttonText}>Check API Key Format</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testPlacesAPI}>
        <Text style={styles.buttonText}>Test Places API</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        Check the console logs for detailed information.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
});