import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { Kafka, Producer, Consumer, KafkaMessage } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout as sleep } from 'timers/promises';

// Import interfaces from the events package
import { IEvent } from '../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { IEventHandler } from '../../src/interfaces/event-handler.interface';
import { IEventResponse } from '../../src/interfaces/event-response.interface';
import { EventVersion } from '../../src/interfaces/event-versioning.interface';

// Import Kafka utilities
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';

/**
 * Configuration options for test environment
 */
export interface TestEnvironmentOptions {
  /** Modules to import for the test */
  imports?: any[];
  /** Providers to register for the test */
  providers?: any[];
  /** Controllers to register for the test */
  controllers?: any[];
  /** Kafka topics to create for the test */
  topics?: string[];
  /** Database schema to use for the test */
  databaseSchema?: string;
  /** Whether to enable Kafka for the test */
  enableKafka?: boolean;
  /** Whether to enable database for the test */
  enableDatabase?: boolean;
  /** Custom initialization function */
  onInit?: (app: INestApplication) => Promise<void>;
  /** Custom cleanup function */
  onCleanup?: (app: INestApplication) => Promise<void>;
}

/**
 * Test environment context containing all resources for the test
 */
export interface TestEnvironmentContext {
  /** NestJS application instance */
  app: INestApplication;
  /** Kafka producer for sending test events */
  producer?: Producer;
  /** Kafka consumer for receiving test events */
  consumer?: Consumer;
  /** Prisma client for database operations */
  prisma?: PrismaClient;
  /** Kafka service instance */
  kafkaService?: KafkaService;
  /** Test module reference */
  moduleRef?: TestingModule;
  /** Cleanup function to call when test is complete */
  cleanup: () => Promise<void>;
}

/**
 * Default test environment options
 */
const defaultTestOptions: TestEnvironmentOptions = {
  imports: [],
  providers: [],
  controllers: [],
  topics: [],
  databaseSchema: 'test',
  enableKafka: true,
  enableDatabase: true,
};

/**
 * Creates an isolated test environment for event testing
 * 
 * @param options - Configuration options for the test environment
 * @returns Test environment context with all resources
 */
export async function createTestEnvironment(
  options: TestEnvironmentOptions = {}
): Promise<TestEnvironmentContext> {
  // Merge options with defaults
  const testOptions = { ...defaultTestOptions, ...options };
  
  // Resources to clean up
  const cleanupFunctions: Array<() => Promise<void>> = [];
  
  // Create a unique test ID for isolation
  const testId = uuidv4();
  console.log(`Creating test environment with ID: ${testId}`);
  
  // Set up test module
  const moduleRef = await Test.createTestingModule({
    imports: testOptions.imports || [],
    controllers: testOptions.controllers || [],
    providers: testOptions.providers || [],
  }).compile();
  
  // Create NestJS application
  const app = moduleRef.createNestApplication();
  await app.init();
  
  // Add app cleanup
  cleanupFunctions.push(async () => {
    await app.close();
    console.log(`Closed NestJS application for test ${testId}`);
  });
  
  // Create test context
  const context: TestEnvironmentContext = {
    app,
    moduleRef,
    cleanup: async () => {
      console.log(`Cleaning up test environment ${testId}`);
      for (const cleanupFn of cleanupFunctions.reverse()) {
        await cleanupFn();
      }
    },
  };
  
  // Set up Kafka if enabled
  if (testOptions.enableKafka) {
    await setupKafkaForTest(context, testOptions, testId, cleanupFunctions);
  }
  
  // Set up database if enabled
  if (testOptions.enableDatabase) {
    await setupDatabaseForTest(context, testOptions, testId, cleanupFunctions);
  }
  
  // Run custom initialization if provided
  if (testOptions.onInit) {
    await testOptions.onInit(app);
  }
  
  return context;
}

/**
 * Sets up Kafka for testing
 */
async function setupKafkaForTest(
  context: TestEnvironmentContext,
  options: TestEnvironmentOptions,
  testId: string,
  cleanupFunctions: Array<() => Promise<void>>
): Promise<void> {
  console.log(`Setting up Kafka for test ${testId}`);
  
  // Create Kafka client with test-specific group ID
  const kafka = new Kafka({
    clientId: `test-client-${testId}`,
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    retry: {
      initialRetryTime: 100,
      retries: 3,
    },
  });
  
  // Create producer
  const producer = kafka.producer();
  await producer.connect();
  context.producer = producer;
  
  // Add producer cleanup
  cleanupFunctions.push(async () => {
    await producer.disconnect();
    console.log(`Disconnected Kafka producer for test ${testId}`);
  });
  
  // Create consumer with test-specific group ID
  const consumer = kafka.consumer({ groupId: `test-group-${testId}` });
  await consumer.connect();
  context.consumer = consumer;
  
  // Add consumer cleanup
  cleanupFunctions.push(async () => {
    await consumer.disconnect();
    console.log(`Disconnected Kafka consumer for test ${testId}`);
  });
  
  // Create topics if specified
  if (options.topics && options.topics.length > 0) {
    const admin = kafka.admin();
    await admin.connect();
    
    try {
      await admin.createTopics({
        topics: options.topics.map(topic => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        })),
      });
      console.log(`Created Kafka topics for test ${testId}: ${options.topics.join(', ')}`);
    } catch (error) {
      // Topics might already exist, which is fine
      console.warn(`Error creating topics: ${error.message}`);
    }
    
    await admin.disconnect();
  }
  
  // Try to get KafkaService from the application
  try {
    context.kafkaService = app.get(KafkaService);
  } catch (error) {
    console.warn(`KafkaService not available in test module: ${error.message}`);
  }
}

/**
 * Sets up database for testing
 */
async function setupDatabaseForTest(
  context: TestEnvironmentContext,
  options: TestEnvironmentOptions,
  testId: string,
  cleanupFunctions: Array<() => Promise<void>>
): Promise<void> {
  console.log(`Setting up database for test ${testId}`);
  
  // Create a test-specific schema name if not provided
  const schemaName = options.databaseSchema || `test_${testId.replace(/-/g, '_')}`;
  
  // Create Prisma client with test schema
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?schema=${schemaName}`,
      },
    },
  });
  
  // Connect to database
  await prisma.$connect();
  context.prisma = prisma;
  
  // Create schema
  try {
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    console.log(`Created database schema ${schemaName} for test ${testId}`);
  } catch (error) {
    console.error(`Error creating schema: ${error.message}`);
    throw error;
  }
  
  // Add database cleanup
  cleanupFunctions.push(async () => {
    // Drop schema
    try {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      console.log(`Dropped database schema ${schemaName} for test ${testId}`);
    } catch (error) {
      console.error(`Error dropping schema: ${error.message}`);
    }
    
    // Disconnect from database
    await prisma.$disconnect();
    console.log(`Disconnected from database for test ${testId}`);
  });
}

/**
 * Options for publishing a test event
 */
export interface PublishEventOptions {
  /** Topic to publish to */
  topic: string;
  /** Event key (optional) */
  key?: string;
  /** Headers to include with the event */
  headers?: Record<string, string>;
  /** Partition to publish to (optional) */
  partition?: number;
  /** Whether to wait for acknowledgement */
  waitForAck?: boolean;
}

/**
 * Publishes a test event to Kafka
 * 
 * @param context - Test environment context
 * @param event - Event to publish
 * @param options - Publishing options
 * @returns Promise that resolves when the event is published
 */
export async function publishTestEvent<T extends IEvent>(
  context: TestEnvironmentContext,
  event: T,
  options: PublishEventOptions
): Promise<void> {
  if (!context.producer) {
    throw new Error('Kafka producer not available in test context');
  }
  
  const { topic, key, headers, partition, waitForAck = true } = options;
  
  // Prepare message
  const message = {
    key: key || event.eventId,
    value: JSON.stringify(event),
    headers: headers || {},
  };
  
  // Add partition if specified
  const topicMessages = partition !== undefined
    ? [{ ...message, partition }]
    : [message];
  
  // Publish message
  const result = await context.producer.send({
    topic,
    messages: topicMessages,
  });
  
  console.log(`Published test event ${event.eventId} to ${topic}`);
  
  // Wait for acknowledgement if requested
  if (waitForAck) {
    await sleep(100); // Small delay to ensure event is processed
  }
  
  return result;
}

/**
 * Options for consuming test events
 */
export interface ConsumeEventOptions {
  /** Topic to consume from */
  topic: string;
  /** Group ID for the consumer (optional) */
  groupId?: string;
  /** Maximum number of events to consume */
  maxEvents?: number;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Event filter predicate */
  filter?: (event: IEvent) => boolean;
}

/**
 * Consumes events from Kafka for testing
 * 
 * @param context - Test environment context
 * @param options - Consumption options
 * @returns Promise that resolves with consumed events
 */
export async function consumeTestEvents<T extends IEvent>(
  context: TestEnvironmentContext,
  options: ConsumeEventOptions
): Promise<T[]> {
  if (!context.consumer) {
    throw new Error('Kafka consumer not available in test context');
  }
  
  const {
    topic,
    groupId = `test-group-${uuidv4()}`,
    maxEvents = 1,
    timeout = 5000,
    filter = () => true,
  } = options;
  
  const events: T[] = [];
  let timeoutId: NodeJS.Timeout;
  
  // Create a promise that resolves when events are consumed or timeout occurs
  const consumePromise = new Promise<T[]>(async (resolve, reject) => {
    try {
      // Subscribe to topic
      await context.consumer.subscribe({ topic, fromBeginning: true });
      
      // Set timeout
      timeoutId = setTimeout(() => {
        console.log(`Timeout reached while consuming events from ${topic}`);
        resolve(events);
      }, timeout);
      
      // Start consuming
      await context.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            if (!message.value) return;
            
            // Parse event
            const event = JSON.parse(message.value.toString()) as T;
            
            // Apply filter
            if (filter(event)) {
              events.push(event);
              console.log(`Consumed test event ${event.eventId} from ${topic}`);
              
              // Check if we've reached the maximum number of events
              if (events.length >= maxEvents) {
                clearTimeout(timeoutId);
                resolve(events);
              }
            }
          } catch (error) {
            console.error(`Error processing message: ${error.message}`);
          }
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
  
  // Wait for events or timeout
  const result = await consumePromise;
  
  // Stop consuming
  await context.consumer.stop();
  
  return result;
}

/**
 * Options for waiting for an event
 */
export interface WaitForEventOptions {
  /** Topic to consume from */
  topic: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Event filter predicate */
  filter?: (event: IEvent) => boolean;
  /** Whether to throw an error if timeout is reached */
  throwOnTimeout?: boolean;
}

/**
 * Waits for a specific event to be published
 * 
 * @param context - Test environment context
 * @param options - Wait options
 * @returns Promise that resolves with the event or null if timeout is reached
 */
export async function waitForEvent<T extends IEvent>(
  context: TestEnvironmentContext,
  options: WaitForEventOptions
): Promise<T | null> {
  const {
    topic,
    timeout = 5000,
    filter = () => true,
    throwOnTimeout = false,
  } = options;
  
  const events = await consumeTestEvents<T>(context, {
    topic,
    maxEvents: 1,
    timeout,
    filter,
  });
  
  if (events.length === 0) {
    if (throwOnTimeout) {
      throw new Error(`Timeout reached while waiting for event on topic ${topic}`);
    }
    return null;
  }
  
  return events[0];
}

/**
 * Creates a test event with default values
 * 
 * @param type - Event type
 * @param payload - Event payload
 * @param overrides - Optional overrides for event properties
 * @returns Test event
 */
export function createTestEvent<T>(
  type: string,
  payload: T,
  overrides: Partial<IEvent> = {}
): IEvent & { payload: T } {
  return {
    eventId: uuidv4(),
    timestamp: new Date().toISOString(),
    version: '1.0.0' as EventVersion,
    source: 'test',
    type,
    payload,
    metadata: {},
    ...overrides,
  };
}

/**
 * Compares two events for equality
 * 
 * @param actual - Actual event
 * @param expected - Expected event
 * @param options - Comparison options
 * @returns Whether the events are equal
 */
export function compareEvents(
  actual: IEvent,
  expected: IEvent,
  options: {
    ignoreTimestamp?: boolean;
    ignoreEventId?: boolean;
    ignoreMetadata?: boolean;
    customComparators?: Record<string, (a: any, b: any) => boolean>;
  } = {}
): boolean {
  const {
    ignoreTimestamp = true,
    ignoreEventId = true,
    ignoreMetadata = true,
    customComparators = {},
  } = options;
  
  // Check type
  if (actual.type !== expected.type) {
    return false;
  }
  
  // Check version
  if (actual.version !== expected.version) {
    return false;
  }
  
  // Check source
  if (actual.source !== expected.source) {
    return false;
  }
  
  // Check event ID if not ignored
  if (!ignoreEventId && actual.eventId !== expected.eventId) {
    return false;
  }
  
  // Check timestamp if not ignored
  if (!ignoreTimestamp && actual.timestamp !== expected.timestamp) {
    return false;
  }
  
  // Check payload using deep equality or custom comparators
  if (!comparePayloads(actual.payload, expected.payload, customComparators)) {
    return false;
  }
  
  // Check metadata if not ignored
  if (!ignoreMetadata && !comparePayloads(actual.metadata, expected.metadata, customComparators)) {
    return false;
  }
  
  return true;
}

/**
 * Compares two payloads for deep equality
 */
function comparePayloads(
  actual: any,
  expected: any,
  customComparators: Record<string, (a: any, b: any) => boolean> = {}
): boolean {
  // Handle null/undefined
  if (actual === expected) {
    return true;
  }
  
  // Handle one side null/undefined
  if (actual == null || expected == null) {
    return false;
  }
  
  // Handle different types
  if (typeof actual !== typeof expected) {
    return false;
  }
  
  // Handle arrays
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return false;
    }
    
    return actual.every((item, index) => comparePayloads(item, expected[index], customComparators));
  }
  
  // Handle objects
  if (typeof actual === 'object' && typeof expected === 'object') {
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    
    // Check if keys match
    if (actualKeys.length !== expectedKeys.length ||
        !actualKeys.every(key => expectedKeys.includes(key))) {
      return false;
    }
    
    // Check each property
    return actualKeys.every(key => {
      // Use custom comparator if available
      if (customComparators[key]) {
        return customComparators[key](actual[key], expected[key]);
      }
      
      // Otherwise use recursive comparison
      return comparePayloads(actual[key], expected[key], customComparators);
    });
  }
  
  // Handle primitives
  return actual === expected;
}

/**
 * Database seeding utilities for tests
 */
export class TestDatabaseSeeder {
  constructor(private readonly prisma: PrismaClient) {}
  
  /**
   * Cleans the database by truncating all tables
   */
  async cleanDatabase(): Promise<void> {
    // Get all table names from the current schema
    const tables = await this.getTables();
    
    // Disable foreign key checks
    await this.prisma.$executeRawUnsafe('SET session_replication_role = replica;');
    
    try {
      // Truncate each table
      for (const table of tables) {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      }
      
      console.log(`Cleaned ${tables.length} tables`);
    } finally {
      // Re-enable foreign key checks
      await this.prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
    }
  }
  
  /**
   * Gets all table names in the current schema
   */
  private async getTables(): Promise<string[]> {
    const schemaName = await this.getCurrentSchema();
    
    const result = await this.prisma.$queryRawUnsafe<Array<{ tablename: string }>>(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = '${schemaName}'
    `);
    
    return result.map(row => row.tablename);
  }
  
  /**
   * Gets the current schema name
   */
  private async getCurrentSchema(): Promise<string> {
    const result = await this.prisma.$queryRawUnsafe<Array<{ current_schema: string }>>(
      'SELECT current_schema();'
    );
    
    return result[0].current_schema;
  }
  
  /**
   * Seeds test users
   */
  async seedTestUsers(): Promise<any[]> {
    const users = [
      {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password', // In a real implementation, this would be hashed
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password', // In a real implementation, this would be hashed
      },
    ];
    
    const createdUsers = [];
    
    for (const user of users) {
      const createdUser = await this.prisma.user.upsert({
        where: { email: user.email },
        update: user,
        create: user,
      });
      
      createdUsers.push(createdUser);
    }
    
    return createdUsers;
  }
  
  /**
   * Seeds test events
   */
  async seedTestEvents(count: number = 5): Promise<any[]> {
    const events = [];
    
    for (let i = 0; i < count; i++) {
      const event = {
        eventId: uuidv4(),
        type: `test-event-${i}`,
        source: 'test',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        payload: { data: `Test data ${i}` },
        metadata: { test: true },
      };
      
      const createdEvent = await this.prisma.event.create({
        data: {
          id: event.eventId,
          type: event.type,
          source: event.source,
          version: event.version,
          timestamp: new Date(event.timestamp),
          payload: event.payload as any,
          metadata: event.metadata as any,
        },
      });
      
      events.push(createdEvent);
    }
    
    return events;
  }
  
  /**
   * Seeds journey-specific test data
   */
  async seedJourneyData(journey: 'health' | 'care' | 'plan'): Promise<void> {
    switch (journey) {
      case 'health':
        await this.seedHealthJourneyData();
        break;
      case 'care':
        await this.seedCareJourneyData();
        break;
      case 'plan':
        await this.seedPlanJourneyData();
        break;
    }
  }
  
  /**
   * Seeds health journey test data
   */
  private async seedHealthJourneyData(): Promise<void> {
    // Seed health metric types
    const metricTypes = [
      { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
      { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
      { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
      { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
    ];
    
    for (const metricType of metricTypes) {
      await this.prisma.healthMetricType.upsert({
        where: { name: metricType.name },
        update: {},
        create: metricType,
      });
    }
    
    console.log(`Seeded ${metricTypes.length} health metric types`);
  }
  
  /**
   * Seeds care journey test data
   */
  private async seedCareJourneyData(): Promise<void> {
    // Seed provider specialties
    const specialties = [
      { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
      { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
      { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
    ];
    
    for (const specialty of specialties) {
      await this.prisma.providerSpecialty.upsert({
        where: { name: specialty.name },
        update: {},
        create: specialty,
      });
    }
    
    console.log(`Seeded ${specialties.length} provider specialties`);
  }
  
  /**
   * Seeds plan journey test data
   */
  private async seedPlanJourneyData(): Promise<void> {
    // Seed plan types
    const planTypes = [
      { name: 'Básico', description: 'Plano com cobertura básica' },
      { name: 'Standard', description: 'Plano com cobertura intermediária' },
      { name: 'Premium', description: 'Plano com cobertura ampla' },
    ];
    
    for (const planType of planTypes) {
      await this.prisma.insurancePlanType.upsert({
        where: { name: planType.name },
        update: {},
        create: planType,
      });
    }
    
    console.log(`Seeded ${planTypes.length} insurance plan types`);
  }
}

/**
 * Retry options for test operations
 */
export interface RetryOptions {
  /** Maximum number of attempts */
  maxAttempts?: number;
  /** Delay between attempts in milliseconds */
  delay?: number;
  /** Whether to use exponential backoff */
  exponentialBackoff?: boolean;
  /** Backoff factor for exponential backoff */
  backoffFactor?: number;
  /** Condition to retry */
  retryCondition?: (error: Error) => boolean;
}

/**
 * Retries an operation with configurable retry policy
 * 
 * @param operation - Operation to retry
 * @param options - Retry options
 * @returns Promise that resolves with the operation result
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 100,
    exponentialBackoff = true,
    backoffFactor = 2,
    retryCondition = () => true,
  } = options;
  
  let attempt = 0;
  let currentDelay = delay;
  
  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      
      // Check if we should retry
      if (attempt >= maxAttempts || !retryCondition(error)) {
        throw error;
      }
      
      // Wait before retrying
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${currentDelay}ms`);
      await sleep(currentDelay);
      
      // Calculate next delay with exponential backoff if enabled
      if (exponentialBackoff) {
        currentDelay *= backoffFactor;
      }
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw new Error('Retry operation failed');
}

/**
 * Waits for a condition to be true with timeout
 * 
 * @param condition - Condition to check
 * @param options - Wait options
 * @returns Promise that resolves when the condition is true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: {
    timeout?: number;
    interval?: number;
    timeoutMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 100,
    timeoutMessage = 'Timeout waiting for condition',
  } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    
    await sleep(interval);
  }
  
  throw new Error(timeoutMessage);
}

/**
 * Creates a mock event handler for testing
 * 
 * @param eventType - Type of events to handle
 * @param handler - Handler function
 * @returns Mock event handler
 */
export function createMockEventHandler<T extends IEvent>(
  eventType: string,
  handler: (event: T) => Promise<IEventResponse> | IEventResponse
): IEventHandler<T> {
  return {
    handle: async (event: T) => {
      return await handler(event);
    },
    canHandle: (event: T) => event.type === eventType,
    getEventType: () => eventType,
  };
}