#!/usr/bin/env node

/**
 * AUSTA SuperApp Build Optimization Script
 * 
 * This script optimizes the build process for the AUSTA SuperApp monorepo by:
 * 1. Analyzing the dependency graph to determine optimal build order
 * 2. Configuring TypeScript project references for incremental builds
 * 3. Setting up caching strategies for faster builds
 * 4. Implementing build validation and verification
 * 
 * Usage: node optimize-build.js [options]
 * 
 * Options:
 *   --watch          Enable watch mode for development
 *   --clean          Clean cache before building
 *   --validate       Run validation after build
 *   --verbose        Show detailed output
 *   --help           Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '../../../'),
  backendDir: path.resolve(__dirname, '../../../backend'),
  webDir: path.resolve(__dirname, '../../../web'),
  cacheDir: path.resolve(__dirname, '../../../.build-cache'),
  tsconfigCache: path.resolve(__dirname, '../../../.build-cache/tsconfig'),
  nodeModulesCache: path.resolve(__dirname, '../../../.build-cache/node_modules'),
  // Services in dependency order (base services first)
  backendServices: [
    'shared',
    'packages/interfaces',
    'packages/database',
    'packages/errors',
    'packages/events',
    'packages/logging',
    'packages/tracing',
    'packages/utils',
    'packages/auth',
    'auth-service',
    'health-service',
    'care-service',
    'plan-service',
    'gamification-engine',
    'notification-service',
    'api-gateway'
  ],
  // Web packages in dependency order (base packages first)
  webPackages: [
    'primitives',
    'interfaces',
    'design-system',
    'journey-context',
    'shared',
    'mobile',
    'web'
  ],
  // Build hash inputs for cache invalidation
  hashInputs: [
    'package.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'tsconfig.json',
    '.eslintrc.js',
    'babel.config.js',
    'jest.config.js'
  ]
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  watch: args.includes('--watch'),
  clean: args.includes('--clean'),
  validate: args.includes('--validate'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help')
};

// Show help and exit
if (options.help) {
  console.log(`
  AUSTA SuperApp Build Optimization Script

  Usage: node optimize-build.js [options]

  Options:
    --watch          Enable watch mode for development
    --clean          Clean cache before building
    --validate       Run validation after build
    --verbose        Show detailed output
    --help           Show this help message
  `);
  process.exit(0);
}

/**
 * Logger utility with colored output
 */
class Logger {
  static info(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
  }

  static success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }

  static warning(message) {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${message}`);
  }

  static error(message) {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }

  static debug(message) {
    if (options.verbose) {
      console.log(`\x1b[90m[DEBUG]\x1b[0m ${message}`);
    }
  }

  static startTask(task) {
    console.log(`\x1b[36m[TASK]\x1b[0m Starting: ${task}...`);
  }

  static endTask(task, success = true) {
    if (success) {
      console.log(`\x1b[32m[TASK]\x1b[0m Completed: ${task}`);
    } else {
      console.error(`\x1b[31m[TASK]\x1b[0m Failed: ${task}`);
    }
  }
}

/**
 * Utility to calculate hash for cache invalidation
 * @param {string} content - Content to hash
 * @returns {string} - Hash string
 */
function calculateHash(content) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Creates directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    Logger.debug(`Created directory: ${dir}`);
  }
}

/**
 * Cleans the build cache
 */
async function cleanCache() {
  Logger.startTask('Cleaning build cache');
  
  if (fs.existsSync(CONFIG.cacheDir)) {
    fs.rmSync(CONFIG.cacheDir, { recursive: true, force: true });
    Logger.debug(`Removed cache directory: ${CONFIG.cacheDir}`);
  }
  
  // Recreate cache directories
  ensureDir(CONFIG.cacheDir);
  ensureDir(CONFIG.tsconfigCache);
  ensureDir(CONFIG.nodeModulesCache);
  
  // Clean TypeScript build info files
  for (const service of CONFIG.backendServices) {
    const tsBuildInfoPath = path.join(CONFIG.backendDir, service, 'tsconfig.tsbuildinfo');
    if (fs.existsSync(tsBuildInfoPath)) {
      fs.unlinkSync(tsBuildInfoPath);
      Logger.debug(`Removed build info: ${tsBuildInfoPath}`);
    }
  }
  
  Logger.endTask('Cleaning build cache');
}

/**
 * Analyzes package dependencies to determine build order
 * @returns {Object} - Dependency graph and topological sort
 */
async function analyzeDependencies() {
  Logger.startTask('Analyzing dependencies');
  
  const dependencyGraph = {};
  const packageJsonCache = {};
  
  // Helper to read package.json
  const readPackageJson = (dir) => {
    const packageJsonPath = path.join(dir, 'package.json');
    if (packageJsonCache[packageJsonPath]) {
      return packageJsonCache[packageJsonPath];
    }
    
    if (fs.existsSync(packageJsonPath)) {
      try {
        const content = fs.readFileSync(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        packageJsonCache[packageJsonPath] = packageJson;
        return packageJson;
      } catch (error) {
        Logger.warning(`Failed to parse package.json at ${packageJsonPath}: ${error.message}`);
        return {};
      }
    }
    
    return {};
  };
  
  // Analyze backend services
  for (const service of CONFIG.backendServices) {
    const serviceDir = path.join(CONFIG.backendDir, service);
    const packageJson = readPackageJson(serviceDir);
    
    dependencyGraph[service] = {
      name: service,
      dependencies: [],
      packageName: packageJson.name || service,
      path: serviceDir
    };
    
    // Extract dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    // Map dependencies to services
    for (const otherService of CONFIG.backendServices) {
      if (service === otherService) continue;
      
      const otherServiceDir = path.join(CONFIG.backendDir, otherService);
      const otherPackageJson = readPackageJson(otherServiceDir);
      
      if (otherPackageJson.name && allDeps[otherPackageJson.name]) {
        dependencyGraph[service].dependencies.push(otherService);
      }
    }
    
    Logger.debug(`Service ${service} depends on: ${dependencyGraph[service].dependencies.join(', ') || 'none'}`);
  }
  
  // Analyze web packages
  for (const pkg of CONFIG.webPackages) {
    const pkgDir = path.join(CONFIG.webDir, pkg);
    const packageJson = readPackageJson(pkgDir);
    
    dependencyGraph[`web/${pkg}`] = {
      name: `web/${pkg}`,
      dependencies: [],
      packageName: packageJson.name || pkg,
      path: pkgDir
    };
    
    // Extract dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies
    };
    
    // Map dependencies to packages
    for (const otherPkg of CONFIG.webPackages) {
      if (pkg === otherPkg) continue;
      
      const otherPkgDir = path.join(CONFIG.webDir, otherPkg);
      const otherPackageJson = readPackageJson(otherPkgDir);
      
      if (otherPackageJson.name && allDeps[otherPackageJson.name]) {
        dependencyGraph[`web/${pkg}`].dependencies.push(`web/${otherPkg}`);
      }
    }
    
    Logger.debug(`Package web/${pkg} depends on: ${dependencyGraph[`web/${pkg}`].dependencies.join(', ') || 'none'}`);
  }
  
  // Perform topological sort to determine build order
  const visited = new Set();
  const temp = new Set();
  const order = [];
  
  function visit(node) {
    if (temp.has(node)) {
      throw new Error(`Circular dependency detected: ${node}`);
    }
    
    if (visited.has(node)) return;
    
    temp.add(node);
    
    const deps = dependencyGraph[node].dependencies;
    for (const dep of deps) {
      visit(dep);
    }
    
    temp.delete(node);
    visited.add(node);
    order.push(node);
  }
  
  // Visit all nodes
  for (const node in dependencyGraph) {
    if (!visited.has(node)) {
      try {
        visit(node);
      } catch (error) {
        Logger.error(error.message);
      }
    }
  }
  
  // Reverse to get correct build order (dependencies first)
  order.reverse();
  
  Logger.debug(`Optimized build order: ${order.join(' → ')}`);
  Logger.endTask('Analyzing dependencies');
  
  return { dependencyGraph, buildOrder: order };
}

/**
 * Configures TypeScript project references for incremental builds
 * @param {Object} dependencyGraph - Dependency graph from analyzeDependencies
 */
async function configureTypeScriptProjects(dependencyGraph) {
  Logger.startTask('Configuring TypeScript projects');
  
  // Configure backend services
  for (const service of CONFIG.backendServices) {
    const serviceDir = path.join(CONFIG.backendDir, service);
    const tsconfigPath = path.join(serviceDir, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      Logger.warning(`tsconfig.json not found for ${service}, skipping`);
      continue;
    }
    
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const serviceDeps = dependencyGraph[service]?.dependencies || [];
      
      // Configure project references
      tsconfig.references = serviceDeps.map(dep => ({
        path: path.relative(serviceDir, path.join(CONFIG.backendDir, dep))
      }));
      
      // Ensure composite is enabled for incremental builds
      if (!tsconfig.compilerOptions) {
        tsconfig.compilerOptions = {};
      }
      
      tsconfig.compilerOptions.composite = true;
      tsconfig.compilerOptions.incremental = true;
      
      // Save updated tsconfig
      const tsconfigContent = JSON.stringify(tsconfig, null, 2);
      const tsconfigHash = calculateHash(tsconfigContent);
      const cachedPath = path.join(CONFIG.tsconfigCache, `${service}.json`);
      
      // Only update if changed
      if (!fs.existsSync(cachedPath) || 
          calculateHash(fs.readFileSync(cachedPath, 'utf8')) !== tsconfigHash) {
        fs.writeFileSync(tsconfigPath, tsconfigContent);
        fs.writeFileSync(cachedPath, tsconfigContent);
        Logger.debug(`Updated tsconfig for ${service}`);
      } else {
        Logger.debug(`No changes to tsconfig for ${service}`);
      }
    } catch (error) {
      Logger.error(`Failed to update tsconfig for ${service}: ${error.message}`);
    }
  }
  
  // Create root tsconfig with references to all services
  const rootTsconfig = {
    compilerOptions: {
      composite: true,
      declaration: true,
      declarationMap: true,
      sourceMap: true
    },
    references: CONFIG.backendServices.map(service => ({
      path: `./${service}`
    }))
  };
  
  const rootTsconfigPath = path.join(CONFIG.backendDir, 'tsconfig.json');
  fs.writeFileSync(rootTsconfigPath, JSON.stringify(rootTsconfig, null, 2));
  Logger.debug('Updated root tsconfig.json');
  
  Logger.endTask('Configuring TypeScript projects');
}

/**
 * Sets up caching for faster builds
 */
async function setupCaching() {
  Logger.startTask('Setting up build caching');
  
  // Create cache directories
  ensureDir(CONFIG.cacheDir);
  ensureDir(CONFIG.tsconfigCache);
  ensureDir(CONFIG.nodeModulesCache);
  
  // Generate cache key based on hash inputs
  const hashContents = CONFIG.hashInputs.map(input => {
    const inputPath = path.join(CONFIG.rootDir, input);
    if (fs.existsSync(inputPath)) {
      return fs.readFileSync(inputPath, 'utf8');
    }
    return '';
  }).join('\n');
  
  const cacheKey = calculateHash(hashContents);
  const cacheKeyPath = path.join(CONFIG.cacheDir, 'cache-key');
  
  // Check if cache is valid
  let cacheValid = false;
  if (fs.existsSync(cacheKeyPath)) {
    const existingKey = fs.readFileSync(cacheKeyPath, 'utf8');
    cacheValid = existingKey === cacheKey;
  }
  
  if (!cacheValid) {
    Logger.info('Cache invalidated, updating cache key');
    fs.writeFileSync(cacheKeyPath, cacheKey);
  } else {
    Logger.info('Using existing build cache');
  }
  
  // Create .turbo directory for Turborepo caching
  const turboDir = path.join(CONFIG.rootDir, '.turbo');
  ensureDir(turboDir);
  
  // Configure Turborepo caching for web packages
  const turborcPath = path.join(CONFIG.webDir, '.turborc.json');
  const turboConfig = {
    $schema: 'https://turbo.build/schema.json',
    globalDependencies: CONFIG.hashInputs.map(input => `/${input}`),
    pipeline: {
      build: {
        dependsOn: ['^build'],
        outputs: ['dist/**', '.next/**']
      },
      test: {
        dependsOn: ['^build'],
        outputs: []
      },
      lint: {
        outputs: []
      },
      dev: {
        cache: false,
        persistent: true
      }
    }
  };
  
  fs.writeFileSync(turborcPath, JSON.stringify(turboConfig, null, 2));
  Logger.debug('Updated Turborepo configuration');
  
  Logger.endTask('Setting up build caching');
}

/**
 * Builds backend services in the correct order
 * @param {Array} buildOrder - Ordered list of services to build
 */
async function buildBackendServices(buildOrder) {
  Logger.startTask('Building backend services');
  
  // Filter only backend services from the build order
  const backendServices = buildOrder.filter(service => !service.startsWith('web/'));
  
  // Build TypeScript projects
  try {
    const tscArgs = [
      '--build',
      '--verbose',
      ...(options.watch ? ['--watch'] : [])
    ];
    
    // Execute TypeScript compiler with project references
    const tscProcess = spawn('npx', ['tsc', ...tscArgs], {
      cwd: CONFIG.backendDir,
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      tscProcess.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`TypeScript build failed with code ${code}`));
        }
      });
    });
    
    Logger.success('TypeScript build completed successfully');
  } catch (error) {
    Logger.error(`TypeScript build failed: ${error.message}`);
    process.exit(1);
  }
  
  Logger.endTask('Building backend services');
}

/**
 * Builds web packages using Turborepo
 */
async function buildWebPackages() {
  Logger.startTask('Building web packages');
  
  try {
    const turboArgs = [
      'run',
      'build',
      '--cache-dir=../.turbo',
      ...(options.watch ? ['--watch'] : []),
      ...(options.verbose ? ['--verbose'] : [])
    ];
    
    // Execute Turborepo build
    const turboProcess = spawn('npx', ['turbo', ...turboArgs], {
      cwd: CONFIG.webDir,
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve, reject) => {
      turboProcess.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Turborepo build failed with code ${code}`));
        }
      });
    });
    
    Logger.success('Web packages built successfully');
  } catch (error) {
    Logger.error(`Web packages build failed: ${error.message}`);
    process.exit(1);
  }
  
  Logger.endTask('Building web packages');
}

/**
 * Validates the build output
 */
async function validateBuild() {
  Logger.startTask('Validating build');
  
  // Validate TypeScript output
  try {
    // Check for TypeScript errors
    execSync('npx tsc --noEmit', {
      cwd: CONFIG.rootDir,
      stdio: options.verbose ? 'inherit' : 'pipe'
    });
    
    Logger.success('TypeScript validation passed');
  } catch (error) {
    Logger.error('TypeScript validation failed');
    if (options.verbose) {
      console.error(error.stdout?.toString() || error.message);
    }
    process.exit(1);
  }
  
  // Validate package imports
  try {
    // Simple validation by checking if key files exist
    for (const service of CONFIG.backendServices) {
      const distDir = path.join(CONFIG.backendDir, service, 'dist');
      if (!fs.existsSync(distDir)) {
        throw new Error(`Missing dist directory for ${service}`);
      }
      
      // Check for index.js or main entry point
      const indexPath = path.join(distDir, 'index.js');
      const packageJson = path.join(CONFIG.backendDir, service, 'package.json');
      
      if (fs.existsSync(packageJson)) {
        const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
        const mainFile = pkg.main ? path.join(CONFIG.backendDir, service, pkg.main) : indexPath;
        
        if (!fs.existsSync(mainFile)) {
          throw new Error(`Missing main entry point for ${service}: ${mainFile}`);
        }
      } else if (!fs.existsSync(indexPath)) {
        Logger.warning(`No package.json or index.js found for ${service}`);
      }
    }
    
    Logger.success('Package validation passed');
  } catch (error) {
    Logger.error(`Package validation failed: ${error.message}`);
    process.exit(1);
  }
  
  // Validate circular dependencies
  try {
    execSync('npx madge --circular --extensions ts,tsx src/', {
      cwd: CONFIG.rootDir,
      stdio: options.verbose ? 'inherit' : 'pipe'
    });
    
    Logger.success('No circular dependencies found');
  } catch (error) {
    if (error.status === 1) {
      Logger.warning('Circular dependencies detected');
      if (options.verbose) {
        console.warn(error.stdout?.toString());
      }
    } else {
      Logger.warning('Failed to check circular dependencies');
    }
  }
  
  Logger.endTask('Validating build');
}

/**
 * Main function to run the build optimization
 */
async function main() {
  Logger.info('Starting AUSTA SuperApp build optimization');
  
  try {
    // Clean cache if requested
    if (options.clean) {
      await cleanCache();
    }
    
    // Analyze dependencies to determine build order
    const { dependencyGraph, buildOrder } = await analyzeDependencies();
    
    // Configure TypeScript projects for incremental builds
    await configureTypeScriptProjects(dependencyGraph);
    
    // Set up caching for faster builds
    await setupCaching();
    
    // Build backend services
    await buildBackendServices(buildOrder);
    
    // Build web packages
    await buildWebPackages();
    
    // Validate build if requested
    if (options.validate) {
      await validateBuild();
    }
    
    Logger.success('Build optimization completed successfully');
  } catch (error) {
    Logger.error(`Build optimization failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  Logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});