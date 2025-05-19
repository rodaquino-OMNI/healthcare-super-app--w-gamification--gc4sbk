#!/usr/bin/env node

/**
 * TypeScript Server patch for Yarn Plug'n'Play support
 * 
 * This file extends TypeScript's module resolution capabilities to work with Yarn PnP,
 * enabling proper path alias resolution (@app/auth, @app/shared, @austa/*) and support
 * for the new packages (@austa/design-system, @design-system/primitives, @austa/interfaces,
 * @austa/journey-context).
 * 
 * Compatible with TypeScript 5.3.3 as specified in the technical requirements.
 */

const {existsSync, readFileSync} = require('fs');
const {createRequire, createRequireFromPath} = require('module');
const {resolve, dirname} = require('path');

const relPnpApiPath = "../../../../.pnp.cjs";

const absPnpApiPath = resolve(__dirname, relPnpApiPath);
const isStrictPnP = existsSync(absPnpApiPath);

// Setup the environment to be able to require typescript
if (isStrictPnP) {
  // Load the PnP API from the project root
  const pnpApi = require(absPnpApiPath);

  // Setup the PnP runtime
  if (pnpApi.setup) {
    pnpApi.setup();
  }
}

// Prepare the module resolution function
const moduleResolution = isStrictPnP
  ? require(absPnpApiPath).resolveRequest
  : createRequire(absPnpApiPath).resolve;

// Define the version of TypeScript we're compatible with
const TYPESCRIPT_VERSION = '5.3.3';

// Determine the actual TypeScript module path
const relativeTypescriptPath = require.resolve('typescript/lib/tsserverlibrary', {
  paths: [__dirname],
});

// Load the TypeScript module
const typescript = require(relativeTypescriptPath);

// Verify TypeScript version compatibility
const currentVersion = typescript.version;
if (currentVersion !== TYPESCRIPT_VERSION) {
  console.warn(`Warning: This patch is designed for TypeScript ${TYPESCRIPT_VERSION}, but found ${currentVersion}. Some features may not work correctly.`);
}

/**
 * Patch TypeScript's module resolution to work with Yarn PnP
 * and support path aliases (@app/auth, @app/shared, @austa/*)
 * 
 * This patch specifically addresses the following requirements:
 * 1. Path resolution failures with path aliases (@app/auth, @app/shared, @austa/*)
 * 2. Module resolution issues for TypeScript configuration
 * 3. Support for the four new packages:
 *    - @austa/design-system
 *    - @design-system/primitives
 *    - @austa/interfaces
 *    - @austa/journey-context
 */
if (isStrictPnP) {
  const patchedCreateProgram = typescript.server.createProgram;
  
  typescript.server.createProgram = function(rootNames, options, host, oldProgram) {
    // Save the original resolveModuleNames function
    const originalResolveModuleNames = host.resolveModuleNames;
    
    // Override the resolveModuleNames function to use PnP resolution
    host.resolveModuleNames = function(moduleNames, containingFile, reusedNames, redirectedReference, options) {
      // Try to use the original implementation first
      const originalResult = originalResolveModuleNames.call(host, moduleNames, containingFile, reusedNames, redirectedReference, options);
      
      // For any modules that couldn't be resolved, try using PnP resolution
      return moduleNames.map((moduleName, index) => {
        // If the module was already resolved successfully, use that result
        if (originalResult[index]) {
          return originalResult[index];
        }
        
        // Special handling for path aliases
        if (moduleName.startsWith('@app/') || moduleName.startsWith('@austa/')) {
          try {
            // Try to resolve the module using PnP
            const resolvedPath = moduleResolution(moduleName, containingFile);
            
            if (resolvedPath) {
              // Create a ResolvedModule object that TypeScript understands
              return {
                resolvedFileName: resolvedPath,
                isExternalLibraryImport: true,
                extension: typescript.Extension.Dts,
              };
            }
          } catch (error) {
            // If resolution fails, continue to the next step
          }
        }
        
        // Handle specific new packages
        if (
          moduleName === '@austa/design-system' ||
          moduleName === '@design-system/primitives' ||
          moduleName === '@austa/interfaces' ||
          moduleName === '@austa/journey-context'
        ) {
          try {
            // Try to resolve the module using PnP
            const resolvedPath = moduleResolution(moduleName, containingFile);
            
            if (resolvedPath) {
              // Create a ResolvedModule object that TypeScript understands
              return {
                resolvedFileName: resolvedPath,
                isExternalLibraryImport: true,
                extension: typescript.Extension.Dts,
              };
            }
          } catch (error) {
            // If resolution fails, continue to the next step
          }
        }
        
        // For any other module, try using PnP resolution
        try {
          const resolvedPath = moduleResolution(moduleName, containingFile);
          
          if (resolvedPath) {
            // Create a ResolvedModule object that TypeScript understands
            return {
              resolvedFileName: resolvedPath,
              isExternalLibraryImport: true,
              extension: typescript.Extension.Js,
            };
          }
        } catch (error) {
          // If resolution fails, return undefined
        }
        
        // If all resolution attempts fail, return undefined
        return undefined;
      });
    };
    
    // Call the original createProgram function with the patched host
    return patchedCreateProgram(rootNames, options, host, oldProgram);
  };
  
  /**
   * Patch TypeScript's file watching to work with Yarn PnP
   */
  const patchedWatchDirectory = typescript.sys.watchDirectory;
  typescript.sys.watchDirectory = function(path, callback, recursive, options) {
    // Handle watching PnP virtual directories
    if (path.includes('.yarn') || path.includes('.pnp')) {
      // For PnP directories, use a no-op watcher to prevent errors
      return { close: () => {} };
    }
    
    // For regular directories, use the original implementation
    return patchedWatchDirectory(path, callback, recursive, options);
  };
  
  /**
   * Add support for PnP in type acquisition
   */
  const patchedGetTypeRoots = typescript.server.getTypeRoots;
  if (patchedGetTypeRoots) {
    typescript.server.getTypeRoots = function(host, options) {
      const originalTypeRoots = patchedGetTypeRoots(host, options);
      
      try {
        // Add PnP-specific type roots
        const pnpTypeRoots = getPnpTypeRoots(options);
        return [...originalTypeRoots, ...pnpTypeRoots];
      } catch (error) {
        return originalTypeRoots;
      }
    };
  }
  
  /**
   * Helper function to get type roots from PnP
   */
  function getPnpTypeRoots(options) {
    const typeRoots = [];
    
    try {
      const pnpApi = require(absPnpApiPath);
      const packageManager = pnpApi.getPackageManager();
      
      // Get all packages that provide @types
      const packages = packageManager.getDependencies();
      
      for (const [name, reference] of packages) {
        if (name.startsWith('@types/')) {
          try {
            const packageInfo = packageManager.getPackageInformation(reference);
            if (packageInfo && packageInfo.packageLocation) {
              typeRoots.push(packageInfo.packageLocation);
            }
          } catch (error) {
            // Skip packages that can't be resolved
          }
        }
      }
      
      // Explicitly add support for the new packages
      const newPackages = [
        '@austa/design-system',
        '@design-system/primitives',
        '@austa/interfaces',
        '@austa/journey-context'
      ];
      
      for (const packageName of newPackages) {
        try {
          // Try to resolve the package using PnP
          const packagePath = moduleResolution(packageName, options.configFilePath || '/');
          if (packagePath) {
            const packageDir = dirname(packagePath);
            typeRoots.push(packageDir);
          }
        } catch (error) {
          // Skip packages that can't be resolved
        }
      }
    } catch (error) {
      // If there's an error accessing PnP API, return an empty array
    }
    
    return typeRoots;
  }
}

/**
 * Add support for path mapping in tsconfig.json
 */
if (isStrictPnP && typescript.sys && typescript.sys.readFile) {
  const originalReadFile = typescript.sys.readFile;
  
  typescript.sys.readFile = function(path, encoding) {
    const content = originalReadFile(path, encoding);
    
    // If this is a tsconfig.json file, enhance it with path mappings for our packages
    if (path.endsWith('tsconfig.json') && content) {
      try {
        const config = JSON.parse(content);
        
        // Ensure compilerOptions and paths exist
        config.compilerOptions = config.compilerOptions || {};
        config.compilerOptions.paths = config.compilerOptions.paths || {};
        
        // Add path mappings for our special packages if they don't exist
        const pathMappings = {
          '@app/*': ['src/app/*'],
          '@austa/design-system': ['src/web/design-system/src'],
          '@design-system/primitives': ['src/web/primitives/src'],
          '@austa/interfaces': ['src/web/interfaces'],
          '@austa/journey-context': ['src/web/journey-context/src']
        };
        
        // Add each path mapping if it doesn't already exist
        for (const [key, value] of Object.entries(pathMappings)) {
          if (!config.compilerOptions.paths[key]) {
            config.compilerOptions.paths[key] = value;
          }
        }
        
        // Return the enhanced config
        return JSON.stringify(config, null, 2);
      } catch (error) {
        // If parsing fails, return the original content
        return content;
      }
    }
    
    // For all other files, return the original content
    return content;
  };
}

// Start the TypeScript server with the patched module
require(relativeTypescriptPath + '/tsserver');