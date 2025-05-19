/**
 * Routes constant definitions for the AUSTA SuperApp
 * This file provides a centralized repository of all route names used for navigation
 * throughout the mobile application, organized by journey.
 *
 * The routes are organized by journey categories and provide type safety through
 * TypeScript namespace patterns. This ensures consistent navigation throughout the app
 * and compatibility with React Navigation's navigation structure.
 */

/**
 * Application route constants with TypeScript type safety
 */
export namespace Routes {
  /**
   * Navigator types for React Navigation
   */
  export enum NavigatorType {
    APP = 'AppNavigator',
    AUTH = 'AuthNavigator',
    HOME = 'HomeNavigator',
    HEALTH = 'HealthNavigator',
    CARE = 'CareNavigator',
    PLAN = 'PlanNavigator',
  }

  /**
   * Universal/Global Routes
   */
  export enum Global {
    HOME = 'Home',
    NOTIFICATIONS = 'Notifications',
    PROFILE = 'Profile',
    SETTINGS = 'Settings',
    ACHIEVEMENTS = 'Achievements',
  }

  /**
   * Authentication Routes
   */
  export enum Auth {
    LOGIN = 'AuthLogin',
    REGISTER = 'AuthRegister',
    FORGOT_PASSWORD = 'AuthForgotPassword',
    MFA = 'AuthMFA',
  }

  /**
   * My Health Journey Routes (Green)
   */
  export enum Health {
    DASHBOARD = 'HealthDashboard',
    MEDICAL_HISTORY = 'HealthMedicalHistory',
    HEALTH_GOALS = 'HealthGoals',
    ADD_GOAL = 'AddHealthGoal',
    DEVICE_CONNECTION = 'HealthDeviceConnection',
    METRIC_DETAIL = 'HealthMetricDetail',
    ADD_METRIC = 'AddHealthMetric',
  }

  /**
   * Care Now Journey Routes (Orange)
   */
  export enum Care {
    DASHBOARD = 'CareDashboard',
    APPOINTMENTS = 'CareAppointments',
    APPOINTMENT_DETAIL = 'CareAppointmentDetail',
    APPOINTMENT_BOOKING = 'CareAppointmentBooking',
    PROVIDER_SEARCH = 'CareProviderSearch',
    TELEMEDICINE = 'CareTelemedicine',
    MEDICATION_TRACKING = 'CareMedicationTracking',
    SYMPTOM_CHECKER = 'CareSymptomChecker',
    TREATMENT_PLAN = 'CareTreatmentPlan',
  }

  /**
   * My Plan & Benefits Journey Routes (Blue)
   */
  export enum Plan {
    DASHBOARD = 'PlanDashboard',
    COVERAGE = 'PlanCoverage',
    DIGITAL_CARD = 'PlanDigitalCard',
    CLAIMS = 'PlanClaims',
    CLAIM_HISTORY = 'PlanClaimHistory',
    CLAIM_DETAIL = 'PlanClaimDetail',
    CLAIM_SUBMISSION = 'PlanClaimSubmission',
    COST_SIMULATOR = 'PlanCostSimulator',
    BENEFITS = 'PlanBenefits',
  }
}

/**
 * Legacy ROUTES object for backward compatibility
 * @deprecated Use Routes namespace instead for type safety
 */
export const ROUTES = {
  // Universal/Global Routes
  HOME: Routes.Global.HOME,
  NOTIFICATIONS: Routes.Global.NOTIFICATIONS,
  PROFILE: Routes.Global.PROFILE,
  SETTINGS: Routes.Global.SETTINGS,
  ACHIEVEMENTS: Routes.Global.ACHIEVEMENTS,
  
  // Authentication Routes
  AUTH_LOGIN: Routes.Auth.LOGIN,
  AUTH_REGISTER: Routes.Auth.REGISTER,
  AUTH_FORGOT_PASSWORD: Routes.Auth.FORGOT_PASSWORD,
  AUTH_MFA: Routes.Auth.MFA,
  
  // My Health Journey Routes (Green)
  HEALTH_DASHBOARD: Routes.Health.DASHBOARD,
  HEALTH_MEDICAL_HISTORY: Routes.Health.MEDICAL_HISTORY,
  HEALTH_HEALTH_GOALS: Routes.Health.HEALTH_GOALS,
  HEALTH_ADD_GOAL: Routes.Health.ADD_GOAL,
  HEALTH_DEVICE_CONNECTION: Routes.Health.DEVICE_CONNECTION,
  HEALTH_METRIC_DETAIL: Routes.Health.METRIC_DETAIL,
  HEALTH_ADD_METRIC: Routes.Health.ADD_METRIC,
  
  // Care Now Journey Routes (Orange)
  CARE_DASHBOARD: Routes.Care.DASHBOARD,
  CARE_APPOINTMENTS: Routes.Care.APPOINTMENTS,
  CARE_APPOINTMENT_DETAIL: Routes.Care.APPOINTMENT_DETAIL,
  CARE_APPOINTMENT_BOOKING: Routes.Care.APPOINTMENT_BOOKING,
  CARE_PROVIDER_SEARCH: Routes.Care.PROVIDER_SEARCH,
  CARE_TELEMEDICINE: Routes.Care.TELEMEDICINE,
  CARE_MEDICATION_TRACKING: Routes.Care.MEDICATION_TRACKING,
  CARE_SYMPTOM_CHECKER: Routes.Care.SYMPTOM_CHECKER,
  CARE_TREATMENT_PLAN: Routes.Care.TREATMENT_PLAN,
  
  // My Plan & Benefits Journey Routes (Blue)
  PLAN_DASHBOARD: Routes.Plan.DASHBOARD,
  PLAN_COVERAGE: Routes.Plan.COVERAGE,
  PLAN_DIGITAL_CARD: Routes.Plan.DIGITAL_CARD,
  PLAN_CLAIMS: Routes.Plan.CLAIMS,
  PLAN_CLAIM_HISTORY: Routes.Plan.CLAIM_HISTORY,
  PLAN_CLAIM_DETAIL: Routes.Plan.CLAIM_DETAIL,
  PLAN_CLAIM_SUBMISSION: Routes.Plan.CLAIM_SUBMISSION,
  PLAN_COST_SIMULATOR: Routes.Plan.COST_SIMULATOR,
  PLAN_BENEFITS: Routes.Plan.BENEFITS,
};