import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { BaseError } from '@austa/errors';
import { AuthService } from '../../src/auth.service';
import { TokenService } from '../../src/token.service';
import { JourneyType } from '../../src/interfaces/role.interface';
import { JWT_CLAIMS, TOKEN_TYPES, ERROR_CODES } from '../../src/constants';
import { CreateUserDto } from '../../src/dto/create-user.dto';
import { JwtPayload, TokenResponse } from '../../src/types';

/**
 * Mock user for testing
 */
const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@austa.health',
  firstName: 'Test',
  lastName: 'User',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
  roles: [
    { id: 1, name: 'user' }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock user with admin role for testing
 */
const mockAdminUser = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  email: 'admin@austa.health',
  firstName: 'Admin',
  lastName: 'User',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
  roles: [
    { id: 1, name: 'user' },
    { id: 2, name: 'admin' }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock user with journey-specific roles for testing
 */
const mockJourneyUser = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  email: 'journey@austa.health',
  firstName: 'Journey',
  lastName: 'User',
  password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
  roles: [
    { id: 1, name: 'user' },
    { id: 3, name: 'health_admin', journey: JourneyType.HEALTH },
    { id: 4, name: 'care_user', journey: JourneyType.CARE }
  ],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

/**
 * Mock user registration data
 */
const mockRegistrationData: CreateUserDto = {
  email: 'newuser@austa.health',
  password: 'Password123!',
  firstName: 'New',
  lastName: 'User'
};

/**
 * Mock JWT configuration
 */
const mockJwtConfig = {
  'authService.jwt.secret': 'test-jwt-secret',
  'authService.jwt.accessTokenExpiration': '1h',
  'authService.jwt.refreshTokenExpiration': '7d',
  'authService.jwt.audience': 'test-audience',
  'authService.jwt.issuer': 'test-issuer',
  'authService.passwordSaltRounds': 10,
  'CONFIG_KEYS.JWT_SECRET': 'test-jwt-secret',
  'CONFIG_KEYS.JWT_ACCESS_EXPIRATION': 3600,
  'CONFIG_KEYS.JWT_REFRESH_EXPIRATION': 604800,
  'CONFIG_KEYS.JWT_ISSUER': 'test-issuer',
  'CONFIG_KEYS.JWT_AUDIENCE': 'test-audience'
};

/**
 * Mock PrismaService implementation
 */
class MockPrismaService {
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn()
  };
  role = {
    findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'user', isDefault: true }])
  };
  $transaction: jest.fn().mockImplementation(callback => callback(this))
}

/**
 * Mock LoggerService implementation
 */
class MockLoggerService {
  debug = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
}

describe('AuthService and TokenService Integration', () => {
  let authService: AuthService;
  let tokenService: TokenService;
  let jwtService: JwtService;
  let prismaService: MockPrismaService;
  let configService: ConfigService;
  let loggerService: MockLoggerService;

  beforeEach(async () => {
    // Create mocks
    prismaService = new MockPrismaService();
    loggerService = new MockLoggerService();
    
    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            signAsync: jest.fn(),
            verify: jest.fn(),
            verifyAsync: jest.fn(),
            decode: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => mockJwtConfig[key])
          }
        },
        {
          provide: PrismaService,
          useValue: prismaService
        },
        {
          provide: LoggerService,
          useValue: loggerService
        }
      ],
    }).compile();

    // Get service instances
    authService = module.get<AuthService>(AuthService);
    tokenService = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Authentication Flow', () => {
    it('should authenticate a user and generate valid tokens', async () => {
      // Mock password comparison to return true
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(true);
      
      // Mock user lookup
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock token generation
      const mockAccessToken = 'mock.access.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockAccessToken);
      
      // Perform login
      const result = await authService.login('test@austa.health', 'password123');
      
      // Verify results
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.accessToken).toBe(mockAccessToken);
      
      // Verify user lookup was called correctly
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@austa.health' },
        include: { roles: true }
      });
      
      // Verify token generation was called with correct parameters
      expect(jwtService.sign).toHaveBeenCalled();
      const tokenPayload = jwtService.sign.mock.calls[0][0];
      expect(tokenPayload.sub).toBe(mockUser.id);
      expect(tokenPayload.roles).toEqual(['user']);
    });

    it('should throw an error when user credentials are invalid', async () => {
      // Mock password comparison to return false
      jest.spyOn(require('bcrypt'), 'compare').mockResolvedValue(false);
      
      // Mock user lookup
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Attempt login with invalid password
      await expect(authService.login('test@austa.health', 'wrongpassword'))
        .rejects.toThrow(BaseError);
      
      // Verify user lookup was called
      expect(prismaService.user.findUnique).toHaveBeenCalled();
      
      // Verify token generation was not called
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw an error when user does not exist', async () => {
      // Mock user lookup to return null
      prismaService.user.findUnique.mockResolvedValue(null);
      
      // Attempt login with non-existent user
      await expect(authService.login('nonexistent@austa.health', 'password123'))
        .rejects.toThrow(BaseError);
      
      // Verify user lookup was called
      expect(prismaService.user.findUnique).toHaveBeenCalled();
      
      // Verify token generation was not called
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('Token Generation and Validation', () => {
    it('should generate access token with correct claims', async () => {
      // Mock token generation
      const mockToken = 'mock.access.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);
      
      // Generate token
      const token = await tokenService.generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user'],
        permissions: ['read:profile', 'update:profile'],
        journeyClaims: {
          [JourneyType.HEALTH]: ['read'],
          [JourneyType.CARE]: ['read']
        }
      });
      
      // Verify token was generated
      expect(token).toBe(mockToken);
      
      // Verify token generation was called with correct parameters
      expect(jwtService.signAsync).toHaveBeenCalled();
      const payload = jwtService.signAsync.mock.calls[0][0];
      expect(payload[JWT_CLAIMS.USER_ID]).toBe(mockUser.id);
      expect(payload[JWT_CLAIMS.EMAIL]).toBe(mockUser.email);
      expect(payload[JWT_CLAIMS.ROLES]).toEqual(['user']);
      expect(payload[JWT_CLAIMS.PERMISSIONS]).toEqual(['read:profile', 'update:profile']);
      expect(payload[JWT_CLAIMS.JOURNEY_ACCESS]).toEqual({
        [JourneyType.HEALTH]: ['read'],
        [JourneyType.CARE]: ['read']
      });
      expect(payload[JWT_CLAIMS.TOKEN_TYPE]).toBe(TOKEN_TYPES.ACCESS);
    });

    it('should generate a complete token response for client authentication', async () => {
      // Mock token generation
      const mockAccessToken = 'mock.access.token';
      const mockRefreshToken = 'mock.refresh.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockAccessToken);
      jest.spyOn(tokenService, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
      
      // Generate token response
      const tokenResponse = await tokenService.generateTokenResponse({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user']
      });
      
      // Verify token response structure
      expect(tokenResponse).toBeDefined();
      expect(tokenResponse.accessToken).toBe(mockAccessToken);
      expect(tokenResponse.refreshToken).toBe(mockRefreshToken);
      expect(tokenResponse.tokenType).toBe('Bearer');
      expect(tokenResponse.expiresAt).toBeDefined();
    });

    it('should validate a valid token', async () => {
      // Mock token validation
      const mockPayload: JwtPayload = {
        [JWT_CLAIMS.USER_ID]: mockUser.id,
        [JWT_CLAIMS.EMAIL]: mockUser.email,
        [JWT_CLAIMS.ROLES]: ['user'],
        [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
        [JWT_CLAIMS.ISSUED_AT]: Math.floor(Date.now() / 1000),
        [JWT_CLAIMS.EXPIRATION]: Math.floor(Date.now() / 1000) + 3600
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      
      // Validate token
      const validationResult = await tokenService.validateToken('valid.token');
      
      // Verify validation result
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.payload).toEqual(mockPayload);
      expect(validationResult.error).toBeUndefined();
      
      // Verify token validation was called
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.token', {
        secret: mockJwtConfig['CONFIG_KEYS.JWT_SECRET'],
        ignoreExpiration: false
      });
    });

    it('should reject an expired token', async () => {
      // Mock token validation to throw TokenExpiredError
      const expiredError = { name: 'TokenExpiredError', message: 'jwt expired' };
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(expiredError);
      
      // Validate expired token
      const validationResult = await tokenService.validateToken('expired.token');
      
      // Verify validation result
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe('Token has expired');
      expect(validationResult.errorCode).toBe(ERROR_CODES.TOKEN_EXPIRED);
      expect(validationResult.payload).toBeUndefined();
    });

    it('should reject a token with invalid signature', async () => {
      // Mock token validation to throw JsonWebTokenError
      const signatureError = { name: 'JsonWebTokenError', message: 'invalid signature' };
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(signatureError);
      
      // Validate token with invalid signature
      const validationResult = await tokenService.validateToken('invalid.signature.token');
      
      // Verify validation result
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe('Invalid token format or signature');
      expect(validationResult.errorCode).toBe(ERROR_CODES.INVALID_TOKEN);
      expect(validationResult.payload).toBeUndefined();
    });

    it('should reject a token with invalid type', async () => {
      // Mock token validation with wrong token type
      const mockPayload: JwtPayload = {
        [JWT_CLAIMS.USER_ID]: mockUser.id,
        [JWT_CLAIMS.EMAIL]: mockUser.email,
        [JWT_CLAIMS.ROLES]: ['user'],
        [JWT_CLAIMS.TOKEN_TYPE]: 'invalid_type', // Wrong token type
        [JWT_CLAIMS.ISSUED_AT]: Math.floor(Date.now() / 1000),
        [JWT_CLAIMS.EXPIRATION]: Math.floor(Date.now() / 1000) + 3600
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      
      // Validate token with invalid type
      const validationResult = await tokenService.validateToken('invalid.type.token');
      
      // Verify validation result
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.error).toBe('Invalid token type');
      expect(validationResult.errorCode).toBe(ERROR_CODES.INVALID_TOKEN);
      expect(validationResult.payload).toBeUndefined();
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh a token for a valid user', async () => {
      // Mock user lookup
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock token generation
      const mockNewToken = 'new.access.token';
      jest.spyOn(jwtService, 'sign').mockReturnValue(mockNewToken);
      
      // Refresh token
      const result = await authService.refreshToken(mockUser.id);
      
      // Verify results
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockNewToken);
      
      // Verify user lookup was called correctly
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { roles: true }
      });
      
      // Verify token generation was called
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('should throw an error when refreshing token for non-existent user', async () => {
      // Mock user lookup to return null
      prismaService.user.findUnique.mockResolvedValue(null);
      
      // Attempt to refresh token for non-existent user
      await expect(authService.refreshToken('nonexistent-id'))
        .rejects.toThrow(BaseError);
      
      // Verify user lookup was called
      expect(prismaService.user.findUnique).toHaveBeenCalled();
      
      // Verify token generation was not called
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should generate a new token pair with secure rotation', async () => {
      // Mock token generation
      const mockAccessToken = 'new.access.token';
      const mockRefreshToken = 'new.refresh.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockAccessToken);
      jest.spyOn(tokenService, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
      
      // Generate token pair
      const tokenPair = await tokenService.generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user']
      });
      
      // Verify token pair structure
      expect(tokenPair).toBeDefined();
      expect(tokenPair.accessToken).toBe(mockAccessToken);
      expect(tokenPair.refreshToken).toBe(mockRefreshToken);
      expect(tokenPair.expiresAt).toBeDefined();
      
      // Verify refresh token is properly generated
      expect(tokenService.generateRefreshToken).toHaveBeenCalled();
    });
  });

  describe('Cross-Service Token Validation', () => {
    it('should validate a token and extract user information', async () => {
      // Mock token payload
      const mockPayload: JwtPayload = {
        [JWT_CLAIMS.USER_ID]: mockUser.id,
        [JWT_CLAIMS.EMAIL]: mockUser.email,
        [JWT_CLAIMS.ROLES]: ['user'],
        [JWT_CLAIMS.PERMISSIONS]: ['read:profile', 'update:profile'],
        [JWT_CLAIMS.JOURNEY_ACCESS]: {
          [JourneyType.HEALTH]: ['read'],
          [JourneyType.CARE]: ['read']
        },
        [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
        [JWT_CLAIMS.ISSUED_AT]: Math.floor(Date.now() / 1000),
        [JWT_CLAIMS.EXPIRATION]: Math.floor(Date.now() / 1000) + 3600
      };
      
      // Extract user from payload
      const user = tokenService.extractUserFromPayload(mockPayload);
      
      // Verify extracted user information
      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
      expect(user.email).toBe(mockUser.email);
      expect(user.roles).toEqual(['user']);
      expect(user.permissions).toEqual(['read:profile', 'update:profile']);
      expect(user.journeyAttributes).toEqual({
        [JourneyType.HEALTH]: ['read'],
        [JourneyType.CARE]: ['read']
      });
      expect(user.lastAuthenticated).toBeDefined();
    });

    it('should validate a token from TokenService in AuthService', async () => {
      // Mock token validation in TokenService
      const mockPayload: JwtPayload = {
        [JWT_CLAIMS.USER_ID]: mockUser.id,
        [JWT_CLAIMS.EMAIL]: mockUser.email,
        [JWT_CLAIMS.ROLES]: ['user'],
        [JWT_CLAIMS.TOKEN_TYPE]: TOKEN_TYPES.ACCESS,
        sub: mockUser.id // Legacy field for compatibility
      };
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);
      
      // Mock user lookup in AuthService
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // First validate with TokenService
      const validationResult = await tokenService.validateToken('valid.token');
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.payload).toEqual(mockPayload);
      
      // Then validate with AuthService using the same payload
      const user = await authService.validateToken(mockPayload);
      
      // Verify user was found and returned
      expect(user).toBeDefined();
      expect(user.id).toBe(mockUser.id);
      
      // Verify user lookup was called correctly
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: { roles: true }
      });
    });
  });

  describe('User Registration with Token Generation', () => {
    it('should register a new user and be able to generate tokens', async () => {
      // Mock password hashing
      jest.spyOn(require('bcrypt'), 'hash').mockResolvedValue('hashed_password');
      
      // Mock user creation
      const createdUser = {
        id: '123e4567-e89b-12d3-a456-426614174099',
        email: mockRegistrationData.email,
        firstName: mockRegistrationData.firstName,
        lastName: mockRegistrationData.lastName,
        password: 'hashed_password',
        roles: [{ id: 1, name: 'user' }],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      prismaService.user.create.mockResolvedValue(createdUser);
      prismaService.user.findUnique.mockResolvedValue(null); // User doesn't exist yet
      
      // Register new user
      const registeredUser = await authService.register(mockRegistrationData);
      
      // Verify user was created
      expect(registeredUser).toBeDefined();
      expect(registeredUser.id).toBe(createdUser.id);
      expect(registeredUser.email).toBe(createdUser.email);
      expect(registeredUser.password).toBeUndefined(); // Password should be excluded
      
      // Mock token generation
      const mockAccessToken = 'new.user.access.token';
      const mockRefreshToken = 'new.user.refresh.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockAccessToken);
      jest.spyOn(tokenService, 'generateRefreshToken').mockReturnValue(mockRefreshToken);
      
      // Generate tokens for the new user
      const tokenResponse = await tokenService.generateTokenResponse({
        userId: registeredUser.id,
        email: registeredUser.email,
        roles: ['user']
      });
      
      // Verify token response
      expect(tokenResponse).toBeDefined();
      expect(tokenResponse.accessToken).toBe(mockAccessToken);
      expect(tokenResponse.refreshToken).toBe(mockRefreshToken);
      expect(tokenResponse.tokenType).toBe('Bearer');
    });

    it('should throw an error when registering with an existing email', async () => {
      // Mock user lookup to return existing user
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      
      // Attempt to register with existing email
      await expect(authService.register({
        email: mockUser.email,
        password: 'Password123!',
        firstName: 'Duplicate',
        lastName: 'User'
      })).rejects.toThrow(BaseError);
      
      // Verify user lookup was called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUser.email }
      });
      
      // Verify user creation was not called
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('Error Propagation Between Services', () => {
    it('should properly propagate token validation errors from TokenService to AuthService', async () => {
      // Mock token validation in TokenService to fail
      const invalidTokenError = { name: 'JsonWebTokenError', message: 'invalid token' };
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValue(invalidTokenError);
      
      // Validate token with TokenService
      const validationResult = await tokenService.validateToken('invalid.token');
      expect(validationResult.isValid).toBe(false);
      
      // Mock token payload with invalid sub
      const invalidPayload = {
        sub: null, // Invalid user ID
        email: 'invalid@austa.health'
      };
      
      // Validate token with AuthService
      const user = await authService.validateToken(invalidPayload);
      
      // Verify null is returned for invalid token
      expect(user).toBeNull();
      
      // Verify user lookup was not called
      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should handle database errors during token validation', async () => {
      // Mock token payload
      const validPayload = {
        sub: mockUser.id,
        email: mockUser.email
      };
      
      // Mock database error during user lookup
      const dbError = new Error('Database connection failed');
      prismaService.user.findUnique.mockRejectedValue(dbError);
      
      // Validate token with AuthService
      const user = await authService.validateToken(validPayload);
      
      // Verify null is returned for database error
      expect(user).toBeNull();
      
      // Verify error was logged
      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('JWT Payload Structure and Claims', () => {
    it('should include all required claims in the token payload', async () => {
      // Mock token generation
      jest.spyOn(jwtService, 'signAsync').mockImplementation(async (payload) => {
        return JSON.stringify(payload); // Return stringified payload for inspection
      });
      
      // Generate token with all possible claims
      const token = await tokenService.generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user'],
        permissions: ['read:profile', 'update:profile'],
        journeyClaims: {
          [JourneyType.HEALTH]: ['read', 'write'],
          [JourneyType.CARE]: ['read']
        },
        sessionId: 'test-session-id',
        deviceId: 'test-device-id',
        mfaVerified: true
      });
      
      // Parse token payload
      const payload = JSON.parse(token);
      
      // Verify all claims are present
      expect(payload[JWT_CLAIMS.USER_ID]).toBe(mockUser.id);
      expect(payload[JWT_CLAIMS.EMAIL]).toBe(mockUser.email);
      expect(payload[JWT_CLAIMS.ROLES]).toEqual(['user']);
      expect(payload[JWT_CLAIMS.PERMISSIONS]).toEqual(['read:profile', 'update:profile']);
      expect(payload[JWT_CLAIMS.JOURNEY_ACCESS]).toEqual({
        [JourneyType.HEALTH]: ['read', 'write'],
        [JourneyType.CARE]: ['read']
      });
      expect(payload[JWT_CLAIMS.SESSION_ID]).toBe('test-session-id');
      expect(payload[JWT_CLAIMS.DEVICE_ID]).toBe('test-device-id');
      expect(payload[JWT_CLAIMS.MFA_VERIFIED]).toBe(true);
      expect(payload[JWT_CLAIMS.TOKEN_TYPE]).toBe(TOKEN_TYPES.ACCESS);
      expect(payload[JWT_CLAIMS.ISSUED_AT]).toBeDefined();
      expect(payload[JWT_CLAIMS.EXPIRATION]).toBeDefined();
      expect(payload[JWT_CLAIMS.ISSUER]).toBe(mockJwtConfig['CONFIG_KEYS.JWT_ISSUER']);
      expect(payload[JWT_CLAIMS.AUDIENCE]).toBe(mockJwtConfig['CONFIG_KEYS.JWT_AUDIENCE']);
    });

    it('should generate different tokens for different journeys', async () => {
      // Mock token generation
      const tokenMap = new Map<string, string>();
      jest.spyOn(jwtService, 'signAsync').mockImplementation(async (payload) => {
        const token = `token-for-${JSON.stringify(payload[JWT_CLAIMS.JOURNEY_ACCESS])}`;
        tokenMap.set(token, JSON.stringify(payload));
        return token;
      });
      
      // Generate tokens for different journeys
      const healthToken = await tokenService.generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user'],
        journeyClaims: { [JourneyType.HEALTH]: ['read', 'write'] }
      });
      
      const careToken = await tokenService.generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user'],
        journeyClaims: { [JourneyType.CARE]: ['read'] }
      });
      
      const planToken = await tokenService.generateAccessToken({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['user'],
        journeyClaims: { [JourneyType.PLAN]: ['read', 'write'] }
      });
      
      // Verify tokens are different
      expect(healthToken).not.toBe(careToken);
      expect(healthToken).not.toBe(planToken);
      expect(careToken).not.toBe(planToken);
      
      // Verify journey claims in each token
      const healthPayload = JSON.parse(tokenMap.get(healthToken) || '{}');
      const carePayload = JSON.parse(tokenMap.get(careToken) || '{}');
      const planPayload = JSON.parse(tokenMap.get(planToken) || '{}');
      
      expect(healthPayload[JWT_CLAIMS.JOURNEY_ACCESS]).toEqual({ [JourneyType.HEALTH]: ['read', 'write'] });
      expect(carePayload[JWT_CLAIMS.JOURNEY_ACCESS]).toEqual({ [JourneyType.CARE]: ['read'] });
      expect(planPayload[JWT_CLAIMS.JOURNEY_ACCESS]).toEqual({ [JourneyType.PLAN]: ['read', 'write'] });
    });
  });
});