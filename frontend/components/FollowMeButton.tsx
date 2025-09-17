import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FollowMeButtonProps {
  onPress: () => void;
  isFollowing: boolean;
}

export default function FollowMeButton({ onPress, isFollowing }: FollowMeButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isFollowing && styles.activeButton]}
      onPress={onPress}
      accessibilityLabel="Follow Me Button"
      accessibilityHint="Share your location with trusted contacts"
    >
      <View style={styles.content}>
        <Ionicons
          name={isFollowing ? 'location' : 'location-outline'}
          size={24}
          color={isFollowing ? '#fff' : '#007AFF'}
        />
        <Text style={[styles.text, isFollowing && styles.activeText]}>
          {isFollowing ? 'Following' : 'Follow Me'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  activeText: {
    color: '#fff',
  },
});