import { DEFAULT_SAMPLING_RATE, DEFAULT_SERVICE_NAME } from '../../../src/constants/defaults';
import { CONFIG_KEYS } from '../../../src/constants/config-keys';

/**
 * This is a mock of what the TracingOptions interface would look like.
 * In a real implementation, this would be imported from the actual interface file.
 */
interface TracingOptions {
  service: {
    name: string;
    version?: string;
    environment?: string;
  };
  exporter?: {
    type?: 'jaeger' | 'zipkin' | 'otlp' | 'console' | 'none';
    endpoint?: string;
    headers?: Record<string, string>;
    timeout?: number;
  };
  sampling?: {
    ratio?: number;
    strategy?: 'always' | 'never' | 'probability' | 'parentbased';
  };
  resource?: {
    attributes?: Record<string, string | number | boolean>;
    autoDetect?: boolean;
  };
  batchProcessor?: {
    maxBatchSize?: number;
    maxExportBatchSize?: number;
    exportTimeout?: number;
    scheduleDelay?: number;
  };
  journey?: {
    health?: {
      enabled?: boolean;
      samplingRatio?: number;
    };
    care?: {
      enabled?: boolean;
      samplingRatio?: number;
    };
    plan?: {
      enabled?: boolean;
      samplingRatio?: number;
    };
  };
  enabled?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  contextPropagation?: {
    enabled?: boolean;
  };
}

/**
 * Mock validation function for testing purposes.
 * In a real implementation, this would be the actual validation function.
 */
function validateTracingOptions(options: TracingOptions): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate service name
  if (!options.service || !options.service.name) {
    errors.push('Service name is required');
  } else if (typeof options.service.name !== 'string') {
    errors.push('Service name must be a string');
  } else if (options.service.name.trim() === '') {
    errors.push('Service name cannot be empty');
  }

  // Validate sampling ratio
  if (options.sampling && options.sampling.ratio !== undefined) {
    if (typeof options.sampling.ratio !== 'number') {
      errors.push('Sampling ratio must be a number');
    } else if (options.sampling.ratio < 0 || options.sampling.ratio > 1) {
      errors.push('Sampling ratio must be between 0 and 1');
    }
  }

  // Validate exporter type
  if (options.exporter && options.exporter.type) {
    const validTypes = ['jaeger', 'zipkin', 'otlp', 'console', 'none'];
    if (!validTypes.includes(options.exporter.type)) {
      errors.push(`Exporter type must be one of: ${validTypes.join(', ')}`);
    }
  }

  // Validate exporter endpoint
  if (options.exporter && options.exporter.type && options.exporter.type !== 'none' && options.exporter.type !== 'console') {
    if (!options.exporter.endpoint) {
      errors.push(`Endpoint is required for exporter type: ${options.exporter.type}`);
    } else if (typeof options.exporter.endpoint !== 'string') {
      errors.push('Exporter endpoint must be a string');
    } else if (!options.exporter.endpoint.startsWith('http://') && !options.exporter.endpoint.startsWith('https://')) {
      errors.push('Exporter endpoint must start with http:// or https://');
    }
  }

  // Validate journey-specific sampling ratios
  const journeyTypes = ['health', 'care', 'plan'] as const;
  if (options.journey) {
    for (const journeyType of journeyTypes) {
      if (options.journey[journeyType] && options.journey[journeyType]?.samplingRatio !== undefined) {
        const ratio = options.journey[journeyType]?.samplingRatio;
        if (typeof ratio !== 'number') {
          errors.push(`${journeyType} journey sampling ratio must be a number`);
        } else if (ratio < 0 || ratio > 1) {
          errors.push(`${journeyType} journey sampling ratio must be between 0 and 1`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Mock function to apply default values to tracing options.
 * In a real implementation, this would be the actual function to apply defaults.
 */
function applyDefaultTracingOptions(options: Partial<TracingOptions>): TracingOptions {
  return {
    service: {
      name: options.service?.name || DEFAULT_SERVICE_NAME,
      version: options.service?.version,
      environment: options.service?.environment || 'development',
    },
    exporter: {
      type: options.exporter?.type || 'console',
      endpoint: options.exporter?.endpoint,
      headers: options.exporter?.headers || {},
      timeout: options.exporter?.timeout || 30000,
    },
    sampling: {
      ratio: options.sampling?.ratio !== undefined ? options.sampling.ratio : DEFAULT_SAMPLING_RATE,
      strategy: options.sampling?.strategy || 'probability',
    },
    resource: {
      attributes: options.resource?.attributes || {},
      autoDetect: options.resource?.autoDetect !== undefined ? options.resource.autoDetect : true,
    },
    batchProcessor: {
      maxBatchSize: options.batchProcessor?.maxBatchSize || 512,
      maxExportBatchSize: options.batchProcessor?.maxExportBatchSize || 512,
      exportTimeout: options.batchProcessor?.exportTimeout || 30000,
      scheduleDelay: options.batchProcessor?.scheduleDelay || 5000,
    },
    journey: {
      health: {
        enabled: options.journey?.health?.enabled !== undefined ? options.journey.health.enabled : true,
        samplingRatio: options.journey?.health?.samplingRatio !== undefined ? options.journey.health.samplingRatio : DEFAULT_SAMPLING_RATE,
      },
      care: {
        enabled: options.journey?.care?.enabled !== undefined ? options.journey.care.enabled : true,
        samplingRatio: options.journey?.care?.samplingRatio !== undefined ? options.journey.care.samplingRatio : DEFAULT_SAMPLING_RATE,
      },
      plan: {
        enabled: options.journey?.plan?.enabled !== undefined ? options.journey.plan.enabled : true,
        samplingRatio: options.journey?.plan?.samplingRatio !== undefined ? options.journey.plan.samplingRatio : DEFAULT_SAMPLING_RATE,
      },
    },
    enabled: options.enabled !== undefined ? options.enabled : true,
    logLevel: options.logLevel || 'info',
    contextPropagation: {
      enabled: options.contextPropagation?.enabled !== undefined ? options.contextPropagation.enabled : true,
    },
  };
}

describe('TracingOptions Interface', () => {
  describe('Service Name Configuration', () => {
    it('should validate that service name is required', () => {
      // @ts-expect-error - Testing invalid input
      const result = validateTracingOptions({ service: {} });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Service name is required');
    });

    it('should validate that service name must be a string', () => {
      // @ts-expect-error - Testing invalid input
      const result = validateTracingOptions({ service: { name: 123 } });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Service name must be a string');
    });

    it('should validate that service name cannot be empty', () => {
      const result = validateTracingOptions({ service: { name: '' } });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Service name cannot be empty');
    });

    it('should accept a valid service name', () => {
      const result = validateTracingOptions({ service: { name: 'test-service' } });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should use default service name when not provided', () => {
      const options = applyDefaultTracingOptions({});
      expect(options.service.name).toBe(DEFAULT_SERVICE_NAME);
    });
  });

  describe('Sampling Rate Configuration', () => {
    it('should validate that sampling ratio must be a number', () => {
      // @ts-expect-error - Testing invalid input
      const result = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: '0.5' } });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Sampling ratio must be a number');
    });

    it('should validate that sampling ratio must be between 0 and 1', () => {
      const result1 = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: -0.1 } });
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Sampling ratio must be between 0 and 1');

      const result2 = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: 1.1 } });
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Sampling ratio must be between 0 and 1');
    });

    it('should accept valid sampling ratios', () => {
      const result1 = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: 0 } });
      expect(result1.isValid).toBe(true);

      const result2 = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: 0.5 } });
      expect(result2.isValid).toBe(true);

      const result3 = validateTracingOptions({ service: { name: 'test' }, sampling: { ratio: 1 } });
      expect(result3.isValid).toBe(true);
    });

    it('should use default sampling ratio when not provided', () => {
      const options = applyDefaultTracingOptions({ service: { name: 'test' } });
      expect(options.sampling.ratio).toBe(DEFAULT_SAMPLING_RATE);
    });
  });

  describe('Exporter Configuration', () => {
    it('should validate exporter type', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'invalid' as any } 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exporter type must be one of: jaeger, zipkin, otlp, console, none');
    });

    it('should validate that endpoint is required for non-console exporters', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'jaeger' } 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Endpoint is required for exporter type: jaeger');
    });

    it('should validate that endpoint must be a valid URL', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'jaeger', endpoint: 'invalid-url' } 
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Exporter endpoint must start with http:// or https://');
    });

    it('should accept valid exporter configuration', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'jaeger', endpoint: 'http://localhost:14268/api/traces' } 
      });
      expect(result.isValid).toBe(true);
    });

    it('should not require endpoint for console exporter', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'console' } 
      });
      expect(result.isValid).toBe(true);
    });

    it('should not require endpoint for none exporter', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' }, 
        exporter: { type: 'none' } 
      });
      expect(result.isValid).toBe(true);
    });

    it('should use default exporter type when not provided', () => {
      const options = applyDefaultTracingOptions({ service: { name: 'test' } });
      expect(options.exporter?.type).toBe('console');
    });
  });

  describe('Default Value Behavior', () => {
    it('should apply all default values when minimal configuration is provided', () => {
      const minimalOptions = { service: { name: 'minimal-service' } };
      const fullOptions = applyDefaultTracingOptions(minimalOptions);

      // Check that all required fields have default values
      expect(fullOptions.service.name).toBe('minimal-service');
      expect(fullOptions.service.environment).toBe('development');
      expect(fullOptions.exporter?.type).toBe('console');
      expect(fullOptions.sampling?.ratio).toBe(DEFAULT_SAMPLING_RATE);
      expect(fullOptions.sampling?.strategy).toBe('probability');
      expect(fullOptions.resource?.autoDetect).toBe(true);
      expect(fullOptions.enabled).toBe(true);
      expect(fullOptions.logLevel).toBe('info');
      expect(fullOptions.contextPropagation?.enabled).toBe(true);
    });

    it('should not override provided values with defaults', () => {
      const customOptions = { 
        service: { 
          name: 'custom-service',
          environment: 'production' 
        },
        exporter: {
          type: 'otlp',
          endpoint: 'https://collector.example.com:4317'
        },
        sampling: {
          ratio: 0.1,
          strategy: 'parentbased' as const
        },
        enabled: false,
        logLevel: 'error' as const
      };
      
      const fullOptions = applyDefaultTracingOptions(customOptions);

      // Check that provided values are preserved
      expect(fullOptions.service.name).toBe('custom-service');
      expect(fullOptions.service.environment).toBe('production');
      expect(fullOptions.exporter?.type).toBe('otlp');
      expect(fullOptions.exporter?.endpoint).toBe('https://collector.example.com:4317');
      expect(fullOptions.sampling?.ratio).toBe(0.1);
      expect(fullOptions.sampling?.strategy).toBe('parentbased');
      expect(fullOptions.enabled).toBe(false);
      expect(fullOptions.logLevel).toBe('error');
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should validate journey-specific sampling ratios', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' },
        journey: {
          health: { samplingRatio: 1.5 },
          care: { samplingRatio: -0.1 }
        }
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('health journey sampling ratio must be between 0 and 1');
      expect(result.errors).toContain('care journey sampling ratio must be between 0 and 1');
    });

    it('should accept valid journey-specific configuration', () => {
      const result = validateTracingOptions({ 
        service: { name: 'test' },
        journey: {
          health: { enabled: true, samplingRatio: 0.8 },
          care: { enabled: false, samplingRatio: 0.2 },
          plan: { enabled: true, samplingRatio: 1.0 }
        }
      });
      
      expect(result.isValid).toBe(true);
    });

    it('should apply default journey-specific configuration', () => {
      const options = applyDefaultTracingOptions({ service: { name: 'test' } });
      
      expect(options.journey?.health?.enabled).toBe(true);
      expect(options.journey?.health?.samplingRatio).toBe(DEFAULT_SAMPLING_RATE);
      expect(options.journey?.care?.enabled).toBe(true);
      expect(options.journey?.care?.samplingRatio).toBe(DEFAULT_SAMPLING_RATE);
      expect(options.journey?.plan?.enabled).toBe(true);
      expect(options.journey?.plan?.samplingRatio).toBe(DEFAULT_SAMPLING_RATE);
    });

    it('should handle environment-specific configuration correctly', () => {
      // Test development environment defaults
      const devOptions = applyDefaultTracingOptions({ 
        service: { name: 'test', environment: 'development' } 
      });
      expect(devOptions.service.environment).toBe('development');
      expect(devOptions.exporter?.type).toBe('console'); // Console exporter is default for development
      
      // Test production environment with custom settings
      const prodOptions = applyDefaultTracingOptions({ 
        service: { name: 'test', environment: 'production' },
        exporter: { type: 'otlp', endpoint: 'https://collector.example.com:4317' },
        sampling: { ratio: 0.1 }, // Lower sampling in production
        journey: {
          health: { samplingRatio: 0.2 }, // Higher sampling for health journey
          care: { samplingRatio: 0.05 }, // Lower sampling for care journey
          plan: { samplingRatio: 0.05 } // Lower sampling for plan journey
        }
      });
      
      expect(prodOptions.service.environment).toBe('production');
      expect(prodOptions.exporter?.type).toBe('otlp');
      expect(prodOptions.sampling?.ratio).toBe(0.1);
      expect(prodOptions.journey?.health?.samplingRatio).toBe(0.2);
      expect(prodOptions.journey?.care?.samplingRatio).toBe(0.05);
      expect(prodOptions.journey?.plan?.samplingRatio).toBe(0.05);
    });
  });
});