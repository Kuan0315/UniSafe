TRACK -> Campus Management (Campus Safety App)
Problem Statement -> Current safety infrastructure often lacks comprehensive coverage, real-time responsiveness, and accessibility features that address the diverse needs of the campus community, leaving gaps in protection and support.

# UniSafe - Campus Safety Companion

UniSafe is a comprehensive mobile application designed to enhance campus safety through real-time incident reporting, location sharing, and emergency response features.

## 🚀 Features

### 🔑 Authentication
- **Google Sign-In**: Secure authentication using Google OAuth
- **Guest Mode**: Anonymous access for browsing reports (limited features)
- **User Profile Management**: Personal information and preferences

### 🏠 Home Page
- **SOS Button**: Triple-tap emergency activation with live location sharing
- **Follow Me**: Real-time location tracking for trusted contacts
- **Safety Alerts**: Quick access to recent campus incidents
- **Safe Routes**: Navigation shortcuts to avoid dangerous areas
- **Quick Actions**: Easy access to campus security and trusted circle

### 🗺️ Map & Navigation
- **Incident Mapping**: Visual display of reported incidents with categorized icons
- **Crowd Density**: Real-time crowd density indicators to avoid isolated areas
- **Category Filters**: Filter incidents by type (theft, harassment, accident, etc.)
- **Safe Routes**: Navigation suggestions avoiding reported incident areas
- **Interactive Markers**: Detailed incident information on tap

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
- **Privacy Controls**: Anonymous mode and location sharing preferences
- **Emergency Numbers**: Campus security, police, and medical contacts
- **App Preferences**: Language, theme, and notification settings

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

## 📱 App Structure

```
UniSafe/frontend/
├── app/                    # Expo Router app directory
│   ├── (auth)/            # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── signup.tsx     # Signup screen
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx      # Home screen
│   │   ├── map.tsx        # Map screen
│   │   ├── report.tsx     # Reports screen
│   │   ├── profile.tsx    # Profile screen
│   │   ├── sos.tsx        # SOS screen
│   │   ├── guardian.tsx   # Guardian mode
│   │   └── emergency.tsx  # Emergency calls
│   └── _layout.tsx        # Root layout
├── services/               # Business logic services
│   ├── NotificationService.ts
│   └── LocationService.ts
├── assets/                 # Images, fonts, and static files
└── package.json           # Dependencies and scripts
```

## 🚨 Emergency Features

### SOS System
- **Triple-tap Activation**: Prevents accidental emergency calls
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

- **AI-powered Risk Assessment**: Machine learning for incident prediction
- **Voice Commands**: Hands-free emergency activation
- **Integration**: Campus security system integration
- **Analytics**: Safety trend analysis and reporting
- **Multi-language**: Internationalization support

---

**UniSafe** - Making campuses safer, one report at a time. 🛡️
