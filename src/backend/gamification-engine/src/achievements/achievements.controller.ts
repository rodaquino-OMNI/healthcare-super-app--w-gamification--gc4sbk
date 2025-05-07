import { Controller, Get, Param, Query, UseGuards, HttpStatus, ParseUUIDPipe, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { FilterDto } from '@austa/interfaces/common/dto/filter.dto';
import { PaginationDto, PaginatedResponse } from '@austa/interfaces/common/dto/pagination.dto';
import { AchievementResponseDto } from './dto/achievement-response.dto';
import { IAchievementService } from './interfaces/i-achievement-service.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppException } from '@app/errors/app.exception';
import { ErrorType } from '@app/errors/error-type.enum';

/**
 * Controller for managing achievements.
 * Provides endpoints for retrieving achievement data with proper validation and error handling.
 */
@ApiTags('achievements')
@Controller('achievements')
export class AchievementsController {
  /**
   * Injects the Achievements service.
   * 
   * @param achievementsService - Service that provides achievement-related functionality
   */
  constructor(
    private readonly achievementsService: IAchievementService
  ) {}

  /**
   * Retrieves all achievements.
   * Supports pagination and filtering.
   * 
   * @param pagination - Pagination parameters like page and limit
   * @param filter - Filtering criteria like journey or specific conditions
   * @returns A promise that resolves to a paginated response of achievement DTOs
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all achievements', description: 'Retrieves all achievements with pagination and filtering support' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (starts at 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of items per page', type: Number })
  @ApiQuery({ name: 'journey', required: false, description: 'Filter by journey type (health, care, plan)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of achievements retrieved successfully', type: [AchievementResponseDto] })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid pagination or filter parameters' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error occurred' })
  async findAll(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) pagination: PaginationDto,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) filter: FilterDto
  ): Promise<PaginatedResponse<AchievementResponseDto>> {
    try {
      const achievements = await this.achievementsService.findAll(pagination, filter);
      
      // Transform the achievement entities to response DTOs
      return {
        data: achievements.data.map(achievement => new AchievementResponseDto(achievement)),
        meta: achievements.meta
      };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        'Failed to retrieve achievements',
        ErrorType.TECHNICAL,
        'GAME_002',
        { pagination, filter },
        error as Error
      );
    }
  }

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise that resolves to a single achievement DTO
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get achievement by ID', description: 'Retrieves a specific achievement by its unique identifier' })
  @ApiParam({ name: 'id', description: 'Achievement unique identifier (UUID)', type: String })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievement retrieved successfully', type: AchievementResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid achievement ID format' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Achievement not found' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'User is not authenticated' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Internal server error occurred' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4', errorHttpStatusCode: HttpStatus.BAD_REQUEST }))
    id: string
  ): Promise<AchievementResponseDto> {
    try {
      const achievement = await this.achievementsService.findById(id);
      return new AchievementResponseDto(achievement);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw new AppException(
        `Failed to retrieve achievement with ID ${id}`,
        ErrorType.TECHNICAL,
        'GAME_002',
        { id },
        error as Error
      );
    }
  }
}