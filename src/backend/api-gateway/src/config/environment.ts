/**
 * Environment Configuration Utilities
 * 
 * This module provides utility functions for retrieving and parsing environment variables
 * with proper type conversion, validation, and fallback values. It handles environment-specific
 * configuration for the API Gateway, ensuring consistent behavior across different environments.
 * 
 * Key features:
 * - Type-safe environment variable retrieval with fallbacks
 * - Consistent parsing of environment variables
 * - Journey-specific configuration management
 * - Environment validation mechanisms
 * - Local development environment support
 * 
 * @module config/environment
 * @version 1.0.0
 */

import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';
import { JourneyId } from '@austa/interfaces/common';
import { RATE_LIMITS, CACHE } from './constants';
import * as fs from 'fs';
import * as path from 'path';

// Environment variable names
export const ENV_VARS = {
  // Server configuration
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  HOST: 'HOST',
  API_BASE_URL: 'API_BASE_URL',
  
  // Authentication configuration
  JWT_SECRET: 'JWT_SECRET',
  TOKEN_EXPIRATION: 'TOKEN_EXPIRATION',
  REFRESH_TOKEN_EXPIRATION: 'REFRESH_TOKEN_EXPIRATION',
  TOKEN_ISSUER: 'TOKEN_ISSUER',
  TOKEN_AUDIENCE: 'TOKEN_AUDIENCE',
  
  // CORS configuration
  CORS_ORIGINS: 'CORS_ORIGINS',
  CORS_CREDENTIALS: 'CORS_CREDENTIALS',
  
  // Rate limiting configuration
  RATE_LIMIT_WINDOW_MS: 'RATE_LIMIT_WINDOW_MS',
  RATE_LIMIT_MAX: 'RATE_LIMIT_MAX',
  RATE_LIMIT_HEALTH: 'RATE_LIMIT_HEALTH',
  RATE_LIMIT_CARE: 'RATE_LIMIT_CARE',
  RATE_LIMIT_PLAN: 'RATE_LIMIT_PLAN',
  
  // GraphQL configuration
  GRAPHQL_PLAYGROUND: 'GRAPHQL_PLAYGROUND',
  GRAPHQL_DEBUG: 'GRAPHQL_DEBUG',
  GRAPHQL_SCHEMA_FILE: 'GRAPHQL_SCHEMA_FILE',
  
  // Cache configuration
  CACHE_TTL_HEALTH: 'CACHE_TTL_HEALTH',
  CACHE_TTL_CARE: 'CACHE_TTL_CARE',
  CACHE_TTL_PLAN: 'CACHE_TTL_PLAN',
  CACHE_TTL_DEFAULT: 'CACHE_TTL_DEFAULT',
  CACHE_MAX_ITEMS: 'CACHE_MAX_ITEMS',
  CACHE_CHECK_PERIOD: 'CACHE_CHECK_PERIOD',
  
  // Logging configuration
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_REQUESTS: 'LOG_REQUESTS',
  LOG_RESPONSES: 'LOG_RESPONSES',
  LOG_PRETTY: 'LOG_PRETTY',
  
  // Tracing configuration
  TRACING_ENABLED: 'TRACING_ENABLED',
  TRACING_EXPORTER_ENDPOINT: 'TRACING_EXPORTER_ENDPOINT',
  TRACING_SAMPLE_RATE: 'TRACING_SAMPLE_RATE',
  
  // Service endpoints
  AUTH_SERVICE_URL: 'AUTH_SERVICE_URL',
  AUTH_SERVICE_TIMEOUT: 'AUTH_SERVICE_TIMEOUT',
  HEALTH_SERVICE_URL: 'HEALTH_SERVICE_URL',
  HEALTH_SERVICE_TIMEOUT: 'HEALTH_SERVICE_TIMEOUT',
  CARE_SERVICE_URL: 'CARE_SERVICE_URL',
  CARE_SERVICE_TIMEOUT: 'CARE_SERVICE_TIMEOUT',
  PLAN_SERVICE_URL: 'PLAN_SERVICE_URL',
  PLAN_SERVICE_TIMEOUT: 'PLAN_SERVICE_TIMEOUT',
  GAMIFICATION_SERVICE_URL: 'GAMIFICATION_SERVICE_URL',
  GAMIFICATION_SERVICE_TIMEOUT: 'GAMIFICATION_SERVICE_TIMEOUT',
  NOTIFICATION_SERVICE_URL: 'NOTIFICATION_SERVICE_URL',
  NOTIFICATION_SERVICE_TIMEOUT: 'NOTIFICATION_SERVICE_TIMEOUT',
  
  // Service discovery
  SERVICE_DISCOVERY_ENABLED: 'SERVICE_DISCOVERY_ENABLED',
  SERVICE_DISCOVERY_PROVIDER: 'SERVICE_DISCOVERY_PROVIDER',
  SERVICE_DISCOVERY_REFRESH_INTERVAL: 'SERVICE_DISCOVERY_REFRESH_INTERVAL',
  SERVICE_DISCOVERY_NAMESPACE: 'SERVICE_DISCOVERY_NAMESPACE',
};

// Default server configuration
export const DEFAULT_SERVER_CONFIG = {
  PORT: 3000,
  HOST: '0.0.0.0',
  ENV: 'development',
  BASE_URL: 'http://localhost:3000',
};

// Default authentication configuration
export const DEFAULT_AUTH_CONFIG = {
  TOKEN_EXPIRATION: '1h',
  REFRESH_TOKEN_EXPIRATION: '7d',
  ISSUER: 'austa-api-gateway',
  AUDIENCE: 'austa-clients',
};

// Default CORS configuration
export const DEFAULT_CORS_CONFIG = {
  ORIGINS: ['http://localhost:3000', 'http://localhost:8081'],
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Journey-ID', 'X-API-Version'],
};

// Default rate limit configuration
export const DEFAULT_RATE_LIMIT_CONFIG = {
  WINDOW_MS: 60000, // 1 minute
  MAX_REQUESTS: 100, // 100 requests per minute
  MESSAGE: 'Too many requests, please try again later.',
};

// Default GraphQL configuration
export const DEFAULT_GRAPHQL_CONFIG = {
  AUTO_SCHEMA_FILE: true,
  SORT_SCHEMA: true,
};

// Default cache configuration
export const DEFAULT_CACHE_CONFIG = {
  DEFAULT_TTL: '5m',
  MAX_ITEMS: 1000,
  CHECK_PERIOD: 600, // 10 minutes
};

// Default logging configuration
export const DEFAULT_LOGGING_CONFIG = {
  LEVEL: 'info',
  REQUEST_LOGGING: true,
  RESPONSE_LOGGING: true,
};

// Default tracing configuration
export const DEFAULT_TRACING_CONFIG = {
  ENABLED: false,
  SERVICE_NAME: 'api-gateway',
  EXPORTER_ENDPOINT: 'http://jaeger:4318/v1/traces',
  SAMPLE_RATE: 0.1,
};

// Default service endpoints
export const DEFAULT_SERVICE_ENDPOINTS = {
  AUTH: {
    URL: 'http://auth-service:3000',
    TIMEOUT: 10000,
    HEALTH_CHECK_PATH: '/health',
  },
  HEALTH: {
    URL: 'http://health-service:3000',
    TIMEOUT: 30000,
    HEALTH_CHECK_PATH: '/health',
  },
  CARE: {
    URL: 'http://care-service:3000',
    TIMEOUT: 30000,
    HEALTH_CHECK_PATH: '/health',
  },
  PLAN: {
    URL: 'http://plan-service:3000',
    TIMEOUT: 30000,
    HEALTH_CHECK_PATH: '/health',
  },
  GAMIFICATION: {
    URL: 'http://gamification-service:3000',
    TIMEOUT: 15000,
    HEALTH_CHECK_PATH: '/health',
  },
  NOTIFICATION: {
    URL: 'http://notification-service:3000',
    TIMEOUT: 10000,
    HEALTH_CHECK_PATH: '/health',
  },
};

// Default service discovery configuration
export const DEFAULT_SERVICE_DISCOVERY = {
  ENABLED: false,
  PROVIDER: 'static',
  REFRESH_INTERVAL: 60000, // 1 minute
  NAMESPACE: 'default',
};

/**
 * Type conversion function for environment variables
 */
type EnvVarConverter<T> = (value: string) => T;

/**
 * Retrieves an environment variable with fallback value and optional type conversion
 * 
 * @param name - The name of the environment variable
 * @param defaultValue - The default value to use if the environment variable is not set
 * @param converter - Optional function to convert the string value to another type
 * @returns The environment variable value or the default value
 */
export function getEnvVar<T>(name: string, defaultValue: T, converter?: EnvVarConverter<T>): T {
  const value = process.env[name];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }
  
  if (converter) {
    try {
      return converter(value);
    } catch (error) {
      console.warn(`Failed to convert environment variable ${name}: ${error.message}`);
      return defaultValue;
    }
  }
  
  return value as unknown as T;
}

/**
 * Converts a string value to a number
 * 
 * @param value - The string value to convert
 * @returns The converted number
 * @throws Error if the value cannot be converted to a number
 */
export function toNumber(value: string): number {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`Value '${value}' cannot be converted to a number`);
  }
  
  return num;
}

/**
 * Converts a string value to a boolean
 * 
 * @param value - The string value to convert
 * @returns The converted boolean
 */
export function toBoolean(value: string): boolean {
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Converts a string value to a CORS origin configuration
 * 
 * @param value - The string value to convert (comma-separated list or regex pattern)
 * @returns The CORS origin configuration
 */
export function toCorsOrigin(value: string): string[] | RegExp | (string | RegExp)[] {
  // Check if it's a regex pattern
  if (value.startsWith('/') && value.endsWith('/')) {
    try {
      return new RegExp(value.slice(1, -1));
    } catch (error) {
      console.warn(`Invalid CORS origin regex pattern: ${error.message}`);
    }
  }
  
  // Split by comma and trim whitespace
  return value.split(',').map(origin => origin.trim());
}

/**
 * Gets the current server environment
 * 
 * @returns The server environment (development, staging, production, or test)
 */
export function getServerEnvironment(): 'development' | 'staging' | 'production' | 'test' {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'development':
    case 'staging':
    case 'production':
    case 'test':
      return env;
    default:
      console.warn(`Unknown environment '${env}', falling back to 'development'`);
      return 'development';
  }
}

/**
 * Gets rate limits for different journeys
 * 
 * @returns Record of journey IDs to rate limits
 */
export function getJourneyRateLimits(): Record<JourneyId, number> {
  return {
    [JOURNEY_IDS.HEALTH]: getEnvVar(
      ENV_VARS.RATE_LIMIT_HEALTH,
      RATE_LIMITS.JOURNEY.HEALTH.MAX_REQUESTS,
      toNumber
    ),
    [JOURNEY_IDS.CARE]: getEnvVar(
      ENV_VARS.RATE_LIMIT_CARE,
      RATE_LIMITS.JOURNEY.CARE.MAX_REQUESTS,
      toNumber
    ),
    [JOURNEY_IDS.PLAN]: getEnvVar(
      ENV_VARS.RATE_LIMIT_PLAN,
      RATE_LIMITS.JOURNEY.PLAN.MAX_REQUESTS,
      toNumber
    ),
  };
}

/**
 * Gets cache TTLs for different journeys
 * 
 * @returns Record of journey IDs to cache TTLs
 */
export function getJourneyCacheTTLs(): Record<JourneyId, string> {
  return {
    [JOURNEY_IDS.HEALTH]: getEnvVar(
      ENV_VARS.CACHE_TTL_HEALTH,
      `${CACHE.JOURNEY.HEALTH.METRICS}s`
    ),
    [JOURNEY_IDS.CARE]: getEnvVar(
      ENV_VARS.CACHE_TTL_CARE,
      `${CACHE.JOURNEY.CARE.APPOINTMENTS}s`
    ),
    [JOURNEY_IDS.PLAN]: getEnvVar(
      ENV_VARS.CACHE_TTL_PLAN,
      `${CACHE.JOURNEY.PLAN.CLAIMS_STATUS}s`
    ),
  };
}

/**
 * Validates that all required environment variables are present
 * 
 * @param requiredVars - Array of required environment variable names
 * @throws Error if any required environment variables are missing
 */
export function validateRequiredEnvVars(requiredVars: string[]): void {
  const missing = requiredVars.filter(name => !process.env[name]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Validates environment variables against a schema
 * 
 * @param schema - Object describing the expected types and constraints for environment variables
 * @throws Error if any environment variables fail validation
 */
export function validateEnvVarsSchema(schema: Record<string, { 
  type: string; 
  required?: boolean; 
  pattern?: RegExp;
  min?: number;
  max?: number;
  enum?: string[];
}>): void {
  const errors: string[] = [];
  
  for (const [name, rules] of Object.entries(schema)) {
    const value = process.env[name];
    
    // Check if required
    if (rules.required && (value === undefined || value === '')) {
      errors.push(`${name} is required`);
      continue;
    }
    
    // Skip validation if not required and not provided
    if (!rules.required && (value === undefined || value === '')) {
      continue;
    }
    
    // Validate type
    switch (rules.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors.push(`${name} must be a number`);
        } else {
          const numValue = Number(value);
          // Validate min/max if provided
          if (rules.min !== undefined && numValue < rules.min) {
            errors.push(`${name} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && numValue > rules.max) {
            errors.push(`${name} must be at most ${rules.max}`);
          }
        }
        break;
      case 'boolean':
        if (value !== 'true' && value !== 'false' && value !== '0' && value !== '1') {
          errors.push(`${name} must be a boolean (true/false or 1/0)`);
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push(`${name} must be a valid URL`);
        }
        break;
      case 'enum':
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`${name} must be one of: ${rules.enum.join(', ')}`);
        }
        break;
    }
    
    // Validate pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(`${name} does not match the required pattern ${rules.pattern}`);
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates service URLs and connectivity
 * 
 * @param services - Object containing service URLs to validate
 * @param timeout - Timeout for connection checks in milliseconds
 * @returns Promise that resolves when validation is complete
 * @throws Error if any service URLs are invalid or unreachable
 */
export async function validateServiceConnectivity(
  services: Record<string, { url: string; healthCheckPath?: string }>,
  timeout: number = 5000
): Promise<void> {
  const errors: string[] = [];
  const checkPromises: Promise<void>[] = [];
  
  for (const [name, config] of Object.entries(services)) {
    try {
      // Validate URL format
      new URL(config.url);
      
      // Skip actual connectivity check in test environment
      if (process.env.NODE_ENV === 'test') {
        continue;
      }
      
      // Create promise for checking connectivity
      const checkPromise = new Promise<void>((resolve, reject) => {
        const healthUrl = config.healthCheckPath 
          ? `${config.url}${config.healthCheckPath}` 
          : config.url;
        
        // Use fetch API if available (Node.js 18+), otherwise use a simple HTTP request
        if (typeof fetch === 'function') {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          fetch(healthUrl, { 
            method: 'GET',
            signal: controller.signal 
          })
            .then(response => {
              clearTimeout(timeoutId);
              if (!response.ok) {
                reject(new Error(`Service returned status ${response.status}`));
              }
              resolve();
            })
            .catch(error => {
              clearTimeout(timeoutId);
              reject(error);
            });
        } else {
          // Fallback for older Node.js versions
          const http = require('http');
          const https = require('https');
          const urlObj = new URL(healthUrl);
          const client = urlObj.protocol === 'https:' ? https : http;
          
          const req = client.get(healthUrl, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              reject(new Error(`Service returned status ${res.statusCode}`));
            }
            resolve();
          });
          
          req.on('error', reject);
          req.setTimeout(timeout, () => {
            req.destroy();
            reject(new Error('Connection timed out'));
          });
        }
      })
        .catch(error => {
          errors.push(`${name} service connectivity check failed: ${error.message}`);
        });
      
      checkPromises.push(checkPromise);
    } catch (error) {
      errors.push(`${name} service URL is invalid: ${error.message}`);
    }
  }
  
  // Wait for all connectivity checks to complete
  await Promise.all(checkPromises);
  
  if (errors.length > 0) {
    throw new Error(`Service validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Validates environment variables for a specific journey
 * 
 * @param journeyId - The journey ID to validate
 * @throws Error if any journey-specific environment variables are invalid
 */
export function validateJourneyEnvironment(journeyId: JourneyId): void {
  const errors: string[] = [];
  
  switch (journeyId) {
    case JOURNEY_IDS.HEALTH:
      // Validate health journey environment variables
      if (!process.env[ENV_VARS.HEALTH_SERVICE_URL]) {
        errors.push(`${ENV_VARS.HEALTH_SERVICE_URL} is required for the Health journey`);
      }
      break;
    case JOURNEY_IDS.CARE:
      // Validate care journey environment variables
      if (!process.env[ENV_VARS.CARE_SERVICE_URL]) {
        errors.push(`${ENV_VARS.CARE_SERVICE_URL} is required for the Care journey`);
      }
      break;
    case JOURNEY_IDS.PLAN:
      // Validate plan journey environment variables
      if (!process.env[ENV_VARS.PLAN_SERVICE_URL]) {
        errors.push(`${ENV_VARS.PLAN_SERVICE_URL} is required for the Plan journey`);
      }
      break;
  }
  
  if (errors.length > 0) {
    throw new Error(`Journey environment validation failed for ${journeyId}:\n${errors.join('\n')}`);
  }
}

/**
 * Validates environment variables for specific features
 * 
 * @param features - Array of feature names to validate
 * @throws Error if any feature-specific environment variables are invalid
 */
export function validateFeatureEnvironment(features: string[]): void {
  const errors: string[] = [];
  
  // Define required environment variables for each feature
  const featureRequirements: Record<string, string[]> = {
    'graphql': [
      ENV_VARS.GRAPHQL_PLAYGROUND,
      ENV_VARS.GRAPHQL_DEBUG,
      ENV_VARS.GRAPHQL_SCHEMA_FILE,
    ],
    'authentication': [
      ENV_VARS.JWT_SECRET,
      ENV_VARS.TOKEN_EXPIRATION,
      ENV_VARS.REFRESH_TOKEN_EXPIRATION,
      ENV_VARS.TOKEN_ISSUER,
      ENV_VARS.TOKEN_AUDIENCE,
    ],
    'rate-limiting': [
      ENV_VARS.RATE_LIMIT_WINDOW_MS,
      ENV_VARS.RATE_LIMIT_MAX,
    ],
    'caching': [
      ENV_VARS.CACHE_TTL_DEFAULT,
    ],
    'tracing': [
      ENV_VARS.TRACING_ENABLED,
      ENV_VARS.TRACING_EXPORTER_ENDPOINT,
    ],
    'service-discovery': [
      ENV_VARS.SERVICE_DISCOVERY_ENABLED,
      ENV_VARS.SERVICE_DISCOVERY_PROVIDER,
    ],
  };
  
  // Validate each requested feature
  for (const feature of features) {
    const requiredVars = featureRequirements[feature];
    
    if (!requiredVars) {
      errors.push(`Unknown feature: ${feature}`);
      continue;
    }
    
    // Check if all required variables are present
    for (const varName of requiredVars) {
      if (process.env[varName] === undefined || process.env[varName] === '') {
        errors.push(`${varName} is required for the ${feature} feature`);
      }
    }
    
    // Feature-specific validation
    switch (feature) {
      case 'authentication':
        // JWT secret should be at least 32 characters for security
        if (process.env[ENV_VARS.JWT_SECRET] && process.env[ENV_VARS.JWT_SECRET].length < 32) {
          errors.push(`${ENV_VARS.JWT_SECRET} should be at least 32 characters long for security`);
        }
        break;
      
      case 'tracing':
        // If tracing is enabled, exporter endpoint must be a valid URL
        if (process.env[ENV_VARS.TRACING_ENABLED] === 'true') {
          try {
            new URL(process.env[ENV_VARS.TRACING_EXPORTER_ENDPOINT] || '');
          } catch {
            errors.push(`${ENV_VARS.TRACING_EXPORTER_ENDPOINT} must be a valid URL when tracing is enabled`);
          }
        }
        break;
      
      case 'service-discovery':
        // If service discovery is enabled, provider must be valid
        if (process.env[ENV_VARS.SERVICE_DISCOVERY_ENABLED] === 'true') {
          const validProviders = ['static', 'dns', 'kubernetes', 'consul'];
          const provider = process.env[ENV_VARS.SERVICE_DISCOVERY_PROVIDER];
          
          if (!validProviders.includes(provider || '')) {
            errors.push(`${ENV_VARS.SERVICE_DISCOVERY_PROVIDER} must be one of: ${validProviders.join(', ')}`);
          }
          
          // If provider is kubernetes, namespace is required
          if (provider === 'kubernetes' && !process.env[ENV_VARS.SERVICE_DISCOVERY_NAMESPACE]) {
            errors.push(`${ENV_VARS.SERVICE_DISCOVERY_NAMESPACE} is required when using kubernetes service discovery`);
          }
        }
        break;
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`Feature environment validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Gets environment-specific configuration
 * 
 * @param env - The server environment
 * @returns Environment-specific configuration
 */
export function getEnvironmentConfig(env: string): Record<string, any> {
  switch (env) {
    case 'production':
      return {
        logging: {
          level: 'info',
          requestLogging: true,
          responseLogging: false,
          prettyPrint: false,
        },
        tracing: {
          enabled: true,
          sampleRate: 0.1,
        },
        graphql: {
          playground: false,
          debug: false,
        },
        cache: {
          maxItems: 10000,
          checkPeriod: 300, // 5 minutes
        },
      };
    case 'staging':
      return {
        logging: {
          level: 'info',
          requestLogging: true,
          responseLogging: true,
          prettyPrint: false,
        },
        tracing: {
          enabled: true,
          sampleRate: 0.5,
        },
        graphql: {
          playground: true,
          debug: false,
        },
        cache: {
          maxItems: 5000,
          checkPeriod: 300, // 5 minutes
        },
      };
    case 'test':
      return {
        logging: {
          level: 'error',
          requestLogging: false,
          responseLogging: false,
          prettyPrint: false,
        },
        tracing: {
          enabled: false,
        },
        graphql: {
          playground: false,
          debug: false,
        },
        cache: {
          maxItems: 100,
          checkPeriod: 60, // 1 minute
        },
      };
    case 'development':
    default:
      return {
        logging: {
          level: 'debug',
          requestLogging: true,
          responseLogging: true,
          prettyPrint: true,
        },
        tracing: {
          enabled: false,
        },
        graphql: {
          playground: true,
          debug: true,
        },
        cache: {
          maxItems: 1000,
          checkPeriod: 60, // 1 minute
        },
      };
  }
}

/**
 * Gets journey-specific configuration
 * 
 * @param journeyId - The journey ID
 * @returns Journey-specific configuration
 */
export function getJourneyConfig(journeyId: JourneyId): Record<string, any> {
  switch (journeyId) {
    case JOURNEY_IDS.HEALTH:
      return {
        rateLimit: {
          max: RATE_LIMITS.JOURNEY.HEALTH.MAX_REQUESTS,
          windowMs: RATE_LIMITS.JOURNEY.HEALTH.WINDOW_MS,
        },
        cache: {
          ttl: `${CACHE.JOURNEY.HEALTH.METRICS}s`,
          metrics: `${CACHE.JOURNEY.HEALTH.METRICS}s`,
          goals: `${CACHE.JOURNEY.HEALTH.GOALS}s`,
          medicalHistory: `${CACHE.JOURNEY.HEALTH.MEDICAL_HISTORY}s`,
        },
        service: {
          timeout: TIMEOUTS.JOURNEY.HEALTH,
        },
      };
    case JOURNEY_IDS.CARE:
      return {
        rateLimit: {
          max: RATE_LIMITS.JOURNEY.CARE.MAX_REQUESTS,
          windowMs: RATE_LIMITS.JOURNEY.CARE.WINDOW_MS,
        },
        cache: {
          ttl: `${CACHE.JOURNEY.CARE.APPOINTMENTS}s`,
          providers: `${CACHE.JOURNEY.CARE.PROVIDERS}s`,
          appointments: `${CACHE.JOURNEY.CARE.APPOINTMENTS}s`,
          treatments: `${CACHE.JOURNEY.CARE.TREATMENTS}s`,
        },
        service: {
          timeout: TIMEOUTS.JOURNEY.CARE,
        },
      };
    case JOURNEY_IDS.PLAN:
      return {
        rateLimit: {
          max: RATE_LIMITS.JOURNEY.PLAN.MAX_REQUESTS,
          windowMs: RATE_LIMITS.JOURNEY.PLAN.WINDOW_MS,
        },
        cache: {
          ttl: `${CACHE.JOURNEY.PLAN.CLAIMS_STATUS}s`,
          coverage: `${CACHE.JOURNEY.PLAN.COVERAGE}s`,
          claimsStatus: `${CACHE.JOURNEY.PLAN.CLAIMS_STATUS}s`,
          benefits: `${CACHE.JOURNEY.PLAN.BENEFITS}s`,
        },
        service: {
          timeout: TIMEOUTS.JOURNEY.PLAN,
        },
      };
    default:
      return {};
  }
}

/**
 * Initializes the environment configuration
 * 
 * This function should be called at application startup to ensure that
 * the environment is properly configured before the application starts.
 * 
 * It performs the following tasks:
 * 1. Loads environment variables from .env file for local development
 * 2. Validates required environment variables
 * 3. Sets default values for missing environment variables
 * 4. Validates service connectivity (optional)
 * 
 * @param options - Initialization options
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeEnvironment(options: {
  loadEnvFile?: boolean;
  envFilePath?: string;
  validateServices?: boolean;
  requiredVars?: string[];
  serviceTimeout?: number;
} = {}): Promise<void> {
  const {
    loadEnvFile: shouldLoadEnvFile = process.env.NODE_ENV === 'development',
    envFilePath = '.env.local',
    validateServices = false,
    requiredVars = [
      ENV_VARS.JWT_SECRET,
      ENV_VARS.AUTH_SERVICE_URL,
    ],
    serviceTimeout = 5000,
  } = options;
  
  // Load environment variables from .env file for local development
  if (shouldLoadEnvFile) {
    loadEnvFile(envFilePath);
  }
  
  // Validate required environment variables
  validateRequiredEnvVars(requiredVars);
  
  // Set default values for missing environment variables based on environment
  const env = getServerEnvironment();
  const envConfig = getEnvironmentConfig(env);
  
  // Apply environment-specific defaults if not already set
  if (envConfig.logging && !process.env[ENV_VARS.LOG_LEVEL]) {
    process.env[ENV_VARS.LOG_LEVEL] = envConfig.logging.level;
  }
  
  if (envConfig.tracing && !process.env[ENV_VARS.TRACING_ENABLED]) {
    process.env[ENV_VARS.TRACING_ENABLED] = String(envConfig.tracing.enabled);
  }
  
  // Validate service connectivity if requested
  if (validateServices) {
    const services = {
      auth: {
        url: getEnvVar(ENV_VARS.AUTH_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.AUTH.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.AUTH.HEALTH_CHECK_PATH,
      },
      health: {
        url: getEnvVar(ENV_VARS.HEALTH_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.HEALTH.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.HEALTH.HEALTH_CHECK_PATH,
      },
      care: {
        url: getEnvVar(ENV_VARS.CARE_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.CARE.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.CARE.HEALTH_CHECK_PATH,
      },
      plan: {
        url: getEnvVar(ENV_VARS.PLAN_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.PLAN.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.PLAN.HEALTH_CHECK_PATH,
      },
      gamification: {
        url: getEnvVar(ENV_VARS.GAMIFICATION_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.GAMIFICATION.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.GAMIFICATION.HEALTH_CHECK_PATH,
      },
      notification: {
        url: getEnvVar(ENV_VARS.NOTIFICATION_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.NOTIFICATION.URL),
        healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.NOTIFICATION.HEALTH_CHECK_PATH,
      },
    };
    
    await validateServiceConnectivity(services, serviceTimeout);
  }
  
  console.log(`Environment initialized for ${env} environment`);
}

/**
 * Exports environment variables to a .env file
 * 
 * This is useful for creating a snapshot of the current environment
 * configuration that can be used to reproduce the same environment later.
 * 
 * @param filePath - Path to the output .env file
 * @param variables - List of environment variable names to export (default: all)
 * @param includeDefaults - Whether to include variables with default values (default: true)
 */
export function exportEnvironmentToFile(
  filePath: string,
  variables?: string[],
  includeDefaults: boolean = true
): void {
  try {
    // Determine which variables to export
    const varsToExport = variables || Object.values(ENV_VARS);
    
    // Build the file content
    let content = '# AUSTA SuperApp API Gateway Environment Configuration\n';
    content += `# Generated on ${new Date().toISOString()}\n\n`;
    
    // Group variables by category
    const categories = {
      'Server Configuration': [
        ENV_VARS.NODE_ENV,
        ENV_VARS.PORT,
        ENV_VARS.HOST,
        ENV_VARS.API_BASE_URL,
      ],
      'Authentication Configuration': [
        ENV_VARS.JWT_SECRET,
        ENV_VARS.TOKEN_EXPIRATION,
        ENV_VARS.REFRESH_TOKEN_EXPIRATION,
        ENV_VARS.TOKEN_ISSUER,
        ENV_VARS.TOKEN_AUDIENCE,
      ],
      'CORS Configuration': [
        ENV_VARS.CORS_ORIGINS,
        ENV_VARS.CORS_CREDENTIALS,
      ],
      'Rate Limiting Configuration': [
        ENV_VARS.RATE_LIMIT_WINDOW_MS,
        ENV_VARS.RATE_LIMIT_MAX,
        ENV_VARS.RATE_LIMIT_HEALTH,
        ENV_VARS.RATE_LIMIT_CARE,
        ENV_VARS.RATE_LIMIT_PLAN,
      ],
      'GraphQL Configuration': [
        ENV_VARS.GRAPHQL_PLAYGROUND,
        ENV_VARS.GRAPHQL_DEBUG,
        ENV_VARS.GRAPHQL_SCHEMA_FILE,
      ],
      'Cache Configuration': [
        ENV_VARS.CACHE_TTL_DEFAULT,
        ENV_VARS.CACHE_TTL_HEALTH,
        ENV_VARS.CACHE_TTL_CARE,
        ENV_VARS.CACHE_TTL_PLAN,
        ENV_VARS.CACHE_MAX_ITEMS,
        ENV_VARS.CACHE_CHECK_PERIOD,
      ],
      'Logging Configuration': [
        ENV_VARS.LOG_LEVEL,
        ENV_VARS.LOG_REQUESTS,
        ENV_VARS.LOG_RESPONSES,
        ENV_VARS.LOG_PRETTY,
      ],
      'Tracing Configuration': [
        ENV_VARS.TRACING_ENABLED,
        ENV_VARS.TRACING_EXPORTER_ENDPOINT,
        ENV_VARS.TRACING_SAMPLE_RATE,
      ],
      'Service Endpoints': [
        ENV_VARS.AUTH_SERVICE_URL,
        ENV_VARS.AUTH_SERVICE_TIMEOUT,
        ENV_VARS.HEALTH_SERVICE_URL,
        ENV_VARS.HEALTH_SERVICE_TIMEOUT,
        ENV_VARS.CARE_SERVICE_URL,
        ENV_VARS.CARE_SERVICE_TIMEOUT,
        ENV_VARS.PLAN_SERVICE_URL,
        ENV_VARS.PLAN_SERVICE_TIMEOUT,
        ENV_VARS.GAMIFICATION_SERVICE_URL,
        ENV_VARS.GAMIFICATION_SERVICE_TIMEOUT,
        ENV_VARS.NOTIFICATION_SERVICE_URL,
        ENV_VARS.NOTIFICATION_SERVICE_TIMEOUT,
      ],
      'Service Discovery': [
        ENV_VARS.SERVICE_DISCOVERY_ENABLED,
        ENV_VARS.SERVICE_DISCOVERY_PROVIDER,
        ENV_VARS.SERVICE_DISCOVERY_REFRESH_INTERVAL,
        ENV_VARS.SERVICE_DISCOVERY_NAMESPACE,
      ],
    };
    
    // Add variables by category
    for (const [category, categoryVars] of Object.entries(categories)) {
      const filteredVars = categoryVars.filter(varName => varsToExport.includes(varName));
      
      if (filteredVars.length > 0) {
        content += `\n# ${category}\n`;
        
        for (const varName of filteredVars) {
          const value = process.env[varName];
          
          // Skip if value is not set and includeDefaults is false
          if (!includeDefaults && (value === undefined || value === '')) {
            continue;
          }
          
          // Add the variable to the file
          if (value !== undefined) {
            // Quote values with spaces or special characters
            const needsQuotes = /[\s"'\\;#]/.test(value);
            const quotedValue = needsQuotes ? `"${value}"` : value;
            content += `${varName}=${quotedValue}\n`;
          } else {
            content += `# ${varName}=\n`;
          }
        }
      }
    }
    
    // Write the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Environment variables exported to ${filePath}`);
  } catch (error) {
    console.error(`Failed to export environment variables: ${error.message}`);
    throw error;
  }
}

// Import TIMEOUTS from constants
import { TIMEOUTS } from './constants';

/**
 * Loads environment variables from a .env file for local development
 * 
 * @param envPath - Path to the .env file (default: .env.local)
 * @param overwrite - Whether to overwrite existing environment variables (default: false)
 */
export function loadEnvFile(envPath: string = '.env.local', overwrite: boolean = false): void {
  try {
    // Resolve path relative to project root
    const rootDir = process.cwd();
    const filePath = path.resolve(rootDir, envPath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`Environment file not found: ${filePath}`);
      return;
    }
    
    // Read and parse .env file
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = parseEnvFile(envContent);
    
    // Set environment variables
    for (const [key, value] of Object.entries(envVars)) {
      if (overwrite || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    
    console.log(`Loaded environment variables from ${filePath}`);
  } catch (error) {
    console.warn(`Failed to load environment file: ${error.message}`);
  }
}

/**
 * Parses a .env file content into key-value pairs
 * 
 * @param content - Content of the .env file
 * @returns Object with environment variables
 */
function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Split by lines and process each line
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    // Parse key-value pairs
    const match = trimmedLine.match(/^([\w.-]+)\s*=\s*(.*)$/i);
    if (match) {
      const [, key, value] = match;
      
      // Remove quotes if present
      let processedValue = value.trim();
      if (
        (processedValue.startsWith('"') && processedValue.endsWith('"')) ||
        (processedValue.startsWith('\'') && processedValue.endsWith('\''))
      ) {
        processedValue = processedValue.substring(1, processedValue.length - 1);
      }
      
      result[key] = processedValue;
    }
  }
  
  return result;
}