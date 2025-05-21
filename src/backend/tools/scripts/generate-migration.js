#!/usr/bin/env node
/**
 * AUSTA SuperApp Migration Generator Script
 * 
 * This utility automates the process of creating Prisma database migrations
 * with descriptive names and ensures consistent migration practices across
 * the development team.
 * 
 * Requires Node.js ≥18.0.0
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk'); // chalk version 4.1.2

// Base paths for journey-specific contexts
const BASE_PATHS = {
  health: path.resolve(__dirname, '../../health-service/prisma'),
  care: path.resolve(__dirname, '../../care-service/prisma'),
  plan: path.resolve(__dirname, '../../plan-service/prisma'),
  gamification: path.resolve(__dirname, '../../gamification-engine/prisma'),
  shared: path.resolve(__dirname, '../../shared/prisma')
};

// Journey-specific information
const JOURNEY_INFO = {
  health: {
    description: 'Health Journey: Health metrics, medical history, device connections',
    examples: ['health-add-metrics', 'health-update-medical-history', 'health-device-connection'],
    schemaPath: path.join(BASE_PATHS.health, 'schema.prisma'),
    migrationsDir: path.join(BASE_PATHS.health, 'migrations')
  },
  care: {
    description: 'Care Journey: Appointments, medications, telemedicine sessions',
    examples: ['care-appointment-status', 'care-medication-tracking', 'care-telemedicine-fields'],
    schemaPath: path.join(BASE_PATHS.care, 'schema.prisma'),
    migrationsDir: path.join(BASE_PATHS.care, 'migrations')
  },
  plan: {
    description: 'Plan Journey: Insurance plans, claims, benefits',
    examples: ['plan-add-claim-fields', 'plan-update-structure', 'plan-benefit-types'],
    schemaPath: path.join(BASE_PATHS.plan, 'schema.prisma'),
    migrationsDir: path.join(BASE_PATHS.plan, 'migrations')
  },
  gamification: {
    description: 'Gamification Engine: Achievements, quests, rewards, events',
    examples: ['gamification-achievement-types', 'gamification-quest-structure', 'gamification-reward-fields'],
    schemaPath: path.join(BASE_PATHS.gamification, 'schema.prisma'),
    migrationsDir: path.join(BASE_PATHS.gamification, 'migrations')
  },
  shared: {
    description: 'Shared Database: Common entities used across journeys',
    examples: ['shared-user-fields', 'shared-common-types', 'shared-cross-journey-entities'],
    schemaPath: path.join(BASE_PATHS.shared, 'schema.prisma'),
    migrationsDir: path.join(BASE_PATHS.shared, 'migrations')
  }
};

// Environment-specific configuration
const ENV_CONFIG = {
  development: {
    allowDangerousOperations: true,
    requireConfirmation: true
  },
  staging: {
    allowDangerousOperations: false,
    requireConfirmation: true
  },
  production: {
    allowDangerousOperations: false,
    requireConfirmation: true
  }
};

/**
 * Gets the current environment from NODE_ENV or defaults to development
 * @returns {string} The current environment
 */
function getCurrentEnvironment() {
  return process.env.NODE_ENV || 'development';
}

/**
 * Gets the environment-specific configuration
 * @returns {Object} The environment configuration
 */
function getEnvironmentConfig() {
  const env = getCurrentEnvironment();
  return ENV_CONFIG[env] || ENV_CONFIG.development;
}

/**
 * Prompts the user to select a journey context
 * @returns {Promise<string>} A promise that resolves to the selected journey key
 */
async function selectJourneyContext() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan('\nSelect the journey context for this migration:'));
    
    const journeyKeys = Object.keys(JOURNEY_INFO);
    journeyKeys.forEach((key, index) => {
      console.log(chalk.cyan(`${index + 1}. ${JOURNEY_INFO[key].description}`));
    });

    function askForJourney() {
      rl.question(chalk.cyan(`\nEnter journey number (1-${journeyKeys.length}): `), (answer) => {
        const selection = parseInt(answer.trim(), 10);
        
        if (isNaN(selection) || selection < 1 || selection > journeyKeys.length) {
          console.error(chalk.red(`Invalid selection. Please enter a number between 1 and ${journeyKeys.length}.`));
          askForJourney();
          return;
        }
        
        const selectedJourney = journeyKeys[selection - 1];
        rl.close();
        resolve(selectedJourney);
      });
    }

    askForJourney();
  });
}

/**
 * Validates that the migration name follows the project's naming conventions
 * @param {string} name - The migration name to validate
 * @param {string} journeyKey - The selected journey key
 * @returns {boolean} - True if the name is valid, false otherwise
 */
function validateMigrationName(name, journeyKey) {
  // Check if the name is not empty
  if (!name || name.trim() === '') {
    console.error(chalk.red('Error: Migration name cannot be empty'));
    return false;
  }

  // Verify the name contains only alphanumeric characters, hyphens, and underscores
  const validNameRegex = /^[a-zA-Z0-9-_]+$/;
  if (!validNameRegex.test(name)) {
    console.error(chalk.red('Error: Migration name can only contain alphanumeric characters, hyphens, and underscores'));
    return false;
  }

  // Ensure the name is descriptive (minimum length)
  if (name.length < 5) {
    console.error(chalk.red('Error: Migration name should be descriptive (at least 5 characters)'));
    return false;
  }

  // For standardized schema management, enforce journey prefix for migration names
  const journeyPrefix = journeyKey === 'gamification' ? 'gamification' : journeyKey;
  const hasCorrectPrefix = name.toLowerCase().startsWith(`${journeyPrefix}-`);
  
  if (!hasCorrectPrefix) {
    console.error(chalk.red(`Error: Migration name must start with the journey prefix "${journeyPrefix}-"`));
    console.log(chalk.yellow('\nExamples:'));
    JOURNEY_INFO[journeyKey].examples.forEach(example => {
      console.log(chalk.yellow(`  - ${example}`));
    });
    return false;
  }

  return true;
}

/**
 * Prompts the user for a migration name and validates it
 * @param {string} journeyKey - The selected journey key
 * @returns {Promise<string>} A promise that resolves to the validated migration name
 */
function getMigrationName(journeyKey) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan('\nMigration names should be descriptive and indicate the purpose of the change.'));
    console.log(chalk.cyan(`Migration names for the ${journeyKey} journey must start with "${journeyKey}-"`));
    console.log(chalk.cyan('Examples:'));
    
    JOURNEY_INFO[journeyKey].examples.forEach(example => {
      console.log(chalk.cyan(`  - ${example}`));
    });

    function askForName() {
      rl.question(chalk.cyan('\nEnter a descriptive name for the migration: '), (name) => {
        const trimmedName = name.trim();
        
        if (validateMigrationName(trimmedName, journeyKey)) {
          rl.close();
          resolve(trimmedName);
        } else {
          askForName(); // Ask again if validation failed
        }
      });
    }

    askForName();
  });
}

/**
 * Checks if the Prisma schema file exists for the specified journey
 * @param {string} journeyKey - The selected journey key
 * @returns {boolean} True if the schema file exists, false otherwise
 */
function checkPrismaSchema(journeyKey) {
  const schemaPath = JOURNEY_INFO[journeyKey].schemaPath;
  
  if (!fs.existsSync(schemaPath)) {
    console.error(chalk.red(`Error: Prisma schema file not found at ${schemaPath}`));
    return false;
  }
  return true;
}

/**
 * Ensures that the migrations directory exists for the specified journey
 * @param {string} journeyKey - The selected journey key
 */
function ensureMigrationsDir(journeyKey) {
  const migrationsDir = JOURNEY_INFO[journeyKey].migrationsDir;
  
  if (!fs.existsSync(migrationsDir)) {
    console.log(chalk.yellow(`Migrations directory not found. Creating at ${migrationsDir}`));
    fs.mkdirSync(migrationsDir, { recursive: true });
  }
}

/**
 * Asks the user for confirmation before proceeding
 * @param {string} message - The confirmation message to display
 * @returns {Promise<boolean>} A promise that resolves to true if confirmed, false otherwise
 */
function confirmAction(message) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(chalk.yellow(message), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Generates a new Prisma migration with the provided name for the specified journey
 * @param {string} name - The name for the migration
 * @param {string} journeyKey - The selected journey key
 * @param {Object} options - Additional options for migration generation
 * @param {boolean} options.createOnly - Whether to only create the migration without applying it
 * @param {boolean} options.skipSeed - Whether to skip running seed after applying the migration
 * @returns {Promise<boolean>} A promise that resolves to true if migration was successful
 */
async function generateMigration(name, journeyKey, options = {}) {
  // Format the migration name to be kebab-case (for consistency)
  const formattedName = name.toLowerCase().replace(/_/g, '-');
  
  // Get environment configuration
  const envConfig = getEnvironmentConfig();
  
  // Ask for confirmation if required by environment
  let confirmed = true;
  if (envConfig.requireConfirmation) {
    const actionType = options.createOnly ? 'create' : 'create and apply';
    confirmed = await confirmAction(`Are you sure you want to ${actionType} migration "${formattedName}" for the ${journeyKey} journey? [y/N]: `);
  }
  
  if (!confirmed) {
    console.log(chalk.blue('Migration cancelled.'));
    return false;
  }
  
  const actionType = options.createOnly ? 'Creating' : 'Generating and applying';
  console.log(chalk.blue(`\n${actionType} migration: ${formattedName} for ${journeyKey} journey...`));
  
  return new Promise((resolve) => {
    // Get the schema path for the selected journey
    const schemaPath = JOURNEY_INFO[journeyKey].schemaPath;
    
    // Build the Prisma migrate command with options
    let command = `npx prisma migrate dev --name ${formattedName} --schema ${schemaPath}`;
    
    // Add optional flags
    if (options.createOnly) {
      command += ' --create-only';
    }
    
    if (options.skipSeed) {
      command += ' --skip-seed';
    }
    
    // Execute the Prisma migrate command
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error generating migration: ${error.message}`));
        console.error(stderr);
        
        // Provide more helpful error messages for common issues
        if (stderr.includes('Schema drift detected')) {
          console.log(chalk.yellow('\nSchema drift detected. This means your database schema has been modified outside of Prisma Migrate.'));
          console.log(chalk.yellow('You may need to run `prisma migrate reset` to reset your database and apply all migrations from scratch.'));
        } else if (stderr.includes('The migration directory is not empty')) {
          console.log(chalk.yellow('\nThe migration directory already contains files. You may need to:'));
          console.log(chalk.yellow('1. Apply existing migrations with `prisma migrate deploy`'));
          console.log(chalk.yellow('2. Or reset the database with `prisma migrate reset`'));
        } else if (stderr.includes('already exists in the database')) {
          console.log(chalk.yellow('\nA migration with this name already exists in the database.'));
          console.log(chalk.yellow('Try using a different migration name.'));
        }
        
        resolve(false);
        return;
      }
      
      console.log(stdout);
      
      if (options.createOnly) {
        console.log(chalk.green('Migration created successfully!'));
        console.log(chalk.cyan('\nTo apply this migration, run:'));
        console.log(chalk.cyan(`npx prisma migrate deploy --schema ${schemaPath}`));
      } else {
        console.log(chalk.green('Migration generated and applied successfully!'));
      }
      
      resolve(true);
    });
  });
}

/**
 * Prompts the user for migration options
 * @param {string} journeyKey - The selected journey key
 * @returns {Promise<Object>} A promise that resolves to the migration options
 */
async function getMigrationOptions(journeyKey) {
  const options = {
    createOnly: false,
    skipSeed: false
  };
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(chalk.cyan('\nCreate migration without applying it? (--create-only) [y/N]: '), (answer) => {
      options.createOnly = answer.toLowerCase() === 'y';
      
      rl.question(chalk.cyan('Skip running seed after applying migration? (--skip-seed) [y/N]: '), (answer) => {
        options.skipSeed = answer.toLowerCase() === 'y';
        rl.close();
        resolve(options);
      });
    });
  });
}

/**
 * Main function that orchestrates the migration generation process
 */
async function main() {
  try {
    console.log(chalk.blue('=== AUSTA SuperApp Migration Generator ==='));
    console.log(chalk.blue(`Environment: ${getCurrentEnvironment()}`));
    console.log(chalk.blue(`Node.js Version: ${process.version} (requires ≥18.0.0)`));
    
    // Select journey context
    const journeyKey = await selectJourneyContext();
    console.log(chalk.green(`Selected journey: ${JOURNEY_INFO[journeyKey].description}`));
    
    // Check if schema exists for the selected journey
    if (!checkPrismaSchema(journeyKey)) {
      return;
    }
    
    // Ensure migrations directory exists for the selected journey
    ensureMigrationsDir(journeyKey);
    
    // Get migration name from user
    const migrationName = await getMigrationName(journeyKey);
    
    // Get migration options from user
    const migrationOptions = await getMigrationOptions(journeyKey);
    
    // Generate the migration
    const success = await generateMigration(migrationName, journeyKey, migrationOptions);
    
    if (success) {
      console.log(chalk.green('\nMigration process completed successfully.'));
      console.log(chalk.cyan('Remember to review the generated migration SQL for correctness.'));
      
      if (migrationOptions.createOnly) {
        console.log(chalk.cyan('\nYou created the migration without applying it. To apply it, run:'));
        console.log(chalk.yellow(`npx prisma migrate deploy --schema ${JOURNEY_INFO[journeyKey].schemaPath}`));
      }
      
      console.log(chalk.cyan('\nConsider the impact on other journeys:'));
      
      Object.entries(JOURNEY_INFO).forEach(([key, info]) => {
        if (key !== journeyKey) {
          console.log(chalk.yellow(`- ${info.description}`));
        }
      });
      
      // Provide guidance on database contexts
      console.log(chalk.cyan('\nRemember to use the appropriate PrismaService with the correct database context:'));
      console.log(chalk.yellow(`import { PrismaService } from '@austa/database';`));
      console.log(chalk.yellow(`constructor(private readonly prisma: PrismaService) {}`));
      console.log(chalk.yellow(`// Use journey-specific context`));
      console.log(chalk.yellow(`this.prisma.${journeyKey}.yourModel.findMany()`));
      
      // Provide guidance on environment-specific configuration
      console.log(chalk.cyan('\nFor production deployments, use:'));
      console.log(chalk.yellow(`NODE_ENV=production npx prisma migrate deploy --schema ${JOURNEY_INFO[journeyKey].schemaPath}`));
    } else {
      console.log(chalk.yellow('\nMigration process completed with issues.'));
      console.log(chalk.cyan('Please check the error messages above.'));
    }
  } catch (error) {
    console.error(chalk.red(`Unexpected error: ${error.message}`));
    console.error(error);
  }
}

// Execute if directly run
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    process.exit(1);
  });
}

/**
 * Displays information about available Prisma migration commands
 */
function showMigrationCommands() {
  console.log(chalk.cyan('\nAvailable Prisma migration commands:'));
  console.log(chalk.yellow('- prisma migrate dev: Create and apply migrations (development)'));
  console.log(chalk.yellow('- prisma migrate deploy: Apply pending migrations (production)'));
  console.log(chalk.yellow('- prisma migrate reset: Reset database and apply all migrations'));
  console.log(chalk.yellow('- prisma migrate status: Check migration status'));
  console.log(chalk.yellow('- prisma migrate resolve: Resolve failed migrations'));
  console.log(chalk.yellow('- prisma migrate diff: Compare database schemas'));
  
  console.log(chalk.cyan('\nCommon options:'));
  console.log(chalk.yellow('--schema: Path to schema file'));
  console.log(chalk.yellow('--name: Name for the migration (with dev)'));
  console.log(chalk.yellow('--create-only: Create migration without applying (with dev)'));
  console.log(chalk.yellow('--skip-seed: Skip running seed script (with dev)'));
  console.log(chalk.yellow('--skip-generate: Skip generating client (with dev)'));
}

// Export for use in other scripts
module.exports = {
  main,
  selectJourneyContext,
  validateMigrationName,
  checkPrismaSchema,
  ensureMigrationsDir,
  generateMigration,
  getMigrationOptions,
  showMigrationCommands,
  getCurrentEnvironment,
  getEnvironmentConfig
};