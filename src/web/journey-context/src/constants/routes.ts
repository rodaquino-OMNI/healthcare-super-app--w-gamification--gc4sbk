/**
 * Routes constant definitions for the AUSTA SuperApp
 * 
 * This file provides a centralized repository of all route constants used for navigation
 * throughout the application, organized by journey. It supports both web and mobile platforms
 * through platform-agnostic route definitions with platform-specific adapters.
 */

/**
 * Journey names used for navigation and context
 */
export const JOURNEY_NAMES = {
  HEALTH: 'Minha Saúde',
  CARE: 'Cuidar-me Agora',
  PLAN: 'Meu Plano & Benefícios'
};

/**
 * Platform types supported by the application
 */
export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile'
}

/**
 * Interface for route configuration with platform-specific paths
 */
export interface RouteConfig {
  /** Web path for the route (e.g., '/health/dashboard') */
  web: string;
  /** Mobile screen name for the route (e.g., 'HealthDashboard') */
  mobile: string;
  /** Optional parameters that this route accepts */
  params?: string[];
}

/**
 * Type for route parameters used in navigation
 */
export type RouteParams = Record<string, string | number>;

/**
 * Application routes for navigation and routing configuration
 */
export const ROUTES = {
  // Universal routes
  HOME: {
    web: '/',
    mobile: 'Home'
  } as RouteConfig,
  
  AUTH: {
    web: '/auth',
    mobile: 'Auth'
  } as RouteConfig,
  
  AUTH_LOGIN: {
    web: '/auth/login',
    mobile: 'AuthLogin'
  } as RouteConfig,
  
  AUTH_REGISTER: {
    web: '/auth/register',
    mobile: 'AuthRegister'
  } as RouteConfig,
  
  AUTH_FORGOT_PASSWORD: {
    web: '/auth/forgot-password',
    mobile: 'AuthForgotPassword'
  } as RouteConfig,
  
  AUTH_MFA: {
    web: '/auth/mfa',
    mobile: 'AuthMFA'
  } as RouteConfig,
  
  ACHIEVEMENTS: {
    web: '/achievements',
    mobile: 'Achievements'
  } as RouteConfig,
  
  NOTIFICATIONS: {
    web: '/notifications',
    mobile: 'Notifications'
  } as RouteConfig,
  
  PROFILE: {
    web: '/profile',
    mobile: 'Profile'
  } as RouteConfig,
  
  SETTINGS: {
    web: '/settings',
    mobile: 'Settings'
  } as RouteConfig,

  // Health Journey routes
  HEALTH: {
    ROOT: {
      web: '/health',
      mobile: 'Health'
    } as RouteConfig,
    
    DASHBOARD: {
      web: '/health/dashboard',
      mobile: 'HealthDashboard'
    } as RouteConfig,
    
    MEDICAL_HISTORY: {
      web: '/health/history',
      mobile: 'HealthMedicalHistory'
    } as RouteConfig,
    
    HEALTH_GOALS: {
      web: '/health/goals',
      mobile: 'HealthGoals'
    } as RouteConfig,
    
    DEVICE_CONNECTION: {
      web: '/health/devices',
      mobile: 'HealthDeviceConnection'
    } as RouteConfig,
    
    METRIC_DETAIL: {
      web: '/health/metrics/:id',
      mobile: 'HealthMetricDetail',
      params: ['id']
    } as RouteConfig,
    
    HEALTH_INSIGHTS: {
      web: '/health/insights',
      mobile: 'HealthInsights'
    } as RouteConfig,
  },

  // Care Journey routes
  CARE: {
    ROOT: {
      web: '/care',
      mobile: 'Care'
    } as RouteConfig,
    
    SYMPTOM_CHECKER: {
      web: '/care/symptoms',
      mobile: 'CareSymptomChecker'
    } as RouteConfig,
    
    APPOINTMENTS: {
      web: '/care/appointments',
      mobile: 'CareAppointments'
    } as RouteConfig,
    
    APPOINTMENT_DETAIL: {
      web: '/care/appointments/:id',
      mobile: 'CareAppointmentDetail',
      params: ['id']
    } as RouteConfig,
    
    APPOINTMENT_BOOKING: {
      web: '/care/appointments/book',
      mobile: 'CareAppointmentBooking'
    } as RouteConfig,
    
    TELEMEDICINE: {
      web: '/care/telemedicine',
      mobile: 'CareTelemedicine'
    } as RouteConfig,
    
    TELEMEDICINE_SESSION: {
      web: '/care/telemedicine/:id',
      mobile: 'CareTelemedicineSession',
      params: ['id']
    } as RouteConfig,
    
    MEDICATIONS: {
      web: '/care/medications',
      mobile: 'CareMedicationTracking'
    } as RouteConfig,
    
    MEDICATION_DETAIL: {
      web: '/care/medications/:id',
      mobile: 'CareMedicationDetail',
      params: ['id']
    } as RouteConfig,
    
    TREATMENT_PLANS: {
      web: '/care/treatment-plans',
      mobile: 'CareTreatmentPlans'
    } as RouteConfig,
    
    TREATMENT_PLAN_DETAIL: {
      web: '/care/treatment-plans/:id',
      mobile: 'CareTreatmentPlanDetail',
      params: ['id']
    } as RouteConfig,
  },

  // Plan Journey routes
  PLAN: {
    ROOT: {
      web: '/plan',
      mobile: 'PlanDashboard'
    } as RouteConfig,
    
    COVERAGE: {
      web: '/plan/coverage',
      mobile: 'PlanCoverage'
    } as RouteConfig,
    
    DIGITAL_CARD: {
      web: '/plan/card',
      mobile: 'PlanDigitalCard'
    } as RouteConfig,
    
    CLAIMS: {
      web: '/plan/claims',
      mobile: 'PlanClaims'
    } as RouteConfig,
    
    CLAIM_SUBMISSION: {
      web: '/plan/claims/submit',
      mobile: 'PlanClaimSubmission'
    } as RouteConfig,
    
    CLAIM_DETAIL: {
      web: '/plan/claims/:id',
      mobile: 'PlanClaimDetail',
      params: ['id']
    } as RouteConfig,
    
    COST_SIMULATOR: {
      web: '/plan/simulator',
      mobile: 'PlanCostSimulator'
    } as RouteConfig,
    
    BENEFITS: {
      web: '/plan/benefits',
      mobile: 'PlanBenefits'
    } as RouteConfig,
    
    BENEFIT_DETAIL: {
      web: '/plan/benefits/:id',
      mobile: 'PlanBenefitDetail',
      params: ['id']
    } as RouteConfig,
  },

  /**
   * Generates a route path for the specified platform with optional parameters
   * 
   * @param route - The route configuration object
   * @param platform - The target platform (web or mobile)
   * @param params - Optional parameters to include in the route
   * @returns The platform-specific route path with parameters
   * 
   * @example
   * // Returns '/health/metrics/123' for web
   * getRoutePath(ROUTES.HEALTH.METRIC_DETAIL, Platform.WEB, { id: '123' })
   * 
   * // Returns 'HealthMetricDetail' with params for mobile
   * getRoutePath(ROUTES.HEALTH.METRIC_DETAIL, Platform.MOBILE, { id: '123' })
   */
  getRoutePath: (route: RouteConfig, platform: Platform, params?: RouteParams): string => {
    if (!params) {
      return platform === Platform.WEB ? route.web : route.mobile;
    }
    
    if (platform === Platform.WEB) {
      let path = route.web;
      Object.entries(params).forEach(([key, value]) => {
        path = path.replace(`:${key}`, value.toString());
      });
      return path;
    } else {
      // For mobile, we return the screen name - params will be passed separately in navigation
      return route.mobile;
    }
  },

  /**
   * Extracts parameters from a route path
   * 
   * @param routeConfig - The route configuration
   * @param path - The actual path to extract parameters from
   * @returns Object containing extracted parameters
   * 
   * @example
   * // Returns { id: '123' }
   * extractParamsFromPath(ROUTES.HEALTH.METRIC_DETAIL, '/health/metrics/123')
   */
  extractParamsFromPath: (routeConfig: RouteConfig, path: string): RouteParams => {
    if (!routeConfig.params || routeConfig.params.length === 0) {
      return {};
    }

    const params: RouteParams = {};
    const pathTemplate = routeConfig.web;
    const pathParts = path.split('/');
    const templateParts = pathTemplate.split('/');

    for (let i = 0; i < templateParts.length; i++) {
      const part = templateParts[i];
      if (part.startsWith(':')) {
        const paramName = part.substring(1);
        if (i < pathParts.length) {
          params[paramName] = pathParts[i];
        }
      }
    }

    return params;
  },

  /**
   * Determines if a path belongs to a specific journey
   * 
   * @param path - The path to check
   * @param journey - The journey to check against ('health', 'care', or 'plan')
   * @returns True if the path belongs to the specified journey
   * 
   * @example
   * // Returns true
   * isJourneyPath('/health/metrics', 'health')
   */
  isJourneyPath: (path: string, journey: 'health' | 'care' | 'plan'): boolean => {
    return path.startsWith(`/${journey}`);
  },

  /**
   * Gets the journey name based on the current path
   * 
   * @param path - The current path
   * @returns The journey name or default app name
   * 
   * @example
   * // Returns 'Minha Saúde'
   * getJourneyTitle('/health/dashboard')
   */
  getJourneyTitle: (path: string): string => {
    if (path.startsWith('/health')) return JOURNEY_NAMES.HEALTH;
    if (path.startsWith('/care')) return JOURNEY_NAMES.CARE;
    if (path.startsWith('/plan')) return JOURNEY_NAMES.PLAN;
    return 'AUSTA SuperApp';
  },

  /**
   * Gets the journey color based on the current path
   * 
   * @param path - The current path
   * @returns The journey color key ('health', 'care', 'plan', or 'default')
   * 
   * @example
   * // Returns 'health'
   * getJourneyColor('/health/dashboard')
   */
  getJourneyColor: (path: string): 'health' | 'care' | 'plan' | 'default' => {
    if (path.startsWith('/health')) return 'health';
    if (path.startsWith('/care')) return 'care';
    if (path.startsWith('/plan')) return 'plan';
    return 'default';
  },
};