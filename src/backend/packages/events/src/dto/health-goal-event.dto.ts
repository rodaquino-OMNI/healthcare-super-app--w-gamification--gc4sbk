import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested
} from 'class-validator';
import { GoalPeriod, GoalStatus, GoalType, IHealthGoal } from '@austa/interfaces/journey/health';

/**
 * Base DTO for health goal events that contains common properties
 * shared across all health goal event types.
 */
export class BaseHealthGoalEventDto {
  /**
   * Unique identifier of the health goal
   */
  @IsNotEmpty({ message: 'Goal ID is required' })
  @IsUUID('4', { message: 'Goal ID must be a valid UUID' })
  goalId: string;

  /**
   * Type of health goal (steps, sleep, weight, etc.)
   */
  @IsNotEmpty({ message: 'Goal type is required' })
  @IsEnum(GoalType, { message: 'Goal type must be a valid GoalType enum value' })
  type: GoalType;

  /**
   * Title of the health goal
   */
  @IsNotEmpty({ message: 'Goal title is required' })
  @IsString({ message: 'Goal title must be a string' })
  title: string;

  /**
   * Optional description of the health goal
   */
  @IsOptional()
  @IsString({ message: 'Goal description must be a string' })
  description?: string;

  /**
   * Unit of measurement for the goal (e.g., steps, hours, kg)
   */
  @IsNotEmpty({ message: 'Goal unit is required' })
  @IsString({ message: 'Goal unit must be a string' })
  unit: string;

  /**
   * Period for the goal (daily, weekly, monthly, custom)
   */
  @IsNotEmpty({ message: 'Goal period is required' })
  @IsEnum(GoalPeriod, { message: 'Goal period must be a valid GoalPeriod enum value' })
  period: GoalPeriod;
}

/**
 * DTO for health goal creation events.
 * Used when a user creates a new health goal in the system.
 */
export class HealthGoalCreatedEventDto extends BaseHealthGoalEventDto {
  /**
   * Target value to achieve for this goal
   */
  @IsNotEmpty({ message: 'Target value is required' })
  @IsNumber({}, { message: 'Target value must be a number' })
  @IsPositive({ message: 'Target value must be positive' })
  targetValue: number;

  /**
   * Initial value for the goal (usually 0 or a starting measurement)
   */
  @IsNotEmpty({ message: 'Initial value is required' })
  @IsNumber({}, { message: 'Initial value must be a number' })
  @Min(0, { message: 'Initial value cannot be negative' })
  initialValue: number;

  /**
   * Date when the goal was started or became active
   */
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDate({ message: 'Start date must be a valid date' })
  @Type(() => Date)
  startDate: Date;

  /**
   * Optional target end date for the goal
   */
  @IsOptional()
  @IsDate({ message: 'End date must be a valid date' })
  @Type(() => Date)
  endDate?: Date;
}

/**
 * DTO for health goal progress update events.
 * Used when a user's progress toward a goal is updated.
 */
export class HealthGoalProgressEventDto extends BaseHealthGoalEventDto {
  /**
   * Target value to achieve for this goal
   */
  @IsNotEmpty({ message: 'Target value is required' })
  @IsNumber({}, { message: 'Target value must be a number' })
  @IsPositive({ message: 'Target value must be positive' })
  targetValue: number;

  /**
   * Previous progress value before this update
   */
  @IsNotEmpty({ message: 'Previous value is required' })
  @IsNumber({}, { message: 'Previous value must be a number' })
  @Min(0, { message: 'Previous value cannot be negative' })
  previousValue: number;

  /**
   * Current progress value after this update
   */
  @IsNotEmpty({ message: 'Current value is required' })
  @IsNumber({}, { message: 'Current value must be a number' })
  @Min(0, { message: 'Current value cannot be negative' })
  currentValue: number;

  /**
   * Progress percentage (0-100) calculated from current/target values
   */
  @IsNotEmpty({ message: 'Progress percentage is required' })
  @IsNumber({}, { message: 'Progress percentage must be a number' })
  @Min(0, { message: 'Progress percentage cannot be less than 0' })
  @Max(100, { message: 'Progress percentage cannot be greater than 100' })
  progressPercentage: number;

  /**
   * Indicates if this update completes the goal
   */
  @IsNotEmpty({ message: 'Completed flag is required' })
  isCompleted: boolean;
}

/**
 * DTO for health goal achievement/completion events.
 * Used when a user successfully completes a health goal.
 */
export class HealthGoalAchievedEventDto extends BaseHealthGoalEventDto {
  /**
   * Target value that was achieved
   */
  @IsNotEmpty({ message: 'Target value is required' })
  @IsNumber({}, { message: 'Target value must be a number' })
  @IsPositive({ message: 'Target value must be positive' })
  targetValue: number;

  /**
   * Final value recorded when the goal was achieved
   */
  @IsNotEmpty({ message: 'Final value is required' })
  @IsNumber({}, { message: 'Final value must be a number' })
  @Min(0, { message: 'Final value cannot be negative' })
  finalValue: number;

  /**
   * Date when the goal was started
   */
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDate({ message: 'Start date must be a valid date' })
  @Type(() => Date)
  startDate: Date;

  /**
   * Date when the goal was completed
   */
  @IsNotEmpty({ message: 'Completion date is required' })
  @IsDate({ message: 'Completion date must be a valid date' })
  @Type(() => Date)
  completedDate: Date;

  /**
   * Duration in days it took to complete the goal
   */
  @IsNotEmpty({ message: 'Duration is required' })
  @IsNumber({}, { message: 'Duration must be a number' })
  @IsPositive({ message: 'Duration must be positive' })
  durationDays: number;

  /**
   * Whether the goal was completed ahead of schedule (if an end date was set)
   */
  @IsOptional()
  aheadOfSchedule?: boolean;
}

/**
 * DTO for health goal status change events.
 * Used when a goal's status changes (e.g., from active to abandoned).
 */
export class HealthGoalStatusChangedEventDto extends BaseHealthGoalEventDto {
  /**
   * Previous status of the goal
   */
  @IsNotEmpty({ message: 'Previous status is required' })
  @IsEnum(GoalStatus, { message: 'Previous status must be a valid GoalStatus enum value' })
  previousStatus: GoalStatus;

  /**
   * New status of the goal
   */
  @IsNotEmpty({ message: 'New status is required' })
  @IsEnum(GoalStatus, { message: 'New status must be a valid GoalStatus enum value' })
  newStatus: GoalStatus;

  /**
   * Reason for the status change (especially important for abandoned goals)
   */
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;

  /**
   * Current progress value at the time of status change
   */
  @IsNotEmpty({ message: 'Current value is required' })
  @IsNumber({}, { message: 'Current value must be a number' })
  @Min(0, { message: 'Current value cannot be negative' })
  currentValue: number;

  /**
   * Target value for the goal
   */
  @IsNotEmpty({ message: 'Target value is required' })
  @IsNumber({}, { message: 'Target value must be a number' })
  @IsPositive({ message: 'Target value must be positive' })
  targetValue: number;

  /**
   * Progress percentage at the time of status change
   */
  @IsNotEmpty({ message: 'Progress percentage is required' })
  @IsNumber({}, { message: 'Progress percentage must be a number' })
  @Min(0, { message: 'Progress percentage cannot be less than 0' })
  @Max(100, { message: 'Progress percentage cannot be greater than 100' })
  progressPercentage: number;
}

/**
 * DTO for health goal streak events.
 * Used to track consecutive goal achievements for recurring goals.
 */
export class HealthGoalStreakEventDto extends BaseHealthGoalEventDto {
  /**
   * Current streak count (number of consecutive completions)
   */
  @IsNotEmpty({ message: 'Streak count is required' })
  @IsNumber({}, { message: 'Streak count must be a number' })
  @Min(1, { message: 'Streak count must be at least 1' })
  streakCount: number;

  /**
   * Whether this is a new personal best streak
   */
  @IsNotEmpty({ message: 'Personal best flag is required' })
  isPersonalBest: boolean;

  /**
   * Previous personal best streak (if any)
   */
  @IsOptional()
  @IsNumber({}, { message: 'Previous best must be a number' })
  @Min(0, { message: 'Previous best cannot be negative' })
  previousBest?: number;

  /**
   * Date of the first goal completion in this streak
   */
  @IsNotEmpty({ message: 'Streak start date is required' })
  @IsDate({ message: 'Streak start date must be a valid date' })
  @Type(() => Date)
  streakStartDate: Date;

  /**
   * Date of the most recent goal completion in this streak
   */
  @IsNotEmpty({ message: 'Latest completion date is required' })
  @IsDate({ message: 'Latest completion date must be a valid date' })
  @Type(() => Date)
  latestCompletionDate: Date;
}

/**
 * Comprehensive DTO that can represent a complete health goal with all its properties.
 * Used for events that need to include the full goal state.
 */
export class HealthGoalCompleteDto implements Partial<IHealthGoal> {
  @IsNotEmpty({ message: 'Goal ID is required' })
  @IsUUID('4', { message: 'Goal ID must be a valid UUID' })
  id: string;

  @IsNotEmpty({ message: 'Record ID is required' })
  @IsUUID('4', { message: 'Record ID must be a valid UUID' })
  recordId: string;

  @IsNotEmpty({ message: 'Goal type is required' })
  @IsEnum(GoalType, { message: 'Goal type must be a valid GoalType enum value' })
  type: GoalType;

  @IsNotEmpty({ message: 'Goal title is required' })
  @IsString({ message: 'Goal title must be a string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Goal description must be a string' })
  description?: string;

  @IsNotEmpty({ message: 'Target value is required' })
  @IsNumber({}, { message: 'Target value must be a number' })
  @IsPositive({ message: 'Target value must be positive' })
  targetValue: number;

  @IsNotEmpty({ message: 'Unit is required' })
  @IsString({ message: 'Unit must be a string' })
  unit: string;

  @IsNotEmpty({ message: 'Current value is required' })
  @IsNumber({}, { message: 'Current value must be a number' })
  @Min(0, { message: 'Current value cannot be negative' })
  currentValue: number;

  @IsNotEmpty({ message: 'Status is required' })
  @IsEnum(GoalStatus, { message: 'Status must be a valid GoalStatus enum value' })
  status: GoalStatus;

  @IsNotEmpty({ message: 'Period is required' })
  @IsEnum(GoalPeriod, { message: 'Period must be a valid GoalPeriod enum value' })
  period: GoalPeriod;

  @IsNotEmpty({ message: 'Start date is required' })
  @IsDate({ message: 'Start date must be a valid date' })
  @Type(() => Date)
  startDate: Date;

  @IsOptional()
  @IsDate({ message: 'End date must be a valid date' })
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsDate({ message: 'Completed date must be a valid date' })
  @Type(() => Date)
  completedDate?: Date;

  @IsNotEmpty({ message: 'Created at date is required' })
  @IsDate({ message: 'Created at date must be a valid date' })
  @Type(() => Date)
  createdAt: Date;

  @IsNotEmpty({ message: 'Updated at date is required' })
  @IsDate({ message: 'Updated at date must be a valid date' })
  @Type(() => Date)
  updatedAt: Date;
}

/**
 * DTO for health goal gamification payload.
 * Contains additional information needed for gamification rules processing.
 */
export class HealthGoalGamificationPayloadDto {
  /**
   * Complete goal information
   */
  @ValidateNested()
  @Type(() => HealthGoalCompleteDto)
  goal: HealthGoalCompleteDto;

  /**
   * Current streak information for recurring goals
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthGoalStreakEventDto)
  streak?: HealthGoalStreakEventDto;

  /**
   * Whether this is the user's first completed goal of this type
   */
  @IsNotEmpty({ message: 'First completion flag is required' })
  isFirstCompletion: boolean;

  /**
   * Whether this goal was particularly challenging
   * (e.g., significantly higher target than user's previous goals)
   */
  @IsNotEmpty({ message: 'Challenging goal flag is required' })
  isChallengingGoal: boolean;

  /**
   * Number of goals of this type the user has completed
   */
  @IsNotEmpty({ message: 'Completion count is required' })
  @IsNumber({}, { message: 'Completion count must be a number' })
  @Min(1, { message: 'Completion count must be at least 1' })
  completionCount: number;

  /**
   * Whether the goal was completed ahead of schedule (if an end date was set)
   */
  @IsOptional()
  aheadOfSchedule?: boolean;

  /**
   * Suggested XP to award for this goal achievement
   * (final XP will be determined by gamification rules)
   */
  @IsNotEmpty({ message: 'Suggested XP is required' })
  @IsNumber({}, { message: 'Suggested XP must be a number' })
  @Min(0, { message: 'Suggested XP cannot be negative' })
  suggestedXp: number;
}