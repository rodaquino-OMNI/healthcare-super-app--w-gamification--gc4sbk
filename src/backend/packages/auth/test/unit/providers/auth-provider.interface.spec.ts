import { JwtPayload } from '@austa/interfaces/auth';
import { AuthProvider } from '../../../src/providers/auth-provider.interface';

/**
 * These tests validate that the AuthProvider interface correctly defines
 * the contract that all authentication providers must implement.
 */
describe('AuthProvider Interface', () => {
  // Define a simple user type for testing
  interface TestUser {
    id: string;
    email: string;
    name: string;
  }

  // Define simple credentials type for testing
  interface TestCredentials {
    email: string;
    password: string;
  }

  describe('Valid Implementation', () => {
    // This class correctly implements the AuthProvider interface
    class ValidAuthProvider implements AuthProvider<TestUser, TestCredentials> {
      async validateCredentials(credentials: TestCredentials): Promise<TestUser | null> {
        // Mock implementation
        return credentials.email === 'valid@example.com'
          ? { id: '1', email: credentials.email, name: 'Test User' }
          : null;
      }

      async validateToken(payload: JwtPayload): Promise<TestUser | null> {
        // Mock implementation
        return payload.sub
          ? { id: payload.sub, email: 'valid@example.com', name: 'Test User' }
          : null;
      }

      async findUserById(userId: string): Promise<TestUser | null> {
        // Mock implementation
        return userId === '1'
          ? { id: userId, email: 'valid@example.com', name: 'Test User' }
          : null;
      }

      async findUserByEmail(email: string): Promise<TestUser | null> {
        // Mock implementation
        return email === 'valid@example.com'
          ? { id: '1', email, name: 'Test User' }
          : null;
      }

      async createAccessToken(user: TestUser): Promise<string> {
        // Mock implementation
        return `access-token-for-${user.id}`;
      }

      async createRefreshToken(user: TestUser): Promise<string> {
        // Mock implementation
        return `refresh-token-for-${user.id}`;
      }

      async refreshAccessToken(refreshToken: string): Promise<string | null> {
        // Mock implementation
        return refreshToken.startsWith('refresh-token-for-')
          ? `new-access-token-for-${refreshToken.split('-').pop()}`
          : null;
      }

      async revokeTokens(userId: string): Promise<void> {
        // Mock implementation - just a no-op for testing
        return;
      }
    }

    it('should allow instantiation of a valid implementation', () => {
      const provider = new ValidAuthProvider();
      expect(provider).toBeInstanceOf(ValidAuthProvider);
    });

    it('should have all required methods', () => {
      const provider = new ValidAuthProvider();
      expect(typeof provider.validateCredentials).toBe('function');
      expect(typeof provider.validateToken).toBe('function');
      expect(typeof provider.findUserById).toBe('function');
      expect(typeof provider.findUserByEmail).toBe('function');
      expect(typeof provider.createAccessToken).toBe('function');
      expect(typeof provider.createRefreshToken).toBe('function');
      expect(typeof provider.refreshAccessToken).toBe('function');
      expect(typeof provider.revokeTokens).toBe('function');
    });

    it('should correctly validate credentials', async () => {
      const provider = new ValidAuthProvider();
      const validCredentials: TestCredentials = { email: 'valid@example.com', password: 'password' };
      const invalidCredentials: TestCredentials = { email: 'invalid@example.com', password: 'password' };

      const validResult = await provider.validateCredentials(validCredentials);
      const invalidResult = await provider.validateCredentials(invalidCredentials);

      expect(validResult).not.toBeNull();
      expect(validResult?.id).toBe('1');
      expect(validResult?.email).toBe('valid@example.com');
      expect(invalidResult).toBeNull();
    });

    it('should correctly validate tokens', async () => {
      const provider = new ValidAuthProvider();
      const validPayload: JwtPayload = { sub: '1', iat: 1234567890, exp: 1234567890 };
      const invalidPayload: JwtPayload = { iat: 1234567890, exp: 1234567890 };

      const validResult = await provider.validateToken(validPayload);
      const invalidResult = await provider.validateToken(invalidPayload);

      expect(validResult).not.toBeNull();
      expect(validResult?.id).toBe('1');
      expect(invalidResult).toBeNull();
    });

    it('should correctly find users by ID', async () => {
      const provider = new ValidAuthProvider();
      const validUser = await provider.findUserById('1');
      const invalidUser = await provider.findUserById('999');

      expect(validUser).not.toBeNull();
      expect(validUser?.id).toBe('1');
      expect(invalidUser).toBeNull();
    });

    it('should correctly find users by email', async () => {
      const provider = new ValidAuthProvider();
      const validUser = await provider.findUserByEmail('valid@example.com');
      const invalidUser = await provider.findUserByEmail('invalid@example.com');

      expect(validUser).not.toBeNull();
      expect(validUser?.email).toBe('valid@example.com');
      expect(invalidUser).toBeNull();
    });

    it('should create access tokens', async () => {
      const provider = new ValidAuthProvider();
      const user: TestUser = { id: '1', email: 'valid@example.com', name: 'Test User' };
      const token = await provider.createAccessToken(user);

      expect(token).toBe('access-token-for-1');
    });

    it('should create refresh tokens', async () => {
      const provider = new ValidAuthProvider();
      const user: TestUser = { id: '1', email: 'valid@example.com', name: 'Test User' };
      const token = await provider.createRefreshToken(user);

      expect(token).toBe('refresh-token-for-1');
    });

    it('should refresh access tokens', async () => {
      const provider = new ValidAuthProvider();
      const validToken = 'refresh-token-for-1';
      const invalidToken = 'invalid-token';

      const newToken = await provider.refreshAccessToken(validToken);
      const nullToken = await provider.refreshAccessToken(invalidToken);

      expect(newToken).toBe('new-access-token-for-1');
      expect(nullToken).toBeNull();
    });

    it('should revoke tokens', async () => {
      const provider = new ValidAuthProvider();
      // Just testing that the method exists and can be called without errors
      await expect(provider.revokeTokens('1')).resolves.not.toThrow();
    });
  });

  describe('Invalid Implementations', () => {
    it('should not allow missing methods', () => {
      // This class is missing required methods
      class InvalidAuthProvider implements Partial<AuthProvider<TestUser, TestCredentials>> {
        async validateCredentials(credentials: TestCredentials): Promise<TestUser | null> {
          return null;
        }

        // Missing other required methods
      }

      // TypeScript should catch this at compile time, but we can verify at runtime
      const provider = new InvalidAuthProvider() as unknown as AuthProvider<TestUser, TestCredentials>;
      expect(provider.validateCredentials).toBeDefined();
      expect(provider.validateToken).toBeUndefined();
      expect(provider.findUserById).toBeUndefined();
      expect(provider.findUserByEmail).toBeUndefined();
      expect(provider.createAccessToken).toBeUndefined();
      expect(provider.createRefreshToken).toBeUndefined();
      expect(provider.refreshAccessToken).toBeUndefined();
      expect(provider.revokeTokens).toBeUndefined();
    });

    it('should not allow incorrect method signatures', () => {
      // This class has incorrect method signatures
      class IncorrectSignatureProvider {
        // Wrong return type (string instead of Promise<TestUser | null>)
        validateCredentials(credentials: TestCredentials): string {
          return 'not-a-user';
        }

        // Wrong parameter type (string instead of JwtPayload)
        async validateToken(token: string): Promise<TestUser | null> {
          return null;
        }

        // Other methods with incorrect signatures...
      }

      // TypeScript should catch this at compile time
      // This is just a runtime check to ensure the methods exist but have wrong signatures
      const provider = new IncorrectSignatureProvider() as unknown as AuthProvider<TestUser, TestCredentials>;
      expect(typeof provider.validateCredentials).toBe('function');
      expect(provider.validateCredentials({ email: '', password: '' })).not.toBeInstanceOf(Promise);
    });
  });

  describe('Generic Type Parameters', () => {
    // Test with different user type
    interface AdminUser {
      id: string;
      email: string;
      role: 'admin' | 'superadmin';
      permissions: string[];
    }

    // Test with different credentials type
    interface ApiKeyCredentials {
      apiKey: string;
      clientId: string;
    }

    it('should support different user types', () => {
      class AdminAuthProvider implements AuthProvider<AdminUser> {
        async validateCredentials(credentials: { email: string; password: string }): Promise<AdminUser | null> {
          return {
            id: '1',
            email: credentials.email,
            role: 'admin',
            permissions: ['read', 'write']
          };
        }

        async validateToken(payload: JwtPayload): Promise<AdminUser | null> {
          return payload.sub ? {
            id: payload.sub,
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['read', 'write']
          } : null;
        }

        async findUserById(userId: string): Promise<AdminUser | null> {
          return {
            id: userId,
            email: 'admin@example.com',
            role: 'admin',
            permissions: ['read', 'write']
          };
        }

        async findUserByEmail(email: string): Promise<AdminUser | null> {
          return {
            id: '1',
            email,
            role: 'admin',
            permissions: ['read', 'write']
          };
        }

        async createAccessToken(user: AdminUser): Promise<string> {
          return `admin-access-token-for-${user.id}`;
        }

        async createRefreshToken(user: AdminUser): Promise<string> {
          return `admin-refresh-token-for-${user.id}`;
        }

        async refreshAccessToken(refreshToken: string): Promise<string | null> {
          return refreshToken.startsWith('admin-refresh-token-for-') ? 
            `new-admin-access-token-for-${refreshToken.split('-').pop()}` : null;
        }

        async revokeTokens(userId: string): Promise<void> {
          return;
        }
      }

      const provider = new AdminAuthProvider();
      expect(provider).toBeInstanceOf(AdminAuthProvider);
    });

    it('should support different credentials types', () => {
      class ApiKeyAuthProvider implements AuthProvider<TestUser, ApiKeyCredentials> {
        async validateCredentials(credentials: ApiKeyCredentials): Promise<TestUser | null> {
          return credentials.apiKey === 'valid-key' ? {
            id: '1',
            email: 'api@example.com',
            name: 'API User'
          } : null;
        }

        async validateToken(payload: JwtPayload): Promise<TestUser | null> {
          return payload.sub ? {
            id: payload.sub,
            email: 'api@example.com',
            name: 'API User'
          } : null;
        }

        async findUserById(userId: string): Promise<TestUser | null> {
          return {
            id: userId,
            email: 'api@example.com',
            name: 'API User'
          };
        }

        async findUserByEmail(email: string): Promise<TestUser | null> {
          return {
            id: '1',
            email,
            name: 'API User'
          };
        }

        async createAccessToken(user: TestUser): Promise<string> {
          return `api-access-token-for-${user.id}`;
        }

        async createRefreshToken(user: TestUser): Promise<string> {
          return `api-refresh-token-for-${user.id}`;
        }

        async refreshAccessToken(refreshToken: string): Promise<string | null> {
          return refreshToken.startsWith('api-refresh-token-for-') ?
            `new-api-access-token-for-${refreshToken.split('-').pop()}` : null;
        }

        async revokeTokens(userId: string): Promise<void> {
          return;
        }
      }

      const provider = new ApiKeyAuthProvider();
      expect(provider).toBeInstanceOf(ApiKeyAuthProvider);

      // Test with API key credentials
      const testCredentials: ApiKeyCredentials = {
        apiKey: 'valid-key',
        clientId: 'client-1'
      };

      expect(() => provider.validateCredentials(testCredentials)).not.toThrow();
    });
  });
});