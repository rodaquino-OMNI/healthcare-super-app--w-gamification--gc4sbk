import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@backend/packages/database/src/connection/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { v4 as uuidv4 } from 'uuid';
import { EventType } from '@backend/packages/events/src/interfaces/event-type.enum';
import { JourneyType } from '@backend/packages/interfaces/common/journey-type.enum';

/**
 * Type definition for a mock PrismaClient that can be used in tests
 */
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/**
 * Creates a mock PrismaClient for testing purposes.
 * This allows tests to run without an actual database connection.
 * 
 * @returns A mock PrismaClient instance that can be controlled in tests
 */
export function createMockPrismaClient(): MockPrismaClient {
  return mockDeep<PrismaClient>();
}

/**
 * Creates a test database context with an isolated environment for testing.
 * 
 * @returns An object containing the PrismaService and cleanup function
 */
export async function createTestDatabase() {
  // Create a unique schema name for test isolation
  const schemaId = `test_${uuidv4().replace(/-/g, '')}`;
  const databaseUrl = process.env.DATABASE_URL || '';
  
  // Set environment variables for the test database
  process.env.DATABASE_URL = `${databaseUrl}?schema=${schemaId}`;
  
  // Create a PrismaService instance for the test schema
  const prismaService = new PrismaService();
  
  // Connect to the database
  await prismaService.$connect();
  
  // Create a cleanup function to drop the schema after tests
  const cleanup = async () => {
    // Drop the schema
    await prismaService.$executeRaw`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`;
    // Disconnect from the database
    await prismaService.$disconnect();
  };
  
  return { prismaService, cleanup };
}

/**
 * Seeds the test database with event-specific test data.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
export async function seedEventTestData(prisma: PrismaClient | PrismaService): Promise<void> {
  try {
    // Seed event types if they don't exist
    await seedEventTypes(prisma);
    
    // Seed gamification profiles for testing
    await seedGamificationProfiles(prisma);
    
    // Seed event records for testing
    await seedEventRecords(prisma);
    
    console.log('Event test data seeded successfully');
  } catch (error) {
    console.error('Error seeding event test data:', error);
    throw error;
  }
}

/**
 * Seeds event types for testing.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
async function seedEventTypes(prisma: PrismaClient | PrismaService): Promise<void> {
  // Define event types for each journey
  const healthEventTypes = [
    { name: EventType.HEALTH_METRIC_RECORDED, description: 'Health metric was recorded', journey: JourneyType.HEALTH },
    { name: EventType.HEALTH_GOAL_ACHIEVED, description: 'Health goal was achieved', journey: JourneyType.HEALTH },
    { name: EventType.DEVICE_CONNECTED, description: 'Device was connected', journey: JourneyType.HEALTH },
  ];
  
  const careEventTypes = [
    { name: EventType.APPOINTMENT_SCHEDULED, description: 'Appointment was scheduled', journey: JourneyType.CARE },
    { name: EventType.MEDICATION_TAKEN, description: 'Medication was taken', journey: JourneyType.CARE },
    { name: EventType.TELEMEDICINE_COMPLETED, description: 'Telemedicine session was completed', journey: JourneyType.CARE },
  ];
  
  const planEventTypes = [
    { name: EventType.CLAIM_SUBMITTED, description: 'Claim was submitted', journey: JourneyType.PLAN },
    { name: EventType.BENEFIT_USED, description: 'Benefit was used', journey: JourneyType.PLAN },
    { name: EventType.DOCUMENT_UPLOADED, description: 'Document was uploaded', journey: JourneyType.PLAN },
  ];
  
  const gamificationEventTypes = [
    { name: EventType.ACHIEVEMENT_UNLOCKED, description: 'Achievement was unlocked', journey: JourneyType.GAMIFICATION },
    { name: EventType.REWARD_EARNED, description: 'Reward was earned', journey: JourneyType.GAMIFICATION },
    { name: EventType.QUEST_COMPLETED, description: 'Quest was completed', journey: JourneyType.GAMIFICATION },
  ];
  
  const allEventTypes = [
    ...healthEventTypes,
    ...careEventTypes,
    ...planEventTypes,
    ...gamificationEventTypes,
  ];
  
  // Create all event types in the database
  for (const eventType of allEventTypes) {
    try {
      await prisma.eventType.upsert({
        where: { name: eventType.name },
        update: {},
        create: eventType,
      });
    } catch (error) {
      // If creation fails due to unique constraint, just log and continue
      if (error.code === 'P2002') {
        console.log(`Event type ${eventType.name} already exists, skipping...`);
      } else {
        // For other errors, re-throw
        throw error;
      }
    }
  }
}

/**
 * Seeds gamification profiles for testing.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
async function seedGamificationProfiles(prisma: PrismaClient | PrismaService): Promise<void> {
  // Create test users if they don't exist
  const testUsers = [
    { id: 'test-user-1', name: 'Test User 1', email: 'test1@example.com' },
    { id: 'test-user-2', name: 'Test User 2', email: 'test2@example.com' },
  ];
  
  for (const user of testUsers) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: user,
      });
    } catch (error) {
      // If creation fails due to unique constraint, just log and continue
      if (error.code === 'P2002') {
        console.log(`User ${user.id} already exists, skipping...`);
      } else {
        // For other errors, re-throw
        throw error;
      }
    }
  }
  
  // Create gamification profiles for test users
  for (const user of testUsers) {
    try {
      await prisma.gamificationProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          level: 1,
          xp: 0,
          totalXp: 0,
        },
      });
    } catch (error) {
      // If creation fails due to unique constraint, just log and continue
      if (error.code === 'P2002') {
        console.log(`Gamification profile for user ${user.id} already exists, skipping...`);
      } else {
        // For other errors, re-throw
        throw error;
      }
    }
  }
}

/**
 * Seeds event records for testing.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
async function seedEventRecords(prisma: PrismaClient | PrismaService): Promise<void> {
  // Get test users
  const users = await prisma.user.findMany({
    where: {
      id: { in: ['test-user-1', 'test-user-2'] },
    },
  });
  
  if (users.length === 0) {
    throw new Error('Test users not found. Make sure to seed users first.');
  }
  
  // Get event types
  const eventTypes = await prisma.eventType.findMany();
  const eventTypeMap = new Map(eventTypes.map(type => [type.name, type]));
  
  // Create sample events for each user
  for (const user of users) {
    // Health journey events
    await createTestEvent(prisma, {
      userId: user.id,
      eventType: EventType.HEALTH_METRIC_RECORDED,
      eventTypeId: eventTypeMap.get(EventType.HEALTH_METRIC_RECORDED)?.id,
      payload: JSON.stringify({
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
      }),
    });
    
    // Care journey events
    await createTestEvent(prisma, {
      userId: user.id,
      eventType: EventType.APPOINTMENT_SCHEDULED,
      eventTypeId: eventTypeMap.get(EventType.APPOINTMENT_SCHEDULED)?.id,
      payload: JSON.stringify({
        providerId: 'provider-123',
        specialtyId: 'specialty-456',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'SCHEDULED',
      }),
    });
    
    // Plan journey events
    await createTestEvent(prisma, {
      userId: user.id,
      eventType: EventType.CLAIM_SUBMITTED,
      eventTypeId: eventTypeMap.get(EventType.CLAIM_SUBMITTED)?.id,
      payload: JSON.stringify({
        claimId: `claim-${uuidv4()}`,
        amount: 150.0,
        currency: 'BRL',
        status: 'SUBMITTED',
        documentIds: [`doc-${uuidv4()}`],
      }),
    });
    
    // Gamification events
    await createTestEvent(prisma, {
      userId: user.id,
      eventType: EventType.ACHIEVEMENT_UNLOCKED,
      eventTypeId: eventTypeMap.get(EventType.ACHIEVEMENT_UNLOCKED)?.id,
      payload: JSON.stringify({
        achievementId: 'achievement-123',
        name: 'First Steps',
        description: 'Completed your first health check',
        xpEarned: 50,
      }),
    });
  }
}

/**
 * Creates a test event record.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @param eventData - The event data to create
 */
async function createTestEvent(
  prisma: PrismaClient | PrismaService,
  eventData: {
    userId: string;
    eventType: EventType;
    eventTypeId: string;
    payload: string;
  },
): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        id: uuidv4(),
        userId: eventData.userId,
        eventTypeId: eventData.eventTypeId,
        payload: eventData.payload,
        processed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`Error creating test event ${eventData.eventType}:`, error);
    throw error;
  }
}

/**
 * Cleans the test database by removing all data.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 */
export async function cleanTestDatabase(prisma: PrismaClient | PrismaService): Promise<void> {
  try {
    // Delete all events
    await prisma.event.deleteMany({});
    
    // Delete all gamification profiles
    await prisma.gamificationProfile.deleteMany({});
    
    // Delete all users
    await prisma.user.deleteMany({
      where: {
        id: { in: ['test-user-1', 'test-user-2'] },
      },
    });
    
    // Note: We don't delete event types as they are reference data
    
    console.log('Test database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  }
}

/**
 * Creates a transaction context for testing database operations.
 * 
 * @param prisma - The PrismaClient or PrismaService instance
 * @returns A function that executes operations within a transaction
 */
export function createTransactionContext(prisma: PrismaClient | PrismaService) {
  return async <T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> => {
    return prisma.$transaction(async (tx) => {
      return callback(tx as PrismaClient);
    });
  };
}

/**
 * Sets up a complete test database environment with all necessary data.
 * 
 * @returns An object containing the PrismaService, transaction context, and cleanup function
 */
export async function setupTestDatabaseEnvironment() {
  const { prismaService, cleanup } = await createTestDatabase();
  
  // Seed the database with test data
  await seedEventTestData(prismaService);
  
  // Create a transaction context
  const withTransaction = createTransactionContext(prismaService);
  
  return {
    prisma: prismaService,
    withTransaction,
    cleanup: async () => {
      await cleanTestDatabase(prismaService);
      await cleanup();
    },
  };
}