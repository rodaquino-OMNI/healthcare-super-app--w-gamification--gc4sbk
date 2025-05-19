/**
 * Web Application Configuration
 * 
 * This module centralizes configuration settings for the AUSTA SuperApp web application,
 * including API endpoints, feature flags, and other application-wide settings.
 */

import { apiConfig } from '@austa/shared/config/apiConfig';
import { defaultLocale, supportedLocales } from '@austa/shared/config/i18nConfig';
import { JOURNEY_IDS } from '@austa/journey-context/src/constants/journeys';
import { WebConfigInterface, FeatureFlagsInterface, AnalyticsConfigInterface, CacheTTLInterface } from '@austa/interfaces/common';

/**
 * Feature flags for controlling feature availability
 * These can be overridden by environment variables in different environments
 */
const featureFlags: FeatureFlagsInterface = {
  enableGamification: process.env.ENABLE_GAMIFICATION !== 'false',
  enableTelemedicine: process.env.ENABLE_TELEMEDICINE !== 'false',
  enableAiAssistant: process.env.ENABLE_AI_ASSISTANT === 'true',
  enableSocialFeatures: process.env.ENABLE_SOCIAL_FEATURES === 'true',
  enableWearableSync: process.env.ENABLE_WEARABLE_SYNC !== 'false',
  enableClaimAutoProcessing: process.env.ENABLE_CLAIM_AUTO_PROCESSING !== 'false',
  enableNewMetricsUi: process.env.ENABLE_NEW_METRICS_UI === 'true',
  enableJourneyAnimations: process.env.ENABLE_JOURNEY_ANIMATIONS !== 'false',
};

/**
 * Analytics configuration
 */
const analyticsConfig: AnalyticsConfigInterface = {
  enabled: process.env.NODE_ENV === 'production',
  trackingId: process.env.ANALYTICS_TRACKING_ID || '',
  sampleRate: 100, // Percentage of users to track
};

/**
 * Cache time-to-live settings
 */
const cacheTTL: CacheTTLInterface = {
  user: 5 * 60 * 1000, // 5 minutes
  journeyData: 2 * 60 * 1000, // 2 minutes
  staticData: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * Web application configuration object
 * Contains all settings required for the web application
 */
export const webConfig: WebConfigInterface = {
  // Environment information
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
  
  // API endpoints
  apiURL: apiConfig.baseURL,
  healthJourney: apiConfig.journeys.health,
  careJourney: apiConfig.journeys.care,
  planJourney: apiConfig.journeys.plan,
  
  // Journey IDs for consistent reference
  journeyIds: JOURNEY_IDS,
  
  // Internationalization settings
  defaultLocale,
  supportedLocales,
  
  // Feature flags for toggling functionality
  features: featureFlags,
  
  // Analytics configuration
  analytics: analyticsConfig,
  
  // Performance settings
  performanceTracking: true,
  errorTracking: true,
  
  // UI settings
  animationDuration: 300, // ms
  toastDuration: 5000, // ms
  
  // Cache settings
  cacheTTL,
  
  // Session settings
  sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
};