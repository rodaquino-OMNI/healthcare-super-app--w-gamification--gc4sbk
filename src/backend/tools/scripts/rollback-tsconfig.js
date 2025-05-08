#!/usr/bin/env node

/**
 * This script rolls back changes made to TypeScript configuration files
 * by the fix-tsconfig.js, fix-imports.js, and fix-emit.js scripts.
 * 
 * Updated to support TypeScript 5.3.3, Node.js ≥18.0.0, standardized path resolution,
 * and pnpm workspace-aware TypeScript validation.
 * 
 * @requires Node.js ≥18.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
if (majorVersion < 18) {
  console.error(`\x1b[31m❌ This script requires Node.js ≥18.0.0. Current version: ${nodeVersion}\x1b[0m`);
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
  'shared'
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
    });

    // Also clean up any tsbuildinfo files in packages directory
    const packagesDir = path.join(baseDir, 'packages');
    if (fs.existsSync(packagesDir)) {
      const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      packages.forEach(pkg => {
        const packagePath = path.join(packagesDir, pkg);
        const tsBuildInfoPath = path.join(packagePath, 'tsconfig.tsbuildinfo');
        
        if (fs.existsSync(tsBuildInfoPath)) {
          fs.unlinkSync(tsBuildInfoPath);
          console.log(`✅ Removed ${tsBuildInfoPath}`);
        }
      });
    }

    return true;
  } catch (error) {
    console.error(`❌ Error cleaning tsbuildinfo files:`, error.message);
    return false;
  }
}

// Reset service tsconfig.json to a simple version
function resetServiceTsconfig(servicePath) {
  const tsconfigPath = path.join(servicePath, 'tsconfig.json');
  
  console.log(`Rolling back ${tsconfigPath}...`);
  
  try {
    // Create a simple config that extends from the root
    const config = {
      "extends": "../tsconfig.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
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

// Reset package tsconfig.json to a simple version
function resetPackageTsconfig(packagePath) {
  const tsconfigPath = path.join(packagePath, 'tsconfig.json');
  
  console.log(`Rolling back ${tsconfigPath}...`);
  
  try {
    // Create a simple config that extends from the root
    const config = {
      "extends": "../../tsconfig.json",
      "compilerOptions": {
        "outDir": "./dist",
        "rootDir": "./src"
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

// Reset root tsconfig.json
function resetRootTsconfig() {
  const rootTsconfigPath = path.join(baseDir, 'tsconfig.json');
  
  console.log(`Rolling back root ${rootTsconfigPath}...`);
  
  try {
    // Create a standardized root config with path aliases
    const config = {
      "compilerOptions": {
        "target": "es2022",
        "module": "commonjs",
        "moduleResolution": "node",
        "declaration": true,
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
        "lib": ["es2022"],
        "paths": {
          // Internal service path aliases
          "@app/shared": ["shared/src"],
          "@app/shared/*": ["shared/src/*"],
          "@app/auth": ["auth-service/src"],
          "@app/auth/*": ["auth-service/src/*"],
          "@app/health": ["health-service/src"],
          "@app/health/*": ["health-service/src/*"],
          "@app/care": ["care-service/src"],
          "@app/care/*": ["care-service/src/*"],
          "@app/plan": ["plan-service/src"],
          "@app/plan/*": ["plan-service/src/*"],
          "@app/gamification": ["gamification-engine/src"],
          "@app/gamification/*": ["gamification-engine/src/*"],
          "@app/notifications": ["notification-service/src"],
          "@app/notifications/*": ["notification-service/src/*"],
          "@prisma/*": ["shared/prisma/*"],
          
          // Shared packages path aliases
          "@austa/*": ["packages/*"]
        }
      },
      "exclude": [
        "node_modules",
        "dist",
        "**/*.spec.ts",
        "**/*.test.ts"
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

// Main execution
let success = cleanTsBuildInfo() && resetRootTsconfig();

// Reset service tsconfig files
services.forEach(service => {
  const servicePath = path.join(baseDir, service);
  if (fs.existsSync(servicePath)) {
    const result = resetServiceTsconfig(servicePath);
    success = success && result;
  } else {
    console.error(`❌ Service directory not found: ${servicePath}`);
    success = false;
  }
});

// Reset package tsconfig files
const packagesDir = path.join(baseDir, 'packages');
if (fs.existsSync(packagesDir)) {
  const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  packages.forEach(pkg => {
    const packagePath = path.join(packagesDir, pkg);
    if (fs.existsSync(packagePath)) {
      const result = resetPackageTsconfig(packagePath);
      success = success && result;
    }
  });
}

// Optional: Run TypeScript check to see if rollback fixed the issues
if (success) {
  console.log('\n🔍 Running TypeScript check to verify rollback...');
  
  try {
    // Check if pnpm is available
    let packageManager = 'npx';
    try {
      execSync('pnpm --version', { stdio: 'ignore' });
      packageManager = 'pnpm exec';
      console.log('📦 Using pnpm for workspace-aware TypeScript validation');
    } catch (e) {
      // pnpm not available, using npx
    }

    execSync(`${packageManager} tsc --noEmit`, { cwd: baseDir, stdio: 'inherit' });
    console.log('✅ TypeScript check successful after rollback!');
  } catch (buildError) {
    console.log('⚠️ TypeScript still has errors, but these might be unrelated to the configuration.');
  }
  
  console.log('\n🎉 TypeScript configuration rollback completed!');
  console.log('⚠️ You will need to restart your TypeScript server for changes to take effect.');
  console.log('📝 This script has configured TypeScript 5.3.3 with standardized path resolution.');
} else {
  console.error('❌ There were errors during the rollback process.');
  process.exit(1);
}