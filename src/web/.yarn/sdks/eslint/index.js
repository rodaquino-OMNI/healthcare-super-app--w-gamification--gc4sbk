#!/usr/bin/env node

/**
 * ESLint SDK for Yarn Plug'n'Play
 *
 * This file provides a consistent interface for ESLint to work with the PnP module resolution system,
 * ensuring that ESLint can correctly resolve plugins and configurations in both IDE integrations and CI environments.
 * 
 * Without this file, ESLint would fail to resolve dependencies in a Yarn PnP environment,
 * which would break code linting in development and CI/CD pipelines.
 */

const {existsSync} = require('fs');
const {createRequire, findPnpApi} = require('module');
const {resolve, dirname} = require('path');

// Locate the nearest PnP API from the current file
const pnpApi = findPnpApi(__filename);

// If we couldn't find the PnP API, something is wrong with the setup
if (!pnpApi) {
  throw new Error(
    `Failed to locate the PnP API. This is likely because this file is being executed outside of a Yarn PnP environment.\n` +
    `Make sure you are using Yarn with PnP enabled and that this file is being executed within the project.`
  );
}

// Create a require function that's aware of the PnP environment
const pnpRequire = createRequire(__filename);

// Resolve the path to the actual ESLint package
let eslintPath;
try {
  // Attempt to resolve the ESLint package using the PnP API
  eslintPath = pnpApi.resolveRequest('eslint', __filename);
} catch (error) {
  throw new Error(
    `Failed to resolve the ESLint package. Make sure ESLint is installed as a dependency in your project.\n` +
    `Original error: ${error.message}`
  );
}

// Check if the resolved path exists
if (!existsSync(eslintPath)) {
  throw new Error(
    `The resolved ESLint path (${eslintPath}) does not exist. This might indicate an issue with your Yarn PnP setup.`
  );
}

// Create a require function specific to the ESLint package directory
const eslintRequire = createRequire(eslintPath);

// Determine the ESLint CLI path
let eslintCliPath;
try {
  // First try to resolve the modern ESLint CLI path (ESLint v8+)
  eslintCliPath = resolve(dirname(eslintPath), './bin/eslint.js');
  
  // If that doesn't exist, fall back to the legacy path
  if (!existsSync(eslintCliPath)) {
    eslintCliPath = resolve(dirname(eslintPath), './bin/eslint');
  }
  
  // If that still doesn't exist, try to resolve it through the package
  if (!existsSync(eslintCliPath)) {
    const eslintPkg = eslintRequire('./package.json');
    if (eslintPkg.bin && eslintPkg.bin.eslint) {
      eslintCliPath = resolve(dirname(eslintPath), eslintPkg.bin.eslint);
    }
  }
} catch (error) {
  throw new Error(
    `Failed to locate the ESLint CLI. This might indicate an incompatible ESLint version.\n` +
    `Original error: ${error.message}`
  );
}

// Check if the resolved CLI path exists
if (!existsSync(eslintCliPath)) {
  throw new Error(
    `The resolved ESLint CLI path (${eslintCliPath}) does not exist. This might indicate an incompatible ESLint version.`
  );
}

// Export a function that will properly set up the PnP environment and then execute ESLint
module.exports = {
  // Export the path to the ESLint CLI for tools that need to spawn ESLint as a child process
  eslintCliPath,
  
  // Export a function to run ESLint programmatically
  runESLint: (args = process.argv.slice(2)) => {
    // Ensure the PnP loader is properly set up
    require(pnpApi.resolveRequest('eslint', __filename));
    
    // Run ESLint with the provided arguments
    return eslintRequire(eslintCliPath).execute(args);
  },
  
  // Export a function to create an ESLint instance
  createESLint: (options = {}) => {
    // Ensure the PnP loader is properly set up
    const ESLint = eslintRequire('eslint').ESLint;
    
    // Create a new ESLint instance with the provided options
    return new ESLint(options);
  },
  
  // Export a function to resolve ESLint plugins and configs in a PnP-aware manner
  resolveESLintModule: (moduleName, relativeTo = __filename) => {
    try {
      return pnpApi.resolveRequest(moduleName, relativeTo);
    } catch (error) {
      // If the module is an ESLint plugin or config, try with the appropriate prefix
      if (moduleName.startsWith('eslint-plugin-') || 
          moduleName.startsWith('eslint-config-') ||
          moduleName.startsWith('@') && (
            moduleName.includes('/eslint-plugin-') ||
            moduleName.includes('/eslint-config-')
          )) {
        return pnpApi.resolveRequest(moduleName, relativeTo);
      }
      
      // Try with the eslint-plugin- prefix
      try {
        return pnpApi.resolveRequest(`eslint-plugin-${moduleName}`, relativeTo);
      } catch {}
      
      // Try with the eslint-config- prefix
      try {
        return pnpApi.resolveRequest(`eslint-config-${moduleName}`, relativeTo);
      } catch {}
      
      // Re-throw the original error if all resolution attempts fail
      throw error;
    }
  },
  
  // For compatibility with older versions of the ESLint extension
  // that might expect the default export to be the ESLint constructor
  get ESLint() {
    return eslintRequire('eslint').ESLint;
  },
  
  // For compatibility with tools that might expect to find the CLI engine
  get CLIEngine() {
    // Try to get the CLIEngine (deprecated in ESLint v8+)
    try {
      return eslintRequire('eslint').CLIEngine;
    } catch {
      // If CLIEngine is not available, provide a compatibility wrapper around ESLint
      const ESLint = eslintRequire('eslint').ESLint;
      
      // Create a minimal compatibility layer for tools expecting CLIEngine
      function CLIEngineCompat(options) {
        this._eslint = new ESLint(options);
      }
      
      CLIEngineCompat.prototype.executeOnText = async function(text, filePath, warnIgnored) {
        const results = await this._eslint.lintText(text, {
          filePath,
          warnIgnored
        });
        
        return {
          results,
          errorCount: results.reduce((count, result) => count + result.errorCount, 0),
          warningCount: results.reduce((count, result) => count + result.warningCount, 0)
        };
      };
      
      return CLIEngineCompat;
    }
  }
};

// If this file is being executed directly, run ESLint
if (require.main === module) {
  module.exports.runESLint();
}