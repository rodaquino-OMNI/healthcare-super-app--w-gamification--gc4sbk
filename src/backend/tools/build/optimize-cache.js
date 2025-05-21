#!/usr/bin/env node

/**
 * AUSTA SuperApp Build Cache Optimization Tool
 * 
 * This utility configures and manages caching strategies for the CI/CD pipeline.
 * It generates cache keys based on lockfile hashes, sets up workspace-specific 
 * dependency caching, and implements multi-level caching for Docker layers and node_modules.
 * 
 * Features:
 * - Workspace-specific cache key generation based on lockfile hashes
 * - Deterministic installation configurations
 * - Docker layer caching configuration for optimized container builds
 * - node_modules caching strategies for each service
 * - Cache invalidation rules based on dependency changes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  rootDir: process.env.GITHUB_WORKSPACE || path.resolve(process.cwd(), '../..'),
  cacheDir: process.env.CACHE_DIR || '/tmp/.buildx-cache',
  workspaces: {
    backend: {
      path: 'src/backend',
      lockfile: 'src/backend/pnpm-lock.yaml',
      services: [
        'api-gateway',
        'auth-service',
        'health-service',
        'care-service',
        'plan-service',
        'gamification-engine',
        'notification-service'
      ],
      packages: [
        'packages/auth',
        'packages/utils',
        'packages/tracing',
        'packages/logging',
        'packages/events',
        'packages/errors',
        'packages/database',
        'packages/interfaces'
      ]
    },
    web: {
      path: 'src/web',
      lockfile: 'src/web/pnpm-lock.yaml',
      packages: [
        'design-system',
        'primitives',
        'interfaces',
        'journey-context',
        'shared',
        'mobile',
        'web'
      ]
    }
  },
  dockerCacheConfig: {
    enabled: true,
    cachePath: '/tmp/.buildx-cache',
    newCachePath: '/tmp/.buildx-cache-new',
    maxSize: '10GB'
  },
  nodeModulesCacheConfig: {
    enabled: true,
    paths: [
      '**/node_modules',
      '!**/node_modules/.cache'
    ],
    restoreKeys: 2 // Number of fallback keys to generate
  }
};

/**
 * Generates a hash from a file's contents
 * @param {string} filePath - Path to the file
 * @returns {string} - Hash of the file contents
 */
function generateFileHash(filePath) {
  try {
    const fullPath = path.resolve(CONFIG.rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`Warning: File not found: ${fullPath}`);
      return 'file-not-found';
    }
    
    const fileContent = fs.readFileSync(fullPath);
    return crypto.createHash('sha256').update(fileContent).digest('hex');
  } catch (error) {
    console.error(`Error generating hash for ${filePath}:`, error);
    return 'error-generating-hash';
  }
}

/**
 * Generates cache keys for a workspace
 * @param {string} workspace - Workspace name
 * @param {Object} config - Workspace configuration
 * @returns {Object} - Cache keys for the workspace
 */
function generateWorkspaceCacheKeys(workspace, config) {
  const lockfileHash = generateFileHash(config.lockfile);
  
  // Generate primary cache key
  const primaryKey = `${process.env.RUNNER_OS || 'os'}-${workspace}-${lockfileHash}`;
  
  // Generate restore keys (fallbacks)
  const restoreKeys = [];
  for (let i = 0; i < CONFIG.nodeModulesCacheConfig.restoreKeys; i++) {
    restoreKeys.push(`${process.env.RUNNER_OS || 'os'}-${workspace}-`);
  }
  
  return {
    primary: primaryKey,
    restore: restoreKeys
  };
}

/**
 * Generates Docker cache configuration
 * @returns {Object} - Docker cache configuration
 */
function generateDockerCacheConfig() {
  if (!CONFIG.dockerCacheConfig.enabled) {
    return null;
  }
  
  const gitSha = process.env.GITHUB_SHA || 'local';
  
  return {
    cacheFrom: `type=local,src=${CONFIG.dockerCacheConfig.cachePath}`,
    cacheTo: `type=local,dest=${CONFIG.dockerCacheConfig.newCachePath},mode=max,size=${CONFIG.dockerCacheConfig.maxSize}`,
    primaryKey: `${process.env.RUNNER_OS || 'os'}-buildx-${gitSha}`,
    restoreKeys: [`${process.env.RUNNER_OS || 'os'}-buildx-`]
  };
}

/**
 * Generates service-specific cache keys
 * @param {string} workspace - Workspace name
 * @param {Object} config - Workspace configuration
 * @returns {Object} - Service-specific cache keys
 */
function generateServiceCacheKeys(workspace, config) {
  const serviceKeys = {};
  
  // Generate keys for backend services
  if (workspace === 'backend' && config.services) {
    config.services.forEach(service => {
      const servicePath = path.join(config.path, service);
      const packageJsonPath = path.join(servicePath, 'package.json');
      const packageJsonHash = generateFileHash(packageJsonPath);
      
      serviceKeys[service] = {
        primary: `${process.env.RUNNER_OS || 'os'}-${workspace}-${service}-${packageJsonHash}`,
        restore: [`${process.env.RUNNER_OS || 'os'}-${workspace}-${service}-`]
      };
    });
  }
  
  // Generate keys for packages
  if (config.packages) {
    config.packages.forEach(pkg => {
      const packagePath = path.join(config.path, pkg);
      const packageJsonPath = path.join(packagePath, 'package.json');
      const packageJsonHash = generateFileHash(packageJsonPath);
      
      const pkgName = pkg.split('/').pop();
      serviceKeys[pkgName] = {
        primary: `${process.env.RUNNER_OS || 'os'}-${workspace}-${pkgName}-${packageJsonHash}`,
        restore: [`${process.env.RUNNER_OS || 'os'}-${workspace}-${pkgName}-`]
      };
    });
  }
  
  return serviceKeys;
}

/**
 * Generates cache invalidation rules based on dependency changes
 * @returns {Object} - Cache invalidation rules
 */
function generateCacheInvalidationRules() {
  return {
    // Files that should trigger a full cache invalidation when changed
    globalInvalidators: [
      'pnpm-workspace.yaml',
      'package.json',
      '.npmrc'
    ],
    
    // Files that should trigger workspace-specific cache invalidation
    workspaceInvalidators: {
      backend: [
        'src/backend/pnpm-lock.yaml',
        'src/backend/package.json',
        'src/backend/lerna.json'
      ],
      web: [
        'src/web/pnpm-lock.yaml',
        'src/web/package.json',
        'src/web/turbo.json'
      ]
    },
    
    // Patterns that should trigger service-specific cache invalidation
    serviceInvalidators: {
      pattern: 'src/:workspace/:service/package.json'
    }
  };
}

/**
 * Generates GitHub Actions cache configuration
 * @returns {Object} - GitHub Actions cache configuration
 */
function generateGitHubActionsCacheConfig() {
  const cacheConfig = {};
  
  // Generate workspace-level cache configs
  Object.entries(CONFIG.workspaces).forEach(([workspace, config]) => {
    const workspaceKeys = generateWorkspaceCacheKeys(workspace, config);
    const serviceKeys = generateServiceCacheKeys(workspace, config);
    
    cacheConfig[workspace] = {
      workspace: workspaceKeys,
      services: serviceKeys
    };
  });
  
  // Add Docker cache config
  cacheConfig.docker = generateDockerCacheConfig();
  
  // Add invalidation rules
  cacheConfig.invalidation = generateCacheInvalidationRules();
  
  return cacheConfig;
}

/**
 * Generates a GitHub Actions workflow step for caching
 * @param {string} workspace - Workspace name
 * @param {string} service - Service name (optional)
 * @returns {Object} - GitHub Actions workflow step
 */
function generateCacheStep(workspace, service = null) {
  const config = generateGitHubActionsCacheConfig();
  const workspaceConfig = config[workspace];
  
  if (!workspaceConfig) {
    throw new Error(`Unknown workspace: ${workspace}`);
  }
  
  const cacheStep = {
    name: service 
      ? `Cache ${workspace}/${service} dependencies` 
      : `Cache ${workspace} dependencies`,
    uses: 'actions/cache@v3',
    with: {
      path: CONFIG.nodeModulesCacheConfig.paths.join('\n'),
      key: service 
        ? workspaceConfig.services[service]?.primary || workspaceConfig.workspace.primary
        : workspaceConfig.workspace.primary,
      'restore-keys': service
        ? workspaceConfig.services[service]?.restore.join('\n') || workspaceConfig.workspace.restore.join('\n')
        : workspaceConfig.workspace.restore.join('\n')
    }
  };
  
  return cacheStep;
}

/**
 * Generates a Docker cache configuration for GitHub Actions
 * @returns {Object} - Docker cache configuration
 */
function generateDockerCacheStep() {
  const config = generateGitHubActionsCacheConfig();
  const dockerConfig = config.docker;
  
  if (!dockerConfig) {
    throw new Error('Docker cache configuration is disabled');
  }
  
  return {
    name: 'Cache Docker layers',
    uses: 'actions/cache@v3',
    with: {
      path: CONFIG.dockerCacheConfig.cachePath,
      key: dockerConfig.primaryKey,
      'restore-keys': dockerConfig.restoreKeys.join('\n')
    }
  };
}

/**
 * Generates a post-build step to move Docker cache
 * This is needed to prevent cache growth with each build
 * @returns {Object} - Post-build step configuration
 */
function generateDockerCachePostBuildStep() {
  return {
    name: 'Move Docker cache',
    if: 'always()',
    run: [
      '# Temp fix for https://github.com/docker/build-push-action/issues/252',
      'rm -rf /tmp/.buildx-cache',
      'mv /tmp/.buildx-cache-new /tmp/.buildx-cache'
    ].join('\n')
  };
}

/**
 * Generates a deterministic installation step
 * @param {string} workspace - Workspace name
 * @returns {Object} - Installation step configuration
 */
function generateInstallStep(workspace) {
  const workspacePath = CONFIG.workspaces[workspace]?.path || '';
  
  return {
    name: `Install ${workspace} dependencies`,
    working_directory: workspacePath,
    run: 'pnpm install --frozen-lockfile'
  };
}

/**
 * Main function to generate and output cache configuration
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'generate-config':
      const config = generateGitHubActionsCacheConfig();
      console.log(JSON.stringify(config, null, 2));
      break;
      
    case 'generate-cache-step':
      const workspace = args[1];
      const service = args[2] || null;
      
      if (!workspace) {
        console.error('Error: Workspace name is required');
        process.exit(1);
      }
      
      try {
        const step = generateCacheStep(workspace, service);
        console.log(JSON.stringify(step, null, 2));
      } catch (error) {
        console.error(`Error generating cache step: ${error.message}`);
        process.exit(1);
      }
      break;
      
    case 'generate-docker-cache-step':
      try {
        const step = generateDockerCacheStep();
        console.log(JSON.stringify(step, null, 2));
      } catch (error) {
        console.error(`Error generating Docker cache step: ${error.message}`);
        process.exit(1);
      }
      break;
      
    case 'generate-docker-post-build-step':
      const postBuildStep = generateDockerCachePostBuildStep();
      console.log(JSON.stringify(postBuildStep, null, 2));
      break;
      
    case 'generate-install-step':
      const installWorkspace = args[1];
      
      if (!installWorkspace) {
        console.error('Error: Workspace name is required');
        process.exit(1);
      }
      
      const installStep = generateInstallStep(installWorkspace);
      console.log(JSON.stringify(installStep, null, 2));
      break;
      
    case 'help':
    default:
      console.log(`
AUSTA SuperApp Build Cache Optimization Tool

Usage:
  node optimize-cache.js <command> [options]

Commands:
  generate-config                     Generate full cache configuration
  generate-cache-step <workspace> [service]  Generate GitHub Actions cache step
  generate-docker-cache-step          Generate Docker cache step
  generate-docker-post-build-step     Generate Docker post-build step
  generate-install-step <workspace>   Generate deterministic installation step
  help                                Show this help message

Examples:
  node optimize-cache.js generate-config
  node optimize-cache.js generate-cache-step backend api-gateway
  node optimize-cache.js generate-docker-cache-step
  node optimize-cache.js generate-install-step web
`);
      break;
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

// Export functions for use in other scripts
module.exports = {
  generateWorkspaceCacheKeys,
  generateServiceCacheKeys,
  generateDockerCacheConfig,
  generateGitHubActionsCacheConfig,
  generateCacheStep,
  generateDockerCacheStep,
  generateDockerCachePostBuildStep,
  generateInstallStep
};