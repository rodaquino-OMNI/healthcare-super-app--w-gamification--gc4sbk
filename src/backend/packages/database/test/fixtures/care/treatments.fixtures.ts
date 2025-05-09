/**
 * @file Treatment Plan Test Fixtures
 * 
 * This file provides test fixtures for treatment plans with different activities, durations,
 * progress metrics, and completion states. These fixtures enable testing of treatment plan
 * creation, progress tracking, milestone notifications, and integration with appointments
 * and medications in the Care journey.
 */

import { ITreatmentPlan } from '@austa/interfaces/journey/care';
import { ICareActivity } from '@austa/interfaces/journey/care/care-activity.interface';

/**
 * Interface for treatment plan test fixtures
 */
export interface TreatmentPlanFixture {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  activities?: CareActivityFixture[];
  appointmentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for care activity test fixtures
 */
export interface CareActivityFixture {
  id: string;
  name: string;
  description?: string;
  type: string;
  frequency?: string;
  durationMinutes?: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enum for treatment plan types
 */
export enum TreatmentPlanType {
  PHYSICAL_THERAPY = 'PHYSICAL_THERAPY',
  MEDICATION_REGIMEN = 'MEDICATION_REGIMEN',
  DIET_PLAN = 'DIET_PLAN',
  EXERCISE_PROGRAM = 'EXERCISE_PROGRAM',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  REHABILITATION = 'REHABILITATION'
}

/**
 * Enum for care activity types
 */
export enum CareActivityType {
  EXERCISE = 'EXERCISE',
  MEDICATION = 'MEDICATION',
  THERAPY = 'THERAPY',
  DIET = 'DIET',
  MEASUREMENT = 'MEASUREMENT',
  APPOINTMENT = 'APPOINTMENT'
}

/**
 * Enum for activity frequency
 */
export enum ActivityFrequency {
  DAILY = 'DAILY',
  TWICE_DAILY = 'TWICE_DAILY',
  WEEKLY = 'WEEKLY',
  TWICE_WEEKLY = 'TWICE_WEEKLY',
  MONTHLY = 'MONTHLY',
  AS_NEEDED = 'AS_NEEDED'
}

// Sample user IDs for test fixtures
const USER_IDS = {
  DEFAULT: '00000000-0000-0000-0000-000000000001',
  SECONDARY: '00000000-0000-0000-0000-000000000002',
  TERTIARY: '00000000-0000-0000-0000-000000000003'
};

// Sample appointment IDs for test fixtures
const APPOINTMENT_IDS = {
  PHYSICAL_THERAPY: '00000000-0000-0000-0000-000000000101',
  FOLLOW_UP: '00000000-0000-0000-0000-000000000102',
  INITIAL_CONSULTATION: '00000000-0000-0000-0000-000000000103'
};

/**
 * Creates a care activity fixture with the specified properties
 * 
 * @param id Unique identifier for the activity
 * @param name Name of the activity
 * @param type Type of the activity
 * @param options Additional options for the activity
 * @returns A care activity fixture
 */
export function createCareActivityFixture(
  id: string,
  name: string,
  type: CareActivityType,
  options: {
    description?: string;
    frequency?: ActivityFrequency;
    durationMinutes?: number;
    completed?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
): CareActivityFixture {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  return {
    id,
    name,
    description: options.description,
    type,
    frequency: options.frequency,
    durationMinutes: options.durationMinutes,
    completed: options.completed ?? false,
    createdAt: options.createdAt ?? oneHourAgo,
    updatedAt: options.updatedAt ?? now
  };
}

/**
 * Creates a treatment plan fixture with the specified properties
 * 
 * @param id Unique identifier for the treatment plan
 * @param userId User ID associated with the treatment plan
 * @param name Name of the treatment plan
 * @param options Additional options for the treatment plan
 * @returns A treatment plan fixture
 */
export function createTreatmentPlanFixture(
  id: string,
  userId: string,
  name: string,
  options: {
    description?: string;
    startDate?: Date;
    endDate?: Date;
    progress?: number;
    activities?: CareActivityFixture[];
    appointmentId?: string;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
): TreatmentPlanFixture {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return {
    id,
    userId,
    name,
    description: options.description,
    startDate: options.startDate ?? now,
    endDate: options.endDate ?? oneMonthFromNow,
    progress: options.progress ?? 0,
    activities: options.activities ?? [],
    appointmentId: options.appointmentId,
    createdAt: options.createdAt ?? oneHourAgo,
    updatedAt: options.updatedAt ?? now
  };
}

// ===== CARE ACTIVITY FIXTURES =====

/**
 * Physical therapy exercise activities
 */
const physicalTherapyActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000201',
    'Knee Extension Exercise',
    CareActivityType.EXERCISE,
    {
      description: 'Extend knee while seated, hold for 5 seconds, repeat 10 times',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 15,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000202',
    'Hamstring Stretch',
    CareActivityType.EXERCISE,
    {
      description: 'Stretch hamstring while seated, hold for 30 seconds, repeat 5 times',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 10,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000203',
    'Ankle Rotation',
    CareActivityType.EXERCISE,
    {
      description: 'Rotate ankle clockwise and counterclockwise, 10 rotations each direction',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 5,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000204',
    'Physical Therapy Session',
    CareActivityType.APPOINTMENT,
    {
      description: 'In-person session with physical therapist',
      frequency: ActivityFrequency.WEEKLY,
      durationMinutes: 60,
      completed: false
    }
  )
];

/**
 * Medication regimen activities
 */
const medicationRegimenActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000301',
    'Morning Antibiotic',
    CareActivityType.MEDICATION,
    {
      description: 'Take 500mg amoxicillin with breakfast',
      frequency: ActivityFrequency.DAILY,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000302',
    'Evening Antibiotic',
    CareActivityType.MEDICATION,
    {
      description: 'Take 500mg amoxicillin with dinner',
      frequency: ActivityFrequency.DAILY,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000303',
    'Probiotic Supplement',
    CareActivityType.MEDICATION,
    {
      description: 'Take probiotic supplement with lunch',
      frequency: ActivityFrequency.DAILY,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000304',
    'Follow-up Appointment',
    CareActivityType.APPOINTMENT,
    {
      description: 'Follow-up with doctor to assess treatment effectiveness',
      frequency: ActivityFrequency.MONTHLY,
      durationMinutes: 30,
      completed: false
    }
  )
];

/**
 * Diet plan activities
 */
const dietPlanActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000401',
    'Daily Calorie Tracking',
    CareActivityType.DIET,
    {
      description: 'Record all food intake and maintain under 2000 calories',
      frequency: ActivityFrequency.DAILY,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000402',
    'Water Intake',
    CareActivityType.DIET,
    {
      description: 'Drink at least 2 liters of water daily',
      frequency: ActivityFrequency.DAILY,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000403',
    'Weight Measurement',
    CareActivityType.MEASUREMENT,
    {
      description: 'Record weight in the morning before breakfast',
      frequency: ActivityFrequency.WEEKLY,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000404',
    'Nutritionist Consultation',
    CareActivityType.APPOINTMENT,
    {
      description: 'Virtual consultation with nutritionist',
      frequency: ActivityFrequency.MONTHLY,
      durationMinutes: 45,
      completed: false
    }
  )
];

/**
 * Exercise program activities
 */
const exerciseProgramActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000501',
    'Cardiovascular Exercise',
    CareActivityType.EXERCISE,
    {
      description: '30 minutes of moderate-intensity cardio (walking, cycling, or swimming)',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 30,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000502',
    'Strength Training',
    CareActivityType.EXERCISE,
    {
      description: 'Full-body strength training routine',
      frequency: ActivityFrequency.TWICE_WEEKLY,
      durationMinutes: 45,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000503',
    'Flexibility Exercises',
    CareActivityType.EXERCISE,
    {
      description: 'Full-body stretching routine',
      frequency: ActivityFrequency.TWICE_WEEKLY,
      durationMinutes: 20,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000504',
    'Heart Rate Monitoring',
    CareActivityType.MEASUREMENT,
    {
      description: 'Record resting heart rate in the morning',
      frequency: ActivityFrequency.WEEKLY,
      completed: true
    }
  )
];

/**
 * Mental health treatment activities
 */
const mentalHealthActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000601',
    'Meditation Session',
    CareActivityType.THERAPY,
    {
      description: 'Guided meditation for anxiety reduction',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 15,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000602',
    'Journaling',
    CareActivityType.THERAPY,
    {
      description: 'Write in journal about thoughts and feelings',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 10,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000603',
    'Therapy Session',
    CareActivityType.APPOINTMENT,
    {
      description: 'Virtual therapy session',
      frequency: ActivityFrequency.WEEKLY,
      durationMinutes: 50,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000604',
    'Mood Tracking',
    CareActivityType.MEASUREMENT,
    {
      description: 'Record mood and anxiety levels',
      frequency: ActivityFrequency.DAILY,
      completed: true
    }
  )
];

/**
 * Rehabilitation program activities
 */
const rehabilitationActivities: CareActivityFixture[] = [
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000701',
    'Gait Training',
    CareActivityType.EXERCISE,
    {
      description: 'Practice walking with proper form using assistive device',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 20,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000702',
    'Balance Exercises',
    CareActivityType.EXERCISE,
    {
      description: 'Perform standing balance exercises with support',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 15,
      completed: true
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000703',
    'Strength Building',
    CareActivityType.EXERCISE,
    {
      description: 'Targeted strength exercises for affected areas',
      frequency: ActivityFrequency.DAILY,
      durationMinutes: 20,
      completed: false
    }
  ),
  createCareActivityFixture(
    '00000000-0000-0000-0000-000000000704',
    'Rehabilitation Session',
    CareActivityType.APPOINTMENT,
    {
      description: 'In-person rehabilitation session with specialist',
      frequency: ActivityFrequency.TWICE_WEEKLY,
      durationMinutes: 60,
      completed: false
    }
  )
];

// ===== TREATMENT PLAN FIXTURES =====

/**
 * Not started treatment plan (0% progress)
 */
const notStartedTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001001',
  USER_IDS.DEFAULT,
  'Knee Rehabilitation Program',
  {
    description: 'Comprehensive rehabilitation program for knee injury recovery',
    startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // Starts in 7 days
    endDate: new Date(new Date().getTime() + 67 * 24 * 60 * 60 * 1000), // Ends in 67 days (2 months after start)
    progress: 0,
    activities: physicalTherapyActivities,
    appointmentId: APPOINTMENT_IDS.PHYSICAL_THERAPY
  }
);

/**
 * Just started treatment plan (5% progress)
 */
const justStartedTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001002',
  USER_IDS.DEFAULT,
  'Antibiotic Treatment Course',
  {
    description: 'Two-week course of antibiotics for respiratory infection',
    startDate: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000), // Started 1 day ago
    endDate: new Date(new Date().getTime() + 13 * 24 * 60 * 60 * 1000), // Ends in 13 days
    progress: 5,
    activities: medicationRegimenActivities,
    appointmentId: APPOINTMENT_IDS.FOLLOW_UP
  }
);

/**
 * Early progress treatment plan (25% progress)
 */
const earlyProgressTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001003',
  USER_IDS.SECONDARY,
  'Weight Management Plan',
  {
    description: 'Three-month diet and exercise plan for weight management',
    startDate: new Date(new Date().getTime() - 22 * 24 * 60 * 60 * 1000), // Started 22 days ago
    endDate: new Date(new Date().getTime() + 68 * 24 * 60 * 60 * 1000), // Ends in 68 days
    progress: 25,
    activities: dietPlanActivities
  }
);

/**
 * Halfway treatment plan (50% progress)
 */
const halfwayTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001004',
  USER_IDS.DEFAULT,
  'Cardiac Rehabilitation Program',
  {
    description: 'Structured exercise program to improve cardiovascular health',
    startDate: new Date(new Date().getTime() - 45 * 24 * 60 * 60 * 1000), // Started 45 days ago
    endDate: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000), // Ends in 45 days
    progress: 50,
    activities: exerciseProgramActivities
  }
);

/**
 * Advanced progress treatment plan (75% progress)
 */
const advancedProgressTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001005',
  USER_IDS.TERTIARY,
  'Anxiety Management Program',
  {
    description: 'Comprehensive program for managing anxiety and stress',
    startDate: new Date(new Date().getTime() - 45 * 24 * 60 * 60 * 1000), // Started 45 days ago
    endDate: new Date(new Date().getTime() + 15 * 24 * 60 * 60 * 1000), // Ends in 15 days
    progress: 75,
    activities: mentalHealthActivities
  }
);

/**
 * Nearly completed treatment plan (90% progress)
 */
const nearlyCompletedTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001006',
  USER_IDS.DEFAULT,
  'Post-Surgery Rehabilitation',
  {
    description: 'Rehabilitation program following hip replacement surgery',
    startDate: new Date(new Date().getTime() - 80 * 24 * 60 * 60 * 1000), // Started 80 days ago
    endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000), // Ends in 10 days
    progress: 90,
    activities: rehabilitationActivities,
    appointmentId: APPOINTMENT_IDS.FOLLOW_UP
  }
);

/**
 * Completed treatment plan (100% progress)
 */
const completedTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001007',
  USER_IDS.SECONDARY,
  'Physical Therapy for Shoulder',
  {
    description: 'Physical therapy program for shoulder impingement',
    startDate: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000), // Started 90 days ago
    endDate: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // Ended 10 days ago
    progress: 100,
    activities: physicalTherapyActivities.map(activity => ({ ...activity, completed: true }))
  }
);

/**
 * Overdue treatment plan (past end date with incomplete progress)
 */
const overdueTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001008',
  USER_IDS.TERTIARY,
  'Medication Adherence Program',
  {
    description: 'Structured program to improve medication adherence',
    startDate: new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000), // Started 60 days ago
    endDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000), // Ended 5 days ago
    progress: 65,
    activities: medicationRegimenActivities
  }
);

/**
 * Abandoned treatment plan (no recent progress updates)
 */
const abandonedTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001009',
  USER_IDS.DEFAULT,
  'Stress Management Program',
  {
    description: 'Program for managing work-related stress',
    startDate: new Date(new Date().getTime() - 120 * 24 * 60 * 60 * 1000), // Started 120 days ago
    endDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000), // Ended 30 days ago
    progress: 20,
    activities: mentalHealthActivities,
    updatedAt: new Date(new Date().getTime() - 60 * 24 * 60 * 60 * 1000) // Last updated 60 days ago
  }
);

/**
 * Long-term treatment plan (extended duration)
 */
const longTermTreatmentPlan = createTreatmentPlanFixture(
  '00000000-0000-0000-0000-000000001010',
  USER_IDS.SECONDARY,
  'Chronic Condition Management',
  {
    description: 'Long-term management plan for chronic condition',
    startDate: new Date(new Date().getTime() - 180 * 24 * 60 * 60 * 1000), // Started 180 days ago
    endDate: new Date(new Date().getTime() + 180 * 24 * 60 * 60 * 1000), // Ends in 180 days
    progress: 45,
    activities: [
      ...dietPlanActivities,
      ...exerciseProgramActivities
    ]
  }
);

// Collection of all treatment plan fixtures
export const treatmentPlanFixtures = [
  notStartedTreatmentPlan,
  justStartedTreatmentPlan,
  earlyProgressTreatmentPlan,
  halfwayTreatmentPlan,
  advancedProgressTreatmentPlan,
  nearlyCompletedTreatmentPlan,
  completedTreatmentPlan,
  overdueTreatmentPlan,
  abandonedTreatmentPlan,
  longTermTreatmentPlan
];

/**
 * Gets treatment plans by progress range
 * 
 * @param minProgress Minimum progress percentage (inclusive)
 * @param maxProgress Maximum progress percentage (inclusive)
 * @returns Array of treatment plans within the specified progress range
 */
export function getTreatmentsByProgressRange(minProgress: number, maxProgress: number): TreatmentPlanFixture[] {
  return treatmentPlanFixtures.filter(
    plan => plan.progress >= minProgress && plan.progress <= maxProgress
  );
}

/**
 * Gets treatment plans by user ID
 * 
 * @param userId User ID to filter by
 * @returns Array of treatment plans for the specified user
 */
export function getTreatmentsByUserId(userId: string): TreatmentPlanFixture[] {
  return treatmentPlanFixtures.filter(plan => plan.userId === userId);
}

/**
 * Gets treatment plans by appointment ID
 * 
 * @param appointmentId Appointment ID to filter by
 * @returns Array of treatment plans associated with the specified appointment
 */
export function getTreatmentsByAppointmentId(appointmentId: string): TreatmentPlanFixture[] {
  return treatmentPlanFixtures.filter(plan => plan.appointmentId === appointmentId);
}

/**
 * Gets treatment plans by type based on name and description
 * 
 * @param type Treatment plan type to filter by
 * @returns Array of treatment plans of the specified type
 */
export function getTreatmentsByType(type: TreatmentPlanType): TreatmentPlanFixture[] {
  const typeKeywords = {
    [TreatmentPlanType.PHYSICAL_THERAPY]: ['physical therapy', 'rehabilitation', 'exercise'],
    [TreatmentPlanType.MEDICATION_REGIMEN]: ['medication', 'antibiotic', 'adherence'],
    [TreatmentPlanType.DIET_PLAN]: ['diet', 'weight', 'nutrition'],
    [TreatmentPlanType.EXERCISE_PROGRAM]: ['exercise', 'cardio', 'fitness'],
    [TreatmentPlanType.MENTAL_HEALTH]: ['mental', 'anxiety', 'stress'],
    [TreatmentPlanType.REHABILITATION]: ['rehabilitation', 'recovery', 'post-surgery']
  };
  
  const keywords = typeKeywords[type];
  
  return treatmentPlanFixtures.filter(plan => {
    const nameAndDescription = `${plan.name.toLowerCase()} ${plan.description?.toLowerCase() || ''}`;
    return keywords.some(keyword => nameAndDescription.includes(keyword));
  });
}

/**
 * Gets current treatment plans (started but not completed)
 * 
 * @returns Array of current treatment plans
 */
export function getCurrentTreatments(): TreatmentPlanFixture[] {
  const now = new Date();
  return treatmentPlanFixtures.filter(plan => {
    return plan.startDate <= now && 
           (!plan.endDate || plan.endDate >= now) && 
           plan.progress < 100;
  });
}

/**
 * Gets past treatment plans (completed or past end date)
 * 
 * @returns Array of past treatment plans
 */
export function getPastTreatments(): TreatmentPlanFixture[] {
  const now = new Date();
  return treatmentPlanFixtures.filter(plan => {
    return (plan.endDate && plan.endDate < now) || plan.progress === 100;
  });
}

/**
 * Gets future treatment plans (not yet started)
 * 
 * @returns Array of future treatment plans
 */
export function getFutureTreatments(): TreatmentPlanFixture[] {
  const now = new Date();
  return treatmentPlanFixtures.filter(plan => plan.startDate > now);
}

/**
 * Gets treatment plans with milestone progress (25%, 50%, 75%, 100%)
 * Useful for testing milestone notifications and gamification events
 * 
 * @returns Object containing treatment plans at different milestone progress levels
 */
export function getMilestoneTreatments(): { [key: string]: TreatmentPlanFixture } {
  return {
    quarterComplete: earlyProgressTreatmentPlan,      // 25%
    halfComplete: halfwayTreatmentPlan,               // 50%
    threeQuartersComplete: advancedProgressTreatmentPlan, // 75%
    fullyComplete: completedTreatmentPlan             // 100%
  };
}

/**
 * Gets treatment plans with activities of a specific type
 * 
 * @param activityType Type of activity to filter by
 * @returns Array of treatment plans containing activities of the specified type
 */
export function getTreatmentsWithActivityType(activityType: CareActivityType): TreatmentPlanFixture[] {
  return treatmentPlanFixtures.filter(plan => {
    return plan.activities?.some(activity => activity.type === activityType);
  });
}

/**
 * Gets treatment plans with overdue activities
 * (Activities that are not completed but should be based on frequency)
 * 
 * @returns Array of treatment plans with overdue activities
 */
export function getTreatmentsWithOverdueActivities(): TreatmentPlanFixture[] {
  const now = new Date();
  return treatmentPlanFixtures.filter(plan => {
    // Only consider active plans
    if (plan.progress >= 100 || (plan.endDate && plan.endDate < now)) {
      return false;
    }
    
    // Check for overdue activities
    return plan.activities?.some(activity => {
      if (activity.completed) return false;
      
      // Simple logic to determine if an activity is overdue based on frequency
      // In a real implementation, this would be more sophisticated
      switch (activity.frequency) {
        case ActivityFrequency.DAILY:
        case ActivityFrequency.TWICE_DAILY:
          return true; // Daily activities are overdue if not completed
        case ActivityFrequency.WEEKLY:
        case ActivityFrequency.TWICE_WEEKLY:
          return plan.startDate.getTime() < now.getTime() - 7 * 24 * 60 * 60 * 1000;
        case ActivityFrequency.MONTHLY:
          return plan.startDate.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000;
        default:
          return false;
      }
    });
  });
}

/**
 * Gets a specific treatment plan by ID
 * 
 * @param id Treatment plan ID
 * @returns The treatment plan with the specified ID, or undefined if not found
 */
export function getTreatmentById(id: string): TreatmentPlanFixture | undefined {
  return treatmentPlanFixtures.find(plan => plan.id === id);
}

/**
 * Creates a custom treatment plan with the specified properties
 * 
 * @param options Custom properties for the treatment plan
 * @returns A custom treatment plan fixture
 */
export function createCustomTreatmentPlan(options: {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  activities?: CareActivityFixture[];
  appointmentId?: string;
}): TreatmentPlanFixture {
  return createTreatmentPlanFixture(
    options.id || `custom-${Math.random().toString(36).substring(2, 11)}`,
    options.userId || USER_IDS.DEFAULT,
    options.name,
    {
      description: options.description,
      startDate: options.startDate,
      endDate: options.endDate,
      progress: options.progress,
      activities: options.activities,
      appointmentId: options.appointmentId
    }
  );
}