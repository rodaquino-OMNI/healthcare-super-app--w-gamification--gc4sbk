/**
 * Database interfaces for the gamification engine.
 * Defines contract types for database operations, transaction handlers, error processing,
 * and journey contexts, ensuring type safety and consistent implementation across the application.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { JourneyType } from '@austa/interfaces/common';
import {
  Achievement,
  GameProfile,
  Quest,
  Reward,
  Rule,
  GamificationEvent
} from '@austa/interfaces/gamification';

/**
 * Enhanced PrismaService interface with connection pooling and optimization.
 * Extends the standard PrismaClient with additional functionality for the gamification engine.
 */
export interface IPrismaService extends PrismaClient {
  /**
   * Connect to the database with optimized connection pooling.
   * @returns Promise that resolves when the connection is established.
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database and clean up resources.
   * @returns Promise that resolves when the disconnection is complete.
   */
  disconnect(): Promise<void>;

  /**
   * Get the health status of the database connection.
   * @returns Promise that resolves to a boolean indicating if the connection is healthy.
   */
  isHealthy(): Promise<boolean>;

  /**
   * Execute a raw SQL query with proper error handling.
   * @param query The SQL query to execute.
   * @param parameters The parameters for the query.
   * @returns Promise that resolves to the query result.
   */
  executeRaw(query: string, parameters?: any[]): Promise<any>;
}

/**
 * Transaction options for database operations.
 * Configures isolation level, timeout, and retry behavior for transactions.
 */
export interface ITransactionOptions {
  /**
   * The isolation level for the transaction.
   * @default 'READ_COMMITTED'
   */
  isolationLevel?: Prisma.TransactionIsolationLevel;

  /**
   * Maximum time in milliseconds before the transaction times out.
   * @default 5000
   */
  timeout?: number;

  /**
   * Maximum number of retry attempts for failed transactions.
   * @default 3
   */
  maxRetries?: number;

  /**
   * Whether to use savepoints for partial rollbacks.
   * @default false
   */
  useSavepoints?: boolean;

  /**
   * Context information for the transaction, used for logging and monitoring.
   */
  context?: Record<string, any>;
}

/**
 * Transaction handler interface for managing database transactions.
 * Provides methods for starting, committing, and rolling back transactions.
 */
export interface ITransactionHandler {
  /**
   * Start a new transaction with the specified options.
   * @param options Configuration options for the transaction.
   * @returns Promise that resolves to a transaction client.
   */
  startTransaction(options?: ITransactionOptions): Promise<Prisma.TransactionClient>;

  /**
   * Commit the current transaction.
   * @param client The transaction client to commit.
   * @returns Promise that resolves when the commit is complete.
   */
  commitTransaction(client: Prisma.TransactionClient): Promise<void>;

  /**
   * Roll back the current transaction.
   * @param client The transaction client to roll back.
   * @returns Promise that resolves when the rollback is complete.
   */
  rollbackTransaction(client: Prisma.TransactionClient): Promise<void>;

  /**
   * Execute a function within a transaction.
   * @param fn The function to execute within the transaction.
   * @param options Configuration options for the transaction.
   * @returns Promise that resolves to the result of the function.
   */
  executeInTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T>;

  /**
   * Create a savepoint within the current transaction.
   * @param client The transaction client.
   * @param name The name of the savepoint.
   * @returns Promise that resolves when the savepoint is created.
   */
  createSavepoint(client: Prisma.TransactionClient, name: string): Promise<void>;

  /**
   * Roll back to a savepoint within the current transaction.
   * @param client The transaction client.
   * @param name The name of the savepoint to roll back to.
   * @returns Promise that resolves when the rollback to savepoint is complete.
   */
  rollbackToSavepoint(client: Prisma.TransactionClient, name: string): Promise<void>;
}

/**
 * Database error handler interface for processing database errors.
 * Provides methods for classifying, transforming, and handling database errors.
 */
export interface IDatabaseErrorHandler {
  /**
   * Handle a database error and transform it into an application-specific error.
   * @param error The original database error.
   * @param context Additional context information for the error.
   * @returns The transformed error.
   */
  handleError(error: Error, context?: Record<string, any>): Error;

  /**
   * Determine if an error is a transient error that can be retried.
   * @param error The error to check.
   * @returns Boolean indicating if the error is transient.
   */
  isTransientError(error: Error): boolean;

  /**
   * Get a retry strategy for a specific error.
   * @param error The error to get a retry strategy for.
   * @returns The retry strategy configuration.
   */
  getRetryStrategy(error: Error): IRetryStrategy;

  /**
   * Log a database error with appropriate context.
   * @param error The error to log.
   * @param context Additional context information for the error.
   */
  logError(error: Error, context?: Record<string, any>): void;
}

/**
 * Retry strategy interface for handling transient database errors.
 * Configures how and when to retry failed operations.
 */
export interface IRetryStrategy {
  /**
   * Maximum number of retry attempts.
   */
  maxRetries: number;

  /**
   * Base delay in milliseconds between retry attempts.
   */
  baseDelay: number;

  /**
   * Maximum delay in milliseconds between retry attempts.
   */
  maxDelay: number;

  /**
   * Whether to use exponential backoff for retry delays.
   */
  useExponentialBackoff: boolean;

  /**
   * Whether to add jitter to retry delays to prevent thundering herd problems.
   */
  useJitter: boolean;

  /**
   * Calculate the delay for a specific retry attempt.
   * @param attempt The current retry attempt number (1-based).
   * @returns The delay in milliseconds before the next retry.
   */
  calculateDelay(attempt: number): number;

  /**
   * Determine if a retry should be attempted based on the error and attempt number.
   * @param error The error that occurred.
   * @param attempt The current retry attempt number (1-based).
   * @returns Boolean indicating if a retry should be attempted.
   */
  shouldRetry(error: Error, attempt: number): boolean;
}

/**
 * Journey context interface for journey-specific database operations.
 * Provides methods for accessing and manipulating data within a specific journey context.
 */
export interface IJourneyContext {
  /**
   * The type of journey this context is for.
   */
  readonly journeyType: JourneyType;

  /**
   * Get the Prisma client for this journey context.
   * @returns The Prisma client for this journey.
   */
  getClient(): Prisma.TransactionClient | PrismaClient;

  /**
   * Execute a function within this journey context.
   * @param fn The function to execute.
   * @returns Promise that resolves to the result of the function.
   */
  execute<T>(fn: (client: Prisma.TransactionClient | PrismaClient) => Promise<T>): Promise<T>;

  /**
   * Execute a function within a transaction in this journey context.
   * @param fn The function to execute within the transaction.
   * @param options Configuration options for the transaction.
   * @returns Promise that resolves to the result of the function.
   */
  executeInTransaction<T>(
    fn: (client: Prisma.TransactionClient) => Promise<T>,
    options?: ITransactionOptions
  ): Promise<T>;
}

/**
 * Health journey context interface for health-specific database operations.
 * Extends the base journey context with health-specific methods.
 */
export interface IHealthJourneyContext extends IJourneyContext {
  /**
   * Process a health-related gamification event.
   * @param event The health event to process.
   * @returns Promise that resolves when the event is processed.
   */
  processHealthEvent(event: GamificationEvent): Promise<void>;

  /**
   * Get health-specific achievements.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of health achievements.
   */
  getHealthAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Get health-specific quests.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of health quests.
   */
  getHealthQuests(userId: string): Promise<Quest[]>;
}

/**
 * Care journey context interface for care-specific database operations.
 * Extends the base journey context with care-specific methods.
 */
export interface ICareJourneyContext extends IJourneyContext {
  /**
   * Process a care-related gamification event.
   * @param event The care event to process.
   * @returns Promise that resolves when the event is processed.
   */
  processCareEvent(event: GamificationEvent): Promise<void>;

  /**
   * Get care-specific achievements.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of care achievements.
   */
  getCareAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Get care-specific quests.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of care quests.
   */
  getCareQuests(userId: string): Promise<Quest[]>;
}

/**
 * Plan journey context interface for plan-specific database operations.
 * Extends the base journey context with plan-specific methods.
 */
export interface IPlanJourneyContext extends IJourneyContext {
  /**
   * Process a plan-related gamification event.
   * @param event The plan event to process.
   * @returns Promise that resolves when the event is processed.
   */
  processPlanEvent(event: GamificationEvent): Promise<void>;

  /**
   * Get plan-specific achievements.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of plan achievements.
   */
  getPlanAchievements(userId: string): Promise<Achievement[]>;

  /**
   * Get plan-specific quests.
   * @param userId The ID of the user.
   * @returns Promise that resolves to an array of plan quests.
   */
  getPlanQuests(userId: string): Promise<Quest[]>;
}

/**
 * Journey context factory interface for creating journey-specific database contexts.
 * Provides methods for getting contexts for different journey types.
 */
export interface IJourneyContextFactory {
  /**
   * Get a journey context for the specified journey type.
   * @param journeyType The type of journey to get a context for.
   * @returns The journey context for the specified journey type.
   */
  getContext(journeyType: JourneyType): IJourneyContext;

  /**
   * Get a health journey context.
   * @returns The health journey context.
   */
  getHealthContext(): IHealthJourneyContext;

  /**
   * Get a care journey context.
   * @returns The care journey context.
   */
  getCareContext(): ICareJourneyContext;

  /**
   * Get a plan journey context.
   * @returns The plan journey context.
   */
  getPlanContext(): IPlanJourneyContext;

  /**
   * Execute a function across all journey contexts.
   * @param fn The function to execute for each journey context.
   * @returns Promise that resolves to an array of results, one for each journey context.
   */
  executeAcrossJourneys<T>(
    fn: (context: IJourneyContext) => Promise<T>
  ): Promise<Record<JourneyType, T>>;
}

/**
 * Database middleware interface for intercepting and modifying database operations.
 * Provides hooks for executing code before and after database operations.
 */
export interface IDatabaseMiddleware {
  /**
   * Execute code before a database operation.
   * @param params The parameters for the database operation.
   * @returns Promise that resolves to the potentially modified parameters.
   */
  beforeExecute(params: any): Promise<any>;

  /**
   * Execute code after a database operation.
   * @param result The result of the database operation.
   * @param params The original parameters for the database operation.
   * @returns Promise that resolves to the potentially modified result.
   */
  afterExecute(result: any, params: any): Promise<any>;

  /**
   * Handle an error that occurred during a database operation.
   * @param error The error that occurred.
   * @param params The original parameters for the database operation.
   * @returns Promise that resolves to a potentially transformed error.
   */
  onError(error: Error, params: any): Promise<Error>;
}

/**
 * Database service interface for the gamification engine.
 * Provides methods for accessing and manipulating gamification data.
 */
export interface IGamificationDatabaseService {
  /**
   * Get the Prisma service for direct database access.
   * @returns The Prisma service.
   */
  getPrismaService(): IPrismaService;

  /**
   * Get the transaction handler for managing database transactions.
   * @returns The transaction handler.
   */
  getTransactionHandler(): ITransactionHandler;

  /**
   * Get the journey context factory for creating journey-specific database contexts.
   * @returns The journey context factory.
   */
  getJourneyContextFactory(): IJourneyContextFactory;

  /**
   * Get the database error handler for processing database errors.
   * @returns The database error handler.
   */
  getErrorHandler(): IDatabaseErrorHandler;

  /**
   * Get a game profile by user ID.
   * @param userId The ID of the user.
   * @returns Promise that resolves to the game profile or null if not found.
   */
  getGameProfile(userId: string): Promise<GameProfile | null>;

  /**
   * Get achievements for a user.
   * @param userId The ID of the user.
   * @param journeyType Optional journey type to filter achievements.
   * @returns Promise that resolves to an array of achievements.
   */
  getAchievements(userId: string, journeyType?: JourneyType): Promise<Achievement[]>;

  /**
   * Get quests for a user.
   * @param userId The ID of the user.
   * @param journeyType Optional journey type to filter quests.
   * @returns Promise that resolves to an array of quests.
   */
  getQuests(userId: string, journeyType?: JourneyType): Promise<Quest[]>;

  /**
   * Get rewards for a user.
   * @param userId The ID of the user.
   * @param journeyType Optional journey type to filter rewards.
   * @returns Promise that resolves to an array of rewards.
   */
  getRewards(userId: string, journeyType?: JourneyType): Promise<Reward[]>;

  /**
   * Get rules for a journey type.
   * @param journeyType The journey type to get rules for.
   * @returns Promise that resolves to an array of rules.
   */
  getRules(journeyType: JourneyType): Promise<Rule[]>;

  /**
   * Process a gamification event.
   * @param event The event to process.
   * @returns Promise that resolves when the event is processed.
   */
  processEvent(event: GamificationEvent): Promise<void>;
}