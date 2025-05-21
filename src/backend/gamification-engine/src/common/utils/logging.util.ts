import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { JourneyType } from '../constants/journey';
import { IUserProfile } from '../interfaces/user-profile.interface';
import { IEventMetadata } from '../interfaces/event-metadata.interface';

/**
 * Specialized logging utility for the Gamification Engine.
 * Provides gamification-specific logging with correlation IDs, journey context,
 * and structured JSON formatting for all gamification operations.
 */
@Injectable()
export class GamificationLogger {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Logs an event processing message with correlation ID and event metadata
   * @param message Log message
   * @param eventMetadata Event metadata containing correlation ID and source information
   * @param context Additional context data
   */
  logEventProcessing(message: string, eventMetadata: IEventMetadata, context?: Record<string, any>): void {
    this.logger.info(message, {
      correlationId: eventMetadata.correlationId,
      eventType: eventMetadata.eventType,
      eventSource: eventMetadata.source,
      eventVersion: eventMetadata.version,
      ...context,
    });
  }

  /**
   * Logs an achievement unlocked event with user and achievement details
   * @param userId User ID who unlocked the achievement
   * @param achievementId Achievement ID that was unlocked
   * @param journeyType Journey type where the achievement was unlocked
   * @param context Additional context data
   */
  logAchievementUnlocked(
    userId: string,
    achievementId: string,
    journeyType: JourneyType,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`Achievement unlocked: ${achievementId}`, {
      userId,
      achievementId,
      journeyType,
      achievementType: 'unlock',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a quest completion event with user and quest details
   * @param userId User ID who completed the quest
   * @param questId Quest ID that was completed
   * @param journeyType Journey type where the quest was completed
   * @param context Additional context data
   */
  logQuestCompleted(
    userId: string,
    questId: string,
    journeyType: JourneyType,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`Quest completed: ${questId}`, {
      userId,
      questId,
      journeyType,
      questType: 'completion',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a reward redemption event with user and reward details
   * @param userId User ID who redeemed the reward
   * @param rewardId Reward ID that was redeemed
   * @param journeyType Journey type where the reward was redeemed
   * @param context Additional context data
   */
  logRewardRedeemed(
    userId: string,
    rewardId: string,
    journeyType: JourneyType,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`Reward redeemed: ${rewardId}`, {
      userId,
      rewardId,
      journeyType,
      rewardType: 'redemption',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a user level up event with user profile details
   * @param userId User ID who leveled up
   * @param oldLevel Previous user level
   * @param newLevel New user level
   * @param context Additional context data
   */
  logUserLevelUp(
    userId: string,
    oldLevel: number,
    newLevel: number,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`User level up: ${userId} (${oldLevel} → ${newLevel})`, {
      userId,
      oldLevel,
      newLevel,
      levelDelta: newLevel - oldLevel,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a points awarded event with user and points details
   * @param userId User ID who received points
   * @param points Number of points awarded
   * @param reason Reason for awarding points
   * @param journeyType Journey type where points were awarded
   * @param context Additional context data
   */
  logPointsAwarded(
    userId: string,
    points: number,
    reason: string,
    journeyType: JourneyType,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`Points awarded: ${userId} (+${points})`, {
      userId,
      points,
      reason,
      journeyType,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a leaderboard update event with user ranking details
   * @param userId User ID whose ranking changed
   * @param oldRank Previous ranking position
   * @param newRank New ranking position
   * @param leaderboardId Identifier of the leaderboard
   * @param context Additional context data
   */
  logLeaderboardUpdate(
    userId: string,
    oldRank: number,
    newRank: number,
    leaderboardId: string,
    context?: Record<string, any>,
  ): void {
    this.logger.info(`Leaderboard update: ${userId} (${oldRank} → ${newRank})`, {
      userId,
      oldRank,
      newRank,
      rankDelta: oldRank - newRank, // Positive means improvement (moved up)
      leaderboardId,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs an error during event processing with correlation ID and event metadata
   * @param message Error message
   * @param error Error object
   * @param eventMetadata Event metadata containing correlation ID and source information
   * @param context Additional context data
   */
  logEventProcessingError(
    message: string,
    error: Error,
    eventMetadata: IEventMetadata,
    context?: Record<string, any>,
  ): void {
    this.logger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      correlationId: eventMetadata.correlationId,
      eventType: eventMetadata.eventType,
      eventSource: eventMetadata.source,
      eventVersion: eventMetadata.version,
      ...context,
    });
  }

  /**
   * Logs a user profile update with relevant details
   * @param userId User ID whose profile was updated
   * @param profile User profile data
   * @param context Additional context data
   */
  logProfileUpdate(userId: string, profile: Partial<IUserProfile>, context?: Record<string, any>): void {
    this.logger.info(`Profile updated: ${userId}`, {
      userId,
      profileChanges: this.sanitizeProfileData(profile),
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a rule evaluation event with details about the rule and outcome
   * @param userId User ID for whom the rule was evaluated
   * @param ruleId Rule ID that was evaluated
   * @param outcome Result of the rule evaluation
   * @param journeyType Journey type where the rule was evaluated
   * @param context Additional context data
   */
  logRuleEvaluation(
    userId: string,
    ruleId: string,
    outcome: boolean,
    journeyType: JourneyType,
    context?: Record<string, any>,
  ): void {
    this.logger.debug(`Rule evaluated: ${ruleId} (${outcome ? 'passed' : 'failed'})`, {
      userId,
      ruleId,
      outcome,
      journeyType,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a debug message with gamification context
   * @param message Debug message
   * @param context Additional context data
   */
  debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, {
      service: 'gamification-engine',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs an info message with gamification context
   * @param message Info message
   * @param context Additional context data
   */
  info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, {
      service: 'gamification-engine',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs a warning message with gamification context
   * @param message Warning message
   * @param context Additional context data
   */
  warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, {
      service: 'gamification-engine',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Logs an error message with gamification context
   * @param message Error message
   * @param error Error object
   * @param context Additional context data
   */
  error(message: string, error: Error, context?: Record<string, any>): void {
    this.logger.error(message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      service: 'gamification-engine',
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  /**
   * Creates a child logger with additional context
   * @param context Context to add to all log messages
   * @returns A new GamificationLogger instance with the merged context
   */
  createChildLogger(context: Record<string, any>): GamificationLogger {
    const childLogger = this.logger.createChildLogger(context);
    return new GamificationLogger(childLogger);
  }

  /**
   * Creates a logger with user context
   * @param userId User ID to add to all log messages
   * @returns A new GamificationLogger instance with user context
   */
  withUser(userId: string): GamificationLogger {
    return this.createChildLogger({ userId });
  }

  /**
   * Creates a logger with journey context
   * @param journeyType Journey type to add to all log messages
   * @returns A new GamificationLogger instance with journey context
   */
  withJourney(journeyType: JourneyType): GamificationLogger {
    return this.createChildLogger({ journeyType });
  }

  /**
   * Creates a logger with correlation ID context
   * @param correlationId Correlation ID to add to all log messages
   * @returns A new GamificationLogger instance with correlation ID context
   */
  withCorrelationId(correlationId: string): GamificationLogger {
    return this.createChildLogger({ correlationId });
  }

  /**
   * Sanitizes profile data to remove sensitive information before logging
   * @param profile User profile data
   * @returns Sanitized profile data safe for logging
   */
  private sanitizeProfileData(profile: Partial<IUserProfile>): Partial<IUserProfile> {
    // Create a copy to avoid modifying the original
    const sanitized = { ...profile };
    
    // Remove any sensitive fields that shouldn't be logged
    // This is a placeholder - add actual sensitive fields as needed
    const sensitiveFields = ['email', 'phoneNumber', 'address'];
    
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    
    return sanitized;
  }
}

/**
 * Creates a new GamificationLogger instance
 * @param logger Base logger service to use
 * @returns A new GamificationLogger instance
 */
export function createGamificationLogger(logger: LoggerService): GamificationLogger {
  return new GamificationLogger(logger);
}

/**
 * Utility function to extract correlation ID from event metadata
 * @param eventMetadata Event metadata
 * @returns Correlation ID or undefined if not present
 */
export function extractCorrelationId(eventMetadata: IEventMetadata): string | undefined {
  return eventMetadata?.correlationId;
}

/**
 * Utility function to create a correlation ID if one doesn't exist
 * @param existingId Optional existing correlation ID
 * @returns A correlation ID (either the existing one or a new one)
 */
export function ensureCorrelationId(existingId?: string): string {
  if (existingId) {
    return existingId;
  }
  
  // Generate a new correlation ID using UUID v4 format
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Utility function to create standard context for gamification logs
 * @param userId Optional user ID
 * @param journeyType Optional journey type
 * @param correlationId Optional correlation ID
 * @returns Standard context object for logging
 */
export function createGamificationContext(
  userId?: string,
  journeyType?: JourneyType,
  correlationId?: string,
): Record<string, any> {
  return {
    service: 'gamification-engine',
    timestamp: new Date().toISOString(),
    ...(userId && { userId }),
    ...(journeyType && { journeyType }),
    ...(correlationId && { correlationId }),
  };
}