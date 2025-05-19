import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { PlanEventDto } from '../../../src/dto/plan-event.dto';
import { BaseEventDto } from '../../../src/dto/base-event.dto';
import { EventType } from '../../../src/dto/event-types.enum';

describe('PlanEventDto', () => {
  // Helper function to create a valid base event
  const createValidBaseEvent = () => ({
    type: EventType.PLAN_CLAIM_SUBMITTED,
    userId: '123e4567-e89b-12d3-a456-426614174000',
    journey: 'plan',
    timestamp: new Date().toISOString(),
    data: {}
  });

  describe('inheritance', () => {
    it('should extend BaseEventDto', () => {
      const planEvent = new PlanEventDto();
      expect(planEvent).toBeInstanceOf(BaseEventDto);
    });

    it('should inherit validation from BaseEventDto', async () => {
      const planEvent = plainToInstance(PlanEventDto, {
        // Missing required fields from BaseEventDto
        data: { claimId: '123' }
      });

      const errors = await validate(planEvent);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific BaseEventDto validation errors
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('type');
      expect(errorProperties).toContain('userId');
    });
  });

  describe('claim submission events', () => {
    it('should validate a valid claim submission event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_SUBMITTED,
        data: {
          claimId: '123e4567-e89b-12d3-a456-426614174001',
          claimType: 'Consulta Médica',
          amount: 150.00,
          currency: 'BRL',
          providerName: 'Clínica São Paulo',
          serviceDate: '2023-05-15T14:30:00Z',
          documentIds: ['doc-123', 'doc-456']
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject claim submission with invalid amount', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_SUBMITTED,
        data: {
          claimId: '123e4567-e89b-12d3-a456-426614174001',
          claimType: 'Consulta Médica',
          amount: -50.00, // Negative amount should be invalid
          currency: 'BRL',
          providerName: 'Clínica São Paulo',
          serviceDate: '2023-05-15T14:30:00Z'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific data validation errors
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
    });

    it('should reject claim submission with missing required fields', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_SUBMITTED,
        data: {
          // Missing claimId, claimType, and amount
          currency: 'BRL',
          providerName: 'Clínica São Paulo'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('claim status update events', () => {
    it('should validate a valid claim approval event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_APPROVED,
        data: {
          claimId: '123e4567-e89b-12d3-a456-426614174001',
          approvedAmount: 150.00,
          currency: 'BRL',
          approvalDate: '2023-05-20T10:15:00Z',
          paymentDate: '2023-05-25T00:00:00Z',
          notes: 'Claim approved in full'
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should validate a valid claim rejection event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_REJECTED,
        data: {
          claimId: '123e4567-e89b-12d3-a456-426614174001',
          rejectionReason: 'Documentation incomplete',
          rejectionDate: '2023-05-20T10:15:00Z',
          appealAllowed: true,
          appealDeadline: '2023-06-20T23:59:59Z'
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject claim status update with invalid claimId', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_CLAIM_APPROVED,
        data: {
          claimId: 'invalid-uuid-format', // Invalid UUID format
          approvedAmount: 150.00,
          currency: 'BRL'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('benefit utilization events', () => {
    it('should validate a valid benefit utilization event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_BENEFIT_UTILIZED,
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174002',
          benefitType: 'Gym Membership',
          utilizationDate: '2023-05-15T08:30:00Z',
          location: 'Academia Fitness',
          value: 100.00,
          remainingBalance: 900.00
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject benefit utilization with invalid benefit type', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_BENEFIT_UTILIZED,
        data: {
          benefitId: '123e4567-e89b-12d3-a456-426614174002',
          benefitType: '', // Empty benefit type should be invalid
          utilizationDate: '2023-05-15T08:30:00Z',
          location: 'Academia Fitness',
          value: 100.00
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject benefit utilization with missing required fields', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_BENEFIT_UTILIZED,
        data: {
          // Missing benefitId and benefitType
          utilizationDate: '2023-05-15T08:30:00Z',
          value: 100.00
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('plan selection events', () => {
    it('should validate a valid plan selection event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_SELECTED,
        data: {
          planId: '123e4567-e89b-12d3-a456-426614174003',
          planName: 'Premium',
          planType: 'Health',
          coverageStartDate: '2023-06-01T00:00:00Z',
          coverageEndDate: '2024-05-31T23:59:59Z',
          monthlyPremium: 500.00,
          currency: 'BRL',
          selectedBenefits: [
            { id: 'benefit-1', name: 'Dental Coverage' },
            { id: 'benefit-2', name: 'Vision Coverage' }
          ]
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject plan selection with invalid date range', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_SELECTED,
        data: {
          planId: '123e4567-e89b-12d3-a456-426614174003',
          planName: 'Premium',
          planType: 'Health',
          coverageStartDate: '2023-06-01T00:00:00Z',
          coverageEndDate: '2023-05-31T23:59:59Z', // End date before start date
          monthlyPremium: 500.00,
          currency: 'BRL'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject plan selection with missing required fields', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_SELECTED,
        data: {
          // Missing planId and planName
          planType: 'Health',
          monthlyPremium: 500.00,
          currency: 'BRL'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('plan comparison events', () => {
    it('should validate a valid plan comparison event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_COMPARED,
        data: {
          comparisonId: '123e4567-e89b-12d3-a456-426614174004',
          comparisonDate: '2023-05-15T14:30:00Z',
          plans: [
            { id: 'plan-1', name: 'Basic', monthlyPremium: 300.00 },
            { id: 'plan-2', name: 'Standard', monthlyPremium: 400.00 },
            { id: 'plan-3', name: 'Premium', monthlyPremium: 500.00 }
          ],
          comparisonCriteria: ['price', 'coverage', 'network'],
          selectedPlanId: 'plan-2'
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject plan comparison with too few plans', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_COMPARED,
        data: {
          comparisonId: '123e4567-e89b-12d3-a456-426614174004',
          comparisonDate: '2023-05-15T14:30:00Z',
          plans: [
            { id: 'plan-1', name: 'Basic', monthlyPremium: 300.00 }
            // Only one plan, should require at least two for comparison
          ],
          comparisonCriteria: ['price', 'coverage']
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject plan comparison with invalid selected plan', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_COMPARED,
        data: {
          comparisonId: '123e4567-e89b-12d3-a456-426614174004',
          comparisonDate: '2023-05-15T14:30:00Z',
          plans: [
            { id: 'plan-1', name: 'Basic', monthlyPremium: 300.00 },
            { id: 'plan-2', name: 'Standard', monthlyPremium: 400.00 }
          ],
          comparisonCriteria: ['price', 'coverage'],
          selectedPlanId: 'plan-3' // This plan is not in the comparison list
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('reward redemption events', () => {
    it('should validate a valid reward redemption event', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_REWARD_REDEEMED,
        data: {
          rewardId: '123e4567-e89b-12d3-a456-426614174005',
          rewardName: 'Premium Discount',
          rewardType: 'Discount',
          redemptionDate: '2023-05-15T14:30:00Z',
          pointsUsed: 1000,
          value: 50.00,
          currency: 'BRL',
          expirationDate: '2023-08-15T23:59:59Z'
        }
      });

      const errors = await validate(event);
      expect(errors).toHaveLength(0);
    });

    it('should reject reward redemption with invalid points', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_REWARD_REDEEMED,
        data: {
          rewardId: '123e4567-e89b-12d3-a456-426614174005',
          rewardName: 'Premium Discount',
          rewardType: 'Discount',
          redemptionDate: '2023-05-15T14:30:00Z',
          pointsUsed: -100, // Negative points should be invalid
          value: 50.00,
          currency: 'BRL'
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject reward redemption with missing required fields', async () => {
      const event = plainToInstance(PlanEventDto, {
        ...createValidBaseEvent(),
        type: EventType.PLAN_REWARD_REDEEMED,
        data: {
          // Missing rewardId and rewardName
          rewardType: 'Discount',
          pointsUsed: 1000,
          value: 50.00
        }
      });

      const errors = await validate(event);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('integration with event processing pipeline', () => {
    it('should be compatible with the event processing pipeline', async () => {
      // This test simulates how the event would be processed in the pipeline
      const rawEvent = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: '123e4567-e89b-12d3-a456-426614174000',
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          claimId: '123e4567-e89b-12d3-a456-426614174001',
          claimType: 'Consulta Médica',
          amount: 150.00,
          currency: 'BRL',
          providerName: 'Clínica São Paulo',
          serviceDate: '2023-05-15T14:30:00Z'
        }
      };

      // Transform plain object to class instance (as would happen in NestJS pipeline)
      const eventDto = plainToInstance(PlanEventDto, rawEvent);
      
      // Validate the event
      const errors = await validate(eventDto);
      expect(errors).toHaveLength(0);
      
      // Check that the transformed object has the expected properties
      expect(eventDto.type).toBe(EventType.PLAN_CLAIM_SUBMITTED);
      expect(eventDto.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(eventDto.journey).toBe('plan');
      expect(eventDto.data).toHaveProperty('claimId');
      expect(eventDto.data).toHaveProperty('amount', 150.00);
    });

    it('should reject invalid events in the processing pipeline', async () => {
      // This test simulates how invalid events would be rejected in the pipeline
      const rawEvent = {
        type: EventType.PLAN_CLAIM_SUBMITTED,
        userId: 'invalid-uuid', // Invalid UUID format
        journey: 'plan',
        timestamp: new Date().toISOString(),
        data: {
          // Missing required fields
          providerName: 'Clínica São Paulo'
        }
      };

      // Transform plain object to class instance (as would happen in NestJS pipeline)
      const eventDto = plainToInstance(PlanEventDto, rawEvent);
      
      // Validate the event
      const errors = await validate(eventDto);
      expect(errors.length).toBeGreaterThan(0);
      
      // Check for specific validation errors
      const errorProperties = errors.map(error => error.property);
      expect(errorProperties).toContain('userId'); // Should have userId validation error
      
      // Check for nested data validation errors
      const dataErrors = errors.find(error => error.property === 'data');
      expect(dataErrors).toBeDefined();
    });
  });
});