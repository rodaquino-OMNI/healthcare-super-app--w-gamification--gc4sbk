/**
 * @file internal.js
 * @description Internal implementation details for the Prettier SDK integration with Yarn's Plug'n'Play mode.
 * This file contains utility functions and helpers used by the main SDK entry point.
 */

'use strict';

const path = require('path');
const fs = require('fs');

/**
 * Resolve the PnP API module
 */
let pnpApi;
try {
  pnpApi = require('pnpapi');
} catch (error) {
  throw new Error(`PnP API not found: ${error.message}`);
}

/**
 * Resolves a module using the PnP API
 * @param {string} request - The module to resolve
 * @param {string} issuer - The path of the file making the request
 * @returns {string} - The resolved module path
 */
function resolveModule(request, issuer) {
  try {
    return pnpApi.resolveRequest(request, issuer);
  } catch (error) {
    throw new Error(`Failed to resolve module '${request}' from '${issuer}': ${error.message}`);
  }
}

/**
 * Checks if a file exists
 * @param {string} filePath - The path to check
 * @returns {boolean} - Whether the file exists
 */
function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (error) {
    return false;
  }
}

/**
 * Checks if a directory exists
 * @param {string} dirPath - The path to check
 * @returns {boolean} - Whether the directory exists
 */
function directoryExists(dirPath) {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Resolves a configuration file path
 * @param {string} configPath - The path to the configuration file
 * @returns {string|null} - The resolved configuration file path or null if not found
 */
function resolveConfigFile(configPath) {
  if (!configPath) {
    return null;
  }

  // If the path is absolute, check if it exists
  if (path.isAbsolute(configPath)) {
    return fileExists(configPath) ? configPath : null;
  }

  // Otherwise, resolve it relative to the current working directory
  const absolutePath = path.resolve(process.cwd(), configPath);
  return fileExists(absolutePath) ? absolutePath : null;
}

/**
 * Finds a Prettier configuration file in the given directory or its ancestors
 * @param {string} directory - The directory to start searching from
 * @returns {string|null} - The path to the configuration file or null if not found
 */
function findConfigFile(directory) {
  const configFileNames = [
    '.prettierrc',
    '.prettierrc.json',
    '.prettierrc.yaml',
    '.prettierrc.yml',
    '.prettierrc.js',
    '.prettierrc.cjs',
    'prettier.config.js',
    'prettier.config.cjs',
    '.prettierrc.toml'
  ];

  let currentDir = directory;
  while (currentDir) {
    for (const fileName of configFileNames) {
      const filePath = path.join(currentDir, fileName);
      if (fileExists(filePath)) {
        return filePath;
      }
    }

    // Move up to the parent directory
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return null;
}

/**
 * Path alias mapping for the monorepo
 */
const pathAliases = {
  '@app/auth': './src/web/shared/auth',
  '@app/shared': './src/web/shared',
  '@austa/design-system': './src/web/design-system',
  '@design-system/primitives': './src/web/primitives',
  '@austa/interfaces': './src/web/interfaces',
  '@austa/journey-context': './src/web/journey-context',
  '@austa/health': './src/web/shared/health',
  '@austa/care': './src/web/shared/care',
  '@austa/plan': './src/web/shared/plan'
};

/**
 * Resolves a path alias to its actual path
 * @param {string} alias - The alias to resolve
 * @returns {string|null} - The resolved path or null if the alias is not found
 */
function resolvePathAlias(alias) {
  // Check if the import path starts with any of our registered aliases
  for (const [prefix, aliasPath] of Object.entries(pathAliases)) {
    if (alias.startsWith(prefix)) {
      // Replace the alias prefix with the actual path
      return path.join(process.cwd(), alias.replace(prefix, aliasPath));
    }
  }
  return null;
}

/**
 * Resolves a plugin path
 * @param {string} pluginPath - The plugin path to resolve
 * @returns {string} - The resolved plugin path
 */
function resolvePluginPath(pluginPath) {
  // Check if the plugin is specified as a path
  if (pluginPath.startsWith('./') || pluginPath.startsWith('../') || path.isAbsolute(pluginPath)) {
    return pluginPath;
  }

  // Check if the plugin uses a path alias
  const aliasPath = resolvePathAlias(pluginPath);
  if (aliasPath) {
    return aliasPath;
  }

  // Otherwise, try to resolve it as a package
  try {
    return resolveModule(pluginPath, process.cwd());
  } catch (error) {
    // If that fails, try to resolve it relative to the Prettier package
    try {
      const prettierPath = resolveModule('prettier', process.cwd());
      return resolveModule(pluginPath, prettierPath);
    } catch (innerError) {
      throw new Error(`Failed to resolve plugin '${pluginPath}': ${innerError.message}`);
    }
  }
}

module.exports = {
  resolveModule,
  fileExists,
  directoryExists,
  resolveConfigFile,
  findConfigFile,
  resolvePathAlias,
  resolvePluginPath,
  pathAliases
};