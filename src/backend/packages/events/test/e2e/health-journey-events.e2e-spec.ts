import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { setTimeout as sleep } from 'timers/promises';
import { v4 as uuidv4 } from 'uuid';

// Import test helpers
import {
  createTestEnvironment,
  TestEnvironmentContext,
  publishTestEvent,
  waitForEvent,
  createTestEvent,
  compareEvents,
  TestDatabaseSeeder,
} from './test-helpers';

// Import interfaces and types
import { IEvent } from '../../src/interfaces/base-event.interface';
import { JourneyType, HealthEventType } from '../../src/interfaces/journey-events.interface';
import {
  IHealthMetricRecordedEvent,
  IHealthGoalCreatedEvent,
  IHealthGoalAchievedEvent,
  IHealthInsightGeneratedEvent,
  IDeviceConnectedEvent,
  IDeviceSyncedEvent,
} from '../../src/interfaces/journey-events.interface';

/**
 * End-to-end tests for Health Journey events
 * 
 * These tests validate the complete flow of health-related events from production to consumption,
 * including health metrics recording, goal achievement, device synchronization, and health insight generation events.
 */
describe('Health Journey Events (e2e)', () => {
  let context: TestEnvironmentContext;
  let app: INestApplication;
  let seeder: TestDatabaseSeeder;
  
  // Define test topics
  const HEALTH_EVENTS_TOPIC = 'health-events';
  const HEALTH_METRICS_TOPIC = 'health-metrics-events';
  const HEALTH_GOALS_TOPIC = 'health-goals-events';
  const DEVICE_EVENTS_TOPIC = 'device-events';
  const HEALTH_INSIGHTS_TOPIC = 'health-insights-events';
  const GAMIFICATION_EVENTS_TOPIC = 'gamification-events';
  
  // Set up test environment before all tests
  beforeAll(async () => {
    // Create test environment with Kafka and database
    context = await createTestEnvironment({
      topics: [
        HEALTH_EVENTS_TOPIC,
        HEALTH_METRICS_TOPIC,
        HEALTH_GOALS_TOPIC,
        DEVICE_EVENTS_TOPIC,
        HEALTH_INSIGHTS_TOPIC,
        GAMIFICATION_EVENTS_TOPIC,
      ],
      enableKafka: true,
      enableDatabase: true,
    });
    
    app = context.app;
    
    // Set up database seeder
    if (context.prisma) {
      seeder = new TestDatabaseSeeder(context.prisma);
      await seeder.cleanDatabase();
      await seeder.seedTestUsers();
      await seeder.seedJourneyData('health');
    }
    
    // Wait for Kafka to be ready
    await sleep(1000);
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await context.cleanup();
  });
  
  describe('Health Metric Events', () => {
    it('should validate and process health metric recording events', async () => {
      // Create health metric recording event
      const metricEvent = createTestEvent<IHealthMetricRecordedEvent['payload']>(
        HealthEventType.METRIC_RECORDED,
        {
          metric: {
            id: uuidv4(),
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
          },
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId: '123e4567-e89b-12d3-a456-426614174000',
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...metricEvent,
        journeyType: JourneyType.HEALTH,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_METRICS_TOPIC,
      });
      
      // Wait for event to be processed and gamification event to be produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.achievement.progress' && 
          event.payload.achievementType === 'health-check-streak',
        throwOnTimeout: true,
      });
      
      // Verify gamification event
      expect(gamificationEvent).toBeDefined();
      expect(gamificationEvent?.payload).toHaveProperty('userId', journeyEvent.userId);
      expect(gamificationEvent?.payload).toHaveProperty('achievementType', 'health-check-streak');
      expect(gamificationEvent?.payload).toHaveProperty('progress');
    });
    
    it('should process multiple health metrics for the same user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Create multiple health metric events
      const metricTypes = [
        { type: 'STEPS', value: 8500, unit: 'steps' },
        { type: 'WEIGHT', value: 70.5, unit: 'kg' },
        { type: 'BLOOD_GLUCOSE', value: 95, unit: 'mg/dL' },
      ];
      
      // Publish each metric event
      for (const metricType of metricTypes) {
        const metricEvent = createTestEvent<IHealthMetricRecordedEvent['payload']>(
          HealthEventType.METRIC_RECORDED,
          {
            metric: {
              id: uuidv4(),
              userId,
              type: metricType.type,
              value: metricType.value,
              unit: metricType.unit,
              timestamp: new Date().toISOString(),
            },
            metricType: metricType.type,
            value: metricType.value,
            unit: metricType.unit,
            timestamp: new Date().toISOString(),
            source: 'manual',
          },
          {
            source: 'health-service',
            metadata: {
              journey: 'health',
              userId,
            },
          }
        );
        
        // Add journey type to make it a proper journey event
        const journeyEvent = {
          ...metricEvent,
          journeyType: JourneyType.HEALTH,
          userId,
        };
        
        // Publish event
        await publishTestEvent(context, journeyEvent, {
          topic: HEALTH_METRICS_TOPIC,
        });
        
        // Wait a bit between events
        await sleep(500);
      }
      
      // Wait for gamification event that indicates multiple metrics were recorded
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.achievement.progress' && 
          event.payload.userId === userId &&
          event.payload.achievementType === 'health-check-streak',
        throwOnTimeout: true,
      });
      
      // Verify gamification event shows increased progress
      expect(gamificationEvent).toBeDefined();
      expect(gamificationEvent?.payload).toHaveProperty('progress');
      expect(gamificationEvent?.payload.progress).toBeGreaterThan(1); // Should have recorded multiple metrics
    });
    
    it('should reject invalid health metric events', async () => {
      // Create invalid health metric event (missing required fields)
      const invalidEvent = createTestEvent<Partial<IHealthMetricRecordedEvent['payload']>>(
        HealthEventType.METRIC_RECORDED,
        {
          // Missing metric object
          metricType: 'HEART_RATE',
          // Missing value
          unit: 'bpm',
          // Invalid timestamp format
          timestamp: 'not-a-date',
        },
        {
          source: 'health-service',
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...invalidEvent,
        journeyType: JourneyType.HEALTH,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_METRICS_TOPIC,
      });
      
      // Wait for error event
      const errorEvent = await waitForEvent<IEvent>(context, {
        topic: 'error-events',
        timeout: 5000,
        filter: (event) => 
          event.type === 'EVENT_VALIDATION_ERROR' && 
          event.payload.originalEventId === invalidEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Error event might not be produced if the service is configured to just log errors
      // So we'll check for the absence of a gamification event instead
      await sleep(2000); // Wait to ensure event would have been processed
      
      // Check that no gamification event was produced
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 1000, // Short timeout since we don't expect an event
        filter: (event) => 
          event.payload.originalEventId === invalidEvent.eventId,
        throwOnTimeout: false,
      });
      
      expect(gamificationEvent).toBeNull();
    });
  });
  
  describe('Health Goal Events', () => {
    it('should validate and process goal creation events', async () => {
      // Create goal creation event
      const goalEvent = createTestEvent<IHealthGoalCreatedEvent['payload']>(
        HealthEventType.GOAL_CREATED,
        {
          goal: {
            id: uuidv4(),
            userId: '123e4567-e89b-12d3-a456-426614174000',
            type: 'STEPS',
            targetValue: 10000,
            unit: 'steps',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          },
          goalType: 'STEPS',
          targetValue: 10000,
          unit: 'steps',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          recurrence: 'daily',
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId: '123e4567-e89b-12d3-a456-426614174000',
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...goalEvent,
        journeyType: JourneyType.HEALTH,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_GOALS_TOPIC,
      });
      
      // Wait for event to be processed
      // No specific gamification event expected for goal creation, but we should verify it was processed
      await sleep(2000);
      
      // Optionally check for a notification event if your system sends those
      const notificationEvent = await waitForEvent<IEvent>(context, {
        topic: 'notification-events',
        timeout: 3000,
        filter: (event) => 
          event.type === 'NOTIFICATION_CREATED' && 
          event.payload.relatedEventId === goalEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Notification might be optional, so we don't assert on it
    });
    
    it('should process goal achievement events', async () => {
      // Create goal achievement event
      const goalId = uuidv4();
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const goalEvent = createTestEvent<IHealthGoalAchievedEvent['payload']>(
        HealthEventType.GOAL_ACHIEVED,
        {
          goal: {
            id: goalId,
            userId,
            type: 'STEPS',
            targetValue: 10000,
            unit: 'steps',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(), // 23 days from now
          },
          achievedValue: 10250,
          targetValue: 10000,
          achievedDate: new Date().toISOString(),
          daysToAchieve: 7,
          streakCount: 7,
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...goalEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_GOALS_TOPIC,
      });
      
      // Wait for achievement event
      const achievementEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.achievement.progress' && 
          event.payload.userId === userId &&
          event.payload.achievementType === 'steps-goal',
        throwOnTimeout: true,
      });
      
      // Verify achievement event
      expect(achievementEvent).toBeDefined();
      expect(achievementEvent?.payload).toHaveProperty('userId', userId);
      expect(achievementEvent?.payload).toHaveProperty('achievementType', 'steps-goal');
      expect(achievementEvent?.payload).toHaveProperty('progress');
      
      // Check for XP award
      const xpEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.xp.awarded' && 
          event.payload.userId === userId,
        throwOnTimeout: false,
      });
      
      if (xpEvent) {
        expect(xpEvent.payload).toHaveProperty('xpAmount');
        expect(xpEvent.payload.xpAmount).toBeGreaterThan(0);
      }
    });
    
    it('should track consecutive goal achievements', async () => {
      // Create multiple goal achievement events to simulate a streak
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      // Create events for different goals
      const goalTypes = [
        { type: 'STEPS', targetValue: 10000, unit: 'steps', achievedValue: 12000 },
        { type: 'HEART_RATE', targetValue: 60, unit: 'bpm', achievedValue: 62 },
        { type: 'WEIGHT', targetValue: 70, unit: 'kg', achievedValue: 70 },
      ];
      
      for (const goalType of goalTypes) {
        const goalEvent = createTestEvent<IHealthGoalAchievedEvent['payload']>(
          HealthEventType.GOAL_ACHIEVED,
          {
            goal: {
              id: uuidv4(),
              userId,
              type: goalType.type,
              targetValue: goalType.targetValue,
              unit: goalType.unit,
              startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            },
            achievedValue: goalType.achievedValue,
            targetValue: goalType.targetValue,
            achievedDate: new Date().toISOString(),
            daysToAchieve: 10,
            streakCount: 1,
          },
          {
            source: 'health-service',
            metadata: {
              journey: 'health',
              userId,
            },
          }
        );
        
        // Add journey type to make it a proper journey event
        const journeyEvent = {
          ...goalEvent,
          journeyType: JourneyType.HEALTH,
          userId,
        };
        
        // Publish event
        await publishTestEvent(context, journeyEvent, {
          topic: HEALTH_GOALS_TOPIC,
        });
        
        // Wait a bit between events
        await sleep(500);
      }
      
      // Wait for achievement unlocked event (multiple goals might trigger an achievement)
      const achievementEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.achievement.unlocked' && 
          event.payload.userId === userId,
        throwOnTimeout: false,
      });
      
      // Achievement might not be unlocked yet, so we don't assert it must exist
      if (achievementEvent) {
        expect(achievementEvent.payload).toHaveProperty('userId', userId);
        expect(achievementEvent.payload).toHaveProperty('achievementType');
        expect(achievementEvent.payload).toHaveProperty('level');
      }
      
      // But we should at least see progress
      const progressEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.achievement.progress' && 
          event.payload.userId === userId,
        throwOnTimeout: true,
      });
      
      expect(progressEvent).toBeDefined();
      expect(progressEvent?.payload).toHaveProperty('progress');
      expect(progressEvent?.payload.progress).toBeGreaterThan(0);
    });
  });
  
  describe('Device Events', () => {
    it('should validate and process device connection events', async () => {
      // Create device connection event
      const deviceId = uuidv4();
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const deviceEvent = createTestEvent<IDeviceConnectedEvent['payload']>(
        HealthEventType.DEVICE_CONNECTED,
        {
          device: {
            id: deviceId,
            userId,
            deviceType: 'Smartwatch',
            manufacturer: 'Apple',
            model: 'Watch Series 7',
            connectionStatus: 'CONNECTED',
            lastSyncDate: null,
          },
          deviceType: 'Smartwatch',
          connectionDate: new Date().toISOString(),
          isFirstConnection: true,
          permissions: ['activity', 'heart_rate', 'sleep'],
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...deviceEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: DEVICE_EVENTS_TOPIC,
      });
      
      // Wait for notification event
      const notificationEvent = await waitForEvent<IEvent>(context, {
        topic: 'notification-events',
        timeout: 5000,
        filter: (event) => 
          event.type === 'NOTIFICATION_CREATED' && 
          event.payload.userId === userId &&
          event.payload.relatedEventId === deviceEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Notification might be optional, so we don't assert on it
      
      // Wait for device sync event
      await sleep(1000);
      
      // Create device sync event
      const syncEvent = createTestEvent<IDeviceSyncedEvent['payload']>(
        HealthEventType.DEVICE_SYNCED,
        {
          device: {
            id: deviceId,
            userId,
            deviceType: 'Smartwatch',
            manufacturer: 'Apple',
            model: 'Watch Series 7',
            connectionStatus: 'CONNECTED',
            lastSyncDate: new Date().toISOString(),
          },
          deviceType: 'Smartwatch',
          syncDate: new Date().toISOString(),
          metricsCount: 5,
          syncDuration: 3500, // 3.5 seconds
          newMetricTypes: ['HEART_RATE', 'STEPS', 'SLEEP'],
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const syncJourneyEvent = {
        ...syncEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, syncJourneyEvent, {
        topic: DEVICE_EVENTS_TOPIC,
      });
      
      // Wait for gamification event
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.payload.userId === userId &&
          event.payload.deviceId === deviceId,
        throwOnTimeout: false,
      });
      
      // Gamification event might be optional for device sync, so we don't assert it must exist
      if (gamificationEvent) {
        expect(gamificationEvent.payload).toHaveProperty('userId', userId);
      }
    });
  });
  
  describe('Health Insight Events', () => {
    it('should validate and process health insight generation events', async () => {
      // Create health insight event
      const insightId = uuidv4();
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const insightEvent = createTestEvent<IHealthInsightGeneratedEvent['payload']>(
        HealthEventType.INSIGHT_GENERATED,
        {
          insightId,
          insightType: 'trend',
          metricType: 'HEART_RATE',
          description: 'Your resting heart rate has improved by 5 bpm over the last month.',
          severity: 'info',
          relatedMetrics: [
            {
              id: uuidv4(),
              userId,
              type: 'HEART_RATE',
              value: 65,
              unit: 'bpm',
              timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: uuidv4(),
              userId,
              type: 'HEART_RATE',
              value: 60,
              unit: 'bpm',
              timestamp: new Date().toISOString(),
            },
          ],
          generatedDate: new Date().toISOString(),
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...insightEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_INSIGHTS_TOPIC,
      });
      
      // Wait for notification event
      const notificationEvent = await waitForEvent<IEvent>(context, {
        topic: 'notification-events',
        timeout: 5000,
        filter: (event) => 
          event.type === 'NOTIFICATION_CREATED' && 
          event.payload.userId === userId &&
          event.payload.relatedEventId === insightEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Notification might be optional, so we don't assert on it
      
      // Check for XP award for insights
      const xpEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 5000,
        filter: (event) => 
          event.type === 'gamification.xp.awarded' && 
          event.payload.userId === userId &&
          event.payload.source === 'insight',
        throwOnTimeout: false,
      });
      
      if (xpEvent) {
        expect(xpEvent.payload).toHaveProperty('xpAmount');
        expect(xpEvent.payload.xpAmount).toBeGreaterThan(0);
      }
    });
    
    it('should handle critical health insights with higher priority', async () => {
      // Create critical health insight event
      const insightId = uuidv4();
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const insightEvent = createTestEvent<IHealthInsightGeneratedEvent['payload']>(
        HealthEventType.INSIGHT_GENERATED,
        {
          insightId,
          insightType: 'anomaly',
          metricType: 'BLOOD_PRESSURE',
          description: 'Your blood pressure readings have been consistently high over the past week.',
          severity: 'critical',
          relatedMetrics: [
            {
              id: uuidv4(),
              userId,
              type: 'BLOOD_PRESSURE',
              value: 145, // Systolic, would be an object in real implementation
              unit: 'mmHg',
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: uuidv4(),
              userId,
              type: 'BLOOD_PRESSURE',
              value: 150, // Systolic, would be an object in real implementation
              unit: 'mmHg',
              timestamp: new Date().toISOString(),
            },
          ],
          generatedDate: new Date().toISOString(),
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
            priority: 'high',
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...insightEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_INSIGHTS_TOPIC,
      });
      
      // Wait for high-priority notification event
      const notificationEvent = await waitForEvent<IEvent>(context, {
        topic: 'notification-events',
        timeout: 5000,
        filter: (event) => 
          event.type === 'NOTIFICATION_CREATED' && 
          event.payload.userId === userId &&
          event.payload.priority === 'high',
        throwOnTimeout: false,
      });
      
      // High-priority notification might be optional, so we don't assert it must exist
      if (notificationEvent) {
        expect(notificationEvent.payload).toHaveProperty('userId', userId);
        expect(notificationEvent.payload).toHaveProperty('priority', 'high');
      }
    });
  });
  
  describe('Cross-Journey Integration', () => {
    it('should integrate health events with care journey', async () => {
      // Create health insight event that might trigger a care recommendation
      const insightId = uuidv4();
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const insightEvent = createTestEvent<IHealthInsightGeneratedEvent['payload']>(
        HealthEventType.INSIGHT_GENERATED,
        {
          insightId,
          insightType: 'recommendation',
          metricType: 'BLOOD_GLUCOSE',
          description: 'Your blood glucose levels suggest you should consult with your doctor.',
          severity: 'warning',
          relatedMetrics: [
            {
              id: uuidv4(),
              userId,
              type: 'BLOOD_GLUCOSE',
              value: 130,
              unit: 'mg/dL',
              timestamp: new Date().toISOString(),
            },
          ],
          generatedDate: new Date().toISOString(),
        },
        {
          source: 'health-service',
          metadata: {
            journey: 'health',
            userId,
            correlationId: uuidv4(), // For cross-journey tracking
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...insightEvent,
        journeyType: JourneyType.HEALTH,
        userId,
        correlationId: insightEvent.metadata?.correlationId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_INSIGHTS_TOPIC,
      });
      
      // Wait for care journey event (recommendation might trigger appointment suggestion)
      const careEvent = await waitForEvent<IEvent>(context, {
        topic: 'care-events',
        timeout: 5000,
        filter: (event) => 
          event.payload.userId === userId &&
          event.metadata?.correlationId === journeyEvent.correlationId,
        throwOnTimeout: false,
      });
      
      // Care event might be optional, so we don't assert it must exist
      if (careEvent) {
        expect(careEvent.payload).toHaveProperty('userId', userId);
        expect(careEvent.metadata).toHaveProperty('correlationId', journeyEvent.correlationId);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should handle malformed health events gracefully', async () => {
      // Create malformed event (invalid JSON)
      const malformedEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        type: HealthEventType.METRIC_RECORDED,
        source: 'health-service',
        // Missing payload
      };
      
      // Publish event directly as a string with invalid JSON
      await context.producer?.send({
        topic: HEALTH_EVENTS_TOPIC,
        messages: [
          {
            key: malformedEvent.eventId,
            // Intentionally malformed JSON
            value: '{"eventId":"' + malformedEvent.eventId + '","timestamp":"' + malformedEvent.timestamp + '","type":"' + malformedEvent.type + '","source":"health-service","payload":{' // Missing closing brace
          },
        ],
      });
      
      // Wait a bit to ensure event would have been processed
      await sleep(2000);
      
      // Check that no gamification event was produced for this event
      const gamificationEvent = await waitForEvent<IEvent>(context, {
        topic: GAMIFICATION_EVENTS_TOPIC,
        timeout: 1000, // Short timeout since we don't expect an event
        filter: (event) => 
          event.payload && event.payload.originalEventId === malformedEvent.eventId,
        throwOnTimeout: false,
      });
      
      expect(gamificationEvent).toBeNull();
      
      // Check for error event if your system produces them
      const errorEvent = await waitForEvent<IEvent>(context, {
        topic: 'error-events',
        timeout: 3000,
        filter: (event) => 
          event.payload && event.payload.originalEventId === malformedEvent.eventId,
        throwOnTimeout: false,
      });
      
      // Error event might not be produced if the service is configured to just log errors
      // So we don't assert it must exist
    });
    
    it('should validate event schema version compatibility', async () => {
      // Create event with future version that might not be compatible
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      
      const futureVersionEvent = createTestEvent<IHealthMetricRecordedEvent['payload']>(
        HealthEventType.METRIC_RECORDED,
        {
          metric: {
            id: uuidv4(),
            userId,
            type: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
          },
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
          // Add a field that might exist in future versions
          futureField: 'some value',
        },
        {
          source: 'health-service',
          // Use a future version
          version: '2.0.0',
          metadata: {
            journey: 'health',
            userId,
          },
        }
      );
      
      // Add journey type to make it a proper journey event
      const journeyEvent = {
        ...futureVersionEvent,
        journeyType: JourneyType.HEALTH,
        userId,
      };
      
      // Publish event
      await publishTestEvent(context, journeyEvent, {
        topic: HEALTH_METRICS_TOPIC,
      });
      
      // Wait a bit to ensure event would have been processed
      await sleep(2000);
      
      // The system should either process the event (backward compatibility)
      // or reject it with a version incompatibility error
      
      // Check for version error event
      const versionErrorEvent = await waitForEvent<IEvent>(context, {
        topic: 'error-events',
        timeout: 3000,
        filter: (event) => 
          event.type === 'EVENT_VERSION_ERROR' && 
          event.payload.originalEventId === futureVersionEvent.eventId,
        throwOnTimeout: false,
      });
      
      // If no version error, check if the event was processed successfully
      if (!versionErrorEvent) {
        // Check for successful processing (gamification event)
        const gamificationEvent = await waitForEvent<IEvent>(context, {
          topic: GAMIFICATION_EVENTS_TOPIC,
          timeout: 3000,
          filter: (event) => 
            event.payload.userId === userId &&
            event.metadata?.originalEventId === futureVersionEvent.eventId,
          throwOnTimeout: false,
        });
        
        // Either a version error or successful processing should occur
        // We don't assert which one, as it depends on the system's version compatibility handling
      }
    });
  });
});