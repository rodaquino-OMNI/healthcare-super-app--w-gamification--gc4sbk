import { Controller, Get, Param, Query, UseGuards, UseFilters, HttpStatus, ParseEnumPipe, ValidationPipe, UsePipes, UseInterceptors, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@austa/auth';
import { AllExceptionsFilter } from '@app/errors';
import { TracingService } from '@app/tracing';
import { LoggerService } from '@app/logging';
import { LeaderboardService } from './leaderboard.service';
import { JourneyType } from '@austa/interfaces/gamification';
import { PaginationRequestDto, BaseResponseDto } from '@app/common/dto';
import { LeaderboardResponseDto, LeaderboardQueryDto, UserRankResponseDto, LeaderboardTimeframeDto } from './dto';

/**
 * Controller for leaderboard-related endpoints.
 * Provides RESTful API for retrieving various leaderboard data including
 * global rankings, journey-specific leaderboards, and personalized user standings.
 */
@ApiTags('leaderboard')
@Controller('leaderboard')
@UseFilters(AllExceptionsFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@ApiBearerAuth()
export class LeaderboardController {
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.log('Initializing LeaderboardController', 'LeaderboardController');
  }

  /**
   * Retrieves the global leaderboard across all journeys
   * @param query Pagination and filtering parameters
   * @returns Paginated list of top users across all journeys
   */
  @Get('global')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get global leaderboard across all journeys' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Global leaderboard retrieved successfully',
    type: () => BaseResponseDto<LeaderboardResponseDto>
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getGlobalLeaderboard(
    @Query() query: LeaderboardQueryDto,
  ): Promise<BaseResponseDto<LeaderboardResponseDto>> {
    const span = this.tracingService.startSpan('leaderboard.getGlobalLeaderboard');
    try {
      this.logger.log(`Retrieving global leaderboard with params: ${JSON.stringify(query)}`, 'LeaderboardController');
      
      const leaderboard = await this.leaderboardService.getGlobalLeaderboard(query);
      
      return {
        status: 'success',
        data: leaderboard,
        metadata: {
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            totalItems: leaderboard.totalItems,
            totalPages: Math.ceil(leaderboard.totalItems / query.pageSize)
          }
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve global leaderboard: ${error.message}`,
        error.stack,
        'LeaderboardController'
      );
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Retrieves a journey-specific leaderboard
   * @param journey The journey type (health, care, plan)
   * @param query Pagination and filtering parameters
   * @returns Paginated list of top users for the specified journey
   */
  @Get('journey/:journey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get journey-specific leaderboard' })
  @ApiParam({ 
    name: 'journey', 
    enum: JourneyType,
    description: 'Journey type (health, care, plan)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Journey leaderboard retrieved successfully',
    type: () => BaseResponseDto<LeaderboardResponseDto>
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid journey type' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getJourneyLeaderboard(
    @Param('journey', new ParseEnumPipe(JourneyType)) journey: JourneyType,
    @Query() query: LeaderboardQueryDto,
  ): Promise<BaseResponseDto<LeaderboardResponseDto>> {
    const span = this.tracingService.startSpan('leaderboard.getJourneyLeaderboard');
    try {
      this.logger.log(
        `Retrieving leaderboard for journey: ${journey} with params: ${JSON.stringify(query)}`,
        'LeaderboardController'
      );
      
      const leaderboard = await this.leaderboardService.getJourneyLeaderboard(journey, query);
      
      return {
        status: 'success',
        data: leaderboard,
        metadata: {
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            totalItems: leaderboard.totalItems,
            totalPages: Math.ceil(leaderboard.totalItems / query.pageSize)
          }
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve leaderboard for journey ${journey}: ${error.message}`,
        error.stack,
        'LeaderboardController'
      );
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Retrieves a time-period specific leaderboard (daily, weekly, monthly, all-time)
   * @param timeframe The time period (daily, weekly, monthly, all-time)
   * @param journey Optional journey type to filter by
   * @param query Pagination and filtering parameters
   * @returns Paginated list of top users for the specified time period
   */
  @Get('timeframe/:timeframe')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get time-period specific leaderboard' })
  @ApiParam({ 
    name: 'timeframe', 
    enum: LeaderboardTimeframeDto,
    description: 'Time period (daily, weekly, monthly, all-time)'
  })
  @ApiQuery({ 
    name: 'journey', 
    enum: JourneyType,
    required: false,
    description: 'Optional journey type to filter by'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Timeframe leaderboard retrieved successfully',
    type: () => BaseResponseDto<LeaderboardResponseDto>
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid timeframe or journey type' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getTimeframeLeaderboard(
    @Param('timeframe', new ParseEnumPipe(LeaderboardTimeframeDto)) timeframe: LeaderboardTimeframeDto,
    @Query('journey') journey?: JourneyType,
    @Query() query?: LeaderboardQueryDto,
  ): Promise<BaseResponseDto<LeaderboardResponseDto>> {
    const span = this.tracingService.startSpan('leaderboard.getTimeframeLeaderboard');
    try {
      this.logger.log(
        `Retrieving leaderboard for timeframe: ${timeframe}${journey ? ` and journey: ${journey}` : ''} with params: ${JSON.stringify(query)}`,
        'LeaderboardController'
      );
      
      const leaderboard = await this.leaderboardService.getTimeframeLeaderboard(timeframe, journey, query);
      
      return {
        status: 'success',
        data: leaderboard,
        metadata: {
          pagination: {
            page: query.page,
            pageSize: query.pageSize,
            totalItems: leaderboard.totalItems,
            totalPages: Math.ceil(leaderboard.totalItems / query.pageSize)
          }
        }
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve leaderboard for timeframe ${timeframe}: ${error.message}`,
        error.stack,
        'LeaderboardController'
      );
      throw error;
    } finally {
      span.finish();
    }
  }

  /**
   * Retrieves the current user's rank and surrounding users on the leaderboard
   * @param req Request object containing the authenticated user
   * @param journey Optional journey type to filter by
   * @returns User's rank and surrounding users on the leaderboard
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user's rank and surrounding users" })
  @ApiQuery({ 
    name: 'journey', 
    enum: JourneyType,
    required: false,
    description: 'Optional journey type to filter by'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: "User's rank retrieved successfully",
    type: () => BaseResponseDto<UserRankResponseDto>
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid journey type' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async getUserRank(
    @Req() req: any,
    @Query('journey') journey?: JourneyType,
  ): Promise<BaseResponseDto<UserRankResponseDto>> {
    const span = this.tracingService.startSpan('leaderboard.getUserRank');
    try {
      const userId = req.user.id;
      this.logger.log(
        `Retrieving rank for user: ${userId}${journey ? ` in journey: ${journey}` : ''}`,
        'LeaderboardController'
      );
      
      const userRank = await this.leaderboardService.getUserRank(userId, journey);
      
      return {
        status: 'success',
        data: userRank
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve user rank: ${error.message}`,
        error.stack,
        'LeaderboardController'
      );
      throw error;
    } finally {
      span.finish();
    }
  }
}