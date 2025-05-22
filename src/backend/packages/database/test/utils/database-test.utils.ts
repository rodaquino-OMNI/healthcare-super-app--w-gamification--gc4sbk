/**
 * Database Testing Utilities
 * 
 * This module provides utilities for database setup, teardown, and environment configuration
 * for testing purposes. It includes functions for creating isolated test databases,
 * applying migrations, resetting database state between tests, and managing database
 * connections during test execution.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { URL } from 'url';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Types
export interface TestDatabaseConfig {
  /** Base database URL from which to create test databases */
  baseUrl: string;
  /** Schema name prefix for test databases */
  schemaPrefix?: string;
  /** Journey name for journey-specific test databases */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | null;
  /** Whether to log database operations during tests */
  debug?: boolean;
  /** Custom Prisma schema path if not using default */
  schemaPath?: string;
  /** Whether to apply migrations automatically */
  applyMigrations?: boolean;
  /** Whether to seed the database with test data */
  seedDatabase?: boolean;
}

export interface TestDatabase {
  /** Prisma client connected to the test database */
  prisma: PrismaClient;
  /** Unique schema ID for this test database */
  schemaId: string;
  /** Full database URL including schema */
  databaseUrl: string;
  /** Clean up and disconnect from the test database */
  cleanup: () => Promise<void>;
}

// Constants
const DEFAULT_SCHEMA_PREFIX = 'test';
const DEFAULT_PRISMA_SCHEMA_PATH = join(process.cwd(), 'prisma', 'schema.prisma');
const PRISMA_BINARY_PATH = join(process.cwd(), 'node_modules', '.bin', 'prisma');

/**
 * Environment Configuration Utilities
 */

/**
 * Loads environment variables from .env files for testing
 * Prioritizes .env.test over .env
 */
export function loadTestEnvironment(): void {
  // Try to load .env.test first, then fall back to .env
  const envTestPath = join(process.cwd(), '.env.test');
  const envPath = join(process.cwd(), '.env');
  
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath });
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  
  // Set NODE_ENV to test if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
}

/**
 * Generates a database URL with a unique schema for test isolation
 * 
 * @param baseUrl - Base database connection URL
 * @param schemaId - Unique schema identifier
 * @returns Full database URL with schema parameter
 */
export function generateDatabaseUrl(baseUrl: string, schemaId: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('schema', schemaId);
    return url.toString();
  } catch (error) {
    throw new Error(`Invalid database URL: ${baseUrl}. Error: ${error.message}`);
  }
}

/**
 * Generates a unique schema ID for test isolation
 * 
 * @param prefix - Optional prefix for the schema name
 * @param journey - Optional journey name to include in the schema
 * @returns Unique schema identifier
 */
export function generateSchemaId(prefix: string = DEFAULT_SCHEMA_PREFIX, journey?: string): string {
  const journeyPrefix = journey ? `${journey}-` : '';
  return `${prefix}-${journeyPrefix}${uuidv4()}`;
}

/**
 * Database Connection Management
 */

/**
 * Creates a new Prisma client connected to a test database
 * 
 * @param databaseUrl - Full database URL including schema
 * @param debug - Whether to enable debug logging
 * @returns Prisma client instance
 */
export function createPrismaClient(databaseUrl: string, debug: boolean = false): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: debug ? ['query', 'error', 'warn'] : ['error'],
  });
}

/**
 * Database Setup and Migration
 */

/**
 * Applies Prisma migrations to a test database
 * 
 * @param databaseUrl - Full database URL including schema
 * @param schemaPath - Path to Prisma schema file
 */
export function applyMigrations(databaseUrl: string, schemaPath: string = DEFAULT_PRISMA_SCHEMA_PATH): void {
  try {
    // Ensure the schema exists
    execSync(`${PRISMA_BINARY_PATH} db push --schema=${schemaPath} --skip-generate`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'ignore',
    });
  } catch (error) {
    throw new Error(`Failed to apply migrations: ${error.message}`);
  }
}

/**
 * Seeds a test database with minimal test data
 * 
 * @param prisma - Prisma client connected to the test database
 * @param journey - Optional journey to seed specific data for
 */
export async function seedTestDatabase(
  prisma: PrismaClient,
  journey?: 'health' | 'care' | 'plan' | 'gamification' | null
): Promise<void> {
  try {
    // Create basic user for tests
    const testUser = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${uuidv4()}@example.com`,
        password: 'password-hash', // In a real implementation, this would be hashed
        phone: '+1234567890',
        cpf: '12345678901',
      },
    });

    // Seed journey-specific test data if requested
    if (journey) {
      await seedJourneyData(prisma, journey, testUser.id);
    }
  } catch (error) {
    throw new Error(`Failed to seed test database: ${error.message}`);
  }
}

/**
 * Seeds journey-specific test data
 * 
 * @param prisma - Prisma client connected to the test database
 * @param journey - Journey to seed data for
 * @param userId - User ID to associate data with
 */
async function seedJourneyData(
  prisma: PrismaClient,
  journey: 'health' | 'care' | 'plan' | 'gamification',
  userId: string
): Promise<void> {
  switch (journey) {
    case 'health':
      await seedHealthJourneyData(prisma, userId);
      break;
    case 'care':
      await seedCareJourneyData(prisma, userId);
      break;
    case 'plan':
      await seedPlanJourneyData(prisma, userId);
      break;
    case 'gamification':
      await seedGamificationJourneyData(prisma, userId);
      break;
  }
}

/**
 * Seeds health journey test data
 */
async function seedHealthJourneyData(prisma: PrismaClient, userId: string): Promise<void> {
  // Create health metric types
  const heartRateType = await prisma.healthMetricType.create({
    data: {
      name: 'HEART_RATE',
      unit: 'bpm',
      normalRangeMin: 60,
      normalRangeMax: 100,
    },
  });

  // Create sample health metrics
  await prisma.healthMetric.create({
    data: {
      userId,
      typeId: heartRateType.id,
      value: '75',
      recordedAt: new Date(),
    },
  });
}

/**
 * Seeds care journey test data
 */
async function seedCareJourneyData(prisma: PrismaClient, userId: string): Promise<void> {
  // Create provider specialty
  const specialty = await prisma.providerSpecialty.create({
    data: {
      name: 'Cardiologia',
      description: 'Especialista em coração e sistema cardiovascular',
    },
  });

  // Create healthcare provider
  const provider = await prisma.healthcareProvider.create({
    data: {
      name: 'Dr. Test Provider',
      specialtyId: specialty.id,
      licenseNumber: 'CRM-12345',
    },
  });

  // Create appointment
  await prisma.appointment.create({
    data: {
      userId,
      providerId: provider.id,
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      status: 'SCHEDULED',
      notes: 'Test appointment',
    },
  });
}

/**
 * Seeds plan journey test data
 */
async function seedPlanJourneyData(prisma: PrismaClient, userId: string): Promise<void> {
  // Create insurance plan type
  const planType = await prisma.insurancePlanType.create({
    data: {
      name: 'Básico',
      description: 'Plano com cobertura básica',
    },
  });

  // Create insurance plan
  const plan = await prisma.insurancePlan.create({
    data: {
      userId,
      typeId: planType.id,
      policyNumber: `POL-${uuidv4().substring(0, 8)}`,
      startDate: new Date(),
      endDate: new Date(Date.now() + 31536000000), // 1 year from now
      status: 'ACTIVE',
    },
  });
}

/**
 * Seeds gamification journey test data
 */
async function seedGamificationJourneyData(prisma: PrismaClient, userId: string): Promise<void> {
  // Create gamification profile
  await prisma.gamificationProfile.create({
    data: {
      userId,
      level: 1,
      xp: 0,
      streakDays: 0,
      lastActivityAt: new Date(),
    },
  });

  // Create achievement type
  const achievementType = await prisma.achievementType.create({
    data: {
      name: 'health-check-streak',
      title: 'Monitor de Saúde',
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: 'health',
      icon: 'heart-pulse',
      levels: 3,
    },
  });
}

/**
 * Database Cleanup
 */

/**
 * Drops a test schema and all its objects
 * 
 * @param prisma - Prisma client connected to the test database
 * @param schemaId - Schema ID to drop
 */
export async function dropTestSchema(prisma: PrismaClient, schemaId: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE;`);
  } catch (error) {
    console.error(`Error dropping schema ${schemaId}:`, error);
  }
}

/**
 * Cleans up all test resources
 * 
 * @param prisma - Prisma client to disconnect
 * @param schemaId - Schema ID to drop
 */
export async function cleanupTestDatabase(prisma: PrismaClient, schemaId: string): Promise<void> {
  try {
    // Drop the schema first
    await dropTestSchema(prisma, schemaId);
    
    // Then disconnect the client
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    // Still try to disconnect even if dropping schema failed
    await prisma.$disconnect().catch(e => console.error('Error disconnecting Prisma client:', e));
  }
}

/**
 * Main Test Database Setup
 */

/**
 * Creates an isolated test database with a unique schema
 * 
 * @param config - Test database configuration
 * @returns Test database object with Prisma client and cleanup function
 */
export async function createTestDatabase(config: TestDatabaseConfig): Promise<TestDatabase> {
  // Generate a unique schema ID for this test
  const schemaId = generateSchemaId(
    config.schemaPrefix || DEFAULT_SCHEMA_PREFIX,
    config.journey || undefined
  );
  
  // Generate the database URL with the schema
  const databaseUrl = generateDatabaseUrl(config.baseUrl, schemaId);
  
  // Create a Prisma client for this test database
  const prisma = createPrismaClient(databaseUrl, config.debug);
  
  // Apply migrations if requested
  if (config.applyMigrations !== false) {
    applyMigrations(databaseUrl, config.schemaPath);
  }
  
  // Seed the database if requested
  if (config.seedDatabase) {
    await seedTestDatabase(prisma, config.journey);
  }
  
  // Return the test database object
  return {
    prisma,
    schemaId,
    databaseUrl,
    cleanup: async () => await cleanupTestDatabase(prisma, schemaId),
  };
}

/**
 * Creates a test database for a specific journey
 * 
 * @param journey - Journey to create test database for
 * @param config - Additional test database configuration
 * @returns Test database object with Prisma client and cleanup function
 */
export async function createJourneyTestDatabase(
  journey: 'health' | 'care' | 'plan' | 'gamification',
  config: Omit<TestDatabaseConfig, 'journey'>
): Promise<TestDatabase> {
  return createTestDatabase({
    ...config,
    journey,
    schemaPrefix: `${journey}-test`,
    seedDatabase: config.seedDatabase !== false, // Default to true for journey databases
  });
}

/**
 * Jest Lifecycle Hooks
 */

/**
 * Sets up a test database before all tests in a suite
 * 
 * @param config - Test database configuration
 * @returns Test database object and teardown function
 */
export function setupTestDatabaseBeforeAll(config: TestDatabaseConfig): () => Promise<TestDatabase> {
  let testDb: TestDatabase;
  
  beforeAll(async () => {
    testDb = await createTestDatabase(config);
  });
  
  afterAll(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });
  
  return () => Promise.resolve(testDb);
}

/**
 * Sets up a fresh test database before each test
 * 
 * @param config - Test database configuration
 * @returns Function to get the current test database
 */
export function setupTestDatabaseBeforeEach(config: TestDatabaseConfig): () => Promise<TestDatabase> {
  let testDb: TestDatabase;
  
  beforeEach(async () => {
    testDb = await createTestDatabase(config);
  });
  
  afterEach(async () => {
    if (testDb) {
      await testDb.cleanup();
    }
  });
  
  return () => Promise.resolve(testDb);
}