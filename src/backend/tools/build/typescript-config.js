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

// Define the standard services in the backend monorepo
const STANDARD_SERVICES = [
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
const BASE_DIR = path.resolve(__dirname, '../../');

/**
 * Standard TypeScript compiler options for the root configuration
 */
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
  "composite": true, // Required for project references
  "paths": {}
};

/**
 * Standard TypeScript compiler options for service configurations
 */
const SERVICE_COMPILER_OPTIONS = {
  "outDir": "./dist",
  "baseUrl": ".",
  "composite": true,
  "rootDir": "src",
  "paths": {}
};

/**
 * Standard include/exclude patterns for TypeScript configurations
 */
const STANDARD_INCLUDE_EXCLUDE = {
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
};

/**
 * Reads a tsconfig.json file if it exists
 * @param {string} configPath - Path to the tsconfig.json file
 * @returns {Object|null} - The parsed configuration or null if the file doesn't exist
 */
function readTsConfig(configPath) {
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(configContent);
    }
    return null;
  } catch (error) {
    console.error(`Error reading ${configPath}:`, error.message);
    return null;
  }
}

/**
 * Writes a tsconfig.json file
 * @param {string} configPath - Path to the tsconfig.json file
 * @param {Object} config - The configuration object to write
 * @returns {boolean} - Whether the write was successful
 */
function writeTsConfig(configPath, config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${configPath}:`, error.message);
    return false;
  }
}

/**
 * Generates path mappings for a service
 * @param {string} serviceName - The name of the service
 * @returns {Object} - Path mappings object
 */
function generatePathMappings(serviceName) {
  // Convert serviceName to camelCase for the path mapping
  const pathKey = `@${serviceName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
  return { [pathKey]: ["src/*"] };
}

/**
 * Generates path mappings for all services in the root config
 * @returns {Object} - Path mappings object for the root config
 */
function generateRootPathMappings() {
  const paths = {};
  
  STANDARD_SERVICES.forEach(service => {
    // Convert service name to camelCase for the path mapping
    const pathKey = `@${service.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
    const pathValue = service === 'shared' 
      ? [`./shared/src/*`] 
      : [`./${service}/src/*`];
    
    paths[pathKey] = pathValue;
  });
  
  // Add paths for packages
  paths["@austa/*"] = ["./packages/*/src"];
  
  return paths;
}

/**
 * Generates references for the root config
 * @returns {Array} - Array of reference objects
 */
function generateRootReferences() {
  return STANDARD_SERVICES.map(service => ({ path: `./${service}` }));
}

/**
 * Generates references for a service config
 * @param {string} serviceName - The name of the service
 * @returns {Array} - Array of reference objects
 */
function generateServiceReferences(serviceName) {
  const references = [];
  
  // Always reference shared unless this is the shared module
  if (serviceName !== 'shared') {
    references.push({ path: "../shared" });
  }
  
  // Add references to any packages the service depends on
  // This would need to be customized based on actual dependencies
  
  return references;
}

/**
 * Creates or updates the root tsconfig.json
 * @returns {boolean} - Whether the operation was successful
 */
function updateRootTsConfig() {
  const rootTsConfigPath = path.join(BASE_DIR, 'tsconfig.json');
  console.log(`Processing root ${rootTsConfigPath}...`);
  
  try {
    // Start with a new config or read the existing one
    const existingConfig = readTsConfig(rootTsConfigPath) || {};
    
    // Create the new config with standard options
    const newConfig = {
      compilerOptions: {
        ...ROOT_COMPILER_OPTIONS,
        paths: generateRootPathMappings()
      },
      references: generateRootReferences(),
      ...STANDARD_INCLUDE_EXCLUDE
    };
    
    // Preserve any custom settings from the existing config
    if (existingConfig.compilerOptions) {
      // Merge custom compiler options, but ensure our critical ones are preserved
      const mergedCompilerOptions = {
        ...existingConfig.compilerOptions,
        ...newConfig.compilerOptions,
        // Ensure paths are from our generation
        paths: newConfig.compilerOptions.paths
      };
      
      newConfig.compilerOptions = mergedCompilerOptions;
    }
    
    // Write the updated config
    const success = writeTsConfig(rootTsConfigPath, newConfig);
    if (success) {
      console.log(`✅ Updated root tsconfig.json`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Error updating root tsconfig.json:`, error.message);
    return false;
  }
}

/**
 * Creates or updates a service's tsconfig.json
 * @param {string} serviceName - The name of the service
 * @returns {boolean} - Whether the operation was successful
 */
function updateServiceTsConfig(serviceName) {
  const servicePath = path.join(BASE_DIR, serviceName);
  const tsconfigPath = path.join(servicePath, 'tsconfig.json');
  
  console.log(`Processing ${tsconfigPath}...`);
  
  try {
    // Check if the service directory exists
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service directory not found: ${servicePath}`);
      return false;
    }
    
    // Start with a new config or read the existing one
    const existingConfig = readTsConfig(tsconfigPath) || {};
    
    // Create the new config
    const newConfig = {
      extends: "../tsconfig.json",
      compilerOptions: {
        ...SERVICE_COMPILER_OPTIONS,
        paths: generatePathMappings(serviceName)
      },
      references: generateServiceReferences(serviceName),
      ...STANDARD_INCLUDE_EXCLUDE
    };
    
    // Preserve any custom settings from the existing config
    if (existingConfig.compilerOptions) {
      // Merge custom compiler options, but ensure our critical ones are preserved
      const mergedCompilerOptions = {
        ...existingConfig.compilerOptions,
        ...newConfig.compilerOptions,
        // Ensure paths are from our generation
        paths: newConfig.compilerOptions.paths
      };
      
      newConfig.compilerOptions = mergedCompilerOptions;
    }
    
    // Write the updated config
    const success = writeTsConfig(tsconfigPath, newConfig);
    if (success) {
      console.log(`✅ Updated ${tsconfigPath}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Error updating ${tsconfigPath}:`, error.message);
    return false;
  }
}

/**
 * Validates a TypeScript configuration
 * @param {string} configPath - Path to the tsconfig.json file
 * @returns {Object} - Validation results with errors and warnings
 */
function validateTsConfig(configPath) {
  console.log(`Validating ${configPath}...`);
  
  const results = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  try {
    const config = readTsConfig(configPath);
    
    if (!config) {
      results.valid = false;
      results.errors.push('Configuration file does not exist or is not valid JSON');
      return results;
    }
    
    // Check for required compiler options
    if (!config.compilerOptions) {
      results.valid = false;
      results.errors.push('Missing compilerOptions section');
    } else {
      // Check for critical compiler options
      const criticalOptions = ['target', 'module', 'moduleResolution', 'outDir', 'baseUrl'];
      for (const option of criticalOptions) {
        if (!config.compilerOptions[option]) {
          results.valid = false;
          results.errors.push(`Missing critical compiler option: ${option}`);
        }
      }
      
      // Check for project references if composite is true
      if (config.compilerOptions.composite === true && !config.references) {
        results.warnings.push('Composite project without references');
      }
      
      // Check for paths configuration
      if (!config.compilerOptions.paths) {
        results.warnings.push('No path mappings configured');
      }
    }
    
    // Check for include/exclude patterns
    if (!config.include) {
      results.warnings.push('No include patterns specified');
    }
    
    if (!config.exclude) {
      results.warnings.push('No exclude patterns specified');
    }
    
    // For service configs, check for extends
    if (configPath !== path.join(BASE_DIR, 'tsconfig.json') && !config.extends) {
      results.warnings.push('Service config does not extend from root config');
    }
    
    return results;
  } catch (error) {
    results.valid = false;
    results.errors.push(`Error validating config: ${error.message}`);
    return results;
  }
}

/**
 * Cleans up TypeScript build info files
 * @returns {boolean} - Whether the operation was successful
 */
function cleanTsBuildInfo() {
  console.log('🧹 Cleaning TypeScript build info files...');
  try {
    STANDARD_SERVICES.forEach(service => {
      const servicePath = path.join(BASE_DIR, service);
      const tsBuildInfoPath = path.join(servicePath, 'tsconfig.tsbuildinfo');
      
      if (fs.existsSync(tsBuildInfoPath)) {
        fs.unlinkSync(tsBuildInfoPath);
        console.log(`✅ Removed ${tsBuildInfoPath}`);
      }
    });
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning tsbuildinfo files:`, error.message);
    return false;
  }
}

/**
 * Runs TypeScript compiler to check for errors
 * @returns {boolean} - Whether the TypeScript check was successful
 */
function runTypeScriptCheck() {
  console.log('\n🔍 Running TypeScript check...');
  
  try {
    execSync('npx tsc --noEmit', { cwd: BASE_DIR, stdio: 'inherit' });
    console.log('✅ TypeScript check successful!');
    return true;
  } catch (buildError) {
    console.log('⚠️ TypeScript check failed. There are type errors to fix.');
    return false;
  }
}

/**
 * Detects and fixes common TypeScript configuration issues
 * @param {string} configPath - Path to the tsconfig.json file
 * @returns {boolean} - Whether fixes were applied successfully
 */
function fixCommonIssues(configPath) {
  console.log(`Fixing common issues in ${configPath}...`);
  
  try {
    const config = readTsConfig(configPath);
    
    if (!config) {
      console.error(`❌ Cannot fix issues: Configuration file does not exist or is not valid JSON`);
      return false;
    }
    
    let modified = false;
    
    // Ensure compilerOptions exists
    if (!config.compilerOptions) {
      config.compilerOptions = {};
      modified = true;
    }
    
    // Fix common issues with compiler options
    const fixes = {
      // Ensure proper module resolution
      moduleResolution: 'node',
      // Ensure proper target
      target: 'es2021',
      // Ensure proper module
      module: 'commonjs',
      // Enable decorator metadata for NestJS
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      // Fix common issues with imports
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      // Enable incremental builds
      incremental: true,
      // Fix common issues with strict mode
      strict: false,
      // Fix common issues with case sensitivity
      forceConsistentCasingInFileNames: true
    };
    
    for (const [key, value] of Object.entries(fixes)) {
      if (config.compilerOptions[key] !== value) {
        config.compilerOptions[key] = value;
        modified = true;
      }
    }
    
    // Ensure include/exclude patterns exist
    if (!config.include) {
      config.include = STANDARD_INCLUDE_EXCLUDE.include;
      modified = true;
    }
    
    if (!config.exclude) {
      config.exclude = STANDARD_INCLUDE_EXCLUDE.exclude;
      modified = true;
    }
    
    // If this is a service config, ensure it extends from root
    if (configPath !== path.join(BASE_DIR, 'tsconfig.json') && !config.extends) {
      config.extends = '../tsconfig.json';
      modified = true;
    }
    
    // Write the updated config if changes were made
    if (modified) {
      const success = writeTsConfig(configPath, config);
      if (success) {
        console.log(`✅ Fixed issues in ${configPath}`);
      }
      return success;
    } else {
      console.log(`✅ No issues to fix in ${configPath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing issues in ${configPath}:`, error.message);
    return false;
  }
}

/**
 * Updates TypeScript configurations for all services
 * @returns {boolean} - Whether the operation was successful
 */
function updateAllConfigurations() {
  console.log('🔄 Updating all TypeScript configurations...');
  
  // First, update the root configuration
  let success = updateRootTsConfig();
  
  // Then, update each service configuration
  for (const service of STANDARD_SERVICES) {
    const result = updateServiceTsConfig(service);
    success = success && result;
  }
  
  // Clean up build info files
  const cleanResult = cleanTsBuildInfo();
  success = success && cleanResult;
  
  // Run TypeScript check
  const checkResult = runTypeScriptCheck();
  
  if (success) {
    console.log('\n🎉 TypeScript configurations updated successfully!');
    console.log('⚠️ You may need to restart your TypeScript server for changes to take effect.');
  } else {
    console.error('\n❌ There were errors updating TypeScript configurations.');
  }
  
  return success;
}

/**
 * Validates all TypeScript configurations
 * @returns {boolean} - Whether all configurations are valid
 */
function validateAllConfigurations() {
  console.log('🔍 Validating all TypeScript configurations...');
  
  let allValid = true;
  
  // Validate root configuration
  const rootConfigPath = path.join(BASE_DIR, 'tsconfig.json');
  const rootResults = validateTsConfig(rootConfigPath);
  
  if (!rootResults.valid) {
    allValid = false;
    console.error(`❌ Root configuration has errors:`);
    rootResults.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (rootResults.warnings.length > 0) {
    console.warn(`⚠️ Root configuration has warnings:`);
    rootResults.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  // Validate each service configuration
  for (const service of STANDARD_SERVICES) {
    const serviceConfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
    const serviceResults = validateTsConfig(serviceConfigPath);
    
    if (!serviceResults.valid) {
      allValid = false;
      console.error(`❌ ${service} configuration has errors:`);
      serviceResults.errors.forEach(error => console.error(`  - ${error}`));
    }
    
    if (serviceResults.warnings.length > 0) {
      console.warn(`⚠️ ${service} configuration has warnings:`);
      serviceResults.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  if (allValid) {
    console.log('\n✅ All TypeScript configurations are valid!');
  } else {
    console.error('\n❌ Some TypeScript configurations have errors.');
  }
  
  return allValid;
}

/**
 * Fixes common issues in all TypeScript configurations
 * @returns {boolean} - Whether all fixes were applied successfully
 */
function fixAllConfigurations() {
  console.log('🔧 Fixing common issues in all TypeScript configurations...');
  
  let allFixed = true;
  
  // Fix root configuration
  const rootConfigPath = path.join(BASE_DIR, 'tsconfig.json');
  const rootResult = fixCommonIssues(rootConfigPath);
  allFixed = allFixed && rootResult;
  
  // Fix each service configuration
  for (const service of STANDARD_SERVICES) {
    const serviceConfigPath = path.join(BASE_DIR, service, 'tsconfig.json');
    const serviceResult = fixCommonIssues(serviceConfigPath);
    allFixed = allFixed && serviceResult;
  }
  
  // Clean up build info files
  const cleanResult = cleanTsBuildInfo();
  allFixed = allFixed && cleanResult;
  
  // Run TypeScript check
  const checkResult = runTypeScriptCheck();
  
  if (allFixed) {
    console.log('\n🎉 All TypeScript configurations fixed successfully!');
    console.log('⚠️ You may need to restart your TypeScript server for changes to take effect.');
  } else {
    console.error('\n❌ There were errors fixing TypeScript configurations.');
  }
  
  return allFixed;
}

/**
 * Adds a custom service to the TypeScript configuration
 * @param {string} serviceName - The name of the service to add
 * @returns {boolean} - Whether the operation was successful
 */
function addCustomService(serviceName) {
  console.log(`Adding custom service ${serviceName} to TypeScript configuration...`);
  
  try {
    // Check if the service directory exists
    const servicePath = path.join(BASE_DIR, serviceName);
    if (!fs.existsSync(servicePath)) {
      console.error(`❌ Service directory not found: ${servicePath}`);
      return false;
    }
    
    // Update the root configuration to include the new service
    const rootTsConfigPath = path.join(BASE_DIR, 'tsconfig.json');
    const rootConfig = readTsConfig(rootTsConfigPath);
    
    if (!rootConfig) {
      console.error(`❌ Root configuration not found or invalid`);
      return false;
    }
    
    // Add the service to the references
    if (!rootConfig.references) {
      rootConfig.references = [];
    }
    
    // Check if the service is already in the references
    const existingRef = rootConfig.references.find(ref => ref.path === `./${serviceName}`);
    if (!existingRef) {
      rootConfig.references.push({ path: `./${serviceName}` });
    }
    
    // Add the service to the path mappings
    if (!rootConfig.compilerOptions.paths) {
      rootConfig.compilerOptions.paths = {};
    }
    
    // Convert service name to camelCase for the path mapping
    const pathKey = `@${serviceName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}/*`;
    rootConfig.compilerOptions.paths[pathKey] = [`./${serviceName}/src/*`];
    
    // Write the updated root config
    const rootSuccess = writeTsConfig(rootTsConfigPath, rootConfig);
    if (!rootSuccess) {
      return false;
    }
    
    // Create or update the service's tsconfig.json
    const serviceSuccess = updateServiceTsConfig(serviceName);
    
    return serviceSuccess;
  } catch (error) {
    console.error(`❌ Error adding custom service:`, error.message);
    return false;
  }
}

// Export the public API
module.exports = {
  updateRootTsConfig,
  updateServiceTsConfig,
  validateTsConfig,
  fixCommonIssues,
  cleanTsBuildInfo,
  runTypeScriptCheck,
  updateAllConfigurations,
  validateAllConfigurations,
  fixAllConfigurations,
  addCustomService,
  STANDARD_SERVICES,
  BASE_DIR
};