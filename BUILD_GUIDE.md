# Building APK for UniSafe

## Prerequisites
1. Install Node.js (v20 or later)
2. Install EAS CLI: `npm install -g eas-cli`
3. Create an Expo account at https://expo.dev

## Manual Build Steps

1. **Login to Expo**
   ```bash
   cd frontend
   eas login
   ```

2. **Configure the project (first time only)**
   ```bash
   eas build:configure
   ```

3. **Build APK**
   ```bash
   eas build --platform android --profile apk
   ```

4. **Download the APK**
   - Go to https://expo.dev/accounts/[your-username]/projects/unisafe/builds
   - Download the APK file from the completed build

## Automated Builds via GitHub Actions

1. **Setup Expo Token**
   - Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
   - Create a new token
   - Add it to your GitHub repository secrets as `EXPO_TOKEN`

2. **Create a Release**
   - Go to GitHub repository
   - Create a new tag/release (e.g., v1.0.0)
   - The APK will be automatically built and attached to the release

## Distribution

### Option 1: GitHub Releases
- Users can download the APK directly from GitHub releases
- No Google Play Store review required
- Users need to enable "Install from unknown sources"

### Option 2: Internal Distribution
- Share the Expo build link directly
- Users can install via Expo Go app or browser

### Option 3: Google Play Store
- Use `eas build --platform android --profile production`
- Upload the AAB file to Google Play Console
- Goes through Google's review process

## Important Notes

- APK files allow direct installation but require "Unknown sources" permission
- AAB files are for Google Play Store distribution
- Always test on physical devices before releasing
- Consider using internal testing first before public release