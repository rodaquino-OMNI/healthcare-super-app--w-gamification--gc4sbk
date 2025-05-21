import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { JourneyType } from '@austa/interfaces';
import { ErrorType } from '@app/shared/errors/error-type.enum';

/**
 * Controller for managing dead-letter queue entries.
 * Provides endpoints for retrieving, reprocessing, and resolving failed events.
 */
@ApiTags('Dead Letter Queue')
@Controller('events/dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'support')
export class DeadLetterQueueController {
  constructor(private readonly dlqService: DeadLetterQueueService) {}

  /**
   * Retrieves DLQ entries with filtering options
   */
  @Get()
  @ApiOperation({ summary: 'Get DLQ entries with filtering' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'journeyType', required: false, enum: JourneyType })
  @ApiQuery({ name: 'errorType', required: false, enum: ErrorType })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 20 })
  @ApiResponse({ status: 200, description: 'Returns DLQ entries matching the filters' })
  async getDlqEntries(
    @Query('userId') userId?: string,
    @Query('eventType') eventType?: string,
    @Query('journeyType') journeyType?: JourneyType,
    @Query('errorType') errorType?: ErrorType,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.dlqService.getDlqEntries(
      {
        userId,
        eventType,
        journeyType,
        errorType,
        startDate,
        endDate,
      },
      page,
      limit,
    );
  }

  /**
   * Retrieves a single DLQ entry by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a DLQ entry by ID' })
  @ApiParam({ name: 'id', type: String, description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'Returns the DLQ entry' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async getDlqEntryById(@Param('id') id: string) {
    return this.dlqService.getDlqEntryById(id);
  }

  /**
   * Reprocesses a failed event from the DLQ
   */
  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess a DLQ entry' })
  @ApiParam({ name: 'id', type: String, description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'DLQ entry reprocessed successfully' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async reprocessDlqEntry(
    @Param('id') id: string,
    @Body() options?: { modifyEvent?: Record<string, any> },
  ) {
    const modifyEventFn = options?.modifyEvent
      ? (event: any) => ({ ...event, ...options.modifyEvent })
      : undefined;

    const success = await this.dlqService.reprocessDlqEntry(id, {
      modifyEvent: modifyEventFn,
    });

    return { success };
  }

  /**
   * Marks a DLQ entry as resolved without reprocessing
   */
  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve a DLQ entry without reprocessing' })
  @ApiParam({ name: 'id', type: String, description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'DLQ entry resolved successfully' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async resolveDlqEntry(
    @Param('id') id: string,
    @Body() body: { resolutionNotes?: string },
  ) {
    const success = await this.dlqService.resolveDlqEntry(
      id,
      body.resolutionNotes,
    );

    return { success };
  }

  /**
   * Gets DLQ statistics for monitoring and alerting
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'Returns DLQ statistics' })
  async getDlqStatistics() {
    return this.dlqService.getDlqStatistics();
  }

  /**
   * Purges resolved DLQ entries older than the specified retention period
   */
  @Delete('purge')
  @ApiOperation({ summary: 'Purge resolved DLQ entries' })
  @ApiQuery({
    name: 'retentionDays',
    required: false,
    type: Number,
    default: 30,
  })
  @ApiResponse({ status: 200, description: 'Returns the number of purged entries' })
  async purgeResolvedEntries(@Query('retentionDays') retentionDays = 30) {
    const purgedCount = await this.dlqService.purgeResolvedEntries(retentionDays);

    return { purgedCount };
  }
}