import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: "UniSafe",
  slug: "frontend",
  entryPoint: "expo-router/entry",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  scheme: "frontend",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  extra: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourcompany.unisafe",
    buildNumber: "1.0.0",
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    },
    infoPlist: {
      NSLocationWhenInUseUsageDescription: "This app needs access to location for safety features.",
      NSLocationAlwaysAndWhenInUseUsageDescription: "This app needs access to location in the background.",
      UIBackgroundModes: ["location", "audio", "fetch"]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "INTERNET",
      "RECORD_AUDIO",
      "CAMERA",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "MODIFY_AUDIO_SETTINGS",
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_MEDIA_VIDEO",
      "android.permission.CALL_PHONE"
    ],
    package: "com.yourcompany.unisafe",
    config: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    }
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-notifications",
      {
        icon: "./assets/images/logo.png",
        color: "#FF0000"
      }
    ],
    [
      "expo-media-library",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
        isAccessMediaLocationEnabled: true,
        includeAudio: false
      }
    ],
    "expo-audio",
    "expo-video"
  ],
  extra: {
    BACKEND_URL: "http://localhost:5000"
  },
  notification: {
    icon: "./assets/images/logo.png",
    color: "#FF0000",
    androidMode: "default",
    androidCollapsedTitle: "UniSafe Alert"
  }
});