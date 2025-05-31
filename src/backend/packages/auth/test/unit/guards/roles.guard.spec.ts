import { Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InsufficientPermissionsError } from '@austa/errors';

import { RolesGuard } from '../../../src/guards/roles.guard';
import { ROLES_KEY } from '../../../src/decorators/roles.decorator';
import { ERROR_CODES } from '../../../src/constants';
import { createMockExecutionContext } from '../../helpers/mock-auth-providers.helper';
import { TEST_USERS } from '../../helpers/test-constants.helper';

/**
 * Unit tests for RolesGuard
 * 
 * These tests verify that the RolesGuard correctly implements role-based access control
 * for protected endpoints across the AUSTA SuperApp. The tests cover:
 * 
 * 1. Basic role validation (direct role matching)
 * 2. Journey-specific role validation (e.g., 'health:admin')
 * 3. Super admin access (bypass all role checks)
 * 4. Development mode bypass
 * 5. Error handling for unauthorized access
 * 6. Resource name extraction for error messages
 */

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let configService: ConfigService;

  beforeEach(async () => {
    // Create a testing module with mocked dependencies
    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get instances of guard and dependencies
    guard = moduleRef.get<RolesGuard>(RolesGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
    configService = moduleRef.get<ConfigService>(ConfigService);
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', async () => {
      // Mock reflector to return no roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      // Create mock execution context
      const context = createMockExecutionContext();

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);

      // Verify that reflector was called with the correct parameters
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when roles are required but in development mode with bypass enabled', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to enable bypass in development
      jest.spyOn(configService, 'get')
        .mockImplementation((key) => {
          if (key === 'AUTH_BYPASS_ROLES_IN_DEV') return true;
          if (key === 'NODE_ENV') return 'development';
          return null;
        });

      // Create mock execution context
      const context = createMockExecutionContext();

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);

      // Verify that config service was called
      expect(configService.get).toHaveBeenCalledWith('AUTH_BYPASS_ROLES_IN_DEV', false);
      expect(configService.get).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should throw InsufficientPermissionsError when user is not authenticated', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with no user
      const context = createMockExecutionContext({ user: null });

      // Call the method and expect it to throw
      await expect(guard.canActivate(context as ExecutionContext))
        .rejects.toThrow(InsufficientPermissionsError);

      // Verify that the error has the correct properties
      try {
        await guard.canActivate(context as ExecutionContext);
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('Authentication required to access this resource');
        expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        expect(error.details).toEqual({
          requiredRoles: ['admin'],
          resource: expect.any(String),
        });
      }
    });

    it('should allow access when user has the required role', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with admin user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.ADMIN_USER,
          roles: ['admin', 'user'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should throw InsufficientPermissionsError when user does not have the required role', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with regular user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.REGULAR_USER,
          roles: ['user'],
        },
      });

      // Call the method and expect it to throw
      await expect(guard.canActivate(context as ExecutionContext))
        .rejects.toThrow(InsufficientPermissionsError);

      // Verify that the error has the correct properties
      try {
        await guard.canActivate(context as ExecutionContext);
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.message).toBe('You do not have permission to access this resource');
        expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        expect(error.details).toEqual({
          requiredRoles: ['admin'],
          userRoles: ['user'],
          resource: expect.any(String),
        });
      }
    });

    it('should allow access when user has super_admin role regardless of required roles', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with super admin user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.SUPER_ADMIN,
          roles: ['super_admin'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('journey-specific roles', () => {
    it('should allow access when user has exact journey role match', async () => {
      // Mock reflector to return required journey role
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:viewer']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with health journey user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.HEALTH_USER,
          roles: ['user', 'health:viewer'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should allow access when user has journey admin role', async () => {
      // Mock reflector to return required journey role
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:viewer']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with health admin user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.HEALTH_USER,
          roles: ['user', 'health:admin'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should deny access when user has different journey role', async () => {
      // Mock reflector to return required journey role
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:viewer']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with care journey user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.CARE_USER,
          roles: ['user', 'care:viewer'],
        },
      });

      // Call the method and expect it to throw
      await expect(guard.canActivate(context as ExecutionContext))
        .rejects.toThrow(InsufficientPermissionsError);
    });

    it('should allow access when user has any of the required roles', async () => {
      // Mock reflector to return multiple required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:viewer', 'care:viewer']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with care journey user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.CARE_USER,
          roles: ['user', 'care:viewer'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });

    it('should test all three journey types (health, care, plan)', async () => {
      // Test health journey
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:viewer']);
      jest.spyOn(configService, 'get').mockReturnValue(false);
      
      const healthContext = createMockExecutionContext({
        user: {
          ...TEST_USERS.HEALTH_USER,
          roles: ['user', 'health:viewer'],
        },
      });
      
      const healthResult = await guard.canActivate(healthContext as ExecutionContext);
      expect(healthResult).toBe(true);
      
      // Test care journey
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['care:viewer']);
      
      const careContext = createMockExecutionContext({
        user: {
          ...TEST_USERS.CARE_USER,
          roles: ['user', 'care:viewer'],
        },
      });
      
      const careResult = await guard.canActivate(careContext as ExecutionContext);
      expect(careResult).toBe(true);
      
      // Test plan journey
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['plan:viewer']);
      
      const planContext = createMockExecutionContext({
        user: {
          ...TEST_USERS.PLAN_USER,
          roles: ['user', 'plan:viewer'],
        },
      });
      
      const planResult = await guard.canActivate(planContext as ExecutionContext);
      expect(planResult).toBe(true);
    });

    it('should handle complex journey role combinations', async () => {
      // Mock reflector to return multiple journey roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['health:admin', 'care:provider', 'plan:manager']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with multi-journey user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.MULTI_JOURNEY_USER,
          roles: ['user', 'health:admin', 'care:viewer', 'plan:user'],
        },
      });

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });
  });

  describe('matchRoles', () => {
    // We need to access the private method for testing
    const matchRoles = (requiredRoles: string[], userRoles: string[]): boolean => {
      return (guard as any).matchRoles(requiredRoles, userRoles);
    };

    it('should return false when user has no roles', () => {
      const result = matchRoles(['admin'], []);
      expect(result).toBe(false);
    });

    it('should return false when user roles is null or undefined', () => {
      const resultNull = matchRoles(['admin'], null);
      expect(resultNull).toBe(false);
      
      const resultUndefined = matchRoles(['admin'], undefined);
      expect(resultUndefined).toBe(false);
    });

    it('should return true when user has super_admin role', () => {
      const result = matchRoles(['admin', 'health:admin'], ['super_admin']);
      expect(result).toBe(true);
    });

    it('should return true when user has direct role match', () => {
      const result = matchRoles(['admin', 'user'], ['user']);
      expect(result).toBe(true);
    });

    it('should return true when user has exact journey role match', () => {
      const result = matchRoles(['health:viewer'], ['health:viewer']);
      expect(result).toBe(true);
    });

    it('should return true when user has journey admin role', () => {
      const result = matchRoles(['health:viewer'], ['health:admin']);
      expect(result).toBe(true);
    });

    it('should return false when user has different journey role', () => {
      const result = matchRoles(['health:viewer'], ['care:viewer']);
      expect(result).toBe(false);
    });

    it('should return false when user has no matching roles', () => {
      const result = matchRoles(['admin', 'health:admin'], ['user', 'care:viewer']);
      expect(result).toBe(false);
    });
    
    it('should handle multiple journey roles correctly', () => {
      // User with multiple journey roles
      const userRoles = ['user', 'health:viewer', 'care:provider', 'plan:user'];
      
      // Should match health journey role
      expect(matchRoles(['health:viewer'], userRoles)).toBe(true);
      
      // Should match care journey role
      expect(matchRoles(['care:provider'], userRoles)).toBe(true);
      
      // Should match plan journey role
      expect(matchRoles(['plan:user'], userRoles)).toBe(true);
      
      // Should match any of the required roles
      expect(matchRoles(['health:admin', 'care:provider'], userRoles)).toBe(true);
      
      // Should not match when no required roles match
      expect(matchRoles(['health:admin', 'care:admin'], userRoles)).toBe(false);
    });
    
    it('should handle malformed journey roles gracefully', () => {
      // Malformed journey roles (missing colon)
      const userRoles = ['user', 'healthviewer', 'care:provider'];
      
      // Should not match malformed journey role
      expect(matchRoles(['health:viewer'], userRoles)).toBe(false);
      
      // Should still match valid journey role
      expect(matchRoles(['care:provider'], userRoles)).toBe(true);
    });
  });

  describe('getResourceFromContext', () => {
    // We need to access the private method for testing
    const getResourceFromContext = (context: ExecutionContext): string => {
      return (guard as any).getResourceFromContext(context);
    };

    it('should extract resource name from context', () => {
      // Create a mock execution context with controller and handler names
      const context = {
        getHandler: jest.fn().mockReturnValue({
          name: 'getUsers',
        }),
        getClass: jest.fn().mockReturnValue({
          name: 'UserController',
        }),
      } as unknown as ExecutionContext;

      // Call the method and check the result
      const result = getResourceFromContext(context);
      expect(result).toBe('User.getUsers');
    });

    it('should handle controllers without Controller suffix', () => {
      // Create a mock execution context with controller without suffix
      const context = {
        getHandler: jest.fn().mockReturnValue({
          name: 'getMetrics',
        }),
        getClass: jest.fn().mockReturnValue({
          name: 'Health',
        }),
      } as unknown as ExecutionContext;

      // Call the method and check the result
      const result = getResourceFromContext(context);
      expect(result).toBe('Health.getMetrics');
    });
    
    it('should handle journey-specific controllers', () => {
      // Test health journey controller
      const healthContext = {
        getHandler: jest.fn().mockReturnValue({
          name: 'getHealthMetrics',
        }),
        getClass: jest.fn().mockReturnValue({
          name: 'HealthJourneyController',
        }),
      } as unknown as ExecutionContext;
      
      expect(getResourceFromContext(healthContext)).toBe('HealthJourney.getHealthMetrics');
      
      // Test care journey controller
      const careContext = {
        getHandler: jest.fn().mockReturnValue({
          name: 'bookAppointment',
        }),
        getClass: jest.fn().mockReturnValue({
          name: 'CareJourneyController',
        }),
      } as unknown as ExecutionContext;
      
      expect(getResourceFromContext(careContext)).toBe('CareJourney.bookAppointment');
      
      // Test plan journey controller
      const planContext = {
        getHandler: jest.fn().mockReturnValue({
          name: 'submitClaim',
        }),
        getClass: jest.fn().mockReturnValue({
          name: 'PlanJourneyController',
        }),
      } as unknown as ExecutionContext;
      
      expect(getResourceFromContext(planContext)).toBe('PlanJourney.submitClaim');
    });
  });
  
  // Test integration with error handling
  describe('error handling and integration', () => {
    it('should include detailed error information in InsufficientPermissionsError', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'health:admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with regular user
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.REGULAR_USER,
          roles: ['user'],
        },
      });

      // Call the method and catch the error
      try {
        await guard.canActivate(context as ExecutionContext);
        fail('Expected InsufficientPermissionsError to be thrown');
      } catch (error) {
        // Verify error details
        expect(error).toBeInstanceOf(InsufficientPermissionsError);
        expect(error.code).toBe(ERROR_CODES.INSUFFICIENT_PERMISSIONS);
        expect(error.details).toEqual({
          requiredRoles: ['admin', 'health:admin'],
          userRoles: ['user'],
          resource: expect.any(String),
        });
      }
    });
    
    it('should handle empty arrays of required roles', async () => {
      // Mock reflector to return empty array of roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);

      // Create mock execution context
      const context = createMockExecutionContext();

      // Call the method and check the result
      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });
    
    it('should handle edge case with user having empty roles array', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with user having empty roles array
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.REGULAR_USER,
          roles: [],
        },
      });

      // Call the method and expect it to throw
      await expect(guard.canActivate(context as ExecutionContext))
        .rejects.toThrow(InsufficientPermissionsError);
    });
    
    it('should handle edge case with user having undefined roles', async () => {
      // Mock reflector to return required roles
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

      // Mock config service to disable bypass
      jest.spyOn(configService, 'get').mockReturnValue(false);

      // Create mock execution context with user having undefined roles
      const context = createMockExecutionContext({
        user: {
          ...TEST_USERS.REGULAR_USER,
          roles: undefined,
        },
      });

      // Call the method and expect it to throw
      await expect(guard.canActivate(context as ExecutionContext))
        .rejects.toThrow(InsufficientPermissionsError);
    });
    
    it('should integrate with NestJS dependency injection system', async () => {
      // This test verifies that the guard can be properly instantiated by NestJS
      const moduleRef = await Test.createTestingModule({
        providers: [
          RolesGuard,
          {
            provide: Reflector,
            useValue: {
              getAllAndOverride: jest.fn().mockReturnValue(['admin']),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(false),
            },
          },
        ],
      }).compile();

      const guardInstance = moduleRef.get<RolesGuard>(RolesGuard);
      expect(guardInstance).toBeInstanceOf(RolesGuard);
    });
  });
});