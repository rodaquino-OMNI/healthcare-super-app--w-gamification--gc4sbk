import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Kafka, Consumer, Producer, KafkaMessage, ProducerRecord } from 'kafkajs';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from 'src/backend/shared/src/database/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { EventType } from '../../src/dto/event-types.enum';
import { JourneyType } from '../../src/dto/journey-types.enum';
import { AppModule } from 'src/backend/gamification-engine/src/app.module';
import { EventMetadataDto } from '../../src/dto/event-metadata.dto';

/**
 * Configuration for test environment
 */
export interface TestEnvironmentConfig {
  /** Kafka broker addresses */
  kafkaBrokers: string[];
  /** Test consumer group ID */
  consumerGroupId: string;
  /** Topics to subscribe to */
  topics: string[];
  /** Database connection URL */
  databaseUrl: string;
  /** Test timeout in milliseconds */
  testTimeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}

/**
 * Default test environment configuration
 */
export const DEFAULT_TEST_CONFIG: TestEnvironmentConfig = {
  kafkaBrokers: ['localhost:9092'],
  consumerGroupId: `test-group-${uuidv4()}`,
  topics: ['health-events', 'care-events', 'plan-events', 'gamification-events'],
  databaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/austa_test',
  testTimeout: 30000,
  maxRetries: 5,
  retryDelay: 1000,
};

/**
 * Test event with metadata
 */
export interface TestEvent<T = any> {
  type: EventType;
  journey: JourneyType;
  userId: string;
  data: T;
  metadata?: EventMetadataDto;
}

/**
 * Test environment for event end-to-end testing
 */
export class TestEnvironment {
  private app: INestApplication;
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private prisma: PrismaClient;
  private prismaService: PrismaService;
  private config: TestEnvironmentConfig;
  private consumedMessages: KafkaMessage[] = [];
  private isConsuming = false;

  /**
   * Creates a new test environment
   * @param config - Test environment configuration
   */
  constructor(config: Partial<TestEnvironmentConfig> = {}) {
    this.config = { ...DEFAULT_TEST_CONFIG, ...config };
  }

  /**
   * Sets up the test environment
   */
  async setup(): Promise<void> {
    // Create Kafka client
    this.kafka = new Kafka({
      clientId: `test-client-${uuidv4()}`,
      brokers: this.config.kafkaBrokers,
    });

    // Create producer
    this.producer = this.kafka.producer();
    await this.producer.connect();

    // Create consumer
    this.consumer = this.kafka.consumer({ groupId: this.config.consumerGroupId });
    await this.consumer.connect();
    
    for (const topic of this.config.topics) {
      await this.consumer.subscribe({ topic, fromBeginning: true });
    }

    // Setup database
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.databaseUrl,
        },
      },
    });
    
    this.prismaService = new PrismaService();
    await this.prismaService.cleanDatabase();

    // Create NestJS application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();

    // Start consuming messages
    this.startConsuming();
  }

  /**
   * Tears down the test environment
   */
  async teardown(): Promise<void> {
    // Stop consuming messages
    this.isConsuming = false;
    
    // Disconnect from Kafka
    await this.consumer.disconnect();
    await this.producer.disconnect();
    
    // Clean up database
    await this.prismaService.cleanDatabase();
    await this.prisma.$disconnect();
    
    // Close NestJS application
    await this.app.close();
  }

  /**
   * Starts consuming messages from Kafka
   */
  private async startConsuming(): Promise<void> {
    this.isConsuming = true;
    
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        if (this.isConsuming) {
          this.consumedMessages.push(message);
        }
      },
    });
  }

  /**
   * Publishes an event to Kafka
   * @param event - The event to publish
   * @param topic - The topic to publish to
   * @returns The published message
   */
  async publishEvent<T = any>(event: TestEvent<T>, topic: string): Promise<void> {
    const message: ProducerRecord = {
      topic,
      messages: [
        {
          key: event.userId,
          value: JSON.stringify(event),
          headers: {
            'correlation-id': uuidv4(),
            'event-type': event.type,
            'journey': event.journey,
          },
        },
      ],
    };

    await this.producer.send(message);
  }

  /**
   * Waits for a specific event to be consumed
   * @param eventType - The event type to wait for
   * @param userId - The user ID to filter by
   * @param timeout - The timeout in milliseconds
   * @returns The consumed event or null if timeout
   */
  async waitForEvent<T = any>(
    eventType: EventType,
    userId?: string,
    timeout = this.config.testTimeout
  ): Promise<TestEvent<T> | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const message = this.findMessage(eventType, userId);
      
      if (message) {
        const event = JSON.parse(message.value.toString()) as TestEvent<T>;
        return event;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return null;
  }

  /**
   * Finds a message in the consumed messages
   * @param eventType - The event type to find
   * @param userId - The user ID to filter by
   * @returns The found message or undefined
   */
  private findMessage(eventType: EventType, userId?: string): KafkaMessage | undefined {
    return this.consumedMessages.find(message => {
      if (!message.value) return false;
      
      try {
        const event = JSON.parse(message.value.toString()) as TestEvent;
        
        if (event.type !== eventType) return false;
        if (userId && event.userId !== userId) return false;
        
        return true;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Clears all consumed messages
   */
  clearConsumedMessages(): void {
    this.consumedMessages = [];
  }

  /**
   * Gets all consumed messages
   * @returns All consumed messages
   */
  getConsumedMessages(): KafkaMessage[] {
    return [...this.consumedMessages];
  }

  /**
   * Gets the NestJS application
   * @returns The NestJS application
   */
  getApp(): INestApplication {
    return this.app;
  }

  /**
   * Gets the Prisma client
   * @returns The Prisma client
   */
  getPrisma(): PrismaClient {
    return this.prisma;
  }

  /**
   * Gets the Kafka producer
   * @returns The Kafka producer
   */
  getProducer(): Producer {
    return this.producer;
  }

  /**
   * Gets the Kafka consumer
   * @returns The Kafka consumer
   */
  getConsumer(): Consumer {
    return this.consumer;
  }
}

/**
 * Creates a test user in the database
 * @param prisma - The Prisma client
 * @param overrides - Optional overrides for user properties
 * @returns The created user
 */
export async function createTestUser(prisma: PrismaClient, overrides: Partial<any> = {}): Promise<any> {
  return prisma.user.create({
    data: {
      name: `Test User ${uuidv4()}`,
      email: `test-${uuidv4()}@austa.com.br`,
      password: 'Password123!',
      phone: '+5511999999999',
      cpf: Math.floor(Math.random() * 100000000000).toString().padStart(11, '0'),
      ...overrides,
    },
  });
}

/**
 * Creates test health metrics in the database
 * @param prisma - The Prisma client
 * @param userId - The user ID
 * @param count - The number of metrics to create
 * @returns The created metrics
 */
export async function createTestHealthMetrics(prisma: PrismaClient, userId: string, count = 5): Promise<any[]> {
  const metrics = [];
  
  // Get available metric types
  const metricTypes = await prisma.healthMetricType.findMany();
  
  if (metricTypes.length === 0) {
    throw new Error('No health metric types found in the database. Please run the seed script first.');
  }
  
  // Create metrics
  for (let i = 0; i < count; i++) {
    const metricType = metricTypes[Math.floor(Math.random() * metricTypes.length)];
    
    const metric = await prisma.healthMetric.create({
      data: {
        userId,
        typeId: metricType.id,
        value: Math.floor(Math.random() * 100).toString(),
        recordedAt: new Date(),
      },
    });
    
    metrics.push(metric);
  }
  
  return metrics;
}

/**
 * Creates a test appointment in the database
 * @param prisma - The Prisma client
 * @param userId - The user ID
 * @param overrides - Optional overrides for appointment properties
 * @returns The created appointment
 */
export async function createTestAppointment(prisma: PrismaClient, userId: string, overrides: Partial<any> = {}): Promise<any> {
  // Get a random specialty
  const specialties = await prisma.providerSpecialty.findMany();
  
  if (specialties.length === 0) {
    throw new Error('No provider specialties found in the database. Please run the seed script first.');
  }
  
  const specialty = specialties[Math.floor(Math.random() * specialties.length)];
  
  // Create a provider
  const provider = await prisma.provider.create({
    data: {
      name: `Dr. Test ${uuidv4()}`,
      specialtyId: specialty.id,
      email: `provider-${uuidv4()}@austa.com.br`,
      phone: '+5511888888888',
    },
  });
  
  // Create an appointment
  return prisma.appointment.create({
    data: {
      userId,
      providerId: provider.id,
      scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
      status: 'SCHEDULED',
      notes: 'Test appointment created for e2e testing',
      ...overrides,
    },
  });
}

/**
 * Creates a test insurance claim in the database
 * @param prisma - The Prisma client
 * @param userId - The user ID
 * @param overrides - Optional overrides for claim properties
 * @returns The created claim
 */
export async function createTestClaim(prisma: PrismaClient, userId: string, overrides: Partial<any> = {}): Promise<any> {
  // Get a random claim type
  const claimTypes = await prisma.claimType.findMany();
  
  if (claimTypes.length === 0) {
    throw new Error('No claim types found in the database. Please run the seed script first.');
  }
  
  const claimType = claimTypes[Math.floor(Math.random() * claimTypes.length)];
  
  // Create a claim
  return prisma.insuranceClaim.create({
    data: {
      userId,
      typeId: claimType.id,
      amount: Math.floor(Math.random() * 1000) + 100,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      description: 'Test claim created for e2e testing',
      ...overrides,
    },
  });
}

/**
 * Asserts that an event has the expected properties
 * @param event - The event to assert
 * @param expectedType - The expected event type
 * @param expectedJourney - The expected journey type
 * @param expectedUserId - The expected user ID
 * @throws Error if the assertion fails
 */
export function assertEvent(
  event: TestEvent | null,
  expectedType: EventType,
  expectedJourney: JourneyType,
  expectedUserId: string
): void {
  if (!event) {
    throw new Error(`Expected event of type ${expectedType} but received null`);
  }
  
  if (event.type !== expectedType) {
    throw new Error(`Expected event type ${expectedType} but received ${event.type}`);
  }
  
  if (event.journey !== expectedJourney) {
    throw new Error(`Expected journey ${expectedJourney} but received ${event.journey}`);
  }
  
  if (event.userId !== expectedUserId) {
    throw new Error(`Expected user ID ${expectedUserId} but received ${event.userId}`);
  }
}

/**
 * Retries a function until it succeeds or reaches the maximum number of retries
 * @param fn - The function to retry
 * @param maxRetries - The maximum number of retries
 * @param delay - The delay between retries in milliseconds
 * @returns The result of the function
 * @throws The last error encountered
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  delay = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      console.log(`Retry attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        // Wait before retrying with exponential backoff
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Waits for a condition to be true
 * @param condition - The condition function
 * @param timeout - The timeout in milliseconds
 * @param interval - The interval between checks in milliseconds
 * @returns True if the condition was met, false if timeout
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout = 30000,
  interval = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

/**
 * Creates a random event for testing
 * @param type - The event type
 * @param journey - The journey type
 * @param userId - The user ID
 * @param data - The event data
 * @returns A test event
 */
export function createTestEvent<T = any>(
  type: EventType,
  journey: JourneyType,
  userId: string,
  data: T
): TestEvent<T> {
  return {
    type,
    journey,
    userId,
    data,
    metadata: {
      correlationId: uuidv4(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'e2e-test',
    },
  };
}

/**
 * Seeds the database with test data
 * @param prisma - The Prisma client
 */
export async function seedTestDatabase(prisma: PrismaClient): Promise<void> {
  // Create permissions
  const permissions = [
    { name: 'health:metrics:read', description: 'View health metrics' },
    { name: 'health:metrics:write', description: 'Record health metrics' },
    { name: 'care:appointments:read', description: 'View appointments' },
    { name: 'care:appointments:write', description: 'Manage appointments' },
    { name: 'plan:claims:read', description: 'View claims' },
    { name: 'plan:claims:write', description: 'Submit and manage claims' },
    { name: 'game:achievements:read', description: 'View achievements' },
  ];
  
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }
  
  // Create roles
  const userRole = await prisma.role.upsert({
    where: { name: 'User' },
    update: {},
    create: {
      name: 'User',
      description: 'Standard user with access to all journeys',
      isDefault: true,
      journey: null,
    },
  });
  
  // Connect permissions to role
  const permissionRecords = await prisma.permission.findMany({
    where: {
      name: {
        in: permissions.map(p => p.name),
      },
    },
  });
  
  await prisma.role.update({
    where: { id: userRole.id },
    data: {
      permissions: {
        connect: permissionRecords.map(p => ({ id: p.id })),
      },
    },
  });
  
  // Create health metric types if they don't exist
  const metricTypes = [
    { name: 'HEART_RATE', unit: 'bpm', normalRangeMin: 60, normalRangeMax: 100 },
    { name: 'BLOOD_PRESSURE', unit: 'mmHg', normalRangeMin: null, normalRangeMax: null },
    { name: 'BLOOD_GLUCOSE', unit: 'mg/dL', normalRangeMin: 70, normalRangeMax: 100 },
    { name: 'STEPS', unit: 'steps', normalRangeMin: 5000, normalRangeMax: null },
    { name: 'WEIGHT', unit: 'kg', normalRangeMin: null, normalRangeMax: null },
  ];

  for (const metricType of metricTypes) {
    await prisma.healthMetricType.upsert({
      where: { name: metricType.name },
      update: {},
      create: metricType,
    });
  }
  
  // Create provider specialties if they don't exist
  const specialties = [
    { name: 'Cardiologia', description: 'Especialista em coração e sistema cardiovascular' },
    { name: 'Dermatologia', description: 'Especialista em pele, cabelo e unhas' },
    { name: 'Ortopedia', description: 'Especialista em sistema músculo-esquelético' },
  ];
  
  for (const specialty of specialties) {
    await prisma.providerSpecialty.upsert({
      where: { name: specialty.name },
      update: {},
      create: specialty,
    });
  }
  
  // Create claim types if they don't exist
  const claimTypes = [
    { name: 'Consulta Médica', description: 'Reembolso para consulta médica' },
    { name: 'Exame', description: 'Reembolso para exames médicos' },
    { name: 'Terapia', description: 'Reembolso para sessões terapêuticas' },
  ];
  
  for (const claimType of claimTypes) {
    await prisma.claimType.upsert({
      where: { name: claimType.name },
      update: {},
      create: claimType,
    });
  }
  
  // Create achievement types if they don't exist
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