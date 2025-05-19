/**
 * Common interfaces and types for the AUSTA SuperApp
 * 
 * This barrel file exports all common interfaces and types used across the application.
 * It provides a single entry point for importing common types, ensuring consistency
 * and maintainability across the codebase.
 * 
 * @package @austa/interfaces
 */

// Re-export all types from the common module
export * from './error';
export * from './model';
export * from './response';
export * from './status';
export * from './types';
export * from './validation';
export * from './locale';