/**
 * Notification Event Versioning DTO
 * 
 * Implements versioning support for notification event schemas, enabling backward compatibility
 * and graceful schema evolution. This DTO provides utilities for transforming events between
 * different versions, validating version-specific fields, and handling deprecated properties.
 * 
 * Key features:
 * - Version-based event schema transformation utilities
 * - Backward compatibility layer for processing older event versions
 * - Schema migration during event processing
 * - Integration with @austa/interfaces versioned event types
 * 
 * @module notification-service/events/dto
 */

import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BaseNotificationEventDto } from './base-notification-event.dto';
import {
  CompatibilityLevel,
  DeprecatedField,
  IBackwardCompatibilityHandler,
  INotificationEventMigration,
  INotificationEventSchemaRegistry,
  INotificationEventTransformer,
  INotificationEventVersion,
  IVersionedNotificationEvent,
  ValidationError,
  compareVersions,
  createVersionString,
  isBackwardCompatible,
  parseVersion,
} from '../interfaces/notification-event-versioning.interface';
import { IEventType } from '@austa/interfaces/common';

/**
 * Class representing a semantic version for notification events
 */
export class NotificationEventVersion implements INotificationEventVersion {
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
   * Creates a new NotificationEventVersion instance
   * @param versionStr Version string in format "major.minor.patch"
   */
  constructor(versionStr: string) {
    const parsed = parseVersion(versionStr);
    this.major = parsed.major;
    this.minor = parsed.minor;
    this.patch = parsed.patch;
  }

  /**
   * Returns the string representation of the version
   * @returns Version string in format "major.minor.patch"
   */
  toString(): string {
    return createVersionString(this.major, this.minor, this.patch);
  }

  /**
   * Checks if this version is compatible with another version
   * @param otherVersion The version to check compatibility with
   * @returns True if this version is backward compatible with otherVersion
   */
  isCompatibleWith(otherVersion: INotificationEventVersion): boolean {
    return isBackwardCompatible(this, otherVersion);
  }

  /**
   * Compares this version with another version
   * @param otherVersion The version to compare with
   * @returns -1 if this < other, 0 if this === other, 1 if this > other
   */
  compareTo(otherVersion: INotificationEventVersion): number {
    return compareVersions(this, otherVersion);
  }

  /**
   * Creates a new version with incremented major version
   * @returns A new version with major version incremented
   */
  nextMajor(): NotificationEventVersion {
    return new NotificationEventVersion(
      createVersionString(this.major + 1, 0, 0)
    );
  }

  /**
   * Creates a new version with incremented minor version
   * @returns A new version with minor version incremented
   */
  nextMinor(): NotificationEventVersion {
    return new NotificationEventVersion(
      createVersionString(this.major, this.minor + 1, 0)
    );
  }

  /**
   * Creates a new version with incremented patch version
   * @returns A new version with patch version incremented
   */
  nextPatch(): NotificationEventVersion {
    return new NotificationEventVersion(
      createVersionString(this.major, this.minor, this.patch + 1)
    );
  }
}

/**
 * DTO for deprecated field information in notification events
 */
export class DeprecatedFieldDto implements DeprecatedField {
  /**
   * The name of the deprecated field
   */
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  /**
   * The version when this field was deprecated
   */
  @IsString()
  @IsNotEmpty()
  deprecatedInVersion: string;

  /**
   * The version when this field will be removed
   */
  @IsString()
  @IsNotEmpty()
  removeInVersion: string;

  /**
   * The replacement field name, if any
   */
  @IsString()
  @IsOptional()
  replacedBy?: string;

  /**
   * Optional message with migration instructions
   */
  @IsString()
  @IsOptional()
  message?: string;
}

/**
 * DTO for versioned notification events
 * Extends the base notification event with versioning information
 */
export class VersionedNotificationEventDto<T extends IEventType = IEventType>
  extends BaseNotificationEventDto
  implements IVersionedNotificationEvent<T> {
  /**
   * The event type identifier
   */
  @IsString()
  @IsNotEmpty()
  eventType: T;

  /**
   * The version of the event schema
   * Format: "major.minor.patch" (e.g., "1.2.3")
   */
  @IsString()
  @IsNotEmpty()
  version: string;

  /**
   * Optional metadata about deprecated fields
   */
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DeprecatedFieldDto)
  deprecatedFields?: DeprecatedFieldDto[];

  /**
   * The event payload
   */
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  /**
   * Gets the parsed version object
   * @returns The parsed version object
   */
  getVersionObject(): NotificationEventVersion {
    return new NotificationEventVersion(this.version);
  }

  /**
   * Marks a field as deprecated
   * @param fieldName The name of the field to mark as deprecated
   * @param deprecatedInVersion The version when the field was deprecated
   * @param removeInVersion The version when the field will be removed
   * @param replacedBy Optional replacement field name
   * @param message Optional message with migration instructions
   * @returns This event instance for chaining
   */
  markFieldAsDeprecated(
    fieldName: string,
    deprecatedInVersion: string,
    removeInVersion: string,
    replacedBy?: string,
    message?: string
  ): this {
    const deprecatedField: DeprecatedFieldDto = {
      fieldName,
      deprecatedInVersion,
      removeInVersion,
      replacedBy,
      message,
    };

    if (!this.deprecatedFields) {
      this.deprecatedFields = [];
    }

    // Check if this field is already marked as deprecated
    const existingIndex = this.deprecatedFields.findIndex(
      (df) => df.fieldName === fieldName
    );
    if (existingIndex >= 0) {
      // Update existing entry
      this.deprecatedFields[existingIndex] = deprecatedField;
    } else {
      // Add new entry
      this.deprecatedFields.push(deprecatedField);
    }

    return this;
  }

  /**
   * Checks if a field is deprecated
   * @param fieldName The name of the field to check
   * @returns True if the field is deprecated
   */
  isFieldDeprecated(fieldName: string): boolean {
    if (!this.deprecatedFields) {
      return false;
    }

    return this.deprecatedFields.some((df) => df.fieldName === fieldName);
  }

  /**
   * Gets deprecation information for a field
   * @param fieldName The name of the field to get information for
   * @returns The deprecation information or undefined if not deprecated
   */
  getFieldDeprecationInfo(fieldName: string): DeprecatedFieldDto | undefined {
    if (!this.deprecatedFields) {
      return undefined;
    }

    return this.deprecatedFields.find((df) => df.fieldName === fieldName);
  }
}

/**
 * Implementation of the notification event transformer
 * Responsible for transforming events between different versions
 */
export class NotificationEventTransformer<T extends IVersionedNotificationEvent = IVersionedNotificationEvent>
  implements INotificationEventTransformer<T> {
  private readonly schemaRegistry: INotificationEventSchemaRegistry<T>;

  /**
   * Creates a new NotificationEventTransformer instance
   * @param schemaRegistry The schema registry to use for transformations
   */
  constructor(schemaRegistry: INotificationEventSchemaRegistry<T>) {
    this.schemaRegistry = schemaRegistry;
  }

  /**
   * Transforms a notification event from one version to another
   * @param event The event to transform
   * @param targetVersion The target version to transform to
   * @returns The transformed event
   */
  transform(event: T, targetVersion: INotificationEventVersion): T {
    const sourceVersion = this.getVersion(event);
    const eventType = event.eventType as string;

    // If versions are the same, no transformation needed
    if (compareVersions(sourceVersion, targetVersion) === 0) {
      return { ...event };
    }

    // Check compatibility level
    const compatibilityLevel = this.schemaRegistry.getCompatibilityLevel(
      eventType,
      sourceVersion.toString(),
      targetVersion.toString()
    );

    // If fully compatible, just update the version
    if (compatibilityLevel === CompatibilityLevel.FULL) {
      return {
        ...event,
        version: targetVersion.toString(),
      };
    }

    // For backward or forward compatibility, use the schema registry to migrate
    return this.schemaRegistry.migrateEvent(event, targetVersion.toString());
  }

  /**
   * Gets the source version of a notification event
   * @param event The event to get the version from
   * @returns The event version
   */
  getVersion(event: T): INotificationEventVersion {
    return parseVersion(event.version);
  }

  /**
   * Checks if the transformer can handle the given notification event
   * @param event The event to check
   * @returns True if the transformer can handle the event
   */
  canHandle(event: T): boolean {
    const eventType = event.eventType as string;
    const version = event.version;

    // Check if we have a schema for this event type and version
    return !!this.schemaRegistry.getSchema(eventType, version);
  }

  /**
   * Gets a list of deprecated fields in the event
   * @param event The event to check
   * @returns Array of deprecated fields with metadata
   */
  getDeprecatedFields(event: T): DeprecatedField[] {
    return event.deprecatedFields || [];
  }
}

/**
 * Implementation of the notification event migration
 * Defines the transformation logic between specific versions of an event schema
 */
export class NotificationEventMigration<T extends IVersionedNotificationEvent = IVersionedNotificationEvent>
  implements INotificationEventMigration<T> {
  /**
   * The source version of the migration
   */
  sourceVersion: INotificationEventVersion;

  /**
   * The target version of the migration
   */
  targetVersion: INotificationEventVersion;

  /**
   * The event type this migration applies to
   */
  private readonly eventType: string;

  /**
   * The migration function that transforms events
   */
  private readonly migrationFn: (event: T) => T;

  /**
   * Creates a new NotificationEventMigration instance
   * @param eventType The event type this migration applies to
   * @param sourceVersion The source version of the migration
   * @param targetVersion The target version of the migration
   * @param migrationFn The migration function that transforms events
   */
  constructor(
    eventType: string,
    sourceVersion: string,
    targetVersion: string,
    migrationFn: (event: T) => T
  ) {
    this.eventType = eventType;
    this.sourceVersion = parseVersion(sourceVersion);
    this.targetVersion = parseVersion(targetVersion);
    this.migrationFn = migrationFn;
  }

  /**
   * Migrates a notification event from the source version to the target version
   * @param event The event to migrate
   * @returns The migrated event
   */
  migrate(event: T): T {
    // Apply the migration function
    const migratedEvent = this.migrationFn(event);

    // Update the version
    migratedEvent.version = this.targetVersion.toString();

    return migratedEvent;
  }

  /**
   * Checks if this migration can be applied to the given event
   * @param event The event to check
   * @returns True if the migration can be applied
   */
  canApply(event: T): boolean {
    // Check if the event type matches
    if (event.eventType !== this.eventType) {
      return false;
    }

    // Check if the event version matches the source version
    const eventVersion = parseVersion(event.version);
    return compareVersions(eventVersion, this.sourceVersion) === 0;
  }
}

/**
 * Implementation of the notification event schema registry
 * Manages event schemas across different versions
 */
export class NotificationEventSchemaRegistry<T extends IVersionedNotificationEvent = IVersionedNotificationEvent>
  implements INotificationEventSchemaRegistry<T> {
  /**
   * Map of event types to schemas by version
   */
  private readonly schemas: Map<string, Map<string, any>> = new Map();

  /**
   * Map of event types to migrations
   */
  private readonly migrations: Map<string, INotificationEventMigration<T>[]> = new Map();

  /**
   * Registers a schema for a notification event type
   * @param eventType The event type
   * @param version The schema version
   * @param schema The schema definition
   */
  registerSchema(eventType: string, version: string, schema: any): void {
    if (!this.schemas.has(eventType)) {
      this.schemas.set(eventType, new Map());
    }

    this.schemas.get(eventType)!.set(version, schema);
  }

  /**
   * Gets a schema for a notification event type and version
   * @param eventType The event type
   * @param version The schema version
   * @returns The schema definition or undefined if not found
   */
  getSchema(eventType: string, version: string): any {
    if (!this.schemas.has(eventType)) {
      return undefined;
    }

    return this.schemas.get(eventType)!.get(version);
  }

  /**
   * Gets all versions of a schema for a notification event type
   * @param eventType The event type
   * @returns An array of schema versions
   */
  getSchemaVersions(eventType: string): string[] {
    if (!this.schemas.has(eventType)) {
      return [];
    }

    return Array.from(this.schemas.get(eventType)!.keys());
  }

  /**
   * Validates a notification event against its schema
   * @param event The event to validate
   * @returns True if the event is valid
   * @throws ValidationError with details if validation fails
   */
  validateEvent(event: T): boolean {
    const errors = this.getValidationErrors(event);
    if (errors.length > 0) {
      const errorMessage = errors
        .map((e) => `${e.path}: ${e.message}`)
        .join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }

    return true;
  }

  /**
   * Gets detailed validation errors for an event
   * @param event The event to validate
   * @returns Array of validation errors or empty array if valid
   */
  getValidationErrors(event: T): ValidationError[] {
    const eventType = event.eventType as string;
    const version = event.version;
    const schema = this.getSchema(eventType, version);

    if (!schema) {
      return [
        {
          path: 'schema',
          message: `No schema found for event type ${eventType} version ${version}`,
        },
      ];
    }

    // Implement schema validation logic here
    // This is a simplified example - in a real implementation,
    // you would use a schema validation library like Ajv or class-validator

    const errors: ValidationError[] = [];

    // Check required fields
    for (const field of schema.required || []) {
      if (!(field in event)) {
        errors.push({
          path: field,
          message: `Required field ${field} is missing`,
        });
      }
    }

    // Check field types
    for (const [field, fieldSchema] of Object.entries(schema.properties || {})) {
      if (field in event) {
        const value = (event as any)[field];
        const type = (fieldSchema as any).type;

        if (type === 'string' && typeof value !== 'string') {
          errors.push({
            path: field,
            message: `Field ${field} should be a string`,
            expected: 'string',
            actual: typeof value,
          });
        } else if (type === 'number' && typeof value !== 'number') {
          errors.push({
            path: field,
            message: `Field ${field} should be a number`,
            expected: 'number',
            actual: typeof value,
          });
        } else if (type === 'boolean' && typeof value !== 'boolean') {
          errors.push({
            path: field,
            message: `Field ${field} should be a boolean`,
            expected: 'boolean',
            actual: typeof value,
          });
        } else if (type === 'object' && (typeof value !== 'object' || value === null)) {
          errors.push({
            path: field,
            message: `Field ${field} should be an object`,
            expected: 'object',
            actual: typeof value,
          });
        } else if (type === 'array' && !Array.isArray(value)) {
          errors.push({
            path: field,
            message: `Field ${field} should be an array`,
            expected: 'array',
            actual: typeof value,
          });
        }
      }
    }

    return errors;
  }

  /**
   * Registers a migration between two schema versions
   * @param eventType The event type
   * @param migration The migration implementation
   */
  registerMigration(eventType: string, migration: INotificationEventMigration<T>): void {
    if (!this.migrations.has(eventType)) {
      this.migrations.set(eventType, []);
    }

    this.migrations.get(eventType)!.push(migration);
  }

  /**
   * Gets all migrations for a notification event type
   * @param eventType The event type
   * @returns An array of migrations
   */
  getMigrations(eventType: string): INotificationEventMigration<T>[] {
    if (!this.migrations.has(eventType)) {
      return [];
    }

    return this.migrations.get(eventType)!;
  }

  /**
   * Determines the compatibility level between two versions of an event schema
   * @param eventType The event type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The compatibility level between the versions
   */
  getCompatibilityLevel(
    eventType: string,
    sourceVersion: string,
    targetVersion: string
  ): CompatibilityLevel {
    const source = parseVersion(sourceVersion);
    const target = parseVersion(targetVersion);

    // If versions are the same, they are fully compatible
    if (compareVersions(source, target) === 0) {
      return CompatibilityLevel.FULL;
    }

    // If major versions are different, they are incompatible
    if (source.major !== target.major) {
      return CompatibilityLevel.INCOMPATIBLE;
    }

    // If source is newer than target, check if we have a migration path
    if (compareVersions(source, target) > 0) {
      // Check if we have a direct migration from source to target
      const hasMigration = this.getMigrations(eventType).some(
        (m) =>
          compareVersions(m.sourceVersion, source) === 0 &&
          compareVersions(m.targetVersion, target) === 0
      );

      return hasMigration ? CompatibilityLevel.FORWARD : CompatibilityLevel.INCOMPATIBLE;
    }

    // If target is newer than source, check if we have a migration path
    // Check if we have a direct migration from source to target
    const hasMigration = this.getMigrations(eventType).some(
      (m) =>
        compareVersions(m.sourceVersion, source) === 0 &&
        compareVersions(m.targetVersion, target) === 0
    );

    return hasMigration ? CompatibilityLevel.BACKWARD : CompatibilityLevel.INCOMPATIBLE;
  }

  /**
   * Migrates an event from its current version to the target version
   * @param event The event to migrate
   * @param targetVersion The target version to migrate to
   * @returns The migrated event
   * @throws Error if migration path is not available
   */
  migrateEvent(event: T, targetVersion: string): T {
    const eventType = event.eventType as string;
    const sourceVersion = event.version;
    const target = parseVersion(targetVersion);

    // If versions are the same, no migration needed
    if (sourceVersion === targetVersion) {
      return { ...event };
    }

    // Find a direct migration path
    const migration = this.getMigrations(eventType).find(
      (m) =>
        m.canApply(event) &&
        compareVersions(m.targetVersion, target) === 0
    );

    if (migration) {
      return migration.migrate(event);
    }

    // If no direct path, try to find a path through intermediate versions
    const source = parseVersion(sourceVersion);
    const migrations = this.getMigrations(eventType);

    // Sort migrations by source version
    const sortedMigrations = [...migrations].sort((a, b) =>
      compareVersions(a.sourceVersion, b.sourceVersion)
    );

    // Try to find a path from source to target
    let currentEvent = { ...event };
    let currentVersion = source;
    let migrationApplied = false;

    while (compareVersions(currentVersion, target) !== 0) {
      // Find the next migration in the path
      const nextMigration = sortedMigrations.find(
        (m) =>
          compareVersions(m.sourceVersion, currentVersion) === 0 &&
          compareVersions(m.targetVersion, target) <= 0
      );

      if (!nextMigration) {
        break;
      }

      // Apply the migration
      currentEvent = nextMigration.migrate(currentEvent);
      currentVersion = nextMigration.targetVersion;
      migrationApplied = true;
    }

    if (!migrationApplied || compareVersions(currentVersion, target) !== 0) {
      throw new Error(
        `No migration path found from ${sourceVersion} to ${targetVersion} for event type ${eventType}`
      );
    }

    return currentEvent;
  }
}

/**
 * Implementation of the backward compatibility handler
 * Ensures that events from older versions can be processed by newer versions
 */
export class BackwardCompatibilityHandler<T extends IVersionedNotificationEvent = IVersionedNotificationEvent>
  implements IBackwardCompatibilityHandler<T> {
  /**
   * The minimum supported version
   */
  minimumSupportedVersion: INotificationEventVersion;

  /**
   * The current version
   */
  currentVersion: INotificationEventVersion;

  /**
   * The schema registry to use for migrations
   */
  private readonly schemaRegistry: INotificationEventSchemaRegistry<T>;

  /**
   * Creates a new BackwardCompatibilityHandler instance
   * @param minimumSupportedVersion The minimum supported version
   * @param currentVersion The current version
   * @param schemaRegistry The schema registry to use for migrations
   */
  constructor(
    minimumSupportedVersion: string,
    currentVersion: string,
    schemaRegistry: INotificationEventSchemaRegistry<T>
  ) {
    this.minimumSupportedVersion = parseVersion(minimumSupportedVersion);
    this.currentVersion = parseVersion(currentVersion);
    this.schemaRegistry = schemaRegistry;
  }

  /**
   * Adapts an event to the current version if needed
   * @param event The event to adapt
   * @returns The adapted event
   * @throws Error if the event version is below minimum supported version
   */
  adaptToCurrentVersion(event: T): T {
    const eventVersion = parseVersion(event.version);

    // Check if the event version is supported
    if (!this.isVersionSupported(eventVersion)) {
      throw new Error(
        `Event version ${event.version} is below minimum supported version ${this.minimumSupportedVersion.toString()}`
      );
    }

    // If the event is already at the current version, no adaptation needed
    if (compareVersions(eventVersion, this.currentVersion) === 0) {
      return { ...event };
    }

    // Migrate the event to the current version
    return this.schemaRegistry.migrateEvent(
      event,
      this.currentVersion.toString()
    );
  }

  /**
   * Checks if an event version is supported
   * @param version The version to check
   * @returns True if the version is supported
   */
  isVersionSupported(version: INotificationEventVersion): boolean {
    return compareVersions(version, this.minimumSupportedVersion) >= 0;
  }

  /**
   * Gets a list of deprecated fields that will be removed in the next major version
   * @returns Array of deprecated fields with metadata
   */
  getUpcomingBreakingChanges(): DeprecatedField[] {
    const nextMajorVersion = new NotificationEventVersion(
      this.currentVersion.toString()
    ).nextMajor().toString();

    const result: DeprecatedField[] = [];

    // Collect all deprecated fields from all event types and versions
    for (const eventType of this.schemaRegistry.getSchemaVersions('*')) {
      for (const version of this.schemaRegistry.getSchemaVersions(eventType)) {
        const schema = this.schemaRegistry.getSchema(eventType, version);
        if (schema && schema.deprecated) {
          for (const field of schema.deprecated) {
            if (field.removeInVersion === nextMajorVersion) {
              result.push(field);
            }
          }
        }
      }
    }

    return result;
  }
}

/**
 * Factory function to create a versioned notification event
 * @param eventType The event type
 * @param version The event version
 * @param payload The event payload
 * @param userId The user ID
 * @param metadata Optional metadata
 * @returns A new versioned notification event
 */
export function createVersionedNotificationEvent<T extends IEventType>(
  eventType: T,
  version: string,
  payload: Record<string, any>,
  userId: string,
  metadata?: Record<string, any>
): VersionedNotificationEventDto<T> {
  const event = new VersionedNotificationEventDto<T>();
  event.eventType = eventType;
  event.version = version;
  event.payload = payload;
  event.userId = userId;
  event.timestamp = new Date();
  event.id = crypto.randomUUID();
  event.metadata = metadata || {};
  
  // Set default values for BaseNotificationEventDto fields
  event.type = eventType.toString();
  event.title = payload.title || 'Notification';
  event.body = payload.body || 'You have a new notification';
  
  return event;
}

/**
 * Utility function to check if an event needs migration
 * @param event The event to check
 * @param targetVersion The target version to check against
 * @returns True if the event needs migration
 */
export function needsMigration<T extends IVersionedNotificationEvent>(
  event: T,
  targetVersion: string
): boolean {
  const eventVersion = parseVersion(event.version);
  const target = parseVersion(targetVersion);
  
  return compareVersions(eventVersion, target) !== 0;
}

/**
 * Utility function to extract deprecated fields from an event
 * @param event The event to extract deprecated fields from
 * @returns Array of deprecated fields with metadata
 */
export function extractDeprecatedFields<T extends IVersionedNotificationEvent>(
  event: T
): DeprecatedField[] {
  return event.deprecatedFields || [];
}

/**
 * Utility function to check if an event has deprecated fields
 * @param event The event to check
 * @returns True if the event has deprecated fields
 */
export function hasDeprecatedFields<T extends IVersionedNotificationEvent>(
  event: T
): boolean {
  return !!event.deprecatedFields && event.deprecatedFields.length > 0;
}

/**
 * Utility function to get the latest version for an event type
 * @param schemaRegistry The schema registry to use
 * @param eventType The event type to get the latest version for
 * @returns The latest version or undefined if no versions are registered
 */
export function getLatestVersion(
  schemaRegistry: INotificationEventSchemaRegistry,
  eventType: string
): string | undefined {
  const versions = schemaRegistry.getSchemaVersions(eventType);
  if (versions.length === 0) {
    return undefined;
  }
  
  // Sort versions in descending order
  const sortedVersions = [...versions].sort((a, b) => {
    const versionA = parseVersion(a);
    const versionB = parseVersion(b);
    return -compareVersions(versionA, versionB);
  });
  
  return sortedVersions[0];
}