/**
 * @file Achievement Progression Scenarios
 * @description Test scenarios for achievement level progression in the gamification system.
 * These scenarios simulate users progressing through different achievement levels,
 * testing the level-up mechanics, notification systems, and reward distribution.
 */

import { JourneyType } from '@austa/interfaces/journey';
import { AchievementStatus } from '@austa/interfaces/gamification';

/**
 * Interface for achievement level configuration
 */
export interface AchievementLevel {
  /** Level number (1-based) */
  level: number;
  /** Title for this achievement level */
  title: string;
  /** Description for this achievement level */
  description: string;
  /** XP reward for completing this level */
  xpReward: number;
  /** Progress threshold required to complete this level (0-100) */
  threshold: number;
  /** Optional icon for this level */
  icon?: string;
}

/**
 * Interface for multi-level achievement configuration
 */
export interface MultiLevelAchievement {
  /** Base achievement ID */
  id: string;
  /** Base achievement name */
  name: string;
  /** Journey this achievement belongs to */
  journey: JourneyType;
  /** Array of level configurations */
  levels: AchievementLevel[];
  /** Whether this achievement is secret (hidden until unlocked) */
  isSecret?: boolean;
}

/**
 * Interface for achievement progression scenario
 */
export interface AchievementProgressionScenario {
  /** Unique scenario ID */
  id: string;
  /** Human-readable scenario name */
  name: string;
  /** Description of the scenario */
  description: string;
  /** User ID for this scenario */
  userId: string;
  /** Achievement configuration */
  achievement: MultiLevelAchievement;
  /** Array of progress steps to simulate */
  progressSteps: AchievementProgressStep[];
  /** Expected notifications to be generated */
  expectedNotifications: AchievementNotification[];
  /** Expected rewards to be distributed */
  expectedRewards: AchievementReward[];
}

/**
 * Interface for a single achievement progress step
 */
export interface AchievementProgressStep {
  /** Step description */
  description: string;
  /** Progress increment (absolute value, not relative) */
  progressValue: number;
  /** Metadata to include with this progress update */
  metadata?: Record<string, any>;
  /** Expected status after this step */
  expectedStatus: AchievementStatus;
  /** Expected level after this step */
  expectedLevel: number;
  /** Whether this step should trigger a level-up */
  shouldLevelUp?: boolean;
}

/**
 * Interface for expected achievement notification
 */
export interface AchievementNotification {
  /** Achievement level that triggered this notification */
  level: number;
  /** Type of notification */
  type: 'LEVEL_UP' | 'ACHIEVEMENT_COMPLETED' | 'PROGRESS_MILESTONE';
  /** Whether this notification should be shown immediately */
  immediate: boolean;
}

/**
 * Interface for expected achievement reward
 */
export interface AchievementReward {
  /** Achievement level that triggered this reward */
  level: number;
  /** XP amount to be awarded */
  xp: number;
  /** Additional rewards (if any) */
  additionalRewards?: Record<string, any>;
}

/**
 * Health journey achievement progression scenarios
 */
export const healthAchievementScenarios: AchievementProgressionScenario[] = [
  {
    id: 'health-check-streak-normal-progression',
    name: 'Health Check Streak - Normal Progression',
    description: 'User progresses through all levels of the Health Check Streak achievement by consistently recording health metrics',
    userId: 'test-user-1',
    achievement: {
      id: 'health-check-streak',
      name: 'Monitor de Saúde',
      journey: JourneyType.HEALTH,
      levels: [
        {
          level: 1,
          title: 'Monitor de Saúde I',
          description: 'Registre suas métricas de saúde por 3 dias consecutivos',
          xpReward: 50,
          threshold: 33.33,
          icon: 'heart-pulse-1'
        },
        {
          level: 2,
          title: 'Monitor de Saúde II',
          description: 'Registre suas métricas de saúde por 7 dias consecutivos',
          xpReward: 100,
          threshold: 66.67,
          icon: 'heart-pulse-2'
        },
        {
          level: 3,
          title: 'Monitor de Saúde III',
          description: 'Registre suas métricas de saúde por 14 dias consecutivos',
          xpReward: 200,
          threshold: 100,
          icon: 'heart-pulse-3'
        }
      ]
    },
    progressSteps: [
      {
        description: 'Day 1: User records heart rate',
        progressValue: 7.14, // 1/14 of total progress
        metadata: { streak: 1, metrics: ['heart_rate'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'Day 2: User records blood pressure',
        progressValue: 14.29, // 2/14 of total progress
        metadata: { streak: 2, metrics: ['blood_pressure'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'Day 3: User records weight',
        progressValue: 21.43, // 3/14 of total progress
        metadata: { streak: 3, metrics: ['weight'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      },
      {
        description: 'Day 7: User completes a week of recordings',
        progressValue: 50, // 7/14 of total progress
        metadata: { streak: 7, metrics: ['heart_rate', 'blood_pressure', 'weight'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 2,
        shouldLevelUp: true
      },
      {
        description: 'Day 14: User completes two weeks of recordings',
        progressValue: 100, // 14/14 of total progress
        metadata: { streak: 14, metrics: ['heart_rate', 'blood_pressure', 'weight', 'steps'] },
        expectedStatus: AchievementStatus.UNLOCKED,
        expectedLevel: 3,
        shouldLevelUp: true
      }
    ],
    expectedNotifications: [
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 2,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 3,
        type: 'ACHIEVEMENT_COMPLETED',
        immediate: true
      }
    ],
    expectedRewards: [
      {
        level: 1,
        xp: 50
      },
      {
        level: 2,
        xp: 100
      },
      {
        level: 3,
        xp: 200
      }
    ]
  },
  {
    id: 'steps-goal-skip-level',
    name: 'Steps Goal - Level Skipping',
    description: 'User skips a level by achieving a high step count that exceeds multiple thresholds at once',
    userId: 'test-user-2',
    achievement: {
      id: 'steps-goal',
      name: 'Caminhante Dedicado',
      journey: JourneyType.HEALTH,
      levels: [
        {
          level: 1,
          title: 'Caminhante Dedicado I',
          description: 'Atinja sua meta diária de passos por 5 dias',
          xpReward: 50,
          threshold: 33.33,
          icon: 'footprints-1'
        },
        {
          level: 2,
          title: 'Caminhante Dedicado II',
          description: 'Atinja sua meta diária de passos por 15 dias',
          xpReward: 100,
          threshold: 66.67,
          icon: 'footprints-2'
        },
        {
          level: 3,
          title: 'Caminhante Dedicado III',
          description: 'Atinja sua meta diária de passos por 30 dias',
          xpReward: 200,
          threshold: 100,
          icon: 'footprints-3'
        }
      ]
    },
    progressSteps: [
      {
        description: 'User records 5 days of step goals',
        progressValue: 16.67, // 5/30 of total progress
        metadata: { days: 5, average_steps: 10500 },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      },
      {
        description: 'User records 20 more days of step goals (25 total)',
        progressValue: 83.33, // 25/30 of total progress
        metadata: { days: 25, average_steps: 12000 },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 2,
        shouldLevelUp: true
      },
      {
        description: 'User records 5 more days of step goals (30 total)',
        progressValue: 100, // 30/30 of total progress
        metadata: { days: 30, average_steps: 12500 },
        expectedStatus: AchievementStatus.UNLOCKED,
        expectedLevel: 3,
        shouldLevelUp: true
      }
    ],
    expectedNotifications: [
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 2,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 3,
        type: 'ACHIEVEMENT_COMPLETED',
        immediate: true
      }
    ],
    expectedRewards: [
      {
        level: 1,
        xp: 50
      },
      {
        level: 2,
        xp: 100
      },
      {
        level: 3,
        xp: 200
      }
    ]
  }
];

/**
 * Care journey achievement progression scenarios
 */
export const careAchievementScenarios: AchievementProgressionScenario[] = [
  {
    id: 'appointment-keeper-partial-completion',
    name: 'Appointment Keeper - Partial Completion',
    description: 'User partially completes the Appointment Keeper achievement but does not reach the final level',
    userId: 'test-user-3',
    achievement: {
      id: 'appointment-keeper',
      name: 'Compromisso com a Saúde',
      journey: JourneyType.CARE,
      levels: [
        {
          level: 1,
          title: 'Compromisso com a Saúde I',
          description: 'Compareça a 1 consulta agendada',
          xpReward: 50,
          threshold: 33.33,
          icon: 'calendar-check-1'
        },
        {
          level: 2,
          title: 'Compromisso com a Saúde II',
          description: 'Compareça a 3 consultas agendadas',
          xpReward: 100,
          threshold: 66.67,
          icon: 'calendar-check-2'
        },
        {
          level: 3,
          title: 'Compromisso com a Saúde III',
          description: 'Compareça a 5 consultas agendadas',
          xpReward: 200,
          threshold: 100,
          icon: 'calendar-check-3'
        }
      ]
    },
    progressSteps: [
      {
        description: 'User attends first appointment',
        progressValue: 20, // 1/5 of total progress
        metadata: { appointments: 1, specialties: ['cardiology'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      },
      {
        description: 'User attends second appointment',
        progressValue: 40, // 2/5 of total progress
        metadata: { appointments: 2, specialties: ['cardiology', 'dermatology'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'User attends third appointment',
        progressValue: 60, // 3/5 of total progress
        metadata: { appointments: 3, specialties: ['cardiology', 'dermatology', 'orthopedics'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 2,
        shouldLevelUp: true
      }
      // Note: User doesn't complete the final level
    ],
    expectedNotifications: [
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 2,
        type: 'LEVEL_UP',
        immediate: true
      }
    ],
    expectedRewards: [
      {
        level: 1,
        xp: 50
      },
      {
        level: 2,
        xp: 100
      }
    ]
  },
  {
    id: 'medication-adherence-reset',
    name: 'Medication Adherence - Progress Reset',
    description: 'User progresses in the Medication Adherence achievement but then has progress reset due to missed medications',
    userId: 'test-user-4',
    achievement: {
      id: 'medication-adherence',
      name: 'Aderência ao Tratamento',
      journey: JourneyType.CARE,
      levels: [
        {
          level: 1,
          title: 'Aderência ao Tratamento I',
          description: 'Tome seus medicamentos conforme prescrito por 7 dias',
          xpReward: 50,
          threshold: 33.33,
          icon: 'pill-1'
        },
        {
          level: 2,
          title: 'Aderência ao Tratamento II',
          description: 'Tome seus medicamentos conforme prescrito por 14 dias',
          xpReward: 100,
          threshold: 66.67,
          icon: 'pill-2'
        },
        {
          level: 3,
          title: 'Aderência ao Tratamento III',
          description: 'Tome seus medicamentos conforme prescrito por 30 dias',
          xpReward: 200,
          threshold: 100,
          icon: 'pill-3'
        }
      ]
    },
    progressSteps: [
      {
        description: 'User takes medication for 7 days',
        progressValue: 23.33, // 7/30 of total progress
        metadata: { streak: 7, adherence_rate: 100 },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      },
      {
        description: 'User takes medication for 7 more days (14 total)',
        progressValue: 46.67, // 14/30 of total progress
        metadata: { streak: 14, adherence_rate: 100 },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 2,
        shouldLevelUp: true
      },
      {
        description: 'User misses medication for 3 days, streak resets',
        progressValue: 0, // Reset to 0
        metadata: { streak: 0, adherence_rate: 0, reset_reason: 'missed_doses' },
        expectedStatus: AchievementStatus.LOCKED,
        expectedLevel: 1
      },
      {
        description: 'User restarts and takes medication for 10 days',
        progressValue: 33.33, // 10/30 of total progress
        metadata: { streak: 10, adherence_rate: 100 },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      }
    ],
    expectedNotifications: [
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 2,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      }
    ],
    expectedRewards: [
      {
        level: 1,
        xp: 50
      },
      {
        level: 2,
        xp: 100
      },
      {
        level: 1,
        xp: 50
      }
    ]
  }
];

/**
 * Plan journey achievement progression scenarios
 */
export const planAchievementScenarios: AchievementProgressionScenario[] = [
  {
    id: 'claim-master-milestone-notifications',
    name: 'Claim Master - Milestone Notifications',
    description: 'User progresses through the Claim Master achievement with milestone notifications at specific progress points',
    userId: 'test-user-5',
    achievement: {
      id: 'claim-master',
      name: 'Mestre em Reembolsos',
      journey: JourneyType.PLAN,
      levels: [
        {
          level: 1,
          title: 'Mestre em Reembolsos I',
          description: 'Submeta 3 solicitações de reembolso completas',
          xpReward: 50,
          threshold: 33.33,
          icon: 'receipt-1'
        },
        {
          level: 2,
          title: 'Mestre em Reembolsos II',
          description: 'Submeta 7 solicitações de reembolso completas',
          xpReward: 100,
          threshold: 66.67,
          icon: 'receipt-2'
        },
        {
          level: 3,
          title: 'Mestre em Reembolsos III',
          description: 'Submeta 10 solicitações de reembolso completas',
          xpReward: 200,
          threshold: 100,
          icon: 'receipt-3'
        }
      ]
    },
    progressSteps: [
      {
        description: 'User submits first claim',
        progressValue: 10, // 1/10 of total progress
        metadata: { claims: 1, claim_types: ['medical_appointment'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'User submits second claim',
        progressValue: 20, // 2/10 of total progress
        metadata: { claims: 2, claim_types: ['medical_appointment', 'exam'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'User submits third claim',
        progressValue: 30, // 3/10 of total progress
        metadata: { claims: 3, claim_types: ['medical_appointment', 'exam', 'therapy'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1,
        shouldLevelUp: true
      },
      {
        description: 'User submits fourth claim (milestone)',
        progressValue: 40, // 4/10 of total progress
        metadata: { claims: 4, claim_types: ['medical_appointment', 'exam', 'therapy', 'medication'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 1
      },
      {
        description: 'User submits seventh claim',
        progressValue: 70, // 7/10 of total progress
        metadata: { claims: 7, claim_types: ['medical_appointment', 'exam', 'therapy', 'medication', 'hospitalization'] },
        expectedStatus: AchievementStatus.IN_PROGRESS,
        expectedLevel: 2,
        shouldLevelUp: true
      },
      {
        description: 'User submits tenth claim',
        progressValue: 100, // 10/10 of total progress
        metadata: { claims: 10, claim_types: ['medical_appointment', 'exam', 'therapy', 'medication', 'hospitalization'] },
        expectedStatus: AchievementStatus.UNLOCKED,
        expectedLevel: 3,
        shouldLevelUp: true
      }
    ],
    expectedNotifications: [
      {
        level: 1,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 1,
        type: 'PROGRESS_MILESTONE',
        immediate: false
      },
      {
        level: 2,
        type: 'LEVEL_UP',
        immediate: true
      },
      {
        level: 3,
        type: 'ACHIEVEMENT_COMPLETED',
        immediate: true
      }
    ],
    expectedRewards: [
      {
        level: 1,
        xp: 50
      },
      {
        level: 2,
        xp: 100
      },
      {
        level: 3,
        xp: 200,
        additionalRewards: {
          badge: 'claim-master-badge',
          discount: { type: 'INSURANCE_DISCOUNT', value: 5, unit: 'PERCENT' }
        }
      }
    ]
  }
];

/**
 * Combined achievement progression scenarios for all journeys
 */
export const achievementProgressionScenarios: AchievementProgressionScenario[] = [
  ...healthAchievementScenarios,
  ...careAchievementScenarios,
  ...planAchievementScenarios
];

/**
 * Get a specific achievement progression scenario by ID
 * @param scenarioId The ID of the scenario to retrieve
 * @returns The achievement progression scenario or undefined if not found
 */
export function getAchievementScenarioById(scenarioId: string): AchievementProgressionScenario | undefined {
  return achievementProgressionScenarios.find(scenario => scenario.id === scenarioId);
}

/**
 * Get all achievement progression scenarios for a specific journey
 * @param journey The journey type to filter by
 * @returns Array of achievement progression scenarios for the specified journey
 */
export function getAchievementScenariosByJourney(journey: JourneyType): AchievementProgressionScenario[] {
  return achievementProgressionScenarios.filter(scenario => scenario.achievement.journey === journey);
}

/**
 * Get all achievement progression scenarios for a specific user
 * @param userId The user ID to filter by
 * @returns Array of achievement progression scenarios for the specified user
 */
export function getAchievementScenariosByUser(userId: string): AchievementProgressionScenario[] {
  return achievementProgressionScenarios.filter(scenario => scenario.userId === userId);
}