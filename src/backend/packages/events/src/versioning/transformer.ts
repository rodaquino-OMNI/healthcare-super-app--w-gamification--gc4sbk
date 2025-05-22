/**
 * @file transformer.ts
 * @description Implements transformation functions to convert events between different versions,
 * supporting both upgrading (older to newer) and downgrading (newer to older) scenarios.
 * 
 * This module provides a flexible transformation API that works with custom transformers,
 * schema-based transformations, and automatic field mapping. It's essential for event
 * compatibility across service boundaries and during rolling deployments with mixed versions.
 */

import { JourneyType } from '@austa/errors';
import { IVersionedEvent } from '../interfaces';
import {
  DEFAULT_TRANSFORM_OPTIONS,
  LATEST_VERSION,
  MAX_TRANSFORMATION_STEPS,
  PRESERVED_FIELDS,
  VERSION_FORMAT_REGEX
} from './constants';
import { IncompatibleVersionError, VersionTransformationError } from './errors';
import {
  EventTransformer,
  MigrationPath,
  ParsedVersion,
  SchemaValidator,
  TransformDirection,
  TransformOptions,
  isVersionedEvent
} from './types';

/**
 * Parses a semantic version string into its components
 * 
 * @param version - The version string to parse (e.g., "1.2.3")
 * @returns The parsed version with major, minor, and patch components
 * @throws {VersionTransformationError} If the version format is invalid
 */
export function parseVersion(version: string): ParsedVersion {
  const match = VERSION_FORMAT_REGEX.exec(version);
  
  if (!match) {
    throw new VersionTransformationError(
      `Invalid version format: ${version}. Expected format: major.minor.patch`,
      { version, expectedFormat: 'major.minor.patch' }
    );
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

/**
 * Compares two version strings and returns their relationship
 * 
 * @param versionA - First version to compare
 * @param versionB - Second version to compare
 * @returns -1 if versionA < versionB, 0 if equal, 1 if versionA > versionB
 */
export function compareVersions(versionA: string, versionB: string): number {
  const parsedA = parseVersion(versionA);
  const parsedB = parseVersion(versionB);
  
  // Compare major versions
  if (parsedA.major !== parsedB.major) {
    return parsedA.major < parsedB.major ? -1 : 1;
  }
  
  // Compare minor versions
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor < parsedB.minor ? -1 : 1;
  }
  
  // Compare patch versions
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch < parsedB.patch ? -1 : 1;
  }
  
  // Versions are equal
  return 0;
}

/**
 * Determines if a transformation is an upgrade or downgrade
 * 
 * @param sourceVersion - Source version
 * @param targetVersion - Target version
 * @returns The direction of the transformation
 */
export function determineTransformDirection(
  sourceVersion: string,
  targetVersion: string
): TransformDirection {
  const comparison = compareVersions(sourceVersion, targetVersion);
  
  return comparison < 0
    ? TransformDirection.UPGRADE
    : TransformDirection.DOWNGRADE;
}

/**
 * Validates that a transformation between versions is allowed
 * 
 * @param sourceVersion - Source version
 * @param targetVersion - Target version
 * @param options - Transformation options
 * @param eventType - Optional event type for error context
 * @throws {IncompatibleVersionError} If the transformation is not allowed
 */
export function validateTransformation(
  sourceVersion: string,
  targetVersion: string,
  options: TransformOptions,
  eventType?: string
): void {
  const direction = determineTransformDirection(sourceVersion, targetVersion);
  
  // If strict mode is enabled and the direction doesn't match the requested direction
  if (options.strict && direction !== options.direction) {
    throw new IncompatibleVersionError(
      `Transformation direction mismatch: requested ${options.direction} but versions indicate ${direction}`,
      { sourceVersion, targetVersion, requestedDirection: options.direction, actualDirection: direction, eventType }
    );
  }
  
  // If downgrade is requested but source version is already lower
  if (options.direction === TransformDirection.DOWNGRADE && direction === TransformDirection.UPGRADE) {
    throw new IncompatibleVersionError(
      `Cannot downgrade from ${sourceVersion} to ${targetVersion} as it would be an upgrade`,
      { sourceVersion, targetVersion, eventType }
    );
  }
  
  // If upgrade is requested but source version is already higher
  if (options.direction === TransformDirection.UPGRADE && direction === TransformDirection.DOWNGRADE) {
    throw new IncompatibleVersionError(
      `Cannot upgrade from ${sourceVersion} to ${targetVersion} as it would be a downgrade`,
      { sourceVersion, targetVersion, eventType }
    );
  }
}

/**
 * Creates a deep clone of an event to prevent mutation of the original
 * 
 * @param event - The event to clone
 * @returns A deep clone of the event
 */
export function cloneEvent<T extends IVersionedEvent>(event: T): T {
  return JSON.parse(JSON.stringify(event)) as T;
}

/**
 * Transforms an event from one version to another using a custom transformer function
 * 
 * @param event - The event to transform
 * @param transformer - The transformer function to apply
 * @param options - Transformation options
 * @returns The transformed event
 * @throws {VersionTransformationError} If transformation fails
 */
export function transformEvent<T extends IVersionedEvent>(
  event: T,
  transformer: EventTransformer<T>,
  options: TransformOptions = DEFAULT_TRANSFORM_OPTIONS
): T {
  if (!isVersionedEvent(event)) {
    throw new VersionTransformationError(
      'Cannot transform non-versioned event',
      { event }
    );
  }
  
  try {
    // Clone the event to prevent mutation of the original
    const clonedEvent = cloneEvent(event);
    
    // Apply the transformer
    const transformedEvent = transformer(clonedEvent, options);
    
    // Ensure the transformed event has a version
    if (!isVersionedEvent(transformedEvent)) {
      throw new VersionTransformationError(
        'Transformer returned a non-versioned event',
        { originalEvent: event, transformedEvent }
      );
    }
    
    return transformedEvent;
  } catch (error) {
    if (error instanceof VersionTransformationError) {
      throw error;
    }
    
    throw new VersionTransformationError(
      'Failed to transform event',
      { event, options },
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Creates a transformer function that applies a series of field transformations
 * 
 * @param fieldTransformers - Map of field names to transformer functions
 * @param targetVersion - The target version for the transformation
 * @returns A transformer function that applies the field transformations
 */
export function createFieldTransformer<T extends IVersionedEvent>(
  fieldTransformers: Record<string, (value: any, event: T) => any>,
  targetVersion: string
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    const transformedEvent = cloneEvent(event);
    const sourceVersion = event.version;
    
    // Apply field transformers
    for (const [field, transformer] of Object.entries(fieldTransformers)) {
      try {
        // Skip fields that don't exist in the source event
        if (!(field in transformedEvent)) {
          continue;
        }
        
        // Apply the field transformer
        const originalValue = (transformedEvent as any)[field];
        const transformedValue = transformer(originalValue, transformedEvent);
        (transformedEvent as any)[field] = transformedValue;
      } catch (error) {
        throw VersionTransformationError.fieldTransformationFailed(
          field,
          sourceVersion,
          targetVersion,
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
    
    // Update the version
    transformedEvent.version = targetVersion;
    
    return transformedEvent;
  };
}

/**
 * Creates a transformer function that adds new fields with default values
 * 
 * @param newFields - Map of field names to default values or value generators
 * @param targetVersion - The target version for the transformation
 * @returns A transformer function that adds the new fields
 */
export function createAddFieldsTransformer<T extends IVersionedEvent>(
  newFields: Record<string, any | ((event: T) => any)>,
  targetVersion: string
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    const transformedEvent = cloneEvent(event);
    
    // Add new fields
    for (const [field, valueOrGenerator] of Object.entries(newFields)) {
      try {
        // Skip if field already exists
        if (field in transformedEvent) {
          continue;
        }
        
        // Generate or use the provided value
        const value = typeof valueOrGenerator === 'function'
          ? (valueOrGenerator as Function)(transformedEvent)
          : valueOrGenerator;
        
        // Add the field
        (transformedEvent as any)[field] = value;
      } catch (error) {
        throw VersionTransformationError.fieldTransformationFailed(
          field,
          event.version,
          targetVersion,
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
    
    // Update the version
    transformedEvent.version = targetVersion;
    
    return transformedEvent;
  };
}

/**
 * Creates a transformer function that removes fields
 * 
 * @param fieldsToRemove - Array of field names to remove
 * @param targetVersion - The target version for the transformation
 * @returns A transformer function that removes the specified fields
 */
export function createRemoveFieldsTransformer<T extends IVersionedEvent>(
  fieldsToRemove: string[],
  targetVersion: string
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    const transformedEvent = cloneEvent(event);
    
    // Remove fields
    for (const field of fieldsToRemove) {
      // Skip preserved fields
      if (PRESERVED_FIELDS.includes(field)) {
        continue;
      }
      
      // Remove the field
      delete (transformedEvent as any)[field];
    }
    
    // Update the version
    transformedEvent.version = targetVersion;
    
    return transformedEvent;
  };
}

/**
 * Creates a transformer function that renames fields
 * 
 * @param fieldMappings - Map of old field names to new field names
 * @param targetVersion - The target version for the transformation
 * @returns A transformer function that renames the specified fields
 */
export function createRenameFieldsTransformer<T extends IVersionedEvent>(
  fieldMappings: Record<string, string>,
  targetVersion: string
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    const transformedEvent = cloneEvent(event);
    
    // Rename fields
    for (const [oldField, newField] of Object.entries(fieldMappings)) {
      try {
        // Skip if old field doesn't exist
        if (!(oldField in transformedEvent)) {
          continue;
        }
        
        // Skip if new field already exists
        if (newField in transformedEvent) {
          continue;
        }
        
        // Copy the value to the new field
        (transformedEvent as any)[newField] = (transformedEvent as any)[oldField];
        
        // Remove the old field
        delete (transformedEvent as any)[oldField];
      } catch (error) {
        throw VersionTransformationError.fieldTransformationFailed(
          `${oldField} -> ${newField}`,
          event.version,
          targetVersion,
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
    
    // Update the version
    transformedEvent.version = targetVersion;
    
    return transformedEvent;
  };
}

/**
 * Creates a transformer function that combines multiple transformers
 * 
 * @param transformers - Array of transformer functions to apply in sequence
 * @returns A transformer function that applies all transformers in sequence
 */
export function createCompositeTransformer<T extends IVersionedEvent>(
  transformers: Array<EventTransformer<T>>
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    return transformers.reduce(
      (currentEvent, transformer) => transformer(currentEvent, options),
      cloneEvent(event)
    );
  };
}

/**
 * Creates a transformer function that validates the event after transformation
 * 
 * @param transformer - The transformer function to apply
 * @param validator - The validator function to use
 * @param targetVersion - The target version for validation
 * @returns A transformer function that validates the transformed event
 */
export function createValidatingTransformer<T extends IVersionedEvent>(
  transformer: EventTransformer<T>,
  validator: SchemaValidator,
  targetVersion: string
): EventTransformer<T> {
  return (event: T, options?: TransformOptions): T => {
    // Apply the transformer
    const transformedEvent = transformer(event, options);
    
    // Skip validation if not requested
    if (options?.validateResult === false) {
      return transformedEvent;
    }
    
    // Validate the transformed event
    const isValid = validator(transformedEvent, targetVersion);
    
    if (!isValid) {
      throw new VersionTransformationError(
        `Validation failed for event after transformation to version ${targetVersion}`,
        { sourceVersion: event.version, targetVersion, event, transformedEvent }
      );
    }
    
    return transformedEvent;
  };
}

/**
 * Creates a transformer function that applies a schema-based transformation
 * 
 * @param sourceSchema - The source schema
 * @param targetSchema - The target schema
 * @param targetVersion - The target version for the transformation
 * @returns A transformer function that applies schema-based transformations
 */
export function createSchemaTransformer<T extends IVersionedEvent>(
  sourceSchema: Record<string, any>,
  targetSchema: Record<string, any>,
  targetVersion: string
): EventTransformer<T> {
  // Identify fields to add (in target but not in source)
  const fieldsToAdd: Record<string, any> = {};
  for (const [field, schema] of Object.entries(targetSchema)) {
    if (!(field in sourceSchema) && !PRESERVED_FIELDS.includes(field)) {
      // Use default value from schema if available
      fieldsToAdd[field] = schema.default !== undefined ? schema.default : null;
    }
  }
  
  // Identify fields to remove (in source but not in target)
  const fieldsToRemove: string[] = [];
  for (const field of Object.keys(sourceSchema)) {
    if (!(field in targetSchema) && !PRESERVED_FIELDS.includes(field)) {
      fieldsToRemove.push(field);
    }
  }
  
  // Identify fields to transform (in both but with different types)
  const fieldTransformers: Record<string, (value: any, event: T) => any> = {};
  for (const [field, sourceFieldSchema] of Object.entries(sourceSchema)) {
    const targetFieldSchema = targetSchema[field];
    
    if (targetFieldSchema && sourceFieldSchema.type !== targetFieldSchema.type) {
      // Add a transformer for type conversion
      fieldTransformers[field] = (value: any) => {
        // Handle type conversions based on target type
        switch (targetFieldSchema.type) {
          case 'string':
            return String(value);
          case 'number':
            return Number(value);
          case 'boolean':
            return Boolean(value);
          case 'array':
            return Array.isArray(value) ? value : [value];
          case 'object':
            return typeof value === 'object' ? value : { value };
          default:
            return value;
        }
      };
    }
  }
  
  // Create individual transformers
  const transformers: Array<EventTransformer<T>> = [];
  
  if (Object.keys(fieldsToAdd).length > 0) {
    transformers.push(createAddFieldsTransformer(fieldsToAdd, targetVersion));
  }
  
  if (fieldsToRemove.length > 0) {
    transformers.push(createRemoveFieldsTransformer(fieldsToRemove, targetVersion));
  }
  
  if (Object.keys(fieldTransformers).length > 0) {
    transformers.push(createFieldTransformer(fieldTransformers, targetVersion));
  }
  
  // If no transformations are needed, create a simple version updater
  if (transformers.length === 0) {
    return (event: T): T => {
      const transformedEvent = cloneEvent(event);
      transformedEvent.version = targetVersion;
      return transformedEvent;
    };
  }
  
  // Combine all transformers
  return createCompositeTransformer(transformers);
}

/**
 * Registry for storing migration paths between versions
 */
export class TransformerRegistry<T extends IVersionedEvent = IVersionedEvent> {
  private transformers: Map<string, Map<string, EventTransformer<T>>> = new Map();
  private eventTypes: Set<string> = new Set();
  
  /**
   * Registers a transformer for a specific migration path
   * 
   * @param sourceVersion - Source version
   * @param targetVersion - Target version
   * @param transformer - Transformer function
   * @param eventType - Optional event type (for type-specific transformers)
   */
  registerTransformer(
    sourceVersion: string,
    targetVersion: string,
    transformer: EventTransformer<T>,
    eventType?: string
  ): void {
    const key = eventType || '*';
    this.eventTypes.add(key);
    
    // Initialize maps if they don't exist
    if (!this.transformers.has(key)) {
      this.transformers.set(key, new Map());
    }
    
    const versionMap = this.transformers.get(key)!;
    const pathKey = `${sourceVersion}:${targetVersion}`;
    
    versionMap.set(pathKey, transformer);
  }
  
  /**
   * Gets a transformer for a specific migration path
   * 
   * @param sourceVersion - Source version
   * @param targetVersion - Target version
   * @param eventType - Optional event type
   * @returns The transformer function or undefined if not found
   */
  getTransformer(
    sourceVersion: string,
    targetVersion: string,
    eventType?: string
  ): EventTransformer<T> | undefined {
    // Try to find a type-specific transformer
    if (eventType) {
      const typeMap = this.transformers.get(eventType);
      if (typeMap) {
        const pathKey = `${sourceVersion}:${targetVersion}`;
        const transformer = typeMap.get(pathKey);
        if (transformer) {
          return transformer;
        }
      }
    }
    
    // Fall back to generic transformer
    const genericMap = this.transformers.get('*');
    if (genericMap) {
      const pathKey = `${sourceVersion}:${targetVersion}`;
      return genericMap.get(pathKey);
    }
    
    return undefined;
  }
  
  /**
   * Finds a migration path between two versions
   * 
   * @param sourceVersion - Source version
   * @param targetVersion - Target version
   * @param eventType - Optional event type
   * @returns Array of version steps in the migration path or undefined if no path found
   */
  findMigrationPath(
    sourceVersion: string,
    targetVersion: string,
    eventType?: string
  ): string[] | undefined {
    // If versions are the same, no migration needed
    if (sourceVersion === targetVersion) {
      return [sourceVersion];
    }
    
    // If direct transformer exists, use it
    if (this.getTransformer(sourceVersion, targetVersion, eventType)) {
      return [sourceVersion, targetVersion];
    }
    
    // Find a path through intermediate versions
    const visited = new Set<string>();
    const queue: Array<{ version: string; path: string[] }> = [
      { version: sourceVersion, path: [sourceVersion] }
    ];
    
    while (queue.length > 0) {
      const { version, path } = queue.shift()!;
      
      // Skip if already visited or exceeds max steps
      if (visited.has(version) || path.length > MAX_TRANSFORMATION_STEPS) {
        continue;
      }
      
      visited.add(version);
      
      // Check all possible next steps
      for (const eventTypeKey of this.eventTypes) {
        if (eventType && eventTypeKey !== '*' && eventTypeKey !== eventType) {
          continue;
        }
        
        const typeMap = this.transformers.get(eventTypeKey);
        if (!typeMap) {
          continue;
        }
        
        for (const pathKey of typeMap.keys()) {
          const [fromVersion, toVersion] = pathKey.split(':');
          
          if (fromVersion === version && !visited.has(toVersion)) {
            const newPath = [...path, toVersion];
            
            // Found target
            if (toVersion === targetVersion) {
              return newPath;
            }
            
            // Add to queue for further exploration
            queue.push({ version: toVersion, path: newPath });
          }
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Transforms an event from its current version to the target version
   * 
   * @param event - The event to transform
   * @param targetVersion - The target version
   * @param options - Transformation options
   * @returns The transformed event
   * @throws {VersionTransformationError} If transformation fails
   */
  transformToVersion(
    event: T,
    targetVersion: string = LATEST_VERSION,
    options: TransformOptions = DEFAULT_TRANSFORM_OPTIONS
  ): T {
    // If already at target version, return a clone
    if (event.version === targetVersion) {
      return cloneEvent(event);
    }
    
    // Find migration path
    const migrationPath = this.findMigrationPath(event.version, targetVersion, event.type);
    
    if (!migrationPath) {
      throw VersionTransformationError.missingTransformer(
        event.version,
        targetVersion,
        event.type || 'unknown'
      );
    }
    
    // Apply transformations along the path
    let currentEvent = cloneEvent(event);
    
    for (let i = 0; i < migrationPath.length - 1; i++) {
      const sourceVersion = migrationPath[i];
      const nextVersion = migrationPath[i + 1];
      
      // Get transformer for this step
      const transformer = this.getTransformer(sourceVersion, nextVersion, event.type);
      
      if (!transformer) {
        throw VersionTransformationError.missingTransformer(
          sourceVersion,
          nextVersion,
          event.type || 'unknown'
        );
      }
      
      // Determine direction for this step
      const stepDirection = determineTransformDirection(sourceVersion, nextVersion);
      
      // Create options for this step
      const stepOptions: TransformOptions = {
        ...options,
        direction: stepDirection,
      };
      
      // Apply transformer
      currentEvent = transformEvent(currentEvent, transformer, stepOptions);
    }
    
    return currentEvent;
  }
  
  /**
   * Registers a bidirectional transformer for upgrading and downgrading between versions
   * 
   * @param sourceVersion - Source version
   * @param targetVersion - Target version
   * @param upgradeTransformer - Transformer for upgrading
   * @param downgradeTransformer - Transformer for downgrading
   * @param eventType - Optional event type
   */
  registerBidirectionalTransformer(
    sourceVersion: string,
    targetVersion: string,
    upgradeTransformer: EventTransformer<T>,
    downgradeTransformer: EventTransformer<T>,
    eventType?: string
  ): void {
    this.registerTransformer(sourceVersion, targetVersion, upgradeTransformer, eventType);
    this.registerTransformer(targetVersion, sourceVersion, downgradeTransformer, eventType);
  }
  
  /**
   * Registers a migration path with multiple steps
   * 
   * @param migrationPath - Array of migration steps
   * @param eventType - Optional event type
   */
  registerMigrationPath(migrationPath: MigrationPath[], eventType?: string): void {
    for (const { sourceVersion, targetVersion, transformer } of migrationPath) {
      this.registerTransformer(sourceVersion, targetVersion, transformer, eventType);
    }
  }
  
  /**
   * Gets all registered event types
   * 
   * @returns Array of registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.eventTypes);
  }
  
  /**
   * Gets all registered migration paths
   * 
   * @param eventType - Optional event type to filter by
   * @returns Array of migration paths
   */
  getRegisteredPaths(eventType?: string): Array<{ from: string; to: string }> {
    const paths: Array<{ from: string; to: string }> = [];
    
    for (const [type, versionMap] of this.transformers.entries()) {
      if (eventType && type !== eventType && type !== '*') {
        continue;
      }
      
      for (const pathKey of versionMap.keys()) {
        const [from, to] = pathKey.split(':');
        paths.push({ from, to });
      }
    }
    
    return paths;
  }
  
  /**
   * Clears all registered transformers
   */
  clear(): void {
    this.transformers.clear();
    this.eventTypes.clear();
  }
}

/**
 * Global transformer registry instance
 */
export const globalTransformerRegistry = new TransformerRegistry();

/**
 * Transforms an event to the latest version using the global registry
 * 
 * @param event - The event to transform
 * @param options - Transformation options
 * @returns The transformed event
 */
export function transformToLatestVersion<T extends IVersionedEvent>(
  event: T,
  options: TransformOptions = DEFAULT_TRANSFORM_OPTIONS
): T {
  return globalTransformerRegistry.transformToVersion(event, LATEST_VERSION, options);
}

/**
 * Transforms an event to a specific version using the global registry
 * 
 * @param event - The event to transform
 * @param targetVersion - The target version
 * @param options - Transformation options
 * @returns The transformed event
 */
export function transformToVersion<T extends IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: TransformOptions = DEFAULT_TRANSFORM_OPTIONS
): T {
  return globalTransformerRegistry.transformToVersion(event, targetVersion, options);
}

/**
 * Registers a transformer in the global registry
 * 
 * @param sourceVersion - Source version
 * @param targetVersion - Target version
 * @param transformer - Transformer function
 * @param eventType - Optional event type
 */
export function registerTransformer<T extends IVersionedEvent>(
  sourceVersion: string,
  targetVersion: string,
  transformer: EventTransformer<T>,
  eventType?: string
): void {
  globalTransformerRegistry.registerTransformer(
    sourceVersion,
    targetVersion,
    transformer as EventTransformer,
    eventType
  );
}

/**
 * Registers a bidirectional transformer in the global registry
 * 
 * @param sourceVersion - Source version
 * @param targetVersion - Target version
 * @param upgradeTransformer - Transformer for upgrading
 * @param downgradeTransformer - Transformer for downgrading
 * @param eventType - Optional event type
 */
export function registerBidirectionalTransformer<T extends IVersionedEvent>(
  sourceVersion: string,
  targetVersion: string,
  upgradeTransformer: EventTransformer<T>,
  downgradeTransformer: EventTransformer<T>,
  eventType?: string
): void {
  globalTransformerRegistry.registerBidirectionalTransformer(
    sourceVersion,
    targetVersion,
    upgradeTransformer as EventTransformer,
    downgradeTransformer as EventTransformer,
    eventType
  );
}