import { HttpStatus } from '@nestjs/common';
import { AppException, ErrorType } from 'src/backend/packages/errors/src/base.error';

/**
 * Interface representing a validation error for a specific field in a rule definition
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
   * The actual value that failed validation (optional)
   */
  actual?: string;
}

/**
 * Exception thrown when a rule definition fails validation.
 * This exception captures detailed information about which aspects of a rule
 * failed validation to help administrators correct rule configuration issues.
 */
export class RuleDefinitionException extends AppException {
  /**
   * Creates a new RuleDefinitionException instance.
   * 
   * @param message - Human-readable error message
   * @param validationErrors - Array of specific validation errors for each field
   * @param ruleId - ID of the rule that failed validation (if available)
   */
  constructor(
    message: string,
    public readonly validationErrors: RuleValidationError[],
    public readonly ruleId?: string
  ) {
    super(
      message,
      ErrorType.VALIDATION,
      'GAME_RULE_001',
      {
        validationErrors,
        ruleId
      }
    );
    
    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleDefinitionException.prototype);
  }

  /**
   * Creates a RuleDefinitionException for a condition syntax error
   * 
   * @param syntaxError - The syntax error message
   * @param condition - The invalid condition
   * @param ruleId - ID of the rule (optional)
   * @returns A new RuleDefinitionException instance
   */
  static conditionSyntaxError(syntaxError: string, condition: string, ruleId?: string): RuleDefinitionException {
    return new RuleDefinitionException(
      'Rule condition contains syntax errors',
      [
        {
          field: 'condition',
          message: `Syntax error in condition: ${syntaxError}`,
          actual: condition
        }
      ],
      ruleId
    );
  }

  /**
   * Creates a RuleDefinitionException for an invalid action configuration
   * 
   * @param actionType - The type of action that failed validation
   * @param errorDetails - Details about the action configuration error
   * @param ruleId - ID of the rule (optional)
   * @returns A new RuleDefinitionException instance
   */
  static invalidActionConfiguration(actionType: string, errorDetails: string, ruleId?: string): RuleDefinitionException {
    return new RuleDefinitionException(
      `Invalid configuration for action type: ${actionType}`,
      [
        {
          field: 'action',
          message: errorDetails,
          expected: `Valid configuration for ${actionType}`
        }
      ],
      ruleId
    );
  }

  /**
   * Creates a RuleDefinitionException for an invalid event type
   * 
   * @param eventType - The invalid event type
   * @param supportedTypes - List of supported event types
   * @param ruleId - ID of the rule (optional)
   * @returns A new RuleDefinitionException instance
   */
  static invalidEventType(eventType: string, supportedTypes: string[], ruleId?: string): RuleDefinitionException {
    return new RuleDefinitionException(
      `Unsupported event type: ${eventType}`,
      [
        {
          field: 'eventType',
          message: `Event type '${eventType}' is not supported`,
          expected: `One of: ${supportedTypes.join(', ')}`,
          actual: eventType
        }
      ],
      ruleId
    );
  }

  /**
   * Creates a RuleDefinitionException for multiple validation errors
   * 
   * @param errors - Array of validation errors
   * @param ruleId - ID of the rule (optional)
   * @returns A new RuleDefinitionException instance
   */
  static multipleErrors(errors: RuleValidationError[], ruleId?: string): RuleDefinitionException {
    return new RuleDefinitionException(
      `Rule definition contains ${errors.length} validation errors`,
      errors,
      ruleId
    );
  }

  /**
   * Returns the HTTP status code for this exception (400 Bad Request)
   * @override
   */
  getHttpStatusCode(): HttpStatus {
    return HttpStatus.BAD_REQUEST;
  }
}