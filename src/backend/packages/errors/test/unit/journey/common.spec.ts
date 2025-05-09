import { BaseError, ErrorType, JourneyContext } from '../../../src/base';

/**
 * Mock JourneyError class for testing purposes
 * This represents a base class that all journey-specific errors would extend
 */
class JourneyError extends BaseError {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    journeyContext: JourneyContext,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, type, code, { journey: journeyContext }, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, JourneyError.prototype);
  }

  /**
   * Gets the journey context from the error
   */
  getJourneyContext(): JourneyContext | undefined {
    return this.context.journey;
  }

  /**
   * Creates a new JourneyError with a different journey context
   */
  withJourneyContext(journeyContext: JourneyContext): JourneyError {
    return new JourneyError(
      this.message,
      this.type,
      this.code,
      journeyContext,
      this.details,
      this.suggestion,
      this.cause
    );
  }

  /**
   * Adds journey-specific metadata to the error
   */
  withJourneyMetadata(metadata: Record<string, any>): JourneyError {
    return new JourneyError(
      this.message,
      this.type,
      this.code,
      this.context.journey as JourneyContext,
      { ...this.details, journeyMetadata: { ...metadata } },
      this.suggestion,
      this.cause
    );
  }

  /**
   * Determines if the error is related to a specific journey
   */
  isJourneyError(journeyContext: JourneyContext): boolean {
    return this.context.journey === journeyContext;
  }

  /**
   * Factory method to create a JourneyError from any error
   */
  static fromError(
    error: unknown,
    journeyContext: JourneyContext,
    defaultType: ErrorType = ErrorType.TECHNICAL,
    defaultCode: string = 'UNKNOWN_ERROR'
  ): JourneyError {
    if (error instanceof JourneyError) {
      return error.withJourneyContext(journeyContext);
    }

    if (error instanceof BaseError) {
      return new JourneyError(
        error.message,
        error.type,
        error.code,
        journeyContext,
        error.details,
        error.suggestion,
        error.cause
      );
    }

    if (error instanceof Error) {
      return new JourneyError(
        error.message,
        defaultType,
        defaultCode,
        journeyContext,
        undefined,
        undefined,
        error
      );
    }

    const errorMessage = typeof error === 'string' 
      ? error 
      : `Unknown error: ${JSON.stringify(error)}`;
    
    return new JourneyError(
      errorMessage,
      defaultType,
      defaultCode,
      journeyContext
    );
  }
}

/**
 * Mock journey-specific error classes for testing
 */
class HealthJourneyError extends JourneyError {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, type, code, JourneyContext.HEALTH, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, HealthJourneyError.prototype);
  }
}

class CareJourneyError extends JourneyError {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, type, code, JourneyContext.CARE, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, CareJourneyError.prototype);
  }
}

class PlanJourneyError extends JourneyError {
  constructor(
    message: string,
    type: ErrorType,
    code: string,
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, type, code, JourneyContext.PLAN, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, PlanJourneyError.prototype);
  }
}

/**
 * Mock domain-specific error classes for testing
 */
class HealthMetricError extends HealthJourneyError {
  constructor(
    message: string,
    code: string = 'HEALTH_METRIC_ERROR',
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, HealthMetricError.prototype);
  }
}

class AppointmentError extends CareJourneyError {
  constructor(
    message: string,
    code: string = 'CARE_APPOINTMENT_ERROR',
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, AppointmentError.prototype);
  }
}

class ClaimError extends PlanJourneyError {
  constructor(
    message: string,
    code: string = 'PLAN_CLAIM_ERROR',
    details?: any,
    suggestion?: string,
    cause?: Error
  ) {
    super(message, ErrorType.BUSINESS, code, details, suggestion, cause);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ClaimError.prototype);
  }
}

describe('Journey Error Common Functionality', () => {
  describe('Base Journey Error Class Inheritance', () => {
    it('should create a JourneyError with the correct journey context', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH
      );

      expect(error).toBeInstanceOf(BaseError);
      expect(error).toBeInstanceOf(JourneyError);
      expect(error.getJourneyContext()).toBe(JourneyContext.HEALTH);
      expect(error.context.journey).toBe(JourneyContext.HEALTH);
    });

    it('should create journey-specific errors with the correct journey context', () => {
      const healthError = new HealthJourneyError(
        'Health error',
        ErrorType.BUSINESS,
        'HEALTH_ERROR'
      );
      const careError = new CareJourneyError(
        'Care error',
        ErrorType.BUSINESS,
        'CARE_ERROR'
      );
      const planError = new PlanJourneyError(
        'Plan error',
        ErrorType.BUSINESS,
        'PLAN_ERROR'
      );

      expect(healthError).toBeInstanceOf(JourneyError);
      expect(healthError.getJourneyContext()).toBe(JourneyContext.HEALTH);

      expect(careError).toBeInstanceOf(JourneyError);
      expect(careError.getJourneyContext()).toBe(JourneyContext.CARE);

      expect(planError).toBeInstanceOf(JourneyError);
      expect(planError.getJourneyContext()).toBe(JourneyContext.PLAN);
    });

    it('should create domain-specific errors with the correct journey context and error type', () => {
      const metricError = new HealthMetricError('Invalid heart rate value');
      const appointmentError = new AppointmentError('Appointment not found');
      const claimError = new ClaimError('Claim already processed');

      expect(metricError).toBeInstanceOf(HealthJourneyError);
      expect(metricError.getJourneyContext()).toBe(JourneyContext.HEALTH);
      expect(metricError.type).toBe(ErrorType.BUSINESS);
      expect(metricError.code).toBe('HEALTH_METRIC_ERROR');

      expect(appointmentError).toBeInstanceOf(CareJourneyError);
      expect(appointmentError.getJourneyContext()).toBe(JourneyContext.CARE);
      expect(appointmentError.type).toBe(ErrorType.BUSINESS);
      expect(appointmentError.code).toBe('CARE_APPOINTMENT_ERROR');

      expect(claimError).toBeInstanceOf(PlanJourneyError);
      expect(claimError.getJourneyContext()).toBe(JourneyContext.PLAN);
      expect(claimError.type).toBe(ErrorType.BUSINESS);
      expect(claimError.code).toBe('PLAN_CLAIM_ERROR');
    });
  });

  describe('Error Classification Functionality', () => {
    it('should classify errors by journey context', () => {
      const healthError = new HealthJourneyError(
        'Health error',
        ErrorType.BUSINESS,
        'HEALTH_ERROR'
      );
      const careError = new CareJourneyError(
        'Care error',
        ErrorType.BUSINESS,
        'CARE_ERROR'
      );

      expect(healthError.isJourneyError(JourneyContext.HEALTH)).toBe(true);
      expect(healthError.isJourneyError(JourneyContext.CARE)).toBe(false);

      expect(careError.isJourneyError(JourneyContext.CARE)).toBe(true);
      expect(careError.isJourneyError(JourneyContext.HEALTH)).toBe(false);
    });

    it('should maintain error type classification from BaseError', () => {
      const validationError = new JourneyError(
        'Validation error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        JourneyContext.HEALTH
      );
      const businessError = new JourneyError(
        'Business error',
        ErrorType.BUSINESS,
        'BUSINESS_ERROR',
        JourneyContext.CARE
      );
      const technicalError = new JourneyError(
        'Technical error',
        ErrorType.TECHNICAL,
        'TECHNICAL_ERROR',
        JourneyContext.PLAN
      );

      expect(validationError.isClientError()).toBe(true);
      expect(validationError.isServerError()).toBe(false);
      expect(validationError.getHttpStatusCode()).toBe(400); // BAD_REQUEST

      expect(businessError.isClientError()).toBe(true);
      expect(businessError.isServerError()).toBe(false);
      expect(businessError.getHttpStatusCode()).toBe(422); // UNPROCESSABLE_ENTITY

      expect(technicalError.isClientError()).toBe(false);
      expect(technicalError.isServerError()).toBe(true);
      expect(technicalError.getHttpStatusCode()).toBe(500); // INTERNAL_SERVER_ERROR
    });

    it('should correctly identify retryable errors', () => {
      const timeoutError = new JourneyError(
        'Timeout error',
        ErrorType.TIMEOUT,
        'TIMEOUT_ERROR',
        JourneyContext.HEALTH
      );
      const externalError = new JourneyError(
        'External error',
        ErrorType.EXTERNAL,
        'EXTERNAL_ERROR',
        JourneyContext.CARE
      );
      const validationError = new JourneyError(
        'Validation error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        JourneyContext.PLAN
      );

      expect(timeoutError.isRetryable()).toBe(true);
      expect(externalError.isRetryable()).toBe(true);
      expect(validationError.isRetryable()).toBe(false);
    });
  });

  describe('Context Enrichment', () => {
    it('should allow changing the journey context', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH
      );

      const updatedError = error.withJourneyContext(JourneyContext.CARE);

      expect(error.getJourneyContext()).toBe(JourneyContext.HEALTH);
      expect(updatedError.getJourneyContext()).toBe(JourneyContext.CARE);
      expect(updatedError.message).toBe(error.message);
      expect(updatedError.type).toBe(error.type);
      expect(updatedError.code).toBe(error.code);
    });

    it('should allow adding journey-specific metadata', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH
      );

      const metadata = { userId: '123', metricId: '456', value: 120 };
      const updatedError = error.withJourneyMetadata(metadata);

      expect(updatedError.details).toHaveProperty('journeyMetadata');
      expect(updatedError.details.journeyMetadata).toEqual(metadata);
    });

    it('should preserve existing context when adding journey metadata', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH,
        { existingDetail: 'value' }
      );

      const metadata = { userId: '123', metricId: '456' };
      const updatedError = error.withJourneyMetadata(metadata);

      expect(updatedError.details).toHaveProperty('existingDetail');
      expect(updatedError.details.existingDetail).toBe('value');
      expect(updatedError.details).toHaveProperty('journeyMetadata');
      expect(updatedError.details.journeyMetadata).toEqual(metadata);
    });

    it('should support chaining context enrichment methods', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH
      );

      const updatedError = error
        .withJourneyMetadata({ metricId: '456' })
        .withContext({ userId: '123', requestId: 'req-789' })
        .withSuggestion('Check the metric value and try again');

      expect(updatedError.details).toHaveProperty('journeyMetadata');
      expect(updatedError.details.journeyMetadata).toEqual({ metricId: '456' });
      expect(updatedError.context).toHaveProperty('userId', '123');
      expect(updatedError.context).toHaveProperty('requestId', 'req-789');
      expect(updatedError.suggestion).toBe('Check the metric value and try again');
    });
  });

  describe('Error Propagation and Capture', () => {
    it('should create a journey error from a standard Error', () => {
      const originalError = new Error('Standard error');
      const journeyError = JourneyError.fromError(
        originalError,
        JourneyContext.HEALTH
      );

      expect(journeyError).toBeInstanceOf(JourneyError);
      expect(journeyError.message).toBe('Standard error');
      expect(journeyError.getJourneyContext()).toBe(JourneyContext.HEALTH);
      expect(journeyError.type).toBe(ErrorType.TECHNICAL);
      expect(journeyError.cause).toBe(originalError);
    });

    it('should create a journey error from a BaseError', () => {
      const originalError = new BaseError(
        'Base error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        { requestId: 'req-123' }
      );
      const journeyError = JourneyError.fromError(
        originalError,
        JourneyContext.CARE
      );

      expect(journeyError).toBeInstanceOf(JourneyError);
      expect(journeyError.message).toBe('Base error');
      expect(journeyError.getJourneyContext()).toBe(JourneyContext.CARE);
      expect(journeyError.type).toBe(ErrorType.VALIDATION);
      expect(journeyError.code).toBe('VALIDATION_ERROR');
      expect(journeyError.context).toHaveProperty('requestId', 'req-123');
    });

    it('should update the journey context when creating from another JourneyError', () => {
      const originalError = new JourneyError(
        'Journey error',
        ErrorType.BUSINESS,
        'BUSINESS_ERROR',
        JourneyContext.HEALTH,
        { metricId: '456' }
      );
      const journeyError = JourneyError.fromError(
        originalError,
        JourneyContext.CARE
      );

      expect(journeyError).toBeInstanceOf(JourneyError);
      expect(journeyError.message).toBe('Journey error');
      expect(journeyError.getJourneyContext()).toBe(JourneyContext.CARE);
      expect(journeyError.type).toBe(ErrorType.BUSINESS);
      expect(journeyError.code).toBe('BUSINESS_ERROR');
      expect(journeyError.details).toEqual({ metricId: '456' });
    });

    it('should handle non-Error objects and primitives', () => {
      const stringError = JourneyError.fromError(
        'String error message',
        JourneyContext.PLAN
      );
      const objectError = JourneyError.fromError(
        { message: 'Object error', code: 500 },
        JourneyContext.HEALTH
      );
      const nullError = JourneyError.fromError(
        null,
        JourneyContext.CARE
      );

      expect(stringError).toBeInstanceOf(JourneyError);
      expect(stringError.message).toBe('String error message');
      expect(stringError.getJourneyContext()).toBe(JourneyContext.PLAN);

      expect(objectError).toBeInstanceOf(JourneyError);
      expect(objectError.message).toContain('Unknown error:');
      expect(objectError.message).toContain('Object error');
      expect(objectError.getJourneyContext()).toBe(JourneyContext.HEALTH);

      expect(nullError).toBeInstanceOf(JourneyError);
      expect(nullError.message).toContain('Unknown error:');
      expect(nullError.getJourneyContext()).toBe(JourneyContext.CARE);
    });

    it('should support custom error codes and types when creating from other errors', () => {
      const originalError = new Error('Standard error');
      const journeyError = JourneyError.fromError(
        originalError,
        JourneyContext.HEALTH,
        ErrorType.EXTERNAL,
        'CUSTOM_ERROR_CODE'
      );

      expect(journeyError).toBeInstanceOf(JourneyError);
      expect(journeyError.message).toBe('Standard error');
      expect(journeyError.getJourneyContext()).toBe(JourneyContext.HEALTH);
      expect(journeyError.type).toBe(ErrorType.EXTERNAL);
      expect(journeyError.code).toBe('CUSTOM_ERROR_CODE');
    });
  });

  describe('Serialization and HTTP Integration', () => {
    it('should serialize journey errors with journey context', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH,
        { metricId: '456' }
      );

      const serialized = error.toJSON();

      expect(serialized).toHaveProperty('error');
      expect(serialized.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(serialized.error).toHaveProperty('code', 'TEST_ERROR');
      expect(serialized.error).toHaveProperty('message', 'Test error');
      expect(serialized.error).toHaveProperty('journey', JourneyContext.HEALTH);
      expect(serialized.error).toHaveProperty('details');
      expect(serialized.error.details).toEqual({ metricId: '456' });
    });

    it('should convert journey errors to HTTP exceptions with correct status codes', () => {
      const validationError = new JourneyError(
        'Validation error',
        ErrorType.VALIDATION,
        'VALIDATION_ERROR',
        JourneyContext.HEALTH
      );
      const businessError = new JourneyError(
        'Business error',
        ErrorType.BUSINESS,
        'BUSINESS_ERROR',
        JourneyContext.CARE
      );
      const technicalError = new JourneyError(
        'Technical error',
        ErrorType.TECHNICAL,
        'TECHNICAL_ERROR',
        JourneyContext.PLAN
      );

      const validationHttpException = validationError.toHttpException();
      const businessHttpException = businessError.toHttpException();
      const technicalHttpException = technicalError.toHttpException();

      expect(validationHttpException.getStatus()).toBe(400); // BAD_REQUEST
      expect(businessHttpException.getStatus()).toBe(422); // UNPROCESSABLE_ENTITY
      expect(technicalHttpException.getStatus()).toBe(500); // INTERNAL_SERVER_ERROR

      // Check that the response body contains the serialized error
      expect(validationHttpException.getResponse()).toEqual(validationError.toJSON());
      expect(businessHttpException.getResponse()).toEqual(businessError.toJSON());
      expect(technicalHttpException.getResponse()).toEqual(technicalError.toJSON());
    });

    it('should create log entries with journey context', () => {
      const error = new JourneyError(
        'Test error',
        ErrorType.BUSINESS,
        'TEST_ERROR',
        JourneyContext.HEALTH,
        { metricId: '456' }
      );

      const logEntry = error.toLogEntry();

      expect(logEntry).toHaveProperty('error');
      expect(logEntry.error).toHaveProperty('name', 'JourneyError');
      expect(logEntry.error).toHaveProperty('type', ErrorType.BUSINESS);
      expect(logEntry.error).toHaveProperty('code', 'TEST_ERROR');
      expect(logEntry.error).toHaveProperty('message', 'Test error');
      expect(logEntry.error).toHaveProperty('details');
      expect(logEntry.error.details).toEqual({ metricId: '456' });
      expect(logEntry).toHaveProperty('context');
      expect(logEntry.context).toHaveProperty('journey', JourneyContext.HEALTH);
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry).toHaveProperty('httpStatus', 422); // UNPROCESSABLE_ENTITY
    });
  });
});