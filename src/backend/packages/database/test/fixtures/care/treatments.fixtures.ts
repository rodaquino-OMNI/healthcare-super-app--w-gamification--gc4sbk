/**
 * Test fixtures for treatment plans in the Care journey.
 * 
 * These fixtures provide standardized test data for treatment plans with different
 * progress states, durations, and activities. They enable testing of treatment plan
 * creation, progress tracking, milestone notifications, and integration with
 * appointments and medications.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Interface for treatment plan activity types
 */
export enum TreatmentActivityType {
  APPOINTMENT = 'APPOINTMENT',
  MEDICATION = 'MEDICATION',
  EXERCISE = 'EXERCISE',
  DIET = 'DIET',
  MEASUREMENT = 'MEASUREMENT',
  OTHER = 'OTHER'
}

/**
 * Interface for treatment plan activity
 */
export interface TreatmentActivity {
  id: string;
  type: TreatmentActivityType;
  name: string;
  description?: string;
  scheduledDate?: Date;
  completed: boolean;
  completedDate?: Date;
  referenceId?: string; // ID reference to appointment, medication, etc.
}

/**
 * Interface for treatment plan milestone
 */
export interface TreatmentMilestone {
  id: string;
  name: string;
  description?: string;
  targetDate: Date;
  targetProgress: number; // percentage
  reached: boolean;
  reachedDate?: Date;
}

/**
 * Interface for treatment plan test fixture
 */
export interface TreatmentPlanFixture {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  progress: number; // percentage
  activities: TreatmentActivity[];
  milestones: TreatmentMilestone[];
  userId: string;
  providerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for creating a treatment plan fixture
 */
export interface TreatmentPlanFixtureOptions {
  id?: string;
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  activities?: Partial<TreatmentActivity>[];
  milestones?: Partial<TreatmentMilestone>[];
  userId?: string;
  providerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a treatment activity with default values
 * 
 * @param options - Partial treatment activity properties to override defaults
 * @returns A complete treatment activity object
 */
export const createTreatmentActivity = (options: Partial<TreatmentActivity> = {}): TreatmentActivity => {
  return {
    id: options.id || uuidv4(),
    type: options.type || TreatmentActivityType.OTHER,
    name: options.name || 'Default Activity',
    description: options.description,
    scheduledDate: options.scheduledDate,
    completed: options.completed !== undefined ? options.completed : false,
    completedDate: options.completedDate,
    referenceId: options.referenceId
  };
};

/**
 * Creates a treatment milestone with default values
 * 
 * @param options - Partial treatment milestone properties to override defaults
 * @returns A complete treatment milestone object
 */
export const createTreatmentMilestone = (options: Partial<TreatmentMilestone> = {}): TreatmentMilestone => {
  return {
    id: options.id || uuidv4(),
    name: options.name || 'Default Milestone',
    description: options.description,
    targetDate: options.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 1 week from now
    targetProgress: options.targetProgress !== undefined ? options.targetProgress : 25,
    reached: options.reached !== undefined ? options.reached : false,
    reachedDate: options.reachedDate
  };
};

/**
 * Creates a treatment plan fixture with default values
 * 
 * @param options - Partial treatment plan properties to override defaults
 * @returns A complete treatment plan fixture
 */
export const createTreatmentPlanFixture = (options: TreatmentPlanFixtureOptions = {}): TreatmentPlanFixture => {
  const now = new Date();
  const startDate = options.startDate || now;
  const endDate = options.endDate || new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
  
  // Create activities with proper defaults if not provided
  const activities = (options.activities || []).map(activity => createTreatmentActivity(activity));
  
  // Create milestones with proper defaults if not provided
  const milestones = (options.milestones || []).map(milestone => createTreatmentMilestone(milestone));
  
  return {
    id: options.id || uuidv4(),
    name: options.name || 'Default Treatment Plan',
    description: options.description || 'A default treatment plan for testing',
    startDate,
    endDate,
    progress: options.progress !== undefined ? options.progress : 0,
    activities,
    milestones,
    userId: options.userId || uuidv4(),
    providerId: options.providerId,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now
  };
};

/**
 * Predefined treatment plan fixture for a not started physical therapy plan
 */
export const notStartedPhysicalTherapyPlan: TreatmentPlanFixture = createTreatmentPlanFixture({
  name: 'Physical Therapy Plan',
  description: 'A comprehensive physical therapy plan for knee rehabilitation',
  progress: 0,
  activities: [
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Initial Assessment',
      description: 'Initial assessment with physical therapist',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      completed: false
    },
    {
      type: TreatmentActivityType.EXERCISE,
      name: 'Knee Strengthening Exercises',
      description: 'Daily knee strengthening exercises - 3 sets of 10 reps',
      completed: false
    },
    {
      type: TreatmentActivityType.EXERCISE,
      name: 'Range of Motion Exercises',
      description: 'Daily range of motion exercises - 2 sets of 15 reps',
      completed: false
    }
  ],
  milestones: [
    {
      name: 'Initial Assessment Complete',
      targetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      targetProgress: 10,
      reached: false
    },
    {
      name: 'Basic Mobility Achieved',
      targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      targetProgress: 50,
      reached: false
    },
    {
      name: 'Full Range of Motion Restored',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      targetProgress: 100,
      reached: false
    }
  ]
});

/**
 * Predefined treatment plan fixture for an in-progress medication regimen
 */
export const inProgressMedicationPlan: TreatmentPlanFixture = createTreatmentPlanFixture({
  name: 'Hypertension Medication Plan',
  description: 'Medication regimen for managing hypertension',
  progress: 45,
  startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Started 15 days ago
  endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Ends 15 days from now
  activities: [
    {
      type: TreatmentActivityType.MEDICATION,
      name: 'Lisinopril 10mg',
      description: 'Take once daily in the morning',
      completed: false
    },
    {
      type: TreatmentActivityType.MEASUREMENT,
      name: 'Blood Pressure Reading',
      description: 'Measure blood pressure twice daily',
      completed: false
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Follow-up Appointment',
      description: 'Follow-up with cardiologist',
      scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      completed: false
    },
    {
      type: TreatmentActivityType.DIET,
      name: 'Low Sodium Diet',
      description: 'Follow low sodium diet plan',
      completed: true,
      completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Completed 5 days ago
    }
  ],
  milestones: [
    {
      name: 'Diet Adjustment Complete',
      targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      targetProgress: 25,
      reached: true,
      reachedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Blood Pressure Stabilized',
      targetDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      targetProgress: 60,
      reached: false
    },
    {
      name: 'Treatment Regimen Complete',
      targetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      targetProgress: 100,
      reached: false
    }
  ]
});

/**
 * Predefined treatment plan fixture for a completed diabetes management plan
 */
export const completedDiabetesPlan: TreatmentPlanFixture = createTreatmentPlanFixture({
  name: 'Diabetes Management Plan',
  description: 'Comprehensive diabetes management program',
  progress: 100,
  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Started 90 days ago
  endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Ended 5 days ago
  activities: [
    {
      type: TreatmentActivityType.MEDICATION,
      name: 'Metformin 500mg',
      description: 'Take twice daily with meals',
      completed: true,
      completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.MEASUREMENT,
      name: 'Blood Glucose Monitoring',
      description: 'Check blood glucose levels 3 times daily',
      completed: true,
      completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.DIET,
      name: 'Diabetic Diet Plan',
      description: 'Follow recommended diabetic diet',
      completed: true,
      completedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.EXERCISE,
      name: 'Regular Exercise',
      description: '30 minutes of moderate exercise daily',
      completed: true,
      completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Endocrinologist Follow-up',
      description: 'Final follow-up with endocrinologist',
      scheduledDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      completed: true,
      completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    }
  ],
  milestones: [
    {
      name: 'Diet Adjustment Complete',
      targetDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      targetProgress: 30,
      reached: true,
      reachedDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Exercise Routine Established',
      targetDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      targetProgress: 60,
      reached: true,
      reachedDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Blood Glucose Stabilized',
      targetDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      targetProgress: 90,
      reached: true,
      reachedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Treatment Plan Complete',
      targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      targetProgress: 100,
      reached: true,
      reachedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    }
  ]
});

/**
 * Predefined treatment plan fixture for a long-term cardiac rehabilitation plan
 */
export const longTermCardiacRehabPlan: TreatmentPlanFixture = createTreatmentPlanFixture({
  name: 'Cardiac Rehabilitation Program',
  description: 'Long-term cardiac rehabilitation following myocardial infarction',
  progress: 35,
  startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Started 60 days ago
  endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // Ends 120 days from now (6 month program)
  activities: [
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Initial Cardiac Assessment',
      description: 'Comprehensive cardiac evaluation',
      scheduledDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      completed: true,
      completedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.EXERCISE,
      name: 'Supervised Exercise Program',
      description: 'Thrice weekly supervised exercise sessions',
      completed: false
    },
    {
      type: TreatmentActivityType.DIET,
      name: 'Heart-Healthy Diet',
      description: 'Mediterranean diet with reduced sodium',
      completed: true,
      completedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.MEDICATION,
      name: 'Cardiac Medication Regimen',
      description: 'Daily medication regimen including statins and beta-blockers',
      completed: false
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Mid-program Assessment',
      description: 'Evaluation of progress at program midpoint',
      scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      completed: false
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Final Evaluation',
      description: 'Final program evaluation and future recommendations',
      scheduledDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      completed: false
    }
  ],
  milestones: [
    {
      name: 'Initial Assessment Complete',
      targetDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      targetProgress: 10,
      reached: true,
      reachedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Dietary Changes Implemented',
      targetDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      targetProgress: 25,
      reached: true,
      reachedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Exercise Tolerance Improved',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      targetProgress: 50,
      reached: false
    },
    {
      name: 'Medication Optimization',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      targetProgress: 75,
      reached: false
    },
    {
      name: 'Program Completion',
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      targetProgress: 100,
      reached: false
    }
  ]
});

/**
 * Predefined treatment plan fixture for a short-term post-surgery recovery plan
 */
export const shortTermPostSurgeryPlan: TreatmentPlanFixture = createTreatmentPlanFixture({
  name: 'Post-Surgery Recovery Plan',
  description: 'Short-term recovery plan following appendectomy',
  progress: 75,
  startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Started 10 days ago
  endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Ends 4 days from now (2-week plan)
  activities: [
    {
      type: TreatmentActivityType.MEDICATION,
      name: 'Pain Management',
      description: 'Prescribed pain medication as needed',
      completed: true,
      completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.MEDICATION,
      name: 'Antibiotics',
      description: 'Complete course of antibiotics',
      completed: false
    },
    {
      type: TreatmentActivityType.EXERCISE,
      name: 'Gentle Walking',
      description: 'Short walks 3 times daily',
      completed: true,
      completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Wound Check',
      description: 'Follow-up for incision site evaluation',
      scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completed: true,
      completedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      type: TreatmentActivityType.APPOINTMENT,
      name: 'Final Check-up',
      description: 'Final post-operative evaluation',
      scheduledDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      completed: false
    }
  ],
  milestones: [
    {
      name: 'Pain Management Achieved',
      targetDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      targetProgress: 25,
      reached: true,
      reachedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Wound Healing Confirmed',
      targetDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      targetProgress: 50,
      reached: true,
      reachedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Return to Basic Activities',
      targetDate: new Date(Date.now()),
      targetProgress: 75,
      reached: true,
      reachedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      name: 'Full Recovery',
      targetDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      targetProgress: 100,
      reached: false
    }
  ]
});

/**
 * Collection of all predefined treatment plan fixtures
 */
export const treatmentPlanFixtures = {
  notStartedPhysicalTherapyPlan,
  inProgressMedicationPlan,
  completedDiabetesPlan,
  longTermCardiacRehabPlan,
  shortTermPostSurgeryPlan
};