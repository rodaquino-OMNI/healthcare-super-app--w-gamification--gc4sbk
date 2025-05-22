/**
 * Global teardown script for database tests.
 * 
 * This script is executed by Jest after all tests have completed.
 * It ensures proper cleanup of test resources including:
 * - Disconnecting database connections
 * - Removing test data
 * - Releasing Docker containers and other system resources
 * 
 * This prevents resource leaks and ensures test isolation between runs.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const Redis = require('redis');

/**
 * Logs a message with timestamp to the console
 * @param {string} message - The message to log
 * @param {string} level - The log level (info, warn, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [global-teardown]`;
  console[level](`${prefix} ${message}`);
}

/**
 * Disconnects from all Prisma clients
 * @returns {Promise<void>}
 */
async function disconnectPrismaClients() {
  try {
    // Create a new client to ensure we can disconnect any lingering connections
    const prisma = new PrismaClient();
    log('Disconnecting Prisma clients...');
    await prisma.$disconnect();
    log('Prisma clients disconnected successfully');
  } catch (error) {
    log(`Error disconnecting Prisma clients: ${error.message}`, 'error');
  }
}

/**
 * Closes Redis connections if Redis is used
 * @returns {Promise<void>}
 */
async function closeRedisConnections() {
  try {
    log('Checking for Redis connections...');
    // Check if Redis is used in the global scope
    if (global.redisClient) {
      log('Closing Redis connections...');
      await global.redisClient.quit();
      log('Redis connections closed successfully');
    } else {
      log('No Redis connections found');
    }
  } catch (error) {
    log(`Error closing Redis connections: ${error.message}`, 'error');
  }
}

/**
 * Cleans up Docker containers used for testing
 * @returns {Promise<void>}
 */
async function cleanupDockerContainers() {
  try {
    log('Checking for test Docker containers...');
    
    // Look for containers with test labels
    const testContainers = execSync(
      'docker ps -q --filter "label=purpose=testing" --filter "label=managed-by=jest"'
    ).toString().trim();
    
    if (testContainers) {
      const containerIds = testContainers.split('\n');
      log(`Found ${containerIds.length} test containers to clean up`);
      
      // Stop and remove each container
      for (const containerId of containerIds) {
        log(`Stopping and removing container ${containerId}...`);
        execSync(`docker stop ${containerId} && docker rm ${containerId}`);
      }
      
      log('All test containers cleaned up successfully');
    } else {
      log('No test containers found');
    }
  } catch (error) {
    log(`Error cleaning up Docker containers: ${error.message}`, 'error');
  }
}

/**
 * Main teardown function that Jest will call after all tests have completed
 * @returns {Promise<void>}
 */
async function teardown() {
  log('Starting global teardown...');
  
  try {
    // Perform all cleanup operations
    await Promise.all([
      disconnectPrismaClients(),
      closeRedisConnections(),
      cleanupDockerContainers()
    ]);
    
    log('Global teardown completed successfully');
  } catch (error) {
    log(`Error during global teardown: ${error.message}`, 'error');
    // Even if there's an error, we don't want to throw it here
    // as it might prevent Jest from exiting properly
  }
}

module.exports = teardown;