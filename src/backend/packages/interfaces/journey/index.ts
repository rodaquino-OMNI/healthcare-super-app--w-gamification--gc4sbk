/**
 * @file index.ts
 * @description Main entry point for all journey interfaces in the AUSTA SuperApp.
 * This file re-exports all journey-specific interfaces, types, and enums from their
 * respective folders, providing a clean, organized API for consumers.
 * 
 * This enables importing from '@austa/interfaces/journey' directly without
 * needing to reference specific subfolders, simplifying imports across the application.
 *
 * @module @austa/interfaces/journey
 */

/**
 * Health Journey Interfaces
 * Includes interfaces for health metrics, goals, medical events, and device connections
 */
export * from './health';

/**
 * Care Journey Interfaces
 * Includes interfaces for appointments, providers, medications, telemedicine sessions,
 * and treatment plans
 */
export * from './care';

/**
 * Plan Journey Interfaces
 * Includes interfaces for insurance plans, claims, coverage, benefits, and documents
 */
export * from './plan';