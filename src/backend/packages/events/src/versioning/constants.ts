/**
 * Constants for the event versioning system.
 * Centralizes version-related constants, default configurations, and error message templates
 * to ensure consistent versioning behavior across the application.
 */

/**
 * Current and supported version identifiers
 */
export const VERSION_CONSTANTS = {
  /** The latest version of the event schema */
  LATEST_VERSION: '1.0.0',
  
  /** The minimum supported version of the event schema */
  MINIMUM_SUPPORTED_VERSION: '1.0.0',
  
  /** The default version to use when no version is specified */
  DEFAULT_VERSION: '1.0.0',
  
  /** The version format pattern (semantic versioning: major.minor.patch) */
  VERSION_FORMAT: /^(\d+)\.(\d+)\.(\d+)$/,
  
  /** The separator used in semantic versioning */
  VERSION_SEPARATOR: '.',
  
  /** The version field name in event payloads */
  VERSION_FIELD: 'version',
  
  /** The version header name for Kafka messages */
  VERSION_HEADER: 'event-version',
};

/**
 * Default configuration options for versioning behaviors
 */
export const DEFAULT_VERSION_CONFIG = {
  /** Whether to automatically upgrade events to the latest version */
  AUTO_UPGRADE_EVENTS: true,
  
  /** Whether to allow processing of events with unsupported versions */
  ALLOW_UNSUPPORTED_VERSIONS: false,
  
  /** Whether to validate events after version transformation */
  VALIDATE_TRANSFORMED_EVENTS: true,
  
  /** Whether to throw an error when version detection fails */
  THROW_ON_VERSION_DETECTION_FAILURE: true,
  
  /** Whether to preserve metadata when transforming events */
  PRESERVE_METADATA_ON_TRANSFORM: true,
  
  /** Default strategies for version detection in order of precedence */
  DEFAULT_DETECTION_STRATEGIES: ['explicit', 'header', 'structure', 'fallback'],
  
  /** Maximum number of transformation steps allowed in a single operation */
  MAX_TRANSFORMATION_STEPS: 5,
  
  /** Whether to use automatic field mapping for compatible fields during migration */
  USE_AUTO_FIELD_MAPPING: true,
};

/**
 * Standardized error message templates for versioning issues
 */
export const VERSION_ERROR_MESSAGES = {
  INVALID_VERSION_FORMAT: 'Invalid version format: {version}. Expected format: major.minor.patch (e.g., 1.0.0)',
  
  VERSION_NOT_DETECTED: 'Could not detect version for event: {eventId}',
  
  UNSUPPORTED_VERSION: 'Event version {version} is not supported. Minimum supported version is {minVersion}',
  
  VERSION_TOO_NEW: 'Event version {version} is newer than the latest supported version {latestVersion}',
  
  NO_MIGRATION_PATH: 'No migration path found from version {sourceVersion} to {targetVersion}',
  
  MIGRATION_FAILED: 'Failed to migrate event from version {sourceVersion} to {targetVersion}: {reason}',
  
  TRANSFORMATION_FAILED: 'Event transformation failed: {reason}',
  
  VALIDATION_FAILED: 'Validation failed for transformed event: {errors}',
  
  MAX_TRANSFORMATION_STEPS_EXCEEDED: 'Maximum transformation steps exceeded ({steps}). Possible circular migration path',
  
  INCOMPATIBLE_VERSIONS: 'Incompatible versions: {sourceVersion} cannot be processed by handler expecting {targetVersion}',
};

/**
 * Constants for version comparison operations
 */
export const VERSION_COMPARISON = {
  /** Result when versions are exactly equal */
  EQUAL: 0,
  
  /** Result when first version is greater than second */
  GREATER: 1,
  
  /** Result when first version is less than second */
  LESS: -1,
  
  /** Compatibility modes for version checking */
  COMPATIBILITY_MODES: {
    /** Strict mode requires exact version match */
    STRICT: 'strict',
    
    /** Standard mode allows minor and patch differences within same major version */
    STANDARD: 'standard',
    
    /** Relaxed mode allows any version with same or lower major version */
    RELAXED: 'relaxed',
  },
};

/**
 * Constants for event schema versioning
 */
export const SCHEMA_VERSION_CONSTANTS = {
  /** Schema registry key format: {eventType}@{version} */
  REGISTRY_KEY_FORMAT: '{eventType}@{version}',
  
  /** Default schema registry namespace */
  DEFAULT_NAMESPACE: 'austa.events',
  
  /** Schema compatibility modes */
  COMPATIBILITY_MODES: {
    /** Backward compatibility ensures new schema can read old data */
    BACKWARD: 'BACKWARD',
    
    /** Forward compatibility ensures old schema can read new data */
    FORWARD: 'FORWARD',
    
    /** Full compatibility ensures both backward and forward compatibility */
    FULL: 'FULL',
    
    /** None disables compatibility checking */
    NONE: 'NONE',
  },
};

/**
 * Constants for journey-specific event versions
 * These can be updated as journey-specific event schemas evolve
 */
export const JOURNEY_EVENT_VERSIONS = {
  HEALTH: {
    LATEST: '1.0.0',
    MINIMUM_SUPPORTED: '1.0.0',
  },
  CARE: {
    LATEST: '1.0.0',
    MINIMUM_SUPPORTED: '1.0.0',
  },
  PLAN: {
    LATEST: '1.0.0',
    MINIMUM_SUPPORTED: '1.0.0',
  },
  GAMIFICATION: {
    LATEST: '1.0.0',
    MINIMUM_SUPPORTED: '1.0.0',
  },
};