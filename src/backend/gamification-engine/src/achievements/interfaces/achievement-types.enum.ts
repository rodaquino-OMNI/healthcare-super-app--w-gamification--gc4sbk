/**
 * Enum representing the different types of achievements in the gamification system.
 * 
 * This enum categorizes achievements based on their scope and purpose,
 * enabling proper filtering, categorization, and display throughout the application.
 * 
 * @remarks
 * The achievement type determines how achievements are organized and displayed
 * in the UI, as well as how they are processed by the gamification engine.
 */
export enum AchievementType {
  /**
   * Achievements specific to a single journey (Health, Care, or Plan).
   * 
   * These achievements are earned through actions within a specific journey
   * and are displayed in that journey's achievement section.
   * 
   * @example
   * - Health Journey: "Track your steps for 7 consecutive days"
   * - Care Journey: "Schedule your first appointment"
   * - Plan Journey: "Submit your first claim"
   */
  JOURNEY = 'JOURNEY',

  /**
   * Achievements that span multiple journeys.
   * 
   * These achievements require actions across different journeys and
   * are displayed in a dedicated cross-journey achievements section.
   * 
   * @example
   * - "Complete your health profile and schedule a preventive check-up"
   * - "Track a health metric and submit a related insurance claim"
   */
  CROSS_JOURNEY = 'CROSS_JOURNEY',

  /**
   * Special achievements for limited-time events or campaigns.
   * 
   * These achievements are typically available for a limited time and
   * may have special rewards or recognition.
   * 
   * @example
   * - "Participate in the Summer Health Challenge"
   * - "Complete all December wellness activities"
   */
  SPECIAL = 'SPECIAL',

  /**
   * Hidden achievements that are not visible to users until unlocked.
   * 
   * These achievements add an element of surprise and discovery to the
   * gamification experience.
   * 
   * @example
   * - "Use the app for 100 consecutive days"
   * - "Unlock all achievements in a specific category"
   */
  HIDDEN = 'HIDDEN',

  /**
   * Progressive achievements that have multiple levels or tiers.
   * 
   * These achievements can be earned multiple times with increasing
   * difficulty and rewards.
   * 
   * @example
   * - "Track 1,000 / 5,000 / 10,000 steps in a day"
   * - "Schedule 1 / 5 / 10 appointments"
   */
  PROGRESSIVE = 'PROGRESSIVE'
}

/**
 * Type representing the string literal values of the AchievementType enum.
 * 
 * This type can be used for type-safe handling of achievement type values
 * in functions and interfaces.
 */
export type AchievementTypeValue = `${AchievementType}`;

/**
 * Interface for achievement type metadata.
 * 
 * This interface provides additional information about each achievement type
 * that can be used for filtering, display, and processing.
 */
export interface AchievementTypeMetadata {
  /**
   * The unique identifier for the achievement type.
   */
  type: AchievementType;

  /**
   * A human-readable display name for the achievement type.
   */
  displayName: string;

  /**
   * A description of the achievement type.
   */
  description: string;

  /**
   * The icon name to use for representing this achievement type.
   */
  icon: string;

  /**
   * Whether achievements of this type should be visible in achievement lists
   * before they are unlocked.
   */
  visibleBeforeUnlock: boolean;

  /**
   * Whether this achievement type is specific to a journey.
   */
  journeySpecific: boolean;
}

/**
 * Metadata for all achievement types.
 * 
 * This constant provides detailed information about each achievement type
 * for use in UI components and filtering logic.
 */
export const ACHIEVEMENT_TYPE_METADATA: Record<AchievementType, AchievementTypeMetadata> = {
  [AchievementType.JOURNEY]: {
    type: AchievementType.JOURNEY,
    displayName: 'Journey Achievement',
    description: 'Achievements specific to a single journey',
    icon: 'journey-achievement',
    visibleBeforeUnlock: true,
    journeySpecific: true
  },
  [AchievementType.CROSS_JOURNEY]: {
    type: AchievementType.CROSS_JOURNEY,
    displayName: 'Cross-Journey Achievement',
    description: 'Achievements that span multiple journeys',
    icon: 'cross-journey-achievement',
    visibleBeforeUnlock: true,
    journeySpecific: false
  },
  [AchievementType.SPECIAL]: {
    type: AchievementType.SPECIAL,
    displayName: 'Special Achievement',
    description: 'Limited-time or event-based achievements',
    icon: 'special-achievement',
    visibleBeforeUnlock: true,
    journeySpecific: false
  },
  [AchievementType.HIDDEN]: {
    type: AchievementType.HIDDEN,
    displayName: 'Hidden Achievement',
    description: 'Achievements that are not visible until unlocked',
    icon: 'hidden-achievement',
    visibleBeforeUnlock: false,
    journeySpecific: false
  },
  [AchievementType.PROGRESSIVE]: {
    type: AchievementType.PROGRESSIVE,
    displayName: 'Progressive Achievement',
    description: 'Achievements with multiple levels or tiers',
    icon: 'progressive-achievement',
    visibleBeforeUnlock: true,
    journeySpecific: true
  }
};

/**
 * Returns the metadata for a specific achievement type.
 * 
 * @param type - The achievement type to get metadata for
 * @returns The metadata for the specified achievement type
 */
export function getAchievementTypeMetadata(type: AchievementType): AchievementTypeMetadata {
  return ACHIEVEMENT_TYPE_METADATA[type];
}

/**
 * Returns all achievement types that match the specified filter criteria.
 * 
 * @param filter - Optional filter criteria for achievement types
 * @returns An array of achievement types that match the filter
 */
export function filterAchievementTypes(filter?: {
  journeySpecific?: boolean;
  visibleBeforeUnlock?: boolean;
}): AchievementType[] {
  return Object.values(AchievementType).filter(type => {
    const metadata = ACHIEVEMENT_TYPE_METADATA[type as AchievementType];
    
    if (filter?.journeySpecific !== undefined && 
        metadata.journeySpecific !== filter.journeySpecific) {
      return false;
    }
    
    if (filter?.visibleBeforeUnlock !== undefined && 
        metadata.visibleBeforeUnlock !== filter.visibleBeforeUnlock) {
      return false;
    }
    
    return true;
  }) as AchievementType[];
}