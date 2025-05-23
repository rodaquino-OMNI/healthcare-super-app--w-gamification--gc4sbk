import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  HealthEventDto,
  HealthMetricRecordedEventDto,
  HealthMetricRecordedDataDto,
  HealthGoalAchievedEventDto,
  HealthGoalAchievedDataDto,
  HealthInsightGeneratedEventDto,
  HealthInsightGeneratedDataDto,
  DeviceSynchronizedEventDto,
  DeviceSynchronizedDataDto
} from '../../../src/dto/health-event.dto';
import { MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { GoalType, GoalStatus } from '@austa/interfaces/journey/health';
import { DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health';

describe('HealthEventDto', () => {
  describe('Base HealthEventDto', () => {
    it('should validate a valid health event', async () => {
      const eventData = {
        type: 'HEALTH_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: { test: 'data' }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(0);
    });

    it('should enforce journey to be "health"', async () => {
      const eventData = {
        type: 'HEALTH_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'care', // Invalid journey for health event
        timestamp: new Date().toISOString(),
        data: { test: 'data' }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      dto.journey = 'care'; // Override the default 'health' value
      const errors = await validate(dto);
      
      // Should have validation errors since journey must be 'health'
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require data object', async () => {
      const eventData = {
        type: 'HEALTH_EVENT',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        // Missing data
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });
  });

  describe('HealthMetricRecordedEventDto', () => {
    it('should validate a valid health metric recorded event', async () => {
      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          source: MetricSource.WEARABLE_DEVICE,
          deviceId: 'device-123',
          notes: 'After exercise'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(0);
    });

    it('should enforce the correct event type', async () => {
      const eventData = {
        type: 'WRONG_EVENT_TYPE',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          source: MetricSource.WEARABLE_DEVICE
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      dto.type = 'WRONG_EVENT_TYPE'; // Override the default type
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate metric type enum values', async () => {
      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'INVALID_METRIC_TYPE', // Invalid enum value
          value: 75,
          unit: 'bpm',
          source: MetricSource.WEARABLE_DEVICE
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
      // Check that the nested validation error is for metricType
      const dataErrors = errors.find(e => e.property === 'data');
      expect(dataErrors).toBeDefined();
    });

    it('should require numeric value for metric', async () => {
      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: MetricType.HEART_RATE,
          value: 'not-a-number', // Invalid value type
          unit: 'bpm',
          source: MetricSource.WEARABLE_DEVICE
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate source enum values', async () => {
      const eventData = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          source: 'INVALID_SOURCE' // Invalid enum value
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('HealthGoalAchievedEventDto', () => {
    it('should validate a valid health goal achieved event', async () => {
      const eventData = {
        type: 'HEALTH_GOAL_ACHIEVED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: GoalType.STEPS,
          title: 'Daily 10,000 Steps',
          targetValue: 10000,
          unit: 'steps',
          achievedValue: 10500,
          status: GoalStatus.COMPLETED,
          description: 'Walk 10,000 steps every day'
        }
      };

      const dto = plainToInstance(HealthGoalAchievedEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(0);
    });

    it('should enforce the correct event type', async () => {
      const eventData = {
        type: 'WRONG_EVENT_TYPE',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: GoalType.STEPS,
          title: 'Daily 10,000 Steps',
          targetValue: 10000,
          unit: 'steps',
          achievedValue: 10500,
          status: GoalStatus.COMPLETED
        }
      };

      const dto = plainToInstance(HealthGoalAchievedEventDto, eventData);
      dto.type = 'WRONG_EVENT_TYPE'; // Override the default type
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate goal type enum values', async () => {
      const eventData = {
        type: 'HEALTH_GOAL_ACHIEVED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: 'INVALID_GOAL_TYPE', // Invalid enum value
          title: 'Daily 10,000 Steps',
          targetValue: 10000,
          unit: 'steps',
          achievedValue: 10500,
          status: GoalStatus.COMPLETED
        }
      };

      const dto = plainToInstance(HealthGoalAchievedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require a valid UUID for goalId', async () => {
      const eventData = {
        type: 'HEALTH_GOAL_ACHIEVED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: 'not-a-uuid', // Invalid UUID
          goalType: GoalType.STEPS,
          title: 'Daily 10,000 Steps',
          targetValue: 10000,
          unit: 'steps',
          achievedValue: 10500,
          status: GoalStatus.COMPLETED
        }
      };

      const dto = plainToInstance(HealthGoalAchievedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate goal status enum values', async () => {
      const eventData = {
        type: 'HEALTH_GOAL_ACHIEVED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: GoalType.STEPS,
          title: 'Daily 10,000 Steps',
          targetValue: 10000,
          unit: 'steps',
          achievedValue: 10500,
          status: 'INVALID_STATUS' // Invalid enum value
        }
      };

      const dto = plainToInstance(HealthGoalAchievedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('HealthInsightGeneratedEventDto', () => {
    it('should validate a valid health insight generated event', async () => {
      const eventData = {
        type: 'HEALTH_INSIGHT_GENERATED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          insightId: '123e4567-e89b-12d3-a456-426614174002',
          insightType: 'TREND_ANALYSIS',
          title: 'Heart Rate Trend',
          description: 'Your resting heart rate has decreased over the past month, indicating improved cardiovascular fitness.',
          relatedMetrics: [MetricType.HEART_RATE],
          severity: 'info',
          recommendation: 'Continue your current exercise routine.'
        }
      };

      const dto = plainToInstance(HealthInsightGeneratedEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(0);
    });

    it('should enforce the correct event type', async () => {
      const eventData = {
        type: 'WRONG_EVENT_TYPE',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          insightId: '123e4567-e89b-12d3-a456-426614174002',
          insightType: 'TREND_ANALYSIS',
          title: 'Heart Rate Trend',
          description: 'Your resting heart rate has decreased over the past month.',
          relatedMetrics: [MetricType.HEART_RATE]
        }
      };

      const dto = plainToInstance(HealthInsightGeneratedEventDto, eventData);
      dto.type = 'WRONG_EVENT_TYPE'; // Override the default type
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require a valid UUID for insightId', async () => {
      const eventData = {
        type: 'HEALTH_INSIGHT_GENERATED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          insightId: 'not-a-uuid', // Invalid UUID
          insightType: 'TREND_ANALYSIS',
          title: 'Heart Rate Trend',
          description: 'Your resting heart rate has decreased over the past month.',
          relatedMetrics: [MetricType.HEART_RATE]
        }
      };

      const dto = plainToInstance(HealthInsightGeneratedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate related metrics as an array of enum values', async () => {
      const eventData = {
        type: 'HEALTH_INSIGHT_GENERATED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          insightId: '123e4567-e89b-12d3-a456-426614174002',
          insightType: 'TREND_ANALYSIS',
          title: 'Heart Rate Trend',
          description: 'Your resting heart rate has decreased over the past month.',
          relatedMetrics: ['INVALID_METRIC'] // Invalid enum value in array
        }
      };

      const dto = plainToInstance(HealthInsightGeneratedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require title and description', async () => {
      const eventData = {
        type: 'HEALTH_INSIGHT_GENERATED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          insightId: '123e4567-e89b-12d3-a456-426614174002',
          insightType: 'TREND_ANALYSIS',
          // Missing title and description
          relatedMetrics: [MetricType.HEART_RATE]
        }
      };

      const dto = plainToInstance(HealthInsightGeneratedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('DeviceSynchronizedEventDto', () => {
    it('should validate a valid device synchronized event', async () => {
      const eventData = {
        type: 'DEVICE_SYNCHRONIZED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: '123e4567-e89b-12d3-a456-426614174003',
          deviceType: DeviceType.SMARTWATCH,
          deviceId: 'device-123',
          status: ConnectionStatus.CONNECTED,
          syncTimestamp: new Date().toISOString(),
          metricsCount: 42,
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS],
          syncDuration: 5.2
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      const errors = await validate(dto);
      
      expect(errors.length).toBe(0);
    });

    it('should enforce the correct event type', async () => {
      const eventData = {
        type: 'WRONG_EVENT_TYPE',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: '123e4567-e89b-12d3-a456-426614174003',
          deviceType: DeviceType.SMARTWATCH,
          deviceId: 'device-123',
          status: ConnectionStatus.CONNECTED,
          syncTimestamp: new Date().toISOString(),
          metricsCount: 42,
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS]
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      dto.type = 'WRONG_EVENT_TYPE'; // Override the default type
      const errors = await validate(dto);
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate device type enum values', async () => {
      const eventData = {
        type: 'DEVICE_SYNCHRONIZED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: '123e4567-e89b-12d3-a456-426614174003',
          deviceType: 'INVALID_DEVICE_TYPE', // Invalid enum value
          deviceId: 'device-123',
          status: ConnectionStatus.CONNECTED,
          syncTimestamp: new Date().toISOString(),
          metricsCount: 42,
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS]
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate connection status enum values', async () => {
      const eventData = {
        type: 'DEVICE_SYNCHRONIZED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: '123e4567-e89b-12d3-a456-426614174003',
          deviceType: DeviceType.SMARTWATCH,
          deviceId: 'device-123',
          status: 'INVALID_STATUS', // Invalid enum value
          syncTimestamp: new Date().toISOString(),
          metricsCount: 42,
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS]
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require a valid UUID for connectionId', async () => {
      const eventData = {
        type: 'DEVICE_SYNCHRONIZED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: 'not-a-uuid', // Invalid UUID
          deviceType: DeviceType.SMARTWATCH,
          deviceId: 'device-123',
          status: ConnectionStatus.CONNECTED,
          syncTimestamp: new Date().toISOString(),
          metricsCount: 42,
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS]
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should require metricsCount to be a number', async () => {
      const eventData = {
        type: 'DEVICE_SYNCHRONIZED',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          connectionId: '123e4567-e89b-12d3-a456-426614174003',
          deviceType: DeviceType.SMARTWATCH,
          deviceId: 'device-123',
          status: ConnectionStatus.CONNECTED,
          syncTimestamp: new Date().toISOString(),
          metricsCount: 'not-a-number', // Invalid number
          metricTypes: [MetricType.HEART_RATE, MetricType.STEPS]
        }
      };

      const dto = plainToInstance(DeviceSynchronizedEventDto, eventData);
      const errors = await validate(dto, { validationError: { target: false } });
      
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with event processing pipeline', () => {
    it('should be compatible with the event processing pipeline', () => {
      // Create a valid health metric event
      const metricEvent = new HealthMetricRecordedEventDto();
      metricEvent.userId = '123e4567-e89b-12d3-a456-426614174000';
      metricEvent.timestamp = new Date().toISOString();
      metricEvent.data = {
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        source: MetricSource.WEARABLE_DEVICE,
        deviceId: 'device-123'
      };

      // Verify that the event has the correct structure for processing
      expect(metricEvent.type).toBe('HEALTH_METRIC_RECORDED');
      expect(metricEvent.journey).toBe('health');
      expect(metricEvent.userId).toBeDefined();
      expect(metricEvent.timestamp).toBeDefined();
      expect(metricEvent.data).toBeDefined();
      expect(metricEvent.data.metricType).toBe(MetricType.HEART_RATE);
    });

    it('should handle all health event types consistently', () => {
      // Create instances of all health event types
      const metricEvent = new HealthMetricRecordedEventDto();
      const goalEvent = new HealthGoalAchievedEventDto();
      const insightEvent = new HealthInsightGeneratedEventDto();
      const deviceEvent = new DeviceSynchronizedEventDto();

      // All should have the health journey
      expect(metricEvent.journey).toBe('health');
      expect(goalEvent.journey).toBe('health');
      expect(insightEvent.journey).toBe('health');
      expect(deviceEvent.journey).toBe('health');

      // All should have the correct event type
      expect(metricEvent.type).toBe('HEALTH_METRIC_RECORDED');
      expect(goalEvent.type).toBe('HEALTH_GOAL_ACHIEVED');
      expect(insightEvent.type).toBe('HEALTH_INSIGHT_GENERATED');
      expect(deviceEvent.type).toBe('DEVICE_SYNCHRONIZED');

      // All should have a data property
      expect(metricEvent.data).toBeDefined();
      expect(goalEvent.data).toBeDefined();
      expect(insightEvent.data).toBeDefined();
      expect(deviceEvent.data).toBeDefined();
    });
  });
});