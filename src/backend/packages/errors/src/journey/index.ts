/**
 * @file Journey-specific error classes for the AUSTA SuperApp
 * @description This file serves as the primary barrel file for all journey-specific errors,
 * providing a centralized export point for Health, Care, and Plan journey error classes.
 * 
 * The error classes are organized by journey and domain to ensure consistent error handling
 * across the application. Each journey has its own namespace with domain-specific error classes.
 * 
 * @example
 * // Import specific error classes
 * import { Health, Care, Plan } from '@austa/errors/journey';
 * 
 * // Use journey-specific errors
 * throw new Health.Metrics.InvalidMetricValueError('Heart rate value out of range');
 * throw new Care.Appointments.AppointmentNotFoundError('Appointment not found');
 * throw new Plan.Claims.ClaimNotFoundError('Claim not found');
 */

// Import journey-specific error modules
import * as Health from './health';
import * as Care from './care';
import * as Plan from './plan';

/**
 * Re-export all journey-specific error modules
 */
export {
  Health,
  Care,
  Plan
};

/**
 * @namespace Health
 * @description Health journey-specific error classes for metrics, goals, insights, devices, and FHIR integration
 */

/**
 * @namespace Care
 * @description Care journey-specific error classes for appointments, providers, telemedicine, medications, symptoms, and treatments
 */

/**
 * @namespace Plan
 * @description Plan journey-specific error classes for plans, benefits, coverage, claims, and documents
 */