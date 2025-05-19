/**
 * @file index.ts
 * @description Central API barrel file for the AUSTA SuperApp mobile application.
 * 
 * This file organizes and re-exports all API modules to provide a unified entry point
 * for importing API functionality across the application. It ensures consistent and clean
 * imports while facilitating refactoring by centralizing export patterns.
 * 
 * The API modules are organized by journey (Health, Care, Plan) and cross-cutting concerns
 * (Auth, Notifications, Gamification) to align with the application's journey-centered
 * architecture as specified in the technical requirements.
 * 
 * @module api
 */

// Import all API modules
import * as authApi from './auth';
import * as careApi from './care';
import * as healthApi from './health';
import * as planApi from './plan';
import * as notificationsApi from './notifications';
import * as gamificationApi from './gamification';
import { graphQLClient, restClient } from './client';

// Re-export the API clients
export { graphQLClient, restClient };

/**
 * Authentication API
 * Provides functions for user authentication, registration, and session management.
 * Implements the Authentication System (F-201) requirement.
 */
export const auth = {
  /** Authenticates a user with email and password */
  login: authApi.login,
  /** Registers a new user */
  register: authApi.register,
  /** Verifies a multi-factor authentication code */
  verifyMfa: authApi.verifyMfa,
  /** Refreshes the authentication token */
  refreshToken: authApi.refreshToken,
  /** Authenticates a user with a social provider (OAuth 2.0) */
  socialLogin: authApi.socialLogin,
};

/**
 * Health Journey API
 * Provides functions for fetching and updating health-related data.
 * Implements the My Health journey functionality (F-101).
 */
export const health = {
  /** Fetches health metrics for a specific user and metric types */
  getHealthMetrics: healthApi.getHealthMetrics,
  /** Creates a new health metric for a specific user */
  createHealthMetric: healthApi.createHealthMetric,
};

/**
 * Care Journey API
 * Provides functions for booking appointments, checking symptoms,
 * and accessing telemedicine features.
 * Implements the Care Now Journey (F-102).
 */
export const care = {
  /** Books an appointment with a healthcare provider */
  bookAppointment: careApi.bookAppointment,
  /** Checks the symptoms entered by the user and returns possible diagnoses */
  checkSymptoms: careApi.checkSymptoms,
  /** Helper function to get the current authentication session */
  getAuthSession: careApi.getAuthSession,
};

/**
 * Plan Journey API
 * Provides functions for retrieving plan details, submitting and managing claims,
 * and verifying coverage.
 * Implements the My Plan & Benefits journey (F-103).
 */
export const plan = {
  /** Fetches all insurance plans for a specific user */
  getPlans: planApi.getPlans,
  /** Fetches a specific insurance plan by ID */
  getPlan: planApi.getPlan,
  /** Fetches claims for a specific plan, optionally filtered by status */
  getClaims: planApi.getClaims,
  /** Fetches a specific claim by ID */
  getClaim: planApi.getClaim,
  /** Submits a new insurance claim */
  submitClaim: planApi.submitClaim,
  /** Uploads a document to an existing claim */
  uploadClaimDocument: planApi.uploadClaimDocument,
  /** Updates an existing claim with additional information */
  updateClaim: planApi.updateClaim,
  /** Cancels an existing claim */
  cancelClaim: planApi.cancelClaim,
  /** Simulates the cost of a procedure based on coverage */
  simulateCost: planApi.simulateCost,
  /** Retrieves the digital insurance card for a specific plan */
  getDigitalCard: planApi.getDigitalCard,
};

/**
 * Notifications API
 * Provides functions for fetching and managing user notifications.
 * Supports cross-journey notification functionality.
 */
export const notifications = {
  /** Fetches notifications for a given user ID */
  getNotifications: notificationsApi.getNotifications,
  /** Marks a notification as read for a given notification ID */
  markNotificationAsRead: notificationsApi.markNotificationAsRead,
};

/**
 * Gamification API
 * Provides functions for interacting with the gamification system.
 * Supports the cross-journey gamification functionality.
 */
export const gamification = {
  /** Fetches the gamification profile for a given user ID */
  getGameProfile: gamificationApi.getGameProfile,
  /** Updates the gamification profile for a given user ID with the provided data */
  updateGameProfile: gamificationApi.updateGameProfile,
};

// Re-export types for consumers of the API

// Auth types
export type { AuthSession } from 'src/web/shared/types/auth.types';

// Health types
export type { HealthMetric } from 'src/web/shared/types/health.types';

// Plan types
export type { Plan, Claim, ClaimStatus } from '../../shared/types/plan.types';

// Care types (defined inline in the care.ts file)
export type { Appointment, Session } from './care';

// Notification types (defined inline in the notifications.ts file)
export type { Notification } from './notifications';

// Gamification types (defined inline in the gamification.ts file)
export type { GameProfile } from './gamification';