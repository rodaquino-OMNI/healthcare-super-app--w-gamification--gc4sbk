import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from '@backend/shared/src/exceptions/exceptions.types';
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
  describe('BusinessError', () => {
    it('should extend AppException with ErrorType.BUSINESS', () => {
      // Arrange & Act
      const error = new class TestBusinessError extends BusinessError {
        constructor() {
          super('Test business error', 'TEST_B001');
        }
      }();

      // Assert
      expect(error).toBeInstanceOf(AppException);
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.type).toBe(ErrorType.BUSINESS);
      expect(error.message).toBe('Test business error');
      expect(error.code).toBe('TEST_B001');
    });

    it('should serialize to JSON with correct structure', () => {
      // Arrange
      const error = new class TestBusinessError extends BusinessError {
        constructor() {
          super('Test business error', 'TEST_B001', { additionalInfo: 'test' });
        }
      }();

      // Act
      const serialized = error.toJSON();

      // Assert
      expect(serialized).toEqual({
        error: {
          type: ErrorType.BUSINESS,
          code: 'TEST_B001',
          message: 'Test business error',
          details: { additionalInfo: 'test' }
        }
      });
    });

    it('should convert to HttpException with correct status code', () => {
      // Arrange
      const error = new class TestBusinessError extends BusinessError {
        constructor() {
          super('Test business error', 'TEST_B001');
        }
      }();

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });
  });

  describe('ResourceNotFoundError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new ResourceNotFoundError('User', '123');

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('User with ID 123 not found');
      expect(error.code).toBe('B001_RESOURCE_NOT_FOUND');
      expect(error.resourceType).toBe('User');
      expect(error.resourceId).toBe('123');
    });
    
    it('should convert to HttpException with UNPROCESSABLE_ENTITY status code', () => {
      // Arrange
      const error = new ResourceNotFoundError('User', '123');

      // Act
      const httpException = error.toHttpException();

      // Assert
      expect(httpException.getStatus()).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should include journey context in message and code when provided', () => {
      // Arrange & Act
      const error = new ResourceNotFoundError('Appointment', '456', 'care');

      // Assert
      expect(error.message).toBe('Appointment with ID 456 not found in care journey');
      expect(error.code).toBe('CARE_B001_RESOURCE_NOT_FOUND');
      expect(error.journeyContext).toBe('care');
    });

    it('should include additional details when provided', () => {
      // Arrange & Act
      const details = { query: { userId: '789' } };
      const error = new ResourceNotFoundError('HealthMetric', '456', 'health', details);

      // Assert
      expect(error.details).toEqual(details);
      
      // Verify serialization includes details
      const serialized = error.toJSON();
      expect(serialized.error.details).toEqual(details);
    });
  });

  describe('ResourceExistsError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new ResourceExistsError('User', 'email', 'user@example.com');

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe("User with email 'user@example.com' already exists");
      expect(error.code).toBe('B002_RESOURCE_EXISTS');
      expect(error.resourceType).toBe('User');
      expect(error.identifierField).toBe('email');
      expect(error.identifierValue).toBe('user@example.com');
    });

    it('should include journey context in message and code when provided', () => {
      // Arrange & Act
      const error = new ResourceExistsError('Plan', 'code', 'PREMIUM2023', 'plan');

      // Assert
      expect(error.message).toBe("Plan with code 'PREMIUM2023' already exists in plan journey");
      expect(error.code).toBe('PLAN_B002_RESOURCE_EXISTS');
      expect(error.journeyContext).toBe('plan');
    });

    it('should handle numeric identifier values', () => {
      // Arrange & Act
      const error = new ResourceExistsError('Product', 'id', 12345);

      // Assert
      expect(error.message).toBe("Product with id '12345' already exists");
      expect(error.identifierValue).toBe(12345);
    });
  });

  describe('BusinessRuleViolationError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new BusinessRuleViolationError(
        'MaxAppointmentsPerDay',
        'User cannot book more than 3 appointments per day'
      );

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('User cannot book more than 3 appointments per day');
      expect(error.code).toBe('B003_RULE_VIOLATION');
      expect(error.ruleName).toBe('MaxAppointmentsPerDay');
    });

    it('should include journey context in code when provided', () => {
      // Arrange & Act
      const error = new BusinessRuleViolationError(
        'MinimumAgeRequirement',
        'User must be at least 18 years old to access this feature',
        'health'
      );

      // Assert
      expect(error.code).toBe('HEALTH_B003_RULE_VIOLATION');
      expect(error.journeyContext).toBe('health');
    });

    it('should include rule name in details', () => {
      // Arrange & Act
      const error = new BusinessRuleViolationError(
        'MaxClaimsPerMonth',
        'Cannot submit more than 5 claims per month',
        'plan',
        { currentCount: 5, maxAllowed: 5 }
      );

      // Assert
      expect(error.details).toEqual({
        ruleName: 'MaxClaimsPerMonth',
        currentCount: 5,
        maxAllowed: 5
      });
      
      // Verify serialization includes details
      const serialized = error.toJSON();
      expect(serialized.error.details.ruleName).toBe('MaxClaimsPerMonth');
      expect(serialized.error.details.currentCount).toBe(5);
    });
  });

  describe('ConflictError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new ConflictError(
        'Appointment',
        'time_overlap',
        'Appointment time conflicts with an existing appointment'
      );

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Appointment time conflicts with an existing appointment');
      expect(error.code).toBe('B004_CONFLICT');
      expect(error.resourceType).toBe('Appointment');
      expect(error.conflictReason).toBe('time_overlap');
    });

    it('should include journey context in code when provided', () => {
      // Arrange & Act
      const error = new ConflictError(
        'MedicalRecord',
        'concurrent_modification',
        'Medical record was modified by another user',
        'care'
      );

      // Assert
      expect(error.code).toBe('CARE_B004_CONFLICT');
      expect(error.journeyContext).toBe('care');
    });

    it('should include resource type and conflict reason in details', () => {
      // Arrange & Act
      const error = new ConflictError(
        'Claim',
        'duplicate_submission',
        'This claim has already been submitted',
        'plan',
        { claimId: '12345', submissionDate: '2023-05-15' }
      );

      // Assert
      expect(error.details).toEqual({
        resourceType: 'Claim',
        conflictReason: 'duplicate_submission',
        claimId: '12345',
        submissionDate: '2023-05-15'
      });
      
      // Verify serialization includes details
      const serialized = error.toJSON();
      expect(serialized.error.details.resourceType).toBe('Claim');
      expect(serialized.error.details.conflictReason).toBe('duplicate_submission');
    });
  });

  describe('InsufficientPermissionsError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new InsufficientPermissionsError('MedicalRecord', 'view');

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe('Insufficient permissions to view MedicalRecord');
      expect(error.code).toBe('B005_INSUFFICIENT_PERMISSIONS');
      expect(error.resourceType).toBe('MedicalRecord');
      expect(error.operation).toBe('view');
    });

    it('should include required permission in message when provided', () => {
      // Arrange & Act
      const error = new InsufficientPermissionsError(
        'Claim',
        'approve',
        'CLAIMS_ADMIN'
      );

      // Assert
      expect(error.message).toBe("Insufficient permissions to approve Claim (requires 'CLAIMS_ADMIN')");
      expect(error.requiredPermission).toBe('CLAIMS_ADMIN');
    });

    it('should include journey context in message and code when provided', () => {
      // Arrange & Act
      const error = new InsufficientPermissionsError(
        'HealthGoal',
        'modify',
        'HEALTH_COACH',
        'health'
      );

      // Assert
      expect(error.message).toBe("Insufficient permissions to modify HealthGoal (requires 'HEALTH_COACH') in health journey");
      expect(error.code).toBe('HEALTH_B005_INSUFFICIENT_PERMISSIONS');
      expect(error.journeyContext).toBe('health');
    });
  });

  describe('InvalidStateError', () => {
    it('should create error with correct message and code', () => {
      // Arrange & Act
      const error = new InvalidStateError(
        'Appointment',
        'COMPLETED',
        'reschedule'
      );

      // Assert
      expect(error).toBeInstanceOf(BusinessError);
      expect(error.message).toBe("Cannot reschedule Appointment in 'COMPLETED' state");
      expect(error.code).toBe('B006_INVALID_STATE');
      expect(error.resourceType).toBe('Appointment');
      expect(error.currentState).toBe('COMPLETED');
      expect(error.attemptedOperation).toBe('reschedule');
    });

    it('should include allowed states in message when provided', () => {
      // Arrange & Act
      const error = new InvalidStateError(
        'Claim',
        'REJECTED',
        'approve',
        ['PENDING', 'UNDER_REVIEW']
      );

      // Assert
      expect(error.message).toBe("Cannot approve Claim in 'REJECTED' state (allowed states: 'PENDING', 'UNDER_REVIEW')");
      expect(error.allowedStates).toEqual(['PENDING', 'UNDER_REVIEW']);
    });

    it('should include journey context in message and code when provided', () => {
      // Arrange & Act
      const error = new InvalidStateError(
        'HealthGoal',
        'ACHIEVED',
        'update',
        ['ACTIVE', 'PAUSED'],
        'health'
      );

      // Assert
      expect(error.message).toBe("Cannot update HealthGoal in 'ACHIEVED' state (allowed states: 'ACTIVE', 'PAUSED') in health journey");
      expect(error.code).toBe('HEALTH_B006_INVALID_STATE');
      expect(error.journeyContext).toBe('health');
    });

    it('should include current state and allowed states in details', () => {
      // Arrange & Act
      const error = new InvalidStateError(
        'Telemedicine',
        'ENDED',
        'join',
        ['SCHEDULED', 'IN_PROGRESS'],
        'care',
        { sessionId: '12345' }
      );

      // Assert
      expect(error.details).toEqual({
        currentState: 'ENDED',
        allowedStates: ['SCHEDULED', 'IN_PROGRESS'],
        sessionId: '12345'
      });
      
      // Verify serialization includes details
      const serialized = error.toJSON();
      expect(serialized.error.details.currentState).toBe('ENDED');
      expect(serialized.error.details.allowedStates).toEqual(['SCHEDULED', 'IN_PROGRESS']);
    });
  });
});