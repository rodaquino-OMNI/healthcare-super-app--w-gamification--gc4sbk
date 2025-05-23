/**
 * Mock Environment Objects for Testing
 * 
 * This module provides complete mock environment objects for integration testing of environment utilities.
 * These fixtures include full sets of environment variables that mimic real production environments,
 * with values for all required variables across different contexts.
 */

/**
 * Complete development environment mock
 * Simulates a typical local development environment configuration
 */
export const MOCK_DEV_ENV = {
  // Core application configuration
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
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-dev',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'mock_jwt_secret_for_development',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'mock_user_pool_id',
  COGNITO_CLIENT_ID: 'mock_client_id',
  COGNITO_CLIENT_SECRET: 'mock_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'austa-backend',
  KAFKA_GROUP_ID: 'austa-backend-group',
  KAFKA_HEALTH_TOPIC: 'health.events',
  KAFKA_CARE_TOPIC: 'care.events',
  KAFKA_PLAN_TOPIC: 'plan.events',
  KAFKA_GAME_TOPIC: 'game.events',
  KAFKA_USER_TOPIC: 'user.events',
  
  // Communication Services
  SENDGRID_API_KEY: 'mock_sendgrid_api_key',
  EMAIL_FROM: 'no-reply@austa.com.br',
  TWILIO_ACCOUNT_SID: 'mock_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'mock_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'mock_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'mock_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir.example.com',
  HL7_FHIR_USERNAME: 'mock_fhir_username',
  HL7_FHIR_PASSWORD: 'mock_fhir_password',
  STRIPE_SECRET_KEY: 'mock_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'mock_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'mock_stripe_webhook_secret',
  AGORA_APP_ID: 'mock_agora_app_id',
  AGORA_APP_CERTIFICATE: 'mock_agora_app_certificate',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'mock_datadog_api_key',
  DATADOG_APP_KEY: 'mock_datadog_app_key',
  DD_AGENT_HOST: 'localhost',
  DD_ENV: 'development',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'mock_sentry_dsn',
  SENTRY_ENVIRONMENT: 'development',
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
  GAMIFICATION_ENABLED: 'true',
};

/**
 * Complete production environment mock
 * Simulates a typical production environment configuration
 */
export const MOCK_PROD_ENV = {
  // Core application configuration
  NODE_ENV: 'production',
  PORT: '80',
  API_URL: 'https://api.austa.com.br/graphql',
  LOG_LEVEL: 'info',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://austa_prod:complex_password@austa-db.cluster-xyz.sa-east-1.rds.amazonaws.com:5432/austa_prod',
  TIMESCALE_URL: 'postgresql://austa_metrics:complex_password@austa-metrics.cluster-xyz.sa-east-1.rds.amazonaws.com:5432/austa_metrics_prod',
  REDIS_URL: 'redis://austa-redis.xyz.ng.0001.sae1.cache.amazonaws.com:6379',
  HEALTH_CACHE_TTL: '300',
  CARE_CACHE_TTL: '60',
  PLAN_CACHE_TTL: '900',
  GAME_CACHE_TTL: '60',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'mock_prod_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_prod_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-prod',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'mock_prod_jwt_secret_very_long_and_complex',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'sa-east-1_abcdefghi',
  COGNITO_CLIENT_ID: 'mock_prod_client_id',
  COGNITO_CLIENT_SECRET: 'mock_prod_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'b-1.austa-kafka.xyz.c2.kafka.sa-east-1.amazonaws.com:9092,b-2.austa-kafka.xyz.c2.kafka.sa-east-1.amazonaws.com:9092',
  KAFKA_CLIENT_ID: 'austa-backend-prod',
  KAFKA_GROUP_ID: 'austa-backend-prod-group',
  KAFKA_HEALTH_TOPIC: 'health.events',
  KAFKA_CARE_TOPIC: 'care.events',
  KAFKA_PLAN_TOPIC: 'plan.events',
  KAFKA_GAME_TOPIC: 'game.events',
  KAFKA_USER_TOPIC: 'user.events',
  
  // Communication Services
  SENDGRID_API_KEY: 'mock_prod_sendgrid_api_key',
  EMAIL_FROM: 'no-reply@austa.com.br',
  TWILIO_ACCOUNT_SID: 'mock_prod_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'mock_prod_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'mock_prod_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'mock_prod_onesignal_api_key',
  
  // External Integrations
  HL7_FHIR_BASE_URL: 'https://fhir-prod.example.com',
  HL7_FHIR_USERNAME: 'mock_prod_fhir_username',
  HL7_FHIR_PASSWORD: 'mock_prod_fhir_password',
  STRIPE_SECRET_KEY: 'mock_prod_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'mock_prod_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'mock_prod_stripe_webhook_secret',
  AGORA_APP_ID: 'mock_prod_agora_app_id',
  AGORA_APP_CERTIFICATE: 'mock_prod_agora_app_certificate',
  
  // Monitoring & Observability
  DATADOG_API_KEY: 'mock_prod_datadog_api_key',
  DATADOG_APP_KEY: 'mock_prod_datadog_app_key',
  DD_AGENT_HOST: 'datadog-agent.austa-monitoring',
  DD_ENV: 'production',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: 'mock_prod_sentry_dsn',
  SENTRY_ENVIRONMENT: 'production',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '100',
  RATE_LIMIT_HEALTH_JOURNEY: '200',
  RATE_LIMIT_CARE_JOURNEY: '150',
  RATE_LIMIT_PLAN_JOURNEY: '100',
  
  // Feature Flags
  FEATURE_FLAGS: 'gamification,telemedicine,claim_auto_processing',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true',
};

/**
 * Complete test environment mock
 * Simulates a typical test environment configuration
 */
export const MOCK_TEST_ENV = {
  // Core application configuration
  NODE_ENV: 'test',
  PORT: '4001',
  API_URL: 'http://localhost:4001/graphql',
  LOG_LEVEL: 'error',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_test',
  TIMESCALE_URL: 'postgresql://postgres:password@localhost:5432/austa_metrics_test',
  REDIS_URL: 'redis://localhost:6379/1',
  HEALTH_CACHE_TTL: '10',
  CARE_CACHE_TTL: '10',
  PLAN_CACHE_TTL: '10',
  GAME_CACHE_TTL: '10',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'mock_test_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_test_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-test',
  S3_BUCKET_REGION: 'sa-east-1',
  
  // Authentication & Security
  JWT_SECRET: 'mock_test_jwt_secret',
  JWT_EXPIRATION: '3600',
  REFRESH_TOKEN_EXPIRATION: '604800',
  COGNITO_USER_POOL_ID: 'mock_test_user_pool_id',
  COGNITO_CLIENT_ID: 'mock_test_client_id',
  COGNITO_CLIENT_SECRET: 'mock_test_client_secret',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  KAFKA_CLIENT_ID: 'austa-backend-test',
  KAFKA_GROUP_ID: 'austa-backend-test-group',
  KAFKA_HEALTH_TOPIC: 'health.events.test',
  KAFKA_CARE_TOPIC: 'care.events.test',
  KAFKA_PLAN_TOPIC: 'plan.events.test',
  KAFKA_GAME_TOPIC: 'game.events.test',
  KAFKA_USER_TOPIC: 'user.events.test',
  
  // Communication Services - Mocked for tests
  SENDGRID_API_KEY: 'mock_test_sendgrid_api_key',
  EMAIL_FROM: 'test@austa.com.br',
  TWILIO_ACCOUNT_SID: 'mock_test_twilio_account_sid',
  TWILIO_AUTH_TOKEN: 'mock_test_twilio_auth_token',
  TWILIO_PHONE_NUMBER: '+5500000000000',
  ONE_SIGNAL_APP_ID: 'mock_test_onesignal_app_id',
  ONE_SIGNAL_REST_API_KEY: 'mock_test_onesignal_api_key',
  
  // External Integrations - Mocked for tests
  HL7_FHIR_BASE_URL: 'http://localhost:8080/fhir',
  HL7_FHIR_USERNAME: 'mock_test_fhir_username',
  HL7_FHIR_PASSWORD: 'mock_test_fhir_password',
  STRIPE_SECRET_KEY: 'mock_test_stripe_secret_key',
  STRIPE_PUBLIC_KEY: 'mock_test_stripe_public_key',
  STRIPE_WEBHOOK_SECRET: 'mock_test_stripe_webhook_secret',
  AGORA_APP_ID: 'mock_test_agora_app_id',
  AGORA_APP_CERTIFICATE: 'mock_test_agora_app_certificate',
  
  // Monitoring & Observability - Disabled for tests
  DATADOG_API_KEY: '',
  DATADOG_APP_KEY: '',
  DD_AGENT_HOST: '',
  DD_ENV: 'test',
  DD_SERVICE: 'austa-backend',
  DD_VERSION: '1.0.0',
  SENTRY_DSN: '',
  SENTRY_ENVIRONMENT: 'test',
  SENTRY_RELEASE: '1.0.0',
  
  // Rate Limiting - Relaxed for tests
  RATE_LIMIT_WINDOW_MS: '900000',
  RATE_LIMIT_MAX_REQUESTS: '1000',
  RATE_LIMIT_HEALTH_JOURNEY: '1000',
  RATE_LIMIT_CARE_JOURNEY: '1000',
  RATE_LIMIT_PLAN_JOURNEY: '1000',
  
  // Feature Flags - All enabled for testing
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync,claim_auto_processing',
  
  // Journey Configuration - All enabled for testing
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true',
};

/**
 * Health Journey specific environment mock
 * Contains all variables specific to the Health journey service
 */
export const MOCK_HEALTH_JOURNEY_ENV = {
  // Core Health Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  HEALTH_API_PREFIX: 'api/v1/health',
  HEALTH_CACHE_TTL: '300',
  
  // Health Database Configuration
  HEALTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_health',
  HEALTH_DATABASE_SSL: 'false',
  
  // TimescaleDB Configuration
  HEALTH_TIMESCALE_ENABLED: 'true',
  HEALTH_METRICS_RETENTION_DAYS: '730',
  HEALTH_METRICS_AGGREGATION_ENABLED: 'true',
  HEALTH_METRICS_AGGREGATION_INTERVALS: 'hour,day,week,month',
  
  // FHIR API Configuration
  HEALTH_FHIR_API_ENABLED: 'true',
  HEALTH_FHIR_API_URL: 'https://fhir.example.com',
  HEALTH_FHIR_API_AUTH_TYPE: 'oauth2',
  HEALTH_FHIR_API_CLIENT_ID: 'mock_health_fhir_client_id',
  HEALTH_FHIR_API_CLIENT_SECRET: 'mock_health_fhir_client_secret',
  HEALTH_FHIR_API_SCOPE: 'patient/*.read',
  HEALTH_FHIR_API_TOKEN_URL: 'https://fhir.example.com/oauth2/token',
  HEALTH_FHIR_API_TIMEOUT: '10000',
  
  // Wearables Configuration
  HEALTH_WEARABLES_SYNC_ENABLED: 'true',
  HEALTH_WEARABLES_SUPPORTED: 'googlefit,healthkit,fitbit',
  HEALTH_GOOGLEFIT_CLIENT_ID: 'mock_googlefit_client_id',
  HEALTH_GOOGLEFIT_CLIENT_SECRET: 'mock_googlefit_client_secret',
  HEALTH_HEALTHKIT_TEAM_ID: 'mock_healthkit_team_id',
  HEALTH_HEALTHKIT_KEY_ID: 'mock_healthkit_key_id',
  HEALTH_HEALTHKIT_PRIVATE_KEY: 'mock_healthkit_private_key',
  HEALTH_FITBIT_CLIENT_ID: 'mock_fitbit_client_id',
  HEALTH_FITBIT_CLIENT_SECRET: 'mock_fitbit_client_secret',
  HEALTH_WEARABLES_SYNC_INTERVAL: '15',
  HEALTH_WEARABLES_MAX_SYNC_DAYS: '30',
  
  // Health Goals Configuration
  HEALTH_GOALS_MAX_ACTIVE: '10',
  
  // Health Insights Configuration
  HEALTH_INSIGHTS_ENABLED: 'true',
  HEALTH_INSIGHTS_GENERATION_INTERVAL: '24',
  HEALTH_INSIGHTS_MODELS_PATH: '/app/models/health',
  
  // Event Streaming Configuration
  HEALTH_EVENTS_KAFKA_ENABLED: 'true',
  HEALTH_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  HEALTH_EVENTS_TOPIC_PREFIX: 'austa.health',
  
  // Redis Configuration
  HEALTH_REDIS_URL: 'redis://localhost:6379/0',
  HEALTH_REDIS_TTL: '3600',
  
  // Medical History Configuration
  HEALTH_MEDICAL_HISTORY_MAX_EVENTS: '1000',
  
  // Storage Configuration
  HEALTH_STORAGE_S3_BUCKET: 'austa-documents-dev',
  HEALTH_STORAGE_S3_REGION: 'sa-east-1',
  HEALTH_STORAGE_S3_PREFIX: 'health',
  
  // Feature Flags
  HEALTH_FEATURE_WEARABLE_SYNC: 'true',
  HEALTH_FEATURE_INSIGHTS: 'true',
  HEALTH_FEATURE_GOALS: 'true',
  HEALTH_FEATURE_MEDICAL_HISTORY: 'true',
};

/**
 * Care Journey specific environment mock
 * Contains all variables specific to the Care journey service
 */
export const MOCK_CARE_JOURNEY_ENV = {
  // Core Care Journey Configuration
  CARE_JOURNEY_ENABLED: 'true',
  CARE_API_PREFIX: 'api/v1/care',
  CARE_CACHE_TTL: '60',
  
  // Care Database Configuration
  CARE_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_care',
  CARE_DATABASE_SSL: 'false',
  
  // Appointment Configuration
  CARE_APPOINTMENTS_MAX_FUTURE_DAYS: '90',
  CARE_APPOINTMENTS_REMINDER_HOURS: '24,2',
  CARE_APPOINTMENTS_CANCELLATION_WINDOW_HOURS: '24',
  
  // Provider Configuration
  CARE_PROVIDERS_CACHE_TTL: '3600',
  CARE_PROVIDERS_SEARCH_RADIUS_KM: '50',
  CARE_PROVIDERS_MAX_RESULTS: '100',
  
  // Telemedicine Configuration
  CARE_TELEMEDICINE_ENABLED: 'true',
  CARE_TELEMEDICINE_PROVIDER: 'agora',
  CARE_TELEMEDICINE_AGORA_APP_ID: 'mock_care_agora_app_id',
  CARE_TELEMEDICINE_AGORA_APP_CERTIFICATE: 'mock_care_agora_app_certificate',
  CARE_TELEMEDICINE_SESSION_DURATION_MINUTES: '30',
  CARE_TELEMEDICINE_WAITING_ROOM_MINUTES: '10',
  
  // Medication Configuration
  CARE_MEDICATIONS_REMINDER_ENABLED: 'true',
  CARE_MEDICATIONS_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_medications',
  CARE_MEDICATIONS_API_URL: 'https://api.medications.example.com',
  CARE_MEDICATIONS_API_KEY: 'mock_medications_api_key',
  
  // Symptom Checker Configuration
  CARE_SYMPTOM_CHECKER_ENABLED: 'true',
  CARE_SYMPTOM_CHECKER_API_URL: 'https://api.symptomchecker.example.com',
  CARE_SYMPTOM_CHECKER_API_KEY: 'mock_symptom_checker_api_key',
  CARE_SYMPTOM_CHECKER_CACHE_TTL: '86400',
  
  // Treatment Configuration
  CARE_TREATMENTS_ENABLED: 'true',
  CARE_TREATMENTS_REMINDER_ENABLED: 'true',
  CARE_TREATMENTS_PROGRESS_TRACKING_ENABLED: 'true',
  
  // Event Streaming Configuration
  CARE_EVENTS_KAFKA_ENABLED: 'true',
  CARE_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  CARE_EVENTS_TOPIC_PREFIX: 'austa.care',
  
  // Redis Configuration
  CARE_REDIS_URL: 'redis://localhost:6379/0',
  CARE_REDIS_TTL: '3600',
  
  // Storage Configuration
  CARE_STORAGE_S3_BUCKET: 'austa-documents-dev',
  CARE_STORAGE_S3_REGION: 'sa-east-1',
  CARE_STORAGE_S3_PREFIX: 'care',
  
  // Feature Flags
  CARE_FEATURE_TELEMEDICINE: 'true',
  CARE_FEATURE_SYMPTOM_CHECKER: 'true',
  CARE_FEATURE_MEDICATION_REMINDERS: 'true',
  CARE_FEATURE_TREATMENT_TRACKING: 'true',
};

/**
 * Plan Journey specific environment mock
 * Contains all variables specific to the Plan journey service
 */
export const MOCK_PLAN_JOURNEY_ENV = {
  // Core Plan Journey Configuration
  PLAN_JOURNEY_ENABLED: 'true',
  PLAN_API_PREFIX: 'api/v1/plan',
  PLAN_CACHE_TTL: '900',
  
  // Plan Database Configuration
  PLAN_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_plan',
  PLAN_DATABASE_SSL: 'false',
  
  // Plan Configuration
  PLAN_COMPARISON_ENABLED: 'true',
  PLAN_COMPARISON_MAX_PLANS: '5',
  PLAN_SEARCH_CACHE_TTL: '3600',
  
  // Benefits Configuration
  PLAN_BENEFITS_CACHE_TTL: '86400',
  PLAN_BENEFITS_SEARCH_ENABLED: 'true',
  
  // Coverage Configuration
  PLAN_COVERAGE_CHECK_ENABLED: 'true',
  PLAN_COVERAGE_API_URL: 'https://api.coverage.example.com',
  PLAN_COVERAGE_API_KEY: 'mock_coverage_api_key',
  PLAN_COVERAGE_CACHE_TTL: '3600',
  
  // Claims Configuration
  PLAN_CLAIMS_ENABLED: 'true',
  PLAN_CLAIMS_AUTO_PROCESSING_ENABLED: 'true',
  PLAN_CLAIMS_DOCUMENT_TYPES: 'receipt,prescription,medical_report,exam_result',
  PLAN_CLAIMS_MAX_DOCUMENT_SIZE_MB: '10',
  PLAN_CLAIMS_PROCESSING_TIMEOUT_DAYS: '30',
  
  // Documents Configuration
  PLAN_DOCUMENTS_ENABLED: 'true',
  PLAN_DOCUMENTS_TYPES: 'policy,card,authorization,statement',
  PLAN_DOCUMENTS_STORAGE_S3_PREFIX: 'plan/documents',
  
  // Payment Configuration
  PLAN_PAYMENT_ENABLED: 'true',
  PLAN_PAYMENT_PROVIDER: 'stripe',
  PLAN_PAYMENT_STRIPE_SECRET_KEY: 'mock_plan_stripe_secret_key',
  PLAN_PAYMENT_STRIPE_PUBLIC_KEY: 'mock_plan_stripe_public_key',
  PLAN_PAYMENT_STRIPE_WEBHOOK_SECRET: 'mock_plan_stripe_webhook_secret',
  
  // Event Streaming Configuration
  PLAN_EVENTS_KAFKA_ENABLED: 'true',
  PLAN_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  PLAN_EVENTS_TOPIC_PREFIX: 'austa.plan',
  
  // Redis Configuration
  PLAN_REDIS_URL: 'redis://localhost:6379/0',
  PLAN_REDIS_TTL: '3600',
  
  // Storage Configuration
  PLAN_STORAGE_S3_BUCKET: 'austa-documents-dev',
  PLAN_STORAGE_S3_REGION: 'sa-east-1',
  PLAN_STORAGE_S3_PREFIX: 'plan',
  
  // Feature Flags
  PLAN_FEATURE_CLAIMS: 'true',
  PLAN_FEATURE_CLAIM_AUTO_PROCESSING: 'true',
  PLAN_FEATURE_PLAN_COMPARISON: 'true',
  PLAN_FEATURE_COVERAGE_CHECK: 'true',
  PLAN_FEATURE_DIGITAL_CARD: 'true',
};

/**
 * Gamification Engine specific environment mock
 * Contains all variables specific to the Gamification engine service
 */
export const MOCK_GAMIFICATION_ENGINE_ENV = {
  // Core Gamification Configuration
  GAMIFICATION_ENABLED: 'true',
  GAMIFICATION_API_PREFIX: 'api/v1/gamification',
  GAMIFICATION_CACHE_TTL: '60',
  
  // Gamification Database Configuration
  GAMIFICATION_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_gamification',
  GAMIFICATION_DATABASE_SSL: 'false',
  
  // Profile Configuration
  GAMIFICATION_PROFILES_ENABLED: 'true',
  GAMIFICATION_PROFILES_AVATAR_ENABLED: 'true',
  GAMIFICATION_PROFILES_AVATAR_S3_PREFIX: 'gamification/avatars',
  
  // Achievement Configuration
  GAMIFICATION_ACHIEVEMENTS_ENABLED: 'true',
  GAMIFICATION_ACHIEVEMENTS_NOTIFICATION_ENABLED: 'true',
  GAMIFICATION_ACHIEVEMENTS_MAX_DISPLAY: '10',
  
  // Rewards Configuration
  GAMIFICATION_REWARDS_ENABLED: 'true',
  GAMIFICATION_REWARDS_TYPES: 'badge,points,discount,gift',
  GAMIFICATION_REWARDS_EXPIRATION_DAYS: '365',
  
  // Quests Configuration
  GAMIFICATION_QUESTS_ENABLED: 'true',
  GAMIFICATION_QUESTS_MAX_ACTIVE: '5',
  GAMIFICATION_QUESTS_DAILY_REFRESH_HOUR: '0',
  
  // Rules Configuration
  GAMIFICATION_RULES_ENGINE_TYPE: 'drools',
  GAMIFICATION_RULES_REFRESH_INTERVAL_MINUTES: '15',
  GAMIFICATION_RULES_STORAGE_S3_PREFIX: 'gamification/rules',
  
  // Leaderboard Configuration
  GAMIFICATION_LEADERBOARD_ENABLED: 'true',
  GAMIFICATION_LEADERBOARD_REFRESH_INTERVAL_MINUTES: '15',
  GAMIFICATION_LEADERBOARD_MAX_ENTRIES: '100',
  GAMIFICATION_LEADERBOARD_TYPES: 'global,friends,journey',
  
  // Event Processing Configuration
  GAMIFICATION_EVENTS_KAFKA_ENABLED: 'true',
  GAMIFICATION_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  GAMIFICATION_EVENTS_TOPIC_PREFIX: 'austa.gamification',
  GAMIFICATION_EVENTS_BATCH_SIZE: '100',
  GAMIFICATION_EVENTS_PROCESSING_THREADS: '4',
  
  // Redis Configuration
  GAMIFICATION_REDIS_URL: 'redis://localhost:6379/0',
  GAMIFICATION_REDIS_TTL: '3600',
  
  // Storage Configuration
  GAMIFICATION_STORAGE_S3_BUCKET: 'austa-documents-dev',
  GAMIFICATION_STORAGE_S3_REGION: 'sa-east-1',
  GAMIFICATION_STORAGE_S3_PREFIX: 'gamification',
  
  // Feature Flags
  GAMIFICATION_FEATURE_ACHIEVEMENTS: 'true',
  GAMIFICATION_FEATURE_QUESTS: 'true',
  GAMIFICATION_FEATURE_REWARDS: 'true',
  GAMIFICATION_FEATURE_LEADERBOARD: 'true',
  GAMIFICATION_FEATURE_SOCIAL_SHARING: 'true',
};

/**
 * Notification Service specific environment mock
 * Contains all variables specific to the Notification service
 */
export const MOCK_NOTIFICATION_SERVICE_ENV = {
  // Core Notification Configuration
  NOTIFICATION_API_PREFIX: 'api/v1/notifications',
  NOTIFICATION_CACHE_TTL: '60',
  
  // Notification Database Configuration
  NOTIFICATION_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_notifications',
  NOTIFICATION_DATABASE_SSL: 'false',
  
  // Channel Configuration
  NOTIFICATION_CHANNELS_ENABLED: 'email,push,sms,in-app',
  
  // Email Configuration
  NOTIFICATION_EMAIL_ENABLED: 'true',
  NOTIFICATION_EMAIL_PROVIDER: 'sendgrid',
  NOTIFICATION_EMAIL_FROM: 'no-reply@austa.com.br',
  NOTIFICATION_EMAIL_FROM_NAME: 'AUSTA SuperApp',
  NOTIFICATION_EMAIL_SENDGRID_API_KEY: 'mock_notification_sendgrid_api_key',
  
  // SMS Configuration
  NOTIFICATION_SMS_ENABLED: 'true',
  NOTIFICATION_SMS_PROVIDER: 'twilio',
  NOTIFICATION_SMS_TWILIO_ACCOUNT_SID: 'mock_notification_twilio_account_sid',
  NOTIFICATION_SMS_TWILIO_AUTH_TOKEN: 'mock_notification_twilio_auth_token',
  NOTIFICATION_SMS_TWILIO_PHONE_NUMBER: '+5500000000000',
  
  // Push Configuration
  NOTIFICATION_PUSH_ENABLED: 'true',
  NOTIFICATION_PUSH_PROVIDER: 'onesignal',
  NOTIFICATION_PUSH_ONESIGNAL_APP_ID: 'mock_notification_onesignal_app_id',
  NOTIFICATION_PUSH_ONESIGNAL_REST_API_KEY: 'mock_notification_onesignal_api_key',
  
  // In-App Configuration
  NOTIFICATION_INAPP_ENABLED: 'true',
  NOTIFICATION_INAPP_MAX_HISTORY: '100',
  NOTIFICATION_INAPP_WEBSOCKET_ENABLED: 'true',
  
  // Template Configuration
  NOTIFICATION_TEMPLATES_ENABLED: 'true',
  NOTIFICATION_TEMPLATES_STORAGE_S3_PREFIX: 'notifications/templates',
  NOTIFICATION_TEMPLATES_REFRESH_INTERVAL_MINUTES: '15',
  
  // Preferences Configuration
  NOTIFICATION_PREFERENCES_ENABLED: 'true',
  NOTIFICATION_PREFERENCES_DEFAULT_CHANNELS: 'email,push,in-app',
  
  // Retry Configuration
  NOTIFICATION_RETRY_ENABLED: 'true',
  NOTIFICATION_RETRY_MAX_ATTEMPTS: '3',
  NOTIFICATION_RETRY_INITIAL_DELAY_MS: '1000',
  NOTIFICATION_RETRY_MAX_DELAY_MS: '60000',
  NOTIFICATION_RETRY_BACKOFF_MULTIPLIER: '2',
  NOTIFICATION_RETRY_DLQ_ENABLED: 'true',
  
  // Event Processing Configuration
  NOTIFICATION_EVENTS_KAFKA_ENABLED: 'true',
  NOTIFICATION_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  NOTIFICATION_EVENTS_TOPIC_PREFIX: 'austa.notification',
  NOTIFICATION_EVENTS_BATCH_SIZE: '100',
  NOTIFICATION_EVENTS_PROCESSING_THREADS: '4',
  
  // Redis Configuration
  NOTIFICATION_REDIS_URL: 'redis://localhost:6379/0',
  NOTIFICATION_REDIS_TTL: '3600',
  
  // WebSocket Configuration
  NOTIFICATION_WEBSOCKET_ENABLED: 'true',
  NOTIFICATION_WEBSOCKET_PATH: '/ws/notifications',
  NOTIFICATION_WEBSOCKET_PING_INTERVAL_MS: '30000',
  
  // Feature Flags
  NOTIFICATION_FEATURE_TEMPLATES: 'true',
  NOTIFICATION_FEATURE_PREFERENCES: 'true',
  NOTIFICATION_FEATURE_RETRY: 'true',
  NOTIFICATION_FEATURE_WEBSOCKET: 'true',
};

/**
 * Auth Service specific environment mock
 * Contains all variables specific to the Auth service
 */
export const MOCK_AUTH_SERVICE_ENV = {
  // Core Auth Configuration
  AUTH_API_PREFIX: 'api/v1/auth',
  AUTH_CACHE_TTL: '60',
  
  // Auth Database Configuration
  AUTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_auth',
  AUTH_DATABASE_SSL: 'false',
  
  // JWT Configuration
  AUTH_JWT_SECRET: 'mock_auth_jwt_secret',
  AUTH_JWT_EXPIRATION: '3600',
  AUTH_JWT_REFRESH_EXPIRATION: '604800',
  AUTH_JWT_ISSUER: 'austa-auth-service',
  AUTH_JWT_AUDIENCE: 'austa-services',
  
  // OAuth Configuration
  AUTH_OAUTH_ENABLED: 'true',
  AUTH_OAUTH_PROVIDERS: 'google,facebook,apple',
  AUTH_OAUTH_GOOGLE_CLIENT_ID: 'mock_auth_google_client_id',
  AUTH_OAUTH_GOOGLE_CLIENT_SECRET: 'mock_auth_google_client_secret',
  AUTH_OAUTH_FACEBOOK_CLIENT_ID: 'mock_auth_facebook_client_id',
  AUTH_OAUTH_FACEBOOK_CLIENT_SECRET: 'mock_auth_facebook_client_secret',
  AUTH_OAUTH_APPLE_CLIENT_ID: 'mock_auth_apple_client_id',
  AUTH_OAUTH_APPLE_TEAM_ID: 'mock_auth_apple_team_id',
  AUTH_OAUTH_APPLE_KEY_ID: 'mock_auth_apple_key_id',
  AUTH_OAUTH_APPLE_PRIVATE_KEY: 'mock_auth_apple_private_key',
  
  // User Configuration
  AUTH_USER_EMAIL_VERIFICATION_REQUIRED: 'true',
  AUTH_USER_EMAIL_VERIFICATION_EXPIRATION: '86400',
  AUTH_USER_PASSWORD_RESET_EXPIRATION: '3600',
  AUTH_USER_PASSWORD_MIN_LENGTH: '8',
  AUTH_USER_PASSWORD_REQUIRE_UPPERCASE: 'true',
  AUTH_USER_PASSWORD_REQUIRE_LOWERCASE: 'true',
  AUTH_USER_PASSWORD_REQUIRE_NUMBER: 'true',
  AUTH_USER_PASSWORD_REQUIRE_SPECIAL: 'true',
  
  // Role Configuration
  AUTH_ROLES_ENABLED: 'true',
  AUTH_ROLES_DEFAULT: 'user',
  AUTH_ROLES_AVAILABLE: 'user,admin,provider',
  
  // Permission Configuration
  AUTH_PERMISSIONS_ENABLED: 'true',
  AUTH_PERMISSIONS_CACHE_TTL: '300',
  
  // Redis Configuration
  AUTH_REDIS_URL: 'redis://localhost:6379/0',
  AUTH_REDIS_TTL: '3600',
  
  // Event Processing Configuration
  AUTH_EVENTS_KAFKA_ENABLED: 'true',
  AUTH_EVENTS_KAFKA_BROKERS: 'localhost:9092',
  AUTH_EVENTS_TOPIC_PREFIX: 'austa.auth',
  
  // Feature Flags
  AUTH_FEATURE_MFA: 'true',
  AUTH_FEATURE_SOCIAL_LOGIN: 'true',
  AUTH_FEATURE_RBAC: 'true',
  AUTH_FEATURE_PASSWORD_HISTORY: 'true',
};

/**
 * API Gateway specific environment mock
 * Contains all variables specific to the API Gateway service
 */
export const MOCK_API_GATEWAY_ENV = {
  // Core API Gateway Configuration
  GATEWAY_PORT: '4000',
  GATEWAY_HOST: '0.0.0.0',
  GATEWAY_CORS_ENABLED: 'true',
  GATEWAY_CORS_ORIGIN: '*',
  GATEWAY_CORS_METHODS: 'GET,POST,PUT,DELETE,OPTIONS',
  GATEWAY_CORS_HEADERS: 'Content-Type,Authorization,X-Requested-With',
  
  // GraphQL Configuration
  GATEWAY_GRAPHQL_ENABLED: 'true',
  GATEWAY_GRAPHQL_PATH: '/graphql',
  GATEWAY_GRAPHQL_PLAYGROUND_ENABLED: 'true',
  GATEWAY_GRAPHQL_INTROSPECTION_ENABLED: 'true',
  GATEWAY_GRAPHQL_DEBUG: 'true',
  
  // REST Configuration
  GATEWAY_REST_ENABLED: 'true',
  GATEWAY_REST_PREFIX: '/api',
  
  // Service Discovery Configuration
  GATEWAY_SERVICE_DISCOVERY_TYPE: 'static',
  GATEWAY_SERVICE_AUTH_URL: 'http://auth-service:3000',
  GATEWAY_SERVICE_HEALTH_URL: 'http://health-service:3001',
  GATEWAY_SERVICE_CARE_URL: 'http://care-service:3002',
  GATEWAY_SERVICE_PLAN_URL: 'http://plan-service:3003',
  GATEWAY_SERVICE_GAMIFICATION_URL: 'http://gamification-engine:3004',
  GATEWAY_SERVICE_NOTIFICATION_URL: 'http://notification-service:3005',
  
  // Authentication Configuration
  GATEWAY_AUTH_ENABLED: 'true',
  GATEWAY_AUTH_JWT_SECRET: 'mock_gateway_jwt_secret',
  GATEWAY_AUTH_PUBLIC_PATHS: '/api/v1/auth/login,/api/v1/auth/register,/api/v1/auth/refresh,/health',
  
  // Rate Limiting Configuration
  GATEWAY_RATE_LIMIT_ENABLED: 'true',
  GATEWAY_RATE_LIMIT_WINDOW_MS: '900000',
  GATEWAY_RATE_LIMIT_MAX_REQUESTS: '100',
  
  // Logging Configuration
  GATEWAY_LOG_LEVEL: 'info',
  GATEWAY_LOG_FORMAT: 'json',
  GATEWAY_REQUEST_LOGGING: 'true',
  
  // Caching Configuration
  GATEWAY_CACHE_ENABLED: 'true',
  GATEWAY_CACHE_TTL: '60',
  GATEWAY_CACHE_MAX_ITEMS: '1000',
  
  // Redis Configuration
  GATEWAY_REDIS_URL: 'redis://localhost:6379/0',
  
  // Feature Flags
  GATEWAY_FEATURE_GRAPHQL: 'true',
  GATEWAY_FEATURE_REST: 'true',
  GATEWAY_FEATURE_RATE_LIMIT: 'true',
  GATEWAY_FEATURE_CACHE: 'true',
};

/**
 * Mock environment with missing required variables
 * Used for testing error handling of missing environment variables
 */
export const MOCK_ENV_MISSING_REQUIRED = {
  // Core application configuration - missing PORT
  NODE_ENV: 'development',
  API_URL: 'http://localhost:4000/graphql',
  LOG_LEVEL: 'debug',
  
  // Database & Storage - missing DATABASE_URL
  REDIS_URL: 'redis://localhost:6379',
  
  // AWS Configuration - missing AWS_SECRET_ACCESS_KEY
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_REGION: 'sa-east-1',
  
  // Authentication & Security - missing JWT_SECRET
  JWT_EXPIRATION: '3600',
  
  // Minimal set of other variables
  KAFKA_BROKERS: 'localhost:9092',
  SENDGRID_API_KEY: 'mock_sendgrid_api_key',
  EMAIL_FROM: 'no-reply@austa.com.br',
};

/**
 * Mock environment with invalid variable types
 * Used for testing type conversion and validation
 */
export const MOCK_ENV_INVALID_TYPES = {
  // Invalid numeric values
  PORT: 'not-a-number',
  JWT_EXPIRATION: 'invalid-number',
  HEALTH_CACHE_TTL: 'abc',
  
  // Invalid boolean values
  HEALTH_JOURNEY_ENABLED: 'not-a-boolean',
  GAMIFICATION_ENABLED: 'maybe',
  
  // Invalid URL
  API_URL: 'not-a-valid-url',
  
  // Invalid JSON
  FEATURE_FLAGS: '{invalid-json',
  
  // Other required variables with valid values
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  REDIS_URL: 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  JWT_SECRET: 'mock_jwt_secret',
};

/**
 * Mock environment with invalid validation constraints
 * Used for testing validation rules like ranges, enums, etc.
 */
export const MOCK_ENV_INVALID_VALIDATION = {
  // Valid types but invalid constraints
  NODE_ENV: 'invalid-env', // Should be development, production, or test
  PORT: '99999', // Port number too high
  LOG_LEVEL: 'extreme', // Invalid log level
  
  // Invalid ranges
  JWT_EXPIRATION: '0', // Too low
  RATE_LIMIT_MAX_REQUESTS: '-10', // Negative value
  
  // Other required variables with valid values
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  REDIS_URL: 'redis://localhost:6379',
  API_URL: 'http://localhost:4000/graphql',
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  JWT_SECRET: 'mock_jwt_secret',
};

/**
 * Mock environment with minimal valid configuration
 * Contains only the essential variables needed for the application to start
 */
export const MOCK_ENV_MINIMAL = {
  // Core application configuration
  NODE_ENV: 'development',
  PORT: '4000',
  LOG_LEVEL: 'info',
  
  // Database & Storage
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  REDIS_URL: 'redis://localhost:6379',
  
  // AWS Configuration
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  S3_BUCKET: 'austa-documents-dev',
  
  // Authentication & Security
  JWT_SECRET: 'mock_jwt_secret',
  JWT_EXPIRATION: '3600',
  
  // Kafka Configuration
  KAFKA_BROKERS: 'localhost:9092',
  
  // Journey Configuration
  HEALTH_JOURNEY_ENABLED: 'true',
  CARE_JOURNEY_ENABLED: 'true',
  PLAN_JOURNEY_ENABLED: 'true',
  GAMIFICATION_ENABLED: 'true',
};

/**
 * Mock environment with feature flags configuration
 * Used for testing feature flag functionality
 */
export const MOCK_ENV_FEATURE_FLAGS = {
  // Global feature flags
  FEATURE_FLAGS: 'gamification,telemedicine,wearable_sync',
  FEATURE_DARK_MODE: 'true',
  FEATURE_BETA_FEATURES: 'false',
  
  // Journey-specific feature flags
  HEALTH_FEATURE_WEARABLE_SYNC: 'true',
  HEALTH_FEATURE_INSIGHTS: 'true',
  HEALTH_FEATURE_GOALS: 'false',
  
  CARE_FEATURE_TELEMEDICINE: 'true',
  CARE_FEATURE_SYMPTOM_CHECKER: 'true',
  CARE_FEATURE_MEDICATION_REMINDERS: 'false',
  
  PLAN_FEATURE_CLAIMS: 'true',
  PLAN_FEATURE_CLAIM_AUTO_PROCESSING: 'false',
  PLAN_FEATURE_DIGITAL_CARD: 'true',
  
  GAMIFICATION_FEATURE_ACHIEVEMENTS: 'true',
  GAMIFICATION_FEATURE_QUESTS: 'true',
  GAMIFICATION_FEATURE_LEADERBOARD: 'false',
  
  // Other required variables with valid values
  NODE_ENV: 'development',
  PORT: '4000',
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  REDIS_URL: 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  JWT_SECRET: 'mock_jwt_secret',
  JWT_EXPIRATION: '3600',
};

/**
 * Mock environment with sensitive information
 * Used for testing masking of sensitive values in logs
 */
export const MOCK_ENV_SENSITIVE = {
  // Sensitive authentication information
  JWT_SECRET: 'super_secret_jwt_key_that_should_be_masked',
  COGNITO_CLIENT_SECRET: 'very_sensitive_cognito_secret',
  
  // Sensitive API keys
  AWS_SECRET_ACCESS_KEY: 'AKIAIOSFODNN7EXAMPLE_secret',
  SENDGRID_API_KEY: 'SG.sensitive_sendgrid_key_value',
  STRIPE_SECRET_KEY: 'sk_test_sensitive_stripe_key',
  TWILIO_AUTH_TOKEN: 'sensitive_twilio_auth_token',
  
  // Database credentials
  DATABASE_URL: 'postgresql://username:password123@localhost:5432/austa',
  
  // Other required variables with non-sensitive values
  NODE_ENV: 'development',
  PORT: '4000',
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_REGION: 'sa-east-1',
  JWT_EXPIRATION: '3600',
  REDIS_URL: 'redis://localhost:6379',
};

/**
 * Mock environment with journey-specific namespaced variables
 * Used for testing journey-specific environment variable access
 */
export const MOCK_ENV_JOURNEY_NAMESPACED = {
  // Global variables
  NODE_ENV: 'development',
  PORT: '4000',
  LOG_LEVEL: 'info',
  
  // Health journey variables
  HEALTH_API_PREFIX: 'api/v1/health',
  HEALTH_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_health',
  HEALTH_CACHE_TTL: '300',
  HEALTH_FEATURE_WEARABLE_SYNC: 'true',
  
  // Care journey variables
  CARE_API_PREFIX: 'api/v1/care',
  CARE_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_care',
  CARE_CACHE_TTL: '60',
  CARE_FEATURE_TELEMEDICINE: 'true',
  
  // Plan journey variables
  PLAN_API_PREFIX: 'api/v1/plan',
  PLAN_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_plan',
  PLAN_CACHE_TTL: '900',
  PLAN_FEATURE_CLAIMS: 'true',
  
  // Gamification variables
  GAMIFICATION_API_PREFIX: 'api/v1/gamification',
  GAMIFICATION_DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa_gamification',
  GAMIFICATION_CACHE_TTL: '60',
  GAMIFICATION_FEATURE_ACHIEVEMENTS: 'true',
  
  // Other required variables
  DATABASE_URL: 'postgresql://postgres:password@localhost:5432/austa',
  REDIS_URL: 'redis://localhost:6379',
  AWS_ACCESS_KEY_ID: 'mock_access_key_id',
  AWS_SECRET_ACCESS_KEY: 'mock_secret_access_key',
  AWS_REGION: 'sa-east-1',
  JWT_SECRET: 'mock_jwt_secret',
  JWT_EXPIRATION: '3600',
};

/**
 * Utility function to merge multiple mock environments
 * Useful for creating complex test scenarios with combined environment variables
 * 
 * @param envs - Array of environment objects to merge
 * @returns Merged environment object
 */
export function mergeMockEnvs(...envs: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...envs);
}

/**
 * Utility function to apply a mock environment to process.env
 * Temporarily replaces process.env with the provided mock for testing
 * 
 * @param mockEnv - The mock environment to apply
 * @returns Function to restore the original process.env
 */
export function applyMockEnv(mockEnv: Record<string, string>): () => void {
  const originalEnv = { ...process.env };
  
  // Clear current env and apply mock
  Object.keys(process.env).forEach(key => {
    delete process.env[key];
  });
  
  Object.entries(mockEnv).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Return function to restore original env
  return () => {
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
    
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        process.env[key] = value;
      }
    });
  };
}

/**
 * Creates a custom mock environment with specific overrides
 * 
 * @param baseEnv - Base environment to start with
 * @param overrides - Specific values to override in the base environment
 * @returns New environment object with applied overrides
 */
export function createCustomMockEnv(
  baseEnv: Record<string, string> = MOCK_DEV_ENV,
  overrides: Record<string, string> = {}
): Record<string, string> {
  return {
    ...baseEnv,
    ...overrides
  };
}