import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '@app/profiles/profiles.service';
import { RedisService } from '@app/shared/redis/redis.service';
import { LoggerService } from '@app/logging';
import { GameProfile } from '@app/profiles/entities/game-profile.entity';
import { JourneyType } from '@austa/interfaces/gamification';
import { LeaderboardQueryDto, LeaderboardResponseDto, LeaderboardTimeframeDto, UserRankResponseDto } from './dto';

/**
 * Service for generating and retrieving leaderboard data.
 * Handles the business logic for creating leaderboards based on user XP and achievements
 * within the gamification engine.
 */
@Injectable()
export class LeaderboardService {
  private readonly LEADERBOARD_MAX_ENTRIES: number;
  private readonly LEADERBOARD_TTL: number;
  private readonly SURROUNDING_USERS_COUNT: number = 5; // Number of users to show above and below current user

  /**
   * Injects the ProfilesService, RedisService, LoggerService and ConfigService dependencies.
   */
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly redisService: RedisService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('Initializing LeaderboardService', 'LeaderboardService');
    this.LEADERBOARD_MAX_ENTRIES = this.configService.get<number>('gamification.leaderboard.maxEntries', 100);
    this.LEADERBOARD_TTL = this.configService.get<number>('gamification.leaderboard.ttl', 60 * 5); // 5 minutes default
  }

  /**
   * Retrieves the global leaderboard across all journeys
   * @param query Pagination and filtering parameters
   * @returns A promise that resolves to the global leaderboard data
   */
  async getGlobalLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
    try {
      // Create a cache key based on pagination parameters
      const cacheKey = `leaderboard:global:page:${query.page}:size:${query.pageSize}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved global leaderboard from cache: ${cacheKey}`, 'LeaderboardService');
        return JSON.parse(cachedData);
      }
      
      // Calculate leaderboard if not in cache
      this.logger.log(`Calculating global leaderboard with pagination: page ${query.page}, size ${query.pageSize}`, 'LeaderboardService');
      
      // Get user profiles sorted by XP
      const profiles = await this.calculateGlobalLeaderboard();
      const totalItems = profiles.length;
      
      // Apply pagination
      const startIndex = (query.page - 1) * query.pageSize;
      const endIndex = startIndex + query.pageSize;
      const paginatedProfiles = profiles.slice(startIndex, endIndex);
      
      // Prepare the leaderboard data with ranks
      const entries = paginatedProfiles.map((profile, index) => ({
        rank: startIndex + index + 1,
        userId: profile.userId,
        displayName: profile.displayName || `User-${profile.userId.substring(0, 8)}`,
        level: profile.level,
        xp: profile.xp,
        achievements: profile.achievements?.length || 0,
        avatarUrl: profile.avatarUrl
      }));
      
      const leaderboardData: LeaderboardResponseDto = {
        entries,
        totalItems
      };
      
      // Cache the leaderboard data
      await this.redisService.set(
        cacheKey,
        JSON.stringify(leaderboardData),
        this.LEADERBOARD_TTL
      );
      
      this.logger.log(`Cached global leaderboard for ${this.LEADERBOARD_TTL} seconds: ${cacheKey}`, 'LeaderboardService');
      
      return leaderboardData;
    } catch (error) {
      this.logger.error(`Failed to get global leaderboard: ${error.message}`, error.stack, 'LeaderboardService');
      throw error;
    }
  }

  /**
   * Retrieves a journey-specific leaderboard
   * @param journey The journey type (health, care, plan)
   * @param query Pagination and filtering parameters
   * @returns A promise that resolves to the journey-specific leaderboard data
   */
  async getJourneyLeaderboard(journey: JourneyType, query: LeaderboardQueryDto): Promise<LeaderboardResponseDto> {
    try {
      // Create a cache key based on the journey and pagination parameters
      const cacheKey = `leaderboard:${journey.toLowerCase()}:page:${query.page}:size:${query.pageSize}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved journey leaderboard from cache: ${cacheKey}`, 'LeaderboardService');
        return JSON.parse(cachedData);
      }
      
      // Calculate leaderboard if not in cache
      this.logger.log(`Calculating leaderboard for journey: ${journey} with pagination: page ${query.page}, size ${query.pageSize}`, 'LeaderboardService');
      
      // Get user profiles sorted by XP for the specific journey
      const profiles = await this.calculateJourneyLeaderboard(journey);
      const totalItems = profiles.length;
      
      // Apply pagination
      const startIndex = (query.page - 1) * query.pageSize;
      const endIndex = startIndex + query.pageSize;
      const paginatedProfiles = profiles.slice(startIndex, endIndex);
      
      // Prepare the leaderboard data with ranks
      const entries = paginatedProfiles.map((profile, index) => ({
        rank: startIndex + index + 1,
        userId: profile.userId,
        displayName: profile.displayName || `User-${profile.userId.substring(0, 8)}`,
        level: profile.journeyLevels?.[journey] || profile.level,
        xp: profile.journeyXp?.[journey] || profile.xp,
        achievements: profile.journeyAchievements?.[journey]?.length || 0,
        avatarUrl: profile.avatarUrl
      }));
      
      const leaderboardData: LeaderboardResponseDto = {
        entries,
        totalItems
      };
      
      // Cache the leaderboard data with journey-specific TTL
      const ttl = this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL;
      await this.redisService.set(
        cacheKey,
        JSON.stringify(leaderboardData),
        ttl
      );
      
      this.logger.log(`Cached journey leaderboard for ${ttl} seconds: ${cacheKey}`, 'LeaderboardService');
      
      return leaderboardData;
    } catch (error) {
      this.logger.error(`Failed to get leaderboard for journey ${journey}: ${error.message}`, error.stack, 'LeaderboardService');
      throw error;
    }
  }

  /**
   * Retrieves a time-period specific leaderboard (daily, weekly, monthly, all-time)
   * @param timeframe The time period (daily, weekly, monthly, all-time)
   * @param journey Optional journey type to filter by
   * @param query Pagination and filtering parameters
   * @returns A promise that resolves to the time-period specific leaderboard data
   */
  async getTimeframeLeaderboard(
    timeframe: LeaderboardTimeframeDto,
    journey?: JourneyType,
    query?: LeaderboardQueryDto
  ): Promise<LeaderboardResponseDto> {
    try {
      // Use default pagination if not provided
      const paginationQuery = query || { page: 1, pageSize: 10 };
      
      // Create a cache key based on the timeframe, optional journey, and pagination parameters
      const journeyPart = journey ? `:${journey.toLowerCase()}` : '';
      const cacheKey = `leaderboard:${timeframe}${journeyPart}:page:${paginationQuery.page}:size:${paginationQuery.pageSize}`;
      
      // Try to get cached leaderboard data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved timeframe leaderboard from cache: ${cacheKey}`, 'LeaderboardService');
        return JSON.parse(cachedData);
      }
      
      // Calculate leaderboard if not in cache
      this.logger.log(
        `Calculating leaderboard for timeframe: ${timeframe}${journey ? ` and journey: ${journey}` : ''} with pagination: page ${paginationQuery.page}, size ${paginationQuery.pageSize}`,
        'LeaderboardService'
      );
      
      // Get user profiles sorted by XP for the specific timeframe and optional journey
      const profiles = await this.calculateTimeframeLeaderboard(timeframe, journey);
      const totalItems = profiles.length;
      
      // Apply pagination
      const startIndex = (paginationQuery.page - 1) * paginationQuery.pageSize;
      const endIndex = startIndex + paginationQuery.pageSize;
      const paginatedProfiles = profiles.slice(startIndex, endIndex);
      
      // Prepare the leaderboard data with ranks
      const entries = paginatedProfiles.map((profile, index) => {
        // For journey-specific timeframe, use journey-specific XP and level
        const xp = journey ? (profile.journeyXp?.[journey] || profile.xp) : profile.xp;
        const level = journey ? (profile.journeyLevels?.[journey] || profile.level) : profile.level;
        const achievements = journey 
          ? (profile.journeyAchievements?.[journey]?.length || 0)
          : (profile.achievements?.length || 0);
          
        return {
          rank: startIndex + index + 1,
          userId: profile.userId,
          displayName: profile.displayName || `User-${profile.userId.substring(0, 8)}`,
          level,
          xp,
          achievements,
          avatarUrl: profile.avatarUrl
        };
      });
      
      const leaderboardData: LeaderboardResponseDto = {
        entries,
        totalItems
      };
      
      // Cache the leaderboard data with appropriate TTL based on timeframe
      let ttl = this.LEADERBOARD_TTL;
      switch (timeframe) {
        case LeaderboardTimeframeDto.DAILY:
          ttl = 60 * 60; // 1 hour
          break;
        case LeaderboardTimeframeDto.WEEKLY:
          ttl = 60 * 60 * 3; // 3 hours
          break;
        case LeaderboardTimeframeDto.MONTHLY:
          ttl = 60 * 60 * 6; // 6 hours
          break;
        case LeaderboardTimeframeDto.ALL_TIME:
          ttl = 60 * 60 * 12; // 12 hours
          break;
      }
      
      // If journey-specific, adjust TTL based on journey
      if (journey) {
        ttl = Math.min(ttl, this.redisService.getJourneyTTL(journey) || ttl);
      }
      
      await this.redisService.set(
        cacheKey,
        JSON.stringify(leaderboardData),
        ttl
      );
      
      this.logger.log(`Cached timeframe leaderboard for ${ttl} seconds: ${cacheKey}`, 'LeaderboardService');
      
      return leaderboardData;
    } catch (error) {
      this.logger.error(
        `Failed to get leaderboard for timeframe ${timeframe}${journey ? ` and journey ${journey}` : ''}: ${error.message}`,
        error.stack,
        'LeaderboardService'
      );
      throw error;
    }
  }

  /**
   * Retrieves the current user's rank and surrounding users on the leaderboard
   * @param userId The ID of the user to get rank for
   * @param journey Optional journey type to filter by
   * @returns A promise that resolves to the user's rank and surrounding users
   */
  async getUserRank(userId: string, journey?: JourneyType): Promise<UserRankResponseDto> {
    try {
      // Create a cache key based on the user ID and optional journey
      const journeyPart = journey ? `:${journey.toLowerCase()}` : '';
      const cacheKey = `leaderboard:user:${userId}${journeyPart}`;
      
      // Try to get cached user rank data
      const cachedData = await this.redisService.get(cacheKey);
      
      if (cachedData) {
        this.logger.log(`Retrieved user rank from cache: ${cacheKey}`, 'LeaderboardService');
        return JSON.parse(cachedData);
      }
      
      // Calculate user rank if not in cache
      this.logger.log(
        `Calculating rank for user: ${userId}${journey ? ` in journey: ${journey}` : ''}`,
        'LeaderboardService'
      );
      
      // Get all profiles for ranking
      const profiles = journey 
        ? await this.calculateJourneyLeaderboard(journey)
        : await this.calculateGlobalLeaderboard();
      
      // Find the user's position in the leaderboard
      const userIndex = profiles.findIndex(profile => profile.userId === userId);
      
      if (userIndex === -1) {
        throw new Error(`User ${userId} not found in leaderboard`);
      }
      
      // Get the user's profile
      const userProfile = profiles[userIndex];
      
      // Calculate surrounding users
      const startAboveIndex = Math.max(0, userIndex - this.SURROUNDING_USERS_COUNT);
      const endBelowIndex = Math.min(profiles.length - 1, userIndex + this.SURROUNDING_USERS_COUNT);
      
      const usersAbove = profiles
        .slice(startAboveIndex, userIndex)
        .map((profile, index) => this.mapProfileToLeaderboardEntry(profile, startAboveIndex + index + 1, journey));
      
      const usersBelow = profiles
        .slice(userIndex + 1, endBelowIndex + 1)
        .map((profile, index) => this.mapProfileToLeaderboardEntry(profile, userIndex + index + 2, journey));
      
      // Create the current user entry
      const currentUser = this.mapProfileToLeaderboardEntry(userProfile, userIndex + 1, journey);
      
      // Calculate percentile (higher is better)
      const percentile = ((profiles.length - userIndex) / profiles.length) * 100;
      
      const userRankData: UserRankResponseDto = {
        currentUser,
        usersAbove,
        usersBelow,
        totalUsers: profiles.length,
        percentile: Math.min(100, Math.round(percentile * 10) / 10) // Round to 1 decimal place, max 100
      };
      
      // Cache the user rank data
      const ttl = journey 
        ? (this.redisService.getJourneyTTL(journey) || this.LEADERBOARD_TTL)
        : this.LEADERBOARD_TTL;
      
      await this.redisService.set(
        cacheKey,
        JSON.stringify(userRankData),
        ttl
      );
      
      this.logger.log(`Cached user rank for ${ttl} seconds: ${cacheKey}`, 'LeaderboardService');
      
      return userRankData;
    } catch (error) {
      this.logger.error(
        `Failed to get rank for user ${userId}${journey ? ` in journey ${journey}` : ''}: ${error.message}`,
        error.stack,
        'LeaderboardService'
      );
      throw error;
    }
  }

  /**
   * Maps a GameProfile to a LeaderboardEntryDto
   * @param profile The GameProfile to map
   * @param rank The rank to assign
   * @param journey Optional journey to use for journey-specific data
   * @returns A LeaderboardEntryDto
   */
  private mapProfileToLeaderboardEntry(profile: GameProfile, rank: number, journey?: JourneyType) {
    return {
      rank,
      userId: profile.userId,
      displayName: profile.displayName || `User-${profile.userId.substring(0, 8)}`,
      level: journey ? (profile.journeyLevels?.[journey] || profile.level) : profile.level,
      xp: journey ? (profile.journeyXp?.[journey] || profile.xp) : profile.xp,
      achievements: journey 
        ? (profile.journeyAchievements?.[journey]?.length || 0)
        : (profile.achievements?.length || 0),
      avatarUrl: profile.avatarUrl
    };
  }

  /**
   * Calculates the global leaderboard across all journeys
   * @returns A promise that resolves to sorted GameProfiles
   */
  private async calculateGlobalLeaderboard(): Promise<GameProfile[]> {
    try {
      // In a real implementation, this would query the database to get all game profiles
      // sorted by XP in descending order
      const profiles = await this.profilesService.getAllProfiles();
      
      // Sort by XP in descending order
      return profiles.sort((a, b) => b.xp - a.xp);
    } catch (error) {
      this.logger.error(`Failed to calculate global leaderboard: ${error.message}`, error.stack, 'LeaderboardService');
      throw error;
    }
  }

  /**
   * Calculates a journey-specific leaderboard
   * @param journey The journey type
   * @returns A promise that resolves to sorted GameProfiles
   */
  private async calculateJourneyLeaderboard(journey: JourneyType): Promise<GameProfile[]> {
    try {
      // In a real implementation, this would query the database to get all game profiles
      // with journey-specific XP and sort them
      const profiles = await this.profilesService.getAllProfiles();
      
      // Sort by journey-specific XP in descending order
      return profiles.sort((a, b) => {
        const aXp = a.journeyXp?.[journey] || 0;
        const bXp = b.journeyXp?.[journey] || 0;
        return bXp - aXp;
      });
    } catch (error) {
      this.logger.error(`Failed to calculate leaderboard for journey ${journey}: ${error.message}`, error.stack, 'LeaderboardService');
      throw error;
    }
  }

  /**
   * Calculates a time-period specific leaderboard
   * @param timeframe The time period
   * @param journey Optional journey type
   * @returns A promise that resolves to sorted GameProfiles
   */
  private async calculateTimeframeLeaderboard(timeframe: LeaderboardTimeframeDto, journey?: JourneyType): Promise<GameProfile[]> {
    try {
      // Calculate the start date based on the timeframe
      const now = new Date();
      let startDate: Date;
      
      switch (timeframe) {
        case LeaderboardTimeframeDto.DAILY:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case LeaderboardTimeframeDto.WEEKLY:
          // Start of the current week (Sunday)
          const day = now.getDay();
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
          break;
        case LeaderboardTimeframeDto.MONTHLY:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case LeaderboardTimeframeDto.ALL_TIME:
        default:
          // No date filtering for all-time
          return journey 
            ? await this.calculateJourneyLeaderboard(journey)
            : await this.calculateGlobalLeaderboard();
      }
      
      // In a real implementation, this would query the database to get all game profiles
      // with XP earned during the specified timeframe
      const profiles = await this.profilesService.getProfilesByTimeframe(startDate, now);
      
      // Sort by XP earned during the timeframe
      if (journey) {
        return profiles.sort((a, b) => {
          const aXp = a.journeyXpByTimeframe?.[timeframe]?.[journey] || 0;
          const bXp = b.journeyXpByTimeframe?.[timeframe]?.[journey] || 0;
          return bXp - aXp;
        });
      } else {
        return profiles.sort((a, b) => {
          const aXp = a.xpByTimeframe?.[timeframe] || 0;
          const bXp = b.xpByTimeframe?.[timeframe] || 0;
          return bXp - aXp;
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to calculate leaderboard for timeframe ${timeframe}${journey ? ` and journey ${journey}` : ''}: ${error.message}`,
        error.stack,
        'LeaderboardService'
      );
      throw error;
    }
  }
}