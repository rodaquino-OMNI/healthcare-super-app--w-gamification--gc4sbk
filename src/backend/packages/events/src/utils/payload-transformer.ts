/**
 * Utility functions for transforming event payloads between different formats, structures, or versions.
 * Enables schema evolution by providing migration paths between different event versions,
 * ensuring backward compatibility while allowing the event schema to evolve.
 */

import { EventTypes } from '../dto/event-types.enum';
import { IVersionedEvent } from '../interfaces/event-versioning.interface';
import { IBaseEvent } from '../interfaces/base-event.interface';
import { IJourneyEvent } from '../interfaces/journey-events.interface';
import { ValidationError } from '../errors/validation.error';
import { VersioningError } from '../versioning/errors';
import { detectVersion } from '../versioning/version-detector';
import { compareVersions, isCompatible } from '../versioning/compatibility-checker';
import { transformEvent } from '../versioning/transformer';

/**
 * Options for payload transformation operations
 */
export interface TransformOptions {
  /** Target version to transform to (if not specified, latest version is used) */
  targetVersion?: string;
  /** Whether to throw an error if transformation fails (default: true) */
  throwOnError?: boolean;
  /** Whether to validate the transformed payload (default: true) */
  validate?: boolean;
  /** Whether to preserve original fields not in the target schema (default: false) */
  preserveExtraFields?: boolean;
  /** Custom field mappings to apply during transformation */
  fieldMappings?: FieldMapping[];
  /** Journey context for journey-specific transformations */
  journeyContext?: string;
}

/**
 * Field mapping definition for transforming between different field names or structures
 */
export interface FieldMapping {
  /** Source field path (dot notation supported) */
  source: string;
  /** Target field path (dot notation supported) */
  target: string;
  /** Optional transformation function to apply during mapping */
  transform?: (value: any) => any;
}

/**
 * Type definition for a transformation function that converts between event versions
 */
export type TransformFunction<T = any, U = any> = (payload: T, options?: TransformOptions) => U;

/**
 * Registry of transformation functions by event type and version pair
 */
const transformationRegistry: Record<string, Record<string, Record<string, TransformFunction>>> = {};

/**
 * Safely gets a nested property from an object using dot notation path
 * @param obj The object to get the property from
 * @param path The property path in dot notation (e.g., 'user.address.street')
 * @param defaultValue Optional default value if the property doesn't exist
 * @returns The property value or the default value if not found
 */
export function getNestedProperty<T = any>(obj: any, path: string, defaultValue?: T): T {
  if (!obj || !path) {
    return defaultValue as T;
  }

  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue as T;
    }
    current = current[key];
  }

  return current === undefined ? (defaultValue as T) : (current as T);
}

/**
 * Sets a nested property on an object using dot notation path
 * @param obj The object to set the property on
 * @param path The property path in dot notation (e.g., 'user.address.street')
 * @param value The value to set
 * @returns The modified object
 */
export function setNestedProperty<T extends object>(obj: T, path: string, value: any): T {
  if (!obj || !path) {
    return obj;
  }

  const keys = path.split('.');
  let current = obj as any;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (current[key] === undefined || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  current[lastKey] = value;

  return obj;
}

/**
 * Applies field mappings to transform an object's structure
 * @param source Source object to transform
 * @param mappings Array of field mappings to apply
 * @returns A new object with the mappings applied
 */
export function applyFieldMappings<T extends object>(source: any, mappings: FieldMapping[]): T {
  const result = {} as T;

  // First, copy all properties from source if they're not being mapped
  if (source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      // Skip properties that are being mapped to a different name
      if (!mappings.some(mapping => mapping.source === key)) {
        result[key as keyof T] = source[key];
      }
    });
  }

  // Apply each mapping
  mappings.forEach(mapping => {
    const sourceValue = getNestedProperty(source, mapping.source);
    if (sourceValue !== undefined) {
      const transformedValue = mapping.transform ? mapping.transform(sourceValue) : sourceValue;
      setNestedProperty(result, mapping.target, transformedValue);
    }
  });

  return result;
}

/**
 * Registers a transformation function for a specific event type and version pair
 * @param eventType The event type to register the transformation for
 * @param sourceVersion The source version of the event
 * @param targetVersion The target version to transform to
 * @param transformFn The transformation function
 */
export function registerTransformation(
  eventType: string,
  sourceVersion: string,
  targetVersion: string,
  transformFn: TransformFunction
): void {
  if (!transformationRegistry[eventType]) {
    transformationRegistry[eventType] = {};
  }
  
  if (!transformationRegistry[eventType][sourceVersion]) {
    transformationRegistry[eventType][sourceVersion] = {};
  }
  
  transformationRegistry[eventType][sourceVersion][targetVersion] = transformFn;
}

/**
 * Gets a registered transformation function for a specific event type and version pair
 * @param eventType The event type to get the transformation for
 * @param sourceVersion The source version of the event
 * @param targetVersion The target version to transform to
 * @returns The transformation function or undefined if not found
 */
export function getTransformation(
  eventType: string,
  sourceVersion: string,
  targetVersion: string
): TransformFunction | undefined {
  return transformationRegistry[eventType]?.[sourceVersion]?.[targetVersion];
}

/**
 * Transforms an event payload from one version to another
 * @param eventType The type of event being transformed
 * @param payload The event payload to transform
 * @param options Transformation options
 * @returns The transformed payload
 * @throws {ValidationError} If validation fails and throwOnError is true
 * @throws {VersioningError} If transformation fails and throwOnError is true
 */
export function transformPayload<T = any, U = any>(
  eventType: string,
  payload: T,
  options: TransformOptions = {}
): U {
  const {
    targetVersion,
    throwOnError = true,
    validate = true,
    preserveExtraFields = false,
    fieldMappings = [],
  } = options;

  try {
    // Detect the source version
    const sourceVersion = detectVersion(payload);
    if (!sourceVersion) {
      throw new VersioningError('Could not detect source version of event payload');
    }

    // If no target version specified, use the latest version
    const effectiveTargetVersion = targetVersion || getLatestVersionForEventType(eventType);
    
    // If source and target versions are the same, just apply field mappings if any
    if (sourceVersion === effectiveTargetVersion && fieldMappings.length === 0) {
      return payload as unknown as U;
    }

    // Get the transformation function
    const transformFn = getTransformation(eventType, sourceVersion, effectiveTargetVersion);
    
    if (!transformFn) {
      // If no direct transformation exists, try to use the generic versioning transformer
      return transformEvent(payload, {
        sourceVersion,
        targetVersion: effectiveTargetVersion,
        eventType,
        validate,
        preserveExtraFields,
      }) as U;
    }

    // Apply the transformation
    const transformed = transformFn(payload, options);

    // Apply additional field mappings if provided
    const result = fieldMappings.length > 0
      ? applyFieldMappings<U>(transformed, fieldMappings)
      : transformed as U;

    return result;
  } catch (error) {
    if (throwOnError) {
      if (error instanceof ValidationError || error instanceof VersioningError) {
        throw error;
      }
      throw new VersioningError(
        `Failed to transform payload for event type ${eventType}: ${error.message}`,
        { cause: error }
      );
    }
    
    // Return the original payload if we shouldn't throw
    return payload as unknown as U;
  }
}

/**
 * Gets the latest version available for a specific event type
 * @param eventType The event type to get the latest version for
 * @returns The latest version string
 */
export function getLatestVersionForEventType(eventType: string): string {
  // This is a simplified implementation - in a real system, this would likely
  // be more sophisticated, possibly fetching from a schema registry or configuration
  const versions = Object.keys(transformationRegistry[eventType] || {});
  if (versions.length === 0) {
    return '1.0.0'; // Default to 1.0.0 if no versions are registered
  }
  
  // Sort versions semantically and return the highest
  return versions.sort(compareVersions).pop() || '1.0.0';
}

/**
 * Transforms a complete event (including metadata and payload)
 * @param event The event to transform
 * @param options Transformation options
 * @returns The transformed event
 */
export function transformEvent<T extends IBaseEvent = IBaseEvent>(
  event: T,
  options: TransformOptions = {}
): T {
  if (!event || !event.type) {
    throw new ValidationError('Invalid event: missing type');
  }

  // Transform the payload
  const transformedPayload = transformPayload(
    event.type,
    event.payload,
    options
  );

  // Create a new event with the transformed payload
  return {
    ...event,
    payload: transformedPayload,
    // Update version if target version was specified
    ...(options.targetVersion ? { version: options.targetVersion } : {}),
  };
}

// Health Journey Transformers

/**
 * Transforms a health metric event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 health metric payload
 * @returns The v1.1.0 health metric payload
 */
export function transformHealthMetricV1toV1_1(payload: any): any {
  // In v1.1.0, we added a 'source' field and renamed 'recordedAt' to 'timestamp'
  return {
    ...payload,
    source: payload.source || 'manual', // Default to 'manual' if not specified
    timestamp: payload.timestamp || payload.recordedAt,
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {
      deviceId: payload.deviceId || null,
      appVersion: payload.appVersion || null,
    },
  };
}

/**
 * Transforms a health metric event payload from v1.1.0 to v1.0.0
 * @param payload The v1.1.0 health metric payload
 * @returns The v1.0.0 health metric payload
 */
export function transformHealthMetricV1_1toV1(payload: any): any {
  // Remove fields added in v1.1.0 and convert back to v1.0.0 format
  const { source, metadata, ...rest } = payload;
  
  return {
    ...rest,
    recordedAt: payload.timestamp,
    // Flatten some metadata fields back to root
    deviceId: metadata?.deviceId || null,
    appVersion: metadata?.appVersion || null,
  };
}

/**
 * Transforms a health goal event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 health goal payload
 * @returns The v1.1.0 health goal payload
 */
export function transformHealthGoalV1toV1_1(payload: any): any {
  // In v1.1.0, we restructured the progress tracking
  return {
    ...payload,
    progress: {
      current: payload.currentValue || 0,
      target: payload.targetValue || 0,
      percentage: payload.progressPercentage || 
        (payload.targetValue ? (payload.currentValue / payload.targetValue) * 100 : 0),
      lastUpdated: payload.lastUpdated || payload.createdAt || new Date().toISOString(),
    },
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {},
  };
}

// Care Journey Transformers

/**
 * Transforms an appointment event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 appointment payload
 * @returns The v1.1.0 appointment payload
 */
export function transformAppointmentV1toV1_1(payload: any): any {
  // In v1.1.0, we added location details and restructured provider info
  return {
    ...payload,
    provider: {
      id: payload.providerId,
      name: payload.providerName,
      specialization: payload.specialization,
      contactInfo: payload.providerContact || {},
    },
    location: payload.location || {
      type: payload.appointmentType === 'virtual' ? 'virtual' : 'physical',
      address: payload.address || {},
      coordinates: payload.coordinates || null,
    },
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {},
  };
}

/**
 * Transforms an appointment event payload from v1.1.0 to v1.0.0
 * @param payload The v1.1.0 appointment payload
 * @returns The v1.0.0 appointment payload
 */
export function transformAppointmentV1_1toV1(payload: any): any {
  // Flatten nested structures back to v1.0.0 format
  return {
    ...payload,
    providerId: payload.provider?.id,
    providerName: payload.provider?.name,
    specialization: payload.provider?.specialization,
    providerContact: payload.provider?.contactInfo,
    appointmentType: payload.location?.type === 'virtual' ? 'virtual' : 'in-person',
    address: payload.location?.address,
    coordinates: payload.location?.coordinates,
  };
}

/**
 * Transforms a medication event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 medication payload
 * @returns The v1.1.0 medication payload
 */
export function transformMedicationV1toV1_1(payload: any): any {
  // In v1.1.0, we added more detailed medication information
  return {
    ...payload,
    medication: {
      id: payload.medicationId,
      name: payload.medicationName,
      dosage: {
        value: payload.dosageValue,
        unit: payload.dosageUnit,
      },
      frequency: payload.frequency,
    },
    adherence: {
      status: payload.status,
      timestamp: payload.timestamp,
      scheduledTime: payload.scheduledTime,
    },
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {},
  };
}

// Plan Journey Transformers

/**
 * Transforms a claim event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 claim payload
 * @returns The v1.1.0 claim payload
 */
export function transformClaimV1toV1_1(payload: any): any {
  // In v1.1.0, we restructured financial information and added document references
  return {
    ...payload,
    financial: {
      amount: payload.amount,
      currency: payload.currency || 'USD',
      reimbursementAmount: payload.reimbursementAmount,
      outOfPocket: payload.outOfPocketAmount || (payload.amount - (payload.reimbursementAmount || 0)),
    },
    documents: Array.isArray(payload.documentIds) 
      ? payload.documentIds.map((id: string) => ({ id, type: 'supporting' }))
      : [],
    provider: {
      id: payload.providerId,
      name: payload.providerName,
      type: payload.providerType,
    },
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {},
  };
}

/**
 * Transforms a claim event payload from v1.1.0 to v1.0.0
 * @param payload The v1.1.0 claim payload
 * @returns The v1.0.0 claim payload
 */
export function transformClaimV1_1toV1(payload: any): any {
  // Flatten nested structures back to v1.0.0 format
  return {
    ...payload,
    amount: payload.financial?.amount,
    currency: payload.financial?.currency,
    reimbursementAmount: payload.financial?.reimbursementAmount,
    outOfPocketAmount: payload.financial?.outOfPocket,
    documentIds: Array.isArray(payload.documents) 
      ? payload.documents.map((doc: any) => doc.id)
      : [],
    providerId: payload.provider?.id,
    providerName: payload.provider?.name,
    providerType: payload.provider?.type,
  };
}

/**
 * Transforms a benefit event payload from v1.0.0 to v1.1.0
 * @param payload The v1.0.0 benefit payload
 * @returns The v1.1.0 benefit payload
 */
export function transformBenefitV1toV1_1(payload: any): any {
  // In v1.1.0, we added usage tracking and restructured benefit information
  return {
    ...payload,
    benefit: {
      id: payload.benefitId,
      name: payload.benefitName,
      type: payload.benefitType,
      description: payload.description,
    },
    usage: {
      used: payload.usedAmount || 0,
      limit: payload.limitAmount,
      remaining: payload.remainingAmount || 
        (payload.limitAmount ? payload.limitAmount - (payload.usedAmount || 0) : null),
      periodStart: payload.periodStart,
      periodEnd: payload.periodEnd,
    },
    // Add metadata field if it doesn't exist
    metadata: payload.metadata || {},
  };
}

// Register all transformations

// Health Journey
registerTransformation(
  EventTypes.Health.METRIC_RECORDED,
  '1.0.0',
  '1.1.0',
  transformHealthMetricV1toV1_1
);

registerTransformation(
  EventTypes.Health.METRIC_RECORDED,
  '1.1.0',
  '1.0.0',
  transformHealthMetricV1_1toV1
);

registerTransformation(
  EventTypes.Health.GOAL_PROGRESS,
  '1.0.0',
  '1.1.0',
  transformHealthGoalV1toV1_1
);

// Care Journey
registerTransformation(
  EventTypes.Care.APPOINTMENT_BOOKED,
  '1.0.0',
  '1.1.0',
  transformAppointmentV1toV1_1
);

registerTransformation(
  EventTypes.Care.APPOINTMENT_BOOKED,
  '1.1.0',
  '1.0.0',
  transformAppointmentV1_1toV1
);

registerTransformation(
  EventTypes.Care.MEDICATION_TAKEN,
  '1.0.0',
  '1.1.0',
  transformMedicationV1toV1_1
);

// Plan Journey
registerTransformation(
  EventTypes.Plan.CLAIM_SUBMITTED,
  '1.0.0',
  '1.1.0',
  transformClaimV1toV1_1
);

registerTransformation(
  EventTypes.Plan.CLAIM_SUBMITTED,
  '1.1.0',
  '1.0.0',
  transformClaimV1_1toV1
);

registerTransformation(
  EventTypes.Plan.BENEFIT_UTILIZED,
  '1.0.0',
  '1.1.0',
  transformBenefitV1toV1_1
);

// Apply the same transformations to related event types
registerTransformation(
  EventTypes.Care.APPOINTMENT_COMPLETED,
  '1.0.0',
  '1.1.0',
  transformAppointmentV1toV1_1
);

registerTransformation(
  EventTypes.Care.APPOINTMENT_CANCELLED,
  '1.0.0',
  '1.1.0',
  transformAppointmentV1toV1_1
);

registerTransformation(
  EventTypes.Plan.CLAIM_APPROVED,
  '1.0.0',
  '1.1.0',
  transformClaimV1toV1_1
);

registerTransformation(
  EventTypes.Plan.CLAIM_REJECTED,
  '1.0.0',
  '1.1.0',
  transformClaimV1toV1_1
);

/**
 * Automatically detects the event type and version, then transforms to the target version
 * @param event The event to transform
 * @param targetVersion The target version to transform to (optional, defaults to latest)
 * @param options Additional transformation options
 * @returns The transformed event
 */
export function autoTransformEvent<T extends IBaseEvent = IBaseEvent>(
  event: T,
  targetVersion?: string,
  options: Omit<TransformOptions, 'targetVersion'> = {}
): T {
  if (!event || !event.type) {
    throw new ValidationError('Invalid event: missing type');
  }

  return transformEvent(event, {
    ...options,
    targetVersion,
  });
}

/**
 * Transforms a journey-specific event using journey-specific transformation logic
 * @param event The journey event to transform
 * @param targetVersion The target version to transform to (optional, defaults to latest)
 * @param options Additional transformation options
 * @returns The transformed journey event
 */
export function transformJourneyEvent<T extends IJourneyEvent = IJourneyEvent>(
  event: T,
  targetVersion?: string,
  options: Omit<TransformOptions, 'targetVersion' | 'journeyContext'> = {}
): T {
  if (!event || !event.type || !event.journey) {
    throw new ValidationError('Invalid journey event: missing type or journey');
  }

  return transformEvent(event, {
    ...options,
    targetVersion,
    journeyContext: event.journey,
  });
}

/**
 * Transforms a versioned event to a specific version
 * @param event The versioned event to transform
 * @param targetVersion The target version to transform to
 * @param options Additional transformation options
 * @returns The transformed versioned event
 */
export function transformVersionedEvent<T extends IVersionedEvent = IVersionedEvent>(
  event: T,
  targetVersion: string,
  options: Omit<TransformOptions, 'targetVersion'> = {}
): T {
  if (!event || !event.type || !event.version) {
    throw new ValidationError('Invalid versioned event: missing type or version');
  }

  // Check if the versions are compatible
  if (isCompatible(event.version, targetVersion)) {
    // If versions are compatible, we might not need to transform
    if (event.version === targetVersion) {
      return event;
    }
  }

  return transformEvent(event, {
    ...options,
    targetVersion,
  }) as T;
}