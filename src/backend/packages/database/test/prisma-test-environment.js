/**
 * Custom Jest test environment for Prisma database tests.
 * 
 * This environment manages test database setup, schema migrations, and data seeding
 * for tests requiring a real database connection. It ensures isolated test databases
 * for parallel test execution and proper cleanup after tests.
 */

const NodeEnvironment = require('jest-environment-node');
const { nanoid } = require('nanoid');
const { execSync } = require('child_process');
const { join } = require('path');
const { existsSync, mkdirSync } = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * Custom Jest environment for Prisma database tests.
 * Extends the Node environment to provide database isolation for each test suite.
 */
class PrismaTestEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    
    // Generate a unique schema identifier for this test context
    this.schemaId = `test_${nanoid()}`;
    
    // Generate the schema URL for the test database
    this.dbUrl = process.env.DATABASE_URL 
      ? `${process.env.DATABASE_URL}?schema=${this.schemaId}` 
      : `postgresql://postgres:postgres@localhost:5432/testing?schema=${this.schemaId}`;
    
    // Create a directory for Prisma migrations if it doesn't exist
    this.migrationsPath = join(process.cwd(), 'prisma/migrations');
    if (!existsSync(this.migrationsPath)) {
      mkdirSync(this.migrationsPath, { recursive: true });
    }
    
    // Set the log level for Prisma Client
    this.prismaClientLogLevel = process.env.PRISMA_CLIENT_LOG_LEVEL || 'error';
    
    // Store the original database URL to restore it after tests
    this.originalDatabaseUrl = process.env.DATABASE_URL;
  }

  /**
   * Set up the test environment.
   * Creates a new schema and runs migrations to prepare the test database.
   */
  async setup() {
    // Call the parent class setup
    await super.setup();
    
    // Set environment variables for the test
    process.env.DATABASE_URL = this.dbUrl;
    process.env.PRISMA_CLIENT_LOG_LEVEL = this.prismaClientLogLevel;
    
    // Create a new schema for this test context
    try {
      console.log(`\n🔧 Setting up test database with schema: ${this.schemaId}`);
      
      // Create the schema
      await exec(`npx prisma db push --skip-generate --accept-data-loss`);
      
      console.log(`✅ Test database setup complete for schema: ${this.schemaId}\n`);
    } catch (error) {
      console.error(`❌ Failed to set up test database: ${error.message}`);
      throw error;
    }
    
    // Make the database URL available to tests
    this.global.process.env.DATABASE_URL = this.dbUrl;
    
    // Add utility functions to the global scope for tests
    this.global.__PRISMA_TEST_ENVIRONMENT__ = {
      schemaId: this.schemaId,
      dbUrl: this.dbUrl,
      
      /**
       * Seeds the test database with initial data.
       * 
       * @param {Object} options - Seeding options
       * @param {boolean} options.minimal - If true, only seed minimal required data
       * @returns {Promise<void>}
       */
      async seedDatabase(options = {}) {
        try {
          console.log('🌱 Seeding test database...');
          
          // Import the seed module dynamically
          const seedModule = require('../../../shared/prisma/seed');
          
          // If the seed module exports a function, call it
          if (typeof seedModule === 'function') {
            await seedModule(options);
          } else if (typeof seedModule.seed === 'function') {
            await seedModule.seed(options);
          } else {
            console.warn('⚠️ No seed function found in seed module');
          }
          
          console.log('✅ Test database seeded successfully');
        } catch (error) {
          console.error(`❌ Failed to seed test database: ${error.message}`);
          throw error;
        }
      },
      
      /**
       * Cleans the test database by truncating all tables.
       * 
       * @returns {Promise<void>}
       */
      async cleanDatabase() {
        try {
          console.log('🧹 Cleaning test database...');
          
          // Import PrismaClient dynamically
          const { PrismaClient } = require('@prisma/client');
          const prisma = new PrismaClient({
            datasources: {
              db: {
                url: this.dbUrl,
              },
            },
          });
          
          // Connect to the database
          await prisma.$connect();
          
          // Get all tables in the schema
          const tables = await prisma.$queryRaw`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = ${this.schemaId};
          `;
          
          // Disable foreign key checks, truncate all tables, then re-enable foreign key checks
          await prisma.$executeRaw`SET session_replication_role = 'replica';`;
          
          for (const { tablename } of tables) {
            await prisma.$executeRaw`TRUNCATE TABLE "${this.schemaId}"."${tablename}" CASCADE;`;
          }
          
          await prisma.$executeRaw`SET session_replication_role = 'origin';`;
          
          // Disconnect from the database
          await prisma.$disconnect();
          
          console.log('✅ Test database cleaned successfully');
        } catch (error) {
          console.error(`❌ Failed to clean test database: ${error.message}`);
          throw error;
        }
      },
    };
  }

  /**
   * Tear down the test environment.
   * Drops the schema created for this test context.
   */
  async teardown() {
    // Restore the original database URL
    process.env.DATABASE_URL = this.originalDatabaseUrl;
    
    try {
      // Drop the schema created for this test
      console.log(`\n🧹 Cleaning up test database schema: ${this.schemaId}`);
      
      // Import PrismaClient dynamically
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.dbUrl,
          },
        },
      });
      
      // Connect to the database
      await prisma.$connect();
      
      // Drop the schema
      await prisma.$executeRaw`DROP SCHEMA IF EXISTS "${this.schemaId}" CASCADE;`;
      
      // Disconnect from the database
      await prisma.$disconnect();
      
      console.log(`✅ Test database schema dropped: ${this.schemaId}\n`);
    } catch (error) {
      console.error(`❌ Failed to drop test database schema: ${error.message}`);
    }
    
    // Call the parent class teardown
    await super.teardown();
  }

  /**
   * Returns a new instance of the test environment.
   * 
   * @param {Object} config - Jest configuration
   * @param {Object} context - Test context
   * @returns {PrismaTestEnvironment} A new instance of the test environment
   */
  static async createInstance(config, context) {
    return new PrismaTestEnvironment(config, context);
  }

  /**
   * Run a specific command in the test environment.
   * 
   * @param {string} command - The command to run
   * @returns {Promise<{stdout: string, stderr: string}>} The command output
   */
  async runCommand(command) {
    try {
      // Set the DATABASE_URL environment variable for the command
      const env = { ...process.env, DATABASE_URL: this.dbUrl };
      
      // Execute the command
      const { stdout, stderr } = await exec(command, { env });
      
      return { stdout, stderr };
    } catch (error) {
      console.error(`❌ Failed to run command: ${error.message}`);
      throw error;
    }
  }
}

module.exports = PrismaTestEnvironment;