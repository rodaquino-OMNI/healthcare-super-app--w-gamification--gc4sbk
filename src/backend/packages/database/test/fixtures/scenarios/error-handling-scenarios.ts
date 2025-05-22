/**
 * @file error-handling-scenarios.ts
 * @description Provides comprehensive test fixtures for database error handling scenarios,
 * including connection failures, constraint violations, timeout errors, and deadlocks.
 * These fixtures simulate various error conditions to ensure the enhanced PrismaService
 * properly detects, classifies, and handles database errors with appropriate recovery strategies.
 */

import { 
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError
} from '@prisma/client/runtime/library';

import {
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext,
  ClassifiedDatabaseError,
  DatabaseErrorMetadata
} from '../../../src/errors/database-error.types';

import * as ErrorCodes from '../../../src/errors/database-error.codes';
import { DatabaseOperationType, JourneyContext as RetryJourneyContext } from '../../../src/errors/retry-strategies';

/**
 * Interface for database error test scenario
 */
export interface DatabaseErrorScenario {
  /** Unique identifier for the scenario */
  id: string;
  
  /** Human-readable description of the scenario */
  description: string;
  
  /** The error to simulate */
  error: Error;
  
  /** Expected error classification */
  expectedClassification: Partial<ClassifiedDatabaseError>;
  
  /** Whether the error should be retryable */
  isRetryable: boolean;
  
  /** The journey context for the error */
  journeyContext: JourneyContext;
  
  /** The database operation being performed */
  operation: string;
  
  /** The database entity involved */
  entity?: string;
  
  /** Additional metadata for the error */
  metadata?: Partial<DatabaseErrorMetadata>;
  
  /** Expected retry strategy configuration */
  expectedRetryStrategy?: {
    maxRetries: number;
    baseRetryDelay: number;
    maxRetryDelay: number;
  };
}

/**
 * Creates a PrismaClientKnownRequestError with the given code and message
 * 
 * @param code The Prisma error code
 * @param message The error message
 * @param meta Additional metadata for the error
 * @returns A PrismaClientKnownRequestError
 */
function createPrismaKnownError(code: string, message: string, meta?: Record<string, any>): PrismaClientKnownRequestError {
  return new PrismaClientKnownRequestError(
    message,
    {
      code,
      clientVersion: '5.1.1',
      meta: meta || {}
    },
    {
      target: meta?.target || [],
    }
  );
}

/**
 * Connection error scenarios for testing database connection handling
 */
export const connectionErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'conn-timeout',
    description: 'Database connection timeout',
    error: createPrismaKnownError(
      'P1002',
      'Connection timed out after 5000ms',
      { database: 'austa_db' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_TIMEOUT,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_CONN_TIMEOUT
    },
    isRetryable: true,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        connectionAttempts: 3,
        connectionTimeout: 5000
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 500,
      maxRetryDelay: 10000
    }
  },
  {
    id: 'conn-refused',
    description: 'Database connection refused',
    error: createPrismaKnownError(
      'P1001',
      'Can\'t reach database server at `postgres:5432`',
      { host: 'postgres', port: 5432 }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_CONN_FAILED
    },
    isRetryable: true,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        connectionAttempts: 1
      }
    },
    expectedRetryStrategy: {
      maxRetries: 10,
      baseRetryDelay: 500,
      maxRetryDelay: 30000
    }
  },
  {
    id: 'conn-auth-failed',
    description: 'Database authentication failed',
    error: createPrismaKnownError(
      'P1000',
      'Authentication failed against database server at `postgres:5432`',
      { database: 'austa_db', user: 'prisma_user' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONN_AUTH_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        user: 'prisma_user'
      }
    }
  },
  {
    id: 'conn-pool-exhausted',
    description: 'Connection pool exhausted',
    error: new Error('Connection pool exhausted: Maximum number of connections (20) reached'),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_LIMIT_REACHED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_CONN_POOL_EXHAUSTED
    },
    isRetryable: true,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        maxConnections: 20,
        activeConnections: 20
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 1000,
      maxRetryDelay: 10000
    }
  },
  {
    id: 'conn-db-not-found',
    description: 'Database not found',
    error: createPrismaKnownError(
      'P1003',
      'Database `austa_db` does not exist at `postgres:5432`',
      { database: 'austa_db' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONN_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        database: 'austa_db'
      }
    }
  }
];

/**
 * Query error scenarios for testing database query handling
 */
export const queryErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'query-syntax',
    description: 'Query syntax error',
    error: createPrismaKnownError(
      'P2010',
      'Raw query failed. Code: `42601`. Message: `syntax error at or near "SELEECT"`',
      { query: 'SELEECT * FROM users' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_SYNTAX,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_SYNTAX_ERROR
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'findMany',
    entity: 'User',
    metadata: {
      additionalData: {
        query: 'SELEECT * FROM users'
      }
    }
  },
  {
    id: 'query-timeout',
    description: 'Query timeout',
    error: new Error('Query execution timeout after 30000ms'),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_TIMEOUT,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_QUERY_TIMEOUT
    },
    isRetryable: true,
    journeyContext: JourneyContext.HEALTH,
    operation: 'findMany',
    entity: 'HealthMetric',
    metadata: {
      additionalData: {
        queryTimeout: 30000,
        queryComplexity: 'high'
      }
    },
    expectedRetryStrategy: {
      maxRetries: 2,
      baseRetryDelay: 50,
      maxRetryDelay: 1000
    }
  },
  {
    id: 'query-resource-not-found',
    description: 'Resource not found',
    error: createPrismaKnownError(
      'P2025',
      'Record to update not found.',
      { model: 'User', id: '123e4567-e89b-12d3-a456-426614174000' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_RESULT_ERROR,
      severity: DatabaseErrorSeverity.LOW,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_RESOURCE_NOT_FOUND
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'update',
    entity: 'User',
    metadata: {
      additionalData: {
        id: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  },
  {
    id: 'query-execution-failed',
    description: 'Query execution failed',
    error: createPrismaKnownError(
      'P2009',
      'Failed to validate the query',
      { modelName: 'User', field: 'email' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_EXECUTION_FAILED,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_EXECUTION_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'findUnique',
    entity: 'User',
    metadata: {
      additionalData: {
        field: 'email'
      }
    }
  },
  {
    id: 'query-relation-not-found',
    description: 'Relation not found',
    error: createPrismaKnownError(
      'P2017',
      'The records for relation `UserToRole` between the `User` and `Role` models are not connected.',
      { relation: 'UserToRole' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_SYNTAX,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_SYNTAX_ERROR
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'findMany',
    entity: 'User',
    metadata: {
      additionalData: {
        relation: 'UserToRole'
      }
    }
  }
];

/**
 * Transaction error scenarios for testing database transaction handling
 */
export const transactionErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'transaction-deadlock',
    description: 'Transaction deadlock',
    error: new Error('Transaction failed: deadlock detected'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_DEADLOCK,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_DEADLOCK
    },
    isRetryable: true,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'transaction',
    entity: 'Achievement',
    metadata: {
      additionalData: {
        transactionId: 'tx-12345',
        deadlockVictim: true
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 200,
      maxRetryDelay: 5000
    }
  },
  {
    id: 'transaction-commit-failed',
    description: 'Transaction commit failed',
    error: createPrismaKnownError(
      'P2028',
      'Transaction API error: Transaction commit failed',
      { transactionId: 'tx-12345' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_COMMIT_FAILED
    },
    isRetryable: true,
    journeyContext: JourneyContext.PLAN,
    operation: 'transaction',
    entity: 'Claim',
    metadata: {
      additionalData: {
        transactionId: 'tx-12345'
      }
    },
    expectedRetryStrategy: {
      maxRetries: 3,
      baseRetryDelay: 200,
      maxRetryDelay: 10000
    }
  },
  {
    id: 'transaction-timeout',
    description: 'Transaction timeout',
    error: new Error('Transaction timeout after 10000ms'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_TIMEOUT,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_TIMEOUT
    },
    isRetryable: true,
    journeyContext: JourneyContext.CARE,
    operation: 'transaction',
    entity: 'Appointment',
    metadata: {
      additionalData: {
        transactionId: 'tx-67890',
        transactionTimeout: 10000
      }
    },
    expectedRetryStrategy: {
      maxRetries: 3,
      baseRetryDelay: 100,
      maxRetryDelay: 3000
    }
  },
  {
    id: 'transaction-already-in-progress',
    description: 'Transaction already in progress',
    error: createPrismaKnownError(
      'P2034',
      'Transaction already in progress',
      { transactionId: 'tx-12345' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_BEGIN_FAILED,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_TRANS_BEGIN_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'transaction',
    entity: 'Achievement',
    metadata: {
      additionalData: {
        transactionId: 'tx-12345'
      }
    }
  },
  {
    id: 'transaction-serialization-failure',
    description: 'Transaction serialization failure',
    error: new Error('Transaction failed: could not serialize access due to concurrent update'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_SERIALIZATION_FAILED
    },
    isRetryable: true,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'transaction',
    entity: 'Leaderboard',
    metadata: {
      additionalData: {
        transactionId: 'tx-54321',
        isolationLevel: 'serializable'
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 200,
      maxRetryDelay: 5000
    }
  }
];

/**
 * Integrity error scenarios for testing database integrity constraint handling
 */
export const integrityErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'integrity-unique-violation',
    description: 'Unique constraint violation',
    error: createPrismaKnownError(
      'P2002',
      'Unique constraint failed on the fields: (`email`)',
      { target: ['email'] }
    ),
    expectedClassification: {
      type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'create',
    entity: 'User',
    metadata: {
      additionalData: {
        fields: ['email'],
        value: 'user@austa.com.br'
      }
    }
  },
  {
    id: 'integrity-foreign-key-violation',
    description: 'Foreign key constraint violation',
    error: createPrismaKnownError(
      'P2003',
      'Foreign key constraint failed on the field: `userId`',
      { field_name: 'userId', model: 'HealthMetric' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.FOREIGN_KEY_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_FOREIGN_KEY_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.HEALTH,
    operation: 'create',
    entity: 'HealthMetric',
    metadata: {
      additionalData: {
        field: 'userId',
        value: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  },
  {
    id: 'integrity-check-constraint-violation',
    description: 'Check constraint violation',
    error: createPrismaKnownError(
      'P2004',
      'A constraint failed on the database: `check_positive_value`',
      { constraint: 'check_positive_value' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.HEALTH,
    operation: 'create',
    entity: 'HealthMetric',
    metadata: {
      additionalData: {
        constraint: 'check_positive_value',
        value: -10
      }
    }
  },
  {
    id: 'integrity-not-null-violation',
    description: 'Not null constraint violation',
    error: createPrismaKnownError(
      'P2011',
      'Null constraint violation on the fields: (`name`)',
      { constraint: 'not_null', target: ['name'] }
    ),
    expectedClassification: {
      type: DatabaseErrorType.NOT_NULL_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_NOT_NULL_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'create',
    entity: 'Achievement',
    metadata: {
      additionalData: {
        fields: ['name']
      }
    }
  },
  {
    id: 'integrity-data-validation',
    description: 'Data validation error',
    error: new PrismaClientValidationError(
      'Invalid value for field `email`: Not a valid email address'
    ),
    expectedClassification: {
      type: DatabaseErrorType.DATA_VALIDATION_FAILED,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_INVALID_DATA_TYPE
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'create',
    entity: 'User',
    metadata: {
      additionalData: {
        field: 'email',
        value: 'not-an-email'
      }
    }
  }
];

/**
 * Configuration error scenarios for testing database configuration handling
 */
export const configurationErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'config-schema-mismatch',
    description: 'Schema mismatch',
    error: createPrismaKnownError(
      'P3005',
      'The database schema is not in sync with the Prisma schema',
      { migration: true }
    ),
    expectedClassification: {
      type: DatabaseErrorType.SCHEMA_MISMATCH,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_INVALID_SCHEMA
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        schemaVersion: '20230301000000_add_indices_and_relations'
      }
    }
  },
  {
    id: 'config-migration-failed',
    description: 'Migration failed',
    error: createPrismaKnownError(
      'P3002',
      'Migration failed',
      { migration: '20230301000000_add_indices_and_relations' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.MIGRATION_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_MIGRATION_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'migrate',
    metadata: {
      additionalData: {
        migration: '20230301000000_add_indices_and_relations'
      }
    }
  },
  {
    id: 'config-invalid-url',
    description: 'Invalid database URL',
    error: new PrismaClientInitializationError(
      'Invalid database URL format',
      'P1013',
      '5.1.1'
    ),
    expectedClassification: {
      type: DatabaseErrorType.INVALID_CONFIGURATION,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_INVALID_URL
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        url: 'postgres://user:password@localhost:5432/db?schema=public&invalid=param'
      }
    }
  },
  {
    id: 'config-missing-env',
    description: 'Missing environment variable',
    error: new PrismaClientInitializationError(
      'Environment variable not found: DATABASE_URL.',
      'P1012',
      '5.1.1'
    ),
    expectedClassification: {
      type: DatabaseErrorType.MISSING_CONFIGURATION,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_MISSING_ENV
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        envVar: 'DATABASE_URL'
      }
    }
  },
  {
    id: 'config-engine-start-failed',
    description: 'Query engine start failed',
    error: new PrismaClientRustPanicError(
      'Query engine panic: Failed to start query engine',
      '5.1.1'
    ),
    expectedClassification: {
      type: DatabaseErrorType.INVALID_CONFIGURATION,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_ENGINE_FAILED
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'connect',
    metadata: {
      additionalData: {
        engineVersion: '5.1.1'
      }
    }
  }
];

/**
 * Journey-specific error scenarios for testing journey-specific error handling
 */
export const journeySpecificErrorScenarios: DatabaseErrorScenario[] = [
  // Health Journey
  {
    id: 'health-metric-validation',
    description: 'Health metric validation error',
    error: createPrismaKnownError(
      'P2004',
      'A constraint failed on the database: `health_metric_range_check`',
      { constraint: 'health_metric_range_check' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.HEALTH,
    operation: 'create',
    entity: 'HealthMetric',
    metadata: {
      additionalData: {
        metricType: 'HEART_RATE',
        value: 250, // Outside normal range
        normalRange: '60-100'
      }
    }
  },
  // Care Journey
  {
    id: 'care-appointment-conflict',
    description: 'Appointment scheduling conflict',
    error: createPrismaKnownError(
      'P2004',
      'A constraint failed on the database: `appointment_time_conflict`',
      { constraint: 'appointment_time_conflict' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.CHECK_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_CHECK_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.CARE,
    operation: 'create',
    entity: 'Appointment',
    metadata: {
      additionalData: {
        providerId: '123e4567-e89b-12d3-a456-426614174000',
        startTime: '2023-06-15T10:00:00Z',
        endTime: '2023-06-15T11:00:00Z'
      }
    }
  },
  // Plan Journey
  {
    id: 'plan-claim-duplicate',
    description: 'Duplicate claim submission',
    error: createPrismaKnownError(
      'P2002',
      'Unique constraint failed on the fields: (`receiptNumber`)',
      { target: ['receiptNumber'] }
    ),
    expectedClassification: {
      type: DatabaseErrorType.UNIQUE_CONSTRAINT_VIOLATION,
      severity: DatabaseErrorSeverity.MEDIUM,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_INTEGRITY_UNIQUE_VIOLATION
    },
    isRetryable: false,
    journeyContext: JourneyContext.PLAN,
    operation: 'create',
    entity: 'Claim',
    metadata: {
      additionalData: {
        receiptNumber: 'REC-12345',
        claimType: 'Consulta Médica'
      }
    }
  },
  // Gamification Journey
  {
    id: 'gamification-achievement-race',
    description: 'Achievement race condition',
    error: new Error('Transaction failed: could not serialize access due to concurrent update'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_SERIALIZATION_FAILED
    },
    isRetryable: true,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'transaction',
    entity: 'Achievement',
    metadata: {
      additionalData: {
        achievementType: 'health-check-streak',
        userId: '123e4567-e89b-12d3-a456-426614174000'
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 200,
      maxRetryDelay: 5000
    }
  }
];

/**
 * Edge case error scenarios for testing complex error handling
 */
export const edgeCaseErrorScenarios: DatabaseErrorScenario[] = [
  {
    id: 'edge-cascading-deadlock',
    description: 'Cascading deadlock across multiple tables',
    error: new Error('Transaction failed: deadlock detected involving 3 relations'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_DEADLOCK,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_TRANS_DEADLOCK
    },
    isRetryable: true,
    journeyContext: JourneyContext.GAMIFICATION,
    operation: 'transaction',
    entity: 'Achievement',
    metadata: {
      additionalData: {
        transactionId: 'tx-complex-12345',
        affectedTables: ['achievements', 'user_achievements', 'achievement_progress'],
        deadlockGraph: 'tx1->tx2->tx3->tx1'
      }
    },
    expectedRetryStrategy: {
      maxRetries: 5,
      baseRetryDelay: 500,
      maxRetryDelay: 10000
    }
  },
  {
    id: 'edge-intermittent-connection',
    description: 'Intermittent connection failure',
    error: new Error('Connection terminated unexpectedly during query execution'),
    expectedClassification: {
      type: DatabaseErrorType.CONNECTION_CLOSED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.TRANSIENT,
      code: ErrorCodes.DB_CONN_TERMINATED
    },
    isRetryable: true,
    journeyContext: JourneyContext.HEALTH,
    operation: 'findMany',
    entity: 'HealthMetric',
    metadata: {
      additionalData: {
        queryProgress: '75%',
        networkLatency: 'fluctuating',
        connectionDuration: 3600 // Long-running connection (1 hour)
      }
    },
    expectedRetryStrategy: {
      maxRetries: 3,
      baseRetryDelay: 100,
      maxRetryDelay: 2000
    }
  },
  {
    id: 'edge-partial-failure',
    description: 'Partial transaction failure',
    error: new Error('Transaction partially committed: 3/5 operations succeeded before failure'),
    expectedClassification: {
      type: DatabaseErrorType.TRANSACTION_COMMIT_FAILED,
      severity: DatabaseErrorSeverity.HIGH,
      recoverability: DatabaseErrorRecoverability.PERMANENT, // Cannot retry as partial changes are committed
      code: ErrorCodes.DB_TRANS_PARTIAL_COMMIT
    },
    isRetryable: false,
    journeyContext: JourneyContext.PLAN,
    operation: 'transaction',
    entity: 'Claim',
    metadata: {
      additionalData: {
        transactionId: 'tx-partial-12345',
        completedOperations: 3,
        totalOperations: 5,
        failedOperation: 'createClaimDocument'
      }
    }
  },
  {
    id: 'edge-database-disk-full',
    description: 'Database disk full',
    error: new Error('ERROR: could not extend file "base/16385/123456": No space left on device'),
    expectedClassification: {
      type: DatabaseErrorType.QUERY_EXECUTION_FAILED,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_QUERY_DISK_FULL
    },
    isRetryable: false,
    journeyContext: JourneyContext.NONE,
    operation: 'create',
    entity: 'User',
    metadata: {
      additionalData: {
        diskUsage: '100%',
        requiredSpace: '10MB'
      }
    }
  },
  {
    id: 'edge-schema-version-mismatch',
    description: 'Schema version mismatch between services',
    error: createPrismaKnownError(
      'P2021',
      'The table `User` does not exist in the current database.',
      { table: 'User' }
    ),
    expectedClassification: {
      type: DatabaseErrorType.SCHEMA_MISMATCH,
      severity: DatabaseErrorSeverity.CRITICAL,
      recoverability: DatabaseErrorRecoverability.PERMANENT,
      code: ErrorCodes.DB_CONFIG_SCHEMA_VERSION_MISMATCH
    },
    isRetryable: false,
    journeyContext: JourneyContext.AUTH,
    operation: 'findMany',
    entity: 'User',
    metadata: {
      additionalData: {
        expectedSchemaVersion: '20230301000000_add_indices_and_relations',
        actualSchemaVersion: '20230101000000_initial_schema'
      }
    }
  }
];

/**
 * All database error scenarios combined
 */
export const allDatabaseErrorScenarios: DatabaseErrorScenario[] = [
  ...connectionErrorScenarios,
  ...queryErrorScenarios,
  ...transactionErrorScenarios,
  ...integrityErrorScenarios,
  ...configurationErrorScenarios,
  ...journeySpecificErrorScenarios,
  ...edgeCaseErrorScenarios
];

/**
 * Get a scenario by ID
 * 
 * @param id The scenario ID
 * @returns The scenario with the given ID, or undefined if not found
 */
export function getScenarioById(id: string): DatabaseErrorScenario | undefined {
  return allDatabaseErrorScenarios.find(scenario => scenario.id === id);
}

/**
 * Get scenarios by error type
 * 
 * @param errorType The error type to filter by
 * @returns An array of scenarios with the given error type
 */
export function getScenariosByErrorType(errorType: DatabaseErrorType): DatabaseErrorScenario[] {
  return allDatabaseErrorScenarios.filter(
    scenario => scenario.expectedClassification.type === errorType
  );
}

/**
 * Get scenarios by journey context
 * 
 * @param journeyContext The journey context to filter by
 * @returns An array of scenarios with the given journey context
 */
export function getScenariosByJourneyContext(journeyContext: JourneyContext): DatabaseErrorScenario[] {
  return allDatabaseErrorScenarios.filter(
    scenario => scenario.journeyContext === journeyContext
  );
}

/**
 * Get scenarios by retryability
 * 
 * @param isRetryable Whether to get retryable or non-retryable scenarios
 * @returns An array of scenarios with the given retryability
 */
export function getScenariosByRetryability(isRetryable: boolean): DatabaseErrorScenario[] {
  return allDatabaseErrorScenarios.filter(
    scenario => scenario.isRetryable === isRetryable
  );
}

/**
 * Create a retry context from a scenario
 * 
 * @param scenario The scenario to create a retry context from
 * @param attemptsMade The number of retry attempts made so far
 * @returns A retry context for the scenario
 */
export function createRetryContextFromScenario(
  scenario: DatabaseErrorScenario,
  attemptsMade: number = 0
): {
  operationType: DatabaseOperationType;
  journeyContext: RetryJourneyContext;
  attemptsMade: number;
  error: Error;
  firstAttemptTime: Date;
  metadata?: Record<string, unknown>;
} {
  // Map operation to DatabaseOperationType
  let operationType: DatabaseOperationType;
  if (scenario.operation === 'transaction') {
    operationType = DatabaseOperationType.TRANSACTION;
  } else if (scenario.operation === 'connect' || scenario.operation === 'migrate') {
    operationType = DatabaseOperationType.CONNECTION;
  } else if (
    scenario.operation === 'findMany' ||
    scenario.operation === 'findUnique' ||
    scenario.operation === 'findFirst' ||
    scenario.operation === 'count'
  ) {
    operationType = DatabaseOperationType.READ;
  } else {
    operationType = DatabaseOperationType.WRITE;
  }
  
  // Map JourneyContext to RetryJourneyContext
  let journeyContext: RetryJourneyContext;
  switch (scenario.journeyContext) {
    case JourneyContext.HEALTH:
      journeyContext = RetryJourneyContext.HEALTH;
      break;
    case JourneyContext.CARE:
      journeyContext = RetryJourneyContext.CARE;
      break;
    case JourneyContext.PLAN:
      journeyContext = RetryJourneyContext.PLAN;
      break;
    case JourneyContext.GAMIFICATION:
      journeyContext = RetryJourneyContext.GAMIFICATION;
      break;
    case JourneyContext.AUTH:
      journeyContext = RetryJourneyContext.AUTH;
      break;
    case JourneyContext.NOTIFICATION:
      journeyContext = RetryJourneyContext.NOTIFICATION;
      break;
    default:
      journeyContext = RetryJourneyContext.SYSTEM;
  }
  
  return {
    operationType,
    journeyContext,
    attemptsMade,
    error: scenario.error,
    firstAttemptTime: new Date(),
    metadata: {
      entity: scenario.entity,
      operation: scenario.operation,
      ...scenario.metadata?.additionalData
    }
  };
}