import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AppointmentEventDto } from '../../../src/dto/appointment-event.dto';
import { AppointmentType, AppointmentStatus } from '@austa/interfaces/journey/care';
import { EventType } from '../../../src/dto/event-types.enum';

describe('AppointmentEventDto', () => {
  // Helper function to create a valid appointment booking event
  const createValidAppointmentBookingEvent = () => ({
    type: EventType.CARE_APPOINTMENT_BOOKED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'care',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      type: AppointmentType.IN_PERSON,
      status: AppointmentStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day in future
      provider: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Dr. Maria Silva',
        specialty: 'Cardiologia',
        crm: '12345-SP'
      },
      location: {
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100'
      }
    }
  });

  // Helper function to create a valid appointment check-in event
  const createValidAppointmentCheckInEvent = () => ({
    type: EventType.CARE_APPOINTMENT_CHECKED_IN,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'care',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      status: AppointmentStatus.IN_PROGRESS,
      checkedInAt: new Date().toISOString(),
      provider: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Dr. Maria Silva'
      }
    }
  });

  // Helper function to create a valid appointment completion event
  const createValidAppointmentCompletionEvent = () => ({
    type: EventType.CARE_APPOINTMENT_COMPLETED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'care',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      status: AppointmentStatus.COMPLETED,
      completedAt: new Date().toISOString(),
      duration: 30, // minutes
      followUpRecommended: true,
      followUpTimeframe: '2 weeks',
      provider: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Dr. Maria Silva'
      }
    }
  });

  // Helper function to create a valid appointment cancellation event
  const createValidAppointmentCancellationEvent = () => ({
    type: EventType.CARE_APPOINTMENT_CANCELLED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'care',
    timestamp: new Date().toISOString(),
    data: {
      appointmentId: '123e4567-e89b-12d3-a456-426614174001',
      status: AppointmentStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
      cancellationReason: 'Patient request',
      cancellationNote: 'Scheduling conflict',
      provider: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Dr. Maria Silva'
      }
    }
  });

  describe('Appointment Booking Event Validation', () => {
    it('should validate a valid appointment booking event', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject booking event with missing appointmentId', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      delete eventData.data.appointmentId;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject booking event with invalid appointment type', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      eventData.data.type = 'INVALID_TYPE' as any;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should reject booking event with past scheduledAt date', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      eventData.data.scheduledAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day in past
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isDateAfter');
    });

    it('should reject booking event with missing provider information', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      delete eventData.data.provider;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject booking event with invalid provider CRM format', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      eventData.data.provider.crm = 'invalid-crm';
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('matches');
    });

    it('should reject booking event with missing location for IN_PERSON appointment', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      eventData.data.type = AppointmentType.IN_PERSON;
      delete eventData.data.location;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should accept booking event without location for TELEMEDICINE appointment', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      eventData.data.type = AppointmentType.TELEMEDICINE;
      delete eventData.data.location;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('Appointment Check-In Event Validation', () => {
    it('should validate a valid appointment check-in event', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject check-in event with missing appointmentId', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      delete eventData.data.appointmentId;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject check-in event with invalid status', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      eventData.data.status = AppointmentStatus.SCHEDULED;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
    });

    it('should reject check-in event with missing checkedInAt timestamp', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      delete eventData.data.checkedInAt;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject check-in event with invalid checkedInAt format', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      eventData.data.checkedInAt = 'invalid-date';
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isISO8601');
    });
  });

  describe('Appointment Completion Event Validation', () => {
    it('should validate a valid appointment completion event', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject completion event with missing appointmentId', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      delete eventData.data.appointmentId;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject completion event with invalid status', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      eventData.data.status = AppointmentStatus.SCHEDULED;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
    });

    it('should reject completion event with missing completedAt timestamp', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      delete eventData.data.completedAt;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject completion event with negative duration', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      eventData.data.duration = -10;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('min');
    });

    it('should accept completion event without followUpRecommended', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      delete eventData.data.followUpRecommended;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should require followUpTimeframe when followUpRecommended is true', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      eventData.data.followUpRecommended = true;
      delete eventData.data.followUpTimeframe;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  describe('Appointment Cancellation Event Validation', () => {
    it('should validate a valid appointment cancellation event', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject cancellation event with missing appointmentId', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      delete eventData.data.appointmentId;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject cancellation event with invalid status', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      eventData.data.status = AppointmentStatus.SCHEDULED;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
    });

    it('should reject cancellation event with missing cancelledAt timestamp', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      delete eventData.data.cancelledAt;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should reject cancellation event with missing cancellationReason', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      delete eventData.data.cancellationReason;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should accept cancellation event without cancellationNote', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      delete eventData.data.cancellationNote;
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });

  describe('Cross-Journey Integration Tests', () => {
    it('should validate appointment completion for achievement tracking', async () => {
      // Arrange
      const eventData = createValidAppointmentCompletionEvent();
      // Add achievement tracking metadata
      eventData.data.achievementProgress = {
        type: 'appointment-keeper',
        progress: 1,
        target: 3,
        streakDays: 1
      };
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate appointment cancellation with proper notice period', async () => {
      // Arrange
      const eventData = createValidAppointmentCancellationEvent();
      // Add cancellation timing information
      eventData.data.scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours in future
      eventData.data.cancellationNotice = {
        hoursBeforeAppointment: 48,
        isWithinPolicy: true
      };
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate appointment check-in with waiting time tracking', async () => {
      // Arrange
      const eventData = createValidAppointmentCheckInEvent();
      // Add waiting time information
      eventData.data.waitingTime = {
        scheduledTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        actualStartTime: new Date().toISOString(),
        waitingMinutes: 15
      };
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate appointment booking with insurance coverage information', async () => {
      // Arrange
      const eventData = createValidAppointmentBookingEvent();
      // Add insurance coverage information
      eventData.data.coverage = {
        insurancePlanId: '123e4567-e89b-12d3-a456-426614174003',
        coveragePercentage: 80,
        estimatedCost: 150.00,
        estimatedCopay: 30.00,
        requiresPreAuthorization: false
      };
      const dto = plainToInstance(AppointmentEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });
  });
});