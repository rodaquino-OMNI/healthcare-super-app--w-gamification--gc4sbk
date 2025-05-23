import { plainToInstance } from 'class-transformer';
import {
  MedicationEventDto,
  MedicationAdherenceState,
  MedicationDosageUnit,
  MedicationFrequencyType,
  MedicationIdentificationDto,
  MedicationDosageDto,
  MedicationScheduleDto
} from '../../../src/dto/medication-event.dto';
import {
  validateDto,
  createInvalidEvent,
  createEventWithInvalidValues
} from './test-utils';

describe('MedicationEventDto', () => {
  // Test data for a valid medication event
  const validMedicationId = '123e4567-e89b-12d3-a456-426614174000';
  const validScheduledDateTime = new Date('2023-05-15T08:00:00Z');
  const validActualDateTime = new Date('2023-05-15T08:05:00Z');

  // Helper function to create a valid medication event
  const createValidMedicationEvent = (adherenceState: MedicationAdherenceState = MedicationAdherenceState.TAKEN) => {
    return {
      adherenceState,
      medication: {
        medicationId: validMedicationId,
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        manufacturer: 'Generic Pharma',
        ndc: '12345-678-90'
      },
      dosage: {
        amount: 20,
        unit: MedicationDosageUnit.MG,
        instructions: 'Take with water'
      },
      schedule: {
        frequencyType: MedicationFrequencyType.DAILY,
        frequencyValue: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      },
      scheduledDateTime: validScheduledDateTime,
      actualDateTime: validActualDateTime,
      notes: 'Regular dose',
      isRescheduled: false
    };
  };

  describe('Valid medication events', () => {
    it('should validate a medication TAKEN event', async () => {
      // Create a valid medication taken event
      const eventData = createValidMedicationEvent(MedicationAdherenceState.TAKEN);
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate a medication SKIPPED event', async () => {
      // Create a valid medication skipped event with reason
      const eventData = createValidMedicationEvent(MedicationAdherenceState.SKIPPED);
      eventData.reasonForSkippingOrMissing = 'Doctor advised to skip this dose';
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate a medication MISSED event', async () => {
      // Create a valid medication missed event
      const eventData = createValidMedicationEvent(MedicationAdherenceState.MISSED);
      eventData.reasonForSkippingOrMissing = 'Forgot to take medication';
      eventData.requiresAttention = true;
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate a medication SCHEDULED event', async () => {
      // Create a valid medication scheduled event (no actualDateTime)
      const eventData = createValidMedicationEvent(MedicationAdherenceState.SCHEDULED);
      delete eventData.actualDateTime; // Scheduled events don't have an actual time yet
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });

    it('should validate a rescheduled medication event', async () => {
      // Create a valid rescheduled medication event
      const eventData = createValidMedicationEvent(MedicationAdherenceState.TAKEN);
      eventData.isRescheduled = true;
      eventData.notes = 'Rescheduled due to appointment conflict';
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
      expect(result.errorCount).toBe(0);
    });
  });

  describe('Medication identification validation', () => {
    it('should require a valid medication ID', async () => {
      // Create an event with invalid medication ID
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'medication.medicationId': 'not-a-uuid'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('medication')).toBe(true);
    });

    it('should require a medication name', async () => {
      // Create an event with missing medication name
      const eventData = createValidMedicationEvent();
      const invalidEvent = createInvalidEvent(eventData, ['medication.name']);
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('medication')).toBe(true);
    });

    it('should validate medication name length', async () => {
      // Create an event with too long medication name
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'medication.name': 'A'.repeat(256) // Max length is 255
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('medication')).toBe(true);
    });

    it('should allow optional manufacturer information', async () => {
      // Create an event without manufacturer
      const eventData = createValidMedicationEvent();
      delete eventData.medication.manufacturer;
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });

    it('should validate NDC format when provided', async () => {
      // Create an event with invalid NDC format
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'medication.ndc': 'A'.repeat(51) // Max length is 50
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('medication')).toBe(true);
    });
  });

  describe('Dosage validation', () => {
    it('should require a positive dosage amount', async () => {
      // Create an event with invalid dosage amount
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'dosage.amount': -10
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('dosage')).toBe(true);
    });

    it('should require a valid dosage unit', async () => {
      // Create an event with invalid dosage unit
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'dosage.unit': 'INVALID_UNIT'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('dosage')).toBe(true);
    });

    it('should validate all dosage units', async () => {
      // Test all valid dosage units
      for (const unit of Object.values(MedicationDosageUnit)) {
        const eventData = createValidMedicationEvent();
        eventData.dosage.unit = unit;
        const dto = plainToInstance(MedicationEventDto, eventData);

        // Validate the DTO
        const result = await validateDto(dto);
        expect(result.isValid).toBe(true);
      }
    });

    it('should validate dosage instructions length', async () => {
      // Create an event with too long instructions
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'dosage.instructions': 'A'.repeat(256) // Max length is 255
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('dosage')).toBe(true);
    });
  });

  describe('Schedule validation', () => {
    it('should require a valid frequency type', async () => {
      // Create an event with invalid frequency type
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'schedule.frequencyType': 'INVALID_FREQUENCY'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('schedule')).toBe(true);
    });

    it('should validate all frequency types', async () => {
      // Test all valid frequency types
      for (const frequencyType of Object.values(MedicationFrequencyType)) {
        const eventData = createValidMedicationEvent();
        eventData.schedule.frequencyType = frequencyType;
        const dto = plainToInstance(MedicationEventDto, eventData);

        // Validate the DTO
        const result = await validateDto(dto);
        expect(result.isValid).toBe(true);
      }
    });

    it('should require a positive frequency value when provided', async () => {
      // Create an event with invalid frequency value
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'schedule.frequencyValue': -2
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('schedule')).toBe(true);
    });

    it('should validate date formats for start and end dates', async () => {
      // Create an event with invalid date format
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'schedule.startDate': 'not-a-date',
        'schedule.endDate': 'also-not-a-date'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('schedule')).toBe(true);
    });

    it('should validate custom schedule length', async () => {
      // Create an event with too long custom schedule
      const eventData = createValidMedicationEvent();
      eventData.schedule.frequencyType = MedicationFrequencyType.CUSTOM;
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'schedule.customSchedule': 'A'.repeat(256) // Max length is 255
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('schedule')).toBe(true);
    });
  });

  describe('Adherence state validation', () => {
    it('should require a valid adherence state', async () => {
      // Create an event with invalid adherence state
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'adherenceState': 'INVALID_STATE'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('adherenceState')).toBe(true);
    });

    it('should validate all adherence states', async () => {
      // Test all valid adherence states
      for (const state of Object.values(MedicationAdherenceState)) {
        const eventData = createValidMedicationEvent();
        eventData.adherenceState = state;
        
        // For SCHEDULED state, remove actualDateTime
        if (state === MedicationAdherenceState.SCHEDULED) {
          delete eventData.actualDateTime;
        }
        
        const dto = plainToInstance(MedicationEventDto, eventData);

        // Validate the DTO
        const result = await validateDto(dto);
        expect(result.isValid).toBe(true);
      }
    });

    it('should validate reason for skipping when state is SKIPPED', async () => {
      // Create a SKIPPED event without a reason
      const eventData = createValidMedicationEvent(MedicationAdherenceState.SKIPPED);
      delete eventData.reasonForSkippingOrMissing; // Remove the reason
      const dto = plainToInstance(MedicationEventDto, eventData);

      // The validation should pass because reasonForSkippingOrMissing is optional
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });

    it('should validate reason length for skipping or missing', async () => {
      // Create an event with too long reason
      const eventData = createValidMedicationEvent(MedicationAdherenceState.MISSED);
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'reasonForSkippingOrMissing': 'A'.repeat(256) // Max length is 255
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('reasonForSkippingOrMissing')).toBe(true);
    });
  });

  describe('Date and time validation', () => {
    it('should require a valid scheduled date time', async () => {
      // Create an event with invalid scheduled date time
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'scheduledDateTime': 'not-a-date'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('scheduledDateTime')).toBe(true);
    });

    it('should validate actual date time format when provided', async () => {
      // Create an event with invalid actual date time
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'actualDateTime': 'not-a-date'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('actualDateTime')).toBe(true);
    });

    it('should allow missing actual date time for SCHEDULED state', async () => {
      // Create a SCHEDULED event without actual date time
      const eventData = createValidMedicationEvent(MedicationAdherenceState.SCHEDULED);
      delete eventData.actualDateTime;
      const dto = plainToInstance(MedicationEventDto, eventData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Notes and additional fields validation', () => {
    it('should validate notes length', async () => {
      // Create an event with too long notes
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'notes': 'A'.repeat(501) // Max length is 500
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('notes')).toBe(true);
    });

    it('should validate isRescheduled as boolean', async () => {
      // Create an event with invalid isRescheduled type
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'isRescheduled': 'not-a-boolean'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('isRescheduled')).toBe(true);
    });

    it('should validate requiresAttention as boolean', async () => {
      // Create an event with invalid requiresAttention type
      const eventData = createValidMedicationEvent();
      const invalidEvent = createEventWithInvalidValues(eventData, {
        'requiresAttention': 'not-a-boolean'
      });
      const dto = plainToInstance(MedicationEventDto, invalidEvent);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('requiresAttention')).toBe(true);
    });
  });

  describe('Nested DTO validation', () => {
    it('should validate MedicationIdentificationDto independently', async () => {
      // Create a valid medication identification
      const medicationData = {
        medicationId: validMedicationId,
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        manufacturer: 'Generic Pharma',
        ndc: '12345-678-90'
      };
      const dto = plainToInstance(MedicationIdentificationDto, medicationData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });

    it('should validate MedicationDosageDto independently', async () => {
      // Create a valid medication dosage
      const dosageData = {
        amount: 20,
        unit: MedicationDosageUnit.MG,
        instructions: 'Take with water'
      };
      const dto = plainToInstance(MedicationDosageDto, dosageData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });

    it('should validate MedicationScheduleDto independently', async () => {
      // Create a valid medication schedule
      const scheduleData = {
        frequencyType: MedicationFrequencyType.DAILY,
        frequencyValue: 1,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      };
      const dto = plainToInstance(MedicationScheduleDto, scheduleData);

      // Validate the DTO
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Integration with gamification rules', () => {
    it('should support medication adherence streak tracking', async () => {
      // Create a medication taken event with adherence streak information
      const eventData = createValidMedicationEvent(MedicationAdherenceState.TAKEN);
      eventData.data = {
        adherenceStreak: 7, // 7-day streak
        streakStartDate: new Date('2023-05-08'),
        pointsEarned: 10,
        isNewRecord: false
      };
      const dto = plainToInstance(MedicationEventDto, eventData);

      // The validation should pass because additional properties are allowed
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });

    it('should support achievement notification for perfect adherence', async () => {
      // Create a medication taken event that triggers an achievement
      const eventData = createValidMedicationEvent(MedicationAdherenceState.TAKEN);
      eventData.data = {
        adherenceStreak: 30, // 30-day streak
        streakStartDate: new Date('2023-04-15'),
        pointsEarned: 50,
        isNewRecord: true,
        achievements: [
          {
            id: 'medication-adherence-30',
            name: 'Aderência ao Tratamento',
            level: 2,
            description: 'Tome seus medicamentos conforme prescrito por 30 dias consecutivos',
            pointsAwarded: 100
          }
        ]
      };
      const dto = plainToInstance(MedicationEventDto, eventData);

      // The validation should pass because additional properties are allowed
      const result = await validateDto(dto);
      expect(result.isValid).toBe(true);
    });
  });
});