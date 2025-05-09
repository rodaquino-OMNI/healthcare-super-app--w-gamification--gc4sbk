/**
 * @file constants.ts
 * @description Centralizes version-related constants, default configurations, and error message templates
 * for the versioning module. This file ensures consistent versioning behavior across the application
 * and simplifies maintenance by keeping version-related constants in a single location.
 */

import { VersionDetectionStrategy, CompatibilityCheckOptions, MigrationOptions, TransformationOptions } from './types';

/**
 * Current and supported version identifiers
 */
export const VERSION_CONSTANTS = {
  /** Current latest version of the event schema */
  LATEST_VERSION: '1.0.0',
  
  /** Minimum supported version of the event schema */
  MINIMUM_SUPPORTED_VERSION: '1.0.0',
  
  /** Default version to use when no version is specified */
  DEFAULT_VERSION: '1.0.0',
  
  /** Initial version for new event types */
  INITIAL_VERSION: '1.0.0',
  
  /** Version used for unversioned legacy events */
  LEGACY_VERSION: '0.1.0',
};

/**
 * Version format constants
 */
export const VERSION_FORMAT = {
  /** Regular expression for validating semantic version format */
  SEMVER_REGEX: /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/,
  
  /** Standard version format string for display */
  FORMAT_STRING: 'major.minor.patch',
  
  /** Separator used in version strings */
  SEPARATOR: '.',
  
  /** Maximum allowed value for each version component */
  MAX_COMPONENT_VALUE: 999,
  
  /** Field name used to store version in events */
  DEFAULT_VERSION_FIELD: 'version',
  
  /** Header name used to store version in Kafka messages */
  DEFAULT_VERSION_HEADER: 'event-version',
};

/**
 * Default configuration options for version detection
 */
export const DEFAULT_VERSION_DETECTION_OPTIONS = {
  /** Whether to throw an error if version detection fails */
  throwOnFailure: true,
  
  /** Default version detection strategies in priority order */
  strategies: [
    {
      type: 'field',
      field: 'version',
      priority: 100
    },
    {
      type: 'header',
      headerName: 'event-version',
      priority: 50
    },
    {
      type: 'schema',
      schemaFingerprints: {},
      priority: 10
    }
  ] as VersionDetectionStrategy[],
  
  /** Default version to use if detection fails */
  defaultVersion: VERSION_CONSTANTS.DEFAULT_VERSION
};

/**
 * Default configuration options for compatibility checking
 */
export const DEFAULT_COMPATIBILITY_CHECK_OPTIONS: CompatibilityCheckOptions = {
  /** Whether to use strict semantic versioning rules */
  strictSemver: true,
  
  /** Whether to allow newer patch versions */
  allowNewerPatch: true,
  
  /** Whether to allow newer minor versions */
  allowNewerMinor: false,
  
  /** Custom compatibility rules */
  customRules: []
};

/**
 * Default configuration options for schema migration
 */
export const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  /** Whether to validate the migrated event */
  validateResult: true,
  
  /** Whether to throw an error if validation fails */
  throwOnValidationError: true,
  
  /** Whether to automatically find migration path */
  autoFindPath: true,
  
  /** Maximum number of migration steps allowed */
  maxSteps: 5
};

/**
 * Default configuration options for event transformation
 */
export const DEFAULT_TRANSFORMATION_OPTIONS: TransformationOptions = {
  /** Whether to validate the transformed event against the target schema */
  validateResult: true,
  
  /** Whether to throw an error if validation fails */
  throwOnValidationError: true,
  
  /** Whether to preserve original fields not defined in the target schema */
  preserveExtraFields: false,
  
  /** Custom field mappings for the transformation */
  fieldMappings: {},
  
  /** Custom field transformers */
  fieldTransformers: {}
};

/**
 * Error message templates for versioning issues
 */
export const ERROR_MESSAGES = {
  /** Version detection error messages */
  VERSION_DETECTION: {
    FAILED: 'Failed to detect event version',
    MISSING_FIELD: 'Missing required version field "{field}"',
    INVALID_FORMAT: 'Invalid version format "{version}", expected format: {format}',
    UNSUPPORTED: 'Unsupported version {version}. Supported versions: {supportedVersions}'
  },
  
  /** Version compatibility error messages */
  COMPATIBILITY: {
    INCOMPATIBLE: 'Incompatible event versions',
    MISMATCH: 'Version mismatch: source version {sourceVersion} is {compatibilityLevel} with target version {targetVersion}',
    TOO_OLD: 'Version {version} is too old. Minimum supported version is {minimumVersion}',
    TOO_NEW: 'Version {version} is too new. Maximum supported version is {maximumVersion}'
  },
  
  /** Migration error messages */
  MIGRATION: {
    FAILED: 'Event migration failed',
    PATH_NOT_FOUND: 'No migration path found from version {sourceVersion} to {targetVersion}',
    VALIDATION_FAILED: 'Migration validation failed from version {sourceVersion} to {targetVersion}',
    ROLLBACK_FAILED: 'Migration rollback failed from version {sourceVersion} to {targetVersion}. Original error: {originalError}. Rollback error: {rollbackError}'
  },
  
  /** Transformation error messages */
  TRANSFORMATION: {
    FAILED: 'Event transformation failed',
    FIELD_FAILED: 'Failed to transform field "{field}" from {sourceType} to {targetType}: {error}',
    VALIDATION_FAILED: 'Schema validation failed for event type "{eventType}" (version {version})',
    NOT_IMPLEMENTED: 'Transformation not implemented from version {sourceVersion} to {targetVersion} for event type "{eventType}"'
  }
};

/**
 * Constants for version compatibility levels
 */
export enum VERSION_COMPATIBILITY_LEVEL {
  /** Versions are fully compatible */
  COMPATIBLE = 'COMPATIBLE',
  
  /** Versions have breaking changes */
  INCOMPATIBLE = 'INCOMPATIBLE',
  
  /** Source version is older than target version */
  OLDER = 'OLDER',
  
  /** Source version is newer than target version */
  NEWER = 'NEWER',
  
  /** Versions are identical */
  IDENTICAL = 'IDENTICAL'
}

/**
 * Constants for version migration directions
 */
export enum MIGRATION_DIRECTION {
  /** Migrate from older to newer version */
  UPGRADE = 'UPGRADE',
  
  /** Migrate from newer to older version */
  DOWNGRADE = 'DOWNGRADE',
  
  /** No migration needed (versions are identical) */
  NONE = 'NONE'
}

/**
 * Constants for version detection strategies
 */
export enum VERSION_DETECTION_STRATEGY {
  /** Detect version from a field in the event */
  FIELD = 'field',
  
  /** Detect version from event headers */
  HEADER = 'header',
  
  /** Detect version based on event schema structure */
  SCHEMA = 'schema'
}

/**
 * Journey-specific version constants
 * These constants define the current and minimum supported versions for each journey
 */
export const JOURNEY_VERSIONS = {
  /** Health journey event versions */
  HEALTH: {
    LATEST: '1.0.0',
    MINIMUM: '1.0.0',
    EVENTS: {
      HEALTH_METRIC_RECORDED: '1.0.0',
      HEALTH_GOAL_ACHIEVED: '1.0.0',
      HEALTH_INSIGHT_GENERATED: '1.0.0',
      DEVICE_SYNCHRONIZED: '1.0.0'
    }
  },
  
  /** Care journey event versions */
  CARE: {
    LATEST: '1.0.0',
    MINIMUM: '1.0.0',
    EVENTS: {
      APPOINTMENT_BOOKED: '1.0.0',
      MEDICATION_ADHERENCE_RECORDED: '1.0.0',
      TELEMEDICINE_SESSION_COMPLETED: '1.0.0',
      CARE_PLAN_PROGRESS_UPDATED: '1.0.0'
    }
  },
  
  /** Plan journey event versions */
  PLAN: {
    LATEST: '1.0.0',
    MINIMUM: '1.0.0',
    EVENTS: {
      CLAIM_SUBMITTED: '1.0.0',
      BENEFIT_UTILIZED: '1.0.0',
      PLAN_SELECTED: '1.0.0',
      REWARD_REDEEMED: '1.0.0'
    }
  },
  
  /** Gamification event versions */
  GAMIFICATION: {
    LATEST: '1.0.0',
    MINIMUM: '1.0.0',
    EVENTS: {
      ACHIEVEMENT_UNLOCKED: '1.0.0',
      POINTS_AWARDED: '1.0.0',
      LEVEL_ADVANCED: '1.0.0',
      QUEST_COMPLETED: '1.0.0'
    }
  }
};