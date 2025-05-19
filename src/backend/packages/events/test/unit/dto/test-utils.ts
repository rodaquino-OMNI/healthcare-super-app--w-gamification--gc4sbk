/**
 * Test utilities for event DTOs
 * 
 * This file provides utility functions and fixtures for testing event DTOs, including
 * factory functions for creating valid test events, validation helpers, and common test patterns.
 */

import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Event journey types
 */
export type EventJourney = 'health' | 'care' | 'plan';

/**
 * Base event data structure for tests
 */
export interface TestEventData {
  type: string;
  userId: string;
  data: Record<string, any>;
  journey?: EventJourney;
}

/**
 * Health journey event types
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_CREATED = 'GOAL_CREATED',
  GOAL_UPDATED = 'GOAL_UPDATED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_SYNCED = 'DEVICE_SYNCED',
}

/**
 * Care journey event types
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_SKIPPED = 'MEDICATION_SKIPPED',
  TELEMEDICINE_STARTED = 'TELEMEDICINE_STARTED',
  TELEMEDICINE_COMPLETED = 'TELEMEDICINE_COMPLETED',
  TREATMENT_PLAN_UPDATED = 'TREATMENT_PLAN_UPDATED',
}

/**
 * Plan journey event types
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  CLAIM_REJECTED = 'CLAIM_REJECTED',
  BENEFIT_USED = 'BENEFIT_USED',
  PLAN_SELECTED = 'PLAN_SELECTED',
  PLAN_COMPARED = 'PLAN_COMPARED',
  REWARD_REDEEMED = 'REWARD_REDEEMED',
}

/**
 * Health metric types
 */
export enum HealthMetricType {
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
  BLOOD_GLUCOSE = 'BLOOD_GLUCOSE',
  STEPS = 'STEPS',
  WEIGHT = 'WEIGHT',
  SLEEP = 'SLEEP',
}

/**
 * Creates a base test event with required fields
 * 
 * @returns A test event with default values
 */
export function createBaseTestEvent(): TestEventData {
  return {
    type: 'TEST_EVENT',
    userId: uuidv4(),
    data: {},
  };
}

/**
 * Creates a test event with custom properties
 * 
 * @param overrides - Properties to override in the base event
 * @returns A test event with overridden properties
 */
export function createTestEvent(overrides: Partial<TestEventData> = {}): TestEventData {
  return {
    ...createBaseTestEvent(),
    ...overrides,
  };
}

/**
 * Creates a health journey test event
 * 
 * @param type - Health event type
 * @param data - Event data
 * @returns A health journey test event
 */
export function createHealthEvent(
  type: HealthEventType = HealthEventType.HEALTH_METRIC_RECORDED,
  data: Record<string, any> = {}
): TestEventData {
  return createTestEvent({
    type,
    journey: 'health',
    data: {
      ...getDefaultHealthEventData(type),
      ...data,
    },
  });
}

/**
 * Creates a care journey test event
 * 
 * @param type - Care event type
 * @param data - Event data
 * @returns A care journey test event
 */
export function createCareEvent(
  type: CareEventType = CareEventType.APPOINTMENT_BOOKED,
  data: Record<string, any> = {}
): TestEventData {
  return createTestEvent({
    type,
    journey: 'care',
    data: {
      ...getDefaultCareEventData(type),
      ...data,
    },
  });
}

/**
 * Creates a plan journey test event
 * 
 * @param type - Plan event type
 * @param data - Event data
 * @returns A plan journey test event
 */
export function createPlanEvent(
  type: PlanEventType = PlanEventType.CLAIM_SUBMITTED,
  data: Record<string, any> = {}
): TestEventData {
  return createTestEvent({
    type,
    journey: 'plan',
    data: {
      ...getDefaultPlanEventData(type),
      ...data,
    },
  });
}

/**
 * Gets default data for health events based on type
 * 
 * @param type - Health event type
 * @returns Default data for the specified health event type
 */
function getDefaultHealthEventData(type: HealthEventType): Record<string, any> {
  switch (type) {
    case HealthEventType.HEALTH_METRIC_RECORDED:
      return {
        metricType: HealthMetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'manual',
      };
    case HealthEventType.GOAL_ACHIEVED:
      return {
        goalId: uuidv4(),
        goalType: 'steps',
        targetValue: 10000,
        achievedValue: 10500,
        timestamp: new Date().toISOString(),
      };
    case HealthEventType.GOAL_CREATED:
      return {
        goalId: uuidv4(),
        goalType: 'steps',
        targetValue: 10000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case HealthEventType.GOAL_UPDATED:
      return {
        goalId: uuidv4(),
        goalType: 'steps',
        targetValue: 12000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case HealthEventType.DEVICE_CONNECTED:
      return {
        deviceId: uuidv4(),
        deviceType: 'Smartwatch',
        manufacturer: 'Apple',
        model: 'Watch Series 7',
        connectionTimestamp: new Date().toISOString(),
      };
    case HealthEventType.DEVICE_SYNCED:
      return {
        deviceId: uuidv4(),
        deviceType: 'Smartwatch',
        syncTimestamp: new Date().toISOString(),
        dataPoints: 24,
        syncDuration: 5.2,
      };
    default:
      return {};
  }
}

/**
 * Gets default data for care events based on type
 * 
 * @param type - Care event type
 * @returns Default data for the specified care event type
 */
function getDefaultCareEventData(type: CareEventType): Record<string, any> {
  switch (type) {
    case CareEventType.APPOINTMENT_BOOKED:
      return {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Maria Silva',
        providerSpecialty: 'Cardiologia',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        appointmentType: 'in-person',
        location: 'Clínica Central',
        bookingTimestamp: new Date().toISOString(),
      };
    case CareEventType.APPOINTMENT_COMPLETED:
      return {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Maria Silva',
        providerSpecialty: 'Cardiologia',
        appointmentDate: new Date().toISOString(),
        appointmentType: 'in-person',
        duration: 30,
        completionTimestamp: new Date().toISOString(),
      };
    case CareEventType.APPOINTMENT_CANCELLED:
      return {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Maria Silva',
        providerSpecialty: 'Cardiologia',
        appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        cancellationReason: 'schedule_conflict',
        cancellationTimestamp: new Date().toISOString(),
      };
    case CareEventType.MEDICATION_TAKEN:
      return {
        medicationId: uuidv4(),
        medicationName: 'Losartana',
        dosage: '50mg',
        scheduledTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        takenTime: new Date().toISOString(),
        adherenceStatus: 'on_time',
      };
    case CareEventType.MEDICATION_SKIPPED:
      return {
        medicationId: uuidv4(),
        medicationName: 'Losartana',
        dosage: '50mg',
        scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        skippedTime: new Date().toISOString(),
        skipReason: 'side_effects',
      };
    case CareEventType.TELEMEDICINE_STARTED:
      return {
        sessionId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Carlos Mendes',
        providerSpecialty: 'Dermatologia',
        startTime: new Date().toISOString(),
        platform: 'austa_telemedicine',
      };
    case CareEventType.TELEMEDICINE_COMPLETED:
      return {
        sessionId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Carlos Mendes',
        providerSpecialty: 'Dermatologia',
        startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: 20,
        platform: 'austa_telemedicine',
      };
    case CareEventType.TREATMENT_PLAN_UPDATED:
      return {
        planId: uuidv4(),
        providerId: uuidv4(),
        providerName: 'Dr. Ana Costa',
        providerSpecialty: 'Ortopedia',
        updateTimestamp: new Date().toISOString(),
        changes: ['medication_added', 'exercise_updated'],
      };
    default:
      return {};
  }
}

/**
 * Gets default data for plan events based on type
 * 
 * @param type - Plan event type
 * @returns Default data for the specified plan event type
 */
function getDefaultPlanEventData(type: PlanEventType): Record<string, any> {
  switch (type) {
    case PlanEventType.CLAIM_SUBMITTED:
      return {
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        providerName: 'Clínica São Lucas',
        serviceDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 250.0,
        currency: 'BRL',
        submissionDate: new Date().toISOString(),
        hasAttachments: true,
        attachmentCount: 2,
      };
    case PlanEventType.CLAIM_APPROVED:
      return {
        claimId: uuidv4(),
        claimType: 'Consulta Médica',
        providerName: 'Clínica São Lucas',
        serviceDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        submissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        approvalDate: new Date().toISOString(),
        approvedAmount: 225.0,
        currency: 'BRL',
        reimbursementMethod: 'bank_transfer',
        estimatedPaymentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case PlanEventType.CLAIM_REJECTED:
      return {
        claimId: uuidv4(),
        claimType: 'Exame',
        providerName: 'Laboratório Central',
        serviceDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        submissionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        rejectionDate: new Date().toISOString(),
        rejectionReason: 'missing_documentation',
        appealDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };
    case PlanEventType.BENEFIT_USED:
      return {
        benefitId: uuidv4(),
        benefitType: 'gym_discount',
        benefitName: 'Desconto Academia',
        usageDate: new Date().toISOString(),
        partnerName: 'SmartFit',
        discountAmount: 50.0,
        currency: 'BRL',
      };
    case PlanEventType.PLAN_SELECTED:
      return {
        planId: uuidv4(),
        planName: 'Plano Premium',
        planType: 'Premium',
        coverageStartDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        monthlyPremium: 850.0,
        currency: 'BRL',
        selectionDate: new Date().toISOString(),
      };
    case PlanEventType.PLAN_COMPARED:
      return {
        planIds: [uuidv4(), uuidv4(), uuidv4()],
        planNames: ['Plano Básico', 'Plano Standard', 'Plano Premium'],
        comparisonDate: new Date().toISOString(),
        comparisonDuration: 180,
        selectedPlanId: uuidv4(),
      };
    case PlanEventType.REWARD_REDEEMED:
      return {
        rewardId: uuidv4(),
        rewardName: 'Voucher Farmácia',
        rewardType: 'discount_voucher',
        pointsUsed: 500,
        redemptionDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        partnerName: 'Drogaria São Paulo',
      };
    default:
      return {};
  }
}

/**
 * Creates a health metric event with the specified metric type
 * 
 * @param metricType - Type of health metric
 * @param value - Metric value
 * @param unit - Metric unit
 * @returns A health metric event
 */
export function createHealthMetricEvent(
  metricType: HealthMetricType = HealthMetricType.HEART_RATE,
  value: number = getDefaultMetricValue(metricType),
  unit: string = getDefaultMetricUnit(metricType)
): TestEventData {
  return createHealthEvent(HealthEventType.HEALTH_METRIC_RECORDED, {
    metricType,
    value,
    unit,
    timestamp: new Date().toISOString(),
    source: 'manual',
  });
}

/**
 * Gets the default value for a health metric type
 * 
 * @param metricType - Type of health metric
 * @returns Default value for the metric type
 */
function getDefaultMetricValue(metricType: HealthMetricType): number {
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      return 75;
    case HealthMetricType.BLOOD_PRESSURE:
      return 120; // Systolic, normally would include diastolic as well
    case HealthMetricType.BLOOD_GLUCOSE:
      return 95;
    case HealthMetricType.STEPS:
      return 8500;
    case HealthMetricType.WEIGHT:
      return 70.5;
    case HealthMetricType.SLEEP:
      return 7.5;
    default:
      return 0;
  }
}

/**
 * Gets the default unit for a health metric type
 * 
 * @param metricType - Type of health metric
 * @returns Default unit for the metric type
 */
function getDefaultMetricUnit(metricType: HealthMetricType): string {
  switch (metricType) {
    case HealthMetricType.HEART_RATE:
      return 'bpm';
    case HealthMetricType.BLOOD_PRESSURE:
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
 * Creates an invalid test event with missing required fields
 * 
 * @param fieldToOmit - Required field to omit
 * @returns An invalid test event
 */
export function createInvalidTestEvent(fieldToOmit: keyof TestEventData): Partial<TestEventData> {
  const baseEvent = createBaseTestEvent();
  const { [fieldToOmit]: _, ...invalidEvent } = baseEvent;
  return invalidEvent;
}

/**
 * Validates a DTO instance using class-validator
 * 
 * @param dto - DTO instance to validate
 * @returns Promise resolving to validation errors
 */
export async function validateDto(dto: any): Promise<any[]> {
  return validate(dto);
}

/**
 * Checks if a DTO validation has errors
 * 
 * @param errors - Validation errors from class-validator
 * @returns True if validation has errors, false otherwise
 */
export function hasValidationErrors(errors: any[]): boolean {
  return errors.length > 0;
}

/**
 * Checks if a specific property has validation errors
 * 
 * @param errors - Validation errors from class-validator
 * @param property - Property to check for errors
 * @returns True if the property has validation errors, false otherwise
 */
export function hasPropertyValidationError(errors: any[], property: string): boolean {
  return errors.some(error => error.property === property);
}

/**
 * Gets validation error constraints for a specific property
 * 
 * @param errors - Validation errors from class-validator
 * @param property - Property to get error constraints for
 * @returns Error constraints for the property or null if not found
 */
export function getPropertyValidationConstraints(errors: any[], property: string): Record<string, string> | null {
  const error = errors.find(error => error.property === property);
  return error ? error.constraints : null;
}

/**
 * Checks if a validation error contains a specific constraint
 * 
 * @param errors - Validation errors from class-validator
 * @param property - Property to check
 * @param constraint - Constraint to check for (e.g., 'isNotEmpty', 'isString')
 * @returns True if the property has the specified constraint error, false otherwise
 */
export function hasConstraintValidationError(
  errors: any[],
  property: string,
  constraint: string
): boolean {
  const constraints = getPropertyValidationConstraints(errors, property);
  return constraints ? !!constraints[constraint] : false;
}

/**
 * Creates a test event with an invalid data type for a specific property
 * 
 * @param property - Property to set an invalid type for
 * @param invalidValue - Invalid value to set
 * @returns A test event with an invalid property type
 */
export function createEventWithInvalidPropertyType(
  property: keyof TestEventData,
  invalidValue: any
): TestEventData {
  return {
    ...createBaseTestEvent(),
    [property]: invalidValue,
  } as TestEventData;
}

/**
 * Creates a test event with an invalid journey value
 * 
 * @param invalidJourney - Invalid journey value
 * @returns A test event with an invalid journey
 */
export function createEventWithInvalidJourney(invalidJourney: string): TestEventData {
  return createTestEvent({
    journey: invalidJourney as EventJourney,
  });
}

/**
 * Creates a test event with an invalid event type
 * 
 * @param invalidType - Invalid event type
 * @returns A test event with an invalid type
 */
export function createEventWithInvalidType(invalidType: any): TestEventData {
  return createTestEvent({
    type: invalidType,
  });
}

/**
 * Creates a test event with an invalid user ID
 * 
 * @param invalidUserId - Invalid user ID
 * @returns A test event with an invalid user ID
 */
export function createEventWithInvalidUserId(invalidUserId: any): TestEventData {
  return createTestEvent({
    userId: invalidUserId,
  });
}

/**
 * Creates a test event with an invalid data object
 * 
 * @param invalidData - Invalid data object
 * @returns A test event with an invalid data object
 */
export function createEventWithInvalidData(invalidData: any): TestEventData {
  return createTestEvent({
    data: invalidData,
  });
}