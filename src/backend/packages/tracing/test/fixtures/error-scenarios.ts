/**
 * Error Scenarios for Tracing Tests
 *
 * This file contains predefined error scenarios and exceptions for testing error handling
 * in trace spans. It provides error objects, stack traces, and expected span status
 * configurations to ensure proper error recording, status setting, and exception handling
 * within the tracing system.
 */

import { SpanStatusCode } from '@opentelemetry/api';
import { ERROR_TYPES } from '../../src/interfaces/span-attributes.interface';
import { JourneyType } from '../../src/interfaces/journey-context.interface';

/**
 * Interface for error scenario test fixtures
 */
export interface ErrorScenario {
  /** Name of the error scenario */
  name: string;
  /** Error object to be used in tests */
  error: Error;
  /** Expected span status code */
  expectedStatusCode: SpanStatusCode;
  /** Expected error attributes */
  expectedAttributes: {
    'error.type': string;
    'error.message': string;
    'error.code'?: string;
    'error.is_retryable'?: boolean;
    'error.retry_count'?: number;
    [key: string]: any;
  };
  /** Journey context information, if applicable */
  journeyContext?: {
    journeyType: JourneyType;
    userId: string;
    [key: string]: any;
  };
}

/**
 * Helper function to create a custom error with a stack trace
 */
function createErrorWithStack(name: string, message: string, code?: string): Error {
  const error = new Error(message);
  error.name = name;
  if (code) {
    (error as any).code = code;
  }
  return error;
}

/**
 * Helper function to create a journey-specific error
 */
function createJourneyError(name: string, message: string, journeyType: JourneyType, code?: string): Error {
  const error = createErrorWithStack(name, message, code);
  (error as any).journeyType = journeyType;
  return error;
}

/**
 * Client error scenarios (4xx)
 */
export const clientErrorScenarios: ErrorScenario[] = [
  {
    name: 'Validation Error',
    error: createErrorWithStack('ValidationError', 'Invalid input: email format is incorrect', 'INVALID_INPUT'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.VALIDATION,
      'error.message': 'Invalid input: email format is incorrect',
      'error.code': 'INVALID_INPUT',
      'error.is_retryable': false,
    },
  },
  {
    name: 'Authentication Error',
    error: createErrorWithStack('AuthenticationError', 'Invalid credentials provided', 'UNAUTHORIZED'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.AUTHENTICATION,
      'error.message': 'Invalid credentials provided',
      'error.code': 'UNAUTHORIZED',
      'error.is_retryable': false,
    },
  },
  {
    name: 'Authorization Error',
    error: createErrorWithStack('AuthorizationError', 'User does not have permission to access this resource', 'FORBIDDEN'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.AUTHORIZATION,
      'error.message': 'User does not have permission to access this resource',
      'error.code': 'FORBIDDEN',
      'error.is_retryable': false,
    },
  },
  {
    name: 'Not Found Error',
    error: createErrorWithStack('NotFoundError', 'Resource not found', 'NOT_FOUND'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.NOT_FOUND,
      'error.message': 'Resource not found',
      'error.code': 'NOT_FOUND',
      'error.is_retryable': false,
    },
  },
];

/**
 * System error scenarios (5xx)
 */
export const systemErrorScenarios: ErrorScenario[] = [
  {
    name: 'Internal Server Error',
    error: createErrorWithStack('InternalServerError', 'Unexpected error occurred during processing', 'INTERNAL_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.INTERNAL,
      'error.message': 'Unexpected error occurred during processing',
      'error.code': 'INTERNAL_ERROR',
      'error.is_retryable': true,
    },
  },
  {
    name: 'Database Error',
    error: createErrorWithStack('DatabaseError', 'Failed to execute database query', 'DB_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.INTERNAL,
      'error.message': 'Failed to execute database query',
      'error.code': 'DB_ERROR',
      'error.is_retryable': true,
    },
  },
];

/**
 * Transient error scenarios
 */
export const transientErrorScenarios: ErrorScenario[] = [
  {
    name: 'Network Timeout',
    error: createErrorWithStack('TimeoutError', 'Request timed out after 30000ms', 'TIMEOUT'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.TIMEOUT,
      'error.message': 'Request timed out after 30000ms',
      'error.code': 'TIMEOUT',
      'error.is_retryable': true,
      'error.retry_count': 1,
    },
  },
  {
    name: 'Service Unavailable',
    error: createErrorWithStack('ServiceUnavailableError', 'Service temporarily unavailable', 'SERVICE_UNAVAILABLE'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'Service temporarily unavailable',
      'error.code': 'SERVICE_UNAVAILABLE',
      'error.is_retryable': true,
      'error.retry_count': 3,
    },
  },
];

/**
 * External dependency error scenarios
 */
export const externalDependencyErrorScenarios: ErrorScenario[] = [
  {
    name: 'Third-Party API Error',
    error: createErrorWithStack('ExternalAPIError', 'External API returned error response: 500 Internal Server Error', 'EXTERNAL_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'External API returned error response: 500 Internal Server Error',
      'error.code': 'EXTERNAL_ERROR',
      'error.is_retryable': true,
    },
  },
  {
    name: 'External Service Connection Error',
    error: createErrorWithStack('ConnectionError', 'Failed to connect to external service', 'CONNECTION_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'Failed to connect to external service',
      'error.code': 'CONNECTION_ERROR',
      'error.is_retryable': true,
      'error.retry_count': 2,
    },
  },
];

/**
 * Health journey error scenarios
 */
export const healthJourneyErrorScenarios: ErrorScenario[] = [
  {
    name: 'Health Metric Validation Error',
    error: createJourneyError('HealthMetricValidationError', 'Invalid health metric value: -10 for blood pressure', JourneyType.HEALTH, 'INVALID_METRIC'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.VALIDATION,
      'error.message': 'Invalid health metric value: -10 for blood pressure',
      'error.code': 'INVALID_METRIC',
      'error.is_retryable': false,
      'austa.journey.name': 'health',
      'austa.health.metric_type': 'blood_pressure',
    },
    journeyContext: {
      journeyType: JourneyType.HEALTH,
      userId: 'user-123',
      metrics: {
        metricType: 'blood_pressure',
      },
    },
  },
  {
    name: 'Device Connection Error',
    error: createJourneyError('DeviceConnectionError', 'Failed to connect to health device: timeout', JourneyType.HEALTH, 'DEVICE_CONNECTION_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'Failed to connect to health device: timeout',
      'error.code': 'DEVICE_CONNECTION_ERROR',
      'error.is_retryable': true,
      'error.retry_count': 2,
      'austa.journey.name': 'health',
      'austa.health.device_id': 'device-456',
    },
    journeyContext: {
      journeyType: JourneyType.HEALTH,
      userId: 'user-123',
      devices: {
        deviceId: 'device-456',
        deviceType: 'smartwatch',
      },
    },
  },
];

/**
 * Care journey error scenarios
 */
export const careJourneyErrorScenarios: ErrorScenario[] = [
  {
    name: 'Appointment Booking Error',
    error: createJourneyError('AppointmentBookingError', 'Failed to book appointment: time slot not available', JourneyType.CARE, 'BOOKING_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.VALIDATION,
      'error.message': 'Failed to book appointment: time slot not available',
      'error.code': 'BOOKING_ERROR',
      'error.is_retryable': false,
      'austa.journey.name': 'care',
      'austa.care.provider_id': 'provider-789',
    },
    journeyContext: {
      journeyType: JourneyType.CARE,
      userId: 'user-123',
      appointment: {
        appointmentType: 'consultation',
        provider: {
          providerId: 'provider-789',
        },
      },
    },
  },
  {
    name: 'Telemedicine Session Error',
    error: createJourneyError('TelemedicineError', 'Failed to establish telemedicine session: network error', JourneyType.CARE, 'TELEMEDICINE_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'Failed to establish telemedicine session: network error',
      'error.code': 'TELEMEDICINE_ERROR',
      'error.is_retryable': true,
      'austa.journey.name': 'care',
      'austa.care.telemedicine_session_id': 'session-101',
    },
    journeyContext: {
      journeyType: JourneyType.CARE,
      userId: 'user-123',
      telemedicine: {
        sessionId: 'session-101',
        status: 'connecting',
      },
    },
  },
];

/**
 * Plan journey error scenarios
 */
export const planJourneyErrorScenarios: ErrorScenario[] = [
  {
    name: 'Claim Submission Error',
    error: createJourneyError('ClaimSubmissionError', 'Failed to submit claim: missing required documentation', JourneyType.PLAN, 'CLAIM_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.VALIDATION,
      'error.message': 'Failed to submit claim: missing required documentation',
      'error.code': 'CLAIM_ERROR',
      'error.is_retryable': false,
      'austa.journey.name': 'plan',
      'austa.plan.claim_id': 'claim-202',
    },
    journeyContext: {
      journeyType: JourneyType.PLAN,
      userId: 'user-123',
      claim: {
        claimId: 'claim-202',
        claimType: 'medical',
        status: 'draft',
      },
    },
  },
  {
    name: 'Benefit Verification Error',
    error: createJourneyError('BenefitVerificationError', 'Failed to verify benefit eligibility: service unavailable', JourneyType.PLAN, 'BENEFIT_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.DEPENDENCY,
      'error.message': 'Failed to verify benefit eligibility: service unavailable',
      'error.code': 'BENEFIT_ERROR',
      'error.is_retryable': true,
      'austa.journey.name': 'plan',
      'austa.plan.benefit_id': 'benefit-303',
    },
    journeyContext: {
      journeyType: JourneyType.PLAN,
      userId: 'user-123',
      benefit: {
        benefitId: 'benefit-303',
        benefitType: 'dental',
      },
    },
  },
];

/**
 * Gamification error scenarios
 */
export const gamificationErrorScenarios: ErrorScenario[] = [
  {
    name: 'Achievement Processing Error',
    error: createErrorWithStack('AchievementProcessingError', 'Failed to process achievement: invalid criteria', 'ACHIEVEMENT_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.INTERNAL,
      'error.message': 'Failed to process achievement: invalid criteria',
      'error.code': 'ACHIEVEMENT_ERROR',
      'error.is_retryable': false,
      'austa.gamification.achievement_id': 'achievement-404',
      'austa.gamification.profile_id': 'profile-505',
    },
  },
  {
    name: 'Event Processing Error',
    error: createErrorWithStack('EventProcessingError', 'Failed to process gamification event: malformed payload', 'EVENT_ERROR'),
    expectedStatusCode: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': ERROR_TYPES.VALIDATION,
      'error.message': 'Failed to process gamification event: malformed payload',
      'error.code': 'EVENT_ERROR',
      'error.is_retryable': false,
      'austa.gamification.event_type': 'points_earned',
      'austa.gamification.profile_id': 'profile-505',
    },
  },
];

/**
 * Combined error scenarios for easy import in tests
 */
export const allErrorScenarios: ErrorScenario[] = [
  ...clientErrorScenarios,
  ...systemErrorScenarios,
  ...transientErrorScenarios,
  ...externalDependencyErrorScenarios,
  ...healthJourneyErrorScenarios,
  ...careJourneyErrorScenarios,
  ...planJourneyErrorScenarios,
  ...gamificationErrorScenarios,
];