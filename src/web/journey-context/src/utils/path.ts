/**
 * Utility functions for working with journey-specific URL paths
 * 
 * These utilities help with extracting journey IDs from paths, generating route paths for journeys,
 * creating journey-specific paths, and validating if a path belongs to a specific journey.
 * 
 * @module path
 */

import { JourneyId, JOURNEY_IDS } from '../types/journey.types';

/**
 * Extracts the journey ID from a URL path
 * 
 * The journey ID is expected to be the first segment of the path after the initial slash.
 * For example, in '/health/dashboard', the journey ID is 'health'.
 * 
 * @param path - The URL path to extract the journey ID from
 * @returns The journey ID if found, or null if no valid journey ID is present
 * 
 * @example
 * extractJourneyId('/health/dashboard') // Returns 'health'
 * extractJourneyId('/care/appointments') // Returns 'care'
 * extractJourneyId('/invalid/path') // Returns null
 */
export function extractJourneyId(path: string): JourneyId | null {
  if (!path) return null;
  
  // Normalize the path to ensure consistent handling
  const normalizedPath = normalizePath(path);
  
  // Split the path into segments and filter out empty segments
  const segments = normalizedPath.split('/').filter(Boolean);
  
  // The journey ID should be the first segment
  const potentialJourneyId = segments[0];
  
  // Check if the potential journey ID is valid
  if (potentialJourneyId && isValidJourneyId(potentialJourneyId)) {
    return potentialJourneyId as JourneyId;
  }
  
  return null;
}

/**
 * Checks if a path belongs to a specific journey
 * 
 * @param path - The URL path to check
 * @param journeyId - The journey ID to check against
 * @returns True if the path belongs to the specified journey, false otherwise
 * 
 * @example
 * isJourneyPath('/health/dashboard', 'health') // Returns true
 * isJourneyPath('/care/appointments', 'health') // Returns false
 */
export function isJourneyPath(path: string, journeyId: JourneyId): boolean {
  const extractedJourneyId = extractJourneyId(path);
  return extractedJourneyId === journeyId;
}

/**
 * Creates a path within a specific journey
 * 
 * @param journeyId - The journey ID to create the path for
 * @param subPath - The sub-path within the journey (optional)
 * @returns The full journey path
 * 
 * @example
 * createJourneyPath('health', 'dashboard') // Returns '/health/dashboard'
 * createJourneyPath('care') // Returns '/care'
 */
export function createJourneyPath(journeyId: JourneyId, subPath?: string): string {
  // Ensure the journey ID is valid
  if (!isValidJourneyId(journeyId)) {
    console.error(`Invalid journey ID: ${journeyId}`);
    return '/';
  }
  
  // Create the base journey path
  let path = `/${journeyId}`;
  
  // Add the sub-path if provided
  if (subPath) {
    // Normalize the sub-path to remove leading/trailing slashes
    const normalizedSubPath = subPath.replace(/^\/+|\/+$/g, '');
    
    // Only add the sub-path if it's not empty
    if (normalizedSubPath) {
      path = `${path}/${normalizedSubPath}`;
    }
  }
  
  return path;
}

/**
 * Normalizes a path to ensure consistent format
 * 
 * @param path - The path to normalize
 * @returns The normalized path
 * 
 * @example
 * normalizePath('health/dashboard') // Returns '/health/dashboard'
 * normalizePath('/health/dashboard/') // Returns '/health/dashboard'
 */
export function normalizePath(path: string): string {
  if (!path) return '/';
  
  // Ensure the path starts with a slash
  let normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slashes
  normalizedPath = normalizedPath.replace(/\/+$/g, '');
  
  // If the path is empty after normalization, return the root path
  return normalizedPath || '/';
}

/**
 * Checks if a string is a valid journey ID
 * 
 * @param id - The string to check
 * @returns True if the string is a valid journey ID, false otherwise
 * 
 * @example
 * isValidJourneyId('health') // Returns true
 * isValidJourneyId('invalid') // Returns false
 */
export function isValidJourneyId(id: string): boolean {
  return Object.values(JOURNEY_IDS).includes(id as JourneyId);
}

/**
 * Gets the base path for a journey
 * 
 * @param journeyId - The journey ID to get the base path for
 * @returns The base path for the journey
 * 
 * @example
 * getJourneyBasePath('health') // Returns '/health'
 */
export function getJourneyBasePath(journeyId: JourneyId): string {
  return createJourneyPath(journeyId);
}

/**
 * Extracts the sub-path from a journey path
 * 
 * @param path - The full journey path
 * @returns The sub-path without the journey ID prefix, or an empty string if no sub-path exists
 * 
 * @example
 * extractJourneySubPath('/health/dashboard') // Returns 'dashboard'
 * extractJourneySubPath('/care/appointments/details/123') // Returns 'appointments/details/123'
 */
export function extractJourneySubPath(path: string): string {
  const journeyId = extractJourneyId(path);
  
  if (!journeyId) return '';
  
  const normalizedPath = normalizePath(path);
  const journeyBasePath = getJourneyBasePath(journeyId);
  
  // Remove the journey base path from the full path
  let subPath = normalizedPath.replace(journeyBasePath, '');
  
  // Remove leading slash if present
  subPath = subPath.replace(/^\/+/, '');
  
  return subPath;
}

/**
 * Checks if a path is a deep link within a journey
 * 
 * A deep link is a path that has additional segments beyond the journey ID.
 * 
 * @param path - The path to check
 * @returns True if the path is a deep link, false otherwise
 * 
 * @example
 * isDeepLink('/health/dashboard') // Returns true
 * isDeepLink('/health') // Returns false
 */
export function isDeepLink(path: string): boolean {
  const subPath = extractJourneySubPath(path);
  return !!subPath;
}