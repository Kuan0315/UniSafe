import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SafetyAlert {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
  category: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  timeLimit?: number;
  scheduledAt?: Date;
  isActive: boolean;
  isAutoDeactivated: boolean;
  isScheduled: boolean;
  sendPushNotification: boolean;
  sendEmail: boolean;
  sendSMS: boolean;
  alertScope: 'campus-wide' | 'location-specific';
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    radius?: number;
  };
}

interface SafetyAlertContextType {
  alerts: SafetyAlert[];
  addAlert: (alert: SafetyAlert) => void;
  updateAlert: (id: string, alert: Partial<SafetyAlert>) => void;
  deleteAlert: (id: string) => void;
  getActiveAlerts: () => SafetyAlert[];
  getLocationSpecificAlerts: () => SafetyAlert[];
}

const SafetyAlertContext = createContext<SafetyAlertContextType | undefined>(undefined);

export const useSafetyAlerts = () => {
  const context = useContext(SafetyAlertContext);
  if (!context) {
    throw new Error('useSafetyAlerts must be used within a SafetyAlertProvider');
  }
  return context;
};

interface SafetyAlertProviderProps {
  children: ReactNode;
}

export const SafetyAlertProvider: React.FC<SafetyAlertProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);

  // Load alerts from storage on mount
  useEffect(() => {
    loadAlertsFromStorage();
  }, []);

  const loadAlertsFromStorage = async () => {
    try {
      // In a real app, this would load from AsyncStorage or API
      // For now, we'll start with empty array
      setAlerts([]);
    } catch (error) {
      console.error('Error loading alerts from storage:', error);
    }
  };

  const saveAlertsToStorage = async (newAlerts: SafetyAlert[]) => {
    try {
      // In a real app, this would save to AsyncStorage or API
      // For now, we'll just keep it in memory
      console.log('Saving alerts to storage:', newAlerts.length);
    } catch (error) {
      console.error('Error saving alerts to storage:', error);
    }
  };

  const addAlert = (alert: SafetyAlert) => {
    setAlerts(prev => {
      const newAlerts = [alert, ...prev];
      saveAlertsToStorage(newAlerts);
      return newAlerts;
    });
  };

  const updateAlert = (id: string, updates: Partial<SafetyAlert>) => {
    setAlerts(prev => {
      const newAlerts = prev.map(alert =>
        alert.id === id ? { ...alert, ...updates } : alert
      );
      saveAlertsToStorage(newAlerts);
      return newAlerts;
    });
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => {
      const newAlerts = prev.filter(alert => alert.id !== id);
      saveAlertsToStorage(newAlerts);
      return newAlerts;
    });
  };

  const getActiveAlerts = () => {
    return alerts.filter(alert => alert.isActive);
  };

  const getLocationSpecificAlerts = () => {
    return alerts.filter(alert =>
      alert.isActive &&
      alert.alertScope === 'location-specific' &&
      alert.location?.latitude &&
      alert.location?.longitude
    );
  };

  const value: SafetyAlertContextType = {
    alerts,
    addAlert,
    updateAlert,
    deleteAlert,
    getActiveAlerts,
    getLocationSpecificAlerts,
  };

  return (
    <SafetyAlertContext.Provider value={value}>
      {children}
    </SafetyAlertContext.Provider>
  );
};