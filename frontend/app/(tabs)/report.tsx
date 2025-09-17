import React, { useState, useEffect, useRef, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import * as ExpoAudio from "expo-audio";
import { useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
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
  BackHandler,
  ActivityIndicator,
} from 'react-native';

import * as ImagePicker from 'expo-image-picker';
import type { ComponentProps } from "react";
import { startRecording, stopRecording, convertSpeechToText } from '../../services/speech';

type IoniconsName = ComponentProps<typeof Ionicons>["name"];
import TextInputWithVoice from '../../components/TextInputWithVoice';
import { speakPageTitle, speakButtonAction } from '../../services/SpeechService';

type SortOption = {
  key: string;
  label: string;
  icon: IoniconsName;
};

const sortOptions: SortOption[] = [
  { key: "latest", label: "Latest First", icon: "time-outline" },
  { key: "hottest", label: "Most Upvoted", icon: "flame-outline" },
  { key: "nearest", label: "Nearest to You", icon: "location-outline" },
  { key: "most_commented", label: "Most Commented", icon: "chatbubbles-outline" },
];

{/*Add this utility function near the top of your component file*/ }
const formatTime = (timeString: string) => {
  const now = new Date();
  const time = new Date(timeString);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  }

  {/* For older dates, show the actual date */ }
  return time.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};
const now = new Date();


const mockRecentReports: Report[] = [
  {
    id: 1,
    type: 'theft',
    title: 'Phone stolen near Engineering Building',
    description: 'My phone was stolen while I was studying in the library. Last seen near the Engineering Building entrance.',
    location: 'Engineering Building',
    time: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    anonymous: false,
    author: 'John D.',
    upvotes: 12,
    isUpvoted: false,
    media: [
      { uri: 'https://cdn.shortpixel.ai/spai/q_lossy+ret_img+to_webp/https://www.blgwins.com/wp-content/uploads/2024/05/can-you-sue-your-boss-for-verbal-abuse.jpg', type: 'image' }
    ],
    comments: [
      {
        id: 1,
        author: 'Alice',
        text: 'So sorry this happened!',
        time: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        avatarUrl: 'https://i.pravatar.cc/40?img=1',
        liked: false,
        likes: 3
      },
      {
        id: 2,
        author: 'Bob',
        text: 'Be careful next time!',
        time: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        avatarUrl: 'https://i.pravatar.cc/40?img=2',
        liked: false,
        likes: 1
      },
    ],
  },
  {
    id: 2,
    type: 'harassment',
    title: 'Verbal harassment near Library',
    description: 'Experienced verbal harassment from an unknown person while walking to the library.',
    location: 'Library',
    time: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    anonymous: true,
    author: 'Anonymous',
    upvotes: 8,
    isUpvoted: false,
    media: [
      { uri: 'https://tse4.mm.bing.net/th/id/OIP.GHbi1-l_Vlcr1V62lawmLgHaE8?rs=1&pid=ImgDetMain&o=7&rm=3', type: 'image' }
    ],
    comments: [
      {
        id: 1,
        author: 'Anonymous',
        text: 'Stay safe!',
        time: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
        avatarUrl: 'https://i.pravatar.cc/40?img=3',
        liked: false,
        likes: 0
      },
    ],
  },
];

type Comment = {
  id: number;
  author: string;
  text: string;
  time: string;
  anonymous?: boolean;
  avatarUrl?: string;
  liked?: boolean;
  likes?: number;
  reported?: boolean;
  reportReason?: string;
  replies?: Comment[];
};

type Report = {
  id: number;
  type: string;
  title: string;
  description: string;
  location: string;
  time: string;
  anonymous: boolean;
  author: string;
  upvotes: number;
  isUpvoted: boolean;
  comments: Comment[];
  media?: { uri: string; type: "image" | "video" }[];
};

type ReportType = {
  key: string;
  label: string;
  icon: IoniconsName;
  color: string;
};

const reportTypes: ReportType[] = [
  { key: "theft", label: "Theft", icon: "briefcase", color: "#FF9500" },
  { key: "harassment", label: "Harassment", icon: "warning", color: "#FF3B30" },
  { key: "accident", label: "Accident", icon: "car", color: "#007AFF" },
  { key: "suspicious", label: "Suspicious Activity", icon: "eye", color: "#FF6B35" },
  { key: "fire", label: "Fire", icon: "flame", color: "#FF2D55" },
  { key: "medical", label: "Medical Emergency", icon: "medical", color: "#FF3B30" },
  { key: "other", label: "Other", icon: "ellipsis-horizontal", color: "#8E8E93" },
];

// Component for displaying media in main view
const MediaItem = ({ item }: { item: { uri: string; type: "image" | "video" } }) => {
  if (item.type === "video") {
    // Only create video player when needed
    const videoPlayer = useVideoPlayer({ uri: item.uri }, player => {
      player.loop = true;
    });
    
    return (
      <View style={styles.mediaItem}>
        <VideoView
          style={styles.mediaImage}
          player={videoPlayer}
          nativeControls={true}
          contentFit="cover"
        />
      </View>
    );
  } else {
    return (
      <View style={styles.mediaItem}>
        <Image source={{ uri: item.uri }} style={styles.mediaImage} />
      </View>
    );
  }
};

// Component for displaying media in preview section
const PreviewMediaItem = ({ item, removeMedia }: { 
  item: { uri: string; type: "image" | "video" }, 
  removeMedia: (uri: string) => void 
}) => {
  if (item.type === "video") {
    // Only create video player when needed
    const videoPlayer = useVideoPlayer({ uri: item.uri }, player => {
      player.loop = true;
    });
    
    return (
      <View style={styles.imagePreview}>
        <VideoView
          style={styles.previewImage}
          player={videoPlayer}
          nativeControls={true}
          contentFit="cover"
        />
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={() => removeMedia(item.uri)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  } else {
    return (
      <View style={styles.imagePreview}>
        <Image source={{ uri: item.uri }} style={styles.previewImage} />
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={() => removeMedia(item.uri)}
        >
          <Ionicons name="close-circle" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }
};

const MediaDisplay = ({ media }: { media: { uri: string; type: "image" | "video" }[] }) => {
  if (!media || media.length === 0) return null;

  return (
    <View style={styles.mediaContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScrollView}>
        {media.map((item, index) => (
          <MediaItem key={index} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};

export default function ReportScreen() {
  {/*Speak page title on load for accessibility*/ }
  useFocusEffect(
    useCallback(() => {
      speakPageTitle('Report Incidents');
    }, [])
  );
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLocation, setReportLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filteredReports, setFilteredReports] = useState(mockRecentReports);
  const [selectedDangerType, setSelectedDangerType] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyStates, setReplyStates] = useState<{
    [key: number]: {
      showReplies: boolean;
      replyText: string;
      isSubmitting?: boolean;
    }
  }>({});
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [reportReason, setReportReason] = useState<string>("");


  {/* Add the back button handler here - right after the first useEffect */ }
  useEffect(() => {
    const backAction = () => {
      if (showCommentModal) {
        setShowCommentModal(false);
        return true;
      }
      if (showReportModal) {
        setShowReportModal(false);
        return true;
      }
      if (showSortModal) {
        setShowSortModal(false);
        return true;
      }
      if (showSearchModal) {
        setShowSearchModal(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [showCommentModal, showReportModal, showSortModal, showSearchModal]);

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [processingSpeech, setProcessingSpeech] = useState(false);

  const recordingRef = useRef<any>(null);

  {/* Speech-to-text functions */ }
  const startSpeechToText = async () => {
    try {
      {/* Request permissions first */ }
      const { status } = await ExpoAudio.AudioModule.requestRecordingPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone access is needed for voice search');
        return;
      }

      setIsRecording(true);
      speakButtonAction('Listening... Speak now');

      {/* Start recording using the service function */ }
      const newRecording = await startRecording();
      recordingRef.current = newRecording;
      setRecording(newRecording);

    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
      setIsRecording(false);
    }
  };

  const stopSpeechToText = async () => {
    try {
      if (!recordingRef.current) {
        setIsRecording(false);
        return;
      }

      setIsRecording(false);
      setProcessingSpeech(true);

      {/* Stop recording and get the URI using the service function */ }
      const audioUri = await stopRecording(recordingRef.current);

      if (audioUri) {
        {/* Convert speech to text using the service function */ }
        const text = await convertSpeechToText(audioUri);
        setSearchQuery(text);
        speakButtonAction(`Heard: ${text}`);
      }

      setProcessingSpeech(false);
      recordingRef.current = null;
      setRecording(null);

    } catch (error) {
      console.error('Failed to process speech:', error);
      Alert.alert('Error', 'Failed to process speech. Please try again.');
      setProcessingSpeech(false);
      setIsRecording(false);
      recordingRef.current = null;
      setRecording(null);
    }
  };

  const handleMicPress = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  {/* Clean up on unmount */ }
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        stopRecording(recordingRef.current).catch(console.error);
      }
    };
  }, []);

  const handleCreateReport = () => {
    if (!selectedReportType || !reportDescription.trim() || !reportLocation.trim()) {
      speakButtonAction('Please fill in all required fields');
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    {/* Create new report object */ }
    const newReport: Report = {
      id: Date.now(),
      type: selectedReportType,
      title: reportDescription.split('.')[0] || 'New Report',
      description: reportDescription,
      location: reportLocation,
      time: new Date().toISOString(),
      anonymous: isAnonymous,
      author: isAnonymous ? 'Anonymous' : 'Current User',
      upvotes: 0,
      isUpvoted: false,
      comments: [],
      media: media
    };

    {/* Add to filtered reports */ }
    setFilteredReports(prev => [newReport, ...prev]);

    speakButtonAction('Report submitted successfully. Campus security has been notified.');

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


  {/* Toggle replies for a comment */ }
  const toggleReplies = (commentId: number) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        showReplies: !prev[commentId]?.showReplies,
        replyText: prev[commentId]?.replyText || "",
        isSubmitting: false,
      },
    }));
  };

  const updateReplyText = (commentId: number, text: string) => {
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        replyText: text,
      },
    }));
  };

  const handleComment = (reportId: number) => {
    setCurrentReportId(reportId);
    setNewComment("");
    setShowCommentModal(true);
  };

  const submitReply = (commentId: number) => {
    const replyText = replyStates[commentId]?.replyText;

    if (!replyText?.trim() || currentReportId === null) return;

    {/* Set submitting state */ }
    setReplyStates(prev => ({
      ...prev,
      [commentId]: { ...prev[commentId], isSubmitting: true }
    }));

    const updatedReports = filteredReports.map(report => {
      if (report.id === currentReportId) {
        const updatedComments = report.comments.map(comment => {
          if (comment.id === commentId) {
            const newReplies = comment.replies ? [...comment.replies] : [];
            newReplies.push({
              id: Date.now(),
              author: isAnonymous ? 'Anonymous' : 'You',
              text: replyText.trim(),
              time: new Date().toISOString(),
              anonymous: isAnonymous,
              avatarUrl: 'https://i.pravatar.cc/40?img=5',
              liked: false,
              likes: 0
            });
            return { ...comment, replies: newReplies };
          }
          return comment;
        });
        return { ...report, comments: updatedComments };
      }
      return report;
    });

    setFilteredReports(updatedReports);

    {/* Clear reply text and reset submitting state */ }
    setReplyStates(prev => ({
      ...prev,
      [commentId]: {
        ...prev[commentId],
        replyText: "",
        isSubmitting: false
      }
    }));
  };

  const handleLikeComment = (reportId: number, commentId: number) => {
    const updatedReports = filteredReports.map(report => {
      if (report.id === reportId) {
        const updatedComments = report.comments.map(comment => {
          if (comment.id === commentId) {
            const increment = comment.liked ? -1 : 1;
            return {
              ...comment,
              liked: !comment.liked,
              likes: (comment.likes || 0) + increment
            };
          }
          return comment;
        });
        return { ...report, comments: updatedComments };
      }
      return report;
    });
    setFilteredReports(updatedReports);
  };



  {/* When user clicks "Report" */ }
  const handleReportClick = (commentId: number) => {
    setSelectedCommentId(commentId);
    setReportModalVisible(true);
  };

  {/* Submit the report */ }
  const submitReport = () => {
    if (!reportReason.trim() || selectedCommentId === null) return;

    const updatedReports = filteredReports.map(report => {
      if (report.id === currentReportId) {
        return {
          ...report,
          comments: report.comments.map(c => {
            if (c.id === selectedCommentId) {
              return {
                ...c,
                reported: true,
                reportReason: reportReason,
              };
            }
            return c;
          }),
        };
      }
      return report;
    });

    setFilteredReports(updatedReports);
    setReportReason("");
    setSelectedCommentId(null);
    setReportModalVisible(false);
    Alert.alert("Reported", `You reported this comment: "${reportReason}"`);
  };



  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterAndSortReports(query, selectedDangerType, sortBy);
  };

  {/* Add a new function for saving searches */ }
  const saveSearch = () => {
    if (searchQuery.trim() !== '') {
      setRecentSearches(prev => {
        const filtered = prev.filter(item => item !== searchQuery);
        return [searchQuery, ...filtered].slice(0, 5);
      });
      {/* Perform the search */ }
      filterAndSortReports(searchQuery, selectedDangerType, sortBy);
    }
  };

  const removeRecentSearch = (index: number) => {
    setRecentSearches(prev => prev.filter((_, i) => i !== index));
  };

  const handleDangerTypeFilter = (type: string) => {
    setSelectedDangerType(type);
    filterAndSortReports(searchQuery, type, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    filterAndSortReports(searchQuery, selectedDangerType, sort);
  };

  {/* Replace filterAndSortReports with memoized version */ }
  const filterAndSortReports = useCallback((query: string, dangerType: string, sort: string) => {
    let filtered = mockRecentReports;

    if (query.trim() !== '') {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(query.toLowerCase()) ||
        report.description.toLowerCase().includes(query.toLowerCase()) ||
        report.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (dangerType !== 'all') {
      filtered = filtered.filter(report => report.type === dangerType);
    }

    switch (sort) {
      case 'latest':
        filtered = [...filtered].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        break;
      case 'hottest':
        filtered = [...filtered].sort((a, b) => b.upvotes - a.upvotes);
        break;
      case 'nearest':
        filtered = [...filtered].map(report => ({ ...report, distance: Math.random() * 10 }))
          .sort((a, b) => a.distance - b.distance);
        break;
      case 'most_commented':
        filtered = [...filtered].sort((a, b) => b.comments.length - a.comments.length);
        break;
    }

    setFilteredReports(filtered);
  }, [mockRecentReports]);

  const resetForm = () => {
    setSelectedReportType('');
    setReportDescription('');
    setReportLocation('');
    setIsAnonymous(false);
    setSelectedImage(null);
    setMedia([]);
  };

  {/* each item will look like: { uri: string, type: "image" | "video", ... } */ }
  const [media, setMedia] = useState<{ uri: string; type: "image" | "video" }[]>([]);

  {/* Helper function to add media */ }
  const addMedia = (newFiles: { uri: string; type: "image" | "video" }[]) => {
    if (media.length + newFiles.length > 5) {
      Alert.alert("Limit reached", "You can only attach up to 5 files.");
      return;
    }
    setMedia((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  {/* Take Photo */ }
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled) {
        addMedia([{ uri: result.assets[0].uri, type: "image" }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  {/* Take Video */ }
  const takeVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      addMedia([{ uri: result.assets[0].uri, type: "video" }]);
    }
  };

  {/* Pick from Library */ }
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newFiles: { uri: string; type: "image" | "video" }[] = result.assets.map((a) => ({
        uri: a.uri,
        type: a.type?.startsWith("video") ? "video" : "image",
      }));
      addMedia(newFiles);
    }
  };


  const removeMedia = (uri: string) => {
    setMedia((prev) => prev.filter((item) => item.uri !== uri));
  };

  const getReportTypeInfo = (type: string) => {
    return reportTypes.find(rt => rt.key === type) || reportTypes[0];
  };
  const handleUpvote = (reportId: number) => {
    const updatedReports = filteredReports.map(report => {
      if (report.id === reportId) {
        const increment = report.isUpvoted ? -1 : 1;
        return {
          ...report,
          upvotes: report.upvotes + increment,
          isUpvoted: !report.isUpvoted,
        };
      }
      return report;
    });
    setFilteredReports(updatedReports);
  };

  const submitComment = () => {
    if (!newComment.trim() || currentReportId === null) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }

    const updatedReports = filteredReports.map(report => {
      if (report.id === currentReportId) {
        return {
          ...report,
          comments: [
            ...report.comments,
            {
              id: Date.now(),
              author: isAnonymous ? 'Anonymous' : 'You',
              text: newComment.trim(),
              time: new Date().toISOString(),
              anonymous: isAnonymous,
              liked: false,
              likes: 0
            }
          ],
        };
      }
      return report;
    });

    setFilteredReports(updatedReports);
    setNewComment("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Recent Reports Feed */}
      <ScrollView style={styles.feedContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.feedHeader}>
          <View>
            <Text style={styles.feedTitle}>Recent Reports</Text>
            <Text style={styles.feedSubtitle}>Stay informed about campus safety</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowSearchModal(true)}
              style={styles.searchHeaderButton}
            >
              <Ionicons name="search-outline" size={24} color="#007AFF" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowSortModal(true)}>
              <Ionicons name="menu-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
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
        {filteredReports.map((report) => {
          const typeInfo = getReportTypeInfo(report.type);
          return (
            <View key={report.id} style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View style={styles.reportTypeContainer}>
                  <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                  <Text style={styles.reportType}>{typeInfo.label}</Text>
                </View>
                <Text style={styles.reportTime}>{formatTime(report.time)}</Text>
              </View>

              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDescription}>{report.description}</Text>

              {/* Media Display */}
              {report.media && report.media.length > 0 && (
                <MediaDisplay media={report.media} />
              )}

              <View style={styles.reportLocation}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.locationText}>{report.location}</Text>
              </View>

              <View style={styles.reportFooter}>
                <View style={styles.reportAuthor}>
                  <Ionicons name="person" size={16} color="#666" />
                  <Text style={styles.authorText}>{report.author}</Text>
                </View>
                <View style={styles.footerSpacer} />
                <View style={styles.reportActions}>
                  {/* Upvote Button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      report.isUpvoted && styles.actionButtonActive
                    ]}
                    onPress={() => handleUpvote(report.id)}
                  >
                    <Ionicons
                      name={report.isUpvoted ? "arrow-up" : "arrow-up-outline"}
                      size={16}
                      color={report.isUpvoted ? "#ffffff" : "#007AFF"}
                    />
                    <Text style={[
                      styles.actionText,
                      report.isUpvoted && styles.actionTextActive
                    ]}>
                      Helpful
                    </Text>
                    <Text style={[
                      styles.actionCount,
                      report.isUpvoted && styles.actionCountActive
                    ]}>
                      {report.upvotes}
                    </Text>
                  </TouchableOpacity>

                  {/* Comment Button */}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleComment(report.id)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
                    <Text style={styles.actionText}>Comment</Text>
                    <Text style={styles.actionCount}>{report.comments.length}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

      </ScrollView>
      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <SafeAreaView style={styles.searchModalContainer}>
          <View style={styles.searchModalHeader}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => {
                if (isRecording) stopSpeechToText();
                setSearchQuery('');
                filterAndSortReports('', selectedDangerType, sortBy);
                setShowSearchModal(false);
              }}
              style={styles.searchModalBackButton}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>

            {/* Extended search input container */}
            <View style={styles.searchModalInputContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchModalIcon} />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search reports, comments, locations..."
                style={styles.searchModalInput}
                autoFocus={true}
                onSubmitEditing={saveSearch}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholderTextColor="#999"
              />

              {searchQuery.length > 0 && !isRecording && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Voice-to-text button */}
            <TouchableOpacity
              onPress={handleMicPress}
              style={[
                styles.voiceSearchButton,
                isRecording && styles.voiceSearchButtonActive
              ]}
              disabled={processingSpeech}
            >
              {processingSpeech ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : isRecording ? (
                <Ionicons name="stop" size={24} color="#FF3B30" />
              ) : (
                <Ionicons name="mic" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>

            {/* Search button */}
            <TouchableOpacity
              onPress={saveSearch}
              style={styles.searchModalSearchButton}
            >
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Display recording state */}
            {isRecording && (
              <View style={styles.recordingContainer}>
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording... Speak now</Text>
                </View>
                <TouchableOpacity
                  onPress={stopSpeechToText}
                  style={styles.stopRecordingButton}
                >
                  <Text style={styles.stopRecordingText}>Stop Recording</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Display processing state */}
            {processingSpeech && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingText}>Processing your speech...</Text>
              </View>
            )}

            {/* Recent Searches (only show when not recording/processing) */}
            {recentSearches.length > 0 && !isRecording && !processingSpeech && (
              <View style={styles.recentSearchesContainer}>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => {
                      handleSearch(search);
                      setShowSearchModal(false);
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color="#666" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                    <TouchableOpacity
                      onPress={() => removeRecentSearch(index)}
                      style={styles.removeSearchButton}
                    >
                      <Ionicons name="close" size={16} color="#999" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Search Results (only show when not recording/processing) */}
            {searchQuery.length > 0 && filteredReports.length > 0 && !isRecording && !processingSpeech && (
              <View style={styles.searchResultsPreview}>
                <Text style={styles.searchResultsTitle}>
                  {filteredReports.length} result{filteredReports.length !== 1 ? 's' : ''} found
                </Text>
                {filteredReports.map((report) => {
                  const typeInfo = getReportTypeInfo(report.type);
                  return (
                    <View key={report.id} style={styles.searchResultCard}>
                      <View style={styles.reportHeader}>
                        <View style={styles.reportTypeContainer}>
                          <Ionicons name={typeInfo.icon} size={20} color={typeInfo.color} />
                          <Text style={styles.reportType}>{typeInfo.label}</Text>
                        </View>
                        <Text style={styles.reportTime}>{formatTime(report.time)}</Text>
                      </View>

                      <Text style={styles.reportTitle}>{report.title}</Text>
                      <Text style={styles.reportDescription}>{report.description}</Text>

                      {/* Media Display */}
                      {report.media && report.media.length > 0 && (
                        <MediaDisplay media={report.media} />
                      )}

                      <View style={styles.reportLocation}>
                        <Ionicons name="location" size={16} color="#666" />
                        <Text style={styles.locationText}>{report.location}</Text>
                      </View>

                      <View style={styles.reportFooter}>
                        <View style={styles.reportAuthor}>
                          <Ionicons name="person" size={16} color="#666" />
                          <Text style={styles.authorText}>{report.author}</Text>
                        </View>
                        <View style={styles.footerSpacer} />
                        <View style={styles.reportActions}>
                          {/* Upvote Button */}
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              report.isUpvoted && styles.actionButtonActive
                            ]}
                            onPress={() => handleUpvote(report.id)}
                          >
                            <Ionicons
                              name={report.isUpvoted ? "arrow-up" : "arrow-up-outline"}
                              size={16}
                              color={report.isUpvoted ? "#ffffff" : "#007AFF"}
                            />
                            <Text style={[
                              styles.actionText,
                              report.isUpvoted && styles.actionTextActive
                            ]}>
                              Helpful
                            </Text>
                            <Text style={[
                              styles.actionCount,
                              report.isUpvoted && styles.actionCountActive
                            ]}>
                              {report.upvotes}
                            </Text>
                          </TouchableOpacity>

                          {/* Comment Button */}
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => {
                              setCurrentReportId(report.id);
                              setShowCommentModal(true);
                              setShowSearchModal(false);
                            }}
                          >
                            <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
                            <Text style={styles.actionText}>Comment</Text>
                            <Text style={styles.actionCount}>{report.comments.length}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* No results message */}
            {searchQuery.length > 0 && filteredReports.length === 0 && !isRecording && !processingSpeech && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="search" size={48} color="#ccc" />
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>
                  Try different keywords or search for something else
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sortModalContent}>
            <Text style={styles.sortModalTitle}>Sort By</Text>

            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive
                ]}
                onPress={() => {
                  handleSortChange(option.key);
                  setShowSortModal(false);
                }}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={sortBy === option.key ? '#007AFF' : '#666'}
                />
                <Text style={[
                  styles.sortOptionText,
                  sortBy === option.key && styles.sortOptionTextActive
                ]}>
                  {option.label}
                </Text>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelSortButton}
              onPress={() => setShowSortModal(false)}
            >
              <Text style={styles.cancelSortButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCommentModal}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Comment List */}
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {currentReportId !== null &&
              (filteredReports.find(r => r.id === currentReportId)?.comments || []).map((comment) => {
                const replyState = replyStates[comment.id] || { showReplies: false, replyText: "" };

                return (
                  <View
                    key={comment.id}
                    style={{
                      flexDirection: "column",
                      marginBottom: 16,
                      backgroundColor: "#f1f1f1",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    {/* Comment Row */}
                    <View style={{ flexDirection: "row", marginBottom: 6 }}>
                      <Image
                        source={{
                          uri: comment.anonymous
                            ? "https://i.pravatar.cc/40?img=0"
                            : comment.avatarUrl || "https://i.pravatar.cc/40?img=5",
                        }}
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "600" }}>
                          {comment.anonymous ? "Anonymous" : comment.author}
                        </Text>
                        <Text>{comment.text}</Text>
                        <Text style={{ fontSize: 12, color: "#666" }}>{formatTime(comment.time)}</Text>
                        {/* Like / Report / Reply buttons */}
                        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                          <TouchableOpacity
                            onPress={() => handleLikeComment(currentReportId!, comment.id)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: comment.liked ? "#FF3B3020" : "#007AFF20",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: comment.liked ? "#FF3B30" : "#007AFF"
                            }}
                          >
                            <Ionicons
                              name={comment.liked ? "heart" : "heart-outline"}
                              size={16}
                              color={comment.liked ? "#FF3B30" : "#007AFF"}
                            />
                            <Text style={{
                              color: comment.liked ? "#FF3B30" : "#007AFF",
                              fontSize: 12,
                              fontWeight: '600'
                            }}>
                              Like {(comment.likes || 0) > 0 ? `(${comment.likes})` : ''}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleReportClick(comment.id)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#FF3B3020",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: "#FF3B30"
                            }}
                          >
                            <Ionicons name="flag-outline" size={16} color="#FF3B30" />
                            <Text style={{ color: "#FF3B30", fontSize: 12, fontWeight: '600' }}>Report</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => toggleReplies(comment.id)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                              backgroundColor: "#007AFF20",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 16,
                              borderWidth: 1,
                              borderColor: "#007AFF"
                            }}
                          >
                            <Ionicons name="chatbubble-outline" size={16} color="#007AFF" />
                            <Text style={{ color: "#007AFF", fontSize: 12, fontWeight: '600' }}>
                              {replyState.showReplies ? "Hide Replies" : "Reply"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* Replies Section */}
                    {replyState.showReplies &&
                      (comment.replies ?? []).map((reply) => (
                        <View
                          key={reply.id}
                          style={{
                            flexDirection: "row",
                            marginTop: 8,
                            marginLeft: 50,
                            padding: 8,
                            backgroundColor: "#e0e0e0",
                            borderRadius: 10,
                          }}
                        >
                          <Image
                            source={{
                              uri: reply.anonymous
                                ? "https://i.pravatar.cc/30?img=0"
                                : reply.avatarUrl || "https://i.pravatar.cc/30?img=6",
                            }}
                            style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: "600", fontSize: 12 }}>
                              {reply.anonymous ? "Anonymous" : reply.author}
                            </Text>
                            <Text style={{ fontSize: 12 }}>{reply.text}</Text>
                            <Text style={{ fontSize: 10, color: "#666" }}>{formatTime(reply.time)}</Text>
                          </View>
                        </View>
                      ))}

                    {/* Reply Input */}
                    {replyState.showReplies && (
                      <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 8,
                        marginLeft: 50
                      }}>
                        <TextInput
                          value={replyState.replyText}
                          onChangeText={(text) => updateReplyText(comment.id, text)}
                          placeholder="Write a reply..."
                          style={{
                            flex: 1,
                            borderWidth: 1,
                            borderColor: "#ddd",
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            marginRight: 8,
                            fontSize: 12,
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => submitReply(comment.id)}
                          disabled={replyState.isSubmitting}
                          style={{
                            backgroundColor: replyState.isSubmitting ? "#ccc" : "#007AFF",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 20,
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "600", fontSize: 12 }}>
                            {replyState.isSubmitting ? "Posting..." : "Post"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
          </ScrollView>

          {/* Main Comment Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderTopWidth: 1,
              borderColor: "#eee",
              padding: 8,
              backgroundColor: "#fff",
            }}
          >
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Write a comment..."
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginRight: 8,
              }}
            />
            <TouchableOpacity
              onPress={submitComment}
              style={{
                backgroundColor: "#007AFF",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600" }}>Post</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Report Comment Modal */}
      < Modal
        visible={reportModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setReportModalVisible(false)
        }
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <View style={{
            width: '80%',
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16
          }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
              Why are you reporting this comment?
            </Text>

            {["Spam", "Offensive", "Harassment", "Other"].map(reason => (
              <TouchableOpacity
                key={reason}
                onPress={() => setReportReason(reason)}
                style={{
                  padding: 10,
                  backgroundColor: reportReason === reason ? '#007AFF' : '#f1f1f1',
                  borderRadius: 8,
                  marginBottom: 8
                }}
              >
                <Text style={{
                  color: reportReason === reason ? '#fff' : '#000'
                }}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={{ marginRight: 12 }}
              >
                <Text style={{ color: '#007AFF' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitReport}>
                <Text style={{ color: '#FF3B30' }}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal >



      {/* Report Button */}
      < TouchableOpacity
        style={styles.reportButton}
        onPress={() => setShowReportModal(true)}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.reportButtonText}>Report Incident</Text>
      </TouchableOpacity >

      {/* Report Creation Modal */}
      < Modal
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
              <TextInputWithVoice
                value={reportDescription}
                onChangeText={setReportDescription}
                placeholder="Describe what happened in detail..."
                prompt="incident description"
                multiline
                numberOfLines={4}
                inputStyle={styles.descriptionInput}
              />
            </View>

            {/* Location */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Location *</Text>
              <TextInputWithVoice
                value={reportLocation}
                onChangeText={setReportLocation}
                placeholder="Where did this happen?"
                prompt="incident location"
                inputStyle={styles.locationInput}
              />
            </View>

            {/* Photo/Video Upload */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Attach Media (max 5)</Text>

              {/* Previews */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {media.map((item, idx) => (
                  <PreviewMediaItem key={idx} item={item} removeMedia={removeMedia} />
                ))}
              </ScrollView>

              {/* Upload buttons */}
              <View style={styles.uploadButtonContainer}>
                <TouchableOpacity style={styles.mediaActionButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color="#007AFF" />
                  <Text style={styles.mediaActionButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mediaActionButton} onPress={takeVideo}>
                  <Ionicons name="videocam" size={20} color="#007AFF" />
                  <Text style={styles.mediaActionButtonText}>Take Video</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.mediaActionButton} onPress={pickMedia}>
                  <Ionicons name="images" size={20} color="#007AFF" />
                  <Text style={styles.mediaActionButtonText}>Gallery</Text>
                </TouchableOpacity>
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
      </Modal >
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  searchModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    gap: 12,
  },
  searchModalBackButton: {
    padding: 8,
  },
  voiceSearchButton: {
    padding: 8,
  },
  voiceSearchButtonActive: {
    backgroundColor: '#FF3B3020',
  },
  recordingContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginRight: 8,
  },
  recordingText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  stopRecordingButton: {
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
  },
  stopRecordingText: {
    color: '#fff',
    fontWeight: '600',
  },
  processingContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
  },
  searchModalSearchButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  searchModalInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 50,
  },
  searchModalIcon: {
    marginRight: 12,
  },
  searchModalInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 4,
  },

  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  recentSearchesContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  removeSearchButton: {
    padding: 4,
  },
  searchResultCard: {
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
  searchResultsPreview: {
    padding: 16,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  searchResultItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  searchResultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchResultLocation: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  searchResultTime: {
    fontSize: 12,
    color: '#999',
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  searchHeaderButton: {
    padding: 4,
  },

  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },

  searchModalCloseButton: {
    padding: 4,
  },

  searchModalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },

  feedContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flexWrap: 'wrap',
    gap: 16,
  },
  footerSpacer: {
    flex: 1, // This will push the buttons to the right
    minWidth: 16, // Minimum space between author and buttons
  },
  reportAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  authorText: {
    fontSize: 14,
    color: '#666',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
    flexShrink: 0,
  },

  actionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionTextActive: {
    color: '#ffffff',
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    minWidth: 0,           // Allow button to shrink
    flexShrink: 1,
  },
  actionCountActive: {
    color: '#007AFF',
    backgroundColor: '#ffffff',
  },
  mediaContainer: {
    marginBottom: 16,
  },
  mediaScrollView: {
    marginHorizontal: -4,
  },
  mediaItem: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  uploadButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },

  mediaActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    minWidth: 110,
    flex: 1,
    minHeight: 60,
    justifyContent: 'center',
    gap: 8,
  },

  mediaActionButtonText: {
    color: "#007AFF",
    fontSize: 14,
    fontWeight: '500',
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
    position: "relative",
    width: 120,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#000", // helps video look cleaner
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#fff",
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
    marginTop: 2,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // allows buttons to wrap if screen is small
    justifyContent: "center",
    marginVertical: 10,
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    marginLeft: 5,
  },
  commentModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  commentButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  commentButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});