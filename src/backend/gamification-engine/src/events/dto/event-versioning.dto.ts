import { IsNotEmpty, IsString, IsObject, IsOptional, IsEnum, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import interfaces from @austa/interfaces package
try {
  // Using dynamic import to handle potential missing package during development
  require('@austa/interfaces/gamification/events');
} catch (error) {
  // Package not available, will use local interfaces
  console.warn('Warning: @austa/interfaces package not found, using local interfaces');
}

// Import local ProcessEventDto
import { ProcessEventDto } from './process-event.dto';

/**
 * Semantic version format for event versioning
 * Format: MAJOR.MINOR.PATCH (e.g., 1.0.0)
 * - MAJOR: Breaking changes that require migration
 * - MINOR: Backward-compatible feature additions
 * - PATCH: Backward-compatible bug fixes
 */
export class EventVersionDto {
  /**
   * Major version number - incremented for breaking changes
   * @example 1
   */
  @IsNotEmpty()
  major: number;

  /**
   * Minor version number - incremented for non-breaking feature additions
   * @example 0
   */
  @IsNotEmpty()
  minor: number;

  /**
   * Patch version number - incremented for bug fixes
   * @example 0
   */
  @IsNotEmpty()
  patch: number;

  /**
   * Creates a string representation of the version
   * @returns Version string in format MAJOR.MINOR.PATCH
   */
  toString(): string {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  /**
   * Creates an EventVersionDto from a version string
   * @param versionStr Version string in format MAJOR.MINOR.PATCH
   * @returns EventVersionDto instance
   * @throws Error if the version string is invalid
   */
  static fromString(versionStr: string): EventVersionDto {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;
    const match = versionStr.match(versionRegex);
    
    if (!match) {
      throw new Error(`Invalid version format: ${versionStr}. Expected format: MAJOR.MINOR.PATCH`);
    }
    
    const version = new EventVersionDto();
    version.major = parseInt(match[1], 10);
    version.minor = parseInt(match[2], 10);
    version.patch = parseInt(match[3], 10);
    
    return version;
  }

  /**
   * Compares this version with another version
   * @param other Version to compare with
   * @returns -1 if this version is lower, 0 if equal, 1 if higher
   */
  compareTo(other: EventVersionDto): number {
    if (this.major !== other.major) {
      return this.major < other.major ? -1 : 1;
    }
    
    if (this.minor !== other.minor) {
      return this.minor < other.minor ? -1 : 1;
    }
    
    if (this.patch !== other.patch) {
      return this.patch < other.patch ? -1 : 1;
    }
    
    return 0; // Versions are equal
  }

  /**
   * Checks if this version is compatible with another version
   * Compatible means the major version is the same and this version is greater than or equal to the other
   * @param other Version to check compatibility with
   * @returns True if compatible, false otherwise
   */
  isCompatibleWith(other: EventVersionDto): boolean {
    // Major version must be the same for compatibility
    if (this.major !== other.major) {
      return false;
    }
    
    // This version must be greater than or equal to the other version
    return this.compareTo(other) >= 0;
  }
}

/**
 * Enum defining the compatibility level between event versions
 */
export enum VersionCompatibility {
  /**
   * Versions are fully compatible, no transformation needed
   */
  COMPATIBLE = 'COMPATIBLE',
  
  /**
   * Versions are compatible with transformation
   */
  TRANSFORM_REQUIRED = 'TRANSFORM_REQUIRED',
  
  /**
   * Versions are incompatible, cannot be transformed
   */
  INCOMPATIBLE = 'INCOMPATIBLE'
}

/**
 * DTO for versioned events that includes version information
 * Extends the base ProcessEventDto with versioning capabilities
 */
export class VersionedEventDto extends ProcessEventDto {

  /**
   * The version of the event schema
   * @example '1.0.0'
   */
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version must be in format MAJOR.MINOR.PATCH' })
  @IsString()
  schemaVersion: string;

  /**
   * Converts a versioned event to a specific version
   * @param targetVersion The target version to convert to
   * @param transformers Map of transformation functions for different version pairs
   * @returns Transformed event or null if transformation is not possible
   */
  toVersion(targetVersion: string, transformers: Map<string, (event: VersionedEventDto) => VersionedEventDto>): VersionedEventDto | null {
    // If already at target version, return a copy of this event
    if (this.schemaVersion === targetVersion) {
      return { ...this };
    }

    // Look for a direct transformer
    const transformerKey = `${this.schemaVersion}->${targetVersion}`;
    const transformer = transformers.get(transformerKey);

    if (transformer) {
      const transformed = transformer(this);
      transformed.schemaVersion = targetVersion;
      return transformed;
    }

    // No direct transformer found, return null
    return null;
  }

  /**
   * Checks compatibility with a target version
   * @param targetVersion The target version to check compatibility with
   * @returns Compatibility level
   */
  checkCompatibility(targetVersion: string): VersionCompatibility {
    const sourceVersion = EventVersionDto.fromString(this.schemaVersion);
    const target = EventVersionDto.fromString(targetVersion);

    // If versions are identical, they are fully compatible
    if (sourceVersion.toString() === target.toString()) {
      return VersionCompatibility.COMPATIBLE;
    }

    // If major versions differ, they are incompatible
    if (sourceVersion.major !== target.major) {
      return VersionCompatibility.INCOMPATIBLE;
    }

    // If minor or patch versions differ, transformation is required
    return VersionCompatibility.TRANSFORM_REQUIRED;
  }
}

/**
 * DTO for event schema migration configuration
 */
export class EventMigrationConfigDto {
  /**
   * The source version of the event schema
   * @example '1.0.0'
   */
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Source version must be in format MAJOR.MINOR.PATCH' })
  @IsString()
  sourceVersion: string;

  /**
   * The target version of the event schema
   * @example '1.1.0'
   */
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Target version must be in format MAJOR.MINOR.PATCH' })
  @IsString()
  targetVersion: string;

  /**
   * The event type this migration applies to
   * @example 'HEALTH_METRIC_RECORDED'
   */
  @IsNotEmpty()
  @IsString()
  eventType: string;

  /**
   * Optional journey this migration applies to
   * @example 'health'
   */
  @IsOptional()
  @IsString()
  journey?: string;

  /**
   * Field mappings for the migration
   * Keys are source fields, values are target fields or transformation functions
   */
  @IsNotEmpty()
  @IsObject()
  fieldMappings: Record<string, string | ((value: any) => any)>;
}

/**
 * Registry for event schema migrations
 * Manages the available migrations and provides methods to apply them
 */
export class EventMigrationRegistry {
  private migrations: EventMigrationConfigDto[] = [];

  /**
   * Registers a new migration
   * @param migration Migration configuration
   */
  registerMigration(migration: EventMigrationConfigDto): void {
    this.migrations.push(migration);
  }

  /**
   * Finds migrations that can transform an event from its current version to the target version
   * @param event The event to transform
   * @param targetVersion The target version
   * @returns Array of applicable migrations in order of application
   */
  findMigrationPath(event: VersionedEventDto, targetVersion: string): EventMigrationConfigDto[] {
    // Find migrations that match the event type and journey
    const applicableMigrations = this.migrations.filter(migration => 
      migration.eventType === event.type && 
      (!migration.journey || !event.journey || migration.journey === event.journey)
    );

    // Build a graph of versions and their connections
    const versionGraph = new Map<string, Set<string>>();
    applicableMigrations.forEach(migration => {
      if (!versionGraph.has(migration.sourceVersion)) {
        versionGraph.set(migration.sourceVersion, new Set<string>());
      }
      versionGraph.get(migration.sourceVersion)!.add(migration.targetVersion);
    });

    // Find the shortest path from current version to target version
    const path = this.findShortestPath(versionGraph, event.schemaVersion, targetVersion);
    if (!path) {
      return [];
    }

    // Convert path to migrations
    const result: EventMigrationConfigDto[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const sourceVersion = path[i];
      const targetVersion = path[i + 1];
      const migration = applicableMigrations.find(m => 
        m.sourceVersion === sourceVersion && m.targetVersion === targetVersion
      );
      if (migration) {
        result.push(migration);
      }
    }

    return result;
  }

  /**
   * Finds the shortest path between two versions in the version graph
   * @param graph Version graph
   * @param start Starting version
   * @param end Target version
   * @returns Array of versions forming the path, or null if no path exists
   */
  private findShortestPath(graph: Map<string, Set<string>>, start: string, end: string): string[] | null {
    // If start and end are the same, return a single-element path
    if (start === end) {
      return [start];
    }

    // If start node doesn't exist in the graph, no path exists
    if (!graph.has(start)) {
      return null;
    }

    // Breadth-first search to find shortest path
    const queue: { version: string; path: string[] }[] = [{ version: start, path: [start] }];
    const visited = new Set<string>([start]);

    while (queue.length > 0) {
      const { version, path } = queue.shift()!;
      const neighbors = graph.get(version) || new Set<string>();

      for (const neighbor of neighbors) {
        if (neighbor === end) {
          return [...path, neighbor];
        }

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({ version: neighbor, path: [...path, neighbor] });
        }
      }
    }

    return null; // No path found
  }

  /**
   * Applies a migration to an event
   * @param event The event to migrate
   * @param migration The migration to apply
   * @returns Migrated event
   */
  applyMigration(event: VersionedEventDto, migration: EventMigrationConfigDto): VersionedEventDto {
    // Create a new event object
    const migratedEvent: VersionedEventDto = {
      type: event.type,
      userId: event.userId,
      data: { ...event.data },
      schemaVersion: migration.targetVersion,
    };

    if (event.journey) {
      migratedEvent.journey = event.journey;
    }

    // Apply field mappings
    for (const [sourceField, targetField] of Object.entries(migration.fieldMappings)) {
      // Get the source value using dot notation
      const sourceValue = this.getNestedValue(event.data, sourceField);
      
      if (sourceValue !== undefined) {
        // Apply transformation if targetField is a function
        const finalValue = typeof targetField === 'function' 
          ? targetField(sourceValue)
          : sourceValue;
        
        // Set the value in the target using dot notation
        this.setNestedValue(migratedEvent.data, targetField as string, finalValue);
      }
    }

    return migratedEvent;
  }

  /**
   * Gets a nested value from an object using dot notation
   * @param obj The object to get the value from
   * @param path The path to the value using dot notation
   * @returns The value or undefined if not found
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * Sets a nested value in an object using dot notation
   * @param obj The object to set the value in
   * @param path The path to the value using dot notation
   * @param value The value to set
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || current[key] === null || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Migrates an event to the target version
   * @param event The event to migrate
   * @param targetVersion The target version
   * @returns Migrated event or null if migration is not possible
   */
  migrateEvent(event: VersionedEventDto, targetVersion: string): VersionedEventDto | null {
    // If already at target version, return a copy of the event
    if (event.schemaVersion === targetVersion) {
      return { ...event };
    }

    // Find migration path
    const migrationPath = this.findMigrationPath(event, targetVersion);
    if (migrationPath.length === 0) {
      return null; // No migration path found
    }

    // Apply migrations in sequence
    let currentEvent = { ...event };
    for (const migration of migrationPath) {
      currentEvent = this.applyMigration(currentEvent, migration);
    }

    return currentEvent;
  }
}

/**
 * Service for handling event versioning and migration
 */
export class EventVersioningService {
  private migrationRegistry = new EventMigrationRegistry();
  private currentVersion: string;
  private interfaceAdapters = new Map<string, any>();

  /**
   * Creates a new EventVersioningService
   * @param currentVersion The current version of the event schema
   */
  constructor(currentVersion: string) {
    this.currentVersion = currentVersion;
  }

  /**
   * Registers a migration
   * @param migration Migration configuration
   */
  registerMigration(migration: EventMigrationConfigDto): void {
    this.migrationRegistry.registerMigration(migration);
  }

  /**
   * Processes an event, migrating it to the current version if necessary
   * @param event The event to process
   * @returns Processed event or null if processing is not possible
   */
  processEvent(event: VersionedEventDto): VersionedEventDto | null {
    // If event has no schema version, assume it's the current version
    if (!event.schemaVersion) {
      event.schemaVersion = this.currentVersion;
      return event;
    }

    // Check if event needs migration
    if (event.schemaVersion !== this.currentVersion) {
      return this.migrationRegistry.migrateEvent(event, this.currentVersion);
    }

    return event;
  }

  /**
   * Detects the version of an unversioned event based on its structure
   * @param event The event to detect version for
   * @param versionDetectors Map of detector functions for different versions
   * @returns Detected version or null if detection is not possible
   */
  detectVersion(event: any, versionDetectors: Map<string, (event: any) => boolean>): string | null {
    for (const [version, detector] of versionDetectors.entries()) {
      if (detector(event)) {
        return version;
      }
    }
    return null;
  }

  /**
   * Converts a standard ProcessEventDto to a versioned event
   * @param event The event to convert
   * @param version The version to assign (defaults to current version)
   * @returns Versioned event
   */
  toVersionedEvent(event: ProcessEventDto, version?: string): VersionedEventDto {
    const versionedEvent = new VersionedEventDto();
    versionedEvent.type = event.type;
    versionedEvent.userId = event.userId;
    versionedEvent.data = { ...event.data };
    versionedEvent.schemaVersion = version || this.currentVersion;
    
    if (event.journey) {
      versionedEvent.journey = event.journey;
    }

    return versionedEvent;
  }
  
  /**
   * Converts a versioned event back to a standard ProcessEventDto
   * @param versionedEvent The versioned event to convert
   * @returns Standard ProcessEventDto
   */
  toProcessEventDto(versionedEvent: VersionedEventDto): ProcessEventDto {
    const processEvent = new ProcessEventDto();
    processEvent.type = versionedEvent.type;
    processEvent.userId = versionedEvent.userId;
    processEvent.data = { ...versionedEvent.data };
    
    if (versionedEvent.journey) {
      processEvent.journey = versionedEvent.journey;
    }
    
    return processEvent;
  }
  
  /**
   * Registers an adapter for converting between VersionedEventDto and @austa/interfaces types
   * @param eventType The event type this adapter handles
   * @param adapter The adapter function
   */
  registerInterfaceAdapter(eventType: string, adapter: any): void {
    this.interfaceAdapters.set(eventType, adapter);
  }
  
  /**
   * Converts a versioned event to its corresponding @austa/interfaces type
   * @param versionedEvent The versioned event to convert
   * @returns The converted interface object or null if no adapter is registered
   */
  toInterface(versionedEvent: VersionedEventDto): any | null {
    const adapter = this.interfaceAdapters.get(versionedEvent.type);
    if (!adapter || !adapter.toInterface) {
      return null;
    }
    
    return adapter.toInterface(versionedEvent);
  }
  
  /**
   * Converts an @austa/interfaces type to a versioned event
   * @param interfaceObj The interface object to convert
   * @param eventType The type of event to create
   * @returns The converted versioned event or null if no adapter is registered
   */
  fromInterface(interfaceObj: any, eventType: string): VersionedEventDto | null {
    const adapter = this.interfaceAdapters.get(eventType);
    if (!adapter || !adapter.fromInterface) {
      return null;
    }
    
    return adapter.fromInterface(interfaceObj, this.currentVersion);
  }
}

/**
 * Example adapter for converting between VersionedEventDto and @austa/interfaces types
 * This is a template that should be implemented for each event type
 */
export class EventInterfaceAdapter<T> {
  /**
   * Converts a versioned event to an interface type
   * @param versionedEvent The versioned event to convert
   * @returns The interface object
   */
  toInterface(versionedEvent: VersionedEventDto): T | null {
    // Implementation depends on the specific interface type
    // This is just a template
    return null;
  }
  
  /**
   * Converts an interface type to a versioned event
   * @param interfaceObj The interface object to convert
   * @param version The version to assign
   * @returns The versioned event
   */
  fromInterface(interfaceObj: T, version: string): VersionedEventDto | null {
    // Implementation depends on the specific interface type
    // This is just a template
    return null;
  }
}

/**
 * Factory for creating event transformers between different versions
 */
export class EventTransformerFactory {
  private transformers = new Map<string, (event: VersionedEventDto) => VersionedEventDto>();

  /**
   * Registers a transformer function for converting between two versions
   * @param sourceVersion Source version
   * @param targetVersion Target version
   * @param transformer Transformer function
   */
  registerTransformer(
    sourceVersion: string,
    targetVersion: string,
    transformer: (event: VersionedEventDto) => VersionedEventDto
  ): void {
    const key = `${sourceVersion}->${targetVersion}`;
    this.transformers.set(key, transformer);
  }

  /**
   * Gets a transformer function for converting between two versions
   * @param sourceVersion Source version
   * @param targetVersion Target version
   * @returns Transformer function or undefined if not found
   */
  getTransformer(sourceVersion: string, targetVersion: string): ((event: VersionedEventDto) => VersionedEventDto) | undefined {
    const key = `${sourceVersion}->${targetVersion}`;
    return this.transformers.get(key);
  }

  /**
   * Transforms an event from one version to another
   * @param event Event to transform
   * @param targetVersion Target version
   * @returns Transformed event or null if transformation is not possible
   */
  transform(event: VersionedEventDto, targetVersion: string): VersionedEventDto | null {
    return event.toVersion(targetVersion, this.transformers);
  }
}