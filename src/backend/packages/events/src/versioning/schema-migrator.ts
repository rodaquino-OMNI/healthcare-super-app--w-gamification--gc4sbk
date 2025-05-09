/**
 * @file schema-migrator.ts
 * @description Implements migration utilities to transform events between different schema versions,
 * ensuring backward and forward compatibility as event schemas evolve. Provides a registry for
 * migration paths, automatic migration path discovery, and validation of migration results.
 * This module is critical for handling events from different service versions during rolling
 * deployments and maintaining data integrity across version boundaries.
 */

import { IVersionedEvent, IEventMigrationRegistry, IEventSchemaRegistry } from '../interfaces/event-versioning.interface';
import {
  MigrationPath,
  MigrationFunction,
  MigrationOptions,
  MigrationResult,
  MigrationRegistry,
  isVersionedEvent
} from './types';
import { DEFAULT_MIGRATION_OPTIONS, ERROR_MESSAGES, MIGRATION_DIRECTION } from './constants';
import { MigrationError, SchemaValidationError, createMigrationError } from './errors';
import { compareVersions, parseVersion } from './compatibility-checker';
import { transformEvent } from './transformer';

/**
 * Creates a new migration registry
 * @returns A migration registry
 */
export function createMigrationRegistry(): MigrationRegistry {
  const paths: MigrationPath[] = [];
  
  return {
    paths,
    
    getPathsForSource(version: string): MigrationPath[] {
      return paths.filter(path => path.sourceVersion === version);
    },
    
    getPathsForTarget(version: string): MigrationPath[] {
      return paths.filter(path => path.targetVersion === version);
    },
    
    findDirectPath(source: string, target: string): MigrationPath | undefined {
      return paths.find(
        path => path.sourceVersion === source && path.targetVersion === target
      );
    },
    
    findPath(source: string, target: string, maxSteps: number = 5): MigrationPath[] | undefined {
      // If source and target are the same, no migration needed
      if (source === target) {
        return [];
      }
      
      // Try to find a direct path first
      const directPath = this.findDirectPath(source, target);
      if (directPath) {
        return [directPath];
      }
      
      // If no direct path, try to find a path with multiple steps
      return findMultiStepPath(this, source, target, maxSteps);
    }
  };
}

/**
 * Finds a multi-step migration path between two versions
 * @param registry The migration registry
 * @param source The source version
 * @param target The target version
 * @param maxSteps Maximum number of steps allowed
 * @returns Array of migration paths or undefined if no path found
 */
function findMultiStepPath(
  registry: MigrationRegistry,
  source: string,
  target: string,
  maxSteps: number
): MigrationPath[] | undefined {
  // Use breadth-first search to find the shortest path
  const queue: { path: MigrationPath[]; currentVersion: string }[] = [
    { path: [], currentVersion: source }
  ];
  
  // Keep track of visited versions to avoid cycles
  const visited = new Set<string>([source]);
  
  while (queue.length > 0) {
    const { path, currentVersion } = queue.shift()!;
    
    // If we've reached the maximum number of steps, skip this path
    if (path.length >= maxSteps) {
      continue;
    }
    
    // Get all paths from the current version
    const nextPaths = registry.getPathsForSource(currentVersion);
    
    for (const nextPath of nextPaths) {
      const nextVersion = nextPath.targetVersion;
      
      // If we've already visited this version, skip it
      if (visited.has(nextVersion)) {
        continue;
      }
      
      // Create a new path by appending the next step
      const newPath = [...path, nextPath];
      
      // If we've reached the target, return the path
      if (nextVersion === target) {
        return newPath;
      }
      
      // Otherwise, add the new path to the queue
      visited.add(nextVersion);
      queue.push({ path: newPath, currentVersion: nextVersion });
    }
  }
  
  // If we've exhausted all possibilities and haven't found a path, return undefined
  return undefined;
}

/**
 * Migrates an event from its current version to a target version
 * @param event The event to migrate
 * @param targetVersion The target version
 * @param registry The migration registry
 * @param options Migration options
 * @returns The migration result
 */
export function migrateEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  registry: MigrationRegistry,
  options: Partial<MigrationOptions> = {}
): MigrationResult<T> {
  // Validate input
  if (!event) {
    throw createMigrationError(
      ERROR_MESSAGES.MIGRATION.FAILED,
      { reason: 'Event cannot be null or undefined' }
    );
  }
  
  if (!isVersionedEvent(event)) {
    throw createMigrationError(
      ERROR_MESSAGES.MIGRATION.FAILED,
      { reason: 'Input is not a valid versioned event' }
    );
  }
  
  // If the event is already at the target version, return it as is
  if (event.version === targetVersion) {
    return {
      event: { ...event },
      originalVersion: event.version,
      newVersion: targetVersion,
      success: true
    };
  }
  
  // Merge default options with provided options
  const mergedOptions: MigrationOptions = { ...DEFAULT_MIGRATION_OPTIONS, ...options };
  
  // Find migration path
  const migrationPath = registry.findPath(
    event.version,
    targetVersion,
    mergedOptions.maxSteps
  );
  
  if (!migrationPath) {
    const errorMessage = ERROR_MESSAGES.MIGRATION.PATH_NOT_FOUND
      .replace('{sourceVersion}', event.version)
      .replace('{targetVersion}', targetVersion);
    
    throw createMigrationError(errorMessage, {
      sourceVersion: event.version,
      targetVersion,
      maxSteps: mergedOptions.maxSteps
    });
  }
  
  // Execute migration with transaction-like semantics
  try {
    // Create a deep copy of the event to avoid modifying the original
    let migratedEvent: T = JSON.parse(JSON.stringify(event));
    
    // Apply each migration step in sequence
    for (const step of migrationPath) {
      migratedEvent = step.migrationFn(migratedEvent);
      
      // Validate after each step if required
      if (mergedOptions.validateResult) {
        const isValid = validateMigratedEvent(migratedEvent, step.targetVersion);
        
        if (!isValid && mergedOptions.throwOnValidationError) {
          throw createMigrationError(
            ERROR_MESSAGES.MIGRATION.VALIDATION_FAILED
              .replace('{sourceVersion}', step.sourceVersion)
              .replace('{targetVersion}', step.targetVersion),
            {
              sourceVersion: step.sourceVersion,
              targetVersion: step.targetVersion,
              eventType: migratedEvent.type
            }
          );
        }
      }
    }
    
    return {
      event: migratedEvent,
      originalVersion: event.version,
      newVersion: targetVersion,
      path: migrationPath,
      success: true
    };
  } catch (error) {
    // If migration fails, throw a migration error with context
    if (error instanceof MigrationError) {
      throw error;
    } else {
      throw createMigrationError(
        ERROR_MESSAGES.MIGRATION.FAILED,
        {
          sourceVersion: event.version,
          targetVersion,
          originalError: error.message
        }
      );
    }
  }
}

/**
 * Validates a migrated event against its expected schema
 * @param event The event to validate
 * @param version The version to validate against
 * @returns Whether the event is valid
 */
function validateMigratedEvent<T extends IVersionedEvent>(
  event: T,
  version: string
): boolean {
  // In a real implementation, this would validate against a schema registry
  // For now, we'll do basic validation
  
  // Check that the event has the required fields for a versioned event
  if (!event.version || !event.type || !event.eventId) {
    return false;
  }
  
  // Check that the version matches the expected version
  if (event.version !== version) {
    return false;
  }
  
  // Additional validation could be performed here based on the event type and version
  
  return true;
}

/**
 * Class-based implementation of event migration registry
 * Provides an object-oriented approach to event migration
 */
export class EventMigrationRegistry implements IEventMigrationRegistry {
  private registry: MigrationRegistry;
  private schemaRegistry?: IEventSchemaRegistry;
  
  /**
   * Creates a new event migration registry
   * @param schemaRegistry Optional schema registry for validation
   */
  constructor(schemaRegistry?: IEventSchemaRegistry) {
    this.registry = createMigrationRegistry();
    this.schemaRegistry = schemaRegistry;
  }
  
  /**
   * Registers a migration from one version to another
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param migrationFn The migration function
   */
  registerMigration<T extends IVersionedEvent>(
    sourceVersion: string,
    targetVersion: string,
    migrationFn: (event: T) => T
  ): void {
    // Determine if this is an upgrade or downgrade
    const comparison = compareVersions(sourceVersion, targetVersion);
    const isUpgrade = comparison < 0;
    
    // Create the migration path
    const path: MigrationPath = {
      sourceVersion,
      targetVersion,
      migrationFn: migrationFn as MigrationFunction,
      isUpgrade
    };
    
    // Add the path to the registry
    this.registry.paths.push(path);
  }
  
  /**
   * Gets a migration function for a specific source and target version
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @returns The migration function or undefined if not found
   */
  getMigration<T extends IVersionedEvent>(
    sourceVersion: string,
    targetVersion: string
  ): ((event: T) => T) | undefined {
    const path = this.registry.findDirectPath(sourceVersion, targetVersion);
    return path ? (path.migrationFn as (event: T) => T) : undefined;
  }
  
  /**
   * Migrates an event from its current version to a target version
   * @param event The event to migrate
   * @param targetVersion The target version
   * @param options Migration options
   * @returns The migrated event
   */
  migrateEvent<T extends IVersionedEvent>(
    event: T,
    targetVersion: string,
    options: Partial<MigrationOptions> = {}
  ): T {
    const result = migrateEvent(event, targetVersion, this.registry, options);
    return result.event;
  }
  
  /**
   * Migrates an event with detailed result information
   * @param event The event to migrate
   * @param targetVersion The target version
   * @param options Migration options
   * @returns The migration result
   */
  migrateEventWithResult<T extends IVersionedEvent>(
    event: T,
    targetVersion: string,
    options: Partial<MigrationOptions> = {}
  ): MigrationResult<T> {
    return migrateEvent(event, targetVersion, this.registry, options);
  }
  
  /**
   * Registers a bidirectional migration between two versions
   * @param versionA First version
   * @param versionB Second version
   * @param upgradeFunction Function to migrate from older to newer version
   * @param downgradeFunction Function to migrate from newer to older version
   */
  registerBidirectionalMigration<T extends IVersionedEvent>(
    versionA: string,
    versionB: string,
    upgradeFunction: (event: T) => T,
    downgradeFunction: (event: T) => T
  ): void {
    const comparison = compareVersions(versionA, versionB);
    
    if (comparison < 0) {
      // versionA is older than versionB
      this.registerMigration(versionA, versionB, upgradeFunction);
      this.registerMigration(versionB, versionA, downgradeFunction);
    } else if (comparison > 0) {
      // versionA is newer than versionB
      this.registerMigration(versionA, versionB, downgradeFunction);
      this.registerMigration(versionB, versionA, upgradeFunction);
    }
    // If versions are equal, no migration needed
  }
  
  /**
   * Registers a migration for a specific event type
   * @param eventType The event type
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param migrationFn The migration function
   */
  registerEventTypeMigration<T extends IVersionedEvent>(
    eventType: string,
    sourceVersion: string,
    targetVersion: string,
    migrationFn: (event: T) => T
  ): void {
    this.registerMigration(
      sourceVersion,
      targetVersion,
      (event: T) => {
        if (event.type === eventType) {
          return migrationFn(event);
        }
        return event;
      }
    );
  }
  
  /**
   * Finds all possible migration paths from a source version
   * @param sourceVersion The source version
   * @returns Array of migration paths
   */
  findPossibleMigrations(sourceVersion: string): MigrationPath[] {
    return this.registry.getPathsForSource(sourceVersion);
  }
  
  /**
   * Finds the shortest migration path between two versions
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param maxSteps Maximum number of steps allowed
   * @returns Array of migration paths or undefined if no path found
   */
  findMigrationPath(
    sourceVersion: string,
    targetVersion: string,
    maxSteps: number = DEFAULT_MIGRATION_OPTIONS.maxSteps
  ): MigrationPath[] | undefined {
    return this.registry.findPath(sourceVersion, targetVersion, maxSteps);
  }
  
  /**
   * Validates an event against its schema
   * @param event The event to validate
   * @returns Whether the event is valid
   */
  validateEvent<T extends IVersionedEvent>(event: T): boolean {
    if (this.schemaRegistry) {
      return this.schemaRegistry.validate(event);
    }
    
    return validateMigratedEvent(event, event.version);
  }
  
  /**
   * Executes a migration with transaction-like semantics
   * @param event The event to migrate
   * @param targetVersion The target version
   * @param options Migration options
   * @returns The migrated event
   * @throws {MigrationError} If migration fails
   */
  executeTransaction<T extends IVersionedEvent>(
    event: T,
    targetVersion: string,
    options: Partial<MigrationOptions> = {}
  ): T {
    // Create a deep copy of the event to avoid modifying the original
    const originalEvent: T = JSON.parse(JSON.stringify(event));
    
    try {
      // Attempt the migration
      const result = this.migrateEventWithResult(event, targetVersion, options);
      return result.event;
    } catch (error) {
      // If migration fails, log the error and return the original event
      console.error('Migration failed, rolling back:', error);
      
      // In a real implementation, you might want to emit an event or log the rollback
      console.info('Rolled back to original event version:', originalEvent.version);
      
      // Re-throw the error with rollback information
      if (error instanceof MigrationError) {
        throw new MigrationError(
          ERROR_MESSAGES.MIGRATION.ROLLBACK_FAILED
            .replace('{sourceVersion}', event.version)
            .replace('{targetVersion}', targetVersion)
            .replace('{originalError}', error.message)
            .replace('{rollbackError}', 'Rollback successful'),
          { ...error.context, rolledBack: true }
        );
      } else {
        throw createMigrationError(
          ERROR_MESSAGES.MIGRATION.ROLLBACK_FAILED
            .replace('{sourceVersion}', event.version)
            .replace('{targetVersion}', targetVersion)
            .replace('{originalError}', error.message)
            .replace('{rollbackError}', 'Rollback successful'),
          { originalError: error.message, rolledBack: true }
        );
      }
    }
  }
  
  /**
   * Gets all registered migration paths
   * @returns Array of all migration paths
   */
  getAllMigrationPaths(): MigrationPath[] {
    return [...this.registry.paths];
  }
  
  /**
   * Clears all registered migrations
   */
  clearMigrations(): void {
    this.registry.paths = [];
  }
  
  /**
   * Sets the schema registry for validation
   * @param schemaRegistry The schema registry to use
   */
  setSchemaRegistry(schemaRegistry: IEventSchemaRegistry): void {
    this.schemaRegistry = schemaRegistry;
  }
  
  /**
   * Creates a migration function that transforms an event using the transformer
   * @param targetVersion The target version
   * @param options Transformation options
   * @returns A migration function
   */
  createTransformerMigration<T extends IVersionedEvent>(
    targetVersion: string,
    options?: Parameters<typeof transformEvent>[2]
  ): (event: T) => T {
    return (event: T) => transformEvent(event, targetVersion, options);
  }
  
  /**
   * Registers a migration using the transformer
   * @param sourceVersion The source version
   * @param targetVersion The target version
   * @param options Transformation options
   */
  registerTransformerMigration<T extends IVersionedEvent>(
    sourceVersion: string,
    targetVersion: string,
    options?: Parameters<typeof transformEvent>[2]
  ): void {
    this.registerMigration(
      sourceVersion,
      targetVersion,
      this.createTransformerMigration(targetVersion, options)
    );
  }
}

/**
 * Creates a migration function that applies a field mapping
 * @param fieldMappings Object mapping source fields to target fields
 * @returns A migration function
 */
export function createFieldMappingMigration<T extends IVersionedEvent>(
  fieldMappings: Record<string, string>,
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // Create a deep copy of the event
    const result: any = JSON.parse(JSON.stringify(event));
    
    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(fieldMappings)) {
      if (sourceField in result && sourceField !== targetField) {
        result[targetField] = result[sourceField];
        
        // Remove the source field if it's different from the target field
        if (sourceField !== targetField) {
          delete result[sourceField];
        }
      }
    }
    
    // Update the version
    result.version = targetVersion;
    
    return result as T;
  };
}

/**
 * Creates a migration function that applies a field transformation
 * @param fieldTransformers Object mapping field names to transformer functions
 * @param targetVersion The target version
 * @returns A migration function
 */
export function createFieldTransformerMigration<T extends IVersionedEvent>(
  fieldTransformers: Record<string, (value: any, event: T) => any>,
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // Create a deep copy of the event
    const result: any = JSON.parse(JSON.stringify(event));
    
    // Apply field transformers
    for (const [field, transformer] of Object.entries(fieldTransformers)) {
      if (field in result) {
        try {
          result[field] = transformer(result[field], result);
        } catch (error) {
          throw createMigrationError(
            `Failed to transform field "${field}": ${error.message}`,
            {
              field,
              sourceVersion: event.version,
              targetVersion,
              error: error.message
            }
          );
        }
      }
    }
    
    // Update the version
    result.version = targetVersion;
    
    return result as T;
  };
}

/**
 * Creates a migration function that adds new fields with default values
 * @param newFields Object mapping field names to default values
 * @param targetVersion The target version
 * @returns A migration function
 */
export function createAddFieldsMigration<T extends IVersionedEvent>(
  newFields: Record<string, any>,
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // Create a deep copy of the event
    const result: any = JSON.parse(JSON.stringify(event));
    
    // Add new fields
    for (const [field, defaultValue] of Object.entries(newFields)) {
      if (!(field in result)) {
        result[field] = defaultValue;
      }
    }
    
    // Update the version
    result.version = targetVersion;
    
    return result as T;
  };
}

/**
 * Creates a migration function that removes fields
 * @param fieldsToRemove Array of field names to remove
 * @param targetVersion The target version
 * @returns A migration function
 */
export function createRemoveFieldsMigration<T extends IVersionedEvent>(
  fieldsToRemove: string[],
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // Create a deep copy of the event
    const result: any = JSON.parse(JSON.stringify(event));
    
    // Remove fields
    for (const field of fieldsToRemove) {
      if (field in result) {
        delete result[field];
      }
    }
    
    // Update the version
    result.version = targetVersion;
    
    return result as T;
  };
}

/**
 * Creates a migration function that combines multiple migrations
 * @param migrations Array of migration functions to apply in sequence
 * @param targetVersion The target version
 * @returns A migration function
 */
export function createCompositeMigration<T extends IVersionedEvent>(
  migrations: Array<(event: T) => T>,
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // Apply each migration in sequence
    let result = event;
    
    for (const migration of migrations) {
      result = migration(result);
    }
    
    // Ensure the version is set correctly
    const finalResult: any = result;
    finalResult.version = targetVersion;
    
    return finalResult as T;
  };
}

/**
 * Creates a migration function for a specific event type
 * @param eventType The event type to apply the migration to
 * @param migrationFn The migration function to apply
 * @returns A migration function that only applies to the specified event type
 */
export function createEventTypeMigration<T extends IVersionedEvent>(
  eventType: string,
  migrationFn: (event: T) => T
): (event: T) => T {
  return (event: T) => {
    if (event.type === eventType) {
      return migrationFn(event);
    }
    return event;
  };
}

/**
 * Creates a migration function that applies a schema transformation
 * @param schema The target schema
 * @param targetVersion The target version
 * @returns A migration function
 */
export function createSchemaMigration<T extends IVersionedEvent>(
  schema: Record<string, any>,
  targetVersion: string
): (event: T) => T {
  return (event: T) => {
    // In a real implementation, this would use the schema to transform the event
    // For now, we'll just update the version
    const result: any = JSON.parse(JSON.stringify(event));
    result.version = targetVersion;
    return result as T;
  };
}