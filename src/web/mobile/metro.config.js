/**
 * Metro configuration for the AUSTA SuperApp mobile application
 * 
 * This configuration file defines how the JavaScript code is bundled for the 
 * AUSTA SuperApp mobile application, including module resolution, asset handling,
 * optimization settings, and shared code inclusion.
 *
 * @format
 */

const path = require('path'); // path module from Node.js (builtin)
const { getDefaultConfig } = require('metro-config'); // metro-config ^0.76.7
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();
  
  return {
    // Transformer configuration for code processing
    transformer: {
      // Use the React Native Babel transformer
      babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
      
      // Asset plugins for optimizing assets like images
      assetPlugins: ['react-native-asset-plugin'],
      
      // Options for transform behavior
      getTransformOptions: async () => ({
        transform: {
          // Enable inline requires for better performance
          inlineRequires: {
            includeNodeModules: true,
          },
          // Enable experimental features for better compatibility
          experimentalImportSupport: true,
          // Use the new transform for better performance
          unstable_disableES6Transforms: false,
        },
      }),
    },
    
    // Resolver configuration for module resolution and import handling
    resolver: {
      // Exclude specific patterns from being processed
      blacklistRE: exclusionList([
        // Exclude duplicate React instances
        /node_modules\/.*\/node_modules\/react\/.*/, 
        // Exclude duplicate React Native instances
        /node_modules\/.*\/node_modules\/react-native\/.*/, 
        // Exclude duplicate @babel/runtime instances
        /node_modules\/.*\/node_modules\/@babel\/runtime\/.*/,
      ]),
      
      // Path aliases for easier and more maintainable imports
      extraNodeModules: {
        // Internal app paths
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@screens': path.resolve(__dirname, 'src/screens'),
        '@navigation': path.resolve(__dirname, 'src/navigation'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@utils': path.resolve(__dirname, 'src/utils'),
        '@api': path.resolve(__dirname, 'src/api'),
        '@context': path.resolve(__dirname, 'src/context'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@constants': path.resolve(__dirname, 'src/constants'),
        '@i18n': path.resolve(__dirname, 'src/i18n'),
        
        // Monorepo package paths
        '@austa/design-system': path.resolve(__dirname, '../design-system'),
        '@design-system/primitives': path.resolve(__dirname, '../primitives'),
        '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
        '@austa/journey-context': path.resolve(__dirname, '../journey-context'),
        '@austa/shared': path.resolve(__dirname, '../shared'),
        
        // Ensure React Native can be resolved properly
        'react': path.resolve(__dirname, '../../node_modules/react'),
        'react-native': path.resolve(__dirname, '../../node_modules/react-native'),
      },
      
      // Asset extensions that Metro will process
      assetExts: [
        ...assetExts,
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ttf', 'otf', 'mp4', 'mp3', 'json', 'webp',
        'svg', 'pdf', 'woff', 'woff2', 'eot' // Additional asset types used in design system
      ],
      
      // Source extensions that Metro will process
      sourceExts: [
        ...sourceExts, 
        'js', 'jsx', 'ts', 'tsx', 'json',
        'mjs', 'cjs', // Support for ESM and CommonJS modules
        'md', 'mdx'   // Support for markdown files used in documentation
      ],
      
      // Ensure symlinks are resolved properly
      resolveRequest: null,
      
      // Use haste for faster module resolution
      useWatchman: true,
    },
    
    // Additional folders to watch for changes
    // This allows for code sharing between the mobile app and other parts of the application
    watchFolders: [
      // Core app folders
      path.resolve(__dirname, '../shared'),           // Shared code between web and mobile
      path.resolve(__dirname, '../design-system'),    // Shared design system
      
      // New packages
      path.resolve(__dirname, '../primitives'),       // Design system primitives
      path.resolve(__dirname, '../interfaces'),       // Shared TypeScript interfaces
      path.resolve(__dirname, '../journey-context'),  // Journey state management
      
      // Node modules
      path.resolve(__dirname, '../../node_modules'),  // Root node modules
    ],
    
    // Server configuration
    server: {
      port: 8081,
      enhanceMiddleware: (middleware) => {
        return middleware;
      },
    },
    
    // Maximum number of worker processes to use for transforming files
    // This improves build performance, especially on CI/CD systems
    maxWorkers: 4,
    
    // Cache configuration for better performance
    cacheStores: [
      {
        name: 'metro',
        type: 'local',
        cacheDir: path.resolve(__dirname, '.metro-cache'),
      },
    ],
    
    // Cache version for invalidating the Metro cache when needed
    cacheVersion: '2.0.0', // Incremented to invalidate previous cache
    
    // Project root for the mobile application
    projectRoot: __dirname,
  };
})();