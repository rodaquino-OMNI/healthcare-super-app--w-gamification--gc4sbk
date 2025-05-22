/**
 * @file Health Goals Test Fixtures
 * @description Provides standardized test fixtures for health goals with different types and statuses.
 * These fixtures are used for testing goal progress tracking, achievement notifications, and gamification integration.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  GoalType, 
  GoalStatus, 
  GoalPeriod,
  IHealthGoal 
} from '@austa/interfaces/journey/health';

/**
 * Interface for health goal fixture options to customize generated goals
 */
export interface HealthGoalFixtureOptions {
  recordId?: string;
  type?: GoalType;
  title?: string;
  description?: string;
  targetValue?: number;
  unit?: string;
  currentValue?: number;
  status?: GoalStatus;
  period?: GoalPeriod;
  startDate?: Date;
  endDate?: Date;
  completedDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a health goal fixture with the specified options
 * @param options Customization options for the health goal
 * @returns A health goal fixture object
 */
export function createHealthGoalFixture(options: HealthGoalFixtureOptions = {}): IHealthGoal {
  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(now.getMonth() + 1);
  
  return {
    id: uuidv4(),
    recordId: options.recordId || uuidv4(),
    type: options.type || GoalType.STEPS,
    title: options.title || 'Default Health Goal',
    description: options.description || 'This is a default health goal for testing',
    targetValue: options.targetValue !== undefined ? options.targetValue : 10000,
    unit: options.unit || 'steps',
    currentValue: options.currentValue !== undefined ? options.currentValue : 0,
    status: options.status || GoalStatus.ACTIVE,
    period: options.period || GoalPeriod.DAILY,
    startDate: options.startDate || now,
    endDate: options.endDate || oneMonthFromNow,
    completedDate: options.completedDate || undefined,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now
  };
}

/**
 * Creates a completed health goal fixture
 * @param options Additional customization options
 * @returns A completed health goal fixture
 */
export function createCompletedGoalFixture(options: HealthGoalFixtureOptions = {}): IHealthGoal {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  return createHealthGoalFixture({
    status: GoalStatus.COMPLETED,
    currentValue: options.targetValue || 10000,
    targetValue: options.targetValue || 10000,
    completedDate: options.completedDate || now,
    startDate: options.startDate || yesterday,
    ...options
  });
}

/**
 * Creates an abandoned health goal fixture
 * @param options Additional customization options
 * @returns An abandoned health goal fixture
 */
export function createAbandonedGoalFixture(options: HealthGoalFixtureOptions = {}): IHealthGoal {
  const now = new Date();
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);
  
  return createHealthGoalFixture({
    status: GoalStatus.ABANDONED,
    currentValue: options.currentValue !== undefined ? options.currentValue : 2500,
    targetValue: options.targetValue || 10000,
    startDate: options.startDate || lastWeek,
    ...options
  });
}

/**
 * Creates a nearly completed goal fixture (useful for testing achievement triggers)
 * @param options Additional customization options
 * @returns A nearly completed health goal fixture
 */
export function createNearlyCompletedGoalFixture(options: HealthGoalFixtureOptions = {}): IHealthGoal {
  const targetValue = options.targetValue || 10000;
  const nearlyCompleteValue = Math.floor(targetValue * 0.95); // 95% complete
  
  return createHealthGoalFixture({
    currentValue: options.currentValue !== undefined ? options.currentValue : nearlyCompleteValue,
    targetValue,
    ...options
  });
}

/**
 * Standard health goal fixtures for different goal types
 */
export const healthGoalFixtures = {
  // Step goal fixtures
  stepGoalActive: createHealthGoalFixture({
    type: GoalType.STEPS,
    title: 'Daily Steps Goal',
    description: 'Walk 10,000 steps every day',
    targetValue: 10000,
    unit: 'steps',
    currentValue: 4500,
    period: GoalPeriod.DAILY
  }),
  
  stepGoalCompleted: createCompletedGoalFixture({
    type: GoalType.STEPS,
    title: 'Daily Steps Goal',
    description: 'Walk 10,000 steps every day',
    targetValue: 10000,
    unit: 'steps',
    period: GoalPeriod.DAILY
  }),
  
  stepGoalAbandoned: createAbandonedGoalFixture({
    type: GoalType.STEPS,
    title: 'Daily Steps Goal',
    description: 'Walk 10,000 steps every day',
    targetValue: 10000,
    unit: 'steps',
    period: GoalPeriod.DAILY
  }),
  
  // Sleep goal fixtures
  sleepGoalActive: createHealthGoalFixture({
    type: GoalType.SLEEP,
    title: 'Sleep Duration Goal',
    description: 'Sleep 8 hours every night',
    targetValue: 8,
    unit: 'hours',
    currentValue: 6.5,
    period: GoalPeriod.DAILY
  }),
  
  sleepGoalCompleted: createCompletedGoalFixture({
    type: GoalType.SLEEP,
    title: 'Sleep Duration Goal',
    description: 'Sleep 8 hours every night',
    targetValue: 8,
    unit: 'hours',
    period: GoalPeriod.DAILY
  }),
  
  // Weight goal fixtures
  weightGoalActive: createHealthGoalFixture({
    type: GoalType.WEIGHT,
    title: 'Weight Loss Goal',
    description: 'Lose 5kg in one month',
    targetValue: 70,
    unit: 'kg',
    currentValue: 75,
    period: GoalPeriod.MONTHLY
  }),
  
  weightGoalCompleted: createCompletedGoalFixture({
    type: GoalType.WEIGHT,
    title: 'Weight Loss Goal',
    description: 'Lose 5kg in one month',
    targetValue: 70,
    unit: 'kg',
    period: GoalPeriod.MONTHLY
  }),
  
  // Exercise goal fixtures
  exerciseGoalActive: createHealthGoalFixture({
    type: GoalType.EXERCISE,
    title: 'Weekly Exercise Goal',
    description: 'Exercise for 150 minutes per week',
    targetValue: 150,
    unit: 'minutes',
    currentValue: 90,
    period: GoalPeriod.WEEKLY
  }),
  
  exerciseGoalNearlyComplete: createNearlyCompletedGoalFixture({
    type: GoalType.EXERCISE,
    title: 'Weekly Exercise Goal',
    description: 'Exercise for 150 minutes per week',
    targetValue: 150,
    unit: 'minutes',
    period: GoalPeriod.WEEKLY
  }),
  
  // Water intake goal fixtures
  waterGoalActive: createHealthGoalFixture({
    type: GoalType.WATER,
    title: 'Daily Water Intake',
    description: 'Drink 2 liters of water daily',
    targetValue: 2000,
    unit: 'ml',
    currentValue: 1200,
    period: GoalPeriod.DAILY
  }),
  
  // Heart rate goal fixtures
  heartRateGoalActive: createHealthGoalFixture({
    type: GoalType.HEART_RATE,
    title: 'Resting Heart Rate Goal',
    description: 'Achieve resting heart rate of 60 bpm',
    targetValue: 60,
    unit: 'bpm',
    currentValue: 68,
    period: GoalPeriod.CUSTOM
  }),
  
  // Blood pressure goal fixtures
  bloodPressureGoalActive: createHealthGoalFixture({
    type: GoalType.BLOOD_PRESSURE,
    title: 'Blood Pressure Goal',
    description: 'Maintain systolic blood pressure below 120',
    targetValue: 120,
    unit: 'mmHg',
    currentValue: 130,
    period: GoalPeriod.CUSTOM
  }),
  
  // Blood glucose goal fixtures
  bloodGlucoseGoalActive: createHealthGoalFixture({
    type: GoalType.BLOOD_GLUCOSE,
    title: 'Blood Glucose Goal',
    description: 'Maintain fasting blood glucose below 100 mg/dL',
    targetValue: 100,
    unit: 'mg/dL',
    currentValue: 110,
    period: GoalPeriod.DAILY
  }),
  
  // Custom goal fixtures
  customGoalActive: createHealthGoalFixture({
    type: GoalType.CUSTOM,
    title: 'Meditation Goal',
    description: 'Meditate for 10 minutes every day',
    targetValue: 10,
    unit: 'minutes',
    currentValue: 5,
    period: GoalPeriod.DAILY
  })
};

/**
 * Goal completion scenario fixtures for testing achievement triggering
 */
export const goalCompletionScenarios = {
  // Scenario: User completes their first step goal
  firstStepGoalCompletion: {
    before: createNearlyCompletedGoalFixture({
      type: GoalType.STEPS,
      title: 'First Step Goal',
      targetValue: 10000,
      currentValue: 9900,
      unit: 'steps'
    }),
    after: createCompletedGoalFixture({
      type: GoalType.STEPS,
      title: 'First Step Goal',
      targetValue: 10000,
      unit: 'steps'
    }),
    expectedAchievement: 'steps-goal-level-1'
  },
  
  // Scenario: User completes a sleep goal for the first time
  firstSleepGoalCompletion: {
    before: createNearlyCompletedGoalFixture({
      type: GoalType.SLEEP,
      title: 'Sleep Goal',
      targetValue: 8,
      currentValue: 7.5,
      unit: 'hours'
    }),
    after: createCompletedGoalFixture({
      type: GoalType.SLEEP,
      title: 'Sleep Goal',
      targetValue: 8,
      unit: 'hours'
    }),
    expectedAchievement: 'sleep-goal-level-1'
  },
  
  // Scenario: User completes a weight goal
  weightGoalCompletion: {
    before: createNearlyCompletedGoalFixture({
      type: GoalType.WEIGHT,
      title: 'Weight Goal',
      targetValue: 70,
      currentValue: 70.5,
      unit: 'kg'
    }),
    after: createCompletedGoalFixture({
      type: GoalType.WEIGHT,
      title: 'Weight Goal',
      targetValue: 70,
      unit: 'kg'
    }),
    expectedAchievement: 'weight-goal-level-1'
  },
  
  // Scenario: User completes multiple goals in a week
  multipleGoalsCompletion: {
    goals: [
      createCompletedGoalFixture({
        type: GoalType.STEPS,
        title: 'Step Goal',
        targetValue: 10000,
        unit: 'steps'
      }),
      createCompletedGoalFixture({
        type: GoalType.WATER,
        title: 'Water Goal',
        targetValue: 2000,
        unit: 'ml'
      }),
      createCompletedGoalFixture({
        type: GoalType.EXERCISE,
        title: 'Exercise Goal',
        targetValue: 150,
        unit: 'minutes'
      })
    ],
    expectedAchievement: 'goal-streak-level-1'
  }
};

/**
 * Creates a batch of random health goals for testing
 * @param count Number of goals to create
 * @param recordId Optional record ID to use for all goals
 * @returns Array of health goal fixtures
 */
export function createRandomHealthGoals(count: number, recordId?: string): IHealthGoal[] {
  const goals: IHealthGoal[] = [];
  const goalTypes = Object.values(GoalType);
  const periods = Object.values(GoalPeriod);
  const statuses = Object.values(GoalStatus);
  
  const sharedRecordId = recordId || uuidv4();
  
  for (let i = 0; i < count; i++) {
    const type = goalTypes[Math.floor(Math.random() * goalTypes.length)];
    const period = periods[Math.floor(Math.random() * periods.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    let targetValue: number;
    let unit: string;
    let title: string;
    
    // Set appropriate values based on goal type
    switch (type) {
      case GoalType.STEPS:
        targetValue = 10000;
        unit = 'steps';
        title = 'Daily Steps Goal';
        break;
      case GoalType.SLEEP:
        targetValue = 8;
        unit = 'hours';
        title = 'Sleep Duration Goal';
        break;
      case GoalType.WATER:
        targetValue = 2000;
        unit = 'ml';
        title = 'Daily Water Intake';
        break;
      case GoalType.WEIGHT:
        targetValue = 70;
        unit = 'kg';
        title = 'Weight Goal';
        break;
      case GoalType.EXERCISE:
        targetValue = 150;
        unit = 'minutes';
        title = 'Weekly Exercise Goal';
        break;
      case GoalType.HEART_RATE:
        targetValue = 60;
        unit = 'bpm';
        title = 'Resting Heart Rate Goal';
        break;
      case GoalType.BLOOD_PRESSURE:
        targetValue = 120;
        unit = 'mmHg';
        title = 'Blood Pressure Goal';
        break;
      case GoalType.BLOOD_GLUCOSE:
        targetValue = 100;
        unit = 'mg/dL';
        title = 'Blood Glucose Goal';
        break;
      default:
        targetValue = 10;
        unit = 'units';
        title = 'Custom Goal';
    }
    
    // Calculate current value based on status
    let currentValue: number;
    let completedDate: Date | undefined;
    
    if (status === GoalStatus.COMPLETED) {
      currentValue = targetValue;
      completedDate = new Date();
    } else if (status === GoalStatus.ABANDONED) {
      currentValue = Math.floor(targetValue * Math.random() * 0.8); // 0-80% complete
      completedDate = undefined;
    } else {
      currentValue = Math.floor(targetValue * Math.random()); // 0-100% complete
      completedDate = undefined;
    }
    
    goals.push(createHealthGoalFixture({
      recordId: sharedRecordId,
      type,
      title,
      targetValue,
      unit,
      currentValue,
      status,
      period,
      completedDate
    }));
  }
  
  return goals;
}