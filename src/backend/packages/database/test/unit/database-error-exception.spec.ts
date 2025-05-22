import { ErrorType } from '@austa/errors';
import {
  DatabaseException,
  ConnectionException,
  QueryException,
  TransactionException,
  IntegrityException,
  ConfigurationException,
  DatabaseErrorSeverity,
  DatabaseErrorContext
} from '../../src/errors/database-error.exception';

describe('Database Exception Classes', () => {
  describe('DatabaseException', () => {
    it('should create a base database exception with default values', () => {
      // Arrange & Act
      const exception = new DatabaseException(
        'Database error occurred',
        'DB_ERROR',
        {}
      );

      // Assert
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Database error occurred');
      expect(exception.code).toBe('DB_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.MEDIUM);
      expect(exception.context.recoverable).toBe(true);
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions).toEqual([]);
    });

    it('should create a database exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'health',
        severity: DatabaseErrorSeverity.HIGH,
        recoverable: false,
        recoverySuggestions: ['Retry the operation', 'Check database connection'],
        operation: 'findUserById',
        entity: 'User',
        technicalDetails: { userId: '123', errorCode: 'P2025' }
      };

      // Act
      const exception = new DatabaseException(
        'Failed to find user',
        'DB_QUERY_NOT_FOUND',
        context
      );

      // Assert
      expect(exception.message).toBe('Failed to find user');
      expect(exception.code).toBe('DB_QUERY_NOT_FOUND');
      expect(exception.context.journey).toBe('health');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.HIGH);
      expect(exception.context.recoverable).toBe(false);
      expect(exception.context.recoverySuggestions).toEqual(['Retry the operation', 'Check database connection']);
      expect(exception.context.operation).toBe('findUserById');
      expect(exception.context.entity).toBe('User');
      expect(exception.context.technicalDetails).toEqual({ userId: '123', errorCode: 'P2025' });
    });

    it('should properly serialize to JSON with context information', () => {
      // Arrange
      const exception = new DatabaseException(
        'Database error occurred',
        'DB_ERROR',
        {
          journey: 'care',
          severity: DatabaseErrorSeverity.MEDIUM,
          recoverable: true,
          recoverySuggestions: ['Check database connection']
        }
      );

      // Act
      const json = exception.toJSON();

      // Assert
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('message', 'Database error occurred');
      expect(json.error).toHaveProperty('code', 'DB_ERROR');
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('context');
      expect(json.error.context).toHaveProperty('journey', 'care');
      expect(json.error.context).toHaveProperty('severity', DatabaseErrorSeverity.MEDIUM);
      expect(json.error.context).toHaveProperty('recoverable', true);
      expect(json.error.context).toHaveProperty('recoverySuggestions', ['Check database connection']);
    });

    it('should capture original error as cause', () => {
      // Arrange
      const originalError = new Error('Original database error');
      
      // Act
      const exception = new DatabaseException(
        'Database error occurred',
        'DB_ERROR',
        {},
        originalError
      );

      // Assert
      expect(exception.cause).toBe(originalError);
    });
  });

  describe('ConnectionException', () => {
    it('should create a connection exception with default values', () => {
      // Arrange & Act
      const exception = new ConnectionException('Failed to connect to database');

      // Assert
      expect(exception).toBeInstanceOf(ConnectionException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Failed to connect to database');
      expect(exception.code).toBe('DB_CONNECTION_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.HIGH);
      expect(exception.context.recoverable).toBe(true);
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions.length).toBeGreaterThan(0);
      expect(exception.context.recoverySuggestions).toContain('Check database server status and network connectivity');
    });

    it('should create a connection exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'gamification',
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverable: false,
        recoverySuggestions: ['Restart database server'],
        operation: 'connectToDatabase',
        technicalDetails: { host: 'db.example.com', port: 5432 }
      };

      // Act
      const exception = new ConnectionException(
        'Database connection timeout',
        context
      );

      // Assert
      expect(exception.message).toBe('Database connection timeout');
      expect(exception.context.journey).toBe('gamification');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(exception.context.recoverable).toBe(false);
      expect(exception.context.recoverySuggestions).toEqual(['Restart database server']);
      expect(exception.context.operation).toBe('connectToDatabase');
      expect(exception.context.technicalDetails).toEqual({ host: 'db.example.com', port: 5432 });
    });
  });

  describe('QueryException', () => {
    it('should create a query exception with default values', () => {
      // Arrange & Act
      const exception = new QueryException('Failed to execute query');

      // Assert
      expect(exception).toBeInstanceOf(QueryException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Failed to execute query');
      expect(exception.code).toBe('DB_QUERY_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.MEDIUM);
      expect(exception.context.recoverable).toBe(true);
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions.length).toBeGreaterThan(0);
      expect(exception.context.recoverySuggestions).toContain('Check query syntax for errors');
    });

    it('should create a query exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'health',
        severity: DatabaseErrorSeverity.LOW,
        operation: 'findHealthMetrics',
        entity: 'HealthMetric',
        technicalDetails: { query: 'SELECT * FROM health_metrics WHERE user_id = ?', params: ['123'] }
      };

      // Act
      const exception = new QueryException(
        'Invalid query parameters',
        context
      );

      // Assert
      expect(exception.message).toBe('Invalid query parameters');
      expect(exception.context.journey).toBe('health');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.LOW);
      expect(exception.context.operation).toBe('findHealthMetrics');
      expect(exception.context.entity).toBe('HealthMetric');
      expect(exception.context.technicalDetails).toEqual({ 
        query: 'SELECT * FROM health_metrics WHERE user_id = ?', 
        params: ['123'] 
      });
    });
  });

  describe('TransactionException', () => {
    it('should create a transaction exception with default values', () => {
      // Arrange & Act
      const exception = new TransactionException('Transaction failed to commit');

      // Assert
      expect(exception).toBeInstanceOf(TransactionException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Transaction failed to commit');
      expect(exception.code).toBe('DB_TRANSACTION_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.HIGH);
      expect(exception.context.recoverable).toBe(false); // Transactions default to non-recoverable
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions.length).toBeGreaterThan(0);
      expect(exception.context.recoverySuggestions).toContain('Check for deadlocks or lock timeouts');
    });

    it('should create a transaction exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'plan',
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverable: true, // Override default
        operation: 'createClaim',
        entity: 'Claim',
        technicalDetails: { transactionId: 'tx-12345' }
      };

      // Act
      const exception = new TransactionException(
        'Transaction deadlock detected',
        context
      );

      // Assert
      expect(exception.message).toBe('Transaction deadlock detected');
      expect(exception.context.journey).toBe('plan');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(exception.context.recoverable).toBe(true);
      expect(exception.context.operation).toBe('createClaim');
      expect(exception.context.entity).toBe('Claim');
      expect(exception.context.technicalDetails).toEqual({ transactionId: 'tx-12345' });
    });
  });

  describe('IntegrityException', () => {
    it('should create an integrity exception with default values', () => {
      // Arrange & Act
      const exception = new IntegrityException('Integrity constraint violation');

      // Assert
      expect(exception).toBeInstanceOf(IntegrityException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Integrity constraint violation');
      expect(exception.code).toBe('DB_INTEGRITY_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.MEDIUM);
      expect(exception.context.recoverable).toBe(false); // Integrity errors default to non-recoverable
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions.length).toBeGreaterThan(0);
      expect(exception.context.recoverySuggestions).toContain('Check for duplicate key violations');
    });

    it('should create an integrity exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'care',
        severity: DatabaseErrorSeverity.HIGH,
        operation: 'createAppointment',
        entity: 'Appointment',
        technicalDetails: { constraint: 'unique_appointment_time_provider' }
      };

      // Act
      const exception = new IntegrityException(
        'Duplicate appointment time for provider',
        context
      );

      // Assert
      expect(exception.message).toBe('Duplicate appointment time for provider');
      expect(exception.context.journey).toBe('care');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.HIGH);
      expect(exception.context.operation).toBe('createAppointment');
      expect(exception.context.entity).toBe('Appointment');
      expect(exception.context.technicalDetails).toEqual({ constraint: 'unique_appointment_time_provider' });
    });
  });

  describe('ConfigurationException', () => {
    it('should create a configuration exception with default values', () => {
      // Arrange & Act
      const exception = new ConfigurationException('Database configuration error');

      // Assert
      expect(exception).toBeInstanceOf(ConfigurationException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe('Database configuration error');
      expect(exception.code).toBe('DB_CONFIG_ERROR');
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.HIGH);
      expect(exception.context.recoverable).toBe(true);
      expect(exception.context.journey).toBe('common');
      expect(exception.context.recoverySuggestions.length).toBeGreaterThan(0);
      expect(exception.context.recoverySuggestions).toContain('Verify database configuration settings');
    });

    it('should create a configuration exception with custom context', () => {
      // Arrange
      const context: Partial<DatabaseErrorContext> = {
        journey: 'gamification',
        severity: DatabaseErrorSeverity.CRITICAL,
        recoverable: false,
        operation: 'initializePrismaClient',
        technicalDetails: { missingEnvVars: ['DATABASE_URL'] }
      };

      // Act
      const exception = new ConfigurationException(
        'Missing required database configuration',
        context
      );

      // Assert
      expect(exception.message).toBe('Missing required database configuration');
      expect(exception.context.journey).toBe('gamification');
      expect(exception.context.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(exception.context.recoverable).toBe(false);
      expect(exception.context.operation).toBe('initializePrismaClient');
      expect(exception.context.technicalDetails).toEqual({ missingEnvVars: ['DATABASE_URL'] });
    });
  });

  describe('Error Handler Integration', () => {
    it('should be catchable as DatabaseException regardless of specific type', () => {
      // Arrange
      const exceptions = [
        new ConnectionException('Connection error'),
        new QueryException('Query error'),
        new TransactionException('Transaction error'),
        new IntegrityException('Integrity error'),
        new ConfigurationException('Configuration error')
      ];
      
      // Act & Assert
      exceptions.forEach(exception => {
        try {
          throw exception;
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseException);
          expect(error.type).toBe(ErrorType.TECHNICAL);
        }
      });
    });

    it('should maintain instanceof checks for specific exception types', () => {
      // Arrange
      const connectionException = new ConnectionException('Connection error');
      const queryException = new QueryException('Query error');
      
      // Act & Assert
      try {
        throw connectionException;
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error).not.toBeInstanceOf(QueryException);
      }
      
      try {
        throw queryException;
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error).not.toBeInstanceOf(ConnectionException);
      }
    });
  });

  describe('Journey Context Integration', () => {
    it('should properly handle journey-specific context in all exception types', () => {
      // Arrange & Act
      const healthException = new QueryException('Query error', { journey: 'health' });
      const careException = new IntegrityException('Integrity error', { journey: 'care' });
      const planException = new TransactionException('Transaction error', { journey: 'plan' });
      const gamificationException = new ConnectionException('Connection error', { journey: 'gamification' });
      
      // Assert
      expect(healthException.context.journey).toBe('health');
      expect(careException.context.journey).toBe('care');
      expect(planException.context.journey).toBe('plan');
      expect(gamificationException.context.journey).toBe('gamification');
    });

    it('should include journey context in serialized JSON output', () => {
      // Arrange
      const exception = new QueryException('Query error', { 
        journey: 'health',
        operation: 'findHealthMetrics',
        entity: 'HealthMetric'
      });
      
      // Act
      const json = exception.toJSON();
      
      // Assert
      expect(json.error.context.journey).toBe('health');
    });
  });
});