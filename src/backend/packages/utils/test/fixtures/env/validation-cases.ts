/**
 * Test fixtures for environment variable validation.
 * 
 * This file provides comprehensive test cases for validating environment variables,
 * including valid and invalid values for different types of environment variables
 * (strings, numbers, booleans, arrays, URLs, etc.).
 * 
 * These fixtures are essential for testing the validation functions in the env/validation.ts
 * module and ensuring that environment validation correctly identifies valid and invalid
 * configurations.
 */

import { ValidationTestCase } from '../../types';

/**
 * Test cases for string environment variable validation.
 */
export const stringValidationCases: ValidationTestCase<string>[] = [
  // Basic string validation
  {
    name: 'valid string',
    value: 'test-value',
    isValid: true,
    validationRules: {},
  },
  {
    name: 'empty string',
    value: '',
    isValid: false,
    validationRules: { required: true },
    errorMessage: 'Environment variable cannot be empty',
  },
  {
    name: 'empty string with not required',
    value: '',
    isValid: true,
    validationRules: { required: false },
  },
  
  // Enum validation
  {
    name: 'valid enum value',
    value: 'development',
    isValid: true,
    validationRules: { allowedValues: ['development', 'production', 'test'] },
  },
  {
    name: 'invalid enum value',
    value: 'staging',
    isValid: false,
    validationRules: { allowedValues: ['development', 'production', 'test'] },
    errorMessage: 'Value must be one of: development, production, test',
  },
  
  // Pattern validation
  {
    name: 'valid pattern match',
    value: 'abc-123',
    isValid: true,
    validationRules: { pattern: /^[a-z]+-\d+$/ },
  },
  {
    name: 'invalid pattern match',
    value: '123-abc',
    isValid: false,
    validationRules: { pattern: /^[a-z]+-\d+$/ },
    errorMessage: 'Value does not match required pattern',
  },
  
  // Length validation
  {
    name: 'valid string length',
    value: 'test',
    isValid: true,
    validationRules: { minLength: 3, maxLength: 10 },
  },
  {
    name: 'string too short',
    value: 'ab',
    isValid: false,
    validationRules: { minLength: 3 },
    errorMessage: 'Value must be at least 3 characters long',
  },
  {
    name: 'string too long',
    value: 'this-string-is-way-too-long',
    isValid: false,
    validationRules: { maxLength: 10 },
    errorMessage: 'Value must not exceed 10 characters',
  },
  
  // Case sensitivity
  {
    name: 'case insensitive match',
    value: 'Production',
    isValid: true,
    validationRules: { 
      allowedValues: ['development', 'production', 'test'],
      caseInsensitive: true 
    },
  },
  {
    name: 'case sensitive match fails',
    value: 'Production',
    isValid: false,
    validationRules: { 
      allowedValues: ['development', 'production', 'test'],
      caseInsensitive: false 
    },
    errorMessage: 'Value must be one of: development, production, test',
  },
  
  // Whitespace handling
  {
    name: 'auto-trimmed string valid',
    value: '  test  ',
    isValid: true,
    validationRules: { trim: true, minLength: 4, maxLength: 4 },
  },
  {
    name: 'non-trimmed string invalid length',
    value: '  test  ',
    isValid: false,
    validationRules: { trim: false, minLength: 4, maxLength: 4 },
    errorMessage: 'Value must not exceed 4 characters',
  },
];

/**
 * Test cases for number environment variable validation.
 */
export const numberValidationCases: ValidationTestCase<number>[] = [
  // Basic number validation
  {
    name: 'valid integer',
    value: '42',
    isValid: true,
    validationRules: {},
    expectedValue: 42,
  },
  {
    name: 'valid float',
    value: '3.14',
    isValid: true,
    validationRules: {},
    expectedValue: 3.14,
  },
  {
    name: 'invalid number format',
    value: 'not-a-number',
    isValid: false,
    validationRules: {},
    errorMessage: 'Value must be a valid number',
  },
  
  // Range validation
  {
    name: 'number within range',
    value: '50',
    isValid: true,
    validationRules: { min: 1, max: 100 },
    expectedValue: 50,
  },
  {
    name: 'number below minimum',
    value: '0',
    isValid: false,
    validationRules: { min: 1 },
    errorMessage: 'Value must be at least 1',
  },
  {
    name: 'number above maximum',
    value: '101',
    isValid: false,
    validationRules: { max: 100 },
    errorMessage: 'Value must not exceed 100',
  },
  
  // Integer validation
  {
    name: 'valid integer with integer requirement',
    value: '42',
    isValid: true,
    validationRules: { integer: true },
    expectedValue: 42,
  },
  {
    name: 'float with integer requirement',
    value: '42.5',
    isValid: false,
    validationRules: { integer: true },
    errorMessage: 'Value must be an integer',
  },
  
  // Default values
  {
    name: 'empty string with default',
    value: '',
    isValid: true,
    validationRules: { default: 3000 },
    expectedValue: 3000,
  },
  
  // Port number validation
  {
    name: 'valid port number',
    value: '8080',
    isValid: true,
    validationRules: { min: 1, max: 65535, integer: true },
    expectedValue: 8080,
  },
  {
    name: 'invalid port number (too high)',
    value: '70000',
    isValid: false,
    validationRules: { min: 1, max: 65535, integer: true },
    errorMessage: 'Value must not exceed 65535',
  },
  
  // Positive/negative validation
  {
    name: 'positive number with positive requirement',
    value: '5',
    isValid: true,
    validationRules: { positive: true },
    expectedValue: 5,
  },
  {
    name: 'negative number with positive requirement',
    value: '-5',
    isValid: false,
    validationRules: { positive: true },
    errorMessage: 'Value must be positive',
  },
  {
    name: 'zero with positive requirement',
    value: '0',
    isValid: false,
    validationRules: { positive: true },
    errorMessage: 'Value must be positive',
  },
  {
    name: 'negative number with negative requirement',
    value: '-5',
    isValid: true,
    validationRules: { negative: true },
    expectedValue: -5,
  },
];

/**
 * Test cases for boolean environment variable validation.
 */
export const booleanValidationCases: ValidationTestCase<boolean>[] = [
  // String representations of true
  {
    name: 'true string',
    value: 'true',
    isValid: true,
    validationRules: {},
    expectedValue: true,
  },
  {
    name: 'TRUE uppercase',
    value: 'TRUE',
    isValid: true,
    validationRules: {},
    expectedValue: true,
  },
  {
    name: 'yes string',
    value: 'yes',
    isValid: true,
    validationRules: {},
    expectedValue: true,
  },
  {
    name: '1 string',
    value: '1',
    isValid: true,
    validationRules: {},
    expectedValue: true,
  },
  
  // String representations of false
  {
    name: 'false string',
    value: 'false',
    isValid: true,
    validationRules: {},
    expectedValue: false,
  },
  {
    name: 'FALSE uppercase',
    value: 'FALSE',
    isValid: true,
    validationRules: {},
    expectedValue: false,
  },
  {
    name: 'no string',
    value: 'no',
    isValid: true,
    validationRules: {},
    expectedValue: false,
  },
  {
    name: '0 string',
    value: '0',
    isValid: true,
    validationRules: {},
    expectedValue: false,
  },
  
  // Invalid boolean values
  {
    name: 'invalid boolean string',
    value: 'not-a-boolean',
    isValid: false,
    validationRules: {},
    errorMessage: 'Value must be a boolean (true/false, yes/no, 1/0)',
  },
  
  // Strict boolean validation
  {
    name: 'true with strict validation',
    value: 'true',
    isValid: true,
    validationRules: { strict: true },
    expectedValue: true,
  },
  {
    name: 'yes with strict validation',
    value: 'yes',
    isValid: false,
    validationRules: { strict: true },
    errorMessage: 'Value must be exactly "true" or "false"',
  },
  
  // Default values
  {
    name: 'empty string with default true',
    value: '',
    isValid: true,
    validationRules: { default: true },
    expectedValue: true,
  },
];

/**
 * Test cases for URL environment variable validation.
 */
export const urlValidationCases: ValidationTestCase<string>[] = [
  // Basic URL validation
  {
    name: 'valid http URL',
    value: 'http://example.com',
    isValid: true,
    validationRules: {},
  },
  {
    name: 'valid https URL',
    value: 'https://example.com/path?query=value',
    isValid: true,
    validationRules: {},
  },
  {
    name: 'invalid URL format',
    value: 'not-a-url',
    isValid: false,
    validationRules: {},
    errorMessage: 'Value must be a valid URL',
  },
  
  // Protocol validation
  {
    name: 'URL with required https protocol',
    value: 'https://secure-example.com',
    isValid: true,
    validationRules: { protocols: ['https'] },
  },
  {
    name: 'URL with disallowed protocol',
    value: 'http://insecure-example.com',
    isValid: false,
    validationRules: { protocols: ['https'] },
    errorMessage: 'URL must use one of the following protocols: https',
  },
  {
    name: 'URL with one of multiple allowed protocols',
    value: 'ftp://example.com',
    isValid: true,
    validationRules: { protocols: ['http', 'https', 'ftp'] },
  },
  
  // Domain validation
  {
    name: 'URL with required domain',
    value: 'https://api.example.com/v1',
    isValid: true,
    validationRules: { domain: 'example.com' },
  },
  {
    name: 'URL with wrong domain',
    value: 'https://api.another-site.com/v1',
    isValid: false,
    validationRules: { domain: 'example.com' },
    errorMessage: 'URL must be from domain: example.com',
  },
  
  // Port validation
  {
    name: 'URL with valid port',
    value: 'http://localhost:3000',
    isValid: true,
    validationRules: {},
  },
  {
    name: 'URL with required port',
    value: 'http://localhost:8080',
    isValid: true,
    validationRules: { port: 8080 },
  },
  {
    name: 'URL with wrong port',
    value: 'http://localhost:3000',
    isValid: false,
    validationRules: { port: 8080 },
    errorMessage: 'URL must use port: 8080',
  },
  
  // Path validation
  {
    name: 'URL with required path prefix',
    value: 'https://api.example.com/v1/resources',
    isValid: true,
    validationRules: { pathPrefix: '/v1' },
  },
  {
    name: 'URL with wrong path prefix',
    value: 'https://api.example.com/v2/resources',
    isValid: false,
    validationRules: { pathPrefix: '/v1' },
    errorMessage: 'URL path must start with: /v1',
  },
];

/**
 * Test cases for array environment variable validation.
 */
export const arrayValidationCases: ValidationTestCase<string[]>[] = [
  // Basic array validation (comma-separated)
  {
    name: 'valid comma-separated array',
    value: 'item1,item2,item3',
    isValid: true,
    validationRules: {},
    expectedValue: ['item1', 'item2', 'item3'],
  },
  {
    name: 'single item array',
    value: 'item1',
    isValid: true,
    validationRules: {},
    expectedValue: ['item1'],
  },
  {
    name: 'empty array',
    value: '',
    isValid: true,
    validationRules: {},
    expectedValue: [],
  },
  
  // Array with custom separator
  {
    name: 'array with space separator',
    value: 'item1 item2 item3',
    isValid: true,
    validationRules: { separator: ' ' },
    expectedValue: ['item1', 'item2', 'item3'],
  },
  {
    name: 'array with pipe separator',
    value: 'item1|item2|item3',
    isValid: true,
    validationRules: { separator: '|' },
    expectedValue: ['item1', 'item2', 'item3'],
  },
  
  // Array length validation
  {
    name: 'array with valid length',
    value: 'item1,item2,item3',
    isValid: true,
    validationRules: { minItems: 2, maxItems: 5 },
    expectedValue: ['item1', 'item2', 'item3'],
  },
  {
    name: 'array too short',
    value: 'item1',
    isValid: false,
    validationRules: { minItems: 2 },
    errorMessage: 'Array must contain at least 2 items',
  },
  {
    name: 'array too long',
    value: 'item1,item2,item3,item4,item5,item6',
    isValid: false,
    validationRules: { maxItems: 5 },
    errorMessage: 'Array must not contain more than 5 items',
  },
  
  // Item validation
  {
    name: 'array with valid items',
    value: 'development,production,test',
    isValid: true,
    validationRules: { allowedItems: ['development', 'production', 'test', 'staging'] },
    expectedValue: ['development', 'production', 'test'],
  },
  {
    name: 'array with invalid item',
    value: 'development,invalid,test',
    isValid: false,
    validationRules: { allowedItems: ['development', 'production', 'test', 'staging'] },
    errorMessage: 'Array contains invalid item: invalid',
  },
  
  // Unique items validation
  {
    name: 'array with unique items',
    value: 'item1,item2,item3',
    isValid: true,
    validationRules: { uniqueItems: true },
    expectedValue: ['item1', 'item2', 'item3'],
  },
  {
    name: 'array with duplicate items',
    value: 'item1,item2,item1',
    isValid: false,
    validationRules: { uniqueItems: true },
    errorMessage: 'Array must contain unique items',
  },
  
  // Item pattern validation
  {
    name: 'array with items matching pattern',
    value: 'abc-123,def-456,ghi-789',
    isValid: true,
    validationRules: { itemPattern: /^[a-z]+-\d+$/ },
    expectedValue: ['abc-123', 'def-456', 'ghi-789'],
  },
  {
    name: 'array with item not matching pattern',
    value: 'abc-123,invalid,ghi-789',
    isValid: false,
    validationRules: { itemPattern: /^[a-z]+-\d+$/ },
    errorMessage: 'Array item does not match required pattern: invalid',
  },
];

/**
 * Test cases for conditional environment variable validation.
 */
export const conditionalValidationCases: ValidationTestCase<any>[] = [
  // Conditional presence validation
  {
    name: 'required when condition is true',
    value: 'value',
    isValid: true,
    validationRules: { 
      requiredWhen: { otherVar: 'true' } 
    },
    context: { otherVar: 'true' },
  },
  {
    name: 'missing when condition is true',
    value: '',
    isValid: false,
    validationRules: { 
      requiredWhen: { otherVar: 'true' } 
    },
    context: { otherVar: 'true' },
    errorMessage: 'Value is required when otherVar is true',
  },
  {
    name: 'missing when condition is false',
    value: '',
    isValid: true,
    validationRules: { 
      requiredWhen: { otherVar: 'true' } 
    },
    context: { otherVar: 'false' },
  },
  
  // Multiple conditions
  {
    name: 'required when multiple conditions are met',
    value: 'value',
    isValid: true,
    validationRules: { 
      requiredWhen: { 
        featureEnabled: 'true',
        environment: 'production'
      } 
    },
    context: { 
      featureEnabled: 'true',
      environment: 'production'
    },
  },
  {
    name: 'missing when multiple conditions are met',
    value: '',
    isValid: false,
    validationRules: { 
      requiredWhen: { 
        featureEnabled: 'true',
        environment: 'production'
      } 
    },
    context: { 
      featureEnabled: 'true',
      environment: 'production'
    },
    errorMessage: 'Value is required when featureEnabled is true and environment is production',
  },
  {
    name: 'missing when one condition is not met',
    value: '',
    isValid: true,
    validationRules: { 
      requiredWhen: { 
        featureEnabled: 'true',
        environment: 'production'
      } 
    },
    context: { 
      featureEnabled: 'true',
      environment: 'development'
    },
  },
  
  // Conditional validation rules
  {
    name: 'different validation when condition is met',
    value: 'http://example.com',
    isValid: false,
    validationRules: { 
      conditionalRules: [
        {
          when: { secureMode: 'true' },
          rules: { protocols: ['https'] }
        }
      ]
    },
    context: { secureMode: 'true' },
    errorMessage: 'URL must use one of the following protocols: https',
  },
  {
    name: 'different validation when condition is not met',
    value: 'http://example.com',
    isValid: true,
    validationRules: { 
      conditionalRules: [
        {
          when: { secureMode: 'true' },
          rules: { protocols: ['https'] }
        }
      ]
    },
    context: { secureMode: 'false' },
  },
];

/**
 * Test cases for complex nested validation.
 */
export const nestedValidationCases: ValidationTestCase<any>[] = [
  // Object validation
  {
    name: 'valid JSON object',
    value: '{"host":"localhost","port":3000,"secure":false}',
    isValid: true,
    validationRules: {
      schema: {
        host: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 },
        secure: { type: 'boolean' }
      }
    },
    expectedValue: { host: 'localhost', port: 3000, secure: false },
  },
  {
    name: 'invalid JSON format',
    value: '{host:"localhost",port:3000}', // Missing quotes around property names
    isValid: false,
    validationRules: {
      schema: {
        host: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 }
      }
    },
    errorMessage: 'Value must be a valid JSON object',
  },
  {
    name: 'missing required property',
    value: '{"port":3000,"secure":false}',
    isValid: false,
    validationRules: {
      schema: {
        host: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 },
        secure: { type: 'boolean' }
      }
    },
    errorMessage: 'Required property missing: host',
  },
  {
    name: 'invalid property type',
    value: '{"host":"localhost","port":"not-a-number","secure":false}',
    isValid: false,
    validationRules: {
      schema: {
        host: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 },
        secure: { type: 'boolean' }
      }
    },
    errorMessage: 'Property port must be a valid number',
  },
  
  // Nested object validation
  {
    name: 'valid nested object',
    value: '{"database":{"host":"localhost","port":5432},"cache":{"enabled":true}}',
    isValid: true,
    validationRules: {
      schema: {
        database: {
          type: 'object',
          schema: {
            host: { type: 'string', required: true },
            port: { type: 'number', min: 1, max: 65535 }
          }
        },
        cache: {
          type: 'object',
          schema: {
            enabled: { type: 'boolean' }
          }
        }
      }
    },
    expectedValue: {
      database: { host: 'localhost', port: 5432 },
      cache: { enabled: true }
    },
  },
  {
    name: 'invalid nested property',
    value: '{"database":{"host":"localhost","port":70000},"cache":{"enabled":true}}',
    isValid: false,
    validationRules: {
      schema: {
        database: {
          type: 'object',
          schema: {
            host: { type: 'string', required: true },
            port: { type: 'number', min: 1, max: 65535 }
          }
        },
        cache: {
          type: 'object',
          schema: {
            enabled: { type: 'boolean' }
          }
        }
      }
    },
    errorMessage: 'Property database.port must not exceed 65535',
  },
  
  // Array of objects validation
  {
    name: 'valid array of objects',
    value: '[{"name":"db1","port":5432},{"name":"db2","port":27017}]',
    isValid: true,
    validationRules: {
      type: 'array',
      itemSchema: {
        name: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 }
      }
    },
    expectedValue: [
      { name: 'db1', port: 5432 },
      { name: 'db2', port: 27017 }
    ],
  },
  {
    name: 'invalid item in array of objects',
    value: '[{"name":"db1","port":5432},{"port":27017}]',
    isValid: false,
    validationRules: {
      type: 'array',
      itemSchema: {
        name: { type: 'string', required: true },
        port: { type: 'number', min: 1, max: 65535 }
      }
    },
    errorMessage: 'Required property missing in array item 1: name',
  },
];

/**
 * Test cases for service-specific environment variable validation.
 */
export const serviceSpecificValidationCases: ValidationTestCase<any>[] = [
  // Health service specific
  {
    name: 'valid FHIR API configuration',
    value: 'true',
    isValid: true,
    validationRules: {},
    expectedValue: true,
    context: {
      FHIR_API_ENABLED: 'true',
      FHIR_API_URL: 'https://fhir.example.com/api',
      FHIR_API_CLIENT_ID: 'client-id',
      FHIR_API_CLIENT_SECRET: 'client-secret',
      FHIR_API_SCOPE: 'patient/*.read',
      FHIR_API_TOKEN_URL: 'https://fhir.example.com/token'
    },
  },
  {
    name: 'missing required FHIR API configuration',
    value: 'true',
    isValid: false,
    validationRules: {
      requiredWhen: {
        FHIR_API_ENABLED: 'true'
      }
    },
    context: {
      FHIR_API_ENABLED: 'true',
      FHIR_API_URL: 'https://fhir.example.com/api',
      // Missing FHIR_API_CLIENT_ID
      FHIR_API_CLIENT_SECRET: 'client-secret',
      FHIR_API_SCOPE: 'patient/*.read',
      FHIR_API_TOKEN_URL: 'https://fhir.example.com/token'
    },
    errorMessage: 'FHIR_API_CLIENT_ID is required when FHIR_API_ENABLED is true',
  },
  
  // Notification service specific
  {
    name: 'valid email provider configuration',
    value: 'sendgrid',
    isValid: true,
    validationRules: {
      allowedValues: ['sendgrid', 'mailgun', 'ses']
    },
    context: {
      EMAIL_API_KEY: 'api-key',
      EMAIL_DEFAULT_FROM: 'no-reply@example.com'
    },
  },
  {
    name: 'invalid email provider',
    value: 'invalid-provider',
    isValid: false,
    validationRules: {
      allowedValues: ['sendgrid', 'mailgun', 'ses']
    },
    errorMessage: 'Value must be one of: sendgrid, mailgun, ses',
  },
  
  // Database configuration
  {
    name: 'valid database URL',
    value: 'postgresql://user:password@localhost:5432/dbname',
    isValid: true,
    validationRules: {
      pattern: /^postgresql:\/\/.+:.+@.+:\d+\/[\w-]+$/
    },
  },
  {
    name: 'invalid database URL format',
    value: 'postgres://localhost/dbname',
    isValid: false,
    validationRules: {
      pattern: /^postgresql:\/\/.+:.+@.+:\d+\/[\w-]+$/
    },
    errorMessage: 'Value does not match required pattern',
  },
  
  // Redis configuration
  {
    name: 'valid Redis URL',
    value: 'redis://localhost:6379/0',
    isValid: true,
    validationRules: {
      pattern: /^redis:\/\/.+:\d+\/\d+$/
    },
  },
  {
    name: 'valid Redis URL with password',
    value: 'redis://:password@localhost:6379/0',
    isValid: true,
    validationRules: {
      pattern: /^redis:\/\/(?::.+@)?.+:\d+\/\d+$/
    },
  },
  
  // Kafka configuration
  {
    name: 'valid Kafka brokers',
    value: 'kafka1:9092,kafka2:9092,kafka3:9092',
    isValid: true,
    validationRules: {
      type: 'array',
      separator: ',',
      itemPattern: /^[\w.-]+:\d+$/
    },
    expectedValue: ['kafka1:9092', 'kafka2:9092', 'kafka3:9092'],
  },
  {
    name: 'invalid Kafka broker format',
    value: 'kafka1:9092,invalid-format,kafka3:9092',
    isValid: false,
    validationRules: {
      type: 'array',
      separator: ',',
      itemPattern: /^[\w.-]+:\d+$/
    },
    errorMessage: 'Array item does not match required pattern: invalid-format',
  },
];

/**
 * All validation test cases combined.
 */
export const allValidationCases: ValidationTestCase<any>[] = [
  ...stringValidationCases,
  ...numberValidationCases,
  ...booleanValidationCases,
  ...urlValidationCases,
  ...arrayValidationCases,
  ...conditionalValidationCases,
  ...nestedValidationCases,
  ...serviceSpecificValidationCases,
];