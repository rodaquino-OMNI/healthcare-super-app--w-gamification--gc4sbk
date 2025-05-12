/**
 * @file event-versions.ts
 * @description Test fixtures for verifying event versioning capabilities and schema evolution.
 * This file provides event samples of the same type but with different versions, allowing tests
 * to verify backward compatibility, upgrade paths, and version handling strategies.
 */

import { v4 as uuidv4 } from 'uuid';
import { EventVersion, VersionCompatibility } from '../../src/interfaces/event-versioning.interface';
import { VersionedEventDto, EventVersionDto } from '../../src/dto/version.dto';

// Constants for common versions used in tests
export const VERSIONS = {
  V1_0_0: { major: 1, minor: 0, patch: 0 },
  V1_1_0: { major: 1, minor: 1, patch: 0 },
  V1_2_0: { major: 1, minor: 2, patch: 0 },
  V1_0_1: { major: 1, minor: 0, patch: 1 },
  V2_0_0: { major: 2, minor: 0, patch: 0 },
  V3_0_0: { major: 3, minor: 0, patch: 0 },
};

// Constants for expected compatibility results
export const COMPATIBILITY_RESULTS = {
  // Same version is always compatible
  SAME_VERSION: VersionCompatibility.COMPATIBLE,
  
  // Minor version changes are backward compatible
  MINOR_UPGRADE: VersionCompatibility.BACKWARD_COMPATIBLE,
  MINOR_DOWNGRADE: VersionCompatibility.FORWARD_COMPATIBLE,
  
  // Patch version changes are fully compatible
  PATCH_CHANGE: VersionCompatibility.COMPATIBLE,
  
  // Major version changes are incompatible
  MAJOR_CHANGE: VersionCompatibility.INCOMPATIBLE,
};

/**
 * Helper function to create a versioned event with a specific version
 */
function createVersionedEvent<T>(type: string, payload: T, version: EventVersion, userId = '123e4567-e89b-12d3-a456-426614174000'): VersionedEventDto<T> {
  return new VersionedEventDto<T>(
    type,
    payload,
    version,
    {
      userId,
      timestamp: new Date().toISOString(),
      correlationId: uuidv4(),
      source: 'test',
    }
  );
}

// ===== HEALTH JOURNEY EVENT VERSIONS =====

/**
 * Health Metric Event - Version 1.0.0
 * Initial version with basic fields
 */
export const healthMetricEventV1_0_0 = createVersionedEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-05-15T10:30:00Z',
    source: 'MANUAL_ENTRY',
  },
  VERSIONS.V1_0_0
);

/**
 * Health Metric Event - Version 1.1.0
 * Non-breaking change: Added optional fields (deviceId, notes)
 */
export const healthMetricEventV1_1_0 = createVersionedEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricType: 'HEART_RATE',
    value: 75,
    unit: 'bpm',
    recordedAt: '2023-05-15T10:30:00Z',
    source: 'MANUAL_ENTRY',
    deviceId: 'device-123', // New optional field
    notes: 'After morning exercise', // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Health Metric Event - Version 2.0.0
 * Breaking change: Restructured payload (nested values, renamed fields)
 */
export const healthMetricEventV2_0_0 = createVersionedEvent(
  'HEALTH_METRIC_RECORDED',
  {
    metricType: 'HEART_RATE',
    measurement: { // Restructured: value and unit now nested under measurement
      value: 75,
      unit: 'bpm',
    },
    metadata: { // Restructured: metadata fields grouped
      recordedAt: '2023-05-15T10:30:00Z',
      source: 'MANUAL_ENTRY',
      deviceId: 'device-123',
      notes: 'After morning exercise',
    },
    context: { // New field structure
      location: 'home',
      activity: 'resting',
    },
  },
  VERSIONS.V2_0_0
);

/**
 * Health Goal Event - Version 1.0.0
 * Initial version with basic fields
 */
export const healthGoalEventV1_0_0 = createVersionedEvent(
  'HEALTH_GOAL_CREATED',
  {
    goalType: 'STEPS',
    targetValue: 10000,
    unit: 'steps',
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-05-31T23:59:59Z',
    frequency: 'DAILY',
  },
  VERSIONS.V1_0_0
);

/**
 * Health Goal Event - Version 1.1.0
 * Non-breaking change: Added optional fields (reminderEnabled, priority)
 */
export const healthGoalEventV1_1_0 = createVersionedEvent(
  'HEALTH_GOAL_CREATED',
  {
    goalType: 'STEPS',
    targetValue: 10000,
    unit: 'steps',
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-05-31T23:59:59Z',
    frequency: 'DAILY',
    reminderEnabled: true, // New optional field
    priority: 'HIGH', // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Health Goal Event - Version 2.0.0
 * Breaking change: Changed field types and structure
 */
export const healthGoalEventV2_0_0 = createVersionedEvent(
  'HEALTH_GOAL_CREATED',
  {
    goalType: 'STEPS',
    target: { // Restructured: value and unit now nested under target
      value: 10000,
      unit: 'steps',
    },
    schedule: { // Restructured: date fields grouped under schedule
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-05-31T23:59:59Z',
      frequency: 'DAILY',
      reminderTime: '08:00:00', // New field
    },
    settings: { // New structure for settings
      reminderEnabled: true,
      priority: 'HIGH',
      visibility: 'PUBLIC', // New field
    },
    milestones: [ // New array field for milestones
      { value: 2500, reward: 10 },
      { value: 5000, reward: 20 },
      { value: 7500, reward: 30 },
      { value: 10000, reward: 50 },
    ],
  },
  VERSIONS.V2_0_0
);

// ===== CARE JOURNEY EVENT VERSIONS =====

/**
 * Appointment Event - Version 1.0.0
 * Initial version with basic fields
 */
export const appointmentEventV1_0_0 = createVersionedEvent(
  'APPOINTMENT_BOOKED',
  {
    providerId: 'provider-123',
    specialtyId: 'specialty-456',
    appointmentDate: '2023-06-15T14:30:00Z',
    duration: 30, // minutes
    location: 'CLINIC',
    status: 'SCHEDULED',
  },
  VERSIONS.V1_0_0
);

/**
 * Appointment Event - Version 1.1.0
 * Non-breaking change: Added optional fields (reason, notes, virtual)
 */
export const appointmentEventV1_1_0 = createVersionedEvent(
  'APPOINTMENT_BOOKED',
  {
    providerId: 'provider-123',
    specialtyId: 'specialty-456',
    appointmentDate: '2023-06-15T14:30:00Z',
    duration: 30, // minutes
    location: 'CLINIC',
    status: 'SCHEDULED',
    reason: 'Annual checkup', // New optional field
    notes: 'First visit with this provider', // New optional field
    virtual: false, // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Appointment Event - Version 2.0.0
 * Breaking change: Restructured payload and changed field types
 */
export const appointmentEventV2_0_0 = createVersionedEvent(
  'APPOINTMENT_BOOKED',
  {
    provider: { // Restructured: provider details grouped
      id: 'provider-123',
      specialtyId: 'specialty-456',
      name: 'Dr. Smith', // New field
    },
    schedule: { // Restructured: timing details grouped
      startTime: '2023-06-15T14:30:00Z',
      endTime: '2023-06-15T15:00:00Z', // Changed from duration to explicit end time
      timeZone: 'America/Sao_Paulo', // New field
    },
    details: { // Restructured: appointment details grouped
      location: 'CLINIC',
      status: 'SCHEDULED',
      reason: 'Annual checkup',
      notes: 'First visit with this provider',
      virtual: false,
    },
    patient: { // New structure for patient details
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João Silva',
      contactPhone: '+5511999999999',
    },
    reminders: [ // New array field for reminders
      { type: 'SMS', scheduledFor: '2023-06-14T14:30:00Z' },
      { type: 'EMAIL', scheduledFor: '2023-06-15T08:30:00Z' },
    ],
  },
  VERSIONS.V2_0_0
);

/**
 * Medication Event - Version 1.0.0
 * Initial version with basic fields
 */
export const medicationEventV1_0_0 = createVersionedEvent(
  'MEDICATION_TAKEN',
  {
    medicationId: 'med-123',
    name: 'Aspirin',
    dosage: '100mg',
    takenAt: '2023-05-15T08:00:00Z',
    scheduled: true,
  },
  VERSIONS.V1_0_0
);

/**
 * Medication Event - Version 1.1.0
 * Non-breaking change: Added optional fields (notes, mealRelation)
 */
export const medicationEventV1_1_0 = createVersionedEvent(
  'MEDICATION_TAKEN',
  {
    medicationId: 'med-123',
    name: 'Aspirin',
    dosage: '100mg',
    takenAt: '2023-05-15T08:00:00Z',
    scheduled: true,
    notes: 'Taken with water', // New optional field
    mealRelation: 'AFTER_MEAL', // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Medication Event - Version 2.0.0
 * Breaking change: Restructured payload and changed field types
 */
export const medicationEventV2_0_0 = createVersionedEvent(
  'MEDICATION_TAKEN',
  {
    medication: { // Restructured: medication details grouped
      id: 'med-123',
      name: 'Aspirin',
      dosage: { // Restructured: dosage as structured data
        value: 100,
        unit: 'mg',
        form: 'TABLET',
        quantity: 1,
      },
    },
    adherence: { // Restructured: adherence details grouped
      status: 'TAKEN', // Changed from implicit in event type to explicit status
      scheduledTime: '2023-05-15T08:00:00Z',
      actualTime: '2023-05-15T08:05:00Z', // New field: actual time vs scheduled
      deviation: 5, // New field: minutes of deviation
      scheduled: true,
    },
    context: { // New structure for context
      notes: 'Taken with water',
      mealRelation: 'AFTER_MEAL',
      location: 'HOME', // New field
    },
    reminder: { // New structure for reminder details
      sent: true,
      sentAt: '2023-05-15T07:45:00Z',
      acknowledged: true,
    },
  },
  VERSIONS.V2_0_0
);

// ===== PLAN JOURNEY EVENT VERSIONS =====

/**
 * Claim Event - Version 1.0.0
 * Initial version with basic fields
 */
export const claimEventV1_0_0 = createVersionedEvent(
  'CLAIM_SUBMITTED',
  {
    claimId: 'claim-123',
    claimType: 'MEDICAL_CONSULTATION',
    amount: 150.00,
    currency: 'BRL',
    serviceDate: '2023-04-10T15:30:00Z',
    status: 'SUBMITTED',
  },
  VERSIONS.V1_0_0
);

/**
 * Claim Event - Version 1.1.0
 * Non-breaking change: Added optional fields (providerName, receiptUrl)
 */
export const claimEventV1_1_0 = createVersionedEvent(
  'CLAIM_SUBMITTED',
  {
    claimId: 'claim-123',
    claimType: 'MEDICAL_CONSULTATION',
    amount: 150.00,
    currency: 'BRL',
    serviceDate: '2023-04-10T15:30:00Z',
    status: 'SUBMITTED',
    providerName: 'Clínica São Paulo', // New optional field
    receiptUrl: 'https://storage.austa.com.br/receipts/claim-123.pdf', // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Claim Event - Version 2.0.0
 * Breaking change: Restructured payload and changed field types
 */
export const claimEventV2_0_0 = createVersionedEvent(
  'CLAIM_SUBMITTED',
  {
    id: 'claim-123', // Renamed from claimId
    type: 'MEDICAL_CONSULTATION', // Renamed from claimType
    financial: { // Restructured: financial details grouped
      amount: 150.00,
      currency: 'BRL',
      reimbursementPercentage: 80, // New field
      estimatedReimbursement: 120.00, // New field
    },
    service: { // Restructured: service details grouped
      date: '2023-04-10T15:30:00Z', // Renamed from serviceDate
      provider: { // New structure for provider
        name: 'Clínica São Paulo',
        id: 'provider-456',
        network: 'IN_NETWORK', // New field
      },
      category: 'CONSULTATION', // New field
      specialty: 'CARDIOLOGY', // New field
    },
    documents: [ // Changed from single receiptUrl to array of documents
      {
        type: 'RECEIPT',
        url: 'https://storage.austa.com.br/receipts/claim-123.pdf',
        uploadedAt: '2023-04-10T16:45:00Z',
      },
      {
        type: 'MEDICAL_REPORT',
        url: 'https://storage.austa.com.br/reports/claim-123.pdf',
        uploadedAt: '2023-04-10T16:50:00Z',
      },
    ],
    status: {
      current: 'SUBMITTED', // Renamed from status
      updatedAt: '2023-04-10T16:55:00Z', // New field
      history: [ // New array for status history
        { status: 'DRAFT', timestamp: '2023-04-10T16:40:00Z' },
        { status: 'SUBMITTED', timestamp: '2023-04-10T16:55:00Z' },
      ],
    },
  },
  VERSIONS.V2_0_0
);

/**
 * Benefit Event - Version 1.0.0
 * Initial version with basic fields
 */
export const benefitEventV1_0_0 = createVersionedEvent(
  'BENEFIT_UTILIZED',
  {
    benefitId: 'benefit-123',
    benefitType: 'GYM_MEMBERSHIP',
    utilizedAt: '2023-05-20T10:00:00Z',
    status: 'UTILIZED',
  },
  VERSIONS.V1_0_0
);

/**
 * Benefit Event - Version 1.1.0
 * Non-breaking change: Added optional fields (location, value)
 */
export const benefitEventV1_1_0 = createVersionedEvent(
  'BENEFIT_UTILIZED',
  {
    benefitId: 'benefit-123',
    benefitType: 'GYM_MEMBERSHIP',
    utilizedAt: '2023-05-20T10:00:00Z',
    status: 'UTILIZED',
    location: 'Academia SmartFit - Paulista', // New optional field
    value: 100.00, // New optional field
  },
  VERSIONS.V1_1_0
);

/**
 * Benefit Event - Version 2.0.0
 * Breaking change: Restructured payload and changed field types
 */
export const benefitEventV2_0_0 = createVersionedEvent(
  'BENEFIT_UTILIZED',
  {
    benefit: { // Restructured: benefit details grouped
      id: 'benefit-123', // Renamed from benefitId
      type: 'GYM_MEMBERSHIP', // Renamed from benefitType
      name: 'Academia Premium', // New field
      category: 'WELLNESS', // New field
    },
    utilization: { // Restructured: utilization details grouped
      timestamp: '2023-05-20T10:00:00Z', // Renamed from utilizedAt
      status: 'UTILIZED',
      location: {
        name: 'Academia SmartFit - Paulista',
        address: 'Av. Paulista, 1000', // New field
        coordinates: { // New structure
          latitude: -23.5505,
          longitude: -46.6333,
        },
      },
    },
    financial: { // New structure for financial details
      value: 100.00,
      currency: 'BRL',
      remainingBalance: 400.00, // New field
      periodUsage: { // New structure
        used: 100.00,
        total: 500.00,
        periodStart: '2023-05-01T00:00:00Z',
        periodEnd: '2023-05-31T23:59:59Z',
      },
    },
    gamification: { // New structure for gamification
      pointsEarned: 50,
      achievements: ['WELLNESS_WARRIOR'],
    },
  },
  VERSIONS.V2_0_0
);

// ===== MIGRATION TEST CASES =====

/**
 * Migration test case: Health Metric Event V1.0.0 to V1.1.0
 * Demonstrates a non-breaking change migration (adding optional fields)
 */
export const healthMetricMigrationV1_0_0_to_V1_1_0 = {
  source: healthMetricEventV1_0_0,
  target: healthMetricEventV1_1_0,
  compatibility: VersionCompatibility.BACKWARD_COMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const newPayload = { ...event.payload, deviceId: null, notes: null };
    return event.withPayload(newPayload, VERSIONS.V1_1_0);
  },
};

/**
 * Migration test case: Health Metric Event V1.1.0 to V2.0.0
 * Demonstrates a breaking change migration (restructuring fields)
 */
export const healthMetricMigrationV1_1_0_to_V2_0_0 = {
  source: healthMetricEventV1_1_0,
  target: healthMetricEventV2_0_0,
  compatibility: VersionCompatibility.INCOMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const { value, unit, recordedAt, source, deviceId, notes, ...rest } = event.payload;
    
    const newPayload = {
      ...rest,
      metricType: event.payload.metricType,
      measurement: { value, unit },
      metadata: { recordedAt, source, deviceId, notes },
      context: { location: 'unknown', activity: 'unknown' },
    };
    
    return event.withPayload(newPayload, VERSIONS.V2_0_0);
  },
};

/**
 * Migration test case: Appointment Event V1.0.0 to V1.1.0
 * Demonstrates a non-breaking change migration (adding optional fields)
 */
export const appointmentMigrationV1_0_0_to_V1_1_0 = {
  source: appointmentEventV1_0_0,
  target: appointmentEventV1_1_0,
  compatibility: VersionCompatibility.BACKWARD_COMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const newPayload = { 
      ...event.payload, 
      reason: null, 
      notes: null, 
      virtual: false 
    };
    return event.withPayload(newPayload, VERSIONS.V1_1_0);
  },
};

/**
 * Migration test case: Appointment Event V1.1.0 to V2.0.0
 * Demonstrates a breaking change migration (restructuring fields)
 */
export const appointmentMigrationV1_1_0_to_V2_0_0 = {
  source: appointmentEventV1_1_0,
  target: appointmentEventV2_0_0,
  compatibility: VersionCompatibility.INCOMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const { 
      providerId, specialtyId, appointmentDate, duration, 
      location, status, reason, notes, virtual 
    } = event.payload;
    
    // Calculate end time based on duration
    const startTime = new Date(appointmentDate);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const newPayload = {
      provider: {
        id: providerId,
        specialtyId,
        name: 'Unknown Provider', // Default value for missing field
      },
      schedule: {
        startTime: appointmentDate,
        endTime: endTime.toISOString(),
        timeZone: 'America/Sao_Paulo',
      },
      details: {
        location,
        status,
        reason: reason || 'Not specified',
        notes: notes || '',
        virtual: virtual || false,
      },
      patient: {
        id: event.metadata?.userId || 'unknown',
        name: 'Unknown Patient',
        contactPhone: 'unknown',
      },
      reminders: [],
    };
    
    return event.withPayload(newPayload, VERSIONS.V2_0_0);
  },
};

/**
 * Migration test case: Claim Event V1.0.0 to V1.1.0
 * Demonstrates a non-breaking change migration (adding optional fields)
 */
export const claimMigrationV1_0_0_to_V1_1_0 = {
  source: claimEventV1_0_0,
  target: claimEventV1_1_0,
  compatibility: VersionCompatibility.BACKWARD_COMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const newPayload = { 
      ...event.payload, 
      providerName: null, 
      receiptUrl: null 
    };
    return event.withPayload(newPayload, VERSIONS.V1_1_0);
  },
};

/**
 * Migration test case: Claim Event V1.1.0 to V2.0.0
 * Demonstrates a breaking change migration (restructuring fields)
 */
export const claimMigrationV1_1_0_to_V2_0_0 = {
  source: claimEventV1_1_0,
  target: claimEventV2_0_0,
  compatibility: VersionCompatibility.INCOMPATIBLE,
  transformation: (event: VersionedEventDto<any>): VersionedEventDto<any> => {
    const { 
      claimId, claimType, amount, currency, 
      serviceDate, status, providerName, receiptUrl 
    } = event.payload;
    
    const newPayload = {
      id: claimId,
      type: claimType,
      financial: {
        amount,
        currency,
        reimbursementPercentage: 80, // Default value
        estimatedReimbursement: amount * 0.8, // Calculated value
      },
      service: {
        date: serviceDate,
        provider: {
          name: providerName || 'Unknown Provider',
          id: 'unknown',
          network: 'UNKNOWN',
        },
        category: 'CONSULTATION', // Default value
        specialty: 'UNKNOWN', // Default value
      },
      documents: receiptUrl ? [
        {
          type: 'RECEIPT',
          url: receiptUrl,
          uploadedAt: event.metadata?.timestamp || new Date().toISOString(),
        }
      ] : [],
      status: {
        current: status,
        updatedAt: event.metadata?.timestamp || new Date().toISOString(),
        history: [
          { 
            status, 
            timestamp: event.metadata?.timestamp || new Date().toISOString() 
          },
        ],
      },
    };
    
    return event.withPayload(newPayload, VERSIONS.V2_0_0);
  },
};

// ===== COLLECTIONS OF VERSIONED EVENTS =====

/**
 * Collection of health journey events with different versions
 */
export const healthJourneyEvents = {
  metric: {
    v1_0_0: healthMetricEventV1_0_0,
    v1_1_0: healthMetricEventV1_1_0,
    v2_0_0: healthMetricEventV2_0_0,
  },
  goal: {
    v1_0_0: healthGoalEventV1_0_0,
    v1_1_0: healthGoalEventV1_1_0,
    v2_0_0: healthGoalEventV2_0_0,
  },
};

/**
 * Collection of care journey events with different versions
 */
export const careJourneyEvents = {
  appointment: {
    v1_0_0: appointmentEventV1_0_0,
    v1_1_0: appointmentEventV1_1_0,
    v2_0_0: appointmentEventV2_0_0,
  },
  medication: {
    v1_0_0: medicationEventV1_0_0,
    v1_1_0: medicationEventV1_1_0,
    v2_0_0: medicationEventV2_0_0,
  },
};

/**
 * Collection of plan journey events with different versions
 */
export const planJourneyEvents = {
  claim: {
    v1_0_0: claimEventV1_0_0,
    v1_1_0: claimEventV1_1_0,
    v2_0_0: claimEventV2_0_0,
  },
  benefit: {
    v1_0_0: benefitEventV1_0_0,
    v1_1_0: benefitEventV1_1_0,
    v2_0_0: benefitEventV2_0_0,
  },
};

/**
 * Collection of migration test cases
 */
export const migrationTestCases = {
  healthMetric: {
    v1_0_0_to_v1_1_0: healthMetricMigrationV1_0_0_to_V1_1_0,
    v1_1_0_to_v2_0_0: healthMetricMigrationV1_1_0_to_V2_0_0,
  },
  appointment: {
    v1_0_0_to_v1_1_0: appointmentMigrationV1_0_0_to_V1_1_0,
    v1_1_0_to_v2_0_0: appointmentMigrationV1_1_0_to_V2_0_0,
  },
  claim: {
    v1_0_0_to_v1_1_0: claimMigrationV1_0_0_to_V1_1_0,
    v1_1_0_to_v2_0_0: claimMigrationV1_1_0_to_V2_0_0,
  },
};

/**
 * Examples of breaking vs. non-breaking changes
 */
export const schemaChangeExamples = {
  nonBreaking: [
    {
      description: 'Adding optional fields',
      before: healthMetricEventV1_0_0,
      after: healthMetricEventV1_1_0,
      compatibility: VersionCompatibility.BACKWARD_COMPATIBLE,
    },
    {
      description: 'Adding optional nested structures',
      before: appointmentEventV1_0_0,
      after: appointmentEventV1_1_0,
      compatibility: VersionCompatibility.BACKWARD_COMPATIBLE,
    },
    {
      description: 'Patch version update with documentation changes only',
      before: createVersionedEvent('DOCUMENTATION_TEST', { field: 'value' }, VERSIONS.V1_0_0),
      after: createVersionedEvent('DOCUMENTATION_TEST', { field: 'value' }, VERSIONS.V1_0_1),
      compatibility: VersionCompatibility.COMPATIBLE,
    },
  ],
  breaking: [
    {
      description: 'Restructuring fields (nesting previously flat fields)',
      before: healthMetricEventV1_1_0,
      after: healthMetricEventV2_0_0,
      compatibility: VersionCompatibility.INCOMPATIBLE,
    },
    {
      description: 'Renaming fields',
      before: claimEventV1_1_0,
      after: claimEventV2_0_0,
      compatibility: VersionCompatibility.INCOMPATIBLE,
    },
    {
      description: 'Changing field types or structure',
      before: appointmentEventV1_1_0,
      after: appointmentEventV2_0_0,
      compatibility: VersionCompatibility.INCOMPATIBLE,
    },
  ],
};