/**
 * Constants and default values for API Gateway configuration
 * Provides a single source of truth for configuration defaults
 */

import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';

/**
 * Default server configuration
 */
export const DEFAULT_SERVER_CONFIG = {
  PORT: 4000,
  HOST: '0.0.0.0',
  ENV: 'development',
  BASE_URL: 'http://localhost:4000',
};

/**
 * Default authentication configuration
 */
export const DEFAULT_AUTH_CONFIG = {
  TOKEN_EXPIRATION: '1h',
  REFRESH_TOKEN_EXPIRATION: '7d',
  ISSUER: 'austa.com.br',
  AUDIENCE: 'austa-users',
};

/**
 * Default CORS configuration
 */
export const DEFAULT_CORS_CONFIG = {
  ORIGINS: ['https://app.austa.com.br', /\.austa\.com\.br$/],
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

/**
 * Default rate limiting configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG = {
  WINDOW_MS: 900000, // 15 minutes
  MAX_REQUESTS: 100,
  JOURNEY_LIMITS: {
    [JOURNEY_IDS.HEALTH]: 200,
    [JOURNEY_IDS.CARE]: 150,
    [JOURNEY_IDS.PLAN]: 100,
  },
  MESSAGE: 'Too many requests, please try again later.',
};

/**
 * Default GraphQL configuration
 */
export const DEFAULT_GRAPHQL_CONFIG = {
  AUTO_SCHEMA_FILE: 'schema.gql',
  SORT_SCHEMA: true,
};

/**
 * Default cache TTL configuration
 */
export const DEFAULT_CACHE_CONFIG = {
  TTL: {
    [JOURNEY_IDS.HEALTH]: '5m',
    [JOURNEY_IDS.CARE]: '1m',
    [JOURNEY_IDS.PLAN]: '15m',
  },
  DEFAULT_TTL: '5m',
  MAX_ITEMS: 1000,
  CHECK_PERIOD: 600, // 10 minutes
};

/**
 * Default logging configuration
 */
export const DEFAULT_LOGGING_CONFIG = {
  LEVEL: 'info',
  REQUEST_LOGGING: true,
  RESPONSE_LOGGING: true,
};

/**
 * Default tracing configuration
 */
export const DEFAULT_TRACING_CONFIG = {
  ENABLED: false,
  SERVICE_NAME: 'api-gateway',
  EXPORTER_ENDPOINT: 'http://localhost:4318',
  SAMPLE_RATE: 0.1,
};

/**
 * Default service endpoints
 */
export const DEFAULT_SERVICE_ENDPOINTS = {
  AUTH: {
    URL: 'http://auth-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
  HEALTH: {
    URL: 'http://health-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
  CARE: {
    URL: 'http://care-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
  PLAN: {
    URL: 'http://plan-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
  GAMIFICATION: {
    URL: 'http://gamification-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
  NOTIFICATION: {
    URL: 'http://notification-service:3000',
    TIMEOUT: 5000,
    HEALTH_CHECK_PATH: '/health',
  },
};

/**
 * Default service discovery configuration
 */
export const DEFAULT_SERVICE_DISCOVERY = {
  ENABLED: false,
  PROVIDER: 'kubernetes',
  REFRESH_INTERVAL: 30000, // 30 seconds
  NAMESPACE: 'default',
};

/**
 * Environment variable names
 */
export const ENV_VARS = {
  // Server
  PORT: 'PORT',
  HOST: 'HOST',
  NODE_ENV: 'NODE_ENV',
  API_BASE_URL: 'API_BASE_URL',
  
  // Auth
  JWT_SECRET: 'JWT_SECRET',
  TOKEN_EXPIRATION: 'TOKEN_EXPIRATION',
  REFRESH_TOKEN_EXPIRATION: 'REFRESH_TOKEN_EXPIRATION',
  TOKEN_ISSUER: 'TOKEN_ISSUER',
  TOKEN_AUDIENCE: 'TOKEN_AUDIENCE',
  
  // CORS
  CORS_ORIGINS: 'CORS_ORIGINS',
  CORS_CREDENTIALS: 'CORS_CREDENTIALS',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 'RATE_LIMIT_WINDOW_MS',
  RATE_LIMIT_MAX: 'RATE_LIMIT_MAX',
  RATE_LIMIT_HEALTH: 'RATE_LIMIT_HEALTH',
  RATE_LIMIT_CARE: 'RATE_LIMIT_CARE',
  RATE_LIMIT_PLAN: 'RATE_LIMIT_PLAN',
  
  // GraphQL
  GRAPHQL_PLAYGROUND: 'GRAPHQL_PLAYGROUND',
  GRAPHQL_DEBUG: 'GRAPHQL_DEBUG',
  GRAPHQL_SCHEMA_FILE: 'GRAPHQL_SCHEMA_FILE',
  
  // Cache
  CACHE_TTL_HEALTH: 'CACHE_TTL_HEALTH',
  CACHE_TTL_CARE: 'CACHE_TTL_CARE',
  CACHE_TTL_PLAN: 'CACHE_TTL_PLAN',
  CACHE_TTL_DEFAULT: 'CACHE_TTL_DEFAULT',
  CACHE_MAX_ITEMS: 'CACHE_MAX_ITEMS',
  CACHE_CHECK_PERIOD: 'CACHE_CHECK_PERIOD',
  
  // Logging
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_REQUESTS: 'LOG_REQUESTS',
  LOG_RESPONSES: 'LOG_RESPONSES',
  LOG_PRETTY: 'LOG_PRETTY',
  
  // Tracing
  TRACING_ENABLED: 'TRACING_ENABLED',
  TRACING_EXPORTER_ENDPOINT: 'TRACING_EXPORTER_ENDPOINT',
  TRACING_SAMPLE_RATE: 'TRACING_SAMPLE_RATE',
  
  // Service URLs
  AUTH_SERVICE_URL: 'AUTH_SERVICE_URL',
  HEALTH_SERVICE_URL: 'HEALTH_SERVICE_URL',
  CARE_SERVICE_URL: 'CARE_SERVICE_URL',
  PLAN_SERVICE_URL: 'PLAN_SERVICE_URL',
  GAMIFICATION_SERVICE_URL: 'GAMIFICATION_SERVICE_URL',
  NOTIFICATION_SERVICE_URL: 'NOTIFICATION_SERVICE_URL',
  
  // Service Timeouts
  AUTH_SERVICE_TIMEOUT: 'AUTH_SERVICE_TIMEOUT',
  HEALTH_SERVICE_TIMEOUT: 'HEALTH_SERVICE_TIMEOUT',
  CARE_SERVICE_TIMEOUT: 'CARE_SERVICE_TIMEOUT',
  PLAN_SERVICE_TIMEOUT: 'PLAN_SERVICE_TIMEOUT',
  GAMIFICATION_SERVICE_TIMEOUT: 'GAMIFICATION_SERVICE_TIMEOUT',
  NOTIFICATION_SERVICE_TIMEOUT: 'NOTIFICATION_SERVICE_TIMEOUT',
  
  // Service Discovery
  SERVICE_DISCOVERY_ENABLED: 'SERVICE_DISCOVERY_ENABLED',
  SERVICE_DISCOVERY_PROVIDER: 'SERVICE_DISCOVERY_PROVIDER',
  SERVICE_DISCOVERY_REFRESH_INTERVAL: 'SERVICE_DISCOVERY_REFRESH_INTERVAL',
  SERVICE_DISCOVERY_NAMESPACE: 'SERVICE_DISCOVERY_NAMESPACE',
};