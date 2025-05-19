import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { InsufficientPermissionsError } from '@austa/errors';
import { RolesGuard } from '../../../src/guards/roles.guard';
import { ROLES_KEY } from '../../../src/decorators/roles.decorator';

// Mock JourneyType enum since we can't access the actual one
enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

// Mock user interface
interface IUserWithRoles {
  id: string;
  roles?: { name: string }[];
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let originalEnv: NodeJS.ProcessEnv;

  // Store original environment variables
  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  // Restore original environment variables after all tests
  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(async () => {
    // Reset environment variables before each test
    process.env.AUTH_BYPASS_ROLE_CHECKS = 'false';
    process.env.NODE_ENV = 'production';

    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = moduleRef.get<RolesGuard>(RolesGuard);
    reflector = moduleRef.get<Reflector>(Reflector);
  });

  // Helper function to create a mock execution context
  const createMockExecutionContext = (requiredRoles: string[] | null, user: IUserWithRoles | null) => {
    const mockRequest = {
      user,
      path: '/test-path',
      method: 'GET',
    };

    const mockExecutionContext: Partial<ExecutionContext> = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    };

    // Mock the reflector to return the required roles
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

    return mockExecutionContext as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(null, { id: 'user-1' });

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should allow access when no roles are specified (empty array)', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext([], { id: 'user-1' });

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw InsufficientPermissionsError when user is not authenticated', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(['admin'], null);

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'Authentication required to access this resource'
      );
    });

    it('should allow access when user has one of the required roles', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['admin', 'user'],
        {
          id: 'user-1',
          roles: [{ name: 'user' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw InsufficientPermissionsError when user does not have any required roles', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['admin', 'manager'],
        {
          id: 'user-1',
          roles: [{ name: 'user' }],
        }
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        'You do not have permission to access this resource'
      );
    });

    it('should throw InsufficientPermissionsError when user has no roles', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['admin', 'user'],
        {
          id: 'user-1',
          roles: [],
        }
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw InsufficientPermissionsError when user has undefined roles', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['admin', 'user'],
        {
          id: 'user-1',
        }
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('journey-specific role validation', () => {
    it('should allow access when user has the exact journey-specific role', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor'],
        {
          id: 'user-1',
          roles: [{ name: 'health:editor' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has global admin role and journey-specific role is required', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor'],
        {
          id: 'user-1',
          roles: [{ name: 'admin' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has superadmin role and journey-specific role is required', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor'],
        {
          id: 'user-1',
          roles: [{ name: 'superadmin' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should allow access when user has journey-specific admin role and any role for that journey is required', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor'],
        {
          id: 'user-1',
          roles: [{ name: 'health:admin' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should not allow access when user has admin role for a different journey', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor'],
        {
          id: 'user-1',
          roles: [{ name: 'care:admin' }],
        }
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should handle multiple journey-specific roles correctly', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['health:editor', 'care:provider', 'plan:manager'],
        {
          id: 'user-1',
          roles: [{ name: 'care:provider' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true);
    });

    it('should not match invalid journey prefixes', async () => {
      // Arrange
      const mockExecutionContext = createMockExecutionContext(
        ['invalid:role'],
        {
          id: 'user-1',
          roles: [{ name: 'invalid:role' }],
        }
      );

      // Act
      const result = await guard.canActivate(mockExecutionContext);

      // Assert
      expect(result).toBe(true); // Direct match still works, but journey-specific logic is skipped
    });
  });

  describe('role check bypass', () => {
    it('should bypass role checks in development when environment variable is set', async () => {
      // Arrange
      process.env.AUTH_BYPASS_ROLE_CHECKS = 'true';
      process.env.NODE_ENV = 'development';

      const mockExecutionContext = createMockExecutionContext(
        ['admin'],
        {
          id: 'user-1',
          roles: [{ name: 'user' }], // User doesn't have admin role
        }
      );

      // Mock console.warn to prevent test output pollution
      const originalConsoleWarn = console.warn;
      console.warn = jest.fn();

      try {
        // Act
        const result = await guard.canActivate(mockExecutionContext);

        // Assert
        expect(result).toBe(true);
        expect(console.warn).toHaveBeenCalled();
      } finally {
        // Restore console.warn
        console.warn = originalConsoleWarn;
      }
    });

    it('should not bypass role checks in production even when environment variable is set', async () => {
      // Arrange
      process.env.AUTH_BYPASS_ROLE_CHECKS = 'true';
      process.env.NODE_ENV = 'production';

      const mockExecutionContext = createMockExecutionContext(
        ['admin'],
        {
          id: 'user-1',
          roles: [{ name: 'user' }], // User doesn't have admin role
        }
      );

      // Act & Assert
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(InsufficientPermissionsError);
    });
  });

  describe('error context', () => {
    it('should include detailed context in InsufficientPermissionsError when authentication is required', async () => {
      // Arrange
      const requiredRoles = ['admin', 'manager'];
      const mockExecutionContext = createMockExecutionContext(requiredRoles, null);

      // Act & Assert
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected error was not thrown');
      } catch (error) {
        if (error instanceof InsufficientPermissionsError) {
          // Assert error context
          expect(error.message).toBe('Authentication required to access this resource');
          expect(error.context).toEqual({
            requiredRoles,
            endpoint: '/test-path',
            method: 'GET',
          });
        } else {
          throw error;
        }
      }
    });

    it('should include detailed context in InsufficientPermissionsError when user lacks required roles', async () => {
      // Arrange
      const requiredRoles = ['admin', 'manager'];
      const userId = 'user-1';
      const userRoles = [{ name: 'user' }];

      const mockExecutionContext = createMockExecutionContext(
        requiredRoles,
        {
          id: userId,
          roles: userRoles,
        }
      );

      // Act & Assert
      try {
        await guard.canActivate(mockExecutionContext);
        fail('Expected error was not thrown');
      } catch (error) {
        if (error instanceof InsufficientPermissionsError) {
          // Assert error context
          expect(error.message).toBe('You do not have permission to access this resource');
          expect(error.context).toEqual({
            userId,
            requiredRoles,
            userRoles: ['user'],
            endpoint: '/test-path',
            method: 'GET',
          });
        } else {
          throw error;
        }
      }
    });
  });
});