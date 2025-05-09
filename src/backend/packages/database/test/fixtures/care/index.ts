/**
 * @file Care Journey Test Fixtures
 * 
 * This file centralizes exports of all Care journey test fixtures, providing a single import point
 * for test suites. It makes it easy to access all care-related test fixtures without having to
 * import from multiple files, simplifying test setup and improving maintainability.
 */

// Import all fixture modules
import * as appointmentsFixtures from './appointments.fixtures';
import * as providersFixtures from './providers.fixtures';
import * as medicationsFixtures from './medications.fixtures';
import * as treatmentsFixtures from './treatments.fixtures';
import * as telemedicineFixtures from './telemedicine.fixtures';
import * as symptomCheckerFixtures from './symptom-checker.fixtures';

// Re-export all fixtures
export {
  appointmentsFixtures,
  providersFixtures,
  medicationsFixtures,
  treatmentsFixtures,
  telemedicineFixtures,
  symptomCheckerFixtures
};

// Export individual fixture categories for direct access
export * from './appointments.fixtures';
export * from './providers.fixtures';
export * from './medications.fixtures';
export * from './treatments.fixtures';
export * from './telemedicine.fixtures';
export * from './symptom-checker.fixtures';

/**
 * Type definitions for Care journey fixtures
 */
export interface AppointmentFixture {
  id: string;
  userId: string;
  providerId: string;
  scheduledAt: Date;
  type: 'IN_PERSON' | 'TELEMEDICINE';
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderFixture {
  id: string;
  name: string;
  specialty: string;
  practiceLocation: string;
  contactPhone: string;
  contactEmail: string;
  telemedicineAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationFixture {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  reminderEnabled: boolean;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentFixture {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TelemedicineSessionFixture {
  id: string;
  appointmentId: string;
  userId: string;
  providerId: string;
  startTime: Date;
  endTime?: Date;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface SymptomCheckerQueryFixture {
  id: string;
  userId: string;
  symptoms: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  recommendation?: string;
  createdAt: Date;
}

/**
 * Convenience function to get a complete set of fixtures for appointment testing.
 * Includes appointments of different types and statuses, associated providers, and telemedicine sessions.
 * 
 * @param appointmentType The type of appointment (in-person or telemedicine)
 * @returns A complete set of fixtures for appointment testing
 */
export function getAppointmentTestFixtures(appointmentType: 'in-person' | 'telemedicine' = 'in-person') {
  const type = appointmentType === 'in-person' ? 'IN_PERSON' : 'TELEMEDICINE';
  
  // Get appointments of the specified type in different statuses
  const scheduledAppointment = appointmentsFixtures.getAppointmentByTypeAndStatus(type, 'SCHEDULED');
  const completedAppointment = appointmentsFixtures.getAppointmentByTypeAndStatus(type, 'COMPLETED');
  const cancelledAppointment = appointmentsFixtures.getAppointmentByTypeAndStatus(type, 'CANCELLED');
  const noShowAppointment = appointmentsFixtures.getAppointmentByTypeAndStatus(type, 'NO_SHOW');
  
  // Get providers associated with these appointments
  const provider = providersFixtures.getProviderById(scheduledAppointment.providerId);
  
  // Get telemedicine sessions if applicable
  const telemedicineSession = type === 'TELEMEDICINE' ?
    telemedicineFixtures.getSessionByAppointmentId(scheduledAppointment.id) : null;
  
  return {
    appointments: {
      scheduled: scheduledAppointment,
      completed: completedAppointment,
      cancelled: cancelledAppointment,
      noShow: noShowAppointment
    },
    provider,
    telemedicineSession
  };
}

/**
 * Convenience function to get fixtures for testing the medication management flow.
 * Includes medications with different attributes and statuses.
 * 
 * @returns A set of fixtures for testing medication management
 */
export function getMedicationManagementTestFixtures() {
  // Get medications with different attributes
  const activeMedications = medicationsFixtures.getMedicationsByStatus(true);
  const inactiveMedications = medicationsFixtures.getMedicationsByStatus(false);
  const medicationsWithReminders = medicationsFixtures.getMedicationsByReminderStatus(true);
  const medicationsWithoutReminders = medicationsFixtures.getMedicationsByReminderStatus(false);
  
  return {
    byStatus: {
      active: activeMedications,
      inactive: inactiveMedications
    },
    byReminder: {
      enabled: medicationsWithReminders,
      disabled: medicationsWithoutReminders
    }
  };
}

/**
 * Convenience function to get fixtures for testing the treatment tracking flow.
 * Includes treatments with different progress levels and date ranges.
 * 
 * @returns A set of fixtures for testing treatment tracking
 */
export function getTreatmentTrackingTestFixtures() {
  // Get treatments with different progress levels
  const notStartedTreatments = treatmentsFixtures.getTreatmentsByProgressRange(0, 0);
  const inProgressTreatments = treatmentsFixtures.getTreatmentsByProgressRange(1, 99);
  const completedTreatments = treatmentsFixtures.getTreatmentsByProgressRange(100, 100);
  
  // Get treatments with different date ranges
  const currentTreatments = treatmentsFixtures.getCurrentTreatments();
  const pastTreatments = treatmentsFixtures.getPastTreatments();
  const futureTreatments = treatmentsFixtures.getFutureTreatments();
  
  return {
    byProgress: {
      notStarted: notStartedTreatments,
      inProgress: inProgressTreatments,
      completed: completedTreatments
    },
    byTimeframe: {
      current: currentTreatments,
      past: pastTreatments,
      future: futureTreatments
    }
  };
}

/**
 * Convenience function to get fixtures for testing the telemedicine flow.
 * Includes telemedicine sessions in different states and associated appointments and providers.
 * 
 * @returns A set of fixtures for testing the telemedicine flow
 */
export function getTelemedicineTestFixtures() {
  // Get telemedicine sessions in different states
  const scheduledSessions = telemedicineFixtures.getSessionsByStatus('SCHEDULED');
  const inProgressSessions = telemedicineFixtures.getSessionsByStatus('IN_PROGRESS');
  const completedSessions = telemedicineFixtures.getSessionsByStatus('COMPLETED');
  const cancelledSessions = telemedicineFixtures.getSessionsByStatus('CANCELLED');
  const failedSessions = telemedicineFixtures.getSessionsByStatus('FAILED');
  
  // Get a sample session with its associated appointment and provider
  const sampleSession = scheduledSessions[0];
  const associatedAppointment = appointmentsFixtures.getAppointmentById(sampleSession.appointmentId);
  const associatedProvider = providersFixtures.getProviderById(sampleSession.providerId);
  
  return {
    sessions: {
      scheduled: scheduledSessions,
      inProgress: inProgressSessions,
      completed: completedSessions,
      cancelled: cancelledSessions,
      failed: failedSessions
    },
    sampleFlow: {
      session: sampleSession,
      appointment: associatedAppointment,
      provider: associatedProvider
    }
  };
}

/**
 * Convenience function to get fixtures for testing the provider search and selection flow.
 * Includes providers with different specialties and telemedicine capabilities.
 * 
 * @returns A set of fixtures for testing provider search and selection
 */
export function getProviderSearchTestFixtures() {
  // Get providers with different specialties
  const cardiologyProviders = providersFixtures.getProvidersBySpecialty('Cardiologia');
  const dermatologyProviders = providersFixtures.getProvidersBySpecialty('Dermatologia');
  const orthopedicsProviders = providersFixtures.getProvidersBySpecialty('Ortopedia');
  const pediatricsProviders = providersFixtures.getProvidersBySpecialty('Pediatria');
  const psychiatryProviders = providersFixtures.getProvidersBySpecialty('Psiquiatria');
  
  // Get providers by telemedicine capability
  const telemedicineProviders = providersFixtures.getProvidersByTelemedicineAvailability(true);
  const inPersonOnlyProviders = providersFixtures.getProvidersByTelemedicineAvailability(false);
  
  return {
    bySpecialty: {
      cardiology: cardiologyProviders,
      dermatology: dermatologyProviders,
      orthopedics: orthopedicsProviders,
      pediatrics: pediatricsProviders,
      psychiatry: psychiatryProviders
    },
    byTelemedicine: {
      available: telemedicineProviders,
      unavailable: inPersonOnlyProviders
    }
  };
}

/**
 * Convenience function to get fixtures for testing the symptom checker flow.
 * Includes symptom queries with different severities and recommendations.
 * 
 * @returns A set of fixtures for testing the symptom checker flow
 */
export function getSymptomCheckerTestFixtures() {
  // Get symptom checker queries with different severities
  const lowSeverityQueries = symptomCheckerFixtures.getQueriesBySeverity('LOW');
  const mediumSeverityQueries = symptomCheckerFixtures.getQueriesBySeverity('MEDIUM');
  const highSeverityQueries = symptomCheckerFixtures.getQueriesBySeverity('HIGH');
  const emergencyQueries = symptomCheckerFixtures.getQueriesBySeverity('EMERGENCY');
  
  return {
    bySeverity: {
      low: lowSeverityQueries,
      medium: mediumSeverityQueries,
      high: highSeverityQueries,
      emergency: emergencyQueries
    }
  };
}

/**
 * Convenience function to get a complete set of fixtures for Care journey testing.
 * Includes fixtures for all Care journey entities.
 * 
 * @returns A complete set of fixtures for Care journey testing
 */
export function getAllCareFixtures() {
  return {
    appointments: appointmentsFixtures,
    providers: providersFixtures,
    medications: medicationsFixtures,
    treatments: treatmentsFixtures,
    telemedicine: telemedicineFixtures,
    symptomChecker: symptomCheckerFixtures
  };
}