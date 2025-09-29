import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "../../components/AppHeader";

export default function GuardianLayout() {
<<<<<<< HEAD
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                header: ({ options }) => (
                    <AppHeader title={options.title as string} />
                ),
                tabBarActiveTintColor: "#1e40af",
                tabBarInactiveTintColor: "#64748b",
            }}
        >
            <Tabs.Screen
                name="guardianTrackingScreen"
                options={{
                    title: "Guardian Tracking",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="shield-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="emergency"
                options={{
                    title: "Emergency",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="call-outline" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
=======
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: ({ options }) => (
          <AppHeader title={options.title as string} />
        ),
        tabBarActiveTintColor: "#1e40af",
        tabBarInactiveTintColor: "#64748b",
      }}
    >
      <Tabs.Screen
        name="guardianTrackingScreen"
        options={{
          title: "Guardian Tracking",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="emergency"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
>>>>>>> 441d99cd00a666d82e26351ff32ea84d8b1e8ff8
}