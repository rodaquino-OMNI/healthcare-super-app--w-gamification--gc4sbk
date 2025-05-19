/**
 * @file Defines TypeScript interfaces for quests in the gamification system.
 * @module interfaces/gamification/quests
 */

/**
 * Enum representing different categories of quests in the gamification system.
 * Used for organization, filtering, and display purposes.
 */
export enum QuestCategory {
  /** Health-related quests focused on physical wellbeing */
  HEALTH = 'health',
  /** Care-related quests focused on medical appointments and treatments */
  CARE = 'care',
  /** Plan-related quests focused on insurance benefits and claims */
  PLAN = 'plan',
  /** General quests that span multiple journeys */
  GENERAL = 'general',
  /** Special event quests that are available for limited time periods */
  EVENT = 'event',
}

/**
 * Enum representing the possible states of a quest.
 * Used to track the progress and availability of quests.
 */
export enum QuestStatus {
  /** Quest is currently active and can be completed */
  ACTIVE = 'active',
  /** Quest has been successfully completed by the user */
  COMPLETED = 'completed',
  /** Quest has expired and can no longer be completed */
  EXPIRED = 'expired',
  /** Quest is locked and requires prerequisites to be unlocked */
  LOCKED = 'locked',
}

/**
 * Defines the base structure for a quest in the gamification system.
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
  /** Category of the quest for organization and filtering */
  category: QuestCategory;
  /** Icon identifier for visual representation */
  icon: string;
  /** Current progress toward completing the quest */
  progress: number;
  /** Total progress needed to complete the quest */
  total: number;
  /** Current status of the quest (active, completed, expired, locked) */
  status: QuestStatus;
  /** Deadline by which the quest must be completed */
  deadline: Date;
  /** Experience points awarded upon completion */
  xpReward: number;
  /** Optional additional rewards (items, badges, etc.) */
  rewards?: string[];
  /** Optional prerequisites that must be completed before this quest becomes available */
  prerequisites?: string[];
}

/**
 * Defines a daily quest that resets every 24 hours.
 * Daily quests typically involve simple tasks that encourage daily engagement.
 */
export interface DailyQuest extends Quest {
  /** The specific day this quest is available for */
  availableDate: Date;
  /** Whether the quest automatically resets at midnight */
  autoReset: boolean;
}

/**
 * Defines a weekly quest that spans multiple days.
 * Weekly quests typically involve more complex tasks that require sustained effort.
 */
export interface WeeklyQuest extends Quest {
  /** The start date of the week this quest is available for */
  weekStartDate: Date;
  /** The end date of the week this quest is available for */
  weekEndDate: Date;
  /** Daily progress tracking for each day of the week */
  dailyProgress?: Record<string, number>;
}

/**
 * Defines a special event quest tied to limited-time events.
 * Event quests are only available during specific promotional periods or special occasions.
 */
export interface EventQuest extends Quest {
  /** The name of the event this quest is associated with */
  eventName: string;
  /** The start date of the event */
  eventStartDate: Date;
  /** The end date of the event */
  eventEndDate: Date;
  /** Whether the quest is featured/highlighted in the UI */
  featured: boolean;
}

/**
 * Defines a quest step, which is a sub-task within a multi-step quest.
 * Complex quests may be broken down into multiple steps that must be completed in sequence.
 */
export interface QuestStep {
  /** Unique identifier for the quest step */
  id: string;
  /** Display title of the step */
  title: string;
  /** Detailed description of what the step involves */
  description: string;
  /** Current status of the step */
  status: QuestStatus;
  /** Order of this step in the sequence */
  order: number;
  /** Whether this step is optional for quest completion */
  optional: boolean;
}

/**
 * Defines a multi-step quest that consists of multiple sequential steps.
 * Multi-step quests provide a more structured and guided experience.
 */
export interface MultiStepQuest extends Quest {
  /** The steps that make up this quest */
  steps: QuestStep[];
  /** Whether steps must be completed in order */
  strictOrder: boolean;
}