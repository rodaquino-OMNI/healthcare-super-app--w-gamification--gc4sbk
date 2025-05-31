/**
 * Environment Variable Validation Utilities
 * 
 * This module provides schema-based validation for configuration values,
 * enabling services to ensure environment variables meet required formats and constraints.
 * Prevents runtime failures due to misconfiguration by enforcing validation at application startup.
 */

import { z } from 'zod';
import { URL } from 'url';

/**
 * Error thrown when environment variable validation fails
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: Record<string, string[]>,
    public readonly envName?: string
  ) {
    super(message);
    this.name = 'EnvValidationError';
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }

  /**
   * Returns a formatted string representation of all validation errors
   */
  public formatErrors(): string {
    const lines = Object.entries(this.errors).map(([key, errors]) => {
      return `  ${key}:\n${errors.map(err => `    - ${err}`).join('\n')}`;
    });
    
    return `Environment validation failed with the following errors:\n${lines.join('\n')}`;
  }
}

/**
 * Options for environment variable validation
 */
export interface ValidationOptions {
  /** Whether to throw an error if the environment variable is not defined */
  required?: boolean;
  /** Default value to use if the environment variable is not defined */
  defaultValue?: string;
  /** Custom error message to use if validation fails */
  errorMessage?: string;
  /** Description of the environment variable for documentation */
  description?: string;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult<T> {
  /** Whether the validation was successful */
  success: boolean;
  /** The validated value if successful */
  value?: T;
  /** Error messages if validation failed */
  errors?: string[];
}

/**
 * Type for a validation function that validates a string value against a schema
 */
export type Validator<T> = (value: string, options?: ValidationOptions) => ValidationResult<T>;

/**
 * Validates a string value against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @param value - String value to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  value: string | undefined,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const { required = true, defaultValue, errorMessage } = options;

  // Handle undefined values
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return validateWithSchema(schema, defaultValue, options);
    }
    
    if (required) {
      return {
        success: false,
        errors: [errorMessage || 'Environment variable is required but not defined']
      };
    }
    
    // If not required and no default, return success with undefined
    return { success: true };
  }

  // Validate with schema
  const result = schema.safeParse(value);
  
  if (result.success) {
    return {
      success: true,
      value: result.data
    };
  }
  
  // Format errors from Zod
  const errors = result.error.errors.map(err => {
    return errorMessage || `${err.message}${err.path.length ? ` at ${err.path.join('.')}` : ''}`;
  });
  
  return {
    success: false,
    errors
  };
}

/**
 * Validates an environment variable against a schema
 * 
 * @param envName - Name of the environment variable
 * @param schema - Zod schema to validate against
 * @param options - Validation options
 * @returns Validated value
 * @throws EnvValidationError if validation fails
 */
export function validateEnv<T>(
  envName: string,
  schema: z.ZodType<T>,
  options: ValidationOptions = {}
): T | undefined {
  const value = process.env[envName];
  const result = validateWithSchema(schema, value, options);
  
  if (!result.success && result.errors) {
    throw new EnvValidationError(
      `Validation failed for environment variable ${envName}`,
      { [envName]: result.errors },
      envName
    );
  }
  
  return result.value;
}

/**
 * Validates a string environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated string value
 */
export function validateString(
  envName: string,
  options: ValidationOptions & { minLength?: number; maxLength?: number; pattern?: RegExp } = {}
): string | undefined {
  const { minLength, maxLength, pattern, ...baseOptions } = options;
  
  let schema = z.string();
  
  if (minLength !== undefined) {
    schema = schema.min(minLength, `String must be at least ${minLength} characters long`);
  }
  
  if (maxLength !== undefined) {
    schema = schema.max(maxLength, `String must be at most ${maxLength} characters long`);
  }
  
  if (pattern !== undefined) {
    schema = schema.regex(pattern, 'String does not match required pattern');
  }
  
  return validateEnv(envName, schema, baseOptions);
}

/**
 * Validates a numeric environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated number value
 */
export function validateNumber(
  envName: string,
  options: ValidationOptions & { min?: number; max?: number; integer?: boolean } = {}
): number | undefined {
  const { min, max, integer = false, ...baseOptions } = options;
  
  let schema = z.coerce.number();
  
  if (integer) {
    schema = schema.int('Value must be an integer');
  }
  
  if (min !== undefined) {
    schema = schema.min(min, `Value must be at least ${min}`);
  }
  
  if (max !== undefined) {
    schema = schema.max(max, `Value must be at most ${max}`);
  }
  
  return validateEnv(envName, schema, baseOptions);
}

/**
 * Validates a boolean environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated boolean value
 */
export function validateBoolean(
  envName: string,
  options: ValidationOptions = {}
): boolean | undefined {
  const schema = z.union([
    z.literal('true').transform(() => true),
    z.literal('false').transform(() => false),
    z.literal('1').transform(() => true),
    z.literal('0').transform(() => false),
    z.literal('yes').transform(() => true),
    z.literal('no').transform(() => false),
  ]).catch(undefined);
  
  return validateEnv(envName, schema, options);
}

/**
 * Validates a URL environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated URL value
 */
export function validateUrl(
  envName: string,
  options: ValidationOptions & { protocols?: string[]; requireTld?: boolean } = {}
): URL | undefined {
  const { protocols = ['http:', 'https:'], requireTld = true, ...baseOptions } = options;
  
  const schema = z.string().refine(
    (value) => {
      try {
        const url = new URL(value);
        if (protocols.length > 0 && !protocols.includes(url.protocol)) {
          return false;
        }
        if (requireTld && !url.hostname.includes('.')) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    },
    {
      message: `Invalid URL. ${protocols.length > 0 ? `Must use one of these protocols: ${protocols.join(', ')}. ` : ''}${requireTld ? 'Must include a valid domain with TLD.' : ''}`
    }
  ).transform(value => new URL(value));
  
  return validateEnv(envName, schema, baseOptions);
}

/**
 * Validates an enum environment variable
 * 
 * @param envName - Name of the environment variable
 * @param values - Allowed enum values
 * @param options - Validation options
 * @returns Validated enum value
 */
export function validateEnum<T extends string>(
  envName: string,
  values: readonly T[],
  options: ValidationOptions = {}
): T | undefined {
  const schema = z.enum([...values as any] as [T, ...T[]]);
  return validateEnv(envName, schema, {
    errorMessage: `Value must be one of: ${values.join(', ')}`,
    ...options
  });
}

/**
 * Validates a comma-separated list environment variable
 * 
 * @param envName - Name of the environment variable
 * @param itemSchema - Schema for individual items in the list
 * @param options - Validation options
 * @returns Validated list of values
 */
export function validateList<T>(
  envName: string,
  itemSchema: z.ZodType<T>,
  options: ValidationOptions & { separator?: string; minItems?: number; maxItems?: number } = {}
): T[] | undefined {
  const { separator = ',', minItems, maxItems, ...baseOptions } = options;
  
  let schema = z.string()
    .transform(str => str.split(separator).map(item => item.trim()).filter(Boolean))
    .transform(items => {
      const results = items.map(item => itemSchema.safeParse(item));
      const success = results.every(result => result.success);
      
      if (success) {
        return items.map((_, index) => (results[index] as z.SafeParseSuccess<T>).data);
      }
      
      throw new Error(
        results
          .map((result, index) => !result.success ? `Item at index ${index}: ${result.error.message}` : null)
          .filter(Boolean)
          .join('; ')
      );
    });
  
  if (minItems !== undefined) {
    schema = schema.refine(
      items => items.length >= minItems,
      `List must contain at least ${minItems} items`
    );
  }
  
  if (maxItems !== undefined) {
    schema = schema.refine(
      items => items.length <= maxItems,
      `List must contain at most ${maxItems} items`
    );
  }
  
  return validateEnv(envName, schema, baseOptions);
}

/**
 * Validates a JSON environment variable
 * 
 * @param envName - Name of the environment variable
 * @param schema - Schema for the parsed JSON
 * @param options - Validation options
 * @returns Validated JSON value
 */
export function validateJson<T>(
  envName: string,
  schema: z.ZodType<T>,
  options: ValidationOptions = {}
): T | undefined {
  const jsonSchema = z.string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON format'
        });
        return z.NEVER;
      }
    })
    .pipe(schema);
  
  return validateEnv(envName, jsonSchema, options);
}

/**
 * Configuration for batch validation
 */
export interface BatchValidationConfig {
  /** Map of environment variable names to their validators */
  validators: Record<string, () => any>;
  /** Whether to throw on first error or collect all errors */
  throwOnFirstError?: boolean;
}

/**
 * Validates multiple environment variables in a batch
 * 
 * @param config - Batch validation configuration
 * @returns Object with validated values
 * @throws EnvValidationError if validation fails
 */
export function validateEnvBatch<T extends Record<string, () => any>>(
  config: BatchValidationConfig
): { [K in keyof T]: ReturnType<T[K]> } {
  const { validators, throwOnFirstError = false } = config;
  const result: Record<string, any> = {};
  const errors: Record<string, string[]> = {};
  
  for (const [key, validator] of Object.entries(validators)) {
    try {
      result[key] = validator();
    } catch (error) {
      if (error instanceof EnvValidationError) {
        Object.assign(errors, error.errors);
        
        if (throwOnFirstError) {
          throw new EnvValidationError(
            'Environment validation failed',
            errors
          );
        }
      } else {
        throw error;
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    throw new EnvValidationError(
      'Environment validation failed',
      errors
    );
  }
  
  return result as any;
}

/**
 * Creates a conditional validator that only runs if a condition is met
 * 
 * @param condition - Function that determines if validation should run
 * @param validator - Validator function to run if condition is met
 * @param options - Options for when condition is not met
 * @returns Conditional validator function
 */
export function conditional<T>(
  condition: () => boolean,
  validator: () => T,
  options: { defaultValue?: T } = {}
): () => T | undefined {
  return () => {
    if (condition()) {
      return validator();
    }
    return options.defaultValue;
  };
}

/**
 * Creates a validator that depends on another environment variable
 * 
 * @param dependsOn - Function that returns the value this validator depends on
 * @param validatorFactory - Function that creates a validator based on the dependency
 * @returns Dependent validator function
 */
export function dependsOn<D, T>(
  dependsOn: () => D,
  validatorFactory: (dependencyValue: D) => () => T
): () => T | undefined {
  return () => {
    const dependencyValue = dependsOn();
    if (dependencyValue === undefined) {
      return undefined;
    }
    return validatorFactory(dependencyValue)();
  };
}

/**
 * Creates a validator that transforms the result of another validator
 * 
 * @param validator - Base validator function
 * @param transform - Function to transform the validated value
 * @returns Transformed validator function
 */
export function transform<T, R>(
  validator: () => T,
  transform: (value: T) => R
): () => R | undefined {
  return () => {
    const value = validator();
    if (value === undefined) {
      return undefined;
    }
    return transform(value);
  };
}

/**
 * Validates that required environment variables are present for a specific environment
 * 
 * @param envName - Name of the NODE_ENV environment variable
 * @param requiredVars - Map of environment names to required variables for each
 * @returns Validation result
 */
export function validateRequiredEnvVars(
  envName: string = 'NODE_ENV',
  requiredVars: Record<string, string[]> = {}
): boolean {
  const currentEnv = process.env[envName] || 'development';
  const varsToCheck = requiredVars[currentEnv] || [];
  
  const missingVars = varsToCheck.filter(varName => {
    return process.env[varName] === undefined;
  });
  
  if (missingVars.length > 0) {
    throw new EnvValidationError(
      `Missing required environment variables for ${currentEnv} environment`,
      { [currentEnv]: missingVars.map(v => `Missing required variable: ${v}`) }
    );
  }
  
  return true;
}

/**
 * Creates a secure URL validator that blocks private IP ranges
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated secure URL
 */
export function validateSecureUrl(
  envName: string,
  options: ValidationOptions = {}
): URL | undefined {
  const url = validateUrl(envName, {
    protocols: ['https:'],
    ...options
  });
  
  if (url) {
    const hostname = url.hostname;
    
    // Block private IP ranges
    if (
      /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.|0\.0\.0\.0|localhost)/.test(hostname) ||
      hostname === '::1' ||
      hostname === 'fe80::' ||
      hostname.endsWith('.local')
    ) {
      throw new EnvValidationError(
        `Insecure URL detected for ${envName}`,
        { [envName]: ['URL points to a private or local network address, which is not allowed for security reasons'] },
        envName
      );
    }
  }
  
  return url;
}

/**
 * Validates a port number environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated port number
 */
export function validatePort(
  envName: string,
  options: ValidationOptions = {}
): number | undefined {
  return validateNumber(envName, {
    integer: true,
    min: 1,
    max: 65535,
    errorMessage: 'Port must be an integer between 1 and 65535',
    ...options
  });
}

/**
 * Validates a database connection string
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated connection string
 */
export function validateDatabaseUrl(
  envName: string,
  options: ValidationOptions & { dialect?: 'postgres' | 'mysql' | 'mongodb' } = {}
): string | undefined {
  const { dialect, ...baseOptions } = options;
  
  let pattern: RegExp;
  let errorMessage: string;
  
  switch (dialect) {
    case 'postgres':
      pattern = /^postgres(?:ql)?:\/\/.+:.+@.+:\d+\/.+$/;
      errorMessage = 'Invalid PostgreSQL connection string. Format should be: postgresql://user:password@host:port/database';
      break;
    case 'mysql':
      pattern = /^mysql:\/\/.+:.+@.+:\d+\/.+$/;
      errorMessage = 'Invalid MySQL connection string. Format should be: mysql://user:password@host:port/database';
      break;
    case 'mongodb':
      pattern = /^mongodb(?:\+srv)?:\/\/.+/;
      errorMessage = 'Invalid MongoDB connection string. Format should be: mongodb://user:password@host:port/database or mongodb+srv://user:password@host/database';
      break;
    default:
      pattern = /^[a-z]+:\/\/.+/;
      errorMessage = 'Invalid database connection string. Should start with a protocol (e.g., postgresql://, mysql://, mongodb://)';
  }
  
  return validateString(envName, {
    pattern,
    errorMessage,
    ...baseOptions
  });
}

/**
 * Validates a Redis connection string
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated Redis connection string
 */
export function validateRedisUrl(
  envName: string,
  options: ValidationOptions = {}
): string | undefined {
  return validateString(envName, {
    pattern: /^redis:\/\/.+/,
    errorMessage: 'Invalid Redis connection string. Format should be: redis://[[user]:password@]host[:port][/database]',
    ...options
  });
}

/**
 * Validates a Kafka connection string
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated Kafka connection string
 */
export function validateKafkaUrl(
  envName: string,
  options: ValidationOptions = {}
): string | undefined {
  return validateString(envName, {
    pattern: /^(kafka:\/\/|\w+:\d+(,\w+:\d+)*)/,
    errorMessage: 'Invalid Kafka connection string. Format should be: kafka://host:port or host:port,host:port',
    ...options
  });
}

/**
 * Validates an API key environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated API key
 */
export function validateApiKey(
  envName: string,
  options: ValidationOptions & { minLength?: number; pattern?: RegExp } = {}
): string | undefined {
  const { minLength = 16, pattern, ...baseOptions } = options;
  
  return validateString(envName, {
    minLength,
    pattern: pattern || /^[A-Za-z0-9_\-]+$/,
    errorMessage: `API key must be at least ${minLength} characters long and contain only alphanumeric characters, underscores, and hyphens`,
    ...baseOptions
  });
}

/**
 * Validates a JWT secret environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated JWT secret
 */
export function validateJwtSecret(
  envName: string,
  options: ValidationOptions = {}
): string | undefined {
  return validateString(envName, {
    minLength: 32,
    errorMessage: 'JWT secret must be at least 32 characters long for security',
    ...options
  });
}

/**
 * Validates an environment name
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated environment name
 */
export function validateEnvironment(
  envName: string = 'NODE_ENV',
  options: ValidationOptions & { allowedValues?: string[] } = {}
): string | undefined {
  const { allowedValues = ['development', 'test', 'staging', 'production'], ...baseOptions } = options;
  
  return validateEnum(envName, allowedValues as [string, ...string[]], {
    defaultValue: 'development',
    ...baseOptions
  });
}

/**
 * Validates a log level environment variable
 * 
 * @param envName - Name of the environment variable
 * @param options - Validation options
 * @returns Validated log level
 */
export function validateLogLevel(
  envName: string,
  options: ValidationOptions & { allowedValues?: string[] } = {}
): string | undefined {
  const { allowedValues = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'], ...baseOptions } = options;
  
  return validateEnum(envName, allowedValues as [string, ...string[]], {
    defaultValue: 'info',
    ...baseOptions
  });
}