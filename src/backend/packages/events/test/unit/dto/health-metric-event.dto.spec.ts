/**
 * @file health-metric-event.dto.spec.ts
 * @description Unit tests for the HealthMetricEventDto class that validate health metric events.
 * These tests ensure that health tracking data meets validation requirements before being
 * processed by the gamification engine.
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HealthMetricRecordedEventDto, HealthMetricData, HealthMetricType } from '../../../src/dto/health-event.dto';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';
import { IsValidHealthMetricValue, IsValidHealthMetricUnit } from '../../../src/dto/validation';

/**
 * Unit tests for the HealthMetricEventDto class.
 * 
 * These tests validate that health metric events conform to the expected validation rules,
 * including:
 * - Value ranges for different health metrics (heart rate, blood pressure, etc.)
 * - Unit validation for each metric type
 * - Source attribution (manual entry, device integration)
 * - Timestamp validation
 * - Integration with the gamification system
 */
describe('HealthMetricEventDto', () => {
  /**
   * Tests for heart rate metric validation.
   * Heart rate should be between 30-220 bpm and use the correct unit.
   */
  describe('Heart Rate Validation', () => {
    it('should validate a valid heart rate event', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject heart rate outside physiological range (30-220 bpm)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 300, // Too high
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check that the error is related to the value
      const dataErrors = errors.find(e => e.property === 'data');
      expect(dataErrors).toBeDefined();
    });

    it('should reject heart rate with incorrect unit', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'kg', // Incorrect unit
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for blood pressure metric validation.
   * Blood pressure should be in the format "systolic/diastolic" and use mmHg as the unit.
   */
  describe('Blood Pressure Validation', () => {
    it('should validate a valid blood pressure event', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.BLOOD_PRESSURE,
          value: '120/80', // Blood pressure is stored as a string
          unit: 'mmHg',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'device-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject blood pressure with incorrect format', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.BLOOD_PRESSURE,
          value: '12080', // Incorrect format
          unit: 'mmHg',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for blood glucose metric validation.
   * Blood glucose should be between 20-600 mg/dL or equivalent in mmol/L.
   */
  describe('Blood Glucose Validation', () => {
    it('should validate a valid blood glucose event', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.BLOOD_GLUCOSE,
          value: 95,
          unit: 'mg/dL',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'glucose-monitor-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate blood glucose in mmol/L', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.BLOOD_GLUCOSE,
          value: 5.3,
          unit: 'mmol/L',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject blood glucose outside physiological range (20-600 mg/dL)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.BLOOD_GLUCOSE,
          value: 800, // Too high
          unit: 'mg/dL',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for steps metric validation.
   * Steps should be between 0-100,000 and use 'steps' as the unit.
   */
  describe('Steps Validation', () => {
    it('should validate a valid steps event', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.STEPS,
          value: 8500,
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'fitness-tracker-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject steps with negative value', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.STEPS,
          value: -100, // Negative value
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject steps with unrealistically high value (>100,000)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.STEPS,
          value: 150000, // Too high
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for weight metric validation.
   * Weight should be between 0-500 kg or equivalent in lb.
   */
  describe('Weight Validation', () => {
    it('should validate a valid weight event in kg', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.WEIGHT,
          value: 75.5,
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid weight event in lb', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.WEIGHT,
          value: 165,
          unit: 'lb',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'scale-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject weight with negative value', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.WEIGHT,
          value: -10, // Negative value
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject weight with unrealistically high value (>500 kg)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.WEIGHT,
          value: 600, // Too high
          unit: 'kg',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for sleep metric validation.
   * Sleep duration should be between 0-24 hours or equivalent in minutes.
   */
  describe('Sleep Validation', () => {
    it('should validate a valid sleep event in hours', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.SLEEP,
          value: 7.5,
          unit: 'hours',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'sleep-tracker-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid sleep event in minutes', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.SLEEP,
          value: 450, // 7.5 hours in minutes
          unit: 'minutes',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject sleep with unrealistically high value (>24 hours)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.SLEEP,
          value: 30, // Too many hours
          unit: 'hours',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for temperature metric validation.
   * Temperature should be between 30-45°C or equivalent in °F.
   */
  describe('Temperature Validation', () => {
    it('should validate a valid temperature event in Celsius', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.TEMPERATURE,
          value: 37.2,
          unit: '°C',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'thermometer-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid temperature event in Fahrenheit', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.TEMPERATURE,
          value: 98.6,
          unit: '°F',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject temperature outside physiological range (30-45°C)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.TEMPERATURE,
          value: 50, // Too high for Celsius
          unit: '°C',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for oxygen saturation metric validation.
   * Oxygen saturation should be between 50-100% and use '%' as the unit.
   */
  describe('Oxygen Saturation Validation', () => {
    it('should validate a valid oxygen saturation event', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.OXYGEN_SATURATION,
          value: 98,
          unit: '%',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'pulse-oximeter-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject oxygen saturation outside physiological range (50-100%)', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.OXYGEN_SATURATION,
          value: 120, // Over 100%
          unit: '%',
          recordedAt: new Date().toISOString(),
          source: 'device'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for source attribution validation.
   * Events should have a valid source (manual, device, integration) with appropriate IDs.
   */
  describe('Source Attribution Validation', () => {
    it('should validate manual entry without device ID', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate device entry with device ID', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'smartwatch-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate integration entry with integration ID', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'integration',
          integrationId: 'fitbit-123'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  /**
   * Tests for timestamp validation.
   * Events should have a valid ISO timestamp that is not in the future.
   */
  describe('Timestamp Validation', () => {
    it('should validate event with valid ISO timestamp', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject event with invalid timestamp format', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: '2023-01-01', // Not a full ISO string
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject event with future timestamp', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // One year in the future
      
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: futureDate.toISOString(),
          source: 'manual'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  /**
   * Tests for gamification integration.
   * Events can include metadata for achievement eligibility and streak tracking.
   */
  describe('Gamification Integration', () => {
    it('should validate event with achievement context', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.STEPS,
          value: 10000,
          unit: 'steps',
          recordedAt: new Date().toISOString(),
          source: 'device',
          deviceId: 'fitness-tracker-123'
        },
        metadata: {
          achievementEligible: true,
          achievementTypes: ['steps-goal', 'daily-activity']
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate event with streak context for gamification', async () => {
      const eventData = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        type: JourneyEvents.Health.METRIC_RECORDED,
        journey: 'health',
        data: {
          metricType: HealthMetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual'
        },
        metadata: {
          achievementEligible: true,
          streakDay: 5,
          streakType: 'health-check-streak'
        }
      };

      const dto = plainToInstance(HealthMetricRecordedEventDto, eventData);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});