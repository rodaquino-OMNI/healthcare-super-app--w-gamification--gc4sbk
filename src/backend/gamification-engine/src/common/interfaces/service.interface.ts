/**
 * @file service.interface.ts
 * @description Defines a generic service interface providing standardized CRUD operations
 * that can be extended by all service classes in the gamification engine. This interface
 * ensures consistent implementation of service methods across modules, improving code
 * quality and maintainability through standardized patterns.
 */

import { IErrorResponse, IRetryPolicy } from './error.interface';
import { IPaginatedResponse, IPaginationRequest } from './pagination.interface';
import { JourneyType } from './journey.interface';
import { IRetryResult } from './retry-policy.interface';

/**
 * Options for service operations that can be customized per request
 */
export interface IServiceOptions {
  /**
   * Whether to throw an error if the entity is not found
   * @default true
   */
  throwIfNotFound?: boolean;

  /**
   * Custom retry policy for this specific operation
   * Overrides the default retry policy for the service
   */
  retryPolicy?: IRetryPolicy;

  /**
   * Journey context for the operation
   * Used for journey-specific logic and error handling
   */
  journeyContext?: JourneyType;

  /**
   * Request ID for tracing and correlation
   * Used for logging and error tracking
   */
  requestId?: string;

  /**
   * User ID associated with the operation
   * Used for authorization and audit logging
   */
  userId?: string;

  /**
   * Whether to use a transaction for this operation
   * @default false
   */
  useTransaction?: boolean;

  /**
   * Whether to use a cache for this operation
   * @default true
   */
  useCache?: boolean;

  /**
   * Time-to-live for cached results in seconds
   * Only applicable if useCache is true
   */
  cacheTtl?: number;

  /**
   * Additional context data for the operation
   * Can be used for custom logic in service implementations
   */
  context?: Record<string, any>;
}

/**
 * Result wrapper for service operations that includes metadata
 * about the operation and potential errors
 */
export interface IServiceResult<T> {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * The result data of the operation (if successful)
   */
  data?: T;

  /**
   * Error information (if unsuccessful)
   */
  error?: IErrorResponse;

  /**
   * Metadata about the operation
   */
  metadata?: {
    /**
     * Timestamp when the operation was performed
     */
    timestamp: Date;

    /**
     * Duration of the operation in milliseconds
     */
    durationMs: number;

    /**
     * Whether the result was retrieved from cache
     */
    fromCache?: boolean;

    /**
     * For operations with retries, metadata about the retry attempts
     */
    retryAttempts?: number;

    /**
     * Request ID for tracing and correlation
     */
    requestId?: string;
  };
}

/**
 * Filter criteria for finding entities
 * This is a base interface that should be extended by entity-specific filter interfaces
 */
export interface IBaseFilter {
  /**
   * Filter by ID
   */
  id?: string | string[];

  /**
   * Filter by creation date range
   */
  createdAt?: {
    /**
     * Start date for filtering (inclusive)
     */
    from?: Date;

    /**
     * End date for filtering (inclusive)
     */
    to?: Date;
  };

  /**
   * Filter by update date range
   */
  updatedAt?: {
    /**
     * Start date for filtering (inclusive)
     */
    from?: Date;

    /**
     * End date for filtering (inclusive)
     */
    to?: Date;
  };

  /**
   * Filter by active status
   */
  isActive?: boolean;

  /**
   * Filter by journey type
   */
  journeyType?: JourneyType | JourneyType[];

  /**
   * Filter by user ID
   */
  userId?: string | string[];

  /**
   * Additional custom filters
   * Can be used for entity-specific filtering
   */
  [key: string]: any;
}

/**
 * Generic service interface that provides standardized CRUD operations
 * This interface should be implemented by all service classes in the gamification engine
 * 
 * @template T - The entity type that this service manages
 * @template C - The create DTO type for creating new entities
 * @template U - The update DTO type for updating existing entities
 * @template F - The filter type for finding entities
 */
export interface IService<
  T,
  C = Partial<T>,
  U = Partial<T>,
  F extends IBaseFilter = IBaseFilter
> {
  /**
   * Creates a new entity
   * 
   * @param createDto - The data to create the entity with
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the created entity
   * 
   * @throws {ValidationError} If the create DTO fails validation
   * @throws {ConflictError} If an entity with the same unique identifiers already exists
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during creation
   * 
   * @example
   * // Create a new achievement
   * const result = await achievementService.create({
   *   name: 'First Login',
   *   description: 'Log in for the first time',
   *   points: 100,
   *   journeyType: JourneyType.HEALTH
   * });
   * 
   * if (result.success) {
   *   console.log('Created achievement:', result.data);
   * } else {
   *   console.error('Failed to create achievement:', result.error);
   * }
   */
  create(createDto: C, options?: IServiceOptions): Promise<IServiceResult<T>>;

  /**
   * Finds a single entity by ID or other unique identifiers
   * 
   * @param id - The ID of the entity to find
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the found entity
   * 
   * @throws {NotFoundError} If the entity is not found and throwIfNotFound is true
   * @throws {ValidationError} If the ID is invalid
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during the operation
   * 
   * @example
   * // Find an achievement by ID
   * const result = await achievementService.findOne('achievement-123');
   * 
   * if (result.success) {
   *   console.log('Found achievement:', result.data);
   * } else {
   *   console.error('Failed to find achievement:', result.error);
   * }
   */
  findOne(id: string, options?: IServiceOptions): Promise<IServiceResult<T>>;

  /**
   * Finds entities based on filter criteria with pagination
   * 
   * @param filter - The filter criteria to apply
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated entities
   * 
   * @throws {ValidationError} If the filter or pagination parameters are invalid
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during the operation
   * 
   * @example
   * // Find all active achievements for the health journey
   * const result = await achievementService.findAll(
   *   { isActive: true, journeyType: JourneyType.HEALTH },
   *   { page: 1, size: 10 }
   * );
   * 
   * if (result.success) {
   *   console.log('Found achievements:', result.data.data);
   *   console.log('Pagination info:', result.data.meta);
   * } else {
   *   console.error('Failed to find achievements:', result.error);
   * }
   */
  findAll(
    filter: F,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<T>>>;

  /**
   * Updates an existing entity by ID
   * 
   * @param id - The ID of the entity to update
   * @param updateDto - The data to update the entity with
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the updated entity
   * 
   * @throws {NotFoundError} If the entity is not found
   * @throws {ValidationError} If the update DTO fails validation
   * @throws {ConflictError} If the update would create a duplicate of a unique field
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during the operation
   * 
   * @example
   * // Update an achievement
   * const result = await achievementService.update('achievement-123', {
   *   description: 'Updated description',
   *   points: 150
   * });
   * 
   * if (result.success) {
   *   console.log('Updated achievement:', result.data);
   * } else {
   *   console.error('Failed to update achievement:', result.error);
   * }
   */
  update(id: string, updateDto: U, options?: IServiceOptions): Promise<IServiceResult<T>>;

  /**
   * Deletes an entity by ID
   * 
   * @param id - The ID of the entity to delete
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result indicating success or failure
   * 
   * @throws {NotFoundError} If the entity is not found and throwIfNotFound is true
   * @throws {ValidationError} If the ID is invalid
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during the operation
   * 
   * @example
   * // Delete an achievement
   * const result = await achievementService.delete('achievement-123');
   * 
   * if (result.success) {
   *   console.log('Achievement deleted successfully');
   * } else {
   *   console.error('Failed to delete achievement:', result.error);
   * }
   */
  delete(id: string, options?: IServiceOptions): Promise<IServiceResult<boolean>>;

  /**
   * Checks if an entity exists by ID or other criteria
   * 
   * @param criteria - The ID or criteria to check existence by
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing a boolean indicating existence
   * 
   * @throws {ValidationError} If the criteria are invalid
   * @throws {DatabaseError} If there is an error with the database operation
   * @throws {InternalServerError} If there is an unexpected error during the operation
   * 
   * @example
   * // Check if an achievement exists
   * const result = await achievementService.exists('achievement-123');
   * 
   * if (result.success) {
   *   console.log('Achievement exists:', result.data);
   * } else {
   *   console.error('Failed to check existence:', result.error);
   * }
   */
  exists(criteria: string | Partial<F>, options?: IServiceOptions): Promise<IServiceResult<boolean>>;

  /**
   * Executes an operation with retry logic based on the configured retry policy
   * 
   * @template R - The result type of the operation
   * @param operation - The operation function to execute with retry logic
   * @param options - Optional service operation options with retry policy
   * @returns A promise that resolves to the result of the operation
   * 
   * @throws The original error if all retry attempts fail and no fallback is provided
   * 
   * @example
   * // Execute an operation with retry logic
   * const result = await achievementService.executeWithRetry(
   *   async () => {
   *     // Operation that might fail transiently
   *     return await externalService.fetchData();
   *   },
   *   {
   *     retryPolicy: {
   *       maxAttempts: 3,
   *       backoffStrategy: new ExponentialBackoffStrategy({
   *         initialDelayMs: 1000,
   *         maxDelayMs: 10000,
   *         factor: 2,
   *         jitter: true
   *       }),
   *       retryPredicate: (error) => isTransientError(error),
   *       includeMetadata: true
   *     }
   *   }
   * );
   */
  executeWithRetry<R>(
    operation: () => Promise<R>,
    options?: IServiceOptions
  ): Promise<IRetryResult<R>>;

  /**
   * Clears any cached data for this service
   * 
   * @param filter - Optional filter to clear specific cache entries
   * @returns A promise that resolves when the cache is cleared
   * 
   * @example
   * // Clear all cached achievements
   * await achievementService.clearCache();
   * 
   * // Clear cache for a specific achievement
   * await achievementService.clearCache({ id: 'achievement-123' });
   */
  clearCache(filter?: Partial<F>): Promise<void>;
}

/**
 * Interface for achievement-specific service operations
 * Extends the generic service interface with achievement-specific methods
 */
export interface IAchievementService extends IService<
  GamificationInterfaces.Achievement,
  GamificationInterfaces.CreateAchievementDto,
  GamificationInterfaces.UpdateAchievementDto,
  GamificationInterfaces.AchievementFilter
> {
  /**
   * Awards an achievement to a user
   * 
   * @param achievementId - The ID of the achievement to award
   * @param userId - The ID of the user to award the achievement to
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the awarded achievement
   */
  awardToUser(
    achievementId: string,
    userId: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserAchievement>>;

  /**
   * Gets all achievements awarded to a user
   * 
   * @param userId - The ID of the user
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated user achievements
   */
  getUserAchievements(
    userId: string,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<GamificationInterfaces.UserAchievement>>>;
}

/**
 * Interface for quest-specific service operations
 * Extends the generic service interface with quest-specific methods
 */
export interface IQuestService extends IService<
  GamificationInterfaces.Quest,
  GamificationInterfaces.CreateQuestDto,
  GamificationInterfaces.UpdateQuestDto,
  GamificationInterfaces.QuestFilter
> {
  /**
   * Assigns a quest to a user
   * 
   * @param questId - The ID of the quest to assign
   * @param userId - The ID of the user to assign the quest to
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the assigned quest
   */
  assignToUser(
    questId: string,
    userId: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserQuest>>;

  /**
   * Updates the progress of a user's quest
   * 
   * @param userQuestId - The ID of the user quest
   * @param progress - The new progress value (0-100)
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the updated user quest
   */
  updateUserQuestProgress(
    userQuestId: string,
    progress: number,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserQuest>>;

  /**
   * Gets all quests assigned to a user
   * 
   * @param userId - The ID of the user
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated user quests
   */
  getUserQuests(
    userId: string,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<GamificationInterfaces.UserQuest>>>;
}

/**
 * Interface for reward-specific service operations
 * Extends the generic service interface with reward-specific methods
 */
export interface IRewardService extends IService<
  GamificationInterfaces.Reward,
  GamificationInterfaces.CreateRewardDto,
  GamificationInterfaces.UpdateRewardDto,
  GamificationInterfaces.RewardFilter
> {
  /**
   * Redeems a reward for a user
   * 
   * @param rewardId - The ID of the reward to redeem
   * @param userId - The ID of the user redeeming the reward
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the redeemed reward
   */
  redeemForUser(
    rewardId: string,
    userId: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserReward>>;

  /**
   * Gets all rewards redeemed by a user
   * 
   * @param userId - The ID of the user
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated user rewards
   */
  getUserRewards(
    userId: string,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<GamificationInterfaces.UserReward>>>;
}

/**
 * Interface for rule-specific service operations
 * Extends the generic service interface with rule-specific methods
 */
export interface IRuleService extends IService<
  GamificationInterfaces.Rule,
  GamificationInterfaces.CreateRuleDto,
  GamificationInterfaces.UpdateRuleDto,
  GamificationInterfaces.RuleFilter
> {
  /**
   * Evaluates a rule against an event
   * 
   * @param ruleId - The ID of the rule to evaluate
   * @param event - The event to evaluate the rule against
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the evaluation result
   */
  evaluateRule(
    ruleId: string,
    event: GamificationInterfaces.Event,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.RuleEvaluationResult>>;

  /**
   * Gets all rules applicable to an event type
   * 
   * @param eventType - The event type to get rules for
   * @param journeyType - Optional journey type to filter rules by
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the applicable rules
   */
  getRulesForEventType(
    eventType: string,
    journeyType?: JourneyType,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.Rule[]>>;
}

/**
 * Interface for profile-specific service operations
 * Extends the generic service interface with profile-specific methods
 */
export interface IProfileService extends IService<
  GamificationInterfaces.Profile,
  GamificationInterfaces.CreateProfileDto,
  GamificationInterfaces.UpdateProfileDto,
  GamificationInterfaces.ProfileFilter
> {
  /**
   * Adds experience points to a user's profile
   * 
   * @param userId - The ID of the user
   * @param xp - The amount of experience points to add
   * @param source - The source of the experience points (e.g., 'achievement', 'quest')
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the updated profile
   */
  addExperience(
    userId: string,
    xp: number,
    source: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.Profile>>;

  /**
   * Gets a user's level based on their experience points
   * 
   * @param userId - The ID of the user
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the user's level information
   */
  getUserLevel(
    userId: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserLevel>>;
}

/**
 * Interface for event-specific service operations
 * Extends the generic service interface with event-specific methods
 */
export interface IEventService extends IService<
  GamificationInterfaces.Event,
  GamificationInterfaces.CreateEventDto,
  GamificationInterfaces.UpdateEventDto,
  GamificationInterfaces.EventFilter
> {
  /**
   * Processes an event through the gamification engine
   * 
   * @param event - The event to process
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the processed event
   */
  processEvent(
    event: GamificationInterfaces.CreateEventDto,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.ProcessedEvent>>;

  /**
   * Gets all events for a user
   * 
   * @param userId - The ID of the user
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated events
   */
  getUserEvents(
    userId: string,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<GamificationInterfaces.Event>>>;
}

/**
 * Interface for leaderboard-specific service operations
 * Extends the generic service interface with leaderboard-specific methods
 */
export interface ILeaderboardService extends IService<
  GamificationInterfaces.Leaderboard,
  GamificationInterfaces.CreateLeaderboardDto,
  GamificationInterfaces.UpdateLeaderboardDto,
  GamificationInterfaces.LeaderboardFilter
> {
  /**
   * Gets the leaderboard rankings
   * 
   * @param leaderboardId - The ID of the leaderboard
   * @param pagination - Pagination parameters
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the paginated leaderboard entries
   */
  getLeaderboardRankings(
    leaderboardId: string,
    pagination: IPaginationRequest,
    options?: IServiceOptions
  ): Promise<IServiceResult<IPaginatedResponse<GamificationInterfaces.LeaderboardEntry>>>;

  /**
   * Gets a user's rank in a leaderboard
   * 
   * @param leaderboardId - The ID of the leaderboard
   * @param userId - The ID of the user
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the user's rank information
   */
  getUserRank(
    leaderboardId: string,
    userId: string,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.UserRank>>;

  /**
   * Updates a user's score in a leaderboard
   * 
   * @param leaderboardId - The ID of the leaderboard
   * @param userId - The ID of the user
   * @param score - The new score value
   * @param options - Optional service operation options
   * @returns A promise that resolves to a service result containing the updated leaderboard entry
   */
  updateUserScore(
    leaderboardId: string,
    userId: string,
    score: number,
    options?: IServiceOptions
  ): Promise<IServiceResult<GamificationInterfaces.LeaderboardEntry>>;
}

/**
 * Namespace containing interfaces from the @austa/interfaces package
 * This is used to reference the shared interfaces without importing them directly
 */
export namespace GamificationInterfaces {
  // These are placeholder interfaces that will be replaced by the actual interfaces
  // from the @austa/interfaces package when the file is imported
  export interface Achievement {}
  export interface CreateAchievementDto {}
  export interface UpdateAchievementDto {}
  export interface AchievementFilter {}
  export interface UserAchievement {}
  
  export interface Quest {}
  export interface CreateQuestDto {}
  export interface UpdateQuestDto {}
  export interface QuestFilter {}
  export interface UserQuest {}
  
  export interface Reward {}
  export interface CreateRewardDto {}
  export interface UpdateRewardDto {}
  export interface RewardFilter {}
  export interface UserReward {}
  
  export interface Rule {}
  export interface CreateRuleDto {}
  export interface UpdateRuleDto {}
  export interface RuleFilter {}
  export interface RuleEvaluationResult {}
  
  export interface Profile {}
  export interface CreateProfileDto {}
  export interface UpdateProfileDto {}
  export interface ProfileFilter {}
  export interface UserLevel {}
  
  export interface Event {}
  export interface CreateEventDto {}
  export interface UpdateEventDto {}
  export interface EventFilter {}
  export interface ProcessedEvent {}
  
  export interface Leaderboard {}
  export interface CreateLeaderboardDto {}
  export interface UpdateLeaderboardDto {}
  export interface LeaderboardFilter {}
  export interface LeaderboardEntry {}
  export interface UserRank {}
}