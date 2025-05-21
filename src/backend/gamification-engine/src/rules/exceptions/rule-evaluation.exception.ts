import { AppException, ErrorType } from 'src/backend/packages/errors/src/categories';

/**
 * Exception thrown when a rule condition evaluation fails.
 * This is a system error (500) that occurs when the dynamic evaluation
 * of rule conditions encounters runtime errors such as syntax errors,
 * reference errors, or other JavaScript execution issues.
 */
export class RuleEvaluationException extends AppException {
  /**
   * Creates a new RuleEvaluationException instance.
   * 
   * @param ruleId - The ID of the rule that failed evaluation
   * @param conditionExpression - The condition expression that caused the failure
   * @param evaluationContext - The context data that was being evaluated
   * @param originalError - The original error thrown during evaluation
   */
  constructor(
    public readonly ruleId: string,
    public readonly conditionExpression: string,
    public readonly evaluationContext: Record<string, any>,
    originalError: Error
  ) {
    super(
      `Failed to evaluate rule condition: ${originalError.message}`,
      ErrorType.TECHNICAL,
      'GAME_RULE_001',
      {
        ruleId,
        conditionExpression,
        // Filter sensitive data from context if needed
        evaluationContext: sanitizeContext(evaluationContext)
      },
      originalError
    );

    // Ensures proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, RuleEvaluationException.prototype);
  }
}

/**
 * Sanitizes the evaluation context to remove sensitive information
 * before including it in error details.
 * 
 * @param context - The original evaluation context
 * @returns A sanitized version of the context safe for logging
 */
function sanitizeContext(context: Record<string, any>): Record<string, any> {
  if (!context) return {};
  
  // Create a shallow copy of the context
  const sanitized = { ...context };
  
  // Remove potentially sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'credential', 'auth'];
  
  Object.keys(sanitized).forEach(key => {
    // Remove fields with sensitive names
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
    
    // Truncate large objects/arrays to prevent excessive logging
    if (
      sanitized[key] && 
      typeof sanitized[key] === 'object' && 
      Object.keys(sanitized[key]).length > 10
    ) {
      sanitized[key] = '[TRUNCATED]';
    }
  });
  
  return sanitized;
}