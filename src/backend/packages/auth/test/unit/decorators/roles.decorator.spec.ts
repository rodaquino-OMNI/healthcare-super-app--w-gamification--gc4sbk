import { SetMetadata } from '@nestjs/common';
import 'reflect-metadata';
import { Roles, ROLES_KEY } from '../../../src/decorators/roles.decorator';

// Mock the SetMetadata function to verify it's called correctly
jest.mock('@nestjs/common', () => ({
  SetMetadata: jest.fn().mockImplementation((key, value) => {
    return function(target: any, propertyKey?: string | symbol, descriptor?: any) {
      if (descriptor) {
        Reflect.defineMetadata(key, value, descriptor.value);
        return descriptor;
      }
      Reflect.defineMetadata(key, value, target);
      return target;
    };
  }),
}));

describe('Roles Decorator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should define ROLES_KEY as "roles"', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  it('should call SetMetadata with the correct key and roles', () => {
    // Arrange
    const roles = ['admin', 'user'];
    
    // Act
    Roles(...roles);
    
    // Assert
    expect(SetMetadata).toHaveBeenCalledWith(ROLES_KEY, roles);
  });

  it('should attach metadata to a class when used as a class decorator', () => {
    // Arrange & Act
    @Roles('admin')
    class TestController {}
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(metadata).toEqual(['admin']);
  });

  it('should attach metadata to a method when used as a method decorator', () => {
    // Arrange & Act
    class TestController {
      @Roles('user')
      public testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['user']);
  });

  it('should handle multiple roles', () => {
    // Arrange & Act
    class TestController {
      @Roles('admin', 'user')
      public testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['admin', 'user']);
  });

  it('should handle journey-specific roles', () => {
    // Arrange & Act
    class TestController {
      @Roles('health:viewer', 'care:provider', 'plan:manager')
      public testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['health:viewer', 'care:provider', 'plan:manager']);
  });

  it('should handle a mix of core and journey-specific roles', () => {
    // Arrange & Act
    class TestController {
      @Roles('admin', 'health:manager')
      public testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['admin', 'health:manager']);
  });

  it('should handle static methods', () => {
    // Arrange & Act
    class TestController {
      @Roles('admin')
      public static testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.testMethod);
    expect(metadata).toEqual(['admin']);
  });

  it('should work with empty roles array', () => {
    // Arrange & Act
    class TestController {
      @Roles()
      public testMethod() {}
    }
    
    // Assert
    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual([]);
  });
});