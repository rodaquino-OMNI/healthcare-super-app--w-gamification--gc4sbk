/**
 * Example usage of the HttpClient with resilience patterns
 */

import { createHttpClient, createJourneyHttpClient } from '../http-client';
import { Logger } from '@nestjs/common';
import { ExternalApiError, ExternalDependencyUnavailableError, ExternalRateLimitError } from '@austa/errors/categories/external.errors';
import { TimeoutError } from '@austa/errors/categories/technical.errors';

// Create a logger instance
const logger = new Logger('ApiClient');

// Create a basic HTTP client
const client = createHttpClient({
  baseURL: 'https://api.example.com',
  headers: { 'Authorization': 'Bearer token' },
  timeout: 5000, // 5 seconds
  logger
});

// Create a journey-specific HTTP client for the Health journey
const healthClient = createJourneyHttpClient('health', {
  baseURL: 'https://health-api.example.com',
  logger
});

/**
 * Example function to fetch user data with error handling
 */
async function fetchUserData(userId: string) {
  try {
    return await client.get(`/users/${userId}`);
  } catch (error) {
    // Handle specific error types
    if (error instanceof TimeoutError) {
      logger.warn(`Request timed out: ${error.message}`);
      // Return cached data or default value
      return { name: 'Unknown User', id: userId };
    }
    
    if (error instanceof ExternalRateLimitError) {
      const retryAfter = error.metadata?.retryAfter || 60;
      logger.warn(`Rate limited. Retry after ${retryAfter} seconds`);
      // Schedule retry or notify user
    }
    
    if (error instanceof ExternalDependencyUnavailableError) {
      logger.error(`Service unavailable: ${error.message}`);
      // Implement fallback strategy
    }
    
    if (error instanceof ExternalApiError) {
      logger.error(`API error (${error.metadata?.statusCode}): ${error.message}`);
      // Handle based on status code
    }
    
    // Re-throw for caller to handle
    throw error;
  }
}

/**
 * Example function to create a health record with journey-specific client
 */
async function createHealthRecord(userId: string, data: any) {
  try {
    return await healthClient.post(`/users/${userId}/health-records`, data);
  } catch (error) {
    // Error will include health journey context
    logger.error(`Failed to create health record: ${error.message}`);
    
    // Journey-specific error handling
    if (error.metadata?.journey === 'health') {
      // Implement health journey specific recovery
    }
    
    throw error;
  }
}

/**
 * Example of using the client in an async function
 */
async function main() {
  try {
    // Fetch user data
    const user = await fetchUserData('123');
    console.log('User data:', user);
    
    // Create health record
    const healthRecord = await createHealthRecord('123', {
      bloodPressure: '120/80',
      heartRate: 75
    });
    console.log('Health record created:', healthRecord);
  } catch (error) {
    console.error('Operation failed:', error.message);
  }
}

// Run the example
// main().catch(console.error);