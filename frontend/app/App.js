// app/App.js
import React from 'react';
import { GuardianProvider } from '../contexts/GuardianContext';
import 'expo-router/entry'; // Automatically handles routing

const App = () => {
  return (
    <GuardianProvider>
      {/* Expo Router will handle navigation automatically */}
    </GuardianProvider>
  );
};

export default App;
