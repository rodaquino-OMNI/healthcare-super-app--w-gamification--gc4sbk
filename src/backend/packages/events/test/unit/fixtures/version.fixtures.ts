/**
 * @file version.fixtures.ts
 * @description Test fixtures for event schema versioning, including events with different schema versions,
 * compatibility test cases, and version migration scenarios. These fixtures are essential for testing
 * the event versioning system, ensuring backward compatibility, and validating version evolution strategies.
 */

import { EventVersion, IVersionedEvent, VersionCompatibility } from '../../../src/interfaces/event-versioning.interface';
import { IBaseEvent } from '../../../src/interfaces/base-event.interface';
import { JourneyType, HealthEventType, CareEventType, PlanEventType } from '../../../src/interfaces/journey-events.interface';
import { VERSION_CONSTANTS } from '../../../src/versioning/constants';

// ===== VERSION OBJECTS =====

/**
 * Sample semantic versions for testing
 */
export const VERSIONS = {
  /** Initial version */
  V1_0_0: '1.0.0',
  
  /** Minor update with backward compatibility */
  V1_1_0: '1.1.0',
  
  /** Patch update with full compatibility */
  V1_1_1: '1.1.1',
  
  /** Major update with breaking changes */
  V2_0_0: '2.0.0',
  
  /** Future version for testing forward compatibility */
  V2_1_0: '2.1.0',
  
  /** Invalid version format */
  INVALID: '1.0',
  
  /** Non-numeric version */
  INVALID_CHARS: '1.x.0',
  
  /** Negative version numbers */
  INVALID_NEGATIVE: '1.-1.0',
};

/**
 * Sample parsed versions for testing
 */
export const PARSED_VERSIONS = {
  V1_0_0: { major: 1, minor: 0, patch: 0 },
  V1_1_0: { major: 1, minor: 1, patch: 0 },
  V1_1_1: { major: 1, minor: 1, patch: 1 },
  V2_0_0: { major: 2, minor: 0, patch: 0 },
  V2_1_0: { major: 2, minor: 1, patch: 0 },
};

// ===== SAMPLE EVENTS WITH DIFFERENT VERSIONS =====

/**
 * Base event template for creating test events
 */
const baseEvent: IBaseEvent = {
  eventId: '123e4567-e89b-12d3-a456-426614174000',
  timestamp: '2023-04-15T14:32:17.123Z',
  version: VERSIONS.V1_0_0,
  source: 'test-service',
  type: 'test.event',
  payload: {},
  metadata: {
    correlationId: 'corr-123',
    userId: 'user-123',
  },
};

/**
 * Creates a versioned event with the specified version and type
 * @param version The event schema version
 * @param type The event type
 * @param payload Optional custom payload
 * @returns A versioned event for testing
 */
export function createVersionedEvent<T = unknown>(
  version: string = VERSIONS.V1_0_0,
  type: string = 'test.event',
  payload: T = {} as T
): IVersionedEvent<T> {
  return {
    ...baseEvent,
    version,
    type,
    payload,
    minConsumerVersion: version,
    deprecated: false,
  };
}

/**
 * Sample events with different versions for testing
 */
export const VERSIONED_EVENTS = {
  /** Event with version 1.0.0 */
  V1_0_0: createVersionedEvent(VERSIONS.V1_0_0),
  
  /** Event with version 1.1.0 */
  V1_1_0: createVersionedEvent(VERSIONS.V1_1_0),
  
  /** Event with version 1.1.1 */
  V1_1_1: createVersionedEvent(VERSIONS.V1_1_1),
  
  /** Event with version 2.0.0 */
  V2_0_0: createVersionedEvent(VERSIONS.V2_0_0),
  
  /** Event with version 2.1.0 */
  V2_1_0: createVersionedEvent(VERSIONS.V2_1_0),
  
  /** Event with invalid version */
  INVALID: createVersionedEvent(VERSIONS.INVALID),
  
  /** Event with no version field */
  NO_VERSION: { ...baseEvent, version: undefined } as unknown as IVersionedEvent,
  
  /** Event with empty version string */
  EMPTY_VERSION: createVersionedEvent(''),
};

// ===== JOURNEY-SPECIFIC EVENTS WITH DIFFERENT VERSIONS =====

/**
 * Health metric event with different versions
 */
export const HEALTH_METRIC_EVENTS = {
  /** Version 1.0.0 - Initial version */
  V1_0_0: createVersionedEvent<any>(
    VERSIONS.V1_0_0,
    HealthEventType.METRIC_RECORDED,
    {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-04-15T14:30:00.000Z',
      source: 'manual',
    }
  ),
  
  /** 
   * Version 1.1.0 - Added previousValue and changePercentage fields 
   * (backward compatible change)
   */
  V1_1_0: createVersionedEvent<any>(
    VERSIONS.V1_1_0,
    HealthEventType.METRIC_RECORDED,
    {
      metricType: 'HEART_RATE',
      value: 75,
      unit: 'bpm',
      timestamp: '2023-04-15T14:30:00.000Z',
      source: 'manual',
      previousValue: 72,
      changePercentage: 4.17,
    }
  ),
  
  /**
   * Version 2.0.0 - Restructured payload with metric object
   * (breaking change)
   */
  V2_0_0: createVersionedEvent<any>(
    VERSIONS.V2_0_0,
    HealthEventType.METRIC_RECORDED,
    {
      metric: {
        type: 'HEART_RATE',
        value: 75,
        unit: 'bpm',
        recordedAt: '2023-04-15T14:30:00.000Z',
      },
      source: 'manual',
      trend: {
        previousValue: 72,
        changePercentage: 4.17,
      },
    }
  ),
};

/**
 * Appointment event with different versions
 */
export const APPOINTMENT_EVENTS = {
  /** Version 1.0.0 - Initial version */
  V1_0_0: createVersionedEvent<any>(
    VERSIONS.V1_0_0,
    CareEventType.APPOINTMENT_BOOKED,
    {
      provider: 'Dr. Smith',
      appointmentDate: '2023-05-10T10:00:00.000Z',
      appointmentType: 'Consultation',
      isFirstAppointment: true,
      isUrgent: false,
    }
  ),
  
  /**
   * Version 1.1.0 - Added location and notes fields
   * (backward compatible change)
   */
  V1_1_0: createVersionedEvent<any>(
    VERSIONS.V1_1_0,
    CareEventType.APPOINTMENT_BOOKED,
    {
      provider: 'Dr. Smith',
      appointmentDate: '2023-05-10T10:00:00.000Z',
      appointmentType: 'Consultation',
      isFirstAppointment: true,
      isUrgent: false,
      location: 'Main Clinic',
      notes: 'Please arrive 15 minutes early',
    }
  ),
  
  /**
   * Version 2.0.0 - Restructured with appointment object and provider details
   * (breaking change)
   */
  V2_0_0: createVersionedEvent<any>(
    VERSIONS.V2_0_0,
    CareEventType.APPOINTMENT_BOOKED,
    {
      appointment: {
        id: 'appt-123',
        scheduledFor: '2023-05-10T10:00:00.000Z',
        type: 'Consultation',
        status: 'SCHEDULED',
        location: 'Main Clinic',
        notes: 'Please arrive 15 minutes early',
      },
      provider: {
        id: 'prov-456',
        name: 'Dr. Smith',
        specialty: 'Cardiologia',
      },
      patientContext: {
        isFirstAppointment: true,
        isUrgent: false,
      },
    }
  ),
};

/**
 * Claim event with different versions
 */
export const CLAIM_EVENTS = {
  /** Version 1.0.0 - Initial version */
  V1_0_0: createVersionedEvent<any>(
    VERSIONS.V1_0_0,
    PlanEventType.CLAIM_SUBMITTED,
    {
      submissionDate: '2023-06-20T09:15:00.000Z',
      amount: 150.00,
      serviceDate: '2023-06-15T14:30:00.000Z',
      provider: 'General Hospital',
      hasDocuments: true,
      documentCount: 2,
      isFirstClaim: true,
    }
  ),
  
  /**
   * Version 1.1.0 - Added claimType and expectedReimbursement fields
   * (backward compatible change)
   */
  V1_1_0: createVersionedEvent<any>(
    VERSIONS.V1_1_0,
    PlanEventType.CLAIM_SUBMITTED,
    {
      submissionDate: '2023-06-20T09:15:00.000Z',
      amount: 150.00,
      serviceDate: '2023-06-15T14:30:00.000Z',
      provider: 'General Hospital',
      hasDocuments: true,
      documentCount: 2,
      isFirstClaim: true,
      claimType: 'Consulta Médica',
      expectedReimbursement: 120.00,
    }
  ),
  
  /**
   * Version 2.0.0 - Restructured with claim object and service details
   * (breaking change)
   */
  V2_0_0: createVersionedEvent<any>(
    VERSIONS.V2_0_0,
    PlanEventType.CLAIM_SUBMITTED,
    {
      claim: {
        id: 'claim-789',
        submittedAt: '2023-06-20T09:15:00.000Z',
        status: 'PENDING',
        type: 'Consulta Médica',
        documents: {
          count: 2,
          types: ['receipt', 'medical_report'],
        },
      },
      service: {
        date: '2023-06-15T14:30:00.000Z',
        provider: 'General Hospital',
        description: 'Routine checkup',
        cost: 150.00,
      },
      reimbursement: {
        expected: 120.00,
        coverage: 0.8,
      },
      userContext: {
        isFirstClaim: true,
      },
    }
  ),
};

// ===== VERSION COMPATIBILITY TEST CASES =====

/**
 * Test cases for version compatibility checking
 */
export const VERSION_COMPATIBILITY_CASES = [
  {
    name: 'Exact same version',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V1_0_0,
    expectedResult: {
      compatible: true,
      details: {
        isNewer: false,
        isSameMajor: true,
        breakingChange: false,
      },
    },
  },
  {
    name: 'Same major, newer minor (backward compatible)',
    sourceVersion: VERSIONS.V1_1_0,
    targetVersion: VERSIONS.V1_0_0,
    expectedResult: {
      compatible: false,
      details: {
        isNewer: true,
        isSameMajor: true,
        breakingChange: true,
      },
    },
  },
  {
    name: 'Same major, older minor (forward compatible)',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V1_1_0,
    expectedResult: {
      compatible: true,
      details: {
        isNewer: false,
        isSameMajor: true,
        breakingChange: false,
      },
    },
  },
  {
    name: 'Different major versions (incompatible)',
    sourceVersion: VERSIONS.V2_0_0,
    targetVersion: VERSIONS.V1_0_0,
    expectedResult: {
      compatible: false,
      details: {
        isNewer: true,
        isSameMajor: false,
        breakingChange: true,
      },
    },
  },
  {
    name: 'Different major versions, older source (incompatible)',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V2_0_0,
    expectedResult: {
      compatible: false,
      details: {
        isNewer: false,
        isSameMajor: false,
        breakingChange: true,
      },
    },
  },
  {
    name: 'Same major and minor, newer patch (fully compatible)',
    sourceVersion: VERSIONS.V1_1_1,
    targetVersion: VERSIONS.V1_1_0,
    expectedResult: {
      compatible: false,
      details: {
        isNewer: true,
        isSameMajor: true,
        breakingChange: true,
      },
    },
  },
  {
    name: 'Same major and minor, older patch (fully compatible)',
    sourceVersion: VERSIONS.V1_1_0,
    targetVersion: VERSIONS.V1_1_1,
    expectedResult: {
      compatible: true,
      details: {
        isNewer: false,
        isSameMajor: true,
        breakingChange: false,
      },
    },
  },
];

/**
 * Test cases for version compatibility with different compatibility modes
 */
export const VERSION_COMPATIBILITY_MODE_CASES = [
  {
    name: 'Strict mode - exact match',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'strict',
    expectedResult: { compatible: true },
  },
  {
    name: 'Strict mode - different minor',
    sourceVersion: VERSIONS.V1_1_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'strict',
    expectedResult: { compatible: false },
  },
  {
    name: 'Standard mode - same major, older minor',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V1_1_0,
    mode: 'standard',
    expectedResult: { compatible: true },
  },
  {
    name: 'Standard mode - same major, newer minor',
    sourceVersion: VERSIONS.V1_1_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'standard',
    expectedResult: { compatible: false },
  },
  {
    name: 'Standard mode - same major, newer minor, allowNewer=true',
    sourceVersion: VERSIONS.V1_1_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'standard',
    allowNewer: true,
    expectedResult: { compatible: true },
  },
  {
    name: 'Relaxed mode - older major',
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V2_0_0,
    mode: 'relaxed',
    expectedResult: { compatible: true },
  },
  {
    name: 'Relaxed mode - newer major',
    sourceVersion: VERSIONS.V2_0_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'relaxed',
    expectedResult: { compatible: false },
  },
  {
    name: 'Relaxed mode - newer major, allowNewer=true',
    sourceVersion: VERSIONS.V2_0_0,
    targetVersion: VERSIONS.V1_0_0,
    mode: 'relaxed',
    allowNewer: true,
    expectedResult: { compatible: true },
  },
];

// ===== EVENT MIGRATION SCENARIOS =====

/**
 * Sample schemas for different versions of the health metric event
 */
export const HEALTH_METRIC_SCHEMAS = {
  [VERSIONS.V1_0_0]: {
    type: 'object',
    required: ['metricType', 'value', 'unit', 'timestamp', 'source'],
    properties: {
      metricType: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
      source: { type: 'string', enum: ['manual', 'device', 'integration'] },
      deviceId: { type: 'string' },
    },
  },
  [VERSIONS.V1_1_0]: {
    type: 'object',
    required: ['metricType', 'value', 'unit', 'timestamp', 'source'],
    properties: {
      metricType: { type: 'string' },
      value: { type: 'number' },
      unit: { type: 'string' },
      timestamp: { type: 'string', format: 'date-time' },
      source: { type: 'string', enum: ['manual', 'device', 'integration'] },
      deviceId: { type: 'string' },
      previousValue: { type: 'number' },
      changePercentage: { type: 'number' },
    },
  },
  [VERSIONS.V2_0_0]: {
    type: 'object',
    required: ['metric', 'source'],
    properties: {
      metric: {
        type: 'object',
        required: ['type', 'value', 'unit', 'recordedAt'],
        properties: {
          type: { type: 'string' },
          value: { type: 'number' },
          unit: { type: 'string' },
          recordedAt: { type: 'string', format: 'date-time' },
        },
      },
      source: { type: 'string', enum: ['manual', 'device', 'integration'] },
      deviceId: { type: 'string' },
      trend: {
        type: 'object',
        properties: {
          previousValue: { type: 'number' },
          changePercentage: { type: 'number' },
        },
      },
    },
  },
};

/**
 * Migration functions for health metric events
 */
export const HEALTH_METRIC_MIGRATIONS = {
  // Upgrade from 1.0.0 to 1.1.0 (add trend fields with default values)
  '1.0.0->1.1.0': (event: IVersionedEvent<any>): IVersionedEvent<any> => {
    const newPayload = { ...event.payload, previousValue: null, changePercentage: 0 };
    return { ...event, version: VERSIONS.V1_1_0, payload: newPayload };
  },
  
  // Upgrade from 1.1.0 to 2.0.0 (restructure payload)
  '1.1.0->2.0.0': (event: IVersionedEvent<any>): IVersionedEvent<any> => {
    const { metricType, value, unit, timestamp, source, deviceId, previousValue, changePercentage, ...rest } = event.payload;
    
    const newPayload = {
      metric: {
        type: metricType,
        value,
        unit,
        recordedAt: timestamp,
      },
      source,
      ...(deviceId ? { deviceId } : {}),
      ...(previousValue || changePercentage ? {
        trend: {
          previousValue,
          changePercentage,
        },
      } : {}),
      ...rest,
    };
    
    return { ...event, version: VERSIONS.V2_0_0, payload: newPayload };
  },
  
  // Downgrade from 2.0.0 to 1.1.0 (flatten structure)
  '2.0.0->1.1.0': (event: IVersionedEvent<any>): IVersionedEvent<any> => {
    const { metric, source, deviceId, trend, ...rest } = event.payload;
    
    const newPayload = {
      metricType: metric.type,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.recordedAt,
      source,
      ...(deviceId ? { deviceId } : {}),
      ...(trend?.previousValue !== undefined ? { previousValue: trend.previousValue } : {}),
      ...(trend?.changePercentage !== undefined ? { changePercentage: trend.changePercentage } : {}),
      ...rest,
    };
    
    return { ...event, version: VERSIONS.V1_1_0, payload: newPayload };
  },
  
  // Downgrade from 1.1.0 to 1.0.0 (remove trend fields)
  '1.1.0->1.0.0': (event: IVersionedEvent<any>): IVersionedEvent<any> => {
    const { previousValue, changePercentage, ...payload } = event.payload;
    return { ...event, version: VERSIONS.V1_0_0, payload };
  },
};

/**
 * Migration scenarios for testing event transformations
 */
export const MIGRATION_SCENARIOS = [
  {
    name: 'Upgrade health metric from 1.0.0 to 1.1.0',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    targetVersion: VERSIONS.V1_1_0,
    migrationFunction: HEALTH_METRIC_MIGRATIONS['1.0.0->1.1.0'],
    expectedFields: ['previousValue', 'changePercentage'],
  },
  {
    name: 'Upgrade health metric from 1.1.0 to 2.0.0',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_1_0,
    targetVersion: VERSIONS.V2_0_0,
    migrationFunction: HEALTH_METRIC_MIGRATIONS['1.1.0->2.0.0'],
    expectedFields: ['metric', 'trend'],
  },
  {
    name: 'Downgrade health metric from 2.0.0 to 1.1.0',
    sourceEvent: HEALTH_METRIC_EVENTS.V2_0_0,
    targetVersion: VERSIONS.V1_1_0,
    migrationFunction: HEALTH_METRIC_MIGRATIONS['2.0.0->1.1.0'],
    expectedFields: ['metricType', 'value', 'unit', 'timestamp', 'previousValue', 'changePercentage'],
  },
  {
    name: 'Downgrade health metric from 1.1.0 to 1.0.0',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_1_0,
    targetVersion: VERSIONS.V1_0_0,
    migrationFunction: HEALTH_METRIC_MIGRATIONS['1.1.0->1.0.0'],
    unexpectedFields: ['previousValue', 'changePercentage'],
  },
];

// ===== VERSION VALIDATION AND EDGE CASES =====

/**
 * Test cases for version validation
 */
export const VERSION_VALIDATION_CASES = [
  {
    name: 'Valid version - 1.0.0',
    version: VERSIONS.V1_0_0,
    isValid: true,
  },
  {
    name: 'Valid version - 2.10.5',
    version: '2.10.5',
    isValid: true,
  },
  {
    name: 'Invalid format - missing patch',
    version: VERSIONS.INVALID,
    isValid: false,
  },
  {
    name: 'Invalid format - non-numeric',
    version: VERSIONS.INVALID_CHARS,
    isValid: false,
  },
  {
    name: 'Invalid format - negative number',
    version: VERSIONS.INVALID_NEGATIVE,
    isValid: false,
  },
  {
    name: 'Invalid format - empty string',
    version: '',
    isValid: false,
  },
  {
    name: 'Invalid format - null',
    version: null as unknown as string,
    isValid: false,
  },
  {
    name: 'Invalid format - undefined',
    version: undefined as unknown as string,
    isValid: false,
  },
];

/**
 * Edge cases for version detection and handling
 */
export const VERSION_EDGE_CASES = {
  /** Event with version in a non-standard field */
  CUSTOM_VERSION_FIELD: {
    ...baseEvent,
    version: undefined,
    schemaVersion: VERSIONS.V1_0_0,
    payload: {},
  },
  
  /** Event with version in metadata */
  VERSION_IN_METADATA: {
    ...baseEvent,
    version: undefined,
    metadata: {
      ...baseEvent.metadata,
      version: VERSIONS.V1_0_0,
    },
    payload: {},
  },
  
  /** Event with version in payload */
  VERSION_IN_PAYLOAD: {
    ...baseEvent,
    version: undefined,
    payload: {
      _version: VERSIONS.V1_0_0,
      data: {},
    },
  },
  
  /** Event with multiple conflicting versions */
  CONFLICTING_VERSIONS: {
    ...baseEvent,
    version: VERSIONS.V1_0_0,
    schemaVersion: VERSIONS.V1_1_0,
    payload: {
      _version: VERSIONS.V2_0_0,
    },
  },
  
  /** Event with malformed JSON in payload */
  MALFORMED_PAYLOAD: {
    ...baseEvent,
    payload: '{"malformed":true',
  },
};

/**
 * Test cases for version detection strategies
 */
export const VERSION_DETECTION_CASES = [
  {
    name: 'Explicit version field',
    event: VERSIONED_EVENTS.V1_0_0,
    strategy: 'explicit',
    expectedVersion: VERSIONS.V1_0_0,
  },
  {
    name: 'Version in custom field',
    event: VERSION_EDGE_CASES.CUSTOM_VERSION_FIELD,
    strategy: 'structure',
    fieldName: 'schemaVersion',
    expectedVersion: VERSIONS.V1_0_0,
  },
  {
    name: 'Version in metadata',
    event: VERSION_EDGE_CASES.VERSION_IN_METADATA,
    strategy: 'structure',
    fieldPath: 'metadata.version',
    expectedVersion: VERSIONS.V1_0_0,
  },
  {
    name: 'Version in payload',
    event: VERSION_EDGE_CASES.VERSION_IN_PAYLOAD,
    strategy: 'structure',
    fieldPath: 'payload._version',
    expectedVersion: VERSIONS.V1_0_0,
  },
  {
    name: 'Fallback to default version',
    event: VERSIONED_EVENTS.NO_VERSION,
    strategy: 'fallback',
    expectedVersion: VERSION_CONSTANTS.DEFAULT_VERSION,
  },
];

/**
 * Test cases for schema compatibility checking
 */
export const SCHEMA_COMPATIBILITY_CASES = [
  {
    name: 'Backward compatible - new schema can read old data',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_1_0],
    mode: 'backward',
    expectedResult: { compatible: true },
  },
  {
    name: 'Not backward compatible - new schema cannot read old data',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V2_0_0],
    mode: 'backward',
    expectedResult: { compatible: false },
  },
  {
    name: 'Forward compatible - old schema can read new data',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_1_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    mode: 'forward',
    expectedResult: { compatible: true },
  },
  {
    name: 'Not forward compatible - old schema cannot read new data',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V2_0_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    mode: 'forward',
    expectedResult: { compatible: false },
  },
  {
    name: 'Full compatibility - schemas are equivalent',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    mode: 'full',
    expectedResult: { compatible: true },
  },
  {
    name: 'Not fully compatible - schemas have differences',
    sourceSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    targetSchema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_1_0],
    mode: 'full',
    expectedResult: { compatible: false },
  },
];

// ===== TRANSFORMATION PIPELINE TEST CASES =====

/**
 * Field mapping test cases for transformation
 */
export const FIELD_MAPPING_CASES = [
  {
    name: 'Simple field mapping',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    fieldMappings: {
      'payload.metricType': 'payload.metricType',
      'payload.value': 'payload.value',
      'payload.unit': 'payload.unit',
      'payload.timestamp': 'payload.recordedAt',
    },
    expectedFields: ['metricType', 'value', 'unit', 'recordedAt'],
  },
  {
    name: 'Nested field mapping',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    fieldMappings: {
      'payload.metricType': 'payload.metric.type',
      'payload.value': 'payload.metric.value',
      'payload.unit': 'payload.metric.unit',
      'payload.timestamp': 'payload.metric.recordedAt',
      'payload.source': 'payload.source',
    },
    expectedFields: ['metric', 'source'],
    expectedNestedFields: ['metric.type', 'metric.value', 'metric.unit', 'metric.recordedAt'],
  },
  {
    name: 'Field transformation with defaults',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    fieldMappings: {
      'payload.metricType': 'payload.metricType',
      'payload.value': 'payload.value',
      'payload.unit': 'payload.unit',
      'payload.timestamp': 'payload.timestamp',
    },
    defaultValues: {
      'payload.previousValue': null,
      'payload.changePercentage': 0,
    },
    expectedFields: ['metricType', 'value', 'unit', 'timestamp', 'previousValue', 'changePercentage'],
  },
];

/**
 * Field transformer test cases
 */
export const FIELD_TRANSFORMER_CASES = [
  {
    name: 'Transform specific fields',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    fieldTransformers: {
      'payload.value': (value: number) => value * 2,
      'payload.metricType': (type: string) => type.toLowerCase(),
    },
    expectedTransforms: {
      'payload.value': HEALTH_METRIC_EVENTS.V1_0_0.payload.value * 2,
      'payload.metricType': HEALTH_METRIC_EVENTS.V1_0_0.payload.metricType.toLowerCase(),
    },
  },
  {
    name: 'Add calculated fields',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_1_0,
    fieldTransformers: {
      'payload.changePercentage': (value: number, event: any) => {
        if (event.payload.previousValue && event.payload.value) {
          return ((event.payload.value - event.payload.previousValue) / event.payload.previousValue) * 100;
        }
        return value;
      },
    },
    expectedTransforms: {
      'payload.changePercentage': ((HEALTH_METRIC_EVENTS.V1_1_0.payload.value - HEALTH_METRIC_EVENTS.V1_1_0.payload.previousValue) / HEALTH_METRIC_EVENTS.V1_1_0.payload.previousValue) * 100,
    },
  },
];

/**
 * Transformation pipeline test cases
 */
export const TRANSFORMATION_PIPELINE_CASES = [
  {
    name: 'Multi-step transformation',
    sourceEvent: HEALTH_METRIC_EVENTS.V1_0_0,
    pipeline: [
      // Step 1: Add trend fields
      (event: IVersionedEvent<any>) => ({
        ...event,
        payload: {
          ...event.payload,
          previousValue: 70,
          changePercentage: 7.14,
        },
      }),
      // Step 2: Update version
      (event: IVersionedEvent<any>) => ({
        ...event,
        version: VERSIONS.V1_1_0,
      }),
      // Step 3: Add metadata
      (event: IVersionedEvent<any>) => ({
        ...event,
        metadata: {
          ...event.metadata,
          migrated: true,
          migrationDate: new Date().toISOString(),
        },
      }),
    ],
    expectedVersion: VERSIONS.V1_1_0,
    expectedFields: ['previousValue', 'changePercentage'],
    expectedMetadataFields: ['migrated', 'migrationDate'],
  },
];

// ===== VERSIONING STRATEGY TEST CASES =====

/**
 * Test cases for versioning strategies
 */
export const VERSIONING_STRATEGY_CASES = [
  {
    name: 'Health journey strategy',
    eventTypes: [HealthEventType.METRIC_RECORDED, HealthEventType.GOAL_ACHIEVED],
    latestVersions: {
      [HealthEventType.METRIC_RECORDED]: VERSIONS.V2_0_0,
      [HealthEventType.GOAL_ACHIEVED]: VERSIONS.V1_1_0,
    },
    compatibilityMode: 'standard',
  },
  {
    name: 'Care journey strategy',
    eventTypes: [CareEventType.APPOINTMENT_BOOKED, CareEventType.MEDICATION_TAKEN],
    latestVersions: {
      [CareEventType.APPOINTMENT_BOOKED]: VERSIONS.V2_0_0,
      [CareEventType.MEDICATION_TAKEN]: VERSIONS.V1_0_0,
    },
    compatibilityMode: 'relaxed',
  },
  {
    name: 'Plan journey strategy',
    eventTypes: [PlanEventType.CLAIM_SUBMITTED, PlanEventType.BENEFIT_USED],
    latestVersions: {
      [PlanEventType.CLAIM_SUBMITTED]: VERSIONS.V2_0_0,
      [PlanEventType.BENEFIT_USED]: VERSIONS.V1_1_0,
    },
    compatibilityMode: 'strict',
  },
];

/**
 * Test cases for version registry operations
 */
export const VERSION_REGISTRY_CASES = [
  {
    name: 'Register and retrieve transformation',
    eventType: HealthEventType.METRIC_RECORDED,
    sourceVersion: VERSIONS.V1_0_0,
    targetVersion: VERSIONS.V1_1_0,
    transformation: HEALTH_METRIC_MIGRATIONS['1.0.0->1.1.0'],
  },
  {
    name: 'Register and retrieve schema',
    eventType: HealthEventType.METRIC_RECORDED,
    version: VERSIONS.V1_0_0,
    schema: HEALTH_METRIC_SCHEMAS[VERSIONS.V1_0_0],
    isLatest: false,
  },
  {
    name: 'Register latest schema',
    eventType: HealthEventType.METRIC_RECORDED,
    version: VERSIONS.V2_0_0,
    schema: HEALTH_METRIC_SCHEMAS[VERSIONS.V2_0_0],
    isLatest: true,
  },
];