import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { RequiresRole } from '../common/decorators/requires-role.decorator';
import { RulesService } from './rules.service';
import { CreateRuleDto, UpdateRuleDto, RuleFilterDto, RuleResponseDto } from './dto';
import { PaginationRequestDto, PaginationResponseDto } from '../common/dto/pagination.dto';
import { BaseResponseDto } from '../common/dto/base-response.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { TrackPerformance } from '../common/decorators/track-performance.decorator';
import { LogMethod } from '../common/decorators/log-method.decorator';
import { Rule } from './entities/rule.entity';

/**
 * Controller that exposes REST API endpoints for rule administration.
 * Allows creation, retrieval, updating, and deletion of gamification rules.
 */
@ApiTags('Rules')
@ApiBearerAuth()
@Controller('rules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  /**
   * Creates a new gamification rule
   * @param createRuleDto The rule data to create
   * @returns The newly created rule
   */
  @Post()
  @RequiresRole('admin')
  @ApiOperation({ summary: 'Create a new rule' })
  @ApiBody({ type: CreateRuleDto })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'The rule has been successfully created.',
    type: () => BaseResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async create(@Body() createRuleDto: CreateRuleDto): Promise<BaseResponseDto<RuleResponseDto>> {
    const rule = await this.rulesService.create(createRuleDto);
    return {
      status: 'success',
      data: this.mapToResponseDto(rule),
      metadata: {}
    };
  }

  /**
   * Retrieves a paginated list of rules with optional filtering
   * @param paginationDto Pagination parameters
   * @param filterDto Filter criteria
   * @returns Paginated list of rules
   */
  @Get()
  @RequiresRole(['admin', 'moderator'])
  @ApiOperation({ summary: 'Get all rules with pagination and filtering' })
  @ApiQuery({ type: PaginationRequestDto })
  @ApiQuery({ type: RuleFilterDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'List of rules retrieved successfully.',
    type: () => PaginationResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async findAll(
    @Query() paginationDto: PaginationRequestDto,
    @Query() filterDto: RuleFilterDto
  ): Promise<PaginationResponseDto<RuleResponseDto>> {
    const { items, meta } = await this.rulesService.findAll(paginationDto, filterDto);
    
    return {
      items: items.map(rule => this.mapToResponseDto(rule)),
      meta
    };
  }

  /**
   * Retrieves a single rule by ID
   * @param id The rule ID to retrieve
   * @returns The requested rule
   */
  @Get(':id')
  @RequiresRole(['admin', 'moderator'])
  @ApiOperation({ summary: 'Get a rule by ID' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rule retrieved successfully.',
    type: () => BaseResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Rule not found.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async findOne(@Param('id') id: string): Promise<BaseResponseDto<RuleResponseDto>> {
    const rule = await this.rulesService.findOne(id);
    return {
      status: 'success',
      data: this.mapToResponseDto(rule),
      metadata: {}
    };
  }

  /**
   * Updates an existing rule
   * @param id The rule ID to update
   * @param updateRuleDto The updated rule data
   * @returns The updated rule
   */
  @Patch(':id')
  @RequiresRole('admin')
  @ApiOperation({ summary: 'Update a rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiBody({ type: UpdateRuleDto })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rule updated successfully.',
    type: () => BaseResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid input data.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Rule not found.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async update(
    @Param('id') id: string, 
    @Body() updateRuleDto: UpdateRuleDto
  ): Promise<BaseResponseDto<RuleResponseDto>> {
    const rule = await this.rulesService.update(id, updateRuleDto);
    return {
      status: 'success',
      data: this.mapToResponseDto(rule),
      metadata: {}
    };
  }

  /**
   * Deletes a rule
   * @param id The rule ID to delete
   * @returns Success confirmation
   */
  @Delete(':id')
  @RequiresRole('admin')
  @ApiOperation({ summary: 'Delete a rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rule deleted successfully.',
    type: () => BaseResponseDto<null>
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Rule not found.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async remove(@Param('id') id: string): Promise<BaseResponseDto<null>> {
    await this.rulesService.remove(id);
    return {
      status: 'success',
      data: null,
      metadata: {}
    };
  }

  /**
   * Enables a rule
   * @param id The rule ID to enable
   * @returns The updated rule
   */
  @Patch(':id/enable')
  @RequiresRole('admin')
  @ApiOperation({ summary: 'Enable a rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rule enabled successfully.',
    type: () => BaseResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Rule not found.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async enable(@Param('id') id: string): Promise<BaseResponseDto<RuleResponseDto>> {
    const rule = await this.rulesService.enable(id);
    return {
      status: 'success',
      data: this.mapToResponseDto(rule),
      metadata: {}
    };
  }

  /**
   * Disables a rule
   * @param id The rule ID to disable
   * @returns The updated rule
   */
  @Patch(':id/disable')
  @RequiresRole('admin')
  @ApiOperation({ summary: 'Disable a rule' })
  @ApiParam({ name: 'id', description: 'Rule ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Rule disabled successfully.',
    type: () => BaseResponseDto<RuleResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Rule not found.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized.',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.FORBIDDEN, 
    description: 'Forbidden resource.',
    type: ErrorResponseDto 
  })
  @TrackPerformance()
  @LogMethod()
  async disable(@Param('id') id: string): Promise<BaseResponseDto<RuleResponseDto>> {
    const rule = await this.rulesService.disable(id);
    return {
      status: 'success',
      data: this.mapToResponseDto(rule),
      metadata: {}
    };
  }

  /**
   * Maps a Rule entity to a RuleResponseDto
   * @param rule The rule entity to map
   * @returns The mapped RuleResponseDto
   */
  private mapToResponseDto(rule: Rule): RuleResponseDto {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      eventType: rule.eventType,
      journey: rule.journey,
      condition: rule.condition,
      actions: JSON.parse(rule.actions),
      enabled: rule.enabled,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt
    };
  }
}