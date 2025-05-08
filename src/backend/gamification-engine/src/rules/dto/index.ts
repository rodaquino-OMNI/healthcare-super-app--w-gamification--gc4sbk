/**
 * @file Rule DTOs barrel export file
 * @description Consolidates and re-exports all rule-related DTOs from a single entry point.
 * This simplifies imports throughout the application by allowing developers to import
 * multiple DTOs from a single path.
 */

// Export all rule-related DTOs
export { CreateRuleDto } from './create-rule.dto';
export { UpdateRuleDto } from './update-rule.dto';
export { RuleResponseDto } from './rule-response.dto';
export { RuleFilterDto } from './rule-filter.dto';
export { RuleActionDto, RuleActionType } from './rule-action.dto';