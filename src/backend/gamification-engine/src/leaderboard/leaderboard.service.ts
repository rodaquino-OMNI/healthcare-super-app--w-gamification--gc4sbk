import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRedis } from '@app/shared/redis';
import { Redis } from 'ioredis';
import { ProfilesService } from '@app/profiles/profiles.service';
import { TracingService } from '@app/tracing';
import { JourneyType } from '@austa/interfaces/gamification';
import { ConfigService } from '@nestjs/config';
import { 
  LeaderboardData, 
  LeaderboardEntry, 
  LeaderboardOptions, 
  LeaderboardTimePeriod, 
  RedisLeaderboardOptions,
  JourneyLeaderboardConfig
} from './leaderboard.interface';
import { LeaderboardTimeframeDto } from './dto';

/**
 * Service responsible for managing leaderboards using Redis Sorted Sets
 * Provides methods for retrieving global and journey-specific leaderboards,
 * as well as user rankings and time-period specific leaderboards.
 */
@Injectable()
export class LeaderboardService implements OnModuleInit {
  private readonly logger = new Logger(LeaderboardService.name);
  private readonly leaderboardKeyPrefix = 'leaderboard';
  private readonly userScoreKeyPrefix = 'user:score';
  private readonly defaultTTL = 3600; // 1 hour in seconds
  private readonly journeyConfigs: Map<JourneyType, JourneyLeaderboardConfig> = new Map();
  
  // Redis key patterns
  private readonly globalLeaderboardKey = `${this.leaderboardKeyPrefix}:global`;
  private readonly journeyLeaderboardKeyPattern = `${this.leaderboardKeyPrefix}:journey:%s`;
  private readonly timeframeLeaderboardKeyPattern = `${this.leaderboardKeyPrefix}:timeframe:%s`;
  private readonly journeyTimeframeLeaderboardKeyPattern = `${this.leaderboardKeyPrefix}:journey:%s:timeframe:%s`;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly profilesService: ProfilesService,
    private readonly tracingService: TracingService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize the service and set up journey-specific configurations
   */
  async onModuleInit() {
    this.logger.log('Initializing LeaderboardService');
    
    // Initialize journey-specific leaderboard configurations
    this.initJourneyConfigs();
    
    // Verify Redis connection
    try {
      await this.redis.ping();
      this.logger.log('Successfully connected to Redis');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`, error.stack);
    }
  }

  /**
   * Initialize journey-specific leaderboard configurations from config service
   */
  private initJourneyConfigs() {
    // Set default configurations for each journey type
    this.journeyConfigs.set(JourneyType.HEALTH, {
      journey: JourneyType.HEALTH,
      maxEntries: 100,
      cacheTtl: this.defaultTTL,
      enabled: true,
      redisKeyPrefix: 'health'
    });

    this.journeyConfigs.set(JourneyType.CARE, {
      journey: JourneyType.CARE,
      maxEntries: 100,
      cacheTtl: this.defaultTTL,
      enabled: true,
      redisKeyPrefix: 'care'
    });

    this.journeyConfigs.set(JourneyType.PLAN, {
      journey: JourneyType.PLAN,
      maxEntries: 100,
      cacheTtl: this.defaultTTL,
      enabled: true,
      redisKeyPrefix: 'plan'
    });

    // Override with configurations from config service if available
    const configuredJourneys = this.configService.get<JourneyLeaderboardConfig[]>('leaderboard.journeys');
    if (configuredJourneys) {
      for (const config of configuredJourneys) {
        if (this.journeyConfigs.has(config.journey)) {
          this.journeyConfigs.set(config.journey, {
            ...this.journeyConfigs.get(config.journey),
            ...config
          });
        }
      }
    }

    this.logger.log(`Initialized ${this.journeyConfigs.size} journey leaderboard configurations`);
  }

  /**
   * Get the global leaderboard across all journeys
   * @param options Leaderboard options for filtering and pagination
   * @returns Leaderboard data with entries and metadata
   */
  async getGlobalLeaderboard(options: LeaderboardOptions = {}): Promise<LeaderboardData> {
    const span = this.tracingService.startSpan('leaderboard.getGlobalLeaderboard');
    try {
      const { limit = 10, offset = 0, timePeriod } = options;
      const redisKey = this.getLeaderboardKey(null, timePeriod);
      
      // Check if leaderboard exists in Redis
      const exists = await this.redis.exists(redisKey);
      
      if (!exists) {
        // If leaderboard doesn't exist, generate it
        await this.generateGlobalLeaderboard(redisKey, timePeriod);
      }

      // Get leaderboard entries from Redis
      const entries = await this.getLeaderboardEntries(redisKey, offset, limit);
      const totalUsers = await this.redis.zcard(redisKey);

      // Get user position if requested
      let userPosition: LeaderboardEntry | undefined;
      if (options.includeUserPosition && options.userId) {
        userPosition = await this.getUserPositionInLeaderboard(redisKey, options.userId);
      }

      return {
        entries,
        totalUsers,
        journey: null, // Global leaderboard has no specific journey
        timePeriod: timePeriod || { type: 'all-time' },
        lastUpdated: new Date().toISOString(),
        userPosition
      };
    } catch (error) {
      this.logger.error(`Failed to get global leaderboard: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Get a journey-specific leaderboard
   * @param journey Journey type to get leaderboard for
   * @param options Leaderboard options for filtering and pagination
   * @returns Leaderboard data with entries and metadata
   */
  async getJourneyLeaderboard(journey: JourneyType, options: LeaderboardOptions = {}): Promise<LeaderboardData> {
    const span = this.tracingService.startSpan('leaderboard.getJourneyLeaderboard');
    try {
      const { limit = 10, offset = 0, timePeriod } = options;
      const redisKey = this.getLeaderboardKey(journey, timePeriod);
      
      // Check if leaderboard exists in Redis
      const exists = await this.redis.exists(redisKey);
      
      if (!exists) {
        // If leaderboard doesn't exist, generate it
        await this.generateJourneyLeaderboard(journey, redisKey, timePeriod);
      }

      // Get leaderboard entries from Redis
      const entries = await this.getLeaderboardEntries(redisKey, offset, limit);
      const totalUsers = await this.redis.zcard(redisKey);

      // Get user position if requested
      let userPosition: LeaderboardEntry | undefined;
      if (options.includeUserPosition && options.userId) {
        userPosition = await this.getUserPositionInLeaderboard(redisKey, options.userId);
      }

      return {
        entries,
        totalUsers,
        journey,
        timePeriod: timePeriod || { type: 'all-time' },
        lastUpdated: new Date().toISOString(),
        userPosition
      };
    } catch (error) {
      this.logger.error(`Failed to get journey leaderboard for ${journey}: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Get a time-period specific leaderboard
   * @param timeframe Time period to get leaderboard for
   * @param journey Optional journey type to filter by
   * @param options Leaderboard options for filtering and pagination
   * @returns Leaderboard data with entries and metadata
   */
  async getTimeframeLeaderboard(
    timeframe: LeaderboardTimeframeDto,
    journey?: JourneyType,
    options: LeaderboardOptions = {}
  ): Promise<LeaderboardData> {
    const span = this.tracingService.startSpan('leaderboard.getTimeframeLeaderboard');
    try {
      const timePeriod: LeaderboardTimePeriod = {
        type: timeframe.toLowerCase() as 'daily' | 'weekly' | 'monthly' | 'all-time'
      };
      
      if (journey) {
        return this.getJourneyLeaderboard(journey, { ...options, timePeriod });
      } else {
        return this.getGlobalLeaderboard({ ...options, timePeriod });
      }
    } catch (error) {
      this.logger.error(`Failed to get timeframe leaderboard for ${timeframe}: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Get a user's rank and surrounding users on the leaderboard
   * @param userId User ID to get rank for
   * @param journey Optional journey type to filter by
   * @param options Leaderboard options for filtering and pagination
   * @returns User rank data with surrounding users
   */
  async getUserRank(
    userId: string,
    journey?: JourneyType,
    options: LeaderboardOptions = {}
  ): Promise<{ userRank: LeaderboardEntry; above: LeaderboardEntry[]; below: LeaderboardEntry[] }> {
    const span = this.tracingService.startSpan('leaderboard.getUserRank');
    try {
      const { timePeriod } = options;
      const redisKey = this.getLeaderboardKey(journey, timePeriod);
      
      // Check if leaderboard exists in Redis
      const exists = await this.redis.exists(redisKey);
      
      if (!exists) {
        if (journey) {
          await this.generateJourneyLeaderboard(journey, redisKey, timePeriod);
        } else {
          await this.generateGlobalLeaderboard(redisKey, timePeriod);
        }
      }

      // Get user's rank
      const userRank = await this.getUserPositionInLeaderboard(redisKey, userId);
      
      if (!userRank) {
        throw new Error(`User ${userId} not found in leaderboard`);
      }

      // Get users above and below
      const above = await this.getLeaderboardEntries(redisKey, Math.max(0, userRank.rank - 6), 5);
      const below = await this.getLeaderboardEntries(redisKey, userRank.rank, 5);

      return {
        userRank,
        above,
        below
      };
    } catch (error) {
      this.logger.error(`Failed to get user rank for ${userId}: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Update a user's score in all relevant leaderboards
   * @param userId User ID to update score for
   * @param score New score value
   * @param journey Optional journey type the score is associated with
   * @returns Boolean indicating success
   */
  async updateUserScore(userId: string, score: number, journey?: JourneyType): Promise<boolean> {
    const span = this.tracingService.startSpan('leaderboard.updateUserScore');
    try {
      const pipeline = this.redis.pipeline();
      
      // Update global leaderboard
      pipeline.zadd(this.globalLeaderboardKey, score, userId);
      
      // Update journey-specific leaderboard if provided
      if (journey) {
        const journeyKey = this.formatKey(this.journeyLeaderboardKeyPattern, journey);
        pipeline.zadd(journeyKey, score, userId);
      }
      
      // Update timeframe leaderboards
      const timeframes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
      for (const timeframe of timeframes) {
        const timeframeKey = this.formatKey(this.timeframeLeaderboardKeyPattern, timeframe);
        pipeline.zadd(timeframeKey, score, userId);
        
        if (journey) {
          const journeyTimeframeKey = this.formatKey(
            this.journeyTimeframeLeaderboardKeyPattern, 
            journey, 
            timeframe
          );
          pipeline.zadd(journeyTimeframeKey, score, userId);
        }
      }
      
      // Execute pipeline
      await pipeline.exec();
      
      this.logger.log(`Updated score for user ${userId} to ${score}${journey ? ` in journey ${journey}` : ''}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update user score for ${userId}: ${error.message}`, error.stack);
      return false;
    } finally {
      span.finish();
    }
  }

  /**
   * Increment a user's score in all relevant leaderboards
   * @param userId User ID to increment score for
   * @param increment Amount to increment score by
   * @param journey Optional journey type the score is associated with
   * @returns New score after increment
   */
  async incrementUserScore(userId: string, increment: number, journey?: JourneyType): Promise<number> {
    const span = this.tracingService.startSpan('leaderboard.incrementUserScore');
    try {
      const pipeline = this.redis.pipeline();
      
      // Increment global leaderboard
      pipeline.zincrby(this.globalLeaderboardKey, increment, userId);
      
      // Increment journey-specific leaderboard if provided
      if (journey) {
        const journeyKey = this.formatKey(this.journeyLeaderboardKeyPattern, journey);
        pipeline.zincrby(journeyKey, increment, userId);
      }
      
      // Increment timeframe leaderboards
      const timeframes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
      for (const timeframe of timeframes) {
        const timeframeKey = this.formatKey(this.timeframeLeaderboardKeyPattern, timeframe);
        pipeline.zincrby(timeframeKey, increment, userId);
        
        if (journey) {
          const journeyTimeframeKey = this.formatKey(
            this.journeyTimeframeLeaderboardKeyPattern, 
            journey, 
            timeframe
          );
          pipeline.zincrby(journeyTimeframeKey, increment, userId);
        }
      }
      
      // Execute pipeline
      const results = await pipeline.exec();
      
      // Get the new score from the global leaderboard result
      const newScore = parseFloat(results[0][1] as string);
      
      this.logger.log(`Incremented score for user ${userId} by ${increment} to ${newScore}${journey ? ` in journey ${journey}` : ''}`);
      return newScore;
    } catch (error) {
      this.logger.error(`Failed to increment user score for ${userId}: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Reset timeframe-specific leaderboards (e.g., daily, weekly, monthly)
   * @param timeframe Time period to reset
   * @returns Boolean indicating success
   */
  async resetTimeframeLeaderboards(timeframe: 'daily' | 'weekly' | 'monthly'): Promise<boolean> {
    const span = this.tracingService.startSpan('leaderboard.resetTimeframeLeaderboards');
    try {
      const pipeline = this.redis.pipeline();
      
      // Reset global timeframe leaderboard
      const timeframeKey = this.formatKey(this.timeframeLeaderboardKeyPattern, timeframe);
      pipeline.del(timeframeKey);
      
      // Reset journey-specific timeframe leaderboards
      for (const [journey] of this.journeyConfigs) {
        const journeyTimeframeKey = this.formatKey(
          this.journeyTimeframeLeaderboardKeyPattern, 
          journey, 
          timeframe
        );
        pipeline.del(journeyTimeframeKey);
      }
      
      // Execute pipeline
      await pipeline.exec();
      
      this.logger.log(`Reset ${timeframe} leaderboards`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to reset ${timeframe} leaderboards: ${error.message}`, error.stack);
      return false;
    } finally {
      span.finish();
    }
  }

  /**
   * Generate the global leaderboard by aggregating user scores across all journeys
   * @param redisKey Redis key to store the leaderboard under
   * @param timePeriod Optional time period to filter by
   * @returns Boolean indicating success
   */
  private async generateGlobalLeaderboard(redisKey: string, timePeriod?: LeaderboardTimePeriod): Promise<boolean> {
    try {
      // Get all journey leaderboards
      const journeyKeys = Array.from(this.journeyConfigs.keys()).map(journey => 
        this.getLeaderboardKey(journey, timePeriod)
      );
      
      if (journeyKeys.length === 0) {
        this.logger.warn('No journey leaderboards found to generate global leaderboard');
        return false;
      }
      
      // Use ZUNIONSTORE to combine all journey leaderboards
      // This aggregates scores for users who appear in multiple journeys
      await this.redis.zunionstore(
        redisKey,
        journeyKeys.length,
        ...journeyKeys,
        'AGGREGATE',
        'SUM'
      );
      
      // Set TTL for the generated leaderboard
      await this.redis.expire(redisKey, this.defaultTTL);
      
      this.logger.log(`Generated global leaderboard at ${redisKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to generate global leaderboard: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Generate a journey-specific leaderboard
   * @param journey Journey type to generate leaderboard for
   * @param redisKey Redis key to store the leaderboard under
   * @param timePeriod Optional time period to filter by
   * @returns Boolean indicating success
   */
  private async generateJourneyLeaderboard(
    journey: JourneyType,
    redisKey: string,
    timePeriod?: LeaderboardTimePeriod
  ): Promise<boolean> {
    try {
      // For journey-specific leaderboards, we need to get user scores from the profiles service
      // This is a fallback mechanism if the Redis cache doesn't have the data
      const journeyConfig = this.journeyConfigs.get(journey);
      
      if (!journeyConfig || !journeyConfig.enabled) {
        this.logger.warn(`Journey ${journey} is not enabled for leaderboards`);
        return false;
      }
      
      // Get top users for this journey from the profiles service
      const topUsers = await this.profilesService.getTopUsersByJourney(journey, journeyConfig.maxEntries);
      
      if (topUsers.length === 0) {
        this.logger.warn(`No users found for journey ${journey} leaderboard`);
        return false;
      }
      
      // Add users to the leaderboard
      const pipeline = this.redis.pipeline();
      
      for (const user of topUsers) {
        pipeline.zadd(redisKey, user.xp, user.userId);
      }
      
      // Set TTL for the generated leaderboard
      pipeline.expire(redisKey, journeyConfig.cacheTtl);
      
      await pipeline.exec();
      
      this.logger.log(`Generated journey leaderboard for ${journey} at ${redisKey} with ${topUsers.length} users`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to generate journey leaderboard for ${journey}: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Get leaderboard entries from Redis
   * @param redisKey Redis key for the leaderboard
   * @param offset Starting position (0-based)
   * @param limit Maximum number of entries to retrieve
   * @returns Array of leaderboard entries
   */
  private async getLeaderboardEntries(redisKey: string, offset: number, limit: number): Promise<LeaderboardEntry[]> {
    try {
      // Get user IDs and scores from Redis sorted set
      // WITHSCORES returns the score along with each member
      // ZREVRANGE returns members in descending order by score (highest first)
      const results = await this.redis.zrevrange(redisKey, offset, offset + limit - 1, 'WITHSCORES');
      
      if (!results || results.length === 0) {
        return [];
      }
      
      // Process results into LeaderboardEntry objects
      const entries: LeaderboardEntry[] = [];
      
      for (let i = 0; i < results.length; i += 2) {
        const userId = results[i];
        const score = parseFloat(results[i + 1]);
        
        // Get user profile data
        try {
          const profile = await this.profilesService.getUserProfile(userId);
          
          if (profile) {
            entries.push({
              rank: Math.floor(offset / 2) + Math.floor(i / 2) + 1, // 1-based rank
              userId,
              level: profile.level,
              xp: score,
              achievements: profile.achievements?.length || 0,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl
            });
          } else {
            // If profile not found, still include basic entry
            entries.push({
              rank: Math.floor(offset / 2) + Math.floor(i / 2) + 1, // 1-based rank
              userId,
              level: 1,
              xp: score,
              achievements: 0
            });
          }
        } catch (error) {
          // If profile service fails, still include basic entry
          this.logger.warn(`Failed to get profile for user ${userId}: ${error.message}`);
          entries.push({
            rank: Math.floor(offset / 2) + Math.floor(i / 2) + 1, // 1-based rank
            userId,
            level: 1,
            xp: score,
            achievements: 0
          });
        }
      }
      
      return entries;
    } catch (error) {
      this.logger.error(`Failed to get leaderboard entries: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Get a user's position in a leaderboard
   * @param redisKey Redis key for the leaderboard
   * @param userId User ID to get position for
   * @returns LeaderboardEntry with user's position or undefined if not found
   */
  private async getUserPositionInLeaderboard(redisKey: string, userId: string): Promise<LeaderboardEntry | undefined> {
    try {
      // Get user's rank (0-based) using ZREVRANK (for descending order)
      const rank = await this.redis.zrevrank(redisKey, userId);
      
      if (rank === null) {
        return undefined;
      }
      
      // Get user's score
      const score = await this.redis.zscore(redisKey, userId);
      
      if (score === null) {
        return undefined;
      }
      
      // Get user profile data
      try {
        const profile = await this.profilesService.getUserProfile(userId);
        
        if (profile) {
          return {
            rank: rank + 1, // Convert to 1-based rank
            userId,
            level: profile.level,
            xp: parseFloat(score),
            achievements: profile.achievements?.length || 0,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl
          };
        }
      } catch (error) {
        this.logger.warn(`Failed to get profile for user ${userId}: ${error.message}`);
      }
      
      // If profile not found or service fails, return basic entry
      return {
        rank: rank + 1, // Convert to 1-based rank
        userId,
        level: 1,
        xp: parseFloat(score),
        achievements: 0
      };
    } catch (error) {
      this.logger.error(`Failed to get user position for ${userId}: ${error.message}`, error.stack);
      return undefined;
    }
  }

  /**
   * Get the Redis key for a leaderboard based on journey and time period
   * @param journey Journey type or null for global leaderboard
   * @param timePeriod Optional time period
   * @returns Redis key string
   */
  private getLeaderboardKey(journey: JourneyType | null, timePeriod?: LeaderboardTimePeriod): string {
    if (!journey && !timePeriod) {
      return this.globalLeaderboardKey;
    }
    
    if (journey && !timePeriod) {
      return this.formatKey(this.journeyLeaderboardKeyPattern, journey);
    }
    
    if (!journey && timePeriod) {
      return this.formatKey(this.timeframeLeaderboardKeyPattern, timePeriod.type);
    }
    
    return this.formatKey(this.journeyTimeframeLeaderboardKeyPattern, journey, timePeriod.type);
  }

  /**
   * Format a Redis key pattern with provided values
   * @param pattern Key pattern with %s placeholders
   * @param values Values to insert into the pattern
   * @returns Formatted key string
   */
  private formatKey(pattern: string, ...values: any[]): string {
    let result = pattern;
    for (const value of values) {
      result = result.replace('%s', value);
    }
    return result;
  }

  /**
   * Clear all leaderboard data from Redis
   * This is primarily used for testing and maintenance
   * @returns Boolean indicating success
   */
  async clearAllLeaderboards(): Promise<boolean> {
    const span = this.tracingService.startSpan('leaderboard.clearAllLeaderboards');
    try {
      // Get all leaderboard keys
      const keys = await this.redis.keys(`${this.leaderboardKeyPrefix}:*`);
      
      if (keys.length === 0) {
        return true;
      }
      
      // Delete all keys
      await this.redis.del(...keys);
      
      this.logger.log(`Cleared ${keys.length} leaderboard keys`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to clear leaderboards: ${error.message}`, error.stack);
      return false;
    } finally {
      span.finish();
    }
  }

  /**
   * Rebuild all leaderboards from scratch
   * This is used for maintenance and recovery
   * @returns Boolean indicating success
   */
  async rebuildAllLeaderboards(): Promise<boolean> {
    const span = this.tracingService.startSpan('leaderboard.rebuildAllLeaderboards');
    try {
      // Clear existing leaderboards
      await this.clearAllLeaderboards();
      
      // Rebuild journey-specific leaderboards
      const journeyPromises = Array.from(this.journeyConfigs.keys()).map(journey => {
        const redisKey = this.formatKey(this.journeyLeaderboardKeyPattern, journey);
        return this.generateJourneyLeaderboard(journey, redisKey);
      });
      
      await Promise.all(journeyPromises);
      
      // Rebuild global leaderboard
      await this.generateGlobalLeaderboard(this.globalLeaderboardKey);
      
      // Rebuild timeframe leaderboards
      const timeframes: ('daily' | 'weekly' | 'monthly')[] = ['daily', 'weekly', 'monthly'];
      
      for (const timeframe of timeframes) {
        // Global timeframe
        const timeframeKey = this.formatKey(this.timeframeLeaderboardKeyPattern, timeframe);
        await this.generateGlobalLeaderboard(timeframeKey, { type: timeframe });
        
        // Journey-specific timeframes
        for (const [journey] of this.journeyConfigs) {
          const journeyTimeframeKey = this.formatKey(
            this.journeyTimeframeLeaderboardKeyPattern, 
            journey, 
            timeframe
          );
          await this.generateJourneyLeaderboard(journey, journeyTimeframeKey, { type: timeframe });
        }
      }
      
      this.logger.log('Successfully rebuilt all leaderboards');
      return true;
    } catch (error) {
      this.logger.error(`Failed to rebuild leaderboards: ${error.message}`, error.stack);
      return false;
    } finally {
      span.finish();
    }
  }
}