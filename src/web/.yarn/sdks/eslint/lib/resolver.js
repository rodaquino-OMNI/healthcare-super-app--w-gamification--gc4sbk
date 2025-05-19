/**
 * @fileoverview ESLint Plugin and Parser Resolver for Yarn PnP
 * 
 * This module handles ESLint plugin, config, and parser resolution in a Yarn Plug'n'Play environment.
 * It translates standard Node.js require calls to PnP-compatible resolution paths, ensuring that
 * ESLint can correctly locate and load its dependencies.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Try to load the PnP API
let pnpApi;
try {
  pnpApi = require('pnpapi');
} catch (error) {
  // Not in a PnP environment, will use standard resolution
}

/**
 * Resolves a module using Yarn PnP if available, falling back to Node.js resolution
 * @param {string} request - The module request
 * @param {string} issuer - The path of the file making the request
 * @returns {string} The resolved module path
 */
function resolveModule(request, issuer) {
  if (pnpApi) {
    try {
      return pnpApi.resolveRequest(request, issuer);
    } catch (error) {
      // Fall through to standard resolution if PnP resolution fails
    }
  }
  
  // Fall back to Node.js resolution
  return require.resolve(request, { paths: [path.dirname(issuer)] });
}

/**
 * Resolves an ESLint plugin
 * @param {string} pluginName - The name of the plugin to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string} The resolved plugin path
 */
function resolvePlugin(pluginName, issuer) {
  // Handle the case where the plugin name doesn't have the eslint-plugin- prefix
  const normalizedName = pluginName.startsWith('eslint-plugin-') 
    ? pluginName 
    : `eslint-plugin-${pluginName}`;
  
  // Handle scoped packages
  const scopedName = pluginName.startsWith('@') && !pluginName.includes('/eslint-plugin-')
    ? pluginName.replace(/^@([^/]+)\/(.*)$/, '@$1/eslint-plugin-$2')
    : pluginName;
  
  try {
    // First try with the normalized name
    return resolveModule(normalizedName, issuer);
  } catch (error) {
    try {
      // Then try with the scoped name
      return resolveModule(scopedName, issuer);
    } catch (scopedError) {
      try {
        // Try resolving from the project root
        if (pnpApi) {
          const topLevelLocation = pnpApi.getPackageInformation(pnpApi.topLevel).packageLocation;
          return resolveModule(normalizedName, path.join(topLevelLocation, 'package.json'));
        }
      } catch (rootError) {
        // If all resolution attempts fail, throw the original error
        throw error;
      }
    }
  }
}

/**
 * Resolves an ESLint config
 * @param {string} configName - The name of the config to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string} The resolved config path
 */
function resolveConfig(configName, issuer) {
  // Handle the case where the config name doesn't have the eslint-config- prefix
  const normalizedName = configName.startsWith('eslint-config-') 
    ? configName 
    : `eslint-config-${configName}`;
  
  // Handle scoped packages
  const scopedName = configName.startsWith('@') && !configName.includes('/eslint-config-')
    ? configName.replace(/^@([^/]+)\/(.*)$/, '@$1/eslint-config-$2')
    : configName;
  
  try {
    // First try with the normalized name
    return resolveModule(normalizedName, issuer);
  } catch (error) {
    try {
      // Then try with the scoped name
      return resolveModule(scopedName, issuer);
    } catch (scopedError) {
      try {
        // Try resolving from the project root
        if (pnpApi) {
          const topLevelLocation = pnpApi.getPackageInformation(pnpApi.topLevel).packageLocation;
          return resolveModule(normalizedName, path.join(topLevelLocation, 'package.json'));
        }
      } catch (rootError) {
        // If all resolution attempts fail, throw the original error
        throw error;
      }
    }
  }
}

/**
 * Resolves an ESLint parser
 * @param {string} parserName - The name of the parser to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string} The resolved parser path
 */
function resolveParser(parserName, issuer) {
  // Handle special case for typescript-eslint parser
  if (parserName === '@typescript-eslint/parser') {
    try {
      return resolveModule(parserName, issuer);
    } catch (error) {
      // Try resolving from the project root
      if (pnpApi) {
        try {
          const topLevelLocation = pnpApi.getPackageInformation(pnpApi.topLevel).packageLocation;
          return resolveModule(parserName, path.join(topLevelLocation, 'package.json'));
        } catch (rootError) {
          throw error;
        }
      }
      throw error;
    }
  }
  
  // For other parsers, use standard module resolution
  return resolveModule(parserName, issuer);
}

/**
 * Resolves a path alias from tsconfig.json
 * @param {string} alias - The alias to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string|null} The resolved path or null if not resolvable
 */
function resolvePathAlias(alias, issuer) {
  // Find the nearest tsconfig.json
  const tsconfig = findNearestTsconfig(issuer);
  if (!tsconfig) {
    return null;
  }
  
  try {
    const tsconfigContent = JSON.parse(fs.readFileSync(tsconfig, 'utf8'));
    const paths = tsconfigContent.compilerOptions?.paths;
    
    if (!paths) {
      return null;
    }
    
    // Check if the alias matches any of the path mappings
    for (const [pattern, destinations] of Object.entries(paths)) {
      const normalizedPattern = pattern.replace(/\*/g, '');
      if (alias.startsWith(normalizedPattern) && Array.isArray(destinations) && destinations.length > 0) {
        const suffix = alias.slice(normalizedPattern.length);
        const destination = destinations[0].replace(/\*/g, '');
        const resolvedPath = path.resolve(path.dirname(tsconfig), destination, suffix);
        
        // Check if the resolved path exists
        if (fs.existsSync(resolvedPath) || 
            fs.existsSync(`${resolvedPath}.js`) || 
            fs.existsSync(`${resolvedPath}.ts`) || 
            fs.existsSync(`${resolvedPath}/index.js`) || 
            fs.existsSync(`${resolvedPath}/index.ts`)) {
          return resolvedPath;
        }
      }
    }
  } catch (error) {
    // Ignore tsconfig parsing errors
  }
  
  return null;
}

/**
 * Finds the nearest tsconfig.json file
 * @param {string} startPath - The path to start searching from
 * @returns {string|null} The path to the nearest tsconfig.json or null if not found
 */
function findNearestTsconfig(startPath) {
  let currentDir = path.dirname(startPath);
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    const tsconfigPath = path.join(currentDir, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      return tsconfigPath;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Resolves a workspace-specific module
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string} The resolved module path
 */
function resolveWorkspaceModule(moduleName, issuer) {
  if (!pnpApi) {
    // Not in a PnP environment, use standard resolution
    return resolveModule(moduleName, issuer);
  }
  
  try {
    // Try to resolve using the standard PnP resolution
    return resolveModule(moduleName, issuer);
  } catch (error) {
    // If that fails, try to find the module in each workspace
    try {
      const topLevelInfo = pnpApi.getPackageInformation(pnpApi.topLevel);
      const workspaces = topLevelInfo.workspaces || [];
      
      for (const workspace of workspaces) {
        try {
          return resolveModule(moduleName, path.join(workspace.location, 'package.json'));
        } catch (workspaceError) {
          // Continue to the next workspace
        }
      }
    } catch (workspaceError) {
      // Ignore workspace resolution errors
    }
    
    // If all resolution attempts fail, throw the original error
    throw error;
  }
}

/**
 * Patches ESLint's module resolution to work with Yarn PnP
 */
function patchEslintModuleResolution() {
  if (!pnpApi) {
    // Not in a PnP environment, no need to patch
    return;
  }
  
  try {
    // Try to patch ESLint's module resolver
    const Module = require('module');
    const originalResolveFilename = Module._resolveFilename;
    
    Module._resolveFilename = function(request, parent, isMain, options) {
      // Handle ESLint-specific modules
      if (request.startsWith('eslint-plugin-') || 
          request.startsWith('eslint-config-') || 
          request.startsWith('@typescript-eslint/') ||
          (request.startsWith('@') && 
           (request.includes('/eslint-plugin-') || request.includes('/eslint-config-')))) {
        try {
          // Try to resolve using our custom resolver
          if (request.startsWith('eslint-plugin-') || request.includes('/eslint-plugin-')) {
            return resolvePlugin(request, parent.filename);
          } else if (request.startsWith('eslint-config-') || request.includes('/eslint-config-')) {
            return resolveConfig(request, parent.filename);
          } else if (request.startsWith('@typescript-eslint/')) {
            return resolveModule(request, parent.filename);
          }
        } catch (error) {
          // Fall through to standard resolution if our custom resolver fails
        }
      }
      
      // For all other requests, use the original resolver
      return originalResolveFilename.call(this, request, parent, isMain, options);
    };
  } catch (error) {
    // If patching fails, log a warning but don't crash
    console.warn('Failed to patch ESLint module resolution for Yarn PnP:', error.message);
  }
}

// Apply the patch when this module is loaded
patchEslintModuleResolution();

module.exports = {
  resolveModule,
  resolvePlugin,
  resolveConfig,
  resolveParser,
  resolvePathAlias,
  resolveWorkspaceModule,
  findNearestTsconfig
};