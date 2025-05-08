import { AppException, ErrorType } from '@austa/errors';

/**
 * Exception thrown when an error occurs during the evaluation of rule conditions.
 * This is typically caused by syntax errors, reference errors, or other JavaScript
 * runtime issues when dynamically evaluating rule condition expressions.
 */
export class RuleEvaluationException extends AppException {
  /**
   * Creates a new RuleEvaluationException instance.
   * 
   * @param ruleId - The ID of the rule that failed evaluation
   * @param conditionExpression - The condition expression that failed to evaluate
   * @param evaluationContext - The context object provided to the evaluation
   * @param originalError - The original error that occurred during evaluation
   */
  constructor(
    public readonly ruleId: string,
    public readonly conditionExpression: string,
    public readonly evaluationContext: Record<string, any>,
    originalError: Error
  ) {
    super(
      `Failed to evaluate rule condition for rule ${ruleId}`,
      ErrorType.TECHNICAL,
      'GAME_RULE_EVAL_001',
      {
        ruleId,
        conditionExpression,
        // Filter sensitive data from context before logging
        context: sanitizeContext(evaluationContext),
        errorMessage: originalError.message,
        errorName: originalError.name,
      },
      originalError
    );

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleEvaluationException.prototype);
  }
}

/**
 * Sanitizes the evaluation context to remove sensitive information before logging.
 * 
 * @param context - The original evaluation context
 * @returns A sanitized version of the context safe for logging
 */
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  const sanitized = { ...context };
  
  // Remove potentially sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'credential', 'auth'];
  
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeContext(sanitized[key]);
    }
  });
  
  return sanitized;
}