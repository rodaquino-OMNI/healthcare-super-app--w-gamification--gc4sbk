/**
 * Database module for the gamification engine.
 * Provides a unified entry point for database access, ensuring consistent database configuration
 * across the application and proper lifecycle management.
 */

// Export module
export * from './database.module';

// Export services
export * from './prisma.service';
export * from './transaction.service';
export * from './journey-context.service';
export * from './error-handler.service';
export * from './gamification-database.service';

// Export interfaces
export * from './interfaces';

// Export constants
export * from './constants';

// Export exceptions (re-export from common/exceptions)
export { 
  DatabaseException,
  ConnectionException,
  TransactionException,
  QueryException,
  ConstraintViolationException,
  ResourceNotFoundException,
  SchemaException
} from '../exceptions/database.exception';

// Export utility functions
export { RetryUtils } from '../exceptions/retry.utils';