/**
 * @file format.util.ts
 * @description Provides data formatting and transformation utilities for the gamification engine.
 * Includes functions for standardizing event formats, normalizing achievement data,
 * and formatting user-facing notifications about gamification events.
 */

import { JourneyType } from '@austa/interfaces/gamification';
import { Achievement, UserAchievement, Reward, EventType } from '@austa/interfaces/gamification';
import { IEventMetadata } from '../interfaces/event-metadata.interface';
import { IErrorResponse } from '../interfaces/error.interface';
import { ILeaderboardEntry } from '../interfaces/leaderboard-data.interface';
import { IUserProfile } from '../interfaces/user-profile.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IVersioned } from '../interfaces/versioning.interface';

// ===================================================
// Event Formatting Utilities
// ===================================================

/**
 * Standardizes event data from different journeys into a consistent format
 * @param eventData - Raw event data from a journey service
 * @param journeyType - The journey that generated the event
 * @param eventType - The type of event being processed
 * @param metadata - Optional metadata to include with the event
 * @returns Standardized event object with consistent structure
 */
export function standardizeEventFormat<T>(
  eventData: T, 
  journeyType: JourneyType, 
  eventType: EventType,
  metadata?: IEventMetadata
): IBaseEvent<T> & IVersioned {
  // Create default metadata if none provided
  const defaultMetadata: IEventMetadata = {
    timestamp: new Date().toISOString(),
    source: `journey.${journeyType.toLowerCase()}`,
    version: '1.0.0',
    correlationId: generateCorrelationId(),
  };

  return {
    id: generateEventId(),
    type: eventType,
    journeyType,
    payload: eventData,
    timestamp: new Date().toISOString(),
    metadata: { ...defaultMetadata, ...metadata },
    version: '1.0.0',
  };
}

/**
 * Generates a unique event ID
 * @returns Unique event ID string
 */
export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Normalizes event data to ensure consistent structure regardless of source
 * @param eventData - Event data that may have inconsistent structure
 * @returns Normalized event data with consistent property names and types
 */
export function normalizeEventData<T extends Record<string, any>>(eventData: T): T {
  // Create a copy to avoid mutating the original
  const normalized = { ...eventData };

  // Normalize common property name variations
  if ('user_id' in normalized && !('userId' in normalized)) {
    normalized.userId = normalized.user_id;
    delete normalized.user_id;
  }

  if ('timestamp' in normalized && typeof normalized.timestamp === 'string') {
    try {
      // Ensure timestamp is in ISO format
      normalized.timestamp = new Date(normalized.timestamp).toISOString();
    } catch (e) {
      // If invalid date, use current time
      normalized.timestamp = new Date().toISOString();
    }
  }

  // Ensure all journey-specific fields follow consistent naming
  if (normalized.journey_type && !normalized.journeyType) {
    normalized.journeyType = normalized.journey_type;
    delete normalized.journey_type;
  }

  return normalized;
}

// ===================================================
// Achievement Formatting Utilities
// ===================================================

/**
 * Generates a user-friendly description for an achievement based on its criteria
 * @param achievementId - The ID of the achievement
 * @param achievementTitle - The title of the achievement
 * @param criteria - The criteria object describing achievement conditions
 * @param journeyType - The journey associated with this achievement
 * @returns User-friendly description string
 */
export function formatAchievementDescription(
  achievementId: string,
  achievementTitle: string,
  criteria: Record<string, any>,
  journeyType: JourneyType
): string {
  // Journey-specific formatting templates
  const templates: Record<JourneyType, Record<string, string>> = {
    [JourneyType.HEALTH]: {
      steps: 'Complete {value} steps in a single day',
      workout: 'Complete {value} workouts',
      metrics: 'Record {value} health metrics',
      goals: 'Achieve {value} health goals',
      streak: 'Maintain a {value}-day streak of health tracking',
      device: 'Connect {value} health devices',
      default: 'Complete a health-related activity',
    },
    [JourneyType.CARE]: {
      appointment: 'Schedule {value} appointments',
      medication: 'Track medication for {value} consecutive days',
      telemedicine: 'Complete {value} telemedicine sessions',
      provider: 'Visit {value} different healthcare providers',
      symptom: 'Track {value} different symptoms',
      treatment: 'Complete {value} treatment plans',
      default: 'Complete a care-related activity',
    },
    [JourneyType.PLAN]: {
      claim: 'Submit {value} claims',
      benefit: 'Use {value} different benefits',
      document: 'Upload {value} documents',
      coverage: 'Review {value} coverage details',
      payment: 'Make {value} payments',
      savings: 'Save {value} through plan benefits',
      default: 'Complete a plan-related activity',
    },
    // Default case for cross-journey achievements
    CROSS_JOURNEY: {
      journeys: 'Complete activities in {value} different journeys',
      consecutive: 'Use the app for {value} consecutive days',
      referral: 'Refer {value} friends to the app',
      default: 'Complete activities across multiple journeys',
    },
  };

  // Get the appropriate template set for this journey
  const journeyTemplates = templates[journeyType] || templates.CROSS_JOURNEY;

  // Find the first matching criteria key
  const criteriaKey = Object.keys(criteria).find(key => key in journeyTemplates) || 'default';
  const template = journeyTemplates[criteriaKey] || journeyTemplates.default;

  // Replace {value} placeholder with actual value from criteria
  return template.replace('{value}', criteria[criteriaKey]?.toString() || '');
}

/**
 * Formats an achievement object for display in the UI
 * @param achievement - The achievement object to format
 * @param userAchievement - Optional user achievement progress data
 * @returns Formatted achievement object with display-ready properties
 */
export function formatAchievementForDisplay(
  achievement: Achievement,
  userAchievement?: UserAchievement
): Achievement & {
  formattedDescription: string;
  progressPercentage: number;
  progressText: string;
  isUnlocked: boolean;
  formattedUnlockDate?: string;
} {
  // Generate user-friendly description
  const formattedDescription = formatAchievementDescription(
    achievement.id,
    achievement.title,
    achievement.criteria || {},
    achievement.journeyType as JourneyType
  );

  // Calculate progress if user achievement data is available
  const progressPercentage = userAchievement
    ? Math.min(Math.round((userAchievement.currentValue / userAchievement.targetValue) * 100), 100)
    : 0;

  // Generate progress text
  const progressText = userAchievement
    ? `${userAchievement.currentValue}/${userAchievement.targetValue}`
    : '0/0';

  // Format unlock date if available
  const formattedUnlockDate = userAchievement?.unlockedAt
    ? new Date(userAchievement.unlockedAt).toLocaleDateString()
    : undefined;

  return {
    ...achievement,
    formattedDescription,
    progressPercentage,
    progressText,
    isUnlocked: !!userAchievement?.unlockedAt,
    formattedUnlockDate,
  };
}

/**
 * Formats achievement progress data for display
 * @param current - Current progress value
 * @param target - Target value for completion
 * @param achievementTitle - The title of the achievement
 * @returns Formatted progress string
 */
export function formatAchievementProgress(
  current: number,
  target: number,
  achievementTitle: string
): string {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  return `${percentage}% complete: ${current}/${target} - ${achievementTitle}`;
}

// ===================================================
// Notification Formatting Utilities
// ===================================================

/**
 * Formats an achievement notification for display to the user
 * @param achievementTitle - The title of the achievement
 * @param xpEarned - Experience points earned
 * @param journeyType - The journey associated with this achievement
 * @param badgeUrl - Optional URL to the achievement badge image
 * @returns Formatted notification object
 */
export function formatAchievementNotification(
  achievementTitle: string,
  xpEarned: number,
  journeyType: JourneyType,
  badgeUrl?: string
): {
  title: string;
  body: string;
  data: {
    type: 'achievement';
    achievementTitle: string;
    xpEarned: number;
    journeyType: JourneyType;
    badgeUrl?: string;
  };
} {
  const journeyNames: Record<JourneyType, string> = {
    [JourneyType.HEALTH]: 'Health Journey',
    [JourneyType.CARE]: 'Care Journey',
    [JourneyType.PLAN]: 'Plan Journey',
    CROSS_JOURNEY: 'AUSTA SuperApp',
  };

  const journeyEmojis: Record<JourneyType, string> = {
    [JourneyType.HEALTH]: '💚',
    [JourneyType.CARE]: '🧡',
    [JourneyType.PLAN]: '💙',
    CROSS_JOURNEY: '⭐',
  };

  const emoji = journeyEmojis[journeyType] || '🏆';
  const journeyName = journeyNames[journeyType] || 'AUSTA SuperApp';
  
  return {
    title: `${emoji} Achievement Unlocked!`,
    body: `${achievementTitle} - +${xpEarned} XP earned in ${journeyName}!`,
    data: {
      type: 'achievement',
      achievementTitle,
      xpEarned,
      journeyType,
      badgeUrl,
    },
  };
}

/**
 * Formats a reward notification for display to the user
 * @param rewardTitle - The title of the reward
 * @param rewardDescription - Description of the reward
 * @param journeyType - The journey associated with this reward
 * @param imageUrl - Optional URL to the reward image
 * @returns Formatted notification object
 */
export function formatRewardNotification(
  rewardTitle: string,
  rewardDescription: string,
  journeyType: JourneyType,
  imageUrl?: string
): {
  title: string;
  body: string;
  data: {
    type: 'reward';
    rewardTitle: string;
    rewardDescription: string;
    journeyType: JourneyType;
    imageUrl?: string;
  };
} {
  const journeyEmojis: Record<JourneyType, string> = {
    [JourneyType.HEALTH]: '💚',
    [JourneyType.CARE]: '🧡',
    [JourneyType.PLAN]: '💙',
    CROSS_JOURNEY: '🌟',
  };

  const emoji = journeyEmojis[journeyType] || '🎁';
  
  return {
    title: `${emoji} Reward Earned!`,
    body: `${rewardTitle} - ${rewardDescription}`,
    data: {
      type: 'reward',
      rewardTitle,
      rewardDescription,
      journeyType,
      imageUrl,
    },
  };
}

/**
 * Formats a level-up notification for display to the user
 * @param newLevel - The new level achieved
 * @param unlockedFeatures - Array of features unlocked at this level
 * @param xpForNextLevel - XP required for the next level
 * @returns Formatted notification object
 */
export function formatLevelUpNotification(
  newLevel: number, 
  unlockedFeatures: string[] = [],
  xpForNextLevel?: number
): {
  title: string;
  body: string;
  data: {
    type: 'level_up';
    newLevel: number;
    unlockedFeatures: string[];
    xpForNextLevel?: number;
  };
} {
  let body = `You've reached level ${newLevel}!`;
  
  if (unlockedFeatures.length > 0) {
    body += '\nUnlocked: ' + unlockedFeatures.join(', ');
  }
  
  if (xpForNextLevel) {
    body += `\nNext level in ${xpForNextLevel} XP`;
  }
  
  return {
    title: '🌟 Level Up!',
    body,
    data: {
      type: 'level_up',
      newLevel,
      unlockedFeatures,
      xpForNextLevel,
    },
  };
}

/**
 * Formats a reward object for display in the UI
 * @param reward - The reward object to format
 * @returns Formatted reward object with display-ready properties
 */
export function formatRewardForDisplay(
  reward: Reward
): Reward & {
  formattedDescription: string;
  formattedRequirements: string;
  journeyIcon: string;
} {
  // Journey-specific icons
  const journeyIcons: Record<JourneyType, string> = {
    [JourneyType.HEALTH]: 'ud83dudc9a',
    [JourneyType.CARE]: 'ud83eudde1',
    [JourneyType.PLAN]: 'ud83dudc99',
    CROSS_JOURNEY: 'ud83cudf1f',
  };

  // Format requirements text
  let formattedRequirements = '';
  if (reward.xpRequired) {
    formattedRequirements = `${reward.xpRequired} XP required`;
  } else if (reward.achievementsRequired?.length) {
    formattedRequirements = `${reward.achievementsRequired.length} achievements required`;
  } else if (reward.level) {
    formattedRequirements = `Level ${reward.level} required`;
  }

  return {
    ...reward,
    formattedDescription: truncateText(reward.description || '', 120),
    formattedRequirements,
    journeyIcon: journeyIcons[reward.journeyType as JourneyType] || 'ud83cudf81',
  };
}

// ===================================================
// Leaderboard Formatting Utilities
// ===================================================

/**
 * Formats leaderboard entries for display
 * @param entries - Array of leaderboard entries
 * @param currentUserId - ID of the current user for highlighting
 * @returns Formatted leaderboard entries with rank information
 */
export function formatLeaderboardEntries(
  entries: ILeaderboardEntry[],
  currentUserId?: string
): Array<ILeaderboardEntry & { formattedScore: string; isCurrentUser: boolean }> {
  return entries.map((entry, index) => {
    const rank = index + 1;
    let rankSuffix = 'th';
    
    // Proper English ordinal suffixes
    if (rank % 10 === 1 && rank % 100 !== 11) rankSuffix = 'st';
    else if (rank % 10 === 2 && rank % 100 !== 12) rankSuffix = 'nd';
    else if (rank % 10 === 3 && rank % 100 !== 13) rankSuffix = 'rd';
    
    return {
      ...entry,
      formattedScore: `${entry.score.toLocaleString()} XP`,
      isCurrentUser: entry.userId === currentUserId,
      rank,
      rankFormatted: `${rank}${rankSuffix}`,
    };
  });
}

/**
 * Formats user progress data for display
 * @param profile - User profile with progress data
 * @param journeyType - Optional journey to filter progress data
 * @returns Formatted progress summary
 */
export function formatUserProgress(
  profile: IUserProfile,
  journeyType?: JourneyType
): {
  level: number;
  xp: number;
  nextLevelXp: number;
  progressPercentage: number;
  achievements: { total: number; completed: number; percentage: number };
} {
  // Calculate XP needed for next level (example formula)
  const nextLevelXp = 1000 * Math.pow(profile.level, 1.5);
  const xpForCurrentLevel = 1000 * Math.pow(profile.level - 1, 1.5);
  const xpProgress = profile.xp - xpForCurrentLevel;
  const xpNeeded = nextLevelXp - xpForCurrentLevel;
  const progressPercentage = Math.min(Math.round((xpProgress / xpNeeded) * 100), 100);
  
  // Filter achievements by journey if specified
  const achievements = profile.achievements || [];
  const filteredAchievements = journeyType
    ? achievements.filter(a => a.journeyType === journeyType)
    : achievements;
  
  const completedAchievements = filteredAchievements.filter(a => a.completed).length;
  const achievementPercentage = filteredAchievements.length > 0
    ? Math.round((completedAchievements / filteredAchievements.length) * 100)
    : 0;
  
  return {
    level: profile.level,
    xp: profile.xp,
    nextLevelXp,
    progressPercentage,
    achievements: {
      total: filteredAchievements.length,
      completed: completedAchievements,
      percentage: achievementPercentage,
    },
  };
}

// ===================================================
// Error Message Formatting Utilities
// ===================================================

/**
 * Formats error messages for user-friendly display
 * @param error - Error object or string
 * @param defaultMessage - Default message to show if error is undefined
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown, defaultMessage = 'An unexpected error occurred'): string {
  if (!error) return defaultMessage;
  
  if (typeof error === 'string') return error;
  
  if (error instanceof Error) return error.message;
  
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return defaultMessage;
}

/**
 * Creates a standardized error response object
 * @param error - Error object or string
 * @param statusCode - HTTP status code
 * @param context - Additional context information
 * @returns Standardized error response object
 */
export function formatErrorResponse(
  error: unknown,
  statusCode = 500,
  context?: Record<string, any>
): IErrorResponse {
  const message = formatErrorMessage(error);
  
  return {
    statusCode,
    message,
    timestamp: new Date().toISOString(),
    path: context?.path || '',
    context: context || {},
  };
}

// ===================================================
// Event Debugging Utilities
// ===================================================

/**
 * Formats event data for debugging and logging purposes
 * @param event - The event object to format
 * @param includePayload - Whether to include the full payload (default: false)
 * @returns Formatted event string for logging
 */
export function formatEventForDebugging<T>(
  event: IBaseEvent<T>,
  includePayload = false
): string {
  const { id, type, journeyType, timestamp, metadata } = event;
  
  let debugString = `Event[${id}] Type: ${type} Journey: ${journeyType} Time: ${new Date(timestamp).toISOString()}`;
  
  if (metadata) {
    debugString += ` Source: ${metadata.source} CorrelationId: ${metadata.correlationId || 'none'}`;
  }
  
  if (includePayload) {
    try {
      const payloadString = JSON.stringify(event.payload, null, 2);
      debugString += `\nPayload: ${payloadString}`;
    } catch (error) {
      debugString += '\nPayload: [Error serializing payload]';
    }
  }
  
  return debugString;
}

/**
 * Creates a sanitized version of an event for logging (removes sensitive data)
 * @param event - The event to sanitize
 * @returns Sanitized event object safe for logging
 */
export function sanitizeEventForLogging<T>(
  event: IBaseEvent<T>
): Omit<IBaseEvent<any>, 'payload'> & { payload: Record<string, any> } {
  // Create a deep copy to avoid modifying the original
  const sanitized = JSON.parse(JSON.stringify(event)) as IBaseEvent<Record<string, any>>;
  
  // List of sensitive fields to redact
  const sensitiveFields = ['password', 'token', 'secret', 'credential', 'ssn', 'creditCard'];
  
  // Function to recursively sanitize an object
  const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if this is a sensitive field
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        result[key] = Array.isArray(value) 
          ? value.map(item => typeof item === 'object' ? sanitizeObject(item) : item)
          : sanitizeObject(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  };
  
  // Sanitize the payload
  if (sanitized.payload && typeof sanitized.payload === 'object') {
    sanitized.payload = sanitizeObject(sanitized.payload);
  }
  
  return sanitized;
}

// ===================================================
// General Data Transformation Utilities
// ===================================================

/**
 * Serializes data to JSON with proper error handling
 * @param data - Data to serialize
 * @returns JSON string or error message
 */
export function safeSerialize<T>(data: T): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Serialization error:', error);
    return JSON.stringify({ error: 'Failed to serialize data' });
  }
}

/**
 * Deserializes JSON data with proper error handling
 * @param jsonString - JSON string to deserialize
 * @returns Parsed object or null if invalid
 */
export function safeDeserialize<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Deserialization error:', error);
    return null;
  }
}

/**
 * Generates a correlation ID for event tracking
 * @returns Unique correlation ID string
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Formats a number with proper thousands separators
 * @param value - Number to format
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted number string
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return value.toLocaleString(locale);
}

/**
 * Gets journey-specific formatting information
 * @param journeyType - The journey type to get formatting for
 * @returns Journey-specific formatting information
 */
export function getJourneyFormatting(journeyType: JourneyType): {
  name: string;
  emoji: string;
  color: string;
  shortName: string;
} {
  const journeyFormats: Record<JourneyType, { name: string; emoji: string; color: string; shortName: string }> = {
    [JourneyType.HEALTH]: {
      name: 'Health Journey',
      emoji: 'ud83dudc9a',
      color: '#4CAF50',
      shortName: 'Health',
    },
    [JourneyType.CARE]: {
      name: 'Care Journey',
      emoji: 'ud83eudde1',
      color: '#FF9800',
      shortName: 'Care',
    },
    [JourneyType.PLAN]: {
      name: 'Plan Journey',
      emoji: 'ud83dudc99',
      color: '#2196F3',
      shortName: 'Plan',
    },
    CROSS_JOURNEY: {
      name: 'AUSTA SuperApp',
      emoji: 'ud83cudf1f',
      color: '#9C27B0',
      shortName: 'All',
    },
  };

  return journeyFormats[journeyType] || journeyFormats.CROSS_JOURNEY;
}