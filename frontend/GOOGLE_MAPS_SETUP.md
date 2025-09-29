# Google Maps API Setup Guide

## Prerequisites
- Google Cloud Platform account
- Expo development environment

## Step 1: Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API (optional, for enhanced location features)
4. Go to "Credentials" and create an API key
5. Restrict the API key to your app's bundle identifier for security

## Step 2: Configure API Key

1. Open `frontend/config/maps.ts`
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key
3. Save the file

## Step 3: Platform-Specific Configuration

### Android
1. The API key will be automatically used by expo-maps
2. Make sure your app has location permissions in `app.json`

### iOS
1. The API key will be automatically used by expo-maps
2. Ensure location permissions are properly configured

## Step 4: Test the Integration

1. Run your app: `expo start`
2. Navigate to the Map tab
3. Grant location permissions when prompted
4. You should see the Google Maps interface with your current location

## Features Implemented

- ✅ Real-time Google Maps integration
- ✅ User location tracking
- ✅ Incident markers with custom icons
- ✅ Crowd density indicators
- ✅ Safe route visualization
- ✅ Interactive map controls
- ✅ Location permissions handling

## Troubleshooting

### Map not loading
- Check if your API key is valid
- Verify the APIs are enabled in Google Cloud Console
- Check network connectivity

### Location not working
- Ensure location permissions are granted
- Check if location services are enabled on device
- Verify expo-location is properly configured

### Build errors
- Make sure expo-maps is properly installed
- Check if all dependencies are up to date
- Clear build cache: `expo start --clear`

## Security Notes

- Never commit your API key to version control
- Use environment variables in production
- Restrict API key usage to your app's bundle identifier
- Monitor API usage to prevent abuse

## Cost Considerations

- Google Maps API has usage-based pricing
- Basic usage is typically free for small apps
- Monitor your usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges
