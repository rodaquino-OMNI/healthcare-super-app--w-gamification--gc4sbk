/**
 * Database E2E Test Setup
 * 
 * This file provides utilities for setting up the test environment for database end-to-end tests.
 * It initializes test databases, applies migrations, seeds test data, and provides utilities for
 * database reset between tests.
 * 
 * Features:
 * - Docker Compose integration for local test database setup
 * - Schema-based test isolation for parallel test execution
 * - Journey-specific test data seeding
 * - Database reset functionality for test isolation
 * - CI/CD pipeline support with environment-based configuration
 * 
 * Usage:
 * ```typescript
 * // In Jest globalSetup
 * import { setupTestDatabase } from './setup';
 * export default async () => { await setupTestDatabase(); };
 * 
 * // In Jest globalTeardown
 * import { teardownTestDatabase } from './setup';
 * export default async () => { await teardownTestDatabase(); };
 * 
 * // In test files
 * import { resetTestDatabase, globalTestDatabase } from './setup';
 * 
 * beforeEach(async () => {
 *   await resetTestDatabase();
 * });
 * 
 * test('should perform database operations', async () => {
 *   const prisma = globalTestDatabase.getPrismaClient();
 *   // Test database operations
 * });
 * ```
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../src/prisma.service';

// Load environment variables from .env.test if it exists
const envPath = path.resolve(process.cwd(), '.env.test');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Default test database configuration
const DEFAULT_TEST_DB_CONFIG = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'postgres',
  database: process.env.TEST_DB_NAME || 'austa_test',
};

// Docker Compose configuration for local test database
const DOCKER_COMPOSE_FILE = path.resolve(process.cwd(), 'docker-compose.test.yml');

/**
 * Configuration options for test database setup
 */
export interface TestDatabaseOptions {
  /** Database host */
  host?: string;
  /** Database port */
  port?: number;
  /** Database user */
  user?: string;
  /** Database password */
  password?: string;
  /** Database name */
  database?: string;
  /** Whether to use Docker Compose for database setup */
  useDockerCompose?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
  /** Whether to seed the database with test data */
  seedDatabase?: boolean;
  /** Schema name for test isolation */
  schema?: string;
  /** Journey context to use for seeding (health, care, plan, or all) */
  journeyContext?: 'health' | 'care' | 'plan' | 'all';
}

/**
 * Class that manages the test database environment for E2E tests
 */
export class TestDatabaseSetup {
  private prismaClient: PrismaClient;
  private prismaService: PrismaService;
  private options: Required<TestDatabaseOptions>;
  private originalDatabaseUrl: string | undefined;
  private testDatabaseUrl: string;
  private isInitialized = false;

  /**
   * Creates a new TestDatabaseSetup instance
   * 
   * @param options - Configuration options for test database setup
   */
  constructor(options: TestDatabaseOptions = {}) {
    // Merge provided options with defaults
    this.options = {
      host: options.host || DEFAULT_TEST_DB_CONFIG.host,
      port: options.port || DEFAULT_TEST_DB_CONFIG.port,
      user: options.user || DEFAULT_TEST_DB_CONFIG.user,
      password: options.password || DEFAULT_TEST_DB_CONFIG.password,
      database: options.database || DEFAULT_TEST_DB_CONFIG.database,
      useDockerCompose: options.useDockerCompose !== undefined ? options.useDockerCompose : true,
      applyMigrations: options.applyMigrations !== undefined ? options.applyMigrations : true,
      seedDatabase: options.seedDatabase !== undefined ? options.seedDatabase : true,
      schema: options.schema || `test_${uuidv4().replace(/-/g, '_')}`,
      journeyContext: options.journeyContext || 'all',
    };

    // Store original DATABASE_URL
    this.originalDatabaseUrl = process.env.DATABASE_URL;

    // Create test database URL with schema
    this.testDatabaseUrl = this.buildDatabaseUrl();

    // Set DATABASE_URL for Prisma
    process.env.DATABASE_URL = this.testDatabaseUrl;

    // Create Prisma client and service
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: this.testDatabaseUrl,
        },
      },
    });

    this.prismaService = new PrismaService();
  }

  /**
   * Builds the database URL for the test database
   * 
   * @returns The database URL string
   */
  private buildDatabaseUrl(): string {
    const { host, port, user, password, database, schema } = this.options;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${schema}`;
  }

  /**
   * Initializes the test database environment
   * 
   * @returns A promise that resolves when initialization is complete
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing test database environment...');

    try {
      // Start Docker Compose if needed
      if (this.options.useDockerCompose) {
        await this.startDockerCompose();
      }

      // Create schema if it doesn't exist
      await this.createSchema();

      // Apply migrations if needed
      if (this.options.applyMigrations) {
        await this.applyMigrations();
      }

      // Seed database if needed
      if (this.options.seedDatabase) {
        await this.seedDatabase();
      }

      this.isInitialized = true;
      console.log('Test database environment initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize test database environment:', error);
      await this.cleanup();
      throw error;
    }
  }

  /**
   * Starts the Docker Compose environment for the test database
   * 
   * @returns A promise that resolves when Docker Compose is started
   */
  private async startDockerCompose(): Promise<void> {
    if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
      console.warn(`Docker Compose file not found at ${DOCKER_COMPOSE_FILE}, skipping Docker setup.`);
      return;
    }

    try {
      console.log('Starting Docker Compose for test database...');
      execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`, { stdio: 'inherit' });
      
      // Wait for database to be ready
      await this.waitForDatabase();
      console.log('Docker Compose started successfully.');
    } catch (error) {
      console.error('Failed to start Docker Compose:', error);
      throw error;
    }
  }

  /**
   * Waits for the database to be ready to accept connections
   * 
   * @param maxRetries - Maximum number of connection attempts
   * @param retryInterval - Interval between retries in milliseconds
   * @returns A promise that resolves when the database is ready
   */
  private async waitForDatabase(maxRetries = 20, retryInterval = 1000): Promise<void> {
    console.log('Waiting for database to be ready...');
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Try to connect to the database
        const client = new PrismaClient({
          datasources: {
            db: {
              url: `postgresql://${this.options.user}:${this.options.password}@${this.options.host}:${this.options.port}/${this.options.database}`,
            },
          },
        });
        
        await client.$connect();
        await client.$disconnect();
        
        console.log('Database is ready.');
        return;
      } catch (error) {
        console.log(`Database not ready yet, retrying in ${retryInterval}ms... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
    
    throw new Error(`Database not ready after ${maxRetries} attempts.`);
  }

  /**
   * Creates the test schema if it doesn't exist
   * 
   * @returns A promise that resolves when the schema is created
   */
  private async createSchema(): Promise<void> {
    try {
      console.log(`Creating test schema: ${this.options.schema}`);
      
      // Connect to the database without schema specification
      const client = new PrismaClient({
        datasources: {
          db: {
            url: `postgresql://${this.options.user}:${this.options.password}@${this.options.host}:${this.options.port}/${this.options.database}`,
          },
        },
      });
      
      // Create schema if it doesn't exist
      await client.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.options.schema}";`);
      await client.$disconnect();
      
      console.log(`Schema ${this.options.schema} created successfully.`);
    } catch (error) {
      console.error('Failed to create schema:', error);
      throw error;
    }
  }

  /**
   * Applies database migrations to the test schema
   * 
   * @returns A promise that resolves when migrations are applied
   */
  private async applyMigrations(): Promise<void> {
    try {
      console.log('Applying database migrations...');
      
      // Use Prisma migrate to apply migrations
      execSync('npx prisma migrate deploy', {
        env: {
          ...process.env,
          DATABASE_URL: this.testDatabaseUrl,
        },
        stdio: 'inherit',
      });
      
      console.log('Migrations applied successfully.');
    } catch (error) {
      console.error('Failed to apply migrations:', error);
      throw error;
    }
  }

  /**
   * Seeds the test database with initial data
   * 
   * @returns A promise that resolves when seeding is complete
   */
  private async seedDatabase(): Promise<void> {
    try {
      console.log('Seeding test database...');
      
      // Import seed functions from the shared seed file
      // The seed.test.ts file is an adapted version of the original seed.ts
      // that provides functions for test data generation
      const { seedPermissions, seedRoles, seedUsers, seedJourneyData } = await import('../seed.test');
      
      // Connect to the database
      await this.prismaClient.$connect();
      
      // Clean the database first to ensure a consistent state
      await this.prismaService.cleanDatabase();
      
      // Seed permissions and roles
      await seedPermissions(this.prismaClient);
      await seedRoles(this.prismaClient);
      
      // Seed users
      await seedUsers(this.prismaClient);
      
      // Seed journey-specific data based on the selected journey context
      if (this.options.journeyContext === 'all' || this.options.journeyContext === 'health') {
        await seedJourneyData(this.prismaClient, 'health');
      }
      
      if (this.options.journeyContext === 'all' || this.options.journeyContext === 'care') {
        await seedJourneyData(this.prismaClient, 'care');
      }
      
      if (this.options.journeyContext === 'all' || this.options.journeyContext === 'plan') {
        await seedJourneyData(this.prismaClient, 'plan');
      }
      
      console.log('Database seeded successfully.');
    } catch (error) {
      console.error('Failed to seed database:', error);
      throw error;
    } finally {
      await this.prismaClient.$disconnect();
    }
  }

  /**
   * Resets the test database by cleaning all data and re-seeding
   * 
   * @returns A promise that resolves when the database is reset
   */
  async resetDatabase(): Promise<void> {
    try {
      console.log('Resetting test database...');
      
      // Connect to the database
      await this.prismaClient.$connect();
      
      // Clean the database
      await this.prismaService.cleanDatabase();
      
      // Re-seed the database if needed
      if (this.options.seedDatabase) {
        await this.seedDatabase();
      }
      
      console.log('Database reset successfully.');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    } finally {
      await this.prismaClient.$disconnect();
    }
  }

  /**
   * Cleans up the test database environment
   * 
   * @returns A promise that resolves when cleanup is complete
   */
  async cleanup(): Promise<void> {
    try {
      console.log('Cleaning up test database environment...');
      
      // Disconnect from the database
      await this.prismaClient.$disconnect();
      
      // Drop the test schema
      const client = new PrismaClient({
        datasources: {
          db: {
            url: `postgresql://${this.options.user}:${this.options.password}@${this.options.host}:${this.options.port}/${this.options.database}`,
          },
        },
      });
      
      await client.$connect();
      await client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${this.options.schema}" CASCADE;`);
      await client.$disconnect();
      
      // Stop Docker Compose if it was started
      if (this.options.useDockerCompose) {
        await this.stopDockerCompose();
      }
      
      // Restore original DATABASE_URL
      if (this.originalDatabaseUrl) {
        process.env.DATABASE_URL = this.originalDatabaseUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
      
      this.isInitialized = false;
      console.log('Test database environment cleaned up successfully.');
    } catch (error) {
      console.error('Failed to clean up test database environment:', error);
      throw error;
    }
  }

  /**
   * Stops the Docker Compose environment
   * 
   * @returns A promise that resolves when Docker Compose is stopped
   */
  private async stopDockerCompose(): Promise<void> {
    if (!fs.existsSync(DOCKER_COMPOSE_FILE)) {
      return;
    }

    try {
      console.log('Stopping Docker Compose...');
      execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} down`, { stdio: 'inherit' });
      console.log('Docker Compose stopped successfully.');
    } catch (error) {
      console.error('Failed to stop Docker Compose:', error);
      throw error;
    }
  }

  /**
   * Gets the Prisma client for the test database
   * 
   * @returns The Prisma client instance
   */
  getPrismaClient(): PrismaClient {
    return this.prismaClient;
  }

  /**
   * Gets the Prisma service for the test database
   * 
   * @returns The Prisma service instance
   */
  getPrismaService(): PrismaService {
    return this.prismaService;
  }

  /**
   * Gets the test database URL
   * 
   * @returns The test database URL
   */
  getTestDatabaseUrl(): string {
    return this.testDatabaseUrl;
  }

  /**
   * Gets the test schema name
   * 
   * @returns The test schema name
   */
  getTestSchema(): string {
    return this.options.schema;
  }
}

/**
 * Global test database setup instance for Jest tests
 */
export const globalTestDatabase = new TestDatabaseSetup();

/**
 * Initializes the test database for Jest tests
 * 
 * This function should be called in the Jest globalSetup file.
 * 
 * @returns A promise that resolves when initialization is complete
 */
export async function setupTestDatabase(): Promise<void> {
  await globalTestDatabase.initialize();
}

/**
 * Cleans up the test database after Jest tests
 * 
 * This function should be called in the Jest globalTeardown file.
 * 
 * @returns A promise that resolves when cleanup is complete
 */
export async function teardownTestDatabase(): Promise<void> {
  await globalTestDatabase.cleanup();
}

/**
 * Resets the test database between test suites
 * 
 * This function should be called in the beforeEach or afterEach hooks.
 * 
 * @returns A promise that resolves when the database is reset
 */
export async function resetTestDatabase(): Promise<void> {
  await globalTestDatabase.resetDatabase();
}

/**
 * Creates a new test database setup instance with custom options
 * 
 * @param options - Configuration options for test database setup
 * @returns A promise that resolves to the initialized TestDatabaseSetup instance
 */
export async function createTestDatabase(options: TestDatabaseOptions = {}): Promise<TestDatabaseSetup> {
  const testDatabase = new TestDatabaseSetup(options);
  await testDatabase.initialize();
  return testDatabase;
}

/**
 * Sets up the test database for a specific journey context
 * 
 * @param journeyContext - The journey context to set up (health, care, plan, or all)
 * @returns A promise that resolves to the initialized TestDatabaseSetup instance
 */
export async function setupJourneyTestDatabase(
  journeyContext: 'health' | 'care' | 'plan' | 'all' = 'all'
): Promise<TestDatabaseSetup> {
  return createTestDatabase({ journeyContext });
}