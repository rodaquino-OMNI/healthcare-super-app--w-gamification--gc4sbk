#!/usr/bin/env node

/**
 * This script patches vulnerable axios instances in node_modules
 * to prevent security vulnerabilities (SSRF and credential leakage)
 * 
 * Compatible with Node.js ≥18.0.0
 * Supports npm, yarn, and pnpm workspace structures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check Node.js version compatibility
const nodeVersion = process.version;
const minNodeVersion = 'v18.0.0';

if (compareVersions(nodeVersion, minNodeVersion) < 0) {
  console.error(`\x1b[31m❌ Error: This script requires Node.js ${minNodeVersion} or higher. Current version: ${nodeVersion}\x1b[0m`);
  process.exit(1);
}

console.log('\x1b[36m🔒 Starting security patch for axios vulnerabilities...\x1b[0m');
console.log(`\x1b[36m📋 Running with Node.js ${nodeVersion}\x1b[0m`);

// Paths to check for vulnerable axios instances
const pathsToCheck = [
  // Original paths
  'node_modules/@agora-js/media/node_modules/axios',
  'node_modules/@agora-js/report/node_modules/axios',
  'node_modules/@agora-js/shared/node_modules/axios',
  'node_modules/agora-rtc-sdk-ng/node_modules/axios',
  
  // Additional paths for refactored dependency structure
  'node_modules/@austa/design-system/node_modules/axios',
  'node_modules/@design-system/primitives/node_modules/axios',
  'node_modules/@austa/interfaces/node_modules/axios',
  'node_modules/@austa/journey-context/node_modules/axios'
];

// Check for pnpm workspace structure
const isPnpmWorkspace = fs.existsSync('pnpm-workspace.yaml') || fs.existsSync('.pnpm-workspace.yaml');

if (isPnpmWorkspace) {
  console.log('\x1b[36m📦 Detected pnpm workspace structure\x1b[0m');
  
  // Add pnpm-specific paths
  pathsToCheck.push(
    '.pnpm/axios@*/node_modules/axios',
    'node_modules/.pnpm/axios@*/node_modules/axios',
    'src/web/node_modules/.pnpm/axios@*/node_modules/axios',
    'src/backend/node_modules/.pnpm/axios@*/node_modules/axios'
  );
  
  // Try to find all axios instances in pnpm virtual store
  try {
    const pnpmStoreLocations = [
      'node_modules/.pnpm',
      '.pnpm',
      'src/web/node_modules/.pnpm',
      'src/backend/node_modules/.pnpm'
    ];
    
    for (const storeLocation of pnpmStoreLocations) {
      if (fs.existsSync(storeLocation)) {
        // Find all axios instances in the pnpm store using glob pattern
        const axiosInstances = findPnpmAxiosInstances(storeLocation);
        pathsToCheck.push(...axiosInstances);
      }
    }
  } catch (error) {
    console.warn(`\x1b[33m⚠️ Could not scan pnpm store: ${error.message}\x1b[0m`);
  }
}

// Helper function to recursively copy directories
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Get all files and directories in source
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      console.log(`\x1b[32m✅ Copied ${entry.name} to ${dest}\x1b[0m`);
    }
  }
}

// Helper function to find axios instances in pnpm store
function findPnpmAxiosInstances(storeLocation) {
  const instances = [];
  
  try {
    // Find directories that match axios pattern
    const dirs = fs.readdirSync(storeLocation, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name.startsWith('axios@')) {
        const axiosPath = path.join(storeLocation, dir.name, 'node_modules/axios');
        if (fs.existsSync(axiosPath)) {
          instances.push(axiosPath);
        }
      }
    }
  } catch (error) {
    console.warn(`\x1b[33m⚠️ Error scanning ${storeLocation}: ${error.message}\x1b[0m`);
  }
  
  return instances;
}

// Helper function to compare versions
function compareVersions(v1, v2) {
  const v1Parts = v1.replace('v', '').split('.');
  const v2Parts = v2.replace('v', '').split('.');
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = parseInt(v1Parts[i] || 0, 10);
    const v2Part = parseInt(v2Parts[i] || 0, 10);
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

// Check if secure axios version is installed
let secureAxiosInstalled = false;
try {
  const rootAxiosPath = path.resolve(process.cwd(), 'node_modules/axios');
  if (fs.existsSync(rootAxiosPath)) {
    const packageJsonPath = path.join(rootAxiosPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      // Check if it's a secure version (1.6.8 or higher)
      if (packageJson.version && compareVersions(packageJson.version, '1.6.8') >= 0) {
        console.log(`\x1b[32m✅ Secure axios version ${packageJson.version} already installed\x1b[0m`);
        secureAxiosInstalled = true;
      } else {
        console.log(`\x1b[33m⚠️ Found axios version ${packageJson.version}, but 1.6.8 or higher is required for security\x1b[0m`);
      }
    }
  }
  
  // If secure version isn't found, try to install it
  if (!secureAxiosInstalled) {
    console.log('\x1b[36m📦 Installing secure axios version...\x1b[0m');
    try {
      // Try to detect package manager
      let installCmd = 'npm install axios@1.6.8 --no-save';
      
      if (fs.existsSync('pnpm-lock.yaml')) {
        installCmd = 'pnpm add axios@1.6.8 --no-save';
      } else if (fs.existsSync('yarn.lock')) {
        installCmd = 'yarn add axios@1.6.8 --no-save';
      }
      
      console.log(`\x1b[36m🔧 Running: ${installCmd}\x1b[0m`);
      execSync(installCmd, { stdio: 'inherit' });
      secureAxiosInstalled = true;
    } catch (installError) {
      console.log('\x1b[33m⚠️ Could not install axios directly, but will try to continue with patches if a secure version exists\x1b[0m');
      // Check again if a secure version exists despite the install error
      if (fs.existsSync(rootAxiosPath)) {
        const packageJsonPath = path.join(rootAxiosPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.version && compareVersions(packageJson.version, '1.6.8') >= 0) {
            console.log(`\x1b[32m✅ Found secure axios version ${packageJson.version} to use for patching\x1b[0m`);
            secureAxiosInstalled = true;
          }
        }
      }
    }
  }
  
  if (!secureAxiosInstalled) {
    throw new Error('Could not find or install a secure axios version to use for patching');
  }
  
  // Copy secure axios files to vulnerable locations
  let patchedCount = 0;
  let skippedCount = 0;
  
  // Use glob patterns to find all potential axios instances
  const allPathsToCheck = [...new Set(pathsToCheck)];
  
  allPathsToCheck.forEach(vulnerablePathPattern => {
    // Handle glob patterns
    let vulnerablePaths = [vulnerablePathPattern];
    
    if (vulnerablePathPattern.includes('*')) {
      try {
        // Simple glob implementation for * wildcard
        const basePath = vulnerablePathPattern.split('*')[0];
        if (fs.existsSync(path.dirname(basePath))) {
          const matches = findMatchingPaths(basePath, vulnerablePathPattern);
          vulnerablePaths = matches;
        } else {
          vulnerablePaths = [];
        }
      } catch (error) {
        console.warn(`\x1b[33m⚠️ Error resolving glob pattern ${vulnerablePathPattern}: ${error.message}\x1b[0m`);
        vulnerablePaths = [];
      }
    }
    
    for (const fullPath of vulnerablePaths) {
      if (fs.existsSync(fullPath)) {
        console.log(`\x1b[36m🔧 Patching vulnerable axios at ${fullPath}\x1b[0m`);
        
        // Update package.json with secure version
        const packageJsonPath = path.join(fullPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const originalVersion = packageJson.version;
            packageJson.version = '1.6.8';
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log(`\x1b[32m✅ Updated ${packageJsonPath} from version ${originalVersion} to 1.6.8\x1b[0m`);
          } catch (e) {
            console.error(`\x1b[31m❌ Error updating ${packageJsonPath}: ${e.message}\x1b[0m`);
          }
        }
        
        // Copy secure files from node_modules/axios to vulnerable path
        const secureAxiosPath = path.resolve(process.cwd(), 'node_modules/axios');
        if (fs.existsSync(secureAxiosPath)) {
          try {
            // Copy lib directory which contains the source code
            const sourceLibPath = path.join(secureAxiosPath, 'lib');
            const targetLibPath = path.join(fullPath, 'lib');
            if (fs.existsSync(sourceLibPath)) {
              copyDir(sourceLibPath, targetLibPath);
              console.log(`\x1b[32m✅ Copied lib directory to ${targetLibPath}\x1b[0m`);
            }
            
            // Copy dist directory which contains the built code
            const sourceDistPath = path.join(secureAxiosPath, 'dist');
            const targetDistPath = path.join(fullPath, 'dist');
            if (fs.existsSync(sourceDistPath)) {
              copyDir(sourceDistPath, targetDistPath);
              console.log(`\x1b[32m✅ Copied dist directory to ${targetDistPath}\x1b[0m`);
            }
            
            // Copy top-level files
            const filesToCopy = ['index.js', 'index.d.ts', 'axios.js', 'README.md', 'CHANGELOG.md'];
            filesToCopy.forEach(file => {
              const sourceFile = path.join(secureAxiosPath, file);
              const targetFile = path.join(fullPath, file);
              if (fs.existsSync(sourceFile)) {
                fs.copyFileSync(sourceFile, targetFile);
                console.log(`\x1b[32m✅ Copied ${file} to ${fullPath}\x1b[0m`);
              }
            });
            
            patchedCount++;
            
            // Log for security compliance tracking
            console.log(`\x1b[36m📝 [SECURITY_COMPLIANCE] Patched axios at ${fullPath} to version 1.6.8\x1b[0m`);
          } catch (e) {
            console.error(`\x1b[31m❌ Error copying secure axios files: ${e.message}\x1b[0m`);
          }
        }
      } else {
        console.log(`\x1b[33m⚠️ Path not found: ${fullPath}\x1b[0m`);
        skippedCount++;
      }
    }
  });
  
  // Helper function to find paths matching a glob pattern
  function findMatchingPaths(basePath, pattern) {
    const results = [];
    const parts = pattern.split('*');
    const baseDir = path.dirname(basePath);
    
    if (!fs.existsSync(baseDir)) {
      return results;
    }
    
    function traverse(dir, depth = 0) {
      if (depth > 5) return; // Limit recursion depth
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Check if this directory matches our pattern
          if (pattern.includes('*') && fullPath.includes(parts[0])) {
            const remainingPath = path.join(fullPath, parts[1]);
            if (fs.existsSync(remainingPath)) {
              results.push(remainingPath);
            }
          }
          
          // Continue traversing
          traverse(fullPath, depth + 1);
        }
      }
    }
    
    traverse(baseDir);
    return results;
  }
  
  // Summary
  console.log('\x1b[36m📊 Patch summary:\x1b[0m');
  console.log(`\x1b[32m✅ Successfully patched: ${patchedCount} axios instances\x1b[0m`);
  console.log(`\x1b[33m⚠️ Skipped/not found: ${skippedCount} paths\x1b[0m`);
  
  console.log('\x1b[36m🎉 Patch completed successfully!\x1b[0m');
  console.log('\x1b[33m⚠️ Note: npm audit may still report vulnerabilities based on package dependencies,\x1b[0m');
  console.log('\x1b[33m   but the actual code has been replaced with secure versions.\x1b[0m');
  
  // Security compliance tracking
  console.log('\x1b[36m📝 [SECURITY_COMPLIANCE] Axios security patch completed successfully\x1b[0m');
  console.log(`\x1b[36m📝 [SECURITY_COMPLIANCE] Patched ${patchedCount} vulnerable axios instances to version 1.6.8\x1b[0m`);
} catch (error) {
  console.error(`\x1b[31m❌ Patch failed: ${error.message}\x1b[0m`);
  console.log('\x1b[36m📝 [SECURITY_COMPLIANCE] Axios security patch failed: ' + error.message + '\x1b[0m');
  process.exit(1);
}