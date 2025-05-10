import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum for health metric types that can be tracked in the application.
 * These align with the My Health journey requirements.
 */
export enum HealthMetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  WEIGHT = 'WEIGHT',
}

/**
 * Enum for measurement units associated with health metrics.
 * Ensures consistent unit representation across the application.
 */
export enum HealthMetricUnit {
  // Heart rate units
  BPM = 'bpm',
  
  // Blood pressure units
  MMHG = 'mmHg',
  
  // Blood glucose units
  MG_DL = 'mg/dL',
  MMOL_L = 'mmol/L',
  
  // Step units
  STEPS = 'steps',
  
  // Sleep units
  HOURS = 'hours',
  MINUTES = 'minutes',
  
  // Weight units
  KG = 'kg',
  LB = 'lb',
}

/**
 * Enum for health metric data sources.
 * Identifies the origin of health metric data for tracking and validation.
 */
export enum HealthMetricSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  WEARABLE_DEVICE = 'WEARABLE_DEVICE',
  MEDICAL_DEVICE = 'MEDICAL_DEVICE',
  HEALTH_APP = 'HEALTH_APP',
  API_INTEGRATION = 'API_INTEGRATION',
}

/**
 * DTO for heart rate metric data.
 * Validates heart rate values within physiologically plausible ranges.
 */
export class HeartRateMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(30, { message: 'Heart rate must be at least 30 bpm' })
  @Max(220, { message: 'Heart rate must be at most 220 bpm' })
  value: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid heart rate unit' })
  unit: HealthMetricUnit;
}

/**
 * DTO for blood pressure metric data.
 * Validates systolic and diastolic values within physiologically plausible ranges.
 */
export class BloodPressureMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(70, { message: 'Systolic pressure must be at least 70 mmHg' })
  @Max(220, { message: 'Systolic pressure must be at most 220 mmHg' })
  systolic: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(40, { message: 'Diastolic pressure must be at least 40 mmHg' })
  @Max(120, { message: 'Diastolic pressure must be at most 120 mmHg' })
  diastolic: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid blood pressure unit' })
  unit: HealthMetricUnit;
}

/**
 * DTO for blood glucose metric data.
 * Validates blood glucose values within physiologically plausible ranges.
 */
export class BloodGlucoseMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(30, { message: 'Blood glucose must be at least 30 mg/dL' })
  @Max(500, { message: 'Blood glucose must be at most 500 mg/dL' })
  value: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid blood glucose unit' })
  unit: HealthMetricUnit;

  @IsOptional()
  @IsString()
  mealContext?: string;
}

/**
 * DTO for step count metric data.
 * Validates step count values within plausible ranges.
 */
export class StepsMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Steps must be at least 0' })
  @Max(100000, { message: 'Steps must be at most 100,000' })
  value: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid steps unit' })
  unit: HealthMetricUnit;
}

/**
 * DTO for sleep metric data.
 * Validates sleep duration within plausible ranges.
 */
export class SleepMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Sleep duration must be at least 0 hours' })
  @Max(24, { message: 'Sleep duration must be at most 24 hours' })
  value: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid sleep unit' })
  unit: HealthMetricUnit;

  @IsOptional()
  @IsObject()
  sleepQuality?: {
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
    awake?: number;
  };
}

/**
 * DTO for weight metric data.
 * Validates weight values within physiologically plausible ranges.
 */
export class WeightMetricDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Weight must be at least 1 kg' })
  @Max(500, { message: 'Weight must be at most 500 kg' })
  value: number;

  @IsNotEmpty()
  @IsEnum(HealthMetricUnit, { message: 'Invalid weight unit' })
  unit: HealthMetricUnit;
}

/**
 * Main DTO for health metric events.
 * Validates and structures health metric data for event processing.
 * 
 * This DTO is used for sending health metric events to the gamification engine
 * and other services that need to process health metric data.
 */
export class HealthMetricEventDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(HealthMetricType, { message: 'Invalid health metric type' })
  metricType: HealthMetricType;

  @IsNotEmpty()
  @IsEnum(HealthMetricSource, { message: 'Invalid health metric source' })
  source: HealthMetricSource;

  @ValidateIf(o => o.metricType === HealthMetricType.HEART_RATE)
  @ValidateNested()
  @Type(() => HeartRateMetricDto)
  heartRate?: HeartRateMetricDto;

  @ValidateIf(o => o.metricType === HealthMetricType.BLOOD_PRESSURE)
  @ValidateNested()
  @Type(() => BloodPressureMetricDto)
  bloodPressure?: BloodPressureMetricDto;

  @ValidateIf(o => o.metricType === HealthMetricType.BLOOD_GLUCOSE)
  @ValidateNested()
  @Type(() => BloodGlucoseMetricDto)
  bloodGlucose?: BloodGlucoseMetricDto;

  @ValidateIf(o => o.metricType === HealthMetricType.STEPS)
  @ValidateNested()
  @Type(() => StepsMetricDto)
  steps?: StepsMetricDto;

  @ValidateIf(o => o.metricType === HealthMetricType.SLEEP)
  @ValidateNested()
  @Type(() => SleepMetricDto)
  sleep?: SleepMetricDto;

  @ValidateIf(o => o.metricType === HealthMetricType.WEIGHT)
  @ValidateNested()
  @Type(() => WeightMetricDto)
  weight?: WeightMetricDto;

  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Timestamp when the metric was recorded.
   * If not provided, the current time will be used.
   */
  @IsOptional()
  @IsString()
  timestamp?: string;

  /**
   * Device ID if the metric was recorded from a connected device.
   */
  @IsOptional()
  @IsString()
  deviceId?: string;

  /**
   * Indicates if the value is outside normal/healthy range.
   * This can be used for triggering alerts or special gamification rules.
   */
  @IsOptional()
  isAbnormal?: boolean;
}