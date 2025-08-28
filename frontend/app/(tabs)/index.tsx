import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Campus Safety</Text>
      <Text style={styles.subtitle}>Choose a feature to get started</Text>

      <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/(tabs)/sos")}> 
        <Text style={styles.btnPrimaryText}>SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/report")}>
        <Text style={styles.btnText}>Report</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/map")}>
        <Text style={styles.btnText}>Map & Share</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/guardian")}>
        <Text style={styles.btnText}>Guardian</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => router.push("/(tabs)/emergency")}>
        <Text style={styles.btnText}>Emergency Call</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  btnPrimary: {
    backgroundColor: "#dc2626",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    marginBottom: 14,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 1,
  },
  btn: {
    borderColor: "#1e40af",
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: {
    color: "#1e40af",
    fontWeight: "700",
    fontSize: 16,
  },
});


