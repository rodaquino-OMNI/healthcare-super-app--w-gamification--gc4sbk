import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import {
  MedicationEventDto,
  MedicationTakenEventDto,
  MedicationMissedEventDto,
  MedicationAddedEventDto,
  MedicationRefilledEventDto,
  MedicationIdentifierDto,
  MedicationDosageDto,
  MedicationAdherenceStatusDto,
  MedicationAdherenceStatus,
  MedicationDosageUnit
} from '../../../src/dto/medication-event.dto';
import { CareEventType } from '../../../src/interfaces/journey-events.interface';
import {
  validateDto,
  hasValidationErrors,
  hasPropertyValidationError,
  hasConstraintValidationError
} from './test-utils';

describe('MedicationEventDto', () => {
  // Helper function to create a valid medication identifier
  const createValidMedicationIdentifier = (): MedicationIdentifierDto => {
    return {
      id: uuidv4(),
      name: 'Lisinopril',
      code: '12345-6789-01',
      type: 'antihypertensive'
    };
  };

  // Helper function to create a valid medication dosage
  const createValidMedicationDosage = (): MedicationDosageDto => {
    return {
      amount: 10,
      unit: MedicationDosageUnit.MG,
      instructions: 'Take with food'
    };
  };

  // Helper function to create a valid base medication event
  const createValidMedicationEvent = (): MedicationEventDto => {
    return {
      type: CareEventType.MEDICATION_TAKEN,
      userId: uuidv4(),
      medication: createValidMedicationIdentifier(),
      timestamp: new Date().toISOString(),
      correlationId: uuidv4()
    };
  };

  describe('MedicationIdentifierDto', () => {
    it('should validate a valid medication identifier', async () => {
      // Arrange
      const medicationIdentifier = createValidMedicationIdentifier();
      const dto = plainToInstance(MedicationIdentifierDto, medicationIdentifier);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require id and name fields', async () => {
      // Arrange
      const medicationIdentifier = {
        code: '12345-6789-01',
        type: 'antihypertensive'
      };
      const dto = plainToInstance(MedicationIdentifierDto, medicationIdentifier);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'id')).toBe(true);
      expect(hasPropertyValidationError(errors, 'name')).toBe(true);
    });

    it('should validate id as UUID', async () => {
      // Arrange
      const medicationIdentifier = {
        ...createValidMedicationIdentifier(),
        id: 'not-a-uuid'
      };
      const dto = plainToInstance(MedicationIdentifierDto, medicationIdentifier);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'id')).toBe(true);
      expect(hasConstraintValidationError(errors, 'id', 'isUuid')).toBe(true);
    });

    it('should allow optional fields to be omitted', async () => {
      // Arrange
      const medicationIdentifier = {
        id: uuidv4(),
        name: 'Lisinopril'
      };
      const dto = plainToInstance(MedicationIdentifierDto, medicationIdentifier);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('MedicationDosageDto', () => {
    it('should validate a valid medication dosage', async () => {
      // Arrange
      const medicationDosage = createValidMedicationDosage();
      const dto = plainToInstance(MedicationDosageDto, medicationDosage);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require amount and unit fields', async () => {
      // Arrange
      const medicationDosage = {
        instructions: 'Take with food'
      };
      const dto = plainToInstance(MedicationDosageDto, medicationDosage);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'amount')).toBe(true);
      expect(hasPropertyValidationError(errors, 'unit')).toBe(true);
    });

    it('should validate amount as a positive number', async () => {
      // Arrange
      const medicationDosage = {
        ...createValidMedicationDosage(),
        amount: -5
      };
      const dto = plainToInstance(MedicationDosageDto, medicationDosage);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'amount')).toBe(true);
      expect(hasConstraintValidationError(errors, 'amount', 'min')).toBe(true);
    });

    it('should validate unit as a valid enum value', async () => {
      // Arrange
      const medicationDosage = {
        ...createValidMedicationDosage(),
        unit: 'invalid-unit'
      };
      const dto = plainToInstance(MedicationDosageDto, medicationDosage);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'unit')).toBe(true);
      expect(hasConstraintValidationError(errors, 'unit', 'isEnum')).toBe(true);
    });

    it('should allow instructions to be omitted', async () => {
      // Arrange
      const medicationDosage = {
        amount: 10,
        unit: MedicationDosageUnit.MG
      };
      const dto = plainToInstance(MedicationDosageDto, medicationDosage);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('MedicationEventDto', () => {
    it('should validate a valid medication event', async () => {
      // Arrange
      const medicationEvent = createValidMedicationEvent();
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require type, userId, medication, and timestamp fields', async () => {
      // Arrange
      const medicationEvent = {
        correlationId: uuidv4()
      };
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
      expect(hasPropertyValidationError(errors, 'userId')).toBe(true);
      expect(hasPropertyValidationError(errors, 'medication')).toBe(true);
      expect(hasPropertyValidationError(errors, 'timestamp')).toBe(true);
    });

    it('should validate type as a valid enum value', async () => {
      // Arrange
      const medicationEvent = {
        ...createValidMedicationEvent(),
        type: 'INVALID_TYPE'
      };
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
      expect(hasConstraintValidationError(errors, 'type', 'isEnum')).toBe(true);
    });

    it('should validate userId as UUID', async () => {
      // Arrange
      const medicationEvent = {
        ...createValidMedicationEvent(),
        userId: 'not-a-uuid'
      };
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'userId')).toBe(true);
      expect(hasConstraintValidationError(errors, 'userId', 'isUuid')).toBe(true);
    });

    it('should validate timestamp as ISO 8601 format', async () => {
      // Arrange
      const medicationEvent = {
        ...createValidMedicationEvent(),
        timestamp: 'not-a-date'
      };
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'timestamp')).toBe(true);
      expect(hasConstraintValidationError(errors, 'timestamp', 'isIso8601')).toBe(true);
    });

    it('should validate nested medication object', async () => {
      // Arrange
      const medicationEvent = {
        ...createValidMedicationEvent(),
        medication: {
          // Missing required fields
        }
      };
      const dto = plainToInstance(MedicationEventDto, medicationEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'medication')).toBe(true);
    });

    it('should allow correlationId to be omitted', async () => {
      // Arrange
      const { correlationId, ...medicationEventWithoutCorrelationId } = createValidMedicationEvent();
      const dto = plainToInstance(MedicationEventDto, medicationEventWithoutCorrelationId);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('MedicationTakenEventDto', () => {
    // Helper function to create a valid medication taken event
    const createValidMedicationTakenEvent = (): MedicationTakenEventDto => {
      return {
        type: CareEventType.MEDICATION_TAKEN,
        userId: uuidv4(),
        medication: createValidMedicationIdentifier(),
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        dosage: createValidMedicationDosage(),
        scheduledTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        takenOnTime: true,
        notes: 'Feeling good after taking medication'
      };
    };

    it('should validate a valid medication taken event', async () => {
      // Arrange
      const medicationTakenEvent = createValidMedicationTakenEvent();
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require dosage, scheduledTime, and takenOnTime fields', async () => {
      // Arrange
      const { dosage, scheduledTime, takenOnTime, ...incompleteEvent } = createValidMedicationTakenEvent();
      const dto = plainToInstance(MedicationTakenEventDto, incompleteEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosage')).toBe(true);
      expect(hasPropertyValidationError(errors, 'scheduledTime')).toBe(true);
      expect(hasPropertyValidationError(errors, 'takenOnTime')).toBe(true);
    });

    it('should validate type as MEDICATION_TAKEN', async () => {
      // Arrange
      const medicationTakenEvent = {
        ...createValidMedicationTakenEvent(),
        type: CareEventType.MEDICATION_MISSED
      };
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
    });

    it('should validate scheduledTime as ISO 8601 format', async () => {
      // Arrange
      const medicationTakenEvent = {
        ...createValidMedicationTakenEvent(),
        scheduledTime: 'not-a-date'
      };
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'scheduledTime')).toBe(true);
      expect(hasConstraintValidationError(errors, 'scheduledTime', 'isIso8601')).toBe(true);
    });

    it('should validate takenOnTime as boolean', async () => {
      // Arrange
      const medicationTakenEvent = {
        ...createValidMedicationTakenEvent(),
        takenOnTime: 'not-a-boolean'
      };
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'takenOnTime')).toBe(true);
      expect(hasConstraintValidationError(errors, 'takenOnTime', 'isBoolean')).toBe(true);
    });

    it('should validate delayMinutes as a positive number when provided', async () => {
      // Arrange
      const medicationTakenEvent = {
        ...createValidMedicationTakenEvent(),
        takenOnTime: false,
        delayMinutes: -10
      };
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'delayMinutes')).toBe(true);
      expect(hasConstraintValidationError(errors, 'delayMinutes', 'min')).toBe(true);
    });

    it('should allow notes to be omitted', async () => {
      // Arrange
      const { notes, ...medicationTakenEventWithoutNotes } = createValidMedicationTakenEvent();
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEventWithoutNotes);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should validate nested dosage object', async () => {
      // Arrange
      const medicationTakenEvent = {
        ...createValidMedicationTakenEvent(),
        dosage: {
          // Missing required fields
        }
      };
      const dto = plainToInstance(MedicationTakenEventDto, medicationTakenEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      // The validation errors will be in the nested object
    });
  });

  describe('MedicationMissedEventDto', () => {
    // Helper function to create a valid medication missed event
    const createValidMedicationMissedEvent = (): MedicationMissedEventDto => {
      return {
        type: CareEventType.MEDICATION_MISSED,
        userId: uuidv4(),
        medication: createValidMedicationIdentifier(),
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        scheduledTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reason: 'Forgot to take medication',
        remindersSent: 3,
        isCritical: true
      };
    };

    it('should validate a valid medication missed event', async () => {
      // Arrange
      const medicationMissedEvent = createValidMedicationMissedEvent();
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require scheduledTime, remindersSent, and isCritical fields', async () => {
      // Arrange
      const { scheduledTime, remindersSent, isCritical, ...incompleteEvent } = createValidMedicationMissedEvent();
      const dto = plainToInstance(MedicationMissedEventDto, incompleteEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'scheduledTime')).toBe(true);
      expect(hasPropertyValidationError(errors, 'remindersSent')).toBe(true);
      expect(hasPropertyValidationError(errors, 'isCritical')).toBe(true);
    });

    it('should validate type as MEDICATION_MISSED', async () => {
      // Arrange
      const medicationMissedEvent = {
        ...createValidMedicationMissedEvent(),
        type: CareEventType.MEDICATION_TAKEN
      };
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
    });

    it('should validate scheduledTime as ISO 8601 format', async () => {
      // Arrange
      const medicationMissedEvent = {
        ...createValidMedicationMissedEvent(),
        scheduledTime: 'not-a-date'
      };
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'scheduledTime')).toBe(true);
      expect(hasConstraintValidationError(errors, 'scheduledTime', 'isIso8601')).toBe(true);
    });

    it('should validate remindersSent as a non-negative number', async () => {
      // Arrange
      const medicationMissedEvent = {
        ...createValidMedicationMissedEvent(),
        remindersSent: -1
      };
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'remindersSent')).toBe(true);
      expect(hasConstraintValidationError(errors, 'remindersSent', 'min')).toBe(true);
    });

    it('should validate isCritical as boolean', async () => {
      // Arrange
      const medicationMissedEvent = {
        ...createValidMedicationMissedEvent(),
        isCritical: 'not-a-boolean'
      };
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'isCritical')).toBe(true);
      expect(hasConstraintValidationError(errors, 'isCritical', 'isBoolean')).toBe(true);
    });

    it('should allow reason to be omitted', async () => {
      // Arrange
      const { reason, ...medicationMissedEventWithoutReason } = createValidMedicationMissedEvent();
      const dto = plainToInstance(MedicationMissedEventDto, medicationMissedEventWithoutReason);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('MedicationAddedEventDto', () => {
    // Helper function to create a valid medication added event
    const createValidMedicationAddedEvent = (): MedicationAddedEventDto => {
      const now = new Date();
      const startDate = new Date(now);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30); // 30 days later

      return {
        type: CareEventType.MEDICATION_ADDED,
        userId: uuidv4(),
        medication: createValidMedicationIdentifier(),
        timestamp: now.toISOString(),
        correlationId: uuidv4(),
        prescriptionDate: now.toISOString(),
        dosage: createValidMedicationDosage(),
        frequency: 'twice daily',
        duration: 30,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        remindersEnabled: true,
        provider: 'Dr. Maria Silva'
      };
    };

    it('should validate a valid medication added event', async () => {
      // Arrange
      const medicationAddedEvent = createValidMedicationAddedEvent();
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require prescriptionDate, dosage, frequency, duration, startDate, and remindersEnabled fields', async () => {
      // Arrange
      const {
        prescriptionDate,
        dosage,
        frequency,
        duration,
        startDate,
        remindersEnabled,
        ...incompleteEvent
      } = createValidMedicationAddedEvent();
      const dto = plainToInstance(MedicationAddedEventDto, incompleteEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'prescriptionDate')).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosage')).toBe(true);
      expect(hasPropertyValidationError(errors, 'frequency')).toBe(true);
      expect(hasPropertyValidationError(errors, 'duration')).toBe(true);
      expect(hasPropertyValidationError(errors, 'startDate')).toBe(true);
      expect(hasPropertyValidationError(errors, 'remindersEnabled')).toBe(true);
    });

    it('should validate type as MEDICATION_ADDED', async () => {
      // Arrange
      const medicationAddedEvent = {
        ...createValidMedicationAddedEvent(),
        type: CareEventType.MEDICATION_TAKEN
      };
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
    });

    it('should validate prescriptionDate as ISO 8601 format', async () => {
      // Arrange
      const medicationAddedEvent = {
        ...createValidMedicationAddedEvent(),
        prescriptionDate: 'not-a-date'
      };
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'prescriptionDate')).toBe(true);
      expect(hasConstraintValidationError(errors, 'prescriptionDate', 'isIso8601')).toBe(true);
    });

    it('should validate duration as a positive number', async () => {
      // Arrange
      const medicationAddedEvent = {
        ...createValidMedicationAddedEvent(),
        duration: 0
      };
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'duration')).toBe(true);
      expect(hasConstraintValidationError(errors, 'duration', 'min')).toBe(true);
    });

    it('should validate remindersEnabled as boolean', async () => {
      // Arrange
      const medicationAddedEvent = {
        ...createValidMedicationAddedEvent(),
        remindersEnabled: 'not-a-boolean'
      };
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'remindersEnabled')).toBe(true);
      expect(hasConstraintValidationError(errors, 'remindersEnabled', 'isBoolean')).toBe(true);
    });

    it('should allow endDate and provider to be omitted', async () => {
      // Arrange
      const { endDate, provider, ...medicationAddedEventWithoutOptionals } = createValidMedicationAddedEvent();
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEventWithoutOptionals);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should validate nested dosage object', async () => {
      // Arrange
      const medicationAddedEvent = {
        ...createValidMedicationAddedEvent(),
        dosage: {
          // Missing required fields
        }
      };
      const dto = plainToInstance(MedicationAddedEventDto, medicationAddedEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      // The validation errors will be in the nested object
    });
  });

  describe('MedicationRefilledEventDto', () => {
    // Helper function to create a valid medication refilled event
    const createValidMedicationRefilledEvent = (): MedicationRefilledEventDto => {
      return {
        type: CareEventType.MEDICATION_REFILLED,
        userId: uuidv4(),
        medication: createValidMedicationIdentifier(),
        timestamp: new Date().toISOString(),
        correlationId: uuidv4(),
        refillDate: new Date().toISOString(),
        quantity: 30,
        daysSupply: 30,
        pharmacy: 'Farmácia São Paulo',
        isAutoRefill: false,
        remainingRefills: 2
      };
    };

    it('should validate a valid medication refilled event', async () => {
      // Arrange
      const medicationRefilledEvent = createValidMedicationRefilledEvent();
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require refillDate, quantity, daysSupply, isAutoRefill, and remainingRefills fields', async () => {
      // Arrange
      const {
        refillDate,
        quantity,
        daysSupply,
        isAutoRefill,
        remainingRefills,
        ...incompleteEvent
      } = createValidMedicationRefilledEvent();
      const dto = plainToInstance(MedicationRefilledEventDto, incompleteEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'refillDate')).toBe(true);
      expect(hasPropertyValidationError(errors, 'quantity')).toBe(true);
      expect(hasPropertyValidationError(errors, 'daysSupply')).toBe(true);
      expect(hasPropertyValidationError(errors, 'isAutoRefill')).toBe(true);
      expect(hasPropertyValidationError(errors, 'remainingRefills')).toBe(true);
    });

    it('should validate type as MEDICATION_REFILLED', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        type: CareEventType.MEDICATION_TAKEN
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'type')).toBe(true);
    });

    it('should validate refillDate as ISO 8601 format', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        refillDate: 'not-a-date'
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'refillDate')).toBe(true);
      expect(hasConstraintValidationError(errors, 'refillDate', 'isIso8601')).toBe(true);
    });

    it('should validate quantity as a positive number', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        quantity: 0
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'quantity')).toBe(true);
      expect(hasConstraintValidationError(errors, 'quantity', 'min')).toBe(true);
    });

    it('should validate daysSupply as a positive number', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        daysSupply: 0
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'daysSupply')).toBe(true);
      expect(hasConstraintValidationError(errors, 'daysSupply', 'min')).toBe(true);
    });

    it('should validate isAutoRefill as boolean', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        isAutoRefill: 'not-a-boolean'
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'isAutoRefill')).toBe(true);
      expect(hasConstraintValidationError(errors, 'isAutoRefill', 'isBoolean')).toBe(true);
    });

    it('should validate remainingRefills as a non-negative number', async () => {
      // Arrange
      const medicationRefilledEvent = {
        ...createValidMedicationRefilledEvent(),
        remainingRefills: -1
      };
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEvent);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'remainingRefills')).toBe(true);
      expect(hasConstraintValidationError(errors, 'remainingRefills', 'min')).toBe(true);
    });

    it('should allow pharmacy to be omitted', async () => {
      // Arrange
      const { pharmacy, ...medicationRefilledEventWithoutPharmacy } = createValidMedicationRefilledEvent();
      const dto = plainToInstance(MedicationRefilledEventDto, medicationRefilledEventWithoutPharmacy);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });
  });

  describe('MedicationAdherenceStatusDto', () => {
    // Helper function to create a valid medication adherence status
    const createValidMedicationAdherenceStatus = (): MedicationAdherenceStatusDto => {
      return {
        userId: uuidv4(),
        medication: createValidMedicationIdentifier(),
        status: MedicationAdherenceStatus.TAKEN,
        adherenceRate: 85.5,
        dosesTakenOnTime: 17,
        dosesTakenLate: 3,
        dosesMissed: 2,
        currentStreak: 5,
        longestStreak: 10,
        lastUpdated: new Date().toISOString()
      };
    };

    it('should validate a valid medication adherence status', async () => {
      // Arrange
      const medicationAdherenceStatus = createValidMedicationAdherenceStatus();
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(false);
    });

    it('should require all fields', async () => {
      // Arrange
      const dto = plainToInstance(MedicationAdherenceStatusDto, {});

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'userId')).toBe(true);
      expect(hasPropertyValidationError(errors, 'medication')).toBe(true);
      expect(hasPropertyValidationError(errors, 'status')).toBe(true);
      expect(hasPropertyValidationError(errors, 'adherenceRate')).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesTakenOnTime')).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesTakenLate')).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesMissed')).toBe(true);
      expect(hasPropertyValidationError(errors, 'currentStreak')).toBe(true);
      expect(hasPropertyValidationError(errors, 'longestStreak')).toBe(true);
      expect(hasPropertyValidationError(errors, 'lastUpdated')).toBe(true);
    });

    it('should validate userId as UUID', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        userId: 'not-a-uuid'
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'userId')).toBe(true);
      expect(hasConstraintValidationError(errors, 'userId', 'isUuid')).toBe(true);
    });

    it('should validate status as a valid enum value', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        status: 'INVALID_STATUS'
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'status')).toBe(true);
      expect(hasConstraintValidationError(errors, 'status', 'isEnum')).toBe(true);
    });

    it('should validate adherenceRate as a number between 0 and 100', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        adherenceRate: 120
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'adherenceRate')).toBe(true);
      expect(hasConstraintValidationError(errors, 'adherenceRate', 'max')).toBe(true);
    });

    it('should validate dosesTakenOnTime as a non-negative number', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        dosesTakenOnTime: -1
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesTakenOnTime')).toBe(true);
      expect(hasConstraintValidationError(errors, 'dosesTakenOnTime', 'min')).toBe(true);
    });

    it('should validate dosesTakenLate as a non-negative number', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        dosesTakenLate: -1
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesTakenLate')).toBe(true);
      expect(hasConstraintValidationError(errors, 'dosesTakenLate', 'min')).toBe(true);
    });

    it('should validate dosesMissed as a non-negative number', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        dosesMissed: -1
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'dosesMissed')).toBe(true);
      expect(hasConstraintValidationError(errors, 'dosesMissed', 'min')).toBe(true);
    });

    it('should validate currentStreak as a non-negative number', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        currentStreak: -1
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'currentStreak')).toBe(true);
      expect(hasConstraintValidationError(errors, 'currentStreak', 'min')).toBe(true);
    });

    it('should validate longestStreak as a non-negative number', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        longestStreak: -1
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'longestStreak')).toBe(true);
      expect(hasConstraintValidationError(errors, 'longestStreak', 'min')).toBe(true);
    });

    it('should validate lastUpdated as ISO 8601 format', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        lastUpdated: 'not-a-date'
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'lastUpdated')).toBe(true);
      expect(hasConstraintValidationError(errors, 'lastUpdated', 'isIso8601')).toBe(true);
    });

    it('should validate nested medication object', async () => {
      // Arrange
      const medicationAdherenceStatus = {
        ...createValidMedicationAdherenceStatus(),
        medication: {
          // Missing required fields
        }
      };
      const dto = plainToInstance(MedicationAdherenceStatusDto, medicationAdherenceStatus);

      // Act
      const errors = await validateDto(dto);

      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      // The validation errors will be in the nested object
    });
  });
});