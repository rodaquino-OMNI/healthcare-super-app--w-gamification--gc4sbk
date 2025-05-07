/**
 * API Gateway Configuration Module
 * 
 * This module exports a clean public API for the API Gateway configuration,
 * including factory functions and utility methods for accessing configuration settings.
 * It serves as the main entry point for importing configuration across the API Gateway service,
 * enabling standardized imports and hiding implementation details.
 * 
 * @module config
 * @version 1.0.0
 */

// Export main configuration object and its type
export { default as configuration, ApiGatewayConfig } from './configuration';

// Export utility functions for accessing configuration
export {
  getEnvVar,
  toNumber,
  toBoolean,
  toCorsOrigin,
  getServerEnvironment,
  getJourneyRateLimits,
  getJourneyCacheTTLs,
  validateRequiredEnvVars,
  validateEnvVarsSchema,
  validateServiceConnectivity,
  validateJourneyEnvironment,
  validateFeatureEnvironment,
  getEnvironmentConfig,
  getJourneyConfig,
  initializeEnvironment,
  exportEnvironmentToFile,
  loadEnvFile
} from './environment';

// Export validation schema
export { ApiGatewayConfigValidation } from './validation.schema';

// Export configuration types
export {
  // Core configuration types
  ApiGatewayConfiguration,
  ServerConfig,
  AuthConfig,
  CorsConfig,
  RateLimitConfig,
  GraphQLConfig,
  CacheConfig,
  LoggingConfig,
  TracingConfig,
  ServicesConfig,
  ServiceConfig,
  
  // Journey-specific configuration types
  HealthServiceConfig,
  CareServiceConfig,
  PlanServiceConfig,
  JourneyRateLimitConfig,
  JourneyCacheConfig,
  HealthCacheConfig,
  CareCacheConfig,
  PlanCacheConfig,
  
  // Additional configuration types
  ServiceDiscoveryConfig,
  ApiVersionConfig,
  FeatureFlagsConfig,
  ErrorsConfig,
  ErrorCodeConfig,
  RoutesConfig,
  JourneyRoutesConfig,
  HealthRoutesConfig,
  CareRoutesConfig,
  PlanRoutesConfig,
  ServiceCommunicationConfig,
  ServiceCommunicationParams,
  TimeoutConfig,
  SecurityConfig,
  GraphQLSpecificConfig,
  
  // Utility types
  EnvVarConverter,
  EnvVarValidationRule,
  EnvVarSchema
} from './types';

// Export constants
export {
  // Environment variables
  ENV_VARS,
  
  // Default configurations
  DEFAULT_SERVER_CONFIG,
  DEFAULT_AUTH_CONFIG,
  DEFAULT_CORS_CONFIG,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_GRAPHQL_CONFIG,
  DEFAULT_CACHE_CONFIG,
  DEFAULT_LOGGING_CONFIG,
  DEFAULT_TRACING_CONFIG,
  DEFAULT_SERVICE_ENDPOINTS,
  DEFAULT_SERVICE_DISCOVERY,
  
  // API versioning
  API_VERSION,
  
  // Timeouts
  TIMEOUTS,
  
  // Rate limits
  RATE_LIMITS,
  
  // Caching
  CACHE,
  
  // Services
  SERVICES,
  
  // GraphQL
  GRAPHQL,
  
  // Security
  SECURITY,
  
  // Environment
  ENV,
  
  // Errors
  ERRORS,
  
  // Routes
  ROUTES,
  
  // Features
  FEATURES
} from './constants';

/**
 * Factory function to create a configuration object with journey-specific settings
 * 
 * @param journeyId - The journey ID to create configuration for
 * @returns Configuration object with journey-specific settings
 */
export function createJourneyConfig(journeyId: string): Record<string, any> {
  return getJourneyConfig(journeyId as any);
}

/**
 * Factory function to create a configuration object for a specific environment
 * 
 * @param env - The environment to create configuration for
 * @returns Configuration object for the specified environment
 */
export function createEnvironmentConfig(env: string): Record<string, any> {
  return getEnvironmentConfig(env);
}

/**
 * Utility function to get a configuration value from the API Gateway configuration
 * 
 * @param config - The API Gateway configuration object
 * @param path - Dot-notation path to the configuration value
 * @param defaultValue - Default value to return if the path doesn't exist
 * @returns The configuration value at the specified path, or the default value
 */
export function getConfigValue<T>(config: ApiGatewayConfig, path: string, defaultValue?: T): T {
  const parts = path.split('.');
  let current: any = config;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue as T;
    }
    
    current = current[part];
  }
  
  return (current === undefined || current === null) ? defaultValue as T : current;
}

/**
 * Utility function to check if a feature is enabled in the configuration
 * 
 * @param featurePath - Dot-notation path to the feature flag
 * @param defaultValue - Default value if the feature flag is not found
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(featurePath: string, defaultValue: boolean = false): boolean {
  const parts = featurePath.split('.');
  let current: any = FEATURES;
  
  for (const part of parts) {
    if (current === undefined || current === null) {
      return defaultValue;
    }
    
    current = current[part];
  }
  
  return current === true;
}

/**
 * Utility function to get a journey-specific rate limit
 * 
 * @param journeyId - The journey ID
 * @returns The rate limit for the specified journey
 */
export function getJourneyRateLimit(journeyId: string): number {
  const journeyLimits = getJourneyRateLimits();
  return journeyLimits[journeyId] || RATE_LIMITS.DEFAULT.MAX_REQUESTS;
}

/**
 * Utility function to get a journey-specific cache TTL
 * 
 * @param journeyId - The journey ID
 * @returns The cache TTL for the specified journey
 */
export function getJourneyCacheTTL(journeyId: string): string {
  const cacheTTLs = getJourneyCacheTTLs();
  return cacheTTLs[journeyId] || `${CACHE.DEFAULT_TTL}s`;
}

/**
 * Utility function to get a service endpoint URL
 * 
 * @param serviceName - The service name
 * @returns The service endpoint URL
 */
export function getServiceUrl(serviceName: string): string {
  const serviceConfig = DEFAULT_SERVICE_ENDPOINTS[serviceName.toUpperCase()];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  
  return serviceConfig.URL;
}

/**
 * Utility function to get a service timeout
 * 
 * @param serviceName - The service name
 * @returns The service timeout in milliseconds
 */
export function getServiceTimeout(serviceName: string): number {
  const serviceConfig = DEFAULT_SERVICE_ENDPOINTS[serviceName.toUpperCase()];
  if (!serviceConfig) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  
  return serviceConfig.TIMEOUT;
}

/**
 * Utility function to get an error code and message
 * 
 * @param category - The error category
 * @param errorCode - The error code
 * @returns The error code and message
 */
export function getErrorConfig(category: string, errorCode: string): { code: string; message: string } {
  const errorCategory = ERRORS[category.toUpperCase()];
  if (!errorCategory) {
    return ERRORS.GENERAL.INTERNAL_SERVER_ERROR;
  }
  
  const error = errorCategory[errorCode.toUpperCase()];
  if (!error) {
    return ERRORS.GENERAL.INTERNAL_SERVER_ERROR;
  }
  
  return error;
}

/**
 * Utility function to get a route path
 * 
 * @param category - The route category
 * @param routeName - The route name
 * @returns The route path
 */
export function getRoutePath(category: string, routeName: string): string {
  const routeCategory = ROUTES[category.toUpperCase()];
  if (!routeCategory) {
    throw new Error(`Unknown route category: ${category}`);
  }
  
  const route = routeCategory[routeName.toUpperCase()];
  if (!route) {
    throw new Error(`Unknown route: ${routeName}`);
  }
  
  return route;
}