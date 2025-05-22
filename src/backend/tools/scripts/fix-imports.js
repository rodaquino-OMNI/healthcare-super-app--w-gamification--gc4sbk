#!/usr/bin/env node

/**
 * ⚠️ DEPRECATED - DO NOT USE ⚠️
 * 
 * This script was causing TypeScript errors in the project and has been
 * completely deprecated. It has been replaced with rollback-tsconfig.js
 * that restores the original configuration.
 * 
 * This file is kept for historical reference only and should not be executed.
 * Compatible with Node.js ≥18.0.0 and TypeScript 5.3.3.
 */

/**
 * This script was originally used to fix import paths across all TypeScript files
 * in the monorepo to use the proper path aliases set up in the tsconfig.json files.
 * It is now superseded by more robust configuration in the refactored architecture.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\u{1F527} Starting import path fixes...');

// Base directory for the backend
const baseDir = path.resolve(__dirname, '../../');

// Services to process
const services = [
  'api-gateway',
  'auth-service',
  'care-service', 
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared',
  'packages' // Added to support the refactored monorepo structure
];

// Map of correct import paths
const pathAliasMap = {
  // Updated paths to match the refactored monorepo structure
  'src/backend/shared/': '@shared/',
  'src/backend/api-gateway/': '@app/api/',
  'src/backend/auth-service/': '@app/auth/',
  'src/backend/health-service/': '@app/health/',
  'src/backend/care-service/': '@app/care/',
  'src/backend/plan-service/': '@app/plan/',
  'src/backend/gamification-engine/': '@app/gamification/',
  'src/backend/notification-service/': '@app/notification/',
  'src/backend/packages/': '@austa/',
  '../../../shared/': '@shared/',
  '../../shared/': '@shared/',
  '../shared/': '@shared/',
  // New package paths
  'src/web/design-system/': '@austa/design-system/',
  'src/web/primitives/': '@design-system/primitives/',
  'src/web/interfaces/': '@austa/interfaces/',
  'src/web/journey-context/': '@austa/journey-context/'
};

// Function to find all TypeScript files in a directory recursively
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules and dist directories
      if (file !== 'node_modules' && file !== 'dist') {
        fileList = findTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  console.log(`Processing ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import paths
    for (const [oldPath, newPath] of Object.entries(pathAliasMap)) {
      // Regex to match imports with the oldPath
      const importRegex = new RegExp(`from ['"]${oldPath}([^'"]+)['"]`, 'g');
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, (match, importPath) => {
          modified = true;
          return `from '${newPath}${importPath}'`;
        });
      }
    }
    
    // Write back to file if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`\u2705 Fixed imports in ${filePath}`);
      return true;
    } else {
      console.log(`\u2139\ufe0f No imports to fix in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`\u274c Error fixing imports in ${filePath}:`, error.message);
    return false;
  }
}

// Process a service
function processService(serviceName) {
  const servicePath = path.join(baseDir, serviceName);
  
  if (!fs.existsSync(servicePath)) {
    console.error(`\u274c Service directory not found: ${servicePath}`);
    return false;
  }
  
  console.log(`\nProcessing service: ${serviceName}`);
  
  const tsFiles = findTsFiles(servicePath);
  let fixedFiles = 0;
  
  tsFiles.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedFiles++;
    }
  });
  
  console.log(`\u2705 Fixed imports in ${fixedFiles} files for ${serviceName}`);
  return true;
}

// Main execution
let success = true;

try {
  // Process all services
  services.forEach(service => {
    const result = processService(service);
    success = success && result;
  });
  
  // Run TypeScript build after all imports are fixed
  console.log('\n\u{1F50D} Running TypeScript 5.3.3 build to check for remaining errors...');
  
  try {
    // Use --dry to just check for errors without generating output
    execSync('npx tsc -b --noEmit', { cwd: baseDir, stdio: 'inherit' });
    console.log('\u2705 TypeScript build successful!');
  } catch (buildError) {
    console.log('\u26a0\ufe0f TypeScript build has errors. This might require manual fixing for specific issues.');
    success = false;
  }
  
  if (success) {
    console.log('\n\u{1F389} Import path fixes completed successfully!');
    console.log('\u26a0\ufe0f You may need to restart your TypeScript server for changes to take effect.');
  } else {
    console.error('\n\u26a0\ufe0f There were issues fixing some import paths.');
    console.log('Try running the TypeScript build manually to check for specific errors:');
    console.log('  npx tsc -b');
  }
} catch (error) {
  console.error('\n\u274c An unexpected error occurred:', error.message);
  process.exit(1);
}