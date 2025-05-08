/**
 * Gamification-specific logging utilities that extend the core @austa/logging package
 * with specialized context enrichment for gamification events, achievements, quests,
 * and rewards. Provides correlation ID tracking across journey services and structured
 * JSON logging with standardized fields.
 */
import { Injectable } from '@nestjs/common';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { JourneyType } from '../interfaces/journey.interface';
import { IUserProfile } from '../interfaces/user-profile.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';

/**
 * Context types specific to gamification logging
 */
export enum GamificationContextType {
  EVENT = 'event',
  ACHIEVEMENT = 'achievement',
  QUEST = 'quest',
  REWARD = 'reward',
  PROFILE = 'profile',
  RULE = 'rule',
  LEADERBOARD = 'leaderboard',
}

/**
 * Interface for gamification-specific logging context
 */
export interface GamificationLogContext {
  contextType: GamificationContextType;
  entityId?: string;
  userId?: string;
  journeyType?: JourneyType;
  eventType?: string;
  correlationId?: string;
  [key: string]: any; // Additional context properties
}

/**
 * Utility class that provides gamification-specific logging functionality
 * by extending the core logging service with specialized context enrichment
 * and correlation ID tracking for gamification operations.
 */
@Injectable()
export class GamificationLogger {
  constructor(
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {}

  /**
   * Creates a gamification-specific logging context with correlation ID tracking
   * @param contextType Type of gamification context (event, achievement, etc.)
   * @param contextData Additional context data
   * @returns Enriched logging context
   */
  private createContext(contextType: GamificationContextType, contextData: Partial<GamificationLogContext> = {}): GamificationLogContext {
    const currentSpan = this.tracingService.getCurrentSpan();
    const correlationId = currentSpan?.spanContext().traceId || contextData.correlationId || 'unknown';
    
    return {
      contextType,
      correlationId,
      ...contextData,
    };
  }

  /**
   * Logs an event-related message with event context
   * @param level Log level
   * @param message Log message
   * @param event Event data
   * @param additionalContext Additional context data
   */
  private logEventMessage(level: 'debug' | 'info' | 'warn' | 'error', message: string, event: IBaseEvent, additionalContext: Record<string, any> = {}): void {
    const context = this.createContext(GamificationContextType.EVENT, {
      entityId: event.id,
      eventType: event.type,
      journeyType: event.journeyType,
      userId: event.userId,
      timestamp: event.timestamp,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about an event
   * @param message Debug message
   * @param event Event data
   * @param additionalContext Additional context data
   */
  public logEventDebug(message: string, event: IBaseEvent, additionalContext: Record<string, any> = {}): void {
    this.logEventMessage('debug', message, event, additionalContext);
  }

  /**
   * Logs informational message about an event
   * @param message Info message
   * @param event Event data
   * @param additionalContext Additional context data
   */
  public logEventInfo(message: string, event: IBaseEvent, additionalContext: Record<string, any> = {}): void {
    this.logEventMessage('info', message, event, additionalContext);
  }

  /**
   * Logs warning message about an event
   * @param message Warning message
   * @param event Event data
   * @param additionalContext Additional context data
   */
  public logEventWarning(message: string, event: IBaseEvent, additionalContext: Record<string, any> = {}): void {
    this.logEventMessage('warn', message, event, additionalContext);
  }

  /**
   * Logs error message about an event
   * @param message Error message
   * @param event Event data
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logEventError(message: string, event: IBaseEvent, error: Error, additionalContext: Record<string, any> = {}): void {
    this.logEventMessage('error', message, event, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs achievement-related message
   * @param level Log level
   * @param message Log message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  private logAchievementMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.ACHIEVEMENT, {
      entityId: achievementId,
      userId,
      journeyType,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about an achievement
   * @param message Debug message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logAchievementDebug(
    message: string,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logAchievementMessage('debug', message, achievementId, userId, journeyType, additionalContext);
  }

  /**
   * Logs informational message about an achievement
   * @param message Info message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logAchievementInfo(
    message: string,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logAchievementMessage('info', message, achievementId, userId, journeyType, additionalContext);
  }

  /**
   * Logs warning message about an achievement
   * @param message Warning message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logAchievementWarning(
    message: string,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logAchievementMessage('warn', message, achievementId, userId, journeyType, additionalContext);
  }

  /**
   * Logs error message about an achievement
   * @param message Error message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logAchievementError(
    message: string,
    achievementId: string,
    userId: string,
    journeyType: JourneyType,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logAchievementMessage('error', message, achievementId, userId, journeyType, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs quest-related message
   * @param level Log level
   * @param message Log message
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  private logQuestMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.QUEST, {
      entityId: questId,
      userId,
      journeyType,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a quest
   * @param message Debug message
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logQuestDebug(
    message: string,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logQuestMessage('debug', message, questId, userId, journeyType, additionalContext);
  }

  /**
   * Logs informational message about a quest
   * @param message Info message
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logQuestInfo(
    message: string,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logQuestMessage('info', message, questId, userId, journeyType, additionalContext);
  }

  /**
   * Logs warning message about a quest
   * @param message Warning message
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logQuestWarning(
    message: string,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logQuestMessage('warn', message, questId, userId, journeyType, additionalContext);
  }

  /**
   * Logs error message about a quest
   * @param message Error message
   * @param questId Quest ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logQuestError(
    message: string,
    questId: string,
    userId: string,
    journeyType: JourneyType,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logQuestMessage('error', message, questId, userId, journeyType, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs reward-related message
   * @param level Log level
   * @param message Log message
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  private logRewardMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.REWARD, {
      entityId: rewardId,
      userId,
      journeyType,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a reward
   * @param message Debug message
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRewardDebug(
    message: string,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRewardMessage('debug', message, rewardId, userId, journeyType, additionalContext);
  }

  /**
   * Logs informational message about a reward
   * @param message Info message
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRewardInfo(
    message: string,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRewardMessage('info', message, rewardId, userId, journeyType, additionalContext);
  }

  /**
   * Logs warning message about a reward
   * @param message Warning message
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRewardWarning(
    message: string,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRewardMessage('warn', message, rewardId, userId, journeyType, additionalContext);
  }

  /**
   * Logs error message about a reward
   * @param message Error message
   * @param rewardId Reward ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logRewardError(
    message: string,
    rewardId: string,
    userId: string,
    journeyType: JourneyType,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRewardMessage('error', message, rewardId, userId, journeyType, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs user profile-related message
   * @param level Log level
   * @param message Log message
   * @param profile User profile
   * @param additionalContext Additional context data
   */
  private logProfileMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    profile: IUserProfile,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.PROFILE, {
      entityId: profile.id,
      userId: profile.userId,
      level: profile.level,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a user profile
   * @param message Debug message
   * @param profile User profile
   * @param additionalContext Additional context data
   */
  public logProfileDebug(
    message: string,
    profile: IUserProfile,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logProfileMessage('debug', message, profile, additionalContext);
  }

  /**
   * Logs informational message about a user profile
   * @param message Info message
   * @param profile User profile
   * @param additionalContext Additional context data
   */
  public logProfileInfo(
    message: string,
    profile: IUserProfile,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logProfileMessage('info', message, profile, additionalContext);
  }

  /**
   * Logs warning message about a user profile
   * @param message Warning message
   * @param profile User profile
   * @param additionalContext Additional context data
   */
  public logProfileWarning(
    message: string,
    profile: IUserProfile,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logProfileMessage('warn', message, profile, additionalContext);
  }

  /**
   * Logs error message about a user profile
   * @param message Error message
   * @param profile User profile
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logProfileError(
    message: string,
    profile: IUserProfile,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logProfileMessage('error', message, profile, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs rule-related message
   * @param level Log level
   * @param message Log message
   * @param ruleId Rule ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  private logRuleMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    ruleId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.RULE, {
      entityId: ruleId,
      userId,
      journeyType,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a rule
   * @param message Debug message
   * @param ruleId Rule ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRuleDebug(
    message: string,
    ruleId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRuleMessage('debug', message, ruleId, userId, journeyType, additionalContext);
  }

  /**
   * Logs informational message about a rule
   * @param message Info message
   * @param ruleId Rule ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRuleInfo(
    message: string,
    ruleId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRuleMessage('info', message, ruleId, userId, journeyType, additionalContext);
  }

  /**
   * Logs warning message about a rule
   * @param message Warning message
   * @param ruleId Rule ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logRuleWarning(
    message: string,
    ruleId: string,
    userId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRuleMessage('warn', message, ruleId, userId, journeyType, additionalContext);
  }

  /**
   * Logs error message about a rule
   * @param message Error message
   * @param ruleId Rule ID
   * @param userId User ID
   * @param journeyType Journey type
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logRuleError(
    message: string,
    ruleId: string,
    userId: string,
    journeyType: JourneyType,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logRuleMessage('error', message, ruleId, userId, journeyType, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs leaderboard-related message
   * @param level Log level
   * @param message Log message
   * @param leaderboardId Leaderboard ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  private logLeaderboardMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    leaderboardId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.LEADERBOARD, {
      entityId: leaderboardId,
      journeyType,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a leaderboard
   * @param message Debug message
   * @param leaderboardId Leaderboard ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logLeaderboardDebug(
    message: string,
    leaderboardId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logLeaderboardMessage('debug', message, leaderboardId, journeyType, additionalContext);
  }

  /**
   * Logs informational message about a leaderboard
   * @param message Info message
   * @param leaderboardId Leaderboard ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logLeaderboardInfo(
    message: string,
    leaderboardId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logLeaderboardMessage('info', message, leaderboardId, journeyType, additionalContext);
  }

  /**
   * Logs warning message about a leaderboard
   * @param message Warning message
   * @param leaderboardId Leaderboard ID
   * @param journeyType Journey type
   * @param additionalContext Additional context data
   */
  public logLeaderboardWarning(
    message: string,
    leaderboardId: string,
    journeyType: JourneyType,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logLeaderboardMessage('warn', message, leaderboardId, journeyType, additionalContext);
  }

  /**
   * Logs error message about a leaderboard
   * @param message Error message
   * @param leaderboardId Leaderboard ID
   * @param journeyType Journey type
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logLeaderboardError(
    message: string,
    leaderboardId: string,
    journeyType: JourneyType,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logLeaderboardMessage('error', message, leaderboardId, journeyType, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs cross-journey achievement message
   * @param level Log level
   * @param message Log message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyTypes Array of journey types involved
   * @param additionalContext Additional context data
   */
  private logCrossJourneyAchievementMessage(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    achievementId: string,
    userId: string,
    journeyTypes: JourneyType[],
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.ACHIEVEMENT, {
      entityId: achievementId,
      userId,
      crossJourney: true,
      journeyTypes,
      ...additionalContext,
    });

    this.logger[level](message, context);
  }

  /**
   * Logs debug information about a cross-journey achievement
   * @param message Debug message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyTypes Array of journey types involved
   * @param additionalContext Additional context data
   */
  public logCrossJourneyAchievementDebug(
    message: string,
    achievementId: string,
    userId: string,
    journeyTypes: JourneyType[],
    additionalContext: Record<string, any> = {},
  ): void {
    this.logCrossJourneyAchievementMessage('debug', message, achievementId, userId, journeyTypes, additionalContext);
  }

  /**
   * Logs informational message about a cross-journey achievement
   * @param message Info message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyTypes Array of journey types involved
   * @param additionalContext Additional context data
   */
  public logCrossJourneyAchievementInfo(
    message: string,
    achievementId: string,
    userId: string,
    journeyTypes: JourneyType[],
    additionalContext: Record<string, any> = {},
  ): void {
    this.logCrossJourneyAchievementMessage('info', message, achievementId, userId, journeyTypes, additionalContext);
  }

  /**
   * Logs warning message about a cross-journey achievement
   * @param message Warning message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyTypes Array of journey types involved
   * @param additionalContext Additional context data
   */
  public logCrossJourneyAchievementWarning(
    message: string,
    achievementId: string,
    userId: string,
    journeyTypes: JourneyType[],
    additionalContext: Record<string, any> = {},
  ): void {
    this.logCrossJourneyAchievementMessage('warn', message, achievementId, userId, journeyTypes, additionalContext);
  }

  /**
   * Logs error message about a cross-journey achievement
   * @param message Error message
   * @param achievementId Achievement ID
   * @param userId User ID
   * @param journeyTypes Array of journey types involved
   * @param error Error object
   * @param additionalContext Additional context data
   */
  public logCrossJourneyAchievementError(
    message: string,
    achievementId: string,
    userId: string,
    journeyTypes: JourneyType[],
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    this.logCrossJourneyAchievementMessage('error', message, achievementId, userId, journeyTypes, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });
  }

  /**
   * Logs retry attempt for an operation
   * @param message Log message
   * @param operationName Name of the operation being retried
   * @param attempt Current attempt number
   * @param maxAttempts Maximum number of attempts
   * @param error Error that triggered the retry
   * @param additionalContext Additional context data
   */
  public logRetryAttempt(
    message: string,
    operationName: string,
    attempt: number,
    maxAttempts: number,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(additionalContext.contextType || GamificationContextType.EVENT, {
      operationName,
      attempt,
      maxAttempts,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });

    this.logger.warn(`${message} (Attempt ${attempt}/${maxAttempts})`, context);
  }

  /**
   * Logs a dead letter queue event
   * @param message Log message
   * @param event Event that was sent to the dead letter queue
   * @param error Error that caused the event to be sent to the DLQ
   * @param additionalContext Additional context data
   */
  public logDeadLetterQueueEvent(
    message: string,
    event: IBaseEvent,
    error: Error,
    additionalContext: Record<string, any> = {},
  ): void {
    const context = this.createContext(GamificationContextType.EVENT, {
      entityId: event.id,
      eventType: event.type,
      journeyType: event.journeyType,
      userId: event.userId,
      timestamp: event.timestamp,
      dlq: true,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...additionalContext,
    });

    this.logger.error(message, context);
  }
}