import { ExecutionContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CurrentUser } from '../../../src/decorators/current-user.decorator';
import { AppException, ErrorType } from '@austa/errors';

/**
 * Unit tests for the CurrentUser decorator
 * 
 * These tests verify that the CurrentUser decorator correctly extracts user data
 * from request objects and handles error scenarios appropriately. The decorator
 * is a critical component used across all journey services to access the current
 * authenticated user's information.
 */

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    // Create mock user data with journey-specific properties
    // This represents a typical user object that would be attached to the request
    // by JwtAuthGuard or another authentication mechanism
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      roles: ['user'],
      profile: {
        firstName: 'Test',
        lastName: 'User',
      },
      // Journey-specific properties
      healthProfile: {
        height: 175,
        weight: 70,
        bloodType: 'A+'
      },
      carePreferences: {
        preferredProvider: 'Dr. Smith',
        notificationEnabled: true
      },
      insurancePlan: {
        id: 'plan-456',
        type: 'Premium',
        expiryDate: '2025-12-31'
      }
    };

    // Create mock request with user data
    mockRequest = {
      user: mockUser,
    };

    // Create mock execution context
    // This simulates the NestJS ExecutionContext that would be passed to the decorator
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  });

  it('should extract the entire user object when no data is provided', () => {
    // Create the decorator factory
    // This simulates using @CurrentUser() in a controller method
    const factory = CurrentUser();

    // Execute the factory with the context
    // In a real application, NestJS would call this internally
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the mock user
    // The decorator should return the complete user object
    expect(result).toEqual(mockRequest.user);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should extract a specific property when data parameter is provided', () => {
    // Create the decorator factory with 'id' as the data parameter
    const factory = CurrentUser('id');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected property
    expect(result).toEqual('user-123');
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should extract a nested property when data parameter points to a nested field', () => {
    // Create the decorator factory with a nested property path
    const factory = CurrentUser('profile.firstName');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected nested property
    expect(result).toEqual('Test');
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should throw AppException when user is not found in request', () => {
    // Create a request without user data
    // This simulates a scenario where JwtAuthGuard was not applied or failed to set the user
    mockRequest.user = undefined;

    // Create the decorator factory
    const factory = CurrentUser();

    // Execute the factory and expect it to throw an exception
    expect(() => factory(null, mockExecutionContext)).toThrow(AppException);
    
    try {
      factory(null, mockExecutionContext);
    } catch (error) {
      // Verify the error is an AppException with the correct error type and code
      // This ensures the error handling is consistent with the @austa/errors framework
      expect(error).toBeInstanceOf(AppException);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.errorCode).toBe('AUTH_001');
      expect(error.message).toContain('User not found in request');
    }
  });

  it('should throw AppException when requested property is not found', () => {
    // Create the decorator factory with a non-existent property
    const factory = CurrentUser('nonExistentProperty');

    // Execute the factory and expect it to throw an exception
    expect(() => factory(null, mockExecutionContext)).toThrow(AppException);
    
    try {
      factory(null, mockExecutionContext);
    } catch (error) {
      // Verify the error is an AppException with the correct error type and code
      expect(error).toBeInstanceOf(AppException);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.errorCode).toBe('AUTH_002');
      expect(error.message).toContain('Property not found in user object');
    }
  });

  it('should throw AppException when nested property path is invalid', () => {
    // Create the decorator factory with an invalid nested property path
    const factory = CurrentUser('profile.nonExistentProperty');

    // Execute the factory and expect it to throw an exception
    expect(() => factory(null, mockExecutionContext)).toThrow(AppException);
    
    try {
      factory(null, mockExecutionContext);
    } catch (error) {
      // Verify the error is an AppException with the correct error type and code
      expect(error).toBeInstanceOf(AppException);
      expect(error.errorType).toBe(ErrorType.VALIDATION);
      expect(error.errorCode).toBe('AUTH_002');
      expect(error.message).toContain('Property not found in user object');
    }
  });

  it('should handle array of roles correctly', () => {
    // Create the decorator factory with 'roles' as the data parameter
    // This tests that arrays are properly extracted and maintain their type
    const factory = CurrentUser('roles');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected array
    expect(result).toEqual(['user']);
    expect(Array.isArray(result)).toBe(true);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  // Additional tests for journey-specific properties
  
  it('should extract health journey properties correctly', () => {
    // Create the decorator factory with health journey property
    const factory = CurrentUser('healthProfile');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected health profile
    expect(result).toEqual({
      height: 175,
      weight: 70,
      bloodType: 'A+'
    });
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should extract care journey properties correctly', () => {
    // Create the decorator factory with care journey property
    const factory = CurrentUser('carePreferences');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected care preferences
    expect(result).toEqual({
      preferredProvider: 'Dr. Smith',
      notificationEnabled: true
    });
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });

  it('should extract plan journey properties correctly', () => {
    // Create the decorator factory with plan journey property
    const factory = CurrentUser('insurancePlan');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected insurance plan
    expect(result).toEqual({
      id: 'plan-456',
      type: 'Premium',
      expiryDate: '2025-12-31'
    });
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });
  
  it('should handle deeply nested properties correctly', () => {
    // Add a deeply nested property to the mock user
    mockRequest.user.preferences = {
      notifications: {
        email: {
          enabled: true,
          frequency: 'daily'
        }
      }
    };
    
    // Create the decorator factory with a deeply nested property path
    const factory = CurrentUser('preferences.notifications.email.frequency');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result matches the expected deeply nested value
    expect(result).toEqual('daily');
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalledTimes(1);
  });
});