import { ErrorType } from '../../../src/categories/error-types';
import {
  formatJourneyError,
  formatErrorCode,
  translateErrorMessage,
  formatTemplate,
  createErrorContext,
  formatErrorResponse,
  JourneyType,
  ErrorContext,
  TemplateVariables
} from '../../../src/utils/format';

describe('Error Formatter Utility', () => {
  // Store original NODE_ENV to restore after tests
  const originalNodeEnv = process.env.NODE_ENV;

  // Clean up after all tests
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('formatJourneyError', () => {
    it('should format error message with journey prefix', () => {
      const message = 'Something went wrong';
      const context: ErrorContext = {
        journeyType: JourneyType.HEALTH,
        userId: 'user123',
        requestId: 'req456',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      const result = formatJourneyError(message, context);
      
      expect(result).toContain('Health Journey: Something went wrong');
    });

    it('should include debug information in non-production environment', () => {
      // Set NODE_ENV to development
      process.env.NODE_ENV = 'development';

      const message = 'Something went wrong';
      const context: ErrorContext = {
        journeyType: JourneyType.CARE,
        userId: 'user123',
        requestId: 'req456',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      const result = formatJourneyError(message, context);
      
      expect(result).toContain('Care Journey: Something went wrong');
      expect(result).toContain('User: user123');
      expect(result).toContain('Request: req456');
      expect(result).toContain('Time: 2023-01-01T12:00:00.000Z');
    });

    it('should not include debug information in production environment', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';

      const message = 'Something went wrong';
      const context: ErrorContext = {
        journeyType: JourneyType.PLAN,
        userId: 'user123',
        requestId: 'req456',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      const result = formatJourneyError(message, context);
      
      expect(result).toBe('Plan Journey: Something went wrong');
      expect(result).not.toContain('User: user123');
      expect(result).not.toContain('Request: req456');
    });

    it('should handle missing journey type', () => {
      const message = 'Something went wrong';
      const context: ErrorContext = {
        userId: 'user123',
        requestId: 'req456',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };

      const result = formatJourneyError(message, context);
      
      expect(result).toContain('System: Something went wrong');
    });

    it('should handle all journey types correctly', () => {
      const message = 'Test message';
      
      // Test each journey type
      expect(formatJourneyError(message, { journeyType: JourneyType.HEALTH })).toContain('Health Journey');
      expect(formatJourneyError(message, { journeyType: JourneyType.CARE })).toContain('Care Journey');
      expect(formatJourneyError(message, { journeyType: JourneyType.PLAN })).toContain('Plan Journey');
      expect(formatJourneyError(message, { journeyType: JourneyType.GAMIFICATION })).toContain('Gamification');
      expect(formatJourneyError(message, { journeyType: JourneyType.SYSTEM })).toContain('System');
    });
  });

  describe('formatErrorCode', () => {
    it('should format numeric error code with journey prefix', () => {
      const code = '1234';
      const journeyType = JourneyType.HEALTH;

      const result = formatErrorCode(code, journeyType);
      
      expect(result).toBe('HEALTH_1234');
    });

    it('should pad numeric codes to at least 4 digits', () => {
      expect(formatErrorCode('1', JourneyType.CARE)).toBe('CARE_0001');
      expect(formatErrorCode('12', JourneyType.CARE)).toBe('CARE_0012');
      expect(formatErrorCode('123', JourneyType.CARE)).toBe('CARE_0123');
      expect(formatErrorCode('1234', JourneyType.CARE)).toBe('CARE_1234');
    });

    it('should convert non-numeric codes to numeric format', () => {
      const code = 'NOT_FOUND';
      const journeyType = JourneyType.PLAN;

      const result = formatErrorCode(code, journeyType);
      
      // The exact hash value may vary, but the format should be consistent
      expect(result).toMatch(/^PLAN_\d{4}$/);
    });

    it('should use SYS prefix when journey type is not provided', () => {
      const code = '5678';

      const result = formatErrorCode(code);
      
      expect(result).toBe('SYS_5678');
    });

    it('should return code as is if it already has a journey prefix', () => {
      const code = 'HEALTH_1234';
      const journeyType = JourneyType.CARE; // Different journey type

      const result = formatErrorCode(code, journeyType);
      
      // Should not change the prefix
      expect(result).toBe('HEALTH_1234');
    });

    it('should handle all journey types correctly', () => {
      const code = '9999';
      
      expect(formatErrorCode(code, JourneyType.HEALTH)).toBe('HEALTH_9999');
      expect(formatErrorCode(code, JourneyType.CARE)).toBe('CARE_9999');
      expect(formatErrorCode(code, JourneyType.PLAN)).toBe('PLAN_9999');
      expect(formatErrorCode(code, JourneyType.GAMIFICATION)).toBe('GAME_9999');
      expect(formatErrorCode(code, JourneyType.SYSTEM)).toBe('SYS_9999');
    });
  });

  describe('translateErrorMessage', () => {
    beforeEach(() => {
      // Reset NODE_ENV to development for most tests
      process.env.NODE_ENV = 'development';
    });

    it('should translate validation errors by keeping the original message', () => {
      const message = 'Invalid email format';
      const errorType = ErrorType.VALIDATION;

      const result = translateErrorMessage(message, errorType);
      
      expect(result).toBe(message);
    });

    it('should translate business errors by keeping the original message', () => {
      const message = 'Insufficient funds';
      const errorType = ErrorType.BUSINESS;

      const result = translateErrorMessage(message, errorType);
      
      expect(result).toBe(message);
    });

    it('should translate external errors to user-friendly message', () => {
      const message = 'HTTP 500 from external API';
      const errorType = ErrorType.EXTERNAL;
      const journeyType = JourneyType.HEALTH;

      const result = translateErrorMessage(message, errorType, journeyType);
      
      expect(result).toContain("We're having trouble connecting to an external service while accessing your health information");
      expect(result).toContain(`(Details: ${message})`);
    });

    it('should translate technical errors to user-friendly message', () => {
      const message = 'NullPointerException at line 42';
      const errorType = ErrorType.TECHNICAL;
      const journeyType = JourneyType.CARE;

      const result = translateErrorMessage(message, errorType, journeyType);
      
      expect(result).toContain('A system error occurred while managing your care services');
      expect(result).toContain(`(Technical details: ${message})`);
    });

    it('should not include technical details in production environment', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';

      const message = 'Database connection failed';
      const errorType = ErrorType.TECHNICAL;
      const journeyType = JourneyType.PLAN;

      const result = translateErrorMessage(message, errorType, journeyType);
      
      expect(result).toBe('A system error occurred while accessing your plan details. Our team has been notified.');
      expect(result).not.toContain(message);
    });

    it('should handle missing journey type', () => {
      const message = 'Something went wrong';
      const errorType = ErrorType.EXTERNAL;

      const result = translateErrorMessage(message, errorType);
      
      expect(result).toContain("We're having trouble connecting to an external service");
      expect(result).not.toContain('while accessing your health information');
    });

    it('should provide appropriate journey context for each journey type', () => {
      const message = 'Error';
      const errorType = ErrorType.TECHNICAL;
      
      expect(translateErrorMessage(message, errorType, JourneyType.HEALTH))
        .toContain('while accessing your health information');
      
      expect(translateErrorMessage(message, errorType, JourneyType.CARE))
        .toContain('while managing your care services');
      
      expect(translateErrorMessage(message, errorType, JourneyType.PLAN))
        .toContain('while accessing your plan details');
      
      expect(translateErrorMessage(message, errorType, JourneyType.GAMIFICATION))
        .toContain('while processing your achievements');
    });
  });

  describe('formatTemplate', () => {
    it('should substitute variables in template', () => {
      const template = 'Hello, {name}! Your score is {score}.';
      const variables: TemplateVariables = {
        name: 'John',
        score: 42
      };

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('Hello, John! Your score is 42.');
    });

    it('should handle nested properties with dot notation', () => {
      const template = 'User {user.name} has {user.stats.points} points';
      const variables: TemplateVariables = {
        user: {
          name: 'Alice',
          stats: {
            points: 100
          }
        }
      };

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('User Alice has 100 points');
    });

    it('should leave placeholders unchanged when variables are missing', () => {
      const template = 'Hello, {name}! Your rank is {rank}.';
      const variables: TemplateVariables = {
        name: 'Bob'
        // rank is missing
      };

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('Hello, Bob! Your rank is {rank}.');
    });

    it('should handle null and undefined values', () => {
      const template = 'Properties: {prop1}, {prop2}, {prop3}';
      const variables: TemplateVariables = {
        prop1: null,
        prop2: undefined,
        prop3: 0
      };

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('Properties: {prop1}, {prop2}, 0');
    });

    it('should handle empty variables object', () => {
      const template = 'Hello, {name}!';
      const variables: TemplateVariables = {};

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('Hello, {name}!');
    });

    it('should handle template with no variables', () => {
      const template = 'Hello, world!';
      const variables: TemplateVariables = {
        name: 'John'
      };

      const result = formatTemplate(template, variables);
      
      expect(result).toBe('Hello, world!');
    });
  });

  describe('createErrorContext', () => {
    it('should create error context with all provided parameters', () => {
      const journeyType = JourneyType.HEALTH;
      const metadata = { operation: 'getData', status: 'failed' };
      const userId = 'user123';
      const requestId = 'req456';

      const result = createErrorContext(journeyType, metadata, userId, requestId);
      
      expect(result.journeyType).toBe(journeyType);
      expect(result.metadata).toEqual(metadata);
      expect(result.userId).toBe(userId);
      expect(result.requestId).toBe(requestId);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create error context with only journey type', () => {
      const journeyType = JourneyType.CARE;

      const result = createErrorContext(journeyType);
      
      expect(result.journeyType).toBe(journeyType);
      expect(result.metadata).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.requestId).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create error context with no parameters', () => {
      const result = createErrorContext();
      
      expect(result.journeyType).toBeUndefined();
      expect(result.metadata).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.requestId).toBeUndefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('formatErrorResponse', () => {
    beforeEach(() => {
      // Reset NODE_ENV to development for most tests
      process.env.NODE_ENV = 'development';
    });

    it('should format error response with all parameters', () => {
      const message = 'Something went wrong';
      const code = '1234';
      const errorType = ErrorType.TECHNICAL;
      const context: ErrorContext = {
        journeyType: JourneyType.HEALTH,
        userId: 'user123',
        requestId: 'req456'
      };
      const details = { stack: 'Error stack trace', cause: 'Root cause' };

      const result = formatErrorResponse(message, code, errorType, context, details);
      
      expect(result.error.type).toBe(errorType);
      expect(result.error.code).toBe('HEALTH_1234');
      expect(result.error.message).toContain('A system error occurred while accessing your health information');
      expect(result.error.details).toEqual(details);
      expect(result.error.journey).toBe(JourneyType.HEALTH);
    });

    it('should not include details in production environment', () => {
      // Set NODE_ENV to production
      process.env.NODE_ENV = 'production';

      const message = 'Something went wrong';
      const code = '1234';
      const errorType = ErrorType.TECHNICAL;
      const context: ErrorContext = {
        journeyType: JourneyType.CARE
      };
      const details = { stack: 'Error stack trace' };

      const result = formatErrorResponse(message, code, errorType, context, details);
      
      expect(result.error.type).toBe(errorType);
      expect(result.error.code).toBe('CARE_1234');
      expect(result.error.message).toContain('A system error occurred while managing your care services');
      expect(result.error.details).toBeUndefined();
      expect(result.error.journey).toBe(JourneyType.CARE);
    });

    it('should format error code with journey prefix from context', () => {
      const message = 'Resource not found';
      const code = 'NOT_FOUND';
      const errorType = ErrorType.BUSINESS;
      const context: ErrorContext = {
        journeyType: JourneyType.PLAN
      };

      const result = formatErrorResponse(message, code, errorType, context);
      
      // The exact hash value may vary, but the format should be consistent
      expect(result.error.code).toMatch(/^PLAN_\d{4}$/);
    });

    it('should translate error message based on error type and journey', () => {
      const message = 'Database query failed';
      const code = 'DB_ERROR';
      const errorType = ErrorType.TECHNICAL;
      const context: ErrorContext = {
        journeyType: JourneyType.GAMIFICATION
      };

      const result = formatErrorResponse(message, code, errorType, context);
      
      expect(result.error.message).toContain('A system error occurred while processing your achievements');
      expect(result.error.message).toContain(`(Technical details: ${message})`);
    });

    it('should handle missing context', () => {
      const message = 'Invalid input';
      const code = 'VALIDATION';
      const errorType = ErrorType.VALIDATION;

      const result = formatErrorResponse(message, code, errorType);
      
      expect(result.error.type).toBe(errorType);
      expect(result.error.code).toMatch(/^SYS_\d{4}$/);
      expect(result.error.message).toBe(message); // Validation errors keep original message
      expect(result.error.journey).toBeUndefined();
    });

    it('should handle empty details object', () => {
      const message = 'Something went wrong';
      const code = '1234';
      const errorType = ErrorType.TECHNICAL;
      const context: ErrorContext = {
        journeyType: JourneyType.HEALTH
      };
      const details = {};

      const result = formatErrorResponse(message, code, errorType, context, details);
      
      expect(result.error.details).toBeUndefined();
    });
  });
});