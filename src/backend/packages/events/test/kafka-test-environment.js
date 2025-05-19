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
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Constants
const KAFKA_CONTAINER_NAME_PREFIX = 'kafka-test';
const ZOOKEEPER_CONTAINER_NAME_PREFIX = 'zookeeper-test';
const KAFKA_CLIENT_REGISTRY_PATH = path.join(process.cwd(), '.kafka-clients-registry.json');
const DEFAULT_KAFKA_PORT = 9092;
const DEFAULT_ZOOKEEPER_PORT = 2181;

/**
 * Custom Jest test environment for Kafka testing.
 * Extends the Node environment to provide Kafka-specific functionality.
 */
class KafkaTestEnvironment extends NodeEnvironment {
  /**
   * Constructor for the Kafka test environment.
   * 
   * @param {Object} config - Jest configuration
   * @param {Object} context - Test context information
   */
  constructor(config, context) {
    super(config, context);
    
    // Generate a unique ID for this test environment instance
    this.environmentId = uuidv4();
    
    // Extract test-specific configuration
    const { testEnvironmentOptions = {} } = config.projectConfig || {};
    
    // Set up Kafka configuration
    this.kafkaConfig = {
      brokerPort: testEnvironmentOptions.kafkaBrokerPort || DEFAULT_KAFKA_PORT,
      zookeeperPort: testEnvironmentOptions.zookeeperPort || DEFAULT_ZOOKEEPER_PORT,
      topicPrefix: testEnvironmentOptions.topicPrefix || 'test',
      autoCreateTopics: testEnvironmentOptions.autoCreateTopics !== false,
      cleanupTopics: testEnvironmentOptions.cleanupTopics !== false,
      ...testEnvironmentOptions.kafka,
    };
    
    // Initialize topic registry
    this.topics = new Set();
    
    // Initialize client registry
    this.clients = new Set();
    
    // Log initialization
    this.log(`Initialized Kafka test environment with ID: ${this.environmentId}`);
  }
  
  /**
   * Set up the Kafka test environment before running tests.
   * This method is called automatically by Jest before each test file.
   */
  async setup() {
    // Call the parent setup method first
    await super.setup();
    
    try {
      // Ensure Kafka container is running
      await this.ensureKafkaIsRunning();
      
      // Set up global variables for the test environment
      this.global.__KAFKA_ENV__ = this.environmentId;
      this.global.__KAFKA_BROKER__ = `localhost:${this.kafkaConfig.brokerPort}`;
      
      // Set up helper methods in the global scope
      this.global.createTestTopic = this.createTestTopic.bind(this);
      this.global.deleteTestTopic = this.deleteTestTopic.bind(this);
      this.global.registerKafkaClient = this.registerKafkaClient.bind(this);
      
      // Register disconnect callback for cleanup
      if (!global.__KAFKA_DISCONNECT_CALLBACKS__) {
        global.__KAFKA_DISCONNECT_CALLBACKS__ = [];
      }
      
      // Add this environment's disconnect callback
      global.__KAFKA_DISCONNECT_CALLBACKS__.push(async () => {
        await this.disconnectAllClients();
      });
      
      this.log('Kafka test environment setup complete');
    } catch (error) {
      this.log(`Error setting up Kafka test environment: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Clean up the Kafka test environment after running tests.
   * This method is called automatically by Jest after each test file.
   */
  async teardown() {
    try {
      this.log('Starting Kafka test environment teardown');
      
      // Clean up all topics created by this environment
      if (this.kafkaConfig.cleanupTopics) {
        await this.cleanupTopics();
      }
      
      // Disconnect all clients registered by this environment
      await this.disconnectAllClients();
      
      // Remove this environment's disconnect callback
      if (global.__KAFKA_DISCONNECT_CALLBACKS__) {
        const index = global.__KAFKA_DISCONNECT_CALLBACKS__.findIndex(
          callback => callback.environmentId === this.environmentId
        );
        if (index !== -1) {
          global.__KAFKA_DISCONNECT_CALLBACKS__.splice(index, 1);
        }
      }
      
      this.log('Kafka test environment teardown complete');
    } catch (error) {
      this.log(`Error during Kafka test environment teardown: ${error.message}`);
      // Don't throw the error to prevent test failures due to teardown issues
    } finally {
      // Always call the parent teardown method
      await super.teardown();
    }
  }
  
  /**
   * Ensures that Kafka and ZooKeeper containers are running.
   * If they're not running, it will start them.
   */
  async ensureKafkaIsRunning() {
    try {
      // Check if Kafka container is already running
      const kafkaRunning = this.isContainerRunning(KAFKA_CONTAINER_NAME_PREFIX);
      const zookeeperRunning = this.isContainerRunning(ZOOKEEPER_CONTAINER_NAME_PREFIX);
      
      if (kafkaRunning && zookeeperRunning) {
        this.log('Kafka and ZooKeeper containers are already running');
        return;
      }
      
      // Start ZooKeeper if not running
      if (!zookeeperRunning) {
        this.log('Starting ZooKeeper container...');
        execSync(`
          docker run -d \
            --name ${ZOOKEEPER_CONTAINER_NAME_PREFIX} \
            -p ${this.kafkaConfig.zookeeperPort}:2181 \
            -e ZOOKEEPER_CLIENT_PORT=2181 \
            confluentinc/cp-zookeeper:latest
        `);
        this.log('ZooKeeper container started');
      }
      
      // Start Kafka if not running
      if (!kafkaRunning) {
        this.log('Starting Kafka container...');
        execSync(`
          docker run -d \
            --name ${KAFKA_CONTAINER_NAME_PREFIX} \
            -p ${this.kafkaConfig.brokerPort}:9092 \
            -e KAFKA_ZOOKEEPER_CONNECT=${ZOOKEEPER_CONTAINER_NAME_PREFIX}:2181 \
            -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:${this.kafkaConfig.brokerPort} \
            -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
            -e KAFKA_AUTO_CREATE_TOPICS_ENABLE=${this.kafkaConfig.autoCreateTopics} \
            --link ${ZOOKEEPER_CONTAINER_NAME_PREFIX}:zookeeper \
            confluentinc/cp-kafka:latest
        `);
        this.log('Kafka container started');
        
        // Wait for Kafka to be ready
        this.log('Waiting for Kafka to be ready...');
        await this.waitForKafkaReady();
        this.log('Kafka is ready');
      }
    } catch (error) {
      this.log(`Error ensuring Kafka is running: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Checks if a Docker container is running.
   * 
   * @param {string} containerNamePrefix - The prefix of the container name
   * @returns {boolean} - True if the container is running, false otherwise
   */
  isContainerRunning(containerNamePrefix) {
    try {
      const result = execSync(`docker ps -q -f name=${containerNamePrefix}`).toString().trim();
      return result !== '';
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Waits for Kafka to be ready by checking if it's possible to list topics.
   * Retries several times with increasing delays.
   */
  async waitForKafkaReady() {
    const maxRetries = 10;
    const initialDelay = 1000; // 1 second
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        execSync(`docker exec ${KAFKA_CONTAINER_NAME_PREFIX} kafka-topics --list --bootstrap-server localhost:9092`);
        return; // Success
      } catch (error) {
        const delay = initialDelay * Math.pow(1.5, i); // Exponential backoff
        this.log(`Kafka not ready yet, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw new Error('Kafka failed to become ready in the allocated time');
  }
  
  /**
   * Creates a test topic with a unique name.
   * 
   * @param {string} baseName - Base name for the topic
   * @param {Object} options - Topic creation options
   * @param {number} options.partitions - Number of partitions (default: 1)
   * @param {number} options.replicationFactor - Replication factor (default: 1)
   * @returns {string} - The full name of the created topic
   */
  createTestTopic(baseName, options = {}) {
    const { partitions = 1, replicationFactor = 1 } = options;
    
    // Generate a unique topic name
    const uniqueId = uuidv4().substring(0, 8);
    const topicName = `${this.kafkaConfig.topicPrefix}-${baseName}-${uniqueId}`;
    
    try {
      // Create the topic
      execSync(`
        docker exec ${KAFKA_CONTAINER_NAME_PREFIX} \
        kafka-topics --create \
        --topic ${topicName} \
        --partitions ${partitions} \
        --replication-factor ${replicationFactor} \
        --bootstrap-server localhost:9092
      `);
      
      // Register the topic for cleanup
      this.topics.add(topicName);
      
      this.log(`Created test topic: ${topicName}`);
      return topicName;
    } catch (error) {
      this.log(`Error creating test topic: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Deletes a test topic.
   * 
   * @param {string} topicName - Name of the topic to delete
   */
  deleteTestTopic(topicName) {
    try {
      // Delete the topic
      execSync(`
        docker exec ${KAFKA_CONTAINER_NAME_PREFIX} \
        kafka-topics --delete \
        --topic ${topicName} \
        --bootstrap-server localhost:9092
      `);
      
      // Remove the topic from the registry
      this.topics.delete(topicName);
      
      this.log(`Deleted test topic: ${topicName}`);
    } catch (error) {
      this.log(`Error deleting test topic: ${error.message}`);
      // Don't throw the error to prevent test failures due to cleanup issues
    }
  }
  
  /**
   * Cleans up all topics created by this environment.
   */
  async cleanupTopics() {
    this.log(`Cleaning up ${this.topics.size} test topics...`);
    
    for (const topicName of this.topics) {
      this.deleteTestTopic(topicName);
    }
    
    this.topics.clear();
    this.log('Topic cleanup complete');
  }
  
  /**
   * Registers a Kafka client for cleanup.
   * 
   * @param {Object} client - The Kafka client to register
   * @param {Function} disconnectFn - Function to call to disconnect the client
   */
  registerKafkaClient(client, disconnectFn) {
    const clientId = client.clientId || uuidv4();
    
    this.clients.add({
      id: clientId,
      client,
      disconnect: disconnectFn,
    });
    
    // Also register in the global registry for global teardown
    this.updateGlobalClientRegistry(clientId, true);
    
    this.log(`Registered Kafka client: ${clientId}`);
    return clientId;
  }
  
  /**
   * Disconnects all Kafka clients registered by this environment.
   */
  async disconnectAllClients() {
    this.log(`Disconnecting ${this.clients.size} Kafka clients...`);
    
    const disconnectPromises = [];
    
    for (const { id, disconnect } of this.clients) {
      try {
        disconnectPromises.push(disconnect());
        this.updateGlobalClientRegistry(id, false);
      } catch (error) {
        this.log(`Error disconnecting client ${id}: ${error.message}`);
      }
    }
    
    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.log('All Kafka clients disconnected');
  }
  
  /**
   * Updates the global client registry file.
   * 
   * @param {string} clientId - ID of the client
   * @param {boolean} add - Whether to add or remove the client
   */
  updateGlobalClientRegistry(clientId, add) {
    try {
      let registry = [];
      
      // Read existing registry if it exists
      if (fs.existsSync(KAFKA_CLIENT_REGISTRY_PATH)) {
        registry = JSON.parse(fs.readFileSync(KAFKA_CLIENT_REGISTRY_PATH, 'utf8'));
      }
      
      if (add) {
        // Add client if not already in registry
        if (!registry.includes(clientId)) {
          registry.push(clientId);
        }
      } else {
        // Remove client from registry
        registry = registry.filter(id => id !== clientId);
      }
      
      // Write updated registry
      fs.writeFileSync(KAFKA_CLIENT_REGISTRY_PATH, JSON.stringify(registry), 'utf8');
    } catch (error) {
      this.log(`Error updating global client registry: ${error.message}`);
      // Don't throw the error to prevent test failures due to registry issues
    }
  }
  
  /**
   * Logs a message with a timestamp and environment ID.
   * 
   * @param {string} message - The message to log
   */
  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [KafkaEnv:${this.environmentId.substring(0, 8)}] ${message}`);
  }
  
  /**
   * Executes a script in the test environment.
   * Required by the Jest NodeEnvironment interface.
   * 
   * @param {Object} script - The script to run
   * @returns {*} - The result of the script execution
   */
  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = KafkaTestEnvironment;