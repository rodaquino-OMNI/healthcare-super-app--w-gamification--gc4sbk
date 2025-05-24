/**
 * TypeScript Module Resolution Hook for Yarn PnP
 * 
 * This file hooks into TypeScript's module resolution process to intercept and modify
 * resolution requests. It ensures that imports from the four new packages (@austa/design-system,
 * @design-system/primitives, @austa/interfaces, @austa/journey-context) are correctly resolved,
 * even when referenced from different parts of the monorepo.
 * 
 * It's critical for maintaining type safety across package boundaries and ensuring that
 * IDE features work correctly for cross-package imports.
 */

'use strict';

const path = require('path');

// Store the original resolveModuleNames function
let originalResolveModuleNames = null;

// Package mapping for the new packages
const packageMapping = new Map();

/**
 * Apply the PnP hook to TypeScript's module resolution
 * 
 * @param {object} ts - The TypeScript module
 * @param {object} pnpApi - The Yarn PnP API
 */
function applyPnPHook(ts, pnpApi) {
  if (!ts || !pnpApi) {
    throw new Error('TypeScript module and PnP API are required');
  }
  
  // Store the original resolveModuleNames function
  if (!originalResolveModuleNames && ts.resolveModuleNames) {
    originalResolveModuleNames = ts.resolveModuleNames;
  }
  
  // Override TypeScript's resolveModuleNames function
  ts.resolveModuleNames = function(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) {
    // Use our custom resolution logic
    return resolveModuleNamesWithPnP(
      originalResolveModuleNames,
      this,
      moduleNames,
      containingFile,
      reusedNames,
      redirectedReference,
      options,
      containingSourceFile,
      pnpApi
    );
  };
  
  console.log('Applied PnP hook to TypeScript\'s module resolution');
}

/**
 * Custom module resolution logic that integrates with Yarn PnP
 */
function resolveModuleNamesWithPnP(original, tsInstance, moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile, pnpApi) {
  if (!original) {
    return [];
  }
  
  // Process each module name for resolution
  const resolvedModules = moduleNames.map((moduleName, index) => {
    // Check if this is one of our mapped packages
    if (packageMapping.has(moduleName)) {
      const packagePath = packageMapping.get(moduleName);
      const resolvedFileName = path.join(packagePath, 'src/index.ts');
      
      // Create a resolved module object
      return {
        resolvedFileName,
        isExternalLibraryImport: false,
        packageId: {
          name: moduleName,
          subModuleName: '',
          version: '0.0.0'
        }
      };
    }
    
    // Handle path aliases (starting with @)
    if (moduleName.startsWith('@') && !moduleName.startsWith('@types/')) {
      // Try to resolve using PnP API first
      try {
        const resolution = pnpApi.resolveRequest(moduleName, containingFile, { extensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json'] });
        if (resolution) {
          return {
            resolvedFileName: resolution,
            isExternalLibraryImport: true,
            packageId: {
              name: moduleName.split('/')[0],
              subModuleName: moduleName.split('/').slice(1).join('/'),
              version: '0.0.0'
            }
          };
        }
      } catch (e) {
        // PnP resolution failed, continue with normal resolution
      }
    }
    
    // Fall back to the original resolution logic
    const reusedName = reusedNames && reusedNames[index];
    return original.call(
      tsInstance,
      [moduleNames[index]],
      containingFile,
      reusedName ? [reusedName] : undefined,
      redirectedReference,
      options,
      containingSourceFile
    )[0];
  });
  
  return resolvedModules;
}

/**
 * Register a package with the module resolution system
 * 
 * @param {string} packageName - The name of the package (e.g., '@austa/design-system')
 * @param {string} packagePath - The filesystem path to the package
 */
function registerPackage(packageName, packagePath) {
  packageMapping.set(packageName, packagePath);
}

/**
 * Clear all registered packages
 */
function clearPackages() {
  packageMapping.clear();
}

module.exports = {
  applyPnPHook,
  registerPackage,
  clearPackages
};