#!/usr/bin/env node

/**
 * pnpify.js - TypeScript Module Resolution for Yarn PnP
 * 
 * This utility enhances TypeScript's module resolution to work with Yarn's Plug'n'Play mode.
 * It provides the core functionality to translate between TypeScript's module resolution system
 * and PnP's virtual file paths, ensuring that dependencies in node_modules and workspace packages
 * are correctly resolved.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Check if we're running in a PnP environment
const isPnpEnabled = () => {
  try {
    return !!require('pnpapi');
  } catch (error) {
    return false;
  }
};

// Get the PnP API if available
const getPnpApi = () => {
  try {
    return require('pnpapi');
  } catch (error) {
    return null;
  }
};

/**
 * Resolves a module name using the PnP API
 */
const resolveModuleName = (moduleName, containingFile, compilerOptions, compilerHost, ts) => {
  // If PnP is not enabled, use TypeScript's default resolution
  if (!isPnpEnabled()) {
    return ts(moduleName, containingFile, compilerOptions, compilerHost);
  }

  const pnp = getPnpApi();
  if (!pnp) {
    return ts(moduleName, containingFile, compilerOptions, compilerHost);
  }

  try {
    // Handle special cases for the new packages in the monorepo structure
    if (
      moduleName === '@austa/design-system' ||
      moduleName === '@design-system/primitives' ||
      moduleName === '@austa/interfaces' ||
      moduleName === '@austa/journey-context' ||
      moduleName.startsWith('@austa/design-system/') ||
      moduleName.startsWith('@design-system/primitives/') ||
      moduleName.startsWith('@austa/interfaces/') ||
      moduleName.startsWith('@austa/journey-context/')
    ) {
      // Ensure these packages are resolved correctly in the monorepo
      const issuer = containingFile;
      const resolved = pnp.resolveRequest(moduleName, issuer, { considerBuiltins: false });
      
      if (resolved) {
        // Create a TypeScript-compatible resolution result
        return {
          resolvedModule: {
            resolvedFileName: resolved,
            isExternalLibraryImport: true
          }
        };
      }
    }

    // Standard module resolution using PnP
    const issuer = containingFile;
    const resolved = pnp.resolveRequest(moduleName, issuer, { considerBuiltins: false });

    if (!resolved) {
      // If PnP couldn't resolve it, try TypeScript's default resolution
      return ts(moduleName, containingFile, compilerOptions, compilerHost);
    }

    // Check if the resolved path exists
    if (!fs.existsSync(resolved)) {
      return ts(moduleName, containingFile, compilerOptions, compilerHost);
    }

    // Create a TypeScript-compatible resolution result
    return {
      resolvedModule: {
        resolvedFileName: resolved,
        isExternalLibraryImport: true
      }
    };
  } catch (error) {
    // Fallback to TypeScript's default resolution on error
    return ts(moduleName, containingFile, compilerOptions, compilerHost);
  }
};

/**
 * Resolves a type reference directive using the PnP API
 */
const resolveTypeReferenceDirective = (typeDirectiveName, containingFile, compilerOptions, compilerHost, ts) => {
  // If PnP is not enabled, use TypeScript's default resolution
  if (!isPnpEnabled()) {
    return ts(typeDirectiveName, containingFile, compilerOptions, compilerHost);
  }

  const pnp = getPnpApi();
  if (!pnp) {
    return ts(typeDirectiveName, containingFile, compilerOptions, compilerHost);
  }

  try {
    // Handle special cases for type definitions in the monorepo
    if (
      typeDirectiveName === '@austa/design-system' ||
      typeDirectiveName === '@design-system/primitives' ||
      typeDirectiveName === '@austa/interfaces' ||
      typeDirectiveName === '@austa/journey-context'
    ) {
      // Try to resolve the type definition file
      const typesPackage = `@types/${typeDirectiveName.replace(/^@/, '').replace(/\//g, '__')}`;
      const issuer = containingFile;
      
      // First try to resolve the types package
      let resolved = pnp.resolveRequest(typesPackage, issuer, { considerBuiltins: false });
      
      // If that fails, try to resolve the package itself (it might include its own types)
      if (!resolved) {
        resolved = pnp.resolveRequest(typeDirectiveName, issuer, { considerBuiltins: false });
      }
      
      if (resolved) {
        // Create a TypeScript-compatible resolution result
        return {
          resolvedTypeReferenceDirective: {
            resolvedFileName: resolved,
            primary: true
          }
        };
      }
    }

    // Standard type reference resolution using PnP
    let typePackageName = typeDirectiveName;
    
    // Handle scoped type packages
    if (typeDirectiveName.startsWith('@')) {
      const [scope, name] = typeDirectiveName.split('/');
      typePackageName = `@types/${scope.slice(1)}__${name}`;
    } else {
      typePackageName = `@types/${typeDirectiveName}`;
    }

    const issuer = containingFile;
    
    // Try to resolve the types package
    let resolved = pnp.resolveRequest(typePackageName, issuer, { considerBuiltins: false });
    
    // If that fails, try to resolve the package itself (it might include its own types)
    if (!resolved) {
      resolved = pnp.resolveRequest(typeDirectiveName, issuer, { considerBuiltins: false });
    }

    if (!resolved) {
      // If PnP couldn't resolve it, try TypeScript's default resolution
      return ts(typeDirectiveName, containingFile, compilerOptions, compilerHost);
    }

    // Check if the resolved path exists
    if (!fs.existsSync(resolved)) {
      return ts(typeDirectiveName, containingFile, compilerOptions, compilerHost);
    }

    // Create a TypeScript-compatible resolution result
    return {
      resolvedTypeReferenceDirective: {
        resolvedFileName: resolved,
        primary: true
      }
    };
  } catch (error) {
    // Fallback to TypeScript's default resolution on error
    return ts(typeDirectiveName, containingFile, compilerOptions, compilerHost);
  }
};

/**
 * Creates a virtual file system for TypeScript that works with PnP
 */
const createVirtualFileSystem = (ts) => {
  // If PnP is not enabled, return the default file system
  if (!isPnpEnabled()) {
    return ts.sys;
  }

  const pnp = getPnpApi();
  if (!pnp) {
    return ts.sys;
  }

  // Create a wrapper around the TypeScript file system
  const virtualFileSystem = Object.create(ts.sys);

  // Override file existence check to handle PnP virtual paths
  virtualFileSystem.fileExists = (filePath) => {
    try {
      // Check if the file is in a zip archive (PnP stores packages in zip files)
      if (filePath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.existsSync === 'function') {
          return pnp.fslib.existsSync(filePath);
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(filePath);
          if (realPath) {
            return ts.sys.fileExists(realPath);
          }
        }
      }
      
      // Fall back to the default implementation
      return ts.sys.fileExists(filePath);
    } catch (error) {
      return ts.sys.fileExists(filePath);
    }
  };

  // Override directory existence check to handle PnP virtual paths
  virtualFileSystem.directoryExists = (directoryPath) => {
    try {
      // Check if the directory is in a zip archive
      if (directoryPath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.existsSync === 'function') {
          return pnp.fslib.existsSync(directoryPath);
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(directoryPath);
          if (realPath) {
            return ts.sys.directoryExists(realPath);
          }
        }
      }
      
      // Fall back to the default implementation
      return ts.sys.directoryExists(directoryPath);
    } catch (error) {
      return ts.sys.directoryExists(directoryPath);
    }
  };

  // Override reading a directory to handle PnP virtual paths
  virtualFileSystem.readDirectory = (directoryPath, extensions, exclude, include, depth) => {
    try {
      // Check if the directory is in a zip archive
      if (directoryPath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.readdirSync === 'function') {
          const entries = pnp.fslib.readdirSync(directoryPath);
          // Filter entries based on extensions if provided
          if (extensions && extensions.length > 0) {
            return entries.filter(entry => {
              const ext = path.extname(entry).toLowerCase();
              return extensions.includes(ext);
            });
          }
          return entries;
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(directoryPath);
          if (realPath) {
            return ts.sys.readDirectory(realPath, extensions, exclude, include, depth);
          }
        }
      }
      
      // Fall back to the default implementation
      return ts.sys.readDirectory(directoryPath, extensions, exclude, include, depth);
    } catch (error) {
      return ts.sys.readDirectory(directoryPath, extensions, exclude, include, depth);
    }
  };

  // Override reading a file to handle PnP virtual paths
  virtualFileSystem.readFile = (filePath, encoding) => {
    try {
      // Check if the file is in a zip archive
      if (filePath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.readFileSync === 'function') {
          return pnp.fslib.readFileSync(filePath, encoding || 'utf8');
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(filePath);
          if (realPath) {
            return ts.sys.readFile(realPath, encoding);
          }
        }
      }
      
      // Fall back to the default implementation
      return ts.sys.readFile(filePath, encoding);
    } catch (error) {
      return ts.sys.readFile(filePath, encoding);
    }
  };

  return virtualFileSystem;
};

/**
 * Creates a TypeScript compiler host that works with PnP
 */
const createCompilerHost = (ts, compilerOptions) => {
  // Create the default compiler host
  const defaultHost = ts.createCompilerHost(compilerOptions);
  
  // If PnP is not enabled, return the default host
  if (!isPnpEnabled()) {
    return defaultHost;
  }

  const pnp = getPnpApi();
  if (!pnp) {
    return defaultHost;
  }

  // Create a wrapper around the default compiler host
  const pnpHost = Object.create(defaultHost);

  // Override file existence check to handle PnP virtual paths
  pnpHost.fileExists = (filePath) => {
    try {
      // Check if the file is in a zip archive
      if (filePath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.existsSync === 'function') {
          return pnp.fslib.existsSync(filePath);
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(filePath);
          if (realPath) {
            return defaultHost.fileExists(realPath);
          }
        }
      }
      
      // Fall back to the default implementation
      return defaultHost.fileExists(filePath);
    } catch (error) {
      return defaultHost.fileExists(filePath);
    }
  };

  // Override directory existence check to handle PnP virtual paths
  pnpHost.directoryExists = (directoryPath) => {
    try {
      // Check if the directory is in a zip archive
      if (directoryPath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.existsSync === 'function') {
          return pnp.fslib.existsSync(directoryPath);
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(directoryPath);
          if (realPath) {
            return defaultHost.directoryExists(realPath);
          }
        }
      }
      
      // Fall back to the default implementation
      return defaultHost.directoryExists(directoryPath);
    } catch (error) {
      return defaultHost.directoryExists(directoryPath);
    }
  };

  // Override reading a file to handle PnP virtual paths
  pnpHost.readFile = (filePath) => {
    try {
      // Check if the file is in a zip archive
      if (filePath.includes('.zip/')) {
        // Use PnP's file system extension if available
        if (pnp.fslib && typeof pnp.fslib.readFileSync === 'function') {
          return pnp.fslib.readFileSync(filePath, 'utf8');
        }
        
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(filePath);
          if (realPath) {
            return defaultHost.readFile(realPath);
          }
        }
      }
      
      // Fall back to the default implementation
      return defaultHost.readFile(filePath);
    } catch (error) {
      return defaultHost.readFile(filePath);
    }
  };

  // Override getting source file to handle PnP virtual paths
  pnpHost.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
    try {
      // Check if the file is in a zip archive
      if (fileName.includes('.zip/')) {
        // Try to resolve the real path
        if (pnp.resolveVirtual && typeof pnp.resolveVirtual === 'function') {
          const realPath = pnp.resolveVirtual(fileName);
          if (realPath) {
            return defaultHost.getSourceFile(realPath, languageVersion, onError, shouldCreateNewSourceFile);
          }
        }
        
        // If we can't resolve the real path, try to read the file directly
        if (pnp.fslib && typeof pnp.fslib.readFileSync === 'function') {
          const content = pnp.fslib.readFileSync(fileName, 'utf8');
          return ts.createSourceFile(fileName, content, languageVersion);
        }
      }
      
      // Fall back to the default implementation
      return defaultHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    } catch (error) {
      return defaultHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    }
  };

  // Override resolveModuleName to use our PnP-aware implementation
  pnpHost.resolveModuleNames = (moduleNames, containingFile, reusedNames, redirectedReference, options) => {
    return moduleNames.map(moduleName => {
      const result = resolveModuleName(
        moduleName,
        containingFile,
        options,
        pnpHost,
        (moduleName, containingFile, compilerOptions, compilerHost) => {
          return ts.resolveModuleName(moduleName, containingFile, compilerOptions, compilerHost).resolvedModule;
        }
      );
      return result.resolvedModule;
    });
  };

  // Override resolveTypeReferenceDirectives to use our PnP-aware implementation
  pnpHost.resolveTypeReferenceDirectives = (typeDirectiveNames, containingFile, redirectedReference, options) => {
    return typeDirectiveNames.map(typeDirectiveName => {
      const result = resolveTypeReferenceDirective(
        typeDirectiveName,
        containingFile,
        options,
        pnpHost,
        (typeDirectiveName, containingFile, compilerOptions, compilerHost) => {
          return ts.resolveTypeReferenceDirective(typeDirectiveName, containingFile, compilerOptions, compilerHost).resolvedTypeReferenceDirective;
        }
      );
      return result.resolvedTypeReferenceDirective;
    });
  };

  return pnpHost;
};

// Export the functions for use in TypeScript SDK
module.exports = {
  resolveModuleName,
  resolveTypeReferenceDirective,
  createVirtualFileSystem,
  createCompilerHost
};

// If this script is run directly, print usage information
if (require.main === module) {
  console.log('TypeScript PnP Module Resolution Utility');
  console.log('This script is meant to be used as a module by the TypeScript SDK.');
  console.log('It enhances TypeScript\'s module resolution to work with Yarn\'s Plug\'n\'Play mode.');
}