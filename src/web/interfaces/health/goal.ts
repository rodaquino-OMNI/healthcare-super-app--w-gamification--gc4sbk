/**
 * @file Defines the HealthGoal interface and its corresponding Zod validation schema.
 * This interface represents health objectives set by users, such as step targets,
 * weight goals, or blood pressure targets.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Types of health goals that can be set by users.
 * Used for categorizing and filtering goals in the Health journey.
 */
export enum HealthGoalType {
  /** Daily step count target */
  STEPS = 'STEPS',
  /** Target weight to achieve */
  WEIGHT = 'WEIGHT',
  /** Target blood pressure readings */
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  /** Target blood glucose levels */
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  /** Sleep duration target */
  SLEEP = 'SLEEP',
  /** Heart rate zone target */
  HEART_RATE = 'HEART_RATE',
  /** Custom user-defined goal */
  CUSTOM = 'CUSTOM',
}

/**
 * Status of a health goal tracking progress.
 * Used to display goal status in the UI and filter goals by state.
 */
export enum HealthGoalStatus {
  /** Goal is currently active and being tracked */
  ACTIVE = 'ACTIVE',
  /** Goal has been successfully completed */
  COMPLETED = 'COMPLETED',
  /** Goal was not achieved by the end date */
  FAILED = 'FAILED',
  /** Goal has been paused by the user */
  PAUSED = 'PAUSED',
  /** Goal has been abandoned before completion */
  ABANDONED = 'ABANDONED',
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
 *   lastUpdated: '2023-01-15T14:30:00Z',
 *   achievementId: '123e4567-e89b-12d3-a456-426614174002',
 *   description: 'Walk 10,000 steps daily for the month of January'
 * };
 */
export interface HealthGoal {
  /** Unique identifier for the goal */
  id: string;
  /** User ID who owns this goal */
  userId: string;
  /** Type of health goal */
  type: HealthGoalType | string;
  /** Numerical target value to achieve */
  target: number;
  /** Start date for goal tracking */
  startDate: string;
  /** End date for goal completion */
  endDate: string;
  /** Current status of the goal */
  status: HealthGoalStatus | string;
  /** Current progress value (optional) */
  currentValue?: number;
  /** Timestamp of last progress update (optional) */
  lastUpdated?: string;
  /** Associated achievement ID for gamification (optional) */
  achievementId?: string;
  /** User-provided description of the goal (optional) */
  description?: string;
}

/**
 * Zod schema for validating health goal data.
 * Ensures data consistency for goal tracking and integration with the gamification system.
 */
export const healthGoalSchema = z.object({
  id: z.string().uuid({ message: 'Goal ID must be a valid UUID' }),
  userId: z.string().uuid({ message: 'User ID must be a valid UUID' }),
  type: z.union([
    z.nativeEnum(HealthGoalType),
    z.string().min(1, { message: 'Goal type is required' })
  ]),
  target: z.number().positive({ message: 'Target must be a positive number' }),
  startDate: z.string().datetime({ message: 'Start date must be a valid ISO datetime string' }),
  endDate: z.string().datetime({ message: 'End date must be a valid ISO datetime string' }),
  status: z.union([
    z.nativeEnum(HealthGoalStatus),
    z.string().min(1, { message: 'Goal status is required' })
  ]),
  currentValue: z.number().optional(),
  lastUpdated: z.string().datetime().optional(),
  achievementId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'End date must be after or equal to start date',
    path: ['endDate'],
  }
);

/**
 * Type for a validated health goal.
 * Represents a health goal that has been validated with the Zod schema.
 */
export type ValidatedHealthGoal = z.infer<typeof healthGoalSchema>;