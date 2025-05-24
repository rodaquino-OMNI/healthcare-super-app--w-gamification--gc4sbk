#!/usr/bin/env node

/**
 * TypeScript SDK integration with Yarn's Plug'n'Play mode
 * 
 * This file registers TypeScript with the Yarn PnP API, establishes correct module resolution
 * for path aliases, and configures the language service to properly recognize shared packages.
 * 
 * It ensures that IDEs can provide accurate code navigation, auto-completion, and type checking
 * for TypeScript files across the monorepo, particularly for path aliases like @app/auth,
 * @app/shared, and @austa/* packages.
 * 
 * Key features:
 * - Configures PnP-aware TypeScript resolution for the four new packages
 *   (@austa/design-system, @design-system/primitives, @austa/interfaces, @austa/journey-context)
 * - Registers path aliases from tsconfig.json to ensure proper module resolution for imports with @ prefix
 * - Adds support for cross-platform type resolution between web and mobile applications
 * - Enables proper IDE integration for TypeScript language features in the monorepo
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Determine the project root directory
const pnpFile = path.resolve(__dirname, '../../../.pnp.cjs');
const projectRoot = path.resolve(path.dirname(pnpFile), '../..');

// Check if the .pnp.cjs file exists
if (!fs.existsSync(pnpFile)) {
  console.error(`Failed to locate the .pnp.cjs file at ${pnpFile}`);
  process.exit(1);
}

// Load the PnP API
const pnpApi = require(pnpFile);

// Register the TypeScript SDK with the PnP API
if (typeof pnpApi.setup === 'function') {
  pnpApi.setup();
}

// Load the TypeScript module
let ts;
try {
  // First try to load from the project's dependencies
  ts = require('typescript');
} catch (e) {
  try {
    // Fallback to the SDK's own TypeScript version
    ts = require(path.resolve(__dirname, './node_modules/typescript'));
  } catch (e) {
    console.error('Failed to load TypeScript. Make sure it\'s installed in your project.');
    process.exit(1);
  }
}

// Load the resolver and hook modules
const resolver = require('./lib/resolver');
const hook = require('./lib/hook');
const pnpify = require('./lib/pnpify');
const tsserver = require('./lib/tsserver');

// Define the path aliases for the monorepo
const pathAliases = {
  '@app/auth': 'src/backend/auth-service',
  '@app/shared': 'src/backend/shared',
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

// Initialize the TypeScript SDK with the PnP API and path aliases
function initializeTypeScriptSdk() {
  // Register the path aliases with the resolver
  resolver.registerPathAliases(pathAliases, projectRoot);
  
  // Apply the PnP hook to TypeScript's module resolution
  hook.applyPnPHook(ts, pnpApi);
  
  // Configure the TypeScript language service for IDE integration
  tsserver.patchTypeScriptServer(ts);
  
  // Enable PnP-aware module resolution for TypeScript
  pnpify.enablePnPInTypeScript(ts, pnpApi);
  
  // Log successful initialization
  console.log('TypeScript SDK initialized with Yarn PnP integration');
  console.log(`Using TypeScript version: ${ts.version}`);
  
  // Register the new packages with the TypeScript module resolution system
  registerNewPackages();
}

// Register the four new packages with the TypeScript module resolution system
function registerNewPackages() {
  const newPackages = [
    {
      name: '@austa/design-system',
      path: path.resolve(projectRoot, 'src/web/design-system'),
      description: 'Design system with journey-specific theming and component library'
    },
    {
      name: '@design-system/primitives',
      path: path.resolve(projectRoot, 'src/web/primitives'),
      description: 'Fundamental design elements (colors, typography, spacing)'
    },
    {
      name: '@austa/interfaces',
      path: path.resolve(projectRoot, 'src/web/interfaces'),
      description: 'Shared TypeScript interfaces for cross-journey data models'
    },
    {
      name: '@austa/journey-context',
      path: path.resolve(projectRoot, 'src/web/journey-context'),
      description: 'Context provider for journey-specific state management'
    }
  ];
  
  // Register each package with the resolver
  newPackages.forEach(pkg => {
    resolver.registerPackage(pkg.name, pkg.path);
    console.log(`Registered package: ${pkg.name} (${pkg.description})`);
  });
}

// Load the tsconfig.json files to extract path mappings
function loadTsConfigPathMappings() {
  const tsconfigPaths = [
    path.resolve(projectRoot, 'src/web/tsconfig.json'),
    path.resolve(projectRoot, 'src/web/mobile/tsconfig.json'),
    path.resolve(projectRoot, 'src/web/web/tsconfig.json')
  ];
  
  tsconfigPaths.forEach(tsconfigPath => {
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
          // Register the path mappings with the resolver
          resolver.registerTsConfigPaths(tsconfig.compilerOptions.paths, path.dirname(tsconfigPath));
          console.log(`Loaded path mappings from: ${tsconfigPath}`);
        }
      } catch (e) {
        console.warn(`Failed to parse tsconfig.json at ${tsconfigPath}: ${e.message}`);
      }
    }
  });
}

// Configure cross-platform type resolution between web and mobile
function configureCrossPlatformResolution() {
  // Define platform-specific file extensions
  const platformExtensions = {
    web: ['.web.ts', '.web.tsx', '.web.js', '.web.jsx'],
    mobile: ['.native.ts', '.native.tsx', '.native.js', '.native.jsx', '.ios.ts', '.ios.js', '.android.ts', '.android.js']
  };
  
  // Register platform-specific resolution strategies
  resolver.registerPlatformExtensions(platformExtensions);
  console.log('Configured cross-platform type resolution between web and mobile');
}

// Main execution
try {
  // Initialize the TypeScript SDK
  initializeTypeScriptSdk();
  
  // Load path mappings from tsconfig.json files
  loadTsConfigPathMappings();
  
  // Configure cross-platform resolution
  configureCrossPlatformResolution();
  
  console.log('TypeScript SDK successfully configured for the AUSTA SuperApp monorepo');
} catch (error) {
  console.error('Failed to initialize TypeScript SDK:', error);
  process.exit(1);
}

// Export the TypeScript module for use by other scripts
module.exports = ts;