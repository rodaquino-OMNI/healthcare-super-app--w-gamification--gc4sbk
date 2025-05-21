/**
 * Barrel file for configuration modules in the Gamification Engine.
 * 
 * This file exports all configuration modules from the common/config directory,
 * providing a unified entry point for importing configurations. It simplifies imports
 * by enabling consumers to import multiple config objects through a single import statement.
 * 
 * Example usage:
 * ```typescript
 * import { appConfig, kafkaConfig, redisConfig } from '@app/common/config';
 * ```
 */

// Export all configuration modules
export * from './app.config';
export * from './database.config';
export * from './events.config';
export * from './gamification.config';
export * from './kafka.config';
export * from './redis.config';

// Export constants and validation schema
export * from './constants';
export * from './validation.schema';