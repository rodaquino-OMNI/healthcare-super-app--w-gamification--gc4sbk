/**
 * @file health-event.dto.ts
 * @description Data Transfer Object for Health Journey specific events in the gamification engine.
 * This DTO extends the base ProcessEventDto with health-specific validation and typing.
 * 
 * This file implements the following requirements from the technical specification:
 * - Implement type-safe event schema with comprehensive event type definitions
 * - Support journey-specific event types (Health Journey events)
 * - Develop validation mechanisms for all event types
 * - Integrate with @austa/interfaces package for consistent type definitions across the platform
 */

import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested, IsBoolean, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from './process-event.dto';
import { HealthEventType } from '../interfaces/event-type.interface';
import { MetricType, GoalType } from '@austa/interfaces/journey/health';

/**
 * DTO for health metric data validation
 */
export class HealthMetricDto {
  /**
   * Type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE, STEPS, etc.)
   */
  @IsNotEmpty()
  @IsEnum(MetricType, {
    message: 'Metric type must be a valid MetricType enum value'
  })
  type: MetricType;

  /**
   * Numeric value of the health metric
   */
  @IsNotEmpty()
  @IsNumber()
  value: number;

  /**
   * Unit of measurement (e.g., 'bpm', 'mmHg', 'steps', etc.)
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * Source of the health metric (e.g., 'manual', 'device', 'integration')
   */
  @IsOptional()
  @IsString()
  source?: string;

  /**
   * Previous value for comparison (if available)
   */
  @IsOptional()
  @IsNumber()
  previousValue?: number;

  /**
   * Percentage change from previous value
   */
  @IsOptional()
  @IsNumber()
  changePercentage?: number;

  /**
   * Timestamp when the metric was recorded
   */
  @IsOptional()
  @IsDateString()
  recordedAt?: string;
}

/**
 * DTO for health goal data validation
 */
export class HealthGoalDto {
  /**
   * Unique identifier for the goal
   */
  @IsNotEmpty()
  @IsUUID()
  id: string;

  /**
   * Type of health goal (e.g., STEPS, WEIGHT, SLEEP, etc.)
   */
  @IsNotEmpty()
  @IsEnum(GoalType, {
    message: 'Goal type must be a valid GoalType enum value'
  })
  type: GoalType;

  /**
   * Current progress towards the goal (0-100)
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  /**
   * Whether the goal has been completed
   */
  @IsNotEmpty()
  @IsBoolean()
  completed: boolean;

  /**
   * Target value for the goal
   */
  @IsNotEmpty()
  @IsNumber()
  targetValue: number;

  /**
   * Actual value achieved
   */
  @IsNotEmpty()
  @IsNumber()
  actualValue: number;

  /**
   * Number of consecutive days the goal has been met (streak)
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  streakCount?: number;

  /**
   * Timestamp when the goal was achieved
   */
  @IsOptional()
  @IsDateString()
  achievedAt?: string;
}

/**
 * DTO for device connection data validation
 */
export class DeviceConnectionDto {
  /**
   * Unique identifier for the device
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * Type of device (e.g., 'smartwatch', 'fitness_tracker', etc.)
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * Action performed with the device
   */
  @IsNotEmpty()
  @IsEnum(['connected', 'disconnected', 'synced'], {
    message: 'Action must be one of: connected, disconnected, synced'
  })
  action: 'connected' | 'disconnected' | 'synced';

  /**
   * Timestamp when the device was connected
   */
  @IsOptional()
  @IsDateString()
  connectionTime?: string;

  /**
   * Whether this is the first time the device has been connected
   */
  @IsOptional()
  @IsBoolean()
  isFirstConnection?: boolean;
}

/**
 * DTO for health insight data validation
 */
export class HealthInsightDto {
  /**
   * Unique identifier for the insight
   */
  @IsNotEmpty()
  @IsString()
  id: string;

  /**
   * Type of health insight
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * List of metric types related to this insight
   */
  @IsNotEmpty()
  @IsEnum(MetricType, {
    each: true,
    message: 'Related metrics must be valid MetricType enum values'
  })
  relatedMetrics: MetricType[];

  /**
   * Severity level of the insight
   */
  @IsNotEmpty()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Severity must be one of: low, medium, high'
  })
  severity: 'low' | 'medium' | 'high';

  /**
   * Timestamp when the insight was generated
   */
  @IsNotEmpty()
  @IsDateString()
  generatedAt: string;
}

/**
 * DTO for health event data validation
 */
export class HealthEventDataDto {
  /**
   * Health metric information (required for HEALTH_METRIC_RECORDED events)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthMetricDto)
  metric?: HealthMetricDto;

  /**
   * Health goal information (required for GOAL_ACHIEVED and GOAL_PROGRESS_UPDATED events)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthGoalDto)
  goal?: HealthGoalDto;

  /**
   * Device connection information (required for DEVICE_CONNECTED and DEVICE_SYNCED events)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceConnectionDto)
  device?: DeviceConnectionDto;

  /**
   * Health insight information (required for HEALTH_INSIGHT_GENERATED events)
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthInsightDto)
  insight?: HealthInsightDto;
}

/**
 * Data transfer object for Health Journey events in the gamification engine.
 * Extends the base ProcessEventDto with health-specific validation and typing.
 */
export class HealthEventDto extends ProcessEventDto {
  /**
   * The type of health event.
   * Must be one of the defined HealthEventType enum values.
   */
  @IsNotEmpty()
  @IsEnum(HealthEventType, {
    message: 'Event type must be a valid HealthEventType enum value'
  })
  type: HealthEventType;

  /**
   * The journey for health events is always 'health'.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'health';

  /**
   * Health event specific data with nested validation.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthEventDataDto)
  data: HealthEventDataDto;

  /**
   * Validates that the required fields are present based on the event type.
   * This method is called by the NestJS validation pipeline.
   */
  validateEventTypeData() {
    switch (this.type) {
      case HealthEventType.HEALTH_METRIC_RECORDED:
        if (!this.data.metric) {
          throw new Error('HEALTH_METRIC_RECORDED events require metric data');
        }
        break;
      
      case HealthEventType.GOAL_ACHIEVED:
        if (!this.data.goal) {
          throw new Error('GOAL_ACHIEVED events require goal data');
        }
        if (!this.data.goal.completed) {
          throw new Error('GOAL_ACHIEVED events require goal.completed to be true');
        }
        break;
      
      case HealthEventType.GOAL_UPDATED:
        if (!this.data.goal) {
          throw new Error('GOAL_UPDATED events require goal data');
        }
        break;
      
      case HealthEventType.DEVICE_CONNECTED:
        if (!this.data.device) {
          throw new Error('DEVICE_CONNECTED events require device data');
        }
        if (this.data.device.action !== 'connected') {
          throw new Error('DEVICE_CONNECTED events require device.action to be "connected"');
        }
        break;
      
      case HealthEventType.DEVICE_SYNCED:
        if (!this.data.device) {
          throw new Error('DEVICE_SYNCED events require device data');
        }
        if (this.data.device.action !== 'synced') {
          throw new Error('DEVICE_SYNCED events require device.action to be "synced"');
        }
        break;
      
      case HealthEventType.HEALTH_INSIGHT_VIEWED:
        if (!this.data.insight) {
          throw new Error('HEALTH_INSIGHT_VIEWED events require insight data');
        }
        break;
      
      default:
        // No specific validation for other event types
        break;
    }
  }
}