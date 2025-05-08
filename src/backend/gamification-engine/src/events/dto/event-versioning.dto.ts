import { IsNotEmpty, IsString, IsObject, IsUUID, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Import shared interfaces from @austa/interfaces package
import { GamificationEvent, EventType, EventVersion } from '@austa/interfaces/gamification/events';

/**
 * Interface for versioned event metadata.
 * Contains information about the event version and schema.
 * Extends the EventVersion interface from @austa/interfaces.
 */
export interface EventVersionMetadata extends EventVersion {
  /**
   * Optional description of changes in this version.
   */
  changeDescription?: string;
}

/**
 * Data transfer object for versioned events.
 * Extends the basic ProcessEventDto with versioning information.
 * Implements the GamificationEvent interface from @austa/interfaces.
 */
export class VersionedEventDto implements GamificationEvent {
  /**
   * The type of the event.
   * Uses the EventType enum from @austa/interfaces.
   * Examples: 
   * - EventType.HEALTH_METRIC_RECORDED - User recorded a health metric
   * - EventType.APPOINTMENT_BOOKED - User booked a medical appointment
   * - EventType.CLAIM_SUBMITTED - User submitted an insurance claim
   */
  @IsNotEmpty()
  @IsString()
  type: EventType | string;

  /**
   * The ID of the user associated with the event.
   */
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * The data associated with the event.
   */
  @IsNotEmpty()
  @IsObject()
  data: object;

  /**
   * The journey associated with the event.
   */
  @IsOptional()
  @IsString()
  journey?: string;

  /**
   * The version of the event schema.
   * Follows semantic versioning (major.minor.patch).
   */
  @IsNotEmpty()
  @IsString()
  version: string;

  /**
   * The timestamp when the event occurred.
   */
  @IsOptional()
  timestamp?: Date;
}

/**
 * Data transfer object for event schema version information.
 */
export class EventSchemaVersionDto {
  /**
   * The type of the event.
   */
  @IsNotEmpty()
  @IsString()
  eventType: string;

  /**
   * The version of the event schema.
   */
  @IsNotEmpty()
  @IsString()
  version: string;

  /**
   * The timestamp when this schema version was created.
   */
  @IsNotEmpty()
  schemaCreatedAt: Date;

  /**
   * Description of changes in this version.
   */
  @IsOptional()
  @IsString()
  changeDescription?: string;

  /**
   * JSON schema definition for this version.
   */
  @IsNotEmpty()
  @IsObject()
  schema: object;
}

/**
 * Data transfer object for event schema migration.
 */
export class EventSchemaMigrationDto {
  /**
   * The source version of the event schema.
   */
  @IsNotEmpty()
  @IsString()
  sourceVersion: string;

  /**
   * The target version of the event schema.
   */
  @IsNotEmpty()
  @IsString()
  targetVersion: string;

  /**
   * The type of the event.
   */
  @IsNotEmpty()
  @IsString()
  eventType: string;

  /**
   * The migration function as a stringified JavaScript function.
   * This function takes an event of the source version and transforms it to the target version.
   */
  @IsNotEmpty()
  @IsString()
  migrationFunction: string;
}

/**
 * Class for handling event versioning and schema evolution.
 * Provides utilities for transforming events between different versions.
 * This service is responsible for:
 * 1. Registering event schema versions
 * 2. Registering migration functions between versions
 * 3. Transforming events between versions
 * 4. Validating events against their schema
 */
export class EventVersioningService {
  /**
   * Registry of event schema versions.
   * Maps event types to their available schema versions.
   */
  private static schemaRegistry: Map<string, Map<string, EventSchemaVersionDto>> = new Map();

  /**
   * Registry of migration functions.
   * Maps event types to a map of source-target version pairs to migration functions.
   */
  private static migrationRegistry: Map<string, Map<string, Function>> = new Map();

  /**
   * Registers a new event schema version.
   * @param schemaVersion The schema version to register.
   */
  public static registerSchemaVersion(schemaVersion: EventSchemaVersionDto): void {
    const { eventType, version } = schemaVersion;
    
    if (!this.schemaRegistry.has(eventType)) {
      this.schemaRegistry.set(eventType, new Map());
    }
    
    this.schemaRegistry.get(eventType)?.set(version, schemaVersion);
  }

  /**
   * Registers a migration function between two schema versions.
   * @param migration The migration definition.
   */
  public static registerMigration(migration: EventSchemaMigrationDto): void {
    const { eventType, sourceVersion, targetVersion, migrationFunction } = migration;
    
    if (!this.migrationRegistry.has(eventType)) {
      this.migrationRegistry.set(eventType, new Map());
    }
    
    // Convert the stringified function back to a function
    const migrationFn = new Function('event', migrationFunction);
    
    const versionKey = `${sourceVersion}->${targetVersion}`;
    this.migrationRegistry.get(eventType)?.set(versionKey, migrationFn);
  }

  /**
   * Gets all available versions for an event type.
   * @param eventType The type of the event.
   * @returns Array of available versions, sorted by creation date.
   */
  public static getAvailableVersions(eventType: string): string[] {
    const versions = this.schemaRegistry.get(eventType);
    if (!versions) return [];
    
    return Array.from(versions.values())
      .sort((a, b) => b.schemaCreatedAt.getTime() - a.schemaCreatedAt.getTime())
      .map(v => v.version);
  }

  /**
   * Gets the latest version for an event type.
   * @param eventType The type of the event.
   * @returns The latest version, or null if no versions are registered.
   */
  public static getLatestVersion(eventType: string): string | null {
    const versions = this.getAvailableVersions(eventType);
    return versions.length > 0 ? versions[0] : null;
  }

  /**
   * Transforms an event from one version to another.
   * @param event The event to transform.
   * @param targetVersion The target version to transform to.
   * @returns The transformed event, or null if transformation is not possible.
   */
  public static transformEvent(event: VersionedEventDto, targetVersion: string): VersionedEventDto | null {
    const { type: eventType, version: sourceVersion } = event;
    
    if (sourceVersion === targetVersion) {
      return event; // No transformation needed
    }
    
    // Check if we have a direct migration path
    const versionKey = `${sourceVersion}->${targetVersion}`;
    const migrationFunctions = this.migrationRegistry.get(eventType);
    const directMigration = migrationFunctions?.get(versionKey);
    
    if (directMigration) {
      const transformedEvent = directMigration(event);
      transformedEvent.version = targetVersion;
      return transformedEvent;
    }
    
    // If no direct path, try to find a path through intermediate versions
    const availableVersions = this.getAvailableVersions(eventType);
    if (availableVersions.length <= 1) return null;
    
    // Find all versions between source and target
    const sourceIndex = availableVersions.indexOf(sourceVersion);
    const targetIndex = availableVersions.indexOf(targetVersion);
    
    if (sourceIndex === -1 || targetIndex === -1) return null;
    
    // Determine direction of transformation (up or down versions)
    const isUpgrade = sourceIndex > targetIndex;
    const versionsToTraverse = isUpgrade
      ? availableVersions.slice(targetIndex, sourceIndex).reverse()
      : availableVersions.slice(sourceIndex + 1, targetIndex + 1);
    
    // Apply migrations in sequence
    let currentEvent = { ...event };
    let currentVersion = sourceVersion;
    
    for (const nextVersion of versionsToTraverse) {
      const stepKey = isUpgrade
        ? `${nextVersion}->${currentVersion}`
        : `${currentVersion}->${nextVersion}`;
      
      const stepMigration = migrationFunctions?.get(stepKey);
      if (!stepMigration) return null; // Missing migration step
      
      currentEvent = stepMigration(currentEvent);
      currentEvent.version = nextVersion;
      currentVersion = nextVersion;
    }
    
    return currentEvent;
  }

  /**
   * Transforms an event to the latest version.
   * @param event The event to transform.
   * @returns The transformed event, or the original event if transformation is not possible.
   */
  public static transformToLatest(event: VersionedEventDto): VersionedEventDto {
    const latestVersion = this.getLatestVersion(event.type);
    if (!latestVersion) return event;
    
    const transformed = this.transformEvent(event, latestVersion);
    return transformed || event;
  }
  
  /**
   * Creates a versioned event from an unversioned event.
   * This is useful for backward compatibility with systems that don't yet support versioning.
   * @param event The unversioned event.
   * @returns A versioned event with the latest schema version.
   */
  public static createVersionedEvent(event: any): VersionedEventDto | null {
    if (!event || !event.type || !event.userId || !event.data) {
      return null; // Invalid event
    }
    
    const latestVersion = this.getLatestVersion(event.type);
    if (!latestVersion) return null; // Unknown event type
    
    const versionedEvent: VersionedEventDto = {
      type: event.type,
      userId: event.userId,
      data: event.data,
      journey: event.journey,
      version: latestVersion,
      timestamp: event.timestamp || new Date()
    };
    
    // Validate the event against the latest schema
    if (!this.validateEvent(versionedEvent)) {
      return null; // Invalid event data
    }
    
    return versionedEvent;
  }

  /**
   * Validates that an event conforms to its declared schema version.
   * @param event The event to validate.
   * @returns True if the event is valid, false otherwise.
   */
  public static validateEvent(event: VersionedEventDto): boolean {
    const { type: eventType, version } = event;
    
    const schemaVersions = this.schemaRegistry.get(eventType);
    if (!schemaVersions) return false;
    
    const schemaVersion = schemaVersions.get(version);
    if (!schemaVersion) return false;
    
    // In a real implementation, this would use JSON Schema validation
    // with a library like Ajv to validate against the schema
    try {
      // Basic validation of required fields
      if (
        typeof event.type !== 'string' ||
        typeof event.userId !== 'string' ||
        typeof event.data !== 'object' ||
        event.data === null ||
        typeof event.version !== 'string'
      ) {
        return false;
      }
      
      // Additional validation based on event type
      switch (event.type) {
        case EventType.HEALTH_METRIC_RECORDED:
          return this.validateHealthMetricEvent(event, version);
        case EventType.APPOINTMENT_BOOKED:
          return this.validateAppointmentEvent(event, version);
        case EventType.CLAIM_SUBMITTED:
          return this.validateClaimEvent(event, version);
        default:
          // For other event types, just validate basic structure
          return true;
      }
    } catch (error) {
      console.error(`Error validating event: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Validates a health metric event against its schema.
   * @param event The event to validate.
   * @param version The version to validate against.
   * @returns True if the event is valid, false otherwise.
   */
  private static validateHealthMetricEvent(event: VersionedEventDto, version: string): boolean {
    const data = event.data as any;
    
    // Common validation for all versions
    if (
      typeof data.metricType !== 'string' ||
      typeof data.value !== 'number' ||
      typeof data.unit !== 'string'
    ) {
      return false;
    }
    
    // Version-specific validation
    if (version === '1.1.0' && data.deviceId !== undefined && typeof data.deviceId !== 'string') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Validates an appointment event against its schema.
   * @param event The event to validate.
   * @param version The version to validate against.
   * @returns True if the event is valid, false otherwise.
   */
  private static validateAppointmentEvent(event: VersionedEventDto, version: string): boolean {
    const data = event.data as any;
    
    // Common validation for all versions
    if (
      typeof data.appointmentId !== 'string' ||
      typeof data.providerId !== 'string' ||
      !data.dateTime // Should be a valid date string
    ) {
      return false;
    }
    
    // Version-specific validation
    if (version === '1.1.0') {
      if (data.isTelemedicine !== undefined && typeof data.isTelemedicine !== 'boolean') {
        return false;
      }
      if (data.locationId !== undefined && typeof data.locationId !== 'string') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validates a claim event against its schema.
   * @param event The event to validate.
   * @param version The version to validate against.
   * @returns True if the event is valid, false otherwise.
   */
  private static validateClaimEvent(event: VersionedEventDto, version: string): boolean {
    const data = event.data as any;
    
    // Common validation for all versions
    if (
      typeof data.claimId !== 'string' ||
      typeof data.amount !== 'number' ||
      !data.serviceDate // Should be a valid date string
    ) {
      return false;
    }
    
    // Version-specific validation
    if (version === '1.1.0') {
      if (typeof data.claimType !== 'string') {
        return false;
      }
      
      const validClaimTypes = ['medical', 'dental', 'vision', 'pharmacy', 'other'];
      if (!validClaimTypes.includes(data.claimType)) {
        return false;
      }
      
      if (data.receiptIds !== undefined && !Array.isArray(data.receiptIds)) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Decorator for registering an event schema version.
 * @param eventType The type of the event (from EventType enum).
 * @param version The version of the schema (follows semantic versioning).
 * @param schemaCreatedAt The timestamp when this schema version was created.
 * @param schema The JSON schema definition for validation.
 * @param changeDescription Optional description of changes in this version.
 */
export function EventSchemaVersion(
  eventType: EventType | string,
  version: string,
  schemaCreatedAt: Date,
  schema: object,
  changeDescription?: string
) {
  return function(target: any) {
    EventVersioningService.registerSchemaVersion({
      eventType,
      version,
      schemaCreatedAt,
      schema,
      changeDescription
    });
  };
}

/**
 * Decorator for registering a migration function between two schema versions.
 * @param eventType The type of the event (from EventType enum).
 * @param sourceVersion The source version of the schema.
 * @param targetVersion The target version of the schema.
 * @param migrationFunction The migration function as a string that transforms events from source to target version.
 */
export function EventSchemaMigration(
  eventType: EventType | string,
  sourceVersion: string,
  targetVersion: string,
  migrationFunction: string
) {
  return function(target: any) {
    EventVersioningService.registerMigration({
      eventType,
      sourceVersion,
      targetVersion,
      migrationFunction
    });
  };
}

/**
 * Example usage of event schema versioning decorators.
 */
@EventSchemaVersion(
  EventType.HEALTH_METRIC_RECORDED,
  '1.0.0',
  new Date('2023-01-01'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' }
        },
        required: ['metricType', 'value', 'unit']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Initial version of health metric event'
)
@EventSchemaVersion(
  EventType.HEALTH_METRIC_RECORDED,
  '1.1.0',
  new Date('2023-03-15'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          metricType: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          deviceId: { type: 'string' } // Added deviceId in v1.1.0
        },
        required: ['metricType', 'value', 'unit']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Added optional deviceId field'
)
@EventSchemaMigration(
  EventType.HEALTH_METRIC_RECORDED,
  '1.0.0',
  '1.1.0',
  `
  // Add deviceId field if not present
  if (!event.data.deviceId) {
    event.data.deviceId = 'unknown';
  }
  return event;
  `
)
class HealthMetricEventSchemaRegistry {}

/**
 * Example of Care journey event schema versioning.
 */
@EventSchemaVersion(
  EventType.APPOINTMENT_BOOKED,
  '1.0.0',
  new Date('2023-01-01'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string' },
          providerId: { type: 'string' },
          specialtyId: { type: 'string' },
          dateTime: { type: 'string', format: 'date-time' }
        },
        required: ['appointmentId', 'providerId', 'dateTime']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Initial version of appointment booked event'
)
@EventSchemaVersion(
  EventType.APPOINTMENT_BOOKED,
  '1.1.0',
  new Date('2023-04-10'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          appointmentId: { type: 'string' },
          providerId: { type: 'string' },
          specialtyId: { type: 'string' },
          dateTime: { type: 'string', format: 'date-time' },
          isTelemedicine: { type: 'boolean' }, // Added in v1.1.0
          locationId: { type: 'string' }       // Added in v1.1.0
        },
        required: ['appointmentId', 'providerId', 'dateTime']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Added telemedicine flag and location ID'
)
@EventSchemaMigration(
  EventType.APPOINTMENT_BOOKED,
  '1.0.0',
  '1.1.0',
  `
  // Add new fields with default values
  if (event.data.isTelemedicine === undefined) {
    event.data.isTelemedicine = false;
  }
  if (!event.data.locationId) {
    event.data.locationId = 'unknown';
  }
  return event;
  `
)
class AppointmentEventSchemaRegistry {}

/**
 * Example of Plan journey event schema versioning.
 */
@EventSchemaVersion(
  EventType.CLAIM_SUBMITTED,
  '1.0.0',
  new Date('2023-01-01'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          claimId: { type: 'string' },
          amount: { type: 'number' },
          serviceDate: { type: 'string', format: 'date' },
          providerId: { type: 'string' }
        },
        required: ['claimId', 'amount', 'serviceDate']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Initial version of claim submitted event'
)
@EventSchemaVersion(
  EventType.CLAIM_SUBMITTED,
  '1.1.0',
  new Date('2023-05-20'),
  {
    type: 'object',
    properties: {
      type: { type: 'string' },
      userId: { type: 'string', format: 'uuid' },
      data: {
        type: 'object',
        properties: {
          claimId: { type: 'string' },
          amount: { type: 'number' },
          serviceDate: { type: 'string', format: 'date' },
          providerId: { type: 'string' },
          claimType: { type: 'string', enum: ['medical', 'dental', 'vision', 'pharmacy', 'other'] }, // Added in v1.1.0
          receiptIds: { type: 'array', items: { type: 'string' } }  // Added in v1.1.0
        },
        required: ['claimId', 'amount', 'serviceDate', 'claimType']
      },
      version: { type: 'string' }
    },
    required: ['type', 'userId', 'data', 'version']
  },
  'Added claim type and receipt IDs'
)
@EventSchemaMigration(
  EventType.CLAIM_SUBMITTED,
  '1.0.0',
  '1.1.0',
  `
  // Add new required field with default value
  if (!event.data.claimType) {
    event.data.claimType = 'medical';
  }
  // Add new optional field
  if (!event.data.receiptIds) {
    event.data.receiptIds = [];
  }
  return event;
  `
)
class ClaimEventSchemaRegistry {}