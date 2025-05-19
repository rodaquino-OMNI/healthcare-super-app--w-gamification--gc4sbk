/**
 * API Constants Module
 * 
 * This module defines the API endpoints and related constants for the AUSTA SuperApp.
 * It centralizes API URL configuration, endpoint paths, and query parameter keys
 * to maintain consistency across all API calls in the application.
 *
 * @module api
 */

import { JOURNEY_IDS, JourneyId } from '@austa/interfaces/common';

/**
 * Base API configuration
 */
export const API_CONFIG = {
  /**
   * Base URL for all API requests
   * Falls back to localhost in development environment
   */
  BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
  
  /**
   * API version prefix
   * Used for versioned API endpoints
   */
  VERSION_PREFIX: 'v1',
  
  /**
   * Default request timeout in milliseconds
   */
  DEFAULT_TIMEOUT: 30000,
  
  /**
   * Maximum number of retries for failed requests
   */
  MAX_RETRIES: 3,
};

/**
 * Journey-specific API endpoints
 * Maps journey IDs to their respective API base paths
 */
export const JOURNEY_API_PATHS: Record<JourneyId, string> = {
  [JOURNEY_IDS.HEALTH]: `${API_CONFIG.BASE_URL}/${JOURNEY_IDS.HEALTH}`,
  [JOURNEY_IDS.CARE]: `${API_CONFIG.BASE_URL}/${JOURNEY_IDS.CARE}`,
  [JOURNEY_IDS.PLAN]: `${API_CONFIG.BASE_URL}/${JOURNEY_IDS.PLAN}`,
};

/**
 * Authentication API endpoints
 */
export const AUTH_API = {
  BASE_PATH: `${API_CONFIG.BASE_URL}/auth`,
  ENDPOINTS: {
    LOGIN: '/login',
    REGISTER: '/register',
    REFRESH_TOKEN: '/refresh-token',
    LOGOUT: '/logout',
    VERIFY_EMAIL: '/verify-email',
    RESET_PASSWORD: '/reset-password',
    CHANGE_PASSWORD: '/change-password',
    PROFILE: '/profile',
    MFA: '/mfa',
  },
};

/**
 * Health Journey API endpoints
 */
export const HEALTH_API = {
  BASE_PATH: JOURNEY_API_PATHS[JOURNEY_IDS.HEALTH],
  ENDPOINTS: {
    METRICS: '/metrics',
    GOALS: '/goals',
    MEDICAL_HISTORY: '/medical-history',
    DEVICES: '/devices',
    INSIGHTS: '/insights',
  },
};

/**
 * Care Journey API endpoints
 */
export const CARE_API = {
  BASE_PATH: JOURNEY_API_PATHS[JOURNEY_IDS.CARE],
  ENDPOINTS: {
    APPOINTMENTS: '/appointments',
    TELEMEDICINE: '/telemedicine',
    PROVIDERS: '/providers',
    MEDICATIONS: '/medications',
    TREATMENTS: '/treatments',
    SYMPTOM_CHECKER: '/symptom-checker',
  },
};

/**
 * Plan Journey API endpoints
 */
export const PLAN_API = {
  BASE_PATH: JOURNEY_API_PATHS[JOURNEY_IDS.PLAN],
  ENDPOINTS: {
    COVERAGE: '/coverage',
    CLAIMS: '/claims',
    BENEFITS: '/benefits',
    DOCUMENTS: '/documents',
    PLANS: '/plans',
  },
};

/**
 * Gamification API endpoints
 */
export const GAMIFICATION_API = {
  BASE_PATH: `${API_CONFIG.BASE_URL}/gamification`,
  ENDPOINTS: {
    ACHIEVEMENTS: '/achievements',
    QUESTS: '/quests',
    REWARDS: '/rewards',
    PROFILES: '/profiles',
    LEADERBOARD: '/leaderboard',
    EVENTS: '/events',
  },
};

/**
 * Notification API endpoints
 */
export const NOTIFICATION_API = {
  BASE_PATH: `${API_CONFIG.BASE_URL}/notifications`,
  ENDPOINTS: {
    ALL: '/all',
    UNREAD: '/unread',
    MARK_READ: '/mark-read',
    PREFERENCES: '/preferences',
    SUBSCRIBE: '/subscribe',
    UNSUBSCRIBE: '/unsubscribe',
  },
};

/**
 * Common query parameter keys used across API endpoints
 */
export const QUERY_PARAMS = {
  PAGINATION: {
    PAGE: 'page',
    LIMIT: 'limit',
    OFFSET: 'offset',
  },
  SORTING: {
    SORT_BY: 'sortBy',
    SORT_ORDER: 'sortOrder',
  },
  FILTERING: {
    FILTER: 'filter',
    SEARCH: 'search',
    FROM_DATE: 'fromDate',
    TO_DATE: 'toDate',
    STATUS: 'status',
  },
  INCLUDE: 'include',
};

/**
 * WebSocket event types
 */
export const WEBSOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  TELEMEDICINE_SESSION: 'telemedicine_session',
};

/**
 * HTTP status codes with descriptive names
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
};

/**
 * Content types for API requests and responses
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  PDF: 'application/pdf',
};