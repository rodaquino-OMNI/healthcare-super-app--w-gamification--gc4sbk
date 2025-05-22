#!/usr/bin/env node

/**
 * AUSTA SuperApp Build Optimization Script
 * 
 * This script implements build optimization for the monorepo by:
 * - Configuring proper caching strategies
 * - Determining efficient build order based on dependencies
 * - Setting up incremental builds for better performance
 * - Providing a watch mode for development
 * - Implementing build validation and verification
 * 
 * Usage:
 *   node optimize-build.js [options]
 * 
 * Options:
 *   --watch          Enable watch mode for continuous compilation
 *   --incremental    Enable incremental builds (default: true)
 *   --cache          Enable build caching (default: true)
 *   --validate       Validate build outputs (default: true)
 *   --verbose        Enable verbose logging
 *   --package-manager Specify package manager (yarn, npm, pnpm) (default: pnpm)
 *   --help           Show help
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Import build tools
const buildOrder = require('../build/build-order');
const optimizeCache = require('../build/optimize-cache');
const typescriptConfig = require('../build/typescript-config');
const fixPaths = require('../build/fix-paths');
const validateDeps = require('../build/validate-deps');

// Constants
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BACKEND_ROOT = path.resolve(REPO_ROOT, 'src/backend');
const WEB_ROOT = path.resolve(REPO_ROOT, 'src/web');
const SERVICES = [
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

// Web packages including the new required packages
const WEB_PACKAGES = [
  'design-system',
  'primitives',
  'interfaces',
  'journey-context',
  'shared',
  'mobile',
  'web'
];

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  watch: args.includes('--watch'),
  incremental: !args.includes('--no-incremental'),
  cache: !args.includes('--no-cache'),
  validate: !args.includes('--no-validate'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help'),
  packageManager: 'pnpm' // Default to pnpm as specified in the technical spec
};

// Check for package manager override
const packageManagerIndex = args.findIndex(arg => arg === '--package-manager');
if (packageManagerIndex !== -1 && args.length > packageManagerIndex + 1) {
  const specifiedManager = args[packageManagerIndex + 1];
  if (['npm', 'yarn', 'pnpm'].includes(specifiedManager)) {
    options.packageManager = specifiedManager;
  } else {
    log(`Invalid package manager specified: ${specifiedManager}. Using default: pnpm`, 'warn');
  }
}

// Required Node.js version check (18.15.0 or higher as specified in the technical spec)
function checkNodeVersion() {
  const requiredVersion = '18.15.0';
  const currentVersion = process.version.slice(1); // Remove the 'v' prefix
  
  const current = currentVersion.split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  // Compare major, minor, and patch versions
  for (let i = 0; i < 3; i++) {
    if (current[i] > required[i]) return true;
    if (current[i] < required[i]) {
      log(`Node.js version ${requiredVersion} or higher is required. Current version: ${currentVersion}`, 'error');
      return false;
    }
  }
  
  return true;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
  AUSTA SuperApp Build Optimization Script

  Usage:
    node optimize-build.js [options]

  Options:
    --watch             Enable watch mode for continuous compilation
    --no-incremental    Disable incremental builds
    --no-cache          Disable build caching
    --no-validate       Disable build validation
    --verbose           Enable verbose logging
    --package-manager   Specify package manager (yarn, npm, pnpm) (default: pnpm)
    --help              Show this help
  `);
  process.exit(0);
}

/**
 * Log message with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    case 'debug':
      if (options.verbose) {
        console.log(`${prefix} ${message}`);
      }
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Execute a command and return its output
 * @param {string} command - Command to execute
 * @param {object} options - Options for child_process.execSync
 * @returns {string} - Command output
 */
function execute(command, options = {}) {
  try {
    log(`Executing: ${command}`, 'debug');
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(error.message, 'error');
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

/**
 * Check if TypeScript is installed
 * @returns {boolean} - True if TypeScript is installed
 */
function checkTypeScriptInstalled() {
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the package manager command prefix
 * @param {string} command - The command to run
 * @returns {string} - The prefixed command
 */
function getPackageManagerCommand(command) {
  switch (options.packageManager) {
    case 'yarn':
      return `yarn ${command}`;
    case 'pnpm':
      return `pnpm ${command}`;
    case 'npm':
    default:
      return `npm ${command}`;
  }
}

/**
 * Install a package using the configured package manager
 * @param {string} packageName - The package to install
 * @param {boolean} isDev - Whether to install as a dev dependency
 * @returns {void}
 */
function installPackage(packageName, isDev = true) {
  const devFlag = isDev ? 
    (options.packageManager === 'npm' ? '--save-dev' : 
     options.packageManager === 'yarn' ? '--dev' : 
     '-D') : '';
  
  const freezeFlag = options.packageManager === 'pnpm' ? '--frozen-lockfile' : 
                     options.packageManager === 'yarn' ? '--frozen-lockfile' : 
                     '--no-save';
  
  const installCmd = `${options.packageManager} add ${packageName} ${devFlag} ${freezeFlag}`;
  execute(installCmd);
}

/**
 * Configure TypeScript for incremental builds
 */
async function configureIncrementalBuilds() {
  log('Configuring TypeScript for incremental builds...');
  
  // Ensure TypeScript is installed
  if (!checkTypeScriptInstalled()) {
    log('TypeScript is not installed. Installing...', 'warn');
    installPackage('typescript@5.3.3');
  }
  
  // Configure TypeScript for incremental builds
  await typescriptConfig.configure({
    incremental: true,
    composite: true,
    tsBuildInfoFile: './tsconfig.tsbuildinfo',
    // Additional compiler options as specified in the technical spec
    compilerOptions: {
      target: 'ES2022',
      module: 'CommonJS',
      moduleResolution: 'node',
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true
    }
  });
  
  log('TypeScript configured for incremental builds', 'info');
}

/**
 * Configure caching for faster builds
 */
async function configureCaching() {
  log('Configuring build caching...');
  
  // Configure caching using optimize-cache.js
  await optimizeCache.configure({
    enableNodeModulesCache: true,
    enableTypeScriptCache: true,
    enableDockerLayerCache: true,
    cacheKeyStrategy: 'lockfile-hash',
    // Additional caching options as specified in the technical spec
    workspaceSpecificCaching: true,
    packageManager: options.packageManager,
    cacheLocation: {
      nodeModules: '**/node_modules',
      buildCache: '/tmp/.buildx-cache',
      tsBuildInfo: '**/*.tsbuildinfo'
    },
    // GitHub Actions specific configuration
    ciProvider: 'github-actions',
    cacheActionVersion: 'v3'
  });
  
  log('Build caching configured', 'info');
}

/**
 * Determine optimal build order based on dependencies
 * @returns {Array<string>} - Ordered list of packages to build
 */
async function determineBuildOrder() {
  log('Determining optimal build order...');
  
  // Get build order using build-order.js
  const orderedPackages = await buildOrder.getOrderedPackages();
  
  log(`Build order determined: ${orderedPackages.join(' -> ')}`, 'info');
  return orderedPackages;
}

/**
 * Fix path resolution issues
 */
async function fixPathResolution() {
  log('Fixing path resolution issues...');
  
  // Fix paths using fix-paths.js
  await fixPaths.fix();
  
  log('Path resolution issues fixed', 'info');
}

/**
 * Validate dependencies
 */
async function validateDependencies() {
  log('Validating dependencies...');
  
  // Validate dependencies using validate-deps.js with enhanced validation as per technical spec
  const validationResult = await validateDeps.validate({
    validateVersionConflicts: true,
    validateCircularDependencies: true,
    validatePeerDependencies: true,
    // Specific packages to check for version conflicts as mentioned in the technical spec
    criticalPackages: ['minimatch', 'semver', 'ws', 'axios'],
    // Validate TypeScript project references
    validateTsReferences: true,
    // Validate workspace dependencies
    validateWorkspaces: true,
    // Run npm/pnpm ls to check for missing dependencies
    runDependencyListing: true,
    packageManager: options.packageManager
  });
  
  if (validationResult.hasIssues) {
    log('Dependency validation found issues:', 'warn');
    validationResult.issues.forEach(issue => {
      log(`- ${issue}`, 'warn');
    });
    
    if (validationResult.hasCriticalIssues) {
      throw new Error('Critical dependency issues found. Build cannot proceed.');
    }
  } else {
    log('Dependencies validated successfully', 'info');
  }
  
  // Additional TypeScript validation as specified in the technical spec
  log('Running TypeScript build validation...');
  try {
    execute(`npx tsc --build --all --verbose`, { cwd: BACKEND_ROOT, silent: true });
    log('TypeScript build validation successful', 'info');
  } catch (error) {
    log('TypeScript build validation failed', 'error');
    throw new Error('TypeScript build validation failed. Build cannot proceed.');
  }
}

/**
 * Build a specific package
 * @param {string} packageName - Name of the package to build
 * @param {object} buildOptions - Build options
 * @param {string} [rootPath=BACKEND_ROOT] - Root path for the package
 */
async function buildPackage(packageName, buildOptions = {}, rootPath = BACKEND_ROOT) {
  const packagePath = path.join(rootPath, packageName);
  
  // Skip if package doesn't exist
  if (!fs.existsSync(packagePath)) {
    log(`Package ${packageName} not found at ${packagePath}, skipping`, 'warn');
    return;
  }
  
  log(`Building package: ${packageName}...`);
  
  // Determine build command based on package type
  let buildCommand = 'npx tsc -b';
  
  if (options.incremental) {
    buildCommand += ' --incremental';
  }
  
  if (buildOptions.watch) {
    buildCommand += ' --watch';
  }
  
  // Check if package has a custom build script
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.scripts && packageJson.scripts.build) {
      // Use the configured package manager instead of hardcoded npm
      buildCommand = `${getPackageManagerCommand('run build')}`;
      if (buildOptions.watch && packageJson.scripts['build:watch']) {
        buildCommand = `${getPackageManagerCommand('run build:watch')}`;
      }
    }
  }
  
  // Execute build command
  try {
    if (buildOptions.watch) {
      // For watch mode, we need to use spawn instead of execSync
      log(`Starting watch mode for ${packageName}...`);
      const [cmd, ...args] = buildCommand.split(' ');
      const child = spawn(cmd, args, { 
        cwd: packagePath,
        stdio: 'inherit',
        shell: true
      });
      
      child.on('error', (error) => {
        log(`Watch process error for ${packageName}: ${error.message}`, 'error');
      });
      
      // We don't wait for the child process to exit in watch mode
      return child;
    } else {
      execute(buildCommand, { cwd: packagePath });
      log(`Package ${packageName} built successfully`, 'info');
    }
  } catch (error) {
    log(`Failed to build package ${packageName}`, 'error');
    throw error;
  }
}

/**
 * Validate build outputs
 * @param {Array<string>} packages - List of packages to validate
 */
async function validateBuildOutputs(packages) {
  log('Validating build outputs...');
  
  for (const packageName of packages) {
    const packagePath = path.join(BACKEND_ROOT, packageName);
    
    // Skip if package doesn't exist
    if (!fs.existsSync(packagePath)) {
      continue;
    }
    
    // Check for dist directory
    const distPath = path.join(packagePath, 'dist');
    if (!fs.existsSync(distPath)) {
      log(`Package ${packageName} has no dist directory`, 'warn');
      continue;
    }
    
    // Check if dist directory is empty
    const distFiles = fs.readdirSync(distPath);
    if (distFiles.length === 0) {
      log(`Package ${packageName} has an empty dist directory`, 'warn');
      continue;
    }
    
    // Check for declaration files if it's a library
    const packageJsonPath = path.join(packagePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.types || packageJson.typings) {
        const typesFile = packageJson.types || packageJson.typings;
        const typesPath = path.join(packagePath, typesFile);
        
        if (!fs.existsSync(typesPath)) {
          log(`Package ${packageName} is missing its declaration file: ${typesFile}`, 'warn');
        }
      }
    }
    
    log(`Package ${packageName} build output validated`, 'debug');
  }
  
  log('Build outputs validated', 'info');
}

/**
 * Clean build artifacts
 * @param {Array<string>} packages - List of packages to clean
 */
async function cleanBuildArtifacts(packages) {
  log('Cleaning build artifacts...');
  
  for (const packageName of packages) {
    const packagePath = path.join(BACKEND_ROOT, packageName);
    
    // Skip if package doesn't exist
    if (!fs.existsSync(packagePath)) {
      continue;
    }
    
    // Clean dist directory
    const distPath = path.join(packagePath, 'dist');
    if (fs.existsSync(distPath)) {
      log(`Cleaning dist directory for ${packageName}...`, 'debug');
      execute(`rm -rf ${distPath}`, { cwd: packagePath, silent: true });
    }
    
    // Clean tsbuildinfo files
    const tsBuildInfoPath = path.join(packagePath, 'tsconfig.tsbuildinfo');
    if (fs.existsSync(tsBuildInfoPath)) {
      log(`Cleaning tsbuildinfo for ${packageName}...`, 'debug');
      fs.unlinkSync(tsBuildInfoPath);
    }
  }
  
  log('Build artifacts cleaned', 'info');
}

/**
 * Build web packages
 * @param {boolean} watchMode - Whether to use watch mode
 */
async function buildWebPackages(watchMode = false) {
  log('Building web packages...');
  
  // Build the new required packages first
  const criticalPackages = ['primitives', 'interfaces', 'journey-context', 'design-system'];
  
  // Build critical packages first
  for (const packageName of criticalPackages) {
    await buildPackage(packageName, { watch: watchMode }, WEB_ROOT);
  }
  
  // Build remaining web packages
  const remainingPackages = WEB_PACKAGES.filter(pkg => !criticalPackages.includes(pkg));
  for (const packageName of remainingPackages) {
    await buildPackage(packageName, { watch: watchMode }, WEB_ROOT);
  }
  
  log('Web packages built successfully', 'info');
}

/**
 * Main function to run the build optimization
 */
async function main() {
  try {
    // Show help if requested
    if (options.help) {
      showHelp();
      return;
    }
    
    // Check Node.js version
    if (!checkNodeVersion()) {
      process.exit(1);
    }
    
    log('Starting build optimization...');
    
    // Step 1: Validate dependencies
    await validateDependencies();
    
    // Step 2: Fix path resolution issues
    await fixPathResolution();
    
    // Step 3: Configure incremental builds if enabled
    if (options.incremental) {
      await configureIncrementalBuilds();
    }
    
    // Step 4: Configure caching if enabled
    if (options.cache) {
      await configureCaching();
    }
    
    // Step 5: Determine build order for backend packages
    const orderedBackendPackages = await determineBuildOrder();
    
    // Step 6: Build packages in order
    if (options.watch) {
      log('Starting watch mode for all packages...');
      // In watch mode, we start all builds concurrently
      const watchProcesses = [];
      
      // Start backend packages
      for (const packageName of orderedBackendPackages) {
        const process = await buildPackage(packageName, { watch: true });
        if (process) {
          watchProcesses.push(process);
        }
      }
      
      // Start web packages
      await buildWebPackages(true);
      
      // Keep the script running until Ctrl+C
      log('Watch mode active. Press Ctrl+C to stop.');
      process.on('SIGINT', () => {
        log('Stopping watch mode...');
        watchProcesses.forEach(proc => {
          if (!proc.killed) {
            proc.kill();
          }
        });
        process.exit(0);
      });
    } else {
      // In normal mode, build packages sequentially
      
      // Build backend packages
      for (const packageName of orderedBackendPackages) {
        await buildPackage(packageName);
      }
      
      // Build web packages
      await buildWebPackages();
      
      // Step 7: Validate build outputs if enabled
      if (options.validate) {
        await validateBuildOutputs(orderedBackendPackages);
        // Also validate web packages
        await validateBuildOutputs(WEB_PACKAGES.map(pkg => path.join(WEB_ROOT, pkg)));
      }
      
      log('Build optimization completed successfully!');
    }
  } catch (error) {
    log(`Build optimization failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export functions for programmatic use
module.exports = {
  configureIncrementalBuilds,
  configureCaching,
  determineBuildOrder,
  fixPathResolution,
  validateDependencies,
  buildPackage,
  validateBuildOutputs,
  cleanBuildArtifacts,
  buildWebPackages,
  checkNodeVersion,
  getPackageManagerCommand,
  installPackage
};