import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Logger } from '@austa/logging';
import { LocalAuthGuard } from '../../../src/guards/local-auth.guard';
import { ERROR_CODES } from '../../../src/constants';

// Mock the AuthGuard class
jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn(),
    handleRequest: jest.fn(),
  })),
}));

// Mock the Logger class
jest.mock('@austa/logging', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let mockContext: ExecutionContext;
  let mockRequest: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create a new instance of the guard for each test
    guard = new LocalAuthGuard();
    
    // Create a mock execution context
    mockRequest = {
      id: 'test-request-id',
      body: {
        username: 'test@example.com',
        password: 'password123',
      },
    };
    
    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard with "local" strategy', () => {
    // Verify that AuthGuard was called with 'local'
    expect(AuthGuard).toHaveBeenCalledWith('local');
  });

  describe('canActivate', () => {
    it('should return true when authentication is successful', async () => {
      // Mock the parent canActivate method to return true
      const mockSuperCanActivate = jest.fn().mockResolvedValue(true);
      Object.defineProperty(guard, 'canActivate', {
        value: LocalAuthGuard.prototype.canActivate,
      });
      Object.defineProperty(AuthGuard('local').prototype, 'canActivate', {
        value: mockSuperCanActivate,
      });

      const result = await guard.canActivate(mockContext);

      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when authentication fails', async () => {
      // Mock the parent canActivate method to throw an error
      const mockError = new Error('Authentication failed');
      const mockSuperCanActivate = jest.fn().mockRejectedValue(mockError);
      Object.defineProperty(guard, 'canActivate', {
        value: LocalAuthGuard.prototype.canActivate,
      });
      Object.defineProperty(AuthGuard('local').prototype, 'canActivate', {
        value: mockSuperCanActivate,
      });

      // Expect the guard's canActivate method to throw an UnauthorizedException
      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
      
      // Verify that the error was logged
      expect(guard['logger'].error).toHaveBeenCalledWith(
        'Authentication failed: Authentication failed',
        expect.objectContaining({
          error: mockError,
          context: mockRequest,
        })
      );
    });

    it('should include the correct error code in the exception', async () => {
      // Mock the parent canActivate method to throw an error
      const mockError = new Error('Authentication failed');
      const mockSuperCanActivate = jest.fn().mockRejectedValue(mockError);
      Object.defineProperty(guard, 'canActivate', {
        value: LocalAuthGuard.prototype.canActivate,
      });
      Object.defineProperty(AuthGuard('local').prototype, 'canActivate', {
        value: mockSuperCanActivate,
      });

      try {
        await guard.canActivate(mockContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.response).toEqual({
          message: 'Invalid username or password',
          errorCode: ERROR_CODES.INVALID_CREDENTIALS,
        });
      }
    });
  });

  describe('handleRequest', () => {
    it('should return the user when authentication is successful', () => {
      const mockUser = { id: '1', username: 'test@example.com' };
      const mockInfo = {};

      const result = guard.handleRequest(null, mockUser, mockInfo, mockContext);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      const mockInfo = { message: 'User not found' };

      expect(() => {
        guard.handleRequest(null, null, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);

      // Verify that the warning was logged
      expect(guard['logger'].warn).toHaveBeenCalledWith(
        'Authentication failed in handleRequest',
        expect.objectContaining({
          error: null,
          info: mockInfo,
          requestId: 'test-request-id',
        })
      );
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const mockError = new Error('Authentication error');
      const mockUser = { id: '1', username: 'test@example.com' };
      const mockInfo = {};

      expect(() => {
        guard.handleRequest(mockError, mockUser, mockInfo, mockContext);
      }).toThrow(UnauthorizedException);

      // Verify that the warning was logged
      expect(guard['logger'].warn).toHaveBeenCalledWith(
        'Authentication failed in handleRequest',
        expect.objectContaining({
          error: mockError,
          info: mockInfo,
          requestId: 'test-request-id',
        })
      );
    });

    it('should include the correct error code in the exception', () => {
      const mockInfo = { message: 'Custom error message' };

      try {
        guard.handleRequest(null, null, mockInfo, mockContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.response).toEqual({
          message: 'Custom error message',
          errorCode: ERROR_CODES.AUTHENTICATION_FAILED,
        });
      }
    });

    it('should use default error message when info.message is not provided', () => {
      const mockInfo = {};

      try {
        guard.handleRequest(null, null, mockInfo, mockContext);
        fail('Expected UnauthorizedException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.response).toEqual({
          message: 'Authentication failed',
          errorCode: ERROR_CODES.AUTHENTICATION_FAILED,
        });
      }
    });
  });
});