/**
 * Database interfaces for the gamification engine.
 * 
 * These interfaces define contracts for database operations, transaction handlers,
 * error processing, and journey contexts, ensuring type safety and consistent
 * implementation across the application.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JourneyType } from '@austa/interfaces/common';
import { 
  Achievement, 
  Quest, 
  Reward, 
  GameProfile, 
  GamificationEvent,
  Rule
} from '@austa/interfaces/gamification';

/**
 * Enhanced PrismaService interface that extends PrismaClient with connection pooling,
 * lifecycle hooks, and error handling.
 */
export interface IPrismaService extends PrismaClient, OnModuleInit, OnModuleDestroy {
  /**
   * Connects to the database with proper connection pooling.
   * @returns Promise that resolves when connection is established
   */
  connect(): Promise<void>;

  /**
   * Disconnects from the database, properly closing all connections in the pool.
   * @returns Promise that resolves when all connections are closed
   */
  disconnect(): Promise<void>;

  /**
   * Cleans up resources when the module is destroyed.
   */
  onModuleDestroy(): Promise<void>;

  /**
   * Initializes the service when the module is initialized.
   */
  onModuleInit(): Promise<void>;

  /**
   * Executes a function within a transaction.
   * 
   * @param fn Function to execute within the transaction
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T>;

  /**
   * Gets a journey-specific database context.
   * 
   * @param journeyType Type of journey (health, care, plan)
   * @param options Context options
   * @returns Journey-specific database context
   */
  getJourneyContext(journeyType: JourneyType, options?: IJourneyContextOptions): IJourneyContext;
}

/**
 * Options for database transactions.
 */
export interface ITransactionOptions {
  /**
   * Maximum number of retry attempts for the transaction.
   */
  maxRetries?: number;

  /**
   * Isolation level for the transaction.
   */
  isolationLevel?: Prisma.TransactionIsolationLevel;

  /**
   * Timeout in milliseconds for the transaction.
   */
  timeout?: number;

  /**
   * Whether to use optimistic locking for the transaction.
   */
  useOptimisticLocking?: boolean;
}

/**
 * Interface for transaction handlers that manage database transactions.
 */
export interface ITransactionHandler {
  /**
   * Executes a function within a transaction.
   * 
   * @param fn Function to execute within the transaction
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T>;

  /**
   * Executes a function within a nested transaction.
   * 
   * @param fn Function to execute within the nested transaction
   * @param parent Parent transaction client
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  executeNestedTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    parent: Prisma.TransactionClient,
    options?: ITransactionOptions
  ): Promise<T>;
}

/**
 * Options for journey-specific database contexts.
 */
export interface IJourneyContextOptions {
  /**
   * Whether to use a dedicated connection for this context.
   */
  useDedicatedConnection?: boolean;

  /**
   * Whether to enable query logging for this context.
   */
  enableQueryLogging?: boolean;

  /**
   * Whether to track performance metrics for this context.
   */
  trackPerformance?: boolean;

  /**
   * Custom middleware to apply to this context.
   */
  middleware?: Prisma.Middleware[];
}

/**
 * Interface for journey-specific database contexts.
 */
export interface IJourneyContext {
  /**
   * The journey type associated with this context.
   */
  readonly journeyType: JourneyType;

  /**
   * The Prisma client instance for this context.
   */
  readonly client: Prisma.TransactionClient | PrismaClient;

  /**
   * Executes a function within a transaction in this journey context.
   * 
   * @param fn Function to execute within the transaction
   * @param options Transaction options
   * @returns Promise resolving to the result of the function
   */
  executeTransaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T>;

  /**
   * Releases resources associated with this context.
   */
  release(): Promise<void>;
}

/**
 * Interface for database error handlers.
 */
export interface IDatabaseErrorHandler {
  /**
   * Handles a database error, potentially transforming it into an application-specific error.
   * 
   * @param error The error to handle
   * @param context Additional context for error handling
   * @returns The handled error
   */
  handleError(error: Error, context?: IDatabaseErrorContext): Error;

  /**
   * Determines if an error is retryable.
   * 
   * @param error The error to check
   * @returns Whether the error is retryable
   */
  isRetryableError(error: Error): boolean;

  /**
   * Determines if an error is a connection error.
   * 
   * @param error The error to check
   * @returns Whether the error is a connection error
   */
  isConnectionError(error: Error): boolean;

  /**
   * Determines if an error is a constraint violation.
   * 
   * @param error The error to check
   * @returns Whether the error is a constraint violation
   */
  isConstraintViolation(error: Error): boolean;

  /**
   * Logs a database error with appropriate context.
   * 
   * @param error The error to log
   * @param context Additional context for logging
   */
  logError(error: Error, context?: IDatabaseErrorContext): void;

  /**
   * Creates a retry strategy for a specific error.
   * 
   * @param error The error to create a retry strategy for
   * @param context Additional context for retry strategy creation
   * @returns Retry strategy for the error
   */
  createRetryStrategy(error: Error, context?: IDatabaseErrorContext): IRetryStrategy;
}

/**
 * Strategy for retrying operations after errors.
 */
export interface IRetryStrategy {
  /**
   * Maximum number of retry attempts.
   */
  maxRetries: number;

  /**
   * Base delay between retries in milliseconds.
   */
  baseDelayMs: number;

  /**
   * Maximum delay between retries in milliseconds.
   */
  maxDelayMs: number;

  /**
   * Factor by which to increase delay after each retry.
   */
  backoffFactor: number;

  /**
   * Whether to add jitter to delay times.
   */
  useJitter: boolean;

  /**
   * Calculates the delay for a specific retry attempt.
   * 
   * @param attempt The current retry attempt (0-based)
   * @returns Delay in milliseconds before the next retry
   */
  calculateDelay(attempt: number): number;

  /**
   * Determines if another retry should be attempted.
   * 
   * @param attempt The current retry attempt (0-based)
   * @param error The error that occurred
   * @returns Whether another retry should be attempted
   */
  shouldRetry(attempt: number, error: Error): boolean;
}

/**
 * Context for database error handling.
 */
export interface IDatabaseErrorContext {
  /**
   * The operation that caused the error.
   */
  operation?: string;

  /**
   * The model associated with the error.
   */
  model?: string;

  /**
   * The journey type associated with the error.
   */
  journeyType?: JourneyType;

  /**
   * Whether the error occurred during a transaction.
   */
  inTransaction?: boolean;

  /**
   * The number of retry attempts made so far.
   */
  retryAttempt?: number;

  /**
   * Additional metadata for the error.
   */
  metadata?: Record<string, any>;
}

/**
 * Interface for journey context service that creates and manages journey-specific database contexts.
 */
export interface IJourneyContextService {
  /**
   * Gets a journey-specific database context.
   * 
   * @param journeyType Type of journey (health, care, plan)
   * @param options Context options
   * @returns Journey-specific database context
   */
  getContext(journeyType: JourneyType, options?: IJourneyContextOptions): IJourneyContext;

  /**
   * Releases all contexts managed by this service.
   */
  releaseAllContexts(): Promise<void>;
}

/**
 * Interface for health journey-specific database operations.
 */
export interface IHealthJourneyContext extends IJourneyContext {
  /**
   * Processes health-related gamification events.
   * 
   * @param event The health event to process
   * @returns Promise resolving when the event is processed
   */
  processHealthEvent(event: GamificationEvent): Promise<void>;

  /**
   * Gets achievements related to health metrics.
   * 
   * @param userId The ID of the user
   * @returns Promise resolving to health-related achievements
   */
  getHealthAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Gets quests related to health activities.
   * 
   * @param userId The ID of the user
   * @param isActive Whether to only return active quests
   * @returns Promise resolving to health-related quests
   */
  getHealthQuests(userId: string, isActive?: boolean): Promise<Quest[]>;
}

/**
 * Interface for care journey-specific database operations.
 */
export interface ICareJourneyContext extends IJourneyContext {
  /**
   * Processes care-related gamification events.
   * 
   * @param event The care event to process
   * @returns Promise resolving when the event is processed
   */
  processCareEvent(event: GamificationEvent): Promise<void>;

  /**
   * Gets achievements related to care activities.
   * 
   * @param userId The ID of the user
   * @returns Promise resolving to care-related achievements
   */
  getCareAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Gets quests related to care activities.
   * 
   * @param userId The ID of the user
   * @param isActive Whether to only return active quests
   * @returns Promise resolving to care-related quests
   */
  getCareQuests(userId: string, isActive?: boolean): Promise<Quest[]>;
}

/**
 * Interface for plan journey-specific database operations.
 */
export interface IPlanJourneyContext extends IJourneyContext {
  /**
   * Processes plan-related gamification events.
   * 
   * @param event The plan event to process
   * @returns Promise resolving when the event is processed
   */
  processPlanEvent(event: GamificationEvent): Promise<void>;

  /**
   * Gets achievements related to plan activities.
   * 
   * @param userId The ID of the user
   * @returns Promise resolving to plan-related achievements
   */
  getPlanAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Gets quests related to plan activities.
   * 
   * @param userId The ID of the user
   * @param isActive Whether to only return active quests
   * @returns Promise resolving to plan-related quests
   */
  getPlanQuests(userId: string, isActive?: boolean): Promise<Quest[]>;
}

/**
 * Interface for database connection manager.
 */
export interface IDatabaseConnectionManager {
  /**
   * Gets a connection from the pool.
   * 
   * @returns Promise resolving to a database connection
   */
  getConnection(): Promise<PrismaClient>;

  /**
   * Releases a connection back to the pool.
   * 
   * @param connection The connection to release
   */
  releaseConnection(connection: PrismaClient): Promise<void>;

  /**
   * Gets the current connection pool status.
   * 
   * @returns Current connection pool status
   */
  getPoolStatus(): IDatabaseConnectionPoolStatus;

  /**
   * Checks the health of the database connections.
   * 
   * @returns Promise resolving to the health status
   */
  checkHealth(): Promise<IDatabaseHealthStatus>;

  /**
   * Resets the connection pool, closing all connections and creating new ones as needed.
   * 
   * @returns Promise resolving when the pool is reset
   */
  resetPool(): Promise<void>;
}

/**
 * Health status of the database.
 */
export interface IDatabaseHealthStatus {
  /**
   * Whether the database is healthy.
   */
  isHealthy: boolean;

  /**
   * Current connection pool status.
   */
  poolStatus: IDatabaseConnectionPoolStatus;

  /**
   * Average query execution time in milliseconds.
   */
  avgQueryTimeMs?: number;

  /**
   * Average connection acquisition time in milliseconds.
   */
  avgConnectionAcquisitionTimeMs?: number;

  /**
   * Number of failed queries in the last monitoring period.
   */
  failedQueries?: number;

  /**
   * Number of failed connection attempts in the last monitoring period.
   */
  failedConnections?: number;

  /**
   * Timestamp of the last successful database operation.
   */
  lastSuccessfulOperation?: Date;

  /**
   * Any error message if the database is not healthy.
   */
  errorMessage?: string;
}

/**
 * Interface for database monitoring service.
 */
export interface IDatabaseMonitoringService {
  /**
   * Starts monitoring database performance and health.
   */
  startMonitoring(): void;

  /**
   * Stops monitoring database performance and health.
   */
  stopMonitoring(): void;

  /**
   * Gets the current database health status.
   * 
   * @returns Current database health status
   */
  getHealthStatus(): IDatabaseHealthStatus;

  /**
   * Records a query execution for monitoring purposes.
   * 
   * @param query The query that was executed
   * @param durationMs The duration of the query in milliseconds
   * @param success Whether the query was successful
   */
  recordQueryExecution(query: string, durationMs: number, success: boolean): void;

  /**
   * Records a connection acquisition for monitoring purposes.
   * 
   * @param durationMs The duration of the connection acquisition in milliseconds
   * @param success Whether the connection acquisition was successful
   */
  recordConnectionAcquisition(durationMs: number, success: boolean): void;
}

/**
 * Status of the database connection pool.
 */
export interface IDatabaseConnectionPoolStatus {
  /**
   * Total number of connections in the pool.
   */
  totalConnections: number;

  /**
   * Number of active connections in the pool.
   */
  activeConnections: number;

  /**
   * Number of idle connections in the pool.
   */
  idleConnections: number;

  /**
   * Number of connections waiting to be established.
   */
  pendingConnections: number;
}

/**
 * Interface for gamification-specific database operations.
 */
export interface IGamificationDatabase {
  /**
   * Retrieves achievements based on the provided filters.
   * 
   * @param filters Filters to apply to the query
   * @param options Query options like pagination and sorting
   * @returns Promise resolving to an array of achievements
   */
  getAchievements(filters?: IAchievementFilters, options?: IQueryOptions): Promise<Achievement[]>;

  /**
   * Retrieves quests based on the provided filters.
   * 
   * @param filters Filters to apply to the query
   * @param options Query options like pagination and sorting
   * @returns Promise resolving to an array of quests
   */
  getQuests(filters?: IQuestFilters, options?: IQueryOptions): Promise<Quest[]>;

  /**
   * Retrieves rewards based on the provided filters.
   * 
   * @param filters Filters to apply to the query
   * @param options Query options like pagination and sorting
   * @returns Promise resolving to an array of rewards
   */
  getRewards(filters?: IRewardFilters, options?: IQueryOptions): Promise<Reward[]>;

  /**
   * Retrieves a user's game profile.
   * 
   * @param userId The ID of the user
   * @param options Query options
   * @returns Promise resolving to the user's game profile
   */
  getUserProfile(userId: string, options?: IQueryOptions): Promise<GameProfile>;

  /**
   * Processes a gamification event, updating relevant entities.
   * 
   * @param event The event to process
   * @returns Promise resolving when the event is processed
   */
  processEvent(event: GamificationEvent): Promise<void>;

  /**
   * Evaluates rules against an event.
   * 
   * @param event The event to evaluate
   * @param rules The rules to evaluate
   * @returns Promise resolving to the rules that matched the event
   */
  evaluateRules(event: GamificationEvent, rules: Rule[]): Promise<Rule[]>;
}

/**
 * Filters for achievement queries.
 */
export interface IAchievementFilters {
  /**
   * Filter by achievement IDs.
   */
  ids?: string[];

  /**
   * Filter by journey type.
   */
  journeyType?: JourneyType;

  /**
   * Filter by achievement type.
   */
  type?: string;

  /**
   * Filter by difficulty level.
   */
  difficulty?: string;

  /**
   * Filter by whether the achievement is hidden.
   */
  isHidden?: boolean;

  /**
   * Filter by whether the achievement is featured.
   */
  isFeatured?: boolean;

  /**
   * Filter by tags.
   */
  tags?: string[];

  /**
   * Filter by required XP.
   */
  requiredXp?: {
    min?: number;
    max?: number;
  };
}

/**
 * Filters for quest queries.
 */
export interface IQuestFilters {
  /**
   * Filter by quest IDs.
   */
  ids?: string[];

  /**
   * Filter by journey type.
   */
  journeyType?: JourneyType;

  /**
   * Filter by quest type.
   */
  type?: string;

  /**
   * Filter by difficulty level.
   */
  difficulty?: string;

  /**
   * Filter by whether the quest is active.
   */
  isActive?: boolean;

  /**
   * Filter by whether the quest is featured.
   */
  isFeatured?: boolean;

  /**
   * Filter by tags.
   */
  tags?: string[];

  /**
   * Filter by start date.
   */
  startDate?: {
    before?: Date;
    after?: Date;
  };

  /**
   * Filter by end date.
   */
  endDate?: {
    before?: Date;
    after?: Date;
  };
}

/**
 * Filters for reward queries.
 */
export interface IRewardFilters {
  /**
   * Filter by reward IDs.
   */
  ids?: string[];

  /**
   * Filter by journey type.
   */
  journeyType?: JourneyType;

  /**
   * Filter by reward type.
   */
  type?: string;

  /**
   * Filter by whether the reward is active.
   */
  isActive?: boolean;

  /**
   * Filter by whether the reward is featured.
   */
  isFeatured?: boolean;

  /**
   * Filter by tags.
   */
  tags?: string[];

  /**
   * Filter by required XP.
   */
  requiredXp?: {
    min?: number;
    max?: number;
  };

  /**
   * Filter by expiration date.
   */
  expirationDate?: {
    before?: Date;
    after?: Date;
  };
}

/**
 * Options for database queries.
 */
export interface IQueryOptions {
  /**
   * Pagination options.
   */
  pagination?: {
    /**
     * Number of items to skip.
     */
    skip?: number;

    /**
     * Maximum number of items to return.
     */
    take?: number;

    /**
     * Cursor for cursor-based pagination.
     */
    cursor?: Record<string, any>;
  };

  /**
   * Sorting options.
   */
  sorting?: {
    /**
     * Field to sort by.
     */
    field: string;

    /**
     * Sort direction.
     */
    direction: 'asc' | 'desc';
  }[];

  /**
   * Whether to include related entities.
   */
  include?: Record<string, boolean | Record<string, any>>;

  /**
   * Fields to select.
   */
  select?: Record<string, boolean | Record<string, any>>;

  /**
   * Whether to use a transaction for this query.
   */
  useTransaction?: boolean;

  /**
   * Transaction options if useTransaction is true.
   */
  transactionOptions?: ITransactionOptions;
}