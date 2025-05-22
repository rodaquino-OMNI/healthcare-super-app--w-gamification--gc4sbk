import { AppException, ErrorType } from '../../../src/exceptions/exceptions.types';
import * as HealthErrors from '../../../src/journey/health';
import * as CareErrors from '../../../src/journey/care';
import * as PlanErrors from '../../../src/journey/plan';
import * as ValidationErrors from '../../../src/categories/validation.errors';
import * as BusinessErrors from '../../../src/categories/business.errors';
import * as TechnicalErrors from '../../../src/categories/technical.errors';
import * as ExternalErrors from '../../../src/categories/external.errors';

/**
 * Options for creating test error instances
 */
export interface ErrorFactoryOptions {
  /** Custom error message */
  message?: string;
  /** Custom error code */
  code?: string;
  /** Additional error details */
  details?: Record<string, any>;
  /** Cause of the error */
  cause?: Error;
}

/**
 * Creates a basic AppException instance for testing
 */
export function createAppException(
  type: ErrorType = ErrorType.TECHNICAL,
  options: ErrorFactoryOptions = {}
): AppException {
  const {
    message = 'Test error message',
    code = 'TEST_ERROR_001',
    details,
    cause
  } = options;

  return new AppException(message, type, code, details, cause);
}

/**
 * Creates an error chain with the specified depth
 */
export function createErrorChain(
  depth: number = 3,
  baseOptions: ErrorFactoryOptions = {}
): AppException {
  let currentCause: Error | undefined = undefined;
  
  // Build the chain from the bottom up
  for (let i = depth; i > 0; i--) {
    const errorType = i % 4 === 0 ? ErrorType.VALIDATION :
                     i % 3 === 0 ? ErrorType.BUSINESS :
                     i % 2 === 0 ? ErrorType.EXTERNAL :
                     ErrorType.TECHNICAL;
    
    const options: ErrorFactoryOptions = {
      message: `Error at depth ${i}`,
      code: `TEST_ERROR_${i.toString().padStart(3, '0')}`,
      details: { depth: i, ...baseOptions.details },
      cause: currentCause
    };
    
    currentCause = createAppException(errorType, options);
  }
  
  return currentCause as AppException;
}

// ===== Validation Error Factories =====

/**
 * Creates a MissingParameterError instance for testing
 */
export function createMissingParameterError(
  paramName: string = 'testParam',
  options: ErrorFactoryOptions = {}
): ValidationErrors.MissingParameterError {
  const {
    message = `Missing required parameter: ${paramName}`,
    code = 'VALIDATION_MISSING_PARAM',
    details = { paramName },
    cause
  } = options;

  return new ValidationErrors.MissingParameterError(message, code, details, cause);
}

/**
 * Creates an InvalidParameterError instance for testing
 */
export function createInvalidParameterError(
  paramName: string = 'testParam',
  actualValue: any = null,
  expectedType: string = 'string',
  options: ErrorFactoryOptions = {}
): ValidationErrors.InvalidParameterError {
  const {
    message = `Invalid parameter: ${paramName}. Expected ${expectedType}`,
    code = 'VALIDATION_INVALID_PARAM',
    details = { paramName, actualValue, expectedType },
    cause
  } = options;

  return new ValidationErrors.InvalidParameterError(message, code, details, cause);
}

/**
 * Creates a SchemaValidationError instance for testing
 */
export function createSchemaValidationError(
  fieldErrors: Record<string, string>[] = [{ field: 'testField', message: 'Invalid value' }],
  options: ErrorFactoryOptions = {}
): ValidationErrors.SchemaValidationError {
  const {
    message = 'Schema validation failed',
    code = 'VALIDATION_SCHEMA',
    details = { fieldErrors },
    cause
  } = options;

  return new ValidationErrors.SchemaValidationError(message, code, details, cause);
}

// ===== Business Error Factories =====

/**
 * Creates a ResourceNotFoundError instance for testing
 */
export function createResourceNotFoundError(
  resourceType: string = 'TestResource',
  resourceId: string = 'test-123',
  options: ErrorFactoryOptions = {}
): BusinessErrors.ResourceNotFoundError {
  const {
    message = `${resourceType} not found with ID: ${resourceId}`,
    code = 'BUSINESS_RESOURCE_NOT_FOUND',
    details = { resourceType, resourceId },
    cause
  } = options;

  return new BusinessErrors.ResourceNotFoundError(message, code, details, cause);
}

/**
 * Creates a BusinessRuleViolationError instance for testing
 */
export function createBusinessRuleViolationError(
  ruleName: string = 'TestBusinessRule',
  options: ErrorFactoryOptions = {}
): BusinessErrors.BusinessRuleViolationError {
  const {
    message = `Business rule violation: ${ruleName}`,
    code = 'BUSINESS_RULE_VIOLATION',
    details = { ruleName },
    cause
  } = options;

  return new BusinessErrors.BusinessRuleViolationError(message, code, details, cause);
}

/**
 * Creates a ConflictError instance for testing
 */
export function createConflictError(
  resourceType: string = 'TestResource',
  conflictReason: string = 'already exists',
  options: ErrorFactoryOptions = {}
): BusinessErrors.ConflictError {
  const {
    message = `Conflict: ${resourceType} ${conflictReason}`,
    code = 'BUSINESS_CONFLICT',
    details = { resourceType, conflictReason },
    cause
  } = options;

  return new BusinessErrors.ConflictError(message, code, details, cause);
}

// ===== Technical Error Factories =====

/**
 * Creates a DatabaseError instance for testing
 */
export function createDatabaseError(
  operation: string = 'query',
  options: ErrorFactoryOptions = {}
): TechnicalErrors.DatabaseError {
  const {
    message = `Database error during ${operation}`,
    code = 'TECHNICAL_DATABASE',
    details = { operation },
    cause
  } = options;

  return new TechnicalErrors.DatabaseError(message, code, details, cause);
}

/**
 * Creates a TimeoutError instance for testing
 */
export function createTimeoutError(
  service: string = 'TestService',
  operationName: string = 'testOperation',
  durationMs: number = 30000,
  options: ErrorFactoryOptions = {}
): TechnicalErrors.TimeoutError {
  const {
    message = `Timeout after ${durationMs}ms while calling ${service}.${operationName}`,
    code = 'TECHNICAL_TIMEOUT',
    details = { service, operationName, durationMs },
    cause
  } = options;

  return new TechnicalErrors.TimeoutError(message, code, details, cause);
}

/**
 * Creates a ConfigurationError instance for testing
 */
export function createConfigurationError(
  configKey: string = 'TEST_CONFIG',
  options: ErrorFactoryOptions = {}
): TechnicalErrors.ConfigurationError {
  const {
    message = `Configuration error: ${configKey} is invalid or missing`,
    code = 'TECHNICAL_CONFIGURATION',
    details = { configKey },
    cause
  } = options;

  return new TechnicalErrors.ConfigurationError(message, code, details, cause);
}

// ===== External Error Factories =====

/**
 * Creates an ExternalApiError instance for testing
 */
export function createExternalApiError(
  serviceName: string = 'TestExternalService',
  endpoint: string = '/api/test',
  statusCode: number = 500,
  options: ErrorFactoryOptions = {}
): ExternalErrors.ExternalApiError {
  const {
    message = `External API error: ${serviceName} returned ${statusCode} from ${endpoint}`,
    code = 'EXTERNAL_API_ERROR',
    details = { serviceName, endpoint, statusCode },
    cause
  } = options;

  return new ExternalErrors.ExternalApiError(message, code, details, cause);
}

/**
 * Creates an ExternalDependencyUnavailableError instance for testing
 */
export function createExternalDependencyUnavailableError(
  dependencyName: string = 'TestDependency',
  options: ErrorFactoryOptions = {}
): ExternalErrors.ExternalDependencyUnavailableError {
  const {
    message = `External dependency unavailable: ${dependencyName}`,
    code = 'EXTERNAL_DEPENDENCY_UNAVAILABLE',
    details = { dependencyName },
    cause
  } = options;

  return new ExternalErrors.ExternalDependencyUnavailableError(message, code, details, cause);
}

/**
 * Creates an ExternalRateLimitError instance for testing
 */
export function createExternalRateLimitError(
  serviceName: string = 'TestExternalService',
  retryAfterSeconds: number = 60,
  options: ErrorFactoryOptions = {}
): ExternalErrors.ExternalRateLimitError {
  const {
    message = `Rate limit exceeded for ${serviceName}. Retry after ${retryAfterSeconds} seconds`,
    code = 'EXTERNAL_RATE_LIMIT',
    details = { serviceName, retryAfterSeconds },
    cause
  } = options;

  return new ExternalErrors.ExternalRateLimitError(message, code, details, cause);
}

// ===== Journey-Specific Error Factories =====

/**
 * Factory functions for Health journey errors
 */
export const Health = {
  /**
   * Creates a health metrics error for testing
   */
  createMetricError(
    metricType: string = 'heartRate',
    options: ErrorFactoryOptions = {}
  ): HealthErrors.Health.Metrics.InvalidMetricValueError {
    const {
      message = `Invalid ${metricType} metric value`,
      code = `HEALTH_METRICS_INVALID_${metricType.toUpperCase()}`,
      details = { metricType },
      cause
    } = options;

    return new HealthErrors.Health.Metrics.InvalidMetricValueError(message, code, details, cause);
  },

  /**
   * Creates a health goal error for testing
   */
  createGoalError(
    goalType: string = 'steps',
    options: ErrorFactoryOptions = {}
  ): HealthErrors.Health.Goals.InvalidGoalParametersError {
    const {
      message = `Invalid parameters for ${goalType} goal`,
      code = `HEALTH_GOALS_INVALID_${goalType.toUpperCase()}`,
      details = { goalType },
      cause
    } = options;

    return new HealthErrors.Health.Goals.InvalidGoalParametersError(message, code, details, cause);
  },

  /**
   * Creates a device connection error for testing
   */
  createDeviceError(
    deviceType: string = 'fitbit',
    options: ErrorFactoryOptions = {}
  ): HealthErrors.Health.Devices.DeviceConnectionFailureError {
    const {
      message = `Failed to connect to ${deviceType} device`,
      code = `HEALTH_DEVICES_CONNECTION_${deviceType.toUpperCase()}`,
      details = { deviceType },
      cause
    } = options;

    return new HealthErrors.Health.Devices.DeviceConnectionFailureError(message, code, details, cause);
  },

  /**
   * Creates a FHIR integration error for testing
   */
  createFhirError(
    resourceType: string = 'Patient',
    options: ErrorFactoryOptions = {}
  ): HealthErrors.Health.FHIR.InvalidResourceError {
    const {
      message = `Invalid FHIR ${resourceType} resource`,
      code = `HEALTH_FHIR_INVALID_${resourceType.toUpperCase()}`,
      details = { resourceType },
      cause
    } = options;

    return new HealthErrors.Health.FHIR.InvalidResourceError(message, code, details, cause);
  }
};

/**
 * Factory functions for Care journey errors
 */
export const Care = {
  /**
   * Creates an appointment error for testing
   */
  createAppointmentError(
    errorType: string = 'notFound',
    appointmentId: string = 'appt-123',
    options: ErrorFactoryOptions = {}
  ): CareErrors.AppointmentNotFoundError {
    const {
      message = `Appointment ${errorType}: ${appointmentId}`,
      code = `CARE_APPOINTMENT_${errorType.toUpperCase()}`,
      details = { appointmentId },
      cause
    } = options;

    return new CareErrors.AppointmentNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a provider error for testing
   */
  createProviderError(
    errorType: string = 'notFound',
    providerId: string = 'provider-123',
    options: ErrorFactoryOptions = {}
  ): CareErrors.ProviderNotFoundError {
    const {
      message = `Provider ${errorType}: ${providerId}`,
      code = `CARE_PROVIDER_${errorType.toUpperCase()}`,
      details = { providerId },
      cause
    } = options;

    return new CareErrors.ProviderNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a medication error for testing
   */
  createMedicationError(
    errorType: string = 'notFound',
    medicationId: string = 'med-123',
    options: ErrorFactoryOptions = {}
  ): CareErrors.MedicationNotFoundError {
    const {
      message = `Medication ${errorType}: ${medicationId}`,
      code = `CARE_MEDICATION_${errorType.toUpperCase()}`,
      details = { medicationId },
      cause
    } = options;

    return new CareErrors.MedicationNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a telemedicine error for testing
   */
  createTelemedicineError(
    errorType: string = 'connection',
    sessionId: string = 'session-123',
    options: ErrorFactoryOptions = {}
  ): CareErrors.TelemedicineConnectionError {
    const {
      message = `Telemedicine ${errorType} error: ${sessionId}`,
      code = `CARE_TELEMEDICINE_${errorType.toUpperCase()}`,
      details = { sessionId },
      cause
    } = options;

    return new CareErrors.TelemedicineConnectionError(message, code, details, cause);
  }
};

/**
 * Factory functions for Plan journey errors
 */
export const Plan = {
  /**
   * Creates a plan error for testing
   */
  createPlanError(
    errorType: string = 'notFound',
    planId: string = 'plan-123',
    options: ErrorFactoryOptions = {}
  ): PlanErrors.Plans.PlanNotFoundError {
    const {
      message = `Plan ${errorType}: ${planId}`,
      code = `PLAN_PLANS_${errorType.toUpperCase()}`,
      details = { planId },
      cause
    } = options;

    return new PlanErrors.Plans.PlanNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a benefit error for testing
   */
  createBenefitError(
    errorType: string = 'notFound',
    benefitId: string = 'benefit-123',
    options: ErrorFactoryOptions = {}
  ): PlanErrors.Benefits.BenefitNotFoundError {
    const {
      message = `Benefit ${errorType}: ${benefitId}`,
      code = `PLAN_BENEFITS_${errorType.toUpperCase()}`,
      details = { benefitId },
      cause
    } = options;

    return new PlanErrors.Benefits.BenefitNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a claim error for testing
   */
  createClaimError(
    errorType: string = 'notFound',
    claimId: string = 'claim-123',
    options: ErrorFactoryOptions = {}
  ): PlanErrors.Claims.ClaimNotFoundError {
    const {
      message = `Claim ${errorType}: ${claimId}`,
      code = `PLAN_CLAIMS_${errorType.toUpperCase()}`,
      details = { claimId },
      cause
    } = options;

    return new PlanErrors.Claims.ClaimNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a coverage error for testing
   */
  createCoverageError(
    errorType: string = 'notFound',
    coverageId: string = 'coverage-123',
    options: ErrorFactoryOptions = {}
  ): PlanErrors.Coverage.CoverageNotFoundError {
    const {
      message = `Coverage ${errorType}: ${coverageId}`,
      code = `PLAN_COVERAGE_${errorType.toUpperCase()}`,
      details = { coverageId },
      cause
    } = options;

    return new PlanErrors.Coverage.CoverageNotFoundError(message, code, details, cause);
  },

  /**
   * Creates a document error for testing
   */
  createDocumentError(
    errorType: string = 'notFound',
    documentId: string = 'doc-123',
    options: ErrorFactoryOptions = {}
  ): PlanErrors.Documents.DocumentNotFoundError {
    const {
      message = `Document ${errorType}: ${documentId}`,
      code = `PLAN_DOCUMENTS_${errorType.toUpperCase()}`,
      details = { documentId },
      cause
    } = options;

    return new PlanErrors.Documents.DocumentNotFoundError(message, code, details, cause);
  }
};