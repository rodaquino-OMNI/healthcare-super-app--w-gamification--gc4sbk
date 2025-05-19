import { TracingOptions, ExporterOptions, SpanProcessorOptions } from '../../../src/interfaces/tracing-options.interface';
import { allServiceConfigs } from '../../fixtures/service-config';

describe('TracingOptions Interface', () => {
  describe('Service Name Configuration', () => {
    it('should require a service name', () => {
      // TypeScript compilation would fail if serviceName is not provided
      // This test verifies the interface contract at runtime
      const createOptions = (): TracingOptions => {
        return {
          serviceName: 'test-service',
        };
      };

      const options = createOptions();
      expect(options.serviceName).toBeDefined();
      expect(options.serviceName).toBe('test-service');
    });

    it('should accept service names from different journey services', () => {
      // Test with health service name
      const healthOptions: TracingOptions = {
        serviceName: allServiceConfigs.healthService.development.service.name,
      };
      expect(healthOptions.serviceName).toBe('austa-health-service');

      // Test with care service name
      const careOptions: TracingOptions = {
        serviceName: allServiceConfigs.careService.development.service.name,
      };
      expect(careOptions.serviceName).toBe('austa-care-service');

      // Test with plan service name
      const planOptions: TracingOptions = {
        serviceName: allServiceConfigs.planService.development.service.name,
      };
      expect(planOptions.serviceName).toBe('austa-plan-service');
    });

    it('should allow service version to be optional', () => {
      // Without version
      const optionsWithoutVersion: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(optionsWithoutVersion.serviceVersion).toBeUndefined();

      // With version
      const optionsWithVersion: TracingOptions = {
        serviceName: 'test-service',
        serviceVersion: '1.0.0',
      };
      expect(optionsWithVersion.serviceVersion).toBe('1.0.0');
    });
  });

  describe('Sampling Rate Configuration', () => {
    it('should accept valid sampling ratios between 0 and 1', () => {
      // Test with minimum value
      const minOptions: TracingOptions = {
        serviceName: 'test-service',
        samplingRatio: 0,
      };
      expect(minOptions.samplingRatio).toBe(0);

      // Test with maximum value
      const maxOptions: TracingOptions = {
        serviceName: 'test-service',
        samplingRatio: 1,
      };
      expect(maxOptions.samplingRatio).toBe(1);

      // Test with intermediate value
      const midOptions: TracingOptions = {
        serviceName: 'test-service',
        samplingRatio: 0.5,
      };
      expect(midOptions.samplingRatio).toBe(0.5);
    });

    it('should allow sampling ratio to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.samplingRatio).toBeUndefined();
    });

    it('should support environment-specific sampling configurations', () => {
      // Development environment typically uses higher sampling rate
      const devSamplingRatio = allServiceConfigs.healthService.development.tracing.sampler.type === 'always_on' ? 1 : 
        allServiceConfigs.healthService.development.tracing.sampler.ratio;
      
      // Production environment typically uses lower sampling rate
      const prodSamplingRatio = allServiceConfigs.healthService.production.tracing.sampler.ratio;

      // Verify that production sampling is more conservative than development
      expect(prodSamplingRatio).toBeLessThan(devSamplingRatio || 1);

      // Create options with environment-specific sampling
      const devOptions: TracingOptions = {
        serviceName: 'test-service',
        samplingRatio: devSamplingRatio || 1,
      };

      const prodOptions: TracingOptions = {
        serviceName: 'test-service',
        samplingRatio: prodSamplingRatio,
      };

      expect(devOptions.samplingRatio).toBeGreaterThan(prodOptions.samplingRatio || 0);
    });
  });

  describe('Journey Context Configuration', () => {
    it('should accept valid journey context values', () => {
      // Test with health journey
      const healthOptions: TracingOptions = {
        serviceName: 'test-service',
        journeyContext: 'health',
      };
      expect(healthOptions.journeyContext).toBe('health');

      // Test with care journey
      const careOptions: TracingOptions = {
        serviceName: 'test-service',
        journeyContext: 'care',
      };
      expect(careOptions.journeyContext).toBe('care');

      // Test with plan journey
      const planOptions: TracingOptions = {
        serviceName: 'test-service',
        journeyContext: 'plan',
      };
      expect(planOptions.journeyContext).toBe('plan');

      // Test with custom journey
      const customOptions: TracingOptions = {
        serviceName: 'test-service',
        journeyContext: 'custom-journey',
      };
      expect(customOptions.journeyContext).toBe('custom-journey');
    });

    it('should allow journey context to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.journeyContext).toBeUndefined();
    });
  });

  describe('Exporter Configuration', () => {
    it('should support different exporter types', () => {
      // Test with console exporter
      const consoleExporter: ExporterOptions = {
        type: 'console',
      };
      expect(consoleExporter.type).toBe('console');

      // Test with OTLP exporter
      const otlpExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'http://localhost:4318/v1/traces',
      };
      expect(otlpExporter.type).toBe('otlp');
      expect(otlpExporter.endpoint).toBe('http://localhost:4318/v1/traces');

      // Test with Jaeger exporter
      const jaegerExporter: ExporterOptions = {
        type: 'jaeger',
        endpoint: 'http://localhost:14268/api/traces',
      };
      expect(jaegerExporter.type).toBe('jaeger');
      expect(jaegerExporter.endpoint).toBe('http://localhost:14268/api/traces');

      // Test with Zipkin exporter
      const zipkinExporter: ExporterOptions = {
        type: 'zipkin',
        endpoint: 'http://localhost:9411/api/v2/spans',
      };
      expect(zipkinExporter.type).toBe('zipkin');
      expect(zipkinExporter.endpoint).toBe('http://localhost:9411/api/v2/spans');

      // Test with custom exporter
      const customExporter: ExporterOptions = {
        type: 'custom-exporter',
        endpoint: 'http://custom-endpoint/traces',
      };
      expect(customExporter.type).toBe('custom-exporter');
      expect(customExporter.endpoint).toBe('http://custom-endpoint/traces');
    });

    it('should support exporter headers configuration', () => {
      const exporterWithHeaders: ExporterOptions = {
        type: 'otlp',
        endpoint: 'https://otel-collector.example.com:4318/v1/traces',
        headers: {
          'X-API-Key': 'test-api-key',
          'X-Tenant-ID': 'test-tenant',
        },
      };

      expect(exporterWithHeaders.headers).toBeDefined();
      expect(exporterWithHeaders.headers?.['X-API-Key']).toBe('test-api-key');
      expect(exporterWithHeaders.headers?.['X-Tenant-ID']).toBe('test-tenant');
    });

    it('should support timeout configuration', () => {
      const exporterWithTimeout: ExporterOptions = {
        type: 'otlp',
        endpoint: 'https://otel-collector.example.com:4318/v1/traces',
        timeoutMillis: 30000,
      };

      expect(exporterWithTimeout.timeoutMillis).toBe(30000);
    });

    it('should support secure connection configuration', () => {
      // Secure connection (default)
      const secureExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'https://otel-collector.example.com:4318/v1/traces',
        secure: true,
      };
      expect(secureExporter.secure).toBe(true);

      // Insecure connection (explicit)
      const insecureExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'http://otel-collector.example.com:4318/v1/traces',
        secure: false,
      };
      expect(insecureExporter.secure).toBe(false);
    });

    it('should support OTLP protocol configuration', () => {
      // HTTP/JSON protocol
      const jsonExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'http://otel-collector.example.com:4318/v1/traces',
        protocol: 'http/json',
      };
      expect(jsonExporter.protocol).toBe('http/json');

      // HTTP/Protobuf protocol
      const protobufExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'http://otel-collector.example.com:4318/v1/traces',
        protocol: 'http/protobuf',
      };
      expect(protobufExporter.protocol).toBe('http/protobuf');

      // gRPC protocol
      const grpcExporter: ExporterOptions = {
        type: 'otlp',
        endpoint: 'http://otel-collector.example.com:4317',
        protocol: 'grpc',
      };
      expect(grpcExporter.protocol).toBe('grpc');
    });

    it('should allow exporter to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.exporter).toBeUndefined();
    });
  });

  describe('Span Processor Configuration', () => {
    it('should support different span processor types', () => {
      // Simple span processor
      const simpleProcessor: SpanProcessorOptions = {
        type: 'simple',
      };
      expect(simpleProcessor.type).toBe('simple');

      // Batch span processor
      const batchProcessor: SpanProcessorOptions = {
        type: 'batch',
        batchSize: 512,
        maxQueueSize: 2048,
        scheduledDelayMillis: 5000,
        exportTimeoutMillis: 30000,
      };
      expect(batchProcessor.type).toBe('batch');
      expect(batchProcessor.batchSize).toBe(512);
      expect(batchProcessor.maxQueueSize).toBe(2048);
      expect(batchProcessor.scheduledDelayMillis).toBe(5000);
      expect(batchProcessor.exportTimeoutMillis).toBe(30000);

      // Custom span processor
      const customProcessor: SpanProcessorOptions = {
        type: 'custom-processor',
      };
      expect(customProcessor.type).toBe('custom-processor');
    });

    it('should allow batch processor options to be optional when type is batch', () => {
      const batchProcessor: SpanProcessorOptions = {
        type: 'batch',
      };
      expect(batchProcessor.type).toBe('batch');
      expect(batchProcessor.batchSize).toBeUndefined();
      expect(batchProcessor.maxQueueSize).toBeUndefined();
      expect(batchProcessor.scheduledDelayMillis).toBeUndefined();
      expect(batchProcessor.exportTimeoutMillis).toBeUndefined();
    });

    it('should allow span processor to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.spanProcessor).toBeUndefined();
    });
  });

  describe('Resource Attributes Configuration', () => {
    it('should support string resource attributes', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        resourceAttributes: {
          'service.namespace': 'austa',
          'deployment.environment': 'production',
        },
      };
      expect(options.resourceAttributes?.['service.namespace']).toBe('austa');
      expect(options.resourceAttributes?.['deployment.environment']).toBe('production');
    });

    it('should support numeric resource attributes', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        resourceAttributes: {
          'service.instance.id': 1,
          'process.pid': 12345,
        },
      };
      expect(options.resourceAttributes?.['service.instance.id']).toBe(1);
      expect(options.resourceAttributes?.['process.pid']).toBe(12345);
    });

    it('should support boolean resource attributes', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        resourceAttributes: {
          'service.ready': true,
          'debug.enabled': false,
        },
      };
      expect(options.resourceAttributes?.['service.ready']).toBe(true);
      expect(options.resourceAttributes?.['debug.enabled']).toBe(false);
    });

    it('should support array resource attributes', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        resourceAttributes: {
          'service.tags': ['health', 'journey', 'austa'],
        },
      };
      expect(options.resourceAttributes?.['service.tags']).toEqual(['health', 'journey', 'austa']);
    });

    it('should allow resource attributes to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.resourceAttributes).toBeUndefined();
    });
  });

  describe('Debug Configuration', () => {
    it('should support enabling debug mode', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        enableDebug: true,
      };
      expect(options.enableDebug).toBe(true);
    });

    it('should support disabling debug mode', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
        enableDebug: false,
      };
      expect(options.enableDebug).toBe(false);
    });

    it('should allow debug mode to be optional', () => {
      const options: TracingOptions = {
        serviceName: 'test-service',
      };
      expect(options.enableDebug).toBeUndefined();
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should support development environment configuration', () => {
      // Create options based on development environment config
      const devConfig = allServiceConfigs.healthService.development;
      const options: TracingOptions = {
        serviceName: devConfig.service.name,
        serviceVersion: devConfig.service.version,
        samplingRatio: devConfig.tracing.sampler.type === 'always_on' ? 1 : devConfig.tracing.sampler.ratio,
        exporter: {
          type: devConfig.tracing.exporter.type,
          endpoint: devConfig.tracing.exporter.endpoint,
        },
        resourceAttributes: {
          'service.environment': devConfig.service.environment,
        },
      };

      expect(options.serviceName).toBe('austa-health-service');
      expect(options.serviceVersion).toBe('1.0.0');
      expect(options.exporter?.type).toBe('console');
      expect(options.resourceAttributes?.['service.environment']).toBe('development');
    });

    it('should support production environment configuration', () => {
      // Create options based on production environment config
      const prodConfig = allServiceConfigs.healthService.production;
      const options: TracingOptions = {
        serviceName: prodConfig.service.name,
        serviceVersion: prodConfig.service.version,
        samplingRatio: prodConfig.tracing.sampler.ratio,
        exporter: {
          type: prodConfig.tracing.exporter.type,
          endpoint: prodConfig.tracing.exporter.endpoint,
          headers: prodConfig.tracing.exporter.options?.headers,
        },
        resourceAttributes: {
          'service.environment': prodConfig.service.environment,
        },
      };

      expect(options.serviceName).toBe('austa-health-service');
      expect(options.serviceVersion).toBe('1.0.0');
      expect(options.samplingRatio).toBe(0.1); // Production uses lower sampling rate
      expect(options.exporter?.type).toBe('otlp');
      expect(options.exporter?.endpoint).toBe('https://otel-collector.austa.internal:4318/v1/traces');
      expect(options.exporter?.headers?.['X-Tenant-ID']).toBe('austa-production');
      expect(options.resourceAttributes?.['service.environment']).toBe('production');
    });

    it('should support custom service configuration', () => {
      // Create options based on custom service config
      const customConfig = allServiceConfigs.customService;
      const options: TracingOptions = {
        serviceName: customConfig.service.name,
        serviceVersion: customConfig.service.version,
        samplingRatio: customConfig.tracing.sampler.ratio,
        exporter: {
          type: customConfig.tracing.exporter.type,
          endpoint: customConfig.tracing.exporter.endpoint,
          headers: customConfig.tracing.exporter.options?.headers,
          timeoutMillis: customConfig.tracing.exporter.options?.timeoutMillis,
        },
        spanProcessor: {
          type: 'batch',
          batchSize: customConfig.tracing.batchSpanProcessorConfig?.maxExportBatchSize,
          maxQueueSize: customConfig.tracing.batchSpanProcessorConfig?.maxQueueSize,
          scheduledDelayMillis: customConfig.tracing.batchSpanProcessorConfig?.scheduledDelayMillis,
          exportTimeoutMillis: customConfig.tracing.batchSpanProcessorConfig?.exportTimeoutMillis,
        },
        resourceAttributes: {
          'service.environment': customConfig.service.environment,
        },
      };

      expect(options.serviceName).toBe('austa-custom-service');
      expect(options.serviceVersion).toBe('1.0.0');
      expect(options.samplingRatio).toBe(0.25);
      expect(options.exporter?.type).toBe('otlp');
      expect(options.exporter?.endpoint).toBe('http://custom-collector:4318/v1/traces');
      expect(options.exporter?.headers?.['X-Custom-Header']).toBe('custom-value');
      expect(options.exporter?.timeoutMillis).toBe(15000);
      expect(options.spanProcessor?.type).toBe('batch');
      expect(options.spanProcessor?.batchSize).toBe(50);
      expect(options.spanProcessor?.maxQueueSize).toBe(500);
      expect(options.spanProcessor?.scheduledDelayMillis).toBe(2000);
      expect(options.spanProcessor?.exportTimeoutMillis).toBe(8000);
      expect(options.resourceAttributes?.['service.environment']).toBe('development');
    });
  });

  describe('Complete Configuration Example', () => {
    it('should support a complete configuration with all options', () => {
      // Create a complete configuration with all possible options
      const completeOptions: TracingOptions = {
        serviceName: 'austa-complete-service',
        serviceVersion: '1.2.3',
        samplingRatio: 0.5,
        journeyContext: 'health',
        exporter: {
          type: 'otlp',
          endpoint: 'https://otel-collector.example.com:4318/v1/traces',
          headers: {
            'X-API-Key': 'api-key-value',
            'X-Tenant-ID': 'tenant-id-value',
          },
          timeoutMillis: 30000,
          secure: true,
          certPath: '/path/to/cert.pem',
          protocol: 'http/protobuf',
        },
        spanProcessor: {
          type: 'batch',
          batchSize: 512,
          maxQueueSize: 2048,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000,
        },
        resourceAttributes: {
          'service.namespace': 'austa',
          'service.instance.id': 1,
          'deployment.environment': 'staging',
          'service.version': '1.2.3',
          'service.tags': ['health', 'journey', 'austa'],
        },
        enableDebug: true,
      };

      // Verify all properties are correctly set
      expect(completeOptions.serviceName).toBe('austa-complete-service');
      expect(completeOptions.serviceVersion).toBe('1.2.3');
      expect(completeOptions.samplingRatio).toBe(0.5);
      expect(completeOptions.journeyContext).toBe('health');
      
      expect(completeOptions.exporter?.type).toBe('otlp');
      expect(completeOptions.exporter?.endpoint).toBe('https://otel-collector.example.com:4318/v1/traces');
      expect(completeOptions.exporter?.headers?.['X-API-Key']).toBe('api-key-value');
      expect(completeOptions.exporter?.headers?.['X-Tenant-ID']).toBe('tenant-id-value');
      expect(completeOptions.exporter?.timeoutMillis).toBe(30000);
      expect(completeOptions.exporter?.secure).toBe(true);
      expect(completeOptions.exporter?.certPath).toBe('/path/to/cert.pem');
      expect(completeOptions.exporter?.protocol).toBe('http/protobuf');
      
      expect(completeOptions.spanProcessor?.type).toBe('batch');
      expect(completeOptions.spanProcessor?.batchSize).toBe(512);
      expect(completeOptions.spanProcessor?.maxQueueSize).toBe(2048);
      expect(completeOptions.spanProcessor?.scheduledDelayMillis).toBe(5000);
      expect(completeOptions.spanProcessor?.exportTimeoutMillis).toBe(30000);
      
      expect(completeOptions.resourceAttributes?.['service.namespace']).toBe('austa');
      expect(completeOptions.resourceAttributes?.['service.instance.id']).toBe(1);
      expect(completeOptions.resourceAttributes?.['deployment.environment']).toBe('staging');
      expect(completeOptions.resourceAttributes?.['service.version']).toBe('1.2.3');
      expect(completeOptions.resourceAttributes?.['service.tags']).toEqual(['health', 'journey', 'austa']);
      
      expect(completeOptions.enableDebug).toBe(true);
    });
  });
});