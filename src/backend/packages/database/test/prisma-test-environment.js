/**
 * Custom Jest test environment for Prisma database tests.
 * 
 * This environment manages test database setup, schema migrations, and data seeding
 * for tests requiring a real database connection. It ensures isolated test databases
 * for parallel test execution and proper cleanup after tests.
 * 
 * Usage:
 * 1. Configure Jest to use this environment in your jest.config.js:
 *    ```
 *    module.exports = {
 *      testEnvironment: './test/prisma-test-environment.js',
 *      // ... other configuration
 *    };
 *    ```
 * 
 * 2. Access the test database helpers in your tests:
 *    ```
 *    test('should create a user', async () => {
 *      const prisma = new PrismaClient();
 *      
 *      // Use test data helpers
 *      const email = global.testDatabase.helpers.randomEmail();
 *      
 *      // Create a user
 *      const user = await prisma.user.create({
 *        data: {
 *          email,
 *          name: 'Test User',
 *          // ... other fields
 *        },
 *      });
 *      
 *      expect(user).toBeDefined();
 *      expect(user.email).toBe(email);
 *      
 *      // Clean up after the test
 *      await global.testDatabase.cleanupTestData(['User']);
 *    });
 *    ```
 * 
 * 3. Use database snapshots for complex test scenarios:
 *    ```
 *    let snapshot;
 *    
 *    beforeAll(async () => {
 *      // Set up initial data
 *      // ...
 *      
 *      // Create a snapshot to restore between tests
 *      snapshot = await global.testDatabase.createDatabaseSnapshot();
 *    });
 *    
 *    afterAll(async () => {
 *      // Clean up the snapshot
 *      await snapshot.drop();
 *    });
 *    
 *    beforeEach(async () => {
 *      // Restore the database to the initial state before each test
 *      await snapshot.restore();
 *    });
 *    ```
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const NodeEnvironment = require('jest-environment-node').default;
const { Client } = require('pg');
const util = require('util');
const crypto = require('crypto');

const execPromise = util.promisify(exec);

/**
 * Custom Jest test environment for Prisma database tests.
 * Extends the standard Node environment with database-specific functionality.
 */
class PrismaTestEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    
    // Generate a unique schema identifier for this test run
    this.schema = `test_${uuidv4().replace(/-/g, '_')}`;
    
    // Generate the PostgreSQL connection string for the test schema
    this.connectionString = this.getConnectionString();
    
    // Store the original database URL to restore it later
    this.originalDatabaseUrl = process.env.DATABASE_URL;
    
    // Path to the Prisma schema file
    this.prismaSchemaPath = this.getPrismaSchemaPath(context);
    
    // Flag to track if setup was successful
    this.setupComplete = false;
  }
  
  /**
   * Set up the test environment.
   * Creates a dedicated test database schema, runs migrations, and seeds test data.
   */
  async setup() {
    // Call the setup of the parent class
    await super.setup();
    
    try {
      // Create a dedicated schema for this test suite
      await this.createTestSchema();
      
      // Set environment variables for Prisma
      process.env.DATABASE_URL = this.connectionString;
      this.global.process.env.DATABASE_URL = this.connectionString;
      
      // Run Prisma migrations on the test schema
      await this.runPrismaMigrations();
      
      // Seed the test database with minimal test data if needed
      // This is controlled by an environment variable to allow skipping in CI
      if (process.env.SKIP_TEST_SEEDING !== 'true') {
        await this.seedTestDatabase();
      }
      
      // Add helper methods to the global object for tests to use
      this.global.testDatabase = {
        schema: this.schema,
        connectionString: this.connectionString,
        prismaSchemaPath: this.prismaSchemaPath,
        cleanupTestData: this.cleanupTestData.bind(this),
        createTestTransaction: this.createTestTransaction.bind(this),
        createDatabaseSnapshot: this.createDatabaseSnapshot.bind(this),
        executeSQL: this.executeSQL.bind(this),
        helpers: this.getTestDataHelpers(),
      };
      
      // Mark setup as complete
      this.setupComplete = true;
      
      console.log(`Test environment setup complete with schema: ${this.schema}`);
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }
  
  /**
   * Cleans up test data from the database.
   * This is useful for cleaning up between tests without dropping the entire schema.
   * 
   * @param {Array<string>} tables - Optional array of table names to clean. If not provided, all tables are cleaned.
   * @returns {Promise<void>}
   */
  async cleanupTestData(tables = []) {
    const client = new Client({
      connectionString: this.connectionString,
    });
    
    try {
      await client.connect();
      
      // If no specific tables are provided, get all tables in the schema
      if (tables.length === 0) {
        const tablesResult = await client.query(`
          SELECT tablename FROM pg_tables 
          WHERE schemaname = $1 AND tablename != '_prisma_migrations'
        `, [this.schema]);
        
        tables = tablesResult.rows.map(row => row.tablename);
      }
      
      // Disable foreign key checks for the cleanup
      await client.query('SET session_replication_role = replica;');
      
      // Truncate all tables in a single transaction
      await client.query('BEGIN');
      
      try {
        for (const table of tables) {
          await client.query(`TRUNCATE TABLE "${this.schema}"."${table}" CASCADE;`);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      
      // Re-enable foreign key checks
      await client.query('SET session_replication_role = DEFAULT;');
      
      console.log(`Cleaned up test data in schema ${this.schema}`);
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Executes a raw SQL query on the test database.
   * This is useful for tests that need to perform complex queries or setup.
   * 
   * @param {string} sql - The SQL query to execute
   * @param {Array} params - Optional parameters for the query
   * @returns {Promise<Object>} The query result
   */
  async executeSQL(sql, params = []) {
    const client = new Client({
      connectionString: this.connectionString,
    });
    
    try {
      await client.connect();
      const result = await client.query(sql, params);
      return result;
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Creates a database snapshot that can be restored later.
   * This is useful for tests that need to restore the database to a known state.
   * 
   * @returns {Promise<Object>} An object with the snapshot ID and a restore function
   */
  async createDatabaseSnapshot() {
    const client = new Client({
      connectionString: this.connectionString,
    });
    
    try {
      await client.connect();
      
      // Generate a unique snapshot name
      const snapshotId = `snapshot_${uuidv4().replace(/-/g, '_')}`;
      
      // Create the snapshot by copying the current schema
      await client.query(`CREATE SCHEMA "${snapshotId}" AUTHORIZATION current_user;`);
      
      // Get all tables in the current schema
      const tablesResult = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = $1 AND tablename != '_prisma_migrations'
      `, [this.schema]);
      
      const tables = tablesResult.rows.map(row => row.tablename);
      
      // Copy each table structure and data to the snapshot schema
      for (const table of tables) {
        await client.query(`
          CREATE TABLE "${snapshotId}"."${table}" AS 
          SELECT * FROM "${this.schema}"."${table}";
        `);
      }
      
      console.log(`Created database snapshot: ${snapshotId}`);
      
      // Return an object with the snapshot ID and a restore function
      return {
        snapshotId,
        async restore() {
          const restoreClient = new Client({
            connectionString: this.connectionString,
          });
          
          try {
            await restoreClient.connect();
            
            // Disable foreign key checks for the restore
            await restoreClient.query('SET session_replication_role = replica;');
            
            // Truncate all tables in the current schema
            for (const table of tables) {
              await restoreClient.query(`TRUNCATE TABLE "${this.schema}"."${table}" CASCADE;`);
            }
            
            // Copy data from snapshot back to the current schema
            for (const table of tables) {
              await restoreClient.query(`
                INSERT INTO "${this.schema}"."${table}" 
                SELECT * FROM "${snapshotId}"."${table}";
              `);
            }
            
            // Re-enable foreign key checks
            await restoreClient.query('SET session_replication_role = DEFAULT;');
            
            console.log(`Restored database from snapshot: ${snapshotId}`);
          } catch (error) {
            console.error(`Error restoring database from snapshot: ${snapshotId}`, error);
            throw error;
          } finally {
            await restoreClient.end();
          }
        },
        async drop() {
          const dropClient = new Client({
            connectionString: this.connectionString,
          });
          
          try {
            await dropClient.connect();
            await dropClient.query(`DROP SCHEMA IF EXISTS "${snapshotId}" CASCADE;`);
            console.log(`Dropped database snapshot: ${snapshotId}`);
          } catch (error) {
            console.error(`Error dropping database snapshot: ${snapshotId}`, error);
          } finally {
            await dropClient.end();
          }
        }
      };
    } catch (error) {
      console.error('Error creating database snapshot:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Clean up the test environment.
   * Drops the test schema and restores the original database URL.
   */
  async teardown() {
    try {
      // Only attempt cleanup if setup was successful
      if (this.setupComplete) {
        // Drop the test schema
        await this.dropTestSchema();
      }
      
      // Restore the original database URL
      process.env.DATABASE_URL = this.originalDatabaseUrl;
      
      console.log(`Test environment teardown complete for schema: ${this.schema}`);
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
    
    // Call the teardown of the parent class
    await super.teardown();
  }
  
  /**
   * Creates a new PostgreSQL schema for the test.
   */
  async createTestSchema() {
    const client = new Client({
      connectionString: this.getConnectionString(true),
    });
    
    try {
      await client.connect();
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${this.schema}";`);
      console.log(`Created test schema: ${this.schema}`);
    } catch (error) {
      console.error(`Error creating schema ${this.schema}:`, error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Drops the PostgreSQL schema used for the test.
   */
  async dropTestSchema() {
    const client = new Client({
      connectionString: this.getConnectionString(true),
    });
    
    try {
      await client.connect();
      await client.query(`DROP SCHEMA IF EXISTS "${this.schema}" CASCADE;`);
      console.log(`Dropped test schema: ${this.schema}`);
    } catch (error) {
      console.error(`Error dropping schema ${this.schema}:`, error);
      throw error;
    } finally {
      await client.end();
    }
  }
  
  /**
   * Runs Prisma migrations on the test schema.
   */
  async runPrismaMigrations() {
    try {
      // Set environment variables for the migration
      const env = {
        ...process.env,
        DATABASE_URL: this.connectionString,
      };
      
      // Determine the directory containing the Prisma schema
      const schemaDir = path.dirname(this.prismaSchemaPath);
      
      // Run the migration command
      const { stdout, stderr } = await execPromise(
        `npx prisma migrate deploy --schema=${this.prismaSchemaPath}`,
        { env }
      );
      
      if (stderr) {
        console.error('Migration stderr:', stderr);
      }
      
      console.log(`Migrations applied to schema ${this.schema}`);
      return stdout;
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }
  
  /**
   * Seeds the test database with minimal test data.
   * This is a lightweight version of the main seed script for faster test execution.
   */
  async seedTestDatabase() {
    try {
      // Set environment variables for the seeding
      const env = {
        ...process.env,
        DATABASE_URL: this.connectionString,
        NODE_ENV: 'test',
      };
      
      // Check if a test-specific seed script exists
      const testSeedPath = path.resolve(process.cwd(), 'test/seed/test-seed.js');
      const serviceSeedPath = path.dirname(this.prismaSchemaPath) + '/seed-test.js';
      
      let seedCommand;
      
      if (fs.existsSync(testSeedPath)) {
        seedCommand = `node ${testSeedPath}`;
      } else if (fs.existsSync(serviceSeedPath)) {
        seedCommand = `node ${serviceSeedPath}`;
      } else {
        // No test-specific seed script found, skip seeding
        console.log('No test seed script found, skipping test data seeding');
        return;
      }
      
      // Run the seed command
      const { stdout, stderr } = await execPromise(seedCommand, { env });
      
      if (stderr) {
        console.error('Seed stderr:', stderr);
      }
      
      console.log(`Test data seeded in schema ${this.schema}`);
      return stdout;
    } catch (error) {
      console.error('Error seeding test database:', error);
      // Don't throw the error to allow tests to continue without seed data
      console.warn('Continuing tests without seed data');
    }
  }
  
  /**
   * Gets the PostgreSQL connection string for the test database.
   * 
   * @param {boolean} useDefaultSchema - Whether to use the default schema instead of the test schema
   * @returns {string} The connection string
   */
  getConnectionString(useDefaultSchema = false) {
    // Get the base connection string from environment variables or use a default
    const baseConnectionString = process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/austa_test';
    
    // Parse the connection string to extract components
    const url = new URL(baseConnectionString);
    
    // If we're using the test schema, add it to the connection string
    if (!useDefaultSchema) {
      url.searchParams.set('schema', this.schema);
    }
    
    return url.toString();
  }
  
  /**
   * Determines the path to the Prisma schema file based on the test context.
   * 
   * @param {Object} context - The Jest test context
   * @returns {string} The path to the Prisma schema file
   */
  getPrismaSchemaPath(context) {
    // Try to determine the service being tested from the test file path
    const testPath = context.testPath || '';
    
    // Default schema path
    let schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    
    // Check if the test is for a specific service
    const serviceMatch = testPath.match(/\/src\/backend\/([^/]+)\//i);
    if (serviceMatch && serviceMatch[1]) {
      const service = serviceMatch[1];
      
      // Check if this service has its own Prisma schema
      const servicePrismaPath = path.resolve(
        process.cwd(),
        `src/backend/${service}/prisma/schema.prisma`
      );
      
      if (fs.existsSync(servicePrismaPath)) {
        schemaPath = servicePrismaPath;
      }
    }
    
    // Verify the schema file exists
    if (!fs.existsSync(schemaPath)) {
      console.warn(`Prisma schema not found at ${schemaPath}, using default`);
      schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
    }
    
    return schemaPath;
  }
  
  /**
   * Handles a test event.
   * Provides transaction management and cleanup between tests.
   * 
   * @param {Object} event - The test event
   */
  async handleTestEvent(event) {
    if (super.handleTestEvent) {
      await super.handleTestEvent(event);
    }
    
    // Handle test lifecycle events
    if (event.name === 'test_start') {
      // Test is starting, we could initialize per-test resources here
    } else if (event.name === 'test_done') {
      // Test is done, we could clean up per-test resources here
    } else if (event.name === 'test_fn_failure') {
      // Test failed, we could log additional diagnostics here
      console.log(`Test failed in schema: ${this.schema}`);
    }
  }
  
  /**
   * Generates test data helpers for use in tests.
   * This provides utility functions for creating test data with random values.
   * 
   * @returns {Object} An object containing test data generation helpers
   */
  getTestDataHelpers() {
    return {
      /**
       * Generates a random string of the specified length.
       * 
       * @param {number} length - The length of the string to generate
       * @returns {string} A random string
       */
      randomString(length = 10) {
        return crypto.randomBytes(Math.ceil(length / 2))
          .toString('hex')
          .slice(0, length);
      },
      
      /**
       * Generates a random email address.
       * 
       * @param {string} domain - Optional domain name (default: 'example.com')
       * @returns {string} A random email address
       */
      randomEmail(domain = 'example.com') {
        const username = this.randomString(8).toLowerCase();
        return `${username}@${domain}`;
      },
      
      /**
       * Generates a random date within the specified range.
       * 
       * @param {Date} start - The start date (default: 30 days ago)
       * @param {Date} end - The end date (default: today)
       * @returns {Date} A random date within the range
       */
      randomDate(start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end = new Date()) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      },
      
      /**
       * Generates a random number within the specified range.
       * 
       * @param {number} min - The minimum value (inclusive)
       * @param {number} max - The maximum value (inclusive)
       * @returns {number} A random number within the range
       */
      randomNumber(min = 0, max = 100) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },
      
      /**
       * Generates a random boolean value.
       * 
       * @param {number} trueProb - The probability of returning true (0-1)
       * @returns {boolean} A random boolean value
       */
      randomBoolean(trueProb = 0.5) {
        return Math.random() < trueProb;
      },
      
      /**
       * Generates a random item from an array.
       * 
       * @param {Array} array - The array to select from
       * @returns {*} A random item from the array
       */
      randomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
      },
      
      /**
       * Generates a random UUID.
       * 
       * @returns {string} A random UUID
       */
      randomUUID() {
        return uuidv4();
      },
      
      /**
       * Generates a random CPF (Brazilian tax ID).
       * Note: This generates a random format, not a valid CPF.
       * 
       * @returns {string} A random CPF format
       */
      randomCPF() {
        const numbers = Array.from({ length: 9 }, () => this.randomNumber(0, 9));
        return numbers.join('') + '00';
      },
      
      /**
       * Generates a random phone number.
       * 
       * @returns {string} A random phone number
       */
      randomPhone() {
        const area = this.randomNumber(11, 99);
        const prefix = this.randomNumber(10000, 99999);
        const suffix = this.randomNumber(1000, 9999);
        return `+55${area}${prefix}${suffix}`;
      }
    };
  }
  
  /**
   * Creates a transaction for a test.
   * This allows tests to run in a transaction that is rolled back after the test.
   * 
   * @returns {Promise<Object>} An object with the transaction client and a cleanup function
   */
  async createTestTransaction() {
    const client = new Client({
      connectionString: this.connectionString,
    });
    
    try {
      await client.connect();
      await client.query('BEGIN');
      
      return {
        client,
        async cleanup() {
          try {
            await client.query('ROLLBACK');
          } finally {
            await client.end();
          }
        },
      };
    } catch (error) {
      await client.end();
      throw error;
    }
  }
}

module.exports = PrismaTestEnvironment;