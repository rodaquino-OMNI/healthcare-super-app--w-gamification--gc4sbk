import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * Enum for sorting direction
 */
export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

/**
 * DTO for a single sort field
 */
export class SortDto {
  /**
   * Field to sort by
   */
  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
  })
  @IsString()
  field: string;

  /**
   * Sort direction
   */
  @ApiProperty({
    description: 'Sort direction',
    enum: SortDirection,
    example: SortDirection.DESC,
  })
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.DESC;

  /**
   * Creates a sort DTO for the specified field and direction
   * 
   * @param field Field to sort by
   * @param direction Sort direction (defaults to DESC)
   * @returns A new SortDto instance
   */
  static create(field: string, direction: SortDirection = SortDirection.DESC): SortDto {
    const sort = new SortDto();
    sort.field = field;
    sort.direction = direction;
    return sort;
  }

  /**
   * Creates a sort DTO for the createdAt field
   * 
   * @param direction Sort direction (defaults to DESC)
   * @returns A new SortDto instance for the createdAt field
   */
  static byCreatedAt(direction: SortDirection = SortDirection.DESC): SortDto {
    return SortDto.create('createdAt', direction);
  }

  /**
   * Creates a sort DTO for the updatedAt field
   * 
   * @param direction Sort direction (defaults to DESC)
   * @returns A new SortDto instance for the updatedAt field
   */
  static byUpdatedAt(direction: SortDirection = SortDirection.DESC): SortDto {
    return SortDto.create('updatedAt', direction);
  }

  /**
   * Creates a sort DTO for the name field
   * 
   * @param direction Sort direction (defaults to ASC)
   * @returns A new SortDto instance for the name field
   */
  static byName(direction: SortDirection = SortDirection.ASC): SortDto {
    return SortDto.create('name', direction);
  }

  /**
   * Converts the sort to Prisma orderBy format
   * @returns Object with orderBy property for Prisma queries
   */
  toPrismaOrderBy(): Record<string, any> {
    return {
      [this.field]: this.direction,
    };
  }
}

/**
 * DTO for multiple sort fields
 */
export class MultiSortDto {
  /**
   * Array of sort fields
   */
  @ApiPropertyOptional({
    description: 'Array of sort fields',
    type: [SortDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  @IsOptional()
  sorts?: SortDto[] = [];

  /**
   * Creates a multi-sort DTO with the specified sort fields
   * 
   * @param sorts Array of sort fields
   * @returns A new MultiSortDto instance
   */
  static create(sorts: SortDto[]): MultiSortDto {
    const multiSort = new MultiSortDto();
    multiSort.sorts = sorts;
    return multiSort;
  }

  /**
   * Adds a sort field to the multi-sort
   * 
   * @param sort Sort field to add
   * @returns This MultiSortDto instance for chaining
   */
  addSort(sort: SortDto): MultiSortDto {
    if (!this.sorts) {
      this.sorts = [];
    }
    this.sorts.push(sort);
    return this;
  }

  /**
   * Converts the multi-sort to Prisma orderBy format
   * @returns Array of orderBy objects for Prisma queries
   */
  toPrismaOrderBy(): Record<string, any>[] {
    if (!this.sorts || this.sorts.length === 0) {
      return [SortDto.byCreatedAt().toPrismaOrderBy()];
    }
    
    return this.sorts.map(sort => sort.toPrismaOrderBy());
  }
}