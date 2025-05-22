import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProcessEventDto } from '../../../gamification-engine/src/events/dto/process-event.dto';
import { GoalStatus, GoalType, MetricSource, MetricType, DeviceType, ConnectionStatus } from '@austa/interfaces/journey/health';

/**
 * Base DTO for health journey events in the AUSTA SuperApp.
 * Extends the core ProcessEventDto with health-specific validation and properties.
 * This serves as the foundation for all health-related events processed by the gamification engine.
 */
export class HealthEventDto extends ProcessEventDto {
  /**
   * The journey type, which is always 'health' for health events.
   * This helps the gamification engine categorize and route events appropriately.
   */
  @IsNotEmpty()
  @IsString()
  journey: string = 'health';

  /**
   * The data associated with the health event.
   * This is a placeholder that will be overridden by more specific health event DTOs.
   */
  @IsNotEmpty()
  @IsObject()
  data: Record<string, any>;
}

/**
 * DTO for health metric recording events.
 * Used when a user or connected device records a health measurement such as
 * steps, heart rate, blood pressure, etc.
 */
export class HealthMetricRecordedEventDto extends HealthEventDto {
  /**
   * The type of this event is always 'HEALTH_METRIC_RECORDED'.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'HEALTH_METRIC_RECORDED';

  /**
   * The data specific to a health metric recording event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthMetricRecordedDataDto)
  data: HealthMetricRecordedDataDto;
}

/**
 * Data structure for health metric recording events.
 * Contains detailed information about the recorded health metric.
 */
export class HealthMetricRecordedDataDto {
  /**
   * The type of health metric being recorded (e.g., HEART_RATE, STEPS, etc.)
   */
  @IsNotEmpty()
  @IsEnum(MetricType)
  metricType: MetricType;

  /**
   * The numerical value of the health metric.
   */
  @IsNotEmpty()
  @IsNumber()
  value: number;

  /**
   * The unit of measurement for the health metric (e.g., 'bpm', 'steps', 'kg').
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * The source of the health metric data.
   */
  @IsNotEmpty()
  @IsEnum(MetricSource)
  source: MetricSource;

  /**
   * Optional ID of the device that recorded the metric, if applicable.
   */
  @IsOptional()
  @IsString()
  deviceId?: string;

  /**
   * Optional additional notes or context about the health metric.
   */
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Optional flag indicating if the metric value is outside normal/healthy range.
   */
  @IsOptional()
  isAbnormal?: boolean;
}

/**
 * DTO for health goal achievement events.
 * Used when a user reaches or completes a health goal they've set.
 */
export class HealthGoalAchievedEventDto extends HealthEventDto {
  /**
   * The type of this event is always 'HEALTH_GOAL_ACHIEVED'.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'HEALTH_GOAL_ACHIEVED';

  /**
   * The data specific to a health goal achievement event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthGoalAchievedDataDto)
  data: HealthGoalAchievedDataDto;
}

/**
 * Data structure for health goal achievement events.
 * Contains detailed information about the achieved health goal.
 */
export class HealthGoalAchievedDataDto {
  /**
   * The unique identifier of the achieved goal.
   */
  @IsNotEmpty()
  @IsUUID()
  goalId: string;

  /**
   * The type of health goal that was achieved.
   */
  @IsNotEmpty()
  @IsEnum(GoalType)
  goalType: GoalType;

  /**
   * The title or name of the achieved goal.
   */
  @IsNotEmpty()
  @IsString()
  title: string;

  /**
   * The target value that was set for the goal.
   */
  @IsNotEmpty()
  @IsNumber()
  targetValue: number;

  /**
   * The unit of measurement for the goal (e.g., 'steps', 'hours', 'kg').
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * The final value achieved when completing the goal.
   */
  @IsNotEmpty()
  @IsNumber()
  achievedValue: number;

  /**
   * The current status of the goal, which should be COMPLETED for achievement events.
   */
  @IsNotEmpty()
  @IsEnum(GoalStatus)
  status: GoalStatus;

  /**
   * Optional description of the achieved goal.
   */
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for health insight generation events.
 * Used when the system generates a health insight based on user's health data.
 */
export class HealthInsightGeneratedEventDto extends HealthEventDto {
  /**
   * The type of this event is always 'HEALTH_INSIGHT_GENERATED'.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'HEALTH_INSIGHT_GENERATED';

  /**
   * The data specific to a health insight generation event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthInsightGeneratedDataDto)
  data: HealthInsightGeneratedDataDto;
}

/**
 * Data structure for health insight generation events.
 * Contains detailed information about the generated health insight.
 */
export class HealthInsightGeneratedDataDto {
  /**
   * The unique identifier of the generated insight.
   */
  @IsNotEmpty()
  @IsUUID()
  insightId: string;

  /**
   * The type of health insight that was generated.
   */
  @IsNotEmpty()
  @IsString()
  insightType: string;

  /**
   * The title or headline of the generated insight.
   */
  @IsNotEmpty()
  @IsString()
  title: string;

  /**
   * A detailed description of the health insight.
   */
  @IsNotEmpty()
  @IsString()
  description: string;

  /**
   * The metric types that were analyzed to generate this insight.
   */
  @IsNotEmpty()
  @IsEnum(MetricType, { each: true })
  relatedMetrics: MetricType[];

  /**
   * Optional severity level of the insight (e.g., 'info', 'warning', 'critical').
   */
  @IsOptional()
  @IsString()
  severity?: string;

  /**
   * Optional recommended actions based on the insight.
   */
  @IsOptional()
  @IsString()
  recommendation?: string;
}

/**
 * DTO for device synchronization events.
 * Used when a user's device syncs health data with the AUSTA SuperApp.
 */
export class DeviceSynchronizedEventDto extends HealthEventDto {
  /**
   * The type of this event is always 'DEVICE_SYNCHRONIZED'.
   */
  @IsNotEmpty()
  @IsString()
  type: string = 'DEVICE_SYNCHRONIZED';

  /**
   * The data specific to a device synchronization event.
   */
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceSynchronizedDataDto)
  data: DeviceSynchronizedDataDto;
}

/**
 * Data structure for device synchronization events.
 * Contains detailed information about the synchronized device and data.
 */
export class DeviceSynchronizedDataDto {
  /**
   * The unique identifier of the device connection.
   */
  @IsNotEmpty()
  @IsUUID()
  connectionId: string;

  /**
   * The type of device that was synchronized.
   */
  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  /**
   * The unique identifier provided by the device itself.
   */
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  /**
   * The current connection status of the device.
   */
  @IsNotEmpty()
  @IsEnum(ConnectionStatus)
  status: ConnectionStatus;

  /**
   * The timestamp when the synchronization occurred.
   */
  @IsNotEmpty()
  @IsString()
  syncTimestamp: string;

  /**
   * The number of health metrics synchronized during this sync.
   */
  @IsNotEmpty()
  @IsNumber()
  metricsCount: number;

  /**
   * The types of metrics that were synchronized.
   */
  @IsNotEmpty()
  @IsEnum(MetricType, { each: true })
  metricTypes: MetricType[];

  /**
   * Optional duration of the synchronization process in seconds.
   */
  @IsOptional()
  @IsNumber()
  syncDuration?: number;
}