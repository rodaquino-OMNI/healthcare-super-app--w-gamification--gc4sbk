/**
 * Journey-specific error fixtures for testing
 * 
 * This file contains sample error instances for Health, Care, and Plan journeys
 * to be used in testing journey-specific error handling and context-aware error responses.
 * Each journey has dedicated sample errors for common scenarios.
 */

// Import error codes
import {
  HEALTH_INVALID_METRIC,
  HEALTH_DEVICE_CONNECTION_FAILED,
  CARE_PROVIDER_UNAVAILABLE,
  CARE_APPOINTMENT_SLOT_TAKEN,
  CARE_TELEMEDICINE_CONNECTION_FAILED,
  PLAN_INVALID_CLAIM_DATA,
  PLAN_COVERAGE_VERIFICATION_FAILED,
} from '../../../shared/src/constants/error-codes.constants';

// Import journey constants
import { JOURNEY_IDS, JOURNEY_NAMES } from '../../../shared/src/constants/journey.constants';

// Import base error types
import { ValidationError } from '../../src/categories/validation.errors';
import { BusinessError } from '../../src/categories/business.errors';
import { TechnicalError } from '../../src/categories/technical.errors';
import { ExternalError } from '../../src/categories/external.errors';

// Import journey-specific error classes
// Health journey errors
import { InvalidMetricValueError } from '../../src/journey/health/metrics.errors';
import { DeviceConnectionFailureError } from '../../src/journey/health/devices.errors';
import { InsufficientDataError } from '../../src/journey/health/insights.errors';
import { InvalidGoalParametersError } from '../../src/journey/health/goals.errors';

// Care journey errors
import { ProviderUnavailableError } from '../../src/journey/care/provider-errors';
import { AppointmentOverlapError } from '../../src/journey/care/appointment-errors';
import { TelemedicineConnectionError } from '../../src/journey/care/telemedicine-errors';
import { MedicationInteractionError } from '../../src/journey/care/medication-errors';

// Plan journey errors
import { ClaimValidationError } from '../../src/journey/plan/claims-errors';
import { CoverageVerificationError } from '../../src/journey/plan/coverage-errors';
import { BenefitNotCoveredError } from '../../src/journey/plan/benefits-errors';
import { PlanNotAvailableInRegionError } from '../../src/journey/plan/plans-errors';

/**
 * Health Journey Error Fixtures
 */
export const healthJourneyErrors = {
  // Validation errors
  invalidMetricValue: new InvalidMetricValueError({
    message: 'Blood pressure value is outside acceptable range',
    code: HEALTH_INVALID_METRIC,
    context: {
      journeyId: JOURNEY_IDS.HEALTH,
      journeyName: JOURNEY_NAMES.HEALTH,
      metricType: 'bloodPressure',
      providedValue: '300/180',
      acceptableRange: '90/60 - 140/90',
      userId: 'user-123',
    },
  }),

  // Business errors
  invalidGoalParameters: new InvalidGoalParametersError({
    message: 'Goal parameters are not achievable based on user profile',
    context: {
      journeyId: JOURNEY_IDS.HEALTH,
      journeyName: JOURNEY_NAMES.HEALTH,
      goalType: 'weightLoss',
      targetValue: '10kg',
      timeframe: '1 week',
      reason: 'Exceeds safe weight loss rate of 1kg per week',
      userId: 'user-123',
    },
  }),

  // Technical errors
  insufficientData: new InsufficientDataError({
    message: 'Not enough data points to generate health insights',
    context: {
      journeyId: JOURNEY_IDS.HEALTH,
      journeyName: JOURNEY_NAMES.HEALTH,
      dataType: 'sleepPattern',
      requiredDataPoints: 5,
      availableDataPoints: 2,
      userId: 'user-123',
      timeRange: 'last 7 days',
    },
  }),

  // External errors
  deviceConnectionFailed: new DeviceConnectionFailureError({
    message: 'Failed to connect to fitness tracker',
    code: HEALTH_DEVICE_CONNECTION_FAILED,
    context: {
      journeyId: JOURNEY_IDS.HEALTH,
      journeyName: JOURNEY_NAMES.HEALTH,
      deviceType: 'fitbit',
      deviceId: 'device-456',
      userId: 'user-123',
      errorCode: 'BLE_CONNECTION_TIMEOUT',
      lastConnected: '2023-04-10T14:30:00Z',
    },
  }),

  // Factory function for creating custom health errors
  createHealthMetricError: (metricType: string, value: string, range: string) => {
    return new InvalidMetricValueError({
      message: `${metricType} value is outside acceptable range`,
      code: HEALTH_INVALID_METRIC,
      context: {
        journeyId: JOURNEY_IDS.HEALTH,
        journeyName: JOURNEY_NAMES.HEALTH,
        metricType,
        providedValue: value,
        acceptableRange: range,
        userId: 'user-123',
      },
    });
  },
};

/**
 * Care Journey Error Fixtures
 */
export const careJourneyErrors = {
  // Validation errors
  medicationInteraction: new MedicationInteractionError({
    message: 'Potential harmful interaction between medications detected',
    context: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      medications: ['Lisinopril', 'Potassium supplements'],
      interactionSeverity: 'high',
      interactionDescription: 'Increased risk of hyperkalemia',
      userId: 'user-123',
    },
  }),

  // Business errors
  providerUnavailable: new ProviderUnavailableError({
    message: 'The selected healthcare provider is not available',
    code: CARE_PROVIDER_UNAVAILABLE,
    context: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      providerId: 'provider-789',
      providerName: 'Dr. Silva',
      speciality: 'Cardiologist',
      requestedDate: '2023-04-15',
      nextAvailableDate: '2023-04-22',
      userId: 'user-123',
    },
  }),

  // Business errors
  appointmentOverlap: new AppointmentOverlapError({
    message: 'The requested appointment time conflicts with an existing appointment',
    code: CARE_APPOINTMENT_SLOT_TAKEN,
    context: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      requestedTime: '2023-04-15T10:00:00Z',
      existingAppointmentId: 'appt-456',
      existingAppointmentTime: '2023-04-15T09:30:00Z',
      existingAppointmentDuration: 60,
      providerId: 'provider-789',
      userId: 'user-123',
    },
  }),

  // Technical/External errors
  telemedicineConnectionFailed: new TelemedicineConnectionError({
    message: 'Failed to establish telemedicine video connection',
    code: CARE_TELEMEDICINE_CONNECTION_FAILED,
    context: {
      journeyId: JOURNEY_IDS.CARE,
      journeyName: JOURNEY_NAMES.CARE,
      sessionId: 'session-123',
      providerId: 'provider-789',
      userId: 'user-123',
      errorCode: 'ICE_NEGOTIATION_FAILED',
      networkQuality: 'poor',
      browserInfo: 'Chrome 98.0.4758.102',
    },
  }),

  // Factory function for creating custom care errors
  createAppointmentError: (providerId: string, requestedTime: string, reason: string) => {
    return new AppointmentOverlapError({
      message: `The requested appointment cannot be scheduled: ${reason}`,
      code: CARE_APPOINTMENT_SLOT_TAKEN,
      context: {
        journeyId: JOURNEY_IDS.CARE,
        journeyName: JOURNEY_NAMES.CARE,
        requestedTime,
        providerId,
        reason,
        userId: 'user-123',
      },
    });
  },
};

/**
 * Plan Journey Error Fixtures
 */
export const planJourneyErrors = {
  // Validation errors
  invalidClaimData: new ClaimValidationError({
    message: 'Claim submission contains invalid or missing data',
    code: PLAN_INVALID_CLAIM_DATA,
    context: {
      journeyId: JOURNEY_IDS.PLAN,
      journeyName: JOURNEY_NAMES.PLAN,
      claimId: 'claim-123',
      validationErrors: [
        { field: 'serviceDate', error: 'Date cannot be in the future' },
        { field: 'receiptImage', error: 'Receipt image is required' },
      ],
      userId: 'user-123',
    },
  }),

  // Business errors
  benefitNotCovered: new BenefitNotCoveredError({
    message: 'The requested service is not covered by your current plan',
    context: {
      journeyId: JOURNEY_IDS.PLAN,
      journeyName: JOURNEY_NAMES.PLAN,
      serviceType: 'Dental Implants',
      planId: 'plan-456',
      planName: 'Basic Health Plan',
      coverageCategory: 'Dental',
      userId: 'user-123',
      upgradePlanSuggestion: 'Premium Health Plan',
    },
  }),

  // Business errors
  planNotAvailableInRegion: new PlanNotAvailableInRegionError({
    message: 'The selected health plan is not available in your region',
    context: {
      journeyId: JOURNEY_IDS.PLAN,
      journeyName: JOURNEY_NAMES.PLAN,
      planId: 'plan-789',
      planName: 'Premium Health Plan',
      requestedRegion: 'Amazonas',
      availableRegions: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais'],
      userId: 'user-123',
    },
  }),

  // External errors
  coverageVerificationFailed: new CoverageVerificationError({
    message: 'Failed to verify coverage with insurance provider',
    code: PLAN_COVERAGE_VERIFICATION_FAILED,
    context: {
      journeyId: JOURNEY_IDS.PLAN,
      journeyName: JOURNEY_NAMES.PLAN,
      serviceType: 'Specialist Consultation',
      providerId: 'provider-789',
      insuranceId: 'ins-456',
      errorCode: 'PROVIDER_API_TIMEOUT',
      requestId: 'req-123',
      userId: 'user-123',
    },
  }),

  // Factory function for creating custom plan errors
  createClaimError: (claimId: string, validationErrors: Array<{field: string, error: string}>) => {
    return new ClaimValidationError({
      message: 'Claim submission contains validation errors',
      code: PLAN_INVALID_CLAIM_DATA,
      context: {
        journeyId: JOURNEY_IDS.PLAN,
        journeyName: JOURNEY_NAMES.PLAN,
        claimId,
        validationErrors,
        userId: 'user-123',
      },
    });
  },
};

/**
 * Combined export of all journey errors
 */
export const journeyErrors = {
  health: healthJourneyErrors,
  care: careJourneyErrors,
  plan: planJourneyErrors,
};

export default journeyErrors;