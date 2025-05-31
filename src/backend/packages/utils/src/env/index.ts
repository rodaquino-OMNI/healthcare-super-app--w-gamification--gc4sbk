/**
 * Environment Variable Utilities
 * 
 * This module provides a comprehensive set of utilities for managing environment variables
 * across all microservices in the AUSTA SuperApp. It enables consistent access, validation,
 * and transformation of environment variables with strong typing and proper error handling.
 * 
 * @module env
 * 
 * @example Basic Usage
 * ```typescript
 * import { getEnv, getRequiredEnv, getOptionalEnv } from '@austa/utils/env';
 * 
 * // Get environment variable with type conversion
 * const port = getEnv<number>('PORT', {
 *   transform: value => parseInt(value, 10),
 *   validate: value => value > 0 && value < 65536
 * });
 * 
 * // Get required environment variable (throws if missing)
 * const apiKey = getRequiredEnv('API_KEY');
 * 
 * // Get optional environment variable with default
 * const logLevel = getOptionalEnv('LOG_LEVEL', 'info');
 * ```
 * 
 * @example Type-Specific Accessors
 * ```typescript
 * import { getBooleanEnv, getNumberEnv, getArrayEnv, getJsonEnv } from '@austa/utils/env';
 * 
 * // Get boolean environment variable
 * const isDebug = getBooleanEnv('DEBUG');
 * 
 * // Get numeric environment variable with range validation
 * const maxConnections = getNumberEnv('MAX_CONNECTIONS', { min: 1, max: 100 });
 * 
 * // Get array environment variable
 * const allowedOrigins = getArrayEnv('ALLOWED_ORIGINS');
 * 
 * // Get JSON environment variable
 * const config = getJsonEnv('APP_CONFIG');
 * ```
 * 
 * @example Journey-Specific Environment Variables
 * ```typescript
 * import { getJourneyEnv, healthEnv, careEnv, planEnv } from '@austa/utils/env';
 * 
 * // Get journey-specific environment variable
 * const healthApiUrl = getJourneyEnv('health', 'API_URL');
 * 
 * // Using pre-configured journey helpers
 * const maxAppointments = careEnv.getNumber('MAX_APPOINTMENTS');
 * const isFeatureEnabled = healthEnv.isFeatureEnabled('NEW_METRICS_UI');
 * const planConfig = planEnv.getJson('COVERAGE_CONFIG');
 * ```
 * 
 * @example Validation
 * ```typescript
 * import { validateEnv, validateUrl, validateNumber, validateEnvBatch } from '@austa/utils/env';
 * 
 * // Validate a URL environment variable
 * const apiUrl = validateUrl('API_URL', { protocols: ['https:'] });
 * 
 * // Validate a numeric environment variable
 * const timeout = validateNumber('TIMEOUT', { min: 1000, max: 30000 });
 * 
 * // Batch validation
 * const config = validateEnvBatch({
 *   validators: {
 *     apiUrl: () => validateUrl('API_URL'),
 *     timeout: () => validateNumber('TIMEOUT'),
 *     apiKey: () => validateString('API_KEY')
 *   }
 * });
 * ```
 * 
 * @example Error Handling
 * ```typescript
 * import { withEnvErrorFallback, collectEnvErrors } from '@austa/utils/env';
 * 
 * // Use fallback value if environment variable is missing or invalid
 * const port = withEnvErrorFallback(
 *   () => getNumberEnv('PORT'),
 *   3000,
 *   (error) => console.warn(`Using default port: ${error.message}`)
 * );
 * 
 * // Collect all environment errors instead of throwing immediately
 * const errors = collectEnvErrors([
 *   () => validateRequiredEnv(['API_KEY', 'DATABASE_URL']),
 *   () => validateUrl('API_URL')
 * ]);
 * ```
 * 
 * @example Transformation
 * ```typescript
 * import { parseBoolean, parseNumber, parseArray, parseJson } from '@austa/utils/env';
 * 
 * // Parse boolean from string
 * const isEnabled = parseBoolean(process.env.FEATURE_ENABLED);
 * 
 * // Parse number with range validation
 * const limit = parseNumber(process.env.LIMIT, { min: 0, max: 100 });
 * 
 * // Parse array with custom delimiter
 * const tags = parseArray(process.env.TAGS, { delimiter: ',' });
 * 
 * // Parse JSON with schema validation
 * const config = parseJson(process.env.CONFIG);
 * ```
 */

// Re-export all types
export * from './types';

// Re-export core environment variable access functions
export {
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  getNamespacedEnv,
  getRequiredNamespacedEnv,
  getOptionalNamespacedEnv,
  getBooleanEnv,
  getNumberEnv,
  getArrayEnv,
  getJsonEnv,
  getUrlEnv,
  getEnumEnv,
  getFeatureFlag,
  getJourneyEnv,
  getRequiredJourneyEnv,
  getOptionalJourneyEnv,
  getJourneyFeatureFlag,
  getAllEnvWithPrefix,
  getAllJourneyEnv,
  validateRequiredEnv,
  validateRequiredJourneyEnv,
  clearEnvCache
} from './config';

// Re-export error classes and utilities
export {
  EnvironmentVariableError,
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError,
  EnvironmentVariableTypeError,
  EnvironmentVariableValidationError,
  EnvironmentVariableBatchError,
  withEnvErrorFallback,
  collectEnvErrors,
  validateEnvBatch as validateEnvErrorBatch
} from './error';

// Re-export transformation utilities
export {
  parseBoolean,
  parseNumber,
  parseArray,
  parseJson,
  parseUrl,
  parseRange,
  parseEnum
} from './transform';

// Re-export validation utilities
export {
  EnvValidationError,
  validateWithSchema,
  validateEnv,
  validateString,
  validateNumber,
  validateBoolean,
  validateUrl,
  validateEnum,
  validateList,
  validateJson,
  validateEnvBatch,
  conditional,
  dependsOn,
  transform,
  validateRequiredEnvVars,
  validateSecureUrl,
  validatePort,
  validateDatabaseUrl,
  validateRedisUrl,
  validateKafkaUrl,
  validateApiKey,
  validateJwtSecret,
  validateEnvironment,
  validateLogLevel
} from './validation';

// Re-export journey-specific utilities
export {
  JourneyType,
  MissingJourneyEnvError,
  formatJourneyEnvName,
  getJourneyEnv as getJourneyVariable,
  getJourneyEnvBool,
  getJourneyEnvNumber,
  getJourneyEnvJson,
  isFeatureEnabled,
  getAllJourneyEnvs,
  createJourneyEnvConfig,
  healthEnv,
  careEnv,
  planEnv,
  sharedEnv
} from './journey';

/**
 * Initializes the environment validation for an application
 * 
 * This function validates all required environment variables and sets up
 * proper error handling for the application startup. It should be called
 * early in the application lifecycle, typically before any services are started.
 * 
 * @param options - Configuration options for environment initialization
 * @param options.requiredVars - Array of required environment variable names
 * @param options.journeyRequiredVars - Map of journey-specific required variables
 * @param options.validators - Custom validation functions to run
 * @param options.failFast - Whether to exit the process on validation failure
 * @returns True if all validations pass
 */
export function initializeEnvironment(options: {
  requiredVars?: string[];
  journeyRequiredVars?: Record<string, string[]>;
  validators?: Array<() => void>;
  failFast?: boolean;
} = {}): boolean {
  const { requiredVars = [], journeyRequiredVars = {}, validators = [], failFast = true } = options;
  
  try {
    // Validate global required variables
    if (requiredVars.length > 0) {
      validateRequiredEnv(requiredVars);
    }
    
    // Validate journey-specific required variables
    Object.entries(journeyRequiredVars).forEach(([journey, vars]) => {
      validateRequiredJourneyEnv(journey, vars);
    });
    
    // Run custom validators
    if (validators.length > 0) {
      collectEnvErrors(validators, failFast);
    }
    
    return true;
  } catch (error) {
    if (error instanceof EnvironmentVariableError || error instanceof EnvValidationError) {
      console.error('Environment validation failed:');
      console.error(error.message);
      
      if (error instanceof EnvironmentVariableBatchError) {
        console.error(error.getFormattedErrors());
      }
    } else {
      console.error('Unexpected error during environment validation:', error);
    }
    
    if (failFast) {
      console.error('Exiting due to environment validation failure');
      process.exit(1);
    }
    
    return false;
  }
}