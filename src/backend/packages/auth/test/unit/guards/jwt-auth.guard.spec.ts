import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/guards/jwt-auth.guard';
import { LoggerService } from '@austa/logging';
import { BaseError, ValidationError } from '@austa/errors';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let loggerService: LoggerService;

  // Mock request object
  const mockRequest = {
    path: '/api/test',
    method: 'GET',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
      'x-request-id': 'test-request-id'
    }
  };

  // Mock execution context
  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest)
    })
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    // Create a testing module with mocked LoggerService
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: LoggerService,
          useValue: {
            setContext: jest.fn(),
            debug: jest.fn(),
            log: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          }
        }
      ],
    }).compile();

    // Get instances of guard and logger service
    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
    loggerService = moduleRef.get<LoggerService>(LoggerService);

    // Spy on the AuthGuard's canActivate method
    jest.spyOn(JwtAuthGuard.prototype, 'canActivate').mockClear();
  });

  describe('constructor', () => {
    it('should set the logger context to JwtAuthGuard', () => {
      // Verify that the logger context was set correctly
      expect(loggerService.setContext).toHaveBeenCalledWith('JwtAuthGuard');
    });
  });

  describe('canActivate', () => {
    it('should return true when authentication succeeds', async () => {
      // Mock the parent canActivate method to return true
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.resolve(true);
      });

      // Call the method and check the result
      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should log a warning and rethrow when BaseError occurs', async () => {
      // Create a BaseError instance
      const baseError = new BaseError({
        message: 'Test base error',
        code: 'TEST_ERROR'
      });

      // Mock the parent canActivate method to throw the error
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.reject(baseError);
      });

      // Call the method and expect it to throw the same error
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(baseError);

      // Verify that the warning was logged
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed for request to /api/test',
        expect.objectContaining({
          path: '/api/test',
          method: 'GET',
          ip: '127.0.0.1',
          headers: expect.objectContaining({
            'user-agent': 'test-agent',
            'x-request-id': 'test-request-id'
          })
        })
      );
    });

    it('should transform generic errors to ValidationError', async () => {
      // Create a generic error
      const genericError = new Error('Generic error');

      // Mock the parent canActivate method to throw the error
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.reject(genericError);
      });

      // Call the method and expect it to throw a ValidationError
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ValidationError);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toMatchObject({
        message: 'Authentication failed',
        code: 'AUTH_INVALID_TOKEN',
        details: { originalError: 'Generic error' }
      });

      // Verify that the warning was logged
      expect(loggerService.warn).toHaveBeenCalled();
    });
  });

  describe('handleRequest', () => {
    it('should return the user when authentication succeeds', () => {
      // Mock user object
      const mockUser = { id: '123', username: 'testuser' };

      // Call the method and check the result
      const result = guard.handleRequest(null, mockUser, null);
      expect(result).toBe(mockUser);
    });

    it('should throw ValidationError when error occurs', () => {
      // Create an error
      const error = new Error('Authentication error');

      // Call the method and expect it to throw a ValidationError
      expect(() => guard.handleRequest(error, null, null)).toThrow(ValidationError);
      expect(() => guard.handleRequest(error, null, null)).toThrow('Authentication error');

      // Verify that the error was logged
      expect(loggerService.error).toHaveBeenCalledWith(
        'Authentication error: Authentication error',
        expect.objectContaining({
          error: 'Authentication error',
          code: 'AUTH_UNAUTHORIZED'
        })
      );
    });

    it('should throw ValidationError when user is null', () => {
      // Call the method with null user and expect it to throw a ValidationError
      expect(() => guard.handleRequest(null, null, null)).toThrow(ValidationError);
      expect(() => guard.handleRequest(null, null, null)).toThrow('Invalid token or user not found');

      // Verify that the error was logged
      expect(loggerService.error).toHaveBeenCalledWith(
        'Authentication error: Invalid token or user not found',
        expect.objectContaining({
          code: 'AUTH_UNAUTHORIZED'
        })
      );
    });

    it('should include info message in error details when available', () => {
      // Create info object with message
      const info = { message: 'Token expired' };

      // Call the method and expect it to throw a ValidationError with the info message
      try {
        guard.handleRequest(null, null, info);
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.details).toEqual({ info: 'Token expired' });
      }

      // Verify that the error was logged with the info message
      expect(loggerService.error).toHaveBeenCalledWith(
        'Authentication error: Invalid token or user not found',
        expect.objectContaining({
          info: 'Token expired',
          code: 'AUTH_UNAUTHORIZED'
        })
      );
    });
  });

  // Test integration with journey-specific routes
  describe('journey integration', () => {
    // Mock request objects for different journeys
    const healthJourneyRequest = {
      ...mockRequest,
      path: '/api/health/metrics'
    };
    
    const careJourneyRequest = {
      ...mockRequest,
      path: '/api/care/appointments'
    };
    
    const planJourneyRequest = {
      ...mockRequest,
      path: '/api/plan/benefits'
    };

    it('should handle authentication for health journey routes', async () => {
      // Create mock execution context for health journey
      const healthContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(healthJourneyRequest)
        })
      } as unknown as ExecutionContext;

      // Mock error for testing
      const error = new Error('Authentication failed');

      // Mock the parent canActivate method to throw the error
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.reject(error);
      });

      // Call the method and expect it to throw a ValidationError
      await expect(guard.canActivate(healthContext)).rejects.toThrow(ValidationError);

      // Verify that the warning was logged with the health journey path
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed for request to /api/health/metrics',
        expect.objectContaining({
          path: '/api/health/metrics'
        })
      );
    });

    it('should handle authentication for care journey routes', async () => {
      // Create mock execution context for care journey
      const careContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(careJourneyRequest)
        })
      } as unknown as ExecutionContext;

      // Mock error for testing
      const error = new Error('Authentication failed');

      // Mock the parent canActivate method to throw the error
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.reject(error);
      });

      // Call the method and expect it to throw a ValidationError
      await expect(guard.canActivate(careContext)).rejects.toThrow(ValidationError);

      // Verify that the warning was logged with the care journey path
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed for request to /api/care/appointments',
        expect.objectContaining({
          path: '/api/care/appointments'
        })
      );
    });

    it('should handle authentication for plan journey routes', async () => {
      // Create mock execution context for plan journey
      const planContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(planJourneyRequest)
        })
      } as unknown as ExecutionContext;

      // Mock error for testing
      const error = new Error('Authentication failed');

      // Mock the parent canActivate method to throw the error
      jest.spyOn(guard as any, 'canActivate').mockImplementationOnce(async () => {
        return await Promise.reject(error);
      });

      // Call the method and expect it to throw a ValidationError
      await expect(guard.canActivate(planContext)).rejects.toThrow(ValidationError);

      // Verify that the warning was logged with the plan journey path
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed for request to /api/plan/benefits',
        expect.objectContaining({
          path: '/api/plan/benefits'
        })
      );
    });
  });
});