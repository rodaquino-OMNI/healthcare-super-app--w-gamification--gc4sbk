import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { setTimeout as sleep } from 'timers/promises';

// Import test helpers
import {
  createTestEnvironment,
  TestEnvironmentContext,
  publishTestEvent,
  waitForEvent,
  createTestEvent,
  TestDatabaseSeeder,
  waitForCondition,
} from './test-helpers';

// Import event interfaces and DTOs
import { IEvent } from '../../src/interfaces/base-event.interface';
import { EventTypes } from '../../src/dto/event-types.enum';
import { HealthMetricEventDto } from '../../src/dto/health-metric-event.dto';
import { AppointmentEventDto } from '../../src/dto/appointment-event.dto';
import { ClaimEventDto } from '../../src/dto/claim-event.dto';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';

// Import mock modules for testing
import { KafkaModule } from '../../src/kafka/kafka.module';
import { EventsModule } from '../../src/events.module';

describe('Cross-Journey Events (e2e)', () => {
  let context: TestEnvironmentContext;
  let app: INestApplication;
  let seeder: TestDatabaseSeeder;
  
  // Define test topics
  const HEALTH_EVENTS_TOPIC = 'health-events';
  const CARE_EVENTS_TOPIC = 'care-events';
  const PLAN_EVENTS_TOPIC = 'plan-events';
  const ACHIEVEMENT_EVENTS_TOPIC = 'achievement-events';
  const NOTIFICATION_EVENTS_TOPIC = 'notification-events';
  
  // Define test user
  const TEST_USER_ID = uuidv4();
  
  beforeAll(async () => {
    // Create test environment
    context = await createTestEnvironment({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        KafkaModule.forRoot({
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        }),
        EventsModule,
      ],
      topics: [
        HEALTH_EVENTS_TOPIC,
        CARE_EVENTS_TOPIC,
        PLAN_EVENTS_TOPIC,
        ACHIEVEMENT_EVENTS_TOPIC,
        NOTIFICATION_EVENTS_TOPIC,
      ],
      enableDatabase: true,
      enableKafka: true,
    });
    
    app = context.app;
    
    // Initialize database seeder
    if (context.prisma) {
      seeder = new TestDatabaseSeeder(context.prisma);
      
      // Clean database and seed test data
      await seeder.cleanDatabase();
      await seeder.seedTestUsers();
      await seeder.seedJourneyData('health');
      await seeder.seedJourneyData('care');
      await seeder.seedJourneyData('plan');
    }
  });
  
  afterAll(async () => {
    // Clean up test environment
    await context.cleanup();
  });
  
  describe('Multi-Journey Achievement Tracking', () => {
    it('should track achievements across multiple journeys', async () => {
      // Create health metric event
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.METRIC_RECORDED,
        {
          userId: TEST_USER_ID,
          metricType: 'STEPS',
          value: 10000,
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'test',
        }
      );
      
      // Create appointment event
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'COMPLETED',
          scheduledAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      
      // Wait for achievement event
      const achievementEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.ACHIEVEMENT_UNLOCKED &&
                 event.payload.userId === TEST_USER_ID;
        },
      });
      
      // Verify achievement event
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(achievementEvent?.payload.achievements).toHaveLength(1);
      expect(achievementEvent?.payload.achievements[0].journey).toBe('cross-journey');
    });
    
    it('should unlock cross-journey achievement when completing actions in all three journeys', async () => {
      // Create health metric event
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.METRIC_RECORDED,
        {
          userId: TEST_USER_ID,
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'test',
        }
      );
      
      // Create appointment event
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'COMPLETED',
          scheduledAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
      );
      
      // Create claim event
      const claimEvent = createTestEvent<ClaimEventDto>(
        EventTypes.Plan.CLAIM_SUBMITTED,
        {
          userId: TEST_USER_ID,
          claimId: uuidv4(),
          claimType: 'MEDICAL',
          amount: 100.0,
          currency: 'BRL',
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      await publishTestEvent(context, claimEvent, { topic: PLAN_EVENTS_TOPIC });
      
      // Wait for achievement event
      const achievementEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.ACHIEVEMENT_UNLOCKED &&
                 event.payload.userId === TEST_USER_ID &&
                 event.payload.achievements.some(a => a.name === 'super-user');
        },
      });
      
      // Verify achievement event
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(achievementEvent?.payload.achievements).toContainEqual(
        expect.objectContaining({
          name: 'super-user',
          journey: 'cross-journey',
        })
      );
    });
  });
  
  describe('Cross-Journey Event Correlation', () => {
    it('should correlate events from different journeys for the same user', async () => {
      const correlationId = uuidv4();
      
      // Create health metric event with correlation ID
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.METRIC_RECORDED,
        {
          userId: TEST_USER_ID,
          metricType: 'BLOOD_PRESSURE',
          value: '120/80',
          unit: 'mmHg',
          recordedAt: new Date().toISOString(),
          source: 'test',
        },
        {
          metadata: {
            correlationId,
            sessionId: uuidv4(),
          },
        }
      );
      
      // Create appointment event with same correlation ID
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_SCHEDULED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        },
        {
          metadata: {
            correlationId,
            sessionId: uuidv4(),
          },
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      
      // Wait for correlated event
      const correlatedEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.metadata?.correlationId === correlationId;
        },
      });
      
      // Verify correlated event
      expect(correlatedEvent).not.toBeNull();
      expect(correlatedEvent?.metadata?.correlationId).toBe(correlationId);
      expect(correlatedEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(correlatedEvent?.payload.sourceEvents).toContainEqual(
        expect.objectContaining({
          eventId: healthMetricEvent.eventId,
        })
      );
      expect(correlatedEvent?.payload.sourceEvents).toContainEqual(
        expect.objectContaining({
          eventId: appointmentEvent.eventId,
        })
      );
    });
  });
  
  describe('Achievement Notification Delivery', () => {
    it('should generate notification events for unlocked achievements', async () => {
      // Create health metric event that triggers achievement
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.GOAL_ACHIEVED,
        {
          userId: TEST_USER_ID,
          goalId: uuidv4(),
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          achievedAt: new Date().toISOString(),
        }
      );
      
      // Publish event
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      
      // Wait for notification event
      const notificationEvent = await waitForEvent(context, {
        topic: NOTIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Notification.ACHIEVEMENT_NOTIFICATION &&
                 event.payload.userId === TEST_USER_ID;
        },
      });
      
      // Verify notification event
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(notificationEvent?.payload.notificationType).toBe('ACHIEVEMENT');
      expect(notificationEvent?.payload.data).toHaveProperty('achievementName');
      expect(notificationEvent?.payload.data).toHaveProperty('xpAwarded');
      expect(notificationEvent?.payload.channels).toContain('IN_APP');
    });
    
    it('should deliver notifications for cross-journey achievements', async () => {
      // Create events from all three journeys
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.METRIC_RECORDED,
        {
          userId: TEST_USER_ID,
          metricType: 'WEIGHT',
          value: 70.5,
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          source: 'test',
        }
      );
      
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'COMPLETED',
          scheduledAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
      );
      
      const claimEvent = createTestEvent<ClaimEventDto>(
        EventTypes.Plan.CLAIM_SUBMITTED,
        {
          userId: TEST_USER_ID,
          claimId: uuidv4(),
          claimType: 'MEDICAL',
          amount: 150.0,
          currency: 'BRL',
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      await publishTestEvent(context, claimEvent, { topic: PLAN_EVENTS_TOPIC });
      
      // Wait for cross-journey achievement notification
      const notificationEvent = await waitForEvent(context, {
        topic: NOTIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Notification.ACHIEVEMENT_NOTIFICATION &&
                 event.payload.userId === TEST_USER_ID &&
                 event.payload.data.journey === 'cross-journey';
        },
      });
      
      // Verify notification event
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(notificationEvent?.payload.notificationType).toBe('ACHIEVEMENT');
      expect(notificationEvent?.payload.data.journey).toBe('cross-journey');
      expect(notificationEvent?.payload.channels).toContain('IN_APP');
      expect(notificationEvent?.payload.channels).toContain('PUSH');
    });
  });
  
  describe('Leaderboard Updates', () => {
    it('should update leaderboard based on cross-journey events', async () => {
      // Create events from all three journeys
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.GOAL_ACHIEVED,
        {
          userId: TEST_USER_ID,
          goalId: uuidv4(),
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 12000,
          achievedAt: new Date().toISOString(),
        }
      );
      
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'COMPLETED',
          scheduledAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
      );
      
      const claimEvent = createTestEvent<ClaimEventDto>(
        EventTypes.Plan.CLAIM_APPROVED,
        {
          userId: TEST_USER_ID,
          claimId: uuidv4(),
          claimType: 'MEDICAL',
          amount: 200.0,
          currency: 'BRL',
          status: 'APPROVED',
          submittedAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          approvedAt: new Date().toISOString(),
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      await publishTestEvent(context, claimEvent, { topic: PLAN_EVENTS_TOPIC });
      
      // Wait for leaderboard update event
      const leaderboardEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.LEADERBOARD_UPDATED &&
                 event.payload.entries.some(entry => entry.userId === TEST_USER_ID);
        },
      });
      
      // Verify leaderboard event
      expect(leaderboardEvent).not.toBeNull();
      expect(leaderboardEvent?.payload.leaderboardId).toBeDefined();
      
      const userEntry = leaderboardEvent?.payload.entries.find(
        entry => entry.userId === TEST_USER_ID
      );
      
      expect(userEntry).toBeDefined();
      expect(userEntry?.score).toBeGreaterThan(0);
      expect(userEntry?.rank).toBeDefined();
    });
  });
  
  describe('User Profile Updates', () => {
    it('should update user profile XP based on events from multiple journeys', async () => {
      // Create events from all three journeys
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.METRIC_RECORDED,
        {
          userId: TEST_USER_ID,
          metricType: 'BLOOD_GLUCOSE',
          value: 85,
          unit: 'mg/dL',
          recordedAt: new Date().toISOString(),
          source: 'test',
        }
      );
      
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_SCHEDULED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        }
      );
      
      const claimEvent = createTestEvent<ClaimEventDto>(
        EventTypes.Plan.CLAIM_SUBMITTED,
        {
          userId: TEST_USER_ID,
          claimId: uuidv4(),
          claimType: 'MEDICAL',
          amount: 175.0,
          currency: 'BRL',
          status: 'SUBMITTED',
          submittedAt: new Date().toISOString(),
        }
      );
      
      // Publish events
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      await publishTestEvent(context, claimEvent, { topic: PLAN_EVENTS_TOPIC });
      
      // Wait for profile update event
      const profileEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.PROFILE_UPDATED &&
                 event.payload.userId === TEST_USER_ID;
        },
      });
      
      // Verify profile event
      expect(profileEvent).not.toBeNull();
      expect(profileEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(profileEvent?.payload.xp).toBeGreaterThan(0);
      expect(profileEvent?.payload.level).toBeGreaterThanOrEqual(1);
      expect(profileEvent?.payload.journeyProgress).toHaveProperty('health');
      expect(profileEvent?.payload.journeyProgress).toHaveProperty('care');
      expect(profileEvent?.payload.journeyProgress).toHaveProperty('plan');
    });
    
    it('should track journey-specific progress separately', async () => {
      // Create health metric event
      const healthMetricEvent = createTestEvent<HealthMetricEventDto>(
        EventTypes.Health.GOAL_ACHIEVED,
        {
          userId: TEST_USER_ID,
          goalId: uuidv4(),
          goalType: 'WEIGHT',
          targetValue: 70.0,
          achievedValue: 70.0,
          achievedAt: new Date().toISOString(),
        }
      );
      
      // Publish event
      await publishTestEvent(context, healthMetricEvent, { topic: HEALTH_EVENTS_TOPIC });
      
      // Wait for profile update event
      const profileEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.PROFILE_UPDATED &&
                 event.payload.userId === TEST_USER_ID;
        },
      });
      
      // Verify profile event
      expect(profileEvent).not.toBeNull();
      expect(profileEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(profileEvent?.payload.journeyProgress.health).toBeGreaterThan(0);
      
      // Get initial health progress
      const initialHealthProgress = profileEvent?.payload.journeyProgress.health;
      
      // Create care journey event
      const appointmentEvent = createTestEvent<AppointmentEventDto>(
        EventTypes.Care.APPOINTMENT_COMPLETED,
        {
          userId: TEST_USER_ID,
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          status: 'COMPLETED',
          scheduledAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        }
      );
      
      // Publish event
      await publishTestEvent(context, appointmentEvent, { topic: CARE_EVENTS_TOPIC });
      
      // Wait for profile update event
      const updatedProfileEvent = await waitForEvent(context, {
        topic: ACHIEVEMENT_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => {
          return event.type === EventTypes.Gamification.PROFILE_UPDATED &&
                 event.payload.userId === TEST_USER_ID &&
                 event.eventId !== profileEvent?.eventId; // Make sure it's a different event
        },
      });
      
      // Verify updated profile event
      expect(updatedProfileEvent).not.toBeNull();
      expect(updatedProfileEvent?.payload.userId).toBe(TEST_USER_ID);
      expect(updatedProfileEvent?.payload.journeyProgress.health).toBe(initialHealthProgress);
      expect(updatedProfileEvent?.payload.journeyProgress.care).toBeGreaterThan(0);
    });
  });
});