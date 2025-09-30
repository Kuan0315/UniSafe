import React, { createContext, useContext, useState, ReactNode } from 'react';
import { soundAlarmService } from '../services/SoundAlarmService';

interface AlarmContextType {
  isAlarmPlaying: boolean;
  currentAlarmType: 'fake-call' | 'ring' | null;
  startAlarm: (type: 'fake-call' | 'ring') => Promise<void>;
  stopAlarm: () => Promise<void>;
  onAlarmIndicatorPress: () => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

interface AlarmProviderProps {
  children: ReactNode;
}

export function AlarmProvider({ children }: AlarmProviderProps) {
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [currentAlarmType, setCurrentAlarmType] = useState<'fake-call' | 'ring' | null>(null);

  const startAlarm = async (type: 'fake-call' | 'ring') => {
    try {
      console.log(`📱 AlarmContext: Starting alarm type: ${type}`);
      // Initialize sound service if not already done
      await soundAlarmService.initializeSounds();
      
      setIsAlarmPlaying(true);
      setCurrentAlarmType(type);
      
      if (type === 'fake-call') {
        await soundAlarmService.playFakeCallSound();
      } else {
        await soundAlarmService.playLoudAlarmSound();
      }
    } catch (error) {
      console.log('Error starting alarm:', error);
      setIsAlarmPlaying(false);
      setCurrentAlarmType(null);
    }
  };

  const stopAlarm = async () => {
    try {
      await soundAlarmService.stopAllSounds();
      setIsAlarmPlaying(false);
      setCurrentAlarmType(null);
    } catch (error) {
      console.log('Error stopping alarm:', error);
    }
  };

  const onAlarmIndicatorPress = () => {
    // When user taps the alarm indicator, stop the alarm
    stopAlarm();
  };

  // Setup callback for when sounds finish naturally
  React.useEffect(() => {
    soundAlarmService.setOnSoundFinished(() => {
      setIsAlarmPlaying(false);
      setCurrentAlarmType(null);
    });
  }, []);

  const value: AlarmContextType = {
    isAlarmPlaying,
    currentAlarmType,
    startAlarm,
    stopAlarm,
    onAlarmIndicatorPress,
  };

  return <AlarmContext.Provider value={value}>{children}</AlarmContext.Provider>;
}

export function useAlarmContext(): AlarmContextType {
  const context = useContext(AlarmContext);
  if (context === undefined) {
    throw new Error('useAlarmContext must be used within an AlarmProvider');
  }
  return context;
}