/**
 * @file Common Interfaces Barrel File
 * @description Re-exports all common TypeScript interfaces from the AUSTA SuperApp's common module.
 * This file provides a single entry point for importing common utility types, model interfaces,
 * error types, response structures, validation schemas, and status types.
 */

// Re-export all types from the status module
export * from './status';

// Re-export all types from other common modules
// These will be uncommented as the respective files are implemented
// export * from './error';
// export * from './model';
// export * from './response';
// export * from './types';
// export * from './validation';