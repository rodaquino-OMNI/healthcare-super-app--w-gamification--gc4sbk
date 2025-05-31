/**
 * @license
 * Copyright (c) 2023 AUSTA Health.
 * 
 * This file is part of the AUSTA SuperApp TypeScript SDK.
 * It translates path aliases defined in tsconfig.json to actual filesystem locations,
 * enabling proper module resolution across packages.
 */

// @ts-check

/**
 * Module resolver that specifically handles path aliases and package resolution for the AUSTA SuperApp monorepo.
 * 
 * This file is responsible for:
 * 1. Translating path aliases (@app/auth, @app/shared, @austa/*) to actual filesystem locations
 * 2. Supporting the four new packages (@austa/design-system, @design-system/primitives, @austa/interfaces, @austa/journey-context)
 * 3. Ensuring cross-platform path normalization between web and mobile
 * 4. Handling project references and composite builds
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
  '@austa/journey-context': 'src/web/journey-context',
  '@app/auth': 'src/backend/auth-service',
  '@app/shared': 'src/backend/shared'
};

/**
 * Maps path aliases to their filesystem locations.
 * These are derived from the tsconfig.json files in the monorepo.
 */
const pathAliasMappings = {
  // Web aliases
  '@/*': './src/*',
  'design-system/*': '../design-system/src/*',
  'shared/*': '../shared/*',
  
  // Mobile aliases
  '@components/*': 'src/components/*',
  '@screens/*': 'src/screens/*',
  '@navigation/*': 'src/navigation/*',
  '@hooks/*': 'src/hooks/*',
  '@utils/*': 'src/utils/*',
  '@api/*': 'src/api/*',
  '@context/*': 'src/context/*',
  '@assets/*': 'src/assets/*',
  '@constants/*': 'src/constants/*',
  '@i18n/*': 'src/i18n/*',
  
  // Design system aliases
  '@tokens/*': 'src/tokens/*',
  '@themes/*': 'src/themes/*',
  '@primitives/*': 'src/primitives/*',
  '@components/*': 'src/components/*',
  '@gamification/*': 'src/gamification/*',
  '@health/*': 'src/health/*',
  '@care/*': 'src/care/*',
  '@plan/*': 'src/plan/*',
  '@charts/*': 'src/charts/*'
};

/**
 * The root directory of the monorepo, used to resolve package paths.
 * This is determined by finding the nearest package.json file with workspaces.
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
 * Normalizes a path to use forward slashes, regardless of platform.
 * This is important for cross-platform compatibility between web and mobile.
 * @param {string} filePath - The path to normalize
 * @returns {string} - The normalized path
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
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
 * Finds the nearest tsconfig.json file from a given directory.
 * @param {string} startDir - The directory to start searching from
 * @returns {string|null} - The path to the nearest tsconfig.json, or null if not found
 */
function findNearestTsConfig(startDir) {
  let currentDir = startDir;
  
  // Traverse up the directory tree until we find a tsconfig.json file
  while (currentDir !== path.parse(currentDir).root) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');
    if (pathExists(tsConfigPath)) {
      return tsConfigPath;
    }
    
    // Move up one directory
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Parses a tsconfig.json file and extracts its path mappings.
 * @param {string} tsConfigPath - The path to the tsconfig.json file
 * @returns {Object|null} - The path mappings, or null if not found
 */
function getTsConfigPathMappings(tsConfigPath) {
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    return tsConfig.compilerOptions?.paths || null;
  } catch (e) {
    return null;
  }
}

/**
 * Resolves a path alias to a filesystem path.
 * @param {string} moduleName - The module name to resolve
 * @param {string} containingFile - The file containing the import
 * @returns {string|null} - The resolved path, or null if not found
 */
function resolvePathAlias(moduleName, containingFile) {
  // Find the nearest tsconfig.json file
  const tsConfigPath = findNearestTsConfig(path.dirname(containingFile));
  if (!tsConfigPath) {
    return null;
  }
  
  // Get the path mappings from the tsconfig.json file
  const pathMappings = getTsConfigPathMappings(tsConfigPath);
  if (!pathMappings) {
    return null;
  }
  
  // Find the matching path mapping
  let matchingPattern = null;
  let matchingSuffix = null;
  
  for (const pattern in pathMappings) {
    // Convert the pattern to a regex
    const regexPattern = pattern
      .replace(/\*/g, '(.*)')
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    
    const regex = new RegExp(`^${regexPattern}$`);
    const match = moduleName.match(regex);
    
    if (match) {
      matchingPattern = pattern;
      matchingSuffix = match[1] || '';
      break;
    }
  }
  
  if (!matchingPattern) {
    return null;
  }
  
  // Get the target paths for the matching pattern
  const targetPaths = pathMappings[matchingPattern];
  if (!targetPaths || !targetPaths.length) {
    return null;
  }
  
  // Get the directory containing the tsconfig.json file
  const tsConfigDir = path.dirname(tsConfigPath);
  
  // Try each target path until we find one that exists
  for (const targetPath of targetPaths) {
    // Replace the wildcard with the matching suffix
    const resolvedTargetPath = targetPath.replace('*', matchingSuffix);
    
    // Resolve the target path relative to the tsconfig.json directory
    const absolutePath = path.resolve(tsConfigDir, resolvedTargetPath);
    
    // Check if the path exists
    if (pathExists(absolutePath)) {
      return absolutePath;
    }
    
    // Try with various extensions
    const extensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx', '.json'];
    for (const ext of extensions) {
      const pathWithExt = `${absolutePath}${ext}`;
      if (pathExists(pathWithExt)) {
        return pathWithExt;
      }
    }
    
    // Try with index files
    for (const ext of extensions) {
      const indexPath = path.join(absolutePath, `index${ext}`);
      if (pathExists(indexPath)) {
        return indexPath;
      }
    }
  }
  
  return null;
}

/**
 * Resolves a module name to a filesystem path.
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} containingFile - The file containing the import
 * @returns {string|null} - The resolved path, or null if not found
 */
function resolveModule(moduleName, containingFile) {
  // Handle package imports (e.g., @austa/design-system)
  if (moduleName.startsWith('@')) {
    // Extract the package name
    const packageName = moduleName.includes('/')
      ? moduleName.split('/').slice(0, 2).join('/')
      : moduleName;
    
    // Check if this is one of our mapped packages
    if (packageMappings[packageName]) {
      const packagePath = resolvePackagePath(packageName);
      if (!packagePath) {
        return null;
      }
      
      // Handle imports from the package root (e.g., import { Button } from '@austa/design-system')
      if (moduleName === packageName) {
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
            return normalizePath(entry);
          }
        }
      }
      
      // Handle imports from package subpaths (e.g., import { Box } from '@austa/design-system/components')
      if (moduleName.startsWith(`${packageName}/`)) {
        const subpath = moduleName.slice(packageName.length + 1);
        
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
            return normalizePath(p);
          }
        }
      }
    }
  }
  
  // Handle path aliases (e.g., @/components/Button)
  return resolvePathAlias(moduleName, containingFile);
}

/**
 * Creates a TypeScript resolved module object.
 * @param {string} resolvedPath - The resolved path
 * @param {boolean} isExternalLibraryImport - Whether this is an external library import
 * @returns {Object} - The resolved module object
 */
function createResolvedModule(resolvedPath, isExternalLibraryImport = false) {
  return {
    resolvedFileName: resolvedPath,
    isExternalLibraryImport,
    resolvedModule: {
      resolvedFileName: resolvedPath,
      isExternalLibraryImport
    }
  };
}

/**
 * The main resolver function that TypeScript will call to resolve modules.
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} containingFile - The file containing the import
 * @returns {Object|undefined} - The resolved module, or undefined if not found
 */
function resolveModuleName(moduleName, containingFile) {
  // Normalize paths for cross-platform compatibility
  const normalizedContainingFile = normalizePath(containingFile);
  
  // Skip relative imports, as TypeScript can handle these natively
  if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
    return undefined;
  }
  
  // Resolve the module
  const resolvedPath = resolveModule(moduleName, normalizedContainingFile);
  if (!resolvedPath) {
    return undefined;
  }
  
  // Determine if this is an external library import
  const isExternalLibraryImport = !resolvedPath.includes(monorepoRoot || '');
  
  // Create and return the resolved module object
  return createResolvedModule(resolvedPath, isExternalLibraryImport);
}

/**
 * Handles project references and composite builds.
 * This function is called by TypeScript to resolve references between projects.
 * @param {Object} host - The TypeScript compiler host
 * @param {Array<Object>} references - The project references
 * @returns {Array<Object>} - The resolved references
 */
function resolveProjectReferences(host, references) {
  if (!references || !references.length) {
    return [];
  }
  
  return references.map(ref => {
    // Get the path to the referenced project
    const projectPath = ref.path;
    
    // Resolve the path to the tsconfig.json file
    const tsConfigPath = path.resolve(projectPath, 'tsconfig.json');
    
    // Check if the tsconfig.json file exists
    if (!pathExists(tsConfigPath)) {
      return null;
    }
    
    // Parse the tsconfig.json file
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
      
      // Check if this is a composite project
      if (!tsConfig.compilerOptions?.composite) {
        return null;
      }
      
      // Return the resolved reference
      return {
        path: normalizePath(tsConfigPath),
        originalPath: normalizePath(projectPath),
        prepend: ref.prepend,
        circular: ref.circular
      };
    } catch (e) {
      return null;
    }
  }).filter(Boolean);
}

/**
 * The main resolver object that TypeScript will use to resolve modules.
 */
module.exports = {
  resolveModuleName,
  resolveProjectReferences
};