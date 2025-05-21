/**
 * Represents all possible states of an achievement for a specific user.
 * 
 * This enum is used throughout the achievement tracking system to determine:
 * - Achievement visibility in the UI
 * - Progress display and visualization
 * - Reward distribution eligibility
 * - Filtering and sorting in achievement lists
 */
export enum AchievementStatus {
  /**
   * The achievement is locked and not yet visible to the user.
   * 
   * Characteristics:
   * - Not displayed in the main achievements list
   * - May appear as "secret achievement" placeholders
   * - No progress tracking available
   */
  LOCKED = 'LOCKED',

  /**
   * The achievement is visible but the user hasn't started progress towards it.
   * 
   * Characteristics:
   * - Displayed in the achievements list with 0% progress
   * - Shows full achievement details and requirements
   * - Available for user to actively pursue
   */
  VISIBLE = 'VISIBLE',

  /**
   * The user has started making progress towards the achievement.
   * 
   * Characteristics:
   * - Displays current progress percentage
   * - Shows in "In Progress" achievement filters
   * - May display estimated completion based on current progress rate
   */
  IN_PROGRESS = 'IN_PROGRESS',

  /**
   * The achievement has been completed but rewards haven't been claimed.
   * 
   * Characteristics:
   * - Shows as 100% complete
   * - Appears in notification center
   * - Requires user action to claim rewards
   */
  COMPLETED = 'COMPLETED',

  /**
   * The achievement has been completed and rewards have been claimed.
   * 
   * Characteristics:
   * - Displays in "Unlocked" achievement filters
   * - Shows completion date
   * - Contributes to user's total achievement count
   */
  UNLOCKED = 'UNLOCKED',

  /**
   * The achievement was previously available but is no longer obtainable.
   * 
   * Characteristics:
   * - Shown with "Legacy" or "Retired" badge
   * - Only displayed if user had made progress or unlocked it
   * - Cannot be progressed further
   */
  LEGACY = 'LEGACY'
}

/**
 * Type guard to check if a string is a valid AchievementStatus.
 * 
 * @param status - The string to check
 * @returns True if the string is a valid AchievementStatus
 */
export function isAchievementStatus(status: string): status is AchievementStatus {
  return Object.values(AchievementStatus).includes(status as AchievementStatus);
}

/**
 * Interface for achievement status metadata used for UI display and filtering.
 * 
 * This provides additional information about each status that can be used
 * for consistent UI rendering and behavior across the application.
 */
export interface AchievementStatusMetadata {
  /** The display name shown to users */
  displayName: string;
  
  /** CSS class name to apply for styling */
  className: string;
  
  /** Whether progress can be updated for achievements with this status */
  canProgress: boolean;
  
  /** Whether rewards can be claimed for achievements with this status */
  canClaimRewards: boolean;
  
  /** Whether the achievement should be shown in the main achievements list */
  visibleInList: boolean;
  
  /** Priority order for sorting (lower numbers appear first) */
  sortOrder: number;
}

/**
 * Metadata for each achievement status, providing consistent UI display properties.
 */
export const ACHIEVEMENT_STATUS_METADATA: Record<AchievementStatus, AchievementStatusMetadata> = {
  [AchievementStatus.LOCKED]: {
    displayName: 'Locked',
    className: 'achievement-locked',
    canProgress: false,
    canClaimRewards: false,
    visibleInList: false,
    sortOrder: 50
  },
  [AchievementStatus.VISIBLE]: {
    displayName: 'Available',
    className: 'achievement-visible',
    canProgress: true,
    canClaimRewards: false,
    visibleInList: true,
    sortOrder: 20
  },
  [AchievementStatus.IN_PROGRESS]: {
    displayName: 'In Progress',
    className: 'achievement-in-progress',
    canProgress: true,
    canClaimRewards: false,
    visibleInList: true,
    sortOrder: 10
  },
  [AchievementStatus.COMPLETED]: {
    displayName: 'Completed',
    className: 'achievement-completed',
    canProgress: false,
    canClaimRewards: true,
    visibleInList: true,
    sortOrder: 5
  },
  [AchievementStatus.UNLOCKED]: {
    displayName: 'Unlocked',
    className: 'achievement-unlocked',
    canProgress: false,
    canClaimRewards: false,
    visibleInList: true,
    sortOrder: 30
  },
  [AchievementStatus.LEGACY]: {
    displayName: 'Legacy',
    className: 'achievement-legacy',
    canProgress: false,
    canClaimRewards: false,
    visibleInList: true,
    sortOrder: 40
  }
};