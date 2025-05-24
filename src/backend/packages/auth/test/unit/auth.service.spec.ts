/**
 * @file Authentication Service Unit Tests
 * 
 * This file contains unit tests for the AuthService, which is responsible for core authentication
 * operations including user registration, login, token validation, and user management. The tests
 * verify proper handling of authentication flows, error cases, and integration with the token service.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// Import from @austa/errors package for standardized error handling
import { AuthError, ValidationError } from '@austa/errors/categories';

// Import from @austa/database package for database access
import { PrismaService } from '@austa/database';

// Import from @austa/logging package for structured logging
import { LoggerService } from '@austa/logging';

// Local imports
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { ERROR_CODES } from '../../src/constants';
import {
  AuthProvider,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  TokenResponse,
  User,
  MfaMethod,
  TokenType,
  TokenUserInfo,
} from '../../src/types';

// Mock data for testing
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '+1234567890',
  emailVerified: true,
  mfaEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  provider: AuthProvider.LOCAL,
};

const mockUserWithMfa: User = {
  ...mockUser,
  id: 'user-456',
  email: 'mfa@example.com',
  mfaEnabled: true,
  mfaMethod: MfaMethod.SMS,
};

const mockLockedUser: User = {
  ...mockUser,
  id: 'user-789',
  email: 'locked@example.com',
  failedLoginAttempts: 5,
  lockedUntil: new Date(Date.now() + 900000), // 15 minutes from now
};

const mockUnverifiedUser: User = {
  ...mockUser,
  id: 'user-101',
  email: 'unverified@example.com',
  emailVerified: false,
};

const mockRegisterRequest: RegisterRequest = {
  email: 'new@example.com',
  password: 'Password123!',
  firstName: 'New',
  lastName: 'User',
  phoneNumber: '+1987654321',
};

const mockLoginRequest: LoginRequest = {
  email: 'test@example.com',
  password: 'Password123!',
  rememberMe: false,
};

const mockRefreshTokenRequest: RefreshTokenRequest = {
  refreshToken: 'mock.refresh.token',
};

const mockTokenResponse: TokenResponse = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token',
  expiresIn: 3600,
  tokenType: 'Bearer',
};

const mockUserInfo: TokenUserInfo = {
  id: mockUser.id,
  email: mockUser.email,
  roles: ['user'],
  permissions: {
    'health': ['read', 'write'],
    'care': ['read'],
  },
};

const mockMfaChallengeToken = 'mock.mfa.challenge.token';

// Mock PrismaService
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userRole: {
    create: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  mfaChallenge: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

// Mock TokenService
const mockTokenService = {
  generateTokens: jest.fn(),
  validateToken: jest.fn(),
  refreshToken: jest.fn(),
  revokeToken: jest.fn(),
  generateSpecialToken: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: any) => {
    const config = {
      'PASSWORD_MIN_LENGTH': 8,
      'PASSWORD_REQUIRE_UPPERCASE': true,
      'PASSWORD_REQUIRE_LOWERCASE': true,
      'PASSWORD_REQUIRE_NUMBER': true,
      'PASSWORD_REQUIRE_SPECIAL': true,
      'AUTH_REQUIRE_EMAIL_VERIFICATION': true,
      'PASSWORD_LOCKOUT_THRESHOLD': 5,
      'PASSWORD_LOCKOUT_DURATION': 15,
      'REMEMBER_ME_EXTENSION': 2592000,
      'DEFAULT_ROLE': 'user',
    };
    return config[key] !== undefined ? config[key] : defaultValue;
  }),
};

// Mock LoggerService
const mockLoggerService = {
  setContext: jest.fn(),
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
};

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn().mockImplementation((password, hash) => {
    // For testing purposes, we'll consider a password valid if the hash is 'hashed_' + password
    return Promise.resolve(hash === `hashed_${password}`);
  }),
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        id: 'new-user-id',
        email: mockRegisterRequest.email,
        firstName: mockRegisterRequest.firstName,
        lastName: mockRegisterRequest.lastName,
        phoneNumber: mockRegisterRequest.phoneNumber,
        password: `hashed_${mockRegisterRequest.password}`,
        emailVerified: false,
      });
      mockPrismaService.role.findFirst.mockResolvedValue({ id: 'role-id', name: 'user' });
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue({
        id: 'new-user-id',
        email: mockRegisterRequest.email,
        roles: ['user'],
        permissions: {},
      });

      // Execute
      const result = await service.register(mockRegisterRequest);

      // Verify
      expect(result).toEqual({
        user: expect.objectContaining({
          id: 'new-user-id',
          email: mockRegisterRequest.email,
          firstName: mockRegisterRequest.firstName,
          lastName: mockRegisterRequest.lastName,
          phoneNumber: mockRegisterRequest.phoneNumber,
          emailVerified: false,
          roles: ['user'],
        }),
        tokens: mockTokenResponse,
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterRequest.email },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockRegisterRequest.email,
          firstName: mockRegisterRequest.firstName,
          lastName: mockRegisterRequest.lastName,
          phoneNumber: mockRegisterRequest.phoneNumber,
          emailVerified: false,
          mfaEnabled: false,
          provider: AuthProvider.LOCAL,
        }),
      });

      expect(mockPrismaService.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: 'new-user-id',
          roleId: 'role-id',
        },
      });

      expect(mockTokenService.generateTokens).toHaveBeenCalled();
    });

    it('should throw an error if email already exists', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser); // Existing user

      // Execute & Verify
      await expect(service.register(mockRegisterRequest)).rejects.toThrow(AuthError);
      await expect(service.register(mockRegisterRequest)).rejects.toThrow('Email already in use');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterRequest.email },
      });

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if password does not meet requirements', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      const weakPasswordRequest = { ...mockRegisterRequest, password: 'weak' };

      // Execute & Verify
      await expect(service.register(weakPasswordRequest)).rejects.toThrow(ValidationError);
      await expect(service.register(weakPasswordRequest)).rejects.toThrow('Password does not meet requirements');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: weakPasswordRequest.email },
      });

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should handle database errors during user creation', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      mockPrismaService.user.create.mockRejectedValue(new Error('Database error'));

      // Execute & Verify
      await expect(service.register(mockRegisterRequest)).rejects.toThrow(AuthError);
      await expect(service.register(mockRegisterRequest)).rejects.toThrow('Registration failed');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterRequest.email },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should handle duplicate key errors from database', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No existing user
      const prismaError = new Error('Unique constraint failed');
      prismaError['code'] = 'P2002';
      prismaError['meta'] = { target: ['email'] };
      mockPrismaService.user.create.mockRejectedValue(prismaError);

      // Execute & Verify
      await expect(service.register(mockRegisterRequest)).rejects.toThrow(AuthError);
      await expect(service.register(mockRegisterRequest)).rejects.toThrow('Email already in use');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockRegisterRequest.email },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate a user successfully', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: `hashed_${mockLoginRequest.password}`,
      });
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);

      // Execute
      const result = await service.login(mockLoginRequest);

      // Verify
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          roles: mockUserInfo.roles,
          permissions: mockUserInfo.permissions,
        }),
        tokens: mockTokenResponse,
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginRequest.email },
      });

      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(
        mockUserInfo,
        undefined // No remember me extension
      );
    });

    it('should authenticate with remember me option', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: `hashed_${mockLoginRequest.password}`,
      });
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);

      const loginWithRememberMe = { ...mockLoginRequest, rememberMe: true };

      // Execute
      const result = await service.login(loginWithRememberMe);

      // Verify
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
        tokens: mockTokenResponse,
      });

      expect(mockTokenService.generateTokens).toHaveBeenCalledWith(
        mockUserInfo,
        2592000 // Remember me extension (30 days)
      );
    });

    it('should throw an error if user is not found', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // User not found

      // Execute & Verify
      await expect(service.login(mockLoginRequest)).rejects.toThrow(AuthError);
      await expect(service.login(mockLoginRequest)).rejects.toThrow('Invalid email or password');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginRequest.email },
      });

      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if password is incorrect', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: 'hashed_WrongPassword123!', // Different password hash
        failedLoginAttempts: 0,
      });

      // Execute & Verify
      await expect(service.login(mockLoginRequest)).rejects.toThrow(AuthError);
      await expect(service.login(mockLoginRequest)).rejects.toThrow('Invalid email or password');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLoginRequest.email },
      });

      // Should increment failed login attempts
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: 1 },
      });

      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if account is locked', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(mockLockedUser);

      // Execute & Verify
      await expect(service.login({
        email: mockLockedUser.email,
        password: mockLoginRequest.password,
      })).rejects.toThrow(AuthError);
      await expect(service.login({
        email: mockLockedUser.email,
        password: mockLoginRequest.password,
      })).rejects.toThrow('Account is locked');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockLockedUser.email },
      });

      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if email is not verified', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUnverifiedUser,
        password: `hashed_${mockLoginRequest.password}`,
      });

      // Execute & Verify
      await expect(service.login({
        email: mockUnverifiedUser.email,
        password: mockLoginRequest.password,
      })).rejects.toThrow(AuthError);
      await expect(service.login({
        email: mockUnverifiedUser.email,
        password: mockLoginRequest.password,
      })).rejects.toThrow('Email not verified');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUnverifiedUser.email },
      });

      // Should reset failed login attempts on successful password verification
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUnverifiedUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });

      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should return MFA challenge if MFA is enabled', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUserWithMfa,
        password: `hashed_${mockLoginRequest.password}`,
      });
      mockTokenService.generateSpecialToken.mockResolvedValue(mockMfaChallengeToken);

      // Mock createMfaChallenge method
      jest.spyOn(service, 'createMfaChallenge').mockResolvedValue(mockMfaChallengeToken);

      // Execute
      const result = await service.login({
        email: mockUserWithMfa.email,
        password: mockLoginRequest.password,
      });

      // Verify
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUserWithMfa.id,
          email: mockUserWithMfa.email,
          mfaEnabled: true,
        }),
        tokens: null,
        mfaRequired: true,
        mfaChallengeToken: mockMfaChallengeToken,
      });

      expect(service.createMfaChallenge).toHaveBeenCalledWith(
        mockUserWithMfa.id,
        mockUserWithMfa.mfaMethod
      );

      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should reset failed login attempts on successful login', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        password: `hashed_${mockLoginRequest.password}`,
        failedLoginAttempts: 2, // Some previous failed attempts
      });
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);

      // Execute
      await service.login(mockLoginRequest);

      // Verify
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    });
  });

  describe('validateToken', () => {
    it('should validate a token successfully', async () => {
      // Setup
      mockTokenService.validateToken.mockResolvedValue({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUserInfo.roles,
        permissions: mockUserInfo.permissions,
        type: TokenType.ACCESS,
      });

      // Execute
      const result = await service.validateToken('valid.token');

      // Verify
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        roles: mockUserInfo.roles,
        permissions: mockUserInfo.permissions,
      });

      expect(mockTokenService.validateToken).toHaveBeenCalledWith('valid.token', TokenType.ACCESS);
    });

    it('should throw an error if token is expired', async () => {
      // Setup
      mockTokenService.validateToken.mockRejectedValue(new Error(ERROR_CODES.TOKEN_EXPIRED));

      // Execute & Verify
      await expect(service.validateToken('expired.token')).rejects.toThrow(AuthError);
      await expect(service.validateToken('expired.token')).rejects.toThrow('Token has expired');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith('expired.token', TokenType.ACCESS);
    });

    it('should throw an error if token is invalid', async () => {
      // Setup
      mockTokenService.validateToken.mockRejectedValue(new Error(ERROR_CODES.INVALID_TOKEN));

      // Execute & Verify
      await expect(service.validateToken('invalid.token')).rejects.toThrow(AuthError);
      await expect(service.validateToken('invalid.token')).rejects.toThrow('Invalid token');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith('invalid.token', TokenType.ACCESS);
    });

    it('should throw an error if token is revoked', async () => {
      // Setup
      mockTokenService.validateToken.mockRejectedValue(new Error(ERROR_CODES.TOKEN_REVOKED));

      // Execute & Verify
      await expect(service.validateToken('revoked.token')).rejects.toThrow(AuthError);
      await expect(service.validateToken('revoked.token')).rejects.toThrow('Token has been revoked');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith('revoked.token', TokenType.ACCESS);
    });

    it('should handle unexpected errors during validation', async () => {
      // Setup
      mockTokenService.validateToken.mockRejectedValue(new Error('Unexpected error'));

      // Execute & Verify
      await expect(service.validateToken('problem.token')).rejects.toThrow(AuthError);
      await expect(service.validateToken('problem.token')).rejects.toThrow('Failed to validate token');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith('problem.token', TokenType.ACCESS);
    });
  });

  describe('refreshToken', () => {
    it('should refresh a token successfully', async () => {
      // Setup
      mockTokenService.refreshToken.mockResolvedValue(mockTokenResponse);

      // Execute
      const result = await service.refreshToken(mockRefreshTokenRequest);

      // Verify
      expect(result).toEqual(mockTokenResponse);
      expect(mockTokenService.refreshToken).toHaveBeenCalledWith(mockRefreshTokenRequest);
    });

    it('should throw an error if token refresh fails', async () => {
      // Setup
      mockTokenService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      // Execute & Verify
      await expect(service.refreshToken(mockRefreshTokenRequest)).rejects.toThrow(AuthError);
      await expect(service.refreshToken(mockRefreshTokenRequest)).rejects.toThrow('Failed to refresh token');

      expect(mockTokenService.refreshToken).toHaveBeenCalledWith(mockRefreshTokenRequest);
    });
  });

  describe('logout', () => {
    it('should logout a user successfully', async () => {
      // Setup
      mockTokenService.revokeToken.mockResolvedValue(true);

      // Execute
      const result = await service.logout(mockUser.id, 'access.token');

      // Verify
      expect(result).toBe(true);
      expect(mockTokenService.revokeToken).toHaveBeenCalledWith('access.token');
    });

    it('should handle errors during logout gracefully', async () => {
      // Setup
      mockTokenService.revokeToken.mockRejectedValue(new Error('Revocation failed'));

      // Execute
      const result = await service.logout(mockUser.id, 'access.token');

      // Verify - should not throw but return false
      expect(result).toBe(false);
      expect(mockTokenService.revokeToken).toHaveBeenCalledWith('access.token');
      expect(mockLoggerService.error).toHaveBeenCalled();
    });
  });

  describe('verifyMfaCode', () => {
    it('should verify MFA code successfully', async () => {
      // Setup
      const mockMfaChallenge = {
        id: 'challenge-id',
        userId: mockUserWithMfa.id,
        method: MfaMethod.SMS,
        token: mockMfaChallengeToken,
        code: 'hashed_123456', // Hashed code
        expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
      };

      mockTokenService.validateToken.mockResolvedValue({
        sub: mockUserWithMfa.id,
        type: TokenType.MFA_CHALLENGE,
      });

      mockPrismaService.mfaChallenge.findFirst.mockResolvedValue(mockMfaChallenge);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithMfa);
      mockTokenService.generateTokens.mockResolvedValue(mockTokenResponse);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue({
        id: mockUserWithMfa.id,
        email: mockUserWithMfa.email,
        roles: ['user'],
        permissions: {},
      });

      // Execute
      const result = await service.verifyMfaCode({
        token: mockMfaChallengeToken,
        code: '123456', // Plain code that matches the hashed one
      });

      // Verify
      expect(result).toEqual({
        user: expect.objectContaining({
          id: mockUserWithMfa.id,
          email: mockUserWithMfa.email,
        }),
        tokens: mockTokenResponse,
      });

      expect(mockTokenService.validateToken).toHaveBeenCalledWith(
        mockMfaChallengeToken,
        TokenType.MFA_CHALLENGE
      );

      expect(mockPrismaService.mfaChallenge.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserWithMfa.id,
          token: mockMfaChallengeToken,
          expiresAt: { gt: expect.any(Date) },
        },
      });

      expect(mockPrismaService.mfaChallenge.delete).toHaveBeenCalledWith({
        where: { id: mockMfaChallenge.id },
      });

      expect(mockTokenService.generateTokens).toHaveBeenCalled();
    });

    it('should throw an error if MFA challenge is not found', async () => {
      // Setup
      mockTokenService.validateToken.mockResolvedValue({
        sub: mockUserWithMfa.id,
        type: TokenType.MFA_CHALLENGE,
      });

      mockPrismaService.mfaChallenge.findFirst.mockResolvedValue(null); // No challenge found

      // Execute & Verify
      await expect(service.verifyMfaCode({
        token: mockMfaChallengeToken,
        code: '123456',
      })).rejects.toThrow(AuthError);
      await expect(service.verifyMfaCode({
        token: mockMfaChallengeToken,
        code: '123456',
      })).rejects.toThrow('Invalid or expired MFA challenge');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith(
        mockMfaChallengeToken,
        TokenType.MFA_CHALLENGE
      );

      expect(mockPrismaService.mfaChallenge.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.mfaChallenge.delete).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if MFA code is invalid', async () => {
      // Setup
      const mockMfaChallenge = {
        id: 'challenge-id',
        userId: mockUserWithMfa.id,
        method: MfaMethod.SMS,
        token: mockMfaChallengeToken,
        code: 'hashed_654321', // Different code
        expiresAt: new Date(Date.now() + 300000), // 5 minutes from now
      };

      mockTokenService.validateToken.mockResolvedValue({
        sub: mockUserWithMfa.id,
        type: TokenType.MFA_CHALLENGE,
      });

      mockPrismaService.mfaChallenge.findFirst.mockResolvedValue(mockMfaChallenge);

      // Execute & Verify
      await expect(service.verifyMfaCode({
        token: mockMfaChallengeToken,
        code: '123456', // Doesn't match the hashed code
      })).rejects.toThrow(AuthError);
      await expect(service.verifyMfaCode({
        token: mockMfaChallengeToken,
        code: '123456',
      })).rejects.toThrow('Invalid MFA code');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith(
        mockMfaChallengeToken,
        TokenType.MFA_CHALLENGE
      );

      expect(mockPrismaService.mfaChallenge.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.mfaChallenge.delete).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('should throw an error if MFA challenge token is expired', async () => {
      // Setup
      mockTokenService.validateToken.mockRejectedValue(new Error(ERROR_CODES.TOKEN_EXPIRED));

      // Execute & Verify
      await expect(service.verifyMfaCode({
        token: 'expired.mfa.token',
        code: '123456',
      })).rejects.toThrow(AuthError);
      await expect(service.verifyMfaCode({
        token: 'expired.mfa.token',
        code: '123456',
      })).rejects.toThrow('MFA challenge has expired');

      expect(mockTokenService.validateToken).toHaveBeenCalledWith(
        'expired.mfa.token',
        TokenType.MFA_CHALLENGE
      );

      expect(mockPrismaService.mfaChallenge.findFirst).not.toHaveBeenCalled();
      expect(mockTokenService.generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('createMfaChallenge', () => {
    it('should create an MFA challenge successfully', async () => {
      // Setup
      mockTokenService.generateSpecialToken.mockResolvedValue(mockMfaChallengeToken);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUserWithMfa);

      // Mock generateMfaCode method (private method)
      jest.spyOn(service as any, 'generateMfaCode').mockReturnValue('123456');

      // Execute
      const result = await service.createMfaChallenge(mockUserWithMfa.id, MfaMethod.SMS);

      // Verify
      expect(result).toBe(mockMfaChallengeToken);

      expect(mockTokenService.generateSpecialToken).toHaveBeenCalledWith(
        mockUserWithMfa.id,
        TokenType.MFA_CHALLENGE,
        300, // 5 minutes
        { mfaMethod: MfaMethod.SMS }
      );

      expect(mockPrismaService.mfaChallenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserWithMfa.id,
          method: MfaMethod.SMS,
          token: mockMfaChallengeToken,
          code: expect.any(String), // Hashed code
          expiresAt: expect.any(Date),
        }),
      });
    });

    it('should throw an error if MFA challenge creation fails', async () => {
      // Setup
      mockTokenService.generateSpecialToken.mockRejectedValue(new Error('Token generation failed'));

      // Execute & Verify
      await expect(service.createMfaChallenge(mockUserWithMfa.id, MfaMethod.SMS)).rejects.toThrow(AuthError);
      await expect(service.createMfaChallenge(mockUserWithMfa.id, MfaMethod.SMS)).rejects.toThrow('Failed to create MFA challenge');

      expect(mockTokenService.generateSpecialToken).toHaveBeenCalled();
      expect(mockPrismaService.mfaChallenge.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should get a user by ID successfully', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      // Mock getUserInfo method (private method)
      jest.spyOn(service as any, 'getUserInfo').mockResolvedValue(mockUserInfo);

      // Execute
      const result = await service.getUserById(mockUser.id);

      // Verify
      expect(result).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        roles: mockUserInfo.roles,
        permissions: mockUserInfo.permissions,
      }));

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should throw an error if user is not found', async () => {
      // Setup
      mockPrismaService.user.findUnique.mockResolvedValue(null); // User not found

      // Execute & Verify
      await expect(service.getUserById('non-existent-id')).rejects.toThrow(AuthError);
      await expect(service.getUserById('non-existent-id')).rejects.toThrow('User not found');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
    });
  });
});