/**
 * ===================================================================
 * DEPRECATED - DO NOT USE - HISTORICAL REFERENCE ONLY
 * ===================================================================
 * 
 * This script was previously used to configure TypeScript project references
 * across the monorepo but has been deprecated and replaced with rollback-tsconfig.js
 * that restores the original configuration.
 * 
 * This file is maintained solely for historical documentation purposes and
 * should not be executed in any environment.
 * 
 * Compatible with:
 * - Node.js ≥18.0.0
 * - TypeScript 5.3.3
 * ===================================================================
 */

/**
 * This script fixes tsconfig.json files across the monorepo to ensure
 * proper TypeScript project references configuration for composite builds
 * and standardized path resolution.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Starting TypeScript project references fix...');

// Define the services that need their tsconfig.json updated
const services = [
  'api-gateway',
  'auth-service',
  'care-service', 
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared'
];

// Base directory for the backend
const baseDir = path.resolve(__dirname, '../../');

// Function to update a tsconfig.json file
function updateTsconfig(servicePath) {
  const tsconfigPath = path.join(servicePath, 'tsconfig.json');
  
  console.log(`Processing ${tsconfigPath}...`);
  
  try {
    // Create a basic config that extends from the root
    const config = {
      "extends": "../tsconfig.json",
      "compilerOptions": {
        "outDir": "./dist",
        "baseUrl": ".",
        "composite": true,
        "rootDir": "src",
        "paths": {}
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
    };
    
    // Add a service-specific path alias
    const serviceName = path.basename(servicePath);
    // Convert serviceName to camelCase for the path mapping
    const pathKey = `@app/${serviceName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
    config.compilerOptions.paths[pathKey] = ["src/*"];
    
    // If it's not the shared module, add a reference to shared
    if (serviceName !== 'shared') {
      config.references = [{ "path": "../shared" }];
      
      // Add references to packages if needed
      if (['health-service', 'care-service', 'plan-service'].includes(serviceName)) {
        config.references.push({ "path": "../packages/interfaces/journey" });
      }
      
      if (serviceName === 'gamification-engine') {
        config.references.push({ "path": "../packages/interfaces/gamification" });
      }
    }
    
    // Write the updated config
    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2));
    console.log(`✅ Updated ${tsconfigPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating ${tsconfigPath}:`, error.message);
    return false;
  }
}

// Update root tsconfig.json
function updateRootTsconfig() {
  const rootTsconfigPath = path.join(baseDir, 'tsconfig.json');
  
  console.log(`Processing root ${rootTsconfigPath}...`);
  
  try {
    // Read the existing config
    const existingConfig = JSON.parse(fs.readFileSync(rootTsconfigPath, 'utf8'));
    
    // Update TypeScript compiler options for version 5.3.3
    existingConfig.compilerOptions = existingConfig.compilerOptions || {};
    existingConfig.compilerOptions.target = "ES2022";
    existingConfig.compilerOptions.module = "NodeNext";
    existingConfig.compilerOptions.moduleResolution = "NodeNext";
    existingConfig.compilerOptions.composite = true;
    
    // Add path mappings for all services and packages
    existingConfig.compilerOptions.paths = existingConfig.compilerOptions.paths || {};
    
    // Add service path mappings
    services.forEach(service => {
      // Convert service name to camelCase for the path mapping
      const pathKey = `@app/${service.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
      const pathValue = service === 'shared' 
        ? [`./shared/src/*`] 
        : [`./${service}/src/*`];
      
      existingConfig.compilerOptions.paths[pathKey] = pathValue;
    });
    
    // Add package path mappings
    existingConfig.compilerOptions.paths["@austa/*"] = ["./packages/*/src"];
    
    // Ensure it has the correct references to all services and packages
    existingConfig.references = [
      ...services.map(service => ({ path: `./${service}` })),
      { path: "./packages/interfaces" },
      { path: "./packages/database" },
      { path: "./packages/errors" },
      { path: "./packages/events" },
      { path: "./packages/logging" },
      { path: "./packages/tracing" },
      { path: "./packages/utils" },
      { path: "./packages/auth" }
    ];
    
    // Write the updated config
    fs.writeFileSync(rootTsconfigPath, JSON.stringify(existingConfig, null, 2));
    console.log(`✅ Updated root tsconfig.json`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error updating root tsconfig.json:`, error.message);
    return false;
  }
}

// Main execution
let success = updateRootTsconfig();

services.forEach(service => {
  const servicePath = path.join(baseDir, service);
  if (fs.existsSync(servicePath)) {
    const result = updateTsconfig(servicePath);
    success = success && result;
  } else {
    console.error(`❌ Service directory not found: ${servicePath}`);
    success = false;
  }
});

if (success) {
  console.log('🎉 TypeScript project references fixed successfully!');
  console.log('⚠️ You may need to restart your TypeScript server for changes to take effect.');
  console.log('⚠️ REMINDER: This script is deprecated and should not be used in production environments.');
} else {
  console.error('❌ There were errors fixing TypeScript project references.');
  process.exit(1);
}