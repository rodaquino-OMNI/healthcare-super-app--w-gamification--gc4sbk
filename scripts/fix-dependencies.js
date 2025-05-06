#!/usr/bin/env node

// Make this script executable with: chmod +x scripts/fix-dependencies.js

/**
 * fix-dependencies.js
 * 
 * This script automates and enforces consistent dependency management across the AUSTA SuperApp project.
 * It traverses the project directory to locate all package.json files and applies fixes including:
 * - Replacement of deprecated plugins
 * - Updates for vulnerable packages
 * - Standardization of versions
 * - Addition of resolutions to resolve conflicts
 * 
 * Usage: node scripts/fix-dependencies.js [--check] [--fix] [--verbose]
 * Options:
 *   --check    Only check for issues without making changes
 *   --fix      Apply fixes to package.json files (default)
 *   --verbose  Show detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const VERBOSE = args.includes('--verbose');
const FIX = args.includes('--fix') || (!CHECK_ONLY && !args.includes('--check'));

// Define color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Standardized versions for core dependencies
const CORE_VERSIONS = {
  // Programming Languages
  typescript: '5.3.3',
  
  // React Ecosystem
  react: '18.2.0',
  'react-dom': '18.2.0',
  
  // Next.js
  next: '14.2.0',
  
  // Backend Frameworks
  '@nestjs/core': '10.3.0',
  '@nestjs/common': '10.3.0',
  '@nestjs/platform-express': '10.3.0',
  '@nestjs/graphql': '10.3.0',
  express: '4.18.2',
  'apollo-server-express': '4.9.5',
  graphql: '16.9.0',
  'socket.io': '4.7.4',
  
  // Database
  prisma: '5.10.2',
  '@prisma/client': '5.10.2',
  typeorm: '0.3.20',
  
  // State Management & Data Fetching
  '@reduxjs/toolkit': '2.1.0',
  '@tanstack/react-query': '5.25.0',
  '@apollo/client': '3.8.10',
  
  // UI & Design
  'styled-components': '6.1.8',
  '@mui/material': '5.15.12',
  '@mui/icons-material': '5.15.12',
  'framer-motion': '11.0.8',
  
  // Forms & Validation
  'react-hook-form': '7.51.0',
  yup: '1.3.3',
  zod: '3.22.4',
  joi: '17.12.2',
  'class-validator': '0.14.1',
  'class-transformer': '0.5.1',
  
  // Utilities & Tools
  i18next: '23.8.2',
  'react-i18next': '14.0.5',
  'date-fns': '3.3.1',
  victory: '36.6.12',
  recharts: '2.12.2',
  axios: '1.6.8',
  'react-router-dom': '6.21.1',
  
  // Event Processing
  kafkajs: '2.2.4',
  ioredis: '5.3.2',
  
  // Monitoring & Tracing
  '@opentelemetry/sdk-node': '1.4.1',
  
  // Development & Testing
  jest: '29.7.0',
  '@testing-library/react': '14.2.1',
  '@testing-library/react-native': '12.4.3',
  eslint: '8.57.0',
  prettier: '3.2.5',
  
  // Internal Packages
  '@austa/design-system': '1.0.0',
  '@design-system/primitives': '1.0.0',
  '@austa/interfaces': '1.0.0',
  '@austa/journey-context': '1.0.0',
};

// React Native ecosystem packages with standardized versions
const RN_ECOSYSTEM = {
  'react-native': '0.73.4',
  'react-native-reanimated': '3.3.0',
  'react-native-gesture-handler': '2.12.0',
  'react-native-svg': '13.10.0',
  '@react-navigation/native': '6.1.9',
  '@react-navigation/stack': '6.3.20',
  '@react-navigation/bottom-tabs': '6.5.11',
  'react-native-safe-area-context': '4.8.2',
  'react-native-screens': '3.29.0',
  '@react-native-community/masked-view': '0.1.11',
  '@react-native-async-storage/async-storage': '1.21.0',
  'react-native-vector-icons': '10.0.3',
};

// Babel plugins to replace (deprecated -> updated)
const BABEL_REPLACEMENTS = {
  '@babel/plugin-proposal-class-properties': '@babel/plugin-transform-class-properties',
  '@babel/plugin-proposal-private-methods': '@babel/plugin-transform-private-methods',
  '@babel/plugin-proposal-private-property-in-object': '@babel/plugin-transform-private-property-in-object',
  '@babel/plugin-proposal-nullish-coalescing-operator': '@babel/plugin-transform-nullish-coalescing-operator',
  '@babel/plugin-proposal-optional-chaining': '@babel/plugin-transform-optional-chaining',
  '@babel/plugin-proposal-numeric-separator': '@babel/plugin-transform-numeric-separator',
  '@babel/plugin-proposal-logical-assignment-operators': '@babel/plugin-transform-logical-assignment-operators',
};

// Packages with known vulnerabilities to update
const VULNERABLE_PACKAGES = {
  minimatch: '^9.0.3',
  semver: '^7.5.4',
  ws: '^8.16.0',
  'node-fetch': '^2.7.0',
  'json5': '^2.2.3',
  'postcss': '^8.4.35',
};

// Resolutions to add to root package.json to resolve conflicts
const RESOLUTIONS = {
  ...VULNERABLE_PACKAGES,
  ...RN_ECOSYSTEM,
  'react': CORE_VERSIONS.react,
  'react-dom': CORE_VERSIONS['react-dom'],
  'typescript': CORE_VERSIONS.typescript,
};

// Journey-specific packages that need special handling
const JOURNEY_PACKAGES = {
  // Health journey
  '@austa/health-interfaces': '1.0.0',
  '@austa/health-components': '1.0.0',
  
  // Care journey
  '@austa/care-interfaces': '1.0.0',
  '@austa/care-components': '1.0.0',
  
  // Plan journey
  '@austa/plan-interfaces': '1.0.0',
  '@austa/plan-components': '1.0.0',
};

/**
 * Logs a message to the console with color
 * @param {string} message - The message to log
 * @param {string} color - The color to use
 */
function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

/**
 * Logs a verbose message if verbose mode is enabled
 * @param {string} message - The message to log
 */
function logVerbose(message) {
  if (VERBOSE) {
    log(message, COLORS.cyan);
  }
}

/**
 * Finds all package.json files in the project
 * @param {string} dir - The directory to start searching from
 * @param {Array} exclude - Directories to exclude
 * @returns {Array} - Array of package.json file paths
 */
function findPackageJsonFiles(dir = process.cwd(), exclude = ['node_modules', '.git', 'dist', 'build', 'coverage']) {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    // Check if package.json exists in current directory
    if (files.includes('package.json')) {
      results.push(path.join(dir, 'package.json'));
    }
    
    // Recursively search subdirectories
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !exclude.includes(file)) {
        results = results.concat(findPackageJsonFiles(filePath, exclude));
      }
    }
  } catch (error) {
    log(`Error searching directory ${dir}: ${error.message}`, COLORS.red);
  }
  
  return results;
}

/**
 * Determines if a package.json is for a React Native project
 * @param {Object} packageJson - The package.json contents
 * @returns {boolean} - True if it's a React Native project
 */
function isReactNativeProject(packageJson) {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return 'react-native' in deps;
}

/**
 * Determines if a package.json is for a Next.js project
 * @param {Object} packageJson - The package.json contents
 * @returns {boolean} - True if it's a Next.js project
 */
function isNextJsProject(packageJson) {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return 'next' in deps;
}

/**
 * Determines if a package.json is for a NestJS project
 * @param {Object} packageJson - The package.json contents
 * @returns {boolean} - True if it's a NestJS project
 */
function isNestJsProject(packageJson) {
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  return '@nestjs/core' in deps || '@nestjs/common' in deps;
}

/**
 * Determines the journey type based on package.json and file path
 * @param {Object} packageJson - The package.json contents
 * @param {string} filePath - The path to the package.json file
 * @returns {string|null} - The journey type or null if not a journey
 */
function determineJourneyType(packageJson, filePath) {
  // Check package name first
  if (packageJson.name) {
    if (packageJson.name.includes('health')) return 'health';
    if (packageJson.name.includes('care')) return 'care';
    if (packageJson.name.includes('plan')) return 'plan';
  }
  
  // Check file path
  if (filePath.includes('health-service') || filePath.includes('/health/')) return 'health';
  if (filePath.includes('care-service') || filePath.includes('/care/')) return 'care';
  if (filePath.includes('plan-service') || filePath.includes('/plan/')) return 'plan';
  
  // Check dependencies
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  if (deps['@austa/health-interfaces'] || deps['@austa/health-components']) return 'health';
  if (deps['@austa/care-interfaces'] || deps['@austa/care-components']) return 'care';
  if (deps['@austa/plan-interfaces'] || deps['@austa/plan-components']) return 'plan';
  
  return null;
}

/**
 * Updates dependencies in a package.json file
 * @param {string} filePath - Path to the package.json file
 * @returns {Object} - Object with counts of changes made
 */
function updateDependencies(filePath) {
  const stats = {
    updated: 0,
    replaced: 0,
    vulnerable: 0,
    journey: 0,
    total: 0
  };
  
  try {
    // Read and parse package.json
    const packageJsonContent = fs.readFileSync(filePath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Determine project type
    const isRN = isReactNativeProject(packageJson);
    const isNext = isNextJsProject(packageJson);
    const isNest = isNestJsProject(packageJson);
    const journeyType = determineJourneyType(packageJson, filePath);
    
    logVerbose(`Processing ${filePath}`);
    logVerbose(`  Project type: ${isRN ? 'React Native' : ''}${isNext ? 'Next.js' : ''}${isNest ? 'NestJS' : ''}`);
    if (journeyType) logVerbose(`  Journey type: ${journeyType}`);
    
    // Create a deep copy of the package.json to track changes
    const updatedPackageJson = JSON.parse(JSON.stringify(packageJson));
    
    // Update dependencies section
    if (packageJson.dependencies) {
      for (const [dep, version] of Object.entries(packageJson.dependencies)) {
        // Update core versions
        if (dep in CORE_VERSIONS) {
          updatedPackageJson.dependencies[dep] = CORE_VERSIONS[dep];
          stats.updated++;
          stats.total++;
        }
        
        // Update React Native ecosystem packages
        if (isRN && dep in RN_ECOSYSTEM) {
          updatedPackageJson.dependencies[dep] = RN_ECOSYSTEM[dep];
          stats.updated++;
          stats.total++;
        }
        
        // Replace deprecated Babel plugins
        if (dep in BABEL_REPLACEMENTS) {
          const newDep = BABEL_REPLACEMENTS[dep];
          delete updatedPackageJson.dependencies[dep];
          updatedPackageJson.dependencies[newDep] = '^1.0.0'; // Use latest version
          stats.replaced++;
          stats.total++;
        }
        
        // Update vulnerable packages
        if (dep in VULNERABLE_PACKAGES) {
          updatedPackageJson.dependencies[dep] = VULNERABLE_PACKAGES[dep];
          stats.vulnerable++;
          stats.total++;
        }
        
        // Add journey-specific packages if needed
        if (journeyType && dep in JOURNEY_PACKAGES) {
          updatedPackageJson.dependencies[dep] = JOURNEY_PACKAGES[dep];
          stats.journey++;
          stats.total++;
        }
      }
    }
    
    // Update devDependencies section
    if (packageJson.devDependencies) {
      for (const [dep, version] of Object.entries(packageJson.devDependencies)) {
        // Update core versions
        if (dep in CORE_VERSIONS) {
          updatedPackageJson.devDependencies[dep] = CORE_VERSIONS[dep];
          stats.updated++;
          stats.total++;
        }
        
        // Update React Native ecosystem packages
        if (isRN && dep in RN_ECOSYSTEM) {
          updatedPackageJson.devDependencies[dep] = RN_ECOSYSTEM[dep];
          stats.updated++;
          stats.total++;
        }
        
        // Replace deprecated Babel plugins
        if (dep in BABEL_REPLACEMENTS) {
          const newDep = BABEL_REPLACEMENTS[dep];
          delete updatedPackageJson.devDependencies[dep];
          updatedPackageJson.devDependencies[newDep] = '^1.0.0'; // Use latest version
          stats.replaced++;
          stats.total++;
        }
        
        // Update vulnerable packages
        if (dep in VULNERABLE_PACKAGES) {
          updatedPackageJson.devDependencies[dep] = VULNERABLE_PACKAGES[dep];
          stats.vulnerable++;
          stats.total++;
        }
      }
    }
    
    // Add resolutions to root package.json
    if (filePath.endsWith('/package.json') || filePath.endsWith('\\package.json')) {
      // Check if this is a root package.json (has workspaces)
      if (packageJson.workspaces) {
        if (!updatedPackageJson.resolutions) {
          updatedPackageJson.resolutions = {};
        }
        
        // Add all resolutions
        for (const [dep, version] of Object.entries(RESOLUTIONS)) {
          if (!updatedPackageJson.resolutions[dep] || updatedPackageJson.resolutions[dep] !== version) {
            updatedPackageJson.resolutions[dep] = version;
            stats.total++;
          }
        }
        
        logVerbose('  Added resolutions to root package.json');
      }
    }
    
    // Add missing internal packages for journey-specific projects
    if (journeyType) {
      // Ensure dependencies exists
      if (!updatedPackageJson.dependencies) {
        updatedPackageJson.dependencies = {};
      }
      
      // Add journey-specific packages
      const journeyPackages = Object.entries(JOURNEY_PACKAGES)
        .filter(([key]) => key.includes(journeyType));
      
      for (const [dep, version] of journeyPackages) {
        if (!updatedPackageJson.dependencies[dep]) {
          updatedPackageJson.dependencies[dep] = version;
          stats.journey++;
          stats.total++;
          logVerbose(`  Added journey package: ${dep}@${version}`);
        }
      }
      
      // Add shared packages for all journeys
      if (!updatedPackageJson.dependencies['@austa/interfaces']) {
        updatedPackageJson.dependencies['@austa/interfaces'] = CORE_VERSIONS['@austa/interfaces'];
        stats.total++;
      }
      
      if (!updatedPackageJson.dependencies['@austa/journey-context']) {
        updatedPackageJson.dependencies['@austa/journey-context'] = CORE_VERSIONS['@austa/journey-context'];
        stats.total++;
      }
    }
    
    // Write updated package.json if changes were made and not in check-only mode
    if (stats.total > 0 && FIX) {
      fs.writeFileSync(filePath, JSON.stringify(updatedPackageJson, null, 2) + '\n');
      log(`Updated ${filePath} (${stats.total} changes)`, COLORS.green);
    } else if (stats.total > 0) {
      log(`Would update ${filePath} (${stats.total} changes)`, COLORS.yellow);
    } else {
      logVerbose(`No changes needed for ${filePath}`);
    }
    
    return stats;
  } catch (error) {
    log(`Error processing ${filePath}: ${error.message}`, COLORS.red);
    return stats;
  }
}

/**
 * Main function to run the script
 */
function main() {
  log('\n🔍 AUSTA SuperApp Dependency Fixer', COLORS.magenta);
  log(`Mode: ${CHECK_ONLY ? 'Check only' : 'Fix'} ${VERBOSE ? '(verbose)' : ''}\n`);
  
  // Find all package.json files
  log('Finding package.json files...', COLORS.blue);
  const packageJsonFiles = findPackageJsonFiles();
  log(`Found ${packageJsonFiles.length} package.json files\n`);
  
  // Process each package.json file
  let totalStats = {
    updated: 0,
    replaced: 0,
    vulnerable: 0,
    journey: 0,
    total: 0,
    files: 0
  };
  
  for (const filePath of packageJsonFiles) {
    const stats = updateDependencies(filePath);
    
    // Update total stats
    totalStats.updated += stats.updated;
    totalStats.replaced += stats.replaced;
    totalStats.vulnerable += stats.vulnerable;
    totalStats.journey += stats.journey;
    totalStats.total += stats.total;
    
    if (stats.total > 0) {
      totalStats.files++;
    }
  }
  
  // Print summary
  log('\n📊 Summary:', COLORS.blue);
  log(`Files processed: ${packageJsonFiles.length}`);
  log(`Files with changes: ${totalStats.files}`);
  log(`Total changes: ${totalStats.total}`);
  log(`  - Core versions updated: ${totalStats.updated}`);
  log(`  - Deprecated plugins replaced: ${totalStats.replaced}`);
  log(`  - Vulnerable packages updated: ${totalStats.vulnerable}`);
  log(`  - Journey-specific packages added: ${totalStats.journey}`);
  
  if (CHECK_ONLY && totalStats.total > 0) {
    log('\n⚠️  Issues found! Run with --fix to apply changes.', COLORS.yellow);
    process.exit(1);
  } else if (totalStats.total > 0) {
    log('\n✅ Dependencies fixed successfully!', COLORS.green);
  } else {
    log('\n✅ All dependencies are already up to date!', COLORS.green);
  }
}

// Run the script
main();