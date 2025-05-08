/**
 * Configuration barrel file that exports all configuration modules
 * from the gamification engine's common/config directory.
 * 
 * This provides a unified entry point for importing configurations,
 * simplifying imports by enabling consumers to import multiple config
 * objects through a single import statement.
 */

// Export configuration types first to avoid circular dependencies
export * from './types';
export * from './constants';

// Export all configuration modules
export * from './app.config';
export * from './database.config';
export * from './events.config';
export * from './gamification.config';
export * from './kafka.config';
export * from './redis.config';
export * from './validation.schema';