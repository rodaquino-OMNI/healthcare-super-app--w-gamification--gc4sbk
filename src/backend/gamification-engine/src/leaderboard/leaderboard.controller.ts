import { Controller, Get, Param, Query, UseFilters, ValidationPipe, UsePipes } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JOURNEY_IDS } from 'src/backend/shared/src/constants/journey.constants';
import { AllExceptionsFilter } from 'src/backend/shared/src/exceptions/exceptions.filter';
import { LoggerService } from 'src/backend/shared/src/logging/logger.service';
import { TracingService } from 'src/backend/shared/src/tracing/tracing.service';
import { 
  GetLeaderboardDto, 
  LeaderboardFilterDto, 
  LeaderboardPaginationDto, 
  LeaderboardResponseDto, 
  LeaderboardTimeframeDto 
} from './leaderboard.dto';

/**
 * Controller for handling leaderboard-related requests.
 */
@Controller('leaderboard')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class LeaderboardController {
  /**
   * Injects the LeaderboardService, LoggerService and TracingService dependencies.
   */
  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly logger: LoggerService,
    private readonly tracingService: TracingService,
  ) {
    this.logger.log('Initializing LeaderboardController', 'LeaderboardController');
  }

  /**
   * Retrieves the leaderboard for a specific journey.
   * @param journey The journey to get leaderboard data for (health, care, plan)
   * @param timeframeDto Optional timeframe parameters
   * @param paginationDto Optional pagination parameters
   * @param filterDto Optional filter parameters
   * @returns A promise that resolves to the leaderboard data.
   */
  @Get(':journey')
  @UseFilters(AllExceptionsFilter)
  async getLeaderboard(
    @Param('journey') journey: string,
    @Query() timeframeDto: LeaderboardTimeframeDto,
    @Query() paginationDto: LeaderboardPaginationDto,
    @Query() filterDto: LeaderboardFilterDto
  ): Promise<LeaderboardResponseDto> {
    this.logger.log(`Request to retrieve leaderboard for journey: ${journey}`, 'LeaderboardController');
    
    const span = this.tracingService.startSpan('leaderboard.get');
    span.setTag('journey', journey);
    
    try {
      // Combine all parameters into a single DTO
      const getLeaderboardDto: GetLeaderboardDto = {
        journey,
        timeframe: timeframeDto,
        pagination: paginationDto,
        filters: filterDto
      };
      
      // Call the leaderboard service to get the data
      const leaderboard = await this.leaderboardService.getLeaderboard(journey);
      
      // Format the response according to the DTO
      const response: LeaderboardResponseDto = {
        journey,
        timeframe: timeframeDto.timeframe,
        total: leaderboard.length,
        page: paginationDto.page,
        limit: paginationDto.limit,
        entries: leaderboard,
        generatedAt: new Date()
      };
      
      return response;
    } finally {
      span.finish();
    }
  }
}