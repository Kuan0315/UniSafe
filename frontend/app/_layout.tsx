// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

function LayoutContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Keep login as your auth entry point */}
      <Stack.Screen name="login" />
      {/* Only keep (tabs) if you still have app/(tabs)/_layout.tsx */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}
