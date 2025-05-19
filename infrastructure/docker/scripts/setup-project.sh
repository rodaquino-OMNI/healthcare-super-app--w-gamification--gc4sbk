#!/bin/bash
# Script to set up a new React Native project or configure an existing one

set -e

PROJECT_NAME="austa-mobile"

# Function to display help message
show_help() {
  echo "Usage: setup-project.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -n, --name NAME     Set project name (default: austa-mobile)"
  echo "  -e, --existing      Configure an existing project"
  echo "  -h, --help          Show this help message"
  echo ""
  echo "Examples:"
  echo "  setup-project.sh -n my-app        # Create a new project named 'my-app'"
  echo "  setup-project.sh -e               # Configure existing project in current directory"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    -n|--name)
      PROJECT_NAME="$2"
      shift
      shift
      ;;
    -e|--existing)
      EXISTING=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Check if we're configuring an existing project
if [ "$EXISTING" = true ]; then
  echo "Configuring existing React Native project..."
  
  # Check if package.json exists
  if [ ! -f "package.json" ]; then
    echo "Error: package.json not found. Make sure you're in a React Native project directory."
    exit 1
  fi
  
  # Update dependencies
  echo "Updating dependencies..."
  yarn add react-native@0.73.4 react@18.2.0
  yarn add -D typescript@5.3.3 @types/react @types/react-native
  
  # Add shared packages as dependencies
  echo "Adding shared package references..."
  yarn add @austa/design-system@file:/shared-packages/design-system \
           @design-system/primitives@file:/shared-packages/primitives \
           @austa/interfaces@file:/shared-packages/interfaces \
           @austa/journey-context@file:/shared-packages/journey-context
  
  # Create or update metro.config.js
  echo "Updating Metro configuration..."
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

  # Create or update babel.config.js
  echo "Updating Babel configuration..."
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

  # Create or update tsconfig.json
  echo "Updating TypeScript configuration..."
  cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2019"],
    "jsx": "react-native",
    "strict": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/*"],
      "@austa/design-system": ["/shared-packages/design-system"],
      "@design-system/primitives": ["/shared-packages/primitives"],
      "@austa/interfaces": ["/shared-packages/interfaces"],
      "@austa/journey-context": ["/shared-packages/journey-context"]
    },
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js"]
}
EOL

  echo "Project configuration complete!"
  echo "Run 'start-dev.sh' to start the development server."

else
  # Create a new project
  echo "Creating new React Native project: $PROJECT_NAME"
  npx react-native init $PROJECT_NAME --version 0.73.4 --template react-native-template-typescript
  
  # Move into the project directory
  cd $PROJECT_NAME
  
  # Add shared packages as dependencies
  echo "Adding shared package references..."
  yarn add @austa/design-system@file:/shared-packages/design-system \
           @design-system/primitives@file:/shared-packages/primitives \
           @austa/interfaces@file:/shared-packages/interfaces \
           @austa/journey-context@file:/shared-packages/journey-context
  
  # Create or update metro.config.js
  echo "Updating Metro configuration..."
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

  # Update babel.config.js
  echo "Updating Babel configuration..."
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

  # Update tsconfig.json
  echo "Updating TypeScript configuration..."
  cat > tsconfig.json << 'EOL'
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2019"],
    "jsx": "react-native",
    "strict": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@app/*": ["src/*"],
      "@austa/design-system": ["/shared-packages/design-system"],
      "@design-system/primitives": ["/shared-packages/primitives"],
      "@austa/interfaces": ["/shared-packages/interfaces"],
      "@austa/journey-context": ["/shared-packages/journey-context"]
    },
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules", "babel.config.js", "metro.config.js"]
}
EOL

  # Create src directory structure
  echo "Creating project structure..."
  mkdir -p src/{api,assets,components,constants,context,hooks,navigation,screens,types,utils}
  
  # Create index files for each directory
  for dir in src/{api,assets,components,constants,context,hooks,navigation,screens,types,utils}; do
    touch $dir/index.ts
  done
  
  echo "Project setup complete!"
  echo "Run 'cd $PROJECT_NAME && start-dev.sh' to start the development server."
fi