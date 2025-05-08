#!/usr/bin/env node

/**
 * Dependency Validation Script for AUSTA SuperApp
 * 
 * This script performs comprehensive dependency validation across the monorepo to identify
 * and resolve version conflicts, missing dependencies, and improper workspace references.
 * 
 * Features:
 * - Detects version conflicts across packages
 * - Identifies missing dependencies
 * - Validates workspace references
 * - Verifies TypeScript project references
 * - Detects circular dependencies
 * - Validates package resolution
 * 
 * Usage:
 *   node tools/scripts/validate-dependencies.js [options]
 * 
 * Options:
 *   --fix       Attempt to fix common issues automatically
 *   --verbose   Show detailed validation output
 *   --help      Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if chalk is available, otherwise use a simple color implementation
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  chalk = {
    green: (text) => `\x1b[32m${text}\x1b[0m`,
    red: (text) => `\x1b[31m${text}\x1b[0m`,
    yellow: (text) => `\x1b[33m${text}\x1b[0m`,
    blue: (text) => `\x1b[34m${text}\x1b[0m`,
    cyan: (text) => `\x1b[36m${text}\x1b[0m`,
    bold: (text) => `\x1b[1m${text}\x1b[0m`,
  };
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help'),
};

// Show help message if requested
if (options.help) {
  console.log(`
${chalk.bold('Dependency Validation Script for AUSTA SuperApp')}

This script performs comprehensive dependency validation across the monorepo to identify
and resolve version conflicts, missing dependencies, and improper workspace references.

${chalk.bold('Usage:')}
  node tools/scripts/validate-dependencies.js [options]

${chalk.bold('Options:')}
  --fix       Attempt to fix common issues automatically
  --verbose   Show detailed validation output
  --help      Show this help message
  `);
  process.exit(0);
}

// Configuration
const ROOT_DIR = path.resolve(process.cwd());
const BACKEND_DIR = path.join(ROOT_DIR, 'src', 'backend');
const WEB_DIR = path.join(ROOT_DIR, 'src', 'web');

// Critical packages that should have consistent versions
const CRITICAL_PACKAGES = [
  'axios',
  'react',
  'react-dom',
  'react-native',
  '@nestjs/core',
  '@nestjs/common',
  '@nestjs/graphql',
  'typescript',
  'graphql',
  'minimatch',
  'semver',
  'ws',
  'follow-redirects',
];

// Packages that should be hoisted to the root
const HOISTED_PACKAGES = [
  'typescript',
  'eslint',
  'prettier',
  'jest',
  '@types/react',
  '@types/react-dom',
  '@types/node',
];

// Validation results
const validationResults = {
  errors: [],
  warnings: [],
  fixes: [],
};

/**
 * Logs a message with the appropriate color based on the message type
 */
function log(message, type = 'info', verbose = false) {
  if (verbose && !options.verbose) {
    return;
  }

  switch (type) {
    case 'error':
      console.error(chalk.red(`❌ ${message}`));
      break;
    case 'warning':
      console.warn(chalk.yellow(`⚠️ ${message}`));
      break;
    case 'success':
      console.log(chalk.green(`✅ ${message}`));
      break;
    case 'fix':
      console.log(chalk.cyan(`🔧 ${message}`));
      break;
    case 'info':
    default:
      console.log(`ℹ️ ${message}`);
      break;
  }
}

/**
 * Adds a validation result
 */
function addResult(message, type = 'error', packagePath = null) {
  const result = { message, packagePath };
  
  switch (type) {
    case 'error':
      validationResults.errors.push(result);
      log(message, 'error');
      break;
    case 'warning':
      validationResults.warnings.push(result);
      log(message, 'warning');
      break;
    case 'fix':
      validationResults.fixes.push(result);
      log(message, 'fix');
      break;
  }
}

/**
 * Gets all package.json files in the monorepo
 */
function getAllPackageJsonFiles() {
  const packageJsonFiles = [];

  // Helper function to recursively find package.json files
  function findPackageJsonFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    // Check if this directory has a package.json
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      packageJsonFiles.push(packageJsonPath);
    }

    // Recursively check subdirectories
    for (const file of files) {
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        findPackageJsonFiles(path.join(dir, file.name));
      }
    }
  }

  // Start with the root directory
  findPackageJsonFiles(ROOT_DIR);
  return packageJsonFiles;
}

/**
 * Gets all tsconfig.json files in the monorepo
 */
function getAllTsConfigFiles() {
  const tsConfigFiles = [];

  // Helper function to recursively find tsconfig.json files
  function findTsConfigFiles(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    // Check if this directory has a tsconfig.json
    const tsConfigPath = path.join(dir, 'tsconfig.json');
    if (fs.existsSync(tsConfigPath)) {
      tsConfigFiles.push(tsConfigPath);
    }

    // Recursively check subdirectories
    for (const file of files) {
      if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
        findTsConfigFiles(path.join(dir, file.name));
      }
    }
  }

  // Start with the backend and web directories
  findTsConfigFiles(BACKEND_DIR);
  findTsConfigFiles(WEB_DIR);
  return tsConfigFiles;
}

/**
 * Loads a package.json file
 */
function loadPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    addResult(`Failed to parse ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Loads a tsconfig.json file
 */
function loadTsConfig(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    addResult(`Failed to parse ${filePath}: ${error.message}`, 'error');
    return null;
  }
}

/**
 * Validates version conflicts across packages
 */
function validateVersionConflicts(packageJsonFiles) {
  log('Validating version conflicts...', 'info');
  
  const packageVersions = {};
  
  // Collect all package versions
  for (const filePath of packageJsonFiles) {
    const packageJson = loadPackageJson(filePath);
    if (!packageJson) continue;
    
    const packagePath = path.dirname(filePath);
    const packageName = packageJson.name || path.basename(packagePath);
    
    // Check dependencies
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const deps = packageJson[depType] || {};
      
      for (const [dep, version] of Object.entries(deps)) {
        // Only check critical packages
        if (!CRITICAL_PACKAGES.includes(dep)) continue;
        
        // Clean version string (remove ^, ~, etc.)
        const cleanVersion = version.replace(/^[\^~]/, '');
        
        if (!packageVersions[dep]) {
          packageVersions[dep] = [];
        }
        
        packageVersions[dep].push({
          packageName,
          packagePath,
          version: cleanVersion,
          rawVersion: version,
          depType,
        });
      }
    }
  }
  
  // Check for version conflicts
  for (const [dep, versions] of Object.entries(packageVersions)) {
    if (versions.length <= 1) continue;
    
    // Get unique versions
    const uniqueVersions = [...new Set(versions.map(v => v.version))];
    
    if (uniqueVersions.length > 1) {
      const versionInfo = uniqueVersions.map(version => {
        const packages = versions.filter(v => v.version === version);
        return `${version} (used by ${packages.length} packages)`;
      }).join(', ');
      
      addResult(`Version conflict for ${dep}: ${versionInfo}`, 'error');
      
      // Log detailed information in verbose mode
      if (options.verbose) {
        versions.forEach(v => {
          log(`  - ${v.packageName} (${v.depType}): ${v.rawVersion}`, 'info', true);
        });
      }
      
      // Try to fix if requested
      if (options.fix) {
        fixVersionConflict(dep, versions);
      }
    } else {
      log(`Package ${dep} has consistent version ${uniqueVersions[0]} across ${versions.length} packages`, 'success', true);
    }
  }
}

/**
 * Attempts to fix version conflicts
 */
function fixVersionConflict(packageName, versions) {
  // Get the root package.json
  const rootPackageJsonPath = path.join(ROOT_DIR, 'package.json');
  const rootPackageJson = loadPackageJson(rootPackageJsonPath);
  
  if (!rootPackageJson) return;
  
  // Check if there's a resolution or override for this package
  const resolutionVersion = rootPackageJson.resolutions?.[packageName];
  const overrideVersion = rootPackageJson.overrides?.[packageName];
  
  if (resolutionVersion || overrideVersion) {
    const targetVersion = resolutionVersion || overrideVersion;
    addResult(`Using root resolution/override for ${packageName}: ${targetVersion}`, 'fix');
    return;
  }
  
  // Find the most common version
  const versionCounts = {};
  versions.forEach(v => {
    versionCounts[v.version] = (versionCounts[v.version] || 0) + 1;
  });
  
  const mostCommonVersion = Object.entries(versionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])[0];
  
  // Add to resolutions and overrides in root package.json
  if (!rootPackageJson.resolutions) {
    rootPackageJson.resolutions = {};
  }
  if (!rootPackageJson.overrides) {
    rootPackageJson.overrides = {};
  }
  
  rootPackageJson.resolutions[packageName] = mostCommonVersion;
  rootPackageJson.overrides[packageName] = mostCommonVersion;
  
  // Write back to file
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
  
  addResult(`Added resolution and override for ${packageName}: ${mostCommonVersion}`, 'fix');
}

/**
 * Validates workspace references
 */
function validateWorkspaceReferences(packageJsonFiles) {
  log('Validating workspace references...', 'info');
  
  // Get the root package.json to check workspace definitions
  const rootPackageJsonPath = path.join(ROOT_DIR, 'package.json');
  const rootPackageJson = loadPackageJson(rootPackageJsonPath);
  
  if (!rootPackageJson || !rootPackageJson.workspaces) {
    addResult('Root package.json is missing or does not define workspaces', 'error');
    return;
  }
  
  // Get all workspace patterns
  const workspacePatterns = Array.isArray(rootPackageJson.workspaces) 
    ? rootPackageJson.workspaces 
    : rootPackageJson.workspaces.packages || [];
  
  // Get all workspace package names
  const workspacePackages = new Map();
  
  for (const filePath of packageJsonFiles) {
    const packageJson = loadPackageJson(filePath);
    if (!packageJson || !packageJson.name) continue;
    
    const packagePath = path.dirname(filePath);
    const relativePath = path.relative(ROOT_DIR, packagePath);
    
    // Check if this package is in a workspace
    const isInWorkspace = workspacePatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      return new RegExp(`^${regexPattern}$`).test(relativePath);
    });
    
    if (isInWorkspace) {
      workspacePackages.set(packageJson.name, {
        path: packagePath,
        relativePath,
        packageJson,
      });
    }
  }
  
  // Validate workspace references in each package
  for (const filePath of packageJsonFiles) {
    const packageJson = loadPackageJson(filePath);
    if (!packageJson) continue;
    
    const packagePath = path.dirname(filePath);
    const packageName = packageJson.name || path.basename(packagePath);
    
    // Check dependencies for workspace references
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const deps = packageJson[depType] || {};
      
      for (const [dep, version] of Object.entries(deps)) {
        // Check if this is a workspace package
        if (workspacePackages.has(dep)) {
          // Workspace references should use workspace: protocol
          if (!version.startsWith('workspace:')) {
            addResult(`${packageName} references workspace package ${dep} without workspace: protocol`, 'warning', packagePath);
            
            // Try to fix if requested
            if (options.fix) {
              fixWorkspaceReference(filePath, packageJson, depType, dep);
            }
          } else {
            log(`${packageName} correctly references workspace package ${dep}`, 'success', true);
          }
        }
      }
    }
  }
}

/**
 * Attempts to fix workspace references
 */
function fixWorkspaceReference(filePath, packageJson, depType, depName) {
  // Update the dependency to use workspace: protocol
  packageJson[depType][depName] = 'workspace:*';
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
  
  addResult(`Updated ${depName} to use workspace:* in ${path.basename(path.dirname(filePath))}`, 'fix');
}

/**
 * Validates TypeScript project references
 */
function validateTsReferences(tsConfigFiles) {
  log('Validating TypeScript project references...', 'info');
  
  const tsConfigs = new Map();
  
  // Load all tsconfig.json files
  for (const filePath of tsConfigFiles) {
    const tsConfig = loadTsConfig(filePath);
    if (!tsConfig) continue;
    
    const configPath = path.dirname(filePath);
    tsConfigs.set(configPath, {
      path: configPath,
      config: tsConfig,
      filePath,
    });
  }
  
  // Check for missing references
  for (const [configPath, { config, filePath }] of tsConfigs.entries()) {
    // Skip if no references defined
    if (!config.references) continue;
    
    for (const reference of config.references) {
      const referencePath = reference.path;
      
      // Skip if path is not relative
      if (referencePath.startsWith('.')) {
        const absoluteRefPath = path.resolve(configPath, referencePath);
        
        // Check if the referenced project exists
        if (!tsConfigs.has(absoluteRefPath) && !fs.existsSync(path.join(absoluteRefPath, 'tsconfig.json'))) {
          addResult(`Missing TypeScript project reference: ${referencePath} from ${path.relative(ROOT_DIR, filePath)}`, 'error', configPath);
        } else {
          log(`Valid TypeScript project reference: ${referencePath} from ${path.relative(ROOT_DIR, filePath)}`, 'success', true);
        }
      }
    }
  }
  
  // Check for composite setting in referenced projects
  for (const [configPath, { config, filePath }] of tsConfigs.entries()) {
    if (config.references && config.references.length > 0) {
      // Projects with references should have composite enabled
      if (!config.compilerOptions?.composite) {
        addResult(`Project with references should have composite enabled: ${path.relative(ROOT_DIR, filePath)}`, 'warning', configPath);
        
        // Try to fix if requested
        if (options.fix) {
          fixTsConfigComposite(filePath, config);
        }
      }
    }
  }
}

/**
 * Attempts to fix TypeScript config composite setting
 */
function fixTsConfigComposite(filePath, tsConfig) {
  // Ensure compilerOptions exists
  if (!tsConfig.compilerOptions) {
    tsConfig.compilerOptions = {};
  }
  
  // Enable composite
  tsConfig.compilerOptions.composite = true;
  
  // Write back to file
  fs.writeFileSync(filePath, JSON.stringify(tsConfig, null, 2));
  
  addResult(`Enabled composite in ${path.relative(ROOT_DIR, filePath)}`, 'fix');
}

/**
 * Validates circular dependencies
 */
function validateCircularDependencies() {
  log('Validating circular dependencies...', 'info');
  
  try {
    // Use madge to detect circular dependencies
    const result = execSync('npx madge --circular --extensions ts,tsx src', { encoding: 'utf8' });
    
    if (result.trim()) {
      addResult('Circular dependencies detected:\n' + result, 'warning');
    } else {
      log('No circular dependencies detected', 'success');
    }
  } catch (error) {
    // If madge is not installed, suggest installing it
    if (error.message.includes('not found')) {
      addResult('madge is not installed. Install it with: npm install -g madge', 'warning');
    } else if (error.stdout) {
      // madge found circular dependencies
      addResult('Circular dependencies detected:\n' + error.stdout, 'warning');
    } else {
      addResult(`Failed to check circular dependencies: ${error.message}`, 'error');
    }
  }
}

/**
 * Validates package hoisting
 */
function validatePackageHoisting(packageJsonFiles) {
  log('Validating package hoisting...', 'info');
  
  // Get the root package.json
  const rootPackageJsonPath = path.join(ROOT_DIR, 'package.json');
  const rootPackageJson = loadPackageJson(rootPackageJsonPath);
  
  if (!rootPackageJson) return;
  
  // Check if hoisted packages are in the root
  const rootDeps = {
    ...rootPackageJson.dependencies,
    ...rootPackageJson.devDependencies,
  };
  
  const missingHoistedPackages = HOISTED_PACKAGES.filter(pkg => !rootDeps[pkg]);
  
  if (missingHoistedPackages.length > 0) {
    addResult(`Missing hoisted packages in root: ${missingHoistedPackages.join(', ')}`, 'warning');
    
    // Try to fix if requested
    if (options.fix) {
      fixMissingHoistedPackages(rootPackageJsonPath, rootPackageJson, missingHoistedPackages, packageJsonFiles);
    }
  } else {
    log('All required packages are properly hoisted to the root', 'success');
  }
}

/**
 * Attempts to fix missing hoisted packages
 */
function fixMissingHoistedPackages(rootPackageJsonPath, rootPackageJson, missingPackages, packageJsonFiles) {
  // Find versions of missing packages in other package.json files
  const packageVersions = {};
  
  for (const pkg of missingPackages) {
    packageVersions[pkg] = new Map();
  }
  
  for (const filePath of packageJsonFiles) {
    const packageJson = loadPackageJson(filePath);
    if (!packageJson) continue;
    
    for (const depType of ['dependencies', 'devDependencies', 'peerDependencies']) {
      const deps = packageJson[depType] || {};
      
      for (const pkg of missingPackages) {
        if (deps[pkg]) {
          const cleanVersion = deps[pkg].replace(/^[\^~]/, '');
          const count = packageVersions[pkg].get(cleanVersion) || 0;
          packageVersions[pkg].set(cleanVersion, count + 1);
        }
      }
    }
  }
  
  // Add missing packages to root devDependencies with the most common version
  if (!rootPackageJson.devDependencies) {
    rootPackageJson.devDependencies = {};
  }
  
  for (const pkg of missingPackages) {
    if (packageVersions[pkg].size > 0) {
      // Find the most common version
      const mostCommonVersion = [...packageVersions[pkg].entries()]
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])[0];
      
      rootPackageJson.devDependencies[pkg] = mostCommonVersion;
      addResult(`Added ${pkg}@${mostCommonVersion} to root devDependencies`, 'fix');
    }
  }
  
  // Write back to file
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2));
}

/**
 * Validates missing dependencies
 */
function validateMissingDependencies() {
  log('Validating missing dependencies...', 'info');
  
  try {
    // Use npm ls to check for missing dependencies
    execSync('npm ls', { stdio: 'ignore' });
    log('No missing dependencies detected', 'success');
  } catch (error) {
    // npm ls exits with non-zero code if there are missing dependencies
    if (options.verbose) {
      try {
        const result = execSync('npm ls', { encoding: 'utf8' });
        log('Dependency tree:\n' + result, 'info', true);
      } catch (e) {
        log('Dependency tree with issues:\n' + e.stdout, 'info', true);
      }
    }
    
    addResult('Missing dependencies detected. Run npm ls for details.', 'warning');
  }
}

/**
 * Validates TypeScript build
 */
function validateTypescriptBuild() {
  log('Validating TypeScript build...', 'info');
  
  try {
    // Use tsc --noEmit to check for TypeScript errors
    execSync('npx tsc --noEmit', { stdio: 'ignore' });
    log('TypeScript build validation successful', 'success');
  } catch (error) {
    // tsc exits with non-zero code if there are errors
    if (options.verbose && error.stdout) {
      log('TypeScript errors:\n' + error.stdout, 'info', true);
    }
    
    addResult('TypeScript build validation failed. Run npx tsc --noEmit for details.', 'error');
  }
}

/**
 * Main function to run all validations
 */
function runValidations() {
  console.log(chalk.bold('🔍 Starting dependency validation...'));
  
  // Get all package.json and tsconfig.json files
  const packageJsonFiles = getAllPackageJsonFiles();
  const tsConfigFiles = getAllTsConfigFiles();
  
  log(`Found ${packageJsonFiles.length} package.json files and ${tsConfigFiles.length} tsconfig.json files`, 'info');
  
  // Run validations
  validateVersionConflicts(packageJsonFiles);
  validateWorkspaceReferences(packageJsonFiles);
  validateTsReferences(tsConfigFiles);
  validatePackageHoisting(packageJsonFiles);
  validateMissingDependencies();
  validateCircularDependencies();
  
  // Only run TypeScript build validation if no errors so far
  if (validationResults.errors.length === 0) {
    validateTypescriptBuild();
  }
  
  // Print summary
  console.log('\n' + chalk.bold('📊 Validation Summary:'));
  console.log(chalk.bold(`Errors: ${validationResults.errors.length}`));
  console.log(chalk.bold(`Warnings: ${validationResults.warnings.length}`));
  
  if (options.fix) {
    console.log(chalk.bold(`Fixes applied: ${validationResults.fixes.length}`));
  }
  
  // Exit with appropriate code
  if (validationResults.errors.length > 0) {
    console.log(chalk.red('\n❌ Validation failed with errors. Please fix the issues above.'));
    process.exit(1);
  } else if (validationResults.warnings.length > 0) {
    console.log(chalk.yellow('\n⚠️ Validation completed with warnings. Consider addressing the issues above.'));
    process.exit(0);
  } else {
    console.log(chalk.green('\n✅ Validation completed successfully!'));
    process.exit(0);
  }
}

// Run the validations
runValidations();