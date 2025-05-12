import { describe, expect, it, jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the appointment error classes and related types
import {
  AppointmentNotFoundError,
  AppointmentDateInPastError,
  AppointmentOverlapError,
  AppointmentProviderUnavailableError,
  AppointmentPersistenceError,
  AppointmentCalendarSyncError
} from '../../../../src/journey/care/appointment-errors';
import { ErrorType, ErrorCategory } from '../../../../src/types';
import { HTTP_STATUS_MAPPINGS } from '../../../../src/constants';

/**
 * Test suite for Care journey appointment error classes
 * Verifies error code prefixing, context capture, classification, and HTTP status code mapping
 */
describe('Care Journey Appointment Errors', () => {
  // Sample appointment data for testing
  const appointmentId = 'appointment-123';
  const patientId = 'patient-456';
  const providerId = 'provider-789';
  const providerName = 'Dr. Jane Smith';
  const appointmentDate = new Date('2023-06-15T14:30:00Z');
  const appointmentStatus = 'scheduled';
  const appointmentType = 'initial-consultation';
  const appointmentDuration = 30; // minutes

  describe('AppointmentNotFoundError', () => {
    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture appointment ID in error context', () => {
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.id).toBe(appointmentId);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to NOT_FOUND HTTP status code', () => {
      const error = new AppointmentNotFoundError(appointmentId);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
    });

    it('should include appointment ID in error message', () => {
      const error = new AppointmentNotFoundError(appointmentId);

      expect(error.message).toContain(appointmentId);
    });
  });

  describe('AppointmentDateInPastError', () => {
    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentDateInPastError(appointmentDate);

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture appointment date details in error context', () => {
      const error = new AppointmentDateInPastError(appointmentDate);

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.date).toEqual(appointmentDate);
    });

    it('should be classified as a VALIDATION error type', () => {
      const error = new AppointmentDateInPastError(appointmentDate);

      expect(error.type).toBe(ErrorType.VALIDATION);
    });

    it('should map to BAD_REQUEST HTTP status code', () => {
      const error = new AppointmentDateInPastError(appointmentDate);
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should include date information in error message', () => {
      const error = new AppointmentDateInPastError(appointmentDate);

      expect(error.message).toContain('past');
      expect(error.message).toContain(appointmentDate.toISOString());
    });
  });

  describe('AppointmentOverlapError', () => {
    const existingAppointmentId = 'existing-appointment-123';
    const existingAppointmentDate = new Date('2023-06-15T14:00:00Z');

    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture appointment overlap details in error context', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.date).toEqual(appointmentDate);
      expect(error.context.appointment.duration).toBe(appointmentDuration);
      expect(error.context.appointment.existingAppointmentId).toBe(existingAppointmentId);
      expect(error.context.appointment.existingAppointmentDate).toEqual(existingAppointmentDate);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to CONFLICT HTTP status code', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should include overlap details in error message', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );

      expect(error.message).toContain('overlap');
      expect(error.message).toContain(appointmentDate.toISOString());
      expect(error.message).toContain(existingAppointmentDate.toISOString());
    });

    it('should suggest alternative time slots in error details', () => {
      const error = new AppointmentOverlapError(
        appointmentDate, 
        appointmentDuration, 
        existingAppointmentId, 
        existingAppointmentDate
      );

      expect(error.details).toBeDefined();
      expect(error.details.suggestedTimeSlots).toBeDefined();
      expect(Array.isArray(error.details.suggestedTimeSlots)).toBe(true);
      expect(error.details.suggestedTimeSlots.length).toBeGreaterThan(0);
    });
  });

  describe('AppointmentProviderUnavailableError', () => {
    const providerAvailability = {
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-06-30'),
      slots: ['morning', 'afternoon']
    };

    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture provider and appointment details in error context', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.date).toEqual(appointmentDate);
      expect(error.context.provider).toBeDefined();
      expect(error.context.provider.id).toBe(providerId);
      expect(error.context.provider.name).toBe(providerName);
      expect(error.context.provider.availability).toEqual(providerAvailability);
    });

    it('should be classified as a BUSINESS error type', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );

      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should map to CONFLICT HTTP status code', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.CONFLICT);
    });

    it('should include provider name and availability information in error message', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );

      expect(error.message).toContain(providerName);
      expect(error.message).toContain('unavailable');
      expect(error.message).toContain(appointmentDate.toISOString());
    });

    it('should suggest alternative providers in error details', () => {
      const error = new AppointmentProviderUnavailableError(
        providerId, 
        providerName, 
        appointmentDate, 
        providerAvailability
      );

      expect(error.details).toBeDefined();
      expect(error.details.suggestedProviders).toBeDefined();
      expect(Array.isArray(error.details.suggestedProviders)).toBe(true);
    });
  });

  describe('AppointmentPersistenceError', () => {
    const operation = 'create';
    const originalError = new Error('Database connection error');

    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture appointment and operation details in error context', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.id).toBe(appointmentId);
      expect(error.context.operation).toBe(operation);
    });

    it('should store original error as cause', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.cause).toBe(originalError);
    });

    it('should be classified as a TECHNICAL error type', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.type).toBe(ErrorType.TECHNICAL);
    });

    it('should be categorized as a TECHNICAL error category', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.category).toBe(ErrorCategory.TECHNICAL);
    });

    it('should map to INTERNAL_SERVER_ERROR HTTP status code', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should include operation and appointment ID in error message', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.message).toContain(operation);
      expect(error.message).toContain(appointmentId);
    });

    it('should include retry information in error details', () => {
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.details).toBeDefined();
      expect(error.details.retryable).toBeDefined();
      expect(typeof error.details.retryable).toBe('boolean');
    });
  });

  describe('AppointmentCalendarSyncError', () => {
    const calendarService = 'Google Calendar';
    const syncOperation = 'create';
    const originalError = new Error('API rate limit exceeded');

    it('should create error with CARE_APPOINTMENT_ prefixed error code', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.code).toBeDefined();
      expect(error.code.startsWith('CARE_APPOINTMENT_')).toBe(true);
    });

    it('should capture appointment and calendar service details in error context', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.context).toBeDefined();
      expect(error.context.appointment).toBeDefined();
      expect(error.context.appointment.id).toBe(appointmentId);
      expect(error.context.calendarService).toBe(calendarService);
      expect(error.context.operation).toBe(syncOperation);
    });

    it('should store original error as cause', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.cause).toBe(originalError);
    });

    it('should be classified as an EXTERNAL error type', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.type).toBe(ErrorType.EXTERNAL);
    });

    it('should be categorized as an EXTERNAL error category', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.category).toBe(ErrorCategory.EXTERNAL);
    });

    it('should map to SERVICE_UNAVAILABLE HTTP status code', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });

    it('should include calendar service name in error message', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.message).toContain(calendarService);
      expect(error.message).toContain(syncOperation);
    });

    it('should include fallback strategy information in error details', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.details).toBeDefined();
      expect(error.details.fallbackStrategy).toBeDefined();
      expect(typeof error.details.fallbackStrategy).toBe('string');
      expect(error.details.fallbackStrategy.length).toBeGreaterThan(0);
    });

    it('should include retry information in error details', () => {
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.details).toBeDefined();
      expect(error.details.retryable).toBeDefined();
      expect(typeof error.details.retryable).toBe('boolean');
      expect(error.details.retryAfter).toBeDefined();
      expect(typeof error.details.retryAfter).toBe('number');
    });
  });

  describe('Error Recovery and Fallback Strategies', () => {
    it('should provide fallback options for AppointmentCalendarSyncError', () => {
      const calendarService = 'Google Calendar';
      const syncOperation = 'create';
      const originalError = new Error('API rate limit exceeded');
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.getFallbackOptions).toBeDefined();
      expect(typeof error.getFallbackOptions).toBe('function');

      const fallbackOptions = error.getFallbackOptions();
      expect(fallbackOptions).toBeDefined();
      expect(Array.isArray(fallbackOptions)).toBe(true);
      expect(fallbackOptions.length).toBeGreaterThan(0);
    });

    it('should provide retry strategy for AppointmentCalendarSyncError', () => {
      const calendarService = 'Google Calendar';
      const syncOperation = 'create';
      const originalError = new Error('API rate limit exceeded');
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.getRetryStrategy).toBeDefined();
      expect(typeof error.getRetryStrategy).toBe('function');

      const retryStrategy = error.getRetryStrategy();
      expect(retryStrategy).toBeDefined();
      expect(retryStrategy.maxRetries).toBeDefined();
      expect(typeof retryStrategy.maxRetries).toBe('number');
      expect(retryStrategy.backoffFactor).toBeDefined();
      expect(typeof retryStrategy.backoffFactor).toBe('number');
    });

    it('should provide alternative calendar services when primary service is unavailable', () => {
      const calendarService = 'Google Calendar';
      const syncOperation = 'create';
      const originalError = new Error('API rate limit exceeded');
      const error = new AppointmentCalendarSyncError(
        appointmentId, 
        calendarService, 
        syncOperation, 
        originalError
      );

      expect(error.getAlternativeCalendarServices).toBeDefined();
      expect(typeof error.getAlternativeCalendarServices).toBe('function');

      const alternativeServices = error.getAlternativeCalendarServices();
      expect(alternativeServices).toBeDefined();
      expect(Array.isArray(alternativeServices)).toBe(true);
    });

    it('should provide retry strategy for AppointmentPersistenceError', () => {
      const operation = 'create';
      const originalError = new Error('Database connection error');
      const error = new AppointmentPersistenceError(
        appointmentId, 
        operation, 
        originalError
      );

      expect(error.getRetryStrategy).toBeDefined();
      expect(typeof error.getRetryStrategy).toBe('function');

      const retryStrategy = error.getRetryStrategy();
      expect(retryStrategy).toBeDefined();
      expect(retryStrategy.maxRetries).toBeDefined();
      expect(typeof retryStrategy.maxRetries).toBe('number');
      expect(retryStrategy.backoffFactor).toBeDefined();
      expect(typeof retryStrategy.backoffFactor).toBe('number');
    });
  });
});