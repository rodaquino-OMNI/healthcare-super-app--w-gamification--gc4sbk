/**
 * Mock service configurations for tracing tests
 * 
 * This file provides mock configuration objects for different services used in tracing tests,
 * including service names, configuration options, and environment-specific settings.
 * These configurations are essential for testing tracer initialization with different service
 * parameters and ensuring the correct tracer configuration across different environments.
 */

import { DiagLogLevel } from '@opentelemetry/api';
import { OTLPExporterNodeConfigBase } from '@opentelemetry/exporter-trace-otlp-http';

/**
 * Base interface for service configuration
 */
export interface ServiceConfig {
  service: {
    name: string;
    version: string;
    environment: string;
  };
  tracing: {
    enabled: boolean;
    sampler: {
      type: 'always_on' | 'always_off' | 'traceidratio' | 'parentbased_traceidratio';
      ratio?: number;
    };
    exporter: {
      type: 'otlp' | 'console' | 'zipkin' | 'jaeger';
      endpoint?: string;
      options?: Partial<OTLPExporterNodeConfigBase>;
    };
    logLevel: DiagLogLevel;
    batchSpanProcessorConfig?: {
      maxQueueSize?: number;
      maxExportBatchSize?: number;
      scheduledDelayMillis?: number;
      exportTimeoutMillis?: number;
    };
  };
}

/**
 * Environment-specific configurations
 */
const environments = {
  development: {
    sampler: {
      type: 'always_on' as const,
    },
    exporter: {
      type: 'console' as const,
    },
    logLevel: DiagLogLevel.DEBUG,
    batchSpanProcessorConfig: {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 500,
      exportTimeoutMillis: 3000,
    },
  },
  staging: {
    sampler: {
      type: 'parentbased_traceidratio' as const,
      ratio: 0.5,
    },
    exporter: {
      type: 'otlp' as const,
      endpoint: 'http://otel-collector:4318/v1/traces',
      options: {
        headers: {},
      },
    },
    logLevel: DiagLogLevel.INFO,
    batchSpanProcessorConfig: {
      maxQueueSize: 1000,
      maxExportBatchSize: 100,
      scheduledDelayMillis: 1000,
      exportTimeoutMillis: 5000,
    },
  },
  production: {
    sampler: {
      type: 'parentbased_traceidratio' as const,
      ratio: 0.1,
    },
    exporter: {
      type: 'otlp' as const,
      endpoint: 'https://otel-collector.austa.internal:4318/v1/traces',
      options: {
        headers: {
          'X-Tenant-ID': 'austa-production',
        },
      },
    },
    logLevel: DiagLogLevel.WARN,
    batchSpanProcessorConfig: {
      maxQueueSize: 2000,
      maxExportBatchSize: 200,
      scheduledDelayMillis: 5000,
      exportTimeoutMillis: 10000,
    },
  },
};

/**
 * Creates a service configuration with the specified parameters
 * 
 * @param serviceName The name of the service
 * @param serviceVersion The version of the service
 * @param environment The deployment environment (development, staging, production)
 * @returns A complete service configuration object
 */
const createServiceConfig = (
  serviceName: string,
  serviceVersion: string,
  environment: 'development' | 'staging' | 'production'
): ServiceConfig => {
  return {
    service: {
      name: serviceName,
      version: serviceVersion,
      environment,
    },
    tracing: {
      enabled: true,
      ...environments[environment],
    },
  };
};

/**
 * API Gateway service configuration for different environments
 */
export const apiGatewayConfig = {
  development: createServiceConfig('austa-api-gateway', '1.0.0', 'development'),
  staging: createServiceConfig('austa-api-gateway', '1.0.0', 'staging'),
  production: createServiceConfig('austa-api-gateway', '1.0.0', 'production'),
};

/**
 * Auth Service configuration for different environments
 */
export const authServiceConfig = {
  development: createServiceConfig('austa-auth-service', '1.0.0', 'development'),
  staging: createServiceConfig('austa-auth-service', '1.0.0', 'staging'),
  production: createServiceConfig('austa-auth-service', '1.0.0', 'production'),
};

/**
 * Health Journey service configuration for different environments
 */
export const healthServiceConfig = {
  development: createServiceConfig('austa-health-service', '1.0.0', 'development'),
  staging: createServiceConfig('austa-health-service', '1.0.0', 'staging'),
  production: createServiceConfig('austa-health-service', '1.0.0', 'production'),
};

/**
 * Care Journey service configuration for different environments
 */
export const careServiceConfig = {
  development: createServiceConfig('austa-care-service', '1.0.0', 'development'),
  staging: createServiceConfig('austa-care-service', '1.0.0', 'staging'),
  production: createServiceConfig('austa-care-service', '1.0.0', 'production'),
};

/**
 * Plan Journey service configuration for different environments
 */
export const planServiceConfig = {
  development: createServiceConfig('austa-plan-service', '1.0.0', 'development'),
  staging: createServiceConfig('austa-plan-service', '1.0.0', 'staging'),
  production: createServiceConfig('austa-plan-service', '1.0.0', 'production'),
};

/**
 * Gamification Engine service configuration for different environments
 */
export const gamificationEngineConfig = {
  development: createServiceConfig('austa-gamification-engine', '1.0.0', 'development'),
  staging: createServiceConfig('austa-gamification-engine', '1.0.0', 'staging'),
  production: createServiceConfig('austa-gamification-engine', '1.0.0', 'production'),
};

/**
 * Notification Service configuration for different environments
 */
export const notificationServiceConfig = {
  development: createServiceConfig('austa-notification-service', '1.0.0', 'development'),
  staging: createServiceConfig('austa-notification-service', '1.0.0', 'staging'),
  production: createServiceConfig('austa-notification-service', '1.0.0', 'production'),
};

/**
 * Custom service configuration with specific sampling and exporter settings
 * Used for testing custom configurations
 */
export const customServiceConfig: ServiceConfig = {
  service: {
    name: 'austa-custom-service',
    version: '1.0.0',
    environment: 'development',
  },
  tracing: {
    enabled: true,
    sampler: {
      type: 'traceidratio',
      ratio: 0.25,
    },
    exporter: {
      type: 'otlp',
      endpoint: 'http://custom-collector:4318/v1/traces',
      options: {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
        timeoutMillis: 15000,
      },
    },
    logLevel: DiagLogLevel.INFO,
    batchSpanProcessorConfig: {
      maxQueueSize: 500,
      maxExportBatchSize: 50,
      scheduledDelayMillis: 2000,
      exportTimeoutMillis: 8000,
    },
  },
};

/**
 * Disabled tracing configuration for testing disabled state
 */
export const disabledTracingConfig: ServiceConfig = {
  service: {
    name: 'austa-disabled-tracing',
    version: '1.0.0',
    environment: 'production',
  },
  tracing: {
    enabled: false,
    sampler: {
      type: 'always_off',
    },
    exporter: {
      type: 'console',
    },
    logLevel: DiagLogLevel.ERROR,
  },
};

/**
 * Collection of all service configurations for easy access
 */
export const allServiceConfigs = {
  apiGateway: apiGatewayConfig,
  authService: authServiceConfig,
  healthService: healthServiceConfig,
  careService: careServiceConfig,
  planService: planServiceConfig,
  gamificationEngine: gamificationEngineConfig,
  notificationService: notificationServiceConfig,
  customService: customServiceConfig,
  disabledTracing: disabledTracingConfig,
};