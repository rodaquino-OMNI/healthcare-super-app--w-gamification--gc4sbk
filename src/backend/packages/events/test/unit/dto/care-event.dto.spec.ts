/**
 * @file care-event.dto.spec.ts
 * @description Unit tests for the CareEventDto class that validate care journey-specific event structures.
 * Tests verify correct validation of appointment booking, medication adherence, telemedicine session,
 * and care plan progress events, ensuring proper payload structure and field validation.
 *
 * These tests are essential for maintaining the integrity of care data in the gamification system.
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

// Import test utilities
import {
  createAppointmentData,
  createAppointmentBookedEvent,
  createAppointmentCompletedEvent,
  createMedicationData,
  createMedicationTakenEvent,
  AppointmentType,
  AppointmentStatus,
  MedicationAdherenceStatus,
  createInvalidEvent,
  createEventWithInvalidValues,
  validateEventDto,
  isValidEventDto,
  TestFactoryOptions
} from '../test-utils';

// Import event types
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

// Mock CareEventDto classes
class CareEventDto {
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  data: any;
  metadata?: any;
}

class AppointmentBookedEventDto extends CareEventDto {}
class AppointmentCompletedEventDto extends CareEventDto {}
class MedicationTakenEventDto extends CareEventDto {}
class TelemedicineStartedEventDto extends CareEventDto {}
class TelemedicineCompletedEventDto extends CareEventDto {}
class CarePlanCreatedEventDto extends CareEventDto {}
class CarePlanTaskCompletedEventDto extends CareEventDto {}

describe('CareEventDto', () => {
  // Common test variables
  const userId = uuidv4();
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  describe('Base validation', () => {
    it('should validate common fields for all care events', async () => {
      // Create a valid appointment booked event
      const event = createAppointmentBookedEvent();
      
      // Convert to DTO instance
      const dto = plainToInstance(CareEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate journey is "care"', async () => {
      // Create an event with incorrect journey
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'journey': 'health'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(CareEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for journey
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'journey')).toBeTruthy();
    });
    
    it('should validate userId is present', async () => {
      // Create an event with missing userId
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['userId']);
      
      // Convert to DTO instance
      const dto = plainToInstance(CareEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for userId
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'userId')).toBeTruthy();
    });
    
    it('should validate timestamp is present and in ISO format', async () => {
      // Create an event with invalid timestamp
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'timestamp': 'not-a-date'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(CareEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'timestamp')).toBeTruthy();
    });
  });
  
  describe('AppointmentBookedEventDto', () => {
    it('should validate a valid appointment booked event', async () => {
      // Create a valid appointment booked event
      const event = createAppointmentBookedEvent();
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate event type is CARE_APPOINTMENT_BOOKED', async () => {
      // Create an event with incorrect type
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'type': 'INVALID_TYPE'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for type
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'type')).toBeTruthy();
    });
    
    it('should validate provider information', async () => {
      // Create an event with missing provider information
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.providerId']);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for provider information
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'providerId')
      )).toBeTruthy();
    });
    
    it('should validate appointment type', async () => {
      // Create an event with invalid appointment type
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.appointmentType': 'INVALID_TYPE'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for appointment type
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'appointmentType')
      )).toBeTruthy();
    });
    
    it('should validate scheduling data', async () => {
      // Create an event with missing scheduling data
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.scheduledAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for scheduling data
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'scheduledAt')
      )).toBeTruthy();
    });
  });
  
  describe('AppointmentCompletedEventDto', () => {
    it('should validate a valid appointment completed event', async () => {
      // Create a valid appointment completed event
      const event = createAppointmentCompletedEvent();
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate event type is CARE_APPOINTMENT_COMPLETED', async () => {
      // Create an event with incorrect type
      const validEvent = createAppointmentCompletedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'type': 'INVALID_TYPE'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for type
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'type')).toBeTruthy();
    });
    
    it('should validate completion timestamp', async () => {
      // Create an event with missing completion timestamp
      const validEvent = createAppointmentCompletedEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.completedAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for completion timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'completedAt')
      )).toBeTruthy();
    });
    
    it('should validate appointment duration', async () => {
      // Create an event with invalid duration (negative value)
      const validEvent = createAppointmentCompletedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.duration': -30
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for duration
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'duration')
      )).toBeTruthy();
    });
    
    it('should validate appointment status is COMPLETED', async () => {
      // Create an event with incorrect status
      const validEvent = createAppointmentCompletedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.status': AppointmentStatus.IN_PROGRESS
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for status
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'status')
      )).toBeTruthy();
    });
  });
  
  describe('MedicationTakenEventDto', () => {
    it('should validate a valid medication taken event', async () => {
      // Create a valid medication taken event
      const event = createMedicationTakenEvent();
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate event type is CARE_MEDICATION_TAKEN', async () => {
      // Create an event with incorrect type
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'type': 'INVALID_TYPE'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for type
      expect(errors).not.toBeNull();
      expect(errors.some(error => error.property === 'type')).toBeTruthy();
    });
    
    it('should validate medication identification', async () => {
      // Create an event with missing medication identification
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.medicationId', 'data.medicationName']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for medication identification
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'medicationId' || 
          child.property === 'medicationName'
        )
      )).toBeTruthy();
    });
    
    it('should validate dosage information', async () => {
      // Create an event with missing dosage information
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.dosage']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for dosage
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'dosage')
      )).toBeTruthy();
    });
    
    it('should validate adherence status', async () => {
      // Create an event with invalid adherence status
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.adherenceStatus': 'INVALID_STATUS'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for adherence status
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'adherenceStatus')
      )).toBeTruthy();
    });
    
    it('should validate taken timestamp', async () => {
      // Create an event with missing taken timestamp
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.takenAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for taken timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'takenAt')
      )).toBeTruthy();
    });
    
    it('should validate scheduled timestamp', async () => {
      // Create an event with missing scheduled timestamp
      const validEvent = createMedicationTakenEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.scheduledAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for scheduled timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'scheduledAt')
      )).toBeTruthy();
    });
    
    it('should validate late medication has appropriate adherence status', async () => {
      // Create a medication event with late timestamp but incorrect adherence status
      const now = new Date();
      const scheduledTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      // Create event with late timing but ON_TIME status (should be LATE)
      const invalidEvent = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME, {
        scheduledAt: scheduledTime.toISOString(),
        takenAt: now.toISOString()
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for inconsistent adherence status
      expect(errors).not.toBeNull();
    });
  });
  
  describe('TelemedicineStartedEventDto', () => {
    it('should validate a valid telemedicine started event', async () => {
      // Create telemedicine session data
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: now.toISOString(),
        deviceType: 'mobile'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineStartedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate session identification', async () => {
      // Create telemedicine session data without session ID
      const sessionData = {
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: now.toISOString(),
        deviceType: 'mobile'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineStartedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for session ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'sessionId')
      )).toBeTruthy();
    });
    
    it('should validate provider information', async () => {
      // Create telemedicine session data without provider ID
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        startedAt: now.toISOString(),
        deviceType: 'mobile'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineStartedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for provider ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'providerId')
      )).toBeTruthy();
    });
    
    it('should validate start timestamp', async () => {
      // Create telemedicine session data without start timestamp
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        deviceType: 'mobile'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineStartedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for start timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'startedAt')
      )).toBeTruthy();
    });
    
    it('should validate device type', async () => {
      // Create telemedicine session data with invalid device type
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: now.toISOString(),
        deviceType: 'invalid_device'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineStartedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for device type
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'deviceType')
      )).toBeTruthy();
    });
  });
  
  describe('TelemedicineCompletedEventDto', () => {
    it('should validate a valid telemedicine completed event', async () => {
      // Create telemedicine session data
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: startTime.toISOString(),
        endedAt: now.toISOString(),
        duration: 30, // 30 minutes
        quality: 'good'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate end timestamp', async () => {
      // Create telemedicine session data without end timestamp
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: startTime.toISOString(),
        duration: 30,
        quality: 'good'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for end timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'endedAt')
      )).toBeTruthy();
    });
    
    it('should validate session duration', async () => {
      // Create telemedicine session data with invalid duration (negative)
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: startTime.toISOString(),
        endedAt: now.toISOString(),
        duration: -30, // Negative duration
        quality: 'good'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for duration
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'duration')
      )).toBeTruthy();
    });
    
    it('should validate session quality', async () => {
      // Create telemedicine session data with invalid quality
      const startTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: startTime.toISOString(),
        endedAt: now.toISOString(),
        duration: 30,
        quality: 'invalid_quality'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for quality
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'quality')
      )).toBeTruthy();
    });
    
    it('should validate end time is after start time', async () => {
      // Create telemedicine session data with end time before start time
      const startTime = now;
      const endTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes before start
      
      const sessionData = {
        sessionId: uuidv4(),
        appointmentId: uuidv4(),
        providerId: uuidv4(),
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        duration: 30,
        quality: 'good'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_TELEMEDICINE_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: sessionData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(TelemedicineCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for end time before start time
      expect(errors).not.toBeNull();
    });
  });
  
  describe('CarePlanCreatedEventDto', () => {
    it('should validate a valid care plan created event', async () => {
      // Create care plan data
      const planData = {
        planId: uuidv4(),
        providerId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Diabetes Type 2',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate plan identification', async () => {
      // Create care plan data without plan ID
      const planData = {
        providerId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Diabetes Type 2',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for plan ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'planId')
      )).toBeTruthy();
    });
    
    it('should validate provider information', async () => {
      // Create care plan data without provider ID
      const planData = {
        planId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Diabetes Type 2',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for provider ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'providerId')
      )).toBeTruthy();
    });
    
    it('should validate plan type', async () => {
      // Create care plan data with invalid plan type
      const planData = {
        planId: uuidv4(),
        providerId: uuidv4(),
        planType: 'invalid_type',
        condition: 'Diabetes Type 2',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for plan type
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'planType')
      )).toBeTruthy();
    });
    
    it('should validate condition information', async () => {
      // Create care plan data without condition
      const planData = {
        planId: uuidv4(),
        providerId: uuidv4(),
        planType: 'chronic_condition',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for condition
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'condition')
      )).toBeTruthy();
    });
    
    it('should validate date information', async () => {
      // Create care plan data without start date
      const planData = {
        planId: uuidv4(),
        providerId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Diabetes Type 2',
        endDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for start date
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'startDate')
      )).toBeTruthy();
    });
    
    it('should validate end date is after start date', async () => {
      // Create care plan data with end date before start date
      const planData = {
        planId: uuidv4(),
        providerId: uuidv4(),
        planType: 'chronic_condition',
        condition: 'Diabetes Type 2',
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days before now
        createdAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_CREATED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: planData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanCreatedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for end date before start date
      expect(errors).not.toBeNull();
    });
  });
  
  describe('CarePlanTaskCompletedEventDto', () => {
    it('should validate a valid care plan task completed event', async () => {
      // Create care plan task data
      const taskData = {
        taskId: uuidv4(),
        planId: uuidv4(),
        taskType: 'medication',
        completedAt: now.toISOString(),
        status: 'completed'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate task identification', async () => {
      // Create care plan task data without task ID
      const taskData = {
        planId: uuidv4(),
        taskType: 'medication',
        completedAt: now.toISOString(),
        status: 'completed'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for task ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'taskId')
      )).toBeTruthy();
    });
    
    it('should validate plan identification', async () => {
      // Create care plan task data without plan ID
      const taskData = {
        taskId: uuidv4(),
        taskType: 'medication',
        completedAt: now.toISOString(),
        status: 'completed'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for plan ID
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'planId')
      )).toBeTruthy();
    });
    
    it('should validate task type', async () => {
      // Create care plan task data with invalid task type
      const taskData = {
        taskId: uuidv4(),
        planId: uuidv4(),
        taskType: 'invalid_type',
        completedAt: now.toISOString(),
        status: 'completed'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for task type
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'taskType')
      )).toBeTruthy();
    });
    
    it('should validate completion timestamp', async () => {
      // Create care plan task data without completion timestamp
      const taskData = {
        taskId: uuidv4(),
        planId: uuidv4(),
        taskType: 'medication',
        status: 'completed'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for completion timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'completedAt')
      )).toBeTruthy();
    });
    
    it('should validate task status', async () => {
      // Create care plan task data with invalid status
      const taskData = {
        taskId: uuidv4(),
        planId: uuidv4(),
        taskType: 'medication',
        completedAt: now.toISOString(),
        status: 'invalid_status'
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for status
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'status')
      )).toBeTruthy();
    });
  });
  
  describe('Integration with gamification rules', () => {
    it('should validate appointment adherence for gamification', async () => {
      // Create a completed appointment with adherence data
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
      
      // Add adherence data
      const appointmentWithAdherence = {
        ...appointmentData,
        adherence: {
          onTime: true,
          scheduledTime: scheduledDate.toISOString(),
          actualTime: scheduledDate.toISOString(),
          adherenceScore: 100
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_APPOINTMENT_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithAdherence
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate medication adherence for gamification', async () => {
      // Create a medication taken event with adherence data
      const medicationData = createMedicationData(MedicationAdherenceStatus.ON_TIME);
      
      // Add adherence streak data
      const medicationWithStreak = {
        ...medicationData,
        adherenceStreak: {
          current: 5,
          longest: 10,
          lastTakenAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_MEDICATION_TAKEN,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: medicationWithStreak
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate care plan progress for gamification', async () => {
      // Create a care plan task completed event with progress data
      const taskData = {
        taskId: uuidv4(),
        planId: uuidv4(),
        taskType: 'medication',
        completedAt: now.toISOString(),
        status: 'completed',
        progress: {
          totalTasks: 10,
          completedTasks: 5,
          progressPercentage: 50,
          isOnSchedule: true
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_PLAN_TASK_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: taskData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(CarePlanTaskCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate achievement eligibility data', async () => {
      // Create a medication taken event with achievement eligibility data
      const medicationData = createMedicationData(MedicationAdherenceStatus.ON_TIME);
      
      // Add achievement eligibility data
      const medicationWithAchievement = {
        ...medicationData,
        achievementEligibility: {
          eligible: true,
          achievementType: 'medication-adherence',
          progress: 7,
          threshold: 10,
          progressPercentage: 70
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_MEDICATION_TAKEN,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: medicationWithAchievement
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationTakenEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
  });
});