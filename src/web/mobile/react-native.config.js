const path = require('path');

module.exports = {
  // Project configuration for iOS and Android platforms
  project: {
    ios: {
      sourceDir: './ios',
      podfile: './ios/Podfile',
      xcodeProject: './ios/mobile.xcodeproj',
      deploymentTarget: '14.0', // Updated minimum iOS version for better compatibility
      buildSettings: {
        EXCLUDED_ARCHS: '"arm64"', // Exclude arm64 for simulator builds to prevent architecture conflicts
        IPHONEOS_DEPLOYMENT_TARGET: '14.0',
      },
    },
    android: {
      sourceDir: './android',
      manifestPath: './android/app/src/main/AndroidManifest.xml',
      packageName: 'br.com.austa.superapp',
      buildGradlePath: './android/app/build.gradle',
      settingsGradlePath: './android/settings.gradle',
      // Added specific Android configuration for better build performance
      kotlinVersion: '1.8.0',
      ndkVersion: '23.1.7779620',
      compileSdkVersion: 33,
      targetSdkVersion: 33,
      minSdkVersion: 24,
    },
  },

  // Native module dependencies configuration updated for React Native 0.73.4
  dependencies: {
    // Icon library for journey-specific icons and navigation elements
    'react-native-vector-icons': {
      platforms: {
        ios: {
          project: './node_modules/react-native-vector-icons/RNVectorIcons.xcodeproj',
        },
        android: {
          sourceDir: './node_modules/react-native-vector-icons/android',
          packageImportPath: 'import com.oblador.vectoricons.VectorIconsPackage;',
          packageInstance: 'new VectorIconsPackage()',
        },
      },
      assets: [
        './node_modules/react-native-vector-icons/Fonts',
        // Include journey-specific icon fonts
        './src/assets/fonts/journey-icons',
      ],
    },
    // Linear gradient for journey-specific backgrounds and UI elements
    'react-native-linear-gradient': {
      platforms: {
        ios: {
          project: './node_modules/react-native-linear-gradient/BVLinearGradient.xcodeproj',
        },
        android: {
          sourceDir: './node_modules/react-native-linear-gradient/android',
          packageImportPath: 'import com.BV.LinearGradient.LinearGradientPackage;',
          packageInstance: 'new LinearGradientPackage()',
        },
      },
    },
    // Gesture handler for enhanced touch interactions across all journeys
    'react-native-gesture-handler': {
      platforms: {
        ios: {
          project: './node_modules/react-native-gesture-handler/ios/RNGestureHandler.xcodeproj',
          podspecPath: './node_modules/react-native-gesture-handler/RNGestureHandler.podspec',
        },
        android: {
          sourceDir: './node_modules/react-native-gesture-handler/android',
          packageImportPath: 'import com.swmansion.gesturehandler.RNGestureHandlerPackage;',
          packageInstance: 'new RNGestureHandlerPackage()',
          buildTypes: ['release', 'debug'],
        },
      },
    },
    // Animation library for gamification elements and UI transitions
    'react-native-reanimated': {
      platforms: {
        ios: {
          project: './node_modules/react-native-reanimated/ios/RNReanimated.xcodeproj',
          podspecPath: './node_modules/react-native-reanimated/RNReanimated.podspec',
        },
        android: {
          sourceDir: './node_modules/react-native-reanimated/android',
          packageImportPath: 'import com.swmansion.reanimated.ReanimatedPackage;',
          packageInstance: 'new ReanimatedPackage()',
          buildTypes: ['release', 'debug'],
          // Enable hermes support for better performance
          hermesEnabled: true,
        },
      },
    },
    // SVG support for health metrics visualization and journey icons
    'react-native-svg': {
      platforms: {
        ios: {
          project: './node_modules/react-native-svg/apple/RNSVG.xcodeproj',
          podspecPath: './node_modules/react-native-svg/RNSVG.podspec',
        },
        android: {
          sourceDir: './node_modules/react-native-svg/android',
          packageImportPath: 'import com.horcrux.svg.SvgPackage;',
          packageInstance: 'new SvgPackage()',
        },
      },
    },
    // Added fast image for optimized image loading in journey screens
    'react-native-fast-image': {
      platforms: {
        ios: {
          podspecPath: './node_modules/react-native-fast-image/react-native-fast-image.podspec',
        },
        android: {
          sourceDir: './node_modules/react-native-fast-image/android',
          packageImportPath: 'import com.dylanvann.fastimage.FastImageViewPackage;',
          packageInstance: 'new FastImageViewPackage()',
        },
      },
    },
    // Added safe area context for proper layout on notched devices
    'react-native-safe-area-context': {
      platforms: {
        ios: {
          podspecPath: './node_modules/react-native-safe-area-context/react-native-safe-area-context.podspec',
        },
        android: {
          sourceDir: './node_modules/react-native-safe-area-context/android',
          packageImportPath: 'import com.th3rdwave.safeareacontext.SafeAreaContextPackage;',
          packageInstance: 'new SafeAreaContextPackage()',
        },
      },
    },
  },

  // Assets to be bundled with the application
  assets: [
    // Journey-specific fonts for consistent typography
    './src/assets/fonts',
    // Images for journey UI elements and gamification badges
    './src/assets/images',
    // Animations for gamification rewards and journey transitions
    './src/assets/animations',
    // Design system assets
    '../design-system/src/assets',
    // Design primitives assets
    '../primitives/src/assets',
  ],

  // Source directories for resolving components
  resolver: {
    sourceExts: ['js', 'jsx', 'ts', 'tsx', 'json'],
    // Include design system and journey context packages in module resolution
    nodeModulesPaths: [
      'node_modules',
      '../design-system',
      '../primitives',
      '../interfaces',
      '../journey-context',
    ],
    // Enable symlinks for monorepo workspace packages
    enableSymlinks: true,
    // Exclude specific directories from the resolver to improve performance
    blockList: [/\.git/, /\.hg/, /node_modules\/react-native\/Libraries\/Animated\/src\/polyfills\/.*/, /\android\/build/, /\ios\/build/],
  },

  // Added transformer configuration for better TypeScript support
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
    // Enable hermes for better performance
    hermesEnabled: true,
    // Enable source maps for better debugging
    sourceMaps: true,
  },
};