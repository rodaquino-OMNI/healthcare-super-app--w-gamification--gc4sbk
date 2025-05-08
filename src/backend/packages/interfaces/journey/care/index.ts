/**
 * @file Care Journey Interfaces
 * @description This file exports all interfaces and types related to the Care Journey in the AUSTA SuperApp.
 * It provides a centralized export pattern for all care interfaces to simplify imports across the application.
 * 
 * The Care Journey focuses on providing users with tools to manage their healthcare appointments,
 * medications, telemedicine sessions, and treatment plans. These interfaces define the data structures
 * used throughout this journey.
 */

// ===== Appointments =====
export { AppointmentType, AppointmentStatus } from './appointment.interface';
export type { IAppointment } from './appointment.interface';

// ===== Providers =====
export type { IProvider } from './provider.interface';

// ===== Medications =====
export type { IMedication } from './medication.interface';

// ===== Telemedicine =====
export type { ITelemedicineSession } from './telemedicine-session.interface';

// ===== Treatments =====
export type { ITreatmentPlan } from './treatment-plan.interface';
export type { ICareActivity } from './care-activity.interface';