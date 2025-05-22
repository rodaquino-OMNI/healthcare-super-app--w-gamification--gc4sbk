#!/usr/bin/env node

/**
 * AUSTA SuperApp Build Tools
 * 
 * This is the main entry point for the build tools suite that provides a unified interface
 * for executing dependency validation, path resolution, TypeScript configuration, build ordering,
 * and cache optimization.
 * 
 * It offers both CLI commands for individual tools and a complete build preparation workflow
 * that runs all tools in the optimal sequence.
 * 
 * @version 1.0.0
 * @license MIT
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { program } = require('commander');

// Import build tools
let typescriptConfig, fixPaths, buildOrder, optimizeCache, validateDeps;

try {
  typescriptConfig = require('./typescript-config');
  fixPaths = require('./fix-paths');
  buildOrder = require('./build-order');
  optimizeCache = require('./optimize-cache');
  validateDeps = require('./validate-deps');
} catch (error) {
  console.error(`Error loading build tools: ${error.message}`);
  console.error('Make sure all required build tools are installed.');
  process.exit(1);
}

// Constants
const COLORS = {
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

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Configuration
const DEFAULT_CONFIG = {
  rootDir: process.cwd(),
  logLevel: 'info',
  watch: false,
  ci: false,
  skipCache: false,
  skipDeps: false,
  skipPaths: false,
  skipTsConfig: false,
  skipBuildOrder: false,
  concurrency: 4,
  cacheDir: '.build-cache',
};

// Utility functions
function getMonorepoRoot() {
  let currentDir = process.cwd();
  
  while (currentDir !== '/') {
    if (
      fs.existsSync(path.join(currentDir, 'lerna.json')) ||
      fs.existsSync(path.join(currentDir, 'pnpm-workspace.yaml'))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return process.cwd();
}

function logger(level, message, ...args) {
  const config = program.opts();
  const logLevel = LOG_LEVELS[config.logLevel || DEFAULT_CONFIG.logLevel];
  
  if (LOG_LEVELS[level] > logLevel) return;
  
  const timestamp = new Date().toISOString();
  let prefix = '';
  
  switch (level) {
    case 'error':
      prefix = `${COLORS.red}[ERROR]${COLORS.reset}`;
      break;
    case 'warn':
      prefix = `${COLORS.yellow}[WARN]${COLORS.reset}`;
      break;
    case 'info':
      prefix = `${COLORS.blue}[INFO]${COLORS.reset}`;
      break;
    case 'debug':
      prefix = `${COLORS.dim}[DEBUG]${COLORS.reset}`;
      break;
    default:
      prefix = `[LOG]`;
  }
  
  console.log(`${prefix} ${COLORS.dim}${timestamp}${COLORS.reset} ${message}`, ...args);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    logger('debug', `Running command: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: options.silent ? 'ignore' : 'inherit',
      shell: true,
      ...options,
    });
    
    child.on('close', (code) => {
      if (code !== 0 && !options.ignoreErrors) {
        reject(new Error(`Command failed with exit code ${code}`));
        return;
      }
      resolve(code);
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runWithTimer(name, fn, ...args) {
  const startTime = Date.now();
  logger('info', `${COLORS.cyan}Starting${COLORS.reset} ${COLORS.bright}${name}${COLORS.reset}...`);
  
  try {
    const result = await fn(...args);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger('info', `${COLORS.green}Completed${COLORS.reset} ${COLORS.bright}${name}${COLORS.reset} in ${duration}s`);
    return result;
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger('error', `${COLORS.red}Failed${COLORS.reset} ${COLORS.bright}${name}${COLORS.reset} after ${duration}s`);
    throw error;
  }
}

async function validateEnvironment() {
  logger('debug', 'Validating environment...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const requiredVersion = 'v18.0.0';
  
  if (nodeVersion.localeCompare(requiredVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
    logger('error', `Node.js version ${nodeVersion} is not supported. Please use ${requiredVersion} or higher.`);
    process.exit(1);
  }
  
  // Check for required tools
  try {
    execSync('npm --version', { stdio: 'ignore' });
  } catch (error) {
    logger('error', 'npm is not installed or not in PATH');
    process.exit(1);
  }
  
  try {
    execSync('tsc --version', { stdio: 'ignore' });
  } catch (error) {
    logger('error', 'TypeScript is not installed or not in PATH');
    process.exit(1);
  }
  
  // Check if we're in a monorepo
  const monorepoRoot = getMonorepoRoot();
  if (monorepoRoot !== process.cwd()) {
    logger('info', `Monorepo root detected at: ${monorepoRoot}`);
    process.chdir(monorepoRoot);
  }
  
  logger('debug', 'Environment validation complete');
}

// Build tool functions
async function validateDependencies(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  
  if (config.skipDeps) {
    logger('info', 'Skipping dependency validation');
    return;
  }
  
  return runWithTimer('dependency validation', async () => {
    try {
      await validateDeps.validate({
        rootDir: config.rootDir,
        ci: config.ci,
        fix: !config.ci,
      });
      logger('info', 'Dependency validation successful');
    } catch (error) {
      logger('error', 'Dependency validation failed:', error.message);
      if (config.ci) {
        throw error;
      }
    }
  });
}

async function fixPathResolution(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  
  if (config.skipPaths) {
    logger('info', 'Skipping path resolution fixes');
    return;
  }
  
  return runWithTimer('path resolution fixes', async () => {
    try {
      await fixPaths.fix({
        rootDir: config.rootDir,
        ci: config.ci,
        fix: !config.ci,
      });
      logger('info', 'Path resolution fixes applied successfully');
    } catch (error) {
      logger('error', 'Path resolution fixes failed:', error.message);
      if (config.ci) {
        throw error;
      }
    }
  });
}

async function setupTypeScriptConfig(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  
  if (config.skipTsConfig) {
    logger('info', 'Skipping TypeScript configuration');
    return;
  }
  
  return runWithTimer('TypeScript configuration', async () => {
    try {
      await typescriptConfig.setup({
        rootDir: config.rootDir,
        ci: config.ci,
        fix: !config.ci,
      });
      logger('info', 'TypeScript configuration applied successfully');
    } catch (error) {
      logger('error', 'TypeScript configuration failed:', error.message);
      if (config.ci) {
        throw error;
      }
    }
  });
}

async function determineBuildOrder(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  
  if (config.skipBuildOrder) {
    logger('info', 'Skipping build order determination');
    return [];
  }
  
  return runWithTimer('build order determination', async () => {
    try {
      const order = await buildOrder.determine({
        rootDir: config.rootDir,
        ci: config.ci,
      });
      logger('info', 'Build order determined successfully');
      logger('debug', 'Build order:', order);
      return order;
    } catch (error) {
      logger('error', 'Build order determination failed:', error.message);
      if (config.ci) {
        throw error;
      }
      return [];
    }
  });
}

async function setupBuildCache(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  
  if (config.skipCache) {
    logger('info', 'Skipping build cache setup');
    return;
  }
  
  return runWithTimer('build cache setup', async () => {
    try {
      await optimizeCache.setup({
        rootDir: config.rootDir,
        cacheDir: config.cacheDir,
        ci: config.ci,
      });
      logger('info', 'Build cache setup successful');
    } catch (error) {
      logger('error', 'Build cache setup failed:', error.message);
      if (config.ci) {
        throw error;
      }
    }
  });
}

async function runBuild(packages, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...program.opts(), ...options };
  const buildCommand = config.watch ? 'tsc --build --watch' : 'tsc --build';
  
  return runWithTimer('build process', async () => {
    if (!packages || packages.length === 0) {
      logger('info', 'No packages to build');
      return;
    }
    
    logger('info', `Building ${packages.length} packages...`);
    
    if (config.watch) {
      logger('info', 'Starting watch mode...');
      await runCommand('tsc', ['--build', '--watch'], { ignoreErrors: true });
      return;
    }
    
    // In CI mode, build all packages at once
    if (config.ci) {
      logger('info', 'Building all packages in CI mode...');
      await runCommand('tsc', ['--build', '--verbose']);
      return;
    }
    
    // In normal mode, build packages in order
    for (const pkg of packages) {
      logger('info', `Building package: ${pkg}`);
      try {
        await runCommand('tsc', ['--build', path.join(pkg, 'tsconfig.json')]);
      } catch (error) {
        logger('error', `Failed to build package ${pkg}:`, error.message);
        throw error;
      }
    }
    
    logger('info', 'All packages built successfully');
  });
}

async function generateGitHubActionsMatrix(packages) {
  if (!packages || packages.length === 0) {
    return { include: [] };
  }
  
  // Group packages by workspace for efficient parallel builds
  const workspaces = {};
  
  for (const pkg of packages) {
    const parts = pkg.split('/');
    // Determine workspace based on path structure
    let workspace = 'default';
    
    if (parts.includes('backend')) {
      if (parts.includes('packages')) {
        workspace = 'backend-packages';
      } else if (parts.includes('shared')) {
        workspace = 'backend-shared';
      } else {
        workspace = 'backend-services';
      }
    } else if (parts.includes('web')) {
      if (parts.includes('design-system') || parts.includes('primitives') || 
          parts.includes('interfaces') || parts.includes('journey-context')) {
        workspace = 'web-packages';
      } else if (parts.includes('mobile')) {
        workspace = 'mobile';
      } else {
        workspace = 'web';
      }
    }
    
    if (!workspaces[workspace]) {
      workspaces[workspace] = [];
    }
    
    workspaces[workspace].push(pkg);
  }
  
  // Create matrix entries
  const matrix = {
    include: Object.entries(workspaces).map(([name, pkgs]) => ({
      workspace: name,
      packages: pkgs,
    })),
  };
  
  return matrix;
}

async function outputGitHubActionsMatrix(packages) {
  const matrix = await generateGitHubActionsMatrix(packages);
  
  // GitHub Actions expects the matrix to be set as an output variable
  if (process.env.GITHUB_OUTPUT) {
    const matrixJson = JSON.stringify(matrix);
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `matrix=${matrixJson}\n`
    );
    logger('info', 'GitHub Actions matrix output set');
  } else {
    logger('info', 'GitHub Actions matrix:');
    console.log(JSON.stringify(matrix, null, 2));
  }
  
  return matrix;
}

// Main command implementations
async function prepareCommand(options) {
  try {
    await validateEnvironment();
    await validateDependencies(options);
    await fixPathResolution(options);
    await setupTypeScriptConfig(options);
    const packages = await determineBuildOrder(options);
    await setupBuildCache(options);
    
    logger('info', `${COLORS.green}Build preparation completed successfully${COLORS.reset}`);
    return packages;
  } catch (error) {
    logger('error', `Build preparation failed: ${error.message}`);
    process.exit(1);
  }
}

async function buildCommand(options) {
  try {
    const packages = await prepareCommand(options);
    await runBuild(packages, options);
    
    logger('info', `${COLORS.green}Build completed successfully${COLORS.reset}`);
  } catch (error) {
    logger('error', `Build failed: ${error.message}`);
    process.exit(1);
  }
}

async function ciCommand(options) {
  try {
    const ciOptions = { ...options, ci: true };
    const packages = await prepareCommand(ciOptions);
    await outputGitHubActionsMatrix(packages);
    
    if (!options.skipBuild) {
      await runBuild(packages, ciOptions);
    }
    
    logger('info', `${COLORS.green}CI build completed successfully${COLORS.reset}`);
  } catch (error) {
    logger('error', `CI build failed: ${error.message}`);
    process.exit(1);
  }
}

// CLI setup
program
  .name('austa-build')
  .description('AUSTA SuperApp build tools suite')
  .version('1.0.0')
  .option('-d, --rootDir <dir>', 'Root directory of the monorepo', DEFAULT_CONFIG.rootDir)
  .option('-l, --logLevel <level>', 'Log level (error, warn, info, debug)', DEFAULT_CONFIG.logLevel)
  .option('--ci', 'Run in CI mode', DEFAULT_CONFIG.ci)
  .option('--skipCache', 'Skip build cache setup', DEFAULT_CONFIG.skipCache)
  .option('--skipDeps', 'Skip dependency validation', DEFAULT_CONFIG.skipDeps)
  .option('--skipPaths', 'Skip path resolution fixes', DEFAULT_CONFIG.skipPaths)
  .option('--skipTsConfig', 'Skip TypeScript configuration', DEFAULT_CONFIG.skipTsConfig)
  .option('--skipBuildOrder', 'Skip build order determination', DEFAULT_CONFIG.skipBuildOrder)
  .option('-c, --concurrency <number>', 'Number of concurrent builds', DEFAULT_CONFIG.concurrency)
  .option('--cacheDir <dir>', 'Cache directory', DEFAULT_CONFIG.cacheDir);

program
  .command('prepare')
  .description('Prepare the build environment without building')
  .action(async () => {
    await prepareCommand(program.opts());
  });

program
  .command('build')
  .description('Build all packages in the correct order')
  .option('-w, --watch', 'Watch mode', DEFAULT_CONFIG.watch)
  .action(async (cmdOptions) => {
    const options = { ...program.opts(), ...cmdOptions };
    await buildCommand(options);
  });

program
  .command('ci')
  .description('Run CI build process and generate GitHub Actions matrix')
  .option('--skipBuild', 'Skip the actual build process', false)
  .action(async (cmdOptions) => {
    const options = { ...program.opts(), ...cmdOptions, ci: true };
    await ciCommand(options);
  });

program
  .command('validate-deps')
  .description('Validate dependencies across the monorepo')
  .option('--fix', 'Attempt to fix dependency issues', !DEFAULT_CONFIG.ci)
  .action(async (cmdOptions) => {
    const options = { ...program.opts(), ...cmdOptions };
    await validateDependencies(options);
  });

program
  .command('fix-paths')
  .description('Fix path resolution issues')
  .option('--fix', 'Attempt to fix path issues', !DEFAULT_CONFIG.ci)
  .action(async (cmdOptions) => {
    const options = { ...program.opts(), ...cmdOptions };
    await fixPathResolution(options);
  });

program
  .command('setup-ts')
  .description('Set up TypeScript configuration')
  .option('--fix', 'Attempt to fix TypeScript configuration issues', !DEFAULT_CONFIG.ci)
  .action(async (cmdOptions) => {
    const options = { ...program.opts(), ...cmdOptions };
    await setupTypeScriptConfig(options);
  });

program
  .command('build-order')
  .description('Determine the build order of packages')
  .action(async () => {
    await determineBuildOrder(program.opts());
  });

program
  .command('setup-cache')
  .description('Set up build cache')
  .action(async () => {
    await setupBuildCache(program.opts());
  });

program
  .command('github-matrix')
  .description('Generate GitHub Actions matrix for parallel builds')
  .action(async () => {
    const packages = await determineBuildOrder(program.opts());
    await outputGitHubActionsMatrix(packages);
  });

// Parse arguments and execute
program.parse(process.argv);

// If no command is provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}