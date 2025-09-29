import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface StandardHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightIconColor?: string;
  showBackButton?: boolean;
  theme?: 'white' | 'blue';
  showLogo?: boolean;
}

export default function StandardHeader({
  title,
  subtitle,
  onBackPress,
  rightIcon,
  onRightPress,
  rightIconColor,
  showBackButton = true,
  theme = 'white',
  showLogo = false,
}: StandardHeaderProps) {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const isBlueTheme = theme === 'blue';
  const defaultRightIconColor = isBlueTheme ? '#FFFFFF' : '#007AFF';
  const finalRightIconColor = rightIconColor || defaultRightIconColor;

  return (
    <View style={[styles.header, isBlueTheme && styles.headerBlue]}>
      {showLogo ? (
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>
      ) : showBackButton ? (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isBlueTheme ? '#FFFFFF' : '#007AFF'} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
      
      <View style={styles.titleContainer}>
        <Text style={[styles.headerTitle, isBlueTheme && styles.headerTitleBlue]}>{title}</Text>
        {subtitle && <Text style={[styles.headerSubtitle, isBlueTheme && styles.headerSubtitleBlue]}>{subtitle}</Text>}
      </View>
      
      {rightIcon && onRightPress ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightButton}>
          <Ionicons name={rightIcon} size={24} color={finalRightIconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.headerSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerBlue: {
    backgroundColor: '#2563eb',
    borderBottomColor: '#1d4ed8',
  },
  backButton: {
    padding: 8,
  },
  rightButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minWidth: 50,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logo: {
    width: 28,
    height: 28,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerTitleBlue: {
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSubtitleBlue: {
    color: '#E0F2FE',
  },
});