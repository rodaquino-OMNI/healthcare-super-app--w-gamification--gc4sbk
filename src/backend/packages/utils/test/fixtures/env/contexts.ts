/**
 * Environment Context Test Fixtures
 * 
 * This module provides standardized mock environment objects for different deployment contexts
 * (development, test, staging, production). These fixtures enable consistent testing of
 * environment-dependent functionality across different simulated environments without
 * requiring changes to the actual runtime environment.
 * 
 * Usage example:
 * ```typescript
 * import { developmentEnv } from '@austa/utils/test/fixtures/env/contexts';
 * 
 * // Test with development environment variables
 * process.env = { ...process.env, ...developmentEnv };
 * ```
 */

/**
 * Interface defining the structure of environment variables used across the application
 */
export interface EnvironmentVariables {
  // Application Configuration
  NODE_ENV: string;
  PORT: string;
  API_URL: string;
  LOG_LEVEL: string;
  
  // Database & Storage
  DATABASE_URL: string;
  TIMESCALE_URL: string;
  REDIS_URL: string;
  HEALTH_CACHE_TTL: string;
  CARE_CACHE_TTL: string;
  PLAN_CACHE_TTL: string;
  GAME_CACHE_TTL: string;
  DATABASE_SSL: string;
  METRICS_RETENTION_DAYS: string;
  METRICS_AGGREGATION_ENABLED: string;
  METRICS_AGGREGATION_INTERVALS: string;
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  S3_BUCKET: string;
  S3_BUCKET_REGION: string;
  
  // Authentication & Security
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  REFRESH_TOKEN_EXPIRATION: string;
  COGNITO_USER_POOL_ID: string;
  COGNITO_CLIENT_ID: string;
  COGNITO_CLIENT_SECRET: string;
  
  // Kafka Configuration
  KAFKA_BROKERS: string;
  KAFKA_CLIENT_ID: string;
  KAFKA_GROUP_ID: string;
  KAFKA_HEALTH_TOPIC: string;
  KAFKA_CARE_TOPIC: string;
  KAFKA_PLAN_TOPIC: string;
  KAFKA_GAME_TOPIC: string;
  KAFKA_USER_TOPIC: string;
  
  // Communication Services
  SENDGRID_API_KEY: string;
  EMAIL_FROM: string;
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  TWILIO_PHONE_NUMBER: string;
  ONE_SIGNAL_APP_ID: string;
  ONE_SIGNAL_REST_API_KEY: string;
  
  // External Integrations
  HL7_FHIR_BASE_URL: string;
  HL7_FHIR_USERNAME: string;
  HL7_FHIR_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_PUBLIC_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  AGORA_APP_ID: string;
  AGORA_APP_CERTIFICATE: string;
  
  // Wearable Integrations
  WEARABLES_SYNC_ENABLED: string;
  WEARABLES_SUPPORTED: string;
  GOOGLEFIT_CLIENT_ID: string;
  GOOGLEFIT_CLIENT_SECRET: string;
  HEALTHKIT_TEAM_ID: string;
  HEALTHKIT_KEY_ID: string;
  HEALTHKIT_PRIVATE_KEY: string;
  FITBIT_CLIENT_ID: string;
  FITBIT_CLIENT_SECRET: string;
  WEARABLES_SYNC_INTERVAL: string;
  WEARABLES_MAX_SYNC_DAYS: string;
  
  // Monitoring & Observability
  DATADOG_API_KEY: string;
  DATADOG_APP_KEY: string;
  DD_AGENT_HOST: string;
  DD_ENV: string;
  DD_SERVICE: string;
  DD_VERSION: string;
  SENTRY_DSN: string;
  SENTRY_ENVIRONMENT: string;
  SENTRY_RELEASE: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  RATE_LIMIT_HEALTH_JOURNEY: string;
  RATE_LIMIT_CARE_JOURNEY: string;
  RATE_LIMIT_PLAN_JOURNEY: string;
  
  // Feature Flags
  FEATURE_FLAGS: string;
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: string;
  CARE_JOURNEY_ENABLED: string;
  PLAN_JOURNEY_ENABLED: string;
  GAMIFICATION_ENABLED: string;
}

/**
 * Development environment variables
 * 
 * Configured for local development with:
 * - Local service endpoints
 * - Debug-level logging
 * - Local database connections
 * - Development API keys
 * - All features enabled for testing
 */
export const developmentEnv: EnvironmentVariables = {
  // Application Configuration
  NODE_ENV: 'development',
  PORT: '4000',
  API_URL: 'http://localhost:4000/graphql',
  LOG_LEVEL: 'debug',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  TIMESCALE_URL: 'postgresql://postgres:password@localhost:5432/austa_metrics',
  REDIS_URL: 'redis://localhost:6379',
  HEALTH_CACHE_TTL: '300',
  CARE_CACHE_TTL: '60',
  PLAN_CACHE_TTL: '900',
  GAME_CACHE_TTL: '60',
  DATABASE_SSL: 'false',
  METRICS_RETENTION_DAYS: '730',
  METRICS_AGGREGATION_ENABLED: 'true',
  METRICS_AGGREGATION_INTERVALS: 'hour,day,week,month',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'dev_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'dev_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-dev',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'dev_jwt_secret_key_for_testing_only',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'sa-east-1_devUserPool',
  COGNITO_CLIENT_ID: 'dev_cognito_client_id',
  COGNITO_CLIENT_SECRET: 'dev_cognito_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'austa-backend-dev',
  KAFKA_GROUP_ID: 'austa-backend-group-dev',
  KAFKA_HEALTH_TOPIC: 'health.events.dev',
  KAFKA_CARE_TOPIC: 'care.events.dev',
  KAFKA_PLAN_TOPIC: 'plan.events.dev',
  KAFKA_GAME_TOPIC: 'game.events.dev',
  KAFKA_USER_TOPIC: 'user.events.dev',
  
  // Communication Services
  SENDGRID_API_KEY: 'dev_sendgrid_api_key',
  EMAIL_FROM: 'dev-no-reply@austa.com.br',
  TWILIO_ACCOUNT_SID: 'dev_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'dev_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'dev_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'dev_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir-dev.example.com',
  HL7_FHIR_USERNAME: 'dev_fhir_username',
  HL7_FHIR_PASSWORD: 'dev_fhir_password',
  STRIPE_SECRET_KEY: 'dev_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'dev_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'dev_stripe_webhook_secret',
  AGORA_APP_ID: 'dev_agora_app_id',
  AGORA_APP_CERTIFICATE: 'dev_agora_app_certificate',
  
  // Wearable Integrations
  WEARABLES_SYNC_ENABLED: 'true',
  WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  GOOGLEFIT_CLIENT_ID: 'dev_googlefit_client_id',
  GOOGLEFIT_CLIENT_SECRET: 'dev_googlefit_client_secret',
  HEALTHKIT_TEAM_ID: 'dev_healthkit_team_id',
  HEALTHKIT_KEY_ID: 'dev_healthkit_key_id',
  HEALTHKIT_PRIVATE_KEY: 'dev_healthkit_private_key',
  FITBIT_CLIENT_ID: 'dev_fitbit_client_id',
  FITBIT_CLIENT_SECRET: 'dev_fitbit_client_secret',
  WEARABLES_SYNC_INTERVAL: '15',
  WEARABLES_MAX_SYNC_DAYS: '30',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'dev_datadog_api_key',
  DATADOG_APP_KEY: 'dev_datadog_app_key',
  DD_AGENT_HOST: 'localhost',
  DD_ENV: 'development',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'dev_sentry_dsn',
  SENTRY_ENVIRONMENT: 'development',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '1000', // Higher limit for development
  RATE_LIMIT_HEALTH_JOURNEY: '500',
  RATE_LIMIT_CARE_JOURNEY: '500',
  RATE_LIMIT_PLAN_JOURNEY: '500',
  
  // Feature Flags
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing,debug_mode',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true'
};

/**
 * Test environment variables
 * 
 * Configured for automated testing with:
 * - Test-specific endpoints
 * - Verbose logging for test debugging
 * - In-memory or test-specific databases
 * - Test API keys
 * - Controlled feature flags for test isolation
 */
export const testEnv: EnvironmentVariables = {
  // Application Configuration
  NODE_ENV: 'test',
  PORT: '4001',
  API_URL: 'http://localhost:4001/graphql',
  LOG_LEVEL: 'debug',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_test',
  TIMESCALE_URL: 'postgresql://postgres:password@localhost:5432/austa_metrics_test',
  REDIS_URL: 'redis://localhost:6379/1', // Using database 1 for test isolation
  HEALTH_CACHE_TTL: '60', // Shorter TTL for testing
  CARE_CACHE_TTL: '30',
  PLAN_CACHE_TTL: '60',
  GAME_CACHE_TTL: '30',
  DATABASE_SSL: 'false',
  METRICS_RETENTION_DAYS: '30', // Shorter retention for test data
  METRICS_AGGREGATION_ENABLED: 'true',
  METRICS_AGGREGATION_INTERVALS: 'hour,day',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'test_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'test_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-test',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'test_jwt_secret_key',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '86400', // 1 day for tests
  COGNITO_USER_POOL_ID: 'sa-east-1_testUserPool',
  COGNITO_CLIENT_ID: 'test_cognito_client_id',
  COGNITO_CLIENT_SECRET: 'test_cognito_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'austa-backend-test',
  KAFKA_GROUP_ID: 'austa-backend-group-test',
  KAFKA_HEALTH_TOPIC: 'health.events.test',
  KAFKA_CARE_TOPIC: 'care.events.test',
  KAFKA_PLAN_TOPIC: 'plan.events.test',
  KAFKA_GAME_TOPIC: 'game.events.test',
  KAFKA_USER_TOPIC: 'user.events.test',
  
  // Communication Services
  SENDGRID_API_KEY: 'test_sendgrid_api_key',
  EMAIL_FROM: 'test-no-reply@austa.com.br',
  TWILIO_ACCOUNT_SID: 'test_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'test_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'test_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'test_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir-test.example.com',
  HL7_FHIR_USERNAME: 'test_fhir_username',
  HL7_FHIR_PASSWORD: 'test_fhir_password',
  STRIPE_SECRET_KEY: 'test_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'test_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'test_stripe_webhook_secret',
  AGORA_APP_ID: 'test_agora_app_id',
  AGORA_APP_CERTIFICATE: 'test_agora_app_certificate',
  
  // Wearable Integrations
  WEARABLES_SYNC_ENABLED: 'true',
  WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  GOOGLEFIT_CLIENT_ID: 'test_googlefit_client_id',
  GOOGLEFIT_CLIENT_SECRET: 'test_googlefit_client_secret',
  HEALTHKIT_TEAM_ID: 'test_healthkit_team_id',
  HEALTHKIT_KEY_ID: 'test_healthkit_key_id',
  HEALTHKIT_PRIVATE_KEY: 'test_healthkit_private_key',
  FITBIT_CLIENT_ID: 'test_fitbit_client_id',
  FITBIT_CLIENT_SECRET: 'test_fitbit_client_secret',
  WEARABLES_SYNC_INTERVAL: '5', // Faster sync for tests
  WEARABLES_MAX_SYNC_DAYS: '7', // Shorter history for tests
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'test_datadog_api_key',
  DATADOG_APP_KEY: 'test_datadog_app_key',
  DD_AGENT_HOST: 'localhost',
  DD_ENV: 'test',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'test_sentry_dsn',
  SENTRY_ENVIRONMENT: 'test',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '60000', // 1 minute for tests
  RATE_LIMIT_MAX_REQUESTS: '10000', // Very high for tests
  RATE_LIMIT_HEALTH_JOURNEY: '5000',
  RATE_LIMIT_CARE_JOURNEY: '5000',
  RATE_LIMIT_PLAN_JOURNEY: '5000',
  
  // Feature Flags
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing,test_mode',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true'
};

/**
 * Staging environment variables
 * 
 * Configured for pre-production validation with:
 * - Staging service endpoints
 * - Production-like settings
 * - Staging databases with production schema
 * - Staging API keys
 * - Controlled feature rollout for testing
 */
export const stagingEnv: EnvironmentVariables = {
  // Application Configuration
  NODE_ENV: 'production', // Using production mode but in staging environment
  PORT: '4000',
  API_URL: 'https://api-staging.austa.com.br/graphql',
  LOG_LEVEL: 'info',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://austa_app:complex_password@austa-db-staging.cluster-xyz.sa-east-1.rds.amazonaws.com:5432/austa',
  TIMESCALE_URL: 'postgresql://austa_metrics:complex_password@austa-metrics-staging.cluster-xyz.sa-east-1.rds.amazonaws.com:5432/austa_metrics',
  REDIS_URL: 'redis://austa-redis-staging.xyz.sa-east-1.cache.amazonaws.com:6379',
  HEALTH_CACHE_TTL: '300',
  CARE_CACHE_TTL: '60',
  PLAN_CACHE_TTL: '900',
  GAME_CACHE_TTL: '60',
  DATABASE_SSL: 'true',
  METRICS_RETENTION_DAYS: '730',
  METRICS_AGGREGATION_ENABLED: 'true',
  METRICS_AGGREGATION_INTERVALS: 'hour,day,week,month',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'staging_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'staging_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-staging',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'staging_jwt_secret_key_complex_value',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'sa-east-1_stagingUserPool',
  COGNITO_CLIENT_ID: 'staging_cognito_client_id',
  COGNITO_CLIENT_SECRET: 'staging_cognito_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'b-1.austa-kafka-staging.xyz.sa-east-1.amazonaws.com:9092,b-2.austa-kafka-staging.xyz.sa-east-1.amazonaws.com:9092',
  KAFKA_CLIENT_ID: 'austa-backend-staging',
  KAFKA_GROUP_ID: 'austa-backend-group-staging',
  KAFKA_HEALTH_TOPIC: 'health.events',
  KAFKA_CARE_TOPIC: 'care.events',
  KAFKA_PLAN_TOPIC: 'plan.events',
  KAFKA_GAME_TOPIC: 'game.events',
  KAFKA_USER_TOPIC: 'user.events',
  
  // Communication Services
  SENDGRID_API_KEY: 'staging_sendgrid_api_key',
  EMAIL_FROM: 'no-reply@staging.austa.com.br',
  TWILIO_ACCOUNT_SID: 'staging_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'staging_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'staging_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'staging_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir-staging.example.com',
  HL7_FHIR_USERNAME: 'staging_fhir_username',
  HL7_FHIR_PASSWORD: 'staging_fhir_password',
  STRIPE_SECRET_KEY: 'staging_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'staging_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'staging_stripe_webhook_secret',
  AGORA_APP_ID: 'staging_agora_app_id',
  AGORA_APP_CERTIFICATE: 'staging_agora_app_certificate',
  
  // Wearable Integrations
  WEARABLES_SYNC_ENABLED: 'true',
  WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  GOOGLEFIT_CLIENT_ID: 'staging_googlefit_client_id',
  GOOGLEFIT_CLIENT_SECRET: 'staging_googlefit_client_secret',
  HEALTHKIT_TEAM_ID: 'staging_healthkit_team_id',
  HEALTHKIT_KEY_ID: 'staging_healthkit_key_id',
  HEALTHKIT_PRIVATE_KEY: 'staging_healthkit_private_key',
  FITBIT_CLIENT_ID: 'staging_fitbit_client_id',
  FITBIT_CLIENT_SECRET: 'staging_fitbit_client_secret',
  WEARABLES_SYNC_INTERVAL: '15',
  WEARABLES_MAX_SYNC_DAYS: '30',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'staging_datadog_api_key',
  DATADOG_APP_KEY: 'staging_datadog_app_key',
  DD_AGENT_HOST: 'datadog-agent.monitoring.svc.cluster.local',
  DD_ENV: 'staging',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'staging_sentry_dsn',
  SENTRY_ENVIRONMENT: 'staging',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '200',
  RATE_LIMIT_HEALTH_JOURNEY: '300',
  RATE_LIMIT_CARE_JOURNEY: '250',
  RATE_LIMIT_PLAN_JOURNEY: '200',
  
  // Feature Flags
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing,beta_features',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true'
};

/**
 * Production environment variables
 * 
 * Configured for live production use with:
 * - Production service endpoints
 * - Optimized settings for performance
 * - Production databases with high availability
 * - Production API keys with restricted permissions
 * - Carefully managed feature flags
 */
export const productionEnv: EnvironmentVariables = {
  // Application Configuration
  NODE_ENV: 'production',
  PORT: '4000',
  API_URL: 'https://api.austa.com.br/graphql',
  LOG_LEVEL: 'warn', // Less verbose logging in production
  
  // Database & Storage
  DATABASE_URL: 'postgresql://austa_app:very_complex_password@austa-db-prod.cluster-abc.sa-east-1.rds.amazonaws.com:5432/austa',
  TIMESCALE_URL: 'postgresql://austa_metrics:very_complex_password@austa-metrics-prod.cluster-abc.sa-east-1.rds.amazonaws.com:5432/austa_metrics',
  REDIS_URL: 'redis://austa-redis-prod.abc.sa-east-1.cache.amazonaws.com:6379',
  HEALTH_CACHE_TTL: '300',
  CARE_CACHE_TTL: '60',
  PLAN_CACHE_TTL: '900',
  GAME_CACHE_TTL: '60',
  DATABASE_SSL: 'true',
  METRICS_RETENTION_DAYS: '730',
  METRICS_AGGREGATION_ENABLED: 'true',
  METRICS_AGGREGATION_INTERVALS: 'hour,day,week,month',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'prod_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'prod_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-prod',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'prod_jwt_secret_key_very_complex_value',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'sa-east-1_prodUserPool',
  COGNITO_CLIENT_ID: 'prod_cognito_client_id',
  COGNITO_CLIENT_SECRET: 'prod_cognito_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'b-1.austa-kafka-prod.abc.sa-east-1.amazonaws.com:9092,b-2.austa-kafka-prod.abc.sa-east-1.amazonaws.com:9092,b-3.austa-kafka-prod.abc.sa-east-1.amazonaws.com:9092',
  KAFKA_CLIENT_ID: 'austa-backend-prod',
  KAFKA_GROUP_ID: 'austa-backend-group-prod',
  KAFKA_HEALTH_TOPIC: 'health.events',
  KAFKA_CARE_TOPIC: 'care.events',
  KAFKA_PLAN_TOPIC: 'plan.events',
  KAFKA_GAME_TOPIC: 'game.events',
  KAFKA_USER_TOPIC: 'user.events',
  
  // Communication Services
  SENDGRID_API_KEY: 'prod_sendgrid_api_key',
  EMAIL_FROM: 'no-reply@austa.com.br',
  TWILIO_ACCOUNT_SID: 'prod_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'prod_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'prod_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'prod_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir.example.com',
  HL7_FHIR_USERNAME: 'prod_fhir_username',
  HL7_FHIR_PASSWORD: 'prod_fhir_password',
  STRIPE_SECRET_KEY: 'prod_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'prod_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'prod_stripe_webhook_secret',
  AGORA_APP_ID: 'prod_agora_app_id',
  AGORA_APP_CERTIFICATE: 'prod_agora_app_certificate',
  
  // Wearable Integrations
  WEARABLES_SYNC_ENABLED: 'true',
  WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  GOOGLEFIT_CLIENT_ID: 'prod_googlefit_client_id',
  GOOGLEFIT_CLIENT_SECRET: 'prod_googlefit_client_secret',
  HEALTHKIT_TEAM_ID: 'prod_healthkit_team_id',
  HEALTHKIT_KEY_ID: 'prod_healthkit_key_id',
  HEALTHKIT_PRIVATE_KEY: 'prod_healthkit_private_key',
  FITBIT_CLIENT_ID: 'prod_fitbit_client_id',
  FITBIT_CLIENT_SECRET: 'prod_fitbit_client_secret',
  WEARABLES_SYNC_INTERVAL: '15',
  WEARABLES_MAX_SYNC_DAYS: '30',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'prod_datadog_api_key',
  DATADOG_APP_KEY: 'prod_datadog_app_key',
  DD_AGENT_HOST: 'datadog-agent.monitoring.svc.cluster.local',
  DD_ENV: 'production',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'prod_sentry_dsn',
  SENTRY_ENVIRONMENT: 'production',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  RATE_LIMIT_HEALTH_JOURNEY: '200',
  RATE_LIMIT_CARE_JOURNEY: '150',
  RATE_LIMIT_PLAN_JOURNEY: '100',
  
  // Feature Flags - More conservative in production
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true'
};