import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CareEventDto } from '../../../src/dto/care-event.dto';
import { EventTypesEnum } from '../../../src/dto/event-types.enum';

describe('CareEventDto', () => {
  // Common valid event properties
  const validEventBase = {
    type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'care',
    timestamp: new Date().toISOString(),
  };

  describe('Common validation', () => {
    it('should validate a properly formatted care event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          specialtyId: '123e4567-e89b-12d3-a456-426614174003',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          location: 'Virtual',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should inherit validation from BaseEventDto', async () => {
      // Missing required fields from BaseEventDto
      const event = plainToInstance(CareEventDto, {
        // Missing type, userId, journey, timestamp
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific base validation errors
      const errorFields = errors.map(error => error.property);
      expect(errorFields).toContain('type');
      expect(errorFields).toContain('userId');
      expect(errorFields).toContain('journey');
      expect(errorFields).toContain('timestamp');
    });

    it('should validate that journey is "care"', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        journey: 'health', // Wrong journey
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the journey error
      const journeyError = errors.find(error => error.property === 'journey');
      expect(journeyError).toBeDefined();
    });
  });

  describe('Appointment events', () => {
    it('should validate a valid appointment booking event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          specialtyId: '123e4567-e89b-12d3-a456-426614174003',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          location: 'Virtual',
          notes: 'Regular checkup',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid appointment check-in event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_CHECKED_IN,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          checkedInAt: new Date().toISOString(),
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid appointment completed event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_COMPLETED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          completedAt: new Date().toISOString(),
          duration: 30, // minutes
          followUpRecommended: true,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid appointment cancellation event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_CANCELLED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          cancelledAt: new Date().toISOString(),
          reason: 'Schedule conflict',
          rescheduled: false,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should reject an appointment booking with past date', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          specialtyId: '123e4567-e89b-12d3-a456-426614174003',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          location: 'Virtual',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the scheduledAt error
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
    });

    it('should reject an appointment booking without required fields', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          // Missing appointmentId, providerId, scheduledAt
          specialtyId: '123e4567-e89b-12d3-a456-426614174003',
          location: 'Virtual',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Medication events', () => {
    it('should validate a valid medication taken event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_TAKEN,
        data: {
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          takenAt: new Date().toISOString(),
          dosage: {
            value: 500,
            unit: 'mg',
          },
          adherence: 'on_time',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid medication skipped event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_SKIPPED,
        data: {
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          skippedAt: new Date().toISOString(),
          reason: 'Side effects',
          reportedToProvider: true,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid medication schedule updated event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_SCHEDULE_UPDATED,
        data: {
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          updatedAt: new Date().toISOString(),
          schedule: {
            frequency: 'daily',
            times: ['08:00', '20:00'],
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days from now
          },
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should reject a medication taken event without required fields', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_TAKEN,
        data: {
          // Missing medicationId, takenAt
          dosage: {
            value: 500,
            unit: 'mg',
          },
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a medication taken event with invalid dosage', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_TAKEN,
        data: {
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          takenAt: new Date().toISOString(),
          dosage: {
            value: -500, // Negative value
            unit: 'mg',
          },
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Telemedicine events', () => {
    it('should validate a valid telemedicine session started event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_TELEMEDICINE_SESSION_STARTED,
        data: {
          sessionId: '123e4567-e89b-12d3-a456-426614174001',
          appointmentId: '123e4567-e89b-12d3-a456-426614174002',
          providerId: '123e4567-e89b-12d3-a456-426614174003',
          startedAt: new Date().toISOString(),
          medium: 'video',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid telemedicine session ended event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_TELEMEDICINE_SESSION_ENDED,
        data: {
          sessionId: '123e4567-e89b-12d3-a456-426614174001',
          endedAt: new Date().toISOString(),
          duration: 25, // minutes
          rating: 5,
          technicalIssues: false,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should reject a telemedicine session started event without required fields', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_TELEMEDICINE_SESSION_STARTED,
        data: {
          // Missing sessionId, appointmentId, providerId
          startedAt: new Date().toISOString(),
          medium: 'video',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a telemedicine session with invalid medium', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_TELEMEDICINE_SESSION_STARTED,
        data: {
          sessionId: '123e4567-e89b-12d3-a456-426614174001',
          appointmentId: '123e4567-e89b-12d3-a456-426614174002',
          providerId: '123e4567-e89b-12d3-a456-426614174003',
          startedAt: new Date().toISOString(),
          medium: 'hologram', // Invalid medium
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Care plan events', () => {
    it('should validate a valid care plan created event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_PLAN_CREATED,
        data: {
          planId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          createdAt: new Date().toISOString(),
          title: 'Diabetes Management Plan',
          description: 'Comprehensive plan for managing type 2 diabetes',
          goals: [
            { id: '1', description: 'Maintain blood glucose levels', targetDate: new Date(Date.now() + 30 * 86400000).toISOString() },
            { id: '2', description: 'Regular exercise routine', targetDate: new Date(Date.now() + 14 * 86400000).toISOString() },
          ],
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should validate a valid care plan progress updated event', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_PLAN_PROGRESS_UPDATED,
        data: {
          planId: '123e4567-e89b-12d3-a456-426614174001',
          updatedAt: new Date().toISOString(),
          goalUpdates: [
            { id: '1', status: 'in_progress', progress: 75, notes: 'Glucose levels improving' },
            { id: '2', status: 'completed', progress: 100, completedAt: new Date().toISOString() },
          ],
          overallProgress: 85,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBe(0);
    });

    it('should reject a care plan created event without required fields', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_PLAN_CREATED,
        data: {
          // Missing planId, providerId
          createdAt: new Date().toISOString(),
          title: 'Diabetes Management Plan',
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject a care plan progress update with invalid progress value', async () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_PLAN_PROGRESS_UPDATED,
        data: {
          planId: '123e4567-e89b-12d3-a456-426614174001',
          updatedAt: new Date().toISOString(),
          goalUpdates: [
            { id: '1', status: 'in_progress', progress: 120, notes: 'Glucose levels improving' }, // Progress > 100
          ],
          overallProgress: 85,
        },
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with event processing', () => {
    it('should properly serialize to JSON for event processing', () => {
      const event = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          specialtyId: '123e4567-e89b-12d3-a456-426614174003',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          location: 'Virtual',
        },
      });

      const serialized = JSON.stringify(event);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.type).toBe(EventTypesEnum.CARE_APPOINTMENT_BOOKED);
      expect(deserialized.journey).toBe('care');
      expect(deserialized.userId).toBe(validEventBase.userId);
      expect(deserialized.data.appointmentId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });

    it('should handle event type-specific validation during processing', async () => {
      // This test simulates how the event processor would validate events based on type
      const appointmentEvent = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          appointmentId: '123e4567-e89b-12d3-a456-426614174001',
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        },
      });

      const medicationEvent = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_MEDICATION_TAKEN,
        data: {
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          takenAt: new Date().toISOString(),
        },
      });

      // Validate both events
      const appointmentErrors = await validate(appointmentEvent);
      const medicationErrors = await validate(medicationEvent);

      // Both should pass their respective validations
      expect(appointmentErrors.length).toBe(0);
      expect(medicationErrors.length).toBe(0);

      // Now try with wrong data structure for the event type
      const invalidTypeEvent = plainToInstance(CareEventDto, {
        ...validEventBase,
        type: EventTypesEnum.CARE_APPOINTMENT_BOOKED,
        data: {
          // Using medication data for appointment event
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          takenAt: new Date().toISOString(),
        },
      });

      const invalidTypeErrors = await validate(invalidTypeEvent);
      expect(invalidTypeErrors.length).toBeGreaterThan(0);
    });
  });
});