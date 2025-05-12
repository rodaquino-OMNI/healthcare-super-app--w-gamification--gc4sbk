/**
 * Utility functions for transforming event payloads between different formats, structures, or versions.
 * Enables schema evolution by providing migration paths between different event versions,
 * ensuring backward compatibility while allowing the event schema to evolve.
 */
import { EventVersion } from '../interfaces/event-versioning.interface';
import { ValidationResult } from '../interfaces/event-validation.interface';
import { EventTypes } from '../dto/event-types.enum';
import { versionDetector } from '../versioning/version-detector';
import { compatibilityChecker } from '../versioning/compatibility-checker';
import { TransformationError } from '../versioning/errors';

// ===== Types and Interfaces =====

/**
 * Represents a function that transforms a payload from one version to another
 */
export type TransformFunction<T = any, R = any> = (payload: T, options?: TransformOptions) => R;

/**
 * Options for transformation operations
 */
export interface TransformOptions {
  /** Source version of the payload */
  sourceVersion?: EventVersion;
  /** Target version to transform to */
  targetVersion?: EventVersion;
  /** Whether to validate the transformed payload */
  validate?: boolean;
  /** Additional context for the transformation */
  context?: Record<string, any>;
  /** Journey context for journey-specific transformations */
  journeyContext?: 'health' | 'care' | 'plan';
}

/**
 * Registry of transformation functions for different event types and versions
 */
interface TransformRegistry {
  [eventType: string]: {
    [sourceVersion: string]: {
      [targetVersion: string]: TransformFunction;
    };
  };
}

/**
 * Result of a transformation operation
 */
export interface TransformResult<T = any> {
  /** The transformed payload */
  payload: T;
  /** Source version of the original payload */
  sourceVersion: EventVersion;
  /** Target version the payload was transformed to */
  targetVersion: EventVersion;
  /** Whether the transformation was successful */
  success: boolean;
  /** Validation result if validation was performed */
  validation?: ValidationResult;
  /** Any warnings generated during transformation */
  warnings?: string[];
}

// ===== Transformation Registry =====

/**
 * Registry of transformation functions for different event types and versions
 */
const transformRegistry: TransformRegistry = {};

/**
 * Registers a transformation function for a specific event type and version pair
 * @param eventType The type of event this transformation applies to
 * @param sourceVersion The source version of the payload
 * @param targetVersion The target version to transform to
 * @param transformFn The function that performs the transformation
 */
export function registerTransform(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
  transformFn: TransformFunction,
): void {
  // Initialize the registry structure if it doesn't exist
  if (!transformRegistry[eventType]) {
    transformRegistry[eventType] = {};
  }
  
  if (!transformRegistry[eventType][sourceVersion]) {
    transformRegistry[eventType][sourceVersion] = {};
  }
  
  // Register the transformation function
  transformRegistry[eventType][sourceVersion][targetVersion] = transformFn;
}

/**
 * Gets a transformation function for a specific event type and version pair
 * @param eventType The type of event
 * @param sourceVersion The source version of the payload
 * @param targetVersion The target version to transform to
 * @returns The transformation function or undefined if not found
 */
export function getTransform(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
): TransformFunction | undefined {
  if (
    !transformRegistry[eventType] ||
    !transformRegistry[eventType][sourceVersion] ||
    !transformRegistry[eventType][sourceVersion][targetVersion]
  ) {
    return undefined;
  }
  
  return transformRegistry[eventType][sourceVersion][targetVersion];
}

// ===== Generic Transformation Utilities =====

/**
 * Transforms a payload from one version to another
 * @param eventType The type of event
 * @param payload The payload to transform
 * @param options Transformation options
 * @returns The transformed payload and metadata
 */
export function transformPayload<T = any, R = any>(
  eventType: string,
  payload: T,
  options: TransformOptions = {},
): TransformResult<R> {
  const warnings: string[] = [];
  
  // Detect source version if not provided
  const sourceVersion = options.sourceVersion || versionDetector.detectVersion(payload);
  if (!sourceVersion) {
    throw new TransformationError(
      'Could not detect source version for payload',
      { eventType, payload },
    );
  }
  
  // Use latest compatible version if target version not specified
  const targetVersion = options.targetVersion || getLatestCompatibleVersion(eventType, sourceVersion);
  if (!targetVersion) {
    throw new TransformationError(
      'Could not determine target version for transformation',
      { eventType, sourceVersion },
    );
  }
  
  // If source and target versions are the same, return the original payload
  if (sourceVersion === targetVersion) {
    return {
      payload: payload as unknown as R,
      sourceVersion,
      targetVersion,
      success: true,
      warnings,
    };
  }
  
  // Get the transformation function
  const transformFn = getTransform(eventType, sourceVersion, targetVersion);
  
  // If no direct transformation exists, try to find a path through intermediate versions
  if (!transformFn) {
    const transformPath = findTransformPath(eventType, sourceVersion, targetVersion);
    if (transformPath && transformPath.length > 0) {
      return executeTransformPath(eventType, payload, transformPath, options);
    }
    
    throw new TransformationError(
      `No transformation path found from ${sourceVersion} to ${targetVersion} for event type ${eventType}`,
      { eventType, sourceVersion, targetVersion },
    );
  }
  
  // Execute the transformation
  try {
    const transformedPayload = transformFn(payload, options);
    
    // Validate the transformed payload if requested
    let validationResult: ValidationResult | undefined;
    if (options.validate) {
      // Validation would be implemented here
      // validationResult = validatePayload(eventType, transformedPayload, targetVersion);
    }
    
    return {
      payload: transformedPayload as R,
      sourceVersion,
      targetVersion,
      success: true,
      validation: validationResult,
      warnings,
    };
  } catch (error) {
    throw new TransformationError(
      `Error transforming payload from ${sourceVersion} to ${targetVersion} for event type ${eventType}`,
      { eventType, sourceVersion, targetVersion, error },
    );
  }
}

/**
 * Finds a path of transformations to get from source version to target version
 * @param eventType The type of event
 * @param sourceVersion The source version of the payload
 * @param targetVersion The target version to transform to
 * @returns An array of version pairs representing the transformation path
 */
function findTransformPath(
  eventType: string,
  sourceVersion: EventVersion,
  targetVersion: EventVersion,
): Array<{ source: EventVersion; target: EventVersion }> | null {
  // Simple breadth-first search to find a transformation path
  const visited = new Set<EventVersion>([sourceVersion]);
  const queue: Array<{ version: EventVersion; path: Array<{ source: EventVersion; target: EventVersion }> }> = [
    { version: sourceVersion, path: [] },
  ];
  
  while (queue.length > 0) {
    const { version, path } = queue.shift()!;
    
    // Check if we have transformations from this version
    const transformsFromVersion = transformRegistry[eventType]?.[version] || {};
    
    // Check each possible next step in the path
    for (const nextVersion of Object.keys(transformsFromVersion)) {
      if (nextVersion === targetVersion) {
        // Found a path to the target
        return [...path, { source: version, target: nextVersion }];
      }
      
      if (!visited.has(nextVersion)) {
        visited.add(nextVersion);
        queue.push({
          version: nextVersion,
          path: [...path, { source: version, target: nextVersion }],
        });
      }
    }
  }
  
  // No path found
  return null;
}

/**
 * Executes a series of transformations along a path
 * @param eventType The type of event
 * @param payload The initial payload
 * @param path The path of transformations to execute
 * @param options Transformation options
 * @returns The final transformed payload and metadata
 */
function executeTransformPath<T = any, R = any>(
  eventType: string,
  payload: T,
  path: Array<{ source: EventVersion; target: EventVersion }>,
  options: TransformOptions = {},
): TransformResult<R> {
  let currentPayload = payload;
  let currentSourceVersion = path[0].source;
  const warnings: string[] = [];
  
  // Apply each transformation in the path
  for (const { source, target } of path) {
    const transformFn = getTransform(eventType, source, target);
    if (!transformFn) {
      throw new TransformationError(
        `Missing transformation function in path from ${source} to ${target} for event type ${eventType}`,
        { eventType, source, target },
      );
    }
    
    try {
      currentPayload = transformFn(currentPayload, options);
    } catch (error) {
      throw new TransformationError(
        `Error in transformation path from ${source} to ${target} for event type ${eventType}`,
        { eventType, source, target, error },
      );
    }
  }
  
  // Validate the final transformed payload if requested
  let validationResult: ValidationResult | undefined;
  if (options.validate) {
    // Validation would be implemented here
    // validationResult = validatePayload(eventType, currentPayload, path[path.length - 1].target);
  }
  
  return {
    payload: currentPayload as unknown as R,
    sourceVersion: path[0].source,
    targetVersion: path[path.length - 1].target,
    success: true,
    validation: validationResult,
    warnings,
  };
}

/**
 * Gets the latest compatible version for an event type from a source version
 * @param eventType The type of event
 * @param sourceVersion The source version to find compatibility for
 * @returns The latest compatible version or undefined if none found
 */
function getLatestCompatibleVersion(eventType: string, sourceVersion: EventVersion): EventVersion | undefined {
  // Get all available target versions for this event type and source version
  const availableVersions = Object.keys(transformRegistry[eventType]?.[sourceVersion] || {});
  
  // If no transformations are registered, return the source version
  if (availableVersions.length === 0) {
    return sourceVersion;
  }
  
  // Find the latest compatible version
  let latestVersion: EventVersion | undefined;
  for (const version of availableVersions) {
    if (!latestVersion || compatibilityChecker.isNewer(version, latestVersion)) {
      latestVersion = version;
    }
  }
  
  return latestVersion;
}

// ===== Field Mapping Utilities =====

/**
 * Maps fields from one object structure to another based on a mapping definition
 * @param source The source object to map from
 * @param fieldMap The mapping of source fields to target fields
 * @returns A new object with the mapped fields
 */
export function mapFields<T extends Record<string, any>, R extends Record<string, any>>(
  source: T,
  fieldMap: Record<string, string | ((source: T) => any)>,
): R {
  const result = {} as R;
  
  for (const [targetField, sourceField] of Object.entries(fieldMap)) {
    if (typeof sourceField === 'function') {
      // Use the function to compute the value
      result[targetField as keyof R] = sourceField(source);
    } else if (sourceField.includes('.')) {
      // Handle nested fields with dot notation
      const parts = sourceField.split('.');
      let value = source;
      let valid = true;
      
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = value[part];
        } else {
          valid = false;
          break;
        }
      }
      
      if (valid) {
        result[targetField as keyof R] = value;
      }
    } else if (sourceField in source) {
      // Direct field mapping
      result[targetField as keyof R] = source[sourceField];
    }
  }
  
  return result;
}

/**
 * Safely gets a value from an object using a path string (e.g., 'user.profile.name')
 * @param obj The object to get the value from
 * @param path The path to the value
 * @param defaultValue The default value to return if the path doesn't exist
 * @returns The value at the path or the default value
 */
export function getValueByPath<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T,
): T | undefined {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return defaultValue;
    }
  }
  
  return current as T;
}

/**
 * Sets a value in an object using a path string (e.g., 'user.profile.name')
 * @param obj The object to set the value in
 * @param path The path to set the value at
 * @param value The value to set
 * @returns The modified object
 */
export function setValueByPath<T extends Record<string, any>>(
  obj: T,
  path: string,
  value: any,
): T {
  const parts = path.split('.');
  let current = obj;
  
  // Navigate to the parent of the final property
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || current[part] === null) {
      current[part] = {};
    }
    current = current[part];
  }
  
  // Set the value on the final property
  const finalPart = parts[parts.length - 1];
  current[finalPart] = value;
  
  return obj;
}

// ===== Journey-Specific Transformers =====

/**
 * Namespace for Health journey event transformers
 */
export namespace HealthTransformers {
  /**
   * Transforms a health metric event from v1.0.0 to v1.1.0
   * - Adds source field for metric recording
   * - Restructures value field to support multiple values
   */
  export function transformHealthMetricV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add source field if missing
      if (!result.data.source) {
        result.data.source = 'manual';
      }
      
      // Restructure value field to support multiple values
      if (result.data.value !== undefined && !result.data.values) {
        result.data.values = [{
          value: result.data.value,
          timestamp: result.data.timestamp || result.timestamp,
          unit: result.data.unit,
        }];
        
        // Keep the original value for backward compatibility
        // but mark it as deprecated in metadata
        if (!result.metadata) {
          result.metadata = {};
        }
        if (!result.metadata.deprecatedFields) {
          result.metadata.deprecatedFields = [];
        }
        result.metadata.deprecatedFields.push('data.value');
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  /**
   * Transforms a health goal event from v1.0.0 to v1.1.0
   * - Adds category field for goal classification
   * - Restructures progress tracking
   */
  export function transformHealthGoalV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add category field if missing
      if (!result.data.category) {
        // Infer category from goal type
        switch (result.data.type) {
          case 'steps':
          case 'distance':
          case 'activeMinutes':
            result.data.category = 'activity';
            break;
          case 'weight':
          case 'bmi':
            result.data.category = 'body';
            break;
          case 'bloodPressure':
          case 'heartRate':
          case 'bloodGlucose':
            result.data.category = 'vitals';
            break;
          default:
            result.data.category = 'other';
        }
      }
      
      // Restructure progress tracking
      if (result.data.progress !== undefined && !result.data.progressHistory) {
        result.data.progressHistory = [{
          value: result.data.progress,
          timestamp: result.data.updatedAt || result.timestamp,
        }];
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  // Register the health transformers
  registerTransform(EventTypes.HEALTH_METRIC_RECORDED, '1.0.0', '1.1.0', transformHealthMetricV1toV1_1);
  registerTransform(EventTypes.HEALTH_GOAL_PROGRESS, '1.0.0', '1.1.0', transformHealthGoalV1toV1_1);
  registerTransform(EventTypes.HEALTH_GOAL_ACHIEVED, '1.0.0', '1.1.0', transformHealthGoalV1toV1_1);
}

/**
 * Namespace for Care journey event transformers
 */
export namespace CareTransformers {
  /**
   * Transforms an appointment event from v1.0.0 to v1.1.0
   * - Adds location details
   * - Enhances provider information
   */
  export function transformAppointmentV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add location details if missing
      if (!result.data.location && result.data.provider) {
        result.data.location = {
          id: result.data.provider.locationId || 'unknown',
          name: result.data.provider.locationName || 'Unknown Location',
          address: result.data.provider.address,
          type: result.data.appointmentType === 'virtual' ? 'virtual' : 'physical',
        };
      }
      
      // Enhance provider information
      if (result.data.provider && !result.data.provider.specialty) {
        result.data.provider.specialty = result.data.specialtyRequired || 'General';
      }
      
      // Add appointment mode if missing
      if (!result.data.mode && result.data.appointmentType) {
        result.data.mode = result.data.appointmentType === 'virtual' ? 'telemedicine' : 'in-person';
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  /**
   * Transforms a medication event from v1.0.0 to v1.1.0
   * - Adds medication details
   * - Enhances adherence tracking
   */
  export function transformMedicationV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add medication details if missing
      if (result.data.medicationId && !result.data.medication) {
        result.data.medication = {
          id: result.data.medicationId,
          name: result.data.medicationName || 'Unknown Medication',
          dosage: result.data.dosage,
          frequency: result.data.frequency,
          instructions: result.data.instructions,
        };
      }
      
      // Enhance adherence tracking
      if (result.data.status && !result.data.adherence) {
        result.data.adherence = {
          status: result.data.status,
          timestamp: result.data.takenAt || result.timestamp,
          scheduled: result.data.scheduledAt,
          delay: result.data.scheduledAt && result.data.takenAt
            ? new Date(result.data.takenAt).getTime() - new Date(result.data.scheduledAt).getTime()
            : 0,
        };
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  // Register the care transformers
  registerTransform(EventTypes.APPOINTMENT_BOOKED, '1.0.0', '1.1.0', transformAppointmentV1toV1_1);
  registerTransform(EventTypes.APPOINTMENT_COMPLETED, '1.0.0', '1.1.0', transformAppointmentV1toV1_1);
  registerTransform(EventTypes.APPOINTMENT_CANCELLED, '1.0.0', '1.1.0', transformAppointmentV1toV1_1);
  registerTransform(EventTypes.MEDICATION_TAKEN, '1.0.0', '1.1.0', transformMedicationV1toV1_1);
  registerTransform(EventTypes.MEDICATION_SKIPPED, '1.0.0', '1.1.0', transformMedicationV1toV1_1);
}

/**
 * Namespace for Plan journey event transformers
 */
export namespace PlanTransformers {
  /**
   * Transforms a claim event from v1.0.0 to v1.1.0
   * - Adds claim category
   * - Enhances financial details
   */
  export function transformClaimV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add claim category if missing
      if (!result.data.category && result.data.type) {
        // Infer category from claim type
        switch (result.data.type) {
          case 'medical':
          case 'consultation':
          case 'procedure':
          case 'hospitalization':
            result.data.category = 'medical';
            break;
          case 'dental':
          case 'vision':
          case 'pharmacy':
            result.data.category = result.data.type;
            break;
          default:
            result.data.category = 'other';
        }
      }
      
      // Enhance financial details
      if (result.data.amount && !result.data.financialDetails) {
        result.data.financialDetails = {
          totalAmount: result.data.amount,
          currency: result.data.currency || 'BRL',
          coveredAmount: result.data.coveredAmount || 0,
          patientResponsibility: result.data.patientResponsibility || 0,
        };
        
        // Calculate patient responsibility if not provided
        if (!result.data.patientResponsibility && result.data.coveredAmount) {
          result.data.financialDetails.patientResponsibility = 
            result.data.amount - result.data.coveredAmount;
        }
      }
      
      // Add documents array if missing
      if (result.data.documentUrl && !result.data.documents) {
        result.data.documents = [{
          type: 'receipt',
          url: result.data.documentUrl,
          uploadedAt: result.data.uploadedAt || result.timestamp,
        }];
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  /**
   * Transforms a benefit event from v1.0.0 to v1.1.0
   * - Adds benefit category
   * - Enhances usage tracking
   */
  export function transformBenefitV1toV1_1(payload: any, options?: TransformOptions): any {
    // Clone the payload to avoid modifying the original
    const result = { ...payload };
    
    // Transform the data structure
    if (result.data) {
      // Add benefit category if missing
      if (!result.data.category && result.data.type) {
        // Infer category from benefit type
        switch (result.data.type) {
          case 'discount':
          case 'cashback':
          case 'reward':
            result.data.category = 'financial';
            break;
          case 'wellness':
          case 'fitness':
          case 'nutrition':
            result.data.category = 'wellness';
            break;
          case 'telemedicine':
          case 'checkup':
          case 'screening':
            result.data.category = 'medical';
            break;
          default:
            result.data.category = 'other';
        }
      }
      
      // Enhance usage tracking
      if (result.data.used !== undefined && !result.data.usage) {
        result.data.usage = {
          used: result.data.used,
          available: result.data.available || 0,
          total: result.data.total || 0,
          history: result.data.usageHistory || [],
        };
        
        // Add current usage to history if not present
        if (Array.isArray(result.data.usage.history) && !result.data.usageHistory) {
          result.data.usage.history.push({
            amount: result.data.used,
            timestamp: result.timestamp,
            description: result.data.description || 'Benefit used',
          });
        }
      }
    }
    
    // Update version
    result.version = '1.1.0';
    
    return result;
  }
  
  // Register the plan transformers
  registerTransform(EventTypes.CLAIM_SUBMITTED, '1.0.0', '1.1.0', transformClaimV1toV1_1);
  registerTransform(EventTypes.CLAIM_APPROVED, '1.0.0', '1.1.0', transformClaimV1toV1_1);
  registerTransform(EventTypes.CLAIM_REJECTED, '1.0.0', '1.1.0', transformClaimV1toV1_1);
  registerTransform(EventTypes.BENEFIT_USED, '1.0.0', '1.1.0', transformBenefitV1toV1_1);
  registerTransform(EventTypes.BENEFIT_REDEEMED, '1.0.0', '1.1.0', transformBenefitV1toV1_1);
}

// ===== Automatic Transformation =====

/**
 * Automatically transforms an event payload to the specified version
 * @param event The event object containing type and payload
 * @param targetVersion The target version to transform to (defaults to latest)
 * @param options Additional transformation options
 * @returns The transformed event
 */
export function autoTransformEvent<T extends { type: string; payload: any }>(  
  event: T,
  targetVersion?: EventVersion,
  options: Omit<TransformOptions, 'targetVersion'> = {},
): T {
  if (!event || !event.type || !event.payload) {
    throw new TransformationError(
      'Invalid event object provided for transformation',
      { event },
    );
  }
  
  // Detect the source version
  const sourceVersion = versionDetector.detectVersion(event.payload);
  if (!sourceVersion) {
    throw new TransformationError(
      'Could not detect source version for event payload',
      { event },
    );
  }
  
  // If target version is not specified and source version is detected,
  // no transformation is needed
  if (!targetVersion) {
    return event;
  }
  
  // If source and target versions are the same, no transformation is needed
  if (sourceVersion === targetVersion) {
    return event;
  }
  
  // Transform the payload
  const transformResult = transformPayload(
    event.type,
    event.payload,
    { ...options, sourceVersion, targetVersion },
  );
  
  // Return the transformed event
  return {
    ...event,
    payload: transformResult.payload,
  };
}