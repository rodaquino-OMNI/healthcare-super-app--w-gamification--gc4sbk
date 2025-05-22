import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsDate, IsOptional, IsString, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { BaseDto, JourneyContext, ApiVersion } from '@austa/interfaces/common/dto';
import { <%= journeyName %>Entity } from '@austa/interfaces/journey/<%= journeyNameLower %>';

/**
 * Data Transfer Object for <%= className %>
 * 
 * @description This DTO is used for <%= className %> data transfer between client and server
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
@ApiVersion('1')
@JourneyContext('<%= journeyName %>')
export class <%= className %>Dto implements BaseDto {
  @ApiProperty({
    description: 'Unique identifier for the <%= className %>',
    example: 1,
    type: Number,
    required: true
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z',
    type: Date,
    required: true
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00Z',
    type: Date,
    required: true
  })
  @IsDate()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Optional description field',
    example: 'Description of the <%= className %>',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Maps entity data to DTO
   * @param entity The entity to map from
   * @returns A new DTO instance with mapped data
   */
  static fromEntity(entity: <%= journeyName %>Entity.<%= className %>Entity): <%= className %>Dto {
    const dto = new <%= className %>Dto();
    dto.id = entity.id;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.description = entity.description;
    return dto;
  }

  /**
   * Maps DTO to entity data
   * @returns A plain object with entity data
   */
  toEntity(): Partial<<%= journeyName %>Entity.<%= className %>Entity> {
    return {
      id: this.id,
      description: this.description,
      // Other fields as needed
    };
  }
}

/**
 * Data Transfer Object for creating a new <%= className %>
 * 
 * @description This DTO is used for creating a new <%= className %>
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
@ApiVersion('1')
@JourneyContext('<%= journeyName %>')
export class Create<%= className %>Dto implements Omit<BaseDto, 'id' | 'createdAt' | 'updatedAt'> {
  @ApiProperty({
    description: 'Description of the <%= className %>',
    example: 'Description of the <%= className %>',
    type: String,
    required: true
  })
  @IsString()
  description: string;

  // Add other fields as needed for creation
}

/**
 * Data Transfer Object for updating an existing <%= className %>
 * 
 * @description This DTO is used for updating an existing <%= className %>
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
@ApiVersion('1')
@JourneyContext('<%= journeyName %>')
export class Update<%= className %>Dto implements Partial<Omit<BaseDto, 'id' | 'createdAt' | 'updatedAt'>> {
  @ApiPropertyOptional({
    description: 'Description of the <%= className %>',
    example: 'Updated description of the <%= className %>',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Add other fields as needed for updates
}

/**
 * Data Transfer Object for filtering <%= className %> entities
 * 
 * @description This DTO is used for filtering <%= className %> entities in queries
 * @version 1.0.0
 * @journey <%= journeyName %>
 */
@ApiVersion('1')
@JourneyContext('<%= journeyName %>')
export class Filter<%= className %>Dto {
  @ApiPropertyOptional({
    description: 'Filter by description (partial match)',
    example: 'description',
    type: String,
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Add other filter fields as needed
}