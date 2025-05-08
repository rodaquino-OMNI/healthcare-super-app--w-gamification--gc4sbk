#!/usr/bin/env node

/**
 * TypeScript Configuration Management Utility
 * 
 * This utility standardizes and validates tsconfig.json files across the monorepo.
 * It ensures consistent compiler options, proper project references, and compatible
 * module resolution settings.
 * 
 * Features:
 * - Generate or update tsconfig.json files based on project needs
 * - Validate existing configurations
 * - Fix common TypeScript configuration issues
 * - Implement proper project references for build ordering
 * - Standardize path aliases across the monorepo
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Emoji indicators for console output
const emoji = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  working: '🔧',
  rocket: '🚀',
  check: '✓',
  cross: '✗'
};

// Define the services that need their tsconfig.json managed
const SERVICES = [
  'api-gateway',
  'auth-service',
  'care-service', 
  'health-service',
  'plan-service',
  'gamification-engine',
  'notification-service',
  'shared'
];

// Base directory for the backend
const BASE_DIR = path.resolve(__dirname, '../..');

// Standard compiler options for the root tsconfig.json
const ROOT_COMPILER_OPTIONS = {
  "target": "es2021",
  "module": "commonjs",
  "moduleResolution": "node",
  "declaration": true,
  "removeComments": true,
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true,
  "allowSyntheticDefaultImports": true,
  "sourceMap": true,
  "outDir": "./dist",
  "baseUrl": ".",
  "incremental": true,
  "skipLibCheck": true,
  "strict": false,
  "strictNullChecks": false,
  "noImplicitAny": false,
  "strictBindCallApply": false,
  "forceConsistentCasingInFileNames": true,
  "noFallthroughCasesInSwitch": true,
  "esModuleInterop": true,
  "resolveJsonModule": true,
  "lib": ["es2021"],
  "paths": {}
};

// Standard compiler options for service-specific tsconfig.json
const SERVICE_COMPILER_OPTIONS = {
  "outDir": "./dist",
  "baseUrl": ".",
  "composite": true,
  "declaration": true,
  "rootDir": "src",
  "paths": {}
};

/**
 * Logger utility for consistent console output
 */
class Logger {
  static info(message) {
    console.log(`${emoji.info} ${colors.blue}${message}${colors.reset}`);
  }

  static success(message) {
    console.log(`${emoji.success} ${colors.green}${message}${colors.reset}`);
  }

  static error(message) {
    console.error(`${emoji.error} ${colors.red}${message}${colors.reset}`);
  }

  static warning(message) {
    console.warn(`${emoji.warning} ${colors.yellow}${message}${colors.reset}`);
  }

  static working(message) {
    console.log(`${emoji.working} ${colors.cyan}${message}${colors.reset}`);
  }

  static result(success, message) {
    if (success) {
      this.success(message);
    } else {
      this.error(message);
    }
  }
}

/**
 * Utility functions for file operations
 */
class FileUtils {
  /**
   * Read a JSON file
   * @param {string} filePath - Path to the JSON file
   * @returns {Object|null} - Parsed JSON object or null if file doesn't exist
   */
  static readJsonFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
      return null;
    } catch (error) {
      Logger.error(`Error reading ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Write a JSON file
   * @param {string} filePath - Path to the JSON file
   * @param {Object} data - Data to write
   * @returns {boolean} - Success status
   */
  static writeJsonFile(filePath, data) {
    try {
      const content = JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, content);
      return true;
    } catch (error) {
      Logger.error(`Error writing ${filePath}: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a backup of a file
   * @param {string} filePath - Path to the file
   * @returns {string|null} - Path to the backup file or null if failed
   */
  static createBackup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const backupPath = `${filePath}.backup-${Date.now()}`;
        fs.copyFileSync(filePath, backupPath);
        return backupPath;
      }
      return null;
    } catch (error) {
      Logger.error(`Error creating backup of ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Restore a file from backup
   * @param {string} backupPath - Path to the backup file
   * @param {string} originalPath - Path to the original file
   * @returns {boolean} - Success status
   */
  static restoreFromBackup(backupPath, originalPath) {
    try {
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, originalPath);
        return true;
      }
      return false;
    } catch (error) {
      Logger.error(`Error restoring from backup: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete a file
   * @param {string} filePath - Path to the file
   * @returns {boolean} - Success status
   */
  static deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return true; // File doesn't exist, so deletion is technically successful
    } catch (error) {
      Logger.error(`Error deleting ${filePath}: ${error.message}`);
      return false;
    }
  }
}

/**
 * TypeScript configuration validator
 */
class TsConfigValidator {
  /**
   * Validate a tsconfig.json file
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @returns {Object} - Validation result with status and issues
   */
  static validate(tsconfigPath) {
    const result = {
      valid: true,
      issues: []
    };

    // Check if file exists
    if (!fs.existsSync(tsconfigPath)) {
      result.valid = false;
      result.issues.push(`File does not exist: ${tsconfigPath}`);
      return result;
    }

    // Read the file
    const tsconfig = FileUtils.readJsonFile(tsconfigPath);
    if (!tsconfig) {
      result.valid = false;
      result.issues.push(`Failed to read or parse: ${tsconfigPath}`);
      return result;
    }

    // Check for required properties
    if (!tsconfig.compilerOptions) {
      result.valid = false;
      result.issues.push('Missing compilerOptions');
    }

    // Check for outDir
    if (!tsconfig.compilerOptions?.outDir) {
      result.valid = false;
      result.issues.push('Missing compilerOptions.outDir');
    }

    // Check for include
    if (!tsconfig.include || !Array.isArray(tsconfig.include) || tsconfig.include.length === 0) {
      result.valid = false;
      result.issues.push('Missing or invalid include array');
    }

    // Check for exclude
    if (!tsconfig.exclude || !Array.isArray(tsconfig.exclude)) {
      result.valid = false;
      result.issues.push('Missing or invalid exclude array');
    }

    // For service configs, check for extends
    if (tsconfigPath !== path.join(BASE_DIR, 'tsconfig.json') && !tsconfig.extends) {
      result.valid = false;
      result.issues.push('Service tsconfig should extend from root tsconfig');
    }

    // For root config with references, validate references
    if (tsconfig.references && Array.isArray(tsconfig.references)) {
      for (const ref of tsconfig.references) {
        if (!ref.path) {
          result.valid = false;
          result.issues.push('Reference missing path property');
          continue;
        }

        const refPath = path.resolve(path.dirname(tsconfigPath), ref.path);
        if (!fs.existsSync(refPath)) {
          result.valid = false;
          result.issues.push(`Referenced path does not exist: ${ref.path}`);
        } else if (!fs.existsSync(path.join(refPath, 'tsconfig.json'))) {
          result.valid = false;
          result.issues.push(`No tsconfig.json in referenced path: ${ref.path}`);
        }
      }
    }

    return result;
  }

  /**
   * Validate all tsconfig.json files in the monorepo
   * @returns {Object} - Validation results for all configs
   */
  static validateAll() {
    const results = {};
    let allValid = true;

    // Validate root tsconfig
    const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
    results.root = this.validate(rootTsconfigPath);
    allValid = allValid && results.root.valid;

    // Validate service tsconfigs
    results.services = {};
    for (const service of SERVICES) {
      const serviceTsconfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
      results.services[service] = this.validate(serviceTsconfigPath);
      allValid = allValid && results.services[service].valid;
    }

    return {
      allValid,
      results
    };
  }

  /**
   * Run TypeScript compiler to check for errors
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @returns {Object} - Result with status and output
   */
  static runTsc(tsconfigPath) {
    try {
      const output = execSync(`npx tsc --noEmit -p ${tsconfigPath}`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return {
        success: true,
        output
      };
    } catch (error) {
      return {
        success: false,
        output: error.stdout || error.message
      };
    }
  }
}

/**
 * TypeScript configuration generator
 */
class TsConfigGenerator {
  /**
   * Generate a root tsconfig.json
   * @param {Object} options - Custom options to merge
   * @returns {Object} - Generated tsconfig.json content
   */
  static generateRootConfig(options = {}) {
    const compilerOptions = { ...ROOT_COMPILER_OPTIONS };
    
    // Add path mappings for all services
    compilerOptions.paths = compilerOptions.paths || {};
    SERVICES.forEach(service => {
      // Convert service name to camelCase for the path mapping
      const pathKey = `@app/${service.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
      const pathValue = service === 'shared' 
        ? [`./shared/src/*`] 
        : [`./${service}/src/*`];
      
      compilerOptions.paths[pathKey] = pathValue;
    });

    // Add @austa/* path mapping
    compilerOptions.paths['@austa/*'] = ['./packages/*'];

    // Add @prisma/* path mapping
    compilerOptions.paths['@prisma/*'] = ['./shared/prisma/*'];

    // Merge with custom options
    if (options.compilerOptions) {
      Object.assign(compilerOptions, options.compilerOptions);
    }

    // Create references to all services
    const references = SERVICES.map(service => ({ path: `./${service}` }));

    return {
      compilerOptions,
      exclude: [
        "node_modules",
        "dist",
        "**/*.spec.ts",
        "**/*.test.ts"
      ],
      references
    };
  }

  /**
   * Generate a service-specific tsconfig.json
   * @param {string} serviceName - Name of the service
   * @param {Object} options - Custom options to merge
   * @returns {Object} - Generated tsconfig.json content
   */
  static generateServiceConfig(serviceName, options = {}) {
    const compilerOptions = { ...SERVICE_COMPILER_OPTIONS };
    
    // Add a service-specific path alias
    compilerOptions.paths = compilerOptions.paths || {};
    // Convert serviceName to camelCase for the path mapping
    const pathKey = `@${serviceName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
    compilerOptions.paths[pathKey] = ["src/*"];
    
    // Merge with custom options
    if (options.compilerOptions) {
      Object.assign(compilerOptions, options.compilerOptions);
    }

    const config = {
      "extends": "../tsconfig.json",
      "compilerOptions": compilerOptions,
      "include": ["src/**/*"],
      "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
    };
    
    // If it's not the shared module, add a reference to shared
    if (serviceName !== 'shared') {
      config.references = [{ "path": "../shared" }];
    }

    return config;
  }

  /**
   * Generate all tsconfig.json files for the monorepo
   * @param {Object} options - Options for generation
   * @returns {boolean} - Success status
   */
  static generateAll(options = {}) {
    const { dryRun = false, backup = true } = options;
    let success = true;

    // Generate root tsconfig.json
    Logger.working(`Generating root tsconfig.json...`);
    const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
    const rootConfig = this.generateRootConfig(options.root || {});
    
    if (dryRun) {
      Logger.info(`Would write to ${rootTsconfigPath}:\n${JSON.stringify(rootConfig, null, 2)}`);
    } else {
      if (backup) {
        const backupPath = FileUtils.createBackup(rootTsconfigPath);
        if (backupPath) {
          Logger.info(`Created backup of root tsconfig.json at ${backupPath}`);
        }
      }
      success = FileUtils.writeJsonFile(rootTsconfigPath, rootConfig) && success;
    }

    // Generate service tsconfig.json files
    for (const service of SERVICES) {
      Logger.working(`Generating tsconfig.json for ${service}...`);
      const serviceTsconfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
      const serviceConfig = this.generateServiceConfig(service, options.services?.[service] || {});
      
      if (dryRun) {
        Logger.info(`Would write to ${serviceTsconfigPath}:\n${JSON.stringify(serviceConfig, null, 2)}`);
      } else {
        if (backup) {
          const backupPath = FileUtils.createBackup(serviceTsconfigPath);
          if (backupPath) {
            Logger.info(`Created backup of ${service} tsconfig.json at ${backupPath}`);
          }
        }
        success = FileUtils.writeJsonFile(serviceTsconfigPath, serviceConfig) && success;
      }
    }

    return success;
  }
}

/**
 * TypeScript configuration updater
 */
class TsConfigUpdater {
  /**
   * Update an existing tsconfig.json file
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @param {Object} updates - Updates to apply
   * @param {Object} options - Options for the update
   * @returns {boolean} - Success status
   */
  static update(tsconfigPath, updates, options = {}) {
    const { dryRun = false, backup = true } = options;
    
    // Read existing config
    const existingConfig = FileUtils.readJsonFile(tsconfigPath);
    if (!existingConfig) {
      Logger.error(`Failed to read ${tsconfigPath}`);
      return false;
    }

    // Create a deep copy of the existing config
    const updatedConfig = JSON.parse(JSON.stringify(existingConfig));

    // Apply updates
    if (updates.compilerOptions) {
      updatedConfig.compilerOptions = updatedConfig.compilerOptions || {};
      Object.assign(updatedConfig.compilerOptions, updates.compilerOptions);
    }

    if (updates.include) {
      updatedConfig.include = updates.include;
    }

    if (updates.exclude) {
      updatedConfig.exclude = updates.exclude;
    }

    if (updates.extends) {
      updatedConfig.extends = updates.extends;
    }

    if (updates.references) {
      updatedConfig.references = updates.references;
    }

    // Write updated config
    if (dryRun) {
      Logger.info(`Would update ${tsconfigPath} with:\n${JSON.stringify(updatedConfig, null, 2)}`);
      return true;
    } else {
      if (backup) {
        const backupPath = FileUtils.createBackup(tsconfigPath);
        if (backupPath) {
          Logger.info(`Created backup of ${tsconfigPath} at ${backupPath}`);
        }
      }
      return FileUtils.writeJsonFile(tsconfigPath, updatedConfig);
    }
  }

  /**
   * Update path mappings in a tsconfig.json file
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @param {Object} pathMappings - Path mappings to add or update
   * @param {Object} options - Options for the update
   * @returns {boolean} - Success status
   */
  static updatePaths(tsconfigPath, pathMappings, options = {}) {
    const { dryRun = false, backup = true } = options;
    
    // Read existing config
    const existingConfig = FileUtils.readJsonFile(tsconfigPath);
    if (!existingConfig) {
      Logger.error(`Failed to read ${tsconfigPath}`);
      return false;
    }

    // Create a deep copy of the existing config
    const updatedConfig = JSON.parse(JSON.stringify(existingConfig));

    // Ensure compilerOptions and paths exist
    updatedConfig.compilerOptions = updatedConfig.compilerOptions || {};
    updatedConfig.compilerOptions.paths = updatedConfig.compilerOptions.paths || {};

    // Apply path mappings
    Object.assign(updatedConfig.compilerOptions.paths, pathMappings);

    // Write updated config
    if (dryRun) {
      Logger.info(`Would update paths in ${tsconfigPath} with:\n${JSON.stringify(updatedConfig.compilerOptions.paths, null, 2)}`);
      return true;
    } else {
      if (backup) {
        const backupPath = FileUtils.createBackup(tsconfigPath);
        if (backupPath) {
          Logger.info(`Created backup of ${tsconfigPath} at ${backupPath}`);
        }
      }
      return FileUtils.writeJsonFile(tsconfigPath, updatedConfig);
    }
  }

  /**
   * Update project references in a tsconfig.json file
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @param {Array} references - References to set
   * @param {Object} options - Options for the update
   * @returns {boolean} - Success status
   */
  static updateReferences(tsconfigPath, references, options = {}) {
    const { dryRun = false, backup = true } = options;
    
    // Read existing config
    const existingConfig = FileUtils.readJsonFile(tsconfigPath);
    if (!existingConfig) {
      Logger.error(`Failed to read ${tsconfigPath}`);
      return false;
    }

    // Create a deep copy of the existing config
    const updatedConfig = JSON.parse(JSON.stringify(existingConfig));

    // Set references
    updatedConfig.references = references;

    // Write updated config
    if (dryRun) {
      Logger.info(`Would update references in ${tsconfigPath} with:\n${JSON.stringify(updatedConfig.references, null, 2)}`);
      return true;
    } else {
      if (backup) {
        const backupPath = FileUtils.createBackup(tsconfigPath);
        if (backupPath) {
          Logger.info(`Created backup of ${tsconfigPath} at ${backupPath}`);
        }
      }
      return FileUtils.writeJsonFile(tsconfigPath, updatedConfig);
    }
  }
}

/**
 * TypeScript configuration fixer
 */
class TsConfigFixer {
  /**
   * Fix common issues in a tsconfig.json file
   * @param {string} tsconfigPath - Path to the tsconfig.json file
   * @param {Object} options - Options for the fix
   * @returns {boolean} - Success status
   */
  static fix(tsconfigPath, options = {}) {
    const { dryRun = false, backup = true } = options;
    
    // Read existing config
    const existingConfig = FileUtils.readJsonFile(tsconfigPath);
    if (!existingConfig) {
      Logger.error(`Failed to read ${tsconfigPath}`);
      return false;
    }

    // Create a deep copy of the existing config
    const fixedConfig = JSON.parse(JSON.stringify(existingConfig));

    // Fix common issues
    const isRootConfig = tsconfigPath === path.join(BASE_DIR, 'tsconfig.json');
    const serviceName = isRootConfig ? null : path.basename(path.dirname(tsconfigPath));

    // 1. Ensure compilerOptions exists
    fixedConfig.compilerOptions = fixedConfig.compilerOptions || {};

    // 2. Ensure outDir is set
    if (!fixedConfig.compilerOptions.outDir) {
      fixedConfig.compilerOptions.outDir = './dist';
    }

    // 3. Ensure include and exclude are set
    if (!fixedConfig.include || !Array.isArray(fixedConfig.include) || fixedConfig.include.length === 0) {
      fixedConfig.include = isRootConfig ? ["**/*.ts"] : ["src/**/*"];
    }

    if (!fixedConfig.exclude || !Array.isArray(fixedConfig.exclude)) {
      fixedConfig.exclude = ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"];
    }

    // 4. For service configs, ensure extends is set
    if (!isRootConfig && !fixedConfig.extends) {
      fixedConfig.extends = "../tsconfig.json";
    }

    // 5. For service configs, ensure composite is set for project references
    if (!isRootConfig && !fixedConfig.compilerOptions.composite) {
      fixedConfig.compilerOptions.composite = true;
    }

    // 6. For service configs, ensure rootDir is set
    if (!isRootConfig && !fixedConfig.compilerOptions.rootDir) {
      fixedConfig.compilerOptions.rootDir = "src";
    }

    // 7. For service configs, ensure proper references
    if (!isRootConfig && serviceName !== 'shared') {
      fixedConfig.references = [{ "path": "../shared" }];
    }

    // 8. For root config, ensure proper references to all services
    if (isRootConfig) {
      fixedConfig.references = SERVICES.map(service => ({ path: `./${service}` }));
    }

    // 9. Ensure paths are set correctly
    fixedConfig.compilerOptions.paths = fixedConfig.compilerOptions.paths || {};
    
    if (isRootConfig) {
      // Add path mappings for all services in root config
      SERVICES.forEach(service => {
        const pathKey = `@app/${service.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
        const pathValue = service === 'shared' 
          ? [`./shared/src/*`] 
          : [`./${service}/src/*`];
        
        fixedConfig.compilerOptions.paths[pathKey] = pathValue;
      });

      // Add @austa/* path mapping
      fixedConfig.compilerOptions.paths['@austa/*'] = ['./packages/*'];

      // Add @prisma/* path mapping
      fixedConfig.compilerOptions.paths['@prisma/*'] = ['./shared/prisma/*'];
    } else {
      // Add service-specific path alias
      const pathKey = `@${serviceName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
      fixedConfig.compilerOptions.paths[pathKey] = ["src/*"];
    }

    // Write fixed config
    if (dryRun) {
      Logger.info(`Would fix ${tsconfigPath} with:\n${JSON.stringify(fixedConfig, null, 2)}`);
      return true;
    } else {
      if (backup) {
        const backupPath = FileUtils.createBackup(tsconfigPath);
        if (backupPath) {
          Logger.info(`Created backup of ${tsconfigPath} at ${backupPath}`);
        }
      }
      return FileUtils.writeJsonFile(tsconfigPath, fixedConfig);
    }
  }

  /**
   * Fix all tsconfig.json files in the monorepo
   * @param {Object} options - Options for the fix
   * @returns {boolean} - Success status
   */
  static fixAll(options = {}) {
    const { dryRun = false, backup = true } = options;
    let success = true;

    // Fix root tsconfig.json
    Logger.working(`Fixing root tsconfig.json...`);
    const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
    success = this.fix(rootTsconfigPath, { dryRun, backup }) && success;

    // Fix service tsconfig.json files
    for (const service of SERVICES) {
      Logger.working(`Fixing tsconfig.json for ${service}...`);
      const serviceTsconfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
      if (fs.existsSync(serviceTsconfigPath)) {
        success = this.fix(serviceTsconfigPath, { dryRun, backup }) && success;
      } else {
        Logger.warning(`tsconfig.json for ${service} does not exist. Generating a new one...`);
        const serviceConfig = TsConfigGenerator.generateServiceConfig(service);
        if (dryRun) {
          Logger.info(`Would create ${serviceTsconfigPath} with:\n${JSON.stringify(serviceConfig, null, 2)}`);
        } else {
          success = FileUtils.writeJsonFile(serviceTsconfigPath, serviceConfig) && success;
        }
      }
    }

    return success;
  }

  /**
   * Clean up TypeScript build artifacts
   * @returns {boolean} - Success status
   */
  static cleanBuildArtifacts() {
    let success = true;

    // Clean up root tsbuildinfo
    const rootTsBuildInfoPath = path.join(BASE_DIR, 'tsconfig.tsbuildinfo');
    if (fs.existsSync(rootTsBuildInfoPath)) {
      Logger.working(`Removing ${rootTsBuildInfoPath}...`);
      success = FileUtils.deleteFile(rootTsBuildInfoPath) && success;
    }

    // Clean up service tsbuildinfo files
    for (const service of SERVICES) {
      const serviceTsBuildInfoPath = path.join(BASE_DIR, service, 'tsconfig.tsbuildinfo');
      if (fs.existsSync(serviceTsBuildInfoPath)) {
        Logger.working(`Removing ${serviceTsBuildInfoPath}...`);
        success = FileUtils.deleteFile(serviceTsBuildInfoPath) && success;
      }
    }

    return success;
  }
}

/**
 * Main TypeScript configuration manager
 */
class TypeScriptConfigManager {
  /**
   * Validate TypeScript configurations
   * @param {Object} options - Options for validation
   * @returns {Object} - Validation results
   */
  static validate(options = {}) {
    const { verbose = false } = options;
    
    Logger.info('Validating TypeScript configurations...');
    const validationResults = TsConfigValidator.validateAll();
    
    if (validationResults.allValid) {
      Logger.success('All TypeScript configurations are valid!');
    } else {
      Logger.error('Some TypeScript configurations have issues:');
      
      // Log root issues
      if (!validationResults.results.root.valid) {
        Logger.error('Root tsconfig.json issues:');
        validationResults.results.root.issues.forEach(issue => {
          Logger.error(`  - ${issue}`);
        });
      }
      
      // Log service issues
      for (const service of SERVICES) {
        if (!validationResults.results.services[service].valid) {
          Logger.error(`${service} tsconfig.json issues:`);
          validationResults.results.services[service].issues.forEach(issue => {
            Logger.error(`  - ${issue}`);
          });
        }
      }
    }
    
    if (verbose) {
      Logger.info('Running TypeScript compiler to check for errors...');
      const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
      const tscResult = TsConfigValidator.runTsc(rootTsconfigPath);
      
      if (tscResult.success) {
        Logger.success('TypeScript compilation successful!');
      } else {
        Logger.error('TypeScript compilation failed:');
        Logger.error(tscResult.output);
      }
    }
    
    return validationResults;
  }

  /**
   * Generate TypeScript configurations
   * @param {Object} options - Options for generation
   * @returns {boolean} - Success status
   */
  static generate(options = {}) {
    Logger.info('Generating TypeScript configurations...');
    const success = TsConfigGenerator.generateAll(options);
    
    if (success) {
      Logger.success('TypeScript configurations generated successfully!');
    } else {
      Logger.error('Failed to generate some TypeScript configurations.');
    }
    
    return success;
  }

  /**
   * Fix TypeScript configurations
   * @param {Object} options - Options for fixing
   * @returns {boolean} - Success status
   */
  static fix(options = {}) {
    const { cleanArtifacts = true } = options;
    
    Logger.info('Fixing TypeScript configurations...');
    const success = TsConfigFixer.fixAll(options);
    
    if (success) {
      Logger.success('TypeScript configurations fixed successfully!');
      
      if (cleanArtifacts) {
        Logger.info('Cleaning up TypeScript build artifacts...');
        const cleanSuccess = TsConfigFixer.cleanBuildArtifacts();
        
        if (cleanSuccess) {
          Logger.success('TypeScript build artifacts cleaned successfully!');
        } else {
          Logger.error('Failed to clean some TypeScript build artifacts.');
        }
      }
    } else {
      Logger.error('Failed to fix some TypeScript configurations.');
    }
    
    return success;
  }

  /**
   * Update TypeScript configurations
   * @param {Object} updates - Updates to apply
   * @param {Object} options - Options for updating
   * @returns {boolean} - Success status
   */
  static update(updates = {}, options = {}) {
    Logger.info('Updating TypeScript configurations...');
    let success = true;
    
    // Update root config if specified
    if (updates.root) {
      Logger.working('Updating root tsconfig.json...');
      const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
      success = TsConfigUpdater.update(rootTsconfigPath, updates.root, options) && success;
    }
    
    // Update service configs if specified
    if (updates.services) {
      for (const service in updates.services) {
        if (SERVICES.includes(service)) {
          Logger.working(`Updating tsconfig.json for ${service}...`);
          const serviceTsconfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
          success = TsConfigUpdater.update(serviceTsconfigPath, updates.services[service], options) && success;
        } else {
          Logger.warning(`Unknown service: ${service}. Skipping.`);
        }
      }
    }
    
    if (success) {
      Logger.success('TypeScript configurations updated successfully!');
    } else {
      Logger.error('Failed to update some TypeScript configurations.');
    }
    
    return success;
  }

  /**
   * Update path mappings in TypeScript configurations
   * @param {Object} pathMappings - Path mappings to update
   * @param {Object} options - Options for updating
   * @returns {boolean} - Success status
   */
  static updatePaths(pathMappings = {}, options = {}) {
    Logger.info('Updating path mappings in TypeScript configurations...');
    let success = true;
    
    // Update root config if specified
    if (pathMappings.root) {
      Logger.working('Updating path mappings in root tsconfig.json...');
      const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
      success = TsConfigUpdater.updatePaths(rootTsconfigPath, pathMappings.root, options) && success;
    }
    
    // Update service configs if specified
    if (pathMappings.services) {
      for (const service in pathMappings.services) {
        if (SERVICES.includes(service)) {
          Logger.working(`Updating path mappings in tsconfig.json for ${service}...`);
          const serviceTsconfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
          success = TsConfigUpdater.updatePaths(serviceTsconfigPath, pathMappings.services[service], options) && success;
        } else {
          Logger.warning(`Unknown service: ${service}. Skipping.`);
        }
      }
    }
    
    if (success) {
      Logger.success('Path mappings updated successfully!');
    } else {
      Logger.error('Failed to update some path mappings.');
    }
    
    return success;
  }

  /**
   * Run a TypeScript check
   * @returns {boolean} - Success status
   */
  static check() {
    Logger.info('Running TypeScript check...');
    const rootTsconfigPath = path.join(BASE_DIR, 'tsconfig.json');
    const tscResult = TsConfigValidator.runTsc(rootTsconfigPath);
    
    if (tscResult.success) {
      Logger.success('TypeScript check passed!');
      return true;
    } else {
      Logger.error('TypeScript check failed:');
      Logger.error(tscResult.output);
      return false;
    }
  }
}

// Export the main class and utility classes
module.exports = {
  TypeScriptConfigManager,
  TsConfigValidator,
  TsConfigGenerator,
  TsConfigUpdater,
  TsConfigFixer,
  FileUtils,
  Logger,
  SERVICES,
  BASE_DIR
};

// CLI functionality
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const options = {};
  
  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--no-backup') {
      options.backup = false;
    } else if (args[i] === '--verbose') {
      options.verbose = true;
    } else if (args[i] === '--no-clean') {
      options.cleanArtifacts = false;
    }
  }
  
  // Execute command
  switch (command) {
    case 'validate':
      TypeScriptConfigManager.validate(options);
      break;
    case 'generate':
      TypeScriptConfigManager.generate(options);
      break;
    case 'fix':
      TypeScriptConfigManager.fix(options);
      break;
    case 'check':
      TypeScriptConfigManager.check();
      break;
    default:
      Logger.error(`Unknown command: ${command}`);
      Logger.info('Available commands:');
      Logger.info('  validate  - Validate TypeScript configurations');
      Logger.info('  generate  - Generate TypeScript configurations');
      Logger.info('  fix       - Fix TypeScript configurations');
      Logger.info('  check     - Run TypeScript check');
      Logger.info('Options:');
      Logger.info('  --dry-run    - Show what would be done without making changes');
      Logger.info('  --no-backup  - Do not create backups of modified files');
      Logger.info('  --verbose    - Show more detailed output');
      Logger.info('  --no-clean   - Do not clean build artifacts when fixing');
      process.exit(1);
  }
}