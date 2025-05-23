import { TracingOptions } from '../../../src/interfaces/tracing-options.interface';
import { mockServiceConfigs } from '../../fixtures/service-config';

describe('TracingOptions Interface', () => {
  describe('Service Configuration', () => {
    it('should require service name to be defined', () => {
      // Type assertion test - this should fail TypeScript compilation if service.name is not required
      // @ts-expect-error - service.name is required
      const invalidOptions: TracingOptions = {
        service: {}
      };

      // This should compile correctly
      const validOptions: TracingOptions = {
        service: {
          name: 'test-service'
        }
      };

      expect(validOptions.service.name).toBe('test-service');
    });

    it('should allow optional service version', () => {
      // Both should compile correctly
      const withoutVersion: TracingOptions = {
        service: {
          name: 'test-service'
        }
      };

      const withVersion: TracingOptions = {
        service: {
          name: 'test-service',
          version: '1.2.3'
        }
      };

      expect(withoutVersion.service.version).toBeUndefined();
      expect(withVersion.service.version).toBe('1.2.3');
    });

    it('should allow optional service environment', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service',
          environment: 'production'
        }
      };

      expect(options.service.environment).toBe('production');
    });

    it('should restrict journey to valid values', () => {
      // These should compile correctly
      const healthJourney: TracingOptions = {
        service: {
          name: 'health-service',
          journey: 'health'
        }
      };

      const careJourney: TracingOptions = {
        service: {
          name: 'care-service',
          journey: 'care'
        }
      };

      const planJourney: TracingOptions = {
        service: {
          name: 'plan-service',
          journey: 'plan'
        }
      };

      const sharedJourney: TracingOptions = {
        service: {
          name: 'shared-service',
          journey: 'shared'
        }
      };

      // This should fail TypeScript compilation
      // @ts-expect-error - invalid journey value
      const invalidJourney: TracingOptions = {
        service: {
          name: 'invalid-service',
          journey: 'invalid'
        }
      };

      expect(healthJourney.service.journey).toBe('health');
      expect(careJourney.service.journey).toBe('care');
      expect(planJourney.service.journey).toBe('plan');
      expect(sharedJourney.service.journey).toBe('shared');
    });
  });

  describe('Sampling Configuration', () => {
    it('should allow optional sampling configuration', () => {
      // Both should compile correctly
      const withoutSampling: TracingOptions = {
        service: {
          name: 'test-service'
        }
      };

      const withSampling: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          rate: 0.5
        }
      };

      expect(withoutSampling.sampling).toBeUndefined();
      expect(withSampling.sampling?.rate).toBe(0.5);
    });

    it('should validate sampling rate is between 0 and 1', () => {
      // These should compile correctly
      const minRate: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          rate: 0
        }
      };

      const maxRate: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          rate: 1
        }
      };

      const midRate: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          rate: 0.5
        }
      };

      // Runtime validation would be needed for these cases
      // as TypeScript can't enforce numeric ranges
      expect(minRate.sampling?.rate).toBe(0);
      expect(maxRate.sampling?.rate).toBe(1);
      expect(midRate.sampling?.rate).toBe(0.5);

      // In a real implementation, there would be runtime validation:
      const validateSamplingRate = (rate: number): boolean => {
        return rate >= 0 && rate <= 1;
      };

      expect(validateSamplingRate(minRate.sampling?.rate || 0)).toBe(true);
      expect(validateSamplingRate(maxRate.sampling?.rate || 0)).toBe(true);
      expect(validateSamplingRate(midRate.sampling?.rate || 0)).toBe(true);
      expect(validateSamplingRate(-0.1)).toBe(false);
      expect(validateSamplingRate(1.1)).toBe(false);
    });

    it('should allow configuration of always sampling errors', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          alwaysSampleErrors: false
        }
      };

      expect(options.sampling?.alwaysSampleErrors).toBe(false);
    });

    it('should allow configuration of paths to always sample', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        sampling: {
          alwaysSamplePaths: ['/api/health', '/api/critical']
        }
      };

      expect(options.sampling?.alwaysSamplePaths).toEqual(['/api/health', '/api/critical']);
    });
  });

  describe('Exporter Configuration', () => {
    it('should allow configuration of exporter type', () => {
      // These should all compile correctly
      const otlpExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp'
        }
      };

      const prometheusExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'prometheus'
        }
      };

      const consoleExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'console'
        }
      };

      const jaegerExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'jaeger'
        }
      };

      const zipkinExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'zipkin'
        }
      };

      const noExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'none'
        }
      };

      // This should fail TypeScript compilation
      // @ts-expect-error - invalid exporter type
      const invalidExporter: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'invalid'
        }
      };

      expect(otlpExporter.exporter?.type).toBe('otlp');
      expect(prometheusExporter.exporter?.type).toBe('prometheus');
      expect(consoleExporter.exporter?.type).toBe('console');
      expect(jaegerExporter.exporter?.type).toBe('jaeger');
      expect(zipkinExporter.exporter?.type).toBe('zipkin');
      expect(noExporter.exporter?.type).toBe('none');
    });

    it('should allow OTLP-specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            protocol: 'grpc',
            endpoint: 'http://collector:4317',
            headers: {
              'x-api-key': 'test-key'
            },
            timeoutMillis: 15000,
            compression: 'gzip',
            maxRetries: 3,
            initialBackoffMillis: 500,
            maxBackoffMillis: 3000,
            maxConcurrentExports: 4
          }
        }
      };

      expect(options.exporter?.otlp?.protocol).toBe('grpc');
      expect(options.exporter?.otlp?.endpoint).toBe('http://collector:4317');
      expect(options.exporter?.otlp?.headers).toEqual({ 'x-api-key': 'test-key' });
      expect(options.exporter?.otlp?.timeoutMillis).toBe(15000);
      expect(options.exporter?.otlp?.compression).toBe('gzip');
      expect(options.exporter?.otlp?.maxRetries).toBe(3);
      expect(options.exporter?.otlp?.initialBackoffMillis).toBe(500);
      expect(options.exporter?.otlp?.maxBackoffMillis).toBe(3000);
      expect(options.exporter?.otlp?.maxConcurrentExports).toBe(4);
    });

    it('should restrict OTLP protocol to valid values', () => {
      // These should compile correctly
      const grpcProtocol: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            protocol: 'grpc'
          }
        }
      };

      const httpProtocol: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            protocol: 'http/protobuf'
          }
        }
      };

      // This should fail TypeScript compilation
      // @ts-expect-error - invalid protocol
      const invalidProtocol: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            protocol: 'invalid'
          }
        }
      };

      expect(grpcProtocol.exporter?.otlp?.protocol).toBe('grpc');
      expect(httpProtocol.exporter?.otlp?.protocol).toBe('http/protobuf');
    });

    it('should restrict OTLP compression to valid values', () => {
      // These should compile correctly
      const gzipCompression: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            compression: 'gzip'
          }
        }
      };

      const noCompression: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            compression: 'none'
          }
        }
      };

      // This should fail TypeScript compilation
      // @ts-expect-error - invalid compression
      const invalidCompression: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'otlp',
          otlp: {
            compression: 'invalid'
          }
        }
      };

      expect(gzipCompression.exporter?.otlp?.compression).toBe('gzip');
      expect(noCompression.exporter?.otlp?.compression).toBe('none');
    });

    it('should allow Prometheus-specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'prometheus',
          prometheus: {
            host: '0.0.0.0',
            port: 9464,
            path: '/metrics',
            withResourceAttributes: true,
            withUnits: false
          }
        }
      };

      expect(options.exporter?.prometheus?.host).toBe('0.0.0.0');
      expect(options.exporter?.prometheus?.port).toBe(9464);
      expect(options.exporter?.prometheus?.path).toBe('/metrics');
      expect(options.exporter?.prometheus?.withResourceAttributes).toBe(true);
      expect(options.exporter?.prometheus?.withUnits).toBe(false);
    });

    it('should allow Console-specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        exporter: {
          type: 'console',
          console: {
            prettyPrint: false
          }
        }
      };

      expect(options.exporter?.console?.prettyPrint).toBe(false);
    });
  });

  describe('Batch Configuration', () => {
    it('should allow configuration of batch processing options', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        batch: {
          maxExportBatchSize: 256,
          scheduledDelayMillis: 1000,
          maxQueueSize: 4096
        }
      };

      expect(options.batch?.maxExportBatchSize).toBe(256);
      expect(options.batch?.scheduledDelayMillis).toBe(1000);
      expect(options.batch?.maxQueueSize).toBe(4096);
    });
  });

  describe('Resource Attributes', () => {
    it('should allow configuration of resource attributes', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        resourceAttributes: {
          'deployment.environment': 'production',
          'service.instance.id': 'instance-123',
          'host.name': 'host-abc'
        }
      };

      expect(options.resourceAttributes).toEqual({
        'deployment.environment': 'production',
        'service.instance.id': 'instance-123',
        'host.name': 'host-abc'
      });
    });
  });

  describe('Debug and Disabled Flags', () => {
    it('should allow enabling debug mode', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        debug: true
      };

      expect(options.debug).toBe(true);
    });

    it('should allow disabling tracing entirely', () => {
      const options: TracingOptions = {
        service: {
          name: 'test-service'
        },
        disabled: true
      };

      expect(options.disabled).toBe(true);
    });
  });

  describe('Journey-Specific Configuration', () => {
    it('should allow health journey specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'health-service',
          journey: 'health'
        },
        journeyConfig: {
          health: {
            includeMetrics: true,
            includeDeviceInfo: false
          }
        }
      };

      expect(options.journeyConfig?.health?.includeMetrics).toBe(true);
      expect(options.journeyConfig?.health?.includeDeviceInfo).toBe(false);
    });

    it('should allow care journey specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'care-service',
          journey: 'care'
        },
        journeyConfig: {
          care: {
            includeAppointments: true,
            includeProviders: false
          }
        }
      };

      expect(options.journeyConfig?.care?.includeAppointments).toBe(true);
      expect(options.journeyConfig?.care?.includeProviders).toBe(false);
    });

    it('should allow plan journey specific configuration', () => {
      const options: TracingOptions = {
        service: {
          name: 'plan-service',
          journey: 'plan'
        },
        journeyConfig: {
          plan: {
            includeClaims: true,
            includeBenefits: false
          }
        }
      };

      expect(options.journeyConfig?.plan?.includeClaims).toBe(true);
      expect(options.journeyConfig?.plan?.includeBenefits).toBe(false);
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should support development environment configuration', () => {
      const devConfig = mockServiceConfigs.development;
      
      expect(devConfig.service.environment).toBe('development');
      expect(devConfig.sampling?.rate).toBe(1.0); // Full sampling in development
      expect(devConfig.exporter?.type).toBe('console'); // Console exporter for development
      expect(devConfig.debug).toBe(true); // Debug enabled in development
    });

    it('should support production environment configuration', () => {
      const prodConfig = mockServiceConfigs.production;
      
      expect(prodConfig.service.environment).toBe('production');
      expect(prodConfig.sampling?.rate).toBeLessThan(1.0); // Partial sampling in production
      expect(prodConfig.exporter?.type).toBe('otlp'); // OTLP exporter for production
      expect(prodConfig.debug).toBe(false); // Debug disabled in production
      expect(prodConfig.batch?.maxQueueSize).toBeGreaterThan(0); // Batch processing configured
    });

    it('should support staging environment configuration', () => {
      const stagingConfig = mockServiceConfigs.staging;
      
      expect(stagingConfig.service.environment).toBe('staging');
      expect(stagingConfig.sampling?.rate).toBeLessThan(1.0); // Partial sampling in staging
      expect(stagingConfig.exporter?.type).toBe('otlp'); // OTLP exporter for staging
    });
  });

  describe('Default Value Behavior', () => {
    it('should use default service name when not provided', () => {
      // In a real implementation, there would be a function to apply defaults
      const applyDefaults = (options: Partial<TracingOptions>): TracingOptions => {
        return {
          service: {
            name: options.service?.name || 'austa-service',
            version: options.service?.version || '1.0.0',
            environment: options.service?.environment || 'development',
            journey: options.service?.journey
          },
          sampling: {
            rate: options.sampling?.rate ?? 1.0,
            alwaysSampleErrors: options.sampling?.alwaysSampleErrors ?? true,
            alwaysSamplePaths: options.sampling?.alwaysSamplePaths || []
          },
          exporter: {
            type: options.exporter?.type || 'otlp',
            otlp: options.exporter?.otlp || {
              protocol: 'http/protobuf',
              endpoint: 'http://localhost:4318/v1/traces'
            }
          },
          debug: options.debug ?? false,
          disabled: options.disabled ?? false
        };
      };

      const emptyOptions = applyDefaults({});
      const partialOptions = applyDefaults({
        service: {
          name: 'custom-service'
        }
      });

      expect(emptyOptions.service.name).toBe('austa-service');
      expect(partialOptions.service.name).toBe('custom-service');
      expect(emptyOptions.sampling?.rate).toBe(1.0);
      expect(emptyOptions.exporter?.type).toBe('otlp');
    });

    it('should use appropriate defaults for different environments', () => {
      // In a real implementation, there would be environment-specific defaults
      const getEnvironmentDefaults = (environment: string): Partial<TracingOptions> => {
        switch (environment) {
          case 'production':
            return {
              sampling: { rate: 0.1 },
              exporter: { type: 'otlp' },
              debug: false
            };
          case 'staging':
            return {
              sampling: { rate: 0.5 },
              exporter: { type: 'otlp' },
              debug: true
            };
          case 'development':
          default:
            return {
              sampling: { rate: 1.0 },
              exporter: { type: 'console' },
              debug: true
            };
        }
      };

      const devDefaults = getEnvironmentDefaults('development');
      const stagingDefaults = getEnvironmentDefaults('staging');
      const prodDefaults = getEnvironmentDefaults('production');

      expect(devDefaults.sampling?.rate).toBe(1.0);
      expect(devDefaults.exporter?.type).toBe('console');
      expect(devDefaults.debug).toBe(true);

      expect(stagingDefaults.sampling?.rate).toBe(0.5);
      expect(stagingDefaults.exporter?.type).toBe('otlp');
      expect(stagingDefaults.debug).toBe(true);

      expect(prodDefaults.sampling?.rate).toBe(0.1);
      expect(prodDefaults.exporter?.type).toBe('otlp');
      expect(prodDefaults.debug).toBe(false);
    });
  });
});