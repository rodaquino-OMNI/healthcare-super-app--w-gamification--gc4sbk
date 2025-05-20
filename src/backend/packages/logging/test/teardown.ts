/**
 * Global teardown for logging package tests.
 * 
 * This file is executed after all tests have completed and is responsible for cleaning up
 * the test environment to ensure no state leaks between test runs. It handles:
 * 
 * - Closing any open file handles from FileTransport
 * - Stopping mock servers (AWS CloudWatch, etc.)
 * - Restoring environment variables
 * - Resetting global mocks
 * - Clearing any cached data
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Import mocks that need to be reset
import { 
  MockLoggerService,
  MockContextManager,
  MockTransport,
  MockFormatter,
  MockCloudWatchLogs,
  MockConfigService
} from './mocks';

// Store original environment variables
const originalEnv = { ...process.env };

// Track open file handles that need to be closed
const openFileHandles: fs.promises.FileHandle[] = [];

// Track running mock servers
const mockServers: Array<{ stop: () => Promise<void> }> = [];

/**
 * Register a file handle to be closed during teardown
 * @param handle File handle to be closed
 */
export const registerFileHandle = (handle: fs.promises.FileHandle): void => {
  openFileHandles.push(handle);
};

/**
 * Register a mock server to be stopped during teardown
 * @param server Server with a stop method
 */
export const registerMockServer = (server: { stop: () => Promise<void> }): void => {
  mockServers.push(server);
};

/**
 * Reset all registered mocks to their initial state
 */
const resetMocks = (): void => {
  // Reset all mock implementations
  MockLoggerService.prototype.reset?.();
  MockContextManager.prototype.reset?.();
  MockTransport.prototype.reset?.();
  MockFormatter.prototype.reset?.();
  MockCloudWatchLogs.prototype.reset?.();
  MockConfigService.prototype.reset?.();
  
  // Clear any module caches that might affect tests
  jest.resetModules();
};

/**
 * Close all registered file handles
 */
const closeFileHandles = async (): Promise<void> => {
  try {
    // Close all registered file handles
    await Promise.all(openFileHandles.map(handle => handle.close()));
    openFileHandles.length = 0; // Clear the array
    
    // Clean up any temporary log files created during tests
    const testLogsDir = path.join(process.cwd(), 'test-logs');
    if (fs.existsSync(testLogsDir)) {
      const files = fs.readdirSync(testLogsDir);
      for (const file of files) {
        fs.unlinkSync(path.join(testLogsDir, file));
      }
      fs.rmdirSync(testLogsDir);
    }
  } catch (error) {
    console.error('Error closing file handles:', error);
  }
};

/**
 * Stop all registered mock servers
 */
const stopMockServers = async (): Promise<void> => {
  try {
    await Promise.all(mockServers.map(server => server.stop()));
    mockServers.length = 0; // Clear the array
  } catch (error) {
    console.error('Error stopping mock servers:', error);
  }
};

/**
 * Restore environment variables to their original state
 */
const restoreEnvironment = (): void => {
  // Reset environment variables to original state
  Object.keys(process.env).forEach(key => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  
  Object.keys(originalEnv).forEach(key => {
    process.env[key] = originalEnv[key];
  });
};

/**
 * Clear any caches that might affect test isolation
 */
const clearCaches = (): void => {
  // Clear any module-level caches
  if (global.__LOGGER_CACHE__) {
    global.__LOGGER_CACHE__.clear();
  }
  
  if (global.__CONTEXT_CACHE__) {
    global.__CONTEXT_CACHE__.clear();
  }
  
  // Clear any AsyncLocalStorage instances
  if (global.__ASYNC_STORAGE__) {
    global.__ASYNC_STORAGE__.disable();
  }
};

/**
 * Main teardown function that runs after all tests
 */
export default async (): Promise<void> => {
  try {
    // Run all cleanup operations
    await closeFileHandles();
    await stopMockServers();
    restoreEnvironment();
    resetMocks();
    clearCaches();
    
    console.log('Logging package test teardown completed successfully');
  } catch (error) {
    console.error('Error during test teardown:', error);
    // Don't throw here to avoid failing the test run
    // Just log the error for debugging
  }
};