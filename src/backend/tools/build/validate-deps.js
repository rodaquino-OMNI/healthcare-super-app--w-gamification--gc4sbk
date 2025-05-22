#!/usr/bin/env node

/**
 * validate-deps.js - Dependency validation utility for AUSTA SuperApp monorepo
 * 
 * A dependency validation utility for the AUSTA SuperApp monorepo that scans
 * all package.json files to identify version conflicts, missing dependencies,
 * and circular references. It performs comprehensive checks using npm/pnpm commands,
 * validates peer dependencies, and generates detailed reports highlighting issues
 * that need resolution.
 * 
 * This script is critical for CI/CD pipelines and local development to prevent
 * build failures caused by dependency conflicts.
 * 
 * Usage:
 *   node validate-deps.js [options]
 * 
 * Options:
 *   --fix             Attempt to fix detected issues automatically
 *   --ci              Run in CI mode (fails immediately on critical issues)
 *   --verbose         Show detailed output
 *   --config <path>   Path to custom configuration file
 *   --ignore <paths>  Comma-separated list of paths to ignore
 *   --focus <paths>   Comma-separated list of paths to focus on
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

// Configuration with defaults
const config = {
  // Core packages to specifically check for version conflicts
  criticalPackages: [
    'minimatch',  // Specifically mentioned in requirements
    'semver',     // Specifically mentioned in requirements
    'ws',         // Specifically mentioned in requirements
    'axios',      // Critical for HTTP requests
    'react',      // Core UI library
    'react-native', // Mobile platform
    'react-dom',  // Web platform
    '@babel/core', // Build system
    '@babel/runtime', // Runtime support
    '@babel/plugin-transform-runtime', // Replaces deprecated proposal plugins
    'typescript', // Type checking
    'jest',       // Testing framework
    'eslint',     // Linting
    'webpack'     // Bundling
  ],
  // Paths to ignore during scanning
  ignorePaths: [
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage'
  ],
  // Maximum depth for circular dependency detection
  maxCircularDepth: 10,
  // Exit with error code on these conditions
  exitOnError: {
    circularDependencies: true,
    versionConflicts: true,
    missingPeerDependencies: false,
    missingDependencies: false
  },
  // Workspace roots to scan
  workspaceRoots: [
    'src/backend',
    'src/web'
  ],
  // Package manager to use for validation commands
  packageManager: 'npm', // 'npm', 'yarn', or 'pnpm'
  // Custom resolutions for specific packages
  resolutions: {}
};

// CLI arguments parsing
let args = process.argv.slice(2);
const cliOptions = {
  fix: args.includes('--fix'),
  ci: args.includes('--ci'),
  verbose: args.includes('--verbose'),
  configPath: args.includes('--config') ? args[args.indexOf('--config') + 1] : null,
  ignorePaths: args.includes('--ignore') ? args[args.indexOf('--ignore') + 1].split(',') : [],
  focusPaths: args.includes('--focus') ? args[args.indexOf('--focus') + 1].split(',') : []
};

// Merge CLI ignore paths with config
if (cliOptions.ignorePaths.length > 0) {
  config.ignorePaths = [...config.ignorePaths, ...cliOptions.ignorePaths];
}

// Override with custom config if provided
if (cliOptions.configPath && fs.existsSync(cliOptions.configPath)) {
  try {
    const customConfig = JSON.parse(fs.readFileSync(cliOptions.configPath, 'utf8'));
    Object.assign(config, customConfig);
    console.log(`✅ Loaded custom configuration from ${cliOptions.configPath}`);
  } catch (error) {
    console.error(`❌ Error loading custom configuration: ${error.message}`);
    process.exit(1);
  }
}

// Set stricter exit conditions in CI mode
if (cliOptions.ci) {
  config.exitOnError.missingPeerDependencies = true;
  config.exitOnError.missingDependencies = true;
}

// Logging utilities
const logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warning: (message) => console.log(`⚠️ ${message}`),
  error: (message) => console.log(`❌ ${message}`),
  verbose: (message) => {
    if (cliOptions.verbose) {
      console.log(`🔍 ${message}`);
    }
  },
  section: (title) => {
    console.log('\n' + '='.repeat(80));
    console.log(`📋 ${title}`);
    console.log('='.repeat(80));
  }
};

// Results tracking
const results = {
  versionConflicts: [],
  circularDependencies: [],
  missingPeerDependencies: [],
  missingDependencies: [],
  suggestedFixes: []
};

/**
 * Find all package.json files in the monorepo
 * @param {string} dir - Directory to start searching from
 * @returns {Promise<string[]>} - Array of package.json file paths
 */
async function findPackageJsonFiles(dir) {
  const packageJsonFiles = [];
  
  async function scanDir(currentDir) {
    try {
      const entries = await readdir(currentDir);
      
      // Check if this directory should be ignored
      const shouldIgnore = config.ignorePaths.some(ignorePath => {
        return currentDir.includes(`/${ignorePath}/`) || currentDir.endsWith(`/${ignorePath}`);
      });
      
      if (shouldIgnore) {
        logger.verbose(`Skipping ignored directory: ${currentDir}`);
        return;
      }
      
      // Check if we should focus only on specific paths
      if (cliOptions.focusPaths.length > 0) {
        const shouldFocus = cliOptions.focusPaths.some(focusPath => {
          return currentDir.includes(focusPath);
        });
        
        if (!shouldFocus) {
          logger.verbose(`Skipping non-focused directory: ${currentDir}`);
          return;
        }
      }
      
      // Check for package.json in current directory
      if (entries.includes('package.json')) {
        packageJsonFiles.push(path.join(currentDir, 'package.json'));
      }
      
      // Recursively scan subdirectories
      for (const entry of entries) {
        const entryPath = path.join(currentDir, entry);
        const entryStat = await stat(entryPath);
        
        if (entryStat.isDirectory()) {
          await scanDir(entryPath);
        }
      }
    } catch (error) {
      logger.error(`Error scanning directory ${currentDir}: ${error.message}`);
    }
  }
  
  // Start scanning from workspace roots
  for (const workspaceRoot of config.workspaceRoots) {
    const rootPath = path.resolve(process.cwd(), workspaceRoot);
    if (fs.existsSync(rootPath)) {
      await scanDir(rootPath);
    } else {
      logger.warning(`Workspace root not found: ${rootPath}`);
    }
  }
  
  return packageJsonFiles;
}

/**
 * Parse a package.json file and extract dependency information
 * @param {string} filePath - Path to package.json file
 * @returns {Object} - Parsed package information
 */
async function parsePackageJson(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    const packageData = JSON.parse(content);
    const packageDir = path.dirname(filePath);
    
    return {
      name: packageData.name || path.basename(packageDir),
      version: packageData.version || '0.0.0',
      dependencies: packageData.dependencies || {},
      devDependencies: packageData.devDependencies || {},
      peerDependencies: packageData.peerDependencies || {},
      optionalDependencies: packageData.optionalDependencies || {},
      resolutions: packageData.resolutions || {},
      path: filePath,
      directory: packageDir
    };
  } catch (error) {
    logger.error(`Error parsing ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Build a dependency graph from package information
 * @param {Array} packages - Array of parsed package.json data
 * @returns {Object} - Dependency graph
 */
function buildDependencyGraph(packages) {
  const graph = {};
  const packageMap = {};
  
  // Create a map of package names to their info
  packages.forEach(pkg => {
    if (pkg && pkg.name) {
      packageMap[pkg.name] = pkg;
      graph[pkg.name] = [];
    }
  });
  
  // Build the graph edges (dependencies)
  packages.forEach(pkg => {
    if (!pkg || !pkg.name) return;
    
    // Combine all dependencies
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };
    
    // Add edges for internal dependencies (packages within the monorepo)
    Object.keys(allDeps).forEach(depName => {
      if (packageMap[depName]) {
        graph[pkg.name].push(depName);
      }
    });
  });
  
  return { graph, packageMap };
}

/**
 * Detect circular dependencies in the dependency graph
 * @param {Object} graph - Dependency graph
 * @returns {Array} - Array of circular dependency paths
 */
function detectCircularDependencies(graph) {
  const cycles = [];
  
  // Tarjan's algorithm for finding strongly connected components (cycles)
  function findStronglyConnectedComponents() {
    const index = {};
    const lowlink = {};
    const onStack = {};
    const stack = [];
    let currentIndex = 0;
    
    function strongConnect(node) {
      // Set the depth index for node
      index[node] = currentIndex;
      lowlink[node] = currentIndex;
      currentIndex++;
      stack.push(node);
      onStack[node] = true;
      
      // Consider successors of node
      const successors = graph[node] || [];
      for (const successor of successors) {
        if (index[successor] === undefined) {
          // Successor has not yet been visited; recurse on it
          strongConnect(successor);
          lowlink[node] = Math.min(lowlink[node], lowlink[successor]);
        } else if (onStack[successor]) {
          // Successor is in stack and hence in the current SCC
          lowlink[node] = Math.min(lowlink[node], index[successor]);
        }
      }
      
      // If node is a root node, pop the stack and generate an SCC
      if (lowlink[node] === index[node]) {
        const scc = [];
        let w;
        do {
          w = stack.pop();
          onStack[w] = false;
          scc.push(w);
        } while (w !== node);
        
        // Only consider SCCs with more than one node (cycles)
        if (scc.length > 1) {
          // Try to find a complete cycle within this SCC
          const cycle = findCycleInComponent(scc);
          if (cycle) {
            cycles.push(cycle);
          }
        }
      }
    }
    
    // Run strongConnect on each node that hasn't been visited yet
    for (const node of Object.keys(graph)) {
      if (index[node] === undefined) {
        strongConnect(node);
      }
    }
  }
  
  // Find a specific cycle within a strongly connected component
  function findCycleInComponent(component) {
    // Start with the first node in the component
    const startNode = component[0];
    const visited = new Set();
    const path = [];
    
    function dfs(node, target, depth = 0) {
      // Limit recursion depth
      if (depth > config.maxCircularDepth) {
        return false;
      }
      
      // If we've found the target, we've completed the cycle
      if (node === target && path.length > 0) {
        return true;
      }
      
      // If we've already visited this node in the current path, skip it
      if (visited.has(node)) {
        return false;
      }
      
      // Add the current node to the path
      visited.add(node);
      path.push(node);
      
      // Check all dependencies
      const dependencies = graph[node] || [];
      for (const dependency of dependencies) {
        // Only consider dependencies within the component
        if (component.includes(dependency)) {
          if (dfs(dependency, target, depth + 1)) {
            return true;
          }
        }
      }
      
      // Remove the current node from the path
      visited.delete(node);
      path.pop();
      return false;
    }
    
    // Try to find a cycle starting and ending at the start node
    dfs(startNode, startNode);
    
    // Return the cycle if we found one
    return path.length > 0 ? [...path, startNode] : null;
  }
  
  // Run the algorithm to find all cycles
  findStronglyConnectedComponents();
  
  // Remove duplicate cycles
  const uniqueCycles = [];
  const cycleStrings = new Set();
  
  cycles.forEach(cycle => {
    // Normalize the cycle by starting with the alphabetically first node
    const minIndex = cycle.indexOf(cycle.slice().sort()[0]);
    const normalizedCycle = [
      ...cycle.slice(minIndex),
      ...cycle.slice(0, minIndex)
    ];
    const cycleString = normalizedCycle.join(' -> ');
    
    if (!cycleStrings.has(cycleString)) {
      cycleStrings.add(cycleString);
      uniqueCycles.push(normalizedCycle);
    }
  });
  
  return uniqueCycles;
}

/**
 * Check for version conflicts in dependencies
 * @param {Array} packages - Array of parsed package.json data
 * @returns {Array} - Array of version conflicts
 */
function checkVersionConflicts(packages) {
  const conflicts = [];
  const dependencyVersions = {};
  
  // Collect all dependency versions
  packages.forEach(pkg => {
    if (!pkg) return;
    
    // Combine all dependencies
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };
    
    Object.entries(allDeps).forEach(([depName, versionRange]) => {
      if (!dependencyVersions[depName]) {
        dependencyVersions[depName] = [];
      }
      
      // Add this version requirement if it's not already recorded
      const exists = dependencyVersions[depName].some(entry => 
        entry.version === versionRange && entry.packageName === pkg.name
      );
      
      if (!exists) {
        dependencyVersions[depName].push({
          version: versionRange,
          packageName: pkg.name,
          packagePath: pkg.path
        });
      }
    });
  });
  
  // Check for conflicts, prioritizing critical packages
  [...config.criticalPackages, ...Object.keys(dependencyVersions)].forEach(depName => {
    // Skip duplicates from the critical packages list
    if (conflicts.some(conflict => conflict.name === depName)) {
      return;
    }
    
    const versions = dependencyVersions[depName];
    if (!versions || versions.length <= 1) {
      return; // No conflict if only one version
    }
    
    try {
      // Use semver to check if versions are compatible when possible
      // This requires the semver package to be installed
      let semver;
      try {
        semver = require('semver');
      } catch (e) {
        // Fallback to simple string comparison if semver is not available
        const uniqueVersions = new Set(versions.map(v => v.version));
        if (uniqueVersions.size > 1) {
          conflicts.push({
            name: depName,
            versions: versions,
            isCritical: config.criticalPackages.includes(depName)
          });
        }
        return;
      }
      
      // Group versions that satisfy each other
      const versionGroups = [];
      
      versions.forEach(versionEntry => {
        // Skip file: and link: references as they're local dependencies
        if (versionEntry.version.startsWith('file:') || 
            versionEntry.version.startsWith('link:')) {
          return;
        }
        
        // Try to find a compatible version group
        const compatibleGroup = versionGroups.find(group => {
          return group.some(groupEntry => {
            // Handle special version ranges
            if (groupEntry.version === '*' || versionEntry.version === '*') {
              return true; // Wildcard is compatible with anything
            }
            
            // Handle workspace references
            if (groupEntry.version.includes('workspace:') || 
                versionEntry.version.includes('workspace:')) {
              return true; // Assume workspace references are compatible
            }
            
            try {
              // Check if versions satisfy each other
              return semver.satisfies(
                semver.minVersion(groupEntry.version) || groupEntry.version, 
                versionEntry.version
              ) || semver.satisfies(
                semver.minVersion(versionEntry.version) || versionEntry.version, 
                groupEntry.version
              );
            } catch (e) {
              // If semver parsing fails, assume incompatible
              return false;
            }
          });
        });
        
        if (compatibleGroup) {
          compatibleGroup.push(versionEntry);
        } else {
          versionGroups.push([versionEntry]);
        }
      });
      
      // If we have more than one version group, we have a conflict
      if (versionGroups.length > 1) {
        conflicts.push({
          name: depName,
          versions: versions,
          versionGroups: versionGroups,
          isCritical: config.criticalPackages.includes(depName)
        });
      }
    } catch (error) {
      // Fallback to simple string comparison if semver check fails
      const uniqueVersions = new Set(versions.map(v => v.version));
      if (uniqueVersions.size > 1) {
        conflicts.push({
          name: depName,
          versions: versions,
          isCritical: config.criticalPackages.includes(depName),
          error: error.message
        });
      }
    }
  });
  
  return conflicts;
}

/**
 * Validate peer dependencies
 * @param {Array} packages - Array of parsed package.json data
 * @returns {Object} - Object containing missing peer dependencies
 */
function validatePeerDependencies(packages) {
  const missingPeers = [];
  
  packages.forEach(pkg => {
    if (!pkg) return;
    
    // Get all dependencies that might satisfy peer dependencies
    const availableDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies
    };
    
    // Check each dependency's peer requirements
    Object.entries(availableDeps).forEach(([depName, depVersion]) => {
      // Find the package.json for this dependency in node_modules
      const depPkgPath = path.join(pkg.directory, 'node_modules', depName, 'package.json');
      
      if (fs.existsSync(depPkgPath)) {
        try {
          const depPkg = JSON.parse(fs.readFileSync(depPkgPath, 'utf8'));
          const peerDeps = depPkg.peerDependencies || {};
          
          // Check if peer dependencies are satisfied
          Object.entries(peerDeps).forEach(([peerName, peerVersion]) => {
            const hasPeer = availableDeps[peerName];
            
            if (!hasPeer) {
              missingPeers.push({
                package: pkg.name,
                dependency: depName,
                peer: peerName,
                requiredVersion: peerVersion,
                packagePath: pkg.path
              });
            }
            // Note: A more complete implementation would check version compatibility
          });
        } catch (error) {
          logger.verbose(`Error reading peer dependencies for ${depName}: ${error.message}`);
        }
      }
    });
  });
  
  return missingPeers;
}

/**
 * Check for missing dependencies by running npm/yarn/pnpm commands
 * @param {Array} packages - Array of parsed package.json data
 * @returns {Promise<Array>} - Array of missing dependencies
 */
async function checkMissingDependencies(packages) {
  const missing = [];
  
  for (const pkg of packages) {
    if (!pkg) continue;
    
    logger.verbose(`Checking dependencies for ${pkg.name}...`);
    
    try {
      // Use the appropriate package manager command
      let command;
      switch (config.packageManager) {
        case 'yarn':
          command = 'yarn check --verify-tree';
          break;
        case 'pnpm':
          command = 'pnpm list --depth=0';
          break;
        case 'npm':
        default:
          command = 'npm ls --depth=0';
      }
      
      // Execute the command in the package directory
      execSync(command, { cwd: pkg.directory, stdio: 'pipe' });
    } catch (error) {
      // Parse the error output to find missing dependencies
      const output = error.output ? Buffer.concat(error.output.filter(Boolean)).toString() : '';
      const missingDeps = parseMissingDependencies(output, pkg.name);
      
      if (missingDeps.length > 0) {
        missing.push({
          package: pkg.name,
          dependencies: missingDeps,
          packagePath: pkg.path
        });
      }
    }
  }
  
  return missing;
}

/**
 * Parse the output of npm/yarn/pnpm commands to find missing dependencies
 * @param {string} output - Command output
 * @param {string} packageName - Package name
 * @returns {Array} - Array of missing dependency information
 */
function parseMissingDependencies(output, packageName) {
  const missing = [];
  
  // Different package managers have different output formats
  // This is a simplified parser - you'd need to adapt it for your specific needs
  
  // For npm
  const npmMissingRegex = /missing: ([^@]+)@([^,]+)/g;
  let match;
  while ((match = npmMissingRegex.exec(output)) !== null) {
    missing.push({
      name: match[1],
      version: match[2]
    });
  }
  
  // For yarn (simplified)
  if (output.includes('error') && output.includes('required')) {
    const yarnLines = output.split('\n');
    for (const line of yarnLines) {
      if (line.includes('required')) {
        const parts = line.match(/"([^"]+)".*"([^"]+)"/);  
        if (parts && parts.length >= 3) {
          missing.push({
            name: parts[1],
            version: parts[2]
          });
        }
      }
    }
  }
  
  return missing;
}

/**
 * Generate suggested fixes for detected issues
 * @param {Object} results - Validation results
 * @returns {Array} - Array of suggested fixes
 */
function generateSuggestedFixes(results) {
  const suggestions = [];
  
  // Suggestions for version conflicts
  results.versionConflicts.forEach(conflict => {
    // Find the most common version
    const versionCounts = {};
    conflict.versions.forEach(v => {
      versionCounts[v.version] = (versionCounts[v.version] || 0) + 1;
    });
    
    const mostCommonVersion = Object.entries(versionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])[0];
    
    suggestions.push({
      type: 'versionConflict',
      package: conflict.name,
      suggestion: `Standardize on version ${mostCommonVersion} for ${conflict.name}`,
      action: `Update all package.json files to use the same version: "${conflict.name}": "${mostCommonVersion}"`
    });
    
    // For critical packages, suggest adding a resolution
    if (conflict.isCritical) {
      suggestions.push({
        type: 'versionConflict',
        package: conflict.name,
        suggestion: `Add a resolution for ${conflict.name} in the root package.json`,
        action: `Add to resolutions: "${conflict.name}": "${mostCommonVersion}"`
      });
    }
  });
  
  // Suggestions for circular dependencies
  results.circularDependencies.forEach(cycle => {
    const cyclePath = cycle.join(' -> ');
    suggestions.push({
      type: 'circularDependency',
      cycle: cyclePath,
      suggestion: `Break the circular dependency: ${cyclePath}`,
      action: `Consider creating a shared package for common functionality or restructuring the dependencies`
    });
  });
  
  // Suggestions for missing peer dependencies
  results.missingPeerDependencies.forEach(missing => {
    suggestions.push({
      type: 'missingPeerDependency',
      package: missing.package,
      dependency: missing.dependency,
      peer: missing.peer,
      suggestion: `Add missing peer dependency ${missing.peer} for ${missing.dependency}`,
      action: `Add "${missing.peer}": "${missing.requiredVersion}" to dependencies in ${missing.packagePath}`
    });
  });
  
  // Suggestions for missing dependencies
  results.missingDependencies.forEach(missing => {
    missing.dependencies.forEach(dep => {
      suggestions.push({
        type: 'missingDependency',
        package: missing.package,
        dependency: dep.name,
        suggestion: `Add missing dependency ${dep.name} to ${missing.package}`,
        action: `Add "${dep.name}": "${dep.version}" to dependencies in ${missing.packagePath}`
      });
    });
  });
  
  return suggestions;
}

/**
 * Apply fixes for detected issues if --fix flag is provided
 * @param {Array} suggestions - Array of suggested fixes
 * @returns {Promise<Array>} - Array of applied fixes
 */
async function applyFixes(suggestions) {
  if (!cliOptions.fix) {
    return [];
  }
  
  const appliedFixes = [];
  
  // Group suggestions by package.json file
  const fixesByFile = {};
  
  suggestions.forEach(suggestion => {
    if (suggestion.type === 'versionConflict' && suggestion.action.includes('Update all package.json')) {
      // Handle version conflicts (requires updating multiple files)
      results.versionConflicts
        .find(conflict => conflict.name === suggestion.package)?.versions
        .forEach(version => {
          const filePath = version.packagePath;
          if (!fixesByFile[filePath]) {
            fixesByFile[filePath] = [];
          }
          
          fixesByFile[filePath].push({
            type: 'updateDependency',
            package: suggestion.package,
            version: suggestion.action.match(/"([^"]+)"$/)[1]
          });
        });
    } else if (suggestion.type === 'missingPeerDependency' || suggestion.type === 'missingDependency') {
      // Handle missing dependencies
      const filePath = suggestion.type === 'missingPeerDependency' 
        ? suggestion.packagePath 
        : results.missingDependencies.find(m => m.package === suggestion.package)?.packagePath;
      
      if (filePath) {
        if (!fixesByFile[filePath]) {
          fixesByFile[filePath] = [];
        }
        
        fixesByFile[filePath].push({
          type: 'addDependency',
          package: suggestion.type === 'missingPeerDependency' ? suggestion.peer : suggestion.dependency,
          version: suggestion.type === 'missingPeerDependency' 
            ? suggestion.action.match(/"([^"]+)":/)[1] 
            : suggestion.action.match(/"([^"]+)"$/)[1]
        });
      }
    }
    // Note: Circular dependencies require manual intervention
  });
  
  // Apply fixes to each file
  for (const [filePath, fixes] of Object.entries(fixesByFile)) {
    try {
      const packageJson = JSON.parse(await readFile(filePath, 'utf8'));
      let modified = false;
      
      fixes.forEach(fix => {
        if (fix.type === 'updateDependency') {
          // Update dependency version
          if (packageJson.dependencies && packageJson.dependencies[fix.package]) {
            packageJson.dependencies[fix.package] = fix.version;
            modified = true;
            appliedFixes.push(`Updated ${fix.package} to ${fix.version} in ${filePath}`);
          }
          if (packageJson.devDependencies && packageJson.devDependencies[fix.package]) {
            packageJson.devDependencies[fix.package] = fix.version;
            modified = true;
            appliedFixes.push(`Updated ${fix.package} to ${fix.version} in ${filePath}`);
          }
        } else if (fix.type === 'addDependency') {
          // Add missing dependency
          if (!packageJson.dependencies) {
            packageJson.dependencies = {};
          }
          packageJson.dependencies[fix.package] = fix.version;
          modified = true;
          appliedFixes.push(`Added ${fix.package}@${fix.version} to ${filePath}`);
        }
      });
      
      if (modified) {
        // Write updated package.json
        await fs.promises.writeFile(
          filePath, 
          JSON.stringify(packageJson, null, 2) + '\n',
          'utf8'
        );
      }
    } catch (error) {
      logger.error(`Error applying fixes to ${filePath}: ${error.message}`);
    }
  }
  
  return appliedFixes;
}

/**
 * Generate a report of validation results
 * @param {Object} results - Validation results
 * @param {Array} appliedFixes - Array of applied fixes
 */
function generateReport(results, appliedFixes = []) {
  logger.section('DEPENDENCY VALIDATION REPORT');
  
  // Version conflicts
  logger.section('VERSION CONFLICTS');
  if (results.versionConflicts.length === 0) {
    logger.success('No version conflicts detected');
  } else {
    logger.error(`Found ${results.versionConflicts.length} version conflicts:`);
    
    // Sort conflicts to show critical ones first
    const sortedConflicts = [...results.versionConflicts].sort((a, b) => {
      // Sort by critical status first
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
    
    sortedConflicts.forEach(conflict => {
      const isCritical = conflict.isCritical ? ' (CRITICAL)' : '';
      console.log(`\n🔴 ${conflict.name}${isCritical} has conflicting versions:`);
      
      // Group by version for cleaner output
      const byVersion = {};
      conflict.versions.forEach(v => {
        if (!byVersion[v.version]) {
          byVersion[v.version] = [];
        }
        byVersion[v.version].push(v.packageName);
      });
      
      Object.entries(byVersion).forEach(([version, packages]) => {
        console.log(`  - Version ${version} used by: ${packages.join(', ')}`);
      });
      
      // If we have version groups from semver analysis, show them
      if (conflict.versionGroups) {
        console.log('\n  Incompatible version groups:');
        conflict.versionGroups.forEach((group, i) => {
          console.log(`  Group ${i + 1}:`);
          group.forEach(entry => {
            console.log(`    - ${entry.version} in ${entry.packageName}`);
          });
        });
      }
      
      // For critical packages, provide more guidance
      if (conflict.isCritical) {
        console.log('\n  This is a critical package that may cause build failures if not resolved.');
        console.log('  Consider adding a resolution in the root package.json to enforce a single version.');
      }
    });
  }
  
  // Circular dependencies
  logger.section('CIRCULAR DEPENDENCIES');
  if (results.circularDependencies.length === 0) {
    logger.success('No circular dependencies detected');
  } else {
    logger.error(`Found ${results.circularDependencies.length} circular dependencies:`);
    results.circularDependencies.forEach((cycle, index) => {
      console.log(`\n🔄 Cycle #${index + 1}: ${cycle.join(' -> ')}`);
      
      // Provide guidance on breaking circular dependencies
      console.log('\n  Potential solutions:');
      console.log('  1. Create a shared package for common functionality');
      console.log('  2. Use dependency injection to invert dependencies');
      console.log('  3. Restructure the code to eliminate the circular reference');
      
      // If this is a critical cycle (contains critical packages), highlight it
      const containsCriticalPackage = cycle.some(pkg => config.criticalPackages.includes(pkg));
      if (containsCriticalPackage) {
        console.log('\n  ⚠️ This cycle contains critical packages and may cause build failures!');
        console.log('  It should be resolved immediately to prevent build issues.');
      }
    });
  }
  
  // Missing peer dependencies
  logger.section('MISSING PEER DEPENDENCIES');
  if (results.missingPeerDependencies.length === 0) {
    logger.success('No missing peer dependencies detected');
  } else {
    logger.warning(`Found ${results.missingPeerDependencies.length} missing peer dependencies:`);
    results.missingPeerDependencies.forEach(missing => {
      console.log(`\n⚠️ ${missing.package} is missing peer dependency:`);
      console.log(`  - ${missing.peer}@${missing.requiredVersion} required by ${missing.dependency}`);
    });
  }
  
  // Missing dependencies
  logger.section('MISSING DEPENDENCIES');
  if (results.missingDependencies.length === 0) {
    logger.success('No missing dependencies detected');
  } else {
    logger.warning(`Found ${results.missingDependencies.length} packages with missing dependencies:`);
    results.missingDependencies.forEach(missing => {
      console.log(`\n⚠️ ${missing.package} is missing dependencies:`);
      missing.dependencies.forEach(dep => {
        console.log(`  - ${dep.name}@${dep.version}`);
      });
    });
  }
  
  // Suggested fixes
  logger.section('SUGGESTED FIXES');
  if (results.suggestedFixes.length === 0) {
    logger.success('No fixes needed');
  } else {
    console.log(`\n🔧 ${results.suggestedFixes.length} suggested fixes:`);
    results.suggestedFixes.forEach((fix, index) => {
      console.log(`\n${index + 1}. ${fix.suggestion}`);
      console.log(`   Action: ${fix.action}`);
    });
  }
  
  // Applied fixes
  if (appliedFixes.length > 0) {
    logger.section('APPLIED FIXES');
    logger.success(`Applied ${appliedFixes.length} fixes:`);
    appliedFixes.forEach(fix => {
      console.log(`  - ${fix}`);
    });
  }
  
  // Summary
  logger.section('SUMMARY');
  
  // Count workspace issues
  let workspaceIssuesCount = 0;
  if (results.workspaceIssues) {
    Object.values(results.workspaceIssues).forEach(issues => {
      workspaceIssuesCount += issues.missingInternalDependencies.length;
      workspaceIssuesCount += issues.externalDependencyVersionConflicts.length;
    });
  }
  
  // Count critical issues
  const criticalVersionConflicts = results.versionConflicts.filter(c => c.isCritical).length;
  const criticalCircularDeps = results.circularDependencies.filter(cycle => 
    cycle.some(pkg => config.criticalPackages.includes(pkg))
  ).length;
  
  // Determine if there are errors that should cause the process to exit with an error code
  const hasErrors = (
    (results.versionConflicts.length > 0 && config.exitOnError.versionConflicts) ||
    (results.circularDependencies.length > 0 && config.exitOnError.circularDependencies) ||
    (results.missingPeerDependencies.length > 0 && config.exitOnError.missingPeerDependencies) ||
    (results.missingDependencies.length > 0 && config.exitOnError.missingDependencies)
  );
  
  // Print summary table
  console.log('\nIssue Type                    | Total | Critical');
  console.log('------------------------------|-------|--------');
  console.log(`Version Conflicts             | ${results.versionConflicts.length.toString().padEnd(5)} | ${criticalVersionConflicts}`);
  console.log(`Circular Dependencies         | ${results.circularDependencies.length.toString().padEnd(5)} | ${criticalCircularDeps}`);
  console.log(`Missing Peer Dependencies     | ${results.missingPeerDependencies.length.toString().padEnd(5)} | -`);
  console.log(`Missing Dependencies          | ${results.missingDependencies.length.toString().padEnd(5)} | -`);
  console.log(`Workspace-Specific Issues     | ${workspaceIssuesCount.toString().padEnd(5)} | -`);
  console.log('------------------------------|-------|--------');
  
  // Print overall status
  if (hasErrors) {
    logger.error('Validation failed with critical issues');
    if (cliOptions.fix) {
      logger.info('Some issues were automatically fixed, but manual intervention is still required');
    } else {
      logger.info('Run with --fix to attempt automatic fixes for some issues');
    }
  } else if (
    results.versionConflicts.length > 0 ||
    results.circularDependencies.length > 0 ||
    results.missingPeerDependencies.length > 0 ||
    results.missingDependencies.length > 0 ||
    workspaceIssuesCount > 0
  ) {
    logger.warning('Validation completed with non-critical issues');
    if (!cliOptions.fix) {
      logger.info('Run with --fix to attempt automatic fixes for some issues');
    }
  } else {
    logger.success('Validation completed successfully with no issues');
  }
  
  // Print specific recommendations for critical issues
  if (criticalVersionConflicts > 0) {
    console.log('\nud83dudea8 Critical version conflicts detected!');
    console.log('  These conflicts in core packages may cause build failures.');
    console.log('  Consider adding resolutions in the root package.json to enforce consistent versions.');
  }
  
  if (criticalCircularDeps > 0) {
    console.log('\nud83dudea8 Critical circular dependencies detected!');
    console.log('  These circular dependencies involving core packages may cause build failures.');
    console.log('  Consider restructuring the dependencies to break these cycles.');
  }
  
  return hasErrors;
}

/**
 * Group packages by workspace
 * @param {Array} packages - Array of parsed package.json data
 * @returns {Object} - Object with workspace paths as keys and arrays of packages as values
 */
function groupPackagesByWorkspace(packages) {
  const workspaces = {};
  
  // Initialize workspaces
  config.workspaceRoots.forEach(root => {
    workspaces[root] = [];
  });
  
  // Group packages by workspace
  packages.forEach(pkg => {
    if (!pkg) return;
    
    // Find which workspace this package belongs to
    const workspace = config.workspaceRoots.find(root => 
      pkg.directory.startsWith(path.resolve(process.cwd(), root))
    );
    
    if (workspace) {
      workspaces[workspace].push(pkg);
    } else {
      // If it doesn't match any workspace, put it in a special category
      if (!workspaces['other']) {
        workspaces['other'] = [];
      }
      workspaces['other'].push(pkg);
    }
  });
  
  return workspaces;
}

/**
 * Detect workspace-specific issues
 * @param {Object} workspaces - Object with workspace paths as keys and arrays of packages as values
 * @returns {Object} - Object with workspace-specific issues
 */
function detectWorkspaceIssues(workspaces) {
  const issues = {};
  
  Object.entries(workspaces).forEach(([workspace, packages]) => {
    if (packages.length === 0) return;
    
    issues[workspace] = {
      missingInternalDependencies: [],
      externalDependencyVersionConflicts: [],
      workspaceDependencyVersionConflicts: []
    };
    
    // Create a map of all packages in this workspace
    const packageMap = {};
    packages.forEach(pkg => {
      if (pkg.name) {
        packageMap[pkg.name] = pkg;
      }
    });
    
    // Check for missing internal dependencies
    packages.forEach(pkg => {
      if (!pkg.dependencies) return;
      
      Object.entries(pkg.dependencies).forEach(([depName, depVersion]) => {
        // Check if this is a workspace dependency
        if (depVersion.startsWith('workspace:') || 
            depVersion.startsWith('file:') || 
            depVersion.startsWith('link:')) {
          // Check if the dependency exists in the workspace
          const depExists = packages.some(p => p.name === depName);
          if (!depExists) {
            issues[workspace].missingInternalDependencies.push({
              package: pkg.name,
              dependency: depName,
              version: depVersion,
              packagePath: pkg.path
            });
          }
        }
      });
    });
    
    // Check for external dependency version conflicts within this workspace
    const externalDeps = {};
    packages.forEach(pkg => {
      if (!pkg.dependencies) return;
      
      Object.entries(pkg.dependencies).forEach(([depName, depVersion]) => {
        // Skip workspace dependencies
        if (depVersion.startsWith('workspace:') || 
            depVersion.startsWith('file:') || 
            depVersion.startsWith('link:')) {
          return;
        }
        
        if (!externalDeps[depName]) {
          externalDeps[depName] = [];
        }
        
        externalDeps[depName].push({
          version: depVersion,
          packageName: pkg.name,
          packagePath: pkg.path
        });
      });
    });
    
    // Find conflicts in external dependencies
    Object.entries(externalDeps).forEach(([depName, versions]) => {
      if (versions.length <= 1) return;
      
      const uniqueVersions = new Set(versions.map(v => v.version));
      if (uniqueVersions.size > 1) {
        issues[workspace].externalDependencyVersionConflicts.push({
          name: depName,
          versions: versions,
          isCritical: config.criticalPackages.includes(depName)
        });
      }
    });
  });
  
  return issues;
}

/**
 * Main function to run the validation
 */
async function main() {
  try {
    logger.section('DEPENDENCY VALIDATION');
    logger.info('Scanning for package.json files...');
    
    // Find all package.json files
    const packageJsonFiles = await findPackageJsonFiles(process.cwd());
    logger.success(`Found ${packageJsonFiles.length} package.json files`);
    
    // Parse package.json files
    logger.info('Parsing package.json files...');
    const packages = [];
    for (const filePath of packageJsonFiles) {
      const packageData = await parsePackageJson(filePath);
      if (packageData) {
        packages.push(packageData);
      }
    }
    logger.success(`Successfully parsed ${packages.length} package.json files`);
    
    // Group packages by workspace
    const workspaces = groupPackagesByWorkspace(packages);
    logger.info(`Grouped packages into ${Object.keys(workspaces).length} workspaces`);
    
    // Detect workspace-specific issues
    const workspaceIssues = detectWorkspaceIssues(workspaces);
    logger.info('Analyzed workspace-specific dependency issues');
    
    // Build dependency graph
    logger.info('Building dependency graph...');
    const { graph, packageMap } = buildDependencyGraph(packages);
    logger.success(`Built dependency graph with ${Object.keys(graph).length} nodes`);
    
    // Detect circular dependencies
    logger.info('Detecting circular dependencies...');
    results.circularDependencies = detectCircularDependencies(graph);
    logger.info(`Found ${results.circularDependencies.length} circular dependencies`);
    
    // Check version conflicts
    logger.info('Checking for version conflicts...');
    results.versionConflicts = checkVersionConflicts(packages);
    logger.info(`Found ${results.versionConflicts.length} version conflicts`);
    
    // Validate peer dependencies
    logger.info('Validating peer dependencies...');
    results.missingPeerDependencies = validatePeerDependencies(packages);
    logger.info(`Found ${results.missingPeerDependencies.length} missing peer dependencies`);
    
    // Check for missing dependencies
    logger.info('Checking for missing dependencies...');
    results.missingDependencies = await checkMissingDependencies(packages);
    logger.info(`Found ${results.missingDependencies.length} packages with missing dependencies`);
    
    // Analyze workspace-specific issues
    logger.info('Analyzing workspace-specific issues...');
    results.workspaceIssues = detectWorkspaceIssues(workspaces);
    
    // Generate suggested fixes
    logger.info('Generating suggested fixes...');
    results.suggestedFixes = generateSuggestedFixes(results);
    logger.info(`Generated ${results.suggestedFixes.length} suggested fixes`);
    
    // Apply fixes if requested
    let appliedFixes = [];
    if (cliOptions.fix) {
      logger.info('Applying fixes...');
      appliedFixes = await applyFixes(results.suggestedFixes);
      logger.info(`Applied ${appliedFixes.length} fixes`);
    }
    
    // Generate report
    const hasErrors = generateReport(results, appliedFixes);
    
    // Add workspace-specific issues to the report
    if (results.workspaceIssues) {
      logger.section('WORKSPACE-SPECIFIC ISSUES');
      let hasWorkspaceIssues = false;
      
      Object.entries(results.workspaceIssues).forEach(([workspace, issues]) => {
        const missingCount = issues.missingInternalDependencies.length;
        const externalConflictsCount = issues.externalDependencyVersionConflicts.length;
        
        if (missingCount > 0 || externalConflictsCount > 0) {
          hasWorkspaceIssues = true;
          console.log(`\n📋 Workspace: ${workspace}`);
          
          if (missingCount > 0) {
            console.log(`\n  Missing internal dependencies (${missingCount}):`);
            issues.missingInternalDependencies.forEach(missing => {
              console.log(`  - ${missing.package} depends on ${missing.dependency}@${missing.version} but it's not found in this workspace`);
            });
          }
          
          if (externalConflictsCount > 0) {
            console.log(`\n  External dependency conflicts (${externalConflictsCount}):`);
            issues.externalDependencyVersionConflicts.forEach(conflict => {
              const isCritical = conflict.isCritical ? ' (CRITICAL)' : '';
              console.log(`  - ${conflict.name}${isCritical} has conflicting versions within this workspace:`);
              
              // Group by version
              const byVersion = {};
              conflict.versions.forEach(v => {
                if (!byVersion[v.version]) {
                  byVersion[v.version] = [];
                }
                byVersion[v.version].push(v.packageName);
              });
              
              Object.entries(byVersion).forEach(([version, packages]) => {
                console.log(`    * Version ${version} used by: ${packages.join(', ')}`);
              });
            });
          }
        }
      });
      
      if (!hasWorkspaceIssues) {
        logger.success('No workspace-specific issues detected');
      }
    }
    
    // Exit with appropriate code
    process.exit(hasErrors ? 1 : 0);
  } catch (error) {
    logger.error(`Unexpected error: ${error.message}`);
    if (cliOptions.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the validation
main();