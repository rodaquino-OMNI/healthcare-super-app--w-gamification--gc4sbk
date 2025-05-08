import { 
  IsEnum, 
  IsInt, 
  IsOptional, 
  IsString, 
  IsUUID, 
  IsDate, 
  IsArray,
  Min, 
  Max,
  ValidateIf
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SortOrder as ISortOrder } from '@austa/interfaces/common';

/**
 * Enum for profile sorting fields
 * Defines the valid fields that can be used for sorting game profiles
 */
export enum ProfileSortField {
  ID = 'id',
  USER_ID = 'userId',
  LEVEL = 'level',
  XP = 'xp',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt'
}

/**
 * Enum for sort order direction
 * Defines the valid sort directions (ascending or descending)
 * Uses the standardized SortOrder from @austa/interfaces/common
 */
export enum SortOrder {
  ASC = ISortOrder.ASC,
  DESC = ISortOrder.DESC
}

/**
 * Data Transfer Object for filtering game profiles
 * 
 * This DTO standardizes query parameters for retrieving and filtering game profiles.
 * It includes pagination parameters, sorting options, and filtering criteria.
 * Used by profile listing endpoints to validate and parse query parameters.
 */
export class FilterProfilesDto {
  /**
   * Page number for pagination (1-based indexing)
   * @default 1
   * @minimum 1
   * @example 1
   */
  @ApiProperty({
    description: 'Page number (1-based indexing)',
    default: 1,
    minimum: 1,
    example: 1,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  /**
   * Number of items per page
   * @default 10
   * @minimum 1
   * @maximum 100
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
    required: false
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  /**
   * Field to sort by
   * @default ProfileSortField.CREATED_AT
   * @example "level"
   */
  @ApiProperty({
    description: 'Field to sort by',
    enum: ProfileSortField,
    default: ProfileSortField.CREATED_AT,
    example: ProfileSortField.LEVEL,
    required: false
  })
  @IsEnum(ProfileSortField)
  @IsOptional()
  sortBy?: ProfileSortField = ProfileSortField.CREATED_AT;

  /**
   * Sort order direction
   * @default SortOrder.DESC
   * @example "desc"
   */
  @ApiProperty({
    description: 'Sort order direction',
    enum: SortOrder,
    default: SortOrder.DESC,
    example: SortOrder.DESC,
    required: false
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;

  /**
   * Filter by minimum level
   * @minimum 1
   * @example 5
   */
  @ApiProperty({
    description: 'Filter by minimum level',
    minimum: 1,
    example: 5,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  minLevel?: number;

  /**
   * Filter by maximum level
   * @minimum 1
   * @example 10
   */
  @ApiProperty({
    description: 'Filter by maximum level',
    minimum: 1,
    example: 10,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxLevel?: number;

  /**
   * Filter by minimum XP
   * @minimum 0
   * @example 1000
   */
  @ApiProperty({
    description: 'Filter by minimum XP',
    minimum: 0,
    example: 1000,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minXp?: number;

  /**
   * Filter by maximum XP
   * @minimum 0
   * @example 5000
   */
  @ApiProperty({
    description: 'Filter by maximum XP',
    minimum: 0,
    example: 5000,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxXp?: number;

  /**
   * Filter by specific user ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Filter by specific user ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  /**
   * Filter by multiple user IDs
   * @example ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"]
   */
  @ApiProperty({
    description: 'Filter by multiple user IDs',
    example: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
    required: false,
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  userIds?: string[];

  /**
   * Filter by profiles created after this date
   * @example "2023-01-01T00:00:00Z"
   */
  @ApiProperty({
    description: 'Filter by profiles created after this date',
    example: '2023-01-01T00:00:00Z',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAfter?: Date;

  /**
   * Filter by profiles created before this date
   * @example "2023-12-31T23:59:59Z"
   */
  @ApiProperty({
    description: 'Filter by profiles created before this date',
    example: '2023-12-31T23:59:59Z',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdBefore?: Date;

  /**
   * Filter by profiles updated after this date
   * @example "2023-01-01T00:00:00Z"
   */
  @ApiProperty({
    description: 'Filter by profiles updated after this date',
    example: '2023-01-01T00:00:00Z',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  updatedAfter?: Date;

  /**
   * Filter by profiles updated before this date
   * @example "2023-12-31T23:59:59Z"
   */
  @ApiProperty({
    description: 'Filter by profiles updated before this date',
    example: '2023-12-31T23:59:59Z',
    required: false
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  updatedBefore?: Date;

  /**
   * Include achievements in the response
   * @default false
   * @example true
   */
  @ApiProperty({
    description: 'Include achievements in the response',
    default: false,
    example: true,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  includeAchievements?: boolean = false;

  /**
   * Include quests in the response
   * @default false
   * @example true
   */
  @ApiProperty({
    description: 'Include quests in the response',
    default: false,
    example: true,
    required: false
  })
  @IsOptional()
  @Type(() => Boolean)
  includeQuests?: boolean = false;

  /**
   * Validates that maxLevel is greater than or equal to minLevel if both are provided
   */
  @ValidateIf(o => o.minLevel !== undefined && o.maxLevel !== undefined)
  @Min(1, { message: 'maxLevel must be greater than or equal to minLevel' })
  get isMaxLevelValid(): number | undefined {
    if (this.minLevel === undefined || this.maxLevel === undefined) {
      return undefined;
    }
    return this.maxLevel >= this.minLevel ? this.maxLevel : 0;
  }

  /**
   * Validates that maxXp is greater than or equal to minXp if both are provided
   */
  @ValidateIf(o => o.minXp !== undefined && o.maxXp !== undefined)
  @Min(0, { message: 'maxXp must be greater than or equal to minXp' })
  get isMaxXpValid(): number | undefined {
    if (this.minXp === undefined || this.maxXp === undefined) {
      return undefined;
    }
    return this.maxXp >= this.minXp ? this.maxXp : -1;
  }

  /**
   * Validates that createdBefore is after createdAfter if both are provided
   */
  @ValidateIf(o => o.createdAfter !== undefined && o.createdBefore !== undefined)
  get isCreatedDateRangeValid(): boolean {
    if (this.createdAfter === undefined || this.createdBefore === undefined) {
      return true;
    }
    return this.createdBefore >= this.createdAfter;
  }

  /**
   * Validates that updatedBefore is after updatedAfter if both are provided
   */
  @ValidateIf(o => o.updatedAfter !== undefined && o.updatedBefore !== undefined)
  get isUpdatedDateRangeValid(): boolean {
    if (this.updatedAfter === undefined || this.updatedBefore === undefined) {
      return true;
    }
    return this.updatedBefore >= this.updatedAfter;
  }

  /**
   * Converts the DTO to a Prisma where clause for filtering
   * @returns Prisma where clause object
   */
  toPrismaWhere(): Record<string, any> {
    const where: Record<string, any> = {};

    // User ID filtering
    if (this.userId) {
      where.userId = this.userId;
    } else if (this.userIds && this.userIds.length > 0) {
      where.userId = { in: this.userIds };
    }

    // Level filtering
    if (this.minLevel !== undefined || this.maxLevel !== undefined) {
      where.level = {};
      if (this.minLevel !== undefined) {
        where.level.gte = this.minLevel;
      }
      if (this.maxLevel !== undefined) {
        where.level.lte = this.maxLevel;
      }
    }

    // XP filtering
    if (this.minXp !== undefined || this.maxXp !== undefined) {
      where.xp = {};
      if (this.minXp !== undefined) {
        where.xp.gte = this.minXp;
      }
      if (this.maxXp !== undefined) {
        where.xp.lte = this.maxXp;
      }
    }

    // Date filtering for createdAt
    if (this.createdAfter !== undefined || this.createdBefore !== undefined) {
      where.createdAt = {};
      if (this.createdAfter !== undefined) {
        where.createdAt.gte = this.createdAfter;
      }
      if (this.createdBefore !== undefined) {
        where.createdAt.lte = this.createdBefore;
      }
    }

    // Date filtering for updatedAt
    if (this.updatedAfter !== undefined || this.updatedBefore !== undefined) {
      where.updatedAt = {};
      if (this.updatedAfter !== undefined) {
        where.updatedAt.gte = this.updatedAfter;
      }
      if (this.updatedBefore !== undefined) {
        where.updatedAt.lte = this.updatedBefore;
      }
    }

    return where;
  }

  /**
   * Converts the DTO to a Prisma orderBy clause for sorting
   * @returns Prisma orderBy clause object
   */
  toPrismaOrderBy(): Record<string, string> {
    return { [this.sortBy || ProfileSortField.CREATED_AT]: this.sortOrder || SortOrder.DESC };
  }

  /**
   * Converts the DTO to a Prisma include clause for related entities
   * @returns Prisma include clause object
   */
  toPrismaInclude(): Record<string, boolean> {
    const include: Record<string, boolean> = {};
    
    if (this.includeAchievements) {
      include.achievements = true;
    }
    
    if (this.includeQuests) {
      include.quests = true;
    }
    
    return include;
  }

  /**
   * Calculates the number of items to skip for pagination
   * @returns Number of items to skip
   */
  getSkip(): number {
    return ((this.page || 1) - 1) * (this.limit || 10);
  }

  /**
   * Gets the limit for pagination
   * @returns Number of items to take
   */
  getTake(): number {
    return this.limit || 10;
  }
}