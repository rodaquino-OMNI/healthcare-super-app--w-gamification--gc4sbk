/**
 * @file Care Journey Interfaces
 * 
 * This file exports all interfaces and types related to the Care journey.
 * These interfaces are used across the application to ensure type safety
 * and consistent data structures between frontend and backend.
 */

// Appointment interfaces
export { AppointmentType, AppointmentStatus, IAppointment } from './appointment.interface';

// Provider interfaces
export { IProvider } from './provider.interface';

// Medication interfaces
export { IMedication } from './medication.interface';

// Telemedicine interfaces
export { ITelemedicineSession } from './telemedicine-session.interface';

// Treatment plan interfaces
export { ITreatmentPlan } from './treatment-plan.interface';

// Symptom checker interfaces
export {
  SymptomSeverity,
  CareOptions,
  PossibleCondition,
  SymptomCheckerResponse
} from './symptom-checker.interface';