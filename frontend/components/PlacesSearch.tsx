import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MAPS_CONFIG } from '../config/maps';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PlacesSearchProps {
  placeholder?: string;
  onPlaceSelected: (place: { 
    description: string; 
    latitude: number; 
    longitude: number; 
    place_id: string;
  }) => void;
  style?: any;
}

export default function PlacesSearch({ 
  placeholder = "Search destination...", 
  onPlaceSelected,
  style 
}: PlacesSearchProps) {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isPlaceSelected, setIsPlaceSelected] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Don't search if text is too short or if we just selected a place
    if (searchText.length < 2 || isPlaceSelected) {
      setPredictions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(searchText);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchText, isPlaceSelected]);

  const searchPlaces = async (query: string) => {
    if (!MAPS_CONFIG.GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key not found');
      return;
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${MAPS_CONFIG.GOOGLE_MAPS_API_KEY}&components=country:my&types=establishment|geocode`;
      
      console.log('🔍 Searching for:', query);
      
      const response = await fetch(url, { 
        signal: abortControllerRef.current.signal 
      });
      
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('✅ Found', data.predictions.length, 'suggestions');
        setPredictions(data.predictions);
        setShowSuggestions(true);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('ℹ️ No results found for:', query);
        setPredictions([]);
        setShowSuggestions(false);
      } else {
        console.warn('⚠️ Places API response:', data.status, data.error_message || 'Unknown error');
        setPredictions([]);
        setShowSuggestions(false);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🔄 Search cancelled for:', query);
      } else {
        console.error('❌ Search error:', error);
        setPredictions([]);
        setShowSuggestions(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string, description: string) => {
    if (!MAPS_CONFIG.GOOGLE_MAPS_API_KEY) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${MAPS_CONFIG.GOOGLE_MAPS_API_KEY}`;
      
      console.log('📍 Getting details for:', description);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        
        console.log('✅ Location found:', { lat, lng });
        
        onPlaceSelected({
          description,
          latitude: lat,
          longitude: lng,
          place_id: placeId,
        });
        
        // Clear search - set flag to prevent triggering search again
        setIsPlaceSelected(true);
        setSearchText(description);
        setShowSuggestions(false);
        Keyboard.dismiss();
        
        // Reset the flag after a short delay to allow future searches
        setTimeout(() => setIsPlaceSelected(false), 100);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('ℹ️ No location details found for:', description);
      } else {
        console.warn('⚠️ Place details response:', data.status, data.error_message || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ Place details error:', error);
    }
  };

  const handlePlacePress = (prediction: PlacePrediction) => {
    getPlaceDetails(prediction.place_id, prediction.description);
  };

  const clearSearch = () => {
    setSearchText('');
    setPredictions([]);
    setShowSuggestions(false);
    setIsPlaceSelected(false);
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    // Reset place selected flag when user manually types
    if (isPlaceSelected) {
      setIsPlaceSelected(false);
    }
  };

  const renderPrediction = ({ item }: { item: PlacePrediction }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => handlePlacePress(item)}
    >
      <View style={styles.predictionIcon}>
        <Ionicons 
          name={item.types.includes('establishment') ? 'business' : 'location'} 
          size={20} 
          color="#666" 
        />
      </View>
      <View style={styles.predictionText}>
        <Text style={styles.predictionMain}>
          {item.structured_formatting.main_text}
        </Text>
        <Text style={styles.predictionSecondary}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setShowSuggestions(predictions.length > 0)}
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.loadingIcon} />
        )}
        {searchText.length > 0 && !loading && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && predictions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={predictions}
            renderItem={renderPrediction}
            keyExtractor={(item) => item.place_id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 12,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  searchIcon: {
    marginRight: 12,
    color: '#9aa0a6',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
    fontWeight: '400',
  },
  loadingIcon: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    maxHeight: 300,
    zIndex: 20,
    overflow: 'hidden',
  },
  suggestionsList: {
    maxHeight: 300,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f7',
    backgroundColor: 'white',
  },
  predictionIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1d1d1f',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 14,
    color: '#86868b',
    lineHeight: 18,
  },
});