/**
 * @fileoverview ESLint Configuration Resolver for Yarn PnP environments
 * 
 * This module provides specialized resolution for ESLint configuration files
 * in a Yarn PnP (Plug'n'Play) environment. It ensures that ESLint can correctly
 * locate and load configuration files (.eslintrc.js, .eslintrc.json) and their
 * extended configurations across the monorepo.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Try to load the PnP API if available
let pnp;
try {
  pnp = require('pnpapi');
} catch (error) {
  // Not in a PnP environment, will use standard resolution
}

/**
 * Resolves the given module name from the provided base directory
 * @param {string} moduleName - The module to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string} The resolved module path
 */
function resolveModule(moduleName, baseDir) {
  try {
    if (pnp) {
      // Use PnP API to resolve the module
      return pnp.resolveToUnqualified(moduleName, baseDir);
    } else {
      // Fallback to standard Node.js resolution
      return require.resolve(moduleName, { paths: [baseDir] });
    }
  } catch (error) {
    // Handle special case for eslint-config- prefix
    if (!moduleName.startsWith('eslint-config-')) {
      try {
        return resolveModule(`eslint-config-${moduleName}`, baseDir);
      } catch (prefixError) {
        // If that also fails, throw the original error
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Resolves an ESLint plugin from the provided base directory
 * @param {string} pluginName - The plugin to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string} The resolved plugin path
 */
function resolvePlugin(pluginName, baseDir) {
  // Handle the eslint-plugin- prefix if not already present
  const fullPluginName = pluginName.startsWith('eslint-plugin-') 
    ? pluginName 
    : `eslint-plugin-${pluginName}`;
  
  try {
    return resolveModule(fullPluginName, baseDir);
  } catch (error) {
    // Try resolving from the ESLint installation directory as a fallback
    try {
      const eslintPath = path.dirname(require.resolve('eslint/package.json'));
      return resolveModule(fullPluginName, eslintPath);
    } catch (eslintError) {
      throw error; // If that also fails, throw the original error
    }
  }
}

/**
 * Resolves an ESLint configuration file
 * @param {string} configName - The configuration to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string} The resolved configuration path
 */
function resolveConfig(configName, baseDir) {
  // Handle relative paths
  if (configName.startsWith('./') || configName.startsWith('../')) {
    const resolvedPath = path.resolve(baseDir, configName);
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
    throw new Error(`Could not resolve config file: ${resolvedPath}`);
  }
  
  // Handle absolute paths
  if (path.isAbsolute(configName)) {
    if (fs.existsSync(configName)) {
      return configName;
    }
    throw new Error(`Could not resolve config file: ${configName}`);
  }
  
  // Handle package names (with or without eslint-config- prefix)
  try {
    return resolveModule(configName, baseDir);
  } catch (error) {
    // If resolution fails, try with workspace-specific paths
    if (pnp) {
      try {
        // Try to find the configuration in workspaces
        const workspaces = findWorkspaces();
        for (const workspace of workspaces) {
          try {
            return resolveModule(configName, workspace);
          } catch (workspaceError) {
            // Continue to the next workspace
          }
        }
      } catch (workspaceError) {
        // Ignore workspace resolution errors
      }
    }
    throw error;
  }
}

/**
 * Attempts to find all workspace roots in the monorepo
 * @returns {string[]} Array of workspace root paths
 */
function findWorkspaces() {
  if (!pnp) {
    return [];
  }
  
  try {
    // Try to get workspaces from PnP API
    const pnpWorkspaces = pnp.getPackageInformation(pnp.topLevel).workspaces;
    if (pnpWorkspaces && Array.isArray(pnpWorkspaces)) {
      return pnpWorkspaces.map(w => w.location);
    }
  } catch (error) {
    // Fallback: try to find package.json with workspaces field
    try {
      const projectRoot = findProjectRoot();
      if (projectRoot) {
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.workspaces) {
            // This is a simplified approach - in a real implementation,
            // we would need to resolve glob patterns in workspaces
            return [];
          }
        }
      }
    } catch (packageError) {
      // Ignore package.json errors
    }
  }
  
  return [];
}

/**
 * Finds the project root by looking for .pnp.cjs or package.json
 * @returns {string|null} The project root path or null if not found
 */
function findProjectRoot() {
  let currentDir = process.cwd();
  const root = path.parse(currentDir).root;
  
  while (currentDir !== root) {
    if (fs.existsSync(path.join(currentDir, '.pnp.cjs')) || 
        fs.existsSync(path.join(currentDir, '.pnp.js'))) {
      return currentDir;
    }
    
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Resolves a path alias from tsconfig.json or other configuration
 * @param {string} alias - The alias to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved path or null if not resolvable
 */
function resolvePathAlias(alias, baseDir) {
  // Try to find and parse tsconfig.json for path mappings
  try {
    const tsconfigPath = findTsconfig(baseDir);
    if (tsconfigPath) {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const paths = tsconfig.compilerOptions?.paths;
      
      if (paths) {
        // Check if the alias matches any of the path mappings
        for (const [pattern, destinations] of Object.entries(paths)) {
          const normalizedPattern = pattern.replace(/\*/g, '');
          if (alias.startsWith(normalizedPattern) && Array.isArray(destinations) && destinations.length > 0) {
            const suffix = alias.slice(normalizedPattern.length);
            const destination = destinations[0].replace(/\*/g, '');
            const resolvedPath = path.resolve(path.dirname(tsconfigPath), destination, suffix);
            
            if (fs.existsSync(resolvedPath) || fs.existsSync(`${resolvedPath}.js`) || fs.existsSync(`${resolvedPath}.ts`)) {
              return resolvedPath;
            }
          }
        }
      }
    }
  } catch (error) {
    // Ignore tsconfig.json errors
  }
  
  return null;
}

/**
 * Finds the nearest tsconfig.json file
 * @param {string} dir - The directory to start searching from
 * @returns {string|null} The path to tsconfig.json or null if not found
 */
function findTsconfig(dir) {
  let currentDir = dir;
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
 * Patches ESLint's module resolution to work with Yarn PnP
 */
function patchEslintModuleResolution() {
  try {
    // Only apply the patch if we're in a PnP environment
    if (!pnp) {
      return;
    }
    
    // Try to load the ESLint module resolver
    const eslintModuleResolverPath = require.resolve('eslint/lib/shared/relative-module-resolver');
    const originalResolver = require(eslintModuleResolverPath);
    
    // Patch the resolver
    require.cache[eslintModuleResolverPath].exports = function patchedResolver(moduleName, relativeToPath) {
      try {
        // First try the original resolver
        return originalResolver(moduleName, relativeToPath);
      } catch (error) {
        // If that fails, try our custom resolution
        try {
          if (moduleName.startsWith('eslint-plugin-')) {
            return resolvePlugin(moduleName, path.dirname(relativeToPath));
          } else if (moduleName.startsWith('eslint-config-')) {
            return resolveConfig(moduleName, path.dirname(relativeToPath));
          } else {
            // Try to resolve path aliases
            const resolvedAlias = resolvePathAlias(moduleName, path.dirname(relativeToPath));
            if (resolvedAlias) {
              return resolvedAlias;
            }
            
            // Fall back to our module resolver
            return resolveModule(moduleName, path.dirname(relativeToPath));
          }
        } catch (customError) {
          // If our custom resolution also fails, throw the original error
          throw error;
        }
      }
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
  resolvePathAlias,
  findWorkspaces,
  findProjectRoot,
  findTsconfig
};