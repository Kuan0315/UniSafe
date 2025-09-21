import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, ScrollView, Modal } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from "../../contexts/AuthContext";
import { University } from "../../types";

// Malaysian Universities Data
const MALAYSIAN_UNIVERSITIES: University[] = [
  {
    id: 'um',
    name: 'University of Malaya',
    location: { latitude: 3.1201, longitude: 101.6544 },
    center: { latitude: 3.1201, longitude: 101.6544 },
    coverageRadius: 2,
  },
  {
    id: 'upm',
    name: 'Universiti Putra Malaysia', 
    location: { latitude: 2.9447, longitude: 101.6904 },
    center: { latitude: 2.9447, longitude: 101.6904 },
    coverageRadius: 3,
  },
  {
    id: 'ukm',
    name: 'Universiti Kebangsaan Malaysia',
    location: { latitude: 2.9214, longitude: 101.7758 },
    center: { latitude: 2.9214, longitude: 101.7758 },
    coverageRadius: 2.5,
  },
  {
    id: 'utm',
    name: 'Universiti Teknologi Malaysia',
    location: { latitude: 1.5583, longitude: 103.6370 },
    center: { latitude: 1.5583, longitude: 103.6370 },
    coverageRadius: 4,
  },
  {
    id: 'usm',
    name: 'Universiti Sains Malaysia',
    location: { latitude: 5.3568, longitude: 100.3012 },
    center: { latitude: 5.3568, longitude: 100.3012 },
    coverageRadius: 3,
  },
  {
    id: 'utp',
    name: 'Universiti Teknologi PETRONAS',
    location: { latitude: 4.3896, longitude: 100.9740 },
    center: { latitude: 4.3896, longitude: 100.9740 },
    coverageRadius: 1.5,
  },
  {
    id: 'mmu',
    name: 'Multimedia University',
    location: { latitude: 2.9268, longitude: 101.8715 },
    center: { latitude: 2.9268, longitude: 101.8715 },
    coverageRadius: 2,
  },
  {
    id: 'taylor',
    name: "Taylor's University",
    location: { latitude: 3.0653, longitude: 101.6008 },
    center: { latitude: 3.0653, longitude: 101.6008 },
    coverageRadius: 1,
  }
];

export default function SignupScreen() {
  const router = useRouter();
  const { signup } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): string | null {
    if (!fullName.trim()) return "Full name is required";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!selectedUniversity) return "Please select your university";
    return null;
  }

  async function onSubmit() {
    const error = validate();
    if (error) {
      Alert.alert("Invalid input", error);
      return;
    }
    try {
      setIsSubmitting(true);
      await signup({
        email,
        password,
        name: fullName,
        role: 'student', // Default role for signup
        university: selectedUniversity!,
      });
      router.replace("/(tabs)/map");
    } catch (e: any) {
      Alert.alert("Sign up failed", e.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join your campus community</Text>
      </View>
      
      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#999"
      />

      {/* University Selector */}
      <TouchableOpacity
        style={styles.universitySelector}
        onPress={() => setShowUniversityModal(true)}
      >
        <Text style={[styles.universitySelectorText, !selectedUniversity && styles.placeholder]}>
          {selectedUniversity ? selectedUniversity.name : "Select your university"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={[styles.button, isSubmitting && styles.buttonDisabled]} onPress={onSubmit} disabled={isSubmitting}>
        <Text style={styles.buttonText}>{isSubmitting ? "Signing up..." : "Sign Up"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>

      {/* University Selection Modal */}
      <Modal
        visible={showUniversityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUniversityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your University</Text>
              <TouchableOpacity onPress={() => setShowUniversityModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.universityList}>
              {MALAYSIAN_UNIVERSITIES.map((university) => (
                <TouchableOpacity
                  key={university.id}
                  style={[
                    styles.universityItem,
                    selectedUniversity?.id === university.id && styles.universityItemSelected
                  ]}
                  onPress={() => {
                    setSelectedUniversity(university);
                    setShowUniversityModal(false);
                  }}
                >
                  <Text style={[
                    styles.universityItemText,
                    selectedUniversity?.id === university.id && styles.universityItemTextSelected
                  ]}>
                    {university.name}
                  </Text>
                  {selectedUniversity?.id === university.id && (
                    <Ionicons name="checkmark" size={20} color="#047857" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  universitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  universitySelectorText: {
    fontSize: 16,
    color: "#000",
  },
  placeholder: {
    color: "#999",
  },
  button: {
    backgroundColor: "#047857",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#1e40af",
    textAlign: "center",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  universityList: {
    maxHeight: 400,
  },
  universityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  universityItemSelected: {
    backgroundColor: '#f0f9ff',
  },
  universityItemText: {
    fontSize: 16,
    color: '#333',
  },
  universityItemTextSelected: {
    color: '#047857',
    fontWeight: '600',
  },
});


