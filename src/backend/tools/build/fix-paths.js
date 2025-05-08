#!/usr/bin/env node

/**
 * fix-paths.js
 * 
 * A comprehensive tool for standardizing module path resolution across the AUSTA SuperApp monorepo.
 * This script addresses critical build failures and architectural issues by:
 * 
 * 1. Standardizing path resolution in tsconfig.json for each service
 * 2. Implementing consistent path alias normalization (@app/auth, @app/shared, @austa/*)
 * 3. Validating import statements against defined path aliases
 * 4. Automatically correcting non-standard import paths
 * 5. Ensuring compatibility across web and mobile platforms
 * 6. Verifying successful TypeScript compilation after changes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// Promisify fs functions for better async handling
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

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
  cyan: '\x1b[36m',
};

// Logger with color support
const logger = {
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  section: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`),
  debug: (msg) => process.env.DEBUG && console.log(`${colors.dim}🔍 ${msg}${colors.reset}`),
};

// Base directories
const rootDir = path.resolve(__dirname, '../../../..');
const backendDir = path.resolve(rootDir, 'src/backend');
const webDir = path.resolve(rootDir, 'src/web');

// Services to process in the backend
const backendServices = [
  'api-gateway',
  'auth-service',
  'care-service',
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared',
  'packages',
];

// Frontend packages to process
const frontendPackages = [
  'web',
  'mobile',
  'design-system',
  'primitives',
  'interfaces',
  'journey-context',
  'shared',
];

// Path alias definitions for standardization
const pathAliasMap = {
  // Backend service aliases
  '@app/api': 'src/backend/api-gateway',
  '@app/auth': 'src/backend/auth-service',
  '@app/care': 'src/backend/care-service',
  '@app/health': 'src/backend/health-service',
  '@app/plan': 'src/backend/plan-service',
  '@app/gamification': 'src/backend/gamification-engine',
  '@app/notification': 'src/backend/notification-service',
  '@app/shared': 'src/backend/shared',
  
  // Shared package aliases
  '@austa/design-system': 'src/web/design-system',
  '@design-system/primitives': 'src/web/primitives',
  '@austa/interfaces': 'src/web/interfaces',
  '@austa/journey-context': 'src/web/journey-context',
  
  // Internal package aliases
  '@packages/auth': 'src/backend/packages/auth',
  '@packages/utils': 'src/backend/packages/utils',
  '@packages/tracing': 'src/backend/packages/tracing',
  '@packages/logging': 'src/backend/packages/logging',
  '@packages/events': 'src/backend/packages/events',
  '@packages/errors': 'src/backend/packages/errors',
  '@packages/database': 'src/backend/packages/database',
  '@packages/interfaces': 'src/backend/packages/interfaces',
};

// Reverse mapping for import path correction
const reversePathAliasMap = {};
Object.entries(pathAliasMap).forEach(([alias, pathValue]) => {
  reversePathAliasMap[pathValue] = alias;
  
  // Add variations with trailing slash
  reversePathAliasMap[`${pathValue}/`] = `${alias}/`;
  
  // Add relative path variations
  const segments = pathValue.split('/');
  if (segments.length > 2) {
    const relativePaths = [];
    for (let i = 1; i <= 3; i++) {
      const prefix = Array(i).fill('..').join('/');
      const relativePath = segments.slice(-segments.length + i).join('/');
      if (relativePath) {
        relativePaths.push(`${prefix}/${relativePath}`);
      }
    }
    
    relativePaths.forEach(relPath => {
      reversePathAliasMap[relPath] = alias;
      reversePathAliasMap[`${relPath}/`] = `${alias}/`;
    });
  }
});

/**
 * Find all TypeScript and JavaScript files in a directory recursively
 * @param {string} dir - Directory to search
 * @param {Array<string>} fileList - Accumulator for found files
 * @returns {Promise<Array<string>>} - List of found files
 */
async function findTsJsFiles(dir, fileList = []) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, dist, and .git directories
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          fileList = await findTsJsFiles(filePath, fileList);
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || 
                file.endsWith('.js') || file.endsWith('.jsx')) {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  } catch (error) {
    logger.error(`Error finding files in ${dir}: ${error.message}`);
    return fileList;
  }
}

/**
 * Find all tsconfig.json files in a directory recursively
 * @param {string} dir - Directory to search
 * @param {Array<string>} fileList - Accumulator for found files
 * @returns {Promise<Array<string>>} - List of found tsconfig.json files
 */
async function findTsConfigFiles(dir, fileList = []) {
  try {
    const files = await readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        // Skip node_modules, dist, and .git directories
        if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
          fileList = await findTsConfigFiles(filePath, fileList);
        }
      } else if (file === 'tsconfig.json') {
        fileList.push(filePath);
      }
    }
    
    return fileList;
  } catch (error) {
    logger.error(`Error finding tsconfig files in ${dir}: ${error.message}`);
    return fileList;
  }
}

/**
 * Fix import paths in a file
 * @param {string} filePath - Path to the file to fix
 * @returns {Promise<boolean>} - Whether the file was modified
 */
async function fixImportsInFile(filePath) {
  try {
    let content = await readFile(filePath, 'utf8');
    let modified = false;
    
    // Skip files that are generated or should not be modified
    if (content.includes('// @generated') || 
        content.includes('/* eslint-disable */') ||
        filePath.includes('node_modules')) {
      logger.debug(`Skipping generated or excluded file: ${filePath}`);
      return false;
    }
    
    // Fix import paths using the reverse mapping
    for (const [oldPath, newPath] of Object.entries(reversePathAliasMap)) {
      // Match both import and require statements
      const importRegex = new RegExp(`(from\\s+['"]|require\\(['"])${escapeRegExp(oldPath)}([^'"]*['"])`, 'g');
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, (match, prefix, suffix) => {
          modified = true;
          return `${prefix}${newPath}${suffix}`;
        });
      }
    }
    
    // Write back to file if modified
    if (modified) {
      await writeFile(filePath, content);
      logger.success(`Fixed imports in ${path.relative(rootDir, filePath)}`);
      return true;
    } else {
      logger.debug(`No imports to fix in ${path.relative(rootDir, filePath)}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error fixing imports in ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Update tsconfig.json paths configuration
 * @param {string} tsconfigPath - Path to tsconfig.json file
 * @returns {Promise<boolean>} - Whether the file was modified
 */
async function updateTsConfigPaths(tsconfigPath) {
  try {
    const content = await readFile(tsconfigPath, 'utf8');
    const tsconfig = JSON.parse(content);
    
    // Skip if this is a special tsconfig that extends another
    if (tsconfig.extends && !tsconfig.compilerOptions) {
      logger.debug(`Skipping extended tsconfig: ${tsconfigPath}`);
      return false;
    }
    
    // Ensure compilerOptions and paths exist
    tsconfig.compilerOptions = tsconfig.compilerOptions || {};
    const originalPaths = JSON.stringify(tsconfig.compilerOptions.paths || {});
    
    // Create standardized paths object
    tsconfig.compilerOptions.paths = {};
    
    // Determine which aliases to include based on the location of the tsconfig
    const isBackend = tsconfigPath.includes('/backend/');
    const isWeb = tsconfigPath.includes('/web/');
    
    // Add appropriate path mappings
    Object.entries(pathAliasMap).forEach(([alias, pathValue]) => {
      // Backend services get backend aliases
      if (isBackend && alias.startsWith('@app/') || alias.startsWith('@packages/')) {
        tsconfig.compilerOptions.paths[`${alias}/*`] = [`${pathValue}/*`];
      }
      
      // Web packages get web aliases
      if (isWeb && alias.startsWith('@austa/') || alias.startsWith('@design-system/')) {
        tsconfig.compilerOptions.paths[`${alias}/*`] = [`${pathValue}/*`];
      }
      
      // Everyone gets shared packages
      if (alias.startsWith('@austa/')) {
        tsconfig.compilerOptions.paths[`${alias}/*`] = [`${pathValue}/*`];
      }
    });
    
    // Add specific aliases for the current service/package
    const relativePath = path.relative(rootDir, path.dirname(tsconfigPath));
    for (const [alias, pathValue] of Object.entries(pathAliasMap)) {
      if (relativePath === pathValue || relativePath.startsWith(`${pathValue}/`)) {
        // Add self-reference for the current service
        tsconfig.compilerOptions.paths[`${alias}/*`] = ['./src/*'];
        break;
      }
    }
    
    // Check if paths were modified
    const newPaths = JSON.stringify(tsconfig.compilerOptions.paths);
    if (newPaths !== originalPaths) {
      // Write updated tsconfig back to file
      await writeFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      logger.success(`Updated paths in ${path.relative(rootDir, tsconfigPath)}`);
      return true;
    } else {
      logger.debug(`No path updates needed in ${path.relative(rootDir, tsconfigPath)}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error updating tsconfig paths in ${tsconfigPath}: ${error.message}`);
    return false;
  }
}

/**
 * Process a service or package directory
 * @param {string} dirPath - Path to the service or package directory
 * @returns {Promise<{tsFiles: number, fixedImports: number, tsconfigs: number, fixedTsconfigs: number}>} - Statistics
 */
async function processDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      logger.error(`Directory not found: ${dirPath}`);
      return { tsFiles: 0, fixedImports: 0, tsconfigs: 0, fixedTsconfigs: 0 };
    }
    
    logger.section(`Processing directory: ${path.relative(rootDir, dirPath)}`);
    
    // Find all TypeScript/JavaScript files
    const tsFiles = await findTsJsFiles(dirPath);
    logger.info(`Found ${tsFiles.length} TypeScript/JavaScript files`);
    
    // Find all tsconfig.json files
    const tsconfigs = await findTsConfigFiles(dirPath);
    logger.info(`Found ${tsconfigs.length} tsconfig.json files`);
    
    // Fix imports in all TypeScript/JavaScript files
    let fixedImports = 0;
    for (const file of tsFiles) {
      if (await fixImportsInFile(file)) {
        fixedImports++;
      }
    }
    
    // Update paths in all tsconfig.json files
    let fixedTsconfigs = 0;
    for (const tsconfigPath of tsconfigs) {
      if (await updateTsConfigPaths(tsconfigPath)) {
        fixedTsconfigs++;
      }
    }
    
    logger.success(`Fixed imports in ${fixedImports}/${tsFiles.length} files`);
    logger.success(`Updated paths in ${fixedTsconfigs}/${tsconfigs.length} tsconfig.json files`);
    
    return { 
      tsFiles: tsFiles.length, 
      fixedImports, 
      tsconfigs: tsconfigs.length, 
      fixedTsconfigs 
    };
  } catch (error) {
    logger.error(`Error processing directory ${dirPath}: ${error.message}`);
    return { tsFiles: 0, fixedImports: 0, tsconfigs: 0, fixedTsconfigs: 0 };
  }
}

/**
 * Validate TypeScript compilation after changes
 * @param {string} dir - Directory to validate
 * @returns {Promise<boolean>} - Whether compilation was successful
 */
async function validateTypeScriptCompilation(dir) {
  try {
    logger.section(`Validating TypeScript compilation in ${path.relative(rootDir, dir)}`);
    
    // Run TypeScript in noEmit mode to check for errors
    execSync('npx tsc -b --noEmit', { cwd: dir, stdio: 'pipe' });
    
    logger.success('TypeScript compilation successful!');
    return true;
  } catch (error) {
    logger.error('TypeScript compilation failed with errors:');
    console.error(error.stdout?.toString() || error.message);
    return false;
  }
}

/**
 * Escape special characters in a string for use in a regular expression
 * @param {string} string - String to escape
 * @returns {string} - Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Main execution function
 */
async function main() {
  logger.title('🛠️  AUSTA SuperApp Path Resolution Standardization Tool');
  logger.info('Standardizing module path resolution across the monorepo...');
  
  const stats = {
    tsFiles: 0,
    fixedImports: 0,
    tsconfigs: 0,
    fixedTsconfigs: 0,
  };
  
  // Process backend services
  logger.title('Processing Backend Services');
  for (const service of backendServices) {
    const servicePath = path.join(backendDir, service);
    const serviceStats = await processDirectory(servicePath);
    
    // Accumulate statistics
    stats.tsFiles += serviceStats.tsFiles;
    stats.fixedImports += serviceStats.fixedImports;
    stats.tsconfigs += serviceStats.tsconfigs;
    stats.fixedTsconfigs += serviceStats.fixedTsconfigs;
  }
  
  // Process frontend packages
  logger.title('Processing Frontend Packages');
  for (const pkg of frontendPackages) {
    const pkgPath = path.join(webDir, pkg);
    const pkgStats = await processDirectory(pkgPath);
    
    // Accumulate statistics
    stats.tsFiles += pkgStats.tsFiles;
    stats.fixedImports += pkgStats.fixedImports;
    stats.tsconfigs += pkgStats.tsconfigs;
    stats.fixedTsconfigs += pkgStats.fixedTsconfigs;
  }
  
  // Validate TypeScript compilation
  logger.title('Validating Changes');
  const backendValid = await validateTypeScriptCompilation(backendDir);
  const webValid = await validateTypeScriptCompilation(webDir);
  
  // Summary
  logger.title('Summary');
  logger.info(`Total TypeScript/JavaScript files processed: ${stats.tsFiles}`);
  logger.info(`Total import statements fixed: ${stats.fixedImports}`);
  logger.info(`Total tsconfig.json files processed: ${stats.tsconfigs}`);
  logger.info(`Total tsconfig.json files updated: ${stats.fixedTsconfigs}`);
  
  if (backendValid && webValid) {
    logger.success('\n🎉 Path resolution standardization completed successfully!');
    logger.info('All TypeScript compilation checks passed.');
  } else {
    logger.warning('\n⚠️ Path resolution standardization completed with warnings.');
    logger.warning('Some TypeScript compilation checks failed. Manual fixes may be required.');
    logger.info('\nTry running the TypeScript build manually to check for specific errors:');
    logger.info('  npx tsc -b');
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unexpected error: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});