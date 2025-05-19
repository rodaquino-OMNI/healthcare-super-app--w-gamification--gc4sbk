/**
 * Global teardown for end-to-end tests of the error handling framework.
 * This file runs once after all E2E tests complete.
 */

/**
 * Tears down the global test environment for E2E tests.
 * Closes the NestJS application instance and cleans up resources.
 */
export default async function globalTeardown(): Promise<void> {
  console.log('Tearing down E2E test environment for error handling framework...');
  
  try {
    // Close the NestJS application if it exists
    if (global.testApp) {
      await global.testApp.close();
      console.log('NestJS application closed.');
    }
    
    // Clean up any other resources
    // This could include closing database connections, stopping mock servers, etc.
    
    console.log('E2E test environment teardown complete.');
  } catch (error) {
    console.error('Failed to tear down E2E test environment:', error);
    throw error;
  }
}