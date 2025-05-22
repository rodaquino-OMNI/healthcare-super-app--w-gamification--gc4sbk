/**
 * Custom Jest test environment for Kafka-based event tests.
 * 
 * This environment provides isolated Kafka testing capabilities without requiring
 * an external Kafka broker. It manages test topic creation, message consumption,
 * and cleanup between tests to ensure proper isolation for parallel test execution.
 */

const NodeEnvironment = require('jest-environment-node');
const { v4: uuidv4 } = require('uuid');
const { EventEmitter } = require('events');

/**
 * In-memory Kafka broker simulation for testing.
 * Handles topics, messages, and consumer groups without external dependencies.
 */
class InMemoryKafkaBroker {
  constructor() {
    this.topics = new Map(); // topic name -> messages
    this.consumerGroups = new Map(); // groupId -> { topic, offset }
    this.eventEmitter = new EventEmitter();
    
    // Increase max listeners to avoid warnings when many tests run in parallel
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * Creates a new topic if it doesn't exist
   * @param {string} topicName - Name of the topic to create
   * @returns {boolean} - True if topic was created, false if it already existed
   */
  createTopic(topicName) {
    if (!this.topics.has(topicName)) {
      this.topics.set(topicName, []);
      return true;
    }
    return false;
  }

  /**
   * Deletes a topic and all its messages
   * @param {string} topicName - Name of the topic to delete
   * @returns {boolean} - True if topic was deleted, false if it didn't exist
   */
  deleteTopic(topicName) {
    return this.topics.delete(topicName);
  }

  /**
   * Produces a message to a topic
   * @param {string} topicName - Name of the topic
   * @param {Object} message - Message to produce
   * @param {string} [key] - Optional message key
   * @returns {Promise<number>} - Promise resolving to the offset of the produced message
   */
  async produceMessage(topicName, message, key = null) {
    if (!this.topics.has(topicName)) {
      this.createTopic(topicName);
    }
    
    const messages = this.topics.get(topicName);
    const offset = messages.length;
    
    const kafkaMessage = {
      offset,
      key: key,
      value: message,
      timestamp: Date.now(),
      headers: {},
      partition: 0
    };
    
    messages.push(kafkaMessage);
    
    // Emit event for any active consumers
    this.eventEmitter.emit(`message:${topicName}`, kafkaMessage);
    
    return offset;
  }

  /**
   * Consumes messages from a topic
   * @param {string} topicName - Name of the topic
   * @param {string} groupId - Consumer group ID
   * @param {Object} options - Consumption options
   * @param {boolean} [options.fromBeginning=false] - Whether to consume from the beginning
   * @param {Function} messageHandler - Function to handle consumed messages
   * @returns {Function} - Function to stop consuming
   */
  consumeMessages(topicName, groupId, options = {}, messageHandler) {
    const { fromBeginning = false } = options;
    
    if (!this.topics.has(topicName)) {
      this.createTopic(topicName);
    }
    
    // Initialize consumer group offset tracking
    if (!this.consumerGroups.has(groupId)) {
      this.consumerGroups.set(groupId, new Map());
    }
    
    const groupOffsets = this.consumerGroups.get(groupId);
    if (!groupOffsets.has(topicName)) {
      groupOffsets.set(topicName, fromBeginning ? 0 : this.topics.get(topicName).length);
    }
    
    // Process existing messages if consuming from beginning
    if (fromBeginning) {
      const currentOffset = groupOffsets.get(topicName);
      const messages = this.topics.get(topicName);
      
      for (let i = currentOffset; i < messages.length; i++) {
        messageHandler(messages[i]);
        groupOffsets.set(topicName, i + 1);
      }
    }
    
    // Set up listener for new messages
    const messageListener = (message) => {
      const currentOffset = groupOffsets.get(topicName);
      
      if (message.offset >= currentOffset) {
        messageHandler(message);
        groupOffsets.set(topicName, message.offset + 1);
      }
    };
    
    this.eventEmitter.on(`message:${topicName}`, messageListener);
    
    // Return function to stop consuming
    return () => {
      this.eventEmitter.removeListener(`message:${topicName}`, messageListener);
    };
  }

  /**
   * Commits offsets for a consumer group
   * @param {string} groupId - Consumer group ID
   * @param {Array<{topic: string, partition: number, offset: number}>} offsets - Offsets to commit
   */
  commitOffsets(groupId, offsets) {
    if (!this.consumerGroups.has(groupId)) {
      this.consumerGroups.set(groupId, new Map());
    }
    
    const groupOffsets = this.consumerGroups.get(groupId);
    
    for (const { topic, offset } of offsets) {
      groupOffsets.set(topic, offset);
    }
  }

  /**
   * Gets the current offset for a consumer group and topic
   * @param {string} groupId - Consumer group ID
   * @param {string} topicName - Topic name
   * @returns {number} - Current offset, or 0 if not set
   */
  getOffset(groupId, topicName) {
    if (!this.consumerGroups.has(groupId)) {
      return 0;
    }
    
    const groupOffsets = this.consumerGroups.get(groupId);
    return groupOffsets.has(topicName) ? groupOffsets.get(topicName) : 0;
  }

  /**
   * Clears all topics and consumer groups
   */
  clear() {
    this.topics.clear();
    this.consumerGroups.clear();
    this.eventEmitter.removeAllListeners();
  }
}

/**
 * Custom Jest test environment for Kafka testing.
 * Extends the Node environment and adds Kafka-specific functionality.
 */
class KafkaTestEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    
    // Generate a unique ID for this test environment instance
    this.environmentId = uuidv4();
    
    // Create the in-memory Kafka broker
    this.kafkaBroker = new InMemoryKafkaBroker();
    
    // Track created topics for cleanup
    this.testTopics = new Set();
    
    // Track active consumers for cleanup
    this.activeConsumers = new Map();
  }

  /**
   * Setup the test environment
   */
  async setup() {
    await super.setup();
    
    // Add Kafka-specific globals to the test environment
    this.global.kafkaTestEnvironment = {
      /**
       * Creates a unique topic name for the current test
       * @param {string} baseName - Base name for the topic
       * @returns {string} - Unique topic name
       */
      createTestTopicName: (baseName) => {
        const topicName = `${baseName}-${this.environmentId}-${Date.now()}`;
        this.testTopics.add(topicName);
        this.kafkaBroker.createTopic(topicName);
        return topicName;
      },
      
      /**
       * Produces a message to a topic
       * @param {string} topicName - Name of the topic
       * @param {Object} message - Message to produce
       * @param {string} [key] - Optional message key
       * @returns {Promise<number>} - Promise resolving to the offset of the produced message
       */
      produceMessage: (topicName, message, key) => {
        return this.kafkaBroker.produceMessage(topicName, message, key);
      },
      
      /**
       * Consumes messages from a topic
       * @param {string} topicName - Name of the topic
       * @param {string} groupId - Consumer group ID
       * @param {Object} options - Consumption options
       * @param {Function} messageHandler - Function to handle consumed messages
       * @returns {string} - Consumer ID that can be used to stop consuming
       */
      consumeMessages: (topicName, groupId, options, messageHandler) => {
        const consumerId = uuidv4();
        const stopFn = this.kafkaBroker.consumeMessages(topicName, groupId, options, messageHandler);
        this.activeConsumers.set(consumerId, stopFn);
        return consumerId;
      },
      
      /**
       * Stops consuming messages
       * @param {string} consumerId - Consumer ID returned from consumeMessages
       */
      stopConsuming: (consumerId) => {
        if (this.activeConsumers.has(consumerId)) {
          const stopFn = this.activeConsumers.get(consumerId);
          stopFn();
          this.activeConsumers.delete(consumerId);
        }
      },
      
      /**
       * Commits offsets for a consumer group
       * @param {string} groupId - Consumer group ID
       * @param {Array<{topic: string, partition: number, offset: number}>} offsets - Offsets to commit
       */
      commitOffsets: (groupId, offsets) => {
        this.kafkaBroker.commitOffsets(groupId, offsets);
      },
      
      /**
       * Gets the current offset for a consumer group and topic
       * @param {string} groupId - Consumer group ID
       * @param {string} topicName - Topic name
       * @returns {number} - Current offset
       */
      getOffset: (groupId, topicName) => {
        return this.kafkaBroker.getOffset(groupId, topicName);
      },
      
      /**
       * Waits for a specific number of messages to be produced to a topic
       * @param {string} topicName - Name of the topic
       * @param {number} count - Number of messages to wait for
       * @param {number} [timeout=5000] - Timeout in milliseconds
       * @returns {Promise<Array>} - Promise resolving to the messages
       */
      waitForMessages: async (topicName, count, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const messages = [];
          const consumerId = uuidv4();
          
          const timeoutId = setTimeout(() => {
            this.activeConsumers.get(consumerId)();
            this.activeConsumers.delete(consumerId);
            reject(new Error(`Timeout waiting for ${count} messages on topic ${topicName}`));
          }, timeout);
          
          const stopFn = this.kafkaBroker.consumeMessages(
            topicName,
            `wait-group-${consumerId}`,
            { fromBeginning: true },
            (message) => {
              messages.push(message);
              
              if (messages.length >= count) {
                clearTimeout(timeoutId);
                stopFn();
                this.activeConsumers.delete(consumerId);
                resolve(messages);
              }
            }
          );
          
          this.activeConsumers.set(consumerId, stopFn);
        });
      },
      
      /**
       * Validates that the Kafka test environment is properly set up
       * @returns {Promise<boolean>} - Promise resolving to true if valid
       */
      validateEnvironment: async () => {
        try {
          // Create a test topic
          const testTopic = `validation-${uuidv4()}`;
          this.testTopics.add(testTopic);
          this.kafkaBroker.createTopic(testTopic);
          
          // Produce a test message
          const testMessage = { test: 'validation', timestamp: Date.now() };
          await this.kafkaBroker.produceMessage(testTopic, testMessage);
          
          // Consume the test message
          const messages = await this.global.kafkaTestEnvironment.waitForMessages(testTopic, 1, 1000);
          
          // Verify the message was consumed correctly
          return messages.length === 1 && 
                 messages[0].value.test === 'validation' && 
                 messages[0].value.timestamp === testMessage.timestamp;
        } catch (error) {
          console.error('Kafka test environment validation failed:', error);
          return false;
        }
      }
    };
  }

  /**
   * Teardown the test environment
   */
  async teardown() {
    // Stop all active consumers
    for (const stopFn of this.activeConsumers.values()) {
      stopFn();
    }
    this.activeConsumers.clear();
    
    // Delete all test topics
    for (const topicName of this.testTopics) {
      this.kafkaBroker.deleteTopic(topicName);
    }
    this.testTopics.clear();
    
    await super.teardown();
  }

  /**
   * Run a script in the context of the test environment
   */
  async runScript(script) {
    return super.runScript(script);
  }
}

module.exports = KafkaTestEnvironment;