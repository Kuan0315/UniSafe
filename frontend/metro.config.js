const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver for web-only packages
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Resolve web-only dependencies that shouldn't be included in native builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Add platform-specific extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

// Add alias for web-only packages to use our shims on native
config.resolver.alias = {
  'vaul': path.resolve(__dirname, 'polyfills/vaul.js'),
  '@radix-ui/react-dialog': path.resolve(__dirname, 'polyfills/radix-dialog.js'),
  'react-remove-scroll': path.resolve(__dirname, 'polyfills/vaul.js'), // Use same empty shim
};

module.exports = config;