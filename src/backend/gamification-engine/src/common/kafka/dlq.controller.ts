import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@austa/auth/guards';
import { Roles } from '@austa/auth/decorators';

import { DlqService } from './dlq.service';
import { DlqEntryStatus, DlqFilterOptions, DlqReprocessOptions } from './types/dlq.types';

/**
 * Controller for managing Dead Letter Queue entries
 */
@ApiTags('Dead Letter Queue')
@Controller('admin/dlq')
@UseGuards(JwtAuthGuard)
@Roles(['admin', 'system'])
export class DlqController {
  constructor(private readonly dlqService: DlqService) {}

  /**
   * Get all DLQ entries with filtering options
   */
  @Get()
  @ApiOperation({ summary: 'Get all DLQ entries with filtering options' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'journeyType', required: false, description: 'Filter by journey type (health, care, plan)' })
  @ApiQuery({ name: 'errorType', required: false, description: 'Filter by error type' })
  @ApiQuery({ name: 'status', required: false, enum: DlqEntryStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'originalTopic', required: false, description: 'Filter by original topic' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter by creation date (from)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter by creation date (to)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiResponse({ status: 200, description: 'Returns DLQ entries matching the filter criteria' })
  async getDlqEntries(
    @Query('userId') userId?: string,
    @Query('journeyType') journeyType?: string,
    @Query('errorType') errorType?: string,
    @Query('status') status?: DlqEntryStatus,
    @Query('originalTopic') originalTopic?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const options: DlqFilterOptions = {
      userId,
      journeyType,
      errorType,
      status,
      originalTopic,
      fromDate: fromDate ? new Date(fromDate) : undefined,
      toDate: toDate ? new Date(toDate) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    };

    return this.dlqService.getDlqEntries(options);
  }

  /**
   * Get a specific DLQ entry by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific DLQ entry by ID' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'Returns the DLQ entry' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async getDlqEntryById(@Param('id') id: string) {
    return this.dlqService.getDlqEntryById(id);
  }

  /**
   * Reprocess a failed message
   */
  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess a failed message' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'Message reprocessed successfully' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async reprocessMessage(
    @Param('id') id: string,
    @Body() options?: DlqReprocessOptions,
  ) {
    return this.dlqService.reprocessMessage(id, options);
  }

  /**
   * Manually resolve a DLQ entry
   */
  @Post(':id/resolve')
  @ApiOperation({ summary: 'Manually resolve a DLQ entry' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID' })
  @ApiResponse({ status: 200, description: 'DLQ entry resolved successfully' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  async resolveEntry(
    @Param('id') id: string,
    @Body('resolution') resolution?: string,
  ) {
    return this.dlqService.resolveEntry(id, resolution);
  }

  /**
   * Get DLQ statistics
   */
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  @ApiResponse({ status: 200, description: 'Returns DLQ statistics' })
  async getDlqStatistics() {
    return this.dlqService.getDlqStatistics();
  }

  /**
   * Purge resolved DLQ entries
   */
  @Post('maintenance/purge')
  @ApiOperation({ summary: 'Purge resolved DLQ entries' })
  @ApiQuery({ name: 'retentionDays', required: false, description: 'Number of days to retain resolved entries', type: Number })
  @ApiResponse({ status: 200, description: 'Returns the number of purged entries' })
  async purgeResolvedEntries(@Query('retentionDays') retentionDays?: number) {
    return this.dlqService.purgeResolvedEntries(retentionDays ? Number(retentionDays) : undefined);
  }
}