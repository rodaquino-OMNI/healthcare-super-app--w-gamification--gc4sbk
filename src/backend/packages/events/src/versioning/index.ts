/**
 * @file index.ts
 * @description Central export point (barrel file) for the versioning module that provides a clean
 * and organized public API for all versioning utilities. This file ensures that consumers can
 * easily import versioning functionality without needing to know the internal file structure,
 * promoting better encapsulation and modular design.
 */

//-----------------------------------------------------------------------------
// Core Types and Interfaces
//-----------------------------------------------------------------------------

/**
 * Re-export all types from the types module
 * These types provide strong typing for versioning operations
 */
export {
  // Core version types
  ParsedVersion,
  VersionRange,
  VersionComparisonResult,
  
  // Migration and transformation types
  MigrationPath,
  MigrationFunction,
  TransformationOptions,
  FieldTransformer,
  
  // Version detection types
  VersionDetectionStrategy,
  BaseVersionDetection,
  FieldBasedVersionDetection,
  HeaderBasedVersionDetection,
  SchemaBasedVersionDetection,
  VersionDetectionOptions,
  VersionDetectionResult,
  
  // Compatibility types
  CompatibilityCheckOptions,
  CompatibilityRule,
  
  // Migration types
  MigrationOptions,
  MigrationResult,
  MigrationRegistry,
  
  // Type guards
  isVersionedEvent,
  isFieldBasedStrategy,
  isHeaderBasedStrategy,
  isSchemaBasedStrategy
} from './types';

/**
 * Re-export interfaces from event-versioning.interface
 * These interfaces define the core contracts for versioned events
 */
export {
  IVersionedEvent,
  EventVersion,
  EventVersioningStrategy,
  IEventSchemaRegistry,
  IEventMigrationRegistry,
  IVersionedEventFactory
} from '../interfaces/event-versioning.interface';

//-----------------------------------------------------------------------------
// Error Classes and Utilities
//-----------------------------------------------------------------------------

/**
 * Re-export error classes and utilities from the errors module
 * These provide structured error handling for versioning operations
 */
export {
  // Base error class
  VersioningError,
  
  // Specific error classes
  VersionDetectionError,
  VersionCompatibilityError,
  MigrationError,
  TransformationError,
  SchemaValidationError,
  
  // Error factory functions
  createVersionDetectionError,
  createVersionCompatibilityError,
  createMigrationError,
  createTransformationError,
  createSchemaValidationError
} from './errors';

//-----------------------------------------------------------------------------
// Constants and Configuration
//-----------------------------------------------------------------------------

/**
 * Re-export constants from the constants module
 * These provide standardized configuration and error messages
 */
export {
  // Version constants
  VERSION_CONSTANTS,
  VERSION_FORMAT,
  
  // Default configuration options
  DEFAULT_VERSION_DETECTION_OPTIONS,
  DEFAULT_COMPATIBILITY_CHECK_OPTIONS,
  DEFAULT_MIGRATION_OPTIONS,
  DEFAULT_TRANSFORMATION_OPTIONS,
  
  // Error message templates
  ERROR_MESSAGES,
  
  // Enums
  VERSION_COMPATIBILITY_LEVEL,
  MIGRATION_DIRECTION,
  VERSION_DETECTION_STRATEGY,
  
  // Journey-specific version constants
  JOURNEY_VERSIONS
} from './constants';

//-----------------------------------------------------------------------------
// Version Detection and Compatibility
//-----------------------------------------------------------------------------

/**
 * Re-export from version-detector module
 * Provides utilities to detect the version of an event payload
 */
export {
  /**
   * Detects the version of an event using configured strategies
   * @param event The event to detect the version for
   * @param options Detection options
   * @returns The detected version information
   */
  detectVersion,
  
  /**
   * Creates a version detector with the specified options
   * @param options Detection options
   * @returns A configured version detector function
   */
  createVersionDetector,
  
  /**
   * Extracts version information from a version string
   * @param version The version string to parse
   * @returns The parsed version components
   */
  parseVersion,
  
  /**
   * Validates that a string is a valid semantic version
   * @param version The version string to validate
   * @returns Whether the version is valid
   */
  isValidVersion
} from './version-detector';

/**
 * Re-export from compatibility-checker module
 * Provides utilities to check compatibility between different versions
 */
export {
  /**
   * Checks if a source version is compatible with a target version
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param options Compatibility check options
   * @returns Compatibility check result
   */
  checkCompatibility,
  
  /**
   * Creates a compatibility checker with the specified options
   * @param options Compatibility check options
   * @returns A configured compatibility checker function
   */
  createCompatibilityChecker,
  
  /**
   * Compares two versions and returns their relationship
   * @param versionA First version
   * @param versionB Second version
   * @returns Comparison result (-1: A < B, 0: A = B, 1: A > B)
   */
  compareVersions,
  
  /**
   * Gets the compatibility level between two versions
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The compatibility level
   */
  getCompatibilityLevel
} from './compatibility-checker';

//-----------------------------------------------------------------------------
// Transformation and Migration
//-----------------------------------------------------------------------------

/**
 * Re-export from transformer module
 * Provides functions to convert events between different versions
 */
export {
  /**
   * Transforms an event from its current version to a target version
   * @param event The event to transform
   * @param targetVersion The target version
   * @param options Transformation options
   * @returns The transformed event
   */
  transformEvent,
  
  /**
   * Creates a transformer function with the specified options
   * @param options Transformation options
   * @returns A configured transformer function
   */
  createTransformer,
  
  /**
   * Upgrades an event to a newer version
   * @param event The event to upgrade
   * @param targetVersion The target version
   * @param options Transformation options
   * @returns The upgraded event
   */
  upgradeEvent,
  
  /**
   * Downgrades an event to an older version
   * @param event The event to downgrade
   * @param targetVersion The target version
   * @param options Transformation options
   * @returns The downgraded event
   */
  downgradeEvent
} from './transformer';

/**
 * Re-export from schema-migrator module
 * Provides migration utilities to transform events between schema versions
 */
export {
  /**
   * Migrates an event from its current version to a target version
   * @param event The event to migrate
   * @param targetVersion The target version
   * @param options Migration options
   * @returns The migration result
   */
  migrateEvent,
  
  /**
   * Creates a migration registry for managing version migrations
   * @returns A new migration registry
   */
  createMigrationRegistry,
  
  /**
   * Registers a migration path between two versions
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param migrationFn The migration function
   * @param registry The migration registry to use
   */
  registerMigration,
  
  /**
   * Finds a migration path between two versions
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param registry The migration registry to use
   * @param maxSteps Maximum number of migration steps
   * @returns The migration path if found
   */
  findMigrationPath
} from './schema-migrator';

//-----------------------------------------------------------------------------
// Utility Functions
//-----------------------------------------------------------------------------

/**
 * Creates a versioned event with the specified type, payload, and options
 * @param eventType The event type
 * @param payload The event payload
 * @param options Additional options
 * @returns A versioned event
 */
export function createVersionedEvent<T extends Record<string, any>>(
  eventType: string,
  payload: T,
  options?: {
    version?: string;
    source?: string;
    correlationId?: string;
  }
): IVersionedEvent & { payload: T } {
  const version = options?.version || VERSION_CONSTANTS.LATEST_VERSION;
  const timestamp = new Date().toISOString();
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    id,
    type: eventType,
    version,
    timestamp,
    source: options?.source || 'system',
    correlationId: options?.correlationId || id,
    payload
  };
}

/**
 * Gets the current version for a specific event type and journey
 * @param eventType The event type
 * @param journey The journey (health, care, plan, gamification)
 * @returns The current version for the event type
 */
export function getCurrentEventVersion(
  eventType: string,
  journey: 'health' | 'care' | 'plan' | 'gamification'
): string {
  const journeyKey = journey.toUpperCase() as keyof typeof JOURNEY_VERSIONS;
  const journeyVersions = JOURNEY_VERSIONS[journeyKey];
  
  if (!journeyVersions) {
    return VERSION_CONSTANTS.LATEST_VERSION;
  }
  
  const eventVersions = journeyVersions.EVENTS as Record<string, string>;
  const normalizedEventType = eventType.toUpperCase().replace(/[\s-]/g, '_');
  
  return eventVersions[normalizedEventType] || journeyVersions.LATEST;
}

/**
 * Ensures an event has a valid version
 * If the event doesn't have a version, adds the latest version
 * @param event The event to ensure version for
 * @returns The event with a valid version
 */
export function ensureEventVersion<T extends Record<string, any>>(
  event: T
): T & { version: string } {
  if ('version' in event && typeof event.version === 'string') {
    return event as T & { version: string };
  }
  
  return {
    ...event,
    version: VERSION_CONSTANTS.LATEST_VERSION
  };
}