import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../profiles/profiles.service';
import { RedisService } from '@app/shared/redis/redis.service';
import { LoggerService } from '@app/shared/logging/logger.service';
import { CircuitBreakerUtil } from '../common/utils/circuit-breaker.util';
import { REDIS_KEYS } from '../common/constants/redis-keys';
import { JOURNEY_IDS } from '../common/constants/journey';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { 
  LeaderboardEntry, 
  LeaderboardOptions, 
  JourneyLeaderboard 
} from '@austa/interfaces/gamification/leaderboard';

/**
 * Service responsible for managing leaderboards using Redis Sorted Sets
 * for efficient storage and retrieval of user rankings across all journeys.
 */
@Injectable()
export class LeaderboardService implements OnModuleInit {
  private readonly circuitBreaker: CircuitBreakerUtil;
  private readonly defaultMaxEntries: number;
  private readonly defaultTTL: number;
  private readonly defaultBatchSize: number;
  
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly redisService: RedisService,
    private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.defaultMaxEntries = this.configService.get<number>('gamification.leaderboard.maxEntries', 100);
    this.defaultTTL = this.configService.get<number>('gamification.leaderboard.ttl', 3600); // 1 hour default
    this.defaultBatchSize = this.configService.get<number>('gamification.leaderboard.batchSize', 50);
    
    // Initialize circuit breaker for Redis operations
    this.circuitBreaker = new CircuitBreakerUtil({
      name: 'leaderboard-redis',
      failureThreshold: 3,
      resetTimeout: 30000, // 30 seconds
      fallback: this.getFallbackLeaderboard.bind(this),
    });
    
    this.loggerService.log('LeaderboardService initialized', { 
      defaultMaxEntries: this.defaultMaxEntries,
      defaultTTL: this.defaultTTL,
      defaultBatchSize: this.defaultBatchSize
    });
  }
  
  /**
   * Initialize leaderboards for all journeys when the module starts
   */
  async onModuleInit(): Promise<void> {
    this.loggerService.log('Initializing leaderboards for all journeys');
    try {
      // Initialize leaderboards for all journeys in parallel
      await Promise.all([
        this.refreshLeaderboard(JOURNEY_IDS.HEALTH),
        this.refreshLeaderboard(JOURNEY_IDS.CARE),
        this.refreshLeaderboard(JOURNEY_IDS.PLAN),
        this.refreshGlobalLeaderboard(),
      ]);
      this.loggerService.log('All leaderboards initialized successfully');
    } catch (error) {
      this.loggerService.error('Failed to initialize leaderboards', error);
      // Continue module initialization despite errors
      // Leaderboards will be generated on-demand when requested
    }
  }

  /**
   * Get leaderboard for a specific journey
   * @param journey - Journey identifier (health, care, plan)
   * @param options - Optional parameters for leaderboard retrieval
   * @returns Promise with the leaderboard entries
   */
  async getLeaderboard(
    journey: string,
    options: LeaderboardOptions = {}
  ): Promise<JourneyLeaderboard> {
    const maxEntries = options.limit || this.defaultMaxEntries;
    const startRank = options.startRank || 0;
    const redisKey = this.getLeaderboardKey(journey);
    
    this.loggerService.log('Getting leaderboard', { journey, maxEntries, startRank, redisKey });
    
    try {
      // Use circuit breaker to handle Redis failures gracefully
      return await this.circuitBreaker.execute(async () => {
        // Try to get from cache first
        const cachedLeaderboard = await this.getLeaderboardFromCache(redisKey, startRank, maxEntries);
        
        if (cachedLeaderboard) {
          this.loggerService.log('Leaderboard cache hit', { journey, redisKey });
          const result = {
            journey,
            entries: cachedLeaderboard,
            totalCount: await this.getLeaderboardSize(redisKey),
            updatedAt: new Date(),
          };
          
          // Update in-memory fallback cache
          this.updateInMemoryFallbackLeaderboard(journey, result);
          
          return result;
        }
        
        // Cache miss, calculate and store leaderboard
        this.loggerService.log('Leaderboard cache miss, calculating', { journey, redisKey });
        const leaderboard = await this.calculateAndCacheLeaderboard(journey);
        
        // Create result with the requested slice of the leaderboard
        const result = {
          journey,
          entries: leaderboard.slice(startRank, startRank + maxEntries),
          totalCount: leaderboard.length,
          updatedAt: new Date(),
        };
        
        // Update in-memory fallback cache
        this.updateInMemoryFallbackLeaderboard(journey, result);
        
        return result;
      }, { journey, maxEntries, startRank });
    } catch (error) {
      this.loggerService.error('Error getting leaderboard', { 
        journey, 
        error: error.message,
        stack: error.stack 
      });
      
      // Return fallback leaderboard in case of error
      return this.getFallbackLeaderboard(journey, maxEntries, startRank);
    }
  }
  
  /**
   * Get global leaderboard across all journeys
   * @param options - Optional parameters for leaderboard retrieval
   * @returns Promise with the global leaderboard entries
   */
  async getGlobalLeaderboard(
    options: LeaderboardOptions = {}
  ): Promise<JourneyLeaderboard> {
    const maxEntries = options.limit || this.defaultMaxEntries;
    const startRank = options.startRank || 0;
    const redisKey = REDIS_KEYS.GLOBAL_LEADERBOARD;
    
    this.loggerService.log('Getting global leaderboard', { maxEntries, startRank, redisKey });
    
    try {
      // Use circuit breaker to handle Redis failures gracefully
      return await this.circuitBreaker.execute(async () => {
        // Try to get from cache first
        const cachedLeaderboard = await this.getLeaderboardFromCache(redisKey, startRank, maxEntries);
        
        if (cachedLeaderboard) {
          this.loggerService.log('Global leaderboard cache hit', { redisKey });
          const result = {
            journey: 'global',
            entries: cachedLeaderboard,
            totalCount: await this.getLeaderboardSize(redisKey),
            updatedAt: new Date(),
          };
          
          // Update in-memory fallback cache
          this.updateInMemoryFallbackLeaderboard('global', result);
          
          return result;
        }
        
        // Cache miss, calculate and store global leaderboard
        this.loggerService.log('Global leaderboard cache miss, calculating', { redisKey });
        const leaderboard = await this.calculateAndCacheGlobalLeaderboard();
        
        // Create result with the requested slice of the leaderboard
        const result = {
          journey: 'global',
          entries: leaderboard.slice(startRank, startRank + maxEntries),
          totalCount: leaderboard.length,
          updatedAt: new Date(),
        };
        
        // Update in-memory fallback cache
        this.updateInMemoryFallbackLeaderboard('global', result);
        
        return result;
      }, { maxEntries, startRank });
    } catch (error) {
      this.loggerService.error('Error getting global leaderboard', { 
        error: error.message,
        stack: error.stack 
      });
      
      // Return fallback global leaderboard in case of error
      return this.getFallbackLeaderboard('global', maxEntries, startRank);
    }
  }
  
  /**
   * Update a user's score in the leaderboard in real-time
   * @param userId - User ID
   * @param journey - Journey identifier
   * @param xp - New XP value
   */
  async updateUserScore(userId: string, journey: string, xp: number): Promise<void> {
    const redisKey = this.getLeaderboardKey(journey);
    const globalKey = REDIS_KEYS.GLOBAL_LEADERBOARD;
    
    this.loggerService.log('Updating user score', { userId, journey, xp, redisKey });
    
    try {
      // Use Redis transaction for atomicity
      const multi = this.redisService.multi();
      
      // Update journey-specific leaderboard
      multi.zAdd(redisKey, { score: xp, value: userId });
      
      // Update global leaderboard
      // Get user's total XP across all journeys
      const profile = await this.profilesService.getProfileByUserId(userId);
      if (profile) {
        const totalXp = profile.xp;
        multi.zAdd(globalKey, { score: totalXp, value: userId });
      }
      
      // Execute all commands atomically
      await multi.exec();
      
      this.loggerService.log('User score updated successfully', { userId, journey, xp });
    } catch (error) {
      this.loggerService.error('Failed to update user score', { 
        userId, 
        journey, 
        xp, 
        error: error.message,
        stack: error.stack
      });
      
      // Schedule a background refresh of the leaderboard
      setTimeout(() => this.refreshLeaderboard(journey), 5000);
    }
  }
  
  /**
   * Update multiple user scores in the leaderboard in a batch operation
   * @param updates - Array of user score updates
   */
  async batchUpdateUserScores(updates: Array<{ userId: string; journey: string; xp: number }>): Promise<void> {
    if (!updates || updates.length === 0) {
      return;
    }
    
    this.loggerService.log('Batch updating user scores', { count: updates.length });
    
    try {
      // Group updates by journey for efficient processing
      const journeyUpdates = this.groupUpdatesByJourney(updates);
      
      // Process each journey's updates
      for (const [journey, journeyUpdates] of Object.entries(journeyUpdates)) {
        const redisKey = this.getLeaderboardKey(journey);
        const multi = this.redisService.multi();
        
        // Add all updates to the transaction
        for (const update of journeyUpdates) {
          multi.zAdd(redisKey, { score: update.xp, value: update.userId });
        }
        
        // Execute the transaction
        await multi.exec();
      }
      
      // Update global leaderboard for all affected users
      const userIds = [...new Set(updates.map(update => update.userId))];
      await this.updateGlobalLeaderboardForUsers(userIds);
      
      this.loggerService.log('Batch user score update completed', { count: updates.length });
    } catch (error) {
      this.loggerService.error('Failed to batch update user scores', { 
        error: error.message,
        stack: error.stack
      });
      
      // Schedule background refresh of all affected leaderboards
      const journeys = [...new Set(updates.map(update => update.journey))];
      for (const journey of journeys) {
        setTimeout(() => this.refreshLeaderboard(journey), 5000);
      }
      setTimeout(() => this.refreshGlobalLeaderboard(), 7000);
    }
  }
  
  /**
   * Group updates by journey for efficient batch processing
   * @param updates - Array of user score updates
   * @returns Updates grouped by journey
   */
  private groupUpdatesByJourney(updates: Array<{ userId: string; journey: string; xp: number }>): Record<string, Array<{ userId: string; xp: number }>> {
    const result: Record<string, Array<{ userId: string; xp: number }>> = {};
    
    for (const update of updates) {
      if (!result[update.journey]) {
        result[update.journey] = [];
      }
      
      result[update.journey].push({
        userId: update.userId,
        xp: update.xp
      });
    }
    
    return result;
  }
  
  /**
   * Update global leaderboard for multiple users
   * @param userIds - Array of user IDs
   */
  private async updateGlobalLeaderboardForUsers(userIds: string[]): Promise<void> {
    if (!userIds || userIds.length === 0) {
      return;
    }
    
    try {
      // Get profiles for all users
      const profiles = await this.profilesService.getProfilesByUserIds(userIds);
      
      // Update global leaderboard
      const globalKey = REDIS_KEYS.GLOBAL_LEADERBOARD;
      const multi = this.redisService.multi();
      
      for (const profile of profiles) {
        multi.zAdd(globalKey, { score: profile.xp, value: profile.userId });
      }
      
      await multi.exec();
    } catch (error) {
      this.loggerService.error('Failed to update global leaderboard for users', { 
        userCount: userIds.length,
        error: error.message,
        stack: error.stack
      });
      
      // Schedule a background refresh of the global leaderboard
      setTimeout(() => this.refreshGlobalLeaderboard(), 5000);
    }
  }
  
  /**
   * Refresh the leaderboard for a specific journey
   * @param journey - Journey identifier
   */
  async refreshLeaderboard(journey: string): Promise<LeaderboardEntry[]> {
    this.loggerService.log('Refreshing leaderboard', { journey });
    try {
      return await this.calculateAndCacheLeaderboard(journey);
    } catch (error) {
      this.loggerService.error('Failed to refresh leaderboard', { 
        journey, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Refresh the global leaderboard
   */
  async refreshGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    this.loggerService.log('Refreshing global leaderboard');
    try {
      return await this.calculateAndCacheGlobalLeaderboard();
    } catch (error) {
      this.loggerService.error('Failed to refresh global leaderboard', { 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Calculate and cache leaderboard for a specific journey
   * @param journey - Journey identifier
   * @returns Leaderboard entries
   */
  private async calculateAndCacheLeaderboard(journey: string): Promise<LeaderboardEntry[]> {
    const redisKey = this.getLeaderboardKey(journey);
    
    try {
      // Get all profiles
      const profiles = await this.profilesService.getAllProfiles();
      
      // Filter profiles by journey if needed
      const journeyProfiles = this.filterProfilesByJourney(profiles, journey);
      
      // Sort profiles by XP (descending)
      const sortedProfiles = this.sortProfilesByXp(journeyProfiles);
      
      // Map to leaderboard entries with rank
      const leaderboard = this.mapProfilesToLeaderboardEntries(sortedProfiles);
      
      // Cache in Redis using Sorted Set for efficient ranking
      await this.cacheLeaderboardInRedis(redisKey, journeyProfiles);
      
      return leaderboard;
    } catch (error) {
      this.loggerService.error('Error calculating leaderboard', { 
        journey, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Calculate and cache global leaderboard across all journeys
   * @returns Global leaderboard entries
   */
  private async calculateAndCacheGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    const redisKey = REDIS_KEYS.GLOBAL_LEADERBOARD;
    
    try {
      // Get all profiles
      const profiles = await this.profilesService.getAllProfiles();
      
      // Sort profiles by total XP (descending)
      const sortedProfiles = this.sortProfilesByXp(profiles);
      
      // Map to leaderboard entries with rank
      const leaderboard = this.mapProfilesToLeaderboardEntries(sortedProfiles);
      
      // Cache in Redis using Sorted Set for efficient ranking
      await this.cacheLeaderboardInRedis(redisKey, profiles);
      
      return leaderboard;
    } catch (error) {
      this.loggerService.error('Error calculating global leaderboard', { 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Get leaderboard from Redis cache
   * @param redisKey - Redis key for the leaderboard
   * @param start - Start rank (0-based)
   * @param count - Number of entries to retrieve
   * @returns Leaderboard entries or null if not found
   */
  private async getLeaderboardFromCache(
    redisKey: string,
    start: number,
    count: number
  ): Promise<LeaderboardEntry[] | null> {
    try {
      // Check if the leaderboard exists in Redis
      const exists = await this.redisService.exists(redisKey);
      if (!exists) {
        return null;
      }
      
      // Get leaderboard entries with scores from Redis Sorted Set
      // zRevRangeWithScores returns entries in descending order by score
      const leaderboardWithScores = await this.redisService.zRevRangeWithScores(
        redisKey,
        start,
        start + count - 1
      );
      
      if (!leaderboardWithScores || leaderboardWithScores.length === 0) {
        return null;
      }
      
      // Get user details for the leaderboard entries
      const userIds = leaderboardWithScores.map(entry => entry.value);
      const userProfiles = await this.profilesService.getProfilesByUserIds(userIds);
      
      // Create a map for faster lookups
      const profileMap = new Map<string, GameProfile>();
      userProfiles.forEach(profile => {
        profileMap.set(profile.userId, profile);
      });
      
      // Map Redis entries to LeaderboardEntry objects
      return leaderboardWithScores.map((entry, index) => {
        const userId = entry.value;
        const profile = profileMap.get(userId);
        
        return {
          rank: start + index + 1,
          userId,
          username: profile?.username || 'Unknown User',
          avatarUrl: profile?.avatarUrl,
          level: profile?.level || 1,
          xp: Math.floor(entry.score),
        };
      });
    } catch (error) {
      this.loggerService.error('Error getting leaderboard from cache', { 
        redisKey, 
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }
  
  /**
   * Cache leaderboard in Redis using Sorted Set
   * @param redisKey - Redis key for the leaderboard
   * @param profiles - User profiles to cache
   */
  private async cacheLeaderboardInRedis(redisKey: string, profiles: GameProfile[]): Promise<void> {
    try {
      // Use Redis transaction (MULTI/EXEC) for atomicity
      const multi = this.redisService.multi();
      
      // Clear existing leaderboard
      multi.del(redisKey);
      
      // Process profiles in batches to avoid large Redis commands
      const batchSize = this.defaultBatchSize;
      for (let i = 0; i < profiles.length; i += batchSize) {
        const batch = profiles.slice(i, i + batchSize);
        
        // Prepare entries for Redis Sorted Set
        const entries = batch.map(profile => ({
          score: profile.xp,
          value: profile.userId,
        }));
        
        // Add entries to Redis Sorted Set
        if (entries.length > 0) {
          multi.zAdd(redisKey, ...entries);
        }
      }
      
      // Set TTL for the leaderboard
      const ttl = this.getLeaderboardTTL(redisKey);
      multi.expire(redisKey, ttl);
      
      // Execute all commands atomically
      await multi.exec();
      
      this.loggerService.log('Leaderboard cached successfully', { 
        redisKey, 
        profilesCount: profiles.length,
        ttl
      });
    } catch (error) {
      this.loggerService.error('Error caching leaderboard in Redis', { 
        redisKey, 
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
  
  /**
   * Get the size of a leaderboard in Redis
   * @param redisKey - Redis key for the leaderboard
   * @returns Number of entries in the leaderboard
   */
  private async getLeaderboardSize(redisKey: string): Promise<number> {
    try {
      // Use circuit breaker for Redis operations
      return await this.circuitBreaker.execute(async () => {
        return await this.redisService.zCard(redisKey);
      }, { redisKey });
    } catch (error) {
      this.loggerService.error('Error getting leaderboard size', { 
        redisKey, 
        error: error.message
      });
      return 0;
    }
  }
  
  /**
   * Get user rank in a specific leaderboard
   * @param userId - User ID
   * @param journey - Journey identifier
   * @returns User rank (1-based) or null if not found
   */
  async getUserRank(userId: string, journey: string): Promise<number | null> {
    const redisKey = journey === 'global' 
      ? REDIS_KEYS.GLOBAL_LEADERBOARD 
      : this.getLeaderboardKey(journey);
    
    this.loggerService.log('Getting user rank', { userId, journey, redisKey });
    
    try {
      // Use circuit breaker for Redis operations
      return await this.circuitBreaker.execute(async () => {
        // zRevRank returns 0-based rank in descending order
        const rank = await this.redisService.zRevRank(redisKey, userId);
        
        // Return 1-based rank or null if not found
        return rank !== null ? rank + 1 : null;
      }, { userId, journey, redisKey });
    } catch (error) {
      this.loggerService.error('Error getting user rank', { 
        userId, 
        journey, 
        error: error.message,
        stack: error.stack
      });
      return null;
    }
  }
  
  /**
   * Get users around a specific user in the leaderboard
   * @param userId - User ID
   * @param journey - Journey identifier
   * @param range - Number of users to get before and after the user
   * @returns Leaderboard entries around the user
   */
  async getUsersAroundUser(
    userId: string, 
    journey: string, 
    range: number = 5
  ): Promise<JourneyLeaderboard> {
    const redisKey = journey === 'global' 
      ? REDIS_KEYS.GLOBAL_LEADERBOARD 
      : this.getLeaderboardKey(journey);
    
    this.loggerService.log('Getting users around user', { userId, journey, range, redisKey });
    
    try {
      // Use circuit breaker for Redis operations
      return await this.circuitBreaker.execute(async () => {
        // Get user's rank
        const userRank = await this.redisService.zRevRank(redisKey, userId);
        
        if (userRank === null) {
          this.loggerService.warn('User not found in leaderboard', { userId, journey });
          return {
            journey,
            entries: [],
            totalCount: await this.getLeaderboardSize(redisKey),
            updatedAt: new Date(),
            error: 'User not found in leaderboard',
          };
        }
        
        // Calculate start and end ranks
        const start = Math.max(0, userRank - range);
        const end = userRank + range;
        
        // Get leaderboard entries
        const entries = await this.getLeaderboardFromCache(redisKey, start, end - start + 1);
        
        if (!entries) {
          this.loggerService.warn('Failed to get users around user', { userId, journey });
          return this.getFallbackLeaderboard(journey);
        }
        
        const result = {
          journey,
          entries,
          totalCount: await this.getLeaderboardSize(redisKey),
          updatedAt: new Date(),
          focusedUserId: userId,
        };
        
        return result;
      }, { userId, journey, range });
    } catch (error) {
      this.loggerService.error('Error getting users around user', { 
        userId, 
        journey, 
        error: error.message,
        stack: error.stack
      });
      return this.getFallbackLeaderboard(journey);
    }
  }
  
  /**
   * Filter profiles by journey
   * @param profiles - All user profiles
   * @param journey - Journey identifier
   * @returns Filtered profiles
   */
  private filterProfilesByJourney(profiles: GameProfile[], journey: string): GameProfile[] {
    // Filter profiles based on journey-specific activity
    // This implementation assumes the GameProfile has journeyStats or a similar property
    // that tracks journey-specific activity
    if (journey === 'global') {
      return profiles; // No filtering for global leaderboard
    }
    
    return profiles.filter(profile => {
      // Check if the profile has activity in the specified journey
      // This is a simplified implementation and should be expanded based on the actual data model
      if (profile.journeyStats && profile.journeyStats[journey]) {
        return profile.journeyStats[journey].hasActivity === true;
      }
      
      // If journeyStats is not available, include all profiles
      return true;
    });
  }
  
  /**
   * Sort profiles by XP (descending)
   * @param profiles - User profiles
   * @returns Sorted profiles
   */
  private sortProfilesByXp(profiles: GameProfile[]): GameProfile[] {
    return [...profiles].sort((a, b) => b.xp - a.xp);
  }
  
  /**
   * Map profiles to leaderboard entries with rank
   * @param profiles - Sorted user profiles
   * @returns Leaderboard entries
   */
  private mapProfilesToLeaderboardEntries(profiles: GameProfile[]): LeaderboardEntry[] {
    return profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      username: profile.username || 'Unknown User',
      avatarUrl: profile.avatarUrl,
      level: profile.level || 1,
      xp: profile.xp,
    }));
  }
  
  /**
   * Get Redis key for a journey leaderboard
   * @param journey - Journey identifier
   * @returns Redis key
   */
  private getLeaderboardKey(journey: string): string {
    return `${REDIS_KEYS.LEADERBOARD_PREFIX}:${journey}`;
  }
  
  /**
   * Get TTL for a leaderboard in Redis
   * @param redisKey - Redis key for the leaderboard
   * @returns TTL in seconds
   */
  private getLeaderboardTTL(redisKey: string): number {
    // Use journey-specific TTL if available, otherwise use default
    if (redisKey.includes(JOURNEY_IDS.HEALTH)) {
      return this.configService.get<number>('gamification.leaderboard.health.ttl', this.defaultTTL);
    }
    if (redisKey.includes(JOURNEY_IDS.CARE)) {
      return this.configService.get<number>('gamification.leaderboard.care.ttl', this.defaultTTL);
    }
    if (redisKey.includes(JOURNEY_IDS.PLAN)) {
      return this.configService.get<number>('gamification.leaderboard.plan.ttl', this.defaultTTL);
    }
    if (redisKey === REDIS_KEYS.GLOBAL_LEADERBOARD) {
      return this.configService.get<number>('gamification.leaderboard.global.ttl', this.defaultTTL);
    }
    
    return this.defaultTTL;
  }
  
  /**
   * Get fallback leaderboard in case of errors
   * @param journey - Journey identifier
   * @param limit - Maximum number of entries
   * @param startRank - Starting rank
   * @returns Fallback leaderboard
   */
  private getFallbackLeaderboard(
    journey: string,
    limit: number = this.defaultMaxEntries,
    startRank: number = 0
  ): JourneyLeaderboard {
    this.loggerService.warn('Using fallback leaderboard', { journey, limit, startRank });
    
    // Try to get cached leaderboard from memory if available
    const cachedLeaderboard = this.getInMemoryFallbackLeaderboard(journey);
    if (cachedLeaderboard && cachedLeaderboard.entries.length > 0) {
      this.loggerService.log('Using in-memory fallback leaderboard', { 
        journey, 
        entriesCount: cachedLeaderboard.entries.length 
      });
      
      return {
        ...cachedLeaderboard,
        entries: cachedLeaderboard.entries.slice(startRank, startRank + limit),
        error: 'Using cached data. Real-time updates may not be reflected.',
      };
    }
    
    // Return empty leaderboard with error flag
    return {
      journey,
      entries: [],
      totalCount: 0,
      updatedAt: new Date(),
      error: 'Leaderboard temporarily unavailable',
    };
  }
  
  // In-memory cache for fallback leaderboards
  private inMemoryLeaderboardCache: Record<string, JourneyLeaderboard> = {};
  
  /**
   * Get in-memory fallback leaderboard
   * @param journey - Journey identifier
   * @returns Cached leaderboard or null
   */
  private getInMemoryFallbackLeaderboard(journey: string): JourneyLeaderboard | null {
    const cachedLeaderboard = this.inMemoryLeaderboardCache[journey];
    
    // Check if cache exists and is not too old (max 1 hour)
    if (cachedLeaderboard) {
      const cacheAge = Date.now() - cachedLeaderboard.updatedAt.getTime();
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      
      if (cacheAge < maxAge) {
        return cachedLeaderboard;
      }
    }
    
    return null;
  }
  
  /**
   * Update in-memory fallback leaderboard cache
   * @param journey - Journey identifier
   * @param leaderboard - Leaderboard to cache
   */
  private updateInMemoryFallbackLeaderboard(journey: string, leaderboard: JourneyLeaderboard): void {
    this.inMemoryLeaderboardCache[journey] = {
      ...leaderboard,
      updatedAt: new Date(),
    };
  }
}