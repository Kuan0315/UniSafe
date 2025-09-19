import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

class SoundAlarmService {
  private currentSound: Audio.Sound | null = null;
  private isInitialized = false;
  private onSoundFinished: (() => void) | null = null;

  setOnSoundFinished(callback: () => void) {
    this.onSoundFinished = callback;
  }

  async initializeSounds() {
    try {
      // Set audio mode for maximum compatibility
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      this.isInitialized = true;
      console.log('Audio service initialized');
    } catch (error) {
      console.log('Error initializing audio:', error);
    }
  }

  async playFakeCallSound() {
    try {
      console.log('🔊 Playing FAKE CALL sound...');
      await this.stopAllSounds();
      
      if (!this.isInitialized) {
        await this.initializeSounds();
      }

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // Create and play ringtone sound
      await this.createRingtoneSound();
      
    } catch (error) {
      console.log('Error playing fake call sound:', error);
      this.playRingtoneHaptics();
    }
  }

  async playLoudAlarmSound() {
    try {
      console.log('🚨 Playing RING ALARM sound...');
      await this.stopAllSounds();
      
      if (!this.isInitialized) {
        await this.initializeSounds();
      }

      // Strong haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Create and play alarm sound
      await this.createAlarmSound();
      
    } catch (error) {
      console.log('Error playing loud alarm sound:', error);
      this.playAlarmHaptics();
    }
  }

  private async createRingtoneSound() {
    try {
      console.log('Creating fake call ringtone sound...');
      // Skip remote URL and go directly to local generation for reliability
      await this.createLocalRingtone();
      
    } catch (error) {
      console.log('Could not create ringtone sound, using haptics only');
      this.playRingtoneHaptics();
    }
  }

  private async createLocalRingtone() {
    try {
      console.log('Creating phone ringtone with React Native Audio...');
      
      // Use the uploaded telephone.mp3 file
      console.log('🔊 Playing telephone.mp3 for fake call ringtone');
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/telephone.mp3'),
        { shouldPlay: true, volume: 0.8, isLooping: true }
      );
      
      this.currentSound = sound;
      
      // Auto-stop after 10 seconds
      setTimeout(async () => {
        await this.stopAllSounds();
        if (this.onSoundFinished) {
          this.onSoundFinished();
        }
      }, 10000);
      
    } catch (error) {
      console.log('Could not load telephone.mp3, using haptics as fallback:', error);
      this.playRingtoneHaptics();
    }
  }

  private async createAlarmSound() {
    try {
      console.log('Creating ring alarm sound...');
      // Skip remote URL and go directly to local generation for reliability
      await this.createLocalAlarm();
      
    } catch (error) {
      console.log('Could not create alarm sound, using haptics only');
      this.playAlarmHaptics();
    }
  }

  private async createLocalAlarm() {
    try {
      console.log('Creating ring alarm sound with React Native Audio...');
      
      // Use the uploaded alarm.mp3 file
      console.log('🚨 Playing alarm.mp3 for urgent alarm');
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/alarm.mp3'),
        { shouldPlay: true, volume: 1.0, isLooping: true }
      );
      
      this.currentSound = sound;
      
      // Auto-stop after 15 seconds
      setTimeout(async () => {
        await this.stopAllSounds();
        if (this.onSoundFinished) {
          this.onSoundFinished();
        }
      }, 15000);
      
    } catch (error) {
      console.log('Could not load alarm.mp3, using haptics as fallback:', error);
      this.playAlarmHaptics();
    }
  }

  private async playRingtoneHaptics() {
    console.log('🔊 Playing PHONE RINGTONE haptic pattern (gentle, rhythmic)');
    // Phone ring pattern - gentle, rhythmic like a real phone
    for (let ring = 0; ring < 5; ring++) {
      // Two quick pulses (like ring... ring...)
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise(resolve => setTimeout(resolve, 200));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Longer pause between rings
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  private async playAlarmHaptics() {
    console.log('🚨 Playing URGENT ALARM haptic pattern (intense, continuous)');
    // Urgent alarm pattern - intense, continuous vibration
    for (let i = 0; i < 15; i++) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async stopAllSounds() {
    try {
      if (this.currentSound) {
        console.log('Stopping current sound...');
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        this.currentSound = null;
      }
    } catch (error) {
      console.log('Error stopping sounds:', error);
    }
  }

  async unloadSounds() {
    await this.stopAllSounds();
    this.isInitialized = false;
  }

  // Test method to verify audio functionality
  async testAudio() {
    console.log('Testing audio functionality...');
    try {
      await this.initializeSounds();
      console.log('Audio initialized successfully');
      
      console.log('Testing ringtone...');
      await this.playFakeCallSound();
      
      setTimeout(async () => {
        console.log('Testing alarm...');
        await this.playLoudAlarmSound();
      }, 3000);
      
    } catch (error) {
      console.log('Audio test failed:', error);
    }
  }
}

export const soundAlarmService = new SoundAlarmService();