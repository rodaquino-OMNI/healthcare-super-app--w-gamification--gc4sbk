import { HttpStatus } from '@nestjs/common';
import { ClientException } from '../../common/exceptions/client.exception';

/**
 * Interface for validation errors in rule definitions
 */
export interface RuleValidationError {
  /**
   * The field that failed validation
   */
  field: string;

  /**
   * The validation error message
   */
  message: string;

  /**
   * The expected value or format (optional)
   */
  expected?: string;

  /**
   * The actual value that was provided (optional)
   */
  actual?: string;
}

/**
 * Interface for rule definition exception context
 */
export interface RuleDefinitionErrorContext {
  /**
   * The ID of the rule being validated (if available)
   */
  ruleId?: string;

  /**
   * The name of the rule being validated (if available)
   */
  ruleName?: string;

  /**
   * Array of specific validation errors
   */
  validationErrors: RuleValidationError[];
}

/**
 * Exception thrown when a rule definition fails validation.
 * This occurs during rule creation, update, or loading when a rule's condition syntax,
 * action configuration, or other definition elements are invalid.
 */
export class RuleDefinitionException extends ClientException {
  /**
   * Creates a new RuleDefinitionException
   * 
   * @param message The error message
   * @param context The validation error context with details about which fields failed validation
   */
  constructor(
    message: string,
    public readonly context: RuleDefinitionErrorContext
  ) {
    super(
      message,
      'RULE_DEFINITION_INVALID',
      HttpStatus.BAD_REQUEST,
      context
    );
    this.name = 'RuleDefinitionException';
  }

  /**
   * Gets the validation errors for this exception
   */
  getValidationErrors(): RuleValidationError[] {
    return this.context.validationErrors;
  }

  /**
   * Creates a formatted error message with validation details
   */
  getFormattedMessage(): string {
    const ruleIdentifier = this.context.ruleName || this.context.ruleId || 'Unknown rule';
    const errorCount = this.context.validationErrors.length;
    
    let message = `${ruleIdentifier} has ${errorCount} validation ${errorCount === 1 ? 'error' : 'errors'}:\n`;
    
    this.context.validationErrors.forEach((error, index) => {
      message += `${index + 1}. Field '${error.field}': ${error.message}`;
      if (error.expected) {
        message += ` (Expected: ${error.expected})`;
      }
      if (error.actual) {
        message += ` (Received: ${error.actual})`;
      }
      message += '\n';
    });
    
    return message;
  }

  /**
   * Factory method to create an exception for condition syntax errors
   * 
   * @param ruleId The ID of the rule
   * @param ruleName The name of the rule
   * @param syntaxError The syntax error details
   * @returns A new RuleDefinitionException
   */
  static forConditionSyntaxError(
    ruleId: string | undefined,
    ruleName: string | undefined,
    syntaxError: string
  ): RuleDefinitionException {
    return new RuleDefinitionException(
      'Rule condition contains syntax errors',
      {
        ruleId,
        ruleName,
        validationErrors: [
          {
            field: 'condition',
            message: 'Invalid syntax in condition expression',
            actual: syntaxError
          }
        ]
      }
    );
  }

  /**
   * Factory method to create an exception for invalid action configuration
   * 
   * @param ruleId The ID of the rule
   * @param ruleName The name of the rule
   * @param actionType The type of action that failed validation
   * @param errors The specific validation errors
   * @returns A new RuleDefinitionException
   */
  static forInvalidActionConfiguration(
    ruleId: string | undefined,
    ruleName: string | undefined,
    actionType: string,
    errors: RuleValidationError[]
  ): RuleDefinitionException {
    return new RuleDefinitionException(
      `Invalid configuration for rule action: ${actionType}`,
      {
        ruleId,
        ruleName,
        validationErrors: errors.map(error => ({
          ...error,
          field: `actions.${actionType}.${error.field}`
        }))
      }
    );
  }

  /**
   * Factory method to create an exception for missing required fields
   * 
   * @param ruleId The ID of the rule
   * @param ruleName The name of the rule
   * @param missingFields Array of field names that are required but missing
   * @returns A new RuleDefinitionException
   */
  static forMissingRequiredFields(
    ruleId: string | undefined,
    ruleName: string | undefined,
    missingFields: string[]
  ): RuleDefinitionException {
    return new RuleDefinitionException(
      'Rule definition is missing required fields',
      {
        ruleId,
        ruleName,
        validationErrors: missingFields.map(field => ({
          field,
          message: 'This field is required'
        }))
      }
    );
  }
}