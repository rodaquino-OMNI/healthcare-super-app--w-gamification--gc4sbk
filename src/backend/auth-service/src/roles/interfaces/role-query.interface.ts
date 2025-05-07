/**
 * Interface for role query parameters used in filtering and retrieving roles.
 * Provides type-safe parameters for searching and filtering roles by various properties.
 * Integrates with standardized pagination interfaces for consistent query operations.
 */

import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { JourneyType } from '@austa/interfaces/common/journey.types';

/**
 * Interface defining query parameters for role filtering operations.
 * Used by the RolesService to provide type-safe query parameters.
 */
export interface IRoleQuery extends PaginationDto {
  /**
   * Filter roles by name (case-insensitive partial match)
   * @example 'admin'
   */
  name?: string;

  /**
   * Filter roles by journey type
   * Limits results to roles associated with a specific journey
   * @example 'health'
   */
  journey?: JourneyType;

  /**
   * Filter roles by default status
   * When true, returns only system-defined default roles
   * When false, returns only custom roles
   * @example true
   */
  isDefault?: boolean;

  /**
   * Include permissions in the role results
   * @default true
   */
  includePermissions?: boolean;

  /**
   * Sort direction for role results
   * @default 'asc'
   */
  sortDirection?: 'asc' | 'desc';

  /**
   * Field to sort roles by
   * @default 'name'
   */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
}