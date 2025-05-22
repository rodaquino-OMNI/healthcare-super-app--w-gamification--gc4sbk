/**
 * Global teardown script for event tests.
 * 
 * This script ensures proper cleanup of test resources after all tests have completed.
 * It disconnects Kafka connections, removes test topics, and releases any system resources
 * allocated during tests to prevent resource leaks and ensure complete test isolation
 * between test runs.
 */

// Import required modules
const { Kafka } = require('kafkajs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Constants for Kafka configuration
const KAFKA_TEST_CLIENT_ID = 'austa-test-teardown';
const KAFKA_TEST_TOPIC_PREFIX = 'test-';
const KAFKA_TEST_BROKER = process.env.KAFKA_TEST_BROKER || 'localhost:9092';

/**
 * Utility function to execute shell commands and log output
 * @param {string} command - The shell command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeCommand(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr) {
      console.warn(`Command warning: ${stderr}`);
    }
    return stdout.trim();
  } catch (error) {
    console.error(`Command failed: ${error.message}`);
    return '';
  }
}

/**
 * Disconnects all Kafka clients created during testing
 * @returns {Promise<void>}
 */
async function disconnectKafkaClients() {
  try {
    console.log('Disconnecting Kafka test clients...');
    
    // Create a new admin client for cleanup operations
    const kafka = new Kafka({
      clientId: KAFKA_TEST_CLIENT_ID,
      brokers: [KAFKA_TEST_BROKER],
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    });
    
    const admin = kafka.admin();
    await admin.connect();
    
    // List all topics
    const topics = await admin.listTopics();
    
    // Filter test topics (those with the test prefix)
    const testTopics = topics.filter(topic => topic.startsWith(KAFKA_TEST_TOPIC_PREFIX));
    
    if (testTopics.length > 0) {
      console.log(`Found ${testTopics.length} test topics to clean up: ${testTopics.join(', ')}`);
      
      // Delete all test topics
      await admin.deleteTopics({
        topics: testTopics,
        timeout: 5000
      });
      
      console.log('Successfully deleted test topics');
    } else {
      console.log('No test topics found to clean up');
    }
    
    // Disconnect admin client
    await admin.disconnect();
    console.log('Kafka admin client disconnected');
    
  } catch (error) {
    console.error(`Error disconnecting Kafka clients: ${error.message}`);
    // Continue with teardown even if there's an error
  }
}

/**
 * Cleans up Docker containers used for Kafka testing
 * @returns {Promise<void>}
 */
async function cleanupDockerContainers() {
  try {
    console.log('Checking for test Docker containers to clean up...');
    
    // Find containers with the test label
    const containersOutput = await executeCommand('docker ps -a --filter "label=austa-test=true" --format "{{.ID}}"');
    
    if (containersOutput) {
      const containerIds = containersOutput.split('\n').filter(Boolean);
      
      if (containerIds.length > 0) {
        console.log(`Found ${containerIds.length} test containers to clean up`);
        
        // Stop containers first
        await executeCommand(`docker stop ${containerIds.join(' ')}`);
        console.log('Stopped test containers');
        
        // Remove containers
        await executeCommand(`docker rm ${containerIds.join(' ')}`);
        console.log('Removed test containers');
      } else {
        console.log('No test containers found to clean up');
      }
    } else {
      console.log('No test containers found to clean up');
    }
  } catch (error) {
    console.error(`Error cleaning up Docker containers: ${error.message}`);
    // Continue with teardown even if there's an error
  }
}

/**
 * Validates that the test environment is properly cleaned up
 * @returns {Promise<void>}
 */
async function validateCleanup() {
  try {
    console.log('Validating test environment cleanup...');
    
    // Check for any remaining Kafka connections
    const kafkaProcesses = await executeCommand('ps aux | grep kafka | grep -v grep | wc -l');
    if (parseInt(kafkaProcesses, 10) > 0) {
      console.warn(`Warning: ${kafkaProcesses} Kafka-related processes still running after cleanup`);
    } else {
      console.log('No lingering Kafka processes found');
    }
    
    // Check for any remaining test containers
    const remainingContainers = await executeCommand('docker ps -a --filter "label=austa-test=true" --format "{{.ID}}" | wc -l');
    if (parseInt(remainingContainers, 10) > 0) {
      console.warn(`Warning: ${remainingContainers} test containers still present after cleanup`);
    } else {
      console.log('No lingering test containers found');
    }
    
    console.log('Cleanup validation completed');
  } catch (error) {
    console.error(`Error validating cleanup: ${error.message}`);
    // Continue with teardown even if there's an error
  }
}

/**
 * Main teardown function that orchestrates the cleanup process
 * @returns {Promise<void>}
 */
async function teardown() {
  console.log('Starting global teardown for event tests...');
  
  try {
    // Perform cleanup tasks in sequence
    await disconnectKafkaClients();
    await cleanupDockerContainers();
    await validateCleanup();
    
    console.log('Global teardown completed successfully');
  } catch (error) {
    console.error(`Global teardown failed: ${error.message}`);
    // Exit with error code to indicate teardown failure
    process.exit(1);
  }
}

// Export the teardown function as the module's default export
module.exports = teardown;