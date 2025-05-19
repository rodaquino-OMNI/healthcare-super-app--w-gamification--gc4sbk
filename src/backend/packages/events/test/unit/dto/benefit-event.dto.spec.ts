import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import {
  BenefitEventDto,
  BenefitEventType,
  BenefitUtilizedEventDto,
  BenefitRedeemedEventDto,
  BenefitStatusChangedEventDto,
  BenefitCategory,
  BenefitStatus,
} from '../../../src/dto/benefit-event.dto';
import {
  hasValidationErrors,
  hasPropertyValidationError,
  hasConstraintValidationError,
} from './test-utils';

describe('BenefitEventDto', () => {
  describe('Type Discrimination', () => {
    it('should correctly transform to BenefitUtilizedEventDto when eventType is BENEFIT_UTILIZED', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
      expect(dto.eventType).toBe(BenefitEventType.BENEFIT_UTILIZED);
      expect(dto.data).toBeInstanceOf(BenefitUtilizedEventDto);
    });

    it('should correctly transform to BenefitRedeemedEventDto when eventType is BENEFIT_REDEEMED', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
      expect(dto.eventType).toBe(BenefitEventType.BENEFIT_REDEEMED);
      expect(dto.data).toBeInstanceOf(BenefitRedeemedEventDto);
    });

    it('should correctly transform to BenefitStatusChangedEventDto when eventType is BENEFIT_STATUS_CHANGED', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
      expect(dto.eventType).toBe(BenefitEventType.BENEFIT_STATUS_CHANGED);
      expect(dto.data).toBeInstanceOf(BenefitStatusChangedEventDto);
    });

    it('should fail validation when eventType is invalid', async () => {
      // Arrange
      const eventData = {
        eventType: 'INVALID_EVENT_TYPE',
        data: createValidBenefitUtilizedEvent().data,
      };
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'eventType')).toBe(true);
      expect(hasConstraintValidationError(errors, 'eventType', 'isEnum')).toBe(true);
    });
  });

  describe('BenefitUtilizedEventDto', () => {
    it('should validate a valid benefit utilization event', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when planId is missing', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      delete eventData.data.planId;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when utilization is missing', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      delete eventData.data.utilization;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when benefitId is not a valid UUID', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.benefitId = 'not-a-uuid';
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when utilizationAmount is negative', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.utilizationAmount = -100;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when category is invalid', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.category = 'INVALID_CATEGORY' as BenefitCategory;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should validate when optional fields are provided with valid values', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.coveragePercentage = 80;
      eventData.data.utilization.outOfPocketAmount = 50;
      eventData.data.utilization.remainingUtilizations = 5;
      eventData.data.utilization.remainingCoverage = 1000;
      eventData.data.utilization.isPreventive = true;
      eventData.data.utilization.providerName = 'Test Provider';
      eventData.data.utilization.providerId = uuidv4();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when coveragePercentage is greater than 100', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.coveragePercentage = 120;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when remainingUtilizations is negative', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.utilization.remainingUtilizations = -1;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });
  });

  describe('BenefitRedeemedEventDto', () => {
    it('should validate a valid benefit redemption event', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when planId is missing', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      delete eventData.data.planId;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when redemption is missing', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      delete eventData.data.redemption;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when benefitId is not a valid UUID', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      eventData.data.redemption.benefitId = 'not-a-uuid';
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when redemptionValue is negative', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      eventData.data.redemption.redemptionValue = -100;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when category is invalid', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      eventData.data.redemption.category = 'INVALID_CATEGORY' as BenefitCategory;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should validate when optional fields are provided with valid values', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      eventData.data.redemption.isOneTime = true;
      eventData.data.redemption.expirationDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      eventData.data.redemption.redemptionDetails = { location: 'Online', method: 'App' };
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when expirationDate is not a valid ISO date', async () => {
      // Arrange
      const eventData = createValidBenefitRedeemedEvent();
      eventData.data.redemption.expirationDate = 'not-a-date';
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });
  });

  describe('BenefitStatusChangedEventDto', () => {
    it('should validate a valid benefit status change event', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when planId is missing', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      delete eventData.data.planId;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when statusChange is missing', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      delete eventData.data.statusChange;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto, { whitelist: true });
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when benefitId is not a valid UUID', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      eventData.data.statusChange.benefitId = 'not-a-uuid';
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when previousStatus is invalid', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      eventData.data.statusChange.previousStatus = 'INVALID_STATUS' as BenefitStatus;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should fail validation when newStatus is invalid', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      eventData.data.statusChange.newStatus = 'INVALID_STATUS' as BenefitStatus;
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });

    it('should validate when optional fields are provided with valid values', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      eventData.data.statusChange.statusChangeReason = 'Plan upgrade';
      eventData.data.statusChange.effectiveDate = new Date().toISOString();
      eventData.data.statusChange.expirationDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when effectiveDate is not a valid ISO date', async () => {
      // Arrange
      const eventData = createValidBenefitStatusChangedEvent();
      eventData.data.statusChange.effectiveDate = 'not-a-date';
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });
  });

  describe('BaseBenefitEventDto', () => {
    it('should validate when optional fields are provided with valid values', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.memberName = 'John Doe';
      eventData.data.memberNumber = 'MEM12345';
      eventData.data.tags = ['premium', 'preventive', 'annual'];
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(errors.length).toBe(0);
    });

    it('should fail validation when tags array exceeds maximum size', async () => {
      // Arrange
      const eventData = createValidBenefitUtilizedEvent();
      eventData.data.tags = Array(11).fill('tag').map((tag, i) => `${tag}${i}`);
      
      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);
      
      // Assert
      expect(hasValidationErrors(errors)).toBe(true);
      expect(hasPropertyValidationError(errors, 'data')).toBe(true);
    });
  });
});

// Helper functions to create valid test events

function createValidBenefitUtilizedEvent(): any {
  return {
    eventType: BenefitEventType.BENEFIT_UTILIZED,
    data: {
      planId: uuidv4(),
      planName: 'Premium Health Plan',
      memberId: uuidv4(),
      utilization: {
        benefitId: uuidv4(),
        benefitName: 'Annual Health Check',
        category: BenefitCategory.PREVENTIVE,
        utilizationAmount: 250,
        currency: 'BRL',
        utilizationDate: new Date().toISOString(),
      },
    },
  };
}

function createValidBenefitRedeemedEvent(): any {
  return {
    eventType: BenefitEventType.BENEFIT_REDEEMED,
    data: {
      planId: uuidv4(),
      planName: 'Premium Health Plan',
      memberId: uuidv4(),
      redemption: {
        benefitId: uuidv4(),
        benefitName: 'Pharmacy Discount',
        category: BenefitCategory.PHARMACY,
        redemptionCode: 'PHARM-DISC-2023',
        redemptionDate: new Date().toISOString(),
        redemptionValue: 50,
        currency: 'BRL',
      },
    },
  };
}

function createValidBenefitStatusChangedEvent(): any {
  return {
    eventType: BenefitEventType.BENEFIT_STATUS_CHANGED,
    data: {
      planId: uuidv4(),
      planName: 'Premium Health Plan',
      memberId: uuidv4(),
      statusChange: {
        benefitId: uuidv4(),
        benefitName: 'Dental Coverage',
        category: BenefitCategory.DENTAL,
        previousStatus: BenefitStatus.PENDING,
        newStatus: BenefitStatus.ACTIVE,
        statusChangeDate: new Date().toISOString(),
      },
    },
  };
}