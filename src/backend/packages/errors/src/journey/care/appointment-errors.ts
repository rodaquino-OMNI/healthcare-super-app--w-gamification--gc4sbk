import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';

/**
 * Error codes for appointment-related errors in the Care journey.
 */
export enum AppointmentErrorCode {
  // Business error codes
  NOT_FOUND = 'CARE_APPT_001',
  PROVIDER_UNAVAILABLE = 'CARE_APPT_002',
  OVERLAP = 'CARE_APPT_003',
  
  // Validation error codes
  DATE_IN_PAST = 'CARE_APPT_101',
  INVALID_DURATION = 'CARE_APPT_102',
  
  // Technical error codes
  PERSISTENCE_ERROR = 'CARE_APPT_201',
  
  // External error codes
  CALENDAR_SYNC_ERROR = 'CARE_APPT_301',
}

/**
 * Error thrown when an appointment cannot be found by its ID.
 * This is a business logic error that occurs when attempting to access, modify,
 * or cancel an appointment that doesn't exist in the system.
 */
export class AppointmentNotFoundError extends AppException {
  /**
   * Creates a new AppointmentNotFoundError instance.
   * 
   * @param appointmentId - ID of the appointment that was not found
   * @param cause - Original error that caused this exception, if any
   */
  constructor(appointmentId: string, cause?: Error) {
    super(
      `Appointment with ID ${appointmentId} not found`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.NOT_FOUND,
      { appointmentId },
      cause
    );
  }
}

/**
 * Error thrown when attempting to book an appointment with a date in the past.
 * This is a validation error that prevents scheduling appointments for dates
 * that have already passed.
 */
export class AppointmentDateInPastError extends AppException {
  /**
   * Creates a new AppointmentDateInPastError instance.
   * 
   * @param appointmentDate - The invalid past date that was provided
   * @param currentDate - The current date used for validation
   */
  constructor(appointmentDate: Date, currentDate: Date) {
    super(
      `Cannot book appointment for ${appointmentDate.toISOString()} as it is in the past. Current date is ${currentDate.toISOString()}`,
      ErrorType.VALIDATION,
      AppointmentErrorCode.DATE_IN_PAST,
      { appointmentDate, currentDate }
    );
  }
}

/**
 * Error thrown when an appointment overlaps with another existing appointment.
 * This is a business logic error that prevents double-booking of appointments
 * for either the patient or the provider.
 */
export class AppointmentOverlapError extends AppException {
  /**
   * Creates a new AppointmentOverlapError instance.
   * 
   * @param newAppointmentTime - Start time of the new appointment that overlaps
   * @param existingAppointmentId - ID of the existing appointment that conflicts
   * @param existingAppointmentTime - Start time of the existing appointment
   * @param userType - Whether the overlap is for the 'patient' or 'provider'
   */
  constructor(
    newAppointmentTime: Date,
    existingAppointmentId: string,
    existingAppointmentTime: Date,
    userType: 'patient' | 'provider'
  ) {
    super(
      `Cannot book appointment at ${newAppointmentTime.toISOString()} as it overlaps with existing ${userType} appointment ${existingAppointmentId} at ${existingAppointmentTime.toISOString()}`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.OVERLAP,
      { newAppointmentTime, existingAppointmentId, existingAppointmentTime, userType }
    );
  }
}

/**
 * Error thrown when a provider is unavailable for the requested appointment time.
 * This is a business logic error that occurs when attempting to book with a provider
 * who is not available during the requested time slot.
 */
export class AppointmentProviderUnavailableError extends AppException {
  /**
   * Creates a new AppointmentProviderUnavailableError instance.
   * 
   * @param providerId - ID of the provider who is unavailable
   * @param requestedTime - The time that was requested for the appointment
   * @param reason - Optional reason for the unavailability (e.g., 'out of office', 'fully booked')
   */
  constructor(providerId: string, requestedTime: Date, reason?: string) {
    super(
      `Provider ${providerId} is unavailable at ${requestedTime.toISOString()}${reason ? ` (${reason})` : ''}`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.PROVIDER_UNAVAILABLE,
      { providerId, requestedTime, reason }
    );
  }
}

/**
 * Error thrown when there is a failure in persisting appointment data to the database.
 * This is a technical error that indicates a problem with the database or data layer.
 */
export class AppointmentPersistenceError extends AppException {
  /**
   * Creates a new AppointmentPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., 'create', 'update', 'delete')
   * @param appointmentId - ID of the appointment, if available
   * @param cause - Original database error that caused this exception
   */
  constructor(operation: string, appointmentId?: string, cause?: Error) {
    super(
      `Failed to ${operation} appointment${appointmentId ? ` with ID ${appointmentId}` : ''} due to a database error`,
      ErrorType.TECHNICAL,
      AppointmentErrorCode.PERSISTENCE_ERROR,
      { operation, appointmentId },
      cause
    );
  }
}

/**
 * Error thrown when there is a failure in synchronizing appointment data with an external calendar system.
 * This is an external system error that indicates a problem with the integration to provider calendars,
 * patient calendars, or other external scheduling systems.
 */
export class AppointmentCalendarSyncError extends AppException {
  /**
   * Creates a new AppointmentCalendarSyncError instance.
   * 
   * @param appointmentId - ID of the appointment that failed to sync
   * @param calendarSystem - Name of the external calendar system (e.g., 'Google Calendar', 'Outlook')
   * @param operation - The operation that failed (e.g., 'create', 'update', 'delete')
   * @param cause - Original error from the external system that caused this exception
   */
  constructor(
    appointmentId: string,
    calendarSystem: string,
    operation: string,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} appointment ${appointmentId} in external calendar system ${calendarSystem}`,
      ErrorType.EXTERNAL,
      AppointmentErrorCode.CALENDAR_SYNC_ERROR,
      { appointmentId, calendarSystem, operation },
      cause
    );
  }
}