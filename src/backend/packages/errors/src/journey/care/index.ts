/**
 * @file Care journey-specific error classes for the AUSTA SuperApp
 * @description This file serves as the primary barrel file for all Care journey-specific errors,
 * providing a centralized export point for Appointments, Providers, Telemedicine, Medications,
 * Symptoms, and Treatments domain error classes.
 * 
 * The error classes are organized by domain to ensure consistent error handling
 * across the Care journey. Each domain has its own namespace with specific error classes.
 * 
 * @example
 * // Import all Care journey errors
 * import * as CareErrors from '@austa/errors/journey/care';
 * 
 * // Use domain-specific errors
 * throw new CareErrors.Appointments.AppointmentNotFoundError('appointment-123');
 * throw new CareErrors.Providers.ProviderNotFoundError('provider-456');
 * 
 * @example
 * // Import specific domain errors
 * import { Appointments, Telemedicine } from '@austa/errors/journey/care';
 * 
 * // Use domain-specific errors
 * throw new Appointments.AppointmentNotFoundError('appointment-123');
 * throw new Telemedicine.TelemedicineConnectionError('Failed to establish WebRTC connection');
 */

// Import domain-specific error modules
import * as Appointments from './appointment-errors';
import * as Providers from './provider-errors';
import * as Telemedicine from './telemedicine-errors';
import * as Medications from './medication-errors';
import * as Symptoms from './symptom-errors';
import * as Treatments from './treatment-errors';

// Import error codes
import * as ErrorCodes from './error-codes';

/**
 * Re-export all domain-specific error modules
 */
export {
  Appointments,
  Providers,
  Telemedicine,
  Medications,
  Symptoms,
  Treatments,
  ErrorCodes
};

/**
 * @namespace Appointments
 * @description Appointment-specific error classes for scheduling, management, and calendar integration
 */

/**
 * @namespace Providers
 * @description Provider-specific error classes for healthcare provider management and integration
 */

/**
 * @namespace Telemedicine
 * @description Telemedicine-specific error classes for virtual consultations and video sessions
 */

/**
 * @namespace Medications
 * @description Medication-specific error classes for medication management, adherence, and interactions
 */

/**
 * @namespace Symptoms
 * @description Symptom checker-specific error classes for symptom evaluation and recommendations
 */

/**
 * @namespace Treatments
 * @description Treatment-specific error classes for treatment plans, progress tracking, and outcomes
 */

/**
 * @namespace ErrorCodes
 * @description Error codes used throughout the Care journey, organized by domain and error type
 */

// Also export individual error classes for direct imports
export * from './appointment-errors';
export * from './provider-errors';
export * from './telemedicine-errors';
export * from './medication-errors';
export * from './symptom-errors';
export * from './treatment-errors';
export * from './error-codes';