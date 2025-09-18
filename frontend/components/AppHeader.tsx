import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSOSContext } from "../contexts/SOSContext";

type AppHeaderProps = {
  title?: string;
};

export default function AppHeader({ title }: AppHeaderProps) {
  const { isSOSActive, onSOSIndicatorPress } = useSOSContext();
  
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.leftSection}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>UniSafe</Text>
        </View>
        
        {/* SOS Active Indicator */}
        {isSOSActive && (
          <TouchableOpacity 
            style={styles.sosIndicator}
            onPress={onSOSIndicatorPress}
            activeOpacity={0.8}
          >
            <View style={styles.sosIndicatorContent}>
              <View style={styles.sosStatusDot} />
              <Text style={styles.sosStatusText}>SOS</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      {title ? (
        <View style={styles.titleBar}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
}

const BLUE = "#1E88E5";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 36,
    paddingBottom: 12,
    justifyContent: "space-between",
    gap: 8,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  logo: {
    width: 24,
    height: 24,
  },
  appName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  sosIndicator: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sosIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sosStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  sosStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleBar: {
    backgroundColor: "#335499",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 0,
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});


