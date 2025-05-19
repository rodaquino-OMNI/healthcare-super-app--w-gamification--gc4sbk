/**
 * @file test-setup.ts
 * @description Common test setup and configuration for all end-to-end tests in the utils package.
 * Provides shared helper functions, testing utilities, and configuration for consistent test
 * structure across all e2e tests.
 *
 * This file includes:
 * - NestJS application setup helpers
 * - HTTP test utilities for working with supertest
 * - Environment variable management for tests
 * - Assertion helpers for common validation patterns
 * - Mock service utilities for external dependencies
 */

import { INestApplication, LoggerService, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import * as request from 'supertest';
import { SuperAgentTest } from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '@austa/database';
import { AllExceptionsFilter } from '@austa/errors';

/**
 * Minimal logger implementation for tests that prevents console output
 * during test execution while still providing logging functionality to the application.
 */
export class TestLogger implements LoggerService {
  log(message: string): void {}
  error(message: string, trace?: string): void {}
  warn(message: string): void {}
  debug(message: string): void {}
  verbose(message: string): void {}
}

/**
 * Configuration options for creating a test application
 */
export interface TestAppOptions {
  /**
   * Whether to apply global validation pipes
   * @default true
   */
  useGlobalValidationPipe?: boolean;
  
  /**
   * Whether to apply global exception filters
   * @default true
   */
  useGlobalExceptionFilter?: boolean;
  
  /**
   * Whether to use a silent logger
   * @default true
   */
  useSilentLogger?: boolean;
  
  /**
   * Environment variables to set for the test
   * @default {}
   */
  env?: Record<string, string>;
  
  /**
   * Whether to initialize the Prisma service
   * @default false
   */
  initPrisma?: boolean;
}

/**
 * Default test application options
 */
const defaultTestAppOptions: TestAppOptions = {
  useGlobalValidationPipe: true,
  useGlobalExceptionFilter: true,
  useSilentLogger: true,
  env: {},
  initPrisma: false,
};

/**
 * Creates a TestingModuleBuilder with common configuration
 * @param metadata Module metadata (controllers, providers, imports)
 * @returns Configured TestingModuleBuilder
 */
export function createTestingModuleBuilder(metadata: any): TestingModuleBuilder {
  return Test.createTestingModule(metadata)
    .setLogger(new TestLogger());
}

/**
 * Sets environment variables for testing and returns a cleanup function
 * @param env Environment variables to set
 * @returns Function to restore original environment variables
 */
export function setTestEnvironment(env: Record<string, string> = {}): () => void {
  const originalEnv = { ...process.env };
  
  // Set environment variables for the test
  Object.entries(env).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Return cleanup function
  return () => {
    // Restore original environment
    process.env = originalEnv;
  };
}

/**
 * Creates and configures a NestJS application for testing
 * @param moduleFixture TestingModule to create app from
 * @param options Configuration options
 * @returns Configured NestJS application
 */
export async function createTestApp(
  moduleFixture: TestingModule,
  options: TestAppOptions = {}
): Promise<INestApplication> {
  // Merge with default options
  const opts = { ...defaultTestAppOptions, ...options };
  
  // Set environment variables
  const cleanupEnv = setTestEnvironment(opts.env);
  
  // Create the application
  const app = moduleFixture.createNestApplication();
  
  // Configure global pipes
  if (opts.useGlobalValidationPipe) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
  }
  
  // Configure global exception filters
  if (opts.useGlobalExceptionFilter) {
    const logger = new TestLogger();
    app.useGlobalFilters(new AllExceptionsFilter(logger));
  }
  
  // Initialize the app
  await app.init();
  
  // Initialize Prisma if needed
  if (opts.initPrisma) {
    const prismaService = app.get(PrismaService);
    await prismaService.$connect();
    
    // Add cleanup to app.close
    const originalClose = app.close.bind(app);
    app.close = async () => {
      await prismaService.$disconnect();
      cleanupEnv();
      return originalClose();
    };
  } else {
    // Add cleanup to app.close
    const originalClose = app.close.bind(app);
    app.close = async () => {
      cleanupEnv();
      return originalClose();
    };
  }
  
  return app;
}

/**
 * Creates a supertest agent for testing HTTP endpoints
 * @param app NestJS application
 * @returns Supertest agent
 */
export function createTestAgent(app: INestApplication): SuperAgentTest {
  return request.agent(app.getHttpServer());
}

/**
 * Test context interface for managing test resources
 */
export interface TestContext {
  app: INestApplication;
  moduleFixture: TestingModule;
  agent: SuperAgentTest;
  [key: string]: any; // Allow additional context properties
}

/**
 * Creates a complete test context with app, module fixture, and supertest agent
 * @param metadata Module metadata
 * @param options Test app options
 * @returns Test context object
 */
export async function createTestContext(
  metadata: any,
  options: TestAppOptions = {}
): Promise<TestContext> {
  const moduleBuilder = createTestingModuleBuilder(metadata);
  const moduleFixture = await moduleBuilder.compile();
  const app = await createTestApp(moduleFixture, options);
  const agent = createTestAgent(app);
  
  return {
    app,
    moduleFixture,
    agent,
  };
}

/**
 * Cleans up a test context by closing the app
 * @param context Test context to clean up
 */
export async function cleanupTestContext(context: TestContext): Promise<void> {
  if (context.app) {
    await context.app.close();
  }
}

/**
 * Creates a mock service with specified methods
 * @param methods Methods to mock
 * @returns Mock service object
 */
export function createMockService<T = any>(methods: Record<string, jest.Mock> = {}): T {
  return methods as unknown as T;
}

/**
 * Creates a mock repository with common repository methods
 * @param methods Methods to mock
 * @returns Mock repository object
 */
export function createMockRepository<T = any>(methods: Record<string, jest.Mock> = {}): T {
  const defaultMethods = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    update: jest.fn().mockResolvedValue({ affected: 0 }),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    create: jest.fn().mockImplementation((dto) => dto),
  };
  
  return { ...defaultMethods, ...methods } as unknown as T;
}

/**
 * Creates a mock Prisma client with specified methods
 * @param methods Methods to mock
 * @returns Mock Prisma client
 */
export function createMockPrismaClient(methods: Record<string, any> = {}): any {
  const defaultClient = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn().mockImplementation((fn) => fn()),
  };
  
  // Create mock models with common methods
  const createMockModel = () => ({
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    update: jest.fn().mockImplementation(({ data }) => Promise.resolve(data)),
    upsert: jest.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    delete: jest.fn().mockResolvedValue({}),
    count: jest.fn().mockResolvedValue(0),
  });
  
  // Common Prisma models used across journeys
  const defaultModels = {
    user: createMockModel(),
    profile: createMockModel(),
    healthMetric: createMockModel(),
    healthGoal: createMockModel(),
    appointment: createMockModel(),
    provider: createMockModel(),
    plan: createMockModel(),
    benefit: createMockModel(),
    achievement: createMockModel(),
    quest: createMockModel(),
    reward: createMockModel(),
    event: createMockModel(),
  };
  
  return { ...defaultClient, ...defaultModels, ...methods };
}

/**
 * Creates a mock Kafka producer with specified methods
 * @param methods Methods to mock
 * @returns Mock Kafka producer
 */
export function createMockKafkaProducer(methods: Record<string, jest.Mock> = {}): any {
  const defaultMethods = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    send: jest.fn().mockResolvedValue({
      topicName: 'test-topic',
      partition: 0,
      errorCode: 0,
    }),
  };
  
  return { ...defaultMethods, ...methods };
}

/**
 * Creates a mock Kafka consumer with specified methods
 * @param methods Methods to mock
 * @returns Mock Kafka consumer
 */
export function createMockKafkaConsumer(methods: Record<string, jest.Mock> = {}): any {
  const defaultMethods = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    run: jest.fn().mockImplementation((options) => {
      // Store the message handler for later use in tests
      createMockKafkaConsumer.messageHandler = options.eachMessage;
      return Promise.resolve();
    }),
    stop: jest.fn().mockResolvedValue(undefined),
    // Helper to simulate message receipt in tests
    simulateMessage: jest.fn().mockImplementation((topic, partition, message) => {
      if (createMockKafkaConsumer.messageHandler) {
        return createMockKafkaConsumer.messageHandler({
          topic,
          partition,
          message: {
            key: Buffer.from(message.key || ''),
            value: Buffer.from(JSON.stringify(message.value)),
            headers: message.headers || {},
            timestamp: message.timestamp || Date.now().toString(),
          },
        });
      }
      return Promise.resolve();
    }),
  };
  
  return { ...defaultMethods, ...methods };
}

// Static property to store message handler for testing
createMockKafkaConsumer.messageHandler = null;

/**
 * Creates a mock Redis client with specified methods
 * @param methods Methods to mock
 * @returns Mock Redis client
 */
export function createMockRedisClient(methods: Record<string, jest.Mock> = {}): any {
  const defaultMethods = {
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(0),
    expire: jest.fn().mockResolvedValue(1),
    ttl: jest.fn().mockResolvedValue(-1),
  };
  
  return { ...defaultMethods, ...methods };
}

/**
 * Creates test data for journey-specific entities
 * @param journey Journey type ('health', 'care', 'plan', 'gamification')
 * @param entityType Entity type within the journey
 * @param overrides Property overrides for the entity
 * @returns Generated test entity
 */
export function createTestEntity(
  journey: 'health' | 'care' | 'plan' | 'gamification',
  entityType: string,
  overrides: Record<string, any> = {}
): any {
  const now = new Date();
  const userId = overrides.userId || 'test-user-id';
  
  // Base entity with common properties
  const baseEntity = {
    id: `test-${entityType}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    userId,
  };
  
  // Journey-specific entity factories
  const entityFactories: Record<string, Record<string, () => any>> = {
    health: {
      metric: () => ({
        ...baseEntity,
        type: 'HEART_RATE',
        value: 72,
        unit: 'bpm',
        timestamp: now,
        source: 'MANUAL',
        notes: 'Test heart rate',
      }),
      goal: () => ({
        ...baseEntity,
        type: 'STEPS',
        target: 10000,
        current: 5000,
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
      }),
      device: () => ({
        ...baseEntity,
        type: 'SMARTWATCH',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        connectionStatus: 'CONNECTED',
        lastSyncDate: now,
      }),
    },
    care: {
      appointment: () => ({
        ...baseEntity,
        providerId: 'test-provider-id',
        specialtyId: 'test-specialty-id',
        date: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        status: 'SCHEDULED',
        type: 'IN_PERSON',
        notes: 'Test appointment',
      }),
      provider: () => ({
        ...baseEntity,
        name: 'Dr. Test Provider',
        specialties: ['Cardiology'],
        rating: 4.5,
        availableDates: [
          new Date(now.getTime() + 24 * 60 * 60 * 1000),
          new Date(now.getTime() + 48 * 60 * 60 * 1000),
        ],
      }),
      medication: () => ({
        ...baseEntity,
        name: 'Test Medication',
        dosage: '10mg',
        frequency: 'DAILY',
        startDate: now,
        endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      }),
    },
    plan: {
      plan: () => ({
        ...baseEntity,
        name: 'Test Health Plan',
        provider: 'Test Insurance',
        type: 'HEALTH',
        coverageStart: now,
        coverageEnd: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      }),
      benefit: () => ({
        ...baseEntity,
        planId: 'test-plan-id',
        name: 'Test Benefit',
        description: 'Test benefit description',
        type: 'MEDICAL',
        coverage: 80,
        limit: 1000,
        remainingLimit: 1000,
      }),
      claim: () => ({
        ...baseEntity,
        planId: 'test-plan-id',
        benefitId: 'test-benefit-id',
        amount: 100,
        date: now,
        status: 'SUBMITTED',
        description: 'Test claim',
      }),
    },
    gamification: {
      profile: () => ({
        ...baseEntity,
        level: 1,
        xp: 0,
        achievements: [],
        quests: [],
      }),
      achievement: () => ({
        ...baseEntity,
        name: 'Test Achievement',
        description: 'Test achievement description',
        type: 'HEALTH',
        xpReward: 100,
        icon: 'test-icon',
        unlockedAt: null,
      }),
      quest: () => ({
        ...baseEntity,
        name: 'Test Quest',
        description: 'Test quest description',
        type: 'HEALTH',
        xpReward: 200,
        startDate: now,
        endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        progress: 0,
        status: 'IN_PROGRESS',
      }),
      event: () => ({
        ...baseEntity,
        type: 'STEPS_RECORDED',
        journey: 'health',
        data: { steps: 1000 },
        processedAt: null,
      }),
    },
  };
  
  // Get the factory for the specified journey and entity type
  const factory = entityFactories[journey]?.[entityType];
  if (!factory) {
    throw new Error(`No factory found for journey '${journey}' and entity type '${entityType}'`);
  }
  
  // Create the entity and apply overrides
  return {
    ...factory(),
    ...overrides,
  };
}

/**
 * Creates a test database with journey-specific test data
 * @param prismaService PrismaService instance
 * @param options Configuration options for test data
 * @returns Promise that resolves when test data is created
 */
export async function createTestDatabase(
  prismaService: PrismaService,
  options: {
    users?: number;
    health?: boolean;
    care?: boolean;
    plan?: boolean;
    gamification?: boolean;
  } = {}
): Promise<void> {
  const {
    users = 1,
    health = false,
    care = false,
    plan = false,
    gamification = false,
  } = options;
  
  // Create test users
  const testUsers = [];
  for (let i = 0; i < users; i++) {
    const user = await prismaService.user.create({
      data: {
        email: `test-user-${i}@example.com`,
        name: `Test User ${i}`,
        password: 'hashed-password',
      },
    });
    testUsers.push(user);
  }
  
  // Create health journey data if requested
  if (health) {
    for (const user of testUsers) {
      // Create health metrics
      await prismaService.healthMetric.createMany({
        data: [
          createTestEntity('health', 'metric', { userId: user.id, type: 'HEART_RATE' }),
          createTestEntity('health', 'metric', { userId: user.id, type: 'STEPS' }),
          createTestEntity('health', 'metric', { userId: user.id, type: 'WEIGHT' }),
        ],
      });
      
      // Create health goals
      await prismaService.healthGoal.createMany({
        data: [
          createTestEntity('health', 'goal', { userId: user.id, type: 'STEPS' }),
          createTestEntity('health', 'goal', { userId: user.id, type: 'WEIGHT' }),
        ],
      });
      
      // Create device connections
      await prismaService.device.create({
        data: createTestEntity('health', 'device', { userId: user.id }),
      });
    }
  }
  
  // Create care journey data if requested
  if (care) {
    // Create providers
    const providers = [];
    for (let i = 0; i < 3; i++) {
      const provider = await prismaService.provider.create({
        data: createTestEntity('care', 'provider', { name: `Dr. Test Provider ${i}` }),
      });
      providers.push(provider);
    }
    
    for (const user of testUsers) {
      // Create appointments
      for (const provider of providers) {
        await prismaService.appointment.create({
          data: createTestEntity('care', 'appointment', {
            userId: user.id,
            providerId: provider.id,
          }),
        });
      }
      
      // Create medications
      await prismaService.medication.createMany({
        data: [
          createTestEntity('care', 'medication', { userId: user.id, name: 'Test Medication 1' }),
          createTestEntity('care', 'medication', { userId: user.id, name: 'Test Medication 2' }),
        ],
      });
    }
  }
  
  // Create plan journey data if requested
  if (plan) {
    for (const user of testUsers) {
      // Create plans
      const plan = await prismaService.plan.create({
        data: createTestEntity('plan', 'plan', { userId: user.id }),
      });
      
      // Create benefits
      const benefits = [];
      for (let i = 0; i < 3; i++) {
        const benefit = await prismaService.benefit.create({
          data: createTestEntity('plan', 'benefit', {
            userId: user.id,
            planId: plan.id,
            name: `Test Benefit ${i}`,
          }),
        });
        benefits.push(benefit);
      }
      
      // Create claims
      for (const benefit of benefits) {
        await prismaService.claim.create({
          data: createTestEntity('plan', 'claim', {
            userId: user.id,
            planId: plan.id,
            benefitId: benefit.id,
          }),
        });
      }
    }
  }
  
  // Create gamification journey data if requested
  if (gamification) {
    for (const user of testUsers) {
      // Create gamification profile
      const profile = await prismaService.profile.create({
        data: createTestEntity('gamification', 'profile', { userId: user.id }),
      });
      
      // Create achievements
      await prismaService.achievement.createMany({
        data: [
          createTestEntity('gamification', 'achievement', { userId: user.id }),
          createTestEntity('gamification', 'achievement', {
            userId: user.id,
            name: 'Another Achievement',
          }),
        ],
      });
      
      // Create quests
      await prismaService.quest.createMany({
        data: [
          createTestEntity('gamification', 'quest', { userId: user.id }),
          createTestEntity('gamification', 'quest', {
            userId: user.id,
            name: 'Another Quest',
          }),
        ],
      });
      
      // Create events
      await prismaService.event.createMany({
        data: [
          createTestEntity('gamification', 'event', { userId: user.id }),
          createTestEntity('gamification', 'event', {
            userId: user.id,
            type: 'APPOINTMENT_SCHEDULED',
            journey: 'care',
          }),
        ],
      });
    }
  }
}

/**
 * Cleans up test database by removing all test data
 * @param prismaService PrismaService instance
 * @returns Promise that resolves when cleanup is complete
 */
export async function cleanupTestDatabase(prismaService: PrismaService): Promise<void> {
  // Delete all test data in reverse order of dependencies
  await prismaService.$transaction([
    // Gamification journey
    prismaService.event.deleteMany(),
    prismaService.quest.deleteMany(),
    prismaService.achievement.deleteMany(),
    prismaService.profile.deleteMany(),
    
    // Plan journey
    prismaService.claim.deleteMany(),
    prismaService.benefit.deleteMany(),
    prismaService.plan.deleteMany(),
    
    // Care journey
    prismaService.medication.deleteMany(),
    prismaService.appointment.deleteMany(),
    prismaService.provider.deleteMany(),
    
    // Health journey
    prismaService.device.deleteMany(),
    prismaService.healthGoal.deleteMany(),
    prismaService.healthMetric.deleteMany(),
    
    // Users
    prismaService.user.deleteMany(),
  ]);
}

/**
 * Creates an authentication token for testing protected endpoints
 * @param userId User ID to include in the token
 * @param role User role (default: 'user')
 * @returns Authentication token string
 */
export function createTestAuthToken(userId: string, role: string = 'user'): string {
  // This is a simplified token for testing purposes only
  // In a real application, you would use JWT or another token mechanism
  const payload = {
    sub: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
  };
  
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Adds authentication headers to a supertest request
 * @param request Supertest request
 * @param token Authentication token
 * @returns Supertest request with authentication headers
 */
export function authenticateRequest(request: request.Test, token: string): request.Test {
  return request.set('Authorization', `Bearer ${token}`);
}

/**
 * Creates a complete authenticated test context
 * @param metadata Module metadata
 * @param userId User ID for authentication
 * @param role User role for authentication
 * @param options Test app options
 * @returns Authenticated test context
 */
export async function createAuthenticatedTestContext(
  metadata: any,
  userId: string = 'test-user-id',
  role: string = 'user',
  options: TestAppOptions = {}
): Promise<TestContext> {
  const context = await createTestContext(metadata, options);
  const token = createTestAuthToken(userId, role);
  
  // Create an authenticated agent
  const authAgent = context.agent;
  const originalRequest = authAgent.request.bind(authAgent);
  
  // Override the request method to automatically add authentication
  authAgent.request = function(method: string, url: string): request.Test {
    const req = originalRequest(method, url);
    return authenticateRequest(req, token);
  };
  
  return {
    ...context,
    authToken: token,
    userId,
    role,
  };
}

/**
 * Exports all test utilities for use in e2e tests
 */
export default {
  TestLogger,
  createTestingModuleBuilder,
  setTestEnvironment,
  createTestApp,
  createTestAgent,
  createTestContext,
  cleanupTestContext,
  createMockService,
  createMockRepository,
  createMockPrismaClient,
  createMockKafkaProducer,
  createMockKafkaConsumer,
  createMockRedisClient,
  createTestEntity,
  createTestDatabase,
  cleanupTestDatabase,
  createTestAuthToken,
  authenticateRequest,
  createAuthenticatedTestContext,
};