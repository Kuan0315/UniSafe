import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname, useRouter } from "expo-router";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../contexts/AuthContext";

export default function TabsLayout() {
  const { user } = useAuth();
  const isStaff = !!user && (user.role === 'security' || user.role === 'admin' || user.role === 'staff');
  const router = useRouter();
  const pathname = usePathname();

  // If staff user and not already on staff page after login, redirect
  if (isStaff && pathname?.startsWith('/(tabs)') && !pathname.includes('/staff')) {
    // push only once to avoid loops
    setTimeout(() => {
      try { router.replace('/(tabs)/staff'); } catch {}
    }, 0);
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: ({ options }) => (
          <AppHeader title={options.title as string} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="guardian"
        options={{
          title: "Guardian",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="create-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="emergency"
        options={{
          title: "Emergency",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="call-outline" color={color} size={size} />
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
      {isStaff && (
        <Tabs.Screen
          name="staff"
          options={{
            title: "Staff",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="briefcase-outline" color={color} size={size} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}


