import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

// Import the BaseError class and related types
import { BaseError, ErrorType } from '../../../src/base';
import { HTTP_STATUS_MAPPINGS } from '../../../src/constants';

// Import the business error classes
import {
  ResourceNotFoundError,
  ResourceExistsError,
  BusinessRuleViolationError,
  ConflictError,
  InsufficientPermissionsError,
  InvalidStateError
} from '../../../src/categories/business.errors';

/**
 * Test suite for business error classes
 * Verifies that all business error classes correctly extend BaseError,
 * provide appropriate error messages, HTTP status codes, and context details
 */
describe('Business Error Classes', () => {
  describe('ResourceNotFoundError', () => {
    it('should create a ResourceNotFoundError with default values', () => {
      const error = new ResourceNotFoundError();

      // Verify basic properties
      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.message).toBe('The requested resource was not found');
    });

    it('should create a ResourceNotFoundError with resource type and id', () => {
      const resourceType = 'User';
      const resourceId = '12345';
      const error = new ResourceNotFoundError(resourceType, resourceId);

      expect(error.message).toBe(`${resourceType} with id ${resourceId} was not found`);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.details).toEqual({ resourceType, resourceId });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create a ResourceNotFoundError with custom message and code', () => {
      const customMessage = 'Custom not found message';
      const customCode = 'CUSTOM_NOT_FOUND';
      const error = new ResourceNotFoundError(undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 404 status code', () => {
      const error = new ResourceNotFoundError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include resource details in serialized output', () => {
      const resourceType = 'HealthMetric';
      const resourceId = '67890';
      const error = new ResourceNotFoundError(resourceType, resourceId);
      const json = error.toJSON();

      expect(json.error.details).toEqual({ resourceType, resourceId });
    });
  });

  describe('ResourceExistsError', () => {
    it('should create a ResourceExistsError with default values', () => {
      const error = new ResourceExistsError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ResourceExistsError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('RESOURCE_EXISTS');
      expect(error.message).toBe('The resource already exists');
    });

    it('should create a ResourceExistsError with resource type and identifier', () => {
      const resourceType = 'User';
      const identifier = { email: 'test@example.com' };
      const error = new ResourceExistsError(resourceType, identifier);

      expect(error.message).toBe(`${resourceType} with the provided identifier already exists`);
      expect(error.code).toBe('RESOURCE_EXISTS');
      expect(error.details).toEqual({ resourceType, identifier });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create a ResourceExistsError with custom message and code', () => {
      const customMessage = 'Custom exists message';
      const customCode = 'CUSTOM_EXISTS';
      const error = new ResourceExistsError(undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 422 status code', () => {
      const error = new ResourceExistsError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include resource details in serialized output', () => {
      const resourceType = 'Appointment';
      const identifier = { doctorId: '123', date: '2023-05-01', slot: '10:00' };
      const error = new ResourceExistsError(resourceType, identifier);
      const json = error.toJSON();

      expect(json.error.details).toEqual({ resourceType, identifier });
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('should create a BusinessRuleViolationError with default values', () => {
      const error = new BusinessRuleViolationError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(BusinessRuleViolationError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.message).toBe('A business rule was violated');
    });

    it('should create a BusinessRuleViolationError with rule name and details', () => {
      const ruleName = 'MaxAppointmentsPerDay';
      const violationDetails = { 
        currentCount: 5, 
        maxAllowed: 3,
        userId: 'user123'
      };
      const error = new BusinessRuleViolationError(ruleName, violationDetails);

      expect(error.message).toBe(`Business rule '${ruleName}' was violated`);
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.details).toEqual({ ruleName, violationDetails });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create a BusinessRuleViolationError with custom message and code', () => {
      const customMessage = 'Custom rule violation message';
      const customCode = 'CUSTOM_RULE_VIOLATION';
      const error = new BusinessRuleViolationError(undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 422 status code', () => {
      const error = new BusinessRuleViolationError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include journey-specific context in serialized output', () => {
      const ruleName = 'MinimumHealthMetricsRequired';
      const violationDetails = { 
        requiredMetrics: ['weight', 'bloodPressure', 'heartRate'],
        providedMetrics: ['weight'],
        journeyContext: 'health'
      };
      const error = new BusinessRuleViolationError(ruleName, violationDetails);
      const json = error.toJSON();

      expect(json.error.details).toEqual({ ruleName, violationDetails });
      expect(json.error.details.violationDetails.journeyContext).toBe('health');
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with default values', () => {
      const error = new ConflictError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('CONFLICT');
      expect(error.message).toBe('The request conflicts with the current state');
    });

    it('should create a ConflictError with conflict details', () => {
      const conflictReason = 'Overlapping appointment';
      const conflictDetails = { 
        existingAppointment: { id: 'appt123', time: '10:00-11:00' },
        requestedTime: '10:30-11:30'
      };
      const error = new ConflictError(conflictReason, conflictDetails);

      expect(error.message).toBe(`Conflict: ${conflictReason}`);
      expect(error.code).toBe('CONFLICT');
      expect(error.details).toEqual({ conflictReason, conflictDetails });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create a ConflictError with custom message and code', () => {
      const customMessage = 'Custom conflict message';
      const customCode = 'CUSTOM_CONFLICT';
      const error = new ConflictError(undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 422 status code', () => {
      const error = new ConflictError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include conflict details in serialized output', () => {
      const conflictReason = 'Duplicate claim submission';
      const conflictDetails = { 
        existingClaimId: 'claim123',
        submissionDate: '2023-04-15',
        status: 'PROCESSING'
      };
      const error = new ConflictError(conflictReason, conflictDetails);
      const json = error.toJSON();

      expect(json.error.details).toEqual({ conflictReason, conflictDetails });
    });
  });

  describe('InsufficientPermissionsError', () => {
    it('should create an InsufficientPermissionsError with default values', () => {
      const error = new InsufficientPermissionsError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InsufficientPermissionsError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(error.message).toBe('You do not have sufficient permissions for this operation');
    });

    it('should create an InsufficientPermissionsError with required permissions', () => {
      const requiredPermissions = ['health:read', 'health:write'];
      const userPermissions = ['health:read'];
      const error = new InsufficientPermissionsError(requiredPermissions, userPermissions);

      expect(error.message).toBe('You do not have sufficient permissions for this operation');
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(error.details).toEqual({ requiredPermissions, userPermissions });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create an InsufficientPermissionsError with custom message and code', () => {
      const customMessage = 'Custom permissions message';
      const customCode = 'CUSTOM_PERMISSIONS';
      const error = new InsufficientPermissionsError(undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 422 status code', () => {
      const error = new InsufficientPermissionsError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include permission details in serialized output', () => {
      const requiredPermissions = ['plan:admin', 'plan:claims:approve'];
      const userPermissions = ['plan:claims:view'];
      const resourceId = 'claim123';
      const error = new InsufficientPermissionsError(
        requiredPermissions, 
        userPermissions, 
        undefined, 
        undefined, 
        { resourceId }
      );
      const json = error.toJSON();

      expect(json.error.details).toEqual({ 
        requiredPermissions, 
        userPermissions,
        resourceId 
      });
    });
  });

  describe('InvalidStateError', () => {
    it('should create an InvalidStateError with default values', () => {
      const error = new InvalidStateError();

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(InvalidStateError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('INVALID_STATE');
      expect(error.message).toBe('The operation cannot be performed in the current state');
    });

    it('should create an InvalidStateError with current and required states', () => {
      const currentState = 'DRAFT';
      const requiredStates = ['SUBMITTED', 'APPROVED'];
      const operation = 'finalizeDocument';
      const error = new InvalidStateError(currentState, requiredStates, operation);

      expect(error.message).toBe(`Cannot perform operation '${operation}' when in state '${currentState}'`);
      expect(error.code).toBe('INVALID_STATE');
      expect(error.details).toEqual({ currentState, requiredStates, operation });
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should create an InvalidStateError with custom message and code', () => {
      const customMessage = 'Custom state error message';
      const customCode = 'CUSTOM_STATE_ERROR';
      const error = new InvalidStateError(undefined, undefined, undefined, customMessage, customCode);

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(customCode);
      expect(error.type).toBe(ErrorType.BUSINESS);
    });

    it('should convert to HttpException with 422 status code', () => {
      const error = new InvalidStateError();
      const httpException = error.toHttpException();

      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(httpException.getResponse()).toEqual(error.toJSON());
    });

    it('should include state transition details in serialized output', () => {
      const currentState = 'SCHEDULED';
      const requiredStates = ['COMPLETED', 'CANCELLED'];
      const operation = 'rescheduleAppointment';
      const resourceId = 'appointment123';
      const error = new InvalidStateError(
        currentState, 
        requiredStates, 
        operation, 
        undefined, 
        undefined, 
        { resourceId }
      );
      const json = error.toJSON();

      expect(json.error.details).toEqual({ 
        currentState, 
        requiredStates, 
        operation,
        resourceId 
      });
    });
  });

  describe('Error Inheritance and Polymorphism', () => {
    it('should allow treating all business errors as BaseError', () => {
      const errors: BaseError[] = [
        new ResourceNotFoundError(),
        new ResourceExistsError(),
        new BusinessRuleViolationError(),
        new ConflictError(),
        new InsufficientPermissionsError(),
        new InvalidStateError()
      ];

      // All errors should be instances of BaseError
      errors.forEach(error => {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.BUSINESS);
        expect(error.toJSON()).toHaveProperty('error');
      });
    });

    it('should maintain specific error types when used polymorphically', () => {
      const errors: BaseError[] = [
        new ResourceNotFoundError('User', '123'),
        new ResourceExistsError('Email', { email: 'test@example.com' }),
        new BusinessRuleViolationError('MaxAppointments', { max: 3 }),
        new ConflictError('Overlapping appointment'),
        new InsufficientPermissionsError(['admin'], ['user']),
        new InvalidStateError('DRAFT', ['SUBMITTED'], 'approve')
      ];

      // Each error should maintain its specific type
      expect(errors[0]).toBeInstanceOf(ResourceNotFoundError);
      expect(errors[1]).toBeInstanceOf(ResourceExistsError);
      expect(errors[2]).toBeInstanceOf(BusinessRuleViolationError);
      expect(errors[3]).toBeInstanceOf(ConflictError);
      expect(errors[4]).toBeInstanceOf(InsufficientPermissionsError);
      expect(errors[5]).toBeInstanceOf(InvalidStateError);

      // Details should be preserved
      expect(errors[0].details).toHaveProperty('resourceType', 'User');
      expect(errors[1].details).toHaveProperty('resourceType', 'Email');
      expect(errors[2].details).toHaveProperty('ruleName', 'MaxAppointments');
      expect(errors[3].details).toHaveProperty('conflictReason', 'Overlapping appointment');
      expect(errors[4].details).toHaveProperty('requiredPermissions');
      expect(errors[5].details).toHaveProperty('currentState', 'DRAFT');
    });
  });

  describe('Journey-Specific Context', () => {
    it('should include journey context in business rule violations', () => {
      const ruleName = 'MaxHealthMetricsPerDay';
      const violationDetails = { 
        currentCount: 5, 
        maxAllowed: 3,
        userId: 'user123'
      };
      const context = {
        journeyContext: 'health',
        requestId: 'req-123'
      };
      
      const error = new BusinessRuleViolationError(
        ruleName, 
        violationDetails, 
        undefined, 
        undefined, 
        undefined, 
        context
      );

      expect(error.context.journeyContext).toBe('health');
      expect(error.context.requestId).toBe('req-123');
      
      const json = error.toJSON();
      expect(json.error.context.journeyContext).toBe('health');
    });

    it('should include journey context in resource not found errors', () => {
      const resourceType = 'Appointment';
      const resourceId = 'appt123';
      const context = {
        journeyContext: 'care',
        userId: 'user456'
      };
      
      const error = new ResourceNotFoundError(
        resourceType, 
        resourceId, 
        undefined, 
        undefined, 
        undefined, 
        context
      );

      expect(error.context.journeyContext).toBe('care');
      expect(error.context.userId).toBe('user456');
      
      const json = error.toJSON();
      expect(json.error.context.journeyContext).toBe('care');
    });

    it('should include journey context in invalid state errors', () => {
      const currentState = 'PENDING';
      const requiredStates = ['ACTIVE'];
      const operation = 'submitClaim';
      const context = {
        journeyContext: 'plan',
        requestId: 'req-789',
        userId: 'user789'
      };
      
      const error = new InvalidStateError(
        currentState, 
        requiredStates, 
        operation, 
        undefined, 
        undefined, 
        undefined, 
        context
      );

      expect(error.context.journeyContext).toBe('plan');
      expect(error.context.requestId).toBe('req-789');
      expect(error.context.userId).toBe('user789');
      
      const json = error.toJSON();
      expect(json.error.context.journeyContext).toBe('plan');
    });
  });

  describe('Error Cause Chain', () => {
    it('should propagate context from cause error', () => {
      // Create a cause error with context
      const causeError = new ResourceNotFoundError(
        'User',
        'user123',
        undefined,
        undefined,
        undefined,
        { journeyContext: 'health', requestId: 'req-123' }
      );

      // Create a higher-level error with the cause
      const error = new BusinessRuleViolationError(
        'UserRequired',
        { userId: 'user123' },
        undefined,
        undefined,
        causeError  // Cause error
      );

      // Context should be propagated from cause
      expect(error.cause).toBe(causeError);
      expect(error.context.journeyContext).toBe('health');
      expect(error.context.requestId).toBe('req-123');
      
      // Root cause should be accessible
      const rootCause = error.getRootCause();
      expect(rootCause).toBe(causeError);
      
      // Error chain should be formattable
      const errorChain = error.formatErrorChain();
      expect(errorChain).toContain('Business rule \'UserRequired\' was violated');
      expect(errorChain).toContain('User with id user123 was not found');
    });

    it('should create nested error chains with multiple business errors', () => {
      // Create a chain of business errors
      const level3Error = new ResourceNotFoundError(
        'HealthMetric',
        'metric123',
        undefined,
        'HEALTH_METRIC_NOT_FOUND'
      );
      
      const level2Error = new InvalidStateError(
        'INACTIVE',
        ['ACTIVE'],
        'recordMetric',
        undefined,
        'INVALID_USER_STATE',
        undefined,
        undefined,
        level3Error // Cause
      );
      
      const level1Error = new BusinessRuleViolationError(
        'HealthMetricRequired',
        { metricId: 'metric123' },
        undefined,
        'HEALTH_RULE_VIOLATION',
        level2Error // Cause
      );

      // Verify the error chain
      expect(level1Error.cause).toBe(level2Error);
      expect(level2Error.cause).toBe(level3Error);
      
      // Root cause should be the resource not found error
      const rootCause = level1Error.getRootCause();
      expect(rootCause).toBe(level3Error);
      expect(rootCause).toBeInstanceOf(ResourceNotFoundError);
      
      // Error chain should contain all messages
      const errorChain = level1Error.formatErrorChain();
      expect(errorChain).toContain('Business rule \'HealthMetricRequired\' was violated');
      expect(errorChain).toContain('Cannot perform operation \'recordMetric\' when in state \'INACTIVE\'');
      expect(errorChain).toContain('HealthMetric with id metric123 was not found');
    });
  });
});