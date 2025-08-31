import React, { createContext, useContext } from 'react';
import { useGuardian } from '../hooks/useGuardian';

const GuardianContext = createContext();

export const useGuardianContext = () => {
  const context = useContext(GuardianContext);
  if (!context) {
    throw new Error('useGuardianContext must be used within a GuardianProvider');
  }
  return context;
};

export const GuardianProvider = ({ children }) => {
  const guardian = useGuardian();

  return (
    <GuardianContext.Provider value={guardian}>
      {children}
    </GuardianContext.Provider>
  );
};