import { BaseError } from '../../../src/base';
import { ErrorType, ErrorCategory, JourneyContext } from '../../../src/types';
import { JourneyError } from '../../../src/journey';

describe('Common Journey Error Functionality', () => {
  describe('Base Journey Error Class', () => {
    it('should extend BaseError', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      expect(error).toBeInstanceOf(BaseError);
    });

    it('should set default journey context if not provided', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      expect(error.context).toBeDefined();
      expect(error.context.journey).toBeDefined();
      expect(error.context.journey.type).toBe('unknown');
    });

    it('should accept and store journey context', () => {
      const journeyContext: JourneyContext = {
        journey: {
          type: 'health',
          id: 'journey-123',
          step: 'metrics-recording',
        },
      };

      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
        context: journeyContext,
      });

      expect(error.context).toBeDefined();
      expect(error.context.journey).toEqual(journeyContext.journey);
    });
  });

  describe('Error Classification', () => {
    it('should classify client errors correctly', () => {
      const error = new JourneyError('Invalid input', {
        code: 'JOURNEY_INVALID_INPUT',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      expect(error.isClientError()).toBe(true);
      expect(error.isServerError()).toBe(false);
      expect(error.isExternalError()).toBe(false);
      expect(error.isTransientError()).toBe(false);
    });

    it('should classify server errors correctly', () => {
      const error = new JourneyError('Internal server error', {
        code: 'JOURNEY_INTERNAL_ERROR',
        type: ErrorType.TECHNICAL,
        category: ErrorCategory.SERVER,
      });

      expect(error.isClientError()).toBe(false);
      expect(error.isServerError()).toBe(true);
      expect(error.isExternalError()).toBe(false);
      expect(error.isTransientError()).toBe(false);
    });

    it('should classify external errors correctly', () => {
      const error = new JourneyError('External API failure', {
        code: 'JOURNEY_EXTERNAL_FAILURE',
        type: ErrorType.EXTERNAL,
        category: ErrorCategory.EXTERNAL,
      });

      expect(error.isClientError()).toBe(false);
      expect(error.isServerError()).toBe(false);
      expect(error.isExternalError()).toBe(true);
      expect(error.isTransientError()).toBe(false);
    });

    it('should classify transient errors correctly', () => {
      const error = new JourneyError('Temporary unavailable', {
        code: 'JOURNEY_TEMPORARY_UNAVAILABLE',
        type: ErrorType.TECHNICAL,
        category: ErrorCategory.TRANSIENT,
      });

      expect(error.isClientError()).toBe(false);
      expect(error.isServerError()).toBe(false);
      expect(error.isExternalError()).toBe(false);
      expect(error.isTransientError()).toBe(true);
    });
  });

  describe('Context Enrichment', () => {
    it('should allow enriching context after creation', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      error.enrichContext({
        journey: {
          type: 'health',
          id: 'journey-123',
          step: 'metrics-recording',
        },
        user: {
          id: 'user-456',
          role: 'patient',
        },
      });

      expect(error.context.journey).toBeDefined();
      expect(error.context.journey.type).toBe('health');
      expect(error.context.journey.id).toBe('journey-123');
      expect(error.context.user).toBeDefined();
      expect(error.context.user.id).toBe('user-456');
    });

    it('should merge context when enriching', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
        context: {
          journey: {
            type: 'health',
            id: 'journey-123',
          },
          request: {
            id: 'req-789',
          },
        },
      });

      error.enrichContext({
        journey: {
          step: 'metrics-recording',
        },
        user: {
          id: 'user-456',
        },
      });

      expect(error.context.journey).toBeDefined();
      expect(error.context.journey.type).toBe('health');
      expect(error.context.journey.id).toBe('journey-123');
      expect(error.context.journey.step).toBe('metrics-recording');
      expect(error.context.request).toBeDefined();
      expect(error.context.request.id).toBe('req-789');
      expect(error.context.user).toBeDefined();
      expect(error.context.user.id).toBe('user-456');
    });
  });

  describe('Error Propagation', () => {
    it('should preserve original error in cause chain', () => {
      const originalError = new Error('Original error');
      const journeyError = new JourneyError('Journey wrapper error', {
        code: 'JOURNEY_WRAPPED_ERROR',
        type: ErrorType.TECHNICAL,
        category: ErrorCategory.SERVER,
        cause: originalError,
      });

      expect(journeyError.cause).toBe(originalError);
    });

    it('should capture journey context when wrapping errors', () => {
      const originalError = new Error('Original error');
      const journeyContext: JourneyContext = {
        journey: {
          type: 'care',
          id: 'journey-789',
          step: 'appointment-booking',
        },
      };

      const journeyError = JourneyError.fromError(originalError, {
        code: 'JOURNEY_WRAPPED_ERROR',
        type: ErrorType.TECHNICAL,
        category: ErrorCategory.SERVER,
        context: journeyContext,
      });

      expect(journeyError).toBeInstanceOf(JourneyError);
      expect(journeyError.cause).toBe(originalError);
      expect(journeyError.context.journey).toEqual(journeyContext.journey);
    });

    it('should preserve stack trace when wrapping errors', () => {
      const originalError = new Error('Original error');
      const journeyError = JourneyError.fromError(originalError, {
        code: 'JOURNEY_WRAPPED_ERROR',
        type: ErrorType.TECHNICAL,
        category: ErrorCategory.SERVER,
      });

      expect(journeyError.stack).toContain('Original error');
    });
  });

  describe('Error Serialization', () => {
    it('should serialize to a structured format with journey context', () => {
      const journeyContext: JourneyContext = {
        journey: {
          type: 'plan',
          id: 'journey-456',
          step: 'claim-submission',
        },
      };

      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
        context: journeyContext,
      });

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('message', 'Test journey error');
      expect(serialized).toHaveProperty('code', 'JOURNEY_TEST_ERROR');
      expect(serialized).toHaveProperty('type', ErrorType.VALIDATION);
      expect(serialized).toHaveProperty('category', ErrorCategory.CLIENT);
      expect(serialized).toHaveProperty('context');
      expect(serialized.context).toHaveProperty('journey');
      expect(serialized.context.journey).toEqual(journeyContext.journey);
    });

    it('should include HTTP status code in serialized output', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('statusCode');
      expect(typeof serialized.statusCode).toBe('number');
    });

    it('should include timestamp in serialized output', () => {
      const error = new JourneyError('Test journey error', {
        code: 'JOURNEY_TEST_ERROR',
        type: ErrorType.VALIDATION,
        category: ErrorCategory.CLIENT,
      });

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('timestamp');
      expect(serialized.timestamp).toBeInstanceOf(Date);
    });
  });
});