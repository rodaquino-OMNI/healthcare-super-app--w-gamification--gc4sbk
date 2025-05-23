/**
 * @file payload-transformer.ts
 * @description Provides utility functions for transforming event payloads between different formats,
 * structures, or versions. This module enables schema evolution by providing migration paths
 * between different event versions, ensuring backward compatibility while allowing the event
 * schema to evolve.
 */

import { Logger } from '@nestjs/common';
import { EventTypes } from '../dto/event-types.enum';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { VersionDetectionError, VersionMigrationError } from '../versioning/errors';
import { VersionDetector } from '../versioning/version-detector';
import { SchemaVersion, TransformDirection, TransformOptions } from '../versioning/types';
import { CompatibilityChecker } from '../versioning/compatibility-checker';
import { SchemaMigrator } from '../versioning/schema-migrator';

// Private logger instance for the transformer
const logger = new Logger('PayloadTransformer');

/**
 * Interface for event payload transformers
 */
export interface IPayloadTransformer<T = any, R = any> {
  /**
   * Transform a payload from one version to another
   * @param payload The source payload to transform
   * @param options Transformation options
   * @returns The transformed payload
   */
  transform(payload: T, options?: TransformOptions): R;

  /**
   * Check if this transformer can handle the given payload and options
   * @param payload The payload to check
   * @param options Transformation options
   * @returns True if this transformer can handle the payload
   */
  canTransform(payload: T, options?: TransformOptions): boolean;

  /**
   * Get the source version this transformer handles
   */
  getSourceVersion(): SchemaVersion;

  /**
   * Get the target version this transformer produces
   */
  getTargetVersion(): SchemaVersion;
}

/**
 * Base class for implementing payload transformers
 */
export abstract class BasePayloadTransformer<T = any, R = any> implements IPayloadTransformer<T, R> {
  protected readonly sourceVersion: SchemaVersion;
  protected readonly targetVersion: SchemaVersion;
  protected readonly eventType: EventTypes;

  /**
   * Create a new payload transformer
   * @param eventType The event type this transformer handles
   * @param sourceVersion The source version this transformer handles
   * @param targetVersion The target version this transformer produces
   */
  constructor(eventType: EventTypes, sourceVersion: SchemaVersion, targetVersion: SchemaVersion) {
    this.eventType = eventType;
    this.sourceVersion = sourceVersion;
    this.targetVersion = targetVersion;
  }

  /**
   * Transform a payload from the source version to the target version
   * @param payload The source payload to transform
   * @param options Transformation options
   * @returns The transformed payload
   */
  abstract transform(payload: T, options?: TransformOptions): R;

  /**
   * Check if this transformer can handle the given payload and options
   * @param payload The payload to check
   * @param options Transformation options
   * @returns True if this transformer can handle the payload
   */
  canTransform(payload: any, options?: TransformOptions): boolean {
    // Check if the payload is for the correct event type
    if (payload.type !== this.eventType) {
      return false;
    }

    // Get the source version from the payload or options
    const sourceVersion = this.getPayloadVersion(payload, options);
    if (!sourceVersion) {
      return false;
    }

    // Check if the source version matches what this transformer handles
    return sourceVersion === this.sourceVersion;
  }

  /**
   * Get the source version this transformer handles
   */
  getSourceVersion(): SchemaVersion {
    return this.sourceVersion;
  }

  /**
   * Get the target version this transformer produces
   */
  getTargetVersion(): SchemaVersion {
    return this.targetVersion;
  }

  /**
   * Get the version from a payload or options
   * @param payload The payload to check
   * @param options Transformation options
   * @returns The detected version or undefined if not found
   */
  protected getPayloadVersion(payload: any, options?: TransformOptions): SchemaVersion | undefined {
    // First check options for explicit version
    if (options?.sourceVersion) {
      return options.sourceVersion;
    }

    // Then check if payload has a version property
    if (payload.version) {
      return payload.version;
    }

    // Finally try to detect the version from the payload structure
    try {
      return VersionDetector.detectVersion(payload);
    } catch (error) {
      logger.debug(`Could not detect version for payload: ${error.message}`);
      return undefined;
    }
  }
}

/**
 * Registry for payload transformers
 */
export class PayloadTransformerRegistry {
  private static transformers: IPayloadTransformer[] = [];

  /**
   * Register a transformer with the registry
   * @param transformer The transformer to register
   */
  static register(transformer: IPayloadTransformer): void {
    this.transformers.push(transformer);
    logger.debug(
      `Registered transformer from ${transformer.getSourceVersion()} to ${transformer.getTargetVersion()}`
    );
  }

  /**
   * Find a transformer that can handle the given payload and options
   * @param payload The payload to transform
   * @param options Transformation options
   * @returns The transformer or undefined if none found
   */
  static findTransformer<T = any, R = any>(
    payload: T,
    options?: TransformOptions
  ): IPayloadTransformer<T, R> | undefined {
    return this.transformers.find((transformer) => transformer.canTransform(payload, options)) as
      | IPayloadTransformer<T, R>
      | undefined;
  }

  /**
   * Find all transformers for a specific event type and source version
   * @param eventType The event type to find transformers for
   * @param sourceVersion The source version to find transformers for
   * @returns Array of matching transformers
   */
  static findTransformersForType(
    eventType: EventTypes,
    sourceVersion: SchemaVersion
  ): IPayloadTransformer[] {
    return this.transformers.filter(
      (transformer) =>
        (payload) => payload.type === eventType && transformer.getSourceVersion() === sourceVersion
    );
  }

  /**
   * Clear all registered transformers
   */
  static clear(): void {
    this.transformers = [];
    logger.debug('Cleared all registered transformers');
  }
}

/**
 * Utility functions for transforming event payloads
 */
export class PayloadTransformer {
  /**
   * Transform a payload from its current version to the target version
   * @param payload The payload to transform
   * @param targetVersion The target version to transform to
   * @param options Additional transformation options
   * @returns The transformed payload
   * @throws VersionDetectionError if the source version cannot be detected
   * @throws VersionMigrationError if no transformation path exists
   */
  static transform<T = any, R = any>(
    payload: T,
    targetVersion: SchemaVersion,
    options?: TransformOptions
  ): R {
    // Get the source version
    const sourceVersion = this.getPayloadVersion(payload, options);
    if (!sourceVersion) {
      throw new VersionDetectionError('Could not detect source version for payload');
    }

    // If source and target versions are the same, return the payload as is
    if (sourceVersion === targetVersion) {
      return payload as unknown as R;
    }

    // Find a direct transformer
    const transformer = PayloadTransformerRegistry.findTransformer<T, R>(payload, {
      ...options,
      sourceVersion,
      targetVersion,
    });

    if (transformer) {
      return transformer.transform(payload, { ...options, targetVersion });
    }

    // If no direct transformer, try to find a migration path
    const migrationPath = SchemaMigrator.findMigrationPath(sourceVersion, targetVersion);
    if (!migrationPath || migrationPath.length === 0) {
      throw new VersionMigrationError(
        `No migration path found from ${sourceVersion} to ${targetVersion}`
      );
    }

    // Apply each transformation in the path
    let currentPayload: any = payload;
    for (let i = 0; i < migrationPath.length; i++) {
      const currentSourceVersion = i === 0 ? sourceVersion : migrationPath[i - 1].targetVersion;
      const currentTargetVersion = migrationPath[i].targetVersion;

      const stepTransformer = PayloadTransformerRegistry.findTransformer(currentPayload, {
        ...options,
        sourceVersion: currentSourceVersion,
        targetVersion: currentTargetVersion,
      });

      if (!stepTransformer) {
        throw new VersionMigrationError(
          `Missing transformer from ${currentSourceVersion} to ${currentTargetVersion}`
        );
      }

      currentPayload = stepTransformer.transform(currentPayload, {
        ...options,
        targetVersion: currentTargetVersion,
      });
    }

    return currentPayload as R;
  }

  /**
   * Get the version from a payload or options
   * @param payload The payload to check
   * @param options Transformation options
   * @returns The detected version or undefined if not found
   */
  private static getPayloadVersion<T>(payload: T, options?: TransformOptions): SchemaVersion | undefined {
    // First check options for explicit version
    if (options?.sourceVersion) {
      return options.sourceVersion;
    }

    // Then check if payload has a version property
    if ((payload as any).version) {
      return (payload as any).version;
    }

    // Finally try to detect the version from the payload structure
    try {
      return VersionDetector.detectVersion(payload);
    } catch (error) {
      logger.debug(`Could not detect version for payload: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Check if a payload can be transformed to the target version
   * @param payload The payload to check
   * @param targetVersion The target version to check
   * @param options Additional options
   * @returns True if the payload can be transformed
   */
  static canTransform<T = any>(
    payload: T,
    targetVersion: SchemaVersion,
    options?: TransformOptions
  ): boolean {
    try {
      // Get the source version
      const sourceVersion = this.getPayloadVersion(payload, options);
      if (!sourceVersion) {
        return false;
      }

      // If source and target versions are the same, return true
      if (sourceVersion === targetVersion) {
        return true;
      }

      // Check if a direct transformer exists
      const transformer = PayloadTransformerRegistry.findTransformer(payload, {
        ...options,
        sourceVersion,
        targetVersion,
      });

      if (transformer) {
        return true;
      }

      // Check if a migration path exists
      const migrationPath = SchemaMigrator.findMigrationPath(sourceVersion, targetVersion);
      return !!migrationPath && migrationPath.length > 0;
    } catch (error) {
      logger.debug(`Error checking if payload can be transformed: ${error.message}`);
      return false;
    }
  }
}

/**
 * Utility functions for mapping fields between different payload structures
 */
export class FieldMapper {
  /**
   * Map a field from one object to another with optional transformation
   * @param source The source object
   * @param target The target object to map to
   * @param sourceField The field name in the source object
   * @param targetField The field name in the target object (defaults to sourceField)
   * @param transform Optional transformation function to apply to the value
   * @returns The target object with the mapped field
   */
  static mapField<S, T>(
    source: S,
    target: T,
    sourceField: keyof S,
    targetField: keyof T = sourceField as unknown as keyof T,
    transform?: (value: any) => any
  ): T {
    if (source[sourceField] !== undefined) {
      const value = transform ? transform(source[sourceField]) : source[sourceField];
      (target as any)[targetField] = value;
    }
    return target;
  }

  /**
   * Map multiple fields from one object to another
   * @param source The source object
   * @param target The target object to map to
   * @param fieldMap Map of source field names to target field names
   * @param transforms Optional map of transformation functions to apply to specific fields
   * @returns The target object with all mapped fields
   */
  static mapFields<S, T>(
    source: S,
    target: T,
    fieldMap: Record<keyof S, keyof T>,
    transforms?: Partial<Record<keyof S, (value: any) => any>>
  ): T {
    for (const sourceField in fieldMap) {
      const targetField = fieldMap[sourceField];
      const transform = transforms?.[sourceField];
      this.mapField(source, target, sourceField, targetField, transform);
    }
    return target;
  }

  /**
   * Get a value from a nested path in an object
   * @param obj The object to get the value from
   * @param path The path to the value, using dot notation (e.g., 'user.profile.name')
   * @param defaultValue Optional default value to return if the path doesn't exist
   * @returns The value at the path or the default value
   */
  static getNestedValue(obj: any, path: string, defaultValue?: any): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return defaultValue;
      }
      current = current[part];
    }

    return current !== undefined ? current : defaultValue;
  }

  /**
   * Set a value at a nested path in an object
   * @param obj The object to set the value in
   * @param path The path to set, using dot notation (e.g., 'user.profile.name')
   * @param value The value to set
   * @returns The modified object
   */
  static setNestedValue(obj: any, path: string, value: any): any {
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
    return obj;
  }
}

/**
 * Base class for health journey event transformers
 */
export abstract class HealthEventTransformer<T = any, R = any> extends BasePayloadTransformer<T, R> {
  /**
   * Create a new health event transformer
   * @param eventType The specific health event type
   * @param sourceVersion The source version this transformer handles
   * @param targetVersion The target version this transformer produces
   */
  constructor(eventType: EventTypes, sourceVersion: SchemaVersion, targetVersion: SchemaVersion) {
    super(eventType, sourceVersion, targetVersion);
  }

  /**
   * Common transformation logic for health events
   * @param payload The source payload
   * @returns Partially transformed payload with common fields mapped
   */
  protected transformCommonFields(payload: any): any {
    const result: any = {
      type: payload.type,
      userId: payload.userId,
      timestamp: payload.timestamp,
      version: this.targetVersion,
    };

    // Map common metadata if present
    if (payload.metadata) {
      result.metadata = { ...payload.metadata };
    }

    return result;
  }
}

/**
 * Base class for care journey event transformers
 */
export abstract class CareEventTransformer<T = any, R = any> extends BasePayloadTransformer<T, R> {
  /**
   * Create a new care event transformer
   * @param eventType The specific care event type
   * @param sourceVersion The source version this transformer handles
   * @param targetVersion The target version this transformer produces
   */
  constructor(eventType: EventTypes, sourceVersion: SchemaVersion, targetVersion: SchemaVersion) {
    super(eventType, sourceVersion, targetVersion);
  }

  /**
   * Common transformation logic for care events
   * @param payload The source payload
   * @returns Partially transformed payload with common fields mapped
   */
  protected transformCommonFields(payload: any): any {
    const result: any = {
      type: payload.type,
      userId: payload.userId,
      timestamp: payload.timestamp,
      version: this.targetVersion,
    };

    // Map common metadata if present
    if (payload.metadata) {
      result.metadata = { ...payload.metadata };
    }

    return result;
  }
}

/**
 * Base class for plan journey event transformers
 */
export abstract class PlanEventTransformer<T = any, R = any> extends BasePayloadTransformer<T, R> {
  /**
   * Create a new plan event transformer
   * @param eventType The specific plan event type
   * @param sourceVersion The source version this transformer handles
   * @param targetVersion The target version this transformer produces
   */
  constructor(eventType: EventTypes, sourceVersion: SchemaVersion, targetVersion: SchemaVersion) {
    super(eventType, sourceVersion, targetVersion);
  }

  /**
   * Common transformation logic for plan events
   * @param payload The source payload
   * @returns Partially transformed payload with common fields mapped
   */
  protected transformCommonFields(payload: any): any {
    const result: any = {
      type: payload.type,
      userId: payload.userId,
      timestamp: payload.timestamp,
      version: this.targetVersion,
    };

    // Map common metadata if present
    if (payload.metadata) {
      result.metadata = { ...payload.metadata };
    }

    return result;
  }
}

/**
 * Example implementation of a health metric event transformer from v1.0.0 to v1.1.0
 */
export class HealthMetricEventV1toV1_1Transformer extends HealthEventTransformer {
  constructor() {
    super(EventTypes.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0');
  }

  transform(payload: any, options?: TransformOptions): any {
    // Start with common fields
    const result = this.transformCommonFields(payload);

    // Copy the data object
    result.data = { ...payload.data };

    // Transform specific fields for v1.1.0
    // In v1.1.0, we added a 'source' field and renamed 'value' to 'metricValue'
    FieldMapper.mapField(payload.data, result.data, 'value', 'metricValue' as any);
    
    // Add default source if not present
    if (!result.data.source) {
      result.data.source = 'manual';
    }

    return result;
  }
}

/**
 * Example implementation of an appointment event transformer from v1.0.0 to v1.1.0
 */
export class AppointmentEventV1toV1_1Transformer extends CareEventTransformer {
  constructor() {
    super(EventTypes.APPOINTMENT_BOOKED, '1.0.0', '1.1.0');
  }

  transform(payload: any, options?: TransformOptions): any {
    // Start with common fields
    const result = this.transformCommonFields(payload);

    // Copy the data object
    result.data = { ...payload.data };

    // Transform specific fields for v1.1.0
    // In v1.1.0, we added a 'status' field and restructured provider information
    if (result.data.provider) {
      // Restructure provider information
      const provider = result.data.provider;
      result.data.provider = {
        id: provider.id || provider.providerId,
        name: provider.name,
        specialization: provider.specialization,
        contactInfo: {
          email: provider.email,
          phone: provider.phone,
        },
      };
    }

    // Add status field if not present
    if (!result.data.status) {
      result.data.status = 'scheduled';
    }

    return result;
  }
}

/**
 * Example implementation of a claim event transformer from v1.0.0 to v1.1.0
 */
export class ClaimEventV1toV1_1Transformer extends PlanEventTransformer {
  constructor() {
    super(EventTypes.CLAIM_SUBMITTED, '1.0.0', '1.1.0');
  }

  transform(payload: any, options?: TransformOptions): any {
    // Start with common fields
    const result = this.transformCommonFields(payload);

    // Copy the data object
    result.data = { ...payload.data };

    // Transform specific fields for v1.1.0
    // In v1.1.0, we restructured the amount field to include currency
    if (typeof result.data.amount === 'number') {
      result.data.amount = {
        value: result.data.amount,
        currency: 'BRL', // Default currency for AUSTA
      };
    }

    // Add tracking information if not present
    if (!result.data.tracking) {
      result.data.tracking = {
        submittedAt: payload.timestamp,
        status: 'pending',
      };
    }

    return result;
  }
}

// Register the example transformers
PayloadTransformerRegistry.register(new HealthMetricEventV1toV1_1Transformer());
PayloadTransformerRegistry.register(new AppointmentEventV1toV1_1Transformer());
PayloadTransformerRegistry.register(new ClaimEventV1toV1_1Transformer());

/**
 * Helper function to transform an event payload to the latest version
 * @param payload The event payload to transform
 * @returns The transformed payload in the latest version
 */
export function transformToLatest<T = any, R = any>(payload: T): R {
  // Determine the event type
  const eventType = (payload as any).type;
  if (!eventType) {
    throw new Error('Event payload must have a type property');
  }

  // Get the latest version for this event type
  // This would typically come from a schema registry or configuration
  // For this example, we'll use a hardcoded latest version
  const latestVersion = '1.1.0';

  // Transform the payload to the latest version
  return PayloadTransformer.transform(payload, latestVersion);
}

/**
 * Helper function to transform an event payload to a specific version
 * @param payload The event payload to transform
 * @param targetVersion The target version to transform to
 * @returns The transformed payload in the target version
 */
export function transformToVersion<T = any, R = any>(payload: T, targetVersion: SchemaVersion): R {
  return PayloadTransformer.transform(payload, targetVersion);
}