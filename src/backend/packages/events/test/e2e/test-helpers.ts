/**
 * Test helpers for event end-to-end testing
 * 
 * This file provides utilities for setting up isolated test environments,
 * Kafka test clients, database seeding, and event assertion utilities.
 * These helpers ensure consistent testing patterns across all event test suites.
 */

import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { IBaseEvent } from '../../src/interfaces/base-event.interface';
import { IKafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@austa/database';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsModule } from '../../src/events.module';
import { randomUUID } from 'crypto';
import { IEventResponse } from '../../src/interfaces/event-response.interface';
import { IEventValidator } from '../../src/interfaces/event-validation.interface';
import { IVersionedEvent } from '../../src/interfaces/event-versioning.interface';

// Types for test environment
export interface TestEnvironment {
  moduleRef: TestingModule;
  kafkaService: KafkaService;
  kafkaProducer: KafkaProducer;
  prismaService: PrismaService;
  cleanup: () => Promise<void>;
}

export interface EventTestOptions {
  /** Whether to use a real Kafka instance or mock */
  useRealKafka?: boolean;
  /** Whether to seed the database with test data */
  seedDatabase?: boolean;
  /** Custom environment variables for the test */
  envVars?: Record<string, string>;
  /** Timeout for event assertions in milliseconds */
  assertionTimeout?: number;
}

// Default test options
const defaultTestOptions: EventTestOptions = {
  useRealKafka: false,
  seedDatabase: true,
  assertionTimeout: 5000,
};

/**
 * Creates an isolated test environment for event testing
 * 
 * @param options Configuration options for the test environment
 * @returns A configured test environment with cleanup function
 */
export async function createTestEnvironment(options: EventTestOptions = {}): Promise<TestEnvironment> {
  const testOptions = { ...defaultTestOptions, ...options };
  
  // Create a unique test ID to isolate resources
  const testId = randomUUID();
  
  // Set up environment variables for testing
  const envVars = {
    NODE_ENV: 'test',
    KAFKA_BROKERS: testOptions.useRealKafka ? process.env.KAFKA_BROKERS || 'localhost:9092' : 'mock',
    KAFKA_CLIENT_ID: `test-client-${testId}`,
    KAFKA_CONSUMER_GROUP: `test-group-${testId}`,
    DATABASE_URL: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
    ...testOptions.envVars,
  };
  
  // Create a testing module with required dependencies
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [() => envVars],
      }),
      EventsModule,
    ],
  }).compile();
  
  // Get required services
  const kafkaService = moduleRef.get<KafkaService>(KafkaService);
  const kafkaProducer = moduleRef.get<KafkaProducer>(KafkaProducer);
  const prismaService = moduleRef.get<PrismaService>(PrismaService);
  
  // Initialize services
  await moduleRef.init();
  
  // Seed the database if required
  if (testOptions.seedDatabase) {
    await seedTestDatabase(prismaService);
  }
  
  // Return the test environment with cleanup function
  return {
    moduleRef,
    kafkaService,
    kafkaProducer,
    prismaService,
    cleanup: async () => {
      // Clean up database
      await prismaService.cleanDatabase();
      
      // Close Kafka connections
      await kafkaService.onModuleDestroy();
      
      // Close the testing module
      await moduleRef.close();
    },
  };
}

/**
 * Creates a test consumer for a specific topic
 * 
 * @param kafkaService The Kafka service instance
 * @param topic The topic to consume from
 * @param groupId Optional consumer group ID (defaults to a random UUID)
 * @returns A configured consumer instance
 */
export async function createTestConsumer(
  kafkaService: KafkaService,
  topic: string,
  groupId?: string,
): Promise<KafkaConsumer> {
  const consumer = await kafkaService.createConsumer({
    groupId: groupId || `test-consumer-${randomUUID()}`,
    topics: [topic],
  });
  
  await consumer.connect();
  return consumer;
}

/**
 * Publishes a test event to Kafka
 * 
 * @param producer The Kafka producer instance
 * @param topic The topic to publish to
 * @param event The event to publish
 * @returns The published Kafka event
 */
export async function publishTestEvent<T extends IBaseEvent>(
  producer: KafkaProducer,
  topic: string,
  event: T,
): Promise<IKafkaEvent<T>> {
  // Ensure event has required fields
  const completeEvent: T = {
    eventId: event.eventId || randomUUID(),
    timestamp: event.timestamp || new Date().toISOString(),
    version: event.version || '1.0.0',
    source: event.source || 'test',
    ...event,
  };
  
  // Publish the event
  const kafkaEvent = await producer.send({
    topic,
    messages: [
      {
        key: completeEvent.eventId,
        value: JSON.stringify(completeEvent),
        headers: {
          'event-type': completeEvent.type,
          'event-source': completeEvent.source,
          'event-version': completeEvent.version,
          'correlation-id': randomUUID(),
        },
      },
    ],
  });
  
  return {
    ...completeEvent,
    topic,
    partition: kafkaEvent[0].partition,
    offset: kafkaEvent[0].offset,
  } as IKafkaEvent<T>;
}

/**
 * Waits for a specific event to be consumed
 * 
 * @param consumer The Kafka consumer instance
 * @param predicate Function to determine if the consumed event matches expectations
 * @param timeout Maximum time to wait in milliseconds
 * @returns The matching event or null if timeout occurs
 */
export async function waitForEvent<T extends IBaseEvent>(
  consumer: KafkaConsumer,
  predicate: (event: T) => boolean,
  timeout = 5000,
): Promise<T | null> {
  return new Promise((resolve) => {
    const events: T[] = [];
    const timeoutId = setTimeout(() => {
      consumer.removeListener('message', messageHandler);
      resolve(null);
    }, timeout);
    
    const messageHandler = (message: any) => {
      try {
        const event = JSON.parse(message.value.toString()) as T;
        events.push(event);
        
        if (predicate(event)) {
          clearTimeout(timeoutId);
          consumer.removeListener('message', messageHandler);
          resolve(event);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    consumer.on('message', messageHandler);
  });
}

/**
 * Waits for multiple events matching a predicate
 * 
 * @param consumer The Kafka consumer instance
 * @param predicate Function to determine if events should be collected
 * @param count Number of events to collect
 * @param timeout Maximum time to wait in milliseconds
 * @returns Array of matching events or empty array if timeout occurs
 */
export async function waitForEvents<T extends IBaseEvent>(
  consumer: KafkaConsumer,
  predicate: (event: T) => boolean,
  count = 1,
  timeout = 10000,
): Promise<T[]> {
  return new Promise((resolve) => {
    const events: T[] = [];
    const timeoutId = setTimeout(() => {
      consumer.removeListener('message', messageHandler);
      resolve(events);
    }, timeout);
    
    const messageHandler = (message: any) => {
      try {
        const event = JSON.parse(message.value.toString()) as T;
        
        if (predicate(event)) {
          events.push(event);
          
          if (events.length >= count) {
            clearTimeout(timeoutId);
            consumer.removeListener('message', messageHandler);
            resolve(events);
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    consumer.on('message', messageHandler);
  });
}

/**
 * Seeds the test database with required data
 * 
 * @param prismaService The Prisma service instance
 */
export async function seedTestDatabase(prismaService: PrismaService): Promise<void> {
  // Clean the database first
  await prismaService.cleanDatabase();
  
  // Create a standard Prisma client for seeding
  const prisma = new PrismaClient();
  
  try {
    // Seed journey-specific test data
    await seedHealthJourneyData(prisma);
    await seedCareJourneyData(prisma);
    await seedPlanJourneyData(prisma);
    await seedGamificationData(prisma);
    
    console.log('Test database seeded successfully');
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Seeds health journey test data
 * 
 * @param prisma The Prisma client instance
 */
async function seedHealthJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample health metrics types
  const metricTypes = [
    { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
    { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
    { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
    { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
    { name: 'SLEEP', unit: 'hours', normalRangeMin: 7, normalRangeMax: 9 },
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
    { name: 'Glucose Monitor', description: 'Blood glucose monitoring device', manufacturer: 'Various' },
    { name: 'Smart Scale', description: 'Weight and body composition scale', manufacturer: 'Various' },
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
 * Seeds care journey test data
 * 
 * @param prisma The Prisma client instance
 */
async function seedCareJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample provider specialties
  const specialties = [
    { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
    { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
    { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
    { name: 'Pediatria', description: 'Especialista em saúde infantil' },
    { name: 'Psiquiatria', description: 'Especialista em saúde mental' },
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
 * Seeds plan journey test data
 * 
 * @param prisma The Prisma client instance
 */
async function seedPlanJourneyData(prisma: PrismaClient): Promise<void> {
  // Sample plan types
  const planTypes = [
    { name: 'Básico', description: 'Plano com cobertura básica' },
    { name: 'Standard', description: 'Plano com cobertura intermediária' },
    { name: 'Premium', description: 'Plano com cobertura ampla' },
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
    { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
    { name: 'Internação', description: 'Reembolso para internação hospitalar' },
    { name: 'Medicamento', description: 'Reembolso para medicamentos prescritos' },
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
 * Seeds gamification test data
 * 
 * @param prisma The Prisma client instance
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
      name: 'steps-goal', 
      title: 'Caminhante Dedicado', 
      description: 'Atinja sua meta diária de passos',
      journey: 'health',
      icon: 'footprints',
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
    { 
      name: 'medication-adherence', 
      title: 'Aderência ao Tratamento', 
      description: 'Tome seus medicamentos conforme prescrito',
      journey: 'care',
      icon: 'pill',
      levels: 3
    },
    { 
      name: 'claim-master', 
      title: 'Mestre em Reembolsos', 
      description: 'Submeta solicitações de reembolso completas',
      journey: 'plan',
      icon: 'receipt',
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
 * Creates a factory function for generating test events
 * 
 * @param baseEvent Base event properties to include in all generated events
 * @returns A function that generates events with the given properties
 */
export function createEventFactory<T extends IBaseEvent>(baseEvent: Partial<T>) {
  return (overrides: Partial<T> = {}): T => {
    return {
      eventId: randomUUID(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'test',
      ...baseEvent,
      ...overrides,
    } as T;
  };
}

/**
 * Creates journey-specific event factories
 * 
 * @returns Object containing factory functions for each journey
 */
export function createJourneyEventFactories() {
  return {
    health: {
      metricRecorded: createEventFactory<IBaseEvent>({
        type: 'health.metric.recorded',
        journey: 'health',
        payload: {
          userId: randomUUID(),
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      }),
      goalAchieved: createEventFactory<IBaseEvent>({
        type: 'health.goal.achieved',
        journey: 'health',
        payload: {
          userId: randomUUID(),
          goalId: randomUUID(),
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          achievedAt: new Date().toISOString(),
        },
      }),
      deviceConnected: createEventFactory<IBaseEvent>({
        type: 'health.device.connected',
        journey: 'health',
        payload: {
          userId: randomUUID(),
          deviceId: randomUUID(),
          deviceType: 'Smartwatch',
          manufacturer: 'Various',
          connectedAt: new Date().toISOString(),
        },
      }),
    },
    care: {
      appointmentBooked: createEventFactory<IBaseEvent>({
        type: 'care.appointment.booked',
        journey: 'care',
        payload: {
          userId: randomUUID(),
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
        },
      }),
      medicationTaken: createEventFactory<IBaseEvent>({
        type: 'care.medication.taken',
        journey: 'care',
        payload: {
          userId: randomUUID(),
          medicationId: randomUUID(),
          scheduledAt: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          dosage: '10mg',
        },
      }),
      telemedicineCompleted: createEventFactory<IBaseEvent>({
        type: 'care.telemedicine.completed',
        journey: 'care',
        payload: {
          userId: randomUUID(),
          sessionId: randomUUID(),
          providerId: randomUUID(),
          startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          endedAt: new Date().toISOString(),
          duration: 1800, // 30 minutes in seconds
        },
      }),
    },
    plan: {
      claimSubmitted: createEventFactory<IBaseEvent>({
        type: 'plan.claim.submitted',
        journey: 'plan',
        payload: {
          userId: randomUUID(),
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      }),
      benefitUtilized: createEventFactory<IBaseEvent>({
        type: 'plan.benefit.utilized',
        journey: 'plan',
        payload: {
          userId: randomUUID(),
          benefitId: randomUUID(),
          utilizedAt: new Date().toISOString(),
          value: 50.0,
          currency: 'BRL',
        },
      }),
      planSelected: createEventFactory<IBaseEvent>({
        type: 'plan.plan.selected',
        journey: 'plan',
        payload: {
          userId: randomUUID(),
          planId: randomUUID(),
          planTypeId: randomUUID(),
          selectedAt: new Date().toISOString(),
          startDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
        },
      }),
    },
    gamification: {
      achievementUnlocked: createEventFactory<IBaseEvent>({
        type: 'gamification.achievement.unlocked',
        journey: 'gamification',
        payload: {
          userId: randomUUID(),
          achievementId: randomUUID(),
          achievementTypeId: randomUUID(),
          level: 1,
          unlockedAt: new Date().toISOString(),
          points: 100,
        },
      }),
      rewardEarned: createEventFactory<IBaseEvent>({
        type: 'gamification.reward.earned',
        journey: 'gamification',
        payload: {
          userId: randomUUID(),
          rewardId: randomUUID(),
          rewardTypeId: randomUUID(),
          earnedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7776000000).toISOString(), // 90 days from now
          value: 200,
        },
      }),
    },
  };
}

/**
 * Asserts that two events are equal, ignoring specified fields
 * 
 * @param actual The actual event
 * @param expected The expected event
 * @param ignoreFields Fields to ignore in the comparison
 * @throws Error if the events are not equal
 */
export function assertEventsEqual<T extends IBaseEvent>(
  actual: T,
  expected: T,
  ignoreFields: (keyof T)[] = ['eventId', 'timestamp'],
): void {
  // Create copies without ignored fields
  const actualCopy = { ...actual };
  const expectedCopy = { ...expected };
  
  for (const field of ignoreFields) {
    delete actualCopy[field];
    delete expectedCopy[field];
  }
  
  // Compare the events
  expect(actualCopy).toEqual(expectedCopy);
}

/**
 * Waits for a condition to be true
 * 
 * @param condition Function that returns true when the condition is met
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Interval between checks in milliseconds
 * @returns Promise that resolves when the condition is met or rejects on timeout
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100,
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await Promise.resolve(condition())) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms timeout`);
}

/**
 * Retries a function until it succeeds or reaches the maximum number of attempts
 * 
 * @param fn Function to retry
 * @param maxAttempts Maximum number of attempts
 * @param delay Delay between attempts in milliseconds
 * @returns Promise that resolves with the function result or rejects after all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delay = 1000,
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error(`Failed after ${maxAttempts} attempts`);
}

/**
 * Creates a mock event handler for testing
 * 
 * @param eventType The type of event to handle
 * @param handler The handler function
 * @returns A mock event handler
 */
export function createMockEventHandler<T extends IBaseEvent>(
  eventType: string,
  handler: (event: T) => Promise<IEventResponse>,
) {
  return {
    handle: jest.fn(handler),
    canHandle: jest.fn((event: T) => event.type === eventType),
    getEventType: jest.fn(() => eventType),
  };
}

/**
 * Creates a mock event validator for testing
 * 
 * @param eventType The type of event to validate
 * @param validator The validation function
 * @returns A mock event validator
 */
export function createMockEventValidator<T extends IBaseEvent>(
  eventType: string,
  validator: (event: T) => boolean | Promise<boolean>,
): IEventValidator<T> {
  return {
    validate: jest.fn(async (event: T) => {
      const isValid = await Promise.resolve(validator(event));
      return {
        isValid,
        errors: isValid ? [] : [{ field: 'test', message: 'Validation failed' }],
      };
    }),
    canValidate: jest.fn((event: T) => event.type === eventType),
    getEventType: jest.fn(() => eventType),
  };
}

/**
 * Creates a test database context for isolated testing
 * 
 * @param prismaService The Prisma service instance
 * @returns Object with transaction and cleanup functions
 */
export async function createTestDatabaseContext(prismaService: PrismaService) {
  // Start a transaction to isolate test data
  const tx = await prismaService.$transaction(async (prisma) => {
    // Return the transaction client
    return prisma;
  }, { maxWait: 5000, timeout: 10000 });
  
  return {
    tx,
    cleanup: async () => {
      // Rollback transaction to clean up test data
      await prismaService.$executeRaw`ROLLBACK`;
    },
  };
}

/**
 * Creates a versioned event for testing schema evolution
 * 
 * @param event Base event to version
 * @param version Version to apply
 * @returns Versioned event
 */
export function createVersionedEvent<T extends IBaseEvent>(
  event: T,
  version = '1.0.0',
): IVersionedEvent<T> {
  return {
    ...event,
    version,
    getVersion: () => version,
    isCompatibleWith: (otherVersion: string) => {
      // Simple semver compatibility check
      const [major1] = version.split('.');
      const [major2] = otherVersion.split('.');
      return major1 === major2;
    },
    migrate: (targetVersion: string) => {
      // Simple migration that just updates the version
      return createVersionedEvent(event, targetVersion);
    },
  };
}