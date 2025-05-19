/**
 * API Configuration Module
 * 
 * This module defines the API endpoints and related settings for the AUSTA SuperApp.
 * It centralizes API URL configuration and constructs journey-specific endpoints
 * to maintain consistency across the application.
 *
 * @module apiConfig
 */

import { env } from './env';

// Import journey types from the interfaces package
import { JourneyId } from '@austa/interfaces/common';

/**
 * API endpoint interface for type safety
 */
export interface ApiEndpoint {
  /** Base URL for the endpoint */
  readonly url: string;
  
  /** Constructs a path within this endpoint */
  path: (path: string) => string;
}

/**
 * Journey-specific API endpoints interface
 */
export interface JourneyEndpoints {
  /** Health journey API endpoint */
  readonly health: ApiEndpoint;
  
  /** Care journey API endpoint */
  readonly care: ApiEndpoint;
  
  /** Plan journey API endpoint */
  readonly plan: ApiEndpoint;
}

/**
 * API Configuration interface
 */
export interface ApiConfig {
  /** Base URL for all API requests */
  readonly baseURL: string;
  
  /** Journey-specific API endpoints */
  readonly journeys: JourneyEndpoints;
  
  /** Constructs a path within the base API */
  path: (path: string) => string;
}

/**
 * Journey configuration mapping for easy access to journey identifiers
 * This creates a lowercase version of the journey IDs for consistent API path construction
 */
const JOURNEY_CONFIG: Record<string, JourneyId> = {
  health: 'health',
  care: 'care',
  plan: 'plan',
};

/**
 * Creates an API endpoint with the given base URL
 * 
 * @param baseUrl - The base URL for the endpoint
 * @returns An ApiEndpoint object with the URL and path function
 */
const createEndpoint = (baseUrl: string): ApiEndpoint => ({
  url: baseUrl,
  path: (path: string) => `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`,
});

/**
 * Configuration object for API endpoints and related settings.
 * Centralizes API URL management and journey-specific endpoints.
 */
export const apiConfig: ApiConfig = {
  /**
   * Base URL for all API requests
   * Uses the API_URL from environment variables with a fallback
   */
  baseURL: env.API_URL,
  
  /**
   * Constructs a path within the base API
   * 
   * @param path - The path to append to the base URL
   * @returns The full URL with the path
   */
  path: (path: string) => `${apiConfig.baseURL}${path.startsWith('/') ? path : `/${path}`}`,
  
  journeys: {} as JourneyEndpoints,
};

/**
 * Journey-specific API endpoints
 * Constructed using the base URL and journey identifiers
 * These endpoints are used for making requests to journey-specific services
 */
apiConfig.journeys = {
  /**
   * Health journey API endpoint
   * Used for health metrics, goals, and medical history
   */
  health: createEndpoint(`${apiConfig.baseURL}/${JOURNEY_CONFIG.health}`),
  
  /**
   * Care journey API endpoint
   * Used for appointments, telemedicine, and treatments
   */
  care: createEndpoint(`${apiConfig.baseURL}/${JOURNEY_CONFIG.care}`),
  
  /**
   * Plan journey API endpoint
   * Used for insurance coverage, claims, and benefits
   */
  plan: createEndpoint(`${apiConfig.baseURL}/${JOURNEY_CONFIG.plan}`),
};

/**
 * Export the API configuration as a readonly object
 * to prevent modifications at runtime
 */
export default apiConfig as Readonly<ApiConfig>;