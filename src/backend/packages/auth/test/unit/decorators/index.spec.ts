import { Test } from '@nestjs/testing';
import { Controller, ExecutionContext, Get, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// Import from the barrel file to test the exports
import { CurrentUser, Roles, ROLES_KEY } from '../../../src/decorators';

// Import directly from source files for comparison
import { CurrentUser as SourceCurrentUser } from '../../../src/decorators/current-user.decorator';
import { Roles as SourceRoles, ROLES_KEY as SOURCE_ROLES_KEY } from '../../../src/decorators/roles.decorator';

describe('Auth Decorators Barrel File', () => {
  describe('Exports', () => {
    it('should export CurrentUser decorator', () => {
      expect(CurrentUser).toBeDefined();
      expect(typeof CurrentUser).toBe('function');
      // Verify it's the same as the source export
      expect(CurrentUser).toBe(SourceCurrentUser);
    });

    it('should export Roles decorator', () => {
      expect(Roles).toBeDefined();
      expect(typeof Roles).toBe('function');
      // Verify it's the same as the source export
      expect(Roles).toBe(SourceRoles);
    });

    it('should export ROLES_KEY constant', () => {
      expect(ROLES_KEY).toBeDefined();
      expect(typeof ROLES_KEY).toBe('string');
      expect(ROLES_KEY).toBe('roles');
      // Verify it's the same as the source export
      expect(ROLES_KEY).toBe(SOURCE_ROLES_KEY);
    });
  });

  describe('CurrentUser Decorator', () => {
    // Mock execution context
    const mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { id: '123', email: 'test@example.com', roles: ['user'] }
        })
      })
    } as unknown as ExecutionContext;

    it('should extract the entire user object when no data is provided', () => {
      const result = CurrentUser(undefined, mockExecutionContext);
      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        roles: ['user']
      });
    });

    it('should extract a specific property when data is provided', () => {
      const result = CurrentUser('id', mockExecutionContext);
      expect(result).toBe('123');
    });

    it('should handle nested properties correctly', () => {
      const nestedContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { 
              id: '123', 
              profile: { firstName: 'John', lastName: 'Doe' }
            }
          })
        })
      } as unknown as ExecutionContext;

      const result = CurrentUser('profile.firstName', nestedContext);
      // The current implementation doesn't support nested properties directly
      // This test verifies the current behavior (returns undefined for nested paths)
      expect(result).toBeUndefined();
    });
  });

  describe('Roles Decorator', () => {
    it('should create metadata with the correct key and roles', () => {
      // Create a spy on SetMetadata to verify it's called correctly
      const setMetadataSpy = jest.spyOn(SetMetadata as any, 'call');
      
      // Apply the Roles decorator
      const decorator = Roles('admin', 'user');
      
      // Verify SetMetadata was called with the correct arguments
      expect(setMetadataSpy).toHaveBeenCalledWith(
        expect.anything(), // this context
        ROLES_KEY,
        ['admin', 'user']
      );
      
      // Restore the spy
      setMetadataSpy.mockRestore();
    });

    it('should work with journey-specific roles', () => {
      // Create a spy on SetMetadata to verify it's called correctly
      const setMetadataSpy = jest.spyOn(SetMetadata as any, 'call');
      
      // Apply the Roles decorator with journey-specific roles
      const decorator = Roles('health:manager', 'care:provider', 'plan:admin');
      
      // Verify SetMetadata was called with the correct arguments
      expect(setMetadataSpy).toHaveBeenCalledWith(
        expect.anything(), // this context
        ROLES_KEY,
        ['health:manager', 'care:provider', 'plan:admin']
      );
      
      // Restore the spy
      setMetadataSpy.mockRestore();
    });

    it('should apply metadata to a class or method', async () => {
      // Create a test controller with the Roles decorator
      @Controller('test')
      class TestController {
        @Roles('admin')
        @Get('admin-route')
        adminRoute() {
          return 'admin only';
        }

        @Roles('user', 'admin')
        @Get('user-route')
        userRoute() {
          return 'user or admin';
        }
      }

      // Create a NestJS test module with the controller
      const moduleRef = await Test.createTestingModule({
        controllers: [TestController],
      }).compile();

      // Get the reflector and controller
      const reflector = moduleRef.get(Reflector);
      const controller = moduleRef.get(TestController);

      // Get the metadata from the controller methods
      const adminRouteRoles = reflector.get(
        ROLES_KEY,
        controller.adminRoute
      );
      const userRouteRoles = reflector.get(
        ROLES_KEY,
        controller.userRoute
      );

      // Verify the metadata was applied correctly
      expect(adminRouteRoles).toEqual(['admin']);
      expect(userRouteRoles).toEqual(['user', 'admin']);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety for CurrentUser decorator', () => {
      // This is a compile-time check, not a runtime check
      // We're just verifying that the types are exported correctly
      // TypeScript will catch any type errors during compilation
      
      // Define a type that matches the expected return type of CurrentUser
      type CurrentUserType = (data?: string, ctx?: ExecutionContext) => any;
      
      // Verify CurrentUser can be assigned to this type
      const typedCurrentUser: CurrentUserType = CurrentUser;
      expect(typedCurrentUser).toBe(CurrentUser);
    });

    it('should maintain type safety for Roles decorator', () => {
      // This is a compile-time check, not a runtime check
      // We're just verifying that the types are exported correctly
      // TypeScript will catch any type errors during compilation
      
      // Define a type that matches the expected return type of Roles
      type RolesType = (...roles: string[]) => ClassDecorator & MethodDecorator;
      
      // Verify Roles can be assigned to this type
      const typedRoles: RolesType = Roles;
      expect(typedRoles).toBe(Roles);
    });
  });
});