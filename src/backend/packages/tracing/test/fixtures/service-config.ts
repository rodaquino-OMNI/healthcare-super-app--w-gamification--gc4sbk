import { TracingOptions } from '../../src/interfaces/tracing-options.interface';

/**
 * Mock service configurations for tracing tests.
 * These configurations provide realistic service settings for different environments
 * and journey contexts to test tracer initialization and configuration.
 */

/**
 * Base configuration for development environment
 * Uses console exporter with high sampling rate for debugging
 */
const developmentBaseConfig: Partial<TracingOptions> = {
  service: {
    environment: 'development',
    version: '1.0.0',
  },
  sampling: {
    rate: 1.0, // Sample all traces in development
    alwaysSampleErrors: true,
  },
  exporter: {
    type: 'console',
    console: {
      prettyPrint: true,
    },
  },
  batch: {
    maxExportBatchSize: 100,
    scheduledDelayMillis: 1000,
    maxQueueSize: 500,
  },
  debug: true,
  disabled: false,
};

/**
 * Base configuration for staging environment
 * Uses OTLP exporter with moderate sampling rate for testing
 */
const stagingBaseConfig: Partial<TracingOptions> = {
  service: {
    environment: 'staging',
    version: '1.0.0',
  },
  sampling: {
    rate: 0.5, // Sample 50% of traces in staging
    alwaysSampleErrors: true,
    alwaysSamplePaths: [
      '/api/health/metrics',
      '/api/care/appointments',
      '/api/plan/claims',
    ],
  },
  exporter: {
    type: 'otlp',
    otlp: {
      protocol: 'http/protobuf',
      endpoint: 'http://otel-collector.staging.austa.internal:4318/v1/traces',
      headers: {
        'x-austa-environment': 'staging',
      },
      timeoutMillis: 5000,
      compression: 'gzip',
      maxRetries: 3,
    },
  },
  batch: {
    maxExportBatchSize: 256,
    scheduledDelayMillis: 3000,
    maxQueueSize: 1024,
  },
  debug: false,
  disabled: false,
};

/**
 * Base configuration for production environment
 * Uses OTLP exporter with lower sampling rate for performance
 */
const productionBaseConfig: Partial<TracingOptions> = {
  service: {
    environment: 'production',
    version: '1.0.0',
  },
  sampling: {
    rate: 0.1, // Sample 10% of traces in production
    alwaysSampleErrors: true,
    alwaysSamplePaths: [
      '/api/health/metrics',
      '/api/care/appointments',
      '/api/plan/claims',
      '/api/auth/login',
      '/api/gamification/achievements',
    ],
  },
  exporter: {
    type: 'otlp',
    otlp: {
      protocol: 'grpc',
      endpoint: 'http://otel-collector.production.austa.internal:4317',
      headers: {
        'x-austa-environment': 'production',
      },
      timeoutMillis: 10000,
      compression: 'gzip',
      maxRetries: 5,
      initialBackoffMillis: 1000,
      maxBackoffMillis: 5000,
      maxConcurrentExports: 2,
    },
  },
  batch: {
    maxExportBatchSize: 512,
    scheduledDelayMillis: 5000,
    maxQueueSize: 2048,
  },
  debug: false,
  disabled: false,
};

/**
 * Health Journey Service configurations for different environments
 */
export const healthServiceConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-health-service',
      journey: 'health',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'health-dev-1',
      'deployment.environment': 'development',
    },
    journeyConfig: {
      health: {
        includeMetrics: true,
        includeDeviceInfo: true,
      },
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-health-service',
      journey: 'health',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'health-staging-1',
      'deployment.environment': 'staging',
    },
    journeyConfig: {
      health: {
        includeMetrics: true,
        includeDeviceInfo: true,
      },
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-health-service',
      journey: 'health',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'health-prod-1',
      'deployment.environment': 'production',
    },
    journeyConfig: {
      health: {
        includeMetrics: true,
        includeDeviceInfo: true,
      },
    },
  },
};

/**
 * Care Journey Service configurations for different environments
 */
export const careServiceConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-care-service',
      journey: 'care',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'care-dev-1',
      'deployment.environment': 'development',
    },
    journeyConfig: {
      care: {
        includeAppointments: true,
        includeProviders: true,
      },
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-care-service',
      journey: 'care',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'care-staging-1',
      'deployment.environment': 'staging',
    },
    journeyConfig: {
      care: {
        includeAppointments: true,
        includeProviders: true,
      },
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-care-service',
      journey: 'care',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'care-prod-1',
      'deployment.environment': 'production',
    },
    journeyConfig: {
      care: {
        includeAppointments: true,
        includeProviders: true,
      },
    },
  },
};

/**
 * Plan Journey Service configurations for different environments
 */
export const planServiceConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-plan-service',
      journey: 'plan',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'plan-dev-1',
      'deployment.environment': 'development',
    },
    journeyConfig: {
      plan: {
        includeClaims: true,
        includeBenefits: true,
      },
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-plan-service',
      journey: 'plan',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'plan-staging-1',
      'deployment.environment': 'staging',
    },
    journeyConfig: {
      plan: {
        includeClaims: true,
        includeBenefits: true,
      },
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-plan-service',
      journey: 'plan',
    },
    resourceAttributes: {
      'service.namespace': 'austa.journey',
      'service.instance.id': 'plan-prod-1',
      'deployment.environment': 'production',
    },
    journeyConfig: {
      plan: {
        includeClaims: true,
        includeBenefits: true,
      },
    },
  },
};

/**
 * Auth Service configurations for different environments
 */
export const authServiceConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-auth-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'auth-dev-1',
      'deployment.environment': 'development',
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-auth-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'auth-staging-1',
      'deployment.environment': 'staging',
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-auth-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'auth-prod-1',
      'deployment.environment': 'production',
    },
  },
};

/**
 * API Gateway configurations for different environments
 */
export const apiGatewayConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-api-gateway',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gateway-dev-1',
      'deployment.environment': 'development',
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-api-gateway',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gateway-staging-1',
      'deployment.environment': 'staging',
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-api-gateway',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gateway-prod-1',
      'deployment.environment': 'production',
    },
  },
};

/**
 * Gamification Engine configurations for different environments
 */
export const gamificationEngineConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-gamification-engine',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gamification-dev-1',
      'deployment.environment': 'development',
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-gamification-engine',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gamification-staging-1',
      'deployment.environment': 'staging',
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-gamification-engine',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'gamification-prod-1',
      'deployment.environment': 'production',
    },
  },
};

/**
 * Notification Service configurations for different environments
 */
export const notificationServiceConfig: Record<string, TracingOptions> = {
  development: {
    ...developmentBaseConfig as TracingOptions,
    service: {
      ...developmentBaseConfig.service,
      name: 'austa-notification-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'notification-dev-1',
      'deployment.environment': 'development',
    },
  },
  staging: {
    ...stagingBaseConfig as TracingOptions,
    service: {
      ...stagingBaseConfig.service,
      name: 'austa-notification-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'notification-staging-1',
      'deployment.environment': 'staging',
    },
  },
  production: {
    ...productionBaseConfig as TracingOptions,
    service: {
      ...productionBaseConfig.service,
      name: 'austa-notification-service',
      journey: 'shared',
    },
    resourceAttributes: {
      'service.namespace': 'austa.core',
      'service.instance.id': 'notification-prod-1',
      'deployment.environment': 'production',
    },
  },
};

/**
 * Mock configuration with disabled tracing for testing disabled state
 */
export const disabledTracingConfig: TracingOptions = {
  ...developmentBaseConfig as TracingOptions,
  service: {
    ...developmentBaseConfig.service,
    name: 'austa-disabled-service',
    journey: 'shared',
  },
  disabled: true,
};

/**
 * Mock configuration with invalid exporter for testing error handling
 */
export const invalidExporterConfig: TracingOptions = {
  ...developmentBaseConfig as TracingOptions,
  service: {
    ...developmentBaseConfig.service,
    name: 'austa-invalid-service',
    journey: 'shared',
  },
  exporter: {
    type: 'otlp',
    otlp: {
      protocol: 'http/protobuf',
      endpoint: 'http://non-existent-endpoint:4318/v1/traces',
      timeoutMillis: 100, // Very short timeout to trigger errors quickly
      maxRetries: 1,
    },
  },
};

/**
 * Collection of all service configurations for easy access in tests
 */
export const allServiceConfigs = {
  health: healthServiceConfig,
  care: careServiceConfig,
  plan: planServiceConfig,
  auth: authServiceConfig,
  apiGateway: apiGatewayConfig,
  gamification: gamificationEngineConfig,
  notification: notificationServiceConfig,
  disabled: { test: disabledTracingConfig },
  invalid: { test: invalidExporterConfig },
};