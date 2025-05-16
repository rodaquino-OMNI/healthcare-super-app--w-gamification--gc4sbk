import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { BaseError, ErrorType, JourneyErrorType } from '@austa/errors';
import { compare, hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { TokenPayload } from './types';
import { AUTH_ERROR_CODES, JWT_EXPIRATION_DEFAULT } from './constants';
import { retry } from './utils/retry.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Register a new user with the provided credentials
   * @param createUserDto User creation data
   * @returns The created user object (without password)
   */
  async register(createUserDto: CreateUserDto) {
    try {
      this.loggerService.debug(
        'Attempting to register new user',
        { email: createUserDto.email },
        'AuthService',
      );

      // Check if user already exists
      const existingUser = await this.prismaService.user.findUnique({
        where: { email: createUserDto.email },
      });

      if (existingUser) {
        this.loggerService.warn(
          'User registration failed: Email already exists',
          { email: createUserDto.email },
          'AuthService',
        );
        throw new BaseError({
          type: ErrorType.VALIDATION,
          code: AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS,
          message: 'Email already exists',
          context: { email: createUserDto.email },
        });
      }

      // Hash password
      const hashedPassword = await hash(createUserDto.password, 10);

      // Create user with transaction to ensure atomicity
      const user = await this.prismaService.$transaction(async (prisma) => {
        // Create the user
        const newUser = await prisma.user.create({
          data: {
            ...createUserDto,
            password: hashedPassword,
          },
        });

        // Assign default roles if needed
        const defaultRoles = await prisma.role.findMany({
          where: { isDefault: true },
        });

        if (defaultRoles.length > 0) {
          await prisma.user.update({
            where: { id: newUser.id },
            data: {
              roles: {
                connect: defaultRoles.map((role) => ({ id: role.id })),
              },
            },
            include: { roles: true },
          });
        }

        return newUser;
      });

      this.loggerService.info(
        'User registered successfully',
        { userId: user.id },
        'AuthService',
      );

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // If it's already a BaseError, rethrow it
      if (error instanceof BaseError) {
        throw error;
      }

      // Otherwise, wrap in a BaseError
      this.loggerService.error(
        'User registration failed with unexpected error',
        { error: error.message, stack: error.stack },
        'AuthService',
      );
      throw new BaseError({
        type: ErrorType.TECHNICAL,
        code: AUTH_ERROR_CODES.REGISTRATION_FAILED,
        message: 'Failed to register user',
        cause: error,
      });
    }
  }

  /**
   * Authenticate a user with email and password
   * @param email User email
   * @param password User password
   * @returns Authenticated user (without password) and access token
   */
  async login(email: string, password: string) {
    try {
      this.loggerService.debug(
        'Attempting to authenticate user',
        { email },
        'AuthService',
      );

      // Find user by email with retry for transient database errors
      const user = await retry(
        () =>
          this.prismaService.user.findUnique({
            where: { email },
            include: { roles: true },
          }),
        {
          retries: 3,
          delay: 300,
          factor: 2,
          loggerService: this.loggerService,
          context: 'AuthService.login',
        },
      );

      // Check if user exists
      if (!user) {
        this.loggerService.warn(
          'Authentication failed: User not found',
          { email },
          'AuthService',
        );
        throw new BaseError({
          type: ErrorType.VALIDATION,
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isPasswordValid = await compare(password, user.password);
      if (!isPasswordValid) {
        this.loggerService.warn(
          'Authentication failed: Invalid password',
          { userId: user.id },
          'AuthService',
        );
        throw new BaseError({
          type: ErrorType.VALIDATION,
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Invalid credentials',
        });
      }

      // Generate JWT token
      const token = await this.generateToken(user.id, user.roles);

      this.loggerService.info(
        'User authenticated successfully',
        { userId: user.id },
        'AuthService',
      );

      // Return user without password and token
      const { password: _, ...userWithoutPassword } = user;
      return {
        user: userWithoutPassword,
        accessToken: token,
      };
    } catch (error) {
      // If it's already a BaseError, rethrow it
      if (error instanceof BaseError) {
        throw error;
      }

      // Otherwise, wrap in a BaseError
      this.loggerService.error(
        'Authentication failed with unexpected error',
        { error: error.message, stack: error.stack },
        'AuthService',
      );
      throw new BaseError({
        type: ErrorType.TECHNICAL,
        code: AUTH_ERROR_CODES.AUTHENTICATION_FAILED,
        message: 'Failed to authenticate user',
        cause: error,
      });
    }
  }

  /**
   * Generate a JWT token for the authenticated user
   * @param userId User ID
   * @param roles User roles
   * @returns JWT token
   */
  private async generateToken(userId: string, roles: any[] = []) {
    try {
      const payload: TokenPayload = {
        sub: userId,
        roles: roles.map((role) => role.name),
        iat: Math.floor(Date.now() / 1000),
      };

      // Get JWT configuration from environment
      const secret = this.configService.get<string>('authService.jwt.secret');
      const expiresIn =
        this.configService.get<string>('authService.jwt.accessTokenExpiration') ||
        JWT_EXPIRATION_DEFAULT;

      // Sign token with improved security options
      return this.jwtService.sign(payload, {
        secret,
        expiresIn,
        audience: this.configService.get<string>('authService.jwt.audience'),
        issuer: this.configService.get<string>('authService.jwt.issuer'),
      });
    } catch (error) {
      this.loggerService.error(
        'Failed to generate token',
        { userId, error: error.message },
        'AuthService',
      );
      throw new BaseError({
        type: ErrorType.TECHNICAL,
        code: AUTH_ERROR_CODES.TOKEN_GENERATION_FAILED,
        message: 'Failed to generate authentication token',
        cause: error,
      });
    }
  }

  /**
   * Validate a JWT token payload
   * @param payload Token payload
   * @returns User object if token is valid
   */
  async validateToken(payload: TokenPayload) {
    try {
      this.loggerService.debug(
        'Validating token',
        { sub: payload.sub },
        'AuthService',
      );

      if (!payload || !payload.sub) {
        this.loggerService.warn(
          'Token validation failed: Invalid payload',
          { payload },
          'AuthService',
        );
        return null;
      }

      // Find user by ID with retry for transient database errors
      const user = await retry(
        () =>
          this.prismaService.user.findUnique({
            where: { id: payload.sub },
            include: { roles: true },
          }),
        {
          retries: 3,
          delay: 300,
          factor: 2,
          loggerService: this.loggerService,
          context: 'AuthService.validateToken',
        },
      );

      if (!user) {
        this.loggerService.warn(
          'Token validation failed: User not found',
          { sub: payload.sub },
          'AuthService',
        );
        return null;
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.loggerService.error(
        'Token validation failed with unexpected error',
        { error: error.message, stack: error.stack },
        'AuthService',
      );
      return null;
    }
  }

  /**
   * Refresh an existing JWT token
   * @param userId User ID
   * @returns New JWT token
   */
  async refreshToken(userId: string) {
    try {
      this.loggerService.debug(
        'Refreshing token',
        { userId },
        'AuthService',
      );

      // Find user by ID with roles
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: { roles: true },
      });

      if (!user) {
        this.loggerService.warn(
          'Token refresh failed: User not found',
          { userId },
          'AuthService',
        );
        throw new BaseError({
          type: ErrorType.VALIDATION,
          code: AUTH_ERROR_CODES.USER_NOT_FOUND,
          message: 'User not found',
        });
      }

      // Generate new token
      const token = await this.generateToken(user.id, user.roles);

      this.loggerService.info(
        'Token refreshed successfully',
        { userId },
        'AuthService',
      );

      return { accessToken: token };
    } catch (error) {
      // If it's already a BaseError, rethrow it
      if (error instanceof BaseError) {
        throw error;
      }

      // Otherwise, wrap in a BaseError
      this.loggerService.error(
        'Token refresh failed with unexpected error',
        { userId, error: error.message, stack: error.stack },
        'AuthService',
      );
      throw new BaseError({
        type: ErrorType.TECHNICAL,
        code: AUTH_ERROR_CODES.TOKEN_REFRESH_FAILED,
        message: 'Failed to refresh token',
        cause: error,
      });
    }
  }
}