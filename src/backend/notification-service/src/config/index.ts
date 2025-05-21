/**
 * Configuration Barrel File
 * 
 * This barrel file exports all configuration components from the notification service's
 * config directory, providing a unified entry point for importing configurations.
 * 
 * By using this barrel file, consumers can import multiple config objects through a
 * single import statement, promoting clean code organization and module encapsulation.
 * 
 * Example usage:
 * ```typescript
 * import { NotificationConfig, KafkaConfig, RetryConfig } from '@app/notification/config';
 * ```
 */

// Export constants first to avoid circular dependencies
export * from './constants';

// Export configuration schemas and validators
export * from './validation.schema';

// Export specific configuration modules
export * from './channels.config';
export * from './retry.config';
export * from './kafka.config';

// Export main configuration last to avoid circular dependencies
export * from './configuration';