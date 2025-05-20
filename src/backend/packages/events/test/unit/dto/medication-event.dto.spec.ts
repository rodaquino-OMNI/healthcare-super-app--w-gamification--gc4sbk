/**
 * @file medication-event.dto.spec.ts
 * @description Unit tests for the MedicationEventDto class that validate medication adherence events
 * (taken, skipped, missed). Tests verify medication identification, dosage validation, schedule
 * compliance tracking, and adherence state transitions. These tests ensure that medication adherence
 * data is properly validated for gamification and notification purposes.
 *
 * @module events/test/unit/dto
 */

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

// Import the DTO to test
import { MedicationEventDto } from '../../../src/dto/medication-event.dto';
import { EventType, JourneyEvents } from '../../../src/dto/event-types.enum';

// Import test utilities
import {
  createMedicationData,
  createMedicationTakenEvent,
  MedicationAdherenceStatus,
  createInvalidEvent,
  createEventWithInvalidValues,
  validateEventDto,
  isValidEventDto,
  TestFactoryOptions
} from './test-utils';

describe('MedicationEventDto', () => {
  // Test valid medication events
  describe('Valid medication events', () => {
    it('should validate a medication taken event with ON_TIME status', async () => {
      // Create a valid medication taken event with ON_TIME status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate a medication taken event with LATE status', async () => {
      // Create a valid medication taken event with LATE status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.LATE);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate a medication taken event with SKIPPED status', async () => {
      // Create a valid medication taken event with SKIPPED status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.SKIPPED);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate a medication taken event with MISSED status', async () => {
      // Create a valid medication taken event with MISSED status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.MISSED);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate a medication event with additional notes', async () => {
      // Create a valid medication taken event with additional notes
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME, {
        notes: 'Medication taken with food as directed'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
  });
  
  // Test invalid medication events (missing required fields)
  describe('Invalid medication events - missing required fields', () => {
    it('should not validate a medication event without medicationId', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Remove medicationId to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.medicationId']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing medicationId
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'medicationId' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('medicationId')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event without medicationName', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Remove medicationName to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.medicationName']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing medicationName
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'medicationName' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('medicationName')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event without dosage', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Remove dosage to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.dosage']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing dosage
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'dosage' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('dosage')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event without scheduledAt', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Remove scheduledAt to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.scheduledAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing scheduledAt
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'scheduledAt' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('scheduledAt')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event without adherenceStatus', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Remove adherenceStatus to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.adherenceStatus']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing adherenceStatus
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'adherenceStatus' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('adherenceStatus')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
  });
  
  // Test invalid medication events (invalid values)
  describe('Invalid medication events - invalid values', () => {
    it('should not validate a medication event with invalid adherenceStatus', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Set invalid adherenceStatus
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.adherenceStatus': 'INVALID_STATUS'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about invalid adherenceStatus
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'adherenceStatus' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('adherenceStatus') && msg.includes('valid')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event with invalid scheduledAt date format', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Set invalid scheduledAt date format
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.scheduledAt': 'not-a-date'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about invalid scheduledAt date format
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'scheduledAt' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('scheduledAt') && msg.includes('date')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event with invalid takenAt date format', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      
      // Set invalid takenAt date format
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.takenAt': 'not-a-date'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about invalid takenAt date format
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'takenAt' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('takenAt') && msg.includes('date')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event with empty medicationName', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Set empty medicationName
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.medicationName': ''
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about empty medicationName
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'medicationName' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('medicationName') && msg.includes('empty')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should not validate a medication event with empty dosage', async () => {
      // Create a valid event first
      const validEvent = createMedicationTakenEvent();
      
      // Set empty dosage
      const invalidEvent = createEventWithInvalidValues(validEvent, {
        'data.dosage': ''
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about empty dosage
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          child.property === 'dosage' && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('dosage') && msg.includes('empty')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
  });
  
  // Test adherence status validation
  describe('Adherence status validation', () => {
    it('should validate MISSED status without takenAt', async () => {
      // Create a medication event with MISSED status and no takenAt
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.MISSED, {
        takenAt: undefined
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should not validate ON_TIME status without takenAt', async () => {
      // Create a medication event with ON_TIME status
      const validEvent = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      
      // Remove takenAt to make it invalid
      const invalidEvent = createInvalidEvent(validEvent, ['data.takenAt']);
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, invalidEvent);
      
      // Validate
      const errors = await validateEventDto(dto);
      expect(errors).not.toBeNull();
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific error about missing takenAt for ON_TIME status
      const hasExpectedError = errors.some(error => 
        error.property === 'data' && 
        error.children.some(child => 
          (child.property === 'takenAt' || child.property === 'adherenceStatus') && 
          child.constraints && 
          Object.values(child.constraints).some(msg => 
            msg.includes('takenAt') || msg.includes('adherenceStatus')
          )
        )
      );
      
      expect(hasExpectedError).toBe(true);
    });
    
    it('should validate SKIPPED status with reason', async () => {
      // Create a medication event with SKIPPED status and a reason
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.SKIPPED, {
        notes: 'Skipped due to doctor\'s advice'
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate LATE status with takenAt after scheduledAt', async () => {
      // Create a base event
      const now = new Date();
      const scheduledTime = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
      const takenTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      
      // Create a medication event with LATE status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.LATE, {
        scheduledAt: scheduledTime.toISOString(),
        takenAt: takenTime.toISOString()
      });
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
  });
  
  // Test integration with gamification rules
  describe('Integration with gamification rules', () => {
    it('should validate a medication event with gamification points', async () => {
      // Create a medication event with gamification points
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      
      // Add gamification points
      event.gamification = {
        points: 10,
        streakCount: 3,
        achievementProgress: {
          medication_adherence: 75 // 75% progress towards medication adherence achievement
        }
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate a medication event with achievement unlocked', async () => {
      // Create a medication event with achievement unlocked
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      
      // Add achievement unlocked
      event.gamification = {
        points: 25,
        streakCount: 7,
        achievementProgress: {
          medication_adherence: 100 // 100% progress towards medication adherence achievement
        },
        achievementsUnlocked: [
          {
            id: 'medication-adherence-bronze',
            name: 'Aderência ao Tratamento',
            tier: 'bronze',
            description: 'Tome seus medicamentos conforme prescrito por 7 dias consecutivos',
            points: 50,
            iconUrl: 'achievements/medication-adherence-bronze.png'
          }
        ]
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
    
    it('should validate different point values based on adherence status', async () => {
      // Create events with different adherence statuses
      const onTimeEvent = createMedicationTakenEvent(MedicationAdherenceStatus.ON_TIME);
      const lateEvent = createMedicationTakenEvent(MedicationAdherenceStatus.LATE);
      const skippedEvent = createMedicationTakenEvent(MedicationAdherenceStatus.SKIPPED);
      const missedEvent = createMedicationTakenEvent(MedicationAdherenceStatus.MISSED);
      
      // Add gamification points based on adherence status
      onTimeEvent.gamification = { points: 10, streakCount: 3 };
      lateEvent.gamification = { points: 5, streakCount: 0 };
      skippedEvent.gamification = { points: 0, streakCount: 0 };
      missedEvent.gamification = { points: 0, streakCount: 0 };
      
      // Convert to DTO instances
      const onTimeDto = plainToInstance(MedicationEventDto, onTimeEvent);
      const lateDto = plainToInstance(MedicationEventDto, lateEvent);
      const skippedDto = plainToInstance(MedicationEventDto, skippedEvent);
      const missedDto = plainToInstance(MedicationEventDto, missedEvent);
      
      // Validate all events
      const onTimeValid = await isValidEventDto(onTimeDto);
      const lateValid = await isValidEventDto(lateDto);
      const skippedValid = await isValidEventDto(skippedDto);
      const missedValid = await isValidEventDto(missedDto);
      
      expect(onTimeValid).toBe(true);
      expect(lateValid).toBe(true);
      expect(skippedValid).toBe(true);
      expect(missedValid).toBe(true);
    });
    
    it('should validate a medication event with streak reset on missed dose', async () => {
      // Create a medication event with MISSED status
      const event = createMedicationTakenEvent(MedicationAdherenceStatus.MISSED);
      
      // Add gamification with streak reset
      event.gamification = {
        points: 0,
        streakCount: 0, // Reset to 0
        previousStreakCount: 5, // Was 5 before missing
        achievementProgress: {
          medication_adherence: 0 // Reset progress
        }
      };
      
      // Convert to DTO instance
      const dto = plainToInstance(MedicationEventDto, event);
      
      // Validate
      const isValid = await isValidEventDto(dto);
      expect(isValid).toBe(true);
    });
  });
});