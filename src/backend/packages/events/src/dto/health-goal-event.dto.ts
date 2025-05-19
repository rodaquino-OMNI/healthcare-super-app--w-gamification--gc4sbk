/**
 * Health goal event DTO for the AUSTA SuperApp.
 * 
 * This DTO specializes in validating and structuring health goal events (goal creation, 
 * progress updates, goal achievement) from the Health journey. It ensures proper structure 
 * and validation of health goals, tracks progress, and provides the foundation for gamifying 
 * health objectives. It's critical for achievement tracking and XP awards in the gamification engine.
 */

import { Type } from 'class-transformer';
import {
  IsEnum,
  IsUUID,
  IsString,
  IsNumber,
  IsDate,
  IsOptional,
  IsNotEmpty,
  Min,
  Max,
  ValidateNested,
  IsISO8601,
  IsBoolean,
} from 'class-validator';

// Import enums from the interfaces package
import { GoalType, GoalStatus, GoalPeriod } from '@austa/interfaces/journey/health';

/**
 * Enumeration of health goal event types.
 */
export enum HealthGoalEventType {
  GOAL_CREATED = 'health.goal.created',
  GOAL_UPDATED = 'health.goal.updated',
  GOAL_PROGRESS = 'health.goal.progress',
  GOAL_ACHIEVED = 'health.goal.achieved',
  GOAL_ABANDONED = 'health.goal.abandoned',
}

/**
 * Base DTO for health goal events.
 * Contains common properties for all health goal events.
 */
export class HealthGoalEventBaseDto {
  /**
   * Unique identifier for the health goal.
   */
  @IsUUID(4)
  @IsNotEmpty()
  goalId: string;

  /**
   * User ID associated with this health goal.
   */
  @IsUUID(4)
  @IsNotEmpty()
  userId: string;

  /**
   * Type of health goal (e.g., steps, sleep, weight).
   */
  @IsEnum(GoalType)
  @IsNotEmpty()
  type: GoalType;

  /**
   * Title or name of the goal.
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Optional description of the goal.
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Target value to achieve for this goal.
   */
  @IsNumber()
  @Min(0)
  targetValue: number;

  /**
   * Unit of measurement for the goal (e.g., steps, hours, kg).
   */
  @IsString()
  @IsNotEmpty()
  unit: string;

  /**
   * Current progress value toward the goal.
   */
  @IsNumber()
  @Min(0)
  currentValue: number;

  /**
   * Current status of the goal (active, completed, abandoned).
   */
  @IsEnum(GoalStatus)
  status: GoalStatus;

  /**
   * Period for the goal (daily, weekly, monthly, custom).
   */
  @IsEnum(GoalPeriod)
  period: GoalPeriod;

  /**
   * Date when the goal was started or became active.
   */
  @IsISO8601()
  startDate: string;

  /**
   * Optional target end date for the goal.
   */
  @IsISO8601()
  @IsOptional()
  endDate?: string;

  /**
   * Optional date when the goal was completed, if applicable.
   */
  @IsISO8601()
  @IsOptional()
  completedDate?: string;

  /**
   * Progress percentage (0-100) calculated from currentValue and targetValue.
   */
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercentage: number;
}

/**
 * DTO for goal creation events.
 */
export class HealthGoalCreatedEventDto extends HealthGoalEventBaseDto {
  /**
   * Timestamp when the goal was created.
   */
  @IsISO8601()
  createdAt: string;
}

/**
 * DTO for goal progress update events.
 */
export class HealthGoalProgressEventDto extends HealthGoalEventBaseDto {
  /**
   * Previous value before this progress update.
   */
  @IsNumber()
  @Min(0)
  previousValue: number;

  /**
   * Amount of progress made in this update.
   */
  @IsNumber()
  progressDelta: number;

  /**
   * Timestamp when the progress was recorded.
   */
  @IsISO8601()
  updatedAt: string;
}

/**
 * DTO for goal achievement events.
 */
export class HealthGoalAchievedEventDto extends HealthGoalEventBaseDto {
  /**
   * Indicates if the goal was achieved before the target end date.
   */
  @IsBoolean()
  achievedEarly: boolean;

  /**
   * Number of days taken to achieve the goal.
   */
  @IsNumber()
  @Min(0)
  daysToAchieve: number;

  /**
   * Timestamp when the goal was achieved.
   */
  @IsISO8601()
  achievedAt: string;

  /**
   * Optional achievement context for gamification rules.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HealthGoalAchievementContextDto)
  achievementContext?: HealthGoalAchievementContextDto;
}

/**
 * DTO for goal abandonment events.
 */
export class HealthGoalAbandonedEventDto extends HealthGoalEventBaseDto {
  /**
   * Reason for abandoning the goal.
   */
  @IsString()
  @IsOptional()
  abandonReason?: string;

  /**
   * Timestamp when the goal was abandoned.
   */
  @IsISO8601()
  abandonedAt: string;
}

/**
 * Context information for goal achievement events.
 * This provides additional data for gamification rules.
 */
export class HealthGoalAchievementContextDto {
  /**
   * Indicates if this is the user's first goal of this type.
   */
  @IsBoolean()
  isFirstGoalOfType: boolean;

  /**
   * Indicates if the user has a streak of completed goals.
   */
  @IsBoolean()
  isPartOfStreak: boolean;

  /**
   * Current streak count if part of a streak.
   */
  @IsNumber()
  @IsOptional()
  @Min(0)
  streakCount?: number;

  /**
   * Difficulty level of the goal (calculated based on target value and period).
   */
  @IsNumber()
  @Min(1)
  @Max(5)
  difficultyLevel: number;

  /**
   * Related health metrics that contributed to this goal.
   */
  @IsOptional()
  @IsString({ each: true })
  relatedMetricIds?: string[];
}

/**
 * Factory function to create the appropriate health goal event DTO based on the event type.
 * @param eventType The type of health goal event.
 * @param data The event data.
 * @returns The appropriate DTO instance for the event type.
 */
export function createHealthGoalEventDto(eventType: HealthGoalEventType, data: any): 
  HealthGoalCreatedEventDto | 
  HealthGoalProgressEventDto | 
  HealthGoalAchievedEventDto | 
  HealthGoalAbandonedEventDto {
  
  switch (eventType) {
    case HealthGoalEventType.GOAL_CREATED:
      return Object.assign(new HealthGoalCreatedEventDto(), data);
    case HealthGoalEventType.GOAL_PROGRESS:
      return Object.assign(new HealthGoalProgressEventDto(), data);
    case HealthGoalEventType.GOAL_ACHIEVED:
      return Object.assign(new HealthGoalAchievedEventDto(), data);
    case HealthGoalEventType.GOAL_ABANDONED:
      return Object.assign(new HealthGoalAbandonedEventDto(), data);
    default:
      throw new Error(`Unsupported health goal event type: ${eventType}`);
  }
}