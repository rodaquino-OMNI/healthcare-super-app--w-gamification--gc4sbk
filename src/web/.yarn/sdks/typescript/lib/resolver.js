/**
 * Module resolver for the AUSTA SuperApp monorepo
 * 
 * This file translates path aliases defined in tsconfig.json (like @app/auth, @app/shared, @austa/*)
 * to their actual filesystem locations, enabling proper module resolution across packages.
 * 
 * It's particularly important for the new packages (@austa/design-system, @design-system/primitives,
 * @austa/interfaces, and @austa/journey-context) that are referenced throughout the codebase.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Store path aliases and their mappings
const pathAliasMap = new Map();

// Store package mappings
const packageMap = new Map();

// Store platform-specific extensions
let platformExtensions = {
  web: ['.web.ts', '.web.tsx', '.web.js', '.web.jsx'],
  mobile: ['.native.ts', '.native.tsx', '.native.js', '.native.jsx', '.ios.ts', '.ios.js', '.android.ts', '.android.js']
};

/**
 * Register path aliases for module resolution
 * 
 * @param {object} aliases - Object mapping alias patterns to filesystem paths
 * @param {string} rootDir - The root directory to resolve relative paths from
 */
function registerPathAliases(aliases, rootDir) {
  if (!aliases || typeof aliases !== 'object') {
    throw new Error('Path aliases must be an object');
  }
  
  if (!rootDir || typeof rootDir !== 'string') {
    throw new Error('Root directory must be a string');
  }
  
  // Clear existing aliases
  pathAliasMap.clear();
  
  // Register each alias
  Object.entries(aliases).forEach(([alias, target]) => {
    // Handle array targets (multiple possible paths)
    const targets = Array.isArray(target) ? target : [target];
    
    // Normalize and resolve each target path
    const resolvedTargets = targets.map(t => {
      // If the target is already absolute, use it as is
      if (path.isAbsolute(t)) {
        return t;
      }
      
      // Otherwise, resolve it relative to the root directory
      return path.resolve(rootDir, t);
    });
    
    // Store the alias mapping
    pathAliasMap.set(alias, resolvedTargets);
    console.log(`Registered path alias: ${alias} -> ${resolvedTargets.join(', ')}`);
  });
}

/**
 * Register a package with the resolver
 * 
 * @param {string} packageName - The name of the package (e.g., '@austa/design-system')
 * @param {string} packagePath - The filesystem path to the package
 */
function registerPackage(packageName, packagePath) {
  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Package name must be a string');
  }
  
  if (!packagePath || typeof packagePath !== 'string') {
    throw new Error('Package path must be a string');
  }
  
  // Store the package mapping
  packageMap.set(packageName, packagePath);
  console.log(`Registered package: ${packageName} -> ${packagePath}`);
}

/**
 * Register path mappings from a tsconfig.json file
 * 
 * @param {object} paths - The paths object from tsconfig.json
 * @param {string} baseDir - The base directory to resolve relative paths from
 */
function registerTsConfigPaths(paths, baseDir) {
  if (!paths || typeof paths !== 'object') {
    throw new Error('Paths must be an object');
  }
  
  if (!baseDir || typeof baseDir !== 'string') {
    throw new Error('Base directory must be a string');
  }
  
  // Process each path mapping
  Object.entries(paths).forEach(([pattern, targets]) => {
    // Skip non-array targets
    if (!Array.isArray(targets)) {
      return;
    }
    
    // Convert the pattern to a regex
    const regexPattern = patternToRegex(pattern);
    
    // Normalize and resolve each target path
    const resolvedTargets = targets.map(target => {
      // Replace the asterisk in the target with a placeholder
      const processedTarget = target.replace(/\*/g, '{asterisk}');
      
      // Resolve the target path relative to the base directory
      const resolvedTarget = path.resolve(baseDir, processedTarget);
      
      // Return the resolved path with the placeholder restored
      return resolvedTarget.replace(/\{asterisk\}/g, '*');
    });
    
    // Store the path mapping
    pathAliasMap.set(regexPattern, resolvedTargets);
    console.log(`Registered tsconfig path: ${pattern} -> ${resolvedTargets.join(', ')}`);
  });
}

/**
 * Register platform-specific file extensions
 * 
 * @param {object} extensions - Object mapping platform names to arrays of file extensions
 */
function registerPlatformExtensions(extensions) {
  if (!extensions || typeof extensions !== 'object') {
    throw new Error('Extensions must be an object');
  }
  
  // Store the platform extensions
  platformExtensions = extensions;
  console.log(`Registered platform extensions: ${JSON.stringify(extensions)}`);
}

/**
 * Resolve a module name to a filesystem path
 * 
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} containingFile - The path of the file containing the import
 * @param {object} options - Resolution options
 * @returns {string|null} - The resolved filesystem path, or null if not found
 */
function resolveModuleName(moduleName, containingFile, options = {}) {
  // Check if this is a package import
  if (packageMap.has(moduleName)) {
    const packagePath = packageMap.get(moduleName);
    const indexFile = findFile(path.join(packagePath, 'src/index'), options.platform);
    if (indexFile) {
      return indexFile;
    }
  }
  
  // Check if this is a subpath of a package
  const packageMatch = moduleName.match(/^(@[^/]+\/[^/]+)\/(.*)/);  
  if (packageMatch) {
    const [, packageName, subpath] = packageMatch;
    if (packageMap.has(packageName)) {
      const packagePath = packageMap.get(packageName);
      const subpathFile = findFile(path.join(packagePath, 'src', subpath), options.platform);
      if (subpathFile) {
        return subpathFile;
      }
    }
  }
  
  // Check if this matches a path alias
  for (const [pattern, targets] of pathAliasMap.entries()) {
    // If the pattern is a regex, test it against the module name
    if (pattern instanceof RegExp) {
      const match = moduleName.match(pattern);
      if (match) {
        // Extract the wildcard part if present
        const wildcard = match[1] || '';
        
        // Try each target path
        for (const target of targets) {
          // Replace the asterisk in the target with the wildcard
          const resolvedTarget = target.replace(/\*/g, wildcard);
          
          // Find the file with the appropriate extension
          const resolvedFile = findFile(resolvedTarget, options.platform);
          if (resolvedFile) {
            return resolvedFile;
          }
        }
      }
    }
    // If the pattern is a string, check for an exact match or a prefix match
    else if (typeof pattern === 'string') {
      if (moduleName === pattern || moduleName.startsWith(`${pattern}/`)) {
        const suffix = moduleName === pattern ? '' : moduleName.slice(pattern.length + 1);
        
        // Try each target path
        for (const target of targets) {
          const resolvedTarget = path.join(target, suffix);
          
          // Find the file with the appropriate extension
          const resolvedFile = findFile(resolvedTarget, options.platform);
          if (resolvedFile) {
            return resolvedFile;
          }
        }
      }
    }
  }
  
  // If no resolution was found, return null
  return null;
}

/**
 * Find a file with the appropriate extension
 * 
 * @param {string} filePath - The path of the file without extension
 * @param {string} platform - The platform to prioritize ('web' or 'mobile')
 * @returns {string|null} - The path with the appropriate extension, or null if not found
 */
function findFile(filePath, platform) {
  // Determine the order of extensions to try based on the platform
  const extensions = [];
  
  // Add platform-specific extensions first if a platform is specified
  if (platform && platformExtensions[platform]) {
    extensions.push(...platformExtensions[platform]);
  }
  
  // Add common extensions
  extensions.push('.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json');
  
  // Try each extension
  for (const ext of extensions) {
    const fullPath = `${filePath}${ext}`;
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  
  // If the path itself exists (e.g., it already has an extension), return it
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  
  // If no file was found, check if there's an index file in the directory
  try {
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      const indexFile = findFile(path.join(filePath, 'index'), platform);
      if (indexFile) {
        return indexFile;
      }
    }
  } catch (e) {
    // Path doesn't exist, ignore
  }
  
  // If no file was found, return null
  return null;
}

/**
 * Convert a tsconfig path pattern to a regex
 * 
 * @param {string} pattern - The path pattern from tsconfig.json
 * @returns {RegExp} - The equivalent regex pattern
 */
function patternToRegex(pattern) {
  // Check if the pattern has a wildcard
  if (pattern.includes('*')) {
    // Replace the asterisk with a capture group
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
      .replace(/\*/g, '([^/]*)');
    
    // Create a regex that matches the entire string
    return new RegExp(`^${regexPattern}$`);
  }
  
  // If there's no wildcard, return the pattern as is
  return pattern;
}

module.exports = {
  registerPathAliases,
  registerPackage,
  registerTsConfigPaths,
  registerPlatformExtensions,
  resolveModuleName
};