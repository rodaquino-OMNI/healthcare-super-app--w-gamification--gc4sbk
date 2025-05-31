/**
 * @license
 * MIT License
 *
 * Copyright (c) 2023-2025 AUSTA SuperApp
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * ESLint Hook for Yarn PnP
 *
 * This module hooks into ESLint's module resolution system to intercept and modify
 * module requests. It redirects ESLint's plugin and configuration lookups to use
 * Yarn's PnP resolution instead of Node's native require.
 *
 * This is essential for ensuring that ESLint correctly resolves packages like
 * @typescript-eslint/eslint-plugin and other plugins used in the monorepo.
 */

const path = require('path');
const fs = require('fs');

// Get the PnP API from the runtime
const pnp = require('pnpapi');

// Store the original Module._resolveFilename method
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

// Special packages that need custom handling
const SPECIAL_PACKAGES = new Set([
  // TypeScript-ESLint integration packages
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  '@typescript-eslint/typescript-estree',
  // Journey-specific packages
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context',
]);

// ESLint plugin prefix pattern
const ESLINT_PLUGIN_PREFIX = 'eslint-plugin-';
const ESLINT_CONFIG_PREFIX = 'eslint-config-';

/**
 * Checks if a request is for an ESLint plugin
 * @param {string} request - The module request string
 * @returns {boolean} True if the request is for an ESLint plugin
 */
function isESLintPlugin(request) {
  return request.startsWith(ESLINT_PLUGIN_PREFIX) || 
         request.startsWith('@') && request.includes(`/${ESLINT_PLUGIN_PREFIX}`);
}

/**
 * Checks if a request is for an ESLint config
 * @param {string} request - The module request string
 * @returns {boolean} True if the request is for an ESLint config
 */
function isESLintConfig(request) {
  return request.startsWith(ESLINT_CONFIG_PREFIX) || 
         request.startsWith('@') && request.includes(`/${ESLINT_CONFIG_PREFIX}`);
}

/**
 * Resolves a module request using Yarn PnP
 * @param {string} request - The module request string
 * @param {string} issuer - The path of the module making the request
 * @returns {string} The resolved module path
 */
function resolveWithPnP(request, issuer) {
  try {
    // Handle special case for ESLint plugins that might be referenced without the prefix
    if (!request.startsWith('@') && !request.startsWith('eslint-') && !request.includes('/')) {
      // Try to resolve with eslint-plugin- prefix first
      try {
        return pnp.resolveRequest(`${ESLINT_PLUGIN_PREFIX}${request}`, issuer);
      } catch (err) {
        // If that fails, try to resolve with eslint-config- prefix
        try {
          return pnp.resolveRequest(`${ESLINT_CONFIG_PREFIX}${request}`, issuer);
        } catch (configErr) {
          // If both fail, continue with the original request
        }
      }
    }
    
    // Use PnP to resolve the request
    return pnp.resolveRequest(request, issuer);
  } catch (error) {
    // If PnP resolution fails, try to handle special cases
    
    // For scoped packages, try resolving without the scope
    if (request.startsWith('@') && request.includes('/')) {
      const [scope, name] = request.split('/');
      try {
        // Try resolving just the name part
        return pnp.resolveRequest(name, issuer);
      } catch (err) {
        // If that fails, continue with error handling
      }
    }
    
    // For special packages, try alternative resolution strategies
    if (SPECIAL_PACKAGES.has(request)) {
      // Try to find the package in the workspace root
      try {
        const workspaceRoot = findWorkspaceRoot(issuer);
        const potentialPath = path.join(workspaceRoot, 'node_modules', request);
        if (fs.existsSync(potentialPath)) {
          return potentialPath;
        }
      } catch (err) {
        // If that fails, continue with error handling
      }
    }
    
    // If all resolution strategies fail, rethrow the original error
    throw error;
  }
}

/**
 * Finds the workspace root by traversing up the directory tree
 * @param {string} start - The starting directory path
 * @returns {string} The workspace root path
 */
function findWorkspaceRoot(start) {
  let current = start;
  while (current !== '/') {
    if (fs.existsSync(path.join(current, 'package.json'))) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(current, 'package.json'), 'utf8'));
        if (pkg.workspaces || pkg.private === true) {
          return current;
        }
      } catch (e) {
        // Ignore JSON parsing errors and continue searching
      }
    }
    current = path.dirname(current);
  }
  return start; // Default to the starting directory if no workspace root is found
}

/**
 * Monkey-patch Module._resolveFilename to intercept ESLint module resolution
 * @param {string} request - The module request string
 * @param {object} parent - The parent module
 * @param {boolean} isMain - Whether this is the main module
 * @param {object} options - Resolution options
 * @returns {string} The resolved module path
 */
Module._resolveFilename = function(request, parent, isMain, options) {
  // Get the issuer (the file making the request)
  const issuer = parent?.filename || process.cwd();
  
  // Check if this is an ESLint-related request that we should handle
  const isESLintRelated = 
    isESLintPlugin(request) || 
    isESLintConfig(request) || 
    SPECIAL_PACKAGES.has(request) ||
    // Handle TypeScript-ESLint integration
    (request.includes('@typescript-eslint') || request.includes('typescript-eslint'));
  
  if (isESLintRelated) {
    try {
      return resolveWithPnP(request, issuer);
    } catch (error) {
      // If our custom resolution fails, fall back to the original resolver
      // but log a warning for debugging purposes
      console.warn(`[eslint-hook] Failed to resolve ${request} with PnP, falling back to Node resolution:`, error.message);
    }
  }
  
  // For non-ESLint requests or if our resolution failed, use the original resolver
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Export the hook for potential programmatic usage
module.exports = {
  resolveWithPnP,
  findWorkspaceRoot,
  isESLintPlugin,
  isESLintConfig,
};