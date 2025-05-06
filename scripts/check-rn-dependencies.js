#!/usr/bin/env node

// Make this script executable with: chmod +x scripts/check-rn-dependencies.js

/**
 * check-rn-dependencies.js
 * 
 * A CLI utility that recursively scans all package.json files to validate React Native 
 * dependencies across the project. It checks compatibility between React Native and 
 * critical dependencies like React Navigation, Reanimated, and Babel transforms, 
 * identifies conflicts and security issues, generates a detailed report, and 
 * optionally invokes automated remediation.
 * 
 * Usage:
 *   node scripts/check-rn-dependencies.js [--fix] [--verbose] [--path=<path>]
 * 
 * Options:
 *   --fix       Attempt to automatically fix dependency issues
 *   --verbose   Show detailed output including all package.json files
 *   --path      Specify a custom path to scan (default: project root)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');
const semver = require('semver');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  verbose: args.includes('--verbose'),
  path: args.find(arg => arg.startsWith('--path='))?.split('=')[1] || process.cwd(),
};

// Define the target React Native version from the technical specification
const TARGET_RN_VERSION = '0.73.4';

// Define compatibility matrix for React Native and its ecosystem
const COMPATIBILITY_MATRIX = {
  // Core React Native dependencies
  'react-native': {
    version: TARGET_RN_VERSION,
    critical: true,
    description: 'Core React Native framework',
  },
  'react': {
    version: '18.2.0',
    critical: true,
    description: 'React library',
    compatibleWith: {
      'react-native': {
        '0.73.x': '18.2.0',
        '0.72.x': '18.2.0',
        '0.71.x': '18.2.0',
        '0.70.x': '18.2.0',
      }
    }
  },
  
  // Navigation
  '@react-navigation/native': {
    version: '6.1.9',
    critical: true,
    description: 'React Navigation core',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^6.1.0',
        '0.72.x': '^6.1.0',
        '0.71.x': '^6.1.0',
        '0.70.x': '^6.0.0',
      }
    }
  },
  '@react-navigation/stack': {
    version: '6.3.20',
    critical: false,
    description: 'Stack navigator for React Navigation',
    compatibleWith: {
      '@react-navigation/native': {
        '6.x': '^6.3.0',
      }
    }
  },
  '@react-navigation/bottom-tabs': {
    version: '6.5.11',
    critical: false,
    description: 'Bottom tabs navigator for React Navigation',
    compatibleWith: {
      '@react-navigation/native': {
        '6.x': '^6.5.0',
      }
    }
  },
  
  // Animations and gestures
  'react-native-reanimated': {
    version: '3.3.0',
    critical: true,
    description: 'Animation library for React Native',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^3.3.0',
        '0.72.x': '^3.3.0',
        '0.71.x': '^3.0.0',
        '0.70.x': '^2.14.0',
      }
    }
  },
  'react-native-gesture-handler': {
    version: '2.12.0',
    critical: true,
    description: 'Gesture system for React Native',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^2.12.0',
        '0.72.x': '^2.12.0',
        '0.71.x': '^2.9.0',
        '0.70.x': '^2.8.0',
      }
    }
  },
  
  // SVG support
  'react-native-svg': {
    version: '13.10.0',
    critical: false,
    description: 'SVG library for React Native',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^13.9.0',
        '0.72.x': '^13.9.0',
        '0.71.x': '^13.4.0',
        '0.70.x': '^13.0.0',
      }
    }
  },
  
  // Babel plugins
  '@babel/plugin-transform-export-namespace-from': {
    version: '7.22.11',
    critical: true,
    description: 'Babel plugin for export namespace syntax',
    replaces: '@babel/plugin-proposal-export-namespace-from',
  },
  '@babel/plugin-transform-flow-strip-types': {
    version: '7.22.5',
    critical: true,
    description: 'Babel plugin for Flow type stripping',
    replaces: '@babel/plugin-proposal-flow-strip-types',
  },
  '@babel/plugin-transform-class-properties': {
    version: '7.22.5',
    critical: true,
    description: 'Babel plugin for class properties',
    replaces: '@babel/plugin-proposal-class-properties',
  },
  '@babel/plugin-transform-nullish-coalescing-operator': {
    version: '7.22.11',
    critical: true,
    description: 'Babel plugin for nullish coalescing',
    replaces: '@babel/plugin-proposal-nullish-coalescing-operator',
  },
  '@babel/plugin-transform-numeric-separator': {
    version: '7.22.11',
    critical: true,
    description: 'Babel plugin for numeric separators',
    replaces: '@babel/plugin-proposal-numeric-separator',
  },
  '@babel/plugin-transform-object-rest-spread': {
    version: '7.22.11',
    critical: true,
    description: 'Babel plugin for object rest/spread',
    replaces: '@babel/plugin-proposal-object-rest-spread',
  },
  '@babel/plugin-transform-optional-catch-binding': {
    version: '7.22.11',
    critical: true,
    description: 'Babel plugin for optional catch binding',
    replaces: '@babel/plugin-proposal-optional-catch-binding',
  },
  '@babel/plugin-transform-optional-chaining': {
    version: '7.22.15',
    critical: true,
    description: 'Babel plugin for optional chaining',
    replaces: '@babel/plugin-proposal-optional-chaining',
  },
  
  // New packages from technical specification
  '@austa/design-system': {
    version: '1.0.0',
    critical: true,
    description: 'AUSTA design system package',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^1.0.0',
      },
      '@design-system/primitives': {
        '1.x': '^1.0.0',
      }
    }
  },
  '@design-system/primitives': {
    version: '1.0.0',
    critical: true,
    description: 'Design system primitives package',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^1.0.0',
      }
    }
  },
  '@austa/interfaces': {
    version: '1.0.0',
    critical: true,
    description: 'Shared TypeScript interfaces package',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^1.0.0',
      }
    }
  },
  '@austa/journey-context': {
    version: '1.0.0',
    critical: true,
    description: 'Journey context provider package',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^1.0.0',
      },
      '@austa/interfaces': {
        '1.x': '^1.0.0',
      }
    }
  },
  
  // Other important dependencies from technical specification
  'styled-components': {
    version: '6.1.8',
    critical: true,
    description: 'CSS-in-JS styling library',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^6.1.0',
        '0.72.x': '^6.0.0',
        '0.71.x': '^6.0.0 || ^5.3.0',
        '0.70.x': '^5.3.0',
      }
    }
  },
  '@tanstack/react-query': {
    version: '5.25.0',
    critical: false,
    description: 'Data fetching and caching library',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^5.0.0',
        '0.72.x': '^5.0.0 || ^4.0.0',
        '0.71.x': '^4.0.0',
        '0.70.x': '^4.0.0',
      }
    }
  },
  'apollo-client': {
    version: '3.8.10',
    critical: false,
    description: 'GraphQL client',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^3.8.0',
        '0.72.x': '^3.7.0',
        '0.71.x': '^3.7.0',
        '0.70.x': '^3.6.0',
      }
    }
  },
  'i18next': {
    version: '23.8.2',
    critical: false,
    description: 'Internationalization library',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^23.0.0',
        '0.72.x': '^23.0.0 || ^22.0.0',
        '0.71.x': '^22.0.0',
        '0.70.x': '^22.0.0 || ^21.0.0',
      }
    }
  },
  'date-fns': {
    version: '3.3.1',
    critical: false,
    description: 'Date utility library',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^3.0.0',
        '0.72.x': '^3.0.0 || ^2.30.0',
        '0.71.x': '^2.30.0',
        '0.70.x': '^2.29.0',
      }
    }
  },
  'typescript': {
    version: '5.3.3',
    critical: true,
    description: 'TypeScript language',
    compatibleWith: {
      'react-native': {
        '0.73.x': '^5.3.0',
        '0.72.x': '^5.0.0 || ^4.8.0',
        '0.71.x': '^4.8.0',
        '0.70.x': '^4.7.0',
      }
    }
  },
};

// Define known security issues
const SECURITY_ISSUES = [
  {
    package: 'minimatch',
    vulnerableVersions: '<3.0.5',
    recommendation: '3.0.8',
    description: 'Regular expression denial of service vulnerability',
  },
  {
    package: 'semver',
    vulnerableVersions: '<7.5.2',
    recommendation: '7.5.4',
    description: 'Regular expression denial of service vulnerability',
  },
  {
    package: 'ws',
    vulnerableVersions: '<7.4.6',
    recommendation: '8.14.2',
    description: 'Denial of service vulnerability',
  },
  {
    package: 'node-fetch',
    vulnerableVersions: '<2.6.7',
    recommendation: '2.6.12',
    description: 'Exposure of sensitive information vulnerability',
  },
  {
    package: 'json5',
    vulnerableVersions: '<1.0.2 || >=2.0.0 <2.2.2',
    recommendation: '2.2.3',
    description: 'Prototype pollution vulnerability',
  },
  {
    package: 'tough-cookie',
    vulnerableVersions: '<4.1.3',
    recommendation: '4.1.3',
    description: 'Prototype pollution vulnerability',
  },
];

// Define deprecated packages that should be replaced
const DEPRECATED_PACKAGES = [
  {
    package: '@babel/plugin-proposal-export-namespace-from',
    replacement: '@babel/plugin-transform-export-namespace-from',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-flow-strip-types',
    replacement: '@babel/plugin-transform-flow-strip-types',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-class-properties',
    replacement: '@babel/plugin-transform-class-properties',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-nullish-coalescing-operator',
    replacement: '@babel/plugin-transform-nullish-coalescing-operator',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-numeric-separator',
    replacement: '@babel/plugin-transform-numeric-separator',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-object-rest-spread',
    replacement: '@babel/plugin-transform-object-rest-spread',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-optional-catch-binding',
    replacement: '@babel/plugin-transform-optional-catch-binding',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
  {
    package: '@babel/plugin-proposal-optional-chaining',
    replacement: '@babel/plugin-transform-optional-chaining',
    reason: 'Babel proposal plugins have been replaced by transform plugins',
  },
];

// Define required packages for React Native projects
const REQUIRED_PACKAGES = [
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context',
];

// Main function to scan and validate dependencies
async function main() {
  console.log(chalk.bold.blue('\n🔍 AUSTA SuperApp React Native Dependency Checker'));
  console.log(chalk.blue(`Target React Native version: ${TARGET_RN_VERSION}\n`));
  
  // Find all package.json files
  const packageJsonFiles = findPackageJsonFiles(options.path);
  
  if (options.verbose) {
    console.log(chalk.gray(`Found ${packageJsonFiles.length} package.json files to analyze\n`));
  }
  
  // Track overall statistics
  const stats = {
    totalFiles: packageJsonFiles.length,
    reactNativeProjects: 0,
    issuesFound: 0,
    securityVulnerabilities: 0,
    deprecatedPackages: 0,
    versionConflicts: 0,
    missingRequiredPackages: 0,
    fixedIssues: 0,
  };
  
  // Process each package.json file
  for (const filePath of packageJsonFiles) {
    const result = await processPackageJson(filePath);
    
    // Update statistics
    if (result.isReactNativeProject) {
      stats.reactNativeProjects++;
      stats.issuesFound += result.issues.length;
      stats.securityVulnerabilities += result.securityIssues;
      stats.deprecatedPackages += result.deprecatedPackages;
      stats.versionConflicts += result.versionConflicts;
      stats.missingRequiredPackages += result.missingRequiredPackages;
      stats.fixedIssues += result.fixedIssues;
    }
  }
  
  // Print summary
  console.log(chalk.bold.green('\n✅ Dependency Check Complete'));
  console.log(chalk.bold(`\nSummary:`));
  console.log(`  Total package.json files analyzed: ${stats.totalFiles}`);
  console.log(`  React Native projects found: ${stats.reactNativeProjects}`);
  console.log(`  Total issues found: ${stats.issuesFound}`);
  console.log(`    - Security vulnerabilities: ${stats.securityVulnerabilities}`);
  console.log(`    - Deprecated packages: ${stats.deprecatedPackages}`);
  console.log(`    - Version conflicts: ${stats.versionConflicts}`);
  console.log(`    - Missing required packages: ${stats.missingRequiredPackages}`);
  
  if (options.fix) {
    console.log(`  Issues automatically fixed: ${stats.fixedIssues}`);
  }
  
  // Provide recommendations
  if (stats.issuesFound > 0) {
    console.log(chalk.bold.yellow('\nRecommendations:'));
    
    if (stats.securityVulnerabilities > 0) {
      console.log(chalk.yellow('  • Update packages with security vulnerabilities immediately'));
    }
    
    if (stats.deprecatedPackages > 0) {
      console.log(chalk.yellow('  • Replace deprecated Babel proposal plugins with transform plugins'));
    }
    
    if (stats.versionConflicts > 0) {
      console.log(chalk.yellow(`  • Standardize React Native to version ${TARGET_RN_VERSION} across all projects`));
      console.log(chalk.yellow('  • Update dependencies to versions compatible with the target React Native version'));
    }
    
    if (stats.missingRequiredPackages > 0) {
      console.log(chalk.yellow('  • Add missing required packages to React Native projects'));
      console.log(chalk.yellow('    - @austa/design-system: UI component library with journey-specific theming'));
      console.log(chalk.yellow('    - @design-system/primitives: Design tokens and primitives'));
      console.log(chalk.yellow('    - @austa/interfaces: Shared TypeScript interfaces'));
      console.log(chalk.yellow('    - @austa/journey-context: Journey state management'));
    }
    
    if (!options.fix) {
      console.log(chalk.bold.blue('\nTo automatically fix issues, run with the --fix flag'));
    }
  } else {
    console.log(chalk.bold.green('\n🎉 No issues found! All dependencies are compatible.'));
  }
}

// Find all package.json files recursively
function findPackageJsonFiles(startPath) {
  const results = [];
  
  function findRecursively(currentPath) {
    const files = fs.readdirSync(currentPath);
    
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
        findRecursively(filePath);
      } else if (file === 'package.json') {
        results.push(filePath);
      }
    }
  }
  
  findRecursively(startPath);
  return results;
}

// Process a single package.json file
async function processPackageJson(filePath) {
  const result = {
    isReactNativeProject: false,
    issues: [],
    securityIssues: 0,
    deprecatedPackages: 0,
    versionConflicts: 0,
    missingRequiredPackages: 0,
    fixedIssues: 0,
  };
  
  try {
    const packageJsonContent = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check if this is a React Native project
    const hasReactNative = (
      (packageJson.dependencies && packageJson.dependencies['react-native']) ||
      (packageJson.devDependencies && packageJson.devDependencies['react-native'])
    );
    
    if (!hasReactNative) {
      if (options.verbose) {
        console.log(chalk.gray(`Skipping ${relativePath} (not a React Native project)`));
      }
      return result;
    }
    
    result.isReactNativeProject = true;
    
    console.log(chalk.bold(`\nAnalyzing ${chalk.cyan(relativePath)}:`));
    
    // Get React Native version
    const rnVersion = (
      (packageJson.dependencies && packageJson.dependencies['react-native']) ||
      (packageJson.devDependencies && packageJson.devDependencies['react-native'])
    );
    
    console.log(`  React Native version: ${rnVersion}`);
    
    // Check if React Native version matches target
    if (rnVersion !== TARGET_RN_VERSION) {
      const issue = {
        type: 'version-conflict',
        package: 'react-native',
        currentVersion: rnVersion,
        recommendedVersion: TARGET_RN_VERSION,
        message: `React Native version (${rnVersion}) does not match target (${TARGET_RN_VERSION})`,
      };
      
      result.issues.push(issue);
      result.versionConflicts++;
      
      console.log(chalk.yellow(`  ⚠️ ${issue.message}`));
      
      // Fix if requested
      if (options.fix) {
        if (packageJson.dependencies && packageJson.dependencies['react-native']) {
          packageJson.dependencies['react-native'] = TARGET_RN_VERSION;
        } else if (packageJson.devDependencies && packageJson.devDependencies['react-native']) {
          packageJson.devDependencies['react-native'] = TARGET_RN_VERSION;
        }
        
        result.fixedIssues++;
        console.log(chalk.green(`    ✓ Fixed: Updated React Native to ${TARGET_RN_VERSION}`));
      }
    }
    
    // Check for missing required packages
    for (const requiredPackage of REQUIRED_PACKAGES) {
      const hasPackage = (
        (packageJson.dependencies && packageJson.dependencies[requiredPackage]) ||
        (packageJson.devDependencies && packageJson.devDependencies[requiredPackage])
      );
      
      if (!hasPackage) {
        const packageInfo = COMPATIBILITY_MATRIX[requiredPackage];
        const issue = {
          type: 'missing-package',
          package: requiredPackage,
          recommendedVersion: packageInfo.version,
          message: `Missing required package: ${requiredPackage} (${packageInfo.description})`,
        };
        
        result.issues.push(issue);
        result.missingRequiredPackages++;
        
        console.log(chalk.yellow(`  ⚠️ ${issue.message}`));
        
        // Fix if requested
        if (options.fix) {
          if (!packageJson.dependencies) {
            packageJson.dependencies = {};
          }
          
          packageJson.dependencies[requiredPackage] = packageInfo.version;
          
          result.fixedIssues++;
          console.log(chalk.green(`    ✓ Fixed: Added ${requiredPackage}@${packageInfo.version}`));
        }
      }
    }
    
    // Check all dependencies for compatibility issues
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    for (const [packageName, version] of Object.entries(allDependencies)) {
      // Skip if not in our compatibility matrix
      if (!COMPATIBILITY_MATRIX[packageName]) {
        continue;
      }
      
      const packageInfo = COMPATIBILITY_MATRIX[packageName];
      
      // Check version compatibility
      if (packageInfo.compatibleWith && packageInfo.compatibleWith['react-native']) {
        const cleanRnVersion = rnVersion.replace(/^\^|~/, '');
        const majorMinor = `${semver.major(cleanRnVersion)}.${semver.minor(cleanRnVersion)}.x`;
        
        const compatibleVersion = packageInfo.compatibleWith['react-native'][majorMinor];
        
        if (compatibleVersion && !semver.satisfies(version.replace(/^\^|~/, ''), compatibleVersion.replace(/^\^|~/, ''))) {
          const issue = {
            type: 'compatibility-issue',
            package: packageName,
            currentVersion: version,
            recommendedVersion: packageInfo.version,
            message: `${packageName}@${version} is not compatible with React Native ${rnVersion}. Recommended: ${packageInfo.version}`,
          };
          
          result.issues.push(issue);
          result.versionConflicts++;
          
          console.log(chalk.yellow(`  ⚠️ ${issue.message}`));
          
          // Fix if requested
          if (options.fix) {
            if (packageJson.dependencies && packageJson.dependencies[packageName]) {
              packageJson.dependencies[packageName] = packageInfo.version;
            } else if (packageJson.devDependencies && packageJson.devDependencies[packageName]) {
              packageJson.devDependencies[packageName] = packageInfo.version;
            }
            
            result.fixedIssues++;
            console.log(chalk.green(`    ✓ Fixed: Updated ${packageName} to ${packageInfo.version}`));
          }
        }
      }
    }
    
    // Check for deprecated packages
    for (const deprecatedPackage of DEPRECATED_PACKAGES) {
      if (allDependencies[deprecatedPackage.package]) {
        const issue = {
          type: 'deprecated-package',
          package: deprecatedPackage.package,
          replacement: deprecatedPackage.replacement,
          message: `${deprecatedPackage.package} is deprecated. ${deprecatedPackage.reason}. Replace with ${deprecatedPackage.replacement}`,
        };
        
        result.issues.push(issue);
        result.deprecatedPackages++;
        
        console.log(chalk.yellow(`  ⚠️ ${issue.message}`));
        
        // Fix if requested
        if (options.fix) {
          const replacementInfo = COMPATIBILITY_MATRIX[deprecatedPackage.replacement];
          
          // Remove deprecated package
          if (packageJson.dependencies && packageJson.dependencies[deprecatedPackage.package]) {
            delete packageJson.dependencies[deprecatedPackage.package];
          } else if (packageJson.devDependencies && packageJson.devDependencies[deprecatedPackage.package]) {
            delete packageJson.devDependencies[deprecatedPackage.package];
          }
          
          // Add replacement package
          if (!packageJson.devDependencies) {
            packageJson.devDependencies = {};
          }
          
          packageJson.devDependencies[deprecatedPackage.replacement] = replacementInfo.version;
          
          result.fixedIssues++;
          console.log(chalk.green(`    ✓ Fixed: Replaced ${deprecatedPackage.package} with ${deprecatedPackage.replacement}@${replacementInfo.version}`));
        }
      }
    }
    
    // Check for security issues
    for (const securityIssue of SECURITY_ISSUES) {
      if (allDependencies[securityIssue.package]) {
        const version = allDependencies[securityIssue.package].replace(/^\^|~/, '');
        
        if (semver.satisfies(version, securityIssue.vulnerableVersions)) {
          const issue = {
            type: 'security-issue',
            package: securityIssue.package,
            currentVersion: allDependencies[securityIssue.package],
            recommendedVersion: securityIssue.recommendation,
            message: `${securityIssue.package}@${version} has a security vulnerability: ${securityIssue.description}. Update to ${securityIssue.recommendation}`,
          };
          
          result.issues.push(issue);
          result.securityIssues++;
          
          console.log(chalk.red(`  🔒 ${issue.message}`));
          
          // Fix if requested
          if (options.fix) {
            if (packageJson.dependencies && packageJson.dependencies[securityIssue.package]) {
              packageJson.dependencies[securityIssue.package] = securityIssue.recommendation;
            } else if (packageJson.devDependencies && packageJson.devDependencies[securityIssue.package]) {
              packageJson.devDependencies[securityIssue.package] = securityIssue.recommendation;
            }
            
            // Also update in resolutions/overrides if present
            if (packageJson.resolutions && packageJson.resolutions[securityIssue.package]) {
              packageJson.resolutions[securityIssue.package] = securityIssue.recommendation;
            }
            
            if (packageJson.overrides && packageJson.overrides[securityIssue.package]) {
              packageJson.overrides[securityIssue.package] = securityIssue.recommendation;
            }
            
            result.fixedIssues++;
            console.log(chalk.green(`    ✓ Fixed: Updated ${securityIssue.package} to ${securityIssue.recommendation}`));
          }
        }
      }
    }
    
    // Write updated package.json if fixes were applied
    if (options.fix && result.fixedIssues > 0) {
      fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.green(`  💾 Saved changes to ${relativePath}`));
    }
    
    // Summary for this package.json
    if (result.issues.length === 0) {
      console.log(chalk.green(`  ✅ No issues found`));
    } else if (!options.fix) {
      console.log(chalk.yellow(`  ⚠️ Found ${result.issues.length} issues. Run with --fix to automatically resolve them.`));
    } else {
      console.log(chalk.green(`  ✅ Fixed ${result.fixedIssues} of ${result.issues.length} issues`));
    }
    
  } catch (error) {
    console.error(chalk.red(`Error processing ${filePath}: ${error.message}`));
  }
  
  return result;
}

// Run the main function
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
});