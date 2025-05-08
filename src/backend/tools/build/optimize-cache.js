#!/usr/bin/env node

/**
 * optimize-cache.js
 * 
 * A build optimization utility that configures and manages caching strategies for the CI/CD pipeline.
 * It generates cache keys based on lockfile hashes, sets up workspace-specific dependency caching
 * to avoid unnecessary invalidation, and implements multi-level caching for Docker layers and
 * node_modules.
 * 
 * This tool is essential for reducing build times and ensuring consistent, deterministic builds
 * across environments in the AUSTA SuperApp monorepo.
 * 
 * Usage:
 *   node optimize-cache.js [options]
 * 
 * Options:
 *   --format, -f     Output format: json, github-actions, docker (default: github-actions)
 *   --root, -r       Root directory to scan (default: process.cwd())
 *   --output, -o     Output file (default: stdout)
 *   --workspace, -w  Specific workspace to optimize (default: all)
 *   --help, -h       Show this help message
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Constants
const BACKEND_WORKSPACES = [
  'api-gateway',
  'auth-service',
  'health-service',
  'care-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared',
  'packages/auth',
  'packages/utils',
  'packages/tracing',
  'packages/logging',
  'packages/events',
  'packages/errors',
  'packages/database',
  'packages/interfaces'
];

const WEB_WORKSPACES = [
  'design-system',
  'primitives',
  'interfaces',
  'journey-context',
  'shared',
  'mobile',
  'web'
];

// Cache configuration defaults
const DEFAULT_CACHE_CONFIG = {
  // Node modules caching
  nodeModules: {
    enabled: true,
    paths: ['**/node_modules'],
    keyPrefix: 'node-modules',
    restoreKeys: true,
    maxRestoreKeys: 2
  },
  // Build output caching
  buildOutput: {
    enabled: true,
    paths: ['**/dist', '**/build', '**/.next', '**/lib'],
    keyPrefix: 'build-output',
    restoreKeys: true,
    maxRestoreKeys: 1
  },
  // Docker layer caching
  dockerLayers: {
    enabled: true,
    path: '/tmp/.buildx-cache',
    keyPrefix: 'docker-buildx',
    restoreKeys: true,
    maxRestoreKeys: 3
  },
  // Dependency lockfile caching
  lockfiles: {
    enabled: true,
    files: ['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml'],
    keyPrefix: 'lockfile',
    restoreKeys: false
  }
};

/**
 * Logger utility for consistent output formatting
 */
class Logger {
  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message) {
    console.log(`\x1b[34mINFO\x1b[0m: ${message}`);
  }

  success(message) {
    console.log(`\x1b[32mSUCCESS\x1b[0m: ${message}`);
  }

  warn(message) {
    console.log(`\x1b[33mWARNING\x1b[0m: ${message}`);
  }

  error(message) {
    console.error(`\x1b[31mERROR\x1b[0m: ${message}`);
  }

  debug(message) {
    if (this.verbose) {
      console.log(`\x1b[36mDEBUG\x1b[0m: ${message}`);
    }
  }
}

const logger = new Logger(process.env.DEBUG === 'true');

/**
 * Finds all lockfiles in the specified directory
 * @param {string} rootDir - Root directory to scan
 * @param {Array<string>} patterns - File patterns to match
 * @returns {Array<Object>} - List of found lockfiles with their paths and types
 */
function findLockfiles(rootDir, patterns = ['**/package-lock.json', '**/yarn.lock', '**/pnpm-lock.yaml']) {
  logger.info('Scanning for lockfiles...');
  
  const lockfiles = [];
  
  // Helper function to find files matching a pattern
  function findFiles(dir, pattern, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return [];
    
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip node_modules directories
      if (entry.isDirectory() && entry.name === 'node_modules') continue;
      
      if (entry.isFile() && entry.name === pattern) {
        files.push(fullPath);
      } else if (entry.isDirectory()) {
        files.push(...findFiles(fullPath, pattern, depth + 1, maxDepth));
      }
    }
    
    return files;
  }
  
  // Process each pattern
  for (const pattern of patterns) {
    // Convert glob pattern to filename
    const filename = pattern.replace(/^\*\*\//, '');
    
    // Find all matching files
    const found = findFiles(rootDir, filename);
    
    for (const filePath of found) {
      const type = path.basename(filePath) === 'package-lock.json' ? 'npm' :
                  path.basename(filePath) === 'yarn.lock' ? 'yarn' :
                  path.basename(filePath) === 'pnpm-lock.yaml' ? 'pnpm' : 'unknown';
      
      lockfiles.push({
        path: filePath,
        type,
        relativePath: path.relative(rootDir, filePath),
        directory: path.dirname(path.relative(rootDir, filePath))
      });
    }
  }
  
  logger.success(`Found ${lockfiles.length} lockfiles`);
  return lockfiles;
}

/**
 * Generates a hash for a file
 * @param {string} filePath - Path to the file
 * @returns {string} - Hash of the file contents
 */
function generateFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  } catch (error) {
    logger.error(`Failed to generate hash for ${filePath}: ${error.message}`);
    return '';
  }
}

/**
 * Identifies workspaces in the monorepo
 * @param {string} rootDir - Root directory to scan
 * @returns {Object} - Map of workspace names to their configurations
 */
function identifyWorkspaces(rootDir) {
  logger.info('Identifying workspaces...');
  
  const workspaces = {};
  
  // Check backend workspaces
  const backendRoot = path.join(rootDir, 'src/backend');
  if (fs.existsSync(backendRoot)) {
    for (const workspace of BACKEND_WORKSPACES) {
      const workspacePath = path.join(backendRoot, workspace);
      if (fs.existsSync(workspacePath)) {
        const packageJsonPath = path.join(workspacePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            workspaces[workspace] = {
              name: packageJson.name || workspace,
              path: path.relative(rootDir, workspacePath),
              packageJson,
              dependencies: {
                direct: Object.keys(packageJson.dependencies || {}),
                dev: Object.keys(packageJson.devDependencies || {}),
                peer: Object.keys(packageJson.peerDependencies || {}),
                all: [
                  ...Object.keys(packageJson.dependencies || {}),
                  ...Object.keys(packageJson.devDependencies || {}),
                  ...Object.keys(packageJson.peerDependencies || {})
                ]
              }
            };
          } catch (error) {
            logger.warn(`Failed to parse package.json for ${workspace}: ${error.message}`);
          }
        }
      }
    }
  }
  
  // Check web workspaces
  const webRoot = path.join(rootDir, 'src/web');
  if (fs.existsSync(webRoot)) {
    for (const workspace of WEB_WORKSPACES) {
      const workspacePath = path.join(webRoot, workspace);
      if (fs.existsSync(workspacePath)) {
        const packageJsonPath = path.join(workspacePath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            workspaces[workspace] = {
              name: packageJson.name || workspace,
              path: path.relative(rootDir, workspacePath),
              packageJson,
              dependencies: {
                direct: Object.keys(packageJson.dependencies || {}),
                dev: Object.keys(packageJson.devDependencies || {}),
                peer: Object.keys(packageJson.peerDependencies || {}),
                all: [
                  ...Object.keys(packageJson.dependencies || {}),
                  ...Object.keys(packageJson.devDependencies || {}),
                  ...Object.keys(packageJson.peerDependencies || {})
                ]
              }
            };
          } catch (error) {
            logger.warn(`Failed to parse package.json for ${workspace}: ${error.message}`);
          }
        }
      }
    }
  }
  
  logger.success(`Identified ${Object.keys(workspaces).length} workspaces`);
  return workspaces;
}

/**
 * Maps lockfiles to workspaces
 * @param {Array<Object>} lockfiles - List of lockfiles
 * @param {Object} workspaces - Map of workspace names to their configurations
 * @returns {Object} - Map of workspace names to their lockfiles
 */
function mapLockfilesToWorkspaces(lockfiles, workspaces) {
  logger.info('Mapping lockfiles to workspaces...');
  
  const workspaceLockfiles = {};
  
  for (const workspace of Object.keys(workspaces)) {
    workspaceLockfiles[workspace] = [];
    
    // Find lockfiles in this workspace's directory
    for (const lockfile of lockfiles) {
      if (lockfile.directory === workspaces[workspace].path ||
          lockfile.directory.startsWith(`${workspaces[workspace].path}/`)) {
        workspaceLockfiles[workspace].push(lockfile);
      }
    }
    
    // If no lockfiles found in the workspace directory, look for parent lockfiles
    if (workspaceLockfiles[workspace].length === 0) {
      const workspaceParts = workspaces[workspace].path.split('/');
      
      // Try to find a lockfile in a parent directory
      for (let i = workspaceParts.length - 1; i >= 0; i--) {
        const parentPath = workspaceParts.slice(0, i).join('/');
        
        for (const lockfile of lockfiles) {
          if (lockfile.directory === parentPath) {
            workspaceLockfiles[workspace].push(lockfile);
            break;
          }
        }
        
        if (workspaceLockfiles[workspace].length > 0) break;
      }
    }
  }
  
  return workspaceLockfiles;
}

/**
 * Generates cache keys for workspaces
 * @param {Object} workspaceLockfiles - Map of workspace names to their lockfiles
 * @returns {Object} - Map of workspace names to their cache keys
 */
function generateCacheKeys(workspaceLockfiles) {
  logger.info('Generating cache keys...');
  
  const cacheKeys = {};
  
  for (const [workspace, lockfiles] of Object.entries(workspaceLockfiles)) {
    if (lockfiles.length === 0) {
      logger.warn(`No lockfiles found for workspace ${workspace}, using fallback cache key`);
      cacheKeys[workspace] = {
        primary: `${workspace}-fallback`,
        restoreKeys: [`${workspace}-`]
      };
      continue;
    }
    
    // Generate hash from all lockfiles
    const hashes = [];
    for (const lockfile of lockfiles) {
      const hash = generateFileHash(lockfile.path);
      if (hash) {
        hashes.push(hash);
      }
    }
    
    if (hashes.length === 0) {
      logger.warn(`Failed to generate hashes for workspace ${workspace}, using fallback cache key`);
      cacheKeys[workspace] = {
        primary: `${workspace}-fallback`,
        restoreKeys: [`${workspace}-`]
      };
      continue;
    }
    
    // Combine hashes
    const combinedHash = crypto.createHash('sha256')
      .update(hashes.join(''))
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for brevity
    
    cacheKeys[workspace] = {
      primary: `${workspace}-${combinedHash}`,
      restoreKeys: [`${workspace}-`]
    };
  }
  
  return cacheKeys;
}

/**
 * Generates GitHub Actions cache configuration
 * @param {Object} cacheKeys - Map of workspace names to their cache keys
 * @param {Object} workspaces - Map of workspace names to their configurations
 * @param {Object} config - Cache configuration
 * @returns {Object} - GitHub Actions cache configuration
 */
function generateGitHubActionsCacheConfig(cacheKeys, workspaces, config = DEFAULT_CACHE_CONFIG) {
  logger.info('Generating GitHub Actions cache configuration...');
  
  const cacheConfig = {};
  
  // Generate node_modules cache configuration
  if (config.nodeModules.enabled) {
    cacheConfig.nodeModules = {};
    
    for (const [workspace, keys] of Object.entries(cacheKeys)) {
      const workspacePath = workspaces[workspace].path;
      
      cacheConfig.nodeModules[workspace] = {
        paths: config.nodeModules.paths.map(pattern => 
          pattern.replace('**', workspacePath)
        ),
        key: `${config.nodeModules.keyPrefix}-${keys.primary}`,
        restoreKeys: config.nodeModules.restoreKeys ? 
          Array(config.nodeModules.maxRestoreKeys).fill(0).map((_, i) => 
            `${config.nodeModules.keyPrefix}-${keys.restoreKeys[0]}${i}`
          ) : []
      };
    }
  }
  
  // Generate build output cache configuration
  if (config.buildOutput.enabled) {
    cacheConfig.buildOutput = {};
    
    for (const [workspace, keys] of Object.entries(cacheKeys)) {
      const workspacePath = workspaces[workspace].path;
      
      cacheConfig.buildOutput[workspace] = {
        paths: config.buildOutput.paths.map(pattern => 
          pattern.replace('**', workspacePath)
        ),
        key: `${config.buildOutput.keyPrefix}-${keys.primary}`,
        restoreKeys: config.buildOutput.restoreKeys ? 
          Array(config.buildOutput.maxRestoreKeys).fill(0).map((_, i) => 
            `${config.buildOutput.keyPrefix}-${keys.restoreKeys[0]}${i}`
          ) : []
      };
    }
  }
  
  // Generate Docker layer cache configuration
  if (config.dockerLayers.enabled) {
    cacheConfig.dockerLayers = {
      path: config.dockerLayers.path,
      key: `${config.dockerLayers.keyPrefix}-${Date.now()}`,
      restoreKeys: config.dockerLayers.restoreKeys ? 
        Array(config.dockerLayers.maxRestoreKeys).fill(0).map((_, i) => 
          `${config.dockerLayers.keyPrefix}-`
        ) : []
    };
  }
  
  return cacheConfig;
}

/**
 * Generates Docker layer caching configuration
 * @param {Object} cacheKeys - Map of workspace names to their cache keys
 * @param {Object} config - Cache configuration
 * @returns {Object} - Docker layer caching configuration
 */
function generateDockerCacheConfig(cacheKeys, config = DEFAULT_CACHE_CONFIG) {
  logger.info('Generating Docker layer caching configuration...');
  
  if (!config.dockerLayers.enabled) {
    return {};
  }
  
  return {
    cacheFrom: `type=local,src=${config.dockerLayers.path}`,
    cacheTo: `type=local,dest=${config.dockerLayers.path}-new,mode=max`
  };
}

/**
 * Generates cache invalidation rules based on dependency changes
 * @param {Object} workspaces - Map of workspace names to their configurations
 * @returns {Object} - Cache invalidation rules
 */
function generateCacheInvalidationRules(workspaces) {
  logger.info('Generating cache invalidation rules...');
  
  const invalidationRules = {};
  
  for (const [workspace, config] of Object.entries(workspaces)) {
    invalidationRules[workspace] = {
      // Files that should trigger cache invalidation when changed
      invalidateOn: [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
        '.npmrc',
        '.yarnrc',
        '.pnpmrc'
      ],
      // Dependencies that should trigger cache invalidation when changed
      criticalDependencies: [
        // Core libraries with version conflicts
        'minimatch',
        'semver',
        'ws',
        // React ecosystem
        'react',
        'react-dom',
        'react-native',
        // Build tools
        'typescript',
        'babel-core',
        '@babel/core',
        'webpack',
        'eslint',
        // Framework dependencies
        'next',
        'nestjs',
        '@nestjs/core'
      ].filter(dep => 
        config.dependencies.all.includes(dep)
      )
    };
  }
  
  return invalidationRules;
}

/**
 * Generates a complete cache optimization configuration
 * @param {string} rootDir - Root directory to scan
 * @param {Object} options - Options for cache optimization
 * @returns {Object} - Complete cache optimization configuration
 */
function generateCacheOptimizationConfig(rootDir, options = {}) {
  const { format = 'github-actions', workspace = null } = options;
  
  // Find lockfiles
  const lockfiles = findLockfiles(rootDir, DEFAULT_CACHE_CONFIG.lockfiles.files);
  
  // Identify workspaces
  const workspaces = identifyWorkspaces(rootDir);
  
  // Filter to specific workspace if requested
  const filteredWorkspaces = workspace ? 
    { [workspace]: workspaces[workspace] } : 
    workspaces;
  
  // Map lockfiles to workspaces
  const workspaceLockfiles = mapLockfilesToWorkspaces(lockfiles, filteredWorkspaces);
  
  // Generate cache keys
  const cacheKeys = generateCacheKeys(workspaceLockfiles);
  
  // Generate cache invalidation rules
  const invalidationRules = generateCacheInvalidationRules(filteredWorkspaces);
  
  // Generate format-specific configuration
  let formatSpecificConfig = {};
  
  switch (format) {
    case 'github-actions':
      formatSpecificConfig = generateGitHubActionsCacheConfig(cacheKeys, filteredWorkspaces);
      break;
    case 'docker':
      formatSpecificConfig = generateDockerCacheConfig(cacheKeys);
      break;
    default:
      // No format-specific configuration
      break;
  }
  
  // Combine all configurations
  return {
    workspaces: Object.keys(filteredWorkspaces),
    cacheKeys,
    invalidationRules,
    [format]: formatSpecificConfig
  };
}

/**
 * Generates GitHub Actions workflow steps for caching
 * @param {Object} cacheConfig - Cache configuration
 * @returns {Array<Object>} - GitHub Actions workflow steps
 */
function generateGitHubActionsWorkflowSteps(cacheConfig) {
  logger.info('Generating GitHub Actions workflow steps...');
  
  const steps = [];
  
  // Add node_modules caching steps
  if (cacheConfig['github-actions']?.nodeModules) {
    for (const [workspace, config] of Object.entries(cacheConfig['github-actions'].nodeModules)) {
      steps.push({
        name: `Cache node_modules for ${workspace}`,
        uses: 'actions/cache@v3',
        with: {
          path: config.paths.join('\n'),
          key: config.key,
          'restore-keys': config.restoreKeys.join('\n')
        }
      });
    }
  }
  
  // Add build output caching steps
  if (cacheConfig['github-actions']?.buildOutput) {
    for (const [workspace, config] of Object.entries(cacheConfig['github-actions'].buildOutput)) {
      steps.push({
        name: `Cache build output for ${workspace}`,
        uses: 'actions/cache@v3',
        with: {
          path: config.paths.join('\n'),
          key: config.key,
          'restore-keys': config.restoreKeys.join('\n')
        }
      });
    }
  }
  
  // Add Docker layer caching steps
  if (cacheConfig['github-actions']?.dockerLayers) {
    steps.push({
      name: 'Set up Docker Buildx',
      uses: 'docker/setup-buildx-action@v2'
    });
    
    steps.push({
      name: 'Cache Docker layers',
      uses: 'actions/cache@v3',
      with: {
        path: cacheConfig['github-actions'].dockerLayers.path,
        key: cacheConfig['github-actions'].dockerLayers.key,
        'restore-keys': cacheConfig['github-actions'].dockerLayers.restoreKeys.join('\n')
      }
    });
  }
  
  return steps;
}

/**
 * Parses command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    format: 'github-actions',
    root: process.cwd(),
    output: null,
    workspace: null,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--format':
      case '-f':
        options.format = args[++i];
        break;
        
      case '--root':
      case '-r':
        options.root = args[++i];
        break;
        
      case '--output':
      case '-o':
        options.output = args[++i];
        break;
        
      case '--workspace':
      case '-w':
        options.workspace = args[++i];
        break;
        
      case '--help':
      case '-h':
        options.help = true;
        break;
        
      default:
        // Ignore unknown arguments
        break;
    }
  }
  
  return options;
}

/**
 * Displays help message
 */
function showHelp() {
  console.log(`
Usage: node optimize-cache.js [options]

Options:
  --format, -f     Output format: json, github-actions, docker (default: github-actions)
  --root, -r       Root directory to scan (default: process.cwd())
  --output, -o     Output file (default: stdout)
  --workspace, -w  Specific workspace to optimize (default: all)
  --help, -h       Show this help message
`);
}

/**
 * Main function
 */
function main() {
  // Parse command line arguments
  const options = parseArgs();
  
  // Show help if requested
  if (options.help) {
    showHelp();
    return;
  }
  
  try {
    // Generate cache optimization configuration
    const cacheConfig = generateCacheOptimizationConfig(options.root, options);
    
    // Generate GitHub Actions workflow steps if requested
    let output;
    if (options.format === 'github-actions-steps') {
      output = JSON.stringify(generateGitHubActionsWorkflowSteps(cacheConfig), null, 2);
    } else {
      output = JSON.stringify(cacheConfig, null, 2);
    }
    
    // Write the output
    if (options.output) {
      fs.writeFileSync(options.output, output, 'utf8');
      logger.success(`Output written to ${options.output}`);
    } else {
      console.log(output);
    }
    
  } catch (error) {
    logger.error(`An error occurred: ${error.message}`);
    if (process.env.DEBUG === 'true') {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Analyzes the cache configuration without generating output
 * @param {Object} options - Options for analysis
 * @returns {Object} - Analysis results
 */
async function analyze(options = {}) {
  const rootDir = options.monorepoRoot || process.cwd();
  
  try {
    // Generate cache optimization configuration
    const cacheConfig = generateCacheOptimizationConfig(rootDir, {
      format: 'json'
    });
    
    return {
      success: true,
      config: cacheConfig
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Runs the cache optimization tool
 * @param {Object} options - Options for running the tool
 * @param {Object} logger - Logger instance
 * @returns {Promise<boolean>} - Success status
 */
async function run(options = {}, logger) {
  const rootDir = options.monorepoRoot || process.cwd();
  
  try {
    // Generate cache optimization configuration
    const cacheConfig = generateCacheOptimizationConfig(rootDir, {
      format: options.ci ? 'github-actions' : 'json'
    });
    
    // If running in CI mode, output GitHub Actions workflow commands
    if (options.ci) {
      const steps = generateGitHubActionsWorkflowSteps(cacheConfig);
      
      // Output the steps as GitHub Actions workflow commands
      console.log(`::set-output name=cache-config::${JSON.stringify(cacheConfig)}`);
      console.log(`::set-output name=workflow-steps::${JSON.stringify(steps)}`);
      
      // Create cache configuration file for reference
      const configPath = path.join(process.cwd(), 'cache-config.json');
      fs.writeFileSync(configPath, JSON.stringify(cacheConfig, null, 2), 'utf8');
      logger.success(`Cache configuration written to ${configPath}`);
    } else {
      // Output the configuration
      const configPath = path.join(process.cwd(), 'cache-config.json');
      fs.writeFileSync(configPath, JSON.stringify(cacheConfig, null, 2), 'utf8');
      logger.success(`Cache configuration written to ${configPath}`);
      
      // Generate GitHub Actions workflow steps file
      const stepsPath = path.join(process.cwd(), 'cache-workflow-steps.json');
      fs.writeFileSync(stepsPath, JSON.stringify(generateGitHubActionsWorkflowSteps(cacheConfig), null, 2), 'utf8');
      logger.success(`Workflow steps written to ${stepsPath}`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Failed to optimize cache: ${error.message}`);
    if (options.verbose) {
      logger.debug(error.stack);
    }
    return false;
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export functions for use as a module
module.exports = {
  generateCacheOptimizationConfig,
  generateGitHubActionsWorkflowSteps,
  analyze,
  run
};