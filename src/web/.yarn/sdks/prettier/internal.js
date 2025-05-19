/**
 * Internal utilities for the Prettier SDK
 * 
 * This file contains internal utilities used by the Prettier SDK to handle
 * module resolution in the Yarn PnP environment.
 */

const path = require('path');

// Find the project root directory
const findProjectRoot = () => {
  const pnpFilePath = path.resolve(__dirname, '../../../../.pnp.cjs');
  return path.dirname(pnpFilePath);
};

// Get the PnP API
const getPnpApi = () => {
  const pnpFilePath = path.resolve(__dirname, '../../../../.pnp.cjs');
  try {
    return require(pnpFilePath);
  } catch (error) {
    throw new Error(`Failed to load PnP API: ${error.message}`);
  }
};

/**
 * Resolve a module using the PnP API
 * 
 * @param {string} request - The module to resolve
 * @param {string} [issuer] - The file that is requesting the module
 * @returns {string|null} - The resolved module path or null if not found
 */
const resolveModule = (request, issuer) => {
  try {
    const pnpApi = getPnpApi();
    return pnpApi.resolveRequest(
      request,
      issuer || path.join(process.cwd(), 'noop.js')
    );
  } catch (error) {
    return null;
  }
};

/**
 * Create a require function that is aware of the PnP environment
 * 
 * @returns {Function} - A require function that can resolve modules in the PnP environment
 */
const createPnPAwareRequire = () => {
  return (request) => {
    const resolved = resolveModule(request);
    if (resolved) {
      return require(resolved);
    }
    return require(request);
  };
};

/**
 * Load a Prettier plugin using the PnP API
 * 
 * @param {string} pluginName - The name of the plugin to load
 * @returns {Object|null} - The loaded plugin or null if not found
 */
const loadPrettierPlugin = (pluginName) => {
  try {
    const resolved = resolveModule(pluginName);
    if (resolved) {
      return require(resolved);
    }
    return null;
  } catch (error) {
    console.warn(`Failed to load Prettier plugin ${pluginName}:`, error.message);
    return null;
  }
};

/**
 * Load multiple Prettier plugins using the PnP API
 * 
 * @param {Array<string>} pluginNames - The names of the plugins to load
 * @returns {Array<Object>} - The loaded plugins
 */
const loadPrettierPlugins = (pluginNames) => {
  if (!Array.isArray(pluginNames)) {
    return [];
  }

  return pluginNames
    .map(loadPrettierPlugin)
    .filter(Boolean);
};

module.exports = {
  findProjectRoot,
  getPnpApi,
  resolveModule,
  createPnPAwareRequire,
  loadPrettierPlugin,
  loadPrettierPlugins,
};