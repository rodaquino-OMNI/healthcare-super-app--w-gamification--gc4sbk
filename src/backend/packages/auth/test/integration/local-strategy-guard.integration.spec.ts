import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { jest } from '@jest/globals';

// Import from the new package structure using path aliases
import { LocalAuthGuard } from '@austa/auth/guards/local-auth.guard';
import { LocalStrategy } from '@austa/auth/strategies/local.strategy';
import { IAuthService } from '@austa/auth/interfaces/services.interface';
import { IUser } from '@austa/interfaces/user';
import { IUserCredentials } from '@austa/interfaces/auth';

// Import error types from the centralized error framework
import { 
  InvalidCredentialsError, 
  MissingParameterError,
  ServiceUnavailableError 
} from '@austa/errors';

// Import constants
import { ERROR_CODES } from '@austa/auth/constants';

// Import test helpers
import { createTestUser } from './test-helpers';

/**
 * Integration test for LocalAuthGuard and LocalStrategy
 * 
 * This test verifies that the LocalAuthGuard correctly invokes the LocalStrategy
 * for username/password authentication and properly handles authentication errors.
 */
describe('LocalAuthGuard and LocalStrategy Integration', () => {
  let guard: LocalAuthGuard;
  let strategy: LocalStrategy;
  let mockAuthService: Partial<IAuthService>;
  let mockConfigService: Partial<ConfigService>;
  let module: TestingModule;
  
  // Valid test credentials
  const validCredentials: IUserCredentials = {
    email: 'test@example.com',
    password: 'Password123!',
  };
  
  // Test user that will be returned by the auth service
  const testUser: IUser = createTestUser();
  
  // Mock execution context for testing the guard
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
      getResponse: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
  
  beforeEach(async () => {
    // Create mock auth service with validateCredentials method
    mockAuthService = {
      validateCredentials: jest.fn(),
    };
    
    // Create mock config service
    mockConfigService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'test';
        return defaultValue;
      }),
    };
    
    // Create test module with LocalStrategy and LocalAuthGuard
    module = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        LocalAuthGuard,
        {
          provide: IAuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    
    // Get instances of the guard and strategy
    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
    strategy = module.get<LocalStrategy>(LocalStrategy);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(strategy).toBeDefined();
  });
  
  describe('LocalStrategy', () => {
    it('should validate credentials and return a user', async () => {
      // Setup auth service to return a user for valid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(testUser);
      
      // Call the validate method with valid credentials
      const result = await strategy.validate(validCredentials.email, validCredentials.password);
      
      // Verify the auth service was called with the correct parameters
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      
      // Verify the result is the test user
      expect(result).toEqual(testUser);
    });
    
    it('should throw InvalidCredentialsError for invalid credentials', async () => {
      // Setup auth service to return null for invalid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(null);
      
      // Expect the validate method to throw an InvalidCredentialsError
      await expect(strategy.validate(validCredentials.email, validCredentials.password))
        .rejects.toThrow(InvalidCredentialsError);
      
      // Verify the auth service was called
      expect(mockAuthService.validateCredentials).toHaveBeenCalled();
    });
    
    it('should throw MissingParameterError when email is missing', async () => {
      // Expect the validate method to throw a MissingParameterError
      await expect(strategy.validate('', validCredentials.password))
        .rejects.toThrow(MissingParameterError);
      
      // Verify the auth service was not called
      expect(mockAuthService.validateCredentials).not.toHaveBeenCalled();
    });
    
    it('should throw MissingParameterError when password is missing', async () => {
      // Expect the validate method to throw a MissingParameterError
      await expect(strategy.validate(validCredentials.email, ''))
        .rejects.toThrow(MissingParameterError);
      
      // Verify the auth service was not called
      expect(mockAuthService.validateCredentials).not.toHaveBeenCalled();
    });
    
    it('should throw ServiceUnavailableError when auth service throws a service error', async () => {
      // Setup auth service to throw a service error
      mockAuthService.validateCredentials = jest.fn().mockRejectedValue(
        new Error('Database connection failed')
      );
      
      // Mock the error to have a name that indicates a service issue
      const mockError = new Error('Database connection failed');
      mockError.name = 'ServiceUnavailableError';
      mockAuthService.validateCredentials = jest.fn().mockRejectedValue(mockError);
      
      // Expect the validate method to throw a ServiceUnavailableError
      await expect(strategy.validate(validCredentials.email, validCredentials.password))
        .rejects.toThrow(ServiceUnavailableError);
      
      // Verify the auth service was called
      expect(mockAuthService.validateCredentials).toHaveBeenCalled();
    });
    
    it('should convert unknown errors to InvalidCredentialsError in production', async () => {
      // Setup auth service to throw an unknown error
      mockAuthService.validateCredentials = jest.fn().mockRejectedValue(
        new Error('Unknown error')
      );
      
      // Mock NODE_ENV as 'production'
      mockConfigService.get = jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return null;
      });
      
      // Expect the validate method to throw an InvalidCredentialsError
      await expect(strategy.validate(validCredentials.email, validCredentials.password))
        .rejects.toThrow(InvalidCredentialsError);
      
      // Verify the auth service was called
      expect(mockAuthService.validateCredentials).toHaveBeenCalled();
    });
  });
  
  describe('LocalAuthGuard', () => {
    it('should activate when strategy validates credentials successfully', async () => {
      // Setup auth service to return a user for valid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(testUser);
      
      // Create a mock request with valid credentials
      const mockRequest = {
        body: validCredentials,
      };
      
      // Setup execution context to return the mock request
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      
      // Mock the super.canActivate method to simulate successful authentication
      const canActivateSpy = jest.spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockResolvedValue(true);
      
      // Call the canActivate method
      const result = await guard.canActivate(mockExecutionContext);
      
      // Verify the result is true
      expect(result).toBe(true);
      
      // Verify the super.canActivate method was called
      expect(canActivateSpy).toHaveBeenCalled();
      
      // Restore the spy
      canActivateSpy.mockRestore();
    });
    
    it('should throw UnauthorizedException when authentication fails', async () => {
      // Setup auth service to return null for invalid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(null);
      
      // Create a mock request with invalid credentials
      const mockRequest = {
        body: {
          email: validCredentials.email,
          password: 'wrong-password',
        },
      };
      
      // Setup execution context to return the mock request
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      
      // Mock the super.canActivate method to simulate failed authentication
      const canActivateSpy = jest.spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new InvalidCredentialsError('Invalid credentials'));
      
      // Expect the canActivate method to throw an UnauthorizedException
      await expect(guard.canActivate(mockExecutionContext))
        .rejects.toThrow(UnauthorizedException);
      
      // Verify the super.canActivate method was called
      expect(canActivateSpy).toHaveBeenCalled();
      
      // Restore the spy
      canActivateSpy.mockRestore();
    });
    
    it('should include the correct error code in the UnauthorizedException', async () => {
      // Setup auth service to return null for invalid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(null);
      
      // Create a mock request with invalid credentials
      const mockRequest = {
        body: {
          email: validCredentials.email,
          password: 'wrong-password',
        },
      };
      
      // Setup execution context to return the mock request
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      
      // Mock the super.canActivate method to simulate failed authentication
      const canActivateSpy = jest.spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new InvalidCredentialsError('Invalid credentials'));
      
      try {
        // Call the canActivate method
        await guard.canActivate(mockExecutionContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        // Verify the error is an UnauthorizedException
        expect(error).toBeInstanceOf(UnauthorizedException);
        
        // Verify the error response contains the correct error code
        expect(error.getResponse()).toEqual({
          message: 'Invalid username or password',
          errorCode: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }
      
      // Restore the spy
      canActivateSpy.mockRestore();
    });
    
    it('should handle rate limiting for failed login attempts', async () => {
      // This test simulates multiple failed login attempts to test rate limiting
      // Setup auth service to return null for invalid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(null);
      
      // Create a mock request with invalid credentials
      const mockRequest = {
        body: {
          email: validCredentials.email,
          password: 'wrong-password',
        },
        ip: '127.0.0.1', // Add IP for rate limiting
      };
      
      // Setup execution context to return the mock request
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      
      // Mock the super.canActivate method to simulate failed authentication
      const canActivateSpy = jest.spyOn(AuthGuard('local').prototype, 'canActivate');
      
      // First attempt - regular invalid credentials error
      canActivateSpy.mockRejectedValueOnce(new InvalidCredentialsError('Invalid credentials'));
      
      await expect(guard.canActivate(mockExecutionContext))
        .rejects.toThrow(UnauthorizedException);
      
      // Second attempt - simulate rate limiting by throwing a different error
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitExceededError';
      canActivateSpy.mockRejectedValueOnce(rateLimitError);
      
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        // Verify the error is an UnauthorizedException
        expect(error).toBeInstanceOf(UnauthorizedException);
        
        // The exact error response depends on how rate limiting is implemented
        // This is a simplified check
        expect(error.getResponse()).toHaveProperty('message');
        expect(error.getResponse().message).toContain('Invalid username or password');
      }
      
      // Restore the spy
      canActivateSpy.mockRestore();
    });
    
    it('should properly handle the authentication pipeline flow', async () => {
      // This test verifies the complete flow from guard to strategy to auth service
      // Setup auth service to return a user for valid credentials
      mockAuthService.validateCredentials = jest.fn().mockResolvedValue(testUser);
      
      // Create a mock request with valid credentials
      const mockRequest = {
        body: validCredentials,
      };
      
      // Setup execution context to return the mock request
      mockExecutionContext.switchToHttp().getRequest.mockReturnValue(mockRequest);
      
      // Create a spy on the strategy's validate method
      const validateSpy = jest.spyOn(strategy, 'validate');
      
      // Mock the super.canActivate method to call the strategy's validate method
      const canActivateSpy = jest.spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockImplementation(async () => {
          // Simulate the passport authentication flow
          const request = mockExecutionContext.switchToHttp().getRequest();
          const { email, password } = request.body;
          
          // Call the strategy's validate method
          const user = await strategy.validate(email, password);
          
          // Add the user to the request
          request.user = user;
          
          return true;
        });
      
      // Call the canActivate method
      const result = await guard.canActivate(mockExecutionContext);
      
      // Verify the result is true
      expect(result).toBe(true);
      
      // Verify the strategy's validate method was called with the correct parameters
      expect(validateSpy).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      
      // Verify the auth service was called with the correct parameters
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith(
        validCredentials.email,
        validCredentials.password
      );
      
      // Verify the user was added to the request
      expect(mockRequest.user).toEqual(testUser);
      
      // Restore the spies
      validateSpy.mockRestore();
      canActivateSpy.mockRestore();
    });
    
    it('should test handleRequest method with valid user', () => {
      // Test the handleRequest method with a valid user
      const user = testUser;
      const info = { message: 'Authentication successful' };
      
      // Call the handleRequest method
      const result = guard.handleRequest(null, user, info, mockExecutionContext);
      
      // Verify the result is the user
      expect(result).toEqual(user);
    });
    
    it('should test handleRequest method with error', () => {
      // Test the handleRequest method with an error
      const error = new Error('Authentication failed');
      const user = null;
      const info = { message: 'Authentication failed' };
      
      // Expect the handleRequest method to throw an UnauthorizedException
      expect(() => guard.handleRequest(error, user, info, mockExecutionContext))
        .toThrow(UnauthorizedException);
    });
    
    it('should test handleRequest method with no user', () => {
      // Test the handleRequest method with no user
      const error = null;
      const user = null;
      const info = { message: 'User not found' };
      
      // Expect the handleRequest method to throw an UnauthorizedException
      expect(() => guard.handleRequest(error, user, info, mockExecutionContext))
        .toThrow(UnauthorizedException);
    });
    
    it('should include the correct error code in handleRequest exceptions', () => {
      // Test the handleRequest method with an error
      const error = new Error('Authentication failed');
      const user = null;
      const info = { message: 'Authentication failed' };
      
      try {
        // Call the handleRequest method
        guard.handleRequest(error, user, info, mockExecutionContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (e) {
        // Verify the error is an UnauthorizedException
        expect(e).toBeInstanceOf(UnauthorizedException);
        
        // Verify the error response contains the correct error code
        expect(e.getResponse()).toEqual({
          message: 'Authentication failed',
          errorCode: ERROR_CODES.AUTHENTICATION_FAILED,
        });
      }
    });
  });
});