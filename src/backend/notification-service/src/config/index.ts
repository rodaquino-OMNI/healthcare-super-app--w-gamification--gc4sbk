/**
 * Configuration barrel file that exports all configuration modules
 * for the notification service.
 * 
 * This file provides a single entry point for importing all configuration
 * objects, making it easier to manage dependencies and maintain consistent
 * configuration usage throughout the application.
 */

export * from './validation.schema';
export * from './kafka.config';