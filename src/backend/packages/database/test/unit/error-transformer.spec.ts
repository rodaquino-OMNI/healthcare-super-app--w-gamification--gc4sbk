import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError, PrismaClientUnknownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { z } from 'zod';
import { IsString, IsNotEmpty } from 'class-validator';
import {
  ErrorTransformer,
  PrismaErrorTransformer,
  RedisErrorTransformer,
  TypeORMErrorTransformer,
  ErrorTransformerFactory,
  DatabaseErrorType,
  DatabaseErrorSeverity,
  DatabaseErrorRecoverability,
  DatabaseException,
  DATABASE_ERROR_CODES,
  DatabaseErrorContext
} from '../../src/errors/error-transformer';

/**
 * Test class for class-validator tests
 */
class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

/**
 * Test schema for Zod validation tests
 */
const testSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

describe('ErrorTransformer', () => {
  // Common test context
  const testContext: DatabaseErrorContext = {
    operation: 'findUnique',
    entity: 'User',
    journey: 'auth',
    query: 'SELECT * FROM users WHERE id = ?',
    params: { id: 1 },
    metadata: { source: 'test' }
  };

  describe('PrismaErrorTransformer', () => {
    let transformer: PrismaErrorTransformer;

    beforeEach(() => {
      transformer = new PrismaErrorTransformer();
    });

    it('should transform PrismaClientKnownRequestError with unique constraint violation', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(result.context).toEqual(testContext);
      expect(result.cause).toBe(prismaError);
    });

    it('should transform PrismaClientKnownRequestError with foreign key violation', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Foreign key constraint violation',
        { code: 'P2003', clientVersion: '4.0.0' },
        { field_name: 'userId' }
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform PrismaClientKnownRequestError with record not found', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '4.0.0' },
        {}
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform PrismaClientKnownRequestError with connection error', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Connection refused',
        { code: 'P1001', clientVersion: '4.0.0' },
        {}
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });

    it('should transform PrismaClientValidationError', () => {
      // Arrange
      const prismaError = new PrismaClientValidationError(
        'Invalid argument provided',
        { clientVersion: '4.0.0' }
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_INVALID_PARAMS);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform PrismaClientUnknownRequestError', () => {
      // Arrange
      const prismaError = new PrismaClientUnknownRequestError(
        'Unknown error occurred',
        { clientVersion: '4.0.0' }
      );

      // Act
      const result = transformer.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });
  });

  describe('RedisErrorTransformer', () => {
    let transformer: RedisErrorTransformer;

    beforeEach(() => {
      transformer = new RedisErrorTransformer();
    });

    it('should transform Redis connection error', () => {
      // Arrange
      const redisError = new Error('ECONNREFUSED: Connection refused to Redis server at 127.0.0.1:6379');
      redisError.name = 'RedisError';

      // Act
      const result = transformer.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });

    it('should transform Redis authentication error', () => {
      // Arrange
      const redisError = new Error('WRONGPASS invalid username-password pair');
      redisError.name = 'ReplyError';

      // Act
      const result = transformer.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_AUTHENTICATION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform Redis timeout error', () => {
      // Arrange
      const redisError = new Error('Connection timed out');
      redisError.name = 'RedisError';

      // Act
      const result = transformer.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_TIMEOUT);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });

    it('should transform Redis command error', () => {
      // Arrange
      const redisError = new Error('ERR syntax error');
      redisError.name = 'ReplyError';

      // Act
      const result = transformer.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_SYNTAX_ERROR);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform Redis memory error', () => {
      // Arrange
      const redisError = new Error('OOM command not allowed when used memory > maxmemory');
      redisError.name = 'ReplyError';

      // Act
      const result = transformer.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONFIGURATION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONFIG_RESOURCE_LIMIT);
      expect(result.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });
  });

  describe('TypeORMErrorTransformer', () => {
    let transformer: TypeORMErrorTransformer;

    beforeEach(() => {
      transformer = new TypeORMErrorTransformer();
    });

    it('should transform TypeORM connection error', () => {
      // Arrange
      const typeormError = new Error('Connection refused');
      typeormError.name = 'ConnectionError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
    });

    it('should transform TypeORM unique constraint error', () => {
      // Arrange
      const typeormError = new Error('duplicate key value violates unique constraint "users_email_key" (23505)');
      typeormError.name = 'QueryFailedError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform TypeORM foreign key error', () => {
      // Arrange
      const typeormError = new Error('insert or update on table "profiles" violates foreign key constraint "profiles_user_id_fkey" (23503)');
      typeormError.name = 'QueryFailedError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_FOREIGN_KEY);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform TypeORM not null error', () => {
      // Arrange
      const typeormError = new Error('null value in column "name" violates not-null constraint (23502)');
      typeormError.name = 'QueryFailedError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_NOT_NULL);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform TypeORM entity not found error', () => {
      // Arrange
      const typeormError = new Error('Could not find any entity of type "User" matching: { id: 1 }');
      typeormError.name = 'EntityNotFoundError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.MINOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should transform TypeORM transaction error', () => {
      // Arrange
      const typeormError = new Error('Transaction is not started');
      typeormError.name = 'TransactionNotStartedError';

      // Act
      const result = transformer.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.TRANSACTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.TRANSACTION_FAILED);
      expect(result.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(result.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });
  });

  describe('ErrorTransformerFactory', () => {
    it('should create PrismaErrorTransformer for Prisma errors', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      // Act
      const result = ErrorTransformerFactory.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT);
    });
    
    it('should create PrismaErrorTransformer for errors with Prisma in the name', () => {
      // Arrange
      const prismaError = new Error('Prisma client error');
      prismaError.name = 'PrismaError';

      // Act
      const result = ErrorTransformerFactory.transform(prismaError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED);
    });

    it('should create RedisErrorTransformer for Redis errors', () => {
      // Arrange
      const redisError = new Error('ECONNREFUSED: Connection refused to Redis server at 127.0.0.1:6379');
      redisError.name = 'RedisError';

      // Act
      const result = ErrorTransformerFactory.transform(redisError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.CONNECTION);
      expect(result.code).toBe(DATABASE_ERROR_CODES.CONNECTION_FAILED);
    });

    it('should create TypeORMErrorTransformer for TypeORM errors', () => {
      // Arrange
      const typeormError = new Error('duplicate key value violates unique constraint "users_email_key" (23505)');
      typeormError.name = 'QueryFailedError';

      // Act
      const result = ErrorTransformerFactory.transform(typeormError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT);
    });

    it('should default to PrismaErrorTransformer for unknown errors', () => {
      // Arrange
      const unknownError = new Error('Unknown database error');

      // Act
      const result = ErrorTransformerFactory.transform(unknownError, testContext);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.type).toBe(DatabaseErrorType.QUERY);
      expect(result.code).toBe(DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED);
    });
  });

  describe('Context Enrichment', () => {
    it('should enrich error context with operation details', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'User',
        journey: 'auth',
        params: { email: 'test@example.com', password: 'password123' }
      };

      // Act
      const result = ErrorTransformer.transform(prismaError, context, { includeStackTrace: true });

      // Assert
      expect(result.context).toBeDefined();
      expect(result.context?.operation).toBe('create');
      expect(result.context?.entity).toBe('User');
      expect(result.context?.journey).toBe('auth');
      expect(result.context?.params).toBeDefined();
      expect(result.context?.metadata).toBeDefined();
      expect(result.context?.metadata?.stackTrace).toBeDefined();
    });
    
    it('should handle undefined context gracefully', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      // Act
      const result = ErrorTransformer.transform(prismaError, undefined);

      // Assert
      expect(result).toBeInstanceOf(DatabaseException);
      expect(result.context).toBeDefined();
      expect(result.context).toEqual({});
    });

    it('should filter sensitive data from error context', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'User',
        journey: 'auth',
        params: {
          email: 'test@example.com',
          password: 'password123',
          token: 'secret-token',
          credentials: { apiKey: '12345' }
        }
      };

      // Act
      const result = ErrorTransformer.transform(prismaError, context);

      // Assert
      expect(result.context).toBeDefined();
      expect(result.context?.params?.email).toBe('test@example.com');
      expect(result.context?.params?.password).toBe('[REDACTED]');
      expect(result.context?.params?.token).toBe('[REDACTED]');
      expect(result.context?.params?.credentials?.apiKey).toBe('[REDACTED]');
    });
  });

  describe('Error Classification', () => {
    it('should classify errors by type, severity, and recoverability', () => {
      // Arrange
      const connectionError = new PrismaClientKnownRequestError(
        'Connection refused',
        { code: 'P1001', clientVersion: '4.0.0' },
        {}
      );

      const integrityError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      const queryError = new PrismaClientKnownRequestError(
        'Invalid query',
        { code: 'P2009', clientVersion: '4.0.0' },
        {}
      );

      // Act
      const connectionResult = ErrorTransformer.transform(connectionError);
      const integrityResult = ErrorTransformer.transform(integrityError);
      const queryResult = ErrorTransformer.transform(queryError);

      // Assert
      expect(connectionResult.type).toBe(DatabaseErrorType.CONNECTION);
      expect(connectionResult.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(connectionResult.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);

      expect(integrityResult.type).toBe(DatabaseErrorType.INTEGRITY);
      expect(integrityResult.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(integrityResult.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);

      expect(queryResult.type).toBe(DatabaseErrorType.QUERY);
      expect(queryResult.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(queryResult.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
    });

    it('should map database error types to application error types', () => {
      // Arrange
      const connectionError = new PrismaClientKnownRequestError(
        'Connection refused',
        { code: 'P1001', clientVersion: '4.0.0' },
        {}
      );

      const integrityError = new PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '4.0.0' },
        { target: ['email'] }
      );

      const queryError = new PrismaClientKnownRequestError(
        'Invalid query',
        { code: 'P2009', clientVersion: '4.0.0' },
        {}
      );

      // Act
      const connectionResult = ErrorTransformer.transform(connectionError);
      const integrityResult = ErrorTransformer.transform(integrityError);
      const queryResult = ErrorTransformer.transform(queryError);

      // Assert
      expect(connectionResult.toErrorType()).toBe('TECHNICAL');
      expect(integrityResult.toErrorType()).toBe('VALIDATION');
      expect(queryResult.toErrorType()).toBe('BUSINESS');
    });
  });

  describe('Journey-Specific Transformations', () => {
    it('should handle health journey-specific errors', () => {
      // Arrange
      const healthError = new Error('Failed to store health metrics');
      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'HealthMetric',
        journey: 'health',
        params: { userId: 1, type: 'HEART_RATE', value: 75 }
      };

      // Mock the error classification to return a health-specific error code
      jest.spyOn(PrismaErrorTransformer.prototype, 'classify').mockReturnValue({
        type: DatabaseErrorType.QUERY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.HEALTH_METRICS_STORAGE_FAILED,
        message: 'Failed to store health metrics',
        details: { originalError: healthError.message }
      });

      // Act
      const result = ErrorTransformer.transform(healthError, context);

      // Assert
      expect(result.code).toBe(DATABASE_ERROR_CODES.HEALTH_METRICS_STORAGE_FAILED);
      expect(result.context?.journey).toBe('health');
    });

    it('should handle care journey-specific errors', () => {
      // Arrange
      const careError = new Error('Appointment conflict detected');
      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'Appointment',
        journey: 'care',
        params: { userId: 1, providerId: 2, date: new Date() }
      };

      // Mock the error classification to return a care-specific error code
      jest.spyOn(PrismaErrorTransformer.prototype, 'classify').mockReturnValue({
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.CARE_APPOINTMENT_CONFLICT,
        message: 'Appointment conflict detected',
        details: { originalError: careError.message }
      });

      // Act
      const result = ErrorTransformer.transform(careError, context);

      // Assert
      expect(result.code).toBe(DATABASE_ERROR_CODES.CARE_APPOINTMENT_CONFLICT);
      expect(result.context?.journey).toBe('care');
    });

    it('should handle plan journey-specific errors', () => {
      // Arrange
      const planError = new Error('Claim data integrity error');
      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'Claim',
        journey: 'plan',
        params: { userId: 1, amount: 100, type: 'MEDICAL' }
      };

      // Mock the error classification to return a plan-specific error code
      jest.spyOn(PrismaErrorTransformer.prototype, 'classify').mockReturnValue({
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.PLAN_CLAIM_DATA_INTEGRITY,
        message: 'Claim data integrity error',
        details: { originalError: planError.message }
      });

      // Act
      const result = ErrorTransformer.transform(planError, context);

      // Assert
      expect(result.code).toBe(DATABASE_ERROR_CODES.PLAN_CLAIM_DATA_INTEGRITY);
      expect(result.context?.journey).toBe('plan');
    });

    it('should handle gamification journey-specific errors', () => {
      // Arrange
      const gameError = new Error('Achievement conflict detected');
      const context: DatabaseErrorContext = {
        operation: 'create',
        entity: 'Achievement',
        journey: 'gamification',
        params: { userId: 1, type: 'STEPS_GOAL', level: 2 }
      };

      // Mock the error classification to return a gamification-specific error code
      jest.spyOn(PrismaErrorTransformer.prototype, 'classify').mockReturnValue({
        type: DatabaseErrorType.INTEGRITY,
        severity: DatabaseErrorSeverity.MAJOR,
        recoverability: DatabaseErrorRecoverability.PERMANENT,
        code: DATABASE_ERROR_CODES.GAME_ACHIEVEMENT_CONFLICT,
        message: 'Achievement conflict detected',
        details: { originalError: gameError.message }
      });

      // Act
      const result = ErrorTransformer.transform(gameError, context);

      // Assert
      expect(result.code).toBe(DATABASE_ERROR_CODES.GAME_ACHIEVEMENT_CONFLICT);
      expect(result.context?.journey).toBe('gamification');
    });
  });

  describe('Validation Utilities', () => {
    it('should validate data with Zod', () => {
      // Arrange
      const validData = { name: 'John Doe', email: 'john@example.com' };
      const invalidData = { name: '', email: 'not-an-email' };

      // Act
      const validResult = ErrorTransformer.validateWithZod(validData, testSchema);
      const invalidResult = ErrorTransformer.validateWithZod(invalidData, testSchema);

      // Assert
      expect(validResult.success).toBe(true);
      expect(validResult.data).toEqual(validData);

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.issues.length).toBeGreaterThan(0);
    });
    
    it('should handle non-Zod errors during validation', () => {
      // Arrange
      const data = { name: 'John Doe', email: 'john@example.com' };
      const errorMessage = 'Unexpected validation error';
      
      // Mock Zod schema to throw a non-Zod error
      const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error(errorMessage);
        })
      } as unknown as z.ZodType<any>;

      // Act & Assert
      expect(() => ErrorTransformer.validateWithZod(data, mockSchema)).toThrow(errorMessage);
    });

    it('should validate data with class-validator', async () => {
      // Arrange
      const validData = { name: 'John Doe', email: 'john@example.com' };
      const invalidData = { name: '', email: 'not-an-email' };

      // Act
      const validResult = await ErrorTransformer.validateWithClassValidator(validData, TestDto);
      const invalidResult = await ErrorTransformer.validateWithClassValidator(invalidData, TestDto);

      // Assert
      expect(validResult.success).toBe(true);
      expect(validResult.data).toBeDefined();

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('DatabaseException', () => {
    it('should create a proper JSON representation', () => {
      // Arrange
      const exception = new DatabaseException(
        'Unique constraint violation',
        DatabaseErrorType.INTEGRITY,
        DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        testContext
      );

      // Act
      const json = exception.toJSON();

      // Assert
      expect(json).toEqual({
        error: {
          type: DatabaseErrorType.INTEGRITY,
          code: DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
          message: 'Unique constraint violation',
          severity: DatabaseErrorSeverity.MAJOR,
          recoverability: DatabaseErrorRecoverability.PERMANENT,
          details: testContext
        }
      });
    });
    
    it('should maintain proper prototype chain for instanceof checks', () => {
      // Arrange
      const exception = new DatabaseException(
        'Unique constraint violation',
        DatabaseErrorType.INTEGRITY,
        DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        testContext
      );

      // Assert
      expect(exception instanceof DatabaseException).toBe(true);
      expect(exception instanceof Error).toBe(true);
      expect(exception.name).toBe('DatabaseException');
    });
    
    it('should map database error types to application error types correctly', () => {
      // Arrange & Act
      const integrityException = new DatabaseException(
        'Integrity error',
        DatabaseErrorType.INTEGRITY,
        DATABASE_ERROR_CODES.INTEGRITY_UNIQUE_CONSTRAINT,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT
      );
      
      const queryException = new DatabaseException(
        'Query error',
        DatabaseErrorType.QUERY,
        DATABASE_ERROR_CODES.QUERY_EXECUTION_FAILED,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT
      );
      
      const connectionException = new DatabaseException(
        'Connection error',
        DatabaseErrorType.CONNECTION,
        DATABASE_ERROR_CODES.CONNECTION_FAILED,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.TRANSIENT
      );
      
      const transactionException = new DatabaseException(
        'Transaction error',
        DatabaseErrorType.TRANSACTION,
        DATABASE_ERROR_CODES.TRANSACTION_FAILED,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.TRANSIENT
      );
      
      const configException = new DatabaseException(
        'Configuration error',
        DatabaseErrorType.CONFIGURATION,
        DATABASE_ERROR_CODES.CONFIG_INVALID_SETTINGS,
        DatabaseErrorSeverity.CRITICAL,
        DatabaseErrorRecoverability.PERMANENT
      );

      // Assert
      expect(integrityException.toErrorType()).toBe('VALIDATION');
      expect(queryException.toErrorType()).toBe('BUSINESS');
      expect(connectionException.toErrorType()).toBe('TECHNICAL');
      expect(transactionException.toErrorType()).toBe('TECHNICAL');
      expect(configException.toErrorType()).toBe('TECHNICAL');
    });
  });
});