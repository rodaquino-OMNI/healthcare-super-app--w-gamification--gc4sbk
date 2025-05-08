import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '@austa/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@austa/auth/guards/roles.guard';
import { Roles } from '@austa/auth/decorators/roles.decorator';
import { Span } from '@nestjs/opentelemetry';

import { DlqService } from './dlq.service';
import { 
  QueryDlqEntriesDto, 
  DlqEntryResponseDto, 
  ProcessDlqEntryDto, 
  DlqStatisticsResponseDto 
} from './dto';
import { DlqEntry } from './dlq-entry.entity';

/**
 * Controller for managing the Dead Letter Queue (DLQ) for failed notifications.
 * 
 * The DLQ stores notifications that have failed after exhausting all retry attempts,
 * allowing for administrative inspection, troubleshooting, and potential reprocessing.
 * 
 * This controller provides endpoints for:
 * - Retrieving DLQ entries with filtering and pagination
 * - Inspecting individual DLQ entry details
 * - Manually resolving or reprocessing failed notifications
 * - Retrieving DLQ statistics for monitoring
 * 
 * Access to these endpoints is restricted to users with administrative roles.
 */
@ApiTags('dlq')
@Controller('admin/dlq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'support')
@ApiBearerAuth()
export class DlqController {
  constructor(private readonly dlqService: DlqService) {}

  /**
   * Retrieves DLQ entries with filtering and pagination.
   * 
   * @param queryDto - Query parameters for filtering and pagination
   * @returns Paginated list of DLQ entries matching the filter criteria
   */
  @Get()
  @Span('dlq.getDlqEntries')
  @ApiOperation({ summary: 'Get DLQ entries with filtering and pagination' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ entries retrieved successfully',
    type: [DlqEntryResponseDto]
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async getDlqEntries(@Query() queryDto: QueryDlqEntriesDto): Promise<{
    items: DlqEntryResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.dlqService.findDlqEntries(queryDto);
  }

  /**
   * Retrieves a specific DLQ entry by ID.
   * 
   * @param id - The ID of the DLQ entry to retrieve
   * @returns The DLQ entry with the specified ID
   */
  @Get(':id')
  @Span('dlq.getDlqEntryById')
  @ApiOperation({ summary: 'Get a specific DLQ entry by ID' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ entry retrieved successfully',
    type: DlqEntryResponseDto
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DLQ entry not found' })
  async getDlqEntryById(@Param('id') id: string): Promise<DlqEntryResponseDto> {
    return this.dlqService.findDlqEntryById(parseInt(id, 10));
  }

  /**
   * Processes a DLQ entry (resolve, reprocess, or ignore).
   * 
   * @param id - The ID of the DLQ entry to process
   * @param processDto - Processing instructions
   * @returns The updated DLQ entry
   */
  @Patch(':id/process')
  @Span('dlq.processDlqEntry')
  @ApiOperation({ summary: 'Process a DLQ entry (resolve, reprocess, or ignore)' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ entry processed successfully',
    type: DlqEntryResponseDto
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DLQ entry not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid processing action' })
  async processDlqEntry(
    @Param('id') id: string,
    @Body() processDto: ProcessDlqEntryDto
  ): Promise<DlqEntryResponseDto> {
    return this.dlqService.processDlqEntry(parseInt(id, 10), processDto);
  }

  /**
   * Reprocesses multiple DLQ entries in bulk.
   * 
   * @param ids - Array of DLQ entry IDs to reprocess
   * @returns Summary of the bulk reprocessing operation
   */
  @Post('bulk-reprocess')
  @HttpCode(HttpStatus.OK)
  @Span('dlq.bulkReprocessDlqEntries')
  @ApiOperation({ summary: 'Reprocess multiple DLQ entries in bulk' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Bulk reprocessing initiated successfully',
    schema: {
      type: 'object',
      properties: {
        processed: { type: 'number', description: 'Number of entries queued for reprocessing' },
        failed: { type: 'number', description: 'Number of entries that could not be queued' },
        errors: { 
          type: 'array', 
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              error: { type: 'string' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request' })
  async bulkReprocessDlqEntries(
    @Body() body: { ids: number[] }
  ): Promise<{ processed: number; failed: number; errors: { id: number; error: string }[] }> {
    return this.dlqService.bulkReprocessDlqEntries(body.ids);
  }

  /**
   * Retrieves statistics about the DLQ for monitoring purposes.
   * 
   * @param timeframe - Optional timeframe for statistics (e.g., 'day', 'week', 'month')
   * @returns Statistical data about the DLQ
   */
  @Get('statistics')
  @Span('dlq.getDlqStatistics')
  @ApiOperation({ summary: 'Get statistics about the DLQ' })
  @ApiQuery({ 
    name: 'timeframe', 
    required: false, 
    enum: ['day', 'week', 'month', 'all'],
    description: 'Timeframe for statistics'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ statistics retrieved successfully',
    type: DlqStatisticsResponseDto
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  async getDlqStatistics(
    @Query('timeframe') timeframe?: 'day' | 'week' | 'month' | 'all'
  ): Promise<DlqStatisticsResponseDto> {
    return this.dlqService.getDlqStatistics(timeframe || 'all');
  }

  /**
   * Purges resolved DLQ entries older than the specified age.
   * 
   * @param olderThan - Age in days (entries older than this will be purged)
   * @returns Summary of the purge operation
   */
  @Post('purge-resolved')
  @HttpCode(HttpStatus.OK)
  @Span('dlq.purgeResolvedDlqEntries')
  @ApiOperation({ summary: 'Purge resolved DLQ entries older than the specified age' })
  @ApiQuery({ 
    name: 'olderThan', 
    required: true, 
    type: Number,
    description: 'Age in days (entries older than this will be purged)'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Resolved DLQ entries purged successfully',
    schema: {
      type: 'object',
      properties: {
        purgedCount: { type: 'number', description: 'Number of entries purged' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid age parameter' })
  @Roles('admin') // Restrict to admin role only (not support)
  async purgeResolvedDlqEntries(
    @Query('olderThan') olderThan: number
  ): Promise<{ purgedCount: number }> {
    return this.dlqService.purgeResolvedDlqEntries(olderThan);
  }

  /**
   * Retrieves a summary of DLQ entries grouped by error type, channel, or journey.
   * 
   * @param groupBy - Field to group by ('errorType', 'channel', 'journey')
   * @returns Grouped summary of DLQ entries
   */
  @Get('summary')
  @Span('dlq.getDlqSummary')
  @ApiOperation({ summary: 'Get a summary of DLQ entries grouped by a field' })
  @ApiQuery({ 
    name: 'groupBy', 
    required: true, 
    enum: ['errorType', 'channel', 'journey'],
    description: 'Field to group by'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ summary retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        groups: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Group key (error type, channel, or journey)' },
              count: { type: 'number', description: 'Number of entries in this group' },
              percentage: { type: 'number', description: 'Percentage of total entries' }
            }
          }
        },
        total: { type: 'number', description: 'Total number of entries' }
      }
    }
  })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid groupBy parameter' })
  async getDlqSummary(
    @Query('groupBy') groupBy: 'errorType' | 'channel' | 'journey'
  ): Promise<{
    groups: { key: string; count: number; percentage: number }[];
    total: number;
  }> {
    return this.dlqService.getDlqSummary(groupBy);
  }
}