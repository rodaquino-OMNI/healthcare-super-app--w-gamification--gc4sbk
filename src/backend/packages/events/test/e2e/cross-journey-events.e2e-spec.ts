/**
 * @file cross-journey-events.e2e-spec.ts
 * @description End-to-end tests for cross-journey event processing, validating the integration
 * between different journey events and the gamification engine. This file tests multi-journey
 * achievement tracking, cross-journey event correlation, and end-to-end notification delivery.
 * It ensures proper event handling across journey boundaries and validates gamification event processing.
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  TestEnvironment,
  createTestUser,
  createTestHealthMetrics,
  createTestAppointment,
  createTestClaim,
  createTestEvent,
  assertEvent,
  waitForCondition,
} from './test-helpers';
import { EventType } from '../../src/dto/event-types.enum';

// Define journey types based on the application context
enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  GAMIFICATION = 'gamification',
  USER = 'user'
}

describe('Cross-Journey Events', () => {
  let testEnv: TestEnvironment;
  let prisma: PrismaClient;
  let userId: string;
  
  // Test timeout is extended for end-to-end tests
  jest.setTimeout(60000);
  
  beforeAll(async () => {
    // Set up test environment with Kafka and database connections
    testEnv = new TestEnvironment({
      testTimeout: 30000,
      maxRetries: 3,
    });
    
    await testEnv.setup();
    prisma = testEnv.getPrisma();
    
    // Create a test user for all tests
    const user = await createTestUser(prisma);
    userId = user.id;
  });
  
  afterAll(async () => {
    // Clean up test environment
    await testEnv.teardown();
  });
  
  beforeEach(() => {
    // Clear consumed messages before each test
    testEnv.clearConsumedMessages();
  });
  
  /**
   * Test multi-journey achievement tracking
   * 
   * This test verifies that achievements can be unlocked based on events from multiple journeys.
   * It simulates a user completing actions across health, care, and plan journeys, and validates
   * that a cross-journey achievement is unlocked when all conditions are met.
   */
  describe('Multi-Journey Achievement Tracking', () => {
    it('should unlock a cross-journey achievement when events from multiple journeys meet criteria', async () => {
      // Create test data for each journey
      const healthMetrics = await createTestHealthMetrics(prisma, userId, 3);
      const appointment = await createTestAppointment(prisma, userId);
      const claim = await createTestClaim(prisma, userId);
      
      // Publish health journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_METRIC_RECORDED,
          JourneyType.HEALTH,
          userId,
          {
            metricType: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'manual'
          }
        ),
        'health-events'
      );
      
      // Publish care journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_APPOINTMENT_COMPLETED,
          JourneyType.CARE,
          userId,
          {
            appointmentId: appointment.id,
            providerId: appointment.providerId,
            appointmentType: 'in_person',
            scheduledAt: appointment.scheduledAt.toISOString(),
            completedAt: new Date().toISOString(),
            duration: 30
          }
        ),
        'care-events'
      );
      
      // Publish plan journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.PLAN_CLAIM_SUBMITTED,
          JourneyType.PLAN,
          userId,
          {
            claimId: claim.id,
            claimType: 'medical',
            providerId: appointment.providerId,
            serviceDate: new Date().toISOString(),
            amount: claim.amount,
            submittedAt: new Date().toISOString()
          }
        ),
        'plan-events'
      );
      
      // Wait for achievement unlocked event
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.type).toBe(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED);
      expect(achievementEvent.journey).toBe(JourneyType.GAMIFICATION);
      expect(achievementEvent.userId).toBe(userId);
      expect(achievementEvent.data).toHaveProperty('achievementId');
      expect(achievementEvent.data).toHaveProperty('achievementType');
      
      // Verify the achievement in the database
      const userAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementTypeId: achievementEvent.data.achievementId,
        },
      });
      
      expect(userAchievement).not.toBeNull();
      expect(userAchievement.unlockedAt).toBeDefined();
    });
    
    it('should track progress across multiple journeys for tiered achievements', async () => {
      // Create test data
      const healthMetrics = await createTestHealthMetrics(prisma, userId, 2);
      const appointment = await createTestAppointment(prisma, userId);
      
      // Publish first journey event (health)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_GOAL_ACHIEVED,
          JourneyType.HEALTH,
          userId,
          {
            goalId: uuidv4(),
            goalType: 'steps',
            targetValue: 10000,
            achievedValue: 10500,
            completedAt: new Date().toISOString()
          }
        ),
        'health-events'
      );
      
      // Wait for points earned event
      const pointsEvent1 = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId
      );
      
      // Publish second journey event (care)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_MEDICATION_TAKEN,
          JourneyType.CARE,
          userId,
          {
            medicationId: uuidv4(),
            medicationName: 'Test Medication',
            dosage: '10mg',
            takenAt: new Date().toISOString(),
            adherence: 'on_time'
          }
        ),
        'care-events'
      );
      
      // Wait for points earned event
      const pointsEvent2 = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId
      );
      
      // Clear messages to prepare for next test
      testEnv.clearConsumedMessages();
      
      // Publish third journey event (plan)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.PLAN_BENEFIT_UTILIZED,
          JourneyType.PLAN,
          userId,
          {
            benefitId: uuidv4(),
            benefitType: 'wellness',
            utilizationDate: new Date().toISOString(),
            savingsAmount: 100
          }
        ),
        'plan-events'
      );
      
      // Wait for achievement unlocked event (bronze tier)
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.data).toHaveProperty('tier', 'bronze');
      
      // Verify the achievement in the database
      const userAchievement = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementTypeId: achievementEvent.data.achievementId,
        },
        orderBy: {
          unlockedAt: 'desc',
        },
      });
      
      expect(userAchievement).not.toBeNull();
      expect(userAchievement.tier).toBe(1); // Bronze tier
    });
  });
  
  /**
   * Test cross-journey event correlation
   * 
   * This test verifies that events from different journeys can be correlated using
   * correlation IDs and other metadata. It simulates a user flow that spans multiple
   * journeys and validates that events are properly linked.
   */
  describe('Cross-Journey Event Correlation', () => {
    it('should correlate events across journeys using correlation IDs', async () => {
      // Generate a correlation ID for this test flow
      const correlationId = uuidv4();
      
      // Create test data
      const appointment = await createTestAppointment(prisma, userId);
      
      // Publish care journey event with correlation ID
      await testEnv.publishEvent(
        {
          type: EventType.CARE_APPOINTMENT_BOOKED,
          journey: JourneyType.CARE,
          userId,
          data: {
            appointmentId: appointment.id,
            providerId: appointment.providerId,
            specialtyType: 'Cardiologia',
            appointmentType: 'in_person',
            scheduledAt: appointment.scheduledAt.toISOString(),
            bookedAt: new Date().toISOString()
          },
          metadata: {
            correlationId,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'e2e-test'
          }
        },
        'care-events'
      );
      
      // Publish health journey event with same correlation ID
      await testEnv.publishEvent(
        {
          type: EventType.HEALTH_ASSESSMENT_COMPLETED,
          journey: JourneyType.HEALTH,
          userId,
          data: {
            assessmentId: uuidv4(),
            assessmentType: 'pre_appointment',
            score: 85,
            completedAt: new Date().toISOString(),
            duration: 300
          },
          metadata: {
            correlationId, // Same correlation ID
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'e2e-test'
          }
        },
        'health-events'
      );
      
      // Wait for points earned events
      const pointsEvents = [];
      for (let i = 0; i < 2; i++) {
        const event = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
        if (event) pointsEvents.push(event);
      }
      
      // Assert that both events were processed and correlated
      expect(pointsEvents.length).toBe(2);
      
      // Check that both events have the same correlation ID
      const allHaveSameCorrelationId = pointsEvents.every(
        event => event.metadata?.correlationId === correlationId
      );
      
      expect(allHaveSameCorrelationId).toBe(true);
      
      // Verify that the events are linked in the database
      const eventRecords = await prisma.eventLog.findMany({
        where: {
          correlationId,
        },
      });
      
      expect(eventRecords.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should track a complete user journey across multiple services', async () => {
      // Generate a correlation ID for this test flow
      const correlationId = uuidv4();
      const sessionId = uuidv4();
      
      // Create test data
      const claim = await createTestClaim(prisma, userId);
      
      // Step 1: User logs in (user journey)
      await testEnv.publishEvent(
        {
          type: EventType.USER_LOGIN,
          journey: JourneyType.USER,
          userId,
          data: {
            loginMethod: 'password',
            deviceType: 'mobile',
            loginAt: new Date().toISOString()
          },
          metadata: {
            correlationId,
            sessionId,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'e2e-test'
          }
        },
        'user-events'
      );
      
      // Step 2: User checks health metrics (health journey)
      await testEnv.publishEvent(
        {
          type: EventType.HEALTH_METRIC_RECORDED,
          journey: JourneyType.HEALTH,
          userId,
          data: {
            metricType: 'BLOOD_PRESSURE',
            value: 120,
            unit: 'mmHg',
            timestamp: new Date().toISOString(),
            source: 'manual'
          },
          metadata: {
            correlationId,
            sessionId,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'e2e-test'
          }
        },
        'health-events'
      );
      
      // Step 3: User submits a claim (plan journey)
      await testEnv.publishEvent(
        {
          type: EventType.PLAN_CLAIM_SUBMITTED,
          journey: JourneyType.PLAN,
          userId,
          data: {
            claimId: claim.id,
            claimType: 'medical',
            providerId: uuidv4(),
            serviceDate: new Date().toISOString(),
            amount: claim.amount,
            submittedAt: new Date().toISOString()
          },
          metadata: {
            correlationId,
            sessionId,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            source: 'e2e-test'
          }
        },
        'plan-events'
      );
      
      // Wait for achievement unlocked event
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.metadata?.correlationId).toBe(correlationId);
      expect(achievementEvent.metadata?.sessionId).toBe(sessionId);
      
      // Verify the user journey in the database
      const userJourney = await prisma.userJourney.findFirst({
        where: {
          userId,
          sessionId,
        },
        include: {
          steps: true,
        },
      });
      
      expect(userJourney).not.toBeNull();
      expect(userJourney.steps.length).toBeGreaterThanOrEqual(3);
      
      // Verify that steps from all journeys are included
      const journeys = userJourney.steps.map(step => step.journey);
      expect(journeys).toContain('user');
      expect(journeys).toContain('health');
      expect(journeys).toContain('plan');
    });
  });
  
  /**
   * Test notification delivery for achievements
   * 
   * This test verifies that notifications are delivered when achievements are unlocked
   * based on events from multiple journeys. It simulates a user completing actions that
   * trigger an achievement and validates that a notification is sent.
   */
  describe('Achievement Notification Delivery', () => {
    it('should deliver notifications when cross-journey achievements are unlocked', async () => {
      // Create test data
      const healthMetrics = await createTestHealthMetrics(prisma, userId, 1);
      
      // Publish health journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_GOAL_ACHIEVED,
          JourneyType.HEALTH,
          userId,
          {
            goalId: uuidv4(),
            goalType: 'steps',
            targetValue: 10000,
            achievedValue: 12000,
            completedAt: new Date().toISOString()
          }
        ),
        'health-events'
      );
      
      // Wait for achievement unlocked event
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      
      // Wait for notification to be created in the database
      let notification = null;
      await waitForCondition(async () => {
        notification = await prisma.notification.findFirst({
          where: {
            userId,
            type: 'ACHIEVEMENT_UNLOCKED',
            relatedId: achievementEvent.data.achievementId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        return !!notification;
      });
      
      // Assert that the notification was created
      expect(notification).not.toBeNull();
      expect(notification.title).toContain('Achievement');
      expect(notification.status).toBe('PENDING');
      
      // Wait for notification to be marked as sent
      await waitForCondition(async () => {
        const updatedNotification = await prisma.notification.findUnique({
          where: {
            id: notification.id,
          },
        });
        
        return updatedNotification.status === 'SENT';
      });
      
      // Verify notification delivery status
      const finalNotification = await prisma.notification.findUnique({
        where: {
          id: notification.id,
        },
      });
      
      expect(finalNotification.status).toBe('SENT');
      expect(finalNotification.sentAt).not.toBeNull();
    });
    
    it('should include journey context in achievement notifications', async () => {
      // Create test data
      const appointment = await createTestAppointment(prisma, userId);
      
      // Publish care journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_APPOINTMENT_COMPLETED,
          JourneyType.CARE,
          userId,
          {
            appointmentId: appointment.id,
            providerId: appointment.providerId,
            appointmentType: 'in_person',
            scheduledAt: appointment.scheduledAt.toISOString(),
            completedAt: new Date().toISOString(),
            duration: 30
          }
        ),
        'care-events'
      );
      
      // Wait for achievement unlocked event
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      
      // Wait for notification to be created
      let notification = null;
      await waitForCondition(async () => {
        notification = await prisma.notification.findFirst({
          where: {
            userId,
            type: 'ACHIEVEMENT_UNLOCKED',
            relatedId: achievementEvent.data.achievementId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        
        return !!notification;
      });
      
      // Assert that the notification includes journey context
      expect(notification).not.toBeNull();
      expect(notification.metadata).toBeDefined();
      
      const metadata = JSON.parse(notification.metadata);
      expect(metadata).toHaveProperty('journeyContext');
      expect(metadata.journeyContext).toHaveProperty('originJourney', 'care');
      expect(metadata.journeyContext).toHaveProperty('achievementJourney', 'gamification');
    });
  });
  
  /**
   * Test leaderboard updates based on cross-journey events
   * 
   * This test verifies that leaderboards are updated based on events from multiple journeys.
   * It simulates users earning points from different journeys and validates that the
   * leaderboard reflects the combined points.
   */
  describe('Leaderboard Updates', () => {
    it('should update leaderboards based on points from multiple journeys', async () => {
      // Create additional test users for leaderboard
      const user2 = await createTestUser(prisma);
      const user3 = await createTestUser(prisma);
      
      // Publish events for first user (health journey)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_METRIC_RECORDED,
          JourneyType.HEALTH,
          userId,
          {
            metricType: 'STEPS',
            value: 15000,
            unit: 'steps',
            timestamp: new Date().toISOString(),
            source: 'device'
          }
        ),
        'health-events'
      );
      
      // Publish events for second user (care journey)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_MEDICATION_TAKEN,
          JourneyType.CARE,
          user2.id,
          {
            medicationId: uuidv4(),
            medicationName: 'Test Medication',
            dosage: '10mg',
            takenAt: new Date().toISOString(),
            adherence: 'on_time'
          }
        ),
        'care-events'
      );
      
      // Publish events for third user (plan journey)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.PLAN_BENEFIT_UTILIZED,
          JourneyType.PLAN,
          user3.id,
          {
            benefitId: uuidv4(),
            benefitType: 'wellness',
            utilizationDate: new Date().toISOString(),
            savingsAmount: 50
          }
        ),
        'plan-events'
      );
      
      // Wait for points to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify leaderboard in the database
      const leaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: 'GLOBAL',
        },
        include: {
          entries: {
            orderBy: {
              score: 'desc',
            },
            take: 10,
          },
        },
      });
      
      expect(leaderboard).not.toBeNull();
      expect(leaderboard.entries.length).toBeGreaterThanOrEqual(3);
      
      // Get user scores
      const userScores = {};
      leaderboard.entries.forEach(entry => {
        userScores[entry.userId] = entry.score;
      });
      
      // Verify that all users have points
      expect(userScores[userId]).toBeGreaterThan(0);
      expect(userScores[user2.id]).toBeGreaterThan(0);
      expect(userScores[user3.id]).toBeGreaterThan(0);
      
      // Publish additional events for first user (care journey)
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_APPOINTMENT_COMPLETED,
          JourneyType.CARE,
          userId,
          {
            appointmentId: uuidv4(),
            providerId: uuidv4(),
            appointmentType: 'telemedicine',
            scheduledAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            duration: 15
          }
        ),
        'care-events'
      );
      
      // Wait for points to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify updated leaderboard
      const updatedLeaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: 'GLOBAL',
        },
        include: {
          entries: {
            orderBy: {
              score: 'desc',
            },
            take: 10,
          },
        },
      });
      
      // Get updated user scores
      const updatedUserScores = {};
      updatedLeaderboard.entries.forEach(entry => {
        updatedUserScores[entry.userId] = entry.score;
      });
      
      // Verify that first user's score increased
      expect(updatedUserScores[userId]).toBeGreaterThan(userScores[userId]);
    });
    
    it('should maintain journey-specific leaderboards alongside global leaderboard', async () => {
      // Create additional test users
      const user2 = await createTestUser(prisma);
      
      // Publish health journey event for first user
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_GOAL_ACHIEVED,
          JourneyType.HEALTH,
          userId,
          {
            goalId: uuidv4(),
            goalType: 'weight_loss',
            targetValue: 5,
            achievedValue: 5.2,
            completedAt: new Date().toISOString()
          }
        ),
        'health-events'
      );
      
      // Publish care journey event for second user
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_TELEMEDICINE_COMPLETED,
          JourneyType.CARE,
          user2.id,
          {
            sessionId: uuidv4(),
            appointmentId: uuidv4(),
            providerId: uuidv4(),
            startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            endedAt: new Date().toISOString(),
            duration: 30,
            quality: 'good'
          }
        ),
        'care-events'
      );
      
      // Wait for points to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify global leaderboard
      const globalLeaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: 'GLOBAL',
        },
        include: {
          entries: {
            orderBy: {
              score: 'desc',
            },
          },
        },
      });
      
      expect(globalLeaderboard).not.toBeNull();
      
      // Verify health journey leaderboard
      const healthLeaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: 'JOURNEY',
          journeyType: 'health',
        },
        include: {
          entries: {
            orderBy: {
              score: 'desc',
            },
          },
        },
      });
      
      expect(healthLeaderboard).not.toBeNull();
      expect(healthLeaderboard.entries.some(entry => entry.userId === userId)).toBe(true);
      
      // Verify care journey leaderboard
      const careLeaderboard = await prisma.leaderboard.findFirst({
        where: {
          type: 'JOURNEY',
          journeyType: 'care',
        },
        include: {
          entries: {
            orderBy: {
              score: 'desc',
            },
          },
        },
      });
      
      expect(careLeaderboard).not.toBeNull();
      expect(careLeaderboard.entries.some(entry => entry.userId === user2.id)).toBe(true);
    });
  });
  
  /**
   * Test user profile updates from multiple journey events
   * 
   * This test verifies that user profiles are updated based on events from multiple journeys.
   * It simulates a user completing actions across different journeys and validates that
   * the user profile reflects the combined activity.
   */
  describe('User Profile Updates', () => {
    it('should update user profile with achievements from multiple journeys', async () => {
      // Create test data
      const healthMetrics = await createTestHealthMetrics(prisma, userId, 1);
      const appointment = await createTestAppointment(prisma, userId);
      
      // Publish health journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.HEALTH_GOAL_ACHIEVED,
          JourneyType.HEALTH,
          userId,
          {
            goalId: uuidv4(),
            goalType: 'steps',
            targetValue: 10000,
            achievedValue: 12000,
            completedAt: new Date().toISOString()
          }
        ),
        'health-events'
      );
      
      // Publish care journey event
      await testEnv.publishEvent(
        createTestEvent(
          EventType.CARE_APPOINTMENT_COMPLETED,
          JourneyType.CARE,
          userId,
          {
            appointmentId: appointment.id,
            providerId: appointment.providerId,
            appointmentType: 'in_person',
            scheduledAt: appointment.scheduledAt.toISOString(),
            completedAt: new Date().toISOString(),
            duration: 30
          }
        ),
        'care-events'
      );
      
      // Wait for achievements to be processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verify user profile in the database
      const userProfile = await prisma.userProfile.findUnique({
        where: {
          userId,
        },
        include: {
          achievements: true,
        },
      });
      
      expect(userProfile).not.toBeNull();
      expect(userProfile.achievements.length).toBeGreaterThanOrEqual(2);
      
      // Verify that achievements from both journeys are included
      const journeys = userProfile.achievements.map(achievement => {
        return achievement.achievementType.journey;
      });
      
      expect(journeys).toContain('health');
      expect(journeys).toContain('care');
    });
    
    it('should update user level based on points from multiple journeys', async () => {
      // Get initial user level
      const initialUserProfile = await prisma.userProfile.findUnique({
        where: {
          userId,
        },
      });
      
      const initialLevel = initialUserProfile.level;
      
      // Publish multiple events to earn enough points for level up
      for (let i = 0; i < 5; i++) {
        // Health journey event
        await testEnv.publishEvent(
          createTestEvent(
            EventType.HEALTH_METRIC_RECORDED,
            JourneyType.HEALTH,
            userId,
            {
              metricType: 'STEPS',
              value: 8000 + i * 1000,
              unit: 'steps',
              timestamp: new Date(Date.now() + i * 3600000).toISOString(), // Each hour
              source: 'device'
            }
          ),
          'health-events'
        );
        
        // Care journey event
        await testEnv.publishEvent(
          createTestEvent(
            EventType.CARE_MEDICATION_TAKEN,
            JourneyType.CARE,
            userId,
            {
              medicationId: uuidv4(),
              medicationName: `Medication ${i}`,
              dosage: '10mg',
              takenAt: new Date(Date.now() + i * 3600000).toISOString(), // Each hour
              adherence: 'on_time'
            }
          ),
          'care-events'
        );
      }
      
      // Wait for level up event
      const levelUpEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_LEVEL_UP,
        userId
      );
      
      // Assert that level up occurred
      expect(levelUpEvent).not.toBeNull();
      expect(levelUpEvent.data.previousLevel).toBe(initialLevel);
      expect(levelUpEvent.data.newLevel).toBeGreaterThan(initialLevel);
      
      // Verify updated user profile
      const updatedUserProfile = await prisma.userProfile.findUnique({
        where: {
          userId,
        },
      });
      
      expect(updatedUserProfile.level).toBeGreaterThan(initialLevel);
    });
  });
});