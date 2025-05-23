import { Test } from '@nestjs/testing';
import * as Joi from 'joi';
import { Logger } from '@nestjs/common';

import {
  KafkaConfig,
  KafkaBrokerConfig,
  KafkaConsumerConfig,
  KafkaProducerConfig,
  JourneyKafkaConfig,
  DEFAULT_KAFKA_CONFIG,
  KAFKA_ENV_VARS,
  kafkaBrokerConfigSchema,
  kafkaConsumerConfigSchema,
  kafkaProducerConfigSchema,
  journeyKafkaConfigSchema,
  kafkaConfigSchema,
  loadKafkaConfigFromEnv,
  validateKafkaConfig,
  getJourneyKafkaConfig,
  getConsumerGroupId,
  createKafkaConfig,
} from '../../../src/kafka/kafka.config';

// Mock Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    })),
  };
});

describe('Kafka Configuration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration Schemas', () => {
    describe('kafkaBrokerConfigSchema', () => {
      it('should validate a valid broker configuration', () => {
        const validConfig: KafkaBrokerConfig = {
          brokers: ['localhost:9092', 'localhost:9093'],
          clientId: 'test-client',
          connectionTimeout: 3000,
          authenticationTimeout: 1000,
        };

        const { error, value } = kafkaBrokerConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should validate a broker configuration with SSL enabled', () => {
        const validConfig: KafkaBrokerConfig = {
          brokers: ['localhost:9092'],
          clientId: 'test-client',
          ssl: true,
        };

        const { error, value } = kafkaBrokerConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should validate a broker configuration with SASL authentication', () => {
        const validConfig: KafkaBrokerConfig = {
          brokers: ['localhost:9092'],
          clientId: 'test-client',
          sasl: {
            mechanism: 'plain',
            username: 'user',
            password: 'password',
          },
        };

        const { error, value } = kafkaBrokerConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should reject a broker configuration without brokers', () => {
        const invalidConfig = {
          clientId: 'test-client',
        };

        const { error } = kafkaBrokerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"brokers" is required');
      });

      it('should reject a broker configuration with empty brokers array', () => {
        const invalidConfig = {
          brokers: [],
          clientId: 'test-client',
        };

        const { error } = kafkaBrokerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('must contain at least 1 items');
      });

      it('should reject a broker configuration without clientId', () => {
        const invalidConfig = {
          brokers: ['localhost:9092'],
        };

        const { error } = kafkaBrokerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"clientId" is required');
      });

      it('should reject a broker configuration with invalid SASL mechanism', () => {
        const invalidConfig = {
          brokers: ['localhost:9092'],
          clientId: 'test-client',
          sasl: {
            mechanism: 'invalid-mechanism', // Invalid mechanism
            username: 'user',
            password: 'password',
          },
        };

        const { error } = kafkaBrokerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('must be one of');
      });
    });

    describe('kafkaConsumerConfigSchema', () => {
      it('should validate a valid consumer configuration', () => {
        const validConfig: KafkaConsumerConfig = {
          groupId: 'test-group',
          maxBatchSize: 100,
          maxRetries: 5,
          initialRetryTime: 100,
          retryFactor: 2,
          maxRetryTime: 30000,
        };

        const { error, value } = kafkaConsumerConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should reject a consumer configuration without groupId', () => {
        const invalidConfig = {
          maxBatchSize: 100,
        };

        const { error } = kafkaConsumerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"groupId" is required');
      });

      it('should apply default values for optional fields', () => {
        const minimalConfig = {
          groupId: 'test-group',
        };

        const { error, value } = kafkaConsumerConfigSchema.validate(minimalConfig);
        expect(error).toBeUndefined();
        expect(value).toHaveProperty('maxBatchSize', 100);
        expect(value).toHaveProperty('maxRetries', 5);
        expect(value).toHaveProperty('initialRetryTime', 100);
        expect(value).toHaveProperty('retryFactor', 2);
        expect(value).toHaveProperty('maxRetryTime', 30000);
        expect(value).toHaveProperty('retryNonRetriableErrors', false);
        expect(value).toHaveProperty('dlqSuffix', '.dlq');
      });

      it('should reject a consumer configuration with invalid maxRetries', () => {
        const invalidConfig = {
          groupId: 'test-group',
          maxRetries: -1, // Invalid negative value
        };

        const { error } = kafkaConsumerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('must be greater than or equal to 0');
      });
    });

    describe('kafkaProducerConfigSchema', () => {
      it('should validate a valid producer configuration', () => {
        const validConfig: KafkaProducerConfig = {
          requireAllAcks: true,
          ackTimeoutMs: 5000,
          maxRetries: 5,
          compression: 'snappy',
          batchSize: 16384,
          lingerMs: 5,
          idempotent: true,
        };

        const { error, value } = kafkaProducerConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should apply default values for optional fields', () => {
        const minimalConfig = {};

        const { error, value } = kafkaProducerConfigSchema.validate(minimalConfig);
        expect(error).toBeUndefined();
        expect(value).toHaveProperty('requireAllAcks', true);
        expect(value).toHaveProperty('ackTimeoutMs', 5000);
        expect(value).toHaveProperty('maxRetries', 5);
        expect(value).toHaveProperty('compression', 'snappy');
        expect(value).toHaveProperty('batchSize', 16384);
        expect(value).toHaveProperty('lingerMs', 5);
        expect(value).toHaveProperty('idempotent', true);
      });

      it('should reject a producer configuration with invalid compression type', () => {
        const invalidConfig = {
          compression: 'invalid-compression', // Invalid compression type
        };

        const { error } = kafkaProducerConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('must be one of');
      });
    });

    describe('journeyKafkaConfigSchema', () => {
      it('should validate a valid journey configuration', () => {
        const validConfig: JourneyKafkaConfig = {
          topics: {
            events: 'test.events',
            dlq: 'test.events.dlq',
            retry: 'test.events.retry',
          },
          consumerGroupPrefix: 'test-service',
          consumer: {
            maxRetries: 3,
          },
          producer: {
            compression: 'gzip',
          },
        };

        const { error, value } = journeyKafkaConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should validate a journey configuration without retry topic', () => {
        const validConfig: JourneyKafkaConfig = {
          topics: {
            events: 'test.events',
            dlq: 'test.events.dlq',
          },
          consumerGroupPrefix: 'test-service',
        };

        const { error, value } = journeyKafkaConfigSchema.validate(validConfig);
        expect(error).toBeUndefined();
        expect(value).toEqual(validConfig);
      });

      it('should reject a journey configuration without events topic', () => {
        const invalidConfig = {
          topics: {
            dlq: 'test.events.dlq',
          },
          consumerGroupPrefix: 'test-service',
        };

        const { error } = journeyKafkaConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"topics.events" is required');
      });

      it('should reject a journey configuration without dlq topic', () => {
        const invalidConfig = {
          topics: {
            events: 'test.events',
          },
          consumerGroupPrefix: 'test-service',
        };

        const { error } = journeyKafkaConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"topics.dlq" is required');
      });

      it('should reject a journey configuration without consumerGroupPrefix', () => {
        const invalidConfig = {
          topics: {
            events: 'test.events',
            dlq: 'test.events.dlq',
          },
        };

        const { error } = journeyKafkaConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details[0].message).toContain('"consumerGroupPrefix" is required');
      });
    });

    describe('kafkaConfigSchema', () => {
      it('should validate a complete valid configuration', () => {
        // Use DEFAULT_KAFKA_CONFIG as a valid configuration
        const { error, value } = kafkaConfigSchema.validate(DEFAULT_KAFKA_CONFIG);
        expect(error).toBeUndefined();
        expect(value).toEqual(DEFAULT_KAFKA_CONFIG);
      });

      it('should reject a configuration missing required sections', () => {
        const invalidConfig = {
          broker: DEFAULT_KAFKA_CONFIG.broker,
          consumer: DEFAULT_KAFKA_CONFIG.consumer,
          // Missing producer and journey configurations
        };

        const { error } = kafkaConfigSchema.validate(invalidConfig);
        expect(error).toBeDefined();
        expect(error.details.some(d => d.message.includes('"producer" is required'))).toBeTruthy();
        expect(error.details.some(d => d.message.includes('"healthJourney" is required'))).toBeTruthy();
      });
    });
  });

  describe('Environment-based Configuration', () => {
    it('should load configuration from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.BROKER_LIST]: 'kafka1:9092,kafka2:9092',
        [KAFKA_ENV_VARS.CLIENT_ID]: 'test-client-from-env',
        [KAFKA_ENV_VARS.SSL_ENABLED]: 'true',
        [KAFKA_ENV_VARS.CONSUMER_GROUP_ID]: 'test-group-from-env',
        [KAFKA_ENV_VARS.CONSUMER_MAX_BATCH_SIZE]: '200',
        [KAFKA_ENV_VARS.PRODUCER_COMPRESSION]: 'gzip',
        [KAFKA_ENV_VARS.HEALTH_EVENTS_TOPIC]: 'health.events.from.env',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);

      // Check that environment variables were applied
      expect(config.broker.brokers).toEqual(['kafka1:9092', 'kafka2:9092']);
      expect(config.broker.clientId).toBe('test-client-from-env');
      expect(config.broker.ssl).toBe(true);
      expect(config.consumer.groupId).toBe('test-group-from-env');
      expect(config.consumer.maxBatchSize).toBe(200);
      expect(config.producer.compression).toBe('gzip');
      expect(config.healthJourney.topics.events).toBe('health.events.from.env');

      // Check that defaults were preserved for other values
      expect(config.producer.batchSize).toBe(DEFAULT_KAFKA_CONFIG.producer.batchSize);
      expect(config.careJourney.topics.events).toBe(DEFAULT_KAFKA_CONFIG.careJourney.topics.events);
    });

    it('should load SASL configuration when all required variables are present', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SASL_MECHANISM]: 'plain',
        [KAFKA_ENV_VARS.SASL_USERNAME]: 'test-user',
        [KAFKA_ENV_VARS.SASL_PASSWORD]: 'test-password',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);

      expect(config.broker.sasl).toBeDefined();
      expect(config.broker.sasl.mechanism).toBe('plain');
      expect(config.broker.sasl.username).toBe('test-user');
      expect(config.broker.sasl.password).toBe('test-password');
    });

    it('should not load SASL configuration when any required variable is missing', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SASL_MECHANISM]: 'plain',
        // Missing username and password
      };

      const config = loadKafkaConfigFromEnv(mockEnv);

      expect(config.broker.sasl).toBeUndefined();
    });

    it('should load journey-specific configurations from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.HEALTH_EVENTS_TOPIC]: 'health.custom.events',
        [KAFKA_ENV_VARS.HEALTH_DLQ_TOPIC]: 'health.custom.dlq',
        [KAFKA_ENV_VARS.HEALTH_RETRY_TOPIC]: 'health.custom.retry',
        [KAFKA_ENV_VARS.HEALTH_CONSUMER_GROUP_PREFIX]: 'health-custom',
        [KAFKA_ENV_VARS.CARE_EVENTS_TOPIC]: 'care.custom.events',
        [KAFKA_ENV_VARS.PLAN_EVENTS_TOPIC]: 'plan.custom.events',
        [KAFKA_ENV_VARS.GAMIFICATION_EVENTS_TOPIC]: 'gamification.custom.events',
        [KAFKA_ENV_VARS.NOTIFICATION_EVENTS_TOPIC]: 'notification.custom.events',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);

      // Check health journey configuration
      expect(config.healthJourney.topics.events).toBe('health.custom.events');
      expect(config.healthJourney.topics.dlq).toBe('health.custom.dlq');
      expect(config.healthJourney.topics.retry).toBe('health.custom.retry');
      expect(config.healthJourney.consumerGroupPrefix).toBe('health-custom');

      // Check other journeys
      expect(config.careJourney.topics.events).toBe('care.custom.events');
      expect(config.planJourney.topics.events).toBe('plan.custom.events');
      expect(config.gamification.topics.events).toBe('gamification.custom.events');
      expect(config.notification.topics.events).toBe('notification.custom.events');
    });

    it('should handle errors when parsing numeric environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.CONSUMER_MAX_BATCH_SIZE]: 'not-a-number',
      };

      // Should not throw but log an error
      const config = loadKafkaConfigFromEnv(mockEnv);

      // Should keep the default value
      expect(config.consumer.maxBatchSize).toBe(DEFAULT_KAFKA_CONFIG.consumer.maxBatchSize);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate a valid configuration', () => {
      const result = validateKafkaConfig(DEFAULT_KAFKA_CONFIG);
      expect(result).toEqual(DEFAULT_KAFKA_CONFIG);
    });

    it('should throw an error for invalid configuration', () => {
      const invalidConfig = {
        ...DEFAULT_KAFKA_CONFIG,
        broker: {
          ...DEFAULT_KAFKA_CONFIG.broker,
          brokers: [], // Invalid: empty brokers array
        },
      } as KafkaConfig;

      expect(() => validateKafkaConfig(invalidConfig)).toThrow();
    });

    it('should throw an error with details for multiple validation failures', () => {
      const invalidConfig = {
        ...DEFAULT_KAFKA_CONFIG,
        broker: {
          ...DEFAULT_KAFKA_CONFIG.broker,
          brokers: [], // Invalid: empty brokers array
        },
        consumer: {
          ...DEFAULT_KAFKA_CONFIG.consumer,
          maxRetries: -1, // Invalid: negative retries
        },
      } as KafkaConfig;

      try {
        validateKafkaConfig(invalidConfig);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('must contain at least 1 items');
        expect(error.message).toContain('must be greater than or equal to 0');
      }
    });
  });

  describe('Journey-specific Configuration', () => {
    it('should retrieve health journey configuration', () => {
      const journeyConfig = getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'health');
      expect(journeyConfig).toBe(DEFAULT_KAFKA_CONFIG.healthJourney);
    });

    it('should retrieve care journey configuration', () => {
      const journeyConfig = getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'care');
      expect(journeyConfig).toBe(DEFAULT_KAFKA_CONFIG.careJourney);
    });

    it('should retrieve plan journey configuration', () => {
      const journeyConfig = getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'plan');
      expect(journeyConfig).toBe(DEFAULT_KAFKA_CONFIG.planJourney);
    });

    it('should retrieve gamification configuration', () => {
      const journeyConfig = getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'gamification');
      expect(journeyConfig).toBe(DEFAULT_KAFKA_CONFIG.gamification);
    });

    it('should retrieve notification configuration', () => {
      const journeyConfig = getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'notification');
      expect(journeyConfig).toBe(DEFAULT_KAFKA_CONFIG.notification);
    });

    it('should throw an error for unknown journey type', () => {
      expect(() => {
        // @ts-ignore - Testing runtime behavior with invalid input
        getJourneyKafkaConfig(DEFAULT_KAFKA_CONFIG, 'unknown');
      }).toThrow('Unknown journey type: unknown');
    });

    it('should generate correct consumer group ID for a journey', () => {
      const groupId = getConsumerGroupId(DEFAULT_KAFKA_CONFIG, 'health', 'metrics-consumer');
      expect(groupId).toBe('health-service-metrics-consumer');
    });

    it('should generate different consumer group IDs for different journeys', () => {
      const healthGroupId = getConsumerGroupId(DEFAULT_KAFKA_CONFIG, 'health', 'test-consumer');
      const careGroupId = getConsumerGroupId(DEFAULT_KAFKA_CONFIG, 'care', 'test-consumer');
      const planGroupId = getConsumerGroupId(DEFAULT_KAFKA_CONFIG, 'plan', 'test-consumer');

      expect(healthGroupId).toBe('health-service-test-consumer');
      expect(careGroupId).toBe('care-service-test-consumer');
      expect(planGroupId).toBe('plan-service-test-consumer');
    });
  });

  describe('Configuration Creation', () => {
    it('should create configuration with defaults', () => {
      // Mock the loadKafkaConfigFromEnv function to return default config
      jest.spyOn(global, 'process', 'get').mockImplementation(() => ({
        ...process,
        env: {},
      }));

      const config = createKafkaConfig();
      expect(config).toEqual(DEFAULT_KAFKA_CONFIG);
    });

    it('should create configuration with overrides', () => {
      // Mock the loadKafkaConfigFromEnv function to return default config
      jest.spyOn(global, 'process', 'get').mockImplementation(() => ({
        ...process,
        env: {},
      }));

      const overrides = {
        broker: {
          clientId: 'custom-client-id',
        },
        consumer: {
          maxRetries: 10,
        },
        healthJourney: {
          topics: {
            events: 'custom.health.events',
          },
        },
      };

      const config = createKafkaConfig(overrides as Partial<KafkaConfig>);

      // Check that overrides were applied
      expect(config.broker.clientId).toBe('custom-client-id');
      expect(config.consumer.maxRetries).toBe(10);
      expect(config.healthJourney.topics.events).toBe('custom.health.events');

      // Check that other values were preserved
      expect(config.broker.brokers).toEqual(DEFAULT_KAFKA_CONFIG.broker.brokers);
      expect(config.healthJourney.topics.dlq).toBe(DEFAULT_KAFKA_CONFIG.healthJourney.topics.dlq);
    });

    it('should throw an error if the resulting configuration is invalid', () => {
      const invalidOverrides = {
        broker: {
          brokers: [], // Invalid: empty brokers array
        },
      };

      expect(() => createKafkaConfig(invalidOverrides as Partial<KafkaConfig>)).toThrow();
    });

    it('should merge nested journey-specific configurations correctly', () => {
      // Mock the loadKafkaConfigFromEnv function to return default config
      jest.spyOn(global, 'process', 'get').mockImplementation(() => ({
        ...process,
        env: {},
      }));

      const overrides = {
        healthJourney: {
          consumer: {
            maxRetries: 15,
          },
          producer: {
            compression: 'gzip' as const,
          },
        },
      };

      const config = createKafkaConfig(overrides as Partial<KafkaConfig>);

      // Check that journey-specific overrides were applied
      expect(config.healthJourney.consumer).toEqual({
        maxRetries: 15,
      });
      expect(config.healthJourney.producer).toEqual({
        compression: 'gzip',
      });

      // Check that other journey configurations were preserved
      expect(config.careJourney).toEqual(DEFAULT_KAFKA_CONFIG.careJourney);
    });
  });

  describe('SSL and Authentication Configuration', () => {
    it('should configure SSL from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SSL_ENABLED]: 'true',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);
      expect(config.broker.ssl).toBe(true);
    });

    it('should configure SASL plain authentication from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SASL_MECHANISM]: 'plain',
        [KAFKA_ENV_VARS.SASL_USERNAME]: 'test-user',
        [KAFKA_ENV_VARS.SASL_PASSWORD]: 'test-password',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);
      expect(config.broker.sasl).toEqual({
        mechanism: 'plain',
        username: 'test-user',
        password: 'test-password',
      });
    });

    it('should configure SASL SCRAM-SHA-256 authentication from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SASL_MECHANISM]: 'scram-sha-256',
        [KAFKA_ENV_VARS.SASL_USERNAME]: 'test-user',
        [KAFKA_ENV_VARS.SASL_PASSWORD]: 'test-password',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);
      expect(config.broker.sasl).toEqual({
        mechanism: 'scram-sha-256',
        username: 'test-user',
        password: 'test-password',
      });
    });

    it('should configure SASL SCRAM-SHA-512 authentication from environment variables', () => {
      const mockEnv = {
        [KAFKA_ENV_VARS.SASL_MECHANISM]: 'scram-sha-512',
        [KAFKA_ENV_VARS.SASL_USERNAME]: 'test-user',
        [KAFKA_ENV_VARS.SASL_PASSWORD]: 'test-password',
      };

      const config = loadKafkaConfigFromEnv(mockEnv);
      expect(config.broker.sasl).toEqual({
        mechanism: 'scram-sha-512',
        username: 'test-user',
        password: 'test-password',
      });
    });

    it('should validate SASL configuration with schema', () => {
      const validConfig: KafkaBrokerConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        sasl: {
          mechanism: 'scram-sha-256',
          username: 'test-user',
          password: 'test-password',
        },
      };

      const { error } = kafkaBrokerConfigSchema.validate(validConfig);
      expect(error).toBeUndefined();
    });

    it('should reject invalid SASL mechanism', () => {
      const invalidConfig = {
        brokers: ['localhost:9092'],
        clientId: 'test-client',
        sasl: {
          mechanism: 'invalid-mechanism', // Invalid mechanism
          username: 'test-user',
          password: 'test-password',
        },
      };

      const { error } = kafkaBrokerConfigSchema.validate(invalidConfig);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('must be one of');
    });
  });
});