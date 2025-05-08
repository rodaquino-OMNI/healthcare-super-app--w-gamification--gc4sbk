/**
 * Interfaces for notification event schema versioning and evolution.
 * 
 * This file defines interfaces for notification event schema versioning, enabling backward
 * compatibility and graceful evolution of event structures. It provides utilities for
 * version detection, schema migration, and compatibility checking, which are essential
 * for maintaining system stability during deployments with changed event schemas.
 * 
 * Key features:
 * - Semantic versioning for notification events (major.minor.patch)
 * - Transformation utilities for migrating between versions
 * - Schema registry for validation and version tracking
 * - Backward compatibility patterns for event processors
 * - Deprecation flagging system for evolving event schemas
 * 
 * Usage examples:
 * - Event producers should include version information in all events
 * - Event consumers should check version compatibility before processing
 * - Migration paths should be defined for breaking changes
 * - Deprecated fields should be marked with removal timelines
 * 
 * @module notification-service/events/interfaces
 */

import { INotificationEvent } from './notification-event.interface';
import { IEventType } from '@austa/interfaces/common';

/**
 * Interface for validation errors
 */
export interface ValidationError {
  /**
   * The path to the field with the error
   */
  path: string;
  
  /**
   * The error message
   */
  message: string;
  
  /**
   * The expected type or value
   */
  expected?: string;
  
  /**
   * The actual type or value
   */
  actual?: string;
}

/**
 * Enum defining the compatibility level between event versions
 */
export enum CompatibilityLevel {
  /**
   * Full compatibility - No changes needed to process the event
   */
  FULL = 'FULL',
  
  /**
   * Backward compatible - Newer versions can process older events
   */
  BACKWARD = 'BACKWARD',
  
  /**
   * Forward compatible - Older versions can process newer events
   */
  FORWARD = 'FORWARD',
  
  /**
   * Incompatible - Migration required to process the event
   */
  INCOMPATIBLE = 'INCOMPATIBLE'
}

/**
 * Interface for notification event version metadata
 * 
 * This interface defines the structure of semantic version information for notification events.
 * It follows the standard major.minor.patch versioning scheme, where:
 * - Major: Incremented for breaking changes that require migration
 * - Minor: Incremented for backward-compatible feature additions
 * - Patch: Incremented for backward-compatible bug fixes
 * 
 * Version information is crucial for implementing the event versioning strategy and
 * ensuring backward compatibility during transitions between versions.
 */
export interface INotificationEventVersion {
  /**
   * The major version number
   * Incremented for breaking changes that require migration
   */
  major: number;

  /**
   * The minor version number
   * Incremented for backward-compatible feature additions
   */
  minor: number;

  /**
   * The patch version number
   * Incremented for backward-compatible bug fixes
   */
  patch: number;

  /**
   * The full version string (e.g., "1.2.3")
   */
  toString(): string;
}

/**
 * Interface for notification events with version support
 * 
 * This interface extends the base notification event interface to include version information
 * and deprecation metadata. All notification events in the system should implement this interface
 * to ensure proper versioning and backward compatibility.
 * 
 * Versioned events enable the system to handle schema evolution gracefully, supporting
 * gradual migration of dependent systems and ensuring backward compatibility during transitions.
 */
export interface IVersionedNotificationEvent<T extends IEventType = IEventType> extends INotificationEvent<T> {
  /**
   * The version of the event schema
   * Format: "major.minor.patch" (e.g., "1.2.3")
   */
  version: string;

  /**
   * Optional metadata about deprecated fields
   * Used to track fields that will be removed in future versions
   */
  deprecatedFields?: DeprecatedField[];
}

/**
 * Interface for tracking deprecated fields in notification events
 * 
 * This interface provides metadata about fields that are deprecated and scheduled
 * for removal in future versions. It helps maintain backward compatibility by
 * providing information about when fields were deprecated, when they will be removed,
 * and what fields should be used instead.
 * 
 * The deprecation flagging system is a key component of the event versioning strategy,
 * allowing for graceful evolution of event schemas over time.
 */
export interface DeprecatedField {
  /**
   * The name of the deprecated field
   * Can use dot notation for nested fields (e.g., "payload.oldField")
   */
  fieldName: string;

  /**
   * The version when this field was deprecated
   */
  deprecatedInVersion: string;

  /**
   * The version when this field will be removed
   */
  removeInVersion: string;

  /**
   * The replacement field name, if any
   */
  replacedBy?: string;

  /**
   * Optional message with migration instructions
   */
  message?: string;
}

/**
 * Interface for notification event schema transformation
 * 
 * The transformer is responsible for converting events between different versions.
 * It provides methods for detecting the version of an event, checking if it can
 * handle a specific event type, and transforming events to different versions.
 * 
 * This interface is essential for implementing the event versioning strategy and
 * ensuring backward compatibility during transitions between versions.
 */
export interface INotificationEventTransformer<T extends IVersionedNotificationEvent = IVersionedNotificationEvent> {
  /**
   * Transforms a notification event from one version to another
   * @param event The event to transform
   * @param targetVersion The target version to transform to
   * @returns The transformed event
   */
  transform(event: T, targetVersion: INotificationEventVersion): T;

  /**
   * Gets the source version of a notification event
   * @param event The event to get the version from
   * @returns The event version
   */
  getVersion(event: T): INotificationEventVersion;

  /**
   * Checks if the transformer can handle the given notification event
   * @param event The event to check
   * @returns True if the transformer can handle the event
   */
  canHandle(event: T): boolean;

  /**
   * Gets a list of deprecated fields in the event
   * @param event The event to check
   * @returns Array of deprecated fields with metadata
   */
  getDeprecatedFields(event: T): DeprecatedField[];
}

/**
 * Interface for notification event schema migration
 * 
 * Migrations define the transformation logic between specific versions of an event schema.
 * Each migration handles the conversion from a source version to a target version,
 * implementing the specific changes required for that version transition.
 * 
 * Migrations are registered with the schema registry and applied automatically when
 * events need to be converted between versions, supporting the gradual migration of
 * dependent systems.
 */
export interface INotificationEventMigration<T extends IVersionedNotificationEvent = IVersionedNotificationEvent> {
  /**
   * The source version of the migration
   */
  sourceVersion: INotificationEventVersion;

  /**
   * The target version of the migration
   */
  targetVersion: INotificationEventVersion;

  /**
   * Migrates a notification event from the source version to the target version
   * @param event The event to migrate
   * @returns The migrated event
   */
  migrate(event: T): T;

  /**
   * Checks if this migration can be applied to the given event
   * @param event The event to check
   * @returns True if the migration can be applied
   */
  canApply(event: T): boolean;
}

/**
 * Interface for notification event schema registry
 * 
 * The schema registry is responsible for managing event schemas across different versions,
 * providing validation capabilities, and facilitating migrations between versions.
 * It serves as the central repository for all notification event schemas in the system.
 */
export interface INotificationEventSchemaRegistry<T extends IVersionedNotificationEvent = IVersionedNotificationEvent> {
  /**
   * Registers a schema for a notification event type
   * @param eventType The event type
   * @param version The schema version
   * @param schema The schema definition
   */
  registerSchema(eventType: string, version: string, schema: any): void;

  /**
   * Gets a schema for a notification event type and version
   * @param eventType The event type
   * @param version The schema version
   * @returns The schema definition or undefined if not found
   */
  getSchema(eventType: string, version: string): any;

  /**
   * Gets all versions of a schema for a notification event type
   * @param eventType The event type
   * @returns An array of schema versions
   */
  getSchemaVersions(eventType: string): string[];

  /**
   * Validates a notification event against its schema
   * @param event The event to validate
   * @returns True if the event is valid
   * @throws ValidationError with details if validation fails
   */
  validateEvent(event: T): boolean;
  
  /**
   * Gets detailed validation errors for an event
   * @param event The event to validate
   * @returns Array of validation errors or empty array if valid
   */
  getValidationErrors(event: T): ValidationError[];

  /**
   * Registers a migration between two schema versions
   * @param eventType The event type
   * @param migration The migration implementation
   */
  registerMigration(eventType: string, migration: INotificationEventMigration<T>): void;

  /**
   * Gets all migrations for a notification event type
   * @param eventType The event type
   * @returns An array of migrations
   */
  getMigrations(eventType: string): INotificationEventMigration<T>[];
  
  /**
   * Determines the compatibility level between two versions of an event schema
   * @param eventType The event type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The compatibility level between the versions
   */
  getCompatibilityLevel(eventType: string, sourceVersion: string, targetVersion: string): CompatibilityLevel;
  
  /**
   * Migrates an event from its current version to the target version
   * @param event The event to migrate
   * @param targetVersion The target version to migrate to
   * @returns The migrated event
   * @throws Error if migration path is not available
   */
  migrateEvent(event: T, targetVersion: string): T;
}

/**
 * Interface for backward compatibility handler
 * 
 * This handler is responsible for ensuring that events from older versions can be
 * processed by newer versions of the system. It provides mechanisms for adapting
 * older events to the current version and checking version compatibility.
 * 
 * Implementing this interface is crucial for maintaining system stability during
 * deployments with changed event schemas and supporting gradual migration of
 * dependent systems.
 */
export interface IBackwardCompatibilityHandler<T extends IVersionedNotificationEvent = IVersionedNotificationEvent> {
  /**
   * The minimum supported version
   */
  minimumSupportedVersion: INotificationEventVersion;

  /**
   * The current version
   */
  currentVersion: INotificationEventVersion;

  /**
   * Adapts an event to the current version if needed
   * @param event The event to adapt
   * @returns The adapted event
   * @throws Error if the event version is below minimum supported version
   */
  adaptToCurrentVersion(event: T): T;

  /**
   * Checks if an event version is supported
   * @param version The version to check
   * @returns True if the version is supported
   */
  isVersionSupported(version: INotificationEventVersion): boolean;

  /**
   * Gets a list of deprecated fields that will be removed in the next major version
   * @returns Array of deprecated fields with metadata
   */
  getUpcomingBreakingChanges(): DeprecatedField[];
}

/**
 * Parses a version string into an INotificationEventVersion object
 * 
 * This utility function converts a semantic version string (e.g., "1.2.3") into an
 * INotificationEventVersion object with separate major, minor, and patch components.
 * It handles invalid or incomplete version strings gracefully by defaulting missing
 * components to 0.
 * 
 * @param versionStr The version string to parse (format: "major.minor.patch")
 * @returns The parsed version object with major, minor, and patch components
 * @example
 * const version = parseVersion("2.3.1");
 * // Returns { major: 2, minor: 3, patch: 1, toString: () => "2.3.1" }
 */
export function parseVersion(versionStr: string): INotificationEventVersion {
  const parts = versionStr.split('.');
  return {
    major: parseInt(parts[0], 10) || 0,
    minor: parseInt(parts[1], 10) || 0,
    patch: parseInt(parts[2], 10) || 0,
    toString: () => versionStr
  };
}

/**
 * Compares two version objects
 * 
 * This utility function compares two INotificationEventVersion objects to determine
 * their relative ordering. It follows semantic versioning rules, comparing major,
 * minor, and patch components in order of significance.
 * 
 * @param v1 The first version to compare
 * @param v2 The second version to compare
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 * @example
 * const v1 = parseVersion("2.3.1");
 * const v2 = parseVersion("2.4.0");
 * const result = compareVersions(v1, v2); // Returns -1 (v1 < v2)
 */
export function compareVersions(v1: INotificationEventVersion, v2: INotificationEventVersion): number {
  if (v1.major !== v2.major) {
    return v1.major < v2.major ? -1 : 1;
  }
  if (v1.minor !== v2.minor) {
    return v1.minor < v2.minor ? -1 : 1;
  }
  if (v1.patch !== v2.patch) {
    return v1.patch < v2.patch ? -1 : 1;
  }
  return 0;
}

/**
 * Checks if a version is backward compatible with another version
 * 
 * This utility function determines if a current version is backward compatible with
 * a target version. According to semantic versioning principles, versions are backward
 * compatible if they have the same major version and the current version is greater than
 * or equal to the target version.
 * 
 * This function is essential for implementing the backward compatibility patterns
 * required for event processors to handle events from different versions.
 * 
 * @param currentVersion The current version (typically the system version)
 * @param targetVersion The target version to check compatibility with (typically the event version)
 * @returns True if currentVersion is backward compatible with targetVersion
 * @example
 * const systemVersion = parseVersion("2.3.1");
 * const eventVersion = parseVersion("2.1.0");
 * const isCompatible = isBackwardCompatible(systemVersion, eventVersion); // Returns true
 */
export function isBackwardCompatible(
  currentVersion: INotificationEventVersion,
  targetVersion: INotificationEventVersion
): boolean {
  // Major version must be the same for backward compatibility
  if (currentVersion.major !== targetVersion.major) {
    return false;
  }
  
  // If major versions are the same, current version must be >= target version
  return compareVersions(currentVersion, targetVersion) >= 0;
}

/**
 * Creates a version string from major, minor, and patch numbers
 * 
 * This utility function formats individual version components into a standard
 * semantic version string (major.minor.patch). It's useful for creating version
 * strings when defining new event schemas or migrations.
 * 
 * @param major The major version number
 * @param minor The minor version number
 * @param patch The patch version number
 * @returns The formatted version string in the format "major.minor.patch"
 * @example
 * const versionStr = createVersionString(2, 3, 1); // Returns "2.3.1"
 */
export function createVersionString(major: number, minor: number, patch: number): string {
  return `${major}.${minor}.${patch}`;
}

/**
 * Marks a field as deprecated in a versioned notification event
 * 
 * This utility function adds or updates deprecation metadata for a field in a
 * versioned notification event. It's a key component of the deprecation flagging
 * system for evolving event schemas, allowing producers to signal upcoming changes
 * to consumers.
 * 
 * Deprecation metadata includes information about when the field was deprecated,
 * when it will be removed, what field replaces it (if any), and migration instructions.
 * 
 * @param event The event to mark fields as deprecated in
 * @param fieldName The name of the field to mark as deprecated (can use dot notation for nested fields)
 * @param deprecatedInVersion The version when the field was deprecated
 * @param removeInVersion The version when the field will be removed
 * @param replacedBy Optional replacement field name
 * @param message Optional message with migration instructions
 * @returns The updated event with deprecation metadata
 * @example
 * const event = { id: '123', version: '2.3.1', oldField: 'value', newField: 'value' };
 * const updatedEvent = markFieldAsDeprecated(
 *   event,
 *   'oldField',
 *   '2.3.0',
 *   '3.0.0',
 *   'newField',
 *   'Use newField instead of oldField for improved performance'
 * );
 */
export function markFieldAsDeprecated<T extends IVersionedNotificationEvent<any>>(
  event: T,
  fieldName: string,
  deprecatedInVersion: string,
  removeInVersion: string,
  replacedBy?: string,
  message?: string
): T {
  const deprecatedField: DeprecatedField = {
    fieldName,
    deprecatedInVersion,
    removeInVersion,
    replacedBy,
    message
  };

  if (!event.deprecatedFields) {
    event.deprecatedFields = [];
  }

  // Check if this field is already marked as deprecated
  const existingIndex = event.deprecatedFields.findIndex(df => df.fieldName === fieldName);
  if (existingIndex >= 0) {
    // Update existing entry
    event.deprecatedFields[existingIndex] = deprecatedField;
  } else {
    // Add new entry
    event.deprecatedFields.push(deprecatedField);
  }

  return event;
}