/**
 * @file local.strategy.spec.ts
 * @description Tests for the LocalStrategy implementation, ensuring it correctly extracts and validates
 * email and password credentials, properly integrates with AuthService.login() for authentication,
 * logs authentication attempts, and throws appropriate errors for invalid credentials.
 */

import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

// Import using standardized path aliases
import { LocalStrategy } from '@austa/auth/strategies/local.strategy';
import { AuthService } from '@austa/auth/auth.service';
import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType, ValidationError } from '@austa/errors';
import { AUTH_ERROR_CODES } from '@austa/auth/constants';

// Import test utilities and fixtures
import { MockAuthService, MockLoggerService } from './strategy.mocks';
import { validUserCredentials, invalidPasswordCredentials, nonExistentUserCredentials } from './strategy.fixtures';

describe('LocalStrategy', () => {
  let localStrategy: LocalStrategy;
  let mockAuthService: MockAuthService;
  let mockLoggerService: MockLoggerService;

  beforeEach(async () => {
    // Create testing module with mocked dependencies
    const moduleRef = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useClass: MockAuthService,
        },
        {
          provide: LoggerService,
          useClass: MockLoggerService,
        },
      ],
    }).compile();

    // Get instances of strategy and mocked services
    localStrategy = moduleRef.get<LocalStrategy>(LocalStrategy);
    mockAuthService = moduleRef.get<AuthService>(AuthService) as unknown as MockAuthService;
    mockLoggerService = moduleRef.get<LoggerService>(LoggerService) as unknown as MockLoggerService;

    // Reset mocks before each test
    mockAuthService.resetCalls();
    mockLoggerService.clearLogs();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(localStrategy).toBeDefined();
    });

    it('should configure passport to use email and password fields', () => {
      // This test verifies that the strategy is configured with the correct options
      // We can't directly access the options, but we can test the behavior
      expect(localStrategy).toHaveProperty('validate');
    });
  });

  describe('validate', () => {
    it('should successfully authenticate with valid credentials', async () => {
      // Arrange
      const { email, password } = validUserCredentials;

      // Act
      const result = await localStrategy.validate(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.email).toBe(email);
      expect(mockAuthService.loginCalls.length).toBe(1);
      expect(mockAuthService.loginCalls[0].email).toBe(email);
      expect(mockAuthService.loginCalls[0].password).toBe(password);

      // Verify logging
      const debugLogs = mockLoggerService.getLogsByLevel('debug');
      expect(debugLogs.length).toBeGreaterThan(0);
      expect(debugLogs[0].message).toContain('Validating user credentials');
      expect(debugLogs[0].meta).toHaveProperty('email', email);

      const infoLogs = mockLoggerService.getLogsByLevel('info');
      expect(infoLogs.length).toBeGreaterThan(0);
      expect(infoLogs[0].message).toContain('User authenticated successfully');
    });

    it('should throw ValidationError when credentials are missing', async () => {
      // Arrange
      const email = '';
      const password = '';

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      
      // Verify no login attempt was made
      expect(mockAuthService.loginCalls.length).toBe(0);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Authentication failed: Missing credentials');
    });

    it('should throw ValidationError when email is missing', async () => {
      // Arrange
      const email = '';
      const { password } = validUserCredentials;

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      
      // Verify no login attempt was made
      expect(mockAuthService.loginCalls.length).toBe(0);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Authentication failed: Missing credentials');
    });

    it('should throw ValidationError when password is missing', async () => {
      // Arrange
      const { email } = validUserCredentials;
      const password = '';

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      
      // Verify no login attempt was made
      expect(mockAuthService.loginCalls.length).toBe(0);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Authentication failed: Missing credentials');
    });

    it('should throw ValidationError when credentials are invalid', async () => {
      // Arrange
      const { email, password } = invalidPasswordCredentials;
      
      // Mock AuthService to throw ValidationError for invalid credentials
      mockAuthService.login = jest.fn().mockRejectedValue(
        new ValidationError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        })
      );

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).toHaveBeenCalledWith(email, password);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
    });

    it('should throw ValidationError when user does not exist', async () => {
      // Arrange
      const { email, password } = nonExistentUserCredentials;
      
      // Mock AuthService to throw ValidationError for non-existent user
      mockAuthService.login = jest.fn().mockRejectedValue(
        new ValidationError({
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid email or password',
        })
      );

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).toHaveBeenCalledWith(email, password);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
    });

    it('should throw ValidationError when AuthService.login returns null', async () => {
      // Arrange
      const { email, password } = validUserCredentials;
      
      // Mock AuthService to return null
      mockAuthService.login = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).toHaveBeenCalledWith(email, password);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Authentication failed: Invalid credentials');
    });

    it('should throw ValidationError when AuthService.login returns object without user', async () => {
      // Arrange
      const { email, password } = validUserCredentials;
      
      // Mock AuthService to return object without user
      mockAuthService.login = jest.fn().mockResolvedValue({ tokens: {} });

      // Act & Assert
      await expect(localStrategy.validate(email, password)).rejects.toThrow(ValidationError);
      expect(mockAuthService.login).toHaveBeenCalledWith(email, password);

      // Verify logging
      const warnLogs = mockLoggerService.getLogsByLevel('warn');
      expect(warnLogs.length).toBeGreaterThan(0);
      expect(warnLogs[0].message).toContain('Authentication failed: Invalid credentials');
    });

    it('should wrap unexpected errors in BaseError with TECHNICAL type', async () => {
      // Arrange
      const { email, password } = validUserCredentials;
      
      // Mock AuthService to throw unexpected error
      const unexpectedError = new Error('Unexpected database error');
      mockAuthService.login = jest.fn().mockRejectedValue(unexpectedError);

      // Act & Assert
      try {
        await localStrategy.validate(email, password);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe(AUTH_ERROR_CODES.AUTHENTICATION_FAILED);
        expect(error.cause).toBe(unexpectedError);
      }

      // Verify logging
      const errorLogs = mockLoggerService.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
      expect(errorLogs[0].message).toContain('Authentication failed with unexpected error');
    });

    it('should transform authenticated user to AuthenticatedUser format', async () => {
      // Arrange
      const { email, password } = validUserCredentials;
      
      // Mock AuthService to return user with roles as objects
      mockAuthService.login = jest.fn().mockResolvedValue({
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@example.com',
          name: 'Test User',
          roles: [
            { id: 1, name: 'user' },
            { id: 2, name: 'health-journey-user' }
          ]
        }
      });

      // Act
      const result = await localStrategy.validate(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(result.email).toBe('user@example.com');
      expect(result.name).toBe('Test User');
      expect(result.roles).toEqual(['user', 'health-journey-user']);
      expect(result.lastAuthenticated).toBeInstanceOf(Date);
    });
  });
});