/**
 * Configuration Barrel File
 * 
 * This file exports all configuration components from the notification service's config directory,
 * providing a unified entry point for importing configurations. This barrel file simplifies imports
 * by enabling consumers to import multiple config objects through a single import statement,
 * promoting clean code organization and module encapsulation.
 * 
 * @module config
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
// since it might depend on other configuration components
export * from './configuration';