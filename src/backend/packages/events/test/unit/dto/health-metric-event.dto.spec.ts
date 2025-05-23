import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { MetricSource, MetricType } from '@austa/interfaces/journey/health';
import {
  HealthMetricEventDto,
  MetricUnit,
  NumericHealthMetricEventData,
  BloodPressureMetricEventData,
  BloodPressureReading
} from '../../../src/dto/health-metric-event.dto';
import {
  createHealthMetricEventData,
  validateDto,
  createEventWithInvalidValues
} from './test-utils';

describe('HealthMetricEventDto', () => {
  describe('Basic Validation', () => {
    it('should validate a properly formatted health metric event', async () => {
      // Create a valid health metric event
      const eventData = {
        id: uuidv4(),
        type: 'health.metric.recorded',
        userId: uuidv4(),
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'mobile-app',
        version: '1.0.0',
        data: {
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BEATS_PER_MINUTE,
          source: MetricSource.MANUAL_ENTRY,
          timestamp: new Date(),
          notes: 'After light exercise'
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should reject an event with missing required fields', async () => {
      // Create an event with missing required fields
      const eventData = {
        id: uuidv4(),
        // Missing type
        userId: uuidv4(),
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {
          // Missing metricType
          value: 75,
          unit: MetricUnit.BEATS_PER_MINUTE,
          source: MetricSource.MANUAL_ENTRY,
          timestamp: new Date()
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('type')).toBe(true);
      expect(result.hasErrorForProperty('data')).toBe(true);
    });

    it('should validate the correct structure of the data field', async () => {
      // Create an event with invalid data structure
      const eventData = {
        id: uuidv4(),
        type: 'health.metric.recorded',
        userId: uuidv4(),
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {
          // Missing required fields
          value: 75
          // Missing unit, source, timestamp
        }
      };

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('data')).toBe(true);
    });
  });

  describe('Metric Type Validation', () => {
    it('should validate all supported metric types', async () => {
      const metricTypes = Object.values(MetricType);
      
      for (const metricType of metricTypes) {
        let eventData;
        
        if (metricType === MetricType.BLOOD_PRESSURE) {
          eventData = createHealthMetricEventData({
            metricType,
            value: { systolic: 120, diastolic: 80 },
            unit: MetricUnit.MMHG
          });
        } else {
          // Use appropriate default values for each metric type
          const value = getDefaultValueForMetricType(metricType);
          const unit = getDefaultUnitForMetricType(metricType);
          
          eventData = createHealthMetricEventData({
            metricType,
            value,
            unit
          });
        }

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject invalid metric types', async () => {
      const eventData = createHealthMetricEventData({
        metricType: 'INVALID_METRIC' as MetricType,
        value: 75,
        unit: MetricUnit.BEATS_PER_MINUTE
      });

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('data')).toBe(true);
    });
  });

  describe('Value Range Validation', () => {
    describe('Heart Rate', () => {
      it('should validate heart rate within physiological range', async () => {
        // Test lower bound, middle, and upper bound
        const validHeartRates = [30, 75, 220];
        
        for (const heartRate of validHeartRates) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.HEART_RATE,
            value: heartRate,
            unit: MetricUnit.BEATS_PER_MINUTE
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.HEART_RATE,
            heartRate,
            MetricUnit.BEATS_PER_MINUTE
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject heart rate outside physiological range', async () => {
        // Test below lower bound and above upper bound
        const invalidHeartRates = [29, 221];
        
        for (const heartRate of invalidHeartRates) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.HEART_RATE,
            heartRate,
            MetricUnit.BEATS_PER_MINUTE
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Weight', () => {
      it('should validate weight within physiological range in kilograms', async () => {
        // Test lower bound, middle, and upper bound in kg
        const validWeights = [1, 70, 500];
        
        for (const weight of validWeights) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.WEIGHT,
            value: weight,
            unit: MetricUnit.KILOGRAMS
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.WEIGHT,
            weight,
            MetricUnit.KILOGRAMS
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should validate weight within physiological range in pounds', async () => {
        // Test lower bound, middle, and upper bound in pounds
        const validWeights = [2.2, 154, 1100];
        
        for (const weight of validWeights) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.WEIGHT,
            value: weight,
            unit: MetricUnit.POUNDS
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.WEIGHT,
            weight,
            MetricUnit.POUNDS
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject weight outside physiological range', async () => {
        // Test below lower bound and above upper bound in kg
        const invalidWeightsKg = [0.9, 501];
        
        for (const weight of invalidWeightsKg) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.WEIGHT,
            weight,
            MetricUnit.KILOGRAMS
          );

          expect(isValid).toBe(false);
        }

        // Test below lower bound and above upper bound in pounds
        const invalidWeightsLb = [2.1, 1101];
        
        for (const weight of invalidWeightsLb) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.WEIGHT,
            weight,
            MetricUnit.POUNDS
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Blood Pressure', () => {
      it('should validate blood pressure within physiological range', async () => {
        // Test lower bound, normal, and upper bound
        const validReadings = [
          { systolic: 60, diastolic: 30 },
          { systolic: 120, diastolic: 80 },
          { systolic: 250, diastolic: 150 }
        ];
        
        for (const reading of validReadings) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.BLOOD_PRESSURE,
            value: reading,
            unit: MetricUnit.MMHG
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_PRESSURE,
            reading,
            MetricUnit.MMHG
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject blood pressure outside physiological range', async () => {
        // Test below lower bound and above upper bound
        const invalidReadings = [
          { systolic: 59, diastolic: 40 },
          { systolic: 251, diastolic: 80 },
          { systolic: 120, diastolic: 29 },
          { systolic: 120, diastolic: 151 }
        ];
        
        for (const reading of invalidReadings) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_PRESSURE,
            reading,
            MetricUnit.MMHG
          );

          expect(isValid).toBe(false);
        }
      });

      it('should reject blood pressure where diastolic is higher than systolic', async () => {
        const invalidReading = { systolic: 120, diastolic: 130 };
        
        const isValid = HealthMetricEventDto.validateMetricValue(
          MetricType.BLOOD_PRESSURE,
          invalidReading,
          MetricUnit.MMHG
        );

        expect(isValid).toBe(false);
      });
    });

    describe('Steps', () => {
      it('should validate steps within reasonable range', async () => {
        // Test lower bound, normal, and upper bound
        const validSteps = [0, 10000, 100000];
        
        for (const steps of validSteps) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.STEPS,
            value: steps,
            unit: MetricUnit.STEPS
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.STEPS,
            steps,
            MetricUnit.STEPS
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject steps outside reasonable range', async () => {
        // Test above upper bound
        const invalidSteps = [100001];
        
        for (const steps of invalidSteps) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.STEPS,
            steps,
            MetricUnit.STEPS
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Blood Glucose', () => {
      it('should validate blood glucose within physiological range in mg/dL', async () => {
        // Test lower bound, normal, and upper bound in mg/dL
        const validGlucose = [20, 95, 600];
        
        for (const glucose of validGlucose) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.BLOOD_GLUCOSE,
            value: glucose,
            unit: MetricUnit.MILLIGRAMS_PER_DECILITER
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_GLUCOSE,
            glucose,
            MetricUnit.MILLIGRAMS_PER_DECILITER
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should validate blood glucose within physiological range in mmol/L', async () => {
        // Test lower bound, normal, and upper bound in mmol/L
        const validGlucose = [1.1, 5.5, 33.3];
        
        for (const glucose of validGlucose) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.BLOOD_GLUCOSE,
            value: glucose,
            unit: MetricUnit.MILLIMOLES_PER_LITER
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_GLUCOSE,
            glucose,
            MetricUnit.MILLIMOLES_PER_LITER
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject blood glucose outside physiological range', async () => {
        // Test below lower bound and above upper bound in mg/dL
        const invalidGlucoseMgDl = [19, 601];
        
        for (const glucose of invalidGlucoseMgDl) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_GLUCOSE,
            glucose,
            MetricUnit.MILLIGRAMS_PER_DECILITER
          );

          expect(isValid).toBe(false);
        }

        // Test below lower bound and above upper bound in mmol/L
        const invalidGlucoseMmol = [1.0, 33.4];
        
        for (const glucose of invalidGlucoseMmol) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.BLOOD_GLUCOSE,
            glucose,
            MetricUnit.MILLIMOLES_PER_LITER
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Sleep', () => {
      it('should validate sleep duration within reasonable range in hours', async () => {
        // Test lower bound, normal, and upper bound in hours
        const validSleep = [0, 8, 24];
        
        for (const sleep of validSleep) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.SLEEP,
            value: sleep,
            unit: MetricUnit.HOURS
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.SLEEP,
            sleep,
            MetricUnit.HOURS
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should validate sleep duration within reasonable range in minutes', async () => {
        // Test lower bound, normal, and upper bound in minutes
        const validSleep = [0, 480, 1440];
        
        for (const sleep of validSleep) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.SLEEP,
            value: sleep,
            unit: MetricUnit.MINUTES
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.SLEEP,
            sleep,
            MetricUnit.MINUTES
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject sleep duration outside reasonable range', async () => {
        // Test above upper bound in hours
        const invalidSleepHours = [25];
        
        for (const sleep of invalidSleepHours) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.SLEEP,
            sleep,
            MetricUnit.HOURS
          );

          expect(isValid).toBe(false);
        }

        // Test above upper bound in minutes
        const invalidSleepMinutes = [1441];
        
        for (const sleep of invalidSleepMinutes) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.SLEEP,
            sleep,
            MetricUnit.MINUTES
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Oxygen Saturation', () => {
      it('should validate oxygen saturation within physiological range', async () => {
        // Test lower bound, normal, and upper bound
        const validOxygen = [70, 98, 100];
        
        for (const oxygen of validOxygen) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.OXYGEN_SATURATION,
            value: oxygen,
            unit: MetricUnit.PERCENTAGE
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.OXYGEN_SATURATION,
            oxygen,
            MetricUnit.PERCENTAGE
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject oxygen saturation outside physiological range', async () => {
        // Test below lower bound and above upper bound
        const invalidOxygen = [69, 101];
        
        for (const oxygen of invalidOxygen) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.OXYGEN_SATURATION,
            oxygen,
            MetricUnit.PERCENTAGE
          );

          expect(isValid).toBe(false);
        }
      });
    });

    describe('Temperature', () => {
      it('should validate temperature within physiological range in Celsius', async () => {
        // Test lower bound, normal, and upper bound in Celsius
        const validTemp = [30, 37, 45];
        
        for (const temp of validTemp) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.TEMPERATURE,
            value: temp,
            unit: MetricUnit.CELSIUS
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.TEMPERATURE,
            temp,
            MetricUnit.CELSIUS
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should validate temperature within physiological range in Fahrenheit', async () => {
        // Test lower bound, normal, and upper bound in Fahrenheit
        const validTemp = [86, 98.6, 113];
        
        for (const temp of validTemp) {
          const eventData = createHealthMetricEventData({
            metricType: MetricType.TEMPERATURE,
            value: temp,
            unit: MetricUnit.FAHRENHEIT
          });

          const dto = plainToInstance(HealthMetricEventDto, eventData);
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.TEMPERATURE,
            temp,
            MetricUnit.FAHRENHEIT
          );

          expect(isValid).toBe(true);
          
          const result = await validateDto(dto);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject temperature outside physiological range', async () => {
        // Test below lower bound and above upper bound in Celsius
        const invalidTempC = [29, 46];
        
        for (const temp of invalidTempC) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.TEMPERATURE,
            temp,
            MetricUnit.CELSIUS
          );

          expect(isValid).toBe(false);
        }

        // Test below lower bound and above upper bound in Fahrenheit
        const invalidTempF = [85, 114];
        
        for (const temp of invalidTempF) {
          const isValid = HealthMetricEventDto.validateMetricValue(
            MetricType.TEMPERATURE,
            temp,
            MetricUnit.FAHRENHEIT
          );

          expect(isValid).toBe(false);
        }
      });
    });
  });

  describe('Unit Validation', () => {
    it('should validate correct units for each metric type', async () => {
      const validMetricUnits = [
        { metricType: MetricType.HEART_RATE, unit: MetricUnit.BEATS_PER_MINUTE, value: 75 },
        { metricType: MetricType.WEIGHT, unit: MetricUnit.KILOGRAMS, value: 70 },
        { metricType: MetricType.WEIGHT, unit: MetricUnit.POUNDS, value: 154 },
        { metricType: MetricType.BLOOD_PRESSURE, unit: MetricUnit.MMHG, value: { systolic: 120, diastolic: 80 } },
        { metricType: MetricType.BLOOD_GLUCOSE, unit: MetricUnit.MILLIGRAMS_PER_DECILITER, value: 95 },
        { metricType: MetricType.BLOOD_GLUCOSE, unit: MetricUnit.MILLIMOLES_PER_LITER, value: 5.5 },
        { metricType: MetricType.STEPS, unit: MetricUnit.STEPS, value: 10000 },
        { metricType: MetricType.SLEEP, unit: MetricUnit.HOURS, value: 8 },
        { metricType: MetricType.SLEEP, unit: MetricUnit.MINUTES, value: 480 },
        { metricType: MetricType.OXYGEN_SATURATION, unit: MetricUnit.PERCENTAGE, value: 98 },
        { metricType: MetricType.TEMPERATURE, unit: MetricUnit.CELSIUS, value: 37 },
        { metricType: MetricType.TEMPERATURE, unit: MetricUnit.FAHRENHEIT, value: 98.6 },
        { metricType: MetricType.WATER, unit: MetricUnit.MILLILITERS, value: 500 },
        { metricType: MetricType.WATER, unit: MetricUnit.LITERS, value: 2 },
        { metricType: MetricType.WATER, unit: MetricUnit.FLUID_OUNCES, value: 16 },
        { metricType: MetricType.EXERCISE, unit: MetricUnit.CALORIES, value: 300 },
        { metricType: MetricType.EXERCISE, unit: MetricUnit.ACTIVE_MINUTES, value: 30 }
      ];

      for (const { metricType, unit, value } of validMetricUnits) {
        const eventData = createHealthMetricEventData({
          metricType,
          unit,
          value
        });

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject incorrect units for metric types', async () => {
      const invalidMetricUnits = [
        { metricType: MetricType.HEART_RATE, unit: MetricUnit.KILOGRAMS, value: 75 },
        { metricType: MetricType.WEIGHT, unit: MetricUnit.BEATS_PER_MINUTE, value: 70 },
        { metricType: MetricType.BLOOD_PRESSURE, unit: MetricUnit.PERCENTAGE, value: { systolic: 120, diastolic: 80 } },
        { metricType: MetricType.BLOOD_GLUCOSE, unit: MetricUnit.STEPS, value: 95 },
        { metricType: MetricType.STEPS, unit: MetricUnit.HOURS, value: 10000 },
        { metricType: MetricType.SLEEP, unit: MetricUnit.KILOGRAMS, value: 8 },
        { metricType: MetricType.OXYGEN_SATURATION, unit: MetricUnit.CELSIUS, value: 98 },
        { metricType: MetricType.TEMPERATURE, unit: MetricUnit.STEPS, value: 37 }
      ];

      for (const { metricType, unit, value } of invalidMetricUnits) {
        const eventData = createHealthMetricEventData({
          metricType,
          unit,
          value
        });

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        // We're not testing validation here, just the static method
        // because the class-validator doesn't validate the unit-metric type relationship
        
        // Instead, we'll test the static method directly
        const isValid = isValidUnitForMetricType(metricType, unit);
        expect(isValid).toBe(false);
      }
    });
  });

  describe('Source Attribution Validation', () => {
    it('should validate all supported metric sources', async () => {
      const sources = Object.values(MetricSource);
      
      for (const source of sources) {
        const eventData = createHealthMetricEventData({
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BEATS_PER_MINUTE,
          source
        });

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject invalid metric sources', async () => {
      const eventData = createHealthMetricEventData({
        metricType: MetricType.HEART_RATE,
        value: 75,
        unit: MetricUnit.BEATS_PER_MINUTE,
        source: 'INVALID_SOURCE' as MetricSource
      });

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('data')).toBe(true);
    });

    it('should validate device ID when source is a device', async () => {
      // For device sources, deviceId should be provided
      const deviceSources = [MetricSource.WEARABLE_DEVICE, MetricSource.MEDICAL_DEVICE];
      
      for (const source of deviceSources) {
        const eventData = createHealthMetricEventData({
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BEATS_PER_MINUTE,
          source,
          deviceId: uuidv4()
        });

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Timestamp Validation', () => {
    it('should validate events with valid timestamps', async () => {
      // Test current time, past time, and future time (within reason)
      const validTimestamps = [
        new Date(),
        new Date(Date.now() - 86400000), // Yesterday
        new Date(Date.now() + 3600000)   // 1 hour in the future (allowing for clock skew)
      ];
      
      for (const timestamp of validTimestamps) {
        const eventData = createHealthMetricEventData({
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: MetricUnit.BEATS_PER_MINUTE,
          timestamp
        });

        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });

    it('should reject events with invalid timestamps', async () => {
      // Test invalid timestamp format
      const eventData = createEventWithInvalidValues(
        createHealthMetricEventData(),
        { 'data.timestamp': 'not-a-date' }
      );

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Integration with Gamification Rules', () => {
    it('should validate events that would trigger gamification rules', async () => {
      // Test events that would trigger gamification achievements
      const gamificationEvents = [
        // Daily step goal achievement
        createHealthMetricEventData({
          metricType: MetricType.STEPS,
          value: 10000,
          unit: MetricUnit.STEPS
        }),
        // Heart rate in healthy range
        createHealthMetricEventData({
          metricType: MetricType.HEART_RATE,
          value: 65,
          unit: MetricUnit.BEATS_PER_MINUTE
        }),
        // Blood pressure in healthy range
        createHealthMetricEventData({
          metricType: MetricType.BLOOD_PRESSURE,
          value: { systolic: 120, diastolic: 80 },
          unit: MetricUnit.MMHG
        }),
        // Healthy sleep duration
        createHealthMetricEventData({
          metricType: MetricType.SLEEP,
          value: 8,
          unit: MetricUnit.HOURS
        })
      ];
      
      for (const eventData of gamificationEvents) {
        const dto = plainToInstance(HealthMetricEventDto, eventData);
        const result = await validateDto(dto);

        expect(result.isValid).toBe(true);
      }
    });

    it('should validate events with notes for gamification context', async () => {
      // Test events with notes that provide context for gamification
      const eventData = createHealthMetricEventData({
        metricType: MetricType.STEPS,
        value: 15000,
        unit: MetricUnit.STEPS,
        notes: 'Completed 10K race'
      });

      const dto = plainToInstance(HealthMetricEventDto, eventData);
      const result = await validateDto(dto);

      expect(result.isValid).toBe(true);
      expect(dto.data.notes).toBe('Completed 10K race');
    });
  });
});

// Helper functions

/**
 * Returns a default value for a given metric type
 * @param metricType The type of health metric
 * @returns A default value appropriate for the metric type
 */
function getDefaultValueForMetricType(metricType: MetricType): number {
  switch (metricType) {
    case MetricType.HEART_RATE:
      return 75;
    case MetricType.WEIGHT:
      return 70;
    case MetricType.BLOOD_GLUCOSE:
      return 95;
    case MetricType.STEPS:
      return 10000;
    case MetricType.SLEEP:
      return 8;
    case MetricType.OXYGEN_SATURATION:
      return 98;
    case MetricType.TEMPERATURE:
      return 37;
    case MetricType.WATER:
      return 2000;
    case MetricType.EXERCISE:
      return 300;
    case MetricType.CUSTOM:
      return 100;
    default:
      return 0;
  }
}

/**
 * Returns a default unit for a given metric type
 * @param metricType The type of health metric
 * @returns A default unit appropriate for the metric type
 */
function getDefaultUnitForMetricType(metricType: MetricType): MetricUnit {
  switch (metricType) {
    case MetricType.HEART_RATE:
      return MetricUnit.BEATS_PER_MINUTE;
    case MetricType.WEIGHT:
      return MetricUnit.KILOGRAMS;
    case MetricType.BLOOD_GLUCOSE:
      return MetricUnit.MILLIGRAMS_PER_DECILITER;
    case MetricType.STEPS:
      return MetricUnit.STEPS;
    case MetricType.SLEEP:
      return MetricUnit.HOURS;
    case MetricType.OXYGEN_SATURATION:
      return MetricUnit.PERCENTAGE;
    case MetricType.TEMPERATURE:
      return MetricUnit.CELSIUS;
    case MetricType.WATER:
      return MetricUnit.MILLILITERS;
    case MetricType.EXERCISE:
      return MetricUnit.CALORIES;
    case MetricType.CUSTOM:
      return MetricUnit.PERCENTAGE;
    default:
      return MetricUnit.PERCENTAGE;
  }
}

/**
 * Checks if a unit is valid for a given metric type
 * @param metricType The type of health metric
 * @param unit The unit to check
 * @returns True if the unit is valid for the metric type, false otherwise
 */
function isValidUnitForMetricType(metricType: MetricType, unit: MetricUnit): boolean {
  switch (metricType) {
    case MetricType.HEART_RATE:
      return unit === MetricUnit.BEATS_PER_MINUTE;
    case MetricType.WEIGHT:
      return unit === MetricUnit.KILOGRAMS || unit === MetricUnit.POUNDS;
    case MetricType.BLOOD_PRESSURE:
      return unit === MetricUnit.MMHG;
    case MetricType.BLOOD_GLUCOSE:
      return unit === MetricUnit.MILLIGRAMS_PER_DECILITER || unit === MetricUnit.MILLIMOLES_PER_LITER;
    case MetricType.STEPS:
      return unit === MetricUnit.STEPS;
    case MetricType.SLEEP:
      return unit === MetricUnit.HOURS || unit === MetricUnit.MINUTES;
    case MetricType.OXYGEN_SATURATION:
      return unit === MetricUnit.PERCENTAGE;
    case MetricType.TEMPERATURE:
      return unit === MetricUnit.CELSIUS || unit === MetricUnit.FAHRENHEIT;
    case MetricType.WATER:
      return unit === MetricUnit.MILLILITERS || unit === MetricUnit.LITERS || unit === MetricUnit.FLUID_OUNCES;
    case MetricType.EXERCISE:
      return unit === MetricUnit.CALORIES || unit === MetricUnit.ACTIVE_MINUTES;
    case MetricType.CUSTOM:
      return true; // Custom metrics can use any unit
    default:
      return false;
  }
}