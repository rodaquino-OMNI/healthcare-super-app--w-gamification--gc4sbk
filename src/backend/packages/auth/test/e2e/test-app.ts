import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Controller, Get, Post, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../src/guards/local-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';
import { Roles } from '../../src/decorators/roles.decorator';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { IUser } from '../../src/interfaces';

/**
 * Options for creating a test application
 */
interface TestAppOptions {
  /**
   * Mock user for authentication
   */
  user?: IUser;
  
  /**
   * Whether to include test controllers
   */
  controllers?: boolean;
}

/**
 * Creates a test controller for authentication strategy testing
 * @param mockUser The mock user to use for authentication
 * @returns A test controller class
 */
function createTestController(mockUser: IUser) {
  @Controller()
  class TestController {
    constructor(private jwtService: JwtService) {}

    @UseGuards(JwtAuthGuard)
    @Get('protected')
    getProtected(@CurrentUser() user: IUser) {
      return {
        userId: user.id,
        message: 'Protected route accessed successfully'
      };
    }

    @UseGuards(JwtAuthGuard)
    @Get('user-info')
    getUserInfo(@CurrentUser() user: IUser) {
      return user;
    }

    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
      // Generate tokens for the authenticated user
      const payload = {
        sub: req.user.id,
        email: req.user.email,
        roles: req.user.roles
      };
      
      return {
        user: req.user,
        access_token: this.jwtService.sign(payload),
        refresh_token: this.jwtService.sign({ ...payload, type: 'refresh' }, { expiresIn: '7d' })
      };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('user')
    @Get('admin')
    getAdmin() {
      return { message: 'Admin route accessed successfully' };
    }

    @UseGuards(JwtAuthGuard)
    @Get('health-journey')
    getHealthJourney(@CurrentUser() user: IUser) {
      // Check if user has health journey preference
      if (user.journeyPreferences?.defaultJourney !== 'health') {
        throw new Error('User does not have access to health journey');
      }
      
      return { message: 'Health journey accessed successfully' };
    }

    @Post('refresh-token')
    async refreshToken(@Body() body: { refresh_token: string }) {
      try {
        // Verify the refresh token
        const payload = this.jwtService.verify(body.refresh_token);
        
        // Check if it's a refresh token
        if (payload.type !== 'refresh') {
          throw new Error('Invalid token type');
        }
        
        // Generate a new access token
        const newPayload = {
          sub: payload.sub,
          email: payload.email,
          roles: payload.roles
        };
        
        return {
          access_token: this.jwtService.sign(newPayload)
        };
      } catch (error) {
        throw new Error('Invalid refresh token');
      }
    }

    // OAuth routes
    @Get('auth/google')
    googleAuth() {
      // In a real app, this would redirect to Google
      // For testing, we'll just return a mock response
      return { redirectUrl: 'https://accounts.google.com/o/oauth2/auth' };
    }

    @Get('auth/google/callback')
    googleAuthCallback() {
      // In a real app, this would process the OAuth callback
      // For testing, we'll just return a mock response with the user and token
      const payload = {
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles
      };
      
      return {
        user: mockUser,
        access_token: this.jwtService.sign(payload)
      };
    }
  }

  return TestController;
}

/**
 * Creates a test application for authentication e2e tests
 * @param moduleFixture The testing module fixture
 * @param options Options for creating the test application
 * @returns A configured NestJS application for testing
 */
export async function createTestApp(
  moduleFixture: TestingModule,
  options: TestAppOptions = {}
): Promise<INestApplication> {
  const { user, controllers = false } = options;
  
  // If controllers are enabled and a user is provided, create a test controller
  if (controllers && user) {
    const TestController = createTestController(user);
    moduleFixture.createNestApplication().get('ControllerTokens', []).push(TestController);
  }
  
  // Create and configure the application
  const app = moduleFixture.createNestApplication();
  
  // Apply global pipes and filters
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true
  }));
  
  // Add global exception filter for standardized error responses
  app.useGlobalFilters({
    catch: (exception, host) => {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
      const status = exception.status || 500;
      
      response.status(status).json({
        statusCode: status,
        message: exception.message || 'Internal server error',
        error: exception.name || 'Error',
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return app;
}