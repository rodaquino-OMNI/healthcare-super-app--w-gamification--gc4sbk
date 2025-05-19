import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventType } from '../../../src/dto/event-types.enum';
import { DatabaseErrorType } from '../../../../database/src/errors/database-error.types';
import { DatabaseException } from '../../../../database/src/errors/database-error.exception';

/**
 * Mock implementation of PrismaClient for testing event persistence
 */
export class MockPrismaClient {
  private events: any[] = [];
  private achievements: any[] = [];
  private profiles: any[] = [];
  private rewards: any[] = [];
  private quests: any[] = [];
  private shouldFail: boolean = false;
  private errorType: DatabaseErrorType | null = null;

  /**
   * Configure the mock client to simulate failures
   * @param shouldFail Whether operations should fail
   * @param errorType Type of database error to simulate
   */
  public setFailureMode(shouldFail: boolean, errorType: DatabaseErrorType | null = null): void {
    this.shouldFail = shouldFail;
    this.errorType = errorType;
  }

  /**
   * Reset all data in the mock database
   */
  public async reset(): Promise<void> {
    this.events = [];
    this.achievements = [];
    this.profiles = [];
    this.rewards = [];
    this.quests = [];
    this.shouldFail = false;
    this.errorType = null;
  }

  /**
   * Get all events stored in the mock database
   */
  public getEvents(): any[] {
    return [...this.events];
  }

  /**
   * Get all achievements stored in the mock database
   */
  public getAchievements(): any[] {
    return [...this.achievements];
  }

  /**
   * Get all profiles stored in the mock database
   */
  public getProfiles(): any[] {
    return [...this.profiles];
  }

  /**
   * Get all rewards stored in the mock database
   */
  public getRewards(): any[] {
    return [...this.rewards];
  }

  /**
   * Get all quests stored in the mock database
   */
  public getQuests(): any[] {
    return [...this.quests];
  }

  /**
   * Mock implementation of Prisma's $transaction method
   * @param operations Array of operations to execute in a transaction
   */
  public async $transaction<T>(operations: (() => Promise<T>)[]): Promise<T[]> {
    if (this.shouldFail) {
      throw new DatabaseException(
        'Transaction failed',
        this.errorType || DatabaseErrorType.TRANSACTION,
        'TEST_TRANSACTION_ERROR'
      );
    }

    const results: T[] = [];
    for (const operation of operations) {
      results.push(await operation());
    }
    return results;
  }

  /**
   * Mock implementation of Prisma's $disconnect method
   */
  public async $disconnect(): Promise<void> {
    // No-op in mock implementation
  }

  /**
   * Mock implementation of Prisma's $connect method
   */
  public async $connect(): Promise<void> {
    if (this.shouldFail) {
      throw new DatabaseException(
        'Connection failed',
        this.errorType || DatabaseErrorType.CONNECTION,
        'TEST_CONNECTION_ERROR'
      );
    }
  }

  /**
   * Mock implementation of Prisma's event model
   */
  public event = {
    findMany: async (params?: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      if (!params) return this.events;
      
      let filteredEvents = [...this.events];
      
      if (params.where) {
        if (params.where.userId) {
          filteredEvents = filteredEvents.filter(e => e.userId === params.where.userId);
        }
        if (params.where.type) {
          filteredEvents = filteredEvents.filter(e => e.type === params.where.type);
        }
        if (params.where.journey) {
          filteredEvents = filteredEvents.filter(e => e.journey === params.where.journey);
        }
      }
      
      if (params.orderBy) {
        const orderField = Object.keys(params.orderBy)[0];
        const orderDir = params.orderBy[orderField];
        filteredEvents.sort((a, b) => {
          if (orderDir === 'asc') {
            return a[orderField] < b[orderField] ? -1 : 1;
          } else {
            return a[orderField] > b[orderField] ? -1 : 1;
          }
        });
      }
      
      if (params.take) {
        filteredEvents = filteredEvents.slice(0, params.take);
      }
      
      return filteredEvents;
    },
    findUnique: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      if (params.where.id) {
        return this.events.find(e => e.id === params.where.id) || null;
      }
      
      return null;
    },
    create: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Create failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_CREATE_ERROR'
        );
      }
      
      const newEvent = {
        id: params.data.id || uuidv4(),
        createdAt: params.data.createdAt || new Date(),
        updatedAt: params.data.updatedAt || new Date(),
        ...params.data
      };
      
      this.events.push(newEvent);
      return newEvent;
    },
    update: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Update failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_UPDATE_ERROR'
        );
      }
      
      const index = this.events.findIndex(e => e.id === params.where.id);
      if (index === -1) {
        throw new DatabaseException(
          'Event not found',
          DatabaseErrorType.QUERY,
          'TEST_NOT_FOUND_ERROR'
        );
      }
      
      const updatedEvent = {
        ...this.events[index],
        ...params.data,
        updatedAt: new Date()
      };
      
      this.events[index] = updatedEvent;
      return updatedEvent;
    },
    delete: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Delete failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_DELETE_ERROR'
        );
      }
      
      const index = this.events.findIndex(e => e.id === params.where.id);
      if (index === -1) {
        throw new DatabaseException(
          'Event not found',
          DatabaseErrorType.QUERY,
          'TEST_NOT_FOUND_ERROR'
        );
      }
      
      const deletedEvent = this.events[index];
      this.events.splice(index, 1);
      return deletedEvent;
    },
    upsert: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Upsert failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_UPSERT_ERROR'
        );
      }
      
      const existingEvent = this.events.find(e => e.id === params.where.id);
      if (existingEvent) {
        return await this.event.update({
          where: { id: params.where.id },
          data: params.update
        });
      } else {
        return await this.event.create({
          data: params.create
        });
      }
    }
  };

  /**
   * Mock implementation of Prisma's achievement model
   */
  public achievement = {
    findMany: async (params?: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      if (!params) return this.achievements;
      
      let filteredAchievements = [...this.achievements];
      
      if (params.where) {
        if (params.where.userId) {
          filteredAchievements = filteredAchievements.filter(a => a.userId === params.where.userId);
        }
        if (params.where.type) {
          filteredAchievements = filteredAchievements.filter(a => a.type === params.where.type);
        }
        if (params.where.journey) {
          filteredAchievements = filteredAchievements.filter(a => a.journey === params.where.journey);
        }
      }
      
      return filteredAchievements;
    },
    findUnique: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      if (params.where.id) {
        return this.achievements.find(a => a.id === params.where.id) || null;
      }
      
      return null;
    },
    create: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Create failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_CREATE_ERROR'
        );
      }
      
      const newAchievement = {
        id: params.data.id || uuidv4(),
        createdAt: params.data.createdAt || new Date(),
        updatedAt: params.data.updatedAt || new Date(),
        ...params.data
      };
      
      this.achievements.push(newAchievement);
      return newAchievement;
    },
    update: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Update failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_UPDATE_ERROR'
        );
      }
      
      const index = this.achievements.findIndex(a => a.id === params.where.id);
      if (index === -1) {
        throw new DatabaseException(
          'Achievement not found',
          DatabaseErrorType.QUERY,
          'TEST_NOT_FOUND_ERROR'
        );
      }
      
      const updatedAchievement = {
        ...this.achievements[index],
        ...params.data,
        updatedAt: new Date()
      };
      
      this.achievements[index] = updatedAchievement;
      return updatedAchievement;
    }
  };

  /**
   * Mock implementation of Prisma's profile model
   */
  public profile = {
    findMany: async (params?: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      return this.profiles;
    },
    findUnique: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Query failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_QUERY_ERROR'
        );
      }
      
      if (params.where.id) {
        return this.profiles.find(p => p.id === params.where.id) || null;
      }
      if (params.where.userId) {
        return this.profiles.find(p => p.userId === params.where.userId) || null;
      }
      
      return null;
    },
    create: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Create failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_CREATE_ERROR'
        );
      }
      
      const newProfile = {
        id: params.data.id || uuidv4(),
        createdAt: params.data.createdAt || new Date(),
        updatedAt: params.data.updatedAt || new Date(),
        xp: params.data.xp || 0,
        level: params.data.level || 1,
        ...params.data
      };
      
      this.profiles.push(newProfile);
      return newProfile;
    },
    update: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Update failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_UPDATE_ERROR'
        );
      }
      
      const index = this.profiles.findIndex(p => {
        if (params.where.id) return p.id === params.where.id;
        if (params.where.userId) return p.userId === params.where.userId;
        return false;
      });
      
      if (index === -1) {
        throw new DatabaseException(
          'Profile not found',
          DatabaseErrorType.QUERY,
          'TEST_NOT_FOUND_ERROR'
        );
      }
      
      const updatedProfile = {
        ...this.profiles[index],
        ...params.data,
        updatedAt: new Date()
      };
      
      this.profiles[index] = updatedProfile;
      return updatedProfile;
    },
    upsert: async (params: any) => {
      if (this.shouldFail) {
        throw new DatabaseException(
          'Upsert failed',
          this.errorType || DatabaseErrorType.QUERY,
          'TEST_UPSERT_ERROR'
        );
      }
      
      let existingProfile = null;
      
      if (params.where.id) {
        existingProfile = this.profiles.find(p => p.id === params.where.id);
      } else if (params.where.userId) {
        existingProfile = this.profiles.find(p => p.userId === params.where.userId);
      }
      
      if (existingProfile) {
        return await this.profile.update({
          where: params.where,
          data: params.update
        });
      } else {
        return await this.profile.create({
          data: params.create
        });
      }
    }
  };
}

/**
 * TestDatabaseHelper provides utilities for setting up and tearing down test databases
 * for event-related tests.
 */
export class TestDatabaseHelper {
  private prismaClient: MockPrismaClient;
  
  constructor() {
    this.prismaClient = new MockPrismaClient();
  }
  
  /**
   * Get the mock Prisma client instance
   */
  public getPrismaClient(): MockPrismaClient {
    return this.prismaClient;
  }
  
  /**
   * Initialize the test database with predefined data
   * @param options Configuration options for database initialization
   */
  public async initializeDatabase(options: InitializeDatabaseOptions = {}): Promise<void> {
    await this.prismaClient.reset();
    
    if (options.seedUsers) {
      await this.seedTestUsers(options.userCount || 3);
    }
    
    if (options.seedEvents) {
      await this.seedTestEvents(options.eventCount || 10);
    }
    
    if (options.seedAchievements) {
      await this.seedTestAchievements(options.achievementCount || 5);
    }
    
    if (options.seedProfiles) {
      await this.seedTestProfiles(options.profileCount || 3);
    }
  }
  
  /**
   * Clean up the test database, removing all data
   */
  public async cleanupDatabase(): Promise<void> {
    await this.prismaClient.reset();
  }
  
  /**
   * Seed the database with test users
   * @param count Number of test users to create
   */
  private async seedTestUsers(count: number): Promise<any[]> {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const user = {
        id: uuidv4(),
        name: `Test User ${i + 1}`,
        email: `test${i + 1}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      users.push(user);
    }
    
    return users;
  }
  
  /**
   * Seed the database with test events
   * @param count Number of test events to create
   */
  private async seedTestEvents(count: number): Promise<void> {
    const journeys = ['health', 'care', 'plan'];
    const eventTypes = [
      EventType.HEALTH_METRIC_RECORDED,
      EventType.HEALTH_GOAL_ACHIEVED,
      EventType.CARE_APPOINTMENT_BOOKED,
      EventType.CARE_MEDICATION_TAKEN,
      EventType.PLAN_CLAIM_SUBMITTED,
      EventType.PLAN_BENEFIT_USED
    ];
    
    const users = await this.seedTestUsers(3);
    
    for (let i = 0; i < count; i++) {
      const userIndex = i % users.length;
      const journeyIndex = i % journeys.length;
      const eventTypeIndex = i % eventTypes.length;
      
      const journey = journeys[journeyIndex];
      const eventType = eventTypes[eventTypeIndex];
      
      let payload: any = {};
      
      // Create journey-specific payloads
      switch (eventType) {
        case EventType.HEALTH_METRIC_RECORDED:
          payload = {
            metricType: 'HEART_RATE',
            value: 75 + Math.floor(Math.random() * 20),
            unit: 'bpm',
            recordedAt: new Date()
          };
          break;
        case EventType.HEALTH_GOAL_ACHIEVED:
          payload = {
            goalType: 'STEPS',
            targetValue: 10000,
            achievedValue: 10500 + Math.floor(Math.random() * 1000),
            completedAt: new Date()
          };
          break;
        case EventType.CARE_APPOINTMENT_BOOKED:
          payload = {
            providerId: uuidv4(),
            specialtyId: uuidv4(),
            appointmentDate: new Date(Date.now() + 86400000 * (i + 1)),
            appointmentType: 'IN_PERSON',
            notes: 'Test appointment notes'
          };
          break;
        case EventType.CARE_MEDICATION_TAKEN:
          payload = {
            medicationId: uuidv4(),
            dosage: '10mg',
            takenAt: new Date(),
            scheduled: true
          };
          break;
        case EventType.PLAN_CLAIM_SUBMITTED:
          payload = {
            claimType: 'MEDICAL',
            providerId: uuidv4(),
            serviceDate: new Date(Date.now() - 86400000 * i),
            amount: 150.0 + i * 10,
            currency: 'BRL',
            receiptId: uuidv4()
          };
          break;
        case EventType.PLAN_BENEFIT_USED:
          payload = {
            benefitId: uuidv4(),
            benefitType: 'DISCOUNT',
            usedAt: new Date(),
            value: 50.0 + i * 5,
            provider: 'Pharmacy XYZ'
          };
          break;
      }
      
      await this.prismaClient.event.create({
        data: {
          id: uuidv4(),
          userId: users[userIndex].id,
          type: eventType,
          journey,
          payload,
          processed: false,
          createdAt: new Date(Date.now() - i * 3600000),
          updatedAt: new Date(Date.now() - i * 3600000)
        }
      });
    }
  }
  
  /**
   * Seed the database with test achievements
   * @param count Number of test achievements to create
   */
  private async seedTestAchievements(count: number): Promise<void> {
    const journeys = ['health', 'care', 'plan'];
    const achievementTypes = [
      'health-check-streak',
      'steps-goal',
      'appointment-keeper',
      'medication-adherence',
      'claim-master'
    ];
    
    const users = await this.seedTestUsers(3);
    
    for (let i = 0; i < count; i++) {
      const userIndex = i % users.length;
      const journeyIndex = i % journeys.length;
      const achievementTypeIndex = i % achievementTypes.length;
      
      const journey = journeys[journeyIndex];
      const achievementType = achievementTypes[achievementTypeIndex];
      
      await this.prismaClient.achievement.create({
        data: {
          id: uuidv4(),
          userId: users[userIndex].id,
          type: achievementType,
          journey,
          level: 1 + (i % 3),
          unlockedAt: new Date(Date.now() - i * 86400000),
          progress: 100,
          xpAwarded: 50 * (1 + (i % 3)),
          createdAt: new Date(Date.now() - i * 86400000 * 2),
          updatedAt: new Date(Date.now() - i * 86400000)
        }
      });
    }
  }
  
  /**
   * Seed the database with test profiles
   * @param count Number of test profiles to create
   */
  private async seedTestProfiles(count: number): Promise<void> {
    const users = await this.seedTestUsers(count);
    
    for (let i = 0; i < users.length; i++) {
      await this.prismaClient.profile.create({
        data: {
          id: uuidv4(),
          userId: users[i].id,
          xp: 100 * (i + 1),
          level: 1 + Math.floor(i / 2),
          achievements: i * 2,
          createdAt: new Date(Date.now() - i * 86400000 * 7),
          updatedAt: new Date(Date.now() - i * 3600000)
        }
      });
    }
  }
  
  /**
   * Create a test event with the specified properties
   * @param eventData Event data to create
   */
  public async createTestEvent(eventData: CreateTestEventOptions): Promise<any> {
    const { userId, type, journey, payload, processed = false } = eventData;
    
    return await this.prismaClient.event.create({
      data: {
        id: eventData.id || uuidv4(),
        userId,
        type,
        journey,
        payload,
        processed,
        createdAt: eventData.createdAt || new Date(),
        updatedAt: eventData.updatedAt || new Date()
      }
    });
  }
  
  /**
   * Create a test achievement with the specified properties
   * @param achievementData Achievement data to create
   */
  public async createTestAchievement(achievementData: CreateTestAchievementOptions): Promise<any> {
    const { userId, type, journey, level, progress, xpAwarded } = achievementData;
    
    return await this.prismaClient.achievement.create({
      data: {
        id: achievementData.id || uuidv4(),
        userId,
        type,
        journey,
        level,
        progress,
        xpAwarded,
        unlockedAt: achievementData.unlockedAt || new Date(),
        createdAt: achievementData.createdAt || new Date(),
        updatedAt: achievementData.updatedAt || new Date()
      }
    });
  }
  
  /**
   * Create a test profile with the specified properties
   * @param profileData Profile data to create
   */
  public async createTestProfile(profileData: CreateTestProfileOptions): Promise<any> {
    const { userId, xp, level, achievements } = profileData;
    
    return await this.prismaClient.profile.create({
      data: {
        id: profileData.id || uuidv4(),
        userId,
        xp,
        level,
        achievements,
        createdAt: profileData.createdAt || new Date(),
        updatedAt: profileData.updatedAt || new Date()
      }
    });
  }
  
  /**
   * Verify that an event exists in the database with the specified properties
   * @param eventData Event data to verify
   */
  public async verifyEventExists(eventData: VerifyEventOptions): Promise<boolean> {
    const events = await this.prismaClient.event.findMany({
      where: {
        userId: eventData.userId,
        type: eventData.type,
        journey: eventData.journey
      }
    });
    
    if (events.length === 0) return false;
    
    if (eventData.payload) {
      return events.some(event => {
        // Check if all payload properties match
        for (const key in eventData.payload) {
          if (event.payload[key] !== eventData.payload[key]) {
            return false;
          }
        }
        return true;
      });
    }
    
    return true;
  }
  
  /**
   * Verify that an achievement exists in the database with the specified properties
   * @param achievementData Achievement data to verify
   */
  public async verifyAchievementExists(achievementData: VerifyAchievementOptions): Promise<boolean> {
    const achievements = await this.prismaClient.achievement.findMany({
      where: {
        userId: achievementData.userId,
        type: achievementData.type,
        journey: achievementData.journey
      }
    });
    
    if (achievements.length === 0) return false;
    
    if (achievementData.level) {
      return achievements.some(achievement => achievement.level === achievementData.level);
    }
    
    return true;
  }
  
  /**
   * Verify that a profile exists in the database with the specified properties
   * @param profileData Profile data to verify
   */
  public async verifyProfileExists(profileData: VerifyProfileOptions): Promise<boolean> {
    const profile = await this.prismaClient.profile.findUnique({
      where: { userId: profileData.userId }
    });
    
    if (!profile) return false;
    
    if (profileData.xp && profile.xp !== profileData.xp) return false;
    if (profileData.level && profile.level !== profileData.level) return false;
    if (profileData.achievements && profile.achievements !== profileData.achievements) return false;
    
    return true;
  }
}

/**
 * Options for initializing the test database
 */
export interface InitializeDatabaseOptions {
  seedUsers?: boolean;
  seedEvents?: boolean;
  seedAchievements?: boolean;
  seedProfiles?: boolean;
  userCount?: number;
  eventCount?: number;
  achievementCount?: number;
  profileCount?: number;
}

/**
 * Options for creating a test event
 */
export interface CreateTestEventOptions {
  id?: string;
  userId: string;
  type: string;
  journey: string;
  payload: any;
  processed?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Options for creating a test achievement
 */
export interface CreateTestAchievementOptions {
  id?: string;
  userId: string;
  type: string;
  journey: string;
  level: number;
  progress: number;
  xpAwarded: number;
  unlockedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Options for creating a test profile
 */
export interface CreateTestProfileOptions {
  id?: string;
  userId: string;
  xp: number;
  level: number;
  achievements: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Options for verifying an event exists
 */
export interface VerifyEventOptions {
  userId: string;
  type: string;
  journey: string;
  payload?: any;
}

/**
 * Options for verifying an achievement exists
 */
export interface VerifyAchievementOptions {
  userId: string;
  type: string;
  journey: string;
  level?: number;
}

/**
 * Options for verifying a profile exists
 */
export interface VerifyProfileOptions {
  userId: string;
  xp?: number;
  level?: number;
  achievements?: number;
}