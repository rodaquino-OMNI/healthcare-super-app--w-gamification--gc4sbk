/**
 * Journey-specific environment variable test fixtures
 * 
 * This module provides test fixtures for journey-specific environment variables
 * covering Health, Care, and Plan journeys. These fixtures enable testing of the
 * journey-specific environment handling in env/journey.ts, ensuring that environment
 * variables are properly namespaced, prefixed, and isolated between different journey contexts.
 */

import { JourneyType } from '../../../src/env/journey';

/**
 * Mock environment variables for the Health journey
 */
export const healthJourneyEnvs = {
  // Core configuration
  'HEALTH_NODE_ENV': 'development',
  'HEALTH_PORT': '3001',
  'HEALTH_API_PREFIX': 'api/v1/health',
  'HEALTH_DATABASE_URL': 'postgresql://postgres:password@localhost:5432/austa_health',
  'HEALTH_DATABASE_SSL': 'false',
  
  // Health-specific configuration
  'HEALTH_TIMESCALE_ENABLED': 'true',
  'HEALTH_METRICS_RETENTION_DAYS': '730',
  'HEALTH_METRICS_AGGREGATION_ENABLED': 'true',
  'HEALTH_METRICS_AGGREGATION_INTERVALS': 'hour,day,week,month',
  
  // FHIR API configuration
  'HEALTH_FHIR_API_ENABLED': 'true',
  'HEALTH_FHIR_API_URL': 'https://fhir.example.com/health',
  'HEALTH_FHIR_API_AUTH_TYPE': 'oauth2',
  'HEALTH_FHIR_API_CLIENT_ID': 'health-client-id',
  'HEALTH_FHIR_API_CLIENT_SECRET': 'health-client-secret',
  'HEALTH_FHIR_API_TOKEN_URL': 'https://fhir.example.com/oauth2/token',
  
  // Wearables configuration
  'HEALTH_WEARABLES_SYNC_ENABLED': 'true',
  'HEALTH_WEARABLES_SUPPORTED': 'googlefit,healthkit,fitbit',
  'HEALTH_WEARABLES_SYNC_INTERVAL': '15',
  'HEALTH_WEARABLES_MAX_SYNC_DAYS': '30',
  
  // Health Goals configuration
  'HEALTH_HEALTH_GOALS_MAX_ACTIVE': '10',
  
  // Health Insights configuration
  'HEALTH_HEALTH_INSIGHTS_ENABLED': 'true',
  'HEALTH_HEALTH_INSIGHTS_GENERATION_INTERVAL': '24',
  'HEALTH_HEALTH_INSIGHTS_MODELS_PATH': '/models/health',
  
  // Event streaming configuration
  'HEALTH_EVENTS_KAFKA_ENABLED': 'true',
  'HEALTH_EVENTS_KAFKA_BROKERS': 'kafka:9092',
  'HEALTH_EVENTS_TOPIC_PREFIX': 'austa.health',
  
  // Redis configuration
  'HEALTH_REDIS_URL': 'redis://localhost:6379/0',
  'HEALTH_REDIS_TTL': '300',
  
  // Storage configuration
  'HEALTH_STORAGE_S3_BUCKET': 'austa-health-dev',
  'HEALTH_STORAGE_S3_REGION': 'sa-east-1',
  'HEALTH_STORAGE_S3_PREFIX': 'health',
  
  // Feature flags
  'HEALTH_FEATURE_WEARABLE_SYNC': 'true',
  'HEALTH_FEATURE_HEALTH_INSIGHTS': 'true',
  'HEALTH_FEATURE_HEALTH_INSIGHTS_PERCENTAGE': '50',
  'HEALTH_FEATURE_FHIR_INTEGRATION': 'true',
  'HEALTH_FEATURE_ADVANCED_METRICS': 'false'
};

/**
 * Mock environment variables for the Care journey
 */
export const careJourneyEnvs = {
  // Core configuration
  'CARE_NODE_ENV': 'development',
  'CARE_PORT': '3002',
  'CARE_API_PREFIX': 'api/v1/care',
  'CARE_DATABASE_URL': 'postgresql://postgres:password@localhost:5432/austa_care',
  'CARE_DATABASE_SSL': 'false',
  
  // Care-specific configuration
  'CARE_TELEMEDICINE_ENABLED': 'true',
  'CARE_TELEMEDICINE_PROVIDER': 'agora',
  'CARE_TELEMEDICINE_APP_ID': 'care-app-id',
  'CARE_TELEMEDICINE_APP_CERTIFICATE': 'care-app-certificate',
  
  // Provider configuration
  'CARE_PROVIDER_SEARCH_RADIUS_KM': '50',
  'CARE_PROVIDER_MAX_RESULTS': '100',
  'CARE_PROVIDER_CACHE_TTL': '3600',
  
  // Appointment configuration
  'CARE_APPOINTMENT_REMINDER_MINUTES': '30,60,1440',
  'CARE_APPOINTMENT_MAX_RESCHEDULE': '3',
  'CARE_APPOINTMENT_BUFFER_MINUTES': '15',
  
  // Medication configuration
  'CARE_MEDICATION_REMINDER_ENABLED': 'true',
  'CARE_MEDICATION_REMINDER_DEFAULT_TIMES': '08:00,12:00,18:00,22:00',
  'CARE_MEDICATION_DATABASE_URL': 'https://api.medications.example.com',
  
  // Symptom checker configuration
  'CARE_SYMPTOM_CHECKER_ENABLED': 'true',
  'CARE_SYMPTOM_CHECKER_API_URL': 'https://api.symptoms.example.com',
  'CARE_SYMPTOM_CHECKER_API_KEY': 'care-symptom-checker-key',
  
  // Event streaming configuration
  'CARE_EVENTS_KAFKA_ENABLED': 'true',
  'CARE_EVENTS_KAFKA_BROKERS': 'kafka:9092',
  'CARE_EVENTS_TOPIC_PREFIX': 'austa.care',
  
  // Redis configuration
  'CARE_REDIS_URL': 'redis://localhost:6379/1',
  'CARE_REDIS_TTL': '60',
  
  // Storage configuration
  'CARE_STORAGE_S3_BUCKET': 'austa-care-dev',
  'CARE_STORAGE_S3_REGION': 'sa-east-1',
  'CARE_STORAGE_S3_PREFIX': 'care',
  
  // Feature flags
  'CARE_FEATURE_TELEMEDICINE': 'true',
  'CARE_FEATURE_SYMPTOM_CHECKER': 'true',
  'CARE_FEATURE_MEDICATION_REMINDER': 'true',
  'CARE_FEATURE_MEDICATION_REMINDER_PERCENTAGE': '75',
  'CARE_FEATURE_PROVIDER_RATING': 'false'
};

/**
 * Mock environment variables for the Plan journey
 */
export const planJourneyEnvs = {
  // Core configuration
  'PLAN_NODE_ENV': 'development',
  'PLAN_PORT': '3003',
  'PLAN_API_PREFIX': 'api/v1/plan',
  'PLAN_DATABASE_URL': 'postgresql://postgres:password@localhost:5432/austa_plan',
  'PLAN_DATABASE_SSL': 'false',
  
  // Plan-specific configuration
  'PLAN_COVERAGE_CHECK_ENABLED': 'true',
  'PLAN_COVERAGE_CHECK_TIMEOUT_MS': '5000',
  'PLAN_COVERAGE_CACHE_TTL': '86400',
  
  // Claims configuration
  'PLAN_CLAIMS_AUTO_PROCESSING_ENABLED': 'true',
  'PLAN_CLAIMS_PROCESSING_INTERVAL': '15',
  'PLAN_CLAIMS_MAX_ATTACHMENT_SIZE_MB': '10',
  'PLAN_CLAIMS_ALLOWED_MIME_TYPES': 'application/pdf,image/jpeg,image/png',
  
  // Benefits configuration
  'PLAN_BENEFITS_REFRESH_INTERVAL_HOURS': '24',
  'PLAN_BENEFITS_CACHE_TTL': '86400',
  
  // Document configuration
  'PLAN_DOCUMENT_EXPIRY_DAYS': '90',
  'PLAN_DOCUMENT_MAX_SIZE_MB': '25',
  
  // Payment configuration
  'PLAN_PAYMENT_GATEWAY': 'stripe',
  'PLAN_PAYMENT_PUBLIC_KEY': 'pk_test_plan',
  'PLAN_PAYMENT_SECRET_KEY': 'sk_test_plan',
  'PLAN_PAYMENT_WEBHOOK_SECRET': 'whsec_plan',
  
  // Event streaming configuration
  'PLAN_EVENTS_KAFKA_ENABLED': 'true',
  'PLAN_EVENTS_KAFKA_BROKERS': 'kafka:9092',
  'PLAN_EVENTS_TOPIC_PREFIX': 'austa.plan',
  
  // Redis configuration
  'PLAN_REDIS_URL': 'redis://localhost:6379/2',
  'PLAN_REDIS_TTL': '900',
  
  // Storage configuration
  'PLAN_STORAGE_S3_BUCKET': 'austa-plan-dev',
  'PLAN_STORAGE_S3_REGION': 'sa-east-1',
  'PLAN_STORAGE_S3_PREFIX': 'plan',
  
  // Feature flags
  'PLAN_FEATURE_CLAIM_AUTO_PROCESSING': 'true',
  'PLAN_FEATURE_CLAIM_AUTO_PROCESSING_PERCENTAGE': '25',
  'PLAN_FEATURE_DIGITAL_ID_CARD': 'true',
  'PLAN_FEATURE_BENEFIT_COMPARISON': 'true',
  'PLAN_FEATURE_PAYMENT_INTEGRATION': 'false'
};

/**
 * Mock environment variables for shared configuration across journeys
 */
export const sharedJourneyEnvs = {
  // Core shared configuration
  'SHARED_NODE_ENV': 'development',
  'SHARED_LOG_LEVEL': 'info',
  'SHARED_API_URL': 'http://localhost:4000/graphql',
  
  // Authentication configuration
  'SHARED_JWT_SECRET': 'shared-jwt-secret-key',
  'SHARED_JWT_EXPIRATION': '3600',
  'SHARED_REFRESH_TOKEN_EXPIRATION': '604800',
  
  // AWS configuration
  'SHARED_AWS_ACCESS_KEY_ID': 'shared-access-key-id',
  'SHARED_AWS_SECRET_ACCESS_KEY': 'shared-secret-access-key',
  'SHARED_AWS_REGION': 'sa-east-1',
  
  // Monitoring configuration
  'SHARED_DATADOG_API_KEY': 'shared-datadog-api-key',
  'SHARED_DATADOG_APP_KEY': 'shared-datadog-app-key',
  'SHARED_SENTRY_DSN': 'https://shared-sentry-dsn.ingest.sentry.io/shared',
  
  // Rate limiting
  'SHARED_RATE_LIMIT_WINDOW_MS': '900000',
  'SHARED_RATE_LIMIT_MAX_REQUESTS': '100',
  
  // Feature flags
  'SHARED_FEATURE_GAMIFICATION': 'true',
  'SHARED_FEATURE_NOTIFICATIONS': 'true',
  'SHARED_FEATURE_USER_FEEDBACK': 'false'
};

/**
 * Test cases for cross-journey inheritance
 */
export const crossJourneyInheritanceCases = [
  {
    description: 'Database URLs with health as primary',
    variableName: 'DATABASE_URL',
    shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
    expectedValue: 'postgresql://postgres:password@localhost:5432/austa_health'
  },
  {
    description: 'Redis URLs with care as primary',
    variableName: 'REDIS_URL',
    shareAcross: [JourneyType.CARE, JourneyType.HEALTH, JourneyType.PLAN],
    expectedValue: 'redis://localhost:6379/1'
  },
  {
    description: 'S3 bucket with plan as primary',
    variableName: 'STORAGE_S3_BUCKET',
    shareAcross: [JourneyType.PLAN, JourneyType.CARE, JourneyType.HEALTH],
    expectedValue: 'austa-plan-dev'
  },
  {
    description: 'Shared JWT secret',
    variableName: 'JWT_SECRET',
    shareAcross: [JourneyType.SHARED, JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
    expectedValue: 'shared-jwt-secret-key'
  },
  {
    description: 'Non-existent variable with default',
    variableName: 'NON_EXISTENT_VARIABLE',
    shareAcross: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN],
    defaultValue: 'default-value',
    expectedValue: 'default-value'
  }
];

/**
 * Test cases for journey-specific feature flags
 */
export const featureFlagTestCases = [
  {
    description: 'Health journey with wearable sync enabled',
    journeyType: JourneyType.HEALTH,
    featureName: 'WEARABLE_SYNC',
    expectedEnabled: true,
    expectedPercentage: undefined
  },
  {
    description: 'Health journey with health insights enabled with percentage rollout',
    journeyType: JourneyType.HEALTH,
    featureName: 'HEALTH_INSIGHTS',
    expectedEnabled: true,
    expectedPercentage: 50
  },
  {
    description: 'Health journey with advanced metrics disabled',
    journeyType: JourneyType.HEALTH,
    featureName: 'ADVANCED_METRICS',
    expectedEnabled: false,
    expectedPercentage: undefined
  },
  {
    description: 'Care journey with telemedicine enabled',
    journeyType: JourneyType.CARE,
    featureName: 'TELEMEDICINE',
    expectedEnabled: true,
    expectedPercentage: undefined
  },
  {
    description: 'Care journey with medication reminder enabled with percentage rollout',
    journeyType: JourneyType.CARE,
    featureName: 'MEDICATION_REMINDER',
    expectedEnabled: true,
    expectedPercentage: 75
  },
  {
    description: 'Care journey with provider rating disabled',
    journeyType: JourneyType.CARE,
    featureName: 'PROVIDER_RATING',
    expectedEnabled: false,
    expectedPercentage: undefined
  },
  {
    description: 'Plan journey with claim auto processing enabled with percentage rollout',
    journeyType: JourneyType.PLAN,
    featureName: 'CLAIM_AUTO_PROCESSING',
    expectedEnabled: true,
    expectedPercentage: 25
  },
  {
    description: 'Plan journey with digital ID card enabled',
    journeyType: JourneyType.PLAN,
    featureName: 'DIGITAL_ID_CARD',
    expectedEnabled: true,
    expectedPercentage: undefined
  },
  {
    description: 'Plan journey with payment integration disabled',
    journeyType: JourneyType.PLAN,
    featureName: 'PAYMENT_INTEGRATION',
    expectedEnabled: false,
    expectedPercentage: undefined
  },
  {
    description: 'Shared feature flag for gamification enabled',
    journeyType: JourneyType.SHARED,
    featureName: 'GAMIFICATION',
    expectedEnabled: true,
    expectedPercentage: undefined
  },
  {
    description: 'Shared feature flag for user feedback disabled',
    journeyType: JourneyType.SHARED,
    featureName: 'USER_FEEDBACK',
    expectedEnabled: false,
    expectedPercentage: undefined
  }
];

/**
 * Test cases for journey-specific service endpoints
 */
export const serviceEndpointTestCases = [
  {
    description: 'Health journey FHIR API URL',
    journeyType: JourneyType.HEALTH,
    variableName: 'FHIR_API_URL',
    expectedValue: 'https://fhir.example.com/health'
  },
  {
    description: 'Care journey symptom checker API URL',
    journeyType: JourneyType.CARE,
    variableName: 'SYMPTOM_CHECKER_API_URL',
    expectedValue: 'https://api.symptoms.example.com'
  },
  {
    description: 'Plan journey with non-existent endpoint',
    journeyType: JourneyType.PLAN,
    variableName: 'NON_EXISTENT_ENDPOINT',
    defaultValue: 'https://default-endpoint.example.com',
    expectedValue: 'https://default-endpoint.example.com'
  }
];

/**
 * Test users for feature flag percentage rollout testing
 */
export const testUsers = [
  { id: 'user-1', name: 'Test User 1' },
  { id: 'user-2', name: 'Test User 2' },
  { id: 'user-3', name: 'Test User 3' },
  { id: 'user-4', name: 'Test User 4' },
  { id: 'user-5', name: 'Test User 5' },
  { id: 'user-6', name: 'Test User 6' },
  { id: 'user-7', name: 'Test User 7' },
  { id: 'user-8', name: 'Test User 8' },
  { id: 'user-9', name: 'Test User 9' },
  { id: 'user-10', name: 'Test User 10' }
];

/**
 * Combined environment variables for testing
 */
export const combinedEnvs = {
  ...healthJourneyEnvs,
  ...careJourneyEnvs,
  ...planJourneyEnvs,
  ...sharedJourneyEnvs
};

/**
 * Helper function to set up test environment variables
 * @param envVars - Environment variables to set
 * @returns Function to restore original environment variables
 */
export const setupTestEnv = (envVars: Record<string, string> = combinedEnvs): () => void => {
  // Store original environment variables
  const originalEnv = { ...process.env };
  
  // Set test environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
  
  // Return function to restore original environment
  return () => {
    // Remove test environment variables
    Object.keys(envVars).forEach(key => {
      delete process.env[key];
    });
    
    // Restore original environment variables
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  };
};