import { jest } from '@jest/globals';
import {
  WithFallback,
  CachedFallback,
  DefaultFallback,
  clearFallbackCache,
  getFallbackCacheSize,
  hasFallbackCacheKey
} from '../../../src/decorators/fallback.decorator';
import { BaseError, ErrorType } from '../../../src/base';

/**
 * Custom error types for testing error filtering
 */
class ServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Interface for testing
 */
interface UserProfile {
  id: string;
  name: string;
  email?: string;
  isDefault?: boolean;
}

/**
 * Mock service with fallback-decorated methods for testing
 */
class MockService {
  public methodCalls = 0;
  public fallbackCalls = 0;
  public lastError: Error | null = null;
  
  /**
   * Method with basic fallback function
   */
  @WithFallback({
    handler: (error, userId) => {
      mockService.fallbackCalls++;
      return { id: userId, name: 'Unknown User', isDefault: true };
    }
  })
  async getUserProfile(userId: string): Promise<UserProfile> {
    this.methodCalls++;
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  
  /**
   * Method with conditional fallback based on error type
   */
  @WithFallback({
    handler: (error, userId) => {
      mockService.fallbackCalls++;
      return { id: userId, name: 'Offline User', isDefault: true };
    },
    condition: (error) => error instanceof ServiceUnavailableError
  })
  async getUserProfileWithCondition(userId: string, errorType: 'service' | 'validation'): Promise<UserProfile> {
    this.methodCalls++;
    
    if (errorType === 'service') {
      throw new ServiceUnavailableError(`Service unavailable for user ${userId}`);
    } else {
      throw new ValidationError(`Invalid user ID: ${userId}`);
    }
  }
  
  /**
   * Method with fallback that also fails
   */
  @WithFallback({
    handler: (error, userId) => {
      mockService.fallbackCalls++;
      throw new Error(`Fallback also failed for user ${userId}`);
    },
    errorType: ErrorType.TECHNICAL,
    errorCode: 'FALLBACK_FAILED'
  })
  async getUserProfileWithFailingFallback(userId: string): Promise<UserProfile> {
    this.methodCalls++;
    throw new Error(`Original method failed for user ${userId}`);
  }
  
  /**
   * Method with cached fallback
   */
  @CachedFallback({
    ttl: 1000, // 1 second for testing
    defaultValue: { id: 'default', name: 'Default User', isDefault: true },
    updateCacheOnSuccess: true
  })
  async getCachedUserProfile(userId: string, shouldSucceed = false): Promise<UserProfile> {
    this.methodCalls++;
    
    if (shouldSucceed) {
      return { id: userId, name: `User ${userId}`, email: `${userId}@example.com` };
    }
    
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  
  /**
   * Method with cached fallback and custom key generator
   */
  @CachedFallback({
    ttl: 1000,
    keyGenerator: (userId: string, options?: { includeDetails: boolean }) => {
      return `user-${userId}-${options?.includeDetails ? 'detailed' : 'basic'}`;
    },
    defaultValue: { id: 'default', name: 'Default User', isDefault: true }
  })
  async getUserProfileWithCustomKey(userId: string, options?: { includeDetails: boolean }): Promise<UserProfile> {
    this.methodCalls++;
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  
  /**
   * Method with cached fallback but no default value
   */
  @CachedFallback({
    ttl: 1000,
    updateCacheOnSuccess: true
  })
  async getCachedUserProfileNoDefault(userId: string, shouldSucceed = false): Promise<UserProfile> {
    this.methodCalls++;
    
    if (shouldSucceed) {
      return { id: userId, name: `User ${userId}`, email: `${userId}@example.com` };
    }
    
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  
  /**
   * Method with default value fallback
   */
  @DefaultFallback({
    defaultValue: { id: 'default', name: 'Default User', isDefault: true }
  })
  async getUserProfileWithDefault(userId: string): Promise<UserProfile> {
    this.methodCalls++;
    throw new Error(`Failed to fetch profile for user ${userId}`);
  }
  
  /**
   * Method with conditional default fallback
   */
  @DefaultFallback({
    defaultValue: { id: 'default', name: 'Default User', isDefault: true },
    condition: (error) => error instanceof ServiceUnavailableError
  })
  async getUserProfileWithConditionalDefault(userId: string, errorType: 'service' | 'validation'): Promise<UserProfile> {
    this.methodCalls++;
    
    if (errorType === 'service') {
      throw new ServiceUnavailableError(`Service unavailable for user ${userId}`);
    } else {
      throw new ValidationError(`Invalid user ID: ${userId}`);
    }
  }
  
  /**
   * Reset the service state for the next test
   */
  reset(): void {
    this.methodCalls = 0;
    this.fallbackCalls = 0;
    this.lastError = null;
  }
}

// Create a mock service instance for testing
const mockService = new MockService();

// Mock the logger to verify logging behavior
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  };
});

// Mock OpenTelemetry for testing metrics recording
jest.mock('@opentelemetry/api', () => {
  return {
    context: {
      active: jest.fn().mockReturnValue({}),
    },
    trace: {
      getSpan: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        setStatus: jest.fn(),
      }),
    },
    SpanStatusCode: {
      ERROR: 'ERROR',
    },
  };
});

describe('Fallback Decorators', () => {
  beforeEach(() => {
    mockService.reset();
    clearFallbackCache(); // Clear cache between tests
    jest.clearAllMocks();
  });
  
  describe('WithFallback Decorator', () => {
    it('should execute fallback handler when method fails', async () => {
      const result = await mockService.getUserProfile('user123');
      
      expect(mockService.methodCalls).toBe(1);
      expect(mockService.fallbackCalls).toBe(1);
      expect(result).toEqual({
        id: 'user123',
        name: 'Unknown User',
        isDefault: true
      });
    });
    
    it('should only execute fallback for specified error types', async () => {
      // Should execute fallback for ServiceUnavailableError
      const serviceResult = await mockService.getUserProfileWithCondition('user123', 'service');
      
      expect(mockService.methodCalls).toBe(1);
      expect(mockService.fallbackCalls).toBe(1);
      expect(serviceResult).toEqual({
        id: 'user123',
        name: 'Offline User',
        isDefault: true
      });
      
      // Reset for next test
      mockService.reset();
      
      // Should not execute fallback for ValidationError
      await expect(mockService.getUserProfileWithCondition('user123', 'validation'))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockService.methodCalls).toBe(1);
      expect(mockService.fallbackCalls).toBe(0); // Fallback not called
    });
    
    it('should throw enhanced error when fallback also fails', async () => {
      try {
        await mockService.getUserProfileWithFailingFallback('user123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(BaseError);
        expect(error.type).toBe(ErrorType.TECHNICAL);
        expect(error.code).toBe('FALLBACK_FAILED');
        expect(error.message).toContain('Fallback for getUserProfileWithFailingFallback failed');
        
        // Should include original error in metadata
        expect(error.details.metadata.originalError.message)
          .toContain('Original method failed for user user123');
          
        // Should include fallback error
        expect(error.details.fallbackError.message)
          .toContain('Fallback also failed for user user123');
      }
      
      expect(mockService.methodCalls).toBe(1);
      expect(mockService.fallbackCalls).toBe(1);
    });
  });
  
  describe('CachedFallback Decorator', () => {
    it('should return cached result when available', async () => {
      // First call succeeds and populates cache
      const firstResult = await mockService.getCachedUserProfile('user123', true);
      expect(firstResult).toEqual({
        id: 'user123',
        name: 'User user123',
        email: 'user123@example.com'
      });
      expect(mockService.methodCalls).toBe(1);
      
      // Reset method call counter
      mockService.reset();
      
      // Second call fails but should use cached result
      const secondResult = await mockService.getCachedUserProfile('user123', false);
      expect(secondResult).toEqual({
        id: 'user123',
        name: 'User user123',
        email: 'user123@example.com'
      });
      expect(mockService.methodCalls).toBe(1); // Method was called but failed
    });
    
    it('should use default value when no cache is available', async () => {
      // Call fails with no cached result
      const result = await mockService.getCachedUserProfile('user123', false);
      
      expect(result).toEqual({
        id: 'default',
        name: 'Default User',
        isDefault: true
      });
      expect(mockService.methodCalls).toBe(1);
    });
    
    it('should use custom key generator when provided', async () => {
      // Call with basic options
      await mockService.getUserProfileWithCustomKey('user123');
      
      // Call with detailed options
      await mockService.getUserProfileWithCustomKey('user123', { includeDetails: true });
      
      // Verify both keys exist in cache
      expect(hasFallbackCacheKey('user-user123-basic')).toBe(true);
      expect(hasFallbackCacheKey('user-user123-detailed')).toBe(true);
    });
    
    it('should respect TTL for cached entries', async () => {
      // First call succeeds and populates cache
      await mockService.getCachedUserProfile('user123', true);
      
      // Verify cache has entry
      expect(getFallbackCacheSize()).toBe(1);
      
      // Fast-forward time past TTL
      jest.useFakeTimers();
      jest.advanceTimersByTime(1500); // 1.5 seconds (TTL is 1 second)
      
      // Call fails and should use default value as cache is expired
      const result = await mockService.getCachedUserProfile('user123', false);
      
      expect(result).toEqual({
        id: 'default',
        name: 'Default User',
        isDefault: true
      });
      
      jest.useRealTimers();
    });
    
    it('should propagate error when no cache or default value is available', async () => {
      // Call fails with no cached result and no default value
      await expect(mockService.getCachedUserProfileNoDefault('user123', false))
        .rejects
        .toThrow('Failed to fetch profile for user user123');
      
      expect(mockService.methodCalls).toBe(1);
    });
    
    it('should update cache when method succeeds', async () => {
      // First call succeeds and populates cache
      await mockService.getCachedUserProfileNoDefault('user123', true);
      
      // Reset method call counter
      mockService.reset();
      
      // Second call fails but should use cached result
      const result = await mockService.getCachedUserProfileNoDefault('user123', false);
      
      expect(result).toEqual({
        id: 'user123',
        name: 'User user123',
        email: 'user123@example.com'
      });
      expect(mockService.methodCalls).toBe(1); // Method was called but failed
    });
  });
  
  describe('DefaultFallback Decorator', () => {
    it('should return default value when method fails', async () => {
      const result = await mockService.getUserProfileWithDefault('user123');
      
      expect(result).toEqual({
        id: 'default',
        name: 'Default User',
        isDefault: true
      });
      expect(mockService.methodCalls).toBe(1);
    });
    
    it('should only use default value for specified error types', async () => {
      // Should use default value for ServiceUnavailableError
      const serviceResult = await mockService.getUserProfileWithConditionalDefault('user123', 'service');
      
      expect(serviceResult).toEqual({
        id: 'default',
        name: 'Default User',
        isDefault: true
      });
      expect(mockService.methodCalls).toBe(1);
      
      // Reset for next test
      mockService.reset();
      
      // Should not use default value for ValidationError
      await expect(mockService.getUserProfileWithConditionalDefault('user123', 'validation'))
        .rejects
        .toThrow(ValidationError);
      
      expect(mockService.methodCalls).toBe(1);
    });
  });
  
  describe('Cache Utility Functions', () => {
    it('should clear specific cache key', async () => {
      // Populate cache with two entries
      await mockService.getCachedUserProfile('user1', true);
      await mockService.getCachedUserProfile('user2', true);
      
      // Generate cache key for user1 (using default generator)
      const cacheKey = 'MockService:getCachedUserProfile:["user1",true]';
      
      // Clear specific key
      clearFallbackCache(cacheKey);
      
      // Verify only one key was cleared
      expect(getFallbackCacheSize()).toBe(1);
      
      // user1 should now use default value
      const result = await mockService.getCachedUserProfile('user1', false);
      expect(result).toEqual({
        id: 'default',
        name: 'Default User',
        isDefault: true
      });
    });
    
    it('should clear all cache entries', async () => {
      // Populate cache with multiple entries
      await mockService.getCachedUserProfile('user1', true);
      await mockService.getCachedUserProfile('user2', true);
      await mockService.getUserProfileWithCustomKey('user3');
      
      // Verify cache has entries
      expect(getFallbackCacheSize()).toBe(3);
      
      // Clear all cache
      clearFallbackCache();
      
      // Verify cache is empty
      expect(getFallbackCacheSize()).toBe(0);
    });
    
    it('should check if cache key exists and is not expired', async () => {
      // Populate cache
      await mockService.getCachedUserProfile('user1', true);
      
      // Generate cache key (using default generator)
      const cacheKey = 'MockService:getCachedUserProfile:["user1",true]';
      
      // Verify key exists
      expect(hasFallbackCacheKey(cacheKey)).toBe(true);
      
      // Fast-forward time past TTL
      jest.useFakeTimers();
      jest.advanceTimersByTime(1500); // 1.5 seconds (TTL is 1 second)
      
      // Verify key is now expired
      expect(hasFallbackCacheKey(cacheKey)).toBe(false);
      
      jest.useRealTimers();
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle non-Error exceptions', async () => {
      class StringExceptionService {
        @WithFallback({
          handler: () => 'fallback result'
        })
        async operation(): Promise<string> {
          // Throw a string instead of an Error
          throw 'String exception';
        }
      }
      
      const service = new StringExceptionService();
      const result = await service.operation();
      
      expect(result).toBe('fallback result');
    });
    
    it('should handle circular references in cache key generation', async () => {
      class CircularService {
        @CachedFallback({
          defaultValue: 'default value'
        })
        async operation(obj: any): Promise<string> {
          throw new Error('Operation failed');
        }
      }
      
      const service = new CircularService();
      
      // Create object with circular reference
      const circular: any = { name: 'circular' };
      circular.self = circular;
      
      // Should not throw when generating cache key
      const result = await service.operation(circular);
      
      expect(result).toBe('default value');
    });
    
    it('should handle undefined or null arguments', async () => {
      class NullArgsService {
        @CachedFallback({
          defaultValue: 'default value'
        })
        async operation(arg1: any, arg2: any): Promise<string> {
          throw new Error('Operation failed');
        }
      }
      
      const service = new NullArgsService();
      
      // Call with undefined and null arguments
      const result1 = await service.operation(undefined, null);
      const result2 = await service.operation(undefined, null); // Same args to test caching
      
      expect(result1).toBe('default value');
      expect(result2).toBe('default value');
      
      // Should have created only one cache entry
      expect(getFallbackCacheSize()).toBe(1);
    });
  });
});