import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function MapShareScreen() {
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareWith, setShareWith] = useState("");

  function toggleShare(value: boolean) {
    setShareEnabled(value);
    if (value) {
      Alert.alert("Sharing enabled", "Your live location will be shared.");
    } else {
      Alert.alert("Sharing stopped", "Live location sharing is off.");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map & Share</Text>
      <Text style={styles.subtitle}>Live location sharing with friends or security</Text>

      <View style={styles.mockMap}>
        <Text style={{ color: "#666" }}>Map placeholder</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Share live location</Text>
        <Switch value={shareEnabled} onValueChange={toggleShare} />
      </View>

      <TextInput style={styles.input} placeholder="Share with (emails, comma separated)" value={shareWith} onChangeText={setShareWith} placeholderTextColor="#999" />

      <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Share link", "Send a secure link to selected contacts")}> 
        <Text style={styles.buttonText}>Generate Share Link</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 16 },
  mockMap: { height: 220, borderWidth: 1, borderColor: "#ddd", borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#f6f6f6", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 16, fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 16, backgroundColor: "#fafafa" },
  button: { backgroundColor: "#1e40af", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});


