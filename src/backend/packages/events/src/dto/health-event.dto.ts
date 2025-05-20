/**
 * @file health-event.dto.ts
 * @description Defines specialized DTO classes for health journey events in the AUSTA SuperApp.
 * This file extends the base event DTO with health-specific validation rules and type definitions
 * for events like health metric recording, goal achievement, health insight generation, and device connection.
 * 
 * These DTOs are used by the gamification engine to process health-related events and award
 * achievements, points, and rewards based on user health activities.
 *
 * @module events/dto
 */

import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, ValidateNested, Min, Max, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '@austa/interfaces';

/**
 * Enum for health metric types tracked in the AUSTA SuperApp
 */
export enum HealthMetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  SLEEP = 'SLEEP',
  WEIGHT = 'WEIGHT',
  TEMPERATURE = 'TEMPERATURE',
  OXYGEN_SATURATION = 'OXYGEN_SATURATION',
  RESPIRATORY_RATE = 'RESPIRATORY_RATE',
  WATER_INTAKE = 'WATER_INTAKE',
  CALORIES = 'CALORIES'
}

/**
 * Enum for health goal types in the AUSTA SuperApp
 */
export enum HealthGoalType {
  STEPS_TARGET = 'STEPS_TARGET',
  WEIGHT_TARGET = 'WEIGHT_TARGET',
  SLEEP_DURATION = 'SLEEP_DURATION',
  ACTIVITY_FREQUENCY = 'ACTIVITY_FREQUENCY',
  WATER_INTAKE = 'WATER_INTAKE',
  BLOOD_PRESSURE_MANAGEMENT = 'BLOOD_PRESSURE_MANAGEMENT',
  BLOOD_GLUCOSE_MANAGEMENT = 'BLOOD_GLUCOSE_MANAGEMENT'
}

/**
 * Enum for device types that can be connected to the AUSTA SuperApp
 */
export enum DeviceType {
  FITNESS_TRACKER = 'FITNESS_TRACKER',
  SMARTWATCH = 'SMARTWATCH',
  BLOOD_PRESSURE_MONITOR = 'BLOOD_PRESSURE_MONITOR',
  GLUCOSE_MONITOR = 'GLUCOSE_MONITOR',
  SCALE = 'SCALE',
  SLEEP_TRACKER = 'SLEEP_TRACKER',
  THERMOMETER = 'THERMOMETER',
  PULSE_OXIMETER = 'PULSE_OXIMETER'
}

/**
 * Enum for health insight types generated in the AUSTA SuperApp
 */
export enum HealthInsightType {
  ANOMALY_DETECTION = 'ANOMALY_DETECTION',
  TREND_ANALYSIS = 'TREND_ANALYSIS',
  PREVENTIVE_RECOMMENDATION = 'PREVENTIVE_RECOMMENDATION',
  GOAL_SUGGESTION = 'GOAL_SUGGESTION',
  HEALTH_RISK_ASSESSMENT = 'HEALTH_RISK_ASSESSMENT'
}

/**
 * Interface for health metric data
 */
export class HealthMetricData {
  @IsNotEmpty()
  @IsEnum(HealthMetricType)
  metricType: HealthMetricType;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  /**
   * Validates that the metric value is within acceptable ranges based on the metric type.
   * This custom validation ensures that health data is within medically reasonable bounds.
   */
  validateMetricRange(): boolean {
    switch (this.metricType) {
      case HealthMetricType.HEART_RATE:
        return this.value >= 30 && this.value <= 220;
      case HealthMetricType.BLOOD_PRESSURE:
        // For blood pressure, we expect a string like "120/80" stored in value
        return true; // Complex validation would be implemented in a custom validator
      case HealthMetricType.BLOOD_GLUCOSE:
        return this.value >= 20 && this.value <= 600;
      case HealthMetricType.STEPS:
        return this.value >= 0 && this.value <= 100000;
      case HealthMetricType.SLEEP:
        return this.value >= 0 && this.value <= 24; // Hours
      case HealthMetricType.WEIGHT:
        return this.value >= 0 && this.value <= 500; // kg
      case HealthMetricType.TEMPERATURE:
        return this.value >= 30 && this.value <= 45; // Celsius
      case HealthMetricType.OXYGEN_SATURATION:
        return this.value >= 50 && this.value <= 100; // Percentage
      case HealthMetricType.RESPIRATORY_RATE:
        return this.value >= 0 && this.value <= 100; // Breaths per minute
      case HealthMetricType.WATER_INTAKE:
        return this.value >= 0 && this.value <= 10000; // ml
      case HealthMetricType.CALORIES:
        return this.value >= 0 && this.value <= 10000;
      default:
        return true;
    }
  }
}

/**
 * Interface for health goal data
 */
export class HealthGoalData {
  @IsNotEmpty()
  @IsUUID()
  goalId: string;

  @IsNotEmpty()
  @IsEnum(HealthGoalType)
  goalType: HealthGoalType;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsDateString()
  achievedAt?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage?: number;

  /**
   * Determines if the goal has been achieved based on the progress percentage
   * or the presence of an achievedAt date.
   * 
   * @returns boolean indicating if the goal has been achieved
   */
  isAchieved(): boolean {
    if (this.achievedAt) {
      return true;
    }
    
    if (this.progressPercentage !== undefined && this.progressPercentage >= 100) {
      return true;
    }
    
    return false;
  }

  /**
   * Updates the goal with achievement information when a goal is completed.
   * Sets the achievedAt date to the current time if not already set.
   */
  markAsAchieved(): void {
    if (!this.achievedAt) {
      this.achievedAt = new Date().toISOString();
    }
    
    this.progressPercentage = 100;
  }
}

/**
 * Interface for device synchronization data
 */
export class DeviceSyncData {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsNotEmpty()
  @IsString()
  deviceName: string;

  @IsNotEmpty()
  @IsDateString()
  syncedAt: string;

  @IsNotEmpty()
  @IsBoolean()
  syncSuccessful: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dataPointsCount?: number;

  @IsOptional()
  @IsArray()
  metricTypes?: HealthMetricType[];

  @IsOptional()
  @IsString()
  errorMessage?: string;

  /**
   * Sets the sync as failed with the provided error message.
   * Updates the syncSuccessful flag and sets the error message.
   * 
   * @param errorMessage The error message describing the sync failure
   */
  markAsFailed(errorMessage: string): void {
    this.syncSuccessful = false;
    this.errorMessage = errorMessage;
  }

  /**
   * Sets the sync as successful with the provided data points count and metric types.
   * Updates the syncSuccessful flag and clears any error message.
   * 
   * @param dataPointsCount The number of data points synchronized
   * @param metricTypes The types of metrics that were synchronized
   */
  markAsSuccessful(dataPointsCount: number, metricTypes: HealthMetricType[]): void {
    this.syncSuccessful = true;
    this.dataPointsCount = dataPointsCount;
    this.metricTypes = metricTypes;
    this.errorMessage = undefined;
  }
}

/**
 * Interface for health insight data
 */
export class HealthInsightData {
  @IsNotEmpty()
  @IsUUID()
  insightId: string;

  @IsNotEmpty()
  @IsEnum(HealthInsightType)
  insightType: HealthInsightType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  relatedMetricTypes?: HealthMetricType[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidenceScore?: number;

  @IsOptional()
  @IsDateString()
  generatedAt?: string;

  @IsOptional()
  @IsBoolean()
  userAcknowledged?: boolean;

  /**
   * Marks the insight as acknowledged by the user.
   * This is used to track which insights have been seen by the user.
   */
  acknowledgeByUser(): void {
    this.userAcknowledged = true;
  }

  /**
   * Determines if this insight is a high-priority insight that requires
   * immediate user attention based on the insight type and confidence score.
   * 
   * @returns boolean indicating if this is a high-priority insight
   */
  isHighPriority(): boolean {
    // Anomaly detection and health risk assessments with high confidence are high priority
    if (
      (this.insightType === HealthInsightType.ANOMALY_DETECTION || 
       this.insightType === HealthInsightType.HEALTH_RISK_ASSESSMENT) &&
      this.confidenceScore !== undefined && 
      this.confidenceScore > 75
    ) {
      return true;
    }
    
    return false;
  }
}

/**
 * Data transfer object for health metric recorded events.
 * Extends the base ProcessEventDto with health-specific validation rules.
 */
export class HealthMetricRecordedEventDto extends ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  override type: string = 'HEALTH_METRIC_RECORDED';

  @IsNotEmpty()
  @IsString()
  override journey: string = 'health';

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HealthMetricData)
  override data: HealthMetricData;
}

/**
 * Data transfer object for health goal achieved events.
 * Extends the base ProcessEventDto with health-specific validation rules.
 */
export class HealthGoalAchievedEventDto extends ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  override type: string = 'HEALTH_GOAL_ACHIEVED';

  @IsNotEmpty()
  @IsString()
  override journey: string = 'health';

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HealthGoalData)
  override data: HealthGoalData;
}

/**
 * Data transfer object for device synchronized events.
 * Extends the base ProcessEventDto with health-specific validation rules.
 */
export class DeviceSynchronizedEventDto extends ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  override type: string = 'DEVICE_SYNCHRONIZED';

  @IsNotEmpty()
  @IsString()
  override journey: string = 'health';

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DeviceSyncData)
  override data: DeviceSyncData;
}

/**
 * Data transfer object for health insight generated events.
 * Extends the base ProcessEventDto with health-specific validation rules.
 */
export class HealthInsightGeneratedEventDto extends ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  override type: string = 'HEALTH_INSIGHT_GENERATED';

  @IsNotEmpty()
  @IsString()
  override journey: string = 'health';

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => HealthInsightData)
  override data: HealthInsightData;
}

/**
 * Base class for all health-related events.
 * Provides common validation and type checking for health events.
 */
export class HealthEventDto extends ProcessEventDto {
  @IsNotEmpty()
  @IsString()
  override journey: string = 'health';

  @IsNotEmpty()
  @IsObject()
  override data: HealthMetricData | HealthGoalData | DeviceSyncData | HealthInsightData;
}