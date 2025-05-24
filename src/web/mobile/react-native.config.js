const path = require('path');

module.exports = {
  // Project configuration for iOS and Android platforms
  project: {
    ios: {
      sourceDir: './ios',
      podfile: './ios/Podfile',
      xcodeProject: './ios/mobile.xcodeproj',
      deploymentTarget: '14.0', // Updated minimum iOS version supported
      buildSettings: {
        EXCLUDED_ARCHS: '"arm64"', // For simulator builds on Apple Silicon
        IPHONEOS_DEPLOYMENT_TARGET: '14.0',
      },
    },
    android: {
      sourceDir: './android',
      manifestPath: './android/app/src/main/AndroidManifest.xml',
      packageName: 'br.com.austa.superapp',
      buildGradlePath: './android/app/build.gradle',
      settingsGradlePath: './android/settings.gradle',
      kotlinVersion: '1.8.0', // Added Kotlin version for compatibility
      ndkVersion: '23.1.7779620', // Added NDK version for native modules
    },
  },

  // Native module dependencies configuration - updated for React Native 0.73.4
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
        },
      },
      // Add Babel plugin configuration for Reanimated
      pluginConfig: {
        babelPlugin: {
          name: 'react-native-reanimated/plugin',
          options: {
            globals: ['__scanCodes'],
          },
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
          buildTypes: ['release', 'debug'],
        },
      },
    },
    // Fast Image for optimized image loading in journey screens
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
    // Lottie for animations in gamification rewards
    'lottie-react-native': {
      platforms: {
        ios: {
          podspecPath: './node_modules/lottie-react-native/lottie-react-native.podspec',
        },
        android: {
          sourceDir: './node_modules/lottie-react-native/src/android',
          packageImportPath: 'import com.airbnb.android.react.lottie.LottiePackage;',
          packageInstance: 'new LottiePackage()',
        },
      },
    },
  },

  // Assets to be bundled with the application - enhanced to include design system assets
  assets: [
    // Journey-specific fonts for consistent typography
    './src/assets/fonts',
    // Images for journey UI elements and gamification badges
    './src/assets/images',
    // Animations for gamification rewards and journey transitions
    './src/assets/animations',
    // Design system assets from workspace packages
    '../design-system/src/assets',
    '../primitives/src/assets',
  ],

  // Source code directories to include in the bundle
  sourceExts: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json',
    'svg',
    'png',
    'jpg',
    'ttf',
    'otf',
  ],

  // Workspace package resolution for monorepo structure
  resolver: {
    extraNodeModules: {
      '@austa/design-system': path.resolve(__dirname, '../design-system'),
      '@design-system/primitives': path.resolve(__dirname, '../primitives'),
      '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
      '@austa/journey-context': path.resolve(__dirname, '../journey-context'),
    },
    // Ensure node_modules are properly resolved
    nodeModulesPaths: ['./node_modules'],
  },

  // Transformer configuration for handling various file types
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: true,
        inlineRequires: true,
      },
    }),
    // SVG transformer for journey and gamification icons
    svgTransformer: {
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
              },
            },
          },
        ],
      },
    },
  },

  // Metro bundler configuration
  metro: {
    resetCache: true,
    maxWorkers: 4,
    // Ensure proper resolution of workspace packages
    watchFolders: [
      path.resolve(__dirname, '../design-system'),
      path.resolve(__dirname, '../primitives'),
      path.resolve(__dirname, '../interfaces'),
      path.resolve(__dirname, '../journey-context'),
    ],
  },
};