/**
 * @austa/interfaces/api
 * 
 * Centralizes and re-exports all API interface types from the AUSTA SuperApp,
 * providing a single import point for frontend components and services.
 * 
 * This file is the main entry point for all API-related TypeScript interfaces
 * used throughout the application, organized by journey and protocol.
 */

// Protocol-specific types
export * from './graphql.types';
export * from './rest.types';
export * from './websocket.types';

// Common API types
export * from './request.types';
export * from './response.types';
export * from './error.types';

// Journey-specific API interfaces

/**
 * Authentication API interfaces
 * 
 * Includes login, registration, token refresh, password reset, and MFA operations
 */
export * as Auth from './auth.api';

/**
 * Health Journey API interfaces
 * 
 * Covers health metrics, medical events, health goals, and device connections
 */
export * as Health from './health.api';

/**
 * Care Journey API interfaces
 * 
 * Covers appointments, medications, telemedicine sessions, and treatment plans
 */
export * as Care from './care.api';

/**
 * Plan Journey API interfaces
 * 
 * Covers insurance plans, claims, coverage, and benefits
 */
export * as Plan from './plan.api';

/**
 * Gamification API interfaces
 * 
 * Covers achievements, quests, rewards, and game profiles
 */
export * as Gamification from './gamification.api';