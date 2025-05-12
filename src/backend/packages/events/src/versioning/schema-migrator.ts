/**
 * @file schema-migrator.ts
 * @description Implements migration utilities to transform events between different schema versions,
 * ensuring backward and forward compatibility as event schemas evolve. Provides a registry for
 * migration paths, automatic migration execution, and validation of migration results.
 */

import { EventVersion, MigrationDirection, MigrationPath, MigrationRegistry, MigrationResult, MigrationTransformer, SchemaValidator, VersionedEvent } from './types';
import { VersionDetectionError, MigrationPathNotFoundError, MigrationExecutionError, ValidationError } from './errors';
import { LATEST_VERSION, DEFAULT_MIGRATION_OPTIONS } from './constants';
import { isCompatible } from './compatibility-checker';
import { transformEvent } from './transformer';

/**
 * Schema Migrator class that provides utilities for migrating events between different schema versions.
 * It maintains a registry of migration paths and provides methods to discover and execute migrations.
 */
export class SchemaMigrator {
  private registry: MigrationRegistry = new Map();
  private validators: Map<string, SchemaValidator> = new Map();

  /**
   * Registers a migration path between two versions of an event schema.
   * 
   * @param eventType - The type of event this migration applies to
   * @param fromVersion - The source version of the event
   * @param toVersion - The target version of the event
   * @param transformer - The function that transforms the event from source to target version
   * @param validator - Optional validator function to validate the transformed event
   * @returns The SchemaMigrator instance for method chaining
   */
  public registerMigration<T extends VersionedEvent, U extends VersionedEvent>(
    eventType: string,
    fromVersion: EventVersion,
    toVersion: EventVersion,
    transformer: MigrationTransformer<T, U>,
    validator?: SchemaValidator
  ): SchemaMigrator {
    // Create a unique key for this event type
    const eventKey = this.getEventTypeKey(eventType);
    
    // Initialize the event type in the registry if it doesn't exist
    if (!this.registry.has(eventKey)) {
      this.registry.set(eventKey, new Map());
    }
    
    // Get the migrations map for this event type
    const eventMigrations = this.registry.get(eventKey)!;
    
    // Create a unique key for this migration path
    const migrationKey = this.getMigrationKey(fromVersion, toVersion);
    
    // Register the migration path
    eventMigrations.set(migrationKey, {
      eventType,
      fromVersion,
      toVersion,
      transformer
    });
    
    // Register the validator if provided
    if (validator) {
      this.validators.set(this.getValidatorKey(eventType, toVersion), validator);
    }
    
    return this;
  }

  /**
   * Registers a bidirectional migration path between two versions of an event schema.
   * This is a convenience method that registers both upgrade and downgrade paths.
   * 
   * @param eventType - The type of event this migration applies to
   * @param version1 - The first version of the event
   * @param version2 - The second version of the event
   * @param upgradeTransformer - The function that transforms from version1 to version2
   * @param downgradeTransformer - The function that transforms from version2 to version1
   * @param validator1 - Optional validator function for version1
   * @param validator2 - Optional validator function for version2
   * @returns The SchemaMigrator instance for method chaining
   */
  public registerBidirectionalMigration<T extends VersionedEvent, U extends VersionedEvent>(
    eventType: string,
    version1: EventVersion,
    version2: EventVersion,
    upgradeTransformer: MigrationTransformer<T, U>,
    downgradeTransformer: MigrationTransformer<U, T>,
    validator1?: SchemaValidator,
    validator2?: SchemaValidator
  ): SchemaMigrator {
    // Register the upgrade path
    this.registerMigration(eventType, version1, version2, upgradeTransformer, validator2);
    
    // Register the downgrade path
    this.registerMigration(eventType, version2, version1, downgradeTransformer, validator1);
    
    return this;
  }

  /**
   * Migrates an event from its current version to the specified target version.
   * If no target version is specified, it migrates to the latest known version.
   * 
   * @param event - The event to migrate
   * @param targetVersion - Optional target version to migrate to
   * @param options - Optional migration options
   * @returns A promise that resolves to the migration result
   * @throws {VersionDetectionError} If the event version cannot be detected
   * @throws {MigrationPathNotFoundError} If no migration path can be found
   * @throws {MigrationExecutionError} If the migration fails during execution
   * @throws {ValidationError} If the migrated event fails validation
   */
  public async migrateEvent<T extends VersionedEvent>(
    event: T,
    targetVersion?: EventVersion,
    options = DEFAULT_MIGRATION_OPTIONS
  ): Promise<MigrationResult<VersionedEvent>> {
    // If no target version is specified, use the latest version
    const finalTargetVersion = targetVersion || LATEST_VERSION;
    
    // Get the current version of the event
    const currentVersion = event.version;
    
    // If the event is already at the target version, return it as is
    if (currentVersion === finalTargetVersion) {
      return {
        success: true,
        originalEvent: event,
        migratedEvent: event,
        fromVersion: currentVersion,
        toVersion: finalTargetVersion,
        migrationPath: []
      };
    }
    
    // Find the migration path from the current version to the target version
    const migrationPath = this.discoverMigrationPath(
      event.type,
      currentVersion,
      finalTargetVersion
    );
    
    if (!migrationPath || migrationPath.length === 0) {
      throw new MigrationPathNotFoundError(
        `No migration path found from version ${currentVersion} to ${finalTargetVersion} for event type ${event.type}`
      );
    }
    
    // Execute the migration path
    try {
      let currentEvent = event;
      const executedPaths: MigrationPath[] = [];
      
      // Apply each migration step in the path
      for (const path of migrationPath) {
        const result = await this.executeMigrationStep(currentEvent, path, options);
        currentEvent = result.migratedEvent as T;
        executedPaths.push(path);
      }
      
      // Validate the final migrated event if validation is enabled
      if (options.validateResult) {
        const validator = this.validators.get(this.getValidatorKey(event.type, finalTargetVersion));
        if (validator && !validator(currentEvent)) {
          throw new ValidationError(
            `Migrated event failed validation for version ${finalTargetVersion}`
          );
        }
      }
      
      return {
        success: true,
        originalEvent: event,
        migratedEvent: currentEvent,
        fromVersion: currentVersion,
        toVersion: finalTargetVersion,
        migrationPath: executedPaths
      };
    } catch (error) {
      // If rollback is enabled, try to roll back to the original event
      if (options.rollbackOnError) {
        // In a real implementation, we would apply the reverse migrations here
        // For simplicity, we just return the original event
        return {
          success: false,
          originalEvent: event,
          migratedEvent: event,
          fromVersion: currentVersion,
          toVersion: currentVersion,
          error: error instanceof Error ? error : new Error(String(error)),
          migrationPath: []
        };
      }
      
      // Re-throw the error if rollback is not enabled
      throw error;
    }
  }

  /**
   * Discovers a migration path between two versions of an event schema.
   * Uses a breadth-first search algorithm to find the shortest path.
   * 
   * @param eventType - The type of event to find a migration path for
   * @param fromVersion - The source version to migrate from
   * @param toVersion - The target version to migrate to
   * @returns An array of migration paths that form the complete migration, or null if no path is found
   */
  public discoverMigrationPath(
    eventType: string,
    fromVersion: EventVersion,
    toVersion: EventVersion
  ): MigrationPath[] | null {
    // If the versions are the same, no migration is needed
    if (fromVersion === toVersion) {
      return [];
    }
    
    // Get the event type key
    const eventKey = this.getEventTypeKey(eventType);
    
    // If there are no migrations registered for this event type, return null
    if (!this.registry.has(eventKey)) {
      return null;
    }
    
    // Get the migrations map for this event type
    const eventMigrations = this.registry.get(eventKey)!;
    
    // Check if there's a direct migration path
    const directKey = this.getMigrationKey(fromVersion, toVersion);
    if (eventMigrations.has(directKey)) {
      return [eventMigrations.get(directKey)!];
    }
    
    // If no direct path, use breadth-first search to find the shortest path
    const queue: { version: EventVersion; path: MigrationPath[] }[] = [
      { version: fromVersion, path: [] }
    ];
    const visited = new Set<EventVersion>([fromVersion]);
    
    while (queue.length > 0) {
      const { version, path } = queue.shift()!;
      
      // Find all migrations that start from the current version
      for (const [key, migration] of eventMigrations.entries()) {
        if (key.startsWith(`${version}->`) && !visited.has(migration.toVersion)) {
          const newPath = [...path, migration];
          
          // If we've reached the target version, return the path
          if (migration.toVersion === toVersion) {
            return newPath;
          }
          
          // Otherwise, add the new version to the queue
          visited.add(migration.toVersion);
          queue.push({ version: migration.toVersion, path: newPath });
        }
      }
    }
    
    // If we've exhausted all possibilities and haven't found a path, return null
    return null;
  }

  /**
   * Executes a single migration step, transforming an event from one version to another.
   * 
   * @param event - The event to migrate
   * @param migrationPath - The migration path to execute
   * @param options - Migration options
   * @returns A promise that resolves to the migration result
   * @throws {MigrationExecutionError} If the migration fails during execution
   * @throws {ValidationError} If the migrated event fails validation
   */
  private async executeMigrationStep<T extends VersionedEvent>(
    event: T,
    migrationPath: MigrationPath,
    options: typeof DEFAULT_MIGRATION_OPTIONS
  ): Promise<MigrationResult<VersionedEvent>> {
    try {
      // Execute the transformation
      const migratedEvent = await migrationPath.transformer(event);
      
      // Ensure the version is updated in the migrated event
      migratedEvent.version = migrationPath.toVersion;
      
      // Validate the migrated event if step validation is enabled
      if (options.validateSteps) {
        const validator = this.validators.get(
          this.getValidatorKey(event.type, migrationPath.toVersion)
        );
        
        if (validator && !validator(migratedEvent)) {
          throw new ValidationError(
            `Migrated event failed validation for version ${migrationPath.toVersion}`
          );
        }
      }
      
      return {
        success: true,
        originalEvent: event,
        migratedEvent,
        fromVersion: migrationPath.fromVersion,
        toVersion: migrationPath.toVersion,
        migrationPath: [migrationPath]
      };
    } catch (error) {
      throw new MigrationExecutionError(
        `Failed to execute migration from ${migrationPath.fromVersion} to ${migrationPath.toVersion}`,
        { cause: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }

  /**
   * Determines if a direct migration is possible between two versions of an event schema.
   * 
   * @param eventType - The type of event to check
   * @param fromVersion - The source version
   * @param toVersion - The target version
   * @returns True if a direct migration is possible, false otherwise
   */
  public canMigrateDirect(
    eventType: string,
    fromVersion: EventVersion,
    toVersion: EventVersion
  ): boolean {
    // If the versions are the same, no migration is needed
    if (fromVersion === toVersion) {
      return true;
    }
    
    // Get the event type key
    const eventKey = this.getEventTypeKey(eventType);
    
    // If there are no migrations registered for this event type, return false
    if (!this.registry.has(eventKey)) {
      return false;
    }
    
    // Get the migrations map for this event type
    const eventMigrations = this.registry.get(eventKey)!;
    
    // Check if there's a direct migration path
    const directKey = this.getMigrationKey(fromVersion, toVersion);
    return eventMigrations.has(directKey);
  }

  /**
   * Determines if a migration path exists between two versions of an event schema.
   * 
   * @param eventType - The type of event to check
   * @param fromVersion - The source version
   * @param toVersion - The target version
   * @returns True if a migration path exists, false otherwise
   */
  public canMigrate(
    eventType: string,
    fromVersion: EventVersion,
    toVersion: EventVersion
  ): boolean {
    // If the versions are the same, no migration is needed
    if (fromVersion === toVersion) {
      return true;
    }
    
    // Try to discover a migration path
    const path = this.discoverMigrationPath(eventType, fromVersion, toVersion);
    return path !== null && path.length > 0;
  }

  /**
   * Gets all registered migration paths for a specific event type.
   * 
   * @param eventType - The type of event to get migrations for
   * @returns An array of migration paths, or an empty array if none are found
   */
  public getMigrations(eventType: string): MigrationPath[] {
    const eventKey = this.getEventTypeKey(eventType);
    
    if (!this.registry.has(eventKey)) {
      return [];
    }
    
    const eventMigrations = this.registry.get(eventKey)!;
    return Array.from(eventMigrations.values());
  }

  /**
   * Gets all registered event types that have migration paths.
   * 
   * @returns An array of event types
   */
  public getRegisteredEventTypes(): string[] {
    return Array.from(this.registry.keys()).map(key => {
      // Remove the 'event:' prefix from the key
      return key.substring(6);
    });
  }

  /**
   * Creates a unique key for an event type in the registry.
   * 
   * @param eventType - The event type
   * @returns A unique key for the event type
   */
  private getEventTypeKey(eventType: string): string {
    return `event:${eventType}`;
  }

  /**
   * Creates a unique key for a migration path in the registry.
   * 
   * @param fromVersion - The source version
   * @param toVersion - The target version
   * @returns A unique key for the migration path
   */
  private getMigrationKey(fromVersion: EventVersion, toVersion: EventVersion): string {
    return `${fromVersion}->${toVersion}`;
  }

  /**
   * Creates a unique key for a validator in the registry.
   * 
   * @param eventType - The event type
   * @param version - The event version
   * @returns A unique key for the validator
   */
  private getValidatorKey(eventType: string, version: EventVersion): string {
    return `validator:${eventType}:${version}`;
  }
}

/**
 * Singleton instance of the SchemaMigrator.
 */
export const schemaMigrator = new SchemaMigrator();

/**
 * Migrates an event from its current version to the specified target version.
 * This is a convenience function that uses the singleton SchemaMigrator instance.
 * 
 * @param event - The event to migrate
 * @param targetVersion - Optional target version to migrate to
 * @param options - Optional migration options
 * @returns A promise that resolves to the migration result
 */
export async function migrateEvent<T extends VersionedEvent>(
  event: T,
  targetVersion?: EventVersion,
  options = DEFAULT_MIGRATION_OPTIONS
): Promise<MigrationResult<VersionedEvent>> {
  return schemaMigrator.migrateEvent(event, targetVersion, options);
}

/**
 * Registers a migration path between two versions of an event schema.
 * This is a convenience function that uses the singleton SchemaMigrator instance.
 * 
 * @param eventType - The type of event this migration applies to
 * @param fromVersion - The source version of the event
 * @param toVersion - The target version of the event
 * @param transformer - The function that transforms the event from source to target version
 * @param validator - Optional validator function to validate the transformed event
 */
export function registerMigration<T extends VersionedEvent, U extends VersionedEvent>(
  eventType: string,
  fromVersion: EventVersion,
  toVersion: EventVersion,
  transformer: MigrationTransformer<T, U>,
  validator?: SchemaValidator
): void {
  schemaMigrator.registerMigration(eventType, fromVersion, toVersion, transformer, validator);
}

/**
 * Registers a bidirectional migration path between two versions of an event schema.
 * This is a convenience function that uses the singleton SchemaMigrator instance.
 * 
 * @param eventType - The type of event this migration applies to
 * @param version1 - The first version of the event
 * @param version2 - The second version of the event
 * @param upgradeTransformer - The function that transforms from version1 to version2
 * @param downgradeTransformer - The function that transforms from version2 to version1
 * @param validator1 - Optional validator function for version1
 * @param validator2 - Optional validator function for version2
 */
export function registerBidirectionalMigration<T extends VersionedEvent, U extends VersionedEvent>(
  eventType: string,
  version1: EventVersion,
  version2: EventVersion,
  upgradeTransformer: MigrationTransformer<T, U>,
  downgradeTransformer: MigrationTransformer<U, T>,
  validator1?: SchemaValidator,
  validator2?: SchemaValidator
): void {
  schemaMigrator.registerBidirectionalMigration(
    eventType,
    version1,
    version2,
    upgradeTransformer,
    downgradeTransformer,
    validator1,
    validator2
  );
}

/**
 * Determines if a migration path exists between two versions of an event schema.
 * This is a convenience function that uses the singleton SchemaMigrator instance.
 * 
 * @param eventType - The type of event to check
 * @param fromVersion - The source version
 * @param toVersion - The target version
 * @returns True if a migration path exists, false otherwise
 */
export function canMigrate(
  eventType: string,
  fromVersion: EventVersion,
  toVersion: EventVersion
): boolean {
  return schemaMigrator.canMigrate(eventType, fromVersion, toVersion);
}

/**
 * Discovers a migration path between two versions of an event schema.
 * This is a convenience function that uses the singleton SchemaMigrator instance.
 * 
 * @param eventType - The type of event to find a migration path for
 * @param fromVersion - The source version to migrate from
 * @param toVersion - The target version to migrate to
 * @returns An array of migration paths that form the complete migration, or null if no path is found
 */
export function discoverMigrationPath(
  eventType: string,
  fromVersion: EventVersion,
  toVersion: EventVersion
): MigrationPath[] | null {
  return schemaMigrator.discoverMigrationPath(eventType, fromVersion, toVersion);
}