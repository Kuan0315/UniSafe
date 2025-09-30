import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type HeaderProps = {
  title?: string;
  subtitle?: string;
  unreadCount: number;  // must be a number
  onNotificationsPress: () => void; // a function with no args, no return
  onActivityPress?: () => void;
};

export default function Header({ 
  title = "Welcome back! 👋", 
  subtitle = "Stay safe on campus", 
  unreadCount, 
  onNotificationsPress,
  onActivityPress 
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.welcomeTextContainer}>
          <Text style={styles.greeting}>{title}</Text>
          <View style={styles.subtitleContainer}>
            <View style={styles.safetyBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#4CAF50" style={styles.safetyIcon} />
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
        </View>
      </View>
        <TouchableOpacity
          style={styles.activityRingButton}
          onPress={onNotificationsPress}
          accessibilityLabel="Notifications"
          accessibilityHint="View your notifications"
        >
          <View style={styles.bellContainer}>
            <Ionicons name="notifications-outline" size={28} color="#007AFF" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 5,
    paddingRight: 20,
    paddingVertical: 16,
    paddingTop: 16,
    marginTop: 0,
    backgroundColor: 'transparent',
  },
  welcomeTextContainer: {
    flex: 1,
    marginLeft: 0,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  safetyIcon: {
    marginRight: 6,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 25,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  bellContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityRingButton: {
    padding: 10,
  },
  activityRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  alertsContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
  },

});
