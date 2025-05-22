/**
 * @file error-transformer.spec.ts
 * @description Unit tests for the ErrorTransformer utility that converts low-level database errors
 * into standardized exceptions. Tests verify transformation accuracy for different database
 * technologies, context enrichment, error classification, and integration with retry strategies.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { RedisError } from 'redis';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

import { ErrorTransformer, DatabaseOperationContext } from '../../src/errors/error-transformer';
import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException
} from '../../src/errors/database-error.exception';

import {
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  JourneyContext
} from '../../src/errors/database-error.types';

import {
  DB_CONN_FAILED,
  DB_CONN_TIMEOUT,
  DB_QUERY_FAILED,
  DB_QUERY_TIMEOUT,
  DB_TRANSACTION_FAILED,
  DB_INTEGRITY_CONSTRAINT,
  DB_INTEGRITY_UNIQUE_VIOLATION,
  DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
  DB_CONFIG_INVALID,
  DB_HEALTH_QUERY_METRICS_NOT_FOUND,
  DB_CARE_QUERY_APPOINTMENT_NOT_FOUND,
  DB_PLAN_QUERY_CLAIM_NOT_FOUND,
  DB_GAME_QUERY_ACHIEVEMENT_NOT_FOUND
} from '../../src/errors/database-error.codes';

import { PrismaErrorHandler } from '../../src/errors/handlers/prisma-error.handler';
import { RedisErrorHandler } from '../../src/errors/handlers/redis-error.handler';
import { TimescaleErrorHandler } from '../../src/errors/handlers/timescale-error.handler';
import { CommonErrorHandler } from '../../src/errors/handlers/common-error.handler';

/**
 * Mock implementation of the PrismaErrorHandler
 */
class MockPrismaErrorHandler {
  handleError(error: any, context: any): DatabaseException {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle known Prisma errors based on error code
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          return new IntegrityException(
            `Unique constraint violation on ${error.meta?.target}`,
            DB_INTEGRITY_UNIQUE_VIOLATION,
            {
              errorType: DatabaseErrorType.INTEGRITY,
              severity: DatabaseErrorSeverity.MAJOR,
              recoverability: DatabaseErrorRecoverability.PERMANENT,
              originalError: error,
              context
            }
          );
        case 'P2003': // Foreign key constraint violation
          return new IntegrityException(
            `Foreign key constraint violation on ${error.meta?.field_name}`,
            DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
            {
              errorType: DatabaseErrorType.INTEGRITY,
              severity: DatabaseErrorSeverity.MAJOR,
              recoverability: DatabaseErrorRecoverability.PERMANENT,
              originalError: error,
              context
            }
          );
        case 'P2025': // Record not found
          return new QueryException(
            `Record not found: ${error.meta?.cause}`,
            DB_QUERY_FAILED,
            {
              errorType: DatabaseErrorType.QUERY,
              severity: DatabaseErrorSeverity.MINOR,
              recoverability: DatabaseErrorRecoverability.PERMANENT,
              originalError: error,
              context
            }
          );
        case 'P2028': // Transaction API error
          return new TransactionException(
            `Transaction error: ${error.message}`,
            DB_TRANSACTION_FAILED,
            {
              errorType: DatabaseErrorType.TRANSACTION,
              severity: DatabaseErrorSeverity.MAJOR,
              recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
              originalError: error,
              context
            }
          );
        default:
          return new DatabaseException(
            `Prisma error: ${error.message}`,
            DB_QUERY_FAILED,
            {
              errorType: DatabaseErrorType.UNKNOWN,
              severity: DatabaseErrorSeverity.MAJOR,
              recoverability: DatabaseErrorRecoverability.UNKNOWN,
              originalError: error,
              context
            }
          );
      }
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      // Handle validation errors
      return new QueryException(
        `Validation error: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: error,
          context
        }
      );
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      // Handle initialization errors
      return new ConnectionException(
        `Connection error: ${error.message}`,
        DB_CONN_FAILED,
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else {
      // Handle other Prisma errors
      return new DatabaseException(
        `Unknown Prisma error: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.UNKNOWN,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          originalError: error,
          context
        }
      );
    }
  }
}

/**
 * Mock implementation of the RedisErrorHandler
 */
class MockRedisErrorHandler {
  handleError(error: any, context: any): DatabaseException {
    if (error.message.includes('connection')) {
      return new ConnectionException(
        `Redis connection error: ${error.message}`,
        DB_CONN_FAILED,
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else if (error.message.includes('timeout')) {
      return new QueryException(
        `Redis timeout error: ${error.message}`,
        DB_QUERY_TIMEOUT,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else {
      return new DatabaseException(
        `Redis error: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.UNKNOWN,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          originalError: error,
          context
        }
      );
    }
  }
}

/**
 * Mock implementation of the TimescaleErrorHandler
 */
class MockTimescaleErrorHandler {
  handleError(error: any, context: any): DatabaseException {
    if (error.message.includes('hypertable')) {
      return new ConfigurationException(
        `Timescale hypertable error: ${error.message}`,
        DB_CONFIG_INVALID,
        {
          errorType: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.NON_RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else {
      return new DatabaseException(
        `Timescale error: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.UNKNOWN,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          originalError: error,
          context
        }
      );
    }
  }
}

/**
 * Mock implementation of the CommonErrorHandler
 */
class MockCommonErrorHandler {
  handleError(error: any, context: any): DatabaseException {
    if (error instanceof QueryFailedError) {
      return new QueryException(
        `Query failed: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else if (error instanceof EntityNotFoundError) {
      return new QueryException(
        `Entity not found: ${error.message}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: error,
          context
        }
      );
    } else if (error.message && error.message.includes('timeout')) {
      return new ConnectionException(
        `Connection timeout: ${error.message}`,
        DB_CONN_TIMEOUT,
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.RECOVERABLE,
          originalError: error,
          context
        }
      );
    } else {
      return new DatabaseException(
        `Database error: ${error.message || 'Unknown error'}`,
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.UNKNOWN,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.UNKNOWN,
          originalError: error,
          context
        }
      );
    }
  }
}

describe('ErrorTransformer', () => {
  let errorTransformer: ErrorTransformer;
  let mockPrismaErrorHandler: MockPrismaErrorHandler;
  let mockRedisErrorHandler: MockRedisErrorHandler;
  let mockTimescaleErrorHandler: MockTimescaleErrorHandler;
  let mockCommonErrorHandler: MockCommonErrorHandler;

  beforeEach(async () => {
    // Create mock handlers
    mockPrismaErrorHandler = new MockPrismaErrorHandler();
    mockRedisErrorHandler = new MockRedisErrorHandler();
    mockTimescaleErrorHandler = new MockTimescaleErrorHandler();
    mockCommonErrorHandler = new MockCommonErrorHandler();

    // Create testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErrorTransformer,
        {
          provide: PrismaErrorHandler,
          useValue: mockPrismaErrorHandler,
        },
        {
          provide: RedisErrorHandler,
          useValue: mockRedisErrorHandler,
        },
        {
          provide: TimescaleErrorHandler,
          useValue: mockTimescaleErrorHandler,
        },
        {
          provide: CommonErrorHandler,
          useValue: mockCommonErrorHandler,
        },
      ],
    }).compile();

    // Get the service instance
    errorTransformer = module.get<ErrorTransformer>(ErrorTransformer);

    // Set up spies on the mock handlers
    jest.spyOn(mockPrismaErrorHandler, 'handleError');
    jest.spyOn(mockRedisErrorHandler, 'handleError');
    jest.spyOn(mockTimescaleErrorHandler, 'handleError');
    jest.spyOn(mockCommonErrorHandler, 'handleError');
  });

  describe('transform', () => {
    it('should handle null or undefined errors', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'testOperation',
        entity: 'TestEntity',
      };

      // Act
      const result = errorTransformer.transform(null, context);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.message).toContain('Unknown database error');
    });

    it('should delegate Prisma errors to the PrismaErrorHandler', () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );
      const context: DatabaseOperationContext = {
        operation: 'createUser',
        entity: 'User',
        params: { email: 'test@example.com' },
      };

      // Act
      errorTransformer.transform(prismaError, context);

      // Assert
      expect(mockPrismaErrorHandler.handleError).toHaveBeenCalledWith(
        prismaError,
        expect.objectContaining({
          operation: 'createUser',
          entity: 'User',
        })
      );
    });

    it('should delegate Redis errors to the RedisErrorHandler', () => {
      // Arrange
      const redisError = new RedisError('Redis connection refused');
      const context: DatabaseOperationContext = {
        operation: 'getCachedUser',
        entity: 'User',
        params: { id: '123' },
      };

      // Act
      errorTransformer.transform(redisError, context);

      // Assert
      expect(mockRedisErrorHandler.handleError).toHaveBeenCalledWith(
        redisError,
        expect.objectContaining({
          operation: 'getCachedUser',
          entity: 'User',
        })
      );
    });

    it('should delegate TypeORM errors to the CommonErrorHandler', () => {
      // Arrange
      const queryFailedError = new QueryFailedError('SELECT * FROM users', [], new Error('Query failed'));
      const context: DatabaseOperationContext = {
        operation: 'findUsers',
        entity: 'User',
        query: 'SELECT * FROM users',
      };

      // Act
      errorTransformer.transform(queryFailedError, context);

      // Assert
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        queryFailedError,
        expect.objectContaining({
          operation: 'findUsers',
          entity: 'User',
          query: 'SELECT * FROM users',
        })
      );
    });

    it('should delegate TimescaleDB errors to the TimescaleErrorHandler', () => {
      // Arrange
      const timescaleError = new Error('Failed to create hypertable: table does not exist');
      const context: DatabaseOperationContext = {
        operation: 'createHealthMetricsTable',
        entity: 'HealthMetric',
      };

      // Act
      errorTransformer.transform(timescaleError, context);

      // Assert
      expect(mockTimescaleErrorHandler.handleError).toHaveBeenCalledWith(
        timescaleError,
        expect.objectContaining({
          operation: 'createHealthMetricsTable',
          entity: 'HealthMetric',
        })
      );
    });

    it('should delegate unknown errors to the CommonErrorHandler', () => {
      // Arrange
      const unknownError = new Error('Unknown database error');
      const context: DatabaseOperationContext = {
        operation: 'unknownOperation',
        entity: 'UnknownEntity',
      };

      // Act
      errorTransformer.transform(unknownError, context);

      // Assert
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        unknownError,
        expect.objectContaining({
          operation: 'unknownOperation',
          entity: 'UnknownEntity',
        })
      );
    });
  });

  describe('transformPrismaError', () => {
    it('should transform Prisma unique constraint violation errors', () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );
      const context: DatabaseOperationContext = {
        operation: 'createUser',
        entity: 'User',
        params: { email: 'test@example.com' },
      };

      // Act
      const result = errorTransformer.transformPrismaError(prismaError, context);

      // Assert
      expect(result).toBeInstanceOf(IntegrityException);
      expect(result.message).toContain('Unique constraint violation');
      expect(mockPrismaErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should transform Prisma foreign key constraint violation errors', () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint violation',
        { code: 'P2003', clientVersion: '4.0.0' },
        { field_name: 'userId' }
      );
      const context: DatabaseOperationContext = {
        operation: 'createAppointment',
        entity: 'Appointment',
        params: { userId: '999' },
      };

      // Act
      const result = errorTransformer.transformPrismaError(prismaError, context);

      // Assert
      expect(result).toBeInstanceOf(IntegrityException);
      expect(result.message).toContain('Foreign key constraint violation');
      expect(mockPrismaErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should transform Prisma record not found errors', () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '4.0.0' },
        { cause: 'Record to update not found.' }
      );
      const context: DatabaseOperationContext = {
        operation: 'updateUser',
        entity: 'User',
        params: { id: '123' },
      };

      // Act
      const result = errorTransformer.transformPrismaError(prismaError, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toContain('Record not found');
      expect(mockPrismaErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should transform Prisma validation errors', () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientValidationError(
        'Invalid argument: Invalid value provided for field `email`',
        { clientVersion: '4.0.0' }
      );
      const context: DatabaseOperationContext = {
        operation: 'createUser',
        entity: 'User',
        params: { email: 'invalid-email' },
      };

      // Act
      const result = errorTransformer.transformPrismaError(prismaError, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toContain('Validation error');
      expect(mockPrismaErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('transformRedisError', () => {
    it('should transform Redis connection errors', () => {
      // Arrange
      const redisError = new RedisError('Redis connection refused');
      const context: DatabaseOperationContext = {
        operation: 'getCachedUser',
        entity: 'User',
        params: { id: '123' },
      };

      // Act
      const result = errorTransformer.transformRedisError(redisError, context);

      // Assert
      expect(result).toBeInstanceOf(ConnectionException);
      expect(result.message).toContain('Redis connection error');
      expect(mockRedisErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should transform Redis timeout errors', () => {
      // Arrange
      const redisError = new RedisError('Redis command timed out');
      const context: DatabaseOperationContext = {
        operation: 'getCachedUser',
        entity: 'User',
        params: { id: '123' },
      };

      // Act
      const result = errorTransformer.transformRedisError(redisError, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toContain('Redis timeout error');
      expect(mockRedisErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('transformTypeOrmError', () => {
    it('should transform TypeORM query failed errors', () => {
      // Arrange
      const queryFailedError = new QueryFailedError('SELECT * FROM users', [], new Error('Query failed'));
      const context: DatabaseOperationContext = {
        operation: 'findUsers',
        entity: 'User',
        query: 'SELECT * FROM users',
      };

      // Act
      const result = errorTransformer.transformTypeOrmError(queryFailedError, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toContain('Query failed');
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalled();
    });

    it('should transform TypeORM entity not found errors', () => {
      // Arrange
      const entityNotFoundError = new EntityNotFoundError('User', '123');
      const context: DatabaseOperationContext = {
        operation: 'findUserById',
        entity: 'User',
        params: { id: '123' },
      };

      // Act
      const result = errorTransformer.transformTypeOrmError(entityNotFoundError, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toContain('Entity not found');
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('transformTimescaleError', () => {
    it('should transform TimescaleDB hypertable errors', () => {
      // Arrange
      const timescaleError = new Error('Failed to create hypertable: table does not exist');
      const context: DatabaseOperationContext = {
        operation: 'createHealthMetricsTable',
        entity: 'HealthMetric',
      };

      // Act
      const result = errorTransformer.transformTimescaleError(timescaleError, context);

      // Assert
      expect(result).toBeInstanceOf(ConfigurationException);
      expect(result.message).toContain('Timescale hypertable error');
      expect(mockTimescaleErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('transformGenericError', () => {
    it('should transform generic database errors', () => {
      // Arrange
      const genericError = new Error('Generic database error');
      const context: DatabaseOperationContext = {
        operation: 'genericOperation',
        entity: 'GenericEntity',
      };

      // Act
      const result = errorTransformer.transformGenericError(genericError, context);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.message).toContain('Database error');
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalled();
    });
  });

  describe('Context enrichment', () => {
    it('should enrich error context with operation details', () => {
      // Arrange
      const error = new Error('Database error');
      const context: DatabaseOperationContext = {
        operation: 'findUserById',
        entity: 'User',
        params: { id: '123' },
        query: 'SELECT * FROM users WHERE id = ?',
        metadata: { source: 'API request' },
      };

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'findUserById',
          entity: 'User',
          params: { id: '123' },
          query: 'SELECT * FROM users WHERE id = ?',
          metadata: { source: 'API request' },
          timestamp: expect.any(Date),
        })
      );
    });

    it('should create a default context when minimal information is provided', () => {
      // Arrange
      const error = new Error('Database error');
      const context: DatabaseOperationContext = {
        operation: 'unknownOperation',
      };

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'unknownOperation',
          entity: 'unknown',
          timestamp: expect.any(Date),
          metadata: {},
        })
      );
    });
  });

  describe('Journey-specific transformations', () => {
    it('should transform health journey errors with appropriate context', () => {
      // Arrange
      const error = new Error('Health metrics not found');
      const context: DatabaseOperationContext = {
        operation: 'findHealthMetrics',
        entity: 'HealthMetric',
        journey: 'health',
        params: { userId: '123', metricType: 'HEART_RATE' },
      };

      // Mock the common error handler to return a journey-specific error
      jest.spyOn(mockCommonErrorHandler, 'handleError').mockReturnValueOnce(
        new QueryException(
          'Health metrics not found',
          DB_HEALTH_QUERY_METRICS_NOT_FOUND,
          {
            errorType: DatabaseErrorType.QUERY,
            severity: DatabaseErrorSeverity.MINOR,
            recoverability: DatabaseErrorRecoverability.PERMANENT,
            originalError: error,
            context: {
              operation: 'findHealthMetrics',
              entity: 'HealthMetric',
              journey: 'health',
              params: { userId: '123', metricType: 'HEART_RATE' },
              timestamp: new Date(),
              metadata: {},
            },
          }
        )
      );

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toBe('Health metrics not found');
      expect(result.getCode()).toBe(DB_HEALTH_QUERY_METRICS_NOT_FOUND);
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'findHealthMetrics',
          entity: 'HealthMetric',
          journey: 'health',
        })
      );
    });

    it('should transform care journey errors with appropriate context', () => {
      // Arrange
      const error = new Error('Appointment not found');
      const context: DatabaseOperationContext = {
        operation: 'findAppointmentById',
        entity: 'Appointment',
        journey: 'care',
        params: { appointmentId: '456' },
      };

      // Mock the common error handler to return a journey-specific error
      jest.spyOn(mockCommonErrorHandler, 'handleError').mockReturnValueOnce(
        new QueryException(
          'Appointment not found',
          DB_CARE_QUERY_APPOINTMENT_NOT_FOUND,
          {
            errorType: DatabaseErrorType.QUERY,
            severity: DatabaseErrorSeverity.MINOR,
            recoverability: DatabaseErrorRecoverability.PERMANENT,
            originalError: error,
            context: {
              operation: 'findAppointmentById',
              entity: 'Appointment',
              journey: 'care',
              params: { appointmentId: '456' },
              timestamp: new Date(),
              metadata: {},
            },
          }
        )
      );

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toBe('Appointment not found');
      expect(result.getCode()).toBe(DB_CARE_QUERY_APPOINTMENT_NOT_FOUND);
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'findAppointmentById',
          entity: 'Appointment',
          journey: 'care',
        })
      );
    });

    it('should transform plan journey errors with appropriate context', () => {
      // Arrange
      const error = new Error('Claim not found');
      const context: DatabaseOperationContext = {
        operation: 'findClaimById',
        entity: 'Claim',
        journey: 'plan',
        params: { claimId: '789' },
      };

      // Mock the common error handler to return a journey-specific error
      jest.spyOn(mockCommonErrorHandler, 'handleError').mockReturnValueOnce(
        new QueryException(
          'Claim not found',
          DB_PLAN_QUERY_CLAIM_NOT_FOUND,
          {
            errorType: DatabaseErrorType.QUERY,
            severity: DatabaseErrorSeverity.MINOR,
            recoverability: DatabaseErrorRecoverability.PERMANENT,
            originalError: error,
            context: {
              operation: 'findClaimById',
              entity: 'Claim',
              journey: 'plan',
              params: { claimId: '789' },
              timestamp: new Date(),
              metadata: {},
            },
          }
        )
      );

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toBe('Claim not found');
      expect(result.getCode()).toBe(DB_PLAN_QUERY_CLAIM_NOT_FOUND);
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'findClaimById',
          entity: 'Claim',
          journey: 'plan',
        })
      );
    });

    it('should transform gamification errors with appropriate context', () => {
      // Arrange
      const error = new Error('Achievement not found');
      const context: DatabaseOperationContext = {
        operation: 'findAchievementById',
        entity: 'Achievement',
        journey: 'gamification',
        params: { achievementId: '101' },
      };

      // Mock the common error handler to return a journey-specific error
      jest.spyOn(mockCommonErrorHandler, 'handleError').mockReturnValueOnce(
        new QueryException(
          'Achievement not found',
          DB_GAME_QUERY_ACHIEVEMENT_NOT_FOUND,
          {
            errorType: DatabaseErrorType.QUERY,
            severity: DatabaseErrorSeverity.MINOR,
            recoverability: DatabaseErrorRecoverability.PERMANENT,
            originalError: error,
            context: {
              operation: 'findAchievementById',
              entity: 'Achievement',
              journey: 'gamification',
              params: { achievementId: '101' },
              timestamp: new Date(),
              metadata: {},
            },
          }
        )
      );

      // Act
      const result = errorTransformer.transform(error, context);

      // Assert
      expect(result).toBeInstanceOf(QueryException);
      expect(result.message).toBe('Achievement not found');
      expect(result.getCode()).toBe(DB_GAME_QUERY_ACHIEVEMENT_NOT_FOUND);
      expect(mockCommonErrorHandler.handleError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          operation: 'findAchievementById',
          entity: 'Achievement',
          journey: 'gamification',
        })
      );
    });
  });

  describe('Error classification', () => {
    it('should correctly identify transient errors', () => {
      // Arrange
      const connectionError = new ConnectionException(
        'Connection timeout',
        DB_CONN_TIMEOUT,
        {
          errorType: DatabaseErrorType.CONNECTION,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.RECOVERABLE,
          originalError: new Error('Connection timeout'),
          context: {
            operation: 'connectToDatabase',
            entity: 'Database',
            timestamp: new Date(),
            metadata: {},
          },
        }
      );

      // Act
      const isTransient = errorTransformer.isTransientError(connectionError);

      // Assert
      expect(isTransient).toBe(true);
    });

    it('should correctly identify non-transient errors', () => {
      // Arrange
      const integrityError = new IntegrityException(
        'Unique constraint violation',
        DB_INTEGRITY_UNIQUE_VIOLATION,
        {
          errorType: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: new Error('Unique constraint violation'),
          context: {
            operation: 'createUser',
            entity: 'User',
            timestamp: new Date(),
            metadata: {},
          },
        }
      );

      // Act
      const isTransient = errorTransformer.isTransientError(integrityError);

      // Assert
      expect(isTransient).toBe(false);
    });

    it('should correctly identify integrity errors', () => {
      // Arrange
      const integrityError = new IntegrityException(
        'Foreign key constraint violation',
        DB_INTEGRITY_FOREIGN_KEY_VIOLATION,
        {
          errorType: DatabaseErrorType.INTEGRITY,
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: new Error('Foreign key constraint violation'),
          context: {
            operation: 'createAppointment',
            entity: 'Appointment',
            timestamp: new Date(),
            metadata: {},
          },
        }
      );

      // Act
      const isIntegrityError = errorTransformer.isIntegrityError(integrityError);

      // Assert
      expect(isIntegrityError).toBe(true);
    });

    it('should correctly identify critical errors', () => {
      // Arrange
      const configError = new ConfigurationException(
        'Invalid database configuration',
        DB_CONFIG_INVALID,
        {
          errorType: DatabaseErrorType.CONFIGURATION,
          severity: DatabaseErrorSeverity.CRITICAL,
          recoverability: DatabaseErrorRecoverability.NON_RECOVERABLE,
          originalError: new Error('Invalid database configuration'),
          context: {
            operation: 'initializeDatabase',
            entity: 'Database',
            timestamp: new Date(),
            metadata: {},
          },
        }
      );

      // Act
      const isCritical = errorTransformer.isCriticalError(configError);

      // Assert
      expect(isCritical).toBe(true);
    });
  });

  describe('Error enrichment', () => {
    it('should enrich an existing error with additional context', () => {
      // Arrange
      const originalError = new QueryException(
        'User not found',
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: new Error('User not found'),
          context: {
            operation: 'findUserById',
            entity: 'User',
            params: { id: '123' },
            timestamp: new Date(),
            metadata: {},
          },
        }
      );

      const additionalContext: Partial<DatabaseOperationContext> = {
        metadata: {
          requestId: 'req-456',
          userId: 'user-789',
          source: 'API request',
        },
      };

      // Act
      const enrichedError = errorTransformer.enrichError(originalError, additionalContext);

      // Assert
      expect(enrichedError).toBeInstanceOf(DatabaseException);
      expect(enrichedError.message).toBe('User not found');
      expect(enrichedError.getContext().metadata).toEqual({
        requestId: 'req-456',
        userId: 'user-789',
        source: 'API request',
      });
    });

    it('should override existing context properties when provided', () => {
      // Arrange
      const originalError = new QueryException(
        'User not found',
        DB_QUERY_FAILED,
        {
          errorType: DatabaseErrorType.QUERY,
          severity: DatabaseErrorSeverity.MINOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          originalError: new Error('User not found'),
          context: {
            operation: 'findUserById',
            entity: 'User',
            params: { id: '123' },
            timestamp: new Date(),
            metadata: {
              source: 'Database query',
            },
          },
        }
      );

      const additionalContext: Partial<DatabaseOperationContext> = {
        operation: 'getUserDetails',
        metadata: {
          requestId: 'req-456',
          source: 'API request',
        },
      };

      // Act
      const enrichedError = errorTransformer.enrichError(originalError, additionalContext);

      // Assert
      expect(enrichedError).toBeInstanceOf(DatabaseException);
      expect(enrichedError.getContext().operation).toBe('getUserDetails');
      expect(enrichedError.getContext().metadata).toEqual({
        requestId: 'req-456',
        source: 'API request',
      });
    });
  });

  describe('Custom error creation', () => {
    it('should create a validation error with proper context', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'createUser',
        entity: 'User',
        params: { email: 'invalid-email' },
      };

      const validationErrors = {
        email: ['Invalid email format'],
      };

      // Act
      const error = errorTransformer.createValidationError(
        'Validation failed for user creation',
        context,
        validationErrors
      );

      // Assert
      expect(error).toBeInstanceOf(QueryException);
      expect(error.message).toBe('Validation failed for user creation');
      expect(error.getContext().metadata).toEqual({
        validationErrors,
      });
      expect(error.getErrorType()).toBe(DatabaseErrorType.QUERY);
      expect(error.getSeverity()).toBe(DatabaseErrorSeverity.MINOR);
      expect(error.getRecoverability()).toBe(DatabaseErrorRecoverability.RECOVERABLE);
    });

    it('should create an integrity error with proper context', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'createUser',
        entity: 'User',
        params: { email: 'existing@example.com' },
      };

      // Act
      const error = errorTransformer.createIntegrityError(
        'Unique constraint violation on email',
        context,
        'users_email_unique'
      );

      // Assert
      expect(error).toBeInstanceOf(IntegrityException);
      expect(error.message).toBe('Unique constraint violation on email');
      expect(error.getContext().metadata).toEqual({
        constraintName: 'users_email_unique',
      });
      expect(error.getErrorType()).toBe(DatabaseErrorType.INTEGRITY);
      expect(error.getSeverity()).toBe(DatabaseErrorSeverity.MAJOR);
      expect(error.getRecoverability()).toBe(DatabaseErrorRecoverability.RECOVERABLE);
    });

    it('should create a connection error with proper context', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'connectToDatabase',
        entity: 'Database',
      };

      // Act
      const error = errorTransformer.createConnectionError(
        'Failed to connect to database: connection refused',
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ConnectionException);
      expect(error.message).toBe('Failed to connect to database: connection refused');
      expect(error.getErrorType()).toBe(DatabaseErrorType.CONNECTION);
      expect(error.getSeverity()).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(error.getRecoverability()).toBe(DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE);
    });

    it('should create a transaction error with proper context', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'createUserWithProfile',
        entity: 'User',
        params: { email: 'user@example.com', profile: { name: 'Test User' } },
      };

      // Act
      const error = errorTransformer.createTransactionError(
        'Transaction failed: could not commit changes',
        context
      );

      // Assert
      expect(error).toBeInstanceOf(TransactionException);
      expect(error.message).toBe('Transaction failed: could not commit changes');
      expect(error.getErrorType()).toBe(DatabaseErrorType.TRANSACTION);
      expect(error.getSeverity()).toBe(DatabaseErrorSeverity.MAJOR);
      expect(error.getRecoverability()).toBe(DatabaseErrorRecoverability.POTENTIALLY_RECOVERABLE);
    });

    it('should create a configuration error with proper context', () => {
      // Arrange
      const context: DatabaseOperationContext = {
        operation: 'initializeDatabase',
        entity: 'Database',
      };

      // Act
      const error = errorTransformer.createConfigurationError(
        'Invalid database configuration: missing connection string',
        context
      );

      // Assert
      expect(error).toBeInstanceOf(ConfigurationException);
      expect(error.message).toBe('Invalid database configuration: missing connection string');
      expect(error.getErrorType()).toBe(DatabaseErrorType.CONFIGURATION);
      expect(error.getSeverity()).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(error.getRecoverability()).toBe(DatabaseErrorRecoverability.NON_RECOVERABLE);
    });
  });
});