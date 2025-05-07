import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiExtraModels } from '@nestjs/swagger';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { AllExceptionsFilter } from '@app/errors/filters/all-exceptions.filter';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { RulesService } from './rules.service';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';
import { RuleFilterDto } from './dto/rule-filter.dto';
import { RuleResponseDto } from './dto/rule-response.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';

/**
 * Controller for managing gamification rules.
 * Provides endpoints for creating, retrieving, updating, and deleting rules.
 */
@ApiTags('rules')
@Controller('rules')
@UseFilters(AllExceptionsFilter)
@ApiBearerAuth()
@ApiExtraModels(RuleResponseDto, CreateRuleDto, UpdateRuleDto, RuleFilterDto)
export class RulesController {
  private readonly logger = new Logger(RulesController.name);

  /**
   * Injects the RulesService.
   * 
   * @param rulesService - Service that provides rule-related functionality
   */
  constructor(private readonly rulesService: RulesService) {}

  /**
   * Retrieves all rules with pagination and filtering support.
   * 
   * @param pagination - Pagination parameters (page, limit)
   * @param filter - Filtering criteria (eventType, journey, enabled)
   * @returns A paginated list of rules matching the filter criteria
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all rules', description: 'Retrieves all rules with pagination and filtering support' })
  @ApiQuery({ type: PaginationDto, required: false })
  @ApiQuery({ type: RuleFilterDto, required: false })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully', type: [RuleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: RuleFilterDto
  ): Promise<{ data: RuleResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log('Finding all rules with filters: ' + JSON.stringify(filter));
    return this.rulesService.findAll(pagination, filter);
  }

  /**
   * Retrieves statistics about rules in the system.
   * 
   * @returns Statistics about rules grouped by journey, event type, and status
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Get rule statistics', description: 'Retrieves statistics about rules in the system' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getStatistics(): Promise<{
    total: number;
    byJourney: Record<string, number>;
    byEventType: Record<string, number>;
    byStatus: { enabled: number; disabled: number };
  }> {
    this.logger.log('Retrieving rule statistics');
    return this.rulesService.getStatistics();
  }

  /**
   * Retrieves a single rule by its ID.
   * 
   * @param id - The unique identifier of the rule
   * @returns The rule with the specified ID
   */
  @Get('journey/:journey')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get rules by journey', description: 'Retrieves all rules for a specific journey' })
  @ApiParam({ name: 'journey', description: 'Journey identifier (health, care, plan, or all)', type: String })
  @ApiQuery({ type: PaginationDto, required: false })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully', type: [RuleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByJourney(
    @Param('journey') journey: string,
    @Query() pagination: PaginationDto
  ): Promise<{ data: RuleResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding rules for journey: ${journey}`);
    return this.rulesService.findAll(pagination, { journey });
  }

  @Get('event/:eventType')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get rules by event type', description: 'Retrieves all rules for a specific event type' })
  @ApiParam({ name: 'eventType', description: 'Event type identifier', type: String })
  @ApiQuery({ type: PaginationDto, required: false })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully', type: [RuleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findByEventType(
    @Param('eventType') eventType: string,
    @Query() pagination: PaginationDto
  ): Promise<{ data: RuleResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding rules for event type: ${eventType}`);
    return this.rulesService.findAll(pagination, { event: eventType });
  }

  /**
   * Retrieves rules applicable to the current user.
   * 
   * @param user - Current authenticated user from JWT token
   * @param pagination - Pagination parameters
   * @returns Rules applicable to the user
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my rules', description: 'Retrieves rules applicable to the current user' })
  @ApiQuery({ type: PaginationDto, required: false })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully', type: [RuleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findMyRules(
    @CurrentUser() user: any,
    @Query() pagination: PaginationDto
  ): Promise<{ data: RuleResponseDto[]; total: number; page: number; limit: number }> {
    this.logger.log(`Finding rules for user: ${user.id}`);
    return this.rulesService.findUserRules(user.id, pagination);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get rule by ID', description: 'Retrieves a single rule by its ID' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiResponse({ status: 200, description: 'Rule retrieved successfully', type: RuleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findOne(@Param('id') id: string): Promise<RuleResponseDto> {
    this.logger.log(`Finding rule with ID: ${id}`);
    return this.rulesService.findOne(id);
  }

  /**
   * Creates a new rule.
   * 
   * @param createRuleDto - Data for creating a new rule
   * @returns The newly created rule
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Create rule', description: 'Creates a new gamification rule' })
  @ApiBody({ type: CreateRuleDto })
  @ApiResponse({ status: 201, description: 'Rule created successfully', type: RuleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createRuleDto: CreateRuleDto
  ): Promise<RuleResponseDto> {
    this.logger.log(`Creating new rule: ${createRuleDto.name} for event type: ${createRuleDto.event} in journey: ${createRuleDto.journey}`);
    return this.rulesService.create(createRuleDto);
  }

  /**
   * Updates an existing rule.
   * 
   * @param id - The unique identifier of the rule to update
   * @param updateRuleDto - Data for updating the rule
   * @returns The updated rule
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Update rule', description: 'Updates an existing gamification rule' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiBody({ type: UpdateRuleDto })
  @ApiResponse({ status: 200, description: 'Rule updated successfully', type: RuleResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateRuleDto: UpdateRuleDto
  ): Promise<RuleResponseDto> {
    this.logger.log(`Updating rule with ID: ${id}`);
    return this.rulesService.update(id, updateRuleDto);
  }

  /**
   * Deletes a rule.
   * 
   * @param id - The unique identifier of the rule to delete
   * @returns A success message
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Delete rule', description: 'Deletes a gamification rule' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    this.logger.log(`Deleting rule with ID: ${id}`);
    await this.rulesService.remove(id);
    this.logger.log(`Rule with ID: ${id} deleted successfully`);
    return { message: `Rule with ID ${id} deleted successfully` };
  }

  /**
   * Enables a rule.
   * 
   * @param id - The unique identifier of the rule to enable
   * @returns The updated rule
   */
  @Patch(':id/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Enable rule', description: 'Enables a gamification rule' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiResponse({ status: 200, description: 'Rule enabled successfully', type: RuleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async enable(@Param('id') id: string): Promise<RuleResponseDto> {
    this.logger.log(`Enabling rule with ID: ${id}`);
    return this.rulesService.update(id, { enabled: true });
  }

  /**
   * Disables a rule.
   * 
   * @param id - The unique identifier of the rule to disable
   * @returns The updated rule
   */
  @Patch(':id/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Disable rule', description: 'Disables a gamification rule' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiResponse({ status: 200, description: 'Rule disabled successfully', type: RuleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async disable(@Param('id') id: string): Promise<RuleResponseDto> {
    this.logger.log(`Disabling rule with ID: ${id}`);
    return this.rulesService.update(id, { enabled: false });
  }

  /**
   * Tests a rule against sample event data.
   * 
   * @param id - The unique identifier of the rule to test
   * @param eventData - Sample event data to test the rule against
   * @returns The evaluation result
   */
  @Post(':id/clone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Clone rule', description: 'Creates a copy of an existing rule' })
  @ApiParam({ name: 'id', description: 'Rule ID to clone', type: String })
  @ApiBody({ description: 'Optional overrides for the cloned rule', type: UpdateRuleDto, required: false })
  @ApiResponse({ status: 201, description: 'Rule cloned successfully', type: RuleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  async cloneRule(
    @Param('id') id: string,
    @Body() overrides?: UpdateRuleDto
  ): Promise<RuleResponseDto> {
    this.logger.log(`Cloning rule with ID: ${id}`);
    return this.rulesService.cloneRule(id, overrides);
  }

  /**
   * Exports rules based on filter criteria.
   * 
   * @param filter - Filtering criteria for rules to export
   * @returns Array of rules in exportable format
   */
  @Post('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Export rules', description: 'Exports rules based on filter criteria' })
  @ApiBody({ type: RuleFilterDto, required: false })
  @ApiResponse({ status: 200, description: 'Rules exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async exportRules(
    @Body() filter?: RuleFilterDto
  ): Promise<{ rules: any[]; count: number; exportedAt: string }> {
    this.logger.log(`Exporting rules with filter: ${JSON.stringify(filter)}`);
    const rules = await this.rulesService.exportRules(filter);
    return {
      rules,
      count: rules.length,
      exportedAt: new Date().toISOString()
    };
  }

  /**
   * Imports rules from an exported format.
   * 
   * @param data - Rules data to import
   * @returns Result of the import operation
   */
  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Import rules', description: 'Imports rules from an exported format' })
  @ApiBody({ description: 'Rules to import' })
  @ApiResponse({ status: 201, description: 'Rules imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @HttpCode(HttpStatus.CREATED)
  async importRules(
    @Body() data: { rules: any[] }
  ): Promise<{ created: number; updated: number; failed: number; message: string }> {
    this.logger.log(`Importing ${data.rules.length} rules`);
    return this.rulesService.importRules(data.rules);
  }

  @Post(':id/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Test rule', description: 'Tests a rule against sample event data' })
  @ApiParam({ name: 'id', description: 'Rule ID', type: String })
  @ApiBody({ description: 'Sample event data' })
  @ApiResponse({ status: 200, description: 'Rule tested successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async testRule(
    @Param('id') id: string,
    @Body() eventData: any
  ): Promise<{ result: boolean; actions: any[] }> {
    this.logger.log(`Testing rule with ID: ${id} against event data`);
    return this.rulesService.testRule(id, eventData);
  }

  /**
   * Validates a rule condition expression.
   * 
   * @param condition - The condition expression to validate
   * @returns Validation result
   */
  @Post('validate-condition')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Validate rule condition', description: 'Validates a rule condition expression' })
  @ApiBody({ description: 'Condition to validate', schema: { type: 'object', properties: { condition: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Condition validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid condition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async validateCondition(
    @Body('condition') condition: string
  ): Promise<{ valid: boolean; message?: string }> {
    this.logger.log(`Validating rule condition: ${condition}`);
    return this.rulesService.validateCondition(condition);
  }

  /**
   * Bulk enable rules by IDs.
   * 
   * @param ids - Array of rule IDs to enable
   * @returns Operation result with count of updated rules
   */
  @Patch('bulk/enable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Bulk enable rules', description: 'Enables multiple rules by their IDs' })
  @ApiBody({ description: 'Array of rule IDs', type: [String] })
  @ApiResponse({ status: 200, description: 'Rules enabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async bulkEnable(@Body() ids: string[]): Promise<{ count: number; message: string }> {
    this.logger.log(`Bulk enabling ${ids.length} rules`);
    const count = await this.rulesService.bulkUpdate(ids, { enabled: true });
    return { count, message: `${count} rules enabled successfully` };
  }

  /**
   * Bulk disable rules by IDs.
   * 
   * @param ids - Array of rule IDs to disable
   * @returns Operation result with count of updated rules
   */
  @Patch('bulk/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Bulk disable rules', description: 'Disables multiple rules by their IDs' })
  @ApiBody({ description: 'Array of rule IDs', type: [String] })
  @ApiResponse({ status: 200, description: 'Rules disabled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async bulkDisable(@Body() ids: string[]): Promise<{ count: number; message: string }> {
    this.logger.log(`Bulk disabling ${ids.length} rules`);
    const count = await this.rulesService.bulkUpdate(ids, { enabled: false });
    return { count, message: `${count} rules disabled successfully` };
  }
}