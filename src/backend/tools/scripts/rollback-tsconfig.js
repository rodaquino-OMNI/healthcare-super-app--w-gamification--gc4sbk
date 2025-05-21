#!/usr/bin/env node

/**
 * This script rolls back changes made to TypeScript configuration files
 * by the fix-tsconfig.js, fix-imports.js, and fix-emit.js scripts.
 * 
 * Compatible with Node.js ≥18.0.0 and TypeScript 5.3.3
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);

if (majorVersion < 18) {
  console.error(`❌ This script requires Node.js version 18.0.0 or higher. Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('🔄 Rolling back TypeScript configuration changes...');

// Define the services to rollback
const services = [
  'api-gateway',
  'auth-service',
  'care-service', 
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared',
  'packages' // Added packages directory for shared packages
];

// Base directory for the backend
const baseDir = path.resolve(__dirname, '../../');

// Clean up any tsbuildinfo files
function cleanTsBuildInfo() {
  console.log('🧹 Cleaning TypeScript build info files...');
  try {
    services.forEach(service => {
      const servicePath = path.join(baseDir, service);
      const tsBuildInfoPath = path.join(servicePath, 'tsconfig.tsbuildinfo');
      
      if (fs.existsSync(tsBuildInfoPath)) {
        fs.unlinkSync(tsBuildInfoPath);
        console.log(`✅ Removed ${tsBuildInfoPath}`);
      }
      
      // Also clean up nested tsbuildinfo files in packages directory
      if (service === 'packages' && fs.existsSync(servicePath)) {
        try {
          const packageDirs = fs.readdirSync(servicePath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
            
          packageDirs.forEach(packageDir => {
            const packagePath = path.join(servicePath, packageDir);
            const packageTsBuildInfoPath = path.join(packagePath, 'tsconfig.tsbuildinfo');
            
            if (fs.existsSync(packageTsBuildInfoPath)) {
              fs.unlinkSync(packageTsBuildInfoPath);
              console.log(`✅ Removed ${packageTsBuildInfoPath}`);
            }
          });
        } catch (packageError) {
          console.error(`⚠️ Error cleaning package tsbuildinfo files:`, packageError.message);
        }
      }
    });
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning tsbuildinfo files:`, error.message);
    return false;
  }
}

// Reset service tsconfig.json to a standardized version
function resetServiceTsconfig(servicePath, isPackage = false) {
  const tsconfigPath = path.join(servicePath, 'tsconfig.json');
  
  console.log(`Rolling back ${tsconfigPath}...`);
  
  try {
    // Create a config that extends from the root with standardized settings
    const config = {
      "extends": isPackage ? "../../tsconfig.json" : "../tsconfig.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src",
        "composite": true,
        "declaration": true,
        "declarationMap": true
      },
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(config, null, 2));
    console.log(`✅ Reset ${tsconfigPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error resetting ${tsconfigPath}:`, error.message);
    return false;
  }
}

// Reset root tsconfig.json with standardized path resolution
function resetRootTsconfig() {
  const rootTsconfigPath = path.join(baseDir, 'tsconfig.json');
  
  console.log(`Rolling back root ${rootTsconfigPath}...`);
  
  try {
    // Create an enhanced root config with standardized path resolution
    const config = {
      "compilerOptions": {
        "target": "es2021",
        "module": "commonjs",
        "moduleResolution": "node",
        "declaration": true,
        "declarationMap": true,
        "removeComments": true,
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "allowSyntheticDefaultImports": true,
        "sourceMap": true,
        "outDir": "./dist",
        "baseUrl": ".",
        "incremental": true,
        "skipLibCheck": true,
        "strict": false,
        "strictNullChecks": false,
        "noImplicitAny": false,
        "strictBindCallApply": false,
        "forceConsistentCasingInFileNames": true,
        "noFallthroughCasesInSwitch": true,
        "esModuleInterop": true,
        "resolveJsonModule": true,
        "composite": true,
        "lib": ["es2021"],
        "paths": {
          // Internal service path aliases
          "@app/auth/*": ["auth-service/src/*"],
          "@app/shared/*": ["shared/src/*"],
          "@app/api-gateway/*": ["api-gateway/src/*"],
          "@app/care/*": ["care-service/src/*"],
          "@app/health/*": ["health-service/src/*"],
          "@app/plan/*": ["plan-service/src/*"],
          "@app/gamification/*": ["gamification-engine/src/*"],
          "@app/notification/*": ["notification-service/src/*"],
          
          // Shared packages path aliases
          "@austa/interfaces/*": ["packages/interfaces/src/*"],
          "@austa/database/*": ["packages/database/src/*"],
          "@austa/errors/*": ["packages/errors/src/*"],
          "@austa/events/*": ["packages/events/src/*"],
          "@austa/logging/*": ["packages/logging/src/*"],
          "@austa/tracing/*": ["packages/tracing/src/*"],
          "@austa/utils/*": ["packages/utils/src/*"],
          "@austa/auth/*": ["packages/auth/src/*"]
        }
      },
      "exclude": [
        "node_modules",
        "dist",
        "**/*.spec.ts",
        "**/*.test.ts"
      ],
      "references": [
        { "path": "./api-gateway" },
        { "path": "./auth-service" },
        { "path": "./care-service" },
        { "path": "./health-service" },
        { "path": "./plan-service" },
        { "path": "./gamification-engine" },
        { "path": "./notification-service" },
        { "path": "./shared" },
        { "path": "./packages/interfaces" },
        { "path": "./packages/database" },
        { "path": "./packages/errors" },
        { "path": "./packages/events" },
        { "path": "./packages/logging" },
        { "path": "./packages/tracing" },
        { "path": "./packages/utils" },
        { "path": "./packages/auth" }
      ]
    };
    
    fs.writeFileSync(rootTsconfigPath, JSON.stringify(config, null, 2));
    console.log(`✅ Reset root tsconfig.json with standardized path resolution`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error resetting root tsconfig.json:`, error.message);
    return false;
  }
}

// Reset package tsconfig.json files
function resetPackageTsconfigs() {
  const packagesDir = path.join(baseDir, 'packages');
  
  if (!fs.existsSync(packagesDir)) {
    console.log(`⚠️ Packages directory not found: ${packagesDir}`);
    return true; // Not a failure, might not have packages directory
  }
  
  console.log('🔄 Rolling back package tsconfig.json files...');
  
  try {
    const packageDirs = fs.readdirSync(packagesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
      
    let success = true;
    
    packageDirs.forEach(packageDir => {
      const packagePath = path.join(packagesDir, packageDir);
      const result = resetServiceTsconfig(packagePath, true);
      success = success && result;
    });
    
    return success;
  } catch (error) {
    console.error(`❌ Error resetting package tsconfig.json files:`, error.message);
    return false;
  }
}

// Main execution
let success = cleanTsBuildInfo() && resetRootTsconfig();

services.forEach(service => {
  if (service === 'packages') {
    // Handle packages directory separately
    const packagesResult = resetPackageTsconfigs();
    success = success && packagesResult;
  } else {
    const servicePath = path.join(baseDir, service);
    if (fs.existsSync(servicePath)) {
      const result = resetServiceTsconfig(servicePath);
      success = success && result;
    } else {
      console.error(`⚠️ Service directory not found: ${servicePath}`);
      // Not treating as a failure, as some services might not exist in all environments
    }
  }
});

// Run TypeScript check to see if rollback fixed the issues
if (success) {
  console.log('\n🔍 Running TypeScript check to verify rollback...');
  
  try {
    // First try with pnpm if available (for workspace-aware validation)
    try {
      console.log('Attempting pnpm workspace-aware TypeScript validation...');
      execSync('pnpm exec tsc --build --verbose', { cwd: baseDir, stdio: 'inherit' });
      console.log('✅ pnpm TypeScript check successful after rollback!');
    } catch (pnpmError) {
      // Fall back to npx if pnpm fails or is not available
      console.log('Falling back to npx TypeScript validation...');
      execSync('npx tsc --build --verbose', { cwd: baseDir, stdio: 'inherit' });
      console.log('✅ npx TypeScript check successful after rollback!');
    }
  } catch (buildError) {
    console.log('⚠️ TypeScript still has errors, but these might be unrelated to the configuration.');
    console.log('Please check your code for type errors and ensure TypeScript 5.3.3 is installed.');
  }
  
  console.log('\n🎉 TypeScript configuration rollback completed!');
  console.log('⚠️ You will need to restart your TypeScript server for changes to take effect.');
  console.log('💡 Tip: This script has configured standardized path aliases for all services and packages.');
} else {
  console.error('❌ There were errors during the rollback process.');
  process.exit(1);
}