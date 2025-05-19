import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType } from '@austa/errors';
import { AuthService } from '../../src/auth.service';
import { CreateUserDto } from '../../src/dto/create-user.dto';
import { AUTH_ERROR_CODES } from '../../src/constants';
import { TokenPayload } from '../../src/types';

// Mock the bcrypt library
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashed_password')),
  compare: jest.fn().mockImplementation((plaintext, hash) => {
    // For testing purposes, consider 'valid_password' as the only valid password
    return Promise.resolve(plaintext === 'valid_password');
  }),
}));

// Mock the retry utility
jest.mock('../../src/utils/retry.util', () => ({
  retry: jest.fn().mockImplementation((fn) => fn()),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let loggerService: LoggerService;

  // Mock user data
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashed_password',
    roles: [
      { id: 'role-1', name: 'user', isDefault: true },
    ],
  };

  // Mock user creation data
  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'StrongP@ss123',
  };

  // Mock token
  const mockToken = 'mock.jwt.token';

  beforeEach(async () => {
    // Create mock implementations for all dependencies
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue(mockToken),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key) => {
        const config = {
          'authService.jwt.secret': 'test-secret',
          'authService.jwt.accessTokenExpiration': '3600s',
          'authService.jwt.audience': 'test-audience',
          'authService.jwt.issuer': 'test-issuer',
        };
        return config[key];
      }),
    };

    const mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    // Create a testing module with mocked dependencies
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    // Get service instances
    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    loggerService = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist yet
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Mock default roles
      (prismaService.role.findMany as jest.Mock).mockResolvedValueOnce([
        { id: 'role-1', name: 'user', isDefault: true },
      ]);
      
      // Mock user creation
      (prismaService.user.create as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the register method
      const result = await service.register(mockCreateUserDto);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
      expect(result).not.toHaveProperty('password'); // Password should be excluded
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          ...mockCreateUserDto,
          password: 'hashed_password', // From the bcrypt mock
        },
      });
      expect(loggerService.info).toHaveBeenCalledWith(
        'User registered successfully',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should throw an error if the email already exists', async () => {
      // Mock user already exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the register method and expect it to throw
      await expect(service.register(mockCreateUserDto)).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.register(mockCreateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS);
      }
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(loggerService.warn).toHaveBeenCalledWith(
        'User registration failed: Email already exists',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should handle unexpected errors during registration', async () => {
      // Mock user doesn't exist
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Mock an error during user creation
      const dbError = new Error('Database connection error');
      (prismaService.user.create as jest.Mock).mockRejectedValueOnce(dbError);
      
      // Call the register method and expect it to throw
      await expect(service.register(mockCreateUserDto)).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.register(mockCreateUserDto);
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe(AUTH_ERROR_CODES.REGISTRATION_FAILED);
        expect(error.cause).toBe(dbError);
      }
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockCreateUserDto.email },
      });
      expect(loggerService.error).toHaveBeenCalledWith(
        'User registration failed with unexpected error',
        expect.any(Object),
        'AuthService',
      );
    });
  });

  describe('login', () => {
    it('should authenticate a user with valid credentials', async () => {
      // Mock user exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the login method
      const result = await service.login('test@example.com', 'valid_password');
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password'); // Password should be excluded
      expect(result.accessToken).toBe(mockToken);
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { roles: true },
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        'User authenticated successfully',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should throw an error if the user does not exist', async () => {
      // Mock user doesn't exist
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the login method and expect it to throw
      await expect(service.login('nonexistent@example.com', 'any_password')).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.login('nonexistent@example.com', 'any_password');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        include: { roles: true },
      });
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed: User not found',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should throw an error if the password is invalid', async () => {
      // Mock user exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the login method with invalid password and expect it to throw
      await expect(service.login('test@example.com', 'invalid_password')).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.login('test@example.com', 'invalid_password');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { roles: true },
      });
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Authentication failed: Invalid password',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should handle unexpected errors during authentication', async () => {
      // Mock an error during user lookup
      const dbError = new Error('Database connection error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValueOnce(dbError);
      
      // Call the login method and expect it to throw
      await expect(service.login('test@example.com', 'valid_password')).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.login('test@example.com', 'valid_password');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe(AUTH_ERROR_CODES.AUTHENTICATION_FAILED);
        expect(error.cause).toBe(dbError);
      }
      
      // Verify that the necessary methods were called
      expect(loggerService.error).toHaveBeenCalledWith(
        'Authentication failed with unexpected error',
        expect.any(Object),
        'AuthService',
      );
    });
  });

  describe('validateToken', () => {
    it('should validate a token and return the user', async () => {
      // Mock payload
      const payload: TokenPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
      };
      
      // Mock user exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the validateToken method
      const result = await service.validateToken(payload);
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password'); // Password should be excluded
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        include: { roles: true },
      });
      expect(loggerService.debug).toHaveBeenCalledWith(
        'Validating token',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should return null if the payload is invalid', async () => {
      // Call the validateToken method with invalid payload
      const result = await service.validateToken(null);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify that the necessary methods were called
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Token validation failed: Invalid payload',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should return null if the user does not exist', async () => {
      // Mock payload
      const payload: TokenPayload = {
        sub: 'nonexistent-user',
        email: 'nonexistent@example.com',
        roles: ['user'],
      };
      
      // Mock user doesn't exist
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the validateToken method
      const result = await service.validateToken(payload);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: payload.sub },
        include: { roles: true },
      });
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Token validation failed: User not found',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should handle unexpected errors during token validation', async () => {
      // Mock payload
      const payload: TokenPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        roles: ['user'],
      };
      
      // Mock an error during user lookup
      const dbError = new Error('Database connection error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValueOnce(dbError);
      
      // Call the validateToken method
      const result = await service.validateToken(payload);
      
      // Verify the result
      expect(result).toBeNull();
      
      // Verify that the necessary methods were called
      expect(loggerService.error).toHaveBeenCalledWith(
        'Token validation failed with unexpected error',
        expect.any(Object),
        'AuthService',
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh a token successfully', async () => {
      // Mock user exists
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser);
      
      // Call the refreshToken method
      const result = await service.refreshToken('user-123');
      
      // Verify the result
      expect(result).toBeDefined();
      expect(result.accessToken).toBe(mockToken);
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { roles: true },
      });
      expect(jwtService.sign).toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        'Token refreshed successfully',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should throw an error if the user does not exist', async () => {
      // Mock user doesn't exist
      (prismaService.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      // Call the refreshToken method and expect it to throw
      await expect(service.refreshToken('nonexistent-user')).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.refreshToken('nonexistent-user');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.VALIDATION);
        expect(error.code).toBe(AUTH_ERROR_CODES.USER_NOT_FOUND);
      }
      
      // Verify that the necessary methods were called
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-user' },
        include: { roles: true },
      });
      expect(loggerService.warn).toHaveBeenCalledWith(
        'Token refresh failed: User not found',
        expect.any(Object),
        'AuthService',
      );
    });

    it('should handle unexpected errors during token refresh', async () => {
      // Mock an error during user lookup
      const dbError = new Error('Database connection error');
      (prismaService.user.findUnique as jest.Mock).mockRejectedValueOnce(dbError);
      
      // Call the refreshToken method and expect it to throw
      await expect(service.refreshToken('user-123')).rejects.toThrow(BaseError);
      
      // Verify that the error has the correct properties
      try {
        await service.refreshToken('user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe(AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED);
        expect(error.cause).toBe(dbError);
      }
      
      // Verify that the necessary methods were called
      expect(loggerService.error).toHaveBeenCalledWith(
        'Token refresh failed with unexpected error',
        expect.any(Object),
        'AuthService',
      );
    });
  });
});