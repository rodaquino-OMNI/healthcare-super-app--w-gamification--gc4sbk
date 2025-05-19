#!/usr/bin/env node

/**
 * This script validates package.json files to enforce dependency hygiene:
 * - Ensures core dependencies match standard versions
 * - Detects security vulnerabilities and bad practice patterns
 * - Validates cross-journey dependencies for compatibility
 * - Prevents nested package paths (like @hookform/resolvers/yup)
 * - Checks for missing required fields
 * - Ensures consistent dependency versions across the monorepo
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const semver = require('semver');

// Standard versions for core dependencies based on technical specification
const standardVersions = {
  // Backend Core
  'nestjs': '10.3.0',
  '@nestjs/core': '10.3.0',
  '@nestjs/common': '10.3.0',
  'express': '4.18.2',
  'graphql': '16.9.0',
  'socket.io': '4.7.4',
  'prisma': '5.10.2',
  '@prisma/client': '5.10.2',
  'typeorm': '0.3.20',
  'kafkajs': '2.2.4',
  'ioredis': '5.3.2',
  '@opentelemetry/sdk-node': '1.4.1',
  'class-validator': '0.14.1',
  'class-transformer': '0.5.1',
  
  // Frontend Web
  'next': '14.2.0',
  'react': '18.2.0',
  'react-dom': '18.2.0',
  
  // Frontend Mobile
  'react-native': '0.73.4',
  'react-native-reanimated': '3.3.0',
  'react-native-gesture-handler': '2.12.0',
  'react-native-svg': '13.10.0',
  
  // UI & Design
  'styled-components': '6.1.8',
  '@mui/material': '5.15.12',
  'framer-motion': '11.0.8',
  '@design-system/primitives': '1.0.0',
  '@austa/design-system': '1.0.0',
  
  // State Management & Data Fetching
  '@reduxjs/toolkit': '2.1.0',
  '@tanstack/react-query': '5.25.0',
  '@apollo/client': '3.8.10',
  '@austa/journey-context': '1.0.0',
  
  // Forms & Validation
  'react-hook-form': '7.51.0',
  'yup': '1.3.3',
  'zod': '3.22.4',
  'joi': '17.12.2',
  
  // Utilities & Tools
  'i18next': '23.8.2',
  'date-fns': '3.3.1',
  'victory': '36.6.12',
  'recharts': '2.12.2',
  '@austa/interfaces': '1.0.0',
  
  // Frontend Core Dependencies
  'axios': '1.6.8',
  'react-router-dom': '6.21.1',
  
  // TypeScript
  'typescript': '5.3.3'
};

// Known vulnerable versions that should be avoided
const vulnerableVersions = {
  'minimatch': ['<3.0.5'], // ReDos vulnerability
  'semver': ['<7.5.2'],    // ReDoS vulnerability
  'ws': ['<7.4.6'],        // Denial of Service vulnerability
  'node-fetch': ['<2.6.7'], // Exposure of Sensitive Information
  'json-schema': ['<0.4.0'], // Prototype Pollution
  'lodash': ['<4.17.21'],   // Prototype Pollution
  'glob-parent': ['<5.1.2'], // ReDoS vulnerability
};

// Required internal packages for journey compatibility
const requiredInternalPackages = [
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context'
];

// Journey-specific packages that should be compatible
const journeyPackages = {
  'health': ['@austa/health-interfaces', '@austa/health-context'],
  'care': ['@austa/care-interfaces', '@austa/care-context'],
  'plan': ['@austa/plan-interfaces', '@austa/plan-context']
};

// Find all package.json files
const packageFiles = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

console.log(`Validating ${packageFiles.length} package.json files...`);

let errors = 0;
let warnings = 0;
const allDependencies = new Map(); // Track all dependencies for cross-package validation

// Validate each file
packageFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    const packageName = json.name || path.dirname(filePath);
    
    console.log(`\nValidating ${packageName} (${filePath})`);
    
    // Track dependencies for this package
    const deps = { ...json.dependencies, ...json.devDependencies, ...json.peerDependencies };
    allDependencies.set(packageName, { path: filePath, deps });
    
    // Check for required fields
    const requiredFields = ['name', 'version'];
    const missingFields = requiredFields.filter(field => !json[field]);
    if (missingFields.length > 0) {
      console.error(`  \u274c Missing required fields in ${filePath}: ${missingFields.join(', ')}`);
      errors++;
    }
    
    // Check for invalid nested package paths
    const dependencyErrors = validateDependencyNames(json.dependencies || {});
    const devDependencyErrors = validateDependencyNames(json.devDependencies || {});
    const peerDependencyErrors = validateDependencyNames(json.peerDependencies || {});
    
    if (dependencyErrors.length > 0 || devDependencyErrors.length > 0 || peerDependencyErrors.length > 0) {
      console.error(`  \u274c Invalid package names in ${filePath}:`);
      
      if (dependencyErrors.length > 0) {
        console.error('    Dependencies:');
        dependencyErrors.forEach(err => console.error(`    - ${err}`));
      }
      
      if (devDependencyErrors.length > 0) {
        console.error('    DevDependencies:');
        devDependencyErrors.forEach(err => console.error(`    - ${err}`));
      }
      
      if (peerDependencyErrors.length > 0) {
        console.error('    PeerDependencies:');
        peerDependencyErrors.forEach(err => console.error(`    - ${err}`));
      }
      
      errors++;
    }
    
    // Check for standard version compliance
    const versionErrors = validateVersions(json.dependencies || {}, 'dependency');
    const devVersionErrors = validateVersions(json.devDependencies || {}, 'devDependency');
    const peerVersionErrors = validateVersions(json.peerDependencies || {}, 'peerDependency');
    
    if (versionErrors.length > 0 || devVersionErrors.length > 0 || peerVersionErrors.length > 0) {
      console.error(`  \u274c Version mismatches in ${filePath}:`);
      
      [...versionErrors, ...devVersionErrors, ...peerVersionErrors].forEach(err => {
        console.error(`    - ${err}`);
      });
      
      errors++;
    }
    
    // Check for vulnerable versions
    const vulnerabilityErrors = checkVulnerabilities(json.dependencies || {}, 'dependency');
    const devVulnerabilityErrors = checkVulnerabilities(json.devDependencies || {}, 'devDependency');
    const peerVulnerabilityErrors = checkVulnerabilities(json.peerDependencies || {}, 'peerDependency');
    
    if (vulnerabilityErrors.length > 0 || devVulnerabilityErrors.length > 0 || peerVulnerabilityErrors.length > 0) {
      console.error(`  \u274c Vulnerable dependencies in ${filePath}:`);
      
      [...vulnerabilityErrors, ...devVulnerabilityErrors, ...peerVulnerabilityErrors].forEach(err => {
        console.error(`    - ${err}`);
      });
      
      errors++;
    }
    
    // Check for required internal packages in frontend applications
    if (filePath.includes('/web/') || filePath.includes('/mobile/')) {
      const missingInternalPackages = checkRequiredInternalPackages(json.dependencies || {});
      if (missingInternalPackages.length > 0) {
        console.warn(`  \u26A0 Missing required internal packages in ${filePath}:`);
        missingInternalPackages.forEach(pkg => console.warn(`    - ${pkg}`));
        warnings++;
      }
    }
    
    // Check for React version consistency in the root package.json
    if (filePath === 'src/web/package.json') {
      if (!json.resolutions || !json.resolutions.react) {
        console.error(`  \u274c Missing React resolutions in root package.json`);
        errors++;
      } else if (json.resolutions.react !== standardVersions.react) {
        console.error(`  \u274c React resolution version mismatch: ${json.resolutions.react} (should be ${standardVersions.react})`);
        errors++;
      }
    }
    
    // Check for journey-specific package compatibility
    const journeyCompatibilityErrors = checkJourneyCompatibility(json.dependencies || {});
    if (journeyCompatibilityErrors.length > 0) {
      console.error(`  \u274c Journey compatibility issues in ${filePath}:`);
      journeyCompatibilityErrors.forEach(err => console.error(`    - ${err}`));
      errors++;
    }
    
  } catch (error) {
    console.error(`  \u274c Error processing ${filePath}: ${error.message}`);
    errors++;
  }
});

// Cross-package validation for version consistency
validateCrossPackageVersions(allDependencies);

if (errors > 0 || warnings > 0) {
  if (errors > 0) {
    console.error(`\n\u274c Found ${errors} errors in package.json files`);
  }
  if (warnings > 0) {
    console.warn(`\n\u26A0 Found ${warnings} warnings in package.json files`);
  }
  console.error(`Please review the documentation at docs/package-manager-standardization.md`);
  
  if (errors > 0) {
    process.exit(1);
  }
} else {
  console.log(`\n\u2705 All package.json files are valid!`);
}

/**
 * Validates dependency names to ensure they don't use nested paths
 * @param {Object} dependencies - Object of dependencies
 * @returns {Array} - Array of error messages
 */
function validateDependencyNames(dependencies) {
  const errors = [];
  
  for (const [name, version] of Object.entries(dependencies)) {
    // Check for nested paths with more than two segments
    const segments = name.split('/');
    if (segments.length > 2) {
      errors.push(`"${name}" uses nested paths. Import the base package instead.`);
    }
    
    // Check for 'latest' version
    if (version === 'latest') {
      errors.push(`"${name}" uses 'latest' version. Specify a version range instead.`);
    }
    
    // Check for wildcard versions
    if (version === '*' || version === 'x' || version.endsWith('.*') || version.endsWith('.x')) {
      errors.push(`"${name}" uses wildcard version "${version}". Specify an exact version instead.`);
    }
  }
  
  return errors;
}

/**
 * Validates dependency versions against standard versions
 * @param {Object} dependencies - Object of dependencies
 * @param {string} type - Type of dependency (dependency, devDependency, peerDependency)
 * @returns {Array} - Array of error messages
 */
function validateVersions(dependencies, type) {
  const errors = [];
  
  for (const [name, version] of Object.entries(dependencies)) {
    // Skip checking for workspace references
    if (version.startsWith('workspace:')) {
      continue;
    }
    
    // Check if this is a standard package we should validate
    const basePackageName = name.split('/')[0];
    const packageToCheck = standardVersions[name] ? name : 
                          standardVersions[basePackageName] ? basePackageName : null;
    
    if (packageToCheck) {
      const standardVersion = standardVersions[packageToCheck];
      
      // Clean the version string (remove ^, ~, etc.)
      const cleanVersion = version.replace(/^[\^~]/, '');
      
      // If it's not an exact match and not a workspace reference
      if (cleanVersion !== standardVersion && !version.startsWith('workspace:')) {
        // For exact versions, require exact match
        if (!version.startsWith('^') && !version.startsWith('~')) {
          errors.push(`${name} ${type} version ${version} should be exactly ${standardVersion}`);
        } 
        // For semver ranges, check compatibility
        else if (!semver.satisfies(standardVersion, version)) {
          errors.push(`${name} ${type} version ${version} is not compatible with standard version ${standardVersion}`);
        }
      }
    }
  }
  
  return errors;
}

/**
 * Checks for known vulnerable versions
 * @param {Object} dependencies - Object of dependencies
 * @param {string} type - Type of dependency
 * @returns {Array} - Array of error messages
 */
function checkVulnerabilities(dependencies, type) {
  const errors = [];
  
  for (const [name, version] of Object.entries(dependencies)) {
    // Skip checking for workspace references
    if (version.startsWith('workspace:')) {
      continue;
    }
    
    // Check if this package has known vulnerabilities
    if (vulnerableVersions[name]) {
      const cleanVersion = version.replace(/^[\^~]/, '');
      
      for (const vulnerableRange of vulnerableVersions[name]) {
        if (semver.satisfies(cleanVersion, vulnerableRange)) {
          errors.push(`${name} ${type} version ${version} has a known vulnerability. Please upgrade.`);
          break;
        }
      }
    }
  }
  
  return errors;
}

/**
 * Checks for required internal packages
 * @param {Object} dependencies - Object of dependencies
 * @returns {Array} - Array of missing packages
 */
function checkRequiredInternalPackages(dependencies) {
  return requiredInternalPackages.filter(pkg => !dependencies[pkg]);
}

/**
 * Checks for journey compatibility issues
 * @param {Object} dependencies - Object of dependencies
 * @returns {Array} - Array of error messages
 */
function checkJourneyCompatibility(dependencies) {
  const errors = [];
  const journeysUsed = new Set();
  
  // Determine which journeys are being used
  for (const [journey, packages] of Object.entries(journeyPackages)) {
    for (const pkg of packages) {
      if (dependencies[pkg]) {
        journeysUsed.add(journey);
        break;
      }
    }
  }
  
  // If multiple journeys are used, ensure @austa/journey-context is included
  if (journeysUsed.size > 1 && !dependencies['@austa/journey-context']) {
    errors.push(`Multiple journeys used (${Array.from(journeysUsed).join(', ')}) but @austa/journey-context is missing`);
  }
  
  return errors;
}

/**
 * Validates version consistency across packages
 * @param {Map} allDependencies - Map of all dependencies
 */
function validateCrossPackageVersions(allDependencies) {
  const dependencyVersions = new Map(); // Map of dependency name to versions used
  
  // Collect all versions of each dependency
  for (const [packageName, { path: packagePath, deps }] of allDependencies) {
    for (const [depName, depVersion] of Object.entries(deps)) {
      // Skip workspace references
      if (depVersion.startsWith('workspace:')) {
        continue;
      }
      
      if (!dependencyVersions.has(depName)) {
        dependencyVersions.set(depName, new Map());
      }
      
      const versions = dependencyVersions.get(depName);
      versions.set(packageName, { version: depVersion, path: packagePath });
    }
  }
  
  // Check for inconsistent versions
  let inconsistentVersions = false;
  for (const [depName, packages] of dependencyVersions) {
    // Skip checking if only one package uses this dependency
    if (packages.size <= 1) {
      continue;
    }
    
    // Skip checking for internal packages that might have different versions
    if (depName.startsWith('@austa/') || depName.startsWith('@design-system/')) {
      continue;
    }
    
    // Get all unique versions
    const uniqueVersions = new Set();
    for (const { version } of packages.values()) {
      // Normalize version strings for comparison (remove ^, ~, etc.)
      const normalizedVersion = version.replace(/^[\^~]/, '');
      uniqueVersions.add(normalizedVersion);
    }
    
    // If there are multiple versions, report the issue
    if (uniqueVersions.size > 1) {
      if (!inconsistentVersions) {
        console.error('\n\u274c Inconsistent dependency versions across packages:');
        inconsistentVersions = true;
      }
      
      console.error(`  ${depName} has ${uniqueVersions.size} different versions:`);
      for (const [packageName, { version, path }] of packages) {
        console.error(`    - ${packageName} (${path}): ${version}`);
      }
      
      errors++;
    }
  }
}