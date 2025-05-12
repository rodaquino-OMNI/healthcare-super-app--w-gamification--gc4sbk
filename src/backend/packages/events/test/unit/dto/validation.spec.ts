/**
 * @file validation.spec.ts
 * @description Unit tests for the custom validation utilities and decorators used for event validation.
 * Tests verify that custom validators work correctly for journey-specific fields, complex object validation,
 * conditional validation logic, and more.
 */

import { plainToInstance } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Validate,
  validate,
  validateSync,
  ValidationError
} from 'class-validator';
import { ZodError, z } from 'zod';

import {
  // Custom validator constraints
  IsIsoDurationConstraint,
  IsPhysiologicallyPlausibleConstraint,
  IsValidMedicationDosageConstraint,
  IsValidCurrencyAmountConstraint,
  IsValidAppointmentTimeConstraint,
  IsValidHealthGoalConstraint,
  IsValidBenefitTypeConstraint,
  
  // Custom validation decorators
  IsIsoDuration,
  IsPhysiologicallyPlausible,
  IsValidMedicationDosage,
  IsValidCurrencyAmount,
  IsValidAppointmentTime,
  IsValidHealthGoal,
  IsValidBenefitType,
  ValidateIf,
  ValidateWithZod,
  ValidateForEventTypes,
  ValidateForJourneys,
  
  // Validation utility functions
  validateObject,
  validateObjectSync,
  validateWithZod,
  validateEventOrThrow,
  validateEventOrThrowSync,
  
  // Journey-specific validation functions
  HealthValidation,
  CareValidation,
  PlanValidation,
  
  // Cross-journey validation functions
  validateJourneyEvent
} from '../../../src/dto/validation';

import { ValidationSeverity, ValidationResultFactory } from '../../../src/interfaces/event-validation.interface';
import { EventValidationError, EventProcessingStage } from '../../../src/errors/event-errors';

// Helper function to create a date with a specific hour
function createDateWithHour(hour: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1); // Make it tomorrow
  date.setHours(hour, 0, 0, 0);
  return date;
}

// =============================================================================
// Test Classes with Validation Decorators
// =============================================================================

// Test class for ISO duration validation
class TestIsoDurationClass {
  @IsIsoDuration()
  duration: string;

  constructor(duration: string) {
    this.duration = duration;
  }
}

// Test class for physiologically plausible validation
class TestPhysiologicallyPlausibleClass {
  @IsPhysiologicallyPlausible('heartRate')
  heartRate: number;

  @IsPhysiologicallyPlausible('weight')
  weight: number;

  constructor(heartRate: number, weight: number) {
    this.heartRate = heartRate;
    this.weight = weight;
  }
}

// Test class for medication dosage validation
class TestMedicationDosageClass {
  @IsValidMedicationDosage()
  dosage: any;

  constructor(dosage: any) {
    this.dosage = dosage;
  }
}

// Test class for currency amount validation
class TestCurrencyAmountClass {
  @IsValidCurrencyAmount()
  amount: any;

  constructor(amount: any) {
    this.amount = amount;
  }
}

// Test class for appointment time validation
class TestAppointmentTimeClass {
  @IsValidAppointmentTime(9, 17) // 9 AM to 5 PM
  appointmentTime: Date | string;

  constructor(appointmentTime: Date | string) {
    this.appointmentTime = appointmentTime;
  }
}

// Test class for health goal validation
class TestHealthGoalClass {
  @IsValidHealthGoal()
  goal: any;

  constructor(goal: any) {
    this.goal = goal;
  }
}

// Test class for benefit type validation
class TestBenefitTypeClass {
  @IsValidBenefitType()
  benefit: any;

  constructor(benefit: any) {
    this.benefit = benefit;
  }
}

// Test class for conditional validation
class TestConditionalValidationClass {
  @IsString()
  type: string;

  @ValidateIf(
    (obj, value) => obj.type === 'email',
    IsEmail()
  )
  @ValidateIf(
    (obj, value) => obj.type === 'phone',
    IsString()
  )
  value: string;

  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
  }
}

// Test class for Zod schema validation
class TestZodValidationClass {
  @ValidateWithZod(
    z.object({
      name: z.string().min(3),
      age: z.number().min(18).max(120)
    })
  )
  person: any;

  constructor(person: any) {
    this.person = person;
  }
}

// Test class for event type validation
class TestEventTypeValidationClass {
  @IsString()
  eventType: string;

  @ValidateForEventTypes('eventType', ['health.metric.recorded', 'health.goal.created'])
  @IsNotEmpty()
  healthData: any;

  @ValidateForEventTypes('eventType', ['care.appointment.booked', 'care.medication.taken'])
  @IsNotEmpty()
  careData: any;

  constructor(eventType: string, healthData?: any, careData?: any) {
    this.eventType = eventType;
    this.healthData = healthData;
    this.careData = careData;
  }
}

// Test class for journey validation
class TestJourneyValidationClass {
  @IsString()
  journey: string;

  @ValidateForJourneys('journey', ['health'])
  @IsNotEmpty()
  healthData: any;

  @ValidateForJourneys('journey', ['care'])
  @IsNotEmpty()
  careData: any;

  @ValidateForJourneys('journey', ['plan'])
  @IsNotEmpty()
  planData: any;

  constructor(journey: string, healthData?: any, careData?: any, planData?: any) {
    this.journey = journey;
    this.healthData = healthData;
    this.careData = careData;
    this.planData = planData;
  }
}

// =============================================================================
// Tests for Custom Validator Constraints
// =============================================================================

describe('Custom Validator Constraints', () => {
  // IsIsoDurationConstraint
  describe('IsIsoDurationConstraint', () => {
    const constraint = new IsIsoDurationConstraint();

    it('should validate valid ISO 8601 durations', () => {
      expect(constraint.validate('P1Y2M3DT4H5M6S')).toBe(true); // 1 year, 2 months, 3 days, 4 hours, 5 minutes, 6 seconds
      expect(constraint.validate('PT1H30M')).toBe(true); // 1 hour, 30 minutes
      expect(constraint.validate('P1D')).toBe(true); // 1 day
      expect(constraint.validate('PT1H')).toBe(true); // 1 hour
      expect(constraint.validate('P1W')).toBe(true); // 1 week
    });

    it('should reject invalid ISO 8601 durations', () => {
      expect(constraint.validate('1H30M')).toBe(false); // Missing P/PT
      expect(constraint.validate('PT')).toBe(false); // Missing time values
      expect(constraint.validate('P')).toBe(false); // Missing duration values
      expect(constraint.validate('PT1H30')).toBe(false); // Missing unit for minutes
      expect(constraint.validate('P1YT')).toBe(false); // T with no time values
      expect(constraint.validate(123)).toBe(false); // Not a string
      expect(constraint.validate(null)).toBe(false); // Null
      expect(constraint.validate(undefined)).toBe(false); // Undefined
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty' } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('ISO 8601 duration');
    });
  });

  // IsPhysiologicallyPlausibleConstraint
  describe('IsPhysiologicallyPlausibleConstraint', () => {
    const constraint = new IsPhysiologicallyPlausibleConstraint();

    it('should validate values within physiologically plausible ranges', () => {
      expect(constraint.validate(75, { constraints: ['heartRate'] } as any)).toBe(true); // Normal heart rate
      expect(constraint.validate(80, { constraints: ['bloodPressureDiastolic'] } as any)).toBe(true); // Normal diastolic BP
      expect(constraint.validate(120, { constraints: ['bloodPressureSystolic'] } as any)).toBe(true); // Normal systolic BP
      expect(constraint.validate(70, { constraints: ['weight'] } as any)).toBe(true); // Normal weight in kg
      expect(constraint.validate(37, { constraints: ['temperatureCelsius'] } as any)).toBe(true); // Normal body temp
    });

    it('should reject values outside physiologically plausible ranges', () => {
      expect(constraint.validate(300, { constraints: ['heartRate'] } as any)).toBe(false); // Impossible heart rate
      expect(constraint.validate(20, { constraints: ['bloodPressureDiastolic'] } as any)).toBe(false); // Too low diastolic BP
      expect(constraint.validate(300, { constraints: ['bloodPressureSystolic'] } as any)).toBe(false); // Too high systolic BP
      expect(constraint.validate(1000, { constraints: ['weight'] } as any)).toBe(false); // Impossible weight
      expect(constraint.validate(45, { constraints: ['temperatureCelsius'] } as any)).toBe(false); // Fatal body temp
      expect(constraint.validate('75', { constraints: ['heartRate'] } as any)).toBe(false); // Not a number
    });

    it('should throw an error for unknown metric types', () => {
      expect(() => {
        constraint.validate(75, { constraints: ['unknownMetric'] } as any);
      }).toThrow('Unknown metric type');
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty', constraints: ['heartRate'] } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('physiologically plausible range');
      expect(constraint.defaultMessage(args)).toContain('heartRate');
    });
  });

  // IsValidMedicationDosageConstraint
  describe('IsValidMedicationDosageConstraint', () => {
    const constraint = new IsValidMedicationDosageConstraint();

    it('should validate valid medication dosages', () => {
      expect(constraint.validate({ amount: 500, unit: 'mg' })).toBe(true);
      expect(constraint.validate({ amount: 1, unit: 'tablet' })).toBe(true);
      expect(constraint.validate({ amount: 2.5, unit: 'ml' })).toBe(true);
      expect(constraint.validate({ amount: 10, unit: 'IU' })).toBe(true);
    });

    it('should reject invalid medication dosages', () => {
      expect(constraint.validate({ amount: -5, unit: 'mg' })).toBe(false); // Negative amount
      expect(constraint.validate({ amount: 0, unit: 'tablet' })).toBe(false); // Zero amount
      expect(constraint.validate({ amount: 'two', unit: 'ml' })).toBe(false); // Non-numeric amount
      expect(constraint.validate({ amount: 10, unit: 'invalid' })).toBe(false); // Invalid unit
      expect(constraint.validate({ amount: 10 })).toBe(false); // Missing unit
      expect(constraint.validate({ unit: 'mg' })).toBe(false); // Missing amount
      expect(constraint.validate('500mg')).toBe(false); // Not an object
      expect(constraint.validate(null)).toBe(false); // Null
      expect(constraint.validate(undefined)).toBe(false); // Undefined
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty' } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('valid medication dosage');
    });
  });

  // IsValidCurrencyAmountConstraint
  describe('IsValidCurrencyAmountConstraint', () => {
    const constraint = new IsValidCurrencyAmountConstraint();

    it('should validate valid currency amounts', () => {
      expect(constraint.validate({ amount: 100, currency: 'USD' })).toBe(true);
      expect(constraint.validate({ amount: 99.99, currency: 'EUR' })).toBe(true);
      expect(constraint.validate({ amount: 0, currency: 'BRL' })).toBe(true); // Zero is valid
      expect(constraint.validate({ amount: -50, currency: 'JPY' })).toBe(true); // Negative for refunds
    });

    it('should reject invalid currency amounts', () => {
      expect(constraint.validate({ amount: '100', currency: 'USD' })).toBe(false); // Non-numeric amount
      expect(constraint.validate({ amount: 100, currency: 'INVALID' })).toBe(false); // Invalid currency code
      expect(constraint.validate({ amount: 100 })).toBe(false); // Missing currency
      expect(constraint.validate({ currency: 'USD' })).toBe(false); // Missing amount
      expect(constraint.validate('100 USD')).toBe(false); // Not an object
      expect(constraint.validate(null)).toBe(false); // Null
      expect(constraint.validate(undefined)).toBe(false); // Undefined
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty' } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('valid currency amount');
    });
  });

  // IsValidAppointmentTimeConstraint
  describe('IsValidAppointmentTimeConstraint', () => {
    const constraint = new IsValidAppointmentTimeConstraint();
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10 AM tomorrow

    const twoYearsFromNow = new Date(now);
    twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);

    it('should validate valid appointment times', () => {
      // Valid time within business hours (default 8 AM to 6 PM)
      expect(constraint.validate(tomorrow, { constraints: [8, 18] } as any)).toBe(true);
      
      // Valid time with custom business hours
      const eveningAppointment = new Date(tomorrow);
      eveningAppointment.setHours(19, 0, 0, 0); // 7 PM
      expect(constraint.validate(eveningAppointment, { constraints: [8, 22] } as any)).toBe(true); // 8 AM to 10 PM
      
      // Valid time as ISO string
      expect(constraint.validate(tomorrow.toISOString(), { constraints: [8, 18] } as any)).toBe(true);
    });

    it('should reject invalid appointment times', () => {
      // Past date
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(constraint.validate(yesterday, { constraints: [8, 18] } as any)).toBe(false);
      
      // Too far in the future
      expect(constraint.validate(twoYearsFromNow, { constraints: [8, 18] } as any)).toBe(false);
      
      // Outside business hours - too early
      const earlyMorning = new Date(tomorrow);
      earlyMorning.setHours(6, 0, 0, 0); // 6 AM
      expect(constraint.validate(earlyMorning, { constraints: [8, 18] } as any)).toBe(false);
      
      // Outside business hours - too late
      const lateEvening = new Date(tomorrow);
      lateEvening.setHours(20, 0, 0, 0); // 8 PM
      expect(constraint.validate(lateEvening, { constraints: [8, 18] } as any)).toBe(false);
      
      // Invalid date string
      expect(constraint.validate('not-a-date', { constraints: [8, 18] } as any)).toBe(false);
      
      // Not a date or string
      expect(constraint.validate(123, { constraints: [8, 18] } as any)).toBe(false);
      expect(constraint.validate(null, { constraints: [8, 18] } as any)).toBe(false);
      expect(constraint.validate(undefined, { constraints: [8, 18] } as any)).toBe(false);
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty', constraints: [9, 17] } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('valid future appointment time');
      expect(constraint.defaultMessage(args)).toContain('9:00 - 17:00');
    });
  });

  // IsValidHealthGoalConstraint
  describe('IsValidHealthGoalConstraint', () => {
    const constraint = new IsValidHealthGoalConstraint();

    it('should validate valid health goals', () => {
      expect(constraint.validate({ type: 'steps', target: 10000 })).toBe(true);
      expect(constraint.validate({ type: 'weight', target: 70 })).toBe(true);
      expect(constraint.validate({ type: 'sleep', target: 8 })).toBe(true);
      expect(constraint.validate({ type: 'water', target: 2.5 })).toBe(true);
    });

    it('should reject invalid health goals', () => {
      expect(constraint.validate({ type: 'steps', target: 100000 })).toBe(false); // Target too high
      expect(constraint.validate({ type: 'weight', target: 500 })).toBe(false); // Target too high
      expect(constraint.validate({ type: 'sleep', target: 20 })).toBe(false); // Target too high
      expect(constraint.validate({ type: 'invalid', target: 100 })).toBe(false); // Invalid type
      expect(constraint.validate({ type: 'steps', target: 'many' })).toBe(false); // Non-numeric target
      expect(constraint.validate({ type: 'steps' })).toBe(false); // Missing target
      expect(constraint.validate({ target: 10000 })).toBe(false); // Missing type
      expect(constraint.validate('10000 steps')).toBe(false); // Not an object
      expect(constraint.validate(null)).toBe(false); // Null
      expect(constraint.validate(undefined)).toBe(false); // Undefined
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty' } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('valid health goal');
    });
  });

  // IsValidBenefitTypeConstraint
  describe('IsValidBenefitTypeConstraint', () => {
    const constraint = new IsValidBenefitTypeConstraint();

    it('should validate valid benefit types', () => {
      expect(constraint.validate({ category: 'medical', type: 'consultation' })).toBe(true);
      expect(constraint.validate({ category: 'dental', type: 'cleaning' })).toBe(true);
      expect(constraint.validate({ category: 'vision', type: 'exam' })).toBe(true);
      expect(constraint.validate({ category: 'pharmacy', type: 'prescription' })).toBe(true);
    });

    it('should reject invalid benefit types', () => {
      expect(constraint.validate({ category: 'medical', type: 'invalid' })).toBe(false); // Invalid type for category
      expect(constraint.validate({ category: 'invalid', type: 'consultation' })).toBe(false); // Invalid category
      expect(constraint.validate({ category: 'medical' })).toBe(false); // Missing type
      expect(constraint.validate({ type: 'consultation' })).toBe(false); // Missing category
      expect(constraint.validate('medical consultation')).toBe(false); // Not an object
      expect(constraint.validate(null)).toBe(false); // Null
      expect(constraint.validate(undefined)).toBe(false); // Undefined
    });

    it('should provide a meaningful error message', () => {
      const args = { property: 'testProperty' } as any;
      expect(constraint.defaultMessage(args)).toContain('testProperty');
      expect(constraint.defaultMessage(args)).toContain('valid benefit');
    });
  });
});

// =============================================================================
// Tests for Custom Validation Decorators
// =============================================================================

describe('Custom Validation Decorators', () => {
  // IsIsoDuration
  describe('@IsIsoDuration', () => {
    it('should validate valid ISO 8601 durations', async () => {
      const validInstance = new TestIsoDurationClass('PT1H30M');
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid ISO 8601 durations', async () => {
      const invalidInstance = new TestIsoDurationClass('1H30M'); // Missing PT
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('duration');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('ISO 8601 duration')
      )).toBe(true);
    });
  });

  // IsPhysiologicallyPlausible
  describe('@IsPhysiologicallyPlausible', () => {
    it('should validate values within physiologically plausible ranges', async () => {
      const validInstance = new TestPhysiologicallyPlausibleClass(75, 70);
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject values outside physiologically plausible ranges', async () => {
      const invalidInstance = new TestPhysiologicallyPlausibleClass(300, 1000);
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(2); // Both fields are invalid
      
      // Check heart rate error
      const heartRateError = errors.find(e => e.property === 'heartRate');
      expect(heartRateError).toBeDefined();
      expect(heartRateError?.constraints).toBeDefined();
      expect(Object.values(heartRateError?.constraints || {}).some(msg => 
        msg.includes('physiologically plausible range')
      )).toBe(true);
      
      // Check weight error
      const weightError = errors.find(e => e.property === 'weight');
      expect(weightError).toBeDefined();
      expect(weightError?.constraints).toBeDefined();
      expect(Object.values(weightError?.constraints || {}).some(msg => 
        msg.includes('physiologically plausible range')
      )).toBe(true);
    });
  });

  // IsValidMedicationDosage
  describe('@IsValidMedicationDosage', () => {
    it('should validate valid medication dosages', async () => {
      const validInstance = new TestMedicationDosageClass({ amount: 500, unit: 'mg' });
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid medication dosages', async () => {
      const invalidInstance = new TestMedicationDosageClass({ amount: -5, unit: 'mg' });
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('dosage');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('valid medication dosage')
      )).toBe(true);
    });
  });

  // IsValidCurrencyAmount
  describe('@IsValidCurrencyAmount', () => {
    it('should validate valid currency amounts', async () => {
      const validInstance = new TestCurrencyAmountClass({ amount: 100, currency: 'USD' });
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid currency amounts', async () => {
      const invalidInstance = new TestCurrencyAmountClass({ amount: '100', currency: 'USD' });
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('amount');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('valid currency amount')
      )).toBe(true);
    });
  });

  // IsValidAppointmentTime
  describe('@IsValidAppointmentTime', () => {
    it('should validate valid appointment times', async () => {
      // Create a valid appointment time (10 AM tomorrow)
      const validTime = createDateWithHour(10);
      const validInstance = new TestAppointmentTimeClass(validTime);
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid appointment times', async () => {
      // Create an invalid appointment time (7 AM tomorrow - before business hours)
      const invalidTime = createDateWithHour(7);
      const invalidInstance = new TestAppointmentTimeClass(invalidTime);
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('appointmentTime');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('valid future appointment time')
      )).toBe(true);
    });
  });

  // IsValidHealthGoal
  describe('@IsValidHealthGoal', () => {
    it('should validate valid health goals', async () => {
      const validInstance = new TestHealthGoalClass({ type: 'steps', target: 10000 });
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid health goals', async () => {
      const invalidInstance = new TestHealthGoalClass({ type: 'invalid', target: 100 });
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('goal');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('valid health goal')
      )).toBe(true);
    });
  });

  // IsValidBenefitType
  describe('@IsValidBenefitType', () => {
    it('should validate valid benefit types', async () => {
      const validInstance = new TestBenefitTypeClass({ category: 'medical', type: 'consultation' });
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid benefit types', async () => {
      const invalidInstance = new TestBenefitTypeClass({ category: 'invalid', type: 'consultation' });
      const errors = await validate(invalidInstance);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('benefit');
      expect(errors[0].constraints).toBeDefined();
      expect(Object.values(errors[0].constraints || {}).some(msg => 
        msg.includes('valid benefit')
      )).toBe(true);
    });
  });

  // ValidateIf
  describe('@ValidateIf', () => {
    it('should conditionally apply validation based on other fields', async () => {
      // Valid email for email type
      const validEmailInstance = new TestConditionalValidationClass('email', 'test@example.com');
      const emailErrors = await validate(validEmailInstance);
      expect(emailErrors.length).toBe(0);

      // Invalid email for email type
      const invalidEmailInstance = new TestConditionalValidationClass('email', 'not-an-email');
      const invalidEmailErrors = await validate(invalidEmailInstance);
      expect(invalidEmailErrors.length).toBe(1);
      expect(invalidEmailErrors[0].property).toBe('value');

      // Any string is valid for phone type
      const validPhoneInstance = new TestConditionalValidationClass('phone', '123-456-7890');
      const phoneErrors = await validate(validPhoneInstance);
      expect(phoneErrors.length).toBe(0);

      // For other types, no validation is applied
      const otherTypeInstance = new TestConditionalValidationClass('other', 'any value');
      const otherErrors = await validate(otherTypeInstance);
      expect(otherErrors.length).toBe(0);
    });
  });

  // ValidateWithZod
  describe('@ValidateWithZod', () => {
    it('should validate using Zod schemas', async () => {
      // Valid person object
      const validInstance = new TestZodValidationClass({ name: 'John Doe', age: 30 });
      const errors = await validate(validInstance);
      expect(errors.length).toBe(0);

      // Invalid person object - name too short
      const invalidNameInstance = new TestZodValidationClass({ name: 'Jo', age: 30 });
      const nameErrors = await validate(invalidNameInstance);
      expect(nameErrors.length).toBe(1);
      expect(nameErrors[0].property).toBe('person');

      // Invalid person object - age too low
      const invalidAgeInstance = new TestZodValidationClass({ name: 'John Doe', age: 17 });
      const ageErrors = await validate(invalidAgeInstance);
      expect(ageErrors.length).toBe(1);
      expect(ageErrors[0].property).toBe('person');

      // Invalid person object - missing properties
      const missingPropsInstance = new TestZodValidationClass({});
      const missingErrors = await validate(missingPropsInstance);
      expect(missingErrors.length).toBe(1);
      expect(missingErrors[0].property).toBe('person');
    });
  });

  // ValidateForEventTypes
  describe('@ValidateForEventTypes', () => {
    it('should validate fields based on event type', async () => {
      // Health event type requires healthData
      const healthEvent = new TestEventTypeValidationClass('health.metric.recorded', { value: 75 }, undefined);
      const healthErrors = await validate(healthEvent);
      expect(healthErrors.length).toBe(0);

      // Missing healthData for health event type
      const invalidHealthEvent = new TestEventTypeValidationClass('health.metric.recorded', undefined, undefined);
      const invalidHealthErrors = await validate(invalidHealthEvent);
      expect(invalidHealthErrors.length).toBe(1);
      expect(invalidHealthErrors[0].property).toBe('healthData');

      // Care event type requires careData
      const careEvent = new TestEventTypeValidationClass('care.appointment.booked', undefined, { appointmentId: '123' });
      const careErrors = await validate(careEvent);
      expect(careErrors.length).toBe(0);

      // Missing careData for care event type
      const invalidCareEvent = new TestEventTypeValidationClass('care.appointment.booked', undefined, undefined);
      const invalidCareErrors = await validate(invalidCareEvent);
      expect(invalidCareErrors.length).toBe(1);
      expect(invalidCareErrors[0].property).toBe('careData');

      // Other event types don't require either field
      const otherEvent = new TestEventTypeValidationClass('other.event.type', undefined, undefined);
      const otherErrors = await validate(otherEvent);
      expect(otherErrors.length).toBe(0);
    });
  });

  // ValidateForJourneys
  describe('@ValidateForJourneys', () => {
    it('should validate fields based on journey', async () => {
      // Health journey requires healthData
      const healthJourney = new TestJourneyValidationClass('health', { value: 75 }, undefined, undefined);
      const healthErrors = await validate(healthJourney);
      expect(healthErrors.length).toBe(0);

      // Missing healthData for health journey
      const invalidHealthJourney = new TestJourneyValidationClass('health', undefined, undefined, undefined);
      const invalidHealthErrors = await validate(invalidHealthJourney);
      expect(invalidHealthErrors.length).toBe(1);
      expect(invalidHealthErrors[0].property).toBe('healthData');

      // Care journey requires careData
      const careJourney = new TestJourneyValidationClass('care', undefined, { appointmentId: '123' }, undefined);
      const careErrors = await validate(careJourney);
      expect(careErrors.length).toBe(0);

      // Plan journey requires planData
      const planJourney = new TestJourneyValidationClass('plan', undefined, undefined, { claimId: '123' });
      const planErrors = await validate(planJourney);
      expect(planErrors.length).toBe(0);

      // Other journeys don't require any specific field
      const otherJourney = new TestJourneyValidationClass('other', undefined, undefined, undefined);
      const otherErrors = await validate(otherJourney);
      expect(otherErrors.length).toBe(0);
    });
  });
});

// =============================================================================
// Tests for Validation Utility Functions
// =============================================================================

describe('Validation Utility Functions', () => {
  // validateObject
  describe('validateObject', () => {
    it('should validate objects against class-validator decorated classes', async () => {
      // Valid object
      const validResult = await validateObject(
        { duration: 'PT1H30M' },
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.issues.length).toBe(0);
      expect(validResult.journey).toBe('health');

      // Invalid object
      const invalidResult = await validateObject(
        { duration: '1H30M' }, // Invalid ISO duration
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.issues.length).toBe(1);
      expect(invalidResult.issues[0].field).toBe('duration');
      expect(invalidResult.issues[0].severity).toBe(ValidationSeverity.ERROR);
      expect(invalidResult.journey).toBe('health');
    });

    it('should handle validation errors gracefully', async () => {
      // Simulate an error during validation
      jest.spyOn(validate, 'default').mockImplementationOnce(() => {
        throw new Error('Validation system error');
      });

      const result = await validateObject(
        { duration: 'PT1H30M' },
        TestIsoDurationClass
      );
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].code).toBe('VALIDATION_SYSTEM_ERROR');
      expect(result.issues[0].message).toContain('Validation system error');
    });
  });

  // validateObjectSync
  describe('validateObjectSync', () => {
    it('should synchronously validate objects against class-validator decorated classes', () => {
      // Valid object
      const validResult = validateObjectSync(
        { duration: 'PT1H30M' },
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.issues.length).toBe(0);
      expect(validResult.journey).toBe('health');

      // Invalid object
      const invalidResult = validateObjectSync(
        { duration: '1H30M' }, // Invalid ISO duration
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.issues.length).toBe(1);
      expect(invalidResult.issues[0].field).toBe('duration');
      expect(invalidResult.issues[0].severity).toBe(ValidationSeverity.ERROR);
      expect(invalidResult.journey).toBe('health');
    });

    it('should handle validation errors gracefully', () => {
      // Simulate an error during validation
      jest.spyOn(validateSync, 'default').mockImplementationOnce(() => {
        throw new Error('Validation system error');
      });

      const result = validateObjectSync(
        { duration: 'PT1H30M' },
        TestIsoDurationClass
      );
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].code).toBe('VALIDATION_SYSTEM_ERROR');
      expect(result.issues[0].message).toContain('Validation system error');
    });
  });

  // validateWithZod
  describe('validateWithZod', () => {
    it('should validate objects against Zod schemas', () => {
      // Define a Zod schema
      const personSchema = z.object({
        name: z.string().min(3),
        age: z.number().min(18).max(120)
      });

      // Valid object
      const validResult = validateWithZod(
        { name: 'John Doe', age: 30 },
        personSchema,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.issues.length).toBe(0);
      expect(validResult.journey).toBe('health');

      // Invalid object - name too short
      const invalidNameResult = validateWithZod(
        { name: 'Jo', age: 30 },
        personSchema,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(invalidNameResult.isValid).toBe(false);
      expect(invalidNameResult.issues.length).toBe(1);
      expect(invalidNameResult.issues[0].field).toBe('name');
      expect(invalidNameResult.issues[0].severity).toBe(ValidationSeverity.ERROR);
      expect(invalidNameResult.journey).toBe('health');

      // Invalid object - age too low
      const invalidAgeResult = validateWithZod(
        { name: 'John Doe', age: 17 },
        personSchema,
        { journey: 'health', eventType: 'health.metric.recorded' }
      );
      expect(invalidAgeResult.isValid).toBe(false);
      expect(invalidAgeResult.issues.length).toBe(1);
      expect(invalidAgeResult.issues[0].field).toBe('age');
      expect(invalidAgeResult.journey).toBe('health');
    });

    it('should handle Zod validation errors gracefully', () => {
      // Simulate an error during validation
      jest.spyOn(z.ZodObject.prototype, 'safeParse').mockImplementationOnce(() => {
        throw new Error('Zod validation error');
      });

      const personSchema = z.object({
        name: z.string().min(3),
        age: z.number().min(18).max(120)
      });

      const result = validateWithZod(
        { name: 'John Doe', age: 30 },
        personSchema
      );
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBe(1);
      expect(result.issues[0].code).toBe('VALIDATION_SYSTEM_ERROR');
      expect(result.issues[0].message).toContain('Zod validation error');
    });
  });

  // validateEventOrThrow
  describe('validateEventOrThrow', () => {
    it('should not throw for valid events', async () => {
      await expect(validateEventOrThrow(
        { duration: 'PT1H30M' },
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      )).resolves.not.toThrow();
    });

    it('should throw EventValidationError for invalid events', async () => {
      await expect(validateEventOrThrow(
        { duration: '1H30M' }, // Invalid ISO duration
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      )).rejects.toThrow(EventValidationError);

      try {
        await validateEventOrThrow(
          { duration: '1H30M' },
          TestIsoDurationClass,
          { journey: 'health', eventType: 'health.metric.recorded' }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(EventValidationError);
        expect(error.message).toContain('Event validation failed');
        expect(error.context.eventType).toBe('health.metric.recorded');
        expect(error.context.processingStage).toBe(EventProcessingStage.VALIDATION);
        expect(error.context.details.journey).toBe('health');
        expect(error.context.details.validationIssues.length).toBe(1);
      }
    });
  });

  // validateEventOrThrowSync
  describe('validateEventOrThrowSync', () => {
    it('should not throw for valid events', () => {
      expect(() => validateEventOrThrowSync(
        { duration: 'PT1H30M' },
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      )).not.toThrow();
    });

    it('should throw EventValidationError for invalid events', () => {
      expect(() => validateEventOrThrowSync(
        { duration: '1H30M' }, // Invalid ISO duration
        TestIsoDurationClass,
        { journey: 'health', eventType: 'health.metric.recorded' }
      )).toThrow(EventValidationError);

      try {
        validateEventOrThrowSync(
          { duration: '1H30M' },
          TestIsoDurationClass,
          { journey: 'health', eventType: 'health.metric.recorded' }
        );
      } catch (error) {
        expect(error).toBeInstanceOf(EventValidationError);
        expect(error.message).toContain('Event validation failed');
        expect(error.context.eventType).toBe('health.metric.recorded');
        expect(error.context.processingStage).toBe(EventProcessingStage.VALIDATION);
        expect(error.context.details.journey).toBe('health');
        expect(error.context.details.validationIssues.length).toBe(1);
      }
    });
  });
});

// =============================================================================
// Tests for Journey-Specific Validation Functions
// =============================================================================

describe('Journey-Specific Validation Functions', () => {
  // HealthValidation
  describe('HealthValidation', () => {
    describe('validateHealthMetric', () => {
      it('should validate valid health metric data', () => {
        const validMetric = {
          type: 'heartRate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'device'
        };
        const result = HealthValidation.validateHealthMetric(validMetric);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('health');
      });

      it('should reject invalid health metric data', () => {
        const invalidMetric = {
          type: 'invalidMetric', // Invalid type
          value: 'not a number', // Invalid value
          timestamp: 'not a date' // Invalid timestamp
        };
        const result = HealthValidation.validateHealthMetric(invalidMetric);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('health');
      });
    });

    describe('validateHealthGoal', () => {
      it('should validate valid health goal data', () => {
        const validGoal = {
          type: 'steps',
          target: 10000,
          unit: 'steps',
          startDate: new Date().toISOString(),
          frequency: 'daily'
        };
        const result = HealthValidation.validateHealthGoal(validGoal);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('health');
      });

      it('should reject invalid health goal data', () => {
        const invalidGoal = {
          type: 'invalidGoal', // Invalid type
          target: 'not a number', // Invalid target
          startDate: 'not a date' // Invalid date
        };
        const result = HealthValidation.validateHealthGoal(invalidGoal);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('health');
      });
    });

    describe('validateDeviceConnection', () => {
      it('should validate valid device connection data', () => {
        const validDevice = {
          deviceId: '123',
          deviceType: 'smartwatch',
          manufacturer: 'Apple',
          model: 'Watch Series 7',
          connectionStatus: 'connected',
          lastSyncTimestamp: new Date().toISOString()
        };
        const result = HealthValidation.validateDeviceConnection(validDevice);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('health');
      });

      it('should reject invalid device connection data', () => {
        const invalidDevice = {
          deviceId: '123',
          deviceType: 'invalidType', // Invalid type
          connectionStatus: 'invalidStatus' // Invalid status
        };
        const result = HealthValidation.validateDeviceConnection(invalidDevice);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('health');
      });
    });
  });

  // CareValidation
  describe('CareValidation', () => {
    describe('validateAppointment', () => {
      it('should validate valid appointment data', () => {
        const validAppointment = {
          providerId: '123',
          specialization: 'Cardiology',
          appointmentType: 'in-person',
          dateTime: new Date().toISOString(),
          duration: 30,
          reason: 'Annual checkup',
          status: 'scheduled'
        };
        const result = CareValidation.validateAppointment(validAppointment);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('care');
      });

      it('should reject invalid appointment data', () => {
        const invalidAppointment = {
          providerId: '123',
          appointmentType: 'invalid', // Invalid type
          dateTime: 'not a date', // Invalid date
          status: 'invalidStatus' // Invalid status
        };
        const result = CareValidation.validateAppointment(invalidAppointment);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('care');
      });
    });

    describe('validateMedication', () => {
      it('should validate valid medication data', () => {
        const validMedication = {
          medicationId: '123',
          name: 'Aspirin',
          dosage: {
            amount: 500,
            unit: 'mg'
          },
          frequency: {
            times: 2,
            period: 'day'
          },
          startDate: new Date().toISOString()
        };
        const result = CareValidation.validateMedication(validMedication);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('care');
      });

      it('should reject invalid medication data', () => {
        const invalidMedication = {
          medicationId: '123',
          name: 'Aspirin',
          dosage: {
            amount: 'not a number', // Invalid amount
            unit: 'mg'
          },
          startDate: 'not a date' // Invalid date
        };
        const result = CareValidation.validateMedication(invalidMedication);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('care');
      });
    });

    describe('validateTelemedicineSession', () => {
      it('should validate valid telemedicine session data', () => {
        const validSession = {
          sessionId: '123',
          providerId: '456',
          startTime: new Date().toISOString(),
          status: 'scheduled',
          sessionType: 'video'
        };
        const result = CareValidation.validateTelemedicineSession(validSession);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('care');
      });

      it('should reject invalid telemedicine session data', () => {
        const invalidSession = {
          sessionId: '123',
          providerId: '456',
          startTime: 'not a date', // Invalid date
          status: 'invalidStatus', // Invalid status
          sessionType: 'invalidType' // Invalid type
        };
        const result = CareValidation.validateTelemedicineSession(invalidSession);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('care');
      });
    });
  });

  // PlanValidation
  describe('PlanValidation', () => {
    describe('validateClaim', () => {
      it('should validate valid claim data', () => {
        const validClaim = {
          claimId: '123',
          serviceDate: new Date().toISOString(),
          providerName: 'Dr. Smith',
          serviceType: 'Consultation',
          amount: {
            total: 100,
            covered: 80,
            patientResponsibility: 20,
            currency: 'USD'
          },
          status: 'submitted'
        };
        const result = PlanValidation.validateClaim(validClaim);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('plan');
      });

      it('should reject invalid claim data', () => {
        const invalidClaim = {
          claimId: '123',
          serviceDate: 'not a date', // Invalid date
          amount: {
            total: 'not a number', // Invalid amount
            currency: 'INVALID' // Invalid currency
          },
          status: 'invalidStatus' // Invalid status
        };
        const result = PlanValidation.validateClaim(invalidClaim);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('plan');
      });
    });

    describe('validateBenefit', () => {
      it('should validate valid benefit data', () => {
        const validBenefit = {
          benefitId: '123',
          category: 'medical',
          type: 'consultation',
          description: 'Medical consultation',
          coverage: {
            coinsurance: 20,
            copay: 30,
            currency: 'USD'
          },
          effectiveDate: new Date().toISOString()
        };
        const result = PlanValidation.validateBenefit(validBenefit);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('plan');
      });

      it('should reject invalid benefit data', () => {
        const invalidBenefit = {
          benefitId: '123',
          category: 'invalidCategory', // Invalid category
          type: 'invalidType', // Invalid type
          coverage: {
            coinsurance: 200, // Invalid percentage (over 100)
            currency: 'INVALID' // Invalid currency
          },
          effectiveDate: 'not a date' // Invalid date
        };
        const result = PlanValidation.validateBenefit(invalidBenefit);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('plan');
      });
    });

    describe('validatePlanSelection', () => {
      it('should validate valid plan selection data', () => {
        const validPlanSelection = {
          planId: '123',
          planName: 'Premium Health Plan',
          planType: 'PPO',
          premium: {
            amount: 500,
            frequency: 'monthly',
            currency: 'USD'
          },
          coverage: {
            individual: true,
            family: false
          },
          effectiveDate: new Date().toISOString(),
          selectionDate: new Date().toISOString()
        };
        const result = PlanValidation.validatePlanSelection(validPlanSelection);
        expect(result.isValid).toBe(true);
        expect(result.issues.length).toBe(0);
        expect(result.journey).toBe('plan');
      });

      it('should reject invalid plan selection data', () => {
        const invalidPlanSelection = {
          planId: '123',
          planName: 'Premium Health Plan',
          planType: 'InvalidType', // Invalid plan type
          premium: {
            amount: 'not a number', // Invalid amount
            frequency: 'invalidFrequency', // Invalid frequency
            currency: 'USD'
          },
          effectiveDate: 'not a date', // Invalid date
          selectionDate: 'not a date' // Invalid date
        };
        const result = PlanValidation.validatePlanSelection(invalidPlanSelection);
        expect(result.isValid).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.journey).toBe('plan');
      });
    });
  });
});

// =============================================================================
// Tests for Cross-Journey Validation Functions
// =============================================================================

describe('Cross-Journey Validation Functions', () => {
  describe('validateJourneyEvent', () => {
    it('should validate health journey events', () => {
      // Valid health metric event
      const validHealthMetric = {
        type: 'heartRate',
        value: 75,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        source: 'device'
      };
      const healthMetricResult = validateJourneyEvent(validHealthMetric, 'health', 'health.metric.recorded');
      expect(healthMetricResult.isValid).toBe(true);
      expect(healthMetricResult.journey).toBe('health');

      // Valid health goal event
      const validHealthGoal = {
        type: 'steps',
        target: 10000,
        unit: 'steps',
        startDate: new Date().toISOString(),
        frequency: 'daily'
      };
      const healthGoalResult = validateJourneyEvent(validHealthGoal, 'health', 'health.goal.created');
      expect(healthGoalResult.isValid).toBe(true);
      expect(healthGoalResult.journey).toBe('health');

      // Invalid health event type
      const invalidHealthTypeResult = validateJourneyEvent(validHealthMetric, 'health', 'health.invalid.type');
      expect(invalidHealthTypeResult.isValid).toBe(false);
      expect(invalidHealthTypeResult.issues[0].code).toBe('VALIDATION_INVALID_EVENT_TYPE');
      expect(invalidHealthTypeResult.journey).toBe('health');
    });

    it('should validate care journey events', () => {
      // Valid appointment event
      const validAppointment = {
        providerId: '123',
        specialization: 'Cardiology',
        appointmentType: 'in-person',
        dateTime: new Date().toISOString(),
        duration: 30,
        reason: 'Annual checkup',
        status: 'scheduled'
      };
      const appointmentResult = validateJourneyEvent(validAppointment, 'care', 'care.appointment.booked');
      expect(appointmentResult.isValid).toBe(true);
      expect(appointmentResult.journey).toBe('care');

      // Valid medication event
      const validMedication = {
        medicationId: '123',
        name: 'Aspirin',
        dosage: {
          amount: 500,
          unit: 'mg'
        },
        frequency: {
          times: 2,
          period: 'day'
        },
        startDate: new Date().toISOString()
      };
      const medicationResult = validateJourneyEvent(validMedication, 'care', 'care.medication.added');
      expect(medicationResult.isValid).toBe(true);
      expect(medicationResult.journey).toBe('care');

      // Invalid care event type
      const invalidCareTypeResult = validateJourneyEvent(validAppointment, 'care', 'care.invalid.type');
      expect(invalidCareTypeResult.isValid).toBe(false);
      expect(invalidCareTypeResult.issues[0].code).toBe('VALIDATION_INVALID_EVENT_TYPE');
      expect(invalidCareTypeResult.journey).toBe('care');
    });

    it('should validate plan journey events', () => {
      // Valid claim event
      const validClaim = {
        claimId: '123',
        serviceDate: new Date().toISOString(),
        providerName: 'Dr. Smith',
        serviceType: 'Consultation',
        amount: {
          total: 100,
          covered: 80,
          patientResponsibility: 20,
          currency: 'USD'
        },
        status: 'submitted'
      };
      const claimResult = validateJourneyEvent(validClaim, 'plan', 'plan.claim.submitted');
      expect(claimResult.isValid).toBe(true);
      expect(claimResult.journey).toBe('plan');

      // Valid benefit event
      const validBenefit = {
        benefitId: '123',
        category: 'medical',
        type: 'consultation',
        description: 'Medical consultation',
        coverage: {
          coinsurance: 20,
          copay: 30,
          currency: 'USD'
        },
        effectiveDate: new Date().toISOString()
      };
      const benefitResult = validateJourneyEvent(validBenefit, 'plan', 'plan.benefit.utilized');
      expect(benefitResult.isValid).toBe(true);
      expect(benefitResult.journey).toBe('plan');

      // Invalid plan event type
      const invalidPlanTypeResult = validateJourneyEvent(validClaim, 'plan', 'plan.invalid.type');
      expect(invalidPlanTypeResult.isValid).toBe(false);
      expect(invalidPlanTypeResult.issues[0].code).toBe('VALIDATION_INVALID_EVENT_TYPE');
      expect(invalidPlanTypeResult.journey).toBe('plan');
    });

    it('should reject invalid journeys', () => {
      const invalidJourneyResult = validateJourneyEvent({}, 'invalid', 'event.type');
      expect(invalidJourneyResult.isValid).toBe(false);
      expect(invalidJourneyResult.issues[0].code).toBe('VALIDATION_INVALID_JOURNEY');
      expect(invalidJourneyResult.issues[0].context.journey).toBe('invalid');
    });
  });
});