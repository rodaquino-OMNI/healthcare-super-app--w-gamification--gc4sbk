/**
 * Global teardown file for logging package tests.
 * This file is executed after all tests have completed and is responsible for
 * cleaning up the test environment to prevent state leakage between test runs.
 */

import { closeAllTransports } from './mocks/transport.mock';
import { resetAllMocks } from './mocks/index';
import { clearLogContexts } from './mocks/context-manager.mock';
import { closeFileHandles, clearLoggerCache } from './mocks/test-utils';
import { restoreEnvironment } from './mocks/test-utils';
import { stopMockServers } from './mocks/test-utils';

// TypeScript declarations for global objects used in tests
declare global {
  namespace NodeJS {
    interface Global {
      __LOGGING_TEST_MODE__: boolean | undefined;
      AWS?: {
        _reset?: () => void;
        [key: string]: any;
      };
      console: Console & {
        _originalConsole?: Console;
      };
    }
  }
}

/**
 * Main teardown function that orchestrates the cleanup of all test resources.
 * This function is automatically called by the test runner after all tests complete.
 */
export default async (): Promise<void> => {
  try {
    // Close all transport instances to prevent file handle leaks and pending network requests
    await closeAllTransports();
    
    // Close any open file handles created during tests
    await closeFileHandles();
    
    // Stop any mock servers (like mock AWS services) that might be running
    await stopMockServers();
    
    // Clear all logging contexts to prevent context leakage between test runs
    clearLogContexts();
    
    // Reset all mock implementations to their initial state
    resetAllMocks();
    
    // Restore environment variables to their original values
    restoreEnvironment();
    
    // Clear any logger instance caches
    clearLoggerCache();
    
    // Additional cleanup for global state
    cleanupGlobalState();
    
    console.log('Logging package test teardown completed successfully');
  } catch (error) {
    // Provide more detailed error information
    console.error('Error during logging package test teardown:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown Error',
    });
    // We don't want to throw here as it would mask test failures
    // Instead, log the error and continue
  }
};

/**
 * Cleans up any global state that might have been modified during tests.
 * This includes resetting global variables, clearing caches, and restoring
 * original implementations of any monkey-patched functions.
 */
function cleanupGlobalState(): void {
  // Reset any global variables that might have been set during tests
  global.__LOGGING_TEST_MODE__ = undefined;
  
  // Clear any module caches that might contain test-specific state
  jest.resetModules();
  
  // Restore original implementations of any monkey-patched functions
  if (global.console._originalConsole) {
    global.console = global.console._originalConsole;
  }
  
  // Clear any interval or timeout that might have been set during tests
  jest.clearAllTimers();
  
  // Reset any AWS SDK mocks
  if (global.AWS && global.AWS._reset) {
    global.AWS._reset();
  }
  
  // Reset any Node.js core module mocks (like fs, path, etc.)
  jest.restoreAllMocks();
  
  // Clear any AsyncLocalStorage instances that might have been created
  // This is important for the context management in the logging system
  if (global.AsyncLocalStorage) {
    // No direct way to clear all AsyncLocalStorage instances
    // But we can ensure our known instances are cleared via clearLogContexts()
  }
}