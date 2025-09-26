import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MAPS_CONFIG } from '../../config/maps';
import polyline from "@mapbox/polyline";

interface Location {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

interface UserRoute {
  userId: string;
  path: { latitude: number; longitude: number }[];
}

const GOOGLE_API_KEY = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;

export default function GuardianTrackingScreen() {
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [routes, setRoutes] = useState<Record<string, UserRoute>>({});

  useEffect(() => {
    const users = ["123", "456", "789"];

    // Mock start and destination points
    const startPoints = [
      { lat: 3.1201, lng: 101.6544 },
      { lat: 3.1301, lng: 101.6644 },
      { lat: 3.1401, lng: 101.6744 },
    ];
    const endPoints = [
      { lat: 3.1501, lng: 101.6844 },
      { lat: 3.1601, lng: 101.6944 },
      { lat: 3.1701, lng: 101.7044 },
    ];

    users.forEach(async (id, i) => {
      // Initialize user location
      setLocations((prev) => ({
        ...prev,
        [id]: {
          userId: id,
          latitude: startPoints[i].lat,
          longitude: startPoints[i].lng,
          timestamp: new Date().toISOString(),
        },
      }));

      // Fetch route from Google Directions API
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startPoints[i].lat},${startPoints[i].lng}&destination=${endPoints[i].lat},${endPoints[i].lng}&mode=walking&key=${GOOGLE_API_KEY}`;

      try {
        const res = await fetch(url);
        const json = await res.json();

        if (json.routes.length > 0) {
          const points = polyline.decode(
            json.routes[0].overview_polyline.points
          );
          const coords = points.map(([latitude, longitude]) => ({
            latitude,
            longitude,
          }));

          setRoutes((prev) => ({
            ...prev,
            [id]: { userId: id, path: coords },
          }));
        }
      } catch (err) {
        console.error("❌ Error fetching directions:", err);
      }
    });
  }, []);

  const locationArray = Object.values(locations);

  const userColors: Record<string, string> = {
    "123": "red",
    "456": "blue",
    "789": "green",
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 3.1201,
          longitude: 101.6544,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Draw routes */}
        {Object.values(routes).map((route) => (
          <Polyline
            key={route.userId}
            coordinates={route.path}
            strokeColor={userColors[route.userId] || "black"}
            strokeWidth={3}
          />
        ))}

        {/* Markers */}
        {locationArray.map((loc) => (
          <Marker
            key={loc.userId}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={`User ${loc.userId}`}
            description={`Last updated: ${new Date(
              loc.timestamp
            ).toLocaleTimeString()}`}
            pinColor={userColors[loc.userId] || "blue"}
          />
        ))}
      </MapView>

      {/* User list */}
      <View style={styles.userList}>
        <Text style={styles.title}>Tracked Users</Text>
        <FlatList
          data={locationArray}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <Text style={styles.userItem}>
              👤 User {item.userId} — {item.latitude.toFixed(4)},{" "}
              {item.longitude.toFixed(4)}
            </Text>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userList: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
  },
  title: { fontWeight: "bold", marginBottom: 5 },
  userItem: { fontSize: 14, marginVertical: 2 },
});