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
          // Enable experimental features for better performance
          experimentalImportSupport: true,
        },
      }),
    },
    
    // Resolver configuration for module resolution and import handling
    resolver: {
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
        
        // New package paths for monorepo resolution
        '@austa/design-system': path.resolve(__dirname, '../design-system'),
        '@design-system/primitives': path.resolve(__dirname, '../primitives'),
        '@austa/interfaces': path.resolve(__dirname, '../interfaces'),
        '@austa/journey-context': path.resolve(__dirname, '../journey-context'),
      },
      
      // Asset extensions that Metro will process
      assetExts: [
        ...assetExts,
        'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ttf', 'otf', 'mp4', 'mp3', 'json', 'webp', 'svg'
      ],
      
      // Source extensions that Metro will process
      sourceExts: [...sourceExts, 'js', 'jsx', 'ts', 'tsx', 'json', 'mjs', 'cjs'],
      
      // Ensure symlinks are resolved properly for monorepo structure
      resolveRequest: null,
      
      // Blacklist specific directories to avoid processing unnecessary files
      blockList: [/\.git\/.*/],
    },
    
    // Additional folders to watch for changes
    // This allows for code sharing between the mobile app and other parts of the application
    watchFolders: [
      // Original watch folders
      path.resolve(__dirname, '../shared'),      // Shared code between web and mobile
      path.resolve(__dirname, '../design-system'), // Shared design system
      
      // New watch folders for the refactored packages
      path.resolve(__dirname, '../primitives'),    // Design system primitives
      path.resolve(__dirname, '../interfaces'),    // Shared TypeScript interfaces
      path.resolve(__dirname, '../journey-context'), // Journey context provider
      
      // Node modules at the workspace root
      path.resolve(__dirname, '../../node_modules'), // Node modules
    ],
    
    // Maximum number of worker processes to use for transforming files
    // This improves build performance, especially on CI/CD systems
    maxWorkers: 4,
    
    // Cache configuration for improved build performance
    cacheStores: [
      // Use the default cache store with a specific version
      {
        type: 'file',
      },
    ],
    
    // Cache version for invalidating the Metro cache when needed
    cacheVersion: '2.0.0', // Updated cache version for the refactored structure
    
    // Server configuration
    server: {
      port: 8081,
      enhanceMiddleware: (middleware) => {
        return middleware;
      },
    },
  };
})();