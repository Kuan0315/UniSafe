TRACK -> Campus Management (Campus Safety App)

Problem Statement -> Current safety infrastructure often lacks comprehensive coverage, real-time responsiveness, and accessibility features that address the diverse needs of the campus community, leaving gaps in protection and support.

Solution -> Build a one stop campus safety mobile application that helps students and staff create a safe study space that is responsive and meets the diverse needs of a campus community by ensuring the app is accessible to all.

Presentation canva link -> https://www.canva.com/design/DAGyMk4JPC0/2upP7Xyy-PuQulRep9nk0w/edit?utm_content=DAGyMk4JPC0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton

Youtube presentation link -> https://youtu.be/aCrNtWJechs

# UniSafe - Campus Safety Companion

UniSafe is a comprehensive mobile application designed to enhance campus safety through real-time incident reporting, location sharing, and emergency response features.

## 🚀 Features

### 🔑 Authentication
- **Google Sign-In**: Secure authentication using Google OAuth
- **Guest Mode**: Anonymous access for browsing reports (limited features)
- **User Profile Management**: Personal information and preferences

### 🏠 Home Page

- **SOS Button**: The large red SOS button requires a deliberate 3-second press-and-hold action to prevent accidental activation. 
   - Haptic Feedback: Vibration pulses provide tactile confirmation during countdown
   - Captures photo and video evidence (if auto-capture enabled in settings)
   - Records precise GPS coordinates with accuracy within 5 meters
   - Distributes emergency alert to all pre-configured trusted contacts
   - Post-Activation Modal: Provides emergency service contact buttons and additional   evidence capture tools

- **Follow Me**: Real-time location tracking for trusted contacts
   - High-Frequency Updates: Location refreshes every 15 seconds during active sessions
   - Battery-Optimized: Uses adaptive location accuracy balancing precision with power consumption
   - Session Management: Automatic timeout after 2 hours of inactivity with manual override options
   - Route History: Maintains encrypted log of shared routes for 24 hours before automatic deletion

- **Safety Alerts**: 
   -Proximity-Based Alerts: Prioritizes alerts based on user's current location
   -Multi-type Categorization: Color-coded alert system (red for active incidents, yellow for warnings, blue for information)

### 🗺️ Map & Navigation
- **Incident Mapping**: Visual display of reported incidents with categorized icons
- **Crowd Density**: Real-time crowd density indicators to avoid isolated areas
- **Category Filters**: Filter incidents by type (theft, harassment, accident, etc.)
- **Safe Routes**: Navigation suggestions avoiding reported incident areas
- **Interactive Markers**: Detailed incident information on tap
- **Full Screen Mode**: Expand the map view to cover the entire screen for better visibility and easier navigation.
- **Recenter function**: Quickly return the map’s focus to your current location with a single tap.

### 🔎 Reports & Community
- **Search Functionality**: Find specific incidents or locations
- **Recent Reports Feed**: Community-driven safety updates
- **Comprehensive Reporting**: 
  - Multiple incident categories
  - Photo/video attachments
  - Anonymous reporting option
  - Location tagging
- **Community Engagement**: Upvote helpful reports and add comments

### 📱 Safety Alerts & Notifications
- **Push Notifications**: Real-time alerts for nearby incidents
- **Emergency Broadcasts**: Immediate notifications for urgent situations
- **Customizable Settings**: Control notification preferences and frequency

### 👤 Profile & Settings
- **Personal Information**: Name, email, student/staff ID
- **Trusted Circle**: Manage family and friend contacts
- **Privacy Controls**: Anonymous mode, location sharing and smart guardian alerts preferences
- **Emergency Numbers**: Campus security, police, and medical contacts
- **App Preferences**: Language, theme, notification settings, text-to-speech and auto-capture on SOS preference
- **AI Chat Safety Assistant**: A built-in chatbot that gives instant safety tips, emergency steps, and mental health support 24/7.  

## 🛠️ Technical Stack

- **Frontend**: React Native with Expo
- **Navigation**: Expo Router with tab-based navigation
- **Maps**: React Native Maps for location services
- **Permissions**: Expo Location, Camera, and Notifications
- **State Management**: React Hooks and Context API
- **Styling**: React Native StyleSheet with modern design system
- **Backend**: Node.js

## 📱 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (for development)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UniSafe/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional packages**
   ```bash
   npm install @react-native-async-storage/async-storage react-native-maps expo-location expo-notifications expo-camera expo-image-picker
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the frontend directory:
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
EXPO_PUBLIC_BACKEND_URL=your_backend_api_url
```

### Google Maps Setup
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps SDK for iOS and Android
3. Add the API key to your environment variables

### Push Notifications
1. Configure Expo push notifications in your Expo dashboard
2. Update the project ID in `NotificationService.ts`
3. Test notifications on physical devices


## 🚨 Emergency Features

### SOS System
- **3-secs-tap Activation**: Prevents accidental emergency calls
- **Live Location Sharing**: Immediate location broadcast to emergency contacts
- **Emergency Services**: Direct connection to campus security and police
- **Audible Alerts**: Sound notifications for emergency activation

### Follow Me Mode
- **Real-time Tracking**: Continuous location updates every 10 seconds
- **Trusted Contacts**: Share location only with approved family/friends
- **Privacy Controls**: User can start/stop tracking at any time
- **Background Operation**: Continues tracking when app is minimized

## 🔒 Privacy & Security

- **Anonymous Reporting**: Users can report incidents without revealing identity
- **Location Privacy**: Granular control over location sharing preferences
- **Data Encryption**: All sensitive data is encrypted in transit and storage
- **Permission Management**: Clear user control over app permissions

## 🌐 Backend Integration

The app is designed to work with a backend API that handles:
- User authentication and management
- Incident reporting and storage
- Location tracking and sharing
- Push notification delivery
- Emergency contact management

### API Endpoints (to be implemented)
```
POST /auth/google          # Google OAuth authentication
POST /reports              # Submit incident report
GET  /reports              # Get incident reports
POST /location/share       # Share location with contacts
POST /emergency/sos        # Emergency SOS activation
GET  /contacts/trusted     # Get trusted circle contacts
POST /contacts/trusted     # Add trusted contact
```

## 🎨 Design System

### Color Palette
- **Primary**: #007AFF (iOS Blue)
- **Success**: #34C759 (Green)
- **Warning**: #FF9500 (Orange)
- **Danger**: #FF3B30 (Red)
- **Neutral**: #8E8E93 (Gray)

### Typography
- **Headings**: Bold, 18-24px
- **Body**: Regular, 14-16px
- **Captions**: Light, 12-14px

### Components
- **Cards**: Rounded corners with subtle shadows
- **Buttons**: High contrast with clear visual feedback
- **Icons**: Consistent iconography using Ionicons

## 🧪 Testing

### Manual Testing
- Test all emergency features on physical devices
- Verify location permissions and accuracy
- Test push notifications in various app states
- Validate offline functionality

### Automated Testing
```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## 📱 Platform Support

- **iOS**: iOS 13.0 and later
- **Android**: Android 6.0 (API level 23) and later
- **Web**: Modern browsers with location support

## 🚀 Deployment

### Expo Build
```bash
# Build for production
expo build:android
expo build:ios

# Submit to app stores
expo submit:android
expo submit:ios
```

### App Store Requirements
- Privacy policy and terms of service
- Location usage descriptions
- Emergency feature explanations
- Accessibility compliance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation wiki

## 🔮 Future Enhancements
- **AI Camera Detection**: Smarter campuses with AI-powered CCTV analysis that instantly spots accidents, suspicious behavior, or unsafe environments and pushes live alerts to students and staff.  
- **AI-powered Risk Assessment**: Transform raw incident data into predictive insights that help prevent accidents before they happen.  
- **Voice Command SOS**: “Hey UniSafe, I need help!” — hands-free emergency activation designed for high-stress situations where every second counts.  
- **Smart Campus Security Integration**: Seamless syncing with campus security systems, enabling guards to receive live feeds, track incidents in real time, and respond faster.  
- **Augmented Reality Safe Zones**: AR overlays to guide users to the nearest safe spots during emergencies using just their phone camera.  
- **Smart Wearable Compatibility**: Sync with smartwatches or fitness bands for quick SOS activation through a tap or pulse detection when the wearer is in distress.  
- **Crowdsourced Guardian Network**: Allow nearby trusted peers to temporarily act as “digital guardians” when someone feels unsafe, creating a community-driven safety net.  

---

**UniSafe** - Making campuses safer, one report at a time. 🛡️
