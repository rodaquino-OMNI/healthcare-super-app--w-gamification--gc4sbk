/**
 * Environment Variable Management System
 * 
 * This module provides a comprehensive set of utilities for accessing, validating,
 * and transforming environment variables across all microservices in the AUSTA SuperApp.
 * It enables consistent environment handling throughout the application with strong typing,
 * validation, and journey-specific configuration.
 * 
 * @module env
 */

/**
 * Core Environment Variable Access
 * 
 * Functions for retrieving environment variables with type conversion, validation,
 * and error handling.
 * 
 * @example
 * // Get a required environment variable
 * const port = getRequiredEnv('PORT', 'number');
 * 
 * // Get an optional environment variable with default value
 * const debug = getOptionalEnv('DEBUG', 'boolean', false);
 * 
 * // Get a journey-specific environment variable
 * const apiKey = getJourneyEnv('health', 'API_KEY', 'string');
 */
export {
  // Core environment variable access functions
  getEnv,
  getRequiredEnv,
  getOptionalEnv,
  clearEnvCache,
  getNamespacedEnv,
  validateRequiredEnv,
  
  // Type-specific convenience functions
  getBooleanEnv,
  getOptionalBooleanEnv,
  getNumberEnv,
  getOptionalNumberEnv,
  getJsonEnv,
  getOptionalJsonEnv,
  getArrayEnv,
  getOptionalArrayEnv,
  
  // Journey-specific environment functions
  getJourneyEnv as getJourneyTypedEnv,
  getOptionalJourneyEnv,
  
  // Feature flag functions
  getFeatureFlag,
  
  // Error classes
  MissingEnvironmentVariableError,
  InvalidEnvironmentVariableError
} from './config';

/**
 * Environment Variable Transformation
 * 
 * Utilities for converting string-based environment variables to strongly-typed values
 * with comprehensive error handling.
 * 
 * @example
 * // Parse a boolean value
 * const enabled = parseBoolean(process.env.FEATURE_ENABLED || 'false');
 * 
 * // Parse a number value
 * const timeout = parseNumber(process.env.TIMEOUT || '30000');
 * 
 * // Parse an array value
 * const allowedOrigins = parseArray(process.env.ALLOWED_ORIGINS || '');
 */
export {
  // String to boolean conversion
  parseBoolean,
  
  // String to number conversion
  parseNumber,
  
  // String to array conversion
  parseArray,
  parseNumberArray,
  
  // String to object conversion
  parseJson,
  parseCSV,
  
  // String to specialized types conversion
  parseRange,
  isInRange,
  parseUrl,
  parseEnum,
  parseDuration,
  parseMemorySize,
  
  // Generic transformation
  transform
} from './transform';

/**
 * Environment Variable Validation
 * 
 * Schema-based validation for configuration values to ensure environment variables
 * meet required formats and constraints.
 * 
 * @example
 * // Create a validator for a required port environment variable
 * const validatePort = createPortValidator('PORT');
 * 
 * // Use the validator
 * const port = validatePort(); // Throws if PORT is missing or invalid
 * 
 * // Validate a group of related environment variables
 * const config = validateEnvironmentGroup({
 *   PORT: createPortValidator('PORT'),
 *   HOST: createHostValidator('HOST'),
 *   NODE_ENV: createEnvironmentValidator('NODE_ENV')
 * }, 'Server configuration');
 */
export {
  // Zod-based validators
  createZodValidator,
  createZodValidatorWithDefault,
  
  // Type-specific validators
  createStringValidator,
  createNumberValidator,
  createBooleanValidator,
  createUrlValidator,
  createArrayValidator,
  createJsonValidator,
  createEnumValidator,
  createDurationValidator,
  createPortValidator,
  createHostValidator,
  
  // Domain-specific validators
  createDatabaseUrlValidator,
  createApiKeyValidator,
  createJwtSecretValidator,
  createEnvironmentValidator,
  createRedisUrlValidator,
  createKafkaBrokersValidator,
  createCorsOriginsValidator,
  createLogLevelValidator,
  createFeatureFlagsValidator,
  createJourneyConfigValidator,
  createDbPoolConfigValidator,
  createRetryPolicyValidator,
  
  // Batch validation
  validateEnvironmentGroup,
  validateServiceEnvironment,
  validateJourneyEnvironment
} from './validation';

/**
 * Journey-Specific Configuration
 * 
 * Utilities for managing environment variables in a journey-specific context,
 * enabling separation and isolation of configuration between different journeys.
 * 
 * @example
 * // Get a journey-specific environment variable
 * const apiUrl = getJourneyEnv(JourneyType.HEALTH, 'API_URL');
 * 
 * // Check if a feature is enabled for a specific journey
 * const isEnabled = isFeatureEnabled(JourneyType.CARE, 'TELEMEDICINE');
 * 
 * // Get all environment variables for a journey
 * const healthConfig = getAllJourneyEnvs(JourneyType.HEALTH);
 */
export {
  // Journey types
  JourneyType,
  
  // Journey-specific environment functions
  getJourneyEnvName,
  getJourneyEnv,
  getRequiredJourneyEnv,
  clearEnvCache as clearJourneyEnvCache,
  
  // Feature flag functions
  getJourneyFeatureFlag,
  isFeatureEnabled,
  isFeatureEnabledForUser,
  
  // Cross-journey sharing
  getSharedJourneyEnv,
  getRequiredSharedJourneyEnv,
  getAllJourneyEnvs,
  
  // Types
  JourneyFeatureFlag,
  CrossJourneyConfig
} from './journey';

/**
 * Error Handling
 * 
 * Specialized error classes and utilities for handling environment configuration issues.
 * 
 * @example
 * // Handle environment variable errors with fallback
 * const port = withEnvErrorFallback(
 *   () => getRequiredEnv('PORT', 'number'),
 *   3000,
 *   (error) => console.error('Using default port:', error.message)
 * );
 * 
 * // Validate multiple environment variables and aggregate errors
 * try {
 *   validateEnvironmentBatch([
 *     () => getRequiredEnv('API_KEY', 'string'),
 *     () => getRequiredEnv('DATABASE_URL', 'string')
 *   ], 'API configuration');
 * } catch (error) {
 *   if (error instanceof BatchEnvironmentValidationError) {
 *     console.error(error.getDetailedMessage());
 *   }
 * }
 */
export {
  // Error classes
  EnvironmentVariableError,
  MissingEnvironmentVariableError as EnvMissingError,
  InvalidEnvironmentVariableError as EnvInvalidError,
  ValidationEnvironmentVariableError as EnvValidationError,
  TransformEnvironmentVariableError as EnvTransformError,
  BatchEnvironmentValidationError as EnvBatchError,
  
  // Error utilities
  formatErrorMessage,
  withEnvErrorFallback,
  validateEnvironmentBatch,
  createRequiredEnvValidator,
  
  // Error categorization
  EnvironmentErrorCategory,
  categorizeEnvironmentError
} from './error';

/**
 * Type Definitions
 * 
 * TypeScript type definitions for the environment variables system.
 * 
 * @example
 * // Define an environment schema
 * const envSchema: EnvSchema = {
 *   PORT: { type: 'number', required: true, description: 'Server port' },
 *   API_KEY: { type: 'string', required: true, description: 'API key for external service' },
 *   DEBUG: { type: 'boolean', required: false, defaultValue: 'false', description: 'Enable debug mode' }
 * };
 * 
 * // Type guard usage
 * if (isNumber(value)) {
 *   // value is a number
 * }
 */
export {
  // Type definitions
  EnvVarType,
  EnvVarTypeMap,
  EnvAccessor,
  EnvValidator,
  EnvTransformer,
  EnvValidationOptions,
  EnvVarSchema,
  EnvSchema,
  ResolvedEnvConfig,
  InferEnvVarType,
  EnvAccessorOptions,
  JourneyEnvConfig,
  FeatureFlagConfig,
  DatabaseConfig,
  RedisConfig,
  KafkaConfig,
  RetryPolicyConfig,
  LoggingConfig,
  CorsConfig,
  JwtConfig,
  HealthCheckConfig,
  MonitoringConfig,
  AppEnvConfig,
  ZodEnvSchema,
  EnvValidationResult,
  EnvValidationFn,
  EnvSchemaValidationFn,
  EnvBatchValidationFn,
  JourneyEnvAccessor,
  EnvVarWithMetadata,
  EnvVarDocumentation,
  EnvSchemaDocumentation,
  
  // Type guards
  isString,
  isNumber,
  isBoolean,
  isArray,
  isStringArray,
  isNumberArray,
  isUrl,
  isRecord
} from './types';