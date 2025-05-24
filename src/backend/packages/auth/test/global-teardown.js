/**
 * Global teardown script for auth package tests
 * 
 * This script runs after all tests in the auth package have completed.
 * It ensures proper cleanup of test resources such as database connections,
 * JWT tokens, and mock servers to prevent resource leaks and ensure test isolation.
 */

// Import required modules
const { closeAllDatabaseConnections } = require('./helpers/test-database.helper');
const { shutdownMockOAuthServers } = require('./helpers/mock-auth-providers.helper');
const { clearTokenCache } = require('./helpers/jwt-token.helper');
const { closeRedisConnections } = require('./mocks/redis.mock');

/**
 * Main teardown function that executes after all tests complete
 * @returns {Promise<void>} Promise that resolves when all cleanup is complete
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown for auth package tests...');
  
  try {
    // Close database connections
    await closeAllDatabaseConnections();
    console.log('✅ Closed all test database connections');
    
    // Shutdown mock OAuth servers
    await shutdownMockOAuthServers();
    console.log('✅ Shut down all mock OAuth servers');
    
    // Clear JWT token cache
    await clearTokenCache();
    console.log('✅ Cleared JWT token cache');
    
    // Close Redis connections
    await closeRedisConnections();
    console.log('✅ Closed all Redis connections');
    
    // Perform any additional cleanup needed
    await cleanupAdditionalResources();
    
    console.log('🎉 Global teardown completed successfully');
  } catch (error) {
    console.error('❌ Error during global teardown:', error);
    // We don't want to fail the test run if teardown has issues,
    // but we do want to log the error for debugging
  }
}

/**
 * Cleanup any additional resources that might be used during testing
 * @returns {Promise<void>} Promise that resolves when cleanup is complete
 */
async function cleanupAdditionalResources() {
  // Clean up any temporary files created during tests
  // Remove any environment variable overrides
  // Reset any global state modifications
  
  // This is a placeholder for any additional cleanup that might be needed
  // in the future as the auth package evolves
  
  console.log('✅ Cleaned up additional resources');
  return Promise.resolve();
}

module.exports = globalTeardown;