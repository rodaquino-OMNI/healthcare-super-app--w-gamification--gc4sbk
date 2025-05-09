import { ErrorType } from '@austa/errors';
import {
  ConfigurationException,
  ConnectionException,
  DatabaseErrorRecoverability,
  DatabaseErrorSeverity,
  DatabaseException,
  IntegrityException,
  JourneyDatabaseException,
  QueryException,
  TransactionException,
} from '../../src/errors/database-error.exception';
import * as ErrorCodes from '../../src/errors/database-error.codes';

describe('Database Exception Classes', () => {
  describe('DatabaseException', () => {
    it('should create a base database exception with default values', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      
      const exception = new DatabaseException(message, code);
      
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.type).toBe(ErrorType.TECHNICAL);
      expect(exception.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(exception.journeyContext).toBeUndefined();
      expect(exception.operationContext).toBeUndefined();
    });

    it('should create a database exception with custom severity and recoverability', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const severity = DatabaseErrorSeverity.CRITICAL;
      const recoverability = DatabaseErrorRecoverability.TRANSIENT;
      
      const exception = new DatabaseException(
        message,
        code,
        severity,
        recoverability
      );
      
      expect(exception.severity).toBe(severity);
      expect(exception.recoverability).toBe(recoverability);
    });

    it('should create a database exception with journey context', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const journeyContext = {
        journey: 'health',
        feature: 'metrics',
        userId: 'user-123',
        additionalInfo: 'some context'
      };
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext
      );
      
      expect(exception.journeyContext).toEqual(journeyContext);
    });

    it('should create a database exception with operation context', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const operationContext = {
        operation: 'select',
        entity: 'health_metrics',
        query: 'SELECT * FROM health_metrics WHERE user_id = $1',
        params: { userId: 'user-123' }
      };
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        operationContext
      );
      
      expect(exception.operationContext).toEqual(operationContext);
    });

    it('should create a database exception with recovery suggestion', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const recoverySuggestion = 'Check your SQL syntax and try again';
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        undefined,
        recoverySuggestion
      );
      
      expect(exception.recoverySuggestion).toBe(recoverySuggestion);
    });

    it('should create a database exception with original cause', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const originalError = new Error('Original error');
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        undefined,
        undefined,
        originalError
      );
      
      expect(exception.cause).toBe(originalError);
    });

    it('should properly serialize to JSON with all context', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const journeyContext = { journey: 'health', feature: 'metrics' };
      const operationContext = { operation: 'select', entity: 'health_metrics' };
      const recoverySuggestion = 'Check your SQL syntax';
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext,
        recoverySuggestion
      );
      
      const json = exception.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('message', message);
      expect(json.error).toHaveProperty('code', code);
      expect(json.error).toHaveProperty('type', ErrorType.TECHNICAL);
      expect(json.error).toHaveProperty('severity', DatabaseErrorSeverity.MAJOR);
      expect(json.error).toHaveProperty('recoverability', DatabaseErrorRecoverability.PERMANENT);
      expect(json.error).toHaveProperty('journeyContext', journeyContext);
      expect(json.error).toHaveProperty('operationContext', operationContext);
      expect(json.error).toHaveProperty('recoverySuggestion', recoverySuggestion);
    });

    it('should generate a detailed message with context', () => {
      const message = 'Database error occurred';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const journeyContext = { journey: 'health', feature: 'metrics' };
      const operationContext = { operation: 'select', entity: 'health_metrics' };
      
      const exception = new DatabaseException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        journeyContext,
        operationContext
      );
      
      const detailedMessage = exception.getDetailedMessage();
      
      expect(detailedMessage).toContain(message);
      expect(detailedMessage).toContain(code);
      expect(detailedMessage).toContain('Journey: health');
      expect(detailedMessage).toContain('Operation: select');
      expect(detailedMessage).toContain('Entity: health_metrics');
    });
  });

  describe('ConnectionException', () => {
    it('should create a connection exception with default values', () => {
      const message = 'Failed to connect to database';
      const code = ErrorCodes.DB_CONN_PG_FAILED;
      
      const exception = new ConnectionException(message, code);
      
      expect(exception).toBeInstanceOf(ConnectionException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
      expect(exception.recoverySuggestion).toContain('Check database availability');
    });

    it('should allow overriding default values', () => {
      const message = 'Failed to connect to database';
      const code = ErrorCodes.DB_CONN_PG_FAILED;
      const severity = DatabaseErrorSeverity.MAJOR;
      const recoverability = DatabaseErrorRecoverability.PERMANENT;
      const recoverySuggestion = 'Custom recovery suggestion';
      
      const exception = new ConnectionException(
        message,
        code,
        severity,
        recoverability,
        undefined,
        undefined,
        recoverySuggestion
      );
      
      expect(exception.severity).toBe(severity);
      expect(exception.recoverability).toBe(recoverability);
      expect(exception.recoverySuggestion).toBe(recoverySuggestion);
    });
  });

  describe('QueryException', () => {
    it('should create a query exception with default values', () => {
      const message = 'Query execution failed';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      
      const exception = new QueryException(message, code);
      
      expect(exception).toBeInstanceOf(QueryException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(exception.recoverySuggestion).toContain('Check query syntax');
    });

    it('should include query context in serialization', () => {
      const message = 'Query execution failed';
      const code = ErrorCodes.DB_QUERY_PG_SYNTAX;
      const operationContext = {
        operation: 'select',
        entity: 'health_metrics',
        query: 'SELECT * FROM health_metrics WHERE user_id = $1',
        params: { userId: 'user-123' }
      };
      
      const exception = new QueryException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        operationContext
      );
      
      const json = exception.toJSON();
      
      expect(json.error.operationContext).toEqual(operationContext);
    });
  });

  describe('TransactionException', () => {
    it('should create a transaction exception with default values', () => {
      const message = 'Transaction failed';
      const code = ErrorCodes.DB_TRANS_PG_COMMIT_FAILED;
      
      const exception = new TransactionException(message, code);
      
      expect(exception).toBeInstanceOf(TransactionException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.TRANSIENT);
      expect(exception.recoverySuggestion).toContain('Retry the transaction');
    });
  });

  describe('IntegrityException', () => {
    it('should create an integrity exception with default values', () => {
      const message = 'Integrity constraint violation';
      const code = ErrorCodes.DB_INTEG_PG_UNIQUE;
      
      const exception = new IntegrityException(message, code);
      
      expect(exception).toBeInstanceOf(IntegrityException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.severity).toBe(DatabaseErrorSeverity.MAJOR);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(exception.recoverySuggestion).toContain('Check the data for constraint violations');
    });

    it('should handle unique constraint violations with specific context', () => {
      const message = 'Duplicate key value violates unique constraint';
      const code = ErrorCodes.DB_INTEG_PG_UNIQUE;
      const operationContext = {
        operation: 'insert',
        entity: 'users',
        query: 'INSERT INTO users (email) VALUES ($1)',
        params: { email: 'test@example.com' }
      };
      
      const exception = new IntegrityException(
        message,
        code,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        operationContext
      );
      
      expect(exception.operationContext).toEqual(operationContext);
    });
  });

  describe('ConfigurationException', () => {
    it('should create a configuration exception with default values', () => {
      const message = 'Invalid database configuration';
      const code = ErrorCodes.DB_CONFIG_PG_INVALID_URL;
      
      const exception = new ConfigurationException(message, code);
      
      expect(exception).toBeInstanceOf(ConfigurationException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.severity).toBe(DatabaseErrorSeverity.CRITICAL);
      expect(exception.recoverability).toBe(DatabaseErrorRecoverability.PERMANENT);
      expect(exception.recoverySuggestion).toContain('Check database configuration settings');
    });
  });

  describe('JourneyDatabaseException', () => {
    it('should create a journey-specific database exception', () => {
      const message = 'Health journey database error';
      const code = ErrorCodes.DB_HEALTH_METRIC_INVALID;
      const journey = 'health';
      const feature = 'metrics';
      
      const exception = new JourneyDatabaseException(
        message,
        code,
        journey,
        feature
      );
      
      expect(exception).toBeInstanceOf(JourneyDatabaseException);
      expect(exception).toBeInstanceOf(DatabaseException);
      expect(exception.message).toBe(message);
      expect(exception.code).toBe(code);
      expect(exception.journeyContext).toEqual({
        journey,
        feature
      });
    });

    it('should create a journey exception with additional context', () => {
      const message = 'Health journey database error';
      const code = ErrorCodes.DB_HEALTH_METRIC_INVALID;
      const journey = 'health';
      const feature = 'metrics';
      const additionalContext = {
        userId: 'user-123',
        metricType: 'heart_rate',
        value: 75
      };
      
      const exception = new JourneyDatabaseException(
        message,
        code,
        journey,
        feature,
        DatabaseErrorSeverity.MAJOR,
        DatabaseErrorRecoverability.PERMANENT,
        undefined,
        undefined,
        additionalContext
      );
      
      expect(exception.journeyContext).toEqual({
        journey,
        feature,
        ...additionalContext
      });
    });

    it('should generate a journey-specific context message', () => {
      const message = 'Health journey database error';
      const code = ErrorCodes.DB_HEALTH_METRIC_INVALID;
      const journey = 'health';
      const feature = 'metrics';
      
      const exception = new JourneyDatabaseException(
        message,
        code,
        journey,
        feature
      );
      
      const contextMessage = exception.getJourneyContextMessage();
      
      expect(contextMessage).toContain('[HEALTH:metrics]');
      expect(contextMessage).toContain(message);
      expect(contextMessage).toContain(code);
    });

    it('should handle different journey types with appropriate context', () => {
      // Health journey
      const healthException = new JourneyDatabaseException(
        'Health metric error',
        ErrorCodes.DB_HEALTH_METRIC_INVALID,
        'health',
        'metrics'
      );
      
      expect(healthException.journeyContext.journey).toBe('health');
      expect(healthException.getJourneyContextMessage()).toContain('[HEALTH:metrics]');
      
      // Care journey
      const careException = new JourneyDatabaseException(
        'Appointment conflict',
        ErrorCodes.DB_CARE_APPOINTMENT_CONFLICT,
        'care',
        'appointments'
      );
      
      expect(careException.journeyContext.journey).toBe('care');
      expect(careException.getJourneyContextMessage()).toContain('[CARE:appointments]');
      
      // Plan journey
      const planException = new JourneyDatabaseException(
        'Claim duplicate',
        ErrorCodes.DB_PLAN_CLAIM_DUPLICATE,
        'plan',
        'claims'
      );
      
      expect(planException.journeyContext.journey).toBe('plan');
      expect(planException.getJourneyContextMessage()).toContain('[PLAN:claims]');
      
      // Gamification journey
      const gameException = new JourneyDatabaseException(
        'Achievement constraint violation',
        ErrorCodes.DB_GAME_ACHIEVEMENT_CONSTRAINT,
        'gamification',
        'achievements'
      );
      
      expect(gameException.journeyContext.journey).toBe('gamification');
      expect(gameException.getJourneyContextMessage()).toContain('[GAMIFICATION:achievements]');
    });
  });

  describe('Error handling integration', () => {
    it('should allow catching specific exception types', () => {
      const connectionException = new ConnectionException(
        'Connection failed',
        ErrorCodes.DB_CONN_PG_FAILED
      );
      
      const queryException = new QueryException(
        'Query failed',
        ErrorCodes.DB_QUERY_PG_SYNTAX
      );
      
      function throwsConnectionError() {
        throw connectionException;
      }
      
      function throwsQueryError() {
        throw queryException;
      }
      
      // Should catch ConnectionException
      try {
        throwsConnectionError();
        fail('Should have thrown ConnectionException');
      } catch (error) {
        expect(error).toBeInstanceOf(ConnectionException);
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error).not.toBeInstanceOf(QueryException);
      }
      
      // Should catch QueryException
      try {
        throwsQueryError();
        fail('Should have thrown QueryException');
      } catch (error) {
        expect(error).toBeInstanceOf(QueryException);
        expect(error).toBeInstanceOf(DatabaseException);
        expect(error).not.toBeInstanceOf(ConnectionException);
      }
    });

    it('should allow catching all database exceptions with base class', () => {
      const exceptions = [
        new ConnectionException('Connection failed', ErrorCodes.DB_CONN_PG_FAILED),
        new QueryException('Query failed', ErrorCodes.DB_QUERY_PG_SYNTAX),
        new TransactionException('Transaction failed', ErrorCodes.DB_TRANS_PG_COMMIT_FAILED),
        new IntegrityException('Integrity violation', ErrorCodes.DB_INTEG_PG_UNIQUE),
        new ConfigurationException('Invalid config', ErrorCodes.DB_CONFIG_PG_INVALID_URL),
        new JourneyDatabaseException('Journey error', ErrorCodes.DB_HEALTH_METRIC_INVALID, 'health', 'metrics')
      ];
      
      for (const exception of exceptions) {
        function throwsError() {
          throw exception;
        }
        
        try {
          throwsError();
          fail('Should have thrown an exception');
        } catch (error) {
          expect(error).toBeInstanceOf(DatabaseException);
        }
      }
    });
  });
});