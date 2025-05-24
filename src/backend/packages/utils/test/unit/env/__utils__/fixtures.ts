/**
 * Environment Variable Fixtures for Testing
 * 
 * This file provides standardized environment variable fixtures for consistent testing across
 * different environments (development, staging, production) and journey contexts (Health, Care, Plan).
 * 
 * Includes:
 * - Common configurations for different environments
 * - Journey-specific environment variables
 * - External integration configurations (Kafka, Redis, Prisma, OpenTelemetry)
 * - Error case fixtures for testing validation and error handling
 * - Feature flag fixtures for testing feature toggling
 */

/**
 * Base environment variable interface
 */
export interface EnvVars {
  [key: string]: string | undefined;
}

/**
 * Base environment configurations for different environments
 */
export const baseEnvFixtures = {
  /**
   * Development environment variables
   */
  development: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    PORT: '3000',
    HOST: 'localhost',
    API_PREFIX: '/api',
    CORS_ORIGIN: 'http://localhost:3000,http://localhost:8000',
    JWT_SECRET: 'dev-jwt-secret-key-for-testing-only',
    JWT_EXPIRATION: '1h',
    REFRESH_TOKEN_SECRET: 'dev-refresh-token-secret-for-testing-only',
    REFRESH_TOKEN_EXPIRATION: '7d',
  } as EnvVars,

  /**
   * Staging environment variables
   */
  staging: {
    NODE_ENV: 'staging',
    LOG_LEVEL: 'info',
    PORT: '3000',
    HOST: '0.0.0.0',
    API_PREFIX: '/api',
    CORS_ORIGIN: 'https://staging.austa-superapp.com',
    JWT_SECRET: 'staging-jwt-secret-key-for-testing-only',
    JWT_EXPIRATION: '30m',
    REFRESH_TOKEN_SECRET: 'staging-refresh-token-secret-for-testing-only',
    REFRESH_TOKEN_EXPIRATION: '7d',
  } as EnvVars,

  /**
   * Production environment variables
   */
  production: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'warn',
    PORT: '3000',
    HOST: '0.0.0.0',
    API_PREFIX: '/api',
    CORS_ORIGIN: 'https://app.austa-superapp.com',
    JWT_SECRET: 'prod-jwt-secret-key-for-testing-only',
    JWT_EXPIRATION: '15m',
    REFRESH_TOKEN_SECRET: 'prod-refresh-token-secret-for-testing-only',
    REFRESH_TOKEN_EXPIRATION: '7d',
  } as EnvVars,
};

/**
 * Journey-specific environment variables
 */
export const journeyEnvFixtures = {
  /**
   * Health journey environment variables
   */
  health: {
    HEALTH_SERVICE_URL: 'http://health-service:3000',
    HEALTH_SERVICE_TIMEOUT: '5000',
    HEALTH_METRICS_RETENTION_DAYS: '90',
    HEALTH_GOALS_ENABLED: 'true',
    HEALTH_INSIGHTS_ENABLED: 'true',
    HEALTH_WEARABLES_SYNC_INTERVAL: '15',
    HEALTH_FHIR_API_URL: 'https://fhir-api.example.com',
    HEALTH_FHIR_API_VERSION: 'R4',
  } as EnvVars,

  /**
   * Care journey environment variables
   */
  care: {
    CARE_SERVICE_URL: 'http://care-service:3000',
    CARE_SERVICE_TIMEOUT: '5000',
    CARE_APPOINTMENTS_ENABLED: 'true',
    CARE_TELEMEDICINE_ENABLED: 'true',
    CARE_SYMPTOM_CHECKER_ENABLED: 'true',
    CARE_PROVIDERS_SYNC_INTERVAL: '60',
    CARE_AGORA_APP_ID: 'test-agora-app-id',
    CARE_AGORA_APP_CERTIFICATE: 'test-agora-app-certificate',
  } as EnvVars,

  /**
   * Plan journey environment variables
   */
  plan: {
    PLAN_SERVICE_URL: 'http://plan-service:3000',
    PLAN_SERVICE_TIMEOUT: '5000',
    PLAN_BENEFITS_ENABLED: 'true',
    PLAN_CLAIMS_ENABLED: 'true',
    PLAN_DOCUMENTS_ENABLED: 'true',
    PLAN_COVERAGE_SYNC_INTERVAL: '60',
    PLAN_CLAIMS_AUTO_PROCESSING: 'true',
    PLAN_DOCUMENTS_STORAGE_BUCKET: 'austa-plan-documents-test',
  } as EnvVars,
};

/**
 * External integration environment variables
 */
export const integrationEnvFixtures = {
  /**
   * Kafka integration environment variables
   */
  kafka: {
    KAFKA_BROKERS: 'kafka:9092',
    KAFKA_CLIENT_ID: 'austa-service',
    KAFKA_GROUP_ID: 'austa-service-group',
    KAFKA_SSL_ENABLED: 'false',
    KAFKA_SASL_ENABLED: 'false',
    KAFKA_SASL_USERNAME: '',
    KAFKA_SASL_PASSWORD: '',
    KAFKA_CONSUMER_SESSION_TIMEOUT: '30000',
    KAFKA_CONSUMER_HEARTBEAT_INTERVAL: '3000',
    KAFKA_PRODUCER_COMPRESSION: 'gzip',
    KAFKA_PRODUCER_RETRY_MAX: '5',
    KAFKA_PRODUCER_RETRY_BACKOFF: '500',
  } as EnvVars,

  /**
   * Redis integration environment variables
   */
  redis: {
    REDIS_HOST: 'redis',
    REDIS_PORT: '6379',
    REDIS_PASSWORD: '',
    REDIS_DB: '0',
    REDIS_PREFIX: 'austa:',
    REDIS_TTL: '86400',
    REDIS_CLUSTER_ENABLED: 'false',
    REDIS_SENTINEL_ENABLED: 'false',
    REDIS_SENTINEL_MASTER: '',
    REDIS_SENTINEL_NODES: '',
    REDIS_POOL_MIN: '5',
    REDIS_POOL_MAX: '20',
  } as EnvVars,

  /**
   * Prisma/Database integration environment variables
   */
  prisma: {
    DATABASE_URL: 'postgresql://postgres:postgres@postgres:5432/austa?schema=public',
    DATABASE_POOL_MIN: '5',
    DATABASE_POOL_MAX: '10',
    DATABASE_CONNECTION_TIMEOUT: '30000',
    DATABASE_IDLE_TIMEOUT: '10000',
    DATABASE_SSL_ENABLED: 'false',
    DATABASE_DEBUG_ENABLED: 'true',
    DATABASE_QUERY_TIMEOUT: '30000',
    PRISMA_LOG_QUERIES: 'true',
    PRISMA_STUDIO_PORT: '5555',
  } as EnvVars,

  /**
   * OpenTelemetry integration environment variables
   */
  openTelemetry: {
    OTEL_ENABLED: 'true',
    OTEL_SERVICE_NAME: 'austa-service',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'http://otel-collector:4317',
    OTEL_EXPORTER_OTLP_PROTOCOL: 'grpc',
    OTEL_TRACES_SAMPLER: 'parentbased_traceidratio',
    OTEL_TRACES_SAMPLER_ARG: '0.1',
    OTEL_LOGS_EXPORTER: 'otlp',
    OTEL_METRICS_EXPORTER: 'otlp',
    OTEL_PROPAGATORS: 'tracecontext,baggage,b3',
    OTEL_RESOURCE_ATTRIBUTES: 'service.namespace=austa,service.version=1.0.0',
  } as EnvVars,
};

/**
 * Feature flag environment variables
 */
export const featureFlagEnvFixtures = {
  /**
   * Common feature flags
   */
  common: {
    FEATURE_DARK_MODE: 'true',
    FEATURE_NOTIFICATIONS: 'true',
    FEATURE_MULTI_LANGUAGE: 'true',
    FEATURE_ANALYTICS: 'true',
    FEATURE_FEEDBACK: 'true',
  } as EnvVars,

  /**
   * Health journey feature flags
   */
  health: {
    FEATURE_HEALTH_WEARABLES_SYNC: 'true',
    FEATURE_HEALTH_GOALS: 'true',
    FEATURE_HEALTH_INSIGHTS: 'true',
    FEATURE_HEALTH_SHARING: 'false',
    FEATURE_HEALTH_REPORTS: 'true',
  } as EnvVars,

  /**
   * Care journey feature flags
   */
  care: {
    FEATURE_CARE_TELEMEDICINE: 'true',
    FEATURE_CARE_APPOINTMENTS: 'true',
    FEATURE_CARE_SYMPTOM_CHECKER: 'true',
    FEATURE_CARE_MEDICATION_REMINDERS: 'true',
    FEATURE_CARE_PROVIDER_RATINGS: 'false',
  } as EnvVars,

  /**
   * Plan journey feature flags
   */
  plan: {
    FEATURE_PLAN_CLAIMS: 'true',
    FEATURE_PLAN_BENEFITS: 'true',
    FEATURE_PLAN_DOCUMENTS: 'true',
    FEATURE_PLAN_COVERAGE_CALCULATOR: 'true',
    FEATURE_PLAN_COMPARISON: 'false',
  } as EnvVars,

  /**
   * Gamification feature flags
   */
  gamification: {
    FEATURE_GAMIFICATION: 'true',
    FEATURE_ACHIEVEMENTS: 'true',
    FEATURE_QUESTS: 'true',
    FEATURE_REWARDS: 'true',
    FEATURE_LEADERBOARDS: 'true',
    FEATURE_XP_MULTIPLIERS: 'false',
  } as EnvVars,
};

/**
 * Error case environment variables for testing validation and error handling
 */
export const errorCaseEnvFixtures = {
  /**
   * Missing required variables
   */
  missingRequired: {
    // Missing NODE_ENV, PORT, HOST
    LOG_LEVEL: 'info',
    API_PREFIX: '/api',
  } as EnvVars,

  /**
   * Invalid format variables
   */
  invalidFormat: {
    NODE_ENV: 'invalid-env', // Should be development, staging, or production
    PORT: 'not-a-number', // Should be a number
    LOG_LEVEL: 'invalid-level', // Should be debug, info, warn, or error
    KAFKA_BROKERS: 'invalid-broker-format', // Should be host:port
    DATABASE_POOL_MIN: 'not-a-number', // Should be a number
    FEATURE_GAMIFICATION: 'not-a-boolean', // Should be true or false
  } as EnvVars,

  /**
   * Conflicting configurations
   */
  conflictingConfig: {
    NODE_ENV: 'production',
    LOG_LEVEL: 'debug', // Conflict: debug log level in production
    DATABASE_DEBUG_ENABLED: 'true', // Conflict: debug enabled in production
    PRISMA_LOG_QUERIES: 'true', // Conflict: query logging in production
    REDIS_PASSWORD: '', // Conflict: empty password in production
    KAFKA_SSL_ENABLED: 'false', // Conflict: SSL disabled in production
  } as EnvVars,

  /**
   * Invalid connection strings
   */
  invalidConnections: {
    DATABASE_URL: 'invalid-database-url',
    REDIS_HOST: 'non-existent-host',
    KAFKA_BROKERS: 'non-existent-broker:9092',
    OTEL_EXPORTER_OTLP_ENDPOINT: 'invalid-endpoint',
  } as EnvVars,
};

/**
 * Combined environment fixtures for different scenarios
 */
export const combinedEnvFixtures = {
  /**
   * Development environment with all journeys and integrations
   */
  fullDevelopment: {
    ...baseEnvFixtures.development,
    ...journeyEnvFixtures.health,
    ...journeyEnvFixtures.care,
    ...journeyEnvFixtures.plan,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...integrationEnvFixtures.openTelemetry,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.health,
    ...featureFlagEnvFixtures.care,
    ...featureFlagEnvFixtures.plan,
    ...featureFlagEnvFixtures.gamification,
  } as EnvVars,

  /**
   * Staging environment with all journeys and integrations
   */
  fullStaging: {
    ...baseEnvFixtures.staging,
    ...journeyEnvFixtures.health,
    ...journeyEnvFixtures.care,
    ...journeyEnvFixtures.plan,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...integrationEnvFixtures.openTelemetry,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.health,
    ...featureFlagEnvFixtures.care,
    ...featureFlagEnvFixtures.plan,
    ...featureFlagEnvFixtures.gamification,
  } as EnvVars,

  /**
   * Production environment with all journeys and integrations
   */
  fullProduction: {
    ...baseEnvFixtures.production,
    ...journeyEnvFixtures.health,
    ...journeyEnvFixtures.care,
    ...journeyEnvFixtures.plan,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...integrationEnvFixtures.openTelemetry,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.health,
    ...featureFlagEnvFixtures.care,
    ...featureFlagEnvFixtures.plan,
    ...featureFlagEnvFixtures.gamification,
    // Production-specific overrides
    LOG_LEVEL: 'info',
    DATABASE_DEBUG_ENABLED: 'false',
    PRISMA_LOG_QUERIES: 'false',
    KAFKA_SSL_ENABLED: 'true',
    KAFKA_SASL_ENABLED: 'true',
    REDIS_PASSWORD: 'strong-redis-password',
    DATABASE_SSL_ENABLED: 'true',
  } as EnvVars,

  /**
   * Minimal development environment with only essential variables
   */
  minimalDevelopment: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    PORT: '3000',
    HOST: 'localhost',
    API_PREFIX: '/api',
    DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/austa?schema=public',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    KAFKA_BROKERS: 'localhost:9092',
    JWT_SECRET: 'dev-jwt-secret-key-for-testing-only',
    JWT_EXPIRATION: '1h',
  } as EnvVars,

  /**
   * Health journey focused environment
   */
  healthJourney: {
    ...baseEnvFixtures.development,
    ...journeyEnvFixtures.health,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.health,
    ...featureFlagEnvFixtures.gamification,
  } as EnvVars,

  /**
   * Care journey focused environment
   */
  careJourney: {
    ...baseEnvFixtures.development,
    ...journeyEnvFixtures.care,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.care,
    ...featureFlagEnvFixtures.gamification,
  } as EnvVars,

  /**
   * Plan journey focused environment
   */
  planJourney: {
    ...baseEnvFixtures.development,
    ...journeyEnvFixtures.plan,
    ...integrationEnvFixtures.kafka,
    ...integrationEnvFixtures.redis,
    ...integrationEnvFixtures.prisma,
    ...featureFlagEnvFixtures.common,
    ...featureFlagEnvFixtures.plan,
    ...featureFlagEnvFixtures.gamification,
  } as EnvVars,
};

/**
 * Helper function to create a custom environment fixture by combining multiple fixtures
 * @param fixtures Array of environment fixtures to combine
 * @returns Combined environment variables
 */
export const createCustomEnvFixture = (...fixtures: EnvVars[]): EnvVars => {
  return fixtures.reduce((acc, fixture) => ({ ...acc, ...fixture }), {});
};