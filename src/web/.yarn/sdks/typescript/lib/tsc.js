#!/usr/bin/env node

/**
 * TypeScript Compiler integration for Yarn PnP
 * 
 * This file provides the TypeScript Compiler with proper module resolution
 * for the AUSTA SuperApp monorepo, ensuring that path aliases and package references
 * work correctly during compilation.
 */

const { existsSync } = require('fs');
const { resolve, dirname, join } = require('path');

// Get the path to the actual tsc.js from the typescript package
const tscPath = resolve(__dirname, '../node_modules/typescript/lib/tsc.js');

// If the tsc.js file exists, execute it with the patched resolution
if (existsSync(tscPath)) {
  // Load our patched TypeScript module
  require('../');
  
  // Execute the original tsc.js
  require(tscPath);
} else {
  // If we can't find the tsc.js file, try to resolve it through the PnP API
  try {
    const pnpApi = require('pnpapi');
    const resolvedTscPath = pnpApi.resolveRequest('typescript/lib/tsc.js', __filename);
    
    if (resolvedTscPath && existsSync(resolvedTscPath)) {
      // Load our patched TypeScript module
      require('../');
      
      // Execute the resolved tsc.js
      require(resolvedTscPath);
    } else {
      throw new Error('Could not find tsc.js');
    }
  } catch (e) {
    console.error('Failed to load TypeScript Compiler:', e.message);
    process.exit(1);
  }
}