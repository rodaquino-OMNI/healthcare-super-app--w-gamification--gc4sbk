#!/usr/bin/env node

/**
 * TypeScript SDK integration with Yarn's Plug'n'Play mode
 * 
 * This file registers TypeScript with the Yarn PnP API, establishes correct module resolution
 * for path aliases, and configures the language service to properly recognize shared packages.
 * 
 * It ensures that IDEs can provide accurate code navigation, auto-completion, and type checking
 * for TypeScript files across the monorepo, particularly for path aliases like @app/auth, 
 * @app/shared, and @austa/* packages.
 */

const { existsSync, readFileSync } = require('fs');
const { resolve, dirname, join } = require('path');
const { createRequire, createRequireFromPath } = require('module');

// Support for older Node.js versions
const createRequireImpl = createRequire || createRequireFromPath;
const requireFn = createRequireImpl(__filename);

// Find the project root directory (where the top-level package.json is located)
const findProjectRoot = () => {
  let currentDir = __dirname;
  
  while (currentDir !== '/') {
    const packageJsonPath = join(currentDir, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        
        // Check if this is the root package.json (has workspaces)
        if (packageJson.workspaces) {
          return currentDir;
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    currentDir = dirname(currentDir);
  }
  
  return process.cwd();
};

const projectRoot = findProjectRoot();
const webRoot = join(projectRoot, 'src', 'web');

// Get the Yarn PnP API
let pnpApi;

try {
  pnpApi = requireFn('pnpapi');
} catch {
  // The Plug'n'Play API might not be available in all environments
  // In this case, we fall back to the standard resolution
  console.warn('Yarn PnP API not available, falling back to standard resolution');
}

// Load TypeScript
const ts = requireFn('typescript');

// Patch TypeScript's module resolution
if (pnpApi) {
  // Save the original resolveModuleNames function
  const originalResolveModuleNames = ts.resolveModuleNames;
  
  // Override the resolveModuleNames function to use PnP resolution
  ts.resolveModuleNames = function(moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile) {
    // First try to resolve using the original function
    const originalResult = originalResolveModuleNames.call(ts, moduleNames, containingFile, reusedNames, redirectedReference, options, containingSourceFile);
    
    // For any modules that couldn't be resolved, try using PnP
    return moduleNames.map((moduleName, index) => {
      if (originalResult[index]) {
        return originalResult[index];
      }
      
      // Handle path aliases (@app/*, @austa/*, etc.)
      if (moduleName.startsWith('@')) {
        // Special handling for the new packages
        if (
          moduleName.startsWith('@austa/design-system') ||
          moduleName.startsWith('@austa/interfaces') ||
          moduleName.startsWith('@austa/journey-context') ||
          moduleName.startsWith('@design-system/primitives')
        ) {
          try {
            // Extract the package name and subpath
            const [, scope, name, ...subPathParts] = moduleName.split('/');
            const packageName = `@${scope}/${name}`;
            const subPath = subPathParts.join('/');
            
            // Map to the actual package location
            let packagePath;
            
            switch (packageName) {
              case '@austa/design-system':
                packagePath = join(webRoot, 'design-system');
                break;
              case '@austa/interfaces':
                packagePath = join(webRoot, 'interfaces');
                break;
              case '@austa/journey-context':
                packagePath = join(webRoot, 'journey-context');
                break;
              case '@design-system/primitives':
                packagePath = join(webRoot, 'primitives');
                break;
              default:
                return undefined;
            }
            
            // Resolve to the actual file
            const resolvedPath = subPath ? join(packagePath, 'src', subPath) : join(packagePath, 'src');
            
            if (existsSync(resolvedPath)) {
              return {
                resolvedFileName: resolvedPath,
                isExternalLibraryImport: false,
                extension: ts.Extension.Ts
              };
            }
            
            // Try with .ts, .tsx, .d.ts extensions
            const extensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx'];
            
            for (const ext of extensions) {
              const pathWithExt = `${resolvedPath}${ext}`;
              
              if (existsSync(pathWithExt)) {
                return {
                  resolvedFileName: pathWithExt,
                  isExternalLibraryImport: false,
                  extension: ext === '.ts' ? ts.Extension.Ts : 
                             ext === '.tsx' ? ts.Extension.Tsx : 
                             ext === '.d.ts' ? ts.Extension.Dts : 
                             ext === '.js' ? ts.Extension.Js : 
                             ts.Extension.Jsx
                };
              }
            }
          } catch (e) {
            console.error(`Error resolving module ${moduleName}:`, e);
          }
        }
        
        // Handle other path aliases from tsconfig.json
        try {
          // Try to resolve using PnP API
          const resolution = pnpApi.resolveRequest(moduleName, containingFile, { extensions: ['.ts', '.tsx', '.d.ts', '.js', '.jsx'] });
          
          if (resolution) {
            const extension = resolution.endsWith('.ts') ? ts.Extension.Ts : 
                             resolution.endsWith('.tsx') ? ts.Extension.Tsx : 
                             resolution.endsWith('.d.ts') ? ts.Extension.Dts : 
                             resolution.endsWith('.js') ? ts.Extension.Js : 
                             resolution.endsWith('.jsx') ? ts.Extension.Jsx : 
                             ts.Extension.Ts;
            
            return {
              resolvedFileName: resolution,
              isExternalLibraryImport: false,
              extension
            };
          }
        } catch (e) {
          // PnP resolution failed, continue with other strategies
        }
      }
      
      // For non-alias imports, try standard Node resolution
      try {
        const resolution = requireFn.resolve(moduleName, { paths: [dirname(containingFile)] });
        
        if (resolution) {
          const extension = resolution.endsWith('.ts') ? ts.Extension.Ts : 
                           resolution.endsWith('.tsx') ? ts.Extension.Tsx : 
                           resolution.endsWith('.d.ts') ? ts.Extension.Dts : 
                           resolution.endsWith('.js') ? ts.Extension.Js : 
                           resolution.endsWith('.jsx') ? ts.Extension.Jsx : 
                           ts.Extension.Ts;
          
          return {
            resolvedFileName: resolution,
            isExternalLibraryImport: true,
            extension
          };
        }
      } catch (e) {
        // Node resolution failed
      }
      
      // Module couldn't be resolved
      return undefined;
    });
  };
  
  // Patch TypeScript's file existence check
  const originalFileExists = ts.sys.fileExists;
  ts.sys.fileExists = function(path) {
    // First try the original function
    if (originalFileExists.call(ts.sys, path)) {
      return true;
    }
    
    // If the file doesn't exist normally, try to resolve it through PnP
    try {
      // Check if this is a path within our monorepo packages
      if (path.includes('node_modules') || path.includes('@austa/') || path.includes('@design-system/')) {
        const resolved = pnpApi.resolveRequest(path, null, { considerBuiltins: false });
        return resolved ? originalFileExists.call(ts.sys, resolved) : false;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  };
  
  // Patch TypeScript's directory existence check
  const originalDirectoryExists = ts.sys.directoryExists;
  ts.sys.directoryExists = function(path) {
    // First try the original function
    if (originalDirectoryExists.call(ts.sys, path)) {
      return true;
    }
    
    // Special handling for our monorepo packages
    if (path.includes('@austa/') || path.includes('@design-system/')) {
      // Map virtual paths to actual paths
      if (path.includes('@austa/design-system')) {
        const mappedPath = path.replace(/@austa\/design-system/, join(webRoot, 'design-system/src'));
        return originalDirectoryExists.call(ts.sys, mappedPath);
      }
      
      if (path.includes('@austa/interfaces')) {
        const mappedPath = path.replace(/@austa\/interfaces/, join(webRoot, 'interfaces/src'));
        return originalDirectoryExists.call(ts.sys, mappedPath);
      }
      
      if (path.includes('@austa/journey-context')) {
        const mappedPath = path.replace(/@austa\/journey-context/, join(webRoot, 'journey-context/src'));
        return originalDirectoryExists.call(ts.sys, mappedPath);
      }
      
      if (path.includes('@design-system/primitives')) {
        const mappedPath = path.replace(/@design-system\/primitives/, join(webRoot, 'primitives/src'));
        return originalDirectoryExists.call(ts.sys, mappedPath);
      }
    }
    
    return false;
  };
  
  // Patch TypeScript's readDirectory function
  const originalReadDirectory = ts.sys.readDirectory;
  ts.sys.readDirectory = function(path, extensions, exclude, include, depth) {
    // First try the original function
    try {
      const originalResult = originalReadDirectory.call(ts.sys, path, extensions, exclude, include, depth);
      if (originalResult.length > 0) {
        return originalResult;
      }
    } catch (e) {
      // Ignore errors from the original function
    }
    
    // Special handling for our monorepo packages
    if (path.includes('@austa/') || path.includes('@design-system/')) {
      let mappedPath = path;
      
      // Map virtual paths to actual paths
      if (path.includes('@austa/design-system')) {
        mappedPath = path.replace(/@austa\/design-system/, join(webRoot, 'design-system/src'));
      } else if (path.includes('@austa/interfaces')) {
        mappedPath = path.replace(/@austa\/interfaces/, join(webRoot, 'interfaces/src'));
      } else if (path.includes('@austa/journey-context')) {
        mappedPath = path.replace(/@austa\/journey-context/, join(webRoot, 'journey-context/src'));
      } else if (path.includes('@design-system/primitives')) {
        mappedPath = path.replace(/@design-system\/primitives/, join(webRoot, 'primitives/src'));
      }
      
      try {
        return originalReadDirectory.call(ts.sys, mappedPath, extensions, exclude, include, depth);
      } catch (e) {
        // Ignore errors
      }
    }
    
    return [];
  };
  
  // Configure TypeScript language service plugins
  const projectService = ts.server?.ProjectService;
  
  if (projectService) {
    const { configurePlugin } = projectService.prototype;
    
    projectService.prototype.configurePlugin = function(pluginName, configuration) {
      // Add additional configuration for path mapping plugin if it exists
      if (pluginName === 'typescript-plugin-path-mapping') {
        const pathMappingConfig = configuration || {};
        
        // Add our package mappings
        pathMappingConfig.paths = pathMappingConfig.paths || {};
        
        // Add mappings for our new packages
        pathMappingConfig.paths['@austa/design-system'] = [join(webRoot, 'design-system/src')];
        pathMappingConfig.paths['@austa/design-system/*'] = [join(webRoot, 'design-system/src/*')];
        
        pathMappingConfig.paths['@design-system/primitives'] = [join(webRoot, 'primitives/src')];
        pathMappingConfig.paths['@design-system/primitives/*'] = [join(webRoot, 'primitives/src/*')];
        
        pathMappingConfig.paths['@austa/interfaces'] = [join(webRoot, 'interfaces/src')];
        pathMappingConfig.paths['@austa/interfaces/*'] = [join(webRoot, 'interfaces/src/*')];
        
        pathMappingConfig.paths['@austa/journey-context'] = [join(webRoot, 'journey-context/src')];
        pathMappingConfig.paths['@austa/journey-context/*'] = [join(webRoot, 'journey-context/src/*')];
        
        configuration = pathMappingConfig;
      }
      
      return configurePlugin.call(this, pluginName, configuration);
    };
  }
}

// Export the patched TypeScript module
module.exports = ts;