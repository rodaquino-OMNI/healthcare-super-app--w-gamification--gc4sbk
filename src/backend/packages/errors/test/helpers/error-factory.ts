/**
 * @file error-factory.ts
 * @description Factory functions for creating test error instances with specific properties, types, and metadata.
 * This utility simplifies testing by allowing developers to quickly generate journey-specific errors,
 * business logic errors, validation errors, and technical errors with customizable properties.
 * 
 * @example
 * // Create a basic validation error
 * const validationError = createValidationError({ message: 'Invalid input' });
 * 
 * // Create a journey-specific error
 * const healthError = createJourneyError(JourneyType.HEALTH, 'metrics', {
 *   userId: 'user123',
 *   metricType: 'heart-rate'
 * });
 * 
 * // Create an error chain with cause relationships
 * const errorChain = createErrorChain(
 *   [ErrorType.EXTERNAL, ErrorType.TECHNICAL, ErrorType.BUSINESS],
 *   [
 *     { message: 'External API failed' },
 *     { message: 'Database operation failed' },
 *     { message: 'Cannot complete business operation' }
 *   ]
 * );
 * 
 * // Create a mock error response for testing client error handling
 * const mockResponse = createMockErrorResponse(
 *   ErrorType.VALIDATION,
 *   'INVALID_INPUT',
 *   'The provided input is invalid',
 *   { field: 'email', constraint: 'isEmail' }
 * );
 */

import { AppException, ErrorType } from '../../../src/base-error';
import * as ValidationErrors from '../../../src/categories/validation.errors';
import * as BusinessErrors from '../../../src/categories/business.errors';
import * as TechnicalErrors from '../../../src/categories/technical.errors';
import * as ExternalErrors from '../../../src/categories/external.errors';
import * as HealthErrors from '../../../src/journey/health';
import * as CareErrors from '../../../src/journey/care';
import * as PlanErrors from '../../../src/journey/plan';

/**
 * Options for creating test error instances
 */
export interface ErrorFactoryOptions {
  message?: string;
  code?: string;
  details?: any;
  cause?: Error;
  journeyContext?: Record<string, any>;
}

/**
 * Journey types supported by the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan'
}

/**
 * Creates a basic AppException instance for testing
 * 
 * @param type The error type from ErrorType enum
 * @param options Optional configuration for the error
 * @returns An AppException instance
 */
export function createBaseError(
  type: ErrorType,
  options: ErrorFactoryOptions = {}
): AppException {
  const {
    message = 'Test error message',
    code = 'TEST_ERROR_001',
    details = undefined,
    cause = undefined
  } = options;

  return new AppException(message, type, code, details, cause);
}

/**
 * Creates a validation error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A validation error instance
 */
export function createValidationError(options: ErrorFactoryOptions = {}): AppException {
  return createBaseError(ErrorType.VALIDATION, {
    message: 'Validation error for testing',
    code: 'TEST_VALIDATION_001',
    ...options
  });
}

/**
 * Creates a business logic error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A business error instance
 */
export function createBusinessError(options: ErrorFactoryOptions = {}): AppException {
  return createBaseError(ErrorType.BUSINESS, {
    message: 'Business logic error for testing',
    code: 'TEST_BUSINESS_001',
    ...options
  });
}

/**
 * Creates a technical error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A technical error instance
 */
export function createTechnicalError(options: ErrorFactoryOptions = {}): AppException {
  return createBaseError(ErrorType.TECHNICAL, {
    message: 'Technical error for testing',
    code: 'TEST_TECHNICAL_001',
    ...options
  });
}

/**
 * Creates an external system error for testing
 * 
 * @param options Optional configuration for the error
 * @returns An external error instance
 */
export function createExternalError(options: ErrorFactoryOptions = {}): AppException {
  return createBaseError(ErrorType.EXTERNAL, {
    message: 'External system error for testing',
    code: 'TEST_EXTERNAL_001',
    ...options
  });
}

/**
 * Creates a chain of errors with cause relationships for testing
 * 
 * @param errorTypes Array of error types to create in the chain (from innermost to outermost)
 * @param options Optional configuration for the errors
 * @returns The outermost error with inner errors as causes
 */
export function createErrorChain(
  errorTypes: ErrorType[],
  options: ErrorFactoryOptions[] = []
): AppException {
  return createErrorChainWithFactory(errorTypes, options, createBaseError);
}

/**
 * Creates a chain of errors with cause relationships for testing using a custom factory function
 * 
 * @param errorTypes Array of error types to create in the chain (from innermost to outermost)
 * @param options Optional configuration for the errors
 * @param factory Factory function to create each error in the chain
 * @returns The outermost error with inner errors as causes
 */
export function createErrorChainWithFactory(
  errorTypes: ErrorType[],
  options: ErrorFactoryOptions[] = [],
  factory: (type: ErrorType, options: ErrorFactoryOptions) => AppException
): AppException {
  if (errorTypes.length === 0) {
    throw new Error('At least one error type must be provided');
  }

  // Create the innermost error
  let currentError = factory(
    errorTypes[0],
    options[0] || { code: `TEST_${errorTypes[0].toUpperCase()}_INNER` }
  );

  // Build the chain from inside out
  for (let i = 1; i < errorTypes.length; i++) {
    currentError = factory(
      errorTypes[i],
      {
        code: `TEST_${errorTypes[i].toUpperCase()}_${i}`,
        ...(options[i] || {}),
        cause: currentError
      }
    );
  }

  return currentError;
}

/**
 * Options for creating specialized validation errors
 */
export interface ValidationErrorFactoryOptions extends ErrorFactoryOptions {
  fieldName?: string;
  expectedType?: string;
  receivedValue?: any;
}

/**
 * Creates a MissingParameterError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A MissingParameterError instance
 */
export function createMissingParameterError(
  options: ValidationErrorFactoryOptions = {}
): ValidationErrors.MissingParameterError {
  const { fieldName = 'testField', ...rest } = options;
  return new ValidationErrors.MissingParameterError(fieldName, rest.details);
}

/**
 * Creates an InvalidParameterError for testing
 * 
 * @param options Optional configuration for the error
 * @returns An InvalidParameterError instance
 */
export function createInvalidParameterError(
  options: ValidationErrorFactoryOptions = {}
): ValidationErrors.InvalidParameterError {
  const {
    fieldName = 'testField',
    expectedType = 'string',
    receivedValue = null,
    ...rest
  } = options;
  
  return new ValidationErrors.InvalidParameterError(
    fieldName,
    expectedType,
    receivedValue,
    rest.details
  );
}

/**
 * Creates a MalformedRequestError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A MalformedRequestError instance
 */
export function createMalformedRequestError(
  options: ErrorFactoryOptions = {}
): ValidationErrors.MalformedRequestError {
  const { message = 'Malformed request for testing', ...rest } = options;
  return new ValidationErrors.MalformedRequestError(message, rest.details);
}

/**
 * Options for creating specialized business errors
 */
export interface BusinessErrorFactoryOptions extends ErrorFactoryOptions {
  resourceType?: string;
  resourceId?: string;
  rule?: string;
}

/**
 * Creates a ResourceNotFoundError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A ResourceNotFoundError instance
 */
export function createResourceNotFoundError(
  options: BusinessErrorFactoryOptions = {}
): BusinessErrors.ResourceNotFoundError {
  const {
    resourceType = 'TestResource',
    resourceId = '12345',
    ...rest
  } = options;
  
  return new BusinessErrors.ResourceNotFoundError(resourceType, resourceId, rest.details);
}

/**
 * Creates a BusinessRuleViolationError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A BusinessRuleViolationError instance
 */
export function createBusinessRuleViolationError(
  options: BusinessErrorFactoryOptions = {}
): BusinessErrors.BusinessRuleViolationError {
  const {
    rule = 'TestBusinessRule',
    message = `Business rule '${rule}' violated`,
    ...rest
  } = options;
  
  return new BusinessErrors.BusinessRuleViolationError(rule, message, rest.details);
}

/**
 * Options for creating specialized technical errors
 */
export interface TechnicalErrorFactoryOptions extends ErrorFactoryOptions {
  operation?: string;
  component?: string;
  duration?: number;
}

/**
 * Creates a DatabaseError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A DatabaseError instance
 */
export function createDatabaseError(
  options: TechnicalErrorFactoryOptions = {}
): TechnicalErrors.DatabaseError {
  const {
    operation = 'query',
    message = `Database operation '${operation}' failed`,
    ...rest
  } = options;
  
  return new TechnicalErrors.DatabaseError(operation, message, rest.details, rest.cause);
}

/**
 * Creates a TimeoutError for testing
 * 
 * @param options Optional configuration for the error
 * @returns A TimeoutError instance
 */
export function createTimeoutError(
  options: TechnicalErrorFactoryOptions = {}
): TechnicalErrors.TimeoutError {
  const {
    operation = 'testOperation',
    duration = 30000,
    ...rest
  } = options;
  
  return new TechnicalErrors.TimeoutError(operation, duration, rest.details, rest.cause);
}

/**
 * Options for creating specialized external errors
 */
export interface ExternalErrorFactoryOptions extends ErrorFactoryOptions {
  service?: string;
  endpoint?: string;
  statusCode?: number;
  retryAfter?: number;
}

/**
 * Creates an ExternalApiError for testing
 * 
 * @param options Optional configuration for the error
 * @returns An ExternalApiError instance
 */
export function createExternalApiError(
  options: ExternalErrorFactoryOptions = {}
): ExternalErrors.ExternalApiError {
  const {
    service = 'testExternalService',
    endpoint = '/api/test',
    statusCode = 500,
    ...rest
  } = options;
  
  return new ExternalErrors.ExternalApiError(
    service,
    endpoint,
    statusCode,
    rest.message || `External API call to ${service} failed`,
    rest.details,
    rest.cause
  );
}

/**
 * Creates an ExternalRateLimitError for testing
 * 
 * @param options Optional configuration for the error
 * @returns An ExternalRateLimitError instance
 */
export function createExternalRateLimitError(
  options: ExternalErrorFactoryOptions = {}
): ExternalErrors.ExternalRateLimitError {
  const {
    service = 'testExternalService',
    retryAfter = 60,
    ...rest
  } = options;
  
  return new ExternalErrors.ExternalRateLimitError(
    service,
    retryAfter,
    rest.message || `Rate limit exceeded for ${service}`,
    rest.details,
    rest.cause
  );
}

// Journey-specific error factories

/**
 * Options for creating Health journey errors
 */
export interface HealthErrorFactoryOptions extends ErrorFactoryOptions {
  userId?: string;
  metricType?: string;
  goalId?: string;
  deviceId?: string;
  resourceType?: string;
  metricValue?: any;
  metricUnit?: string;
  goalTarget?: any;
  deviceType?: string;
  insightType?: string;
}

/**
 * Creates a Health journey metric error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Health metric error instance
 */
export function createHealthMetricError(
  options: HealthErrorFactoryOptions = {}
): HealthErrors.Metrics.InvalidMetricValueError {
  const {
    userId = 'test-user-id',
    metricType = 'heart-rate',
    ...rest
  } = options;
  
  return new HealthErrors.Metrics.InvalidMetricValueError(
    userId,
    metricType,
    rest.message || `Invalid value for ${metricType} metric`,
    rest.details
  );
}

/**
 * Creates a Health journey goal error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Health goal error instance
 */
export function createHealthGoalError(
  options: HealthErrorFactoryOptions = {}
): HealthErrors.Goals.InvalidGoalParametersError {
  const {
    userId = 'test-user-id',
    goalId = 'test-goal-id',
    ...rest
  } = options;
  
  return new HealthErrors.Goals.InvalidGoalParametersError(
    userId,
    goalId,
    rest.message || 'Invalid goal parameters',
    rest.details
  );
}

/**
 * Creates a Health journey device error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Health device error instance
 */
export function createHealthDeviceError(
  options: HealthErrorFactoryOptions = {}
): HealthErrors.Devices.DeviceConnectionFailureError {
  const {
    userId = 'test-user-id',
    deviceId = 'test-device-id',
    ...rest
  } = options;
  
  return new HealthErrors.Devices.DeviceConnectionFailureError(
    userId,
    deviceId,
    rest.message || `Failed to connect to device ${deviceId}`,
    rest.details
  );
}

/**
 * Creates a Health journey FHIR error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Health FHIR error instance
 */
export function createHealthFhirError(
  options: HealthErrorFactoryOptions = {}
): HealthErrors.FHIR.InvalidResourceError {
  const {
    resourceType = 'Patient',
    ...rest
  } = options;
  
  return new HealthErrors.FHIR.InvalidResourceError(
    resourceType,
    rest.message || `Invalid FHIR ${resourceType} resource`,
    rest.details
  );
}

/**
 * Creates a Health journey insights error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Health insights error instance
 */
export function createHealthInsightError(
  options: HealthErrorFactoryOptions = {}
): HealthErrors.Insights.InsufficientDataError {
  const {
    userId = 'test-user-id',
    insightType = 'health-trend',
    ...rest
  } = options;
  
  return new HealthErrors.Insights.InsufficientDataError(
    userId,
    insightType,
    rest.message || `Insufficient data for ${insightType} insight generation`,
    rest.details
  );
}

/**
 * Options for creating Care journey errors
 */
export interface CareErrorFactoryOptions extends ErrorFactoryOptions {
  appointmentId?: string;
  providerId?: string;
  sessionId?: string;
  medicationId?: string;
  userId?: string;
  appointmentDate?: Date | string;
  providerSpecialty?: string;
  sessionDuration?: number;
  medicationDosage?: string;
  symptomId?: string;
  treatmentId?: string;
  symptomSeverity?: number;
  treatmentPlanId?: string;
}

/**
 * Creates a Care journey appointment error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care appointment error instance
 */
export function createCareAppointmentError(
  options: CareErrorFactoryOptions = {}
): CareErrors.AppointmentNotFoundError {
  const {
    appointmentId = 'test-appointment-id',
    ...rest
  } = options;
  
  return new CareErrors.AppointmentNotFoundError(
    appointmentId,
    rest.message || `Appointment ${appointmentId} not found`,
    rest.details
  );
}

/**
 * Creates a Care journey provider error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care provider error instance
 */
export function createCareProviderError(
  options: CareErrorFactoryOptions = {}
): CareErrors.ProviderNotFoundError {
  const {
    providerId = 'test-provider-id',
    ...rest
  } = options;
  
  return new CareErrors.ProviderNotFoundError(
    providerId,
    rest.message || `Provider ${providerId} not found`,
    rest.details
  );
}

/**
 * Creates a Care journey telemedicine error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care telemedicine error instance
 */
export function createCareTelemedicineError(
  options: CareErrorFactoryOptions = {}
): CareErrors.TelemedicineConnectionError {
  const {
    sessionId = 'test-session-id',
    ...rest
  } = options;
  
  return new CareErrors.TelemedicineConnectionError(
    sessionId,
    rest.message || `Failed to establish telemedicine connection for session ${sessionId}`,
    rest.details
  );
}

/**
 * Creates a Care journey medication error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care medication error instance
 */
export function createCareMedicationError(
  options: CareErrorFactoryOptions = {}
): CareErrors.MedicationNotFoundError {
  const {
    medicationId = 'test-medication-id',
    ...rest
  } = options;
  
  return new CareErrors.MedicationNotFoundError(
    medicationId,
    rest.message || `Medication ${medicationId} not found`,
    rest.details
  );
}

/**
 * Creates a Care journey symptom checker error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care symptom checker error instance
 */
export function createCareSymptomError(
  options: CareErrorFactoryOptions = {}
): CareErrors.SymptomNotFoundError {
  const {
    symptomId = 'test-symptom-id',
    symptomSeverity = 3,
    ...rest
  } = options;
  
  return new CareErrors.SymptomNotFoundError(
    symptomId,
    rest.message || `Symptom ${symptomId} not found`,
    rest.details
  );
}

/**
 * Creates a Care journey treatment error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Care treatment error instance
 */
export function createCareTreatmentError(
  options: CareErrorFactoryOptions = {}
): CareErrors.TreatmentPlanNotFoundError {
  const {
    treatmentId = 'test-treatment-id',
    treatmentPlanId = 'test-treatment-plan-id',
    ...rest
  } = options;
  
  return new CareErrors.TreatmentPlanNotFoundError(
    treatmentPlanId,
    rest.message || `Treatment plan ${treatmentPlanId} not found`,
    rest.details
  );
}

/**
 * Options for creating Plan journey errors
 */
export interface PlanErrorFactoryOptions extends ErrorFactoryOptions {
  planId?: string;
  benefitId?: string;
  claimId?: string;
  documentId?: string;
  userId?: string;
  planType?: string;
  benefitType?: string;
  claimAmount?: number;
  documentType?: string;
  coverageId?: string;
  coverageType?: string;
  networkStatus?: 'in-network' | 'out-of-network';
  documentFormat?: string;
  documentSize?: number;
}

/**
 * Creates a Plan journey plan error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Plan error instance
 */
export function createPlanError(
  options: PlanErrorFactoryOptions = {}
): PlanErrors.Plans.PlanNotFoundError {
  const {
    planId = 'test-plan-id',
    ...rest
  } = options;
  
  return new PlanErrors.Plans.PlanNotFoundError(
    planId,
    rest.message || `Plan ${planId} not found`,
    rest.details
  );
}

/**
 * Creates a Plan journey benefit error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Benefit error instance
 */
export function createBenefitError(
  options: PlanErrorFactoryOptions = {}
): PlanErrors.Benefits.BenefitNotFoundError {
  const {
    benefitId = 'test-benefit-id',
    ...rest
  } = options;
  
  return new PlanErrors.Benefits.BenefitNotFoundError(
    benefitId,
    rest.message || `Benefit ${benefitId} not found`,
    rest.details
  );
}

/**
 * Creates a Plan journey claim error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Claim error instance
 */
export function createClaimError(
  options: PlanErrorFactoryOptions = {}
): PlanErrors.Claims.ClaimNotFoundError {
  const {
    claimId = 'test-claim-id',
    ...rest
  } = options;
  
  return new PlanErrors.Claims.ClaimNotFoundError(
    claimId,
    rest.message || `Claim ${claimId} not found`,
    rest.details
  );
}

/**
 * Creates a Plan journey document error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Document error instance
 */
export function createDocumentError(
  options: PlanErrorFactoryOptions = {}
): PlanErrors.Documents.DocumentNotFoundError {
  const {
    documentId = 'test-document-id',
    ...rest
  } = options;
  
  return new PlanErrors.Documents.DocumentNotFoundError(
    documentId,
    rest.message || `Document ${documentId} not found`,
    rest.details
  );
}

/**
 * Creates a Plan journey coverage error for testing
 * 
 * @param options Optional configuration for the error
 * @returns A Coverage error instance
 */
export function createCoverageError(
  options: PlanErrorFactoryOptions = {}
): PlanErrors.Coverage.CoverageNotFoundError {
  const {
    coverageId = 'test-coverage-id',
    coverageType = 'medical',
    networkStatus = 'in-network',
    ...rest
  } = options;
  
  return new PlanErrors.Coverage.CoverageNotFoundError(
    coverageId,
    rest.message || `Coverage ${coverageId} not found`,
    rest.details
  );
}

/**
 * Creates a mock error response object that mimics the structure of error responses
 * from the API for testing client-side error handling
 * 
 * @param type Error type
 * @param code Error code
 * @param message Error message
 * @param details Additional error details
 * @returns A mock error response object
 */
export function createMockErrorResponse(
  type: ErrorType,
  code: string,
  message: string,
  details?: any
): Record<string, any> {
  return {
    error: {
      type,
      code,
      message,
      details
    }
  };
}

/**
 * Creates a mock HTTP error response object that mimics the structure of HTTP error responses
 * from the API for testing client-side error handling
 * 
 * @param statusCode HTTP status code
 * @param type Error type
 * @param code Error code
 * @param message Error message
 * @param details Additional error details
 * @returns A mock HTTP error response object
 */
export function createMockHttpErrorResponse(
  statusCode: number,
  type: ErrorType,
  code: string,
  message: string,
  details?: any
): Record<string, any> {
  return {
    statusCode,
    body: JSON.stringify(createMockErrorResponse(type, code, message, details))
  };
}

/**
 * Creates a mock GraphQL error response object that mimics the structure of GraphQL error responses
 * from the API for testing client-side error handling
 * 
 * @param type Error type
 * @param code Error code
 * @param message Error message
 * @param details Additional error details
 * @param path GraphQL path where the error occurred
 * @returns A mock GraphQL error response object
 */
export function createMockGraphQLErrorResponse(
  type: ErrorType,
  code: string,
  message: string,
  details?: any,
  path: string[] = ['query', 'field']
): Record<string, any> {
  const errorResponse = createMockErrorResponse(type, code, message, details);
  
  return {
    errors: [
      {
        message: message,
        path: path,
        extensions: {
          code: code,
          exception: errorResponse.error
        }
      }
    ],
    data: null
  };
}

/**
 * Creates a journey-specific error with proper context based on the journey type
 * 
 * @param journey The journey type ('health', 'care', or 'plan')
 * @param domain The specific domain within the journey
 * @param options Optional configuration for the error
 * @returns A journey-specific error instance
 */
export function createJourneyError(
  journey: JourneyType | 'health' | 'care' | 'plan',
  domain: string,
  options: ErrorFactoryOptions = {}
): AppException {
  switch (journey) {
    case 'health':
    case JourneyType.HEALTH:
      switch (domain) {
        case 'metrics':
          return createHealthMetricError(options as HealthErrorFactoryOptions);
        case 'goals':
          return createHealthGoalError(options as HealthErrorFactoryOptions);
        case 'devices':
          return createHealthDeviceError(options as HealthErrorFactoryOptions);
        case 'fhir':
          return createHealthFhirError(options as HealthErrorFactoryOptions);
        case 'insights':
          return createHealthInsightError(options as HealthErrorFactoryOptions);
        default:
          return createBusinessError({
            code: `HEALTH_${domain.toUpperCase()}_001`,
            message: `Health journey ${domain} error`,
            ...options
          });
      }
    
    case 'care':
    case JourneyType.CARE:
      switch (domain) {
        case 'appointments':
          return createCareAppointmentError(options as CareErrorFactoryOptions);
        case 'providers':
          return createCareProviderError(options as CareErrorFactoryOptions);
        case 'telemedicine':
          return createCareTelemedicineError(options as CareErrorFactoryOptions);
        case 'medications':
          return createCareMedicationError(options as CareErrorFactoryOptions);
        case 'symptoms':
          return createCareSymptomError(options as CareErrorFactoryOptions);
        case 'treatments':
          return createCareTreatmentError(options as CareErrorFactoryOptions);
        default:
          return createBusinessError({
            code: `CARE_${domain.toUpperCase()}_001`,
            message: `Care journey ${domain} error`,
            ...options
          });
      }
    
    case 'plan':
    case JourneyType.PLAN:
      switch (domain) {
        case 'plans':
          return createPlanError(options as PlanErrorFactoryOptions);
        case 'benefits':
          return createBenefitError(options as PlanErrorFactoryOptions);
        case 'claims':
          return createClaimError(options as PlanErrorFactoryOptions);
        case 'documents':
          return createDocumentError(options as PlanErrorFactoryOptions);
        case 'coverage':
          return createCoverageError(options as PlanErrorFactoryOptions);
        default:
          return createBusinessError({
            code: `PLAN_${domain.toUpperCase()}_001`,
            message: `Plan journey ${domain} error`,
            ...options
          });
      }
    
    default:
      return createBusinessError({
        code: `${journey.toUpperCase()}_${domain.toUpperCase()}_001`,
        message: `${journey} journey ${domain} error`,
        ...options
      });
  }
}