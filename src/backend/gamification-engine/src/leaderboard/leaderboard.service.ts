import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../profiles/profiles.service';
import { RedisService } from '@austa/database/redis';
import { LoggerService } from '@austa/logging';
import { GameProfile } from '@austa/interfaces/gamification/profiles';
import { LeaderboardEntryDto, LeaderboardTimeframe } from './leaderboard.dto';
import { ResourceNotFoundError } from '@austa/errors/categories';

/**
 * Service for generating and retrieving leaderboard data.
 * Handles the business logic for creating leaderboards based on user XP and achievements
 * within the gamification engine.
 */
@Injectable()
export class LeaderboardService {
  private readonly LEADERBOARD_MAX_ENTRIES: number;
  private readonly LEADERBOARD_TTL: number;

  /**
   * Injects the ProfilesService, RedisService, LoggerService and ConfigService dependencies.
   */
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('LeaderboardService');
    this.logger.log('Initializing LeaderboardService');
    this.LEADERBOARD_MAX_ENTRIES = this.configService.get<number>('gamification.leaderboard.maxEntries', 100);
    this.LEADERBOARD_TTL = this.configService.get<number>('gamification.leaderboard.ttl', 60 * 5); // 5 minutes default
  }

  /**
   * Retrieves the leaderboard data, either from cache or by calculating it.
   * @param journey The journey to get leaderboard data for (health, care, plan)
   * @param timeframe Optional timeframe for the leaderboard
   * @param page Optional page number for pagination
   * @param limit Optional limit for number of entries per page
   * @returns A promise that resolves to the leaderboard data.
   */
  async getLeaderboard(
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
    page: number = 1,
    limit: number = 10
  ): Promise<LeaderboardEntryDto[]> {
    try {
      // Create a cache key based on the journey and timeframe
      const cacheKey = `leaderboard:${journey.toLowerCase()}:${timeframe}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved leaderboard from cache: ${cacheKey}`);
        const allEntries = JSON.parse(cachedData);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return allEntries.slice(startIndex, endIndex);
      }
      
      // Calculate leaderboard if not in cache
      this.logger.log(`Calculating leaderboard for journey: ${journey}, timeframe: ${timeframe}`);
      
      // Get user profiles sorted by XP
      const profiles = await this.calculateLeaderboard(journey, timeframe);
      
      // Prepare the leaderboard data with ranks
      const leaderboardData = profiles.slice(0, this.LEADERBOARD_MAX_ENTRIES).map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        level: profile.level,
        xp: profile.xp,
        achievements: profile.achievements?.length || 0
      }));
      
      // Cache the leaderboard data with journey-specific TTL
      const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(leaderboardData),
        ttl
      );
      
      this.logger.log(`Cached leaderboard for ${ttl} seconds: ${cacheKey}`);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return leaderboardData.slice(startIndex, endIndex);
    } catch (error) {
      this.logger.error(`Failed to get leaderboard for ${journey}: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the total count of entries in a journey-specific leaderboard.
   * @param journey The journey to get the count for
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The total number of entries in the leaderboard
   */
  async getLeaderboardTotalCount(
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<number> {
    try {
      // Create a cache key based on the journey and timeframe
      const cacheKey = `leaderboard:${journey.toLowerCase()}:${timeframe}:count`;
      
      // Try to get cached count
      const cachedCount = await this.redisService.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }
      
      // Calculate count if not in cache
      const profiles = await this.profilesService.findAll({
        journey: journey,
        timeframe: timeframe
      });
      
      const count = profiles.length;
      
      // Cache the count
      const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
      await this.redisService.set(cacheKey, count.toString(), ttl);
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get leaderboard count for ${journey}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculates the leaderboard data by retrieving user profiles and sorting them by XP.
   * @param journey The journey to calculate leaderboard for
   * @param timeframe The timeframe to calculate leaderboard for
   * @returns A promise that resolves to the sorted game profiles.
   */
  private async calculateLeaderboard(
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<GameProfile[]> {
    try {
      // Fetch all game profiles with filters for journey and timeframe
      const profiles = await this.profilesService.findAll({
        journey: journey,
        timeframe: timeframe
      });
      
      // Sort by XP in descending order
      return profiles.sort((a, b) => b.xp - a.xp);
    } catch (error) {
      this.logger.error(`Failed to calculate leaderboard: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Retrieves the global leaderboard across all journeys.
   * @param timeframe Optional timeframe for the leaderboard
   * @param page Optional page number for pagination
   * @param limit Optional limit for number of entries per page
   * @returns A promise that resolves to the global leaderboard data.
   */
  async getGlobalLeaderboard(
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
    page: number = 1,
    limit: number = 10
  ): Promise<LeaderboardEntryDto[]> {
    try {
      // Create a cache key for the global leaderboard
      const cacheKey = `leaderboard:global:${timeframe}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved global leaderboard from cache: ${cacheKey}`);
        const allEntries = JSON.parse(cachedData);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return allEntries.slice(startIndex, endIndex);
      }
      
      // Calculate global leaderboard if not in cache
      this.logger.log(`Calculating global leaderboard for timeframe: ${timeframe}`);
      
      // Get all profiles across all journeys
      const profiles = await this.profilesService.findAll({
        timeframe: timeframe
      });
      
      // Sort by total XP across all journeys in descending order
      const sortedProfiles = profiles.sort((a, b) => b.xp - a.xp);
      
      // Prepare the leaderboard data with ranks
      const leaderboardData = sortedProfiles.slice(0, this.LEADERBOARD_MAX_ENTRIES).map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        level: profile.level,
        xp: profile.xp,
        achievements: profile.achievements?.length || 0
      }));
      
      // Cache the leaderboard data
      await this.redisService.set(
        cacheKey,
        JSON.stringify(leaderboardData),
        this.LEADERBOARD_TTL
      );
      
      this.logger.log(`Cached global leaderboard for ${this.LEADERBOARD_TTL} seconds: ${cacheKey}`);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return leaderboardData.slice(startIndex, endIndex);
    } catch (error) {
      this.logger.error(`Failed to get global leaderboard: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the total count of entries in the global leaderboard.
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The total number of entries in the global leaderboard
   */
  async getGlobalLeaderboardTotalCount(
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<number> {
    try {
      // Create a cache key for the count
      const cacheKey = `leaderboard:global:${timeframe}:count`;
      
      // Try to get cached count
      const cachedCount = await this.redisService.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }
      
      // Calculate count if not in cache
      const profiles = await this.profilesService.findAll({
        timeframe: timeframe
      });
      
      const count = profiles.length;
      
      // Cache the count
      await this.redisService.set(cacheKey, count.toString(), this.LEADERBOARD_TTL);
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get global leaderboard count: ${error.message}`, error.stack);
      throw error;
    }
  }
  /**
   * Gets a user's ranking in a specific journey leaderboard.
   * @param userId The ID of the user
   * @param journey The journey to get the ranking for
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The user's ranking information
   */
  async getUserJourneyRanking(
    userId: string,
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<{ rank: number; total: number; profile: GameProfile }> {
    try {
      // Get the full leaderboard data (not paginated)
      const cacheKey = `leaderboard:${journey.toLowerCase()}:${timeframe}`;
      let leaderboardData: LeaderboardEntryDto[] = [];
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        leaderboardData = JSON.parse(cachedData);
      } else {
        // Calculate leaderboard if not in cache
        const profiles = await this.calculateLeaderboard(journey, timeframe);
        
        // Prepare the leaderboard data with ranks
        leaderboardData = profiles.map((profile, index) => ({
          rank: index + 1,
          userId: profile.userId,
          level: profile.level,
          xp: profile.xp,
          achievements: profile.achievements?.length || 0
        }));
        
        // Cache the leaderboard data
        const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
        await this.redisService.set(cacheKey, JSON.stringify(leaderboardData), ttl);
      }
      
      // Find the user's entry in the leaderboard
      const userEntry = leaderboardData.find(entry => entry.userId === userId);
      
      if (!userEntry) {
        // User not found in leaderboard, get their profile and calculate rank
        const profile = await this.profilesService.findOne(userId, journey);
        
        if (!profile) {
          throw new ResourceNotFoundError('User profile not found', {
            userId,
            journey
          });
        }
        
        // Calculate the user's rank by counting profiles with higher XP
        const higherRankedCount = await this.profilesService.countHigherRanked(profile.xp, journey, timeframe);
        
        return {
          rank: higherRankedCount + 1, // Add 1 because ranks start at 1
          total: await this.getLeaderboardTotalCount(journey, timeframe),
          profile
        };
      }
      
      // User found in leaderboard
      const profile = await this.profilesService.findOne(userId, journey);
      
      if (!profile) {
        throw new ResourceNotFoundError('User profile not found', {
          userId,
          journey
        });
      }
      
      return {
        rank: userEntry.rank,
        total: leaderboardData.length,
        profile
      };
    } catch (error) {
      this.logger.error(`Failed to get user journey ranking: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets a user's ranking in the global leaderboard.
   * @param userId The ID of the user
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The user's global ranking information
   */
  async getUserGlobalRanking(
    userId: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<{ rank: number; total: number; profile: GameProfile }> {
    try {
      // Get the full global leaderboard data (not paginated)
      const cacheKey = `leaderboard:global:${timeframe}`;
      let leaderboardData: LeaderboardEntryDto[] = [];
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        leaderboardData = JSON.parse(cachedData);
      } else {
        // Calculate global leaderboard if not in cache
        const profiles = await this.profilesService.findAll({
          timeframe: timeframe
        });
        
        // Sort by total XP in descending order
        const sortedProfiles = profiles.sort((a, b) => b.xp - a.xp);
        
        // Prepare the leaderboard data with ranks
        leaderboardData = sortedProfiles.map((profile, index) => ({
          rank: index + 1,
          userId: profile.userId,
          level: profile.level,
          xp: profile.xp,
          achievements: profile.achievements?.length || 0
        }));
        
        // Cache the leaderboard data
        await this.redisService.set(cacheKey, JSON.stringify(leaderboardData), this.LEADERBOARD_TTL);
      }
      
      // Find the user's entry in the leaderboard
      const userEntry = leaderboardData.find(entry => entry.userId === userId);
      
      if (!userEntry) {
        // User not found in leaderboard, get their profile and calculate rank
        const profile = await this.profilesService.findOne(userId);
        
        if (!profile) {
          throw new ResourceNotFoundError('User profile not found', {
            userId
          });
        }
        
        // Calculate the user's rank by counting profiles with higher XP
        const higherRankedCount = await this.profilesService.countHigherRanked(profile.xp, null, timeframe);
        
        return {
          rank: higherRankedCount + 1, // Add 1 because ranks start at 1
          total: await this.getGlobalLeaderboardTotalCount(timeframe),
          profile
        };
      }
      
      // User found in leaderboard
      const profile = await this.profilesService.findOne(userId);
      
      if (!profile) {
        throw new ResourceNotFoundError('User profile not found', {
          userId
        });
      }
      
      return {
        rank: userEntry.rank,
        total: leaderboardData.length,
        profile
      };
    } catch (error) {
      this.logger.error(`Failed to get user global ranking: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the leaderboard for a user's friends in a specific journey.
   * @param userId The ID of the user
   * @param journey The journey to get the leaderboard for
   * @param timeframe Optional timeframe for the leaderboard
   * @param page Optional page number for pagination
   * @param limit Optional limit for number of entries per page
   * @returns A promise that resolves to the friends leaderboard data.
   */
  async getFriendsJourneyLeaderboard(
    userId: string,
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
    page: number = 1,
    limit: number = 10
  ): Promise<LeaderboardEntryDto[]> {
    try {
      // Create a cache key for the friends leaderboard
      const cacheKey = `leaderboard:${journey.toLowerCase()}:${timeframe}:friends:${userId}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved friends journey leaderboard from cache: ${cacheKey}`);
        const allEntries = JSON.parse(cachedData);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return allEntries.slice(startIndex, endIndex);
      }
      
      // Get the user's friends
      const friendIds = await this.profilesService.getFriendIds(userId);
      
      if (friendIds.length === 0) {
        return [];
      }
      
      // Get profiles for all friends
      const friendProfiles = await this.profilesService.findByIds(friendIds, {
        journey: journey,
        timeframe: timeframe
      });
      
      // Sort by XP in descending order
      const sortedProfiles = friendProfiles.sort((a, b) => b.xp - a.xp);
      
      // Prepare the leaderboard data with ranks
      const leaderboardData = sortedProfiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        level: profile.level,
        xp: profile.xp,
        achievements: profile.achievements?.length || 0
      }));
      
      // Cache the leaderboard data
      const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
      await this.redisService.set(cacheKey, JSON.stringify(leaderboardData), ttl);
      
      this.logger.log(`Cached friends journey leaderboard for ${ttl} seconds: ${cacheKey}`);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return leaderboardData.slice(startIndex, endIndex);
    } catch (error) {
      this.logger.error(`Failed to get friends journey leaderboard: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the total count of entries in a user's friends journey leaderboard.
   * @param userId The ID of the user
   * @param journey The journey to get the count for
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The total number of entries in the friends journey leaderboard
   */
  async getFriendsJourneyLeaderboardTotalCount(
    userId: string,
    journey: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<number> {
    try {
      // Create a cache key for the count
      const cacheKey = `leaderboard:${journey.toLowerCase()}:${timeframe}:friends:${userId}:count`;
      
      // Try to get cached count
      const cachedCount = await this.redisService.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }
      
      // Get the user's friends
      const friendIds = await this.profilesService.getFriendIds(userId);
      const count = friendIds.length;
      
      // Cache the count
      const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
      await this.redisService.set(cacheKey, count.toString(), ttl);
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get friends journey leaderboard count: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the global leaderboard for a user's friends.
   * @param userId The ID of the user
   * @param timeframe Optional timeframe for the leaderboard
   * @param page Optional page number for pagination
   * @param limit Optional limit for number of entries per page
   * @returns A promise that resolves to the global friends leaderboard data.
   */
  async getFriendsGlobalLeaderboard(
    userId: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
    page: number = 1,
    limit: number = 10
  ): Promise<LeaderboardEntryDto[]> {
    try {
      // Create a cache key for the global friends leaderboard
      const cacheKey = `leaderboard:global:${timeframe}:friends:${userId}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved global friends leaderboard from cache: ${cacheKey}`);
        const allEntries = JSON.parse(cachedData);
        
        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        return allEntries.slice(startIndex, endIndex);
      }
      
      // Get the user's friends
      const friendIds = await this.profilesService.getFriendIds(userId);
      
      if (friendIds.length === 0) {
        return [];
      }
      
      // Get profiles for all friends
      const friendProfiles = await this.profilesService.findByIds(friendIds, {
        timeframe: timeframe
      });
      
      // Sort by total XP in descending order
      const sortedProfiles = friendProfiles.sort((a, b) => b.xp - a.xp);
      
      // Prepare the leaderboard data with ranks
      const leaderboardData = sortedProfiles.map((profile, index) => ({
        rank: index + 1,
        userId: profile.userId,
        level: profile.level,
        xp: profile.xp,
        achievements: profile.achievements?.length || 0
      }));
      
      // Cache the leaderboard data
      await this.redisService.set(cacheKey, JSON.stringify(leaderboardData), this.LEADERBOARD_TTL);
      
      this.logger.log(`Cached global friends leaderboard for ${this.LEADERBOARD_TTL} seconds: ${cacheKey}`);
      
      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      return leaderboardData.slice(startIndex, endIndex);
    } catch (error) {
      this.logger.error(`Failed to get global friends leaderboard: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Gets the total count of entries in a user's global friends leaderboard.
   * @param userId The ID of the user
   * @param timeframe Optional timeframe for the leaderboard
   * @returns The total number of entries in the global friends leaderboard
   */
  async getFriendsGlobalLeaderboardTotalCount(
    userId: string,
    timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME
  ): Promise<number> {
    try {
      // Create a cache key for the count
      const cacheKey = `leaderboard:global:${timeframe}:friends:${userId}:count`;
      
      // Try to get cached count
      const cachedCount = await this.redisService.get(cacheKey);
      
      if (cachedCount) {
        return parseInt(cachedCount, 10);
      }
      
      // Get the user's friends
      const friendIds = await this.profilesService.getFriendIds(userId);
      const count = friendIds.length;
      
      // Cache the count
      await this.redisService.set(cacheKey, count.toString(), this.LEADERBOARD_TTL);
      
      return count;
    } catch (error) {
      this.logger.error(`Failed to get global friends leaderboard count: ${error.message}`, error.stack);
      throw error;
    }
  }
}