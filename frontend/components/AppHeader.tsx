import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSOSContext } from "../contexts/SOSContext";
import { useAlarmContext } from "../contexts/AlarmContext";

type AppHeaderProps = {
  title?: string;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  hasActiveFilter?: boolean;
};

export default function AppHeader({ title, showFilterButton, onFilterPress, hasActiveFilter }: AppHeaderProps) {
  const { isSOSActive, onSOSIndicatorPress } = useSOSContext();
  const { isAlarmPlaying, currentAlarmType, onAlarmIndicatorPress } = useAlarmContext();
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
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
          
          <View style={styles.rightSection}>
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
            
            {/* Alarm Active Indicator */}
            {isAlarmPlaying && (
              <TouchableOpacity 
                style={styles.alarmIndicator}
                onPress={onAlarmIndicatorPress}
                activeOpacity={0.8}
              >
                <View style={styles.alarmIndicatorContent}>
                  <Ionicons 
                    name={currentAlarmType === 'fake-call' ? 'call' : 'notifications'} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.alarmStatusText}>
                    {currentAlarmType === 'fake-call' ? 'CALL' : 'RING'}
                  </Text>
                  <Ionicons name="stop" size={10} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {title ? (
          <View style={styles.titleBar}>
            <Text style={styles.titleText}>{title}</Text>
            {showFilterButton && (
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={onFilterPress}
                activeOpacity={0.8}
              >
                <Ionicons name="filter" size={20} color="#FFFFFF" />
                {hasActiveFilter && (
                  <View style={styles.filterIndicator} />
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const BLUE = "#1E88E5";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  container: {
    backgroundColor: "#fff",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alarmIndicator: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 2,
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  alarmIndicatorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alarmStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleBar: {
    backgroundColor: "#335499",
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterButton: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
});

