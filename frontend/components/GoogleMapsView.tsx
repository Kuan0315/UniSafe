import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPS_CONFIG } from '../config/maps';

const { width, height } = Dimensions.get('window');

interface GoogleMapsViewProps {
  userLocation: { latitude: number; longitude: number } | null;
  region?: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };
  incidents: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    location: { latitude: number; longitude: number };
    time: string;
    severity: string;
  }>;
  showSafeRoute: boolean;
  currentUniversity?: {
    id: string;
    name: string;
    center: { latitude: number; longitude: number };
    campusBoundary: Array<{ latitude: number; longitude: number }>;
    coverageRadius: number;
  } | null;
  onMapPress?: (latitude: number, longitude: number) => void;
}

export default function GoogleMapsView({ 
  userLocation, 
  incidents, 
  showSafeRoute, 
  currentUniversity,
  onMapPress,
  region,
}: GoogleMapsViewProps) {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (region && webViewRef.current) {
      const jsCode = `
        if (map) {
          map.setCenter({ lat: ${region.latitude}, lng: ${region.longitude} });
          map.setZoom(15);
          if (userMarker) {
            userMarker.setPosition({ lat: ${region.latitude}, lng: ${region.longitude} });
          }
        }
      `;
      webViewRef.current.injectJavaScript(jsCode);
    }
  }, [region]);

  // Generate Google Maps HTML with your API key
  const generateGoogleMapsHTML = () => {
    const apiKey = MAPS_CONFIG.GOOGLE_MAPS_API_KEY;
    
    // Create markers for incidents with better visibility
    const incidentMarkers = incidents.map(incident => {
      const iconUrl = getIncidentIcon(incident.type);
      return `
        new google.maps.Marker({
          position: { lat: ${incident.location.latitude}, lng: ${incident.location.longitude} },
          map: map,
          title: '${incident.title}',
          icon: {
            url: '${iconUrl}',
            scaledSize: new google.maps.Size(32, 32)
          }
        });
      `;
    }).join('');

    // Create university coverage visualization
    const universityCoverage = currentUniversity ? `
      // Coverage radius circle (10km)
      const coverageCircle = new google.maps.Circle({
        strokeColor: '#FF9500',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#FF9500',
        fillOpacity: 0.1,
        map: map,
        center: { lat: ${currentUniversity.center.latitude}, lng: ${currentUniversity.center.longitude} },
        radius: ${currentUniversity.coverageRadius * 1000}, // Convert km to meters
      });

      // Campus boundary polygon
      const campusBoundary = new google.maps.Polygon({
        paths: [${currentUniversity.campusBoundary.map(point => 
          `{ lat: ${point.latitude}, lng: ${point.longitude} }`
        ).join(', ')}],
        strokeColor: '#34C759',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#34C759',
        fillOpacity: 0.1,
        map: map,
      });

      // University center marker
      const universityMarker = new google.maps.Marker({
        position: { lat: ${currentUniversity.center.latitude}, lng: ${currentUniversity.center.longitude} },
        map: map,
        title: '${currentUniversity.name}',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#007AFF',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });
    ` : '';

    // Create safe route polyline
    const safeRoutePolyline = showSafeRoute ? `
      const safeRoute = new google.maps.Polyline({
        path: [
          { lat: ${userLocation?.latitude || 3.1201}, lng: ${userLocation?.longitude || 101.6544} },
          { lat: 3.1250, lng: 101.6600 },
          { lat: 3.1150, lng: 101.6480 }
        ],
        geodesic: true,
        strokeColor: '#34C759',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
          },
          offset: '50%'
        }]
      });
      safeRoute.setMap(map);
    ` : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; }
            #map { width: 100%; height: 100vh; }
            .map-controls {
              position: absolute;
              top: 10px;
              right: 10px;
              background: white;
              padding: 10px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          
          <script>
            let map;
            let userMarker;
            
            function initMap() {
                           const userLat = ${userLocation?.latitude || 3.1201};
             const userLng = ${userLocation?.longitude || 101.6544};
              
              map = new google.maps.Map(document.getElementById('map'), {
                center: { lat: userLat, lng: userLng },
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                  {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                  }
                ]
              });

              // User location marker
              userMarker = new google.maps.Marker({
                position: { lat: userLat, lng: userLng },
                map: map,
                title: 'Your Location',
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#007AFF',
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 3
                }
              });

                             // University coverage
               ${universityCoverage}

               // Incident markers
               ${incidentMarkers}

               // Safe route
               ${safeRoutePolyline}

              // Map click handler
              map.addListener('click', function(event) {
                const lat = event.latLng.lat();
                const lng = event.latLng.lng();
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'mapClick',
                  latitude: lat,
                  longitude: lng
                }));
              });
            }
          </script>
          
          <script async defer
            src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap">
          </script>
        </body>
      </html>
    `;
  };

  const getIncidentColor = (type: string) => {
    const colors: Record<string, string> = {
      theft: '#FF9500',
      harassment: '#FF3B30',
      accident: '#007AFF',
      suspicious: '#FF6B35',
      fire: '#FF2D55'
    };
    return colors[type] || '#FF3B30';
  };

  const getIncidentIcon = (type: string) => {
    const color = getIncidentColor(type);

    const icons: Record<string, string> = {
      theft: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><rect x="32" y="128" width="448" height="320" rx="48" ry="48" fill="none" stroke="${color}" stroke-linejoin="round" stroke-width="32"/><path d="M144 128V96a32 32 0 0132-32h160a32 32 0 0132 32v32M480 240H32M320 240v24a8 8 0 01-8 8H200a8 8 0 01-8-8v-24" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>`, // briefcase-outline

      harassment: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M85.57 446.25h340.86a32 32 0 0028.17-47.17L284.18 82.58c-12.09-22.44-44.27-22.44-56.36 0L57.4 399.08a32 32 0 0028.17 47.17z" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M250.26 195.39l5.74 122 5.73-121.95a5.74 5.74 0 00-5.79-6h0a5.74 5.74 0 00-5.68 5.95z" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M256 397.25a20 20 0 1120-20 20 20 0 01-20 20z"/></svg>`, // warning-outline

      accident: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M80 224l37.78-88.15C123.93 121.5 139.6 112 157.11 112h197.78c17.51 0 33.18 9.5 39.33 23.85L432 224M80 224h352v144H80zM112 368v32H80v-32M432 368v32h-32v-32" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle cx="144" cy="288" r="16" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle cx="368" cy="288" r="16" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>`, // car-outline

      suspicious: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M255.66 112c-77.94 0-157.89 45.11-220.83 135.33a16 16 0 00-.27 17.77C82.92 340.8 161.8 400 255.66 400c92.84 0 173.34-59.38 221.79-135.25a16.14 16.14 0 000-17.47C428.89 172.28 347.8 112 255.66 112z" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><circle cx="256" cy="256" r="80" fill="none" stroke="${color}" stroke-miterlimit="10" stroke-width="32"/></svg>`, // eye-outline

      fire: `<svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M112 320c0-93 124-165 96-272 66 0 192 96 192 272a144 144 0 01-288 0z" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/><path d="M320 368c0 57.71-32 80-64 80s-64-22.29-64-80 40-86 32-128c42 0 96 70.29 96 128z" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/></svg>`, // flame-outline
    };

    // Convert SVG string to Data URI
    const svg = icons[type] || icons['suspicious'];
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick' && onMapPress) {
        onMapPress(data.latitude, data.longitude);
      }
    } catch (error) {
      console.log('WebView message:', event.nativeEvent.data);
    }
  };

  return (
    <View style={styles.container}>
             <WebView
         ref={webViewRef}
         source={{ html: generateGoogleMapsHTML() }}
         style={styles.webview}
         onMessage={handleWebViewMessage}
         javaScriptEnabled={true}
         domStorageEnabled={true}
         startInLoadingState={true}
         scalesPageToFit={true}
         allowsInlineMediaPlayback={true}
         mediaPlaybackRequiresUserAction={false}
         onError={(syntheticEvent) => {
           const { nativeEvent } = syntheticEvent;
           console.warn('WebView error: ', nativeEvent);
         }}
         onHttpError={(syntheticEvent) => {
           const { nativeEvent } = syntheticEvent;
           console.warn('WebView HTTP error: ', nativeEvent);
         }}
       />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    borderRadius: 16,
  },
});
