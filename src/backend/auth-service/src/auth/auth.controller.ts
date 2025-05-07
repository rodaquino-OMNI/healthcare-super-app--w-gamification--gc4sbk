import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Get, 
  UseFilters,
  HttpCode,
  HttpStatus,
  Headers
} from '@nestjs/common';

// Use standardized TypeScript path aliases for consistent imports
import { AuthService } from '@app/auth/auth/auth.service';
import { CreateUserDto } from '@app/auth/users/dto/create-user.dto';
import { LocalAuthGuard } from '@app/auth/auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@app/auth/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/auth/auth/decorators/current-user.decorator';
import { AppExceptionFilter } from '@app/shared/exceptions/exception.filter';
import { LoggerService } from '@app/shared/logging/logger.service';

// Integration with @austa/interfaces for shared user profile and token schemas
import { 
  LoginRequestDto, 
  RegisterRequestDto, 
  RefreshTokenRequestDto,
  LoginResponseDto,
  RegisterResponseDto,
  TokenValidationResponseDto,
  UserResponseDto,
  TokenPair
} from '@austa/interfaces/auth';

/**
 * Controller class for handling authentication-related requests.
 * Provides endpoints for user registration, login, token refresh, and profile retrieval.
 */
@Controller('auth')
@UseFilters(AppExceptionFilter)
export class AuthController {
  /**
   * Initializes the AuthController.
   * @param authService Service for authentication operations
   * @param logger Logger service for structured logging
   */
  constructor(
    private readonly authService: AuthService,
    private readonly logger: LoggerService
  ) {
    this.logger.setContext('AuthController');
  }

  /**
   * Registers a new user.
   * @param registerDto Data transfer object containing user registration information
   * @returns The newly created user and authentication tokens
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterRequestDto): Promise<RegisterResponseDto> {
    this.logger.debug(`Registration request received for email: ${registerDto.email}`);
    return this.authService.register(registerDto);
  }

  /**
   * Logs in an existing user and returns authentication tokens.
   * Uses the LocalAuthGuard to authenticate the user credentials and
   * then generates JWT tokens using the AuthService.
   * 
   * @param loginDto Data transfer object containing login credentials
   * @returns Authentication tokens and user data
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginRequestDto): Promise<LoginResponseDto> {
    this.logger.debug(`Login request received for email: ${loginDto.email}`);
    return this.authService.login(loginDto.email, loginDto.password);
  }

  /**
   * Refreshes an access token using a refresh token.
   * Implements secure token rotation to prevent token reuse attacks.
   * 
   * @param refreshTokenDto Data transfer object containing the refresh token
   * @returns New access and refresh tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenRequestDto): Promise<TokenPair> {
    this.logger.debug('Token refresh request received');
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Logs out a user by blacklisting their tokens.
   * Invalidates both access and refresh tokens to prevent unauthorized use.
   * 
   * @param request HTTP request containing the authorization header
   * @param refreshTokenDto Optional refresh token to invalidate
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Headers('authorization') authorization: string,
    @Body() refreshTokenDto?: RefreshTokenRequestDto
  ): Promise<void> {
    this.logger.debug('Logout request received');
    
    // Extract the access token from the Authorization header
    const accessToken = authorization?.split(' ')[1];
    
    // Get the refresh token from the request body if provided
    const refreshToken = refreshTokenDto?.refreshToken;
    
    return this.authService.logout(accessToken, refreshToken);
  }

  /**
   * Validates a token and returns its status.
   * Checks if the token is valid, not expired, and not blacklisted.
   * 
   * @param request HTTP request containing the authorization header
   * @returns Token validation status
   */
  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@Headers('authorization') authorization: string): Promise<TokenValidationResponseDto> {
    this.logger.debug('Token validation request received');
    
    // Extract the access token from the Authorization header
    const accessToken = authorization?.split(' ')[1];
    
    // The JwtAuthGuard already validated the token, so we just need to return success
    return { valid: true, message: 'Token is valid' };
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   * Uses the JwtAuthGuard to ensure the request is authenticated.
   * 
   * @param user The authenticated user from the JWT token
   * @returns The user profile
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@CurrentUser() user): UserResponseDto {
    this.logger.debug(`Profile request received for user: ${user.id}`);
    return user;
  }
}