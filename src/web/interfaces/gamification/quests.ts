/**
 * @file Defines TypeScript interfaces for quests in the gamification system.
 * These interfaces standardize the representation of time-limited challenges
 * that users can complete to earn rewards.
 */

/**
 * Categories for organizing quests by type or theme.
 * Used for filtering and displaying quests in the UI.
 */
export enum QuestCategory {
  /** Daily challenges that reset every 24 hours */
  DAILY = 'daily',
  /** Weekly challenges that reset every 7 days */
  WEEKLY = 'weekly',
  /** Health journey specific quests */
  HEALTH = 'health',
  /** Care journey specific quests */
  CARE = 'care',
  /** Plan journey specific quests */
  PLAN = 'plan',
  /** Special event or seasonal quests */
  EVENT = 'event',
  /** Onboarding or tutorial quests */
  ONBOARDING = 'onboarding',
}

/**
 * Status of a quest indicating its current state in the lifecycle.
 * Used to track progress and determine UI presentation.
 */
export enum QuestStatus {
  /** Quest is available and in progress */
  ACTIVE = 'active',
  /** Quest has been successfully completed */
  COMPLETED = 'completed',
  /** Quest has expired without completion */
  EXPIRED = 'expired',
  /** Quest is locked and not yet available */
  LOCKED = 'locked',
}

/**
 * Defines the structure for a quest in the gamification system.
 * Quests are time-limited challenges that users can complete to
 * earn rewards and progress in the system.
 */
export interface Quest {
  /** Unique identifier for the quest */
  id: string;
  /** Display title of the quest */
  title: string;
  /** Detailed description of what the quest involves */
  description: string;
  /** Which journey this quest belongs to (health, care, plan) */
  journey: string;
  /** Icon identifier for visual representation */
  icon: string;
  /** Current progress toward completing the quest */
  progress: number;
  /** Total progress needed to complete the quest */
  total: number;
  /** Category of the quest for organization and filtering */
  category: QuestCategory;
  /** Current status of the quest */
  status: QuestStatus;
  /** Deadline by which the quest must be completed */
  deadline: Date;
  /** Experience points awarded upon completion */
  xpReward: number;
  /** Optional additional rewards (items, badges, etc.) */
  rewards?: string[];
}

/**
 * Specialized quest that resets daily.
 * These quests typically have simpler objectives and smaller rewards.
 */
export interface DailyQuest extends Quest {
  /** Daily quests always have the DAILY category */
  category: QuestCategory.DAILY;
  /** Daily quests reset at midnight local time */
  resetsAt: Date;
}

/**
 * Specialized quest that resets weekly.
 * These quests typically have more complex objectives and larger rewards.
 */
export interface WeeklyQuest extends Quest {
  /** Weekly quests always have the WEEKLY category */
  category: QuestCategory.WEEKLY;
  /** Weekly quests reset at the beginning of the week */
  resetsAt: Date;
  /** Weekly quests may have multiple stages or steps */
  steps?: Array<{
    /** Description of this step */
    description: string;
    /** Whether this step has been completed */
    completed: boolean;
  }>;
}

/**
 * Defines the structure for quest progress updates.
 * Used when incrementing progress toward quest completion.
 */
export interface QuestProgressUpdate {
  /** ID of the quest being updated */
  questId: string;
  /** Amount of progress to add */
  progressIncrement: number;
  /** Timestamp of the progress update */
  timestamp: Date;
  /** User ID associated with this progress update */
  userId: string;
}

/**
 * Defines the structure for quest completion events.
 * Triggered when a quest reaches 100% completion.
 */
export interface QuestCompletionEvent {
  /** ID of the completed quest */
  questId: string;
  /** ID of the user who completed the quest */
  userId: string;
  /** Timestamp when the quest was completed */
  completedAt: Date;
  /** XP awarded for completion */
  xpAwarded: number;
  /** Any additional rewards granted */
  additionalRewards?: string[];
}