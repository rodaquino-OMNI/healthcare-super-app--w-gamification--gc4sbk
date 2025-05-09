import { Test } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import {
  WithFallback,
  CachedFallback,
  DefaultFallback,
  clearFallbackCache,
  getFallbackMetrics,
  hasCachedResult,
  setCachedResult,
  invalidateCachedResult,
  createFallbackFunction,
  createResilientFallback
} from '../../../src/decorators/fallback.decorator';
import { BaseError, ErrorType, JourneyContext } from '../../../src/base';

// Mock the Logger to avoid console output during tests
jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');
  return {
    ...original,
    Logger: jest.fn().mockImplementation(() => ({
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn()
    }))
  };
});

/**
 * Custom error class for testing error type filtering
 */
class TestExternalError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.EXTERNAL, 'TEST_EXT_001', { journey: JourneyContext.HEALTH });
  }
}

/**
 * Custom error class for testing error type filtering
 */
class TestBusinessError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.BUSINESS, 'TEST_BUS_001', { journey: JourneyContext.CARE });
  }
}

/**
 * Custom error class for testing error type filtering
 */
class TestTechnicalError extends BaseError {
  constructor(message: string) {
    super(message, ErrorType.TECHNICAL, 'TEST_TECH_001', { journey: JourneyContext.PLAN });
  }
}

/**
 * Interface for user data to test with fallbacks
 */
interface UserData {
  id: string;
  name: string;
  email?: string;
  isPlaceholder?: boolean;
}

/**
 * Interface for health metrics to test with fallbacks
 */
interface HealthMetrics {
  steps: number;
  heartRate: number;
  sleep: number;
  lastUpdated: Date | null;
  isPlaceholder?: boolean;
}

/**
 * Mock service with fallback-decorated methods for testing
 */
class MockService {
  public fallbackExecuted = false;
  public fallbackError: Error | null = null;
  public fallbackArgs: any[] = [];

  /**
   * Resets the service state for a new test
   */
  reset() {
    this.fallbackExecuted = false;
    this.fallbackError = null;
    this.fallbackArgs = [];
    clearFallbackCache();
  }

  /**
   * Method that always fails with an external error
   * @param userId - User ID to fetch
   * @returns Never resolves
   */
  async getUserWithoutFallback(userId: string): Promise<UserData> {
    throw new TestExternalError(`Failed to fetch user ${userId}`);
  }

  /**
   * Method with WithFallback decorator that returns a placeholder user
   * @param userId - User ID to fetch
   * @returns User data or fallback
   */
  @WithFallback<UserData, [string]>({
    fallbackFn: function(this: MockService, error: Error, userId: string): UserData {
      this.fallbackExecuted = true;
      this.fallbackError = error;
      this.fallbackArgs = [userId];
      
      return {
        id: userId,
        name: 'Placeholder User',
        isPlaceholder: true
      };
    },
    fallbackErrors: [ErrorType.EXTERNAL]
  })
  async getUserWithFallback(userId: string): Promise<UserData> {
    throw new TestExternalError(`Failed to fetch user ${userId}`);
  }

  /**
   * Method with WithFallback decorator that only falls back for specific error types
   * @param userId - User ID to fetch
   * @param errorType - Type of error to throw
   * @returns User data or fallback
   */
  @WithFallback<UserData, [string, string]>({
    fallbackFn: function(this: MockService, error: Error, userId: string): UserData {
      this.fallbackExecuted = true;
      this.fallbackError = error;
      this.fallbackArgs = [userId];
      
      return {
        id: userId,
        name: 'Placeholder User',
        isPlaceholder: true
      };
    },
    fallbackErrors: [ErrorType.EXTERNAL]
  })
  async getUserWithErrorFiltering(userId: string, errorType: string): Promise<UserData> {
    if (errorType === 'external') {
      throw new TestExternalError(`Failed to fetch user ${userId}`);
    } else if (errorType === 'business') {
      throw new TestBusinessError(`Business rule violation for user ${userId}`);
    } else {
      throw new TestTechnicalError(`Technical error for user ${userId}`);
    }
  }

  /**
   * Method with WithFallback decorator that uses custom shouldFallback function
   * @param userId - User ID to fetch
   * @param errorType - Type of error to throw
   * @returns User data or fallback
   */
  @WithFallback<UserData, [string, string]>({
    fallbackFn: function(this: MockService, error: Error, userId: string): UserData {
      this.fallbackExecuted = true;
      this.fallbackError = error;
      this.fallbackArgs = [userId];
      
      return {
        id: userId,
        name: 'Placeholder User',
        isPlaceholder: true
      };
    },
    shouldFallback: (error: Error) => {
      // Only fall back for external errors with specific message pattern
      return error instanceof TestExternalError && 
             error.message.includes('Failed to fetch user');
    }
  })
  async getUserWithCustomFallbackCheck(userId: string, errorType: string): Promise<UserData> {
    if (errorType === 'external') {
      throw new TestExternalError(`Failed to fetch user ${userId}`);
    } else if (errorType === 'external-other') {
      throw new TestExternalError(`Other external error for ${userId}`);
    } else {
      throw new TestBusinessError(`Business rule violation for user ${userId}`);
    }
  }

  /**
   * Method with CachedFallback decorator that returns cached health metrics
   * @param userId - User ID to fetch metrics for
   * @returns Health metrics or cached fallback
   */
  @CachedFallback<HealthMetrics>({
    ttl: 60000, // 1 minute
    defaultValue: {
      steps: 0,
      heartRate: 0,
      sleep: 0,
      lastUpdated: null,
      isPlaceholder: true
    },
    fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TECHNICAL]
  })
  async getHealthMetrics(userId: string): Promise<HealthMetrics> {
    // This will be called first time and cache the result
    if (!this.fallbackExecuted) {
      const result = {
        steps: 10000,
        heartRate: 75,
        sleep: 8,
        lastUpdated: new Date()
      };
      
      return result;
    }
    
    // Subsequent calls will throw and use cached result
    throw new TestExternalError(`Failed to fetch health metrics for user ${userId}`);
  }

  /**
   * Method with CachedFallback decorator that uses custom cache key function
   * @param userId - User ID to fetch metrics for
   * @param date - Date to fetch metrics for
   * @returns Health metrics or cached fallback
   */
  @CachedFallback<HealthMetrics>({
    ttl: 60000, // 1 minute
    defaultValue: {
      steps: 0,
      heartRate: 0,
      sleep: 0,
      lastUpdated: null,
      isPlaceholder: true
    },
    cacheKeyFn: (userId: string, date: Date) => `health_metrics_${userId}_${date.toISOString().split('T')[0]}`
  })
  async getHealthMetricsForDate(userId: string, date: Date): Promise<HealthMetrics> {
    // This will be called first time and cache the result
    if (!this.fallbackExecuted) {
      const result = {
        steps: 10000,
        heartRate: 75,
        sleep: 8,
        lastUpdated: date
      };
      
      return result;
    }
    
    // Subsequent calls will throw and use cached result
    throw new TestExternalError(`Failed to fetch health metrics for user ${userId} on ${date.toISOString()}`);
  }

  /**
   * Method with DefaultFallback decorator that returns a default value
   * @param productId - Product ID to fetch
   * @returns Product data or default value
   */
  @DefaultFallback<{ id: string; name: string; price: number; available: boolean }>({
    defaultValue: {
      id: 'unknown',
      name: 'Unknown Product',
      price: 0,
      available: false
    },
    fallbackErrors: [ErrorType.EXTERNAL, ErrorType.TECHNICAL]
  })
  async getProductDetails(productId: string): Promise<{ id: string; name: string; price: number; available: boolean }> {
    throw new TestExternalError(`Failed to fetch product ${productId}`);
  }

  /**
   * Method with DefaultFallback decorator that uses custom shouldFallback function
   * @param appointmentId - Appointment ID to fetch
   * @param errorType - Type of error to throw
   * @returns Appointment data or default value
   */
  @DefaultFallback<{ id: string; status: string; canReschedule: boolean }>({
    defaultValue: {
      id: 'unknown',
      status: 'unknown',
      canReschedule: false
    },
    shouldFallback: (error: Error) => {
      // Only fall back for external errors from the care journey
      if (error instanceof BaseError) {
        return error.type === ErrorType.EXTERNAL && 
               error.context.journey === JourneyContext.CARE;
      }
      return false;
    }
  })
  async getAppointmentDetails(appointmentId: string, errorType: string): Promise<{ id: string; status: string; canReschedule: boolean }> {
    if (errorType === 'external-care') {
      throw new BaseError(
        `Failed to fetch appointment ${appointmentId}`,
        ErrorType.EXTERNAL,
        'APPOINTMENT_001',
        { journey: JourneyContext.CARE }
      );
    } else if (errorType === 'external-health') {
      throw new BaseError(
        `Failed to fetch appointment ${appointmentId}`,
        ErrorType.EXTERNAL,
        'APPOINTMENT_001',
        { journey: JourneyContext.HEALTH }
      );
    } else {
      throw new TestBusinessError(`Business rule violation for appointment ${appointmentId}`);
    }
  }

  /**
   * Method with createResilientFallback that combines multiple fallback strategies
   * @param userId - User ID to fetch metrics for
   * @returns Health metrics using multiple fallback strategies
   */
  @createResilientFallback<HealthMetrics>(
    [
      // First try to use cached data
      { 
        type: 'cached', 
        ttl: 60000 // 1 minute 
      },
      // Then try to fetch from secondary source
      { 
        type: 'function', 
        fallbackFn: function(this: MockService, error: Error, userId: string) {
          this.fallbackExecuted = true;
          this.fallbackError = error;
          this.fallbackArgs = [userId];
          
          return {
            steps: 5000, // Reduced accuracy from backup source
            heartRate: 70,
            sleep: 7,
            lastUpdated: new Date(),
            isPlaceholder: true
          };
        }
      },
      // Finally, use a default value as last resort
      { 
        type: 'default', 
        value: { 
          steps: 0, 
          heartRate: 0, 
          sleep: 0, 
          lastUpdated: null,
          isPlaceholder: true
        } 
      }
    ],
    [ErrorType.EXTERNAL, ErrorType.TECHNICAL]
  )
  async getHealthMetricsResilient(userId: string): Promise<HealthMetrics> {
    throw new TestExternalError(`Failed to fetch health metrics for user ${userId}`);
  }
}

describe('Fallback Decorators', () => {
  let mockService: MockService;

  beforeEach(() => {
    // Create a new instance of the service
    mockService = new MockService();
    
    // Bind the service instance to the fallback functions
    const originalGetUserWithFallback = mockService.getUserWithFallback;
    mockService.getUserWithFallback = function(this: MockService, ...args: any[]) {
      return originalGetUserWithFallback.apply(this, args);
    };
    
    const originalGetUserWithErrorFiltering = mockService.getUserWithErrorFiltering;
    mockService.getUserWithErrorFiltering = function(this: MockService, ...args: any[]) {
      return originalGetUserWithErrorFiltering.apply(this, args);
    };
    
    const originalGetUserWithCustomFallbackCheck = mockService.getUserWithCustomFallbackCheck;
    mockService.getUserWithCustomFallbackCheck = function(this: MockService, ...args: any[]) {
      return originalGetUserWithCustomFallbackCheck.apply(this, args);
    };
    
    const originalGetHealthMetricsResilient = mockService.getHealthMetricsResilient;
    mockService.getHealthMetricsResilient = function(this: MockService, ...args: any[]) {
      return originalGetHealthMetricsResilient.apply(this, args);
    };
  });

  afterEach(() => {
    // Reset the service and clear cache after each test
    mockService.reset();
  });

  describe('WithFallback Decorator', () => {
    it('should execute fallback function when method fails', async () => {
      // Act
      const result = await mockService.getUserWithFallback('user123');
      
      // Assert
      expect(mockService.fallbackExecuted).toBe(true);
      expect(mockService.fallbackError).toBeInstanceOf(TestExternalError);
      expect(mockService.fallbackArgs).toEqual(['user123']);
      expect(result).toEqual({
        id: 'user123',
        name: 'Placeholder User',
        isPlaceholder: true
      });
    });

    it('should only execute fallback for specified error types', async () => {
      // Act & Assert - Should use fallback for external errors
      const result1 = await mockService.getUserWithErrorFiltering('user123', 'external');
      expect(mockService.fallbackExecuted).toBe(true);
      expect(result1.isPlaceholder).toBe(true);
      
      // Reset for next test
      mockService.reset();
      
      // Act & Assert - Should not use fallback for business errors
      await expect(mockService.getUserWithErrorFiltering('user123', 'business'))
        .rejects.toThrow('Business rule violation for user user123');
      expect(mockService.fallbackExecuted).toBe(false);
      
      // Reset for next test
      mockService.reset();
      
      // Act & Assert - Should not use fallback for technical errors
      await expect(mockService.getUserWithErrorFiltering('user123', 'technical'))
        .rejects.toThrow('Technical error for user user123');
      expect(mockService.fallbackExecuted).toBe(false);
    });

    it('should use custom shouldFallback function when provided', async () => {
      // Act & Assert - Should use fallback for external errors with specific message
      const result1 = await mockService.getUserWithCustomFallbackCheck('user123', 'external');
      expect(mockService.fallbackExecuted).toBe(true);
      expect(result1.isPlaceholder).toBe(true);
      
      // Reset for next test
      mockService.reset();
      
      // Act & Assert - Should not use fallback for external errors with different message
      await expect(mockService.getUserWithCustomFallbackCheck('user123', 'external-other'))
        .rejects.toThrow('Other external error for user123');
      expect(mockService.fallbackExecuted).toBe(false);
      
      // Reset for next test
      mockService.reset();
      
      // Act & Assert - Should not use fallback for business errors
      await expect(mockService.getUserWithCustomFallbackCheck('user123', 'business'))
        .rejects.toThrow('Business rule violation for user user123');
      expect(mockService.fallbackExecuted).toBe(false);
    });

    it('should propagate errors when fallback function fails', async () => {
      // Create a service with a failing fallback
      class FailingFallbackService {
        @WithFallback<UserData, [string]>({
          fallbackFn: (error: Error, userId: string): UserData => {
            throw new Error('Fallback function failed');
          }
        })
        async getUser(userId: string): Promise<UserData> {
          throw new TestExternalError(`Failed to fetch user ${userId}`);
        }
      }
      
      const failingService = new FailingFallbackService();
      
      // Act & Assert
      await expect(failingService.getUser('user123'))
        .rejects.toThrow('Failed to fetch user user123');
    });
  });

  describe('CachedFallback Decorator', () => {
    it('should cache successful results and return them on subsequent failures', async () => {
      // First call should succeed and cache the result
      const result1 = await mockService.getHealthMetrics('user123');
      expect(result1.steps).toBe(10000);
      expect(result1.isPlaceholder).toBeUndefined();
      
      // Set fallbackExecuted to true to make subsequent calls fail
      mockService.fallbackExecuted = true;
      
      // Second call should fail but return cached result
      const result2 = await mockService.getHealthMetrics('user123');
      expect(result2.steps).toBe(10000);
      expect(result2.isPlaceholder).toBeUndefined();
    });

    it('should return default value when no cached result is available', async () => {
      // Set fallbackExecuted to true to make the first call fail
      mockService.fallbackExecuted = true;
      
      // Call should fail but return default value
      const result = await mockService.getHealthMetrics('user123');
      expect(result.steps).toBe(0);
      expect(result.isPlaceholder).toBe(true);
    });

    it('should use custom cache key function when provided', async () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-02');
      
      // First call should succeed and cache the result for date1
      const result1 = await mockService.getHealthMetricsForDate('user123', date1);
      expect(result1.steps).toBe(10000);
      expect(result1.lastUpdated).toEqual(date1);
      
      // Set fallbackExecuted to true to make subsequent calls fail
      mockService.fallbackExecuted = true;
      
      // Second call with same date should return cached result
      const result2 = await mockService.getHealthMetricsForDate('user123', date1);
      expect(result2.steps).toBe(10000);
      expect(result2.lastUpdated).toEqual(date1);
      
      // Call with different date should return default value
      const result3 = await mockService.getHealthMetricsForDate('user123', date2);
      expect(result3.steps).toBe(0);
      expect(result3.isPlaceholder).toBe(true);
    });

    it('should clear cache when clearFallbackCache is called', async () => {
      // First call should succeed and cache the result
      const result1 = await mockService.getHealthMetrics('user123');
      expect(result1.steps).toBe(10000);
      
      // Set fallbackExecuted to true to make subsequent calls fail
      mockService.fallbackExecuted = true;
      
      // Clear the cache
      clearFallbackCache();
      
      // Call should now return default value
      const result2 = await mockService.getHealthMetrics('user123');
      expect(result2.steps).toBe(0);
      expect(result2.isPlaceholder).toBe(true);
    });
  });

  describe('DefaultFallback Decorator', () => {
    it('should return default value when method fails', async () => {
      // Act
      const result = await mockService.getProductDetails('product123');
      
      // Assert
      expect(result).toEqual({
        id: 'unknown',
        name: 'Unknown Product',
        price: 0,
        available: false
      });
    });

    it('should use custom shouldFallback function when provided', async () => {
      // Act & Assert - Should use fallback for external errors from care journey
      const result1 = await mockService.getAppointmentDetails('appt123', 'external-care');
      expect(result1).toEqual({
        id: 'unknown',
        status: 'unknown',
        canReschedule: false
      });
      
      // Act & Assert - Should not use fallback for external errors from health journey
      await expect(mockService.getAppointmentDetails('appt123', 'external-health'))
        .rejects.toThrow('Failed to fetch appointment appt123');
      
      // Act & Assert - Should not use fallback for business errors
      await expect(mockService.getAppointmentDetails('appt123', 'business'))
        .rejects.toThrow('Business rule violation for appointment appt123');
    });
  });

  describe('Fallback Utility Functions', () => {
    it('should track fallback metrics', async () => {
      // Execute several fallbacks
      await mockService.getUserWithFallback('user1');
      await mockService.getUserWithFallback('user2');
      
      // Set fallbackExecuted to true to make health metrics fail
      mockService.fallbackExecuted = true;
      await mockService.getHealthMetrics('user1');
      
      await mockService.getProductDetails('product1');
      
      // Get metrics
      const metrics = getFallbackMetrics();
      
      // Assert
      expect(metrics.totalFallbacks).toBeGreaterThanOrEqual(4);
      expect(metrics.successfulFallbacks).toBeGreaterThanOrEqual(4);
      expect(metrics.byErrorType.get(ErrorType.EXTERNAL) || 0).toBeGreaterThanOrEqual(4);
      expect(metrics.byJourney.get(JourneyContext.HEALTH) || 0).toBeGreaterThanOrEqual(2);
    });

    it('should check if cached result exists', async () => {
      // First call should succeed and cache the result
      await mockService.getHealthMetrics('user123');
      
      // Check if cached result exists
      const hasCached = hasCachedResult(mockService, 'getHealthMetrics', ['user123']);
      expect(hasCached).toBe(true);
      
      // Check for non-existent cache entry
      const hasNonExistent = hasCachedResult(mockService, 'getHealthMetrics', ['user456']);
      expect(hasNonExistent).toBe(false);
    });

    it('should manually set and invalidate cached results', async () => {
      // Manually set a cached result
      setCachedResult(mockService, 'getHealthMetrics', ['user456'], {
        steps: 5000,
        heartRate: 65,
        sleep: 7,
        lastUpdated: new Date(),
        isManuallySet: true
      });
      
      // Set fallbackExecuted to true to make calls fail
      mockService.fallbackExecuted = true;
      
      // Should return manually set cached result
      const result1 = await mockService.getHealthMetrics('user456');
      expect(result1.steps).toBe(5000);
      expect(result1.isManuallySet).toBe(true);
      
      // Invalidate the cached result
      invalidateCachedResult(mockService, 'getHealthMetrics', ['user456']);
      
      // Should now return default value
      const result2 = await mockService.getHealthMetrics('user456');
      expect(result2.steps).toBe(0);
      expect(result2.isPlaceholder).toBe(true);
    });
  });

  describe('createFallbackFunction', () => {
    it('should create a function with fallback capabilities', async () => {
      // Create a function that always fails
      const originalFn = async (userId: string): Promise<UserData> => {
        throw new TestExternalError(`Failed to fetch user ${userId}`);
      };
      
      // Create a fallback wrapper
      const wrappedFn = createFallbackFunction(
        originalFn,
        {
          fallbackFn: function(this: MockService, error: Error, userId: string): UserData {
            mockService.fallbackExecuted = true;
            mockService.fallbackError = error;
            mockService.fallbackArgs = [userId];
            
            return {
              id: userId,
              name: 'Placeholder User',
              isPlaceholder: true
            };
          },
          fallbackErrors: [ErrorType.EXTERNAL]
        }
      );
      
      // Act
      const result = await wrappedFn('user123');
      
      // Assert
      expect(mockService.fallbackExecuted).toBe(true);
      expect(mockService.fallbackError).toBeInstanceOf(TestExternalError);
      expect(mockService.fallbackArgs).toEqual(['user123']);
      expect(result).toEqual({
        id: 'user123',
        name: 'Placeholder User',
        isPlaceholder: true
      });
    });
  });

  describe('createResilientFallback', () => {
    it('should try multiple fallback strategies in order', async () => {
      // Act
      const result = await mockService.getHealthMetricsResilient('user123');
      
      // Assert - should use the function fallback (second strategy)
      expect(mockService.fallbackExecuted).toBe(true);
      expect(mockService.fallbackError).toBeInstanceOf(TestExternalError);
      expect(mockService.fallbackArgs).toEqual(['user123']);
      expect(result).toEqual({
        steps: 5000,
        heartRate: 70,
        sleep: 7,
        lastUpdated: expect.any(Date),
        isPlaceholder: true
      });
    });

    it('should use cached results when available', async () => {
      // Manually set a cached result
      setCachedResult(mockService, 'getHealthMetricsResilient', ['user123'], {
        steps: 8000,
        heartRate: 72,
        sleep: 8,
        lastUpdated: new Date(),
        isCached: true
      });
      
      // Act
      const result = await mockService.getHealthMetricsResilient('user123');
      
      // Assert - should use the cached result (first strategy)
      expect(mockService.fallbackExecuted).toBe(false); // Function fallback not executed
      expect(result).toEqual({
        steps: 8000,
        heartRate: 72,
        sleep: 8,
        lastUpdated: expect.any(Date),
        isCached: true
      });
    });

    it('should use default value when all other strategies fail', async () => {
      // Create a service with failing function fallback
      class FailingResilientService {
        @createResilientFallback<HealthMetrics>(
          [
            // First try to use cached data (none available)
            { type: 'cached', ttl: 60000 },
            // Then try function fallback (will fail)
            { 
              type: 'function', 
              fallbackFn: (error: Error, userId: string) => {
                throw new Error('Function fallback failed');
              }
            },
            // Finally, use default value
            { 
              type: 'default', 
              value: { 
                steps: 0, 
                heartRate: 0, 
                sleep: 0, 
                lastUpdated: null,
                isDefault: true
              } 
            }
          ],
          [ErrorType.EXTERNAL]
        )
        async getHealthMetrics(userId: string): Promise<HealthMetrics> {
          throw new TestExternalError(`Failed to fetch health metrics for user ${userId}`);
        }
      }
      
      const failingService = new FailingResilientService();
      
      // Act
      const result = await failingService.getHealthMetrics('user123');
      
      // Assert - should use the default value (third strategy)
      expect(result).toEqual({
        steps: 0,
        heartRate: 0,
        sleep: 0,
        lastUpdated: null,
        isDefault: true
      });
    });
  });
});