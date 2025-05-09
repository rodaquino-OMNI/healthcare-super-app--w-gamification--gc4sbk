/**
 * @file cross-journey-scenarios.ts
 * @description Provides complex end-to-end test scenarios that span multiple journeys in the gamification system.
 * These fixtures simulate users engaging with Health, Care, and Plan journeys simultaneously,
 * triggering cross-journey gamification rules and earning complex achievements.
 *
 * This file implements the following requirements from the technical specification:
 * - Create cross-journey achievement system
 * - Implement multi-journey achievement tracking
 * - Set up cross-journey event processing
 * - Develop testing framework for multi-journey scenarios
 * - Create tests for interactions between journeys
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, addHours, format } from 'date-fns';

// Import event types and interfaces
import {
  IEvent,
  IHealthEvent,
  ICareEvent,
  IPlanEvent,
  ISystemEvent,
  createEvent,
} from '@backend/gamification-engine/src/events/interfaces/event.interface';

import {
  HealthEventType,
  CareEventType,
  PlanEventType,
  CommonEventType,
} from '@backend/gamification-engine/src/events/interfaces/event-type.interface';

import { JourneyType } from '@austa/interfaces/common';
import { MetricType, GoalType } from '@austa/interfaces/journey/health';
import { AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

/**
 * Helper function to create a timestamp for a specific day offset from now
 * @param dayOffset Number of days to offset from current date (negative for past, positive for future)
 * @param hourOffset Optional hour offset within the day
 * @returns ISO string timestamp
 */
const createTimestamp = (dayOffset: number, hourOffset = 0): string => {
  const date = dayOffset >= 0 
    ? addDays(new Date(), dayOffset) 
    : subDays(new Date(), Math.abs(dayOffset));
  
  return addHours(date, hourOffset).toISOString();
};

/**
 * Helper function to create a health journey event
 * @param userId User ID
 * @param type Health event type
 * @param data Event data
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns Health journey event
 */
const createHealthEvent = (
  userId: string,
  type: HealthEventType,
  data: Record<string, any>,
  timestamp?: string
): IHealthEvent => {
  const event = createEvent(type, userId, data, 'health') as IHealthEvent;
  if (timestamp) {
    event.timestamp = timestamp;
  }
  return event;
};

/**
 * Helper function to create a care journey event
 * @param userId User ID
 * @param type Care event type
 * @param data Event data
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns Care journey event
 */
const createCareEvent = (
  userId: string,
  type: CareEventType,
  data: Record<string, any>,
  timestamp?: string
): ICareEvent => {
  const event = createEvent(type, userId, data, 'care') as ICareEvent;
  if (timestamp) {
    event.timestamp = timestamp;
  }
  return event;
};

/**
 * Helper function to create a plan journey event
 * @param userId User ID
 * @param type Plan event type
 * @param data Event data
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns Plan journey event
 */
const createPlanEvent = (
  userId: string,
  type: PlanEventType,
  data: Record<string, any>,
  timestamp?: string
): IPlanEvent => {
  const event = createEvent(type, userId, data, 'plan') as IPlanEvent;
  if (timestamp) {
    event.timestamp = timestamp;
  }
  return event;
};

/**
 * Helper function to create a system event
 * @param userId User ID
 * @param type Common event type
 * @param data Event data
 * @param timestamp Optional timestamp (defaults to current time)
 * @returns System event
 */
const createSystemEvent = (
  userId: string,
  type: CommonEventType,
  data: Record<string, any>,
  timestamp?: string
): ISystemEvent => {
  const event = createEvent(type, userId, data) as ISystemEvent;
  if (timestamp) {
    event.timestamp = timestamp;
  }
  return event;
};

/**
 * Interface for a test scenario
 */
export interface ITestScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Descriptive name of the scenario */
  name: string;
  
  /** Detailed description of what the scenario tests */
  description: string;
  
  /** User ID for the scenario */
  userId: string;
  
  /** Array of events in the scenario */
  events: IEvent[];
  
  /** Expected achievements to be unlocked */
  expectedAchievements?: string[];
  
  /** Expected XP to be earned */
  expectedXp?: number;
  
  /** Metadata for additional scenario information */
  metadata?: Record<string, any>;
}

/**
 * Scenario 1: Holistic Health Engagement
 * 
 * This scenario simulates a user who actively engages with all three journeys
 * in a coordinated way to manage their health holistically.
 * 
 * The user:
 * 1. Records health metrics regularly (Health Journey)
 * 2. Attends medical appointments (Care Journey)
 * 3. Submits claims for those appointments (Plan Journey)
 * 4. Takes medications as prescribed (Care Journey)
 * 5. Achieves health goals (Health Journey)
 * 
 * This should trigger cross-journey achievements related to holistic health management.
 */
export const holisticHealthEngagementScenario: ITestScenario = {
  id: uuidv4(),
  name: 'Holistic Health Engagement',
  description: 'User engages with all three journeys in a coordinated way to manage their health holistically',
  userId: 'user-holistic-health',
  events: [
    // Day 1: Initial health check and appointment booking
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 72,
          unit: 'bpm',
          source: 'manual',
        }
      },
      createTimestamp(-7, 9) // 7 days ago, 9 AM
    ),
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 120,
          unit: 'mmHg',
          source: 'manual',
        }
      },
      createTimestamp(-7, 9) // 7 days ago, 9 AM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.APPOINTMENT_BOOKED,
      {
        appointment: {
          id: 'appointment-1',
          type: AppointmentType.ROUTINE_CHECKUP,
          providerId: 'provider-1',
          scheduledFor: createTimestamp(-5, 14), // 5 days ago, 2 PM
        }
      },
      createTimestamp(-7, 10) // 7 days ago, 10 AM
    ),
    
    // Day 3: Health goal creation
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.GOAL_CREATED,
      {
        goal: {
          id: 'goal-1',
          type: GoalType.STEPS,
          targetValue: 10000,
          currentValue: 0,
        }
      },
      createTimestamp(-5, 8) // 5 days ago, 8 AM
    ),
    
    // Day 3: Appointment attendance and medication prescription
    createCareEvent(
      'user-holistic-health',
      CareEventType.APPOINTMENT_ATTENDED,
      {
        appointment: {
          id: 'appointment-1',
          type: AppointmentType.ROUTINE_CHECKUP,
          providerId: 'provider-1',
          status: 'completed',
          completedAt: createTimestamp(-5, 14), // 5 days ago, 2 PM
        }
      },
      createTimestamp(-5, 15) // 5 days ago, 3 PM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.MEDICATION_ADDED,
      {
        medication: {
          id: 'medication-1',
          name: 'Medication A',
          dosage: '10mg',
          frequency: 'daily',
          startDate: createTimestamp(-5),
          endDate: createTimestamp(9),
        }
      },
      createTimestamp(-5, 15) // 5 days ago, 3 PM
    ),
    
    // Day 4: Claim submission and medication adherence
    createPlanEvent(
      'user-holistic-health',
      PlanEventType.CLAIM_SUBMITTED,
      {
        claim: {
          id: 'claim-1',
          status: ClaimStatus.SUBMITTED,
          submittedAt: createTimestamp(-4, 10),
          amount: 150.00,
          claimType: 'medical',
          appointmentId: 'appointment-1',
        }
      },
      createTimestamp(-4, 10) // 4 days ago, 10 AM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-1',
          takenAt: createTimestamp(-4, 8),
          adherencePercentage: 100,
          onSchedule: true,
        }
      },
      createTimestamp(-4, 8) // 4 days ago, 8 AM
    ),
    
    // Day 5: Health metrics and medication adherence
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 70,
          unit: 'bpm',
          source: 'manual',
        }
      },
      createTimestamp(-3, 9) // 3 days ago, 9 AM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-1',
          takenAt: createTimestamp(-3, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 2,
        }
      },
      createTimestamp(-3, 8) // 3 days ago, 8 AM
    ),
    
    // Day 6: Claim approval, health goal progress, and medication adherence
    createPlanEvent(
      'user-holistic-health',
      PlanEventType.CLAIM_APPROVED,
      {
        claim: {
          id: 'claim-1',
          status: ClaimStatus.APPROVED,
          approvedAt: createTimestamp(-2, 14),
          amount: 150.00,
          approvedAmount: 120.00,
        }
      },
      createTimestamp(-2, 14) // 2 days ago, 2 PM
    ),
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.GOAL_UPDATED,
      {
        goal: {
          id: 'goal-1',
          type: GoalType.STEPS,
          targetValue: 10000,
          currentValue: 8000,
          progress: 0.8,
        }
      },
      createTimestamp(-2, 20) // 2 days ago, 8 PM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-1',
          takenAt: createTimestamp(-2, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 3,
        }
      },
      createTimestamp(-2, 8) // 2 days ago, 8 AM
    ),
    
    // Day 7: Goal achievement and medication adherence
    createHealthEvent(
      'user-holistic-health',
      HealthEventType.GOAL_ACHIEVED,
      {
        goal: {
          id: 'goal-1',
          type: GoalType.STEPS,
          targetValue: 10000,
          actualValue: 10500,
          completed: true,
        }
      },
      createTimestamp(-1, 21) // 1 day ago, 9 PM
    ),
    createCareEvent(
      'user-holistic-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-1',
          takenAt: createTimestamp(-1, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 4,
        }
      },
      createTimestamp(-1, 8) // 1 day ago, 8 AM
    ),
  ],
  expectedAchievements: [
    'health-check-streak',
    'steps-goal',
    'appointment-keeper',
    'medication-adherence',
    'claim-master',
    'holistic-health-manager', // Cross-journey achievement
  ],
  expectedXp: 350,
  metadata: {
    journeysInvolved: ['health', 'care', 'plan'],
    durationDays: 7,
    complexity: 'high',
  },
};

/**
 * Scenario 2: Simultaneous Journey Milestone Achievement
 * 
 * This scenario simulates a user who reaches significant milestones
 * in multiple journeys on the same day, triggering special cross-journey
 * achievements for synchronized progress.
 * 
 * The user:
 * 1. Achieves a major health goal (Health Journey)
 * 2. Completes a treatment plan (Care Journey)
 * 3. Receives approval for a significant claim (Plan Journey)
 * 
 * All these milestones happen within a 24-hour period, demonstrating
 * the system's ability to recognize synchronized achievements across journeys.
 */
export const simultaneousMilestoneScenario: ITestScenario = {
  id: uuidv4(),
  name: 'Simultaneous Journey Milestone Achievement',
  description: 'User reaches significant milestones in multiple journeys on the same day',
  userId: 'user-simultaneous-milestones',
  events: [
    // Previous activity to establish context (3 days before milestones)
    createHealthEvent(
      'user-simultaneous-milestones',
      HealthEventType.GOAL_CREATED,
      {
        goal: {
          id: 'weight-goal',
          type: GoalType.WEIGHT,
          targetValue: 75, // kg
          currentValue: 82,
        }
      },
      createTimestamp(-30, 10) // 30 days ago, 10 AM
    ),
    createCareEvent(
      'user-simultaneous-milestones',
      CareEventType.TREATMENT_PLAN_CREATED,
      {
        treatment: {
          id: 'treatment-plan-1',
          name: 'Physical Therapy Plan',
          duration: 28, // days
          startDate: createTimestamp(-28),
          endDate: createTimestamp(-1),
          providerId: 'provider-2',
        }
      },
      createTimestamp(-28, 14) // 28 days ago, 2 PM
    ),
    createPlanEvent(
      'user-simultaneous-milestones',
      PlanEventType.CLAIM_SUBMITTED,
      {
        claim: {
          id: 'major-claim',
          status: ClaimStatus.SUBMITTED,
          submittedAt: createTimestamp(-5, 11),
          amount: 2500.00,
          claimType: 'surgery',
          hasDocuments: true,
        }
      },
      createTimestamp(-5, 11) // 5 days ago, 11 AM
    ),
    
    // Milestone Day: All three major achievements in one day
    createHealthEvent(
      'user-simultaneous-milestones',
      HealthEventType.GOAL_ACHIEVED,
      {
        goal: {
          id: 'weight-goal',
          type: GoalType.WEIGHT,
          targetValue: 75,
          actualValue: 74.8,
          completed: true,
        }
      },
      createTimestamp(-1, 8) // 1 day ago, 8 AM
    ),
    createCareEvent(
      'user-simultaneous-milestones',
      CareEventType.TREATMENT_PLAN_COMPLETED,
      {
        treatment: {
          id: 'treatment-plan-1',
          completedAt: createTimestamp(-1, 15),
          success: true,
          providerId: 'provider-2',
        }
      },
      createTimestamp(-1, 15) // 1 day ago, 3 PM
    ),
    createPlanEvent(
      'user-simultaneous-milestones',
      PlanEventType.CLAIM_APPROVED,
      {
        claim: {
          id: 'major-claim',
          status: ClaimStatus.APPROVED,
          approvedAt: createTimestamp(-1, 17),
          amount: 2500.00,
          approvedAmount: 2000.00,
          processingDuration: 4, // days
        }
      },
      createTimestamp(-1, 17) // 1 day ago, 5 PM
    ),
  ],
  expectedAchievements: [
    'weight-management', // Health journey achievement
    'treatment-completer', // Care journey achievement
    'major-claim-approved', // Plan journey achievement
    'triple-milestone-day', // Cross-journey achievement for milestones in all journeys on same day
  ],
  expectedXp: 500,
  metadata: {
    journeysInvolved: ['health', 'care', 'plan'],
    durationDays: 30,
    complexity: 'medium',
    specialCondition: 'same-day-milestones',
  },
};

/**
 * Scenario 3: Consistent Cross-Journey Engagement
 * 
 * This scenario simulates a user who consistently engages with all three journeys
 * over an extended period, demonstrating the system's ability to track and reward
 * long-term engagement across multiple journeys.
 * 
 * The user:
 * 1. Records health metrics daily (Health Journey)
 * 2. Takes medications regularly (Care Journey)
 * 3. Checks insurance benefits weekly (Plan Journey)
 * 
 * This consistent pattern should trigger achievements related to sustained
 * cross-journey engagement and habit formation.
 */
export const consistentEngagementScenario: ITestScenario = {
  id: uuidv4(),
  name: 'Consistent Cross-Journey Engagement',
  description: 'User consistently engages with all three journeys over an extended period',
  userId: 'user-consistent-engagement',
  events: [
    // Generate 14 days of consistent engagement across all journeys
    // Each day includes health metrics, medication adherence, and periodic benefit checks
    
    // Day 1
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 68,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-14, 8) // 14 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-14, 9),
          adherencePercentage: 100,
          onSchedule: true,
        }
      },
      createTimestamp(-14, 9) // 14 days ago, 9 AM
    ),
    
    // Day 2
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 70,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-13, 8) // 13 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-13, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 2,
        }
      },
      createTimestamp(-13, 9) // 13 days ago, 9 AM
    ),
    
    // Day 3
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 69,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-12, 8) // 12 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-12, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 3,
        }
      },
      createTimestamp(-12, 9) // 12 days ago, 9 AM
    ),
    
    // Day 4
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 71,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-11, 8) // 11 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-11, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 4,
        }
      },
      createTimestamp(-11, 9) // 11 days ago, 9 AM
    ),
    
    // Day 5
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 67,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-10, 8) // 10 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-10, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 5,
        }
      },
      createTimestamp(-10, 9) // 10 days ago, 9 AM
    ),
    
    // Day 6
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 68,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-9, 8) // 9 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-9, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 6,
        }
      },
      createTimestamp(-9, 9) // 9 days ago, 9 AM
    ),
    
    // Day 7 (First week complete) - Also check benefits
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 69,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-8, 8) // 8 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-8, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 7,
        }
      },
      createTimestamp(-8, 9) // 8 days ago, 9 AM
    ),
    createPlanEvent(
      'user-consistent-engagement',
      PlanEventType.BENEFIT_VIEWED,
      {
        benefit: {
          id: 'benefit-1',
          type: 'preventive-care',
          action: 'viewed',
          utilizedAt: createTimestamp(-8, 10),
        }
      },
      createTimestamp(-8, 10) // 8 days ago, 10 AM
    ),
    
    // Day 8
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 70,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-7, 8) // 7 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-7, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 8,
        }
      },
      createTimestamp(-7, 9) // 7 days ago, 9 AM
    ),
    
    // Day 9
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 68,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-6, 8) // 6 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-6, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 9,
        }
      },
      createTimestamp(-6, 9) // 6 days ago, 9 AM
    ),
    
    // Day 10
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 67,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-5, 8) // 5 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-5, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 10,
        }
      },
      createTimestamp(-5, 9) // 5 days ago, 9 AM
    ),
    
    // Day 11
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 69,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-4, 8) // 4 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-4, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 11,
        }
      },
      createTimestamp(-4, 9) // 4 days ago, 9 AM
    ),
    
    // Day 12
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 70,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-3, 8) // 3 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-3, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 12,
        }
      },
      createTimestamp(-3, 9) // 3 days ago, 9 AM
    ),
    
    // Day 13
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 68,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-2, 8) // 2 days ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-2, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 13,
        }
      },
      createTimestamp(-2, 9) // 2 days ago, 9 AM
    ),
    
    // Day 14 (Second week complete) - Also check benefits
    createHealthEvent(
      'user-consistent-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.HEART_RATE,
          value: 67,
          unit: 'bpm',
          source: 'smartwatch',
        }
      },
      createTimestamp(-1, 8) // 1 day ago, 8 AM
    ),
    createCareEvent(
      'user-consistent-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'daily-medication',
          takenAt: createTimestamp(-1, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 14,
        }
      },
      createTimestamp(-1, 9) // 1 day ago, 9 AM
    ),
    createPlanEvent(
      'user-consistent-engagement',
      PlanEventType.BENEFIT_VIEWED,
      {
        benefit: {
          id: 'benefit-2',
          type: 'wellness-program',
          action: 'viewed',
          utilizedAt: createTimestamp(-1, 10),
        }
      },
      createTimestamp(-1, 10) // 1 day ago, 10 AM
    ),
  ],
  expectedAchievements: [
    'health-check-streak', // Health journey achievement
    'medication-adherence', // Care journey achievement
    'benefit-explorer', // Plan journey achievement
    'consistent-engagement', // Cross-journey achievement for consistent activity
    'two-week-wellness-warrior', // Cross-journey achievement for 14-day streak
  ],
  expectedXp: 450,
  metadata: {
    journeysInvolved: ['health', 'care', 'plan'],
    durationDays: 14,
    complexity: 'high',
    specialCondition: 'daily-engagement',
  },
};

/**
 * Scenario 4: Sporadic Multi-Journey Engagement
 * 
 * This scenario simulates a user who engages with different journeys
 * at different times, with varying levels of activity. This tests the
 * system's ability to track achievements across journeys even when
 * engagement is not consistent or simultaneous.
 * 
 * The user:
 * 1. Initially focuses on health tracking (Health Journey)
 * 2. Then shifts to care management (Care Journey)
 * 3. Finally engages with insurance benefits (Plan Journey)
 * 
 * This pattern should trigger achievements related to overall platform
 * engagement, even if the engagement is not consistent within each journey.
 */
export const sporadicEngagementScenario: ITestScenario = {
  id: uuidv4(),
  name: 'Sporadic Multi-Journey Engagement',
  description: 'User engages with different journeys at different times with varying activity levels',
  userId: 'user-sporadic-engagement',
  events: [
    // Week 1: Focus on Health Journey
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.WEIGHT,
          value: 80.5,
          unit: 'kg',
          source: 'smart-scale',
        }
      },
      createTimestamp(-30, 8) // 30 days ago, 8 AM
    ),
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.GOAL_CREATED,
      {
        goal: {
          id: 'weight-loss-goal',
          type: GoalType.WEIGHT,
          targetValue: 75,
          currentValue: 80.5,
        }
      },
      createTimestamp(-30, 9) // 30 days ago, 9 AM
    ),
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.STEPS,
          value: 8500,
          unit: 'steps',
          source: 'smartwatch',
        }
      },
      createTimestamp(-28, 20) // 28 days ago, 8 PM
    ),
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.WEIGHT,
          value: 80.1,
          unit: 'kg',
          source: 'smart-scale',
        }
      },
      createTimestamp(-26, 8) // 26 days ago, 8 AM
    ),
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.DEVICE_CONNECTED,
      {
        device: {
          id: 'device-1',
          type: 'smartwatch',
          action: 'connected',
          isFirstConnection: true,
        }
      },
      createTimestamp(-25, 14) // 25 days ago, 2 PM
    ),
    
    // Week 2-3: Shift to Care Journey
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.APPOINTMENT_BOOKED,
      {
        appointment: {
          id: 'appointment-2',
          type: AppointmentType.SPECIALIST,
          providerId: 'provider-3',
          scheduledFor: createTimestamp(-20, 15),
          specialtyArea: 'Cardiology',
        }
      },
      createTimestamp(-22, 10) // 22 days ago, 10 AM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.APPOINTMENT_ATTENDED,
      {
        appointment: {
          id: 'appointment-2',
          type: AppointmentType.SPECIALIST,
          providerId: 'provider-3',
          status: 'completed',
          completedAt: createTimestamp(-20, 16),
          specialtyArea: 'Cardiology',
        }
      },
      createTimestamp(-20, 16) // 20 days ago, 4 PM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.MEDICATION_ADDED,
      {
        medication: {
          id: 'medication-2',
          name: 'Medication B',
          dosage: '5mg',
          frequency: 'daily',
          startDate: createTimestamp(-20),
          endDate: createTimestamp(10),
        }
      },
      createTimestamp(-20, 16) // 20 days ago, 4 PM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-2',
          takenAt: createTimestamp(-19, 9),
          adherencePercentage: 100,
          onSchedule: true,
        }
      },
      createTimestamp(-19, 9) // 19 days ago, 9 AM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.SYMPTOM_CHECKED,
      {
        symptomChecker: {
          symptomIds: ['symptom-1', 'symptom-2'],
          checkedAt: createTimestamp(-18, 11),
          severity: 'mild',
          recommendationProvided: true,
        }
      },
      createTimestamp(-18, 11) // 18 days ago, 11 AM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'medication-2',
          takenAt: createTimestamp(-18, 9),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 2,
        }
      },
      createTimestamp(-18, 9) // 18 days ago, 9 AM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.TELEMEDICINE_SESSION_STARTED,
      {
        telemedicine: {
          id: 'telemedicine-1',
          providerId: 'provider-4',
          startTime: createTimestamp(-15, 14),
          specialtyArea: 'General Practice',
        }
      },
      createTimestamp(-15, 14) // 15 days ago, 2 PM
    ),
    createCareEvent(
      'user-sporadic-engagement',
      CareEventType.TELEMEDICINE_SESSION_COMPLETED,
      {
        telemedicine: {
          id: 'telemedicine-1',
          providerId: 'provider-4',
          startTime: createTimestamp(-15, 14),
          endTime: createTimestamp(-15, 14, 30), // 30 minutes later
          duration: 30,
          status: 'completed',
          specialtyArea: 'General Practice',
        }
      },
      createTimestamp(-15, 14, 30) // 15 days ago, 2:30 PM
    ),
    
    // Week 4: Engagement with Plan Journey
    createPlanEvent(
      'user-sporadic-engagement',
      PlanEventType.PLAN_VIEWED,
      {
        plan: {
          id: 'plan-1',
          action: 'viewed',
          planType: 'Standard',
          coverageLevel: 'Family',
        }
      },
      createTimestamp(-10, 11) // 10 days ago, 11 AM
    ),
    createPlanEvent(
      'user-sporadic-engagement',
      PlanEventType.CLAIM_SUBMITTED,
      {
        claim: {
          id: 'claim-2',
          status: ClaimStatus.SUBMITTED,
          submittedAt: createTimestamp(-10, 12),
          amount: 350.00,
          claimType: 'specialist',
          appointmentId: 'appointment-2',
        }
      },
      createTimestamp(-10, 12) // 10 days ago, 12 PM
    ),
    createPlanEvent(
      'user-sporadic-engagement',
      PlanEventType.DOCUMENT_UPLOADED,
      {
        document: {
          id: 'document-1',
          type: 'medical-receipt',
          uploadedAt: createTimestamp(-10, 12, 15),
          fileSize: 1024 * 1024, // 1 MB
          relatedClaimId: 'claim-2',
        }
      },
      createTimestamp(-10, 12, 15) // 10 days ago, 12:15 PM
    ),
    createPlanEvent(
      'user-sporadic-engagement',
      PlanEventType.BENEFIT_VIEWED,
      {
        benefit: {
          id: 'benefit-3',
          type: 'specialist-coverage',
          action: 'viewed',
          utilizedAt: createTimestamp(-8, 15),
        }
      },
      createTimestamp(-8, 15) // 8 days ago, 3 PM
    ),
    createPlanEvent(
      'user-sporadic-engagement',
      PlanEventType.CLAIM_APPROVED,
      {
        claim: {
          id: 'claim-2',
          status: ClaimStatus.APPROVED,
          approvedAt: createTimestamp(-5, 14),
          amount: 350.00,
          approvedAmount: 280.00,
          processingDuration: 5,
        }
      },
      createTimestamp(-5, 14) // 5 days ago, 2 PM
    ),
    
    // Recent activity: Return to Health Journey
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.WEIGHT,
          value: 77.2,
          unit: 'kg',
          source: 'smart-scale',
        }
      },
      createTimestamp(-2, 8) // 2 days ago, 8 AM
    ),
    createHealthEvent(
      'user-sporadic-engagement',
      HealthEventType.GOAL_UPDATED,
      {
        goal: {
          id: 'weight-loss-goal',
          type: GoalType.WEIGHT,
          targetValue: 75,
          currentValue: 77.2,
          progress: 0.66, // 66% progress toward goal
        }
      },
      createTimestamp(-2, 8, 5) // 2 days ago, 8:05 AM
    ),
  ],
  expectedAchievements: [
    'health-tracker', // Health journey achievement
    'care-explorer', // Care journey achievement
    'insurance-navigator', // Plan journey achievement
    'journey-hopper', // Cross-journey achievement for engaging with all journeys
    'platform-explorer', // Cross-journey achievement for using multiple features
  ],
  expectedXp: 300,
  metadata: {
    journeysInvolved: ['health', 'care', 'plan'],
    durationDays: 30,
    complexity: 'medium',
    specialCondition: 'journey-switching',
  },
};

/**
 * Scenario 5: Comprehensive Health Management
 * 
 * This scenario simulates a user who demonstrates comprehensive health management
 * by connecting activities across all three journeys in a meaningful way.
 * 
 * The user:
 * 1. Identifies a health issue through tracking (Health Journey)
 * 2. Seeks medical care for the issue (Care Journey)
 * 3. Successfully navigates insurance coverage (Plan Journey)
 * 4. Follows up with ongoing monitoring and adherence (Health + Care Journeys)
 * 
 * This pattern demonstrates the ideal user flow across journeys and should trigger
 * special achievements for comprehensive health management.
 */
export const comprehensiveHealthManagementScenario: ITestScenario = {
  id: uuidv4(),
  name: 'Comprehensive Health Management',
  description: 'User demonstrates comprehensive health management across all journeys',
  userId: 'user-comprehensive-health',
  events: [
    // Phase 1: Identifying health issue through tracking (Health Journey)
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 145, // Systolic, slightly elevated
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-45, 8) // 45 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.DEVICE_CONNECTED,
      {
        device: {
          id: 'bp-monitor',
          type: 'blood-pressure-monitor',
          action: 'connected',
          isFirstConnection: true,
        }
      },
      createTimestamp(-45, 8, 30) // 45 days ago, 8:30 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 148, // Systolic, elevated
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-44, 8) // 44 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_INSIGHT_VIEWED,
      {
        insight: {
          id: 'insight-1',
          type: 'elevated-blood-pressure',
          relatedMetrics: [MetricType.BLOOD_PRESSURE],
          severity: 'medium',
          generatedAt: createTimestamp(-44, 8, 5),
        }
      },
      createTimestamp(-44, 8, 10) // 44 days ago, 8:10 AM
    ),
    
    // Phase 2: Seeking medical care (Care Journey)
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.APPOINTMENT_BOOKED,
      {
        appointment: {
          id: 'appointment-3',
          type: AppointmentType.SPECIALIST,
          providerId: 'provider-5',
          scheduledFor: createTimestamp(-40, 14),
          specialtyArea: 'Cardiology',
        }
      },
      createTimestamp(-43, 10) // 43 days ago, 10 AM
    ),
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.APPOINTMENT_ATTENDED,
      {
        appointment: {
          id: 'appointment-3',
          type: AppointmentType.SPECIALIST,
          providerId: 'provider-5',
          status: 'completed',
          completedAt: createTimestamp(-40, 15),
          specialtyArea: 'Cardiology',
        }
      },
      createTimestamp(-40, 15) // 40 days ago, 3 PM
    ),
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_ADDED,
      {
        medication: {
          id: 'bp-medication',
          name: 'Blood Pressure Medication',
          dosage: '10mg',
          frequency: 'daily',
          startDate: createTimestamp(-40),
          endDate: createTimestamp(140), // Long-term medication
        }
      },
      createTimestamp(-40, 15, 30) // 40 days ago, 3:30 PM
    ),
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.TREATMENT_PLAN_CREATED,
      {
        treatment: {
          id: 'bp-treatment-plan',
          name: 'Blood Pressure Management',
          duration: 180, // 6 months
          startDate: createTimestamp(-40),
          providerId: 'provider-5',
        }
      },
      createTimestamp(-40, 15, 45) // 40 days ago, 3:45 PM
    ),
    
    // Phase 3: Insurance navigation (Plan Journey)
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.COVERAGE_CHECKED,
      {
        coverage: {
          type: 'specialist-visit',
          coveredPercentage: 80,
          deductibleApplied: true,
        }
      },
      createTimestamp(-39, 10) // 39 days ago, 10 AM
    ),
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.CLAIM_SUBMITTED,
      {
        claim: {
          id: 'claim-3',
          status: ClaimStatus.SUBMITTED,
          submittedAt: createTimestamp(-39, 11),
          amount: 250.00,
          claimType: 'specialist',
          appointmentId: 'appointment-3',
        }
      },
      createTimestamp(-39, 11) // 39 days ago, 11 AM
    ),
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.DOCUMENT_UPLOADED,
      {
        document: {
          id: 'document-2',
          type: 'medical-receipt',
          uploadedAt: createTimestamp(-39, 11, 15),
          fileSize: 1.5 * 1024 * 1024, // 1.5 MB
          relatedClaimId: 'claim-3',
        }
      },
      createTimestamp(-39, 11, 15) // 39 days ago, 11:15 AM
    ),
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.CLAIM_APPROVED,
      {
        claim: {
          id: 'claim-3',
          status: ClaimStatus.APPROVED,
          approvedAt: createTimestamp(-35, 14),
          amount: 250.00,
          approvedAmount: 200.00,
          processingDuration: 4,
        }
      },
      createTimestamp(-35, 14) // 35 days ago, 2 PM
    ),
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.BENEFIT_VIEWED,
      {
        benefit: {
          id: 'benefit-4',
          type: 'prescription-coverage',
          action: 'viewed',
          utilizedAt: createTimestamp(-35, 14, 30),
        }
      },
      createTimestamp(-35, 14, 30) // 35 days ago, 2:30 PM
    ),
    
    // Phase 4: Ongoing monitoring and adherence (Health + Care Journeys)
    // Sample of events over a 30-day period
    
    // Week 1
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'bp-medication',
          takenAt: createTimestamp(-30, 8),
          adherencePercentage: 100,
          onSchedule: true,
        }
      },
      createTimestamp(-30, 8) // 30 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 142, // Slight improvement
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-30, 8, 30) // 30 days ago, 8:30 AM
    ),
    
    // Week 2
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'bp-medication',
          takenAt: createTimestamp(-23, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 7,
        }
      },
      createTimestamp(-23, 8) // 23 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 138, // Continued improvement
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-23, 8, 30) // 23 days ago, 8:30 AM
    ),
    
    // Week 3
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'bp-medication',
          takenAt: createTimestamp(-16, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 14,
        }
      },
      createTimestamp(-16, 8) // 16 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 135, // Approaching normal range
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-16, 8, 30) // 16 days ago, 8:30 AM
    ),
    
    // Week 4
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'bp-medication',
          takenAt: createTimestamp(-9, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 21,
        }
      },
      createTimestamp(-9, 8) // 9 days ago, 8 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 130, // Normal range
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-9, 8, 30) // 9 days ago, 8:30 AM
    ),
    
    // Follow-up appointment
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.APPOINTMENT_BOOKED,
      {
        appointment: {
          id: 'appointment-4',
          type: AppointmentType.FOLLOW_UP,
          providerId: 'provider-5',
          scheduledFor: createTimestamp(-5, 14),
          specialtyArea: 'Cardiology',
        }
      },
      createTimestamp(-10, 11) // 10 days ago, 11 AM
    ),
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.APPOINTMENT_ATTENDED,
      {
        appointment: {
          id: 'appointment-4',
          type: AppointmentType.FOLLOW_UP,
          providerId: 'provider-5',
          status: 'completed',
          completedAt: createTimestamp(-5, 15),
          specialtyArea: 'Cardiology',
          followUpScheduled: false, // No further follow-up needed
        }
      },
      createTimestamp(-5, 15) // 5 days ago, 3 PM
    ),
    
    // Final claim and continued monitoring
    createPlanEvent(
      'user-comprehensive-health',
      PlanEventType.CLAIM_SUBMITTED,
      {
        claim: {
          id: 'claim-4',
          status: ClaimStatus.SUBMITTED,
          submittedAt: createTimestamp(-4, 10),
          amount: 150.00,
          claimType: 'follow-up',
          appointmentId: 'appointment-4',
        }
      },
      createTimestamp(-4, 10) // 4 days ago, 10 AM
    ),
    createHealthEvent(
      'user-comprehensive-health',
      HealthEventType.HEALTH_METRIC_RECORDED,
      {
        metric: {
          type: MetricType.BLOOD_PRESSURE,
          value: 128, // Normal range
          unit: 'mmHg',
          source: 'blood-pressure-monitor',
        }
      },
      createTimestamp(-2, 8) // 2 days ago, 8 AM
    ),
    createCareEvent(
      'user-comprehensive-health',
      CareEventType.MEDICATION_TAKEN,
      {
        medication: {
          id: 'bp-medication',
          takenAt: createTimestamp(-2, 8),
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: 28,
        }
      },
      createTimestamp(-2, 8) // 2 days ago, 8 AM
    ),
  ],
  expectedAchievements: [
    'health-monitor-master', // Health journey achievement
    'treatment-adherence', // Care journey achievement
    'claim-navigator', // Plan journey achievement
    'health-improvement', // Achievement for improving health metrics
    'comprehensive-care', // Cross-journey achievement for complete health management
    'health-journey-champion', // Major cross-journey achievement
  ],
  expectedXp: 600,
  metadata: {
    journeysInvolved: ['health', 'care', 'plan'],
    durationDays: 45,
    complexity: 'very-high',
    specialCondition: 'complete-health-management-cycle',
  },
};

/**
 * Export all scenarios as a collection for easy import in tests
 */
export const crossJourneyScenarios: ITestScenario[] = [
  holisticHealthEngagementScenario,
  simultaneousMilestoneScenario,
  consistentEngagementScenario,
  sporadicEngagementScenario,
  comprehensiveHealthManagementScenario,
];

/**
 * Helper function to get a scenario by name
 * @param name The name of the scenario to retrieve
 * @returns The matching scenario or undefined if not found
 */
export const getScenarioByName = (name: string): ITestScenario | undefined => {
  return crossJourneyScenarios.find(scenario => scenario.name === name);
};

/**
 * Helper function to get all events for a specific user ID
 * @param userId The user ID to filter events for
 * @returns Array of events for the specified user
 */
export const getEventsByUserId = (userId: string): IEvent[] => {
  const scenario = crossJourneyScenarios.find(s => s.userId === userId);
  return scenario ? scenario.events : [];
};

/**
 * Helper function to get all events for a specific journey
 * @param journey The journey to filter events for
 * @returns Array of events for the specified journey across all scenarios
 */
export const getEventsByJourney = (journey: JourneyType): IEvent[] => {
  return crossJourneyScenarios
    .flatMap(s => s.events)
    .filter(event => event.journey === journey);
};

/**
 * Helper function to get all events of a specific type
 * @param type The event type to filter for
 * @returns Array of events of the specified type across all scenarios
 */
export const getEventsByType = (type: string): IEvent[] => {
  return crossJourneyScenarios
    .flatMap(s => s.events)
    .filter(event => event.type === type);
};

export default crossJourneyScenarios;