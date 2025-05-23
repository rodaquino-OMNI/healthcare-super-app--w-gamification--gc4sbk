import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { BenefitEventDto } from '../../../src/dto/benefit-event.dto';
import { BenefitType, BenefitStatus } from '../../../src/constants/benefit.constants';
import { EventType } from '@austa/interfaces/gamification/events';

describe('BenefitEventDto', () => {
  describe('Benefit Utilization Validation', () => {
    it('should validate a valid benefit utilization event', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 100,
        timestamp: new Date().toISOString(),
        metadata: {
          providerName: 'Dental Clinic ABC',
          serviceDate: new Date().toISOString(),
        },
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.benefitId).toBe('benefit-123');
      expect(dto.benefitType).toBe(BenefitType.DENTAL);
      expect(dto.value).toBe(100);
    });

    it('should fail validation when benefitId is missing', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: BenefitType.DENTAL,
        value: 100,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('benefitId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when benefitType is invalid', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: 'INVALID_TYPE', // Invalid type
        value: 100,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('benefitType');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });

    it('should fail validation when value is negative', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: -50, // Negative value
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('value');
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('Benefit Redemption Validation', () => {
    it('should validate a valid benefit redemption event', async () => {
      // Arrange
      const eventData = {
        type: EventType.REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.WELLNESS,
        redeemCode: 'REDEEM123',
        redeemValue: 200,
        timestamp: new Date().toISOString(),
        metadata: {
          partnerName: 'Wellness Center XYZ',
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        },
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.benefitId).toBe('benefit-123');
      expect(dto.benefitType).toBe(BenefitType.WELLNESS);
      expect(dto.redeemCode).toBe('REDEEM123');
      expect(dto.redeemValue).toBe(200);
    });

    it('should fail validation when redeemCode is missing for redemption event', async () => {
      // Arrange
      const eventData = {
        type: EventType.REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.WELLNESS,
        redeemValue: 200,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('redeemCode');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when redeemValue is zero or negative', async () => {
      // Arrange
      const eventData = {
        type: EventType.REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.WELLNESS,
        redeemCode: 'REDEEM123',
        redeemValue: 0, // Zero value
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('redeemValue');
      expect(errors[0].constraints).toHaveProperty('min');
    });
  });

  describe('Benefit Status Change Validation', () => {
    it('should validate a valid benefit status change event', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED, // Using BENEFIT_UTILIZED for status changes too
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.VISION,
        previousStatus: BenefitStatus.AVAILABLE,
        newStatus: BenefitStatus.UTILIZED,
        timestamp: new Date().toISOString(),
        metadata: {
          reason: 'Annual vision check-up',
          remainingValue: 150,
        },
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.benefitId).toBe('benefit-123');
      expect(dto.benefitType).toBe(BenefitType.VISION);
      expect(dto.previousStatus).toBe(BenefitStatus.AVAILABLE);
      expect(dto.newStatus).toBe(BenefitStatus.UTILIZED);
    });

    it('should fail validation when status transition is invalid', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.VISION,
        previousStatus: BenefitStatus.EXPIRED, // Cannot transition from EXPIRED
        newStatus: BenefitStatus.UTILIZED,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      
      // We need to call the custom validation method directly since it's not part of class-validator
      expect(() => dto.validateStatusTransition()).toThrow();
    });

    it('should fail validation when newStatus is invalid', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.VISION,
        previousStatus: BenefitStatus.AVAILABLE,
        newStatus: 'INVALID_STATUS', // Invalid status
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newStatus');
      expect(errors[0].constraints).toHaveProperty('isEnum');
    });
  });

  describe('Benefit Value Calculation', () => {
    it('should calculate remaining benefit value correctly', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 100,
        totalValue: 500,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.calculateRemainingValue()).toBe(400); // 500 - 100 = 400
    });

    it('should handle percentage-based benefit values', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 100,
        totalValue: 500,
        isPercentageBased: true,
        percentageCovered: 80, // 80% coverage
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.calculateCoveredAmount()).toBe(80); // 80% of 100 = 80
      expect(dto.calculateUserResponsibility()).toBe(20); // 20% of 100 = 20
    });

    it('should validate benefit utilization does not exceed total value', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 600, // Exceeds total value of 500
        totalValue: 500,
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      
      // We need to call the custom validation method directly since it's not part of class-validator
      expect(() => dto.validateUtilizationLimit()).toThrow();
    });
  });

  describe('Integration with Plan Journey', () => {
    it('should validate benefit event with plan journey context', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 100,
        planId: 'plan-456',
        journey: 'plan',
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
      expect(dto.planId).toBe('plan-456');
      expect(dto.journey).toBe('plan');
    });

    it('should fail validation when planId is missing for plan journey event', async () => {
      // Arrange
      const eventData = {
        type: EventType.BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        benefitId: 'benefit-123',
        benefitType: BenefitType.DENTAL,
        value: 100,
        journey: 'plan', // Plan journey but no planId
        timestamp: new Date().toISOString(),
      };

      // Act
      const dto = plainToInstance(BenefitEventDto, eventData);
      
      // We need to call the custom validation method directly since it's not part of class-validator
      expect(() => dto.validatePlanJourneyContext()).toThrow();
    });
  });
});