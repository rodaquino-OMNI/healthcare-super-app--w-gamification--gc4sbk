import { Controller, Get, Post, Body, Param, Query, UseGuards, Logger, HttpStatus, HttpCode, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { DlqService } from './dlq.service';
import { QueryDlqEntriesDto, DlqEntryResponseDto, ProcessDlqEntryDto, DlqStatisticsResponseDto } from './dto';
import { JwtAuthGuard } from '@austa/auth';
import { Roles } from '@austa/auth';
import { RoleType } from '@austa/interfaces/auth';

/**
 * Dead Letter Queue Controller
 * 
 * Provides REST API endpoints for managing and monitoring the dead-letter queue
 * for failed notifications that have exhausted their retry attempts.
 * 
 * This controller enables administrative interfaces to:
 * - Query and filter DLQ entries
 * - Inspect individual DLQ entries
 * - Manually resolve or reprocess failed notifications
 * - Monitor DLQ health through statistics
 */
@ApiTags('Dead Letter Queue')
@ApiBearerAuth()
@Controller('dlq')
@UseGuards(JwtAuthGuard)
export class DlqController {
  private readonly logger = new Logger(DlqController.name);

  constructor(private readonly dlqService: DlqService) {}

  /**
   * Retrieves a paginated list of DLQ entries with optional filtering
   * 
   * This endpoint supports comprehensive filtering options including:
   * - User ID
   * - Notification ID
   * - Error type (client, system, transient, external)
   * - Notification channel
   * - Time range filters
   * - Resolution status
   * 
   * Results are paginated for efficient data transfer and rendering
   */
  @Get()
  @Roles(RoleType.ADMIN, RoleType.SUPPORT)
  @ApiOperation({ summary: 'Get paginated list of DLQ entries with filtering' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns paginated DLQ entries with total count',
    type: DlqEntryResponseDto,
    isArray: true
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (zero-based)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID', type: String })
  @ApiQuery({ name: 'notificationId', required: false, description: 'Filter by notification ID', type: String })
  @ApiQuery({ name: 'errorType', required: false, description: 'Filter by error type (client, system, transient, external)', type: String })
  @ApiQuery({ name: 'channel', required: false, description: 'Filter by notification channel', type: String })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by resolution status', type: String })
  @ApiQuery({ name: 'createdAfter', required: false, description: 'Filter by creation date (ISO format)', type: String })
  @ApiQuery({ name: 'createdBefore', required: false, description: 'Filter by creation date (ISO format)', type: String })
  async findAll(@Query() queryDto: QueryDlqEntriesDto): Promise<{ items: DlqEntryResponseDto[], total: number }> {
    this.logger.log(`Retrieving DLQ entries with filters: ${JSON.stringify(queryDto)}`);
    try {
      const { items, total } = await this.dlqService.findAll(queryDto);
      return { items, total };
    } catch (error) {
      this.logger.error(`Failed to retrieve DLQ entries: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve DLQ entries');
    }
  }

  /**
   * Retrieves statistical information about the DLQ
   * 
   * This endpoint provides aggregated metrics including:
   * - Total number of entries
   * - Distribution by error type
   * - Distribution by notification channel
   * - Distribution by resolution status
   * - Time-based metrics (entries by time period, average time in queue)
   * 
   * These statistics are essential for monitoring DLQ health and identifying patterns
   */
  @Get('statistics')
  @Roles(RoleType.ADMIN, RoleType.SUPPORT)
  @ApiOperation({ summary: 'Get statistical information about the DLQ' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns DLQ statistics',
    type: DlqStatisticsResponseDto
  })
  async getStatistics(): Promise<DlqStatisticsResponseDto> {
    this.logger.log('Retrieving DLQ statistics');
    try {
      return await this.dlqService.getStatistics();
    } catch (error) {
      this.logger.error(`Failed to retrieve DLQ statistics: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve DLQ statistics');
    }
  }

  /**
   * Retrieves detailed information about a specific DLQ entry
   * 
   * This endpoint provides comprehensive information about a failed notification including:
   * - Original notification details
   * - Complete error information
   * - Retry history with timestamps and error messages
   * - Resolution status and notes (if any)
   */
  @Get(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPPORT)
  @ApiOperation({ summary: 'Get detailed information about a specific DLQ entry' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Returns detailed DLQ entry information',
    type: DlqEntryResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DLQ entry not found' })
  async findOne(@Param('id') id: string): Promise<DlqEntryResponseDto> {
    this.logger.log(`Retrieving DLQ entry with ID: ${id}`);
    try {
      const entry = await this.dlqService.findOne(id);
      if (!entry) {
        throw new NotFoundException(`DLQ entry with ID ${id} not found`);
      }
      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve DLQ entry ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to retrieve DLQ entry ${id}`);
    }
  }

  /**
   * Processes a DLQ entry with the specified action
   * 
   * Supported actions:
   * - resolve: Mark the entry as resolved without reprocessing
   * - reprocess: Attempt to reprocess the notification with original or modified parameters
   * - ignore: Mark the entry as ignored (will not be included in statistics or alerts)
   * 
   * This endpoint enables manual intervention for failed notifications
   */
  @Post(':id/process')
  @Roles(RoleType.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a DLQ entry (resolve, reprocess, or ignore)' })
  @ApiParam({ name: 'id', description: 'DLQ entry ID', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'DLQ entry processed successfully',
    type: DlqEntryResponseDto
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DLQ entry not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid action or parameters' })
  async process(
    @Param('id') id: string, 
    @Body() processDto: ProcessDlqEntryDto
  ): Promise<DlqEntryResponseDto> {
    this.logger.log(`Processing DLQ entry ${id} with action: ${processDto.action}`);
    try {
      // First check if the entry exists
      const entry = await this.dlqService.findOne(id);
      if (!entry) {
        throw new NotFoundException(`DLQ entry with ID ${id} not found`);
      }

      // Process the entry based on the action
      const result = await this.dlqService.processDlqEntry(id, processDto);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to process DLQ entry ${id}: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to process DLQ entry ${id}`);
    }
  }
}