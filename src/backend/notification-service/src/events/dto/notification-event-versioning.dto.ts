import { Injectable } from '@nestjs/common';
import { IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import from @austa/interfaces for standardized event types
import { IVersionedEvent, EventVersion } from '@austa/interfaces/gamification/events';
import { INotificationEventVersion, IVersionedNotificationEvent } from '../interfaces/notification-event-versioning.interface';

// Import versioning utilities from shared package
import {
  VersionDetector,
  SchemaTransformer,
  CompatibilityChecker,
  SchemaMigrator,
  VersioningError,
  TransformationOptions,
  MigrationPath
} from '@backend/packages/events/src/versioning';

/**
 * Represents the version information for a notification event
 * Implements the INotificationEventVersion interface
 */
export class NotificationEventVersionDto implements INotificationEventVersion {
  @IsString()
  version: string;

  @IsOptional()
  @IsString()
  minCompatibleVersion?: string;

  @IsOptional()
  @IsEnum(EventVersion)
  schemaVersion?: EventVersion;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

/**
 * Base class for versioned notification events
 * Implements the IVersionedNotificationEvent interface
 */
export class VersionedNotificationEventDto implements IVersionedNotificationEvent {
  @ValidateNested()
  @Type(() => NotificationEventVersionDto)
  versionInfo: NotificationEventVersionDto;

  @IsObject()
  payload: Record<string, any>;
}

/**
 * Service responsible for handling notification event versioning
 * Provides utilities for transforming events between different versions,
 * validating version-specific fields, and handling deprecated properties
 */
@Injectable()
export class NotificationEventVersioningService {
  private readonly versionDetector: VersionDetector;
  private readonly schemaTransformer: SchemaTransformer;
  private readonly compatibilityChecker: CompatibilityChecker;
  private readonly schemaMigrator: SchemaMigrator;

  constructor() {
    this.versionDetector = new VersionDetector();
    this.schemaTransformer = new SchemaTransformer();
    this.compatibilityChecker = new CompatibilityChecker();
    this.schemaMigrator = new SchemaMigrator();
  }

  /**
   * Detects the version of a notification event
   * @param event The event to detect the version for
   * @returns The detected version information
   * @throws VersioningError if version detection fails
   */
  detectVersion(event: Record<string, any>): NotificationEventVersionDto {
    try {
      // First try to detect from explicit version field
      const versionInfo = this.versionDetector.detectVersion(event);
      
      return {
        version: versionInfo.version,
        minCompatibleVersion: versionInfo.minCompatibleVersion,
        schemaVersion: versionInfo.schemaVersion as EventVersion,
        metadata: versionInfo.metadata
      };
    } catch (error) {
      // Fallback to structural analysis if explicit version not found
      try {
        const versionInfo = this.versionDetector.detectVersionFromStructure(event);
        return {
          version: versionInfo.version,
          schemaVersion: versionInfo.schemaVersion as EventVersion,
          metadata: { detectedBy: 'structure' }
        };
      } catch (fallbackError) {
        throw new VersioningError(
          'Failed to detect notification event version',
          { originalError: error, fallbackError, event }
        );
      }
    }
  }

  /**
   * Checks if an event is compatible with a target version
   * @param event The event to check compatibility for
   * @param targetVersion The target version to check compatibility against
   * @returns True if compatible, false otherwise
   */
  isCompatible(event: IVersionedNotificationEvent, targetVersion: string): boolean {
    return this.compatibilityChecker.isCompatible(
      event.versionInfo.version,
      targetVersion,
      { strictMode: false }
    );
  }

  /**
   * Transforms an event to a target version
   * @param event The event to transform
   * @param targetVersion The target version to transform to
   * @param options Transformation options
   * @returns The transformed event
   * @throws VersioningError if transformation fails
   */
  transformToVersion(
    event: IVersionedNotificationEvent,
    targetVersion: string,
    options?: TransformationOptions
  ): IVersionedNotificationEvent {
    try {
      // Check if transformation is needed
      if (event.versionInfo.version === targetVersion) {
        return event;
      }

      // Check compatibility before transformation
      if (!this.isCompatible(event, targetVersion)) {
        throw new VersioningError(
          'Event version is not compatible with target version',
          { 
            sourceVersion: event.versionInfo.version, 
            targetVersion,
            event
          }
        );
      }

      // Transform the event
      const transformedPayload = this.schemaTransformer.transform(
        event.payload,
        event.versionInfo.version,
        targetVersion,
        options
      );

      // Create a new event with the transformed payload
      return {
        versionInfo: {
          ...event.versionInfo,
          version: targetVersion,
          metadata: {
            ...event.versionInfo.metadata,
            transformedFrom: event.versionInfo.version,
            transformedAt: new Date().toISOString()
          }
        },
        payload: transformedPayload
      };
    } catch (error) {
      if (error instanceof VersioningError) {
        throw error;
      }
      throw new VersioningError(
        'Failed to transform notification event',
        { originalError: error, event, targetVersion }
      );
    }
  }

  /**
   * Migrates an event schema to a target version using registered migration paths
   * @param event The event to migrate
   * @param targetVersion The target version to migrate to
   * @returns The migrated event
   * @throws VersioningError if migration fails
   */
  migrateSchema(
    event: IVersionedNotificationEvent,
    targetVersion: string
  ): IVersionedNotificationEvent {
    try {
      // Check if migration is needed
      if (event.versionInfo.version === targetVersion) {
        return event;
      }

      // Migrate the event schema
      const migratedPayload = this.schemaMigrator.migrate(
        event.payload,
        event.versionInfo.version,
        targetVersion
      );

      // Create a new event with the migrated payload
      return {
        versionInfo: {
          ...event.versionInfo,
          version: targetVersion,
          metadata: {
            ...event.versionInfo.metadata,
            migratedFrom: event.versionInfo.version,
            migratedAt: new Date().toISOString()
          }
        },
        payload: migratedPayload
      };
    } catch (error) {
      if (error instanceof VersioningError) {
        throw error;
      }
      throw new VersioningError(
        'Failed to migrate notification event schema',
        { originalError: error, event, targetVersion }
      );
    }
  }

  /**
   * Registers a migration path for notification events
   * @param sourcePath The migration path to register
   */
  registerMigrationPath(migrationPath: MigrationPath): void {
    this.schemaMigrator.registerMigrationPath(migrationPath);
  }

  /**
   * Handles deprecated fields in an event
   * @param event The event to handle deprecated fields for
   * @returns The event with deprecated fields handled
   */
  handleDeprecatedFields(event: IVersionedNotificationEvent): IVersionedNotificationEvent {
    // Get the current version's deprecated fields
    const deprecatedFields = this.getDeprecatedFields(event.versionInfo.version);
    
    if (!deprecatedFields || deprecatedFields.length === 0) {
      return event;
    }

    // Create a new payload without deprecated fields
    const newPayload = { ...event.payload };
    
    // Remove deprecated fields
    for (const field of deprecatedFields) {
      delete newPayload[field];
    }

    // Return the event with deprecated fields removed
    return {
      versionInfo: event.versionInfo,
      payload: newPayload
    };
  }

  /**
   * Gets the deprecated fields for a specific version
   * @param version The version to get deprecated fields for
   * @returns Array of deprecated field names
   */
  private getDeprecatedFields(version: string): string[] {
    // This would typically come from a configuration or schema registry
    // For now, we'll use a simple mapping
    const deprecationMap: Record<string, string[]> = {
      '1.0.0': [],
      '1.1.0': ['oldField1'],
      '1.2.0': ['oldField1', 'oldField2'],
      '2.0.0': ['oldField1', 'oldField2', 'oldField3']
    };

    return deprecationMap[version] || [];
  }

  /**
   * Validates that an event conforms to its declared version schema
   * @param event The event to validate
   * @returns True if valid, throws error otherwise
   * @throws VersioningError if validation fails
   */
  validateEventSchema(event: IVersionedNotificationEvent): boolean {
    // This would typically use JSON Schema validation or similar
    // For now, we'll assume it's valid if it has the required structure
    if (!event.versionInfo || !event.versionInfo.version || !event.payload) {
      throw new VersioningError(
        'Invalid notification event schema',
        { event }
      );
    }

    return true;
  }
}