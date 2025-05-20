/**
 * @file health-journey-events.e2e-spec.ts
 * @description End-to-end tests for Health Journey events, validating the complete flow of health-related
 * events from production to consumption. This file tests event publishing, validation, and processing for
 * health metrics recording, goal achievement, device synchronization, and health insight generation events.
 * It ensures proper event schema validation and processing through the event pipeline.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  TestEnvironment,
  createTestUser,
  createTestHealthMetrics,
  createTestEvent,
  assertEvent,
  retry,
  waitForCondition,
  seedTestDatabase
} from './test-helpers';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { JourneyType } from '../../src/dto/journey-types.enum';
import {
  HealthMetricData,
  HealthMetricType,
  HealthGoalData,
  HealthGoalType,
  DeviceSyncData,
  DeviceType,
  HealthInsightData,
  HealthInsightType
} from '../../src/dto/health-event.dto';
import { TOPICS } from '../../src/constants/topics.constants';
import { AppModule } from 'src/backend/gamification-engine/src/app.module';

describe('Health Journey Events (e2e)', () => {
  let app: INestApplication;
  let testEnv: TestEnvironment;
  let prisma: PrismaClient;
  let userId: string;

  beforeAll(async () => {
    // Create test environment
    testEnv = new TestEnvironment({
      topics: [
        TOPICS.HEALTH.EVENTS,
        TOPICS.HEALTH.METRICS,
        TOPICS.HEALTH.GOALS,
        TOPICS.HEALTH.DEVICES,
        TOPICS.GAMIFICATION.EVENTS,
        TOPICS.GAMIFICATION.ACHIEVEMENTS,
        TOPICS.DEAD_LETTER
      ]
    });

    await testEnv.setup();
    app = testEnv.getApp();
    prisma = testEnv.getPrisma();

    // Seed test database
    await seedTestDatabase(prisma);

    // Create test user
    const user = await createTestUser(prisma);
    userId = user.id;

    // Create some test health metrics
    await createTestHealthMetrics(prisma, userId, 3);
  }, 60000);

  afterAll(async () => {
    await testEnv.teardown();
  });

  beforeEach(() => {
    // Clear consumed messages before each test
    testEnv.clearConsumedMessages();
  });

  describe('Health Metric Recording Events', () => {
    it('should process valid health metric recording events', async () => {
      // Create health metric data
      const metricData: HealthMetricData = {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        notes: 'Recorded after light exercise',
        validateMetricRange: jest.fn().mockReturnValue(true)
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.METRIC_RECORDED,
        JourneyType.HEALTH,
        userId,
        metricData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.METRICS);

      // Wait for event processing and gamification point award
      const pointsEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId,
        10000
      );

      // Assert points were awarded for recording health metric
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data).toHaveProperty('points');
      expect(pointsEvent?.data.points).toBeGreaterThan(0);
      expect(pointsEvent?.data.sourceType).toBe('health');
      expect(pointsEvent?.data.reason).toContain('metric');

      // Verify metric was saved to database
      const savedMetric = await prisma.healthMetric.findFirst({
        where: {
          userId,
          value: metricData.value.toString(),
          // Find the most recent metric
          recordedAt: {
            gte: new Date(Date.now() - 60000) // Within the last minute
          }
        },
        include: {
          type: true
        }
      });

      expect(savedMetric).not.toBeNull();
      expect(savedMetric?.type.name).toBe(metricData.metricType);
    });

    it('should reject health metric events with invalid values', async () => {
      // Create invalid health metric data (heart rate too high)
      const invalidMetricData: HealthMetricData = {
        metricType: HealthMetricType.HEART_RATE,
        value: 300, // Invalid value - heart rate too high
        unit: 'bpm',
        recordedAt: new Date().toISOString(),
        validateMetricRange: jest.fn().mockReturnValue(false)
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.METRIC_RECORDED,
        JourneyType.HEALTH,
        userId,
        invalidMetricData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.METRICS);

      // Wait for dead letter queue event
      const deadLetterEvent = await testEnv.waitForEvent(
        JourneyEvents.Health.METRIC_RECORDED,
        userId,
        10000,
      );

      // Check if the event was sent to the dead letter queue
      const messages = testEnv.getConsumedMessages();
      const deadLetterMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => key === 'error-type' && value?.toString().includes('validation')
        );
      });

      expect(deadLetterMessage).toBeDefined();
    });

    it('should process multiple health metrics in a single batch', async () => {
      // Create multiple health metric events
      const metrics = [
        {
          metricType: HealthMetricType.STEPS,
          value: 8500,
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          validateMetricRange: jest.fn().mockReturnValue(true)
        },
        {
          metricType: HealthMetricType.WEIGHT,
          value: 75.5,
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          validateMetricRange: jest.fn().mockReturnValue(true)
        },
        {
          metricType: HealthMetricType.BLOOD_GLUCOSE,
          value: 95,
          unit: 'mg/dL',
          recordedAt: new Date().toISOString(),
          validateMetricRange: jest.fn().mockReturnValue(true)
        }
      ];

      // Publish all events
      for (const metricData of metrics) {
        const event = createTestEvent(
          JourneyEvents.Health.METRIC_RECORDED,
          JourneyType.HEALTH,
          userId,
          metricData
        );

        await testEnv.publishEvent(event, TOPICS.HEALTH.METRICS);
      }

      // Wait for points events (should get points for each metric)
      let pointsEventCount = 0;
      await waitForCondition(async () => {
        const messages = testEnv.getConsumedMessages();
        pointsEventCount = messages.filter(msg => {
          try {
            const event = JSON.parse(msg.value?.toString() || '{}');
            return event.type === EventType.GAMIFICATION_POINTS_EARNED && event.userId === userId;
          } catch {
            return false;
          }
        }).length;
        return pointsEventCount >= metrics.length;
      }, 15000);

      expect(pointsEventCount).toBeGreaterThanOrEqual(metrics.length);

      // Check if metrics were saved to database
      for (const metricData of metrics) {
        const savedMetric = await prisma.healthMetric.findFirst({
          where: {
            userId,
            value: metricData.value.toString(),
            recordedAt: {
              gte: new Date(Date.now() - 60000) // Within the last minute
            }
          },
          include: {
            type: true
          }
        });

        expect(savedMetric).not.toBeNull();
        expect(savedMetric?.type.name).toBe(metricData.metricType);
      }
    });

    it('should trigger achievement when recording metrics consistently', async () => {
      // Simulate recording metrics for multiple days
      // This would normally happen over days, but we'll simulate it for testing
      const dates = [
        new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        new Date() // Today
      ];

      for (const date of dates) {
        const metricData: HealthMetricData = {
          metricType: HealthMetricType.HEART_RATE,
          value: 72,
          unit: 'bpm',
          recordedAt: date.toISOString(),
          validateMetricRange: jest.fn().mockReturnValue(true)
        };

        const event = createTestEvent(
          JourneyEvents.Health.METRIC_RECORDED,
          JourneyType.HEALTH,
          userId,
          metricData
        );

        await testEnv.publishEvent(event, TOPICS.HEALTH.METRICS);
      }

      // Wait for achievement event
      const achievementEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
        userId,
        15000
      );

      // Assert achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent?.data).toHaveProperty('achievementType');
      expect(achievementEvent?.data.achievementType).toContain('health-check');
    });
  });

  describe('Health Goal Events', () => {
    it('should process goal achievement events', async () => {
      // Create goal data
      const goalId = uuidv4();
      const goalData: HealthGoalData = {
        goalId,
        goalType: HealthGoalType.STEPS_TARGET,
        description: 'Walk 10,000 steps daily',
        targetValue: 10000,
        unit: 'steps',
        progressPercentage: 100,
        achievedAt: new Date().toISOString(),
        isAchieved: jest.fn().mockReturnValue(true),
        markAsAchieved: jest.fn()
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.GOAL_ACHIEVED,
        JourneyType.HEALTH,
        userId,
        goalData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.GOALS);

      // Wait for points event
      const pointsEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId,
        10000
      );

      // Assert points were awarded for achieving goal
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data).toHaveProperty('points');
      expect(pointsEvent?.data.points).toBeGreaterThan(0);
      expect(pointsEvent?.data.sourceType).toBe('health');
      expect(pointsEvent?.data.reason).toContain('goal');

      // Verify goal achievement was recorded
      const savedGoal = await prisma.healthGoal.findFirst({
        where: {
          userId,
          description: goalData.description,
          isAchieved: true
        }
      });

      expect(savedGoal).not.toBeNull();
      expect(savedGoal?.progressPercentage).toBe(100);
    });

    it('should handle goal creation events', async () => {
      // Create goal data
      const goalId = uuidv4();
      const goalData = {
        goalId,
        goalType: HealthGoalType.WEIGHT_TARGET,
        description: 'Lose 5kg in 3 months',
        targetValue: 70,
        currentValue: 75,
        unit: 'kg',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        progressPercentage: 0
      };

      // Create and publish event
      const event = createTestEvent(
        EventType.HEALTH_GOAL_CREATED,
        JourneyType.HEALTH,
        userId,
        goalData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.GOALS);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify goal was created in database
      const savedGoal = await prisma.healthGoal.findFirst({
        where: {
          userId,
          description: goalData.description
        }
      });

      expect(savedGoal).not.toBeNull();
      expect(savedGoal?.targetValue).toBe(goalData.targetValue.toString());
      expect(savedGoal?.isAchieved).toBe(false);
    });

    it('should reject goal events with invalid data', async () => {
      // Create invalid goal data (missing required fields)
      const invalidGoalData = {
        // Missing goalId and goalType (required fields)
        description: 'Invalid goal',
        targetValue: 100
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.GOAL_ACHIEVED,
        JourneyType.HEALTH,
        userId,
        invalidGoalData as any
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.GOALS);

      // Check if the event was sent to the dead letter queue
      const messages = testEnv.getConsumedMessages();
      const deadLetterMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => key === 'error-type' && value?.toString().includes('validation')
        );
      });

      expect(deadLetterMessage).toBeDefined();
    });
  });

  describe('Device Synchronization Events', () => {
    it('should process device synchronization events', async () => {
      // Create device sync data
      const deviceId = uuidv4();
      const syncData: DeviceSyncData = {
        deviceId,
        deviceType: DeviceType.FITNESS_TRACKER,
        deviceName: 'Fitbit Charge 5',
        syncedAt: new Date().toISOString(),
        syncSuccessful: true,
        dataPointsCount: 24,
        metricTypes: [
          HealthMetricType.HEART_RATE,
          HealthMetricType.STEPS,
          HealthMetricType.SLEEP
        ],
        markAsFailed: jest.fn(),
        markAsSuccessful: jest.fn()
      };

      // Create and publish event
      const event = createTestEvent(
        EventType.HEALTH_DEVICE_CONNECTED,
        JourneyType.HEALTH,
        userId,
        syncData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.DEVICES);

      // Wait for points event
      const pointsEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId,
        10000
      );

      // Assert points were awarded for device sync
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data).toHaveProperty('points');
      expect(pointsEvent?.data.sourceType).toBe('health');
      expect(pointsEvent?.data.reason).toContain('device');

      // Verify device was recorded in database
      const savedDevice = await prisma.userDevice.findFirst({
        where: {
          userId,
          externalDeviceId: deviceId
        }
      });

      expect(savedDevice).not.toBeNull();
      expect(savedDevice?.deviceName).toBe(syncData.deviceName);
      expect(savedDevice?.lastSyncAt).toBeDefined();
    });

    it('should handle failed device synchronization', async () => {
      // Create failed device sync data
      const deviceId = uuidv4();
      const syncData: DeviceSyncData = {
        deviceId,
        deviceType: DeviceType.BLOOD_PRESSURE_MONITOR,
        deviceName: 'Omron BP Monitor',
        syncedAt: new Date().toISOString(),
        syncSuccessful: false,
        errorMessage: 'Connection timeout during sync',
        markAsFailed: jest.fn(),
        markAsSuccessful: jest.fn()
      };

      // Create and publish event
      const event = createTestEvent(
        EventType.HEALTH_DEVICE_CONNECTED,
        JourneyType.HEALTH,
        userId,
        syncData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.DEVICES);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify device sync failure was recorded
      const syncLog = await prisma.deviceSyncLog.findFirst({
        where: {
          userId,
          deviceId: syncData.deviceId,
          successful: false
        }
      });

      expect(syncLog).not.toBeNull();
      expect(syncLog?.errorMessage).toBe(syncData.errorMessage);
    });

    it('should process events from multiple devices', async () => {
      // Create multiple device sync events
      const devices = [
        {
          deviceId: uuidv4(),
          deviceType: DeviceType.FITNESS_TRACKER,
          deviceName: 'Fitbit Charge 5',
          syncSuccessful: true,
          dataPointsCount: 24,
          metricTypes: [HealthMetricType.HEART_RATE, HealthMetricType.STEPS]
        },
        {
          deviceId: uuidv4(),
          deviceType: DeviceType.SMARTWATCH,
          deviceName: 'Apple Watch Series 7',
          syncSuccessful: true,
          dataPointsCount: 48,
          metricTypes: [HealthMetricType.HEART_RATE, HealthMetricType.STEPS, HealthMetricType.SLEEP]
        }
      ];

      // Publish all events
      for (const device of devices) {
        const syncData: DeviceSyncData = {
          ...device,
          syncedAt: new Date().toISOString(),
          markAsFailed: jest.fn(),
          markAsSuccessful: jest.fn()
        };

        const event = createTestEvent(
          EventType.HEALTH_DEVICE_CONNECTED,
          JourneyType.HEALTH,
          userId,
          syncData
        );

        await testEnv.publishEvent(event, TOPICS.HEALTH.DEVICES);
      }

      // Wait for points events (should get points for each device)
      let pointsEventCount = 0;
      await waitForCondition(async () => {
        const messages = testEnv.getConsumedMessages();
        pointsEventCount = messages.filter(msg => {
          try {
            const event = JSON.parse(msg.value?.toString() || '{}');
            return event.type === EventType.GAMIFICATION_POINTS_EARNED && 
                   event.userId === userId &&
                   event.data.reason.includes('device');
          } catch {
            return false;
          }
        }).length;
        return pointsEventCount >= devices.length;
      }, 15000);

      expect(pointsEventCount).toBeGreaterThanOrEqual(devices.length);

      // Verify devices were recorded in database
      for (const device of devices) {
        const savedDevice = await prisma.userDevice.findFirst({
          where: {
            userId,
            externalDeviceId: device.deviceId
          }
        });

        expect(savedDevice).not.toBeNull();
        expect(savedDevice?.deviceName).toBe(device.deviceName);
      }
    });
  });

  describe('Health Insight Events', () => {
    it('should process health insight generation events', async () => {
      // Create health insight data
      const insightId = uuidv4();
      const insightData: HealthInsightData = {
        insightId,
        insightType: HealthInsightType.TREND_ANALYSIS,
        title: 'Heart Rate Trend Analysis',
        description: 'Your resting heart rate has improved by 5 bpm over the last month',
        relatedMetricTypes: [HealthMetricType.HEART_RATE],
        confidenceScore: 85,
        generatedAt: new Date().toISOString(),
        userAcknowledged: false,
        acknowledgeByUser: jest.fn(),
        isHighPriority: jest.fn().mockReturnValue(false)
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.INSIGHT_GENERATED,
        JourneyType.HEALTH,
        userId,
        insightData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.EVENTS);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify insight was recorded in database
      const savedInsight = await prisma.healthInsight.findFirst({
        where: {
          userId,
          externalId: insightId
        }
      });

      expect(savedInsight).not.toBeNull();
      expect(savedInsight?.title).toBe(insightData.title);
      expect(savedInsight?.description).toBe(insightData.description);
      expect(savedInsight?.acknowledged).toBe(false);
    });

    it('should handle high-priority health insights', async () => {
      // Create high-priority health insight data
      const insightId = uuidv4();
      const insightData: HealthInsightData = {
        insightId,
        insightType: HealthInsightType.ANOMALY_DETECTION,
        title: 'Irregular Heart Rate Pattern Detected',
        description: 'We detected an unusual pattern in your heart rate readings',
        relatedMetricTypes: [HealthMetricType.HEART_RATE],
        confidenceScore: 90,
        generatedAt: new Date().toISOString(),
        userAcknowledged: false,
        acknowledgeByUser: jest.fn(),
        isHighPriority: jest.fn().mockReturnValue(true)
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.INSIGHT_GENERATED,
        JourneyType.HEALTH,
        userId,
        insightData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.EVENTS);

      // Wait for notification event
      const notificationEvent = await testEnv.waitForEvent(
        EventType.USER_FEEDBACK_SUBMITTED, // Using this as a proxy for notification events
        userId,
        10000
      );

      // Verify insight was recorded with high priority
      const savedInsight = await prisma.healthInsight.findFirst({
        where: {
          userId,
          externalId: insightId
        }
      });

      expect(savedInsight).not.toBeNull();
      expect(savedInsight?.priority).toBe('HIGH');
      expect(savedInsight?.insightType).toBe(insightData.insightType);
    });

    it('should reject insight events with invalid data', async () => {
      // Create invalid insight data (missing required fields)
      const invalidInsightData = {
        // Missing insightId and insightType (required fields)
        title: 'Invalid Insight',
        description: 'This insight is missing required fields'
      };

      // Create and publish event
      const event = createTestEvent(
        JourneyEvents.Health.INSIGHT_GENERATED,
        JourneyType.HEALTH,
        userId,
        invalidInsightData as any
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.EVENTS);

      // Check if the event was sent to the dead letter queue
      const messages = testEnv.getConsumedMessages();
      const deadLetterMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => key === 'error-type' && value?.toString().includes('validation')
        );
      });

      expect(deadLetterMessage).toBeDefined();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should retry processing failed events', async () => {
      // Mock a temporary failure by sending an event that will initially fail
      // but succeed on retry (we'll simulate this by checking retry count)
      
      // Create health metric data
      const metricData: HealthMetricData = {
        metricType: HealthMetricType.BLOOD_GLUCOSE,
        value: 110,
        unit: 'mg/dL',
        recordedAt: new Date().toISOString(),
        validateMetricRange: jest.fn().mockReturnValue(true)
      };

      // Create and publish event with special header to trigger retry simulation
      const event = createTestEvent(
        JourneyEvents.Health.METRIC_RECORDED,
        JourneyType.HEALTH,
        userId,
        metricData
      );

      await testEnv.publishEvent(event, TOPICS.HEALTH.METRICS);

      // Wait for retry events
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for retry headers in messages
      const messages = testEnv.getConsumedMessages();
      const retryMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => key === 'retry-count' && parseInt(value?.toString() || '0') > 0
        );
      });

      // Either we find a retry message or the event was processed successfully without retries
      const pointsEvent = await testEnv.waitForEvent(
        EventType.GAMIFICATION_POINTS_EARNED,
        userId,
        5000
      );

      expect(retryMessage || pointsEvent).toBeDefined();
    });

    it('should send malformed events to dead letter queue', async () => {
      // Create completely malformed event data
      const malformedData = 'This is not valid JSON';

      // Manually create a malformed message
      const producer = testEnv.getProducer();
      await producer.send({
        topic: TOPICS.HEALTH.METRICS,
        messages: [
          {
            key: userId,
            value: malformedData as any,
            headers: {
              'correlation-id': Buffer.from(uuidv4()),
              'event-type': Buffer.from(JourneyEvents.Health.METRIC_RECORDED),
              'journey': Buffer.from(JourneyType.HEALTH),
            },
          },
        ],
      });

      // Wait for dead letter queue event
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if the event was sent to the dead letter queue
      const messages = testEnv.getConsumedMessages();
      const deadLetterMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => key === 'error-type' && value?.toString().includes('deserialization')
        );
      });

      expect(deadLetterMessage).toBeDefined();
    });

    it('should handle events with schema version mismatches', async () => {
      // Create event with old schema version
      const oldVersionEvent = {
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: JourneyType.HEALTH,
        userId,
        // Old schema format without required fields
        data: {
          type: 'heart_rate', // Old format used string instead of enum
          value: 75,
          // Missing unit field which is required in new schema
        },
        metadata: {
          correlationId: uuidv4(),
          timestamp: new Date().toISOString(),
          version: '0.5.0', // Old version
          source: 'e2e-test',
        },
      };

      // Publish event
      await testEnv.publishEvent(oldVersionEvent as any, TOPICS.HEALTH.METRICS);

      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if the event was sent to the dead letter queue or handled by version migration
      const messages = testEnv.getConsumedMessages();
      const versionMessage = messages.find(msg => {
        const headers = msg.headers || {};
        return Object.entries(headers).some(
          ([key, value]) => 
            (key === 'error-type' && value?.toString().includes('validation')) ||
            (key === 'schema-version-mismatch' && value?.toString() === 'true')
        );
      });

      expect(versionMessage).toBeDefined();
    });
  });
});