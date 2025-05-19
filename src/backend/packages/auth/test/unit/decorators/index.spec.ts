import { createParamDecorator, SetMetadata } from '@nestjs/common';
import * as barrelExports from '../../../src/decorators';
import { Roles, ROLES_KEY } from '../../../src/decorators/roles.decorator';
import { CurrentUser } from '../../../src/decorators/current-user.decorator';

/**
 * Unit tests for the decorator barrel file (index.ts)
 * 
 * These tests verify that all authentication decorators and constants are properly
 * exported and accessible via the unified import path. This ensures that consumers
 * can use simplified imports while maintaining the expected functionality.
 */
describe('Auth Decorators Barrel File', () => {
  describe('Exports', () => {
    it('should export all decorators and constants', () => {
      // Check that all expected exports exist
      expect(barrelExports).toHaveProperty('Roles');
      expect(barrelExports).toHaveProperty('CurrentUser');
      expect(barrelExports).toHaveProperty('ROLES_KEY');
    });

    it('should export the correct ROLES_KEY constant value', () => {
      // Verify the constant has the correct value
      expect(barrelExports.ROLES_KEY).toBe('roles');
      // Verify it matches the original implementation
      expect(barrelExports.ROLES_KEY).toBe(ROLES_KEY);
    });

    it('should export Roles decorator that matches the implementation', () => {
      // Verify the Roles decorator is a function
      expect(typeof barrelExports.Roles).toBe('function');
      // Verify it matches the original implementation
      expect(barrelExports.Roles).toBe(Roles);
      
      // Test the decorator functionality by creating a mock handler
      const mockHandler = {};
      const roles = ['admin', 'user'];
      const decoratedHandler = barrelExports.Roles(...roles)(mockHandler);
      
      // Verify the decorator applies metadata correctly
      const metadata = Reflect.getMetadata(ROLES_KEY, decoratedHandler);
      expect(metadata).toEqual(roles);
    });

    it('should export CurrentUser decorator that matches the implementation', () => {
      // Verify the CurrentUser decorator is a function
      expect(typeof barrelExports.CurrentUser).toBe('function');
      // Verify it matches the original implementation
      expect(barrelExports.CurrentUser).toBe(CurrentUser);
      
      // Verify it's a param decorator created with createParamDecorator
      expect(barrelExports.CurrentUser).toHaveProperty('paramtype');
    });
  });

  describe('Type Compatibility', () => {
    it('should maintain type compatibility for Roles decorator', () => {
      // Type verification: Roles should be assignable to a function that takes strings and returns a decorator
      const rolesTest: (...roles: string[]) => ClassDecorator & MethodDecorator = barrelExports.Roles;
      expect(rolesTest).toBeDefined();
    });

    it('should maintain type compatibility for CurrentUser decorator', () => {
      // Type verification: CurrentUser should be a ParameterDecorator
      const currentUserTest: ParameterDecorator = barrelExports.CurrentUser();
      expect(currentUserTest).toBeDefined();
    });
  });

  describe('Implementation Details', () => {
    it('should ensure Roles decorator uses SetMetadata with ROLES_KEY', () => {
      // Create a spy on SetMetadata
      const setMetadataSpy = jest.spyOn(require('@nestjs/common'), 'SetMetadata');
      
      // Call the Roles decorator
      barrelExports.Roles('admin');
      
      // Verify SetMetadata was called with the correct parameters
      expect(setMetadataSpy).toHaveBeenCalledWith(ROLES_KEY, ['admin']);
      
      // Restore the original implementation
      setMetadataSpy.mockRestore();
    });

    it('should ensure backward compatibility with existing imports', () => {
      // Verify that the barrel exports can be used interchangeably with direct imports
      const directRoles = Roles('admin');
      const barrelRoles = barrelExports.Roles('admin');
      
      // Both should produce the same type of decorator
      expect(typeof directRoles).toBe(typeof barrelRoles);
      
      // Both should apply metadata in the same way
      const mockHandler1 = {};
      const mockHandler2 = {};
      
      directRoles(mockHandler1);
      barrelRoles(mockHandler2);
      
      const metadata1 = Reflect.getMetadata(ROLES_KEY, mockHandler1);
      const metadata2 = Reflect.getMetadata(ROLES_KEY, mockHandler2);
      
      expect(metadata1).toEqual(metadata2);
    });
  });
});