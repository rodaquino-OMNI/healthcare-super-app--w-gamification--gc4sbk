import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Base event DTO that all journey-specific event DTOs extend from.
 * Contains common properties for all events in the gamification system.
 */
export class BaseEventDto {
  /**
   * The type of the event.
   * Each journey has its own set of event types.
   */
  @IsNotEmpty()
  @IsString()
  type: string;

  /**
   * The ID of the user associated with the event.
   * This must be a valid UUID and identify a registered user in the system.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The journey associated with the event.
   * Possible values: 
   * - 'health' - My Health journey
   * - 'care' - Care Now journey
   * - 'plan' - My Plan & Benefits journey
   */
  @IsNotEmpty()
  @IsString()
  journey: string;
}

/**
 * Enum for health metric types that can be recorded in the Health journey.
 * Used for type safety and validation in health-related events.
 */
export enum HealthMetricType {
  STEPS = 'STEPS',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP',
  WATER_INTAKE = 'WATER_INTAKE',
  CALORIES = 'CALORIES',
  OXYGEN_SATURATION = 'OXYGEN_SATURATION',
  TEMPERATURE = 'TEMPERATURE'
}

/**
 * Enum for health event types in the gamification system.
 * These event types are specific to the Health journey.
 */
export enum HealthEventType {
  STEPS_RECORDED = 'STEPS_RECORDED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  HEALTH_METRIC_UPDATED = 'HEALTH_METRIC_UPDATED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  HEALTH_CHECK_COMPLETED = 'HEALTH_CHECK_COMPLETED',
  MEDICATION_TRACKED = 'MEDICATION_TRACKED',
  HEALTH_ARTICLE_READ = 'HEALTH_ARTICLE_READ',
  HEALTH_QUIZ_COMPLETED = 'HEALTH_QUIZ_COMPLETED'
}

/**
 * DTO for health metric data included in health events.
 * Contains the metric type, value, and unit of measurement.
 */
export class HealthMetricDto {
  /**
   * The type of health metric being recorded.
   */
  @IsNotEmpty()
  @IsEnum(HealthMetricType)
  metricType: HealthMetricType;

  /**
   * The numeric value of the health metric.
   */
  @IsNotEmpty()
  @IsNumber()
  value: number;

  /**
   * The unit of measurement for the health metric (e.g., 'steps', 'bpm', 'kg').
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * Optional timestamp when the metric was recorded.
   * If not provided, the event timestamp will be used.
   */
  @IsOptional()
  @IsString()
  recordedAt?: string;

  /**
   * Optional source of the health metric (e.g., 'manual', 'device', 'integration').
   */
  @IsOptional()
  @IsString()
  source?: string;
}

/**
 * DTO for health goal data included in goal achievement events.
 */
export class HealthGoalDto {
  /**
   * The ID of the goal that was achieved.
   */
  @IsNotEmpty()
  @IsUUID()
  goalId: string;

  /**
   * The type of goal that was achieved.
   */
  @IsNotEmpty()
  @IsString()
  goalType: string;

  /**
   * The target value that was achieved.
   */
  @IsNotEmpty()
  @IsNumber()
  targetValue: number;

  /**
   * The actual value achieved by the user.
   */
  @IsNotEmpty()
  @IsNumber()
  achievedValue: number;

  /**
   * Optional description of the goal.
   */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for device connection data included in device connection events.
 */
export class DeviceConnectionDto {
  /**
   * The ID of the device that was connected.
   */
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  /**
   * The type of device that was connected.
   */
  @IsNotEmpty()
  @IsString()
  deviceType: string;

  /**
   * The name of the device that was connected.
   */
  @IsNotEmpty()
  @IsString()
  deviceName: string;

  /**
   * Optional manufacturer of the device.
   */
  @IsOptional()
  @IsString()
  manufacturer?: string;
}

/**
 * Data Transfer Object for Health Journey specific events.
 * Extends the BaseEventDto with health-specific properties and validation rules.
 * Used for events like STEPS_RECORDED, GOAL_ACHIEVED, and HEALTH_METRIC_UPDATED.
 */
export class HealthEventDto extends BaseEventDto {
  /**
   * The type of health event.
   * Must be one of the defined HealthEventType enum values.
   */
  @IsNotEmpty()
  @IsEnum(HealthEventType)
  type: HealthEventType;

  /**
   * The journey must be 'health' for health events.
   */
  @IsNotEmpty()
  @IsString()
  journey: 'health';

  /**
   * The data object containing health-specific event details.
   * The structure varies based on the event type.
   */
  @IsNotEmpty()
  @IsObject()
  data: {
    /**
     * Health metric data for STEPS_RECORDED and HEALTH_METRIC_UPDATED events.
     */
    metric?: HealthMetricDto;

    /**
     * Health goal data for GOAL_ACHIEVED events.
     */
    goal?: HealthGoalDto;

    /**
     * Device connection data for DEVICE_CONNECTED events.
     */
    device?: DeviceConnectionDto;

    /**
     * Additional properties specific to the event type.
     */
    [key: string]: any;
  };

  /**
   * Validates the data object based on the event type.
   * This method is called by the class-validator library during validation.
   */
  @ValidateNested()
  @Type(() => Object)
  validateEventData() {
    // Validate that the correct data is provided based on the event type
    switch (this.type) {
      case HealthEventType.STEPS_RECORDED:
      case HealthEventType.HEALTH_METRIC_UPDATED:
        if (!this.data.metric) {
          throw new Error(`Event type ${this.type} requires metric data`);
        }
        break;
      case HealthEventType.GOAL_ACHIEVED:
        if (!this.data.goal) {
          throw new Error(`Event type ${this.type} requires goal data`);
        }
        break;
      case HealthEventType.DEVICE_CONNECTED:
        if (!this.data.device) {
          throw new Error(`Event type ${this.type} requires device data`);
        }
        break;
    }
    return true;
  }
}