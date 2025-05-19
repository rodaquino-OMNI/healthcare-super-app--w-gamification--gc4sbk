/**
 * ESLint resolver for Yarn Plug'n'Play environments
 *
 * This module translates standard Node.js require calls to PnP-compatible resolution paths,
 * ensuring that ESLint can correctly locate and load its dependencies in a Yarn PnP environment.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Try to detect if we're running in a PnP environment
let pnp;
try {
  pnp = require('pnpapi');
} catch (error) {
  // Not in a PnP environment, or PnP API not available
}

/**
 * Resolves a module request in a Yarn PnP environment
 * 
 * @param {string} moduleName - The name of the module to resolve
 * @param {string} [basedir] - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolveModule(moduleName, basedir) {
  if (!basedir) {
    basedir = process.cwd();
  }

  try {
    // If we're in a PnP environment, use the PnP API to resolve the module
    if (pnp) {
      return pnp.resolveRequest(moduleName, basedir + '/');
    }

    // Fallback to standard Node.js resolution
    return require.resolve(moduleName, { paths: [basedir] });
  } catch (error) {
    // Module not found
    return null;
  }
}

/**
 * Resolves an ESLint plugin
 * 
 * @param {string} pluginName - The name of the plugin to resolve
 * @param {string} [basedir] - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolveESLintPlugin(pluginName, basedir) {
  // Handle scoped plugins (e.g., @typescript-eslint/eslint-plugin)
  if (pluginName.startsWith('@')) {
    const [scope, name] = pluginName.split('/');
    return resolveModule(`${scope}/eslint-plugin-${name}`, basedir) ||
           resolveModule(pluginName, basedir);
  }

  // Handle regular plugins (e.g., eslint-plugin-react)
  return resolveModule(`eslint-plugin-${pluginName}`, basedir) ||
         resolveModule(pluginName, basedir);
}

/**
 * Resolves an ESLint config
 * 
 * @param {string} configName - The name of the config to resolve
 * @param {string} [basedir] - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolveESLintConfig(configName, basedir) {
  // Handle scoped configs (e.g., @company/eslint-config)
  if (configName.startsWith('@')) {
    const [scope, name] = configName.split('/');
    return resolveModule(`${scope}/eslint-config-${name}`, basedir) ||
           resolveModule(`${scope}/eslint-config`, basedir) ||
           resolveModule(configName, basedir);
  }

  // Handle regular configs (e.g., eslint-config-airbnb)
  return resolveModule(`eslint-config-${configName}`, basedir) ||
         resolveModule(configName, basedir);
}

/**
 * Resolves an ESLint parser
 * 
 * @param {string} parserName - The name of the parser to resolve
 * @param {string} [basedir] - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolveESLintParser(parserName, basedir) {
  // Handle scoped parsers (e.g., @typescript-eslint/parser)
  if (parserName.startsWith('@')) {
    const [scope, name] = parserName.split('/');
    return resolveModule(`${scope}/eslint-parser-${name}`, basedir) ||
           resolveModule(parserName, basedir);
  }

  // Handle regular parsers (e.g., babel-eslint)
  return resolveModule(`eslint-parser-${parserName}`, basedir) ||
         resolveModule(parserName, basedir);
}

/**
 * Resolves a path alias in a monorepo environment
 * 
 * @param {string} source - The source path to resolve
 * @param {string} [basedir] - The directory to resolve from
 * @returns {string|null} The resolved path or null if not found
 */
function resolvePathAlias(source, basedir) {
  if (!basedir) {
    basedir = process.cwd();
  }

  // Handle path aliases (e.g., @app/shared, @austa/*)
  if (source.startsWith('@app/') || source.startsWith('@austa/')) {
    // Try to resolve from the monorepo root
    const parts = source.split('/');
    const scope = parts[0];
    const packageName = parts[1];
    const remainingPath = parts.slice(2).join('/');

    // Try to resolve from src/web or src/backend based on the scope
    let basePaths = [];
    if (scope === '@app') {
      basePaths = [
        path.resolve(process.cwd(), 'src/web'),
        path.resolve(process.cwd(), 'src/backend')
      ];
    } else if (scope === '@austa') {
      basePaths = [
        path.resolve(process.cwd(), 'src/web'),
        path.resolve(process.cwd(), 'src/backend/packages')
      ];
    }

    for (const basePath of basePaths) {
      const potentialPath = path.join(basePath, packageName, remainingPath);
      if (fs.existsSync(potentialPath)) {
        return potentialPath;
      }

      // Try with index.js, index.ts, etc.
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
      for (const ext of extensions) {
        const potentialPathWithExt = `${potentialPath}${ext}`;
        if (fs.existsSync(potentialPathWithExt)) {
          return potentialPathWithExt;
        }
      }
    }
  }

  return null;
}

/**
 * Main resolver function that handles all ESLint resolution types
 * 
 * @param {string} source - The source to resolve
 * @param {string} file - The file containing the request
 * @returns {string|null} The resolved path or null if not found
 */
function resolve(source, file) {
  const basedir = path.dirname(file);

  // Handle relative paths
  if (source.startsWith('./') || source.startsWith('../')) {
    const resolvedPath = path.resolve(basedir, source);
    return fs.existsSync(resolvedPath) ? resolvedPath : null;
  }

  // Handle absolute paths
  if (path.isAbsolute(source)) {
    return fs.existsSync(source) ? source : null;
  }

  // Handle path aliases
  const aliasPath = resolvePathAlias(source, basedir);
  if (aliasPath) {
    return aliasPath;
  }

  // Handle ESLint plugins
  if (source.startsWith('eslint-plugin-') || source.startsWith('@') && source.includes('/eslint-plugin')) {
    return resolveModule(source, basedir);
  }

  // Handle ESLint configs
  if (source.startsWith('eslint-config-') || source.startsWith('@') && source.includes('/eslint-config')) {
    return resolveModule(source, basedir);
  }

  // Handle ESLint parsers
  if (source.startsWith('eslint-parser-') || source.startsWith('@') && source.includes('/parser')) {
    return resolveModule(source, basedir);
  }

  // Handle other ESLint dependencies
  return resolveModule(source, basedir);
}

/**
 * Interface for ESLint's resolver
 */
module.exports = {
  interfaceVersion: 2,
  resolve: resolve,
  resolvePlugin: resolveESLintPlugin,
  resolveConfig: resolveESLintConfig,
  resolveParser: resolveESLintParser
};