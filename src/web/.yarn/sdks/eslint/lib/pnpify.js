#!/usr/bin/env node

/**
 * pnpify.js - ESLint PnP Integration
 * 
 * This utility transforms ESLint's Node.js-based module resolution to work with Yarn's Plug'n'Play system.
 * It handles virtual file paths and ensures dependencies in workspace packages are correctly resolved during linting.
 */

const fs = require('fs');
const path = require('path');

// Ensure the PnP API is available
let pnp;
try {
  pnp = require('pnpapi');
} catch (error) {
  console.error('Error: This script must be run in a Yarn PnP environment.');
  console.error('Please ensure you\'re using Yarn with Plug\'n\'Play enabled.');
  process.exit(1);
}

/**
 * Resolves a module using the PnP API
 * @param {string} request - The module to resolve
 * @param {string} issuer - The file requesting the module
 * @returns {string} The resolved module path
 */
function resolveModuleWithPnP(request, issuer) {
  try {
    return pnp.resolveRequest(request, issuer);
  } catch (error) {
    // Handle resolution failures gracefully
    return null;
  }
}

/**
 * Translates a virtual file path to a physical file path
 * @param {string} virtualPath - The virtual file path
 * @returns {string} The physical file path
 */
function translateVirtualPath(virtualPath) {
  if (!virtualPath || !virtualPath.includes('__virtual__')) {
    return virtualPath;
  }

  try {
    // Extract the package information from the virtual path
    const [, packageName, packageVersion] = virtualPath.match(/\/\$\$virtual\/([^/]+)-([^/]+)/);
    
    // Find the package location using the PnP API
    const locator = { name: packageName, reference: packageVersion };
    const info = pnp.getPackageInformation(locator);
    
    if (!info) {
      return virtualPath;
    }
    
    // Replace the virtual path with the physical path
    const physicalPath = virtualPath.replace(/\/\$\$virtual\/[^/]+-[^/]+/, info.packageLocation);
    return physicalPath;
  } catch (error) {
    // If anything goes wrong, return the original path
    return virtualPath;
  }
}

/**
 * Checks if a path is within a workspace package
 * @param {string} filePath - The file path to check
 * @returns {Object|null} The workspace information or null
 */
function getWorkspaceInfo(filePath) {
  if (!filePath) {
    return null;
  }

  try {
    const locator = pnp.findPackageLocator(filePath);
    if (!locator) {
      return null;
    }

    const info = pnp.getPackageInformation(locator);
    return {
      locator,
      info,
      location: info.packageLocation,
      name: locator.name,
      version: locator.reference
    };
  } catch (error) {
    return null;
  }
}

/**
 * Resolves ESLint plugins in a PnP environment
 * @param {string} pluginName - The name of the plugin to resolve
 * @param {string} issuer - The file requesting the plugin
 * @returns {string} The resolved plugin path
 */
function resolveESLintPlugin(pluginName, issuer) {
  // Handle scoped packages
  const fullPluginName = pluginName.startsWith('@') ? pluginName : `eslint-plugin-${pluginName}`;
  
  // Try to resolve the plugin
  const resolvedPath = resolveModuleWithPnP(fullPluginName, issuer);
  if (resolvedPath) {
    return resolvedPath;
  }
  
  // If resolution fails, try to find it in the workspace
  const workspaceInfo = getWorkspaceInfo(issuer);
  if (workspaceInfo) {
    // Check if the plugin is a dependency of the workspace
    const { packageDependencies } = workspaceInfo.info;
    if (packageDependencies.has(fullPluginName)) {
      const reference = packageDependencies.get(fullPluginName);
      if (reference !== null) {
        const pluginLocator = { name: fullPluginName, reference };
        const pluginInfo = pnp.getPackageInformation(pluginLocator);
        if (pluginInfo) {
          return path.join(pluginInfo.packageLocation, 'index.js');
        }
      }
    }
  }
  
  // If all else fails, return null
  return null;
}

/**
 * Resolves ESLint configuration files in a PnP environment
 * @param {string} configPath - The path to the configuration file
 * @param {string} issuer - The file requesting the configuration
 * @returns {string} The resolved configuration path
 */
function resolveESLintConfig(configPath, issuer) {
  // If the config path is absolute, use it directly
  if (path.isAbsolute(configPath)) {
    return configPath;
  }
  
  // If the config path is relative, resolve it relative to the issuer
  if (configPath.startsWith('./') || configPath.startsWith('../')) {
    return path.resolve(path.dirname(issuer), configPath);
  }
  
  // Otherwise, try to resolve it as a module
  return resolveModuleWithPnP(configPath, issuer);
}

/**
 * Resolves ESLint configuration extends in a PnP environment
 * @param {string} extendName - The name of the config to extend
 * @param {string} issuer - The file requesting the extension
 * @returns {string} The resolved extension path
 */
function resolveESLintExtends(extendName, issuer) {
  // Handle scoped packages and eslint-config prefix
  let fullExtendName = extendName;
  if (!extendName.startsWith('@') && !extendName.startsWith('eslint-config-')) {
    fullExtendName = `eslint-config-${extendName}`;
  }
  
  // Try to resolve the extension
  return resolveModuleWithPnP(fullExtendName, issuer);
}

/**
 * Resolves a file path in a PnP environment, handling both virtual and physical paths
 * @param {string} filePath - The file path to resolve
 * @returns {string} The resolved file path
 */
function resolveFilePath(filePath) {
  // Translate virtual paths to physical paths
  const physicalPath = translateVirtualPath(filePath);
  
  // Check if the file exists
  try {
    fs.statSync(physicalPath);
    return physicalPath;
  } catch (error) {
    // If the file doesn't exist, return the original path
    return filePath;
  }
}

/**
 * Resolves a module in the new monorepo structure
 * @param {string} request - The module to resolve
 * @param {string} issuer - The file requesting the module
 * @returns {string|null} The resolved module path or null
 */
function resolveMonorepoModule(request, issuer) {
  // Handle @austa/* packages
  if (request.startsWith('@austa/')) {
    const packageName = request.split('/')[1];
    const knownPackages = ['design-system', 'interfaces', 'journey-context'];
    
    if (knownPackages.includes(packageName)) {
      // Try to resolve from the monorepo structure
      try {
        const monorepoPath = path.join(process.cwd(), 'src/web', packageName);
        if (fs.existsSync(monorepoPath)) {
          return monorepoPath;
        }
      } catch (error) {
        // Ignore errors and continue with normal resolution
      }
    }
  }
  
  // Handle @design-system/primitives package
  if (request === '@design-system/primitives') {
    try {
      const primitivesPath = path.join(process.cwd(), 'src/web/primitives');
      if (fs.existsSync(primitivesPath)) {
        return primitivesPath;
      }
    } catch (error) {
      // Ignore errors and continue with normal resolution
    }
  }
  
  // Fall back to standard PnP resolution
  return resolveModuleWithPnP(request, issuer);
}

/**
 * Patches ESLint's module resolution to work with PnP
 */
function patchESLint() {
  // Save the original require function
  const originalRequire = module.constructor.prototype.require;
  
  // Override the require function to handle ESLint-specific modules
  module.constructor.prototype.require = function(request) {
    // Get the path of the file making the require call
    const issuer = this.filename || process.cwd();
    
    // Handle ESLint-specific modules
    if (request === 'eslint/lib/cli-engine/config-array-factory') {
      const eslintPath = resolveModuleWithPnP('eslint', issuer);
      if (eslintPath) {
        try {
          // Try to load the module directly from ESLint
          return originalRequire.call(this, path.join(path.dirname(eslintPath), 'lib/cli-engine/config-array-factory'));
        } catch (error) {
          // If that fails, fall back to the original require
          return originalRequire.call(this, request);
        }
      }
    }
    
    // Handle ESLint plugins
    if (request.startsWith('eslint-plugin-') || (request.startsWith('@') && request.includes('/eslint-plugin-'))) {
      const resolvedPlugin = resolveESLintPlugin(request, issuer);
      if (resolvedPlugin) {
        return originalRequire.call(this, resolvedPlugin);
      }
    }
    
    // Handle ESLint configs
    if (request.startsWith('eslint-config-') || (request.startsWith('@') && request.includes('/eslint-config-'))) {
      const resolvedConfig = resolveESLintExtends(request, issuer);
      if (resolvedConfig) {
        return originalRequire.call(this, resolvedConfig);
      }
    }
    
    // Handle monorepo modules
    const resolvedMonorepo = resolveMonorepoModule(request, issuer);
    if (resolvedMonorepo) {
      return originalRequire.call(this, resolvedMonorepo);
    }
    
    // Fall back to the original require for all other modules
    return originalRequire.call(this, request);
  };
  
  // Patch path-related functions to handle virtual paths
  const originalResolveFilename = module.constructor._resolveFilename;
  module.constructor._resolveFilename = function(request, parent, isMain, options) {
    try {
      // Try to resolve using PnP first
      const resolvedPath = pnp.resolveRequest(request, parent.filename);
      return resolvedPath;
    } catch (error) {
      // If PnP resolution fails, fall back to the original implementation
      return originalResolveFilename.call(this, request, parent, isMain, options);
    }
  };
}

// Apply the patches
patchESLint();

// If this script is run directly, execute ESLint with the patched resolution
if (require.main === module) {
  // Find the ESLint CLI module
  const eslintCliPath = resolveModuleWithPnP('eslint/lib/cli', __filename);
  if (!eslintCliPath) {
    console.error('Error: Could not find ESLint CLI module.');
    process.exit(1);
  }
  
  // Execute ESLint with the patched resolution
  try {
    require(eslintCliPath).execute(process.argv);
  } catch (error) {
    console.error('Error executing ESLint:', error);
    process.exit(1);
  }
}

// Export utility functions for use by other modules
module.exports = {
  resolveModuleWithPnP,
  translateVirtualPath,
  getWorkspaceInfo,
  resolveESLintPlugin,
  resolveESLintConfig,
  resolveESLintExtends,
  resolveFilePath,
  resolveMonorepoModule,
  patchESLint
};