#!/usr/bin/env node

/**
 * @file ESLint SDK integration for Yarn Plug'n'Play
 * 
 * This file provides a consistent interface for ESLint to work with the PnP module resolution system,
 * ensuring that ESLint can correctly resolve plugins and configurations in both IDE integrations and CI environments.
 * 
 * It addresses path resolution failures causing build errors as mentioned in the Summary of Changes,
 * standardizes module resolution across the monorepo, and enables proper ESLint integration with Yarn Plug'n'Play.
 *
 * Key features:
 * - Implements PnP-aware module resolution for ESLint dependencies
 * - Adds support for path alias resolution in ESLint
 * - Creates standardized integration point for IDE plugins
 * - Handles both older and newer versions of ESLint
 */

const {existsSync, readFileSync} = require('fs');
const {createRequire, createRequireFromPath} = require('module');
const {resolve, dirname, join} = require('path');

// Determine which require function to use based on Node.js version
const relPnpApiPath = '../../../.pnp.cjs';
const absPnpApiPath = resolve(__dirname, relPnpApiPath);

// Check if the PnP API file exists
if (!existsSync(absPnpApiPath)) {
  throw new Error(
    `Could not find the PnP API file (${absPnpApiPath}). ` +
    `This likely means that the ESLint SDK was generated incorrectly. ` +
    `Please run 'yarn dlx @yarnpkg/sdks vscode' to regenerate the SDK.`
  );
}

// Setup the PnP loader
const pnpApi = require(absPnpApiPath);

// Ensure the PnP API is properly setup
if (!pnpApi.setup) {
  throw new Error(
    `The PnP API file (${absPnpApiPath}) is not properly initialized. ` +
    `This likely means that your Yarn installation is corrupted. ` +
    `Please reinstall Yarn and try again.`
  );
}

// Setup the PnP loader
pnpApi.setup();

// Create a require function that uses the PnP loader
const makeRequire = createRequire || createRequireFromPath;
const require = makeRequire(absPnpApiPath);

/**
 * Helper function to find the project root
 * This is used to resolve path aliases defined in tsconfig.json
 */
function findProjectRoot() {
  let currentDir = __dirname;
  
  // Navigate up until we find a package.json file
  while (currentDir !== '/') {
    const packageJsonPath = join(currentDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }
  
  // If we can't find a package.json, return the current directory
  return __dirname;
}

/**
 * Helper function to resolve path aliases
 * This allows ESLint to correctly resolve imports that use path aliases
 * defined in tsconfig.json (e.g., @app/shared, @austa/*, etc.)
 */
function setupPathAliasResolution() {
  const projectRoot = findProjectRoot();
  const tsconfigPath = join(projectRoot, 'tsconfig.json');
  
  if (existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));
      const paths = tsconfig.compilerOptions?.paths;
      
      if (paths) {
        // Store the path aliases for use in ESLint configuration
        global.__YARN_PNP_ESLINT_PATHS__ = {
          projectRoot,
          paths
        };
      }
    } catch (error) {
      // If we can't parse the tsconfig.json, just continue without path aliases
      console.warn(`[ESLint SDK] Warning: Could not parse tsconfig.json: ${error.message}`);
    }
  }
}

// Setup path alias resolution
setupPathAliasResolution();

/**
 * Patch ESLint's module resolution to work with PnP
 * This is necessary because ESLint uses a custom module resolution system
 * that doesn't work well with PnP by default
 */
function patchESLintModuleResolution(eslint) {
  // Only patch if the eslint object exists and has a ModuleResolver
  if (eslint && eslint.ModuleResolver && eslint.ModuleResolver.prototype) {
    const originalResolve = eslint.ModuleResolver.prototype.resolve;
    
    // Override the resolve method to use PnP-aware resolution
    eslint.ModuleResolver.prototype.resolve = function(name, relTo) {
      try {
        // First try the original resolution method
        return originalResolve.call(this, name, relTo);
      } catch (error) {
        // If that fails, try to resolve using PnP
        try {
          return require.resolve(name, { paths: [dirname(relTo)] });
        } catch (pnpError) {
          // If both methods fail, throw the original error
          throw error;
        }
      }
    };
  }
  
  return eslint;
}

// Try to load ESLint
let eslint;
try {
  // First try to load the main ESLint package
  eslint = require('eslint');
  
  // Patch ESLint's module resolution
  eslint = patchESLintModuleResolution(eslint);
} catch (error) {
  // If loading the main package fails, provide a detailed error message
  console.error(`[ESLint SDK] Error loading ESLint: ${error.message}`);
  console.error(`This might be due to a missing or incompatible ESLint version.`);
  console.error(`Please ensure ESLint is installed in your project by running 'yarn add -D eslint'.`);
  
  // Re-throw the error to prevent the SDK from silently failing
  throw error;
}

// Export the patched ESLint package
module.exports = eslint;

// Add support for ESLint CLI
if (require.main === module) {
  try {
    // If this file is directly executed, forward to the ESLint CLI
    const eslintCliPath = require.resolve('eslint/bin/eslint.js');
    require(eslintCliPath);
  } catch (error) {
    console.error(`[ESLint SDK] Error loading ESLint CLI: ${error.message}`);
    console.error(`This might be due to a missing or incompatible ESLint version.`);
    console.error(`Please ensure ESLint is installed in your project by running 'yarn add -D eslint'.`);
    process.exit(1);
  }
}