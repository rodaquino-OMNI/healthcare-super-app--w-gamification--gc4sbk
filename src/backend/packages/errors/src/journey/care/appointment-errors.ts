import { AppException, ErrorType } from '../../../../../shared/src/exceptions/exceptions.types';
import { AppointmentErrorCode } from './error-codes';

/**
 * Error thrown when an appointment cannot be found in the system.
 * This is a business logic error that occurs when attempting to access
 * or operate on an appointment that does not exist in the database.
 */
export class AppointmentNotFoundError extends AppException {
  /**
   * Creates a new AppointmentNotFoundError instance.
   * 
   * @param appointmentId - ID of the appointment that was not found
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    appointmentId: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Appointment with ID ${appointmentId} could not be found. Please verify the appointment ID or check your scheduled appointments.`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.NOT_FOUND,
      details,
      cause
    );
  }
}

/**
 * Error thrown when attempting to book an appointment with a date in the past.
 * This is a validation error that occurs when the requested appointment date
 * is earlier than the current date and time.
 */
export class AppointmentDateInPastError extends AppException {
  /**
   * Creates a new AppointmentDateInPastError instance.
   * 
   * @param requestedDate - The past date that was requested
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    requestedDate: Date,
    details?: any,
    cause?: Error
  ) {
    super(
      `Cannot book an appointment for ${requestedDate.toLocaleString()} as this date is in the past. Please select a future date and time for your appointment.`,
      ErrorType.VALIDATION,
      AppointmentErrorCode.DATE_IN_PAST,
      details,
      cause
    );
  }
}

/**
 * Error thrown when an appointment overlaps with another existing appointment.
 * This is a business logic error that occurs when attempting to schedule
 * an appointment that conflicts with an existing appointment time slot.
 */
export class AppointmentOverlapError extends AppException {
  /**
   * Creates a new AppointmentOverlapError instance.
   * 
   * @param requestedStart - The requested start time that overlaps
   * @param requestedEnd - The requested end time that overlaps
   * @param existingAppointmentId - ID of the existing appointment that conflicts (optional)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    requestedStart: Date,
    requestedEnd: Date,
    existingAppointmentId?: string,
    details?: any,
    cause?: Error
  ) {
    const existingAppointmentMessage = existingAppointmentId 
      ? ` (conflicts with appointment ID: ${existingAppointmentId})` 
      : '';
    
    super(
      `The requested appointment time from ${requestedStart.toLocaleString()} to ${requestedEnd.toLocaleString()} overlaps with an existing appointment${existingAppointmentMessage}. Please select a different time slot.`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.OVERLAP,
      details,
      cause
    );
  }
}

/**
 * Error thrown when a provider is not available for the requested appointment time.
 * This is a business logic error that occurs when attempting to schedule
 * with a provider who is not available during the requested time slot.
 */
export class AppointmentProviderUnavailableError extends AppException {
  /**
   * Creates a new AppointmentProviderUnavailableError instance.
   * 
   * @param providerId - ID of the unavailable provider
   * @param requestedStart - The requested start time
   * @param requestedEnd - The requested end time
   * @param reason - Specific reason for unavailability (optional)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providerId: string,
    requestedStart: Date,
    requestedEnd: Date,
    reason?: string,
    details?: any,
    cause?: Error
  ) {
    const reasonMessage = reason ? `: ${reason}` : '';
    
    super(
      `Provider with ID ${providerId} is not available from ${requestedStart.toLocaleString()} to ${requestedEnd.toLocaleString()}${reasonMessage}. Please select a different time slot or provider.`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.PROVIDER_UNAVAILABLE,
      details,
      cause
    );
  }
}

/**
 * Error thrown when an appointment cannot be canceled because the cancellation window has expired.
 * This is a business logic error that occurs when attempting to cancel an appointment
 * too close to the scheduled time, violating the cancellation policy.
 */
export class AppointmentCancellationWindowExpiredError extends AppException {
  /**
   * Creates a new AppointmentCancellationWindowExpiredError instance.
   * 
   * @param appointmentId - ID of the appointment that cannot be canceled
   * @param appointmentTime - The scheduled appointment time
   * @param cancellationDeadline - The deadline by which cancellation was required
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    appointmentId: string,
    appointmentTime: Date,
    cancellationDeadline: Date,
    details?: any,
    cause?: Error
  ) {
    super(
      `Cannot cancel appointment with ID ${appointmentId} scheduled for ${appointmentTime.toLocaleString()} as the cancellation deadline (${cancellationDeadline.toLocaleString()}) has passed. Please contact customer support for assistance.`,
      ErrorType.BUSINESS,
      AppointmentErrorCode.CANCELLATION_WINDOW_EXPIRED,
      details,
      cause
    );
  }
}

/**
 * Error thrown when appointment data fails validation due to invalid date format.
 * This is a validation error that occurs when the provided date/time format
 * for an appointment is invalid or cannot be parsed.
 */
export class AppointmentInvalidDateFormatError extends AppException {
  /**
   * Creates a new AppointmentInvalidDateFormatError instance.
   * 
   * @param providedValue - The invalid date value that was provided
   * @param expectedFormat - The expected date format
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providedValue: string,
    expectedFormat: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Invalid date format: "${providedValue}". Expected format: ${expectedFormat}. Please provide the date in the correct format.`,
      ErrorType.VALIDATION,
      AppointmentErrorCode.INVALID_DATE_FORMAT,
      details,
      cause
    );
  }
}

/**
 * Error thrown when appointment data fails validation due to invalid duration.
 * This is a validation error that occurs when the provided appointment duration
 * is invalid, too short, or too long.
 */
export class AppointmentInvalidDurationError extends AppException {
  /**
   * Creates a new AppointmentInvalidDurationError instance.
   * 
   * @param providedDuration - The invalid duration that was provided (in minutes)
   * @param minDuration - The minimum allowed duration (in minutes)
   * @param maxDuration - The maximum allowed duration (in minutes)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    providedDuration: number,
    minDuration: number,
    maxDuration: number,
    details?: any,
    cause?: Error
  ) {
    super(
      `Invalid appointment duration: ${providedDuration} minutes. Duration must be between ${minDuration} and ${maxDuration} minutes. Please select a valid duration.`,
      ErrorType.VALIDATION,
      AppointmentErrorCode.INVALID_DURATION,
      details,
      cause
    );
  }
}

/**
 * Error thrown when appointment data is missing required fields.
 * This is a validation error that occurs when required appointment data
 * fields are missing or empty.
 */
export class AppointmentMissingRequiredFieldsError extends AppException {
  /**
   * Creates a new AppointmentMissingRequiredFieldsError instance.
   * 
   * @param missingFields - Array of field names that are missing
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    missingFields: string[],
    details?: any,
    cause?: Error
  ) {
    super(
      `Missing required fields for appointment: ${missingFields.join(', ')}. Please provide all required information.`,
      ErrorType.VALIDATION,
      AppointmentErrorCode.MISSING_REQUIRED_FIELDS,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in synchronizing with an external calendar system.
 * This is an external system error that occurs when the application fails to
 * communicate with or update an external calendar system.
 */
export class AppointmentCalendarSyncError extends AppException {
  /**
   * Creates a new AppointmentCalendarSyncError instance.
   * 
   * @param appointmentId - ID of the appointment that failed to sync
   * @param calendarSystem - Name of the calendar system (e.g., "Google Calendar", "Outlook")
   * @param operation - The operation that failed (e.g., "create", "update", "delete")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    appointmentId: string,
    calendarSystem: string,
    operation: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} appointment with ID ${appointmentId} in ${calendarSystem}. The appointment has been saved in our system, but may not appear in your external calendar. Please add it manually or try syncing again later.`,
      ErrorType.EXTERNAL,
      AppointmentErrorCode.CALENDAR_SYNC_ERROR,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in delivering appointment notifications.
 * This is an external system error that occurs when the application fails to
 * send notifications about appointment creation, updates, or reminders.
 */
export class AppointmentNotificationDeliveryError extends AppException {
  /**
   * Creates a new AppointmentNotificationDeliveryError instance.
   * 
   * @param appointmentId - ID of the appointment for which notification failed
   * @param notificationType - Type of notification (e.g., "confirmation", "reminder", "update")
   * @param channel - Notification channel (e.g., "email", "sms", "push")
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    appointmentId: string,
    notificationType: string,
    channel: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Failed to send ${notificationType} notification for appointment with ID ${appointmentId} via ${channel}. The appointment has been processed successfully, but you may not receive a notification. Please check your appointment details in the app.`,
      ErrorType.EXTERNAL,
      AppointmentErrorCode.NOTIFICATION_DELIVERY_ERROR,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in persisting appointment data.
 * This is a technical error that occurs when the application fails to
 * save, update, or delete appointment information in the database.
 */
export class AppointmentPersistenceError extends AppException {
  /**
   * Creates a new AppointmentPersistenceError instance.
   * 
   * @param operation - The database operation that failed (e.g., "create", "update", "delete")
   * @param appointmentId - ID of the appointment (if available)
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    appointmentId?: string,
    details?: any,
    cause?: Error
  ) {
    const appointmentIdMessage = appointmentId ? ` with ID ${appointmentId}` : '';
    super(
      `Failed to ${operation} appointment data${appointmentIdMessage} in the database. This is a temporary system issue. Please try again later.`,
      ErrorType.TECHNICAL,
      AppointmentErrorCode.PERSISTENCE_ERROR,
      details,
      cause
    );
  }
}

/**
 * Error thrown when there's a failure in the appointment scheduling engine.
 * This is a technical error that occurs when the application's scheduling
 * logic encounters an unexpected error or inconsistency.
 */
export class AppointmentSchedulingEngineError extends AppException {
  /**
   * Creates a new AppointmentSchedulingEngineError instance.
   * 
   * @param operation - The scheduling operation that failed
   * @param errorDetails - Technical details about the error
   * @param details - Additional details about the error (optional)
   * @param cause - Original error that caused this exception, if any (optional)
   */
  constructor(
    operation: string,
    errorDetails: string,
    details?: any,
    cause?: Error
  ) {
    super(
      `Scheduling engine error during ${operation}: ${errorDetails}. This is a temporary system issue. Please try again later.`,
      ErrorType.TECHNICAL,
      AppointmentErrorCode.SCHEDULING_ENGINE_ERROR,
      details,
      cause
    );
  }
}