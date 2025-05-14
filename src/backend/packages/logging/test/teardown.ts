/**
 * Global teardown file for logging package tests
 * 
 * This file is executed after all tests have completed and is responsible for cleaning up
 * the testing environment to ensure no state leaks between test runs. It handles:
 * 
 * - Closing any open file handles from FileTransport
 * - Stopping mock servers (CloudWatch, etc.)
 * - Restoring environment variables
 * - Resetting global mocks
 * - Clearing caches
 */

import { closeAllFileHandles } from './utils/log-capture.utils';
import { stopAllMockServers } from './utils/mocks';
import { resetEnvironmentVariables } from './utils/test-module.utils';

/**
 * Main teardown function that will be executed after all tests
 */
async function teardown(): Promise<void> {
  try {
    // Close any open file handles from FileTransport
    await closeAllFileHandles();
    
    // Stop all mock servers (CloudWatch, HTTP, etc.)
    await stopAllMockServers();
    
    // Reset environment variables that might have been modified during tests
    resetEnvironmentVariables();
    
    // Reset console mocks if they were used
    if (global.console.log.mockRestore) {
      global.console.log.mockRestore();
      global.console.error.mockRestore();
      global.console.warn.mockRestore();
      global.console.debug.mockRestore();
      global.console.info.mockRestore();
    }
    
    // Reset process.stdout and process.stderr mocks if they were used
    if (process.stdout.write.mockRestore) {
      process.stdout.write.mockRestore();
    }
    
    if (process.stderr.write.mockRestore) {
      process.stderr.write.mockRestore();
    }
    
    // Clear any module caches that might cause state leakage
    jest.resetModules();
    
    // Clear any AsyncLocalStorage instances that might persist between tests
    // This is important for context isolation between test runs
    global.__ASYNC_STORAGE_INSTANCES__?.forEach(storage => {
      storage.disable();
    });
    global.__ASYNC_STORAGE_INSTANCES__ = [];
    
    // Reset any AWS SDK mocks
    jest.restoreAllMocks();
    
    // Clear any in-memory transport buffers
    global.__LOG_BUFFERS__?.clear();
    
    console.log('Logging package test teardown completed successfully');
  } catch (error) {
    console.error('Error during logging package test teardown:', error);
    // We don't want to fail the test run if teardown has issues,
    // but we do want to log the error for debugging
  }
}

// Export the teardown function as the default export
// This will be picked up by Jest's globalTeardown configuration
export default teardown;

/**
 * Handle unexpected process termination
 * This ensures resources are properly cleaned up even if the process is terminated abnormally
 */
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, cleaning up logging test resources...');
  await teardown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, cleaning up logging test resources...');
  await teardown();
  process.exit(0);
});