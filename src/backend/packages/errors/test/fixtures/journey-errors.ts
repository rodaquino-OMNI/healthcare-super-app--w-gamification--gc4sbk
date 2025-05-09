/**
 * @file journey-errors.ts
 * @description Test fixtures for journey-specific errors.
 * 
 * This file contains pre-configured error instances for each journey (Health, Care, Plan)
 * to be used in tests. These fixtures help ensure consistent error testing across the application
 * and provide realistic examples of journey-specific error scenarios.
 */

import { BaseError, ErrorType, JourneyContext } from '../../src/base';
import { BusinessError, ResourceNotFoundError, BusinessRuleViolationError } from '../../src/categories/business.errors';
import { ValidationError } from '../../src/categories/validation.errors';
import { TechnicalError } from '../../src/categories/technical.errors';
import { ExternalError } from '../../src/categories/external.errors';

import {
  HEALTH_INVALID_METRIC,
  HEALTH_DEVICE_CONNECTION_FAILED,
  CARE_PROVIDER_UNAVAILABLE,
  CARE_APPOINTMENT_SLOT_TAKEN,
  CARE_TELEMEDICINE_CONNECTION_FAILED,
  PLAN_INVALID_CLAIM_DATA,
  PLAN_COVERAGE_VERIFICATION_FAILED
} from '../../../shared/src/constants/error-codes.constants';

import { JOURNEY_IDS } from '../../../shared/src/constants/journey.constants';

// =============================================================================
// Health Journey Error Fixtures
// =============================================================================

/**
 * Health journey error fixtures for testing error handling in the Health journey.
 */
export const HealthErrors = {
  /**
   * Error thrown when a health metric value is invalid.
   * Example: Heart rate value is negative or unrealistically high.
   */
  invalidMetricValue: new ValidationError(
    'The provided heart rate value of -10 bpm is invalid. Heart rate must be between 30 and 220 bpm.',
    HEALTH_INVALID_METRIC,
    {
      journey: JourneyContext.HEALTH,
      metricType: 'heart_rate',
      providedValue: '-10',
      validRange: '30-220',
      unit: 'bpm'
    },
    { fieldErrors: [{ field: 'value', message: 'Must be between 30 and 220' }] },
    'Please provide a heart rate value between 30 and 220 bpm.'
  ),

  /**
   * Error thrown when a health metric is missing required fields.
   * Example: Blood pressure reading without systolic or diastolic values.
   */
  incompleteMetricData: new ValidationError(
    'Blood pressure reading is incomplete. Both systolic and diastolic values are required.',
    HEALTH_INVALID_METRIC,
    {
      journey: JourneyContext.HEALTH,
      metricType: 'blood_pressure',
      missingFields: ['diastolic']
    },
    { fieldErrors: [{ field: 'diastolic', message: 'This field is required' }] },
    'Please provide both systolic and diastolic values for blood pressure readings.'
  ),

  /**
   * Error thrown when a health metric cannot be found.
   * Example: Attempting to retrieve a non-existent metric record.
   */
  metricNotFound: new ResourceNotFoundError(
    'health_metric',
    'metric-123',
    JourneyContext.HEALTH,
    { userId: 'user-456', metricType: 'weight' },
    'Check if the metric ID is correct or create a new metric record.'
  ),

  /**
   * Error thrown when a device connection fails.
   * Example: Unable to connect to a Bluetooth heart rate monitor.
   */
  deviceConnectionFailed: new BusinessError(
    'Failed to connect to device "Acme Heart Monitor". The device may be out of range or powered off.',
    HEALTH_DEVICE_CONNECTION_FAILED,
    {
      journey: JourneyContext.HEALTH,
      deviceId: 'device-789',
      deviceName: 'Acme Heart Monitor',
      deviceType: 'heart_rate_monitor',
      connectionProtocol: 'bluetooth',
      attemptCount: 3
    },
    { lastError: 'BLUETOOTH_DEVICE_NOT_FOUND' },
    'Ensure the device is powered on, in range, and in pairing mode.'
  ),

  /**
   * Error thrown when a health goal cannot be found.
   * Example: Attempting to update a non-existent goal.
   */
  goalNotFound: new ResourceNotFoundError(
    'health_goal',
    'goal-456',
    JourneyContext.HEALTH,
    { userId: 'user-456', goalType: 'steps' },
    'Check if the goal ID is correct or create a new goal.'
  ),

  /**
   * Error thrown when a health goal target is invalid.
   * Example: Setting an unrealistic step count goal.
   */
  invalidGoalTarget: new ValidationError(
    'The daily step count goal of 100000 steps is unrealistic. Maximum allowed is 50000 steps.',
    'HEALTH_INVALID_GOAL',
    {
      journey: JourneyContext.HEALTH,
      goalType: 'steps',
      providedValue: '100000',
      maxAllowed: '50000',
      unit: 'steps'
    },
    { fieldErrors: [{ field: 'target', message: 'Must be less than or equal to 50000' }] },
    'Please set a daily step count goal between 1000 and 50000 steps.'
  ),

  /**
   * Error thrown when a FHIR API integration fails.
   * Example: Unable to fetch medical records from an external healthcare provider.
   */
  fhirIntegrationFailed: new ExternalError(
    'Failed to retrieve medical records from healthcare provider API.',
    'HEALTH_FHIR_ERROR',
    {
      journey: JourneyContext.HEALTH,
      providerId: 'provider-123',
      providerName: 'Metro Hospital',
      endpoint: '/fhir/Patient/123/Observation',
      statusCode: 503
    },
    { responseBody: { error: 'Service temporarily unavailable' } },
    'Try again later or contact your healthcare provider.'
  ),

  /**
   * Factory function to create custom health metric validation errors.
   */
  createMetricValidationError: (metricType: string, value: any, validRange: string, unit: string) => {
    return new ValidationError(
      `The provided ${metricType} value of ${value} ${unit} is invalid. ${metricType} must be within ${validRange} ${unit}.`,
      HEALTH_INVALID_METRIC,
      {
        journey: JourneyContext.HEALTH,
        metricType,
        providedValue: String(value),
        validRange,
        unit
      },
      { fieldErrors: [{ field: 'value', message: `Must be within ${validRange}` }] },
      `Please provide a ${metricType} value within ${validRange} ${unit}.`
    );
  },

  /**
   * Factory function to create custom device connection errors.
   */
  createDeviceConnectionError: (deviceName: string, deviceType: string, errorCode: string) => {
    return new BusinessError(
      `Failed to connect to ${deviceType} "${deviceName}". The device may be out of range or powered off.`,
      HEALTH_DEVICE_CONNECTION_FAILED,
      {
        journey: JourneyContext.HEALTH,
        deviceName,
        deviceType,
        connectionProtocol: deviceType.includes('bluetooth') ? 'bluetooth' : 'wifi',
        attemptCount: 3
      },
      { lastError: errorCode },
      'Ensure the device is powered on, in range, and in pairing mode.'
    );
  }
};

// =============================================================================
// Care Journey Error Fixtures
// =============================================================================

/**
 * Care journey error fixtures for testing error handling in the Care journey.
 */
export const CareErrors = {
  /**
   * Error thrown when a healthcare provider is unavailable.
   * Example: Doctor is on vacation or fully booked.
   */
  providerUnavailable: new BusinessError(
    'Dr. Silva is not available for appointments until January 15, 2024.',
    CARE_PROVIDER_UNAVAILABLE,
    {
      journey: JourneyContext.CARE,
      providerId: 'provider-123',
      providerName: 'Dr. Silva',
      specialization: 'Cardiologist',
      availableFrom: '2024-01-15T00:00:00Z'
    },
    { reason: 'VACATION' },
    'Please select another provider or schedule an appointment after January 15, 2024.'
  ),

  /**
   * Error thrown when an appointment slot is already taken.
   * Example: Two patients trying to book the same time slot.
   */
  appointmentSlotTaken: new BusinessError(
    'The appointment slot on January 10, 2024 at 14:30 with Dr. Silva is already booked.',
    CARE_APPOINTMENT_SLOT_TAKEN,
    {
      journey: JourneyContext.CARE,
      providerId: 'provider-123',
      providerName: 'Dr. Silva',
      appointmentDate: '2024-01-10',
      appointmentTime: '14:30',
      specialization: 'Cardiologist'
    },
    { conflictingAppointmentId: 'appointment-456' },
    'Please select a different time slot or provider.'
  ),

  /**
   * Error thrown when an appointment cannot be found.
   * Example: Attempting to reschedule a non-existent appointment.
   */
  appointmentNotFound: new ResourceNotFoundError(
    'appointment',
    'appointment-789',
    JourneyContext.CARE,
    { userId: 'user-456', providerId: 'provider-123' },
    'Check if the appointment ID is correct or book a new appointment.'
  ),

  /**
   * Error thrown when a telemedicine connection fails.
   * Example: Video call cannot be established due to network issues.
   */
  telemedicineConnectionFailed: new TechnicalError(
    'Failed to establish video connection for telemedicine appointment.',
    CARE_TELEMEDICINE_CONNECTION_FAILED,
    {
      journey: JourneyContext.CARE,
      appointmentId: 'appointment-123',
      providerId: 'provider-456',
      providerName: 'Dr. Santos',
      connectionType: 'video',
      attemptCount: 2
    },
    { networkStatus: 'unstable', bandwidth: '1.2Mbps', minRequired: '3Mbps' },
    'Check your internet connection or try switching to an audio-only call.'
  ),

  /**
   * Error thrown when medication information cannot be found.
   * Example: Scanning a barcode for an unknown medication.
   */
  medicationNotFound: new ResourceNotFoundError(
    'medication',
    'med-123',
    JourneyContext.CARE,
    { barcode: '7891234567890', searchMethod: 'barcode' },
    'Try searching by medication name instead of barcode.'
  ),

  /**
   * Error thrown when a symptom check returns inconclusive results.
   * Example: Symptoms match multiple possible conditions.
   */
  symptomCheckInconclusive: new BusinessError(
    'Symptom check results are inconclusive. Your symptoms may match multiple conditions.',
    'CARE_SYMPTOM_CHECK_INCONCLUSIVE',
    {
      journey: JourneyContext.CARE,
      symptoms: ['headache', 'fever', 'fatigue'],
      possibleConditions: ['common_cold', 'flu', 'covid19']
    },
    { confidenceScores: { common_cold: 0.45, flu: 0.40, covid19: 0.35 } },
    'Please consult with a healthcare provider for a proper diagnosis.'
  ),

  /**
   * Factory function to create custom provider availability errors.
   */
  createProviderUnavailabilityError: (providerName: string, specialization: string, reason: string, availableFrom: string) => {
    return new BusinessError(
      `${providerName} is not available for appointments until ${new Date(availableFrom).toLocaleDateString()}.`,
      CARE_PROVIDER_UNAVAILABLE,
      {
        journey: JourneyContext.CARE,
        providerName,
        specialization,
        availableFrom,
        reason
      },
      { reason },
      `Please select another provider or schedule an appointment after ${new Date(availableFrom).toLocaleDateString()}.`
    );
  },

  /**
   * Factory function to create custom appointment slot conflict errors.
   */
  createAppointmentConflictError: (providerName: string, appointmentDate: string, appointmentTime: string) => {
    return new BusinessError(
      `The appointment slot on ${appointmentDate} at ${appointmentTime} with ${providerName} is already booked.`,
      CARE_APPOINTMENT_SLOT_TAKEN,
      {
        journey: JourneyContext.CARE,
        providerName,
        appointmentDate,
        appointmentTime
      },
      {},
      'Please select a different time slot or provider.'
    );
  }
};

// =============================================================================
// Plan Journey Error Fixtures
// =============================================================================

/**
 * Plan journey error fixtures for testing error handling in the Plan journey.
 */
export const PlanErrors = {
  /**
   * Error thrown when claim data is invalid.
   * Example: Missing required documentation or information.
   */
  invalidClaimData: new ValidationError(
    'Claim submission is missing required documentation. Please attach medical receipts.',
    PLAN_INVALID_CLAIM_DATA,
    {
      journey: JourneyContext.PLAN,
      claimType: 'medical_reimbursement',
      missingFields: ['receipts'],
      claimAmount: '350.00',
      currency: 'BRL'
    },
    { fieldErrors: [{ field: 'receipts', message: 'Medical receipts are required' }] },
    'Please attach all required documentation including medical receipts.'
  ),

  /**
   * Error thrown when coverage verification fails.
   * Example: Procedure is not covered by the insurance plan.
   */
  coverageVerificationFailed: new BusinessError(
    'The requested procedure "Cosmetic Dental Whitening" is not covered by your current plan.',
    PLAN_COVERAGE_VERIFICATION_FAILED,
    {
      journey: JourneyContext.PLAN,
      procedureCode: 'D9972',
      procedureName: 'Cosmetic Dental Whitening',
      planId: 'plan-123',
      planName: 'Austa Basic Health',
      coverageCategory: 'dental'
    },
    { coverageReason: 'COSMETIC_PROCEDURE_EXCLUSION' },
    'Consider upgrading to our Premium plan which includes cosmetic dental procedures.'
  ),

  /**
   * Error thrown when a claim cannot be found.
   * Example: Attempting to check status of a non-existent claim.
   */
  claimNotFound: new ResourceNotFoundError(
    'claim',
    'claim-123',
    JourneyContext.PLAN,
    { userId: 'user-456', claimType: 'medical_reimbursement' },
    'Check if the claim ID is correct or submit a new claim.'
  ),

  /**
   * Error thrown when a benefit cannot be found.
   * Example: Attempting to use a non-existent or expired benefit.
   */
  benefitNotFound: new ResourceNotFoundError(
    'benefit',
    'benefit-123',
    JourneyContext.PLAN,
    { planId: 'plan-456', benefitCategory: 'wellness' },
    'This benefit may not be included in your current plan.'
  ),

  /**
   * Error thrown when a plan change request violates business rules.
   * Example: Attempting to downgrade plan during active treatment.
   */
  planChangeRuleViolation: new BusinessRuleViolationError(
    'Cannot downgrade plan during active treatment period',
    JourneyContext.PLAN,
    {
      currentPlanId: 'plan-premium',
      requestedPlanId: 'plan-basic',
      activeTreatments: ['ongoing_physical_therapy'],
      earliestDowngradeDate: '2024-03-15'
    },
    'You can downgrade your plan after your current treatment ends on March 15, 2024.'
  ),

  /**
   * Error thrown when a document upload fails.
   * Example: File format not supported or file too large.
   */
  documentUploadFailed: new ValidationError(
    'Document upload failed. File size exceeds the maximum allowed limit of 10MB.',
    'PLAN_DOCUMENT_UPLOAD_FAILED',
    {
      journey: JourneyContext.PLAN,
      documentType: 'medical_report',
      fileName: 'medical_report.pdf',
      fileSize: '15MB',
      maxAllowedSize: '10MB'
    },
    { fieldErrors: [{ field: 'document', message: 'File size must be less than 10MB' }] },
    'Please compress the file or split it into smaller documents.'
  ),

  /**
   * Factory function to create custom claim validation errors.
   */
  createClaimValidationError: (claimType: string, missingFields: string[], claimAmount: string) => {
    const fieldList = missingFields.join(', ');
    return new ValidationError(
      `Claim submission is missing required information: ${fieldList}.`,
      PLAN_INVALID_CLAIM_DATA,
      {
        journey: JourneyContext.PLAN,
        claimType,
        missingFields,
        claimAmount,
        currency: 'BRL'
      },
      { fieldErrors: missingFields.map(field => ({ field, message: 'This field is required' })) },
      `Please provide all required information including ${fieldList}.`
    );
  },

  /**
   * Factory function to create custom coverage verification errors.
   */
  createCoverageVerificationError: (procedureName: string, planName: string, reason: string) => {
    return new BusinessError(
      `The requested procedure "${procedureName}" is not covered by your current plan "${planName}".`,
      PLAN_COVERAGE_VERIFICATION_FAILED,
      {
        journey: JourneyContext.PLAN,
        procedureName,
        planName,
        coverageReason: reason
      },
      { coverageReason: reason },
      'Contact customer service for information about plan upgrades that may cover this procedure.'
    );
  }
};

/**
 * Combined export of all journey-specific error fixtures.
 */
export const JourneyErrors = {
  Health: HealthErrors,
  Care: CareErrors,
  Plan: PlanErrors
};

export default JourneyErrors;