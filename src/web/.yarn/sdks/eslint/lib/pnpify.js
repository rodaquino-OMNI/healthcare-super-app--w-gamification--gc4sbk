#!/usr/bin/env node

/**
 * @license
 * MIT License
 *
 * Copyright (c) 2019-present Yarn Contributors
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
 * This script is designed to be used as a wrapper for ESLint when using Yarn PnP.
 * It ensures that ESLint can properly resolve dependencies in a PnP environment.
 */

'use strict';

// Setup PnP resolution
require('pnpapi');

const path = require('path');
const Module = require('module');

// Store the original Module._resolveFilename method
const originalResolveFilename = Module._resolveFilename;

// Create a custom resolver for ESLint
Module._resolveFilename = function(request, parent, isMain, options) {
  // Handle special cases for ESLint plugin resolution
  if (request.startsWith('eslint-plugin-') || 
      request.startsWith('@') && request.includes('/eslint-plugin-') ||
      request.startsWith('eslint-config-') ||
      request.startsWith('@') && request.includes('/eslint-config-')) {
    try {
      // Try to resolve using the PnP API
      return originalResolveFilename.call(this, request, parent, isMain, options);
    } catch (error) {
      // If the plugin is not found in the direct dependencies, try to find it in the workspace
      try {
        // Get the PnP API
        const pnp = require('pnpapi');
        
        // Try to resolve from the project root
        const projectRoot = pnp.getPackageInformation(pnp.topLevel).packageLocation;
        const moduleParent = { filename: path.join(projectRoot, 'package.json') };
        
        return originalResolveFilename.call(this, request, moduleParent, isMain, options);
      } catch (workspaceError) {
        // Re-throw the original error if we can't resolve from the workspace
        throw error;
      }
    }
  }
  
  // Handle ESLint's internal modules and API
  if (request === 'eslint' || request.startsWith('eslint/')) {
    try {
      return originalResolveFilename.call(this, request, parent, isMain, options);
    } catch (error) {
      // Special handling for ESLint's API module which is required by the VSCode extension
      if (request === 'eslint/lib/api.js') {
        try {
          // Try to resolve the ESLint package first
          const eslintPath = originalResolveFilename.call(this, 'eslint', parent, isMain, options);
          // Then resolve the API file relative to the ESLint package
          const eslintDir = path.dirname(eslintPath);
          return path.join(eslintDir, 'lib', 'api.js');
        } catch (apiError) {
          throw error;
        }
      }
      throw error;
    }
  }
  
  // For all other requests, use the original resolver
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Support for ESLint's flat config format
const fs = require('fs');
const originalReadFileSync = fs.readFileSync;

// Patch fs.readFileSync to handle ESLint's flat config files
fs.readFileSync = function(path, options) {
  try {
    return originalReadFileSync.call(this, path, options);
  } catch (error) {
    // If the file is not found and it's an ESLint config file, try to resolve it using PnP
    if (error.code === 'ENOENT' && 
        (path.endsWith('eslint.config.js') || path.endsWith('eslint.config.mjs'))) {
      try {
        const pnp = require('pnpapi');
        const projectRoot = pnp.getPackageInformation(pnp.topLevel).packageLocation;
        const alternativePath = path.replace(/^.*[\\\/]/, projectRoot);
        
        return originalReadFileSync.call(this, alternativePath, options);
      } catch (pnpError) {
        throw error;
      }
    }
    throw error;
  }
};

// Handle the case where ESLint is invoked directly
if (require.main === module) {
  // Find the ESLint CLI path
  const eslintCliPath = require.resolve('eslint/bin/eslint.js');
  
  // Execute the ESLint CLI with the current process arguments
  require(eslintCliPath);
} else {
  // This file is being required as a module, not executed directly
  module.exports = {};
}