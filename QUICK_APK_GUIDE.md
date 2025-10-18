# Quick APK Build Guide for UniSafe

Since EAS Build is having configuration issues, here are alternative methods to get your app to users:

## Option 1: Expo Development Build (Recommended for testing)

1. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

2. **Start the development server**
   ```bash
   cd frontend
   npx expo start
   ```

3. **Share with users**
   - Users download Expo Go app from Play Store
   - Share the QR code or development URL
   - Users can test the app directly

## Option 2: APK via GitHub Actions (Automated)

I've created a GitHub Actions workflow that will automatically build APKs when you create releases:

1. **Set up Expo token in GitHub**
   - Go to https://expo.dev/settings/access-tokens
   - Create a new token
   - Go to your GitHub repo → Settings → Secrets → Actions
   - Add `EXPO_TOKEN` with your token value

2. **Create a release**
   - Go to your GitHub repo
   - Click "Releases" → "Create a new release"
   - Tag: `v1.0.0`, Title: `UniSafe v1.0.0`
   - The workflow will automatically build and attach the APK

## Option 3: Manual EAS Build (When configuration works)

1. **Fix EAS configuration**
   ```bash
   cd frontend
   eas whoami  # Make sure you're logged in
   eas build:configure  # Reconfigure if needed
   ```

2. **Build APK**
   ```bash
   eas build --platform android --profile apk
   ```

3. **Download from Expo dashboard**
   - Visit https://expo.dev/accounts/[username]/projects/unisafe/builds
   - Download the APK when build completes

## Option 4: Using Expo Application Services (EAS) Web Interface

1. Go to https://expo.dev
2. Create/login to your account
3. Create a new project called "UniSafe"
4. Upload your code or connect GitHub
5. Use the web interface to trigger builds

## Distribution Methods

### A. GitHub Releases (Free)
- Upload APK to GitHub releases
- Users download directly
- Need to enable "Unknown sources" on Android

### B. Direct Link Sharing
- Share Expo build links
- Works with Expo Go app
- No installation needed

### C. Internal Testing
- Google Play Console internal testing
- Requires developer account ($25 one-time)
- No app review needed for testing

## User Installation Instructions

**For APK files:**
1. Download the APK file
2. Go to Settings → Security → Unknown Sources (enable)
3. Install the APK
4. Grant permissions when prompted

**For Expo Go:**
1. Install Expo Go from Play Store
2. Scan QR code or enter project URL
3. App runs directly in Expo Go

## Next Steps

1. Try the Expo Go method first (quickest for testing)
2. Set up GitHub Actions for automated APK builds
3. Consider Google Play Store for wider distribution

The GitHub Actions workflow I created will handle the APK building automatically once you set up the Expo token!