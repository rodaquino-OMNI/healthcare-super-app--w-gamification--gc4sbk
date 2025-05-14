import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HealthEventDto, HealthMetricEventDto, HealthGoalEventDto, DeviceSyncEventDto } from '../../../src/dto/health-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';

describe('HealthEventDto', () => {
  describe('Base Health Event Validation', () => {
    it('should validate a valid health event', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL'
        }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when userId is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL'
        }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('userId');
    });

    it('should fail validation when journey is not "health"', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'care', // Invalid journey for health event
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL'
        }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'journey')).toBe(true);
    });

    it('should fail validation when type is not a health event type', async () => {
      const eventData = {
        type: 'APPOINTMENT_BOOKED', // Not a health event type
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL'
        }
      };

      const dto = plainToInstance(HealthEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'type')).toBe(true);
    });
  });

  describe('HealthMetricEventDto', () => {
    it('should validate a valid health metric event', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate different metric types', async () => {
      const metricTypes = [
        { type: 'HEART_RATE', value: 75, unit: 'bpm' },
        { type: 'BLOOD_PRESSURE', value: '120/80', unit: 'mmHg' },
        { type: 'BLOOD_GLUCOSE', value: 95, unit: 'mg/dL' },
        { type: 'STEPS', value: 8500, unit: 'steps' },
        { type: 'WEIGHT', value: 70.5, unit: 'kg' },
        { type: 'SLEEP', value: 7.5, unit: 'hours' }
      ];

      for (const metric of metricTypes) {
        const eventData = {
          type: EventType.HEALTH_METRIC_RECORDED,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          timestamp: new Date().toISOString(),
          data: {
            metricType: metric.type,
            value: metric.value,
            unit: metric.unit,
            source: 'MANUAL',
            timestamp: new Date().toISOString()
          }
        };

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should fail validation when metric type is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          // metricType is missing
          value: 75,
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should fail validation when value is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          // value is missing
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should fail validation when unit is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          // unit is missing
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should fail validation when source is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          // source is missing
          timestamp: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should validate physiologically plausible values', async () => {
      // Test heart rate within normal range
      const validHeartRate = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75, // Normal heart rate
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const validDto = plainToInstance(HealthMetricEventDto, validHeartRate);
      const validErrors = await validate(validDto);
      expect(validErrors.length).toBe(0);

      // Test heart rate outside normal range
      const invalidHeartRate = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 300, // Implausible heart rate
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const invalidDto = plainToInstance(HealthMetricEventDto, invalidHeartRate);
      const invalidErrors = await validate(invalidDto);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors.some(e => e.property === 'data')).toBe(true);
    });
  });

  describe('HealthGoalEventDto', () => {
    it('should validate a valid health goal achievement event', async () => {
      const eventData = {
        type: EventType.HEALTH_GOAL_ACHIEVED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          unit: 'steps',
          completedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthGoalEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid health goal progress event', async () => {
      const eventData = {
        type: EventType.HEALTH_GOAL_PROGRESS,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          goalType: 'STEPS',
          targetValue: 10000,
          currentValue: 5000,
          progressPercentage: 50,
          unit: 'steps',
          updatedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthGoalEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when goalId is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_GOAL_ACHIEVED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          // goalId is missing
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          unit: 'steps',
          completedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthGoalEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should fail validation when goalType is missing', async () => {
      const eventData = {
        type: EventType.HEALTH_GOAL_ACHIEVED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          goalId: '123e4567-e89b-12d3-a456-426614174001',
          // goalType is missing
          targetValue: 10000,
          achievedValue: 10500,
          unit: 'steps',
          completedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(HealthGoalEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should validate different goal types', async () => {
      const goalTypes = [
        { type: 'STEPS', target: 10000, unit: 'steps' },
        { type: 'SLEEP', target: 8, unit: 'hours' },
        { type: 'WATER', target: 2000, unit: 'ml' },
        { type: 'WEIGHT', target: 70, unit: 'kg' },
        { type: 'EXERCISE', target: 30, unit: 'minutes' }
      ];

      for (const goal of goalTypes) {
        const eventData = {
          type: EventType.HEALTH_GOAL_ACHIEVED,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          timestamp: new Date().toISOString(),
          data: {
            goalId: '123e4567-e89b-12d3-a456-426614174001',
            goalType: goal.type,
            targetValue: goal.target,
            achievedValue: goal.target,
            unit: goal.unit,
            completedAt: new Date().toISOString()
          }
        };

        const dto = plainToInstance(HealthGoalEventDto, eventData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('DeviceSyncEventDto', () => {
    it('should validate a valid device connection event', async () => {
      const eventData = {
        type: EventType.DEVICE_CONNECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          deviceId: 'device-123',
          deviceType: 'SMARTWATCH',
          manufacturer: 'Apple',
          model: 'Watch Series 7',
          connectionMethod: 'BLUETOOTH',
          connectedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(DeviceSyncEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid device sync event', async () => {
      const eventData = {
        type: EventType.DEVICE_SYNCED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          deviceId: 'device-123',
          deviceType: 'SMARTWATCH',
          syncedAt: new Date().toISOString(),
          metricsCount: 15,
          syncDuration: 3.5, // seconds
          syncStatus: 'SUCCESS'
        }
      };

      const dto = plainToInstance(DeviceSyncEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when deviceId is missing', async () => {
      const eventData = {
        type: EventType.DEVICE_CONNECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          // deviceId is missing
          deviceType: 'SMARTWATCH',
          manufacturer: 'Apple',
          model: 'Watch Series 7',
          connectionMethod: 'BLUETOOTH',
          connectedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(DeviceSyncEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should fail validation when deviceType is missing', async () => {
      const eventData = {
        type: EventType.DEVICE_CONNECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          deviceId: 'device-123',
          // deviceType is missing
          manufacturer: 'Apple',
          model: 'Watch Series 7',
          connectionMethod: 'BLUETOOTH',
          connectedAt: new Date().toISOString()
        }
      };

      const dto = plainToInstance(DeviceSyncEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'data')).toBe(true);
    });

    it('should validate different device types', async () => {
      const deviceTypes = [
        { type: 'SMARTWATCH', manufacturer: 'Apple', model: 'Watch Series 7' },
        { type: 'FITNESS_TRACKER', manufacturer: 'Fitbit', model: 'Charge 5' },
        { type: 'HEART_RATE_MONITOR', manufacturer: 'Polar', model: 'H10' },
        { type: 'BLOOD_PRESSURE_MONITOR', manufacturer: 'Omron', model: 'M7' },
        { type: 'GLUCOSE_MONITOR', manufacturer: 'Dexcom', model: 'G6' },
        { type: 'SCALE', manufacturer: 'Withings', model: 'Body+' }
      ];

      for (const device of deviceTypes) {
        const eventData = {
          type: EventType.DEVICE_CONNECTED,
          userId: '123e4567-e89b-12d3-a456-426614174000',
          journey: 'health',
          timestamp: new Date().toISOString(),
          data: {
            deviceId: 'device-123',
            deviceType: device.type,
            manufacturer: device.manufacturer,
            model: device.model,
            connectionMethod: 'BLUETOOTH',
            connectedAt: new Date().toISOString()
          }
        };

        const dto = plainToInstance(DeviceSyncEventDto, eventData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });
  });

  describe('Integration with Event Processing Pipeline', () => {
    it('should properly integrate with the event processing pipeline', async () => {
      // Mock event processor function
      const processEvent = (event: any) => {
        if (!event.type || !event.userId || !event.journey || !event.data) {
          throw new Error('Invalid event structure');
        }
        
        // Return processed event
        return {
          success: true,
          processedEvent: event
        };
      };

      // Valid health metric event
      const metricEvent = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      const metricDto = plainToInstance(HealthMetricEventDto, metricEvent);
      const metricErrors = await validate(metricDto);
      expect(metricErrors.length).toBe(0);

      // Process the event
      const result = processEvent(metricDto);
      expect(result.success).toBe(true);
      expect(result.processedEvent.type).toBe(EventType.HEALTH_METRIC_RECORDED);
    });

    it('should reject invalid events in the processing pipeline', async () => {
      // Mock event processor function
      const processEvent = (event: any) => {
        // Convert to DTO and validate
        const dto = plainToInstance(HealthMetricEventDto, event);
        const errors = validate(dto);
        
        if (errors instanceof Promise) {
          return errors.then(validationErrors => {
            if (validationErrors.length > 0) {
              throw new Error('Event validation failed');
            }
            return { success: true, processedEvent: event };
          });
        }
        
        return { success: true, processedEvent: event };
      };

      // Invalid health metric event (missing required field)
      const invalidEvent = {
        type: EventType.HEALTH_METRIC_RECORDED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health',
        timestamp: new Date().toISOString(),
        data: {
          // metricType is missing
          value: 75,
          unit: 'bpm',
          source: 'MANUAL',
          timestamp: new Date().toISOString()
        }
      };

      // Process the event and expect it to fail
      await expect(processEvent(invalidEvent)).rejects.toThrow();
    });
  });
});