import { Controller, Get, Param, Query, UseGuards, UseFilters, UseInterceptors, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@austa/auth';
import { JOURNEY_IDS } from '@austa/interfaces/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardTimeframe, LeaderboardResponseDto, GetLeaderboardDto, LeaderboardPaginationDto, LeaderboardTimeframeDto, LeaderboardFilterDto } from './leaderboard.dto';
import { LoggerService } from '@austa/logging';
import { TracingService } from '@austa/tracing';
import { GlobalExceptionFilter } from '@austa/errors/nest';
import { RetryInterceptor, CircuitBreakerInterceptor } from '@austa/errors/nest';
import { CurrentUser } from '@austa/auth';
import { User } from '@austa/interfaces/auth';
import { ParseEnumPipe, ParseIntPipe } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';

/**
 * Controller responsible for handling leaderboard-related endpoints.
 * Provides RESTful API for retrieving global rankings, journey-specific leaderboards,
 * and personalized user standings with various filtering and pagination options.
 */
@ApiTags('leaderboard')
@Controller('leaderboard')
@UseFilters(GlobalExceptionFilter)
@UseInterceptors(RetryInterceptor, CircuitBreakerInterceptor)
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.setContext('LeaderboardController');
    this.logger.log('LeaderboardController initialized');
  }

  /**
   * Retrieves a journey-specific leaderboard with pagination and timeframe filtering.
   * 
   * @param journey The journey identifier (health, care, plan)
   * @param timeframeDto Timeframe parameters for filtering (daily, weekly, monthly, all-time)
   * @param paginationDto Pagination parameters (page, limit)
   * @param filterDto Additional filtering options
   * @returns Paginated leaderboard data for the specified journey and timeframe
   */
  @Get(':journey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get journey-specific leaderboard' })
  @ApiParam({ name: 'journey', enum: Object.values(JOURNEY_IDS), description: 'Journey identifier' })
  @ApiQuery({ name: 'timeframe', enum: LeaderboardTimeframe, required: false, description: 'Timeframe filter' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully', type: LeaderboardResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async getJourneyLeaderboard(
    @Param('journey', new ParseEnumPipe(JOURNEY_IDS)) journey: string,
    @Query(new ValidationPipe({ transform: true })) timeframeDto: LeaderboardTimeframeDto,
    @Query(new ValidationPipe({ transform: true })) paginationDto: LeaderboardPaginationDto,
    @Query(new ValidationPipe({ transform: true })) filterDto: LeaderboardFilterDto,
  ): Promise<LeaderboardResponseDto> {
    const span = this.tracingService.startSpan('getJourneyLeaderboard');
    try {
      this.logger.log(`Retrieving ${journey} leaderboard with timeframe: ${timeframeDto.timeframe}, page: ${paginationDto.page}, limit: ${paginationDto.limit}`);
      
      const { page, limit } = paginationDto;
      const { timeframe } = timeframeDto;
      
      const entries = await this.leaderboardService.getLeaderboard(
        journey,
        timeframe,
        page,
        limit
      );
      
      // Get total count for pagination metadata
      const total = await this.leaderboardService.getLeaderboardTotalCount(journey, timeframe);
      
      const response: LeaderboardResponseDto = {
        journey,
        timeframe,
        total,
        page,
        limit,
        entries,
        generatedAt: new Date()
      };
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to retrieve ${journey} leaderboard: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves the global leaderboard across all journeys with pagination and timeframe filtering.
   * 
   * @param timeframeDto Timeframe parameters for filtering (daily, weekly, monthly, all-time)
   * @param paginationDto Pagination parameters (page, limit)
   * @param filterDto Additional filtering options
   * @returns Paginated global leaderboard data for the specified timeframe
   */
  @Get('global')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get global leaderboard across all journeys' })
  @ApiQuery({ name: 'timeframe', enum: LeaderboardTimeframe, required: false, description: 'Timeframe filter' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Global leaderboard retrieved successfully', type: LeaderboardResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async getGlobalLeaderboard(
    @Query(new ValidationPipe({ transform: true })) timeframeDto: LeaderboardTimeframeDto,
    @Query(new ValidationPipe({ transform: true })) paginationDto: LeaderboardPaginationDto,
    @Query(new ValidationPipe({ transform: true })) filterDto: LeaderboardFilterDto,
  ): Promise<LeaderboardResponseDto> {
    const span = this.tracingService.startSpan('getGlobalLeaderboard');
    try {
      this.logger.log(`Retrieving global leaderboard with timeframe: ${timeframeDto.timeframe}, page: ${paginationDto.page}, limit: ${paginationDto.limit}`);
      
      const { page, limit } = paginationDto;
      const { timeframe } = timeframeDto;
      
      const entries = await this.leaderboardService.getGlobalLeaderboard(
        timeframe,
        page,
        limit
      );
      
      // Get total count for pagination metadata
      const total = await this.leaderboardService.getGlobalLeaderboardTotalCount(timeframe);
      
      const response: LeaderboardResponseDto = {
        journey: 'global',
        timeframe,
        total,
        page,
        limit,
        entries,
        generatedAt: new Date()
      };
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to retrieve global leaderboard: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves the user's personal ranking across all journeys or within a specific journey.
   * 
   * @param user The authenticated user from JWT token
   * @param journey Optional journey to get ranking for (if not provided, returns global ranking)
   * @param timeframe Optional timeframe filter (daily, weekly, monthly, all-time)
   * @returns The user's ranking information
   */
  @Get('me/:journey?')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the current user's ranking" })
  @ApiParam({ name: 'journey', enum: Object.values(JOURNEY_IDS), required: false, description: 'Optional journey identifier' })
  @ApiQuery({ name: 'timeframe', enum: LeaderboardTimeframe, required: false, description: 'Timeframe filter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User ranking retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async getUserRanking(
    @CurrentUser() user: User,
    @Param('journey') journey?: string,
    @Query('timeframe', new ParseEnumPipe(LeaderboardTimeframe, { optional: true })) 
      timeframe: LeaderboardTimeframe = LeaderboardTimeframe.ALL_TIME,
  ) {
    const span = this.tracingService.startSpan('getUserRanking');
    try {
      this.logger.log(`Retrieving ranking for user ${user.id} in ${journey || 'global'} leaderboard with timeframe: ${timeframe}`);
      
      if (journey) {
        // Validate journey if provided
        if (!Object.values(JOURNEY_IDS).includes(journey)) {
          throw new Error(`Invalid journey: ${journey}`);
        }
        
        return this.leaderboardService.getUserJourneyRanking(user.id, journey, timeframe);
      } else {
        return this.leaderboardService.getUserGlobalRanking(user.id, timeframe);
      }
    } catch (error) {
      this.logger.error(`Failed to retrieve user ranking: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Retrieves the leaderboard for a specific user's friends.
   * 
   * @param user The authenticated user from JWT token
   * @param journey Optional journey to filter by
   * @param timeframeDto Timeframe parameters for filtering
   * @param paginationDto Pagination parameters
   * @returns Paginated leaderboard data for the user's friends
   */
  @Get('friends/:journey?')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get leaderboard for the user's friends" })
  @ApiParam({ name: 'journey', enum: Object.values(JOURNEY_IDS), required: false, description: 'Optional journey identifier' })
  @ApiQuery({ name: 'timeframe', enum: LeaderboardTimeframe, required: false, description: 'Timeframe filter' })
  @ApiQuery({ name: 'page', type: Number, required: false, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', type: Number, required: false, description: 'Items per page' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Friends leaderboard retrieved successfully', type: LeaderboardResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User not authenticated' })
  async getFriendsLeaderboard(
    @CurrentUser() user: User,
    @Param('journey') journey?: string,
    @Query(new ValidationPipe({ transform: true })) timeframeDto: LeaderboardTimeframeDto,
    @Query(new ValidationPipe({ transform: true })) paginationDto: LeaderboardPaginationDto,
  ): Promise<LeaderboardResponseDto> {
    const span = this.tracingService.startSpan('getFriendsLeaderboard');
    try {
      this.logger.log(`Retrieving friends leaderboard for user ${user.id} in ${journey || 'global'} with timeframe: ${timeframeDto.timeframe}`);
      
      const { page, limit } = paginationDto;
      const { timeframe } = timeframeDto;
      
      let entries;
      let total;
      
      if (journey) {
        // Validate journey if provided
        if (!Object.values(JOURNEY_IDS).includes(journey)) {
          throw new Error(`Invalid journey: ${journey}`);
        }
        
        entries = await this.leaderboardService.getFriendsJourneyLeaderboard(
          user.id,
          journey,
          timeframe,
          page,
          limit
        );
        
        total = await this.leaderboardService.getFriendsJourneyLeaderboardTotalCount(
          user.id,
          journey,
          timeframe
        );
      } else {
        entries = await this.leaderboardService.getFriendsGlobalLeaderboard(
          user.id,
          timeframe,
          page,
          limit
        );
        
        total = await this.leaderboardService.getFriendsGlobalLeaderboardTotalCount(
          user.id,
          timeframe
        );
      }
      
      const response: LeaderboardResponseDto = {
        journey: journey || 'global',
        timeframe,
        total,
        page,
        limit,
        entries,
        generatedAt: new Date()
      };
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to retrieve friends leaderboard: ${error.message}`, error.stack);
      throw error;
    } finally {
      span.end();
    }
  }
}