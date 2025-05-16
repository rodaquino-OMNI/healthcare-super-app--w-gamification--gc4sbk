/**
 * Test fixtures for environment variable error handling scenarios.
 * 
 * This module provides test cases for various error conditions that can occur
 * when working with environment variables, including missing variables,
 * malformed values, type conversion errors, validation failures, and access errors.
 * 
 * These fixtures are essential for testing the error handling capabilities of the
 * environment utilities and ensuring that errors are properly captured, categorized,
 * and reported.
 */

import { EnvironmentErrorCategory } from '../../../src/env/error';

/**
 * Test cases for missing required environment variables.
 */
export const missingRequiredVariables = {
  /**
   * Simple case of a completely missing variable
   */
  completelyMissing: {
    variableName: 'REQUIRED_VAR',
    expectedErrorType: 'MissingEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.MISSING,
    expectedMessageIncludes: 'Required environment variable is missing',
  },

  /**
   * Case where the variable exists but is an empty string
   */
  emptyString: {
    variableName: 'EMPTY_VAR',
    value: '',
    expectedErrorType: 'MissingEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.MISSING,
    expectedMessageIncludes: 'Required environment variable is missing',
  },

  /**
   * Case where a variable is required only when another feature is enabled
   */
  conditionallyRequired: {
    variableName: 'API_KEY',
    contextVariables: { 'FEATURE_ENABLED': 'true' },
    expectedErrorType: 'MissingEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.MISSING,
    expectedMessageIncludes: 'Required environment variable is missing',
    additionalContext: 'Required when FEATURE_ENABLED is true',
  },

  /**
   * Case where a variable is required for a specific journey
   */
  journeySpecificRequired: {
    variableName: 'HEALTH_API_URL',
    journeyContext: 'health',
    expectedErrorType: 'MissingEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.MISSING,
    expectedMessageIncludes: 'Required environment variable is missing',
    additionalContext: 'Required for health journey',
  },

  /**
   * Case where multiple related variables are all missing
   */
  multipleRelatedMissing: {
    variableNames: ['DB_HOST', 'DB_PORT', 'DB_NAME'],
    expectedErrorType: 'BatchEnvironmentValidationError',
    expectedCategory: EnvironmentErrorCategory.BATCH,
    expectedErrorCount: 3,
    contextMessage: 'Database configuration validation failed',
  },
};

/**
 * Test cases for malformed environment variable values.
 */
export const malformedValues = {
  /**
   * Malformed numeric value
   */
  invalidNumber: {
    variableName: 'PORT',
    value: 'not-a-number',
    expectedType: 'number',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform "not-a-number" to number',
  },

  /**
   * Malformed boolean value (not a recognized boolean string)
   */
  invalidBoolean: {
    variableName: 'FEATURE_FLAG',
    value: 'not-a-boolean',
    expectedType: 'boolean',
    expectedErrorType: 'InvalidEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.INVALID,
    expectedMessageIncludes: 'Invalid value "not-a-boolean". Expected true/false, yes/no, 1/0',
  },

  /**
   * Malformed JSON value
   */
  invalidJson: {
    variableName: 'CONFIG_JSON',
    value: '{"name":"test", missing-quotes: true}',
    expectedType: 'object',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform',
  },

  /**
   * Malformed URL value
   */
  invalidUrl: {
    variableName: 'API_URL',
    value: 'not-a-url',
    expectedType: 'URL',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform "not-a-url" to URL',
  },

  /**
   * Malformed array value (invalid JSON array)
   */
  invalidArray: {
    variableName: 'ALLOWED_ORIGINS',
    value: '["https://example.com", missing-quotes]',
    expectedType: 'array',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform',
  },

  /**
   * Malformed enum value (not a valid enum option)
   */
  invalidEnum: {
    variableName: 'LOG_LEVEL',
    value: 'EXTREME',
    expectedType: 'enum',
    enumValues: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
    expectedErrorType: 'InvalidEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.INVALID,
    expectedMessageIncludes: 'Invalid value "EXTREME". Expected one of: DEBUG, INFO, WARN, ERROR',
  },

  /**
   * Malformed duration value
   */
  invalidDuration: {
    variableName: 'TIMEOUT',
    value: '10x',
    expectedType: 'duration',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Invalid duration format',
  },

  /**
   * Malformed memory size value
   */
  invalidMemorySize: {
    variableName: 'MAX_MEMORY',
    value: '10ZB',
    expectedType: 'memorySize',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Unknown memory size unit',
  },
};

/**
 * Test cases for type conversion errors.
 */
export const typeConversionErrors = {
  /**
   * Number conversion with invalid format
   */
  numberConversion: {
    variableName: 'MAX_CONNECTIONS',
    value: '42.5.5',
    targetType: 'number',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform "42.5.5" to number',
  },

  /**
   * Integer conversion with decimal value
   */
  integerConversion: {
    variableName: 'PORT',
    value: '3000.5',
    targetType: 'integer',
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: Expected an integer value',
  },

  /**
   * Array of numbers conversion with non-numeric element
   */
  numberArrayConversion: {
    variableName: 'ALLOWED_PORTS',
    value: '3000,3001,not-a-number,3003',
    targetType: 'number[]',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Cannot parse array item at index 2',
  },

  /**
   * JSON conversion with syntax error
   */
  jsonConversion: {
    variableName: 'API_CONFIG',
    value: '{"name": "test", "enabled": true,}', // trailing comma is invalid JSON
    targetType: 'object',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Could not transform',
  },

  /**
   * URL conversion with invalid protocol
   */
  urlConversion: {
    variableName: 'API_URL',
    value: 'ftp://example.com',
    targetType: 'URL',
    options: { protocols: ['http', 'https'] },
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Invalid URL protocol: ftp. Expected one of: http, https',
  },

  /**
   * Range conversion with invalid format
   */
  rangeConversion: {
    variableName: 'RETRY_RANGE',
    value: '10-5', // min > max
    targetType: 'range',
    expectedErrorType: 'TransformEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.TRANSFORM,
    expectedMessageIncludes: 'Invalid range: min (10) cannot be greater than max (5)',
  },

  /**
   * CSV conversion with mismatched columns
   */
  csvConversion: {
    variableName: 'USER_DATA',
    value: 'name,age,city\nJohn,30\nJane,25,New York', // missing city for John, extra for Jane
    targetType: 'csv',
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'CSV data has inconsistent number of columns',
  },
};

/**
 * Test cases for validation failures.
 */
export const validationFailures = {
  /**
   * Value below minimum
   */
  belowMinimum: {
    variableName: 'PORT',
    value: '0',
    validationRule: 'minimum',
    constraint: 1,
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: Value must be at least 1',
  },

  /**
   * Value above maximum
   */
  aboveMaximum: {
    variableName: 'MAX_CONNECTIONS',
    value: '1001',
    validationRule: 'maximum',
    constraint: 1000,
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: Value must not exceed 1000',
  },

  /**
   * String length too short
   */
  tooShort: {
    variableName: 'API_KEY',
    value: 'abc',
    validationRule: 'minLength',
    constraint: 10,
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: String must be at least 10 characters long',
  },

  /**
   * String length too long
   */
  tooLong: {
    variableName: 'USERNAME',
    value: 'thisusernameiswaytoolongforoursystem',
    validationRule: 'maxLength',
    constraint: 20,
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: String must not exceed 20 characters',
  },

  /**
   * Value not matching pattern
   */
  patternMismatch: {
    variableName: 'EMAIL',
    value: 'not-an-email',
    validationRule: 'pattern',
    constraint: /^[\w.-]+@[\w.-]+\.[\w]{2,}$/,
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: Value does not match required pattern',
  },

  /**
   * Value not in allowed values
   */
  notInEnum: {
    variableName: 'NODE_ENV',
    value: 'staging',
    validationRule: 'enum',
    constraint: ['development', 'production', 'test'],
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedMessageIncludes: 'Validation failed: Value must be one of: development, production, test',
  },

  /**
   * Multiple validation failures for the same variable
   */
  multipleFailures: {
    variableName: 'PASSWORD',
    value: 'pass',
    validationRules: [
      { rule: 'minLength', constraint: 8, message: 'Password must be at least 8 characters long' },
      { rule: 'pattern', constraint: /[A-Z]/, message: 'Password must contain at least one uppercase letter' },
      { rule: 'pattern', constraint: /[0-9]/, message: 'Password must contain at least one number' },
    ],
    expectedErrorType: 'ValidationEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.VALIDATION,
    expectedValidationErrors: [
      'Password must be at least 8 characters long',
      'Password must contain at least one uppercase letter',
      'Password must contain at least one number',
    ],
  },

  /**
   * Batch validation failures across multiple variables
   */
  batchValidationFailures: {
    variables: [
      { name: 'DB_PORT', value: 'not-a-number', error: 'DB_PORT must be a number' },
      { name: 'API_URL', value: 'not-a-url', error: 'API_URL must be a valid URL' },
      { name: 'LOG_LEVEL', value: 'EXTREME', error: 'LOG_LEVEL must be one of: DEBUG, INFO, WARN, ERROR' },
    ],
    expectedErrorType: 'BatchEnvironmentValidationError',
    expectedCategory: EnvironmentErrorCategory.BATCH,
    expectedErrorCount: 3,
    contextMessage: 'Environment validation failed',
  },
};

/**
 * Test cases for access errors in secure environment contexts.
 */
export const accessErrors = {
  /**
   * Permission denied when trying to access a secure variable
   */
  permissionDenied: {
    variableName: 'AWS_SECRET_ACCESS_KEY',
    securityContext: 'restricted',
    expectedErrorType: 'EnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.OTHER,
    expectedMessageIncludes: 'Permission denied: Cannot access secure environment variable',
  },

  /**
   * Variable encrypted and cannot be accessed in plain text
   */
  encryptedVariable: {
    variableName: 'DATABASE_PASSWORD',
    securityContext: 'encrypted',
    expectedErrorType: 'EnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.OTHER,
    expectedMessageIncludes: 'Cannot access encrypted environment variable in plain text',
  },

  /**
   * Variable only accessible in certain environments
   */
  environmentRestricted: {
    variableName: 'PRODUCTION_API_KEY',
    currentEnvironment: 'development',
    allowedEnvironments: ['production'],
    expectedErrorType: 'EnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.OTHER,
    expectedMessageIncludes: 'Environment variable PRODUCTION_API_KEY is only accessible in: production',
  },

  /**
   * Variable requires elevated permissions
   */
  elevatedPermissionsRequired: {
    variableName: 'ADMIN_TOKEN',
    currentPermissions: ['user'],
    requiredPermissions: ['admin'],
    expectedErrorType: 'EnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.OTHER,
    expectedMessageIncludes: 'Insufficient permissions to access environment variable ADMIN_TOKEN',
  },
};

/**
 * Test cases for journey-specific environment variable errors.
 */
export const journeySpecificErrors = {
  /**
   * Accessing a journey-specific variable from the wrong journey context
   */
  wrongJourneyContext: {
    variableName: 'HEALTH_API_URL',
    currentJourney: 'care',
    expectedJourney: 'health',
    expectedErrorType: 'EnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.OTHER,
    expectedMessageIncludes: 'Environment variable HEALTH_API_URL is only accessible in health journey',
  },

  /**
   * Missing journey-specific required variable
   */
  missingJourneyVariable: {
    variableName: 'CARE_SERVICE_URL',
    currentJourney: 'care',
    expectedErrorType: 'MissingEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.MISSING,
    expectedMessageIncludes: 'Required environment variable is missing',
    additionalContext: 'Required for care journey',
  },

  /**
   * Invalid journey-specific feature flag
   */
  invalidJourneyFeatureFlag: {
    variableName: 'HEALTH_FEATURE_ENABLED',
    value: 'maybe',
    currentJourney: 'health',
    expectedErrorType: 'InvalidEnvironmentVariableError',
    expectedCategory: EnvironmentErrorCategory.INVALID,
    expectedMessageIncludes: 'Invalid value "maybe". Expected true/false, yes/no, 1/0',
  },
};

/**
 * All error test cases combined for easy access.
 */
export const allErrorCases = {
  missingRequiredVariables,
  malformedValues,
  typeConversionErrors,
  validationFailures,
  accessErrors,
  journeySpecificErrors,
};