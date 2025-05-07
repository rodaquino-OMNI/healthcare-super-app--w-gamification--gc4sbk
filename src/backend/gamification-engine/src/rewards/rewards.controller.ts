import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { Reward } from './entities/reward.entity';
import { UserReward } from './entities/user-reward.entity';
import { CreateRewardDto, UpdateRewardDto, FilterRewardDto, GrantRewardDto } from './dto';
import { CurrentUser } from '@app/shared/decorators/current-user.decorator';
import { JourneyType } from '@austa/interfaces/gamification';
import { TransactionManager } from '@app/shared/database/transactions/transaction.decorator';
import { AppException, ErrorType } from '@app/shared/errors/exceptions.types';

/**
 * Controller for managing rewards in the gamification system.
 * Provides endpoints for creating, retrieving, and granting rewards to users.
 */
@ApiTags('rewards')
@Controller('rewards')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RewardsController {
  /**
   * Injects the RewardsService for handling reward-related business logic.
   */
  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * Retrieves all rewards with optional filtering and pagination.
   * 
   * @param filterDto - Optional filter criteria including pagination, sorting, and filtering options
   * @returns A paginated list of rewards matching the filter criteria
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all rewards', description: 'Retrieves all rewards with optional filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starts from 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', type: String })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort direction (asc or desc)', type: String })
  @ApiQuery({ name: 'journeyFilter', required: false, description: 'Filter by journey type', type: String })
  @ApiQuery({ name: 'titleSearch', required: false, description: 'Search rewards by title (case-insensitive)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved rewards' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findAll(@Query() filterDto: FilterRewardDto): Promise<{ rewards: Reward[]; total: number }> {
    return this.rewardsService.findAll(filterDto);
  }

  /**
   * Retrieves a single reward by its ID.
   * 
   * @param id - The UUID of the reward to retrieve
   * @returns The reward with the specified ID
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get reward by ID', description: 'Retrieves a single reward by its ID' })
  @ApiParam({ name: 'id', description: 'Reward ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved reward' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Reward not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<Reward> {
    return this.rewardsService.findOne(id);
  }

  /**
   * Creates a new reward.
   * 
   * @param createRewardDto - The data for creating a new reward
   * @returns The newly created reward
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create reward', description: 'Creates a new reward in the system' })
  @ApiBody({ type: CreateRewardDto, description: 'Reward data' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Successfully created reward' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @TransactionManager()
  async create(@Body() createRewardDto: CreateRewardDto): Promise<Reward> {
    return this.rewardsService.create(createRewardDto);
  }

  /**
   * Updates an existing reward.
   * 
   * @param id - The UUID of the reward to update
   * @param updateRewardDto - The data for updating the reward
   * @returns The updated reward
   */
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update reward', description: 'Updates an existing reward' })
  @ApiParam({ name: 'id', description: 'Reward ID (UUID)', type: String })
  @ApiBody({ type: UpdateRewardDto, description: 'Updated reward data' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully updated reward' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Reward not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @TransactionManager()
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateRewardDto: UpdateRewardDto
  ): Promise<Reward> {
    return this.rewardsService.update(id, updateRewardDto);
  }

  /**
   * Grants a reward to a user.
   * 
   * @param id - The UUID of the reward to grant
   * @param grantRewardDto - The data for granting the reward, including the user ID
   * @returns The granted user reward
   */
  @Post(':id/grant')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Grant reward to user', description: 'Grants a specific reward to a user' })
  @ApiParam({ name: 'id', description: 'Reward ID (UUID)', type: String })
  @ApiBody({ type: GrantRewardDto, description: 'Grant reward data including user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully granted reward' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Reward or user not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @TransactionManager()
  async grantReward(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() grantRewardDto: GrantRewardDto
  ): Promise<UserReward> {
    try {
      return await this.rewardsService.grantReward(grantRewardDto.userId, id);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(
        `Failed to grant reward ${id} to user ${grantRewardDto.userId}`,
        ErrorType.TECHNICAL,
        'REWARD_CONTROLLER_001',
        { rewardId: id, userId: grantRewardDto.userId },
        error
      );
    }
  }

  /**
   * Retrieves all rewards earned by a specific user.
   * 
   * @param userId - The UUID of the user
   * @param filterDto - Optional filter criteria including pagination, sorting, and filtering options
   * @returns A paginated list of user rewards
   */
  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user rewards', description: 'Retrieves all rewards earned by a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID (UUID)', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starts from 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', type: String })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort direction (asc or desc)', type: String })
  @ApiQuery({ name: 'journeyFilter', required: false, description: 'Filter by journey type', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved user rewards' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findUserRewards(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Query() filterDto: FilterRewardDto
  ): Promise<{ userRewards: UserReward[]; total: number }> {
    return this.rewardsService.findUserRewards(userId, filterDto);
  }

  /**
   * Retrieves all rewards for a specific journey.
   * 
   * @param journey - The journey type (health, care, plan, or global)
   * @param filterDto - Optional filter criteria including pagination and sorting options
   * @returns A paginated list of journey-specific rewards
   */
  @Get('journey/:journey')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get journey rewards', description: 'Retrieves all rewards for a specific journey' })
  @ApiParam({ name: 'journey', description: 'Journey type (health, care, plan, or global)', type: String })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starts from 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Field to sort by', type: String })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort direction (asc or desc)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully retrieved journey rewards' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid journey type' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  async findJourneyRewards(
    @Param('journey') journey: string,
    @Query() filterDto: FilterRewardDto
  ): Promise<{ rewards: Reward[]; total: number }> {
    // Validate journey type
    this.validateJourneyType(journey);
    
    // Set journey filter and call findAll
    const journeyFilterDto: FilterRewardDto = {
      ...filterDto,
      journeyFilter: journey
    };
    
    return this.rewardsService.findAll(journeyFilterDto);
  }

  /**
   * Grants all eligible journey-specific rewards to a user.
   * 
   * @param journey - The journey type (health, care, plan, or global)
   * @param userId - The UUID of the user
   * @returns An array of granted user rewards
   */
  @Post('journey/:journey/grant/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Grant journey rewards', description: 'Grants all eligible journey-specific rewards to a user' })
  @ApiParam({ name: 'journey', description: 'Journey type (health, care, plan, or global)', type: String })
  @ApiParam({ name: 'userId', description: 'User ID (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Successfully granted journey rewards' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid journey type or user ID' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error' })
  @TransactionManager()
  async grantJourneyRewards(
    @Param('journey') journey: string,
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string
  ): Promise<UserReward[]> {
    try {
      // Validate journey type
      this.validateJourneyType(journey);
      
      return await this.rewardsService.grantJourneyRewards(userId, journey as JourneyType);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(
        `Failed to grant ${journey} journey rewards to user ${userId}`,
        ErrorType.TECHNICAL,
        'REWARD_CONTROLLER_002',
        { journey, userId },
        error
      );
    }
  }

  /**
   * Validates that the provided journey type is valid.
   * 
   * @param journey - The journey type to validate
   * @throws AppException if the journey type is invalid
   */
  private validateJourneyType(journey: string): void {
    const validJourneys = ['health', 'care', 'plan', 'global'];
    
    if (!validJourneys.includes(journey)) {
      throw new AppException(
        `Invalid journey type: ${journey}. Must be one of: ${validJourneys.join(', ')}`,
        ErrorType.BUSINESS,
        'REWARD_CONTROLLER_003',
        { journey, validJourneys }
      );
    }
  }
}