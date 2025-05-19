/**
 * @license
 * Copyright (c) 2023-2025 AUSTA SuperApp
 * 
 * This file implements a custom TypeScript module resolver that handles path aliases
 * and package resolution for the AUSTA SuperApp monorepo. It translates path aliases
 * defined in tsconfig.json (like @app/auth, @app/shared, @austa/*) to their actual
 * filesystem locations, enabling proper module resolution across packages.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Cache for parsed tsconfig.json files to avoid repeated parsing
const tsconfigCache = new Map();

// Cache for resolved paths to improve performance
const resolvedPathCache = new Map();

// Path alias mappings for the four new packages
const PACKAGE_MAPPINGS = {
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context'
};

// Journey-specific path alias mappings
const JOURNEY_MAPPINGS = {
  '@app/health': 'src/backend/health-service',
  '@app/care': 'src/backend/care-service',
  '@app/plan': 'src/backend/plan-service',
  '@app/auth': 'src/backend/auth-service',
  '@app/shared': 'src/backend/shared',
  '@app/gamification': 'src/backend/gamification-engine',
  '@app/notification': 'src/backend/notification-service',
  '@app/api-gateway': 'src/backend/api-gateway'
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
 * Normalizes a path for cross-platform compatibility
 * 
 * @param {string} filePath - Path to normalize
 * @returns {string} - Normalized path
 */
function normalizePath(filePath) {
  // Convert Windows backslashes to forward slashes for consistency
  return filePath.replace(/\\/g, '/');
}

/**
 * Finds and parses the nearest tsconfig.json file
 * 
 * @param {string} containingFile - Path of the file containing the import
 * @returns {Object|null} - Parsed tsconfig.json or null if not found
 */
function findAndParseTsconfig(containingFile) {
  let dir = path.dirname(containingFile);
  const visited = new Set();
  
  // Traverse up to 10 levels to find tsconfig.json
  for (let i = 0; i < 10; i++) {
    // Avoid infinite loops
    if (visited.has(dir)) {
      break;
    }
    visited.add(dir);
    
    const tsconfigPath = path.join(dir, 'tsconfig.json');
    
    // Check cache first
    if (tsconfigCache.has(tsconfigPath)) {
      return tsconfigCache.get(tsconfigPath);
    }
    
    if (fs.existsSync(tsconfigPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        tsconfigCache.set(tsconfigPath, tsconfig);
        return tsconfig;
      } catch (error) {
        // Ignore JSON parsing errors and continue searching
      }
    }
    
    // Also check for tsconfig.build.json which is common in NestJS projects
    const tsconfigBuildPath = path.join(dir, 'tsconfig.build.json');
    if (fs.existsSync(tsconfigBuildPath)) {
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigBuildPath, 'utf8'));
        tsconfigCache.set(tsconfigBuildPath, tsconfig);
        return tsconfig;
      } catch (error) {
        // Ignore JSON parsing errors and continue searching
      }
    }
    
    // Move up one directory
    const parentDir = path.dirname(dir);
    if (parentDir === dir) {
      // We've reached the filesystem root
      break;
    }
    dir = parentDir;
  }
  
  return null;
}

/**
 * Extracts path mappings from a tsconfig.json file
 * 
 * @param {Object} tsconfig - Parsed tsconfig.json
 * @returns {Object|null} - Path mappings or null if not found
 */
function extractPathMappings(tsconfig) {
  if (!tsconfig || !tsconfig.compilerOptions || !tsconfig.compilerOptions.paths) {
    return null;
  }
  
  return tsconfig.compilerOptions.paths;
}

/**
 * Resolves a path alias to its actual filesystem location
 * 
 * @param {string} specifier - Import specifier (e.g., @app/auth/users)
 * @param {string} containingFile - Path of the file containing the import
 * @returns {string|null} - Resolved path or null if not handled
 */
function resolvePathAlias(specifier, containingFile) {
  // Create a cache key based on the specifier and containing file
  const cacheKey = `${specifier}:${containingFile}`;
  
  // Check cache first
  if (resolvedPathCache.has(cacheKey)) {
    return resolvedPathCache.get(cacheKey);
  }
  
  // Find monorepo root
  const monorepoRoot = findMonorepoRoot(path.dirname(containingFile));
  if (!monorepoRoot) {
    return null;
  }
  
  // First, check if this is one of our known package mappings
  for (const [prefix, packagePath] of Object.entries(PACKAGE_MAPPINGS)) {
    if (specifier === prefix || specifier.startsWith(`${prefix}/`)) {
      const subpath = specifier === prefix ? '' : specifier.substring(prefix.length + 1);
      const resolvedPath = resolvePackageSubpath(prefix, subpath, containingFile);
      if (resolvedPath) {
        resolvedPathCache.set(cacheKey, resolvedPath);
        return resolvedPath;
      }
    }
  }
  
  // Then, check if this is one of our known journey mappings
  for (const [prefix, journeyPath] of Object.entries(JOURNEY_MAPPINGS)) {
    if (specifier === prefix || specifier.startsWith(`${prefix}/`)) {
      const subpath = specifier === prefix ? '' : specifier.substring(prefix.length + 1);
      const fullPath = path.join(monorepoRoot, journeyPath, subpath);
      
      // Try with different extensions
      const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
      for (const ext of extensions) {
        const pathWithExt = `${fullPath}${ext}`;
        if (fs.existsSync(pathWithExt)) {
          resolvedPathCache.set(cacheKey, pathWithExt);
          return pathWithExt;
        }
      }
      
      // Try as a directory with index files
      for (const ext of extensions) {
        const indexPath = path.join(fullPath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          resolvedPathCache.set(cacheKey, indexPath);
          return indexPath;
        }
      }
      
      // If it's a directory without an index file, return the directory
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        resolvedPathCache.set(cacheKey, fullPath);
        return fullPath;
      }
    }
  }
  
  // Finally, check tsconfig.json for path mappings
  const tsconfig = findAndParseTsconfig(containingFile);
  const pathMappings = extractPathMappings(tsconfig);
  
  if (pathMappings) {
    // Get the base directory for path mappings (usually the directory containing tsconfig.json)
    const baseDir = path.dirname(containingFile);
    
    // Check each path mapping
    for (const [pattern, destinations] of Object.entries(pathMappings)) {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '(.*)') // Convert * to capture group
        .replace(/\?/g, '.') // Convert ? to any character
        .replace(/\./g, '\\.'); // Escape dots
      
      const regex = new RegExp(`^${regexPattern}$`);
      const match = specifier.match(regex);
      
      if (match) {
        // Extract captured groups (if any)
        const captured = match.slice(1);
        
        // Try each destination
        for (const destination of destinations) {
          // Replace wildcards with captured groups
          let resolvedDestination = destination;
          captured.forEach((capture, index) => {
            resolvedDestination = resolvedDestination.replace(`*`, capture);
          });
          
          // Resolve relative to the base directory
          const fullPath = path.resolve(baseDir, resolvedDestination);
          
          // Try with different extensions
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', ''];
          for (const ext of extensions) {
            const pathWithExt = `${fullPath}${ext}`;
            if (fs.existsSync(pathWithExt)) {
              resolvedPathCache.set(cacheKey, pathWithExt);
              return pathWithExt;
            }
          }
          
          // Try as a directory with index files
          for (const ext of extensions) {
            if (ext === '') continue;
            const indexPath = path.join(fullPath, `index${ext}`);
            if (fs.existsSync(indexPath)) {
              resolvedPathCache.set(cacheKey, indexPath);
              return indexPath;
            }
          }
        }
      }
    }
  }
  
  // If we get here, we couldn't resolve the path alias
  return null;
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
 * Handles project references and composite builds
 * 
 * @param {string} specifier - Import specifier
 * @param {string} containingFile - Path of the file containing the import
 * @returns {string|null} - Resolved path or null if not handled
 */
function resolveProjectReference(specifier, containingFile) {
  // Find the nearest tsconfig.json
  const tsconfig = findAndParseTsconfig(containingFile);
  if (!tsconfig || !tsconfig.references) {
    return null;
  }
  
  // Get the directory containing the tsconfig.json
  const tsconfigDir = path.dirname(containingFile);
  
  // Check each project reference
  for (const reference of tsconfig.references) {
    if (!reference.path) continue;
    
    // Resolve the reference path relative to the tsconfig directory
    const referencePath = path.resolve(tsconfigDir, reference.path);
    
    // If it's a directory, look for tsconfig.json
    let referenceTsconfigPath;
    if (fs.existsSync(referencePath) && fs.statSync(referencePath).isDirectory()) {
      referenceTsconfigPath = path.join(referencePath, 'tsconfig.json');
    } else {
      // If it's not a directory, assume it's a path to a tsconfig.json file
      referenceTsconfigPath = referencePath;
    }
    
    // Skip if the tsconfig.json doesn't exist
    if (!fs.existsSync(referenceTsconfigPath)) {
      continue;
    }
    
    try {
      // Parse the referenced tsconfig.json
      const referenceTsconfig = JSON.parse(fs.readFileSync(referenceTsconfigPath, 'utf8'));
      
      // Get the outDir from the referenced tsconfig.json
      const outDir = referenceTsconfig.compilerOptions && referenceTsconfig.compilerOptions.outDir;
      if (!outDir) {
        continue;
      }
      
      // Resolve the outDir relative to the referenced tsconfig directory
      const referenceOutDir = path.resolve(path.dirname(referenceTsconfigPath), outDir);
      
      // Try to resolve the specifier in the outDir
      const possiblePath = path.join(referenceOutDir, specifier);
      if (fs.existsSync(possiblePath)) {
        return possiblePath;
      }
      
      // Try with different extensions
      const extensions = ['.js', '.jsx', '.json', '.d.ts'];
      for (const ext of extensions) {
        const pathWithExt = `${possiblePath}${ext}`;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }
      
      // Try as a directory with index files
      for (const ext of extensions) {
        const indexPath = path.join(possiblePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    } catch (error) {
      // Ignore JSON parsing errors and continue checking other references
    }
  }
  
  return null;
}

/**
 * Main resolver function that resolves module specifiers to file paths
 * 
 * @param {string} specifier - Import specifier
 * @param {string} containingFile - Path of the file containing the import
 * @returns {string|null} - Resolved path or null if not handled
 */
function resolveModuleSpecifier(specifier, containingFile) {
  // Skip node built-in modules and relative imports
  if (specifier.startsWith('.') || specifier.startsWith('/') || !specifier.includes('/')) {
    return null;
  }
  
  // Normalize paths for cross-platform compatibility
  const normalizedContainingFile = normalizePath(containingFile);
  
  // Try to resolve as a path alias
  const resolvedPathAlias = resolvePathAlias(specifier, normalizedContainingFile);
  if (resolvedPathAlias) {
    return resolvedPathAlias;
  }
  
  // Try to resolve as a project reference
  const resolvedProjectReference = resolveProjectReference(specifier, normalizedContainingFile);
  if (resolvedProjectReference) {
    return resolvedProjectReference;
  }
  
  // Let TypeScript handle other imports
  return null;
}

/**
 * Creates a TypeScript module resolver
 * 
 * @param {Object} typescript - The TypeScript module
 * @returns {Function} - Module resolver function
 */
function createModuleResolver(typescript) {
  return function(moduleName, containingFile, compilerOptions, host) {
    // Try our custom resolution first
    const resolvedPath = resolveModuleSpecifier(moduleName, containingFile);
    if (resolvedPath) {
      // Return a resolved module in the format TypeScript expects
      return {
        resolvedModule: {
          resolvedFileName: resolvedPath,
          isExternalLibraryImport: false
        }
      };
    }
    
    // Let TypeScript handle other imports
    return undefined;
  };
}

module.exports = createModuleResolver;