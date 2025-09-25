import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface Location {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function GuardianTrackingScreen() {
  const [locations, setLocations] = useState<Record<string, Location>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:4000/guardian/subscribe");

    socket.onopen = () => {
      console.log("✅ Connected to Guardian WebSocket");
      // Subscribe to multiple users
      socket.send(JSON.stringify({ action: "subscribe", userIds: ["123", "456"] }));
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "location_update") {
        const loc: Location = msg.data;
        setLocations((prev) => ({ ...prev, [loc.userId]: loc }));
      }
    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("❌ Disconnected from Guardian WebSocket");
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, []);

  const locationArray = Object.values(locations);

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
        {locationArray.map((loc) => (
          <Marker
            key={loc.userId}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            title={`User ${loc.userId}`}
            description={`Last updated: ${new Date(loc.timestamp).toLocaleTimeString()}`}
            pinColor="blue"
          />
        ))}
      </MapView>

      {/* User list at bottom */}
      <View style={styles.userList}>
        <Text style={styles.title}>Tracked Users</Text>
        <FlatList
          data={locationArray}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <Text style={styles.userItem}>
              👤 User {item.userId} — {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
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