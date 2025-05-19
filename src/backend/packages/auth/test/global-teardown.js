/**
 * Global teardown script for auth package tests
 * 
 * This script runs after all tests have completed and is responsible for cleaning up
 * resources to prevent leaks and ensure a clean state for subsequent test runs.
 * 
 * It handles:
 * - Disconnecting from test database connections
 * - Cleaning up JWT tokens and related resources
 * - Shutting down mock authentication servers
 * - Logging cleanup operations for debugging
 */

'use strict';

const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// For async file operations
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);

/**
 * Cleanup temporary JWT tokens created during tests
 * @returns {Promise<void>}
 */
async function cleanupTokens() {
  try {
    const tempDir = path.join(process.cwd(), 'test', 'tmp');
    
    // Check if directory exists before attempting to read it
    if (fs.existsSync(tempDir)) {
      const files = await readdir(tempDir);
      const tokenFiles = files.filter(file => file.startsWith('jwt-') || file.endsWith('.token.json'));
      
      // Delete each token file
      const deletePromises = tokenFiles.map(file => {
        const filePath = path.join(tempDir, file);
        console.log(`Cleaning up token file: ${filePath}`);
        return unlink(filePath).catch(err => {
          // Log but don't fail if a file can't be deleted
          console.warn(`Warning: Could not delete token file ${filePath}:`, err.message);
        });
      });
      
      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.warn('Warning: Error during token cleanup:', error.message);
  }
}

/**
 * Disconnect from any test database connections
 * @param {Object} globalConfig - Jest global configuration
 * @returns {Promise<void>}
 */
async function disconnectDatabases(globalConfig) {
  try {
    // Check if PrismaClient was stored in global object during tests
    if (global.__PRISMA_TEST_CLIENT__) {
      console.log('Disconnecting from test database...');
      await global.__PRISMA_TEST_CLIENT__.$disconnect();
      console.log('Test database disconnected successfully');
    }
  } catch (error) {
    console.warn('Warning: Error disconnecting from test database:', error.message);
  }
}

/**
 * Shutdown any mock servers created during tests
 * @returns {Promise<void>}
 */
async function shutdownMockServers() {
  try {
    // Close mock OAuth server if it exists
    if (global.__MOCK_OAUTH_SERVER__) {
      console.log('Shutting down mock OAuth server...');
      await new Promise((resolve) => {
        global.__MOCK_OAUTH_SERVER__.close(() => {
          console.log('Mock OAuth server shut down successfully');
          resolve();
        });
      });
    }
    
    // Close mock JWT verification server if it exists
    if (global.__MOCK_JWT_SERVER__) {
      console.log('Shutting down mock JWT verification server...');
      await new Promise((resolve) => {
        global.__MOCK_JWT_SERVER__.close(() => {
          console.log('Mock JWT verification server shut down successfully');
          resolve();
        });
      });
    }
  } catch (error) {
    console.warn('Warning: Error shutting down mock servers:', error.message);
  }
}

/**
 * Clean up any in-memory test data
 * @returns {Promise<void>}
 */
async function cleanupTestData() {
  try {
    // Clear any in-memory test data stored in global objects
    if (global.__TEST_DATA__) {
      console.log('Cleaning up in-memory test data...');
      global.__TEST_DATA__ = null;
      console.log('In-memory test data cleaned up successfully');
    }
  } catch (error) {
    console.warn('Warning: Error cleaning up test data:', error.message);
  }
}

/**
 * Main teardown function that runs after all tests complete
 * @param {Object} globalConfig - Jest global configuration
 * @param {Object} projectConfig - Jest project configuration
 * @returns {Promise<void>}
 */
module.exports = async function(globalConfig, projectConfig) {
  console.log('\n🧹 Starting global teardown for auth package tests...');
  
  try {
    // Run all cleanup functions in parallel
    await Promise.all([
      cleanupTokens(),
      disconnectDatabases(globalConfig),
      shutdownMockServers(),
      cleanupTestData()
    ]);
    
    console.log('✅ Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // Don't throw the error to prevent Jest from failing if cleanup has issues
    // This ensures tests that passed are still reported as passing
  }
};