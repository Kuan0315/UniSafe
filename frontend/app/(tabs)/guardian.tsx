import { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function GuardianScreen() {
  const [destination, setDestination] = useState("");
  const [etaMinutes, setEtaMinutes] = useState("15");
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function startEscort() {
    if (!destination.trim()) {
      Alert.alert("Missing destination", "Please enter your destination.");
      return;
    }
    setIsActive(true);
    const ms = Math.max(1, parseInt(etaMinutes || "1", 10)) * 60 * 1000;
    timerRef.current = setTimeout(() => {
      Alert.alert("Auto-alert", "You did not confirm arrival. Alerting guardians.");
      // TODO: trigger backend alert
      setIsActive(false);
    }, ms);
  }

  function confirmArrived() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsActive(false);
    Alert.alert("Arrived", "Your guardians have been notified.");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Virtual Escort</Text>
      <Text style={styles.subtitle}>Friends/security can track your route in real-time</Text>

      <TextInput style={styles.input} placeholder="Destination (e.g., Dorm A)" value={destination} onChangeText={setDestination} placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="ETA in minutes" keyboardType="numeric" value={etaMinutes} onChangeText={setEtaMinutes} placeholderTextColor="#999" />

      {!isActive ? (
        <TouchableOpacity style={styles.button} onPress={startEscort}> 
          <Text style={styles.buttonText}>Start Guardian Mode</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.button, styles.buttonActive]} onPress={confirmArrived}> 
          <Text style={styles.buttonText}>I Arrived Safely</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert("Share", "Share live route with selected contacts")}> 
        <Text style={styles.linkText}>Share with guardians</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 16, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#1e40af", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  buttonActive: { backgroundColor: "#059669" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#1e40af", fontSize: 14, fontWeight: "600" },
});


