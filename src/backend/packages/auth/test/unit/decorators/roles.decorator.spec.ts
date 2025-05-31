import 'reflect-metadata';
import { Roles, ROLES_KEY } from '../../../src/decorators/roles.decorator';

describe('Roles Decorator', () => {
  // Test the ROLES_KEY constant value
  it('should define ROLES_KEY as "roles"', () => {
    expect(ROLES_KEY).toBe('roles');
  });

  // Test the Roles decorator with a single role on a class
  it('should enhance class with single role metadata', () => {
    @Roles('admin')
    class TestController {}

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(metadata).toEqual(['admin']);
  });

  // Test the Roles decorator with multiple roles on a class
  it('should enhance class with multiple roles metadata', () => {
    @Roles('admin', 'user')
    class TestController {}

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController);
    expect(metadata).toEqual(['admin', 'user']);
  });

  // Test the Roles decorator with a single role on a method
  it('should enhance method with single role metadata', () => {
    class TestController {
      @Roles('admin')
      public testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['admin']);
  });

  // Test the Roles decorator with multiple roles on a method
  it('should enhance method with multiple roles metadata', () => {
    class TestController {
      @Roles('admin', 'user')
      public testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['admin', 'user']);
  });

  // Test the Roles decorator with journey-specific roles
  it('should support journey-specific role values', () => {
    class TestController {
      @Roles('health:viewer', 'care:provider', 'plan:manager')
      public testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['health:viewer', 'care:provider', 'plan:manager']);
  });

  // Test the Roles decorator with a mix of core and journey-specific roles
  it('should support a mix of core and journey-specific roles', () => {
    class TestController {
      @Roles('admin', 'health:viewer')
      public testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.prototype.testMethod);
    expect(metadata).toEqual(['admin', 'health:viewer']);
  });

  // Test the Roles decorator with static methods
  it('should enhance static method with role metadata', () => {
    class TestController {
      @Roles('admin')
      public static testMethod() {}
    }

    const metadata = Reflect.getMetadata(ROLES_KEY, TestController.testMethod);
    expect(metadata).toEqual(['admin']);
  });
});