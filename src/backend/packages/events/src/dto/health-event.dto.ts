import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import base event DTO
import { BaseEventDto } from './base-event.dto';
import { EventTypes } from './event-types.enum';

// Import health journey interfaces
import { 
  MetricType, 
  MetricSource, 
  IHealthMetric 
} from '@austa/interfaces/journey/health/health-metric.interface';

import { 
  GoalType, 
  GoalStatus, 
  GoalPeriod,
  IHealthGoal 
} from '@austa/interfaces/journey/health/health-goal.interface';

import { 
  DeviceType, 
  ConnectionStatus,
  IDeviceConnection 
} from '@austa/interfaces/journey/health/device-connection.interface';

/**
 * Data transfer object for health metric recording events.
 * This DTO validates and structures events when a user records a health metric
 * such as weight, heart rate, blood pressure, steps, etc.
 */
export class HealthMetricRecordedEventDto extends BaseEventDto {
  @IsNotEmpty()
  @IsEnum(EventTypes)
  type: EventTypes.HEALTH_METRIC_RECORDED;

  @IsNotEmpty()
  @IsString()
  journey: 'health';

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthMetricData)
  data: HealthMetricData;
}

/**
 * Data structure for health metric event data.
 */
export class HealthMetricData {
  @IsNotEmpty()
  @IsEnum(MetricType)
  type: MetricType;

  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsEnum(MetricSource)
  source: MetricSource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  trendPercentage?: number;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

/**
 * Data transfer object for health goal achievement events.
 * This DTO validates and structures events when a user achieves a health goal
 * such as daily steps target, weight goal, etc.
 */
export class HealthGoalAchievedEventDto extends BaseEventDto {
  @IsNotEmpty()
  @IsEnum(EventTypes)
  type: EventTypes.HEALTH_GOAL_ACHIEVED;

  @IsNotEmpty()
  @IsString()
  journey: 'health';

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthGoalData)
  data: HealthGoalData;
}

/**
 * Data structure for health goal event data.
 */
export class HealthGoalData {
  @IsNotEmpty()
  @IsUUID()
  goalId: string;

  @IsNotEmpty()
  @IsEnum(GoalType)
  type: GoalType;

  @IsNotEmpty()
  @IsEnum(GoalStatus)
  status: GoalStatus;

  @IsNotEmpty()
  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  @IsNotEmpty()
  @IsNumber()
  targetValue: number;

  @IsNotEmpty()
  @IsNumber()
  currentValue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage?: number;
}

/**
 * Data transfer object for health insight generation events.
 * This DTO validates and structures events when a health insight is generated
 * for a user, such as trend analysis, health recommendations, etc.
 */
export class HealthInsightGeneratedEventDto extends BaseEventDto {
  @IsNotEmpty()
  @IsEnum(EventTypes)
  type: EventTypes.HEALTH_INSIGHT_GENERATED;

  @IsNotEmpty()
  @IsString()
  journey: 'health';

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => HealthInsightData)
  data: HealthInsightData;
}

/**
 * Data structure for health insight event data.
 */
export class HealthInsightData {
  @IsNotEmpty()
  @IsString()
  insightId: string;

  @IsNotEmpty()
  @IsString()
  insightType: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  relatedMetrics?: Record<string, any>;

  @IsOptional()
  @IsString()
  severity?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  recommendation?: string;
}

/**
 * Data transfer object for device synchronization events.
 * This DTO validates and structures events when a user's device is synchronized
 * with the AUSTA SuperApp, such as wearable devices, health monitors, etc.
 */
export class DeviceSynchronizedEventDto extends BaseEventDto {
  @IsNotEmpty()
  @IsEnum(EventTypes)
  type: EventTypes.DEVICE_SYNCHRONIZED;

  @IsNotEmpty()
  @IsString()
  journey: 'health';

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceSyncData)
  data: DeviceSyncData;
}

/**
 * Data structure for device synchronization event data.
 */
export class DeviceSyncData {
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @IsNotEmpty()
  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsNotEmpty()
  @IsEnum(ConnectionStatus)
  status: ConnectionStatus;

  @IsNotEmpty()
  @IsNumber()
  metricsCount: number;

  @IsOptional()
  @IsString()
  syncId?: string;

  @IsOptional()
  @IsObject()
  syncSummary?: Record<string, any>;
}