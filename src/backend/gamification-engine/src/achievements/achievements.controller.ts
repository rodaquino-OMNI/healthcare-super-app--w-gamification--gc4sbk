import { Controller, Get, Param, Query, UseGuards, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { ApiQuery, ApiResponse, ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ApiQueryDto } from '@app/common/dto/api-query.dto';
import { BaseResponseDto } from '@app/common/dto/base-response.dto';
import { ErrorResponseDto } from '@app/common/dto/error-response.dto';
import { Achievement } from './entities/achievement.entity';
import { AchievementResponseDto } from './dto/achievement-response.dto';
import { IsUUID, IsNotEmpty } from 'class-validator';

/**
 * Controller for managing achievements.
 * Provides endpoints for retrieving achievement data.
 */
@ApiTags('achievements')
@Controller('achievements')
@ApiBearerAuth()
export class AchievementsController {
  /**
   * Injects the Achievements service.
   * 
   * @param achievementsService - Service that provides achievement-related functionality
   */
  constructor(private readonly achievementsService: AchievementsService) {}

  /**
   * Retrieves all achievements.
   * Supports pagination, filtering, and sorting.
   * 
   * @param queryDto - Combined query parameters including pagination, filtering, and sorting
   * @returns A promise that resolves to a paginated array of achievements with metadata
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully retrieved achievements',
    type: () => BaseResponseDto<AchievementResponseDto[]>
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid query parameters',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
    type: ErrorResponseDto 
  })
  @ApiQuery({ type: ApiQueryDto })
  async findAll(@Query() queryDto: ApiQueryDto): Promise<BaseResponseDto<AchievementResponseDto[]>> {
    try {
      const { data, meta } = await this.achievementsService.findAll(
        queryDto.pagination, 
        queryDto.filter,
        queryDto.sort
      );
      
      return {
        status: 'success',
        data,
        meta
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve achievements');
    }
  }

  /**
   * Retrieves a single achievement by its ID.
   * 
   * @param id - The unique identifier of the achievement
   * @returns A promise that resolves to a single achievement
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Successfully retrieved achievement',
    type: () => BaseResponseDto<AchievementResponseDto>
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Achievement not found',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid achievement ID',
    type: ErrorResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.UNAUTHORIZED, 
    description: 'Unauthorized access',
    type: ErrorResponseDto 
  })
  @ApiParam({ name: 'id', description: 'Achievement ID', type: String })
  async findOne(@Param('id') @IsUUID() @IsNotEmpty() id: string): Promise<BaseResponseDto<AchievementResponseDto>> {
    try {
      const achievement = await this.achievementsService.findById(id);
      
      if (!achievement) {
        throw new NotFoundException(`Achievement with ID ${id} not found`);
      }
      
      return {
        status: 'success',
        data: achievement
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to retrieve achievement with ID ${id}`);
    }
  }
}