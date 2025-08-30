import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GeofencingService, { University } from '../services/GeofencingService';

interface UniversitySelectorProps {
  onUniversityChange: (university: University) => void;
  currentUniversity: University | null;
}

export default function UniversitySelector({ 
  onUniversityChange, 
  currentUniversity 
}: UniversitySelectorProps) {
  const [showModal, setShowModal] = useState(false);
  const universities = GeofencingService.getAvailableUniversities();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return universities;
    const q = query.toLowerCase();
    return universities.filter(u =>
      u.name.toLowerCase().includes(q)
    );
  }, [query, universities]);

  const handleUniversitySelect = (university: University) => {
    const success = GeofencingService.setUniversity(university.id);
    if (success) {
      onUniversityChange(university);
      setShowModal(false);
      Alert.alert(
        'University Set',
        `${university.name} has been set as your campus.\n\nCoverage: 10km radius from campus center.\n\nYou will now receive location-based safety alerts.`
      );
    } else {
      Alert.alert('Error', 'Failed to set university. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.selectorContent}>
          <Ionicons name="school" size={20} color="#007AFF" />
          <Text style={styles.selectorText}>
            {currentUniversity ? currentUniversity.name : 'Select University'}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      {currentUniversity && (
        <View style={styles.coverageInfo}>
          <Ionicons name="location" size={16} color="#34C759" />
          <Text style={styles.coverageText}>
            Coverage: 10km from {currentUniversity.name}
          </Text>
        </View>
      )}

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your University</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Search university (e.g., UM, MMU, UKM)"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              autoFocus
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item: university }) => (
                <TouchableOpacity
                  style={[
                    styles.universityItem,
                    currentUniversity?.id === university.id && styles.universityItemActive
                  ]}
                  onPress={() => handleUniversitySelect(university)}
                >
                  <View style={styles.universityInfo}>
                    <Text style={styles.universityName}>{university.name}</Text>
                    <Text style={styles.universityLocation}>
                      {university.center.latitude.toFixed(4)}, {university.center.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.universityStatus}>
                    {currentUniversity?.id === university.id ? (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              style={styles.universityList}
              keyboardShouldPersistTaps="handled"
            />

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                Coverage area: 10km radius from campus center
              </Text>
              <Text style={styles.modalFooterSubtext}>
                • Campus area: Direct to security office
              </Text>
              <Text style={styles.modalFooterSubtext}>
                • Coverage area: To emergency contacts
              </Text>
              <Text style={styles.modalFooterSubtext}>
                • Outside coverage: App disabled
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  coverageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coverageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
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
    maxHeight: '80%',
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
    color: '#333',
  },
  universityList: {
    maxHeight: 300,
  },
  universityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  universityItemActive: {
    backgroundColor: '#f0f8ff',
  },
  universityInfo: {
    flex: 1,
  },
  universityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  universityLocation: {
    fontSize: 14,
    color: '#666',
  },
  universityStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalFooterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalFooterSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});
