/**
 * Defines the possible status values for a user's achievement.
 * This enum represents all states an achievement can be in for a specific user.
 * 
 * Part of the gamification engine's achievement tracking system, this enum
 * is used to determine achievement visibility, progress display, and reward distribution.
 * 
 * @enum {string}
 */
export enum AchievementStatus {
  /**
   * The achievement is locked and not yet visible to the user.
   * This is typically used for achievements that are part of a sequence
   * or have prerequisites that haven't been met.
   */
  LOCKED = 'locked',

  /**
   * The achievement is visible to the user but has not been started.
   * This status indicates that the achievement is available for the user to pursue.
   */
  AVAILABLE = 'available',

  /**
   * The user has started progress toward the achievement but has not completed it.
   * This status is used for achievements that track incremental progress.
   */
  IN_PROGRESS = 'in_progress',

  /**
   * The achievement has been completed but the reward has not been claimed.
   * This status is used to indicate achievements ready for reward distribution.
   */
  COMPLETED = 'completed',

  /**
   * The achievement has been fully unlocked and the reward has been claimed.
   * This is the final state for an achievement.
   */
  UNLOCKED = 'unlocked',
  
  /**
   * The achievement was previously available but is no longer obtainable.
   * This is typically used for limited-time or seasonal achievements after their availability period.
   */
  EXPIRED = 'expired'
}

/**
 * Type representing the string literal values of the AchievementStatus enum.
 * This type can be used for type-safe handling of achievement status values.
 * 
 * @example
 * // Type-safe function parameter
 * function updateAchievementStatus(status: AchievementStatusValue) { ... }
 */
export type AchievementStatusValue = `${AchievementStatus}`;

/**
 * Interface for achievement status filtering options.
 * Used when querying user achievements to filter by status.
 */
export interface AchievementStatusFilter {
  /** The status or statuses to filter by */
  status: AchievementStatusValue | AchievementStatusValue[];
  /** Whether to include expired achievements */
  includeExpired?: boolean;
  /** Whether to filter by journey */
  journeyId?: string;
}

/**
 * Metadata for achievement statuses, providing additional information for UI display and filtering.
 * This constant provides display-friendly information for each achievement status.
 */
export const ACHIEVEMENT_STATUS_METADATA: Record<AchievementStatus, {
  displayName: string;
  description: string;
  icon: string;
  color: string;
  showProgress: boolean;
  filterPriority: number;
  visibleInFilters: boolean;
}> = {
  [AchievementStatus.LOCKED]: {
    displayName: 'Locked',
    description: 'This achievement is not yet available',
    icon: 'lock',
    color: 'gray.500',
    showProgress: false,
    filterPriority: 5,
    visibleInFilters: false
  },
  [AchievementStatus.AVAILABLE]: {
    displayName: 'Available',
    description: 'This achievement is available to pursue',
    icon: 'unlock',
    color: 'gray.700',
    showProgress: true,
    filterPriority: 1,
    visibleInFilters: true
  },
  [AchievementStatus.IN_PROGRESS]: {
    displayName: 'In Progress',
    description: 'You are working toward this achievement',
    icon: 'progress-circle',
    color: 'blue.500',
    showProgress: true,
    filterPriority: 2,
    visibleInFilters: true
  },
  [AchievementStatus.COMPLETED]: {
    displayName: 'Completed',
    description: 'Achievement completed, claim your reward',
    icon: 'check-circle',
    color: 'green.500',
    showProgress: true,
    filterPriority: 3,
    visibleInFilters: true
  },
  [AchievementStatus.UNLOCKED]: {
    displayName: 'Unlocked',
    description: 'You have unlocked this achievement',
    icon: 'trophy',
    color: 'gold.500',
    showProgress: true,
    filterPriority: 4,
    visibleInFilters: true
  },
  [AchievementStatus.EXPIRED]: {
    displayName: 'Expired',
    description: 'This achievement is no longer available',
    icon: 'clock',
    color: 'gray.400',
    showProgress: false,
    filterPriority: 6,
    visibleInFilters: false
  }
};

/**
 * Utility functions for working with achievement statuses.
 */
export const AchievementStatusUtils = {
  /**
   * Gets all visible achievement statuses that should be displayed in filters.
   * 
   * @returns An array of achievement statuses that are visible in filters
   */
  getVisibleStatuses(): AchievementStatus[] {
    return Object.entries(ACHIEVEMENT_STATUS_METADATA)
      .filter(([_, metadata]) => metadata.visibleInFilters)
      .map(([status]) => status as AchievementStatus);
  },

  /**
   * Gets the display name for an achievement status.
   * 
   * @param status - The achievement status
   * @returns The display-friendly name for the achievement status
   */
  getDisplayName(status: AchievementStatusValue): string {
    return ACHIEVEMENT_STATUS_METADATA[status as AchievementStatus].displayName;
  },

  /**
   * Checks if an achievement status should show progress indicators.
   * 
   * @param status - The achievement status to check
   * @returns True if the achievement status should display progress
   */
  shouldShowProgress(status: AchievementStatusValue): boolean {
    return ACHIEVEMENT_STATUS_METADATA[status as AchievementStatus].showProgress;
  },

  /**
   * Gets achievement statuses sorted by their filter priority.
   * 
   * @returns An array of achievement statuses sorted by priority
   */
  getSortedStatuses(): AchievementStatus[] {
    return Object.entries(ACHIEVEMENT_STATUS_METADATA)
      .sort((a, b) => a[1].filterPriority - b[1].filterPriority)
      .map(([status]) => status as AchievementStatus);
  },
  
  /**
   * Determines if the status represents an active achievement (available, in progress, or completed).
   * 
   * @param status - The achievement status to check
   * @returns True if the achievement is in an active state
   */
  isActive(status: AchievementStatusValue): boolean {
    return [
      AchievementStatus.AVAILABLE,
      AchievementStatus.IN_PROGRESS,
      AchievementStatus.COMPLETED
    ].includes(status as AchievementStatus);
  },
  
  /**
   * Determines if the status represents a completed achievement (completed or unlocked).
   * 
   * @param status - The achievement status to check
   * @returns True if the achievement is in a completed state
   */
  isCompleted(status: AchievementStatusValue): boolean {
    return [
      AchievementStatus.COMPLETED,
      AchievementStatus.UNLOCKED
    ].includes(status as AchievementStatus);
  },
  
  /**
   * Gets the appropriate color for displaying an achievement based on its status.
   * 
   * @param status - The achievement status
   * @returns The color code for the achievement status
   */
  getStatusColor(status: AchievementStatusValue): string {
    return ACHIEVEMENT_STATUS_METADATA[status as AchievementStatus].color;
  },
  
  /**
   * Gets the appropriate icon for displaying an achievement based on its status.
   * 
   * @param status - The achievement status
   * @returns The icon name for the achievement status
   */
  getStatusIcon(status: AchievementStatusValue): string {
    return ACHIEVEMENT_STATUS_METADATA[status as AchievementStatus].icon;
  }
};