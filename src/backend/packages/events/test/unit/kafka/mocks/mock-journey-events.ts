/**
 * Mock generators for journey-specific events used in testing Kafka event processing.
 * This file provides factory functions to create standardized event objects for
 * Health, Care, and Plan journeys that match the expected schema for the
 * gamification engine and notification service.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base event interface that all journey events extend
 */
export interface BaseEvent {
  id: string;
  type: string;
  userId: string;
  timestamp: Date;
  journey: 'health' | 'care' | 'plan';
  version: string;
  data: Record<string, any>;
}

/**
 * User context for cross-journey event correlation
 */
export interface UserContext {
  userId: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Options for creating mock events
 */
export interface MockEventOptions {
  userId?: string;
  timestamp?: Date;
  version?: string;
  userContext?: Partial<UserContext>;
}

/**
 * Default options for mock events
 */
const defaultOptions: MockEventOptions = {
  userId: '00000000-0000-0000-0000-000000000000',
  timestamp: new Date(),
  version: '1.0.0',
};

/**
 * Creates a base event with common properties
 * 
 * @param type The event type
 * @param journey The journey identifier
 * @param data The event-specific data
 * @param options Additional options for the event
 * @returns A base event object
 */
export function createBaseEvent(
  type: string,
  journey: 'health' | 'care' | 'plan',
  data: Record<string, any>,
  options: MockEventOptions = {}
): BaseEvent {
  const mergedOptions = { ...defaultOptions, ...options };
  const { userId, timestamp, version, userContext } = mergedOptions;

  return {
    id: uuidv4(),
    type,
    userId: userId!,
    timestamp: timestamp!,
    journey,
    version: version!,
    data: {
      ...data,
      ...(userContext && { userContext: { userId, ...userContext } }),
    },
  };
}

// ===== HEALTH JOURNEY EVENTS =====

/**
 * Creates a health metric recorded event
 * 
 * @param metricType The type of health metric (e.g., HEART_RATE, BLOOD_PRESSURE)
 * @param value The metric value
 * @param unit The unit of measurement
 * @param options Additional options for the event
 * @returns A health metric recorded event
 */
export function createHealthMetricRecordedEvent(
  metricType: string,
  value: number | string | { systolic: number; diastolic: number },
  unit: string,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'HEALTH_METRIC_RECORDED',
    'health',
    {
      metricType,
      value,
      unit,
      recordedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a health goal achieved event
 * 
 * @param goalType The type of health goal
 * @param targetValue The target value that was achieved
 * @param actualValue The actual value achieved
 * @param options Additional options for the event
 * @returns A health goal achieved event
 */
export function createHealthGoalAchievedEvent(
  goalType: string,
  targetValue: number,
  actualValue: number,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'HEALTH_GOAL_ACHIEVED',
    'health',
    {
      goalType,
      targetValue,
      actualValue,
      achievedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a device connected event
 * 
 * @param deviceType The type of device
 * @param deviceId The device identifier
 * @param manufacturer The device manufacturer
 * @param options Additional options for the event
 * @returns A device connected event
 */
export function createDeviceConnectedEvent(
  deviceType: string,
  deviceId: string,
  manufacturer: string,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'DEVICE_CONNECTED',
    'health',
    {
      deviceType,
      deviceId,
      manufacturer,
      connectedAt: options.timestamp || new Date(),
    },
    options
  );
}

// ===== CARE JOURNEY EVENTS =====

/**
 * Creates an appointment booked event
 * 
 * @param appointmentId The appointment identifier
 * @param providerId The provider identifier
 * @param specialtyName The specialty name
 * @param appointmentDate The appointment date and time
 * @param options Additional options for the event
 * @returns An appointment booked event
 */
export function createAppointmentBookedEvent(
  appointmentId: string,
  providerId: string,
  specialtyName: string,
  appointmentDate: Date,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'APPOINTMENT_BOOKED',
    'care',
    {
      appointmentId,
      providerId,
      specialtyName,
      appointmentDate,
      bookedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a medication adherence event
 * 
 * @param medicationId The medication identifier
 * @param medicationName The medication name
 * @param dosage The dosage taken
 * @param scheduledTime The scheduled time for taking the medication
 * @param options Additional options for the event
 * @returns A medication adherence event
 */
export function createMedicationAdherenceEvent(
  medicationId: string,
  medicationName: string,
  dosage: string,
  scheduledTime: Date,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'MEDICATION_TAKEN',
    'care',
    {
      medicationId,
      medicationName,
      dosage,
      scheduledTime,
      takenAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a telemedicine session event
 * 
 * @param sessionId The telemedicine session identifier
 * @param providerId The provider identifier
 * @param specialtyName The specialty name
 * @param duration The session duration in minutes
 * @param options Additional options for the event
 * @returns A telemedicine session event
 */
export function createTelemedicineSessionEvent(
  sessionId: string,
  providerId: string,
  specialtyName: string,
  duration: number,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'TELEMEDICINE_SESSION_COMPLETED',
    'care',
    {
      sessionId,
      providerId,
      specialtyName,
      duration,
      completedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a treatment plan updated event
 * 
 * @param treatmentPlanId The treatment plan identifier
 * @param providerId The provider identifier
 * @param treatmentType The type of treatment
 * @param options Additional options for the event
 * @returns A treatment plan updated event
 */
export function createTreatmentPlanUpdatedEvent(
  treatmentPlanId: string,
  providerId: string,
  treatmentType: string,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'TREATMENT_PLAN_UPDATED',
    'care',
    {
      treatmentPlanId,
      providerId,
      treatmentType,
      updatedAt: options.timestamp || new Date(),
    },
    options
  );
}

// ===== PLAN JOURNEY EVENTS =====

/**
 * Creates a claim submitted event
 * 
 * @param claimId The claim identifier
 * @param claimType The type of claim
 * @param amount The claim amount
 * @param serviceDate The date of service
 * @param options Additional options for the event
 * @returns A claim submitted event
 */
export function createClaimSubmittedEvent(
  claimId: string,
  claimType: string,
  amount: number,
  serviceDate: Date,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'CLAIM_SUBMITTED',
    'plan',
    {
      claimId,
      claimType,
      amount,
      serviceDate,
      submittedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a benefit utilized event
 * 
 * @param benefitId The benefit identifier
 * @param benefitName The benefit name
 * @param utilizationDate The date of utilization
 * @param options Additional options for the event
 * @returns A benefit utilized event
 */
export function createBenefitUtilizedEvent(
  benefitId: string,
  benefitName: string,
  utilizationDate: Date,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'BENEFIT_UTILIZED',
    'plan',
    {
      benefitId,
      benefitName,
      utilizationDate,
      recordedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a document uploaded event
 * 
 * @param documentId The document identifier
 * @param documentType The type of document
 * @param fileName The file name
 * @param options Additional options for the event
 * @returns A document uploaded event
 */
export function createDocumentUploadedEvent(
  documentId: string,
  documentType: string,
  fileName: string,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'DOCUMENT_UPLOADED',
    'plan',
    {
      documentId,
      documentType,
      fileName,
      uploadedAt: options.timestamp || new Date(),
    },
    options
  );
}

/**
 * Creates a coverage checked event
 * 
 * @param coverageId The coverage identifier
 * @param procedureCode The procedure code
 * @param isInNetwork Whether the procedure is in-network
 * @param coveragePercentage The coverage percentage
 * @param options Additional options for the event
 * @returns A coverage checked event
 */
export function createCoverageCheckedEvent(
  coverageId: string,
  procedureCode: string,
  isInNetwork: boolean,
  coveragePercentage: number,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    'COVERAGE_CHECKED',
    'plan',
    {
      coverageId,
      procedureCode,
      isInNetwork,
      coveragePercentage,
      checkedAt: options.timestamp || new Date(),
    },
    options
  );
}

// ===== INVALID EVENT GENERATORS =====

/**
 * Creates an event with missing required fields for validation testing
 * 
 * @param missingFields Array of field names to omit
 * @param options Additional options for the event
 * @returns An invalid event with missing fields
 */
export function createInvalidEventMissingFields(
  missingFields: string[],
  options: MockEventOptions = {}
): Partial<BaseEvent> {
  const baseEvent = createBaseEvent(
    'TEST_EVENT',
    'health',
    { testData: 'test' },
    options
  );

  const invalidEvent = { ...baseEvent };
  
  for (const field of missingFields) {
    delete (invalidEvent as any)[field];
  }

  return invalidEvent;
}

/**
 * Creates an event with invalid field types for validation testing
 * 
 * @param invalidFields Object mapping field names to invalid values
 * @param options Additional options for the event
 * @returns An invalid event with incorrect field types
 */
export function createInvalidEventWrongTypes(
  invalidFields: Record<string, any>,
  options: MockEventOptions = {}
): BaseEvent {
  const baseEvent = createBaseEvent(
    'TEST_EVENT',
    'health',
    { testData: 'test' },
    options
  );

  return { ...baseEvent, ...invalidFields };
}

/**
 * Creates an event with an unsupported journey for validation testing
 * 
 * @param journey The invalid journey name
 * @param options Additional options for the event
 * @returns An invalid event with an unsupported journey
 */
export function createInvalidEventUnsupportedJourney(
  journey: string,
  options: MockEventOptions = {}
): BaseEvent {
  const baseEvent = createBaseEvent(
    'TEST_EVENT',
    'health' as any,
    { testData: 'test' },
    options
  );

  return { ...baseEvent, journey } as BaseEvent;
}

/**
 * Creates an event with an unsupported version for backward compatibility testing
 * 
 * @param version The unsupported version string
 * @param options Additional options for the event
 * @returns An invalid event with an unsupported version
 */
export function createInvalidEventUnsupportedVersion(
  version: string,
  options: MockEventOptions = {}
): BaseEvent {
  const baseEvent = createBaseEvent(
    'TEST_EVENT',
    'health',
    { testData: 'test' },
    options
  );

  return { ...baseEvent, version };
}

// ===== VERSIONED EVENT GENERATORS =====

/**
 * Creates a versioned event for backward compatibility testing
 * 
 * @param type The event type
 * @param journey The journey identifier
 * @param data The event-specific data
 * @param version The version string
 * @param options Additional options for the event
 * @returns A versioned event
 */
export function createVersionedEvent(
  type: string,
  journey: 'health' | 'care' | 'plan',
  data: Record<string, any>,
  version: string,
  options: MockEventOptions = {}
): BaseEvent {
  return createBaseEvent(
    type,
    journey,
    data,
    { ...options, version }
  );
}

/**
 * Creates a v1.0.0 health metric recorded event (legacy format)
 * 
 * @param metricType The type of health metric
 * @param value The metric value
 * @param options Additional options for the event
 * @returns A v1.0.0 health metric recorded event
 */
export function createHealthMetricRecordedEventV1(
  metricType: string,
  value: number | string,
  options: MockEventOptions = {}
): BaseEvent {
  // In v1.0.0, the unit was part of the metricType and value was always a simple type
  return createVersionedEvent(
    'HEALTH_METRIC_RECORDED',
    'health',
    {
      metricType, // e.g., "HEART_RATE_BPM" instead of separate unit
      value,
      recordedAt: options.timestamp || new Date(),
    },
    '1.0.0',
    options
  );
}

/**
 * Creates a v2.0.0 health metric recorded event (current format)
 * 
 * @param metricType The type of health metric
 * @param value The metric value
 * @param unit The unit of measurement
 * @param options Additional options for the event
 * @returns A v2.0.0 health metric recorded event
 */
export function createHealthMetricRecordedEventV2(
  metricType: string,
  value: number | string | { systolic: number; diastolic: number },
  unit: string,
  options: MockEventOptions = {}
): BaseEvent {
  // In v2.0.0, unit is separate and value can be complex for some metrics
  return createVersionedEvent(
    'HEALTH_METRIC_RECORDED',
    'health',
    {
      metricType,
      value,
      unit,
      recordedAt: options.timestamp || new Date(),
    },
    '2.0.0',
    options
  );
}