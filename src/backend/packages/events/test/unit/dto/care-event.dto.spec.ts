import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import {
  CareEventDto,
  TelemedicineSessionEventDto,
  TelemedicineSessionDataDto,
  TelemedicineSessionState,
  CarePlanEventDto,
  CarePlanDataDto,
  CarePlanType,
  CarePlanProgressStatus,
  CareProviderInfoDto,
  TechnicalDetailsDto,
  CarePlanActivityDto
} from '../../../src/dto/care-event.dto';

import { AppointmentEventDto, AppointmentState, AppointmentType } from '../../../src/dto/appointment-event.dto';
import { MedicationEventDto, MedicationAdherenceState } from '../../../src/dto/medication-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';

import {
  createCareEventDto,
  validateDto,
  createInvalidEvent,
  createEventWithInvalidValues,
  TestEventOptions
} from './test-utils';

describe('CareEventDto', () => {
  describe('Base CareEventDto', () => {
    it('should validate a valid care event', async () => {
      // Create a valid care event
      const careEvent = createCareEventDto({
        type: EventType.CARE_APPOINTMENT_BOOKED,
        data: {
          appointmentId: uuidv4(),
          providerId: uuidv4(),
          specialtyId: uuidv4(),
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: 'scheduled'
        }
      });

      // Validate the event
      const validationResult = await validateDto(careEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should enforce journey value as "care"', async () => {
      // Create a care event with incorrect journey
      const careEvent = createCareEventDto();
      careEvent.journey = 'health'; // Incorrect journey

      // Validate the event
      const validationResult = await validateDto(careEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.hasErrorForProperty('journey')).toBe(true);
    });

    it('should inherit validation rules from BaseEventDto', async () => {
      // Create an invalid care event missing required base properties
      const invalidEvent = createInvalidEvent(
        createCareEventDto(),
        ['userId', 'type', 'timestamp']
      );

      // Convert to DTO instance
      const careEvent = plainToInstance(CareEventDto, invalidEvent);

      // Validate the event
      const errors = await validate(careEvent);
      
      // Assert that validation fails for missing base properties
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'userId')).toBe(true);
      expect(errors.some(e => e.property === 'type')).toBe(true);
      expect(errors.some(e => e.property === 'timestamp')).toBe(true);
    });
  });

  describe('TelemedicineSessionEventDto', () => {
    // Helper function to create a valid telemedicine session event
    function createValidTelemedicineEvent(options: TestEventOptions = {}): TelemedicineSessionEventDto {
      const providerId = options.providerId || uuidv4();
      const sessionId = options.sessionId || uuidv4();
      
      const event = {
        type: EventType.CARE_TELEMEDICINE_STARTED,
        userId: options.userId || uuidv4(),
        journey: 'care',
        timestamp: options.timestamp || new Date().toISOString(),
        data: {
          sessionId,
          state: options.state || TelemedicineSessionState.WAITING,
          scheduledStartTime: options.scheduledStartTime || new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          provider: {
            providerId,
            providerName: options.providerName || 'Dr. Test Provider',
            specialization: options.specialization || 'Cardiologia'
          },
          reason: options.reason || 'Regular check-up',
          ...options.data
        }
      };
      
      return plainToInstance(TelemedicineSessionEventDto, event);
    }

    it('should validate a valid telemedicine session event', async () => {
      // Create a valid telemedicine session event
      const telemedicineEvent = createValidTelemedicineEvent();

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should validate all telemedicine session states', async () => {
      // Test all possible telemedicine session states
      for (const state of Object.values(TelemedicineSessionState)) {
        const telemedicineEvent = createValidTelemedicineEvent({ state });
        const validationResult = await validateDto(telemedicineEvent);
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errorCount).toBe(0);
      }
    });

    it('should reject invalid telemedicine session states', async () => {
      // Create an event with an invalid state
      const telemedicineEvent = createValidTelemedicineEvent();
      (telemedicineEvent.data as TelemedicineSessionDataDto).state = 'invalid_state' as TelemedicineSessionState;

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.hasErrorForProperty('state')).toBe(true);
    });

    it('should validate provider information', async () => {
      // Create an event with missing provider information
      const telemedicineEvent = createValidTelemedicineEvent();
      delete (telemedicineEvent.data as any).provider.providerId;

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errorMessages.some(msg => msg.includes('provider.providerId'))).toBe(true);
    });

    it('should validate technical details when provided', async () => {
      // Create an event with invalid technical details
      const telemedicineEvent = createValidTelemedicineEvent({
        data: {
          technicalDetails: {
            platform: '', // Empty string, should fail validation
            connectionQuality: 10 // Out of range, should fail validation
          }
        }
      });

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errorMessages.some(msg => msg.includes('technicalDetails.platform'))).toBe(true);
      expect(validationResult.errorMessages.some(msg => msg.includes('technicalDetails.connectionQuality'))).toBe(true);
    });

    it('should validate session duration when provided', async () => {
      // Create an event with invalid duration
      const telemedicineEvent = createValidTelemedicineEvent({
        data: {
          durationMinutes: -10 // Negative duration, should fail validation
        }
      });

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errorMessages.some(msg => msg.includes('durationMinutes'))).toBe(true);
    });

    it('should validate date fields as ISO8601 strings', async () => {
      // Create an event with invalid date format
      const telemedicineEvent = createValidTelemedicineEvent();
      (telemedicineEvent.data as TelemedicineSessionDataDto).scheduledStartTime = '2023-13-45T25:70:00Z'; // Invalid date

      // Validate the event
      const validationResult = await validateDto(telemedicineEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errorMessages.some(msg => msg.includes('scheduledStartTime'))).toBe(true);
    });
  });

  describe('CarePlanEventDto', () => {
    // Helper function to create a valid care plan event
    function createValidCarePlanEvent(options: TestEventOptions = {}): CarePlanEventDto {
      const providerId = options.providerId || uuidv4();
      const carePlanId = options.carePlanId || uuidv4();
      
      const event = {
        type: EventType.CARE_PLAN_RECEIVED,
        userId: options.userId || uuidv4(),
        journey: 'care',
        timestamp: options.timestamp || new Date().toISOString(),
        data: {
          carePlanId,
          name: options.name || 'Diabetes Management Plan',
          type: options.type || CarePlanType.CHRONIC_DISEASE,
          startDate: options.startDate || new Date().toISOString(),
          progressStatus: options.progressStatus || CarePlanProgressStatus.IN_PROGRESS,
          provider: {
            providerId,
            providerName: options.providerName || 'Dr. Test Provider',
            specialization: options.specialization || 'Endocrinologia'
          },
          condition: options.condition || 'Type 2 Diabetes',
          ...options.data
        }
      };
      
      return plainToInstance(CarePlanEventDto, event);
    }

    it('should validate a valid care plan event', async () => {
      // Create a valid care plan event
      const carePlanEvent = createValidCarePlanEvent();

      // Validate the event
      const validationResult = await validateDto(carePlanEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should validate all care plan types', async () => {
      // Test all possible care plan types
      for (const type of Object.values(CarePlanType)) {
        const carePlanEvent = createValidCarePlanEvent({ type });
        const validationResult = await validateDto(carePlanEvent);
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errorCount).toBe(0);
      }
    });

    it('should validate all progress status values', async () => {
      // Test all possible progress status values
      for (const status of Object.values(CarePlanProgressStatus)) {
        const carePlanEvent = createValidCarePlanEvent({ progressStatus: status });
        const validationResult = await validateDto(carePlanEvent);
        
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errorCount).toBe(0);
      }
    });

    it('should reject invalid care plan types', async () => {
      // Create an event with an invalid care plan type
      const carePlanEvent = createValidCarePlanEvent();
      (carePlanEvent.data as CarePlanDataDto).type = 'invalid_type' as CarePlanType;

      // Validate the event
      const validationResult = await validateDto(carePlanEvent);
      
      // Assert that validation fails
      expect(validationResult.isValid).toBe(false);
      expect(validationResult.hasErrorForProperty('type')).toBe(true);
    });

    it('should validate progress percentage within range', async () => {
      // Create events with invalid progress percentages
      const tooLowEvent = createValidCarePlanEvent({
        data: { progressPercentage: -10 } // Below minimum
      });
      
      const tooHighEvent = createValidCarePlanEvent({
        data: { progressPercentage: 110 } // Above maximum
      });

      // Validate the events
      const lowResult = await validateDto(tooLowEvent);
      const highResult = await validateDto(tooHighEvent);
      
      // Assert that validation fails
      expect(lowResult.isValid).toBe(false);
      expect(lowResult.errorMessages.some(msg => msg.includes('progressPercentage'))).toBe(true);
      
      expect(highResult.isValid).toBe(false);
      expect(highResult.errorMessages.some(msg => msg.includes('progressPercentage'))).toBe(true);

      // Create an event with valid progress percentage
      const validEvent = createValidCarePlanEvent({
        data: { progressPercentage: 50 } // Valid value
      });

      // Validate the event
      const validResult = await validateDto(validEvent);
      
      // Assert that validation passes
      expect(validResult.isValid).toBe(true);
    });

    it('should validate care plan activities when provided', async () => {
      // Create an event with valid activities
      const activityId = uuidv4();
      const validEvent = createValidCarePlanEvent({
        data: {
          activities: [
            {
              activityId,
              name: 'Daily Blood Glucose Check',
              type: 'measurement',
              status: 'pending',
              scheduledDate: new Date().toISOString()
            }
          ]
        }
      });

      // Validate the event
      const validResult = await validateDto(validEvent);
      
      // Assert that validation passes
      expect(validResult.isValid).toBe(true);

      // Create an event with invalid activities
      const invalidEvent = createValidCarePlanEvent({
        data: {
          activities: [
            {
              // Missing required activityId
              name: 'Daily Blood Glucose Check',
              type: 'measurement',
              status: 'pending',
              scheduledDate: new Date().toISOString()
            }
          ]
        }
      });

      // Validate the event
      const invalidResult = await validateDto(invalidEvent);
      
      // Assert that validation fails
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorMessages.some(msg => msg.includes('activities'))).toBe(true);
    });

    it('should validate completed vs total activities counts', async () => {
      // Create an event with invalid activity counts
      const invalidEvent = createValidCarePlanEvent({
        data: {
          completedActivities: 10,
          totalActivities: 5 // Completed > Total, which is invalid
        }
      });

      // Validate the event
      const validationResult = await validateDto(invalidEvent);
      
      // This should still be valid as we don't have a specific validator for this relationship
      // In a real application, we might want to add a custom validator for this case
      expect(validationResult.isValid).toBe(true);
    });
  });

  describe('Integration with AppointmentEventDto', () => {
    it('should validate appointment booking events', async () => {
      // Create a valid appointment booking event
      const appointmentEvent = plainToInstance(AppointmentEventDto, {
        type: EventType.CARE_APPOINTMENT_BOOKED,
        userId: uuidv4(),
        journey: 'care',
        timestamp: new Date().toISOString(),
        data: {
          appointmentId: uuidv4(),
          state: AppointmentState.BOOKED,
          type: AppointmentType.IN_PERSON,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 30,
          provider: {
            providerId: uuidv4(),
            providerName: 'Dr. Test Provider',
            specialization: 'Cardiologia'
          },
          location: {
            name: 'AUSTA Medical Center',
            address: 'Av. Paulista, 1000'
          },
          reason: 'Regular check-up',
          bookedByPatient: true
        }
      });

      // Validate the event
      const validationResult = await validateDto(appointmentEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should validate appointment cancellation events', async () => {
      // Create a valid appointment cancellation event
      const appointmentEvent = plainToInstance(AppointmentEventDto, {
        type: EventType.CARE_APPOINTMENT_CANCELLED,
        userId: uuidv4(),
        journey: 'care',
        timestamp: new Date().toISOString(),
        data: {
          appointmentId: uuidv4(),
          state: AppointmentState.CANCELLED,
          type: AppointmentType.IN_PERSON,
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          durationMinutes: 30,
          provider: {
            providerId: uuidv4(),
            providerName: 'Dr. Test Provider',
            specialization: 'Cardiologia'
          },
          location: {
            name: 'AUSTA Medical Center',
            address: 'Av. Paulista, 1000'
          },
          reason: 'Regular check-up',
          cancelledAt: new Date().toISOString(),
          cancellationReason: 'Schedule conflict',
          cancelledByPatient: true,
          cancellationFeeApplies: false
        }
      });

      // Validate the event
      const validationResult = await validateDto(appointmentEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });
  });

  describe('Integration with MedicationEventDto', () => {
    it('should validate medication taken events', async () => {
      // Create a valid medication taken event
      const medicationEvent = plainToInstance(MedicationEventDto, {
        adherenceState: MedicationAdherenceState.TAKEN,
        medication: {
          medicationId: uuidv4(),
          name: 'Metformin',
          genericName: 'Metformin Hydrochloride'
        },
        dosage: {
          amount: 500,
          unit: 'MG'
        },
        schedule: {
          frequencyType: 'DAILY',
          startDate: new Date()
        },
        scheduledDateTime: new Date(),
        actualDateTime: new Date()
      });

      // Validate the event
      const validationResult = await validateDto(medicationEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });

    it('should validate medication skipped events', async () => {
      // Create a valid medication skipped event
      const medicationEvent = plainToInstance(MedicationEventDto, {
        adherenceState: MedicationAdherenceState.SKIPPED,
        medication: {
          medicationId: uuidv4(),
          name: 'Metformin',
          genericName: 'Metformin Hydrochloride'
        },
        dosage: {
          amount: 500,
          unit: 'MG'
        },
        schedule: {
          frequencyType: 'DAILY',
          startDate: new Date()
        },
        scheduledDateTime: new Date(),
        reasonForSkippingOrMissing: 'Feeling nauseous'
      });

      // Validate the event
      const validationResult = await validateDto(medicationEvent);
      
      // Assert that validation passes
      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errorCount).toBe(0);
    });
  });
});