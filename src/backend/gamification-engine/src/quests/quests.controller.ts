import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards,
  ValidationPipe,
  UsePipes,
  ParseUUIDPipe
} from '@nestjs/common';

// Import from @app/auth package using path aliases
import { JwtAuthGuard } from '@app/auth/guards';
import { CurrentUser } from '@app/auth/decorators';

// Import from @austa/interfaces package for type-safe models
import { 
  Quest, 
  UserQuest, 
  PaginationDto, 
  QuestFilterDto,
  User
} from '@austa/interfaces/gamification';

// Import from @austa/errors package for standardized error handling
import { 
  ResourceNotFoundError,
  BusinessError,
  ErrorContext
} from '@austa/errors';

// Import enhanced logging with correlation IDs
import { LoggerService } from '@austa/logging';

// Import service with retry mechanisms
import { QuestsService } from './quests.service';

/**
 * Controller for managing quests in the gamification engine.
 * Provides endpoints for retrieving, starting, and completing quests.
 */
@Controller('quests')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class QuestsController {
  /**
   * Injects the QuestsService and LoggerService.
   */
  constructor(
    private readonly questsService: QuestsService,
    private readonly logger: LoggerService
  ) {}

  /**
   * Retrieves all quests with optional filtering and pagination.
   * 
   * @param pagination Pagination parameters (page, limit)
   * @param filter Filter criteria (journey, orderBy, where)
   * @returns Array of quests matching the criteria
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: QuestFilterDto,
    @CurrentUser() user: User
  ): Promise<Quest[]> {
    const correlationId = `find-quests-${user.id}-${Date.now()}`;
    
    this.logger.debug('Finding all quests', { 
      userId: user.id, 
      pagination, 
      filter,
      correlationId
    });
    
    try {
      const quests = await this.questsService.findAll(filter, pagination);
      
      this.logger.debug(`Found ${quests.length} quests`, { 
        userId: user.id, 
        count: quests.length,
        correlationId
      });
      
      return quests;
    } catch (error) {
      this.logger.error('Error finding quests', {
        userId: user.id,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  /**
   * Retrieves a single quest by its ID.
   * 
   * @param id The unique identifier of the quest
   * @returns The quest with the specified ID
   * @throws ResourceNotFoundError if the quest is not found
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<Quest> {
    const correlationId = `find-quest-${id}-${user.id}-${Date.now()}`;
    
    this.logger.debug(`Finding quest with ID: ${id}`, { 
      userId: user.id, 
      questId: id,
      correlationId
    });
    
    try {
      const quest = await this.questsService.findOne(id);
      
      this.logger.debug(`Found quest with ID: ${id}`, { 
        userId: user.id, 
        questId: id,
        questTitle: quest.title,
        correlationId
      });
      
      return quest;
    } catch (error) {
      this.logger.error(`Error finding quest with ID: ${id}`, {
        userId: user.id,
        questId: id,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  /**
   * Starts a quest for a user.
   * 
   * @param id The unique identifier of the quest to start
   * @param user The authenticated user
   * @returns The created UserQuest object
   * @throws ResourceNotFoundError if the quest is not found
   * @throws BusinessError if the quest cannot be started
   */
  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  async startQuest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<UserQuest> {
    const correlationId = `start-quest-${id}-${user.id}-${Date.now()}`;
    
    this.logger.debug(`Starting quest ${id} for user ${user.id}`, { 
      userId: user.id, 
      questId: id,
      correlationId
    });
    
    try {
      const userQuest = await this.questsService.startQuest(user.id, id);
      
      this.logger.info(`Started quest ${id} for user ${user.id}`, { 
        userId: user.id, 
        questId: id,
        userQuestId: userQuest.id,
        correlationId
      });
      
      return userQuest;
    } catch (error) {
      this.logger.error(`Error starting quest ${id} for user ${user.id}`, {
        userId: user.id,
        questId: id,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  /**
   * Completes a quest for a user.
   * 
   * @param id The unique identifier of the quest to complete
   * @param user The authenticated user
   * @returns The updated UserQuest object
   * @throws ResourceNotFoundError if the quest is not found
   * @throws BusinessError if the quest cannot be completed
   */
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  async completeQuest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<UserQuest> {
    const correlationId = `complete-quest-${id}-${user.id}-${Date.now()}`;
    
    this.logger.debug(`Completing quest ${id} for user ${user.id}`, { 
      userId: user.id, 
      questId: id,
      correlationId
    });
    
    try {
      const userQuest = await this.questsService.completeQuest(user.id, id);
      
      this.logger.info(`Completed quest ${id} for user ${user.id}`, { 
        userId: user.id, 
        questId: id,
        userQuestId: userQuest.id,
        xpAwarded: userQuest.quest.xpReward,
        correlationId
      });
      
      return userQuest;
    } catch (error) {
      this.logger.error(`Error completing quest ${id} for user ${user.id}`, {
        userId: user.id,
        questId: id,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  /**
   * Updates the progress of a user's quest.
   * 
   * @param id The unique identifier of the quest to update
   * @param progress The new progress value (0-100)
   * @param user The authenticated user
   * @returns The updated UserQuest object
   * @throws ResourceNotFoundError if the quest is not found
   * @throws BusinessError if the progress value is invalid or the quest cannot be updated
   */
  @Post(':id/progress')
  @UseGuards(JwtAuthGuard)
  async updateQuestProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('progress') progress: number,
    @CurrentUser() user: User
  ): Promise<UserQuest> {
    const correlationId = `update-quest-progress-${id}-${user.id}-${Date.now()}`;
    
    this.logger.debug(`Updating quest ${id} progress to ${progress}% for user ${user.id}`, { 
      userId: user.id, 
      questId: id,
      progress,
      correlationId
    });
    
    try {
      const userQuest = await this.questsService.updateQuestProgress(user.id, id, progress);
      
      this.logger.info(`Updated quest ${id} progress to ${progress}% for user ${user.id}`, { 
        userId: user.id, 
        questId: id,
        userQuestId: userQuest.id,
        progress,
        correlationId
      });
      
      return userQuest;
    } catch (error) {
      this.logger.error(`Error updating quest ${id} progress for user ${user.id}`, {
        userId: user.id,
        questId: id,
        progress,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }

  /**
   * Retrieves all quests for a specific user with their progress.
   * 
   * @param user The authenticated user
   * @param pagination Pagination parameters (page, limit)
   * @param filter Filter criteria (completed, journey)
   * @returns Array of UserQuest objects for the user
   */
  @Get('user/quests')
  @UseGuards(JwtAuthGuard)
  async findUserQuests(
    @CurrentUser() user: User,
    @Query() pagination: PaginationDto,
    @Query() filter: { completed?: boolean; journey?: string }
  ): Promise<UserQuest[]> {
    const correlationId = `find-user-quests-${user.id}-${Date.now()}`;
    
    this.logger.debug(`Finding quests for user ${user.id}`, { 
      userId: user.id, 
      pagination,
      filter,
      correlationId
    });
    
    try {
      const userQuests = await this.questsService.findUserQuests(user.id, filter, pagination);
      
      this.logger.debug(`Found ${userQuests.length} quests for user ${user.id}`, { 
        userId: user.id, 
        count: userQuests.length,
        filter,
        correlationId
      });
      
      return userQuests;
    } catch (error) {
      this.logger.error(`Error finding quests for user ${user.id}`, {
        userId: user.id,
        filter,
        error: error.message,
        stack: error.stack,
        correlationId
      });
      
      // Re-throw the error to be handled by the global exception filter
      throw error;
    }
  }
}