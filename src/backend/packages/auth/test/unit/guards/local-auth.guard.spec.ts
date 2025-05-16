import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from '../../../src/guards/local-auth.guard';
import { AUTH_ERROR_CODES } from '../../../src/constants';

// Mock the AuthGuard class from @nestjs/passport
jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn(),
    handleRequest: jest.fn(),
  })),
}));

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    // Create a testing module with the LocalAuthGuard
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);

    // Reset mocks before each test
    jest.clearAllMocks();

    // Create a mock execution context
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          body: { username: 'test@example.com', password: 'password123' },
        }),
        getResponse: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getType: jest.fn(),
      getArgs: jest.fn(),
    } as unknown as ExecutionContext;
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should extend AuthGuard(\'local\')', () => {
    // Verify that AuthGuard was called with 'local' strategy
    expect(AuthGuard).toHaveBeenCalledWith('local');
  });

  describe('canActivate', () => {
    it('should return true when authentication succeeds', async () => {
      // Mock the parent canActivate method to return true
      const mockSuperCanActivate = jest.spyOn(AuthGuard('local').prototype, 'canActivate');
      mockSuperCanActivate.mockResolvedValue(true);

      const result = await guard.canActivate(mockExecutionContext);
      
      expect(mockSuperCanActivate).toHaveBeenCalledWith(mockExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException with proper error code when authentication fails with "Unauthorized"', async () => {
      // Mock the parent canActivate method to throw an error
      const mockSuperCanActivate = jest.spyOn(AuthGuard('local').prototype, 'canActivate');
      mockSuperCanActivate.mockRejectedValue(new Error('Unauthorized'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        new UnauthorizedException({
          message: 'Invalid email or password',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        })
      );
    });

    it('should rethrow original error for non-standard errors', async () => {
      // Mock the parent canActivate method to throw a different error
      const mockSuperCanActivate = jest.spyOn(AuthGuard('local').prototype, 'canActivate');
      const originalError = new Error('Some other error');
      mockSuperCanActivate.mockRejectedValue(originalError);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(originalError);
    });
  });

  describe('handleRequest', () => {
    it('should return the user when authentication succeeds', () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      
      const result = guard.handleRequest(null, mockUser, null, mockExecutionContext);
      
      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when error is provided', () => {
      const mockError = new Error('Authentication error');
      
      expect(() => {
        guard.handleRequest(mockError, null, null, mockExecutionContext);
      }).toThrow(
        new UnauthorizedException({
          message: 'Invalid email or password',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        })
      );
    });

    it('should throw UnauthorizedException when user is not provided', () => {
      expect(() => {
        guard.handleRequest(null, null, null, mockExecutionContext);
      }).toThrow(
        new UnauthorizedException({
          message: 'Invalid email or password',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        })
      );
    });

    it('should throw UnauthorizedException when user is false', () => {
      expect(() => {
        guard.handleRequest(null, false, null, mockExecutionContext);
      }).toThrow(
        new UnauthorizedException({
          message: 'Invalid email or password',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        })
      );
    });
  });

  // Test integration with NestJS dependency injection
  describe('NestJS integration', () => {
    it('should be properly injectable', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [LocalAuthGuard],
      }).compile();

      const injectedGuard = module.get<LocalAuthGuard>(LocalAuthGuard);
      expect(injectedGuard).toBeInstanceOf(LocalAuthGuard);
    });
  });
});