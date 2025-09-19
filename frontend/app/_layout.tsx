// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SOSProvider } from "../contexts/SOSContext";
import LoadingScreen from "../components/LoadingScreen";

function LayoutContent() {
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
        <LayoutContent />
      </SOSProvider>
    </AuthProvider>
  );
}