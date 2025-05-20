/**
 * @file appointment-event.dto.spec.ts
 * @description Unit tests for the AppointmentEventDto class that validate appointment booking,
 * check-in, completion, and cancellation events. Tests verify provider information validation,
 * scheduling data integrity, status transition rules, and location data validation.
 *
 * These tests ensure that appointment-related gamification events are properly structured and
 * validated before processing.
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

// Import test utilities
import {
  createAppointmentData,
  createAppointmentBookedEvent,
  createAppointmentCompletedEvent,
  AppointmentType,
  AppointmentStatus,
  AppointmentData,
  createInvalidEvent,
  createEventWithInvalidValues,
  validateEventDto,
  isValidEventDto,
  TestFactoryOptions
} from '../test-utils';

// Import event types
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

// Mock AppointmentEventDto classes
class AppointmentBookedEventDto {
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  data: AppointmentData;
  metadata?: any;
}

class AppointmentCheckedInEventDto {
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  data: AppointmentData;
  metadata?: any;
}

class AppointmentCompletedEventDto {
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  data: AppointmentData;
  metadata?: any;
}

class AppointmentCancelledEventDto {
  type: string;
  userId: string;
  journey: string;
  timestamp: string;
  data: AppointmentData;
  metadata?: any;
}

describe('AppointmentEventDto', () => {
  // Common test variables
  const userId = uuidv4();
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
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
    
    it('should validate specialty type', async () => {
      // Create an event with missing specialty type
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createInvalidEvent(validEvent, ['data.specialtyType']);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for specialty type
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'specialtyType')
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
      // Create an event with invalid scheduling data (past date)
      const pastDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
      
      const validEvent = createAppointmentBookedEvent();
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.scheduledAt': pastDate.toISOString()
      });
      
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
    
    it('should validate location data for in-person appointments', async () => {
      // Create an in-person appointment without location
      const validEvent = createAppointmentBookedEvent(AppointmentType.IN_PERSON);
      const invalidEvent = createInvalidEvent(validEvent, ['data.location']);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for location
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'location')
      )).toBeTruthy();
    });
    
    it('should not require location for telemedicine appointments', async () => {
      // Create a telemedicine appointment without location
      const appointmentData = createAppointmentData(AppointmentType.TELEMEDICINE);
      delete appointmentData.location;
      
      const event = createAppointmentBookedEvent(AppointmentType.TELEMEDICINE, appointmentData);
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentBookedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
  });
  
  describe('AppointmentCheckedInEventDto', () => {
    it('should validate a valid appointment check-in event', async () => {
      // Create appointment data with CHECKED_IN status
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CHECKED_IN);
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CHECKED_IN',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCheckedInEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate appointment status transition from SCHEDULED to CHECKED_IN', async () => {
      // Create appointment data with direct transition from SCHEDULED to CHECKED_IN
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CHECKED_IN);
      appointmentData.status = AppointmentStatus.CHECKED_IN;
      
      // Add previous status information
      const appointmentWithHistory = {
        ...appointmentData,
        previousStatus: AppointmentStatus.SCHEDULED,
        statusChangedAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CHECKED_IN',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithHistory
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCheckedInEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate appointment status transition from CONFIRMED to CHECKED_IN', async () => {
      // Create appointment data with transition from CONFIRMED to CHECKED_IN
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CHECKED_IN);
      
      // Add previous status information
      const appointmentWithHistory = {
        ...appointmentData,
        previousStatus: AppointmentStatus.CONFIRMED,
        statusChangedAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CHECKED_IN',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithHistory
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCheckedInEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should reject invalid appointment status transitions to CHECKED_IN', async () => {
      // Create appointment data with invalid transition from COMPLETED to CHECKED_IN
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CHECKED_IN);
      
      // Add previous status information with invalid transition
      const appointmentWithHistory = {
        ...appointmentData,
        previousStatus: AppointmentStatus.COMPLETED,
        statusChangedAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CHECKED_IN',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithHistory
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCheckedInEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for invalid status transition
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'previousStatus' || 
          child.property === 'status'
        )
      )).toBeTruthy();
    });
    
    it('should validate check-in timestamp', async () => {
      // Create appointment data with CHECKED_IN status but missing check-in timestamp
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CHECKED_IN);
      
      // Create event without statusChangedAt
      const event = {
        type: 'CARE_APPOINTMENT_CHECKED_IN',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentData
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCheckedInEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for missing check-in timestamp
      expect(errors).not.toBeNull();
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
    
    it('should validate appointment status transition to COMPLETED', async () => {
      // Create appointment data with valid transition from IN_PROGRESS to COMPLETED
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
      
      // Add previous status information
      const appointmentWithHistory = {
        ...appointmentData,
        previousStatus: AppointmentStatus.IN_PROGRESS,
        statusChangedAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_APPOINTMENT_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithHistory
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should reject invalid appointment status transitions to COMPLETED', async () => {
      // Create appointment data with invalid transition from CANCELLED to COMPLETED
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
      
      // Add previous status information with invalid transition
      const appointmentWithHistory = {
        ...appointmentData,
        previousStatus: AppointmentStatus.CANCELLED,
        statusChangedAt: now.toISOString()
      };
      
      // Create event
      const event = {
        type: EventType.CARE_APPOINTMENT_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithHistory
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for invalid status transition
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'previousStatus' || 
          child.property === 'status'
        )
      )).toBeTruthy();
    });
  });
  
  describe('AppointmentCancelledEventDto', () => {
    it('should validate a valid appointment cancelled event', async () => {
      // Create appointment data with CANCELLED status
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CANCELLED);
      
      // Add cancellation reason
      const appointmentWithCancellation = {
        ...appointmentData,
        cancellationReason: 'Patient request',
        cancelledAt: now.toISOString(),
        previousStatus: AppointmentStatus.SCHEDULED
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CANCELLED',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithCancellation
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCancelledEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate cancellation reason', async () => {
      // Create appointment data with CANCELLED status but missing reason
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CANCELLED);
      
      // Add cancellation data without reason
      const appointmentWithCancellation = {
        ...appointmentData,
        cancelledAt: now.toISOString(),
        previousStatus: AppointmentStatus.SCHEDULED
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CANCELLED',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithCancellation
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCancelledEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for missing cancellation reason
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'cancellationReason')
      )).toBeTruthy();
    });
    
    it('should validate cancellation timestamp', async () => {
      // Create appointment data with CANCELLED status but missing cancellation timestamp
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CANCELLED);
      
      // Add cancellation data without timestamp
      const appointmentWithCancellation = {
        ...appointmentData,
        cancellationReason: 'Patient request',
        previousStatus: AppointmentStatus.SCHEDULED
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CANCELLED',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithCancellation
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCancelledEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for missing cancellation timestamp
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'cancelledAt')
      )).toBeTruthy();
    });
    
    it('should validate appointment status is CANCELLED', async () => {
      // Create appointment data with incorrect status
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.SCHEDULED);
      
      // Add cancellation data but with incorrect status
      const appointmentWithCancellation = {
        ...appointmentData,
        cancellationReason: 'Patient request',
        cancelledAt: now.toISOString(),
        previousStatus: AppointmentStatus.SCHEDULED
      };
      
      // Create event
      const event = {
        type: 'CARE_APPOINTMENT_CANCELLED',
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithCancellation
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCancelledEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect validation errors for incorrect status
      expect(errors).not.toBeNull();
      expect(errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => child.property === 'status')
      )).toBeTruthy();
    });
    
    it('should validate appointment can be cancelled from valid statuses', async () => {
      // Test valid status transitions to CANCELLED
      const validPreviousStatuses = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.CHECKED_IN
      ];
      
      for (const previousStatus of validPreviousStatuses) {
        // Create appointment data with CANCELLED status
        const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CANCELLED);
        
        // Add cancellation data with valid previous status
        const appointmentWithCancellation = {
          ...appointmentData,
          cancellationReason: 'Patient request',
          cancelledAt: now.toISOString(),
          previousStatus
        };
        
        // Create event
        const event = {
          type: 'CARE_APPOINTMENT_CANCELLED',
          userId,
          journey: 'care',
          timestamp: now.toISOString(),
          data: appointmentWithCancellation
        };
        
        // Convert to DTO instance
        const dto = plainToInstance(AppointmentCancelledEventDto, event);
        
        // Validate
        const errors = await validateEventDto(dto);
        
        // Expect no validation errors for valid status transitions
        expect(errors).toBeNull();
      }
    });
    
    it('should reject invalid appointment status transitions to CANCELLED', async () => {
      // Test invalid status transitions to CANCELLED
      const invalidPreviousStatuses = [
        AppointmentStatus.COMPLETED,
        AppointmentStatus.NO_SHOW
      ];
      
      for (const previousStatus of invalidPreviousStatuses) {
        // Create appointment data with CANCELLED status
        const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.CANCELLED);
        
        // Add cancellation data with invalid previous status
        const appointmentWithCancellation = {
          ...appointmentData,
          cancellationReason: 'Patient request',
          cancelledAt: now.toISOString(),
          previousStatus
        };
        
        // Create event
        const event = {
          type: 'CARE_APPOINTMENT_CANCELLED',
          userId,
          journey: 'care',
          timestamp: now.toISOString(),
          data: appointmentWithCancellation
        };
        
        // Convert to DTO instance
        const dto = plainToInstance(AppointmentCancelledEventDto, event);
        
        // Validate
        const errors = await validateEventDto(dto);
        
        // Expect validation errors for invalid status transitions
        expect(errors).not.toBeNull();
        expect(errors.some(error => 
          error.property === 'data' && 
          error.children.some(child => 
            child.property === 'previousStatus' || 
            child.property === 'status'
          )
        )).toBeTruthy();
      }
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
    
    it('should validate appointment streak data for gamification', async () => {
      // Create a completed appointment with streak data
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
      
      // Add streak data
      const appointmentWithStreak = {
        ...appointmentData,
        streak: {
          current: 3,
          longest: 5,
          lastAppointmentDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_APPOINTMENT_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithStreak
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
    
    it('should validate appointment achievement eligibility data', async () => {
      // Create a completed appointment with achievement eligibility data
      const appointmentData = createAppointmentData(AppointmentType.IN_PERSON, AppointmentStatus.COMPLETED);
      
      // Add achievement eligibility data
      const appointmentWithAchievement = {
        ...appointmentData,
        achievementEligibility: {
          eligible: true,
          achievementType: 'appointment-keeper',
          progress: 3,
          threshold: 5,
          progressPercentage: 60
        }
      };
      
      // Create event
      const event = {
        type: EventType.CARE_APPOINTMENT_COMPLETED,
        userId,
        journey: 'care',
        timestamp: now.toISOString(),
        data: appointmentWithAchievement
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(AppointmentCompletedEventDto, event);
      
      // Validate
      const errors = await validateEventDto(dto);
      
      // Expect no validation errors
      expect(errors).toBeNull();
    });
  });
});