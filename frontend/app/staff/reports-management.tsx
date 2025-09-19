import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
  Dimensions,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import StandardHeader from '../../components/StandardHeader';
import * as DocumentPicker from 'expo-document-picker';

const { width } = Dimensions.get('window');

interface Report {
  id: string;
  type: 'Theft' | 'Harassment' | 'Accident' | 'Suspicious Activity' | 'Fire' | 'Medical Emergency' | 'Other';
  description: string;
  location: string;
  reportedById: number;
  reporterName: string;
  status: 'Pending' | 'Under Review' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  details: any;
  evidence: string[];
  evidenceMedia?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    filename: string;
  }>;
  coordinatesLat?: number;
  coordinatesLng?: number;
  anonymous: boolean;
  contactPreference: 'Email' | 'Phone' | 'None';
  contactEmail?: string;
  contactPhone?: string;
  emergencyServicesCalled?: boolean;
  emergencyServicesInvolved?: string[];
  emergencyServicesReferenceNumber?: string;
  followUpAssignedTo?: number | null;
  followUpNotes: Array<{
    note: string;
    addedBy: number;
    addedAt: Date;
    addedByName: string;
    attachments?: Array<{
      id: string;
      name: string;
      uri: string;
      type: string;
      size: number;
    }>;
  }>;
  followUpResolution?: string;
  followUpResolutionDate?: Date;
  followUpResolutionAttachments?: Array<{
    id: string;
    name: string;
    uri: string;
    type: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

interface ReportStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
  criticalPriority: number;
}

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
    highPriority: 0,
    criticalPriority: 0,
  });
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Media viewer states
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  
  // Additional modal states
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [assignStaffModalVisible, setAssignStaffModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [resolutionModalVisible, setResolutionModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  
  // File attachment states
  const [noteAttachments, setNoteAttachments] = useState<Array<{
    id: string;
    name: string;
    uri: string;
    type: string;
    size: number;
  }>>([]);
  const [resolutionAttachments, setResolutionAttachments] = useState<Array<{
    id: string;
    name: string;
    uri: string;
    type: string;
    size: number;
  }>>([]);

  const reportTypes = ['All', 'Theft', 'Harassment', 'Accident', 'Suspicious Activity', 'Fire', 'Medical Emergency', 'Other'];
  const statusOptions = ['All', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Closed'];
  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Critical'];

  // Mock staff data
  const staffMembers = [
    { id: 5678, name: 'Officer Smith', department: 'Security' },
    { id: 6789, name: 'Nurse Johnson', department: 'Health Services' },
    { id: 7890, name: 'Dr. Wilson', department: 'Administration' },
    { id: 8901, name: 'Counselor Davis', department: 'Student Services' },
    { id: 9012, name: 'Officer Brown', department: 'Security' },
  ];

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchQuery, selectedType, selectedStatus, selectedPriority]);

  const loadReports = async () => {
    try {
      setRefreshing(true);
      // TODO: Replace with actual API call
      const mockReports: Report[] = [
        {
          id: '1',
          type: 'Theft',
          description: 'Laptop stolen from the library study area on the 3rd floor. Security cameras may have captured the incident.',
          location: 'Main Library, 3rd Floor Study Area',
          reportedById: 1234,
          reporterName: 'John Doe',
          status: 'Under Review',
          priority: 'High',
          details: { timeOfIncident: '2024-03-15 14:30' },
          evidence: [],
          evidenceMedia: [
            {
              id: '1',
              type: 'image',
              url: 'https://picsum.photos/400/300?random=1',
              filename: 'photo_evidence_1.jpg'
            },
            {
              id: '2',
              type: 'video',
              url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_640x360_1mb.mp4',
              thumbnail: 'https://picsum.photos/400/300?random=2',
              filename: 'security_footage_1.mp4'
            },
            {
              id: '3',
              type: 'image',
              url: 'https://picsum.photos/400/300?random=3',
              filename: 'area_photo.jpg'
            }
          ],
          coordinatesLat: 3.1390,
          coordinatesLng: 101.6869,
          anonymous: false,
          contactPreference: 'Email',
          contactEmail: 'john.doe@university.edu',
          emergencyServicesCalled: false,
          followUpAssignedTo: 5678,
          followUpNotes: [
            {
              note: 'Initial investigation started. Reviewing security footage.',
              addedBy: 5678,
              addedByName: 'Officer Smith',
              addedAt: new Date('2024-03-15T15:00:00'),
            }
          ],
          createdAt: new Date('2024-03-15T14:45:00'),
          updatedAt: new Date('2024-03-15T15:00:00'),
        },
        {
          id: '2',
          type: 'Medical Emergency',
          description: 'Student collapsed during physical education class. Ambulance was called immediately.',
          location: 'Sports Complex, Gymnasium A',
          reportedById: 2345,
          reporterName: 'Jane Smith',
          status: 'Resolved',
          priority: 'Critical',
          details: { timeOfIncident: '2024-03-14 10:15' },
          evidence: [],
          coordinatesLat: 3.1395,
          coordinatesLng: 101.6875,
          anonymous: false,
          contactPreference: 'Phone',
          contactPhone: '+1 (555) 123-4567',
          emergencyServicesCalled: true,
          emergencyServicesInvolved: ['Ambulance', 'Campus Health Center'],
          emergencyServicesReferenceNumber: 'AMB-2024-0314-001',
          followUpAssignedTo: 6789,
          followUpNotes: [
            {
              note: 'Student transported to hospital. Parents notified.',
              addedBy: 6789,
              addedByName: 'Nurse Johnson',
              addedAt: new Date('2024-03-14T10:30:00'),
            },
            {
              note: 'Student recovered fully. Heat exhaustion confirmed.',
              addedBy: 6789,
              addedByName: 'Nurse Johnson',
              addedAt: new Date('2024-03-14T16:00:00'),
            }
          ],
          followUpResolution: 'Student made full recovery. Heat exhaustion due to dehydration. Preventive measures discussed with PE department.',
          followUpResolutionDate: new Date('2024-03-14T16:00:00'),
          createdAt: new Date('2024-03-14T10:20:00'),
          updatedAt: new Date('2024-03-14T16:00:00'),
          closedAt: new Date('2024-03-14T16:00:00'),
        },
        {
          id: '3',
          type: 'Suspicious Activity',
          description: 'Unknown individual taking photos of the computer lab equipment and asking detailed questions about security protocols.',
          location: 'Engineering Building, Computer Lab 202',
          reportedById: 3456,
          reporterName: 'Anonymous',
          status: 'In Progress',
          priority: 'Medium',
          details: { timeOfIncident: '2024-03-16 09:45' },
          evidence: [],
          coordinatesLat: 3.1385,
          coordinatesLng: 101.6880,
          anonymous: true,
          contactPreference: 'None',
          emergencyServicesCalled: false,
          followUpAssignedTo: 7890,
          followUpNotes: [
            {
              note: 'Security team investigating. Checking visitor logs.',
              addedBy: 7890,
              addedByName: 'Security Lead Williams',
              addedAt: new Date('2024-03-16T10:00:00'),
            }
          ],
          createdAt: new Date('2024-03-16T09:50:00'),
          updatedAt: new Date('2024-03-16T10:00:00'),
        },
        {
          id: '4',
          type: 'Harassment',
          description: 'Verbal harassment incident reported in the dormitory common area. Multiple witnesses present.',
          location: 'Student Dormitory Block A, Common Room',
          reportedById: 4567,
          reporterName: 'Sarah Johnson',
          status: 'Pending',
          priority: 'High',
          details: { timeOfIncident: '2024-03-16 20:30' },
          evidence: [],
          coordinatesLat: 3.1400,
          coordinatesLng: 101.6865,
          anonymous: false,
          contactPreference: 'Email',
          contactEmail: 'sarah.johnson@university.edu',
          emergencyServicesCalled: false,
          followUpAssignedTo: null,
          followUpNotes: [],
          createdAt: new Date('2024-03-16T21:00:00'),
          updatedAt: new Date('2024-03-16T21:00:00'),
        }
      ];

      setReports(mockReports);
      calculateStats(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const calculateStats = (reportsList: Report[]) => {
    const stats: ReportStats = {
      total: reportsList.length,
      pending: reportsList.filter(r => r.status === 'Pending').length,
      inProgress: reportsList.filter(r => ['Under Review', 'In Progress'].includes(r.status)).length,
      resolved: reportsList.filter(r => ['Resolved', 'Closed'].includes(r.status)).length,
      highPriority: reportsList.filter(r => r.priority === 'High').length,
      criticalPriority: reportsList.filter(r => r.priority === 'Critical').length,
    };
    setStats(stats);
  };

  const filterReports = () => {
    let filtered = [...reports];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'All') {
      filtered = filtered.filter(report => report.type === selectedType);
    }

    // Status filter
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }

    // Priority filter
    if (selectedPriority !== 'All') {
      filtered = filtered.filter(report => report.priority === selectedPriority);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredReports(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#FF9500';
      case 'Under Review': return '#007AFF';
      case 'In Progress': return '#5856D6';
      case 'Resolved': return '#4CAF50';
      case 'Closed': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return '#FF3B30';
      case 'High': return '#FF9500';
      case 'Medium': return '#FFCC02';
      case 'Low': return '#4CAF50';
      default: return '#8E8E93';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'warning';
      case 'High': return 'alert-circle';
      case 'Medium': return 'information-circle';
      case 'Low': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const openReportDetail = (report: Report) => {
    setSelectedReport(report);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedReport(null);
  };

  const openImageViewer = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl('');
  };

  const onRefresh = () => {
    loadReports();
  };

  // File picker functions
  const pickDocumentForNote = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map(asset => ({
          id: Date.now().toString() + Math.random(),
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
        setNoteAttachments(prev => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const pickDocumentForResolution = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map(asset => ({
          id: Date.now().toString() + Math.random(),
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || 'application/octet-stream',
          size: asset.size || 0,
        }));
        setResolutionAttachments(prev => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const removeNoteAttachment = (attachmentId: string) => {
    setNoteAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const removeResolutionAttachment = (attachmentId: string) => {
    setResolutionAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return 'image';
    if (type.includes('video')) return 'videocam';
    if (type.includes('audio')) return 'musical-notes';
    if (type.includes('pdf')) return 'document-text';
    if (type.includes('word') || type.includes('doc')) return 'document';
    if (type.includes('excel') || type.includes('sheet')) return 'grid';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'easel';
    return 'document-attach';
  };

  const submitNote = async () => {
    if (selectedReport && noteText.trim()) {
      await addFollowUpNote(selectedReport.id, noteText.trim(), noteAttachments);
      setNoteModalVisible(false);
      setNoteText('');
      setNoteAttachments([]);
    }
  };

  // Handle adding note
  const handleAddNote = (report: Report) => {
    setSelectedReport(report);
    setNoteModalVisible(true);
    setNoteText('');
    setNoteAttachments([]);
  };

  // Handle staff assignment
  const handleAssignStaff = (report: Report) => {
    setSelectedReport(report);
    setAssignStaffModalVisible(true);
  };

  const assignStaffToReport = async (staffId: number) => {
    if (selectedReport) {
      try {
        // TODO: Replace with actual API call
        const updatedReports = reports.map(report => 
          report.id === selectedReport.id 
            ? { ...report, followUpAssignedTo: staffId, updatedAt: new Date() }
            : report
        );
        setReports(updatedReports);
        
        // Update selected report if it's currently displayed
        if (selectedReport) {
          setSelectedReport({ ...selectedReport, followUpAssignedTo: staffId, updatedAt: new Date() });
        }
        
        setAssignStaffModalVisible(false);
        Alert.alert('Success', 'Staff member assigned successfully');
      } catch (error) {
        console.error('Error assigning staff:', error);
        Alert.alert('Error', 'Failed to assign staff member');
      }
    }
  };

  // Handle status change
  const handleStatusChange = (report: Report) => {
    setSelectedReport(report);
    setStatusModalVisible(true);
  };

  const updateStatus = async (newStatus: string) => {
    if (selectedReport) {
      if (newStatus === 'Resolved') {
        // Show resolution text input modal
        setPendingStatus(newStatus);
        setStatusModalVisible(false);
        setResolutionModalVisible(true);
        setResolutionText('');
        setResolutionAttachments([]);
      } else {
        await updateReportStatus(selectedReport.id, newStatus);
        setStatusModalVisible(false);
      }
    }
  };

  const submitResolution = async () => {
    if (selectedReport && pendingStatus && resolutionText.trim()) {
      await updateReportStatus(selectedReport.id, pendingStatus, resolutionText.trim(), resolutionAttachments);
      setResolutionModalVisible(false);
      setResolutionText('');
      setResolutionAttachments([]);
      setPendingStatus('');
    } else {
      Alert.alert('Required', 'Please provide resolution details before marking the report as resolved.');
    }
  };

  // Update report status
  const updateReportStatus = async (reportId: string, newStatus: string, resolution?: string, resolutionAttachments?: Array<{
    id: string;
    name: string;
    uri: string;
    type: string;
    size: number;
  }>) => {
    try {
      // TODO: Replace with actual API call
      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              status: newStatus as any, 
              updatedAt: new Date(),
              ...(resolution && newStatus === 'Resolved' && {
                followUpResolution: resolution,
                followUpResolutionDate: new Date(),
                closedAt: new Date(),
                followUpResolutionAttachments: resolutionAttachments || []
              })
            }
          : report
      );
      setReports(updatedReports);
      
      // Update selected report if it's currently displayed
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ 
          ...selectedReport, 
          status: newStatus as any, 
          updatedAt: new Date(),
          ...(resolution && newStatus === 'Resolved' && {
            followUpResolution: resolution,
            followUpResolutionDate: new Date(),
            closedAt: new Date(),
            followUpResolutionAttachments: resolutionAttachments || []
          })
        });
      }
      
      Alert.alert('Success', newStatus === 'Resolved' ? 'Report resolved successfully' : 'Report status updated successfully');
    } catch (error) {
      console.error('Error updating report status:', error);
      Alert.alert('Error', 'Failed to update report status');
    }
  };

  // Add follow-up note
  const addFollowUpNote = async (reportId: string, note: string, attachments?: Array<{
    id: string;
    name: string;
    uri: string;
    type: string;
    size: number;
  }>) => {
    try {
      // TODO: Replace with actual API call
      const newNote = {
        note,
        addedBy: 1, // Current user ID
        addedByName: 'Current User', // Current user name
        addedAt: new Date(),
        attachments: attachments || [],
      };

      const updatedReports = reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              followUpNotes: [...report.followUpNotes, newNote],
              updatedAt: new Date()
            }
          : report
      );
      setReports(updatedReports);
      
      // Update selected report if it's currently displayed
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ 
          ...selectedReport, 
          followUpNotes: [...selectedReport.followUpNotes, newNote],
          updatedAt: new Date()
        });
      }
      
      Alert.alert('Success', 'Follow-up note added successfully');
    } catch (error) {
      console.error('Error adding follow-up note:', error);
      Alert.alert('Error', 'Failed to add follow-up note');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <StandardHeader 
        title="Reports Management" 
        rightIcon="filter"
        onRightPress={() => setShowFilters(!showFilters)}
        theme="blue"
        showBackButton={false}
        showLogo={true}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#007AFF15' }]}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FF950015' }]}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#5856D615' }]}>
              <Text style={styles.statNumber}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#4CAF5015' }]}>
              <Text style={styles.statNumber}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#8E8E93" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search reports..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#8E8E93"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Type:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {reportTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterChip,
                        selectedType === type && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedType(type)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedType === type && styles.filterChipTextActive
                      ]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {statusOptions.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.filterChip,
                        selectedStatus === status && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedStatus(status)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedStatus === status && styles.filterChipTextActive
                      ]}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Priority:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {priorityOptions.map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.filterChip,
                        selectedPriority === priority && styles.filterChipActive
                      ]}
                      onPress={() => setSelectedPriority(priority)}
                    >
                      <Text style={[
                        styles.filterChipText,
                        selectedPriority === priority && styles.filterChipTextActive
                      ]}>
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        )}

        {/* Reports List */}
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>
            Reports ({filteredReports.length})
          </Text>
          
          {filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateText}>No reports found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          ) : (
            filteredReports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => openReportDetail(report)}
              >
                <View style={styles.reportHeader}>
                  <View style={styles.reportTypeContainer}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(report.priority) }]} />
                    <Text style={styles.reportType}>{report.type}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(report.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                      {report.status}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.reportDescription} numberOfLines={2}>
                  {report.description}
                </Text>
                
                <View style={styles.reportMeta}>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color="#8E8E93" />
                    <Text style={styles.locationText} numberOfLines={1}>
                      {report.location}
                    </Text>
                  </View>
                  <Text style={styles.reportDate}>
                    {formatDate(report.createdAt)}
                  </Text>
                </View>
                
                <View style={styles.reportFooter}>
                  <View style={styles.reporterInfo}>
                    <Ionicons name="person-outline" size={14} color="#8E8E93" />
                    <Text style={styles.reporterText}>
                      {report.anonymous ? 'Anonymous' : report.reporterName}
                    </Text>
                  </View>
                  <View style={styles.priorityContainer}>
                    <Ionicons 
                      name={getPriorityIcon(report.priority)} 
                      size={14} 
                      color={getPriorityColor(report.priority)} 
                    />
                    <Text style={[styles.priorityText, { color: getPriorityColor(report.priority) }]}>
                      {report.priority}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Report Detail Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Report Details</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          {selectedReport && (
            <ScrollView style={styles.modalContent}>
              {/* Report Header */}
              <View style={styles.modalReportHeader}>
                <View style={styles.modalReportTypeContainer}>
                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(selectedReport.priority) }]} />
                  <Text style={styles.modalReportType}>{selectedReport.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReport.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(selectedReport.status) }]}>
                    {selectedReport.status}
                  </Text>
                </View>
              </View>

              {/* Priority and ID */}
              <View style={styles.modalMetaRow}>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalLabel}>Report ID</Text>
                  <Text style={styles.modalValue}>#{selectedReport.id}</Text>
                </View>
                <View style={styles.modalMetaItem}>
                  <Text style={styles.modalLabel}>Priority</Text>
                  <View style={styles.priorityContainer}>
                    <Ionicons 
                      name={getPriorityIcon(selectedReport.priority)} 
                      size={16} 
                      color={getPriorityColor(selectedReport.priority)} 
                    />
                    <Text style={[styles.priorityText, { color: getPriorityColor(selectedReport.priority), marginLeft: 4 }]}>
                      {selectedReport.priority}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Description</Text>
                <Text style={styles.modalDescription}>{selectedReport.description}</Text>
              </View>

              {/* Location */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Location</Text>
                <View style={styles.locationContainer}>
                  <Ionicons name="location" size={16} color="#007AFF" />
                  <Text style={styles.modalLocationText}>{selectedReport.location}</Text>
                </View>
                {selectedReport.coordinatesLat && selectedReport.coordinatesLng && (
                  <Text style={styles.coordinatesText}>
                    Coordinates: {selectedReport.coordinatesLat.toFixed(6)}, {selectedReport.coordinatesLng.toFixed(6)}
                  </Text>
                )}
              </View>

              {/* Reporter Information */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Reporter Information</Text>
                <View style={styles.reporterInfoContainer}>
                  <View style={styles.reporterInfoRow}>
                    <Text style={styles.modalLabel}>Reporter:</Text>
                    <Text style={styles.modalValue}>
                      {selectedReport.anonymous ? 'Anonymous' : selectedReport.reporterName}
                    </Text>
                  </View>
                  <View style={styles.reporterInfoRow}>
                    <Text style={styles.modalLabel}>Contact Information:</Text>
                    {selectedReport.anonymous ? (
                      <Text style={styles.modalValue}>Anonymous</Text>
                    ) : (
                      <View style={styles.contactValueContainer}>
                        {selectedReport.contactPreference === 'Email' && (
                          <View style={styles.contactItem}>
                            <Ionicons name="mail" size={16} color="#007AFF" style={styles.contactIcon} />
                            <Text style={styles.contactText} numberOfLines={2}>
                              {selectedReport.contactEmail || 'Email not provided'}
                            </Text>
                          </View>
                        )}
                        {selectedReport.contactPreference === 'Phone' && (
                          <View style={styles.contactItem}>
                            <Ionicons name="call" size={16} color="#34C759" style={styles.contactIcon} />
                            <Text style={styles.contactText} numberOfLines={1}>
                              {selectedReport.contactPhone || 'Phone not provided'}
                            </Text>
                          </View>
                        )}
                        {selectedReport.contactPreference === 'None' && (
                          <View style={styles.contactItem}>
                            <Ionicons name="ban" size={16} color="#8E8E93" style={styles.contactIcon} />
                            <Text style={styles.contactText}>No contact preferred</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={styles.reporterInfoRow}>
                    <Text style={styles.modalLabel}>Report Time:</Text>
                    <Text style={styles.modalValue}>{formatDate(selectedReport.createdAt)}</Text>
                  </View>
                </View>
              </View>

              {/* Evidence */}
              {selectedReport.evidenceMedia && selectedReport.evidenceMedia.length > 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Evidence</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
                    {selectedReport.evidenceMedia.map((mediaItem, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.mediaContainer}
                        onPress={() => openImageViewer(mediaItem.url)}
                      >
                        {mediaItem.type === 'image' ? (
                          <Image
                            source={{ uri: mediaItem.url }}
                            style={styles.mediaImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.videoThumbnailContainer}>
                            <Image
                              source={{ uri: mediaItem.thumbnail || 'https://picsum.photos/120/90?random=video' }}
                              style={styles.mediaImage}
                              resizeMode="cover"
                            />
                            <View style={styles.videoPlayIcon}>
                              <Ionicons name="play-circle" size={32} color="#fff" />
                            </View>
                          </View>
                        )}
                        <View style={styles.mediaOverlay}>
                          <Text style={styles.mediaTypeText}>{mediaItem.type.toUpperCase()}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Follow-up Notes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Follow-up Notes</Text>
                {selectedReport.followUpNotes && selectedReport.followUpNotes.length > 0 ? (
                  selectedReport.followUpNotes.map((note, index) => (
                    <View key={index} style={styles.noteItem}>
                      <View style={styles.noteHeader}>
                        <Text style={styles.noteAuthor}>{note.addedByName}</Text>
                        <Text style={styles.noteDate}>{formatDate(note.addedAt)}</Text>
                      </View>
                      <Text style={styles.noteText}>{note.note}</Text>
                      
                      {/* Note Attachments */}
                      {note.attachments && note.attachments.length > 0 && (
                        <View style={styles.noteAttachmentsContainer}>
                          <Text style={styles.noteAttachmentsTitle}>Attachments:</Text>
                          {note.attachments.map((attachment) => (
                            <TouchableOpacity 
                              key={attachment.id} 
                              style={styles.noteAttachmentItem}
                              onPress={() => {
                                // TODO: Open attachment
                                Alert.alert('Info', `Opening ${attachment.name}`);
                              }}
                            >
                              <Ionicons 
                                name={getFileIcon(attachment.type)} 
                                size={16} 
                                color="#007AFF" 
                              />
                              <Text style={styles.noteAttachmentName}>
                                {attachment.name}
                              </Text>
                              <Text style={styles.noteAttachmentSize}>
                                ({formatFileSize(attachment.size)})
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noNotesText}>No follow-up notes yet</Text>
                )}
              </View>

              {/* Resolution */}
              {selectedReport.followUpResolution && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Resolution</Text>
                  <Text style={styles.resolutionText}>{selectedReport.followUpResolution}</Text>
                  {selectedReport.followUpResolutionDate && (
                    <Text style={styles.resolutionDate}>
                      Resolved on: {formatDate(selectedReport.followUpResolutionDate)}
                    </Text>
                  )}
                  
                  {/* Resolution Attachments */}
                  {selectedReport.followUpResolutionAttachments && selectedReport.followUpResolutionAttachments.length > 0 && (
                    <View style={styles.noteAttachmentsContainer}>
                      <Text style={styles.noteAttachmentsTitle}>Supporting Documents:</Text>
                      {selectedReport.followUpResolutionAttachments.map((attachment) => (
                        <TouchableOpacity 
                          key={attachment.id} 
                          style={styles.noteAttachmentItem}
                          onPress={() => {
                            // TODO: Open attachment
                            Alert.alert('Info', `Opening ${attachment.name}`);
                          }}
                        >
                          <Ionicons 
                            name={getFileIcon(attachment.type)} 
                            size={16} 
                            color="#007AFF" 
                          />
                          <Text style={styles.noteAttachmentName}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.noteAttachmentSize}>
                            ({formatFileSize(attachment.size)})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity style={styles.actionButtonFull} onPress={() => handleStatusChange(selectedReport)}>
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Update Status</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButtonFull} onPress={() => handleAddNote(selectedReport)}>
                  <Ionicons name="add-circle" size={20} color="#007AFF" />
                  <Text style={styles.actionButtonText}>Add Note</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Media Viewer Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageViewerVisible}
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseButton}
            onPress={closeImageViewer}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.imageViewerContainer}>
            {selectedImageUrl.includes('.mp4') || selectedImageUrl.includes('video') || selectedImageUrl.includes('SampleVideo') ? (
              <Video
                source={{ uri: selectedImageUrl }}
                style={styles.fullScreenImage}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
              />
            ) : (
              <Image
                source={{ uri: selectedImageUrl }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={noteModalVisible}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setNoteModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Follow-up Note</Text>
            <TouchableOpacity onPress={submitNote} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.noteInputContainer}>
            <TextInput
              style={styles.noteTextInput}
              multiline
              numberOfLines={6}
              placeholder="Enter your follow-up note here..."
              value={noteText}
              onChangeText={setNoteText}
              textAlignVertical="top"
            />
            
            {/* File Attachments Section */}
            <View style={styles.attachmentSection}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentTitle}>Attachments</Text>
                <TouchableOpacity
                  style={styles.addAttachmentButton}
                  onPress={pickDocumentForNote}
                >
                  <Ionicons name="attach" size={16} color="#007AFF" />
                  <Text style={styles.addAttachmentText}>Add File</Text>
                </TouchableOpacity>
              </View>
              
              {noteAttachments.length > 0 && (
                <View style={styles.attachmentList}>
                  {noteAttachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Ionicons 
                          name={getFileIcon(attachment.type)} 
                          size={20} 
                          color="#007AFF" 
                        />
                        <View style={styles.attachmentDetails}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.attachmentSize}>
                            {formatFileSize(attachment.size)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeNoteAttachment(attachment.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Assign Staff Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={assignStaffModalVisible}
        onRequestClose={() => setAssignStaffModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAssignStaffModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Assign Staff</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.staffListContainer}>
            {staffMembers.map((staff) => (
              <TouchableOpacity
                key={staff.id}
                style={[
                  styles.staffItem,
                  selectedReport?.followUpAssignedTo === staff.id && styles.staffItemSelected
                ]}
                onPress={() => assignStaffToReport(staff.id)}
              >
                <View style={styles.staffInfo}>
                  <Ionicons name="person-circle" size={32} color="#007AFF" />
                  <View style={styles.staffDetails}>
                    <Text style={styles.staffName}>{staff.name}</Text>
                    <Text style={styles.staffDepartment}>{staff.department}</Text>
                  </View>
                </View>
                {selectedReport?.followUpAssignedTo === staff.id && (
                  <Ionicons name="checkmark" size={24} color="#34C759" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={statusModalVisible}
        onRequestClose={() => setStatusModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Status</Text>
            <View style={styles.modalHeaderSpacer} />
          </View>

          <ScrollView style={styles.statusListContainer}>
            {statusOptions.filter(status => status !== 'All').map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusItem,
                  selectedReport?.status === status && styles.statusItemSelected
                ]}
                onPress={() => updateStatus(status)}
              >
                <View style={styles.statusInfo}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text style={styles.statusText}>{status}</Text>
                </View>
                {selectedReport?.status === status && (
                  <Ionicons name="checkmark" size={24} color={getStatusColor(status)} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Resolution Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={resolutionModalVisible}
        onRequestClose={() => setResolutionModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setResolutionModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Resolution Details</Text>
            <TouchableOpacity onPress={submitResolution} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Resolve</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resolutionInputContainer}>
            <Text style={styles.resolutionLabel}>Please provide resolution details:</Text>
            <TextInput
              style={[styles.resolutionTextInput, { minHeight: 120 }]}
              multiline
              numberOfLines={6}
              placeholder="Describe how this report was resolved, actions taken, and any follow-up requirements..."
              value={resolutionText}
              onChangeText={setResolutionText}
              textAlignVertical="top"
            />
            
            {/* File Attachments Section */}
            <View style={styles.attachmentSection}>
              <View style={styles.attachmentHeader}>
                <Text style={styles.attachmentTitle}>Supporting Documents</Text>
                <TouchableOpacity
                  style={styles.addAttachmentButton}
                  onPress={pickDocumentForResolution}
                >
                  <Ionicons name="attach" size={16} color="#007AFF" />
                  <Text style={styles.addAttachmentText}>Add File</Text>
                </TouchableOpacity>
              </View>
              
              {resolutionAttachments.length > 0 && (
                <View style={styles.attachmentList}>
                  {resolutionAttachments.map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentItem}>
                      <View style={styles.attachmentInfo}>
                        <Ionicons 
                          name={getFileIcon(attachment.type)} 
                          size={20} 
                          color="#007AFF" 
                        />
                        <View style={styles.attachmentDetails}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.attachmentSize}>
                            {formatFileSize(attachment.size)}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeAttachmentButton}
                        onPress={() => removeResolutionAttachment(attachment.id)}
                      >
                        <Ionicons name="close-circle" size={20} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 12,
    color: '#000000',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  reportsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  reportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportDescription: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 12,
  },
  reportMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  reportDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reporterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  modalHeaderSpacer: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalReportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalReportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalReportType: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  modalMetaRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  modalMetaItem: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
  },
  modalLocationText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 8,
    flex: 1,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
  },
  reporterInfoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  reporterInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  emergencyServicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  evidenceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  evidenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  evidenceText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  noteDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  noteText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  noNotesText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  resolutionText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  resolutionDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'right',
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    marginTop: 16,
    marginBottom: 32,
    paddingHorizontal: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minWidth: 120,
  },
  actionButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    width: '100%',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  // Media styles
  mediaScrollView: {
    marginBottom: 12,
  },
  mediaContainer: {
    position: 'relative',
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: 120,
    height: 90,
    backgroundColor: '#F2F2F7',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaTypeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  // Video styles
  videoThumbnailContainer: {
    position: 'relative',
  },
  videoPlayIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
  },
  // Image Viewer styles
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  imageViewerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  // Note Modal styles
  modalSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteInputContainer: {
    flex: 1,
    padding: 20,
  },
  noteTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  // Staff Assignment Modal styles
  staffListContainer: {
    flex: 1,
    padding: 20,
  },
  staffItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  staffItemSelected: {
    borderColor: '#34C759',
    backgroundColor: '#F0FDF4',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  staffDetails: {
    marginLeft: 12,
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  staffDepartment: {
    fontSize: 14,
    color: '#8E8E93',
  },
  // Status Update Modal styles
  statusListContainer: {
    flex: 1,
    padding: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statusItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  // Resolution Modal styles
  resolutionInputContainer: {
    flex: 1,
    padding: 20,
  },
  resolutionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  resolutionTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 200,
  },
  // File attachment styles
  attachmentSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 16,
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  attachmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  addAttachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addAttachmentText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  attachmentList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
  },
  attachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  attachmentDetails: {
    marginLeft: 8,
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#8E8E93',
  },
  removeAttachmentButton: {
    padding: 4,
  },
  // Note attachment display styles
  noteAttachmentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  noteAttachmentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  noteAttachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    marginBottom: 4,
  },
  noteAttachmentName: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 6,
    flex: 1,
  },
  noteAttachmentSize: {
    fontSize: 10,
    color: '#8E8E93',
    marginLeft: 4,
  },
  contactInfoContainer: {
    flex: 1,
    marginLeft: 8,
  },
  modalValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    maxWidth: '70%',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
    flexShrink: 1,
  },
  contactIcon: {
    marginTop: 2,
    marginRight: 8,
    flexShrink: 0,
  },
  contactText: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '400',
    flex: 1,
    textAlign: 'right',
    lineHeight: 18,
  },
});
