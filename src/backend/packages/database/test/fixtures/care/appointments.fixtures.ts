import { AppointmentStatus, AppointmentType, IAppointment } from '@austa/interfaces/journey/care';
import { addDays, addHours, addMinutes, subDays } from 'date-fns';

/**
 * Interface for appointment fixture options to customize generated test data.
 */
export interface AppointmentFixtureOptions {
  userId?: string;
  providerId?: string;
  type?: AppointmentType;
  status?: AppointmentStatus;
  dateTime?: Date;
  notes?: string;
  id?: string;
}

/**
 * Interface for appointment test data with all required properties.
 */
export interface AppointmentTestData extends IAppointment {
  id: string;
  userId: string;
  providerId: string;
  dateTime: Date;
  type: AppointmentType;
  status: AppointmentStatus;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Default values for appointment test data.
 */
const defaultAppointmentData: Omit<AppointmentTestData, 'user' | 'provider'> = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000001',
  providerId: '00000000-0000-0000-0000-000000000001',
  dateTime: new Date(),
  type: AppointmentType.IN_PERSON,
  status: AppointmentStatus.SCHEDULED,
  notes: 'Regular check-up appointment',
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Creates a basic appointment test data object with default values.
 * 
 * @param options - Optional customization parameters
 * @returns A complete appointment test data object
 */
export function createAppointmentFixture(options: AppointmentFixtureOptions = {}): AppointmentTestData {
  const now = new Date();
  
  return {
    ...defaultAppointmentData,
    dateTime: options.dateTime || now,
    createdAt: now,
    updatedAt: now,
    ...options,
    // These properties are added as undefined since they would be populated by the ORM
    // in a real database query, but for testing purposes we need to include them
    user: undefined as any,
    provider: undefined as any,
  };
}

/**
 * Creates an array of appointment fixtures with different types and statuses.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of appointment test data objects
 */
export function createMultipleAppointmentFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  const now = new Date();
  
  return [
    // Upcoming in-person appointment (tomorrow)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000001',
      userId,
      providerId,
      dateTime: addDays(now, 1),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Annual physical examination',
    }),
    
    // Upcoming telemedicine appointment (later today)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000002',
      userId,
      providerId,
      dateTime: addHours(now, 3),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Follow-up consultation',
    }),
    
    // Completed in-person appointment (yesterday)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000003',
      userId,
      providerId,
      dateTime: subDays(now, 1),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Routine check-up',
    }),
    
    // Cancelled telemedicine appointment (yesterday)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000004',
      userId,
      providerId,
      dateTime: subDays(now, 1),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.CANCELLED,
      notes: 'Cancelled due to scheduling conflict',
    }),
  ];
}

/**
 * Creates a set of appointment fixtures for testing appointment reminders.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of appointment test data objects with various reminder timings
 */
export function createAppointmentReminderFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  const now = new Date();
  
  return [
    // Appointment in 24 hours (1-day reminder)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000005',
      userId,
      providerId,
      dateTime: addDays(now, 1),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment with 24-hour reminder',
    }),
    
    // Appointment in 3 hours (3-hour reminder)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000006',
      userId,
      providerId,
      dateTime: addHours(now, 3),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment with 3-hour reminder',
    }),
    
    // Appointment in 30 minutes (30-minute reminder)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000007',
      userId,
      providerId,
      dateTime: addMinutes(now, 30),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment with 30-minute reminder',
    }),
  ];
}

/**
 * Creates a set of appointment fixtures for testing rescheduling scenarios.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of appointment test data objects for rescheduling tests
 */
export function createAppointmentReschedulingFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  const now = new Date();
  
  return [
    // Appointment that can be rescheduled (more than 24 hours in advance)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000008',
      userId,
      providerId,
      dateTime: addDays(now, 3),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment eligible for rescheduling',
    }),
    
    // Appointment within cancellation window (less than 24 hours)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000009',
      userId,
      providerId,
      dateTime: addHours(now, 23),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment within cancellation window',
    }),
    
    // Appointment that was already rescheduled once
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000010',
      userId,
      providerId,
      dateTime: addDays(now, 5),
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Appointment already rescheduled once from original date',
    }),
  ];
}

/**
 * Creates a set of appointment fixtures for testing follow-up appointment scenarios.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of appointment test data objects for follow-up testing
 */
export function createFollowUpAppointmentFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  const now = new Date();
  
  return [
    // Completed appointment that needs a follow-up
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000011',
      userId,
      providerId,
      dateTime: subDays(now, 7),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Initial consultation, requires 2-week follow-up',
    }),
    
    // Follow-up appointment scheduled
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000012',
      userId,
      providerId,
      dateTime: addDays(now, 7), // 2 weeks after initial appointment
      type: AppointmentType.TELEMEDICINE,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Follow-up to appointment on ' + subDays(now, 7).toISOString().split('T')[0],
    }),
    
    // Completed appointment with no follow-up needed
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000013',
      userId,
      providerId,
      dateTime: subDays(now, 14),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.COMPLETED,
      notes: 'Routine check-up, no follow-up required',
    }),
  ];
}

/**
 * Creates a set of appointment fixtures for testing concurrent appointment validation.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of appointment test data objects with overlapping times
 */
export function createConcurrentAppointmentFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  const baseDate = addDays(new Date(), 5); // 5 days from now
  const appointmentTime = new Date(baseDate.setHours(10, 0, 0, 0)); // 10:00 AM
  
  return [
    // First appointment at 10:00 AM
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000014',
      userId,
      providerId,
      dateTime: appointmentTime,
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Morning appointment at 10:00 AM',
    }),
    
    // Overlapping appointment at 10:30 AM (while first is still ongoing)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000015',
      userId,
      providerId,
      dateTime: addMinutes(appointmentTime, 30),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Overlapping appointment at 10:30 AM',
    }),
    
    // Non-overlapping appointment at 11:30 AM (after first appointment ends)
    createAppointmentFixture({
      id: '00000000-0000-0000-0000-000000000016',
      userId,
      providerId,
      dateTime: addMinutes(appointmentTime, 90),
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      notes: 'Non-overlapping appointment at 11:30 AM',
    }),
  ];
}

/**
 * Creates a comprehensive set of appointment fixtures for all testing scenarios.
 * 
 * @param userId - User ID to associate with the appointments
 * @param providerId - Provider ID to associate with the appointments
 * @returns Array of all appointment test data objects
 */
export function createAllAppointmentFixtures(
  userId = '00000000-0000-0000-0000-000000000001',
  providerId = '00000000-0000-0000-0000-000000000001'
): AppointmentTestData[] {
  return [
    ...createMultipleAppointmentFixtures(userId, providerId),
    ...createAppointmentReminderFixtures(userId, providerId),
    ...createAppointmentReschedulingFixtures(userId, providerId),
    ...createFollowUpAppointmentFixtures(userId, providerId),
    ...createConcurrentAppointmentFixtures(userId, providerId),
  ];
}