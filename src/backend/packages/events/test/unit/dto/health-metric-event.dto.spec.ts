import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { HealthMetricEventDto, MetricType, MetricUnit, MetricSource } from '../../../src/dto/health-metric-event.dto';
import { BaseEventDto } from '../../../src/dto/base-event.dto';

describe('HealthMetricEventDto', () => {
  // Helper function to create a valid health metric event
  const createValidHealthMetricEvent = (overrides = {}) => {
    return {
      type: 'HEALTH_METRIC_RECORDED',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      journey: 'health',
      timestamp: new Date().toISOString(),
      data: {
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: MetricUnit.BPM,
        source: MetricSource.MANUAL,
        recordedAt: new Date().toISOString(),
        deviceId: null,
        notes: 'Resting heart rate',
      },
      ...overrides,
    };
  };

  it('should validate a valid heart rate metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent());
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid weight metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
      data: {
        metricType: MetricType.WEIGHT,
        value: 70.5,
        unit: MetricUnit.KG,
        source: MetricSource.MANUAL,
        recordedAt: new Date().toISOString(),
        deviceId: null,
      }
    }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid blood pressure metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
      data: {
        metricType: MetricType.BLOOD_PRESSURE,
        value: { systolic: 120, diastolic: 80 },
        unit: MetricUnit.MMHG,
        source: MetricSource.DEVICE,
        recordedAt: new Date().toISOString(),
        deviceId: 'device-123',
      }
    }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid steps metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
      data: {
        metricType: MetricType.STEPS,
        value: 8000,
        unit: MetricUnit.STEPS,
        source: MetricSource.DEVICE,
        recordedAt: new Date().toISOString(),
        deviceId: 'device-123',
      }
    }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid blood glucose metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
      data: {
        metricType: MetricType.BLOOD_GLUCOSE,
        value: 85,
        unit: MetricUnit.MG_DL,
        source: MetricSource.DEVICE,
        recordedAt: new Date().toISOString(),
        deviceId: 'device-123',
      }
    }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate a valid sleep metric', async () => {
    const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
      data: {
        metricType: MetricType.SLEEP,
        value: 8,
        unit: MetricUnit.HOURS,
        source: MetricSource.DEVICE,
        recordedAt: new Date().toISOString(),
        deviceId: 'device-123',
      }
    }));
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  // Value range validation tests
  describe('Value range validation', () => {
    it('should reject heart rate below physiological minimum', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 20, // Too low for a living human
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject heart rate above physiological maximum', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 300, // Too high for a living human
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject negative weight', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.WEIGHT,
          value: -5, // Negative weight is impossible
          unit: MetricUnit.KG,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject implausibly high weight', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.WEIGHT,
          value: 700, // Beyond world record
          unit: MetricUnit.KG,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject invalid blood pressure format', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_PRESSURE,
          value: 120, // Should be an object with systolic and diastolic
          unit: MetricUnit.MMHG,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject blood pressure with implausible values', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_PRESSURE,
          value: { systolic: 300, diastolic: 200 }, // Extremely high, likely fatal
          unit: MetricUnit.MMHG,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject negative steps', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.STEPS,
          value: -100, // Negative steps are impossible
          unit: MetricUnit.STEPS,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject implausibly high steps for a single day', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.STEPS,
          value: 200000, // Implausibly high for a single day
          unit: MetricUnit.STEPS,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject blood glucose below physiological minimum', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_GLUCOSE,
          value: 20, // Too low, severe hypoglycemia
          unit: MetricUnit.MG_DL,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject blood glucose above physiological maximum', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_GLUCOSE,
          value: 1000, // Extremely high, beyond physiological possibility
          unit: MetricUnit.MG_DL,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject negative sleep duration', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.SLEEP,
          value: -2, // Negative sleep is impossible
          unit: MetricUnit.HOURS,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });

    it('should reject implausibly high sleep duration', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.SLEEP,
          value: 30, // Implausibly high for a single sleep session
          unit: MetricUnit.HOURS,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricValue');
    });
  });

  // Unit validation tests
  describe('Unit validation', () => {
    it('should reject heart rate with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.KG, // Wrong unit for heart rate
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });

    it('should reject weight with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.WEIGHT,
          value: 70,
          unit: MetricUnit.BPM, // Wrong unit for weight
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });

    it('should reject blood pressure with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_PRESSURE,
          value: { systolic: 120, diastolic: 80 },
          unit: MetricUnit.MG_DL, // Wrong unit for blood pressure
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });

    it('should reject steps with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.STEPS,
          value: 8000,
          unit: MetricUnit.HOURS, // Wrong unit for steps
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });

    it('should reject blood glucose with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.BLOOD_GLUCOSE,
          value: 85,
          unit: MetricUnit.STEPS, // Wrong unit for blood glucose
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });

    it('should reject sleep with incorrect unit', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.SLEEP,
          value: 8,
          unit: MetricUnit.KG, // Wrong unit for sleep
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidMetricUnit');
    });
  });

  // Source attribution tests
  describe('Source attribution', () => {
    it('should validate manual entry without deviceId', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(),
          deviceId: null, // No device ID for manual entry
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate device entry with deviceId', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
          deviceId: 'device-123', // Device ID provided for device entry
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject device entry without deviceId', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.DEVICE,
          recordedAt: new Date().toISOString(),
          deviceId: null, // Missing device ID for device entry
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidSourceAttribution');
    });
  });

  // Timestamp validation tests
  describe('Timestamp validation', () => {
    it('should validate with current timestamp', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: new Date().toISOString(), // Current timestamp
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate with past timestamp within reasonable range', async () => {
      // 7 days ago
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: pastDate.toISOString(), // Past timestamp within range
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject future timestamp', async () => {
      // 1 day in the future
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: futureDate.toISOString(), // Future timestamp
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidRecordedAt');
    });

    it('should reject timestamp too far in the past', async () => {
      // 1 year ago
      const veryPastDate = new Date();
      veryPastDate.setFullYear(veryPastDate.getFullYear() - 1);
      
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: veryPastDate.toISOString(), // Very old timestamp
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isValidRecordedAt');
    });

    it('should reject invalid timestamp format', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent({
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BPM,
          source: MetricSource.MANUAL,
          recordedAt: '2023-13-45T25:70:99', // Invalid timestamp format
        }
      }));
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // Required fields tests
  describe('Required fields', () => {
    it('should reject when metricType is missing', async () => {
      const event = createValidHealthMetricEvent();
      delete event.data.metricType;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when value is missing', async () => {
      const event = createValidHealthMetricEvent();
      delete event.data.value;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when unit is missing', async () => {
      const event = createValidHealthMetricEvent();
      delete event.data.unit;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when source is missing', async () => {
      const event = createValidHealthMetricEvent();
      delete event.data.source;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject when recordedAt is missing', async () => {
      const event = createValidHealthMetricEvent();
      delete event.data.recordedAt;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  // Inheritance tests
  describe('Inheritance from BaseEventDto', () => {
    it('should inherit validation from BaseEventDto', async () => {
      // Missing required userId from BaseEventDto
      const event = createValidHealthMetricEvent();
      delete event.userId;
      
      const dto = plainToInstance(HealthMetricEventDto, event);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // The error should be related to the BaseEventDto validation
      expect(errors[0].property).toBe('userId');
    });

    it('should validate when all BaseEventDto fields are valid', async () => {
      const dto = plainToInstance(HealthMetricEventDto, createValidHealthMetricEvent());
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});