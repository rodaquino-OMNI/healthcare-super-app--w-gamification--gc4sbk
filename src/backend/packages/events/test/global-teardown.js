/**
 * Global teardown script for event tests.
 * 
 * This script is executed after all tests have completed and is responsible for:
 * - Disconnecting Kafka clients
 * - Removing test topics
 * - Cleaning up Docker containers
 * - Releasing system resources
 */

// Import required modules
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Constants
const KAFKA_CONTAINER_NAME_PREFIX = 'kafka-test';
const ZOOKEEPER_CONTAINER_NAME_PREFIX = 'zookeeper-test';
const KAFKA_CLIENT_REGISTRY_PATH = path.join(process.cwd(), '.kafka-clients-registry.json');

/**
 * Logs a message with a timestamp
 * @param {string} message - The message to log
 */
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Teardown] ${message}`);
}

/**
 * Disconnects all registered Kafka clients
 */
async function disconnectKafkaClients() {
  try {
    if (!fs.existsSync(KAFKA_CLIENT_REGISTRY_PATH)) {
      log('No Kafka client registry found, skipping client disconnection');
      return;
    }

    const registry = JSON.parse(fs.readFileSync(KAFKA_CLIENT_REGISTRY_PATH, 'utf8'));
    log(`Found ${registry.length} Kafka clients to disconnect`);

    // The registry contains client IDs that were registered during tests
    // We need to call the global disconnection function that was registered for each client
    if (global.__KAFKA_DISCONNECT_CALLBACKS__ && Array.isArray(global.__KAFKA_DISCONNECT_CALLBACKS__)) {
      log(`Executing ${global.__KAFKA_DISCONNECT_CALLBACKS__.length} disconnect callbacks`);
      
      for (const callback of global.__KAFKA_DISCONNECT_CALLBACKS__) {
        if (typeof callback === 'function') {
          try {
            await callback();
          } catch (error) {
            log(`Error disconnecting Kafka client: ${error.message}`);
          }
        }
      }
    }

    // Clean up the registry file
    fs.unlinkSync(KAFKA_CLIENT_REGISTRY_PATH);
    log('Removed Kafka client registry');
  } catch (error) {
    log(`Error disconnecting Kafka clients: ${error.message}`);
  }
}

/**
 * Removes test topics from Kafka
 */
function removeTestTopics() {
  try {
    // Check if Kafka container is running
    const containerCheck = execSync('docker ps -q -f name=' + KAFKA_CONTAINER_NAME_PREFIX).toString().trim();
    
    if (!containerCheck) {
      log('No Kafka container found, skipping topic removal');
      return;
    }

    // Get list of test topics
    log('Listing test topics...');
    const listTopicsCmd = `docker exec ${KAFKA_CONTAINER_NAME_PREFIX} kafka-topics --list --bootstrap-server localhost:9092`;
    const topics = execSync(listTopicsCmd).toString().trim().split('\n');
    const testTopics = topics.filter(topic => topic.startsWith('test-'));
    
    if (testTopics.length === 0) {
      log('No test topics found');
      return;
    }
    
    log(`Found ${testTopics.length} test topics to remove`);
    
    // Delete each test topic
    for (const topic of testTopics) {
      log(`Removing topic: ${topic}`);
      const deleteTopicCmd = `docker exec ${KAFKA_CONTAINER_NAME_PREFIX} kafka-topics --delete --topic ${topic} --bootstrap-server localhost:9092`;
      execSync(deleteTopicCmd);
    }
    
    log('All test topics removed successfully');
  } catch (error) {
    log(`Error removing test topics: ${error.message}`);
  }
}

/**
 * Stops and removes Docker containers used for testing
 */
function cleanupDockerContainers() {
  try {
    log('Cleaning up Docker containers...');
    
    // Check for Kafka container
    const kafkaContainer = execSync(`docker ps -a -q -f name=${KAFKA_CONTAINER_NAME_PREFIX}`).toString().trim();
    if (kafkaContainer) {
      log(`Stopping and removing Kafka container: ${KAFKA_CONTAINER_NAME_PREFIX}`);
      execSync(`docker stop ${KAFKA_CONTAINER_NAME_PREFIX}`);
      execSync(`docker rm ${KAFKA_CONTAINER_NAME_PREFIX}`);
    }
    
    // Check for ZooKeeper container
    const zookeeperContainer = execSync(`docker ps -a -q -f name=${ZOOKEEPER_CONTAINER_NAME_PREFIX}`).toString().trim();
    if (zookeeperContainer) {
      log(`Stopping and removing ZooKeeper container: ${ZOOKEEPER_CONTAINER_NAME_PREFIX}`);
      execSync(`docker stop ${ZOOKEEPER_CONTAINER_NAME_PREFIX}`);
      execSync(`docker rm ${ZOOKEEPER_CONTAINER_NAME_PREFIX}`);
    }
    
    log('Docker containers cleaned up successfully');
  } catch (error) {
    log(`Error cleaning up Docker containers: ${error.message}`);
  }
}

/**
 * Cleans up any temporary files created during testing
 */
function cleanupTempFiles() {
  try {
    const tempDir = path.join(process.cwd(), '.tmp');
    if (fs.existsSync(tempDir)) {
      log(`Removing temporary directory: ${tempDir}`);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    // Clean up any other temp files that might have been created
    const testLogFile = path.join(process.cwd(), 'kafka-test.log');
    if (fs.existsSync(testLogFile)) {
      log(`Removing test log file: ${testLogFile}`);
      fs.unlinkSync(testLogFile);
    }
  } catch (error) {
    log(`Error cleaning up temporary files: ${error.message}`);
  }
}

/**
 * Main teardown function
 */
module.exports = async () => {
  log('Starting global teardown for event tests...');
  
  try {
    // Disconnect Kafka clients first to ensure clean shutdown
    await disconnectKafkaClients();
    
    // Remove test topics
    removeTestTopics();
    
    // Clean up Docker containers
    cleanupDockerContainers();
    
    // Clean up temporary files
    cleanupTempFiles();
    
    // Reset global variables
    if (global.__KAFKA_DISCONNECT_CALLBACKS__) {
      global.__KAFKA_DISCONNECT_CALLBACKS__ = [];
    }
    
    log('Global teardown completed successfully');
  } catch (error) {
    log(`Error during global teardown: ${error.message}`);
    log(error.stack);
    // Don't throw the error to prevent test failures due to teardown issues
    // But exit with a non-zero code if this is a CI environment
    if (process.env.CI === 'true') {
      process.exit(1);
    }
  }
};