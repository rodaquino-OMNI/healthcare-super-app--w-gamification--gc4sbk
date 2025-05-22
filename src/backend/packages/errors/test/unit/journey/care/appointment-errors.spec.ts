import { HttpStatus } from '@nestjs/common';
import {
  AppointmentNotFoundError,
  AppointmentDateInPastError,
  AppointmentOverlapError,
  AppointmentProviderUnavailableError,
  AppointmentPersistenceError,
  AppointmentCalendarSyncError,
  AppointmentErrorCode
} from '../../../../src/journey/care/appointment-errors';
import { ErrorType } from '../../../../src/base';

describe('Care Journey Appointment Errors', () => {
  describe('Error Code Prefixing', () => {
    it('should use CARE_APPT_ prefix for all error codes', () => {
      // Check that all error codes follow the correct prefix pattern
      Object.values(AppointmentErrorCode).forEach(code => {
        expect(code).toMatch(/^CARE_APPT_\d{3}$/);
      });
    });

    it('should have unique error codes', () => {
      const codes = Object.values(AppointmentErrorCode);
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(codes.length);
    });
  });

  describe('AppointmentNotFoundError', () => {
    it('should create error with correct properties', () => {
      const appointmentId = 'appt-123';
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.message).toContain(appointmentId);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(AppointmentErrorCode.NOT_FOUND);
      expect(error.details).toEqual({ appointmentId });
    });

    it('should include cause if provided', () => {
      const appointmentId = 'appt-123';
      const cause = new Error('Database error');
      const error = new AppointmentNotFoundError(appointmentId, cause);

      expect(error.cause).toBe(cause);
    });

    it('should map to correct HTTP status code', () => {
      const error = new AppointmentNotFoundError('appt-123');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  describe('AppointmentDateInPastError', () => {
    it('should create error with correct properties', () => {
      const appointmentDate = new Date('2023-01-01T10:00:00Z');
      const currentDate = new Date('2023-01-02T10:00:00Z');
      const error = new AppointmentDateInPastError(appointmentDate, currentDate);

      expect(error.message).toContain(appointmentDate.toISOString());
      expect(error.message).toContain(currentDate.toISOString());
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe(AppointmentErrorCode.DATE_IN_PAST);
      expect(error.details).toEqual({ appointmentDate, currentDate });
    });

    it('should map to correct HTTP status code', () => {
      const appointmentDate = new Date('2023-01-01T10:00:00Z');
      const currentDate = new Date('2023-01-02T10:00:00Z');
      const error = new AppointmentDateInPastError(appointmentDate, currentDate);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('AppointmentOverlapError', () => {
    it('should create error with correct properties', () => {
      const newAppointmentTime = new Date('2023-01-01T10:00:00Z');
      const existingAppointmentId = 'appt-456';
      const existingAppointmentTime = new Date('2023-01-01T09:30:00Z');
      const userType = 'patient';

      const error = new AppointmentOverlapError(
        newAppointmentTime,
        existingAppointmentId,
        existingAppointmentTime,
        userType
      );

      expect(error.message).toContain(newAppointmentTime.toISOString());
      expect(error.message).toContain(existingAppointmentId);
      expect(error.message).toContain(existingAppointmentTime.toISOString());
      expect(error.message).toContain(userType);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(AppointmentErrorCode.OVERLAP);
      expect(error.details).toEqual({
        newAppointmentTime,
        existingAppointmentId,
        existingAppointmentTime,
        userType
      });
    });

    it('should handle provider overlap', () => {
      const newAppointmentTime = new Date('2023-01-01T10:00:00Z');
      const existingAppointmentId = 'appt-456';
      const existingAppointmentTime = new Date('2023-01-01T09:30:00Z');
      const userType = 'provider';

      const error = new AppointmentOverlapError(
        newAppointmentTime,
        existingAppointmentId,
        existingAppointmentTime,
        userType
      );

      expect(error.message).toContain('provider');
      expect(error.details.userType).toBe('provider');
    });

    it('should map to correct HTTP status code', () => {
      const newAppointmentTime = new Date('2023-01-01T10:00:00Z');
      const existingAppointmentId = 'appt-456';
      const existingAppointmentTime = new Date('2023-01-01T09:30:00Z');
      const userType = 'patient';

      const error = new AppointmentOverlapError(
        newAppointmentTime,
        existingAppointmentId,
        existingAppointmentTime,
        userType
      );
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.CONFLICT);
    });
  });

  describe('AppointmentProviderUnavailableError', () => {
    it('should create error with correct properties', () => {
      const providerId = 'provider-123';
      const requestedTime = new Date('2023-01-01T10:00:00Z');
      const error = new AppointmentProviderUnavailableError(providerId, requestedTime);

      expect(error.message).toContain(providerId);
      expect(error.message).toContain(requestedTime.toISOString());
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe(AppointmentErrorCode.PROVIDER_UNAVAILABLE);
      expect(error.details).toEqual({ providerId, requestedTime, reason: undefined });
    });

    it('should include reason if provided', () => {
      const providerId = 'provider-123';
      const requestedTime = new Date('2023-01-01T10:00:00Z');
      const reason = 'out of office';
      const error = new AppointmentProviderUnavailableError(providerId, requestedTime, reason);

      expect(error.message).toContain(reason);
      expect(error.details.reason).toBe(reason);
    });

    it('should map to correct HTTP status code', () => {
      const providerId = 'provider-123';
      const requestedTime = new Date('2023-01-01T10:00:00Z');
      const error = new AppointmentProviderUnavailableError(providerId, requestedTime);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('AppointmentPersistenceError', () => {
    it('should create error with correct properties', () => {
      const operation = 'create';
      const error = new AppointmentPersistenceError(operation);

      expect(error.message).toContain(operation);
      expect(error.type).toBe(ErrorType.TECHNICAL);
      expect(error.code).toBe(AppointmentErrorCode.PERSISTENCE_ERROR);
      expect(error.details).toEqual({ operation, appointmentId: undefined });
    });

    it('should include appointmentId if provided', () => {
      const operation = 'update';
      const appointmentId = 'appt-123';
      const error = new AppointmentPersistenceError(operation, appointmentId);

      expect(error.message).toContain(appointmentId);
      expect(error.details.appointmentId).toBe(appointmentId);
    });

    it('should include cause if provided', () => {
      const operation = 'delete';
      const appointmentId = 'appt-123';
      const cause = new Error('Database error');
      const error = new AppointmentPersistenceError(operation, appointmentId, cause);

      expect(error.cause).toBe(cause);
    });

    it('should map to correct HTTP status code', () => {
      const error = new AppointmentPersistenceError('create');
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe('AppointmentCalendarSyncError', () => {
    it('should create error with correct properties', () => {
      const appointmentId = 'appt-123';
      const calendarSystem = 'Google Calendar';
      const operation = 'create';
      const error = new AppointmentCalendarSyncError(appointmentId, calendarSystem, operation);

      expect(error.message).toContain(appointmentId);
      expect(error.message).toContain(calendarSystem);
      expect(error.message).toContain(operation);
      expect(error.type).toBe(ErrorType.EXTERNAL);
      expect(error.code).toBe(AppointmentErrorCode.CALENDAR_SYNC_ERROR);
      expect(error.details).toEqual({ appointmentId, calendarSystem, operation });
    });

    it('should include cause if provided', () => {
      const appointmentId = 'appt-123';
      const calendarSystem = 'Google Calendar';
      const operation = 'create';
      const cause = new Error('API error');
      const error = new AppointmentCalendarSyncError(appointmentId, calendarSystem, operation, cause);

      expect(error.cause).toBe(cause);
    });

    it('should map to correct HTTP status code', () => {
      const appointmentId = 'appt-123';
      const calendarSystem = 'Google Calendar';
      const operation = 'create';
      const error = new AppointmentCalendarSyncError(appointmentId, calendarSystem, operation);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_GATEWAY);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize appointment errors to JSON with correct structure', () => {
      const appointmentId = 'appt-123';
      const error = new AppointmentNotFoundError(appointmentId);
      const jsonResult = error.toJSON();

      expect(jsonResult).toHaveProperty('error');
      expect(jsonResult.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonResult.error).toHaveProperty('code', AppointmentErrorCode.NOT_FOUND);
      expect(jsonResult.error).toHaveProperty('message');
      expect(jsonResult.error).toHaveProperty('details', { appointmentId });
      expect(jsonResult.error).toHaveProperty('timestamp');
    });

    it('should provide detailed JSON for logging and debugging', () => {
      const appointmentId = 'appt-123';
      const cause = new Error('Database error');
      const error = new AppointmentNotFoundError(appointmentId, cause);
      const detailedJson = error.toDetailedJSON();

      expect(detailedJson).toHaveProperty('name', 'AppointmentNotFoundError');
      expect(detailedJson).toHaveProperty('message');
      expect(detailedJson).toHaveProperty('type', ErrorType.BUSINESS);
      expect(detailedJson).toHaveProperty('code', AppointmentErrorCode.NOT_FOUND);
      expect(detailedJson).toHaveProperty('details', { appointmentId });
      expect(detailedJson).toHaveProperty('context');
      expect(detailedJson.context).toHaveProperty('timestamp');
      expect(detailedJson.context).toHaveProperty('stack');
      expect(detailedJson).toHaveProperty('cause');
      expect(detailedJson.cause).toHaveProperty('name', 'Error');
      expect(detailedJson.cause).toHaveProperty('message', 'Database error');
    });
  });
});