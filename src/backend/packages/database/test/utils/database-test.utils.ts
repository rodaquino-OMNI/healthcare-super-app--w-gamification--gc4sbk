/**
 * Database testing utilities for setting up, managing, and tearing down test databases.
 * 
 * These utilities provide functions for creating isolated test databases, applying migrations,
 * managing database connections during tests, and cleaning up after tests to prevent data leakage.
 * 
 * @module database-test-utils
 */

import { execSync } from 'child_process';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../src/prisma.service';
import { DatabaseErrorException } from '../../src/errors/database-error.exception';
import { DatabaseErrorType } from '../../src/errors/database-error.types';

/**
 * Configuration options for test database setup.
 */
export interface TestDatabaseOptions {
  /**
   * The schema name to use for the test database.
   * If not provided, a random schema name will be generated.
   */
  schemaName?: string;
  
  /**
   * The path to the Prisma schema file.
   * If not provided, it will try to find the schema file in the standard locations.
   */
  schemaPath?: string;
  
  /**
   * Whether to apply migrations to the test database.
   * @default true
   */
  applyMigrations?: boolean;
  
  /**
   * Whether to seed the test database with initial data.
   * @default false
   */
  seedDatabase?: boolean;
  
  /**
   * The journey context to use for the test database.
   * This affects which migrations and seed data are applied.
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'all';
  
  /**
   * Whether to log database operations during tests.
   * @default false
   */
  enableLogging?: boolean;
  
  /**
   * Whether to use TimescaleDB features for time-series data.
   * Only applicable for health journey tests that use time-series data.
   * @default false
   */
  useTimescaleDB?: boolean;
}

/**
 * Information about a test database instance.
 */
export interface TestDatabaseInfo {
  /**
   * The URL used to connect to the test database.
   */
  url: string;
  
  /**
   * The schema name of the test database.
   */
  schema: string;
  
  /**
   * The Prisma client instance connected to the test database.
   */
  prismaClient: PrismaClient;
  
  /**
   * The enhanced PrismaService instance connected to the test database.
   */
  prismaService: PrismaService;
  
  /**
   * The journey context used for this test database.
   */
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'all';
}

/**
 * Map of active test database instances by schema name.
 */
const testDatabases = new Map<string, TestDatabaseInfo>();

/**
 * Creates an isolated test database with a unique schema.
 * 
 * @param options - Configuration options for the test database
 * @returns Information about the created test database
 * @throws {DatabaseErrorException} If database creation fails
 */
export async function createTestDatabase(options: TestDatabaseOptions = {}): Promise<TestDatabaseInfo> {
  try {
    // Generate a unique schema name if not provided
    const schemaName = options.schemaName || `test_${randomUUID().replace(/-/g, '')}`;
    
    // Find the Prisma schema file
    const schemaPath = options.schemaPath || findPrismaSchema(options.journeyContext);
    
    if (!schemaPath || !fs.existsSync(schemaPath)) {
      throw new DatabaseErrorException(
        'Failed to find Prisma schema file',
        DatabaseErrorType.CONFIGURATION,
        { schemaPath, journeyContext: options.journeyContext }
      );
    }
    
    // Create a new database URL with the test schema
    const databaseUrl = generateTestDatabaseUrl(schemaName);
    
    // Create the schema
    await createDatabaseSchema(databaseUrl, schemaName);
    
    // Apply migrations if requested
    if (options.applyMigrations !== false) {
      await applyDatabaseMigrations(databaseUrl, schemaPath, options.journeyContext);
    }
    
    // Create Prisma clients
    const prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: options.enableLogging ? ['query', 'error', 'warn'] : [],
    });
    
    const prismaService = new PrismaService({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: options.enableLogging ? ['query', 'error', 'warn'] : [],
    });
    
    // Connect to the database
    await prismaClient.$connect();
    await prismaService.onModuleInit();
    
    // Seed the database if requested
    if (options.seedDatabase) {
      await seedTestDatabase(prismaClient, options.journeyContext);
    }
    
    // Configure TimescaleDB if requested
    if (options.useTimescaleDB && options.journeyContext === 'health') {
      await configureTimescaleDB(prismaClient, schemaName);
    }
    
    // Store the test database info
    const testDbInfo: TestDatabaseInfo = {
      url: databaseUrl,
      schema: schemaName,
      prismaClient,
      prismaService,
      journeyContext: options.journeyContext,
    };
    
    testDatabases.set(schemaName, testDbInfo);
    
    return testDbInfo;
  } catch (error) {
    if (error instanceof DatabaseErrorException) {
      throw error;
    }
    
    throw new DatabaseErrorException(
      'Failed to create test database',
      DatabaseErrorType.CONFIGURATION,
      { error: error.message, options }
    );
  }
}

/**
 * Destroys a test database and cleans up all resources.
 * 
 * @param schemaName - The schema name of the test database to destroy
 * @throws {DatabaseErrorException} If database destruction fails
 */
export async function destroyTestDatabase(schemaName: string): Promise<void> {
  try {
    const testDb = testDatabases.get(schemaName);
    
    if (!testDb) {
      console.warn(`Test database with schema '${schemaName}' not found, skipping destruction`);
      return;
    }
    
    // Disconnect Prisma clients
    await testDb.prismaClient.$disconnect();
    await testDb.prismaService.onModuleDestroy();
    
    // Drop the schema
    await dropDatabaseSchema(testDb.url, schemaName);
    
    // Remove from the map
    testDatabases.delete(schemaName);
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to destroy test database',
      DatabaseErrorType.CONFIGURATION,
      { schemaName, error: error.message }
    );
  }
}

/**
 * Destroys all active test databases.
 * 
 * @throws {DatabaseErrorException} If any database destruction fails
 */
export async function destroyAllTestDatabases(): Promise<void> {
  const schemas = Array.from(testDatabases.keys());
  
  for (const schema of schemas) {
    await destroyTestDatabase(schema);
  }
}

/**
 * Resets a test database by truncating all tables but keeping the schema.
 * 
 * @param schemaName - The schema name of the test database to reset
 * @throws {DatabaseErrorException} If database reset fails
 */
export async function resetTestDatabase(schemaName: string): Promise<void> {
  try {
    const testDb = testDatabases.get(schemaName);
    
    if (!testDb) {
      throw new DatabaseErrorException(
        'Test database not found',
        DatabaseErrorType.CONFIGURATION,
        { schemaName }
      );
    }
    
    // Execute a query to truncate all tables
    await testDb.prismaClient.$executeRawUnsafe(`
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = '${schemaName}') LOOP
          EXECUTE 'TRUNCATE TABLE "${schemaName}"."' || r.tablename || '" CASCADE';
        END LOOP;
      END $$;
    `);
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to reset test database',
      DatabaseErrorType.QUERY,
      { schemaName, error: error.message }
    );
  }
}

/**
 * Finds the appropriate Prisma schema file based on the journey context.
 * 
 * @param journeyContext - The journey context to find the schema for
 * @returns The path to the Prisma schema file, or undefined if not found
 */
function findPrismaSchema(journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'all'): string | undefined {
  // Common locations to check for schema files
  const locations = [
    // Root prisma schema
    path.resolve(process.cwd(), 'prisma/schema.prisma'),
    
    // Journey-specific schemas
    path.resolve(process.cwd(), '../health-service/prisma/schema.prisma'),
    path.resolve(process.cwd(), '../care-service/prisma/schema.prisma'),
    path.resolve(process.cwd(), '../plan-service/prisma/schema.prisma'),
    path.resolve(process.cwd(), '../gamification-engine/prisma/schema.prisma'),
    
    // Relative to the package
    path.resolve(__dirname, '../../../health-service/prisma/schema.prisma'),
    path.resolve(__dirname, '../../../care-service/prisma/schema.prisma'),
    path.resolve(__dirname, '../../../plan-service/prisma/schema.prisma'),
    path.resolve(__dirname, '../../../gamification-engine/prisma/schema.prisma'),
  ];
  
  // If a specific journey context is provided, prioritize that schema
  if (journeyContext && journeyContext !== 'all') {
    const journeySchemaPath = locations.find(loc => 
      loc.includes(`/${journeyContext}`) || 
      (journeyContext === 'gamification' && loc.includes('/gamification-engine'))
    );
    
    if (journeySchemaPath && fs.existsSync(journeySchemaPath)) {
      return journeySchemaPath;
    }
  }
  
  // Otherwise, find the first existing schema file
  return locations.find(loc => fs.existsSync(loc));
}

/**
 * Generates a database URL for the test database.
 * 
 * @param schemaName - The schema name for the test database
 * @returns The database URL with the test schema
 */
function generateTestDatabaseUrl(schemaName: string): string {
  // Get the base URL from environment variables or use a default
  const baseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test';
  
  // Parse the URL to add the schema parameter
  const url = new URL(baseUrl);
  
  // Add or replace the schema parameter
  const searchParams = new URLSearchParams(url.search);
  searchParams.set('schema', schemaName);
  url.search = searchParams.toString();
  
  return url.toString();
}

/**
 * Creates a new database schema for testing.
 * 
 * @param databaseUrl - The database URL
 * @param schemaName - The schema name to create
 * @throws {DatabaseErrorException} If schema creation fails
 */
async function createDatabaseSchema(databaseUrl: string, schemaName: string): Promise<void> {
  try {
    // Create a temporary Prisma client to execute the raw query
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    
    try {
      await prisma.$connect();
      
      // Create the schema if it doesn't exist
      await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to create database schema',
      DatabaseErrorType.CONFIGURATION,
      { schemaName, error: error.message }
    );
  }
}

/**
 * Drops a database schema used for testing.
 * 
 * @param databaseUrl - The database URL
 * @param schemaName - The schema name to drop
 * @throws {DatabaseErrorException} If schema dropping fails
 */
async function dropDatabaseSchema(databaseUrl: string, schemaName: string): Promise<void> {
  try {
    // Create a temporary Prisma client to execute the raw query
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    
    try {
      await prisma.$connect();
      
      // Drop the schema with cascade to remove all objects
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE;`);
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to drop database schema',
      DatabaseErrorType.CONFIGURATION,
      { schemaName, error: error.message }
    );
  }
}

/**
 * Applies database migrations to a test database.
 * 
 * @param databaseUrl - The database URL
 * @param schemaPath - The path to the Prisma schema file
 * @param journeyContext - The journey context for selecting migrations
 * @throws {DatabaseErrorException} If migration application fails
 */
async function applyDatabaseMigrations(
  databaseUrl: string,
  schemaPath: string,
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'all'
): Promise<void> {
  try {
    // Set environment variables for the Prisma CLI
    process.env.DATABASE_URL = databaseUrl;
    
    // Determine the migrations directory based on the journey context
    let migrationsDir = path.dirname(schemaPath) + '/migrations';
    
    if (journeyContext && journeyContext !== 'all') {
      // For specific journey contexts, we might need to use a different migrations directory
      const journeyMigrationsDir = findJourneyMigrationsDir(journeyContext);
      if (journeyMigrationsDir) {
        migrationsDir = journeyMigrationsDir;
      }
    }
    
    // Check if the migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.warn(`Migrations directory not found: ${migrationsDir}, skipping migrations`);
      return;
    }
    
    // Apply migrations using Prisma Migrate
    execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to apply database migrations',
      DatabaseErrorType.CONFIGURATION,
      { databaseUrl, schemaPath, journeyContext, error: error.message }
    );
  }
}

/**
 * Finds the migrations directory for a specific journey context.
 * 
 * @param journeyContext - The journey context to find migrations for
 * @returns The path to the migrations directory, or undefined if not found
 */
function findJourneyMigrationsDir(journeyContext: 'health' | 'care' | 'plan' | 'gamification'): string | undefined {
  // Common locations to check for migrations directories
  const locations = [
    // Journey-specific migrations
    path.resolve(process.cwd(), `../health-service/prisma/migrations`),
    path.resolve(process.cwd(), `../care-service/prisma/migrations`),
    path.resolve(process.cwd(), `../plan-service/prisma/migrations`),
    path.resolve(process.cwd(), `../gamification-engine/prisma/migrations`),
    
    // Relative to the package
    path.resolve(__dirname, `../../../health-service/prisma/migrations`),
    path.resolve(__dirname, `../../../care-service/prisma/migrations`),
    path.resolve(__dirname, `../../../plan-service/prisma/migrations`),
    path.resolve(__dirname, `../../../gamification-engine/prisma/migrations`),
  ];
  
  // Find the migrations directory for the specified journey
  const journeyDir = locations.find(loc => 
    loc.includes(`/${journeyContext}`) || 
    (journeyContext === 'gamification' && loc.includes('/gamification-engine'))
  );
  
  return journeyDir && fs.existsSync(journeyDir) ? journeyDir : undefined;
}

/**
 * Seeds a test database with initial data.
 * 
 * @param prismaClient - The Prisma client connected to the test database
 * @param journeyContext - The journey context for selecting seed data
 * @throws {DatabaseErrorException} If database seeding fails
 */
async function seedTestDatabase(
  prismaClient: PrismaClient,
  journeyContext?: 'health' | 'care' | 'plan' | 'gamification' | 'all'
): Promise<void> {
  try {
    // Seed common data (users, roles, permissions)
    await seedCommonData(prismaClient);
    
    // Seed journey-specific data if requested
    if (journeyContext) {
      if (journeyContext === 'health' || journeyContext === 'all') {
        await seedHealthJourneyData(prismaClient);
      }
      
      if (journeyContext === 'care' || journeyContext === 'all') {
        await seedCareJourneyData(prismaClient);
      }
      
      if (journeyContext === 'plan' || journeyContext === 'all') {
        await seedPlanJourneyData(prismaClient);
      }
      
      if (journeyContext === 'gamification' || journeyContext === 'all') {
        await seedGamificationData(prismaClient);
      }
    }
  } catch (error) {
    throw new DatabaseErrorException(
      'Failed to seed test database',
      DatabaseErrorType.QUERY,
      { journeyContext, error: error.message }
    );
  }
}

/**
 * Seeds common data (users, roles, permissions) in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 */
async function seedCommonData(prisma: PrismaClient): Promise<void> {
  // Seed permissions
  const healthPermissions = [
    { name: 'health:metrics:read', description: 'View health metrics' },
    { name: 'health:metrics:write', description: 'Record health metrics' },
  ];
  
  const carePermissions = [
    { name: 'care:appointments:read', description: 'View appointments' },
    { name: 'care:appointments:write', description: 'Manage appointments' },
  ];
  
  const planPermissions = [
    { name: 'plan:coverage:read', description: 'View coverage information' },
    { name: 'plan:claims:read', description: 'View claims' },
  ];
  
  const gamificationPermissions = [
    { name: 'game:achievements:read', description: 'View achievements' },
    { name: 'game:progress:read', description: 'View progress' },
  ];
  
  const allPermissions = [
    ...healthPermissions,
    ...carePermissions,
    ...planPermissions,
    ...gamificationPermissions,
  ];
  
  for (const permission of allPermissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  
  // Seed roles
  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Standard user with access to all journeys',
      isDefault: true,
    },
  });
  
  // Connect permissions to roles
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ name: p.name })),
      },
    },
  });
  
  // Create test user
  await prisma.user.upsert({
    where: { email: 'test@austa.com.br' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@austa.com.br',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Password123!
      roles: {
        connect: { id: userRole.id },
      },
    },
  });
}

/**
 * Seeds Health journey data in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 */
async function seedHealthJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample health metrics types
  const metricTypes = [
    { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
  ];

  for (const metricType of metricTypes) {
    await prisma.healthMetricType.upsert({
      where: { name: metricType.name },
      update: {},
      create: metricType,
    });
  }
  
  // Sample device types
  const deviceTypes = [
    { name: 'Smartwatch', description: 'Wearable smartwatch device', manufacturer: 'Various' },
    { name: 'Blood Pressure Monitor', description: 'Blood pressure monitoring device', manufacturer: 'Various' },
  ];
  
  for (const deviceType of deviceTypes) {
    await prisma.deviceType.upsert({
      where: { name: deviceType.name },
      update: {},
      create: deviceType,
    });
  }
}

/**
 * Seeds Care journey data in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 */
async function seedCareJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample provider specialties
  const specialties = [
    { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
    { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
  ];
  
  for (const specialty of specialties) {
    await prisma.providerSpecialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
  }
}

/**
 * Seeds Plan journey data in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 */
async function seedPlanJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample plan types
  const planTypes = [
    { name: 'Básico', description: 'Plano com cobertura básica' },
    { name: 'Standard', description: 'Plano com cobertura intermediária' },
  ];
  
  for (const planType of planTypes) {
    await prisma.insurancePlanType.upsert({
      where: { name: planType.name },
      update: {},
      create: planType,
    });
  }
  
  // Sample claim types
  const claimTypes = [
    { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
    { name: 'Exame', description: 'Reembolso para exames médicos' },
  ];
  
  for (const claimType of claimTypes) {
    await prisma.claimType.upsert({
      where: { name: claimType.name },
      update: {},
      create: claimType,
    });
  }
}

/**
 * Seeds Gamification data in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 */
async function seedGamificationData(prisma: PrismaClient): Promise<void> {
  // Sample achievement types
  const achievementTypes = [
    { 
      name: 'health-check-streak', 
      title: 'Monitor de Saúde', 
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: 'health',
      icon: 'heart-pulse',
      levels: 3
    },
    { 
      name: 'appointment-keeper', 
      title: 'Compromisso com a Saúde', 
      description: 'Compareça às consultas agendadas',
      journey: 'care',
      icon: 'calendar-check',
      levels: 3
    },
  ];
  
  for (const achievement of achievementTypes) {
    await prisma.achievementType.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }
}

/**
 * Configures TimescaleDB for time-series data in the test database.
 * 
 * @param prisma - The Prisma client connected to the test database
 * @param schemaName - The schema name of the test database
 * @throws {DatabaseErrorException} If TimescaleDB configuration fails
 */
async function configureTimescaleDB(prisma: PrismaClient, schemaName: string): Promise<void> {
  try {
    // Check if TimescaleDB extension is available
    const extensionResult = await prisma.$queryRaw`SELECT COUNT(*) FROM pg_extension WHERE extname = 'timescaledb'`;
    const extensionExists = parseInt(extensionResult[0].count, 10) > 0;
    
    if (!extensionExists) {
      console.warn('TimescaleDB extension not available, skipping configuration');
      return;
    }
    
    // Configure hypertables for time-series data
    // This assumes that the HealthMetric table exists and has a timestamp column
    await prisma.$executeRawUnsafe(`
      SELECT create_hypertable('"${schemaName}"."HealthMetric"', 'timestamp', if_not_exists => TRUE);
    `);
    
    // Configure retention policy (keep data for 30 days in tests)
    await prisma.$executeRawUnsafe(`
      SELECT add_retention_policy('"${schemaName}"."HealthMetric"', INTERVAL '30 days', if_not_exists => TRUE);
    `);
  } catch (error) {
    // Log warning but don't fail the test setup
    console.warn('Failed to configure TimescaleDB:', error.message);
  }
}

/**
 * Gets a test database instance by schema name.
 * 
 * @param schemaName - The schema name of the test database
 * @returns The test database info, or undefined if not found
 */
export function getTestDatabase(schemaName: string): TestDatabaseInfo | undefined {
  return testDatabases.get(schemaName);
}

/**
 * Gets all active test database instances.
 * 
 * @returns An array of all test database info objects
 */
export function getAllTestDatabases(): TestDatabaseInfo[] {
  return Array.from(testDatabases.values());
}

/**
 * Sets up environment variables for database testing.
 * 
 * @param options - Configuration options for the test environment
 * @returns An object with the original environment variables for restoration
 */
export function setupTestEnvironment(options: {
  databaseUrl?: string;
  nodeEnv?: string;
} = {}): Record<string, string | undefined> {
  // Save original environment variables
  const originalEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_DB: process.env.POSTGRES_DB,
  };
  
  // Set environment variables for testing
  process.env.NODE_ENV = options.nodeEnv || 'test';
  
  if (options.databaseUrl) {
    process.env.DATABASE_URL = options.databaseUrl;
  } else if (!process.env.DATABASE_URL) {
    // Set a default test database URL if none is provided
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/austa_test';
  }
  
  return originalEnv;
}

/**
 * Restores the original environment variables after testing.
 * 
 * @param originalEnv - The original environment variables to restore
 */
export function restoreEnvironment(originalEnv: Record<string, string | undefined>): void {
  // Restore original environment variables
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
}

/**
 * Executes a function with a test database and automatically cleans up afterward.
 * 
 * @param callback - The function to execute with the test database
 * @param options - Configuration options for the test database
 * @returns The result of the callback function
 */
export async function withTestDatabase<T>(
  callback: (db: TestDatabaseInfo) => Promise<T>,
  options: TestDatabaseOptions = {}
): Promise<T> {
  const testDb = await createTestDatabase(options);
  
  try {
    return await callback(testDb);
  } finally {
    await destroyTestDatabase(testDb.schema);
  }
}

/**
 * Registers a cleanup function to be called after all tests are complete.
 * This should be called in a Jest globalTeardown or afterAll hook.
 */
export function registerTestDatabaseCleanup(): void {
  // For Jest
  if (typeof afterAll === 'function') {
    afterAll(async () => {
      await destroyAllTestDatabases();
    });
  }
  
  // For Node process exit
  process.on('exit', () => {
    // Synchronous cleanup on exit
    Array.from(testDatabases.keys()).forEach(schema => {
      try {
        const testDb = testDatabases.get(schema);
        if (testDb) {
          // Disconnect clients synchronously if possible
          if (testDb.prismaClient) {
            try {
              // @ts-ignore - Accessing private method for emergency cleanup
              testDb.prismaClient._engine.stop();
            } catch (e) {
              // Ignore errors during emergency cleanup
            }
          }
        }
      } catch (e) {
        // Ignore errors during emergency cleanup
      }
    });
  });
  
  // Handle SIGINT and SIGTERM
  const signalHandler = async () => {
    try {
      await destroyAllTestDatabases();
    } finally {
      process.exit(0);
    }
  };
  
  process.on('SIGINT', signalHandler);
  process.on('SIGTERM', signalHandler);
}