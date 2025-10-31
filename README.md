# UniSafe - Campus Safety Companion 🛡️

A comprehensive mobile safety application designed for university campuses, providing real-time incident reporting, emergency response features, and location sharing to create safer educational environments.

## 🎯 Project Overview

**Track:** Campus Management (Campus Safety App)

**Problem Statement:** Current safety infrastructure often lacks comprehensive coverage, real-time responsiveness, and accessibility features that address the diverse needs of the campus community, leaving gaps in protection and support.

**Solution:** Build a one-stop campus safety mobile application that helps students and staff create a safe study environment that is responsive and meets the diverse needs of a campus community by ensuring the app is accessible to all.

## 🎥 Project Resources

- **📊 Presentation:** [Canva Slides](https://www.canva.com/design/DAGyMk4JPC0/2upP7Xyy-PuQulRep9nk0w/edit?utm_content=DAGyMk4JPC0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)
- **🎬 YouTube Presentation:** [Watch Here](https://youtu.be/aCrNtWJechs)
- **📹 Demo Video:** [Google Drive](https://drive.google.com/file/d/1SVP0GNse8_tPDcw2o2KVaev3BUa2t3o9/view?usp=drive_link)
- **📁 Project Files:** [Google Drive Folder](https://drive.google.com/drive/folders/18TgyHcPvi9LRKMYC_2LkfXVhoOn2m9aq) - Contains APK files, feedback forms, and additional resources

## 🚀 Vision Statement

UniSafe aims to go beyond just reporting — we **predict, prevent, and protect**.

In future iterations, we plan to integrate AI-powered capabilities such as:
- **CCTV accident detection**
- **Predictive risk assessment** 
- **Voice-activated SOS**
- **AR safe zone navigation**

Transforming UniSafe into a true **smart campus safety ecosystem**.

## 📱 Download APK

### Download Options:
- **🚀 Latest Release:** [GitHub Releases](https://github.com/Kuan0315/UniSafe/releases/latest)
- **📁 Google Drive:** [Project Files Folder](https://drive.google.com/drive/folders/18TgyHcPvi9LRKMYC_2LkfXVhoOn2m9aq) - APK files and feedback forms

### Installation Instructions:
1. Download the APK file from either source above
2. Enable "Install from unknown sources" in your Android settings
3. Install the APK file
4. Grant necessary permissions for location, camera, and notifications

### Building from Source:
See [BUILD_GUIDE.md](BUILD_GUIDE.md) for detailed instructions on building the APK yourself.


### 📝 User Registration Rules

| Role | Self-Registration | Description |
|------|-------------------|-------------|
| 👨‍👩‍👧‍👦 **Guardian** | ✅ **Allowed** | Can sign up themselves through the app |
| 👨‍🎓 **Student** | ❌ **Restricted** | Must be added by admin/staff |
| 👩‍🏫 **Staff** | ❌ **Restricted** | Must be added by admin |

## 🚀 Quick Start Commands

### Option 1: Local Development (Backend + Frontend)

**Backend Setup:**
```bash
cd backend
npm install
npm run dev
```

**Frontend Setup:**
```bash
cd frontend
npm install
$env:EXPO_PUBLIC_API_BASE_URL="http://YOUR_PC_IPV4:4000"; npm start
```

### Option 2: Using Deployed Backend (Render)

**Frontend Only Setup:**
```bash
cd frontend
npm install
npm start
```
> **Note:** The app is configured to use the deployed backend on Render, so you only need to run the frontend locally.

### Environment Variables

**For Local Development:**
- Replace `YOUR_PC_IPV4` with your actual IP address (e.g., `192.168.1.100`)
- Backend runs on port `4000`
- Frontend Metro server runs on port `8081` or `8082`

**For Production/Render:**
- Backend is deployed and accessible via Render URL
- No additional backend setup required

## 🚀 Key Features

UniSafe provides a comprehensive safety ecosystem with role-specific functionality for Students, Staff, and Guardians. The platform combines real-time emergency response, intelligent route planning, community reporting, and professional staff management tools.

### 🔑 Authentication & User Management
- **Role-Based Access**: Different permissions for Students, Staff, and Guardians
- **Profile Management**: Personal information and preferences

### 🆘 Emergency Response System

#### SOS Button & Emergency Activation
- **3-Second Activation**: Deliberate press-and-hold to prevent accidental triggers
- **Haptic Feedback**: Vibration pulses during countdown
- **Auto Evidence Capture**: Photos and videos (if enabled)
- **GPS Precision**: Location accuracy within 5 meters
- **Emergency Services**: Direct connection to campus security and police
- **Staff Notification**: Real-time alerts to campus security staff dashboard

### 🗺️ Advanced Navigation & Mapping System

#### Smart Route Planning
- **Dual Route Types**: 
  - **🛡️ Safest Route**: Prioritizes safety, avoiding incident areas and high-risk zones
  - **⚡ Fastest Route**: Optimizes for time efficiency while considering traffic patterns
- **Multi-Modal Transport Support**:
  - **🚗 Driving**: Car navigation with real-time traffic integration
  - **🏍️ Motorbike**: Optimized for two-wheeler navigation
  - **🚶 Walking**: Pedestrian-friendly pathfinding with safety considerations

#### Guardian Navigation Integration
- **Real-time Location Sharing**: Guardians can track student navigation progress
- **Route Deviation Alerts**: Notifications when users deviate from planned safe routes
- **Emergency Route Broadcasting**: Instant route sharing during SOS activations
- **Arrival Confirmations**: Automatic notifications when destination is reached

#### Interactive Map Features
- **Incident Visualization**: Categorized icons for different incident types
- **Crowd Density Indicators**: Real-time safety assessment of different areas
- **Smart Filtering**: Filter by incident type (theft, harassment, accident, etc.)
- **Dynamic Route Adjustment**: Real-time route updates based on new incidents
- **Full-Screen Mode**: Enhanced visibility and navigation
- **Quick Recenter**: Return to current location instantly
- **Offline Map Support**: Basic navigation available without internet connection

### 📊 Community Reporting System
- **Comprehensive Categories**: Multiple incident types
- **Rich Media Support**: Photo/video attachments
- **Anonymous Reporting**: Optional identity protection
- **Location Tagging**: Precise incident mapping
- **Community Engagement**: Upvote and comment system
- **Search Functionality**: Find specific incidents or locations

### 🔔 Smart Alert System
- **Proximity-Based Alerts**: Location-relevant notifications
- **Color-Coded System**: Red (active), Yellow (warning), Blue (info)
- **Push Notifications**: Real-time incident alerts
- **Emergency Broadcasts**: Campus-wide urgent notifications
- **Customizable Settings**: Control frequency and preferences

### Discreet Alarm
● Press and hold the Alarm button for 3 seconds to activate the alarm.
● A loud alert sound will be triggered to warn or attract attention from nearby people.
● The Alarm Indicator will appear at the top bar once the alarm is active.
● To stop the alarm, tap the Alarm Indicator on the top bar.
● You can customize the alarm action in your Profile settings, choosing whether the
Discrete Alarm will ring or automatically make a call when activated.

### 👤 Profile & Safety Tools
- **Trusted Circle Management**: Family and friend contacts
- **Privacy Controls**: Anonymous mode and location sharing preferences
- **Emergency Numbers**: Quick access to campus security and medical
- **AI Safety Assistant**: 24/7 chatbot for safety tips and mental health support
- **Multi-Language Support**: Accessible interface options

### 👩‍🏫 Staff Management Dashboard

#### Real-time SOS Monitoring & Response
- **Live SOS Alert Dashboard**: Real-time monitoring of all campus emergency activations
- **Severity-Based Prioritization**: Automatic categorization of alerts by urgency level
- **Staff Assignment System**: Assign specific incidents to available staff members
- **Location Tracking**: Precise GPS coordinates with live updates during emergencies
- **Media Evidence Review**: Access to photos/videos captured during SOS activations
- **Response Time Tracking**: Monitor staff response efficiency and arrival times
- **Emergency Chat Communication**: Direct messaging with users in distress

#### Comprehensive Reports Management
- **Incident Report Dashboard**: Centralized view of all campus safety reports
- **Category-Based Sorting**: Filter by incident type (theft, harassment, accident, etc.)
- **Evidence Management**: Review attached photos, videos, and documentation
- **Report Status Tracking**: Mark reports as reviewed, in-progress, or resolved
- **User Communication**: Direct contact with report submitters for follow-ups
- **Analytics & Trends**: Generate safety statistics and incident pattern analysis

#### Campus Safety Administration
- **Alert Broadcasting**: Send campus-wide emergency notifications
- **Safe Zone Management**: Designate and update safe areas on campus map
- **User Account Management**: Add/remove students and manage user permissions
- **Safety Protocol Updates**: Modify emergency procedures and response protocols
- **Staff Coordination**: Assign roles and manage security team communications
- **Compliance Reporting**: Generate reports for university administration and authorities

#### Guardian Integration & Communication
- **Guardian Alert System**: Notify parents/guardians of student incidents
- **Communication Bridge**: Facilitate three-way communication (student-staff-guardian)
- **Status Updates**: Keep guardians informed of incident resolution progress
- **Permission Management**: Handle guardian access requests and approvals

## 🛠️ Technical Stack

- **Frontend**: React Native with Expo SDK 54
- **Navigation**: Expo Router with tab-based navigation
- **Maps Integration**: React Native Maps with Google Maps API
- **Authentication**: Google OAuth integration
- **State Management**: React Hooks and Context API
- **Styling**: Modern design system with React Native StyleSheet
- **Backend**: Node.js with Express (deployed on Render)
- **Database**: [Your database technology]
- **Push Notifications**: Expo Notifications
- **Real-time Features**: WebSocket integration

## 📱 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or yarn
- **Expo CLI** (`npm install -g @expo/cli`)
- **Android Studio** (for Android builds)
- **iOS Simulator** or **Android Emulator** (for development)

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Kuan0315/UniSafe.git
   cd UniSafe
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

3. **Backend Setup** (Optional - for local development)
   ```bash
   cd backend
   npm install
   ```

4. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   EXPO_PUBLIC_API_BASE_URL=your_backend_api_url
   ```

5. **Start Development Server**
   ```bash
   # Frontend only (using deployed backend)
   cd frontend
   npm start
   
   # Or with local backend
   cd backend && npm run dev
   cd frontend && npm start
   ```

## 🔧 Configuration

### Google Maps Setup
1. Get API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps SDK for iOS and Android
3. Add API key to environment variables
4. Configure usage restrictions for security

### Push Notifications
1. Configure Expo push notifications in your Expo dashboard
2. Update project ID in `NotificationService.ts`
3. Test on physical devices (notifications don't work in simulators)

## 🏗️ Building APK

### Debug APK (Development)
```bash
cd frontend/android
./gradlew assembleDebug
```
**Location**: `android/app/build/outputs/apk/debug/app-debug.apk`
**Note**: Requires Metro server running

### Release APK (Production)
```bash
cd frontend/android
./gradlew assembleRelease
```
**Location**: `android/app/build/outputs/apk/release/app-release.apk`
**Note**: Standalone APK, works without Metro server

## 🧪 Testing

### Manual Testing Checklist
- [ ] Emergency SOS button activation
- [ ] Location permissions and accuracy
- [ ] Push notifications in various app states
- [ ] Offline functionality
- [ ] Cross-platform compatibility

### Automated Testing
```bash
# Run tests
npm test

# Run linting
npm run lint

# Type checking (if using TypeScript)
npm run type-check
```

## 🔒 Security Features

- **Data Encryption**: All sensitive data encrypted in transit and storage
- **Anonymous Reporting**: Identity protection for incident reports
- **Location Privacy**: Granular control over location sharing
- **Permission Management**: Clear user control over app permissions
- **Secure Authentication**: Google OAuth with proper token handling

## 🌐 API Integration

### Backend Endpoints
```
POST /auth/google          # Google OAuth authentication
POST /auth/login           # Standard login
POST /auth/register        # Guardian registration
GET  /reports              # Get incident reports
POST /reports              # Submit incident report
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
- **Body Text**: Regular, 14-16px
- **Captions**: Light, 12-14px

## 📱 Platform Support

- **iOS**: iOS 13.0 and later
- **Android**: Android 6.0 (API level 23) and later
- **Web**: Modern browsers with location support (limited features)

## 🚀 Deployment

### Expo Build Service
```bash
# Build for app stores
eas build --platform android
eas build --platform ios

# Submit to stores
eas submit --platform android
eas submit --platform ios
```

### Manual Build
```bash
# Android
cd frontend/android && ./gradlew assembleRelease

# iOS (requires macOS and Xcode)
cd frontend/ios && xcodebuild
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow React Native best practices
- Write clear commit messages
- Add tests for new features
- Update documentation as needed

## 🔮 Future Enhancements

### Phase 2: AI Integration
- **AI Camera Detection**: CCTV analysis for accident detection
- **Predictive Risk Assessment**: Data-driven accident prevention
- **Voice Command SOS**: "Hey UniSafe, I need help!" activation
- **Smart Campus Integration**: Real-time security system syncing

### Phase 3: Advanced Features
- **AR Safe Navigation**: Camera-guided emergency routes
- **Wearable Integration**: Smartwatch SOS activation
- **Community Guardian Network**: Peer-to-peer safety assistance
- **Mental Health Support**: AI-powered counseling resources

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Contact

### For Users
- **Emergency**: Use in-app SOS feature or contact local emergency services
- **Technical Issues**: Create an issue in this GitHub repository
- **General Questions**: Check our documentation or contact support

### For Developers
- **Documentation**: Check the `/docs` folder
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for feature requests

## ⚠️ Important Disclaimer

**UniSafe is designed to assist with campus safety but should not be relied upon as the sole means of emergency communication. Always contact local emergency services (911, campus security) in case of immediate danger.**

---

**UniSafe** - Making campuses safer, one report at a time. 🛡️

*Developed with ❤️ for safer educational communities*
