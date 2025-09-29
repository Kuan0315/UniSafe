<<<<<<< HEAD
﻿// app/_layout.tsx
=======
// app/_layout.tsx
>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SOSProvider } from "../contexts/SOSContext";
import { AlarmProvider } from "../contexts/AlarmContext";
import LoadingScreen from "../components/LoadingScreen";
import "react-native-get-random-values";

function LayoutContent() {
<<<<<<< HEAD
    const { isLoading, user } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            {user ? (
                // User is logged in → show main app
                <>

                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(guardianTabs)" />
                    <Stack.Screen name="staff" />
                </>
            ) : (
                // User not logged in → show login
                <Stack.Screen name="login" />
            )}
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <SOSProvider>
                <AlarmProvider>
                    <LayoutContent />
                </AlarmProvider>
            </SOSProvider>
        </AuthProvider>
    );
=======
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        // User is logged in → show main app
        <>

          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(guardianTabs)" />
          <Stack.Screen name="staff" />
        </>
      ) : (
        // User not logged in → show login
        <Stack.Screen name="login" /> 
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SOSProvider>
        <AlarmProvider>
          <LayoutContent />
        </AlarmProvider>
      </SOSProvider>
    </AuthProvider>
  );
>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
}