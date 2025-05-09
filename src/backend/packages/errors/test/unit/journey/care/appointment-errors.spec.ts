import { HttpStatus } from '@nestjs/common';
import { ErrorType } from '../../../../../../../shared/src/exceptions/exceptions.types';
import {
  AppointmentNotFoundError,
  AppointmentDateInPastError,
  AppointmentOverlapError,
  AppointmentProviderUnavailableError,
  AppointmentCancellationWindowExpiredError,
  AppointmentInvalidDateFormatError,
  AppointmentInvalidDurationError,
  AppointmentMissingRequiredFieldsError,
  AppointmentCalendarSyncError,
  AppointmentNotificationDeliveryError,
  AppointmentPersistenceError,
  AppointmentSchedulingEngineError
} from '../../../../src/journey/care/appointment-errors';

/**
 * Test suite for Care journey appointment error classes.
 * Validates that appointment-related errors properly implement CARE_APPOINTMENT_ 
 * prefixed error codes, include appointment context, and follow the error 
 * classification system with appropriate HTTP status codes.
 */
describe('Care Journey Appointment Errors', () => {
  /**
   * Helper function to check if an error code starts with the expected prefix
   */
  const hasCorrectPrefix = (errorCode: string): boolean => {
    return errorCode.startsWith('CARE_APPT_');
  };

  /**
   * Helper function to get the expected HTTP status based on error type
   */
  const getExpectedHttpStatus = (errorType: ErrorType): HttpStatus => {
    switch (errorType) {
      case ErrorType.VALIDATION:
        return HttpStatus.BAD_REQUEST;
      case ErrorType.BUSINESS:
        return HttpStatus.UNPROCESSABLE_ENTITY;
      case ErrorType.EXTERNAL:
        return HttpStatus.BAD_GATEWAY;
      case ErrorType.TECHNICAL:
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  };

  describe('AppointmentNotFoundError', () => {
    const appointmentId = '12345';
    const error = new AppointmentNotFoundError(appointmentId);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentNotFoundError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the appointment ID in the error message', () => {
      expect(error.message).toContain(appointmentId);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });

    it('should include details when provided', () => {
      const details = { userId: 'user123' };
      const errorWithDetails = new AppointmentNotFoundError(appointmentId, details);
      expect(errorWithDetails.details).toEqual(details);
    });

    it('should include cause when provided', () => {
      const cause = new Error('Original error');
      const errorWithCause = new AppointmentNotFoundError(appointmentId, undefined, cause);
      expect(errorWithCause.cause).toBe(cause);
    });
  });

  describe('AppointmentDateInPastError', () => {
    const pastDate = new Date('2022-01-01T10:00:00');
    const error = new AppointmentDateInPastError(pastDate);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentDateInPastError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the past date in the error message', () => {
      expect(error.message).toContain(pastDate.toLocaleString());
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });

    it('should include details when provided', () => {
      const details = { requestedBy: 'user123' };
      const errorWithDetails = new AppointmentDateInPastError(pastDate, details);
      expect(errorWithDetails.details).toEqual(details);
    });
  });

  describe('AppointmentOverlapError', () => {
    const startTime = new Date('2023-05-15T14:00:00');
    const endTime = new Date('2023-05-15T15:00:00');
    const existingAppointmentId = 'appt789';
    const error = new AppointmentOverlapError(startTime, endTime, existingAppointmentId);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentOverlapError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the time range in the error message', () => {
      expect(error.message).toContain(startTime.toLocaleString());
      expect(error.message).toContain(endTime.toLocaleString());
    });

    it('should include the existing appointment ID when provided', () => {
      expect(error.message).toContain(existingAppointmentId);
    });

    it('should handle case when existing appointment ID is not provided', () => {
      const errorWithoutId = new AppointmentOverlapError(startTime, endTime);
      expect(errorWithoutId.message).not.toContain('conflicts with appointment ID');
      expect(errorWithoutId.message).toContain('overlaps with an existing appointment');
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });
  });

  describe('AppointmentProviderUnavailableError', () => {
    const providerId = 'provider456';
    const startTime = new Date('2023-06-20T09:00:00');
    const endTime = new Date('2023-06-20T10:00:00');
    const reason = 'Provider is on vacation';
    const error = new AppointmentProviderUnavailableError(providerId, startTime, endTime, reason);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentProviderUnavailableError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provider ID in the error message', () => {
      expect(error.message).toContain(providerId);
    });

    it('should include the time range in the error message', () => {
      expect(error.message).toContain(startTime.toLocaleString());
      expect(error.message).toContain(endTime.toLocaleString());
    });

    it('should include the reason when provided', () => {
      expect(error.message).toContain(reason);
    });

    it('should handle case when reason is not provided', () => {
      const errorWithoutReason = new AppointmentProviderUnavailableError(providerId, startTime, endTime);
      expect(errorWithoutReason.message).not.toContain(': ');
      expect(errorWithoutReason.message).toContain('is not available');
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });
  });

  describe('AppointmentCancellationWindowExpiredError', () => {
    const appointmentId = 'appt123';
    const appointmentTime = new Date('2023-07-10T13:00:00');
    const cancellationDeadline = new Date('2023-07-09T13:00:00');
    const error = new AppointmentCancellationWindowExpiredError(
      appointmentId,
      appointmentTime,
      cancellationDeadline
    );

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentCancellationWindowExpiredError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the appointment ID in the error message', () => {
      expect(error.message).toContain(appointmentId);
    });

    it('should include the appointment time in the error message', () => {
      expect(error.message).toContain(appointmentTime.toLocaleString());
    });

    it('should include the cancellation deadline in the error message', () => {
      expect(error.message).toContain(cancellationDeadline.toLocaleString());
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.BUSINESS));
    });
  });

  describe('AppointmentInvalidDateFormatError', () => {
    const providedValue = '2023/07/25';
    const expectedFormat = 'YYYY-MM-DD';
    const error = new AppointmentInvalidDateFormatError(providedValue, expectedFormat);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentInvalidDateFormatError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided value in the error message', () => {
      expect(error.message).toContain(providedValue);
    });

    it('should include the expected format in the error message', () => {
      expect(error.message).toContain(expectedFormat);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });
  });

  describe('AppointmentInvalidDurationError', () => {
    const providedDuration = 5;
    const minDuration = 15;
    const maxDuration = 60;
    const error = new AppointmentInvalidDurationError(providedDuration, minDuration, maxDuration);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentInvalidDurationError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the provided duration in the error message', () => {
      expect(error.message).toContain(providedDuration.toString());
    });

    it('should include the min and max duration in the error message', () => {
      expect(error.message).toContain(minDuration.toString());
      expect(error.message).toContain(maxDuration.toString());
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });
  });

  describe('AppointmentMissingRequiredFieldsError', () => {
    const missingFields = ['date', 'providerId', 'reason'];
    const error = new AppointmentMissingRequiredFieldsError(missingFields);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentMissingRequiredFieldsError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include all missing fields in the error message', () => {
      missingFields.forEach(field => {
        expect(error.message).toContain(field);
      });
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.VALIDATION));
    });
  });

  describe('AppointmentCalendarSyncError', () => {
    const appointmentId = 'appt456';
    const calendarSystem = 'Google Calendar';
    const operation = 'create';
    const error = new AppointmentCalendarSyncError(appointmentId, calendarSystem, operation);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentCalendarSyncError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the appointment ID in the error message', () => {
      expect(error.message).toContain(appointmentId);
    });

    it('should include the calendar system in the error message', () => {
      expect(error.message).toContain(calendarSystem);
    });

    it('should include the operation in the error message', () => {
      expect(error.message).toContain(operation);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });
  });

  describe('AppointmentNotificationDeliveryError', () => {
    const appointmentId = 'appt789';
    const notificationType = 'reminder';
    const channel = 'email';
    const error = new AppointmentNotificationDeliveryError(appointmentId, notificationType, channel);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentNotificationDeliveryError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the appointment ID in the error message', () => {
      expect(error.message).toContain(appointmentId);
    });

    it('should include the notification type in the error message', () => {
      expect(error.message).toContain(notificationType);
    });

    it('should include the channel in the error message', () => {
      expect(error.message).toContain(channel);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.EXTERNAL));
    });
  });

  describe('AppointmentPersistenceError', () => {
    const operation = 'update';
    const appointmentId = 'appt101';
    const error = new AppointmentPersistenceError(operation, appointmentId);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentPersistenceError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the operation in the error message', () => {
      expect(error.message).toContain(operation);
    });

    it('should include the appointment ID when provided', () => {
      expect(error.message).toContain(appointmentId);
    });

    it('should handle case when appointment ID is not provided', () => {
      const errorWithoutId = new AppointmentPersistenceError(operation);
      expect(errorWithoutId.message).not.toContain('with ID');
      expect(errorWithoutId.message).toContain(`Failed to ${operation} appointment data`);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.TECHNICAL));
    });
  });

  describe('AppointmentSchedulingEngineError', () => {
    const operation = 'findAvailableSlots';
    const errorDetails = 'Invalid provider calendar format';
    const error = new AppointmentSchedulingEngineError(operation, errorDetails);

    it('should extend AppException', () => {
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('AppointmentSchedulingEngineError');
    });

    it('should have the correct error type', () => {
      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should have an error code with the correct prefix', () => {
      expect(hasCorrectPrefix(error.code)).toBe(true);
    });

    it('should include the operation in the error message', () => {
      expect(error.message).toContain(operation);
    });

    it('should include the error details in the error message', () => {
      expect(error.message).toContain(errorDetails);
    });

    it('should map to the correct HTTP status code', () => {
      const httpException = error.toHttpException();
      expect(httpException.getStatus()).toBe(getExpectedHttpStatus(ErrorType.TECHNICAL));
    });
  });
});