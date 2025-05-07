import { registerAs, ConfigType } from '@nestjs/config';
import { ApiGatewayConfigValidation } from './validation.schema';
import { AUTH_INVALID_CREDENTIALS, AUTH_TOKEN_EXPIRED, AUTH_INSUFFICIENT_PERMISSIONS } from '@app/shared/constants/error-codes.constants';
import { JOURNEY_IDS } from '@app/shared/constants/journey.constants';
import { ApiGatewayConfiguration } from './types';
import {
  getEnvVar,
  toNumber,
  toBoolean,
  toCorsOrigin,
  getServerEnvironment,
  getJourneyRateLimits,
  getJourneyCacheTTLs
} from './environment';
import {
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
  ENV_VARS
} from './constants';

/**
 * Configuration for the API Gateway.
 * Defines settings for server, authentication, CORS, rate limiting, GraphQL, 
 * caching, logging, tracing, and service endpoints with journey-specific configurations.
 */
export const configuration = registerAs('apiGateway', (): ApiGatewayConfiguration => {
  try {
    // Get environment
    const env = getServerEnvironment();
    const isDevelopment = env === 'development';
    const isTest = env === 'test';
    
    // Build configuration object
    return {
      // Server configuration
      server: {
        port: getEnvVar(ENV_VARS.PORT, DEFAULT_SERVER_CONFIG.PORT, toNumber),
        host: getEnvVar(ENV_VARS.HOST, DEFAULT_SERVER_CONFIG.HOST),
        env,
        baseUrl: getEnvVar(ENV_VARS.API_BASE_URL, DEFAULT_SERVER_CONFIG.BASE_URL),
      },
      
      // Authentication configuration
      auth: {
        jwtSecret: getEnvVar(ENV_VARS.JWT_SECRET, isTest ? 'test-secret-key' : ''),
        tokenExpiration: getEnvVar(ENV_VARS.TOKEN_EXPIRATION, DEFAULT_AUTH_CONFIG.TOKEN_EXPIRATION),
        refreshTokenExpiration: getEnvVar(ENV_VARS.REFRESH_TOKEN_EXPIRATION, DEFAULT_AUTH_CONFIG.REFRESH_TOKEN_EXPIRATION),
        issuer: getEnvVar(ENV_VARS.TOKEN_ISSUER, DEFAULT_AUTH_CONFIG.ISSUER),
        audience: getEnvVar(ENV_VARS.TOKEN_AUDIENCE, DEFAULT_AUTH_CONFIG.AUDIENCE),
        errorCodes: {
          invalidCredentials: AUTH_INVALID_CREDENTIALS,
          tokenExpired: AUTH_TOKEN_EXPIRED,
          insufficientPermissions: AUTH_INSUFFICIENT_PERMISSIONS,
        },
      },
      
      // CORS configuration
      cors: {
        origin: getEnvVar(ENV_VARS.CORS_ORIGINS, DEFAULT_CORS_CONFIG.ORIGINS, toCorsOrigin),
        credentials: getEnvVar(ENV_VARS.CORS_CREDENTIALS, DEFAULT_CORS_CONFIG.CREDENTIALS, toBoolean),
        methods: DEFAULT_CORS_CONFIG.METHODS,
        allowedHeaders: DEFAULT_CORS_CONFIG.ALLOWED_HEADERS,
      },
      
      // Rate limiting configuration
      rateLimit: {
        windowMs: getEnvVar(ENV_VARS.RATE_LIMIT_WINDOW_MS, DEFAULT_RATE_LIMIT_CONFIG.WINDOW_MS, toNumber),
        max: getEnvVar(ENV_VARS.RATE_LIMIT_MAX, DEFAULT_RATE_LIMIT_CONFIG.MAX_REQUESTS, toNumber),
        journeyLimits: getJourneyRateLimits(),
        message: DEFAULT_RATE_LIMIT_CONFIG.MESSAGE,
        standardHeaders: true,
        legacyHeaders: false,
      },
      
      // GraphQL configuration
      graphql: {
        playground: getEnvVar(ENV_VARS.GRAPHQL_PLAYGROUND, isDevelopment, toBoolean),
        debug: getEnvVar(ENV_VARS.GRAPHQL_DEBUG, isDevelopment, toBoolean),
        autoSchemaFile: getEnvVar(ENV_VARS.GRAPHQL_SCHEMA_FILE, DEFAULT_GRAPHQL_CONFIG.AUTO_SCHEMA_FILE),
        sortSchema: DEFAULT_GRAPHQL_CONFIG.SORT_SCHEMA,
        context: ({req, res}) => ({req, res}),
        cors: false, // Handled by Express middleware
        installSubscriptionHandlers: true,
        subscriptions: {
          'graphql-ws': true,
          'subscriptions-transport-ws': true,
        },
      },
      
      // Cache configuration
      cache: {
        ttl: getJourneyCacheTTLs(),
        defaultTtl: getEnvVar(ENV_VARS.CACHE_TTL_DEFAULT, DEFAULT_CACHE_CONFIG.DEFAULT_TTL),
        maxItems: getEnvVar(ENV_VARS.CACHE_MAX_ITEMS, DEFAULT_CACHE_CONFIG.MAX_ITEMS, toNumber),
        checkPeriod: getEnvVar(ENV_VARS.CACHE_CHECK_PERIOD, DEFAULT_CACHE_CONFIG.CHECK_PERIOD, toNumber),
      },
      
      // Logging configuration
      logging: {
        level: getEnvVar(ENV_VARS.LOG_LEVEL, DEFAULT_LOGGING_CONFIG.LEVEL) as 'debug' | 'info' | 'warn' | 'error',
        requestLogging: getEnvVar(ENV_VARS.LOG_REQUESTS, DEFAULT_LOGGING_CONFIG.REQUEST_LOGGING, toBoolean),
        responseLogging: getEnvVar(ENV_VARS.LOG_RESPONSES, DEFAULT_LOGGING_CONFIG.RESPONSE_LOGGING, toBoolean),
        prettyPrint: getEnvVar(ENV_VARS.LOG_PRETTY, isDevelopment, toBoolean),
        journeyContext: true,
      },
      
      // Tracing configuration
      tracing: {
        enabled: getEnvVar(ENV_VARS.TRACING_ENABLED, DEFAULT_TRACING_CONFIG.ENABLED, toBoolean),
        serviceName: DEFAULT_TRACING_CONFIG.SERVICE_NAME,
        exporterEndpoint: getEnvVar(ENV_VARS.TRACING_EXPORTER_ENDPOINT, DEFAULT_TRACING_CONFIG.EXPORTER_ENDPOINT),
        sampleRate: getEnvVar(ENV_VARS.TRACING_SAMPLE_RATE, DEFAULT_TRACING_CONFIG.SAMPLE_RATE, toNumber),
      },
      
      // Backend service endpoints
      services: {
        auth: {
          url: getEnvVar(ENV_VARS.AUTH_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.AUTH.URL),
          timeout: getEnvVar(ENV_VARS.AUTH_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.AUTH.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.AUTH.HEALTH_CHECK_PATH,
        },
        health: {
          url: getEnvVar(ENV_VARS.HEALTH_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.HEALTH.URL),
          timeout: getEnvVar(ENV_VARS.HEALTH_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.HEALTH.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.HEALTH.HEALTH_CHECK_PATH,
        },
        care: {
          url: getEnvVar(ENV_VARS.CARE_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.CARE.URL),
          timeout: getEnvVar(ENV_VARS.CARE_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.CARE.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.CARE.HEALTH_CHECK_PATH,
        },
        plan: {
          url: getEnvVar(ENV_VARS.PLAN_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.PLAN.URL),
          timeout: getEnvVar(ENV_VARS.PLAN_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.PLAN.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.PLAN.HEALTH_CHECK_PATH,
        },
        gamification: {
          url: getEnvVar(ENV_VARS.GAMIFICATION_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.GAMIFICATION.URL),
          timeout: getEnvVar(ENV_VARS.GAMIFICATION_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.GAMIFICATION.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.GAMIFICATION.HEALTH_CHECK_PATH,
        },
        notification: {
          url: getEnvVar(ENV_VARS.NOTIFICATION_SERVICE_URL, DEFAULT_SERVICE_ENDPOINTS.NOTIFICATION.URL),
          timeout: getEnvVar(ENV_VARS.NOTIFICATION_SERVICE_TIMEOUT, DEFAULT_SERVICE_ENDPOINTS.NOTIFICATION.TIMEOUT, toNumber),
          healthCheckPath: DEFAULT_SERVICE_ENDPOINTS.NOTIFICATION.HEALTH_CHECK_PATH,
        },
        // Service discovery configuration
        discovery: {
          enabled: getEnvVar(ENV_VARS.SERVICE_DISCOVERY_ENABLED, DEFAULT_SERVICE_DISCOVERY.ENABLED, toBoolean),
          provider: getEnvVar(ENV_VARS.SERVICE_DISCOVERY_PROVIDER, DEFAULT_SERVICE_DISCOVERY.PROVIDER) as 'static' | 'dns' | 'kubernetes' | 'consul',
          refreshInterval: getEnvVar(ENV_VARS.SERVICE_DISCOVERY_REFRESH_INTERVAL, DEFAULT_SERVICE_DISCOVERY.REFRESH_INTERVAL, toNumber),
          namespace: getEnvVar(ENV_VARS.SERVICE_DISCOVERY_NAMESPACE, DEFAULT_SERVICE_DISCOVERY.NAMESPACE),
        },
      },
    };
  } catch (error) {
    console.error('Failed to load API Gateway configuration:', error);
    throw new Error(`Configuration error: ${error.message}`);
  }
});

// Export the configuration type
export type ApiGatewayConfig = ConfigType<typeof configuration>;

// Default export for simplicity
export default configuration;