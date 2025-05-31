/**
 * @license
 * Copyright (c) 2023 AUSTA Health.
 * 
 * This file is part of the AUSTA SuperApp TypeScript SDK.
 * It hooks into TypeScript's module resolution process to intercept and modify resolution requests.
 * 
 * This hook ensures that imports from the four new packages (@austa/design-system, @design-system/primitives,
 * @austa/interfaces, @austa/journey-context) are correctly resolved, even when referenced from different
 * parts of the monorepo.
 */

// @ts-check

/**
 * This is the TypeScript hook that intercepts module resolution requests.
 * It's used by the TypeScript language service to resolve modules correctly in a Yarn PnP environment.
 * 
 * The hook specifically handles the four new packages that are part of the AUSTA SuperApp refactoring:
 * - @austa/design-system
 * - @design-system/primitives
 * - @austa/interfaces
 * - @austa/journey-context
 */

const path = require('path');
const fs = require('fs');

/**
 * Maps package names to their filesystem locations in the monorepo.
 * This is necessary because these packages might not be published to npm yet,
 * but they need to be resolvable by TypeScript.
 */
const packageMappings = {
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

/**
 * The root directory of the monorepo, used to resolve package paths.
 * This is determined by finding the nearest package.json file.
 */
function findMonorepoRoot(startDir) {
  let currentDir = startDir;
  
  // Traverse up the directory tree until we find a package.json file
  while (currentDir !== path.parse(currentDir).root) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        // Check if this is the root package.json (has workspaces)
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch (e) {
        // Ignore JSON parse errors and continue searching
      }
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  // If we can't find the root, return the current directory as a fallback
  return process.cwd();
}

// Cache the monorepo root to avoid recalculating it for every resolution
let monorepoRoot = null;

/**
 * Resolves a package name to its filesystem location in the monorepo.
 * @param {string} packageName - The name of the package to resolve
 * @returns {string|null} - The filesystem path to the package, or null if not found
 */
function resolvePackagePath(packageName) {
  if (!monorepoRoot) {
    monorepoRoot = findMonorepoRoot(process.cwd());
  }
  
  const mapping = packageMappings[packageName];
  if (mapping) {
    return path.join(monorepoRoot, mapping);
  }
  
  return null;
}

/**
 * Checks if a path exists in the filesystem.
 * @param {string} filePath - The path to check
 * @returns {boolean} - Whether the path exists
 */
function pathExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (e) {
    return false;
  }
}

/**
 * The main hook function that intercepts TypeScript's module resolution.
 * @param {Object} ctx - The TypeScript resolution context
 * @param {Function} next - The next resolver in the chain
 * @returns {Object|undefined} - The resolved module or undefined
 */
module.exports = function hook(ctx, next) {
  // Extract the module name from the request
  const { request, resolveOptions } = ctx;
  
  // Skip if the request is not for one of our mapped packages
  const packageName = Object.keys(packageMappings).find(pkg => 
    request === pkg || request.startsWith(`${pkg}/`)
  );
  
  if (!packageName) {
    return next(ctx);
  }
  
  // Resolve the package path in the monorepo
  const packagePath = resolvePackagePath(packageName);
  if (!packagePath) {
    return next(ctx);
  }
  
  // Handle imports from the package root (e.g., import { Button } from '@austa/design-system')
  if (request === packageName) {
    // Check for different entry points in order of preference
    const possibleEntries = [
      path.join(packagePath, 'src', 'index.ts'),
      path.join(packagePath, 'src', 'index.tsx'),
      path.join(packagePath, 'src', 'index.js'),
      path.join(packagePath, 'index.ts'),
      path.join(packagePath, 'index.tsx'),
      path.join(packagePath, 'index.js'),
      path.join(packagePath, 'dist', 'index.js'),
      path.join(packagePath, 'dist', 'index.esm.js')
    ];
    
    for (const entry of possibleEntries) {
      if (pathExists(entry)) {
        return { resolvedModule: { resolvedFileName: entry, isExternalLibraryImport: false } };
      }
    }
  }
  
  // Handle imports from package subpaths (e.g., import { Box } from '@austa/design-system/components')
  if (request.startsWith(`${packageName}/`)) {
    const subpath = request.slice(packageName.length + 1);
    
    // Check for different possible locations of the subpath
    const possiblePaths = [
      path.join(packagePath, 'src', subpath + '.ts'),
      path.join(packagePath, 'src', subpath + '.tsx'),
      path.join(packagePath, 'src', subpath + '.js'),
      path.join(packagePath, 'src', subpath, 'index.ts'),
      path.join(packagePath, 'src', subpath, 'index.tsx'),
      path.join(packagePath, 'src', subpath, 'index.js'),
      path.join(packagePath, subpath + '.ts'),
      path.join(packagePath, subpath + '.tsx'),
      path.join(packagePath, subpath + '.js'),
      path.join(packagePath, subpath, 'index.ts'),
      path.join(packagePath, subpath, 'index.tsx'),
      path.join(packagePath, subpath, 'index.js'),
      path.join(packagePath, 'dist', subpath + '.js'),
      path.join(packagePath, 'dist', subpath, 'index.js')
    ];
    
    for (const p of possiblePaths) {
      if (pathExists(p)) {
        return { resolvedModule: { resolvedFileName: p, isExternalLibraryImport: false } };
      }
    }
  }
  
  // If we couldn't resolve the module, fall back to the default resolution
  return next(ctx);
};