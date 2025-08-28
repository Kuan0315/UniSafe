import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// Mock data for recent reports
const mockRecentReports = [
  {
    id: 1,
    type: 'theft',
    title: 'Phone stolen near Engineering Building',
    description: 'My phone was stolen while I was studying in the library. Last seen near the Engineering Building entrance.',
    location: 'Engineering Building',
    time: '2 hours ago',
    anonymous: false,
    author: 'John D.',
    upvotes: 12,
    comments: 5,
  },
  {
    id: 2,
    type: 'harassment',
    title: 'Verbal harassment near Library',
    description: 'Experienced verbal harassment from an unknown person while walking to the library.',
    location: 'Library',
    time: '1 hour ago',
    anonymous: true,
    author: 'Anonymous',
    upvotes: 8,
    comments: 3,
  },
  {
    id: 3,
    type: 'accident',
    title: 'Minor collision in parking lot',
    description: 'Minor car collision in the main parking lot. No injuries, but vehicles damaged.',
    location: 'Main Parking Lot',
    time: '30 mins ago',
    anonymous: false,
    author: 'Sarah M.',
    upvotes: 6,
    comments: 2,
  },
];

const reportTypes = [
  { key: 'theft', label: 'Theft', icon: 'briefcase-outline', color: '#FF9500' },
  { key: 'harassment', label: 'Harassment', icon: 'warning-outline', color: '#FF3B30' },
  { key: 'accident', label: 'Accident', icon: 'car-outline', color: '#007AFF' },
  { key: 'suspicious', label: 'Suspicious Activity', icon: 'eye-outline', color: '#FF6B35' },
  { key: 'fire', label: 'Fire', icon: 'flame-outline', color: '#FF2D55' },
  { key: 'medical', label: 'Medical Emergency', icon: 'medical-outline', color: '#FF3B30' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#8E8E93' },
];

export default function ReportScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [filteredReports, setFilteredReports] = useState(mockRecentReports);
  const [selectedDangerType, setSelectedDangerType] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showSortModal, setShowSortModal] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    filterAndSortReports(query, selectedDangerType, sortBy);
  };

  const handleDangerTypeFilter = (type) => {
    setSelectedDangerType(type);
    filterAndSortReports(searchQuery, type, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    filterAndSortReports(searchQuery, selectedDangerType, sort);
  };

  const filterAndSortReports = (query, dangerType, sort) => {
    let filtered = mockRecentReports;

    // Filter by search query
    if (query.trim() !== '') {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(query.toLowerCase()) ||
        report.description.toLowerCase().includes(query.toLowerCase()) ||
        report.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filter by danger type
    if (dangerType !== 'all') {
      filtered = filtered.filter(report => report.type === dangerType);
    }

    // Sort reports
    switch (sort) {
      case 'latest':
        filtered = [...filtered].sort((a, b) => new Date(b.time) - new Date(a.time));
        break;
      case 'hottest':
        filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'nearest':
        filtered = [...filtered].sort((a, b) => a.distance - b.distance);
        break;
      case 'most_commented':
        filtered = [...filtered].sort((a, b) => b.comments.length - a.comments.length);
        break;
    }

    setFilteredReports(filtered);
  };

  const handleCreateReport = () => {
    if (!selectedReportType || !reportDescription.trim() || !reportLocation.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // TODO: Submit report to backend
    Alert.alert(
      'Report Submitted',
      'Your report has been submitted successfully. Campus security has been notified.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowReportModal(false);
            resetForm();
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setSelectedReportType('');
    setReportDescription('');
    setReportLocation('');
    setIsAnonymous(false);
    setSelectedImage(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const getReportTypeInfo = (type) => {
    return reportTypes.find(rt => rt.key === type) || reportTypes[0];
  };

  const handleUpvote = (reportId) => {
    const updatedReports = filteredReports.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          upvotes: report.upvotes + 1,
          isUpvoted: !report.isUpvoted
        };
      }
      return report;
    });
    setFilteredReports(updatedReports);
    
    Alert.alert('Upvoted', 'Report marked as helpful!');
  };

  const handleComment = (reportId) => {
    Alert.prompt(
      'Add Comment',
      'Enter your comment:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: (comment) => {
            if (comment && comment.trim()) {
              const newComment = {
                id: Date.now(),
                text: comment.trim(),
                author: 'You',
                time: 'Just now'
              };
              
              const updatedReports = filteredReports.map(report => {
                if (report.id === reportId) {
                  return {
                    ...report,
                    comments: [...report.comments, newComment]
                  };
                }
                return report;
              });
              setFilteredReports(updatedReports);
              
              Alert.alert('Success', 'Comment posted successfully!');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports and comments..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Danger Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, selectedDangerType === 'all' && styles.filterChipActive]}
            onPress={() => handleDangerTypeFilter('all')}
          >
            <Text style={[styles.filterText, selectedDangerType === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {reportTypes.map((type) => (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterChip, selectedDangerType === type.key && styles.filterChipActive]}
              onPress={() => handleDangerTypeFilter(type.key)}
            >
              <Ionicons name={type.icon} size={16} color={selectedDangerType === type.key ? '#fff' : type.color} />
              <Text style={[styles.filterText, selectedDangerType === type.key && styles.filterTextActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Sort Options */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity style={styles.sortButton} onPress={() => setShowSortModal(true)}>
            <Text style={styles.sortButtonText}>
              {sortBy === 'latest' ? 'Latest' : 
               sortBy === 'hottest' ? 'Hottest' : 
               sortBy === 'nearest' ? 'Nearest' : 'Most Commented'}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Reports Feed */}
      <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Recent Reports</Text>
          <Text style={styles.feedSubtitle}>Stay informed about campus safety</Text>
        </View>

        {filteredReports.map((report) => {
          const typeInfo = getReportTypeInfo(report.type);
          return (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportTypeContainer}>
                  <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  <Text style={styles.reportType}>{typeInfo.label}</Text>
                </View>
                <Text style={styles.reportTime}>{report.time}</Text>
              </View>

              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDescription}>{report.description}</Text>
              
              <View style={styles.reportLocation}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>{report.location}</Text>
              </View>

              <View style={styles.reportFooter}>
                <View style={styles.reportAuthor}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.authorText}>{report.author}</Text>
                </View>

                <View style={styles.reportActions}>
                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleUpvote(report.id)}
                  >
                    <Ionicons name="arrow-up" size={16} color="#666" />
                    <Text style={styles.actionText}>{report.upvotes}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionButton} 
                    onPress={() => handleComment(report.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#666" />
                    <Text style={styles.actionText}>{report.comments}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <Text style={styles.sortModalTitle}>Sort Reports</Text>
            {[
              { key: 'latest', label: 'Latest First', icon: 'time' },
              { key: 'hottest', label: 'Most Upvoted', icon: 'flame' },
              { key: 'nearest', label: 'Nearest to You', icon: 'location' },
              { key: 'most_commented', label: 'Most Commented', icon: 'chatbubbles' }
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[styles.sortOption, sortBy === option.key && styles.sortOptionActive]}
                onPress={() => {
                  handleSortChange(option.key);
                  setShowSortModal(false);
                }}
              >
                <Ionicons name={option.icon} size={20} color={sortBy === option.key ? '#007AFF' : '#666'} />
                <Text style={[styles.sortOptionText, sortBy === option.key && styles.sortOptionTextActive]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelSortButton} onPress={() => setShowSortModal(false)}>
              <Text style={styles.cancelSortButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Report Button */}
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setShowReportModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.reportButtonText}>Report Incident</Text>
      </TouchableOpacity>

      {/* Report Creation Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Incident</Text>
            <TouchableOpacity onPress={handleCreateReport}>
              <Text style={styles.submitButton}>Submit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Report Type Selection */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Incident Type *</Text>
              <View style={styles.typeGrid}>
                {reportTypes.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      selectedReportType === type.key && styles.typeOptionSelected
                    ]}
                    onPress={() => setSelectedReportType(type.key)}
                  >
                    <Ionicons 
                      name={type.icon} 
                      size={24} 
                      color={selectedReportType === type.key ? '#fff' : type.color} 
                    />
                    <Text style={[
                      styles.typeLabel,
                      selectedReportType === type.key && styles.typeLabelSelected
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Description */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Description *</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe what happened in detail..."
                value={reportDescription}
                onChangeText={setReportDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Location *</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="Where did this happen?"
                value={reportLocation}
                onChangeText={setReportLocation}
                placeholderTextColor="#999"
              />
            </View>

            {/* Photo/Video Upload */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Photo/Video (Optional)</Text>
              <View style={styles.uploadContainer}>
                {selectedImage ? (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                    <TouchableOpacity 
                      style={styles.removeImageButton}
                      onPress={() => setSelectedImage(null)}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadButtons}>
                    <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                      <Ionicons name="camera" size={24} color="#007AFF" />
                      <Text style={styles.uploadButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                      <Ionicons name="images" size={24} color="#007AFF" />
                      <Text style={styles.uploadButtonText}>Choose Photo</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Anonymous Toggle */}
            <View style={styles.formSection}>
              <View style={styles.anonymousContainer}>
                <View>
                  <Text style={styles.sectionTitle}>Anonymous Report</Text>
                  <Text style={styles.anonymousSubtitle}>
                    Your identity will be hidden from other users
                  </Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ false: '#e1e5e9', true: '#007AFF' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  feedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feedHeader: {
    paddingVertical: 20,
  },
  feedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  feedSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  reportTime: {
    fontSize: 12,
    color: '#999',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  reportLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    margin: 20,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  reportButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  submitButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    width: '30%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    backgroundColor: '#f8f9fa',
  },
  typeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  typeLabelSelected: {
    color: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
    minHeight: 100,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },
  uploadContainer: {
    alignItems: 'center',
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  uploadButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
    minWidth: 120,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 8,
  },
  imagePreview: {
    position: 'relative',
    width: 200,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  anonymousContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  anonymousSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  sortOptionTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  cancelSortButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  cancelSortButtonText: {
    fontSize: 16,
    color: '#666',
  },
});


