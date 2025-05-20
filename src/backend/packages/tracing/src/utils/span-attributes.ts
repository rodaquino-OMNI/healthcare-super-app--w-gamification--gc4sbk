/**
 * Utility functions for enriching OpenTelemetry spans with standardized attributes.
 * These utilities enable consistent and searchable trace data across the AUSTA SuperApp.
 */

import { Span, SpanStatusCode } from '@opentelemetry/api';

/**
 * Common attribute namespace constants to ensure consistent naming across the application.
 */
export enum AttributeNamespace {
  AUSTA = 'austa',
  USER = 'user',
  REQUEST = 'request',
  SERVICE = 'service',
  JOURNEY = 'journey',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

/**
 * Journey types supported by the AUSTA SuperApp.
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Error classification types for consistent error categorization.
 */
export enum ErrorType {
  CLIENT = 'client',     // 4xx errors, client-side issues
  SYSTEM = 'system',     // 5xx errors, internal system failures
  TRANSIENT = 'transient', // Temporary failures that may resolve with retry
  EXTERNAL = 'external',  // Failures in external dependencies
}

/**
 * Adds common user-related attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param userId The unique identifier of the user
 * @param sessionId Optional session identifier for the user's current session
 * @param additionalAttributes Optional additional user attributes to include
 * @returns The span with added attributes
 */
export function addUserAttributes(
  span: Span,
  userId: string,
  sessionId?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.id`, userId);
  
  if (sessionId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.session_id`, sessionId);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.USER}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds request-related attributes to a span for correlation and tracking.
 * @param span The OpenTelemetry span to add attributes to
 * @param requestId The unique identifier of the request
 * @param correlationId Optional correlation ID for tracking related requests
 * @param additionalAttributes Optional additional request attributes to include
 * @returns The span with added attributes
 */
export function addRequestAttributes(
  span: Span,
  requestId: string,
  correlationId?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.id`, requestId);
  
  if (correlationId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.correlation_id`, correlationId);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.REQUEST}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds service-related attributes to a span for service identification.
 * @param span The OpenTelemetry span to add attributes to
 * @param serviceName The name of the service
 * @param serviceVersion Optional version of the service
 * @param additionalAttributes Optional additional service attributes to include
 * @returns The span with added attributes
 */
export function addServiceAttributes(
  span: Span,
  serviceName: string,
  serviceVersion?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.name`, serviceName);
  
  if (serviceVersion) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.version`, serviceVersion);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.SERVICE}.${key}`, value);
    });
  }
  
  return span;
}

// ===== JOURNEY-SPECIFIC ATTRIBUTE HELPERS =====

/**
 * Adds Health journey-specific attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param metricType Optional type of health metric being tracked (e.g., 'heart_rate', 'blood_pressure')
 * @param deviceId Optional identifier of the device providing the data
 * @param goalId Optional identifier of the related health goal
 * @param additionalAttributes Optional additional health journey attributes
 * @returns The span with added attributes
 */
export function addHealthJourneyAttributes(
  span: Span,
  metricType?: string,
  deviceId?: string,
  goalId?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`, JourneyType.HEALTH);
  
  if (metricType) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.metric_type`, metricType);
  }
  
  if (deviceId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.device_id`, deviceId);
  }
  
  if (goalId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.goal_id`, goalId);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.HEALTH}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds Care journey-specific attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param appointmentId Optional identifier of the appointment
 * @param providerId Optional identifier of the healthcare provider
 * @param sessionId Optional identifier of the telemedicine session
 * @param treatmentPlanId Optional identifier of the treatment plan
 * @param additionalAttributes Optional additional care journey attributes
 * @returns The span with added attributes
 */
export function addCareJourneyAttributes(
  span: Span,
  appointmentId?: string,
  providerId?: string,
  sessionId?: string,
  treatmentPlanId?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`, JourneyType.CARE);
  
  if (appointmentId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.appointment_id`, appointmentId);
  }
  
  if (providerId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.provider_id`, providerId);
  }
  
  if (sessionId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.session_id`, sessionId);
  }
  
  if (treatmentPlanId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.treatment_plan_id`, treatmentPlanId);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.CARE}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds Plan journey-specific attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param planId Optional identifier of the insurance plan
 * @param claimId Optional identifier of the insurance claim
 * @param benefitId Optional identifier of the specific benefit
 * @param additionalAttributes Optional additional plan journey attributes
 * @returns The span with added attributes
 */
export function addPlanJourneyAttributes(
  span: Span,
  planId?: string,
  claimId?: string,
  benefitId?: string,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.type`, JourneyType.PLAN);
  
  if (planId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.plan_id`, planId);
  }
  
  if (claimId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.claim_id`, claimId);
  }
  
  if (benefitId) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.benefit_id`, benefitId);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.JOURNEY}.${JourneyType.PLAN}.${key}`, value);
    });
  }
  
  return span;
}

// ===== ERROR ATTRIBUTE UTILITIES =====

/**
 * Adds error-related attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param error The error object
 * @param errorType The classification of the error
 * @param additionalAttributes Optional additional error attributes
 * @returns The span with added attributes
 */
export function addErrorAttributes(
  span: Span,
  error: Error,
  errorType: ErrorType,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  // Set span status to ERROR
  span.setStatus({ code: SpanStatusCode.ERROR });
  
  // Record the exception
  span.recordException(error);
  
  // Add error attributes
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.type`, errorType);
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.message`, error.message);
  span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.name`, error.name);
  
  if (error.stack) {
    span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.stack`, error.stack);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${AttributeNamespace.AUSTA}.${AttributeNamespace.ERROR}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Helper function to classify HTTP errors based on status code.
 * @param statusCode The HTTP status code
 * @returns The appropriate ErrorType classification
 */
export function classifyHttpError(statusCode: number): ErrorType {
  if (statusCode >= 400 && statusCode < 500) {
    return ErrorType.CLIENT;
  } else if (statusCode >= 500) {
    return ErrorType.SYSTEM;
  } else {
    return ErrorType.SYSTEM; // Default to system error for unexpected cases
  }
}

// ===== PERFORMANCE METRIC ATTRIBUTE HELPERS =====

/**
 * Adds database operation performance attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param operation The database operation type (e.g., 'query', 'insert', 'update')
 * @param table The database table being accessed
 * @param durationMs The duration of the operation in milliseconds
 * @param recordCount Optional number of records affected/returned
 * @param additionalAttributes Optional additional performance attributes
 * @returns The span with added attributes
 */
export function addDatabasePerformanceAttributes(
  span: Span,
  operation: string,
  table: string,
  durationMs: number,
  recordCount?: number,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.database`;
  
  span.setAttribute(`${perfNamespace}.operation`, operation);
  span.setAttribute(`${perfNamespace}.table`, table);
  span.setAttribute(`${perfNamespace}.duration_ms`, durationMs);
  
  if (recordCount !== undefined) {
    span.setAttribute(`${perfNamespace}.record_count`, recordCount);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${perfNamespace}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds external service call performance attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param serviceName The name of the external service
 * @param operation The operation being performed
 * @param durationMs The duration of the operation in milliseconds
 * @param statusCode Optional status code returned by the service
 * @param additionalAttributes Optional additional performance attributes
 * @returns The span with added attributes
 */
export function addExternalServicePerformanceAttributes(
  span: Span,
  serviceName: string,
  operation: string,
  durationMs: number,
  statusCode?: number,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.external`;
  
  span.setAttribute(`${perfNamespace}.service`, serviceName);
  span.setAttribute(`${perfNamespace}.operation`, operation);
  span.setAttribute(`${perfNamespace}.duration_ms`, durationMs);
  
  if (statusCode !== undefined) {
    span.setAttribute(`${perfNamespace}.status_code`, statusCode);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${perfNamespace}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Adds processing time performance attributes to a span.
 * @param span The OpenTelemetry span to add attributes to
 * @param operationType The type of operation being performed
 * @param durationMs The duration of the operation in milliseconds
 * @param itemCount Optional number of items processed
 * @param additionalAttributes Optional additional performance attributes
 * @returns The span with added attributes
 */
export function addProcessingPerformanceAttributes(
  span: Span,
  operationType: string,
  durationMs: number,
  itemCount?: number,
  additionalAttributes?: Record<string, string | number | boolean>
): Span {
  const perfNamespace = `${AttributeNamespace.AUSTA}.${AttributeNamespace.PERFORMANCE}.processing`;
  
  span.setAttribute(`${perfNamespace}.operation_type`, operationType);
  span.setAttribute(`${perfNamespace}.duration_ms`, durationMs);
  
  if (itemCount !== undefined) {
    span.setAttribute(`${perfNamespace}.item_count`, itemCount);
  }
  
  if (additionalAttributes) {
    Object.entries(additionalAttributes).forEach(([key, value]) => {
      span.setAttribute(`${perfNamespace}.${key}`, value);
    });
  }
  
  return span;
}

/**
 * Utility function to measure and record the execution time of a function.
 * @param span The OpenTelemetry span to add attributes to
 * @param attributeNamespace The namespace to use for the duration attribute
 * @param attributeName The name to use for the duration attribute
 * @param fn The function to execute and measure
 * @returns The result of the function execution
 */
export async function measureExecutionTime<T>(
  span: Span,
  attributeNamespace: string,
  attributeName: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    return await fn();
  } finally {
    const duration = Date.now() - startTime;
    span.setAttribute(`${AttributeNamespace.AUSTA}.${attributeNamespace}.${attributeName}_duration_ms`, duration);
  }
}