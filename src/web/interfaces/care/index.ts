/**
 * Central barrel file for Care journey interfaces and types
 * 
 * This file re-exports all Care journey interfaces and enums from the AUSTA SuperApp.
 * It provides a unified entry point for importing care-related TypeScript types
 * throughout the application, maintaining backward compatibility with existing code
 * while implementing the new modular folder structure.
 */

// Re-export appointment-related types
export type { Appointment } from './appointment';
export { AppointmentType, AppointmentStatus } from './types';

// Re-export medication-related types
export type { Medication } from './medication';

// Re-export telemedicine-related types
export type { TelemedicineSession } from './telemedicine-session';

// Re-export treatment plan-related types
export type { TreatmentPlan } from './treatment-plan';

// Re-export provider-related types
export type { Provider } from './provider';