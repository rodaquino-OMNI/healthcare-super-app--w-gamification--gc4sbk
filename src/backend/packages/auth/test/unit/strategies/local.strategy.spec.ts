/**
 * @file Local Strategy Unit Tests
 * 
 * This file contains unit tests for the LocalStrategy, which is responsible for authenticating
 * users via username (email) and password credentials. The tests verify proper extraction of
 * credentials, integration with AuthService for validation, error handling, and logging.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

// Import from @austa/errors for standardized error handling
import { 
  InvalidCredentialsError, 
  MissingParameterError,
  ServiceUnavailableError
} from '@austa/errors';

// Import from @austa/interfaces for shared types
import { IUser } from '@austa/interfaces/user';

// Local imports
import { LocalStrategy } from '../../../src/strategies/local.strategy';
import { IAuthService } from '../../../src/interfaces/services.interface';

// Mock user data
const mockUser: IUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed_password',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock AuthService
const mockAuthService = {
  validateCredentials: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn(),
};

// Mock Logger
jest.mock('@nestjs/common', () => {
  const originalModule = jest.requireActual('@nestjs/common');
  return {
    ...originalModule,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    })),
  };
});

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: IAuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        { provide: IAuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get<IAuthService>(IAuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('constructor', () => {
    it('should configure passport with email as usernameField and password as passwordField', () => {
      // The super() call in the constructor should be called with the correct options
      // We can verify this by checking if the strategy has the correct properties
      expect((strategy as any).options.usernameField).toBe('email');
      expect((strategy as any).options.passwordField).toBe('password');
      expect((strategy as any).options.passReqToCallback).toBe(false);
    });

    it('should initialize the logger', () => {
      // Verify that the logger was initialized with the correct context
      expect(Logger).toHaveBeenCalledWith(LocalStrategy.name);
      expect((strategy as any).logger.log).toHaveBeenCalledWith('LocalStrategy initialized');
    });
  });

  describe('validate', () => {
    it('should successfully validate credentials and return the user', async () => {
      // Setup
      mockAuthService.validateCredentials.mockResolvedValue(mockUser);

      // Execute
      const result = await strategy.validate('test@example.com', 'Password123!');

      // Verify
      expect(result).toEqual(mockUser);
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect((strategy as any).logger.debug).toHaveBeenCalledWith(
        'Attempting to authenticate user: test@example.com',
        expect.objectContaining({
          authMethod: 'local',
          email: 'test@example.com'
        })
      );
      expect((strategy as any).logger.log).toHaveBeenCalledWith(
        'User authenticated successfully: test@example.com',
        expect.objectContaining({
          authMethod: 'local',
          userId: mockUser.id,
          email: mockUser.email
        })
      );
    });

    it('should throw MissingParameterError if email is missing', async () => {
      // Execute & Verify
      await expect(strategy.validate('', 'Password123!')).rejects.toThrow(MissingParameterError);
      await expect(strategy.validate('', 'Password123!')).rejects.toThrow('Email is required for authentication');
      
      expect(mockAuthService.validateCredentials).not.toHaveBeenCalled();
      expect((strategy as any).logger.warn).toHaveBeenCalledWith('Authentication attempt with missing email');
    });

    it('should throw MissingParameterError if password is missing', async () => {
      // Execute & Verify
      await expect(strategy.validate('test@example.com', '')).rejects.toThrow(MissingParameterError);
      await expect(strategy.validate('test@example.com', '')).rejects.toThrow('Password is required for authentication');
      
      expect(mockAuthService.validateCredentials).not.toHaveBeenCalled();
      expect((strategy as any).logger.warn).toHaveBeenCalledWith(
        'Authentication attempt for test@example.com with missing password'
      );
    });

    it('should throw InvalidCredentialsError if credentials are invalid', async () => {
      // Setup
      mockAuthService.validateCredentials.mockResolvedValue(null);

      // Execute & Verify
      await expect(strategy.validate('test@example.com', 'WrongPassword')).rejects.toThrow(InvalidCredentialsError);
      await expect(strategy.validate('test@example.com', 'WrongPassword')).rejects.toThrow('Invalid email or password');
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'WrongPassword');
      expect((strategy as any).logger.warn).toHaveBeenCalledWith(
        'Failed authentication attempt for user: test@example.com',
        expect.objectContaining({
          authMethod: 'local',
          email: 'test@example.com',
          reason: 'invalid_credentials'
        })
      );
    });

    it('should rethrow InvalidCredentialsError from auth service', async () => {
      // Setup
      const error = new InvalidCredentialsError('Invalid email or password', {
        attemptedEmail: 'test@example.com',
      });
      mockAuthService.validateCredentials.mockRejectedValue(error);

      // Execute & Verify
      await expect(strategy.validate('test@example.com', 'WrongPassword')).rejects.toThrow(InvalidCredentialsError);
      await expect(strategy.validate('test@example.com', 'WrongPassword')).rejects.toThrow('Invalid email or password');
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'WrongPassword');
    });

    it('should rethrow MissingParameterError from auth service', async () => {
      // Setup
      const error = new MissingParameterError('Required parameter missing', {
        paramName: 'email',
        location: 'body'
      });
      mockAuthService.validateCredentials.mockRejectedValue(error);

      // Execute & Verify
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow(MissingParameterError);
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow('Required parameter missing');
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'Password123!');
    });

    it('should throw ServiceUnavailableError if auth service is unavailable', async () => {
      // Setup
      const error = new Error('Database connection failed');
      error.name = 'ServiceUnavailableError';
      mockAuthService.validateCredentials.mockRejectedValue(error);

      // Execute & Verify
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow(ServiceUnavailableError);
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow('Authentication service is currently unavailable');
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect((strategy as any).logger.error).toHaveBeenCalledWith(
        'Authentication error for test@example.com: Database connection failed',
        expect.objectContaining({
          authMethod: 'local',
          email: 'test@example.com',
          errorName: 'ServiceUnavailableError',
          errorMessage: 'Database connection failed',
        })
      );
    });

    it('should throw InvalidCredentialsError for other errors (security by obscurity)', async () => {
      // Setup
      const error = new Error('Unknown error');
      mockAuthService.validateCredentials.mockRejectedValue(error);
      mockConfigService.get.mockReturnValue('production'); // Non-development environment

      // Execute & Verify
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow(InvalidCredentialsError);
      await expect(strategy.validate('test@example.com', 'Password123!')).rejects.toThrow('Invalid email or password');
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect((strategy as any).logger.error).toHaveBeenCalledWith(
        'Authentication error for test@example.com: Unknown error',
        expect.objectContaining({
          authMethod: 'local',
          email: 'test@example.com',
          errorName: 'Error',
          errorMessage: 'Unknown error',
        })
      );
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should include original error in development environment', async () => {
      // Setup
      const error = new Error('Unknown error');
      mockAuthService.validateCredentials.mockRejectedValue(error);
      mockConfigService.get.mockReturnValue('development');

      // Execute
      try {
        await strategy.validate('test@example.com', 'Password123!');
        fail('Expected error to be thrown');
      } catch (e) {
        // Verify
        expect(e).toBeInstanceOf(InvalidCredentialsError);
        expect(e.message).toBe('Invalid email or password');
        expect(e.context).toEqual(expect.objectContaining({
          attemptedEmail: 'test@example.com',
          authMethod: 'local',
          originalError: 'Unknown error',
        }));
      }
      
      expect(mockAuthService.validateCredentials).toHaveBeenCalledWith('test@example.com', 'Password123!');
      expect(mockConfigService.get).toHaveBeenCalledWith('NODE_ENV');
    });
  });
});