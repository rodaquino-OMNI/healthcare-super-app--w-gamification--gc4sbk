/**
 * Environment Variable Test Fixtures
 * 
 * This file provides standardized environment variable fixtures for testing across
 * different environments (development, staging, production) and journey contexts
 * (Health, Care, Plan). These fixtures enable consistent, DRY testing of
 * environment-dependent code paths.
 */

/**
 * Base environment fixtures for different deployment environments
 */
export const baseEnvironments = {
  development: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    PORT: '3000',
    API_URL: 'http://localhost:3000',
    CORS_ORIGINS: 'http://localhost:3000,http://localhost:3001',
    DEBUG: 'true',
    ENABLE_SWAGGER: 'true',
    ENABLE_PLAYGROUND: 'true',
  },
  staging: {
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    PORT: '3000',
    API_URL: 'https://api.staging.austa.health',
    CORS_ORIGINS: 'https://staging.austa.health',
    DEBUG: 'false',
    ENABLE_SWAGGER: 'true',
    ENABLE_PLAYGROUND: 'true',
  },
  production: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    PORT: '3000',
    API_URL: 'https://api.austa.health',
    CORS_ORIGINS: 'https://austa.health',
    DEBUG: 'false',
    ENABLE_SWAGGER: 'false',
    ENABLE_PLAYGROUND: 'false',
  },
};

/**
 * Journey-specific environment fixtures for Health journey
 */
export const healthJourneyEnvironments = {
  development: {
    HEALTH_SERVICE_URL: 'http://localhost:3001',
    HEALTH_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/health_dev',
    HEALTH_METRICS_RETENTION_DAYS: '90',
    HEALTH_GOALS_ENABLED: 'true',
    HEALTH_INSIGHTS_ENABLED: 'true',
    HEALTH_DEVICE_SYNC_INTERVAL: '15',
    HEALTH_FHIR_API_URL: 'http://localhost:8080/fhir',
    HEALTH_WEARABLE_SYNC_ENABLED: 'true',
  },
  staging: {
    HEALTH_SERVICE_URL: 'https://health-service.staging.austa.health',
    HEALTH_DATABASE_URL: 'postgresql://health_user:${HEALTH_DB_PASSWORD}@health-db.staging.austa.health:5432/health_staging',
    HEALTH_METRICS_RETENTION_DAYS: '180',
    HEALTH_GOALS_ENABLED: 'true',
    HEALTH_INSIGHTS_ENABLED: 'true',
    HEALTH_DEVICE_SYNC_INTERVAL: '30',
    HEALTH_FHIR_API_URL: 'https://fhir.staging.austa.health/fhir',
    HEALTH_WEARABLE_SYNC_ENABLED: 'true',
  },
  production: {
    HEALTH_SERVICE_URL: 'https://health-service.austa.health',
    HEALTH_DATABASE_URL: 'postgresql://health_user:${HEALTH_DB_PASSWORD}@health-db.austa.health:5432/health_prod',
    HEALTH_METRICS_RETENTION_DAYS: '365',
    HEALTH_GOALS_ENABLED: 'true',
    HEALTH_INSIGHTS_ENABLED: 'true',
    HEALTH_DEVICE_SYNC_INTERVAL: '60',
    HEALTH_FHIR_API_URL: 'https://fhir.austa.health/fhir',
    HEALTH_WEARABLE_SYNC_ENABLED: 'true',
  },
};

/**
 * Journey-specific environment fixtures for Care journey
 */
export const careJourneyEnvironments = {
  development: {
    CARE_SERVICE_URL: 'http://localhost:3002',
    CARE_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/care_dev',
    CARE_APPOINTMENTS_ENABLED: 'true',
    CARE_TELEMEDICINE_ENABLED: 'true',
    CARE_SYMPTOM_CHECKER_ENABLED: 'true',
    CARE_MEDICATIONS_ENABLED: 'true',
    CARE_PROVIDER_API_URL: 'http://localhost:8081/providers',
    CARE_APPOINTMENT_REMINDER_HOURS: '24',
  },
  staging: {
    CARE_SERVICE_URL: 'https://care-service.staging.austa.health',
    CARE_DATABASE_URL: 'postgresql://care_user:${CARE_DB_PASSWORD}@care-db.staging.austa.health:5432/care_staging',
    CARE_APPOINTMENTS_ENABLED: 'true',
    CARE_TELEMEDICINE_ENABLED: 'true',
    CARE_SYMPTOM_CHECKER_ENABLED: 'true',
    CARE_MEDICATIONS_ENABLED: 'true',
    CARE_PROVIDER_API_URL: 'https://providers.staging.austa.health/providers',
    CARE_APPOINTMENT_REMINDER_HOURS: '24',
  },
  production: {
    CARE_SERVICE_URL: 'https://care-service.austa.health',
    CARE_DATABASE_URL: 'postgresql://care_user:${CARE_DB_PASSWORD}@care-db.austa.health:5432/care_prod',
    CARE_APPOINTMENTS_ENABLED: 'true',
    CARE_TELEMEDICINE_ENABLED: 'true',
    CARE_SYMPTOM_CHECKER_ENABLED: 'true',
    CARE_MEDICATIONS_ENABLED: 'true',
    CARE_PROVIDER_API_URL: 'https://providers.austa.health/providers',
    CARE_APPOINTMENT_REMINDER_HOURS: '24',
  },
};

/**
 * Journey-specific environment fixtures for Plan journey
 */
export const planJourneyEnvironments = {
  development: {
    PLAN_SERVICE_URL: 'http://localhost:3003',
    PLAN_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/plan_dev',
    PLAN_BENEFITS_ENABLED: 'true',
    PLAN_CLAIMS_ENABLED: 'true',
    PLAN_COVERAGE_ENABLED: 'true',
    PLAN_DOCUMENTS_ENABLED: 'true',
    PLAN_INSURANCE_API_URL: 'http://localhost:8082/insurance',
    PLAN_CLAIM_PROCESSING_DAYS: '7',
  },
  staging: {
    PLAN_SERVICE_URL: 'https://plan-service.staging.austa.health',
    PLAN_DATABASE_URL: 'postgresql://plan_user:${PLAN_DB_PASSWORD}@plan-db.staging.austa.health:5432/plan_staging',
    PLAN_BENEFITS_ENABLED: 'true',
    PLAN_CLAIMS_ENABLED: 'true',
    PLAN_COVERAGE_ENABLED: 'true',
    PLAN_DOCUMENTS_ENABLED: 'true',
    PLAN_INSURANCE_API_URL: 'https://insurance.staging.austa.health/insurance',
    PLAN_CLAIM_PROCESSING_DAYS: '7',
  },
  production: {
    PLAN_SERVICE_URL: 'https://plan-service.austa.health',
    PLAN_DATABASE_URL: 'postgresql://plan_user:${PLAN_DB_PASSWORD}@plan-db.austa.health:5432/plan_prod',
    PLAN_BENEFITS_ENABLED: 'true',
    PLAN_CLAIMS_ENABLED: 'true',
    PLAN_COVERAGE_ENABLED: 'true',
    PLAN_DOCUMENTS_ENABLED: 'true',
    PLAN_INSURANCE_API_URL: 'https://insurance.austa.health/insurance',
    PLAN_CLAIM_PROCESSING_DAYS: '7',
  },
};

/**
 * Gamification environment fixtures
 */
export const gamificationEnvironments = {
  development: {
    GAMIFICATION_SERVICE_URL: 'http://localhost:3004',
    GAMIFICATION_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/gamification_dev',
    GAMIFICATION_ACHIEVEMENTS_ENABLED: 'true',
    GAMIFICATION_QUESTS_ENABLED: 'true',
    GAMIFICATION_REWARDS_ENABLED: 'true',
    GAMIFICATION_LEADERBOARD_ENABLED: 'true',
    GAMIFICATION_RULES_REFRESH_INTERVAL: '60',
    GAMIFICATION_XP_MULTIPLIER: '1.0',
  },
  staging: {
    GAMIFICATION_SERVICE_URL: 'https://gamification-service.staging.austa.health',
    GAMIFICATION_DATABASE_URL: 'postgresql://gamification_user:${GAMIFICATION_DB_PASSWORD}@gamification-db.staging.austa.health:5432/gamification_staging',
    GAMIFICATION_ACHIEVEMENTS_ENABLED: 'true',
    GAMIFICATION_QUESTS_ENABLED: 'true',
    GAMIFICATION_REWARDS_ENABLED: 'true',
    GAMIFICATION_LEADERBOARD_ENABLED: 'true',
    GAMIFICATION_RULES_REFRESH_INTERVAL: '300',
    GAMIFICATION_XP_MULTIPLIER: '1.0',
  },
  production: {
    GAMIFICATION_SERVICE_URL: 'https://gamification-service.austa.health',
    GAMIFICATION_DATABASE_URL: 'postgresql://gamification_user:${GAMIFICATION_DB_PASSWORD}@gamification-db.austa.health:5432/gamification_prod',
    GAMIFICATION_ACHIEVEMENTS_ENABLED: 'true',
    GAMIFICATION_QUESTS_ENABLED: 'true',
    GAMIFICATION_REWARDS_ENABLED: 'true',
    GAMIFICATION_LEADERBOARD_ENABLED: 'true',
    GAMIFICATION_RULES_REFRESH_INTERVAL: '600',
    GAMIFICATION_XP_MULTIPLIER: '1.0',
  },
};

/**
 * Authentication environment fixtures
 */
export const authEnvironments = {
  development: {
    AUTH_SERVICE_URL: 'http://localhost:3005',
    AUTH_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/auth_dev',
    JWT_SECRET: 'dev-jwt-secret-key-for-testing-only',
    JWT_EXPIRATION: '1h',
    REFRESH_TOKEN_SECRET: 'dev-refresh-token-secret-key-for-testing-only',
    REFRESH_TOKEN_EXPIRATION: '7d',
    AUTH_REDIS_URL: 'redis://localhost:6379/0',
    AUTH_RATE_LIMIT_MAX: '100',
    AUTH_RATE_LIMIT_WINDOW_MS: '900000',
    AUTH_OAUTH_ENABLED: 'true',
  },
  staging: {
    AUTH_SERVICE_URL: 'https://auth-service.staging.austa.health',
    AUTH_DATABASE_URL: 'postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db.staging.austa.health:5432/auth_staging',
    JWT_SECRET: '${JWT_SECRET}',
    JWT_EXPIRATION: '15m',
    REFRESH_TOKEN_SECRET: '${REFRESH_TOKEN_SECRET}',
    REFRESH_TOKEN_EXPIRATION: '7d',
    AUTH_REDIS_URL: 'redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@auth-redis.staging.austa.health:6379/0',
    AUTH_RATE_LIMIT_MAX: '100',
    AUTH_RATE_LIMIT_WINDOW_MS: '900000',
    AUTH_OAUTH_ENABLED: 'true',
  },
  production: {
    AUTH_SERVICE_URL: 'https://auth-service.austa.health',
    AUTH_DATABASE_URL: 'postgresql://auth_user:${AUTH_DB_PASSWORD}@auth-db.austa.health:5432/auth_prod',
    JWT_SECRET: '${JWT_SECRET}',
    JWT_EXPIRATION: '15m',
    REFRESH_TOKEN_SECRET: '${REFRESH_TOKEN_SECRET}',
    REFRESH_TOKEN_EXPIRATION: '7d',
    AUTH_REDIS_URL: 'redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@auth-redis.austa.health:6379/0',
    AUTH_RATE_LIMIT_MAX: '50',
    AUTH_RATE_LIMIT_WINDOW_MS: '900000',
    AUTH_OAUTH_ENABLED: 'true',
  },
};

/**
 * Notification service environment fixtures
 */
export const notificationEnvironments = {
  development: {
    NOTIFICATION_SERVICE_URL: 'http://localhost:3006',
    NOTIFICATION_DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/notification_dev',
    NOTIFICATION_EMAIL_ENABLED: 'true',
    NOTIFICATION_SMS_ENABLED: 'true',
    NOTIFICATION_PUSH_ENABLED: 'true',
    NOTIFICATION_IN_APP_ENABLED: 'true',
    NOTIFICATION_EMAIL_FROM: 'dev@austa.health',
    NOTIFICATION_RETRY_MAX_ATTEMPTS: '3',
    NOTIFICATION_RETRY_DELAY_MS: '1000',
    NOTIFICATION_WEBSOCKET_ENABLED: 'true',
  },
  staging: {
    NOTIFICATION_SERVICE_URL: 'https://notification-service.staging.austa.health',
    NOTIFICATION_DATABASE_URL: 'postgresql://notification_user:${NOTIFICATION_DB_PASSWORD}@notification-db.staging.austa.health:5432/notification_staging',
    NOTIFICATION_EMAIL_ENABLED: 'true',
    NOTIFICATION_SMS_ENABLED: 'true',
    NOTIFICATION_PUSH_ENABLED: 'true',
    NOTIFICATION_IN_APP_ENABLED: 'true',
    NOTIFICATION_EMAIL_FROM: 'no-reply@staging.austa.health',
    NOTIFICATION_RETRY_MAX_ATTEMPTS: '5',
    NOTIFICATION_RETRY_DELAY_MS: '5000',
    NOTIFICATION_WEBSOCKET_ENABLED: 'true',
  },
  production: {
    NOTIFICATION_SERVICE_URL: 'https://notification-service.austa.health',
    NOTIFICATION_DATABASE_URL: 'postgresql://notification_user:${NOTIFICATION_DB_PASSWORD}@notification-db.austa.health:5432/notification_prod',
    NOTIFICATION_EMAIL_ENABLED: 'true',
    NOTIFICATION_SMS_ENABLED: 'true',
    NOTIFICATION_PUSH_ENABLED: 'true',
    NOTIFICATION_IN_APP_ENABLED: 'true',
    NOTIFICATION_EMAIL_FROM: 'no-reply@austa.health',
    NOTIFICATION_RETRY_MAX_ATTEMPTS: '5',
    NOTIFICATION_RETRY_DELAY_MS: '10000',
    NOTIFICATION_WEBSOCKET_ENABLED: 'true',
  },
};

/**
 * API Gateway environment fixtures
 */
export const apiGatewayEnvironments = {
  development: {
    API_GATEWAY_PORT: '4000',
    API_GATEWAY_TIMEOUT_MS: '30000',
    API_GATEWAY_RATE_LIMIT_MAX: '100',
    API_GATEWAY_RATE_LIMIT_WINDOW_MS: '900000',
    API_GATEWAY_GRAPHQL_PATH: '/graphql',
    API_GATEWAY_REST_PREFIX: '/api',
    API_GATEWAY_HEALTH_PATH: '/health',
    API_GATEWAY_AUTH_SERVICE_URL: 'http://localhost:3005',
    API_GATEWAY_HEALTH_SERVICE_URL: 'http://localhost:3001',
    API_GATEWAY_CARE_SERVICE_URL: 'http://localhost:3002',
    API_GATEWAY_PLAN_SERVICE_URL: 'http://localhost:3003',
    API_GATEWAY_GAMIFICATION_SERVICE_URL: 'http://localhost:3004',
    API_GATEWAY_NOTIFICATION_SERVICE_URL: 'http://localhost:3006',
  },
  staging: {
    API_GATEWAY_PORT: '4000',
    API_GATEWAY_TIMEOUT_MS: '30000',
    API_GATEWAY_RATE_LIMIT_MAX: '100',
    API_GATEWAY_RATE_LIMIT_WINDOW_MS: '900000',
    API_GATEWAY_GRAPHQL_PATH: '/graphql',
    API_GATEWAY_REST_PREFIX: '/api',
    API_GATEWAY_HEALTH_PATH: '/health',
    API_GATEWAY_AUTH_SERVICE_URL: 'http://auth-service:3005',
    API_GATEWAY_HEALTH_SERVICE_URL: 'http://health-service:3001',
    API_GATEWAY_CARE_SERVICE_URL: 'http://care-service:3002',
    API_GATEWAY_PLAN_SERVICE_URL: 'http://plan-service:3003',
    API_GATEWAY_GAMIFICATION_SERVICE_URL: 'http://gamification-service:3004',
    API_GATEWAY_NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
  },
  production: {
    API_GATEWAY_PORT: '4000',
    API_GATEWAY_TIMEOUT_MS: '30000',
    API_GATEWAY_RATE_LIMIT_MAX: '50',
    API_GATEWAY_RATE_LIMIT_WINDOW_MS: '900000',
    API_GATEWAY_GRAPHQL_PATH: '/graphql',
    API_GATEWAY_REST_PREFIX: '/api',
    API_GATEWAY_HEALTH_PATH: '/health',
    API_GATEWAY_AUTH_SERVICE_URL: 'http://auth-service:3005',
    API_GATEWAY_HEALTH_SERVICE_URL: 'http://health-service:3001',
    API_GATEWAY_CARE_SERVICE_URL: 'http://care-service:3002',
    API_GATEWAY_PLAN_SERVICE_URL: 'http://plan-service:3003',
    API_GATEWAY_GAMIFICATION_SERVICE_URL: 'http://gamification-service:3004',
    API_GATEWAY_NOTIFICATION_SERVICE_URL: 'http://notification-service:3006',
  },
};

/**
 * External integration environment fixtures
 */
export const externalIntegrationEnvironments = {
  // Kafka integration
  kafka: {
    development: {
      KAFKA_BROKERS: 'localhost:9092',
      KAFKA_CLIENT_ID: 'austa-dev',
      KAFKA_GROUP_ID: 'austa-dev-group',
      KAFKA_SSL_ENABLED: 'false',
      KAFKA_SASL_ENABLED: 'false',
      KAFKA_RETRY_MAX_ATTEMPTS: '3',
      KAFKA_RETRY_DELAY_MS: '1000',
    },
    staging: {
      KAFKA_BROKERS: 'kafka-broker.staging.austa.health:9092',
      KAFKA_CLIENT_ID: 'austa-staging',
      KAFKA_GROUP_ID: 'austa-staging-group',
      KAFKA_SSL_ENABLED: 'true',
      KAFKA_SASL_ENABLED: 'true',
      KAFKA_SASL_USERNAME: '${KAFKA_SASL_USERNAME}',
      KAFKA_SASL_PASSWORD: '${KAFKA_SASL_PASSWORD}',
      KAFKA_RETRY_MAX_ATTEMPTS: '5',
      KAFKA_RETRY_DELAY_MS: '5000',
    },
    production: {
      KAFKA_BROKERS: 'kafka-broker.austa.health:9092',
      KAFKA_CLIENT_ID: 'austa-production',
      KAFKA_GROUP_ID: 'austa-production-group',
      KAFKA_SSL_ENABLED: 'true',
      KAFKA_SASL_ENABLED: 'true',
      KAFKA_SASL_USERNAME: '${KAFKA_SASL_USERNAME}',
      KAFKA_SASL_PASSWORD: '${KAFKA_SASL_PASSWORD}',
      KAFKA_RETRY_MAX_ATTEMPTS: '5',
      KAFKA_RETRY_DELAY_MS: '10000',
    },
  },
  
  // Redis integration
  redis: {
    development: {
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '',
      REDIS_USERNAME: '',
      REDIS_DB: '0',
      REDIS_TLS_ENABLED: 'false',
      REDIS_SENTINEL_ENABLED: 'false',
    },
    staging: {
      REDIS_HOST: 'redis.staging.austa.health',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '${REDIS_PASSWORD}',
      REDIS_USERNAME: '${REDIS_USERNAME}',
      REDIS_DB: '0',
      REDIS_TLS_ENABLED: 'true',
      REDIS_SENTINEL_ENABLED: 'false',
    },
    production: {
      REDIS_HOST: 'redis.austa.health',
      REDIS_PORT: '6379',
      REDIS_PASSWORD: '${REDIS_PASSWORD}',
      REDIS_USERNAME: '${REDIS_USERNAME}',
      REDIS_DB: '0',
      REDIS_TLS_ENABLED: 'true',
      REDIS_SENTINEL_ENABLED: 'true',
      REDIS_SENTINEL_MASTER: 'mymaster',
      REDIS_SENTINEL_NODES: 'redis-sentinel-0.austa.health:26379,redis-sentinel-1.austa.health:26379,redis-sentinel-2.austa.health:26379',
    },
  },
  
  // Prisma integration
  prisma: {
    development: {
      PRISMA_LOG_LEVEL: 'info',
      PRISMA_LOG_QUERIES: 'true',
      PRISMA_CONNECTION_LIMIT: '5',
      PRISMA_POOL_TIMEOUT: '10',
    },
    staging: {
      PRISMA_LOG_LEVEL: 'warn',
      PRISMA_LOG_QUERIES: 'false',
      PRISMA_CONNECTION_LIMIT: '10',
      PRISMA_POOL_TIMEOUT: '20',
    },
    production: {
      PRISMA_LOG_LEVEL: 'error',
      PRISMA_LOG_QUERIES: 'false',
      PRISMA_CONNECTION_LIMIT: '20',
      PRISMA_POOL_TIMEOUT: '30',
    },
  },
  
  // OpenTelemetry integration
  openTelemetry: {
    development: {
      OTEL_ENABLED: 'true',
      OTEL_SERVICE_NAME: 'austa-dev',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
      OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
      OTEL_TRACES_SAMPLER: 'always_on',
      OTEL_LOGS_EXPORTER: 'console',
    },
    staging: {
      OTEL_ENABLED: 'true',
      OTEL_SERVICE_NAME: 'austa-staging',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector.staging.austa.health:4318',
      OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
      OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
      OTEL_TRACES_SAMPLER_ARG: '0.5',
      OTEL_LOGS_EXPORTER: 'otlp',
    },
    production: {
      OTEL_ENABLED: 'true',
      OTEL_SERVICE_NAME: 'austa-production',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector.austa.health:4318',
      OTEL_EXPORTER_OTLP_PROTOCOL: 'http/protobuf',
      OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
      OTEL_TRACES_SAMPLER_ARG: '0.1',
      OTEL_LOGS_EXPORTER: 'otlp',
    },
  },
};

/**
 * Feature flag environment fixtures
 */
export const featureFlagEnvironments = {
  development: {
    FEATURE_NEW_HEALTH_DASHBOARD: 'true',
    FEATURE_ENHANCED_TELEMEDICINE: 'true',
    FEATURE_ADVANCED_CLAIMS_PROCESSING: 'true',
    FEATURE_SOCIAL_SHARING: 'true',
    FEATURE_MULTI_LANGUAGE: 'true',
    FEATURE_DARK_MODE: 'true',
    FEATURE_BETA_FEATURES: 'true',
  },
  staging: {
    FEATURE_NEW_HEALTH_DASHBOARD: 'true',
    FEATURE_ENHANCED_TELEMEDICINE: 'true',
    FEATURE_ADVANCED_CLAIMS_PROCESSING: 'false',
    FEATURE_SOCIAL_SHARING: 'true',
    FEATURE_MULTI_LANGUAGE: 'true',
    FEATURE_DARK_MODE: 'true',
    FEATURE_BETA_FEATURES: 'true',
  },
  production: {
    FEATURE_NEW_HEALTH_DASHBOARD: 'false',
    FEATURE_ENHANCED_TELEMEDICINE: 'false',
    FEATURE_ADVANCED_CLAIMS_PROCESSING: 'false',
    FEATURE_SOCIAL_SHARING: 'false',
    FEATURE_MULTI_LANGUAGE: 'true',
    FEATURE_DARK_MODE: 'true',
    FEATURE_BETA_FEATURES: 'false',
  },
};

/**
 * Error case fixtures for testing validation and error handling
 */
export const errorCaseFixtures = {
  // Missing required variables
  missingRequired: {
    // Missing NODE_ENV
    LOG_LEVEL: 'info',
    PORT: '3000',
  },
  
  // Invalid variable types
  invalidTypes: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'info',
    PORT: 'not-a-number', // Should be a number
    DEBUG: 'not-a-boolean', // Should be a boolean
    HEALTH_METRICS_RETENTION_DAYS: 'invalid-number', // Should be a number
    KAFKA_RETRY_MAX_ATTEMPTS: 'three', // Should be a number
  },
  
  // Invalid enum values
  invalidEnums: {
    NODE_ENV: 'invalid-environment', // Should be development, staging, or production
    LOG_LEVEL: 'extreme', // Should be debug, info, warn, error, or fatal
  },
  
  // Invalid URL formats
  invalidUrls: {
    API_URL: 'not-a-url',
    HEALTH_SERVICE_URL: 'invalid-url-format',
    KAFKA_BROKERS: 'not:a:valid:broker:format',
  },
  
  // Invalid numeric ranges
  invalidRanges: {
    PORT: '70000', // Port should be between 1 and 65535
    HEALTH_METRICS_RETENTION_DAYS: '-10', // Should be positive
    KAFKA_RETRY_MAX_ATTEMPTS: '0', // Should be at least 1
  },
  
  // Malformed JSON
  malformedJson: {
    CONFIG_JSON: '{"key": "value", malformed}', // Invalid JSON
  },
};

/**
 * Helper function to merge environment fixtures
 */
export function createTestEnvironment(env: 'development' | 'staging' | 'production', options: {
  includeBase?: boolean;
  includeHealth?: boolean;
  includeCare?: boolean;
  includePlan?: boolean;
  includeGamification?: boolean;
  includeAuth?: boolean;
  includeNotification?: boolean;
  includeApiGateway?: boolean;
  includeKafka?: boolean;
  includeRedis?: boolean;
  includePrisma?: boolean;
  includeOpenTelemetry?: boolean;
  includeFeatureFlags?: boolean;
} = {}) {
  const {
    includeBase = true,
    includeHealth = false,
    includeCare = false,
    includePlan = false,
    includeGamification = false,
    includeAuth = false,
    includeNotification = false,
    includeApiGateway = false,
    includeKafka = false,
    includeRedis = false,
    includePrisma = false,
    includeOpenTelemetry = false,
    includeFeatureFlags = false,
  } = options;

  let result: Record<string, string> = {};

  if (includeBase) {
    result = { ...result, ...baseEnvironments[env] };
  }

  if (includeHealth) {
    result = { ...result, ...healthJourneyEnvironments[env] };
  }

  if (includeCare) {
    result = { ...result, ...careJourneyEnvironments[env] };
  }

  if (includePlan) {
    result = { ...result, ...planJourneyEnvironments[env] };
  }

  if (includeGamification) {
    result = { ...result, ...gamificationEnvironments[env] };
  }

  if (includeAuth) {
    result = { ...result, ...authEnvironments[env] };
  }

  if (includeNotification) {
    result = { ...result, ...notificationEnvironments[env] };
  }

  if (includeApiGateway) {
    result = { ...result, ...apiGatewayEnvironments[env] };
  }

  if (includeKafka) {
    result = { ...result, ...externalIntegrationEnvironments.kafka[env] };
  }

  if (includeRedis) {
    result = { ...result, ...externalIntegrationEnvironments.redis[env] };
  }

  if (includePrisma) {
    result = { ...result, ...externalIntegrationEnvironments.prisma[env] };
  }

  if (includeOpenTelemetry) {
    result = { ...result, ...externalIntegrationEnvironments.openTelemetry[env] };
  }

  if (includeFeatureFlags) {
    result = { ...result, ...featureFlagEnvironments[env] };
  }

  return result;
}

/**
 * Common environment fixture combinations for testing
 */
export const commonFixtures = {
  // Complete development environment with all features
  fullDevelopment: createTestEnvironment('development', {
    includeBase: true,
    includeHealth: true,
    includeCare: true,
    includePlan: true,
    includeGamification: true,
    includeAuth: true,
    includeNotification: true,
    includeApiGateway: true,
    includeKafka: true,
    includeRedis: true,
    includePrisma: true,
    includeOpenTelemetry: true,
    includeFeatureFlags: true,
  }),
  
  // Minimal production environment with only base settings
  minimalProduction: createTestEnvironment('production', {
    includeBase: true,
  }),
  
  // Health journey focused environment
  healthJourney: createTestEnvironment('development', {
    includeBase: true,
    includeHealth: true,
    includeGamification: true,
    includeKafka: true,
    includeFeatureFlags: true,
  }),
  
  // Care journey focused environment
  careJourney: createTestEnvironment('development', {
    includeBase: true,
    includeCare: true,
    includeGamification: true,
    includeKafka: true,
    includeFeatureFlags: true,
  }),
  
  // Plan journey focused environment
  planJourney: createTestEnvironment('development', {
    includeBase: true,
    includePlan: true,
    includeGamification: true,
    includeKafka: true,
    includeFeatureFlags: true,
  }),
};