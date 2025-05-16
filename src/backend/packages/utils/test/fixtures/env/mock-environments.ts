/**
 * Mock Environment Objects for Testing
 * 
 * This module provides complete mock environment objects for integration testing of environment utilities.
 * These fixtures include full sets of environment variables that mimic real production environments,
 * with values for all required variables across different contexts.
 */

import { JourneyType } from '../../../src/env/journey';
import { AppEnvConfig, DatabaseConfig, KafkaConfig, LoggingConfig, RedisConfig } from '../../../src/env/types';

/**
 * Base mock environment with common variables
 * Contains all shared environment variables used across services
 */
export const baseMockEnvironment: Record<string, string> = {
  // Application Configuration
  NODE_ENV: 'test',
  PORT: '4000',
  API_URL: 'http://localhost:4000/graphql',
  LOG_LEVEL: 'info',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_test',
  TIMESCALE_URL: 'postgresql://postgres:password@localhost:5432/austa_metrics_test',
  REDIS_URL: 'redis://localhost:6379/1',
  HEALTH_CACHE_TTL: '300',
  CARE_CACHE_TTL: '60',
  PLAN_CACHE_TTL: '900',
  GAME_CACHE_TTL: '60',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'test_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'test_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-test',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'test_jwt_secret_key',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'test_user_pool_id',
  COGNITO_CLIENT_ID: 'test_client_id',
  COGNITO_CLIENT_SECRET: 'test_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'austa-backend-test',
  KAFKA_GROUP_ID: 'austa-backend-test-group',
  KAFKA_HEALTH_TOPIC: 'health.events.test',
  KAFKA_CARE_TOPIC: 'care.events.test',
  KAFKA_PLAN_TOPIC: 'plan.events.test',
  KAFKA_GAME_TOPIC: 'game.events.test',
  KAFKA_USER_TOPIC: 'user.events.test',
  
  // Communication Services
  SENDGRID_API_KEY: 'test_sendgrid_api_key',
  EMAIL_FROM: 'no-reply-test@austa.com.br',
  TWILIO_ACCOUNT_SID: 'test_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'test_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'test_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'test_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir.test.example.com',
  HL7_FHIR_USERNAME: 'test_fhir_username',
  HL7_FHIR_PASSWORD: 'test_fhir_password',
  STRIPE_SECRET_KEY: 'test_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'test_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'test_stripe_webhook_secret',
  AGORA_APP_ID: 'test_agora_app_id',
  AGORA_APP_CERTIFICATE: 'test_agora_app_certificate',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'test_datadog_api_key',
  DATADOG_APP_KEY: 'test_datadog_app_key',
  DD_AGENT_HOST: 'localhost',
  DD_ENV: 'test',
  DD_SERVICE: 'austa-backend-test',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'https://test@sentry.io/1234567',
  SENTRY_ENVIRONMENT: 'test',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  RATE_LIMIT_HEALTH_JOURNEY: '200',
  RATE_LIMIT_CARE_JOURNEY: '150',
  RATE_LIMIT_PLAN_JOURNEY: '100',
  
  // Feature Flags
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true'
};

/**
 * Health Journey mock environment
 * Contains all environment variables specific to the Health journey
 */
export const healthMockEnvironment: Record<string, string> = {
  // Core configuration
  HEALTH_NODE_ENV: 'test',
  HEALTH_PORT: '3001',
  HEALTH_API_PREFIX: 'api/v1',
  
  // Database configuration
  HEALTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_health_test',
  HEALTH_DATABASE_SSL: 'false',
  
  // TimescaleDB configuration
  HEALTH_TIMESCALE_ENABLED: 'true',
  HEALTH_METRICS_RETENTION_DAYS: '730',
  HEALTH_METRICS_AGGREGATION_ENABLED: 'true',
  HEALTH_METRICS_AGGREGATION_INTERVALS: 'hour,day,week,month',
  
  // FHIR API configuration
  HEALTH_FHIR_API_ENABLED: 'true',
  HEALTH_FHIR_API_URL: 'https://fhir.test.example.com',
  HEALTH_FHIR_API_AUTH_TYPE: 'oauth2',
  HEALTH_FHIR_API_CLIENT_ID: 'test_fhir_client_id',
  HEALTH_FHIR_API_CLIENT_SECRET: 'test_fhir_client_secret',
  HEALTH_FHIR_API_SCOPE: 'patient/*.read',
  HEALTH_FHIR_API_TOKEN_URL: 'https://fhir.test.example.com/oauth2/token',
  HEALTH_FHIR_API_TIMEOUT: '10000',
  
  // Wearables configuration
  HEALTH_WEARABLES_SYNC_ENABLED: 'true',
  HEALTH_WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  HEALTH_GOOGLEFIT_CLIENT_ID: 'test_googlefit_client_id',
  HEALTH_GOOGLEFIT_CLIENT_SECRET: 'test_googlefit_client_secret',
  HEALTH_HEALTHKIT_TEAM_ID: 'test_healthkit_team_id',
  HEALTH_HEALTHKIT_KEY_ID: 'test_healthkit_key_id',
  HEALTH_HEALTHKIT_PRIVATE_KEY: 'test_healthkit_private_key',
  HEALTH_FITBIT_CLIENT_ID: 'test_fitbit_client_id',
  HEALTH_FITBIT_CLIENT_SECRET: 'test_fitbit_client_secret',
  HEALTH_WEARABLES_SYNC_INTERVAL: '15',
  HEALTH_WEARABLES_MAX_SYNC_DAYS: '30',
  
  // Health Goals configuration
  HEALTH_HEALTH_GOALS_MAX_ACTIVE: '10',
  
  // Health Insights configuration
  HEALTH_HEALTH_INSIGHTS_ENABLED: 'true',
  HEALTH_HEALTH_INSIGHTS_GENERATION_INTERVAL: '24',
  HEALTH_HEALTH_INSIGHTS_MODELS_PATH: '/app/models/health',
  
  // Event streaming configuration
  HEALTH_EVENTS_KAFKA_ENABLED: 'true',
  HEALTH_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  HEALTH_EVENTS_TOPIC_PREFIX: 'austa.health.test',
  
  // Redis configuration
  HEALTH_REDIS_URL: 'redis://localhost:6379/1',
  HEALTH_REDIS_TTL: '3600',
  
  // Medical history configuration
  HEALTH_MEDICAL_HISTORY_MAX_EVENTS: '1000',
  
  // Storage configuration
  HEALTH_STORAGE_S3_BUCKET: 'austa-documents-test',
  HEALTH_STORAGE_S3_REGION: 'sa-east-1',
  HEALTH_STORAGE_S3_PREFIX: 'health',
  
  // Feature flags
  HEALTH_FEATURE_WEARABLE_SYNC: 'true',
  HEALTH_FEATURE_HEALTH_INSIGHTS: 'true',
  HEALTH_FEATURE_HEALTH_GOALS: 'true',
  HEALTH_FEATURE_MEDICAL_HISTORY: 'true',
  HEALTH_FEATURE_FHIR_INTEGRATION: 'true'
};

/**
 * Care Journey mock environment
 * Contains all environment variables specific to the Care journey
 */
export const careMockEnvironment: Record<string, string> = {
  // Core configuration
  CARE_NODE_ENV: 'test',
  CARE_PORT: '3002',
  CARE_API_PREFIX: 'api/v1',
  
  // Database configuration
  CARE_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_care_test',
  CARE_DATABASE_SSL: 'false',
  
  // Telemedicine configuration
  CARE_TELEMEDICINE_ENABLED: 'true',
  CARE_TELEMEDICINE_PROVIDER: 'agora',
  CARE_TELEMEDICINE_APP_ID: 'test_telemedicine_app_id',
  CARE_TELEMEDICINE_APP_CERTIFICATE: 'test_telemedicine_app_certificate',
  CARE_TELEMEDICINE_CHANNEL_PREFIX: 'austa_care_test',
  CARE_TELEMEDICINE_TOKEN_EXPIRATION: '3600',
  CARE_TELEMEDICINE_RECORDING_ENABLED: 'true',
  CARE_TELEMEDICINE_RECORDING_BUCKET: 'austa-recordings-test',
  
  // Appointment configuration
  CARE_APPOINTMENT_REMINDER_ENABLED: 'true',
  CARE_APPOINTMENT_REMINDER_INTERVALS: '24,1',
  CARE_APPOINTMENT_CANCELLATION_WINDOW: '24',
  CARE_APPOINTMENT_RESCHEDULE_WINDOW: '48',
  CARE_APPOINTMENT_MAX_FUTURE_DAYS: '90',
  CARE_APPOINTMENT_BUFFER_MINUTES: '15',
  
  // Provider configuration
  CARE_PROVIDER_VERIFICATION_ENABLED: 'true',
  CARE_PROVIDER_VERIFICATION_SERVICE: 'test_verification_service',
  CARE_PROVIDER_VERIFICATION_API_KEY: 'test_verification_api_key',
  CARE_PROVIDER_SEARCH_RADIUS_KM: '50',
  CARE_PROVIDER_MAX_SEARCH_RESULTS: '100',
  
  // Medication configuration
  CARE_MEDICATION_REMINDER_ENABLED: 'true',
  CARE_MEDICATION_DATABASE_URL: 'https://medications.test.example.com',
  CARE_MEDICATION_API_KEY: 'test_medication_api_key',
  CARE_MEDICATION_INTERACTION_CHECK_ENABLED: 'true',
  
  // Symptom checker configuration
  CARE_SYMPTOM_CHECKER_ENABLED: 'true',
  CARE_SYMPTOM_CHECKER_API_URL: 'https://symptoms.test.example.com',
  CARE_SYMPTOM_CHECKER_API_KEY: 'test_symptom_checker_api_key',
  CARE_SYMPTOM_CHECKER_CACHE_TTL: '86400',
  
  // Treatment configuration
  CARE_TREATMENT_PLAN_ENABLED: 'true',
  CARE_TREATMENT_REMINDER_ENABLED: 'true',
  CARE_TREATMENT_PROGRESS_TRACKING_ENABLED: 'true',
  
  // Event streaming configuration
  CARE_EVENTS_KAFKA_ENABLED: 'true',
  CARE_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  CARE_EVENTS_TOPIC_PREFIX: 'austa.care.test',
  
  // Redis configuration
  CARE_REDIS_URL: 'redis://localhost:6379/2',
  CARE_REDIS_TTL: '3600',
  
  // Storage configuration
  CARE_STORAGE_S3_BUCKET: 'austa-documents-test',
  CARE_STORAGE_S3_REGION: 'sa-east-1',
  CARE_STORAGE_S3_PREFIX: 'care',
  
  // Feature flags
  CARE_FEATURE_TELEMEDICINE: 'true',
  CARE_FEATURE_APPOINTMENT_BOOKING: 'true',
  CARE_FEATURE_MEDICATION_TRACKING: 'true',
  CARE_FEATURE_SYMPTOM_CHECKER: 'true',
  CARE_FEATURE_TREATMENT_PLANS: 'true'
};

/**
 * Plan Journey mock environment
 * Contains all environment variables specific to the Plan journey
 */
export const planMockEnvironment: Record<string, string> = {
  // Core configuration
  PLAN_NODE_ENV: 'test',
  PLAN_PORT: '3003',
  PLAN_API_PREFIX: 'api/v1',
  
  // Database configuration
  PLAN_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_plan_test',
  PLAN_DATABASE_SSL: 'false',
  
  // Plan configuration
  PLAN_COMPARISON_ENABLED: 'true',
  PLAN_RECOMMENDATION_ENABLED: 'true',
  PLAN_ENROLLMENT_ENABLED: 'true',
  PLAN_FAMILY_ENROLLMENT_ENABLED: 'true',
  PLAN_MAX_FAMILY_MEMBERS: '10',
  
  // Benefits configuration
  PLAN_BENEFITS_SEARCH_ENABLED: 'true',
  PLAN_BENEFITS_VERIFICATION_ENABLED: 'true',
  PLAN_BENEFITS_USAGE_TRACKING_ENABLED: 'true',
  
  // Coverage configuration
  PLAN_COVERAGE_CHECK_ENABLED: 'true',
  PLAN_COVERAGE_API_URL: 'https://coverage.test.example.com',
  PLAN_COVERAGE_API_KEY: 'test_coverage_api_key',
  PLAN_COVERAGE_CACHE_TTL: '86400',
  
  // Claims configuration
  PLAN_CLAIMS_SUBMISSION_ENABLED: 'true',
  PLAN_CLAIMS_TRACKING_ENABLED: 'true',
  PLAN_CLAIMS_AUTO_PROCESSING_ENABLED: 'true',
  PLAN_CLAIMS_DOCUMENT_TYPES: 'receipt,invoice,prescription,referral,medical_report',
  PLAN_CLAIMS_MAX_DOCUMENT_SIZE_MB: '10',
  PLAN_CLAIMS_MAX_DOCUMENTS_PER_CLAIM: '5',
  
  // Documents configuration
  PLAN_DOCUMENTS_STORAGE_ENABLED: 'true',
  PLAN_DOCUMENTS_OCR_ENABLED: 'true',
  PLAN_DOCUMENTS_OCR_SERVICE: 'test_ocr_service',
  PLAN_DOCUMENTS_OCR_API_KEY: 'test_ocr_api_key',
  
  // Payment configuration
  PLAN_PAYMENT_PROCESSING_ENABLED: 'true',
  PLAN_PAYMENT_PROVIDER: 'stripe',
  PLAN_PAYMENT_API_KEY: 'test_payment_api_key',
  PLAN_PAYMENT_WEBHOOK_SECRET: 'test_payment_webhook_secret',
  
  // Event streaming configuration
  PLAN_EVENTS_KAFKA_ENABLED: 'true',
  PLAN_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  PLAN_EVENTS_TOPIC_PREFIX: 'austa.plan.test',
  
  // Redis configuration
  PLAN_REDIS_URL: 'redis://localhost:6379/3',
  PLAN_REDIS_TTL: '3600',
  
  // Storage configuration
  PLAN_STORAGE_S3_BUCKET: 'austa-documents-test',
  PLAN_STORAGE_S3_REGION: 'sa-east-1',
  PLAN_STORAGE_S3_PREFIX: 'plan',
  
  // Feature flags
  PLAN_FEATURE_PLAN_COMPARISON: 'true',
  PLAN_FEATURE_CLAIMS_SUBMISSION: 'true',
  PLAN_FEATURE_BENEFITS_SEARCH: 'true',
  PLAN_FEATURE_COVERAGE_CHECK: 'true',
  PLAN_FEATURE_DOCUMENT_STORAGE: 'true'
};

/**
 * Gamification Engine mock environment
 * Contains all environment variables specific to the Gamification engine
 */
export const gamificationMockEnvironment: Record<string, string> = {
  // Core configuration
  GAME_NODE_ENV: 'test',
  GAME_PORT: '3004',
  GAME_API_PREFIX: 'api/v1',
  
  // Database configuration
  GAME_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_gamification_test',
  GAME_DATABASE_SSL: 'false',
  
  // Achievement configuration
  GAME_ACHIEVEMENTS_ENABLED: 'true',
  GAME_ACHIEVEMENTS_NOTIFICATION_ENABLED: 'true',
  GAME_ACHIEVEMENTS_LEVELS_ENABLED: 'true',
  GAME_ACHIEVEMENTS_BADGE_STORAGE_BUCKET: 'austa-badges-test',
  
  // Events configuration
  GAME_EVENTS_PROCESSING_ENABLED: 'true',
  GAME_EVENTS_BATCH_SIZE: '100',
  GAME_EVENTS_PROCESSING_INTERVAL_MS: '5000',
  GAME_EVENTS_RETENTION_DAYS: '90',
  
  // Leaderboard configuration
  GAME_LEADERBOARD_ENABLED: 'true',
  GAME_LEADERBOARD_UPDATE_INTERVAL_MINUTES: '15',
  GAME_LEADERBOARD_MAX_ENTRIES: '100',
  GAME_LEADERBOARD_CACHE_TTL: '900',
  
  // Profile configuration
  GAME_PROFILES_AVATAR_ENABLED: 'true',
  GAME_PROFILES_AVATAR_STORAGE_BUCKET: 'austa-avatars-test',
  GAME_PROFILES_PRIVACY_ENABLED: 'true',
  
  // Quest configuration
  GAME_QUESTS_ENABLED: 'true',
  GAME_QUESTS_DAILY_ENABLED: 'true',
  GAME_QUESTS_WEEKLY_ENABLED: 'true',
  GAME_QUESTS_JOURNEY_SPECIFIC_ENABLED: 'true',
  GAME_QUESTS_MAX_ACTIVE: '5',
  GAME_QUESTS_REFRESH_TIME: '00:00',
  
  // Rewards configuration
  GAME_REWARDS_ENABLED: 'true',
  GAME_REWARDS_REDEMPTION_ENABLED: 'true',
  GAME_REWARDS_PARTNER_API_ENABLED: 'true',
  GAME_REWARDS_PARTNER_API_URL: 'https://rewards.test.example.com',
  GAME_REWARDS_PARTNER_API_KEY: 'test_rewards_api_key',
  
  // Rules configuration
  GAME_RULES_ENGINE_ENABLED: 'true',
  GAME_RULES_DYNAMIC_LOADING_ENABLED: 'true',
  GAME_RULES_STORAGE_BUCKET: 'austa-rules-test',
  GAME_RULES_CACHE_TTL: '3600',
  
  // Kafka configuration
  GAME_KAFKA_ENABLED: 'true',
  GAME_KAFKA_BROKERS: 'localhost:9092',
  GAME_KAFKA_CLIENT_ID: 'austa-gamification-test',
  GAME_KAFKA_GROUP_ID: 'austa-gamification-test-group',
  GAME_KAFKA_HEALTH_TOPIC: 'health.events.test',
  GAME_KAFKA_CARE_TOPIC: 'care.events.test',
  GAME_KAFKA_PLAN_TOPIC: 'plan.events.test',
  GAME_KAFKA_USER_TOPIC: 'user.events.test',
  
  // Redis configuration
  GAME_REDIS_URL: 'redis://localhost:6379/4',
  GAME_REDIS_TTL: '3600',
  
  // Feature flags
  GAME_FEATURE_ACHIEVEMENTS: 'true',
  GAME_FEATURE_QUESTS: 'true',
  GAME_FEATURE_REWARDS: 'true',
  GAME_FEATURE_LEADERBOARDS: 'true',
  GAME_FEATURE_PROFILES: 'true'
};

/**
 * Notification Service mock environment
 * Contains all environment variables specific to the Notification service
 */
export const notificationMockEnvironment: Record<string, string> = {
  // Core configuration
  NOTIFICATION_NODE_ENV: 'test',
  NOTIFICATION_PORT: '3005',
  NOTIFICATION_API_PREFIX: 'api/v1',
  
  // Database configuration
  NOTIFICATION_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_notification_test',
  NOTIFICATION_DATABASE_SSL: 'false',
  
  // Channels configuration
  NOTIFICATION_CHANNELS_EMAIL_ENABLED: 'true',
  NOTIFICATION_CHANNELS_SMS_ENABLED: 'true',
  NOTIFICATION_CHANNELS_PUSH_ENABLED: 'true',
  NOTIFICATION_CHANNELS_IN_APP_ENABLED: 'true',
  
  // Email configuration
  NOTIFICATION_EMAIL_PROVIDER: 'sendgrid',
  NOTIFICATION_EMAIL_API_KEY: 'test_email_api_key',
  NOTIFICATION_EMAIL_FROM: 'no-reply-test@austa.com.br',
  NOTIFICATION_EMAIL_TEMPLATE_DIR: '/app/templates/email',
  
  // SMS configuration
  NOTIFICATION_SMS_PROVIDER: 'twilio',
  NOTIFICATION_SMS_ACCOUNT_SID: 'test_sms_account_sid',
  NOTIFICATION_SMS_AUTH_TOKEN: 'test_sms_auth_token',
  NOTIFICATION_SMS_FROM_NUMBER: '+5500000000000',
  
  // Push configuration
  NOTIFICATION_PUSH_PROVIDER: 'onesignal',
  NOTIFICATION_PUSH_APP_ID: 'test_push_app_id',
  NOTIFICATION_PUSH_API_KEY: 'test_push_api_key',
  
  // In-app configuration
  NOTIFICATION_IN_APP_WEBSOCKET_ENABLED: 'true',
  NOTIFICATION_IN_APP_STORAGE_DAYS: '30',
  NOTIFICATION_IN_APP_MAX_UNREAD: '100',
  
  // Templates configuration
  NOTIFICATION_TEMPLATES_CACHE_ENABLED: 'true',
  NOTIFICATION_TEMPLATES_CACHE_TTL: '3600',
  NOTIFICATION_TEMPLATES_STORAGE_BUCKET: 'austa-templates-test',
  
  // Preferences configuration
  NOTIFICATION_PREFERENCES_ENABLED: 'true',
  NOTIFICATION_PREFERENCES_DEFAULT_EMAIL: 'true',
  NOTIFICATION_PREFERENCES_DEFAULT_SMS: 'true',
  NOTIFICATION_PREFERENCES_DEFAULT_PUSH: 'true',
  NOTIFICATION_PREFERENCES_DEFAULT_IN_APP: 'true',
  
  // Retry configuration
  NOTIFICATION_RETRY_ENABLED: 'true',
  NOTIFICATION_RETRY_MAX_ATTEMPTS: '3',
  NOTIFICATION_RETRY_DELAY_MS: '60000',
  NOTIFICATION_RETRY_BACKOFF_FACTOR: '2',
  NOTIFICATION_RETRY_DLQ_ENABLED: 'true',
  
  // Events configuration
  NOTIFICATION_EVENTS_KAFKA_ENABLED: 'true',
  NOTIFICATION_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  NOTIFICATION_EVENTS_TOPIC_PREFIX: 'austa.notification.test',
  
  // Redis configuration
  NOTIFICATION_REDIS_URL: 'redis://localhost:6379/5',
  NOTIFICATION_REDIS_TTL: '3600',
  
  // Feature flags
  NOTIFICATION_FEATURE_TEMPLATING: 'true',
  NOTIFICATION_FEATURE_PREFERENCES: 'true',
  NOTIFICATION_FEATURE_RETRY: 'true',
  NOTIFICATION_FEATURE_BATCHING: 'true',
  NOTIFICATION_FEATURE_SCHEDULING: 'true'
};

/**
 * Auth Service mock environment
 * Contains all environment variables specific to the Auth service
 */
export const authMockEnvironment: Record<string, string> = {
  // Core configuration
  AUTH_NODE_ENV: 'test',
  AUTH_PORT: '3006',
  AUTH_API_PREFIX: 'api/v1',
  
  // Database configuration
  AUTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_auth_test',
  AUTH_DATABASE_SSL: 'false',
  
  // JWT configuration
  AUTH_JWT_SECRET: 'test_jwt_secret',
  AUTH_JWT_EXPIRATION: '3600',
  AUTH_JWT_REFRESH_EXPIRATION: '604800',
  AUTH_JWT_ISSUER: 'austa-auth-test',
  AUTH_JWT_AUDIENCE: 'austa-services-test',
  
  // Redis configuration
  AUTH_REDIS_URL: 'redis://localhost:6379/6',
  AUTH_REDIS_TTL: '3600',
  AUTH_REDIS_PREFIX: 'auth:',
  
  // User configuration
  AUTH_USER_PASSWORD_SALT_ROUNDS: '10',
  AUTH_USER_EMAIL_VERIFICATION_REQUIRED: 'true',
  AUTH_USER_EMAIL_VERIFICATION_EXPIRATION: '86400',
  AUTH_USER_PHONE_VERIFICATION_REQUIRED: 'true',
  AUTH_USER_PHONE_VERIFICATION_EXPIRATION: '300',
  AUTH_USER_ACCOUNT_LOCKOUT_THRESHOLD: '5',
  AUTH_USER_ACCOUNT_LOCKOUT_DURATION: '900',
  
  // OAuth configuration
  AUTH_OAUTH_GOOGLE_ENABLED: 'true',
  AUTH_OAUTH_GOOGLE_CLIENT_ID: 'test_google_client_id',
  AUTH_OAUTH_GOOGLE_CLIENT_SECRET: 'test_google_client_secret',
  AUTH_OAUTH_GOOGLE_CALLBACK_URL: 'http://localhost:3006/api/v1/auth/google/callback',
  AUTH_OAUTH_FACEBOOK_ENABLED: 'true',
  AUTH_OAUTH_FACEBOOK_CLIENT_ID: 'test_facebook_client_id',
  AUTH_OAUTH_FACEBOOK_CLIENT_SECRET: 'test_facebook_client_secret',
  AUTH_OAUTH_FACEBOOK_CALLBACK_URL: 'http://localhost:3006/api/v1/auth/facebook/callback',
  AUTH_OAUTH_APPLE_ENABLED: 'true',
  AUTH_OAUTH_APPLE_CLIENT_ID: 'test_apple_client_id',
  AUTH_OAUTH_APPLE_TEAM_ID: 'test_apple_team_id',
  AUTH_OAUTH_APPLE_KEY_ID: 'test_apple_key_id',
  AUTH_OAUTH_APPLE_PRIVATE_KEY: 'test_apple_private_key',
  AUTH_OAUTH_APPLE_CALLBACK_URL: 'http://localhost:3006/api/v1/auth/apple/callback',
  
  // Role configuration
  AUTH_ROLES_SUPER_ADMIN_ENABLED: 'true',
  AUTH_ROLES_JOURNEY_SPECIFIC_ENABLED: 'true',
  
  // Permission configuration
  AUTH_PERMISSIONS_CACHE_ENABLED: 'true',
  AUTH_PERMISSIONS_CACHE_TTL: '300',
  
  // Events configuration
  AUTH_EVENTS_KAFKA_ENABLED: 'true',
  AUTH_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  AUTH_EVENTS_TOPIC_PREFIX: 'austa.auth.test',
  
  // Feature flags
  AUTH_FEATURE_MFA: 'true',
  AUTH_FEATURE_SOCIAL_LOGIN: 'true',
  AUTH_FEATURE_PASSWORD_RESET: 'true',
  AUTH_FEATURE_ACCOUNT_DELETION: 'true',
  AUTH_FEATURE_SESSION_MANAGEMENT: 'true'
};

/**
 * API Gateway mock environment
 * Contains all environment variables specific to the API Gateway
 */
export const apiGatewayMockEnvironment: Record<string, string> = {
  // Core configuration
  GATEWAY_NODE_ENV: 'test',
  GATEWAY_PORT: '4000',
  GATEWAY_API_PREFIX: 'api/v1',
  
  // Service discovery
  GATEWAY_SERVICE_DISCOVERY_TYPE: 'static',
  GATEWAY_SERVICE_HEALTH_URL: 'http://localhost:3001/health',
  GATEWAY_SERVICE_CARE_URL: 'http://localhost:3002/health',
  GATEWAY_SERVICE_PLAN_URL: 'http://localhost:3003/health',
  GATEWAY_SERVICE_GAMIFICATION_URL: 'http://localhost:3004/health',
  GATEWAY_SERVICE_NOTIFICATION_URL: 'http://localhost:3005/health',
  GATEWAY_SERVICE_AUTH_URL: 'http://localhost:3006/health',
  
  // GraphQL configuration
  GATEWAY_GRAPHQL_ENABLED: 'true',
  GATEWAY_GRAPHQL_PATH: '/graphql',
  GATEWAY_GRAPHQL_PLAYGROUND_ENABLED: 'true',
  GATEWAY_GRAPHQL_INTROSPECTION_ENABLED: 'true',
  GATEWAY_GRAPHQL_DEBUG_ENABLED: 'true',
  GATEWAY_GRAPHQL_SCHEMA_VALIDATION_ENABLED: 'true',
  
  // REST configuration
  GATEWAY_REST_ENABLED: 'true',
  GATEWAY_REST_PATH: '/api',
  GATEWAY_REST_DOCUMENTATION_ENABLED: 'true',
  
  // Authentication configuration
  GATEWAY_AUTH_ENABLED: 'true',
  GATEWAY_AUTH_JWT_SECRET: 'test_jwt_secret',
  GATEWAY_AUTH_SERVICE_URL: 'http://localhost:3006',
  
  // Rate limiting configuration
  GATEWAY_RATE_LIMITING_ENABLED: 'true',
  GATEWAY_RATE_LIMITING_WINDOW_MS: '60000',
  GATEWAY_RATE_LIMITING_MAX: '100',
  GATEWAY_RATE_LIMITING_SKIP_AUTHENTICATED: 'false',
  
  // CORS configuration
  GATEWAY_CORS_ENABLED: 'true',
  GATEWAY_CORS_ORIGIN: 'http://localhost:3000,http://localhost:8081',
  GATEWAY_CORS_METHODS: 'GET,POST,PUT,DELETE,OPTIONS',
  GATEWAY_CORS_ALLOWED_HEADERS: 'Content-Type,Authorization',
  GATEWAY_CORS_EXPOSED_HEADERS: 'X-Total-Count',
  GATEWAY_CORS_CREDENTIALS: 'true',
  GATEWAY_CORS_MAX_AGE: '86400',
  
  // Caching configuration
  GATEWAY_CACHE_ENABLED: 'true',
  GATEWAY_CACHE_TTL: '300',
  GATEWAY_CACHE_MAX_ITEMS: '1000',
  
  // Logging configuration
  GATEWAY_LOGGING_LEVEL: 'info',
  GATEWAY_LOGGING_FORMAT: 'json',
  GATEWAY_REQUEST_LOGGING_ENABLED: 'true',
  GATEWAY_REQUEST_LOGGING_BODY_ENABLED: 'false',
  
  // Monitoring configuration
  GATEWAY_METRICS_ENABLED: 'true',
  GATEWAY_METRICS_PATH: '/metrics',
  GATEWAY_HEALTH_CHECK_ENABLED: 'true',
  GATEWAY_HEALTH_CHECK_PATH: '/health',
  
  // Feature flags
  GATEWAY_FEATURE_SCHEMA_STITCHING: 'true',
  GATEWAY_FEATURE_REQUEST_TRACING: 'true',
  GATEWAY_FEATURE_ERROR_TRACKING: 'true',
  GATEWAY_FEATURE_RESPONSE_COMPRESSION: 'true',
  GATEWAY_FEATURE_REQUEST_VALIDATION: 'true'
};

/**
 * Combined mock environment with all variables
 * Merges all service-specific environments into a single object
 */
export const fullMockEnvironment: Record<string, string> = {
  ...baseMockEnvironment,
  ...healthMockEnvironment,
  ...careMockEnvironment,
  ...planMockEnvironment,
  ...gamificationMockEnvironment,
  ...notificationMockEnvironment,
  ...authMockEnvironment,
  ...apiGatewayMockEnvironment
};

/**
 * Mock environment with missing required variables
 * Used for testing error handling of missing environment variables
 */
export const missingVariablesMockEnvironment: Record<string, string> = {
  // Include only a subset of required variables
  NODE_ENV: 'test',
  PORT: '4000',
  // DATABASE_URL is intentionally missing
  // REDIS_URL is intentionally missing
  JWT_SECRET: 'test_jwt_secret',
  // AWS credentials are intentionally missing
  LOG_LEVEL: 'info'
};

/**
 * Mock environment with invalid variable formats
 * Used for testing validation and transformation error handling
 */
export const invalidFormatsMockEnvironment: Record<string, string> = {
  ...baseMockEnvironment,
  // Invalid number format
  PORT: 'not-a-number',
  // Invalid boolean format
  HEALTH_JOURNEY_ENABLED: 'not-a-boolean',
  // Invalid JSON format
  FEATURE_FLAGS: '{invalid-json}',
  // Invalid URL format
  API_URL: 'not-a-url',
  // Invalid duration format
  JWT_EXPIRATION: 'not-a-duration'
};

/**
 * Mock environment with conflicting variables
 * Used for testing conflict resolution in environment configuration
 */
export const conflictingVariablesMockEnvironment: Record<string, string> = {
  ...baseMockEnvironment,
  // Conflicting database URLs
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_test',
  HEALTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/different_db',
  // Conflicting Redis URLs
  REDIS_URL: 'redis://localhost:6379/1',
  HEALTH_REDIS_URL: 'redis://localhost:6379/7',
  // Conflicting feature flags
  FEATURE_FLAGS: 'gamification,telemedicine',
  HEALTH_FEATURE_TELEMEDICINE: 'false'
};

/**
 * Mock environment with minimal configuration
 * Used for testing default values and minimal configuration scenarios
 */
export const minimalMockEnvironment: Record<string, string> = {
  // Only include the absolute minimum required variables
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_minimal_test',
  REDIS_URL: 'redis://localhost:6379/9',
  JWT_SECRET: 'minimal_test_jwt_secret'
};

/**
 * Typed mock environment configurations
 * These provide strongly-typed configurations for use in tests that require type safety
 */

/**
 * Typed database configuration for testing
 */
export const mockDatabaseConfig: DatabaseConfig = {
  url: 'postgresql://postgres:password@localhost:5432/austa_test',
  poolSize: 10,
  maxConnections: 20,
  minConnections: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
  schema: 'public'
};

/**
 * Typed Redis configuration for testing
 */
export const mockRedisConfig: RedisConfig = {
  url: 'redis://localhost:6379/1',
  password: 'test_redis_password',
  database: 1,
  keyPrefix: 'austa:test:',
  tls: false,
  maxRetriesPerRequest: 3
};

/**
 * Typed Kafka configuration for testing
 */
export const mockKafkaConfig: KafkaConfig = {
  brokers: ['localhost:9092'],
  clientId: 'austa-test-client',
  groupId: 'austa-test-group',
  ssl: false,
  sasl: {
    mechanism: 'plain',
    username: 'test_kafka_username',
    password: 'test_kafka_password'
  }
};

/**
 * Typed logging configuration for testing
 */
export const mockLoggingConfig: LoggingConfig = {
  level: 'info',
  format: 'json',
  destination: 'stdout',
  includeTimestamp: true,
  includeRequestId: true,
  includeJourneyContext: true
};

/**
 * Complete typed application environment configuration for testing
 */
export const mockAppEnvConfig: AppEnvConfig = {
  app: {
    name: 'austa-test',
    version: '1.0.0',
    environment: 'test',
    port: 4000,
    host: 'localhost',
    baseUrl: 'http://localhost:4000'
  },
  database: mockDatabaseConfig,
  redis: mockRedisConfig,
  kafka: mockKafkaConfig,
  logging: mockLoggingConfig,
  cors: {
    origins: ['http://localhost:3000', 'http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400
  },
  jwt: {
    secret: 'test_jwt_secret',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
    issuer: 'austa-test',
    audience: 'austa-services-test'
  },
  health: {
    enabled: true,
    path: '/health',
    interval: 30,
    timeout: 5,
    startupDelay: 10
  },
  monitoring: {
    metrics: {
      enabled: true,
      path: '/metrics',
      defaultLabels: {
        service: 'austa-test',
        environment: 'test'
      }
    },
    tracing: {
      enabled: true,
      serviceName: 'austa-test',
      sampleRate: 0.1
    }
  },
  retryPolicy: {
    attempts: 3,
    delay: 1000,
    backoff: 2,
    maxDelay: 10000
  },
  journeys: {
    health: {
      journeyType: JourneyType.HEALTH,
      variables: {
        FHIR_API_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable FHIR API integration'
        },
        WEARABLES_SYNC_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable wearable device synchronization'
        }
      },
      features: {
        wearableSync: true,
        healthInsights: true,
        healthGoals: true
      }
    },
    care: {
      journeyType: JourneyType.CARE,
      variables: {
        TELEMEDICINE_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable telemedicine features'
        },
        APPOINTMENT_REMINDER_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable appointment reminders'
        }
      },
      features: {
        telemedicine: true,
        appointmentBooking: true,
        medicationTracking: true
      }
    },
    plan: {
      journeyType: JourneyType.PLAN,
      variables: {
        CLAIMS_SUBMISSION_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable claims submission'
        },
        BENEFITS_VERIFICATION_ENABLED: {
          type: 'boolean',
          required: true,
          defaultValue: 'true',
          description: 'Enable benefits verification'
        }
      },
      features: {
        claimsSubmission: true,
        benefitsSearch: true,
        coverageCheck: true
      }
    }
  },
  features: {
    gamification: {
      name: 'gamification',
      enabled: true,
      description: 'Enable gamification features'
    },
    telemedicine: {
      name: 'telemedicine',
      enabled: true,
      rolloutPercentage: 100,
      description: 'Enable telemedicine features'
    },
    wearableSync: {
      name: 'wearable_sync',
      enabled: true,
      journeyType: JourneyType.HEALTH,
      description: 'Enable wearable device synchronization'
    },
    claimAutoProcessing: {
      name: 'claim_auto_processing',
      enabled: true,
      rolloutPercentage: 50,
      journeyType: JourneyType.PLAN,
      description: 'Enable automatic processing of claims'
    }
  }
};