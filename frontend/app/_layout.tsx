// app/_layout.tsx
import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { SOSProvider } from "../contexts/SOSContext";
import { AlarmProvider } from "../contexts/AlarmContext";
import LoadingScreen from "../components/LoadingScreen";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import "react-native-get-random-values";

function LayoutContent() {
    const { isLoading, user } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    // Handle redirects based on authentication state and user role
    useEffect(() => {
        if (!isLoading) {
            const inAuthGroup = segments[0] === "(auth)" || segments[0] === "login";

            if (user && inAuthGroup) {
                // User is logged in but on auth screen - redirect to appropriate interface
                if (user.role === 'student') {
                    router.replace("/(tabs)");
                } else if (user.role === 'guardian') {
                    router.replace("/(guardianTabs)");
                } else if (user.role === 'staff' || user.role === 'security' || user.role === 'admin') {
                    router.replace("/staff");
                }
            } else if (!user && !inAuthGroup) {
                // User not logged in and not on auth screen - redirect to login
                router.replace("/login");
            }
        }
    }, [user, segments, isLoading]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(guardianTabs)" />
            <Stack.Screen name="staff" />
            <Stack.Screen name="login" />
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
}