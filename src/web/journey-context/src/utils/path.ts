/**
 * Path utilities for journey-specific URL paths
 * 
 * This file provides utility functions for working with journey-specific URL paths,
 * including extracting journey IDs from paths, generating route paths for journeys,
 * creating journey-specific paths, and validating if a path belongs to a specific journey.
 * 
 * These functions are essential for navigation within the journey-based architecture,
 * ensuring that routes are correctly associated with journey contexts.
 */

/**
 * Regular expression to match journey IDs at the beginning of a path
 * Matches patterns like '/health/...', '/care/...', '/plan/...'
 */
const JOURNEY_PATH_REGEX = /^\/([^\/]+)(?:\/|$)/;

/**
 * Normalizes a path by ensuring it starts with a slash and removing trailing slashes
 * 
 * @param path - The path to normalize
 * @returns The normalized path
 * 
 * @example
 * // Returns '/health/dashboard'
 * normalizePath('health/dashboard')
 * 
 * @example
 * // Returns '/care/appointments'
 * normalizePath('/care/appointments/')
 */
export const normalizePath = (path: string): string => {
  // Ensure path starts with a slash
  const pathWithLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  
  // Remove trailing slash if present (unless it's the root path '/')
  return pathWithLeadingSlash.length > 1 && pathWithLeadingSlash.endsWith('/')
    ? pathWithLeadingSlash.slice(0, -1)
    : pathWithLeadingSlash;
};

/**
 * Extracts the journey ID from a path
 * 
 * @param path - The path to extract the journey ID from
 * @returns The journey ID if found, or null if no journey ID is present
 * 
 * @example
 * // Returns 'health'
 * extractJourneyId('/health/dashboard')
 * 
 * @example
 * // Returns 'care'
 * extractJourneyId('/care/appointments/123')
 * 
 * @example
 * // Returns null
 * extractJourneyId('/auth/login')
 */
export const extractJourneyId = (path: string): string | null => {
  const normalizedPath = normalizePath(path);
  const match = normalizedPath.match(JOURNEY_PATH_REGEX);
  
  if (match && match[1]) {
    const journeyId = match[1];
    // Only return the journey ID if it's a valid journey
    // This excludes paths like '/auth/login' which aren't journey-specific
    return isValidJourneyId(journeyId) ? journeyId : null;
  }
  
  return null;
};

/**
 * Checks if a string is a valid journey ID
 * 
 * @param journeyId - The journey ID to validate
 * @returns True if the journey ID is valid, false otherwise
 * 
 * @example
 * // Returns true
 * isValidJourneyId('health')
 * 
 * @example
 * // Returns false
 * isValidJourneyId('auth')
 */
export const isValidJourneyId = (journeyId: string): boolean => {
  // These should match the JOURNEY_IDS from shared constants
  const validJourneyIds = ['health', 'care', 'plan'];
  return validJourneyIds.includes(journeyId);
};

/**
 * Checks if a path belongs to a specific journey
 * 
 * @param path - The path to check
 * @param journeyId - The journey ID to check against
 * @returns True if the path belongs to the specified journey, false otherwise
 * 
 * @example
 * // Returns true
 * isJourneyPath('/health/dashboard', 'health')
 * 
 * @example
 * // Returns false
 * isJourneyPath('/care/appointments', 'health')
 */
export const isJourneyPath = (path: string, journeyId: string): boolean => {
  const extractedJourneyId = extractJourneyId(path);
  return extractedJourneyId === journeyId;
};

/**
 * Creates a journey-specific path by combining a journey ID with a sub-path
 * 
 * @param journeyId - The journey ID
 * @param subPath - The sub-path within the journey (optional)
 * @returns The combined journey path
 * 
 * @example
 * // Returns '/health/dashboard'
 * createJourneyPath('health', 'dashboard')
 * 
 * @example
 * // Returns '/care/appointments/123'
 * createJourneyPath('care', 'appointments/123')
 * 
 * @example
 * // Returns '/plan'
 * createJourneyPath('plan')
 */
export const createJourneyPath = (journeyId: string, subPath?: string): string => {
  if (!isValidJourneyId(journeyId)) {
    console.warn(`Invalid journey ID: ${journeyId}`);
  }
  
  const basePath = `/${journeyId}`;
  
  if (!subPath) {
    return basePath;
  }
  
  // Remove leading slash from subPath if present
  const normalizedSubPath = subPath.startsWith('/') ? subPath.slice(1) : subPath;
  
  return `${basePath}/${normalizedSubPath}`;
};

/**
 * Extracts the sub-path from a journey path
 * 
 * @param path - The full journey path
 * @returns The sub-path without the journey ID prefix, or null if not a valid journey path
 * 
 * @example
 * // Returns 'dashboard'
 * extractSubPath('/health/dashboard')
 * 
 * @example
 * // Returns 'appointments/123'
 * extractSubPath('/care/appointments/123')
 * 
 * @example
 * // Returns ''
 * extractSubPath('/plan')
 * 
 * @example
 * // Returns null
 * extractSubPath('/auth/login')
 */
export const extractSubPath = (path: string): string | null => {
  const normalizedPath = normalizePath(path);
  const journeyId = extractJourneyId(normalizedPath);
  
  if (!journeyId) {
    return null;
  }
  
  // Remove the journey ID prefix from the path
  const journeyPrefix = `/${journeyId}`;
  
  if (normalizedPath === journeyPrefix) {
    return '';
  }
  
  return normalizedPath.slice(journeyPrefix.length + 1); // +1 for the slash
};

/**
 * Converts a web path to a mobile screen name based on journey and sub-path
 * 
 * This is useful for deep linking and navigation between platforms
 * 
 * @param webPath - The web path to convert
 * @returns The corresponding mobile screen name, or null if not a valid journey path
 * 
 * @example
 * // Returns 'HealthDashboard'
 * webPathToMobileScreen('/health/dashboard')
 * 
 * @example
 * // Returns 'Appointments'
 * webPathToMobileScreen('/care/appointments')
 */
export const webPathToMobileScreen = (webPath: string): string | null => {
  const journeyId = extractJourneyId(webPath);
  const subPath = extractSubPath(webPath);
  
  if (!journeyId) {
    return null;
  }
  
  // Simple mapping of common paths to screen names
  // This could be expanded or made more sophisticated as needed
  const screenMappings: Record<string, Record<string, string>> = {
    health: {
      '': 'HealthDashboard',
      'dashboard': 'HealthDashboard',
      'metrics': 'HealthMetrics',
      'goals': 'HealthGoals',
      'devices': 'DeviceConnection',
      'history': 'MedicalHistory',
    },
    care: {
      '': 'CareDashboard',
      'dashboard': 'CareDashboard',
      'appointments': 'Appointments',
      'telemedicine': 'Telemedicine',
      'symptom-checker': 'SymptomChecker',
      'medications': 'MedicationTracking',
      'treatment-plans': 'TreatmentPlan',
    },
    plan: {
      '': 'PlanDashboard',
      'dashboard': 'PlanDashboard',
      'coverage': 'Coverage',
      'card': 'DigitalCard',
      'claims': 'ClaimHistory',
      'simulator': 'CostSimulator',
      'benefits': 'Benefits',
    },
  };
  
  // Return the mapped screen name or null if no mapping exists
  return subPath !== null && screenMappings[journeyId] && screenMappings[journeyId][subPath]
    ? screenMappings[journeyId][subPath]
    : null;
};

/**
 * Converts a mobile screen name to a web path
 * 
 * This is useful for deep linking and navigation between platforms
 * 
 * @param screenName - The mobile screen name to convert
 * @returns The corresponding web path, or null if no mapping exists
 * 
 * @example
 * // Returns '/health/dashboard'
 * mobileScreenToWebPath('HealthDashboard')
 * 
 * @example
 * // Returns '/care/appointments'
 * mobileScreenToWebPath('Appointments')
 */
export const mobileScreenToWebPath = (screenName: string): string | null => {
  // Mapping of screen names to web paths
  // This is the inverse of the mapping in webPathToMobileScreen
  const pathMappings: Record<string, string> = {
    // Health journey screens
    'HealthDashboard': '/health/dashboard',
    'HealthMetrics': '/health/metrics',
    'HealthGoals': '/health/goals',
    'DeviceConnection': '/health/devices',
    'MedicalHistory': '/health/history',
    'AddMetric': '/health/metrics/add',
    'MetricDetail': '/health/metrics/detail',
    
    // Care journey screens
    'CareDashboard': '/care',
    'Appointments': '/care/appointments',
    'AppointmentBooking': '/care/appointments/book',
    'Telemedicine': '/care/telemedicine',
    'SymptomChecker': '/care/symptom-checker',
    'MedicationTracking': '/care/medications',
    'TreatmentPlan': '/care/treatment-plans',
    
    // Plan journey screens
    'PlanDashboard': '/plan',
    'Coverage': '/plan/coverage',
    'DigitalCard': '/plan/card',
    'ClaimHistory': '/plan/claims',
    'ClaimSubmission': '/plan/claims/submit',
    'CostSimulator': '/plan/simulator',
    'Benefits': '/plan/benefits',
  };
  
  return pathMappings[screenName] || null;
};