/**
 * Defines the types of achievements available in the gamification system.
 * This enum is used to categorize achievements for filtering, display, and processing.
 * 
 * Part of the gamification engine's achievement categorization system, this enum
 * enables proper organization of achievements across the three main journeys
 * (Health, Care, and Plan) as well as special categories.
 * 
 * @enum {string}
 */
export enum AchievementType {
  /**
   * Journey-specific achievements that are tied to a single journey (Health, Care, or Plan).
   * These achievements are earned through activities within a specific journey context.
   * 
   * Example: Completing a health goal in the Health journey.
   */
  JOURNEY = 'journey',

  /**
   * Achievements that span multiple journeys and require activities across different
   * parts of the application. These achievements promote holistic engagement.
   * 
   * Example: Completing actions in both Health and Care journeys in the same week.
   */
  CROSS_JOURNEY = 'cross_journey',

  /**
   * Special or limited-time achievements that are typically tied to events,
   * campaigns, or seasonal promotions. These may have expiration dates.
   * 
   * Example: Holiday-themed achievements or launch celebration achievements.
   */
  SPECIAL = 'special',
  
  /**
   * Achievements that are part of a progressive series, where each tier
   * builds upon the previous one. These typically have multiple levels.
   * 
   * Example: Bronze, Silver, Gold tiers for completing an increasing number of actions.
   */
  TIERED = 'tiered',
  
  /**
   * Hidden achievements that are not visible to users until they are unlocked.
   * These create an element of surprise and discovery.
   * 
   * Example: Achievements unlocked by finding hidden features or completing unexpected actions.
   */
  HIDDEN = 'hidden'
}

/**
 * Type representing the string literal values of the AchievementType enum.
 * This type can be used for type-safe handling of achievement type values.
 * 
 * @example
 * // Type-safe function parameter
 * function processAchievement(type: AchievementTypeValue) { ... }
 */
export type AchievementTypeValue = `${AchievementType}`;

/**
 * Interface for achievement type filtering options.
 * Used when querying achievements to filter by type.
 */
export interface AchievementTypeFilter {
  /** The type of achievement to filter by */
  type: AchievementTypeValue | AchievementTypeValue[];
  /** Whether to include hidden achievements */
  includeHidden?: boolean;
  /** Whether to filter by journey */
  journeyId?: string;
}

/**
 * Metadata for achievement types, providing additional information for UI display and filtering.
 * This constant provides display-friendly information for each achievement type.
 */
export const ACHIEVEMENT_TYPE_METADATA: Record<AchievementType, {
  displayName: string;
  description: string;
  icon: string;
  filterPriority: number;
  visibleInFilters: boolean;
}> = {
  [AchievementType.JOURNEY]: {
    displayName: 'Journey Achievement',
    description: 'Achievements specific to a single journey',
    icon: 'journey-badge',
    filterPriority: 1,
    visibleInFilters: true
  },
  [AchievementType.CROSS_JOURNEY]: {
    displayName: 'Cross-Journey Achievement',
    description: 'Achievements spanning multiple journeys',
    icon: 'connected-journeys',
    filterPriority: 2,
    visibleInFilters: true
  },
  [AchievementType.SPECIAL]: {
    displayName: 'Special Achievement',
    description: 'Limited-time or event-based achievements',
    icon: 'special-star',
    filterPriority: 3,
    visibleInFilters: true
  },
  [AchievementType.TIERED]: {
    displayName: 'Tiered Achievement',
    description: 'Progressive achievements with multiple levels',
    icon: 'tiered-trophy',
    filterPriority: 4,
    visibleInFilters: true
  },
  [AchievementType.HIDDEN]: {
    displayName: 'Hidden Achievement',
    description: 'Secret achievements revealed upon completion',
    icon: 'hidden-mystery',
    filterPriority: 5,
    visibleInFilters: false
  }
};

/**
 * Utility functions for working with achievement types.
 */
export const AchievementTypeUtils = {
  /**
   * Gets all visible achievement types that should be displayed in filters.
   * 
   * @returns An array of achievement types that are visible in filters
   */
  getVisibleTypes(): AchievementType[] {
    return Object.entries(ACHIEVEMENT_TYPE_METADATA)
      .filter(([_, metadata]) => metadata.visibleInFilters)
      .map(([type]) => type as AchievementType);
  },

  /**
   * Gets the display name for an achievement type.
   * 
   * @param type - The achievement type
   * @returns The display-friendly name for the achievement type
   */
  getDisplayName(type: AchievementTypeValue): string {
    return ACHIEVEMENT_TYPE_METADATA[type as AchievementType].displayName;
  },

  /**
   * Checks if an achievement type is journey-specific.
   * 
   * @param type - The achievement type to check
   * @returns True if the achievement type is journey-specific
   */
  isJourneySpecific(type: AchievementTypeValue): boolean {
    return type === AchievementType.JOURNEY;
  },

  /**
   * Gets achievement types sorted by their filter priority.
   * 
   * @returns An array of achievement types sorted by priority
   */
  getSortedTypes(): AchievementType[] {
    return Object.entries(ACHIEVEMENT_TYPE_METADATA)
      .sort((a, b) => a[1].filterPriority - b[1].filterPriority)
      .map(([type]) => type as AchievementType);
  }
};