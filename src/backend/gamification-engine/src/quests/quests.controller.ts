import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Query, 
  UseGuards, 
  NotFoundException,
  Logger,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { AuthGuard } from '@app/auth';
import { CurrentUser } from '@app/auth/decorators';
import { QuestsService } from './quests.service';
import { AppException, ErrorType } from '@app/errors';
import { 
  Quest, 
  UserQuest, 
  QuestFilterInterface 
} from '@austa/interfaces/gamification';
import { 
  StartQuestDto, 
  CompleteQuestDto, 
  QuestResponseDto, 
  UserQuestResponseDto 
} from './dto';
import { PaginationDto } from '@app/shared/dto';

/**
 * Controller for managing quests in the gamification engine.
 * Provides endpoints for retrieving quests, starting quests, and completing quests.
 */
@Controller('quests')
export class QuestsController {
  private logger = new Logger(QuestsController.name);

  /**
   * Injects the QuestsService for quest management operations.
   * @param questsService - Service for managing quests
   */
  constructor(
    private readonly questsService: QuestsService
  ) {}

  /**
   * Retrieves all quests with optional filtering and pagination.
   * @param pagination - Pagination parameters (page, limit)
   * @param filter - Filter parameters (journey, orderBy, where)
   * @returns Array of quests matching the filter criteria
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query() pagination: PaginationDto,
    @Query() filter: QuestFilterInterface
  ): Promise<QuestResponseDto[]> {
    try {
      this.logger.log('Finding all quests');
      const quests = await this.questsService.findAll(pagination, filter);
      this.logger.log(`Found ${quests.length} quests`);
      return quests.map(quest => new QuestResponseDto(quest));
    } catch (error) {
      this.logger.error(`Failed to retrieve quests: ${error.message}`, error.stack);
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(
        'Failed to retrieve quests',
        ErrorType.TECHNICAL,
        'GAME_009',
        {},
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Retrieves a single quest by its ID.
   * @param id - The unique identifier of the quest
   * @returns The quest with the specified ID
   * @throws NotFoundException if the quest is not found
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string): Promise<QuestResponseDto> {
    try {
      this.logger.log(`Finding quest with ID: ${id}`);
      const quest = await this.questsService.findOne(id);
      
      if (!quest) {
        throw new NotFoundException(`Quest with ID ${id} not found`);
      }
      
      this.logger.log(`Found quest with ID: ${id}`);
      return new QuestResponseDto(quest);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to retrieve quest with ID ${id}: ${error.message}`, error.stack);
      if (error instanceof AppException) {
        throw error;
      }
      throw new AppException(
        `Failed to retrieve quest with ID ${id}`,
        ErrorType.TECHNICAL,
        'GAME_010',
        { id },
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Starts a quest for a user.
   * @param id - The ID of the quest to start
   * @param user - The authenticated user from the JWT token
   * @param startQuestDto - Optional data for starting the quest
   * @returns The created UserQuest record
   * @throws BadRequestException if the quest cannot be started
   */
  @Post(':id/start')
  @UseGuards(AuthGuard('jwt'))
  async startQuest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; [key: string]: any },
    @Query() startQuestDto: StartQuestDto
  ): Promise<UserQuestResponseDto> {
    try {
      this.logger.log(`Starting quest ${id} for user ${user.id}`);
      const userQuest = await this.questsService.startQuest(user.id, id, startQuestDto);
      this.logger.log(`Started quest ${id} for user ${user.id}`);
      return new UserQuestResponseDto(userQuest);
    } catch (error) {
      this.logger.error(`Failed to start quest ${id} for user ${user.id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        `Failed to start quest ${id} for user ${user.id}`,
        ErrorType.TECHNICAL,
        'GAME_011',
        { userId: user.id, questId: id },
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Completes a quest for a user.
   * @param id - The ID of the quest to complete
   * @param user - The authenticated user from the JWT token
   * @param completeQuestDto - Optional data for completing the quest
   * @returns The updated UserQuest record
   * @throws BadRequestException if the quest cannot be completed
   */
  @Post(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  async completeQuest(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; [key: string]: any },
    @Query() completeQuestDto: CompleteQuestDto
  ): Promise<UserQuestResponseDto> {
    try {
      this.logger.log(`Completing quest ${id} for user ${user.id}`);
      const userQuest = await this.questsService.completeQuest(user.id, id, completeQuestDto);
      this.logger.log(`Completed quest ${id} for user ${user.id}`);
      return new UserQuestResponseDto(userQuest);
    } catch (error) {
      this.logger.error(`Failed to complete quest ${id} for user ${user.id}: ${error.message}`, error.stack);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        `Failed to complete quest ${id} for user ${user.id}`,
        ErrorType.TECHNICAL,
        'GAME_012',
        { userId: user.id, questId: id },
        error,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}