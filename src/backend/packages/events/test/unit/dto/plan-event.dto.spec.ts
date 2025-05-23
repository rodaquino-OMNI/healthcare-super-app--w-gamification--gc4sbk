import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import {
  PlanEventDto,
  ClaimSubmissionEventDto,
  ClaimSubmissionDataDto,
  ClaimStatusUpdateEventDto,
  ClaimStatusUpdateDataDto,
  BenefitUtilizationEventDto,
  BenefitUtilizationDataDto,
  PlanSelectionEventDto,
  PlanSelectionDataDto,
  PlanComparisonEventDto,
  PlanComparisonDataDto,
  RewardRedemptionEventDto,
  RewardRedemptionDataDto,
  CurrencyAmountDto,
  DocumentReferenceDto,
  ClaimStatus,
  ClaimType,
  BenefitType,
  PlanType
} from '../../../src/dto/plan-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';
import { validateDto, createPlanEventData } from './test-utils';

describe('PlanEventDto', () => {
  describe('Base PlanEventDto', () => {
    it('should validate a valid plan event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          claimType: ClaimType.MEDICAL,
          amount: { amount: '150.75', currency: 'BRL' },
          serviceDate: new Date().toISOString(),
          providerId: 'provider_789',
          providerName: 'Clínica São Paulo'
        }
      };
      const dto = plainToInstance(PlanEventDto, eventData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should enforce journey to be "plan"', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: uuidv4(),
        journey: 'health', // Invalid journey for PlanEventDto
        timestamp: new Date().toISOString(),
        data: {}
      };
      const dto = plainToInstance(PlanEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('journey')).toBe(true);
    });
  });

  describe('CurrencyAmountDto', () => {
    it('should validate a valid currency amount', async () => {
      // Arrange
      const currencyData = {
        amount: '150.75',
        currency: 'BRL'
      };
      const dto = plainToInstance(CurrencyAmountDto, currencyData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject negative amounts', async () => {
      // Arrange
      const currencyData = {
        amount: '-150.75',
        currency: 'BRL'
      };
      const dto = plainToInstance(CurrencyAmountDto, currencyData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('amount')).toBe(true);
    });

    it('should validate currency code format', async () => {
      // Arrange
      const currencyData = {
        amount: '150.75',
        currency: 'br' // Invalid currency code (should be 3 uppercase letters)
      };
      const dto = plainToInstance(CurrencyAmountDto, currencyData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('currency')).toBe(true);
    });
  });

  describe('DocumentReferenceDto', () => {
    it('should validate a valid document reference', async () => {
      // Arrange
      const documentData = {
        id: 'doc_12345',
        type: 'receipt',
        url: 'https://storage.example.com/documents/receipt_12345.pdf'
      };
      const dto = plainToInstance(DocumentReferenceDto, documentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate a document reference without optional url', async () => {
      // Arrange
      const documentData = {
        id: 'doc_12345',
        type: 'receipt'
      };
      const dto = plainToInstance(DocumentReferenceDto, documentData);

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject a document reference without required fields', async () => {
      // Arrange
      const documentData = {
        id: 'doc_12345'
        // Missing 'type' field
      };
      const dto = plainToInstance(DocumentReferenceDto, documentData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.hasErrorForProperty('type')).toBe(true);
    });
  });

  describe('ClaimSubmissionEventDto', () => {
    it('should validate a valid claim submission event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          claimType: ClaimType.MEDICAL,
          amount: {
            amount: '150.75',
            currency: 'BRL'
          },
          serviceDate: new Date().toISOString(),
          providerId: 'provider_789',
          providerName: 'Clínica São Paulo',
          description: 'Annual physical examination',
          documents: [
            {
              id: 'doc_12345',
              type: 'receipt',
              url: 'https://storage.example.com/documents/receipt_12345.pdf'
            }
          ]
        }
      };
      const dto = plainToInstance(ClaimSubmissionEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should reject a claim submission with missing required fields', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          // Missing claimType
          amount: {
            amount: '150.75',
            currency: 'BRL'
          },
          // Missing serviceDate
          providerId: 'provider_789',
          // Missing providerName
        }
      };
      const dto = plainToInstance(ClaimSubmissionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errorCount).toBeGreaterThan(0);
    });

    it('should validate claim type enum values', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          claimType: 'invalid_type', // Invalid claim type
          amount: {
            amount: '150.75',
            currency: 'BRL'
          },
          serviceDate: new Date().toISOString(),
          providerId: 'provider_789',
          providerName: 'Clínica São Paulo'
        }
      };
      const dto = plainToInstance(ClaimSubmissionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const claimTypeErrors = dataErrors.find(e => e.property === 'claimType');
      expect(claimTypeErrors).toBeDefined();
    });
  });

  describe('ClaimStatusUpdateEventDto', () => {
    it('should validate a valid claim status update event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_APPROVED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          previousStatus: ClaimStatus.SUBMITTED,
          newStatus: ClaimStatus.APPROVED,
          updateTimestamp: new Date().toISOString(),
          reason: 'All documentation verified',
          approvedAmount: {
            amount: '150.75',
            currency: 'BRL'
          }
        }
      };
      const dto = plainToInstance(ClaimStatusUpdateEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate status transitions', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_CLAIM_APPROVED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: 'claim_12345',
          previousStatus: ClaimStatus.SUBMITTED,
          newStatus: 'invalid_status', // Invalid status
          updateTimestamp: new Date().toISOString()
        }
      };
      const dto = plainToInstance(ClaimStatusUpdateEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const statusErrors = dataErrors.find(e => e.property === 'newStatus');
      expect(statusErrors).toBeDefined();
    });
  });

  describe('BenefitUtilizationEventDto', () => {
    it('should validate a valid benefit utilization event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: 'benefit_456',
          benefitType: BenefitType.PREVENTIVE_CARE,
          benefitName: 'Annual Preventive Check-up',
          utilizationDate: new Date().toISOString(),
          providerId: 'provider_789',
          providerName: 'Clínica São Paulo',
          value: {
            amount: '150.75',
            currency: 'BRL'
          },
          isFirstUtilization: true,
          remainingUtilizations: 2
        }
      };
      const dto = plainToInstance(BenefitUtilizationEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate benefit type enum values', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: 'benefit_456',
          benefitType: 'invalid_type', // Invalid benefit type
          benefitName: 'Annual Preventive Check-up',
          utilizationDate: new Date().toISOString()
        }
      };
      const dto = plainToInstance(BenefitUtilizationEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const typeErrors = dataErrors.find(e => e.property === 'benefitType');
      expect(typeErrors).toBeDefined();
    });

    it('should validate remaining utilizations is not negative', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_BENEFIT_UTILIZED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          benefitId: 'benefit_456',
          benefitType: BenefitType.PREVENTIVE_CARE,
          benefitName: 'Annual Preventive Check-up',
          utilizationDate: new Date().toISOString(),
          remainingUtilizations: -1 // Invalid negative value
        }
      };
      const dto = plainToInstance(BenefitUtilizationEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const utilizationsErrors = dataErrors.find(e => e.property === 'remainingUtilizations');
      expect(utilizationsErrors).toBeDefined();
    });
  });

  describe('PlanSelectionEventDto', () => {
    it('should validate a valid plan selection event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_SELECTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planId: 'plan_789',
          planType: PlanType.PPO,
          planName: 'AUSTA Premium Family Plan',
          selectionDate: new Date().toISOString(),
          effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days in the future
          previousPlanId: 'plan_456',
          premium: {
            amount: '500.00',
            currency: 'BRL'
          },
          coverageLevel: 'family',
          dependentCount: 3
        }
      };
      const dto = plainToInstance(PlanSelectionEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate plan type enum values', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_SELECTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planId: 'plan_789',
          planType: 'invalid_type', // Invalid plan type
          planName: 'AUSTA Premium Family Plan',
          selectionDate: new Date().toISOString(),
          effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          premium: {
            amount: '500.00',
            currency: 'BRL'
          },
          coverageLevel: 'family'
        }
      };
      const dto = plainToInstance(PlanSelectionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const typeErrors = dataErrors.find(e => e.property === 'planType');
      expect(typeErrors).toBeDefined();
    });

    it('should validate dependent count is not negative', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_SELECTED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planId: 'plan_789',
          planType: PlanType.PPO,
          planName: 'AUSTA Premium Family Plan',
          selectionDate: new Date().toISOString(),
          effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          premium: {
            amount: '500.00',
            currency: 'BRL'
          },
          coverageLevel: 'family',
          dependentCount: -1 // Invalid negative value
        }
      };
      const dto = plainToInstance(PlanSelectionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const countErrors = dataErrors.find(e => e.property === 'dependentCount');
      expect(countErrors).toBeDefined();
    });
  });

  describe('PlanComparisonEventDto', () => {
    it('should validate a valid plan comparison event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_COMPARISON_PERFORMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planIds: ['plan_123', 'plan_456', 'plan_789'],
          comparisonDate: new Date().toISOString(),
          criteria: ['premium', 'deductible', 'coverage'],
          selectedPlanId: 'plan_456',
          sessionDuration: 300
        }
      };
      const dto = plainToInstance(PlanComparisonEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate plan IDs array is not empty', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_COMPARISON_PERFORMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planIds: [], // Empty array
          comparisonDate: new Date().toISOString()
        }
      };
      const dto = plainToInstance(PlanComparisonEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const planIdsErrors = dataErrors.find(e => e.property === 'planIds');
      expect(planIdsErrors).toBeDefined();
    });

    it('should validate session duration is positive', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_COMPARISON_PERFORMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          planIds: ['plan_123', 'plan_456', 'plan_789'],
          comparisonDate: new Date().toISOString(),
          sessionDuration: -10 // Invalid negative value
        }
      };
      const dto = plainToInstance(PlanComparisonEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const durationErrors = dataErrors.find(e => e.property === 'sessionDuration');
      expect(durationErrors).toBeDefined();
    });
  });

  describe('RewardRedemptionEventDto', () => {
    it('should validate a valid reward redemption event', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          rewardId: 'reward_123',
          rewardName: 'Premium Plan Discount',
          redemptionDate: new Date().toISOString(),
          pointsSpent: 500,
          value: {
            amount: '50.00',
            currency: 'BRL'
          },
          category: 'premium_discount',
          expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days in the future
          isApplied: true
        }
      };
      const dto = plainToInstance(RewardRedemptionEventDto, eventData);

      // Act
      const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      // Assert
      expect(errors.length).toBe(0);
    });

    it('should validate points spent is positive', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          rewardId: 'reward_123',
          rewardName: 'Premium Plan Discount',
          redemptionDate: new Date().toISOString(),
          pointsSpent: 0, // Invalid zero value
          category: 'premium_discount'
        }
      };
      const dto = plainToInstance(RewardRedemptionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const pointsErrors = dataErrors.find(e => e.property === 'pointsSpent');
      expect(pointsErrors).toBeDefined();
    });

    it('should validate date formats', async () => {
      // Arrange
      const eventData = {
        type: EventType.PLAN_REWARD_REDEEMED,
        userId: uuidv4(),
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          rewardId: 'reward_123',
          rewardName: 'Premium Plan Discount',
          redemptionDate: 'invalid-date', // Invalid date format
          pointsSpent: 500,
          category: 'premium_discount'
        }
      };
      const dto = plainToInstance(RewardRedemptionEventDto, eventData);

      // Act
      const result = await validateDto(dto);

      // Assert
      expect(result.isValid).toBe(false);
      // Check for nested validation errors
      const dataErrors = result.errors.find(e => e.property === 'data')?.children || [];
      const dateErrors = dataErrors.find(e => e.property === 'redemptionDate');
      expect(dateErrors).toBeDefined();
    });
  });

  describe('Integration with event processing pipeline', () => {
    it('should properly validate plan events in the processing pipeline', async () => {
      // This test simulates how events would be validated in the actual event processing pipeline
      
      // Arrange - Create events of different types
      const events = [
        // Claim submission event
        plainToInstance(ClaimSubmissionEventDto, {
          type: EventType.PLAN_CLAIM_SUBMITTED,
          userId: uuidv4(),
          journey: 'plan',
          timestamp: new Date().toISOString(),
          data: {
            claimId: 'claim_12345',
            claimType: ClaimType.MEDICAL,
            amount: { amount: '150.75', currency: 'BRL' },
            serviceDate: new Date().toISOString(),
            providerId: 'provider_789',
            providerName: 'Clínica São Paulo'
          }
        }),
        
        // Benefit utilization event
        plainToInstance(BenefitUtilizationEventDto, {
          type: EventType.PLAN_BENEFIT_UTILIZED,
          userId: uuidv4(),
          journey: 'plan',
          timestamp: new Date().toISOString(),
          data: {
            benefitId: 'benefit_456',
            benefitType: BenefitType.PREVENTIVE_CARE,
            benefitName: 'Annual Preventive Check-up',
            utilizationDate: new Date().toISOString()
          }
        }),
        
        // Plan selection event
        plainToInstance(PlanSelectionEventDto, {
          type: EventType.PLAN_SELECTED,
          userId: uuidv4(),
          journey: 'plan',
          timestamp: new Date().toISOString(),
          data: {
            planId: 'plan_789',
            planType: PlanType.PPO,
            planName: 'AUSTA Premium Family Plan',
            selectionDate: new Date().toISOString(),
            effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            premium: { amount: '500.00', currency: 'BRL' },
            coverageLevel: 'family'
          }
        })
      ];
      
      // Act - Validate all events
      const validationResults = await Promise.all(
        events.map(event => validate(event, { whitelist: true, forbidNonWhitelisted: true }))
      );
      
      // Assert - All events should be valid
      validationResults.forEach((errors, index) => {
        expect(errors.length).toBe(0, `Event at index ${index} has validation errors`);
      });
    });
  });
});