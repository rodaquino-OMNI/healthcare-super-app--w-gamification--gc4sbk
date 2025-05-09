/**
 * Global teardown script for event tests.
 * 
 * This script ensures proper cleanup of test resources after all tests have completed.
 * It disconnects Kafka connections, removes test topics, and releases any system
 * resources allocated during tests. This prevents resource leaks and ensures complete
 * test isolation between test runs for event-related testing.
 *
 * @module global-teardown
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import KafkaJS directly to avoid potential circular dependencies
let kafkajs;
try {
  kafkajs = require('kafkajs');
} catch (error) {
  console.warn('KafkaJS not available, some cleanup operations may be skipped:', error.message);
  kafkajs = { Kafka: class MockKafka {} };
}

// Path to store test resources state
const TEST_RESOURCES_PATH = path.join(__dirname, '.test-resources.json');

/**
 * Reads the test resources state file if it exists
 * @returns {Object} The test resources state or an empty object if file doesn't exist
 */
function getTestResources() {
  try {
    if (fs.existsSync(TEST_RESOURCES_PATH)) {
      return JSON.parse(fs.readFileSync(TEST_RESOURCES_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error reading test resources file:', error);
  }
  return { kafkaClients: [], testTopics: [], dockerContainers: [] };
}

/**
 * Disconnects all Kafka clients that were created during tests
 * @param {Array} kafkaClients Array of Kafka client connection details
 * @returns {Promise<void>}
 */
async function disconnectKafkaClients(kafkaClients = []) {
  if (!kafkaClients || kafkaClients.length === 0) {
    console.log('No Kafka clients to disconnect');
    return;
  }

  console.log(`Disconnecting ${kafkaClients.length} Kafka clients...`);
  
  // If KafkaJS is not available, we can't disconnect clients
  if (!kafkajs || !kafkajs.Kafka) {
    console.warn('KafkaJS not available, skipping client disconnection');
    return;
  }
  
  const disconnectPromises = kafkaClients.map(async (clientInfo) => {
    try {
      // Create a client instance using the stored connection details
      const kafka = new kafkajs.Kafka({
        clientId: clientInfo.clientId || 'teardown-client',
        brokers: clientInfo.brokers || ['localhost:9092'],
        ssl: clientInfo.ssl,
        sasl: clientInfo.sasl,
      });
      
      // Disconnect the admin, producer and consumer if they exist
      if (clientInfo.hasAdmin) {
        const admin = kafka.admin();
        await admin.disconnect().catch(e => console.warn(`Admin disconnect warning: ${e.message}`));
      }
      
      if (clientInfo.hasProducer) {
        const producer = kafka.producer(clientInfo.producerConfig || {});
        await producer.disconnect().catch(e => console.warn(`Producer disconnect warning: ${e.message}`));
      }
      
      if (clientInfo.hasConsumer) {
        const consumer = kafka.consumer(clientInfo.consumerConfig || { groupId: 'test-group' });
        await consumer.disconnect().catch(e => console.warn(`Consumer disconnect warning: ${e.message}`));
      }
      
      console.log(`Disconnected Kafka client: ${clientInfo.clientId}`);
    } catch (error) {
      console.error(`Failed to disconnect Kafka client ${clientInfo.clientId}:`, error.message);
    }
  });
  
  await Promise.allSettled(disconnectPromises);
}

/**
 * Removes all test topics that were created during tests
 * @param {Array} testTopics Array of test topic names
 * @param {Object} kafkaConfig Kafka configuration
 * @returns {Promise<void>}
 */
async function removeTestTopics(testTopics = [], kafkaConfig = {}) {
  if (!testTopics || testTopics.length === 0) {
    console.log('No test topics to remove');
    return;
  }
  
  // If KafkaJS is not available, we can't remove topics
  if (!kafkajs || !kafkajs.Kafka) {
    console.warn('KafkaJS not available, skipping topic removal');
    return;
  }
  
  console.log(`Removing ${testTopics.length} test topics...`);
  
  try {
    // Create an admin client to manage topics
    const kafka = new kafkajs.Kafka({
      clientId: 'test-teardown-admin',
      brokers: kafkaConfig.brokers || ['localhost:9092'],
      ssl: kafkaConfig.ssl,
      sasl: kafkaConfig.sasl,
      connectionTimeout: 10000, // 10 seconds timeout for connection
      retry: {
        initialRetryTime: 100,
        retries: 3
      }
    });
    
    const admin = kafka.admin();
    await admin.connect();
    
    // Get existing topics to avoid errors when trying to delete non-existent topics
    const existingTopics = await admin.listTopics();
    const topicsToDelete = testTopics.filter(topic => existingTopics.includes(topic));
    
    if (topicsToDelete.length === 0) {
      console.log('No existing test topics to remove');
      await admin.disconnect();
      return;
    }
    
    // Delete all existing test topics
    await admin.deleteTopics({
      topics: topicsToDelete,
      timeout: 10000, // 10 seconds timeout
    });
    
    console.log(`Successfully removed ${topicsToDelete.length} test topics`);
    await admin.disconnect();
  } catch (error) {
    console.error('Failed to remove test topics:', error.message);
    // Try to disconnect admin client even if topic deletion failed
    try {
      const kafka = new kafkajs.Kafka({
        clientId: 'test-teardown-admin-cleanup',
        brokers: kafkaConfig.brokers || ['localhost:9092'],
      });
      const admin = kafka.admin();
      await admin.disconnect().catch(() => {});
    } catch (e) {
      // Ignore errors during cleanup
    }
  }
}

/**
 * Stops and removes Docker containers used for testing
 * @param {Array} dockerContainers Array of Docker container IDs or names
 * @returns {Promise<void>}
 */
async function cleanupDockerContainers(dockerContainers = []) {
  if (!dockerContainers || dockerContainers.length === 0) {
    console.log('No Docker containers to clean up');
    return;
  }
  
  console.log(`Cleaning up ${dockerContainers.length} Docker containers...`);
  
  // Check if Docker is available
  try {
    execSync('docker --version', { stdio: 'ignore' });
  } catch (error) {
    console.warn('Docker not available, skipping container cleanup');
    return;
  }
  
  // Process containers in parallel with Promise.allSettled
  const cleanupPromises = dockerContainers.map(containerId => {
    return new Promise((resolve) => {
      // First check if the container exists
      exec(`docker inspect ${containerId}`, { stdio: 'ignore' }, (error) => {
        if (error) {
          // Container doesn't exist, nothing to do
          console.log(`Docker container not found: ${containerId}`);
          resolve();
          return;
        }
        
        // Stop the container
        exec(`docker stop ${containerId}`, (stopError) => {
          if (stopError) {
            console.error(`Failed to stop Docker container ${containerId}:`, stopError.message);
          } else {
            console.log(`Stopped Docker container: ${containerId}`);
          }
          
          // Remove the container
          exec(`docker rm ${containerId}`, (rmError) => {
            if (rmError) {
              console.error(`Failed to remove Docker container ${containerId}:`, rmError.message);
            } else {
              console.log(`Removed Docker container: ${containerId}`);
            }
            resolve();
          });
        });
      });
    });
  });
  
  await Promise.allSettled(cleanupPromises);
  
  // Also clean up any test-specific networks
  try {
    // List networks with the test label
    const testNetworks = execSync('docker network ls --filter "label=purpose=kafka-testing" --format "{{.ID}}"', { encoding: 'utf8' }).trim();
    if (testNetworks) {
      const networkIds = testNetworks.split('\n').filter(Boolean);
      console.log(`Cleaning up ${networkIds.length} test networks...`);
      
      for (const networkId of networkIds) {
        try {
          execSync(`docker network rm ${networkId}`, { stdio: 'ignore' });
          console.log(`Removed Docker network: ${networkId}`);
        } catch (error) {
          console.error(`Failed to remove Docker network ${networkId}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to clean up Docker networks:', error.message);
  }
}

/**
 * Validates that all resources have been properly cleaned up
 * @returns {Promise<boolean>} True if all resources are cleaned up, false otherwise
 */
async function validateCleanup() {
  try {
    // Check for any remaining test resources file
    if (fs.existsSync(TEST_RESOURCES_PATH)) {
      try {
        fs.unlinkSync(TEST_RESOURCES_PATH);
        console.log('Removed test resources state file');
      } catch (error) {
        console.warn(`Failed to remove test resources file: ${error.message}`);
      }
    }
    
    // Check for any remaining Kafka test containers
    try {
      const runningContainers = execSync('docker ps -q --filter "label=purpose=kafka-testing"', { encoding: 'utf8' }).trim();
      if (runningContainers) {
        console.warn('Warning: Found running Kafka test containers after cleanup:', runningContainers);
        
        // Try one more time to force remove these containers
        const containerIds = runningContainers.split('\n').filter(Boolean);
        for (const id of containerIds) {
          try {
            execSync(`docker rm -f ${id}`, { stdio: 'ignore' });
            console.log(`Force removed container: ${id}`);
          } catch (e) {
            // Ignore errors during force removal
          }
        }
        
        return false;
      }
    } catch (error) {
      // Docker might not be available, which is fine
      console.log('Skipping Docker container validation:', error.message);
    }
    
    // Check for any remaining Kafka connections by checking open ports
    try {
      // This works on Linux/Mac, might need adjustment for Windows
      const openPorts = execSync('netstat -tuln | grep 9092', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (openPorts) {
        console.warn('Warning: Found open Kafka ports after cleanup. This might indicate leaked connections.');
        return false;
      }
    } catch (error) {
      // If the command fails, it likely means no ports are open, which is good
      // Or the command is not available, which we can ignore
    }
    
    return true;
  } catch (error) {
    console.error('Error validating cleanup:', error.message);
    return false;
  }
}

/**
 * Cleans up any global event listeners that might have been registered
 * @returns {void}
 */
function cleanupEventListeners() {
  // Get the max listeners and reset to default
  const maxListeners = process.getMaxListeners();
  if (maxListeners > 10) { // Default is 10
    process.setMaxListeners(10);
    console.log(`Reset process max listeners from ${maxListeners} to 10`);
  }
  
  // Remove any specific listeners that might have been added
  // This is a best-effort cleanup as we don't know exactly what listeners were added
  ['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection'].forEach(event => {
    const count = process.listenerCount(event);
    if (count > 0) {
      console.log(`Found ${count} listeners for ${event}, attempting to clean up`);
      // We can't easily remove specific listeners, but we can log the count
    }
  });
}

/**
 * Main teardown function that orchestrates the cleanup process
 * @returns {Promise<void>}
 */
async function teardown() {
  console.log('Starting global teardown for event tests...');
  const startTime = Date.now();
  
  try {
    // Get test resources that need to be cleaned up
    const resources = getTestResources();
    
    // Run cleanup tasks in parallel for efficiency
    const [kafkaResult, topicsResult, containersResult] = await Promise.allSettled([
      // Disconnect Kafka clients
      disconnectKafkaClients(resources.kafkaClients),
      
      // Remove test topics
      removeTestTopics(resources.testTopics, resources.kafkaConfig),
      
      // Clean up Docker containers
      cleanupDockerContainers(resources.dockerContainers)
    ]);
    
    // Log any errors from parallel tasks
    [kafkaResult, topicsResult, containersResult].forEach((result, index) => {
      if (result.status === 'rejected') {
        const taskNames = ['Kafka client disconnection', 'Test topic removal', 'Docker container cleanup'];
        console.error(`Error during ${taskNames[index]}:`, result.reason);
      }
    });
    
    // Clean up event listeners
    cleanupEventListeners();
    
    // Validate cleanup
    const cleanupSuccessful = await validateCleanup();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    if (cleanupSuccessful) {
      console.log(`Global teardown completed successfully in ${duration}s`);
    } else {
      console.warn(`Global teardown completed with warnings in ${duration}s`);
    }
  } catch (error) {
    console.error('Error during global teardown:', error.message);
    // Don't exit with error code as this might prevent Jest from reporting test results
    // Instead, log the error and continue
  }
}

module.exports = teardown;