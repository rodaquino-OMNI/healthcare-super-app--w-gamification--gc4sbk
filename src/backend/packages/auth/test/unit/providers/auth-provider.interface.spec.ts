/**
 * @file Unit tests for the authentication provider interface
 * 
 * These tests validate that the IAuthProvider interface defines the correct method signatures
 * and enforces the contract that all authentication providers must implement.
 */

import { Test } from '@nestjs/testing';
import { JwtPayload } from '@austa/interfaces/auth';
import { IAuthProvider } from '../../../src/providers/auth-provider.interface';

// Define test types for user and credentials
interface TestUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

interface TestCredentials {
  username: string;
  password: string;
}

interface ExtendedUser extends TestUser {
  profilePicture: string;
  lastLogin: Date;
  preferences: Record<string, any>;
}

interface ExtendedCredentials extends TestCredentials {
  rememberMe: boolean;
  deviceId: string;
}

interface CustomTokenPayload extends JwtPayload {
  deviceInfo: {
    id: string;
    name: string;
    platform: string;
  };
  customClaims: Record<string, any>;
}

/**
 * Complete implementation of the auth provider interface for testing
 */
class CompleteAuthProvider implements IAuthProvider<TestUser, TestCredentials> {
  async validateCredentials(credentials: TestCredentials): Promise<TestUser | null> {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile']
    };
  }

  async validateToken(token: string): Promise<TestUser | null> {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile']
    };
  }

  async getUserById(id: string): Promise<TestUser | null> {
    return {
      id,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile']
    };
  }

  async generateToken(user: TestUser, expiresIn?: number): Promise<string> {
    return 'test-token';
  }

  async decodeToken(token: string): Promise<JwtPayload | null> {
    return {
      sub: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    };
  }

  extractTokenFromRequest(request: any): string | null {
    return 'test-token';
  }

  async revokeToken(token: string): Promise<boolean> {
    return true;
  }

  async refreshToken(refreshToken: string): Promise<string | null> {
    return 'new-test-token';
  }
}

/**
 * Implementation with extended user and credential types
 */
class ExtendedAuthProvider implements IAuthProvider<ExtendedUser, ExtendedCredentials, CustomTokenPayload> {
  async validateCredentials(credentials: ExtendedCredentials): Promise<ExtendedUser | null> {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile'],
      profilePicture: 'https://example.com/profile.jpg',
      lastLogin: new Date(),
      preferences: { theme: 'dark' }
    };
  }

  async validateToken(token: string): Promise<ExtendedUser | null> {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile'],
      profilePicture: 'https://example.com/profile.jpg',
      lastLogin: new Date(),
      preferences: { theme: 'dark' }
    };
  }

  async getUserById(id: string): Promise<ExtendedUser | null> {
    return {
      id,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile'],
      profilePicture: 'https://example.com/profile.jpg',
      lastLogin: new Date(),
      preferences: { theme: 'dark' }
    };
  }

  async generateToken(user: ExtendedUser, expiresIn?: number): Promise<string> {
    return 'extended-test-token';
  }

  async decodeToken(token: string): Promise<CustomTokenPayload | null> {
    return {
      sub: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile'],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      deviceInfo: {
        id: 'device-123',
        name: 'iPhone 13',
        platform: 'iOS'
      },
      customClaims: {
        journeyContext: 'health'
      }
    };
  }

  extractTokenFromRequest(request: any): string | null {
    return 'extended-test-token';
  }

  async revokeToken(token: string): Promise<boolean> {
    return true;
  }

  async refreshToken(refreshToken: string): Promise<string | null> {
    return 'new-extended-test-token';
  }
}

/**
 * Incomplete implementation missing required methods
 * This is used to verify that the interface enforces the contract
 * TypeScript should show compilation errors for this class
 */
// @ts-expect-error - Intentionally incomplete implementation
class IncompleteAuthProvider implements IAuthProvider<TestUser, TestCredentials> {
  async validateCredentials(credentials: TestCredentials): Promise<TestUser | null> {
    return {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile']
    };
  }

  // Missing validateToken method

  async getUserById(id: string): Promise<TestUser | null> {
    return {
      id,
      email: 'test@example.com',
      name: 'Test User',
      roles: ['user'],
      permissions: ['read:profile']
    };
  }

  // Missing other required methods
}

/**
 * Implementation with incorrect method signatures
 * This is used to verify that the interface enforces correct method signatures
 * TypeScript should show compilation errors for this class
 */
// @ts-expect-error - Intentionally incorrect method signatures
class IncorrectSignatureAuthProvider implements IAuthProvider<TestUser, TestCredentials> {
  // Incorrect return type (string instead of Promise<TestUser | null>)
  validateCredentials(credentials: TestCredentials): string {
    return 'invalid-return-type';
  }

  // Incorrect parameter type (number instead of string)
  async validateToken(token: number): Promise<TestUser | null> {
    return null;
  }

  // Other methods with correct signatures
  async getUserById(id: string): Promise<TestUser | null> {
    return null;
  }

  async generateToken(user: TestUser, expiresIn?: number): Promise<string> {
    return '';
  }

  async decodeToken(token: string): Promise<JwtPayload | null> {
    return null;
  }

  extractTokenFromRequest(request: any): string | null {
    return null;
  }

  async revokeToken(token: string): Promise<boolean> {
    return false;
  }

  async refreshToken(refreshToken: string): Promise<string | null> {
    return null;
  }
}

describe('IAuthProvider Interface', () => {
  let completeProvider: IAuthProvider<TestUser, TestCredentials>;
  let extendedProvider: IAuthProvider<ExtendedUser, ExtendedCredentials, CustomTokenPayload>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: 'CompleteAuthProvider',
          useClass: CompleteAuthProvider,
        },
        {
          provide: 'ExtendedAuthProvider',
          useClass: ExtendedAuthProvider,
        },
      ],
    }).compile();

    completeProvider = moduleRef.get<IAuthProvider<TestUser, TestCredentials>>('CompleteAuthProvider');
    extendedProvider = moduleRef.get<IAuthProvider<ExtendedUser, ExtendedCredentials, CustomTokenPayload>>('ExtendedAuthProvider');
  });

  describe('Interface Contract', () => {
    it('should define validateCredentials method', () => {
      expect(completeProvider.validateCredentials).toBeDefined();
      expect(typeof completeProvider.validateCredentials).toBe('function');
    });

    it('should define validateToken method', () => {
      expect(completeProvider.validateToken).toBeDefined();
      expect(typeof completeProvider.validateToken).toBe('function');
    });

    it('should define getUserById method', () => {
      expect(completeProvider.getUserById).toBeDefined();
      expect(typeof completeProvider.getUserById).toBe('function');
    });

    it('should define generateToken method', () => {
      expect(completeProvider.generateToken).toBeDefined();
      expect(typeof completeProvider.generateToken).toBe('function');
    });

    it('should define decodeToken method', () => {
      expect(completeProvider.decodeToken).toBeDefined();
      expect(typeof completeProvider.decodeToken).toBe('function');
    });

    it('should define extractTokenFromRequest method', () => {
      expect(completeProvider.extractTokenFromRequest).toBeDefined();
      expect(typeof completeProvider.extractTokenFromRequest).toBe('function');
    });

    it('should define revokeToken method', () => {
      expect(completeProvider.revokeToken).toBeDefined();
      expect(typeof completeProvider.revokeToken).toBe('function');
    });

    it('should define refreshToken method', () => {
      expect(completeProvider.refreshToken).toBeDefined();
      expect(typeof completeProvider.refreshToken).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('validateCredentials should return a Promise resolving to user or null', async () => {
      const credentials: TestCredentials = { username: 'test', password: 'password' };
      const result = await completeProvider.validateCredentials(credentials);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('roles');
    });

    it('validateToken should accept a string and return a Promise resolving to user or null', async () => {
      const result = await completeProvider.validateToken('test-token');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('roles');
    });

    it('getUserById should accept a string and return a Promise resolving to user or null', async () => {
      const result = await completeProvider.getUserById('1');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('roles');
    });

    it('generateToken should accept a user and optional expiresIn and return a Promise resolving to string', async () => {
      const user: TestUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['user'],
        permissions: ['read:profile']
      };
      
      const result = await completeProvider.generateToken(user);
      expect(typeof result).toBe('string');
      
      const resultWithExpiration = await completeProvider.generateToken(user, 3600);
      expect(typeof resultWithExpiration).toBe('string');
    });

    it('decodeToken should accept a string and return a Promise resolving to payload or null', async () => {
      const result = await completeProvider.decodeToken('test-token');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('roles');
    });

    it('extractTokenFromRequest should accept a request and return a string or null', () => {
      const mockRequest = { headers: { authorization: 'Bearer test-token' } };
      const result = completeProvider.extractTokenFromRequest(mockRequest);
      
      expect(typeof result).toBe('string');
    });

    it('revokeToken should accept a string and return a Promise resolving to boolean', async () => {
      const result = await completeProvider.revokeToken('test-token');
      
      expect(typeof result).toBe('boolean');
    });

    it('refreshToken should accept a string and return a Promise resolving to string or null', async () => {
      const result = await completeProvider.refreshToken('refresh-token');
      
      expect(typeof result).toBe('string');
    });
  });

  describe('Generic Type Parameters', () => {
    it('should work with extended user and credential types', async () => {
      const credentials: ExtendedCredentials = { 
        username: 'test', 
        password: 'password',
        rememberMe: true,
        deviceId: 'device-123'
      };
      
      const result = await extendedProvider.validateCredentials(credentials);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('roles');
      expect(result).toHaveProperty('profilePicture');
      expect(result).toHaveProperty('lastLogin');
      expect(result).toHaveProperty('preferences');
    });

    it('should work with custom token payload type', async () => {
      const result = await extendedProvider.decodeToken('extended-test-token');
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('sub');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('deviceInfo');
      expect(result).toHaveProperty('customClaims');
      expect(result?.deviceInfo).toHaveProperty('id');
      expect(result?.deviceInfo).toHaveProperty('platform');
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct parameter types', async () => {
      // These tests verify compile-time type checking
      // They don't actually run assertions but ensure the TypeScript compiler enforces types
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.validateCredentials('invalid-parameter');
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.validateToken(123);
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.getUserById(123);
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.generateToken('invalid-user');
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.decodeToken(123);
      
      // @ts-expect-error - Intentionally incorrect parameter type
      completeProvider.extractTokenFromRequest('invalid-request');
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.revokeToken(123);
      
      // @ts-expect-error - Intentionally incorrect parameter type
      await completeProvider.refreshToken(123);
      
      // These should pass type checking
      await completeProvider.validateCredentials({ username: 'test', password: 'password' });
      await completeProvider.validateToken('valid-token');
      await completeProvider.getUserById('valid-id');
    });
  });

  describe('Implementation Compatibility', () => {
    it('should allow assignment of complete implementation to interface type', () => {
      // This test verifies that a complete implementation can be assigned to the interface type
      const provider: IAuthProvider<TestUser, TestCredentials> = new CompleteAuthProvider();
      expect(provider).toBeInstanceOf(CompleteAuthProvider);
    });

    it('should allow assignment of extended implementation to interface type', () => {
      // This test verifies that an extended implementation can be assigned to the interface type
      const provider: IAuthProvider<ExtendedUser, ExtendedCredentials, CustomTokenPayload> = new ExtendedAuthProvider();
      expect(provider).toBeInstanceOf(ExtendedAuthProvider);
    });

    it('should not allow assignment of incomplete implementation to interface type', () => {
      // This test verifies compile-time type checking
      // It doesn't actually run assertions but ensures the TypeScript compiler enforces the contract
      
      // @ts-expect-error - Intentionally incomplete implementation
      const provider: IAuthProvider<TestUser, TestCredentials> = new IncompleteAuthProvider();
    });

    it('should not allow assignment of implementation with incorrect signatures to interface type', () => {
      // This test verifies compile-time type checking
      // It doesn't actually run assertions but ensures the TypeScript compiler enforces method signatures
      
      // @ts-expect-error - Intentionally incorrect method signatures
      const provider: IAuthProvider<TestUser, TestCredentials> = new IncorrectSignatureAuthProvider();
    });
  });
});