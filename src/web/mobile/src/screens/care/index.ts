/**
 * Care Journey Screens Index
 * 
 * This file serves as the central entry point for all care-related screen components
 * in the AUSTA SuperApp mobile application. It provides a unified export interface
 * for all screens in the "Care Now" journey, ensuring consistent module resolution
 * and import patterns across the application.
 * 
 * @module CareScreens
 */

// Import all care journey screen components with their TypeScript types
import { AppointmentBooking } from './AppointmentBooking';
import { AppointmentDetail } from './AppointmentDetail';
import { Dashboard } from './Dashboard';
import { MedicationTrackingScreen } from './MedicationTracking';
import { ProviderSearchScreen } from './ProviderSearch';
import { SymptomChecker } from './SymptomChecker';
import { Telemedicine } from './Telemedicine';
import { TreatmentPlanScreen } from './TreatmentPlan';

/**
 * Export all care journey screen components
 * 
 * These components form the UI for the "Care Now" journey, allowing users to:
 * - View their care dashboard
 * - Book and manage appointments
 * - Search for healthcare providers
 * - Check symptoms and get recommendations
 * - Participate in telemedicine sessions
 * - Track medications and treatment plans
 */
export {
  AppointmentBooking,
  AppointmentDetail,
  Dashboard,
  MedicationTrackingScreen,
  ProviderSearchScreen,
  SymptomChecker,
  Telemedicine,
  TreatmentPlanScreen,
};