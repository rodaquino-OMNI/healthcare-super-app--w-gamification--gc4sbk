import { Controller, ExecutionContext, Get, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import * as request from 'supertest';

// Import from the new package structure using path aliases
import { InsufficientPermissionsError } from '@austa/errors';
import { Roles, ROLES_KEY } from '@austa/auth';
import { RolesGuard } from '@austa/auth';

// Import test helpers
import {
  createTestUser,
  createTestAdminUser,
  createTestHealthUser,
  createTestCareUser,
  createTestPlanUser,
  TEST_ROLES,
  createAuthenticatedRequest,
} from './test-helpers';

// Test controller with various role-protected endpoints
@Controller('test')
class TestController {
  @Get('public')
  public getPublic() {
    return { message: 'This is public' };
  }

  @Roles('admin')
  @Get('admin-only')
  public getAdminOnly() {
    return { message: 'Admin only' };
  }

  @Roles('user')
  @Get('user-only')
  public getUserOnly() {
    return { message: 'User only' };
  }

  @Roles('admin', 'user')
  @Get('admin-or-user')
  public getAdminOrUser() {
    return { message: 'Admin or user' };
  }

  // Journey-specific role endpoints
  @Roles('health:admin')
  @Get('health-admin')
  public getHealthAdmin() {
    return { message: 'Health admin only' };
  }

  @Roles('health:user')
  @Get('health-user')
  public getHealthUser() {
    return { message: 'Health user only' };
  }

  @Roles('care:provider')
  @Get('care-provider')
  public getCareProvider() {
    return { message: 'Care provider only' };
  }

  @Roles('plan:manager')
  @Get('plan-manager')
  public getPlanManager() {
    return { message: 'Plan manager only' };
  }

  // Complex role combinations
  @Roles('health:admin', 'care:admin')
  @Get('health-or-care-admin')
  public getHealthOrCareAdmin() {
    return { message: 'Health admin or care admin' };
  }

  @Roles('health:user', 'care:user', 'plan:user')
  @Get('any-journey-user')
  public getAnyJourneyUser() {
    return { message: 'Any journey user' };
  }
}

describe('RolesGuard and Roles Decorator Integration', () => {
  let app: INestApplication;
  let reflector: Reflector;
  let configService: ConfigService;
  let rolesGuard: RolesGuard;

  beforeAll(async () => {
    // Create a test module with our test controller and the RolesGuard
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              if (key === 'NODE_ENV') return 'test';
              if (key === 'AUTH_BYPASS_ROLES_IN_DEV') return false;
              return defaultValue;
            }),
          },
        },
        Reflector,
        RolesGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    reflector = moduleRef.get<Reflector>(Reflector);
    configService = moduleRef.get<ConfigService>(ConfigService);
    rolesGuard = moduleRef.get<RolesGuard>(RolesGuard);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Metadata Extraction', () => {
    it('should extract roles metadata from handler', () => {
      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // Get the roles metadata
      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);

      // Verify the roles metadata
      expect(roles).toBeDefined();
      expect(roles).toEqual(['admin']);
    });

    it('should extract journey-specific roles metadata from handler', () => {
      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getHealthAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // Get the roles metadata
      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);

      // Verify the roles metadata
      expect(roles).toBeDefined();
      expect(roles).toEqual(['health:admin']);
    });

    it('should extract multiple roles metadata from handler', () => {
      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getHealthOrCareAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // Get the roles metadata
      const roles = reflector.getAllAndOverride<string[]>(ROLES_KEY, [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);

      // Verify the roles metadata
      expect(roles).toBeDefined();
      expect(roles).toEqual(['health:admin', 'care:admin']);
    });
  });

  describe('Basic Role Checking', () => {
    it('should allow access to public endpoints without roles', async () => {
      // Create a mock execution context for a public endpoint
      const mockContext = {
        getHandler: () => TestController.prototype.getPublic,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should allow admin access to admin-only endpoints', async () => {
      // Create an admin user
      const adminUser = createTestAdminUser();

      // Create a mock request with the admin user
      const mockRequest = createAuthenticatedRequest(adminUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should deny regular user access to admin-only endpoints', async () => {
      // Create a regular user
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['admin'],
          userRoles: regularUser.roles.map(r => r.name),
          resource: 'Test.getAdminOnly',
        });
      }
    });

    it('should allow user access to user-only endpoints', async () => {
      // Create a regular user
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getUserOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should allow admin access to user-only endpoints (admin has all permissions)', async () => {
      // Create an admin user
      const adminUser = createTestAdminUser();

      // Create a mock request with the admin user
      const mockRequest = createAuthenticatedRequest(adminUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getUserOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should allow access to endpoints requiring any of multiple roles', async () => {
      // Create a regular user
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOrUser,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });
  });

  describe('Journey-Specific Role Checking', () => {
    it('should allow health admin access to health-admin endpoints', async () => {
      // Create a health admin user
      const healthAdminUser = createTestHealthUser({}, true);

      // Create a mock request with the health admin user
      const mockRequest = createAuthenticatedRequest(healthAdminUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getHealthAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should deny health user access to health-admin endpoints', async () => {
      // Create a health user (not admin)
      const healthUser = createTestHealthUser();

      // Create a mock request with the health user
      const mockRequest = createAuthenticatedRequest(healthUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getHealthAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['health:admin'],
          userRoles: healthUser.roles.map(r => r.name),
          resource: 'Test.getHealthAdmin',
        });
      }
    });

    it('should allow care provider access to care-provider endpoints', async () => {
      // Create a care provider user
      const careProviderUser = createTestCareUser({}, 'provider');

      // Create a mock request with the care provider user
      const mockRequest = createAuthenticatedRequest(careProviderUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getCareProvider,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should allow care admin access to care-provider endpoints (admin has all journey permissions)', async () => {
      // Create a care admin user
      const careAdminUser = createTestCareUser({}, 'admin');

      // Create a mock request with the care admin user
      const mockRequest = createAuthenticatedRequest(careAdminUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getCareProvider,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should deny care user access to care-provider endpoints', async () => {
      // Create a care user (not provider or admin)
      const careUser = createTestCareUser();

      // Create a mock request with the care user
      const mockRequest = createAuthenticatedRequest(careUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getCareProvider,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['care:provider'],
          userRoles: careUser.roles.map(r => r.name),
          resource: 'Test.getCareProvider',
        });
      }
    });

    it('should allow plan manager access to plan-manager endpoints', async () => {
      // Create a plan manager user
      const planManagerUser = createTestPlanUser({}, 'manager');

      // Create a mock request with the plan manager user
      const mockRequest = createAuthenticatedRequest(planManagerUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getPlanManager,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access
      expect(result).toBe(true);
    });

    it('should deny plan user access to plan-manager endpoints', async () => {
      // Create a plan user (not manager or admin)
      const planUser = createTestPlanUser();

      // Create a mock request with the plan user
      const mockRequest = createAuthenticatedRequest(planUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getPlanManager,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['plan:manager'],
          userRoles: planUser.roles.map(r => r.name),
          resource: 'Test.getPlanManager',
        });
      }
    });
  });

  describe('Role Inheritance and Complex Permissions', () => {
    it('should allow super_admin access to all endpoints', async () => {
      // Create a super admin user
      const superAdminUser = createTestUser({}, [
        { id: '99', name: 'super_admin', description: 'Super Administrator' },
      ]);

      // Create a mock request with the super admin user
      const mockRequest = createAuthenticatedRequest(superAdminUser);

      // Test endpoints with different role requirements
      const endpoints = [
        TestController.prototype.getAdminOnly,
        TestController.prototype.getUserOnly,
        TestController.prototype.getHealthAdmin,
        TestController.prototype.getCareProvider,
        TestController.prototype.getPlanManager,
      ];

      // Check if the guard allows access to all endpoints
      for (const endpoint of endpoints) {
        const mockContext = {
          getHandler: () => endpoint,
          getClass: () => TestController,
          switchToHttp: () => ({
            getRequest: () => mockRequest,
          }),
        } as unknown as ExecutionContext;

        const result = await rolesGuard.canActivate(mockContext);
        expect(result).toBe(true);
      }
    });

    it('should allow access to endpoints requiring any of multiple journey roles', async () => {
      // Create users with different journey admin roles
      const healthAdminUser = createTestHealthUser({}, true);
      const careAdminUser = createTestCareUser({}, 'admin');

      // Create mock requests with the users
      const healthAdminRequest = createAuthenticatedRequest(healthAdminUser);
      const careAdminRequest = createAuthenticatedRequest(careAdminUser);

      // Create a mock execution context for the health-or-care-admin endpoint
      const healthAdminContext = {
        getHandler: () => TestController.prototype.getHealthOrCareAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => healthAdminRequest,
        }),
      } as unknown as ExecutionContext;

      const careAdminContext = {
        getHandler: () => TestController.prototype.getHealthOrCareAdmin,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => careAdminRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access for both users
      const healthAdminResult = await rolesGuard.canActivate(healthAdminContext);
      const careAdminResult = await rolesGuard.canActivate(careAdminContext);

      // Verify the guard allows access for both users
      expect(healthAdminResult).toBe(true);
      expect(careAdminResult).toBe(true);
    });

    it('should deny access to endpoints requiring journey roles from different journey', async () => {
      // Create a health admin user
      const healthAdminUser = createTestHealthUser({}, true);

      // Create a mock request with the health admin user
      const mockRequest = createAuthenticatedRequest(healthAdminUser);

      // Create a mock execution context for the care-provider endpoint
      const mockContext = {
        getHandler: () => TestController.prototype.getCareProvider,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['care:provider'],
          userRoles: healthAdminUser.roles.map(r => r.name),
          resource: 'Test.getCareProvider',
        });
      }
    });

    it('should allow any journey user access to endpoints requiring any journey user role', async () => {
      // Create users with different journey user roles
      const healthUser = createTestHealthUser();
      const careUser = createTestCareUser();
      const planUser = createTestPlanUser();

      // Create mock requests with the users
      const healthUserRequest = createAuthenticatedRequest(healthUser);
      const careUserRequest = createAuthenticatedRequest(careUser);
      const planUserRequest = createAuthenticatedRequest(planUser);

      // Create mock execution contexts for the any-journey-user endpoint
      const healthUserContext = {
        getHandler: () => TestController.prototype.getAnyJourneyUser,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => healthUserRequest,
        }),
      } as unknown as ExecutionContext;

      const careUserContext = {
        getHandler: () => TestController.prototype.getAnyJourneyUser,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => careUserRequest,
        }),
      } as unknown as ExecutionContext;

      const planUserContext = {
        getHandler: () => TestController.prototype.getAnyJourneyUser,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => planUserRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access for all users
      const healthUserResult = await rolesGuard.canActivate(healthUserContext);
      const careUserResult = await rolesGuard.canActivate(careUserContext);
      const planUserResult = await rolesGuard.canActivate(planUserContext);

      // Verify the guard allows access for all users
      expect(healthUserResult).toBe(true);
      expect(careUserResult).toBe(true);
      expect(planUserResult).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw InsufficientPermissionsError when no user is present', async () => {
      // Create a mock execution context with no user
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      } as unknown as ExecutionContext;

      // Check if the guard throws the correct error
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('Authentication required to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['admin'],
          resource: 'Test.getAdminOnly',
        });
      }
    });

    it('should throw InsufficientPermissionsError with detailed metadata when user lacks required roles', async () => {
      // Create a regular user
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard throws the correct error
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['admin'],
          userRoles: regularUser.roles.map(r => r.name),
          resource: 'Test.getAdminOnly',
        });
      }
    });

    it('should include journey-specific role information in error metadata', async () => {
      // Create a health user
      const healthUser = createTestHealthUser();

      // Create a mock request with the health user
      const mockRequest = createAuthenticatedRequest(healthUser);

      // Create a mock execution context for a care-specific endpoint
      const mockContext = {
        getHandler: () => TestController.prototype.getCareProvider,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard throws the correct error
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.metadata).toEqual({
          requiredRoles: ['care:provider'],
          userRoles: healthUser.roles.map(r => r.name),
          resource: 'Test.getCareProvider',
        });
      }
    });
  });

  describe('Development Mode Bypass', () => {
    it('should bypass role checking in development mode when configured', async () => {
      // Mock the ConfigService to return development mode with bypass enabled
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_BYPASS_ROLES_IN_DEV') return true;
        return null;
      });

      // Create a regular user (without admin role)
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context for an admin-only endpoint
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard allows access despite the user not having the required role
      const result = await rolesGuard.canActivate(mockContext);

      // Verify the guard allows access due to development mode bypass
      expect(result).toBe(true);

      // Reset the mock
      jest.spyOn(configService, 'get').mockRestore();
    });

    it('should not bypass role checking in development mode when not configured', async () => {
      // Mock the ConfigService to return development mode with bypass disabled
      jest.spyOn(configService, 'get').mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'AUTH_BYPASS_ROLES_IN_DEV') return false;
        return null;
      });

      // Create a regular user (without admin role)
      const regularUser = createTestUser();

      // Create a mock request with the regular user
      const mockRequest = createAuthenticatedRequest(regularUser);

      // Create a mock execution context for an admin-only endpoint
      const mockContext = {
        getHandler: () => TestController.prototype.getAdminOnly,
        getClass: () => TestController,
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as unknown as ExecutionContext;

      // Check if the guard denies access
      try {
        await rolesGuard.canActivate(mockContext);
        fail('Should have thrown an InsufficientPermissionsError');
      } catch (error) {
        // Verify the error
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
      }

      // Reset the mock
      jest.spyOn(configService, 'get').mockRestore();
    });
  });
});