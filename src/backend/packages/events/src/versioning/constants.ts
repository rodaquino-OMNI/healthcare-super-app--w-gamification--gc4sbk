/**
 * @file constants.ts
 * @description Centralizes version-related constants, default configurations, and error message templates
 * for the versioning module. Contains current and supported version identifiers, configuration defaults,
 * and standardized error messages.
 */

import { CompatibilityCheckerConfig, MigrationRegistryConfig, SchemaValidationConfig, TransformOptions, VersionDetectorConfig } from './types';

/**
 * Current latest version of the event schema
 * This should be updated whenever a new version is released
 */
export const LATEST_VERSION = '1.0.0';

/**
 * Minimum supported version of the event schema
 * Events with versions older than this will be rejected
 */
export const MINIMUM_SUPPORTED_VERSION = '0.5.0';

/**
 * List of all supported versions in order from oldest to newest
 * This is used for validation and migration path discovery
 */
export const SUPPORTED_VERSIONS = [
  '0.5.0',
  '0.6.0',
  '0.7.0',
  '0.8.0',
  '0.9.0',
  '1.0.0',
];

/**
 * Regular expression for validating semantic version format
 * Follows the major.minor.patch format
 */
export const VERSION_FORMAT_REGEX = /^(\d+)\.(\d+)\.(\d+)$/;

/**
 * Error message templates for version-related errors
 */
export const ERROR_TEMPLATES = {
  INVALID_VERSION_FORMAT: 'Invalid version format: {version}. Expected format: {expectedFormat}',
  VERSION_NOT_SUPPORTED: 'Version {version} is not supported. Supported versions: {supportedVersions}',
  VERSION_TOO_OLD: 'Version {version} is too old. Minimum supported version is {minVersion}',
  VERSION_DETECTION_FAILED: 'Failed to detect version for event: {eventId}',
  NO_MIGRATION_PATH: 'No migration path found from version {sourceVersion} to {targetVersion} for event type {eventType}',
  INCOMPATIBLE_VERSIONS: 'Incompatible versions: {sourceVersion} and {targetVersion}',
  DOWNGRADE_NOT_ALLOWED: 'Version downgrade from {sourceVersion} to {targetVersion} is not allowed',
  TRANSFORMATION_FAILED: 'Failed to transform event from version {sourceVersion} to {targetVersion}',
  VALIDATION_FAILED: 'Validation failed for event after transformation to version {targetVersion}',
};

/**
 * Default configuration for version detection
 */
export const DEFAULT_VERSION_DETECTOR_CONFIG: VersionDetectorConfig = {
  strategies: [
    {
      type: 'explicit',
      field: 'version',
    },
    {
      type: 'header',
      headerField: 'x-event-version',
    },
  ],
  defaultVersion: LATEST_VERSION,
  throwOnUndetected: true,
};

/**
 * Default configuration for compatibility checking
 */
export const DEFAULT_COMPATIBILITY_CHECKER_CONFIG: CompatibilityCheckerConfig = {
  strict: false,
  allowMajorUpgrade: false,
  allowDowngrade: false,
};

/**
 * Default configuration for schema validation
 */
export const DEFAULT_SCHEMA_VALIDATION_CONFIG: SchemaValidationConfig = {
  strict: true,
  throwOnInvalid: true,
};

/**
 * Default configuration for migration registry
 */
export const DEFAULT_MIGRATION_REGISTRY_CONFIG: MigrationRegistryConfig = {
  strict: true,
  validateResults: true,
  allowDowngrade: false,
};

/**
 * Default options for event transformation
 */
export const DEFAULT_TRANSFORM_OPTIONS: TransformOptions = {
  direction: 'upgrade',
  validateResult: true,
  strict: true,
};

/**
 * Field names that should be preserved during transformation
 * These fields are part of the base event structure and should not be modified
 */
export const PRESERVED_FIELDS = [
  'eventId',
  'timestamp',
  'source',
  'type',
  'metadata',
];

/**
 * Maximum number of transformation steps allowed in a single migration
 * This prevents infinite loops in case of circular migration paths
 */
export const MAX_TRANSFORMATION_STEPS = 10;

/**
 * Default confidence threshold for version detection
 * Detections with confidence below this threshold will be ignored
 */
export const DEFAULT_DETECTION_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Version field names to check when using explicit version detection
 * The detector will check these fields in order until a version is found
 */
export const VERSION_FIELD_NAMES = [
  'version',
  'schemaVersion',
  'eventVersion',
  'apiVersion',
  'v',
];

/**
 * Header field names to check when using header-based version detection
 * The detector will check these headers in order until a version is found
 */
export const VERSION_HEADER_NAMES = [
  'x-event-version',
  'x-schema-version',
  'x-api-version',
  'event-version',
  'schema-version',
  'api-version',
];

/**
 * Journey-specific version prefixes
 * These prefixes can be used to identify journey-specific versions
 */
export const JOURNEY_VERSION_PREFIXES = {
  HEALTH: 'health-',
  CARE: 'care-',
  PLAN: 'plan-',
};

/**
 * Default timeout for version-related operations in milliseconds
 * Operations that exceed this timeout will be aborted
 */
export const DEFAULT_OPERATION_TIMEOUT = 5000; // 5 seconds