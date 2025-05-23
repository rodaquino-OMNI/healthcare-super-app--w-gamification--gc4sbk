/**
 * @file cross-journey-events.e2e-spec.ts
 * @description End-to-end tests for cross-journey event processing, validating the integration
 * between different journey events and the gamification engine. This file tests multi-journey
 * achievement tracking, cross-journey event correlation, and end-to-end notification delivery.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '@austa/database';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { EventsModule } from '../../src/events.module';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import {
  createTestEnvironment,
  createTestConsumer,
  publishTestEvent,
  waitForEvent,
  waitForEvents,
  createJourneyEventFactories,
  TestEnvironment,
  waitForCondition,
  retry
} from './test-helpers';

// Test timeout configuration
const TEST_TIMEOUT = 30000;

/**
 * Helper function to create a user for testing
 */
async function createTestUser(prisma: PrismaClient) {
  const userId = randomUUID();
  await prisma.user.create({
    data: {
      id: userId,
      name: 'Test User',
      email: `test-${userId.substring(0, 8)}@example.com`,
      password: 'password123',
      phone: '+5511999999999',
      cpf: '12345678901',
    },
  });
  
  // Create a gamification profile for the user
  await prisma.gamificationProfile.create({
    data: {
      userId,
      level: 1,
      points: 0,
      totalPoints: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  
  return userId;
}

/**
 * Helper function to create a cross-journey achievement
 */
async function createCrossJourneyAchievement(prisma: PrismaClient, name: string, journeys: JourneyType[]) {
  const achievementId = randomUUID();
  await prisma.achievementType.create({
    data: {
      id: achievementId,
      name,
      title: `Cross Journey Achievement: ${name}`,
      description: `Achievement that spans multiple journeys: ${journeys.join(', ')}`,
      journey: 'cross-journey',
      icon: 'star',
      levels: 3,
      isActive: true,
      requiredJourneys: journeys,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  
  return achievementId;
}

/**
 * Helper function to create achievement rules for cross-journey achievements
 */
async function createCrossJourneyAchievementRule(
  prisma: PrismaClient,
  achievementTypeId: string,
  eventTypes: string[],
  requiredCount: number = 1,
  timeframeHours: number = 24
) {
  const ruleId = randomUUID();
  await prisma.achievementRule.create({
    data: {
      id: ruleId,
      achievementTypeId,
      eventTypes,
      requiredCount,
      timeframeHours,
      isSequential: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  
  return ruleId;
}

describe('Cross-Journey Events (E2E)', () => {
  let testEnv: TestEnvironment;
  let prisma: PrismaClient;
  let userId: string;
  let eventFactories: ReturnType<typeof createJourneyEventFactories>;
  
  // Setup before all tests
  beforeAll(async () => {
    // Create test environment
    testEnv = await createTestEnvironment({
      useRealKafka: true,
      seedDatabase: true,
      assertionTimeout: 10000,
    });
    
    // Get services
    prisma = new PrismaClient();
    
    // Create test user
    userId = await createTestUser(prisma);
    
    // Create event factories
    eventFactories = createJourneyEventFactories();
    
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, TEST_TIMEOUT);
  
  // Cleanup after all tests
  afterAll(async () => {
    // Clean up test environment
    await testEnv.cleanup();
    
    // Close Prisma connection
    await prisma.$disconnect();
  });
  
  describe('Multi-Journey Achievement Tracking', () => {
    let healthCareAchievementId: string;
    let healthCareRuleId: string;
    let achievementConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a cross-journey achievement that requires events from Health and Care journeys
      healthCareAchievementId = await createCrossJourneyAchievement(
        prisma,
        'health-care-synergy',
        [JourneyType.HEALTH, JourneyType.CARE]
      );
      
      // Create a rule that requires one health metric recorded and one appointment completed
      healthCareRuleId = await createCrossJourneyAchievementRule(
        prisma,
        healthCareAchievementId,
        ['health.metric.recorded', 'care.appointment.completed'],
        1, // One of each event type
        24 // Within 24 hours
      );
      
      // Create a consumer for achievement events
      achievementConsumer = await createTestConsumer(
        testEnv.kafkaService,
        'gamification.achievements',
        `test-achievement-consumer-${randomUUID()}`
      );
    });
    
    afterAll(async () => {
      // Disconnect consumer
      await achievementConsumer.disconnect();
    });
    
    it('should trigger achievement when events from multiple journeys occur', async () => {
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create health metric recorded event
      const healthEvent = eventFactories.health.metricRecorded({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      });
      
      // Create care appointment completed event
      const careEvent = eventFactories.care.appointmentBooked({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
        },
      });
      
      // Publish health event
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      
      // Publish care event
      await publishTestEvent(testEnv.kafkaProducer, 'care.events', careEvent);
      
      // Wait for achievement unlocked event
      const achievementEvent = await waitForEvent(
        achievementConsumer,
        (event: BaseEvent) => {
          return (
            event.type === 'gamification.achievement.unlocked' &&
            event.payload.achievementTypeId === healthCareAchievementId &&
            event.userId === userId
          );
        },
        10000
      );
      
      // Verify achievement event
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent?.payload.achievementTypeId).toBe(healthCareAchievementId);
      expect(achievementEvent?.userId).toBe(userId);
      expect(achievementEvent?.metadata?.correlationId).toBeDefined();
      
      // Verify achievement was recorded in database
      const achievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementTypeId: healthCareAchievementId,
        },
      });
      
      expect(achievement).not.toBeNull();
      expect(achievement?.level).toBe(1);
      expect(achievement?.unlockedAt).toBeDefined();
    }, TEST_TIMEOUT);
    
    it('should not trigger achievement when events are outside the timeframe', async () => {
      // Create a new user for this test
      const newUserId = await createTestUser(prisma);
      
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create health metric recorded event with timestamp 25 hours ago
      const pastDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      const healthEvent = eventFactories.health.metricRecorded({
        userId: newUserId,
        metadata: { correlationId },
        timestamp: pastDate,
        payload: {
          userId: newUserId,
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: pastDate,
          source: 'manual',
        },
      });
      
      // Create care appointment completed event with current timestamp
      const careEvent = eventFactories.care.appointmentBooked({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
        },
      });
      
      // Publish health event
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      
      // Publish care event
      await publishTestEvent(testEnv.kafkaProducer, 'care.events', careEvent);
      
      // Wait a few seconds to ensure events are processed
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Verify achievement was NOT recorded in database
      const achievement = await prisma.userAchievement.findFirst({
        where: {
          userId: newUserId,
          achievementTypeId: healthCareAchievementId,
        },
      });
      
      expect(achievement).toBeNull();
    }, TEST_TIMEOUT);
  });
  
  describe('Cross-Journey Event Correlation', () => {
    let correlationConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer for correlated events
      correlationConsumer = await createTestConsumer(
        testEnv.kafkaService,
        'event.correlations',
        `test-correlation-consumer-${randomUUID()}`
      );
    });
    
    afterAll(async () => {
      // Disconnect consumer
      await correlationConsumer.disconnect();
    });
    
    it('should correlate events across different journeys', async () => {
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create events from all three journeys with the same correlation ID
      const healthEvent = eventFactories.health.metricRecorded({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          metricType: 'BLOOD_PRESSURE',
          value: 120,
          unit: 'mmHg',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      });
      
      const careEvent = eventFactories.care.medicationTaken({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          medicationId: randomUUID(),
          scheduledAt: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          dosage: '10mg',
        },
      });
      
      const planEvent = eventFactories.plan.benefitUtilized({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          benefitId: randomUUID(),
          utilizedAt: new Date().toISOString(),
          value: 50.0,
          currency: 'BRL',
        },
      });
      
      // Publish all events
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      await publishTestEvent(testEnv.kafkaProducer, 'care.events', careEvent);
      await publishTestEvent(testEnv.kafkaProducer, 'plan.events', planEvent);
      
      // Wait for correlation event that contains references to all three events
      const correlationEvent = await waitForEvent(
        correlationConsumer,
        (event: BaseEvent) => {
          return (
            event.type === 'event.correlation.created' &&
            event.metadata?.correlationId === correlationId &&
            event.payload.eventCount >= 3
          );
        },
        10000
      );
      
      // Verify correlation event
      expect(correlationEvent).not.toBeNull();
      expect(correlationEvent?.metadata?.correlationId).toBe(correlationId);
      expect(correlationEvent?.payload.eventCount).toBeGreaterThanOrEqual(3);
      expect(correlationEvent?.payload.journeys).toContain(JourneyType.HEALTH);
      expect(correlationEvent?.payload.journeys).toContain(JourneyType.CARE);
      expect(correlationEvent?.payload.journeys).toContain(JourneyType.PLAN);
      expect(correlationEvent?.payload.eventIds).toContain(healthEvent.eventId);
      expect(correlationEvent?.payload.eventIds).toContain(careEvent.eventId);
      expect(correlationEvent?.payload.eventIds).toContain(planEvent.eventId);
    }, TEST_TIMEOUT);
  });
  
  describe('Achievement Notification Delivery', () => {
    let healthPlanAchievementId: string;
    let healthPlanRuleId: string;
    let notificationConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a cross-journey achievement that requires events from Health and Plan journeys
      healthPlanAchievementId = await createCrossJourneyAchievement(
        prisma,
        'health-plan-integration',
        [JourneyType.HEALTH, JourneyType.PLAN]
      );
      
      // Create a rule that requires one health goal achieved and one claim submitted
      healthPlanRuleId = await createCrossJourneyAchievementRule(
        prisma,
        healthPlanAchievementId,
        ['health.goal.achieved', 'plan.claim.submitted'],
        1, // One of each event type
        24 // Within 24 hours
      );
      
      // Create a consumer for notification events
      notificationConsumer = await createTestConsumer(
        testEnv.kafkaService,
        'notifications.outbound',
        `test-notification-consumer-${randomUUID()}`
      );
    });
    
    afterAll(async () => {
      // Disconnect consumer
      await notificationConsumer.disconnect();
    });
    
    it('should deliver notifications when cross-journey achievement is unlocked', async () => {
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create health goal achieved event
      const healthEvent = eventFactories.health.goalAchieved({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          goalId: randomUUID(),
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          achievedAt: new Date().toISOString(),
        },
      });
      
      // Create plan claim submitted event
      const planEvent = eventFactories.plan.claimSubmitted({
        userId,
        metadata: { correlationId },
        payload: {
          userId,
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      });
      
      // Publish health event
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      
      // Publish plan event
      await publishTestEvent(testEnv.kafkaProducer, 'plan.events', planEvent);
      
      // Wait for notification event
      const notificationEvent = await waitForEvent(
        notificationConsumer,
        (event: BaseEvent) => {
          return (
            event.type === 'notification.achievement.unlocked' &&
            event.userId === userId &&
            event.payload.achievementTypeId === healthPlanAchievementId
          );
        },
        10000
      );
      
      // Verify notification event
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent?.userId).toBe(userId);
      expect(notificationEvent?.payload.achievementTypeId).toBe(healthPlanAchievementId);
      expect(notificationEvent?.payload.achievementTitle).toBeDefined();
      expect(notificationEvent?.payload.level).toBe(1);
      expect(notificationEvent?.payload.points).toBeGreaterThan(0);
      expect(notificationEvent?.metadata?.correlationId).toBeDefined();
      
      // Verify notification was recorded in database
      const notification = await prisma.notification.findFirst({
        where: {
          userId,
          type: 'ACHIEVEMENT_UNLOCKED',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      expect(notification).not.toBeNull();
      expect(notification?.read).toBe(false);
      expect(notification?.data).toContain(healthPlanAchievementId);
    }, TEST_TIMEOUT);
  });
  
  describe('Leaderboard Updates', () => {
    let leaderboardConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer for leaderboard events
      leaderboardConsumer = await createTestConsumer(
        testEnv.kafkaService,
        'gamification.leaderboards',
        `test-leaderboard-consumer-${randomUUID()}`
      );
      
      // Create a global leaderboard if it doesn't exist
      const existingLeaderboard = await prisma.leaderboard.findFirst({
        where: { type: 'GLOBAL' },
      });
      
      if (!existingLeaderboard) {
        await prisma.leaderboard.create({
          data: {
            id: randomUUID(),
            name: 'Global Leaderboard',
            type: 'GLOBAL',
            description: 'Global leaderboard for all users',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    });
    
    afterAll(async () => {
      // Disconnect consumer
      await leaderboardConsumer.disconnect();
    });
    
    it('should update leaderboards when cross-journey events occur', async () => {
      // Create a new user for this test
      const newUserId = await createTestUser(prisma);
      
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create events from all three journeys with the same correlation ID
      const healthEvent = eventFactories.health.metricRecorded({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          metricType: 'STEPS',
          value: 8000,
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      });
      
      const careEvent = eventFactories.care.appointmentBooked({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          appointmentId: randomUUID(),
          providerId: randomUUID(),
          specialtyId: randomUUID(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          bookedAt: new Date().toISOString(),
        },
      });
      
      // Publish events
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      await publishTestEvent(testEnv.kafkaProducer, 'care.events', careEvent);
      
      // Wait for leaderboard update event
      const leaderboardEvent = await waitForEvent(
        leaderboardConsumer,
        (event: BaseEvent) => {
          return (
            event.type === 'gamification.leaderboard.updated' &&
            event.payload.userId === newUserId
          );
        },
        10000
      );
      
      // Verify leaderboard event
      expect(leaderboardEvent).not.toBeNull();
      expect(leaderboardEvent?.payload.userId).toBe(newUserId);
      expect(leaderboardEvent?.payload.pointsAdded).toBeGreaterThan(0);
      expect(leaderboardEvent?.payload.leaderboardType).toBe('GLOBAL');
      
      // Verify leaderboard entry in database
      const leaderboardEntry = await prisma.leaderboardEntry.findFirst({
        where: {
          userId: newUserId,
          leaderboard: {
            type: 'GLOBAL',
          },
        },
      });
      
      expect(leaderboardEntry).not.toBeNull();
      expect(leaderboardEntry?.points).toBeGreaterThan(0);
    }, TEST_TIMEOUT);
  });
  
  describe('User Profile Updates', () => {
    it('should update user profile when events from multiple journeys occur', async () => {
      // Create a new user for this test
      const newUserId = await createTestUser(prisma);
      
      // Get initial profile
      const initialProfile = await prisma.gamificationProfile.findUnique({
        where: { userId: newUserId },
      });
      
      expect(initialProfile).not.toBeNull();
      expect(initialProfile?.points).toBe(0);
      expect(initialProfile?.level).toBe(1);
      
      // Create correlation ID to link events
      const correlationId = randomUUID();
      
      // Create events from all three journeys with the same correlation ID
      const healthEvent = eventFactories.health.metricRecorded({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          metricType: 'WEIGHT',
          value: 70,
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          source: 'manual',
        },
      });
      
      const careEvent = eventFactories.care.medicationTaken({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          medicationId: randomUUID(),
          scheduledAt: new Date().toISOString(),
          takenAt: new Date().toISOString(),
          dosage: '10mg',
        },
      });
      
      const planEvent = eventFactories.plan.claimSubmitted({
        userId: newUserId,
        metadata: { correlationId },
        payload: {
          userId: newUserId,
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: 'PENDING',
        },
      });
      
      // Publish all events
      await publishTestEvent(testEnv.kafkaProducer, 'health.events', healthEvent);
      await publishTestEvent(testEnv.kafkaProducer, 'care.events', careEvent);
      await publishTestEvent(testEnv.kafkaProducer, 'plan.events', planEvent);
      
      // Wait for profile to be updated
      await retry(async () => {
        const updatedProfile = await prisma.gamificationProfile.findUnique({
          where: { userId: newUserId },
        });
        
        if (!updatedProfile || updatedProfile.points <= initialProfile!.points) {
          throw new Error('Profile not updated yet');
        }
        
        return updatedProfile;
      }, 5, 2000);
      
      // Get final profile
      const finalProfile = await prisma.gamificationProfile.findUnique({
        where: { userId: newUserId },
      });
      
      expect(finalProfile).not.toBeNull();
      expect(finalProfile?.points).toBeGreaterThan(initialProfile!.points);
      expect(finalProfile?.totalPoints).toBeGreaterThan(initialProfile!.totalPoints);
      
      // Check for activity log entries
      const activityLogs = await prisma.userActivityLog.findMany({
        where: {
          userId: newUserId,
          createdAt: {
            gte: new Date(Date.now() - 60000), // Last minute
          },
        },
      });
      
      expect(activityLogs.length).toBeGreaterThanOrEqual(3); // At least one for each journey
      
      // Verify we have logs from each journey
      const journeys = activityLogs.map(log => log.journey);
      expect(journeys).toContain(JourneyType.HEALTH);
      expect(journeys).toContain(JourneyType.CARE);
      expect(journeys).toContain(JourneyType.PLAN);
    }, TEST_TIMEOUT);
  });
});