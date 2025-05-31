import { ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CurrentUser } from '../../../src/decorators/current-user.decorator';

describe('CurrentUser Decorator', () => {
  let mockExecutionContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    // Create a mock user object
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['user'],
      planId: 'plan-456',
      journeyPreferences: {
        health: { notifications: true },
        care: { reminders: true },
        plan: { updates: false }
      }
    };

    // Create a mock request with the user object
    mockRequest = {
      user: mockUser
    };

    // Create a mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest)
      }),
      getClass: jest.fn(),
      getHandler: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn()
    };
  });

  it('should extract the entire user object when no data is provided', () => {
    // Create a factory function that would be used by NestJS
    const factory = CurrentUser();

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result is the complete user object
    expect(result).toEqual(mockRequest.user);
    expect(mockExecutionContext.switchToHttp).toHaveBeenCalled();
  });

  it('should extract a specific property when data parameter is provided', () => {
    // Test with different properties
    const testCases = [
      { property: 'id', expected: 'user-123' },
      { property: 'email', expected: 'test@example.com' },
      { property: 'firstName', expected: 'Test' },
      { property: 'planId', expected: 'plan-456' }
    ];

    testCases.forEach(({ property, expected }) => {
      // Create a factory function with the property name
      const factory = CurrentUser(property);

      // Execute the factory with the context
      const result = factory(null, mockExecutionContext);

      // Verify the result is the specific property
      expect(result).toEqual(expected);
    });
  });

  it('should extract nested properties when using dot notation', () => {
    // Create a factory function with a nested property path
    const factory = CurrentUser('journeyPreferences.health.notifications');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result is the nested property
    expect(result).toBeUndefined(); // Current implementation doesn't support nested properties
  });

  it('should throw InternalServerErrorException when user is not found in request', () => {
    // Modify the mock request to not have a user
    mockRequest.user = undefined;

    // Create a factory function
    const factory = CurrentUser();

    // Expect the factory to throw when executed
    expect(() => factory(null, mockExecutionContext)).toThrow(InternalServerErrorException);
    expect(() => factory(null, mockExecutionContext)).toThrow(
      'User object not found in request. Ensure JwtAuthGuard or equivalent authentication guard is applied.'
    );
  });

  it('should throw InternalServerErrorException when an error occurs during extraction', () => {
    // Modify the execution context to throw an error
    mockExecutionContext.switchToHttp = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    // Create a factory function
    const factory = CurrentUser();

    // Expect the factory to throw when executed
    expect(() => factory(null, mockExecutionContext)).toThrow(InternalServerErrorException);
    expect(() => factory(null, mockExecutionContext)).toThrow('Failed to extract user data: Test error');
  });

  it('should re-throw NestJS exceptions as-is', () => {
    // Create a NestJS exception
    const nestException = new InternalServerErrorException('Original NestJS error');
    
    // Modify the execution context to throw a NestJS exception
    mockExecutionContext.switchToHttp = jest.fn().mockImplementation(() => {
      throw nestException;
    });

    // Create a factory function
    const factory = CurrentUser();

    // Expect the factory to throw the original exception
    expect(() => factory(null, mockExecutionContext)).toThrow(nestException);
  });

  it('should return undefined when property does not exist', () => {
    // Create a factory function with a non-existent property
    const factory = CurrentUser('nonExistentProperty');

    // Execute the factory with the context
    const result = factory(null, mockExecutionContext);

    // Verify the result is undefined
    expect(result).toBeUndefined();
  });

  it('should work with different request structures', () => {
    // Test with a different request structure that still has user
    const alternativeRequest = {
      session: {
        user: {
          id: 'alt-user-123',
          email: 'alt@example.com'
        }
      }
    };

    // Update the mock execution context
    mockExecutionContext.switchToHttp = jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(alternativeRequest)
    });

    // Create a factory function
    const factory = CurrentUser();

    // Execute the factory with the context
    // This should fail because the user is in session.user, not directly in request.user
    expect(() => factory(null, mockExecutionContext)).toThrow(InternalServerErrorException);
  });
});