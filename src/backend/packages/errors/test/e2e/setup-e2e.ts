/**
 * Global setup for end-to-end tests of the error handling framework.
 * This file runs once before all E2E tests start.
 */

import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TestModule } from './test-app';

// Global variable to store the test application instance
declare global {
  // eslint-disable-next-line no-var
  var testApp: INestApplication;
}

/**
 * Sets up the global test environment for E2E tests.
 * Creates a NestJS application instance that can be used across all tests.
 */
export default async function globalSetup(): Promise<void> {
  console.log('Setting up E2E test environment for error handling framework...');
  
  try {
    // Create a test module with the TestModule
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule.forRoot()],
    }).compile();
    
    // Create the NestJS application
    const app = moduleRef.createNestApplication();
    
    // Configure the application
    app.enableShutdownHooks();
    
    // Initialize the application
    await app.init();
    
    // Store the application instance in the global variable
    global.testApp = app;
    
    console.log('E2E test environment setup complete.');
  } catch (error) {
    console.error('Failed to set up E2E test environment:', error);
    throw error;
  }
}