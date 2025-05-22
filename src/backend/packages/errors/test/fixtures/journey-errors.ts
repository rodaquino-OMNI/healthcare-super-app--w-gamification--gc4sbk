/**
 * Journey-specific error fixtures for testing
 * 
 * This file contains pre-configured error instances for each journey (Health, Care, Plan)
 * that can be used in tests to verify error handling, serialization, and client responses.
 * Each journey has dedicated sample errors for common scenarios.
 */

import { BaseError, ErrorType, JourneyType } from '../../src/base';
import * as ErrorCodes from 'src/backend/shared/src/constants/error-codes.constants';
import { JOURNEY_IDS, JOURNEY_NAMES } from 'src/backend/shared/src/constants/journey.constants';

// Import journey-specific error classes
import { Health, Care, Plan } from '../../src';

/**
 * Health Journey Error Fixtures
 */
export const healthErrors = {
  /**
   * Invalid health metric error
   * Used for testing validation error handling in health metrics
   */
  invalidMetric: new Health.Metrics.InvalidMetricValueError(
    'Blood pressure reading is outside acceptable range',
    {
      metricType: 'blood_pressure',
      providedValue: '300/200',
      acceptableRange: '90/60 - 140/90',
      userId: 'user123',
    }
  ),

  /**
   * Device connection error
   * Used for testing device integration error handling
   */
  deviceConnectionFailed: new Health.Devices.DeviceConnectionFailureError(
    'Failed to connect to Fitbit device',
    {
      deviceId: 'fitbit-123456',
      deviceType: 'fitbit',
      connectionMethod: 'bluetooth',
      lastSyncTimestamp: new Date(Date.now() - 86400000).toISOString(),
      errorCode: 'DEVICE_UNREACHABLE',
    }
  ),

  /**
   * Health goal validation error
   * Used for testing business rule validation in health goals
   */
  invalidGoalParameters: new Health.Goals.InvalidGoalParametersError(
    'Daily step goal must be between 1,000 and 50,000 steps',
    {
      goalType: 'steps',
      providedValue: 100000,
      acceptableRange: { min: 1000, max: 50000 },
      userId: 'user123',
    }
  ),

  /**
   * Health insights error
   * Used for testing error handling in health insights generation
   */
  insufficientDataForInsights: new Health.Insights.InsufficientDataError(
    'Not enough sleep data to generate sleep quality insights',
    {
      insightType: 'sleep_quality',
      requiredDataPoints: 7,
      availableDataPoints: 2,
      dataTimespan: '7 days',
      userId: 'user123',
    }
  ),

  /**
   * FHIR integration error
   * Used for testing external system errors in health data integration
   */
  fhirConnectionError: new Health.Fhir.FhirConnectionFailureError(
    'Failed to connect to FHIR server',
    {
      endpoint: 'https://fhir.example.org/api/v4',
      operationType: 'GET',
      resourceType: 'Patient',
      statusCode: 503,
      responseBody: { error: 'Service Unavailable' },
    }
  ),

  /**
   * Factory function to create custom health metric errors
   */
  createMetricError: (metricType: string, value: any, message?: string) => {
    return new Health.Metrics.InvalidMetricValueError(
      message || `Invalid ${metricType} value provided`,
      {
        metricType,
        providedValue: value,
        userId: 'user123',
      }
    );
  },

  /**
   * Factory function to create custom device connection errors
   */
  createDeviceError: (deviceType: string, errorCode: string, message?: string) => {
    return new Health.Devices.DeviceConnectionFailureError(
      message || `Failed to connect to ${deviceType} device`,
      {
        deviceType,
        errorCode,
        connectionMethod: 'bluetooth',
        userId: 'user123',
      }
    );
  },
};

/**
 * Care Journey Error Fixtures
 */
export const careErrors = {
  /**
   * Provider unavailable error
   * Used for testing business logic errors in provider scheduling
   */
  providerUnavailable: new Care.ProviderUnavailableError(
    'The selected healthcare provider is not available at the requested time',
    {
      providerId: 'provider789',
      providerName: 'Dr. Maria Silva',
      requestedDate: '2023-06-15',
      requestedTime: '14:30',
      specialtyType: 'cardiology',
      userId: 'user123',
    }
  ),

  /**
   * Appointment conflict error
   * Used for testing business logic errors in appointment scheduling
   */
  appointmentConflict: new Care.AppointmentOverlapError(
    'Cannot schedule appointment due to overlap with existing appointment',
    {
      requestedAppointmentTime: '2023-06-15T14:30:00Z',
      requestedDuration: 30,
      conflictingAppointmentId: 'appt456',
      conflictingAppointmentTime: '2023-06-15T14:00:00Z',
      conflictingAppointmentDuration: 60,
      userId: 'user123',
    }
  ),

  /**
   * Telemedicine connection error
   * Used for testing technical errors in telemedicine sessions
   */
  telemedicineConnectionFailed: new Care.TelemedicineConnectionError(
    'Failed to establish telemedicine video connection',
    {
      sessionId: 'tele123',
      providerName: 'Dr. Carlos Mendes',
      errorCode: 'ICE_CONNECTION_FAILED',
      browserInfo: 'Chrome 98.0.4758.102',
      networkType: 'wifi',
      userId: 'user123',
    }
  ),

  /**
   * Medication interaction error
   * Used for testing business logic errors in medication management
   */
  medicationInteraction: new Care.MedicationInteractionError(
    'Potential severe interaction detected between medications',
    {
      medications: [
        { id: 'med123', name: 'Lisinopril', dosage: '10mg' },
        { id: 'med456', name: 'Potassium supplements', dosage: '20mEq' },
      ],
      interactionSeverity: 'severe',
      interactionDescription: 'Increased risk of hyperkalemia',
      recommendedAction: 'Consult healthcare provider before taking together',
      userId: 'user123',
    }
  ),

  /**
   * Symptom assessment error
   * Used for testing business logic errors in symptom checker
   */
  symptomAssessmentIncomplete: new Care.SymptomAssessmentIncompleteError(
    'Cannot generate assessment with incomplete symptom information',
    {
      providedSymptoms: ['headache', 'fatigue'],
      missingInformation: ['duration', 'severity', 'associated symptoms'],
      assessmentId: 'assess789',
      userId: 'user123',
    }
  ),

  /**
   * Factory function to create custom appointment errors
   */
  createAppointmentError: (errorType: string, appointmentId: string, message?: string) => {
    if (errorType === 'not_found') {
      return new Care.AppointmentNotFoundError(
        message || `Appointment with ID ${appointmentId} not found`,
        { appointmentId, userId: 'user123' }
      );
    } else if (errorType === 'past_date') {
      return new Care.AppointmentDateInPastError(
        message || 'Cannot schedule appointment in the past',
        {
          appointmentId,
          requestedDate: new Date(Date.now() - 86400000).toISOString(),
          userId: 'user123',
        }
      );
    } else {
      return new BaseError(
        message || `Appointment error: ${errorType}`,
        ErrorType.BUSINESS,
        ErrorCodes.CARE_APPOINTMENT_SLOT_TAKEN,
        { journey: JourneyType.CARE, appointmentId, userId: 'user123' }
      );
    }
  },

  /**
   * Factory function to create custom provider errors
   */
  createProviderError: (providerId: string, specialtyType: string, message?: string) => {
    return new Care.ProviderNotFoundError(
      message || `Provider with ID ${providerId} not found`,
      {
        providerId,
        specialtyType,
        userId: 'user123',
      }
    );
  },
};

/**
 * Plan Journey Error Fixtures
 */
export const planErrors = {
  /**
   * Invalid claim data error
   * Used for testing validation errors in claim submission
   */
  invalidClaimData: new Plan.Claims.ClaimValidationError(
    'Claim submission contains invalid or missing required fields',
    {
      claimId: 'claim123',
      validationErrors: [
        { field: 'serviceDate', error: 'Date cannot be in the future' },
        { field: 'diagnosisCode', error: 'Invalid ICD-10 code format' },
        { field: 'providerNPI', error: 'Provider NPI is required' },
      ],
      userId: 'user123',
    }
  ),

  /**
   * Coverage verification error
   * Used for testing business logic errors in coverage verification
   */
  coverageVerificationFailed: new Plan.Coverage.CoverageVerificationError(
    'Failed to verify coverage for the requested service',
    {
      memberId: 'member456',
      serviceCode: 'H1001',
      serviceDescription: 'Prenatal care visit',
      verificationId: 'verify789',
      errorReason: 'Service requires pre-authorization',
      userId: 'user123',
    }
  ),

  /**
   * Service not covered error
   * Used for testing business logic errors in coverage benefits
   */
  serviceNotCovered: new Plan.Coverage.ServiceNotCoveredError(
    'The requested service is not covered by your current plan',
    {
      serviceCode: 'D9972',
      serviceDescription: 'External bleaching per arch',
      planId: 'plan789',
      planName: 'Essential Care',
      coverageCategory: 'dental',
      userId: 'user123',
    }
  ),

  /**
   * Benefit limit exceeded error
   * Used for testing business logic errors in benefits utilization
   */
  benefitLimitExceeded: new Plan.Benefits.BenefitLimitExceededError(
    'You have reached the annual limit for this benefit',
    {
      benefitType: 'physical_therapy',
      benefitDescription: 'Physical Therapy Sessions',
      annualLimit: 20,
      currentUsage: 20,
      planId: 'plan789',
      planName: 'Essential Care',
      coveragePeriod: '2023-01-01 to 2023-12-31',
      userId: 'user123',
    }
  ),

  /**
   * Document upload error
   * Used for testing technical errors in document management
   */
  documentUploadFailed: new Plan.Documents.DocumentStorageError(
    'Failed to upload claim supporting document',
    {
      documentType: 'medical_receipt',
      fileName: 'receipt-2023-05-12.pdf',
      fileSize: 2.5, // MB
      mimeType: 'application/pdf',
      errorCode: 'STORAGE_UNAVAILABLE',
      userId: 'user123',
    }
  ),

  /**
   * Factory function to create custom claim errors
   */
  createClaimError: (errorType: string, claimId: string, message?: string) => {
    if (errorType === 'not_found') {
      return new Plan.Claims.ClaimNotFoundError(
        message || `Claim with ID ${claimId} not found`,
        { claimId, userId: 'user123' }
      );
    } else if (errorType === 'duplicate') {
      return new Plan.Claims.DuplicateClaimError(
        message || `Duplicate claim detected`,
        {
          claimId,
          duplicateClaimId: `dup-${claimId}`,
          serviceDate: new Date().toISOString().split('T')[0],
          userId: 'user123',
        }
      );
    } else {
      return new BaseError(
        message || `Claim error: ${errorType}`,
        ErrorType.BUSINESS,
        ErrorCodes.PLAN_INVALID_CLAIM_DATA,
        { journey: JourneyType.PLAN, claimId, userId: 'user123' }
      );
    }
  },

  /**
   * Factory function to create custom coverage errors
   */
  createCoverageError: (serviceCode: string, planId: string, message?: string) => {
    return new Plan.Coverage.ServiceNotCoveredError(
      message || `Service ${serviceCode} is not covered by plan ${planId}`,
      {
        serviceCode,
        planId,
        userId: 'user123',
      }
    );
  },
};

/**
 * Combined journey errors for easy access
 */
export const journeyErrors = {
  health: healthErrors,
  care: careErrors,
  plan: planErrors,
};

/**
 * Factory function to create journey-specific errors with custom messages
 * Useful for creating test-specific error instances
 */
export function createJourneyError(
  journey: keyof typeof JOURNEY_IDS,
  errorType: ErrorType,
  code: string,
  message: string,
  details?: Record<string, any>
): BaseError {
  return BaseError.journeyError(
    message,
    errorType,
    code,
    journey as unknown as JourneyType,
    {
      journey: journey as unknown as JourneyType,
      component: `${journey}-service`,
      operation: 'test-operation',
      userId: 'test-user',
      metadata: {
        journeyName: JOURNEY_NAMES[journey.toUpperCase() as keyof typeof JOURNEY_NAMES],
        testGenerated: true,
      },
    },
    details
  );
}

/**
 * Factory function to create validation errors for any journey
 */
export function createValidationError(
  journey: keyof typeof JOURNEY_IDS,
  field: string,
  value: any,
  message?: string
): BaseError {
  return createJourneyError(
    journey,
    ErrorType.VALIDATION,
    `${journey.toUpperCase()}_VALIDATION_ERROR`,
    message || `Invalid value for field '${field}'`,
    {
      field,
      providedValue: value,
      validationError: true,
    }
  );
}

/**
 * Factory function to create business logic errors for any journey
 */
export function createBusinessError(
  journey: keyof typeof JOURNEY_IDS,
  code: string,
  message: string,
  details?: Record<string, any>
): BaseError {
  return createJourneyError(
    journey,
    ErrorType.BUSINESS,
    code,
    message,
    details
  );
}

/**
 * Factory function to create technical errors for any journey
 */
export function createTechnicalError(
  journey: keyof typeof JOURNEY_IDS,
  code: string,
  message: string,
  details?: Record<string, any>
): BaseError {
  return createJourneyError(
    journey,
    ErrorType.TECHNICAL,
    code,
    message,
    details
  );
}

/**
 * Factory function to create external system errors for any journey
 */
export function createExternalError(
  journey: keyof typeof JOURNEY_IDS,
  system: string,
  code: string,
  message: string,
  details?: Record<string, any>
): BaseError {
  return createJourneyError(
    journey,
    ErrorType.EXTERNAL,
    code,
    message,
    {
      externalSystem: system,
      ...details,
    }
  );
}