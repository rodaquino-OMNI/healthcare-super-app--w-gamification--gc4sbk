import { Test } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../../src/guards/jwt-auth.guard';
import { createMockExecutionContext } from '../../helpers/mock-auth-providers.helper';
import { ValidationError, InvalidCredentialsError } from '@austa/errors/categories';

// Mock the LoggerService
class MockLoggerService {
  logs: Record<string, any[]> = {
    debug: [],
    log: [],
    error: [],
    warn: [],
    verbose: []
  };

  createLogger() {
    return this;
  }

  debug(message: string, context?: any) {
    this.logs.debug.push({ message, context });
  }

  log(message: string, context?: any) {
    this.logs.log.push({ message, context });
  }

  error(message: string, context?: any) {
    this.logs.error.push({ message, context });
  }

  warn(message: string, context?: any) {
    this.logs.warn.push({ message, context });
  }

  verbose(message: string, context?: any) {
    this.logs.verbose.push({ message, context });
  }

  // Helper method to reset logs for clean test state
  reset() {
    this.logs = {
      debug: [],
      log: [],
      error: [],
      warn: [],
      verbose: []
    };
  }
}

// Mock the AuthGuard parent class
const mockSuperCanActivate = jest.fn();
jest.mock('@nestjs/passport', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: mockSuperCanActivate,
      };
    }),
  };
});

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockLogger: MockLoggerService;

  beforeEach(async () => {
    mockLogger = new MockLoggerService();
    mockSuperCanActivate.mockReset();

    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: 'LoggerService',
          useValue: mockLogger,
        },
      ],
    }).compile();

    guard = moduleRef.get<JwtAuthGuard>(JwtAuthGuard);
    mockLogger.reset();
  });

  describe('canActivate', () => {
    it('should return true when authentication is successful', async () => {
      // Arrange
      const mockContext = createMockExecutionContext({
        user: { id: 'user-123', username: 'testuser' }
      });
      mockSuperCanActivate.mockResolvedValue(true);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(true);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockContext);
      expect(mockLogger.logs.debug.length).toBe(1);
      expect(mockLogger.logs.debug[0].message).toBe('Authentication successful');
      expect(mockLogger.logs.debug[0].context).toHaveProperty('userId', 'user-123');
    });

    it('should return false when authentication fails but does not throw', async () => {
      // Arrange
      const mockContext = createMockExecutionContext();
      mockSuperCanActivate.mockResolvedValue(false);

      // Act
      const result = await guard.canActivate(mockContext);

      // Assert
      expect(result).toBe(false);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockContext);
      expect(mockLogger.logs.debug.length).toBe(0); // No success log
    });

    it('should transform UnauthorizedException to InvalidCredentialsError', async () => {
      // Arrange
      const mockContext = createMockExecutionContext();
      mockSuperCanActivate.mockRejectedValue(new UnauthorizedException('Invalid token'));

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow(InvalidCredentialsError);
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockContext);
      expect(mockLogger.logs.warn.length).toBe(1);
      expect(mockLogger.logs.warn[0].message).toBe('Authentication failed');
      expect(mockLogger.logs.warn[0].context).toHaveProperty('error', 'Invalid token');
    });

    it('should propagate other errors and log them', async () => {
      // Arrange
      const mockContext = createMockExecutionContext();
      const testError = new Error('Test error');
      mockSuperCanActivate.mockRejectedValue(testError);

      // Act & Assert
      await expect(guard.canActivate(mockContext)).rejects.toThrow('Test error');
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockContext);
      expect(mockLogger.logs.warn.length).toBe(1);
      expect(mockLogger.logs.warn[0].message).toBe('Authentication failed');
      expect(mockLogger.logs.error.length).toBe(1);
      expect(mockLogger.logs.error[0].message).toBe('Unexpected authentication error');
      expect(mockLogger.logs.error[0].context).toHaveProperty('error', 'Test error');
    });
  });

  describe('handleRequest', () => {
    it('should return the user when authentication is successful', () => {
      // Arrange
      const mockUser = { id: 'user-123', username: 'testuser' };

      // Act
      const result = guard.handleRequest(null, mockUser, null);

      // Assert
      expect(result).toBe(mockUser);
    });

    it('should throw InvalidCredentialsError when error is provided', () => {
      // Arrange
      const mockError = new Error('Authentication error');

      // Act & Assert
      expect(() => guard.handleRequest(mockError, null, null)).toThrow(InvalidCredentialsError);
      expect(mockLogger.logs.warn.length).toBe(1);
      expect(mockLogger.logs.warn[0].message).toBe('JWT validation failed in handleRequest');
      expect(mockLogger.logs.warn[0].context).toHaveProperty('errorMessage', 'Authentication error');
    });

    it('should throw InvalidCredentialsError when user is not provided', () => {
      // Act & Assert
      expect(() => guard.handleRequest(null, null, null)).toThrow(InvalidCredentialsError);
      expect(mockLogger.logs.warn.length).toBe(1);
      expect(mockLogger.logs.warn[0].message).toBe('JWT validation failed in handleRequest');
    });

    it('should include info message in error context when provided', () => {
      // Arrange
      const mockInfo = { message: 'Token expired' };

      // Act & Assert
      expect(() => guard.handleRequest(null, null, mockInfo)).toThrow(InvalidCredentialsError);
      expect(mockLogger.logs.warn.length).toBe(1);
      expect(mockLogger.logs.warn[0].context).toHaveProperty('info', 'Token expired');
    });
  });

  describe('integration with @austa/errors', () => {
    it('should create InvalidCredentialsError with proper context', () => {
      // Arrange
      const mockInfo = { message: 'Token expired' };
      let thrownError: InvalidCredentialsError | null = null;

      // Act
      try {
        guard.handleRequest(null, null, mockInfo);
      } catch (error) {
        thrownError = error as InvalidCredentialsError;
      }

      // Assert
      expect(thrownError).toBeInstanceOf(InvalidCredentialsError);
      expect(thrownError?.message).toBe('Invalid token or user not found');
      expect(thrownError?.context).toHaveProperty('info', 'Token expired');
    });
  });
});