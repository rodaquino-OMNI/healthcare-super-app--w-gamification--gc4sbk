import { registerAs } from '@nestjs/config';
import { validationSchema } from '@app/health/config/validation.schema';

/**
 * Health service configuration
 * 
 * Provides structured access to environment variables with sensible defaults
 * Registered with NestJS ConfigModule for centralized configuration management
 * 
 * This configuration follows the standardized naming conventions across all AUSTA services
 * and provides enhanced type safety for all configuration values.
 */

// Define the configuration interface for better type safety
export interface HealthServiceConfig {
  // Core configuration
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  
  // Database configuration
  databaseUrl: string;
  databaseSSL: boolean;
  databaseConnectionPoolMin: number;
  databaseConnectionPoolMax: number;
  
  // TimescaleDB configuration
  timescaleEnabled: boolean;
  metricsRetentionDays: number;
  metricsAggregationEnabled: boolean;
  metricsAggregationIntervals: string;
  
  // FHIR API configuration
  fhirApiEnabled: boolean;
  fhirApiUrl?: string;
  fhirApiAuthType: 'oauth2' | 'basic' | 'none';
  fhirApiClientId?: string;
  fhirApiClientSecret?: string;
  fhirApiScope?: string;
  fhirApiTokenUrl?: string;
  fhirApiUsername?: string;
  fhirApiPassword?: string;
  fhirApiTimeout: number;
  fhirApiRetryAttempts: number;
  
  // Wearables configuration
  wearablesSyncEnabled: boolean;
  wearablesSupported: string;
  googlefitClientId?: string;
  googlefitClientSecret?: string;
  healthkitTeamId?: string;
  healthkitKeyId?: string;
  healthkitPrivateKey?: string;
  fitbitClientId?: string;
  fitbitClientSecret?: string;
  wearablesSyncInterval: number;
  wearablesMaxSyncDays: number;
  
  // Health features configuration
  healthGoalsMaxActive: number;
  healthInsightsEnabled: boolean;
  healthInsightsGenerationInterval: number;
  healthInsightsModelsPath?: string;
  
  // Event streaming configuration
  eventsKafkaEnabled: boolean;
  eventsKafkaBrokers?: string;
  eventsTopicPrefix: string;
  eventsSchemaValidation: boolean;
  eventsSchemaRegistryUrl?: string;
  
  // Caching configuration
  redisUrl: string;
  redisTtl: number;
  redisClusterEnabled: boolean;
  
  // Medical history configuration
  medicalHistoryMaxEvents: number;
  
  // Storage configuration
  storageS3Bucket?: string;
  storageS3Region?: string;
  storageS3Prefix: string;
  
  // Tracing and observability configuration
  tracingEnabled: boolean;
  tracingExporter: 'jaeger' | 'zipkin' | 'otlp' | 'console' | 'none';
  tracingEndpoint?: string;
  metricsEnabled: boolean;
  metricsEndpoint: string;
  
  // Error handling configuration
  errorTrackingEnabled: boolean;
  errorTrackingDsn?: string;
  errorTrackingEnvironment: string;
  errorTrackingSampleRate: number;
  
  // Journey integration configuration
  journeyContextEnabled: boolean;
  journeyContextSyncInterval: number;
  
  // Feature flags
  featureEnhancedMetrics: boolean;
  featureCrossJourneyEvents: boolean;
  featureGamificationIntegration: boolean;
  featureHealthPredictions: boolean;
  featureDeviceAutoDiscovery: boolean;
}

/**
 * Parse boolean from environment variable string
 * @param value Environment variable value
 * @returns Parsed boolean value
 */
const parseBoolean = (value: string | undefined): boolean => {
  return value === 'true';
};

/**
 * Health service configuration factory
 * Registered with NestJS ConfigModule using the 'health' namespace
 */
export const health = registerAs<HealthServiceConfig>('health', () => ({
  // Core configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSSL: parseBoolean(process.env.DATABASE_SSL),
  databaseConnectionPoolMin: parseInt(process.env.DATABASE_CONNECTION_POOL_MIN || '5', 10),
  databaseConnectionPoolMax: parseInt(process.env.DATABASE_CONNECTION_POOL_MAX || '20', 10),
  
  // TimescaleDB configuration
  timescaleEnabled: parseBoolean(process.env.TIMESCALE_ENABLED),
  metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '730', 10),
  metricsAggregationEnabled: parseBoolean(process.env.METRICS_AGGREGATION_ENABLED),
  metricsAggregationIntervals: process.env.METRICS_AGGREGATION_INTERVALS || 'hour,day,week,month',
  
  // FHIR API configuration
  fhirApiEnabled: parseBoolean(process.env.FHIR_API_ENABLED),
  fhirApiUrl: process.env.FHIR_API_URL,
  fhirApiAuthType: (process.env.FHIR_API_AUTH_TYPE || 'oauth2') as 'oauth2' | 'basic' | 'none',
  fhirApiClientId: process.env.FHIR_API_CLIENT_ID,
  fhirApiClientSecret: process.env.FHIR_API_CLIENT_SECRET,
  fhirApiScope: process.env.FHIR_API_SCOPE,
  fhirApiTokenUrl: process.env.FHIR_API_TOKEN_URL,
  fhirApiUsername: process.env.FHIR_API_USERNAME,
  fhirApiPassword: process.env.FHIR_API_PASSWORD,
  fhirApiTimeout: parseInt(process.env.FHIR_API_TIMEOUT || '10000', 10),
  fhirApiRetryAttempts: parseInt(process.env.FHIR_API_RETRY_ATTEMPTS || '3', 10),
  
  // Wearables configuration
  wearablesSyncEnabled: parseBoolean(process.env.WEARABLES_SYNC_ENABLED),
  wearablesSupported: process.env.WEARABLES_SUPPORTED || 'googlefit,healthkit,fitbit',
  googlefitClientId: process.env.GOOGLEFIT_CLIENT_ID,
  googlefitClientSecret: process.env.GOOGLEFIT_CLIENT_SECRET,
  healthkitTeamId: process.env.HEALTHKIT_TEAM_ID,
  healthkitKeyId: process.env.HEALTHKIT_KEY_ID,
  healthkitPrivateKey: process.env.HEALTHKIT_PRIVATE_KEY,
  fitbitClientId: process.env.FITBIT_CLIENT_ID,
  fitbitClientSecret: process.env.FITBIT_CLIENT_SECRET,
  wearablesSyncInterval: parseInt(process.env.WEARABLES_SYNC_INTERVAL || '15', 10),
  wearablesMaxSyncDays: parseInt(process.env.WEARABLES_MAX_SYNC_DAYS || '30', 10),
  
  // Health features configuration
  healthGoalsMaxActive: parseInt(process.env.HEALTH_GOALS_MAX_ACTIVE || '10', 10),
  healthInsightsEnabled: parseBoolean(process.env.HEALTH_INSIGHTS_ENABLED),
  healthInsightsGenerationInterval: parseInt(process.env.HEALTH_INSIGHTS_GENERATION_INTERVAL || '24', 10),
  healthInsightsModelsPath: process.env.HEALTH_INSIGHTS_MODELS_PATH,
  
  // Event streaming configuration
  eventsKafkaEnabled: parseBoolean(process.env.EVENTS_KAFKA_ENABLED),
  eventsKafkaBrokers: process.env.EVENTS_KAFKA_BROKERS,
  eventsTopicPrefix: process.env.EVENTS_TOPIC_PREFIX || 'austa.health',
  eventsSchemaValidation: parseBoolean(process.env.EVENTS_SCHEMA_VALIDATION),
  eventsSchemaRegistryUrl: process.env.EVENTS_SCHEMA_REGISTRY_URL,
  
  // Caching configuration
  redisUrl: process.env.REDIS_URL || '',
  redisTtl: parseInt(process.env.REDIS_TTL || '3600', 10),
  redisClusterEnabled: parseBoolean(process.env.REDIS_CLUSTER_ENABLED),
  
  // Medical history configuration
  medicalHistoryMaxEvents: parseInt(process.env.MEDICAL_HISTORY_MAX_EVENTS || '1000', 10),
  
  // Storage configuration
  storageS3Bucket: process.env.STORAGE_S3_BUCKET,
  storageS3Region: process.env.STORAGE_S3_REGION,
  storageS3Prefix: process.env.STORAGE_S3_PREFIX || 'health',
  
  // Tracing and observability configuration
  tracingEnabled: parseBoolean(process.env.TRACING_ENABLED),
  tracingExporter: (process.env.TRACING_EXPORTER || 'console') as 'jaeger' | 'zipkin' | 'otlp' | 'console' | 'none',
  tracingEndpoint: process.env.TRACING_ENDPOINT,
  metricsEnabled: parseBoolean(process.env.METRICS_ENABLED),
  metricsEndpoint: process.env.METRICS_ENDPOINT || '/metrics',
  
  // Error handling configuration
  errorTrackingEnabled: parseBoolean(process.env.ERROR_TRACKING_ENABLED),
  errorTrackingDsn: process.env.ERROR_TRACKING_DSN,
  errorTrackingEnvironment: process.env.ERROR_TRACKING_ENVIRONMENT || process.env.NODE_ENV || 'development',
  errorTrackingSampleRate: parseFloat(process.env.ERROR_TRACKING_SAMPLE_RATE || '1.0'),
  
  // Journey integration configuration
  journeyContextEnabled: parseBoolean(process.env.JOURNEY_CONTEXT_ENABLED),
  journeyContextSyncInterval: parseInt(process.env.JOURNEY_CONTEXT_SYNC_INTERVAL || '60', 10),
  
  // Feature flags
  featureEnhancedMetrics: parseBoolean(process.env.FEATURE_ENHANCED_METRICS),
  featureCrossJourneyEvents: parseBoolean(process.env.FEATURE_CROSS_JOURNEY_EVENTS),
  featureGamificationIntegration: parseBoolean(process.env.FEATURE_GAMIFICATION_INTEGRATION),
  featureHealthPredictions: parseBoolean(process.env.FEATURE_HEALTH_PREDICTIONS),
  featureDeviceAutoDiscovery: parseBoolean(process.env.FEATURE_DEVICE_AUTO_DISCOVERY),
}));

// Export the validation schema for use in the app module
export { validationSchema };