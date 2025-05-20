/**
 * @file version.dto.ts
 * @description Implements event schema versioning support through a specialized DTO that wraps
 * any event payload with version metadata. This file provides the infrastructure for graceful
 * schema evolution, enabling backward compatibility with older event versions while allowing
 * new fields and validation rules to be introduced over time.
 *
 * Example usage:
 * 
 * ```typescript
 * // Register a migration from version 1.0.0 to 1.1.0 for the 'USER_CREATED' event
 * registerVersionMigration<UserCreatedEvent>(
 *   'USER_CREATED',
 *   '1.0.0',
 *   '1.1.0',
 *   (oldData) => {
 *     // Transform the old data format to the new format
 *     return {
 *       ...oldData,
 *       // Add the new field with a default value
 *       preferredLanguage: 'pt-BR'
 *     };
 *   }
 * );
 * 
 * // Create a versioned event
 * const userCreatedEvent = createVersionedEvent('USER_CREATED', {
 *   userId: '123',
 *   email: 'user@example.com'
 * });
 * 
 * // Migrate to the latest version if needed
 * const latestVersion = getLatestVersion('USER_CREATED');
 * if (!userCreatedEvent.isCompatibleWith(latestVersion)) {
 *   const migratedEvent = userCreatedEvent.migrateToVersion(latestVersion);
 *   // Process the migrated event
 * }
 * ```
 *
 * @module events/dto
 */

import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { EventVersionDto } from './event-metadata.dto';

/**
 * Interface for version migration functions that can transform
 * an older version of an event payload to a newer version.
 * 
 * Migration functions are responsible for transforming event payloads
 * from one version to another. They should handle all necessary changes
 * to the payload structure, including adding new fields, removing deprecated
 * fields, and transforming existing fields to new formats.
 * 
 * @template T The type of the transformed event payload
 */
export type VersionMigrationFn<T = any> = (oldData: any) => T;

/**
 * Registry of version migration functions for different event types.
 * Maps event types to their respective version migration functions.
 * 
 * The registry is structured as follows:
 * {
 *   [eventType]: {
 *     '1.0.0->1.1.0': (oldData) => transformedData,
 *     '1.1.0->2.0.0': (oldData) => transformedData,
 *     // ... more migrations
 *   },
 *   // ... more event types
 * }
 * 
 * This structure allows the system to find and apply the appropriate
 * migration functions for a given event type and version transition.
 */
export const versionMigrations: Record<string, Record<string, VersionMigrationFn>> = {};

/**
 * Registers a migration function for a specific event type and version.
 * 
 * @param eventType The type of event this migration applies to
 * @param fromVersion The source version in 'major.minor.patch' format
 * @param toVersion The target version in 'major.minor.patch' format
 * @param migrationFn The function that transforms the data from the old version to the new version
 */
export function registerVersionMigration<T = any>(
  eventType: string,
  fromVersion: string,
  toVersion: string,
  migrationFn: VersionMigrationFn<T>,
): void {
  if (!versionMigrations[eventType]) {
    versionMigrations[eventType] = {};
  }
  
  const migrationKey = `${fromVersion}->${toVersion}`;
  versionMigrations[eventType][migrationKey] = migrationFn;
}

/**
 * Compares two semantic version strings.
 * 
 * @param version1 First version in 'major.minor.patch' format
 * @param version2 Second version in 'major.minor.patch' format
 * @returns -1 if version1 < version2, 0 if version1 === version2, 1 if version1 > version2
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }
  
  return 0;
}

/**
 * Determines if a version is compatible with a required version.
 * 
 * @param currentVersion The current version in 'major.minor.patch' format
 * @param requiredVersion The required version in 'major.minor.patch' format
 * @returns True if the current version is compatible with the required version
 */
export function isVersionCompatible(currentVersion: string, requiredVersion: string): boolean {
  const current = currentVersion.split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);
  
  // Major version must match exactly
  if (current[0] !== required[0]) return false;
  
  // Current minor version must be greater than or equal to required
  if (current[1] < required[1]) return false;
  
  // If minor versions match, current patch must be greater than or equal to required
  if (current[1] === required[1] && current[2] < required[2]) return false;
  
  return true;
}

/**
 * Data Transfer Object that wraps any event payload with version information.
 * This enables graceful schema evolution and backward compatibility.
 * 
 * The VersionedEventDto serves as a container for event payloads, adding version
 * metadata that allows the system to handle different versions of the same event type.
 * This is critical for maintaining backward compatibility as the system evolves.
 * 
 * Key features:
 * - Wraps any event payload with version information
 * - Provides methods to check version compatibility
 * - Supports migration between versions using registered migration functions
 * - Enables graceful schema evolution over time
 * 
 * @template T The type of the event payload
 */
export class VersionedEventDto<T = any> {
  /**
   * The type of the event, used to determine the appropriate validation and migration rules.
   */
  @IsString()
  @IsNotEmpty()
  eventType: string;
  
  /**
   * Version information for the event schema.
   */
  @IsObject()
  @ValidateNested()
  @Type(() => EventVersionDto)
  version: EventVersionDto;
  
  /**
   * The actual event payload data.
   */
  @IsObject()
  payload: T;
  
  /**
   * Creates a new versioned event DTO.
   * 
   * @param eventType The type of the event
   * @param payload The event payload
   * @param version Optional version information (defaults to 1.0.0)
   */
  constructor(eventType: string, payload: T, version?: EventVersionDto) {
    this.eventType = eventType;
    this.payload = payload;
    this.version = version || new EventVersionDto();
  }
  
  /**
   * Gets the full version string in semver format.
   */
  getVersionString(): string {
    return this.version.toString();
  }
  
  /**
   * Checks if this event version is compatible with the required version.
   * 
   * @param requiredVersion The required version in 'major.minor.patch' format
   * @returns True if this event is compatible with the required version
   */
  isCompatibleWith(requiredVersion: string): boolean {
    return isVersionCompatible(this.getVersionString(), requiredVersion);
  }
  
  /**
   * Migrates this event to the target version if a migration path exists.
   * 
   * @param targetVersion The target version to migrate to
   * @returns A new VersionedEventDto with the migrated payload, or this instance if no migration is needed
   * @throws Error if no migration path exists
   */
  migrateToVersion(targetVersion: string): VersionedEventDto<T> {
    const currentVersion = this.getVersionString();
    
    // If already at the target version, return this instance
    if (currentVersion === targetVersion) {
      return this;
    }
    
    // If no migrations exist for this event type, throw an error
    if (!versionMigrations[this.eventType]) {
      throw new Error(`No migrations registered for event type: ${this.eventType}`);
    }
    
    // Check if a direct migration exists
    const directMigrationKey = `${currentVersion}->${targetVersion}`;
    if (versionMigrations[this.eventType][directMigrationKey]) {
      const migratedPayload = versionMigrations[this.eventType][directMigrationKey](this.payload);
      
      // Create a new versioned event with the migrated payload and target version
      const targetVersionParts = targetVersion.split('.');
      const newVersion = new EventVersionDto();
      newVersion.major = targetVersionParts[0];
      newVersion.minor = targetVersionParts[1];
      newVersion.patch = targetVersionParts[2];
      
      return new VersionedEventDto(this.eventType, migratedPayload, newVersion);
    }
    
    // If no direct migration exists, try to find a migration path
    const migrationPath = this.findMigrationPath(currentVersion, targetVersion);
    
    if (migrationPath && migrationPath.length > 0) {
      // Apply each migration in the path sequentially
      let currentPayload = this.payload;
      let currentVersionStr = currentVersion;
      
      for (const step of migrationPath) {
        const [fromVersion, toVersion] = step.split('->');
        const migrationKey = `${fromVersion}->${toVersion}`;
        
        if (!versionMigrations[this.eventType][migrationKey]) {
          throw new Error(`Missing migration function for step ${migrationKey} in event type: ${this.eventType}`);
        }
        
        currentPayload = versionMigrations[this.eventType][migrationKey](currentPayload);
        currentVersionStr = toVersion;
      }
      
      // Create a new versioned event with the final migrated payload and target version
      const targetVersionParts = targetVersion.split('.');
      const newVersion = new EventVersionDto();
      newVersion.major = targetVersionParts[0];
      newVersion.minor = targetVersionParts[1];
      newVersion.patch = targetVersionParts[2];
      
      return new VersionedEventDto(this.eventType, currentPayload, newVersion);
    }
    
    // If no migration path exists, throw an error
    throw new Error(
      `No migration path exists from version ${currentVersion} to ${targetVersion} for event type: ${this.eventType}`
    );
  }
  
  /**
   * Finds a migration path from the current version to the target version.
   * Uses a breadth-first search algorithm to find the shortest path.
   * 
   * @param fromVersion The starting version
   * @param toVersion The target version
   * @returns An array of migration steps, or null if no path exists
   * @private
   */
  private findMigrationPath(fromVersion: string, toVersion: string): string[] | null {
    // If no migrations exist for this event type, return null
    if (!versionMigrations[this.eventType]) {
      return null;
    }
    
    // Get all available migrations for this event type
    const availableMigrations = Object.keys(versionMigrations[this.eventType]);
    
    // Build a graph of available migrations
    const graph: Record<string, string[]> = {};
    
    for (const migration of availableMigrations) {
      const [from, to] = migration.split('->');
      
      if (!graph[from]) {
        graph[from] = [];
      }
      
      graph[from].push(to);
    }
    
    // Use breadth-first search to find the shortest path
    const queue: Array<{ version: string; path: string[] }> = [
      { version: fromVersion, path: [] }
    ];
    const visited = new Set<string>();
    
    while (queue.length > 0) {
      const { version, path } = queue.shift()!;
      
      if (version === toVersion) {
        return path;
      }
      
      if (visited.has(version)) {
        continue;
      }
      
      visited.add(version);
      
      // Add all neighbors to the queue
      if (graph[version]) {
        for (const neighbor of graph[version]) {
          const newPath = [...path, `${version}->${neighbor}`];
          queue.push({ version: neighbor, path: newPath });
        }
      }
    }
    
    // If no path is found, return null
    return null;
  }
}

/**
 * Factory function to create a versioned event DTO with the current version (1.0.0).
 * 
 * @param eventType The type of the event
 * @param payload The event payload
 * @returns A new VersionedEventDto instance
 */
export function createVersionedEvent<T>(eventType: string, payload: T): VersionedEventDto<T> {
  return new VersionedEventDto(eventType, payload);
}

/**
 * Upgrades an event payload to the latest version using registered migrations.
 * 
 * @param eventType The type of the event
 * @param payload The event payload
 * @param currentVersion The current version of the payload
 * @param targetVersion The target version to upgrade to
 * @returns The upgraded payload
 * @throws Error if no migration path exists
 */
export function upgradeEventPayload<T>(
  eventType: string,
  payload: any,
  currentVersion: string,
  targetVersion: string
): T {
  // Create a versioned event with the current version
  const versionParts = currentVersion.split('.');
  const version = new EventVersionDto();
  version.major = versionParts[0];
  version.minor = versionParts[1];
  version.patch = versionParts[2];
  
  const versionedEvent = new VersionedEventDto<any>(eventType, payload, version);
  
  // Migrate to the target version
  const migratedEvent = versionedEvent.migrateToVersion(targetVersion);
  
  // Return the migrated payload
  return migratedEvent.payload as T;
}

/**
 * Creates a version object from a version string.
 * 
 * @param versionStr The version string in 'major.minor.patch' format
 * @returns A new EventVersionDto instance
 */
export function createVersionFromString(versionStr: string): EventVersionDto {
  const versionParts = versionStr.split('.');
  const version = new EventVersionDto();
  
  if (versionParts.length >= 1) {
    version.major = versionParts[0];
  }
  
  if (versionParts.length >= 2) {
    version.minor = versionParts[1];
  }
  
  if (versionParts.length >= 3) {
    version.patch = versionParts[2];
  }
  
  return version;
}

/**
 * Gets the latest registered version for a specific event type.
 * 
 * @param eventType The type of event to check
 * @returns The latest version string, or '1.0.0' if no migrations are registered
 */
export function getLatestVersion(eventType: string): string {
  if (!versionMigrations[eventType]) {
    return '1.0.0';
  }
  
  const migrations = Object.keys(versionMigrations[eventType]);
  let latestVersion = '1.0.0';
  
  for (const migration of migrations) {
    const [, toVersion] = migration.split('->');
    
    if (compareVersions(toVersion, latestVersion) > 0) {
      latestVersion = toVersion;
    }
  }
  
  return latestVersion;
}

/**
 * Checks if a migration path exists between two versions for a specific event type.
 * 
 * @param eventType The type of event to check
 * @param fromVersion The starting version
 * @param toVersion The target version
 * @returns True if a migration path exists, false otherwise
 */
export function canMigrate(eventType: string, fromVersion: string, toVersion: string): boolean {
  try {
    // Create a temporary versioned event to use the findMigrationPath method
    const tempVersion = createVersionFromString(fromVersion);
    const tempEvent = new VersionedEventDto(eventType, {}, tempVersion);
    
    // Use the private method via any type assertion
    const path = (tempEvent as any).findMigrationPath(fromVersion, toVersion);
    
    return path !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Registers a chain of migrations for a specific event type.
 * This is a convenience function for registering multiple migrations at once.
 * 
 * @param eventType The type of event these migrations apply to
 * @param migrations An array of migration objects with fromVersion, toVersion, and migrationFn
 */
export function registerMigrationChain<T = any>(
  eventType: string,
  migrations: Array<{
    fromVersion: string;
    toVersion: string;
    migrationFn: VersionMigrationFn<T>;
  }>
): void {
  for (const migration of migrations) {
    registerVersionMigration(
      eventType,
      migration.fromVersion,
      migration.toVersion,
      migration.migrationFn
    );
  }
}