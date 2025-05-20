import { KafkaConfig } from 'kafkajs';
import { loadKafkaConfig, validateKafkaConfig, mergeWithDefaults } from '../../../src/kafka/kafka.config';

describe('Kafka Configuration', () => {
  // Store original environment variables to restore after tests
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Clear any mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variables after each test
    process.env = originalEnv;
  });

  describe('loadKafkaConfig', () => {
    it('should load configuration from environment variables', () => {
      // Setup environment variables
      process.env.KAFKA_BROKERS = 'localhost:9092,localhost:9093';
      process.env.KAFKA_CLIENT_ID = 'test-client';
      process.env.KAFKA_GROUP_ID = 'test-group';

      const config = loadKafkaConfig();

      expect(config).toEqual(expect.objectContaining({
        brokers: ['localhost:9092', 'localhost:9093'],
        clientId: 'test-client',
        groupId: 'test-group'
      }));
    });

    it('should load journey-specific configuration from environment variables', () => {
      // Setup environment variables with journey prefix
      process.env.HEALTH_KAFKA_BROKERS = 'health-broker:9092';
      process.env.HEALTH_KAFKA_CLIENT_ID = 'health-client';
      process.env.HEALTH_KAFKA_GROUP_ID = 'health-group';

      const config = loadKafkaConfig('health');

      expect(config).toEqual(expect.objectContaining({
        brokers: ['health-broker:9092'],
        clientId: 'health-client',
        groupId: 'health-group'
      }));
    });

    it('should prioritize journey-specific configuration over default configuration', () => {
      // Setup both default and journey-specific environment variables
      process.env.KAFKA_BROKERS = 'default-broker:9092';
      process.env.KAFKA_CLIENT_ID = 'default-client';
      process.env.CARE_KAFKA_BROKERS = 'care-broker:9092';

      const config = loadKafkaConfig('care');

      expect(config).toEqual(expect.objectContaining({
        brokers: ['care-broker:9092'],
        clientId: 'default-client' // Should use default since journey-specific not provided
      }));
    });

    it('should handle empty or missing environment variables', () => {
      // No environment variables set
      delete process.env.KAFKA_BROKERS;
      delete process.env.KAFKA_CLIENT_ID;

      const config = loadKafkaConfig();

      // Should return empty or default configuration
      expect(config).toEqual(expect.objectContaining({
        brokers: []
      }));
    });
  });

  describe('validateKafkaConfig', () => {
    it('should validate a complete and valid configuration', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client'
      };

      expect(() => validateKafkaConfig(config)).not.toThrow();
    });

    it('should throw an error for missing brokers', () => {
      const config: KafkaConfig = {
        clientId: 'test-client',
        brokers: []
      };

      expect(() => validateKafkaConfig(config)).toThrow('Kafka configuration must include at least one broker');
    });

    it('should throw an error for missing clientId', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092']
      };

      expect(() => validateKafkaConfig(config)).toThrow('Kafka configuration must include a clientId');
    });

    it('should validate SSL configuration when provided', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        ssl: {
          rejectUnauthorized: true,
          ca: ['test-ca'],
          key: 'test-key',
          cert: 'test-cert'
        }
      };

      expect(() => validateKafkaConfig(config)).not.toThrow();
    });

    it('should throw an error for incomplete SSL configuration', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        ssl: {
          // Missing required SSL properties
          rejectUnauthorized: true
        }
      };

      expect(() => validateKafkaConfig(config)).toThrow('SSL configuration is incomplete');
    });

    it('should validate SASL configuration when provided', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        sasl: {
          mechanism: 'plain',
          username: 'test-user',
          password: 'test-password'
        }
      };

      expect(() => validateKafkaConfig(config)).not.toThrow();
    });

    it('should throw an error for incomplete SASL configuration', () => {
      const config: KafkaConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        sasl: {
          mechanism: 'plain'
          // Missing username and password
        }
      };

      expect(() => validateKafkaConfig(config)).toThrow('SASL configuration is incomplete');
    });
  });

  describe('mergeWithDefaults', () => {
    it('should merge provided configuration with defaults', () => {
      const defaults: KafkaConfig = {
        brokers: ['default-broker:9092'],
        clientId: 'default-client',
        retry: {
          initialRetryTime: 100,
          retries: 5
        }
      };

      const config: Partial<KafkaConfig> = {
        brokers: ['custom-broker:9092'],
        clientId: 'custom-client'
      };

      const merged = mergeWithDefaults(config, defaults);

      expect(merged).toEqual(expect.objectContaining({
        brokers: ['custom-broker:9092'], // Should use provided value
        clientId: 'custom-client', // Should use provided value
        retry: {
          initialRetryTime: 100, // Should use default value
          retries: 5 // Should use default value
        }
      }));
    });

    it('should handle deep merging of nested objects', () => {
      const defaults: KafkaConfig = {
        brokers: ['default-broker:9092'],
        clientId: 'default-client',
        retry: {
          initialRetryTime: 100,
          retries: 5,
          maxRetryTime: 30000
        }
      };

      const config: Partial<KafkaConfig> = {
        brokers: ['custom-broker:9092'],
        retry: {
          retries: 10 // Only override this property
        }
      };

      const merged = mergeWithDefaults(config, defaults);

      expect(merged).toEqual(expect.objectContaining({
        brokers: ['custom-broker:9092'],
        clientId: 'default-client',
        retry: {
          initialRetryTime: 100, // Should keep default
          retries: 10, // Should use provided value
          maxRetryTime: 30000 // Should keep default
        }
      }));
    });

    it('should use defaults when configuration is empty', () => {
      const defaults: KafkaConfig = {
        brokers: ['default-broker:9092'],
        clientId: 'default-client',
        retry: {
          initialRetryTime: 100,
          retries: 5
        }
      };

      const config: Partial<KafkaConfig> = {};

      const merged = mergeWithDefaults(config, defaults);

      expect(merged).toEqual(defaults);
    });

    it('should handle undefined or null configuration', () => {
      const defaults: KafkaConfig = {
        brokers: ['default-broker:9092'],
        clientId: 'default-client'
      };

      // Test with undefined
      const mergedUndefined = mergeWithDefaults(undefined, defaults);
      expect(mergedUndefined).toEqual(defaults);

      // Test with null
      const mergedNull = mergeWithDefaults(null as any, defaults);
      expect(mergedNull).toEqual(defaults);
    });
  });

  describe('Environment-specific configuration', () => {
    it('should load development configuration when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      process.env.KAFKA_BROKERS = 'dev-broker:9092';
      process.env.KAFKA_CLIENT_ID = 'dev-client';

      const config = loadKafkaConfig();

      expect(config).toEqual(expect.objectContaining({
        brokers: ['dev-broker:9092'],
        clientId: 'dev-client',
        // Development-specific defaults
        retry: expect.objectContaining({
          retries: expect.any(Number),
          initialRetryTime: expect.any(Number)
        })
      }));
    });

    it('should load production configuration when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      process.env.KAFKA_BROKERS = 'prod-broker:9092';
      process.env.KAFKA_CLIENT_ID = 'prod-client';

      const config = loadKafkaConfig();

      expect(config).toEqual(expect.objectContaining({
        brokers: ['prod-broker:9092'],
        clientId: 'prod-client',
        // Production-specific defaults
        retry: expect.objectContaining({
          retries: expect.any(Number),
          initialRetryTime: expect.any(Number),
          maxRetryTime: expect.any(Number)
        })
      }));
    });

    it('should load test configuration when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      process.env.KAFKA_BROKERS = 'test-broker:9092';
      process.env.KAFKA_CLIENT_ID = 'test-client';

      const config = loadKafkaConfig();

      expect(config).toEqual(expect.objectContaining({
        brokers: ['test-broker:9092'],
        clientId: 'test-client',
        // Test-specific defaults
        retry: expect.objectContaining({
          retries: expect.any(Number),
          initialRetryTime: expect.any(Number)
        })
      }));
    });
  });
});