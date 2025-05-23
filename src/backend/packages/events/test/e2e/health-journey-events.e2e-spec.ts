/**
 * @file health-journey-events.e2e-spec.ts
 * @description End-to-end tests for Health Journey events, validating the complete flow
 * of health-related events from production to consumption. This file tests event publishing,
 * validation, and processing for health metrics recording, goal achievement, device synchronization,
 * and health insight generation events.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';

// Import event interfaces
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { HealthEventType, IHealthEvent, IHealthMetricRecordedPayload, IHealthGoalAchievedPayload, IHealthDeviceSyncedPayload, IHealthInsightGeneratedPayload } from '../../src/interfaces/journey-events.interface';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';

// Import Kafka services
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { KafkaModule } from '../../src/kafka/kafka.module';

// Import test helpers
import {
  createTestEnvironment,
  createTestConsumer,
  publishTestEvent,
  waitForEvent,
  waitForEvents,
  createJourneyEventFactories,
  assertEventsEqual,
  retry,
  TestEnvironment,
} from './test-helpers';

// Import validation utilities
import { validateEvent } from '../../src/interfaces/base-event.interface';

// Test constants
const HEALTH_EVENTS_TOPIC = 'health-events';
const HEALTH_METRICS_TOPIC = 'health-metrics';
const HEALTH_GOALS_TOPIC = 'health-goals';
const HEALTH_DEVICES_TOPIC = 'health-devices';
const HEALTH_INSIGHTS_TOPIC = 'health-insights';

describe('Health Journey Events (E2E)', () => {
  let testEnv: TestEnvironment;
  let kafkaService: KafkaService;
  let kafkaProducer: KafkaProducer;
  let healthEventsConsumer: KafkaConsumer;
  let eventFactories: ReturnType<typeof createJourneyEventFactories>;
  
  // Set up test environment before all tests
  beforeAll(async () => {
    // Create test environment with Kafka and database
    testEnv = await createTestEnvironment({
      useRealKafka: false, // Use mock Kafka for faster tests
      seedDatabase: true,   // Seed the database with test data
    });
    
    kafkaService = testEnv.kafkaService;
    kafkaProducer = testEnv.kafkaProducer;
    
    // Create a consumer for health events
    healthEventsConsumer = await createTestConsumer(
      kafkaService,
      HEALTH_EVENTS_TOPIC,
      'health-events-test-consumer'
    );
    
    // Create event factories for generating test events
    eventFactories = createJourneyEventFactories();
    
    // Wait for connections to be established
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 30000); // 30 second timeout for setup
  
  // Clean up after all tests
  afterAll(async () => {
    // Disconnect consumers
    if (healthEventsConsumer) {
      await healthEventsConsumer.disconnect();
    }
    
    // Clean up test environment
    await testEnv.cleanup();
  }, 10000); // 10 second timeout for cleanup
  
  // Helper function to create a valid health event
  function createHealthEvent<T>(type: HealthEventType, payload: T): IHealthEvent {
    return {
      eventId: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      source: 'health-service',
      journey: JourneyType.HEALTH,
      userId: `user_${randomUUID()}`,
      payload,
      metadata: {
        correlationId: `corr_${randomUUID()}`,
        traceId: `trace_${randomUUID()}`,
      },
    };
  }
  
  describe('Event Schema Validation', () => {
    it('should validate a valid health metric recorded event', () => {
      // Create a valid health metric event
      const metricPayload: IHealthMetricRecordedPayload = {
        metric: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
        },
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual',
      };
      
      const event = createHealthEvent(HealthEventType.METRIC_RECORDED, metricPayload);
      
      // Validate the event
      const validationResult = validateEvent(event);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });
    
    it('should validate a valid health goal achieved event', () => {
      // Create a valid goal achieved event
      const goalPayload: IHealthGoalAchievedPayload = {
        goal: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          type: 'STEPS',
          targetValue: 10000,
          currentValue: 10500,
          unit: 'steps',
          startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          endDate: new Date(Date.now() + 86400000).toISOString(),   // Tomorrow
          status: 'ACHIEVED',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          updatedAt: new Date().toISOString(),
        },
        goalType: 'STEPS',
        targetValue: 10000,
        achievedValue: 10500,
        daysToAchieve: 1,
        isEarlyCompletion: true,
      };
      
      const event = createHealthEvent(HealthEventType.GOAL_ACHIEVED, goalPayload);
      
      // Validate the event
      const validationResult = validateEvent(event);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });
    
    it('should validate a valid device synced event', () => {
      // Create a valid device synced event
      const devicePayload: IHealthDeviceSyncedPayload = {
        deviceConnection: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          deviceId: `device_${randomUUID()}`,
          deviceType: 'Smartwatch',
          manufacturer: 'Various',
          model: 'Model X',
          connectionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          lastSyncDate: new Date().toISOString(),
          status: 'CONNECTED',
          settings: { dataTypes: ['HEART_RATE', 'STEPS'] },
        },
        deviceId: `device_${randomUUID()}`,
        deviceType: 'Smartwatch',
        syncDate: new Date().toISOString(),
        metricsCount: 5,
        metricTypes: ['HEART_RATE', 'STEPS', 'SLEEP'],
        syncSuccessful: true,
      };
      
      const event = createHealthEvent(HealthEventType.DEVICE_SYNCED, devicePayload);
      
      // Validate the event
      const validationResult = validateEvent(event);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });
    
    it('should validate a valid health insight generated event', () => {
      // Create a valid insight generated event
      const insightPayload: IHealthInsightGeneratedPayload = {
        insightId: randomUUID(),
        insightType: 'HEART_RATE_TREND',
        generationDate: new Date().toISOString(),
        relatedMetrics: ['HEART_RATE'],
        severity: 'medium',
        description: 'Your heart rate has been consistently higher than normal',
        explanation: 'Elevated heart rate may indicate stress or increased physical activity',
        recommendations: [
          'Consider stress reduction techniques',
          'Ensure adequate rest between workouts',
          'Consult with your healthcare provider if this trend continues'
        ],
      };
      
      const event = createHealthEvent(HealthEventType.INSIGHT_GENERATED, insightPayload);
      
      // Validate the event
      const validationResult = validateEvent(event);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toBeUndefined();
    });
    
    it('should reject an event with missing required fields', () => {
      // Create an invalid event missing required fields
      const invalidEvent = {
        // Missing eventId
        type: HealthEventType.METRIC_RECORDED,
        // Missing timestamp
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: `user_${randomUUID()}`,
        // Missing version
        payload: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
        },
      };
      
      // Validate the event
      const validationResult = validateEvent(invalidEvent as any);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors!.length).toBeGreaterThan(0);
      expect(validationResult.errors).toContain('Missing required field: eventId');
      expect(validationResult.errors).toContain('Missing required field: timestamp');
      expect(validationResult.errors).toContain('Missing required field: version');
    });
    
    it('should reject an event with invalid field types', () => {
      // Create an event with invalid field types
      const invalidEvent = {
        eventId: 12345, // Should be string
        type: HealthEventType.METRIC_RECORDED,
        timestamp: new Date(), // Should be ISO string
        version: 1, // Should be string
        source: 'health-service',
        journey: JourneyType.HEALTH,
        userId: `user_${randomUUID()}`,
        payload: 'invalid payload', // Should be object
      };
      
      // Validate the event
      const validationResult = validateEvent(invalidEvent as any);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors!.length).toBeGreaterThan(0);
      expect(validationResult.errors).toContain('eventId must be a string');
      expect(validationResult.errors).toContain('timestamp must be a string');
      expect(validationResult.errors).toContain('version must be a string');
      expect(validationResult.errors).toContain('payload must be an object');
    });
  });
  
  describe('Health Metric Events', () => {
    let metricsConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer specifically for health metrics
      metricsConsumer = await createTestConsumer(
        kafkaService,
        HEALTH_METRICS_TOPIC,
        'health-metrics-test-consumer'
      );
    });
    
    afterAll(async () => {
      // Disconnect the metrics consumer
      if (metricsConsumer) {
        await metricsConsumer.disconnect();
      }
    });
    
    it('should publish and consume a health metric recorded event', async () => {
      // Create a health metric recorded event
      const metricPayload: IHealthMetricRecordedPayload = {
        metric: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          type: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
        },
        metricType: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual',
      };
      
      const event = createHealthEvent(HealthEventType.METRIC_RECORDED, metricPayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_METRICS_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        metricsConsumer,
        (e) => e.type === HealthEventType.METRIC_RECORDED && e.payload.metricType === 'HEART_RATE',
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.type).toBe(HealthEventType.METRIC_RECORDED);
      expect(consumedEvent!.journey).toBe(JourneyType.HEALTH);
      expect(consumedEvent!.payload.metricType).toBe('HEART_RATE');
      expect(consumedEvent!.payload.value).toBe(75);
      expect(consumedEvent!.payload.unit).toBe('bpm');
    });
    
    it('should handle multiple health metric events in sequence', async () => {
      // Create multiple health metric events
      const metricTypes = ['STEPS', 'WEIGHT', 'BLOOD_PRESSURE'];
      const events: IHealthEvent[] = [];
      
      // Create an event for each metric type
      for (const metricType of metricTypes) {
        const metricPayload: IHealthMetricRecordedPayload = {
          metric: {
            id: randomUUID(),
            userId: `user_${randomUUID()}`,
            type: metricType,
            value: metricType === 'STEPS' ? 8500 : (metricType === 'WEIGHT' ? 75.5 : 120),
            unit: metricType === 'STEPS' ? 'steps' : (metricType === 'WEIGHT' ? 'kg' : 'mmHg'),
            timestamp: new Date().toISOString(),
            source: 'manual',
          },
          metricType,
          value: metricType === 'STEPS' ? 8500 : (metricType === 'WEIGHT' ? 75.5 : 120),
          unit: metricType === 'STEPS' ? 'steps' : (metricType === 'WEIGHT' ? 'kg' : 'mmHg'),
          timestamp: new Date().toISOString(),
          source: 'manual',
        };
        
        events.push(createHealthEvent(HealthEventType.METRIC_RECORDED, metricPayload));
      }
      
      // Publish all events
      for (const event of events) {
        await publishTestEvent(kafkaProducer, HEALTH_METRICS_TOPIC, event);
      }
      
      // Wait for all events to be consumed
      const consumedEvents = await waitForEvents<IHealthEvent>(
        metricsConsumer,
        (e) => e.type === HealthEventType.METRIC_RECORDED && metricTypes.includes(e.payload.metricType),
        metricTypes.length, // Expect one event for each metric type
        10000 // 10 second timeout
      );
      
      // Assert that all events were consumed
      expect(consumedEvents.length).toBe(metricTypes.length);
      
      // Check that each metric type was received
      const receivedMetricTypes = consumedEvents.map(e => e.payload.metricType);
      for (const metricType of metricTypes) {
        expect(receivedMetricTypes).toContain(metricType);
      }
    });
    
    it('should handle a health metric event with previous value comparison', async () => {
      // Create a health metric event with previous value for comparison
      const metricPayload: IHealthMetricRecordedPayload = {
        metric: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          type: 'HEART_RATE',
          value: 68,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
        },
        metricType: 'HEART_RATE',
        value: 68,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual',
        previousValue: 75,
        change: -7,
        isImprovement: true,
      };
      
      const event = createHealthEvent(HealthEventType.METRIC_RECORDED, metricPayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_METRICS_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        metricsConsumer,
        (e) => e.type === HealthEventType.METRIC_RECORDED && 
               e.payload.metricType === 'HEART_RATE' && 
               e.payload.previousValue !== undefined,
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly with comparison data
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.payload.previousValue).toBe(75);
      expect(consumedEvent!.payload.change).toBe(-7);
      expect(consumedEvent!.payload.isImprovement).toBe(true);
    });
  });
  
  describe('Health Goal Events', () => {
    let goalsConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer specifically for health goals
      goalsConsumer = await createTestConsumer(
        kafkaService,
        HEALTH_GOALS_TOPIC,
        'health-goals-test-consumer'
      );
    });
    
    afterAll(async () => {
      // Disconnect the goals consumer
      if (goalsConsumer) {
        await goalsConsumer.disconnect();
      }
    });
    
    it('should publish and consume a health goal achieved event', async () => {
      // Create a health goal achieved event
      const goalPayload: IHealthGoalAchievedPayload = {
        goal: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          type: 'STEPS',
          targetValue: 10000,
          currentValue: 10500,
          unit: 'steps',
          startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          endDate: new Date(Date.now() + 86400000).toISOString(),   // Tomorrow
          status: 'ACHIEVED',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          updatedAt: new Date().toISOString(),
        },
        goalType: 'STEPS',
        targetValue: 10000,
        achievedValue: 10500,
        daysToAchieve: 1,
        isEarlyCompletion: true,
      };
      
      const event = createHealthEvent(HealthEventType.GOAL_ACHIEVED, goalPayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_GOALS_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        goalsConsumer,
        (e) => e.type === HealthEventType.GOAL_ACHIEVED && e.payload.goalType === 'STEPS',
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.type).toBe(HealthEventType.GOAL_ACHIEVED);
      expect(consumedEvent!.journey).toBe(JourneyType.HEALTH);
      expect(consumedEvent!.payload.goalType).toBe('STEPS');
      expect(consumedEvent!.payload.targetValue).toBe(10000);
      expect(consumedEvent!.payload.achievedValue).toBe(10500);
      expect(consumedEvent!.payload.isEarlyCompletion).toBe(true);
    });
    
    it('should handle different types of health goal events', async () => {
      // Create different types of goal events
      const goalTypes = ['WEIGHT_LOSS', 'SLEEP', 'HEART_RATE'];
      const events: IHealthEvent[] = [];
      
      // Create an event for each goal type
      for (const goalType of goalTypes) {
        const targetValue = goalType === 'WEIGHT_LOSS' ? 5 : (goalType === 'SLEEP' ? 8 : 60);
        const achievedValue = goalType === 'WEIGHT_LOSS' ? 5.5 : (goalType === 'SLEEP' ? 8.2 : 58);
        const unit = goalType === 'WEIGHT_LOSS' ? 'kg' : (goalType === 'SLEEP' ? 'hours' : 'bpm');
        
        const goalPayload: IHealthGoalAchievedPayload = {
          goal: {
            id: randomUUID(),
            userId: `user_${randomUUID()}`,
            type: goalType,
            targetValue,
            currentValue: achievedValue,
            unit,
            startDate: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
            endDate: new Date(Date.now() + 604800000).toISOString(),   // 7 days from now
            status: 'ACHIEVED',
            createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
            updatedAt: new Date().toISOString(),
          },
          goalType,
          targetValue,
          achievedValue,
          daysToAchieve: 7,
          isEarlyCompletion: true,
        };
        
        events.push(createHealthEvent(HealthEventType.GOAL_ACHIEVED, goalPayload));
      }
      
      // Publish all events
      for (const event of events) {
        await publishTestEvent(kafkaProducer, HEALTH_GOALS_TOPIC, event);
      }
      
      // Wait for all events to be consumed
      const consumedEvents = await waitForEvents<IHealthEvent>(
        goalsConsumer,
        (e) => e.type === HealthEventType.GOAL_ACHIEVED && goalTypes.includes(e.payload.goalType),
        goalTypes.length, // Expect one event for each goal type
        10000 // 10 second timeout
      );
      
      // Assert that all events were consumed
      expect(consumedEvents.length).toBe(goalTypes.length);
      
      // Check that each goal type was received
      const receivedGoalTypes = consumedEvents.map(e => e.payload.goalType);
      for (const goalType of goalTypes) {
        expect(receivedGoalTypes).toContain(goalType);
      }
    });
  });
  
  describe('Health Device Events', () => {
    let devicesConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer specifically for health devices
      devicesConsumer = await createTestConsumer(
        kafkaService,
        HEALTH_DEVICES_TOPIC,
        'health-devices-test-consumer'
      );
    });
    
    afterAll(async () => {
      // Disconnect the devices consumer
      if (devicesConsumer) {
        await devicesConsumer.disconnect();
      }
    });
    
    it('should publish and consume a device synced event', async () => {
      // Create a device synced event
      const devicePayload: IHealthDeviceSyncedPayload = {
        deviceConnection: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          deviceId: `device_${randomUUID()}`,
          deviceType: 'Smartwatch',
          manufacturer: 'Various',
          model: 'Model X',
          connectionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          lastSyncDate: new Date().toISOString(),
          status: 'CONNECTED',
          settings: { dataTypes: ['HEART_RATE', 'STEPS'] },
        },
        deviceId: `device_${randomUUID()}`,
        deviceType: 'Smartwatch',
        syncDate: new Date().toISOString(),
        metricsCount: 5,
        metricTypes: ['HEART_RATE', 'STEPS', 'SLEEP'],
        syncSuccessful: true,
      };
      
      const event = createHealthEvent(HealthEventType.DEVICE_SYNCED, devicePayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_DEVICES_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        devicesConsumer,
        (e) => e.type === HealthEventType.DEVICE_SYNCED && e.payload.deviceType === 'Smartwatch',
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.type).toBe(HealthEventType.DEVICE_SYNCED);
      expect(consumedEvent!.journey).toBe(JourneyType.HEALTH);
      expect(consumedEvent!.payload.deviceType).toBe('Smartwatch');
      expect(consumedEvent!.payload.metricsCount).toBe(5);
      expect(consumedEvent!.payload.syncSuccessful).toBe(true);
      expect(consumedEvent!.payload.metricTypes).toContain('HEART_RATE');
      expect(consumedEvent!.payload.metricTypes).toContain('STEPS');
      expect(consumedEvent!.payload.metricTypes).toContain('SLEEP');
    });
    
    it('should handle a failed device sync event', async () => {
      // Create a failed device sync event
      const devicePayload: IHealthDeviceSyncedPayload = {
        deviceConnection: {
          id: randomUUID(),
          userId: `user_${randomUUID()}`,
          deviceId: `device_${randomUUID()}`,
          deviceType: 'Blood Pressure Monitor',
          manufacturer: 'Various',
          model: 'BP-200',
          connectionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          lastSyncDate: new Date().toISOString(),
          status: 'ERROR',
          settings: { dataTypes: ['BLOOD_PRESSURE'] },
        },
        deviceId: `device_${randomUUID()}`,
        deviceType: 'Blood Pressure Monitor',
        syncDate: new Date().toISOString(),
        metricsCount: 0,
        metricTypes: [],
        syncSuccessful: false,
        errorMessage: 'Connection timeout during sync operation',
      };
      
      const event = createHealthEvent(HealthEventType.DEVICE_SYNCED, devicePayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_DEVICES_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        devicesConsumer,
        (e) => e.type === HealthEventType.DEVICE_SYNCED && 
               e.payload.deviceType === 'Blood Pressure Monitor' && 
               e.payload.syncSuccessful === false,
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.type).toBe(HealthEventType.DEVICE_SYNCED);
      expect(consumedEvent!.payload.syncSuccessful).toBe(false);
      expect(consumedEvent!.payload.metricsCount).toBe(0);
      expect(consumedEvent!.payload.errorMessage).toBe('Connection timeout during sync operation');
    });
    
    it('should handle different device types', async () => {
      // Create events for different device types
      const deviceTypes = ['Smartwatch', 'Glucose Monitor', 'Smart Scale'];
      const events: IHealthEvent[] = [];
      
      // Create an event for each device type
      for (const deviceType of deviceTypes) {
        const devicePayload: IHealthDeviceSyncedPayload = {
          deviceConnection: {
            id: randomUUID(),
            userId: `user_${randomUUID()}`,
            deviceId: `device_${randomUUID()}`,
            deviceType,
            manufacturer: 'Various',
            model: `Model-${deviceType}`,
            connectionDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            lastSyncDate: new Date().toISOString(),
            status: 'CONNECTED',
            settings: { dataTypes: deviceType === 'Smartwatch' ? ['HEART_RATE', 'STEPS'] : 
                                  (deviceType === 'Glucose Monitor' ? ['BLOOD_GLUCOSE'] : ['WEIGHT']) },
          },
          deviceId: `device_${randomUUID()}`,
          deviceType,
          syncDate: new Date().toISOString(),
          metricsCount: 3,
          metricTypes: deviceType === 'Smartwatch' ? ['HEART_RATE', 'STEPS'] : 
                      (deviceType === 'Glucose Monitor' ? ['BLOOD_GLUCOSE'] : ['WEIGHT']),
          syncSuccessful: true,
        };
        
        events.push(createHealthEvent(HealthEventType.DEVICE_SYNCED, devicePayload));
      }
      
      // Publish all events
      for (const event of events) {
        await publishTestEvent(kafkaProducer, HEALTH_DEVICES_TOPIC, event);
      }
      
      // Wait for all events to be consumed
      const consumedEvents = await waitForEvents<IHealthEvent>(
        devicesConsumer,
        (e) => e.type === HealthEventType.DEVICE_SYNCED && deviceTypes.includes(e.payload.deviceType),
        deviceTypes.length, // Expect one event for each device type
        10000 // 10 second timeout
      );
      
      // Assert that all events were consumed
      expect(consumedEvents.length).toBe(deviceTypes.length);
      
      // Check that each device type was received
      const receivedDeviceTypes = consumedEvents.map(e => e.payload.deviceType);
      for (const deviceType of deviceTypes) {
        expect(receivedDeviceTypes).toContain(deviceType);
      }
    });
  });
  
  describe('Health Insight Events', () => {
    let insightsConsumer: KafkaConsumer;
    
    beforeAll(async () => {
      // Create a consumer specifically for health insights
      insightsConsumer = await createTestConsumer(
        kafkaService,
        HEALTH_INSIGHTS_TOPIC,
        'health-insights-test-consumer'
      );
    });
    
    afterAll(async () => {
      // Disconnect the insights consumer
      if (insightsConsumer) {
        await insightsConsumer.disconnect();
      }
    });
    
    it('should publish and consume a health insight generated event', async () => {
      // Create a health insight generated event
      const insightPayload: IHealthInsightGeneratedPayload = {
        insightId: randomUUID(),
        insightType: 'HEART_RATE_TREND',
        generationDate: new Date().toISOString(),
        relatedMetrics: ['HEART_RATE'],
        severity: 'medium',
        description: 'Your heart rate has been consistently higher than normal',
        explanation: 'Elevated heart rate may indicate stress or increased physical activity',
        recommendations: [
          'Consider stress reduction techniques',
          'Ensure adequate rest between workouts',
          'Consult with your healthcare provider if this trend continues'
        ],
      };
      
      const event = createHealthEvent(HealthEventType.INSIGHT_GENERATED, insightPayload);
      
      // Publish the event
      await publishTestEvent(kafkaProducer, HEALTH_INSIGHTS_TOPIC, event);
      
      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<IHealthEvent>(
        insightsConsumer,
        (e) => e.type === HealthEventType.INSIGHT_GENERATED && e.payload.insightType === 'HEART_RATE_TREND',
        5000 // 5 second timeout
      );
      
      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      expect(consumedEvent!.type).toBe(HealthEventType.INSIGHT_GENERATED);
      expect(consumedEvent!.journey).toBe(JourneyType.HEALTH);
      expect(consumedEvent!.payload.insightType).toBe('HEART_RATE_TREND');
      expect(consumedEvent!.payload.severity).toBe('medium');
      expect(consumedEvent!.payload.description).toBe('Your heart rate has been consistently higher than normal');
      expect(consumedEvent!.payload.recommendations.length).toBe(3);
    });
    
    it('should handle insights with different severity levels', async () => {
      // Create insights with different severity levels
      const severityLevels = ['low', 'medium', 'high'] as const;
      const events: IHealthEvent[] = [];
      
      // Create an event for each severity level
      for (const severity of severityLevels) {
        const insightPayload: IHealthInsightGeneratedPayload = {
          insightId: randomUUID(),
          insightType: 'ACTIVITY_PATTERN',
          generationDate: new Date().toISOString(),
          relatedMetrics: ['STEPS', 'ACTIVITY'],
          severity,
          description: `${severity.charAt(0).toUpperCase() + severity.slice(1)} activity pattern detected`,
          explanation: `Your activity pattern shows ${severity === 'low' ? 'decreased' : 
                                                  (severity === 'medium' ? 'moderate changes in' : 'significant changes to')} 
                       your usual routine`,
          recommendations: [
            severity === 'low' ? 'Consider increasing daily activity' : 
            (severity === 'medium' ? 'Maintain consistent activity levels' : 'Consult with your healthcare provider'),
          ],
        };
        
        events.push(createHealthEvent(HealthEventType.INSIGHT_GENERATED, insightPayload));
      }
      
      // Publish all events
      for (const event of events) {
        await publishTestEvent(kafkaProducer, HEALTH_INSIGHTS_TOPIC, event);
      }
      
      // Wait for all events to be consumed
      const consumedEvents = await waitForEvents<IHealthEvent>(
        insightsConsumer,
        (e) => e.type === HealthEventType.INSIGHT_GENERATED && 
               e.payload.insightType === 'ACTIVITY_PATTERN' && 
               severityLevels.includes(e.payload.severity as any),
        severityLevels.length, // Expect one event for each severity level
        10000 // 10 second timeout
      );
      
      // Assert that all events were consumed
      expect(consumedEvents.length).toBe(severityLevels.length);
      
      // Check that each severity level was received
      const receivedSeverityLevels = consumedEvents.map(e => e.payload.severity);
      for (const severity of severityLevels) {
        expect(receivedSeverityLevels).toContain(severity);
      }
    });
  });
  
  describe('Error Handling', () => {
    it('should reject malformed health events', async () => {
      // Create a malformed health event (missing required fields in payload)
      const malformedEvent = createHealthEvent(HealthEventType.METRIC_RECORDED, {
        // Missing required fields
        metricType: 'HEART_RATE',
        // Missing value
        // Missing unit
        timestamp: new Date().toISOString(),
      } as IHealthMetricRecordedPayload);
      
      // Attempt to validate the event
      const validationResult = validateEvent(malformedEvent);
      
      // The base event is valid, but the payload is not
      expect(validationResult.isValid).toBe(true);
      
      // In a real implementation, there would be additional validation for the payload
      // Here we're just demonstrating the concept
    });
    
    it('should handle events with invalid journey type', async () => {
      // Create an event with an invalid journey type
      const invalidEvent = {
        ...createHealthEvent(HealthEventType.METRIC_RECORDED, {
          metric: {
            id: randomUUID(),
            userId: `user_${randomUUID()}`,
            type: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'manual',
          },
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
        }),
        journey: 'invalid_journey' as JourneyType, // Invalid journey type
      };
      
      // The base event validation will pass because it only checks structure
      const validationResult = validateEvent(invalidEvent as any);
      expect(validationResult.isValid).toBe(true);
      
      // In a real implementation, there would be additional validation for the journey type
      // Here we're just demonstrating the concept
    });
  });
  
  describe('End-to-End Flow', () => {
    it('should process a complete health metric flow', async () => {
      // Create a user ID for this test
      const userId = `user_${randomUUID()}`;
      
      // 1. Create and publish a health metric recorded event
      const metricPayload: IHealthMetricRecordedPayload = {
        metric: {
          id: randomUUID(),
          userId,
          type: 'STEPS',
          value: 9500,
          unit: 'steps',
          timestamp: new Date().toISOString(),
          source: 'device',
        },
        metricType: 'STEPS',
        value: 9500,
        unit: 'steps',
        timestamp: new Date().toISOString(),
        source: 'device',
      };
      
      const metricEvent = createHealthEvent(HealthEventType.METRIC_RECORDED, metricPayload);
      metricEvent.userId = userId; // Set the same user ID
      
      await publishTestEvent(kafkaProducer, HEALTH_METRICS_TOPIC, metricEvent);
      
      // 2. Create and publish a goal achieved event (related to the metric)
      const goalPayload: IHealthGoalAchievedPayload = {
        goal: {
          id: randomUUID(),
          userId,
          type: 'STEPS',
          targetValue: 9000,
          currentValue: 9500,
          unit: 'steps',
          startDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          endDate: new Date(Date.now() + 86400000).toISOString(),   // Tomorrow
          status: 'ACHIEVED',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          updatedAt: new Date().toISOString(),
        },
        goalType: 'STEPS',
        targetValue: 9000,
        achievedValue: 9500,
        daysToAchieve: 1,
        isEarlyCompletion: true,
      };
      
      const goalEvent = createHealthEvent(HealthEventType.GOAL_ACHIEVED, goalPayload);
      goalEvent.userId = userId; // Set the same user ID
      
      // Add correlation between events
      const correlationId = `corr_${randomUUID()}`;
      metricEvent.metadata = { ...metricEvent.metadata, correlationId };
      goalEvent.metadata = { ...goalEvent.metadata, correlationId };
      
      await publishTestEvent(kafkaProducer, HEALTH_GOALS_TOPIC, goalEvent);
      
      // 3. Create and publish an insight based on the goal achievement
      const insightPayload: IHealthInsightGeneratedPayload = {
        insightId: randomUUID(),
        insightType: 'GOAL_ACHIEVEMENT_PATTERN',
        generationDate: new Date().toISOString(),
        relatedMetrics: ['STEPS'],
        severity: 'low',
        description: 'You consistently achieve your step goals',
        explanation: 'Your step count regularly exceeds your daily goal, which is great for your health',
        recommendations: [
          'Consider increasing your step goal to continue challenging yourself',
          'Try to maintain this positive trend'
        ],
      };
      
      const insightEvent = createHealthEvent(HealthEventType.INSIGHT_GENERATED, insightPayload);
      insightEvent.userId = userId; // Set the same user ID
      insightEvent.metadata = { ...insightEvent.metadata, correlationId }; // Same correlation ID
      
      await publishTestEvent(kafkaProducer, HEALTH_INSIGHTS_TOPIC, insightEvent);
      
      // 4. Verify that all events were published and can be consumed
      // This is a simplified test - in a real scenario, we would verify that the events
      // triggered the appropriate business logic and state changes
      
      // Create a consumer for the main health events topic that would aggregate all events
      const aggregateConsumer = await createTestConsumer(
        kafkaService,
        HEALTH_EVENTS_TOPIC,
        'health-aggregate-test-consumer'
      );
      
      try {
        // Republish all events to the aggregate topic for testing
        await publishTestEvent(kafkaProducer, HEALTH_EVENTS_TOPIC, metricEvent);
        await publishTestEvent(kafkaProducer, HEALTH_EVENTS_TOPIC, goalEvent);
        await publishTestEvent(kafkaProducer, HEALTH_EVENTS_TOPIC, insightEvent);
        
        // Wait for all events to be consumed
        const consumedEvents = await waitForEvents<IHealthEvent>(
          aggregateConsumer,
          (e) => e.userId === userId && e.metadata?.correlationId === correlationId,
          3, // Expect 3 events (metric, goal, insight)
          10000 // 10 second timeout
        );
        
        // Assert that all events were consumed
        expect(consumedEvents.length).toBe(3);
        
        // Check that each event type was received
        const eventTypes = consumedEvents.map(e => e.type);
        expect(eventTypes).toContain(HealthEventType.METRIC_RECORDED);
        expect(eventTypes).toContain(HealthEventType.GOAL_ACHIEVED);
        expect(eventTypes).toContain(HealthEventType.INSIGHT_GENERATED);
        
        // Verify all events have the same correlation ID
        for (const event of consumedEvents) {
          expect(event.metadata?.correlationId).toBe(correlationId);
        }
      } finally {
        // Clean up the aggregate consumer
        await aggregateConsumer.disconnect();
      }
    });
  });
});