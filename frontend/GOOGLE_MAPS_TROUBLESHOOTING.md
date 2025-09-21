# Google Maps API Troubleshooting Guide

## Current Issue
You're experiencing "Sorry! Something went wrong" errors with Google Maps in your React Native app, despite having enabled the required APIs in Google Cloud Console.

## Step-by-Step Debugging

### 1. Test Your API Key (IMMEDIATE ACTION)

Open the file `google-maps-test.html` in your web browser:
1. Navigate to: `C:\Users\USER\Documents\Campus\UniSafe\frontend\google-maps-test.html`
2. Double-click to open in your browser
3. Check the console (F12 → Console tab) for detailed error messages

This will tell us if the issue is with:
- API key validity
- Billing status
- API restrictions
- Network issues

### 2. Check Google Cloud Console Settings

Go to [Google Cloud Console](https://console.cloud.google.com/):

#### A. Verify Billing
1. Go to "Billing" in the left sidebar
2. Ensure billing is **enabled** and has a valid payment method
3. Google Maps requires billing even for free tier usage

#### B. Check API Key Restrictions
1. Go to "APIs & Services" → "Credentials"
2. Click on your API key: `AIzaSyCmbgtTrdgjHrYxFmseTEDnVIm0BKYG3GI`
3. Check "Application restrictions":
   - **For testing**: Set to "None" temporarily
   - **For production**: Use "HTTP referrers" with these patterns:
     ```
     *
     localhost/*
     file://*
     capacitor://*
     ionic://*
     http://localhost/*
     https://localhost/*
     ```

#### C. Verify API Access
Ensure these APIs are enabled:
- ✅ Maps JavaScript API
- ✅ Places API (New)
- ✅ Geocoding API
- ✅ Directions API
- ✅ Maps SDK for Android (if using Android)
- ✅ Maps SDK for iOS (if using iOS)

### 3. Common Solutions

#### Solution A: Remove API Key Restrictions (Temporary)
1. Go to your API key settings
2. Set "Application restrictions" to "None"
3. Set "API restrictions" to "Don't restrict key"
4. Test the app again

#### Solution B: Add Proper Referrer Restrictions
For React Native WebView, add these referrer patterns:
```
*
file://*
capacitor://*
ionic://*
http://localhost:*/*
https://localhost:*/*
```

#### Solution C: Create a New API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Don't add any restrictions initially
4. Test with the new key
5. Add restrictions gradually

### 4. Environment Variable Check

Verify your `.env` file in the frontend folder:
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCmbgtTrdgjHrYxFmseTEDnVIm0BKYG3GI
```

### 5. WebView-Specific Issues

React Native WebView runs HTML in a sandboxed environment. Common issues:

#### A. Content Security Policy
The app already includes a permissive CSP, but if issues persist, try:
```html
<meta http-equiv="Content-Security-Policy" content="default-src * data: blob: 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src *;">
```

#### B. Origin Issues
WebView HTML doesn't have a traditional origin, which can cause API key validation issues.

### 6. Testing Commands

Run these in your terminal to test the app:

```powershell
# Navigate to frontend
cd "C:\Users\USER\Documents\Campus\UniSafe\frontend"

# Clear cache and reinstall
npx expo install
npx expo start --clear

# Or use development build
npx expo run:android
# or
npx expo run:ios
```

### 7. Debug Output

With the enhanced error handling I added, check the logs:
1. Run the app
2. Go to the Maps screen
3. Check the console output for detailed error messages
4. Look for these specific messages:
   - "Google Maps authentication failed"
   - "Failed to load Google Maps API script"
   - API key validation messages

### 8. Alternative API Key Test

Try this quick test in browser console:
```javascript
fetch(`https://maps.googleapis.com/maps/api/js?key=AIzaSyCmbgtTrdgjHrYxFmseTEDnVIm0BKYG3GI&libraries=geometry`)
  .then(response => {
    console.log('API Key Status:', response.status);
    console.log('Response OK:', response.ok);
  })
  .catch(error => {
    console.error('API Key Error:', error);
  });
```

## Expected Results

✅ **Success**: Map loads with markers and university boundaries
❌ **Failure**: "Sorry! Something went wrong" or authentication errors

## Next Steps

1. **First**: Test with `google-maps-test.html`
2. **Second**: Remove all API key restrictions temporarily
3. **Third**: Verify billing is enabled
4. **Fourth**: Check the enhanced debug logs in your app

Let me know what the test HTML file shows in your browser console!

## Common Error Messages and Solutions

| Error Message | Solution |
|---------------|----------|
| "This API project is not authorized to use this API" | Enable the specific API in Google Cloud Console |
| "The provided API key is invalid" | Check API key spelling, regenerate if necessary |
| "This service is currently not available" | Billing issue or quota exceeded |
| "RefererNotAllowedMapError" | Add proper referrer restrictions |
| "ApiNotActivatedMapError" | Enable Maps JavaScript API |

## Contact

If you're still having issues after trying these steps, provide me with:
1. Console output from `google-maps-test.html`
2. Error messages from the React Native app logs
3. Screenshots of your Google Cloud Console API settings