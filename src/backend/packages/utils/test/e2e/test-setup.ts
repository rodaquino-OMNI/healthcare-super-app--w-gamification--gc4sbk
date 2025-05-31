/**
 * End-to-End Test Setup for @austa/utils package
 * 
 * This file provides comprehensive utilities and configuration for all end-to-end tests
 * in the utils package. It includes:
 * - NestJS application setup helpers
 * - HTTP test utilities for working with supertest
 * - Environment variable management for tests
 * - Assertion helpers for common validation patterns
 * - Database test utilities
 * - Mock service generators for external dependencies
 */

import { INestApplication, ModuleMetadata, Type } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import * as request from 'supertest';
import { SuperAgentTest } from 'supertest';
import { PrismaService } from '@austa/database';
import { KafkaService } from '@austa/events';
import { Logger } from '@austa/logging';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from '@austa/errors';

/**
 * Options for creating a test NestJS application
 */
export interface TestAppOptions {
  /** Additional providers to include in the test module */
  providers?: any[];
  /** Controllers to include in the test module */
  controllers?: Type<any>[];
  /** Imports to include in the test module */
  imports?: any[];
  /** Whether to apply global pipes */
  applyGlobalPipes?: boolean;
  /** Whether to apply global filters */
  applyGlobalFilters?: boolean;
  /** Whether to initialize the Prisma service */
  initPrisma?: boolean;
  /** Whether to enable request logging */
  enableLogging?: boolean;
  /** Custom module metadata overrides */
  moduleMetadataOverrides?: Partial<ModuleMetadata>;
}

/**
 * Default test application options
 */
const defaultTestAppOptions: TestAppOptions = {
  providers: [],
  controllers: [],
  imports: [],
  applyGlobalPipes: true,
  applyGlobalFilters: true,
  initPrisma: true,
  enableLogging: false,
};

/**
 * Creates a test NestJS application with common configuration
 * 
 * @param options Options for creating the test application
 * @returns A promise resolving to the test application and related utilities
 */
export async function createTestApplication(options: TestAppOptions = {}): Promise<{
  app: INestApplication;
  moduleRef: TestingModule;
  agent: SuperAgentTest;
  prisma?: PrismaService;
  kafka?: KafkaService;
  jwt?: JwtService;
  config?: ConfigService;
}> {
  // Merge options with defaults
  const mergedOptions = { ...defaultTestAppOptions, ...options };
  
  // Create the base module metadata
  const moduleMetadata: ModuleMetadata = {
    controllers: mergedOptions.controllers || [],
    providers: [
      ...(mergedOptions.providers || []),
      ...(mergedOptions.initPrisma ? [PrismaService] : []),
      KafkaService,
      JwtService,
      ConfigService,
      Logger,
    ],
    imports: mergedOptions.imports || [],
  };
  
  // Apply any custom overrides to the module metadata
  if (mergedOptions.moduleMetadataOverrides) {
    Object.assign(moduleMetadata, mergedOptions.moduleMetadataOverrides);
  }
  
  // Create the test module
  let testingModuleBuilder = Test.createTestingModule(moduleMetadata);
  
  // Apply any additional configuration to the module builder
  testingModuleBuilder = await configureTestModule(testingModuleBuilder);
  
  // Compile the module
  const moduleRef = await testingModuleBuilder.compile();
  
  // Create the NestJS application
  const app = moduleRef.createNestApplication();
  
  // Apply global pipes if enabled
  if (mergedOptions.applyGlobalPipes) {
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
  }
  
  // Apply global filters if enabled
  if (mergedOptions.applyGlobalFilters) {
    const logger = mergedOptions.enableLogging ? new Logger('ExceptionsFilter') : undefined;
    app.useGlobalFilters(new AllExceptionsFilter(logger));
  }
  
  // Initialize the application
  await app.init();
  
  // Create a supertest agent for making HTTP requests
  const agent = request.agent(app.getHttpServer());
  
  // Get service instances
  const prisma = mergedOptions.initPrisma ? moduleRef.get<PrismaService>(PrismaService) : undefined;
  const kafka = moduleRef.get<KafkaService>(KafkaService);
  const jwt = moduleRef.get<JwtService>(JwtService);
  const config = moduleRef.get<ConfigService>(ConfigService);
  
  return { app, moduleRef, agent, prisma, kafka, jwt, config };
}

/**
 * Configures a TestingModuleBuilder with common test settings
 * 
 * @param builder The TestingModuleBuilder to configure
 * @returns The configured TestingModuleBuilder
 */
async function configureTestModule(builder: TestingModuleBuilder): Promise<TestingModuleBuilder> {
  // Mock the KafkaService to prevent actual message production
  builder.overrideProvider(KafkaService).useValue({
    produce: jest.fn().mockResolvedValue(undefined),
    consume: jest.fn().mockResolvedValue(undefined),
  });
  
  // Mock the Logger to prevent console output during tests
  builder.overrideProvider(Logger).useValue({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  });
  
  return builder;
}

/**
 * Generates a valid JWT token for testing authentication
 * 
 * @param jwtService The JwtService instance
 * @param payload The payload to include in the token
 * @returns A JWT token string
 */
export function generateTestToken(jwtService: JwtService, payload: Record<string, any> = {}): string {
  const defaultPayload = {
    sub: 'test-user-id',
    username: 'test-user',
    roles: ['user'],
    permissions: ['read:all'],
    ...payload,
  };
  
  return jwtService.sign(defaultPayload);
}

/**
 * HTTP test utilities for working with supertest
 */
export const httpTestUtils = {
  /**
   * Sets authorization header with a JWT token
   * 
   * @param agent The supertest agent
   * @param token The JWT token
   * @returns The supertest agent with authorization header set
   */
  withAuth(agent: SuperAgentTest, token: string): SuperAgentTest {
    return agent.set('Authorization', `Bearer ${token}`);
  },
  
  /**
   * Sets a custom header on the request
   * 
   * @param agent The supertest agent
   * @param name The header name
   * @param value The header value
   * @returns The supertest agent with the header set
   */
  withHeader(agent: SuperAgentTest, name: string, value: string): SuperAgentTest {
    return agent.set(name, value);
  },
  
  /**
   * Sets the content type to application/json
   * 
   * @param agent The supertest agent
   * @returns The supertest agent with content type header set
   */
  asJson(agent: SuperAgentTest): SuperAgentTest {
    return agent.set('Content-Type', 'application/json').set('Accept', 'application/json');
  },
};

/**
 * Database test utilities for working with Prisma in tests
 */
export const dbTestUtils = {
  /**
   * Cleans up test data from the database
   * 
   * @param prisma The PrismaService instance
   * @returns A promise that resolves when cleanup is complete
   */
  async cleanupTestData(prisma: PrismaService): Promise<void> {
    // The specific cleanup operations will depend on your schema
    // This is a generic example that should be customized based on your needs
    try {
      // Disable foreign key checks for cleanup
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;
      
      // Clean up test data from all tables
      // Add specific cleanup for your tables here
      
      // Re-enable foreign key checks
      await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      throw error;
    }
  },
  
  /**
   * Creates a transaction for test operations
   * 
   * @param prisma The PrismaService instance
   * @param callback A callback function that receives the transaction
   * @returns The result of the callback function
   */
  async withTransaction<T>(prisma: PrismaService, callback: (tx: any) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => {
      return callback(tx);
    });
  },
};

/**
 * Environment variable management for tests
 */
export const envTestUtils = {
  /**
   * Sets environment variables for the duration of a test
   * 
   * @param vars The environment variables to set
   * @returns A function to restore the original environment variables
   */
  setTestEnv(vars: Record<string, string>): () => void {
    const originalEnv = { ...process.env };
    
    // Set the test environment variables
    Object.entries(vars).forEach(([key, value]) => {
      process.env[key] = value;
    });
    
    // Return a function to restore the original environment
    return () => {
      // Restore original environment variables
      Object.keys(vars).forEach((key) => {
        if (key in originalEnv) {
          process.env[key] = originalEnv[key];
        } else {
          delete process.env[key];
        }
      });
    };
  },
  
  /**
   * Sets journey-specific environment variables
   * 
   * @param journey The journey name ('health', 'care', or 'plan')
   * @returns A function to restore the original environment variables
   */
  setJourneyEnv(journey: 'health' | 'care' | 'plan'): () => void {
    const journeyVars: Record<string, Record<string, string>> = {
      health: {
        HEALTH_JOURNEY_API_URL: 'https://health-api.test.austa.local',
        HEALTH_JOURNEY_ENABLED: 'true',
        FEATURE_HEALTH_METRICS: 'true',
        FEATURE_HEALTH_GOALS: 'true',
        FEATURE_DEVICE_INTEGRATION: 'true',
      },
      care: {
        CARE_JOURNEY_API_URL: 'https://care-api.test.austa.local',
        CARE_JOURNEY_ENABLED: 'true',
        FEATURE_APPOINTMENTS: 'true',
        FEATURE_TELEMEDICINE: 'true',
        FEATURE_MEDICATIONS: 'true',
      },
      plan: {
        PLAN_JOURNEY_API_URL: 'https://plan-api.test.austa.local',
        PLAN_JOURNEY_ENABLED: 'true',
        FEATURE_CLAIMS: 'true',
        FEATURE_BENEFITS: 'true',
        FEATURE_COVERAGE: 'true',
      },
    };
    
    return envTestUtils.setTestEnv(journeyVars[journey]);
  },
};

/**
 * Assertion helpers for common validation patterns
 */
export const assertionHelpers = {
  /**
   * Asserts that an object has the expected properties
   * 
   * @param obj The object to check
   * @param properties The expected properties
   */
  hasProperties(obj: any, properties: string[]): void {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  },
  
  /**
   * Asserts that an array contains objects with the expected properties
   * 
   * @param arr The array to check
   * @param properties The expected properties
   */
  arrayHasObjectsWithProperties(arr: any[], properties: string[]): void {
    expect(Array.isArray(arr)).toBe(true);
    arr.forEach(item => {
      assertionHelpers.hasProperties(item, properties);
    });
  },
  
  /**
   * Asserts that a response has the expected error structure
   * 
   * @param response The response object
   * @param statusCode The expected status code
   * @param errorCode The expected error code
   */
  hasErrorStructure(response: any, statusCode: number, errorCode?: string): void {
    expect(response.status).toBe(statusCode);
    expect(response.body).toHaveProperty('error');
    expect(response.body).toHaveProperty('message');
    
    if (errorCode) {
      expect(response.body).toHaveProperty('code', errorCode);
    }
  },
};

/**
 * Mock service generators for external dependencies
 */
export const mockServiceGenerators = {
  /**
   * Creates a mock PrismaService with common methods
   * 
   * @returns A mock PrismaService
   */
  createMockPrismaService(): Partial<PrismaService> {
    return {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn().mockImplementation((callback) => callback({})),
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
  },
  
  /**
   * Creates a mock KafkaService with common methods
   * 
   * @returns A mock KafkaService
   */
  createMockKafkaService(): Partial<KafkaService> {
    return {
      produce: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue(undefined),
    };
  },
  
  /**
   * Creates a mock JwtService with common methods
   * 
   * @returns A mock JwtService
   */
  createMockJwtService(): Partial<JwtService> {
    return {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
      decode: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
    };
  },
  
  /**
   * Creates a mock ConfigService with common methods
   * 
   * @returns A mock ConfigService
   */
  createMockConfigService(): Partial<ConfigService> {
    const configValues: Record<string, any> = {
      // Default configuration values for testing
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      JWT_SECRET: 'test-jwt-secret',
      JWT_EXPIRATION: '1h',
    };
    
    return {
      get: jest.fn().mockImplementation((key: string) => configValues[key]),
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key in configValues) {
          return configValues[key];
        }
        throw new Error(`Configuration key "${key}" does not exist`);
      }),
    };
  },
};

/**
 * Journey-specific test factories for creating test entities
 */
export const testFactories = {
  /**
   * Health journey test factories
   */
  health: {
    /**
     * Creates a test health metric
     * 
     * @param overrides Properties to override in the default health metric
     * @returns A test health metric object
     */
    createHealthMetric(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-metric-id',
        userId: 'test-user-id',
        type: 'HEART_RATE',
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
        source: 'MANUAL',
        notes: 'Test health metric',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
    
    /**
     * Creates a test health goal
     * 
     * @param overrides Properties to override in the default health goal
     * @returns A test health goal object
     */
    createHealthGoal(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-goal-id',
        userId: 'test-user-id',
        type: 'STEPS',
        target: 10000,
        unit: 'steps',
        frequency: 'DAILY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        progress: 0,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
  
  /**
   * Care journey test factories
   */
  care: {
    /**
     * Creates a test appointment
     * 
     * @param overrides Properties to override in the default appointment
     * @returns A test appointment object
     */
    createAppointment(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-appointment-id',
        userId: 'test-user-id',
        providerId: 'test-provider-id',
        type: 'CONSULTATION',
        status: 'SCHEDULED',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 1 day + 30 minutes from now
        notes: 'Test appointment',
        location: 'VIRTUAL',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
    
    /**
     * Creates a test medication
     * 
     * @param overrides Properties to override in the default medication
     * @returns A test medication object
     */
    createMedication(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-medication-id',
        userId: 'test-user-id',
        name: 'Test Medication',
        dosage: '10mg',
        frequency: 'DAILY',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        instructions: 'Take with food',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
  
  /**
   * Plan journey test factories
   */
  plan: {
    /**
     * Creates a test insurance plan
     * 
     * @param overrides Properties to override in the default insurance plan
     * @returns A test insurance plan object
     */
    createInsurancePlan(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-plan-id',
        userId: 'test-user-id',
        name: 'Test Insurance Plan',
        type: 'HEALTH',
        provider: 'Test Insurance Provider',
        policyNumber: 'TEST-POLICY-123',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
    
    /**
     * Creates a test insurance claim
     * 
     * @param overrides Properties to override in the default insurance claim
     * @returns A test insurance claim object
     */
    createInsuranceClaim(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-claim-id',
        userId: 'test-user-id',
        planId: 'test-plan-id',
        type: 'MEDICAL',
        status: 'SUBMITTED',
        amount: 100.0,
        serviceDate: new Date(),
        submissionDate: new Date(),
        description: 'Test insurance claim',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
  
  /**
   * Gamification test factories
   */
  gamification: {
    /**
     * Creates a test achievement
     * 
     * @param overrides Properties to override in the default achievement
     * @returns A test achievement object
     */
    createAchievement(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-achievement-id',
        name: 'Test Achievement',
        description: 'This is a test achievement',
        type: 'MILESTONE',
        journey: 'HEALTH',
        points: 100,
        icon: 'test-icon',
        criteria: JSON.stringify({ type: 'STEPS_RECORDED', threshold: 10000 }),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
    
    /**
     * Creates a test user profile for gamification
     * 
     * @param overrides Properties to override in the default profile
     * @returns A test profile object
     */
    createProfile(overrides: Record<string, any> = {}): Record<string, any> {
      return {
        id: 'test-profile-id',
        userId: 'test-user-id',
        level: 1,
        xp: 0,
        achievements: [],
        quests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    },
  },
};

/**
 * Cleanup utilities for test resources
 */
export const cleanupUtils = {
  /**
   * Closes a NestJS application and related resources
   * 
   * @param app The NestJS application to close
   * @param prisma Optional PrismaService to disconnect
   * @returns A promise that resolves when cleanup is complete
   */
  async closeApp(app: INestApplication, prisma?: PrismaService): Promise<void> {
    if (prisma) {
      await prisma.$disconnect();
    }
    
    if (app) {
      await app.close();
    }
  },
};

// Export all utilities for use in tests
export default {
  createTestApplication,
  generateTestToken,
  httpTestUtils,
  dbTestUtils,
  envTestUtils,
  assertionHelpers,
  mockServiceGenerators,
  testFactories,
  cleanupUtils,
};