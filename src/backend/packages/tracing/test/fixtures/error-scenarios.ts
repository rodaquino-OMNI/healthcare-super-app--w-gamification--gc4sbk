/**
 * @file error-scenarios.ts
 * @description Predefined error scenarios and exceptions for testing error handling in trace spans.
 * Provides error objects, stack traces, and expected span status configurations to ensure proper
 * error recording, status setting, and exception handling within the tracing system.
 */

import { SpanStatusCode } from '@opentelemetry/api';
import { BaseError, ErrorType, JourneyType } from '@austa/errors/base';
import {
  ValidationError,
  BusinessError,
  TechnicalError,
  ExternalError,
  DatabaseError,
  TimeoutError,
  ServiceUnavailableError,
  DataProcessingError,
  ConfigurationError,
  InitializationError
} from '@austa/errors';

/**
 * Interface defining an error scenario for testing
 */
export interface ErrorScenario {
  /** Name of the error scenario */
  name: string;
  /** Description of the error scenario */
  description: string;
  /** The error object */
  error: Error;
  /** Expected span status code */
  expectedSpanStatus: SpanStatusCode;
  /** Expected span status message */
  expectedStatusMessage?: string;
  /** Expected error attributes to be set on the span */
  expectedAttributes?: Record<string, string | number | boolean>;
  /** Whether the error is expected to be handled */
  isHandled?: boolean;
}

/**
 * Interface for journey-specific error scenarios
 */
export interface JourneyErrorScenario extends ErrorScenario {
  /** The journey type */
  journeyType: JourneyType;
  /** The journey-specific context */
  journeyContext: Record<string, any>;
}

/**
 * Creates a stack trace string for testing purposes
 * @param errorName The name of the error
 * @param message The error message
 * @param filePath The file path where the error occurred
 * @param lineNumber The line number where the error occurred
 * @param columnNumber The column number where the error occurred
 * @param additionalFrames Additional stack frames to include
 * @returns A formatted stack trace string
 */
function createStackTrace(
  errorName: string,
  message: string,
  filePath: string,
  lineNumber: number,
  columnNumber: number,
  additionalFrames: Array<{ func: string; file: string; line: number; col: number }> = []
): string {
  let stack = `${errorName}: ${message}\n`;
  stack += `    at ${filePath}:${lineNumber}:${columnNumber}\n`;
  
  for (const frame of additionalFrames) {
    stack += `    at ${frame.func} (${frame.file}:${frame.line}:${frame.col})\n`;
  }
  
  return stack;
}

/**
 * Basic error scenarios for testing general error handling
 */
export const basicErrorScenarios: ErrorScenario[] = [
  {
    name: 'standard_error',
    description: 'Standard JavaScript Error',
    error: (() => {
      const error = new Error('A standard JavaScript error');
      error.stack = createStackTrace(
        'Error',
        'A standard JavaScript error',
        '/src/service.js',
        123,
        45,
        [
          { func: 'processRequest', file: '/src/handlers.js', line: 89, col: 12 },
          { func: 'handleAPI', file: '/src/api.js', line: 45, col: 23 },
          { func: 'main', file: '/src/index.js', line: 10, col: 5 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'A standard JavaScript error',
    expectedAttributes: {
      'error.type': 'Error',
      'error.message': 'A standard JavaScript error'
    }
  },
  {
    name: 'type_error',
    description: 'TypeError from invalid operation',
    error: (() => {
      const error = new TypeError('Cannot read property \'id\' of undefined');
      error.stack = createStackTrace(
        'TypeError',
        'Cannot read property \'id\' of undefined',
        '/src/user-service.js',
        78,
        23,
        [
          { func: 'getUserById', file: '/src/user-service.js', line: 78, col: 23 },
          { func: 'processUserRequest', file: '/src/handlers.js', line: 42, col: 15 },
          { func: 'handleAPI', file: '/src/api.js', line: 30, col: 18 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Cannot read property \'id\' of undefined',
    expectedAttributes: {
      'error.type': 'TypeError',
      'error.message': 'Cannot read property \'id\' of undefined'
    }
  },
  {
    name: 'reference_error',
    description: 'ReferenceError from undefined variable',
    error: (() => {
      const error = new ReferenceError('undefinedVariable is not defined');
      error.stack = createStackTrace(
        'ReferenceError',
        'undefinedVariable is not defined',
        '/src/calculation-service.js',
        156,
        34,
        [
          { func: 'calculateTotal', file: '/src/calculation-service.js', line: 156, col: 34 },
          { func: 'processOrder', file: '/src/order-service.js', line: 89, col: 12 },
          { func: 'checkout', file: '/src/checkout.js', line: 45, col: 8 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'undefinedVariable is not defined',
    expectedAttributes: {
      'error.type': 'ReferenceError',
      'error.message': 'undefinedVariable is not defined'
    }
  },
  {
    name: 'syntax_error',
    description: 'SyntaxError from invalid code',
    error: (() => {
      const error = new SyntaxError('Unexpected token }');
      error.stack = createStackTrace(
        'SyntaxError',
        'Unexpected token }',
        '/src/config-parser.js',
        42,
        10,
        [
          { func: 'parseConfig', file: '/src/config-parser.js', line: 42, col: 10 },
          { func: 'loadConfiguration', file: '/src/app-config.js', line: 23, col: 15 },
          { func: 'initializeApp', file: '/src/app.js', line: 12, col: 8 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Unexpected token }',
    expectedAttributes: {
      'error.type': 'SyntaxError',
      'error.message': 'Unexpected token }'
    }
  }
];

/**
 * Validation error scenarios for testing input validation error handling
 */
export const validationErrorScenarios: ErrorScenario[] = [
  {
    name: 'missing_required_field',
    description: 'Missing required field in request',
    error: (() => {
      const error = new ValidationError(
        'Missing required field: email',
        'MISSING_REQUIRED_FIELD',
        { field: 'email', location: 'body' }
      );
      error.stack = createStackTrace(
        'ValidationError',
        'Missing required field: email',
        '/src/validators/user-validator.js',
        45,
        12,
        [
          { func: 'validateUserInput', file: '/src/validators/user-validator.js', line: 45, col: 12 },
          { func: 'createUser', file: '/src/services/user-service.js', line: 78, col: 23 },
          { func: 'handleCreateUser', file: '/src/controllers/user-controller.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Missing required field: email',
    expectedAttributes: {
      'error.type': 'validation',
      'error.code': 'MISSING_REQUIRED_FIELD',
      'error.message': 'Missing required field: email',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'invalid_format',
    description: 'Invalid format for input field',
    error: (() => {
      const error = new ValidationError(
        'Invalid email format',
        'INVALID_FORMAT',
        { field: 'email', value: 'not-an-email', expected: 'valid email address' }
      );
      error.stack = createStackTrace(
        'ValidationError',
        'Invalid email format',
        '/src/validators/email-validator.js',
        28,
        15,
        [
          { func: 'validateEmail', file: '/src/validators/email-validator.js', line: 28, col: 15 },
          { func: 'validateUserInput', file: '/src/validators/user-validator.js', line: 52, col: 18 },
          { func: 'createUser', file: '/src/services/user-service.js', line: 78, col: 23 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Invalid email format',
    expectedAttributes: {
      'error.type': 'validation',
      'error.code': 'INVALID_FORMAT',
      'error.message': 'Invalid email format',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'value_out_of_range',
    description: 'Value out of allowed range',
    error: (() => {
      const error = new ValidationError(
        'Value out of allowed range',
        'VALUE_OUT_OF_RANGE',
        { field: 'age', value: 150, min: 0, max: 120 }
      );
      error.stack = createStackTrace(
        'ValidationError',
        'Value out of allowed range',
        '/src/validators/range-validator.js',
        35,
        20,
        [
          { func: 'validateRange', file: '/src/validators/range-validator.js', line: 35, col: 20 },
          { func: 'validateUserInput', file: '/src/validators/user-validator.js', line: 65, col: 22 },
          { func: 'updateUserProfile', file: '/src/services/user-service.js', line: 112, col: 18 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Value out of allowed range',
    expectedAttributes: {
      'error.type': 'validation',
      'error.code': 'VALUE_OUT_OF_RANGE',
      'error.message': 'Value out of allowed range',
      'error.handled': true
    },
    isHandled: true
  }
];

/**
 * Business error scenarios for testing business logic error handling
 */
export const businessErrorScenarios: ErrorScenario[] = [
  {
    name: 'insufficient_funds',
    description: 'Insufficient funds for transaction',
    error: (() => {
      const error = new BusinessError(
        'Insufficient funds for transaction',
        'INSUFFICIENT_FUNDS',
        { accountId: '12345', required: 100.50, available: 75.25 }
      );
      error.stack = createStackTrace(
        'BusinessError',
        'Insufficient funds for transaction',
        '/src/services/payment-service.js',
        87,
        23,
        [
          { func: 'processPayment', file: '/src/services/payment-service.js', line: 87, col: 23 },
          { func: 'checkout', file: '/src/services/order-service.js', line: 142, col: 15 },
          { func: 'completeOrder', file: '/src/controllers/order-controller.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Insufficient funds for transaction',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'INSUFFICIENT_FUNDS',
      'error.message': 'Insufficient funds for transaction',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'resource_already_exists',
    description: 'Resource already exists',
    error: (() => {
      const error = new BusinessError(
        'User with this email already exists',
        'RESOURCE_ALREADY_EXISTS',
        { resourceType: 'user', identifier: 'email', value: 'user@example.com' }
      );
      error.stack = createStackTrace(
        'BusinessError',
        'User with this email already exists',
        '/src/services/user-service.js',
        112,
        18,
        [
          { func: 'createUser', file: '/src/services/user-service.js', line: 112, col: 18 },
          { func: 'registerUser', file: '/src/controllers/auth-controller.js', line: 45, col: 20 },
          { func: 'handleRegistration', file: '/src/routes/auth-routes.js', line: 28, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'User with this email already exists',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'RESOURCE_ALREADY_EXISTS',
      'error.message': 'User with this email already exists',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'business_rule_violation',
    description: 'Business rule violation',
    error: (() => {
      const error = new BusinessError(
        'Cannot cancel order that has been shipped',
        'BUSINESS_RULE_VIOLATION',
        { orderId: '67890', status: 'SHIPPED', allowedStatuses: ['PENDING', 'PROCESSING'] }
      );
      error.stack = createStackTrace(
        'BusinessError',
        'Cannot cancel order that has been shipped',
        '/src/services/order-service.js',
        187,
        25,
        [
          { func: 'cancelOrder', file: '/src/services/order-service.js', line: 187, col: 25 },
          { func: 'processCancellation', file: '/src/controllers/order-controller.js', line: 98, col: 18 },
          { func: 'handleCancelOrder', file: '/src/routes/order-routes.js', line: 45, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Cannot cancel order that has been shipped',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'BUSINESS_RULE_VIOLATION',
      'error.message': 'Cannot cancel order that has been shipped',
      'error.handled': true
    },
    isHandled: true
  }
];

/**
 * Technical error scenarios for testing system error handling
 */
export const technicalErrorScenarios: ErrorScenario[] = [
  {
    name: 'database_connection_error',
    description: 'Database connection error',
    error: (() => {
      const error = DatabaseError.connectionError(
        'Failed to connect to database',
        { host: 'db.example.com', port: 5432, database: 'users' },
        { component: 'database', severity: 'critical', isTransient: true },
        new Error('ECONNREFUSED')
      );
      error.stack = createStackTrace(
        'DatabaseError',
        'Failed to connect to database',
        '/src/database/connection.js',
        45,
        12,
        [
          { func: 'connectToDatabase', file: '/src/database/connection.js', line: 45, col: 12 },
          { func: 'initializeDatabase', file: '/src/services/database-service.js', line: 28, col: 15 },
          { func: 'startServer', file: '/src/server.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to connect to database',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'DATABASE_CONNECTION_ERROR',
      'error.message': 'Failed to connect to database',
      'error.category': 'database_error',
      'error.handled': false
    },
    isHandled: false
  },
  {
    name: 'service_timeout',
    description: 'Service timeout error',
    error: (() => {
      const error = TimeoutError.apiTimeout(
        5000,
        3000,
        '/api/users',
        'API request to /api/users timed out after 5000ms (threshold: 3000ms)',
        { requestId: 'req-123-456-789' },
        { component: 'api-client', severity: 'error', isTransient: true },
        new Error('Request timed out')
      );
      error.stack = createStackTrace(
        'TimeoutError',
        'API request to /api/users timed out after 5000ms (threshold: 3000ms)',
        '/src/clients/api-client.js',
        78,
        23,
        [
          { func: 'fetchUsers', file: '/src/clients/api-client.js', line: 78, col: 23 },
          { func: 'getUserList', file: '/src/services/user-service.js', line: 45, col: 18 },
          { func: 'handleGetUsers', file: '/src/controllers/user-controller.js', line: 28, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'API request to /api/users timed out after 5000ms (threshold: 3000ms)',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'API_TIMEOUT',
      'error.message': 'API request to /api/users timed out after 5000ms (threshold: 3000ms)',
      'error.category': 'timeout_error',
      'error.handled': false
    },
    isHandled: false
  },
  {
    name: 'service_unavailable',
    description: 'Service unavailable error',
    error: (() => {
      const error = ServiceUnavailableError.forService(
        'payment-service',
        'Payment service is currently unavailable',
        { lastAttempt: new Date().toISOString() },
        { component: 'payment-gateway', severity: 'critical', isTransient: true },
        new Error('Service unavailable')
      );
      error.stack = createStackTrace(
        'ServiceUnavailableError',
        'Payment service is currently unavailable',
        '/src/clients/payment-client.js',
        112,
        18,
        [
          { func: 'processPayment', file: '/src/clients/payment-client.js', line: 112, col: 18 },
          { func: 'checkout', file: '/src/services/order-service.js', line: 87, col: 23 },
          { func: 'completeOrder', file: '/src/controllers/order-controller.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Payment service is currently unavailable',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'SERVICE_UNAVAILABLE',
      'error.message': 'Payment service is currently unavailable',
      'error.category': 'external_service_error',
      'error.handled': false
    },
    isHandled: false
  },
  {
    name: 'data_processing_error',
    description: 'Data processing error',
    error: (() => {
      const error = DataProcessingError.parsingError(
        'JSON',
        'Failed to parse JSON data: Unexpected token in JSON at position 42',
        { data: '{"user":"John","age":30,"email":"john@example.com","roles":["admin","user"' },
        { component: 'json-parser', severity: 'error' },
        new SyntaxError('Unexpected token in JSON at position 42')
      );
      error.stack = createStackTrace(
        'DataProcessingError',
        'Failed to parse JSON data: Unexpected token in JSON at position 42',
        '/src/utils/json-parser.js',
        34,
        10,
        [
          { func: 'parseJSON', file: '/src/utils/json-parser.js', line: 34, col: 10 },
          { func: 'processRequest', file: '/src/middleware/body-parser.js', line: 45, col: 18 },
          { func: 'handleRequest', file: '/src/server.js', line: 78, col: 23 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to parse JSON data: Unexpected token in JSON at position 42',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'JSON_PARSING_ERROR',
      'error.message': 'Failed to parse JSON data: Unexpected token in JSON at position 42',
      'error.category': 'data_processing_error',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'configuration_error',
    description: 'Configuration error',
    error: (() => {
      const error = ConfigurationError.missingConfig(
        'DATABASE_URL',
        'Missing required configuration: DATABASE_URL',
        { requiredFor: 'database connection' },
        { component: 'configuration', severity: 'critical' }
      );
      error.stack = createStackTrace(
        'ConfigurationError',
        'Missing required configuration: DATABASE_URL',
        '/src/config/database-config.js',
        28,
        15,
        [
          { func: 'validateDatabaseConfig', file: '/src/config/database-config.js', line: 28, col: 15 },
          { func: 'initializeDatabase', file: '/src/services/database-service.js', line: 34, col: 10 },
          { func: 'startServer', file: '/src/server.js', line: 45, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Missing required configuration: DATABASE_URL',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'MISSING_CONFIGURATION',
      'error.message': 'Missing required configuration: DATABASE_URL',
      'error.category': 'configuration_error',
      'error.handled': false
    },
    isHandled: false
  },
  {
    name: 'initialization_error',
    description: 'Initialization error',
    error: (() => {
      const error = InitializationError.dependencyError(
        'redis-client',
        'Failed to initialize dependency: redis-client',
        { host: 'redis.example.com', port: 6379 },
        { component: 'cache', severity: 'critical' },
        new Error('ECONNREFUSED')
      );
      error.stack = createStackTrace(
        'InitializationError',
        'Failed to initialize dependency: redis-client',
        '/src/cache/redis-client.js',
        45,
        12,
        [
          { func: 'initializeRedisClient', file: '/src/cache/redis-client.js', line: 45, col: 12 },
          { func: 'initializeCache', file: '/src/services/cache-service.js', line: 28, col: 15 },
          { func: 'startServer', file: '/src/server.js', line: 56, col: 18 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to initialize dependency: redis-client',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'DEPENDENCY_INITIALIZATION_ERROR',
      'error.message': 'Failed to initialize dependency: redis-client',
      'error.category': 'initialization_error',
      'error.handled': false
    },
    isHandled: false
  }
];

/**
 * External error scenarios for testing external system error handling
 */
export const externalErrorScenarios: ErrorScenario[] = [
  {
    name: 'external_api_error',
    description: 'External API error',
    error: (() => {
      const error = new ExternalError(
        'External payment API returned an error',
        'EXTERNAL_API_ERROR',
        { statusCode: 500, response: { error: 'Internal Server Error' } },
        { component: 'payment-gateway', service: 'payment-api', severity: 'error' },
        new Error('Request failed with status code 500')
      );
      error.stack = createStackTrace(
        'ExternalError',
        'External payment API returned an error',
        '/src/clients/payment-api-client.js',
        87,
        23,
        [
          { func: 'processPayment', file: '/src/clients/payment-api-client.js', line: 87, col: 23 },
          { func: 'checkout', file: '/src/services/order-service.js', line: 112, col: 18 },
          { func: 'completeOrder', file: '/src/controllers/order-controller.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'External payment API returned an error',
    expectedAttributes: {
      'error.type': 'external',
      'error.code': 'EXTERNAL_API_ERROR',
      'error.message': 'External payment API returned an error',
      'error.category': 'external_service_error',
      'error.handled': true
    },
    isHandled: true
  },
  {
    name: 'external_dependency_unavailable',
    description: 'External dependency unavailable',
    error: (() => {
      const error = new ExternalError(
        'External authentication service is unavailable',
        'EXTERNAL_DEPENDENCY_UNAVAILABLE',
        { service: 'auth-service', lastAttempt: new Date().toISOString() },
        { component: 'auth-client', service: 'auth-service', severity: 'critical', isTransient: true },
        new Error('ECONNREFUSED')
      );
      error.stack = createStackTrace(
        'ExternalError',
        'External authentication service is unavailable',
        '/src/clients/auth-client.js',
        45,
        12,
        [
          { func: 'verifyToken', file: '/src/clients/auth-client.js', line: 45, col: 12 },
          { func: 'authenticate', file: '/src/middleware/auth-middleware.js', line: 28, col: 15 },
          { func: 'handleRequest', file: '/src/server.js', line: 67, col: 20 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'External authentication service is unavailable',
    expectedAttributes: {
      'error.type': 'external',
      'error.code': 'EXTERNAL_DEPENDENCY_UNAVAILABLE',
      'error.message': 'External authentication service is unavailable',
      'error.category': 'external_service_error',
      'error.handled': false
    },
    isHandled: false
  },
  {
    name: 'external_rate_limit_exceeded',
    description: 'External rate limit exceeded',
    error: (() => {
      const error = new ExternalError(
        'Rate limit exceeded for external API',
        'EXTERNAL_RATE_LIMIT_EXCEEDED',
        { service: 'weather-api', limit: 100, period: '1 minute', retryAfter: 30 },
        { component: 'weather-client', service: 'weather-api', severity: 'warning', isTransient: true },
        new Error('Too Many Requests')
      );
      error.stack = createStackTrace(
        'ExternalError',
        'Rate limit exceeded for external API',
        '/src/clients/weather-api-client.js',
        78,
        23,
        [
          { func: 'getWeatherData', file: '/src/clients/weather-api-client.js', line: 78, col: 23 },
          { func: 'fetchWeatherForecast', file: '/src/services/weather-service.js', line: 45, col: 18 },
          { func: 'getWeatherForecast', file: '/src/controllers/weather-controller.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Rate limit exceeded for external API',
    expectedAttributes: {
      'error.type': 'external',
      'error.code': 'EXTERNAL_RATE_LIMIT_EXCEEDED',
      'error.message': 'Rate limit exceeded for external API',
      'error.category': 'external_service_error',
      'error.handled': true
    },
    isHandled: true
  }
];

/**
 * Health journey error scenarios for testing health journey-specific error handling
 */
export const healthJourneyErrorScenarios: JourneyErrorScenario[] = [
  {
    name: 'health_device_connection_error',
    description: 'Health device connection error',
    journeyType: JourneyType.HEALTH,
    journeyContext: {
      userId: 'user-123',
      deviceId: 'device-456',
      deviceType: 'smartwatch',
      operation: 'sync_data'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Failed to connect to health device',
        ErrorType.TECHNICAL,
        'HEALTH_DEVICE_CONNECTION_ERROR',
        JourneyType.HEALTH,
        {
          component: 'device-connector',
          operation: 'connect',
          deviceId: 'device-456',
          deviceType: 'smartwatch',
          isTransient: true
        },
        { lastAttempt: new Date().toISOString(), attemptCount: 3 },
        new Error('Device connection timeout')
      );
      error.stack = createStackTrace(
        'BaseError',
        'Failed to connect to health device',
        '/src/health/device-connector.js',
        87,
        23,
        [
          { func: 'connectToDevice', file: '/src/health/device-connector.js', line: 87, col: 23 },
          { func: 'syncDeviceData', file: '/src/health/device-service.js', line: 45, col: 18 },
          { func: 'handleDeviceSync', file: '/src/health/device-controller.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to connect to health device',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'HEALTH_DEVICE_CONNECTION_ERROR',
      'error.message': 'Failed to connect to health device',
      'error.category': 'external_service_error',
      'error.handled': false,
      'journey.type': 'health'
    },
    isHandled: false
  },
  {
    name: 'health_metric_validation_error',
    description: 'Health metric validation error',
    journeyType: JourneyType.HEALTH,
    journeyContext: {
      userId: 'user-123',
      metricType: 'heart_rate',
      metricValue: 250,
      operation: 'record_metric'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Heart rate value is outside of valid range',
        ErrorType.VALIDATION,
        'HEALTH_METRIC_VALIDATION_ERROR',
        JourneyType.HEALTH,
        {
          component: 'metric-validator',
          operation: 'validate',
          metricType: 'heart_rate',
          metricValue: 250
        },
        { validRange: { min: 30, max: 220 } }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Heart rate value is outside of valid range',
        '/src/health/metric-validator.js',
        45,
        12,
        [
          { func: 'validateMetric', file: '/src/health/metric-validator.js', line: 45, col: 12 },
          { func: 'recordMetric', file: '/src/health/metric-service.js', line: 78, col: 23 },
          { func: 'handleRecordMetric', file: '/src/health/metric-controller.js', line: 56, col: 18 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Heart rate value is outside of valid range',
    expectedAttributes: {
      'error.type': 'validation',
      'error.code': 'HEALTH_METRIC_VALIDATION_ERROR',
      'error.message': 'Heart rate value is outside of valid range',
      'error.category': 'validation_error',
      'error.handled': true,
      'journey.type': 'health',
      'health.metric.type': 'heart_rate',
      'health.metric.value': 250
    },
    isHandled: true
  },
  {
    name: 'health_goal_not_found',
    description: 'Health goal not found',
    journeyType: JourneyType.HEALTH,
    journeyContext: {
      userId: 'user-123',
      goalId: 'goal-789',
      operation: 'update_goal'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Health goal not found',
        ErrorType.NOT_FOUND,
        'HEALTH_GOAL_NOT_FOUND',
        JourneyType.HEALTH,
        {
          component: 'goal-service',
          operation: 'find',
          goalId: 'goal-789',
          userId: 'user-123'
        },
        { searchCriteria: { id: 'goal-789', userId: 'user-123' } }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Health goal not found',
        '/src/health/goal-service.js',
        112,
        18,
        [
          { func: 'findGoalById', file: '/src/health/goal-service.js', line: 112, col: 18 },
          { func: 'updateGoal', file: '/src/health/goal-service.js', line: 156, col: 23 },
          { func: 'handleUpdateGoal', file: '/src/health/goal-controller.js', line: 78, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Health goal not found',
    expectedAttributes: {
      'error.type': 'not_found',
      'error.code': 'HEALTH_GOAL_NOT_FOUND',
      'error.message': 'Health goal not found',
      'error.category': 'not_found',
      'error.handled': true,
      'journey.type': 'health',
      'health.goal.id': 'goal-789'
    },
    isHandled: true
  }
];

/**
 * Care journey error scenarios for testing care journey-specific error handling
 */
export const careJourneyErrorScenarios: JourneyErrorScenario[] = [
  {
    name: 'care_appointment_scheduling_conflict',
    description: 'Care appointment scheduling conflict',
    journeyType: JourneyType.CARE,
    journeyContext: {
      userId: 'user-123',
      providerId: 'provider-456',
      appointmentTime: '2023-05-15T10:00:00Z',
      operation: 'schedule_appointment'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Appointment time slot is already booked',
        ErrorType.CONFLICT,
        'CARE_APPOINTMENT_SCHEDULING_CONFLICT',
        JourneyType.CARE,
        {
          component: 'appointment-service',
          operation: 'schedule',
          providerId: 'provider-456',
          appointmentTime: '2023-05-15T10:00:00Z'
        },
        { conflictingAppointmentId: 'appointment-789' }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Appointment time slot is already booked',
        '/src/care/appointment-service.js',
        87,
        23,
        [
          { func: 'scheduleAppointment', file: '/src/care/appointment-service.js', line: 87, col: 23 },
          { func: 'createAppointment', file: '/src/care/appointment-service.js', line: 112, col: 18 },
          { func: 'handleCreateAppointment', file: '/src/care/appointment-controller.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Appointment time slot is already booked',
    expectedAttributes: {
      'error.type': 'conflict',
      'error.code': 'CARE_APPOINTMENT_SCHEDULING_CONFLICT',
      'error.message': 'Appointment time slot is already booked',
      'error.category': 'conflict',
      'error.handled': true,
      'journey.type': 'care',
      'care.provider.id': 'provider-456'
    },
    isHandled: true
  },
  {
    name: 'care_provider_not_available',
    description: 'Care provider not available',
    journeyType: JourneyType.CARE,
    journeyContext: {
      userId: 'user-123',
      providerId: 'provider-456',
      specialtyId: 'specialty-789',
      operation: 'find_provider'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'No providers available for the requested specialty',
        ErrorType.BUSINESS,
        'CARE_PROVIDER_NOT_AVAILABLE',
        JourneyType.CARE,
        {
          component: 'provider-service',
          operation: 'find',
          specialtyId: 'specialty-789',
          locationId: 'location-123'
        },
        { searchCriteria: { specialtyId: 'specialty-789', locationId: 'location-123' } }
      );
      error.stack = createStackTrace(
        'BaseError',
        'No providers available for the requested specialty',
        '/src/care/provider-service.js',
        45,
        12,
        [
          { func: 'findProvidersBySpecialty', file: '/src/care/provider-service.js', line: 45, col: 12 },
          { func: 'searchProviders', file: '/src/care/provider-service.js', line: 78, col: 23 },
          { func: 'handleSearchProviders', file: '/src/care/provider-controller.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'No providers available for the requested specialty',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'CARE_PROVIDER_NOT_AVAILABLE',
      'error.message': 'No providers available for the requested specialty',
      'error.category': 'business_error',
      'error.handled': true,
      'journey.type': 'care',
      'care.provider.specialty': 'specialty-789'
    },
    isHandled: true
  },
  {
    name: 'care_telemedicine_connection_error',
    description: 'Care telemedicine connection error',
    journeyType: JourneyType.CARE,
    journeyContext: {
      userId: 'user-123',
      appointmentId: 'appointment-456',
      sessionId: 'session-789',
      operation: 'join_telemedicine_session'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Failed to establish telemedicine connection',
        ErrorType.TECHNICAL,
        'CARE_TELEMEDICINE_CONNECTION_ERROR',
        JourneyType.CARE,
        {
          component: 'telemedicine-service',
          operation: 'connect',
          sessionId: 'session-789',
          isTransient: true
        },
        { lastAttempt: new Date().toISOString(), attemptCount: 2 },
        new Error('WebRTC connection failed')
      );
      error.stack = createStackTrace(
        'BaseError',
        'Failed to establish telemedicine connection',
        '/src/care/telemedicine-service.js',
        112,
        18,
        [
          { func: 'establishConnection', file: '/src/care/telemedicine-service.js', line: 112, col: 18 },
          { func: 'joinSession', file: '/src/care/telemedicine-service.js', line: 156, col: 23 },
          { func: 'handleJoinSession', file: '/src/care/telemedicine-controller.js', line: 78, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to establish telemedicine connection',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'CARE_TELEMEDICINE_CONNECTION_ERROR',
      'error.message': 'Failed to establish telemedicine connection',
      'error.category': 'network_error',
      'error.handled': false,
      'journey.type': 'care',
      'care.telemedicine.session.id': 'session-789'
    },
    isHandled: false
  }
];

/**
 * Plan journey error scenarios for testing plan journey-specific error handling
 */
export const planJourneyErrorScenarios: JourneyErrorScenario[] = [
  {
    name: 'plan_claim_validation_error',
    description: 'Plan claim validation error',
    journeyType: JourneyType.PLAN,
    journeyContext: {
      userId: 'user-123',
      planId: 'plan-456',
      claimId: 'claim-789',
      operation: 'submit_claim'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Missing required documentation for claim',
        ErrorType.VALIDATION,
        'PLAN_CLAIM_VALIDATION_ERROR',
        JourneyType.PLAN,
        {
          component: 'claim-validator',
          operation: 'validate',
          claimId: 'claim-789',
          planId: 'plan-456'
        },
        { missingDocuments: ['receipt', 'medical_report'] }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Missing required documentation for claim',
        '/src/plan/claim-validator.js',
        87,
        23,
        [
          { func: 'validateClaimDocuments', file: '/src/plan/claim-validator.js', line: 87, col: 23 },
          { func: 'submitClaim', file: '/src/plan/claim-service.js', line: 112, col: 18 },
          { func: 'handleSubmitClaim', file: '/src/plan/claim-controller.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Missing required documentation for claim',
    expectedAttributes: {
      'error.type': 'validation',
      'error.code': 'PLAN_CLAIM_VALIDATION_ERROR',
      'error.message': 'Missing required documentation for claim',
      'error.category': 'validation_error',
      'error.handled': true,
      'journey.type': 'plan',
      'plan.claim.id': 'claim-789'
    },
    isHandled: true
  },
  {
    name: 'plan_benefit_not_covered',
    description: 'Plan benefit not covered',
    journeyType: JourneyType.PLAN,
    journeyContext: {
      userId: 'user-123',
      planId: 'plan-456',
      benefitId: 'benefit-789',
      operation: 'check_coverage'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Requested benefit is not covered by the plan',
        ErrorType.BUSINESS,
        'PLAN_BENEFIT_NOT_COVERED',
        JourneyType.PLAN,
        {
          component: 'coverage-service',
          operation: 'check',
          benefitId: 'benefit-789',
          planId: 'plan-456'
        },
        { benefitType: 'dental_orthodontics', planType: 'basic_health' }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Requested benefit is not covered by the plan',
        '/src/plan/coverage-service.js',
        45,
        12,
        [
          { func: 'checkBenefitCoverage', file: '/src/plan/coverage-service.js', line: 45, col: 12 },
          { func: 'verifyBenefit', file: '/src/plan/benefit-service.js', line: 78, col: 23 },
          { func: 'handleCheckCoverage', file: '/src/plan/benefit-controller.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Requested benefit is not covered by the plan',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'PLAN_BENEFIT_NOT_COVERED',
      'error.message': 'Requested benefit is not covered by the plan',
      'error.category': 'business_error',
      'error.handled': true,
      'journey.type': 'plan',
      'plan.benefit.id': 'benefit-789',
      'plan.id': 'plan-456'
    },
    isHandled: true
  },
  {
    name: 'plan_external_provider_error',
    description: 'Plan external provider error',
    journeyType: JourneyType.PLAN,
    journeyContext: {
      userId: 'user-123',
      planId: 'plan-456',
      providerId: 'provider-789',
      operation: 'verify_provider'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Failed to verify provider with external system',
        ErrorType.EXTERNAL,
        'PLAN_EXTERNAL_PROVIDER_ERROR',
        JourneyType.PLAN,
        {
          component: 'provider-verification-service',
          operation: 'verify',
          providerId: 'provider-789',
          externalSystem: 'provider-directory-api',
          isTransient: true
        },
        { lastAttempt: new Date().toISOString(), attemptCount: 3 },
        new Error('External API returned status 503')
      );
      error.stack = createStackTrace(
        'BaseError',
        'Failed to verify provider with external system',
        '/src/plan/provider-verification-service.js',
        112,
        18,
        [
          { func: 'verifyProvider', file: '/src/plan/provider-verification-service.js', line: 112, col: 18 },
          { func: 'checkProviderNetwork', file: '/src/plan/network-service.js', line: 156, col: 23 },
          { func: 'handleVerifyProvider', file: '/src/plan/provider-controller.js', line: 78, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to verify provider with external system',
    expectedAttributes: {
      'error.type': 'external',
      'error.code': 'PLAN_EXTERNAL_PROVIDER_ERROR',
      'error.message': 'Failed to verify provider with external system',
      'error.category': 'external_service_error',
      'error.handled': false,
      'journey.type': 'plan',
      'plan.id': 'plan-456'
    },
    isHandled: false
  }
];

/**
 * Gamification error scenarios for testing gamification-specific error handling
 */
export const gamificationErrorScenarios: JourneyErrorScenario[] = [
  {
    name: 'gamification_event_processing_error',
    description: 'Gamification event processing error',
    journeyType: JourneyType.GAMIFICATION,
    journeyContext: {
      userId: 'user-123',
      eventId: 'event-456',
      eventType: 'achievement_progress',
      operation: 'process_event'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Failed to process gamification event',
        ErrorType.TECHNICAL,
        'GAMIFICATION_EVENT_PROCESSING_ERROR',
        JourneyType.GAMIFICATION,
        {
          component: 'event-processor',
          operation: 'process',
          eventId: 'event-456',
          eventType: 'achievement_progress'
        },
        { processingStage: 'rule_evaluation', ruleId: 'rule-789' },
        new Error('Invalid rule configuration')
      );
      error.stack = createStackTrace(
        'BaseError',
        'Failed to process gamification event',
        '/src/gamification/event-processor.js',
        87,
        23,
        [
          { func: 'processEvent', file: '/src/gamification/event-processor.js', line: 87, col: 23 },
          { func: 'handleEvent', file: '/src/gamification/event-service.js', line: 112, col: 18 },
          { func: 'consumeEvent', file: '/src/gamification/event-consumer.js', line: 56, col: 12 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Failed to process gamification event',
    expectedAttributes: {
      'error.type': 'technical',
      'error.code': 'GAMIFICATION_EVENT_PROCESSING_ERROR',
      'error.message': 'Failed to process gamification event',
      'error.category': 'data_processing_error',
      'error.handled': false,
      'journey.type': 'gamification',
      'gamification.event.id': 'event-456',
      'gamification.event.type': 'achievement_progress'
    },
    isHandled: false
  },
  {
    name: 'gamification_achievement_already_unlocked',
    description: 'Gamification achievement already unlocked',
    journeyType: JourneyType.GAMIFICATION,
    journeyContext: {
      userId: 'user-123',
      achievementId: 'achievement-456',
      operation: 'unlock_achievement'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Achievement already unlocked for user',
        ErrorType.CONFLICT,
        'GAMIFICATION_ACHIEVEMENT_ALREADY_UNLOCKED',
        JourneyType.GAMIFICATION,
        {
          component: 'achievement-service',
          operation: 'unlock',
          achievementId: 'achievement-456',
          userId: 'user-123'
        },
        { unlockedAt: '2023-04-15T10:30:00Z' }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Achievement already unlocked for user',
        '/src/gamification/achievement-service.js',
        45,
        12,
        [
          { func: 'unlockAchievement', file: '/src/gamification/achievement-service.js', line: 45, col: 12 },
          { func: 'processAchievement', file: '/src/gamification/achievement-processor.js', line: 78, col: 23 },
          { func: 'handleAchievementEvent', file: '/src/gamification/achievement-consumer.js', line: 34, col: 10 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Achievement already unlocked for user',
    expectedAttributes: {
      'error.type': 'conflict',
      'error.code': 'GAMIFICATION_ACHIEVEMENT_ALREADY_UNLOCKED',
      'error.message': 'Achievement already unlocked for user',
      'error.category': 'conflict',
      'error.handled': true,
      'journey.type': 'gamification',
      'gamification.achievement.id': 'achievement-456'
    },
    isHandled: true
  },
  {
    name: 'gamification_reward_insufficient_points',
    description: 'Gamification reward insufficient points',
    journeyType: JourneyType.GAMIFICATION,
    journeyContext: {
      userId: 'user-123',
      rewardId: 'reward-456',
      operation: 'claim_reward'
    },
    error: (() => {
      const error = BaseError.journeyError(
        'Insufficient points to claim reward',
        ErrorType.BUSINESS,
        'GAMIFICATION_REWARD_INSUFFICIENT_POINTS',
        JourneyType.GAMIFICATION,
        {
          component: 'reward-service',
          operation: 'claim',
          rewardId: 'reward-456',
          userId: 'user-123'
        },
        { requiredPoints: 500, userPoints: 350 }
      );
      error.stack = createStackTrace(
        'BaseError',
        'Insufficient points to claim reward',
        '/src/gamification/reward-service.js',
        112,
        18,
        [
          { func: 'claimReward', file: '/src/gamification/reward-service.js', line: 112, col: 18 },
          { func: 'processRewardClaim', file: '/src/gamification/reward-processor.js', line: 156, col: 23 },
          { func: 'handleClaimReward', file: '/src/gamification/reward-controller.js', line: 78, col: 15 }
        ]
      );
      return error;
    })(),
    expectedSpanStatus: SpanStatusCode.ERROR,
    expectedStatusMessage: 'Insufficient points to claim reward',
    expectedAttributes: {
      'error.type': 'business',
      'error.code': 'GAMIFICATION_REWARD_INSUFFICIENT_POINTS',
      'error.message': 'Insufficient points to claim reward',
      'error.category': 'business_error',
      'error.handled': true,
      'journey.type': 'gamification',
      'gamification.reward.id': 'reward-456',
      'gamification.points.earned': 350
    },
    isHandled: true
  }
];

/**
 * All error scenarios combined for easy access
 */
export const allErrorScenarios: ErrorScenario[] = [
  ...basicErrorScenarios,
  ...validationErrorScenarios,
  ...businessErrorScenarios,
  ...technicalErrorScenarios,
  ...externalErrorScenarios,
  ...healthJourneyErrorScenarios,
  ...careJourneyErrorScenarios,
  ...planJourneyErrorScenarios,
  ...gamificationErrorScenarios
];

/**
 * Get an error scenario by name
 * @param name The name of the error scenario to retrieve
 * @returns The error scenario or undefined if not found
 */
export function getErrorScenarioByName(name: string): ErrorScenario | undefined {
  return allErrorScenarios.find(scenario => scenario.name === name);
}

/**
 * Get error scenarios by type
 * @param type The error type to filter by
 * @returns Array of error scenarios matching the type
 */
export function getErrorScenariosByType(type: ErrorType): ErrorScenario[] {
  return allErrorScenarios.filter(scenario => {
    if (scenario.error instanceof BaseError) {
      return scenario.error.type === type;
    }
    return false;
  });
}

/**
 * Get error scenarios by journey type
 * @param journeyType The journey type to filter by
 * @returns Array of journey error scenarios matching the journey type
 */
export function getErrorScenariosByJourney(journeyType: JourneyType): JourneyErrorScenario[] {
  return allErrorScenarios.filter(scenario => {
    if ('journeyType' in scenario) {
      return (scenario as JourneyErrorScenario).journeyType === journeyType;
    }
    return false;
  }) as JourneyErrorScenario[];
}

/**
 * Get error scenarios by handling status
 * @param isHandled Whether to get handled or unhandled errors
 * @returns Array of error scenarios matching the handling status
 */
export function getErrorScenariosByHandlingStatus(isHandled: boolean): ErrorScenario[] {
  return allErrorScenarios.filter(scenario => scenario.isHandled === isHandled);
}