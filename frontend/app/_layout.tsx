// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SOSProvider } from "../contexts/SOSContext";
import LoadingScreen from "../components/LoadingScreen";

function LayoutContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Authentication screens */}
      <Stack.Screen name="login" />
      {/* Main app tabs */}
      <Stack.Screen name="(tabs)" />

      {/* Guardian tabs */}
      <Stack.Screen name="(guardianTabs)" />

      {/* Staff tabs */}
      <Stack.Screen name="staff" />
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