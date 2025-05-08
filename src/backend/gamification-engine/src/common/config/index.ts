/**
 * @file Configuration Barrel File
 * @description Exports all configuration modules from the gamification engine's common/config directory,
 * providing a unified entry point for importing configurations. This barrel file simplifies imports
 * by enabling consumers to import multiple config objects through a single import statement.
 * 
 * @example
 * // Import specific configurations
 * import { appConfig, kafkaConfig } from '@app/gamification-engine/common/config';
 * 
 * // Or import everything
 * import * as config from '@app/gamification-engine/common/config';
 */

// Application configuration
export * from './app.config';

// Database configuration
export * from './database.config';

// Event processing configuration
export * from './events.config';

// Gamification-specific configuration
export * from './gamification.config';

// Kafka messaging configuration
export * from './kafka.config';

// Redis configuration
export * from './redis.config';

// Constants used across configuration modules
export * from './constants';

// Validation schema for environment variables
export * from './validation.schema';