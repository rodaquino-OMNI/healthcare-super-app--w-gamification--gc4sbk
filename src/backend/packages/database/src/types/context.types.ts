/**
 * @file context.types.ts
 * @description TypeScript interfaces and types for database contexts, which encapsulate database operations
 * for specific domains or features. These contexts act as facades over the raw database client, providing
 * strongly-typed methods tailored to specific business requirements while enforcing consistent access patterns
 * and error handling.
 * 
 * The database contexts are a key part of the AUSTA SuperApp's journey-centered architecture, providing
 * specialized database operations for each journey ("Minha Saúde", "Cuidar-me Agora", and "Meu Plano & Benefícios").
 * They ensure consistent error handling, connection pooling, transaction management, and data validation
 * across all services while maintaining journey-specific optimizations.
 */

import { PrismaClient } from '@prisma/client';
import { RedisClientType } from 'redis';

import { ConnectionManager } from '../connection/connection-manager';
import { ConnectionPoolOptions } from '../connection/connection-pool';
import { ConnectionRetryOptions } from '../connection/connection-retry';
import { DatabaseErrorType } from '../errors/database-error.types';
import { DatabaseException } from '../errors/database-error.exception';
import { RetryStrategy } from '../errors/retry-strategies';
import { TransactionClient, TransactionIsolationLevel, TransactionOptions } from '../transactions/transaction.interface';
import { JourneyType } from './journey.types';
import { DatabaseMiddleware } from '../middleware/middleware.interface';

/**
 * Base interface for all database contexts
 * Provides common operations and configuration options that all contexts should implement
 */
export interface DatabaseContext {
  /**
   * Unique identifier for this context instance
   */
  readonly contextId: string;

  /**
   * The type of database technology this context is using
   */
  readonly databaseType: DatabaseType;

  /**
   * Configuration options for this context
   */
  readonly config: DatabaseContextConfig;

  /**
   * Initialize the context with the given configuration
   * @param config Configuration options for this context
   * @throws DatabaseException if initialization fails
   */
  initialize(config?: Partial<DatabaseContextConfig>): Promise<void>;

  /**
   * Execute a function within a transaction
   * @param fn Function to execute within the transaction
   * @param options Transaction options including isolation level
   * @returns The result of the function execution
   * @throws DatabaseException if the transaction fails
   */
  transaction<T>(fn: (client: TransactionClient) => Promise<T>, options?: TransactionOptions): Promise<T>;

  /**
   * Execute a database operation with automatic error handling and retries
   * @param operationName Name of the operation for logging and metrics
   * @param operation Function implementing the operation
   * @param options Optional operation-specific options
   * @returns Result of the operation
   * @throws DatabaseException if the operation fails after retries
   */
  executeOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      retryStrategy?: RetryStrategy;
      timeout?: number;
    }
  ): Promise<T>;

  /**
   * Check if the context is healthy and ready to process operations
   * @returns True if the context is healthy, false otherwise
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get detailed health metrics for this context
   * @returns Object containing health metrics
   */
  getHealthMetrics(): Promise<DatabaseContextHealthMetrics>;

  /**
   * Close the context and release all resources
   * @throws DatabaseException if closing fails
   */
  close(): Promise<void>;
  
  /**
   * Register middleware to be applied to all operations in this context
   * @param middleware Middleware to register
   * @returns This context instance for chaining
   */
  registerMiddleware(middleware: any): DatabaseContext;
  
  /**
   * Get the connection manager used by this context
   * @returns The connection manager instance
   */
  getConnectionManager(): ConnectionManager;
  
  /**
   * Send a database event to the event system
   * @param eventType Type of database event
   * @param payload Event payload
   * @throws DatabaseException if event sending fails
   */
  sendDatabaseEvent(eventType: string, payload: Record<string, any>): Promise<void>;
}

/**
 * Supported database technologies
 */
export enum DatabaseType {
  POSTGRES = 'postgres',
  TIMESCALE = 'timescale',
  REDIS = 'redis',
  S3 = 's3'
}

/**
 * Configuration options for database contexts
 */
export interface DatabaseContextConfig {
  /**
   * Connection pool options
   */
  connectionPool: ConnectionPoolOptions;

  /**
   * Retry options for failed operations
   */
  retry: ConnectionRetryOptions;

  /**
   * Default transaction options
   */
  transaction: {
    /**
     * Default isolation level for transactions
     */
    defaultIsolationLevel: TransactionIsolationLevel;

    /**
     * Default timeout for transactions in milliseconds
     */
    defaultTimeout: number;

    /**
     * Whether to automatically retry failed transactions
     */
    autoRetry: boolean;

    /**
     * Maximum number of automatic retries for transactions
     */
    maxRetries: number;
  };

  /**
   * Error handling configuration
   */
  errorHandling: {
    /**
     * Error types that should be automatically retried
     */
    retryableErrors: DatabaseErrorType[];

    /**
     * Custom retry strategies for specific error types
     */
    retryStrategies: Record<DatabaseErrorType, RetryStrategy>;

    /**
     * Whether to log all errors
     */
    logAllErrors: boolean;
  };

  /**
   * Logging configuration
   */
  logging: {
    /**
     * Whether to log all queries
     */
    logQueries: boolean;

    /**
     * Whether to log slow queries
     */
    logSlowQueries: boolean;

    /**
     * Threshold in milliseconds for slow queries
     */
    slowQueryThreshold: number;
  };

  /**
   * Journey-specific configuration
   */
  journey?: {
    /**
     * Journey type this context is associated with
     */
    journeyType: JourneyType;

    /**
     * Journey-specific configuration options
     */
    options: Record<string, any>;
  };
}

/**
 * Health metrics for database contexts
 */
export interface DatabaseContextHealthMetrics {
  /**
   * Whether the context is connected to the database
   */
  isConnected: boolean;

  /**
   * Current number of active connections
   */
  activeConnections: number;

  /**
   * Current number of idle connections
   */
  idleConnections: number;

  /**
   * Average query execution time in milliseconds
   */
  avgQueryTime: number;

  /**
   * Number of failed operations in the last minute
   */
  failedOperationsLastMinute: number;

  /**
   * Number of successful operations in the last minute
   */
  successfulOperationsLastMinute: number;

  /**
   * Current state of the circuit breaker
   */
  circuitBreakerState: 'closed' | 'open' | 'half-open';

  /**
   * Additional technology-specific metrics
   */
  additionalMetrics?: Record<string, any>;
}

/**
 * Factory interface for creating database contexts
 */
export interface DatabaseContextFactory {
  /**
   * Create a new database context
   * @param config Configuration options for the context
   * @returns A new database context instance
   * @throws DatabaseException if context creation fails
   */
  createContext(config?: Partial<DatabaseContextConfig>): Promise<DatabaseContext>;

  /**
   * Create a new journey-specific database context
   * @param journeyType Type of journey this context is for
   * @param config Configuration options for the context
   * @returns A new journey-specific database context instance
   * @throws DatabaseException if context creation fails
   */
  createJourneyContext<T extends JourneyDatabaseContext>(
    journeyType: JourneyType,
    config?: Partial<DatabaseContextConfig>
  ): Promise<T>;
  
  /**
   * Create a specialized database context for a specific database technology
   * @param databaseType Type of database technology
   * @param config Configuration options for the context
   * @returns A new specialized database context instance
   * @throws DatabaseException if context creation fails
   */
  createSpecializedContext<T extends DatabaseContext>(
    databaseType: DatabaseType,
    config?: Partial<DatabaseContextConfig>
  ): Promise<T>;
  
  /**
   * Create a Health journey database context
   * @param config Configuration options for the context
   * @returns A new Health journey database context instance
   * @throws DatabaseException if context creation fails
   */
  createHealthContext(config?: Partial<DatabaseContextConfig>): Promise<HealthDatabaseContext>;
  
  /**
   * Create a Care journey database context
   * @param config Configuration options for the context
   * @returns A new Care journey database context instance
   * @throws DatabaseException if context creation fails
   */
  createCareContext(config?: Partial<DatabaseContextConfig>): Promise<CareDatabaseContext>;
  
  /**
   * Create a Plan journey database context
   * @param config Configuration options for the context
   * @returns A new Plan journey database context instance
   * @throws DatabaseException if context creation fails
   */
  createPlanContext(config?: Partial<DatabaseContextConfig>): Promise<PlanDatabaseContext>;
}

/**
 * Base interface for journey-specific database contexts
 * Extends the base DatabaseContext with journey-specific operations
 */
export interface JourneyDatabaseContext extends DatabaseContext {
  /**
   * The journey type this context is associated with
   */
  readonly journeyType: JourneyType;

  /**
   * Get journey-specific configuration
   * @returns Journey-specific configuration options
   */
  getJourneyConfig(): Record<string, any>;

  /**
   * Execute a journey-specific operation with automatic error handling and retries
   * @param operationName Name of the operation for logging and metrics
   * @param operation Function implementing the operation
   * @param options Optional operation-specific options
   * @returns Result of the operation
   * @throws DatabaseException if the operation fails after retries
   */
  executeJourneyOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    options?: {
      maxRetries?: number;
      retryStrategy?: RetryStrategy;
      timeout?: number;
      journeyContext?: Record<string, any>;
    }
  ): Promise<T>;
  
  /**
   * Send a journey-specific event to the gamification engine
   * @param eventType Type of journey event
   * @param userId User ID
   * @param payload Event payload
   * @throws DatabaseException if event sending fails
   */
  sendJourneyEvent(
    eventType: string,
    userId: string,
    payload: Record<string, any>
  ): Promise<void>;
  
  /**
   * Get journey-specific metrics for monitoring and observability
   * @returns Journey-specific metrics
   */
  getJourneyMetrics(): Promise<Record<string, any>>;
  
  /**
   * Validate journey-specific data against schema
   * @param dataType Type of data to validate
   * @param data Data to validate
   * @returns Validation result with errors if any
   */
  validateJourneyData(
    dataType: string,
    data: Record<string, any>
  ): Promise<{ valid: boolean; errors?: any[] }>;
}

/**
 * Prisma-specific database context interface
 * Extends the base DatabaseContext with Prisma-specific operations
 */
export interface PrismaDatabaseContext extends DatabaseContext {
  /**
   * Get the underlying Prisma client
   * @returns The Prisma client instance
   */
  getPrismaClient(): PrismaClient;

  /**
   * Execute a raw SQL query
   * @param query SQL query string
   * @param params Query parameters
   * @returns Query result
   */
  executeRaw<T = any>(query: string, params?: any[]): Promise<T>;

  /**
   * Execute a raw SQL query within a transaction
   * @param tx Transaction client
   * @param query SQL query string
   * @param params Query parameters
   * @returns Query result
   */
  executeRawInTransaction<T = any>(tx: TransactionClient, query: string, params?: any[]): Promise<T>;
}

/**
 * Redis-specific database context interface
 * Extends the base DatabaseContext with Redis-specific operations
 */
export interface RedisDatabaseContext extends DatabaseContext {
  /**
   * Get the underlying Redis client
   * @returns The Redis client instance
   */
  getRedisClient(): RedisClientType;

  /**
   * Set a key-value pair with optional expiration
   * @param key Key to set
   * @param value Value to set
   * @param expireInSeconds Expiration time in seconds
   */
  set(key: string, value: string, expireInSeconds?: number): Promise<void>;

  /**
   * Get a value by key
   * @param key Key to get
   * @returns Value associated with the key, or null if not found
   */
  get(key: string): Promise<string | null>;

  /**
   * Delete a key
   * @param key Key to delete
   * @returns True if the key was deleted, false otherwise
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a key exists
   * @param key Key to check
   * @returns True if the key exists, false otherwise
   */
  exists(key: string): Promise<boolean>;

  /**
   * Set a key's time to live in seconds
   * @param key Key to set expiration for
   * @param seconds Time to live in seconds
   * @returns True if the expiration was set, false otherwise
   */
  expire(key: string, seconds: number): Promise<boolean>;
}

/**
 * Health journey-specific database context interface
 * Extends the JourneyDatabaseContext with Health journey-specific operations
 * for the "Minha Saúde" journey
 */
export interface HealthDatabaseContext extends JourneyDatabaseContext, PrismaDatabaseContext {
  /**
   * Get time-series client for health metrics
   * @returns The time-series client for health metrics
   */
  getTimeSeriesClient(): any; // Replace with actual TimescaleDB client type

  /**
   * Store a health metric with timestamp
   * @param userId User ID
   * @param metricType Type of health metric
   * @param value Metric value
   * @param timestamp Timestamp of the metric
   * @param metadata Additional metadata
   * @returns The stored metric
   * @throws DatabaseException if the operation fails
   */
  storeHealthMetric(
    userId: string,
    metricType: string,
    value: number,
    timestamp?: Date,
    metadata?: Record<string, any>
  ): Promise<any>;

  /**
   * Query health metrics with time range and aggregation
   * @param userId User ID
   * @param metricType Type of health metric
   * @param startTime Start of time range
   * @param endTime End of time range
   * @param aggregation Aggregation function (avg, min, max, etc.)
   * @param interval Aggregation interval (hour, day, week, etc.)
   * @returns Aggregated metrics
   * @throws DatabaseException if the query fails
   */
  queryHealthMetrics(
    userId: string,
    metricType: string,
    startTime: Date,
    endTime: Date,
    aggregation?: string,
    interval?: string
  ): Promise<any[]>;
  
  /**
   * Create or update a health goal
   * @param userId User ID
   * @param goalType Type of health goal
   * @param targetValue Target value for the goal
   * @param startDate Start date for the goal
   * @param endDate End date for the goal
   * @param metadata Additional metadata
   * @returns The created or updated goal
   * @throws DatabaseException if the operation fails
   */
  upsertHealthGoal(
    userId: string,
    goalType: string,
    targetValue: number,
    startDate: Date,
    endDate: Date,
    metadata?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Track progress towards a health goal
   * @param goalId Goal ID
   * @param currentValue Current value
   * @param timestamp Timestamp of the progress update
   * @returns The updated goal progress
   * @throws DatabaseException if the operation fails
   */
  trackGoalProgress(
    goalId: string,
    currentValue: number,
    timestamp?: Date
  ): Promise<any>;
  
  /**
   * Connect a wearable device to a user account
   * @param userId User ID
   * @param deviceType Type of device
   * @param deviceId Device identifier
   * @param connectionData Connection data (tokens, etc.)
   * @returns The device connection
   * @throws DatabaseException if the operation fails
   */
  connectDevice(
    userId: string,
    deviceType: string,
    deviceId: string,
    connectionData: Record<string, any>
  ): Promise<any>;
  
  /**
   * Sync data from a connected device
   * @param userId User ID
   * @param deviceId Device identifier
   * @param dataType Type of data to sync
   * @param startTime Start of time range to sync
   * @param endTime End of time range to sync
   * @returns Sync result with metrics count
   * @throws DatabaseException if the sync fails
   */
  syncDeviceData(
    userId: string,
    deviceId: string,
    dataType: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ syncedMetrics: number; errors: any[] }>;
  
  /**
   * Store a medical event
   * @param userId User ID
   * @param eventType Type of medical event
   * @param eventDate Date of the event
   * @param provider Provider information
   * @param details Event details
   * @param attachmentIds IDs of attached documents
   * @returns The stored medical event
   * @throws DatabaseException if the operation fails
   */
  storeMedicalEvent(
    userId: string,
    eventType: string,
    eventDate: Date,
    provider?: Record<string, any>,
    details?: Record<string, any>,
    attachmentIds?: string[]
  ): Promise<any>;
  
  /**
   * Generate health insights based on user data
   * @param userId User ID
   * @param insightType Type of insight to generate
   * @param lookbackPeriod Period to analyze in days
   * @returns Generated insights
   * @throws DatabaseException if the operation fails
   */
  generateHealthInsights(
    userId: string,
    insightType: string,
    lookbackPeriod: number
  ): Promise<any[]>;
}

/**
 * Care journey-specific database context interface
 * Extends the JourneyDatabaseContext with Care journey-specific operations
 * for the "Cuidar-me Agora" journey
 */
export interface CareDatabaseContext extends JourneyDatabaseContext, PrismaDatabaseContext {
  /**
   * Find available appointment slots
   * @param providerId Provider ID
   * @param startDate Start date for availability search
   * @param endDate End date for availability search
   * @param specialtyId Optional specialty ID
   * @returns Available appointment slots
   * @throws DatabaseException if the query fails
   */
  findAvailableAppointmentSlots(
    providerId: string,
    startDate: Date,
    endDate: Date,
    specialtyId?: string
  ): Promise<any[]>;

  /**
   * Book an appointment
   * @param userId User ID
   * @param providerId Provider ID
   * @param startTime Appointment start time
   * @param endTime Appointment end time
   * @param appointmentType Type of appointment
   * @param notes Additional notes
   * @returns The booked appointment
   * @throws DatabaseException if the booking fails
   */
  bookAppointment(
    userId: string,
    providerId: string,
    startTime: Date,
    endTime: Date,
    appointmentType: string,
    notes?: string
  ): Promise<any>;

  /**
   * Get medication adherence data
   * @param userId User ID
   * @param startDate Start date for adherence data
   * @param endDate End date for adherence data
   * @returns Medication adherence data
   * @throws DatabaseException if the query fails
   */
  getMedicationAdherence(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any>;
  
  /**
   * Record medication intake
   * @param userId User ID
   * @param medicationId Medication ID
   * @param intakeTime Time of intake
   * @param dosage Dosage taken
   * @param notes Additional notes
   * @returns The recorded medication intake
   * @throws DatabaseException if the operation fails
   */
  recordMedicationIntake(
    userId: string,
    medicationId: string,
    intakeTime: Date,
    dosage: number,
    notes?: string
  ): Promise<any>;
  
  /**
   * Find healthcare providers by criteria
   * @param specialtyId Specialty ID
   * @param location Location coordinates or address
   * @param maxDistance Maximum distance in kilometers
   * @param filters Additional filters
   * @returns Matching healthcare providers
   * @throws DatabaseException if the query fails
   */
  findProviders(
    specialtyId?: string,
    location?: { lat: number; lng: number } | string,
    maxDistance?: number,
    filters?: Record<string, any>
  ): Promise<any[]>;
  
  /**
   * Create or update a treatment plan
   * @param userId User ID
   * @param providerId Provider ID
   * @param diagnosis Diagnosis information
   * @param treatments Treatment details
   * @param startDate Start date of the treatment plan
   * @param endDate End date of the treatment plan
   * @returns The created or updated treatment plan
   * @throws DatabaseException if the operation fails
   */
  upsertTreatmentPlan(
    userId: string,
    providerId: string,
    diagnosis: Record<string, any>,
    treatments: Record<string, any>[],
    startDate: Date,
    endDate?: Date
  ): Promise<any>;
  
  /**
   * Track treatment progress
   * @param treatmentPlanId Treatment plan ID
   * @param progressData Progress data
   * @param recordedAt Time when progress was recorded
   * @returns The updated treatment progress
   * @throws DatabaseException if the operation fails
   */
  trackTreatmentProgress(
    treatmentPlanId: string,
    progressData: Record<string, any>,
    recordedAt?: Date
  ): Promise<any>;
  
  /**
   * Create a telemedicine session
   * @param userId User ID
   * @param providerId Provider ID
   * @param scheduledTime Scheduled time for the session
   * @param sessionType Type of telemedicine session
   * @param metadata Additional metadata
   * @returns The created telemedicine session
   * @throws DatabaseException if the operation fails
   */
  createTelemedicineSession(
    userId: string,
    providerId: string,
    scheduledTime: Date,
    sessionType: string,
    metadata?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Update telemedicine session status
   * @param sessionId Session ID
   * @param status New status
   * @param metadata Additional metadata
   * @returns The updated telemedicine session
   * @throws DatabaseException if the operation fails
   */
  updateTelemedicineSessionStatus(
    sessionId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Process symptom checker input
   * @param userId User ID
   * @param symptoms Reported symptoms
   * @param demographics User demographics
   * @param medicalHistory Medical history information
   * @returns Symptom checker results
   * @throws DatabaseException if the operation fails
   */
  processSymptomCheckerInput(
    userId: string,
    symptoms: Record<string, any>[],
    demographics: Record<string, any>,
    medicalHistory?: Record<string, any>
  ): Promise<any>;
}

/**
 * Plan journey-specific database context interface
 * Extends the JourneyDatabaseContext with Plan journey-specific operations
 * for the "Meu Plano & Benefícios" journey
 */
export interface PlanDatabaseContext extends JourneyDatabaseContext, PrismaDatabaseContext {
  /**
   * Get user's insurance plan details
   * @param userId User ID
   * @returns Insurance plan details
   * @throws DatabaseException if the query fails
   */
  getUserPlanDetails(userId: string): Promise<any>;

  /**
   * Submit an insurance claim
   * @param userId User ID
   * @param claimData Claim data
   * @param documentIds Associated document IDs
   * @returns The submitted claim
   * @throws DatabaseException if the submission fails
   */
  submitClaim(
    userId: string,
    claimData: Record<string, any>,
    documentIds?: string[]
  ): Promise<any>;

  /**
   * Get user's benefit utilization
   * @param userId User ID
   * @param benefitType Optional benefit type filter
   * @param year Optional year filter
   * @returns Benefit utilization data
   * @throws DatabaseException if the query fails
   */
  getBenefitUtilization(
    userId: string,
    benefitType?: string,
    year?: number
  ): Promise<any>;
  
  /**
   * Compare insurance plans
   * @param planIds IDs of plans to compare
   * @param userProfile User profile for personalized comparison
   * @returns Comparison data for the specified plans
   * @throws DatabaseException if the comparison fails
   */
  comparePlans(
    planIds: string[],
    userProfile?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Enroll user in an insurance plan
   * @param userId User ID
   * @param planId Plan ID
   * @param coverageStart Coverage start date
   * @param dependents Optional dependent information
   * @param paymentMethod Payment method details
   * @returns Enrollment details
   * @throws DatabaseException if the enrollment fails
   */
  enrollInPlan(
    userId: string,
    planId: string,
    coverageStart: Date,
    dependents?: Record<string, any>[],
    paymentMethod?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Upload and store a document
   * @param userId User ID
   * @param documentType Type of document
   * @param documentData Document data or reference
   * @param metadata Additional metadata
   * @returns The stored document reference
   * @throws DatabaseException if the upload fails
   */
  storeDocument(
    userId: string,
    documentType: string,
    documentData: Buffer | string,
    metadata?: Record<string, any>
  ): Promise<any>;
  
  /**
   * Retrieve a document
   * @param documentId Document ID
   * @param userId User ID for authorization
   * @returns The document data and metadata
   * @throws DatabaseException if the retrieval fails
   */
  retrieveDocument(
    documentId: string,
    userId: string
  ): Promise<{ data: Buffer | string; metadata: Record<string, any> }>;
  
  /**
   * Check coverage for a specific service or procedure
   * @param userId User ID
   * @param serviceCode Service or procedure code
   * @param providerNPI Optional provider NPI for in-network check
   * @returns Coverage information including copay, coinsurance, and limits
   * @throws DatabaseException if the coverage check fails
   */
  checkCoverage(
    userId: string,
    serviceCode: string,
    providerNPI?: string
  ): Promise<any>;
  
  /**
   * Track claim status
   * @param claimId Claim ID
   * @param userId User ID for authorization
   * @returns Current claim status and history
   * @throws DatabaseException if the status check fails
   */
  trackClaimStatus(
    claimId: string,
    userId: string
  ): Promise<{ status: string; history: any[]; details: Record<string, any> }>;
  
  /**
   * Calculate out-of-pocket expenses
   * @param userId User ID
   * @param year Year for calculation
   * @param categoryFilter Optional category filter
   * @returns Out-of-pocket expense summary
   * @throws DatabaseException if the calculation fails
   */
  calculateOutOfPocketExpenses(
    userId: string,
    year: number,
    categoryFilter?: string[]
  ): Promise<{ total: number; byCategory: Record<string, number>; remaining: number }>;
}

/**
 * Default configuration for database contexts
 */
export const DEFAULT_DATABASE_CONTEXT_CONFIG: DatabaseContextConfig = {
  connectionPool: {
    min: 2,
    max: 10,
    idle: 10000,
    acquire: 30000,
    evict: 60000,
  },
  retry: {
    maxRetries: 3,
    initialDelay: 100,
    maxDelay: 1000,
    backoffFactor: 2,
    jitter: true,
  },
  transaction: {
    defaultIsolationLevel: TransactionIsolationLevel.READ_COMMITTED,
    defaultTimeout: 5000,
    autoRetry: true,
    maxRetries: 3,
  },
  errorHandling: {
    retryableErrors: [
      DatabaseErrorType.CONNECTION_ERROR,
      DatabaseErrorType.TIMEOUT_ERROR,
      DatabaseErrorType.DEADLOCK_ERROR,
    ],
    retryStrategies: {} as Record<DatabaseErrorType, RetryStrategy>,
    logAllErrors: true,
  },
  logging: {
    logQueries: false,
    logSlowQueries: true,
    slowQueryThreshold: 1000,
  },
};

/**
 * Default configuration for Health journey database contexts
 */
export const DEFAULT_HEALTH_CONTEXT_CONFIG: DatabaseContextConfig = {
  ...DEFAULT_DATABASE_CONTEXT_CONFIG,
  connectionPool: {
    ...DEFAULT_DATABASE_CONTEXT_CONFIG.connectionPool,
    // Health journey requires more connections for time-series data
    min: 5,
    max: 20,
  },
  journey: {
    journeyType: JourneyType.HEALTH,
    options: {
      // Health journey specific options
      enableTimeSeriesOptimization: true,
      enableWearableIntegration: true,
      healthMetricsBatchSize: 100,
      enableFHIRCompatibility: true,
    },
  },
};

/**
 * Default configuration for Care journey database contexts
 */
export const DEFAULT_CARE_CONTEXT_CONFIG: DatabaseContextConfig = {
  ...DEFAULT_DATABASE_CONTEXT_CONFIG,
  transaction: {
    ...DEFAULT_DATABASE_CONTEXT_CONFIG.transaction,
    // Care journey requires serializable isolation for appointment booking
    defaultIsolationLevel: TransactionIsolationLevel.SERIALIZABLE,
  },
  journey: {
    journeyType: JourneyType.CARE,
    options: {
      // Care journey specific options
      enableProviderCaching: true,
      appointmentSlotLockTimeSeconds: 300,
      enableTelemedicineIntegration: true,
    },
  },
};

/**
 * Default configuration for Plan journey database contexts
 */
export const DEFAULT_PLAN_CONTEXT_CONFIG: DatabaseContextConfig = {
  ...DEFAULT_DATABASE_CONTEXT_CONFIG,
  retry: {
    ...DEFAULT_DATABASE_CONTEXT_CONFIG.retry,
    // Plan journey requires more retries for insurance system integration
    maxRetries: 5,
    maxDelay: 2000,
  },
  journey: {
    journeyType: JourneyType.PLAN,
    options: {
      // Plan journey specific options
      enableInsuranceSystemIntegration: true,
      enableDocumentStorage: true,
      claimProcessingBatchSize: 50,
    },
  },
};

/**
 * Context creation options
 */
export interface ContextCreationOptions {
  /**
   * Connection manager to use for this context
   */
  connectionManager: ConnectionManager;

  /**
   * Configuration options for this context
   */
  config?: Partial<DatabaseContextConfig>;

  /**
   * Journey type for journey-specific contexts
   */
  journeyType?: JourneyType;

  /**
   * Database type for this context
   */
  databaseType: DatabaseType;
  
  /**
   * Middleware to apply to this context
   */
  middleware?: DatabaseMiddleware[];
  
  /**
   * Parent context for nested contexts
   */
  parentContext?: DatabaseContext;
  
  /**
   * Whether to enable cross-journey operations
   */
  enableCrossJourneyOperations?: boolean;
}

/**
 * Database operation options
 */
export interface DatabaseOperationOptions {
  /**
   * Maximum number of retries for this operation
   */
  maxRetries?: number;
  
  /**
   * Retry strategy for this operation
   */
  retryStrategy?: RetryStrategy;
  
  /**
   * Timeout for this operation in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to use a transaction for this operation
   */
  useTransaction?: boolean;
  
  /**
   * Transaction options if useTransaction is true
   */
  transactionOptions?: TransactionOptions;
  
  /**
   * Journey context for journey-specific operations
   */
  journeyContext?: Record<string, any>;
  
  /**
   * Whether to track this operation for metrics
   */
  trackMetrics?: boolean;
  
  /**
   * Whether to log this operation
   */
  logOperation?: boolean;
}

/**
 * Database event types for internal event system
 */
export enum DatabaseEventType {
  QUERY_EXECUTED = 'query_executed',
  TRANSACTION_STARTED = 'transaction_started',
  TRANSACTION_COMMITTED = 'transaction_committed',
  TRANSACTION_ROLLED_BACK = 'transaction_rolled_back',
  CONNECTION_CREATED = 'connection_created',
  CONNECTION_RELEASED = 'connection_released',
  ERROR_OCCURRED = 'error_occurred',
  CONTEXT_INITIALIZED = 'context_initialized',
  CONTEXT_CLOSED = 'context_closed',
  JOURNEY_OPERATION = 'journey_operation',
  MIDDLEWARE_APPLIED = 'middleware_applied',
}