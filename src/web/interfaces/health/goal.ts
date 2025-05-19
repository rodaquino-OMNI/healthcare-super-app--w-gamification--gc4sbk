/**
 * @file goal.ts
 * @description Defines the HealthGoal interface and its corresponding Zod validation schema
 * for the AUSTA SuperApp. This interface represents health objectives set by users,
 * such as step targets, weight goals, or blood pressure targets. The interface includes
 * properties for goal type, numerical target, date range, and status.
 */

import { z } from 'zod';

/**
 * Types of health goals that can be tracked in the application.
 * Aligned with the My Health journey requirements and gamification system.
 */
export enum HealthGoalType {
  /** Daily step count target */
  STEPS = 'STEPS',
  /** Target weight to achieve */
  WEIGHT = 'WEIGHT',
  /** Target blood pressure reading */
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  /** Target blood glucose level */
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  /** Sleep duration target */
  SLEEP = 'SLEEP',
  /** Heart rate zone target (e.g., minutes in cardio zone) */
  HEART_RATE = 'HEART_RATE',
  /** Water intake target */
  WATER_INTAKE = 'WATER_INTAKE',
  /** Exercise frequency target */
  EXERCISE_FREQUENCY = 'EXERCISE_FREQUENCY',
  /** Calorie intake target */
  CALORIE_INTAKE = 'CALORIE_INTAKE',
  /** Custom user-defined goal */
  CUSTOM = 'CUSTOM'
}

/**
 * Status of a health goal, tracking its progress and completion state.
 * Used for goal tracking and gamification integration.
 */
export enum HealthGoalStatus {
  /** Goal is active and being tracked */
  ACTIVE = 'ACTIVE',
  /** Goal has been achieved */
  ACHIEVED = 'ACHIEVED',
  /** Goal was not achieved by the end date */
  FAILED = 'FAILED',
  /** Goal has been paused by the user */
  PAUSED = 'PAUSED',
  /** Goal has been abandoned by the user */
  ABANDONED = 'ABANDONED'
}

/**
 * Represents a health goal set by the user.
 * Used for goal tracking and gamification in the My Health journey.
 * 
 * @example
 * // Step goal example
 * const stepGoal: HealthGoal = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   type: HealthGoalType.STEPS,
 *   target: 10000,
 *   startDate: '2023-01-01T00:00:00Z',
 *   endDate: '2023-01-31T23:59:59Z',
 *   status: HealthGoalStatus.ACTIVE,
 *   currentValue: 7500,
 *   unit: 'steps',
 *   description: 'Walk 10,000 steps daily for January',
 *   relatedAchievementIds: ['123e4567-e89b-12d3-a456-426614174002']
 * };
 * 
 * // Weight loss goal example
 * const weightGoal: HealthGoal = {
 *   id: '123e4567-e89b-12d3-a456-426614174003',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   type: HealthGoalType.WEIGHT,
 *   target: 70,
 *   startDate: '2023-01-01T00:00:00Z',
 *   endDate: '2023-03-31T23:59:59Z',
 *   status: HealthGoalStatus.ACTIVE,
 *   currentValue: 75,
 *   unit: 'kg',
 *   description: 'Reach 70kg by end of March',
 *   relatedAchievementIds: ['123e4567-e89b-12d3-a456-426614174004']
 * };
 */
export interface HealthGoal {
  /** Unique identifier for the goal */
  id: string;
  
  /** User ID of the goal owner */
  userId: string;
  
  /** Type of health goal from HealthGoalType enum */
  type: HealthGoalType | string;
  
  /** Numerical target value to achieve */
  target: number;
  
  /** When the goal tracking begins */
  startDate: string;
  
  /** When the goal should be achieved by */
  endDate: string;
  
  /** Current status of the goal from HealthGoalStatus enum */
  status: HealthGoalStatus | string;
  
  /** Current progress value (optional) */
  currentValue?: number;
  
  /** Unit of measurement (e.g., steps, kg, bpm) */
  unit?: string;
  
  /** User-provided description of the goal */
  description?: string;
  
  /** Related achievement IDs for gamification integration */
  relatedAchievementIds?: string[];
}

/**
 * Zod schema for validating health goal data.
 * Ensures data consistency for goal tracking and gamification integration.
 */
export const healthGoalSchema = z.object({
  id: z.string().uuid({
    message: "Goal ID must be a valid UUID"
  }),
  userId: z.string().uuid({
    message: "User ID must be a valid UUID"
  }),
  type: z.union([
    z.nativeEnum(HealthGoalType),
    z.string().min(1, {
      message: "Goal type cannot be empty"
    })
  ]),
  target: z.number({
    required_error: "Target value is required",
    invalid_type_error: "Target must be a number"
  }),
  startDate: z.string().datetime({
    message: "Start date must be a valid ISO datetime string"
  }),
  endDate: z.string().datetime({
    message: "End date must be a valid ISO datetime string"
  }),
  status: z.union([
    z.nativeEnum(HealthGoalStatus),
    z.string().min(1, {
      message: "Goal status cannot be empty"
    })
  ]),
  currentValue: z.number().optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
  relatedAchievementIds: z.array(z.string().uuid()).optional()
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"]
  }
);

/**
 * Type for creating a new health goal.
 * Omits the id field which will be generated by the backend.
 */
export type CreateHealthGoalInput = Omit<HealthGoal, 'id'> & {
  id?: string;
};

/**
 * Zod schema for validating health goal creation input.
 */
export const createHealthGoalSchema = healthGoalSchema.omit({
  id: true
}).extend({
  id: z.string().uuid().optional()
});

/**
 * Type for updating an existing health goal.
 * Makes all fields optional except id.
 */
export type UpdateHealthGoalInput = Partial<Omit<HealthGoal, 'id'>> & {
  id: string;
};

/**
 * Zod schema for validating health goal update input.
 */
export const updateHealthGoalSchema = healthGoalSchema.partial().required({
  id: true
});

/**
 * Interface for goal achievement events that integrate with the gamification system.
 * This matches the expected payload structure for HEALTH_GOAL_ACHIEVED events.
 */
export interface HealthGoalAchievement {
  /** ID of the health goal */
  goalId: string;
  /** Type of goal (steps, weight, etc.) */
  goalType: HealthGoalType | string;
  /** Target value that was achieved */
  targetValue: number;
  /** Unit of measurement */
  unit: string;
  /** When the goal was achieved */
  achievedAt: string;
}