/**
 * End-to-end tests for authentication decorators
 * 
 * Tests the CurrentUser and Roles decorators to ensure they correctly
 * extract user information and apply role-based access control in
 * real HTTP request scenarios.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Controller, Get, UseGuards, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

// Import the decorators being tested
import { CurrentUser } from '../../src/decorators/current-user.decorator';
import { Roles, ROLES_KEY } from '../../src/decorators/roles.decorator';

// Import necessary guards and services
import { JwtAuthGuard } from '../../src/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/guards/roles.guard';

// Import error handling utilities
import { JourneyErrorFilter } from '@austa/errors';
import { ErrorCategory, ErrorCode } from '@austa/errors/journey';

/**
 * Test controller with endpoints that use the CurrentUser decorator
 */
@Controller('test-current-user')
class CurrentUserTestController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return user;
  }

  @Get('user-id')
  @UseGuards(JwtAuthGuard)
  getUserId(@CurrentUser('id') userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return { userId };
  }

  @Get('username')
  @UseGuards(JwtAuthGuard)
  getUsername(@CurrentUser('username') username: string) {
    if (!username) {
      throw new UnauthorizedException('Username not found in request');
    }
    return { username };
  }

  @Get('unprotected')
  getUnprotected(@CurrentUser() user: any) {
    // This endpoint doesn't use JwtAuthGuard, so user should be undefined
    return { hasUser: !!user };
  }
}

/**
 * Test controller with endpoints that use the Roles decorator
 */
@Controller('test-roles')
class RolesTestController {
  @Get('admin-only')
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getAdminResource() {
    return { message: 'Admin resource accessed successfully' };
  }

  @Get('health-manager')
  @Roles('health:manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getHealthManagerResource() {
    return { message: 'Health manager resource accessed successfully' };
  }

  @Get('multi-role')
  @Roles('admin', 'care:provider')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getMultiRoleResource() {
    return { message: 'Multi-role resource accessed successfully' };
  }

  @Get('metadata')
  getMetadata() {
    // This endpoint returns the metadata set by the Roles decorator
    // for testing purposes only
    const metadata = Reflect.getMetadata(ROLES_KEY, RolesTestController.prototype.getAdminResource);
    return { metadata };
  }
}

/**
 * Mock implementation of JwtAuthGuard for testing
 */
class MockJwtAuthGuard {
  canActivate(context: any) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }
    
    const token = authHeader.split(' ')[1];
    try {
      // Decode the token and attach the user to the request
      const jwtService = new JwtService();
      const payload = jwtService.decode(token);
      request.user = payload;
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Mock implementation of RolesGuard for testing
 */
class MockRolesGuard {
  canActivate(context: any) {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.roles || !Array.isArray(user.roles)) {
      return false;
    }
    
    const handler = context.getHandler();
    const requiredRoles = Reflect.getMetadata(ROLES_KEY, handler) || [];
    
    if (requiredRoles.length === 0) {
      return true; // No roles required
    }
    
    // Check if the user has any of the required roles
    return requiredRoles.some(role => user.roles.includes(role));
  }
}

describe('Authentication Decorators (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  
  beforeAll(async () => {
    // Create a testing module with our test controllers and mocked guards
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CurrentUserTestController, RolesTestController],
      providers: [
        JwtService,
        {
          provide: JwtAuthGuard,
          useClass: MockJwtAuthGuard,
        },
        {
          provide: RolesGuard,
          useClass: MockRolesGuard,
        },
      ],
    }).compile();
    
    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    
    // Apply global error filter for standardized error responses
    app.useGlobalFilters(new JourneyErrorFilter());
    
    // Get the JWT service for creating test tokens
    jwtService = moduleFixture.get<JwtService>(JwtService);
    
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('CurrentUser Decorator', () => {
    // Create a test token with user information
    const testUser = {
      id: '123456',
      username: 'testuser',
      email: 'test@example.com',
      roles: ['user'],
    };
    
    const testToken = 'mock_token.' + Buffer.from(JSON.stringify(testUser)).toString('base64') + '.signature';
    
    it('should extract the entire user object from the request', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-current-user/profile')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      expect(response.body).toEqual(testUser);
    });
    
    it('should extract a specific property from the user object', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-current-user/user-id')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ userId: testUser.id });
    });
    
    it('should extract the username from the user object', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-current-user/username')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ username: testUser.username });
    });
    
    it('should return 401 when accessing a protected route without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-current-user/profile')
        .expect(401);
      
      // Verify the error response format matches the standardized error structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.category).toBe(ErrorCategory.AUTHENTICATION);
    });
    
    it('should not extract user data on unprotected routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-current-user/unprotected')
        .expect(200);
      
      expect(response.body).toEqual({ hasUser: false });
    });
  });
  
  describe('Roles Decorator', () => {
    // Create test tokens with different roles
    const adminUser = {
      id: 'admin123',
      username: 'admin',
      roles: ['admin'],
    };
    
    const healthManagerUser = {
      id: 'health123',
      username: 'healthmanager',
      roles: ['health:manager'],
    };
    
    const regularUser = {
      id: 'user123',
      username: 'regularuser',
      roles: ['user'],
    };
    
    const multiRoleUser = {
      id: 'multi123',
      username: 'multirole',
      roles: ['user', 'care:provider'],
    };
    
    const adminToken = 'mock_token.' + Buffer.from(JSON.stringify(adminUser)).toString('base64') + '.signature';
    const healthManagerToken = 'mock_token.' + Buffer.from(JSON.stringify(healthManagerUser)).toString('base64') + '.signature';
    const regularUserToken = 'mock_token.' + Buffer.from(JSON.stringify(regularUser)).toString('base64') + '.signature';
    const multiRoleToken = 'mock_token.' + Buffer.from(JSON.stringify(multiRoleUser)).toString('base64') + '.signature';
    
    it('should allow access to admin-only route with admin role', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ message: 'Admin resource accessed successfully' });
    });
    
    it('should deny access to admin-only route without admin role', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-roles/admin-only')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
      
      // Verify the error response format matches the standardized error structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error.category).toBe(ErrorCategory.AUTHORIZATION);
    });
    
    it('should allow access to health manager route with health:manager role', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-roles/health-manager')
        .set('Authorization', `Bearer ${healthManagerToken}`)
        .expect(200);
      
      expect(response.body).toEqual({ message: 'Health manager resource accessed successfully' });
    });
    
    it('should allow access to multi-role route with any of the required roles', async () => {
      // Test with admin role
      const adminResponse = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(adminResponse.body).toEqual({ message: 'Multi-role resource accessed successfully' });
      
      // Test with care:provider role
      const providerResponse = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', `Bearer ${multiRoleToken}`)
        .expect(200);
      
      expect(providerResponse.body).toEqual({ message: 'Multi-role resource accessed successfully' });
    });
    
    it('should deny access to multi-role route without any of the required roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-roles/multi-role')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
      
      // Verify the error response format matches the standardized error structure
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.category).toBe(ErrorCategory.AUTHORIZATION);
    });
    
    it('should correctly attach role metadata to route handlers', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-roles/metadata')
        .expect(200);
      
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toEqual(['admin']);
    });
  });
});