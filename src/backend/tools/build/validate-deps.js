#!/usr/bin/env node

/**
 * Dependency Validation Tool for AUSTA SuperApp
 * 
 * This script analyzes dependency issues across the monorepo by scanning
 * all package.json files to identify version conflicts, missing dependencies,
 * and circular references. It performs comprehensive checks using npm/pnpm commands,
 * validates peer dependencies, and generates detailed reports highlighting issues
 * that need resolution.
 * 
 * Usage:
 *   node validate-deps.js [--fix] [--ci] [--verbose]
 *     --fix: Attempts to automatically fix some issues (version conflicts)
 *     --ci: Exits with error code on any issues (for CI/CD pipelines)
 *     --verbose: Shows detailed output including all scanned packages
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const CRITICAL_PACKAGES = [
  'minimatch',
  'semver',
  'ws',
  'axios',
  'react',
  'react-dom',
  'react-native',
  '@babel/core',
  '@babel/runtime',
  'typescript'
];

// Expected versions for critical packages
const EXPECTED_VERSIONS = {
  'minimatch': '5.1.6',
  'semver': '7.5.4',
  'ws': '8.16.0',
  'axios': '1.6.8',
  'react': '18.2.0',
  'react-dom': '18.2.0',
  'react-native': '0.73.4',
  '@babel/core': '7.23.9',
  '@babel/runtime': '7.23.9',
  'typescript': '5.3.3'
};

// Parse command line arguments
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const isCiMode = args.includes('--ci');
const isVerbose = args.includes('--verbose');

// Results storage
let issues = {
  versionConflicts: [],
  missingDependencies: [],
  circularDependencies: [],
  peerDependencyIssues: []
};

// Stats
let stats = {
  packagesScanned: 0,
  issuesFound: 0,
  issuesFixed: 0
};

/**
 * Main execution function
 */
async function main() {
  console.log('🔍 AUSTA SuperApp Dependency Validator');
  console.log('=======================================');
  
  try {
    // Find all package.json files in the monorepo
    const packageJsonFiles = await findPackageJsonFiles();
    stats.packagesScanned = packageJsonFiles.length;
    
    console.log(`Found ${packageJsonFiles.length} package.json files to analyze\n`);
    
    // Analyze version conflicts
    console.log('📊 Analyzing version conflicts...');
    await analyzeVersionConflicts(packageJsonFiles);
    
    // Check for circular dependencies
    console.log('\n🔄 Checking for circular dependencies...');
    await checkCircularDependencies();
    
    // Validate peer dependencies
    console.log('\n👥 Validating peer dependencies...');
    await validatePeerDependencies(packageJsonFiles);
    
    // Check for missing dependencies
    console.log('\n🧩 Checking for missing dependencies...');
    await checkMissingDependencies();
    
    // Generate report
    generateReport();
    
    // Exit with appropriate code for CI/CD
    if (isCiMode && getTotalIssueCount() > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error during dependency validation:', error.message);
    if (error.stack && isVerbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

/**
 * Find all package.json files in the monorepo
 */
async function findPackageJsonFiles() {
  const rootDir = process.cwd();
  const packageJsonFiles = [];
  
  // Helper function to recursively find package.json files
  function findPackageJsonInDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      // Skip node_modules directories
      if (file.isDirectory() && file.name !== 'node_modules') {
        findPackageJsonInDir(fullPath);
      } else if (file.isFile() && file.name === 'package.json') {
        packageJsonFiles.push(fullPath);
      }
    }
  }
  
  findPackageJsonInDir(rootDir);
  return packageJsonFiles;
}

/**
 * Analyze version conflicts across package.json files
 */
async function analyzeVersionConflicts(packageJsonFiles) {
  // Map to store package versions
  const packageVersions = {};
  
  // First pass: collect all versions
  for (const filePath of packageJsonFiles) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const packageName = packageJson.name || path.basename(path.dirname(filePath));
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Process dependencies, devDependencies, and peerDependencies
      const allDeps = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };
      
      // Record each dependency version
      for (const [depName, versionRange] of Object.entries(allDeps)) {
        if (!packageVersions[depName]) {
          packageVersions[depName] = [];
        }
        
        packageVersions[depName].push({
          packageName,
          versionRange,
          filePath: relativePath
        });
      }
    } catch (error) {
      console.error(`Error processing ${filePath}: ${error.message}`);
    }
  }
  
  // Second pass: identify conflicts, focusing on critical packages
  for (const criticalPkg of CRITICAL_PACKAGES) {
    const versions = packageVersions[criticalPkg];
    
    if (versions && versions.length > 1) {
      // Check if there are different version ranges
      const uniqueVersions = new Set(versions.map(v => v.versionRange));
      
      if (uniqueVersions.size > 1) {
        const expectedVersion = EXPECTED_VERSIONS[criticalPkg];
        
        issues.versionConflicts.push({
          packageName: criticalPkg,
          versions: versions,
          expectedVersion,
          uniqueVersionsCount: uniqueVersions.size
        });
        
        // Attempt to fix if --fix flag is provided
        if (shouldFix && expectedVersion) {
          await fixVersionConflict(criticalPkg, expectedVersion);
          stats.issuesFixed++;
        }
      }
    }
  }
  
  // Also check for other packages with many version conflicts
  for (const [pkgName, versions] of Object.entries(packageVersions)) {
    if (!CRITICAL_PACKAGES.includes(pkgName) && versions.length > 3) {
      const uniqueVersions = new Set(versions.map(v => v.versionRange));
      
      if (uniqueVersions.size > 2) {
        issues.versionConflicts.push({
          packageName: pkgName,
          versions: versions,
          uniqueVersionsCount: uniqueVersions.size
        });
      }
    }
  }
}

/**
 * Fix version conflicts by adding resolutions to root package.json
 */
async function fixVersionConflict(packageName, expectedVersion) {
  try {
    const rootPackageJsonPath = path.join(process.cwd(), 'package.json');
    const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
    
    // Add or update resolutions field
    if (!rootPackageJson.resolutions) {
      rootPackageJson.resolutions = {};
    }
    
    rootPackageJson.resolutions[packageName] = expectedVersion;
    
    // Write back to file
    fs.writeFileSync(
      rootPackageJsonPath,
      JSON.stringify(rootPackageJson, null, 2) + '\n'
    );
    
    console.log(`✅ Added resolution for ${packageName}@${expectedVersion} in root package.json`);
    
    // Run yarn to apply the resolution
    if (fs.existsSync(path.join(process.cwd(), 'yarn.lock'))) {
      console.log(`🧶 Running yarn to apply resolutions...`);
      execSync('yarn install --focus', { stdio: isVerbose ? 'inherit' : 'pipe' });
    } else {
      console.log(`📦 Running npm install to apply changes...`);
      execSync('npm install', { stdio: isVerbose ? 'inherit' : 'pipe' });
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to fix version conflict for ${packageName}: ${error.message}`);
    return false;
  }
}

/**
 * Check for circular dependencies using npm/pnpm
 */
async function checkCircularDependencies() {
  try {
    // Determine which package manager to use
    const useYarn = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
    const usePnpm = fs.existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'));
    
    let command;
    if (usePnpm) {
      command = 'pnpm list --circular';
    } else if (useYarn) {
      // Yarn doesn't have a built-in circular dependency check
      // Use madge as an alternative if available
      try {
        execSync('npx madge --version', { stdio: 'pipe' });
        command = 'npx madge --circular --extensions ts,js,tsx,jsx src/';
      } catch (e) {
        console.log('⚠️ Yarn detected but madge not available. Installing temporarily...');
        execSync('npm install --no-save madge', { stdio: 'pipe' });
        command = 'npx madge --circular --extensions ts,js,tsx,jsx src/';
      }
    } else {
      command = 'npm ls --circular';
    }
    
    console.log(`Running: ${command}`);
    const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    
    if (stdout.includes('circular') || stdout.includes('Circular')) {
      const circularDeps = stdout
        .split('\n')
        .filter(line => line.includes('circular') || line.includes('Circular') || line.includes(' -> '))
        .map(line => line.trim());
      
      if (circularDeps.length > 0) {
        issues.circularDependencies = circularDeps;
        console.log(`⚠️ Found ${circularDeps.length} circular dependencies`);
      }
    } else {
      console.log('✅ No circular dependencies found');
    }
  } catch (error) {
    // Check if the error output contains circular dependency information
    if (error.stdout && (error.stdout.includes('circular') || error.stdout.includes('Circular'))) {
      const circularDeps = error.stdout
        .split('\n')
        .filter(line => line.includes('circular') || line.includes('Circular') || line.includes(' -> '))
        .map(line => line.trim());
      
      if (circularDeps.length > 0) {
        issues.circularDependencies = circularDeps;
        console.log(`⚠️ Found ${circularDeps.length} circular dependencies`);
      }
    } else {
      console.error(`❌ Error checking circular dependencies: ${error.message}`);
      if (isVerbose && error.stderr) {
        console.error(error.stderr);
      }
    }
  }
}

/**
 * Validate peer dependencies across packages
 */
async function validatePeerDependencies(packageJsonFiles) {
  for (const filePath of packageJsonFiles) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const packageName = packageJson.name || path.basename(path.dirname(filePath));
      const relativePath = path.relative(process.cwd(), filePath);
      
      // Skip if no peer dependencies
      if (!packageJson.peerDependencies) continue;
      
      const peerDeps = packageJson.peerDependencies;
      const ownDeps = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };
      
      for (const [peerName, peerVersion] of Object.entries(peerDeps)) {
        // Check if the package has its own dependency that conflicts with peer dependency
        if (ownDeps[peerName] && ownDeps[peerName] !== peerVersion) {
          issues.peerDependencyIssues.push({
            packageName,
            filePath: relativePath,
            peerName,
            peerVersion,
            actualVersion: ownDeps[peerName],
            type: 'conflict'
          });
        }
        
        // For workspace packages, check if the dependency exists in the workspace
        if (packageJson.name && packageJson.name.startsWith('@austa/')) {
          // This is a workspace package, check if peer dependency is satisfied
          try {
            const checkCmd = useYarn ? 
              `yarn why ${peerName}` : 
              `npm ls ${peerName}`;
              
            execSync(checkCmd, { stdio: 'pipe' });
          } catch (e) {
            // Dependency not found or not satisfied
            issues.peerDependencyIssues.push({
              packageName,
              filePath: relativePath,
              peerName,
              peerVersion,
              type: 'missing'
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error validating peer dependencies in ${filePath}: ${error.message}`);
    }
  }
  
  if (issues.peerDependencyIssues.length > 0) {
    console.log(`⚠️ Found ${issues.peerDependencyIssues.length} peer dependency issues`);
  } else {
    console.log('✅ All peer dependencies are satisfied');
  }
}

/**
 * Check for missing dependencies using npm ls
 */
async function checkMissingDependencies() {
  try {
    // Determine which package manager to use
    const useYarn = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));
    
    const command = useYarn ? 'yarn list' : 'npm ls';
    console.log(`Running: ${command}`);
    
    try {
      const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
      
      // npm ls will output to stderr for missing dependencies
      if (stderr) {
        const missingDeps = stderr
          .split('\n')
          .filter(line => line.includes('missing:') || line.includes('UNMET DEPENDENCY'))
          .map(line => line.trim());
        
        if (missingDeps.length > 0) {
          issues.missingDependencies = missingDeps;
          console.log(`⚠️ Found ${missingDeps.length} missing dependencies`);
        }
      } else {
        console.log('✅ No missing dependencies found');
      }
    } catch (error) {
      // npm ls exits with non-zero code if there are issues
      if (error.stderr) {
        const missingDeps = error.stderr
          .split('\n')
          .filter(line => line.includes('missing:') || line.includes('UNMET DEPENDENCY'))
          .map(line => line.trim());
        
        if (missingDeps.length > 0) {
          issues.missingDependencies = missingDeps;
          console.log(`⚠️ Found ${missingDeps.length} missing dependencies`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error checking missing dependencies: ${error.message}`);
  }
}

/**
 * Generate a detailed report of all issues
 */
function generateReport() {
  const totalIssues = getTotalIssueCount();
  stats.issuesFound = totalIssues;
  
  console.log('\n📋 DEPENDENCY VALIDATION REPORT');
  console.log('=======================================');
  console.log(`Packages scanned: ${stats.packagesScanned}`);
  console.log(`Total issues found: ${totalIssues}`);
  
  if (shouldFix) {
    console.log(`Issues automatically fixed: ${stats.issuesFixed}`);
  }
  
  // Report version conflicts
  if (issues.versionConflicts.length > 0) {
    console.log('\n🔴 VERSION CONFLICTS');
    console.log('-------------------');
    
    issues.versionConflicts.forEach(conflict => {
      console.log(`\nPackage: ${conflict.packageName} (${conflict.uniqueVersionsCount} different versions)`);
      
      if (conflict.expectedVersion) {
        console.log(`Expected version: ${conflict.expectedVersion}`);
      }
      
      // Group by version for cleaner output
      const versionGroups = {};
      conflict.versions.forEach(v => {
        if (!versionGroups[v.versionRange]) {
          versionGroups[v.versionRange] = [];
        }
        versionGroups[v.versionRange].push(v);
      });
      
      Object.entries(versionGroups).forEach(([version, packages]) => {
        console.log(`  Version ${version} used by:`);
        packages.slice(0, 5).forEach(pkg => {
          console.log(`    - ${pkg.packageName} (${pkg.filePath})`);
        });
        
        if (packages.length > 5) {
          console.log(`    - ...and ${packages.length - 5} more`);
        }
      });
      
      // Suggest fix
      if (conflict.expectedVersion) {
        console.log(`\n  Suggested fix: Add to root package.json:`);
        console.log(`  "resolutions": {`);
        console.log(`    "${conflict.packageName}": "${conflict.expectedVersion}"`);
        console.log(`  }`);
      }
    });
  }
  
  // Report circular dependencies
  if (issues.circularDependencies.length > 0) {
    console.log('\n🔄 CIRCULAR DEPENDENCIES');
    console.log('------------------------');
    
    issues.circularDependencies.forEach(circular => {
      console.log(`- ${circular}`);
    });
    
    console.log('\nSuggested fix: Refactor the code to break circular dependencies by:');
    console.log('- Creating interface packages that both dependent packages can import');
    console.log('- Using dependency injection instead of direct imports');
    console.log('- Restructuring the code to avoid circular references');
  }
  
  // Report peer dependency issues
  if (issues.peerDependencyIssues.length > 0) {
    console.log('\n👥 PEER DEPENDENCY ISSUES');
    console.log('------------------------');
    
    const conflictIssues = issues.peerDependencyIssues.filter(i => i.type === 'conflict');
    const missingIssues = issues.peerDependencyIssues.filter(i => i.type === 'missing');
    
    if (conflictIssues.length > 0) {
      console.log('\nConflicting peer dependencies:');
      conflictIssues.forEach(issue => {
        console.log(`- ${issue.packageName} (${issue.filePath})`);
        console.log(`  requires ${issue.peerName}@${issue.peerVersion} but depends on ${issue.peerName}@${issue.actualVersion}`);
      });
    }
    
    if (missingIssues.length > 0) {
      console.log('\nMissing peer dependencies:');
      missingIssues.forEach(issue => {
        console.log(`- ${issue.packageName} (${issue.filePath})`);
        console.log(`  requires ${issue.peerName}@${issue.peerVersion} but it's not installed`);
      });
    }
    
    console.log('\nSuggested fix:');
    console.log('- For conflicts: Update the package\'s own dependency to match its peer dependency');
    console.log('- For missing: Add the peer dependency to devDependencies');
  }
  
  // Report missing dependencies
  if (issues.missingDependencies.length > 0) {
    console.log('\n🧩 MISSING DEPENDENCIES');
    console.log('----------------------');
    
    issues.missingDependencies.forEach(missing => {
      console.log(`- ${missing}`);
    });
    
    console.log('\nSuggested fix: Install the missing dependencies with:');
    console.log('- yarn add [package] or npm install [package]');
    console.log('- Check for typos in import statements');
    console.log('- Ensure all dependencies are properly declared in package.json');
  }
  
  // Final summary
  console.log('\n=======================================');
  if (totalIssues === 0) {
    console.log('🎉 No dependency issues found! All packages are properly configured.');
  } else {
    const remainingIssues = totalIssues - stats.issuesFixed;
    
    if (remainingIssues === 0) {
      console.log('🎉 All issues have been automatically fixed!');
    } else {
      console.log(`⚠️ Found ${remainingIssues} dependency issues that need to be resolved.`);
      
      if (isCiMode) {
        console.log('❌ CI mode enabled - failing the build due to dependency issues.');
      } else if (!shouldFix) {
        console.log('💡 Run with --fix flag to attempt automatic resolution of version conflicts.');
      }
    }
  }
}

/**
 * Get the total count of issues
 */
function getTotalIssueCount() {
  return (
    issues.versionConflicts.length +
    issues.circularDependencies.length +
    issues.peerDependencyIssues.length +
    issues.missingDependencies.length
  );
}

// Check if we're using yarn
const useYarn = fs.existsSync(path.join(process.cwd(), 'yarn.lock'));

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});