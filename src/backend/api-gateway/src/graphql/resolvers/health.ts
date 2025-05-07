/**
 * Health Journey GraphQL Resolvers
 * 
 * This file defines resolvers for all health-related GraphQL operations, including
 * health metrics, medical history, health goals, and device connections.
 * It implements enhanced error handling, retry mechanisms, and optimized caching.
 */

import { GraphQLResolveInfo } from 'graphql';
import { RetryOptions, retry } from '@nestjs/common/decorators';
import { Logger } from '@nestjs/common';
import { HealthService } from '@app/health';
import { Redis } from 'ioredis';

// Import shared interfaces for type safety
import {
  IHealthMetric,
  IHealthGoal,
  IMedicalEvent,
  IDeviceConnection,
  MetricType,
  MetricSource,
  GoalStatus,
  GoalFrequency,
  DeviceType,
  ConnectionStatus
} from '@austa/interfaces/journey/health';

// Import error handling utilities
import { AppError, ErrorType } from '@austa/interfaces/common';

// Cache configuration
const CACHE_TTL = {
  METRICS: 60, // 1 minute
  GOALS: 300, // 5 minutes
  MEDICAL_HISTORY: 600, // 10 minutes
  DEVICES: 300 // 5 minutes
};

// Retry configuration for transient failures
const retryOptions: RetryOptions = {
  delay: 300,
  maxAttempts: 3,
  backoff: true
};

/**
 * Factory function that creates health journey resolvers
 * @param healthService - Instance of the Health Service
 * @returns Object containing Query and Mutation resolvers for health-related operations
 */
export const healthResolvers = (healthService: HealthService) => {
  // Initialize logger
  const logger = new Logger('HealthResolvers');
  
  // Initialize Redis client for caching
  const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  
  /**
   * Helper function to get cached data or fetch from service
   * @param cacheKey - Redis cache key
   * @param ttl - Time to live in seconds
   * @param fetchFn - Function to fetch data if cache miss
   * @returns The cached or freshly fetched data
   */
  const getCachedOrFetch = async <T>(cacheKey: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> => {
    try {
      // Try to get from cache first
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return JSON.parse(cachedData) as T;
      }
      
      // Cache miss, fetch data
      logger.debug(`Cache miss for ${cacheKey}`);
      const data = await fetchFn();
      
      // Store in cache
      await redisClient.set(cacheKey, JSON.stringify(data), 'EX', ttl);
      
      return data;
    } catch (error) {
      logger.error(`Cache error for ${cacheKey}: ${error.message}`);
      // Fallback to direct fetch on cache error
      return fetchFn();
    }
  };
  
  /**
   * Helper function to invalidate cache for a user
   * @param userId - User ID to invalidate cache for
   * @param cacheType - Type of cache to invalidate (metrics, goals, etc.)
   */
  const invalidateCache = async (userId: string, cacheType: string): Promise<void> => {
    try {
      const pattern = `health:${userId}:${cacheType}*`;
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.debug(`Invalidated ${keys.length} ${cacheType} cache keys for user ${userId}`);
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache: ${error.message}`);
    }
  };
  
  /**
   * Helper function to handle errors with consistent formatting
   * @param error - The caught error
   * @param operation - Name of the operation that failed
   * @returns Formatted error object
   */
  const handleError = (error: any, operation: string): AppError => {
    logger.error(`Error in ${operation}: ${error.message}`, error.stack);
    
    // If it's already an AppError, return it
    if (error instanceof AppError) {
      return error;
    }
    
    // Map to appropriate error type
    let errorType = ErrorType.INTERNAL_ERROR;
    let retryable = false;
    
    if (error.message.includes('not found')) {
      errorType = ErrorType.NOT_FOUND;
    } else if (error.message.includes('validation')) {
      errorType = ErrorType.VALIDATION_ERROR;
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      errorType = ErrorType.SERVICE_UNAVAILABLE;
      retryable = true;
    } else if (error.message.includes('database')) {
      errorType = ErrorType.DATABASE_ERROR;
      retryable = true;
    }
    
    return new AppError({
      message: `Failed to ${operation}: ${error.message}`,
      type: errorType,
      code: `HEALTH_${errorType}`,
      retryable,
      timestamp: new Date()
    });
  };
  
  return {
    Query: {
      /**
       * Retrieves health metrics for a user with optional filtering
       */
      getHealthMetrics: async (
        _: any,
        { userId, filter, pagination }: { userId: string; filter?: any; pagination?: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IHealthMetric[]> => {
        try {
          // Build cache key based on query parameters
          const cacheKey = `health:${userId}:metrics:${JSON.stringify(filter || {})}:${JSON.stringify(pagination || {})}`;
          
          return await getCachedOrFetch<IHealthMetric[]>(
            cacheKey,
            CACHE_TTL.METRICS,
            async () => {
              // Apply retry mechanism for transient failures
              const fetchMetrics = retry(retryOptions)(async () => {
                return await healthService.getHealthMetrics(userId, filter, pagination);
              });
              
              return await fetchMetrics();
            }
          );
        } catch (error) {
          throw handleError(error, 'getHealthMetrics');
        }
      },
      
      /**
       * Retrieves health goals for a user with optional filtering
       */
      getHealthGoals: async (
        _: any,
        { userId, filter, pagination }: { userId: string; filter?: any; pagination?: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IHealthGoal[]> => {
        try {
          const cacheKey = `health:${userId}:goals:${JSON.stringify(filter || {})}:${JSON.stringify(pagination || {})}`;
          
          return await getCachedOrFetch<IHealthGoal[]>(
            cacheKey,
            CACHE_TTL.GOALS,
            async () => {
              const fetchGoals = retry(retryOptions)(async () => {
                return await healthService.getHealthGoals(userId, filter, pagination);
              });
              
              return await fetchGoals();
            }
          );
        } catch (error) {
          throw handleError(error, 'getHealthGoals');
        }
      },
      
      /**
       * Retrieves medical history events for a user with optional filtering
       */
      getMedicalHistory: async (
        _: any,
        { userId, filter, pagination }: { userId: string; filter?: any; pagination?: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IMedicalEvent[]> => {
        try {
          const cacheKey = `health:${userId}:medical:${JSON.stringify(filter || {})}:${JSON.stringify(pagination || {})}`;
          
          return await getCachedOrFetch<IMedicalEvent[]>(
            cacheKey,
            CACHE_TTL.MEDICAL_HISTORY,
            async () => {
              const fetchMedicalHistory = retry(retryOptions)(async () => {
                return await healthService.getMedicalHistory(userId, filter, pagination);
              });
              
              return await fetchMedicalHistory();
            }
          );
        } catch (error) {
          throw handleError(error, 'getMedicalHistory');
        }
      },
      
      /**
       * Retrieves connected health tracking devices for a user
       */
      getConnectedDevices: async (
        _: any,
        { userId, pagination }: { userId: string; pagination?: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IDeviceConnection[]> => {
        try {
          const cacheKey = `health:${userId}:devices:${JSON.stringify(pagination || {})}`;
          
          return await getCachedOrFetch<IDeviceConnection[]>(
            cacheKey,
            CACHE_TTL.DEVICES,
            async () => {
              const fetchDevices = retry(retryOptions)(async () => {
                return await healthService.getConnectedDevices(userId, pagination);
              });
              
              return await fetchDevices();
            }
          );
        } catch (error) {
          throw handleError(error, 'getConnectedDevices');
        }
      }
    },
    
    Mutation: {
      /**
       * Creates a new health metric record
       */
      createHealthMetric: async (
        _: any,
        { createMetricInput }: { createMetricInput: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IHealthMetric | AppError> => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new AppError({
              message: 'User ID is required',
              type: ErrorType.AUTHENTICATION_ERROR,
              code: 'HEALTH_AUTHENTICATION_ERROR',
              retryable: false,
              timestamp: new Date()
            });
          }
          
          // Apply retry for transient failures
          const createMetric = retry(retryOptions)(async () => {
            return await healthService.createHealthMetric({
              ...createMetricInput,
              userId
            });
          });
          
          const result = await createMetric();
          
          // Invalidate metrics cache for this user
          await invalidateCache(userId, 'metrics');
          
          return result;
        } catch (error) {
          return handleError(error, 'createHealthMetric');
        }
      },
      
      /**
       * Creates a new health goal
       */
      createHealthGoal: async (
        _: any,
        { createGoalInput }: { createGoalInput: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IHealthGoal | AppError> => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new AppError({
              message: 'User ID is required',
              type: ErrorType.AUTHENTICATION_ERROR,
              code: 'HEALTH_AUTHENTICATION_ERROR',
              retryable: false,
              timestamp: new Date()
            });
          }
          
          const createGoal = retry(retryOptions)(async () => {
            return await healthService.createHealthGoal({
              ...createGoalInput,
              userId
            });
          });
          
          const result = await createGoal();
          
          // Invalidate goals cache for this user
          await invalidateCache(userId, 'goals');
          
          return result;
        } catch (error) {
          return handleError(error, 'createHealthGoal');
        }
      },
      
      /**
       * Updates an existing health goal
       */
      updateHealthGoal: async (
        _: any,
        { id, updateGoalInput }: { id: string; updateGoalInput: any },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IHealthGoal | AppError> => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new AppError({
              message: 'User ID is required',
              type: ErrorType.AUTHENTICATION_ERROR,
              code: 'HEALTH_AUTHENTICATION_ERROR',
              retryable: false,
              timestamp: new Date()
            });
          }
          
          const updateGoal = retry(retryOptions)(async () => {
            return await healthService.updateHealthGoal(id, {
              ...updateGoalInput,
              userId
            });
          });
          
          const result = await updateGoal();
          
          // Invalidate goals cache for this user
          await invalidateCache(userId, 'goals');
          
          return result;
        } catch (error) {
          return handleError(error, 'updateHealthGoal');
        }
      },
      
      /**
       * Connects a new health tracking device
       */
      connectDevice: async (
        _: any,
        { deviceType, deviceId, deviceName }: { deviceType: DeviceType; deviceId: string; deviceName: string },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<IDeviceConnection> => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new AppError({
              message: 'User ID is required',
              type: ErrorType.AUTHENTICATION_ERROR,
              code: 'HEALTH_AUTHENTICATION_ERROR',
              retryable: false,
              timestamp: new Date()
            });
          }
          
          const connectDeviceOp = retry(retryOptions)(async () => {
            return await healthService.connectDevice(userId, {
              deviceType,
              deviceId,
              deviceName
            });
          });
          
          const result = await connectDeviceOp();
          
          // Invalidate devices cache for this user
          await invalidateCache(userId, 'devices');
          
          return result;
        } catch (error) {
          throw handleError(error, 'connectDevice');
        }
      },
      
      /**
       * Disconnects a health tracking device
       */
      disconnectDevice: async (
        _: any,
        { id }: { id: string },
        context: any,
        info: GraphQLResolveInfo
      ): Promise<boolean> => {
        try {
          const userId = context.user?.id;
          if (!userId) {
            throw new AppError({
              message: 'User ID is required',
              type: ErrorType.AUTHENTICATION_ERROR,
              code: 'HEALTH_AUTHENTICATION_ERROR',
              retryable: false,
              timestamp: new Date()
            });
          }
          
          const disconnectDeviceOp = retry(retryOptions)(async () => {
            return await healthService.disconnectDevice(id, userId);
          });
          
          const result = await disconnectDeviceOp();
          
          // Invalidate devices cache for this user
          await invalidateCache(userId, 'devices');
          
          return result;
        } catch (error) {
          throw handleError(error, 'disconnectDevice');
        }
      }
    },
    
    // Type resolvers
    HealthMetric: {
      journeyContext: () => ({
        journey: 'HEALTH',
        metadata: {}
      })
    },
    
    HealthGoal: {
      journeyContext: () => ({
        journey: 'HEALTH',
        metadata: {}
      })
    },
    
    MedicalEvent: {
      journeyContext: () => ({
        journey: 'HEALTH',
        metadata: {}
      })
    },
    
    DeviceConnection: {
      journeyContext: () => ({
        journey: 'HEALTH',
        metadata: {}
      })
    }
  };
};