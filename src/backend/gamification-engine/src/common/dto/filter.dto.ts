import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * Enum for filter operators
 */
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not',
  IN = 'in',
  NOT_IN = 'notIn',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
}

/**
 * DTO for a single filter condition
 */
export class FilterConditionDto {
  /**
   * Field to filter on
   */
  @ApiProperty({
    description: 'Field to filter on',
    example: 'status',
  })
  @IsString()
  field: string;

  /**
   * Filter operator
   */
  @ApiProperty({
    description: 'Filter operator',
    enum: FilterOperator,
    example: FilterOperator.EQUALS,
  })
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  /**
   * Filter value
   */
  @ApiProperty({
    description: 'Filter value',
    example: 'ACTIVE',
  })
  value: any;

  /**
   * Converts the filter condition to Prisma format
   * @returns Object with the field and operator in Prisma format
   */
  toPrisma(): Record<string, any> {
    // Handle special cases for null operators
    if (this.operator === FilterOperator.IS_NULL) {
      return { [this.field]: null };
    }
    if (this.operator === FilterOperator.IS_NOT_NULL) {
      return { [this.field]: { not: null } };
    }
    
    // Standard operators
    return {
      [this.field]: { [this.operator]: this.value },
    };
  }
}

/**
 * DTO for multiple filter conditions
 */
export class FilterDto {
  /**
   * Array of filter conditions (AND logic)
   */
  @ApiPropertyOptional({
    description: 'Array of filter conditions (AND logic)',
    type: [FilterConditionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FilterConditionDto)
  @IsOptional()
  conditions?: FilterConditionDto[];

  /**
   * Journey context for journey-specific filtering
   */
  @ApiPropertyOptional({
    description: 'Journey context for journey-specific filtering',
    example: 'health',
    enum: ['health', 'care', 'plan'],
  })
  @IsString()
  @IsOptional()
  journey?: string;

  /**
   * Raw where object for direct Prisma filtering
   * Provides an escape hatch for complex filtering not covered by conditions
   */
  @ApiPropertyOptional({
    description: 'Raw where object for direct Prisma filtering',
    example: { status: 'ACTIVE', points: { gt: 100 } },
  })
  @IsObject()
  @IsOptional()
  where?: Record<string, any>;

  /**
   * Converts the filter to Prisma where format
   * @returns Object with where clause in Prisma format
   */
  toPrismaWhere(): Record<string, any> {
    const result: Record<string, any> = {};
    
    // Apply direct where object if provided
    if (this.where) {
      Object.assign(result, this.where);
    }
    
    // Apply conditions if provided
    if (this.conditions && this.conditions.length > 0) {
      const conditionsWhere = this.conditions.reduce((acc, condition) => {
        return { ...acc, ...condition.toPrisma() };
      }, {});
      
      Object.assign(result, conditionsWhere);
    }
    
    // Apply journey filter if provided
    if (this.journey) {
      result.journey = this.journey;
    }
    
    return result;
  }
}