/**
 * Global setup file for auth package tests
 * 
 * This file configures the testing environment for all auth package tests,
 * sets up mocks for external dependencies, defines custom matchers for
 * authentication assertions, and initializes test databases.
 */

import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@austa/logging';
import { TokenService } from '../src/token.service';
import { AuthService } from '../src/auth.service';
import { PrismaService } from '@austa/database';
import { ConfigService } from '@nestjs/config';

// Import Jest types
import { expect } from '@jest/globals';

// Define custom matchers for authentication assertions
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher to verify if a JWT token is valid
       * @param expectedPayload Optional expected payload to match against the token
       */
      toBeValidToken(expectedPayload?: Record<string, any>): R;
      
      /**
       * Custom matcher to verify if a token has specific permissions
       * @param permissions Array of expected permissions
       */
      toHavePermissions(permissions: string[]): R;
      
      /**
       * Custom matcher to verify if a token belongs to a specific user
       * @param userId Expected user ID
       */
      toBelongToUser(userId: string | number): R;
      
      /**
       * Custom matcher to verify if a token has specific roles
       * @param roles Array of expected roles
       */
      toHaveRoles(roles: string[]): R;
    }
  }
}

// Mock services for external dependencies
jest.mock('@austa/logging', () => ({
  LoggerService: jest.fn().mockImplementation(() => ({
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  })),
}));

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => ({
    sign: jest.fn().mockImplementation((payload) => {
      // Create a mock token with the payload embedded for testing
      return `mock_token.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
    }),
    verify: jest.fn().mockImplementation((token) => {
      // Extract and return the payload from the mock token
      try {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid token format');
        return JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } catch (error) {
        throw new Error('Invalid token');
      }
    }),
    decode: jest.fn().mockImplementation((token) => {
      // Extract and return the payload from the mock token without verification
      try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(Buffer.from(parts[1], 'base64').toString());
      } catch (error) {
        return null;
      }
    }),
  })),
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockImplementation((key) => {
      // Mock configuration values for testing
      const config = {
        'authService.jwt.secret': 'test-secret',
        'authService.jwt.accessTokenExpiration': '1h',
        'authService.jwt.refreshTokenExpiration': '7d',
      };
      return config[key] || null;
    }),
  })),
}));

jest.mock('@austa/database', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    // Mock database methods as needed for tests
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    permission: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback({
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      permission: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
    })),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Implement custom matchers for authentication assertions
expect.extend({
  toBeValidToken(received, expectedPayload) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () => `Expected ${received} to be a string token`,
      };
    }

    try {
      // Use the mocked JwtService to verify the token
      const jwtService = new JwtService();
      const payload = jwtService.verify(received);
      
      // If expectedPayload is provided, check if it matches the actual payload
      if (expectedPayload) {
        const hasAllExpectedProperties = Object.keys(expectedPayload).every(
          (key) => payload[key] === expectedPayload[key]
        );
        
        return {
          pass: hasAllExpectedProperties,
          message: () => hasAllExpectedProperties
            ? `Expected token payload not to match ${JSON.stringify(expectedPayload)}`
            : `Expected token payload to match ${JSON.stringify(expectedPayload)}, but got ${JSON.stringify(payload)}`,
        };
      }
      
      return {
        pass: true,
        message: () => `Expected ${received} not to be a valid token`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a valid token, but verification failed: ${error.message}`,
      };
    }
  },
  
  toHavePermissions(received, permissions) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () => `Expected ${received} to be a string token`,
      };
    }

    try {
      // Use the mocked JwtService to decode the token
      const jwtService = new JwtService();
      const payload = jwtService.decode(received);
      
      if (!payload || !payload.permissions || !Array.isArray(payload.permissions)) {
        return {
          pass: false,
          message: () => `Token does not contain permissions array`,
        };
      }
      
      const hasAllPermissions = permissions.every(
        (permission) => payload.permissions.includes(permission)
      );
      
      return {
        pass: hasAllPermissions,
        message: () => hasAllPermissions
          ? `Expected token not to have permissions ${permissions.join(', ')}`
          : `Expected token to have permissions ${permissions.join(', ')}, but it has ${payload.permissions.join(', ')}`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Failed to decode token: ${error.message}`,
      };
    }
  },
  
  toBelongToUser(received, userId) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () => `Expected ${received} to be a string token`,
      };
    }

    try {
      // Use the mocked JwtService to decode the token
      const jwtService = new JwtService();
      const payload = jwtService.decode(received);
      
      if (!payload || !payload.sub) {
        return {
          pass: false,
          message: () => `Token does not contain subject (user ID)`,
        };
      }
      
      const userIdMatches = payload.sub.toString() === userId.toString();
      
      return {
        pass: userIdMatches,
        message: () => userIdMatches
          ? `Expected token not to belong to user ${userId}`
          : `Expected token to belong to user ${userId}, but it belongs to user ${payload.sub}`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Failed to decode token: ${error.message}`,
      };
    }
  },
  
  toHaveRoles(received, roles) {
    if (typeof received !== 'string') {
      return {
        pass: false,
        message: () => `Expected ${received} to be a string token`,
      };
    }

    try {
      // Use the mocked JwtService to decode the token
      const jwtService = new JwtService();
      const payload = jwtService.decode(received);
      
      if (!payload || !payload.roles || !Array.isArray(payload.roles)) {
        return {
          pass: false,
          message: () => `Token does not contain roles array`,
        };
      }
      
      const hasAllRoles = roles.every(
        (role) => payload.roles.includes(role)
      );
      
      return {
        pass: hasAllRoles,
        message: () => hasAllRoles
          ? `Expected token not to have roles ${roles.join(', ')}`
          : `Expected token to have roles ${roles.join(', ')}, but it has ${payload.roles.join(', ')}`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Failed to decode token: ${error.message}`,
      };
    }
  },
});

// Set up test environment
beforeAll(() => {
  // Initialize any global test resources here
  console.log('Setting up auth package test environment');
});

// Clean up after each test to prevent test pollution
afterEach(() => {
  // Reset all mocks after each test
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Clean up any global test resources here
  console.log('Tearing down auth package test environment');
});