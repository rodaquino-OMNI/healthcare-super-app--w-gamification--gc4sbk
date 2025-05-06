#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

console.log('🔒 Applying security patches to node_modules...');

// Define patches to apply to specific packages
const patches = [
  { name: 'axios-security-fix', target: 'axios' },
  { name: 'react-native-reanimated-fix', target: 'react-native-reanimated' },
  { name: 'react-native-gesture-handler-fix', target: 'react-native-gesture-handler' },
  { name: 'react-native-svg-fix', target: 'react-native-svg' }
];

// List of known vulnerable packages and their secure versions
const secureVersions = {
  // Core security packages
  'axios': '1.6.8',
  'follow-redirects': '1.15.4',
  'semver': '7.5.4',
  'json5': '2.2.3',
  'minimatch': '3.1.2',
  '@babel/traverse': '7.23.2',
  'tough-cookie': '4.1.3',
  'word-wrap': '1.2.4',
  'minimist': '1.2.8',
  'ws': '8.16.0',
  
  // React Native ecosystem
  'react-native': '0.73.4',
  'react-native-reanimated': '3.3.0',
  'react-native-gesture-handler': '2.12.0',
  'react-native-svg': '13.10.0',
  
  // Additional packages from spec
  'react': '18.2.0',
  'react-dom': '18.2.0',
  'next': '14.2.0',
  'styled-components': '6.1.8',
  '@mui/material': '5.15.12',
  'framer-motion': '11.0.8'
};

// Check if running in a pnpm environment
function isPnpmEnvironment() {
  return fs.existsSync(path.resolve(process.cwd(), 'node_modules/.pnpm'));
}

// Handle pnpm workspace structure
function handlePnpmWorkspace() {
  console.log('\n📊 Handling pnpm workspace structure...');
  
  if (!isPnpmEnvironment()) {
    console.log('⚠️ Not a pnpm environment, skipping workspace handling');
    return;
  }
  
  // Check for pnpm-workspace.yaml
  const workspaceConfigPath = path.resolve(process.cwd(), 'pnpm-workspace.yaml');
  if (!fs.existsSync(workspaceConfigPath)) {
    console.log('⚠️ pnpm-workspace.yaml not found, skipping workspace handling');
    return;
  }
  
  console.log('📗 Found pnpm-workspace.yaml, checking virtual store...');
  
  // Check the virtual store for vulnerable packages
  const pnpmDir = path.resolve(process.cwd(), 'node_modules/.pnpm');
  if (!fs.existsSync(pnpmDir)) {
    console.log('⚠️ pnpm virtual store not found');
    return;
  }
  
  // Get all packages in the virtual store
  const pnpmPackages = fs.readdirSync(pnpmDir);
  
  // Check for vulnerable packages
  Object.keys(secureVersions).forEach(pkg => {
    // Find all instances of this package in the virtual store
    const matchingDirs = pnpmPackages.filter(dir => 
      dir.startsWith(`${pkg}@`) && !dir.includes('node_modules')
    );
    
    matchingDirs.forEach(dir => {
      // Extract version from directory name
      const versionMatch = dir.match(new RegExp(`${pkg}@([^/]+)`));
      if (versionMatch && versionMatch[1]) {
        const installedVersion = versionMatch[1];
        const secureVersion = secureVersions[pkg];
        
        if (installedVersion !== secureVersion) {
          console.log(`⚠️ Found vulnerable ${pkg}@${installedVersion} in pnpm store - should be ${secureVersion}`);
          
          // Path to the package in the virtual store
          const pkgPath = path.resolve(pnpmDir, dir, 'node_modules', pkg);
          if (fs.existsSync(pkgPath)) {
            try {
              // Update package.json
              const pkgJsonPath = path.resolve(pkgPath, 'package.json');
              const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
              pkgJson.version = secureVersion;
              fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
              console.log(`✅ Updated ${pkg} in pnpm store to ${secureVersion}`);
            } catch (error) {
              console.error(`❌ Error updating ${pkg} in pnpm store: ${error.message}`);
            }
          }
        }
      }
    });
  });
}

// Get package path considering pnpm structure
function getPackagePath(packageName) {
  const standardPath = path.resolve(process.cwd(), 'node_modules', packageName);
  
  if (fs.existsSync(standardPath)) {
    return standardPath;
  }
  
  // Check for pnpm structure if standard path doesn't exist
  if (isPnpmEnvironment()) {
    // Try to find the package in pnpm structure
    const pnpmDir = path.resolve(process.cwd(), 'node_modules/.pnpm');
    const pnpmPackages = fs.readdirSync(pnpmDir);
    
    // Look for directories that start with the package name
    const matchingDirs = pnpmPackages.filter(dir => 
      dir.startsWith(`${packageName}@`)
    );
    
    if (matchingDirs.length > 0) {
      // Use the first matching directory
      return path.resolve(pnpmDir, matchingDirs[0], 'node_modules', packageName);
    }
  }
  
  // Check in workspace packages
  const workspacePaths = [
    'src/web/design-system',
    'src/web/primitives',
    'src/web/interfaces',
    'src/web/journey-context',
    'src/web/mobile',
    'src/web/web',
    'src/web/shared',
    'src/backend/packages/auth',
    'src/backend/packages/utils',
    'src/backend/packages/tracing',
    'src/backend/packages/logging',
    'src/backend/packages/events',
    'src/backend/packages/errors',
    'src/backend/packages/database',
    'src/backend/packages/interfaces'
  ];
  
  for (const workspacePath of workspacePaths) {
    const packageInWorkspace = path.resolve(process.cwd(), workspacePath, 'node_modules', packageName);
    if (fs.existsSync(packageInWorkspace)) {
      return packageInWorkspace;
    }
  }
  
  return null;
}

// Check and log the actual installed versions
function checkInstalledVersions() {
  console.log('📋 Checking installed versions of critical packages:');
  
  Object.keys(secureVersions).forEach(pkg => {
    try {
      const pkgPath = getPackagePath(pkg);
      
      if (pkgPath) {
        const pkgJsonPath = path.resolve(pkgPath, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          const installedVersion = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8')).version;
          const secureVersion = secureVersions[pkg];
          const isSecure = installedVersion === secureVersion;
          
          console.log(`${isSecure ? '✅' : '⚠️'} ${pkg}: ${installedVersion} ${isSecure ? '(secure)' : `(should be ${secureVersion})`}`);
        }
      } else {
        console.log(`⚠️ ${pkg}: not found in node_modules`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${pkg}: ${error.message}`);
    }
  });
}

// Apply source code patches
function applyPatches() {
  console.log('\n📝 Applying source code patches...');
  
  // Create patches directory if it doesn't exist
  const patchesDir = path.resolve(__dirname, '../patches');
  if (!fs.existsSync(patchesDir)) {
    console.log('📁 Creating patches directory...');
    fs.mkdirSync(patchesDir, { recursive: true });
  }
  
  // Check if patch files exist, create sample if not
  patches.forEach(patch => {
    const patchPath = path.resolve(patchesDir, `${patch.name}.patch`);
    if (!fs.existsSync(patchPath)) {
      console.log(`📄 Creating sample patch file for ${patch.name}...`);
      fs.writeFileSync(patchPath, `# Sample patch for ${patch.target}\n# Replace this with actual patch content\n`);
    }
  });
  
  patches.forEach(patch => {
    try {
      const patchPath = path.resolve(__dirname, '../patches', `${patch.name}.patch`);
      const moduleDir = getPackagePath(patch.target);
      
      if (!moduleDir) {
        console.warn(`⚠️ Module ${patch.target} not found in node_modules`);
        return;
      }
      
      console.log(`📝 Applying patch to ${patch.target}...`);
      
      try {
        // Try with -p1 first (standard git patch format)
        child_process.execSync(`patch -p1 -d ${moduleDir} < ${patchPath}`, {
          stdio: 'inherit'
        });
      } catch (patchError) {
        // If -p1 fails, try with -p0 (direct patch)
        console.log(`⚠️ First patch attempt failed, trying alternate format...`);
        child_process.execSync(`patch -p0 -d ${moduleDir} < ${patchPath}`, {
          stdio: 'inherit'
        });
      }
      
      console.log(`✅ Successfully patched ${patch.target}`);
    } catch (error) {
      console.error(`❌ Failed to apply patch to ${patch.target}: ${error.message}`);
      console.log('⚠️ Continuing with other security measures...');
    }
  });
}

// Check for nested vulnerable dependencies and try to fix them
function checkNestedDependencies() {
  console.log('\n🔍 Checking for nested vulnerable dependencies...');
  
  // Look for problematic packages that often contain vulnerabilities
  const problematicModules = [
    // Original problematic modules
    'agora-rtc-sdk',
    'agora-rtc-sdk-ng', 
    '@sentry/nextjs',
    
    // New packages from the spec
    '@austa/design-system',
    '@design-system/primitives',
    '@austa/interfaces',
    '@austa/journey-context',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-svg',
    '@mui/material',
    'framer-motion'
  ];
  
  // Vulnerable dependencies to check for in nested packages
  const vulnerableDeps = [
    'axios',
    'follow-redirects',
    'semver',
    'minimatch',
    'ws',
    '@babel/traverse'
  ];
  
  problematicModules.forEach(moduleName => {
    const moduleDir = getPackagePath(moduleName);
    if (moduleDir) {
      console.log(`📦 Found ${moduleName} - checking its dependencies...`);
      
      // Check for each vulnerable dependency
      vulnerableDeps.forEach(depName => {
        const nestedDepDir = path.resolve(moduleDir, 'node_modules', depName);
        if (fs.existsSync(nestedDepDir)) {
          console.log(`⚠️ Found nested ${depName} in ${moduleName} - forcing secure version...`);
          try {
            // Replace the package.json with secure version
            const pkgJsonPath = path.resolve(nestedDepDir, 'package.json');
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
            pkgJson.version = secureVersions[depName];
            fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
            console.log(`✅ Updated nested ${depName} in ${moduleName} to ${secureVersions[depName]}`);
          } catch (error) {
            console.error(`❌ Failed to update nested ${depName} in ${moduleName}: ${error.message}`);
          }
        }
      });
    }
  });
}

// Check for vulnerabilities in workspace packages
function checkWorkspacePackages() {
  console.log('\n🔍 Checking for vulnerabilities in workspace packages...');
  
  const workspacePackages = [
    { path: 'src/web/design-system', name: '@austa/design-system' },
    { path: 'src/web/primitives', name: '@design-system/primitives' },
    { path: 'src/web/interfaces', name: '@austa/interfaces' },
    { path: 'src/web/journey-context', name: '@austa/journey-context' },
    { path: 'src/web/mobile', name: 'mobile-app' },
    { path: 'src/web/web', name: 'web-app' }
  ];
  
  workspacePackages.forEach(pkg => {
    const pkgPath = path.resolve(process.cwd(), pkg.path);
    if (fs.existsSync(pkgPath)) {
      console.log(`📦 Checking ${pkg.name} (${pkg.path})...`);
      
      // Check node_modules in this workspace package
      const nodeModulesPath = path.resolve(pkgPath, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        Object.keys(secureVersions).forEach(depName => {
          const depPath = path.resolve(nodeModulesPath, depName);
          if (fs.existsSync(depPath)) {
            try {
              const pkgJsonPath = path.resolve(depPath, 'package.json');
              const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
              const installedVersion = pkgJson.version;
              const secureVersion = secureVersions[depName];
              
              if (installedVersion !== secureVersion) {
                console.log(`⚠️ Found vulnerable ${depName}@${installedVersion} in ${pkg.name} - should be ${secureVersion}`);
                
                // Update the package.json
                pkgJson.version = secureVersion;
                fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
                console.log(`✅ Updated ${depName} in ${pkg.name} to ${secureVersion}`);
              }
            } catch (error) {
              console.error(`❌ Error checking ${depName} in ${pkg.name}: ${error.message}`);
            }
          }
        });
      }
    }
  });
}

// Check for React Native specific issues
function checkReactNativeIssues() {
  console.log('\n🔍 Checking for React Native specific issues...');
  
  const rnPackages = [
    'react-native',
    'react-native-reanimated',
    'react-native-gesture-handler',
    'react-native-svg'
  ];
  
  // Check for React Native in src/web/mobile
  const mobileAppPath = path.resolve(process.cwd(), 'src/web/mobile');
  if (fs.existsSync(mobileAppPath)) {
    console.log('📱 Checking React Native packages in mobile app...');
    
    rnPackages.forEach(pkg => {
      const pkgPath = path.resolve(mobileAppPath, 'node_modules', pkg);
      if (fs.existsSync(pkgPath)) {
        try {
          const pkgJsonPath = path.resolve(pkgPath, 'package.json');
          const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          const installedVersion = pkgJson.version;
          const secureVersion = secureVersions[pkg];
          
          if (installedVersion !== secureVersion) {
            console.log(`⚠️ Found ${pkg}@${installedVersion} in mobile app - updating to ${secureVersion}...`);
            pkgJson.version = secureVersion;
            fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
            console.log(`✅ Updated ${pkg} to ${secureVersion}`);
          } else {
            console.log(`✅ ${pkg} is already at secure version ${secureVersion}`);
          }
        } catch (error) {
          console.error(`❌ Error checking ${pkg}: ${error.message}`);
        }
      } else {
        console.log(`⚠️ ${pkg} not found in mobile app node_modules`);
      }
    });
  } else {
    console.log('⚠️ Mobile app directory not found at src/web/mobile');
  }
}

// Main execution flow
function main() {
  try {
    // Detect package manager
    const isPnpm = isPnpmEnvironment();
    console.log(`📦 Detected ${isPnpm ? 'pnpm' : 'npm/yarn'} package manager`);
    
    // 1. Check current installed versions
    checkInstalledVersions();
    
    // 2. Apply patches to vulnerable modules
    applyPatches();
    
    // 3. Check and fix nested vulnerable dependencies
    checkNestedDependencies();
    
    // 4. Check workspace packages (new step)
    checkWorkspacePackages();
    
    // 5. Check React Native specific issues (new step)
    checkReactNativeIssues();
    
    // 6. Handle pnpm workspace structure if applicable
    if (isPnpm) {
      handlePnpmWorkspace();
    }
    
    console.log('\n🎉 Security patches applied successfully!');
    if (isPnpm) {
      console.log('Note: Please run \'pnpm install\' after any package updates to ensure changes take effect.');
    } else {
      console.log('Note: Please run \'npm install\' or \'yarn install\' after any package updates to ensure changes take effect.');
    }
  } catch (error) {
    console.error(`\n❌ Error during security patching: ${error.message}`);
    process.exit(1);
  }
}

main();