/**
 * Routes constant definitions for the AUSTA SuperApp.
 * This file provides a unified, platform-agnostic approach to route definitions
 * that works across both web (path-based) and mobile (name-based) platforms.
 */

import { JourneyId, JOURNEY_IDS } from '../types';

/**
 * Route configuration interface for platform-agnostic route definitions
 */
export interface RouteConfig {
  /** Web path for the route (e.g., '/health/dashboard') */
  path: string;
  /** Mobile screen name for the route (e.g., 'HealthDashboard') */
  screen: string;
  /** Whether this route requires authentication */
  requiresAuth: boolean;
  /** The journey this route belongs to (null for universal routes) */
  journeyId: JourneyId | null;
}

/**
 * Route parameter interface for dynamic route segments
 */
export interface RouteParams {
  [key: string]: string | number;
}

/**
 * Universal routes that are not specific to any journey
 */
export const UNIVERSAL_ROUTES = {
  HOME: {
    path: '/',
    screen: 'Home',
    requiresAuth: true,
    journeyId: null,
  } as RouteConfig,
  
  AUTH: {
    path: '/auth',
    screen: 'Auth',
    requiresAuth: false,
    journeyId: null,
  } as RouteConfig,
  
  LOGIN: {
    path: '/auth/login',
    screen: 'AuthLogin',
    requiresAuth: false,
    journeyId: null,
  } as RouteConfig,
  
  REGISTER: {
    path: '/auth/register',
    screen: 'AuthRegister',
    requiresAuth: false,
    journeyId: null,
  } as RouteConfig,
  
  FORGOT_PASSWORD: {
    path: '/auth/forgot-password',
    screen: 'AuthForgotPassword',
    requiresAuth: false,
    journeyId: null,
  } as RouteConfig,
  
  MFA: {
    path: '/auth/mfa',
    screen: 'AuthMFA',
    requiresAuth: false,
    journeyId: null,
  } as RouteConfig,
  
  ACHIEVEMENTS: {
    path: '/achievements',
    screen: 'Achievements',
    requiresAuth: true,
    journeyId: null,
  } as RouteConfig,
  
  NOTIFICATIONS: {
    path: '/notifications',
    screen: 'Notifications',
    requiresAuth: true,
    journeyId: null,
  } as RouteConfig,
  
  PROFILE: {
    path: '/profile',
    screen: 'Profile',
    requiresAuth: true,
    journeyId: null,
  } as RouteConfig,
  
  SETTINGS: {
    path: '/settings',
    screen: 'Settings',
    requiresAuth: true,
    journeyId: null,
  } as RouteConfig,
};

/**
 * Health Journey routes ("My Health")
 */
export const HEALTH_ROUTES = {
  ROOT: {
    path: '/health',
    screen: 'HealthDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  DASHBOARD: {
    path: '/health/dashboard',
    screen: 'HealthDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  MEDICAL_HISTORY: {
    path: '/health/history',
    screen: 'HealthMedicalHistory',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  HEALTH_GOALS: {
    path: '/health/goals',
    screen: 'HealthGoals',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  DEVICE_CONNECTION: {
    path: '/health/devices',
    screen: 'HealthDeviceConnection',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  METRIC_DETAIL: {
    path: '/health/metrics/:id',
    screen: 'HealthMetricDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
  
  HEALTH_INSIGHTS: {
    path: '/health/insights',
    screen: 'HealthInsights',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.HEALTH,
  } as RouteConfig,
};

/**
 * Care Journey routes ("Care Now")
 */
export const CARE_ROUTES = {
  ROOT: {
    path: '/care',
    screen: 'CareDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  DASHBOARD: {
    path: '/care/dashboard',
    screen: 'CareDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  SYMPTOM_CHECKER: {
    path: '/care/symptoms',
    screen: 'CareSymptomChecker',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  APPOINTMENTS: {
    path: '/care/appointments',
    screen: 'CareAppointments',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  APPOINTMENT_DETAIL: {
    path: '/care/appointments/:id',
    screen: 'CareAppointmentDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  APPOINTMENT_BOOKING: {
    path: '/care/appointments/book',
    screen: 'CareAppointmentBooking',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  TELEMEDICINE: {
    path: '/care/telemedicine',
    screen: 'CareTelemedicine',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  TELEMEDICINE_SESSION: {
    path: '/care/telemedicine/:id',
    screen: 'CareTelemedicineSession',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  MEDICATIONS: {
    path: '/care/medications',
    screen: 'CareMedicationTracking',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  MEDICATION_DETAIL: {
    path: '/care/medications/:id',
    screen: 'CareMedicationDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  TREATMENT_PLANS: {
    path: '/care/treatment-plans',
    screen: 'CareTreatmentPlans',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
  
  TREATMENT_PLAN_DETAIL: {
    path: '/care/treatment-plans/:id',
    screen: 'CareTreatmentPlanDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.CARE,
  } as RouteConfig,
};

/**
 * Plan Journey routes ("My Plan & Benefits")
 */
export const PLAN_ROUTES = {
  ROOT: {
    path: '/plan',
    screen: 'PlanDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  DASHBOARD: {
    path: '/plan/dashboard',
    screen: 'PlanDashboard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  COVERAGE: {
    path: '/plan/coverage',
    screen: 'PlanCoverage',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  DIGITAL_CARD: {
    path: '/plan/card',
    screen: 'PlanDigitalCard',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  CLAIMS: {
    path: '/plan/claims',
    screen: 'PlanClaims',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  CLAIM_SUBMISSION: {
    path: '/plan/claims/submit',
    screen: 'PlanClaimSubmission',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  CLAIM_DETAIL: {
    path: '/plan/claims/:id',
    screen: 'PlanClaimDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  COST_SIMULATOR: {
    path: '/plan/simulator',
    screen: 'PlanCostSimulator',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  BENEFITS: {
    path: '/plan/benefits',
    screen: 'PlanBenefits',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
  
  BENEFIT_DETAIL: {
    path: '/plan/benefits/:id',
    screen: 'PlanBenefitDetail',
    requiresAuth: true,
    journeyId: JOURNEY_IDS.PLAN,
  } as RouteConfig,
};

/**
 * Combined routes object with all routes organized by journey
 */
export const ROUTES = {
  ...UNIVERSAL_ROUTES,
  HEALTH: HEALTH_ROUTES,
  CARE: CARE_ROUTES,
  PLAN: PLAN_ROUTES,
  
  /**
   * Generates a route path with parameters for web navigation
   * @param route The route configuration or path string
   * @param params Optional parameters to replace in the route path
   * @returns The fully qualified route path with parameters replaced
   */
  getRoutePath: (route: RouteConfig | string, params?: RouteParams): string => {
    const path = typeof route === 'string' ? route : route.path;
    
    if (!params) return path;
    
    let result = path;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
    
    return result;
  },
  
  /**
   * Gets the screen name for mobile navigation
   * @param route The route configuration
   * @returns The screen name for React Navigation
   */
  getScreenName: (route: RouteConfig): string => {
    return route.screen;
  },
  
  /**
   * Determines if a route belongs to a specific journey
   * @param route The route configuration or path string
   * @param journeyId The journey ID to check against
   * @returns True if the route belongs to the specified journey
   */
  isJourneyRoute: (route: RouteConfig | string, journeyId: JourneyId): boolean => {
    if (typeof route === 'string') {
      // Check path prefix for string routes
      const journeyPath = `/${journeyId.toLowerCase()}`;
      return route.startsWith(journeyPath);
    }
    
    return route.journeyId === journeyId;
  },
  
  /**
   * Gets the journey ID from a route path
   * @param path The route path
   * @returns The journey ID or null if not a journey route
   */
  getJourneyFromPath: (path: string): JourneyId | null => {
    if (path.startsWith('/health')) return JOURNEY_IDS.HEALTH;
    if (path.startsWith('/care')) return JOURNEY_IDS.CARE;
    if (path.startsWith('/plan')) return JOURNEY_IDS.PLAN;
    return null;
  },
  
  /**
   * Gets a localized journey title from a route path
   * @param path The route path
   * @returns The localized journey title or default app name
   */
  getJourneyTitle: (path: string): string => {
    const journeyId = ROUTES.getJourneyFromPath(path);
    if (!journeyId) return 'AUSTA SuperApp';
    
    // These would typically come from a localization file or constants
    switch (journeyId) {
      case JOURNEY_IDS.HEALTH:
        return 'Minha Saúde';
      case JOURNEY_IDS.CARE:
        return 'Cuidar-me Agora';
      case JOURNEY_IDS.PLAN:
        return 'Meu Plano & Benefícios';
      default:
        return 'AUSTA SuperApp';
    }
  },
  
  /**
   * Gets all routes for a specific journey
   * @param journeyId The journey ID
   * @returns An object containing all routes for the specified journey
   */
  getJourneyRoutes: (journeyId: JourneyId): Record<string, RouteConfig> => {
    switch (journeyId) {
      case JOURNEY_IDS.HEALTH:
        return HEALTH_ROUTES;
      case JOURNEY_IDS.CARE:
        return CARE_ROUTES;
      case JOURNEY_IDS.PLAN:
        return PLAN_ROUTES;
      default:
        return {};
    }
  },
  
  /**
   * Gets the root route for a specific journey
   * @param journeyId The journey ID
   * @returns The root route configuration for the specified journey
   */
  getJourneyRootRoute: (journeyId: JourneyId): RouteConfig => {
    switch (journeyId) {
      case JOURNEY_IDS.HEALTH:
        return HEALTH_ROUTES.ROOT;
      case JOURNEY_IDS.CARE:
        return CARE_ROUTES.ROOT;
      case JOURNEY_IDS.PLAN:
        return PLAN_ROUTES.ROOT;
      default:
        return UNIVERSAL_ROUTES.HOME;
    }
  },
  
  /**
   * Determines if a route requires authentication
   * @param route The route configuration or path string
   * @returns True if the route requires authentication
   */
  requiresAuth: (route: RouteConfig | string): boolean => {
    if (typeof route === 'string') {
      // Check all routes to find a match
      const allRoutes = [
        ...Object.values(UNIVERSAL_ROUTES),
        ...Object.values(HEALTH_ROUTES),
        ...Object.values(CARE_ROUTES),
        ...Object.values(PLAN_ROUTES),
      ];
      
      const matchingRoute = allRoutes.find(r => r.path === route);
      return matchingRoute ? matchingRoute.requiresAuth : true; // Default to requiring auth
    }
    
    return route.requiresAuth;
  },
  
  /**
   * Finds a route configuration by path
   * @param path The route path to find
   * @returns The matching route configuration or undefined if not found
   */
  findRouteByPath: (path: string): RouteConfig | undefined => {
    const allRoutes = [
      ...Object.values(UNIVERSAL_ROUTES),
      ...Object.values(HEALTH_ROUTES),
      ...Object.values(CARE_ROUTES),
      ...Object.values(PLAN_ROUTES),
    ];
    
    // Handle dynamic routes by checking for path patterns
    return allRoutes.find(route => {
      if (route.path === path) return true;
      
      // Check if this is a dynamic route with parameters
      if (route.path.includes(':')) {
        const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
        const regex = new RegExp(`^${routePattern}$`);
        return regex.test(path);
      }
      
      return false;
    });
  },
  
  /**
   * Finds a route configuration by screen name
   * @param screenName The screen name to find
   * @returns The matching route configuration or undefined if not found
   */
  findRouteByScreen: (screenName: string): RouteConfig | undefined => {
    const allRoutes = [
      ...Object.values(UNIVERSAL_ROUTES),
      ...Object.values(HEALTH_ROUTES),
      ...Object.values(CARE_ROUTES),
      ...Object.values(PLAN_ROUTES),
    ];
    
    return allRoutes.find(route => route.screen === screenName);
  },
};