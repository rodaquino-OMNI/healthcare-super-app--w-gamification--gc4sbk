#!/usr/bin/env node

/**
 * setup-path-aliases.js
 * 
 * This script standardizes TypeScript path alias mappings across all packages in the monorepo.
 * It discovers TypeScript configuration files, sets up path aliases, enforces compiler flags,
 * and updates build scripts to support aliases.
 * 
 * Key features:
 * - Adds path aliases for new packages (@austa/design-system, @design-system/primitives, @austa/interfaces, @austa/journey-context)
 * - Updates baseUrl computation to support the refactored monorepo structure
 * - Adds journey-specific path aliases (@app/auth, @app/shared, etc.)
 * - Enhances build script modifications to use tsc-alias for consistent path resolution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants
const REPO_ROOT = path.resolve(__dirname, '..');
const BACKEND_ROOT = path.join(REPO_ROOT, 'src', 'backend');
const WEB_ROOT = path.join(REPO_ROOT, 'src', 'web');

// New packages to add path aliases for
const NEW_PACKAGES = {
  '@austa/design-system': ['src/web/design-system/src/*'],
  '@design-system/primitives': ['src/web/primitives/src/*'],
  '@austa/interfaces': ['src/web/interfaces/*'],
  '@austa/journey-context': ['src/web/journey-context/src/*']
};

// Journey-specific path aliases
const JOURNEY_ALIASES = {
  '@app/auth': ['src/backend/auth-service/src'],
  '@app/auth/*': ['src/backend/auth-service/src/*'],
  '@app/shared': ['src/backend/shared/src'],
  '@app/shared/*': ['src/backend/shared/src/*'],
  '@app/health': ['src/backend/health-service/src'],
  '@app/health/*': ['src/backend/health-service/src/*'],
  '@app/care': ['src/backend/care-service/src'],
  '@app/care/*': ['src/backend/care-service/src/*'],
  '@app/plan': ['src/backend/plan-service/src'],
  '@app/plan/*': ['src/backend/plan-service/src/*'],
  '@app/gamification': ['src/backend/gamification-engine/src'],
  '@app/gamification/*': ['src/backend/gamification-engine/src/*'],
  '@app/notification': ['src/backend/notification-service/src'],
  '@app/notification/*': ['src/backend/notification-service/src/*']
};

// Backend-specific path aliases
const BACKEND_ALIASES = {
  '@shared/*': ['shared/src/*'],
  '@gamification/*': ['gamification-engine/src/*'],
  '@prisma/*': ['shared/prisma/*'],
  '@austa/*': ['packages/*']
};

// Web-specific path aliases
const WEB_ALIASES = {
  '@/*': ['./src/*'],
  '@austa/design-system': ['../design-system/src'],
  '@austa/design-system/*': ['../design-system/src/*'],
  '@design-system/primitives': ['../primitives/src'],
  '@design-system/primitives/*': ['../primitives/src/*'],
  '@austa/interfaces': ['../interfaces'],
  '@austa/interfaces/*': ['../interfaces/*'],
  '@austa/journey-context': ['../journey-context/src'],
  '@austa/journey-context/*': ['../journey-context/src/*'],
  'shared/*': ['../shared/*']
};

/**
 * Helper Functions
 */

// Logs a message with a colored prefix
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m' // Reset
  };

  const prefix = {
    info: 'ℹ️ INFO',
    success: '✅ SUCCESS',
    warning: '⚠️ WARNING',
    error: '❌ ERROR'
  };

  console.log(`${colors[type]}${prefix[type]}${colors.reset} ${message}`);
}

// Finds all TypeScript configuration files in a directory (recursively)
function findTsConfigFiles(dir, results = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('dist')) {
      findTsConfigFiles(filePath, results);
    } else if (file === 'tsconfig.json') {
      results.push(filePath);
    }
  }

  return results;
}

// Reads and parses a JSON file
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`Failed to read or parse ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

// Writes a JSON object to a file
function writeJsonFile(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    log(`Failed to write to ${filePath}: ${error.message}`, 'error');
    return false;
  }
}

// Checks if a package is installed
function isPackageInstalled(packageName, cwd) {
  try {
    execSync(`npm list ${packageName} --depth=0`, { cwd, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Installs a package if it's not already installed
function ensurePackageInstalled(packageName, cwd, isDev = true) {
  if (!isPackageInstalled(packageName, cwd)) {
    log(`Installing ${packageName} in ${cwd}...`, 'info');
    try {
      execSync(`npm install ${isDev ? '--save-dev' : '--save'} ${packageName}`, { cwd, stdio: 'inherit' });
      log(`Installed ${packageName} successfully.`, 'success');
      return true;
    } catch (error) {
      log(`Failed to install ${packageName}: ${error.message}`, 'error');
      return false;
    }
  }
  return true;
}

/**
 * Main Functions
 */

// Updates path aliases in a tsconfig.json file
function updateTsConfigPathAliases(tsConfigPath) {
  const tsConfig = readJsonFile(tsConfigPath);
  if (!tsConfig) return false;

  // Ensure compilerOptions and paths exist
  if (!tsConfig.compilerOptions) {
    tsConfig.compilerOptions = {};
  }
  
  if (!tsConfig.compilerOptions.paths) {
    tsConfig.compilerOptions.paths = {};
  }

  // Determine which aliases to apply based on the location of the tsconfig.json file
  let aliasesToApply = {};
  const relativePath = path.relative(REPO_ROOT, tsConfigPath);
  
  if (relativePath.startsWith('src/backend')) {
    // Backend tsconfig.json
    aliasesToApply = { ...BACKEND_ALIASES };
    
    // For the root backend tsconfig.json, also add journey aliases
    if (path.dirname(tsConfigPath) === BACKEND_ROOT) {
      aliasesToApply = { ...aliasesToApply, ...JOURNEY_ALIASES };
    }
    
    // Ensure baseUrl is set correctly for backend
    tsConfig.compilerOptions.baseUrl = '.';
  } else if (relativePath.startsWith('src/web')) {
    // Web tsconfig.json
    aliasesToApply = { ...WEB_ALIASES };
    
    // For packages in the web workspace, adjust paths to be relative to the package
    if (path.dirname(tsConfigPath) !== WEB_ROOT) {
      // This is a package within the web workspace, adjust paths accordingly
      const packageRelativePath = path.relative(path.dirname(tsConfigPath), WEB_ROOT);
      
      // Create package-specific aliases
      aliasesToApply = Object.entries(WEB_ALIASES).reduce((acc, [alias, paths]) => {
        acc[alias] = paths.map(p => {
          if (p.startsWith('./')) {
            return p; // Keep local paths as is
          } else if (p.startsWith('../')) {
            // Adjust relative paths based on package location
            return path.join(packageRelativePath, p);
          }
          return p;
        });
        return acc;
      }, {});
      
      // Ensure baseUrl is set correctly for the package
      tsConfig.compilerOptions.baseUrl = '.';
    } else {
      // Root web tsconfig.json
      tsConfig.compilerOptions.baseUrl = '.';
    }
  } else {
    // For other tsconfig.json files, apply NEW_PACKAGES aliases
    aliasesToApply = { ...NEW_PACKAGES };
    tsConfig.compilerOptions.baseUrl = '.';
  }

  // Apply the aliases
  let pathsUpdated = false;
  for (const [alias, paths] of Object.entries(aliasesToApply)) {
    // Check if the alias already exists with the same paths
    const existingPaths = tsConfig.compilerOptions.paths[alias];
    if (JSON.stringify(existingPaths) !== JSON.stringify(paths)) {
      tsConfig.compilerOptions.paths[alias] = paths;
      pathsUpdated = true;
    }
  }

  // Ensure other important compiler options are set
  const compilerOptionsToEnsure = {
    esModuleInterop: true,
    resolveJsonModule: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  };

  for (const [option, value] of Object.entries(compilerOptionsToEnsure)) {
    if (tsConfig.compilerOptions[option] !== value) {
      tsConfig.compilerOptions[option] = value;
      pathsUpdated = true;
    }
  }

  // Write the updated tsconfig.json if changes were made
  if (pathsUpdated) {
    log(`Updating path aliases in ${tsConfigPath}`, 'info');
    return writeJsonFile(tsConfigPath, tsConfig);
  }

  log(`No changes needed for ${tsConfigPath}`, 'info');
  return true;
}

// Updates package.json to add tsc-alias for build scripts
function updatePackageJsonBuildScripts(packageJsonPath) {
  const packageJson = readJsonFile(packageJsonPath);
  if (!packageJson) return false;

  // Skip if no scripts section
  if (!packageJson.scripts) return true;

  let scriptsUpdated = false;
  const scriptsToUpdate = ['build', 'build:prod', 'build:dev'];

  for (const scriptName of scriptsToUpdate) {
    const script = packageJson.scripts[scriptName];
    if (script && script.includes('tsc') && !script.includes('tsc-alias')) {
      // Add tsc-alias to the build script
      packageJson.scripts[scriptName] = `${script} && tsc-alias`;
      scriptsUpdated = true;
    }
  }

  // Write the updated package.json if changes were made
  if (scriptsUpdated) {
    log(`Updating build scripts in ${packageJsonPath}`, 'info');
    
    // Ensure tsc-alias is installed
    const packageDir = path.dirname(packageJsonPath);
    ensurePackageInstalled('tsc-alias', packageDir, true);
    
    return writeJsonFile(packageJsonPath, packageJson);
  }

  return true;
}

// Main function to set up path aliases across the monorepo
async function setupPathAliases() {
  log('Starting path alias setup across the monorepo...', 'info');

  // Find all tsconfig.json files
  log('Finding all TypeScript configuration files...', 'info');
  const tsConfigFiles = [
    ...findTsConfigFiles(BACKEND_ROOT),
    ...findTsConfigFiles(WEB_ROOT)
  ];
  log(`Found ${tsConfigFiles.length} TypeScript configuration files.`, 'info');

  // Update path aliases in all tsconfig.json files
  let tsConfigUpdated = 0;
  for (const tsConfigPath of tsConfigFiles) {
    if (updateTsConfigPathAliases(tsConfigPath)) {
      tsConfigUpdated++;
    }
  }
  log(`Updated path aliases in ${tsConfigUpdated} TypeScript configuration files.`, 'success');

  // Find all package.json files
  log('Finding all package.json files...', 'info');
  const packageJsonFiles = [];
  const dirsToSearch = [BACKEND_ROOT, WEB_ROOT];
  
  for (const dir of dirsToSearch) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        const packageJsonPath = path.join(filePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          packageJsonFiles.push(packageJsonPath);
        }
      }
    }
    
    // Also check the root package.json
    const rootPackageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
      packageJsonFiles.push(rootPackageJsonPath);
    }
  }
  
  log(`Found ${packageJsonFiles.length} package.json files.`, 'info');

  // Update build scripts in all package.json files
  let packageJsonUpdated = 0;
  for (const packageJsonPath of packageJsonFiles) {
    if (updatePackageJsonBuildScripts(packageJsonPath)) {
      packageJsonUpdated++;
    }
  }
  log(`Updated build scripts in ${packageJsonUpdated} package.json files.`, 'success');

  // Create verification script
  log('Creating path verification script...', 'info');
  createPathVerificationScript();

  log('Path alias setup completed successfully!', 'success');
  log('To verify path aliases are working correctly, run: node scripts/verify-path-aliases.js', 'info');
}

// Creates a script to verify path aliases are working correctly
function createPathVerificationScript() {
  const verifyScriptPath = path.join(REPO_ROOT, 'scripts', 'verify-path-aliases.js');
  const verifyScriptContent = `#!/usr/bin/env node

// Make this script executable with: chmod +x scripts/setup-path-aliases.js

/**
 * verify-path-aliases.js
 * 
 * This script verifies that TypeScript path aliases are working correctly.
 * It checks that all configured path aliases resolve to existing files or directories.
 */

const fs = require('fs');
const path = require('path');

// Constants
const REPO_ROOT = path.resolve(__dirname, '..');
const BACKEND_ROOT = path.join(REPO_ROOT, 'src', 'backend');
const WEB_ROOT = path.join(REPO_ROOT, 'src', 'web');

// Helper function to log messages
function log(message, type = 'info') {
  const colors = {
    info: '\\x1b[36m', // Cyan
    success: '\\x1b[32m', // Green
    warning: '\\x1b[33m', // Yellow
    error: '\\x1b[31m', // Red
    reset: '\\x1b[0m' // Reset
  };

  const prefix = {
    info: 'ℹ️ INFO',
    success: '✅ SUCCESS',
    warning: '⚠️ WARNING',
    error: '❌ ERROR'
  };

  console.log(`${colors[type]}${prefix[type]}${colors.reset} ${message}`);
}

// Reads and parses a JSON file
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(`Failed to read or parse ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

// Verifies that a path exists
function verifyPathExists(basePath, pathToCheck) {
  // Remove wildcards from the path
  const cleanPath = pathToCheck.replace(/\\*$/, '');
  const fullPath = path.join(basePath, cleanPath);
  
  try {
    fs.accessSync(fullPath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// Verifies path aliases in a tsconfig.json file
function verifyTsConfigPathAliases(tsConfigPath) {
  const tsConfig = readJsonFile(tsConfigPath);
  if (!tsConfig || !tsConfig.compilerOptions || !tsConfig.compilerOptions.paths) {
    return { total: 0, valid: 0, invalid: 0, details: [] };
  }

  const baseUrl = tsConfig.compilerOptions.baseUrl || '.';
  const basePath = path.resolve(path.dirname(tsConfigPath), baseUrl);
  const paths = tsConfig.compilerOptions.paths;
  
  const results = {
    total: 0,
    valid: 0,
    invalid: 0,
    details: []
  };

  for (const [alias, pathMappings] of Object.entries(paths)) {
    for (const pathMapping of pathMappings) {
      results.total++;
      
      const exists = verifyPathExists(basePath, pathMapping);
      if (exists) {
        results.valid++;
        results.details.push({
          alias,
          path: pathMapping,
          exists,
          fullPath: path.join(basePath, pathMapping.replace(/\\*$/, ''))
        });
      } else {
        results.invalid++;
        results.details.push({
          alias,
          path: pathMapping,
          exists,
          fullPath: path.join(basePath, pathMapping.replace(/\\*$/, ''))
        });
      }
    }
  }

  return results;
}

// Main function to verify path aliases
function verifyPathAliases() {
  log('Verifying path aliases across the monorepo...', 'info');

  // Check backend root tsconfig.json
  const backendTsConfigPath = path.join(BACKEND_ROOT, 'tsconfig.json');
  if (fs.existsSync(backendTsConfigPath)) {
    log('Verifying backend path aliases...', 'info');
    const backendResults = verifyTsConfigPathAliases(backendTsConfigPath);
    
    log(`Backend path aliases: ${backendResults.valid}/${backendResults.total} valid`, 
      backendResults.invalid === 0 ? 'success' : 'warning');
    
    if (backendResults.invalid > 0) {
      log('Invalid backend path aliases:', 'warning');
      backendResults.details
        .filter(detail => !detail.exists)
        .forEach(detail => {
          log(`  - ${detail.alias} -> ${detail.path} (expected at ${detail.fullPath})`, 'warning');
        });
    }
  } else {
    log('Backend tsconfig.json not found.', 'warning');
  }

  // Check web root tsconfig.json
  const webTsConfigPath = path.join(WEB_ROOT, 'tsconfig.json');
  if (fs.existsSync(webTsConfigPath)) {
    log('\nVerifying web path aliases...', 'info');
    const webResults = verifyTsConfigPathAliases(webTsConfigPath);
    
    log(`Web path aliases: ${webResults.valid}/${webResults.total} valid`, 
      webResults.invalid === 0 ? 'success' : 'warning');
    
    if (webResults.invalid > 0) {
      log('Invalid web path aliases:', 'warning');
      webResults.details
        .filter(detail => !detail.exists)
        .forEach(detail => {
          log(`  - ${detail.alias} -> ${detail.path} (expected at ${detail.fullPath})`, 'warning');
        });
    }
  } else {
    log('Web tsconfig.json not found.', 'warning');
  }

  // Check new packages
  const packagesToCheck = [
    { name: 'Design System', path: path.join(WEB_ROOT, 'design-system', 'tsconfig.json') },
    { name: 'Primitives', path: path.join(WEB_ROOT, 'primitives', 'tsconfig.json') },
    { name: 'Interfaces', path: path.join(WEB_ROOT, 'interfaces', 'tsconfig.json') },
    { name: 'Journey Context', path: path.join(WEB_ROOT, 'journey-context', 'tsconfig.json') }
  ];

  for (const pkg of packagesToCheck) {
    if (fs.existsSync(pkg.path)) {
      log(`\nVerifying ${pkg.name} path aliases...`, 'info');
      const results = verifyTsConfigPathAliases(pkg.path);
      
      log(`${pkg.name} path aliases: ${results.valid}/${results.total} valid`, 
        results.invalid === 0 ? 'success' : 'warning');
      
      if (results.invalid > 0) {
        log(`Invalid ${pkg.name} path aliases:`, 'warning');
        results.details
          .filter(detail => !detail.exists)
          .forEach(detail => {
            log(`  - ${detail.alias} -> ${detail.path} (expected at ${detail.fullPath})`, 'warning');
          });
      }
    } else {
      log(`${pkg.name} tsconfig.json not found.`, 'warning');
    }
  }

  log('\nPath alias verification completed!', 'success');
  log('If any path aliases are invalid, you may need to create the missing directories or files.', 'info');
}

// Run the verification
verifyPathAliases();
`;

  fs.writeFileSync(verifyScriptPath, verifyScriptContent, 'utf8');
  fs.chmodSync(verifyScriptPath, '755'); // Make executable
  log(`Created verification script at ${verifyScriptPath}`, 'success');
}

// Run the script
setupPathAliases().catch(error => {
  log(`Error: ${error.message}`, 'error');
  process.exit(1);
});