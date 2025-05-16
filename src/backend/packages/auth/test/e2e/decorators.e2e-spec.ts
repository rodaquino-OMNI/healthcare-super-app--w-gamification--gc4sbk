/**
 * End-to-end tests for authentication decorators
 * 
 * Tests the CurrentUser and Roles decorators in real HTTP request scenarios
 * to ensure they correctly extract user information and handle role-based
 * access control in NestJS applications.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { Roles } from '../../src/decorators/roles.decorator';
import { RolesGuard } from '../../src/guards/roles.guard';
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { IUser } from '../../src/interfaces';
import { mockAuthenticatedRequest, mockUnauthenticatedRequest } from '../helpers/auth-request.helper';
import { generateTestToken, generateJourneyToken } from '../helpers/jwt-token.helper';
import { ErrorService } from '@austa/errors';

// Test controller for CurrentUser decorator
@Controller('test-current-user')
class CurrentUserTestController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: IUser) {
    return user;
  }

  @Get('user-id')
  @UseGuards(JwtAuthGuard)
  getUserId(@CurrentUser('id') userId: string) {
    return { userId };
  }

  @Get('email')
  @UseGuards(JwtAuthGuard)
  getEmail(@CurrentUser('email') email: string) {
    return { email };
  }

  @Get('roles')
  @UseGuards(JwtAuthGuard)
  getRoles(@CurrentUser('roles') roles: string[]) {
    return { roles };
  }

  @Get('journey-context')
  @UseGuards(JwtAuthGuard)
  getJourneyContext(@CurrentUser('journeyContext') journeyContext: any) {
    return { journeyContext };
  }
}

// Test controller for Roles decorator
@Controller('test-roles')
class RolesTestController {
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getAdminResource() {
    return { message: 'Admin resource accessed successfully' };
  }

  @Get('user-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('user')
  getUserResource() {
    return { message: 'User resource accessed successfully' };
  }

  @Get('multi-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'health:manager')
  getMultiRoleResource() {
    return { message: 'Multi-role resource accessed successfully' };
  }

  @Get('journey-specific')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('health:viewer')
  getJourneySpecificResource() {
    return { message: 'Journey-specific resource accessed successfully' };
  }

  @Get('public')
  getPublicResource() {
    return { message: 'Public resource accessed successfully' };
  }
}

describe('Auth Decorators (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let errorService: ErrorService;

  beforeAll(async () => {
    // Create a mock JWT service
    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    // Create a mock error service
    const mockErrorService = {
      createError: jest.fn().mockImplementation((type, message) => {
        const error = new Error(message);
        error.name = type;
        return error;
      }),
      handleError: jest.fn().mockImplementation((err) => {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: err.message,
          error: err.name,
        };
      }),
    };

    // Create a mock JWT auth guard
    const mockJwtAuthGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        if (!request.headers.authorization) {
          throw mockErrorService.createError('UnauthorizedException', 'Unauthorized');
        }
        return true;
      }),
    };

    // Create a mock roles guard
    const mockRolesGuard = {
      canActivate: jest.fn().mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const handler = context.getHandler();
        const roles = Reflect.getMetadata('roles', handler);

        if (!roles) {
          return true;
        }

        if (!user || !user.roles) {
          throw mockErrorService.createError('ForbiddenException', 'Forbidden resource');
        }

        const hasRole = () => user.roles.some((role: string) => roles.includes(role));
        if (!hasRole()) {
          throw mockErrorService.createError('ForbiddenException', 'Insufficient permissions');
        }

        return true;
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CurrentUserTestController, RolesTestController],
      providers: [
        { provide: JwtService, useValue: mockJwtService },
        { provide: ErrorService, useValue: mockErrorService },
        { provide: JwtAuthGuard, useValue: mockJwtAuthGuard },
        { provide: RolesGuard, useValue: mockRolesGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    errorService = moduleFixture.get<ErrorService>(ErrorService);

    // Configure global exception filters if needed
    // app.useGlobalFilters(new HttpExceptionFilter(errorService));

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CurrentUser Decorator', () => {
    it('should extract the entire user object', async () => {
      // Create a mock authenticated request
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the request object with user data
      const mockReq = mockAuthenticatedRequest({ user: mockUser });

      // Mock the JWT auth guard to set the user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockUser;
        return true;
      });

      // Test the endpoint
      const response = await request(app.getHttpServer())
        .get('/test-current-user/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response contains the user object
      expect(response.body).toEqual(mockUser);
    });

    it('should extract a specific property from the user object', async () => {
      // Create a mock authenticated request
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the JWT auth guard to set the user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockUser;
        return true;
      });

      // Test the endpoint for user ID
      const idResponse = await request(app.getHttpServer())
        .get('/test-current-user/user-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response contains the user ID
      expect(idResponse.body).toEqual({ userId: mockUser.id });

      // Test the endpoint for email
      const emailResponse = await request(app.getHttpServer())
        .get('/test-current-user/email')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response contains the email
      expect(emailResponse.body).toEqual({ email: mockUser.email });
    });

    it('should handle missing user context gracefully', async () => {
      // Mock the JWT auth guard to throw an unauthorized exception
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation(() => {
        throw errorService.createError('UnauthorizedException', 'Unauthorized');
      });

      // Test the endpoint without authentication
      await request(app.getHttpServer())
        .get('/test-current-user/profile')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should extract journey context from user object', async () => {
      // Create a mock authenticated request with journey context
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: ['user', 'health:viewer'],
        permissions: ['read:profile', 'read:health'],
        journeyContext: { currentJourney: 'health' },
      };

      // Mock the JWT auth guard to set the user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockUser;
        return true;
      });

      // Test the endpoint
      const response = await request(app.getHttpServer())
        .get('/test-current-user/journey-context')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response contains the journey context
      expect(response.body).toEqual({ journeyContext: mockUser.journeyContext });
    });
  });

  describe('Roles Decorator', () => {
    it('should allow access to admin-only resource for admin users', async () => {
      // Create a mock admin user
      const mockAdminUser = {
        id: 'admin-user-id',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['*'],
      };

      // Mock the JWT auth guard to set the admin user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockAdminUser;
        return true;
      });

      // Test the admin-only endpoint
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'Admin resource accessed successfully' });
    });

    it('should deny access to admin-only resource for non-admin users', async () => {
      // Create a mock regular user
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the JWT auth guard to set the regular user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockRegularUser;
        return true;
      });

      // Mock the roles guard to check roles and deny access
      jest.spyOn(app.get(RolesGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const handler = context.getHandler();
        const roles = Reflect.getMetadata('roles', handler);

        const hasRole = () => user.roles.some((role: string) => roles.includes(role));
        if (!hasRole()) {
          throw errorService.createError('ForbiddenException', 'Insufficient permissions');
        }

        return true;
      });

      // Test the admin-only endpoint with a regular user
      await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow access to user-only resource for users', async () => {
      // Create a mock regular user
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the JWT auth guard to set the regular user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockRegularUser;
        return true;
      });

      // Test the user-only endpoint
      const response = await request(app.getHttpServer())
        .get('/test-roles/user-only')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'User resource accessed successfully' });
    });

    it('should allow access to multi-role resource for users with any of the required roles', async () => {
      // Create a mock health manager user
      const mockHealthManagerUser = {
        id: 'health-manager-id',
        email: 'health-manager@example.com',
        roles: ['user', 'health:manager'],
        permissions: ['read:profile', 'manage:health'],
      };

      // Mock the JWT auth guard to set the health manager user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockHealthManagerUser;
        return true;
      });

      // Test the multi-role endpoint
      const response = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'Multi-role resource accessed successfully' });
    });

    it('should allow access to journey-specific resource for users with journey role', async () => {
      // Create a mock health viewer user
      const mockHealthViewerUser = {
        id: 'health-viewer-id',
        email: 'health-viewer@example.com',
        roles: ['user', 'health:viewer'],
        permissions: ['read:profile', 'read:health'],
        journeyContext: { currentJourney: 'health' },
      };

      // Mock the JWT auth guard to set the health viewer user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockHealthViewerUser;
        return true;
      });

      // Test the journey-specific endpoint
      const response = await request(app.getHttpServer())
        .get('/test-roles/journey-specific')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'Journey-specific resource accessed successfully' });
    });

    it('should deny access to journey-specific resource for users without journey role', async () => {
      // Create a mock regular user without journey role
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the JWT auth guard to set the regular user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockRegularUser;
        return true;
      });

      // Mock the roles guard to check roles and deny access
      jest.spyOn(app.get(RolesGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const handler = context.getHandler();
        const roles = Reflect.getMetadata('roles', handler);

        const hasRole = () => user.roles.some((role: string) => roles.includes(role));
        if (!hasRole()) {
          throw errorService.createError('ForbiddenException', 'Insufficient permissions');
        }

        return true;
      });

      // Test the journey-specific endpoint with a regular user
      await request(app.getHttpServer())
        .get('/test-roles/journey-specific')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should allow access to public resource for all users', async () => {
      // Test the public endpoint without authentication
      const response = await request(app.getHttpServer())
        .get('/test-roles/public')
        .expect(HttpStatus.OK);

      // Verify the response
      expect(response.body).toEqual({ message: 'Public resource accessed successfully' });
    });

    it('should handle unauthenticated requests properly', async () => {
      // Mock the JWT auth guard to throw an unauthorized exception
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation(() => {
        throw errorService.createError('UnauthorizedException', 'Unauthorized');
      });

      // Test the protected endpoint without authentication
      await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('Integration with Error Handling', () => {
    it('should return standardized error response for unauthorized access', async () => {
      // Mock the JWT auth guard to throw an unauthorized exception
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation(() => {
        throw errorService.createError('UnauthorizedException', 'Unauthorized');
      });

      // Test the protected endpoint without authentication
      const response = await request(app.getHttpServer())
        .get('/test-current-user/profile')
        .expect(HttpStatus.UNAUTHORIZED);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.UNAUTHORIZED);
      expect(response.body).toHaveProperty('message', 'Unauthorized');
      expect(response.body).toHaveProperty('error', 'UnauthorizedException');
    });

    it('should return standardized error response for insufficient permissions', async () => {
      // Create a mock regular user
      const mockRegularUser = {
        id: 'regular-user-id',
        email: 'user@example.com',
        roles: ['user'],
        permissions: ['read:profile'],
      };

      // Mock the JWT auth guard to set the regular user on the request
      jest.spyOn(app.get(JwtAuthGuard), 'canActivate').mockImplementation((context) => {
        const request = context.switchToHttp().getRequest();
        request.user = mockRegularUser;
        return true;
      });

      // Mock the roles guard to check roles and deny access
      jest.spyOn(app.get(RolesGuard), 'canActivate').mockImplementation(() => {
        throw errorService.createError('ForbiddenException', 'Insufficient permissions');
      });

      // Test the admin-only endpoint with a regular user
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', 'Bearer valid-token')
        .expect(HttpStatus.FORBIDDEN);

      // Verify the error response structure
      expect(response.body).toHaveProperty('statusCode', HttpStatus.FORBIDDEN);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
      expect(response.body).toHaveProperty('error', 'ForbiddenException');
    });
  });
});