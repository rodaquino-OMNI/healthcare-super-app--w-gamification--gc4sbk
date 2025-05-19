/**
 * Routes constant definitions for the AUSTA SuperApp web application.
 * Organized by user journey to maintain clear navigation structure.
 */

import { JOURNEY_NAMES } from '@austa/journey-context/constants';
import { Dictionary } from '@austa/interfaces/common/types';

/**
 * Interface for route parameters used in path generation
 */
export interface RouteParams extends Dictionary<string> {}

/**
 * Interface for journey-specific routes
 */
export interface JourneyRoutes {
  ROOT: string;
  [key: string]: string;
}

/**
 * Interface for application routes
 */
export interface AppRoutes {
  // Universal routes
  HOME: string;
  AUTH: string;
  ACHIEVEMENTS: string;
  NOTIFICATIONS: string;
  PROFILE: string;
  SETTINGS: string;

  // Journey-specific routes
  HEALTH: JourneyRoutes;
  CARE: JourneyRoutes;
  PLAN: JourneyRoutes;

  // Helper functions
  getRoutePath: (route: string, params?: RouteParams) => string;
  getJourneyTitle: (path: string) => string;
}

/**
 * Application routes for navigation and routing configuration
 */
export const ROUTES: AppRoutes = {
  // Universal routes
  HOME: '/',
  AUTH: '/auth',
  ACHIEVEMENTS: '/achievements',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',

  // Health Journey routes
  HEALTH: {
    ROOT: '/health',
    DASHBOARD: '/health/dashboard',
    MEDICAL_HISTORY: '/health/history',
    HEALTH_GOALS: '/health/goals',
    DEVICE_CONNECTION: '/health/devices',
    METRIC_DETAIL: '/health/metrics/:id',
    HEALTH_INSIGHTS: '/health/insights',
  },

  // Care Journey routes
  CARE: {
    ROOT: '/care',
    SYMPTOM_CHECKER: '/care/symptoms',
    APPOINTMENTS: '/care/appointments',
    APPOINTMENT_DETAIL: '/care/appointments/:id',
    APPOINTMENT_BOOKING: '/care/appointments/book',
    TELEMEDICINE: '/care/telemedicine',
    TELEMEDICINE_SESSION: '/care/telemedicine/:id',
    MEDICATIONS: '/care/medications',
    MEDICATION_DETAIL: '/care/medications/:id',
    TREATMENT_PLANS: '/care/treatment-plans',
    TREATMENT_PLAN_DETAIL: '/care/treatment-plans/:id',
  },

  // Plan Journey routes
  PLAN: {
    ROOT: '/plan',
    COVERAGE: '/plan/coverage',
    DIGITAL_CARD: '/plan/card',
    CLAIMS: '/plan/claims',
    CLAIM_SUBMISSION: '/plan/claims/submit',
    CLAIM_DETAIL: '/plan/claims/:id',
    COST_SIMULATOR: '/plan/simulator',
    BENEFITS: '/plan/benefits',
    BENEFIT_DETAIL: '/plan/benefits/:id',
  },

  /**
   * Generates a fully qualified route path with parameters
   * @param route - The route template with parameter placeholders
   * @param params - Object containing parameter values to substitute
   * @returns The route with parameters substituted
   */
  getRoutePath: (route: string, params?: RouteParams): string => {
    if (!params) return route;
    
    let path = route;
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
    
    return path;
  },

  /**
   * Gets the journey title based on the current route path
   * @param path - The current route path
   * @returns The journey title or default app name
   */
  getJourneyTitle: (path: string): string => {
    if (path.startsWith('/health')) return JOURNEY_NAMES.HEALTH;
    if (path.startsWith('/care')) return JOURNEY_NAMES.CARE;
    if (path.startsWith('/plan')) return JOURNEY_NAMES.PLAN;
    return 'AUSTA SuperApp';
  },
};