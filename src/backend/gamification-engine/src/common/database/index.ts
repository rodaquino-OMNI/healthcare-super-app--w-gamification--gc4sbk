/**
 * Database module for the gamification engine.
 * Provides centralized database access, transaction management, error handling,
 * and journey-specific database contexts.
 */

// Export all database-related services and interfaces
export * from './interfaces';
export * from './constants';
export * from './prisma.service';
export * from './transaction.service';
export * from './journey-context.service';
export * from './error-handler.service';
export * from './database.module';