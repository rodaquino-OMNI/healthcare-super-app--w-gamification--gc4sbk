#!/usr/bin/env node
/**
 * AUSTA SuperApp Migration Generator Script
 * 
 * This utility automates the process of creating Prisma database migrations
 * with descriptive names and ensures consistent migration practices across
 * the development team.
 * 
 * Compatible with Node.js ≥18.0.0 and TypeScript 5.3.3
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');
const chalk = require('chalk'); // chalk version ^4.1.2

// Journey-specific information
const JOURNEY_INFO = {
  health: {
    description: 'Health Journey (Minha Saúde): Health metrics, medical history, device connections',
    examples: ['health-add-metrics', 'health-update-medical-history', 'health-device-connection'],
    schemaPath: path.resolve(__dirname, '../../health-service/prisma/schema.prisma'),
    migrationsDir: path.resolve(__dirname, '../../health-service/prisma/migrations'),
    contextPath: '@austa/database/contexts/health.context'
  },
  care: {
    description: 'Care Journey (Cuidar-me Agora): Appointments, medications, telemedicine sessions',
    examples: ['care-appointment-status', 'care-medication-tracking', 'care-telemedicine-fields'],
    schemaPath: path.resolve(__dirname, '../../care-service/prisma/schema.prisma'),
    migrationsDir: path.resolve(__dirname, '../../care-service/prisma/migrations'),
    contextPath: '@austa/database/contexts/care.context'
  },
  plan: {
    description: 'Plan Journey (Meu Plano & Benefícios): Insurance plans, claims, benefits',
    examples: ['plan-add-claim-fields', 'plan-update-structure', 'plan-benefit-types'],
    schemaPath: path.resolve(__dirname, '../../plan-service/prisma/schema.prisma'),
    migrationsDir: path.resolve(__dirname, '../../plan-service/prisma/migrations'),
    contextPath: '@austa/database/contexts/plan.context'
  },
  gamification: {
    description: 'Gamification Engine: Achievements, quests, rewards, rules',
    examples: ['gamification-achievement-types', 'gamification-quest-structure', 'gamification-reward-fields'],
    schemaPath: path.resolve(__dirname, '../../gamification-engine/prisma/schema.prisma'),
    migrationsDir: path.resolve(__dirname, '../../gamification-engine/prisma/migrations'),
    contextPath: '@austa/database/contexts/gamification.context'
  }
};

// Shared schema path for backward compatibility
const SHARED_PRISMA_SCHEMA_PATH = path.resolve(__dirname, '../../shared/prisma/schema.prisma');
const SHARED_MIGRATIONS_DIR = path.resolve(__dirname, '../../shared/prisma/migrations');

/**
 * Validates that the migration name follows the project's naming conventions
 * @param {string} name - The migration name to validate
 * @param {string} journeyKey - The selected journey key (if provided)
 * @returns {boolean} - True if the name is valid, false otherwise
 */
function validateMigrationName(name, journeyKey = null) {
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

  // If journey is provided, ensure the name has the correct prefix
  if (journeyKey) {
    const expectedPrefix = `${journeyKey}-`;
    if (!name.toLowerCase().startsWith(expectedPrefix)) {
      console.error(chalk.red(`Error: Migration name must start with "${expectedPrefix}" for the selected journey`));
      return false;
    }
    return true;
  }

  // If no journey is explicitly selected, check for any journey prefix
  const journeyPrefixes = Object.keys(JOURNEY_INFO);
  const hasJourneyPrefix = journeyPrefixes.some(prefix => 
    name.toLowerCase().startsWith(`${prefix}-`) || 
    name.toLowerCase().includes(`-${prefix}-`)
  );
  
  if (!hasJourneyPrefix) {
    console.log(chalk.yellow('\nSuggestion: Consider prefixing your migration with a journey identifier'));
    console.log(chalk.yellow('Examples:'));
    Object.values(JOURNEY_INFO).forEach(journey => {
      journey.examples.forEach(example => {
        console.log(chalk.yellow(`  - ${example}`));
      });
    });
    // This is just a suggestion, not a validation error
  }

  return true;
}

/**
 * Prompts the user to select a journey for the migration
 * @returns {Promise<string|null>} A promise that resolves to the selected journey key or null if shared
 */
async function selectJourney() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan('\nSelect the journey this migration impacts:'));
    console.log(chalk.cyan('0. Shared (across multiple journeys)'));
    
    Object.entries(JOURNEY_INFO).forEach(([key, info], index) => {
      console.log(chalk.cyan(`${index + 1}. ${info.description}`));
    });

    rl.question(chalk.cyan('\nEnter the number of the journey (0-4): '), (answer) => {
      rl.close();
      const num = parseInt(answer.trim(), 10);
      
      if (isNaN(num) || num < 0 || num > Object.keys(JOURNEY_INFO).length) {
        console.error(chalk.red('Invalid selection. Defaulting to shared migration.'));
        resolve(null);
        return;
      }
      
      if (num === 0) {
        resolve(null); // Shared migration
      } else {
        const journeyKey = Object.keys(JOURNEY_INFO)[num - 1];
        resolve(journeyKey);
      }
    });
  });
}

/**
 * Prompts the user for a migration name and validates it
 * @param {string|null} journeyKey - The selected journey key or null if shared
 * @returns {Promise<string>} A promise that resolves to the validated migration name
 */
async function getMigrationName(journeyKey = null) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(chalk.cyan('\nMigration names should be descriptive and indicate the purpose of the change.'));
    
    if (journeyKey) {
      const journeyInfo = JOURNEY_INFO[journeyKey];
      console.log(chalk.cyan(`For ${journeyInfo.description}, consider these examples:`));
      journeyInfo.examples.forEach(example => {
        console.log(chalk.cyan(`  - ${example}`));
      });
    } else {
      console.log(chalk.cyan('For shared migrations, consider which journeys this impacts:'));
      Object.entries(JOURNEY_INFO).forEach(([key, info]) => {
        console.log(chalk.cyan(`- ${info.description}`));
      });
    }

    function askForName() {
      const prompt = journeyKey
        ? chalk.cyan(`\nEnter a descriptive name for the ${journeyKey} migration (must start with "${journeyKey}-"): `)
        : chalk.cyan('\nEnter a descriptive name for the shared migration: ');

      rl.question(prompt, (name) => {
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
 * @param {string|null} journeyKey - The journey key or null for shared schema
 * @returns {boolean} True if the schema file exists, false otherwise
 */
function checkPrismaSchema(journeyKey = null) {
  const schemaPath = journeyKey 
    ? JOURNEY_INFO[journeyKey].schemaPath 
    : SHARED_PRISMA_SCHEMA_PATH;

  if (!fs.existsSync(schemaPath)) {
    console.error(chalk.red(`Error: Prisma schema file not found at ${schemaPath}`));
    return false;
  }
  return true;
}

/**
 * Ensures that the migrations directory exists for the specified journey
 * @param {string|null} journeyKey - The journey key or null for shared migrations
 */
function ensureMigrationsDir(journeyKey = null) {
  const migrationsDir = journeyKey 
    ? JOURNEY_INFO[journeyKey].migrationsDir 
    : SHARED_MIGRATIONS_DIR;

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
async function confirmAction(message) {
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
 * @param {string|null} journeyKey - The journey key or null for shared migrations
 * @returns {Promise<boolean>} A promise that resolves to true if migration was successful
 */
async function generateMigration(name, journeyKey = null) {
  // Format the migration name to be kebab-case (for consistency)
  const formattedName = name.toLowerCase().replace(/_/g, '-');
  
  // Get the appropriate schema path and migrations directory
  const schemaPath = journeyKey 
    ? JOURNEY_INFO[journeyKey].schemaPath 
    : SHARED_PRISMA_SCHEMA_PATH;
  
  const journeyContext = journeyKey 
    ? JOURNEY_INFO[journeyKey].contextPath 
    : 'shared';
  
  // Ask for confirmation
  const journeyText = journeyKey ? ` for ${journeyKey} journey` : '';
  const confirmed = await confirmAction(`Are you sure you want to create migration "${formattedName}"${journeyText}? [y/N]: `);
  
  if (!confirmed) {
    console.log(chalk.blue('Migration cancelled.'));
    return false;
  }
  
  console.log(chalk.blue(`\nGenerating migration: ${formattedName}...`));
  console.log(chalk.blue(`Using schema: ${schemaPath}`));
  console.log(chalk.blue(`Database context: ${journeyContext}`));
  
  return new Promise((resolve) => {
    // Execute the Prisma migrate command with proper error handling
    exec(`npx prisma migrate dev --name ${formattedName} --schema ${schemaPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red(`Error generating migration: ${error.message}`));
        console.error(stderr);
        resolve(false);
        return;
      }
      
      console.log(stdout);
      console.log(chalk.green('Migration generated successfully!'));
      resolve(true);
    });
  });
}

/**
 * Main function that orchestrates the migration generation process
 */
async function main() {
  try {
    console.log(chalk.blue('=== AUSTA SuperApp Migration Generator ==='));
    console.log(chalk.blue('Compatible with Node.js ≥18.0.0 and TypeScript 5.3.3'));
    
    // Select the journey for this migration
    const journeyKey = await selectJourney();
    
    // Check if schema exists for the selected journey
    if (!checkPrismaSchema(journeyKey)) {
      return;
    }
    
    // Ensure migrations directory exists for the selected journey
    ensureMigrationsDir(journeyKey);
    
    // Get migration name from user (with journey-specific validation)
    const migrationName = await getMigrationName(journeyKey);
    
    // Generate the migration for the selected journey
    const success = await generateMigration(migrationName, journeyKey);
    
    if (success) {
      console.log(chalk.green('\nMigration process completed successfully.'));
      console.log(chalk.cyan('Remember to review the generated migration SQL for correctness.'));
      
      if (journeyKey) {
        // Show information about the specific journey
        const journeyInfo = JOURNEY_INFO[journeyKey];
        console.log(chalk.cyan(`\nThis migration affects the ${journeyInfo.description}`));
        console.log(chalk.cyan(`Database context: ${journeyInfo.contextPath}`));
      } else {
        // Show information about all journeys for shared migrations
        console.log(chalk.cyan('\nConsider the impact on the following journeys:'));
        Object.entries(JOURNEY_INFO).forEach(([key, info]) => {
          console.log(chalk.yellow(`- ${info.description}`));
        });
      }
      
      // Remind about standardized schema management practices
      console.log(chalk.cyan('\nReminders for standardized schema management:'));
      console.log(chalk.cyan('1. Use consistent naming conventions for tables and columns'));
      console.log(chalk.cyan('2. Add appropriate indices for frequently queried fields'));
      console.log(chalk.cyan('3. Include descriptive comments in your schema'));
      console.log(chalk.cyan('4. Consider the impact on existing data'));
      console.log(chalk.cyan('5. Test migrations in development before applying to other environments'));
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

// Export for use in other scripts
module.exports = {
  main,
  validateMigrationName,
  checkPrismaSchema,
  generateMigration
};