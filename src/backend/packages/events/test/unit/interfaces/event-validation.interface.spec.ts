import { IEventValidator, ValidationResult, ValidationError } from '../../../src/interfaces/event-validation.interface';

/**
 * Mock implementation of the IEventValidator interface for testing
 */
class MockEventValidator implements IEventValidator {
  /**
   * Validates an event synchronously
   * @param event The event to validate
   * @returns A validation result
   */
  validate(event: any): ValidationResult {
    if (!event) {
      return {
        isValid: false,
        errors: [
          {
            code: 'EVENT_REQUIRED',
            message: 'Event is required',
            path: '',
          },
        ],
      };
    }

    if (!event.type) {
      return {
        isValid: false,
        errors: [
          {
            code: 'TYPE_REQUIRED',
            message: 'Event type is required',
            path: 'type',
          },
        ],
      };
    }

    if (!event.userId) {
      return {
        isValid: false,
        errors: [
          {
            code: 'USER_ID_REQUIRED',
            message: 'User ID is required',
            path: 'userId',
          },
        ],
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validates an event asynchronously
   * @param event The event to validate
   * @returns A promise that resolves to a validation result
   */
  async validateAsync(event: any): Promise<ValidationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.validate(event));
      }, 10);
    });
  }
}

/**
 * Mock implementation of the IEventValidator interface that uses Zod for validation
 */
class MockZodEventValidator implements IEventValidator {
  /**
   * Validates an event synchronously using Zod-like validation
   * @param event The event to validate
   * @returns A validation result
   */
  validate(event: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      // Simulate Zod validation
      if (!event) {
        throw new Error('Event is required');
      }
      
      // Check required fields
      if (!event.type) {
        errors.push({
          code: 'INVALID_TYPE',
          message: 'Required',
          path: 'type',
        });
      } else if (typeof event.type !== 'string') {
        errors.push({
          code: 'INVALID_TYPE',
          message: 'Expected string, received ' + typeof event.type,
          path: 'type',
        });
      }
      
      if (!event.timestamp) {
        errors.push({
          code: 'INVALID_TYPE',
          message: 'Required',
          path: 'timestamp',
        });
      } else if (isNaN(Date.parse(event.timestamp))) {
        errors.push({
          code: 'INVALID_STRING',
          message: 'Invalid date string',
          path: 'timestamp',
        });
      }
      
      if (!event.data) {
        errors.push({
          code: 'INVALID_TYPE',
          message: 'Required',
          path: 'data',
        });
      } else if (typeof event.data !== 'object') {
        errors.push({
          code: 'INVALID_TYPE',
          message: 'Expected object, received ' + typeof event.data,
          path: 'data',
        });
      }
      
      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: error.message,
          path: '',
        }],
      };
    }
  }

  /**
   * Validates an event asynchronously
   * @param event The event to validate
   * @returns A promise that resolves to a validation result
   */
  async validateAsync(event: any): Promise<ValidationResult> {
    return this.validate(event);
  }
}

/**
 * Mock implementation of the IEventValidator interface that performs business rule validation
 */
class MockBusinessRuleValidator implements IEventValidator {
  /**
   * Validates an event against business rules
   * @param event The event to validate
   * @returns A validation result
   */
  validate(event: any): ValidationResult {
    if (!event || !event.type) {
      return {
        isValid: false,
        errors: [{
          code: 'INVALID_EVENT',
          message: 'Event or event type is missing',
          path: event ? 'type' : '',
        }],
      };
    }
    
    const errors: ValidationError[] = [];
    
    // Business rule: health metric events must have a valid value
    if (event.type === 'HEALTH_METRIC_RECORDED' && event.data) {
      if (!event.data.value) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Health metric must have a value',
          path: 'data.value',
        });
      } else if (typeof event.data.value === 'number' && event.data.value <= 0) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Health metric value must be positive',
          path: 'data.value',
        });
      }
      
      if (!event.data.metricType) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Health metric must have a metric type',
          path: 'data.metricType',
        });
      }
    }
    
    // Business rule: appointment events must have a future date
    if (event.type === 'APPOINTMENT_BOOKED' && event.data) {
      if (!event.data.appointmentDate) {
        errors.push({
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Appointment must have a date',
          path: 'data.appointmentDate',
        });
      } else {
        const appointmentDate = new Date(event.data.appointmentDate);
        const now = new Date();
        
        if (appointmentDate <= now) {
          errors.push({
            code: 'BUSINESS_RULE_VIOLATION',
            message: 'Appointment date must be in the future',
            path: 'data.appointmentDate',
          });
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates an event asynchronously
   * @param event The event to validate
   * @returns A promise that resolves to a validation result
   */
  async validateAsync(event: any): Promise<ValidationResult> {
    // Simulate async business rule validation that might involve database lookups
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.validate(event));
      }, 10);
    });
  }
}

/**
 * Mock composite validator that combines multiple validators
 */
class CompositeValidator implements IEventValidator {
  private validators: IEventValidator[];
  
  constructor(validators: IEventValidator[]) {
    this.validators = validators;
  }
  
  /**
   * Validates an event using all registered validators
   * @param event The event to validate
   * @returns A validation result combining all validator results
   */
  validate(event: any): ValidationResult {
    const allErrors: ValidationError[] = [];
    
    for (const validator of this.validators) {
      const result = validator.validate(event);
      
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
  
  /**
   * Validates an event asynchronously using all registered validators
   * @param event The event to validate
   * @returns A promise that resolves to a validation result combining all validator results
   */
  async validateAsync(event: any): Promise<ValidationResult> {
    const results = await Promise.all(
      this.validators.map(validator => validator.validateAsync(event))
    );
    
    const allErrors: ValidationError[] = [];
    
    for (const result of results) {
      if (!result.isValid) {
        allErrors.push(...result.errors);
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }
}

describe('IEventValidator Interface', () => {
  describe('Basic Validator Implementation', () => {
    let validator: IEventValidator;
    
    beforeEach(() => {
      validator = new MockEventValidator();
    });
    
    it('should validate a valid event', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject an event without a type', () => {
      const event = {
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('TYPE_REQUIRED');
      expect(result.errors[0].path).toBe('type');
    });
    
    it('should reject an event without a userId', () => {
      const event = {
        type: 'TEST_EVENT',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('USER_ID_REQUIRED');
      expect(result.errors[0].path).toBe('userId');
    });
    
    it('should reject a null event', () => {
      const result = validator.validate(null);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('EVENT_REQUIRED');
    });
    
    it('should validate asynchronously', async () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = await validator.validateAsync(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject an invalid event asynchronously', async () => {
      const event = {
        userId: '123', // Missing type
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = await validator.validateAsync(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('TYPE_REQUIRED');
    });
  });
  
  describe('Zod-like Validator Implementation', () => {
    let validator: IEventValidator;
    
    beforeEach(() => {
      validator = new MockZodEventValidator();
    });
    
    it('should validate a valid event', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject an event with invalid type format', () => {
      const event = {
        type: 123, // Should be a string
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'type')).toBe(true);
      expect(result.errors.find(e => e.path === 'type')?.message).toContain('Expected string');
    });
    
    it('should reject an event with invalid timestamp', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: 'not-a-date',
        data: { test: 'data' },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'timestamp')).toBe(true);
      expect(result.errors.find(e => e.path === 'timestamp')?.message).toBe('Invalid date string');
    });
    
    it('should reject an event with invalid data type', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: 'not-an-object',
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'data')).toBe(true);
      expect(result.errors.find(e => e.path === 'data')?.message).toContain('Expected object');
    });
  });
  
  describe('Business Rule Validator Implementation', () => {
    let validator: IEventValidator;
    
    beforeEach(() => {
      validator = new MockBusinessRuleValidator();
    });
    
    it('should validate a valid health metric event', () => {
      const event = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
        },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject a health metric event with missing value', () => {
      const event = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          unit: 'bpm',
          // Missing value
        },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.errors[0].path).toBe('data.value');
    });
    
    it('should reject a health metric event with non-positive value', () => {
      const event = {
        type: 'HEALTH_METRIC_RECORDED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          metricType: 'HEART_RATE',
          value: 0, // Should be positive
          unit: 'bpm',
        },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.errors[0].path).toBe('data.value');
      expect(result.errors[0].message).toContain('positive');
    });
    
    it('should validate a valid appointment event with future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const event = {
        type: 'APPOINTMENT_BOOKED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: futureDate.toISOString(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject an appointment event with past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const event = {
        type: 'APPOINTMENT_BOOKED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: pastDate.toISOString(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('BUSINESS_RULE_VIOLATION');
      expect(result.errors[0].path).toBe('data.appointmentDate');
      expect(result.errors[0].message).toContain('future');
    });
    
    it('should validate asynchronously', async () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };
      
      const result = await validator.validateAsync(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
  
  describe('Composite Validator Implementation', () => {
    let schemaValidator: IEventValidator;
    let businessRuleValidator: IEventValidator;
    let compositeValidator: IEventValidator;
    
    beforeEach(() => {
      schemaValidator = new MockZodEventValidator();
      businessRuleValidator = new MockBusinessRuleValidator();
      compositeValidator = new CompositeValidator([
        schemaValidator,
        businessRuleValidator,
      ]);
    });
    
    it('should validate an event that passes all validators', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const event = {
        type: 'APPOINTMENT_BOOKED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: futureDate.toISOString(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = compositeValidator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject an event that fails schema validation', () => {
      const event = {
        type: 123, // Should be a string
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          test: 'data',
        },
      };
      
      const result = compositeValidator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.path === 'type')).toBe(true);
    });
    
    it('should reject an event that fails business rule validation', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const event = {
        type: 'APPOINTMENT_BOOKED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: pastDate.toISOString(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = compositeValidator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.path === 'data.appointmentDate')).toBe(true);
    });
    
    it('should collect errors from all validators', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const event = {
        type: 123, // Schema error: should be a string
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: pastDate.toISOString(), // Business rule error: should be in the future
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = compositeValidator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.path === 'type')).toBe(true);
      expect(result.errors.some(e => e.path === 'data.appointmentDate')).toBe(true);
    });
    
    it('should validate asynchronously', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Tomorrow
      
      const event = {
        type: 'APPOINTMENT_BOOKED',
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: futureDate.toISOString(),
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = await compositeValidator.validateAsync(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should collect errors from all validators asynchronously', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday
      
      const event = {
        type: 123, // Schema error: should be a string
        userId: '123',
        timestamp: new Date().toISOString(),
        data: {
          appointmentDate: pastDate.toISOString(), // Business rule error: should be in the future
          providerId: 'provider-123',
          specialtyId: 'specialty-456',
        },
      };
      
      const result = await compositeValidator.validateAsync(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.some(e => e.path === 'type')).toBe(true);
      expect(result.errors.some(e => e.path === 'data.appointmentDate')).toBe(true);
    });
  });
  
  describe('ValidationResult Structure', () => {
    let validator: IEventValidator;
    
    beforeEach(() => {
      validator = new MockEventValidator();
    });
    
    it('should have isValid property', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
      };
      
      const result = validator.validate(event);
      
      expect(result).toHaveProperty('isValid');
      expect(typeof result.isValid).toBe('boolean');
    });
    
    it('should have errors array property', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
      };
      
      const result = validator.validate(event);
      
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });
    
    it('should have empty errors array when valid', () => {
      const event = {
        type: 'TEST_EVENT',
        userId: '123',
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should have populated errors array when invalid', () => {
      const event = {
        // Missing required fields
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('ValidationError Structure', () => {
    let validator: IEventValidator;
    
    beforeEach(() => {
      validator = new MockZodEventValidator();
    });
    
    it('should have code property', () => {
      const event = {
        // Missing required fields
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toHaveProperty('code');
      expect(typeof result.errors[0].code).toBe('string');
    });
    
    it('should have message property', () => {
      const event = {
        // Missing required fields
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toHaveProperty('message');
      expect(typeof result.errors[0].message).toBe('string');
    });
    
    it('should have path property', () => {
      const event = {
        // Missing required fields
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toHaveProperty('path');
      expect(typeof result.errors[0].path).toBe('string');
    });
    
    it('should format error messages properly', () => {
      const event = {
        type: 123, // Should be a string
      };
      
      const result = validator.validate(event);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.find(e => e.path === 'type')?.message).toContain('Expected string');
    });
  });
});