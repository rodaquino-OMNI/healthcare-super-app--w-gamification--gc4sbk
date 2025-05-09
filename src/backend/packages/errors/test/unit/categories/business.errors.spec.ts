import { HttpStatus } from '@nestjs/common';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';
import {
  BusinessError,
  ResourceNotFoundError,
  ResourceExistsError,
  BusinessRuleViolationError,
  ConflictError,
  InsufficientPermissionsError,
  InvalidStateError
} from '../../../src/categories/business.errors';

describe('Business Errors', () => {
  // Test the base BusinessError class
  describe('BusinessError', () => {
    it('should create a BusinessError with required properties', () => {
      const error = new BusinessError('Test business error', 'BUS_001');
      
      expect(error).toBeInstanceOf(BusinessError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('Test business error');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('BUS_001');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create a BusinessError with all properties', () => {
      const context = { journey: JourneyContext.HEALTH, userId: 'user123' };
      const details = { field: 'name', constraint: 'required' };
      const suggestion = 'Please provide a name';
      const cause = new Error('Original error');
      
      const error = new BusinessError(
        'Test business error',
        'BUS_001',
        details,
        context,
        suggestion,
        cause
      );
      
      expect(error.message).toBe('Test business error');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('BUS_001');
      expect(error.context).toEqual(context);
      expect(error.details).toEqual(details);
      expect(error.suggestion).toBe(suggestion);
      expect(error.cause).toBe(cause);
    });

    it('should serialize to JSON correctly', () => {
      const timestamp = new Date('2023-01-01T00:00:00Z');
      const context = { 
        journey: JourneyContext.HEALTH, 
        userId: 'user123',
        timestamp
      };
      
      const error = new BusinessError(
        'Test business error',
        'BUS_001',
        { field: 'name' },
        context,
        'Please provide a name'
      );
      
      const serialized = error.toJSON();
      
      expect(serialized).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'BUS_001',
          message: 'Test business error',
          journey: JourneyContext.HEALTH,
          timestamp: timestamp.toISOString(),
          details: { field: 'name' },
          suggestion: 'Please provide a name'
        }
      });
    });
  });

  // Test ResourceNotFoundError
  describe('ResourceNotFoundError', () => {
    it('should create a ResourceNotFoundError with correct message format', () => {
      const error = new ResourceNotFoundError('User', '123');
      
      expect(error).toBeInstanceOf(ResourceNotFoundError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error).toBeInstanceOf(BaseError);
      expect(error.message).toBe('User not found with ID: 123');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('RESOURCE_NOT_FOUND');
      expect(error.details).toEqual({ resourceType: 'User', resourceId: '123' });
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.CARE };
      const error = new ResourceNotFoundError('Appointment', 456, context);
      
      expect(error.message).toBe('Appointment not found with ID: 456');
      expect(error.context).toEqual(context);
      expect(error.details).toEqual({ resourceType: 'Appointment', resourceId: 456 });
    });

    it('should include a helpful suggestion', () => {
      const error = new ResourceNotFoundError('User', '123');
      
      expect(error.suggestion).toBe('Please check that the User exists and that you have permission to access it');
    });

    it('should return 404 Not Found status code', () => {
      const error = new ResourceNotFoundError('User', '123');
      
      // ResourceNotFoundError should override the default BUSINESS error status code
      expect(error.getHttpStatusCode()).toBe(HttpStatus.NOT_FOUND);
    });
  });

  // Test ResourceExistsError
  describe('ResourceExistsError', () => {
    it('should create a ResourceExistsError with string identifier', () => {
      const error = new ResourceExistsError('User', 'email@example.com');
      
      expect(error).toBeInstanceOf(ResourceExistsError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('User already exists with identifier: email@example.com');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('RESOURCE_EXISTS');
      expect(error.details).toEqual({ resourceType: 'User', identifier: 'email@example.com' });
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create a ResourceExistsError with numeric identifier', () => {
      const error = new ResourceExistsError('Product', 123);
      
      expect(error.message).toBe('Product already exists with identifier: 123');
      expect(error.details).toEqual({ resourceType: 'Product', identifier: 123 });
    });

    it('should create a ResourceExistsError with object identifier', () => {
      const identifier = { email: 'email@example.com', username: 'user123' };
      const error = new ResourceExistsError('User', identifier);
      
      expect(error.message).toBe('User already exists with identifier: {"email":"email@example.com","username":"user123"}');
      expect(error.details).toEqual({ resourceType: 'User', identifier });
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.PLAN };
      const error = new ResourceExistsError('Claim', 'CLM-123', context);
      
      expect(error.context).toEqual(context);
    });

    it('should include a helpful suggestion', () => {
      const error = new ResourceExistsError('User', 'email@example.com');
      
      expect(error.suggestion).toBe('Please use a different identifier or update the existing User');
    });
  });

  // Test BusinessRuleViolationError
  describe('BusinessRuleViolationError', () => {
    it('should create a BusinessRuleViolationError with required properties', () => {
      const error = new BusinessRuleViolationError(
        'MaxAppointmentsPerDay',
        'Cannot book more than 3 appointments per day'
      );
      
      expect(error).toBeInstanceOf(BusinessRuleViolationError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Cannot book more than 3 appointments per day');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('BUSINESS_RULE_VIOLATION');
      expect(error.details).toEqual({ ruleName: 'MaxAppointmentsPerDay' });
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create a BusinessRuleViolationError with additional details', () => {
      const details = { current: 3, maximum: 3 };
      const error = new BusinessRuleViolationError(
        'MaxAppointmentsPerDay',
        'Cannot book more than 3 appointments per day',
        details
      );
      
      expect(error.details).toEqual({ 
        ruleName: 'MaxAppointmentsPerDay',
        current: 3, 
        maximum: 3 
      });
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.CARE, userId: 'user123' };
      const error = new BusinessRuleViolationError(
        'MaxAppointmentsPerDay',
        'Cannot book more than 3 appointments per day',
        undefined,
        context
      );
      
      expect(error.context).toEqual(context);
    });

    it('should serialize with rule name in details', () => {
      const error = new BusinessRuleViolationError(
        'MinimumAge',
        'User must be at least 18 years old',
        { current: 16, minimum: 18 }
      );
      
      const serialized = error.toJSON();
      
      expect(serialized.error.details).toEqual({
        ruleName: 'MinimumAge',
        current: 16,
        minimum: 18
      });
    });
  });

  // Test ConflictError
  describe('ConflictError', () => {
    it('should create a ConflictError with required properties', () => {
      const error = new ConflictError('Appointment time slot is already booked');
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Appointment time slot is already booked');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('CONFLICT');
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create a ConflictError with details', () => {
      const details = { appointmentId: 123, timeSlot: '2023-01-01T10:00:00Z' };
      const error = new ConflictError(
        'Appointment time slot is already booked',
        details
      );
      
      expect(error.details).toEqual(details);
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.CARE };
      const error = new ConflictError(
        'Appointment time slot is already booked',
        undefined,
        context
      );
      
      expect(error.context).toEqual(context);
    });

    it('should include a helpful suggestion', () => {
      const error = new ConflictError('Appointment time slot is already booked');
      
      expect(error.suggestion).toBe('Please resolve the conflict and try again');
    });
  });

  // Test InsufficientPermissionsError
  describe('InsufficientPermissionsError', () => {
    it('should create an InsufficientPermissionsError with required properties', () => {
      const error = new InsufficientPermissionsError('admin:write');
      
      expect(error).toBeInstanceOf(InsufficientPermissionsError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Insufficient permissions: admin:write is required');
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('INSUFFICIENT_PERMISSIONS');
      expect(error.details).toEqual({ requiredPermission: 'admin:write' });
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.PLAN };
      const error = new InsufficientPermissionsError('claims:edit', context);
      
      expect(error.context).toEqual(context);
    });

    it('should include a helpful suggestion', () => {
      const error = new InsufficientPermissionsError('admin:write');
      
      expect(error.suggestion).toBe('Please contact an administrator to request the necessary permissions');
    });
  });

  // Test InvalidStateError
  describe('InvalidStateError', () => {
    it('should create an InvalidStateError with single expected state', () => {
      const error = new InvalidStateError('COMPLETED', 'PENDING', 'Order');
      
      expect(error).toBeInstanceOf(InvalidStateError);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe("Invalid state: Order is in state 'COMPLETED' but expected 'PENDING'");
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.code).toBe('INVALID_STATE');
      expect(error.details).toEqual({ 
        currentState: 'COMPLETED', 
        expectedState: 'PENDING',
        resourceType: 'Order'
      });
      expect(error.getHttpStatusCode()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should create an InvalidStateError with multiple expected states', () => {
      const error = new InvalidStateError(
        'COMPLETED',
        ['PENDING', 'PROCESSING'],
        'Order'
      );
      
      expect(error.message).toBe("Invalid state: Order is in state 'COMPLETED' but expected 'PENDING, PROCESSING'");
      expect(error.details).toEqual({ 
        currentState: 'COMPLETED', 
        expectedState: ['PENDING', 'PROCESSING'],
        resourceType: 'Order'
      });
    });

    it('should include journey context when provided', () => {
      const context = { journey: JourneyContext.CARE };
      const error = new InvalidStateError(
        'COMPLETED',
        'SCHEDULED',
        'Appointment',
        context
      );
      
      expect(error.context).toEqual(context);
    });

    it('should include a helpful suggestion', () => {
      const error = new InvalidStateError('COMPLETED', 'PENDING', 'Order');
      
      expect(error.suggestion).toBe("The Order must be in state 'PENDING' to perform this operation");
    });

    it('should format suggestion correctly with multiple expected states', () => {
      const error = new InvalidStateError(
        'COMPLETED',
        ['PENDING', 'PROCESSING'],
        'Order'
      );
      
      expect(error.suggestion).toBe("The Order must be in state 'PENDING, PROCESSING' to perform this operation");
    });
  });
});