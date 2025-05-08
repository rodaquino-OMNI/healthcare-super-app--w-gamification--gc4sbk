#!/usr/bin/env node

/**
 * This script patches vulnerable axios instances in node_modules
 * to prevent security vulnerabilities (SSRF and credential leakage)
 * 
 * Compatible with Node.js ≥18.0.0 and TypeScript 5.3.3
 * Supports npm, yarn, and pnpm workspace structures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
if (majorVersion < 18) {
  console.error('\u274c Error: This script requires Node.js version 18.0.0 or higher');
  console.error(`Current version: ${nodeVersion}`);
  process.exit(1);
}

// Constants
const SECURE_AXIOS_VERSION = '1.6.8';
const LOG_PREFIX = {
  info: '\u2139\ufe0f',
  success: '\u2705',
  warning: '\u26a0\ufe0f',
  error: '\u274c',
  security: '\ud83d\udd12',
  patch: '\ud83d\udd27',
  package: '\ud83d\udce6',
  complete: '\ud83c\udf89'
};

// Initialize logging for security compliance tracking
const securityLog = [];
function logSecurity(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}`;
  securityLog.push(logEntry);
  console.log(`${LOG_PREFIX.security} ${message}`);
}

function logSuccess(message) {
  console.log(`${LOG_PREFIX.success} ${message}`);
}

function logWarning(message) {
  console.log(`${LOG_PREFIX.warning} ${message}`);
}

function logError(message) {
  console.error(`${LOG_PREFIX.error} ${message}`);
}

function logInfo(message) {
  console.log(`${LOG_PREFIX.info} ${message}`);
}

// Start security patching process
logSecurity('Starting security patch for axios vulnerabilities...');
logSecurity(`Required secure axios version: ${SECURE_AXIOS_VERSION} or higher`);

// Helper function to recursively copy directories
function copyDir(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Get all files and directories in source
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDir(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
      logSuccess(`Copied ${entry.name} to ${dest}`);
    }
  }
}

// Helper function to find all axios instances in node_modules
function findVulnerableAxiosInstances() {
  const vulnerablePaths = [];
  const rootDir = process.cwd();
  
  // Known vulnerable paths from the original script
  const knownVulnerablePaths = [
    'node_modules/@agora-js/media/node_modules/axios',
    'node_modules/@agora-js/report/node_modules/axios',
    'node_modules/@agora-js/shared/node_modules/axios',
    'node_modules/agora-rtc-sdk-ng/node_modules/axios'
  ];
  
  // Add known vulnerable paths
  knownVulnerablePaths.forEach(vulnPath => {
    const fullPath = path.resolve(rootDir, vulnPath);
    if (fs.existsSync(fullPath)) {
      vulnerablePaths.push(vulnPath);
    }
  });
  
  // Support for pnpm workspace structure
  // Check for .pnpm directory which is specific to pnpm
  const pnpmDir = path.resolve(rootDir, 'node_modules/.pnpm');
  if (fs.existsSync(pnpmDir)) {
    logInfo('Detected pnpm workspace structure, scanning for vulnerable axios packages...');
    
    // Find all axios instances in pnpm structure
    try {
      // Use find command to locate all axios package.json files
      const findCommand = `find ${pnpmDir} -path */axios/package.json`;
      const axiosPackageJsonPaths = execSync(findCommand, { encoding: 'utf8' }).split('\n').filter(Boolean);
      
      for (const packageJsonPath of axiosPackageJsonPaths) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          // Check if it's a vulnerable version (less than 1.6.8)
          if (packageJson.version && packageJson.version < SECURE_AXIOS_VERSION) {
            const axiosDir = path.dirname(packageJsonPath);
            const relativePath = path.relative(rootDir, axiosDir);
            vulnerablePaths.push(relativePath);
            logWarning(`Found vulnerable axios v${packageJson.version} at ${relativePath}`);
          }
        } catch (e) {
          logWarning(`Could not parse package.json at ${packageJsonPath}: ${e.message}`);
        }
      }
    } catch (e) {
      logWarning(`Error scanning pnpm directory: ${e.message}`);
    }
  }
  
  // Scan for vulnerable axios in npm/yarn workspace structure
  try {
    // Look for workspace packages defined in package.json
    const rootPackageJsonPath = path.resolve(rootDir, 'package.json');
    if (fs.existsSync(rootPackageJsonPath)) {
      const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));
      
      // Get workspace patterns from package.json
      const workspaces = rootPackageJson.workspaces || [];
      let workspacePatterns = [];
      
      if (Array.isArray(workspaces)) {
        workspacePatterns = workspaces;
      } else if (workspaces.packages) {
        workspacePatterns = workspaces.packages;
      }
      
      if (workspacePatterns.length > 0) {
        logInfo(`Detected workspace configuration, scanning packages...`);
        
        // For each workspace pattern, find package directories
        for (const pattern of workspacePatterns) {
          try {
            // Use find command to locate all package.json files in workspace
            const findCommand = `find ${rootDir}/${pattern.replace(/\*/g, '')} -name package.json`;
            const packageJsonPaths = execSync(findCommand, { encoding: 'utf8' }).split('\n').filter(Boolean);
            
            for (const packageJsonPath of packageJsonPaths) {
              // Skip the root package.json
              if (packageJsonPath === rootPackageJsonPath) continue;
              
              const packageDir = path.dirname(packageJsonPath);
              const nodeModulesDir = path.join(packageDir, 'node_modules/axios');
              
              if (fs.existsSync(nodeModulesDir)) {
                try {
                  const axiosPackageJsonPath = path.join(nodeModulesDir, 'package.json');
                  if (fs.existsSync(axiosPackageJsonPath)) {
                    const axiosPackageJson = JSON.parse(fs.readFileSync(axiosPackageJsonPath, 'utf8'));
                    if (axiosPackageJson.version && axiosPackageJson.version < SECURE_AXIOS_VERSION) {
                      const relativePath = path.relative(rootDir, nodeModulesDir);
                      vulnerablePaths.push(relativePath);
                      logWarning(`Found vulnerable axios v${axiosPackageJson.version} at ${relativePath}`);
                    }
                  }
                } catch (e) {
                  logWarning(`Error checking axios in ${nodeModulesDir}: ${e.message}`);
                }
              }
            }
          } catch (e) {
            logWarning(`Error scanning workspace pattern ${pattern}: ${e.message}`);
          }
        }
      }
    }
  } catch (e) {
    logWarning(`Error scanning workspaces: ${e.message}`);
  }
  
  return vulnerablePaths;
}

// Check if secure axios version is installed
async function ensureSecureAxiosVersion() {
  let secureAxiosInstalled = false;
  const rootAxiosPath = path.resolve(process.cwd(), 'node_modules/axios');
  
  if (fs.existsSync(rootAxiosPath)) {
    const packageJsonPath = path.join(rootAxiosPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        // Check if it's a secure version (1.6.8 or higher)
        if (packageJson.version && packageJson.version >= SECURE_AXIOS_VERSION) {
          logSuccess(`Secure axios version ${packageJson.version} already installed`);
          logSecurity(`Using axios v${packageJson.version} for security patching`);
          secureAxiosInstalled = true;
        } else {
          logWarning(`Found axios v${packageJson.version} at root, but it's below the secure version ${SECURE_AXIOS_VERSION}`);
        }
      } catch (e) {
        logWarning(`Error parsing axios package.json: ${e.message}`);
      }
    }
  }
  
  // If secure version isn't found, try to install it
  if (!secureAxiosInstalled) {
    logInfo(`${LOG_PREFIX.package} Installing secure axios version ${SECURE_AXIOS_VERSION}...`);
    try {
      // Detect package manager
      let packageManager = 'npm';
      if (fs.existsSync(path.resolve(process.cwd(), 'yarn.lock'))) {
        packageManager = 'yarn';
      } else if (fs.existsSync(path.resolve(process.cwd(), 'pnpm-lock.yaml'))) {
        packageManager = 'pnpm';
      }
      
      logInfo(`Using ${packageManager} to install secure axios version`);
      
      // Install command based on package manager
      let installCommand;
      switch (packageManager) {
        case 'yarn':
          installCommand = `yarn add axios@${SECURE_AXIOS_VERSION} --no-save`;
          break;
        case 'pnpm':
          installCommand = `pnpm add axios@${SECURE_AXIOS_VERSION} --no-save`;
          break;
        default:
          installCommand = `npm install axios@${SECURE_AXIOS_VERSION} --no-save`;
      }
      
      execSync(installCommand, { stdio: 'inherit' });
      
      // Verify installation
      if (fs.existsSync(rootAxiosPath)) {
        const packageJsonPath = path.join(rootAxiosPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.version && packageJson.version >= SECURE_AXIOS_VERSION) {
            logSuccess(`Successfully installed axios v${packageJson.version}`);
            logSecurity(`Using axios v${packageJson.version} for security patching`);
            secureAxiosInstalled = true;
          }
        }
      }
    } catch (installError) {
      logWarning(`Could not install axios directly: ${installError.message}`);
      logInfo('Checking if a secure version exists despite the install error...');
      
      // Check again if a secure version exists despite the install error
      if (fs.existsSync(rootAxiosPath)) {
        const packageJsonPath = path.join(rootAxiosPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            if (packageJson.version && packageJson.version >= SECURE_AXIOS_VERSION) {
              logSuccess(`Found secure axios version ${packageJson.version} to use for patching`);
              logSecurity(`Using axios v${packageJson.version} for security patching`);
              secureAxiosInstalled = true;
            }
          } catch (e) {
            logWarning(`Error parsing axios package.json: ${e.message}`);
          }
        }
      }
    }
  }
  
  return secureAxiosInstalled;
}

// Patch vulnerable axios instances
function patchVulnerableAxiosInstances(vulnerablePaths) {
  const secureAxiosPath = path.resolve(process.cwd(), 'node_modules/axios');
  
  if (!fs.existsSync(secureAxiosPath)) {
    throw new Error('Secure axios installation not found');
  }
  
  // Get secure axios version for logging
  let secureVersion = SECURE_AXIOS_VERSION;
  try {
    const packageJsonPath = path.join(secureAxiosPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      secureVersion = packageJson.version;
    }
  } catch (e) {
    logWarning(`Could not determine exact secure axios version: ${e.message}`);
  }
  
  // Copy secure axios files to vulnerable locations
  let patchedCount = 0;
  for (const vulnerablePath of vulnerablePaths) {
    const fullPath = path.resolve(process.cwd(), vulnerablePath);
    
    if (fs.existsSync(fullPath)) {
      logInfo(`${LOG_PREFIX.patch} Patching vulnerable axios at ${vulnerablePath}`);
      
      // Update package.json with secure version
      const packageJsonPath = path.join(fullPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          const originalVersion = packageJson.version;
          packageJson.version = secureVersion;
          fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
          logSuccess(`Updated ${packageJsonPath} from version ${originalVersion} to ${secureVersion}`);
          logSecurity(`Patched axios from v${originalVersion} to v${secureVersion} at ${vulnerablePath}`);
        } catch (e) {
          logError(`Error updating ${packageJsonPath}: ${e.message}`);
        }
      }
      
      // Copy secure files from node_modules/axios to vulnerable path
      try {
        // Copy lib directory which contains the source code
        const sourceLibPath = path.join(secureAxiosPath, 'lib');
        const targetLibPath = path.join(fullPath, 'lib');
        if (fs.existsSync(sourceLibPath)) {
          copyDir(sourceLibPath, targetLibPath);
          logSuccess(`Copied lib directory to ${targetLibPath}`);
        }
        
        // Copy dist directory which contains the built code
        const sourceDistPath = path.join(secureAxiosPath, 'dist');
        const targetDistPath = path.join(fullPath, 'dist');
        if (fs.existsSync(sourceDistPath)) {
          copyDir(sourceDistPath, targetDistPath);
          logSuccess(`Copied dist directory to ${targetDistPath}`);
        }
        
        // Copy top-level files
        const filesToCopy = ['index.js', 'index.d.ts', 'axios.js', 'README.md', 'CHANGELOG.md'];
        filesToCopy.forEach(file => {
          const sourceFile = path.join(secureAxiosPath, file);
          const targetFile = path.join(fullPath, file);
          if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, targetFile);
            logSuccess(`Copied ${file} to ${fullPath}`);
          }
        });
        
        patchedCount++;
      } catch (e) {
        logError(`Error copying secure axios files: ${e.message}`);
      }
    } else {
      logWarning(`Path not found: ${vulnerablePath}`);
    }
  }
  
  return patchedCount;
}

// Write security log to file
function writeSecurityLog() {
  try {
    const logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const logFile = path.join(logDir, `axios-security-patch-${timestamp}.log`);
    
    fs.writeFileSync(logFile, securityLog.join('\n'), 'utf8');
    logSuccess(`Security compliance log written to ${logFile}`);
    return logFile;
  } catch (e) {
    logWarning(`Could not write security log: ${e.message}`);
    return null;
  }
}

// Main execution
async function main() {
  try {
    // Step 1: Find vulnerable axios instances
    logInfo('Scanning for vulnerable axios instances...');
    const vulnerablePaths = findVulnerableAxiosInstances();
    
    if (vulnerablePaths.length === 0) {
      logSuccess('No vulnerable axios instances found!');
      logSecurity('No vulnerable axios instances detected in the project');
      console.log(`${LOG_PREFIX.complete} Security check completed successfully!`);
      writeSecurityLog();
      return;
    }
    
    logInfo(`Found ${vulnerablePaths.length} vulnerable axios instance(s)`);
    logSecurity(`Detected ${vulnerablePaths.length} vulnerable axios instance(s) that need patching`);
    
    // Step 2: Ensure secure axios version is available
    const secureAxiosAvailable = await ensureSecureAxiosVersion();
    
    if (!secureAxiosAvailable) {
      throw new Error('Could not find or install a secure axios version to use for patching');
    }
    
    // Step 3: Patch vulnerable instances
    const patchedCount = patchVulnerableAxiosInstances(vulnerablePaths);
    
    // Step 4: Write security log
    const logFile = writeSecurityLog();
    
    // Final report
    console.log(`${LOG_PREFIX.complete} Patch completed successfully!`);
    logSuccess(`Patched ${patchedCount} of ${vulnerablePaths.length} vulnerable axios instance(s)`);
    logSecurity(`Successfully patched ${patchedCount} vulnerable axios instance(s)`);
    
    if (logFile) {
      logInfo(`Security compliance log: ${logFile}`);
    }
    
    logWarning('Note: npm/yarn/pnpm audit may still report vulnerabilities based on package dependencies,');
    logWarning('but the actual code has been replaced with secure versions.');
  } catch (error) {
    logError(`Patch failed: ${error.message}`);
    logSecurity(`FAILED: Axios security patch encountered an error: ${error.message}`);
    writeSecurityLog();
    process.exit(1);
  }
}

// Execute main function
main();