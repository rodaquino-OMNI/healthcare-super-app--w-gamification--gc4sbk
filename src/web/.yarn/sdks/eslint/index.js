#!/usr/bin/env node

const {existsSync} = require(`fs`);
const {createRequire, createRequireFromPath} = require(`module`);
const {resolve} = require(`path`);

const relPnpApiPath = "../../../../.pnp.cjs";

const absPnpApiPath = resolve(__dirname, relPnpApiPath);
const absRequire = (createRequire || createRequireFromPath)(absPnpApiPath);

if (existsSync(absPnpApiPath)) {
  if (!process.versions.pnp) {
    // Setup the environment to be able to require eslint
    require(absPnpApiPath).setup();
  }
}

// Prepare the module resolution cache
const moduleCache = {};

const pnpifyResolution = (request, issuer) => {
  const issuerModule = issuer ? require.resolve(issuer) : process.cwd();
  const resolvedPath = require.resolve(request, {paths: [issuerModule]});
  
  return resolvedPath;
};

// Patch the require function to ensure it uses our patched resolution
const originalRequire = module.constructor.prototype.require;
module.constructor.prototype.require = function(request) {
  // Check if the requested module is already in the cache
  const cacheKey = `${request}:${this.path}`;
  if (moduleCache[cacheKey]) {
    return moduleCache[cacheKey];
  }
  
  try {
    // Try to resolve the module using the original require
    return originalRequire.call(this, request);
  } catch (error) {
    // If the module cannot be resolved, try to resolve it using our patched resolution
    if (error.code === 'MODULE_NOT_FOUND') {
      try {
        const resolvedPath = pnpifyResolution(request, this.path);
        const result = originalRequire.call(this, resolvedPath);
        moduleCache[cacheKey] = result;
        return result;
      } catch (pnpError) {
        // If we still can't resolve the module, throw the original error
        throw error;
      }
    }
    throw error;
  }
};

// Expose the main ESLint API
module.exports = absRequire(`eslint`);

// Also expose the ESLint CLI
if (process.argv[1] === __filename) {
  require(`eslint/bin/eslint`);
}