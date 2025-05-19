/**
 * @file health-goals.fixtures.ts
 * @description Contains test fixtures for health goals with different types (step goals, weight targets, sleep targets, etc.)
 * and status values (active, completed, abandoned). These fixtures are critical for testing goal progress tracking,
 * achievement notifications, and gamification integration within the Health journey.
 *
 * This file implements the following requirements from the technical specification:
 * - Type-safe database client with migrations
 * - Create comprehensive test suites for all services
 * - Support cross-journey testing
 * - Implement type-safe event schema with consistent processing
 *
 * @example
 * // Import specific goal fixtures
 * import { activeStepGoal, completedWeightGoal } from './health-goals.fixtures';
 *
 * // Test goal progress tracking
 * describe('Goal Progress Tracking', () => {
 *   it('should update goal progress correctly', async () => {
 *     const result = await goalService.updateProgress(activeStepGoal.id, 2000);
 *     expect(result.currentValue).toBe(2000);
 *     expect(result.status).toBe('active');
 *   });
 * });
 *
 * @example
 * // Import factory functions for custom goals
 * import { createHealthGoalFixture, createGoalCompletionScenario } from './health-goals.fixtures';
 *
 * // Create custom goal for specific test case
 * const customGoal = createHealthGoalFixture({
 *   type: 'blood_glucose',
 *   targetValue: 100,
 *   period: 'daily'
 * });
 *
 * // Test goal completion
 * describe('Goal Completion', () => {
 *   it('should mark goal as completed when target is reached', async () => {
 *     const result = await goalService.updateProgress(customGoal.id, 100);
 *     expect(result.status).toBe('completed');
 *     expect(result.completedDate).not.toBeNull();
 *   });
 * });
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Goal type enum matching the database schema
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
 * Goal status enum matching the database schema
 */
export enum GoalStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

/**
 * Goal period enum matching the database schema
 */
export enum GoalPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

/**
 * Health goal fixture interface
 * Represents a health goal for testing purposes
 */
export interface HealthGoalFixture {
  id: string;
  recordId: string;
  type: GoalType;
  title: string;
  description?: string;
  targetValue: number;
  unit: string;
  currentValue: number;
  status: GoalStatus;
  period: GoalPeriod;
  startDate: Date;
  endDate?: Date | null;
  completedDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Goal completion scenario interface
 * Represents a scenario for testing goal completion and achievement triggering
 */
export interface GoalCompletionScenario {
  goal: HealthGoalFixture;
  progressUpdates: {
    value: number;
    timestamp: Date;
  }[];
  expectedFinalStatus: GoalStatus;
  expectedAchievementTriggered: boolean;
  metadata?: Record<string, any>;
}

/**
 * Helper function to create a date for a specific number of days ago/ahead
 * @param daysOffset Number of days from now (negative for past, positive for future)
 * @returns Date object
 */
export function createDate(daysOffset = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
}

/**
 * Factory function to create a health goal fixture with default values that can be overridden
 * @param overrides Optional properties to override default values
 * @returns A health goal fixture
 */
export function createHealthGoalFixture(overrides?: Partial<HealthGoalFixture>): HealthGoalFixture {
  return {
    id: uuidv4(),
    recordId: uuidv4(),
    type: GoalType.STEPS,
    title: 'Daily Step Goal',
    description: 'Reach 10,000 steps every day',
    targetValue: 10000,
    unit: 'steps',
    currentValue: 0,
    status: GoalStatus.ACTIVE,
    period: GoalPeriod.DAILY,
    startDate: createDate(-7), // Started a week ago
    endDate: null,
    completedDate: null,
    createdAt: createDate(-7),
    updatedAt: createDate(-7),
    ...overrides
  };
}

/**
 * Factory function to create a goal completion scenario
 * @param goal The goal to test completion for
 * @param progressUpdates Array of progress updates with values and timestamps
 * @param expectedFinalStatus Expected final status of the goal
 * @param expectedAchievementTriggered Whether an achievement should be triggered
 * @param metadata Additional metadata for the scenario
 * @returns A goal completion scenario
 */
export function createGoalCompletionScenario(
  goal: HealthGoalFixture,
  progressUpdates: { value: number; timestamp: Date }[],
  expectedFinalStatus: GoalStatus = GoalStatus.COMPLETED,
  expectedAchievementTriggered: boolean = true,
  metadata?: Record<string, any>
): GoalCompletionScenario {
  return {
    goal,
    progressUpdates,
    expectedFinalStatus,
    expectedAchievementTriggered,
    metadata
  };
}

// ===== STEP GOAL FIXTURES =====

/**
 * Active step goal with no progress
 */
export const activeStepGoal = createHealthGoalFixture({
  type: GoalType.STEPS,
  title: 'Daily Step Goal',
  description: 'Reach 10,000 steps every day',
  targetValue: 10000,
  unit: 'steps',
  currentValue: 0,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

/**
 * Active step goal with partial progress
 */
export const partialStepGoal = createHealthGoalFixture({
  type: GoalType.STEPS,
  title: 'Daily Step Goal',
  description: 'Reach 10,000 steps every day',
  targetValue: 10000,
  unit: 'steps',
  currentValue: 5000,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

/**
 * Completed step goal
 */
export const completedStepGoal = createHealthGoalFixture({
  type: GoalType.STEPS,
  title: 'Daily Step Goal',
  description: 'Reach 10,000 steps every day',
  targetValue: 10000,
  unit: 'steps',
  currentValue: 12500,
  status: GoalStatus.COMPLETED,
  period: GoalPeriod.DAILY,
  completedDate: createDate(-1) // Completed yesterday
});

/**
 * Abandoned step goal
 */
export const abandonedStepGoal = createHealthGoalFixture({
  type: GoalType.STEPS,
  title: 'Daily Step Goal',
  description: 'Reach 10,000 steps every day',
  targetValue: 10000,
  unit: 'steps',
  currentValue: 2500,
  status: GoalStatus.ABANDONED,
  period: GoalPeriod.DAILY
});

/**
 * Weekly step goal
 */
export const weeklyStepGoal = createHealthGoalFixture({
  type: GoalType.STEPS,
  title: 'Weekly Step Goal',
  description: 'Reach 70,000 steps this week',
  targetValue: 70000,
  unit: 'steps',
  currentValue: 35000,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.WEEKLY,
  startDate: createDate(-7),
  endDate: createDate(0) // Ends today
});

// ===== SLEEP GOAL FIXTURES =====

/**
 * Active sleep goal
 */
export const activeSleepGoal = createHealthGoalFixture({
  type: GoalType.SLEEP,
  title: 'Sleep Duration Goal',
  description: 'Sleep at least 8 hours every night',
  targetValue: 8,
  unit: 'hours',
  currentValue: 0,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

/**
 * Completed sleep goal
 */
export const completedSleepGoal = createHealthGoalFixture({
  type: GoalType.SLEEP,
  title: 'Sleep Duration Goal',
  description: 'Sleep at least 8 hours every night',
  targetValue: 8,
  unit: 'hours',
  currentValue: 8.5,
  status: GoalStatus.COMPLETED,
  period: GoalPeriod.DAILY,
  completedDate: createDate(-1) // Completed yesterday
});

/**
 * Weekly sleep goal
 */
export const weeklySleepGoal = createHealthGoalFixture({
  type: GoalType.SLEEP,
  title: 'Weekly Sleep Goal',
  description: 'Average 7.5 hours of sleep per night this week',
  targetValue: 7.5,
  unit: 'hours',
  currentValue: 7.2,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.WEEKLY,
  startDate: createDate(-7),
  endDate: createDate(0) // Ends today
});

// ===== WEIGHT GOAL FIXTURES =====

/**
 * Active weight loss goal
 */
export const activeWeightLossGoal = createHealthGoalFixture({
  type: GoalType.WEIGHT,
  title: 'Weight Loss Goal',
  description: 'Lose 5kg over the next month',
  targetValue: 75, // Target weight in kg
  unit: 'kg',
  currentValue: 80, // Current weight in kg
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.MONTHLY,
  startDate: createDate(-15),
  endDate: createDate(15) // Ends in 15 days
});

/**
 * Completed weight goal
 */
export const completedWeightGoal = createHealthGoalFixture({
  type: GoalType.WEIGHT,
  title: 'Weight Goal',
  description: 'Reach target weight of 70kg',
  targetValue: 70,
  unit: 'kg',
  currentValue: 70,
  status: GoalStatus.COMPLETED,
  period: GoalPeriod.CUSTOM,
  startDate: createDate(-60),
  endDate: createDate(-10),
  completedDate: createDate(-10) // Completed 10 days ago
});

// ===== WATER INTAKE GOAL FIXTURES =====

/**
 * Active water intake goal
 */
export const activeWaterGoal = createHealthGoalFixture({
  type: GoalType.WATER,
  title: 'Daily Water Intake',
  description: 'Drink 2 liters of water daily',
  targetValue: 2000,
  unit: 'ml',
  currentValue: 500,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

/**
 * Completed water intake goal
 */
export const completedWaterGoal = createHealthGoalFixture({
  type: GoalType.WATER,
  title: 'Daily Water Intake',
  description: 'Drink 2 liters of water daily',
  targetValue: 2000,
  unit: 'ml',
  currentValue: 2200,
  status: GoalStatus.COMPLETED,
  period: GoalPeriod.DAILY,
  completedDate: createDate(-1) // Completed yesterday
});

// ===== EXERCISE GOAL FIXTURES =====

/**
 * Active exercise goal
 */
export const activeExerciseGoal = createHealthGoalFixture({
  type: GoalType.EXERCISE,
  title: 'Weekly Exercise Goal',
  description: 'Exercise for at least 150 minutes this week',
  targetValue: 150,
  unit: 'minutes',
  currentValue: 75,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.WEEKLY,
  startDate: createDate(-4),
  endDate: createDate(3) // Ends in 3 days
});

/**
 * Completed exercise goal
 */
export const completedExerciseGoal = createHealthGoalFixture({
  type: GoalType.EXERCISE,
  title: 'Weekly Exercise Goal',
  description: 'Exercise for at least 150 minutes this week',
  targetValue: 150,
  unit: 'minutes',
  currentValue: 180,
  status: GoalStatus.COMPLETED,
  period: GoalPeriod.WEEKLY,
  startDate: createDate(-11),
  endDate: createDate(-4),
  completedDate: createDate(-5) // Completed 5 days ago
});

// ===== HEART RATE GOAL FIXTURES =====

/**
 * Active heart rate goal (maintain heart rate in a specific range)
 */
export const activeHeartRateGoal = createHealthGoalFixture({
  type: GoalType.HEART_RATE,
  title: 'Resting Heart Rate Goal',
  description: 'Maintain resting heart rate below 70 bpm',
  targetValue: 70,
  unit: 'bpm',
  currentValue: 72,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

// ===== BLOOD PRESSURE GOAL FIXTURES =====

/**
 * Active blood pressure goal
 */
export const activeBloodPressureGoal = createHealthGoalFixture({
  type: GoalType.BLOOD_PRESSURE,
  title: 'Blood Pressure Goal',
  description: 'Maintain systolic blood pressure below 130 mmHg',
  targetValue: 130,
  unit: 'mmHg',
  currentValue: 135,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY,
  metadata: {
    diastolicTarget: 85,
    diastolicCurrent: 88
  }
});

// ===== BLOOD GLUCOSE GOAL FIXTURES =====

/**
 * Active blood glucose goal
 */
export const activeBloodGlucoseGoal = createHealthGoalFixture({
  type: GoalType.BLOOD_GLUCOSE,
  title: 'Blood Glucose Goal',
  description: 'Maintain fasting blood glucose below 100 mg/dL',
  targetValue: 100,
  unit: 'mg/dL',
  currentValue: 105,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY
});

// ===== CUSTOM GOAL FIXTURES =====

/**
 * Custom health goal (meditation minutes)
 */
export const customMeditationGoal = createHealthGoalFixture({
  type: GoalType.CUSTOM,
  title: 'Meditation Goal',
  description: 'Meditate for 10 minutes daily',
  targetValue: 10,
  unit: 'minutes',
  currentValue: 5,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY,
  metadata: {
    category: 'mindfulness',
    technique: 'guided'
  }
});

/**
 * Custom health goal (nutrition - fruit servings)
 */
export const customNutritionGoal = createHealthGoalFixture({
  type: GoalType.CUSTOM,
  title: 'Fruit Intake Goal',
  description: 'Eat at least 3 servings of fruit daily',
  targetValue: 3,
  unit: 'servings',
  currentValue: 1,
  status: GoalStatus.ACTIVE,
  period: GoalPeriod.DAILY,
  metadata: {
    category: 'nutrition',
    foodGroup: 'fruits'
  }
});

// ===== GOAL COLLECTIONS =====

/**
 * Collection of active goals
 */
export const activeGoals = {
  steps: activeStepGoal,
  sleep: activeSleepGoal,
  weight: activeWeightLossGoal,
  water: activeWaterGoal,
  exercise: activeExerciseGoal,
  heartRate: activeHeartRateGoal,
  bloodPressure: activeBloodPressureGoal,
  bloodGlucose: activeBloodGlucoseGoal,
  meditation: customMeditationGoal,
  nutrition: customNutritionGoal
};

/**
 * Collection of completed goals
 */
export const completedGoals = {
  steps: completedStepGoal,
  sleep: completedSleepGoal,
  weight: completedWeightGoal,
  water: completedWaterGoal,
  exercise: completedExerciseGoal
};

/**
 * Collection of goals by period
 */
export const goalsByPeriod = {
  daily: [
    activeStepGoal,
    activeSleepGoal,
    activeWaterGoal,
    activeHeartRateGoal,
    activeBloodPressureGoal,
    activeBloodGlucoseGoal,
    customMeditationGoal,
    customNutritionGoal
  ],
  weekly: [
    weeklyStepGoal,
    weeklySleepGoal,
    activeExerciseGoal
  ],
  monthly: [
    activeWeightLossGoal
  ],
  custom: [
    completedWeightGoal
  ]
};

/**
 * Collection of goals by type
 */
export const goalsByType = {
  [GoalType.STEPS]: [activeStepGoal, partialStepGoal, completedStepGoal, abandonedStepGoal, weeklyStepGoal],
  [GoalType.SLEEP]: [activeSleepGoal, completedSleepGoal, weeklySleepGoal],
  [GoalType.WEIGHT]: [activeWeightLossGoal, completedWeightGoal],
  [GoalType.WATER]: [activeWaterGoal, completedWaterGoal],
  [GoalType.EXERCISE]: [activeExerciseGoal, completedExerciseGoal],
  [GoalType.HEART_RATE]: [activeHeartRateGoal],
  [GoalType.BLOOD_PRESSURE]: [activeBloodPressureGoal],
  [GoalType.BLOOD_GLUCOSE]: [activeBloodGlucoseGoal],
  [GoalType.CUSTOM]: [customMeditationGoal, customNutritionGoal]
};

// ===== GOAL COMPLETION SCENARIOS =====

/**
 * Scenario: Step goal completion in a single update
 */
export const stepGoalCompletionScenario = createGoalCompletionScenario(
  activeStepGoal,
  [
    { value: 10500, timestamp: createDate(0) }
  ],
  GoalStatus.COMPLETED,
  true
);

/**
 * Scenario: Step goal completion with multiple updates
 */
export const stepGoalProgressiveCompletionScenario = createGoalCompletionScenario(
  activeStepGoal,
  [
    { value: 2500, timestamp: createDate(-0.5) }, // 0.5 days ago (12 hours)
    { value: 5000, timestamp: createDate(-0.25) }, // 0.25 days ago (6 hours)
    { value: 7500, timestamp: createDate(-0.125) }, // 0.125 days ago (3 hours)
    { value: 10200, timestamp: createDate(0) } // Now
  ],
  GoalStatus.COMPLETED,
  true
);

/**
 * Scenario: Weight goal completion over time
 */
export const weightGoalCompletionScenario = createGoalCompletionScenario(
  activeWeightLossGoal,
  [
    { value: 79, timestamp: createDate(-10) }, // 10 days ago
    { value: 78, timestamp: createDate(-7) }, // 7 days ago
    { value: 77, timestamp: createDate(-5) }, // 5 days ago
    { value: 76, timestamp: createDate(-3) }, // 3 days ago
    { value: 75, timestamp: createDate(0) } // Now (reached target)
  ],
  GoalStatus.COMPLETED,
  true,
  { weightLossRate: '0.5kg per week' }
);

/**
 * Scenario: Exercise goal that doesn't reach completion
 */
export const exerciseGoalIncompleteScenario = createGoalCompletionScenario(
  activeExerciseGoal,
  [
    { value: 90, timestamp: createDate(-2) }, // 2 days ago
    { value: 120, timestamp: createDate(-1) }, // 1 day ago
    { value: 140, timestamp: createDate(0) } // Now (still below target)
  ],
  GoalStatus.ACTIVE,
  false
);

/**
 * Scenario: Sleep goal that exceeds target
 */
export const sleepGoalExceededScenario = createGoalCompletionScenario(
  activeSleepGoal,
  [
    { value: 9.5, timestamp: createDate(0) } // Now (exceeded target)
  ],
  GoalStatus.COMPLETED,
  true,
  { exceededBy: '1.5 hours' }
);

/**
 * Scenario: Blood pressure goal that improves but doesn't reach target
 */
export const bloodPressureGoalImprovementScenario = createGoalCompletionScenario(
  activeBloodPressureGoal,
  [
    { value: 133, timestamp: createDate(-3) }, // 3 days ago
    { value: 132, timestamp: createDate(-2) }, // 2 days ago
    { value: 131, timestamp: createDate(-1) }, // 1 day ago
    { value: 131, timestamp: createDate(0) } // Now (improved but not at target)
  ],
  GoalStatus.ACTIVE,
  false,
  { 
    diastolicProgress: [
      { value: 87, timestamp: createDate(-3) },
      { value: 86, timestamp: createDate(-2) },
      { value: 86, timestamp: createDate(-1) },
      { value: 85, timestamp: createDate(0) }
    ],
    trend: 'improving'
  }
);

/**
 * Scenario: Goal that is abandoned before completion
 */
export const goalAbandonmentScenario = createGoalCompletionScenario(
  activeWaterGoal,
  [
    { value: 500, timestamp: createDate(-2) }, // 2 days ago
    { value: 800, timestamp: createDate(-1) }, // 1 day ago
    { value: 800, timestamp: createDate(0) } // Now (no progress for a day)
  ],
  GoalStatus.ABANDONED,
  false,
  { abandonReason: 'user_initiated' }
);

/**
 * Collection of all goal completion scenarios
 */
export const goalCompletionScenarios = {
  stepGoalCompletion: stepGoalCompletionScenario,
  stepGoalProgressiveCompletion: stepGoalProgressiveCompletionScenario,
  weightGoalCompletion: weightGoalCompletionScenario,
  exerciseGoalIncomplete: exerciseGoalIncompleteScenario,
  sleepGoalExceeded: sleepGoalExceededScenario,
  bloodPressureGoalImprovement: bloodPressureGoalImprovementScenario,
  goalAbandonment: goalAbandonmentScenario
};

/**
 * Collection of all health goal fixtures
 */
export const healthGoalFixtures = {
  // Factory functions
  createHealthGoalFixture,
  createGoalCompletionScenario,
  createDate,
  
  // Individual goal fixtures
  activeStepGoal,
  partialStepGoal,
  completedStepGoal,
  abandonedStepGoal,
  weeklyStepGoal,
  activeSleepGoal,
  completedSleepGoal,
  weeklySleepGoal,
  activeWeightLossGoal,
  completedWeightGoal,
  activeWaterGoal,
  completedWaterGoal,
  activeExerciseGoal,
  completedExerciseGoal,
  activeHeartRateGoal,
  activeBloodPressureGoal,
  activeBloodGlucoseGoal,
  customMeditationGoal,
  customNutritionGoal,
  
  // Collections
  activeGoals,
  completedGoals,
  goalsByPeriod,
  goalsByType,
  
  // Scenarios
  goalCompletionScenarios
};

/**
 * Default export for easier importing
 */
export default healthGoalFixtures;