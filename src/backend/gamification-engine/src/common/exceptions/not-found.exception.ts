import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Resource types that can be used with NotFoundException
 * Provides consistent resource naming across the application
 */
export enum ResourceType {
  ACHIEVEMENT = 'achievement',
  USER_ACHIEVEMENT = 'user achievement',
  QUEST = 'quest',
  USER_QUEST = 'user quest',
  REWARD = 'reward',
  USER_REWARD = 'user reward',
  RULE = 'rule',
  PROFILE = 'profile',
  EVENT = 'event',
  LEADERBOARD = 'leaderboard',
  LEADERBOARD_ENTRY = 'leaderboard entry',
}

/**
 * Interface for resource identification
 */
export interface ResourceIdentifier {
  id?: string | number;
  code?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Specialized client exception for resource not found scenarios.
 * Handles cases where requested entities cannot be located in the database,
 * providing context about the resource type and identifier to help diagnose the issue.
 */
export class NotFoundException extends ClientException {
  /**
   * Creates a new NotFoundException instance
   * 
   * @param resourceType Type of resource that was not found
   * @param identifier Identifier used to look up the resource
   * @param customMessage Optional custom error message (if not provided, a default message will be generated)
   * @param cause Original error that caused this exception
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    public readonly resourceType: string,
    public readonly identifier: ResourceIdentifier,
    customMessage?: string,
    cause?: Error,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    // Generate default message if not provided
    const message = customMessage || NotFoundException.generateDefaultMessage(resourceType, identifier);
    
    super(
      message,
      ErrorType.NOT_FOUND_ERROR,
      HttpStatus.NOT_FOUND,
      cause,
      {
        resourceType,
        identifier,
        ...metadata,
      },
      context,
    );
  }
  
  /**
   * Generates a default error message based on resource type and identifier
   * 
   * @param resourceType Type of resource that was not found
   * @param identifier Identifier used to look up the resource
   * @returns Default error message
   */
  private static generateDefaultMessage(resourceType: string, identifier: ResourceIdentifier): string {
    // Determine which identifier property to use in the message
    let identifierStr = '';
    
    if (identifier.id) {
      identifierStr = `ID: ${identifier.id}`;
    } else if (identifier.code) {
      identifierStr = `code: ${identifier.code}`;
    } else if (identifier.name) {
      identifierStr = `name: ${identifier.name}`;
    } else {
      // Use the first available property if none of the standard ones are present
      const firstKey = Object.keys(identifier)[0];
      if (firstKey) {
        identifierStr = `${firstKey}: ${identifier[firstKey]}`;
      }
    }
    
    return `The requested ${resourceType} could not be found${identifierStr ? ` (${identifierStr})` : ''}.`;
  }
  
  /**
   * Adds suggested alternatives to the exception metadata
   * Useful for providing the client with possible alternatives when a resource is not found
   * 
   * @param alternatives Array of alternative resources that might match what the user was looking for
   * @returns This exception instance for method chaining
   */
  withSuggestedAlternatives(alternatives: Array<any>): NotFoundException {
    this.addMetadata('suggestedAlternatives', alternatives);
    return this;
  }
  
  /**
   * Adds a reason why the resource might not be found
   * Useful for providing additional context to the client
   * 
   * @param reason Reason why the resource might not be found
   * @returns This exception instance for method chaining
   */
  withReason(reason: string): NotFoundException {
    this.addMetadata('reason', reason);
    return this;
  }
  
  /**
   * Gets safe metadata that can be included in client responses
   * For not found errors, we can include resource type, identifier, and suggested alternatives
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    const safeMetadata: Record<string, any> = {
      resourceType: this.resourceType,
    };
    
    // Include a simplified version of the identifier
    if (this.identifier) {
      const safeIdentifier: Record<string, any> = {};
      
      // Only include basic identifier properties
      if (this.identifier.id) safeIdentifier.id = this.identifier.id;
      if (this.identifier.code) safeIdentifier.code = this.identifier.code;
      if (this.identifier.name) safeIdentifier.name = this.identifier.name;
      
      if (Object.keys(safeIdentifier).length > 0) {
        safeMetadata.identifier = safeIdentifier;
      }
    }
    
    // Include suggested alternatives if present
    if (this.metadata.suggestedAlternatives) {
      safeMetadata.suggestedAlternatives = this.metadata.suggestedAlternatives;
    }
    
    // Include reason if present
    if (this.metadata.reason) {
      safeMetadata.reason = this.metadata.reason;
    }
    
    return Object.keys(safeMetadata).length > 0 ? safeMetadata : null;
  }
  
  /**
   * Creates a NotFoundException for an achievement
   * 
   * @param achievementId Achievement ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forAchievement(achievementId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.ACHIEVEMENT,
      { id: achievementId },
      `Achievement with ID ${achievementId} could not be found.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a user achievement
   * 
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forUserAchievement(userId: string, achievementId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.USER_ACHIEVEMENT,
      { userId, achievementId },
      `Achievement with ID ${achievementId} not found for user ${userId}.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a quest
   * 
   * @param questId Quest ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forQuest(questId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.QUEST,
      { id: questId },
      `Quest with ID ${questId} could not be found.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a user quest
   * 
   * @param userId User ID
   * @param questId Quest ID
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forUserQuest(userId: string, questId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.USER_QUEST,
      { userId, questId },
      `Quest with ID ${questId} not found for user ${userId}.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a reward
   * 
   * @param rewardId Reward ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forReward(rewardId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.REWARD,
      { id: rewardId },
      `Reward with ID ${rewardId} could not be found.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a user reward
   * 
   * @param userId User ID
   * @param rewardId Reward ID
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forUserReward(userId: string, rewardId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.USER_REWARD,
      { userId, rewardId },
      `Reward with ID ${rewardId} not found for user ${userId}.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a profile
   * 
   * @param userId User ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forProfile(userId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.PROFILE,
      { userId },
      `Gamification profile for user ${userId} could not be found.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a leaderboard
   * 
   * @param leaderboardId Leaderboard ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forLeaderboard(leaderboardId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.LEADERBOARD,
      { id: leaderboardId },
      `Leaderboard with ID ${leaderboardId} could not be found.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a leaderboard entry
   * 
   * @param leaderboardId Leaderboard ID
   * @param userId User ID
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forLeaderboardEntry(leaderboardId: string, userId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.LEADERBOARD_ENTRY,
      { leaderboardId, userId },
      `Entry for user ${userId} not found in leaderboard ${leaderboardId}.`,
      cause
    );
  }
  
  /**
   * Creates a NotFoundException for a rule
   * 
   * @param ruleId Rule ID that was not found
   * @param cause Original error that caused this exception
   * @returns NotFoundException instance
   */
  static forRule(ruleId: string, cause?: Error): NotFoundException {
    return new NotFoundException(
      ResourceType.RULE,
      { id: ruleId },
      `Rule with ID ${ruleId} could not be found.`,
      cause
    );
  }
}