/**
 * @file Care Journey Interfaces
 * @description Centralized export of all Care Journey interfaces and types for the AUSTA SuperApp.
 * This file serves as the main entry point for importing Care Journey related interfaces,
 * providing a clean, organized API for consumers.
 */

// Appointments
export { AppointmentType, AppointmentStatus } from './appointment.interface';
export type { IAppointment } from './appointment.interface';

// Providers
export type { IProvider } from './provider.interface';

// Medications
export type { IMedication } from './medication.interface';

// Telemedicine
export type { ITelemedicineSession } from './telemedicine-session.interface';

// Treatments
export type { ITreatmentPlan } from './treatment-plan.interface';