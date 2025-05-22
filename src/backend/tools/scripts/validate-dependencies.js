#!/usr/bin/env node

/**
 * AUSTA SuperApp Dependency Validator
 * 
 * This script performs comprehensive dependency validation across the monorepo to identify
 * and resolve version conflicts, missing dependencies, and improper workspace references.
 * 
 * Features:
 * - Analyzes dependency tree to identify conflicts
 * - Validates workspace references in package.json files
 * - Checks TypeScript project references against package dependencies
 * - Identifies circular dependencies
 * - Provides comprehensive error reporting with suggested fixes
 * 
 * Usage:
 * node validate-dependencies.js [options]
 * 
 * Options:
 *   --fix             Attempt to fix common issues automatically
 *   --verbose         Show detailed output
 *   --json            Output results in JSON format
 *   --ignore-dev      Ignore devDependencies in analysis
 *   --scope=<package> Limit analysis to a specific package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '../../..'),
  workspacePackages: [],
  ignoredPackages: [
    'typescript', // TypeScript is managed at the root level
    'eslint', // ESLint is managed at the root level
    'prettier', // Prettier is managed at the root level
    'jest', // Jest is managed at the root level
  ],
  ignoredPaths: [
    'node_modules',
    'dist',
    'coverage',
    '.git',
  ],
  criticalPackages: [
    'axios', // Security-critical package with known vulnerabilities
    'minimatch', // Known to cause build failures if mismatched
    'semver', // Known to cause build failures if mismatched
    'ws', // Known to cause build failures if mismatched
    'follow-redirects', // Security-critical package
    'node-fetch', // Security-critical package
    'lodash', // Common source of version conflicts
    'react', // Must be consistent across all packages
    'react-dom', // Must be consistent with react
    'react-native', // Must be consistent across mobile packages
    '@nestjs/core', // Core framework must be consistent
    '@nestjs/common', // Core framework must be consistent
    'graphql', // Must be consistent across all packages
    '@prisma/client', // Database client must be consistent
    'kafkajs', // Messaging client must be consistent
    'ioredis', // Cache client must be consistent
  ],
};

// Command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  json: args.includes('--json'),
  ignoreDev: args.includes('--ignore-dev'),
  scope: args.find(arg => arg.startsWith('--scope='))?.split('=')[1],
};

// Result tracking
const results = {
  conflicts: [],
  missingDependencies: [],
  workspaceIssues: [],
  circularDependencies: [],
  tsConfigIssues: [],
  suggestions: [],
  summary: {
    totalPackages: 0,
    packagesWithIssues: 0,
    totalIssues: 0,
    criticalIssues: 0,
  },
};

/**
 * Color formatting for console output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

/**
 * Logging utilities
 */
const logger = {
  info: (message) => {
    if (!options.json) {
      console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
    }
  },
  warn: (message) => {
    if (!options.json) {
      console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
    }
  },
  error: (message) => {
    if (!options.json) {
      console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
    }
  },
  success: (message) => {
    if (!options.json) {
      console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
    }
  },
  verbose: (message) => {
    if (options.verbose && !options.json) {
      console.log(`${colors.cyan}[VERBOSE]${colors.reset} ${message}`);
    }
  },
};

/**
 * Find all package.json files in the monorepo
 * @param {string} dir - Directory to start searching from
 * @param {Array<string>} ignoredPaths - Paths to ignore
 * @returns {Array<string>} - Array of package.json file paths
 */
function findPackageJsonFiles(dir, ignoredPaths) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const relativePath = path.relative(CONFIG.rootDir, filePath);
    
    // Skip ignored paths
    if (ignoredPaths.some(ignoredPath => relativePath.includes(ignoredPath))) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findPackageJsonFiles(filePath, ignoredPaths));
    } else if (file === 'package.json') {
      results.push(filePath);
    }
  }
  
  return results;
}

/**
 * Load and parse a package.json file
 * @param {string} filePath - Path to package.json file
 * @returns {Object} - Parsed package.json content
 */
function loadPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return {
      path: filePath,
      content: JSON.parse(content),
    };
  } catch (error) {
    logger.error(`Failed to load package.json at ${filePath}: ${error.message}`);
    return {
      path: filePath,
      content: null,
      error: error.message,
    };
  }
}

/**
 * Load and parse a tsconfig.json file
 * @param {string} packageDir - Directory containing the package
 * @returns {Object|null} - Parsed tsconfig.json content or null if not found
 */
function loadTsConfig(packageDir) {
  const tsConfigPath = path.join(packageDir, 'tsconfig.json');
  
  if (!fs.existsSync(tsConfigPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(tsConfigPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Failed to load tsconfig.json at ${tsConfigPath}: ${error.message}`);
    return null;
  }
}

/**
 * Check if a package is a workspace package
 * @param {Object} packageJson - Package.json content
 * @returns {boolean} - True if the package is a workspace package
 */
function isWorkspacePackage(packageJson) {
  return packageJson.name && !packageJson.private;
}

/**
 * Get all workspace packages from the root package.json
 * @param {Object} rootPackageJson - Root package.json content
 * @returns {Array<string>} - Array of workspace package patterns
 */
function getWorkspacePackages(rootPackageJson) {
  if (rootPackageJson.workspaces) {
    if (Array.isArray(rootPackageJson.workspaces)) {
      return rootPackageJson.workspaces;
    }
    if (rootPackageJson.workspaces.packages) {
      return rootPackageJson.workspaces.packages;
    }
  }
  return [];
}

/**
 * Build a dependency map for all packages
 * @param {Array<Object>} packages - Array of package.json contents
 * @returns {Object} - Dependency map
 */
function buildDependencyMap(packages) {
  const dependencyMap = {};
  
  for (const pkg of packages) {
    if (!pkg.content) continue;
    
    const packageName = pkg.content.name;
    const packagePath = pkg.path;
    const dependencies = { ...pkg.content.dependencies };
    
    if (!options.ignoreDev && pkg.content.devDependencies) {
      Object.assign(dependencies, pkg.content.devDependencies);
    }
    
    dependencyMap[packageName] = {
      path: packagePath,
      dependencies,
      workspaceDependencies: Object.keys(dependencies)
        .filter(dep => CONFIG.workspacePackages.includes(dep)),
    };
  }
  
  return dependencyMap;
}

/**
 * Check for version conflicts across packages
 * @param {Array<Object>} packages - Array of package.json contents
 * @returns {Array<Object>} - Array of conflicts
 */
function checkVersionConflicts(packages) {
  const conflicts = [];
  const dependencyVersions = {};
  
  // Build a map of all dependencies and their versions across packages
  for (const pkg of packages) {
    if (!pkg.content) continue;
    
    const packageName = pkg.content.name;
    const dependencies = { ...pkg.content.dependencies };
    
    if (!options.ignoreDev && pkg.content.devDependencies) {
      Object.assign(dependencies, pkg.content.devDependencies);
    }
    
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      // Skip workspace packages
      if (CONFIG.workspacePackages.includes(depName)) {
        continue;
      }
      
      // Skip ignored packages
      if (CONFIG.ignoredPackages.includes(depName)) {
        continue;
      }
      
      if (!dependencyVersions[depName]) {
        dependencyVersions[depName] = [];
      }
      
      dependencyVersions[depName].push({
        packageName,
        version: depVersion,
        path: pkg.path,
      });
    }
  }
  
  // Check for conflicts
  for (const [depName, versions] of Object.entries(dependencyVersions)) {
    if (versions.length <= 1) continue;
    
    const uniqueVersions = new Set(versions.map(v => v.version));
    
    if (uniqueVersions.size > 1) {
      const isCritical = CONFIG.criticalPackages.includes(depName);
      
      conflicts.push({
        dependency: depName,
        versions: Array.from(uniqueVersions),
        packages: versions,
        critical: isCritical,
      });
      
      if (isCritical) {
        results.summary.criticalIssues++;
      }
    }
  }
  
  return conflicts;
}

/**
 * Check for missing dependencies
 * @param {Object} dependencyMap - Dependency map
 * @returns {Array<Object>} - Array of missing dependencies
 */
function checkMissingDependencies(dependencyMap) {
  const missing = [];
  
  // Check if all workspace dependencies are properly declared
  for (const [packageName, packageInfo] of Object.entries(dependencyMap)) {
    const packageDir = path.dirname(packageInfo.path);
    
    // Check for imports in JavaScript/TypeScript files
    try {
      // Use a simple grep to find import statements
      // This is a basic implementation and could be improved with a proper parser
      const grepCommand = `grep -r "import .* from " --include="*.js" --include="*.ts" --include="*.tsx" ${packageDir} | grep -v "node_modules" | grep -v "dist"`;
      const grepResult = execSync(grepCommand, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      
      const importLines = grepResult.split('\n').filter(Boolean);
      
      for (const line of importLines) {
        // Extract the imported package name
        const importMatch = line.match(/import .* from ['"]([^'"./][^'"]*)['"]/);
        if (!importMatch) continue;
        
        let importedPackage = importMatch[1];
        
        // Handle scoped packages and submodules
        if (importedPackage.startsWith('@')) {
          // For scoped packages, we need to include the scope
          const scopedParts = importedPackage.split('/');
          if (scopedParts.length > 1) {
            importedPackage = `${scopedParts[0]}/${scopedParts[1]}`;
          }
        } else {
          // For non-scoped packages, we only care about the package name, not submodules
          importedPackage = importedPackage.split('/')[0];
        }
        
        // Check if the imported package is a dependency
        if (
          !packageInfo.dependencies[importedPackage] &&
          !CONFIG.workspacePackages.includes(importedPackage) &&
          !importedPackage.startsWith('.') // Skip relative imports
        ) {
          missing.push({
            packageName,
            missingDependency: importedPackage,
            importLine: line,
            filePath: line.split(':')[0],
          });
        }
      }
    } catch (error) {
      // Grep might fail if no matches are found, which is fine
      if (!error.message.includes('No such file or directory')) {
        logger.verbose(`Error checking imports in ${packageName}: ${error.message}`);
      }
    }
  }
  
  return missing;
}

/**
 * Check for workspace reference issues
 * @param {Array<Object>} packages - Array of package.json contents
 * @param {Array<string>} workspacePackages - Array of workspace package names
 * @returns {Array<Object>} - Array of workspace reference issues
 */
function checkWorkspaceReferences(packages, workspacePackages) {
  const issues = [];
  
  for (const pkg of packages) {
    if (!pkg.content) continue;
    
    const packageName = pkg.content.name;
    const dependencies = { ...pkg.content.dependencies };
    
    if (!options.ignoreDev && pkg.content.devDependencies) {
      Object.assign(dependencies, pkg.content.devDependencies);
    }
    
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      // Check if this is a workspace package
      if (workspacePackages.includes(depName)) {
        // Workspace references should use workspace: protocol or file: protocol
        if (!depVersion.startsWith('workspace:') && !depVersion.startsWith('file:')) {
          issues.push({
            packageName,
            workspaceDependency: depName,
            version: depVersion,
            path: pkg.path,
            message: `Workspace package ${depName} should be referenced using workspace: protocol`,
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Check for circular dependencies
 * @param {Object} dependencyMap - Dependency map
 * @returns {Array<Object>} - Array of circular dependencies
 */
function checkCircularDependencies(dependencyMap) {
  const circular = [];
  
  function detectCircular(packageName, visited = new Set(), path = []) {
    if (visited.has(packageName)) {
      const circularPath = [...path, packageName];
      const startIndex = circularPath.indexOf(packageName);
      const cycle = circularPath.slice(startIndex);
      
      circular.push({
        cycle,
        packageName,
      });
      
      return true;
    }
    
    visited.add(packageName);
    path.push(packageName);
    
    const packageInfo = dependencyMap[packageName];
    if (!packageInfo) return false;
    
    for (const dep of packageInfo.workspaceDependencies) {
      if (detectCircular(dep, new Set(visited), [...path])) {
        return true;
      }
    }
    
    return false;
  }
  
  for (const packageName of Object.keys(dependencyMap)) {
    detectCircular(packageName);
  }
  
  return circular;
}

/**
 * Check TypeScript project references against package dependencies
 * @param {Array<Object>} packages - Array of package.json contents
 * @returns {Array<Object>} - Array of TypeScript project reference issues
 */
function checkTsConfigReferences(packages) {
  const issues = [];
  
  for (const pkg of packages) {
    if (!pkg.content) continue;
    
    const packageName = pkg.content.name;
    const packageDir = path.dirname(pkg.path);
    const tsConfig = loadTsConfig(packageDir);
    
    if (!tsConfig) continue;
    
    // Check if the package has TypeScript project references
    if (tsConfig.references && Array.isArray(tsConfig.references)) {
      const dependencies = { ...pkg.content.dependencies };
      
      if (!options.ignoreDev && pkg.content.devDependencies) {
        Object.assign(dependencies, pkg.content.devDependencies);
      }
      
      // Check each project reference
      for (const reference of tsConfig.references) {
        if (reference.path) {
          // Resolve the referenced project path
          const referencePath = path.resolve(packageDir, reference.path);
          const referencePackageJsonPath = path.join(referencePath, 'package.json');
          
          // Check if the referenced project exists
          if (fs.existsSync(referencePackageJsonPath)) {
            try {
              const referencePackageJson = JSON.parse(fs.readFileSync(referencePackageJsonPath, 'utf8'));
              const referenceName = referencePackageJson.name;
              
              // Check if the referenced project is a dependency
              if (referenceName && !dependencies[referenceName]) {
                issues.push({
                  packageName,
                  referenceName,
                  referencePath: reference.path,
                  message: `TypeScript project reference to ${referenceName} is missing in package.json dependencies`,
                });
              }
            } catch (error) {
              logger.verbose(`Error checking TypeScript reference in ${packageName}: ${error.message}`);
            }
          }
        }
      }
    }
    
    // Check if path aliases in tsconfig.json match dependencies
    if (tsConfig.compilerOptions && tsConfig.compilerOptions.paths) {
      const dependencies = { ...pkg.content.dependencies };
      
      if (!options.ignoreDev && pkg.content.devDependencies) {
        Object.assign(dependencies, pkg.content.devDependencies);
      }
      
      for (const [alias, aliasPaths] of Object.entries(tsConfig.compilerOptions.paths)) {
        // Extract the package name from the alias (e.g., '@app/*' -> '@app')
        const aliasMatch = alias.match(/^(@[^/]+\/[^/]+|[^/]+)(?:\/\*)?$/);
        if (!aliasMatch) continue;
        
        const aliasPackage = aliasMatch[1];
        
        // Check if the alias points to a package that should be a dependency
        if (
          !aliasPackage.startsWith('.') && // Skip relative paths
          !dependencies[aliasPackage] &&
          CONFIG.workspacePackages.includes(aliasPackage)
        ) {
          issues.push({
            packageName,
            aliasPackage,
            alias,
            aliasPaths,
            message: `TypeScript path alias ${alias} is missing in package.json dependencies`,
          });
        }
      }
    }
  }
  
  return issues;
}

/**
 * Generate suggestions for fixing issues
 * @param {Object} results - Validation results
 * @returns {Array<string>} - Array of suggestions
 */
function generateSuggestions(results) {
  const suggestions = [];
  
  // Suggestions for version conflicts
  if (results.conflicts.length > 0) {
    suggestions.push('Add resolutions or overrides field to the root package.json to enforce consistent versions');
    suggestions.push('Consider using yarn or npm workspaces to manage dependencies more effectively');
    
    // Generate specific suggestions for critical packages
    const criticalConflicts = results.conflicts.filter(conflict => conflict.critical);
    if (criticalConflicts.length > 0) {
      suggestions.push('\nAdd the following to your root package.json to resolve critical conflicts:');
      suggestions.push('"resolutions": {');
      
      for (const conflict of criticalConflicts) {
        // Suggest the highest version
        const versions = conflict.versions.map(v => {
          // Remove any non-numeric characters for comparison
          const numericPart = v.replace(/[^0-9.]/g, '');
          return { original: v, numeric: numericPart };
        });
        
        // Sort versions and get the highest one
        versions.sort((a, b) => {
          const aParts = a.numeric.split('.').map(Number);
          const bParts = b.numeric.split('.').map(Number);
          
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = i < aParts.length ? aParts[i] : 0;
            const bVal = i < bParts.length ? bParts[i] : 0;
            
            if (aVal !== bVal) {
              return bVal - aVal; // Descending order
            }
          }
          
          return 0;
        });
        
        const suggestedVersion = versions[0].original;
        suggestions.push(`  "${conflict.dependency}": "${suggestedVersion}",`);
      }
      
      suggestions.push('}');
    }
  }
  
  // Suggestions for workspace references
  if (results.workspaceIssues.length > 0) {
    suggestions.push('\nUse workspace: protocol for referencing workspace packages:');
    for (const issue of results.workspaceIssues) {
      suggestions.push(`In ${issue.packageName}, change "${issue.workspaceDependency}": "${issue.version}" to "${issue.workspaceDependency}": "workspace:*"`);
    }
  }
  
  // Suggestions for circular dependencies
  if (results.circularDependencies.length > 0) {
    suggestions.push('\nResolve circular dependencies by:');
    suggestions.push('- Moving shared code to a common package');
    suggestions.push('- Refactoring to break dependency cycles');
    suggestions.push('- Using dependency injection instead of direct imports');
  }
  
  // Suggestions for TypeScript project references
  if (results.tsConfigIssues.length > 0) {
    suggestions.push('\nEnsure TypeScript project references match package.json dependencies:');
    for (const issue of results.tsConfigIssues) {
      suggestions.push(`In ${issue.packageName}, add "${issue.referenceName || issue.aliasPackage}": "workspace:*" to dependencies`);
    }
  }
  
  return suggestions;
}

/**
 * Apply fixes for common issues
 * @param {Object} results - Validation results
 */
function applyFixes(results) {
  logger.info('Applying fixes...');
  
  // Fix workspace references
  for (const issue of results.workspaceIssues) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(issue.path, 'utf8'));
      
      if (packageJson.dependencies && packageJson.dependencies[issue.workspaceDependency]) {
        packageJson.dependencies[issue.workspaceDependency] = 'workspace:*';
      }
      
      if (packageJson.devDependencies && packageJson.devDependencies[issue.workspaceDependency]) {
        packageJson.devDependencies[issue.workspaceDependency] = 'workspace:*';
      }
      
      fs.writeFileSync(issue.path, JSON.stringify(packageJson, null, 2) + '\n');
      logger.success(`Fixed workspace reference in ${issue.packageName} for ${issue.workspaceDependency}`);
    } catch (error) {
      logger.error(`Failed to fix workspace reference in ${issue.packageName}: ${error.message}`);
    }
  }
  
  // Add missing dependencies for TypeScript project references
  for (const issue of results.tsConfigIssues) {
    try {
      const packageJsonPath = path.join(CONFIG.rootDir, 'src/backend', issue.packageName, 'package.json');
      if (!fs.existsSync(packageJsonPath)) continue;
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencyName = issue.referenceName || issue.aliasPackage;
      
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      if (!packageJson.dependencies[dependencyName]) {
        packageJson.dependencies[dependencyName] = 'workspace:*';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        logger.success(`Added missing dependency ${dependencyName} to ${issue.packageName}`);
      }
    } catch (error) {
      logger.error(`Failed to add missing dependency in ${issue.packageName}: ${error.message}`);
    }
  }
  
  // Generate resolutions for critical conflicts in root package.json
  if (results.conflicts.filter(c => c.critical).length > 0) {
    try {
      const rootPackageJsonPath = path.join(CONFIG.rootDir, 'package.json');
      const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
      
      if (!rootPackageJson.resolutions) {
        rootPackageJson.resolutions = {};
      }
      
      for (const conflict of results.conflicts.filter(c => c.critical)) {
        // Find the highest version
        const versions = conflict.versions.map(v => {
          const numericPart = v.replace(/[^0-9.]/g, '');
          return { original: v, numeric: numericPart };
        });
        
        versions.sort((a, b) => {
          const aParts = a.numeric.split('.').map(Number);
          const bParts = b.numeric.split('.').map(Number);
          
          for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
            const aVal = i < aParts.length ? aParts[i] : 0;
            const bVal = i < bParts.length ? bParts[i] : 0;
            
            if (aVal !== bVal) {
              return bVal - aVal; // Descending order
            }
          }
          
          return 0;
        });
        
        const suggestedVersion = versions[0].original;
        rootPackageJson.resolutions[conflict.dependency] = suggestedVersion;
        logger.success(`Added resolution for ${conflict.dependency}@${suggestedVersion} to root package.json`);
      }
      
      fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2) + '\n');
    } catch (error) {
      logger.error(`Failed to add resolutions to root package.json: ${error.message}`);
    }
  }
}

/**
 * Print validation results
 * @param {Object} results - Validation results
 */
function printResults(results) {
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log('\n=== AUSTA SuperApp Dependency Validation Results ===\n');
  
  // Print version conflicts
  if (results.conflicts.length > 0) {
    console.log(`${colors.bold}${colors.red}Version Conflicts:${colors.reset}`);
    for (const conflict of results.conflicts) {
      const criticalMarker = conflict.critical ? ` ${colors.red}[CRITICAL]${colors.reset}` : '';
      console.log(`\n  ${colors.yellow}${conflict.dependency}${colors.reset}${criticalMarker}`);
      console.log(`  Versions found: ${conflict.versions.join(', ')}`);
      console.log('  Used in:');
      for (const pkg of conflict.packages) {
        console.log(`    - ${pkg.packageName} (${pkg.version})`);
      }
    }
    console.log('');
  }
  
  // Print missing dependencies
  if (results.missingDependencies.length > 0) {
    console.log(`${colors.bold}${colors.red}Missing Dependencies:${colors.reset}`);
    for (const missing of results.missingDependencies) {
      console.log(`\n  ${colors.yellow}${missing.packageName}${colors.reset} is missing dependency ${colors.cyan}${missing.missingDependency}${colors.reset}`);
      console.log(`  Used in: ${missing.filePath}`);
    }
    console.log('');
  }
  
  // Print workspace reference issues
  if (results.workspaceIssues.length > 0) {
    console.log(`${colors.bold}${colors.red}Workspace Reference Issues:${colors.reset}`);
    for (const issue of results.workspaceIssues) {
      console.log(`\n  ${colors.yellow}${issue.packageName}${colors.reset} references workspace package ${colors.cyan}${issue.workspaceDependency}${colors.reset} incorrectly`);
      console.log(`  Current: ${issue.version}`);
      console.log(`  Should be: workspace:*`);
    }
    console.log('');
  }
  
  // Print circular dependencies
  if (results.circularDependencies.length > 0) {
    console.log(`${colors.bold}${colors.red}Circular Dependencies:${colors.reset}`);
    for (const circular of results.circularDependencies) {
      console.log(`\n  ${colors.yellow}${circular.packageName}${colors.reset} has circular dependency:`);
      console.log(`  ${circular.cycle.join(' -> ')}`);
    }
    console.log('');
  }
  
  // Print TypeScript project reference issues
  if (results.tsConfigIssues.length > 0) {
    console.log(`${colors.bold}${colors.red}TypeScript Project Reference Issues:${colors.reset}`);
    for (const issue of results.tsConfigIssues) {
      console.log(`\n  ${colors.yellow}${issue.packageName}${colors.reset}: ${issue.message}`);
    }
    console.log('');
  }
  
  // Print suggestions
  if (results.suggestions.length > 0) {
    console.log(`${colors.bold}${colors.green}Suggestions:${colors.reset}`);
    for (const suggestion of results.suggestions) {
      console.log(`  ${suggestion}`);
    }
    console.log('');
  }
  
  // Print summary
  console.log(`${colors.bold}Summary:${colors.reset}`);
  console.log(`  Total packages analyzed: ${results.summary.totalPackages}`);
  console.log(`  Packages with issues: ${results.summary.packagesWithIssues}`);
  console.log(`  Total issues found: ${results.summary.totalIssues}`);
  console.log(`  Critical issues: ${results.summary.criticalIssues}`);
  console.log('');
  
  if (results.summary.totalIssues === 0) {
    console.log(`${colors.green}No dependency issues found!${colors.reset}`);
  } else if (results.summary.criticalIssues > 0) {
    console.log(`${colors.red}Critical dependency issues found! Please fix them before proceeding.${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Dependency issues found. Consider fixing them to improve project stability.${colors.reset}`);
  }
  
  console.log('\n=== End of Validation Results ===\n');
}

/**
 * Main function to run the validation
 */
async function main() {
  try {
    logger.info('Starting dependency validation...');
    
    // Load root package.json
    const rootPackageJsonPath = path.join(CONFIG.rootDir, 'package.json');
    const rootPackageJson = loadPackageJson(rootPackageJsonPath);
    
    if (!rootPackageJson.content) {
      logger.error('Failed to load root package.json. Aborting.');
      process.exit(1);
    }
    
    // Get workspace packages
    const workspacePatterns = getWorkspacePackages(rootPackageJson.content);
    logger.verbose(`Found workspace patterns: ${workspacePatterns.join(', ')}`);
    
    // Find all package.json files
    logger.info('Finding package.json files...');
    const packageJsonFiles = findPackageJsonFiles(CONFIG.rootDir, CONFIG.ignoredPaths);
    logger.verbose(`Found ${packageJsonFiles.length} package.json files`);
    
    // Load all package.json files
    logger.info('Loading package.json files...');
    const packages = packageJsonFiles.map(loadPackageJson).filter(pkg => pkg.content);
    
    // Filter packages by scope if specified
    let filteredPackages = packages;
    if (options.scope) {
      filteredPackages = packages.filter(pkg => {
        return pkg.content && pkg.content.name && pkg.content.name.includes(options.scope);
      });
      logger.info(`Filtered to ${filteredPackages.length} packages matching scope: ${options.scope}`);
    }
    
    // Identify workspace packages
    const workspacePackages = packages
      .filter(pkg => pkg.content && isWorkspacePackage(pkg.content))
      .map(pkg => pkg.content.name);
    
    CONFIG.workspacePackages = workspacePackages;
    logger.verbose(`Found ${workspacePackages.length} workspace packages`);
    
    // Build dependency map
    const dependencyMap = buildDependencyMap(filteredPackages);
    
    // Check for version conflicts
    logger.info('Checking for version conflicts...');
    results.conflicts = checkVersionConflicts(filteredPackages);
    logger.verbose(`Found ${results.conflicts.length} version conflicts`);
    
    // Check for missing dependencies
    logger.info('Checking for missing dependencies...');
    results.missingDependencies = checkMissingDependencies(dependencyMap);
    logger.verbose(`Found ${results.missingDependencies.length} missing dependencies`);
    
    // Check for workspace reference issues
    logger.info('Checking for workspace reference issues...');
    results.workspaceIssues = checkWorkspaceReferences(filteredPackages, workspacePackages);
    logger.verbose(`Found ${results.workspaceIssues.length} workspace reference issues`);
    
    // Check for circular dependencies
    logger.info('Checking for circular dependencies...');
    results.circularDependencies = checkCircularDependencies(dependencyMap);
    logger.verbose(`Found ${results.circularDependencies.length} circular dependencies`);
    
    // Check for TypeScript project reference issues
    logger.info('Checking for TypeScript project reference issues...');
    results.tsConfigIssues = checkTsConfigReferences(filteredPackages);
    logger.verbose(`Found ${results.tsConfigIssues.length} TypeScript project reference issues`);
    
    // Generate suggestions
    logger.info('Generating suggestions...');
    results.suggestions = generateSuggestions(results);
    
    // Update summary
    results.summary.totalPackages = filteredPackages.length;
    results.summary.packagesWithIssues = new Set([
      ...results.conflicts.flatMap(c => c.packages.map(p => p.packageName)),
      ...results.missingDependencies.map(m => m.packageName),
      ...results.workspaceIssues.map(w => w.packageName),
      ...results.circularDependencies.map(c => c.packageName),
      ...results.tsConfigIssues.map(t => t.packageName),
    ]).size;
    
    results.summary.totalIssues = 
      results.conflicts.length +
      results.missingDependencies.length +
      results.workspaceIssues.length +
      results.circularDependencies.length +
      results.tsConfigIssues.length;
    
    // Apply fixes if requested
    if (options.fix) {
      applyFixes(results);
    }
    
    // Print results
    printResults(results);
    
    // Exit with appropriate code
    if (results.summary.criticalIssues > 0) {
      process.exit(1);
    } else if (results.summary.totalIssues > 0) {
      process.exit(options.fix ? 0 : 1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    logger.error(`Validation failed: ${error.message}`);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the main function
main();