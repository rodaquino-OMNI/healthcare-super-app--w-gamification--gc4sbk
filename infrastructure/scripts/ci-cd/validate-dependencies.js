#!/usr/bin/env node

/**
 * AUSTA SuperApp Dependency Validation Script
 * 
 * This script performs comprehensive dependency validation across all workspaces in the monorepo:
 * 1. Checks for missing packages and version conflicts
 * 2. Detects circular dependencies in the dependency graph
 * 3. Validates TypeScript project references for integrity
 * 4. Ensures consistent versioning across the monorepo
 * 
 * The script is designed to run as part of the CI/CD pipeline and will exit with a non-zero
 * status code if any validation issues are found.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

// Constants
const ROOT_DIR = path.resolve(__dirname, '../../../');
const BACKEND_DIR = path.join(ROOT_DIR, 'src/backend');
const WEB_DIR = path.join(ROOT_DIR, 'src/web');
const WORKSPACE_DIRS = [BACKEND_DIR, WEB_DIR];

// Color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Validation result tracking
let validationErrors = [];
let validationWarnings = [];

/**
 * Main function to run all dependency validations
 */
async function main() {
  console.log(`${COLORS.cyan}=== AUSTA SuperApp Dependency Validation ===${COLORS.reset}\n`);
  
  try {
    // Step 1: Find all package.json files in the monorepo
    const packageJsonFiles = findAllPackageJsonFiles();
    console.log(`${COLORS.blue}Found ${packageJsonFiles.length} package.json files${COLORS.reset}\n`);
    
    // Step 2: Parse all package.json files
    const packages = parsePackageJsonFiles(packageJsonFiles);
    
    // Step 3: Validate dependencies
    console.log(`${COLORS.cyan}Validating dependencies...${COLORS.reset}`);
    validateMissingDependencies(packages);
    validateVersionConflicts(packages);
    validateCircularDependencies(packages);
    
    // Step 4: Validate TypeScript project references
    console.log(`\n${COLORS.cyan}Validating TypeScript project references...${COLORS.reset}`);
    validateTypeScriptReferences();
    
    // Step 5: Run npm ls to check for missing or conflicting packages
    console.log(`\n${COLORS.cyan}Running dependency tree validation...${COLORS.reset}`);
    validateDependencyTree();
    
    // Step 6: Report results
    reportResults();
    
    // Exit with appropriate code
    if (validationErrors.length > 0) {
      process.exit(1);
    } else {
      console.log(`\n${COLORS.green}All dependency validations passed successfully!${COLORS.reset}`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${COLORS.red}Error during validation: ${error.message}${COLORS.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Find all package.json files in the monorepo
 */
function findAllPackageJsonFiles() {
  const packageJsonFiles = [];
  
  function findPackageJsonInDir(dir) {
    const packageJsonPath = path.join(dir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      packageJsonFiles.push(packageJsonPath);
    }
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
          findPackageJsonInDir(path.join(dir, entry.name));
        }
      }
    } catch (error) {
      console.warn(`${COLORS.yellow}Warning: Could not read directory ${dir}: ${error.message}${COLORS.reset}`);
    }
  }
  
  for (const workspaceDir of WORKSPACE_DIRS) {
    findPackageJsonInDir(workspaceDir);
  }
  
  return packageJsonFiles;
}

/**
 * Parse all package.json files into a structured format
 */
function parsePackageJsonFiles(packageJsonFiles) {
  const packages = {};
  
  for (const filePath of packageJsonFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const packageJson = JSON.parse(content);
      const packageDir = path.dirname(filePath);
      const relativeDir = path.relative(ROOT_DIR, packageDir);
      
      packages[packageJson.name] = {
        name: packageJson.name,
        version: packageJson.version,
        path: packageDir,
        relativePath: relativeDir,
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        peerDependencies: packageJson.peerDependencies || {},
        packageJson
      };
    } catch (error) {
      validationErrors.push(`Failed to parse ${filePath}: ${error.message}`);
    }
  }
  
  return packages;
}

/**
 * Validate that all dependencies exist within the monorepo or are external
 */
function validateMissingDependencies(packages) {
  console.log(`${COLORS.blue}Checking for missing dependencies...${COLORS.reset}`);
  
  for (const [packageName, packageInfo] of Object.entries(packages)) {
    // Check all dependency types
    const allDependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
      ...packageInfo.peerDependencies
    };
    
    for (const [depName, depVersion] of Object.entries(allDependencies)) {
      // Only check internal dependencies (starting with @austa/ or @design-system/)
      if ((depName.startsWith('@austa/') || depName.startsWith('@design-system/')) && !packages[depName]) {
        validationErrors.push(`Package ${packageName} depends on ${depName}@${depVersion} which is not found in the monorepo`);
      }
    }
  }
  
  if (validationErrors.length === 0) {
    console.log(`${COLORS.green}✓ No missing dependencies found${COLORS.reset}`);
  } else {
    console.log(`${COLORS.red}✗ Found ${validationErrors.length} missing dependencies${COLORS.reset}`);
  }
}

/**
 * Validate that there are no version conflicts for the same dependency
 */
function validateVersionConflicts(packages) {
  console.log(`${COLORS.blue}Checking for version conflicts...${COLORS.reset}`);
  
  const dependencyVersions = {};
  
  // Collect all versions of each dependency
  for (const [packageName, packageInfo] of Object.entries(packages)) {
    // Check all dependency types
    const allDependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies,
      ...packageInfo.peerDependencies
    };
    
    for (const [depName, depVersion] of Object.entries(allDependencies)) {
      if (!dependencyVersions[depName]) {
        dependencyVersions[depName] = {};
      }
      
      if (!dependencyVersions[depName][depVersion]) {
        dependencyVersions[depName][depVersion] = [];
      }
      
      dependencyVersions[depName][depVersion].push(packageName);
    }
  }
  
  // Check for conflicts
  for (const [depName, versions] of Object.entries(dependencyVersions)) {
    const versionCount = Object.keys(versions).length;
    
    // Skip external dependencies with multiple versions unless they're critical
    const isCriticalDependency = [
      'react', 'react-dom', 'react-native', '@babel/core', 'typescript',
      'minimatch', 'semver', 'ws', '@nestjs/core', '@nestjs/common'
    ].includes(depName);
    
    if (versionCount > 1 && (depName.startsWith('@austa/') || depName.startsWith('@design-system/') || isCriticalDependency)) {
      const versionsInfo = Object.entries(versions)
        .map(([version, pkgs]) => `${version} (used by ${pkgs.join(', ')})`)
        .join(', ');
      
      validationErrors.push(`Dependency ${depName} has ${versionCount} different versions: ${versionsInfo}`);
    }
  }
  
  if (validationErrors.length === 0) {
    console.log(`${COLORS.green}✓ No version conflicts found${COLORS.reset}`);
  } else {
    console.log(`${COLORS.red}✗ Found version conflicts${COLORS.reset}`);
  }
}

/**
 * Detect circular dependencies in the package graph
 */
function validateCircularDependencies(packages) {
  console.log(`${COLORS.blue}Checking for circular dependencies...${COLORS.reset}`);
  
  const dependencyGraph = {};
  
  // Build dependency graph
  for (const [packageName, packageInfo] of Object.entries(packages)) {
    dependencyGraph[packageName] = [];
    
    // Add all internal dependencies to the graph
    const allDependencies = {
      ...packageInfo.dependencies,
      ...packageInfo.devDependencies
    };
    
    for (const depName of Object.keys(allDependencies)) {
      if (packages[depName]) {
        dependencyGraph[packageName].push(depName);
      }
    }
  }
  
  // Detect cycles using DFS
  const circularDependencies = [];
  
  for (const packageName of Object.keys(dependencyGraph)) {
    const visited = new Set();
    const path = [];
    
    function dfs(node) {
      if (path.includes(node)) {
        // Found a cycle
        const cycle = [...path.slice(path.indexOf(node)), node];
        circularDependencies.push(cycle.join(' -> '));
        return;
      }
      
      if (visited.has(node)) {
        return;
      }
      
      visited.add(node);
      path.push(node);
      
      for (const dependency of dependencyGraph[node] || []) {
        dfs(dependency);
      }
      
      path.pop();
    }
    
    dfs(packageName);
  }
  
  // Remove duplicates
  const uniqueCircularDependencies = [...new Set(circularDependencies)];
  
  if (uniqueCircularDependencies.length > 0) {
    for (const cycle of uniqueCircularDependencies) {
      validationErrors.push(`Circular dependency detected: ${cycle}`);
    }
    console.log(`${COLORS.red}✗ Found ${uniqueCircularDependencies.length} circular dependencies${COLORS.reset}`);
  } else {
    console.log(`${COLORS.green}✓ No circular dependencies found${COLORS.reset}`);
  }
}

/**
 * Validate TypeScript project references
 */
function validateTypeScriptReferences() {
  console.log(`${COLORS.blue}Running TypeScript project reference validation...${COLORS.reset}`);
  
  try {
    // Find all tsconfig.json files
    const tsconfigFiles = [];
    
    function findTsConfigInDir(dir) {
      const tsconfigPath = path.join(dir, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        tsconfigFiles.push(tsconfigPath);
      }
      
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
            findTsConfigInDir(path.join(dir, entry.name));
          }
        }
      } catch (error) {
        console.warn(`${COLORS.yellow}Warning: Could not read directory ${dir}: ${error.message}${COLORS.reset}`);
      }
    }
    
    for (const workspaceDir of WORKSPACE_DIRS) {
      findTsConfigInDir(workspaceDir);
    }
    
    console.log(`${COLORS.blue}Found ${tsconfigFiles.length} tsconfig.json files${COLORS.reset}`);
    
    // Validate each tsconfig.json file
    for (const tsconfigPath of tsconfigFiles) {
      try {
        const content = fs.readFileSync(tsconfigPath, 'utf8');
        const tsconfig = JSON.parse(content);
        const dir = path.dirname(tsconfigPath);
        
        // Check references
        if (tsconfig.references && Array.isArray(tsconfig.references)) {
          for (const reference of tsconfig.references) {
            if (reference.path) {
              const referencePath = path.resolve(dir, reference.path);
              const referenceConfigPath = fs.existsSync(referencePath) && fs.statSync(referencePath).isDirectory() 
                ? path.join(referencePath, 'tsconfig.json')
                : `${referencePath}.json`;
              
              if (!fs.existsSync(referenceConfigPath)) {
                validationErrors.push(`Invalid TypeScript project reference in ${tsconfigPath}: ${reference.path} (resolved to ${referenceConfigPath})`);
              }
            } else {
              validationWarnings.push(`TypeScript project reference without path in ${tsconfigPath}`);
            }
          }
        }
        
        // Check paths
        if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
          for (const [alias, aliasPaths] of Object.entries(tsconfig.compilerOptions.paths)) {
            for (const aliasPath of aliasPaths) {
              // Skip wildcard paths like "*" or "@app/*"
              if (aliasPath.includes('*')) continue;
              
              const resolvedPath = path.resolve(dir, tsconfig.compilerOptions.baseUrl || '.', aliasPath);
              if (!fs.existsSync(resolvedPath)) {
                validationWarnings.push(`Path alias ${alias} in ${tsconfigPath} points to non-existent path: ${aliasPath} (resolved to ${resolvedPath})`);
              }
            }
          }
        }
      } catch (error) {
        validationErrors.push(`Failed to parse ${tsconfigPath}: ${error.message}`);
      }
    }
    
    // Run tsc --build --verbose to validate project references
    try {
      console.log(`${COLORS.blue}Running tsc --build --verbose to validate project references...${COLORS.reset}`);
      
      // We'll run this for both backend and web directories separately
      for (const workspaceDir of WORKSPACE_DIRS) {
        const relativeDir = path.relative(ROOT_DIR, workspaceDir);
        console.log(`${COLORS.blue}Validating TypeScript project references in ${relativeDir}...${COLORS.reset}`);
        
        try {
          // Use --dry to avoid actual compilation, we just want to validate references
          const result = execSync('npx tsc --build --verbose --dry', {
            cwd: workspaceDir,
            stdio: 'pipe',
            encoding: 'utf8'
          });
          
          console.log(`${COLORS.green}✓ TypeScript project references in ${relativeDir} are valid${COLORS.reset}`);
        } catch (error) {
          // Extract the relevant error message from the output
          const errorOutput = error.stdout || error.stderr || error.message;
          const errorLines = errorOutput.split('\n')
            .filter(line => line.includes('error TS'))
            .slice(0, 10); // Limit to first 10 errors
          
          if (errorLines.length > 0) {
            validationErrors.push(`TypeScript project reference validation failed in ${relativeDir}:\n${errorLines.join('\n')}${errorLines.length > 10 ? '\n...and more' : ''}`);
          } else {
            validationErrors.push(`TypeScript project reference validation failed in ${relativeDir}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      validationErrors.push(`Failed to run TypeScript validation: ${error.message}`);
    }
    
  } catch (error) {
    validationErrors.push(`Failed to validate TypeScript project references: ${error.message}`);
  }
}

/**
 * Run npm ls to check for missing or conflicting packages
 */
function validateDependencyTree() {
  console.log(`${COLORS.blue}Running npm ls to check for dependency issues...${COLORS.reset}`);
  
  for (const workspaceDir of WORKSPACE_DIRS) {
    const relativeDir = path.relative(ROOT_DIR, workspaceDir);
    console.log(`${COLORS.blue}Checking dependencies in ${relativeDir}...${COLORS.reset}`);
    
    try {
      // Use --all to include dev dependencies
      const result = execSync('pnpm ls --json --depth=1', {
        cwd: workspaceDir,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Parse the JSON output
      try {
        const dependencyData = JSON.parse(result);
        
        // Check for problems in the dependency data
        if (dependencyData.problems && dependencyData.problems.length > 0) {
          for (const problem of dependencyData.problems) {
            validationErrors.push(`Dependency problem in ${relativeDir}: ${problem}`);
          }
        } else {
          console.log(`${COLORS.green}✓ No dependency issues found in ${relativeDir}${COLORS.reset}`);
        }
      } catch (parseError) {
        validationWarnings.push(`Failed to parse pnpm ls output in ${relativeDir}: ${parseError.message}`);
      }
    } catch (error) {
      // Extract the relevant error message from the output
      const errorOutput = error.stdout || error.stderr || error.message;
      
      // Check if the error output contains missing dependencies
      if (errorOutput.includes('missing:') || errorOutput.includes('UNMET DEPENDENCY')) {
        const missingLines = errorOutput.split('\n')
          .filter(line => line.includes('missing:') || line.includes('UNMET DEPENDENCY'))
          .slice(0, 10); // Limit to first 10 errors
        
        validationErrors.push(`Missing dependencies in ${relativeDir}:\n${missingLines.join('\n')}${missingLines.length > 10 ? '\n...and more' : ''}`);
      } else {
        validationErrors.push(`Failed to check dependencies in ${relativeDir}: ${error.message}`);
      }
    }
  }
}

/**
 * Report validation results
 */
function reportResults() {
  console.log('\n' + '-'.repeat(80));
  console.log(`${COLORS.cyan}DEPENDENCY VALIDATION RESULTS${COLORS.reset}`);
  console.log('-'.repeat(80));
  
  if (validationWarnings.length > 0) {
    console.log(`\n${COLORS.yellow}WARNINGS (${validationWarnings.length}):${COLORS.reset}`);
    for (const warning of validationWarnings) {
      console.log(`${COLORS.yellow}⚠ ${warning}${COLORS.reset}`);
    }
  }
  
  if (validationErrors.length > 0) {
    console.log(`\n${COLORS.red}ERRORS (${validationErrors.length}):${COLORS.reset}`);
    for (const error of validationErrors) {
      console.log(`${COLORS.red}✗ ${error}${COLORS.reset}`);
    }
    console.log(`\n${COLORS.red}Dependency validation failed with ${validationErrors.length} errors${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.green}All dependency validations passed successfully!${COLORS.reset}`);
  }
  
  console.log('-'.repeat(80));
}

// Run the main function
main().catch(error => {
  console.error(`${COLORS.red}Unhandled error: ${error.message}${COLORS.reset}`);
  console.error(error.stack);
  process.exit(1);
});