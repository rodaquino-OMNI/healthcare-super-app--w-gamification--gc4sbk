/**
 * End-to-end tests for authentication guards
 * 
 * Tests the JwtAuthGuard and RolesGuard to ensure they correctly
 * restrict access based on authentication status and user roles.
 * Verifies proper error responses with standardized formats and
 * tests journey-specific permission validation.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';

// Import the guards being tested
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';

// Import decorators and interfaces
import { Roles } from '../../src/decorators/roles.decorator';
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { IUser, ITokenPayload, JourneyType } from '../../src/interfaces';

// Import error handling utilities
import { JourneyErrorFilter } from '@austa/errors';
import { ErrorCategory, ErrorCode } from '@austa/errors/journey';
import { LoggerService } from '@austa/logging';

/**
 * Test controller with endpoints protected by JwtAuthGuard
 */
@Controller('auth-test')
class AuthTestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  getProtected(@CurrentUser() user: IUser) {
    return {
      message: 'Protected route accessed successfully',
      userId: user.id
    };
  }

  @Get('user-data')
  @UseGuards(JwtAuthGuard)
  getUserData(@CurrentUser() user: IUser) {
    return user;
  }
}

/**
 * Test controller with endpoints protected by both JwtAuthGuard and RolesGuard
 */
@Controller('roles-test')
class RolesTestController {
  @Get('admin-only')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAdminOnly() {
    return { message: 'Admin-only route accessed successfully' };
  }

  @Get('user-only')
  @Roles('user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getUserOnly() {
    return { message: 'User-only route accessed successfully' };
  }

  @Get('multi-role')
  @Roles('admin', 'manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMultiRole() {
    return { message: 'Multi-role route accessed successfully' };
  }

  @Get('health-journey')
  @Roles('health:viewer')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getHealthJourney() {
    return { message: 'Health journey route accessed successfully' };
  }

  @Get('care-journey')
  @Roles('care:provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getCareJourney() {
    return { message: 'Care journey route accessed successfully' };
  }

  @Get('plan-journey')
  @Roles('plan:manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getPlanJourney() {
    return { message: 'Plan journey route accessed successfully' };
  }

  @Get('cross-journey')
  @Roles('health:admin', 'care:admin', 'plan:admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getCrossJourney() {
    return { message: 'Cross-journey route accessed successfully' };
  }

  @Get('super-admin')
  @Roles('regular-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getSuperAdmin() {
    return { message: 'Super admin access successful' };
  }
}

/**
 * Test controller with controller-level role requirements
 */
@Controller('controller-roles')
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
class ControllerRolesTestController {
  @Get('admin-method')
  getAdminMethod() {
    return { message: 'Controller-level admin route accessed successfully' };
  }

  @Get('override-method')
  @Roles('user')
  getUserMethod() {
    return { message: 'Method-level override accessed successfully' };
  }
}

describe('Authentication Guards (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  
  // Test users with different roles
  const adminUser: IUser = {
    id: 'admin-123',
    name: 'Admin User',
    email: 'admin@austa.health',
    roles: ['admin']
  };
  
  const regularUser: IUser = {
    id: 'user-123',
    name: 'Regular User',
    email: 'user@austa.health',
    roles: ['user']
  };
  
  const healthUser: IUser = {
    id: 'health-123',
    name: 'Health User',
    email: 'health@austa.health',
    roles: ['user', 'health:viewer']
  };
  
  const careUser: IUser = {
    id: 'care-123',
    name: 'Care User',
    email: 'care@austa.health',
    roles: ['user', 'care:provider']
  };
  
  const planUser: IUser = {
    id: 'plan-123',
    name: 'Plan User',
    email: 'plan@austa.health',
    roles: ['user', 'plan:manager']
  };
  
  const multiJourneyUser: IUser = {
    id: 'multi-123',
    name: 'Multi-Journey User',
    email: 'multi@austa.health',
    roles: ['user', 'health:admin', 'care:viewer']
  };
  
  const superAdminUser: IUser = {
    id: 'super-123',
    name: 'Super Admin User',
    email: 'super@austa.health',
    roles: ['super_admin']
  };
  
  beforeAll(async () => {
    // Create a mock logger service
    const mockLoggerService = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    };
    
    // Create a testing module with controllers and guards
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure environment variables for testing
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              jwt: {
                secret: 'test-secret',
                expiresIn: '1h',
                audience: 'test-audience',
                issuer: 'test-issuer'
              }
            },
            AUTH_BYPASS_ROLES_IN_DEV: false,
            NODE_ENV: 'test'
          })]
        }),
        // Configure JWT module for token generation and validation
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('auth.jwt.secret'),
            signOptions: {
              expiresIn: configService.get<string>('auth.jwt.expiresIn'),
              audience: configService.get<string>('auth.jwt.audience'),
              issuer: configService.get<string>('auth.jwt.issuer')
            }
          })
        })
      ],
      controllers: [AuthTestController, RolesTestController, ControllerRolesTestController],
      providers: [
        {
          provide: LoggerService,
          useValue: mockLoggerService
        },
        JwtAuthGuard,
        RolesGuard
      ]
    }).compile();
    
    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    
    // Apply global error filter for standardized error responses
    app.useGlobalFilters(new JourneyErrorFilter());
    
    // Get the JWT service for creating test tokens
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  // Helper function to generate a JWT token for a user
  const generateToken = (user: IUser): string => {
    const payload: ITokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iss: configService.get<string>('auth.jwt.issuer'),
      aud: configService.get<string>('auth.jwt.audience')
    };
    
    return jwtService.sign(payload);
  };
  
  describe('JwtAuthGuard', () => {
    it('should allow access to protected route with valid JWT token', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Protected route accessed successfully');
          expect(res.body).toHaveProperty('userId', regularUser.id);
        });
    });
    
    it('should extract user data correctly from JWT token', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/auth-test/user-data')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', regularUser.id);
          expect(res.body).toHaveProperty('email', regularUser.email);
          expect(res.body).toHaveProperty('name', regularUser.name);
          expect(res.body).toHaveProperty('roles');
          expect(res.body.roles).toEqual(expect.arrayContaining(regularUser.roles));
        });
    });
    
    it('should reject access to protected route with invalid JWT token', async () => {
      return request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'AUTH_INVALID_TOKEN');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHENTICATION);
        });
    });
    
    it('should reject access to protected route with missing JWT token', async () => {
      return request(app.getHttpServer())
        .get('/auth-test/protected')
        .expect(401)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'AUTH_UNAUTHORIZED');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHENTICATION);
        });
    });
    
    it('should reject access to protected route with expired JWT token', async () => {
      // Create a payload with an expiration time in the past
      const payload: ITokenPayload = {
        sub: regularUser.id,
        email: regularUser.email,
        name: regularUser.name,
        roles: regularUser.roles,
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iss: configService.get<string>('auth.jwt.issuer'),
        aud: configService.get<string>('auth.jwt.audience')
      };
      
      const expiredToken = jwtService.sign(payload);
      
      return request(app.getHttpServer())
        .get('/auth-test/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'AUTH_INVALID_TOKEN');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHENTICATION);
        });
    });
  });
  
  describe('RolesGuard', () => {
    it('should allow access to admin-only route with admin role', async () => {
      const token = generateToken(adminUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Admin-only route accessed successfully');
        });
    });
    
    it('should deny access to admin-only route without admin role', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHORIZATION);
          expect(res.body.error).toHaveProperty('details');
          expect(res.body.error.details).toHaveProperty('requiredRoles', ['admin']);
        });
    });
    
    it('should allow access to user-only route with user role', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/user-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'User-only route accessed successfully');
        });
    });
    
    it('should allow access to multi-role route with any of the required roles', async () => {
      // Test with admin role
      const adminToken = generateToken(adminUser);
      
      await request(app.getHttpServer())
        .get('/roles-test/multi-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Multi-role route accessed successfully');
        });
      
      // Create a manager user
      const managerUser: IUser = {
        id: 'manager-123',
        name: 'Manager User',
        email: 'manager@austa.health',
        roles: ['manager']
      };
      
      const managerToken = generateToken(managerUser);
      
      // Test with manager role
      return request(app.getHttpServer())
        .get('/roles-test/multi-role')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Multi-role route accessed successfully');
        });
    });
    
    it('should deny access to multi-role route without any of the required roles', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/multi-role')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHORIZATION);
          expect(res.body.error.details).toHaveProperty('requiredRoles', ['admin', 'manager']);
          expect(res.body.error.details).toHaveProperty('userRoles', regularUser.roles);
        });
    });
  });
  
  describe('Journey-Specific Roles', () => {
    it('should allow access to health journey route with health:viewer role', async () => {
      const token = generateToken(healthUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/health-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Health journey route accessed successfully');
        });
    });
    
    it('should allow access to care journey route with care:provider role', async () => {
      const token = generateToken(careUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/care-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Care journey route accessed successfully');
        });
    });
    
    it('should allow access to plan journey route with plan:manager role', async () => {
      const token = generateToken(planUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/plan-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Plan journey route accessed successfully');
        });
    });
    
    it('should deny access to journey-specific route without the required journey role', async () => {
      // Health user trying to access care journey
      const token = generateToken(healthUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/care-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHORIZATION);
          expect(res.body.error.details).toHaveProperty('requiredRoles', ['care:provider']);
          expect(res.body.error.details).toHaveProperty('userRoles', healthUser.roles);
        });
    });
    
    it('should allow access to cross-journey route with any of the required journey admin roles', async () => {
      const token = generateToken(multiJourneyUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/cross-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Cross-journey route accessed successfully');
        });
    });
    
    it('should allow super_admin access to any route regardless of required roles', async () => {
      const token = generateToken(superAdminUser);
      
      // Super admin should have access to all routes
      await request(app.getHttpServer())
        .get('/roles-test/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      await request(app.getHttpServer())
        .get('/roles-test/health-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      await request(app.getHttpServer())
        .get('/roles-test/care-journey')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
        
      return request(app.getHttpServer())
        .get('/roles-test/super-admin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Super admin access successful');
        });
    });
  });
  
  describe('Controller-Level Roles', () => {
    it('should apply controller-level role requirements', async () => {
      const adminToken = generateToken(adminUser);
      const regularToken = generateToken(regularUser);
      
      // Admin should have access
      await request(app.getHttpServer())
        .get('/controller-roles/admin-method')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Controller-level admin route accessed successfully');
        });
      
      // Regular user should not have access
      return request(app.getHttpServer())
        .get('/controller-roles/admin-method')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
        });
    });
    
    it('should allow method-level role requirements to override controller-level requirements', async () => {
      const regularToken = generateToken(regularUser);
      
      // Regular user should have access to the method with overridden roles
      return request(app.getHttpServer())
        .get('/controller-roles/override-method')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Method-level override accessed successfully');
        });
    });
  });
  
  describe('Error Handling', () => {
    it('should return standardized error responses for authentication failures', async () => {
      return request(app.getHttpServer())
        .get('/auth-test/protected')
        .expect(401)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHENTICATION);
          expect(res.body.error).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('statusCode', 401);
        });
    });
    
    it('should return standardized error responses for authorization failures', async () => {
      const token = generateToken(regularUser);
      
      return request(app.getHttpServer())
        .get('/roles-test/admin-only')
        .set('Authorization', `Bearer ${token}`)
        .expect(403)
        .expect((res) => {
          // Verify the error response format matches the standardized error structure
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toHaveProperty('code', 'INSUFFICIENT_PERMISSIONS');
          expect(res.body.error).toHaveProperty('message');
          expect(res.body.error).toHaveProperty('category', ErrorCategory.AUTHORIZATION);
          expect(res.body.error).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('statusCode', 403);
          
          // Verify detailed error information
          expect(res.body.error).toHaveProperty('details');
          expect(res.body.error.details).toHaveProperty('requiredRoles');
          expect(res.body.error.details).toHaveProperty('userRoles');
          expect(res.body.error.details).toHaveProperty('resource');
        });
    });
  });
});