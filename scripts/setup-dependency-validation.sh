#!/bin/bash

# ========================================================================
# AUSTA SuperApp Dependency Validation Setup Script
# ========================================================================
# This script automates the complete setup and enforcement of dependency
# validation for the AUSTA SuperApp, ensuring consistent versions across
# the monorepo structure and enforcing security best practices.
# ========================================================================

set -e

echo "========================================================================"
echo "AUSTA SuperApp Dependency Validation Setup"
echo "========================================================================"

# Define color codes for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Define paths
ROOT_DIR="$(pwd)"
SCRIPTS_DIR="${ROOT_DIR}/scripts"
WEB_DIR="${ROOT_DIR}/src/web"
BACKEND_DIR="${ROOT_DIR}/src/backend"
DOCS_DIR="${ROOT_DIR}/docs"

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p "${WEB_DIR}/.yarn/plugins"
mkdir -p "${WEB_DIR}/.yarn/releases"
mkdir -p "${DOCS_DIR}/dependency-management"

# ========================================================================
# 1. Make helper scripts executable
# ========================================================================
echo -e "${BLUE}Making helper scripts executable...${NC}"

chmod +x "${SCRIPTS_DIR}/validate-package-json.js"
chmod +x "${SCRIPTS_DIR}/check-versions.js"
chmod +x "${SCRIPTS_DIR}/scan-vulnerabilities.sh"

# Make the Husky pre-commit hook executable if it exists
if [ -f "${ROOT_DIR}/.husky/pre-commit" ]; then
  chmod +x "${ROOT_DIR}/.husky/pre-commit"
  echo -e "${GREEN}Husky pre-commit hook is now executable${NC}"
fi

# ========================================================================
# 2. Install required dependencies
# ========================================================================
echo -e "${BLUE}Installing required dependencies...${NC}"

# Install global dependencies
npm install -g glob yarn-audit-fix depcheck

# Install local dependencies for validation scripts
npm install --no-save glob semver chalk yargs

# ========================================================================
# 3. Update root package.json with validation scripts
# ========================================================================
echo -e "${BLUE}Updating root package.json with validation scripts...${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}jq is not installed. Please install jq to continue.${NC}"
  echo "On macOS: brew install jq"
  echo "On Ubuntu/Debian: apt-get install jq"
  echo "On Windows with chocolatey: choco install jq"
  exit 1
fi

# Add validation scripts to root package.json
jq '.scripts += {
  "validate:dependencies": "node scripts/validate-package-json.js",
  "validate:versions": "node scripts/check-versions.js",
  "audit:fix": "yarn-audit-fix --force",
  "scan:vulnerabilities": "bash scripts/scan-vulnerabilities.sh",
  "docs:dependencies": "node scripts/generate-dependency-docs.js"
}' "${ROOT_DIR}/package.json" > temp.json && mv temp.json "${ROOT_DIR}/package.json"

# ========================================================================
# 4. Update Web package.json with resolutions
# ========================================================================
echo -e "${BLUE}Updating web package.json with resolutions...${NC}"

# Add resolutions to web package.json
jq '.resolutions = {
  "typescript": "5.3.3",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "next": "14.2.0",
  "react-native": "0.73.4",
  "@types/react": "18.2.0",
  "@types/react-dom": "18.2.0",
  "minimatch": "^5.0.0",
  "semver": "^7.5.2",
  "ws": "^7.4.6"
}' "${WEB_DIR}/package.json" > temp.json && mv temp.json "${WEB_DIR}/package.json"

# ========================================================================
# 5. Create Dependabot configuration
# ========================================================================
echo -e "${BLUE}Creating Dependabot configuration...${NC}"

mkdir -p "${ROOT_DIR}/.github"

cat > "${ROOT_DIR}/.github/dependabot.yml" << 'EOL'
version: 2
updates:
  # Root package.json
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    versioning-strategy: increase
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # Web monorepo
  - package-ecosystem: "npm"
    directory: "/src/web"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    versioning-strategy: increase

  # Backend monorepo
  - package-ecosystem: "npm"
    directory: "/src/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    versioning-strategy: increase

  # New packages
  - package-ecosystem: "npm"
    directory: "/src/web/design-system"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/src/web/primitives"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/src/web/interfaces"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/src/web/journey-context"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
EOL

# ========================================================================
# 6. Create version checking script
# ========================================================================
echo -e "${BLUE}Creating version checking script...${NC}"

cat > "${SCRIPTS_DIR}/check-versions.js" << 'EOL'
#!/usr/bin/env node

/**
 * AUSTA SuperApp Version Consistency Checker
 * 
 * This script validates that all packages in the monorepo use consistent
 * versions of critical dependencies as specified in the technical specification.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Define required versions based on technical specification
const REQUIRED_VERSIONS = {
  // Core frameworks
  'typescript': '5.3.3',
  'react': '18.2.0',
  'react-dom': '18.2.0',
  'next': '14.2.0',
  'react-native': '0.73.4',
  'nestjs/core': '10.3.0',
  'express': '4.18.2',
  
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
  '@austa/interfaces': '1.0.0',
  
  // Backend Core
  'prisma': '5.10.2',
  'kafkajs': '2.2.4',
  'ioredis': '5.3.2'
};

// Find all package.json files in the monorepo
const packageJsonFiles = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let hasErrors = false;
const errors = [];
const warnings = [];

// Check each package.json file
packageJsonFiles.forEach(packageJsonPath => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageName = packageJson.name || path.dirname(packageJsonPath);
  
  // Check dependencies
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (!packageJson[depType]) return;
    
    Object.entries(packageJson[depType]).forEach(([dep, version]) => {
      // Handle scoped packages
      const baseDep = dep.startsWith('@') ? dep.split('/')[1] : dep;
      const fullDep = dep;
      
      // Check if this dependency has a required version
      if (REQUIRED_VERSIONS[fullDep]) {
        const requiredVersion = REQUIRED_VERSIONS[fullDep];
        const cleanVersion = version.replace(/^\^|~/, '');
        
        if (cleanVersion !== requiredVersion) {
          errors.push({
            package: packageName,
            dependency: fullDep,
            current: version,
            required: requiredVersion,
            file: packageJsonPath
          });
          hasErrors = true;
        }
      } else if (REQUIRED_VERSIONS[baseDep]) {
        const requiredVersion = REQUIRED_VERSIONS[baseDep];
        const cleanVersion = version.replace(/^\^|~/, '');
        
        if (cleanVersion !== requiredVersion) {
          warnings.push({
            package: packageName,
            dependency: fullDep,
            current: version,
            required: requiredVersion,
            file: packageJsonPath
          });
        }
      }
    });
  });
});

// Display results
console.log(chalk.blue('========================================'));
console.log(chalk.blue('AUSTA SuperApp Version Consistency Check'));
console.log(chalk.blue('========================================'));
console.log(`Checked ${packageJsonFiles.length} package.json files\n`);

if (errors.length > 0) {
  console.log(chalk.red(`❌ Found ${errors.length} version inconsistencies:`));
  errors.forEach(error => {
    console.log(chalk.red(`  - ${error.package}: ${error.dependency} is ${error.current}, should be ${error.required}`));
    console.log(chalk.gray(`    File: ${error.file}`));
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log(chalk.yellow(`⚠️ Found ${warnings.length} potential inconsistencies:`));
  warnings.forEach(warning => {
    console.log(chalk.yellow(`  - ${warning.package}: ${warning.dependency} is ${warning.current}, should be ${warning.required}`));
    console.log(chalk.gray(`    File: ${warning.file}`));
  });
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log(chalk.green('✅ All packages use consistent versions!'));
}

process.exit(hasErrors ? 1 : 0);
EOL

# ========================================================================
# 7. Create vulnerability scanning script
# ========================================================================
echo -e "${BLUE}Creating vulnerability scanning script...${NC}"

cat > "${SCRIPTS_DIR}/scan-vulnerabilities.sh" << 'EOL'
#!/bin/bash

# AUSTA SuperApp Vulnerability Scanner
# This script scans all package.json files for vulnerabilities

set -e

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}AUSTA SuperApp Vulnerability Scanner${NC}"
echo -e "${BLUE}=========================================${NC}"

# Define paths
ROOT_DIR="$(pwd)"
WEB_DIR="${ROOT_DIR}/src/web"
BACKEND_DIR="${ROOT_DIR}/src/backend"
RESULTS_DIR="${ROOT_DIR}/security-reports"

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Function to scan a directory
scan_directory() {
  local dir=$1
  local name=$2
  
  echo -e "\n${YELLOW}Scanning ${name}...${NC}"
  
  # Change to directory
  cd "${dir}"
  
  # Run npm audit
  echo -e "${BLUE}Running npm audit...${NC}"
  npm audit --json > "${RESULTS_DIR}/${name}-audit.json" || true
  
  # Run yarn audit if available
  if command -v yarn &> /dev/null; then
    echo -e "${BLUE}Running yarn audit...${NC}"
    yarn audit --json > "${RESULTS_DIR}/${name}-yarn-audit.json" || true
  fi
  
  # Return to root
  cd "${ROOT_DIR}"
}

# Scan root directory
scan_directory "${ROOT_DIR}" "root"

# Scan web directory
scan_directory "${WEB_DIR}" "web"

# Scan backend directory
scan_directory "${BACKEND_DIR}" "backend"

# Scan new packages
for pkg in "design-system" "primitives" "interfaces" "journey-context"; do
  if [ -d "${WEB_DIR}/${pkg}" ]; then
    scan_directory "${WEB_DIR}/${pkg}" "${pkg}"
  fi
done

echo -e "\n${GREEN}Vulnerability scanning complete!${NC}"
echo -e "Reports saved to: ${RESULTS_DIR}"

# Check for high or critical vulnerabilities
if grep -q '"severity":"high"\|"severity":"critical"' "${RESULTS_DIR}"/*.json; then
  echo -e "\n${RED}⚠️ High or critical vulnerabilities found!${NC}"
  echo -e "Please review the reports and address these issues."
  exit 1
else
  echo -e "\n${GREEN}✅ No high or critical vulnerabilities found.${NC}"
fi
EOL

# ========================================================================
# 8. Create dependency documentation generator
# ========================================================================
echo -e "${BLUE}Creating dependency documentation generator...${NC}"

cat > "${SCRIPTS_DIR}/generate-dependency-docs.js" << 'EOL'
#!/usr/bin/env node

/**
 * AUSTA SuperApp Dependency Documentation Generator
 * 
 * This script generates comprehensive documentation about the project's
 * dependencies, including version requirements, usage guidelines, and
 * upgrade procedures.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define paths
const ROOT_DIR = process.cwd();
const DOCS_DIR = path.join(ROOT_DIR, 'docs', 'dependency-management');

// Create docs directory if it doesn't exist
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
}

// Define required versions based on technical specification
const REQUIRED_VERSIONS = {
  // Core frameworks
  'typescript': { version: '5.3.3', category: 'Core' },
  'react': { version: '18.2.0', category: 'Frontend' },
  'react-dom': { version: '18.2.0', category: 'Frontend' },
  'next': { version: '14.2.0', category: 'Frontend' },
  'react-native': { version: '0.73.4', category: 'Mobile' },
  'nestjs/core': { version: '10.3.0', category: 'Backend' },
  'express': { version: '4.18.2', category: 'Backend' },
  
  // UI & Design
  'styled-components': { version: '6.1.8', category: 'UI' },
  '@mui/material': { version: '5.15.12', category: 'UI' },
  'framer-motion': { version: '11.0.8', category: 'UI' },
  '@design-system/primitives': { version: '1.0.0', category: 'Design System' },
  '@austa/design-system': { version: '1.0.0', category: 'Design System' },
  
  // State Management & Data Fetching
  '@reduxjs/toolkit': { version: '2.1.0', category: 'State Management' },
  '@tanstack/react-query': { version: '5.25.0', category: 'Data Fetching' },
  '@apollo/client': { version: '3.8.10', category: 'Data Fetching' },
  '@austa/journey-context': { version: '1.0.0', category: 'Journey' },
  '@austa/interfaces': { version: '1.0.0', category: 'Types' },
  
  // Backend Core
  'prisma': { version: '5.10.2', category: 'Database' },
  'kafkajs': { version: '2.2.4', category: 'Events' },
  'ioredis': { version: '5.3.2', category: 'Cache' }
};

// Generate main dependency documentation
function generateMainDoc() {
  let content = `# AUSTA SuperApp Dependency Management

## Overview

This document outlines the dependency management strategy for the AUSTA SuperApp, including:

- Required dependency versions
- Version resolution strategy
- Upgrade procedures
- Security considerations

## Required Versions

The following dependencies must be used at the specified versions across all packages in the monorepo:

`;

  // Group dependencies by category
  const categories = {};
  Object.entries(REQUIRED_VERSIONS).forEach(([dep, info]) => {
    if (!categories[info.category]) {
      categories[info.category] = [];
    }
    categories[info.category].push({ name: dep, version: info.version });
  });

  // Add each category to the documentation
  Object.entries(categories).forEach(([category, deps]) => {
    content += `### ${category}

`;
    content += '| Package | Required Version |
|---------|----------------|
';
    deps.forEach(dep => {
      content += `| \`${dep.name}\` | ${dep.version} |
`;
    });
    content += '\n';
  });

  // Add version resolution strategy
  content += `## Version Resolution Strategy

The AUSTA SuperApp uses Yarn's resolutions field to enforce consistent versions across the monorepo. This ensures that all packages use the same version of critical dependencies, preventing version conflicts and potential bugs.

### In Root package.json

\`\`\`json
"resolutions": {
  "typescript": "5.3.3",
  "react": "18.2.0",
  "react-dom": "18.2.0",
  "next": "14.2.0",
  "react-native": "0.73.4",
  "@types/react": "18.2.0",
  "@types/react-dom": "18.2.0",
  "minimatch": "^5.0.0",
  "semver": "^7.5.2",
  "ws": "^7.4.6"
}
\`\`\`

## New Packages

The following new packages have been added to the monorepo:

- \`@design-system/primitives\`: Design system primitives (colors, typography, spacing)
- \`@austa/design-system\`: UI component library with journey-specific theming
- \`@austa/interfaces\`: Shared TypeScript interfaces for data models
- \`@austa/journey-context\`: Journey-specific state management

## Upgrade Procedures

When upgrading dependencies, follow these steps:

1. Update the version in the resolutions field of the root package.json
2. Run \`yarn install\` to update the yarn.lock file
3. Run \`yarn validate:versions\` to ensure all packages use the correct version
4. Run \`yarn scan:vulnerabilities\` to check for security issues
5. Test thoroughly across all affected packages

## Security Considerations

All dependencies are automatically scanned for vulnerabilities using:

- Dependabot alerts (configured in .github/dependabot.yml)
- npm audit / yarn audit (run via \`yarn scan:vulnerabilities\`)

Critical and high severity vulnerabilities must be addressed immediately.
`;

  // Write the main documentation file
  fs.writeFileSync(path.join(DOCS_DIR, 'README.md'), content);
  console.log(`Generated main dependency documentation at ${path.join(DOCS_DIR, 'README.md')}`);
}

// Generate new packages documentation
function generateNewPackagesDoc() {
  let content = `# New Package Dependencies

## Overview

This document provides details about the new packages added to the AUSTA SuperApp monorepo as part of the refactoring effort.

`;

  const newPackages = [
    {
      name: '@design-system/primitives',
      description: 'Design system primitives that expose atomic design tokens (colors, typography, spacing) consumed by @austa/design-system and UI components.',
      dependencies: ['styled-components', 'react'],
      usage: 'Import design tokens from this package to ensure consistent styling across the application.'
    },
    {
      name: '@austa/design-system',
      description: 'UI component library with journey-specific theming and pre-built UI components for consistent design across web and mobile.',
      dependencies: ['@design-system/primitives', 'styled-components', 'react'],
      usage: 'Import UI components from this package instead of creating custom components.'
    },
    {
      name: '@austa/interfaces',
      description: 'Shared TypeScript interfaces for data models consumed by both frontend and backend to ensure type safety.',
      dependencies: ['typescript'],
      usage: 'Import interfaces from this package to ensure consistent data structures across the application.'
    },
    {
      name: '@austa/journey-context',
      description: 'Journey-specific state management with React context/provider for managing journey-specific state across web and mobile.',
      dependencies: ['react', '@austa/interfaces'],
      usage: 'Use the journey context providers to manage state within and across journeys.'
    }
  ];

  newPackages.forEach(pkg => {
    content += `## ${pkg.name}

${pkg.description}

### Dependencies

`;
    pkg.dependencies.forEach(dep => {
      const version = REQUIRED_VERSIONS[dep] ? REQUIRED_VERSIONS[dep].version : 'latest';
      content += `- \`${dep}\`: ${version}\n`;
    });
    content += `\n### Usage Guidelines\n\n${pkg.usage}\n\n`;
  });

  // Write the new packages documentation file
  fs.writeFileSync(path.join(DOCS_DIR, 'new-packages.md'), content);
  console.log(`Generated new packages documentation at ${path.join(DOCS_DIR, 'new-packages.md')}`);
}

// Generate upgrade guide
function generateUpgradeGuide() {
  const content = `# Dependency Upgrade Guide

## Overview

This document provides guidelines for upgrading dependencies in the AUSTA SuperApp monorepo.

## General Upgrade Process

1. **Research the upgrade**:
   - Review the changelog for the dependency
   - Check for breaking changes
   - Verify compatibility with other dependencies

2. **Update the version**:
   - Update the version in the resolutions field of the root package.json
   - Run \`yarn install\` to update the yarn.lock file

3. **Validate the upgrade**:
   - Run \`yarn validate:versions\` to ensure all packages use the correct version
   - Run \`yarn scan:vulnerabilities\` to check for security issues
   - Run tests to verify functionality

4. **Document the upgrade**:
   - Update this documentation with any special considerations
   - Communicate the upgrade to the team

## Critical Dependencies

### TypeScript (${REQUIRED_VERSIONS.typescript.version})

When upgrading TypeScript:

1. Review the [TypeScript release notes](https://github.com/microsoft/TypeScript/releases)
2. Update tsconfig.json files if necessary
3. Address any new type errors

### React (${REQUIRED_VERSIONS.react.version})

When upgrading React:

1. Review the [React release notes](https://github.com/facebook/react/releases)
2. Update react-dom to the same version
3. Test thoroughly across all components

### React Native (${REQUIRED_VERSIONS.['react-native'].version})

When upgrading React Native:

1. Review the [React Native release notes](https://github.com/facebook/react-native/releases)
2. Update native dependencies as required
3. Test on both iOS and Android

### NestJS (${REQUIRED_VERSIONS['nestjs/core'].version})

When upgrading NestJS:

1. Review the [NestJS release notes](https://github.com/nestjs/nest/releases)
2. Update related NestJS packages to the same version
3. Test all microservices

## Security Updates

For security-related updates:

1. Prioritize critical and high severity vulnerabilities
2. Apply the update as soon as possible
3. Run \`yarn scan:vulnerabilities\` to verify the fix
4. Document the vulnerability and the fix
`;

  // Write the upgrade guide
  fs.writeFileSync(path.join(DOCS_DIR, 'upgrade-guide.md'), content);
  console.log(`Generated upgrade guide at ${path.join(DOCS_DIR, 'upgrade-guide.md')}`);
}

// Generate all documentation
function generateAllDocs() {
  console.log('Generating dependency documentation...');
  generateMainDoc();
  generateNewPackagesDoc();
  generateUpgradeGuide();
  console.log('Documentation generation complete!');
}

// Run the generator
generateAllDocs();
EOL

# ========================================================================
# 9. Create package.json validation script
# ========================================================================
echo -e "${BLUE}Creating package.json validation script...${NC}"

cat > "${SCRIPTS_DIR}/validate-package-json.js" << 'EOL'
#!/usr/bin/env node

/**
 * AUSTA SuperApp Package.json Validator
 * 
 * This script validates all package.json files in the monorepo to ensure
 * they follow the project's standards and have consistent dependencies.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

// Find all package.json files in the monorepo
const packageJsonFiles = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
});

let hasErrors = false;
const errors = [];
const warnings = [];

// Define required fields for package.json
const requiredFields = ['name', 'version'];

// Define monorepo packages
const monorepoPackages = [
  '@austa/design-system',
  '@design-system/primitives',
  '@austa/interfaces',
  '@austa/journey-context'
];

// Check each package.json file
packageJsonFiles.forEach(packageJsonPath => {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const packageName = packageJson.name || path.dirname(packageJsonPath);
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!packageJson[field]) {
      errors.push({
        package: packageName,
        file: packageJsonPath,
        message: `Missing required field: ${field}`
      });
      hasErrors = true;
    }
  });
  
  // Check for scripts section
  if (!packageJson.scripts) {
    warnings.push({
      package: packageName,
      file: packageJsonPath,
      message: 'Missing scripts section'
    });
  }
  
  // Check for proper workspace references
  ['dependencies', 'devDependencies', 'peerDependencies'].forEach(depType => {
    if (!packageJson[depType]) return;
    
    Object.entries(packageJson[depType]).forEach(([dep, version]) => {
      // Check if this is a monorepo package
      if (monorepoPackages.includes(dep)) {
        // Workspace references should use workspace: protocol
        if (!version.startsWith('workspace:')) {
          errors.push({
            package: packageName,
            file: packageJsonPath,
            message: `Monorepo package ${dep} should use workspace: protocol (found ${version})`
          });
          hasErrors = true;
        }
      }
    });
  });
  
  // Check for proper license
  if (!packageJson.license) {
    warnings.push({
      package: packageName,
      file: packageJsonPath,
      message: 'Missing license field'
    });
  }
});

// Display results
console.log(chalk.blue('========================================'));
console.log(chalk.blue('AUSTA SuperApp Package.json Validator'));
console.log(chalk.blue('========================================'));
console.log(`Checked ${packageJsonFiles.length} package.json files\n`);

if (errors.length > 0) {
  console.log(chalk.red(`❌ Found ${errors.length} errors:`));
  errors.forEach(error => {
    console.log(chalk.red(`  - ${error.package}: ${error.message}`));
    console.log(chalk.gray(`    File: ${error.file}`));
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log(chalk.yellow(`⚠️ Found ${warnings.length} warnings:`));
  warnings.forEach(warning => {
    console.log(chalk.yellow(`  - ${warning.package}: ${warning.message}`));
    console.log(chalk.gray(`    File: ${warning.file}`));
  });
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log(chalk.green('✅ All package.json files are valid!'));
}

process.exit(hasErrors ? 1 : 0);
EOL

# ========================================================================
# 10. Add pre-commit hook for dependency validation
# ========================================================================
echo -e "${BLUE}Setting up pre-commit hook for dependency validation...${NC}"

# Create .husky directory if it doesn't exist
mkdir -p "${ROOT_DIR}/.husky"

# Create pre-commit hook
cat > "${ROOT_DIR}/.husky/pre-commit" << 'EOL'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run dependency validation
node scripts/validate-package-json.js

# Run version consistency check
node scripts/check-versions.js
EOL

# Make the pre-commit hook executable
chmod +x "${ROOT_DIR}/.husky/pre-commit"

# ========================================================================
# 11. Run initial validation
# ========================================================================
echo -e "${BLUE}Running initial dependency validation...${NC}"

# Run package.json validation
node "${SCRIPTS_DIR}/validate-package-json.js" || true

# Run version consistency check
node "${SCRIPTS_DIR}/check-versions.js" || true

# Generate dependency documentation
node "${SCRIPTS_DIR}/generate-dependency-docs.js" || true

# ========================================================================
# 12. Final summary
# ========================================================================
echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}AUSTA SuperApp Dependency Validation Setup Complete!${NC}"
echo -e "${GREEN}========================================================================${NC}"
echo -e "\nThe following tools are now available:\n"
echo -e "${YELLOW}yarn validate:dependencies${NC} - Validate package.json files"
echo -e "${YELLOW}yarn validate:versions${NC} - Check for consistent dependency versions"
echo -e "${YELLOW}yarn audit:fix${NC} - Fix security vulnerabilities where possible"
echo -e "${YELLOW}yarn scan:vulnerabilities${NC} - Scan for security vulnerabilities"
echo -e "${YELLOW}yarn docs:dependencies${NC} - Generate dependency documentation"
echo -e "\nDependabot has been configured for:\n"
echo -e "- Root package.json"
echo -e "- Web monorepo"
echo -e "- Backend monorepo"
echo -e "- New packages (design-system, primitives, interfaces, journey-context)"
echo -e "\nDocumentation has been generated in: ${DOCS_DIR}"