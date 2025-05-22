/**
 * Database End-to-End Test Setup
 * 
 * This file provides utilities for setting up and managing test databases for end-to-end tests.
 * It handles database initialization, schema migrations, test data seeding, and cleanup between tests.
 * 
 * The setup supports both local development and CI/CD pipeline environments with appropriate
 * configuration for each context.
 */

import { execSync } from 'child_process';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseErrorType } from '../../src/errors/database-error.types';
import { DatabaseException } from '../../src/errors/database-error.exception';

// Load environment variables from .env.test if available
dotenv.config({ path: resolve(process.cwd(), '.env.test') });

// Constants for database configuration
const DEFAULT_POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const DEFAULT_POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT || '5432', 10);
const DEFAULT_POSTGRES_USER = process.env.POSTGRES_USER || 'postgres';
const DEFAULT_POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'postgres';
const DEFAULT_POSTGRES_DB = process.env.POSTGRES_DB || 'test';

// Test database schema prefix to ensure isolation
const TEST_SCHEMA_PREFIX = 'test_';

// Docker Compose configuration
const DOCKER_COMPOSE_FILE = resolve(process.cwd(), 'infrastructure/docker/db/docker-compose.test.yml');
const DOCKER_COMPOSE_PROJECT = 'austa_test';

/**
 * Configuration options for test database setup
 */
export interface TestDatabaseOptions {
  /** PostgreSQL host */
  host?: string;
  /** PostgreSQL port */
  port?: number;
  /** PostgreSQL username */
  user?: string;
  /** PostgreSQL password */
  password?: string;
  /** PostgreSQL database name */
  database?: string;
  /** Whether to use Docker Compose for database setup */
  useDockerCompose?: boolean;
  /** Whether to apply migrations */
  applyMigrations?: boolean;
  /** Whether to seed test data */
  seedTestData?: boolean;
  /** Custom schema name (will be prefixed with test_) */
  schemaName?: string;
  /** Timeout for database operations in milliseconds */
  timeout?: number;
}

/**
 * Default options for test database setup
 */
const defaultOptions: TestDatabaseOptions = {
  host: DEFAULT_POSTGRES_HOST,
  port: DEFAULT_POSTGRES_PORT,
  user: DEFAULT_POSTGRES_USER,
  password: DEFAULT_POSTGRES_PASSWORD,
  database: DEFAULT_POSTGRES_DB,
  useDockerCompose: process.env.CI !== 'true', // Don't use Docker Compose in CI environment
  applyMigrations: true,
  seedTestData: true,
  timeout: 30000, // 30 seconds
};

/**
 * Class that manages database setup for end-to-end tests
 */
export class TestDatabaseSetup {
  private prismaService: PrismaService | null = null;
  private prismaClient: PrismaClient | null = null;
  private schemaName: string;
  private options: TestDatabaseOptions;
  private isInitialized = false;
  
  /**
   * Creates a new TestDatabaseSetup instance
   * 
   * @param options - Configuration options for test database setup
   */
  constructor(options: TestDatabaseOptions = {}) {
    this.options = { ...defaultOptions, ...options };
    
    // Generate a unique schema name if not provided
    const schemaPrefix = this.options.schemaName || randomUUID().replace(/-/g, '');
    this.schemaName = `${TEST_SCHEMA_PREFIX}${schemaPrefix}`;
    
    // Set environment variables for Prisma
    process.env.DATABASE_URL = this.getDatabaseUrl();
    process.env.TEST_SCHEMA = this.schemaName;
  }
  
  /**
   * Constructs the database URL for Prisma
   * 
   * @returns The database URL string
   */
  private getDatabaseUrl(): string {
    const { host, port, user, password, database } = this.options;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${this.schemaName}`;
  }
  
  /**
   * Starts the test database using Docker Compose if configured
   */
  private async startTestDatabase(): Promise<void> {
    if (!this.options.useDockerCompose) {
      console.log('Skipping Docker Compose database setup (useDockerCompose=false)');
      return;
    }
    
    try {
      console.log('Starting test database with Docker Compose...');
      execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${DOCKER_COMPOSE_PROJECT} up -d`, {
        stdio: 'inherit',
      });
      
      // Wait for database to be ready
      console.log('Waiting for database to be ready...');
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          execSync(
            `docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${DOCKER_COMPOSE_PROJECT} exec -T postgres pg_isready`,
            { stdio: 'ignore' }
          );
          console.log('Database is ready!');
          break;
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            throw new Error('Database failed to start after multiple attempts');
          }
          console.log(`Waiting for database to be ready (attempt ${attempts}/${maxAttempts})...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error('Failed to start test database:', error);
      throw new DatabaseException(
        'Failed to start test database with Docker Compose',
        DatabaseErrorType.CONNECTION,
        { error }
      );
    }
  }
  
  /**
   * Creates the test schema in the database
   */
  private async createTestSchema(): Promise<void> {
    try {
      // Create a temporary client without schema to create the schema
      const tempClient = new PrismaClient({
        datasources: {
          db: {
            url: this.getDatabaseUrl().replace(`?schema=${this.schemaName}`, ''),
          },
        },
      });
      
      // Create the schema if it doesn't exist
      await tempClient.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}";`);
      
      // Disconnect the temporary client
      await tempClient.$disconnect();
    } catch (error) {
      console.error('Failed to create test schema:', error);
      throw new DatabaseException(
        'Failed to create test schema',
        DatabaseErrorType.QUERY,
        { error, schema: this.schemaName }
      );
    }
  }
  
  /**
   * Applies database migrations to the test schema
   */
  private async applyMigrations(): Promise<void> {
    if (!this.options.applyMigrations) {
      console.log('Skipping migrations (applyMigrations=false)');
      return;
    }
    
    try {
      console.log('Applying database migrations...');
      
      // Set environment variables for Prisma CLI
      process.env.DATABASE_URL = this.getDatabaseUrl();
      
      // Run Prisma migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: this.getDatabaseUrl(),
        },
      });
      
      console.log('Migrations applied successfully');
    } catch (error) {
      console.error('Failed to apply migrations:', error);
      throw new DatabaseException(
        'Failed to apply database migrations',
        DatabaseErrorType.QUERY,
        { error, schema: this.schemaName }
      );
    }
  }
  
  /**
   * Seeds the test database with initial data
   */
  private async seedTestData(): Promise<void> {
    if (!this.options.seedTestData) {
      console.log('Skipping test data seeding (seedTestData=false)');
      return;
    }
    
    try {
      console.log('Seeding test database...');
      
      // Initialize PrismaService if not already done
      if (!this.prismaService) {
        this.prismaService = new PrismaService({
          datasources: {
            db: {
              url: this.getDatabaseUrl(),
            },
          },
        });
      }
      
      // Initialize PrismaClient if not already done
      if (!this.prismaClient) {
        this.prismaClient = new PrismaClient({
          datasources: {
            db: {
              url: this.getDatabaseUrl(),
            },
          },
        });
      }
      
      // Import the seed functions from the test seed file
      const { seedPermissions, seedRoles, seedUsers, seedJourneyData } = require('../seed.test');
      
      // Clean the database first to ensure a consistent state
      await this.prismaService.cleanDatabase();
      
      // Seed the database with test data
      await seedPermissions(this.prismaClient);
      await seedRoles(this.prismaClient);
      await seedUsers(this.prismaClient);
      await seedJourneyData(this.prismaClient);
      
      console.log('Test database seeded successfully');
    } catch (error) {
      console.error('Failed to seed test database:', error);
      throw new DatabaseException(
        'Failed to seed test database',
        DatabaseErrorType.QUERY,
        { error, schema: this.schemaName }
      );
    }
  }
  
  /**
   * Initializes the test database environment
   * 
   * @returns A promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Test database already initialized');
      return;
    }
    
    console.log(`Initializing test database with schema: ${this.schemaName}`);
    
    try {
      // Start the test database if using Docker Compose
      await this.startTestDatabase();
      
      // Create the test schema
      await this.createTestSchema();
      
      // Apply migrations
      await this.applyMigrations();
      
      // Seed test data
      await this.seedTestData();
      
      this.isInitialized = true;
      console.log('Test database initialization complete');
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      await this.cleanup();
      throw error;
    }
  }
  
  /**
   * Resets the test database by cleaning all data and re-seeding
   * 
   * @returns A promise that resolves when reset is complete
   */
  public async reset(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
      return;
    }
    
    console.log('Resetting test database...');
    
    try {
      // Ensure PrismaService is initialized
      if (!this.prismaService) {
        this.prismaService = new PrismaService({
          datasources: {
            db: {
              url: this.getDatabaseUrl(),
            },
          },
        });
      }
      
      // Clean the database
      await this.prismaService.cleanDatabase();
      
      // Re-seed the database
      await this.seedTestData();
      
      console.log('Test database reset complete');
    } catch (error) {
      console.error('Failed to reset test database:', error);
      throw new DatabaseException(
        'Failed to reset test database',
        DatabaseErrorType.QUERY,
        { error, schema: this.schemaName }
      );
    }
  }
  
  /**
   * Cleans up resources used by the test database
   * 
   * @returns A promise that resolves when cleanup is complete
   */
  public async cleanup(): Promise<void> {
    console.log('Cleaning up test database resources...');
    
    try {
      // Disconnect PrismaClient if initialized
      if (this.prismaClient) {
        await this.prismaClient.$disconnect();
        this.prismaClient = null;
      }
      
      // Disconnect PrismaService if initialized
      if (this.prismaService) {
        await this.prismaService.onModuleDestroy();
        this.prismaService = null;
      }
      
      // Drop the test schema if it was created
      if (this.isInitialized) {
        const tempClient = new PrismaClient({
          datasources: {
            db: {
              url: this.getDatabaseUrl().replace(`?schema=${this.schemaName}`, ''),
            },
          },
        });
        
        await tempClient.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${this.schemaName}" CASCADE;`);
        await tempClient.$disconnect();
      }
      
      // Stop the Docker Compose services if they were started
      if (this.options.useDockerCompose && this.isInitialized) {
        try {
          console.log('Stopping test database Docker Compose services...');
          execSync(`docker-compose -f ${DOCKER_COMPOSE_FILE} -p ${DOCKER_COMPOSE_PROJECT} down`, {
            stdio: 'inherit',
          });
        } catch (error) {
          console.warn('Failed to stop Docker Compose services:', error);
        }
      }
      
      this.isInitialized = false;
      console.log('Test database cleanup complete');
    } catch (error) {
      console.error('Failed to clean up test database resources:', error);
      throw new DatabaseException(
        'Failed to clean up test database resources',
        DatabaseErrorType.CONNECTION,
        { error, schema: this.schemaName }
      );
    }
  }
  
  /**
   * Gets the PrismaClient instance for the test database
   * 
   * @returns The PrismaClient instance
   */
  public getPrismaClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new Error('Test database not initialized. Call initialize() first.');
    }
    
    if (!this.prismaClient) {
      this.prismaClient = new PrismaClient({
        datasources: {
          db: {
            url: this.getDatabaseUrl(),
          },
        },
      });
    }
    
    return this.prismaClient;
  }
  
  /**
   * Gets the PrismaService instance for the test database
   * 
   * @returns The PrismaService instance
   */
  public getPrismaService(): PrismaService {
    if (!this.isInitialized) {
      throw new Error('Test database not initialized. Call initialize() first.');
    }
    
    if (!this.prismaService) {
      this.prismaService = new PrismaService({
        datasources: {
          db: {
            url: this.getDatabaseUrl(),
          },
        },
      });
    }
    
    return this.prismaService;
  }
  
  /**
   * Gets the schema name for the test database
   * 
   * @returns The schema name
   */
  public getSchemaName(): string {
    return this.schemaName;
  }
  
  /**
   * Gets the database URL for the test database
   * 
   * @returns The database URL
   */
  public getDatabaseUrl(): string {
    const { host, port, user, password, database } = this.options;
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=${this.schemaName}`;
  }
}

/**
 * Global test database setup instance for use in tests
 */
export const testDatabaseSetup = new TestDatabaseSetup();

/**
 * Initializes the test database for end-to-end tests
 * 
 * @param options - Configuration options for test database setup
 * @returns A promise that resolves when initialization is complete
 */
export async function initializeTestDatabase(options: TestDatabaseOptions = {}): Promise<TestDatabaseSetup> {
  const setup = new TestDatabaseSetup(options);
  await setup.initialize();
  return setup;
}

/**
 * Resets the test database between tests
 * 
 * @param setup - The TestDatabaseSetup instance to reset
 * @returns A promise that resolves when reset is complete
 */
export async function resetTestDatabase(setup: TestDatabaseSetup = testDatabaseSetup): Promise<void> {
  await setup.reset();
}

/**
 * Cleans up the test database after tests
 * 
 * @param setup - The TestDatabaseSetup instance to clean up
 * @returns A promise that resolves when cleanup is complete
 */
export async function cleanupTestDatabase(setup: TestDatabaseSetup = testDatabaseSetup): Promise<void> {
  await setup.cleanup();
}

/**
 * Gets a PrismaClient instance for the test database
 * 
 * @param setup - The TestDatabaseSetup instance to get the client from
 * @returns The PrismaClient instance
 */
export function getTestPrismaClient(setup: TestDatabaseSetup = testDatabaseSetup): PrismaClient {
  return setup.getPrismaClient();
}

/**
 * Gets a PrismaService instance for the test database
 * 
 * @param setup - The TestDatabaseSetup instance to get the service from
 * @returns The PrismaService instance
 */
export function getTestPrismaService(setup: TestDatabaseSetup = testDatabaseSetup): PrismaService {
  return setup.getPrismaService();
}

/**
 * Utility function to execute a function with a test database
 * 
 * @param fn - The function to execute with the test database
 * @param options - Configuration options for test database setup
 * @returns A promise that resolves with the result of the function
 */
export async function withTestDatabase<T>(
  fn: (client: PrismaClient, service: PrismaService) => Promise<T>,
  options: TestDatabaseOptions = {}
): Promise<T> {
  const setup = new TestDatabaseSetup(options);
  
  try {
    await setup.initialize();
    const client = setup.getPrismaClient();
    const service = setup.getPrismaService();
    
    const result = await fn(client, service);
    
    return result;
  } finally {
    await setup.cleanup();
  }
}

/**
 * Jest beforeAll hook for database tests
 * 
 * @param options - Configuration options for test database setup
 * @returns A function to use in beforeAll
 */
export function setupDatabaseTestSuite(options: TestDatabaseOptions = {}): () => Promise<void> {
  return async () => {
    await testDatabaseSetup.initialize();
  };
}

/**
 * Jest afterAll hook for database tests
 * 
 * @returns A function to use in afterAll
 */
export function teardownDatabaseTestSuite(): () => Promise<void> {
  return async () => {
    await testDatabaseSetup.cleanup();
  };
}

/**
 * Jest beforeEach hook for database tests
 * 
 * @returns A function to use in beforeEach
 */
export function resetDatabaseBeforeEach(): () => Promise<void> {
  return async () => {
    await testDatabaseSetup.reset();
  };
}