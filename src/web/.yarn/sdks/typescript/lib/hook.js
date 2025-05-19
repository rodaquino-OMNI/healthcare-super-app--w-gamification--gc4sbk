/**
 * @license
 * Copyright (c) 2023-2025 AUSTA SuperApp
 * 
 * This file implements a TypeScript module resolution hook that intercepts and modifies
 * resolution requests for the four new packages in the AUSTA SuperApp monorepo:
 * - @austa/design-system
 * - @design-system/primitives
 * - @austa/interfaces
 * - @austa/journey-context
 * 
 * This hook ensures these packages are correctly resolved across workspace boundaries,
 * maintaining type safety and enabling IDE features like auto-completion and go-to-definition.
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Maps package names to their filesystem locations in the monorepo
 * These paths are relative to the monorepo root
 */
const PACKAGE_MAPPINGS = {
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

/**
 * Finds the monorepo root by traversing up the directory tree
 * looking for the package.json with workspaces defined
 * 
 * @param {string} startDir - Directory to start searching from
 * @returns {string|null} - Path to monorepo root or null if not found
 */
function findMonorepoRoot(startDir) {
  let currentDir = startDir;
  
  // Traverse up to 10 levels to find monorepo root
  for (let i = 0; i < 10; i++) {
    try {
      const packageJsonPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        // Check if this is the monorepo root (has workspaces)
        if (packageJson.workspaces) {
          return currentDir;
        }
      }
    } catch (error) {
      // Ignore errors and continue searching
    }
    
    // Move up one directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      // We've reached the filesystem root
      break;
    }
    currentDir = parentDir;
  }
  
  return null;
}

/**
 * Resolves a package name to its actual filesystem location
 * 
 * @param {string} packageName - Name of the package to resolve
 * @param {string} containingFile - Path of the file containing the import
 * @returns {string|null} - Resolved path or null if not handled
 */
function resolvePackage(packageName, containingFile) {
  // Only handle our specific packages
  if (!PACKAGE_MAPPINGS[packageName]) {
    return null;
  }
  
  // Find monorepo root
  const monorepoRoot = findMonorepoRoot(path.dirname(containingFile));
  if (!monorepoRoot) {
    return null;
  }
  
  // Resolve to the actual package location
  const packagePath = path.join(monorepoRoot, PACKAGE_MAPPINGS[packageName]);
  
  // Verify the package exists
  if (!fs.existsSync(packagePath)) {
    return null;
  }
  
  // Find the package's entry point
  // First check for package.json to determine the entry point
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for TypeScript types field first
      if (packageJson.types) {
        const typesPath = path.join(packagePath, packageJson.types);
        if (fs.existsSync(typesPath)) {
          return typesPath;
        }
      }
      
      // Then check for main field
      if (packageJson.main) {
        const mainPath = path.join(packagePath, packageJson.main);
        if (fs.existsSync(mainPath)) {
          return mainPath;
        }
        
        // Try with .d.ts extension for type definitions
        const dtsPath = mainPath.replace(/\.js$/, '.d.ts');
        if (fs.existsSync(dtsPath)) {
          return dtsPath;
        }
      }
    } catch (error) {
      // Ignore JSON parsing errors and fall back to default resolution
    }
  }
  
  // Fall back to standard index files if package.json doesn't specify entry points
  const possibleEntryPoints = [
    path.join(packagePath, 'index.ts'),
    path.join(packagePath, 'src/index.ts'),
    path.join(packagePath, 'dist/index.js'),
    path.join(packagePath, 'dist/index.d.ts'),
    path.join(packagePath, 'lib/index.js'),
    path.join(packagePath, 'lib/index.d.ts')
  ];
  
  for (const entryPoint of possibleEntryPoints) {
    if (fs.existsSync(entryPoint)) {
      return entryPoint;
    }
  }
  
  // If we can't find a specific entry point, just return the package directory
  return packagePath;
}

/**
 * Resolves a subpath within a package
 * 
 * @param {string} packageName - Name of the package
 * @param {string} subpath - Subpath within the package
 * @param {string} containingFile - Path of the file containing the import
 * @returns {string|null} - Resolved path or null if not handled
 */
function resolvePackageSubpath(packageName, subpath, containingFile) {
  // Only handle our specific packages
  if (!PACKAGE_MAPPINGS[packageName]) {
    return null;
  }
  
  // Find monorepo root
  const monorepoRoot = findMonorepoRoot(path.dirname(containingFile));
  if (!monorepoRoot) {
    return null;
  }
  
  // Resolve to the actual package location
  const packagePath = path.join(monorepoRoot, PACKAGE_MAPPINGS[packageName]);
  
  // Check common source directories
  const possiblePaths = [
    path.join(packagePath, subpath), // Direct subpath
    path.join(packagePath, 'src', subpath), // src/subpath
    path.join(packagePath, 'dist', subpath), // dist/subpath
    path.join(packagePath, 'lib', subpath) // lib/subpath
  ];
  
  // Add extensions if not specified
  if (!subpath.includes('.')) {
    possiblePaths.push(
      path.join(packagePath, `${subpath}.ts`),
      path.join(packagePath, `${subpath}.tsx`),
      path.join(packagePath, `${subpath}.js`),
      path.join(packagePath, `${subpath}.jsx`),
      path.join(packagePath, 'src', `${subpath}.ts`),
      path.join(packagePath, 'src', `${subpath}.tsx`),
      path.join(packagePath, 'src', `${subpath}.js`),
      path.join(packagePath, 'src', `${subpath}.jsx`),
      path.join(packagePath, 'dist', `${subpath}.js`),
      path.join(packagePath, 'dist', `${subpath}.d.ts`),
      path.join(packagePath, 'lib', `${subpath}.js`),
      path.join(packagePath, 'lib', `${subpath}.d.ts`)
    );
  }
  
  // Check for index files in directories
  possiblePaths.push(
    path.join(packagePath, subpath, 'index.ts'),
    path.join(packagePath, subpath, 'index.tsx'),
    path.join(packagePath, subpath, 'index.js'),
    path.join(packagePath, subpath, 'index.jsx'),
    path.join(packagePath, 'src', subpath, 'index.ts'),
    path.join(packagePath, 'src', subpath, 'index.tsx'),
    path.join(packagePath, 'src', subpath, 'index.js'),
    path.join(packagePath, 'src', subpath, 'index.jsx'),
    path.join(packagePath, 'dist', subpath, 'index.js'),
    path.join(packagePath, 'dist', subpath, 'index.d.ts'),
    path.join(packagePath, 'lib', subpath, 'index.js'),
    path.join(packagePath, 'lib', subpath, 'index.d.ts')
  );
  
  // Return the first path that exists
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }
  
  return null;
}

/**
 * Main hook function that intercepts TypeScript's module resolution
 * 
 * @param {Object} typescript - The TypeScript module
 * @returns {Object} - Object with before/after resolution hooks
 */
function createModuleResolutionHook(typescript) {
  return {
    /**
     * Called before TypeScript's standard module resolution
     * Allows us to intercept and handle specific packages
     */
    beforeResolve(specifier, containingFile, resolveOptions, redirectedReference) {
      // Skip if no containing file (happens for lib.d.ts etc.)
      if (!containingFile) {
        return undefined;
      }
      
      try {
        // Handle direct package imports (e.g., import { Button } from '@austa/design-system')
        if (PACKAGE_MAPPINGS[specifier]) {
          const resolvedPath = resolvePackage(specifier, containingFile);
          if (resolvedPath) {
            return { resolvedModule: { resolvedFileName: resolvedPath } };
          }
        }
        
        // Handle subpath imports (e.g., import { Button } from '@austa/design-system/components/Button')
        for (const packageName of Object.keys(PACKAGE_MAPPINGS)) {
          if (specifier.startsWith(`${packageName}/`)) {
            const subpath = specifier.substring(packageName.length + 1);
            const resolvedPath = resolvePackageSubpath(packageName, subpath, containingFile);
            if (resolvedPath) {
              return { resolvedModule: { resolvedFileName: resolvedPath } };
            }
          }
        }
      } catch (error) {
        // Log error but don't break resolution
        console.error(`Error in TypeScript module resolution hook: ${error.message}`);
      }
      
      // Let TypeScript handle other imports
      return undefined;
    },
    
    /**
     * Called after TypeScript's standard module resolution
     * Allows us to modify or override the resolution result
     */
    afterResolve(resolvedModule, resolvedOptions) {
      // We handle everything in beforeResolve, so just return the module as-is
      return resolvedModule;
    }
  };
}

/**
 * Export the hook function for TypeScript to use
 */
module.exports = createModuleResolutionHook;