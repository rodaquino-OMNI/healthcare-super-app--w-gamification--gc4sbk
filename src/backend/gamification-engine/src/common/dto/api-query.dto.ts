import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum for sorting direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO for sorting parameters
 */
export class SortDto {
  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Sort direction',
    enum: SortDirection,
    example: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  direction: SortDirection;
}

/**
 * DTO for pagination parameters
 */
export class PaginationDto {
  @ApiProperty({
    description: 'Page number (1-based)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 10;
}

/**
 * DTO for filtering parameters
 */
export class FilterDto {
  @ApiPropertyOptional({
    description: 'Filter by field values',
    example: { status: 'ACTIVE' },
  })
  @IsObject()
  @IsOptional()
  where?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Journey context for journey-specific filtering',
    example: 'health',
    enum: ['health', 'care', 'plan'],
  })
  @IsString()
  @IsOptional()
  journey?: string;
}

/**
 * Combined DTO for API query parameters including pagination, sorting, and filtering
 * Used across all endpoints in the gamification engine to ensure consistent parameter handling
 */
export class ApiQueryDto {
  @ApiPropertyOptional({
    description: 'Pagination parameters',
    type: PaginationDto,
  })
  @ValidateNested()
  @Type(() => PaginationDto)
  @IsOptional()
  pagination?: PaginationDto = new PaginationDto();

  @ApiPropertyOptional({
    description: 'Sorting parameters',
    type: SortDto,
  })
  @ValidateNested()
  @Type(() => SortDto)
  @IsOptional()
  sort?: SortDto;

  @ApiPropertyOptional({
    description: 'Filtering parameters',
    type: FilterDto,
  })
  @ValidateNested()
  @Type(() => FilterDto)
  @IsOptional()
  filter?: FilterDto = new FilterDto();

  /**
   * Converts the pagination parameters to Prisma skip/take format
   * @returns Object with skip and take properties for Prisma queries
   */
  toPrismaSkipTake(): { skip: number; take: number } {
    const { page, limit } = this.pagination || new PaginationDto();
    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }

  /**
   * Converts the sort parameters to Prisma orderBy format
   * @returns Object with orderBy property for Prisma queries
   */
  toPrismaOrderBy(): Record<string, any> | undefined {
    if (!this.sort) return undefined;
    
    const { field, direction } = this.sort;
    return {
      [field]: direction,
    };
  }

  /**
   * Converts the filter parameters to Prisma where format
   * @returns Object with where property for Prisma queries
   */
  toPrismaWhere(): Record<string, any> | undefined {
    if (!this.filter?.where) return undefined;
    
    // Apply journey-specific filtering if journey is specified
    if (this.filter.journey) {
      return {
        ...this.filter.where,
        journey: this.filter.journey,
      };
    }
    
    return this.filter.where;
  }

  /**
   * Converts all query parameters to Prisma query options
   * @returns Object with Prisma query options (skip, take, orderBy, where)
   */
  toPrismaOptions(): Record<string, any> {
    return {
      ...this.toPrismaSkipTake(),
      orderBy: this.toPrismaOrderBy(),
      where: this.toPrismaWhere(),
    };
  }
}