/**
 * @file Appointment fixtures for the Care journey
 * 
 * This file provides test fixtures for appointment scheduling and management,
 * including different appointment types (in-person, telemedicine), statuses
 * (scheduled, completed, cancelled, no-show), and timing scenarios (past,
 * current, future appointments).
 * 
 * These fixtures are essential for testing appointment booking, rescheduling,
 * cancellation, and reminder functionality in the Care journey.
 */

import { AppointmentStatus, AppointmentType, IAppointment } from '@austa/interfaces/journey/care';
import { addDays, subDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// Import provider fixtures to associate with appointments
import { getProviderById, getRandomProvider } from './providers.fixtures';

/**
 * Interface for appointment test fixtures
 * Extends the IAppointment interface with additional properties needed for testing
 */
export interface AppointmentFixture extends Omit<IAppointment, 'user' | 'provider'> {
  id: string;
  userId: string;
  providerId: string;
  dateTime: Date;
  type: AppointmentType;
  status: AppointmentStatus | 'NO_SHOW'; // Extended to include NO_SHOW status for testing
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Options for creating appointment fixtures
 */
export interface AppointmentFixtureOptions {
  id?: string;
  userId?: string;
  providerId?: string;
  dateTime?: Date;
  type?: AppointmentType;
  status?: AppointmentStatus | 'NO_SHOW';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a new appointment fixture with the specified options
 * 
 * @param options Options for creating the appointment fixture
 * @returns A new appointment fixture
 */
export function createAppointmentFixture(options: AppointmentFixtureOptions = {}): AppointmentFixture {
  const now = new Date();
  const defaultProviderId = getRandomProvider()?.id || 'provider-1';
  
  return {
    id: options.id || uuidv4(),
    userId: options.userId || 'user-1',
    providerId: options.providerId || defaultProviderId,
    dateTime: options.dateTime || addDays(now, 3), // Default to 3 days in the future
    type: options.type || AppointmentType.IN_PERSON,
    status: options.status || AppointmentStatus.SCHEDULED,
    notes: options.notes || '',
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now
  };
}

/**
 * Creates multiple appointment fixtures with the specified base options
 * 
 * @param count Number of fixtures to create
 * @param baseOptions Base options for all fixtures
 * @param overrides Array of option overrides for specific fixtures
 * @returns Array of appointment fixtures
 */
export function createAppointmentFixtures(
  count: number,
  baseOptions: AppointmentFixtureOptions = {},
  overrides: AppointmentFixtureOptions[] = []
): AppointmentFixture[] {
  const fixtures: AppointmentFixture[] = [];
  
  for (let i = 0; i < count; i++) {
    const options = { ...baseOptions, ...(overrides[i] || {}) };
    fixtures.push(createAppointmentFixture(options));
  }
  
  return fixtures;
}

// ===== Predefined Appointment Fixtures =====

/**
 * Scheduled in-person appointments (future dates)
 */
const scheduledInPersonAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.SCHEDULED
}, [
  { dateTime: addDays(new Date(), 1), notes: 'Regular check-up' },
  { dateTime: addDays(new Date(), 7), notes: 'Follow-up appointment' },
  { dateTime: addDays(new Date(), 14), notes: 'Annual physical' }
]);

/**
 * Scheduled telemedicine appointments (future dates)
 */
const scheduledTelemedicineAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.TELEMEDICINE,
  status: AppointmentStatus.SCHEDULED
}, [
  { dateTime: addDays(new Date(), 2), notes: 'Virtual consultation' },
  { dateTime: addDays(new Date(), 5), notes: 'Medication review' },
  { dateTime: addDays(new Date(), 10), notes: 'Test results discussion' }
]);

/**
 * Completed in-person appointments (past dates)
 */
const completedInPersonAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.COMPLETED
}, [
  { dateTime: subDays(new Date(), 3), notes: 'Regular check-up - completed' },
  { dateTime: subDays(new Date(), 10), notes: 'Follow-up appointment - completed' },
  { dateTime: subDays(new Date(), 30), notes: 'Annual physical - completed' }
]);

/**
 * Completed telemedicine appointments (past dates)
 */
const completedTelemedicineAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.TELEMEDICINE,
  status: AppointmentStatus.COMPLETED
}, [
  { dateTime: subDays(new Date(), 5), notes: 'Virtual consultation - completed' },
  { dateTime: subDays(new Date(), 15), notes: 'Medication review - completed' },
  { dateTime: subDays(new Date(), 25), notes: 'Test results discussion - completed' }
]);

/**
 * Cancelled in-person appointments (mix of past and future dates)
 */
const cancelledInPersonAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.CANCELLED
}, [
  { dateTime: subDays(new Date(), 2), notes: 'Cancelled by patient' },
  { dateTime: addDays(new Date(), 4), notes: 'Cancelled by provider' },
  { dateTime: addDays(new Date(), 8), notes: 'Rescheduled to later date' }
]);

/**
 * Cancelled telemedicine appointments (mix of past and future dates)
 */
const cancelledTelemedicineAppointments = createAppointmentFixtures(3, {
  type: AppointmentType.TELEMEDICINE,
  status: AppointmentStatus.CANCELLED
}, [
  { dateTime: subDays(new Date(), 1), notes: 'Cancelled by patient' },
  { dateTime: addDays(new Date(), 3), notes: 'Cancelled by provider' },
  { dateTime: addDays(new Date(), 6), notes: 'Technical issues' }
]);

/**
 * No-show appointments (past dates)
 */
const noShowAppointments = createAppointmentFixtures(3, {
  status: 'NO_SHOW' as AppointmentStatus | 'NO_SHOW'
}, [
  { type: AppointmentType.IN_PERSON, dateTime: subDays(new Date(), 4), notes: 'Patient did not show up' },
  { type: AppointmentType.IN_PERSON, dateTime: subDays(new Date(), 12), notes: 'Patient did not show up' },
  { type: AppointmentType.TELEMEDICINE, dateTime: subDays(new Date(), 7), notes: 'Patient did not join the call' }
]);

/**
 * Same-day appointments (today)
 */
const sameDayAppointments = createAppointmentFixtures(3, {
  dateTime: new Date(),
  status: AppointmentStatus.SCHEDULED
}, [
  { type: AppointmentType.IN_PERSON, notes: 'Urgent consultation' },
  { type: AppointmentType.TELEMEDICINE, notes: 'Same-day virtual consultation' },
  { type: AppointmentType.IN_PERSON, notes: 'Walk-in appointment' }
]);

/**
 * All appointment fixtures combined
 */
const allAppointments = [
  ...scheduledInPersonAppointments,
  ...scheduledTelemedicineAppointments,
  ...completedInPersonAppointments,
  ...completedTelemedicineAppointments,
  ...cancelledInPersonAppointments,
  ...cancelledTelemedicineAppointments,
  ...noShowAppointments,
  ...sameDayAppointments
];

// ===== Appointment Retrieval Functions =====

/**
 * Gets an appointment by its ID
 * 
 * @param id The appointment ID
 * @returns The appointment with the specified ID, or undefined if not found
 */
export function getAppointmentById(id: string): AppointmentFixture | undefined {
  return allAppointments.find(appointment => appointment.id === id);
}

/**
 * Gets appointments by user ID
 * 
 * @param userId The user ID
 * @returns Array of appointments for the specified user
 */
export function getAppointmentsByUserId(userId: string): AppointmentFixture[] {
  return allAppointments.filter(appointment => appointment.userId === userId);
}

/**
 * Gets appointments by provider ID
 * 
 * @param providerId The provider ID
 * @returns Array of appointments for the specified provider
 */
export function getAppointmentsByProviderId(providerId: string): AppointmentFixture[] {
  return allAppointments.filter(appointment => appointment.providerId === providerId);
}

/**
 * Gets appointments by type
 * 
 * @param type The appointment type
 * @returns Array of appointments of the specified type
 */
export function getAppointmentsByType(type: AppointmentType): AppointmentFixture[] {
  return allAppointments.filter(appointment => appointment.type === type);
}

/**
 * Gets appointments by status
 * 
 * @param status The appointment status
 * @returns Array of appointments with the specified status
 */
export function getAppointmentsByStatus(status: AppointmentStatus | 'NO_SHOW'): AppointmentFixture[] {
  return allAppointments.filter(appointment => appointment.status === status);
}

/**
 * Gets appointments by type and status
 * 
 * @param type The appointment type
 * @param status The appointment status
 * @returns Array of appointments with the specified type and status
 */
export function getAppointmentsByTypeAndStatus(
  type: AppointmentType,
  status: AppointmentStatus | 'NO_SHOW'
): AppointmentFixture[] {
  return allAppointments.filter(
    appointment => appointment.type === type && appointment.status === status
  );
}

/**
 * Gets a single appointment by type and status
 * 
 * @param type The appointment type
 * @param status The appointment status
 * @returns The first appointment with the specified type and status, or undefined if not found
 */
export function getAppointmentByTypeAndStatus(
  type: AppointmentType,
  status: AppointmentStatus | 'NO_SHOW'
): AppointmentFixture {
  const appointments = getAppointmentsByTypeAndStatus(type, status);
  return appointments[0] || createAppointmentFixture({ type, status });
}

/**
 * Gets appointments in a date range
 * 
 * @param startDate The start date (inclusive)
 * @param endDate The end date (inclusive)
 * @returns Array of appointments within the specified date range
 */
export function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date
): AppointmentFixture[] {
  return allAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.dateTime);
    return appointmentDate >= startDate && appointmentDate <= endDate;
  });
}

/**
 * Gets future appointments (after current date)
 * 
 * @returns Array of future appointments
 */
export function getFutureAppointments(): AppointmentFixture[] {
  const now = new Date();
  return allAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.dateTime);
    return appointmentDate > now;
  });
}

/**
 * Gets past appointments (before current date)
 * 
 * @returns Array of past appointments
 */
export function getPastAppointments(): AppointmentFixture[] {
  const now = new Date();
  return allAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.dateTime);
    return appointmentDate < now;
  });
}

/**
 * Gets today's appointments
 * 
 * @returns Array of appointments scheduled for today
 */
export function getTodayAppointments(): AppointmentFixture[] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  return getAppointmentsByDateRange(startOfDay, endOfDay);
}

/**
 * Gets appointments for the next N days
 * 
 * @param days Number of days to include
 * @returns Array of appointments scheduled within the next N days
 */
export function getUpcomingAppointments(days: number = 7): AppointmentFixture[] {
  const now = new Date();
  const futureDate = addDays(now, days);
  
  return getAppointmentsByDateRange(now, futureDate);
}

/**
 * Gets a random appointment from all available appointments
 * 
 * @returns A random appointment fixture
 */
export function getRandomAppointment(): AppointmentFixture {
  const randomIndex = Math.floor(Math.random() * allAppointments.length);
  return allAppointments[randomIndex];
}

// ===== Special Test Scenarios =====

/**
 * Creates a sequence of related appointments for testing follow-up scenarios
 * 
 * @param userId The user ID
 * @param providerId The provider ID
 * @returns A sequence of related appointments (initial, follow-up, final)
 */
export function createFollowUpAppointmentSequence(
  userId: string = 'user-1',
  providerId?: string
): AppointmentFixture[] {
  const provider = providerId || getRandomProvider()?.id || 'provider-1';
  const now = new Date();
  
  // Initial appointment (completed, 30 days ago)
  const initialAppointment = createAppointmentFixture({
    userId,
    providerId: provider,
    dateTime: subDays(now, 30),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.COMPLETED,
    notes: 'Initial consultation'
  });
  
  // Follow-up appointment (completed, 15 days ago)
  const followUpAppointment = createAppointmentFixture({
    userId,
    providerId: provider,
    dateTime: subDays(now, 15),
    type: AppointmentType.TELEMEDICINE,
    status: AppointmentStatus.COMPLETED,
    notes: 'Follow-up after initial consultation'
  });
  
  // Final follow-up (scheduled, 15 days in the future)
  const finalFollowUp = createAppointmentFixture({
    userId,
    providerId: provider,
    dateTime: addDays(now, 15),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Final follow-up appointment'
  });
  
  return [initialAppointment, followUpAppointment, finalFollowUp];
}

/**
 * Creates a scenario with multiple appointments on the same day
 * for testing scheduling conflicts
 * 
 * @param date The date for the appointments
 * @param userId The user ID
 * @returns Array of appointments scheduled on the same day
 */
export function createSameDayAppointmentsScenario(
  date: Date = new Date(),
  userId: string = 'user-1'
): AppointmentFixture[] {
  // Create a date object for the specified date at 9:00 AM
  const morningAppointmentTime = new Date(date);
  morningAppointmentTime.setHours(9, 0, 0, 0);
  
  // Create a date object for the specified date at 1:00 PM
  const afternoonAppointmentTime = new Date(date);
  afternoonAppointmentTime.setHours(13, 0, 0, 0);
  
  // Create a date object for the specified date at 4:30 PM
  const eveningAppointmentTime = new Date(date);
  eveningAppointmentTime.setHours(16, 30, 0, 0);
  
  // Morning appointment
  const morningAppointment = createAppointmentFixture({
    userId,
    dateTime: morningAppointmentTime,
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Morning appointment'
  });
  
  // Afternoon appointment
  const afternoonAppointment = createAppointmentFixture({
    userId,
    dateTime: afternoonAppointmentTime,
    type: AppointmentType.TELEMEDICINE,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Afternoon appointment'
  });
  
  // Evening appointment
  const eveningAppointment = createAppointmentFixture({
    userId,
    dateTime: eveningAppointmentTime,
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Evening appointment'
  });
  
  return [morningAppointment, afternoonAppointment, eveningAppointment];
}

/**
 * Creates a scenario with a cancelled and rescheduled appointment
 * 
 * @param userId The user ID
 * @param providerId The provider ID
 * @returns Array containing the cancelled appointment and its rescheduled version
 */
export function createCancelledAndRescheduledScenario(
  userId: string = 'user-1',
  providerId?: string
): AppointmentFixture[] {
  const provider = providerId || getRandomProvider()?.id || 'provider-1';
  const now = new Date();
  
  // Original appointment (cancelled)
  const originalAppointment = createAppointmentFixture({
    userId,
    providerId: provider,
    dateTime: addDays(now, 5),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.CANCELLED,
    notes: 'Cancelled by patient due to conflict'
  });
  
  // Rescheduled appointment
  const rescheduledAppointment = createAppointmentFixture({
    userId,
    providerId: provider,
    dateTime: addDays(now, 12),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Rescheduled from ' + originalAppointment.dateTime.toISOString().split('T')[0]
  });
  
  return [originalAppointment, rescheduledAppointment];
}

/**
 * Creates a scenario with appointments requiring different preparation instructions
 * 
 * @returns Array of appointments with different preparation instructions
 */
export function createAppointmentsWithPreparationInstructions(): AppointmentFixture[] {
  const now = new Date();
  
  // Physical examination requiring fasting
  const physicalExam = createAppointmentFixture({
    dateTime: addDays(now, 10),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Annual physical examination. Please fast for 12 hours before the appointment.'
  });
  
  // Imaging appointment requiring special preparation
  const imagingAppointment = createAppointmentFixture({
    dateTime: addDays(now, 15),
    type: AppointmentType.IN_PERSON,
    status: AppointmentStatus.SCHEDULED,
    notes: 'MRI scan. Please wear comfortable clothing without metal components. No food 4 hours before.'
  });
  
  // Telemedicine appointment with technical requirements
  const telemedicineWithRequirements = createAppointmentFixture({
    dateTime: addDays(now, 7),
    type: AppointmentType.TELEMEDICINE,
    status: AppointmentStatus.SCHEDULED,
    notes: 'Virtual consultation. Please test your camera and microphone before the appointment. Have your medication list ready.'
  });
  
  return [physicalExam, imagingAppointment, telemedicineWithRequirements];
}

// Export all predefined fixtures
export {
  scheduledInPersonAppointments,
  scheduledTelemedicineAppointments,
  completedInPersonAppointments,
  completedTelemedicineAppointments,
  cancelledInPersonAppointments,
  cancelledTelemedicineAppointments,
  noShowAppointments,
  sameDayAppointments,
  allAppointments
};

// Export a default object with all fixtures and functions
export default {
  // Fixture creation functions
  createAppointmentFixture,
  createAppointmentFixtures,
  
  // Predefined fixtures
  scheduledInPersonAppointments,
  scheduledTelemedicineAppointments,
  completedInPersonAppointments,
  completedTelemedicineAppointments,
  cancelledInPersonAppointments,
  cancelledTelemedicineAppointments,
  noShowAppointments,
  sameDayAppointments,
  allAppointments,
  
  // Retrieval functions
  getAppointmentById,
  getAppointmentsByUserId,
  getAppointmentsByProviderId,
  getAppointmentsByType,
  getAppointmentsByStatus,
  getAppointmentsByTypeAndStatus,
  getAppointmentByTypeAndStatus,
  getAppointmentsByDateRange,
  getFutureAppointments,
  getPastAppointments,
  getTodayAppointments,
  getUpcomingAppointments,
  getRandomAppointment,
  
  // Special test scenarios
  createFollowUpAppointmentSequence,
  createSameDayAppointmentsScenario,
  createCancelledAndRescheduledScenario,
  createAppointmentsWithPreparationInstructions
};