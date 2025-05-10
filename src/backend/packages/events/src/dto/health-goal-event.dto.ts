import { 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsUUID, 
  IsNumber, 
  IsOptional, 
  IsISO8601, 
  IsBoolean,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enumeration of health goal event types.
 * These event types represent different actions related to health goals
 * that can trigger gamification rules and achievements.
 */
export enum HealthGoalEventType {
  /**
   * Event emitted when a user creates a new health goal.
   */
  GOAL_CREATED = 'GOAL_CREATED',
  
  /**
   * Event emitted when a user updates progress on a health goal.
   */
  GOAL_PROGRESS_UPDATED = 'GOAL_PROGRESS_UPDATED',
  
  /**
   * Event emitted when a user achieves a health goal.
   */
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  
  /**
   * Event emitted when a user abandons a health goal.
   */
  GOAL_ABANDONED = 'GOAL_ABANDONED',
  
  /**
   * Event emitted when a user modifies an existing health goal.
   */
  GOAL_MODIFIED = 'GOAL_MODIFIED'
}

/**
 * Enumeration of possible health goal types.
 * Mirrors the GoalType enum from the health-service.
 */
export enum GoalType {
  STEPS = 'steps',
  SLEEP = 'sleep',
  WATER = 'water',
  WEIGHT = 'weight',
  EXERCISE = 'exercise',
  HEART_RATE = 'heart_rate',
  BLOOD_PRESSURE = 'blood_pressure',
  BLOOD_GLUCOSE = 'blood_glucose',
  CUSTOM = 'custom'
}

/**
 * Enumeration of possible health goal statuses.
 * Mirrors the GoalStatus enum from the health-service.
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

/**
 * Enumeration of possible health goal periods.
 * Mirrors the GoalPeriod enum from the health-service.
 */
export enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

/**
 * Base class for health goal event data.
 * Contains common properties shared by all health goal events.
 */
export class HealthGoalBaseData {
  /**
   * Unique identifier for the health goal.
   */
  @IsNotEmpty()
  @IsUUID()
  goalId: string;

  /**
   * Type of health goal (e.g., steps, sleep, weight).
   */
  @IsNotEmpty()
  @IsEnum(GoalType)
  type: GoalType;

  /**
   * Title or name of the goal.
   */
  @IsNotEmpty()
  @IsString()
  title: string;

  /**
   * Optional description of the goal.
   */
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Target value to achieve for this goal.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  targetValue: number;

  /**
   * Unit of measurement for the goal (e.g., steps, hours, kg).
   */
  @IsNotEmpty()
  @IsString()
  unit: string;

  /**
   * Current progress value toward the goal.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  currentValue: number;

  /**
   * Current status of the goal (active, completed, abandoned).
   */
  @IsNotEmpty()
  @IsEnum(GoalStatus)
  status: GoalStatus;

  /**
   * Period for the goal (daily, weekly, monthly, custom).
   */
  @IsNotEmpty()
  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  /**
   * Date when the goal was started or became active.
   */
  @IsNotEmpty()
  @IsISO8601()
  startDate: string;

  /**
   * Optional target end date for the goal.
   */
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}

/**
 * Data specific to goal creation events.
 */
export class GoalCreatedData extends HealthGoalBaseData {
  /**
   * Whether this is the user's first goal of this type.
   * Used for first-time achievement tracking.
   */
  @IsOptional()
  @IsBoolean()
  isFirstGoalOfType?: boolean;
}

/**
 * Data specific to goal progress update events.
 */
export class GoalProgressUpdatedData extends HealthGoalBaseData {
  /**
   * Previous value before the update.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  previousValue: number;

  /**
   * Amount of progress made in this update.
   */
  @IsNotEmpty()
  @IsNumber()
  progressIncrement: number;

  /**
   * Percentage of completion (0-100).
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;
}

/**
 * Data specific to goal achievement events.
 */
export class GoalAchievedData extends HealthGoalBaseData {
  /**
   * Date when the goal was completed.
   */
  @IsNotEmpty()
  @IsISO8601()
  completedDate: string;

  /**
   * Whether the goal was achieved ahead of schedule.
   */
  @IsOptional()
  @IsBoolean()
  aheadOfSchedule?: boolean;

  /**
   * Number of days taken to achieve the goal.
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  daysToAchieve: number;

  /**
   * Streak count (number of consecutive goals achieved of this type).
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  streakCount?: number;
}

/**
 * Data specific to goal abandoned events.
 */
export class GoalAbandonedData extends HealthGoalBaseData {
  /**
   * Reason for abandoning the goal, if provided.
   */
  @IsOptional()
  @IsString()
  abandonReason?: string;

  /**
   * Percentage of completion at abandonment (0-100).
   */
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;
}

/**
 * Data specific to goal modified events.
 */
export class GoalModifiedData extends HealthGoalBaseData {
  /**
   * Previous target value before modification.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  previousTargetValue?: number;

  /**
   * Previous end date before modification.
   */
  @IsOptional()
  @IsISO8601()
  previousEndDate?: string;

  /**
   * Whether the goal was made easier or harder.
   */
  @IsOptional()
  @IsBoolean()
  madeEasier?: boolean;
}

/**
 * Data transfer object for health goal events.
 * This DTO validates and structures health goal events from the Health journey,
 * ensuring proper validation of goal states, progress tracking, and achievement data.
 * It supports different goal types and provides detailed payload structures for
 * gamification rules processing.
 */
export class HealthGoalEventDto {
  /**
   * The type of health goal event.
   */
  @IsNotEmpty()
  @IsEnum(HealthGoalEventType)
  eventType: HealthGoalEventType;

  /**
   * The ID of the user associated with the health goal.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * Timestamp when the event occurred.
   */
  @IsNotEmpty()
  @IsISO8601()
  timestamp: string;

  /**
   * Data for goal created events.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalCreatedData)
  goalCreatedData?: GoalCreatedData;

  /**
   * Data for goal progress updated events.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalProgressUpdatedData)
  goalProgressData?: GoalProgressUpdatedData;

  /**
   * Data for goal achieved events.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalAchievedData)
  goalAchievedData?: GoalAchievedData;

  /**
   * Data for goal abandoned events.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalAbandonedData)
  goalAbandonedData?: GoalAbandonedData;

  /**
   * Data for goal modified events.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => GoalModifiedData)
  goalModifiedData?: GoalModifiedData;

  /**
   * Helper method to get the appropriate data object based on event type.
   * @returns The data object corresponding to the event type.
   */
  getEventData(): HealthGoalBaseData {
    switch (this.eventType) {
      case HealthGoalEventType.GOAL_CREATED:
        return this.goalCreatedData;
      case HealthGoalEventType.GOAL_PROGRESS_UPDATED:
        return this.goalProgressData;
      case HealthGoalEventType.GOAL_ACHIEVED:
        return this.goalAchievedData;
      case HealthGoalEventType.GOAL_ABANDONED:
        return this.goalAbandonedData;
      case HealthGoalEventType.GOAL_MODIFIED:
        return this.goalModifiedData;
      default:
        throw new Error(`Unknown event type: ${this.eventType}`);
    }
  }
}