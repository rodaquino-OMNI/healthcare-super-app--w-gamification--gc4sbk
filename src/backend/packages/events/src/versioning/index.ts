/**
 * @file index.ts
 * @description Central export point (barrel file) for the versioning module that provides a clean
 * and organized public API for all versioning utilities. This file ensures that consumers can
 * easily import versioning functionality without needing to know the internal file structure,
 * promoting better encapsulation and modular design.
 */

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export errors
export * from './errors';

// Export compatibility checker
export * from './compatibility-checker';

// Export transformer
export * from './transformer';

// Export schema migrator
export * from './schema-migrator';

// Export version detector
export * from './version-detector';