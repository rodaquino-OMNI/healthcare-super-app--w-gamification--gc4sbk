import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { createMock } from '@golevelup/ts-jest';
import { LoggerService } from '@austa/logging';
import { ValidationError, BaseError } from '@austa/errors';

// Import using path aliases from the new package structure
import { LocalAuthGuard } from '@austa/auth/guards/local-auth.guard';
import { LocalStrategy } from '@austa/auth/strategies/local.strategy';
import { AuthService } from '@austa/auth/auth.service';
import { TokenService } from '@austa/auth/token.service';
import { AUTH_ERROR_CODES } from '@austa/auth/constants';
import { AuthenticatedUser } from '@austa/interfaces/auth';

describe('LocalAuthGuard Integration', () => {
  let guard: LocalAuthGuard;
  let strategy: LocalStrategy;
  let authService: AuthService;
  let module: TestingModule;
  
  // Mock user for successful authentication
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    roles: [{ id: 'role-1', name: 'user' }],
    password: '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', // Bcrypt hashed password
  };

  // Mock authenticated user response
  const mockAuthenticatedUser: AuthenticatedUser = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    roles: ['user'],
    lastAuthenticated: expect.any(Date),
  };

  // Mock login result
  const mockLoginResult = {
    user: mockUser,
    tokens: {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  };

  beforeEach(async () => {
    // Create a mock AuthService
    const mockAuthService = {
      login: jest.fn().mockImplementation((email, password) => {
        // Simulate successful login
        if (email === mockUser.email && password === 'correct-password') {
          return Promise.resolve(mockLoginResult);
        }
        
        // Simulate invalid credentials
        if (password === 'wrong-password') {
          return Promise.resolve(null);
        }
        
        // Simulate account locked
        if (password === 'locked-account') {
          throw new ValidationError({
            code: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
            message: 'Account is locked due to too many failed attempts',
          });
        }
        
        // Simulate rate limit exceeded
        if (password === 'rate-limited') {
          throw new ValidationError({
            code: AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            message: 'Too many login attempts, please try again later',
          });
        }
        
        // Simulate technical error
        if (password === 'server-error') {
          throw new BaseError({
            code: 'TECHNICAL_ERROR',
            message: 'An unexpected error occurred',
          });
        }
        
        return Promise.resolve(null);
      }),
    };

    // Create a mock TokenService
    const mockTokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      }),
    };

    // Create a mock LoggerService
    const mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Create the test module
    module = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'local' }),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              jwtSecret: 'test-secret',
              jwtExpiresIn: '1h',
            },
          })],
        }),
      ],
      providers: [
        LocalAuthGuard,
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
    expect(strategy).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('Authentication Flow', () => {
    it('should successfully authenticate with valid credentials', async () => {
      // Create a mock execution context with valid credentials
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'correct-password',
      });

      // Execute the guard
      const result = await guard.canActivate(mockExecutionContext);
      
      // Verify the result
      expect(result).toBe(true);
      
      // Verify the user is attached to the request
      const request = mockExecutionContext.switchToHttp().getRequest();
      expect(request.user).toEqual(mockAuthenticatedUser);
      
      // Verify the auth service was called with the correct parameters
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'correct-password');
    });

    it('should reject authentication with invalid credentials', async () => {
      // Create a mock execution context with invalid credentials
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'wrong-password',
      });

      // Execute the guard and expect it to throw
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      
      // Verify the auth service was called with the correct parameters
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'wrong-password');
    });

    it('should propagate specific error codes for account locked', async () => {
      // Create a mock execution context with locked account
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'locked-account',
      });

      // Execute the guard and expect it to throw with the correct error code
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected guard to throw an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe(AUTH_ERROR_CODES.ACCOUNT_LOCKED);
        expect(error.message).toContain('Account is locked');
      }
      
      // Verify the auth service was called with the correct parameters
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'locked-account');
    });

    it('should handle rate limiting for failed login attempts', async () => {
      // Create a mock execution context with rate-limited account
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'rate-limited',
      });

      // Execute the guard and expect it to throw with the correct error code
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected guard to throw an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe(AUTH_ERROR_CODES.RATE_LIMIT_EXCEEDED);
        expect(error.message).toContain('Too many login attempts');
      }
      
      // Verify the auth service was called with the correct parameters
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'rate-limited');
    });

    it('should handle technical errors during authentication', async () => {
      // Create a mock execution context with server error
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'server-error',
      });

      // Execute the guard and expect it to throw with the correct error
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected guard to throw an exception');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.code).toBe('TECHNICAL_ERROR');
        expect(error.message).toContain('An unexpected error occurred');
      }
      
      // Verify the auth service was called with the correct parameters
      expect(authService.login).toHaveBeenCalledWith(mockUser.email, 'server-error');
    });

    it('should reject authentication with missing credentials', async () => {
      // Create a mock execution context with missing password
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: '',
      });

      // Execute the guard and expect it to throw
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(ValidationError);
      
      // Create a mock execution context with missing email
      const mockExecutionContext2 = createMockExecutionContext({
        email: '',
        password: 'some-password',
      });

      // Execute the guard and expect it to throw
      await expect(guard.canActivate(mockExecutionContext2)).rejects.toThrow(ValidationError);
    });
  });

  describe('Error Handling', () => {
    it('should transform authentication errors into standardized responses', async () => {
      // Create a mock execution context with invalid credentials
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'wrong-password',
      });

      // Execute the guard and capture the error
      let thrownError: any;
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        thrownError = error;
      }

      // Verify the error structure
      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(UnauthorizedException);
      expect(thrownError.response).toHaveProperty('errorCode', AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      expect(thrownError.response).toHaveProperty('message', 'Invalid email or password');
    });

    it('should preserve original error details when propagating errors', async () => {
      // Create a mock execution context with locked account
      const mockExecutionContext = createMockExecutionContext({
        email: mockUser.email,
        password: 'locked-account',
      });

      // Execute the guard and capture the error
      let thrownError: any;
      try {
        await guard.canActivate(mockExecutionContext);
      } catch (error) {
        thrownError = error;
      }

      // Verify the error structure is preserved
      expect(thrownError).toBeDefined();
      expect(thrownError).toBeInstanceOf(ValidationError);
      expect(thrownError.code).toBe(AUTH_ERROR_CODES.ACCOUNT_LOCKED);
      expect(thrownError.message).toContain('Account is locked');
    });
  });
});

/**
 * Creates a mock execution context for testing guards
 * 
 * @param body - The request body containing credentials
 * @returns A mock execution context
 */
function createMockExecutionContext(body: any): ExecutionContext {
  const mockRequest = {
    body,
  };

  return createMock<ExecutionContext>({
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  });
}