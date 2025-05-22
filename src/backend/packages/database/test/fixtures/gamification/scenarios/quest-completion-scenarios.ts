/**
 * @file Quest completion scenarios for testing the gamification engine
 * @description Provides complex end-to-end test scenarios focused on quest completion flows.
 * These scenarios simulate users accepting quests, making progress on steps, and completing
 * quests to earn rewards. They validate the full quest lifecycle including enrollment,
 * progress tracking, completion detection, and reward distribution.
 */

import { QuestStatus } from 'src/backend/gamification-engine/src/quests/entities/user-quest.entity';
import {
  TestQuest,
  TestUserQuest,
  QuestType,
  getQuestFixtureById,
  allQuestFixtures,
  healthQuestFixtures,
  careQuestFixtures,
  planQuestFixtures,
  crossJourneyQuestFixtures,
} from '../quests.fixtures';

/**
 * Interface representing a single event in a quest completion scenario.
 * Each event represents a discrete action that affects quest progress.
 */
export interface QuestScenarioEvent {
  /**
   * Unique identifier for the event.
   */
  id: string;

  /**
   * Description of the event for documentation and debugging.
   */
  description: string;

  /**
   * The type of event that occurred.
   */
  type: QuestEventType;

  /**
   * The ID of the quest this event affects.
   */
  questId: string;

  /**
   * The ID of the user profile performing the action.
   */
  profileId: string;

  /**
   * The journey associated with this event (health, care, plan).
   */
  journey: string;

  /**
   * Optional ID of the quest step this event completes (for step-based quests).
   */
  stepId?: string;

  /**
   * Optional progress value this event contributes to the quest (0-100).
   */
  progressValue?: number;

  /**
   * Optional timestamp for when this event occurred.
   */
  timestamp?: Date;

  /**
   * Optional metadata for the event, used for testing specific scenarios.
   */
  metadata?: Record<string, any>;
}

/**
 * Enum representing different types of events in a quest scenario.
 */
export enum QuestEventType {
  /**
   * User accepts/enrolls in a quest.
   */
  ACCEPT_QUEST = 'ACCEPT_QUEST',

  /**
   * User makes progress on a quest step.
   */
  PROGRESS_STEP = 'PROGRESS_STEP',

  /**
   * User completes a quest step.
   */
  COMPLETE_STEP = 'COMPLETE_STEP',

  /**
   * User completes the entire quest.
   */
  COMPLETE_QUEST = 'COMPLETE_QUEST',

  /**
   * User abandons a quest before completion.
   */
  ABANDON_QUEST = 'ABANDON_QUEST',

  /**
   * Quest expires before completion.
   */
  QUEST_EXPIRED = 'QUEST_EXPIRED',

  /**
   * System awards rewards for a completed quest.
   */
  REWARD_GRANTED = 'REWARD_GRANTED',

  /**
   * User views quest details.
   */
  VIEW_QUEST = 'VIEW_QUEST',
}

/**
 * Interface representing the expected state of a quest after a scenario event.
 * Used for validating that the system correctly updates quest state.
 */
export interface QuestExpectedState {
  /**
   * The expected status of the quest after the event.
   */
  status: QuestStatus;

  /**
   * The expected progress value (0-100) after the event.
   */
  progress: number;

  /**
   * Expected list of completed step IDs after the event.
   */
  completedSteps?: string[];

  /**
   * Whether rewards should have been granted after the event.
   */
  rewarded: boolean;

  /**
   * Optional metadata that should be present after the event.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface representing a complete quest completion scenario.
 * A scenario consists of a sequence of events and the expected states
 * after each event, allowing for comprehensive testing of the quest system.
 */
export interface QuestCompletionScenario {
  /**
   * Unique identifier for the scenario.
   */
  id: string;

  /**
   * Human-readable name of the scenario.
   */
  name: string;

  /**
   * Detailed description of what the scenario tests.
   */
  description: string;

  /**
   * The quest being tested in this scenario.
   */
  quest: TestQuest;

  /**
   * The user profile ID for this scenario.
   */
  profileId: string;

  /**
   * Sequence of events that occur in this scenario.
   */
  events: QuestScenarioEvent[];

  /**
   * Expected quest states after each event, indexed to match events array.
   */
  expectedStates: QuestExpectedState[];

  /**
   * Optional tags for categorizing and filtering scenarios.
   */
  tags?: string[];

  /**
   * Optional metadata for the scenario, used for testing specific cases.
   */
  metadata?: Record<string, any>;
}

// ============================================================================
// Health Journey Quest Completion Scenarios
// ============================================================================

/**
 * Collection of health journey quest completion scenarios.
 */
export const healthQuestCompletionScenarios: QuestCompletionScenario[] = [
  // Daily Step Goal - Simple Completion Scenario
  {
    id: 'health-daily-steps-completion',
    name: 'Daily Step Goal Completion',
    description: 'User completes a daily step goal quest by reaching all step milestones',
    quest: getQuestFixtureById('health-daily-steps') as TestQuest,
    profileId: 'test-profile-1',
    events: [
      {
        id: 'daily-steps-accept',
        description: 'User accepts the daily step goal quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
      {
        id: 'daily-steps-25-percent',
        description: 'User reaches 25% of daily step goal',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'steps-25-percent',
        progressValue: 25,
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
        metadata: {
          currentSteps: 2500,
          goalSteps: 10000,
        },
      },
      {
        id: 'daily-steps-50-percent',
        description: 'User reaches 50% of daily step goal',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'steps-50-percent',
        progressValue: 25,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        metadata: {
          currentSteps: 5000,
          goalSteps: 10000,
        },
      },
      {
        id: 'daily-steps-75-percent',
        description: 'User reaches 75% of daily step goal',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'steps-75-percent',
        progressValue: 25,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        metadata: {
          currentSteps: 7500,
          goalSteps: 10000,
        },
      },
      {
        id: 'daily-steps-100-percent',
        description: 'User completes daily step goal',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'steps-100-percent',
        progressValue: 25,
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        metadata: {
          currentSteps: 10000,
          goalSteps: 10000,
        },
      },
      {
        id: 'daily-steps-reward',
        description: 'System grants XP reward for completing the quest',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'health-daily-steps',
        profileId: 'test-profile-1',
        journey: 'health',
        timestamp: new Date(Date.now() - 59 * 60 * 1000), // 59 minutes ago
        metadata: {
          xpAwarded: 50,
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 25,
        completedSteps: ['steps-25-percent'],
        rewarded: false,
        metadata: {
          currentSteps: 2500,
          goalSteps: 10000,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 50,
        completedSteps: ['steps-25-percent', 'steps-50-percent'],
        rewarded: false,
        metadata: {
          currentSteps: 5000,
          goalSteps: 10000,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 75,
        completedSteps: ['steps-25-percent', 'steps-50-percent', 'steps-75-percent'],
        rewarded: false,
        metadata: {
          currentSteps: 7500,
          goalSteps: 10000,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['steps-25-percent', 'steps-50-percent', 'steps-75-percent', 'steps-100-percent'],
        rewarded: false,
        metadata: {
          currentSteps: 10000,
          goalSteps: 10000,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['steps-25-percent', 'steps-50-percent', 'steps-75-percent', 'steps-100-percent'],
        rewarded: true,
        metadata: {
          currentSteps: 10000,
          goalSteps: 10000,
          xpAwarded: 50,
        },
      },
    ],
    tags: ['health', 'daily', 'steps', 'complete-flow'],
  },
  
  // Connect Health Device - One-Time Quest Scenario
  {
    id: 'health-connect-device-completion',
    name: 'Connect Health Device Completion',
    description: 'User completes a one-time quest by connecting a health device',
    quest: getQuestFixtureById('health-connect-device') as TestQuest,
    profileId: 'test-profile-2',
    events: [
      {
        id: 'connect-device-accept',
        description: 'User accepts the connect device quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'health-connect-device',
        profileId: 'test-profile-2',
        journey: 'health',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'connect-device-complete',
        description: 'User connects a smartwatch device',
        type: QuestEventType.COMPLETE_QUEST,
        questId: 'health-connect-device',
        profileId: 'test-profile-2',
        journey: 'health',
        progressValue: 100,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          deviceType: 'smartwatch',
          deviceId: 'test-device-123',
          deviceName: 'Fitbit Sense',
        },
      },
      {
        id: 'connect-device-reward',
        description: 'System grants XP reward for connecting a device',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'health-connect-device',
        profileId: 'test-profile-2',
        journey: 'health',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        metadata: {
          xpAwarded: 100,
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        rewarded: false,
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        rewarded: false,
        metadata: {
          deviceType: 'smartwatch',
          deviceId: 'test-device-123',
          deviceName: 'Fitbit Sense',
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        rewarded: true,
        metadata: {
          deviceType: 'smartwatch',
          deviceId: 'test-device-123',
          deviceName: 'Fitbit Sense',
          xpAwarded: 100,
        },
      },
    ],
    tags: ['health', 'one-time', 'device', 'complete-flow'],
  },
  
  // Health Profile Completion - Abandoned Quest Scenario
  {
    id: 'health-profile-abandoned',
    name: 'Health Profile Abandoned',
    description: 'User starts completing health profile but abandons the quest before completion',
    quest: getQuestFixtureById('health-complete-profile') as TestQuest,
    profileId: 'test-profile-3',
    events: [
      {
        id: 'profile-accept',
        description: 'User accepts the complete health profile quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'health-complete-profile',
        profileId: 'test-profile-3',
        journey: 'health',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: 'profile-basic-info',
        description: 'User completes basic information section',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-complete-profile',
        profileId: 'test-profile-3',
        journey: 'health',
        stepId: 'profile-basic-info',
        progressValue: 20,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        id: 'profile-medical-history',
        description: 'User completes medical history section',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'health-complete-profile',
        profileId: 'test-profile-3',
        journey: 'health',
        stepId: 'profile-medical-history',
        progressValue: 20,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: 'profile-abandon',
        description: 'User abandons the health profile quest',
        type: QuestEventType.ABANDON_QUEST,
        questId: 'health-complete-profile',
        profileId: 'test-profile-3',
        journey: 'health',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 20,
        completedSteps: ['profile-basic-info'],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 40,
        completedSteps: ['profile-basic-info', 'profile-medical-history'],
        rewarded: false,
      },
      {
        status: QuestStatus.NOT_STARTED, // Reset to not started when abandoned
        progress: 0,
        completedSteps: [],
        rewarded: false,
        metadata: {
          abandonedAt: expect.any(Date),
          previousProgress: 40,
          previousCompletedSteps: ['profile-basic-info', 'profile-medical-history'],
        },
      },
    ],
    tags: ['health', 'one-time', 'profile', 'abandoned'],
  },
];

// ============================================================================
// Care Journey Quest Completion Scenarios
// ============================================================================

/**
 * Collection of care journey quest completion scenarios.
 */
export const careQuestCompletionScenarios: QuestCompletionScenario[] = [
  // Medication Adherence - Weekly Quest Scenario
  {
    id: 'care-medication-adherence-completion',
    name: 'Medication Adherence Completion',
    description: 'User completes a weekly medication adherence quest by taking medications for 7 consecutive days',
    quest: getQuestFixtureById('care-medication-adherence') as TestQuest,
    profileId: 'test-profile-1',
    events: [
      {
        id: 'medication-accept',
        description: 'User accepts the medication adherence quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      },
      // Day 1
      {
        id: 'medication-day-1',
        description: 'User takes all medications on day 1',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-1',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 1,
        },
      },
      // Day 2
      {
        id: 'medication-day-2',
        description: 'User takes all medications on day 2',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-2',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 2,
        },
      },
      // Day 3
      {
        id: 'medication-day-3',
        description: 'User takes all medications on day 3',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-3',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 3,
        },
      },
      // Day 4
      {
        id: 'medication-day-4',
        description: 'User takes all medications on day 4',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-4',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 4,
        },
      },
      // Day 5
      {
        id: 'medication-day-5',
        description: 'User takes all medications on day 5',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-5',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 5,
        },
      },
      // Day 6
      {
        id: 'medication-day-6',
        description: 'User takes all medications on day 6',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-6',
        progressValue: 14.29,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 6,
        },
      },
      // Day 7
      {
        id: 'medication-day-7',
        description: 'User takes all medications on day 7',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'medication-day-7',
        progressValue: 14.26,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          medicationsTaken: ['med-1', 'med-2'],
          scheduledMedications: ['med-1', 'med-2'],
          day: 7,
        },
      },
      // Reward
      {
        id: 'medication-reward',
        description: 'System grants XP reward for completing the quest',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'care-medication-adherence',
        profileId: 'test-profile-1',
        journey: 'care',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        metadata: {
          xpAwarded: 100,
          streak: 7,
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 14.29,
        completedSteps: ['medication-day-1'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 1,
          streak: 1,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 28.58,
        completedSteps: ['medication-day-1', 'medication-day-2'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 2,
          streak: 2,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 42.87,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 3,
          streak: 3,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 57.16,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3', 'medication-day-4'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 4,
          streak: 4,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 71.45,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3', 'medication-day-4', 'medication-day-5'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 5,
          streak: 5,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 85.74,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3', 'medication-day-4', 'medication-day-5', 'medication-day-6'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 6,
          streak: 6,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3', 'medication-day-4', 'medication-day-5', 'medication-day-6', 'medication-day-7'],
        rewarded: false,
        metadata: {
          lastCompletedDay: 7,
          streak: 7,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['medication-day-1', 'medication-day-2', 'medication-day-3', 'medication-day-4', 'medication-day-5', 'medication-day-6', 'medication-day-7'],
        rewarded: true,
        metadata: {
          lastCompletedDay: 7,
          streak: 7,
          xpAwarded: 100,
        },
      },
    ],
    tags: ['care', 'weekly', 'medication', 'complete-flow'],
  },
  
  // Telemedicine Session - Expired Quest Scenario
  {
    id: 'care-telemedicine-expired',
    name: 'Telemedicine Session Expired',
    description: 'User starts a telemedicine quest but it expires before completion',
    quest: getQuestFixtureById('care-telemedicine-session') as TestQuest,
    profileId: 'test-profile-2',
    events: [
      {
        id: 'telemedicine-accept',
        description: 'User accepts the telemedicine session quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'care-telemedicine-session',
        profileId: 'test-profile-2',
        journey: 'care',
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      },
      {
        id: 'telemedicine-schedule',
        description: 'User schedules a telemedicine appointment',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-telemedicine-session',
        profileId: 'test-profile-2',
        journey: 'care',
        stepId: 'telemedicine-schedule',
        progressValue: 25,
        timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        metadata: {
          appointmentId: 'appt-123',
          providerId: 'provider-456',
          scheduledTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
      },
      {
        id: 'telemedicine-checkin',
        description: 'User completes pre-appointment check-in',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'care-telemedicine-session',
        profileId: 'test-profile-2',
        journey: 'care',
        stepId: 'telemedicine-checkin',
        progressValue: 25,
        timestamp: new Date(Date.now() - 10.1 * 24 * 60 * 60 * 1000), // 10.1 days ago
        metadata: {
          appointmentId: 'appt-123',
          checkinTime: new Date(Date.now() - 10.1 * 24 * 60 * 60 * 1000), // 10.1 days ago
        },
      },
      {
        id: 'telemedicine-expired',
        description: 'Quest expires after user misses the appointment',
        type: QuestEventType.QUEST_EXPIRED,
        questId: 'care-telemedicine-session',
        profileId: 'test-profile-2',
        journey: 'care',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        metadata: {
          reason: 'MISSED_APPOINTMENT',
          appointmentId: 'appt-123',
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 25,
        completedSteps: ['telemedicine-schedule'],
        rewarded: false,
        metadata: {
          appointmentId: 'appt-123',
          providerId: 'provider-456',
          scheduledTime: expect.any(Date),
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 50,
        completedSteps: ['telemedicine-schedule', 'telemedicine-checkin'],
        rewarded: false,
        metadata: {
          appointmentId: 'appt-123',
          providerId: 'provider-456',
          scheduledTime: expect.any(Date),
          checkinTime: expect.any(Date),
        },
      },
      {
        status: QuestStatus.NOT_STARTED, // Reset to not started when expired
        progress: 0,
        completedSteps: [],
        rewarded: false,
        metadata: {
          expiredAt: expect.any(Date),
          reason: 'MISSED_APPOINTMENT',
          previousProgress: 50,
          previousCompletedSteps: ['telemedicine-schedule', 'telemedicine-checkin'],
          appointmentId: 'appt-123',
        },
      },
    ],
    tags: ['care', 'one-time', 'telemedicine', 'expired'],
  },
];

// ============================================================================
// Plan Journey Quest Completion Scenarios
// ============================================================================

/**
 * Collection of plan journey quest completion scenarios.
 */
export const planQuestCompletionScenarios: QuestCompletionScenario[] = [
  // Submit Claim - Sequential Steps Scenario
  {
    id: 'plan-submit-claim-completion',
    name: 'Submit Claim Completion',
    description: 'User completes a claim submission quest by following all required steps in sequence',
    quest: getQuestFixtureById('plan-submit-claim') as TestQuest,
    profileId: 'test-profile-1',
    events: [
      {
        id: 'claim-accept',
        description: 'User accepts the submit claim quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      {
        id: 'claim-info',
        description: 'User enters claim information',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        stepId: 'claim-info',
        progressValue: 25,
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        metadata: {
          claimType: 'medical',
          serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          providerId: 'provider-789',
          amount: 150.00,
        },
      },
      {
        id: 'claim-documents',
        description: 'User uploads supporting documents',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        stepId: 'claim-documents',
        progressValue: 25,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        metadata: {
          documentCount: 2,
          documentTypes: ['receipt', 'medical-report'],
        },
      },
      {
        id: 'claim-review',
        description: 'User reviews claim details',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        stepId: 'claim-review',
        progressValue: 25,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'claim-submit',
        description: 'User submits the claim',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        stepId: 'claim-submit',
        progressValue: 25,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          claimId: 'claim-456',
          submissionTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      },
      {
        id: 'claim-reward',
        description: 'System grants XP reward for submitting a claim',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'plan-submit-claim',
        profileId: 'test-profile-1',
        journey: 'plan',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        metadata: {
          xpAwarded: 75,
          claimId: 'claim-456',
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 25,
        completedSteps: ['claim-info'],
        rewarded: false,
        metadata: {
          claimType: 'medical',
          serviceDate: expect.any(Date),
          providerId: 'provider-789',
          amount: 150.00,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 50,
        completedSteps: ['claim-info', 'claim-documents'],
        rewarded: false,
        metadata: {
          claimType: 'medical',
          serviceDate: expect.any(Date),
          providerId: 'provider-789',
          amount: 150.00,
          documentCount: 2,
          documentTypes: ['receipt', 'medical-report'],
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 75,
        completedSteps: ['claim-info', 'claim-documents', 'claim-review'],
        rewarded: false,
        metadata: {
          claimType: 'medical',
          serviceDate: expect.any(Date),
          providerId: 'provider-789',
          amount: 150.00,
          documentCount: 2,
          documentTypes: ['receipt', 'medical-report'],
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['claim-info', 'claim-documents', 'claim-review', 'claim-submit'],
        rewarded: false,
        metadata: {
          claimType: 'medical',
          serviceDate: expect.any(Date),
          providerId: 'provider-789',
          amount: 150.00,
          documentCount: 2,
          documentTypes: ['receipt', 'medical-report'],
          claimId: 'claim-456',
          submissionTime: expect.any(Date),
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['claim-info', 'claim-documents', 'claim-review', 'claim-submit'],
        rewarded: true,
        metadata: {
          claimType: 'medical',
          serviceDate: expect.any(Date),
          providerId: 'provider-789',
          amount: 150.00,
          documentCount: 2,
          documentTypes: ['receipt', 'medical-report'],
          claimId: 'claim-456',
          submissionTime: expect.any(Date),
          xpAwarded: 75,
        },
      },
    ],
    tags: ['plan', 'monthly', 'claim', 'complete-flow', 'sequential'],
  },
  
  // Review Benefits - Incremental Progress Scenario
  {
    id: 'plan-review-benefits-completion',
    name: 'Review Benefits Completion',
    description: 'User completes a benefits review quest by exploring different benefit categories',
    quest: getQuestFixtureById('plan-review-benefits') as TestQuest,
    profileId: 'test-profile-3',
    events: [
      {
        id: 'benefits-accept',
        description: 'User accepts the review benefits quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
      {
        id: 'benefits-medical',
        description: 'User reviews medical benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        stepId: 'benefits-medical',
        progressValue: 20,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000), // 3 days ago + 1 hour
        metadata: {
          timeSpent: 45, // seconds
          benefitType: 'medical',
        },
      },
      {
        id: 'benefits-dental',
        description: 'User reviews dental benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        stepId: 'benefits-dental',
        progressValue: 20,
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 3 days ago + 2 hours
        metadata: {
          timeSpent: 35, // seconds
          benefitType: 'dental',
        },
      },
      {
        id: 'benefits-vision',
        description: 'User reviews vision benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        stepId: 'benefits-vision',
        progressValue: 20,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        metadata: {
          timeSpent: 40, // seconds
          benefitType: 'vision',
        },
      },
      {
        id: 'benefits-pharmacy',
        description: 'User reviews pharmacy benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        stepId: 'benefits-pharmacy',
        progressValue: 20,
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          timeSpent: 50, // seconds
          benefitType: 'pharmacy',
        },
      },
      {
        id: 'benefits-additional',
        description: 'User reviews additional benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        stepId: 'benefits-additional',
        progressValue: 20,
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        metadata: {
          timeSpent: 60, // seconds
          benefitType: 'additional',
        },
      },
      {
        id: 'benefits-reward',
        description: 'System grants XP reward for reviewing all benefits',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'plan-review-benefits',
        profileId: 'test-profile-3',
        journey: 'plan',
        timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000), // 11 hours ago
        metadata: {
          xpAwarded: 50,
          totalTimeSpent: 230, // seconds
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 20,
        completedSteps: ['benefits-medical'],
        rewarded: false,
        metadata: {
          benefitsReviewed: ['medical'],
          timeSpent: 45,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 40,
        completedSteps: ['benefits-medical', 'benefits-dental'],
        rewarded: false,
        metadata: {
          benefitsReviewed: ['medical', 'dental'],
          timeSpent: 80,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 60,
        completedSteps: ['benefits-medical', 'benefits-dental', 'benefits-vision'],
        rewarded: false,
        metadata: {
          benefitsReviewed: ['medical', 'dental', 'vision'],
          timeSpent: 120,
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 80,
        completedSteps: ['benefits-medical', 'benefits-dental', 'benefits-vision', 'benefits-pharmacy'],
        rewarded: false,
        metadata: {
          benefitsReviewed: ['medical', 'dental', 'vision', 'pharmacy'],
          timeSpent: 170,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['benefits-medical', 'benefits-dental', 'benefits-vision', 'benefits-pharmacy', 'benefits-additional'],
        rewarded: false,
        metadata: {
          benefitsReviewed: ['medical', 'dental', 'vision', 'pharmacy', 'additional'],
          timeSpent: 230,
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['benefits-medical', 'benefits-dental', 'benefits-vision', 'benefits-pharmacy', 'benefits-additional'],
        rewarded: true,
        metadata: {
          benefitsReviewed: ['medical', 'dental', 'vision', 'pharmacy', 'additional'],
          timeSpent: 230,
          xpAwarded: 50,
          totalTimeSpent: 230,
        },
      },
    ],
    tags: ['plan', 'one-time', 'benefits', 'complete-flow', 'incremental'],
  },
];

// ============================================================================
// Cross-Journey Quest Completion Scenarios
// ============================================================================

/**
 * Collection of cross-journey quest completion scenarios.
 */
export const crossJourneyQuestCompletionScenarios: QuestCompletionScenario[] = [
  // Wellness Champion - Cross-Journey Scenario
  {
    id: 'cross-wellness-champion-completion',
    name: 'Wellness Champion Completion',
    description: 'User completes a cross-journey quest by performing actions across health, care, and plan journeys',
    quest: getQuestFixtureById('cross-wellness-champion') as TestQuest,
    profileId: 'test-profile-1',
    events: [
      {
        id: 'wellness-accept',
        description: 'User accepts the wellness champion quest',
        type: QuestEventType.ACCEPT_QUEST,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'health', // Primary journey
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      },
      {
        id: 'wellness-health-metrics',
        description: 'User records health metrics for 3 consecutive days',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'wellness-health-metrics',
        progressValue: 20,
        timestamp: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
        metadata: {
          metricsRecorded: ['heart-rate', 'steps', 'weight'],
          daysCompleted: 3,
          journeyContext: 'health',
        },
      },
      {
        id: 'wellness-activity',
        description: 'User completes a physical activity session',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'health',
        stepId: 'wellness-activity',
        progressValue: 20,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        metadata: {
          activityType: 'walking',
          duration: 45, // minutes
          caloriesBurned: 250,
          journeyContext: 'health',
        },
      },
      {
        id: 'wellness-appointment',
        description: 'User schedules a preventive care appointment',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'wellness-appointment',
        progressValue: 20,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        metadata: {
          appointmentType: 'preventive',
          providerId: 'provider-123',
          scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days in the future
          journeyContext: 'care',
        },
      },
      {
        id: 'wellness-assessment',
        description: 'User completes a health risk assessment',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'care',
        stepId: 'wellness-assessment',
        progressValue: 20,
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        metadata: {
          assessmentType: 'health-risk',
          completionTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          riskScore: 'low',
          journeyContext: 'care',
        },
      },
      {
        id: 'wellness-benefits',
        description: 'User reviews wellness program benefits',
        type: QuestEventType.COMPLETE_STEP,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'plan',
        stepId: 'wellness-benefits',
        progressValue: 20,
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        metadata: {
          benefitType: 'wellness',
          timeSpent: 120, // seconds
          journeyContext: 'plan',
        },
      },
      {
        id: 'wellness-reward',
        description: 'System grants XP reward for completing the cross-journey quest',
        type: QuestEventType.REWARD_GRANTED,
        questId: 'cross-wellness-champion',
        profileId: 'test-profile-1',
        journey: 'health', // Primary journey
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        metadata: {
          xpAwarded: 300,
          journeysCompleted: ['health', 'care', 'plan'],
        },
      },
    ],
    expectedStates: [
      {
        status: QuestStatus.NOT_STARTED,
        progress: 0,
        completedSteps: [],
        rewarded: false,
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 20,
        completedSteps: ['wellness-health-metrics'],
        rewarded: false,
        metadata: {
          journeyProgress: {
            health: 20,
            care: 0,
            plan: 0,
          },
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 40,
        completedSteps: ['wellness-health-metrics', 'wellness-activity'],
        rewarded: false,
        metadata: {
          journeyProgress: {
            health: 40,
            care: 0,
            plan: 0,
          },
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 60,
        completedSteps: ['wellness-health-metrics', 'wellness-activity', 'wellness-appointment'],
        rewarded: false,
        metadata: {
          journeyProgress: {
            health: 40,
            care: 20,
            plan: 0,
          },
        },
      },
      {
        status: QuestStatus.IN_PROGRESS,
        progress: 80,
        completedSteps: ['wellness-health-metrics', 'wellness-activity', 'wellness-appointment', 'wellness-assessment'],
        rewarded: false,
        metadata: {
          journeyProgress: {
            health: 40,
            care: 40,
            plan: 0,
          },
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['wellness-health-metrics', 'wellness-activity', 'wellness-appointment', 'wellness-assessment', 'wellness-benefits'],
        rewarded: false,
        metadata: {
          journeyProgress: {
            health: 40,
            care: 40,
            plan: 20,
          },
        },
      },
      {
        status: QuestStatus.COMPLETED,
        progress: 100,
        completedSteps: ['wellness-health-metrics', 'wellness-activity', 'wellness-appointment', 'wellness-assessment', 'wellness-benefits'],
        rewarded: true,
        metadata: {
          journeyProgress: {
            health: 40,
            care: 40,
            plan: 20,
          },
          xpAwarded: 300,
          journeysCompleted: ['health', 'care', 'plan'],
        },
      },
    ],
    tags: ['cross-journey', 'special', 'wellness', 'complete-flow'],
  },
];

// ============================================================================
// Combined Scenario Collections
// ============================================================================

/**
 * All quest completion scenarios combined for easy access.
 */
export const allQuestCompletionScenarios: QuestCompletionScenario[] = [
  ...healthQuestCompletionScenarios,
  ...careQuestCompletionScenarios,
  ...planQuestCompletionScenarios,
  ...crossJourneyQuestCompletionScenarios,
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper function to get a quest completion scenario by ID.
 * 
 * @param scenarioId The ID of the scenario to retrieve
 * @returns The quest completion scenario with the specified ID, or undefined if not found
 */
export function getQuestCompletionScenarioById(scenarioId: string): QuestCompletionScenario | undefined {
  return allQuestCompletionScenarios.find(scenario => scenario.id === scenarioId);
}

/**
 * Helper function to get quest completion scenarios by journey.
 * 
 * @param journey The journey to retrieve scenarios for
 * @returns An array of quest completion scenarios for the specified journey
 */
export function getQuestCompletionScenariosByJourney(journey: string): QuestCompletionScenario[] {
  return allQuestCompletionScenarios.filter(scenario => scenario.quest.journey === journey);
}

/**
 * Helper function to get quest completion scenarios by tag.
 * 
 * @param tag The tag to filter scenarios by
 * @returns An array of quest completion scenarios with the specified tag
 */
export function getQuestCompletionScenariosByTag(tag: string): QuestCompletionScenario[] {
  return allQuestCompletionScenarios.filter(scenario => scenario.tags?.includes(tag));
}

/**
 * Helper function to get quest completion scenarios by quest type.
 * 
 * @param questType The type of quests to retrieve scenarios for
 * @returns An array of quest completion scenarios for the specified quest type
 */
export function getQuestCompletionScenariosByQuestType(questType: QuestType): QuestCompletionScenario[] {
  return allQuestCompletionScenarios.filter(scenario => scenario.quest.type === questType);
}

/**
 * Helper function to get quest completion scenarios by event type.
 * 
 * @param eventType The type of event to filter scenarios by
 * @returns An array of quest completion scenarios that include the specified event type
 */
export function getQuestCompletionScenariosByEventType(eventType: QuestEventType): QuestCompletionScenario[] {
  return allQuestCompletionScenarios.filter(scenario => 
    scenario.events.some(event => event.type === eventType)
  );
}

/**
 * Helper function to create a new quest scenario event with default values.
 * 
 * @param type The type of event
 * @param questId The ID of the quest
 * @param profileId The ID of the user profile
 * @param journey The journey associated with the event
 * @returns A new quest scenario event with default values
 */
export function createQuestScenarioEvent(
  type: QuestEventType,
  questId: string,
  profileId: string,
  journey: string
): QuestScenarioEvent {
  return {
    id: `${questId}-${type.toLowerCase()}-${Date.now()}`,
    description: `Auto-generated ${type} event for quest ${questId}`,
    type,
    questId,
    profileId,
    journey,
    timestamp: new Date(),
  };
}

/**
 * Helper function to create a new quest expected state with default values.
 * 
 * @param status The expected quest status
 * @param progress The expected progress value
 * @returns A new quest expected state with default values
 */
export function createQuestExpectedState(
  status: QuestStatus,
  progress: number
): QuestExpectedState {
  return {
    status,
    progress,
    completedSteps: [],
    rewarded: false,
  };
}

/**
 * Helper function to create a basic quest completion scenario template.
 * 
 * @param quest The quest to create a scenario for
 * @param profileId The ID of the user profile
 * @returns A basic quest completion scenario template
 */
export function createQuestCompletionScenarioTemplate(
  quest: TestQuest,
  profileId: string
): QuestCompletionScenario {
  const scenarioId = `${quest.id}-scenario-${Date.now()}`;
  
  return {
    id: scenarioId,
    name: `${quest.title} Scenario`,
    description: `Test scenario for ${quest.title} quest`,
    quest,
    profileId,
    events: [
      createQuestScenarioEvent(QuestEventType.ACCEPT_QUEST, quest.id, profileId, quest.journey),
    ],
    expectedStates: [
      createQuestExpectedState(QuestStatus.NOT_STARTED, 0),
    ],
    tags: [quest.journey, quest.type.toLowerCase()],
  };
}