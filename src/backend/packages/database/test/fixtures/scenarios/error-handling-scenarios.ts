/**
 * Database Error Handling Test Scenarios
 * 
 * This file provides comprehensive test fixtures for database error handling scenarios,
 * including connection failures, constraint violations, timeout errors, and deadlocks.
 * These fixtures simulate various error conditions to ensure the enhanced PrismaService
 * properly detects, classifies, and handles database errors with appropriate recovery strategies.
 */

import { 
  DatabaseErrorType, 
  DatabaseErrorSeverity, 
  DatabaseErrorRecoverability,
  DatabaseErrorContext,
  DatabaseErrorClassification,
  JourneyContext,
  DatabaseOperationContext
} from '../../../src/errors/database-error.types';

import * as ErrorCodes from '../../../src/errors/database-error.codes';

// ===== TYPES FOR TEST FIXTURES =====

/**
 * Interface for database error test scenario
 */
export interface DatabaseErrorScenario {
  /**
   * Unique identifier for the scenario
   */
  id: string;
  
  /**
   * Description of the error scenario
   */
  description: string;
  
  /**
   * The mock error object
   */
  error: Error;
  
  /**
   * The database operation context
   */
  context: DatabaseErrorContext;
  
  /**
   * The expected error classification result
   */
  expectedClassification: DatabaseErrorClassification;
  
  /**
   * Whether this scenario should be retried
   */
  shouldRetry: boolean;
  
  /**
   * The journey this scenario is specific to (if any)
   */
  journey?: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth';
}

/**
 * Interface for a collection of related error scenarios
 */
export interface DatabaseErrorScenarioGroup {
  /**
   * The group name
   */
  name: string;
  
  /**
   * Description of the scenario group
   */
  description: string;
  
  /**
   * The error scenarios in this group
   */
  scenarios: DatabaseErrorScenario[];
}

// ===== HELPER FUNCTIONS =====

/**
 * Creates a mock Prisma error
 * 
 * @param code The Prisma error code
 * @param message The error message
 * @param meta Additional metadata for the error
 * @returns A mock Prisma error
 */
function createPrismaError(code: string, message: string, meta: Record<string, any> = {}): Error {
  const error: any = new Error(message);
  error.code = code;
  error.meta = meta;
  error.name = 'PrismaClientKnownRequestError';
  return error;
}

/**
 * Creates a mock PostgreSQL error
 * 
 * @param code The PostgreSQL error code
 * @param message The error message
 * @param severity The PostgreSQL error severity
 * @returns A mock PostgreSQL error
 */
function createPostgresError(code: string, message: string, severity: string = 'ERROR'): Error {
  const error: any = new Error(message);
  error.code = code;
  error.severity = severity;
  error.name = 'PostgresError';
  return error;
}

/**
 * Creates a mock Redis error
 * 
 * @param message The error message
 * @param command The Redis command that failed
 * @returns A mock Redis error
 */
function createRedisError(message: string, command?: string): Error {
  const error: any = new Error(message);
  error.command = command;
  error.name = 'RedisError';
  return error;
}

/**
 * Creates a mock database timeout error
 * 
 * @param message The error message
 * @param timeout The timeout in milliseconds
 * @returns A mock timeout error
 */
function createTimeoutError(message: string, timeout: number): Error {
  const error: any = new Error(message);
  error.timeout = timeout;
  error.name = 'TimeoutError';
  return error;
}

// ===== CONNECTION ERROR SCENARIOS =====

export const connectionErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Connection Errors',
  description: 'Scenarios for testing database connection error handling',
  scenarios: [
    // Connection failure scenario
    {
      id: 'conn-failure-001',
      description: 'Failed to establish connection to PostgreSQL database',
      error: createPrismaError(
        'P1001',
        'Can\'t reach database server at `postgres:5432`',
        { target: 'connection' }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'database-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_PG_FAILED,
        message: 'Failed to establish connection to the database server',
        details: {
          target: 'connection',
        },
      },
      shouldRetry: true,
    },
    
    // Connection timeout scenario
    {
      id: 'conn-timeout-001',
      description: 'Connection timeout to PostgreSQL database',
      error: createTimeoutError(
        'Connection timed out after 30000ms',
        30000
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'database-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_PG_TIMEOUT,
        message: 'Database connection timed out',
        details: {
          timeout: 30000,
        },
      },
      shouldRetry: true,
    },
    
    // Connection authentication failure scenario
    {
      id: 'conn-auth-001',
      description: 'Authentication failed for PostgreSQL database',
      error: createPrismaError(
        'P1010',
        'Authentication failed against database server at `postgres:5432`',
        { target: 'connection' }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'database-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONN_PG_REJECTED,
        message: 'Authentication failed against database server',
        details: {
          target: 'connection',
        },
      },
      shouldRetry: false,
    },
    
    // Connection pool exhaustion scenario
    {
      id: 'conn-pool-001',
      description: 'Connection pool exhausted',
      error: createPrismaError(
        'P1040',
        'Connection pool exhausted: max size of 10 connections reached',
        { pool_size: 10 }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'connection-pool',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_PG_POOL_EXHAUSTED,
        message: 'Database connection pool exhausted',
        details: {
          pool_size: 10,
        },
      },
      shouldRetry: true,
    },
    
    // Redis connection failure scenario
    {
      id: 'conn-redis-001',
      description: 'Failed to establish connection to Redis',
      error: createRedisError(
        'Error connecting to Redis at redis:6379: Connection refused',
      ),
      context: {
        operation: 'connect',
        entity: 'redis',
        feature: 'cache',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_CONN_REDIS_FAILED,
        message: 'Failed to establish connection to Redis server',
        details: {},
      },
      shouldRetry: true,
    },
  ],
};

// ===== QUERY ERROR SCENARIOS =====

export const queryErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Query Errors',
  description: 'Scenarios for testing database query error handling',
  scenarios: [
    // SQL syntax error scenario
    {
      id: 'query-syntax-001',
      description: 'SQL syntax error in query',
      error: createPrismaError(
        'P2010',
        'Raw query failed. Code: `22P02`. Message: `invalid input syntax for type integer: "abc"`',
        { code: '22P02' }
      ),
      context: {
        operation: 'findUnique',
        entity: 'User',
        query: 'SELECT * FROM "User" WHERE id = $1',
        params: { id: 'abc' },
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_PG_SYNTAX,
        message: 'Invalid query syntax: invalid input syntax for type integer',
        details: {
          code: '22P02',
          query: 'SELECT * FROM "User" WHERE id = $1',
          params: { id: 'abc' },
        },
      },
      shouldRetry: false,
    },
    
    // Query timeout scenario
    {
      id: 'query-timeout-001',
      description: 'Query execution timeout',
      error: createTimeoutError(
        'Query execution timed out after 15000ms',
        15000
      ),
      context: {
        operation: 'findMany',
        entity: 'HealthMetric',
        query: 'SELECT * FROM "HealthMetric" WHERE userId = $1 ORDER BY timestamp DESC',
        params: { userId: 123 },
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_QUERY_PG_TIMEOUT,
        message: 'Database query execution timed out',
        details: {
          timeout: 15000,
          query: 'SELECT * FROM "HealthMetric" WHERE userId = $1 ORDER BY timestamp DESC',
        },
      },
      shouldRetry: true,
      journey: 'health',
    },
    
    // Query permission denied scenario
    {
      id: 'query-permission-001',
      description: 'Permission denied for query execution',
      error: createPostgresError(
        '42501',
        'permission denied for table "User"',
        'ERROR'
      ),
      context: {
        operation: 'findMany',
        entity: 'User',
        query: 'SELECT * FROM "User"',
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_PG_PERMISSION_DENIED,
        message: 'Permission denied for database operation',
        details: {
          code: '42501',
          entity: 'User',
        },
      },
      shouldRetry: false,
    },
    
    // Redis query error scenario
    {
      id: 'query-redis-001',
      description: 'Redis wrong type operation error',
      error: createRedisError(
        'WRONGTYPE Operation against a key holding the wrong kind of value',
        'HGET'
      ),
      context: {
        operation: 'hget',
        entity: 'cache',
        feature: 'leaderboard',
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_QUERY_REDIS_WRONG_TYPE,
        message: 'Redis operation against a key holding the wrong kind of value',
        details: {
          command: 'HGET',
        },
      },
      shouldRetry: false,
      journey: 'gamification',
    },
  ],
};

// ===== TRANSACTION ERROR SCENARIOS =====

export const transactionErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Transaction Errors',
  description: 'Scenarios for testing database transaction error handling',
  scenarios: [
    // Transaction begin failure scenario
    {
      id: 'trans-begin-001',
      description: 'Failed to begin transaction',
      error: createPrismaError(
        'P2028',
        'Transaction API error: Unable to start transaction',
        { cause: 'Connection lost' }
      ),
      context: {
        operation: 'transaction',
        entity: 'database',
        feature: 'transaction-management',
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_PG_BEGIN_FAILED,
        message: 'Failed to begin database transaction',
        details: {
          cause: 'Connection lost',
        },
      },
      shouldRetry: true,
    },
    
    // Transaction commit failure scenario
    {
      id: 'trans-commit-001',
      description: 'Failed to commit transaction',
      error: createPrismaError(
        'P2034',
        'Transaction API error: Could not commit transaction',
        { cause: 'Connection terminated' }
      ),
      context: {
        operation: 'transaction',
        entity: 'database',
        feature: 'transaction-management',
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_PG_COMMIT_FAILED,
        message: 'Failed to commit database transaction',
        details: {
          cause: 'Connection terminated',
        },
      },
      shouldRetry: true,
    },
    
    // Deadlock scenario
    {
      id: 'trans-deadlock-001',
      description: 'Deadlock detected during transaction',
      error: createPostgresError(
        '40P01',
        'deadlock detected',
        'ERROR'
      ),
      context: {
        operation: 'update',
        entity: 'Appointment',
        query: 'UPDATE "Appointment" SET status = $1 WHERE id = $2',
        params: { status: 'CONFIRMED', id: 123 },
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_PG_DEADLOCK,
        message: 'Deadlock detected during database operation',
        details: {
          code: '40P01',
          entity: 'Appointment',
        },
      },
      shouldRetry: true,
      journey: 'care',
    },
    
    // Serialization failure scenario
    {
      id: 'trans-serialization-001',
      description: 'Serialization failure in transaction',
      error: createPostgresError(
        '40001',
        'could not serialize access due to concurrent update',
        'ERROR'
      ),
      context: {
        operation: 'update',
        entity: 'HealthMetric',
        query: 'UPDATE "HealthMetric" SET value = $1 WHERE id = $2',
        params: { value: 75, id: 456 },
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_PG_SERIALIZATION,
        message: 'Serialization failure due to concurrent updates',
        details: {
          code: '40001',
          entity: 'HealthMetric',
        },
      },
      shouldRetry: true,
      journey: 'health',
    },
    
    // Redis transaction failure scenario
    {
      id: 'trans-redis-001',
      description: 'Redis EXEC command failed',
      error: createRedisError(
        'EXECABORT Transaction discarded because of previous errors',
        'EXEC'
      ),
      context: {
        operation: 'exec',
        entity: 'redis',
        feature: 'leaderboard-update',
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_TRANS_REDIS_EXEC_FAILED,
        message: 'Redis transaction execution failed',
        details: {
          command: 'EXEC',
        },
      },
      shouldRetry: true,
      journey: 'gamification',
    },
  ],
};

// ===== INTEGRITY ERROR SCENARIOS =====

export const integrityErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Integrity Errors',
  description: 'Scenarios for testing database integrity error handling',
  scenarios: [
    // Unique constraint violation scenario
    {
      id: 'integrity-unique-001',
      description: 'Unique constraint violation',
      error: createPrismaError(
        'P2002',
        'Unique constraint failed on the constraint: `User_email_key`',
        { target: ['email'] }
      ),
      context: {
        operation: 'create',
        entity: 'User',
        params: { email: 'user@example.com', name: 'Test User' },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEG_PG_UNIQUE,
        message: 'A record with this email already exists',
        details: {
          target: ['email'],
          constraint: 'User_email_key',
        },
      },
      shouldRetry: false,
      journey: 'auth',
    },
    
    // Foreign key constraint violation scenario
    {
      id: 'integrity-fk-001',
      description: 'Foreign key constraint violation',
      error: createPrismaError(
        'P2003',
        'Foreign key constraint failed on the field: `userId`',
        { field_name: 'userId' }
      ),
      context: {
        operation: 'create',
        entity: 'HealthMetric',
        params: { userId: 999, type: 'HEART_RATE', value: 75 },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEG_PG_FOREIGN_KEY,
        message: 'Referenced user does not exist',
        details: {
          field: 'userId',
        },
      },
      shouldRetry: false,
      journey: 'health',
    },
    
    // Not null constraint violation scenario
    {
      id: 'integrity-notnull-001',
      description: 'Not null constraint violation',
      error: createPrismaError(
        'P2011',
        'Null constraint violation on the field: `date`',
        { field_name: 'date' }
      ),
      context: {
        operation: 'create',
        entity: 'Appointment',
        params: { providerId: 123, userId: 456, status: 'SCHEDULED' },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEG_PG_NOT_NULL,
        message: 'Appointment date is required',
        details: {
          field: 'date',
        },
      },
      shouldRetry: false,
      journey: 'care',
    },
    
    // Check constraint violation scenario
    {
      id: 'integrity-check-001',
      description: 'Check constraint violation',
      error: createPostgresError(
        '23514',
        'check constraint "positive_amount" violated',
        'ERROR'
      ),
      context: {
        operation: 'create',
        entity: 'Claim',
        params: { userId: 123, amount: -50, type: 'MEDICAL' },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEG_PG_CHECK,
        message: 'Claim amount must be positive',
        details: {
          constraint: 'positive_amount',
          entity: 'Claim',
        },
      },
      shouldRetry: false,
      journey: 'plan',
    },
    
    // Redis key exists error scenario
    {
      id: 'integrity-redis-001',
      description: 'Redis key already exists',
      error: createRedisError(
        'SET failed: key already exists',
        'SET'
      ),
      context: {
        operation: 'set',
        entity: 'cache',
        params: { key: 'user:123:session', value: 'xyz', nx: true },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_INTEG_REDIS_KEY_EXISTS,
        message: 'Redis key already exists',
        details: {
          command: 'SET',
          key: 'user:123:session',
        },
      },
      shouldRetry: false,
    },
  ],
};

// ===== CONFIGURATION ERROR SCENARIOS =====

export const configurationErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Configuration Errors',
  description: 'Scenarios for testing database configuration error handling',
  scenarios: [
    // Invalid connection URL scenario
    {
      id: 'config-url-001',
      description: 'Invalid PostgreSQL connection URL',
      error: createPrismaError(
        'P1013',
        'The provided database string is invalid. Invalid URL',
        { database_url: 'postgres://:5432/mydb' }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'database-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONFIG_PG_INVALID_URL,
        message: 'Invalid database connection URL',
        details: {
          database_url: 'postgres://:5432/mydb',
        },
      },
      shouldRetry: false,
    },
    
    // Invalid schema scenario
    {
      id: 'config-schema-001',
      description: 'Invalid database schema',
      error: createPrismaError(
        'P1012',
        'Schema validation error: Missing required field `id` in model `User`',
        { modelName: 'User', missingField: 'id' }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'schema-validation',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONFIG_PG_INVALID_SCHEMA,
        message: 'Invalid database schema configuration',
        details: {
          modelName: 'User',
          missingField: 'id',
        },
      },
      shouldRetry: false,
    },
    
    // Invalid connection pool configuration scenario
    {
      id: 'config-pool-001',
      description: 'Invalid connection pool configuration',
      error: createPrismaError(
        'P1014',
        'The underlying connection pool failed to start',
        { cause: 'Invalid pool size: -5' }
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'connection-pool',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONFIG_PG_INVALID_POOL,
        message: 'Invalid database connection pool configuration',
        details: {
          cause: 'Invalid pool size: -5',
        },
      },
      shouldRetry: false,
    },
    
    // Invalid Redis URL scenario
    {
      id: 'config-redis-001',
      description: 'Invalid Redis connection URL',
      error: createRedisError(
        'Invalid Redis URL: redis://:@:6379',
      ),
      context: {
        operation: 'connect',
        entity: 'redis',
        feature: 'cache-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CONFIG_REDIS_INVALID_URL,
        message: 'Invalid Redis connection URL',
        details: {},
      },
      shouldRetry: false,
    },
  ],
};

// ===== JOURNEY-SPECIFIC ERROR SCENARIOS =====

export const healthJourneyErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Health Journey Errors',
  description: 'Scenarios for testing health journey-specific database error handling',
  scenarios: [
    // Invalid health metric data scenario
    {
      id: 'health-metric-001',
      description: 'Invalid health metric data',
      error: createPrismaError(
        'P2009',
        'Failed to validate the query',
        { cause: 'Value out of range for type' }
      ),
      context: {
        operation: 'create',
        entity: 'HealthMetric',
        journey: 'health',
        feature: 'metrics',
        params: { type: 'HEART_RATE', value: 500 }, // Heart rate too high
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_HEALTH_METRIC_INVALID,
        message: 'Invalid health metric value',
        details: {
          cause: 'Value out of range for type',
          metricType: 'HEART_RATE',
          value: 500,
        },
        journeyContext: {
          journey: 'health',
          feature: 'metrics',
        },
      },
      shouldRetry: false,
      journey: 'health',
    },
    
    // Device sync failure scenario
    {
      id: 'health-device-001',
      description: 'Failed to sync device data',
      error: createTimeoutError(
        'Device sync operation timed out after 60000ms',
        60000
      ),
      context: {
        operation: 'create',
        entity: 'DeviceSync',
        journey: 'health',
        feature: 'devices',
        params: { deviceId: 'fitbit-123', userId: 456 },
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: ErrorCodes.DB_HEALTH_DEVICE_SYNC_FAILED,
        message: 'Failed to sync device data',
        details: {
          timeout: 60000,
          deviceId: 'fitbit-123',
        },
        journeyContext: {
          journey: 'health',
          feature: 'devices',
        },
      },
      shouldRetry: true,
      journey: 'health',
    },
  ],
};

export const careJourneyErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Care Journey Errors',
  description: 'Scenarios for testing care journey-specific database error handling',
  scenarios: [
    // Appointment conflict scenario
    {
      id: 'care-appointment-001',
      description: 'Appointment scheduling conflict',
      error: createPrismaError(
        'P2002',
        'Unique constraint failed on the constraint: `Appointment_provider_id_date_time_key`',
        { target: ['providerId', 'date', 'time'] }
      ),
      context: {
        operation: 'create',
        entity: 'Appointment',
        journey: 'care',
        feature: 'appointments',
        params: { 
          providerId: 123, 
          userId: 456, 
          date: '2023-06-15', 
          time: '14:00:00',
          status: 'SCHEDULED' 
        },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CARE_APPOINTMENT_CONFLICT,
        message: 'Provider already has an appointment at this time',
        details: {
          target: ['providerId', 'date', 'time'],
          constraint: 'Appointment_provider_id_date_time_key',
          providerId: 123,
          date: '2023-06-15',
          time: '14:00:00',
        },
        journeyContext: {
          journey: 'care',
          feature: 'appointments',
        },
      },
      shouldRetry: false,
      journey: 'care',
    },
    
    // Provider not found scenario
    {
      id: 'care-provider-001',
      description: 'Care provider not found',
      error: createPrismaError(
        'P2025',
        'Record to update not found',
        { cause: 'No Provider record found for id=999' }
      ),
      context: {
        operation: 'update',
        entity: 'Provider',
        journey: 'care',
        feature: 'providers',
        params: { id: 999, status: 'ACTIVE' },
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_CARE_PROVIDER_NOT_FOUND,
        message: 'Provider not found',
        details: {
          cause: 'No Provider record found for id=999',
          providerId: 999,
        },
        journeyContext: {
          journey: 'care',
          feature: 'providers',
        },
      },
      shouldRetry: false,
      journey: 'care',
    },
  ],
};

export const planJourneyErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Plan Journey Errors',
  description: 'Scenarios for testing plan journey-specific database error handling',
  scenarios: [
    // Duplicate claim submission scenario
    {
      id: 'plan-claim-001',
      description: 'Duplicate claim submission',
      error: createPrismaError(
        'P2002',
        'Unique constraint failed on the constraint: `Claim_receipt_number_key`',
        { target: ['receiptNumber'] }
      ),
      context: {
        operation: 'create',
        entity: 'Claim',
        journey: 'plan',
        feature: 'claims',
        params: { 
          userId: 123, 
          amount: 150.00, 
          receiptNumber: 'RN12345', 
          type: 'MEDICAL' 
        },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_PLAN_CLAIM_DUPLICATE,
        message: 'A claim with this receipt number already exists',
        details: {
          target: ['receiptNumber'],
          constraint: 'Claim_receipt_number_key',
          receiptNumber: 'RN12345',
        },
        journeyContext: {
          journey: 'plan',
          feature: 'claims',
        },
      },
      shouldRetry: false,
      journey: 'plan',
    },
    
    // Document storage error scenario
    {
      id: 'plan-document-001',
      description: 'Plan document storage error',
      error: createPrismaError(
        'P2000',
        'The provided value for the column is too long for the column\'s type',
        { column_name: 'documentUrl', model_name: 'Document' }
      ),
      context: {
        operation: 'create',
        entity: 'Document',
        journey: 'plan',
        feature: 'documents',
        params: { 
          userId: 123, 
          type: 'INSURANCE_CARD', 
          documentUrl: 'https://very-long-url-that-exceeds-the-maximum-length-allowed-by-the-database-schema-and-causes-an-error-when-trying-to-store-it-in-the-database.com/document.pdf' 
        },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_PLAN_DOCUMENT_STORAGE,
        message: 'Document URL is too long',
        details: {
          column: 'documentUrl',
          model: 'Document',
        },
        journeyContext: {
          journey: 'plan',
          feature: 'documents',
        },
      },
      shouldRetry: false,
      journey: 'plan',
    },
  ],
};

export const gamificationErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Gamification Errors',
  description: 'Scenarios for testing gamification-specific database error handling',
  scenarios: [
    // Invalid event data scenario
    {
      id: 'game-event-001',
      description: 'Invalid gamification event data',
      error: createPrismaError(
        'P2009',
        'Failed to validate the query',
        { cause: 'Field does not exist in the schema' }
      ),
      context: {
        operation: 'create',
        entity: 'Event',
        journey: 'gamification',
        feature: 'events',
        params: { 
          type: 'INVALID_EVENT_TYPE', 
          userId: 123, 
          payload: { invalidField: 'value' } 
        },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_GAME_EVENT_INVALID,
        message: 'Invalid gamification event data',
        details: {
          cause: 'Field does not exist in the schema',
          eventType: 'INVALID_EVENT_TYPE',
        },
        journeyContext: {
          journey: 'gamification',
          feature: 'events',
        },
      },
      shouldRetry: false,
      journey: 'gamification',
    },
    
    // Achievement constraint violation scenario
    {
      id: 'game-achievement-001',
      description: 'Achievement constraint violation',
      error: createPrismaError(
        'P2002',
        'Unique constraint failed on the constraint: `Achievement_user_id_type_id_key`',
        { target: ['userId', 'typeId'] }
      ),
      context: {
        operation: 'create',
        entity: 'Achievement',
        journey: 'gamification',
        feature: 'achievements',
        params: { 
          userId: 123, 
          typeId: 456, 
          level: 1, 
          unlockedAt: new Date() 
        },
      },
      expectedClassification: {
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MINOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: ErrorCodes.DB_GAME_ACHIEVEMENT_CONSTRAINT,
        message: 'User already has this achievement',
        details: {
          target: ['userId', 'typeId'],
          constraint: 'Achievement_user_id_type_id_key',
          userId: 123,
          typeId: 456,
        },
        journeyContext: {
          journey: 'gamification',
          feature: 'achievements',
        },
      },
      shouldRetry: false,
      journey: 'gamification',
    },
  ],
};

// ===== EDGE CASE ERROR SCENARIOS =====

export const edgeCaseErrorScenarios: DatabaseErrorScenarioGroup = {
  name: 'Edge Case Errors',
  description: 'Scenarios for testing edge case database error handling',
  scenarios: [
    // Unknown error scenario
    {
      id: 'edge-unknown-001',
      description: 'Unknown database error',
      error: new Error('An unexpected database error occurred'),
      context: {
        operation: 'query',
        entity: 'database',
      },
      expectedClassification: {
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: 'DB_UNKNOWN_ERROR',
        message: 'An unexpected database error occurred',
        details: {},
      },
      shouldRetry: false,
    },
    
    // Nested transaction error scenario
    {
      id: 'edge-nested-001',
      description: 'Nested transaction error',
      error: createPrismaError(
        'P2029',
        'Nested transactions are not supported',
        {}
      ),
      context: {
        operation: 'transaction',
        entity: 'database',
        feature: 'transaction-management',
      },
      expectedClassification: {
        type: DatabaseErrorType.TRANSACTION,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: 'DB_TRANS_NESTED_NOT_SUPPORTED',
        message: 'Nested transactions are not supported',
        details: {},
      },
      shouldRetry: false,
    },
    
    // Database connection limit scenario
    {
      id: 'edge-conn-limit-001',
      description: 'Database connection limit reached',
      error: createPostgresError(
        '53300',
        'too many connections for role "postgres"',
        'FATAL'
      ),
      context: {
        operation: 'connect',
        entity: 'database',
        feature: 'database-connection',
      },
      expectedClassification: {
        type: DatabaseErrorType.CONNECTION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.TRANSIENT,
        code: 'DB_CONN_PG_TOO_MANY_CONNECTIONS',
        message: 'Database connection limit reached',
        details: {
          code: '53300',
          role: 'postgres',
        },
      },
      shouldRetry: true,
    },
    
    // Database disk full scenario
    {
      id: 'edge-disk-001',
      description: 'Database disk full',
      error: createPostgresError(
        '53100',
        'disk full',
        'ERROR'
      ),
      context: {
        operation: 'create',
        entity: 'HealthMetric',
        params: { userId: 123, type: 'HEART_RATE', value: 75 },
      },
      expectedClassification: {
        type: DatabaseErrorType.CONFIGURATION,
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: 'DB_CONFIG_PG_DISK_FULL',
        message: 'Database disk full',
        details: {
          code: '53100',
        },
      },
      shouldRetry: false,
    },
  ],
};

// ===== EXPORT ALL SCENARIOS =====

/**
 * All database error scenarios grouped by category
 */
export const allDatabaseErrorScenarios: DatabaseErrorScenarioGroup[] = [
  connectionErrorScenarios,
  queryErrorScenarios,
  transactionErrorScenarios,
  integrityErrorScenarios,
  configurationErrorScenarios,
  healthJourneyErrorScenarios,
  careJourneyErrorScenarios,
  planJourneyErrorScenarios,
  gamificationErrorScenarios,
  edgeCaseErrorScenarios,
];

/**
 * All database error scenarios flattened into a single array
 */
export const allDatabaseErrorScenariosFlat: DatabaseErrorScenario[] = 
  allDatabaseErrorScenarios.flatMap(group => group.scenarios);

/**
 * Get database error scenarios by type
 * 
 * @param type The database error type to filter by
 * @returns An array of error scenarios matching the specified type
 */
export function getDatabaseErrorScenariosByType(type: DatabaseErrorType): DatabaseErrorScenario[] {
  return allDatabaseErrorScenariosFlat.filter(
    scenario => scenario.expectedClassification.type === type
  );
}

/**
 * Get database error scenarios by journey
 * 
 * @param journey The journey to filter by
 * @returns An array of error scenarios for the specified journey
 */
export function getDatabaseErrorScenariosByJourney(
  journey: 'health' | 'care' | 'plan' | 'gamification' | 'notification' | 'auth'
): DatabaseErrorScenario[] {
  return allDatabaseErrorScenariosFlat.filter(
    scenario => scenario.journey === journey
  );
}

/**
 * Get database error scenarios by recoverability
 * 
 * @param recoverable Whether to get recoverable or non-recoverable scenarios
 * @returns An array of error scenarios matching the specified recoverability
 */
export function getDatabaseErrorScenariosByRecoverability(recoverable: boolean): DatabaseErrorScenario[] {
  return allDatabaseErrorScenariosFlat.filter(
    scenario => scenario.shouldRetry === recoverable
  );
}

/**
 * Get a specific database error scenario by ID
 * 
 * @param id The scenario ID to find
 * @returns The matching error scenario or undefined if not found
 */
export function getDatabaseErrorScenarioById(id: string): DatabaseErrorScenario | undefined {
  return allDatabaseErrorScenariosFlat.find(scenario => scenario.id === id);
}

export default {
  connectionErrorScenarios,
  queryErrorScenarios,
  transactionErrorScenarios,
  integrityErrorScenarios,
  configurationErrorScenarios,
  healthJourneyErrorScenarios,
  careJourneyErrorScenarios,
  planJourneyErrorScenarios,
  gamificationErrorScenarios,
  edgeCaseErrorScenarios,
  allDatabaseErrorScenarios,
  allDatabaseErrorScenariosFlat,
  getDatabaseErrorScenariosByType,
  getDatabaseErrorScenariosByJourney,
  getDatabaseErrorScenariosByRecoverability,
  getDatabaseErrorScenarioById,
};