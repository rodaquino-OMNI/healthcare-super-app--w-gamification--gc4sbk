/**
 * @file Health Metric Event DTO
 * @description Specialized DTO for validating and structuring health metric events from the Health journey.
 * This DTO enforces the correct structure for metrics data, validates measurement units and values,
 * and ensures consistency in how health metrics are represented across the system.
 * It's essential for gamification of health tracking activities.
 */

import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyType } from '@austa/interfaces/common/dto/journey.dto';
import { MetricSource, MetricType } from '@austa/interfaces/health';

/**
 * Enum for health metric units to ensure consistent unit representation
 */
export enum MetricUnit {
  // Weight units
  KILOGRAMS = 'kg',
  POUNDS = 'lb',
  
  // Heart rate units
  BEATS_PER_MINUTE = 'bpm',
  
  // Blood pressure units
  MMHG = 'mmHg',
  
  // Blood glucose units
  MILLIGRAMS_PER_DECILITER = 'mg/dL',
  MILLIMOLES_PER_LITER = 'mmol/L',
  
  // Step units
  STEPS = 'steps',
  
  // Sleep units
  HOURS = 'hours',
  MINUTES = 'minutes',
  
  // Distance units
  KILOMETERS = 'km',
  MILES = 'mi',
  METERS = 'm',
  
  // Oxygen saturation units
  PERCENTAGE = '%',
  
  // Temperature units
  CELSIUS = '°C',
  FAHRENHEIT = '°F',
  
  // Water intake units
  MILLILITERS = 'ml',
  LITERS = 'L',
  FLUID_OUNCES = 'fl oz',
  
  // Exercise units
  CALORIES = 'kcal',
  ACTIVE_MINUTES = 'active_min'
}

/**
 * Blood pressure reading structure with systolic and diastolic values
 */
export class BloodPressureReading {
  @IsNumber()
  @Min(60, { message: 'Systolic pressure must be at least 60 mmHg' })
  @Max(250, { message: 'Systolic pressure must be less than 250 mmHg' })
  systolic: number;

  @IsNumber()
  @Min(30, { message: 'Diastolic pressure must be at least 30 mmHg' })
  @Max(150, { message: 'Diastolic pressure must be less than 150 mmHg' })
  diastolic: number;
}

/**
 * Base class for health metric event data
 */
export class HealthMetricEventData {
  @IsEnum(MetricType, { message: 'Invalid metric type' })
  @IsNotEmpty({ message: 'Metric type is required' })
  metricType: MetricType;

  @IsEnum(MetricUnit, { message: 'Invalid unit' })
  @IsNotEmpty({ message: 'Unit is required' })
  unit: MetricUnit;

  @IsEnum(MetricSource, { message: 'Invalid source' })
  @IsNotEmpty({ message: 'Source is required' })
  source: MetricSource;

  @IsDate()
  @IsNotEmpty({ message: 'Timestamp is required' })
  timestamp: Date;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  deviceId?: string;
}

/**
 * DTO for health metric events with numeric values (heart rate, weight, etc.)
 */
export class NumericHealthMetricEventData extends HealthMetricEventData {
  @IsNumber()
  @IsNotEmpty({ message: 'Metric value is required' })
  value: number;
}

/**
 * DTO for blood pressure metric events
 */
export class BloodPressureMetricEventData extends HealthMetricEventData {
  @ValidateNested()
  @Type(() => BloodPressureReading)
  @IsNotEmpty({ message: 'Blood pressure reading is required' })
  value: BloodPressureReading;
}

/**
 * DTO for health metric events
 * Specializes in validating and structuring health metric events (weight, heart rate, blood pressure, steps, etc.)
 * from the Health journey.
 */
export class HealthMetricEventDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty({ message: 'Event type is required' })
  type: string;

  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsString()
  @IsNotEmpty({ message: 'Timestamp is required' })
  timestamp: string;

  @IsEnum(JourneyType)
  @IsNotEmpty({ message: 'Journey is required' })
  journey: JourneyType;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  version?: string;

  @ValidateNested()
  @Type(() => HealthMetricEventData, {
    discriminator: {
      property: 'metricType',
      subTypes: [
        { value: NumericHealthMetricEventData, name: MetricType.HEART_RATE },
        { value: NumericHealthMetricEventData, name: MetricType.STEPS },
        { value: NumericHealthMetricEventData, name: MetricType.WEIGHT },
        { value: NumericHealthMetricEventData, name: MetricType.SLEEP },
        { value: NumericHealthMetricEventData, name: MetricType.WATER },
        { value: NumericHealthMetricEventData, name: MetricType.EXERCISE },
        { value: NumericHealthMetricEventData, name: MetricType.OXYGEN_SATURATION },
        { value: NumericHealthMetricEventData, name: MetricType.TEMPERATURE },
        { value: NumericHealthMetricEventData, name: MetricType.BLOOD_GLUCOSE },
        { value: BloodPressureMetricEventData, name: MetricType.BLOOD_PRESSURE },
        { value: NumericHealthMetricEventData, name: MetricType.CUSTOM },
      ],
    },
  })
  @IsNotEmpty({ message: 'Event data is required' })
  data: HealthMetricEventData;

  /**
   * Validates the metric value based on the metric type to ensure physiologically plausible ranges
   * @param metricType The type of health metric
   * @param value The metric value to validate
   * @param unit The unit of measurement
   * @returns True if the value is within a plausible range, false otherwise
   */
  static validateMetricValue(metricType: MetricType, value: number | BloodPressureReading, unit: MetricUnit): boolean {
    switch (metricType) {
      case MetricType.HEART_RATE:
        return typeof value === 'number' && value >= 30 && value <= 220;

      case MetricType.WEIGHT:
        if (typeof value !== 'number') return false;
        return unit === MetricUnit.KILOGRAMS ? (value >= 1 && value <= 500) : (value >= 2.2 && value <= 1100);

      case MetricType.BLOOD_GLUCOSE:
        if (typeof value !== 'number') return false;
        return unit === MetricUnit.MILLIGRAMS_PER_DECILITER ? (value >= 20 && value <= 600) : (value >= 1.1 && value <= 33.3);

      case MetricType.STEPS:
        return typeof value === 'number' && value >= 0 && value <= 100000;

      case MetricType.SLEEP:
        if (typeof value !== 'number') return false;
        return unit === MetricUnit.HOURS ? (value >= 0 && value <= 24) : (value >= 0 && value <= 1440);

      case MetricType.OXYGEN_SATURATION:
        return typeof value === 'number' && value >= 70 && value <= 100;

      case MetricType.TEMPERATURE:
        if (typeof value !== 'number') return false;
        return unit === MetricUnit.CELSIUS ? (value >= 30 && value <= 45) : (value >= 86 && value <= 113);

      case MetricType.BLOOD_PRESSURE:
        if (typeof value !== 'object' || !('systolic' in value) || !('diastolic' in value)) return false;
        return (
          value.systolic >= 60 && value.systolic <= 250 &&
          value.diastolic >= 30 && value.diastolic <= 150 &&
          value.systolic > value.diastolic
        );

      case MetricType.WATER:
        if (typeof value !== 'number') return false;
        switch (unit) {
          case MetricUnit.MILLILITERS:
            return value >= 0 && value <= 10000;
          case MetricUnit.LITERS:
            return value >= 0 && value <= 10;
          case MetricUnit.FLUID_OUNCES:
            return value >= 0 && value <= 338;
          default:
            return false;
        }

      case MetricType.EXERCISE:
        if (typeof value !== 'number') return false;
        return unit === MetricUnit.CALORIES ? (value >= 0 && value <= 10000) : (value >= 0 && value <= 1440);

      default:
        return true; // For custom metrics, we don't enforce specific ranges
    }
  }
}