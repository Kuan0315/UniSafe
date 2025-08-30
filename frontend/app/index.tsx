import { makeRedirectUri } from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { 
  Alert, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView 
} from "react-native";

export default function Index() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "staff">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  WebBrowser.maybeCompleteAuthSession();
  const redirectUri = makeRedirectUri();
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "YOUR_GOOGLE_CLIENT_ID";
  const [request, response, promptAsync] = Google.useAuthRequest({ 
    clientId, 
    scopes: ["profile", "email"], 
    redirectUri 
  });

  useEffect(() => {
    if (response?.type === "success" && response.authentication?.accessToken) {
      // TODO: send token + role to backend
      router.replace("/(tabs)");
    } else if (response?.type === "error") {
      Alert.alert("Authentication failed", "Google sign-in failed. Please try again.");
    }
  }, [response, router]);

  function validate(): string | null {
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return null;
  }

  async function onEmailLogin() {
    const error = validate();
    if (error) {
      Alert.alert("Invalid input", error);
      return;
    }
    try {
      setIsSubmitting(true);
      // TODO: call backend with { role, email, password }
      await new Promise((r) => setTimeout(r, 800));
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Login failed", "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => router.push("/(tabs)/profile")}
              accessibilityLabel="UniSafe logo"
            > 
              <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                contentFit="cover"
                transition={200}
              />
            </TouchableOpacity>
            <Text style={styles.subtitle}>Your safety. Your community. One app.</Text>
          </View>

          <View style={styles.cta}>
            <View style={styles.roleRow}>
              <TouchableOpacity 
                style={[styles.roleBtn, role === "student" && styles.roleSelected]} 
                onPress={() => setRole("student")}
                accessibilityLabel="Select student role"
                accessibilityRole="button"
              >
                <Text style={[styles.roleText, role === "student" && styles.roleTextSelected]}>Student</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, role === "staff" && styles.roleSelected]} 
                onPress={() => setRole("staff")}
                accessibilityLabel="Select staff role"
                accessibilityRole="button"
              >
                <Text style={[styles.roleText, role === "staff" && styles.roleTextSelected]}>Staff</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.input} 
              placeholder="Email" 
              autoCapitalize="none" 
              keyboardType="email-address" 
              value={email} 
              onChangeText={setEmail} 
              placeholderTextColor="#999" 
              accessibilityLabel="Email input"
            />
            
            <View style={styles.passwordContainer}>
              <TextInput 
                style={styles.passwordInput} 
                placeholder="Password" 
                secureTextEntry={!showPassword}
                value={password} 
                onChangeText={setPassword} 
                placeholderTextColor="#999"
                accessibilityLabel="Password input"
              />
              <TouchableOpacity 
                style={styles.showPasswordBtn}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={onEmailLogin} 
              disabled={isSubmitting}
              accessibilityLabel="Sign in"
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{isSubmitting ? "Signing in..." : "Sign In"}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.googleBtn, (!request) && styles.buttonDisabled]} 
              onPress={() => promptAsync()} 
              disabled={!request}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
            >
              <Image 
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }} 
                style={styles.googleIcon} 
              />
              <Text style={styles.googleBtnText}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            <Text 
              style={styles.link} 
              onPress={() => router.push("/(auth)/signup")}
              accessibilityRole="link"
            >
              New to UniSafe? Sign up
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardAvoid: {
    flex: 1,
  },
  container: { 
    flex: 1, 
    padding: 24, 
    backgroundColor: "#f8fafc", 
    justifyContent: "space-between" 
  },
  hero: { 
    alignItems: "center", 
    marginTop: 40 
  },
  logo: { 
    width: 140, 
    height: 140, 
    marginBottom: 16, 
    borderRadius: 70, 
    overflow: "hidden" 
  },
  title: { 
    fontSize: 34, 
    fontWeight: "800", 
    letterSpacing: 0.5, 
    color: "#0f172a", 
    marginBottom: 6 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#475569", 
    textAlign: "center", 
    marginHorizontal: 16 
  },
  cta: { 
    alignItems: "center", 
    marginBottom: 40 
  },
  roleRow: { 
    flexDirection: "row", 
    gap: 10, 
    marginBottom: 12 
  },
  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 9999,
    alignItems: "center",
  },
  roleSelected: { 
    borderColor: "#1e40af", 
    backgroundColor: "#e0e7ff" 
  },
  roleText: { 
    color: "#334155", 
    fontWeight: "600" 
  },
  roleTextSelected: { 
    color: "#1e40af" 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "100%",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  showPasswordBtn: {
    position: "absolute",
    right: 10,
    padding: 5,
  },
  showPasswordText: {
    color: "#1e40af",
    fontWeight: "600",
  },
  primaryBtn: {
    backgroundColor: "#1e40af",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  primaryBtnText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16 
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginBottom: 12,
    width: "100%",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleBtnText: { 
    color: "#111", 
    fontWeight: "600", 
    fontSize: 16 
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  link: { 
    color: "#1e40af", 
    fontWeight: "600", 
    fontSize: 14, 
    marginTop: 8 
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});