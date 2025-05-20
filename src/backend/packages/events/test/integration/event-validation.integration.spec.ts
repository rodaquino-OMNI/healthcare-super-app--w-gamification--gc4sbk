import { Test, TestingModule } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoggerService } from '@austa/logging';
import { createMock } from '@golevelup/ts-jest';

// Import event DTOs and validation utilities
import {
  HealthMetricRecordedEventDto,
  HealthGoalAchievedEventDto,
  DeviceSynchronizedEventDto,
  HealthInsightGeneratedEventDto,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType
} from '../../src/dto/health-event.dto';

import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { EventMetadataDto, createEventMetadata } from '../../src/dto/event-metadata.dto';
import { VersionedEventDto, createVersionedEvent } from '../../src/dto/version.dto';
import { ERROR_CODES, ERROR_MESSAGES } from '../../src/constants/errors.constants';
import {
  formatValidationErrors,
  validateObject,
  isUUID,
  isISODate,
  isValidJourney,
  isValidEventType,
  ValidationError
} from '../../src/dto/validation';

// Import test fixtures
import { healthMetricEvents, healthGoalEvents, deviceSyncEvents, healthInsightEvents } from '../fixtures/health-events';
import { careEvents } from '../fixtures/care-events';
import { planEventFixtures } from '../fixtures/plan-events';

/**
 * Integration tests for event schema validation across different journey types.
 * 
 * These tests verify that events are properly validated against their schemas,
 * ensuring type safety and data integrity throughout the event processing pipeline.
 * It tests both valid and invalid event payloads to ensure proper validation behavior.
 */
describe('Event Validation Integration', () => {
  let loggerService: LoggerService;
  
  beforeEach(() => {
    loggerService = createMock<LoggerService>();
    
    // Spy on logger methods
    jest.spyOn(loggerService, 'error');
    jest.spyOn(loggerService, 'warn');
    jest.spyOn(loggerService, 'debug');
    jest.spyOn(loggerService, 'log');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Tests for common validation utilities
   */
  describe('Validation Utilities', () => {
    it('should correctly validate UUIDs', () => {
      // Valid UUIDs
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      
      // Invalid UUIDs
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('123456789')).toBe(false);
      expect(isUUID('')).toBe(false);
      expect(isUUID(null)).toBe(false);
      expect(isUUID(undefined)).toBe(false);
      expect(isUUID(123)).toBe(false);
    });
    
    it('should correctly validate ISO date strings', () => {
      // Valid ISO dates
      expect(isISODate('2023-01-01T12:00:00.000Z')).toBe(true);
      expect(isISODate(new Date().toISOString())).toBe(true);
      
      // Invalid ISO dates
      expect(isISODate('2023-01-01')).toBe(false); // Missing time component
      expect(isISODate('01/01/2023')).toBe(false); // Wrong format
      expect(isISODate('')).toBe(false);
      expect(isISODate(null)).toBe(false);
      expect(isISODate(undefined)).toBe(false);
      expect(isISODate(123)).toBe(false);
    });
    
    it('should correctly validate journey names', () => {
      // Valid journey names
      expect(isValidJourney('health')).toBe(true);
      expect(isValidJourney('care')).toBe(true);
      expect(isValidJourney('plan')).toBe(true);
      expect(isValidJourney('user')).toBe(true);
      expect(isValidJourney('gamification')).toBe(true);
      
      // Invalid journey names
      expect(isValidJourney('invalid')).toBe(false);
      expect(isValidJourney('')).toBe(false);
      expect(isValidJourney(null)).toBe(false);
      expect(isValidJourney(undefined)).toBe(false);
      expect(isValidJourney(123)).toBe(false);
    });
    
    it('should correctly validate event types for specific journeys', () => {
      // Valid health event types
      expect(isValidEventType('HEALTH_METRIC_RECORDED', 'health')).toBe(true);
      expect(isValidEventType('HEALTH_GOAL_ACHIEVED', 'health')).toBe(true);
      
      // Valid care event types
      expect(isValidEventType('APPOINTMENT_BOOKED', 'care')).toBe(true);
      expect(isValidEventType('MEDICATION_ADHERENCE', 'care')).toBe(true);
      
      // Valid plan event types
      expect(isValidEventType('CLAIM_SUBMITTED', 'plan')).toBe(true);
      expect(isValidEventType('BENEFIT_UTILIZED', 'plan')).toBe(true);
      
      // Invalid combinations
      expect(isValidEventType('HEALTH_METRIC_RECORDED', 'care')).toBe(false);
      expect(isValidEventType('APPOINTMENT_BOOKED', 'health')).toBe(false);
      expect(isValidEventType('INVALID_TYPE', 'health')).toBe(false);
      expect(isValidEventType('', 'health')).toBe(false);
      expect(isValidEventType(null, 'health')).toBe(false);
      expect(isValidEventType('HEALTH_METRIC_RECORDED', '')).toBe(false);
      expect(isValidEventType('HEALTH_METRIC_RECORDED', null)).toBe(false);
    });
    
    it('should format validation errors correctly', () => {
      // Create a mock validation error
      const mockErrors = [
        {
          property: 'type',
          constraints: {
            isNotEmpty: 'type should not be empty',
            isString: 'type must be a string'
          }
        },
        {
          property: 'data',
          constraints: {
            isObject: 'data must be an object'
          },
          children: [
            {
              property: 'metricType',
              constraints: {
                isEnum: 'metricType must be a valid enum value'
              }
            }
          ]
        }
      ];
      
      // Format the errors
      const formattedErrors = formatValidationErrors(mockErrors);
      
      // Verify the format
      expect(formattedErrors).toHaveLength(2);
      expect(formattedErrors[0]).toEqual({
        property: 'type',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
        constraints: {
          isNotEmpty: 'type should not be empty',
          isString: 'type must be a string'
        }
      });
      
      expect(formattedErrors[1]).toEqual({
        property: 'data',
        errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
        constraints: {
          isObject: 'data must be an object'
        },
        children: [
          {
            property: 'metricType',
            errorCode: ERROR_CODES.SCHEMA_VALIDATION_FAILED,
            message: ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED],
            constraints: {
              isEnum: 'metricType must be a valid enum value'
            }
          }
        ]
      });
    });
    
    it('should validate objects using validateObject utility', async () => {
      // Create a valid event
      const validEvent = healthMetricEvents.heartRateMetricEvent;
      
      // Create an invalid event (missing required field)
      const invalidEvent = { ...validEvent, type: undefined };
      
      // Convert to class instances
      const validEventDto = plainToInstance(HealthMetricRecordedEventDto, validEvent);
      const invalidEventDto = plainToInstance(HealthMetricRecordedEventDto, invalidEvent);
      
      // Validate using the utility
      const validResult = await validateObject(validEventDto);
      const invalidResult = await validateObject(invalidEventDto);
      
      // Verify results
      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult).toBeInstanceOf(Array);
      expect(invalidResult.length).toBeGreaterThan(0);
      expect(invalidResult[0]).toHaveProperty('property');
      expect(invalidResult[0]).toHaveProperty('errorCode');
      expect(invalidResult[0]).toHaveProperty('message');
    });
  });

  /**
   * Tests for event metadata validation
   */
  describe('Event Metadata Validation', () => {
    it('should validate valid event metadata', async () => {
      // Create valid metadata
      const metadata = createEventMetadata('test-service', {
        correlationId: '550e8400-e29b-41d4-a716-446655440000',
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date()
      });
      
      // Convert to class instance
      const metadataDto = plainToInstance(EventMetadataDto, metadata);
      
      // Validate
      const errors = await validate(metadataDto);
      
      // Verify no errors
      expect(errors).toHaveLength(0);
    });
    
    it('should reject invalid event metadata', async () => {
      // Create invalid metadata (invalid UUID format)
      const metadata = createEventMetadata('test-service', {
        correlationId: 'not-a-uuid',
        timestamp: 'not-a-date' // Invalid date
      });
      
      // Convert to class instance
      const metadataDto = plainToInstance(EventMetadataDto, metadata);
      
      // Validate
      const errors = await validate(metadataDto);
      
      // Verify errors
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific errors
      const correlationIdError = errors.find(e => e.property === 'correlationId');
      expect(correlationIdError).toBeDefined();
      
      const timestampError = errors.find(e => e.property === 'timestamp');
      expect(timestampError).toBeDefined();
    });
    
    it('should validate event version information', async () => {
      // Create metadata with version
      const metadata = createEventMetadata('test-service');
      metadata.version.major = '2';
      metadata.version.minor = '1';
      metadata.version.patch = '0';
      
      // Convert to class instance
      const metadataDto = plainToInstance(EventMetadataDto, metadata);
      
      // Validate
      const errors = await validate(metadataDto);
      
      // Verify no errors
      expect(errors).toHaveLength(0);
      
      // Verify version string
      expect(metadataDto.version.toString()).toBe('2.1.0');
    });
    
    it('should reject invalid version format', async () => {
      // Create metadata with invalid version
      const metadata = createEventMetadata('test-service');
      metadata.version.major = 'not-a-number';
      
      // Convert to class instance
      const metadataDto = plainToInstance(EventMetadataDto, metadata);
      
      // Validate
      const errors = await validate(metadataDto, { validationError: { target: false } });
      
      // Verify errors
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific errors
      const versionError = errors.find(e => e.property === 'version');
      expect(versionError).toBeDefined();
    });
  });

  /**
   * Tests for Health Journey event validation
   */
  describe('Health Journey Event Validation', () => {
    describe('Health Metric Events', () => {
      it('should validate valid health metric events', async () => {
        // Test all health metric event types
        for (const [key, event] of Object.entries(healthMetricEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthMetricRecordedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          
          // Verify no errors
          expect(errors).toHaveLength(0);
        }
      });
      
      it('should reject health metric events with missing required fields', async () => {
        // Create events with missing required fields
        const missingTypeEvent = { ...healthMetricEvents.heartRateMetricEvent, type: undefined };
        const missingJourneyEvent = { ...healthMetricEvents.heartRateMetricEvent, journey: undefined };
        const missingDataEvent = { ...healthMetricEvents.heartRateMetricEvent, data: undefined };
        const missingMetricTypeEvent = {
          ...healthMetricEvents.heartRateMetricEvent,
          data: { ...healthMetricEvents.heartRateMetricEvent.data, metricType: undefined }
        };
        
        // Convert to class instances
        const missingTypeDto = plainToInstance(HealthMetricRecordedEventDto, missingTypeEvent);
        const missingJourneyDto = plainToInstance(HealthMetricRecordedEventDto, missingJourneyEvent);
        const missingDataDto = plainToInstance(HealthMetricRecordedEventDto, missingDataEvent);
        const missingMetricTypeDto = plainToInstance(HealthMetricRecordedEventDto, missingMetricTypeEvent);
        
        // Validate
        const typeErrors = await validate(missingTypeDto);
        const journeyErrors = await validate(missingJourneyDto);
        const dataErrors = await validate(missingDataDto);
        const metricTypeErrors = await validate(missingMetricTypeDto);
        
        // Verify errors
        expect(typeErrors.length).toBeGreaterThan(0);
        expect(journeyErrors.length).toBeGreaterThan(0);
        expect(dataErrors.length).toBeGreaterThan(0);
        expect(metricTypeErrors.length).toBeGreaterThan(0);
      });
      
      it('should reject health metric events with invalid data types', async () => {
        // Create events with invalid data types
        const invalidTypeEvent = { ...healthMetricEvents.heartRateMetricEvent, type: 123 }; // Should be string
        const invalidValueEvent = {
          ...healthMetricEvents.heartRateMetricEvent,
          data: { ...healthMetricEvents.heartRateMetricEvent.data, value: 'not-a-number' } // Should be number
        };
        
        // Convert to class instances
        const invalidTypeDto = plainToInstance(HealthMetricRecordedEventDto, invalidTypeEvent);
        const invalidValueDto = plainToInstance(HealthMetricRecordedEventDto, invalidValueEvent);
        
        // Validate
        const typeErrors = await validate(invalidTypeDto);
        const valueErrors = await validate(invalidValueDto);
        
        // Verify errors
        expect(typeErrors.length).toBeGreaterThan(0);
        expect(valueErrors.length).toBeGreaterThan(0);
      });
      
      it('should reject health metric events with values outside valid ranges', async () => {
        // Create events with out-of-range values
        const invalidHeartRateEvent = {
          ...healthMetricEvents.heartRateMetricEvent,
          data: { ...healthMetricEvents.heartRateMetricEvent.data, value: 300 } // Too high
        };
        
        const invalidBloodGlucoseEvent = {
          ...healthMetricEvents.bloodGlucoseMetricEvent,
          data: { ...healthMetricEvents.bloodGlucoseMetricEvent.data, value: 1000 } // Too high
        };
        
        // Convert to class instances
        const invalidHeartRateDto = plainToInstance(HealthMetricRecordedEventDto, invalidHeartRateEvent);
        const invalidBloodGlucoseDto = plainToInstance(HealthMetricRecordedEventDto, invalidBloodGlucoseEvent);
        
        // Verify using the custom validation method
        expect(invalidHeartRateDto.data.validateMetricRange()).toBe(false);
        expect(invalidBloodGlucoseDto.data.validateMetricRange()).toBe(false);
      });
      
      it('should validate health metric units based on metric type', async () => {
        // Valid units
        expect(healthMetricEvents.heartRateMetricEvent.data.unit).toBe('bpm');
        expect(healthMetricEvents.bloodGlucoseMetricEvent.data.unit).toBe('mg/dL');
        
        // Create events with invalid units
        const invalidHeartRateUnitEvent = {
          ...healthMetricEvents.heartRateMetricEvent,
          data: { ...healthMetricEvents.heartRateMetricEvent.data, unit: 'kg' } // Wrong unit
        };
        
        // Convert to class instance
        const invalidHeartRateUnitDto = plainToInstance(HealthMetricRecordedEventDto, invalidHeartRateUnitEvent);
        
        // Create a validator constraint instance to test
        const constraint = new (class {
          validate(value: any, args: any) {
            return value === 'bpm';
          }
        })();
        
        // Test the constraint
        expect(constraint.validate(invalidHeartRateUnitDto.data.unit, { object: invalidHeartRateUnitDto.data })).toBe(false);
        expect(constraint.validate('bpm', { object: invalidHeartRateUnitDto.data })).toBe(true);
      });
    });
    
    describe('Health Goal Events', () => {
      it('should validate valid health goal events', async () => {
        // Test all health goal event types
        for (const [key, event] of Object.entries(healthGoalEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthGoalAchievedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          
          // Verify no errors
          expect(errors).toHaveLength(0);
        }
      });
      
      it('should reject health goal events with missing required fields', async () => {
        // Create an event with missing required fields
        const missingGoalIdEvent = {
          ...healthGoalEvents.stepsGoalAchievedEvent,
          data: { ...healthGoalEvents.stepsGoalAchievedEvent.data, goalId: undefined }
        };
        
        // Convert to class instance
        const missingGoalIdDto = plainToInstance(HealthGoalAchievedEventDto, missingGoalIdEvent);
        
        // Validate
        const errors = await validate(missingGoalIdDto);
        
        // Verify errors
        expect(errors.length).toBeGreaterThan(0);
        
        // Check for specific errors
        const goalIdError = errors.find(e => 
          e.property === 'data' && 
          e.children && 
          e.children.some(child => child.property === 'goalId')
        );
        expect(goalIdError).toBeDefined();
      });
      
      it('should validate goal achievement status correctly', async () => {
        // Test goal achievement status
        const achievedGoalEvent = healthGoalEvents.stepsGoalAchievedEvent;
        const partialGoalEvent = healthGoalEvents.weightGoalPartialEvent;
        
        // Convert to class instances
        const achievedGoalDto = plainToInstance(HealthGoalAchievedEventDto, achievedGoalEvent);
        const partialGoalDto = plainToInstance(HealthGoalAchievedEventDto, partialGoalEvent);
        
        // Verify achievement status
        expect(achievedGoalDto.data.isAchieved()).toBe(true);
        expect(partialGoalDto.data.isAchieved()).toBe(false);
        
        // Mark the partial goal as achieved
        partialGoalDto.data.markAsAchieved();
        
        // Verify updated status
        expect(partialGoalDto.data.isAchieved()).toBe(true);
        expect(partialGoalDto.data.progressPercentage).toBe(100);
        expect(partialGoalDto.data.achievedAt).toBeDefined();
      });
    });
    
    describe('Device Synchronization Events', () => {
      it('should validate valid device sync events', async () => {
        // Test all device sync event types
        for (const [key, event] of Object.entries(deviceSyncEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(DeviceSynchronizedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          
          // Verify no errors
          expect(errors).toHaveLength(0);
        }
      });
      
      it('should reject device sync events with invalid device types', async () => {
        // Create an event with an invalid device type
        const invalidDeviceTypeEvent = {
          ...deviceSyncEvents.smartwatchSyncEvent,
          data: { ...deviceSyncEvents.smartwatchSyncEvent.data, deviceType: 'INVALID_DEVICE' }
        };
        
        // Convert to class instance
        const invalidDeviceTypeDto = plainToInstance(DeviceSynchronizedEventDto, invalidDeviceTypeEvent);
        
        // Validate
        const errors = await validate(invalidDeviceTypeDto);
        
        // Verify errors
        expect(errors.length).toBeGreaterThan(0);
        
        // Check for specific errors
        const deviceTypeError = errors.find(e => 
          e.property === 'data' && 
          e.children && 
          e.children.some(child => child.property === 'deviceType')
        );
        expect(deviceTypeError).toBeDefined();
      });
    });
    
    describe('Health Insight Events', () => {
      it('should validate valid health insight events', async () => {
        // Test all health insight event types
        for (const [key, event] of Object.entries(healthInsightEvents)) {
          // Convert plain object to class instance for validation
          const eventDto = plainToInstance(HealthInsightGeneratedEventDto, event);
          
          // Validate the event
          const errors = await validate(eventDto);
          
          // Verify no errors
          expect(errors).toHaveLength(0);
        }
      });
      
      it('should reject health insight events with invalid confidence scores', async () => {
        // Create an event with an invalid confidence score
        const invalidConfidenceEvent = {
          ...healthInsightEvents.anomalyDetectionInsightEvent,
          data: { ...healthInsightEvents.anomalyDetectionInsightEvent.data, confidenceScore: 150 } // Over 100%
        };
        
        // Convert to class instance
        const invalidConfidenceDto = plainToInstance(HealthInsightGeneratedEventDto, invalidConfidenceEvent);
        
        // Validate
        const errors = await validate(invalidConfidenceDto);
        
        // Verify errors
        expect(errors.length).toBeGreaterThan(0);
        
        // Check for specific errors
        const confidenceError = errors.find(e => 
          e.property === 'data' && 
          e.children && 
          e.children.some(child => child.property === 'confidenceScore')
        );
        expect(confidenceError).toBeDefined();
      });
    });
  });

  /**
   * Tests for Care Journey event validation
   */
  describe('Care Journey Event Validation', () => {
    describe('Appointment Events', () => {
      it('should validate valid appointment events', async () => {
        // Test appointment booking events
        for (const [key, event] of Object.entries(careEvents.appointmentBookedEvents)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
        
        // Test appointment completion events
        for (const [key, event] of Object.entries(careEvents.appointmentCompletedEvents)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject appointment events with invalid appointment types', async () => {
        // Create an event with an invalid appointment type
        const invalidAppointmentTypeEvent = {
          ...careEvents.appointmentBookedEvents.standard,
          data: { ...careEvents.appointmentBookedEvents.standard.data, appointmentType: 'INVALID_TYPE' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidAppointmentTypeEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
      
      it('should reject appointment events with invalid status values', async () => {
        // Create an event with an invalid status
        const invalidStatusEvent = {
          ...careEvents.appointmentCompletedEvents.standard,
          data: { ...careEvents.appointmentCompletedEvents.standard.data, status: 'INVALID_STATUS' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidStatusEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('Medication Events', () => {
      it('should validate valid medication events', async () => {
        // Test medication taken events
        for (const [key, event] of Object.entries(careEvents.medicationTakenEvents)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject medication events with invalid adherence values', async () => {
        // Create an event with an invalid adherence value
        const invalidAdherenceEvent = {
          ...careEvents.medicationTakenEvents.onTime,
          data: { ...careEvents.medicationTakenEvents.onTime.data, adherence: 'INVALID_ADHERENCE' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidAdherenceEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('Telemedicine Events', () => {
      it('should validate valid telemedicine events', async () => {
        // Test telemedicine events
        for (const [key, event] of Object.entries(careEvents.telemedicineEvents)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject telemedicine events with missing required fields', async () => {
        // Create an event with missing required fields
        const missingSessionIdEvent = {
          ...careEvents.telemedicineEvents.started,
          data: { ...careEvents.telemedicineEvents.started.data, sessionId: undefined }
        };
        
        // Validate the event
        const errors = await validateObject(missingSessionIdEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Tests for Plan Journey event validation
   */
  describe('Plan Journey Event Validation', () => {
    describe('Claim Events', () => {
      it('should validate valid claim events', async () => {
        // Test claim submission events
        for (const [key, event] of Object.entries(planEventFixtures.claimSubmission)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
        
        // Test claim processing events
        for (const [key, event] of Object.entries(planEventFixtures.claimProcessing)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject claim events with invalid claim types', async () => {
        // Create an event with an invalid claim type
        const invalidClaimTypeEvent = {
          ...planEventFixtures.claimSubmission.medicalClaim,
          data: { ...planEventFixtures.claimSubmission.medicalClaim.data, claimType: 'INVALID_TYPE' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidClaimTypeEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
      
      it('should reject claim events with invalid status values', async () => {
        // Create an event with an invalid status
        const invalidStatusEvent = {
          ...planEventFixtures.claimProcessing.approvedClaim,
          data: { ...planEventFixtures.claimProcessing.approvedClaim.data, status: 'INVALID_STATUS' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidStatusEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
      
      it('should reject claim events with negative amounts', async () => {
        // Create an event with a negative amount
        const negativeAmountEvent = {
          ...planEventFixtures.claimSubmission.medicalClaim,
          data: { ...planEventFixtures.claimSubmission.medicalClaim.data, amount: -100 }
        };
        
        // Validate the event
        const errors = await validateObject(negativeAmountEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('Benefit Events', () => {
      it('should validate valid benefit events', async () => {
        // Test benefit utilization events
        for (const [key, event] of Object.entries(planEventFixtures.benefitUtilization)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject benefit events with invalid benefit types', async () => {
        // Create an event with an invalid benefit type
        const invalidBenefitTypeEvent = {
          ...planEventFixtures.benefitUtilization.wellnessBenefit,
          data: { ...planEventFixtures.benefitUtilization.wellnessBenefit.data, benefitType: 'INVALID_TYPE' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidBenefitTypeEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
    
    describe('Plan Selection Events', () => {
      it('should validate valid plan selection events', async () => {
        // Test plan selection events
        for (const [key, event] of Object.entries(planEventFixtures.planSelection)) {
          // Validate the event
          const errors = await validateObject(event);
          
          // Verify no errors
          expect(errors).toBeNull();
        }
      });
      
      it('should reject plan selection events with invalid plan types', async () => {
        // Create an event with an invalid plan type
        const invalidPlanTypeEvent = {
          ...planEventFixtures.planSelection.standardPlan,
          data: { ...planEventFixtures.planSelection.standardPlan.data, planType: 'INVALID_TYPE' }
        };
        
        // Validate the event
        const errors = await validateObject(invalidPlanTypeEvent);
        
        // Verify errors
        expect(errors).not.toBeNull();
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Tests for cross-journey event validation
   */
  describe('Cross-Journey Event Validation', () => {
    it('should validate events with references to other journeys', async () => {
      // Create a health event with a reference to a care appointment
      const crossJourneyEvent = {
        ...healthMetricEvents.bloodPressureMetricEvent,
        data: {
          ...healthMetricEvents.bloodPressureMetricEvent.data,
          appointmentId: careEvents.appointmentCompletedEvents.standard.data.appointmentId,
          recordedDuring: 'appointment'
        }
      };
      
      // Validate the event
      const errors = await validateObject(crossJourneyEvent);
      
      // Verify no errors
      expect(errors).toBeNull();
    });
    
    it('should validate events with conditional required fields', async () => {
      // Create an event where a field is required based on another field's value
      const conditionalEvent = {
        ...healthMetricEvents.bloodPressureMetricEvent,
        data: {
          ...healthMetricEvents.bloodPressureMetricEvent.data,
          recordedDuring: 'appointment',
          // appointmentId is required when recordedDuring is 'appointment'
          appointmentId: undefined
        }
      };
      
      // Validate the event
      const errors = await validateObject(conditionalEvent);
      
      // Verify errors
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
    });
    
    it('should validate versioned events', async () => {
      // Create a versioned event
      const versionedEvent = createVersionedEvent(
        EventType.HEALTH_METRIC_RECORDED,
        healthMetricEvents.heartRateMetricEvent
      );
      
      // Validate the event
      const errors = await validateObject(versionedEvent);
      
      // Verify no errors
      expect(errors).toBeNull();
      
      // Verify version compatibility
      expect(versionedEvent.isCompatibleWith('1.0.0')).toBe(true);
      expect(versionedEvent.isCompatibleWith('2.0.0')).toBe(false); // Major version mismatch
    });
  });

  /**
   * Tests for validation error handling
   */
  describe('Validation Error Handling', () => {
    it('should format validation errors with proper error codes', async () => {
      // Create an invalid event
      const invalidEvent = {
        ...healthMetricEvents.heartRateMetricEvent,
        type: undefined,
        data: { ...healthMetricEvents.heartRateMetricEvent.data, value: 'not-a-number' }
      };
      
      // Validate the event
      const errors = await validateObject(invalidEvent);
      
      // Verify errors
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check error format
      expect(errors[0]).toHaveProperty('errorCode', ERROR_CODES.SCHEMA_VALIDATION_FAILED);
      expect(errors[0]).toHaveProperty('message', ERROR_MESSAGES[ERROR_CODES.SCHEMA_VALIDATION_FAILED]);
    });
    
    it('should include nested validation errors for complex objects', async () => {
      // Create an event with nested validation errors
      const nestedErrorEvent = {
        ...healthMetricEvents.heartRateMetricEvent,
        data: {
          ...healthMetricEvents.heartRateMetricEvent.data,
          metricType: 'INVALID_TYPE',
          value: -10, // Invalid negative value
          unit: 'invalid-unit' // Invalid unit
        }
      };
      
      // Validate the event
      const errors = await validateObject(nestedErrorEvent);
      
      // Verify errors
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for nested errors
      const dataError = errors.find(e => e.property === 'data');
      expect(dataError).toBeDefined();
      expect(dataError.children).toBeDefined();
      expect(dataError.children.length).toBeGreaterThan(0);
    });
    
    it('should handle validation of arrays of objects', async () => {
      // Create an event with an array of objects
      const arrayEvent = {
        type: EventType.HEALTH_METRIC_RECORDED,
        journey: 'health',
        userId: '123',
        data: {
          metrics: [
            { metricType: HealthMetricType.HEART_RATE, value: 75, unit: 'bpm' },
            { metricType: HealthMetricType.BLOOD_GLUCOSE, value: 120, unit: 'mg/dL' },
            { metricType: 'INVALID_TYPE', value: -10, unit: 'invalid-unit' } // Invalid item
          ]
        }
      };
      
      // Validate the event
      const errors = await validateObject(arrayEvent);
      
      // Verify errors
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});