import { HttpStatus, NotFoundException } from '@nestjs/common';

/**
 * Error type enumeration for resource not found errors.
 * Used for categorizing different types of not found scenarios.
 */
export enum ResourceNotFoundErrorType {
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  RELATIONSHIP_NOT_FOUND = 'RELATIONSHIP_NOT_FOUND',
  COLLECTION_EMPTY = 'COLLECTION_EMPTY',
  RESOURCE_DELETED = 'RESOURCE_DELETED',
  RESOURCE_MOVED = 'RESOURCE_MOVED'
}

/**
 * Interface for resource not found error metadata.
 * Provides structured context about the missing resource.
 */
export interface ResourceNotFoundErrorMetadata {
  resourceType: string;
  resourceId?: string | number;
  searchCriteria?: Record<string, any>;
  suggestedAlternatives?: Array<{ id: string | number; name?: string; similarity?: number }>;
  lastKnownLocation?: string;
  deletedAt?: Date;
  journeyType?: string;
  correlationId?: string;
}

/**
 * Map of common resource types to user-friendly names for error messages.
 */
const RESOURCE_TYPE_DISPLAY_NAMES: Record<string, string> = {
  achievement: 'achievement',
  profile: 'gamification profile',
  quest: 'quest',
  reward: 'reward',
  rule: 'rule',
  event: 'event',
  leaderboard: 'leaderboard',
  userAchievement: 'user achievement relationship',
  userQuest: 'user quest relationship',
  userReward: 'user reward relationship'
};

/**
 * Specialized client exception for resource not found scenarios.
 * Handles cases where requested entities cannot be located in the database,
 * providing context about the resource type and identifier to help diagnose the issue.
 */
export class ResourceNotFoundException extends NotFoundException {
  /**
   * Creates a new ResourceNotFoundException instance.
   * 
   * @param resourceType - Type of resource that was not found (e.g., 'achievement', 'profile')
   * @param resourceId - Identifier of the resource that was not found (optional)
   * @param errorType - Specific type of not found error (default: ENTITY_NOT_FOUND)
   * @param message - Custom error message (optional, generated if not provided)
   * @param metadata - Additional context about the not found error (optional)
   */
  constructor(
    private readonly resourceType: string,
    private readonly resourceId?: string | number,
    private readonly errorType: ResourceNotFoundErrorType = ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
    message?: string,
    private readonly metadata: Partial<ResourceNotFoundErrorMetadata> = {}
  ) {
    // Generate a user-friendly message if none provided
    const displayName = RESOURCE_TYPE_DISPLAY_NAMES[resourceType] || resourceType;
    const defaultMessage = resourceId
      ? `The requested ${displayName} with ID ${resourceId} could not be found`
      : `The requested ${displayName} could not be found`;
    
    // Create the exception with standardized structure
    super({
      message: message || defaultMessage,
      error: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Not Found`,
      statusCode: HttpStatus.NOT_FOUND,
      errorCode: `GAME_404_${resourceType.toUpperCase()}`,
      errorType: errorType,
      context: {
        resourceType,
        resourceId,
        ...metadata
      }
    });
    
    // Set the name explicitly for better error identification in logs
    this.name = 'ResourceNotFoundException';
    
    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Gets the type of resource that was not found.
   * 
   * @returns The resource type
   */
  getResourceType(): string {
    return this.resourceType;
  }

  /**
   * Gets the ID of the resource that was not found.
   * 
   * @returns The resource ID or undefined if no specific ID was provided
   */
  getResourceId(): string | number | undefined {
    return this.resourceId;
  }

  /**
   * Gets the specific type of not found error.
   * 
   * @returns The not found error type
   */
  getErrorType(): ResourceNotFoundErrorType {
    return this.errorType;
  }

  /**
   * Gets the metadata associated with this not found error.
   * 
   * @returns The error metadata
   */
  getMetadata(): Partial<ResourceNotFoundErrorMetadata> {
    return this.metadata;
  }

  /**
   * Adds suggested alternatives to the error context.
   * Useful for providing similar resources when the exact match is not found.
   * 
   * @param alternatives - Array of alternative resources that might match the user's intent
   * @returns The exception instance for method chaining
   */
  withSuggestedAlternatives(alternatives: Array<{ id: string | number; name?: string; similarity?: number }>): ResourceNotFoundException {
    this.metadata.suggestedAlternatives = alternatives;
    return this;
  }

  /**
   * Adds journey context to the error.
   * Useful for associating the error with a specific user journey.
   * 
   * @param journeyType - The journey identifier ('health', 'care', 'plan')
   * @returns The exception instance for method chaining
   */
  withJourneyContext(journeyType: string): ResourceNotFoundException {
    this.metadata.journeyType = journeyType;
    return this;
  }

  /**
   * Adds correlation ID to the error for request tracking.
   * 
   * @param correlationId - Unique identifier for the request
   * @returns The exception instance for method chaining
   */
  withCorrelationId(correlationId: string): ResourceNotFoundException {
    this.metadata.correlationId = correlationId;
    return this;
  }

  /**
   * Adds information about a resource that was deleted.
   * 
   * @param deletedAt - When the resource was deleted
   * @returns The exception instance for method chaining
   */
  asDeleted(deletedAt?: Date): ResourceNotFoundException {
    this.metadata.deletedAt = deletedAt || new Date();
    return this;
  }

  /**
   * Adds information about a resource that was moved to a different location.
   * 
   * @param newLocation - Where the resource can now be found
   * @returns The exception instance for method chaining
   */
  asMoved(newLocation: string): ResourceNotFoundException {
    this.metadata.lastKnownLocation = newLocation;
    return this;
  }

  /**
   * Creates a standard not found exception for an achievement.
   * 
   * @param achievementId - ID of the achievement
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forAchievement(achievementId: string, message?: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'achievement',
      achievementId,
      ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
      message
    );
  }

  /**
   * Creates a standard not found exception for a user achievement relationship.
   * 
   * @param profileId - ID of the user's profile
   * @param achievementId - ID of the achievement
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forUserAchievement(profileId: string, achievementId: string, message?: string): ResourceNotFoundException {
    const instance = new ResourceNotFoundException(
      'userAchievement',
      undefined,
      ResourceNotFoundErrorType.RELATIONSHIP_NOT_FOUND,
      message || `User achievement relationship not found for profile ${profileId} and achievement ${achievementId}`
    );
    
    instance.metadata.searchCriteria = { profileId, achievementId };
    return instance;
  }

  /**
   * Creates a standard not found exception for a profile.
   * 
   * @param profileId - ID of the profile
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forProfile(profileId: string, message?: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'profile',
      profileId,
      ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
      message
    );
  }

  /**
   * Creates a standard not found exception for a quest.
   * 
   * @param questId - ID of the quest
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forQuest(questId: string, message?: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'quest',
      questId,
      ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
      message
    );
  }

  /**
   * Creates a standard not found exception for a reward.
   * 
   * @param rewardId - ID of the reward
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forReward(rewardId: string, message?: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'reward',
      rewardId,
      ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
      message
    );
  }

  /**
   * Creates a standard not found exception for a rule.
   * 
   * @param ruleId - ID of the rule
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forRule(ruleId: string, message?: string): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'rule',
      ruleId,
      ResourceNotFoundErrorType.ENTITY_NOT_FOUND,
      message
    );
  }

  /**
   * Creates a standard not found exception for an empty collection.
   * 
   * @param resourceType - Type of resources in the collection
   * @param searchCriteria - Criteria used to search for the resources
   * @param message - Optional custom message
   * @returns A new ResourceNotFoundException instance
   */
  static forEmptyCollection(resourceType: string, searchCriteria: Record<string, any>, message?: string): ResourceNotFoundException {
    const displayName = RESOURCE_TYPE_DISPLAY_NAMES[resourceType] || resourceType;
    const defaultMessage = `No ${displayName}s found matching the specified criteria`;
    
    const instance = new ResourceNotFoundException(
      resourceType,
      undefined,
      ResourceNotFoundErrorType.COLLECTION_EMPTY,
      message || defaultMessage
    );
    
    instance.metadata.searchCriteria = searchCriteria;
    return instance;
  }
}