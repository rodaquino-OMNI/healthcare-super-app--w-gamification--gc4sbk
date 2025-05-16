/**
 * @file TreatmentPlan interface for the Care journey
 * 
 * This file defines the TreatmentPlan interface used throughout the AUSTA SuperApp
 * Care journey. Treatment plans represent structured healthcare treatment plans
 * prescribed to users, including medications, therapies, exercises, and follow-ups.
 */

import { UserId } from '../common/user';
import { ProviderId } from './provider';

/**
 * Status of a treatment plan item
 */
export enum TreatmentItemStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  CANCELLED = 'CANCELLED',
}

/**
 * Type of treatment item
 */
export enum TreatmentItemType {
  MEDICATION = 'MEDICATION',
  THERAPY = 'THERAPY',
  EXERCISE = 'EXERCISE',
  FOLLOW_UP = 'FOLLOW_UP',
  TEST = 'TEST',
  OTHER = 'OTHER',
}

/**
 * Frequency of a treatment item
 */
export enum TreatmentFrequency {
  ONCE = 'ONCE',
  DAILY = 'DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  AS_NEEDED = 'AS_NEEDED',
}

/**
 * Represents a single item in a treatment plan
 * 
 * @example
 * // Medication item example
 * const medicationItem: TreatmentPlanItem = {
 *   id: '123',
 *   type: TreatmentItemType.MEDICATION,
 *   title: 'Amoxicillin',
 *   description: '500mg capsule',
 *   instructions: 'Take one capsule by mouth three times daily with food',
 *   frequency: TreatmentFrequency.THREE_TIMES_DAILY,
 *   duration: 10, // days
 *   status: TreatmentItemStatus.IN_PROGRESS,
 *   startDate: new Date('2023-06-01'),
 *   endDate: new Date('2023-06-10'),
 *   completedSessions: 12,
 *   totalSessions: 30,
 *   notes: 'Stop if rash develops',
 *   metadata: {
 *     medicationId: 'med-456',
 *     dosage: '500mg',
 *     route: 'oral',
 *   },
 * };
 */
export interface TreatmentPlanItem {
  /** Unique identifier for the treatment plan item */
  id: string;
  
  /** Type of treatment item */
  type: TreatmentItemType;
  
  /** Title of the treatment item */
  title: string;
  
  /** Detailed description of the treatment item */
  description?: string;
  
  /** Specific instructions for the treatment item */
  instructions?: string;
  
  /** Frequency of the treatment item */
  frequency?: TreatmentFrequency;
  
  /** Duration in days */
  duration?: number;
  
  /** Current status of the treatment item */
  status: TreatmentItemStatus;
  
  /** Start date of the treatment item */
  startDate: Date;
  
  /** End date of the treatment item */
  endDate?: Date;
  
  /** Number of completed sessions/doses */
  completedSessions?: number;
  
  /** Total number of sessions/doses required */
  totalSessions?: number;
  
  /** Additional notes about the treatment item */
  notes?: string;
  
  /** Additional metadata specific to the treatment type */
  metadata?: Record<string, any>;
  
  /** Related appointment ID if applicable */
  appointmentId?: string;
}

/**
 * Represents a complete treatment plan for a patient
 * 
 * @example
 * // Physical therapy treatment plan example
 * const physicalTherapyPlan: TreatmentPlan = {
 *   id: 'plan-789',
 *   userId: 'user-123',
 *   title: 'Knee Rehabilitation Program',
 *   description: 'Post-surgery rehabilitation program for right knee ACL repair',
 *   providerId: 'provider-456',
 *   providerName: 'Dr. Sarah Johnson',
 *   providerSpecialty: 'Physical Therapy',
 *   startDate: new Date('2023-05-15'),
 *   endDate: new Date('2023-07-15'),
 *   status: TreatmentItemStatus.IN_PROGRESS,
 *   progressPercentage: 35,
 *   items: [
 *     {
 *       id: 'item-1',
 *       type: TreatmentItemType.THERAPY,
 *       title: 'Knee Flexion Exercise',
 *       description: 'Gentle knee bending to improve range of motion',
 *       instructions: 'Perform 3 sets of 10 repetitions with 1-minute rest between sets',
 *       frequency: TreatmentFrequency.DAILY,
 *       status: TreatmentItemStatus.IN_PROGRESS,
 *       startDate: new Date('2023-05-15'),
 *       endDate: new Date('2023-07-15'),
 *       completedSessions: 12,
 *       totalSessions: 60,
 *     },
 *     {
 *       id: 'item-2',
 *       type: TreatmentItemType.FOLLOW_UP,
 *       title: 'Physical Therapy Follow-up',
 *       description: 'Progress evaluation with physical therapist',
 *       frequency: TreatmentFrequency.BIWEEKLY,
 *       status: TreatmentItemStatus.IN_PROGRESS,
 *       startDate: new Date('2023-05-22'),
 *       appointmentId: 'appt-123',
 *       completedSessions: 2,
 *       totalSessions: 5,
 *     }
 *   ],
 *   createdAt: new Date('2023-05-15'),
 *   updatedAt: new Date('2023-05-30'),
 *   metadata: {
 *     diagnosisCode: 'S83.51',
 *     insuranceApproved: true,
 *     estimatedRecoveryWeeks: 8,
 *   },
 * };
 */
export interface TreatmentPlan {
  /** Unique identifier for the treatment plan */
  id: string;
  
  /** User ID of the patient */
  userId: UserId;
  
  /** Title of the treatment plan */
  title: string;
  
  /** Detailed description of the treatment plan */
  description?: string;
  
  /** ID of the healthcare provider who created the plan */
  providerId: ProviderId;
  
  /** Name of the healthcare provider */
  providerName: string;
  
  /** Specialty of the healthcare provider */
  providerSpecialty?: string;
  
  /** Start date of the treatment plan */
  startDate: Date;
  
  /** End date of the treatment plan */
  endDate?: Date;
  
  /** Current status of the overall treatment plan */
  status: TreatmentItemStatus;
  
  /** Progress percentage (0-100) */
  progressPercentage: number;
  
  /** Individual treatment items in the plan */
  items: TreatmentPlanItem[];
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Additional metadata about the treatment plan */
  metadata?: Record<string, any>;
}