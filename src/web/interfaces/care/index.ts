/**
 * Care Journey Interfaces
 * 
 * This barrel file re-exports all interfaces and enums for the Care journey in the AUSTA SuperApp.
 * It provides a unified entry point for importing care-related TypeScript types throughout the application.
 * 
 * @module care
 */

// Core types
export { AppointmentType, AppointmentStatus } from './types';

// Appointment interfaces
export { 
  Appointment,
  AppointmentProviderInfo,
  AppointmentLocation 
} from './appointment';

// Medication interfaces and enums
export {
  Medication,
  MedicationFrequency,
  MedicationForm,
  MedicationStatus,
  MedicationTime,
  MedicationReminder,
  MedicationAdherence
} from './medication';

// Provider interfaces and enums
export {
  Provider,
  GeoCoordinates,
  ProviderAddress,
  TimeSlot,
  WeekDay,
  DailyAvailability,
  TelemedicineServiceType,
  TelemedicineCapability,
  ProviderSpecialty,
  ProviderType,
  ProviderEducation,
  ProviderCertification,
  HospitalAffiliation
} from './provider';

// Telemedicine interfaces and enums
export {
  TelemedicineSession,
  TelemedicineConnectionStatus,
  TelemedicineSessionStage,
  TelemedicineParticipant
} from './telemedicine-session';

// Treatment plan interfaces and enums
export {
  TreatmentPlan,
  TreatmentPlanItem,
  TreatmentItemStatus,
  TreatmentItemType,
  TreatmentFrequency
} from './treatment-plan';

// Type aliases for common ID types
export type AppointmentId = string;
export type MedicationId = string;
export type ProviderId = string;
export type TelemedicineSessionId = string;
export type TreatmentPlanId = string;