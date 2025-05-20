/**
 * @file health-event.dto.spec.ts
 * @description Unit tests for the HealthEventDto class that validate health journey-specific event structures.
 * Tests verify correct validation of health metric recording, goal achievement, device synchronization, and
 * health insight generation events, ensuring proper payload structure and field validation.
 *
 * @module events/test/unit/dto
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import {
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto,
  HealthEventDto,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType,
  HealthMetricData,
  HealthGoalData,
  DeviceSyncData,
  HealthInsightData
} from '../../../src/dto/health-event.dto';

import {
  createHealthMetricRecordedEvent,
  createHealthGoalAchievedEvent,
  createDeviceSynchronizedEvent,
  createHealthInsightGeneratedEvent,
  createInvalidEvent,
  createEventWithInvalidValues,
  isValidEventDto,
  validateEventDto
} from './test-utils';

describe('HealthEventDto', () => {
  describe('Base HealthEventDto', () => {
    it('should validate a valid health event', async () => {
      // Create a valid health metric event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Cast to base HealthEventDto
      const healthEvent = plainToInstance(HealthEventDto, validEvent);
      
      // Validate
      const isValid = await isValidEventDto(healthEvent);
      expect(isValid).toBe(true);
    });

    it('should enforce journey field to be "health"', async () => {
      // Create a valid health metric event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Modify journey field
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        journey: 'care' // Not 'health'
      });
      
      // Cast to HealthEventDto
      const healthEvent = plainToInstance(HealthEventDto, invalidEvent);
      
      // Override the journey field (which is set to 'health' in the constructor)
      Object.defineProperty(healthEvent, 'journey', {
        value: 'care',
        writable: true
      });
      
      // Validate
      const errors = await validate(healthEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should validate data field is an object', async () => {
      // Create a valid health metric event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Modify data field to be a string instead of an object
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        data: 'not an object'
      });
      
      // Cast to HealthEventDto
      const healthEvent = plainToInstance(HealthEventDto, invalidEvent);
      
      // Validate
      const errors = await validate(healthEvent);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isObject');
    });
  });

  describe('HealthMetricRecordedEventDto', () => {
    it('should validate a valid health metric recorded event', async () => {
      // Create a valid health metric event for each metric type
      for (const metricType of Object.values(HealthMetricType)) {
        const validEvent = createHealthMetricRecordedEvent(metricType);
        const isValid = await isValidEventDto(validEvent);
        expect(isValid).toBe(true);
      }
    });

    it('should reject events with missing required fields', async () => {
      // Create a valid event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Create invalid events by removing required fields
      const requiredFields = ['type', 'journey', 'userId', 'data.metricType', 'data.value', 'data.unit'];
      
      for (const field of requiredFields) {
        const invalidEvent = createInvalidEvent(validEvent, [field]);
        const dto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate metric type is a valid enum value', async () => {
      // Create a valid event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Modify metric type to an invalid value
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.metricType': 'INVALID_METRIC_TYPE'
      });
      
      const dto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });

    it('should validate metric values are within acceptable ranges', async () => {
      // Test each metric type with valid and invalid values
      const testCases = [
        { type: HealthMetricType.HEART_RATE, valid: 75, invalid: 300 }, // Too high
        { type: HealthMetricType.BLOOD_GLUCOSE, valid: 95, invalid: 700 }, // Too high
        { type: HealthMetricType.STEPS, valid: 8500, invalid: -100 }, // Negative
        { type: HealthMetricType.SLEEP, valid: 7.5, invalid: 30 }, // Too many hours
        { type: HealthMetricType.WEIGHT, valid: 70, invalid: 600 }, // Too high
        { type: HealthMetricType.TEMPERATURE, valid: 36.8, invalid: 50 }, // Too high
        { type: HealthMetricType.OXYGEN_SATURATION, valid: 98, invalid: 120 }, // Over 100%
        { type: HealthMetricType.RESPIRATORY_RATE, valid: 16, invalid: 150 } // Too high
      ];
      
      for (const testCase of testCases) {
        // Valid value
        const validEvent = createHealthMetricRecordedEvent(testCase.type, { value: testCase.valid });
        const validDto = plainToInstance(HealthMetricRecordedEventDto, validEvent);
        
        // Call the validateMetricRange method directly
        expect(validDto.data.validateMetricRange()).toBe(true);
        
        // Invalid value
        const invalidEvent = createHealthMetricRecordedEvent(testCase.type, { value: testCase.invalid });
        const invalidDto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
        
        // Call the validateMetricRange method directly
        expect(invalidDto.data.validateMetricRange()).toBe(false);
      }
    });

    it('should enforce type field to be "HEALTH_METRIC_RECORDED"', async () => {
      // Create a valid event
      const validEvent = createHealthMetricRecordedEvent();
      
      // Modify type field
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        type: 'SOME_OTHER_TYPE'
      });
      
      const dto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
      
      // Override the type field (which is set in the constructor)
      Object.defineProperty(dto, 'type', {
        value: 'SOME_OTHER_TYPE',
        writable: true
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('HealthGoalAchievedEventDto', () => {
    it('should validate a valid health goal achieved event', async () => {
      // Create a valid health goal achieved event for each goal type
      for (const goalType of Object.values(HealthGoalType)) {
        const validEvent = createHealthGoalAchievedEvent(goalType);
        const isValid = await isValidEventDto(validEvent);
        expect(isValid).toBe(true);
      }
    });

    it('should reject events with missing required fields', async () => {
      // Create a valid event
      const validEvent = createHealthGoalAchievedEvent();
      
      // Create invalid events by removing required fields
      const requiredFields = ['type', 'journey', 'userId', 'data.goalId', 'data.goalType', 'data.description'];
      
      for (const field of requiredFields) {
        const invalidEvent = createInvalidEvent(validEvent, [field]);
        const dto = plainToInstance(HealthGoalAchievedEventDto, invalidEvent);
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate goal type is a valid enum value', async () => {
      // Create a valid event
      const validEvent = createHealthGoalAchievedEvent();
      
      // Modify goal type to an invalid value
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.goalType': 'INVALID_GOAL_TYPE'
      });
      
      const dto = plainToInstance(HealthGoalAchievedEventDto, invalidEvent);
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });

    it('should validate progress percentage is between 0 and 100', async () => {
      // Create a valid event
      const validEvent = createHealthGoalAchievedEvent();
      
      // Test invalid progress percentages
      const invalidValues = [-10, 110, 200];
      
      for (const invalidValue of invalidValues) {
        const invalidEvent = createEventWithInvalidValues(validEvent, {
          'data.progressPercentage': invalidValue
        });
        
        const dto = plainToInstance(HealthGoalAchievedEventDto, invalidEvent);
        const errors = await validate(dto);
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('data');
      }
      
      // Test valid progress percentages
      const validValues = [0, 50, 100];
      
      for (const validValue of validValues) {
        const validProgressEvent = createEventWithInvalidValues(validEvent, {
          'data.progressPercentage': validValue
        });
        
        const dto = plainToInstance(HealthGoalAchievedEventDto, validProgressEvent);
        const errors = await validate(dto);
        
        expect(errors.length).toBe(0);
      }
    });

    it('should correctly determine if a goal is achieved', async () => {
      // Create a valid event with achieved goal
      const achievedEvent = createHealthGoalAchievedEvent();
      const achievedDto = plainToInstance(HealthGoalAchievedEventDto, achievedEvent);
      
      // Goal should be achieved (has achievedAt date and 100% progress)
      expect(achievedDto.data.isAchieved()).toBe(true);
      
      // Create a goal with progress but no achievedAt date
      const progressEvent = createHealthGoalAchievedEvent();
      delete progressEvent.data.achievedAt;
      progressEvent.data.progressPercentage = 75;
      
      const progressDto = plainToInstance(HealthGoalAchievedEventDto, progressEvent);
      expect(progressDto.data.isAchieved()).toBe(false);
      
      // Create a goal with 100% progress but no achievedAt date
      const completedEvent = createHealthGoalAchievedEvent();
      delete completedEvent.data.achievedAt;
      completedEvent.data.progressPercentage = 100;
      
      const completedDto = plainToInstance(HealthGoalAchievedEventDto, completedEvent);
      expect(completedDto.data.isAchieved()).toBe(true);
    });

    it('should enforce type field to be "HEALTH_GOAL_ACHIEVED"', async () => {
      // Create a valid event
      const validEvent = createHealthGoalAchievedEvent();
      
      // Modify type field
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        type: 'SOME_OTHER_TYPE'
      });
      
      const dto = plainToInstance(HealthGoalAchievedEventDto, invalidEvent);
      
      // Override the type field (which is set in the constructor)
      Object.defineProperty(dto, 'type', {
        value: 'SOME_OTHER_TYPE',
        writable: true
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('DeviceSynchronizedEventDto', () => {
    it('should validate a valid device synchronized event', async () => {
      // Create a valid device synchronized event for each device type
      for (const deviceType of Object.values(DeviceType)) {
        const validEvent = createDeviceSynchronizedEvent(deviceType);
        const isValid = await isValidEventDto(validEvent);
        expect(isValid).toBe(true);
      }
    });

    it('should reject events with missing required fields', async () => {
      // Create a valid event
      const validEvent = createDeviceSynchronizedEvent();
      
      // Create invalid events by removing required fields
      const requiredFields = ['type', 'journey', 'userId', 'data.deviceId', 'data.deviceType', 'data.deviceName', 'data.syncedAt', 'data.syncSuccessful'];
      
      for (const field of requiredFields) {
        const invalidEvent = createInvalidEvent(validEvent, [field]);
        const dto = plainToInstance(DeviceSynchronizedEventDto, invalidEvent);
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate device type is a valid enum value', async () => {
      // Create a valid event
      const validEvent = createDeviceSynchronizedEvent();
      
      // Modify device type to an invalid value
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.deviceType': 'INVALID_DEVICE_TYPE'
      });
      
      const dto = plainToInstance(DeviceSynchronizedEventDto, invalidEvent);
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });

    it('should correctly handle sync status changes', async () => {
      // Create a valid event with successful sync
      const successEvent = createDeviceSynchronizedEvent();
      const successDto = plainToInstance(DeviceSynchronizedEventDto, successEvent);
      
      // Sync should be successful
      expect(successDto.data.syncSuccessful).toBe(true);
      expect(successDto.data.errorMessage).toBeUndefined();
      
      // Mark as failed
      successDto.data.markAsFailed('Connection timeout');
      
      // Sync should now be failed
      expect(successDto.data.syncSuccessful).toBe(false);
      expect(successDto.data.errorMessage).toBe('Connection timeout');
      
      // Mark as successful again
      successDto.data.markAsSuccessful(10, [HealthMetricType.HEART_RATE, HealthMetricType.STEPS]);
      
      // Sync should be successful again
      expect(successDto.data.syncSuccessful).toBe(true);
      expect(successDto.data.errorMessage).toBeUndefined();
      expect(successDto.data.dataPointsCount).toBe(10);
      expect(successDto.data.metricTypes).toEqual([HealthMetricType.HEART_RATE, HealthMetricType.STEPS]);
    });

    it('should enforce type field to be "DEVICE_SYNCHRONIZED"', async () => {
      // Create a valid event
      const validEvent = createDeviceSynchronizedEvent();
      
      // Modify type field
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        type: 'SOME_OTHER_TYPE'
      });
      
      const dto = plainToInstance(DeviceSynchronizedEventDto, invalidEvent);
      
      // Override the type field (which is set in the constructor)
      Object.defineProperty(dto, 'type', {
        value: 'SOME_OTHER_TYPE',
        writable: true
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('HealthInsightGeneratedEventDto', () => {
    it('should validate a valid health insight generated event', async () => {
      // Create a valid health insight generated event for each insight type
      for (const insightType of Object.values(HealthInsightType)) {
        const validEvent = createHealthInsightGeneratedEvent(insightType);
        const isValid = await isValidEventDto(validEvent);
        expect(isValid).toBe(true);
      }
    });

    it('should reject events with missing required fields', async () => {
      // Create a valid event
      const validEvent = createHealthInsightGeneratedEvent();
      
      // Create invalid events by removing required fields
      const requiredFields = ['type', 'journey', 'userId', 'data.insightId', 'data.insightType', 'data.title', 'data.description'];
      
      for (const field of requiredFields) {
        const invalidEvent = createInvalidEvent(validEvent, [field]);
        const dto = plainToInstance(HealthInsightGeneratedEventDto, invalidEvent);
        
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate insight type is a valid enum value', async () => {
      // Create a valid event
      const validEvent = createHealthInsightGeneratedEvent();
      
      // Modify insight type to an invalid value
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.insightType': 'INVALID_INSIGHT_TYPE'
      });
      
      const dto = plainToInstance(HealthInsightGeneratedEventDto, invalidEvent);
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });

    it('should validate confidence score is between 0 and 100', async () => {
      // Create a valid event
      const validEvent = createHealthInsightGeneratedEvent();
      
      // Test invalid confidence scores
      const invalidValues = [-10, 110, 200];
      
      for (const invalidValue of invalidValues) {
        const invalidEvent = createEventWithInvalidValues(validEvent, {
          'data.confidenceScore': invalidValue
        });
        
        const dto = plainToInstance(HealthInsightGeneratedEventDto, invalidEvent);
        const errors = await validate(dto);
        
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('data');
      }
      
      // Test valid confidence scores
      const validValues = [0, 50, 100];
      
      for (const validValue of validValues) {
        const validConfidenceEvent = createEventWithInvalidValues(validEvent, {
          'data.confidenceScore': validValue
        });
        
        const dto = plainToInstance(HealthInsightGeneratedEventDto, validConfidenceEvent);
        const errors = await validate(dto);
        
        expect(errors.length).toBe(0);
      }
    });

    it('should correctly determine high priority insights', async () => {
      // Create a high priority anomaly detection insight
      const highPriorityEvent = createHealthInsightGeneratedEvent(HealthInsightType.ANOMALY_DETECTION, {
        confidenceScore: 80
      });
      
      const highPriorityDto = plainToInstance(HealthInsightGeneratedEventDto, highPriorityEvent);
      expect(highPriorityDto.data.isHighPriority()).toBe(true);
      
      // Create a high priority health risk assessment
      const riskEvent = createHealthInsightGeneratedEvent(HealthInsightType.HEALTH_RISK_ASSESSMENT, {
        confidenceScore: 90
      });
      
      const riskDto = plainToInstance(HealthInsightGeneratedEventDto, riskEvent);
      expect(riskDto.data.isHighPriority()).toBe(true);
      
      // Create a non-high priority insight (wrong type)
      const normalTypeEvent = createHealthInsightGeneratedEvent(HealthInsightType.TREND_ANALYSIS, {
        confidenceScore: 90
      });
      
      const normalTypeDto = plainToInstance(HealthInsightGeneratedEventDto, normalTypeEvent);
      expect(normalTypeDto.data.isHighPriority()).toBe(false);
      
      // Create a non-high priority insight (low confidence)
      const lowConfidenceEvent = createHealthInsightGeneratedEvent(HealthInsightType.ANOMALY_DETECTION, {
        confidenceScore: 70
      });
      
      const lowConfidenceDto = plainToInstance(HealthInsightGeneratedEventDto, lowConfidenceEvent);
      expect(lowConfidenceDto.data.isHighPriority()).toBe(false);
    });

    it('should correctly handle user acknowledgment', async () => {
      // Create an unacknowledged insight
      const unacknowledgedEvent = createHealthInsightGeneratedEvent();
      const unacknowledgedDto = plainToInstance(HealthInsightGeneratedEventDto, unacknowledgedEvent);
      
      // Insight should not be acknowledged
      expect(unacknowledgedDto.data.userAcknowledged).toBe(false);
      
      // Acknowledge the insight
      unacknowledgedDto.data.acknowledgeByUser();
      
      // Insight should now be acknowledged
      expect(unacknowledgedDto.data.userAcknowledged).toBe(true);
    });

    it('should enforce type field to be "HEALTH_INSIGHT_GENERATED"', async () => {
      // Create a valid event
      const validEvent = createHealthInsightGeneratedEvent();
      
      // Modify type field
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        type: 'SOME_OTHER_TYPE'
      });
      
      const dto = plainToInstance(HealthInsightGeneratedEventDto, invalidEvent);
      
      // Override the type field (which is set in the constructor)
      Object.defineProperty(dto, 'type', {
        value: 'SOME_OTHER_TYPE',
        writable: true
      });
      
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with event processing pipeline', () => {
    it('should properly validate events in the processing pipeline', async () => {
      // Create valid events of each type
      const metricEvent = createHealthMetricRecordedEvent();
      const goalEvent = createHealthGoalAchievedEvent();
      const deviceEvent = createDeviceSynchronizedEvent();
      const insightEvent = createHealthInsightGeneratedEvent();
      
      // Validate each event
      const events = [metricEvent, goalEvent, deviceEvent, insightEvent];
      
      for (const event of events) {
        const errors = await validateEventDto(event);
        expect(errors).toBeNull();
      }
    });

    it('should reject invalid events in the processing pipeline', async () => {
      // Create invalid events of each type by removing required fields
      const metricEvent = createInvalidEvent(createHealthMetricRecordedEvent(), ['data.metricType']);
      const goalEvent = createInvalidEvent(createHealthGoalAchievedEvent(), ['data.goalId']);
      const deviceEvent = createInvalidEvent(createDeviceSynchronizedEvent(), ['data.deviceName']);
      const insightEvent = createInvalidEvent(createHealthInsightGeneratedEvent(), ['data.description']);
      
      // Validate each event
      const events = [metricEvent, goalEvent, deviceEvent, insightEvent];
      
      for (const event of events) {
        const errors = await validateEventDto(event);
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      }
    });
  });
});