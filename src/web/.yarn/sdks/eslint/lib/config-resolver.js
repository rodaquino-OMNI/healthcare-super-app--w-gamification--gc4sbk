/**
 * @fileoverview ESLint Configuration Resolver for Yarn PnP environments
 * @author AUSTA SuperApp Team
 * 
 * This module provides custom resolution mechanisms for ESLint configuration files,
 * plugins, parsers, and imports in a Yarn PnP environment. It addresses the path
 * resolution failures mentioned in the technical specification by ensuring that
 * ESLint can correctly locate and load configuration files across the monorepo.
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Try to load PnP API if available
// In Yarn PnP, the pnpapi module is automatically available to all packages
let pnpApi;
try {
  pnpApi = require('pnpapi');
} catch (error) {
  // PnP API not available, will fall back to standard resolution
  // This can happen when running in a non-PnP environment
}

/**
 * Resolves the given module name from the provided base directory
 * @param {string} moduleName - The module to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolveModule(moduleName, baseDir) {
  try {
    if (pnpApi) {
      // Use PnP API for resolution if available
      // resolveToUnqualified returns the path to the package directory
      // This is needed because ESLint expects paths to actual files, not virtual paths
      return pnpApi.resolveToUnqualified(moduleName, baseDir);
    } else {
      // Fall back to standard Node.js resolution
      return require.resolve(moduleName, { paths: [baseDir] });
    }
  } catch (error) {
    // Try to resolve from workspace root as a fallback
    try {
      const workspaceRoot = getWorkspaceRoot();
      if (baseDir !== workspaceRoot) {
        return resolveModule(moduleName, workspaceRoot);
      }
    } catch (e) {
      // Ignore errors in fallback resolution
    }
    return null;
  }
}

/**
 * Resolves an ESLint config file path
 * @param {string} configName - The config name to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved config path or null if not found
 */
function resolveConfig(configName, baseDir) {
  // Handle built-in configs
  if (configName.startsWith('eslint:')) {
    return configName;
  }

  // Handle scoped packages
  let prefix = '';
  if (configName.charAt(0) === '@') {
    const scopedPackageSlash = configName.indexOf('/');
    if (scopedPackageSlash > 0) {
      prefix = configName.slice(0, scopedPackageSlash + 1);
      configName = configName.slice(scopedPackageSlash + 1);
    }
  }

  // Handle eslint-config prefix
  const configFullName = configName.startsWith('eslint-config-')
    ? `${prefix}${configName}`
    : `${prefix}eslint-config-${configName}`;

  // Try to resolve the config
  const resolvedPath = resolveModule(configFullName, baseDir) || 
                       resolveModule(configName, baseDir);

  return resolvedPath;
}

/**
 * Resolves an ESLint plugin
 * @param {string} pluginName - The plugin name to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved plugin path or null if not found
 */
function resolvePlugin(pluginName, baseDir) {
  // Handle scoped packages
  let prefix = '';
  if (pluginName.charAt(0) === '@') {
    const scopedPackageSlash = pluginName.indexOf('/');
    if (scopedPackageSlash > 0) {
      prefix = pluginName.slice(0, scopedPackageSlash + 1);
      pluginName = pluginName.slice(scopedPackageSlash + 1);
    }
  }

  // Handle eslint-plugin prefix
  const pluginFullName = pluginName.startsWith('eslint-plugin-')
    ? `${prefix}${pluginName}`
    : `${prefix}eslint-plugin-${pluginName}`;

  // Try to resolve the plugin
  const resolvedPath = resolveModule(pluginFullName, baseDir) || 
                       resolveModule(pluginName, baseDir);

  return resolvedPath;
}

/**
 * Resolves a parser based on the provided name
 * @param {string} parserName - The parser to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved parser path or null if not found
 */
function resolveParser(parserName, baseDir) {
  return resolveModule(parserName, baseDir);
}

/**
 * Resolves a path alias based on tsconfig or jsconfig
 * @param {string} source - The source path with alias
 * @param {string} file - The file containing the import
 * @param {Object} config - The ESLint config object
 * @returns {string|null} The resolved path or null if not found
 */
function resolvePathAlias(source, file, config) {
  // Handle common path alias patterns in the AUSTA SuperApp
  // This includes aliases like @app/auth, @app/shared, @austa/*, etc.
  // as mentioned in the technical specification
  
  // Skip if not potentially an alias
  if (!source.startsWith('@')) {
    return null;
  }

  const fileDir = path.dirname(file);
  
  // Try to find tsconfig.json or jsconfig.json
  let configPath = null;
  let currentDir = fileDir;
  
  // Look for config files up to the root
  while (currentDir && currentDir !== path.parse(currentDir).root) {
    const tsConfigPath = path.join(currentDir, 'tsconfig.json');
    const jsConfigPath = path.join(currentDir, 'jsconfig.json');
    
    if (fs.existsSync(tsConfigPath)) {
      configPath = tsConfigPath;
      break;
    } else if (fs.existsSync(jsConfigPath)) {
      configPath = jsConfigPath;
      break;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  if (!configPath) {
    // If no config file found, try some common patterns for the AUSTA SuperApp
    const workspaceRoot = getWorkspaceRoot();
    
    // Handle @app/* aliases (common in the AUSTA SuperApp)
    if (source.startsWith('@app/')) {
      const appPath = source.slice(5); // Remove '@app/'
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
        
        // Try with .js, .ts, .jsx, .tsx extensions
        for (const ext of ['.js', '.ts', '.jsx', '.tsx']) {
          const pathWithExt = possiblePath + ext;
          if (fs.existsSync(pathWithExt)) {
            return pathWithExt;
          }
        }
      }
    }
    
    // Handle @austa/* aliases
    if (source.startsWith('@austa/')) {
      const austaPath = source.slice(7); // Remove '@austa/'
      const possiblePaths = [
        path.join(workspaceRoot, 'src', 'web', austaPath),
        path.join(workspaceRoot, 'src', 'web', austaPath, 'src'),
        path.join(workspaceRoot, 'src', 'backend', 'packages', austaPath),
        path.join(workspaceRoot, 'src', 'backend', 'packages', austaPath, 'src')
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          return possiblePath;
        }
      }
    }
    
    return null;
  }
  
  try {
    const configContent = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const paths = configContent.compilerOptions?.paths || {};
    
    // Find matching path alias
    for (const [alias, targets] of Object.entries(paths)) {
      const aliasPattern = alias.replace(/\*/g, '(.*)');
      const regex = new RegExp(`^${aliasPattern}$`);
      const match = source.match(regex);
      
      if (match) {
        const suffix = match[1] || '';
        const target = targets[0].replace('*', suffix);
        const basePath = path.dirname(configPath);
        const resolvedPath = path.resolve(basePath, target);
        
        return resolvedPath;
      }
    }
  } catch (error) {
    // Failed to parse config or resolve alias
  }
  
  return null;
}

/**
 * Resolves an import based on the provided source
 * @param {string} source - The import source
 * @param {string} file - The file containing the import
 * @param {Object} config - The ESLint config object
 * @returns {string|null} The resolved import path or null if not found
 */
function resolveImport(source, file, config) {
  // Skip node built-in modules
  if (isBuiltinModule(source)) {
    return source;
  }
  
  // First try to resolve as a path alias
  const aliasResolved = resolvePathAlias(source, file, config);
  if (aliasResolved) {
    return aliasResolved;
  }
  
  // Then try to resolve as a module
  const baseDir = path.dirname(file);
  const resolved = resolveModule(source, baseDir);
  
  if (resolved) {
    return resolved;
  }
  
  // If still not resolved, try from workspace root
  const workspaceRoot = getWorkspaceRoot();
  return resolveModule(source, workspaceRoot);
}

/**
 * Checks if a module is a Node.js built-in module
 * @param {string} moduleName - The module name to check
 * @returns {boolean} True if the module is built-in, false otherwise
 */
function isBuiltinModule(moduleName) {
  // List of Node.js built-in modules
  const builtinModules = [
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
    'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'module',
    'net', 'os', 'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline',
    'repl', 'stream', 'string_decoder', 'timers', 'tls', 'tty', 'url', 'util',
    'v8', 'vm', 'wasi', 'worker_threads', 'zlib'
  ];
  
  return builtinModules.includes(moduleName);
}

/**
 * Gets the workspace root directory
 * @returns {string} The workspace root directory
 */
function getWorkspaceRoot() {
  // Try to find the workspace root by looking for .yarn folder
  let currentDir = process.cwd();
  
  while (currentDir && currentDir !== path.parse(currentDir).root) {
    // Check for .yarn directory which indicates a Yarn PnP workspace root
    if (fs.existsSync(path.join(currentDir, '.yarn'))) {
      return currentDir;
    }
    
    // Also check for package.json with workspaces field
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  // Fall back to current directory if not found
  return process.cwd();
}

/**
 * Resolves the configuration file path
 * @param {string} configFile - The config file to resolve
 * @param {string} baseDir - The directory to resolve from
 * @returns {string|null} The resolved config file path or null if not found
 */
function resolveConfigFile(configFile, baseDir) {
  if (path.isAbsolute(configFile)) {
    return fs.existsSync(configFile) ? configFile : null;
  }
  
  const resolvedPath = path.resolve(baseDir, configFile);
  return fs.existsSync(resolvedPath) ? resolvedPath : null;
}

/**
 * Checks if a path exists in the file system
 * @param {string} filePath - The path to check
 * @returns {boolean} True if the path exists, false otherwise
 */
function pathExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Finds the nearest ESLint configuration file from the given directory
 * @param {string} directory - The directory to start searching from
 * @returns {string|null} The path to the nearest configuration file or null if not found
 */
function findNearestConfig(directory) {
  let currentDir = directory;
  
  while (currentDir && currentDir !== path.parse(currentDir).root) {
    // Check for various ESLint config file formats
    const configFiles = [
      path.join(currentDir, '.eslintrc.js'),
      path.join(currentDir, '.eslintrc.cjs'),
      path.join(currentDir, '.eslintrc.yaml'),
      path.join(currentDir, '.eslintrc.yml'),
      path.join(currentDir, '.eslintrc.json'),
      path.join(currentDir, '.eslintrc'),
      path.join(currentDir, 'eslint.config.js'),
      path.join(currentDir, 'eslint.config.mjs')
    ];
    
    for (const configFile of configFiles) {
      if (pathExists(configFile)) {
        return configFile;
      }
    }
    
    // Check for package.json with eslintConfig field
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (pathExists(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        if (packageJson.eslintConfig) {
          return packageJsonPath;
        }
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

module.exports = {
  resolveConfig,
  resolvePlugin,
  resolveParser,
  resolveImport,
  resolveModule,
  resolveConfigFile,
  getWorkspaceRoot,
  findNearestConfig,
  pathExists,
  isBuiltinModule
};