/**
 * Environment Variable Validation Utilities
 * 
 * This module provides schema-based validation for environment variables using Zod,
 * enabling services to ensure environment variables meet required formats and constraints.
 * It includes specialized validators for common types and batch validation utilities.
 */

import { z } from 'zod';
import {
  EnvironmentVariableError,
  InvalidEnvironmentVariableError,
  ValidationEnvironmentVariableError,
  BatchEnvironmentValidationError,
  validateEnvironmentBatch
} from './error';
import {
  parseBoolean,
  parseNumber,
  parseArray,
  parseNumberArray,
  parseJson,
  parseUrl,
  parseRange,
  parseDuration,
  parseEnum
} from './transform';

/**
 * Creates a validator function for an environment variable using a Zod schema
 * 
 * @param variableName - The name of the environment variable to validate
 * @param schema - The Zod schema to validate against
 * @returns A function that validates the environment variable against the schema
 * @throws ValidationEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required string environment variable
 * const validateApiKey = createZodValidator('API_KEY', z.string().min(10));
 * 
 * // Use the validator
 * validateApiKey(); // Throws if API_KEY is missing or invalid
 */
export function createZodValidator<T>(variableName: string, schema: z.ZodType<T>): () => T {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a defined value'
      );
    }
    
    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => {
          // Format the error message to be more user-friendly
          return `${err.message}${err.path.length > 0 ? ` at ${err.path.join('.')}` : ''}`;
        });
        
        throw new ValidationEnvironmentVariableError(variableName, validationErrors);
      }
      
      // If it's not a ZodError, re-throw
      throw error;
    }
  };
}

/**
 * Creates a validator function for an environment variable using a Zod schema,
 * with a default value if the variable is not defined
 * 
 * @param variableName - The name of the environment variable to validate
 * @param schema - The Zod schema to validate against
 * @param defaultValue - The default value to use if the variable is not defined
 * @returns A function that validates the environment variable against the schema
 * @throws ValidationEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for an optional number environment variable with default
 * const validatePort = createZodValidatorWithDefault('PORT', z.number().int().positive(), 3000);
 * 
 * // Use the validator
 * const port = validatePort(); // Returns 3000 if PORT is not defined
 */
export function createZodValidatorWithDefault<T>(
  variableName: string,
  schema: z.ZodType<T>,
  defaultValue: T
): () => T {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      return defaultValue;
    }
    
    try {
      return schema.parse(value);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => {
          return `${err.message}${err.path.length > 0 ? ` at ${err.path.join('.')}` : ''}`;
        });
        
        throw new ValidationEnvironmentVariableError(variableName, validationErrors);
      }
      
      throw error;
    }
  };
}

/**
 * Creates a validator function for a required string environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required string environment variable
 * const validateApiKey = createStringValidator('API_KEY', { minLength: 10 });
 * 
 * // Use the validator
 * const apiKey = validateApiKey(); // Throws if API_KEY is missing or invalid
 */
export function createStringValidator(
  variableName: string,
  options: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    enum?: string[];
  } = {}
): () => string {
  let schema = z.string();
  
  if (options.minLength !== undefined) {
    schema = schema.min(options.minLength, 
      `Should be at least ${options.minLength} characters`);
  }
  
  if (options.maxLength !== undefined) {
    schema = schema.max(options.maxLength, 
      `Should be at most ${options.maxLength} characters`);
  }
  
  if (options.pattern !== undefined) {
    schema = schema.regex(options.pattern, 
      'Does not match the required pattern');
  }
  
  if (options.enum !== undefined) {
    schema = schema.refine(
      value => options.enum!.includes(value),
      `Should be one of: ${options.enum.join(', ')}`
    );
  }
  
  return createZodValidator(variableName, schema);
}

/**
 * Creates a validator function for a required number environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required number environment variable
 * const validatePort = createNumberValidator('PORT', { min: 1024, max: 65535 });
 * 
 * // Use the validator
 * const port = validatePort(); // Throws if PORT is missing or invalid
 */
export function createNumberValidator(
  variableName: string,
  options: {
    min?: number;
    max?: number;
    int?: boolean;
    positive?: boolean;
    nonNegative?: boolean;
  } = {}
): () => number {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a number value'
      );
    }
    
    try {
      const parsedValue = parseNumber(value);
      
      if (options.int && !Number.isInteger(parsedValue)) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          'an integer value'
        );
      }
      
      if (options.positive && parsedValue <= 0) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          'a positive number'
        );
      }
      
      if (options.nonNegative && parsedValue < 0) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          'a non-negative number'
        );
      }
      
      if (options.min !== undefined && parsedValue < options.min) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a number greater than or equal to ${options.min}`
        );
      }
      
      if (options.max !== undefined && parsedValue > options.max) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a number less than or equal to ${options.max}`
        );
      }
      
      return parsedValue;
    } catch (error) {
      if (error instanceof InvalidEnvironmentVariableError) {
        throw error;
      }
      
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'a valid number'
      );
    }
  };
}

/**
 * Creates a validator function for a required boolean environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required boolean environment variable
 * const validateDebugMode = createBooleanValidator('DEBUG_MODE');
 * 
 * // Use the validator
 * const isDebugMode = validateDebugMode(); // Throws if DEBUG_MODE is missing or invalid
 */
export function createBooleanValidator(variableName: string): () => boolean {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a boolean value (true, false, 1, 0, yes, no)'
      );
    }
    
    return parseBoolean(value);
  };
}

/**
 * Creates a validator function for a required URL environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required URL environment variable
 * const validateApiUrl = createUrlValidator('API_URL', { protocols: ['https'] });
 * 
 * // Use the validator
 * const apiUrl = validateApiUrl(); // Throws if API_URL is missing or invalid
 */
export function createUrlValidator(
  variableName: string,
  options: {
    protocols?: string[];
    requireTld?: boolean;
  } = {}
): () => URL {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a valid URL'
      );
    }
    
    try {
      return parseUrl(value, options);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a valid URL: ${error.message}`
        );
      }
      
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'a valid URL'
      );
    }
  };
}

/**
 * Creates a validator function for a required array environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required array environment variable
 * const validateAllowedOrigins = createArrayValidator('ALLOWED_ORIGINS', { delimiter: ',' });
 * 
 * // Use the validator
 * const allowedOrigins = validateAllowedOrigins(); // Throws if ALLOWED_ORIGINS is missing or invalid
 */
export function createArrayValidator(
  variableName: string,
  options: {
    delimiter?: string;
    minLength?: number;
    maxLength?: number;
    itemValidator?: (item: string, index: number) => boolean;
  } = {}
): () => string[] {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a comma-separated list'
      );
    }
    
    const delimiter = options.delimiter || ',';
    const items = parseArray(value, delimiter);
    
    if (options.minLength !== undefined && items.length < options.minLength) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        `a list with at least ${options.minLength} items`
      );
    }
    
    if (options.maxLength !== undefined && items.length > options.maxLength) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        `a list with at most ${options.maxLength} items`
      );
    }
    
    if (options.itemValidator) {
      for (let i = 0; i < items.length; i++) {
        if (!options.itemValidator(items[i], i)) {
          throw new InvalidEnvironmentVariableError(
            variableName,
            value,
            `a list where item at index ${i} ("${items[i]}") is valid`
          );
        }
      }
    }
    
    return items;
  };
}

/**
 * Creates a validator function for a required JSON environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param schema - Optional Zod schema to validate the parsed JSON against
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required JSON environment variable
 * const validateConfig = createJsonValidator('APP_CONFIG', z.object({
 *   debug: z.boolean(),
 *   timeout: z.number()
 * }));
 * 
 * // Use the validator
 * const config = validateConfig(); // Throws if APP_CONFIG is missing or invalid
 */
export function createJsonValidator<T>(
  variableName: string,
  schema?: z.ZodType<T>
): () => T {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a valid JSON string'
      );
    }
    
    try {
      const parsedValue = parseJson(value);
      
      if (schema) {
        try {
          return schema.parse(parsedValue);
        } catch (error) {
          if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(err => {
              return `${err.message}${err.path.length > 0 ? ` at ${err.path.join('.')}` : ''}`;
            });
            
            throw new ValidationEnvironmentVariableError(variableName, validationErrors);
          }
          
          throw error;
        }
      }
      
      return parsedValue as T;
    } catch (error) {
      if (error instanceof ValidationEnvironmentVariableError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a valid JSON string: ${error.message}`
        );
      }
      
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'a valid JSON string'
      );
    }
  };
}

/**
 * Creates a validator function for a required enum environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param enumObject - The enum object to validate against
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * enum LogLevel { DEBUG = 'debug', INFO = 'info', WARN = 'warn', ERROR = 'error' }
 * 
 * // Create a validator for a required enum environment variable
 * const validateLogLevel = createEnumValidator('LOG_LEVEL', LogLevel);
 * 
 * // Use the validator
 * const logLevel = validateLogLevel(); // Throws if LOG_LEVEL is missing or invalid
 */
export function createEnumValidator<T extends Record<string, string | number>>(
  variableName: string,
  enumObject: T
): () => T[keyof T] {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        `one of: ${Object.values(enumObject).join(', ')}`
      );
    }
    
    try {
      return parseEnum(value, enumObject);
    } catch (error) {
      if (error instanceof Error) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `one of: ${Object.values(enumObject).join(', ')}`
        );
      }
      
      throw error;
    }
  };
}

/**
 * Creates a validator function for a required duration environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required duration environment variable
 * const validateTimeout = createDurationValidator('TIMEOUT', { min: 1000, max: 30000 });
 * 
 * // Use the validator
 * const timeout = validateTimeout(); // Throws if TIMEOUT is missing or invalid
 */
export function createDurationValidator(
  variableName: string,
  options: {
    min?: number;
    max?: number;
  } = {}
): () => number {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a valid duration (e.g., 1d, 2h, 30m, 45s, 500ms)'
      );
    }
    
    try {
      const parsedValue = parseDuration(value);
      
      if (options.min !== undefined && parsedValue < options.min) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a duration greater than or equal to ${options.min}ms`
        );
      }
      
      if (options.max !== undefined && parsedValue > options.max) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a duration less than or equal to ${options.max}ms`
        );
      }
      
      return parsedValue;
    } catch (error) {
      if (error instanceof InvalidEnvironmentVariableError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a valid duration: ${error.message}`
        );
      }
      
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'a valid duration'
      );
    }
  };
}

/**
 * Creates a validator function for a required port environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required port environment variable
 * const validatePort = createPortValidator('PORT');
 * 
 * // Use the validator
 * const port = validatePort(); // Throws if PORT is missing or invalid
 */
export function createPortValidator(variableName: string): () => number {
  return createNumberValidator(variableName, {
    int: true,
    min: 1,
    max: 65535
  });
}

/**
 * Creates a validator function for a required host environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required host environment variable
 * const validateHost = createHostValidator('HOST');
 * 
 * // Use the validator
 * const host = validateHost(); // Throws if HOST is missing or invalid
 */
export function createHostValidator(variableName: string): () => string {
  // Simplified hostname regex pattern
  const hostnamePattern = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  
  return createStringValidator(variableName, {
    pattern: hostnamePattern
  });
}

/**
 * Creates a validator function for a required database URL environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required database URL environment variable
 * const validateDbUrl = createDatabaseUrlValidator('DATABASE_URL', { protocols: ['postgresql'] });
 * 
 * // Use the validator
 * const dbUrl = validateDbUrl(); // Throws if DATABASE_URL is missing or invalid
 */
export function createDatabaseUrlValidator(
  variableName: string,
  options: {
    protocols?: string[];
  } = {}
): () => URL {
  return createUrlValidator(variableName, {
    protocols: options.protocols || ['postgresql', 'mysql', 'mongodb']
  });
}

/**
 * Creates a validator function for a required API key environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @param options - Optional validation options
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required API key environment variable
 * const validateApiKey = createApiKeyValidator('API_KEY', { minLength: 32 });
 * 
 * // Use the validator
 * const apiKey = validateApiKey(); // Throws if API_KEY is missing or invalid
 */
export function createApiKeyValidator(
  variableName: string,
  options: {
    minLength?: number;
    pattern?: RegExp;
  } = {}
): () => string {
  return createStringValidator(variableName, {
    minLength: options.minLength || 16,
    pattern: options.pattern
  });
}

/**
 * Creates a validator function for a required JWT secret environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required JWT secret environment variable
 * const validateJwtSecret = createJwtSecretValidator('JWT_SECRET');
 * 
 * // Use the validator
 * const jwtSecret = validateJwtSecret(); // Throws if JWT_SECRET is missing or invalid
 */
export function createJwtSecretValidator(variableName: string): () => string {
  return createStringValidator(variableName, {
    minLength: 32
  });
}

/**
 * Creates a validator function for a required environment name variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required environment name variable
 * const validateNodeEnv = createEnvironmentValidator('NODE_ENV');
 * 
 * // Use the validator
 * const nodeEnv = validateNodeEnv(); // Throws if NODE_ENV is missing or invalid
 */
export function createEnvironmentValidator(variableName: string): () => 'development' | 'test' | 'staging' | 'production' {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'one of: development, test, staging, production'
      );
    }
    
    const validEnvironments = ['development', 'test', 'staging', 'production'];
    
    if (!validEnvironments.includes(value)) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'one of: development, test, staging, production'
      );
    }
    
    return value as 'development' | 'test' | 'staging' | 'production';
  };
}

/**
 * Creates a validator function for a required Redis URL environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required Redis URL environment variable
 * const validateRedisUrl = createRedisUrlValidator('REDIS_URL');
 * 
 * // Use the validator
 * const redisUrl = validateRedisUrl(); // Throws if REDIS_URL is missing or invalid
 */
export function createRedisUrlValidator(variableName: string): () => URL {
  return createUrlValidator(variableName, {
    protocols: ['redis']
  });
}

/**
 * Creates a validator function for a required Kafka broker list environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required Kafka broker list environment variable
 * const validateKafkaBrokers = createKafkaBrokersValidator('KAFKA_BROKERS');
 * 
 * // Use the validator
 * const kafkaBrokers = validateKafkaBrokers(); // Throws if KAFKA_BROKERS is missing or invalid
 */
export function createKafkaBrokersValidator(variableName: string): () => string[] {
  return createArrayValidator(variableName, {
    delimiter: ',',
    minLength: 1,
    itemValidator: (item) => {
      // Simple validation for host:port format
      const parts = item.split(':');
      if (parts.length !== 2) return false;
      
      const [host, portStr] = parts;
      if (!host) return false;
      
      const port = parseInt(portStr, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    }
  });
}

/**
 * Creates a validator function for a required CORS origins environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required CORS origins environment variable
 * const validateCorsOrigins = createCorsOriginsValidator('CORS_ORIGINS');
 * 
 * // Use the validator
 * const corsOrigins = validateCorsOrigins(); // Throws if CORS_ORIGINS is missing or invalid
 */
export function createCorsOriginsValidator(variableName: string): () => string[] {
  return createArrayValidator(variableName, {
    delimiter: ',',
    itemValidator: (item) => {
      if (item === '*') return true;
      
      try {
        new URL(item);
        return true;
      } catch {
        return false;
      }
    }
  });
}

/**
 * Creates a validator function for a required log level environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required log level environment variable
 * const validateLogLevel = createLogLevelValidator('LOG_LEVEL');
 * 
 * // Use the validator
 * const logLevel = validateLogLevel(); // Throws if LOG_LEVEL is missing or invalid
 */
export function createLogLevelValidator(variableName: string): () => 'debug' | 'info' | 'warn' | 'error' | 'fatal' {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'one of: debug, info, warn, error, fatal'
      );
    }
    
    const validLogLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
    
    if (!validLogLevels.includes(value.toLowerCase())) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'one of: debug, info, warn, error, fatal'
      );
    }
    
    return value.toLowerCase() as 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  };
}

/**
 * Creates a validator function for a required feature flags environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required feature flags environment variable
 * const validateFeatureFlags = createFeatureFlagsValidator('FEATURE_FLAGS');
 * 
 * // Use the validator
 * const featureFlags = validateFeatureFlags(); // Throws if FEATURE_FLAGS is missing or invalid
 */
export function createFeatureFlagsValidator(variableName: string): () => Record<string, boolean> {
  return () => {
    const value = process.env[variableName];
    
    if (value === undefined) {
      throw new InvalidEnvironmentVariableError(
        variableName,
        undefined,
        'a JSON object with boolean values'
      );
    }
    
    try {
      const parsedValue = parseJson(value);
      
      if (typeof parsedValue !== 'object' || parsedValue === null) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          'a JSON object with boolean values'
        );
      }
      
      const result: Record<string, boolean> = {};
      
      for (const [key, val] of Object.entries(parsedValue)) {
        if (typeof val !== 'boolean') {
          throw new InvalidEnvironmentVariableError(
            variableName,
            value,
            `a JSON object with boolean values (${key} is not a boolean)`
          );
        }
        
        result[key] = val;
      }
      
      return result;
    } catch (error) {
      if (error instanceof InvalidEnvironmentVariableError) {
        throw error;
      }
      
      if (error instanceof Error) {
        throw new InvalidEnvironmentVariableError(
          variableName,
          value,
          `a valid JSON object: ${error.message}`
        );
      }
      
      throw new InvalidEnvironmentVariableError(
        variableName,
        value,
        'a valid JSON object with boolean values'
      );
    }
  };
}

/**
 * Creates a validator function for a required journey configuration environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required journey configuration environment variable
 * const validateJourneyConfig = createJourneyConfigValidator('JOURNEY_CONFIG');
 * 
 * // Use the validator
 * const journeyConfig = validateJourneyConfig(); // Throws if JOURNEY_CONFIG is missing or invalid
 */
export function createJourneyConfigValidator(variableName: string): () => {
  health: { enabled: boolean; features?: string[] };
  care: { enabled: boolean; features?: string[] };
  plan: { enabled: boolean; features?: string[] };
} {
  const journeySchema = z.object({
    enabled: z.boolean(),
    features: z.array(z.string()).optional()
  });
  
  const schema = z.object({
    health: journeySchema,
    care: journeySchema,
    plan: journeySchema
  });
  
  return createJsonValidator(variableName, schema);
}

/**
 * Creates a validator function for a required database connection pool configuration environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required database connection pool configuration environment variable
 * const validateDbPoolConfig = createDbPoolConfigValidator('DB_POOL_CONFIG');
 * 
 * // Use the validator
 * const dbPoolConfig = validateDbPoolConfig(); // Throws if DB_POOL_CONFIG is missing or invalid
 */
export function createDbPoolConfigValidator(variableName: string): () => {
  min: number;
  max: number;
  idle: number;
} {
  const schema = z.object({
    min: z.number().int().min(1),
    max: z.number().int().min(1),
    idle: z.number().int().min(1000)
  }).refine(data => data.min <= data.max, {
    message: 'min must be less than or equal to max',
    path: ['min']
  });
  
  return createJsonValidator(variableName, schema);
}

/**
 * Creates a validator function for a required retry policy configuration environment variable
 * 
 * @param variableName - The name of the environment variable to validate
 * @returns A function that validates the environment variable
 * @throws InvalidEnvironmentVariableError if validation fails
 * 
 * @example
 * // Create a validator for a required retry policy configuration environment variable
 * const validateRetryPolicy = createRetryPolicyValidator('RETRY_POLICY');
 * 
 * // Use the validator
 * const retryPolicy = validateRetryPolicy(); // Throws if RETRY_POLICY is missing or invalid
 */
export function createRetryPolicyValidator(variableName: string): () => {
  attempts: number;
  delay: number;
  backoff: number;
  maxDelay?: number;
} {
  const schema = z.object({
    attempts: z.number().int().min(1),
    delay: z.number().int().min(1),
    backoff: z.number().min(1),
    maxDelay: z.number().int().min(1).optional()
  });
  
  return createJsonValidator(variableName, schema);
}

/**
 * Validates a group of related environment variables
 * 
 * @param validators - An object mapping variable names to validator functions
 * @param contextMessage - Optional context message explaining the validation scope
 * @throws BatchEnvironmentValidationError if any validations fail
 * 
 * @example
 * // Validate a group of related environment variables
 * validateEnvironmentGroup({
 *   PORT: createPortValidator('PORT'),
 *   HOST: createHostValidator('HOST'),
 *   NODE_ENV: createEnvironmentValidator('NODE_ENV')
 * }, 'Server configuration');
 */
export function validateEnvironmentGroup(
  validators: Record<string, () => any>,
  contextMessage?: string
): Record<string, any> {
  const validationFns: (() => void)[] = [];
  const results: Record<string, any> = {};
  
  for (const [name, validator] of Object.entries(validators)) {
    validationFns.push(() => {
      results[name] = validator();
    });
  }
  
  validateEnvironmentBatch(validationFns, contextMessage);
  
  return results;
}

/**
 * Validates all environment variables required for a service to start
 * 
 * @param validators - An object mapping variable names to validator functions
 * @throws Error if any validations fail, with a detailed error message
 * 
 * @example
 * // Validate all environment variables required for a service to start
 * validateServiceEnvironment({
 *   PORT: createPortValidator('PORT'),
 *   HOST: createHostValidator('HOST'),
 *   NODE_ENV: createEnvironmentValidator('NODE_ENV'),
 *   DATABASE_URL: createDatabaseUrlValidator('DATABASE_URL'),
 *   REDIS_URL: createRedisUrlValidator('REDIS_URL'),
 *   KAFKA_BROKERS: createKafkaBrokersValidator('KAFKA_BROKERS'),
 *   JWT_SECRET: createJwtSecretValidator('JWT_SECRET'),
 *   LOG_LEVEL: createLogLevelValidator('LOG_LEVEL')
 * });
 */
export function validateServiceEnvironment(
  validators: Record<string, () => any>
): Record<string, any> {
  try {
    return validateEnvironmentGroup(validators, 'Service environment validation');
  } catch (error) {
    if (error instanceof BatchEnvironmentValidationError) {
      console.error('Service environment validation failed:');
      console.error(error.getDetailedMessage());
      
      throw new Error(
        `Service cannot start due to ${error.errors.length} environment configuration errors. ` +
        'See logs for details.'
      );
    }
    
    throw error;
  }
}

/**
 * Validates a journey-specific environment configuration
 * 
 * @param journeyName - The name of the journey (health, care, plan)
 * @param validators - An object mapping variable names to validator functions
 * @throws Error if any validations fail, with a detailed error message
 * 
 * @example
 * // Validate environment variables for the health journey
 * validateJourneyEnvironment('health', {
 *   HEALTH_API_KEY: createApiKeyValidator('HEALTH_API_KEY'),
 *   HEALTH_SERVICE_URL: createUrlValidator('HEALTH_SERVICE_URL'),
 *   HEALTH_FEATURES: createFeatureFlagsValidator('HEALTH_FEATURES')
 * });
 */
export function validateJourneyEnvironment(
  journeyName: 'health' | 'care' | 'plan',
  validators: Record<string, () => any>
): Record<string, any> {
  try {
    return validateEnvironmentGroup(
      validators,
      `${journeyName.charAt(0).toUpperCase() + journeyName.slice(1)} journey environment validation`
    );
  } catch (error) {
    if (error instanceof BatchEnvironmentValidationError) {
      console.error(`${journeyName} journey environment validation failed:`);
      console.error(error.getDetailedMessage());
      
      throw new Error(
        `${journeyName} journey cannot start due to ${error.errors.length} environment configuration errors. ` +
        'See logs for details.'
      );
    }
    
    throw error;
  }
}