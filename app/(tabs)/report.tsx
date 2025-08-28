import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ReportScreen() {
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  function submit() {
    if (!category.trim() || !description.trim()) {
      Alert.alert("Missing info", "Please provide category and description.");
      return;
    }
    // TODO: send to backend, allow photo/video attachment
    Alert.alert("Report sent", "Campus security has been notified.");
    setCategory("");
    setDescription("");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Report</Text>
      <Text style={styles.subtitle}>Tip off campus security about suspicious behavior</Text>

      <TextInput style={styles.input} placeholder="Category (e.g., Suspicious person)" value={category} onChangeText={setCategory} placeholderTextColor="#999" />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe what happened..."
        value={description}
        onChangeText={setDescription}
        placeholderTextColor="#999"
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity style={styles.button} onPress={submit}> 
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => Alert.alert("Attachment", "Camera/Photo picker to be integrated")}> 
        <Text style={styles.linkText}>Attach photo/video</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  textarea: { height: 130, textAlignVertical: "top" },
  button: { backgroundColor: "#1e40af", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  linkBtn: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#1e40af", fontSize: 14, fontWeight: "600" },
});


