import { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SosScreen() {
  const [armed, setArmed] = useState(false);
  const pressCountRef = useRef(0);

  function handleHiddenGesture() {
    pressCountRef.current += 1;
    if (pressCountRef.current >= 3) {
      pressCountRef.current = 0;
      triggerSOS("Hidden gesture activated");
    }
  }

  function triggerSOS(source: string) {
    Alert.alert("SOS Triggered", `${source}. Dispatching alert...`);
    // TODO: integrate background location + backend alert here
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.subtitle}>Hold to arm. Tap 3x anywhere to send hidden SOS.</Text>

      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => setArmed((v) => !v)}
        onPress={handleHiddenGesture}
        style={[styles.sosButton, armed ? styles.sosArmed : undefined]}
      >
        <Text style={styles.sosText}>{armed ? "ARMED" : "SOS"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondary} onPress={() => triggerSOS("Manual press")}> 
        <Text style={styles.secondaryText}>Send Alert</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 20, textAlign: "center" },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    elevation: 3,
  },
  sosArmed: { backgroundColor: "#b91c1c" },
  sosText: { color: "#fff", fontSize: 42, fontWeight: "900", letterSpacing: 2 },
  secondary: { borderWidth: 1, borderColor: "#ef4444", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  secondaryText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
});


