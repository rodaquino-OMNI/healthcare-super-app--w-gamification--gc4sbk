import { PartialType } from '@nestjs/mapped-types';
import { CreateRuleDto } from './create-rule.dto';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Data Transfer Object for updating an existing gamification rule.
 * 
 * This DTO extends the partial version of CreateRuleDto, making all fields
 * optional for update operations, while maintaining the same validation rules.
 * This pattern follows NestJS best practices for PATCH operations, ensuring
 * type safety and validation while allowing clients to update only the
 * specific fields they need to change.
 */
export class UpdateRuleDto extends PartialType(CreateRuleDto) {
  /**
   * Indicates whether the rule is currently active.
   * Inactive rules are not evaluated against incoming events.
   * 
   * This field is explicitly redefined here (even though it's inherited from
   * CreateRuleDto) to emphasize that it's a common field to update independently
   * of other properties, allowing rules to be enabled/disabled without changing
   * other aspects of the rule.
   * 
   * @example true
   */
  @IsOptional()
  @IsBoolean({ message: 'Enabled flag must be a boolean' })
  enabled?: boolean;

  /**
   * Validates that the update contains at least one field to update.
   * This method is called by the class-validator library when validating
   * instances of this class.
   * 
   * @returns true if the update contains at least one field, false otherwise
   */
  validateAtLeastOneFieldProvided(): boolean {
    // Get all properties of this object except those inherited from Object.prototype
    const properties = Object.getOwnPropertyNames(this);
    
    // Check if at least one property has a non-undefined value
    return properties.some(property => this[property] !== undefined);
  }
}