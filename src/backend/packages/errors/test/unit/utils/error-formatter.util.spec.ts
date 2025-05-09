import { ErrorType } from '../../../src/types';
import {
  formatUserFriendlyMessage,
  formatTemplate,
  formatSafeTemplate,
  formatJourneyTemplate,
  formatErrorCode,
  translateTechnicalError,
  formatClientErrorMessage,
  formatHealthError,
  formatCareError,
  formatPlanError,
  formatGamificationError,
  formatHttpStatusMessage,
  formatValidationError,
  getLocalizedErrorMessage,
  formatDetailedErrorMessage,
  formatApiErrorMessage,
  JourneyType,
  ErrorContext,
  ErrorMessageLanguage,
  JOURNEY_DISPLAY_NAMES
} from '../../../src/utils/format';

describe('Error Formatter Utility', () => {
  // Store original NODE_ENV to restore after tests
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('formatUserFriendlyMessage', () => {
    it('should return the original message when no context is provided', () => {
      const message = 'An error occurred';
      expect(formatUserFriendlyMessage(message)).toBe(message);
    });

    it('should return the original message when context has no journey', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { userId: '123' };
      expect(formatUserFriendlyMessage(message, context)).toBe(message);
    });

    it('should prepend journey name to message when journey is provided', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const expected = `${JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]}: ${message}`;
      expect(formatUserFriendlyMessage(message, context)).toBe(expected);
    });

    it('should use common journey name when unknown journey is provided', () => {
      const message = 'An error occurred';
      // Using 'any' to simulate an invalid journey type
      const context: ErrorContext = { journey: 'unknown' as any };
      const expected = `${JOURNEY_DISPLAY_NAMES[JourneyType.COMMON]}: ${message}`;
      expect(formatUserFriendlyMessage(message, context)).toBe(expected);
    });
  });

  describe('formatTemplate', () => {
    it('should replace variables in template', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'John' };
      expect(formatTemplate(template, variables)).toBe('Hello, John!');
    });

    it('should handle multiple variables', () => {
      const template = 'Hello, {{firstName}} {{lastName}}!';
      const variables = { firstName: 'John', lastName: 'Doe' };
      expect(formatTemplate(template, variables)).toBe('Hello, John Doe!');
    });

    it('should handle nested properties with dot notation', () => {
      const template = 'Hello, {{user.name}}!';
      const variables = { user: { name: 'John' } };
      expect(formatTemplate(template, variables)).toBe('Hello, John!');
    });

    it('should leave placeholders unchanged when variable is not provided', () => {
      const template = 'Hello, {{name}}!';
      const variables = { otherName: 'John' };
      expect(formatTemplate(template, variables)).toBe('Hello, {{name}}!');
    });

    it('should handle non-string variable values', () => {
      const template = 'Count: {{count}}, Active: {{active}}';
      const variables = { count: 42, active: true };
      expect(formatTemplate(template, variables)).toBe('Count: 42, Active: true');
    });
  });

  describe('formatSafeTemplate', () => {
    it('should sanitize HTML in variables when sanitize is true', () => {
      const template = 'Message: {{message}}';
      const variables = { message: '<script>alert("XSS")</script>' };
      const expected = 'Message: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
      expect(formatSafeTemplate(template, variables)).toBe(expected);
    });

    it('should not sanitize HTML when sanitize is false', () => {
      const template = 'Message: {{message}}';
      const variables = { message: '<b>Bold</b>' };
      const expected = 'Message: <b>Bold</b>';
      expect(formatSafeTemplate(template, variables, false)).toBe(expected);
    });

    it('should handle null and undefined values', () => {
      const template = 'Name: {{name}}, Age: {{age}}';
      const variables = { name: null, age: undefined };
      const expected = 'Name: , Age: ';
      expect(formatSafeTemplate(template, variables)).toBe(expected);
    });

    it('should sanitize all HTML special characters', () => {
      const template = 'Special: {{special}}';
      const variables = { special: '< > & " \'' };
      const expected = 'Special: &lt; &gt; &amp; &quot; &#039;';
      expect(formatSafeTemplate(template, variables)).toBe(expected);
    });
  });

  describe('formatJourneyTemplate', () => {
    it('should format template and add journey context', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'John' };
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const expected = `${JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]}: Hello, John!`;
      expect(formatJourneyTemplate(template, variables, context)).toBe(expected);
    });

    it('should format template without journey context when not provided', () => {
      const template = 'Hello, {{name}}!';
      const variables = { name: 'John' };
      expect(formatJourneyTemplate(template, variables)).toBe('Hello, John!');
    });
  });

  describe('formatErrorCode', () => {
    it('should add journey prefix to code', () => {
      expect(formatErrorCode('1001', JourneyType.HEALTH)).toBe('HEALTH_1001');
      expect(formatErrorCode('1002', JourneyType.CARE)).toBe('CARE_1002');
      expect(formatErrorCode('1003', JourneyType.PLAN)).toBe('PLAN_1003');
      expect(formatErrorCode('1004', JourneyType.GAMIFICATION)).toBe('GAMIF_1004');
      expect(formatErrorCode('1005', JourneyType.COMMON)).toBe('APP_1005');
    });

    it('should use APP prefix when no journey is provided', () => {
      expect(formatErrorCode('1001')).toBe('APP_1001');
    });

    it('should not modify code that already has a prefix', () => {
      expect(formatErrorCode('HEALTH_1001', JourneyType.CARE)).toBe('HEALTH_1001');
      expect(formatErrorCode('CARE_1002')).toBe('CARE_1002');
    });
  });

  describe('translateTechnicalError', () => {
    it('should translate technical errors to user-friendly messages in Portuguese by default', () => {
      expect(translateTechnicalError(ErrorType.VALIDATION, 'Invalid input')).toContain('dados fornecidos são inválidos');
      expect(translateTechnicalError(ErrorType.BUSINESS, 'Business rule violation')).toContain('regra de negócio');
      expect(translateTechnicalError(ErrorType.TECHNICAL, 'Server error')).toContain('erro técnico');
      expect(translateTechnicalError(ErrorType.EXTERNAL, 'External service error')).toContain('serviço externo');
    });

    it('should translate technical errors to English when specified', () => {
      const context: ErrorContext = { language: ErrorMessageLanguage.EN };
      expect(translateTechnicalError(ErrorType.VALIDATION, 'Invalid input', context)).toContain('data is invalid');
      expect(translateTechnicalError(ErrorType.BUSINESS, 'Business rule violation', context)).toContain('business rule');
      expect(translateTechnicalError(ErrorType.TECHNICAL, 'Server error', context)).toContain('technical error');
      expect(translateTechnicalError(ErrorType.EXTERNAL, 'External service error', context)).toContain('external service');
    });

    it('should use default message for unknown error types', () => {
      // Using 'any' to simulate an invalid error type
      expect(translateTechnicalError('unknown' as any, 'Unknown error')).toContain('erro inesperado');
      
      const context: ErrorContext = { language: ErrorMessageLanguage.EN };
      expect(translateTechnicalError('unknown' as any, 'Unknown error', context)).toContain('unexpected error');
    });

    it('should add journey context when provided', () => {
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const result = translateTechnicalError(ErrorType.VALIDATION, 'Invalid input', context);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]);
    });
  });

  describe('formatClientErrorMessage', () => {
    beforeEach(() => {
      // Reset NODE_ENV before each test
      delete process.env.NODE_ENV;
    });

    it('should include technical details in development environment', () => {
      process.env.NODE_ENV = 'development';
      const message = 'An error occurred';
      const technicalDetails = 'Database connection failed';
      const expected = 'An error occurred (Database connection failed)';
      expect(formatClientErrorMessage(message, technicalDetails)).toBe(expected);
    });

    it('should not include technical details in production environment', () => {
      process.env.NODE_ENV = 'production';
      const message = 'An error occurred';
      const technicalDetails = 'Database connection failed';
      expect(formatClientErrorMessage(message, technicalDetails)).toBe(message);
    });

    it('should not include technical details when not provided', () => {
      process.env.NODE_ENV = 'development';
      const message = 'An error occurred';
      expect(formatClientErrorMessage(message)).toBe(message);
    });
  });

  describe('Journey-specific error formatters', () => {
    it('should format health journey errors', () => {
      const message = 'Health data not found';
      const userId = 'user123';
      const metadata = { metricId: 'weight' };
      const result = formatHealthError(message, userId, metadata);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]);
      expect(result).toContain(message);
    });

    it('should format care journey errors', () => {
      const message = 'Appointment not available';
      const userId = 'user123';
      const metadata = { appointmentId: 'appt123' };
      const result = formatCareError(message, userId, metadata);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.CARE]);
      expect(result).toContain(message);
    });

    it('should format plan journey errors', () => {
      const message = 'Benefit not eligible';
      const userId = 'user123';
      const metadata = { benefitId: 'ben123' };
      const result = formatPlanError(message, userId, metadata);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.PLAN]);
      expect(result).toContain(message);
    });

    it('should format gamification errors', () => {
      const message = 'Achievement not unlocked';
      const userId = 'user123';
      const metadata = { achievementId: 'ach123' };
      const result = formatGamificationError(message, userId, metadata);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.GAMIFICATION]);
      expect(result).toContain(message);
    });
  });

  describe('formatHttpStatusMessage', () => {
    it('should return formatted message for known HTTP status codes in Portuguese by default', () => {
      expect(formatHttpStatusMessage(400, 'Default message')).toContain('dados inválidos');
      expect(formatHttpStatusMessage(401, 'Default message')).toContain('Autenticação necessária');
      expect(formatHttpStatusMessage(404, 'Default message')).toContain('não foi encontrado');
      expect(formatHttpStatusMessage(500, 'Default message')).toContain('erro interno');
    });

    it('should return formatted message for known HTTP status codes in English when specified', () => {
      const context: ErrorContext = { language: ErrorMessageLanguage.EN };
      expect(formatHttpStatusMessage(400, 'Default message', context)).toContain('invalid or malformed data');
      expect(formatHttpStatusMessage(401, 'Default message', context)).toContain('Authentication is required');
      expect(formatHttpStatusMessage(404, 'Default message', context)).toContain('not found');
      expect(formatHttpStatusMessage(500, 'Default message', context)).toContain('internal server error');
    });

    it('should use default message for unknown HTTP status codes', () => {
      const defaultMessage = 'Unknown error occurred';
      expect(formatHttpStatusMessage(599, defaultMessage)).toBe(defaultMessage);
    });

    it('should add journey context when provided', () => {
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const result = formatHttpStatusMessage(400, 'Default message', context);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]);
    });
  });

  describe('formatValidationError', () => {
    it('should format field name from camelCase', () => {
      const result = formatValidationError('emailAddress', 'is invalid');
      expect(result).toBe('Email Address: is invalid');
    });

    it('should extract the last part of a nested field path', () => {
      const result = formatValidationError('user.profile.phoneNumber', 'is required');
      expect(result).toBe('Phone Number: is required');
    });

    it('should add journey context when provided', () => {
      const result = formatValidationError('emailAddress', 'is invalid', JourneyType.HEALTH);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]);
      expect(result).toContain('Email Address: is invalid');
    });
  });

  describe('getLocalizedErrorMessage', () => {
    it('should return localized error message in Portuguese by default', () => {
      const result = getLocalizedErrorMessage('not_found', { entity: 'usuário', identifier: 'ID', value: '123' });
      expect(result).toContain('O usuário com ID 123 não foi encontrado');
    });

    it('should return localized error message in English when specified', () => {
      const context: ErrorContext = { language: ErrorMessageLanguage.EN };
      const result = getLocalizedErrorMessage('not_found', { entity: 'user', identifier: 'ID', value: '123' }, context);
      expect(result).toContain('The user with ID 123 was not found');
    });

    it('should use message from variables when template key is not found', () => {
      const result = getLocalizedErrorMessage('unknown_key', { message: 'Custom error message' });
      expect(result).toBe('Custom error message');
    });

    it('should use template key as fallback when neither template nor message is available', () => {
      const result = getLocalizedErrorMessage('unknown_key', {});
      expect(result).toBe('unknown_key');
    });

    it('should add journey context when provided', () => {
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const result = getLocalizedErrorMessage('not_found', { entity: 'usuário', identifier: 'ID', value: '123' }, context);
      expect(result).toContain(JOURNEY_DISPLAY_NAMES[JourneyType.HEALTH]);
    });
  });

  describe('formatDetailedErrorMessage', () => {
    it('should return original message when no context is provided', () => {
      const message = 'An error occurred';
      expect(formatDetailedErrorMessage(message)).toBe(message);
    });

    it('should include journey in detailed message when provided', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      expect(formatDetailedErrorMessage(message, context)).toContain('Journey: health');
    });

    it('should include userId in detailed message when provided', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { userId: 'user123' };
      expect(formatDetailedErrorMessage(message, context)).toContain('User: user123');
    });

    it('should include requestId in detailed message when provided', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { requestId: 'req123' };
      expect(formatDetailedErrorMessage(message, context)).toContain('Request: req123');
    });

    it('should include timestamp in detailed message when provided', () => {
      const message = 'An error occurred';
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const context: ErrorContext = { timestamp };
      expect(formatDetailedErrorMessage(message, context)).toContain('Time: 2023-01-01T12:00:00.000Z');
    });

    it('should include metadata in detailed message when provided', () => {
      const message = 'An error occurred';
      const context: ErrorContext = { metadata: { source: 'api', code: 500 } };
      expect(formatDetailedErrorMessage(message, context)).toContain('Metadata: {source: "api", code: 500}');
    });

    it('should combine all context information in detailed message', () => {
      const message = 'An error occurred';
      const timestamp = new Date('2023-01-01T12:00:00Z');
      const context: ErrorContext = {
        journey: JourneyType.HEALTH,
        userId: 'user123',
        requestId: 'req123',
        timestamp,
        metadata: { source: 'api' }
      };
      
      const result = formatDetailedErrorMessage(message, context);
      expect(result).toContain('An error occurred');
      expect(result).toContain('Journey: health');
      expect(result).toContain('User: user123');
      expect(result).toContain('Request: req123');
      expect(result).toContain('Time: 2023-01-01T12:00:00.000Z');
      expect(result).toContain('Metadata: {source: "api"}');
    });
  });

  describe('formatApiErrorMessage', () => {
    it('should format API error message with code', () => {
      const message = 'Resource not found';
      const errorCode = '1001';
      const result = formatApiErrorMessage(message, errorCode);
      expect(result).toBe('[APP_1001] Resource not found');
    });

    it('should format API error message with journey-specific code', () => {
      const message = 'Resource not found';
      const errorCode = '1001';
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const result = formatApiErrorMessage(message, errorCode, context);
      expect(result).toBe('[HEALTH_1001] Minha Saúde: Resource not found');
    });

    it('should not modify error code that already has a prefix', () => {
      const message = 'Resource not found';
      const errorCode = 'CARE_1001';
      const context: ErrorContext = { journey: JourneyType.HEALTH };
      const result = formatApiErrorMessage(message, errorCode, context);
      expect(result).toBe('[CARE_1001] Minha Saúde: Resource not found');
    });
  });
});