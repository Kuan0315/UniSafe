import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SOSContextType {
  isSOSActive: boolean;
  setIsSOSActive: (active: boolean) => void;
  sosStartTime: Date | null;
  setSosStartTime: (time: Date | null) => void;
  showSOSModal: boolean;
  setShowSOSModal: (show: boolean) => void;
  onSOSIndicatorPress?: () => void;
  setOnSOSIndicatorPress: (callback: () => void) => void;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

interface SOSProviderProps {
  children: ReactNode;
}

export function SOSProvider({ children }: SOSProviderProps) {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [sosStartTime, setSosStartTime] = useState<Date | null>(null);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [onSOSIndicatorPress, setOnSOSIndicatorPress] = useState<(() => void) | undefined>();

  return (
    <SOSContext.Provider
      value={{
        isSOSActive,
        setIsSOSActive,
        sosStartTime,
        setSosStartTime,
        showSOSModal,
        setShowSOSModal,
        onSOSIndicatorPress,
        setOnSOSIndicatorPress,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
}

export function useSOSContext() {
  const context = useContext(SOSContext);
  if (context === undefined) {
    throw new Error('useSOSContext must be used within a SOSProvider');
  }
  return context;
}