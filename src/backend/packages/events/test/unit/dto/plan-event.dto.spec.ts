/**
 * @file plan-event.dto.spec.ts
 * @description Unit tests for the PlanEventDto class that validate plan journey-specific event structures.
 * Tests verify correct validation of claim submission, benefit utilization, plan selection/comparison,
 * and reward redemption events, ensuring proper payload structure and field validation.
 *
 * @module events/test/unit/dto
 */

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EventType } from '../../../src/dto/event-types.enum';
import {
  PlanEventDto,
  PlanClaimSubmittedEventDto,
  PlanBenefitUtilizedEventDto,
  PlanSelectedEventDto,
  PlanRewardRedeemedEventDto,
  ClaimData,
  BenefitData,
  PlanSelectionData,
  RewardRedemptionData
} from '../../../src/dto/plan-event.dto';

/**
 * Helper function to create a valid claim data object
 */
function createValidClaimData(): ClaimData {
  return {
    claimId: '123e4567-e89b-12d3-a456-426614174000',
    claimType: 'medical',
    providerId: '123e4567-e89b-12d3-a456-426614174001',
    serviceDate: new Date().toISOString(),
    amount: 150.75,
    submittedAt: new Date().toISOString(),
    description: 'Annual physical examination',
    receiptUrls: ['https://storage.austa.com.br/receipts/123456.pdf']
  };
}

/**
 * Helper function to create a valid benefit data object
 */
function createValidBenefitData(): BenefitData {
  return {
    benefitId: '123e4567-e89b-12d3-a456-426614174002',
    benefitType: 'wellness',
    providerId: '123e4567-e89b-12d3-a456-426614174003',
    utilizationDate: new Date().toISOString(),
    savingsAmount: 75.50,
    description: 'Gym membership discount',
    isEligible: true
  };
}

/**
 * Helper function to create a valid plan selection data object
 */
function createValidPlanSelectionData(): PlanSelectionData {
  return {
    planId: '123e4567-e89b-12d3-a456-426614174004',
    planType: 'health',
    coverageLevel: 'family',
    premium: 350.00,
    startDate: new Date().toISOString(),
    selectedAt: new Date().toISOString(),
    previousPlanId: '123e4567-e89b-12d3-a456-426614174005'
  };
}

/**
 * Helper function to create a valid reward redemption data object
 */
function createValidRewardRedemptionData(): RewardRedemptionData {
  return {
    rewardId: '123e4567-e89b-12d3-a456-426614174006',
    rewardType: 'gift_card',
    pointsRedeemed: 1000,
    value: 50.00,
    redeemedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
  };
}

describe('PlanEventDto', () => {
  describe('Base validation', () => {
    it('should validate that journey is "plan"', async () => {
      // Create a plan event with incorrect journey
      const eventDto = plainToInstance(PlanEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'health', // Incorrect journey
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
      expect(errors[0].constraints.equals).toContain('journey must be plan');
    });

    it('should validate that type is a valid plan event type', async () => {
      // Create a plan event with incorrect type
      const eventDto = plainToInstance(PlanEventDto, {
        type: EventType.HEALTH_METRIC_RECORDED, // Incorrect type for plan journey
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isIn');
      expect(errors[0].constraints.isIn).toContain('type must be a valid plan event type');
    });

    it('should validate that userId is a valid UUID', async () => {
      // Create a plan event with invalid userId
      const eventDto = plainToInstance(PlanEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: 'invalid-uuid',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isUuid');
      expect(errors[0].constraints.isUuid).toContain('userId must be a valid UUID');
    });

    it('should validate that timestamp is a valid ISO date string', async () => {
      // Create a plan event with invalid timestamp
      const eventDto = plainToInstance(PlanEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: 'invalid-date',
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('isDateString');
      expect(errors[0].constraints.isDateString).toContain('timestamp must be a valid ISO date string');
    });
  });

  describe('PlanClaimSubmittedEventDto', () => {
    it('should validate a valid claim submission event', async () => {
      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBe(0);
    });

    it('should validate that type is PLAN_CLAIM_SUBMITTED', async () => {
      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, {
        type: EventType.PLAN_BENEFIT_UTILIZED, // Incorrect type
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
      expect(errors[0].constraints.equals).toContain('type must be PLAN_CLAIM_SUBMITTED');
    });

    it('should validate claim data structure', async () => {
      // Missing required fields in claim data
      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          // Missing claimId, claimType, and other required fields
          amount: 150.75
        }
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for nested validation errors in data property
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      expect(dataErrors.children.length).toBeGreaterThan(0);
      
      // Verify specific field validations
      const fieldErrors = dataErrors.children.map(child => child.property);
      expect(fieldErrors).toContain('claimId');
      expect(fieldErrors).toContain('claimType');
      expect(fieldErrors).toContain('providerId');
      expect(fieldErrors).toContain('serviceDate');
    });

    it('should validate claim amount is positive', async () => {
      const invalidClaimData = createValidClaimData();
      invalidClaimData.amount = -50.00; // Negative amount

      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: invalidClaimData
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the nested validation error for amount
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      
      const amountError = dataErrors.children.find(child => child.property === 'amount');
      expect(amountError).toBeDefined();
      expect(amountError.constraints).toHaveProperty('min');
      expect(amountError.constraints.min).toContain('amount must be a positive number');
    });
  });

  describe('PlanBenefitUtilizedEventDto', () => {
    it('should validate a valid benefit utilization event', async () => {
      const eventDto = plainToInstance(PlanBenefitUtilizedEventDto, {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidBenefitData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBe(0);
    });

    it('should validate that type is PLAN_BENEFIT_UTILIZED', async () => {
      const eventDto = plainToInstance(PlanBenefitUtilizedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED, // Incorrect type
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidBenefitData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
      expect(errors[0].constraints.equals).toContain('type must be PLAN_BENEFIT_UTILIZED');
    });

    it('should validate benefit data structure', async () => {
      // Missing required fields in benefit data
      const eventDto = plainToInstance(PlanBenefitUtilizedEventDto, {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          // Missing benefitId, benefitType, and other required fields
          savingsAmount: 75.50
        }
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for nested validation errors in data property
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      expect(dataErrors.children.length).toBeGreaterThan(0);
      
      // Verify specific field validations
      const fieldErrors = dataErrors.children.map(child => child.property);
      expect(fieldErrors).toContain('benefitId');
      expect(fieldErrors).toContain('benefitType');
      expect(fieldErrors).toContain('utilizationDate');
    });

    it('should validate benefit type is a valid value', async () => {
      const invalidBenefitData = createValidBenefitData();
      invalidBenefitData.benefitType = 'invalid_type'; // Invalid benefit type

      const eventDto = plainToInstance(PlanBenefitUtilizedEventDto, {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: invalidBenefitData
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the nested validation error for benefitType
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      
      const typeError = dataErrors.children.find(child => child.property === 'benefitType');
      expect(typeError).toBeDefined();
      expect(typeError.constraints).toHaveProperty('isIn');
      expect(typeError.constraints.isIn).toContain('benefitType must be a valid benefit type');
    });
  });

  describe('PlanSelectedEventDto', () => {
    it('should validate a valid plan selection event', async () => {
      const eventDto = plainToInstance(PlanSelectedEventDto, {
        type: EventType.PLAN_SELECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidPlanSelectionData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBe(0);
    });

    it('should validate that type is PLAN_SELECTED', async () => {
      const eventDto = plainToInstance(PlanSelectedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED, // Incorrect type
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidPlanSelectionData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
      expect(errors[0].constraints.equals).toContain('type must be PLAN_SELECTED');
    });

    it('should validate plan selection data structure', async () => {
      // Missing required fields in plan selection data
      const eventDto = plainToInstance(PlanSelectedEventDto, {
        type: EventType.PLAN_SELECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          // Missing planId, planType, and other required fields
          premium: 350.00
        }
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for nested validation errors in data property
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      expect(dataErrors.children.length).toBeGreaterThan(0);
      
      // Verify specific field validations
      const fieldErrors = dataErrors.children.map(child => child.property);
      expect(fieldErrors).toContain('planId');
      expect(fieldErrors).toContain('planType');
      expect(fieldErrors).toContain('coverageLevel');
      expect(fieldErrors).toContain('startDate');
      expect(fieldErrors).toContain('selectedAt');
    });

    it('should validate coverage level is a valid value', async () => {
      const invalidPlanData = createValidPlanSelectionData();
      invalidPlanData.coverageLevel = 'invalid_level'; // Invalid coverage level

      const eventDto = plainToInstance(PlanSelectedEventDto, {
        type: EventType.PLAN_SELECTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: invalidPlanData
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the nested validation error for coverageLevel
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      
      const levelError = dataErrors.children.find(child => child.property === 'coverageLevel');
      expect(levelError).toBeDefined();
      expect(levelError.constraints).toHaveProperty('isIn');
      expect(levelError.constraints.isIn).toContain('coverageLevel must be a valid coverage level');
    });
  });

  describe('PlanRewardRedeemedEventDto', () => {
    it('should validate a valid reward redemption event', async () => {
      const eventDto = plainToInstance(PlanRewardRedeemedEventDto, {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidRewardRedemptionData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBe(0);
    });

    it('should validate that type is PLAN_REWARD_REDEEMED', async () => {
      const eventDto = plainToInstance(PlanRewardRedeemedEventDto, {
        type: EventType.PLAN_CLAIM_SUBMITTED, // Incorrect type
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidRewardRedemptionData()
      });

      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty('equals');
      expect(errors[0].constraints.equals).toContain('type must be PLAN_REWARD_REDEEMED');
    });

    it('should validate reward redemption data structure', async () => {
      // Missing required fields in reward redemption data
      const eventDto = plainToInstance(PlanRewardRedeemedEventDto, {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          // Missing rewardId, rewardType, and other required fields
          pointsRedeemed: 1000
        }
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for nested validation errors in data property
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      expect(dataErrors.children.length).toBeGreaterThan(0);
      
      // Verify specific field validations
      const fieldErrors = dataErrors.children.map(child => child.property);
      expect(fieldErrors).toContain('rewardId');
      expect(fieldErrors).toContain('rewardType');
      expect(fieldErrors).toContain('value');
      expect(fieldErrors).toContain('redeemedAt');
    });

    it('should validate points redeemed is a positive integer', async () => {
      const invalidRewardData = createValidRewardRedemptionData();
      invalidRewardData.pointsRedeemed = -100; // Negative points

      const eventDto = plainToInstance(PlanRewardRedeemedEventDto, {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: invalidRewardData
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the nested validation error for pointsRedeemed
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      
      const pointsError = dataErrors.children.find(child => child.property === 'pointsRedeemed');
      expect(pointsError).toBeDefined();
      expect(pointsError.constraints).toHaveProperty('min');
      expect(pointsError.constraints.min).toContain('pointsRedeemed must be a positive number');
    });

    it('should validate reward type is a valid value', async () => {
      const invalidRewardData = createValidRewardRedemptionData();
      invalidRewardData.rewardType = 'invalid_type'; // Invalid reward type

      const eventDto = plainToInstance(PlanRewardRedeemedEventDto, {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: invalidRewardData
      });

      const errors = await validate(eventDto, { validationError: { target: false } });
      expect(errors.length).toBeGreaterThan(0);
      
      // Find the nested validation error for rewardType
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
      
      const typeError = dataErrors.children.find(child => child.property === 'rewardType');
      expect(typeError).toBeDefined();
      expect(typeError.constraints).toHaveProperty('isIn');
      expect(typeError.constraints.isIn).toContain('rewardType must be a valid reward type');
    });
  });

  describe('Integration with event processing pipeline', () => {
    it('should properly transform plain objects to class instances', () => {
      const plainObject = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      };

      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, plainObject);
      
      expect(eventDto).toBeInstanceOf(PlanClaimSubmittedEventDto);
      expect(eventDto.type).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      expect(eventDto.journey).toBe('plan');
      expect(eventDto.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(eventDto.data).toBeDefined();
      expect(eventDto.data.claimId).toBe(plainObject.data.claimId);
    });

    it('should handle inheritance from BaseEventDto correctly', () => {
      const plainObject = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: createValidClaimData()
      };

      const eventDto = plainToInstance(PlanClaimSubmittedEventDto, plainObject);
      
      // Check that it inherits from PlanEventDto
      expect(eventDto).toBeInstanceOf(PlanEventDto);
      
      // Check that common validation from the base class works
      expect(eventDto.journey).toBe('plan');
      expect(eventDto.type).toBe(EventType.PLAN_CLAIM_SUBMITTED);
    });
  });
});