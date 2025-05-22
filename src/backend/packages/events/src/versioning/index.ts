/**
 * @file Versioning Module - Public API
 * 
 * This module provides utilities for handling event versioning, ensuring backward compatibility
 * as event schemas evolve over time. It includes tools for version detection, compatibility checking,
 * schema migration, and event transformation between different versions.
 * 
 * @module @austa/events/versioning
 */

// Re-export types
export * from './types';

// Re-export errors
export * from './errors';

// Re-export constants
export * from './constants';

/**
 * Version Detection
 * 
 * Utilities for detecting the version of an event from different sources using various strategies.
 */
export {
  detectEventVersion,
  createVersionDetector,
  VersionDetectionStrategy,
  createFallbackDetector,
} from './version-detector';

/**
 * Compatibility Checking
 * 
 * Utilities for checking compatibility between different versions of events based on
 * semantic versioning principles.
 */
export {
  isCompatibleVersion,
  compareVersions,
  checkSchemaCompatibility,
  CompatibilityMode,
  createCompatibilityChecker,
} from './compatibility-checker';

/**
 * Schema Migration
 * 
 * Utilities for migrating events between different schema versions, ensuring backward
 * and forward compatibility.
 */
export {
  migrateEvent,
  registerMigrationPath,
  getMigrationPath,
  createSchemaMigrator,
  validateMigrationResult,
} from './schema-migrator';

/**
 * Event Transformation
 * 
 * Functions to transform events between different versions, supporting both upgrading
 * (older to newer) and downgrading (newer to older) scenarios.
 */
export {
  transformEvent,
  upgradeEvent,
  downgradeEvent,
  createTransformer,
  createTransformationPipeline,
} from './transformer';