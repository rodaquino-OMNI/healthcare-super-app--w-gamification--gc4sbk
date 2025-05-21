import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { FilterRewardDto } from './dto/filter-reward.dto';
import { GrantRewardDto } from './dto/grant-reward.dto';
import { CurrentUser } from '@austa/auth';
import { User } from '@austa/interfaces/auth';
import { Reward, UserReward } from '@austa/interfaces/gamification';
import { PaginationDto } from '@austa/interfaces/common/dto';
import { RewardNotFoundException, RewardCreationException, RewardGrantException } from './exceptions/rewards.exceptions';

/**
 * Controller for managing rewards in the gamification system.
 * Provides endpoints for creating, retrieving, and granting rewards to users.
 */
@Controller('rewards')
@UseGuards(AuthGuard('jwt'))
export class RewardsController {
  private readonly logger = new Logger(RewardsController.name);

  /**
   * Injects the RewardsService.
   */
  constructor(private readonly rewardsService: RewardsService) {}

  /**
   * Creates a new reward.
   * @param createRewardDto The reward data to create
   * @returns The created reward
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createRewardDto: CreateRewardDto): Promise<Reward> {
    try {
      this.logger.log(`Creating new reward: ${createRewardDto.title}`);
      return await this.rewardsService.create(createRewardDto);
    } catch (error) {
      this.logger.error(
        `Failed to create reward: ${error.message}`,
        error.stack
      );
      
      if (error instanceof RewardCreationException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        'An error occurred while creating the reward'
      );
    }
  }

  /**
   * Retrieves all rewards with optional filtering and pagination.
   * @param paginationDto Pagination parameters
   * @param filterDto Filter parameters
   * @returns Array of rewards
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Query() filterDto: FilterRewardDto
  ): Promise<Reward[]> {
    try {
      this.logger.log('Finding all rewards');
      const rewards = await this.rewardsService.findAll({
        ...filterDto,
        page: paginationDto.page,
        limit: paginationDto.limit
      });
      
      this.logger.log(`Found ${rewards.length} rewards`);
      return rewards;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve rewards: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'An error occurred while retrieving rewards'
      );
    }
  }

  /**
   * Retrieves a single reward by its ID.
   * @param id The reward ID to find
   * @returns The found reward
   */
  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string): Promise<Reward> {
    try {
      this.logger.log(`Finding reward with ID: ${id}`);
      const reward = await this.rewardsService.findOne(id);
      
      this.logger.log(`Found reward with ID: ${id}`);
      return reward;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve reward with ID ${id}: ${error.message}`,
        error.stack
      );
      
      if (error instanceof RewardNotFoundException) {
        throw new NotFoundException(error.message);
      }
      
      throw new InternalServerErrorException(
        'An error occurred while retrieving the reward'
      );
    }
  }

  /**
   * Grants a reward to a user.
   * @param id The reward ID to grant
   * @param user The authenticated user
   * @returns The granted user reward
   */
  @Post(':id/grant')
  @HttpCode(HttpStatus.OK)
  async grantReward(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: User
  ): Promise<UserReward> {
    try {
      this.logger.log(`Granting reward ${id} to user ${user.id}`);
      const userReward = await this.rewardsService.grantReward(user.id, id);
      
      this.logger.log(`Granted reward ${id} to user ${user.id}`);
      return userReward;
    } catch (error) {
      this.logger.error(
        `Failed to grant reward ${id} to user ${user.id}: ${error.message}`,
        error.stack
      );
      
      if (error instanceof RewardNotFoundException) {
        throw new NotFoundException(error.message);
      }
      
      if (error instanceof RewardGrantException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        'An error occurred while granting the reward'
      );
    }
  }

  /**
   * Grants a reward to a specific user (admin only).
   * @param grantRewardDto The grant reward data
   * @returns The granted user reward
   */
  @Post('admin/grant')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('jwt-admin'))
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async adminGrantReward(
    @Body() grantRewardDto: GrantRewardDto
  ): Promise<UserReward> {
    try {
      this.logger.log(
        `Admin granting reward ${grantRewardDto.rewardId} to user ${grantRewardDto.userId}`
      );
      
      const userReward = await this.rewardsService.grantReward(
        grantRewardDto.userId,
        grantRewardDto.rewardId
      );
      
      this.logger.log(
        `Admin granted reward ${grantRewardDto.rewardId} to user ${grantRewardDto.userId}`
      );
      
      return userReward;
    } catch (error) {
      this.logger.error(
        `Failed to grant reward ${grantRewardDto.rewardId} to user ${grantRewardDto.userId}: ${error.message}`,
        error.stack
      );
      
      if (error instanceof RewardNotFoundException) {
        throw new NotFoundException(error.message);
      }
      
      if (error instanceof RewardGrantException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        'An error occurred while granting the reward'
      );
    }
  }

  /**
   * Retrieves all rewards for a specific user.
   * @param user The authenticated user
   * @param filterDto Filter parameters
   * @returns Array of user rewards
   */
  @Get('user/rewards')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findUserRewards(
    @CurrentUser() user: User,
    @Query() filterDto: FilterRewardDto
  ): Promise<UserReward[]> {
    try {
      this.logger.log(`Finding rewards for user ${user.id}`);
      const userRewards = await this.rewardsService.findUserRewards(user.id, filterDto);
      
      this.logger.log(`Found ${userRewards.length} rewards for user ${user.id}`);
      return userRewards;
    } catch (error) {
      this.logger.error(
        `Failed to retrieve rewards for user ${user.id}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'An error occurred while retrieving user rewards'
      );
    }
  }

  /**
   * Retrieves all rewards for a specific journey.
   * @param journey The journey to filter by
   * @param paginationDto Pagination parameters
   * @returns Array of rewards
   */
  @Get('journey/:journey')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findJourneyRewards(
    @Param('journey') journey: string,
    @Query() paginationDto: PaginationDto
  ): Promise<Reward[]> {
    try {
      if (!['health', 'care', 'plan', 'global'].includes(journey)) {
        throw new BadRequestException(
          'Journey must be one of: health, care, plan, global'
        );
      }
      
      this.logger.log(`Finding rewards for journey ${journey}`);
      const rewards = await this.rewardsService.findAll({
        journey,
        page: paginationDto.page,
        limit: paginationDto.limit
      });
      
      this.logger.log(`Found ${rewards.length} rewards for journey ${journey}`);
      return rewards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to retrieve rewards for journey ${journey}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'An error occurred while retrieving journey rewards'
      );
    }
  }

  /**
   * Retrieves all rewards for a specific user in a specific journey.
   * @param journey The journey to filter by
   * @param user The authenticated user
   * @param paginationDto Pagination parameters
   * @returns Array of user rewards
   */
  @Get('user/journey/:journey')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async findUserJourneyRewards(
    @Param('journey') journey: string,
    @CurrentUser() user: User,
    @Query() paginationDto: PaginationDto
  ): Promise<UserReward[]> {
    try {
      if (!['health', 'care', 'plan', 'global'].includes(journey)) {
        throw new BadRequestException(
          'Journey must be one of: health, care, plan, global'
        );
      }
      
      this.logger.log(`Finding ${journey} journey rewards for user ${user.id}`);
      const userRewards = await this.rewardsService.findUserRewards(user.id, {
        journey,
        page: paginationDto.page,
        limit: paginationDto.limit
      });
      
      this.logger.log(
        `Found ${userRewards.length} ${journey} journey rewards for user ${user.id}`
      );
      
      return userRewards;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      this.logger.error(
        `Failed to retrieve ${journey} journey rewards for user ${user.id}: ${error.message}`,
        error.stack
      );
      throw new InternalServerErrorException(
        'An error occurred while retrieving user journey rewards'
      );
    }
  }
}