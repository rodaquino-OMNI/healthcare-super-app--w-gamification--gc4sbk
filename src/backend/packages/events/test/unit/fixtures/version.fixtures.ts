/**
 * @file version.fixtures.ts
 * @description Provides test fixtures for event schema versioning, including events with different
 * schema versions, compatibility test cases, and version migration scenarios. These fixtures are
 * essential for testing the event versioning system, ensuring backward compatibility, and validating
 * version evolution strategies across the events package.
 */

import { EventVersionDto, VersionedEventDto } from '../../../src/dto/version.dto';
import { EventVersion, VersionCompatibilityResult, VersionMigrationPath } from '../../../src/interfaces/event-versioning.interface';
import { SUPPORTED_VERSIONS } from '../../../src/versioning/constants';

// ===================================================================
// Version Objects
// ===================================================================

/**
 * Collection of EventVersionDto objects for all supported versions
 */
export const versionObjects: Record<string, EventVersionDto> = {};

// Create version objects for all supported versions
SUPPORTED_VERSIONS.forEach(version => {
  versionObjects[version] = EventVersionDto.fromString(version);
});

/**
 * Specific version objects for easy reference
 */
export const versions = {
  v0_5_0: versionObjects['0.5.0'],
  v0_6_0: versionObjects['0.6.0'],
  v0_7_0: versionObjects['0.7.0'],
  v0_8_0: versionObjects['0.8.0'],
  v0_9_0: versionObjects['0.9.0'],
  v1_0_0: versionObjects['1.0.0'],
  // Invalid versions for testing error cases
  invalid: { major: -1, minor: 0, patch: 0 } as EventVersion,
  future: new EventVersionDto(2, 0, 0),
  preRelease: new EventVersionDto(0, 4, 0),
};

// ===================================================================
// Mock Events with Different Versions
// ===================================================================

/**
 * Health metric event payloads for different versions
 */
export const healthMetricPayloads = {
  v0_5_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
  },
  v0_6_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
    source: 'MANUAL_ENTRY', // Added in v0.6.0
  },
  v0_7_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
    source: 'MANUAL_ENTRY',
    deviceId: null, // Added in v0.7.0, optional
  },
  v0_8_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
    source: 'MANUAL_ENTRY',
    deviceId: null,
    notes: '', // Added in v0.8.0, optional
  },
  v0_9_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
    source: 'MANUAL_ENTRY',
    deviceId: null,
    notes: '',
    location: null, // Added in v0.9.0, optional
  },
  v1_0_0: {
    userId: 'user123',
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-01-15T08:30:00Z',
    source: 'MANUAL_ENTRY',
    deviceId: null,
    notes: '',
    location: null,
    tags: [], // Added in v1.0.0, optional
  },
};

/**
 * Appointment event payloads for different versions
 */
export const appointmentPayloads = {
  v0_5_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
  },
  v0_6_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
    specialtyId: 'cardiology', // Added in v0.6.0
  },
  v0_7_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
    specialtyId: 'cardiology',
    locationId: 'location789', // Added in v0.7.0
  },
  v0_8_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
    specialtyId: 'cardiology',
    locationId: 'location789',
    notes: '', // Added in v0.8.0, optional
  },
  v0_9_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
    specialtyId: 'cardiology',
    locationId: 'location789',
    notes: '',
    isTelemedicine: false, // Added in v0.9.0
  },
  v1_0_0: {
    userId: 'user123',
    providerId: 'provider456',
    appointmentDate: '2023-02-10T14:00:00Z',
    status: 'SCHEDULED',
    specialtyId: 'cardiology',
    locationId: 'location789',
    notes: '',
    isTelemedicine: false,
    reminderSent: false, // Added in v1.0.0
  },
};

/**
 * Claim event payloads for different versions
 */
export const claimPayloads = {
  v0_5_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
  },
  v0_6_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo', // Added in v0.6.0
  },
  v0_7_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo',
    serviceDate: '2023-01-20T00:00:00Z', // Added in v0.7.0
  },
  v0_8_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo',
    serviceDate: '2023-01-20T00:00:00Z',
    documentIds: [], // Added in v0.8.0
  },
  v0_9_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo',
    serviceDate: '2023-01-20T00:00:00Z',
    documentIds: [],
    notes: '', // Added in v0.9.0, optional
  },
  v1_0_0: {
    userId: 'user123',
    claimType: 'MEDICAL',
    amount: 150.0,
    currency: 'BRL',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo',
    serviceDate: '2023-01-20T00:00:00Z',
    documentIds: [],
    notes: '',
    reimbursementMethod: 'BANK_ACCOUNT', // Added in v1.0.0
  },
};

/**
 * Create versioned events for all supported versions and event types
 */
export const createVersionedEvents = () => {
  const events: Record<string, Record<string, VersionedEventDto>> = {
    healthMetric: {},
    appointment: {},
    claim: {},
  };

  // Create health metric events for all versions
  Object.keys(healthMetricPayloads).forEach(versionKey => {
    const version = versions[versionKey as keyof typeof versions];
    const payload = healthMetricPayloads[versionKey as keyof typeof healthMetricPayloads];
    events.healthMetric[versionKey] = new VersionedEventDto(
      'health.metric.recorded',
      payload,
      version,
      { journey: 'health' }
    );
  });

  // Create appointment events for all versions
  Object.keys(appointmentPayloads).forEach(versionKey => {
    const version = versions[versionKey as keyof typeof versions];
    const payload = appointmentPayloads[versionKey as keyof typeof appointmentPayloads];
    events.appointment[versionKey] = new VersionedEventDto(
      'care.appointment.scheduled',
      payload,
      version,
      { journey: 'care' }
    );
  });

  // Create claim events for all versions
  Object.keys(claimPayloads).forEach(versionKey => {
    const version = versions[versionKey as keyof typeof versions];
    const payload = claimPayloads[versionKey as keyof typeof claimPayloads];
    events.claim[versionKey] = new VersionedEventDto(
      'plan.claim.submitted',
      payload,
      version,
      { journey: 'plan' }
    );
  });

  return events;
};

/**
 * Pre-created versioned events for all supported versions and event types
 */
export const versionedEvents = createVersionedEvents();

// ===================================================================
// Compatibility Test Cases
// ===================================================================

/**
 * Compatibility test cases for different version combinations
 */
export const compatibilityTestCases: Array<{
  sourceVersion: EventVersion;
  targetVersion: EventVersion;
  expectedResult: VersionCompatibilityResult;
  description: string;
}> = [
  // Exact match cases
  {
    sourceVersion: versions.v0_5_0,
    targetVersion: versions.v0_5_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'exact',
      migrationRequired: false,
      sourceVersion: versions.v0_5_0,
      targetVersion: versions.v0_5_0,
    },
    description: 'Exact match: v0.5.0 to v0.5.0',
  },
  {
    sourceVersion: versions.v1_0_0,
    targetVersion: versions.v1_0_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'exact',
      migrationRequired: false,
      sourceVersion: versions.v1_0_0,
      targetVersion: versions.v1_0_0,
    },
    description: 'Exact match: v1.0.0 to v1.0.0',
  },
  
  // Backward compatibility cases (newer to older, same major)
  {
    sourceVersion: versions.v0_6_0,
    targetVersion: versions.v0_5_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'backward',
      migrationRequired: false,
      sourceVersion: versions.v0_6_0,
      targetVersion: versions.v0_5_0,
    },
    description: 'Backward compatibility: v0.6.0 to v0.5.0',
  },
  {
    sourceVersion: versions.v1_0_0,
    targetVersion: versions.v0_9_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'backward',
      migrationRequired: false,
      sourceVersion: versions.v1_0_0,
      targetVersion: versions.v0_9_0,
    },
    description: 'Backward compatibility: v1.0.0 to v0.9.0',
  },
  
  // Forward compatibility cases (older to newer, same major)
  {
    sourceVersion: versions.v0_5_0,
    targetVersion: versions.v0_6_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'forward',
      migrationRequired: true,
      sourceVersion: versions.v0_5_0,
      targetVersion: versions.v0_6_0,
    },
    description: 'Forward compatibility: v0.5.0 to v0.6.0',
  },
  {
    sourceVersion: versions.v0_8_0,
    targetVersion: versions.v1_0_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'forward',
      migrationRequired: true,
      sourceVersion: versions.v0_8_0,
      targetVersion: versions.v1_0_0,
    },
    description: 'Forward compatibility: v0.8.0 to v1.0.0',
  },
  
  // Incompatible cases (different major versions)
  {
    sourceVersion: versions.future,
    targetVersion: versions.v1_0_0,
    expectedResult: {
      compatible: false,
      compatibilityType: 'none',
      reason: 'Major version mismatch: 2 vs 1',
      migrationRequired: true,
      sourceVersion: versions.future,
      targetVersion: versions.v1_0_0,
    },
    description: 'Incompatible: v2.0.0 to v1.0.0 (different major versions)',
  },
  
  // Edge cases
  {
    sourceVersion: versions.preRelease,
    targetVersion: versions.v0_5_0,
    expectedResult: {
      compatible: true,
      compatibilityType: 'forward',
      migrationRequired: true,
      sourceVersion: versions.preRelease,
      targetVersion: versions.v0_5_0,
    },
    description: 'Edge case: Pre-release v0.4.0 to v0.5.0',
  },
];

// ===================================================================
// Migration Scenarios
// ===================================================================

/**
 * Migration paths for testing version transformation
 */
export const migrationPaths: VersionMigrationPath[] = [
  // Health metric v0.5.0 to v0.6.0 (add source field)
  {
    sourceVersion: versions.v0_5_0,
    targetVersion: versions.v0_6_0,
    migrate: (sourceEvent) => {
      const payload = { ...sourceEvent.payload as any };
      // Add source field with default value
      payload.source = 'MANUAL_ENTRY';
      return new VersionedEventDto(
        sourceEvent.type,
        payload,
        versions.v0_6_0,
        sourceEvent.metadata
      );
    },
  },
  
  // Health metric v0.6.0 to v0.7.0 (add deviceId field)
  {
    sourceVersion: versions.v0_6_0,
    targetVersion: versions.v0_7_0,
    migrate: (sourceEvent) => {
      const payload = { ...sourceEvent.payload as any };
      // Add deviceId field with null default
      payload.deviceId = null;
      return new VersionedEventDto(
        sourceEvent.type,
        payload,
        versions.v0_7_0,
        sourceEvent.metadata
      );
    },
  },
  
  // Appointment v0.5.0 to v0.6.0 (add specialtyId field)
  {
    sourceVersion: versions.v0_5_0,
    targetVersion: versions.v0_6_0,
    migrate: (sourceEvent) => {
      const payload = { ...sourceEvent.payload as any };
      // Add specialtyId field with default value
      payload.specialtyId = 'general';
      return new VersionedEventDto(
        sourceEvent.type,
        payload,
        versions.v0_6_0,
        sourceEvent.metadata
      );
    },
  },
  
  // Claim v0.6.0 to v0.7.0 (add serviceDate field)
  {
    sourceVersion: versions.v0_6_0,
    targetVersion: versions.v0_7_0,
    migrate: (sourceEvent) => {
      const payload = { ...sourceEvent.payload as any };
      // Add serviceDate field with current date
      payload.serviceDate = new Date().toISOString();
      return new VersionedEventDto(
        sourceEvent.type,
        payload,
        versions.v0_7_0,
        sourceEvent.metadata
      );
    },
  },
  
  // Downgrade: Health metric v0.6.0 to v0.5.0 (remove source field)
  {
    sourceVersion: versions.v0_6_0,
    targetVersion: versions.v0_5_0,
    migrate: (sourceEvent) => {
      const { source, ...payload } = sourceEvent.payload as any;
      return new VersionedEventDto(
        sourceEvent.type,
        payload,
        versions.v0_5_0,
        sourceEvent.metadata
      );
    },
  },
];

/**
 * Migration test scenarios for testing version transformation
 */
export const migrationTestScenarios: Array<{
  sourceEvent: VersionedEventDto;
  targetVersion: EventVersion;
  expectedFields: string[];
  removedFields: string[];
  description: string;
}> = [
  // Upgrade scenarios
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    expectedFields: ['userId', 'metricType', 'value', 'unit', 'recordedAt', 'source'],
    removedFields: [],
    description: 'Upgrade health metric from v0.5.0 to v0.6.0 (add source field)',
  },
  {
    sourceEvent: versionedEvents.appointment.v0_5_0,
    targetVersion: versions.v0_6_0,
    expectedFields: ['userId', 'providerId', 'appointmentDate', 'status', 'specialtyId'],
    removedFields: [],
    description: 'Upgrade appointment from v0.5.0 to v0.6.0 (add specialtyId field)',
  },
  {
    sourceEvent: versionedEvents.claim.v0_6_0,
    targetVersion: versions.v0_7_0,
    expectedFields: ['userId', 'claimType', 'amount', 'currency', 'status', 'providerName', 'serviceDate'],
    removedFields: [],
    description: 'Upgrade claim from v0.6.0 to v0.7.0 (add serviceDate field)',
  },
  
  // Downgrade scenarios
  {
    sourceEvent: versionedEvents.healthMetric.v0_6_0,
    targetVersion: versions.v0_5_0,
    expectedFields: ['userId', 'metricType', 'value', 'unit', 'recordedAt'],
    removedFields: ['source'],
    description: 'Downgrade health metric from v0.6.0 to v0.5.0 (remove source field)',
  },
  {
    sourceEvent: versionedEvents.appointment.v0_7_0,
    targetVersion: versions.v0_6_0,
    expectedFields: ['userId', 'providerId', 'appointmentDate', 'status', 'specialtyId'],
    removedFields: ['locationId'],
    description: 'Downgrade appointment from v0.7.0 to v0.6.0 (remove locationId field)',
  },
  
  // Multi-step migration
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_7_0,
    expectedFields: ['userId', 'metricType', 'value', 'unit', 'recordedAt', 'source', 'deviceId'],
    removedFields: [],
    description: 'Multi-step upgrade health metric from v0.5.0 to v0.7.0',
  },
];

// ===================================================================
// Validation Test Cases
// ===================================================================

/**
 * Invalid event test cases for validation testing
 */
export const invalidEventTestCases: Array<{
  event: any;
  errorType: string;
  description: string;
}> = [
  // Missing version
  {
    event: {
      type: 'health.metric.recorded',
      payload: healthMetricPayloads.v1_0_0,
    },
    errorType: 'MissingVersionError',
    description: 'Event with missing version field',
  },
  
  // Invalid version format
  {
    event: {
      type: 'health.metric.recorded',
      version: 'not-a-version',
      payload: healthMetricPayloads.v1_0_0,
    },
    errorType: 'InvalidVersionFormatError',
    description: 'Event with invalid version format',
  },
  
  // Unsupported version
  {
    event: {
      type: 'health.metric.recorded',
      version: '3.0.0',
      payload: healthMetricPayloads.v1_0_0,
    },
    errorType: 'UnsupportedVersionError',
    description: 'Event with unsupported version',
  },
  
  // Missing type
  {
    event: {
      version: '1.0.0',
      payload: healthMetricPayloads.v1_0_0,
    },
    errorType: 'MissingTypeError',
    description: 'Event with missing type field',
  },
  
  // Missing payload
  {
    event: {
      type: 'health.metric.recorded',
      version: '1.0.0',
    },
    errorType: 'MissingPayloadError',
    description: 'Event with missing payload field',
  },
  
  // Invalid payload type
  {
    event: {
      type: 'health.metric.recorded',
      version: '1.0.0',
      payload: 'not-an-object',
    },
    errorType: 'InvalidPayloadTypeError',
    description: 'Event with invalid payload type (string instead of object)',
  },
];

/**
 * Edge cases for version handling
 */
export const versionEdgeCases: Array<{
  input: any;
  expectedOutput: any;
  description: string;
}> = [
  // Version string with extra parts
  {
    input: '1.0.0.beta',
    expectedOutput: null, // Should throw an error
    description: 'Version string with extra parts',
  },
  
  // Version with non-numeric parts
  {
    input: '1.0.beta',
    expectedOutput: null, // Should throw an error
    description: 'Version with non-numeric parts',
  },
  
  // Version with negative numbers
  {
    input: '1.-1.0',
    expectedOutput: null, // Should throw an error
    description: 'Version with negative numbers',
  },
  
  // Empty version string
  {
    input: '',
    expectedOutput: null, // Should throw an error
    description: 'Empty version string',
  },
  
  // Version with very large numbers
  {
    input: '9999999.9999999.9999999',
    expectedOutput: new EventVersionDto(9999999, 9999999, 9999999),
    description: 'Version with very large numbers',
  },
];

// ===================================================================
// Version Transformation Test Cases
// ===================================================================

/**
 * Test cases for version transformation options
 */
export const transformationOptionTestCases: Array<{
  sourceEvent: VersionedEventDto;
  targetVersion: EventVersion;
  options: any;
  description: string;
}> = [
  // Validate result
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    options: { validate: true },
    description: 'Transform with validation enabled',
  },
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    options: { validate: false },
    description: 'Transform with validation disabled',
  },
  
  // Throw on validation error
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    options: { throwOnValidationError: true },
    description: 'Transform with throwOnValidationError enabled',
  },
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    options: { throwOnValidationError: false },
    description: 'Transform with throwOnValidationError disabled',
  },
  
  // Preserve extra fields
  {
    sourceEvent: versionedEvents.healthMetric.v1_0_0,
    targetVersion: versions.v0_5_0,
    options: { preserveExtraFields: true },
    description: 'Downgrade with preserveExtraFields enabled',
  },
  {
    sourceEvent: versionedEvents.healthMetric.v1_0_0,
    targetVersion: versions.v0_5_0,
    options: { preserveExtraFields: false },
    description: 'Downgrade with preserveExtraFields disabled',
  },
  
  // Custom context
  {
    sourceEvent: versionedEvents.healthMetric.v0_5_0,
    targetVersion: versions.v0_6_0,
    options: { context: { userId: 'user123', journeyType: 'health' } },
    description: 'Transform with custom context',
  },
];

// ===================================================================
// Version Detection Test Cases
// ===================================================================

/**
 * Test cases for version detection strategies
 */
export const versionDetectionTestCases: Array<{
  input: any;
  expectedVersion: EventVersion | null;
  strategy: string;
  description: string;
}> = [
  // Explicit field strategy
  {
    input: { version: '1.0.0', type: 'test', payload: {} },
    expectedVersion: versions.v1_0_0,
    strategy: 'explicit',
    description: 'Detect version from explicit version field',
  },
  {
    input: { schemaVersion: '0.9.0', type: 'test', payload: {} },
    expectedVersion: versions.v0_9_0,
    strategy: 'explicit',
    description: 'Detect version from schemaVersion field',
  },
  {
    input: { eventVersion: '0.8.0', type: 'test', payload: {} },
    expectedVersion: versions.v0_8_0,
    strategy: 'explicit',
    description: 'Detect version from eventVersion field',
  },
  
  // Header strategy
  {
    input: { headers: { 'x-event-version': '1.0.0' }, body: { type: 'test', payload: {} } },
    expectedVersion: versions.v1_0_0,
    strategy: 'header',
    description: 'Detect version from x-event-version header',
  },
  {
    input: { headers: { 'x-schema-version': '0.7.0' }, body: { type: 'test', payload: {} } },
    expectedVersion: versions.v0_7_0,
    strategy: 'header',
    description: 'Detect version from x-schema-version header',
  },
  
  // Structure-based strategy
  {
    input: { type: 'health.metric.recorded', payload: healthMetricPayloads.v0_5_0 },
    expectedVersion: versions.v0_5_0,
    strategy: 'structure',
    description: 'Detect version from event structure (health metric v0.5.0)',
  },
  {
    input: { type: 'health.metric.recorded', payload: healthMetricPayloads.v0_6_0 },
    expectedVersion: versions.v0_6_0,
    strategy: 'structure',
    description: 'Detect version from event structure (health metric v0.6.0)',
  },
  {
    input: { type: 'care.appointment.scheduled', payload: appointmentPayloads.v0_7_0 },
    expectedVersion: versions.v0_7_0,
    strategy: 'structure',
    description: 'Detect version from event structure (appointment v0.7.0)',
  },
  
  // Fallback strategy
  {
    input: { type: 'unknown.event', payload: {} },
    expectedVersion: versions.v1_0_0, // Latest version as fallback
    strategy: 'fallback',
    description: 'Use fallback strategy for unknown event structure',
  },
];

// ===================================================================
// Export all fixtures
// ===================================================================

export default {
  versions,
  versionObjects,
  healthMetricPayloads,
  appointmentPayloads,
  claimPayloads,
  versionedEvents,
  compatibilityTestCases,
  migrationPaths,
  migrationTestScenarios,
  invalidEventTestCases,
  versionEdgeCases,
  transformationOptionTestCases,
  versionDetectionTestCases,
};