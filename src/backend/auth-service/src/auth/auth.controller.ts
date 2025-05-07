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
import { AuthService } from '@app/auth/auth.service';
import { CreateUserDto } from '@app/auth/users/dto/create-user.dto';
import { LocalAuthGuard } from '@app/auth/guards/local-auth.guard';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';

// Import DTOs for request/response validation
import { RefreshTokenDto } from '@app/auth/dto/refresh-token.dto';

// Integration with @austa/interfaces for shared user profile and token schemas
import { LoginResponseDto, RegisterResponseDto, TokenPair } from '@austa/interfaces/auth';

/**
 * Controller for authentication operations including registration, login,
 * token refresh, logout, and profile retrieval.
 */
@Controller('auth')
@UseFilters(new AllExceptionsFilter())
export class AuthController {
  /**
   * Initializes the AuthController.
   * @param authService Service for authentication operations
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user and returns authentication tokens.
   * @param createUserDto Data for creating a new user
   * @returns The newly created user and authentication tokens
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto): Promise<RegisterResponseDto> {
    return this.authService.register(createUserDto);
  }

  /**
   * Authenticates a user and returns authentication tokens.
   * Uses LocalAuthGuard to validate credentials.
   * @param req Request object containing email and password
   * @returns Authentication tokens and user data
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req): Promise<LoginResponseDto> {
    return this.authService.login(req.body.email, req.body.password);
  }

  /**
   * Refreshes an access token using a refresh token.
   * @param refreshTokenDto DTO containing the refresh token
   * @returns New access and refresh tokens
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  /**
   * Logs out a user by blacklisting their tokens.
   * @param authorization Authorization header containing the access token
   * @param refreshTokenDto DTO containing the refresh token (optional)
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Headers('authorization') authorization: string,
    @Body() refreshTokenDto?: RefreshTokenDto,
  ): Promise<void> {
    // Extract the token from the Authorization header
    const accessToken = authorization?.split(' ')[1];
    if (!accessToken) {
      return;
    }
    
    // Logout with both access and refresh tokens
    await this.authService.logout(
      accessToken,
      refreshTokenDto?.refreshToken,
    );
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   * Uses JwtAuthGuard to ensure the request is authenticated.
   * @param user Current authenticated user
   * @returns User profile data
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@CurrentUser() user): any {
    return user;
  }
}