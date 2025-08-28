import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContacts, setEmergencyContacts] = useState<Array<{ name: string; phone: string }>>([
    { name: "", phone: "" },
  ]);
  const [voiceSOS, setVoiceSOS] = useState(false);
  const [gestureSOS, setGestureSOS] = useState(true);

  function save() {
    if (!fullName.trim() || !email.trim()) {
      Alert.alert("Missing info", "Full name and email are required.");
      return;
    }
    // TODO: Persist to backend or secure storage
    Alert.alert("Saved", "Your profile has been updated.");
  }

  function signOut() {
    // TODO: Clear session/token
    router.replace("/");
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Your Profile</Text>

      <Text style={styles.sectionTitle}>Personal Information</Text>
      <TextInput style={styles.input} placeholder="Full name" value={fullName} onChangeText={setFullName} placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Student ID" value={studentId} onChangeText={setStudentId} placeholderTextColor="#999" />
      <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor="#999" />

      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      {emergencyContacts.map((c, idx) => (
        <View key={idx} style={styles.row}>
          <TextInput style={[styles.input, styles.flex]} placeholder="Name" value={c.name} onChangeText={(t) => {
            const next = [...emergencyContacts];
            next[idx] = { ...next[idx], name: t };
            setEmergencyContacts(next);
          }} placeholderTextColor="#999" />
          <TextInput style={[styles.input, styles.flex]} placeholder="Phone" keyboardType="phone-pad" value={c.phone} onChangeText={(t) => {
            const next = [...emergencyContacts];
            next[idx] = { ...next[idx], phone: t };
            setEmergencyContacts(next);
          }} placeholderTextColor="#999" />
          <TouchableOpacity style={styles.removeBtn} onPress={() => setEmergencyContacts(emergencyContacts.filter((_, i) => i !== idx))}> 
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={() => setEmergencyContacts([...emergencyContacts, { name: "", phone: "" }])}> 
        <Text style={styles.addText}>+ Add contact</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>SOS Settings</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Voice activation</Text>
        <Switch value={voiceSOS} onValueChange={setVoiceSOS} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.label}>Hidden gesture (triple tap)</Text>
        <Switch value={gestureSOS} onValueChange={setGestureSOS} />
      </View>

      <TouchableOpacity style={styles.button} onPress={save}> 
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.signOut]} onPress={signOut}> 
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginTop: 10, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 16, backgroundColor: "#fafafa" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 16, color: "#111" },
  flex: { flex: 1 },
  addBtn: { alignItems: "center", marginBottom: 8 },
  addText: { color: "#1e40af", fontWeight: "700" },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: "#fee2e2" },
  removeText: { color: "#b91c1c", fontWeight: "700" },
  button: { backgroundColor: "#1e40af", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 4, marginBottom: 10 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  signOut: { backgroundColor: "#dc2626" },
});


