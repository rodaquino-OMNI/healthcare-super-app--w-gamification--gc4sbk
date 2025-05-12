/**
 * @file mock-events.ts
 * @description Provides factory functions for creating test events with correct schemas for all journey types.
 * This utility helps ensure test consistency and reduces test code duplication when validating
 * event processing, schema validation, and integration across services.
 */

// Import interfaces from @austa/interfaces package
import { GamificationEvent, EventType } from '@austa/interfaces/gamification/events';
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health/health-metric.interface';
import { IHealthGoal, GoalType, GoalStatus } from '@austa/interfaces/journey/health/health-goal.interface';
import { IDeviceConnection, ConnectionStatus, DeviceType } from '@austa/interfaces/journey/health/device-connection.interface';
import { IAppointment, AppointmentStatus, AppointmentType } from '@austa/interfaces/journey/care/appointment.interface';
import { IMedication } from '@austa/interfaces/journey/care/medication.interface';
import { ITelemedicineSession } from '@austa/interfaces/journey/care/telemedicine-session.interface';
import { IClaim, ClaimStatus } from '@austa/interfaces/journey/plan/claim.interface';
import { IBenefit } from '@austa/interfaces/journey/plan/benefit.interface';
import { ICoverage } from '@austa/interfaces/journey/plan/coverage.interface';

/**
 * Options for creating mock events
 */
export interface MockEventOptions {
  userId?: string;
  timestamp?: string;
  eventId?: string;
  version?: string;
  source?: string;
}

/**
 * Normalizes a timestamp for consistent event testing
 * @param timestamp Optional timestamp string
 * @returns ISO-8601 formatted timestamp string
 */
const normalizeTimestamp = (timestamp?: string): string => {
  if (timestamp) return timestamp;
  return new Date().toISOString();
};

/**
 * Creates a base event with common properties
 * @param type Event type
 * @param payload Event payload
 * @param options Additional event options
 * @returns A properly formatted GamificationEvent
 */
export const createBaseEvent = <T>(type: EventType, payload: T, options: MockEventOptions = {}): GamificationEvent<T> => {
  const {
    userId = '123e4567-e89b-12d3-a456-426614174000',
    timestamp = normalizeTimestamp(),
    eventId = `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    version = '1.0.0',
    source = 'test'
  } = options;

  return {
    eventId,
    type,
    userId,
    timestamp,
    version,
    source,
    payload
  };
};

// HEALTH JOURNEY EVENTS

/**
 * Creates a mock health metric recorded event
 * @param metricData Partial health metric data
 * @param options Additional event options
 * @returns A properly formatted health metric event
 */
export const createHealthMetricRecordedEvent = (
  metricData: Partial<IHealthMetric> = {},
  options: MockEventOptions = {}
): GamificationEvent<IHealthMetric> => {
  const defaultMetric: IHealthMetric = {
    id: `metric-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    type: MetricType.HEART_RATE,
    value: 75,
    unit: 'bpm',
    source: MetricSource.MANUAL,
    timestamp: normalizeTimestamp(),
    ...metricData
  };

  return createBaseEvent(EventType.HEALTH_METRIC_RECORDED, defaultMetric, options);
};

/**
 * Creates a mock health goal achieved event
 * @param goalData Partial health goal data
 * @param options Additional event options
 * @returns A properly formatted health goal achieved event
 */
export const createHealthGoalAchievedEvent = (
  goalData: Partial<IHealthGoal> = {},
  options: MockEventOptions = {}
): GamificationEvent<IHealthGoal> => {
  const defaultGoal: IHealthGoal = {
    id: `goal-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    type: GoalType.STEPS,
    target: 10000,
    current: 10000,
    status: GoalStatus.ACHIEVED,
    startDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
    endDate: new Date().toISOString(),
    ...goalData
  };

  return createBaseEvent(EventType.HEALTH_GOAL_ACHIEVED, defaultGoal, options);
};

/**
 * Creates a mock device connected event
 * @param deviceData Partial device connection data
 * @param options Additional event options
 * @returns A properly formatted device connected event
 */
export const createDeviceConnectedEvent = (
  deviceData: Partial<IDeviceConnection> = {},
  options: MockEventOptions = {}
): GamificationEvent<IDeviceConnection> => {
  const defaultDevice: IDeviceConnection = {
    id: `device-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    deviceId: `device-id-${Math.floor(Math.random() * 1000)}`,
    type: DeviceType.SMARTWATCH,
    manufacturer: 'Test Manufacturer',
    model: 'Test Model',
    status: ConnectionStatus.CONNECTED,
    lastSyncDate: normalizeTimestamp(),
    ...deviceData
  };

  return createBaseEvent(EventType.DEVICE_CONNECTED, defaultDevice, options);
};

// CARE JOURNEY EVENTS

/**
 * Creates a mock appointment booked event
 * @param appointmentData Partial appointment data
 * @param options Additional event options
 * @returns A properly formatted appointment booked event
 */
export const createAppointmentBookedEvent = (
  appointmentData: Partial<IAppointment> = {},
  options: MockEventOptions = {}
): GamificationEvent<IAppointment> => {
  const defaultAppointment: IAppointment = {
    id: `appointment-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    providerId: `provider-${Math.floor(Math.random() * 1000)}`,
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    date: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    duration: 30,
    notes: 'Test appointment notes',
    createdAt: normalizeTimestamp(),
    updatedAt: normalizeTimestamp(),
    ...appointmentData
  };

  return createBaseEvent(EventType.APPOINTMENT_BOOKED, defaultAppointment, options);
};

/**
 * Creates a mock medication taken event
 * @param medicationData Partial medication data
 * @param options Additional event options
 * @returns A properly formatted medication taken event
 */
export const createMedicationTakenEvent = (
  medicationData: Partial<IMedication> = {},
  options: MockEventOptions = {}
): GamificationEvent<IMedication> => {
  const defaultMedication: IMedication = {
    id: `medication-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Medication',
    dosage: '10mg',
    frequency: 'daily',
    startDate: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    endDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
    timesTaken: 7,
    lastTaken: normalizeTimestamp(),
    active: true,
    ...medicationData
  };

  return createBaseEvent(EventType.MEDICATION_TAKEN, defaultMedication, options);
};

/**
 * Creates a mock telehealth session completed event
 * @param sessionData Partial telemedicine session data
 * @param options Additional event options
 * @returns A properly formatted telehealth session completed event
 */
export const createTelehealthCompletedEvent = (
  sessionData: Partial<ITelemedicineSession> = {},
  options: MockEventOptions = {}
): GamificationEvent<ITelemedicineSession> => {
  const defaultSession: ITelemedicineSession = {
    id: `telemedicine-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    appointmentId: `appointment-${Math.floor(Math.random() * 1000)}`,
    providerId: `provider-${Math.floor(Math.random() * 1000)}`,
    startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    endTime: normalizeTimestamp(),
    duration: 60,
    notes: 'Test telemedicine session notes',
    ...sessionData
  };

  return createBaseEvent(EventType.TELEHEALTH_COMPLETED, defaultSession, options);
};

// PLAN JOURNEY EVENTS

/**
 * Creates a mock claim submitted event
 * @param claimData Partial claim data
 * @param options Additional event options
 * @returns A properly formatted claim submitted event
 */
export const createClaimSubmittedEvent = (
  claimData: Partial<IClaim> = {},
  options: MockEventOptions = {}
): GamificationEvent<IClaim> => {
  const defaultClaim: IClaim = {
    id: `claim-${Date.now()}`,
    userId: options.userId || '123e4567-e89b-12d3-a456-426614174000',
    planId: `plan-${Math.floor(Math.random() * 1000)}`,
    type: 'MEDICAL',
    description: 'Test claim description',
    amount: 150.00,
    status: ClaimStatus.SUBMITTED,
    submissionDate: normalizeTimestamp(),
    documents: [],
    ...claimData
  };

  return createBaseEvent(EventType.CLAIM_SUBMITTED, defaultClaim, options);
};

/**
 * Creates a mock benefit used event
 * @param benefitData Partial benefit data
 * @param options Additional event options
 * @returns A properly formatted benefit used event
 */
export const createBenefitUsedEvent = (
  benefitData: Partial<IBenefit> = {},
  options: MockEventOptions = {}
): GamificationEvent<IBenefit> => {
  const defaultBenefit: IBenefit = {
    id: `benefit-${Date.now()}`,
    planId: `plan-${Math.floor(Math.random() * 1000)}`,
    name: 'Test Benefit',
    description: 'Test benefit description',
    type: 'WELLNESS',
    coveragePercentage: 80,
    annualLimit: 500.00,
    usedAmount: 100.00,
    lastUsedDate: normalizeTimestamp(),
    ...benefitData
  };

  return createBaseEvent(EventType.BENEFIT_USED, defaultBenefit, options);
};

/**
 * Creates a mock coverage checked event
 * @param coverageData Partial coverage data
 * @param options Additional event options
 * @returns A properly formatted coverage checked event
 */
export const createCoverageCheckedEvent = (
  coverageData: Partial<ICoverage> = {},
  options: MockEventOptions = {}
): GamificationEvent<ICoverage> => {
  const defaultCoverage: ICoverage = {
    id: `coverage-${Date.now()}`,
    planId: `plan-${Math.floor(Math.random() * 1000)}`,
    type: 'MEDICAL',
    description: 'Test coverage description',
    coveragePercentage: 90,
    annualLimit: 1000.00,
    copayAmount: 20.00,
    ...coverageData
  };

  return createBaseEvent(EventType.COVERAGE_CHECKED, defaultCoverage, options);
};

/**
 * Creates a batch of events for testing multiple event processing
 * @param count Number of events to create
 * @param eventFactory Factory function to create events
 * @param baseOptions Base options for all events
 * @returns Array of events
 */
export const createEventBatch = <T>(
  count: number,
  eventFactory: (data?: any, options?: MockEventOptions) => GamificationEvent<T>,
  baseOptions: MockEventOptions = {}
): GamificationEvent<T>[] => {
  return Array.from({ length: count }, (_, index) => {
    return eventFactory({}, {
      ...baseOptions,
      eventId: `batch-event-${Date.now()}-${index}`
    });
  });
};

/**
 * Creates a random event from any journey for testing generic event handling
 * @param options Additional event options
 * @returns A random event from any journey
 */
export const createRandomEvent = (options: MockEventOptions = {}): GamificationEvent<any> => {
  const factories = [
    createHealthMetricRecordedEvent,
    createHealthGoalAchievedEvent,
    createDeviceConnectedEvent,
    createAppointmentBookedEvent,
    createMedicationTakenEvent,
    createTelehealthCompletedEvent,
    createClaimSubmittedEvent,
    createBenefitUsedEvent,
    createCoverageCheckedEvent
  ];

  const randomFactory = factories[Math.floor(Math.random() * factories.length)];
  return randomFactory({}, options);
};