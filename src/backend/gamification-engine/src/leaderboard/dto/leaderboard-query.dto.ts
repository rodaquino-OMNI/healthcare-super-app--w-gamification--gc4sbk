import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { JourneyType } from '@austa/interfaces/gamification';

/**
 * DTO for leaderboard query parameters
 */
export class LeaderboardQueryDto {
  /**
   * Page number (1-based)
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  /**
   * Number of items per page
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  pageSize: number = 10;

  /**
   * Optional journey type to filter by
   * @example "HEALTH"
   */
  @ApiProperty({
    description: 'Journey type to filter by',
    enum: JourneyType,
    required: false,
    example: JourneyType.HEALTH,
  })
  @IsEnum(JourneyType)
  @IsOptional()
  journey?: JourneyType;
}