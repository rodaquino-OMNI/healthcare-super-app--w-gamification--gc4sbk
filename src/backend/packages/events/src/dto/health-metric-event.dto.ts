/**
 * @file health-metric-event.dto.ts
 * @description Defines the DTO for health metric events in the AUSTA SuperApp.
 * This DTO validates and structures health metric events (weight, heart rate, blood pressure, steps, etc.)
 * from the Health journey. It enforces the correct structure for metrics data, validates measurement
 * units and values, and ensures consistency in how health metrics are represented across the system.
 */

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsNumber,
  IsUUID,
  IsISO8601,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  Matches,
  IsBoolean,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments,
} from 'class-validator';

// Import from @austa/interfaces package
import { JourneyType } from '../interfaces/journey-events.interface';
import { HealthEventType } from '../interfaces/journey-events.interface';

/**
 * Enum for health metric types
 * Defines all possible health metrics that can be tracked in the system
 */
export enum MetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  WEIGHT = 'WEIGHT',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  OXYGEN_SATURATION = 'OXYGEN_SATURATION',
  TEMPERATURE = 'TEMPERATURE',
  RESPIRATORY_RATE = 'RESPIRATORY_RATE',
  WATER_INTAKE = 'WATER_INTAKE',
  CALORIES_BURNED = 'CALORIES_BURNED',
  CALORIES_CONSUMED = 'CALORIES_CONSUMED',
}

/**
 * Enum for health metric sources
 * Defines all possible sources of health metric data
 */
export enum MetricSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  WEARABLE_DEVICE = 'WEARABLE_DEVICE',
  MEDICAL_DEVICE = 'MEDICAL_DEVICE',
  HEALTH_PROVIDER = 'HEALTH_PROVIDER',
  THIRD_PARTY_APP = 'THIRD_PARTY_APP',
  SYSTEM_CALCULATED = 'SYSTEM_CALCULATED',
}

/**
 * Enum for common health metric units
 * Provides standardized units for each metric type
 */
export enum MetricUnit {
  // Heart rate units
  BPM = 'bpm', // Beats per minute
  
  // Blood pressure units
  MMHG = 'mmHg', // Millimeters of mercury
  
  // Blood glucose units
  MG_DL = 'mg/dL', // Milligrams per deciliter
  MMOL_L = 'mmol/L', // Millimoles per liter
  
  // Weight units
  KG = 'kg', // Kilograms
  LB = 'lb', // Pounds
  
  // Steps units
  STEPS = 'steps', // Number of steps
  
  // Sleep units
  HOURS = 'hours', // Hours
  MINUTES = 'minutes', // Minutes
  
  // Oxygen saturation units
  PERCENTAGE = '%', // Percentage
  
  // Temperature units
  CELSIUS = '°C', // Celsius
  FAHRENHEIT = '°F', // Fahrenheit
  
  // Respiratory rate units
  BREATHS_PER_MINUTE = 'breaths/min', // Breaths per minute
  
  // Water intake units
  ML = 'mL', // Milliliters
  OZ = 'oz', // Fluid ounces
  
  // Calorie units
  KCAL = 'kcal', // Kilocalories
}

/**
 * Custom validator for physiologically plausible metric values
 * Validates that the metric value is within a plausible range based on the metric type
 */
@ValidatorConstraint({ name: 'isPhysiologicallyPlausible', async: false })
export class IsPhysiologicallyPlausibleConstraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    if (value === null || value === undefined) {
      return false;
    }
    
    switch (metricType) {
      case MetricType.HEART_RATE:
        return value >= 30 && value <= 250; // bpm
      
      case MetricType.BLOOD_PRESSURE:
        // For blood pressure, we validate in the BloodPressurePayload class
        return true;
      
      case MetricType.BLOOD_GLUCOSE:
        return value >= 20 && value <= 600; // mg/dL
      
      case MetricType.WEIGHT:
        return value >= 1 && value <= 500; // kg
      
      case MetricType.STEPS:
        return value >= 0 && value <= 100000; // steps
      
      case MetricType.SLEEP:
        return value >= 0 && value <= 24; // hours
      
      case MetricType.OXYGEN_SATURATION:
        return value >= 50 && value <= 100; // percentage
      
      case MetricType.TEMPERATURE:
        // Check both Celsius and Fahrenheit ranges
        const unit = object.unit;
        if (unit === MetricUnit.CELSIUS) {
          return value >= 30 && value <= 45; // °C
        } else if (unit === MetricUnit.FAHRENHEIT) {
          return value >= 86 && value <= 113; // °F
        }
        return true;
      
      case MetricType.RESPIRATORY_RATE:
        return value >= 4 && value <= 60; // breaths/min
      
      case MetricType.WATER_INTAKE:
        return value >= 0 && value <= 10000; // mL
      
      case MetricType.CALORIES_BURNED:
      case MetricType.CALORIES_CONSUMED:
        return value >= 0 && value <= 10000; // kcal
      
      default:
        return true;
    }
  }
  
  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    const metricType = object.metricType;
    
    switch (metricType) {
      case MetricType.HEART_RATE:
        return 'Heart rate must be between 30 and 250 bpm';
      
      case MetricType.BLOOD_GLUCOSE:
        return 'Blood glucose must be between 20 and 600 mg/dL';
      
      case MetricType.WEIGHT:
        return 'Weight must be between 1 and 500 kg';
      
      case MetricType.STEPS:
        return 'Steps must be between 0 and 100,000';
      
      case MetricType.SLEEP:
        return 'Sleep duration must be between 0 and 24 hours';
      
      case MetricType.OXYGEN_SATURATION:
        return 'Oxygen saturation must be between 50% and 100%';
      
      case MetricType.TEMPERATURE:
        const unit = object.unit;
        if (unit === MetricUnit.CELSIUS) {
          return 'Temperature must be between 30°C and 45°C';
        } else if (unit === MetricUnit.FAHRENHEIT) {
          return 'Temperature must be between 86°F and 113°F';
        }
        return 'Temperature is outside physiologically plausible range';
      
      case MetricType.RESPIRATORY_RATE:
        return 'Respiratory rate must be between 4 and 60 breaths/min';
      
      case MetricType.WATER_INTAKE:
        return 'Water intake must be between 0 and 10,000 mL';
      
      case MetricType.CALORIES_BURNED:
      case MetricType.CALORIES_CONSUMED:
        return 'Calorie value must be between 0 and 10,000 kcal';
      
      default:
        return 'Metric value is outside physiologically plausible range';
    }
  }
}

/**
 * Blood pressure payload class
 * Specialized payload for blood pressure metrics which require systolic and diastolic values
 */
export class BloodPressurePayload {
  @IsNumber()
  @Min(70)
  @Max(220)
  systolic: number;
  
  @IsNumber()
  @Min(40)
  @Max(120)
  diastolic: number;
  
  @IsOptional()
  @IsNumber()
  @Min(40)
  @Max(200)
  pulse?: number;
}

/**
 * Sleep payload class
 * Specialized payload for sleep metrics which include duration and quality
 */
export class SleepPayload {
  @IsNumber()
  @Min(0)
  @Max(24)
  duration: number;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  quality?: number;
  
  @IsOptional()
  @IsNumber()
  deepSleepDuration?: number;
  
  @IsOptional()
  @IsNumber()
  lightSleepDuration?: number;
  
  @IsOptional()
  @IsNumber()
  remSleepDuration?: number;
  
  @IsOptional()
  @IsNumber()
  awakeTime?: number;
}

/**
 * Health metric event payload DTO
 * Defines the structure and validation rules for health metric event payloads
 */
export class HealthMetricEventPayload {
  @IsEnum(MetricType)
  metricType: MetricType;
  
  @IsNumber()
  @Validate(IsPhysiologicallyPlausibleConstraint)
  value: number;
  
  @IsString()
  @Matches(/^[a-zA-Z%\/°\s]+$/)
  unit: string;
  
  @IsISO8601()
  timestamp: string;
  
  @IsEnum(MetricSource)
  source: MetricSource;
  
  @IsOptional()
  @IsString()
  deviceId?: string;
  
  @IsOptional()
  @IsNumber()
  previousValue?: number;
  
  @IsOptional()
  @IsNumber()
  @Min(-100)
  @Max(100)
  changePercentage?: number;
  
  @IsOptional()
  @IsString()
  notes?: string;
  
  @IsOptional()
  @IsBoolean()
  isAbnormal?: boolean;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => BloodPressurePayload)
  bloodPressure?: BloodPressurePayload;
  
  @IsOptional()
  @ValidateNested()
  @Type(() => SleepPayload)
  sleep?: SleepPayload;
}

/**
 * Health metric event DTO
 * Defines the structure and validation rules for health metric events
 */
export class HealthMetricEventDto {
  @IsUUID(4)
  eventId: string;
  
  @IsISO8601()
  timestamp: string;
  
  @IsString()
  version: string = '1.0.0';
  
  @IsString()
  source: string = 'health-service';
  
  @IsEnum(HealthEventType)
  type: HealthEventType = HealthEventType.METRIC_RECORDED;
  
  @IsEnum(JourneyType)
  journeyType: JourneyType = JourneyType.HEALTH;
  
  @IsUUID(4)
  userId: string;
  
  @ValidateNested()
  @Type(() => HealthMetricEventPayload)
  payload: HealthMetricEventPayload;
  
  @IsOptional()
  @IsString()
  correlationId?: string;
  
  @IsOptional()
  metadata?: Record<string, unknown>;
}