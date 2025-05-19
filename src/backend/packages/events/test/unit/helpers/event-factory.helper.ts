import { v4 as uuidv4 } from 'uuid';
import {
  BaseEvent,
  EventType,
  EventVersion,
  HealthEvent,
  CareEvent,
  PlanEvent,
  JourneyType,
  HealthMetricType,
  AppointmentStatus,
  MedicationAdherenceStatus,
  ClaimStatus,
  BenefitType,
} from '../../../src/interfaces';
import { EventTypes } from '../../../src/constants/types.constants';

/**
 * Options for creating test events
 */
export interface EventFactoryOptions {
  /** Override the event ID */
  id?: string;
  /** Override the user ID */
  userId?: string;
  /** Override the timestamp */
  timestamp?: string;
  /** Override the event version */
  version?: EventVersion;
  /** Include invalid fields for testing validation */
  invalid?: boolean;
  /** Specific fields to make invalid (if invalid is true) */
  invalidFields?: string[];
}

/**
 * Options specific to health events
 */
export interface HealthEventFactoryOptions extends EventFactoryOptions {
  /** The type of health metric */
  metricType?: HealthMetricType;
  /** The value for the health metric */
  metricValue?: number;
  /** The unit for the health metric */
  metricUnit?: string;
  /** The goal ID for goal-related events */
  goalId?: string;
  /** The device ID for device-related events */
  deviceId?: string;
}

/**
 * Options specific to care events
 */
export interface CareEventFactoryOptions extends EventFactoryOptions {
  /** The appointment ID for appointment-related events */
  appointmentId?: string;
  /** The appointment status for appointment-related events */
  appointmentStatus?: AppointmentStatus;
  /** The provider ID for provider-related events */
  providerId?: string;
  /** The medication ID for medication-related events */
  medicationId?: string;
  /** The medication adherence status for medication-related events */
  adherenceStatus?: MedicationAdherenceStatus;
}

/**
 * Options specific to plan events
 */
export interface PlanEventFactoryOptions extends EventFactoryOptions {
  /** The claim ID for claim-related events */
  claimId?: string;
  /** The claim status for claim-related events */
  claimStatus?: ClaimStatus;
  /** The benefit ID for benefit-related events */
  benefitId?: string;
  /** The benefit type for benefit-related events */
  benefitType?: BenefitType;
  /** The plan ID for plan-related events */
  planId?: string;
}

/**
 * Creates a base event with common properties
 * 
 * @param type The event type
 * @param journey The journey type
 * @param options Additional options for the event
 * @returns A base event object
 */
export function createBaseEvent<T = Record<string, any>>(
  type: EventType,
  journey: JourneyType,
  options: EventFactoryOptions = {}
): BaseEvent<T> {
  const now = new Date();
  
  return {
    id: options.id || uuidv4(),
    type,
    journey,
    userId: options.userId || '12345678-1234-1234-1234-123456789012',
    timestamp: options.timestamp || now.toISOString(),
    version: options.version || { major: 1, minor: 0, patch: 0 },
    source: `test-${journey}-service`,
    payload: {} as T,
    metadata: {
      correlationId: uuidv4(),
      sessionId: uuidv4(),
      deviceInfo: {
        type: 'test',
        os: 'test',
        appVersion: '1.0.0'
      }
    }
  };
}

/**
 * Creates an invalid base event for testing validation
 * 
 * @param type The event type
 * @param journey The journey type
 * @param invalidFields Fields to make invalid
 * @returns An invalid base event object
 */
export function createInvalidBaseEvent<T = Record<string, any>>(
  type: EventType,
  journey: JourneyType,
  invalidFields: string[] = ['userId', 'timestamp']
): Partial<BaseEvent<T>> {
  const baseEvent = createBaseEvent<T>(type, journey);
  const invalidEvent: Partial<BaseEvent<T>> = { ...baseEvent };
  
  // Make specified fields invalid
  if (invalidFields.includes('userId')) {
    invalidEvent.userId = 'invalid-user-id';
  }
  
  if (invalidFields.includes('timestamp')) {
    invalidEvent.timestamp = 'invalid-timestamp';
  }
  
  if (invalidFields.includes('version')) {
    invalidEvent.version = null as any;
  }
  
  if (invalidFields.includes('type')) {
    invalidEvent.type = 'INVALID_TYPE' as any;
  }
  
  if (invalidFields.includes('journey')) {
    invalidEvent.journey = 'INVALID_JOURNEY' as any;
  }
  
  if (invalidFields.includes('id')) {
    invalidEvent.id = '123'; // Too short for UUID
  }
  
  return invalidEvent;
}

// Health Journey Event Factories

/**
 * Creates a health metric event for testing
 * 
 * @param options Options for customizing the event
 * @returns A health metric event
 */
export function createHealthMetricEvent(options: HealthEventFactoryOptions = {}): HealthEvent {
  const baseEvent = createBaseEvent<HealthEvent['payload']>(
    EventTypes.Health.METRIC_RECORDED,
    'health',
    options
  );
  
  const metricType = options.metricType || HealthMetricType.HEART_RATE;
  const metricValue = options.metricValue !== undefined ? options.metricValue : getDefaultMetricValue(metricType);
  const metricUnit = options.metricUnit || getDefaultMetricUnit(metricType);
  
  const event: HealthEvent = {
    ...baseEvent,
    payload: {
      metricType,
      value: metricValue,
      unit: metricUnit,
      recordedAt: new Date().toISOString(),
      source: 'manual',
      deviceId: options.deviceId || null,
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidHealthMetricEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid health metric event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid health metric event
 */
export function createInvalidHealthMetricEvent(invalidFields: string[] = ['value', 'metricType']): HealthEvent {
  const event = createHealthMetricEvent();
  
  if (invalidFields.includes('value')) {
    (event.payload as any).value = 'not-a-number';
  }
  
  if (invalidFields.includes('metricType')) {
    (event.payload as any).metricType = 'INVALID_METRIC_TYPE';
  }
  
  if (invalidFields.includes('unit')) {
    event.payload.unit = null as any;
  }
  
  if (invalidFields.includes('recordedAt')) {
    event.payload.recordedAt = 'invalid-date';
  }
  
  return event;
}

/**
 * Creates a health goal event for testing
 * 
 * @param options Options for customizing the event
 * @returns A health goal event
 */
export function createHealthGoalEvent(options: HealthEventFactoryOptions = {}): HealthEvent {
  const baseEvent = createBaseEvent<HealthEvent['payload']>(
    EventTypes.Health.GOAL_ACHIEVED,
    'health',
    options
  );
  
  const metricType = options.metricType || HealthMetricType.STEPS;
  
  const event: HealthEvent = {
    ...baseEvent,
    payload: {
      goalId: options.goalId || uuidv4(),
      metricType,
      targetValue: getDefaultGoalValue(metricType),
      achievedValue: getDefaultGoalValue(metricType),
      achievedAt: new Date().toISOString(),
      streakCount: 1,
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidHealthGoalEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid health goal event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid health goal event
 */
export function createInvalidHealthGoalEvent(invalidFields: string[] = ['goalId', 'targetValue']): HealthEvent {
  const event = createHealthGoalEvent();
  
  if (invalidFields.includes('goalId')) {
    (event.payload as any).goalId = 123; // Not a string
  }
  
  if (invalidFields.includes('targetValue')) {
    (event.payload as any).targetValue = 'not-a-number';
  }
  
  if (invalidFields.includes('achievedValue')) {
    (event.payload as any).achievedValue = 'not-a-number';
  }
  
  if (invalidFields.includes('achievedAt')) {
    event.payload.achievedAt = 'invalid-date';
  }
  
  return event;
}

/**
 * Creates a device connection event for testing
 * 
 * @param options Options for customizing the event
 * @returns A device connection event
 */
export function createDeviceConnectionEvent(options: HealthEventFactoryOptions = {}): HealthEvent {
  const baseEvent = createBaseEvent<HealthEvent['payload']>(
    EventTypes.Health.DEVICE_CONNECTED,
    'health',
    options
  );
  
  const event: HealthEvent = {
    ...baseEvent,
    payload: {
      deviceId: options.deviceId || uuidv4(),
      deviceType: 'Smartwatch',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      connectedAt: new Date().toISOString(),
      supportedMetrics: [HealthMetricType.HEART_RATE, HealthMetricType.STEPS],
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidDeviceConnectionEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid device connection event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid device connection event
 */
export function createInvalidDeviceConnectionEvent(invalidFields: string[] = ['deviceId', 'deviceType']): HealthEvent {
  const event = createDeviceConnectionEvent();
  
  if (invalidFields.includes('deviceId')) {
    (event.payload as any).deviceId = 123; // Not a string
  }
  
  if (invalidFields.includes('deviceType')) {
    event.payload.deviceType = null as any;
  }
  
  if (invalidFields.includes('connectedAt')) {
    event.payload.connectedAt = 'invalid-date';
  }
  
  if (invalidFields.includes('supportedMetrics')) {
    (event.payload as any).supportedMetrics = 'not-an-array';
  }
  
  return event;
}

// Care Journey Event Factories

/**
 * Creates an appointment event for testing
 * 
 * @param options Options for customizing the event
 * @returns An appointment event
 */
export function createAppointmentEvent(options: CareEventFactoryOptions = {}): CareEvent {
  const baseEvent = createBaseEvent<CareEvent['payload']>(
    EventTypes.Care.APPOINTMENT_BOOKED,
    'care',
    options
  );
  
  const appointmentStatus = options.appointmentStatus || AppointmentStatus.BOOKED;
  
  const event: CareEvent = {
    ...baseEvent,
    payload: {
      appointmentId: options.appointmentId || uuidv4(),
      providerId: options.providerId || uuidv4(),
      status: appointmentStatus,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      specialty: 'Cardiologia',
      location: 'Clínica Test',
      virtual: false,
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidAppointmentEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid appointment event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid appointment event
 */
export function createInvalidAppointmentEvent(invalidFields: string[] = ['appointmentId', 'status']): CareEvent {
  const event = createAppointmentEvent();
  
  if (invalidFields.includes('appointmentId')) {
    (event.payload as any).appointmentId = 123; // Not a string
  }
  
  if (invalidFields.includes('status')) {
    (event.payload as any).status = 'INVALID_STATUS';
  }
  
  if (invalidFields.includes('scheduledAt')) {
    event.payload.scheduledAt = 'invalid-date';
  }
  
  if (invalidFields.includes('providerId')) {
    (event.payload as any).providerId = 123; // Not a string
  }
  
  return event;
}

/**
 * Creates a medication event for testing
 * 
 * @param options Options for customizing the event
 * @returns A medication event
 */
export function createMedicationEvent(options: CareEventFactoryOptions = {}): CareEvent {
  const baseEvent = createBaseEvent<CareEvent['payload']>(
    EventTypes.Care.MEDICATION_TAKEN,
    'care',
    options
  );
  
  const adherenceStatus = options.adherenceStatus || MedicationAdherenceStatus.TAKEN;
  
  const event: CareEvent = {
    ...baseEvent,
    payload: {
      medicationId: options.medicationId || uuidv4(),
      name: 'Test Medication',
      dosage: '10mg',
      adherenceStatus,
      scheduledTime: new Date().toISOString(),
      takenTime: adherenceStatus === MedicationAdherenceStatus.TAKEN ? new Date().toISOString() : null,
      skippedReason: adherenceStatus === MedicationAdherenceStatus.SKIPPED ? 'Test reason' : null,
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidMedicationEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid medication event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid medication event
 */
export function createInvalidMedicationEvent(invalidFields: string[] = ['medicationId', 'adherenceStatus']): CareEvent {
  const event = createMedicationEvent();
  
  if (invalidFields.includes('medicationId')) {
    (event.payload as any).medicationId = 123; // Not a string
  }
  
  if (invalidFields.includes('adherenceStatus')) {
    (event.payload as any).adherenceStatus = 'INVALID_STATUS';
  }
  
  if (invalidFields.includes('scheduledTime')) {
    event.payload.scheduledTime = 'invalid-date';
  }
  
  if (invalidFields.includes('takenTime') && event.payload.takenTime) {
    event.payload.takenTime = 'invalid-date';
  }
  
  return event;
}

/**
 * Creates a telemedicine event for testing
 * 
 * @param options Options for customizing the event
 * @returns A telemedicine event
 */
export function createTelemedicineEvent(options: CareEventFactoryOptions = {}): CareEvent {
  const baseEvent = createBaseEvent<CareEvent['payload']>(
    EventTypes.Care.TELEMEDICINE_STARTED,
    'care',
    options
  );
  
  const event: CareEvent = {
    ...baseEvent,
    payload: {
      sessionId: uuidv4(),
      appointmentId: options.appointmentId || uuidv4(),
      providerId: options.providerId || uuidv4(),
      startedAt: new Date().toISOString(),
      duration: 0, // Will be updated when session ends
      status: 'active',
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidTelemedicineEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid telemedicine event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid telemedicine event
 */
export function createInvalidTelemedicineEvent(invalidFields: string[] = ['sessionId', 'status']): CareEvent {
  const event = createTelemedicineEvent();
  
  if (invalidFields.includes('sessionId')) {
    (event.payload as any).sessionId = 123; // Not a string
  }
  
  if (invalidFields.includes('status')) {
    (event.payload as any).status = 123; // Not a string
  }
  
  if (invalidFields.includes('startedAt')) {
    event.payload.startedAt = 'invalid-date';
  }
  
  if (invalidFields.includes('duration')) {
    (event.payload as any).duration = 'not-a-number';
  }
  
  return event;
}

// Plan Journey Event Factories

/**
 * Creates a claim event for testing
 * 
 * @param options Options for customizing the event
 * @returns A claim event
 */
export function createClaimEvent(options: PlanEventFactoryOptions = {}): PlanEvent {
  const baseEvent = createBaseEvent<PlanEvent['payload']>(
    EventTypes.Plan.CLAIM_SUBMITTED,
    'plan',
    options
  );
  
  const claimStatus = options.claimStatus || ClaimStatus.SUBMITTED;
  
  const event: PlanEvent = {
    ...baseEvent,
    payload: {
      claimId: options.claimId || uuidv4(),
      amount: 150.0,
      currency: 'BRL',
      status: claimStatus,
      type: 'Consulta Médica',
      submittedAt: new Date().toISOString(),
      documents: [
        {
          id: uuidv4(),
          type: 'receipt',
          url: 'https://example.com/receipt.pdf',
        }
      ],
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidClaimEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid claim event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid claim event
 */
export function createInvalidClaimEvent(invalidFields: string[] = ['claimId', 'amount']): PlanEvent {
  const event = createClaimEvent();
  
  if (invalidFields.includes('claimId')) {
    (event.payload as any).claimId = 123; // Not a string
  }
  
  if (invalidFields.includes('amount')) {
    (event.payload as any).amount = 'not-a-number';
  }
  
  if (invalidFields.includes('status')) {
    (event.payload as any).status = 'INVALID_STATUS';
  }
  
  if (invalidFields.includes('submittedAt')) {
    event.payload.submittedAt = 'invalid-date';
  }
  
  if (invalidFields.includes('documents')) {
    (event.payload as any).documents = 'not-an-array';
  }
  
  return event;
}

/**
 * Creates a benefit event for testing
 * 
 * @param options Options for customizing the event
 * @returns A benefit event
 */
export function createBenefitEvent(options: PlanEventFactoryOptions = {}): PlanEvent {
  const baseEvent = createBaseEvent<PlanEvent['payload']>(
    EventTypes.Plan.BENEFIT_USED,
    'plan',
    options
  );
  
  const benefitType = options.benefitType || BenefitType.DISCOUNT;
  
  const event: PlanEvent = {
    ...baseEvent,
    payload: {
      benefitId: options.benefitId || uuidv4(),
      type: benefitType,
      name: 'Test Benefit',
      value: benefitType === BenefitType.DISCOUNT ? 15 : null, // 15% discount
      usedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
      partnerId: uuidv4(),
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidBenefitEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid benefit event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid benefit event
 */
export function createInvalidBenefitEvent(invalidFields: string[] = ['benefitId', 'type']): PlanEvent {
  const event = createBenefitEvent();
  
  if (invalidFields.includes('benefitId')) {
    (event.payload as any).benefitId = 123; // Not a string
  }
  
  if (invalidFields.includes('type')) {
    (event.payload as any).type = 'INVALID_TYPE';
  }
  
  if (invalidFields.includes('value')) {
    (event.payload as any).value = 'not-a-number';
  }
  
  if (invalidFields.includes('usedAt')) {
    event.payload.usedAt = 'invalid-date';
  }
  
  if (invalidFields.includes('expiresAt')) {
    event.payload.expiresAt = 'invalid-date';
  }
  
  return event;
}

/**
 * Creates a plan selection event for testing
 * 
 * @param options Options for customizing the event
 * @returns A plan selection event
 */
export function createPlanSelectionEvent(options: PlanEventFactoryOptions = {}): PlanEvent {
  const baseEvent = createBaseEvent<PlanEvent['payload']>(
    EventTypes.Plan.PLAN_SELECTED,
    'plan',
    options
  );
  
  const event: PlanEvent = {
    ...baseEvent,
    payload: {
      planId: options.planId || uuidv4(),
      name: 'Plano Premium',
      type: 'Premium',
      selectedAt: new Date().toISOString(),
      effectiveFrom: new Date(Date.now() + 7 * 86400000).toISOString(), // 7 days from now
      monthlyPremium: 350.0,
      currency: 'BRL',
    }
  };
  
  if (options.invalid && options.invalidFields) {
    return createInvalidPlanSelectionEvent(options.invalidFields);
  }
  
  return event;
}

/**
 * Creates an invalid plan selection event for testing validation
 * 
 * @param invalidFields Fields to make invalid
 * @returns An invalid plan selection event
 */
export function createInvalidPlanSelectionEvent(invalidFields: string[] = ['planId', 'monthlyPremium']): PlanEvent {
  const event = createPlanSelectionEvent();
  
  if (invalidFields.includes('planId')) {
    (event.payload as any).planId = 123; // Not a string
  }
  
  if (invalidFields.includes('monthlyPremium')) {
    (event.payload as any).monthlyPremium = 'not-a-number';
  }
  
  if (invalidFields.includes('selectedAt')) {
    event.payload.selectedAt = 'invalid-date';
  }
  
  if (invalidFields.includes('effectiveFrom')) {
    event.payload.effectiveFrom = 'invalid-date';
  }
  
  return event;
}

// Helper functions

/**
 * Gets a default value for a health metric type
 * 
 * @param metricType The health metric type
 * @returns A default value for the metric type
 */
function getDefaultMetricValue(metricType: HealthMetricType): number {
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      return 72;
    case HealthMetricType.BLOOD_PRESSURE_SYSTOLIC:
      return 120;
    case HealthMetricType.BLOOD_PRESSURE_DIASTOLIC:
      return 80;
    case HealthMetricType.BLOOD_GLUCOSE:
      return 85;
    case HealthMetricType.STEPS:
      return 8000;
    case HealthMetricType.WEIGHT:
      return 70.5;
    case HealthMetricType.SLEEP:
      return 7.5;
    default:
      return 0;
  }
}

/**
 * Gets a default unit for a health metric type
 * 
 * @param metricType The health metric type
 * @returns A default unit for the metric type
 */
function getDefaultMetricUnit(metricType: HealthMetricType): string {
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      return 'bpm';
    case HealthMetricType.BLOOD_PRESSURE_SYSTOLIC:
    case HealthMetricType.BLOOD_PRESSURE_DIASTOLIC:
      return 'mmHg';
    case HealthMetricType.BLOOD_GLUCOSE:
      return 'mg/dL';
    case HealthMetricType.STEPS:
      return 'steps';
    case HealthMetricType.WEIGHT:
      return 'kg';
    case HealthMetricType.SLEEP:
      return 'hours';
    default:
      return '';
  }
}

/**
 * Gets a default goal value for a health metric type
 * 
 * @param metricType The health metric type
 * @returns A default goal value for the metric type
 */
function getDefaultGoalValue(metricType: HealthMetricType): number {
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      return 70;
    case HealthMetricType.BLOOD_PRESSURE_SYSTOLIC:
      return 120;
    case HealthMetricType.BLOOD_PRESSURE_DIASTOLIC:
      return 80;
    case HealthMetricType.BLOOD_GLUCOSE:
      return 85;
    case HealthMetricType.STEPS:
      return 10000;
    case HealthMetricType.WEIGHT:
      return 68.0;
    case HealthMetricType.SLEEP:
      return 8.0;
    default:
      return 0;
  }
}

/**
 * Creates a versioned event with a specific version
 * 
 * @param event The base event to version
 * @param version The version to set
 * @returns A versioned event
 */
export function createVersionedEvent<T extends BaseEvent<any>>(
  event: T,
  version: EventVersion
): T {
  return {
    ...event,
    version
  };
}

/**
 * Creates events for all journeys for comprehensive testing
 * 
 * @returns An object containing events for all journeys
 */
export function createAllJourneyEvents(): {
  health: HealthEvent[];
  care: CareEvent[];
  plan: PlanEvent[];
} {
  return {
    health: [
      createHealthMetricEvent(),
      createHealthGoalEvent(),
      createDeviceConnectionEvent()
    ],
    care: [
      createAppointmentEvent(),
      createMedicationEvent(),
      createTelemedicineEvent()
    ],
    plan: [
      createClaimEvent(),
      createBenefitEvent(),
      createPlanSelectionEvent()
    ]
  };
}

/**
 * Creates invalid events for all journeys for validation testing
 * 
 * @returns An object containing invalid events for all journeys
 */
export function createAllInvalidEvents(): {
  health: HealthEvent[];
  care: CareEvent[];
  plan: PlanEvent[];
} {
  return {
    health: [
      createInvalidHealthMetricEvent(),
      createInvalidHealthGoalEvent(),
      createInvalidDeviceConnectionEvent()
    ],
    care: [
      createInvalidAppointmentEvent(),
      createInvalidMedicationEvent(),
      createInvalidTelemedicineEvent()
    ],
    plan: [
      createInvalidClaimEvent(),
      createInvalidBenefitEvent(),
      createInvalidPlanSelectionEvent()
    ]
  };
}