/**
 * Test fixtures for environment variable error handling scenarios.
 * 
 * This file contains test cases for various error conditions that can occur
 * when working with environment variables, including missing required variables,
 * malformed values, type conversion errors, validation failures, and access errors.
 * 
 * These fixtures are used to test the error handling capabilities of the environment
 * variable utilities and ensure that errors are properly captured, categorized, and reported.
 */

import { 
  EnvironmentVariableError,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentVariableTypeError,
  EnvironmentVariableValidationError,
  EnvironmentVariableBatchError
} from '../../../src/env/error';

/**
 * Test cases for missing required environment variables.
 */
export const missingVariableTestCases = [
  {
    name: 'DATABASE_URL',
    description: 'Missing database connection string',
    expectedError: MissingEnvironmentVariableError,
    expectedMessage: 'Missing required environment variable: DATABASE_URL'
  },
  {
    name: 'API_KEY',
    description: 'Missing API key for external service',
    expectedError: MissingEnvironmentVariableError,
    expectedMessage: 'Missing required environment variable: API_KEY'
  },
  {
    name: 'PORT',
    description: 'Missing server port configuration',
    expectedError: MissingEnvironmentVariableError,
    expectedMessage: 'Missing required environment variable: PORT'
  },
  {
    name: 'HEALTH_FHIR_API_URL',
    description: 'Missing journey-specific required variable',
    journey: 'health',
    expectedError: MissingEnvironmentVariableError,
    expectedMessage: 'Missing required environment variable for health journey: FHIR_API_URL'
  },
  {
    name: 'CARE_PROVIDER_API_KEY',
    description: 'Missing journey-specific required variable',
    journey: 'care',
    expectedError: MissingEnvironmentVariableError,
    expectedMessage: 'Missing required environment variable for care journey: PROVIDER_API_KEY'
  }
];

/**
 * Test cases for malformed environment variable values.
 */
export const malformedValueTestCases = [
  {
    name: 'DATABASE_URL',
    value: 'invalid-url',
    description: 'Malformed database URL',
    expectedError: InvalidEnvironmentVariableError,
    expectedMessage: 'Invalid value for environment variable DATABASE_URL: "invalid-url". Expected: valid URL format (postgresql://user:password@host:port/database)'
  },
  {
    name: 'PORT',
    value: 'not-a-number',
    description: 'Non-numeric port value',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid type for environment variable PORT: "not-a-number". Expected type: number'
  },
  {
    name: 'DEBUG_MODE',
    value: 'maybe',
    description: 'Invalid boolean value',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid boolean value for environment variable DEBUG_MODE: "maybe". Expected \'true\', \'false\', \'1\', or \'0\'.'
  },
  {
    name: 'ALLOWED_ORIGINS',
    value: '[broken-json',
    description: 'Malformed JSON array',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid JSON value for environment variable ALLOWED_ORIGINS. Expected valid JSON.'
  },
  {
    name: 'REDIS_CONFIG',
    value: '{host:"localhost"}',
    description: 'Malformed JSON object (missing quotes)',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid JSON value for environment variable REDIS_CONFIG. Expected valid JSON.'
  }
];

/**
 * Test cases for type conversion errors.
 */
export const typeConversionTestCases = [
  {
    name: 'PORT',
    value: '65536',
    description: 'Port number out of valid range',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable PORT with value "65536" is out of range. Expected value between 1 and 65535.'
  },
  {
    name: 'TIMEOUT_MS',
    value: '-100',
    description: 'Negative timeout value',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable TIMEOUT_MS with value "-100" is out of range. Expected value between 0 and 3600000.'
  },
  {
    name: 'CACHE_TTL',
    value: '1.5',
    description: 'Floating point value for integer setting',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid type for environment variable CACHE_TTL: "1.5". Expected type: integer'
  },
  {
    name: 'LOG_LEVEL',
    value: 'EXTREME',
    description: 'Invalid enum value',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable LOG_LEVEL with value "EXTREME" is not one of the allowed values: debug, info, warn, error.'
  },
  {
    name: 'METRICS_AGGREGATION_INTERVALS',
    value: 'minute;hour;day',
    description: 'Wrong delimiter in array',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid array value for environment variable METRICS_AGGREGATION_INTERVALS: "minute;hour;day". Expected items separated by \',\'.'
  }
];

/**
 * Test cases for validation failures.
 */
export const validationFailureTestCases = [
  {
    name: 'API_URL',
    value: 'http://localhost:3000',
    description: 'URL with wrong protocol (requires HTTPS)',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable API_URL with value "http://localhost:3000" failed validation: url. Expected: HTTPS URL'
  },
  {
    name: 'PASSWORD_MIN_LENGTH',
    value: '5',
    description: 'Value below minimum threshold',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable PASSWORD_MIN_LENGTH with value "5" is out of range. Expected value between 8 and 128.'
  },
  {
    name: 'EMAIL_REGEX',
    value: '[a-z]+@',
    description: 'Invalid regex pattern',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable EMAIL_REGEX with value "[a-z]+@" does not match required pattern.'
  },
  {
    name: 'DATABASE_POOL_SIZE',
    value: '1000',
    description: 'Value above maximum threshold',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable DATABASE_POOL_SIZE with value "1000" is out of range. Expected value between 1 and 100.'
  },
  {
    name: 'STORAGE_PROVIDER',
    value: 'local',
    description: 'Value not in allowed set for production',
    expectedError: EnvironmentVariableValidationError,
    expectedMessage: 'Environment variable STORAGE_PROVIDER with value "local" is not one of the allowed values: s3, azure, gcs.'
  }
];

/**
 * Test cases for access errors (permission issues, etc.).
 */
export const accessErrorTestCases = [
  {
    name: 'JWT_SECRET',
    description: 'Secure variable not accessible in current environment',
    expectedError: EnvironmentVariableError,
    expectedMessage: 'Error accessing environment variable JWT_SECRET: Permission denied'
  },
  {
    name: 'DATABASE_PASSWORD',
    description: 'Secure variable not accessible in current environment',
    expectedError: EnvironmentVariableError,
    expectedMessage: 'Error accessing environment variable DATABASE_PASSWORD: Permission denied'
  },
  {
    name: 'HEALTH_API_KEY',
    description: 'Journey-specific secure variable not accessible',
    journey: 'health',
    expectedError: EnvironmentVariableError,
    expectedMessage: 'Error accessing environment variable for health journey: API_KEY: Permission denied'
  }
];

/**
 * Test cases for batch validation errors.
 */
export const batchValidationTestCases = [
  {
    description: 'Multiple missing variables',
    variables: ['DATABASE_URL', 'API_KEY', 'PORT'],
    expectedError: EnvironmentVariableBatchError,
    expectedErrorCount: 3
  },
  {
    description: 'Mixed error types',
    variables: [
      { name: 'PORT', value: 'not-a-number' },
      { name: 'API_URL', value: 'not-a-url' },
      { name: 'DEBUG_MODE', value: 'maybe' }
    ],
    expectedError: EnvironmentVariableBatchError,
    expectedErrorCount: 3
  },
  {
    description: 'Journey-specific batch errors',
    journey: 'health',
    variables: ['FHIR_API_URL', 'METRICS_RETENTION_DAYS', 'WEARABLES_SYNC_ENABLED'],
    expectedError: EnvironmentVariableBatchError,
    expectedErrorCount: 3
  }
];

/**
 * Test cases for environment variable transformation errors.
 */
export const transformationErrorTestCases = [
  {
    name: 'CONFIG_JSON',
    value: '{"key": "value", malformed}',
    description: 'Malformed JSON object',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid JSON value for environment variable CONFIG_JSON. Expected valid JSON.'
  },
  {
    name: 'NUMERIC_RANGE',
    value: '10-abc',
    description: 'Invalid numeric range format',
    expectedError: EnvironmentVariableTypeError,
    expectedMessage: 'Invalid type for environment variable NUMERIC_RANGE: "10-abc". Expected type: range'
  },
  {
    name: 'CRON_SCHEDULE',
    value: '* * * *',
    description: 'Invalid cron format (missing field)',
    expectedError: InvalidEnvironmentVariableError,
    expectedMessage: 'Invalid value for environment variable CRON_SCHEDULE: "* * * *". Expected: valid cron expression with 5 or 6 fields'
  },
  {
    name: 'IP_WHITELIST',
    value: '192.168.1.256, 10.0.0.1',
    description: 'Invalid IP address in list',
    expectedError: InvalidEnvironmentVariableError,
    expectedMessage: 'Invalid value for environment variable IP_WHITELIST: "192.168.1.256, 10.0.0.1". Expected: comma-separated list of valid IP addresses'
  },
  {
    name: 'DATE_FORMAT',
    value: 'YYYY-MM-DD HH:mm:ss',
    description: 'Unsupported date format',
    expectedError: InvalidEnvironmentVariableError,
    expectedMessage: 'Invalid value for environment variable DATE_FORMAT: "YYYY-MM-DD HH:mm:ss". Expected: one of [ISO, RFC3339, UNIX]'
  }
];

/**
 * All test cases combined for convenience.
 */
export const allErrorTestCases = [
  ...missingVariableTestCases,
  ...malformedValueTestCases,
  ...typeConversionTestCases,
  ...validationFailureTestCases,
  ...accessErrorTestCases,
  ...transformationErrorTestCases
];

/**
 * Helper function to create a MissingEnvironmentVariableError for testing.
 */
export function createMissingVariableError(variableName: string, journey?: string): MissingEnvironmentVariableError {
  if (journey) {
    return MissingEnvironmentVariableError.forJourney(variableName, journey);
  }
  return new MissingEnvironmentVariableError(variableName);
}

/**
 * Helper function to create an InvalidEnvironmentVariableError for testing.
 */
export function createInvalidVariableError(
  variableName: string,
  actualValue: string,
  expectedFormat: string
): InvalidEnvironmentVariableError {
  return new InvalidEnvironmentVariableError(variableName, actualValue, expectedFormat);
}

/**
 * Helper function to create an EnvironmentVariableTypeError for testing.
 */
export function createTypeError(
  variableName: string,
  actualValue: string,
  expectedType: string
): EnvironmentVariableTypeError {
  return new EnvironmentVariableTypeError(variableName, actualValue, expectedType);
}

/**
 * Helper function to create an EnvironmentVariableValidationError for testing.
 */
export function createValidationError(
  variableName: string,
  actualValue: string,
  validationRule: string,
  expectedConstraint: string
): EnvironmentVariableValidationError {
  return new EnvironmentVariableValidationError(
    variableName,
    actualValue,
    validationRule,
    expectedConstraint
  );
}

/**
 * Helper function to create an EnvironmentVariableBatchError for testing.
 */
export function createBatchError(errors: EnvironmentVariableError[]): EnvironmentVariableBatchError {
  return new EnvironmentVariableBatchError(errors);
}