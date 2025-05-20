/**
 * @file Unit tests for tracing configuration key constants.
 * 
 * These tests verify that configuration keys used by the tracing package
 * follow consistent patterns, match environment variable names, and provide
 * complete coverage for all necessary configuration options.
 */

import { CONFIG_KEYS, SERVICE, EXPORTER, SAMPLING, RESOURCE, BATCH_PROCESSOR, JOURNEY, GENERAL } from '../../../src/constants/config-keys';

describe('Tracing Configuration Keys', () => {
  const TRACING_NAMESPACE = 'tracing';

  describe('Namespace', () => {
    it('should prefix all configuration keys with the tracing namespace', () => {
      // Check all exported configuration objects
      const allConfigObjects = [SERVICE, EXPORTER, SAMPLING, RESOURCE, BATCH_PROCESSOR, JOURNEY, GENERAL];
      
      // Flatten all configuration keys into a single array
      const allKeys = allConfigObjects.flatMap(obj => Object.values(obj));
      
      // Verify each key starts with the tracing namespace
      allKeys.forEach(key => {
        expect(key).toEqual(expect.stringContaining(`${TRACING_NAMESPACE}.`));
      });
    });
  });

  describe('Service Configuration Keys', () => {
    it('should define the service name key', () => {
      expect(SERVICE.NAME).toBe(`${TRACING_NAMESPACE}.service.name`);
    });

    it('should define the service version key', () => {
      expect(SERVICE.VERSION).toBe(`${TRACING_NAMESPACE}.service.version`);
    });

    it('should define the service environment key', () => {
      expect(SERVICE.ENVIRONMENT).toBe(`${TRACING_NAMESPACE}.service.environment`);
    });

    it('should include all service keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.SERVICE).toBe(SERVICE);
      expect(CONFIG_KEYS.SERVICE_NAME).toBe(SERVICE.NAME);
    });
  });

  describe('Exporter Configuration Keys', () => {
    it('should define the exporter type key', () => {
      expect(EXPORTER.TYPE).toBe(`${TRACING_NAMESPACE}.exporter.type`);
    });

    it('should define the exporter endpoint key', () => {
      expect(EXPORTER.ENDPOINT).toBe(`${TRACING_NAMESPACE}.exporter.endpoint`);
    });

    it('should define the exporter headers key', () => {
      expect(EXPORTER.HEADERS).toBe(`${TRACING_NAMESPACE}.exporter.headers`);
    });

    it('should define the exporter timeout key', () => {
      expect(EXPORTER.TIMEOUT).toBe(`${TRACING_NAMESPACE}.exporter.timeout`);
    });

    it('should include all exporter keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.EXPORTER).toBe(EXPORTER);
    });
  });

  describe('Sampling Configuration Keys', () => {
    it('should define the sampling ratio key', () => {
      expect(SAMPLING.RATIO).toBe(`${TRACING_NAMESPACE}.sampling.ratio`);
    });

    it('should define the sampling strategy key', () => {
      expect(SAMPLING.STRATEGY).toBe(`${TRACING_NAMESPACE}.sampling.strategy`);
    });

    it('should include all sampling keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.SAMPLING).toBe(SAMPLING);
    });
  });

  describe('Resource Configuration Keys', () => {
    it('should define the resource attributes key', () => {
      expect(RESOURCE.ATTRIBUTES).toBe(`${TRACING_NAMESPACE}.resource.attributes`);
    });

    it('should define the resource auto-detect key', () => {
      expect(RESOURCE.AUTO_DETECT).toBe(`${TRACING_NAMESPACE}.resource.autoDetect`);
    });

    it('should include all resource keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.RESOURCE).toBe(RESOURCE);
    });
  });

  describe('Batch Processor Configuration Keys', () => {
    it('should define the max batch size key', () => {
      expect(BATCH_PROCESSOR.MAX_BATCH_SIZE).toBe(`${TRACING_NAMESPACE}.batchProcessor.maxBatchSize`);
    });

    it('should define the max export batch size key', () => {
      expect(BATCH_PROCESSOR.MAX_EXPORT_BATCH_SIZE).toBe(`${TRACING_NAMESPACE}.batchProcessor.maxExportBatchSize`);
    });

    it('should define the export timeout key', () => {
      expect(BATCH_PROCESSOR.EXPORT_TIMEOUT).toBe(`${TRACING_NAMESPACE}.batchProcessor.exportTimeout`);
    });

    it('should define the schedule delay key', () => {
      expect(BATCH_PROCESSOR.SCHEDULE_DELAY).toBe(`${TRACING_NAMESPACE}.batchProcessor.scheduleDelay`);
    });

    it('should include all batch processor keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.BATCH_PROCESSOR).toBe(BATCH_PROCESSOR);
    });
  });

  describe('Journey-specific Configuration Keys', () => {
    it('should define the health journey enabled key', () => {
      expect(JOURNEY.HEALTH_ENABLED).toBe(`${TRACING_NAMESPACE}.journey.health.enabled`);
    });

    it('should define the care journey enabled key', () => {
      expect(JOURNEY.CARE_ENABLED).toBe(`${TRACING_NAMESPACE}.journey.care.enabled`);
    });

    it('should define the plan journey enabled key', () => {
      expect(JOURNEY.PLAN_ENABLED).toBe(`${TRACING_NAMESPACE}.journey.plan.enabled`);
    });

    it('should define the health journey sampling ratio key', () => {
      expect(JOURNEY.HEALTH_SAMPLING_RATIO).toBe(`${TRACING_NAMESPACE}.journey.health.samplingRatio`);
    });

    it('should define the care journey sampling ratio key', () => {
      expect(JOURNEY.CARE_SAMPLING_RATIO).toBe(`${TRACING_NAMESPACE}.journey.care.samplingRatio`);
    });

    it('should define the plan journey sampling ratio key', () => {
      expect(JOURNEY.PLAN_SAMPLING_RATIO).toBe(`${TRACING_NAMESPACE}.journey.plan.samplingRatio`);
    });

    it('should include all journey keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.JOURNEY).toBe(JOURNEY);
    });
  });

  describe('General Configuration Keys', () => {
    it('should define the enabled key', () => {
      expect(GENERAL.ENABLED).toBe(`${TRACING_NAMESPACE}.enabled`);
    });

    it('should define the log level key', () => {
      expect(GENERAL.LOG_LEVEL).toBe(`${TRACING_NAMESPACE}.logLevel`);
    });

    it('should define the context propagation enabled key', () => {
      expect(GENERAL.CONTEXT_PROPAGATION_ENABLED).toBe(`${TRACING_NAMESPACE}.contextPropagation.enabled`);
    });

    it('should include all general keys in the main CONFIG_KEYS export', () => {
      expect(CONFIG_KEYS.GENERAL).toBe(GENERAL);
    });
  });

  describe('Environment Variable Mapping', () => {
    it('should follow a consistent pattern for mapping to environment variables', () => {
      // Define a function to convert config key to expected environment variable name
      const toEnvVar = (key: string): string => {
        return key.toUpperCase().replace(/\./g, '_');
      };

      // Test a sample of keys from different categories
      expect(toEnvVar(SERVICE.NAME)).toBe('TRACING_SERVICE_NAME');
      expect(toEnvVar(EXPORTER.TYPE)).toBe('TRACING_EXPORTER_TYPE');
      expect(toEnvVar(SAMPLING.RATIO)).toBe('TRACING_SAMPLING_RATIO');
      expect(toEnvVar(JOURNEY.HEALTH_ENABLED)).toBe('TRACING_JOURNEY_HEALTH_ENABLED');
      expect(toEnvVar(GENERAL.ENABLED)).toBe('TRACING_ENABLED');
    });
  });

  describe('Deprecated Keys', () => {
    it('should mark SERVICE_NAME as deprecated but still functional', () => {
      // Verify the deprecated key still points to the correct value
      expect(CONFIG_KEYS.SERVICE_NAME).toBe(SERVICE.NAME);
    });
  });

  describe('Key Organization', () => {
    it('should organize keys by functional area', () => {
      // Verify that each category has the expected number of keys
      expect(Object.keys(SERVICE).length).toBe(3); // NAME, VERSION, ENVIRONMENT
      expect(Object.keys(EXPORTER).length).toBe(4); // TYPE, ENDPOINT, HEADERS, TIMEOUT
      expect(Object.keys(SAMPLING).length).toBe(2); // RATIO, STRATEGY
      expect(Object.keys(RESOURCE).length).toBe(2); // ATTRIBUTES, AUTO_DETECT
      expect(Object.keys(BATCH_PROCESSOR).length).toBe(4); // MAX_BATCH_SIZE, MAX_EXPORT_BATCH_SIZE, EXPORT_TIMEOUT, SCHEDULE_DELAY
      expect(Object.keys(JOURNEY).length).toBe(6); // HEALTH_ENABLED, CARE_ENABLED, PLAN_ENABLED, HEALTH_SAMPLING_RATIO, CARE_SAMPLING_RATIO, PLAN_SAMPLING_RATIO
      expect(Object.keys(GENERAL).length).toBe(3); // ENABLED, LOG_LEVEL, CONTEXT_PROPAGATION_ENABLED
    });
  });
});