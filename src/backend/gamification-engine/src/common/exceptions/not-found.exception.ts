import { HttpStatus } from '@nestjs/common';
import { ErrorType, ErrorMetadata, ErrorContext } from './error-types.enum';
import { ClientException } from './client.exception';

/**
 * Resource types in the gamification engine
 */
export enum ResourceType {
  ACHIEVEMENT = 'achievement',
  QUEST = 'quest',
  REWARD = 'reward',
  RULE = 'rule',
  PROFILE = 'profile',
  EVENT = 'event',
  USER = 'user',
  LEADERBOARD = 'leaderboard',
  JOURNEY = 'journey',
}

/**
 * Specialized client exception for resource not found scenarios.
 * Handles cases where requested entities cannot be located in the database,
 * providing context about the resource type and identifier to help diagnose the issue.
 */
export class NotFoundException extends ClientException {
  public readonly resourceType: string;
  public readonly resourceId: string;
  
  /**
   * Creates a new NotFoundException instance
   * 
   * @param resourceType Type of resource that was not found
   * @param resourceId Identifier of the resource
   * @param message Custom error message (optional)
   * @param metadata Additional error metadata
   * @param context Error context information
   */
  constructor(
    resourceType: string,
    resourceId: string | number,
    message?: string,
    metadata: ErrorMetadata = {},
    context: ErrorContext = {},
  ) {
    const errorMessage = message || `${resourceType} with ID '${resourceId}' not found`;
    
    super(
      errorMessage,
      ErrorType.NOT_FOUND_ERROR,
      HttpStatus.NOT_FOUND,
      undefined,
      metadata,
      context,
    );
    
    this.resourceType = resourceType;
    this.resourceId = String(resourceId);
    
    // Add resource information to metadata
    this.addMetadata('resourceType', resourceType);
    this.addMetadata('resourceId', String(resourceId));
  }
  
  /**
   * Creates a NotFoundException for an achievement
   * 
   * @param achievementId Achievement ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static achievement(achievementId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.ACHIEVEMENT,
      achievementId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Creates a NotFoundException for a quest
   * 
   * @param questId Quest ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static quest(questId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.QUEST,
      questId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Creates a NotFoundException for a reward
   * 
   * @param rewardId Reward ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static reward(rewardId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.REWARD,
      rewardId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Creates a NotFoundException for a rule
   * 
   * @param ruleId Rule ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static rule(ruleId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.RULE,
      ruleId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Creates a NotFoundException for a profile
   * 
   * @param profileId Profile ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static profile(profileId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.PROFILE,
      profileId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Creates a NotFoundException for a user
   * 
   * @param userId User ID
   * @param context Additional context
   * @returns NotFoundException instance
   */
  static user(userId: string | number, context: ErrorContext = {}): NotFoundException {
    return new NotFoundException(
      ResourceType.USER,
      userId,
      undefined,
      {},
      context,
    );
  }
  
  /**
   * Gets suggested alternatives if available
   * 
   * @returns Array of suggested alternatives or null
   */
  getSuggestedAlternatives(): string[] | null {
    return this.metadata.suggestedAlternatives as string[] || null;
  }
  
  /**
   * Adds suggested alternatives to the exception
   * 
   * @param alternatives Array of suggested alternatives
   * @returns This exception instance for chaining
   */
  withSuggestedAlternatives(alternatives: string[]): NotFoundException {
    this.addMetadata('suggestedAlternatives', alternatives);
    return this;
  }
  
  /**
   * Gets safe metadata for client responses
   * 
   * @returns Safe metadata for client responses
   */
  getSafeMetadataForResponse(): Record<string, any> | null {
    const safeMetadata: Record<string, any> = {
      resourceType: this.resourceType,
      resourceId: this.resourceId,
    };
    
    const alternatives = this.getSuggestedAlternatives();
    if (alternatives && alternatives.length > 0) {
      safeMetadata.suggestedAlternatives = alternatives;
    }
    
    return safeMetadata;
  }
}