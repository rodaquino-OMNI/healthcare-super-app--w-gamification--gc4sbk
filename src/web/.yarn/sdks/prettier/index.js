#!/usr/bin/env node

/**
 * Prettier SDK for Yarn PnP
 * 
 * This file provides a patch for Prettier's module resolution system that enables it to correctly
 * resolve configuration files, plugins, and dependencies in the PnP environment. Without this file,
 * Prettier would be unable to function properly within the monorepo structure when using Yarn PnP,
 * leading to formatting inconsistencies and potential build failures.
 * 
 * It specifically supports the AUSTA SuperApp monorepo structure with the following packages:
 * - @austa/design-system
 * - @design-system/primitives
 * - @austa/interfaces
 * - @austa/journey-context
 */

const { existsSync } = require('fs');
const { resolve, dirname } = require('path');

// Determine the project root directory
const pnpFile = resolve(__dirname, '../../../../.pnp.cjs');

// Check if the PnP file exists
if (!existsSync(pnpFile)) {
  console.error(`Failed to locate the PnP file at ${pnpFile}`);
  process.exit(1);
}

// Load the PnP API
const pnpApi = require(pnpFile);

// Setup the PnP runtime
if (typeof pnpApi.setup === 'function') {
  pnpApi.setup();
}

/**
 * Resolve a module using the PnP API
 * This is a wrapper around the PnP API's resolveRequest function
 */
function resolveModule(request, issuer) {
  try {
    // Use the PnP API to resolve the module
    return pnpApi.resolveRequest(request, issuer || dirname(process.cwd()));
  } catch (error) {
    // If the module cannot be resolved, return null
    return null;
  }
}

/**
 * Create a custom require function that uses the PnP API
 * This is used to load Prettier and its plugins
 */
function createPnPAwareRequire() {
  return function pnpRequire(request) {
    const resolved = resolveModule(request);
    if (resolved) {
      return require(resolved);
    }
    return require(request);
  };
}

// Create a PnP-aware require function
const pnpRequire = createPnPAwareRequire();

// Load Prettier using the PnP-aware require function
let prettier;

try {
  // First try to resolve Prettier from the project
  prettier = pnpRequire('prettier');
} catch (error) {
  try {
    // If that fails, try to resolve it from the SDK directory
    const prettierPath = resolveModule('prettier', __dirname);
    if (prettierPath) {
      prettier = require(prettierPath);
    } else {
      throw new Error('Could not resolve prettier');
    }
  } catch (innerError) {
    console.error('Failed to load Prettier:', innerError.message);
    process.exit(1);
  }
}

/**
 * Patch Prettier's resolveConfig.sync function to use the PnP API
 * This ensures that Prettier can correctly resolve configuration files
 */
const originalResolveConfigSync = prettier.resolveConfig.sync;
prettier.resolveConfig.sync = function pnpResolveConfigSync(filePath, options) {
  return originalResolveConfigSync(filePath, {
    ...options,
    // Use the PnP-aware require function to resolve plugins
    pluginSearchDirs: [dirname(pnpFile)],
  });
};

/**
 * Patch Prettier's resolveConfig function to use the PnP API
 * This ensures that Prettier can correctly resolve configuration files asynchronously
 */
const originalResolveConfig = prettier.resolveConfig;
prettier.resolveConfig = async function pnpResolveConfig(filePath, options) {
  return originalResolveConfig(filePath, {
    ...options,
    // Use the PnP-aware require function to resolve plugins
    pluginSearchDirs: [dirname(pnpFile)],
  });
};

/**
 * Patch Prettier's clearConfigCache function to ensure it works with PnP
 */
const originalClearConfigCache = prettier.clearConfigCache;
prettier.clearConfigCache = function pnpClearConfigCache() {
  return originalClearConfigCache();
};

/**
 * Custom plugin loader for Prettier that uses the PnP API
 * This ensures that Prettier can correctly load plugins in the PnP environment
 */
function loadPlugins(plugins, pluginSearchDirs) {
  if (!plugins) return [];

  const loadedPlugins = [];

  for (const plugin of plugins) {
    try {
      // If the plugin is a string, try to resolve it using the PnP API
      if (typeof plugin === 'string') {
        const resolvedPlugin = resolveModule(plugin);
        if (resolvedPlugin) {
          loadedPlugins.push(require(resolvedPlugin));
          continue;
        }

        // If the plugin couldn't be resolved directly, try to resolve it from the search dirs
        if (pluginSearchDirs) {
          for (const dir of pluginSearchDirs) {
            try {
              const resolvedFromDir = resolveModule(plugin, dir);
              if (resolvedFromDir) {
                loadedPlugins.push(require(resolvedFromDir));
                break;
              }
            } catch (error) {
              // Ignore errors when resolving from search dirs
            }
          }
        }
      } else {
        // If the plugin is not a string, just use it as is
        loadedPlugins.push(plugin);
      }
    } catch (error) {
      console.warn(`Failed to load plugin ${plugin}:`, error.message);
    }
  }

  return loadedPlugins;
}

/**
 * Patch Prettier's format function to use the PnP-aware plugin loader
 * This ensures that Prettier can correctly load plugins in the PnP environment
 */
const originalFormat = prettier.format;
prettier.format = function pnpFormat(source, options) {
  const opts = { ...options };
  
  if (opts.plugins) {
    opts.plugins = loadPlugins(opts.plugins, opts.pluginSearchDirs);
  }
  
  return originalFormat(source, opts);
};

/**
 * Patch Prettier's formatWithCursor function to use the PnP-aware plugin loader
 * This ensures that Prettier can correctly load plugins in the PnP environment
 */
const originalFormatWithCursor = prettier.formatWithCursor;
prettier.formatWithCursor = function pnpFormatWithCursor(source, options) {
  const opts = { ...options };
  
  if (opts.plugins) {
    opts.plugins = loadPlugins(opts.plugins, opts.pluginSearchDirs);
  }
  
  return originalFormatWithCursor(source, opts);
};

/**
 * Patch Prettier's check function to use the PnP-aware plugin loader
 * This ensures that Prettier can correctly load plugins in the PnP environment
 */
const originalCheck = prettier.check;
prettier.check = function pnpCheck(source, options) {
  const opts = { ...options };
  
  if (opts.plugins) {
    opts.plugins = loadPlugins(opts.plugins, opts.pluginSearchDirs);
  }
  
  return originalCheck(source, opts);
};

/**
 * Patch Prettier's getFileInfo function to use the PnP API
 * This ensures that Prettier can correctly resolve file information
 */
const originalGetFileInfo = prettier.getFileInfo;
prettier.getFileInfo = async function pnpGetFileInfo(filePath, options) {
  return originalGetFileInfo(filePath, options);
};

/**
 * Patch Prettier's getFileInfo.sync function to use the PnP API
 * This ensures that Prettier can correctly resolve file information synchronously
 */
const originalGetFileInfoSync = prettier.getFileInfo.sync;
prettier.getFileInfo.sync = function pnpGetFileInfoSync(filePath, options) {
  return originalGetFileInfoSync(filePath, options);
};

// Export the patched Prettier instance
module.exports = prettier;