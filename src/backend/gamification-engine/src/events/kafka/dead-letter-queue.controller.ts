import { Controller, Get, Post, Body, Param, Query, UseGuards, UseFilters } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from '@app/shared/exceptions/exceptions.filter';
import { DeadLetterQueueService } from './dead-letter-queue.service';
import { DlqEntryEntity } from './entities/dlq-entry.entity';
import { DlqProcessAction, DlqEntryStatus, ErrorType } from './interfaces';

/**
 * Controller for managing Dead Letter Queue entries
 */
@ApiTags('dead-letter-queue')
@Controller('events/dlq')
@UseGuards(JwtAuthGuard)
@UseFilters(AllExceptionsFilter)
export class DeadLetterQueueController {
  constructor(private readonly dlqService: DeadLetterQueueService) {}

  /**
   * Get all DLQ entries with filtering and pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all DLQ entries with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated DLQ entries' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'journey', required: false, type: String })
  @ApiQuery({ name: 'eventType', required: false, type: String })
  @ApiQuery({ name: 'errorType', required: false, enum: ErrorType })
  @ApiQuery({ name: 'status', required: false, enum: DlqEntryStatus })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiQuery({ name: 'page', required: false, type: Number, default: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, default: 20 })
  async getDlqEntries(
    @Query('userId') userId?: string,
    @Query('journey') journey?: string,
    @Query('eventType') eventType?: string,
    @Query('errorType') errorType?: ErrorType,
    @Query('status') status?: DlqEntryStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (journey) filters.journey = journey;
    if (eventType) filters.eventType = eventType;
    if (errorType) filters.errorType = errorType;
    if (status) filters.status = status;
    
    if (startDate) {
      filters.startDate = new Date(startDate);
    }
    
    if (endDate) {
      filters.endDate = new Date(endDate);
    }
    
    return this.dlqService.getDlqEntries(filters, page, limit);
  }

  /**
   * Get a specific DLQ entry by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific DLQ entry by ID' })
  @ApiResponse({ status: 200, description: 'Returns the DLQ entry' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  @ApiParam({ name: 'id', type: String, description: 'DLQ entry ID' })
  async getDlqEntryById(@Param('id') id: string): Promise<DlqEntryEntity> {
    const entry = await this.dlqService.getDlqEntryById(id);
    
    if (!entry) {
      throw new Error(`DLQ entry with ID ${id} not found`);
    }
    
    return entry;
  }

  /**
   * Process a DLQ entry (reprocess, resolve, or ignore)
   */
  @Post(':id/process')
  @ApiOperation({ summary: 'Process a DLQ entry (reprocess, resolve, or ignore)' })
  @ApiResponse({ status: 200, description: 'Returns the updated DLQ entry' })
  @ApiResponse({ status: 404, description: 'DLQ entry not found' })
  @ApiParam({ name: 'id', type: String, description: 'DLQ entry ID' })
  async processDlqEntry(
    @Param('id') id: string,
    @Body() body: { action: DlqProcessAction; comment?: string },
  ): Promise<DlqEntryEntity> {
    return this.dlqService.processDlqEntry(id, body.action, body.comment);
  }

  /**
   * Get statistics about DLQ entries
   */
  @Get('stats/summary')
  @ApiOperation({ summary: 'Get statistics about DLQ entries' })
  @ApiResponse({ status: 200, description: 'Returns DLQ statistics' })
  async getDlqStatistics() {
    return this.dlqService.getDlqStatistics();
  }
}