#!/bin/bash
# Script to start the React Native development server

set -e

# Check if we're in the app directory
if [ ! -f "package.json" ]; then
  echo "Error: package.json not found. Make sure you're in the app directory."
  echo "Current directory: $(pwd)"
  exit 1
fi

# Check if node_modules exists, if not run yarn install
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  yarn install
fi

# Check if metro.config.js exists, if not create it
if [ ! -f "metro.config.js" ]; then
  echo "Creating metro.config.js with shared package resolution..."
  cat > metro.config.js << 'EOL'
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);
  
  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      extraNodeModules: {
        '@austa/design-system': '/shared-packages/design-system',
        '@design-system/primitives': '/shared-packages/primitives',
        '@austa/interfaces': '/shared-packages/interfaces',
        '@austa/journey-context': '/shared-packages/journey-context'
      },
      sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
    },
    watchFolders: [
      '/shared-packages/design-system',
      '/shared-packages/primitives',
      '/shared-packages/interfaces',
      '/shared-packages/journey-context'
    ],
  };
})();
EOL
fi

# Check if babel.config.js exists, if not create it
if [ ! -f "babel.config.js" ]; then
  echo "Creating babel.config.js..."
  cat > babel.config.js << 'EOL'
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@app': './src',
          '@austa/design-system': '/shared-packages/design-system',
          '@design-system/primitives': '/shared-packages/primitives',
          '@austa/interfaces': '/shared-packages/interfaces',
          '@austa/journey-context': '/shared-packages/journey-context'
        },
      },
    ],
  ],
};
EOL
fi

# Start the Metro bundler with the correct host
echo "Starting React Native development server..."
echo "The development server will be available at http://localhost:8081"
echo "Press Ctrl+C to stop the server"

exec npx react-native start --host 0.0.0.0 --reset-cache