import { SpanStatusCode } from '@opentelemetry/api';
import { JourneyContextInfo } from '../../src/interfaces/trace-context.interface';
import * as ErrorCodes from '../../src/constants/error-codes';

/**
 * Interface for error scenario definitions used in tracing tests
 */
export interface ErrorScenario {
  /** Name of the error scenario */
  name: string;
  /** Error object to be used in the test */
  error: Error;
  /** Expected span status code after error handling */
  expectedStatus: SpanStatusCode;
  /** Expected attributes to be set on the span */
  expectedAttributes?: Record<string, any>;
  /** Journey context associated with the error, if applicable */
  journeyContext?: JourneyContextInfo;
  /** Description of the error scenario for documentation */
  description: string;
}

/**
 * Base class for custom errors with additional properties
 */
export class BaseError extends Error {
  /** Error code for categorization */
  code: string;
  /** HTTP status code associated with the error */
  statusCode: number;
  /** Whether the error is retryable */
  retryable: boolean;
  /** Journey context associated with the error, if applicable */
  journeyContext?: JourneyContextInfo;

  constructor(message: string, code: string, statusCode: number, retryable = false) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Adds journey context to the error
   * @param journeyContext Journey context to add
   * @returns This error instance with journey context
   */
  withJourneyContext(journeyContext: JourneyContextInfo): this {
    this.journeyContext = journeyContext;
    return this;
  }
}

/**
 * Client error classes (4xx)
 */

/** Error for validation failures */
export class ValidationError extends BaseError {
  /** Validation errors by field */
  validationErrors: Record<string, string[]>;

  constructor(message: string, validationErrors: Record<string, string[]>) {
    super(message, ErrorCodes.SPAN_ATTRIBUTE_INVALID, 400, false);
    this.validationErrors = validationErrors;
  }
}

/** Error for authentication failures */
export class AuthenticationError extends BaseError {
  constructor(message: string) {
    super(message, ErrorCodes.CONTEXT_EXTRACTION_FAILED, 401, false);
  }
}

/** Error for authorization failures */
export class AuthorizationError extends BaseError {
  constructor(message: string) {
    super(message, ErrorCodes.CONTEXT_EXTRACTION_FAILED, 403, false);
  }
}

/** Error for resource not found */
export class NotFoundError extends BaseError {
  /** Resource type that was not found */
  resourceType: string;
  /** Resource ID that was not found */
  resourceId: string;

  constructor(resourceType: string, resourceId: string) {
    super(`${resourceType} with ID ${resourceId} not found`, ErrorCodes.RESOURCE_DETECTION_FAILED, 404, false);
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }
}

/**
 * System error classes (5xx)
 */

/** Error for database failures */
export class DatabaseError extends BaseError {
  /** Database operation that failed */
  operation: string;
  /** Database table or collection involved */
  table: string;
  /** SQL query or database command that failed, if applicable */
  query?: string;

  constructor(message: string, operation: string, table: string, query?: string) {
    super(message, ErrorCodes.TRACING_OPERATION_FAILED, 500, true);
    this.operation = operation;
    this.table = table;
    this.query = query;
  }
}

/** Error for internal server errors */
export class InternalServerError extends BaseError {
  /** Component where the error occurred */
  component: string;
  /** Function where the error occurred */
  functionName: string;

  constructor(message: string, component: string, functionName: string) {
    super(message, ErrorCodes.TRACING_OPERATION_FAILED, 500, true);
    this.component = component;
    this.functionName = functionName;
  }
}

/** Error for configuration issues */
export class ConfigurationError extends BaseError {
  /** Configuration key that caused the issue */
  configKey: string;
  /** Expected configuration value type */
  expectedType: string;
  /** Actual configuration value received */
  actualValue: any;

  constructor(configKey: string, expectedType: string, actualValue: any) {
    super(
      `Invalid configuration for ${configKey}: expected ${expectedType}, got ${typeof actualValue}`,
      ErrorCodes.TRACING_CONFIGURATION_INVALID,
      500,
      false
    );
    this.configKey = configKey;
    this.expectedType = expectedType;
    this.actualValue = actualValue;
  }
}

/**
 * Transient error classes (retryable)
 */

/** Error for network timeouts */
export class NetworkTimeoutError extends BaseError {
  /** URL that timed out */
  url: string;
  /** Timeout duration in milliseconds */
  timeoutMs: number;

  constructor(url: string, timeoutMs: number) {
    super(
      `Request to ${url} timed out after ${timeoutMs}ms`,
      ErrorCodes.BATCH_EXPORT_TIMEOUT,
      504,
      true
    );
    this.url = url;
    this.timeoutMs = timeoutMs;
  }
}

/** Error for temporary service unavailability */
export class TemporaryUnavailableError extends BaseError {
  /** Service that is unavailable */
  serviceName: string;
  /** Estimated retry after time in seconds */
  retryAfterSec: number;

  constructor(serviceName: string, retryAfterSec: number) {
    super(
      `Service ${serviceName} temporarily unavailable, retry after ${retryAfterSec} seconds`,
      ErrorCodes.INSTRUMENTATION_DISABLED,
      503,
      true
    );
    this.serviceName = serviceName;
    this.retryAfterSec = retryAfterSec;
  }
}

/** Error for rate limiting */
export class RateLimitError extends BaseError {
  /** Resource that is rate limited */
  resource: string;
  /** Rate limit in requests per second */
  rateLimit: number;
  /** Current usage in requests per second */
  currentUsage: number;
  /** Reset time in seconds */
  resetInSec: number;

  constructor(resource: string, rateLimit: number, currentUsage: number, resetInSec: number) {
    super(
      `Rate limit exceeded for ${resource}: ${currentUsage}/${rateLimit} requests, resets in ${resetInSec} seconds`,
      ErrorCodes.BATCH_PROCESSING_FAILED,
      429,
      true
    );
    this.resource = resource;
    this.rateLimit = rateLimit;
    this.currentUsage = currentUsage;
    this.resetInSec = resetInSec;
  }
}

/**
 * External dependency error classes
 */

/** Error for external service failures */
export class ExternalServiceError extends BaseError {
  /** External service name */
  serviceName: string;
  /** External service endpoint */
  endpoint: string;
  /** External service response status code */
  externalStatusCode: number;
  /** External service response body */
  responseBody?: string;

  constructor(
    serviceName: string,
    endpoint: string,
    externalStatusCode: number,
    responseBody?: string
  ) {
    super(
      `External service ${serviceName} failed with status ${externalStatusCode}`,
      ErrorCodes.EXPORTER_CONNECTION_FAILED,
      502,
      true
    );
    this.serviceName = serviceName;
    this.endpoint = endpoint;
    this.externalStatusCode = externalStatusCode;
    this.responseBody = responseBody;
  }
}

/** Error for API integration issues */
export class ApiIntegrationError extends BaseError {
  /** API name */
  apiName: string;
  /** API version */
  apiVersion: string;
  /** API method */
  method: string;
  /** Error details from the API */
  details: Record<string, any>;

  constructor(apiName: string, apiVersion: string, method: string, details: Record<string, any>) {
    super(
      `API integration error with ${apiName} v${apiVersion} ${method}`,
      ErrorCodes.EXPORTER_CONFIGURATION_INVALID,
      502,
      true
    );
    this.apiName = apiName;
    this.apiVersion = apiVersion;
    this.method = method;
    this.details = details;
  }
}

/** Error for dependency timeout */
export class DependencyTimeoutError extends BaseError {
  /** Dependency name */
  dependencyName: string;
  /** Operation that timed out */
  operation: string;
  /** Timeout duration in milliseconds */
  timeoutMs: number;

  constructor(dependencyName: string, operation: string, timeoutMs: number) {
    super(
      `Dependency ${dependencyName} operation ${operation} timed out after ${timeoutMs}ms`,
      ErrorCodes.BATCH_EXPORT_TIMEOUT,
      504,
      true
    );
    this.dependencyName = dependencyName;
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Journey-specific error contexts
 */

/** Health journey context */
export const healthJourneyContext: JourneyContextInfo = {
  journeyType: 'health',
  journeyId: 'health-journey-123',
  userId: 'user-456',
  sessionId: 'session-789',
  requestId: 'req-abc-123',
};

/** Care journey context */
export const careJourneyContext: JourneyContextInfo = {
  journeyType: 'care',
  journeyId: 'care-journey-456',
  userId: 'user-789',
  sessionId: 'session-abc',
  requestId: 'req-def-456',
};

/** Plan journey context */
export const planJourneyContext: JourneyContextInfo = {
  journeyType: 'plan',
  journeyId: 'plan-journey-789',
  userId: 'user-abc',
  sessionId: 'session-def',
  requestId: 'req-ghi-789',
};

/**
 * Predefined error scenarios for testing
 */
export const errorScenarios: ErrorScenario[] = [
  // Client errors (4xx)
  {
    name: 'validation_error',
    error: new ValidationError('Invalid input data', {
      email: ['Email is invalid'],
      password: ['Password must be at least 8 characters'],
    }).withJourneyContext(healthJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'ValidationError',
      'error.code': ErrorCodes.SPAN_ATTRIBUTE_INVALID,
      'error.http.status_code': 400,
      'error.retryable': false,
      'journey.type': 'health',
      'journey.id': 'health-journey-123',
    },
    journeyContext: healthJourneyContext,
    description: 'Validation error for health journey user input',
  },
  {
    name: 'authentication_error',
    error: new AuthenticationError('Invalid credentials').withJourneyContext(careJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'AuthenticationError',
      'error.code': ErrorCodes.CONTEXT_EXTRACTION_FAILED,
      'error.http.status_code': 401,
      'error.retryable': false,
      'journey.type': 'care',
      'journey.id': 'care-journey-456',
    },
    journeyContext: careJourneyContext,
    description: 'Authentication error for care journey login',
  },
  {
    name: 'not_found_error',
    error: new NotFoundError('Appointment', '12345').withJourneyContext(careJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'NotFoundError',
      'error.code': ErrorCodes.RESOURCE_DETECTION_FAILED,
      'error.http.status_code': 404,
      'error.retryable': false,
      'error.resource.type': 'Appointment',
      'error.resource.id': '12345',
      'journey.type': 'care',
      'journey.id': 'care-journey-456',
    },
    journeyContext: careJourneyContext,
    description: 'Resource not found error for care journey appointment',
  },

  // System errors (5xx)
  {
    name: 'database_error',
    error: new DatabaseError(
      'Failed to execute query',
      'SELECT',
      'health_metrics',
      'SELECT * FROM health_metrics WHERE user_id = ?'
    ).withJourneyContext(healthJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'DatabaseError',
      'error.code': ErrorCodes.TRACING_OPERATION_FAILED,
      'error.http.status_code': 500,
      'error.retryable': true,
      'error.db.operation': 'SELECT',
      'error.db.table': 'health_metrics',
      'journey.type': 'health',
      'journey.id': 'health-journey-123',
    },
    journeyContext: healthJourneyContext,
    description: 'Database error for health journey metrics query',
  },
  {
    name: 'internal_server_error',
    error: new InternalServerError(
      'Unexpected error processing request',
      'HealthMetricsService',
      'processMetricUpdate'
    ).withJourneyContext(healthJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'InternalServerError',
      'error.code': ErrorCodes.TRACING_OPERATION_FAILED,
      'error.http.status_code': 500,
      'error.retryable': true,
      'error.component': 'HealthMetricsService',
      'error.function': 'processMetricUpdate',
      'journey.type': 'health',
      'journey.id': 'health-journey-123',
    },
    journeyContext: healthJourneyContext,
    description: 'Internal server error for health journey metric processing',
  },
  {
    name: 'configuration_error',
    error: new ConfigurationError('database.maxConnections', 'number', 'ten').withJourneyContext(planJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'ConfigurationError',
      'error.code': ErrorCodes.TRACING_CONFIGURATION_INVALID,
      'error.http.status_code': 500,
      'error.retryable': false,
      'error.config.key': 'database.maxConnections',
      'error.config.expected_type': 'number',
      'journey.type': 'plan',
      'journey.id': 'plan-journey-789',
    },
    journeyContext: planJourneyContext,
    description: 'Configuration error for plan journey database settings',
  },

  // Transient errors
  {
    name: 'network_timeout_error',
    error: new NetworkTimeoutError('https://api.external-health-provider.com/metrics', 5000).withJourneyContext(
      healthJourneyContext
    ),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'NetworkTimeoutError',
      'error.code': ErrorCodes.BATCH_EXPORT_TIMEOUT,
      'error.http.status_code': 504,
      'error.retryable': true,
      'error.url': 'https://api.external-health-provider.com/metrics',
      'error.timeout_ms': 5000,
      'journey.type': 'health',
      'journey.id': 'health-journey-123',
    },
    journeyContext: healthJourneyContext,
    description: 'Network timeout error for health journey external API call',
  },
  {
    name: 'temporary_unavailable_error',
    error: new TemporaryUnavailableError('appointment-service', 30).withJourneyContext(careJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'TemporaryUnavailableError',
      'error.code': ErrorCodes.INSTRUMENTATION_DISABLED,
      'error.http.status_code': 503,
      'error.retryable': true,
      'error.service': 'appointment-service',
      'error.retry_after_sec': 30,
      'journey.type': 'care',
      'journey.id': 'care-journey-456',
    },
    journeyContext: careJourneyContext,
    description: 'Temporary unavailable error for care journey appointment service',
  },
  {
    name: 'rate_limit_error',
    error: new RateLimitError('insurance-api', 100, 120, 60).withJourneyContext(planJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'RateLimitError',
      'error.code': ErrorCodes.BATCH_PROCESSING_FAILED,
      'error.http.status_code': 429,
      'error.retryable': true,
      'error.resource': 'insurance-api',
      'error.rate_limit': 100,
      'error.current_usage': 120,
      'error.reset_in_sec': 60,
      'journey.type': 'plan',
      'journey.id': 'plan-journey-789',
    },
    journeyContext: planJourneyContext,
    description: 'Rate limit error for plan journey insurance API',
  },

  // External dependency errors
  {
    name: 'external_service_error',
    error: new ExternalServiceError(
      'health-data-provider',
      '/api/v1/sync',
      500,
      '{"error":"Internal server error"}'
    ).withJourneyContext(healthJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'ExternalServiceError',
      'error.code': ErrorCodes.EXPORTER_CONNECTION_FAILED,
      'error.http.status_code': 502,
      'error.retryable': true,
      'error.external.service': 'health-data-provider',
      'error.external.endpoint': '/api/v1/sync',
      'error.external.status_code': 500,
      'journey.type': 'health',
      'journey.id': 'health-journey-123',
    },
    journeyContext: healthJourneyContext,
    description: 'External service error for health journey data provider',
  },
  {
    name: 'api_integration_error',
    error: new ApiIntegrationError('telemedicine-api', '2.0', 'POST /sessions', {
      code: 'INVALID_PARAMETERS',
      message: 'Missing required parameters',
      details: ['provider_id is required'],
    }).withJourneyContext(careJourneyContext),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'ApiIntegrationError',
      'error.code': ErrorCodes.EXPORTER_CONFIGURATION_INVALID,
      'error.http.status_code': 502,
      'error.retryable': true,
      'error.api.name': 'telemedicine-api',
      'error.api.version': '2.0',
      'error.api.method': 'POST /sessions',
      'journey.type': 'care',
      'journey.id': 'care-journey-456',
    },
    journeyContext: careJourneyContext,
    description: 'API integration error for care journey telemedicine session',
  },
  {
    name: 'dependency_timeout_error',
    error: new DependencyTimeoutError('claims-processor', 'submitClaim', 10000).withJourneyContext(
      planJourneyContext
    ),
    expectedStatus: SpanStatusCode.ERROR,
    expectedAttributes: {
      'error.type': 'DependencyTimeoutError',
      'error.code': ErrorCodes.BATCH_EXPORT_TIMEOUT,
      'error.http.status_code': 504,
      'error.retryable': true,
      'error.dependency': 'claims-processor',
      'error.operation': 'submitClaim',
      'error.timeout_ms': 10000,
      'journey.type': 'plan',
      'journey.id': 'plan-journey-789',
    },
    journeyContext: planJourneyContext,
    description: 'Dependency timeout error for plan journey claim submission',
  },
];

/**
 * Creates a realistic stack trace for an error
 * @param error Error to enhance with a stack trace
 * @param depth Stack depth to generate
 * @returns The error with an enhanced stack trace
 */
export function createRealisticStackTrace(error: Error, depth = 5): Error {
  const originalStack = error.stack || '';
  const firstLine = originalStack.split('\n')[0];
  let newStack = `${firstLine}\n`;
  
  // Add some realistic stack frames
  const frames = [
    '    at processRequest (/src/backend/api-gateway/src/controllers/request.controller.ts:42:23)',
    '    at validateInput (/src/backend/shared/src/validation/input-validator.ts:87:12)',
    '    at handleRequest (/src/backend/api-gateway/src/middleware/request-handler.ts:156:18)',
    '    at async NestMiddleware.handle (/src/backend/api-gateway/src/middleware/base.middleware.ts:32:5)',
    '    at async ExpressAdapter.callback (/node_modules/@nestjs/platform-express/adapters/express-adapter.js:74:20)',
    '    at async Server.handleRequest (/node_modules/express/lib/server.js:335:10)',
    '    at async emitTwo (/node_modules/events/events.js:126:13)',
    '    at async Server.emit (/node_modules/events/events.js:214:7)',
    '    at async Server.EventEmitter.emit (node:events:394:28)',
    '    at async TCP.onStreamRead (node:internal/stream_base_commons:217:20)',
  ];
  
  // Add random frames from the list up to the specified depth
  for (let i = 0; i < depth; i++) {
    const frameIndex = Math.floor(Math.random() * frames.length);
    newStack += frames[frameIndex] + '\n';
  }
  
  error.stack = newStack;
  return error;
}

// Enhance all error scenarios with realistic stack traces
errorScenarios.forEach(scenario => {
  createRealisticStackTrace(scenario.error, 7);
});

/**
 * Gets an error scenario by name
 * @param name Name of the error scenario to retrieve
 * @returns The error scenario or undefined if not found
 */
export function getErrorScenario(name: string): ErrorScenario | undefined {
  return errorScenarios.find(scenario => scenario.name === name);
}

/**
 * Gets all error scenarios for a specific journey type
 * @param journeyType Type of journey to filter by
 * @returns Array of error scenarios for the specified journey type
 */
export function getErrorScenariosByJourney(journeyType: 'health' | 'care' | 'plan'): ErrorScenario[] {
  return errorScenarios.filter(
    scenario => scenario.journeyContext?.journeyType === journeyType
  );
}

/**
 * Gets all error scenarios by HTTP status code range
 * @param statusCodeRange Range of HTTP status codes to filter by (e.g., '4xx' or '5xx')
 * @returns Array of error scenarios matching the status code range
 */
export function getErrorScenariosByStatusCode(statusCodeRange: '4xx' | '5xx'): ErrorScenario[] {
  const minStatus = statusCodeRange === '4xx' ? 400 : 500;
  const maxStatus = statusCodeRange === '4xx' ? 499 : 599;
  
  return errorScenarios.filter(scenario => {
    const error = scenario.error as BaseError;
    return error.statusCode >= minStatus && error.statusCode <= maxStatus;
  });
}

/**
 * Gets all retryable error scenarios
 * @returns Array of error scenarios that are retryable
 */
export function getRetryableErrorScenarios(): ErrorScenario[] {
  return errorScenarios.filter(scenario => {
    const error = scenario.error as BaseError;
    return error.retryable;
  });
}

/**
 * Gets all non-retryable error scenarios
 * @returns Array of error scenarios that are not retryable
 */
export function getNonRetryableErrorScenarios(): ErrorScenario[] {
  return errorScenarios.filter(scenario => {
    const error = scenario.error as BaseError;
    return !error.retryable;
  });
}