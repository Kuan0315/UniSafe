import React, { useCallback } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';
import { LinearGradient } from 'expo-linear-gradient';

function confirmAndCall(phone: string, contactName: string) {
  Alert.alert(
    "Confirm Call",
    `Are you sure you want to call ${contactName}?`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        style: "destructive",
        onPress: () => {
          speakButtonAction(`Calling ${contactName}`);
          const url = Platform.select({ ios: `telprompt:${phone}`, default: `tel:${phone}` });
          Linking.openURL(url || `tel:${phone}`).catch(() => {
            speakButtonAction('Cannot place call. Check your device call permissions.');
            Alert.alert("Cannot place call", "Check your device call permissions.");
          });
        },
      },
    ]
  );
}

export default function EmergencyCallScreen() {
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Emergency Contacts');
    }, [])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with blue gradient */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Ionicons name="alert-circle" size={36} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <Text style={styles.headerSubtitle}>Quickly reach campus & public safety services</Text>
      </LinearGradient>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#2563eb" />
        <Text style={styles.infoText}>Tap any contact to call immediately</Text>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Services</Text>
        
        {/* 999 Button - now with white background */}
        <TouchableOpacity 
          style={[styles.card, styles.emergencyCard]} 
          onPress={() => confirmAndCall("999", "999 Emergency")}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: "#fee2e2" }]}>
              <Ionicons name="call" size={24} color="#dc2626" />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.cardText, { color: "#dc2626" }]}>Call 999</Text>
              <Text style={styles.cardSubtext}>Emergency Services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Campus Services</Text>
        
        {/* Campus Security */}
        <TouchableOpacity 
          style={[styles.card, styles.standardCard]} 
          onPress={() => confirmAndCall("1234567890", "Campus Security")}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons name="shield-checkmark" size={22} color="#1e40af" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardText}>Campus Security</Text>
              <Text style={styles.cardSubtext}>Available 24/7</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Health Services */}
        <TouchableOpacity 
          style={[styles.card, styles.standardCard]} 
          onPress={() => confirmAndCall("0987654321", "Health Services")}
          activeOpacity={0.8}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconCircle, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="medkit" size={22} color="#059669" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.cardText}>Health Services</Text>
              <Text style={styles.cardSubtext}>Medical assistance</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Additional Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          In case of emergency, stay calm and provide your location clearly to the operator.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f9fafb" 
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  // Header - made smaller
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  headerIconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#fff", 
    marginBottom: 4,
    textAlign: 'center'
  },
  headerSubtitle: { 
    fontSize: 14, 
    color: "#e0f2fe", 
    textAlign: 'center',
    paddingHorizontal: 10,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    marginLeft: 8,
    color: '#1e40af',
    fontSize: 14,
    fontWeight: '500',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
    marginLeft: 4,
  },

  // Cards
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#dc2626',
  },
  standardCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  cardText: { 
    fontSize: 17, 
    fontWeight: "600", 
    color: "#111827",
    marginBottom: 2,
  },
  cardSubtext: {
    fontSize: 13,
    color: "#6b7280",
  },
  chevron: {
    marginLeft: 'auto'
  },

  // Icon circle
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer
  footer: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  footerText: {
    fontSize: 13,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
});