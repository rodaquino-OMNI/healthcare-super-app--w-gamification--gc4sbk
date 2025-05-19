/**
 * Simple verification script for TypeScript path mappings
 * This script uses Node.js file system API to check if files exist
 * without requiring ts-node or tsconfig-paths
 * 
 * Enhanced to validate additional path aliases from @austa/* namespace
 * Updated file existence checks for new package structure
 * Improved error reporting for path resolution failures
 * 
 * Features:
 * - Validates TypeScript path aliases defined in tsconfig.json
 * - Checks if files and directories referenced by aliases exist on disk
 * - Provides detailed error reporting and troubleshooting suggestions
 * - Supports checking path aliases in different environments (dev, prod)
 * - Groups errors by type and namespace for easier debugging
 * - Suggests potential fixes for specific error types
 */
const fs = require('fs');
const path = require('path');
const process = require('process');

// Define the path mappings from tsconfig.json
const pathMappings = {
  // Backend service path mappings
  '@shared/*': ['shared/src/*'],
  '@gamification/*': ['gamification-engine/src/*'],
  '@prisma/*': ['shared/prisma/*'],
  '@app/auth/*': ['auth-service/src/*'],
  '@app/health/*': ['health-service/src/*'],
  '@app/care/*': ['care-service/src/*'],
  '@app/plan/*': ['plan-service/src/*'],
  '@app/notification/*': ['notification-service/src/*'],
  '@app/api-gateway/*': ['api-gateway/src/*'],
  
  // New path mappings for @austa/* namespace
  '@austa/design-system/*': ['../web/design-system/src/*'],
  '@austa/interfaces/*': ['../web/interfaces/*'],
  '@austa/journey-context/*': ['../web/journey-context/src/*'],
  '@design-system/primitives/*': ['../web/primitives/src/*'],
  
  // Backend packages path mappings
  '@austa/database/*': ['packages/database/src/*'],
  '@austa/errors/*': ['packages/errors/src/*'],
  '@austa/events/*': ['packages/events/src/*'],
  '@austa/logging/*': ['packages/logging/src/*'],
  '@austa/tracing/*': ['packages/tracing/src/*'],
  '@austa/utils/*': ['packages/utils/src/*']
};

// Define examples of files that should exist using the path aliases
const filesToVerify = [
  // Backend shared utilities
  { 
    alias: '@shared/logging/logger.service', 
    path: 'shared/src/logging/logger.service.ts',
    description: 'Logger Service',
    type: 'file'
  },
  { 
    alias: '@shared/kafka/kafka.service', 
    path: 'shared/src/kafka/kafka.service.ts',
    description: 'Kafka Service',
    type: 'file'
  },
  
  // Backend services
  { 
    alias: '@gamification/app.module', 
    path: 'gamification-engine/src/app.module.ts',
    description: 'Gamification App Module',
    type: 'file'
  },
  {
    alias: '@app/auth/auth.module',
    path: 'auth-service/src/auth.module.ts',
    description: 'Auth Service Module',
    type: 'file'
  },
  {
    alias: '@app/health/health.module',
    path: 'health-service/src/health.module.ts',
    description: 'Health Service Module',
    type: 'file'
  },
  
  // Backend packages
  {
    alias: '@austa/database/connection',
    path: 'packages/database/src/connection',
    description: 'Database Connection Package',
    type: 'directory'
  },
  {
    alias: '@austa/errors/journey',
    path: 'packages/errors/src/journey',
    description: 'Journey Errors Package',
    type: 'directory'
  },
  {
    alias: '@austa/events/kafka',
    path: 'packages/events/src/kafka',
    description: 'Kafka Events Package',
    type: 'directory'
  },
  
  // Web packages - Design System
  {
    alias: '@austa/design-system/components/Button',
    path: '../web/design-system/src/components/Button/index.ts',
    description: 'Design System Button Component',
    type: 'file'
  },
  {
    alias: '@design-system/primitives/tokens/colors',
    path: '../web/primitives/src/tokens/colors.ts',
    description: 'Design System Color Tokens',
    type: 'file'
  },
  
  // Web packages - Interfaces and Context
  {
    alias: '@austa/interfaces/gamification',
    path: '../web/interfaces/gamification',
    description: 'Gamification Interfaces',
    type: 'directory'
  },
  {
    alias: '@austa/interfaces/journey',
    path: '../web/interfaces/journey',
    description: 'Journey Interfaces',
    type: 'directory'
  },
  {
    alias: '@austa/journey-context/providers',
    path: '../web/journey-context/src/providers',
    description: 'Journey Context Providers',
    type: 'directory'
  }
];

// Define emoji constants to avoid encoding issues
const EMOJI = {
  MAGNIFYING_GLASS: '🔍',
  CHECK_MARK: '✅',
  CROSS_MARK: '❌',
  WARNING: '⚠️',
  CHART: '📊',
  BOOK: '📘',
  WRENCH: '🔧',
  FOLDER: '📁',
  FILE: '📄',
  PACKAGE: '📦',
  ROCKET: '🚀',
  LIGHT_BULB: '💡'
};

// Check if running in CI environment
const isCI = process.env.CI === 'true';

// Get the current environment
const nodeEnv = process.env.NODE_ENV || 'development';

// Function to check if we should use color output
function shouldUseColor() {
  return !isCI && process.stdout.isTTY;
}

// Simple color function for terminal output
const color = {
  reset: shouldUseColor() ? '\x1b[0m' : '',
  red: shouldUseColor() ? '\x1b[31m' : '',
  green: shouldUseColor() ? '\x1b[32m' : '',
  yellow: shouldUseColor() ? '\x1b[33m' : '',
  blue: shouldUseColor() ? '\x1b[34m' : '',
  magenta: shouldUseColor() ? '\x1b[35m' : '',
  cyan: shouldUseColor() ? '\x1b[36m' : '',
  bold: shouldUseColor() ? '\x1b[1m' : ''
};

console.log(`${EMOJI.MAGNIFYING_GLASS} ${color.bold}Verifying file paths for TypeScript path mappings...${color.reset}`);
console.log(`Current working directory: ${color.cyan}${process.cwd()}${color.reset}\n`);
console.log(`Environment: ${color.magenta}${nodeEnv}${color.reset}`);
console.log(`Running in CI: ${isCI ? color.yellow + 'Yes' + color.reset : color.green + 'No' + color.reset}\n`);
console.log(`${color.bold}Path aliases configured in tsconfig.json:${color.reset}`);

// Group path mappings by namespace for better organization
const namespaceGroups = {};
for (const [alias, paths] of Object.entries(pathMappings)) {
  const namespace = alias.split('/')[0];
  if (!namespaceGroups[namespace]) {
    namespaceGroups[namespace] = [];
  }
  namespaceGroups[namespace].push({ alias, paths });
}

// Display path mappings grouped by namespace
for (const [namespace, mappings] of Object.entries(namespaceGroups)) {
  console.log(`  ${color.bold}${namespace}:${color.reset}`);
  for (const { alias, paths } of mappings) {
    console.log(`    ${color.cyan}${alias}${color.reset} -> ${color.green}${paths.join(', ')}${color.reset}`);
  }
}

console.log(`\n${color.bold}Checking for existence of example files:${color.reset}`);

// Group files to verify by type for better organization
const filesByType = {
  file: filesToVerify.filter(item => item.type === 'file'),
  directory: filesToVerify.filter(item => item.type === 'directory' || !item.type)
};

console.log(`  ${EMOJI.FILE} Files to check: ${filesByType.file.length}`);
console.log(`  ${EMOJI.FOLDER} Directories to check: ${filesByType.directory.length}`);

// Function to verify file or directory existence
function verifyFilePath(filePath, type = 'file') {
  const absolutePath = path.resolve(process.cwd(), filePath);
  try {
    fs.accessSync(absolutePath, fs.constants.F_OK);
    
    // If we're checking a specific type, verify it's the correct type
    if (type === 'file' || type === 'directory') {
      const stats = fs.statSync(absolutePath);
      if (type === 'file' && !stats.isFile()) {
        return { 
          exists: false, 
          path: absolutePath, 
          error: 'NOT_FILE', 
          message: 'Path exists but is not a file' 
        };
      }
      if (type === 'directory' && !stats.isDirectory()) {
        return { 
          exists: false, 
          path: absolutePath, 
          error: 'NOT_DIRECTORY', 
          message: 'Path exists but is not a directory' 
        };
      }
    }
    
    return { exists: true, path: absolutePath };
  } catch (err) {
    return { 
      exists: false, 
      path: absolutePath, 
      error: err.code,
      message: getErrorMessage(err.code, absolutePath)
    };
  }
}

// Function to get a human-readable error message
function getErrorMessage(errorCode, filePath) {
  const messages = {
    'ENOENT': `No such file or directory: ${filePath}`,
    'EACCES': `Permission denied: ${filePath}`,
    'ENOTDIR': `Not a directory: ${filePath}`,
    'EISDIR': `Is a directory: ${filePath}`,
    'EBADF': `Bad file descriptor: ${filePath}`,
    'ENAMETOOLONG': `File name too long: ${filePath}`,
    'ELOOP': `Too many symbolic links: ${filePath}`,
    'ENOMEM': `Out of memory: ${filePath}`,
    'EMFILE': `Too many open files: ${filePath}`,
    'ENOSPC': `No space left on device: ${filePath}`,
    'EROFS': `Read-only file system: ${filePath}`,
    'ENOTEMPTY': `Directory not empty: ${filePath}`,
    'EPERM': `Operation not permitted: ${filePath}`,
    'EINVAL': `Invalid argument: ${filePath}`
  };
  
  return messages[errorCode] || `Unknown error (${errorCode}): ${filePath}`;
}

// Function to suggest fixes for specific error types
function suggestFix(errorCode, filePath, alias) {
  const suggestions = {
    'ENOENT': [
      `Create the missing file/directory at: ${filePath}`,
      `Update the path mapping for ${alias} in tsconfig.json`,
      `Check if the package containing this file is installed`
    ],
    'EACCES': [
      `Check file permissions for: ${filePath}`,
      `Run the script with appropriate permissions`
    ],
    'NOT_FILE': [
      `The path exists but is not a file: ${filePath}`,
      `Check if the path should be pointing to a directory instead`,
      `Update the type in the filesToVerify configuration`
    ],
    'NOT_DIRECTORY': [
      `The path exists but is not a directory: ${filePath}`,
      `Check if the path should be pointing to a file instead`,
      `Update the type in the filesToVerify configuration`
    ]
  };
  
  return suggestions[errorCode] || [
    `Check if the path is correct: ${filePath}`,
    `Verify that the file/directory exists and is accessible`
  ];
}

let allFilesExist = true;
let foundFiles = [];
let missingFiles = [];

// Verify each file or directory
filesToVerify.forEach(file => {
  const result = verifyFilePath(file.path, file.type);
  
  if (result.exists) {
    foundFiles.push(file);
    const typeLabel = file.type === 'directory' ? 'Directory' : 'File';
    const typeEmoji = file.type === 'directory' ? EMOJI.FOLDER : EMOJI.FILE;
    console.log(`  ${EMOJI.CHECK_MARK} ${color.green}${file.description}${color.reset} (${color.cyan}${file.alias}${color.reset})`);
    console.log(`    ${typeEmoji} ${typeLabel} exists at: ${color.green}${file.path}${color.reset}`);
  } else {
    missingFiles.push({ ...file, error: result.error, message: result.message });
    const typeLabel = file.type === 'directory' ? 'Directory' : 'File';
    const typeEmoji = file.type === 'directory' ? EMOJI.FOLDER : EMOJI.FILE;
    console.log(`  ${EMOJI.CROSS_MARK} ${color.red}${file.description}${color.reset} (${color.cyan}${file.alias}${color.reset})`);
    console.log(`    ${typeEmoji} ${typeLabel} NOT found at: ${color.red}${file.path}${color.reset} (${color.yellow}${result.error}${color.reset})`);
    console.log(`    ${color.yellow}${result.message}${color.reset}`);
    allFilesExist = false;
  }
});

// Output summary
console.log(`\n${EMOJI.CHART} ${color.bold}Summary${color.reset}`);
console.log(`  Total paths checked: ${color.bold}${filesToVerify.length}${color.reset}`);
console.log(`  Paths found: ${color.green}${foundFiles.length}${color.reset}`);
console.log(`  Paths missing: ${missingFiles.length > 0 ? color.red + missingFiles.length + color.reset : color.green + '0' + color.reset}`);

// Calculate success percentage
const successPercentage = (foundFiles.length / filesToVerify.length) * 100;
console.log(`  Success rate: ${successPercentage === 100 ? color.green : color.yellow}${successPercentage.toFixed(1)}%${color.reset}`);

// Group missing files by error type for better diagnostics
if (missingFiles.length > 0) {
  const errorGroups = {};
  const namespaceGroups = {};
  
  missingFiles.forEach(file => {
    // Group by error type
    if (!errorGroups[file.error]) {
      errorGroups[file.error] = [];
    }
    errorGroups[file.error].push(file);
    
    // Group by namespace for better analysis
    const namespace = file.alias.split('/')[0];
    if (!namespaceGroups[namespace]) {
      namespaceGroups[namespace] = [];
    }
    namespaceGroups[namespace].push(file);
  });
  
  console.log(`\n${EMOJI.WARNING} Missing files by error type:`);
  for (const [errorCode, files] of Object.entries(errorGroups)) {
    console.log(`  Error ${errorCode}:`);
    files.forEach(file => {
      console.log(`    - ${file.description} (${file.alias}) -> ${file.path}`);
      console.log(`      ${file.message}`);
    });
  }
  
  console.log(`\n${EMOJI.MAGNIFYING_GLASS} Missing files by namespace:`);
  for (const [namespace, files] of Object.entries(namespaceGroups)) {
    console.log(`  ${namespace}:`);
    files.forEach(file => {
      console.log(`    - ${file.description} (${file.alias}) -> ${file.path}`);
    });
  }
  
  // Provide specific fix suggestions for each error
  console.log(`\n${EMOJI.WRENCH} Suggested fixes:`);
  for (const file of missingFiles) {
    console.log(`  For ${file.description} (${file.alias}):`);
    const suggestions = suggestFix(file.error, file.path, file.alias);
    suggestions.forEach((suggestion, index) => {
      console.log(`    ${index + 1}. ${suggestion}`);
    });
  }
}

// Final assessment
if (allFilesExist) {
  console.log(`\n${EMOJI.CHECK_MARK} All files exist! TypeScript path mapping validation successful!`);
  console.log('\nThis confirms that your path aliases in tsconfig.json correctly map to existing files.');
  console.log('For runtime support, make sure to use tsconfig-paths at runtime:');
  console.log('  - In development: node -r tsconfig-paths/register your-script.js');
  console.log('  - In NestJS: Add -r tsconfig-paths/register to your start scripts');
  console.log('  - For webpack: Use the TsconfigPathsPlugin');
} else {
  console.log(`\n${EMOJI.WARNING} Some files are missing. This may indicate:`);
  console.log('  1. The path mappings in tsconfig.json might not match your actual file structure');
  console.log('  2. Some referenced files haven\'t been created yet');
  console.log('  3. The files might be in different locations');
  console.log('  4. The monorepo structure might not be fully set up');
  
  console.log('\nTroubleshooting suggestions:');
  console.log('  1. Check if the directory structure matches the expected paths');
  console.log('  2. Verify that package names in imports match the actual package names');
  console.log('  3. Ensure all required packages are installed and built');
  console.log('  4. Check for case sensitivity issues in file paths');
  console.log('  5. Verify that the tsconfig.json paths are correctly configured');
  console.log('  6. Run yarn/npm install to ensure all dependencies are installed');
  console.log('  7. Check if the monorepo workspace definitions include all packages');
  
  console.log('\nPlease check your file structure and update either:');
  console.log('  - The tsconfig.json path mappings to match your file structure, or');
  console.log('  - Create the missing files in the expected locations');
  
  console.log('\nFor the @austa/* namespace packages:');
  console.log('  - Ensure the packages are properly set up in the monorepo structure');
  console.log('  - Verify that the web packages (@austa/design-system, @design-system/primitives, etc.) are built');
  console.log('  - Check that the relative paths from backend to web packages are correct');
  console.log('  - Make sure the package.json files in each package have the correct name field');
  console.log('  - Ensure that TypeScript project references are correctly configured');
  console.log('  - Verify that the workspace definitions in package.json include all packages');
}

// Provide additional information about path resolution
console.log(`\n${EMOJI.BOOK} Path Resolution Information:`);
console.log('  - TypeScript path aliases are resolved at compile time');
console.log('  - Runtime resolution requires additional tools like tsconfig-paths');
console.log('  - Ensure consistent path usage between TypeScript and JavaScript files');
console.log('  - For NestJS services, verify that module imports use the correct paths');
console.log('  - For React/React Native, check that babel-plugin-module-resolver is configured');
console.log('  - For Jest tests, configure moduleNameMapper to handle path aliases');
console.log('  - For ESLint, use eslint-import-resolver-typescript to validate imports');

// Provide specific information about the @austa/* namespace
console.log(`\n${EMOJI.WRENCH} @austa/* Namespace Information:`);
console.log('  - @austa/design-system: UI component library with journey-specific theming');
console.log('  - @design-system/primitives: Atomic design tokens (colors, typography, spacing)');
console.log('  - @austa/interfaces: Shared TypeScript interfaces for data models');
console.log('  - @austa/journey-context: Journey-specific state management');
console.log('  - @austa/database: Database connection and transaction management');
console.log('  - @austa/errors: Error handling and classification framework');
console.log('  - @austa/events: Event processing and Kafka integration');
console.log('  - @austa/logging: Structured logging and context tracking');
console.log('  - @austa/tracing: Distributed tracing for request flows');
console.log('  - @austa/utils: Shared utilities for common operations');
console.log('  - These packages should be accessible from both web and mobile applications');

// Add environment-specific checks
console.log(`\n${EMOJI.MAGNIFYING_GLASS} Environment-Specific Considerations:`);
console.log('  - Development: Ensure hot reloading works with path aliases');
console.log('  - Testing: Configure Jest moduleNameMapper for path resolution');
console.log('  - Production: Verify that bundled code correctly resolves all imports');
console.log('  - CI/CD: Ensure build scripts handle path aliases correctly');
console.log('  - Docker: Check that container builds include all necessary packages');

// Add command line arguments support
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const verbose = args.includes('--verbose') || args.includes('-v');
const checkEnv = args.includes('--env') || args.includes('-e');
const fixMode = args.includes('--fix') || args.includes('-f');

if (showHelp) {
  console.log('\nUsage: node verify-paths-simple.js [options]');
  console.log('\nOptions:');
  console.log('  --help, -h     Show this help message');
  console.log('  --verbose, -v  Show more detailed information');
  console.log('  --env, -e      Check environment-specific configurations');
  console.log('  --fix, -f      Attempt to fix common issues (experimental)');
  process.exit(0);
}

// Add environment-specific checks if requested
if (checkEnv) {
  console.log(`\n${EMOJI.ROCKET} ${color.bold}Environment-Specific Checks${color.reset}`);
  
  // Check for tsconfig-paths in package.json
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);
    
    const hasTsConfigPaths = packageJson.dependencies?.['tsconfig-paths'] || 
                            packageJson.devDependencies?.['tsconfig-paths'];
    
    console.log(`  ${hasTsConfigPaths ? EMOJI.CHECK_MARK : EMOJI.CROSS_MARK} tsconfig-paths ${hasTsConfigPaths ? 'is' : 'is NOT'} installed`);
    
    if (!hasTsConfigPaths) {
      console.log(`    ${color.yellow}Recommendation: Install tsconfig-paths for runtime path resolution${color.reset}`);
      console.log(`    ${color.cyan}npm install --save-dev tsconfig-paths${color.reset} or ${color.cyan}yarn add -D tsconfig-paths${color.reset}`);
    }
    
    // Check for start scripts using tsconfig-paths
    const scripts = packageJson.scripts || {};
    const hasPathsInScripts = Object.values(scripts).some(script => 
      script.includes('tsconfig-paths/register') || script.includes('ts-node/register')
    );
    
    console.log(`  ${hasPathsInScripts ? EMOJI.CHECK_MARK : EMOJI.CROSS_MARK} Scripts ${hasPathsInScripts ? 'are' : 'are NOT'} configured for path resolution`);
    
    if (!hasPathsInScripts) {
      console.log(`    ${color.yellow}Recommendation: Add tsconfig-paths/register to your start scripts${color.reset}`);
      console.log(`    ${color.cyan}Example: "start": "node -r tsconfig-paths/register dist/main.js"${color.reset}`);
    }
  } catch (err) {
    console.log(`  ${EMOJI.CROSS_MARK} ${color.red}Could not check package.json: ${err.message}${color.reset}`);
  }
  
  // Check for tsconfig.json
  try {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
    fs.accessSync(tsconfigPath, fs.constants.F_OK);
    
    console.log(`  ${EMOJI.CHECK_MARK} tsconfig.json exists`);
    
    // Check if paths are configured in tsconfig.json
    const tsconfig = require(tsconfigPath);
    const hasPaths = tsconfig.compilerOptions?.paths && Object.keys(tsconfig.compilerOptions.paths).length > 0;
    
    console.log(`  ${hasPaths ? EMOJI.CHECK_MARK : EMOJI.CROSS_MARK} Path aliases ${hasPaths ? 'are' : 'are NOT'} configured in tsconfig.json`);
    
    if (!hasPaths) {
      console.log(`    ${color.yellow}Recommendation: Configure path aliases in tsconfig.json${color.reset}`);
      console.log(`    ${color.cyan}Example: "paths": { "@app/*": ["src/*"] }${color.reset}`);
    }
  } catch (err) {
    console.log(`  ${EMOJI.CROSS_MARK} ${color.red}Could not check tsconfig.json: ${err.message}${color.reset}`);
  }
}

// Experimental fix mode
if (fixMode) {
  console.log(`\n${EMOJI.LIGHT_BULB} ${color.bold}Fix Mode (Experimental)${color.reset}`);
  console.log(`  ${color.yellow}Note: This feature is experimental and may not fix all issues${color.reset}`);
  
  // Only attempt fixes for ENOENT errors (missing files/directories)
  const fixableMissing = missingFiles.filter(file => file.error === 'ENOENT');
  
  if (fixableMissing.length === 0) {
    console.log(`  ${EMOJI.CHECK_MARK} No fixable issues found`);
  } else {
    console.log(`  Found ${fixableMissing.length} potentially fixable issues`);
    
    fixableMissing.forEach(file => {
      console.log(`  ${EMOJI.WRENCH} Attempting to fix: ${color.cyan}${file.alias}${color.reset}`);
      
      try {
        // Create directory structure if needed
        const dirPath = file.type === 'directory' 
          ? file.path 
          : path.dirname(file.path);
        
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`    ${EMOJI.CHECK_MARK} Created directory: ${color.green}${dirPath}${color.reset}`);
        
        // If it's a file, create an empty file or a basic template
        if (file.type === 'file') {
          // Create a basic template based on file extension
          const ext = path.extname(file.path);
          let content = '';
          
          if (ext === '.ts' || ext === '.tsx') {
            // For TypeScript files
            content = `/**
 * ${file.description}
 * Generated by verify-paths-simple.js
 */

// TODO: Implement ${file.alias}
`;
          } else if (ext === '.js' || ext === '.jsx') {
            // For JavaScript files
            content = `/**
 * ${file.description}
 * Generated by verify-paths-simple.js
 */

// TODO: Implement ${file.alias}
`;
          }
          
          fs.writeFileSync(file.path, content);
          console.log(`    ${EMOJI.CHECK_MARK} Created file: ${color.green}${file.path}${color.reset}`);
        }
      } catch (err) {
        console.log(`    ${EMOJI.CROSS_MARK} Failed to fix: ${color.red}${err.message}${color.reset}`);
      }
    });
    
    console.log(`\n  ${EMOJI.WARNING} ${color.yellow}Remember to properly implement the generated files${color.reset}`);
  }
}

// Exit with appropriate code
process.exit(allFilesExist ? 0 : 1);