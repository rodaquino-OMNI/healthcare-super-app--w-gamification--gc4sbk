/**
 * Global setup file for auth package tests
 * 
 * This file configures the testing environment for all auth package tests,
 * sets up mocks for external dependencies, defines custom matchers for
 * authentication assertions, and initializes test databases.
 */

import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '@austa/logging';
import { PrismaService } from '@austa/database';
import { ITokenPayload, IUser } from '../src/interfaces';
import * as jwt from 'jsonwebtoken';

// Import mocks
import { 
  mockLoggerService,
  mockConfigService,
  mockJwtService,
  mockPrismaService,
  mockTokenService,
  mockDatabaseAuthProvider,
  mockRedisService
} from './mocks';

// Import test helpers
import {
  generateTestToken,
  createBearerAuthHeader,
  mockAuthenticatedRequest
} from './helpers/jwt-token.helper';

// Define global variables for test state
declare global {
  // eslint-disable-next-line no-var
  var testJwtSecret: string;
  // eslint-disable-next-line no-var
  var testRefreshSecret: string;
  
  namespace jest {
    interface Matchers<R> {
      /**
       * Custom matcher to check if a response contains a valid JWT token
       */
      toContainValidJwtToken(): R;
      
      /**
       * Custom matcher to check if a user has specific permissions
       */
      toHavePermission(permission: string): R;
      
      /**
       * Custom matcher to check if a user belongs to a specific role
       */
      toHaveRole(role: string): R;
      
      /**
       * Custom matcher to check if a token is expired
       */
      toBeExpiredToken(): R;
      
      /**
       * Custom matcher to check if a token contains specific claims
       */
      toContainTokenClaim(claim: string, value?: any): R;
    }
  }
}

// Set up global test variables
global.testJwtSecret = 'test-jwt-secret-key-for-auth-package-tests';
global.testRefreshSecret = 'test-refresh-secret-key-for-auth-package-tests';

// Mock external services before tests run
jest.mock('@austa/logging', () => ({
  LoggerService: jest.fn().mockImplementation(() => mockLoggerService),
}));

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => mockConfigService),
}));

jest.mock('@nestjs/jwt', () => ({
  JwtService: jest.fn().mockImplementation(() => mockJwtService),
}));

jest.mock('@austa/database', () => ({
  PrismaService: jest.fn().mockImplementation(() => mockPrismaService),
}));

// Set up Redis mock
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisService);
});

// Add custom matchers for authentication testing
expect.extend({
  toContainValidJwtToken(received) {
    if (!received || !received.access_token) {
      return {
        message: () => `Expected response to contain a valid JWT token, but no token was found`,
        pass: false,
      };
    }
    
    try {
      const decoded = jwt.verify(received.access_token, global.testJwtSecret);
      return {
        message: () => `Expected response to not contain a valid JWT token, but a valid token was found`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected response to contain a valid JWT token, but token verification failed: ${error.message}`,
        pass: false,
      };
    }
  },
  
  toHavePermission(received: IUser, permission: string) {
    if (!received || !received.permissions) {
      return {
        message: () => `Expected user to have permission "${permission}", but user has no permissions`,
        pass: false,
      };
    }
    
    const hasPermission = received.permissions.some(p => p.name === permission);
    return {
      message: () => hasPermission
        ? `Expected user to not have permission "${permission}", but it was found`
        : `Expected user to have permission "${permission}", but it was not found`,
      pass: hasPermission,
    };
  },
  
  toHaveRole(received: IUser, role: string) {
    if (!received || !received.roles) {
      return {
        message: () => `Expected user to have role "${role}", but user has no roles`,
        pass: false,
      };
    }
    
    const hasRole = received.roles.some(r => r.name === role);
    return {
      message: () => hasRole
        ? `Expected user to not have role "${role}", but it was found`
        : `Expected user to have role "${role}", but it was not found`,
      pass: hasRole,
    };
  },
  
  toBeExpiredToken(received: string) {
    if (!received) {
      return {
        message: () => `Expected token to be expired, but no token was provided`,
        pass: false,
      };
    }
    
    try {
      jwt.verify(received, global.testJwtSecret);
      return {
        message: () => `Expected token to be expired, but it is still valid`,
        pass: false,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          message: () => `Expected token to not be expired, but it is expired`,
          pass: true,
        };
      }
      
      return {
        message: () => `Expected token to be expired, but verification failed for another reason: ${error.message}`,
        pass: false,
      };
    }
  },
  
  toContainTokenClaim(received: string, claim: string, value?: any) {
    if (!received) {
      return {
        message: () => `Expected token to contain claim "${claim}", but no token was provided`,
        pass: false,
      };
    }
    
    try {
      const decoded = jwt.decode(received) as ITokenPayload;
      
      if (!decoded || typeof decoded !== 'object') {
        return {
          message: () => `Expected token to contain claim "${claim}", but token could not be decoded`,
          pass: false,
        };
      }
      
      const hasClaim = claim in decoded;
      
      if (value !== undefined) {
        const hasValue = decoded[claim] === value;
        return {
          message: () => hasValue
            ? `Expected token to not have claim "${claim}" with value ${value}, but it was found`
            : `Expected token to have claim "${claim}" with value ${value}, but it has ${decoded[claim]}`,
          pass: hasValue,
        };
      }
      
      return {
        message: () => hasClaim
          ? `Expected token to not have claim "${claim}", but it was found`
          : `Expected token to have claim "${claim}", but it was not found`,
        pass: hasClaim,
      };
    } catch (error) {
      return {
        message: () => `Expected token to contain claim "${claim}", but token decoding failed: ${error.message}`,
        pass: false,
      };
    }
  },
});

// Set up global before/after hooks
beforeAll(async () => {
  // Initialize test database if needed
  await mockPrismaService.$connect();
  
  // Configure mock services with test values
  mockConfigService.get.mockImplementation((key: string) => {
    switch (key) {
      case 'authService.jwt.secret':
      case 'auth.jwt.secret':
        return global.testJwtSecret;
      case 'authService.jwt.refreshSecret':
      case 'auth.jwt.refreshSecret':
        return global.testRefreshSecret;
      case 'authService.jwt.accessTokenExpiration':
      case 'auth.jwt.accessTokenExpiration':
        return '15m';
      case 'authService.jwt.refreshTokenExpiration':
      case 'auth.jwt.refreshTokenExpiration':
        return '7d';
      default:
        return undefined;
    }
  });
  
  // Configure JWT service mock
  mockJwtService.sign.mockImplementation((payload: any, options?: any) => {
    return jwt.sign(payload, global.testJwtSecret, {
      expiresIn: options?.expiresIn || '15m',
      ...(options || {}),
    });
  });
  
  mockJwtService.verify.mockImplementation((token: string) => {
    return jwt.verify(token, global.testJwtSecret);
  });
  
  mockJwtService.decode.mockImplementation((token: string) => {
    return jwt.decode(token);
  });
});

afterAll(async () => {
  // Clean up test database
  await mockPrismaService.$disconnect();
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset mock implementations to default behavior
  mockLoggerService.debug.mockClear();
  mockLoggerService.info.mockClear();
  mockLoggerService.warn.mockClear();
  mockLoggerService.error.mockClear();
  
  mockConfigService.get.mockClear();
  mockJwtService.sign.mockClear();
  mockJwtService.verify.mockClear();
  mockJwtService.decode.mockClear();
  
  mockRedisService.get.mockClear();
  mockRedisService.set.mockClear();
  mockRedisService.del.mockClear();
  
  // Reset database mock
  Object.values(mockPrismaService).forEach(model => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach(method => {
        if (jest.isMockFunction(method)) {
          method.mockClear();
        }
      });
    }
  });
});

// Export test utilities for use in test files
export {
  generateTestToken,
  createBearerAuthHeader,
  mockAuthenticatedRequest,
};