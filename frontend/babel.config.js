module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',       // always loads ".env"
        safe: false,
        allowUndefined: true,
      },
    ],
    'react-native-worklets/plugin' // must be last
  ],
};
