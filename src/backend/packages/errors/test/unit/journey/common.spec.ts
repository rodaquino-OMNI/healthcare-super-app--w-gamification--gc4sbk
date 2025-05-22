import { AppException, ErrorType } from '@backend/shared/src/exceptions/exceptions.types';
import { BusinessError, ResourceNotFoundError } from '../../../src/categories/business.errors';
import { Health, Care, Plan, Journey } from '../../../src/journey';

/**
 * These tests verify the common journey error functionality that applies across
 * all journey types (Health, Care, and Plan). They ensure consistent error handling
 * patterns across the application's journey-centered architecture.
 */
describe('Journey Error Common Functionality', () => {
  /**
   * Test the base JourneyError class inheritance hierarchy
   */
  describe('JourneyError Base Class', () => {
    it('should extend BusinessError', () => {
      // Create a journey error from any journey type
      const healthError = new Health.Metrics.InvalidMetricValueError('Test error', {
        metricType: 'HEART_RATE',
        value: 250,
        allowedRange: { min: 30, max: 220 }
      });

      // Verify inheritance chain
      expect(healthError).toBeInstanceOf(BusinessError);
      expect(healthError).toBeInstanceOf(AppException);
    });

    it('should have consistent error type across all journeys', () => {
      // Create errors from different journeys
      const healthError = new Health.Metrics.InvalidMetricValueError('Test error', {
        metricType: 'HEART_RATE',
        value: 250
      });
      
      const careError = new Care.Appointments.AppointmentNotFoundError('123');
      
      const planError = new Plan.Claims.ClaimNotFoundError('456');

      // All journey errors should have the same error type (BUSINESS)
      expect(healthError.type).toBe(ErrorType.BUSINESS);
      expect(careError.type).toBe(ErrorType.BUSINESS);
      expect(planError.type).toBe(ErrorType.BUSINESS);
    });
  });

  /**
   * Test common error classification functionality
   */
  describe('Error Classification', () => {
    it('should include journey prefix in error codes', () => {
      // Create errors from different journeys
      const healthError = new Health.Metrics.InvalidMetricValueError('Test error', {
        metricType: 'HEART_RATE',
        value: 250
      });
      
      const careError = new Care.Appointments.AppointmentNotFoundError('123');
      
      const planError = new Plan.Claims.ClaimNotFoundError('456');

      // Error codes should include journey prefixes
      expect(healthError.code).toMatch(/^HEALTH_/);
      expect(careError.code).toMatch(/^CARE_/);
      expect(planError.code).toMatch(/^PLAN_/);
    });

    it('should use consistent error code patterns across journeys', () => {
      // Resource not found errors should have consistent code patterns across journeys
      const healthResourceError = new Health.Metrics.MetricNotFoundError('123');
      const careResourceError = new Care.Appointments.AppointmentNotFoundError('456');
      const planResourceError = new Plan.Claims.ClaimNotFoundError('789');

      // All resource not found errors should have similar code patterns
      expect(healthResourceError.code).toMatch(/NOT_FOUND$/);
      expect(careResourceError.code).toMatch(/NOT_FOUND$/);
      expect(planResourceError.code).toMatch(/NOT_FOUND$/);
    });

    it('should provide specific error codes for domain-specific errors', () => {
      // Domain-specific errors should have unique error codes
      const healthMetricError = new Health.Metrics.InvalidMetricValueError('Test error', {
        metricType: 'HEART_RATE',
        value: 250
      });
      
      const careAppointmentError = new Care.Appointments.AppointmentOverlapError('123', {
        existingAppointmentId: '456',
        requestedTimeSlot: { start: new Date(), end: new Date() }
      });

      // Error codes should be specific to the domain
      expect(healthMetricError.code).toMatch(/METRIC/);
      expect(careAppointmentError.code).toMatch(/APPOINTMENT/);
    });
  });

  /**
   * Test context enrichment for journey-related errors
   */
  describe('Context Enrichment', () => {
    it('should include journey context in error messages', () => {
      // Create errors from different journeys
      const healthError = new Health.Metrics.MetricNotFoundError('123');
      const careError = new Care.Appointments.AppointmentNotFoundError('456');
      const planError = new Plan.Claims.ClaimNotFoundError('789');

      // Error messages should include journey context
      expect(healthError.message).toContain('health');
      expect(careError.message).toContain('care');
      expect(planError.message).toContain('plan');
    });

    it('should include detailed context in error details', () => {
      // Create an error with detailed context
      const healthError = new Health.Metrics.InvalidMetricValueError('Heart rate value out of range', {
        metricType: 'HEART_RATE',
        value: 250,
        allowedRange: { min: 30, max: 220 },
        userId: 'user123',
        timestamp: new Date()
      });

      // Error details should include all provided context
      expect(healthError.details).toHaveProperty('metricType', 'HEART_RATE');
      expect(healthError.details).toHaveProperty('value', 250);
      expect(healthError.details.allowedRange).toHaveProperty('min', 30);
      expect(healthError.details.allowedRange).toHaveProperty('max', 220);
      expect(healthError.details).toHaveProperty('userId', 'user123');
      expect(healthError.details).toHaveProperty('timestamp');
    });

    it('should support error chaining with cause property', () => {
      // Create a cause error
      const causeError = new Error('Original error');
      
      // Create a journey error with a cause
      const healthError = new Health.Metrics.MetricPersistenceError(
        'Failed to save metric',
        { metricId: '123', metricType: 'HEART_RATE' },
        causeError
      );

      // Error should have the cause property set
      expect(healthError.cause).toBe(causeError);
    });
  });

  /**
   * Test error propagation and capture mechanisms
   */
  describe('Error Propagation', () => {
    it('should convert to HTTP exceptions with appropriate status codes', () => {
      // Create a journey error
      const healthError = new Health.Metrics.InvalidMetricValueError('Heart rate value out of range', {
        metricType: 'HEART_RATE',
        value: 250
      });

      // Convert to HTTP exception
      const httpException = healthError.toHttpException();

      // Business errors should map to 422 Unprocessable Entity
      expect(httpException.getStatus()).toBe(422);
      
      // Response body should include error details
      const responseBody = httpException.getResponse();
      expect(responseBody).toHaveProperty('error');
      expect(responseBody.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(responseBody.error).toHaveProperty('code');
      expect(responseBody.error).toHaveProperty('message');
      expect(responseBody.error).toHaveProperty('details');
    });

    it('should serialize to JSON with standardized structure', () => {
      // Create a journey error
      const healthError = new Health.Metrics.MetricNotFoundError('123');

      // Convert to JSON
      const jsonError = healthError.toJSON();

      // JSON should have standardized structure
      expect(jsonError).toHaveProperty('error');
      expect(jsonError.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(jsonError.error).toHaveProperty('code');
      expect(jsonError.error).toHaveProperty('message');
      expect(jsonError.error).toHaveProperty('details');
    });

    it('should support cross-journey error handling', () => {
      // Create errors from different journeys
      const healthError = new Health.Metrics.MetricNotFoundError('123');
      const careError = new Care.Appointments.AppointmentNotFoundError('456');
      const planError = new Plan.Claims.ClaimNotFoundError('789');

      // All journey errors should be instances of ResourceNotFoundError
      expect(healthError).toBeInstanceOf(ResourceNotFoundError);
      expect(careError).toBeInstanceOf(ResourceNotFoundError);
      expect(planError).toBeInstanceOf(ResourceNotFoundError);

      // Function that handles any resource not found error
      const handleResourceNotFound = (error: ResourceNotFoundError) => {
        return `Resource ${error.resourceType} with ID ${error.resourceId} not found`;
      };

      // Should handle errors from any journey
      expect(handleResourceNotFound(healthError)).toContain('123');
      expect(handleResourceNotFound(careError)).toContain('456');
      expect(handleResourceNotFound(planError)).toContain('789');
    });
  });
});