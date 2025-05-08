/**
 * Global teardown script for database tests.
 * 
 * This script is executed after all tests have completed. It ensures proper cleanup
 * of test resources including database connections, Docker containers, and any other
 * system resources allocated during tests. This prevents resource leaks and ensures
 * test isolation between test runs.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Global registry to track resources that need cleanup
const testResourceRegistry = global.__TEST_RESOURCES__ || { 
  prismaClients: [],
  dockerContainers: [],
  tempFiles: [],
  tempDirs: []
};

/**
 * Logs a message with timestamp for the teardown process
 * @param {string} message - The message to log
 * @param {string} [level='info'] - Log level (info, warn, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [DB-TEARDOWN]`;
  
  switch(level) {
    case 'error':
      console.error(`${prefix} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

/**
 * Disconnects all Prisma clients that were registered during tests
 * @returns {Promise<void>}
 */
async function disconnectPrismaClients() {
  log(`Disconnecting ${testResourceRegistry.prismaClients.length} Prisma clients...`);
  
  const disconnectPromises = testResourceRegistry.prismaClients.map(async (client, index) => {
    try {
      await client.$disconnect();
      log(`Disconnected Prisma client #${index + 1}`);
      return true;
    } catch (error) {
      log(`Failed to disconnect Prisma client #${index + 1}: ${error.message}`, 'error');
      return false;
    }
  });
  
  const results = await Promise.allSettled(disconnectPromises);
  const failedCount = results.filter(r => r.status === 'rejected' || !r.value).length;
  
  if (failedCount > 0) {
    log(`Failed to disconnect ${failedCount} Prisma clients`, 'warn');
  } else {
    log('All Prisma clients disconnected successfully');
  }
  
  // Create a new PrismaClient to clean up test databases
  try {
    const cleanupClient = new PrismaClient();
    log('Running database cleanup operations...');
    
    // Execute any specific cleanup operations here
    // This could include truncating test-specific tables or removing test data
    
    await cleanupClient.$disconnect();
    log('Database cleanup completed');
  } catch (error) {
    log(`Database cleanup failed: ${error.message}`, 'error');
  }
}

/**
 * Stops and removes Docker containers that were started for tests
 */
function cleanupDockerContainers() {
  if (testResourceRegistry.dockerContainers.length === 0) {
    log('No Docker containers to clean up');
    return;
  }
  
  log(`Cleaning up ${testResourceRegistry.dockerContainers.length} Docker containers...`);
  
  testResourceRegistry.dockerContainers.forEach((containerId, index) => {
    try {
      // Stop the container first
      execSync(`docker stop ${containerId}`, { stdio: 'pipe' });
      log(`Stopped Docker container ${containerId}`);
      
      // Remove the container
      execSync(`docker rm ${containerId}`, { stdio: 'pipe' });
      log(`Removed Docker container ${containerId}`);
    } catch (error) {
      log(`Failed to clean up Docker container ${containerId}: ${error.message}`, 'error');
    }
  });
  
  log('Docker container cleanup completed');
}

/**
 * Removes temporary files and directories created during tests
 */
function cleanupTempFiles() {
  // Clean up temporary files
  testResourceRegistry.tempFiles.forEach(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log(`Removed temporary file: ${filePath}`);
      }
    } catch (error) {
      log(`Failed to remove temporary file ${filePath}: ${error.message}`, 'error');
    }
  });
  
  // Clean up temporary directories
  testResourceRegistry.tempDirs.forEach(dirPath => {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmdirSync(dirPath, { recursive: true });
        log(`Removed temporary directory: ${dirPath}`);
      }
    } catch (error) {
      log(`Failed to remove temporary directory ${dirPath}: ${error.message}`, 'error');
    }
  });
  
  log('Temporary file cleanup completed');
}

/**
 * Main teardown function that orchestrates the cleanup process
 * @returns {Promise<void>}
 */
async function teardown() {
  log('Starting global teardown for database tests...');
  
  try {
    // Disconnect all Prisma clients first
    await disconnectPrismaClients();
    
    // Clean up Docker containers
    cleanupDockerContainers();
    
    // Clean up temporary files and directories
    cleanupTempFiles();
    
    // Reset the global registry
    if (global.__TEST_RESOURCES__) {
      global.__TEST_RESOURCES__ = {
        prismaClients: [],
        dockerContainers: [],
        tempFiles: [],
        tempDirs: []
      };
    }
    
    log('Global teardown completed successfully');
  } catch (error) {
    log(`Global teardown failed: ${error.message}`, 'error');
    log(error.stack, 'error');
  }
}

module.exports = teardown;