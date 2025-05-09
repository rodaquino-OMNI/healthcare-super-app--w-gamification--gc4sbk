/**
 * Custom Jest test environment for Kafka-based event tests.
 * 
 * This environment manages test Kafka broker setup, topic creation, message consumption,
 * and cleanup between tests. It ensures isolated Kafka testing for parallel test execution
 * and proper cleanup after tests.
 * 
 * @module kafka-test-environment
 */

const NodeEnvironment = require('jest-environment-node');
const { v4: uuidv4 } = require('uuid');
const { Kafka } = require('kafkajs');
const debug = require('debug')('test:kafka');
const path = require('path');
const fs = require('fs');

/**
 * Default configuration for the Kafka test environment
 */
const DEFAULT_CONFIG = {
  // Default broker connection settings
  brokers: ['localhost:9092'],
  // Default timeout for Kafka operations (ms)
  operationTimeout: 5000,
  // Default connection timeout (ms)
  connectionTimeout: 3000,
  // Default topic creation timeout (ms)
  topicCreationTimeout: 10000,
  // Default topic cleanup timeout (ms)
  topicCleanupTimeout: 5000,
  // Default topic prefix for test isolation
  topicPrefix: 'test-',
  // Default consumer group prefix for test isolation
  consumerGroupPrefix: 'test-consumer-',
  // Whether to use a unique suffix for topics
  useUniqueSuffix: true,
  // Whether to clean up topics after tests
  cleanupTopics: true,
  // Whether to use an in-memory broker for testing
  useInMemoryBroker: false,
};

/**
 * Custom Jest environment for Kafka testing that provides isolated test topics
 * and automatic cleanup.
 */
class KafkaTestEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    
    // Initialize with default configuration
    this.kafkaConfig = { ...DEFAULT_CONFIG };
    
    // Override with environment variables if present
    if (process.env.KAFKA_BROKERS) {
      this.kafkaConfig.brokers = process.env.KAFKA_BROKERS.split(',');
    }
    
    if (process.env.KAFKA_TEST_OPERATION_TIMEOUT) {
      this.kafkaConfig.operationTimeout = parseInt(process.env.KAFKA_TEST_OPERATION_TIMEOUT, 10);
    }
    
    if (process.env.KAFKA_TEST_CONNECTION_TIMEOUT) {
      this.kafkaConfig.connectionTimeout = parseInt(process.env.KAFKA_TEST_CONNECTION_TIMEOUT, 10);
    }
    
    if (process.env.KAFKA_TEST_TOPIC_PREFIX) {
      this.kafkaConfig.topicPrefix = process.env.KAFKA_TEST_TOPIC_PREFIX;
    }
    
    if (process.env.KAFKA_TEST_CONSUMER_GROUP_PREFIX) {
      this.kafkaConfig.consumerGroupPrefix = process.env.KAFKA_TEST_CONSUMER_GROUP_PREFIX;
    }
    
    if (process.env.KAFKA_TEST_CLEANUP_TOPICS) {
      this.kafkaConfig.cleanupTopics = process.env.KAFKA_TEST_CLEANUP_TOPICS === 'true';
    }
    
    if (process.env.KAFKA_TEST_USE_IN_MEMORY_BROKER) {
      this.kafkaConfig.useInMemoryBroker = process.env.KAFKA_TEST_USE_IN_MEMORY_BROKER === 'true';
    }
    
    // Generate a unique suffix for this test run to isolate test topics
    this.uniqueSuffix = uuidv4().replace(/-/g, '');
    
    // Initialize collections to track resources
    this.createdTopics = new Set();
    this.consumers = new Set();
    this.producers = new Set();
    this.admin = null;
    this.kafka = null;
    
    debug('Initialized Kafka test environment with config:', this.kafkaConfig);
  }
  
  /**
   * Set up the environment before all tests run
   */
  async setup() {
    await super.setup();
    
    try {
      // Create Kafka client
      this.kafka = new Kafka({
        clientId: `test-client-${this.uniqueSuffix}`,
        brokers: this.kafkaConfig.brokers,
        connectionTimeout: this.kafkaConfig.connectionTimeout,
      });
      
      // Create admin client for topic management
      this.admin = this.kafka.admin();
      await this.admin.connect();
      
      debug('Connected to Kafka broker');
      
      // Add environment utilities to the global object for tests to use
      this.global.kafkaTestEnvironment = {
        createTopic: this.createTopic.bind(this),
        deleteTopic: this.deleteTopic.bind(this),
        createProducer: this.createProducer.bind(this),
        createConsumer: this.createConsumer.bind(this),
        getTopicName: this.getTopicName.bind(this),
        getConsumerGroupId: this.getConsumerGroupId.bind(this),
        getKafkaClient: () => this.kafka,
        getAdminClient: () => this.admin,
      };
      
      // Add journey-specific topic helpers
      this.global.kafkaTestEnvironment.topics = {
        health: this.getTopicName('health.events'),
        care: this.getTopicName('care.events'),
        plan: this.getTopicName('plan.events'),
      };
      
      debug('Kafka test environment setup complete');
    } catch (error) {
      console.error('Failed to set up Kafka test environment:', error);
      throw error;
    }
  }
  
  /**
   * Clean up the environment after all tests run
   */
  async teardown() {
    debug('Starting Kafka test environment teardown');
    
    try {
      // Disconnect all consumers
      for (const consumer of this.consumers) {
        try {
          await consumer.disconnect();
          debug('Disconnected consumer');
        } catch (error) {
          debug('Error disconnecting consumer:', error.message);
        }
      }
      
      // Disconnect all producers
      for (const producer of this.producers) {
        try {
          await producer.disconnect();
          debug('Disconnected producer');
        } catch (error) {
          debug('Error disconnecting producer:', error.message);
        }
      }
      
      // Clean up created topics if configured to do so
      if (this.kafkaConfig.cleanupTopics && this.admin) {
        for (const topic of this.createdTopics) {
          try {
            await this.admin.deleteTopics({
              topics: [topic],
              timeout: this.kafkaConfig.topicCleanupTimeout,
            });
            debug(`Deleted topic: ${topic}`);
          } catch (error) {
            debug(`Error deleting topic ${topic}:`, error.message);
          }
        }
      }
      
      // Disconnect admin client
      if (this.admin) {
        try {
          await this.admin.disconnect();
          debug('Disconnected admin client');
        } catch (error) {
          debug('Error disconnecting admin client:', error.message);
        }
      }
      
      // Clear collections
      this.createdTopics.clear();
      this.consumers.clear();
      this.producers.clear();
      this.admin = null;
      this.kafka = null;
      
      debug('Kafka test environment teardown complete');
    } catch (error) {
      console.error('Error during Kafka test environment teardown:', error);
    }
    
    await super.teardown();
  }
  
  /**
   * Creates a test topic with the given base name
   * 
   * @param {string} baseName - Base name for the topic
   * @param {Object} [options] - Topic creation options
   * @param {number} [options.partitions=1] - Number of partitions
   * @param {number} [options.replicationFactor=1] - Replication factor
   * @returns {Promise<string>} The full topic name
   */
  async createTopic(baseName, options = {}) {
    const topicName = this.getTopicName(baseName);
    
    try {
      await this.admin.createTopics({
        topics: [
          {
            topic: topicName,
            numPartitions: options.partitions || 1,
            replicationFactor: options.replicationFactor || 1,
            configEntries: options.configEntries || [],
          },
        ],
        timeout: this.kafkaConfig.topicCreationTimeout,
      });
      
      this.createdTopics.add(topicName);
      debug(`Created topic: ${topicName}`);
      
      return topicName;
    } catch (error) {
      // If topic already exists, just return the name
      if (error.message.includes('already exists')) {
        debug(`Topic ${topicName} already exists, using existing topic`);
        this.createdTopics.add(topicName);
        return topicName;
      }
      
      console.error(`Failed to create topic ${topicName}:`, error);
      throw error;
    }
  }
  
  /**
   * Deletes a test topic
   * 
   * @param {string} topicName - Name of the topic to delete
   * @returns {Promise<void>}
   */
  async deleteTopic(topicName) {
    try {
      await this.admin.deleteTopics({
        topics: [topicName],
        timeout: this.kafkaConfig.topicCleanupTimeout,
      });
      
      this.createdTopics.delete(topicName);
      debug(`Deleted topic: ${topicName}`);
    } catch (error) {
      console.error(`Failed to delete topic ${topicName}:`, error);
      throw error;
    }
  }
  
  /**
   * Creates a Kafka producer for tests
   * 
   * @param {Object} [options] - Producer options
   * @returns {Promise<Object>} The producer instance
   */
  async createProducer(options = {}) {
    const producer = this.kafka.producer(options);
    await producer.connect();
    
    this.producers.add(producer);
    debug('Created producer');
    
    return producer;
  }
  
  /**
   * Creates a Kafka consumer for tests
   * 
   * @param {Object} [options] - Consumer options
   * @param {string} [options.groupId] - Consumer group ID
   * @returns {Promise<Object>} The consumer instance
   */
  async createConsumer(options = {}) {
    const groupId = options.groupId || this.getConsumerGroupId();
    const consumer = this.kafka.consumer({
      groupId,
      ...options,
    });
    
    await consumer.connect();
    this.consumers.add(consumer);
    debug(`Created consumer with group ID: ${groupId}`);
    
    return consumer;
  }
  
  /**
   * Generates a unique topic name for tests
   * 
   * @param {string} baseName - Base name for the topic
   * @returns {string} The full topic name with prefix and suffix
   */
  getTopicName(baseName) {
    if (this.kafkaConfig.useUniqueSuffix) {
      return `${this.kafkaConfig.topicPrefix}${baseName}-${this.uniqueSuffix}`;
    }
    
    return `${this.kafkaConfig.topicPrefix}${baseName}`;
  }
  
  /**
   * Generates a unique consumer group ID for tests
   * 
   * @param {string} [baseName] - Optional base name for the consumer group
   * @returns {string} The full consumer group ID with prefix and suffix
   */
  getConsumerGroupId(baseName = 'group') {
    return `${this.kafkaConfig.consumerGroupPrefix}${baseName}-${this.uniqueSuffix}`;
  }
  
  /**
   * Runs a function before each test
   */
  async handleTestEvent(event) {
    if (event.name === 'test_start') {
      debug(`Starting test: ${event.test.name}`);
    } else if (event.name === 'test_done') {
      debug(`Completed test: ${event.test.name}`);
    }
    
    // Pass the event to the parent class
    await super.handleTestEvent(event);
  }
}

module.exports = KafkaTestEnvironment;