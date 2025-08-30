import React, { useEffect } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';

function callNumber(phone: string, contactName: string) {
  speakButtonAction(`Calling ${contactName}`);
  const url = Platform.select({ ios: `telprompt:${phone}`, default: `tel:${phone}` });
  Linking.openURL(url || `tel:${phone}`).catch(() => {
    speakButtonAction('Cannot place call. Check your device call permissions.');
    Alert.alert("Cannot place call", "Check your device call permissions.");
  });
}

export default function EmergencyCallScreen() {
  // Speak page title on load for accessibility
  useEffect(() => {
    speakPageTitle('Emergency Contacts');
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.subtitle}>Quickly reach campus and public safety</Text>

      <TouchableOpacity style={[styles.callBtn, styles.primary]} onPress={() => callNumber("911", "911 Emergency")}> 
        <Text style={styles.callText}>Call 911</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callBtn} onPress={() => callNumber("1234567890", "Campus Security")}>
        <Text style={styles.callText}>Campus Security</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.callBtn} onPress={() => callNumber("0987654321", "Health Services")}>
        <Text style={styles.callText}>Health Services</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#666", marginBottom: 16 },
  callBtn: { backgroundColor: "#1e40af", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  primary: { backgroundColor: "#dc2626" },
  callText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});


