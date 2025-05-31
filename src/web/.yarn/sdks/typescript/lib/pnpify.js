#!/usr/bin/env node

/**
 * pnpify.js - TypeScript Module Resolution for Yarn PnP
 * 
 * This utility enhances TypeScript's module resolution to work with Yarn's Plug'n'Play mode.
 * It translates between TypeScript's module resolution system and PnP's virtual file paths,
 * ensuring that dependencies in node_modules and workspace packages are correctly resolved.
 * 
 * This implementation specifically addresses the AUSTA SuperApp monorepo structure and
 * provides special handling for the new packages:
 * - @austa/design-system
 * - @design-system/primitives
 * - @austa/interfaces
 * - @austa/journey-context
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Store the original Node.js require
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

// Map of monorepo packages to their filesystem locations
// This is used to ensure proper resolution of the new packages
const MONOREPO_PACKAGES = {
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

// Path aliases defined in tsconfig.json files across the monorepo
// These are used to resolve imports like @app/auth, @app/shared, etc.
const PATH_ALIASES = {
  '@app/auth': 'src/backend/auth-service/src',
  '@app/shared': 'src/backend/shared',
  '@app/api': 'src/backend/api-gateway/src'
};

/**
 * Normalizes a file path to ensure consistent handling across platforms
 * 
 * @param {string} filePath - The file path to normalize
 * @returns {string} The normalized file path
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Checks if a path is a monorepo package path
 * 
 * @param {string} request - The import request path
 * @returns {boolean} True if the path is a monorepo package path
 */
function isMonorepoPackage(request) {
  return Object.keys(MONOREPO_PACKAGES).some(pkg => 
    request === pkg || request.startsWith(`${pkg}/`));
}

/**
 * Resolves a monorepo package path to its filesystem location
 * 
 * @param {string} request - The import request path
 * @returns {string|null} The resolved filesystem path or null if not found
 */
function resolveMonorepoPackage(request) {
  for (const [pkg, location] of Object.entries(MONOREPO_PACKAGES)) {
    if (request === pkg || request.startsWith(`${pkg}/`)) {
      const projectRoot = findProjectRoot();
      if (!projectRoot) return null;
      
      const packagePath = path.join(projectRoot, location);
      
      if (request === pkg) {
        // If requesting the package itself, return the package path
        return packagePath;
      } else {
        // If requesting a file within the package, resolve the file path
        const relativePath = request.slice(pkg.length + 1);
        return path.join(packagePath, relativePath);
      }
    }
  }
  
  return null;
}

/**
 * Resolves a path alias to its filesystem location
 * 
 * @param {string} request - The import request path
 * @returns {string|null} The resolved filesystem path or null if not found
 */
function resolvePathAlias(request) {
  for (const [alias, location] of Object.entries(PATH_ALIASES)) {
    if (request === alias || request.startsWith(`${alias}/`)) {
      const projectRoot = findProjectRoot();
      if (!projectRoot) return null;
      
      const aliasPath = path.join(projectRoot, location);
      
      if (request === alias) {
        // If requesting the alias itself, return the alias path
        return aliasPath;
      } else {
        // If requesting a file within the alias, resolve the file path
        const relativePath = request.slice(alias.length + 1);
        return path.join(aliasPath, relativePath);
      }
    }
  }
  
  return null;
}

/**
 * Finds the project root directory by looking for a package.json file
 * 
 * @returns {string|null} The project root directory or null if not found
 */
function findProjectRoot() {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Resolves a module request using PnP or fallback strategies
 * 
 * @param {string} request - The import request path
 * @param {string} issuer - The file making the import request
 * @returns {string|null} The resolved module path or null if not found
 */
function resolveModuleRequest(request, issuer) {
  // First check if it's a monorepo package
  const monorepoPath = resolveMonorepoPackage(request);
  if (monorepoPath && fs.existsSync(monorepoPath)) {
    return monorepoPath;
  }
  
  // Then check if it's a path alias
  const aliasPath = resolvePathAlias(request);
  if (aliasPath && fs.existsSync(aliasPath)) {
    return aliasPath;
  }
  
  // If PnP API is available, use it to resolve the module
  if (pnp) {
    try {
      const resolution = pnp.resolveRequest(request, issuer, { considerBuiltins: true });
      return resolution;
    } catch (error) {
      // PnP resolution failed, fall back to Node.js resolution
      if (process.env.NODE_ENV === 'development' && !process.env.DISABLE_PNP_LOGGING) {
        console.warn(`PnP resolution failed for ${request} from ${issuer}:`, error.message);
      }
    }
  }
  
  // Fall back to Node.js resolution
  return null;
}

/**
 * Patches the Node.js require function to support PnP resolution
 */
function patchRequire() {
  if (module.constructor.prototype.require.__pnpified) return;
  
  module.constructor.prototype.require = function pnpRequire(request) {
    const issuer = normalizePath(this.filename || 'repl');
    
    // Try to resolve the module using our custom resolver
    const resolvedPath = resolveModuleRequest(request, issuer);
    
    if (resolvedPath) {
      // If resolved, use the original require with the resolved path
      return originalRequire.call(this, resolvedPath);
    }
    
    // If not resolved, fall back to the original require
    return originalRequire.call(this, request);
  };
  
  // Mark the require function as pnpified to avoid double patching
  module.constructor.prototype.require.__pnpified = true;
}

/**
 * Patches TypeScript's module resolution to support PnP
 * 
 * @param {object} typescript - The TypeScript module
 * @returns {object} The patched TypeScript module
 */
function patchTypeScript(typescript) {
  // Skip patching if already patched
  if (typescript.__pnpified) return typescript;
  
  // Store the original resolveModuleName function
  const originalResolveModuleName = typescript.resolveModuleName;
  
  // Patch the resolveModuleName function
  typescript.resolveModuleName = function pnpResolveModuleName(moduleName, containingFile, compilerOptions, host, cache, redirectedReference) {
    const normalizedContainingFile = normalizePath(containingFile);
    
    // First try to resolve using our custom resolver
    const resolvedPath = resolveModuleRequest(moduleName, normalizedContainingFile);
    
    if (resolvedPath) {
      // If resolved, create a ResolvedModule object
      return {
        resolvedModule: {
          resolvedFileName: resolvedPath,
          isExternalLibraryImport: !resolvedPath.includes('/src/'),
          extension: path.extname(resolvedPath)
        }
      };
    }
    
    // If not resolved, fall back to the original resolveModuleName
    return originalResolveModuleName(moduleName, containingFile, compilerOptions, host, cache, redirectedReference);
  };
  
  // Store the original resolveTypeReferenceDirective function
  const originalResolveTypeReferenceDirective = typescript.resolveTypeReferenceDirective;
  
  // Patch the resolveTypeReferenceDirective function
  typescript.resolveTypeReferenceDirective = function pnpResolveTypeReferenceDirective(typeDirectiveName, containingFile, compilerOptions, host, redirectedReference) {
    const normalizedContainingFile = normalizePath(containingFile);
    
    // First try to resolve using our custom resolver
    const resolvedPath = resolveModuleRequest(typeDirectiveName, normalizedContainingFile);
    
    if (resolvedPath) {
      // If resolved, create a ResolvedTypeReferenceDirective object
      return {
        resolvedTypeReferenceDirective: {
          resolvedFileName: resolvedPath,
          primary: true,
          packageId: {
            name: typeDirectiveName,
            subModuleName: '',
            version: '0.0.0'
          }
        }
      };
    }
    
    // If not resolved, fall back to the original resolveTypeReferenceDirective
    return originalResolveTypeReferenceDirective(typeDirectiveName, containingFile, compilerOptions, host, redirectedReference);
  };
  
  // Mark the TypeScript module as pnpified to avoid double patching
  typescript.__pnpified = true;
  
  return typescript;
}

/**
 * Main entry point for the pnpify utility
 * 
 * @param {string[]} args - Command line arguments
 */
function main(args) {
  // Patch the require function to support PnP resolution
  patchRequire();
  
  // If no arguments provided, just exit
  if (args.length === 0) {
    process.exit(0);
  }
  
  // Get the TypeScript module path from the first argument
  const typescriptPath = args[0];
  
  // Load the TypeScript module
  const typescript = require(typescriptPath);
  
  // Patch the TypeScript module
  const patchedTypeScript = patchTypeScript(typescript);
  
  // Export the patched TypeScript module
  module.exports = patchedTypeScript;
}

// If this script is run directly, call the main function with the command line arguments
if (require.main === module) {
  main(process.argv.slice(2));
}

// Export the patchTypeScript function for use in other modules
module.exports = patchTypeScript;