#!/usr/bin/env node

/**
 * TypeScript Language Server integration for Yarn PnP
 * 
 * This file provides the TypeScript Language Server with proper module resolution
 * for the AUSTA SuperApp monorepo, ensuring that path aliases and package references
 * work correctly in IDEs and editors.
 */

const { existsSync } = require('fs');
const { resolve, dirname, join } = require('path');

// Get the path to the actual tsserver.js from the typescript package
const tsServerPath = resolve(__dirname, '../node_modules/typescript/lib/tsserver.js');

// If the tsserver.js file exists, execute it with the patched resolution
if (existsSync(tsServerPath)) {
  // Load our patched TypeScript module
  require('../');
  
  // Execute the original tsserver.js
  require(tsServerPath);
} else {
  // If we can't find the tsserver.js file, try to resolve it through the PnP API
  try {
    const pnpApi = require('pnpapi');
    const resolvedTsServerPath = pnpApi.resolveRequest('typescript/lib/tsserver.js', __filename);
    
    if (resolvedTsServerPath && existsSync(resolvedTsServerPath)) {
      // Load our patched TypeScript module
      require('../');
      
      // Execute the resolved tsserver.js
      require(resolvedTsServerPath);
    } else {
      throw new Error('Could not find tsserver.js');
    }
  } catch (e) {
    console.error('Failed to load TypeScript Language Server:', e.message);
    process.exit(1);
  }
}