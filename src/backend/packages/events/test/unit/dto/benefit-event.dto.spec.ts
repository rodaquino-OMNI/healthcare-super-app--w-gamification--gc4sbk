/**
 * @file benefit-event.dto.spec.ts
 * @description Unit tests for the BenefitEventDto class that validate benefit utilization,
 * redemption, and status change events. Tests verify benefit type validation, utilization tracking,
 * redemption validation, and benefit value calculation.
 *
 * @module events/test/unit/dto
 */

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  BenefitEventDto,
  BenefitUtilizedEventDto,
  BenefitRedemptionEventDto,
  BenefitStatusChangeEventDto,
  BenefitData,
  BenefitType,
  BenefitCategory,
  BenefitStatus
} from '../../../src/dto/benefit-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';

describe('BenefitEventDto', () => {
  describe('BenefitData', () => {
    it('should validate a valid benefit data object', async () => {
      const benefitData: BenefitData = {
        benefitId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: BenefitType.WELLNESS,
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: 500,
        utilizationDate: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        status: BenefitStatus.ACTIVE
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when benefitId is not a valid UUID', async () => {
      const benefitData: BenefitData = {
        benefitId: 'invalid-uuid',
        benefitType: BenefitType.WELLNESS,
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: 500,
        utilizationDate: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        status: BenefitStatus.ACTIVE
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('benefitId');
    });

    it('should fail validation when benefitType is invalid', async () => {
      const benefitData: any = {
        benefitId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: 'INVALID_TYPE',
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: 500,
        utilizationDate: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        status: BenefitStatus.ACTIVE
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('benefitType');
    });

    it('should fail validation when value is negative', async () => {
      const benefitData: BenefitData = {
        benefitId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: BenefitType.WELLNESS,
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: -100, // Negative value
        utilizationDate: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        status: BenefitStatus.ACTIVE
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('value');
    });

    it('should fail validation when utilizationDate is not a valid ISO date', async () => {
      const benefitData: BenefitData = {
        benefitId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: BenefitType.WELLNESS,
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: 500,
        utilizationDate: 'invalid-date', // Invalid date format
        providerId: '123e4567-e89b-12d3-a456-426614174001',
        status: BenefitStatus.ACTIVE
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('utilizationDate');
    });

    it('should validate benefit data with optional fields omitted', async () => {
      const benefitData: BenefitData = {
        benefitId: '123e4567-e89b-12d3-a456-426614174000',
        benefitType: BenefitType.WELLNESS,
        benefitCategory: BenefitCategory.PREVENTIVE,
        name: 'Annual Health Checkup',
        description: 'Comprehensive annual health examination',
        value: 500,
        status: BenefitStatus.ACTIVE
        // Omitting utilizationDate and providerId which are optional
      };

      const benefitDataObj = plainToClass(BenefitData, benefitData);
      const errors = await validate(benefitDataObj);
      expect(errors.length).toBe(0);
    });

    it('should calculate remaining value correctly', () => {
      const benefitData = new BenefitData();
      benefitData.value = 1000;
      benefitData.usedValue = 250;

      expect(benefitData.getRemainingValue()).toBe(750);
    });

    it('should determine if benefit is fully utilized', () => {
      const benefitData = new BenefitData();
      benefitData.value = 1000;
      benefitData.usedValue = 1000;

      expect(benefitData.isFullyUtilized()).toBe(true);

      benefitData.usedValue = 999;
      expect(benefitData.isFullyUtilized()).toBe(false);
    });

    it('should validate benefit utilization within limits', () => {
      const benefitData = new BenefitData();
      benefitData.value = 1000;
      benefitData.usedValue = 500;

      expect(benefitData.canUtilize(300)).toBe(true);
      expect(benefitData.canUtilize(501)).toBe(false);
    });

    it('should track utilization history correctly', () => {
      const benefitData = new BenefitData();
      benefitData.value = 1000;
      benefitData.utilizationHistory = [];

      const utilization1 = {
        amount: 200,
        date: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const utilization2 = {
        amount: 300,
        date: new Date().toISOString(),
        providerId: '123e4567-e89b-12d3-a456-426614174002'
      };

      benefitData.addUtilization(utilization1);
      expect(benefitData.utilizationHistory.length).toBe(1);
      expect(benefitData.usedValue).toBe(200);

      benefitData.addUtilization(utilization2);
      expect(benefitData.utilizationHistory.length).toBe(2);
      expect(benefitData.usedValue).toBe(500);
    });
  });

  describe('BenefitUtilizedEventDto', () => {
    it('should validate a valid benefit utilization event', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          utilizationAmount: 500,
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when utilizationAmount exceeds benefit value', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 500,
          utilizationAmount: 1000, // Exceeds benefit value
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('data');
    });

    it('should fail validation when benefit status is not active', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          utilizationAmount: 500,
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.EXPIRED // Not active
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate utilization with previous usage history', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          usedValue: 300, // Previous usage
          utilizationAmount: 500, // Current usage
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.ACTIVE,
          utilizationHistory: [
            {
              amount: 300,
              date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              providerId: '123e4567-e89b-12d3-a456-426614174003'
            }
          ]
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when combined utilization exceeds benefit value', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          usedValue: 700, // Previous usage
          utilizationAmount: 500, // Current usage (total would be 1200, exceeding 1000)
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('BenefitRedemptionEventDto', () => {
    it('should validate a valid benefit redemption event', async () => {
      const eventDto: BenefitRedemptionEventDto = {
        type: EventType.PLAN_REWARD_REDEEMED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.REWARD,
          benefitCategory: BenefitCategory.DISCOUNT,
          name: 'Premium Discount',
          description: 'Discount on insurance premium',
          value: 500,
          pointsRequired: 5000,
          pointsRedeemed: 5000,
          redemptionDate: new Date().toISOString(),
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitRedemptionEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when pointsRedeemed is less than pointsRequired', async () => {
      const eventDto: BenefitRedemptionEventDto = {
        type: EventType.PLAN_REWARD_REDEEMED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.REWARD,
          benefitCategory: BenefitCategory.DISCOUNT,
          name: 'Premium Discount',
          description: 'Discount on insurance premium',
          value: 500,
          pointsRequired: 5000,
          pointsRedeemed: 4000, // Less than required
          redemptionDate: new Date().toISOString(),
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitRedemptionEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when benefit type is not REWARD', async () => {
      const eventDto: BenefitRedemptionEventDto = {
        type: EventType.PLAN_REWARD_REDEEMED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS, // Not a reward type
          benefitCategory: BenefitCategory.DISCOUNT,
          name: 'Premium Discount',
          description: 'Discount on insurance premium',
          value: 500,
          pointsRequired: 5000,
          pointsRedeemed: 5000,
          redemptionDate: new Date().toISOString(),
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitRedemptionEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate redemption with valid conversion rate', async () => {
      const eventDto: BenefitRedemptionEventDto = {
        type: EventType.PLAN_REWARD_REDEEMED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.REWARD,
          benefitCategory: BenefitCategory.DISCOUNT,
          name: 'Premium Discount',
          description: 'Discount on insurance premium',
          value: 500,
          pointsRequired: 5000,
          pointsRedeemed: 5000,
          pointConversionRate: 0.1, // 1 point = 0.1 currency units
          redemptionDate: new Date().toISOString(),
          status: BenefitStatus.ACTIVE
        }
      };

      const eventDtoObj = plainToClass(BenefitRedemptionEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
      
      // Value should match points * conversion rate
      expect(eventDtoObj.data.value).toBe(5000 * 0.1);
    });
  });

  describe('BenefitStatusChangeEventDto', () => {
    it('should validate a valid benefit status change event', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED', // Custom event type not in enum
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.ACTIVE,
          newStatus: BenefitStatus.EXPIRED,
          statusChangeDate: new Date().toISOString(),
          statusChangeReason: 'Benefit period ended'
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when previous and new status are the same', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED',
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.ACTIVE,
          newStatus: BenefitStatus.ACTIVE, // Same as previous
          statusChangeDate: new Date().toISOString(),
          statusChangeReason: 'No change'
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should fail validation when status change reason is missing', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED',
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.ACTIVE,
          newStatus: BenefitStatus.EXPIRED,
          statusChangeDate: new Date().toISOString()
          // Missing statusChangeReason
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate transition from PENDING to ACTIVE status', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED',
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.PENDING,
          newStatus: BenefitStatus.ACTIVE,
          statusChangeDate: new Date().toISOString(),
          statusChangeReason: 'Benefit approved and activated',
          activationDate: new Date().toISOString() // Required for ACTIVE status
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should fail validation when activationDate is missing for ACTIVE status', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED',
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.PENDING,
          newStatus: BenefitStatus.ACTIVE,
          statusChangeDate: new Date().toISOString(),
          statusChangeReason: 'Benefit approved and activated'
          // Missing activationDate
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Plan Journey', () => {
    it('should validate benefit utilization in the context of plan journey', async () => {
      const eventDto: BenefitUtilizedEventDto = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          utilizationAmount: 500,
          utilizationDate: new Date().toISOString(),
          providerId: '123e4567-e89b-12d3-a456-426614174002',
          status: BenefitStatus.ACTIVE,
          planId: '123e4567-e89b-12d3-a456-426614174003', // Plan reference
          membershipId: '123e4567-e89b-12d3-a456-426614174004' // Membership reference
        }
      };

      const eventDtoObj = plainToClass(BenefitUtilizedEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should validate benefit redemption in the context of gamification', async () => {
      const eventDto: BenefitRedemptionEventDto = {
        type: EventType.PLAN_REWARD_REDEEMED,
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.REWARD,
          benefitCategory: BenefitCategory.DISCOUNT,
          name: 'Premium Discount',
          description: 'Discount on insurance premium',
          value: 500,
          pointsRequired: 5000,
          pointsRedeemed: 5000,
          redemptionDate: new Date().toISOString(),
          status: BenefitStatus.ACTIVE,
          achievementId: '123e4567-e89b-12d3-a456-426614174005', // Achievement reference
          gamificationLevel: 3 // User's gamification level
        }
      };

      const eventDtoObj = plainToClass(BenefitRedemptionEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });

    it('should validate benefit status change with plan-specific fields', async () => {
      const eventDto: BenefitStatusChangeEventDto = {
        type: 'PLAN_BENEFIT_STATUS_CHANGED',
        journey: 'plan',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174001',
          benefitType: BenefitType.WELLNESS,
          benefitCategory: BenefitCategory.PREVENTIVE,
          name: 'Annual Health Checkup',
          description: 'Comprehensive annual health examination',
          value: 1000,
          previousStatus: BenefitStatus.ACTIVE,
          newStatus: BenefitStatus.EXPIRED,
          statusChangeDate: new Date().toISOString(),
          statusChangeReason: 'Plan year ended',
          planId: '123e4567-e89b-12d3-a456-426614174003',
          planYear: 2023,
          renewalEligible: true // Indicates if benefit can be renewed
        }
      };

      const eventDtoObj = plainToClass(BenefitStatusChangeEventDto, eventDto);
      const errors = await validate(eventDtoObj);
      expect(errors.length).toBe(0);
    });
  });
});