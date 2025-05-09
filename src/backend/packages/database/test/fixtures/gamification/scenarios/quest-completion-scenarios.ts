/**
 * @file Complex end-to-end test scenarios focused on quest completion flows in the gamification system.
 * Provides fixtures that simulate users accepting quests, making progress on steps, and completing
 * quests to earn rewards. These scenarios validate the full quest lifecycle, testing enrollment,
 * progress tracking, completion detection, and reward distribution.
 * 
 * The scenarios cover:
 * - Different quest types (daily, weekly, one-time)
 * - Quest enrollment and progress tracking
 * - Quest completion detection and verification
 * - Reward distribution upon quest completion
 * - Quest abandonment and expiration handling
 * - Cross-journey quest completion
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Quest, 
  UserQuest, 
  QuestStatus,
  GameProfile,
  Reward,
  UserReward
} from '@austa/interfaces/gamification';
import { allQuestFixtures, createQuestFixture, createUserQuestFixture } from '../quests.fixtures';
import { createGameProfileFixture } from '../profiles.fixtures';
import { createRewardFixture, createUserRewardFixture } from '../rewards.fixtures';

/**
 * Interface for a quest completion scenario that tests the full lifecycle
 * of a quest from enrollment to completion and reward distribution.
 */
export interface QuestCompletionScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable name of the scenario */
  name: string;
  
  /** Description of what the scenario tests */
  description: string;
  
  /** The user profile participating in the quest */
  userProfile: GameProfile;
  
  /** The quest being undertaken */
  quest: Quest;
  
  /** The user-quest relationship at the start of the scenario */
  initialUserQuest: UserQuest;
  
  /** Sequence of events that drive quest progress */
  events: QuestProgressEvent[];
  
  /** Expected user-quest states after each event */
  expectedStates: ExpectedQuestState[];
  
  /** Expected rewards distributed upon completion */
  expectedRewards?: UserReward[];
  
  /** Additional metadata for the scenario */
  metadata?: Record<string, any>;
}

/**
 * Represents an event that drives quest progress in a scenario.
 */
export interface QuestProgressEvent {
  /** Type of event */
  type: string;
  
  /** When the event occurs */
  timestamp: Date;
  
  /** Journey associated with the event */
  journey?: string;
  
  /** Additional event data */
  data?: Record<string, any>;
  
  /** Expected progress increase from this event (0-100) */
  expectedProgressIncrease?: number;
}

/**
 * Expected state of a user-quest after an event is processed.
 */
export interface ExpectedQuestState {
  /** Expected quest status */
  status: QuestStatus;
  
  /** Expected progress percentage (0-100) */
  progress: number;
  
  /** Whether the quest should be completed */
  isCompleted: boolean;
  
  /** Expected metadata state */
  progressMetadata?: Record<string, any>;
  
  /** Additional verification checks */
  verifications?: {
    /** Whether rewards should be distributed */
    rewardsDistributed?: boolean;
    
    /** Whether notifications should be sent */
    notificationSent?: boolean;
    
    /** Whether XP should be awarded */
    xpAwarded?: boolean;
    
    /** Expected XP amount awarded */
    xpAmount?: number;
  };
}

// ===== HEALTH JOURNEY QUEST COMPLETION SCENARIOS =====

/**
 * Scenario: Daily Step Goal Completion
 * 
 * Tests the completion of a daily step goal quest where the user
 * gradually accumulates steps throughout the day until reaching the target.
 * Verifies proper progress tracking, completion detection, and reward distribution.
 */
export const dailyStepGoalScenario: QuestCompletionScenario = {
  id: 'health-daily-step-goal',
  name: 'Daily Step Goal Completion',
  description: 'User completes a daily step goal by accumulating steps throughout the day',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-1',
    userId: 'test-user-1',
    level: 5,
    xp: 2500
  }),
  
  quest: createQuestFixture({
    id: 'daily-step-quest',
    title: 'Daily 10K Steps',
    description: 'Walk 10,000 steps today to earn XP and rewards',
    journey: 'health',
    icon: 'footprints',
    xpReward: 100,
    deadline: new Date(new Date().setHours(23, 59, 59, 999)), // Today at midnight
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-steps',
    userId: 'test-user-1',
    questId: 'daily-step-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      currentSteps: 0,
      targetSteps: 10000,
      lastUpdate: null
    }
  }),
  
  events: [
    // Morning walk - 2,500 steps
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setHours(8, 30, 0, 0)),
      journey: 'health',
      data: {
        metricType: 'steps',
        value: 2500,
        source: 'smartwatch'
      },
      expectedProgressIncrease: 25 // 25% progress (2,500 / 10,000)
    },
    
    // Lunch walk - 3,000 more steps
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setHours(12, 45, 0, 0)),
      journey: 'health',
      data: {
        metricType: 'steps',
        value: 3000,
        source: 'smartwatch'
      },
      expectedProgressIncrease: 30 // 30% progress (3,000 / 10,000)
    },
    
    // Evening walk - 4,500 more steps (completing the goal)
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setHours(18, 15, 0, 0)),
      journey: 'health',
      data: {
        metricType: 'steps',
        value: 4500,
        source: 'smartwatch'
      },
      expectedProgressIncrease: 45 // 45% progress (4,500 / 10,000)
    }
  ],
  
  expectedStates: [
    // After morning walk
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 25,
      isCompleted: false,
      progressMetadata: {
        currentSteps: 2500,
        targetSteps: 10000,
        lastUpdate: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After lunch walk
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 55, // Cumulative: 25% + 30% = 55%
      isCompleted: false,
      progressMetadata: {
        currentSteps: 5500,
        targetSteps: 10000,
        lastUpdate: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After evening walk (goal completed)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        currentSteps: 10000,
        targetSteps: 10000,
        lastUpdate: expect.any(Date),
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 100
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-1',
      reward: createRewardFixture({
        title: 'Step Goal Achievement',
        description: 'Reward for completing your daily step goal',
        type: 'badge',
        journey: 'health'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['health', 'daily-quest', 'metrics', 'steps', 'rewards'],
    difficulty: 'easy',
    estimatedDuration: '1 day'
  }
};

/**
 * Scenario: Weekly Health Metrics Tracking
 * 
 * Tests a multi-day quest that requires the user to track health metrics
 * for 5 consecutive days. Verifies streak tracking, partial progress,
 * and eventual completion with reward distribution.
 */
export const weeklyHealthMetricsScenario: QuestCompletionScenario = {
  id: 'health-weekly-metrics',
  name: 'Weekly Health Metrics Tracking',
  description: 'User tracks health metrics for 5 consecutive days to complete a weekly quest',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-2',
    userId: 'test-user-2',
    level: 3,
    xp: 1200
  }),
  
  quest: createQuestFixture({
    id: 'weekly-health-metrics-quest',
    title: 'Health Metrics Streak',
    description: 'Track your health metrics for 5 consecutive days',
    journey: 'health',
    icon: 'chart-line',
    xpReward: 250,
    deadline: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-weekly-metrics',
    userId: 'test-user-2',
    questId: 'weekly-health-metrics-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      daysTracked: 0,
      targetDays: 5,
      lastTrackedDate: null,
      streakDates: []
    }
  }),
  
  events: [
    // Day 1: Track blood pressure
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 4)),
      journey: 'health',
      data: {
        metricType: 'blood_pressure',
        value: { systolic: 120, diastolic: 80 },
        source: 'manual_entry'
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 days)
    },
    
    // Day 2: Track weight
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 3)),
      journey: 'health',
      data: {
        metricType: 'weight',
        value: 70.5,
        unit: 'kg',
        source: 'smart_scale'
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 days)
    },
    
    // Day 3: Track heart rate
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
      journey: 'health',
      data: {
        metricType: 'heart_rate',
        value: 68,
        unit: 'bpm',
        source: 'smartwatch'
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 days)
    },
    
    // Day 4: Track sleep
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 1)),
      journey: 'health',
      data: {
        metricType: 'sleep',
        value: 7.5,
        unit: 'hours',
        source: 'sleep_tracker'
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 days)
    },
    
    // Day 5: Track blood glucose (completing the streak)
    {
      type: 'health_metric_recorded',
      timestamp: new Date(),
      journey: 'health',
      data: {
        metricType: 'blood_glucose',
        value: 95,
        unit: 'mg/dL',
        source: 'glucose_monitor'
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 days)
    }
  ],
  
  expectedStates: [
    // After Day 1
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 20,
      isCompleted: false,
      progressMetadata: {
        daysTracked: 1,
        targetDays: 5,
        lastTrackedDate: expect.any(Date),
        streakDates: [expect.any(Date)]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After Day 2
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 40,
      isCompleted: false,
      progressMetadata: {
        daysTracked: 2,
        targetDays: 5,
        lastTrackedDate: expect.any(Date),
        streakDates: [expect.any(Date), expect.any(Date)]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After Day 3
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 60,
      isCompleted: false,
      progressMetadata: {
        daysTracked: 3,
        targetDays: 5,
        lastTrackedDate: expect.any(Date),
        streakDates: [expect.any(Date), expect.any(Date), expect.any(Date)]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After Day 4
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 80,
      isCompleted: false,
      progressMetadata: {
        daysTracked: 4,
        targetDays: 5,
        lastTrackedDate: expect.any(Date),
        streakDates: [expect.any(Date), expect.any(Date), expect.any(Date), expect.any(Date)]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After Day 5 (streak completed)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        daysTracked: 5,
        targetDays: 5,
        lastTrackedDate: expect.any(Date),
        streakDates: [expect.any(Date), expect.any(Date), expect.any(Date), expect.any(Date), expect.any(Date)],
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 250
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-2',
      reward: createRewardFixture({
        title: 'Health Tracking Champion',
        description: 'Reward for tracking health metrics for 5 consecutive days',
        type: 'badge',
        journey: 'health'
      }),
      isRedeemed: false
    }),
    createUserRewardFixture({
      userId: 'test-user-2',
      reward: createRewardFixture({
        title: 'Health Insights Unlock',
        description: 'Unlock advanced health insights',
        type: 'feature',
        journey: 'health'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['health', 'weekly-quest', 'metrics', 'streak', 'multiple-rewards'],
    difficulty: 'medium',
    estimatedDuration: '5 days'
  }
};

/**
 * Scenario: Device Connection Quest
 * 
 * Tests a one-time quest that requires the user to connect a health device.
 * Verifies immediate completion upon device connection and reward distribution.
 */
export const deviceConnectionScenario: QuestCompletionScenario = {
  id: 'health-device-connection',
  name: 'Device Connection Quest',
  description: 'User completes a quest by connecting a health tracking device',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-3',
    userId: 'test-user-3',
    level: 2,
    xp: 800
  }),
  
  quest: createQuestFixture({
    id: 'device-connection-quest',
    title: 'Connect a Health Device',
    description: 'Connect a health tracking device to enhance your health journey',
    journey: 'health',
    icon: 'mobile-device',
    xpReward: 150,
    deadline: null, // No deadline for this one-time quest
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-device',
    userId: 'test-user-3',
    questId: 'device-connection-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      deviceConnected: false,
      deviceType: null
    }
  }),
  
  events: [
    // User connects a smartwatch
    {
      type: 'device_connected',
      timestamp: new Date(),
      journey: 'health',
      data: {
        deviceType: 'smartwatch',
        deviceId: 'device-123',
        manufacturer: 'FitBit',
        model: 'Versa 3'
      },
      expectedProgressIncrease: 100 // 100% progress (immediate completion)
    }
  ],
  
  expectedStates: [
    // After device connection (immediate completion)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        deviceConnected: true,
        deviceType: 'smartwatch',
        deviceDetails: {
          deviceId: 'device-123',
          manufacturer: 'FitBit',
          model: 'Versa 3'
        },
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 150
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-3',
      reward: createRewardFixture({
        title: 'Connected Health',
        description: 'Reward for connecting your first health device',
        type: 'badge',
        journey: 'health'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['health', 'one-time-quest', 'device', 'immediate-completion'],
    difficulty: 'easy',
    estimatedDuration: 'immediate'
  }
};

// ===== CARE JOURNEY QUEST COMPLETION SCENARIOS =====

/**
 * Scenario: Medication Adherence Streak
 * 
 * Tests a multi-day quest that requires the user to take medications
 * for 7 consecutive days. Verifies streak tracking, partial progress,
 * and eventual completion with reward distribution.
 */
export const medicationAdherenceScenario: QuestCompletionScenario = {
  id: 'care-medication-adherence',
  name: 'Medication Adherence Streak',
  description: 'User takes medications for 7 consecutive days to complete a weekly quest',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-4',
    userId: 'test-user-4',
    level: 4,
    xp: 1800
  }),
  
  quest: createQuestFixture({
    id: 'medication-adherence-quest',
    title: 'Medication Adherence',
    description: 'Take all your medications as prescribed for 7 consecutive days',
    journey: 'care',
    icon: 'pill',
    xpReward: 300,
    deadline: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-medication',
    userId: 'test-user-4',
    questId: 'medication-adherence-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      daysCompleted: 0,
      targetDays: 7,
      lastCompletedDate: null,
      streakDates: [],
      medications: [
        { id: 'med-1', name: 'Medication A', dosage: '10mg', frequency: 'daily' },
        { id: 'med-2', name: 'Medication B', dosage: '20mg', frequency: 'daily' }
      ]
    }
  }),
  
  events: [
    // Days 1-7: User takes medications each day
    ...Array.from({ length: 7 }, (_, i) => ({
      type: 'medication_taken',
      timestamp: new Date(new Date().setDate(new Date().getDate() - (6 - i))),
      journey: 'care',
      data: {
        medicationIds: ['med-1', 'med-2'],
        allScheduledMedicationsTaken: true
      },
      expectedProgressIncrease: 14.29 // ~14.29% progress (1/7 days)
    }))
  ],
  
  expectedStates: [
    // States after each day of medication adherence
    ...Array.from({ length: 6 }, (_, i) => ({
      status: QuestStatus.IN_PROGRESS,
      progress: Math.round(((i + 1) / 7) * 100), // Progress percentage based on days completed
      isCompleted: false,
      progressMetadata: {
        daysCompleted: i + 1,
        targetDays: 7,
        lastCompletedDate: expect.any(Date),
        streakDates: Array(i + 1).fill(expect.any(Date)),
        medications: expect.any(Array)
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    })),
    
    // After Day 7 (streak completed)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        daysCompleted: 7,
        targetDays: 7,
        lastCompletedDate: expect.any(Date),
        streakDates: Array(7).fill(expect.any(Date)),
        medications: expect.any(Array),
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 300
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-4',
      reward: createRewardFixture({
        title: 'Medication Master',
        description: 'Reward for maintaining perfect medication adherence for a week',
        type: 'badge',
        journey: 'care'
      }),
      isRedeemed: false
    }),
    createUserRewardFixture({
      userId: 'test-user-4',
      reward: createRewardFixture({
        title: 'Health Discount',
        description: '10% discount on your next medication refill',
        type: 'discount',
        journey: 'care'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['care', 'weekly-quest', 'medication', 'streak', 'multiple-rewards'],
    difficulty: 'medium',
    estimatedDuration: '7 days'
  }
};

/**
 * Scenario: Appointment Attendance
 * 
 * Tests a one-time quest that requires the user to attend a scheduled appointment.
 * Verifies completion upon appointment attendance and reward distribution.
 */
export const appointmentAttendanceScenario: QuestCompletionScenario = {
  id: 'care-appointment-attendance',
  name: 'Appointment Attendance',
  description: 'User completes a quest by attending a scheduled medical appointment',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-5',
    userId: 'test-user-5',
    level: 3,
    xp: 1500
  }),
  
  quest: createQuestFixture({
    id: 'appointment-attendance-quest',
    title: 'Attend Your Checkup',
    description: 'Attend your scheduled medical appointment',
    journey: 'care',
    icon: 'calendar-check',
    xpReward: 200,
    deadline: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-appointment',
    userId: 'test-user-5',
    questId: 'appointment-attendance-quest',
    status: QuestStatus.IN_PROGRESS,
    progress: 50, // Already scheduled, just needs to attend
    progressMetadata: {
      appointmentId: 'appt-123',
      appointmentDate: new Date(new Date().setDate(new Date().getDate() + 1)),
      providerName: 'Dr. Smith',
      appointmentType: 'Annual Checkup',
      isScheduled: true,
      isAttended: false
    }
  }),
  
  events: [
    // User attends the appointment
    {
      type: 'appointment_attended',
      timestamp: new Date(new Date().setDate(new Date().getDate() + 1)),
      journey: 'care',
      data: {
        appointmentId: 'appt-123',
        duration: 30, // minutes
        providerId: 'provider-456',
        providerName: 'Dr. Smith',
        appointmentType: 'Annual Checkup',
        status: 'completed'
      },
      expectedProgressIncrease: 50 // 50% progress (from 50% to 100%)
    }
  ],
  
  expectedStates: [
    // After appointment attendance (completion)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        appointmentId: 'appt-123',
        appointmentDate: expect.any(Date),
        providerName: 'Dr. Smith',
        appointmentType: 'Annual Checkup',
        isScheduled: true,
        isAttended: true,
        attendanceDate: expect.any(Date),
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 200
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-5',
      reward: createRewardFixture({
        title: 'Appointment Keeper',
        description: 'Reward for attending your scheduled medical appointment',
        type: 'badge',
        journey: 'care'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['care', 'one-time-quest', 'appointment', 'attendance'],
    difficulty: 'easy',
    estimatedDuration: '1 day'
  }
};

// ===== PLAN JOURNEY QUEST COMPLETION SCENARIOS =====

/**
 * Scenario: Claim Submission
 * 
 * Tests a one-time quest that requires the user to submit a claim with all required documentation.
 * Verifies completion upon successful claim submission and reward distribution.
 */
export const claimSubmissionScenario: QuestCompletionScenario = {
  id: 'plan-claim-submission',
  name: 'Claim Submission',
  description: 'User completes a quest by submitting a claim with all required documentation',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-6',
    userId: 'test-user-6',
    level: 4,
    xp: 2000
  }),
  
  quest: createQuestFixture({
    id: 'claim-submission-quest',
    title: 'Submit a Complete Claim',
    description: 'Submit a healthcare claim with all required documentation',
    journey: 'plan',
    icon: 'file-invoice',
    xpReward: 250,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-claim',
    userId: 'test-user-6',
    questId: 'claim-submission-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      claimId: null,
      claimType: null,
      requiredDocuments: [
        'receipt',
        'medical_report',
        'prescription'
      ],
      uploadedDocuments: []
    }
  }),
  
  events: [
    // User uploads receipt
    {
      type: 'document_uploaded',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 3)),
      journey: 'plan',
      data: {
        documentType: 'receipt',
        documentId: 'doc-1',
        fileName: 'receipt.pdf',
        fileSize: 1024 * 1024 // 1MB
      },
      expectedProgressIncrease: 33.33 // ~33.33% progress (1/3 documents)
    },
    
    // User uploads medical report
    {
      type: 'document_uploaded',
      timestamp: new Date(new Date().setHours(new Date().getHours() - 2)),
      journey: 'plan',
      data: {
        documentType: 'medical_report',
        documentId: 'doc-2',
        fileName: 'medical_report.pdf',
        fileSize: 2 * 1024 * 1024 // 2MB
      },
      expectedProgressIncrease: 33.33 // ~33.33% progress (1/3 documents)
    },
    
    // User uploads prescription and submits claim
    {
      type: 'claim_submitted',
      timestamp: new Date(),
      journey: 'plan',
      data: {
        claimId: 'claim-123',
        claimType: 'medical',
        claimAmount: 500.00,
        documents: [
          { id: 'doc-1', type: 'receipt' },
          { id: 'doc-2', type: 'medical_report' },
          { id: 'doc-3', type: 'prescription' }
        ],
        status: 'submitted'
      },
      expectedProgressIncrease: 33.34 // ~33.34% progress (1/3 documents + submission)
    }
  ],
  
  expectedStates: [
    // After uploading receipt
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 33,
      isCompleted: false,
      progressMetadata: {
        claimId: null,
        claimType: null,
        requiredDocuments: ['receipt', 'medical_report', 'prescription'],
        uploadedDocuments: [
          { id: 'doc-1', type: 'receipt', uploadedAt: expect.any(Date) }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After uploading medical report
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 66,
      isCompleted: false,
      progressMetadata: {
        claimId: null,
        claimType: null,
        requiredDocuments: ['receipt', 'medical_report', 'prescription'],
        uploadedDocuments: [
          { id: 'doc-1', type: 'receipt', uploadedAt: expect.any(Date) },
          { id: 'doc-2', type: 'medical_report', uploadedAt: expect.any(Date) }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After uploading prescription and submitting claim
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        claimId: 'claim-123',
        claimType: 'medical',
        claimAmount: 500.00,
        requiredDocuments: ['receipt', 'medical_report', 'prescription'],
        uploadedDocuments: [
          { id: 'doc-1', type: 'receipt', uploadedAt: expect.any(Date) },
          { id: 'doc-2', type: 'medical_report', uploadedAt: expect.any(Date) },
          { id: 'doc-3', type: 'prescription', uploadedAt: expect.any(Date) }
        ],
        submittedAt: expect.any(Date),
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 250
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-6',
      reward: createRewardFixture({
        title: 'Claim Master',
        description: 'Reward for submitting a complete claim with all documentation',
        type: 'badge',
        journey: 'plan'
      }),
      isRedeemed: false
    }),
    createUserRewardFixture({
      userId: 'test-user-6',
      reward: createRewardFixture({
        title: 'Fast Track',
        description: 'Priority processing for your next claim',
        type: 'feature',
        journey: 'plan'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['plan', 'one-time-quest', 'claim', 'documentation', 'multiple-rewards'],
    difficulty: 'medium',
    estimatedDuration: '1 day'
  }
};

/**
 * Scenario: Benefits Exploration
 * 
 * Tests a quest that requires the user to explore different benefits in their health plan.
 * Verifies progress tracking as the user views different benefit categories.
 */
export const benefitsExplorationScenario: QuestCompletionScenario = {
  id: 'plan-benefits-exploration',
  name: 'Benefits Exploration',
  description: 'User completes a quest by exploring all available benefits in their health plan',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-7',
    userId: 'test-user-7',
    level: 2,
    xp: 900
  }),
  
  quest: createQuestFixture({
    id: 'benefits-exploration-quest',
    title: 'Explore Your Benefits',
    description: 'Review all available benefits in your health plan',
    journey: 'plan',
    icon: 'gift',
    xpReward: 150,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-benefits',
    userId: 'test-user-7',
    questId: 'benefits-exploration-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      benefitCategories: [
        'medical',
        'dental',
        'vision',
        'pharmacy',
        'wellness'
      ],
      exploredCategories: []
    }
  }),
  
  events: [
    // User explores medical benefits
    {
      type: 'benefit_category_viewed',
      timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 30)),
      journey: 'plan',
      data: {
        categoryId: 'medical',
        categoryName: 'Medical Benefits',
        viewDuration: 120 // seconds
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 categories)
    },
    
    // User explores dental benefits
    {
      type: 'benefit_category_viewed',
      timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 25)),
      journey: 'plan',
      data: {
        categoryId: 'dental',
        categoryName: 'Dental Benefits',
        viewDuration: 90 // seconds
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 categories)
    },
    
    // User explores vision benefits
    {
      type: 'benefit_category_viewed',
      timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 20)),
      journey: 'plan',
      data: {
        categoryId: 'vision',
        categoryName: 'Vision Benefits',
        viewDuration: 60 // seconds
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 categories)
    },
    
    // User explores pharmacy benefits
    {
      type: 'benefit_category_viewed',
      timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 15)),
      journey: 'plan',
      data: {
        categoryId: 'pharmacy',
        categoryName: 'Pharmacy Benefits',
        viewDuration: 75 // seconds
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 categories)
    },
    
    // User explores wellness benefits
    {
      type: 'benefit_category_viewed',
      timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 10)),
      journey: 'plan',
      data: {
        categoryId: 'wellness',
        categoryName: 'Wellness Benefits',
        viewDuration: 150 // seconds
      },
      expectedProgressIncrease: 20 // 20% progress (1/5 categories)
    }
  ],
  
  expectedStates: [
    // After exploring medical benefits
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 20,
      isCompleted: false,
      progressMetadata: {
        benefitCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
        exploredCategories: [
          { id: 'medical', viewedAt: expect.any(Date), duration: 120 }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After exploring dental benefits
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 40,
      isCompleted: false,
      progressMetadata: {
        benefitCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
        exploredCategories: [
          { id: 'medical', viewedAt: expect.any(Date), duration: 120 },
          { id: 'dental', viewedAt: expect.any(Date), duration: 90 }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After exploring vision benefits
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 60,
      isCompleted: false,
      progressMetadata: {
        benefitCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
        exploredCategories: [
          { id: 'medical', viewedAt: expect.any(Date), duration: 120 },
          { id: 'dental', viewedAt: expect.any(Date), duration: 90 },
          { id: 'vision', viewedAt: expect.any(Date), duration: 60 }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After exploring pharmacy benefits
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 80,
      isCompleted: false,
      progressMetadata: {
        benefitCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
        exploredCategories: [
          { id: 'medical', viewedAt: expect.any(Date), duration: 120 },
          { id: 'dental', viewedAt: expect.any(Date), duration: 90 },
          { id: 'vision', viewedAt: expect.any(Date), duration: 60 },
          { id: 'pharmacy', viewedAt: expect.any(Date), duration: 75 }
        ]
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After exploring wellness benefits (completion)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        benefitCategories: ['medical', 'dental', 'vision', 'pharmacy', 'wellness'],
        exploredCategories: [
          { id: 'medical', viewedAt: expect.any(Date), duration: 120 },
          { id: 'dental', viewedAt: expect.any(Date), duration: 90 },
          { id: 'vision', viewedAt: expect.any(Date), duration: 60 },
          { id: 'pharmacy', viewedAt: expect.any(Date), duration: 75 },
          { id: 'wellness', viewedAt: expect.any(Date), duration: 150 }
        ],
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 150
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-7',
      reward: createRewardFixture({
        title: 'Benefits Expert',
        description: 'Reward for exploring all benefits in your health plan',
        type: 'badge',
        journey: 'plan'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['plan', 'exploration-quest', 'benefits', 'categories'],
    difficulty: 'easy',
    estimatedDuration: '30 minutes'
  }
};

// ===== CROSS-JOURNEY QUEST COMPLETION SCENARIOS =====

/**
 * Scenario: Cross-Journey Health Management
 * 
 * Tests a complex quest that requires actions across multiple journeys.
 * Verifies progress tracking across journeys and reward distribution upon completion.
 */
export const crossJourneyHealthScenario: QuestCompletionScenario = {
  id: 'cross-journey-health-management',
  name: 'Cross-Journey Health Management',
  description: 'User completes a quest requiring actions across health, care, and plan journeys',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-8',
    userId: 'test-user-8',
    level: 6,
    xp: 3500
  }),
  
  quest: createQuestFixture({
    id: 'cross-journey-health-quest',
    title: 'Complete Health Journey',
    description: 'Track a health metric, attend a telemedicine appointment, and review your benefits',
    journey: 'cross-journey',
    icon: 'trophy',
    xpReward: 500,
    deadline: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-cross-journey',
    userId: 'test-user-8',
    questId: 'cross-journey-health-quest',
    status: QuestStatus.NOT_STARTED,
    progress: 0,
    progressMetadata: {
      steps: [
        { id: 'track-health-metric', journey: 'health', completed: false },
        { id: 'attend-telemedicine', journey: 'care', completed: false },
        { id: 'review-benefits', journey: 'plan', completed: false }
      ],
      completedSteps: [],
      journeyProgress: {
        health: 0,
        care: 0,
        plan: 0
      }
    }
  }),
  
  events: [
    // User tracks health metric (health journey)
    {
      type: 'health_metric_recorded',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 5)),
      journey: 'health',
      data: {
        metricType: 'heart_rate',
        value: 72,
        unit: 'bpm',
        source: 'smartwatch'
      },
      expectedProgressIncrease: 33.33 // ~33.33% progress (1/3 steps)
    },
    
    // User attends telemedicine appointment (care journey)
    {
      type: 'telemedicine_session_completed',
      timestamp: new Date(new Date().setDate(new Date().getDate() - 2)),
      journey: 'care',
      data: {
        sessionId: 'tele-123',
        providerId: 'provider-456',
        providerName: 'Dr. Johnson',
        duration: 20, // minutes
        status: 'completed'
      },
      expectedProgressIncrease: 33.33 // ~33.33% progress (1/3 steps)
    },
    
    // User reviews benefits (plan journey)
    {
      type: 'benefits_reviewed',
      timestamp: new Date(),
      journey: 'plan',
      data: {
        planId: 'plan-789',
        reviewDuration: 300, // seconds
        categoriesViewed: ['medical', 'dental', 'vision']
      },
      expectedProgressIncrease: 33.34 // ~33.34% progress (1/3 steps)
    }
  ],
  
  expectedStates: [
    // After tracking health metric
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 33,
      isCompleted: false,
      progressMetadata: {
        steps: [
          { id: 'track-health-metric', journey: 'health', completed: true },
          { id: 'attend-telemedicine', journey: 'care', completed: false },
          { id: 'review-benefits', journey: 'plan', completed: false }
        ],
        completedSteps: [
          { 
            id: 'track-health-metric', 
            journey: 'health', 
            completedAt: expect.any(Date),
            data: {
              metricType: 'heart_rate',
              value: 72,
              unit: 'bpm'
            }
          }
        ],
        journeyProgress: {
          health: 100, // 100% of health steps completed
          care: 0,
          plan: 0
        }
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After attending telemedicine appointment
    {
      status: QuestStatus.IN_PROGRESS,
      progress: 67,
      isCompleted: false,
      progressMetadata: {
        steps: [
          { id: 'track-health-metric', journey: 'health', completed: true },
          { id: 'attend-telemedicine', journey: 'care', completed: true },
          { id: 'review-benefits', journey: 'plan', completed: false }
        ],
        completedSteps: [
          { 
            id: 'track-health-metric', 
            journey: 'health', 
            completedAt: expect.any(Date),
            data: {
              metricType: 'heart_rate',
              value: 72,
              unit: 'bpm'
            }
          },
          { 
            id: 'attend-telemedicine', 
            journey: 'care', 
            completedAt: expect.any(Date),
            data: {
              sessionId: 'tele-123',
              providerName: 'Dr. Johnson',
              duration: 20
            }
          }
        ],
        journeyProgress: {
          health: 100, // 100% of health steps completed
          care: 100,  // 100% of care steps completed
          plan: 0
        }
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: false,
        xpAwarded: false
      }
    },
    
    // After reviewing benefits (completion)
    {
      status: QuestStatus.COMPLETED,
      progress: 100,
      isCompleted: true,
      progressMetadata: {
        steps: [
          { id: 'track-health-metric', journey: 'health', completed: true },
          { id: 'attend-telemedicine', journey: 'care', completed: true },
          { id: 'review-benefits', journey: 'plan', completed: true }
        ],
        completedSteps: [
          { 
            id: 'track-health-metric', 
            journey: 'health', 
            completedAt: expect.any(Date),
            data: {
              metricType: 'heart_rate',
              value: 72,
              unit: 'bpm'
            }
          },
          { 
            id: 'attend-telemedicine', 
            journey: 'care', 
            completedAt: expect.any(Date),
            data: {
              sessionId: 'tele-123',
              providerName: 'Dr. Johnson',
              duration: 20
            }
          },
          { 
            id: 'review-benefits', 
            journey: 'plan', 
            completedAt: expect.any(Date),
            data: {
              planId: 'plan-789',
              categoriesViewed: ['medical', 'dental', 'vision']
            }
          }
        ],
        journeyProgress: {
          health: 100, // 100% of health steps completed
          care: 100,  // 100% of care steps completed
          plan: 100   // 100% of plan steps completed
        },
        completedAt: expect.any(Date)
      },
      verifications: {
        rewardsDistributed: true,
        notificationSent: true,
        xpAwarded: true,
        xpAmount: 500
      }
    }
  ],
  
  expectedRewards: [
    createUserRewardFixture({
      userId: 'test-user-8',
      reward: createRewardFixture({
        title: 'Health Journey Champion',
        description: 'Reward for completing actions across all health journeys',
        type: 'badge',
        journey: 'cross-journey'
      }),
      isRedeemed: false
    }),
    createUserRewardFixture({
      userId: 'test-user-8',
      reward: createRewardFixture({
        title: 'Premium Content',
        description: 'Unlock premium health content and resources',
        type: 'content',
        journey: 'cross-journey'
      }),
      isRedeemed: false
    }),
    createUserRewardFixture({
      userId: 'test-user-8',
      reward: createRewardFixture({
        title: 'Health Insights Pro',
        description: 'Access to advanced health analytics and insights',
        type: 'feature',
        journey: 'cross-journey'
      }),
      isRedeemed: false
    })
  ],
  
  metadata: {
    testTags: ['cross-journey', 'complex-quest', 'multi-step', 'multiple-rewards'],
    difficulty: 'hard',
    estimatedDuration: '1 week'
  }
};

// ===== QUEST ABANDONMENT AND EXPIRATION SCENARIOS =====

/**
 * Scenario: Quest Abandonment
 * 
 * Tests a scenario where a user abandons a quest before completion.
 * Verifies proper handling of abandoned quests and cleanup.
 */
export const questAbandonmentScenario: QuestCompletionScenario = {
  id: 'quest-abandonment',
  name: 'Quest Abandonment',
  description: 'User abandons a quest before completion',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-9',
    userId: 'test-user-9',
    level: 3,
    xp: 1300
  }),
  
  quest: createQuestFixture({
    id: 'abandonable-quest',
    title: 'Complex Health Challenge',
    description: 'Complete a series of challenging health activities',
    journey: 'health',
    icon: 'mountain',
    xpReward: 400,
    deadline: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-abandon',
    userId: 'test-user-9',
    questId: 'abandonable-quest',
    status: QuestStatus.IN_PROGRESS,
    progress: 40,
    progressMetadata: {
      steps: [
        { id: 'step-1', completed: true },
        { id: 'step-2', completed: true },
        { id: 'step-3', completed: false },
        { id: 'step-4', completed: false },
        { id: 'step-5', completed: false }
      ],
      completedSteps: [
        { id: 'step-1', completedAt: new Date(new Date().setDate(new Date().getDate() - 5)) },
        { id: 'step-2', completedAt: new Date(new Date().setDate(new Date().getDate() - 3)) }
      ]
    }
  }),
  
  events: [
    // User abandons the quest
    {
      type: 'quest_abandoned',
      timestamp: new Date(),
      journey: 'health',
      data: {
        questId: 'abandonable-quest',
        reason: 'too_difficult',
        currentProgress: 40
      },
      expectedProgressIncrease: 0 // No progress increase for abandonment
    }
  ],
  
  expectedStates: [
    // After abandonment
    {
      status: QuestStatus.NOT_STARTED, // Reset to not started
      progress: 0, // Progress reset
      isCompleted: false,
      progressMetadata: {
        abandonedAt: expect.any(Date),
        previousProgress: 40,
        reason: 'too_difficult',
        canRestart: true
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: true, // Notification about abandonment
        xpAwarded: false
      }
    }
  ],
  
  expectedRewards: [], // No rewards for abandonment
  
  metadata: {
    testTags: ['abandonment', 'reset', 'health'],
    difficulty: 'medium',
    estimatedDuration: 'N/A'
  }
};

/**
 * Scenario: Quest Expiration
 * 
 * Tests a scenario where a quest expires before completion.
 * Verifies proper handling of expired quests and cleanup.
 */
export const questExpirationScenario: QuestCompletionScenario = {
  id: 'quest-expiration',
  name: 'Quest Expiration',
  description: 'Quest expires before the user completes it',
  
  userProfile: createGameProfileFixture({
    id: 'user-profile-10',
    userId: 'test-user-10',
    level: 4,
    xp: 2200
  }),
  
  quest: createQuestFixture({
    id: 'expiring-quest',
    title: 'Limited Time Offer',
    description: 'Complete this quest before it expires',
    journey: 'plan',
    icon: 'clock',
    xpReward: 300,
    deadline: new Date(new Date().setDate(new Date().getDate() - 1)), // Already expired (yesterday)
  }),
  
  initialUserQuest: createUserQuestFixture({
    id: 'user-quest-expire',
    userId: 'test-user-10',
    questId: 'expiring-quest',
    status: QuestStatus.IN_PROGRESS,
    progress: 60,
    progressMetadata: {
      steps: [
        { id: 'step-1', completed: true },
        { id: 'step-2', completed: true },
        { id: 'step-3', completed: true },
        { id: 'step-4', completed: false },
        { id: 'step-5', completed: false }
      ],
      completedSteps: [
        { id: 'step-1', completedAt: new Date(new Date().setDate(new Date().getDate() - 5)) },
        { id: 'step-2', completedAt: new Date(new Date().setDate(new Date().getDate() - 4)) },
        { id: 'step-3', completedAt: new Date(new Date().setDate(new Date().getDate() - 3)) }
      ]
    }
  }),
  
  events: [
    // System detects quest expiration
    {
      type: 'quest_expired',
      timestamp: new Date(),
      journey: 'plan',
      data: {
        questId: 'expiring-quest',
        expirationDate: new Date(new Date().setDate(new Date().getDate() - 1)),
        currentProgress: 60
      },
      expectedProgressIncrease: 0 // No progress increase for expiration
    }
  ],
  
  expectedStates: [
    // After expiration
    {
      status: QuestStatus.NOT_STARTED, // Reset to not started
      progress: 0, // Progress reset
      isCompleted: false,
      progressMetadata: {
        expiredAt: expect.any(Date),
        previousProgress: 60,
        deadline: expect.any(Date),
        canRestart: false // Cannot restart expired quests
      },
      verifications: {
        rewardsDistributed: false,
        notificationSent: true, // Notification about expiration
        xpAwarded: false
      }
    }
  ],
  
  expectedRewards: [], // No rewards for expiration
  
  metadata: {
    testTags: ['expiration', 'deadline', 'plan'],
    difficulty: 'medium',
    estimatedDuration: 'N/A'
  }
};

// Export all scenarios
export const questCompletionScenarios = {
  // Health journey scenarios
  dailyStepGoalScenario,
  weeklyHealthMetricsScenario,
  deviceConnectionScenario,
  
  // Care journey scenarios
  medicationAdherenceScenario,
  appointmentAttendanceScenario,
  
  // Plan journey scenarios
  claimSubmissionScenario,
  benefitsExplorationScenario,
  
  // Cross-journey scenarios
  crossJourneyHealthScenario,
  
  // Abandonment and expiration scenarios
  questAbandonmentScenario,
  questExpirationScenario,
};

export default questCompletionScenarios;