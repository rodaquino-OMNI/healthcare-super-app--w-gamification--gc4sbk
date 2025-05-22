#!/usr/bin/env node

/**
 * fix-paths.js
 * 
 * A standardization tool for module path resolution that ensures consistent import paths 
 * and alias usage across the monorepo. This script:
 * 
 * 1. Scans TypeScript files to normalize import statements according to path alias conventions
 * 2. Updates tsconfig.json path mappings to ensure proper resolution
 * 3. Validates that the changes result in successful TypeScript compilation
 * 4. Ensures compatibility between web and mobile platforms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with colors and emoji
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}🔧 ${msg}${colors.reset}\n`)
};

// Base directories
const rootDir = path.resolve(__dirname, '../../../');
const backendDir = path.join(rootDir, 'src/backend');
const webDir = path.join(rootDir, 'src/web');

// Backend services to process
const backendServices = [
  'api-gateway',
  'auth-service',
  'care-service', 
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared',
  'packages'
];

// Web packages to process
const webPackages = [
  'web',
  'mobile',
  'design-system',
  'primitives',
  'interfaces',
  'journey-context',
  'shared',
  'types'
];

// Map of correct import paths for backend
const backendPathAliasMap = {
  // Old relative paths to shared
  '../../../shared/': '@app/shared/',
  '../../shared/': '@app/shared/',
  '../shared/': '@app/shared/',
  './shared/': '@app/shared/',
  
  // Old absolute paths
  'src/backend/shared/': '@app/shared/',
  'src/backend/api-gateway/': '@app/api/',
  'src/backend/auth-service/': '@app/auth/',
  'src/backend/health-service/': '@app/health/',
  'src/backend/care-service/': '@app/care/',
  'src/backend/plan-service/': '@app/plan/',
  'src/backend/gamification-engine/': '@app/gamification/',
  'src/backend/notification-service/': '@app/notification/',
  
  // Old alias format to new format
  '@shared/': '@app/shared/',
  '@api/': '@app/api/',
  '@auth/': '@app/auth/',
  '@health/': '@app/health/',
  '@care/': '@app/care/',
  '@plan/': '@app/plan/',
  '@gamification/': '@app/gamification/',
  '@notification/': '@app/notification/',
  
  // Package paths
  'src/backend/packages/auth/': '@austa/auth/',
  'src/backend/packages/utils/': '@austa/utils/',
  'src/backend/packages/tracing/': '@austa/tracing/',
  'src/backend/packages/logging/': '@austa/logging/',
  'src/backend/packages/events/': '@austa/events/',
  'src/backend/packages/errors/': '@austa/errors/',
  'src/backend/packages/database/': '@austa/database/',
  'src/backend/packages/interfaces/': '@austa/interfaces/'
};

// Map of correct import paths for web
const webPathAliasMap = {
  // Relative paths to shared
  '../../../shared/': '@web/shared/',
  '../../shared/': '@web/shared/',
  '../shared/': '@web/shared/',
  './shared/': '@web/shared/',
  
  // Absolute paths
  'src/web/shared/': '@web/shared/',
  'src/web/web/': '@web/web/',
  'src/web/mobile/': '@web/mobile/',
  'src/web/design-system/': '@austa/design-system/',
  'src/web/primitives/': '@design-system/primitives/',
  'src/web/interfaces/': '@austa/interfaces/',
  'src/web/journey-context/': '@austa/journey-context/',
  'src/web/types/': '@web/types/',
  
  // Old alias format to new format
  '@shared/': '@web/shared/',
  '@web-app/': '@web/web/',
  '@mobile-app/': '@web/mobile/',
  '@design-system/': '@austa/design-system/',
  '@interfaces/': '@austa/interfaces/',
  '@journey-context/': '@austa/journey-context/'
};

/**
 * Find all TypeScript and JavaScript files in a directory recursively
 */
function findTsJsFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules, dist, and .git directories
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== '.next' && file !== 'build') {
        fileList = findTsJsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Find all tsconfig.json files in a directory recursively
 */
function findTsConfigFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (fs.statSync(filePath).isDirectory()) {
      // Skip node_modules, dist, and .git directories
      if (file !== 'node_modules' && file !== 'dist' && file !== '.git' && file !== '.next' && file !== 'build') {
        fileList = findTsConfigFiles(filePath, fileList);
      }
    } else if (file === 'tsconfig.json') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Fix imports in a file
 */
function fixImportsInFile(filePath, pathAliasMap) {
  log.info(`Processing ${path.relative(rootDir, filePath)}`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix import paths
    for (const [oldPath, newPath] of Object.entries(pathAliasMap)) {
      // Regex to match imports and requires with the oldPath
      const importRegex = new RegExp(`(from|import|require\\()\\s*['"](${oldPath})([^'"]+)['"]`, 'g');
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, (match, importType, oldPathMatch, importPath) => {
          modified = true;
          return `${importType} '${newPath}${importPath}'`;
        });
      }
    }
    
    // Write back to file if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      log.success(`Fixed imports in ${path.relative(rootDir, filePath)}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`Error fixing imports in ${path.relative(rootDir, filePath)}: ${error.message}`);
    return false;
  }
}

/**
 * Update tsconfig.json path mappings
 */
function updateTsConfig(tsConfigPath, isBackend) {
  log.info(`Updating ${path.relative(rootDir, tsConfigPath)}`);
  
  try {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    let modified = false;
    
    // Ensure compilerOptions and paths exist
    if (!tsConfig.compilerOptions) {
      tsConfig.compilerOptions = {};
      modified = true;
    }
    
    if (!tsConfig.compilerOptions.paths) {
      tsConfig.compilerOptions.paths = {};
      modified = true;
    }
    
    // Backend path mappings
    if (isBackend) {
      // Add or update backend path mappings
      const backendPaths = {
        '@app/shared/*': ['../shared/src/*'],
        '@app/api/*': ['../api-gateway/src/*'],
        '@app/auth/*': ['../auth-service/src/*'],
        '@app/health/*': ['../health-service/src/*'],
        '@app/care/*': ['../care-service/src/*'],
        '@app/plan/*': ['../plan-service/src/*'],
        '@app/gamification/*': ['../gamification-engine/src/*'],
        '@app/notification/*': ['../notification-service/src/*'],
        '@austa/auth/*': ['../packages/auth/src/*'],
        '@austa/utils/*': ['../packages/utils/src/*'],
        '@austa/tracing/*': ['../packages/tracing/src/*'],
        '@austa/logging/*': ['../packages/logging/src/*'],
        '@austa/events/*': ['../packages/events/src/*'],
        '@austa/errors/*': ['../packages/errors/src/*'],
        '@austa/database/*': ['../packages/database/src/*'],
        '@austa/interfaces/*': ['../packages/interfaces/*']
      };
      
      // Update paths
      for (const [alias, pathMapping] of Object.entries(backendPaths)) {
        tsConfig.compilerOptions.paths[alias] = pathMapping;
        modified = true;
      }
    } else {
      // Add or update web path mappings
      const webPaths = {
        '@web/shared/*': ['../shared/*'],
        '@web/web/*': ['../web/*'],
        '@web/mobile/*': ['../mobile/*'],
        '@web/types/*': ['../types/*'],
        '@austa/design-system/*': ['../design-system/src/*'],
        '@design-system/primitives/*': ['../primitives/src/*'],
        '@austa/interfaces/*': ['../interfaces/*'],
        '@austa/journey-context/*': ['../journey-context/src/*']
      };
      
      // Update paths
      for (const [alias, pathMapping] of Object.entries(webPaths)) {
        tsConfig.compilerOptions.paths[alias] = pathMapping;
        modified = true;
      }
    }
    
    // Write back to file if modified
    if (modified) {
      fs.writeFileSync(tsConfigPath, JSON.stringify(tsConfig, null, 2));
      log.success(`Updated path mappings in ${path.relative(rootDir, tsConfigPath)}`);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    log.error(`Error updating ${path.relative(rootDir, tsConfigPath)}: ${error.message}`);
    return false;
  }
}

/**
 * Process a backend service
 */
function processBackendService(serviceName) {
  const servicePath = path.join(backendDir, serviceName);
  
  if (!fs.existsSync(servicePath)) {
    log.error(`Service directory not found: ${servicePath}`);
    return false;
  }
  
  log.title(`Processing backend service: ${serviceName}`);
  
  // Find and update TypeScript files
  const tsFiles = findTsJsFiles(servicePath);
  let fixedFiles = 0;
  
  tsFiles.forEach(file => {
    if (fixImportsInFile(file, backendPathAliasMap)) {
      fixedFiles++;
    }
  });
  
  // Find and update tsconfig.json files
  const tsConfigFiles = findTsConfigFiles(servicePath);
  let updatedConfigs = 0;
  
  tsConfigFiles.forEach(file => {
    if (updateTsConfig(file, true)) {
      updatedConfigs++;
    }
  });
  
  log.success(`Fixed imports in ${fixedFiles} files for ${serviceName}`);
  log.success(`Updated ${updatedConfigs} tsconfig.json files for ${serviceName}`);
  return true;
}

/**
 * Process a web package
 */
function processWebPackage(packageName) {
  const packagePath = path.join(webDir, packageName);
  
  if (!fs.existsSync(packagePath)) {
    log.error(`Package directory not found: ${packagePath}`);
    return false;
  }
  
  log.title(`Processing web package: ${packageName}`);
  
  // Find and update TypeScript files
  const tsFiles = findTsJsFiles(packagePath);
  let fixedFiles = 0;
  
  tsFiles.forEach(file => {
    if (fixImportsInFile(file, webPathAliasMap)) {
      fixedFiles++;
    }
  });
  
  // Find and update tsconfig.json files
  const tsConfigFiles = findTsConfigFiles(packagePath);
  let updatedConfigs = 0;
  
  tsConfigFiles.forEach(file => {
    if (updateTsConfig(file, false)) {
      updatedConfigs++;
    }
  });
  
  log.success(`Fixed imports in ${fixedFiles} files for ${packageName}`);
  log.success(`Updated ${updatedConfigs} tsconfig.json files for ${packageName}`);
  return true;
}

/**
 * Validate TypeScript compilation
 */
function validateTypeScript(directory, isBackend) {
  log.title(`Validating TypeScript compilation for ${isBackend ? 'backend' : 'web'}`);
  
  try {
    // Use --noEmit to just check for errors without generating output
    execSync('npx tsc -b --noEmit', { cwd: directory, stdio: 'inherit' });
    log.success('TypeScript validation successful!');
    return true;
  } catch (buildError) {
    log.warning('TypeScript validation has errors. This might require manual fixing for specific issues.');
    return false;
  }
}

/**
 * Create or update root tsconfig.json with references
 */
function updateRootTsConfig() {
  log.title('Updating root tsconfig.json');
  
  const rootTsConfigPath = path.join(rootDir, 'tsconfig.json');
  let rootTsConfig = {};
  
  // Load existing config or create new one
  if (fs.existsSync(rootTsConfigPath)) {
    try {
      rootTsConfig = JSON.parse(fs.readFileSync(rootTsConfigPath, 'utf8'));
    } catch (error) {
      log.warning(`Error parsing root tsconfig.json: ${error.message}. Creating new one.`);
      rootTsConfig = {};
    }
  }
  
  // Ensure files array exists and is empty (we'll use references instead)
  rootTsConfig.files = [];
  
  // Create references array
  rootTsConfig.references = [];
  
  // Add backend service references
  backendServices.forEach(service => {
    const serviceConfigPath = path.join(backendDir, service, 'tsconfig.json');
    if (fs.existsSync(serviceConfigPath)) {
      rootTsConfig.references.push({
        path: `./src/backend/${service}`
      });
    }
  });
  
  // Add web package references
  webPackages.forEach(pkg => {
    const pkgConfigPath = path.join(webDir, pkg, 'tsconfig.json');
    if (fs.existsSync(pkgConfigPath)) {
      rootTsConfig.references.push({
        path: `./src/web/${pkg}`
      });
    }
  });
  
  // Write updated config
  fs.writeFileSync(rootTsConfigPath, JSON.stringify(rootTsConfig, null, 2));
  log.success('Updated root tsconfig.json with project references');
  return true;
}

/**
 * Main execution
 */
async function main() {
  log.title('AUSTA SuperApp Path Standardization Tool');
  log.info('This tool standardizes import paths and tsconfig.json configurations across the monorepo.');
  
  let backendSuccess = true;
  let webSuccess = true;
  
  try {
    // Process backend services
    log.title('Processing Backend Services');
    for (const service of backendServices) {
      const result = processBackendService(service);
      backendSuccess = backendSuccess && result;
    }
    
    // Process web packages
    log.title('Processing Web Packages');
    for (const pkg of webPackages) {
      const result = processWebPackage(pkg);
      webSuccess = webSuccess && result;
    }
    
    // Update root tsconfig.json
    updateRootTsConfig();
    
    // Validate TypeScript compilation
    const backendValidation = validateTypeScript(backendDir, true);
    const webValidation = validateTypeScript(webDir, false);
    
    // Final summary
    log.title('Path Standardization Summary');
    
    if (backendSuccess && webSuccess && backendValidation && webValidation) {
      log.success('All path standardization tasks completed successfully!');
      log.info('You may need to restart your TypeScript server for changes to take effect.');
    } else {
      if (!backendSuccess) {
        log.warning('There were issues processing some backend services.');
      }
      
      if (!webSuccess) {
        log.warning('There were issues processing some web packages.');
      }
      
      if (!backendValidation) {
        log.warning('Backend TypeScript validation failed. Manual fixes may be required.');
      }
      
      if (!webValidation) {
        log.warning('Web TypeScript validation failed. Manual fixes may be required.');
      }
      
      log.info('Try running the TypeScript build manually to check for specific errors:');
      log.info('  Backend: cd src/backend && npx tsc -b');
      log.info('  Web: cd src/web && npx tsc -b');
    }
  } catch (error) {
    log.error(`An unexpected error occurred: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});