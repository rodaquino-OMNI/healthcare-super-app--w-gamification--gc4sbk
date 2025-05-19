import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { InsufficientPermissionsError } from '@austa/errors';
import { IUserWithRoles, JourneyType } from '@austa/interfaces/auth';
import { Roles, ROLES_KEY } from '@austa/auth/decorators/roles.decorator';
import { RolesGuard } from '@austa/auth/guards/roles.guard';
import {
  createMockExecutionContext,
  createTestUser,
  createTestAdminUser,
  createJourneyAdminUser
} from './test-helpers';

// Mock controllers for testing different role configurations
@Controller('test')
class TestController {
  @Get('public')
  public(): string {
    return 'public';
  }

  @Roles('user')
  @Get('user')
  user(): string {
    return 'user';
  }

  @Roles('admin')
  @Get('admin')
  admin(): string {
    return 'admin';
  }

  @Roles('user', 'admin')
  @Get('user-or-admin')
  userOrAdmin(): string {
    return 'user-or-admin';
  }
}

@Controller('journey')
class JourneyController {
  @Roles('health:admin')
  @Get('health-admin')
  healthAdmin(): string {
    return 'health-admin';
  }

  @Roles('care:provider')
  @Get('care-provider')
  careProvider(): string {
    return 'care-provider';
  }

  @Roles('plan:manager')
  @Get('plan-manager')
  planManager(): string {
    return 'plan-manager';
  }

  @Roles('health:admin', 'care:provider', 'plan:manager')
  @Get('any-journey-role')
  anyJourneyRole(): string {
    return 'any-journey-role';
  }
}

@Controller('complex')
@Roles('admin')
class ControllerWithRoles {
  @Get('admin-only')
  adminOnly(): string {
    return 'admin-only';
  }

  @Roles('user')
  @Get('user-override')
  userOverride(): string {
    return 'user-override';
  }
}

describe('RolesGuard and Roles Decorator Integration', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeAll(async () => {
    // Create a test module with the controllers and RolesGuard
    moduleRef = await Test.createTestingModule({
      controllers: [TestController, JourneyController, ControllerWithRoles],
      providers: [RolesGuard, Reflector],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Get the RolesGuard and Reflector instances
    rolesGuard = moduleRef.get<RolesGuard>(RolesGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Roles Decorator Metadata', () => {
    it('should set metadata with the correct roles', () => {
      // Get the controller instance
      const testController = moduleRef.get(TestController);
      
      // Get the handler for the user method
      const userHandler = testController.user;
      
      // Use reflector to get the metadata
      const roles = reflector.get(ROLES_KEY, userHandler);
      
      // Verify the metadata contains the correct roles
      expect(roles).toEqual(['user']);
    });

    it('should set metadata with multiple roles', () => {
      // Get the controller instance
      const testController = moduleRef.get(TestController);
      
      // Get the handler for the userOrAdmin method
      const userOrAdminHandler = testController.userOrAdmin;
      
      // Use reflector to get the metadata
      const roles = reflector.get(ROLES_KEY, userOrAdminHandler);
      
      // Verify the metadata contains the correct roles
      expect(roles).toEqual(['user', 'admin']);
    });

    it('should set metadata for journey-specific roles', () => {
      // Get the controller instance
      const journeyController = moduleRef.get(JourneyController);
      
      // Get the handler for the healthAdmin method
      const healthAdminHandler = journeyController.healthAdmin;
      
      // Use reflector to get the metadata
      const roles = reflector.get(ROLES_KEY, healthAdminHandler);
      
      // Verify the metadata contains the correct roles
      expect(roles).toEqual(['health:admin']);
    });

    it('should set metadata at the controller level', () => {
      // Get the controller class
      const controllerClass = ControllerWithRoles;
      
      // Use reflector to get the metadata
      const roles = reflector.get(ROLES_KEY, controllerClass);
      
      // Verify the metadata contains the correct roles
      expect(roles).toEqual(['admin']);
    });
  });

  describe('RolesGuard Basic Role Checking', () => {
    it('should allow access when no roles are required', async () => {
      // Create a context with no roles metadata
      const user = createTestUser();
      const context = createMockExecutionContext(user);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when user has the required role', async () => {
      // Create a user with the 'user' role
      const user = createTestUser();
      
      // Create a context with 'user' role metadata
      const context = createMockExecutionContext(user, ['user']);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access when user does not have the required role', async () => {
      // Create a user with only the 'user' role
      const user = createTestUser();
      
      // Create a context with 'admin' role metadata
      const context = createMockExecutionContext(user, ['admin']);
      
      // Verify the guard throws an InsufficientPermissionsError
      await expect(rolesGuard.canActivate(context)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow access when user has any of the required roles', async () => {
      // Create a user with the 'user' role
      const user = createTestUser();
      
      // Create a context with 'user' or 'admin' role metadata
      const context = createMockExecutionContext(user, ['user', 'admin']);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw error when no user is present in the request', async () => {
      // Create a context with no user
      const context = createMockExecutionContext(null as any, ['user']);
      
      // Verify the guard throws an InsufficientPermissionsError
      await expect(rolesGuard.canActivate(context)).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('RolesGuard Journey-Specific Role Checking', () => {
    it('should allow access when user has the required journey-specific role', async () => {
      // Create a user with the 'health:admin' role
      const user = createJourneyAdminUser('health');
      user.roles = ['user', 'health:admin'];
      
      // Create a context with 'health:admin' role metadata
      const context = createMockExecutionContext(user, ['health:admin']);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when user has global admin role for journey-specific endpoint', async () => {
      // Create an admin user
      const user = createTestAdminUser();
      
      // Create a context with 'health:admin' role metadata
      const context = createMockExecutionContext(user, ['health:admin']);
      
      // Verify the guard allows access (admin should have access to all journey-specific roles)
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access when user does not have the required journey-specific role', async () => {
      // Create a user with the 'health:admin' role
      const user = createJourneyAdminUser('health');
      user.roles = ['user', 'health:admin'];
      
      // Create a context with 'care:provider' role metadata
      const context = createMockExecutionContext(user, ['care:provider']);
      
      // Verify the guard throws an InsufficientPermissionsError
      await expect(rolesGuard.canActivate(context)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow access when user has any of the required journey-specific roles', async () => {
      // Create a user with the 'health:admin' role
      const user = createJourneyAdminUser('health');
      user.roles = ['user', 'health:admin'];
      
      // Create a context with multiple journey role metadata
      const context = createMockExecutionContext(user, ['health:admin', 'care:provider', 'plan:manager']);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should allow access when user has journey-specific admin role', async () => {
      // Create a user with the 'health:admin' role
      const user = createJourneyAdminUser('health');
      user.roles = ['user', 'health:admin'];
      
      // Create a context with 'health:viewer' role metadata (should be covered by health:admin)
      const context = createMockExecutionContext(user, ['health:viewer']);
      
      // Verify the guard allows access (health:admin should have access to all health roles)
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('RolesGuard Role Inheritance and Complex Scenarios', () => {
    it('should respect controller-level roles', async () => {
      // Create a user with only the 'user' role
      const user = createTestUser();
      
      // Mock the getAllAndOverride method to return controller-level roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['admin']);
      
      // Create a context
      const context = createMockExecutionContext(user);
      
      // Verify the guard throws an InsufficientPermissionsError
      await expect(rolesGuard.canActivate(context)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow method-level roles to override controller-level roles', async () => {
      // Create a user with only the 'user' role
      const user = createTestUser();
      
      // Mock the getAllAndOverride method to return method-level roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['user']);
      
      // Create a context
      const context = createMockExecutionContext(user);
      
      // Verify the guard allows access
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should handle complex role combinations across journeys', async () => {
      // Create a user with multiple journey roles
      const user = createTestUser();
      user.roles = ['user', 'health:viewer', 'care:provider', 'plan:reader'];
      
      // Create a context with complex role requirements
      const context = createMockExecutionContext(user, ['health:admin', 'care:provider', 'plan:manager']);
      
      // Verify the guard allows access (user has care:provider)
      const result = await rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should handle empty user roles array', async () => {
      // Create a user with no roles
      const user = createTestUser();
      user.roles = [];
      
      // Create a context with role requirements
      const context = createMockExecutionContext(user, ['user']);
      
      // Verify the guard throws an InsufficientPermissionsError
      await expect(rolesGuard.canActivate(context)).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('RolesGuard Error Responses', () => {
    it('should include required roles in error details', async () => {
      // Create a user with only the 'user' role
      const user = createTestUser();
      
      // Create a context with 'admin' role metadata
      const context = createMockExecutionContext(user, ['admin']);
      
      // Verify the guard throws an InsufficientPermissionsError with the correct details
      try {
        await rolesGuard.canActivate(context);
        fail('Expected InsufficientPermissionsError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.details).toHaveProperty('requiredRoles', ['admin']);
        expect(error.details).toHaveProperty('userRoles');
        expect(error.details).toHaveProperty('userId', user.id);
      }
    });

    it('should include user roles in error details for debugging', async () => {
      // Create a user with specific roles
      const user = createTestUser();
      user.roles = ['user', 'health:viewer'];
      
      // Create a context with 'admin' role metadata
      const context = createMockExecutionContext(user, ['admin']);
      
      // Verify the guard throws an InsufficientPermissionsError with the correct details
      try {
        await rolesGuard.canActivate(context);
        fail('Expected InsufficientPermissionsError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.details).toHaveProperty('userRoles');
        expect(error.details.userRoles).toEqual(['user', 'health:viewer']);
      }
    });

    it('should include endpoint information in error details', async () => {
      // Create a user with only the 'user' role
      const user = createTestUser();
      
      // Create a context with 'admin' role metadata and request path/method
      const context = createMockExecutionContext(user, ['admin']);
      
      // Add request path and method to the context
      const req = context.switchToHttp().getRequest();
      req.path = '/admin/resource';
      req.method = 'GET';
      
      // Verify the guard throws an InsufficientPermissionsError with the correct details
      try {
        await rolesGuard.canActivate(context);
        fail('Expected InsufficientPermissionsError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.details).toHaveProperty('endpoint', '/admin/resource');
        expect(error.details).toHaveProperty('method', 'GET');
      }
    });

    it('should provide a different error message when no user is present', async () => {
      // Create a context with no user
      const context = createMockExecutionContext(null as any, ['user']);
      
      // Verify the guard throws an InsufficientPermissionsError with the correct message
      try {
        await rolesGuard.canActivate(context);
        fail('Expected InsufficientPermissionsError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('Authentication required to access this resource');
      }
    });
  });
});