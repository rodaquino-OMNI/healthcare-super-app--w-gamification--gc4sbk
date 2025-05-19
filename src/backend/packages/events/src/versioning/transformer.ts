/**
 * @file transformer.ts
 * @description Implements transformation functions to convert events between different versions,
 * supporting both upgrading (older to newer) and downgrading (newer to older) scenarios.
 * Provides a flexible transformation API that works with custom transformers, schema-based
 * transformations, and automatic field mapping.
 */

import { IVersionedEvent, EventVersion } from '../interfaces/event-versioning.interface';
import {
  TransformationOptions,
  TransformationResult,
  MigrationFunction,
  isVersionedEvent,
  isValidVersion,
  SchemaMigrationOptions,
  EventSchemaVersionMap,
} from './types';
import {
  TransformationError,
  MigrationError,
  VersioningErrorContext,
} from './errors';
import { VERSION_CONSTANTS, DEFAULT_VERSION_CONFIG } from './constants';

/**
 * Default transformation options
 */
const DEFAULT_TRANSFORMATION_OPTIONS: TransformationOptions = {
  validate: DEFAULT_VERSION_CONFIG.VALIDATE_TRANSFORMED_EVENTS,
  throwOnError: true,
  preserveMetadata: DEFAULT_VERSION_CONFIG.PRESERVE_METADATA_ON_TRANSFORM,
  context: {},
};

/**
 * Registry of transformation functions between specific version pairs
 */
const transformationRegistry = new Map<string, MigrationFunction>();

/**
 * Registry of event schemas for different versions
 */
const schemaRegistry = new Map<string, EventSchemaVersionMap>();

/**
 * Generates a key for the transformation registry
 */
function getTransformationKey(eventType: string, sourceVersion: EventVersion, targetVersion: EventVersion): string {
  return `${eventType}:${sourceVersion}->${targetVersion}`;
}

/**
 * Registers a transformation function between two specific versions of an event type
 * @param eventType The type of event this transformation applies to
 * @param sourceVersion The source version of the event
 * @param targetVersion The target version to transform to
 * @param transformFn The function that performs the transformation
 */
export function registerTransformation<T extends IVersionedEvent>(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
  transformFn: MigrationFunction,
): void {
  if (!isValidVersion(sourceVersion) || !isValidVersion(targetVersion)) {
    throw new TransformationError(
      `Invalid version format when registering transformation for ${eventType}`,
      { eventType, sourceVersion, targetVersion }
    );
  }

  const key = getTransformationKey(eventType, sourceVersion, targetVersion);
  transformationRegistry.set(key, transformFn);
}

/**
 * Registers a schema for a specific version of an event type
 * @param eventType The type of event
 * @param version The version of the event schema
 * @param schema The schema definition (can be JSON Schema, Zod schema, or other validation schema)
 * @param isLatest Whether this is the latest version of the schema
 */
export function registerEventSchema(
  eventType: string,
  version: EventVersion,
  schema: unknown,
  isLatest = false,
): void {
  if (!isValidVersion(version)) {
    throw new TransformationError(
      `Invalid version format when registering schema for ${eventType}`,
      { eventType, sourceVersion: version }
    );
  }

  let schemaMap = schemaRegistry.get(eventType);
  
  if (!schemaMap) {
    schemaMap = {
      eventType,
      versions: {},
      latestVersion: version,
    };
    schemaRegistry.set(eventType, schemaMap);
  }

  schemaMap.versions[version] = schema;
  
  if (isLatest) {
    schemaMap.latestVersion = version;
  }
}

/**
 * Gets a registered transformation function for a specific version pair
 * @param eventType The type of event
 * @param sourceVersion The source version
 * @param targetVersion The target version
 * @returns The transformation function or undefined if not found
 */
export function getTransformation(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
): MigrationFunction | undefined {
  const key = getTransformationKey(eventType, sourceVersion, targetVersion);
  return transformationRegistry.get(key);
}

/**
 * Gets a registered schema for a specific version of an event type
 * @param eventType The type of event
 * @param version The version to get the schema for
 * @returns The schema or undefined if not found
 */
export function getEventSchema(
  eventType: string,
  version: EventVersion,
): unknown | undefined {
  const schemaMap = schemaRegistry.get(eventType);
  if (!schemaMap) return undefined;
  
  return schemaMap.versions[version];
}

/**
 * Gets the latest version for an event type
 * @param eventType The type of event
 * @returns The latest version or undefined if the event type is not registered
 */
export function getLatestVersion(eventType: string): EventVersion | undefined {
  const schemaMap = schemaRegistry.get(eventType);
  return schemaMap?.latestVersion;
}

/**
 * Validates an event against its schema
 * @param event The event to validate
 * @param schema The schema to validate against
 * @returns An array of validation errors or an empty array if valid
 */
export function validateEvent<T extends IVersionedEvent>(
  event: T,
  schema: unknown,
): string[] {
  // This is a placeholder for schema validation
  // In a real implementation, this would use a validation library like Zod, Joi, or AJV
  // based on the schema type
  
  // For now, we'll just check if the event has the required fields
  const errors: string[] = [];
  
  if (!event.eventId) errors.push('Missing eventId');
  if (!event.type) errors.push('Missing type');
  if (!event.version) errors.push('Missing version');
  if (event.payload === undefined) errors.push('Missing payload');
  
  return errors;
}

/**
 * Transforms an event from its current version to a target version
 * @param event The event to transform
 * @param targetVersion The target version to transform to
 * @param options Transformation options
 * @returns The transformation result
 */
export function transformEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: EventVersion,
  options: TransformationOptions = {},
): TransformationResult<T> {
  // Merge with default options
  const opts = { ...DEFAULT_TRANSFORMATION_OPTIONS, ...options };
  
  try {
    // Validate input
    if (!isVersionedEvent(event)) {
      throw new TransformationError('Input is not a valid versioned event', {
        eventId: (event as any)?.eventId,
      });
    }
    
    if (!isValidVersion(targetVersion)) {
      throw new TransformationError(`Invalid target version format: ${targetVersion}`, {
        targetVersion,
        eventId: event.eventId,
        eventType: event.type,
      });
    }
    
    // If already at target version, return the event as is
    if (event.version === targetVersion) {
      return { success: true, transformed: event };
    }
    
    // Get direct transformation if available
    const directTransform = getTransformation(event.type, event.version, targetVersion);
    
    if (directTransform) {
      // Apply direct transformation
      const transformed = applyTransformation(event, directTransform, opts);
      
      // Validate the transformed event if required
      if (opts.validate) {
        const schema = getEventSchema(event.type, targetVersion);
        if (schema) {
          const errors = validateEvent(transformed, schema);
          if (errors.length > 0) {
            if (opts.throwOnError) {
              throw MigrationError.validationFailed(
                event.version,
                targetVersion,
                errors,
                event.eventId
              );
            }
            return { success: false, error: MigrationError.validationFailed(
              event.version,
              targetVersion,
              errors,
              event.eventId
            )};
          }
        }
      }
      
      return { success: true, transformed };
    }
    
    // If no direct transformation, try to find a path
    const transformationPath = findTransformationPath(event.type, event.version, targetVersion);
    
    if (transformationPath.length === 0) {
      // No path found, try automatic transformation if schemas are available
      const sourceSchema = getEventSchema(event.type, event.version);
      const targetSchema = getEventSchema(event.type, targetVersion);
      
      if (sourceSchema && targetSchema) {
        try {
          const transformed = automaticTransform(event, targetVersion, sourceSchema, targetSchema, opts);
          return { success: true, transformed };
        } catch (error) {
          // If automatic transformation fails, throw or return error based on options
          if (opts.throwOnError) {
            throw error;
          }
          return { success: false, error: error as Error };
        }
      }
      
      // No path and no schemas, cannot transform
      const error = MigrationError.pathNotFound(event.version, targetVersion, event.type);
      if (opts.throwOnError) {
        throw error;
      }
      return { success: false, error };
    }
    
    // Apply transformations in sequence
    let currentEvent = event;
    const warnings: string[] = [];
    
    for (let i = 0; i < transformationPath.length; i++) {
      const { sourceVersion, targetVersion, transformFn } = transformationPath[i];
      
      try {
        currentEvent = applyTransformation(currentEvent, transformFn, opts);
      } catch (error) {
        const context: VersioningErrorContext = {
          eventId: event.eventId,
          eventType: event.type,
          sourceVersion,
          targetVersion,
          transformationStep: `${i + 1}/${transformationPath.length}`,
        };
        
        const transformError = TransformationError.stepFailed(
          `${i + 1}/${transformationPath.length}`,
          sourceVersion,
          targetVersion,
          (error as Error).message,
          event.eventId
        );
        
        if (opts.throwOnError) {
          throw transformError;
        }
        
        return { success: false, error: transformError };
      }
      
      // Validate intermediate step if required
      if (opts.validate) {
        const schema = getEventSchema(event.type, targetVersion);
        if (schema) {
          const errors = validateEvent(currentEvent, schema);
          if (errors.length > 0) {
            warnings.push(`Validation warnings at step ${i + 1}: ${errors.join('; ')}`);
          }
        }
      }
    }
    
    return { 
      success: true, 
      transformed: currentEvent,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (opts.throwOnError) {
      throw error;
    }
    return { success: false, error: error as Error };
  }
}

/**
 * Upgrades an event to the latest version
 * @param event The event to upgrade
 * @param options Transformation options
 * @returns The transformation result
 */
export function upgradeToLatest<T extends IVersionedEvent>(
  event: T,
  options: TransformationOptions = {},
): TransformationResult<T> {
  const latestVersion = getLatestVersion(event.type) || VERSION_CONSTANTS.LATEST_VERSION;
  return transformEvent(event, latestVersion, options);
}

/**
 * Downgrades an event to a specific version
 * @param event The event to downgrade
 * @param targetVersion The target version to downgrade to
 * @param options Transformation options
 * @returns The transformation result
 */
export function downgradeEvent<T extends IVersionedEvent>(
  event: T,
  targetVersion: EventVersion,
  options: TransformationOptions = {},
): TransformationResult<T> {
  return transformEvent(event, targetVersion, options);
}

/**
 * Applies a transformation function to an event
 * @param event The event to transform
 * @param transformFn The transformation function to apply
 * @param options Transformation options
 * @returns The transformed event
 */
function applyTransformation<T extends IVersionedEvent>(
  event: T,
  transformFn: MigrationFunction,
  options: TransformationOptions,
): T {
  // Create a deep copy of the event to avoid modifying the original
  const eventCopy = JSON.parse(JSON.stringify(event)) as T;
  
  // Apply the transformation
  const transformed = transformFn(eventCopy);
  
  // Preserve metadata if required
  if (options.preserveMetadata && event.metadata) {
    transformed.metadata = { ...event.metadata, ...transformed.metadata };
  }
  
  return transformed;
}

/**
 * Finds a path of transformations to convert from source to target version
 * @param eventType The type of event
 * @param sourceVersion The source version
 * @param targetVersion The target version
 * @returns An array of transformation steps or empty array if no path found
 */
function findTransformationPath(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
): Array<{ sourceVersion: EventVersion; targetVersion: EventVersion; transformFn: MigrationFunction }> {
  // This is a simplified implementation that doesn't handle complex graphs
  // A real implementation would use a graph traversal algorithm like Dijkstra's
  
  // For now, we'll just check if there are any intermediate versions that can form a path
  const result: Array<{ sourceVersion: EventVersion; targetVersion: EventVersion; transformFn: MigrationFunction }> = [];
  
  // Get all registered transformations for this event type
  const transformations = Array.from(transformationRegistry.entries())
    .filter(([key]) => key.startsWith(`${eventType}:`))
    .map(([key, fn]) => {
      const [, versionPair] = key.split(':');
      const [source, target] = versionPair.split('->');
      return { sourceVersion: source, targetVersion: target, transformFn: fn };
    });
  
  // Simple case: direct path from source to intermediate to target
  let currentVersion = sourceVersion;
  const maxSteps = DEFAULT_VERSION_CONFIG.MAX_TRANSFORMATION_STEPS;
  let steps = 0;
  
  while (currentVersion !== targetVersion && steps < maxSteps) {
    const nextStep = transformations.find(t => t.sourceVersion === currentVersion);
    
    if (!nextStep) break;
    
    result.push(nextStep);
    currentVersion = nextStep.targetVersion;
    steps++;
    
    if (currentVersion === targetVersion) {
      return result;
    }
  }
  
  // If we couldn't find a path, return empty array
  return [];
}

/**
 * Automatically transforms an event based on schema differences
 * @param event The event to transform
 * @param targetVersion The target version
 * @param sourceSchema The source schema
 * @param targetSchema The target schema
 * @param options Transformation options
 * @returns The transformed event
 */
function automaticTransform<T extends IVersionedEvent>(
  event: T,
  targetVersion: EventVersion,
  sourceSchema: unknown,
  targetSchema: unknown,
  options: TransformationOptions,
): T {
  // This is a placeholder for automatic schema-based transformation
  // In a real implementation, this would analyze the schemas and map fields accordingly
  
  // For now, we'll just copy all fields and update the version
  const transformed = JSON.parse(JSON.stringify(event)) as T;
  transformed.version = targetVersion;
  
  // Preserve metadata if required
  if (options.preserveMetadata && event.metadata) {
    transformed.metadata = { ...event.metadata, ...transformed.metadata };
  }
  
  return transformed;
}

/**
 * Creates a field mapping transformer that maps fields from one structure to another
 * @param fieldMappings Map of source field paths to target field paths
 * @param options Additional options for the transformation
 * @returns A transformation function that applies the field mappings
 */
export function createFieldMapper(
  fieldMappings: Record<string, string>,
  options: SchemaMigrationOptions = {},
): MigrationFunction {
  return <T extends IVersionedEvent>(event: T): T => {
    const result = JSON.parse(JSON.stringify(event)) as T;
    
    // Apply explicit field mappings
    for (const [sourcePath, targetPath] of Object.entries(fieldMappings)) {
      const sourceValue = getNestedValue(event, sourcePath);
      
      if (sourceValue !== undefined) {
        setNestedValue(result, targetPath, sourceValue);
      } else if (!options.excludeFields?.includes(sourcePath)) {
        // If source field doesn't exist and it's not explicitly excluded, this might be an error
        throw TransformationError.fieldMissing(
          sourcePath,
          event.version,
          result.version,
          event.eventId
        );
      }
    }
    
    return result;
  };
}

/**
 * Creates a transformer that applies a custom transformation function to specific fields
 * @param fieldTransformers Map of field paths to transformer functions
 * @returns A transformation function that applies the field transformers
 */
export function createFieldTransformer(
  fieldTransformers: Record<string, (value: any, event: IVersionedEvent) => any>,
): MigrationFunction {
  return <T extends IVersionedEvent>(event: T): T => {
    const result = JSON.parse(JSON.stringify(event)) as T;
    
    for (const [path, transformer] of Object.entries(fieldTransformers)) {
      const value = getNestedValue(event, path);
      
      if (value !== undefined) {
        const transformedValue = transformer(value, event);
        setNestedValue(result, path, transformedValue);
      }
    }
    
    return result;
  };
}

/**
 * Creates a pipeline of transformers that are applied in sequence
 * @param transformers Array of transformation functions to apply in sequence
 * @returns A transformation function that applies all transformers in order
 */
export function createTransformationPipeline(
  transformers: MigrationFunction[],
): MigrationFunction {
  return <T extends IVersionedEvent>(event: T): T => {
    return transformers.reduce((currentEvent, transformer) => {
      return transformer(currentEvent);
    }, event);
  };
}

/**
 * Gets a nested value from an object using a dot-notation path
 * @param obj The object to get the value from
 * @param path The path to the value (e.g., 'payload.user.name')
 * @returns The value at the path or undefined if not found
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Sets a nested value in an object using a dot-notation path
 * @param obj The object to set the value in
 * @param path The path to set the value at (e.g., 'payload.user.name')
 * @param value The value to set
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
}