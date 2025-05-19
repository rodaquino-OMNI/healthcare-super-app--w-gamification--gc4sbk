/**
 * ESLint SDK Hook for Yarn PnP
 *
 * This file intercepts ESLint's module resolution system and redirects it to use Yarn's PnP resolution.
 * It's a critical part of ensuring that ESLint works correctly in a Yarn PnP environment, especially
 * for resolving plugins and configurations.
 *
 * @license MIT
 */

'use strict';

const path = require('path');
const fs = require('fs');

// Store the original Node.js require and resolve functions
const originalRequire = module.constructor.prototype.require;
const originalResolveFilename = module.constructor._resolveFilename;

/**
 * Checks if a path is within a Yarn PnP project
 * @param {string} modulePath - The path to check
 * @returns {boolean} - True if the path is within a PnP project
 */
function isPnpPath(modulePath) {
  return modulePath && modulePath.includes('/.yarn/') && modulePath.includes('/node_modules/');
}

/**
 * Resolves a module request using Yarn PnP
 * @param {string} request - The module request
 * @param {object} parentModule - The parent module making the request
 * @param {boolean} isMain - Whether this is the main module
 * @returns {string} - The resolved module path
 */
function pnpResolve(request, parentModule, isMain) {
  try {
    // Try to resolve using PnP
    return originalResolveFilename(request, parentModule, isMain);
  } catch (error) {
    // Special handling for ESLint plugins
    if (request.startsWith('eslint-plugin-') || 
        request.startsWith('@typescript-eslint/') ||
        request.includes('/eslint-plugin-') ||
        request.endsWith('/eslint-plugin')) {
      try {
        // Try to resolve from the project root
        const pnpApi = getPnpApi();
        if (pnpApi) {
          return pnpApi.resolveRequest(request, process.cwd() + '/');
        }
      } catch (pnpError) {
        // Fall through to the original error if PnP resolution fails
      }
    }
    
    // Re-throw the original error if we couldn't resolve using PnP
    throw error;
  }
}

/**
 * Gets the PnP API instance
 * @returns {object|null} - The PnP API instance or null if not available
 */
function getPnpApi() {
  try {
    return require('pnpapi');
  } catch (error) {
    // PnP API is not available
    return null;
  }
}

/**
 * Intercepts ESLint's module resolution for plugins and configurations
 * @param {string} request - The module request
 * @param {object} parent - The parent module making the request
 * @param {boolean} isMain - Whether this is the main module
 * @returns {string} - The resolved module path
 */
function hookResolveFilename(request, parent, isMain) {
  // Check if this is an ESLint-related request
  const isEslintRequest = (
    request.startsWith('eslint') ||
    request.startsWith('@eslint/') ||
    request.startsWith('eslint-plugin-') ||
    request.startsWith('@typescript-eslint/') ||
    request.includes('/eslint-config-') ||
    request.includes('/eslint-plugin-')
  );

  // If this is an ESLint-related request or the parent is from a PnP path, use PnP resolution
  if (isEslintRequest || (parent && isPnpPath(parent.filename))) {
    return pnpResolve(request, parent, isMain);
  }

  // Otherwise, use the original resolution
  return originalResolveFilename(request, parent, isMain);
}

/**
 * Intercepts require calls to ensure proper module loading in PnP environment
 * @param {string} request - The module request
 * @returns {any} - The loaded module
 */
function hookRequire(request) {
  // For ESLint 8.57.0 compatibility, handle special cases
  if (request === 'eslint/use-at-your-own-risk') {
    try {
      // Try to load the internal ESLint API
      const eslintPath = require.resolve('eslint');
      const eslintDir = path.dirname(eslintPath);
      return originalRequire.call(this, path.join(eslintDir, 'use-at-your-own-risk'));
    } catch (error) {
      // Fall through to standard require if special handling fails
    }
  }

  // Use the original require with potentially modified resolution
  return originalRequire.call(this, request);
}

// Install the hooks
module.constructor._resolveFilename = hookResolveFilename;
module.constructor.prototype.require = hookRequire;

// Export the hook installation function for programmatic usage
module.exports = function installHook() {
  // The hooks are already installed when this module is loaded
  return {
    uninstall: function() {
      // Restore original functions
      module.constructor._resolveFilename = originalResolveFilename;
      module.constructor.prototype.require = originalRequire;
    }
  };
};

// Provide a way to check if the hook is installed
module.exports.isInstalled = true;