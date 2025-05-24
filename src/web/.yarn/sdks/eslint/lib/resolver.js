/**
 * ESLint Resolver for Yarn Plug'n'Play
 *
 * This module implements the ESLint resolver interface for use with plugins like eslint-plugin-import.
 * It handles module resolution in a Yarn PnP environment, ensuring that ESLint can correctly locate
 * and load dependencies across the monorepo, including path aliases and workspace packages.
 *
 * This resolver is specifically designed to address the path resolution failures mentioned in the
 * technical specification and to support the standardized module resolution required for the project.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

// Import the config-resolver for ESLint configuration resolution
const configResolver = require('./config-resolver');

// Try to load the PnP API
let pnp;
try {
  pnp = require('pnpapi');
} catch (error) {
  // PnP API not available - we might be in a non-PnP environment
  // This can happen during testing or when running in a different environment
  console.warn('Yarn PnP API not available, falling back to standard resolution');
}

/**
 * Cache for resolved modules to improve performance
 * Format: { [request]:[issuer] => resolvedPath }
 */
const resolutionCache = new Map();

/**
 * Special packages that need custom handling in the monorepo
 */
const MONOREPO_PACKAGES = new Set([
  // New packages mentioned in the technical specification
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context',
  // Journey-specific packages
  '@app/auth',
  '@app/shared'
]);

/**
 * Resolves a module request using Yarn PnP API if available,
 * otherwise falls back to Node.js resolution
 *
 * @param {string} request - The module being requested (e.g., 'eslint-plugin-react')
 * @param {string} issuer - The file making the request
 * @returns {string|null} - The resolved path or null if not found
 */
function resolveModule(request, issuer) {
  // Check cache first
  const cacheKey = `${request}:${issuer}`;
  if (resolutionCache.has(cacheKey)) {
    return resolutionCache.get(cacheKey);
  }

  let resolved = null;

  // Handle special cases for ESLint plugins, configs, and parsers
  const isPlugin = request.startsWith('eslint-plugin-');
  const isConfig = request.startsWith('eslint-config-');
  const isParser = request.startsWith('@typescript-eslint/parser') || 
                  request.startsWith('babel-eslint') || 
                  request.startsWith('@babel/eslint-parser');

  try {
    if (pnp) {
      // Use PnP API for resolution
      try {
        resolved = pnp.resolveRequest(request, issuer, { considerBuiltins: false });
      } catch (pnpError) {
        // Handle ESLint plugin/config shorthand notation
        if (isPlugin && pnpError.code === 'MODULE_NOT_FOUND') {
          // Try with eslint-plugin- prefix if not already there
          if (!request.startsWith('eslint-plugin-')) {
            try {
              resolved = pnp.resolveRequest(`eslint-plugin-${request}`, issuer, { considerBuiltins: false });
            } catch (e) {
              // Ignore and continue with other resolution strategies
            }
          }
        } else if (isConfig && pnpError.code === 'MODULE_NOT_FOUND') {
          // Try with eslint-config- prefix if not already there
          if (!request.startsWith('eslint-config-')) {
            try {
              resolved = pnp.resolveRequest(`eslint-config-${request}`, issuer, { considerBuiltins: false });
            } catch (e) {
              // Ignore and continue with other resolution strategies
            }
          }
        }
      }
    }

    // Fall back to Node resolution if PnP resolution failed or PnP is not available
    if (!resolved) {
      // Use Node's require.resolve with the issuer's directory as the base
      const issuerDir = path.dirname(issuer);
      const originalResolveFilename = Module._resolveFilename;

      try {
        // Use Node's internal resolution mechanism
        resolved = Module._resolveFilename(request, {
          id: issuer,
          filename: issuer,
          paths: Module._nodeModulePaths(issuerDir)
        });
      } catch (nodeError) {
        // Handle ESLint plugin/config shorthand notation in Node resolution
        if (isPlugin && !request.startsWith('eslint-plugin-')) {
          try {
            resolved = Module._resolveFilename(`eslint-plugin-${request}`, {
              id: issuer,
              filename: issuer,
              paths: Module._nodeModulePaths(issuerDir)
            });
          } catch (e) {
            // Ignore and continue
          }
        } else if (isConfig && !request.startsWith('eslint-config-')) {
          try {
            resolved = Module._resolveFilename(`eslint-config-${request}`, {
              id: issuer,
              filename: issuer,
              paths: Module._nodeModulePaths(issuerDir)
            });
          } catch (e) {
            // Ignore and continue
          }
        }
      }
    }
  } catch (error) {
    // Resolution failed completely
    resolved = null;
  }

  // Cache the result
  resolutionCache.set(cacheKey, resolved);
  return resolved;
}

/**
 * Resolves a path alias based on tsconfig.json paths
 * 
 * @param {string} request - The module being requested
 * @param {string} issuer - The file making the request
 * @returns {string|null} - The resolved path or null if not found
 */
function resolvePathAlias(request, issuer) {
  // Only process path aliases (starting with @)
  if (!request.startsWith('@')) {
    return null;
  }

  // Handle special monorepo packages first
  if (MONOREPO_PACKAGES.has(request)) {
    return resolveMonorepoPackage(request, issuer);
  }

  // Try to find the nearest tsconfig.json
  let currentDir = path.dirname(issuer);
  let tsConfigPath = null;
  
  while (currentDir !== path.dirname(currentDir)) {
    const potentialTsConfig = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(potentialTsConfig)) {
      tsConfigPath = potentialTsConfig;
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  if (!tsConfigPath) {
    return null;
  }

  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    const paths = tsConfig.compilerOptions?.paths;
    
    if (!paths) {
      return null;
    }

    // Find matching path alias
    for (const [pattern, destinations] of Object.entries(paths)) {
      const normalizedPattern = pattern.replace(/\*$/, '');
      
      if (request.startsWith(normalizedPattern)) {
        const suffix = request.slice(normalizedPattern.length);
        
        for (const destination of destinations) {
          const normalizedDestination = destination.replace(/\*$/, '');
          const resolvedPath = path.join(currentDir, normalizedDestination, suffix);
          
          if (fs.existsSync(resolvedPath)) {
            return resolvedPath;
          }

          // Try with common extensions
          for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.json', '.node']) {
            const pathWithExt = resolvedPath + ext;
            if (fs.existsSync(pathWithExt)) {
              return pathWithExt;
            }
          }

          // Try with index files
          for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
            const indexPath = path.join(resolvedPath, `index${ext}`);
            if (fs.existsSync(indexPath)) {
              return indexPath;
            }
          }
        }
      }
    }
  } catch (error) {
    // Ignore errors in tsconfig parsing
  }

  return null;
}

/**
 * Resolves a special monorepo package based on the project structure
 * 
 * @param {string} request - The module being requested
 * @param {string} issuer - The file making the request
 * @returns {string|null} - The resolved path or null if not found
 */
function resolveMonorepoPackage(request, issuer) {
  // Get the workspace root
  const workspaceRoot = configResolver.getWorkspaceRoot();
  
  // Handle specific monorepo packages
  if (request === '@austa/design-system') {
    const designSystemPath = path.join(workspaceRoot, 'src', 'web', 'design-system');
    if (fs.existsSync(designSystemPath)) {
      return designSystemPath;
    }
  }
  
  if (request === '@design-system/primitives') {
    const primitivesPath = path.join(workspaceRoot, 'src', 'web', 'primitives');
    if (fs.existsSync(primitivesPath)) {
      return primitivesPath;
    }
  }
  
  if (request === '@austa/interfaces') {
    const interfacesPath = path.join(workspaceRoot, 'src', 'web', 'interfaces');
    if (fs.existsSync(interfacesPath)) {
      return interfacesPath;
    }
  }
  
  if (request === '@austa/journey-context') {
    const journeyContextPath = path.join(workspaceRoot, 'src', 'web', 'journey-context');
    if (fs.existsSync(journeyContextPath)) {
      return journeyContextPath;
    }
  }
  
  // Handle @app/* aliases (common in the AUSTA SuperApp)
  if (request.startsWith('@app/')) {
    const appPath = request.slice(5); // Remove '@app/'
    const possiblePaths = [
      path.join(workspaceRoot, 'src', 'app', appPath),
      path.join(workspaceRoot, 'src', appPath),
      path.join(workspaceRoot, 'src', 'web', appPath),
      path.join(workspaceRoot, 'src', 'backend', appPath)
    ];
    
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
      
      // Try with common extensions
      for (const ext of ['.js', '.jsx', '.ts', '.tsx', '.json', '.node']) {
        const pathWithExt = possiblePath + ext;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }

      // Try with index files
      for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
        const indexPath = path.join(possiblePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    }
  }
  
  return null;
}

/**
 * Resolves a workspace package in a monorepo structure
 * 
 * @param {string} request - The module being requested
 * @param {string} issuer - The file making the request
 * @returns {string|null} - The resolved path or null if not found
 */
function resolveWorkspacePackage(request, issuer) {
  if (!pnp) {
    return null;
  }

  // Handle workspace: protocol
  if (request.startsWith('workspace:')) {
    const packageName = request.slice('workspace:'.length);
    try {
      return pnp.resolveRequest(packageName, issuer, { considerBuiltins: false });
    } catch (error) {
      return null;
    }
  }

  // Try to resolve as a workspace package
  try {
    // Check if this is a workspace package by looking at the resolved path
    const resolved = pnp.resolveRequest(request, issuer, { considerBuiltins: false });
    if (resolved && !resolved.includes('node_modules')) {
      return resolved;
    }
  } catch (error) {
    // Not a workspace package
  }

  return null;
}

/**
 * Checks if a file exists and is a regular file
 * 
 * @param {string} filePath - The path to check
 * @returns {boolean} - True if the file exists and is a regular file
 */
function isFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Main resolver function that combines all resolution strategies
 * 
 * @param {string} request - The module being requested
 * @param {string} issuer - The file making the request
 * @returns {string|null} - The resolved path or null if not found
 */
function resolve(request, issuer) {
  // Skip built-in modules
  if (request.startsWith('node:') || (Module.builtinModules && Module.builtinModules.includes(request))) {
    return request;
  }

  // Try different resolution strategies in order
  const resolved = resolvePathAlias(request, issuer) || 
                  resolveMonorepoPackage(request, issuer) || 
                  resolveWorkspacePackage(request, issuer) || 
                  resolveModule(request, issuer);
  
  // Verify that the resolved path exists and is a file
  if (resolved && !request.startsWith('node:') && !isFile(resolved)) {
    // If it's a directory, try to find an index file
    for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
      const indexPath = path.join(resolved, `index${ext}`);
      if (isFile(indexPath)) {
        return indexPath;
      }
    }
  }
  
  return resolved;
}

/**
 * Creates a resolver function compatible with ESLint's resolver interface
 * 
 * @param {Object} options - Options passed to the resolver
 * @returns {Function} - A resolver function
 */
function createResolver(options = {}) {
  return function(source, file, config) {
    const resolved = resolve(source, file);
    
    return {
      found: Boolean(resolved),
      path: resolved
    };
  };
}

// Export the resolver interface for ESLint plugins like eslint-plugin-import
module.exports = {
  interfaceVersion: 2,
  resolve: createResolver()
};