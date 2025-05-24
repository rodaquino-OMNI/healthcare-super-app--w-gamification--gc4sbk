/**
 * Utility module that enhances TypeScript's module resolution to work with Yarn's Plug'n'Play mode
 * 
 * This file provides the core functionality to translate between TypeScript's module resolution system
 * and PnP's virtual file paths, ensuring that dependencies in node_modules and workspace packages are
 * correctly resolved. It's essential for enabling cross-package imports and preventing 'module not found'
 * errors in the IDE and during builds.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Store the PnP API instance
let pnpApiInstance = null;

/**
 * Enable PnP-aware module resolution for TypeScript
 * 
 * @param {object} ts - The TypeScript module
 * @param {object} pnpApi - The Yarn PnP API
 */
function enablePnPInTypeScript(ts, pnpApi) {
  if (!ts || !pnpApi) {
    throw new Error('TypeScript module and PnP API are required');
  }
  
  // Store the PnP API instance
  pnpApiInstance = pnpApi;
  
  // Patch TypeScript's module resolution
  patchTypeScriptModuleResolution(ts);
  
  console.log('Enabled PnP-aware module resolution for TypeScript');
}

/**
 * Patch TypeScript's module resolution to work with PnP
 * 
 * @param {object} ts - The TypeScript module
 */
function patchTypeScriptModuleResolution(ts) {
  // Store the original functions
  const originalNodeModuleNameResolver = ts.nodeModuleNameResolver;
  const originalClassicNameResolver = ts.classicNameResolver;
  
  // Override the node module name resolver
  ts.nodeModuleNameResolver = function(moduleName, containingFile, compilerOptions, host, cache, redirectedReference, resolutionMode) {
    // Try to resolve using PnP first
    const pnpResult = resolveWithPnP(moduleName, containingFile, compilerOptions);
    if (pnpResult) {
      return pnpResult;
    }
    
    // Fall back to the original resolver
    return originalNodeModuleNameResolver(moduleName, containingFile, compilerOptions, host, cache, redirectedReference, resolutionMode);
  };
  
  // Override the classic name resolver
  ts.classicNameResolver = function(moduleName, containingFile, compilerOptions, host, cache, redirectedReference) {
    // Try to resolve using PnP first
    const pnpResult = resolveWithPnP(moduleName, containingFile, compilerOptions);
    if (pnpResult) {
      return pnpResult;
    }
    
    // Fall back to the original resolver
    return originalClassicNameResolver(moduleName, containingFile, compilerOptions, host, cache, redirectedReference);
  };
}

/**
 * Resolve a module using the PnP API
 * 
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} containingFile - The path of the file containing the import
 * @param {object} compilerOptions - TypeScript compiler options
 * @returns {object|null} - The resolved module, or null if not found
 */
function resolveWithPnP(moduleName, containingFile, compilerOptions) {
  if (!pnpApiInstance) {
    return null;
  }
  
  try {
    // Skip relative imports
    if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
      return null;
    }
    
    // Get the extensions to try
    const extensions = getExtensionsFromCompilerOptions(compilerOptions);
    
    // Try to resolve the module using PnP
    const resolvedPath = pnpApiInstance.resolveRequest(moduleName, containingFile, { extensions });
    if (!resolvedPath) {
      return null;
    }
    
    // Create a resolved module object
    return {
      resolvedModule: {
        resolvedFileName: resolvedPath,
        isExternalLibraryImport: true,
        packageId: {
          name: getPackageNameFromModuleName(moduleName),
          subModuleName: getSubModuleNameFromModuleName(moduleName),
          version: getPackageVersionFromPath(resolvedPath)
        }
      }
    };
  } catch (e) {
    // PnP resolution failed, return null
    return null;
  }
}

/**
 * Get the extensions to try from the compiler options
 * 
 * @param {object} compilerOptions - TypeScript compiler options
 * @returns {string[]} - The extensions to try
 */
function getExtensionsFromCompilerOptions(compilerOptions) {
  const extensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json'];
  
  // Add .mjs and .cjs if allowJs is enabled
  if (compilerOptions && compilerOptions.allowJs) {
    extensions.push('.mjs', '.cjs');
  }
  
  return extensions;
}

/**
 * Get the package name from a module name
 * 
 * @param {string} moduleName - The name of the module
 * @returns {string} - The package name
 */
function getPackageNameFromModuleName(moduleName) {
  // Handle scoped packages
  if (moduleName.startsWith('@')) {
    const parts = moduleName.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  }
  
  // Handle regular packages
  return moduleName.split('/')[0];
}

/**
 * Get the submodule name from a module name
 * 
 * @param {string} moduleName - The name of the module
 * @returns {string} - The submodule name
 */
function getSubModuleNameFromModuleName(moduleName) {
  // Handle scoped packages
  if (moduleName.startsWith('@')) {
    const parts = moduleName.split('/');
    if (parts.length > 2) {
      return parts.slice(2).join('/');
    }
    return '';
  }
  
  // Handle regular packages
  const parts = moduleName.split('/');
  if (parts.length > 1) {
    return parts.slice(1).join('/');
  }
  return '';
}

/**
 * Get the package version from a resolved path
 * 
 * @param {string} resolvedPath - The resolved path
 * @returns {string} - The package version
 */
function getPackageVersionFromPath(resolvedPath) {
  try {
    // Try to find the nearest package.json
    let currentDir = path.dirname(resolvedPath);
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.version) {
          return packageJson.version;
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
  } catch (e) {
    // Ignore errors
  }
  
  // Default version if not found
  return '0.0.0';
}

module.exports = {
  enablePnPInTypeScript
};