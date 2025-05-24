#!/usr/bin/env node

/**
 * @license
 * Copyright (c) 2023 AUSTA Health.
 * 
 * This file is part of the AUSTA SuperApp TypeScript SDK.
 * It patches the TypeScript language server to work with Yarn's Plug'n'Play mode.
 * 
 * This implementation specifically addresses the AUSTA SuperApp monorepo structure and
 * provides special handling for the new packages:
 * - @austa/design-system
 * - @design-system/primitives
 * - @austa/interfaces
 * - @austa/journey-context
 */

'use strict';

// Store the original Node.js require function
const originalRequire = module.constructor.prototype.require;

// Try to load the PnP API
let pnp;
try {
  pnp = require('pnpapi');
} catch (error) {
  // PnP API not available, which means we're not running in PnP mode
  // This can happen when running in a non-PnP environment or during testing
  if (process.env.NODE_ENV !== 'test' && !process.env.DISABLE_PNP_LOGGING) {
    console.warn('Yarn PnP API not found, falling back to standard resolution');
  }
}

// Load the TypeScript module resolution hook
let hook;
try {
  hook = require('./hook');
} catch (error) {
  // Hook not available, which means we're not running in the SDK environment
  if (process.env.NODE_ENV !== 'test' && !process.env.DISABLE_PNP_LOGGING) {
    console.warn('TypeScript hook not found, falling back to standard resolution');
  }
}

// Load the TypeScript module resolver
let resolver;
try {
  resolver = require('./resolver');
} catch (error) {
  // Resolver not available, which means we're not running in the SDK environment
  if (process.env.NODE_ENV !== 'test' && !process.env.DISABLE_PNP_LOGGING) {
    console.warn('TypeScript resolver not found, falling back to standard resolution');
  }
}

// Load the PnP utility functions
let pnpify;
try {
  pnpify = require('./pnpify');
} catch (error) {
  // PnPify not available, which means we're not running in the SDK environment
  if (process.env.NODE_ENV !== 'test' && !process.env.DISABLE_PNP_LOGGING) {
    console.warn('TypeScript PnPify not found, falling back to standard resolution');
  }
}

/**
 * Map of monorepo packages to their filesystem locations.
 * This is used to ensure proper resolution of the new packages.
 */
const MONOREPO_PACKAGES = {
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

/**
 * Path aliases defined in tsconfig.json files across the monorepo.
 * These are used to resolve imports like @app/auth, @app/shared, etc.
 */
const PATH_ALIASES = {
  '@app/auth': 'src/backend/auth-service/src',
  '@app/shared': 'src/backend/shared',
  '@app/api': 'src/backend/api-gateway/src',
  '@austa': 'src/web'
};

/**
 * Patches the Node.js require function to support PnP resolution.
 * This is necessary for the TypeScript language server to resolve modules correctly.
 */
function patchRequire() {
  if (module.constructor.prototype.require.__pnpified) return;
  
  module.constructor.prototype.require = function pnpRequire(request) {
    // Skip patching for native modules
    if (request.startsWith('node:') || request === 'pnpapi') {
      return originalRequire.call(this, request);
    }
    
    // Get the file making the import request
    const issuer = this.filename || 'repl';
    
    // Try to resolve the module using PnP
    if (pnp) {
      try {
        const resolution = pnp.resolveRequest(request, issuer, { considerBuiltins: true });
        if (resolution) {
          return originalRequire.call(this, resolution);
        }
      } catch (error) {
        // PnP resolution failed, fall back to standard resolution
      }
    }
    
    // Fall back to the original require
    return originalRequire.call(this, request);
  };
  
  // Mark the require function as pnpified to avoid double patching
  module.constructor.prototype.require.__pnpified = true;
}

/**
 * Patches the TypeScript language server to support PnP resolution.
 * This is the main entry point for the tsserver.js file.
 */
function patchTypeScriptServer() {
  // Patch the require function to support PnP resolution
  patchRequire();
  
  // Load the original TypeScript module
  const typescript = require('typescript');
  
  // Apply the PnPify patch if available
  if (pnpify) {
    pnpify(typescript);
  }
  
  // Get the path to the original tsserver.js file
  const tsServerPath = require.resolve('typescript/lib/tsserver.js');
  
  // Load the original tsserver.js file
  const tsServer = require(tsServerPath);
  
  // Patch the server's module resolution if the hook is available
  if (hook) {
    // Store the original createServerHost function
    const originalCreateServerHost = tsServer.createServerHost;
    
    // Patch the createServerHost function to use our custom module resolution
    tsServer.createServerHost = function(args) {
      // Create the original server host
      const host = originalCreateServerHost.call(this, args);
      
      // Store the original resolveModuleNames function
      const originalResolveModuleNames = host.resolveModuleNames;
      
      // Patch the resolveModuleNames function to use our custom module resolution
      host.resolveModuleNames = function(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) {
        // First try to resolve using our custom resolver if available
        if (resolver && resolver.resolveModuleName) {
          const resolvedModules = [];
          let allResolved = true;
          
          for (const moduleName of moduleNames) {
            const resolved = resolver.resolveModuleName(moduleName, containingFile);
            if (resolved) {
              resolvedModules.push(resolved);
            } else {
              allResolved = false;
              break;
            }
          }
          
          if (allResolved) {
            return resolvedModules;
          }
        }
        
        // Fall back to the original resolveModuleNames
        return originalResolveModuleNames.call(this, moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);
      };
      
      // Store the original resolveTypeReferenceDirectives function
      const originalResolveTypeReferenceDirectives = host.resolveTypeReferenceDirectives;
      
      // Patch the resolveTypeReferenceDirectives function to use our custom module resolution
      host.resolveTypeReferenceDirectives = function(typeDirectiveNames, containingFile, redirectedReference, options, containingFileMode) {
        // First try to resolve using our custom resolver if available
        if (resolver && resolver.resolveTypeReferenceDirective) {
          const resolvedDirectives = [];
          let allResolved = true;
          
          for (const typeDirectiveName of typeDirectiveNames) {
            const resolved = resolver.resolveTypeReferenceDirective(typeDirectiveName, containingFile);
            if (resolved) {
              resolvedDirectives.push(resolved);
            } else {
              allResolved = false;
              break;
            }
          }
          
          if (allResolved) {
            return resolvedDirectives;
          }
        }
        
        // Fall back to the original resolveTypeReferenceDirectives
        return originalResolveTypeReferenceDirectives.call(this, typeDirectiveNames, containingFile, redirectedReference, options, containingFileMode);
      };
      
      // Patch the fileExists function to handle PnP virtual paths
      const originalFileExists = host.fileExists;
      host.fileExists = function(path) {
        // First try to resolve using PnP if available
        if (pnp) {
          try {
            // Check if the path is a PnP virtual path
            if (path.includes('.zip/node_modules/')) {
              // PnP virtual paths always exist if they're properly formatted
              return true;
            }
            
            // Check if the path is a monorepo package path
            for (const [pkg, location] of Object.entries(MONOREPO_PACKAGES)) {
              if (path.includes(pkg) || path.includes(location)) {
                // Try to resolve the path using PnP
                const resolved = pnp.resolveRequest(path, null, { considerBuiltins: false });
                if (resolved) {
                  return true;
                }
              }
            }
            
            // Check if the path is a path alias
            for (const [alias, location] of Object.entries(PATH_ALIASES)) {
              if (path.includes(alias) || path.includes(location)) {
                // Try to resolve the path using PnP
                const resolved = pnp.resolveRequest(path, null, { considerBuiltins: false });
                if (resolved) {
                  return true;
                }
              }
            }
          } catch (error) {
            // PnP resolution failed, fall back to standard resolution
          }
        }
        
        // Fall back to the original fileExists
        return originalFileExists.call(this, path);
      };
      
      // Patch the readFile function to handle PnP virtual paths
      const originalReadFile = host.readFile;
      host.readFile = function(path) {
        // First try to resolve using PnP if available
        if (pnp) {
          try {
            // Check if the path is a PnP virtual path
            if (path.includes('.zip/node_modules/')) {
              // Try to resolve the path using PnP
              const resolved = pnp.resolveRequest(path, null, { considerBuiltins: false });
              if (resolved) {
                // Read the file using the resolved path
                const fs = require('fs');
                return fs.readFileSync(resolved, 'utf8');
              }
            }
            
            // Check if the path is a monorepo package path
            for (const [pkg, location] of Object.entries(MONOREPO_PACKAGES)) {
              if (path.includes(pkg) || path.includes(location)) {
                // Try to resolve the path using PnP
                const resolved = pnp.resolveRequest(path, null, { considerBuiltins: false });
                if (resolved) {
                  // Read the file using the resolved path
                  const fs = require('fs');
                  return fs.readFileSync(resolved, 'utf8');
                }
              }
            }
            
            // Check if the path is a path alias
            for (const [alias, location] of Object.entries(PATH_ALIASES)) {
              if (path.includes(alias) || path.includes(location)) {
                // Try to resolve the path using PnP
                const resolved = pnp.resolveRequest(path, null, { considerBuiltins: false });
                if (resolved) {
                  // Read the file using the resolved path
                  const fs = require('fs');
                  return fs.readFileSync(resolved, 'utf8');
                }
              }
            }
          } catch (error) {
            // PnP resolution failed, fall back to standard resolution
          }
        }
        
        // Fall back to the original readFile
        return originalReadFile.call(this, path);
      };
      
      // Add support for the hook if available
      if (hook) {
        // Store the original getScriptSnapshot function
        const originalGetScriptSnapshot = host.getScriptSnapshot;
        
        // Patch the getScriptSnapshot function to use our custom module resolution
        host.getScriptSnapshot = function(path) {
          // First try to resolve using our custom hook
          const resolvedPath = hook({
            request: path,
            issuer: null,
            resolveOptions: { considerBuiltins: false }
          }, () => null);
          
          if (resolvedPath && resolvedPath.resolvedModule) {
            // Read the file using the resolved path
            const fs = require('fs');
            const content = fs.readFileSync(resolvedPath.resolvedModule.resolvedFileName, 'utf8');
            
            // Create a script snapshot from the content
            return {
              getText: (start, end) => content.substring(start, end),
              getLength: () => content.length,
              getChangeRange: () => undefined
            };
          }
          
          // Fall back to the original getScriptSnapshot
          return originalGetScriptSnapshot.call(this, path);
        };
      }
      
      return host;
    };
  }
  
  // Return the patched tsServer
  return tsServer;
}

// Patch the TypeScript language server
const patchedTsServer = patchTypeScriptServer();

// Export the patched tsServer
module.exports = patchedTsServer;

// If this script is run directly, start the server
if (require.main === module) {
  // Get the command line arguments
  const args = process.argv.slice(2);
  
  // Check if the --version flag is present
  if (args.includes('--version')) {
    // Print the TypeScript version with the -sdk suffix to indicate it's patched
    const typescript = require('typescript');
    console.log(`${typescript.version}-sdk`);
    process.exit(0);
  }
  
  // Start the server
  patchedTsServer.startServer();
}