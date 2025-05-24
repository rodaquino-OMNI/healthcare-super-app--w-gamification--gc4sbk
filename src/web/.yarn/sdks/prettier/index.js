#!/usr/bin/env node

/**
 * @file index.js
 * @description Main entry point for the Prettier SDK integration with Yarn's Plug'n'Play mode.
 * This file provides a patch for Prettier's module resolution system that enables it to correctly
 * resolve configuration files, plugins, and dependencies in the PnP environment.
 */

'use strict';

const path = require('path');

/**
 * Resolve the PnP API module
 * This is the core of Yarn's Plug'n'Play system that we'll use to resolve modules
 */
let pnpApi;
try {
  pnpApi = require('pnpapi');
} catch (error) {
  // If PnP API is not available, we're not in a PnP environment
  // In this case, we'll just use the regular Prettier module
  console.warn('Warning: PnP API not found, falling back to regular module resolution');
  module.exports = require('prettier');
  return;
}

/**
 * Path to the actual Prettier module
 * We need to resolve this using the PnP API to ensure we get the correct version
 */
let prettierPath;
try {
  // Resolve the Prettier package using the PnP API
  prettierPath = pnpApi.resolveToUnqualified('prettier', process.cwd());
} catch (error) {
  console.error('Error resolving Prettier module:', error.message);
  process.exit(1);
}

/**
 * Create a custom require function that uses the PnP API for resolution
 * This is used to load Prettier plugins and other dependencies
 */
const pnpRequire = (request) => {
  try {
    // First try to resolve using the PnP API
    const resolvedPath = pnpApi.resolveRequest(request, process.cwd());
    return require(resolvedPath);
  } catch (error) {
    // If that fails, try to resolve relative to the Prettier package
    try {
      const resolvedPath = pnpApi.resolveRequest(request, prettierPath);
      return require(resolvedPath);
    } catch (innerError) {
      // If both resolution methods fail, throw an error
      throw new Error(`Failed to resolve module '${request}': ${innerError.message}`);
    }
  }
};

/**
 * Path alias mapping for the monorepo
 * This ensures that imports using these aliases can be properly resolved
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
 * Resolve a path alias to its actual path
 * @param {string} alias - The alias to resolve
 * @returns {string|null} - The resolved path or null if the alias is not found
 */
const resolvePathAlias = (alias) => {
  // Check if the import path starts with any of our registered aliases
  for (const [prefix, aliasPath] of Object.entries(pathAliases)) {
    if (alias.startsWith(prefix)) {
      // Replace the alias prefix with the actual path
      return path.join(process.cwd(), alias.replace(prefix, aliasPath));
    }
  }
  return null;
};

/**
 * Custom plugin loader for Prettier
 * This function handles loading Prettier plugins in a PnP-compatible way
 * @param {string[]} plugins - Array of plugin names or paths
 * @returns {any[]} - Array of loaded plugin modules
 */
const loadPlugins = (plugins) => {
  if (!plugins || !Array.isArray(plugins)) {
    return [];
  }

  return plugins.map(plugin => {
    try {
      // Check if the plugin is specified as a path
      if (plugin.startsWith('./') || plugin.startsWith('../') || path.isAbsolute(plugin)) {
        return require(plugin);
      }

      // Check if the plugin uses a path alias
      const aliasPath = resolvePathAlias(plugin);
      if (aliasPath) {
        return require(aliasPath);
      }

      // Otherwise, try to resolve it as a package
      return pnpRequire(plugin);
    } catch (error) {
      console.error(`Error loading Prettier plugin '${plugin}':`, error.message);
      throw error;
    }
  });
};

/**
 * Load the actual Prettier module
 */
let prettier;
try {
  prettier = require(prettierPath);

  // Patch the resolveConfig.sync method to handle PnP environment
  const originalResolveConfigSync = prettier.resolveConfig.sync;
  prettier.resolveConfig.sync = (filePath, options) => {
    const config = originalResolveConfigSync(filePath, options);
    
    // If the config contains plugins, load them using our custom loader
    if (config && config.plugins) {
      config.plugins = loadPlugins(config.plugins);
    }
    
    return config;
  };

  // Patch the resolveConfig method to handle PnP environment
  const originalResolveConfig = prettier.resolveConfig;
  prettier.resolveConfig = async (filePath, options) => {
    const config = await originalResolveConfig(filePath, options);
    
    // If the config contains plugins, load them using our custom loader
    if (config && config.plugins) {
      config.plugins = loadPlugins(config.plugins);
    }
    
    return config;
  };

  // Patch the format method to handle PnP environment
  const originalFormat = prettier.format;
  prettier.format = (source, options) => {
    // If options contain plugins, load them using our custom loader
    if (options && options.plugins) {
      options.plugins = loadPlugins(options.plugins);
    }
    
    return originalFormat(source, options);
  };

  // Patch the formatWithCursor method to handle PnP environment
  const originalFormatWithCursor = prettier.formatWithCursor;
  prettier.formatWithCursor = (source, options) => {
    // If options contain plugins, load them using our custom loader
    if (options && options.plugins) {
      options.plugins = loadPlugins(options.plugins);
    }
    
    return originalFormatWithCursor(source, options);
  };

  // Patch the check method to handle PnP environment
  const originalCheck = prettier.check;
  prettier.check = (source, options) => {
    // If options contain plugins, load them using our custom loader
    if (options && options.plugins) {
      options.plugins = loadPlugins(options.plugins);
    }
    
    return originalCheck(source, options);
  };

  // Export the patched Prettier module
  module.exports = prettier;
} catch (error) {
  console.error('Error loading Prettier module:', error.message);
  process.exit(1);
}