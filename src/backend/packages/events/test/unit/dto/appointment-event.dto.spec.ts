import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  AppointmentEventBaseDto,
  AppointmentBookedEventDto,
  AppointmentCheckedInEventDto,
  AppointmentCompletedEventDto,
  AppointmentCancelledEventDto,
  AppointmentRescheduledEventDto,
  AppointmentNoShowEventDto,
  AppointmentState,
  AppointmentType,
  ProviderInfoDto,
  LocationInfoDto
} from '../../../src/dto/appointment-event.dto';
import { validateDto, extractErrorMessages } from './test-utils';
import { v4 as uuidv4 } from 'uuid';

describe('AppointmentEventDto', () => {
  // Helper function to create a valid provider info object
  const createValidProviderInfo = (): ProviderInfoDto => ({
    providerId: uuidv4(),
    providerName: 'Dr. Test Provider',
    specialization: 'Cardiologia',
    rating: 4.5
  });

  // Helper function to create a valid location info object
  const createValidLocationInfo = (): LocationInfoDto => ({
    name: 'AUSTA Medical Center',
    address: 'Av. Paulista, 1000, São Paulo, SP',
    coordinates: [23.5505, 46.6333],
    additionalInfo: { floor: 5, room: '505' }
  });

  // Helper function to create a valid base appointment event
  const createValidBaseAppointment = (overrides = {}): Partial<AppointmentEventBaseDto> => ({
    appointmentId: uuidv4(),
    state: AppointmentState.BOOKED,
    type: AppointmentType.IN_PERSON,
    scheduledAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    durationMinutes: 30,
    provider: createValidProviderInfo(),
    location: createValidLocationInfo(),
    reason: 'Annual checkup',
    isFirstVisit: false,
    notes: 'Please bring previous test results',
    ...overrides
  });

  describe('AppointmentEventBaseDto', () => {
    it('should validate a valid appointment base event', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment();
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = {};
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('appointmentId')).toBe(true);
      expect(result.hasErrorForProperty('state')).toBe(true);
      expect(result.hasErrorForProperty('type')).toBe(true);
      expect(result.hasErrorForProperty('scheduledAt')).toBe(true);
      expect(result.hasErrorForProperty('durationMinutes')).toBe(true);
      expect(result.hasErrorForProperty('provider')).toBe(true);
      expect(result.hasErrorForProperty('location')).toBe(true);
      expect(result.hasErrorForProperty('reason')).toBe(true);
    });

    it('should fail validation when appointmentId is not a UUID', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ appointmentId: 'not-a-uuid' });
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('appointmentId')).toBe(true);
    });

    it('should fail validation when state is not a valid enum value', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: 'invalid-state' });
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('state')).toBe(true);
    });

    it('should fail validation when type is not a valid enum value', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ type: 'invalid-type' });
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('type')).toBe(true);
    });

    it('should fail validation when scheduledAt is not a valid ISO 8601 date', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ scheduledAt: 'not-a-date' });
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('scheduledAt')).toBe(true);
    });

    it('should fail validation when durationMinutes is less than 5', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ durationMinutes: 3 });
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('durationMinutes')).toBe(true);
    });
  });

  describe('ProviderInfoDto', () => {
    it('should validate a valid provider info', async () => {
      // Arrange
      const providerData = createValidProviderInfo();
      const dto = plainToInstance(ProviderInfoDto, providerData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const providerData = {};
      const dto = plainToInstance(ProviderInfoDto, providerData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('providerId')).toBe(true);
      expect(result.hasErrorForProperty('providerName')).toBe(true);
      expect(result.hasErrorForProperty('specialization')).toBe(true);
    });

    it('should fail validation when providerId is not a UUID', async () => {
      // Arrange
      const providerData = { ...createValidProviderInfo(), providerId: 'not-a-uuid' };
      const dto = plainToInstance(ProviderInfoDto, providerData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('providerId')).toBe(true);
    });

    it('should fail validation when rating is outside the valid range', async () => {
      // Arrange - Test with rating below minimum
      const providerDataLow = { ...createValidProviderInfo(), rating: 0 };
      const dtoLow = plainToInstance(ProviderInfoDto, providerDataLow);

      // Arrange - Test with rating above maximum
      const providerDataHigh = { ...createValidProviderInfo(), rating: 6 };
      const dtoHigh = plainToInstance(ProviderInfoDto, providerDataHigh);

      // Act
      const resultLow = await validateDto(dtoLow);
      const resultHigh = await validateDto(dtoHigh);

      // Assert
      expect(resultLow.isValid).toBe(false);
      expect(resultLow.hasErrorForProperty('rating')).toBe(true);
      
      expect(resultHigh.isValid).toBe(false);
      expect(resultHigh.hasErrorForProperty('rating')).toBe(true);
    });

    it('should validate when optional rating is not provided', async () => {
      // Arrange
      const providerData = { 
        providerId: uuidv4(),
        providerName: 'Dr. Test Provider',
        specialization: 'Cardiologia'
      };
      const dto = plainToInstance(ProviderInfoDto, providerData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('LocationInfoDto', () => {
    it('should validate a valid location info', async () => {
      // Arrange
      const locationData = createValidLocationInfo();
      const dto = plainToInstance(LocationInfoDto, locationData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const locationData = {};
      const dto = plainToInstance(LocationInfoDto, locationData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('name')).toBe(true);
      expect(result.hasErrorForProperty('address')).toBe(true);
    });

    it('should validate when optional fields are not provided', async () => {
      // Arrange
      const locationData = {
        name: 'AUSTA Medical Center',
        address: 'Av. Paulista, 1000, São Paulo, SP'
      };
      const dto = plainToInstance(LocationInfoDto, locationData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when coordinates array is too small', async () => {
      // Arrange
      const locationData = { ...createValidLocationInfo(), coordinates: [23.5505] };
      const dto = plainToInstance(LocationInfoDto, locationData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('coordinates')).toBe(true);
    });

    it('should fail validation when coordinates contains non-numeric values', async () => {
      // Arrange
      const locationData = { ...createValidLocationInfo(), coordinates: ['23.5505', '46.6333'] };
      const dto = plainToInstance(LocationInfoDto, locationData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('coordinates')).toBe(true);
    });
  });

  describe('AppointmentBookedEventDto', () => {
    it('should validate a valid appointment booked event', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment(),
        bookedByPatient: true,
        requiresPreparation: true,
        preparationInstructions: 'Fast for 8 hours before the appointment'
      };
      const dto = plainToInstance(AppointmentBookedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when bookedByPatient is missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment();
      const dto = plainToInstance(AppointmentBookedEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('bookedByPatient')).toBe(true);
    });

    it('should validate when optional fields are not provided', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment(),
        bookedByPatient: true
      };
      const dto = plainToInstance(AppointmentBookedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate with preparation instructions when requiresPreparation is true', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment(),
        bookedByPatient: true,
        requiresPreparation: true,
        preparationInstructions: 'Fast for 8 hours before the appointment'
      };
      const dto = plainToInstance(AppointmentBookedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('AppointmentCheckedInEventDto', () => {
    it('should validate a valid appointment checked-in event', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.CHECKED_IN }),
        checkedInAt: new Date().toISOString(),
        onTime: true,
        checkInNotes: 'Patient arrived 5 minutes early'
      };
      const dto = plainToInstance(AppointmentCheckedInEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: AppointmentState.CHECKED_IN });
      const dto = plainToInstance(AppointmentCheckedInEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('checkedInAt')).toBe(true);
      expect(result.hasErrorForProperty('onTime')).toBe(true);
    });

    it('should fail validation when checkedInAt is not a valid ISO 8601 date', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.CHECKED_IN }),
        checkedInAt: 'not-a-date',
        onTime: true
      };
      const dto = plainToInstance(AppointmentCheckedInEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('checkedInAt')).toBe(true);
    });

    it('should validate when optional checkInNotes is not provided', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.CHECKED_IN }),
        checkedInAt: new Date().toISOString(),
        onTime: true
      };
      const dto = plainToInstance(AppointmentCheckedInEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('AppointmentCompletedEventDto', () => {
    it('should validate a valid appointment completed event', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.COMPLETED }),
        completedAt: new Date().toISOString(),
        followUpRecommended: true,
        followUpTimeframeDays: 30,
        summary: 'Patient is in good health. Recommended follow-up in 30 days.'
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: AppointmentState.COMPLETED });
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('completedAt')).toBe(true);
      expect(result.hasErrorForProperty('followUpRecommended')).toBe(true);
    });

    it('should fail validation when completedAt is not a valid ISO 8601 date', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.COMPLETED }),
        completedAt: 'not-a-date',
        followUpRecommended: true
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('completedAt')).toBe(true);
    });

    it('should fail validation when followUpTimeframeDays is less than 1', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.COMPLETED }),
        completedAt: new Date().toISOString(),
        followUpRecommended: true,
        followUpTimeframeDays: 0
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('followUpTimeframeDays')).toBe(true);
    });

    it('should validate when followUpTimeframeDays is not provided and followUpRecommended is false', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.COMPLETED }),
        completedAt: new Date().toISOString(),
        followUpRecommended: false
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('AppointmentCancelledEventDto', () => {
    it('should validate a valid appointment cancelled event', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.CANCELLED }),
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'Patient requested cancellation',
        cancelledByPatient: true,
        cancellationFeeApplies: false
      };
      const dto = plainToInstance(AppointmentCancelledEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: AppointmentState.CANCELLED });
      const dto = plainToInstance(AppointmentCancelledEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('cancelledAt')).toBe(true);
      expect(result.hasErrorForProperty('cancellationReason')).toBe(true);
      expect(result.hasErrorForProperty('cancelledByPatient')).toBe(true);
      expect(result.hasErrorForProperty('cancellationFeeApplies')).toBe(true);
    });

    it('should fail validation when cancelledAt is not a valid ISO 8601 date', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.CANCELLED }),
        cancelledAt: 'not-a-date',
        cancellationReason: 'Patient requested cancellation',
        cancelledByPatient: true,
        cancellationFeeApplies: false
      };
      const dto = plainToInstance(AppointmentCancelledEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('cancelledAt')).toBe(true);
    });
  });

  describe('AppointmentRescheduledEventDto', () => {
    it('should validate a valid appointment rescheduled event', async () => {
      // Arrange
      const originalDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday
      const newDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
      
      const appointmentData = {
        ...createValidBaseAppointment({ 
          state: AppointmentState.RESCHEDULED,
          scheduledAt: newDate
        }),
        rescheduledAt: new Date().toISOString(),
        previousScheduledAt: originalDate,
        reschedulingReason: 'Provider unavailable',
        rescheduledByPatient: false
      };
      const dto = plainToInstance(AppointmentRescheduledEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: AppointmentState.RESCHEDULED });
      const dto = plainToInstance(AppointmentRescheduledEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('rescheduledAt')).toBe(true);
      expect(result.hasErrorForProperty('previousScheduledAt')).toBe(true);
      expect(result.hasErrorForProperty('reschedulingReason')).toBe(true);
      expect(result.hasErrorForProperty('rescheduledByPatient')).toBe(true);
    });

    it('should fail validation when date fields are not valid ISO 8601 dates', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.RESCHEDULED }),
        rescheduledAt: 'not-a-date',
        previousScheduledAt: 'also-not-a-date',
        reschedulingReason: 'Provider unavailable',
        rescheduledByPatient: false
      };
      const dto = plainToInstance(AppointmentRescheduledEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('rescheduledAt')).toBe(true);
      expect(result.hasErrorForProperty('previousScheduledAt')).toBe(true);
    });
  });

  describe('AppointmentNoShowEventDto', () => {
    it('should validate a valid appointment no-show event', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.NO_SHOW }),
        recordedAt: new Date().toISOString(),
        noShowFeeApplies: true,
        noShowNotes: 'Patient did not call to cancel'
      };
      const dto = plainToInstance(AppointmentNoShowEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when required fields are missing', async () => {
      // Arrange
      const appointmentData = createValidBaseAppointment({ state: AppointmentState.NO_SHOW });
      const dto = plainToInstance(AppointmentNoShowEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('recordedAt')).toBe(true);
      expect(result.hasErrorForProperty('noShowFeeApplies')).toBe(true);
    });

    it('should fail validation when recordedAt is not a valid ISO 8601 date', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.NO_SHOW }),
        recordedAt: 'not-a-date',
        noShowFeeApplies: true
      };
      const dto = plainToInstance(AppointmentNoShowEventDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('recordedAt')).toBe(true);
    });

    it('should validate when optional noShowNotes is not provided', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.NO_SHOW }),
        recordedAt: new Date().toISOString(),
        noShowFeeApplies: true
      };
      const dto = plainToInstance(AppointmentNoShowEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('State Transitions', () => {
    it('should validate when previousState is provided', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment(),
        state: AppointmentState.CHECKED_IN,
        previousState: AppointmentState.BOOKED
      };
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when previousState is not a valid enum value', async () => {
      // Arrange
      const appointmentData = {
        ...createValidBaseAppointment(),
        state: AppointmentState.CHECKED_IN,
        previousState: 'invalid-state'
      };
      const dto = plainToInstance(AppointmentEventBaseDto, appointmentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('previousState')).toBe(true);
    });
  });

  describe('Integration with Gamification Rules', () => {
    it('should validate appointment completion for gamification processing', async () => {
      // Arrange - Create a completed appointment that would trigger gamification rules
      const appointmentData = {
        ...createValidBaseAppointment({ state: AppointmentState.COMPLETED }),
        completedAt: new Date().toISOString(),
        followUpRecommended: true,
        followUpTimeframeDays: 30,
        summary: 'Patient is in good health. Recommended follow-up in 30 days.'
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      // In a real implementation, we would verify that this event triggers the appropriate
      // gamification rules, but for this unit test, we're just ensuring the DTO is valid
    });

    it('should validate appointment attendance streak for achievements', async () => {
      // Arrange - Create a completed appointment with previous state for streak tracking
      const appointmentData = {
        ...createValidBaseAppointment({ 
          state: AppointmentState.COMPLETED,
          previousState: AppointmentState.CHECKED_IN
        }),
        completedAt: new Date().toISOString(),
        followUpRecommended: false,
        summary: 'Regular check-up completed successfully.'
      };
      const dto = plainToInstance(AppointmentCompletedEventDto, appointmentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      // In a real implementation, we would verify that this event contributes to
      // the appointment-keeper achievement, but for this unit test, we're just
      // ensuring the DTO is valid for streak tracking
    });
  });
});