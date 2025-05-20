import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { EventType } from '../../../src/dto/event-types.enum';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for test database configuration options
 */
export interface TestDatabaseOptions {
  /** Whether to use an in-memory database instead of a real one */
  useInMemory?: boolean;
  /** Custom database URL to use for testing */
  databaseUrl?: string;
  /** Whether to seed the database with test data */
  seedTestData?: boolean;
  /** Specific journeys to seed data for */
  journeysToSeed?: ('health' | 'care' | 'plan')[];
  /** Whether to isolate this test database from others */
  isolateDatabase?: boolean;
  /** Custom schema name for database isolation */
  schemaName?: string;
}

/**
 * Interface for event database record
 */
export interface EventRecord {
  id: string;
  type: string;
  payload: any;
  userId?: string;
  journeyId?: string;
  createdAt: Date;
  processedAt?: Date;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
  errorMessage?: string;
  retryCount?: number;
  version?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for achievement record
 */
export interface AchievementRecord {
  id: string;
  userId: string;
  type: string;
  level: number;
  earnedAt: Date;
  journey: 'health' | 'care' | 'plan';
  metadata?: Record<string, any>;
}

/**
 * Interface for mock database containing in-memory tables
 */
export interface MockDatabase {
  events: EventRecord[];
  achievements: AchievementRecord[];
  users: any[];
  healthMetrics: any[];
  careAppointments: any[];
  planClaims: any[];
  [key: string]: any[];
}

/**
 * Mock PrismaClient for testing
 */
export type MockPrismaClient = DeepMockProxy<PrismaClient> & {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
  $executeRaw: jest.Mock;
};

/**
 * In-memory database for testing
 */
let inMemoryDatabase: MockDatabase = {
  events: [],
  achievements: [],
  users: [],
  healthMetrics: [],
  careAppointments: [],
  planClaims: [],
};

/**
 * Creates a mock PrismaClient for testing
 * @returns A mock PrismaClient instance
 */
export function createMockPrismaClient(): MockPrismaClient {
  const mockPrisma = mockDeep<PrismaClient>() as MockPrismaClient;
  
  // Mock the event model operations
  mockPrisma.event.create.mockImplementation(async (params) => {
    const newEvent = {
      id: params.data.id || uuidv4(),
      ...params.data,
      createdAt: params.data.createdAt || new Date(),
    } as any;
    
    inMemoryDatabase.events.push(newEvent);
    return newEvent;
  });
  
  mockPrisma.event.findUnique.mockImplementation(async (params) => {
    const event = inMemoryDatabase.events.find(e => e.id === params.where.id);
    return event || null;
  });
  
  mockPrisma.event.findMany.mockImplementation(async (params) => {
    let events = [...inMemoryDatabase.events];
    
    // Apply where filters if provided
    if (params?.where) {
      if (params.where.type) {
        events = events.filter(e => e.type === params.where.type);
      }
      if (params.where.userId) {
        events = events.filter(e => e.userId === params.where.userId);
      }
      if (params.where.status) {
        events = events.filter(e => e.status === params.where.status);
      }
      if (params.where.journeyId) {
        events = events.filter(e => e.journeyId === params.where.journeyId);
      }
    }
    
    // Apply orderBy if provided
    if (params?.orderBy) {
      const orderField = Object.keys(params.orderBy)[0];
      const orderDirection = params.orderBy[orderField];
      
      events.sort((a, b) => {
        if (orderDirection === 'asc') {
          return a[orderField] > b[orderField] ? 1 : -1;
        } else {
          return a[orderField] < b[orderField] ? 1 : -1;
        }
      });
    }
    
    // Apply pagination if provided
    if (params?.skip) {
      events = events.slice(params.skip);
    }
    if (params?.take) {
      events = events.slice(0, params.take);
    }
    
    return events;
  });
  
  mockPrisma.event.update.mockImplementation(async (params) => {
    const index = inMemoryDatabase.events.findIndex(e => e.id === params.where.id);
    if (index === -1) {
      throw new Error(`Event with ID ${params.where.id} not found`);
    }
    
    const updatedEvent = {
      ...inMemoryDatabase.events[index],
      ...params.data,
    };
    
    inMemoryDatabase.events[index] = updatedEvent;
    return updatedEvent;
  });
  
  mockPrisma.event.delete.mockImplementation(async (params) => {
    const index = inMemoryDatabase.events.findIndex(e => e.id === params.where.id);
    if (index === -1) {
      throw new Error(`Event with ID ${params.where.id} not found`);
    }
    
    const deletedEvent = inMemoryDatabase.events[index];
    inMemoryDatabase.events.splice(index, 1);
    return deletedEvent;
  });
  
  // Mock achievement model operations
  mockPrisma.achievement.create.mockImplementation(async (params) => {
    const newAchievement = {
      id: params.data.id || uuidv4(),
      ...params.data,
      earnedAt: params.data.earnedAt || new Date(),
    } as any;
    
    inMemoryDatabase.achievements.push(newAchievement);
    return newAchievement;
  });
  
  mockPrisma.achievement.findMany.mockImplementation(async (params) => {
    let achievements = [...inMemoryDatabase.achievements];
    
    // Apply where filters if provided
    if (params?.where) {
      if (params.where.userId) {
        achievements = achievements.filter(a => a.userId === params.where.userId);
      }
      if (params.where.type) {
        achievements = achievements.filter(a => a.type === params.where.type);
      }
      if (params.where.journey) {
        achievements = achievements.filter(a => a.journey === params.where.journey);
      }
    }
    
    // Apply orderBy if provided
    if (params?.orderBy) {
      const orderField = Object.keys(params.orderBy)[0];
      const orderDirection = params.orderBy[orderField];
      
      achievements.sort((a, b) => {
        if (orderDirection === 'asc') {
          return a[orderField] > b[orderField] ? 1 : -1;
        } else {
          return a[orderField] < b[orderField] ? 1 : -1;
        }
      });
    }
    
    // Apply pagination if provided
    if (params?.skip) {
      achievements = achievements.slice(params.skip);
    }
    if (params?.take) {
      achievements = achievements.slice(0, params.take);
    }
    
    return achievements;
  });
  
  // Mock transaction support
  mockPrisma.$transaction.mockImplementation(async (callback) => {
    try {
      // Create a snapshot of the database before transaction
      const dbSnapshot = JSON.parse(JSON.stringify(inMemoryDatabase));
      
      // Execute the transaction callback
      const result = await callback(mockPrisma);
      
      return result;
    } catch (error) {
      // Restore database from snapshot on error
      inMemoryDatabase = JSON.parse(JSON.stringify(inMemoryDatabase));
      throw error;
    }
  });
  
  return mockPrisma;
}

/**
 * Creates a test database environment for event testing
 * @param options Configuration options for the test database
 * @returns A configured PrismaClient for testing
 */
export async function createTestDatabase(options: TestDatabaseOptions = {}): Promise<PrismaClient | MockPrismaClient> {
  const {
    useInMemory = true,
    databaseUrl,
    seedTestData = true,
    journeysToSeed = ['health', 'care', 'plan'],
    isolateDatabase = true,
    schemaName = `test_${uuidv4().replace(/-/g, '')}`
  } = options;
  
  // Reset in-memory database
  resetInMemoryDatabase();
  
  if (useInMemory) {
    const mockPrisma = createMockPrismaClient();
    
    if (seedTestData) {
      await seedTestEventData(mockPrisma, journeysToSeed);
    }
    
    return mockPrisma;
  } else {
    // Create a real PrismaClient with test configuration
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl || process.env.TEST_DATABASE_URL || `postgresql://postgres:postgres@localhost:5432/test?schema=${schemaName}`,
        },
      },
    });
    
    // Connect to the database
    await prisma.$connect();
    
    // Create isolated schema if needed
    if (isolateDatabase) {
      await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${schemaName}`;
      await prisma.$executeRaw`SET search_path TO ${schemaName}`;
    }
    
    // Clean the database
    await cleanDatabase(prisma);
    
    // Seed test data if requested
    if (seedTestData) {
      await seedTestEventData(prisma, journeysToSeed);
    }
    
    return prisma;
  }
}

/**
 * Cleans up the test database environment
 * @param prisma The PrismaClient instance to clean up
 * @param options Cleanup options
 */
export async function cleanupTestDatabase(
  prisma: PrismaClient | MockPrismaClient,
  options: { dropSchema?: boolean; schemaName?: string } = {}
): Promise<void> {
  const { dropSchema = false, schemaName } = options;
  
  if ('$executeRaw' in prisma && typeof prisma.$executeRaw === 'function') {
    try {
      // Clean the database first
      await cleanDatabase(prisma);
      
      // Drop the schema if requested
      if (dropSchema && schemaName) {
        await prisma.$executeRaw`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`;
      }
    } catch (error) {
      console.error('Error cleaning up test database:', error);
    }
  }
  
  // Disconnect from the database
  await prisma.$disconnect();
  
  // Reset in-memory database
  resetInMemoryDatabase();
}

/**
 * Cleans the database by truncating all tables
 * @param prisma The PrismaClient instance
 */
export async function cleanDatabase(prisma: PrismaClient | MockPrismaClient): Promise<void> {
  if ('$executeRaw' in prisma && typeof prisma.$executeRaw === 'function') {
    try {
      // For a real database, truncate all tables
      await prisma.$transaction([
        prisma.$executeRaw`TRUNCATE TABLE "Event" CASCADE`,
        prisma.$executeRaw`TRUNCATE TABLE "Achievement" CASCADE`,
        prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`,
        prisma.$executeRaw`TRUNCATE TABLE "HealthMetric" CASCADE`,
        prisma.$executeRaw`TRUNCATE TABLE "CareAppointment" CASCADE`,
        prisma.$executeRaw`TRUNCATE TABLE "PlanClaim" CASCADE`,
      ]);
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  } else {
    // For in-memory database, just reset it
    resetInMemoryDatabase();
  }
}

/**
 * Resets the in-memory database to an empty state
 */
export function resetInMemoryDatabase(): void {
  inMemoryDatabase = {
    events: [],
    achievements: [],
    users: [],
    healthMetrics: [],
    careAppointments: [],
    planClaims: [],
  };
}

/**
 * Seeds the test database with event-specific test data
 * @param prisma The PrismaClient instance
 * @param journeys The journeys to seed data for
 */
export async function seedTestEventData(
  prisma: PrismaClient | MockPrismaClient,
  journeys: ('health' | 'care' | 'plan')[] = ['health', 'care', 'plan']
): Promise<void> {
  try {
    // Create test users
    const testUsers = await seedTestUsers(prisma);
    
    // Seed journey-specific events
    for (const journey of journeys) {
      switch (journey) {
        case 'health':
          await seedHealthJourneyEvents(prisma, testUsers);
          break;
        case 'care':
          await seedCareJourneyEvents(prisma, testUsers);
          break;
        case 'plan':
          await seedPlanJourneyEvents(prisma, testUsers);
          break;
      }
    }
    
    // Seed cross-journey achievements
    await seedAchievements(prisma, testUsers);
    
  } catch (error) {
    console.error('Error seeding test event data:', error);
    throw error;
  }
}

/**
 * Seeds test users for event testing
 * @param prisma The PrismaClient instance
 * @returns Array of created test user IDs
 */
async function seedTestUsers(prisma: PrismaClient | MockPrismaClient): Promise<string[]> {
  const userIds: string[] = [];
  
  // Create test users with mock data
  const testUsers = [
    { id: uuidv4(), name: 'Test User 1', email: 'test1@austa.com.br' },
    { id: uuidv4(), name: 'Test User 2', email: 'test2@austa.com.br' },
    { id: uuidv4(), name: 'Test User 3', email: 'test3@austa.com.br' },
  ];
  
  for (const user of testUsers) {
    if ('user' in prisma && prisma.user && typeof prisma.user.create === 'function') {
      await prisma.user.create({
        data: user,
      });
    } else {
      // For mock database, add to in-memory storage
      inMemoryDatabase.users.push(user);
    }
    
    userIds.push(user.id);
  }
  
  return userIds;
}

/**
 * Seeds health journey events for testing
 * @param prisma The PrismaClient instance
 * @param userIds Array of user IDs to create events for
 */
async function seedHealthJourneyEvents(prisma: PrismaClient | MockPrismaClient, userIds: string[]): Promise<void> {
  // Create health metric events
  const healthMetricEvents = [];
  
  for (const userId of userIds) {
    // Heart rate events
    healthMetricEvents.push({
      id: uuidv4(),
      type: EventType.HEALTH_METRIC_RECORDED,
      userId,
      journeyId: 'health',
      payload: {
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        source: 'manual',
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Blood pressure events
    healthMetricEvents.push({
      id: uuidv4(),
      type: EventType.HEALTH_METRIC_RECORDED,
      userId,
      journeyId: 'health',
      payload: {
        metricType: 'BLOOD_PRESSURE',
        value: { systolic: 120, diastolic: 80 },
        unit: 'mmHg',
        recordedAt: new Date().toISOString(),
        source: 'manual',
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Steps events
    healthMetricEvents.push({
      id: uuidv4(),
      type: EventType.HEALTH_METRIC_RECORDED,
      userId,
      journeyId: 'health',
      payload: {
        metricType: 'STEPS',
        value: 8500,
        unit: 'steps',
        recordedAt: new Date().toISOString(),
        source: 'device',
        deviceId: uuidv4(),
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Goal achievement events
    healthMetricEvents.push({
      id: uuidv4(),
      type: EventType.HEALTH_GOAL_ACHIEVED,
      userId,
      journeyId: 'health',
      payload: {
        goalType: 'STEPS',
        targetValue: 8000,
        actualValue: 8500,
        achievedAt: new Date().toISOString(),
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Device sync events
    healthMetricEvents.push({
      id: uuidv4(),
      type: EventType.HEALTH_DEVICE_SYNCED,
      userId,
      journeyId: 'health',
      payload: {
        deviceId: uuidv4(),
        deviceType: 'Smartwatch',
        syncedAt: new Date().toISOString(),
        metricsCount: 5,
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
  }
  
  // Store events in database
  for (const event of healthMetricEvents) {
    await prisma.event.create({
      data: event,
    });
  }
}

/**
 * Seeds care journey events for testing
 * @param prisma The PrismaClient instance
 * @param userIds Array of user IDs to create events for
 */
async function seedCareJourneyEvents(prisma: PrismaClient | MockPrismaClient, userIds: string[]): Promise<void> {
  // Create care journey events
  const careEvents = [];
  
  for (const userId of userIds) {
    // Appointment booking events
    careEvents.push({
      id: uuidv4(),
      type: EventType.CARE_APPOINTMENT_BOOKED,
      userId,
      journeyId: 'care',
      payload: {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        specialtyId: 'Cardiologia',
        scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: 'Clínica Central',
        bookedAt: new Date().toISOString(),
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Appointment completed events
    careEvents.push({
      id: uuidv4(),
      type: EventType.CARE_APPOINTMENT_COMPLETED,
      userId,
      journeyId: 'care',
      payload: {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        specialtyId: 'Dermatologia',
        scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 30, // minutes
      },
      status: 'PROCESSED',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Medication adherence events
    careEvents.push({
      id: uuidv4(),
      type: EventType.CARE_MEDICATION_TAKEN,
      userId,
      journeyId: 'care',
      payload: {
        medicationId: uuidv4(),
        medicationName: 'Atenolol',
        dosage: '50mg',
        takenAt: new Date().toISOString(),
        scheduled: true,
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Telemedicine session events
    careEvents.push({
      id: uuidv4(),
      type: EventType.CARE_TELEMEDICINE_COMPLETED,
      userId,
      journeyId: 'care',
      payload: {
        sessionId: uuidv4(),
        providerId: uuidv4(),
        specialtyId: 'Psiquiatria',
        startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        endedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
        duration: 45, // minutes
      },
      status: 'PROCESSED',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
  }
  
  // Store events in database
  for (const event of careEvents) {
    await prisma.event.create({
      data: event,
    });
  }
}

/**
 * Seeds plan journey events for testing
 * @param prisma The PrismaClient instance
 * @param userIds Array of user IDs to create events for
 */
async function seedPlanJourneyEvents(prisma: PrismaClient | MockPrismaClient, userIds: string[]): Promise<void> {
  // Create plan journey events
  const planEvents = [];
  
  for (const userId of userIds) {
    // Claim submission events
    planEvents.push({
      id: uuidv4(),
      type: EventType.PLAN_CLAIM_SUBMITTED,
      userId,
      journeyId: 'plan',
      payload: {
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        amount: 250.0,
        currency: 'BRL',
        serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date().toISOString(),
        provider: 'Clínica Central',
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Claim approved events
    planEvents.push({
      id: uuidv4(),
      type: EventType.PLAN_CLAIM_APPROVED,
      userId,
      journeyId: 'plan',
      payload: {
        claimId: uuidv4(),
        claimType: 'Exame',
        amount: 180.0,
        approvedAmount: 150.0,
        currency: 'BRL',
        serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        submittedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        provider: 'Laboratório Central',
      },
      status: 'PROCESSED',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Benefit usage events
    planEvents.push({
      id: uuidv4(),
      type: EventType.PLAN_BENEFIT_USED,
      userId,
      journeyId: 'plan',
      payload: {
        benefitId: uuidv4(),
        benefitType: 'Desconto em Farmácia',
        usedAt: new Date().toISOString(),
        location: 'Farmácia Popular',
        savingsAmount: 45.0,
        currency: 'BRL',
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
    
    // Plan comparison events
    planEvents.push({
      id: uuidv4(),
      type: EventType.PLAN_COMPARISON_COMPLETED,
      userId,
      journeyId: 'plan',
      payload: {
        comparisonId: uuidv4(),
        planIds: [uuidv4(), uuidv4(), uuidv4()],
        completedAt: new Date().toISOString(),
        selectedPlanId: uuidv4(),
      },
      status: 'PROCESSED',
      createdAt: new Date(),
      processedAt: new Date(),
      version: '1.0.0',
      correlationId: uuidv4(),
    });
  }
  
  // Store events in database
  for (const event of planEvents) {
    await prisma.event.create({
      data: event,
    });
  }
}

/**
 * Seeds achievements for testing
 * @param prisma The PrismaClient instance
 * @param userIds Array of user IDs to create achievements for
 */
async function seedAchievements(prisma: PrismaClient | MockPrismaClient, userIds: string[]): Promise<void> {
  // Create achievements
  const achievements = [];
  
  for (const userId of userIds) {
    // Health journey achievements
    achievements.push({
      id: uuidv4(),
      userId,
      type: 'health-check-streak',
      level: 1,
      earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      journey: 'health',
      metadata: {
        streakDays: 7,
        metrics: ['HEART_RATE', 'BLOOD_PRESSURE', 'STEPS'],
      },
    });
    
    achievements.push({
      id: uuidv4(),
      userId,
      type: 'steps-goal',
      level: 2,
      earnedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      journey: 'health',
      metadata: {
        goalsMet: 15,
        totalSteps: 120000,
      },
    });
    
    // Care journey achievements
    achievements.push({
      id: uuidv4(),
      userId,
      type: 'appointment-keeper',
      level: 1,
      earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      journey: 'care',
      metadata: {
        appointmentsKept: 3,
        onTimeRate: 100,
      },
    });
    
    // Plan journey achievements
    achievements.push({
      id: uuidv4(),
      userId,
      type: 'claim-master',
      level: 1,
      earnedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      journey: 'plan',
      metadata: {
        claimsSubmitted: 5,
        approvalRate: 100,
      },
    });
  }
  
  // Store achievements in database
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement,
    });
  }
}

/**
 * Creates a test event with the specified properties
 * @param type The event type
 * @param userId The user ID
 * @param journeyId The journey ID
 * @param payload The event payload
 * @param options Additional event options
 * @returns The created event object
 */
export function createTestEvent(
  type: EventType,
  userId: string,
  journeyId: 'health' | 'care' | 'plan',
  payload: any,
  options: Partial<EventRecord> = {}
): EventRecord {
  return {
    id: options.id || uuidv4(),
    type,
    userId,
    journeyId,
    payload,
    createdAt: options.createdAt || new Date(),
    processedAt: options.processedAt,
    status: options.status || 'PENDING',
    errorMessage: options.errorMessage,
    retryCount: options.retryCount || 0,
    version: options.version || '1.0.0',
    correlationId: options.correlationId || uuidv4(),
    metadata: options.metadata || {},
  };
}

/**
 * Creates a test achievement with the specified properties
 * @param userId The user ID
 * @param type The achievement type
 * @param level The achievement level
 * @param journey The journey
 * @param options Additional achievement options
 * @returns The created achievement object
 */
export function createTestAchievement(
  userId: string,
  type: string,
  level: number,
  journey: 'health' | 'care' | 'plan',
  options: Partial<AchievementRecord> = {}
): AchievementRecord {
  return {
    id: options.id || uuidv4(),
    userId,
    type,
    level,
    earnedAt: options.earnedAt || new Date(),
    journey,
    metadata: options.metadata || {},
  };
}

/**
 * Gets the current state of the in-memory database
 * @returns The current in-memory database state
 */
export function getInMemoryDatabase(): MockDatabase {
  return { ...inMemoryDatabase };
}

/**
 * Sets the state of the in-memory database (useful for specific test scenarios)
 * @param newState The new database state
 */
export function setInMemoryDatabase(newState: Partial<MockDatabase>): void {
  inMemoryDatabase = {
    ...inMemoryDatabase,
    ...newState,
  };
}