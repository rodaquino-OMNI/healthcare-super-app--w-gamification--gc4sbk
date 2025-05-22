/**
 * @file schema-migrator.ts
 * @description Implements migration utilities to transform events between different schema versions,
 * ensuring backward and forward compatibility as event schemas evolve. Provides a registry for
 * migration paths, automatic migration execution, and validation of migration results.
 */

import { IVersionedEvent } from '../interfaces';
import {
  EventTransformer,
  MigrationPath,
  MigrationRegistryConfig,
  MigrationResult,
  SchemaValidator,
  TransformDirection,
  TransformOptions,
  isVersionedEvent
} from './types';
import {
  DEFAULT_MIGRATION_REGISTRY_CONFIG,
  DEFAULT_TRANSFORM_OPTIONS,
  ERROR_TEMPLATES,
  LATEST_VERSION,
  MAX_TRANSFORMATION_STEPS,
  MINIMUM_SUPPORTED_VERSION,
  SUPPORTED_VERSIONS,
  VERSION_FORMAT_REGEX
} from './constants';
import { VersioningError, MigrationError, ValidationError } from './errors';

/**
 * Parses a semantic version string into its components.
 * 
 * @param version - The version string to parse (e.g., "1.2.3")
 * @returns An object with major, minor, and patch numbers
 * @throws {VersioningError} If the version format is invalid
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const match = version.match(VERSION_FORMAT_REGEX);
  if (!match) {
    throw new VersioningError(
      ERROR_TEMPLATES.INVALID_VERSION_FORMAT
        .replace('{version}', version)
        .replace('{expectedFormat}', 'major.minor.patch')
    );
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10)
  };
}

/**
 * Compares two version strings to determine their order.
 * 
 * @param versionA - First version to compare
 * @param versionB - Second version to compare
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
function compareVersions(versionA: string, versionB: string): number {
  const a = parseVersion(versionA);
  const b = parseVersion(versionB);

  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;
  return 0;
}

/**
 * Validates if a version is supported by the system.
 * 
 * @param version - The version to validate
 * @returns True if the version is supported, false otherwise
 */
function isVersionSupported(version: string): boolean {
  if (!VERSION_FORMAT_REGEX.test(version)) return false;
  if (compareVersions(version, MINIMUM_SUPPORTED_VERSION) < 0) return false;
  return SUPPORTED_VERSIONS.includes(version);
}

/**
 * MigrationRegistry manages migration paths between different event schema versions.
 * It provides methods to register migrations, find migration paths, and execute migrations
 * with validation against target schemas.
 */
export class MigrationRegistry {
  private migrations: Map<string, MigrationPath[]> = new Map();
  private validators: Map<string, SchemaValidator> = new Map();
  private config: MigrationRegistryConfig;

  /**
   * Creates a new MigrationRegistry instance.
   * 
   * @param config - Configuration options for the registry
   */
  constructor(config: Partial<MigrationRegistryConfig> = {}) {
    this.config = { ...DEFAULT_MIGRATION_REGISTRY_CONFIG, ...config };
  }

  /**
   * Registers a schema validator for a specific version.
   * 
   * @param version - The version to register the validator for
   * @param validator - The validator function
   * @returns The registry instance for chaining
   */
  registerValidator(version: string, validator: SchemaValidator): MigrationRegistry {
    if (!isVersionSupported(version)) {
      throw new VersioningError(
        ERROR_TEMPLATES.VERSION_NOT_SUPPORTED
          .replace('{version}', version)
          .replace('{supportedVersions}', SUPPORTED_VERSIONS.join(', '))
      );
    }

    this.validators.set(version, validator);
    return this;
  }

  /**
   * Registers a migration path between two versions.
   * 
   * @param sourceVersion - The source version
   * @param targetVersion - The target version
   * @param transformer - The transformer function to convert between versions
   * @returns The registry instance for chaining
   */
  registerMigration(
    sourceVersion: string,
    targetVersion: string,
    transformer: EventTransformer
  ): MigrationRegistry {
    if (!isVersionSupported(sourceVersion)) {
      throw new VersioningError(
        ERROR_TEMPLATES.VERSION_NOT_SUPPORTED
          .replace('{version}', sourceVersion)
          .replace('{supportedVersions}', SUPPORTED_VERSIONS.join(', '))
      );
    }

    if (!isVersionSupported(targetVersion)) {
      throw new VersioningError(
        ERROR_TEMPLATES.VERSION_NOT_SUPPORTED
          .replace('{version}', targetVersion)
          .replace('{supportedVersions}', SUPPORTED_VERSIONS.join(', '))
      );
    }

    // Store migration path
    const migrationPath: MigrationPath = {
      sourceVersion,
      targetVersion,
      transformer
    };

    // Get existing migrations for this source version or create a new array
    const existingMigrations = this.migrations.get(sourceVersion) || [];
    
    // Check if this migration path already exists
    const existingIndex = existingMigrations.findIndex(
      m => m.targetVersion === targetVersion
    );

    if (existingIndex >= 0) {
      // Replace existing migration
      existingMigrations[existingIndex] = migrationPath;
    } else {
      // Add new migration
      existingMigrations.push(migrationPath);
    }

    this.migrations.set(sourceVersion, existingMigrations);
    return this;
  }

  /**
   * Finds the shortest migration path between two versions.
   * 
   * @param sourceVersion - The source version
   * @param targetVersion - The target version
   * @returns An array of migration paths representing the shortest path
   * @throws {MigrationError} If no migration path is found
   */
  findMigrationPath(sourceVersion: string, targetVersion: string): MigrationPath[] {
    // If source and target are the same, no migration needed
    if (sourceVersion === targetVersion) {
      return [];
    }

    // Check if downgrade is allowed
    const isDowngrade = compareVersions(sourceVersion, targetVersion) > 0;
    if (isDowngrade && !this.config.allowDowngrade) {
      throw new MigrationError(
        ERROR_TEMPLATES.DOWNGRADE_NOT_ALLOWED
          .replace('{sourceVersion}', sourceVersion)
          .replace('{targetVersion}', targetVersion)
      );
    }

    // Use breadth-first search to find the shortest path
    const queue: { version: string; path: MigrationPath[] }[] = [
      { version: sourceVersion, path: [] }
    ];
    const visited = new Set<string>([sourceVersion]);

    while (queue.length > 0) {
      const { version, path } = queue.shift()!;

      // Get all possible migrations from this version
      const possibleMigrations = this.migrations.get(version) || [];

      for (const migration of possibleMigrations) {
        const nextVersion = migration.targetVersion;

        // If we've found a path to the target version, return it
        if (nextVersion === targetVersion) {
          return [...path, migration];
        }

        // If we haven't visited this version yet, add it to the queue
        if (!visited.has(nextVersion)) {
          visited.add(nextVersion);
          queue.push({
            version: nextVersion,
            path: [...path, migration]
          });
        }
      }
    }

    // If we get here, no path was found
    throw new MigrationError(
      ERROR_TEMPLATES.NO_MIGRATION_PATH
        .replace('{sourceVersion}', sourceVersion)
        .replace('{targetVersion}', targetVersion)
        .replace('{eventType}', 'unknown')
    );
  }

  /**
   * Validates an event against a schema for a specific version.
   * 
   * @param event - The event to validate
   * @param version - The version to validate against
   * @returns True if the event is valid, false otherwise
   */
  validateEvent(event: unknown, version: string): boolean {
    const validator = this.validators.get(version);
    if (!validator) {
      // If no validator is registered for this version, assume it's valid
      return true;
    }

    return validator(event, version);
  }

  /**
   * Migrates an event from its current version to the target version.
   * 
   * @param event - The event to migrate
   * @param targetVersion - The target version to migrate to
   * @param options - Options for the migration
   * @returns The result of the migration
   */
  migrateEvent<T extends IVersionedEvent>(
    event: T,
    targetVersion: string = LATEST_VERSION,
    options: Partial<TransformOptions> = {}
  ): MigrationResult<T> {
    // Ensure the event is a versioned event
    if (!isVersionedEvent(event)) {
      return {
        success: false,
        error: new ValidationError('Event is not a valid versioned event')
      };
    }

    // If the event is already at the target version, return it
    if (event.version === targetVersion) {
      return { success: true, event };
    }

    const sourceVersion = event.version;
    const transformOptions: TransformOptions = {
      ...DEFAULT_TRANSFORM_OPTIONS,
      ...options,
      direction: compareVersions(sourceVersion, targetVersion) < 0 
        ? TransformDirection.UPGRADE 
        : TransformDirection.DOWNGRADE
    };

    try {
      // Find the migration path
      const migrationPath = this.findMigrationPath(sourceVersion, targetVersion);
      
      // If no migrations are needed, return the original event
      if (migrationPath.length === 0) {
        return { success: true, event };
      }

      // Check if the migration path is too long
      if (migrationPath.length > MAX_TRANSFORMATION_STEPS) {
        return {
          success: false,
          error: new MigrationError(
            `Migration path from ${sourceVersion} to ${targetVersion} is too long (${migrationPath.length} steps)`
          )
        };
      }

      // Apply migrations in sequence
      let currentEvent = event;
      const migrationSteps: string[] = [sourceVersion];

      for (const migration of migrationPath) {
        // Apply the transformation
        currentEvent = migration.transformer(currentEvent, transformOptions) as T;
        migrationSteps.push(migration.targetVersion);

        // Validate the result if required
        if (transformOptions.validateResult && !this.validateEvent(currentEvent, migration.targetVersion)) {
          return {
            success: false,
            error: new ValidationError(
              ERROR_TEMPLATES.VALIDATION_FAILED.replace('{targetVersion}', migration.targetVersion)
            ),
            migrationPath: migrationSteps
          };
        }

        // Ensure the version was updated correctly
        if (currentEvent.version !== migration.targetVersion) {
          currentEvent = { ...currentEvent, version: migration.targetVersion } as T;
        }
      }

      return {
        success: true,
        event: currentEvent,
        migrationPath: migrationSteps
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error 
          ? error 
          : new MigrationError(`Unknown error during migration: ${error}`)
      };
    }
  }

  /**
   * Migrates an event to the latest supported version.
   * 
   * @param event - The event to migrate
   * @param options - Options for the migration
   * @returns The result of the migration
   */
  migrateToLatest<T extends IVersionedEvent>(
    event: T,
    options: Partial<TransformOptions> = {}
  ): MigrationResult<T> {
    return this.migrateEvent(event, LATEST_VERSION, options);
  }

  /**
   * Attempts to migrate an event with transaction-like semantics.
   * If the migration fails at any point, the original event is returned.
   * 
   * @param event - The event to migrate
   * @param targetVersion - The target version to migrate to
   * @param options - Options for the migration
   * @returns The migrated event or the original event if migration fails
   */
  safeMigrate<T extends IVersionedEvent>(
    event: T,
    targetVersion: string = LATEST_VERSION,
    options: Partial<TransformOptions> = {}
  ): T {
    const result = this.migrateEvent(event, targetVersion, options);
    return result.success ? result.event! : event;
  }

  /**
   * Gets all registered migration paths.
   * 
   * @returns A map of all registered migration paths
   */
  getAllMigrationPaths(): Map<string, MigrationPath[]> {
    return new Map(this.migrations);
  }

  /**
   * Gets all supported versions.
   * 
   * @returns An array of all supported versions
   */
  getSupportedVersions(): string[] {
    return [...SUPPORTED_VERSIONS];
  }

  /**
   * Clears all registered migrations and validators.
   * 
   * @returns The registry instance for chaining
   */
  clear(): MigrationRegistry {
    this.migrations.clear();
    this.validators.clear();
    return this;
  }
}

/**
 * Creates a default migration registry with common migrations pre-registered.
 * 
 * @param config - Configuration options for the registry
 * @returns A pre-configured migration registry
 */
export function createDefaultMigrationRegistry(
  config: Partial<MigrationRegistryConfig> = {}
): MigrationRegistry {
  const registry = new MigrationRegistry(config);
  
  // Register migrations between consecutive versions
  for (let i = 0; i < SUPPORTED_VERSIONS.length - 1; i++) {
    const sourceVersion = SUPPORTED_VERSIONS[i];
    const targetVersion = SUPPORTED_VERSIONS[i + 1];
    
    // Register an identity transformer as a fallback
    // This should be replaced with actual transformers in a real implementation
    registry.registerMigration(sourceVersion, targetVersion, event => ({
      ...event,
      version: targetVersion
    }));
    
    // Register a downgrade path if allowed
    if (config.allowDowngrade) {
      registry.registerMigration(targetVersion, sourceVersion, event => ({
        ...event,
        version: sourceVersion
      }));
    }
  }
  
  return registry;
}

/**
 * Default instance of the migration registry for convenience.
 */
export const defaultMigrationRegistry = createDefaultMigrationRegistry();