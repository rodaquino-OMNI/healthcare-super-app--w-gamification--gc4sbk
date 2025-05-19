#!/usr/bin/env node

/**
 * AUSTA SuperApp Security Vulnerability Fixer
 * 
 * This script automates the discovery and in-place remediation of known security
 * vulnerabilities in npm dependencies across the entire project. It traverses the
 * project finding package.json files, updates critical dependencies to secure versions,
 * and focuses on fixing security issues in both direct and transitive dependencies
 * while preserving the overall dependency structure.
 *
 * Usage:
 *   node scripts/fix-security-vulnerabilities.js [options]
 *
 * Options:
 *   --scan       Scan for vulnerabilities without fixing (default)
 *   --fix        Fix vulnerabilities automatically
 *   --report     Generate a detailed report of vulnerabilities
 *   --verbose    Show detailed output
 *   --help       Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Configuration
const CONFIG = {
  // Root directories to scan
  rootDirs: ['src/backend', 'src/web'],
  
  // Directories to exclude from scanning
  excludeDirs: ['node_modules', '.git', 'dist', 'build', 'coverage'],
  
  // Standard versions for core dependencies
  standardVersions: {
    // React ecosystem
    'react': '18.2.0',
    'react-dom': '18.2.0',
    'react-native': '0.73.4',
    
    // Build tools
    'typescript': '5.3.3',
    'next': '14.2.0',
    'expo': 'latest',
    
    // Backend frameworks
    'nestjs/core': '10.3.0',
    'nestjs/common': '10.3.0',
    'express': '4.18.2',
    
    // Database
    'prisma': '5.10.2',
    'typeorm': '0.3.20',
    
    // UI libraries
    'styled-components': '6.1.8',
    'material-ui/core': '5.15.12',
    'framer-motion': '11.0.8',
    
    // State management
    'redux-toolkit': '2.1.0',
    'tanstack/react-query': '5.25.0',
    'apollo/client': '3.8.10',
    
    // Internal packages
    '@austa/design-system': '1.0.0',
    '@design-system/primitives': '1.0.0',
    '@austa/interfaces': '1.0.0',
    '@austa/journey-context': '1.0.0',
  },
  
  // Known vulnerable packages and their safe versions
  vulnerablePackages: {
    'minimatch': '^5.1.2',  // CVE-2022-3517
    'semver': '^7.5.2',     // CVE-2022-25883
    'ws': '^8.11.0',        // CVE-2023-26115
    'glob-parent': '^6.0.2', // CVE-2020-28469
    'node-fetch': '^2.6.7', // CVE-2022-0235
    'json5': '^2.2.3',      // CVE-2022-46175
    'axios': '^1.6.0',      // CVE-2023-45857
    'lodash': '^4.17.21',   // CVE-2021-23337
    'moment': '^2.29.4',    // CVE-2022-31129
    'terser': '^5.14.2',    // CVE-2022-25858
    'decode-uri-component': '^0.2.1', // CVE-2022-38900
    'postcss': '^8.4.31',   // CVE-2023-44270
    'word-wrap': '^1.2.4',  // CVE-2023-26115
  },
  
  // Packages that need special handling in monorepo configurations
  monorepoSpecialCases: {
    'react-native-reanimated': '3.3.0',
    'react-native-gesture-handler': '2.12.0',
    'react-native-svg': '13.10.0',
    'react-hook-form': '7.51.0',
    'yup': '1.3.3',
    'zod': '3.22.4',
    'joi': '17.12.2',
    'i18next': '23.8.2',
    'date-fns': '3.3.1',
  }
};

// Global state
const state = {
  mode: 'scan',  // Default mode
  verbose: false,
  packagesScanned: 0,
  vulnerabilitiesFound: 0,
  vulnerabilitiesFixed: 0,
  packageJsonFiles: [],
  vulnerabilityReport: [],
};

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    showHelp();
    process.exit(0);
  }
  
  if (args.includes('--fix')) {
    state.mode = 'fix';
  } else if (args.includes('--report')) {
    state.mode = 'report';
  }
  
  if (args.includes('--verbose')) {
    state.verbose = true;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.bright}AUSTA SuperApp Security Vulnerability Fixer${colors.reset}

This script automates the discovery and in-place remediation of known security
vulnerabilities in npm dependencies across the entire project.

${colors.bright}Usage:${colors.reset}
  node scripts/fix-security-vulnerabilities.js [options]

${colors.bright}Options:${colors.reset}
  --scan       Scan for vulnerabilities without fixing (default)
  --fix        Fix vulnerabilities automatically
  --report     Generate a detailed report of vulnerabilities
  --verbose    Show detailed output
  --help       Show this help message
  `);
}

/**
 * Find all package.json files in the project
 * @param {string} dir - Directory to start searching from
 * @returns {string[]} - Array of package.json file paths
 */
function findPackageJsonFiles(dir) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    // Check if this directory has a package.json file
    if (files.includes('package.json')) {
      results.push(path.join(dir, 'package.json'));
    }
    
    // Recursively search subdirectories
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !CONFIG.excludeDirs.includes(file)) {
        results.push(...findPackageJsonFiles(filePath));
      }
    }
  } catch (error) {
    if (state.verbose) {
      console.error(`${colors.red}Error scanning directory ${dir}:${colors.reset}`, error.message);
    }
  }
  
  return results;
}

/**
 * Read and parse a package.json file
 * @param {string} filePath - Path to package.json file
 * @returns {Object|null} - Parsed package.json or null if error
 */
function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error reading ${filePath}:${colors.reset}`, error.message);
    return null;
  }
}

/**
 * Write updated package.json file
 * @param {string} filePath - Path to package.json file
 * @param {Object} packageJson - Updated package.json object
 * @returns {boolean} - Success status
 */
function writePackageJson(filePath, packageJson) {
  try {
    const content = JSON.stringify(packageJson, null, 2);
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error writing ${filePath}:${colors.reset}`, error.message);
    return false;
  }
}

/**
 * Check if a package version is vulnerable
 * @param {string} packageName - Package name
 * @param {string} version - Package version
 * @returns {boolean} - True if vulnerable
 */
function isVulnerableVersion(packageName, version) {
  // Skip checking for non-vulnerable packages
  if (!CONFIG.vulnerablePackages[packageName]) {
    return false;
  }
  
  // Handle version ranges and special cases
  const safeVersion = CONFIG.vulnerablePackages[packageName];
  
  // Simple version comparison (could be enhanced with semver library)
  if (version.startsWith('^') || version.startsWith('~')) {
    version = version.substring(1);
  }
  
  const safeVersionNum = safeVersion.startsWith('^') || safeVersion.startsWith('~') 
    ? safeVersion.substring(1) 
    : safeVersion;
  
  // Compare major.minor.patch versions
  const versionParts = version.split('.');
  const safeVersionParts = safeVersionNum.split('.');
  
  for (let i = 0; i < Math.min(versionParts.length, safeVersionParts.length); i++) {
    const vPart = parseInt(versionParts[i], 10);
    const svPart = parseInt(safeVersionParts[i], 10);
    
    if (vPart < svPart) {
      return true; // Vulnerable - older than safe version
    } else if (vPart > svPart) {
      return false; // Newer than safe version
    }
    // If equal, continue to next version part
  }
  
  // If we get here, versions are equal up to the compared parts
  return versionParts.length < safeVersionParts.length;
}

/**
 * Check if a package should use a standardized version
 * @param {string} packageName - Package name
 * @returns {string|null} - Standardized version or null
 */
function getStandardVersion(packageName) {
  // Handle scoped packages
  if (packageName.startsWith('@')) {
    const parts = packageName.split('/');
    const scope = parts[0];
    const name = parts[1];
    
    // Check for exact match
    if (CONFIG.standardVersions[packageName]) {
      return CONFIG.standardVersions[packageName];
    }
    
    // Check for scope/name match
    for (const [key, version] of Object.entries(CONFIG.standardVersions)) {
      if (key.includes('/') && key.split('/')[1] === name) {
        return version;
      }
    }
  } else {
    // Direct lookup for non-scoped packages
    return CONFIG.standardVersions[packageName] || null;
  }
  
  return null;
}

/**
 * Scan a package.json file for vulnerabilities
 * @param {string} filePath - Path to package.json file
 * @param {Object} packageJson - Parsed package.json
 * @returns {Object} - Vulnerability report
 */
function scanForVulnerabilities(filePath, packageJson) {
  const vulnerabilities = {
    direct: [],
    dev: [],
    peer: [],
    standardVersionMismatches: [],
    monorepoIssues: [],
  };
  
  // Helper function to check dependencies
  const checkDeps = (deps, type) => {
    if (!deps) return;
    
    for (const [name, version] of Object.entries(deps)) {
      // Check for vulnerable versions
      if (CONFIG.vulnerablePackages[name] && isVulnerableVersion(name, version)) {
        vulnerabilities[type].push({
          name,
          currentVersion: version,
          safeVersion: CONFIG.vulnerablePackages[name],
        });
        state.vulnerabilitiesFound++;
      }
      
      // Check for standard version mismatches
      const standardVersion = getStandardVersion(name);
      if (standardVersion && version !== standardVersion) {
        vulnerabilities.standardVersionMismatches.push({
          name,
          currentVersion: version,
          standardVersion,
        });
      }
      
      // Check for monorepo special cases
      if (CONFIG.monorepoSpecialCases[name] && version !== CONFIG.monorepoSpecialCases[name]) {
        vulnerabilities.monorepoIssues.push({
          name,
          currentVersion: version,
          recommendedVersion: CONFIG.monorepoSpecialCases[name],
        });
      }
    }
  };
  
  // Check all dependency types
  checkDeps(packageJson.dependencies, 'direct');
  checkDeps(packageJson.devDependencies, 'dev');
  checkDeps(packageJson.peerDependencies, 'peer');
  
  // Check for missing internal packages
  const internalPackages = [
    '@austa/design-system',
    '@design-system/primitives',
    '@austa/interfaces',
    '@austa/journey-context'
  ];
  
  // Only check for missing internal packages in web and mobile packages
  if (filePath.includes('/web/') || filePath.includes('/mobile/')) {
    for (const pkg of internalPackages) {
      const deps = packageJson.dependencies || {};
      if (!deps[pkg] && !filePath.includes(pkg.replace('@', '').replace('/', '-'))) {
        vulnerabilities.monorepoIssues.push({
          name: pkg,
          issue: 'Missing internal package dependency',
          recommendedVersion: CONFIG.standardVersions[pkg] || '1.0.0',
        });
      }
    }
  }
  
  return vulnerabilities;
}

/**
 * Fix vulnerabilities in a package.json file
 * @param {string} filePath - Path to package.json file
 * @param {Object} packageJson - Parsed package.json
 * @param {Object} vulnerabilities - Vulnerability report
 * @returns {Object} - Updated package.json and fix report
 */
function fixVulnerabilities(filePath, packageJson, vulnerabilities) {
  const fixReport = {
    fixed: [],
    standardized: [],
    monorepoFixed: [],
  };
  
  let modified = false;
  
  // Helper function to update dependencies
  const updateDeps = (depsObj, vulnerableList, type) => {
    if (!depsObj) return false;
    let depsModified = false;
    
    for (const vuln of vulnerableList) {
      if (depsObj[vuln.name]) {
        const oldVersion = depsObj[vuln.name];
        depsObj[vuln.name] = vuln.safeVersion;
        fixReport.fixed.push({
          name: vuln.name,
          type,
          oldVersion,
          newVersion: vuln.safeVersion,
        });
        depsModified = true;
        state.vulnerabilitiesFixed++;
      }
    }
    
    return depsModified;
  };
  
  // Fix direct vulnerabilities
  if (updateDeps(packageJson.dependencies, vulnerabilities.direct, 'direct')) {
    modified = true;
  }
  
  // Fix dev vulnerabilities
  if (updateDeps(packageJson.devDependencies, vulnerabilities.dev, 'dev')) {
    modified = true;
  }
  
  // Fix peer vulnerabilities
  if (updateDeps(packageJson.peerDependencies, vulnerabilities.peer, 'peer')) {
    modified = true;
  }
  
  // Standardize versions
  for (const mismatch of vulnerabilities.standardVersionMismatches) {
    const types = ['dependencies', 'devDependencies', 'peerDependencies'];
    
    for (const type of types) {
      if (packageJson[type] && packageJson[type][mismatch.name]) {
        const oldVersion = packageJson[type][mismatch.name];
        packageJson[type][mismatch.name] = mismatch.standardVersion;
        fixReport.standardized.push({
          name: mismatch.name,
          type,
          oldVersion,
          newVersion: mismatch.standardVersion,
        });
        modified = true;
      }
    }
  }
  
  // Fix monorepo issues
  for (const issue of vulnerabilities.monorepoIssues) {
    // Handle missing internal packages
    if (issue.issue === 'Missing internal package dependency') {
      if (!packageJson.dependencies) {
        packageJson.dependencies = {};
      }
      
      packageJson.dependencies[issue.name] = issue.recommendedVersion;
      fixReport.monorepoFixed.push({
        name: issue.name,
        action: 'Added missing dependency',
        version: issue.recommendedVersion,
      });
      modified = true;
      continue;
    }
    
    // Handle version mismatches
    const types = ['dependencies', 'devDependencies', 'peerDependencies'];
    
    for (const type of types) {
      if (packageJson[type] && packageJson[type][issue.name]) {
        const oldVersion = packageJson[type][issue.name];
        packageJson[type][issue.name] = issue.recommendedVersion;
        fixReport.monorepoFixed.push({
          name: issue.name,
          type,
          oldVersion,
          newVersion: issue.recommendedVersion,
        });
        modified = true;
      }
    }
  }
  
  // Add or update overrides/resolutions section for transitive dependencies
  // This handles both npm (overrides) and yarn (resolutions) workspaces
  const allVulnerablePackages = { ...CONFIG.vulnerablePackages };
  
  if (Object.keys(allVulnerablePackages).length > 0) {
    // For npm
    if (!packageJson.overrides) {
      packageJson.overrides = {};
    }
    
    // For yarn
    if (!packageJson.resolutions) {
      packageJson.resolutions = {};
    }
    
    for (const [name, version] of Object.entries(allVulnerablePackages)) {
      packageJson.overrides[name] = version;
      packageJson.resolutions[name] = version;
      modified = true;
    }
  }
  
  return { packageJson, fixReport, modified };
}

/**
 * Display vulnerability report for a package
 * @param {string} filePath - Path to package.json file
 * @param {Object} vulnerabilities - Vulnerability report
 */
function displayVulnerabilityReport(filePath, vulnerabilities) {
  const relativePath = path.relative(process.cwd(), filePath);
  const hasVulnerabilities = (
    vulnerabilities.direct.length > 0 ||
    vulnerabilities.dev.length > 0 ||
    vulnerabilities.peer.length > 0
  );
  
  const hasStandardMismatches = vulnerabilities.standardVersionMismatches.length > 0;
  const hasMonorepoIssues = vulnerabilities.monorepoIssues.length > 0;
  
  if (!hasVulnerabilities && !hasStandardMismatches && !hasMonorepoIssues) {
    if (state.verbose) {
      console.log(`${colors.green}✓${colors.reset} ${relativePath} - No issues found`);
    }
    return;
  }
  
  console.log(`\n${colors.bright}${relativePath}${colors.reset}`);
  
  // Display security vulnerabilities
  if (hasVulnerabilities) {
    console.log(`${colors.red}Security vulnerabilities:${colors.reset}`);
    
    const displayVulns = (vulns, type) => {
      if (vulns.length === 0) return;
      
      console.log(`  ${colors.yellow}${type} dependencies:${colors.reset}`);
      for (const vuln of vulns) {
        console.log(`    ${colors.red}•${colors.reset} ${vuln.name}: ${vuln.currentVersion} → ${colors.green}${vuln.safeVersion}${colors.reset}`);
      }
    };
    
    displayVulns(vulnerabilities.direct, 'Direct');
    displayVulns(vulnerabilities.dev, 'Dev');
    displayVulns(vulnerabilities.peer, 'Peer');
  }
  
  // Display standard version mismatches
  if (hasStandardMismatches) {
    console.log(`${colors.yellow}Standard version mismatches:${colors.reset}`);
    for (const mismatch of vulnerabilities.standardVersionMismatches) {
      console.log(`  ${colors.yellow}•${colors.reset} ${mismatch.name}: ${mismatch.currentVersion} → ${colors.green}${mismatch.standardVersion}${colors.reset}`);
    }
  }
  
  // Display monorepo issues
  if (hasMonorepoIssues) {
    console.log(`${colors.magenta}Monorepo configuration issues:${colors.reset}`);
    for (const issue of vulnerabilities.monorepoIssues) {
      if (issue.issue === 'Missing internal package dependency') {
        console.log(`  ${colors.magenta}•${colors.reset} ${issue.name}: Missing dependency, should add ${colors.green}${issue.recommendedVersion}${colors.reset}`);
      } else {
        console.log(`  ${colors.magenta}•${colors.reset} ${issue.name}: ${issue.currentVersion} → ${colors.green}${issue.recommendedVersion}${colors.reset}`);
      }
    }
  }
}

/**
 * Display fix report for a package
 * @param {string} filePath - Path to package.json file
 * @param {Object} fixReport - Fix report
 */
function displayFixReport(filePath, fixReport) {
  const relativePath = path.relative(process.cwd(), filePath);
  const hasChanges = (
    fixReport.fixed.length > 0 ||
    fixReport.standardized.length > 0 ||
    fixReport.monorepoFixed.length > 0
  );
  
  if (!hasChanges) {
    if (state.verbose) {
      console.log(`${colors.green}✓${colors.reset} ${relativePath} - No changes needed`);
    }
    return;
  }
  
  console.log(`\n${colors.bright}${relativePath}${colors.reset}`);
  
  // Display fixed vulnerabilities
  if (fixReport.fixed.length > 0) {
    console.log(`${colors.green}Fixed security vulnerabilities:${colors.reset}`);
    for (const fix of fixReport.fixed) {
      console.log(`  ${colors.green}•${colors.reset} ${fix.name} (${fix.type}): ${fix.oldVersion} → ${colors.green}${fix.newVersion}${colors.reset}`);
    }
  }
  
  // Display standardized versions
  if (fixReport.standardized.length > 0) {
    console.log(`${colors.blue}Standardized versions:${colors.reset}`);
    for (const std of fixReport.standardized) {
      console.log(`  ${colors.blue}•${colors.reset} ${std.name} (${std.type}): ${std.oldVersion} → ${colors.green}${std.newVersion}${colors.reset}`);
    }
  }
  
  // Display monorepo fixes
  if (fixReport.monorepoFixed.length > 0) {
    console.log(`${colors.magenta}Fixed monorepo issues:${colors.reset}`);
    for (const fix of fixReport.monorepoFixed) {
      if (fix.action === 'Added missing dependency') {
        console.log(`  ${colors.magenta}•${colors.reset} ${fix.name}: Added missing dependency with version ${colors.green}${fix.version}${colors.reset}`);
      } else {
        console.log(`  ${colors.magenta}•${colors.reset} ${fix.name} (${fix.type}): ${fix.oldVersion} → ${colors.green}${fix.newVersion}${colors.reset}`);
      }
    }
  }
}

/**
 * Generate a detailed vulnerability report
 */
function generateDetailedReport() {
  console.log(`\n${colors.bright}${colors.cyan}=== AUSTA SuperApp Security Vulnerability Report ===${colors.reset}\n`);
  console.log(`${colors.cyan}Scanned ${state.packagesScanned} package.json files${colors.reset}`);
  console.log(`${colors.cyan}Found ${state.vulnerabilitiesFound} security vulnerabilities${colors.reset}`);
  
  if (state.mode === 'fix') {
    console.log(`${colors.green}Fixed ${state.vulnerabilitiesFixed} security vulnerabilities${colors.reset}`);
  }
  
  // Group vulnerabilities by package name
  const vulnerabilitiesByPackage = {};
  
  for (const report of state.vulnerabilityReport) {
    for (const type of ['direct', 'dev', 'peer']) {
      for (const vuln of report.vulnerabilities[type]) {
        if (!vulnerabilitiesByPackage[vuln.name]) {
          vulnerabilitiesByPackage[vuln.name] = {
            count: 0,
            safeVersion: vuln.safeVersion,
            locations: [],
          };
        }
        
        vulnerabilitiesByPackage[vuln.name].count++;
        vulnerabilitiesByPackage[vuln.name].locations.push({
          path: report.filePath,
          type,
          version: vuln.currentVersion,
        });
      }
    }
  }
  
  // Display most common vulnerabilities
  if (Object.keys(vulnerabilitiesByPackage).length > 0) {
    console.log(`\n${colors.bright}${colors.red}Most Common Vulnerabilities:${colors.reset}\n`);
    
    const sortedVulns = Object.entries(vulnerabilitiesByPackage)
      .sort((a, b) => b[1].count - a[1].count);
    
    for (const [name, info] of sortedVulns) {
      console.log(`${colors.red}${name}${colors.reset} - ${info.count} occurrences, safe version: ${colors.green}${info.safeVersion}${colors.reset}`);
      
      if (state.verbose) {
        console.log(`  ${colors.dim}Locations:${colors.reset}`);
        for (const loc of info.locations.slice(0, 5)) {
          console.log(`    ${colors.dim}•${colors.reset} ${loc.path} (${loc.type}: ${loc.version})`);
        }
        
        if (info.locations.length > 5) {
          console.log(`    ${colors.dim}• ... and ${info.locations.length - 5} more${colors.reset}`);
        }
      }
    }
  }
  
  // Recommendations
  console.log(`\n${colors.bright}${colors.green}Recommendations:${colors.reset}\n`);
  
  if (state.mode !== 'fix' && state.vulnerabilitiesFound > 0) {
    console.log(`${colors.green}•${colors.reset} Run this script with ${colors.bright}--fix${colors.reset} to automatically fix vulnerabilities`);
  }
  
  console.log(`${colors.green}•${colors.reset} Consider adding pre-commit hooks to prevent vulnerable dependencies`);
  console.log(`${colors.green}•${colors.reset} Set up regular security audits with ${colors.bright}npm audit${colors.reset} or ${colors.bright}yarn audit${colors.reset}`);
  console.log(`${colors.green}•${colors.reset} Add security scanning to your CI/CD pipeline`);
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bright}${colors.cyan}AUSTA SuperApp Security Vulnerability Fixer${colors.reset}\n`);
  
  // Parse command line arguments
  parseArgs();
  
  console.log(`${colors.cyan}Mode: ${state.mode}${colors.reset}`);
  console.log(`${colors.cyan}Scanning for package.json files...${colors.reset}`);
  
  // Find all package.json files
  for (const rootDir of CONFIG.rootDirs) {
    const files = findPackageJsonFiles(rootDir);
    state.packageJsonFiles.push(...files);
  }
  
  console.log(`${colors.cyan}Found ${state.packageJsonFiles.length} package.json files${colors.reset}`);
  
  // Process each package.json file
  for (const filePath of state.packageJsonFiles) {
    const packageJson = readPackageJson(filePath);
    if (!packageJson) continue;
    
    state.packagesScanned++;
    
    // Scan for vulnerabilities
    const vulnerabilities = scanForVulnerabilities(filePath, packageJson);
    
    // Store report for later
    state.vulnerabilityReport.push({
      filePath,
      vulnerabilities,
    });
    
    // Display or fix vulnerabilities
    if (state.mode === 'scan') {
      displayVulnerabilityReport(filePath, vulnerabilities);
    } else if (state.mode === 'fix') {
      const { packageJson: updatedPackageJson, fixReport, modified } = 
        fixVulnerabilities(filePath, packageJson, vulnerabilities);
      
      if (modified) {
        writePackageJson(filePath, updatedPackageJson);
        displayFixReport(filePath, fixReport);
      }
    }
  }
  
  // Generate detailed report if requested
  if (state.mode === 'report' || state.verbose) {
    generateDetailedReport();
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}Summary:${colors.reset}`);
  console.log(`${colors.cyan}•${colors.reset} Scanned ${state.packagesScanned} package.json files`);
  console.log(`${colors.cyan}•${colors.reset} Found ${state.vulnerabilitiesFound} security vulnerabilities`);
  
  if (state.mode === 'fix') {
    console.log(`${colors.green}•${colors.reset} Fixed ${state.vulnerabilitiesFixed} security vulnerabilities`);
  }
  
  console.log('');
}

// Run the main function
main().catch(error => {
  console.error(`${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});