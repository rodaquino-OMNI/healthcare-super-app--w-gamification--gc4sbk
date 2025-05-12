/**
 * @file kafka.config.spec.ts
 * @description Unit tests for Kafka configuration utilities
 */

import {
  createApiGatewayKafkaConfig,
  createGamificationKafkaConfig,
  createJourneyKafkaConfig,
  createKafkaOptions,
  createKafkaOptionsFromEnv,
  createNotificationKafkaConfig,
  createTestKafkaConfig,
  DEFAULT_CLIENT_CONFIG,
  DEFAULT_CONSUMER_CONFIG,
  DEFAULT_PRODUCER_CONFIG,
  DEFAULT_RUN_CONFIG,
  getJourneyTopic,
  getJourneyTopics,
  isKafkaConfigValid,
  kafkaConfigFactory,
  kafkaConfigSchema,
  KAFKA_ENV_VARS,
  loadKafkaClientConfigFromEnv,
  loadKafkaConfigFromEnv,
  loadKafkaConsumerConfigFromEnv,
  loadKafkaProducerConfigFromEnv,
  loadKafkaRunConfigFromEnv,
  mergeKafkaConfigs,
  parseStringArray,
  registerKafkaConfig,
  validateKafkaConfig,
} from '../../../src/kafka/kafka.config';
import { KafkaConfig, KafkaClientConfig } from '../../../src/kafka/kafka.config';

// Mock environment variables
const originalEnv = process.env;

describe('Kafka Configuration Utilities', () => {
  // Reset environment variables before each test
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  // Restore environment variables after all tests
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('parseStringArray', () => {
    it('should parse comma-separated string into array', () => {
      const result = parseStringArray('localhost:9092,localhost:9093,localhost:9094');
      expect(result).toEqual(['localhost:9092', 'localhost:9093', 'localhost:9094']);
    });

    it('should handle whitespace in comma-separated string', () => {
      const result = parseStringArray('localhost:9092, localhost:9093, localhost:9094');
      expect(result).toEqual(['localhost:9092', 'localhost:9093', 'localhost:9094']);
    });

    it('should return empty array for undefined input', () => {
      const result = parseStringArray(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = parseStringArray('');
      expect(result).toEqual([]);
    });
  });

  describe('loadKafkaClientConfigFromEnv', () => {
    it('should load client configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092,localhost:9093';
      process.env[KAFKA_ENV_VARS.CONNECTION_TIMEOUT] = '5000';
      process.env[KAFKA_ENV_VARS.REQUEST_TIMEOUT] = '10000';

      const config = loadKafkaClientConfigFromEnv();

      expect(config).toEqual({
        clientId: 'test-client',
        brokers: ['localhost:9092', 'localhost:9093'],
        connectionTimeout: 5000,
        requestTimeout: 10000,
        retry: {
          maxRetryTime: DEFAULT_CLIENT_CONFIG.retry?.maxRetryTime,
          initialRetryTime: DEFAULT_CLIENT_CONFIG.retry?.initialRetryTime,
          factor: DEFAULT_CLIENT_CONFIG.retry?.factor,
          multiplier: DEFAULT_CLIENT_CONFIG.retry?.multiplier,
          retries: DEFAULT_CLIENT_CONFIG.retry?.retries,
        },
      });
    });

    it('should use default values when environment variables are not set', () => {
      const config = loadKafkaClientConfigFromEnv();

      expect(config).toEqual({
        clientId: DEFAULT_CLIENT_CONFIG.clientId,
        brokers: [],
        connectionTimeout: DEFAULT_CLIENT_CONFIG.connectionTimeout,
        requestTimeout: DEFAULT_CLIENT_CONFIG.requestTimeout,
        retry: {
          maxRetryTime: DEFAULT_CLIENT_CONFIG.retry?.maxRetryTime,
          initialRetryTime: DEFAULT_CLIENT_CONFIG.retry?.initialRetryTime,
          factor: DEFAULT_CLIENT_CONFIG.retry?.factor,
          multiplier: DEFAULT_CLIENT_CONFIG.retry?.multiplier,
          retries: DEFAULT_CLIENT_CONFIG.retry?.retries,
        },
      });
    });

    it('should load SSL configuration when enabled', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.SSL_ENABLED] = 'true';
      process.env[KAFKA_ENV_VARS.SSL_CA] = '/path/to/ca.pem';
      process.env[KAFKA_ENV_VARS.SSL_CERT] = '/path/to/cert.pem';
      process.env[KAFKA_ENV_VARS.SSL_KEY] = '/path/to/key.pem';
      process.env[KAFKA_ENV_VARS.SSL_PASSPHRASE] = 'passphrase';
      process.env[KAFKA_ENV_VARS.SSL_REJECT_UNAUTHORIZED] = 'false';

      const config = loadKafkaClientConfigFromEnv();

      expect(config.ssl).toEqual({
        ca: '/path/to/ca.pem',
        cert: '/path/to/cert.pem',
        key: '/path/to/key.pem',
        passphrase: 'passphrase',
        rejectUnauthorized: false,
      });
    });

    it('should disable SSL when explicitly set to false', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.SSL_ENABLED] = 'false';

      const config = loadKafkaClientConfigFromEnv();

      expect(config.ssl).toBe(false);
    });

    it('should load SASL configuration when mechanism is provided', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.SASL_MECHANISM] = 'plain';
      process.env[KAFKA_ENV_VARS.SASL_USERNAME] = 'user';
      process.env[KAFKA_ENV_VARS.SASL_PASSWORD] = 'password';

      const config = loadKafkaClientConfigFromEnv();

      expect(config.sasl).toEqual({
        mechanism: 'plain',
        username: 'user',
        password: 'password',
        authorizationIdentity: undefined,
      });
    });

    it('should load AWS SASL configuration when mechanism is aws', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.SASL_MECHANISM] = 'aws';
      process.env[KAFKA_ENV_VARS.SASL_AUTH_IDENTITY] = 'identity';

      const config = loadKafkaClientConfigFromEnv();

      expect(config.sasl).toEqual({
        mechanism: 'aws',
        username: undefined,
        password: undefined,
        authorizationIdentity: 'identity',
      });
    });

    it('should load retry configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.RETRY_MAX_TIME] = '60000';
      process.env[KAFKA_ENV_VARS.RETRY_INITIAL_TIME] = '200';
      process.env[KAFKA_ENV_VARS.RETRY_FACTOR] = '0.5';
      process.env[KAFKA_ENV_VARS.RETRY_MULTIPLIER] = '3';
      process.env[KAFKA_ENV_VARS.RETRY_RETRIES] = '10';

      const config = loadKafkaClientConfigFromEnv();

      expect(config.retry).toEqual({
        maxRetryTime: 60000,
        initialRetryTime: 200,
        factor: 0.5,
        multiplier: 3,
        retries: 10,
      });
    });

    it('should use prefix for journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'default-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'default:9092';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}HEALTH_${KAFKA_ENV_VARS.CLIENT_ID}`] = 'health-client';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}HEALTH_${KAFKA_ENV_VARS.BROKERS}`] = 'health:9092';

      const config = loadKafkaClientConfigFromEnv('health');

      expect(config).toEqual({
        clientId: 'health-client',
        brokers: ['health:9092'],
        connectionTimeout: DEFAULT_CLIENT_CONFIG.connectionTimeout,
        requestTimeout: DEFAULT_CLIENT_CONFIG.requestTimeout,
        retry: {
          maxRetryTime: DEFAULT_CLIENT_CONFIG.retry?.maxRetryTime,
          initialRetryTime: DEFAULT_CLIENT_CONFIG.retry?.initialRetryTime,
          factor: DEFAULT_CLIENT_CONFIG.retry?.factor,
          multiplier: DEFAULT_CLIENT_CONFIG.retry?.multiplier,
          retries: DEFAULT_CLIENT_CONFIG.retry?.retries,
        },
      });
    });
  });

  describe('loadKafkaConsumerConfigFromEnv', () => {
    it('should load consumer configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID] = 'test-group';
      process.env[KAFKA_ENV_VARS.CONSUMER_MAX_BYTES] = '2097152';
      process.env[KAFKA_ENV_VARS.CONSUMER_MIN_BYTES] = '10';
      process.env[KAFKA_ENV_VARS.CONSUMER_MAX_WAIT_TIME] = '10000';
      process.env[KAFKA_ENV_VARS.CONSUMER_READ_UNCOMMITTED] = 'true';
      process.env[KAFKA_ENV_VARS.CONSUMER_ALLOW_AUTO_TOPIC_CREATION] = 'true';

      const config = loadKafkaConsumerConfigFromEnv();

      expect(config).toEqual({
        groupId: 'test-group',
        maxBytes: 2097152,
        minBytes: 10,
        maxWaitTimeInMs: 10000,
        readUncommitted: true,
        allowAutoTopicCreation: true,
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Set only required environment variables
      process.env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID] = 'test-group';

      const config = loadKafkaConsumerConfigFromEnv();

      expect(config).toEqual({
        groupId: 'test-group',
        maxBytes: DEFAULT_CONSUMER_CONFIG.maxBytes,
        minBytes: DEFAULT_CONSUMER_CONFIG.minBytes,
        maxWaitTimeInMs: DEFAULT_CONSUMER_CONFIG.maxWaitTimeInMs,
        readUncommitted: DEFAULT_CONSUMER_CONFIG.readUncommitted,
        allowAutoTopicCreation: DEFAULT_CONSUMER_CONFIG.allowAutoTopicCreation,
      });
    });

    it('should return undefined when group ID is not set', () => {
      const config = loadKafkaConsumerConfigFromEnv();

      expect(config).toBeUndefined();
    });

    it('should use prefix for journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID] = 'default-group';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}CARE_${KAFKA_ENV_VARS.CONSUMER_GROUP_ID}`] = 'care-group';

      const config = loadKafkaConsumerConfigFromEnv('care');

      expect(config?.groupId).toBe('care-group');
    });
  });

  describe('loadKafkaProducerConfigFromEnv', () => {
    it('should load producer configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.PRODUCER_ALLOW_AUTO_TOPIC_CREATION] = 'true';
      process.env[KAFKA_ENV_VARS.PRODUCER_COMPRESSION] = 'gzip';
      process.env[KAFKA_ENV_VARS.PRODUCER_METADATA_MAX_AGE] = '600000';
      process.env[KAFKA_ENV_VARS.PRODUCER_ACKS] = 'all';

      const config = loadKafkaProducerConfigFromEnv();

      expect(config).toEqual({
        allowAutoTopicCreation: true,
        compression: 'gzip',
        metadataMaxAge: 600000,
        acks: 'all',
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Set at least one environment variable to trigger producer config creation
      process.env[KAFKA_ENV_VARS.PRODUCER_ALLOW_AUTO_TOPIC_CREATION] = 'true';

      const config = loadKafkaProducerConfigFromEnv();

      expect(config).toEqual({
        allowAutoTopicCreation: true,
        compression: DEFAULT_PRODUCER_CONFIG.compression,
        metadataMaxAge: DEFAULT_PRODUCER_CONFIG.metadataMaxAge,
        acks: DEFAULT_PRODUCER_CONFIG.acks,
      });
    });

    it('should return undefined when no producer environment variables are set', () => {
      const config = loadKafkaProducerConfigFromEnv();

      expect(config).toBeUndefined();
    });

    it('should handle numeric acks value', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.PRODUCER_ACKS] = '1';

      const config = loadKafkaProducerConfigFromEnv();

      expect(config?.acks).toBe(1);
    });

    it('should use prefix for journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.PRODUCER_COMPRESSION] = 'none';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}PLAN_${KAFKA_ENV_VARS.PRODUCER_COMPRESSION}`] = 'gzip';

      const config = loadKafkaProducerConfigFromEnv('plan');

      expect(config?.compression).toBe('gzip');
    });
  });

  describe('loadKafkaRunConfigFromEnv', () => {
    it('should load run configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.RUN_AUTO_COMMIT] = 'false';
      process.env[KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL] = '10000';
      process.env[KAFKA_ENV_VARS.RUN_BATCH_SIZE] = '200';
      process.env[KAFKA_ENV_VARS.RUN_CONCURRENCY] = '20';
      process.env[KAFKA_ENV_VARS.RUN_PARTITIONS_CONSUMED_CONCURRENTLY] = '2';

      const config = loadKafkaRunConfigFromEnv();

      expect(config).toEqual({
        autoCommit: false,
        autoCommitInterval: 10000,
        batchSize: 200,
        concurrency: 20,
        partitionsConsumedConcurrently: 2,
      });
    });

    it('should use default values when environment variables are not set', () => {
      // Set at least one environment variable to trigger run config creation
      process.env[KAFKA_ENV_VARS.RUN_AUTO_COMMIT] = 'false';

      const config = loadKafkaRunConfigFromEnv();

      expect(config).toEqual({
        autoCommit: false,
        autoCommitInterval: DEFAULT_RUN_CONFIG.autoCommitInterval,
        batchSize: DEFAULT_RUN_CONFIG.batchSize,
        concurrency: DEFAULT_RUN_CONFIG.concurrency,
        partitionsConsumedConcurrently: DEFAULT_RUN_CONFIG.partitionsConsumedConcurrently,
      });
    });

    it('should return undefined when no run environment variables are set', () => {
      const config = loadKafkaRunConfigFromEnv();

      expect(config).toBeUndefined();
    });

    it('should handle null autoCommitInterval', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.RUN_AUTO_COMMIT_INTERVAL] = 'null';

      const config = loadKafkaRunConfigFromEnv();

      expect(config?.autoCommitInterval).toBeNull();
    });

    it('should use prefix for journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.RUN_BATCH_SIZE] = '100';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}HEALTH_${KAFKA_ENV_VARS.RUN_BATCH_SIZE}`] = '50';

      const config = loadKafkaRunConfigFromEnv('health');

      expect(config?.batchSize).toBe(50);
    });
  });

  describe('loadKafkaConfigFromEnv', () => {
    it('should load complete Kafka configuration from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID] = 'test-group';
      process.env[KAFKA_ENV_VARS.PRODUCER_COMPRESSION] = 'gzip';
      process.env[KAFKA_ENV_VARS.RUN_BATCH_SIZE] = '200';

      const config = loadKafkaConfigFromEnv();

      expect(config).toHaveProperty('client');
      expect(config).toHaveProperty('consumer');
      expect(config).toHaveProperty('producer');
      expect(config).toHaveProperty('run');
      expect(config.client.clientId).toBe('test-client');
      expect(config.consumer?.groupId).toBe('test-group');
      expect(config.producer?.compression).toBe('gzip');
      expect(config.run?.batchSize).toBe(200);
    });

    it('should load journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'default-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'default:9092';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}CARE_${KAFKA_ENV_VARS.CLIENT_ID}`] = 'care-client';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}CARE_${KAFKA_ENV_VARS.BROKERS}`] = 'care:9092';

      const config = loadKafkaConfigFromEnv('care');

      expect(config.client.clientId).toBe('care-client');
      expect(config.client.brokers).toEqual(['care:9092']);
    });

    it('should include only defined sections', () => {
      // Set only client configuration
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = loadKafkaConfigFromEnv();

      expect(config).toHaveProperty('client');
      expect(config).not.toHaveProperty('consumer');
      expect(config).not.toHaveProperty('producer');
      expect(config).not.toHaveProperty('run');
    });
  });

  describe('validateKafkaConfig', () => {
    it('should validate valid configuration', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
      };

      const validatedConfig = validateKafkaConfig(config);

      expect(validatedConfig).toBeDefined();
      expect(validatedConfig.client.clientId).toBe('test-client');
    });

    it('should throw error for missing client configuration', () => {
      const config = {} as KafkaConfig;

      expect(() => validateKafkaConfig(config)).toThrow('client configuration is required');
    });

    it('should throw error for missing brokers', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: [],
        },
      };

      expect(() => validateKafkaConfig(config)).toThrow('at least one broker must be specified');
    });

    it('should throw error for invalid SASL configuration with plain mechanism', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
          sasl: {
            mechanism: 'plain',
            username: undefined,
            password: undefined,
          },
        },
      };

      expect(() => validateKafkaConfig(config)).toThrow('username and password are required for plain mechanism');
    });

    it('should throw error for invalid SASL configuration with aws mechanism', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
          sasl: {
            mechanism: 'aws',
            authorizationIdentity: undefined,
          },
        },
      };

      expect(() => validateKafkaConfig(config)).toThrow('authorizationIdentity is required for aws mechanism');
    });

    it('should apply default values to validated configuration', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
      };

      const validatedConfig = validateKafkaConfig(config);

      expect(validatedConfig.client.connectionTimeout).toBe(DEFAULT_CLIENT_CONFIG.connectionTimeout);
      expect(validatedConfig.client.requestTimeout).toBe(DEFAULT_CLIENT_CONFIG.requestTimeout);
      expect(validatedConfig.client.retry).toEqual(DEFAULT_CLIENT_CONFIG.retry);
    });
  });

  describe('createKafkaOptions', () => {
    it('should create Kafka options for NestJS microservices', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
      };

      const options = createKafkaOptions(config);

      expect(options).toHaveProperty('transport');
      expect(options).toHaveProperty('options');
      expect(options.options).toEqual(config);
    });
  });

  describe('createKafkaOptionsFromEnv', () => {
    it('should create Kafka options from environment variables', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const options = createKafkaOptionsFromEnv();

      expect(options).toHaveProperty('transport');
      expect(options).toHaveProperty('options');
      expect(options.options.client.clientId).toBe('test-client');
    });

    it('should create journey-specific Kafka options', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'default-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'default:9092';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}HEALTH_${KAFKA_ENV_VARS.CLIENT_ID}`] = 'health-client';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}HEALTH_${KAFKA_ENV_VARS.BROKERS}`] = 'health:9092';

      const options = createKafkaOptionsFromEnv('health');

      expect(options.options.client.clientId).toBe('health-client');
    });
  });

  describe('kafkaConfigFactory', () => {
    it('should create a factory function for Kafka configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'test-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const factory = kafkaConfigFactory();
      const config = factory();

      expect(config).toHaveProperty('client');
      expect(config.client.clientId).toBe('test-client');
    });

    it('should create a factory function for journey-specific configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'default-client';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'default:9092';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}CARE_${KAFKA_ENV_VARS.CLIENT_ID}`] = 'care-client';
      process.env[`${KAFKA_ENV_VARS.JOURNEY_PREFIX}CARE_${KAFKA_ENV_VARS.BROKERS}`] = 'care:9092';

      const factory = kafkaConfigFactory('care');
      const config = factory();

      expect(config.client.clientId).toBe('care-client');
    });
  });

  describe('registerKafkaConfig', () => {
    it('should create a provider for Kafka configuration', () => {
      const provider = registerKafkaConfig();

      expect(provider).toHaveProperty('provide', 'KAFKA_CONFIG');
      expect(provider).toHaveProperty('useFactory');
    });

    it('should create a provider for journey-specific configuration', () => {
      const provider = registerKafkaConfig('health');

      expect(provider).toHaveProperty('provide', 'KAFKA_CONFIG');
      expect(provider).toHaveProperty('useFactory');
    });
  });

  describe('isKafkaConfigValid', () => {
    it('should return true for valid configuration', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
      };

      const isValid = isKafkaConfigValid(config);

      expect(isValid).toBe(true);
    });

    it('should return false for invalid configuration', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: [],
        },
      };

      const isValid = isKafkaConfigValid(config);

      expect(isValid).toBe(false);
    });

    it('should return false for configuration with missing client', () => {
      const config = {} as KafkaConfig;

      const isValid = isKafkaConfigValid(config);

      expect(isValid).toBe(false);
    });
  });

  describe('getJourneyTopic', () => {
    it('should return standardized topic name for health journey', () => {
      const topic = getJourneyTopic('health', 'metrics');

      expect(topic).toBe('austa.health.metrics');
    });

    it('should return standardized topic name for care journey', () => {
      const topic = getJourneyTopic('care', 'appointments');

      expect(topic).toBe('austa.care.appointments');
    });

    it('should return standardized topic name for plan journey', () => {
      const topic = getJourneyTopic('plan', 'claims');

      expect(topic).toBe('austa.plan.claims');
    });
  });

  describe('getJourneyTopics', () => {
    it('should return topics for specified journey', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
        subscribe: [
          { topic: 'austa.health.metrics', journey: 'health' },
          { topic: 'austa.health.goals', journey: 'health' },
          { topic: 'austa.care.appointments', journey: 'care' },
          { topic: 'austa.user.events', journey: 'common' },
        ],
      };

      const topics = getJourneyTopics('health', config);

      expect(topics).toEqual(['austa.health.metrics', 'austa.health.goals', 'austa.user.events']);
    });

    it('should return empty array when no topics are defined', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
      };

      const topics = getJourneyTopics('health', config);

      expect(topics).toEqual([]);
    });

    it('should return empty array when no matching topics are found', () => {
      const config: KafkaConfig = {
        client: {
          clientId: 'test-client',
          brokers: ['localhost:9092'],
        },
        subscribe: [
          { topic: 'austa.care.appointments', journey: 'care' },
          { topic: 'austa.plan.claims', journey: 'plan' },
        ],
      };

      const topics = getJourneyTopics('health', config);

      expect(topics).toEqual([]);
    });
  });

  describe('createJourneyKafkaConfig', () => {
    it('should create journey-specific Kafka configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';
      process.env[KAFKA_ENV_VARS.CONSUMER_GROUP_ID] = 'group';

      const config = createJourneyKafkaConfig('health');

      expect(config.client.clientId).toBe('austa-health-app');
      expect(config.consumer?.groupId).toBe('austa-health-group');
    });

    it('should not modify client ID if it already includes journey name', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'health-app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createJourneyKafkaConfig('health');

      expect(config.client.clientId).toBe('health-app');
    });

    it('should merge with additional configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const additionalConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'custom-client',
          brokers: ['custom:9092'],
        },
        subscribe: [
          { topic: 'custom.topic', journey: 'health' },
        ],
      };

      const config = createJourneyKafkaConfig('health', additionalConfig);

      expect(config.client.clientId).toBe('custom-client');
      expect(config.client.brokers).toEqual(['custom:9092']);
      expect(config.subscribe).toContainEqual({ topic: 'custom.topic', journey: 'health' });
    });
  });

  describe('createGamificationKafkaConfig', () => {
    it('should create Kafka configuration for gamification engine', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createGamificationKafkaConfig();

      expect(config.client.clientId).toBe('austa-gamification-engine');
      expect(config.consumer?.groupId).toBe('austa-gamification-consumers');
      expect(config.subscribe).toHaveLength(5); // Default subscriptions
      expect(config.subscribe).toContainEqual({ topic: 'austa.health.events', journey: 'health' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.care.events', journey: 'care' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.plan.events', journey: 'plan' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.user.events', journey: 'common' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.game.events', journey: 'common' });
    });

    it('should not duplicate existing subscriptions', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      // Create config with existing subscriptions
      const baseConfig = loadKafkaConfigFromEnv();
      baseConfig.subscribe = [
        { topic: 'austa.health.events', journey: 'health' },
      ];

      // Mock loadKafkaConfigFromEnv to return our baseConfig
      jest.spyOn(global, 'loadKafkaConfigFromEnv').mockReturnValue(baseConfig);

      const config = createGamificationKafkaConfig();

      // Should have 5 subscriptions (1 existing + 4 new)
      expect(config.subscribe).toHaveLength(5);
      // Should have only one 'austa.health.events' subscription
      expect(config.subscribe?.filter(s => s.topic === 'austa.health.events')).toHaveLength(1);
    });

    it('should merge with additional configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const additionalConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'custom-gamification',
          brokers: ['custom:9092'],
        },
        subscribe: [
          { topic: 'custom.achievements', journey: 'common' },
        ],
      };

      const config = createGamificationKafkaConfig(additionalConfig);

      expect(config.client.clientId).toBe('custom-gamification');
      expect(config.client.brokers).toEqual(['custom:9092']);
      expect(config.subscribe).toContainEqual({ topic: 'custom.achievements', journey: 'common' });
    });
  });

  describe('createNotificationKafkaConfig', () => {
    it('should create Kafka configuration for notification service', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createNotificationKafkaConfig();

      expect(config.client.clientId).toBe('austa-notification-service');
      expect(config.consumer?.groupId).toBe('austa-notification-consumers');
      expect(config.subscribe).toHaveLength(6); // Default subscriptions
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.health', journey: 'health' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.care', journey: 'care' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.plan', journey: 'plan' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.user', journey: 'common' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.achievements', journey: 'common' });
      expect(config.subscribe).toContainEqual({ topic: 'austa.notifications.dlq', journey: 'common' });
    });

    it('should configure aggressive retry settings', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createNotificationKafkaConfig();

      expect(config.client.retry?.retries).toBe(10);
      expect(config.client.retry?.maxRetryTime).toBe(60000);
    });

    it('should merge with additional configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const additionalConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'custom-notification',
          brokers: ['custom:9092'],
        },
        subscribe: [
          { topic: 'custom.alerts', journey: 'common' },
        ],
      };

      const config = createNotificationKafkaConfig(additionalConfig);

      expect(config.client.clientId).toBe('custom-notification');
      expect(config.client.brokers).toEqual(['custom:9092']);
      expect(config.subscribe).toContainEqual({ topic: 'custom.alerts', journey: 'common' });
    });
  });

  describe('createApiGatewayKafkaConfig', () => {
    it('should create Kafka configuration for API gateway', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createApiGatewayKafkaConfig();

      expect(config.client.clientId).toBe('austa-api-gateway');
      expect(config.producer?.acks).toBe('all');
    });

    it('should configure reliable retry settings', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const config = createApiGatewayKafkaConfig();

      expect(config.client.retry?.retries).toBe(5);
      expect(config.client.retry?.maxRetryTime).toBe(30000);
    });

    it('should merge with additional configuration', () => {
      // Set environment variables
      process.env[KAFKA_ENV_VARS.CLIENT_ID] = 'app';
      process.env[KAFKA_ENV_VARS.BROKERS] = 'localhost:9092';

      const additionalConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'custom-gateway',
          brokers: ['custom:9092'],
        },
      };

      const config = createApiGatewayKafkaConfig(additionalConfig);

      expect(config.client.clientId).toBe('custom-gateway');
      expect(config.client.brokers).toEqual(['custom:9092']);
    });
  });

  describe('mergeKafkaConfigs', () => {
    it('should merge two Kafka configurations', () => {
      const baseConfig: KafkaConfig = {
        client: {
          clientId: 'base-client',
          brokers: ['base:9092'],
          retry: {
            retries: 3,
            initialRetryTime: 100,
          },
        },
        consumer: {
          groupId: 'base-group',
          maxBytes: 1048576,
        },
        subscribe: [
          { topic: 'base.topic', journey: 'health' },
        ],
      };

      const overrideConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'override-client',
          retry: {
            retries: 5,
          },
        },
        producer: {
          allowAutoTopicCreation: true,
          compression: 'gzip',
        },
        subscribe: [
          { topic: 'override.topic', journey: 'care' },
        ],
      };

      const mergedConfig = mergeKafkaConfigs(baseConfig, overrideConfig);

      expect(mergedConfig.client.clientId).toBe('override-client');
      expect(mergedConfig.client.brokers).toEqual(['base:9092']);
      expect(mergedConfig.client.retry?.retries).toBe(5);
      expect(mergedConfig.client.retry?.initialRetryTime).toBe(100);
      expect(mergedConfig.consumer?.groupId).toBe('base-group');
      expect(mergedConfig.producer?.compression).toBe('gzip');
      expect(mergedConfig.subscribe).toHaveLength(2);
      expect(mergedConfig.subscribe).toContainEqual({ topic: 'base.topic', journey: 'health' });
      expect(mergedConfig.subscribe).toContainEqual({ topic: 'override.topic', journey: 'care' });
    });

    it('should handle undefined sections', () => {
      const baseConfig: KafkaConfig = {
        client: {
          clientId: 'base-client',
          brokers: ['base:9092'],
        },
      };

      const overrideConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'override-client',
        },
        consumer: {
          groupId: 'override-group',
        },
      };

      const mergedConfig = mergeKafkaConfigs(baseConfig, overrideConfig);

      expect(mergedConfig.client.clientId).toBe('override-client');
      expect(mergedConfig.consumer?.groupId).toBe('override-group');
    });

    it('should handle empty subscribe arrays', () => {
      const baseConfig: KafkaConfig = {
        client: {
          clientId: 'base-client',
          brokers: ['base:9092'],
        },
      };

      const overrideConfig: Partial<KafkaConfig> = {
        client: {
          clientId: 'override-client',
        },
        subscribe: [
          { topic: 'override.topic', journey: 'care' },
        ],
      };

      const mergedConfig = mergeKafkaConfigs(baseConfig, overrideConfig);

      expect(mergedConfig.subscribe).toHaveLength(1);
      expect(mergedConfig.subscribe).toContainEqual({ topic: 'override.topic', journey: 'care' });
    });
  });

  describe('createTestKafkaConfig', () => {
    it('should create Kafka configuration for testing', () => {
      const config = createTestKafkaConfig('test-service');

      expect(config.client.clientId).toBe('test-test-service');
      expect(config.client.brokers).toEqual(['localhost:9092']);
      expect(config.consumer?.groupId).toBe('test-test-service-group');
      expect(config.producer?.allowAutoTopicCreation).toBe(true);
      expect(config.run?.autoCommit).toBe(true);
    });

    it('should configure test-specific settings', () => {
      const config = createTestKafkaConfig('test-service');

      // Test-specific settings
      expect(config.consumer?.readUncommitted).toBe(true);
      expect(config.producer?.acks).toBe(1); // Only wait for leader acknowledgement in tests
      expect(config.client.connectionTimeout).toBe(1000); // Shorter timeouts for tests
      expect(config.client.requestTimeout).toBe(5000);
      expect(config.client.retry?.retries).toBe(3); // Fewer retries for tests
    });
  });
});