/**
 * @file plan-journey-events.e2e-spec.ts
 * @description End-to-end tests for Plan Journey events, validating the complete flow
 * of plan-related events from production to consumption.
 */

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// Import test helpers
import {
  createTestEnvironment,
  TestEnvironmentContext,
  publishTestEvent,
  waitForEvent,
  createTestEvent,
  TestDatabaseSeeder,
  waitForCondition,
} from './test-helpers';

// Import event interfaces
import {
  JourneyType,
  PlanEventType,
  IClaimSubmittedEvent,
  IClaimUpdatedEvent,
  IClaimApprovedEvent,
  IClaimDeniedEvent,
  IBenefitUsedEvent,
  IBenefitLimitReachedEvent,
  IPlanSelectedEvent,
  IPlanChangedEvent,
  IPlanRenewedEvent,
  IPlanComparedEvent,
  IRewardRedeemedEvent,
  PlanJourneyEvent,
} from '../../src/interfaces/journey-events.interface';
import { IEvent } from '../../src/interfaces/base-event.interface';
import { EventVersion } from '../../src/interfaces/event-versioning.interface';

// Import Plan Journey interfaces
import {
  IPlan,
  IClaim,
  IBenefit,
  ClaimStatus,
} from '@austa/interfaces/journey/plan';

// Test configuration
const KAFKA_TOPIC = 'plan.events';
const TEST_TIMEOUT = 30000; // 30 seconds

describe('Plan Journey Events (e2e)', () => {
  let testContext: TestEnvironmentContext;
  let seeder: TestDatabaseSeeder;
  
  // Test data
  let userId: string;
  let testPlan: IPlan;
  let testClaim: IClaim;
  let testBenefit: IBenefit;
  
  beforeAll(async () => {
    // Create test environment with Kafka and database
    testContext = await createTestEnvironment({
      topics: [KAFKA_TOPIC],
      enableKafka: true,
      enableDatabase: true,
    });
    
    // Initialize database seeder
    seeder = new TestDatabaseSeeder(testContext.prisma);
    
    // Clean database and seed test data
    await seeder.cleanDatabase();
    const users = await seeder.seedTestUsers();
    userId = users[0].id;
    
    // Seed Plan Journey specific data
    await seeder.seedJourneyData('plan');
    
    // Create test data
    testPlan = {
      id: uuidv4(),
      name: 'Premium Health Plan',
      description: 'Comprehensive health coverage with premium benefits',
      provider: 'AUSTA Insurance',
      type: 'Premium',
      price: 500.00,
      currency: 'BRL',
      coverageStartDate: new Date().toISOString(),
      coverageEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      status: 'active',
    };
    
    testClaim = {
      id: uuidv4(),
      userId,
      planId: testPlan.id,
      type: 'Consulta Médica',
      provider: 'Dr. Silva',
      serviceDate: new Date().toISOString(),
      submissionDate: new Date().toISOString(),
      amount: 250.00,
      status: ClaimStatus.SUBMITTED,
      documents: [],
    };
    
    testBenefit = {
      id: uuidv4(),
      name: 'Annual Check-up',
      description: 'Comprehensive annual health examination',
      coveragePercentage: 100,
      annualLimit: 1,
      monetaryLimit: null,
      requiresPreApproval: false,
      planId: testPlan.id,
    };
  }, TEST_TIMEOUT);
  
  afterAll(async () => {
    // Clean up test environment
    await testContext.cleanup();
  }, TEST_TIMEOUT);
  
  describe('Claim Events', () => {
    it('should process CLAIM_SUBMITTED events', async () => {
      // Create claim submitted event
      const event = createTestEvent<IClaimSubmittedEvent['payload']>(
        PlanEventType.CLAIM_SUBMITTED,
        {
          claim: testClaim,
          submissionDate: new Date().toISOString(),
          amount: testClaim.amount,
          serviceDate: testClaim.serviceDate,
          provider: testClaim.provider,
          hasDocuments: false,
          documentCount: 0,
          isFirstClaim: true,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IClaimSubmittedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IClaimSubmittedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.CLAIM_SUBMITTED && e.payload.claim.id === testClaim.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.CLAIM_SUBMITTED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.claim.id).toBe(testClaim.id);
      expect(processedEvent.payload.amount).toBe(testClaim.amount);
      expect(processedEvent.payload.provider).toBe(testClaim.provider);
    });
    
    it('should process CLAIM_UPDATED events', async () => {
      // Create claim updated event
      const event = createTestEvent<IClaimUpdatedEvent['payload']>(
        PlanEventType.CLAIM_UPDATED,
        {
          claim: {
            ...testClaim,
            status: ClaimStatus.UNDER_REVIEW,
          },
          updateDate: new Date().toISOString(),
          previousStatus: ClaimStatus.SUBMITTED,
          newStatus: ClaimStatus.UNDER_REVIEW,
          updatedFields: ['status'],
          documentsAdded: true,
          documentCount: 2,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IClaimUpdatedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IClaimUpdatedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.CLAIM_UPDATED && e.payload.claim.id === testClaim.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.CLAIM_UPDATED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.claim.id).toBe(testClaim.id);
      expect(processedEvent.payload.previousStatus).toBe(ClaimStatus.SUBMITTED);
      expect(processedEvent.payload.newStatus).toBe(ClaimStatus.UNDER_REVIEW);
      expect(processedEvent.payload.updatedFields).toContain('status');
    });
    
    it('should process CLAIM_APPROVED events', async () => {
      // Create claim approved event
      const event = createTestEvent<IClaimApprovedEvent['payload']>(
        PlanEventType.CLAIM_APPROVED,
        {
          claim: {
            ...testClaim,
            status: ClaimStatus.APPROVED,
          },
          approvalDate: new Date().toISOString(),
          submittedAmount: testClaim.amount,
          approvedAmount: testClaim.amount,
          coveragePercentage: 80,
          processingDays: 3,
          paymentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          paymentMethod: 'bank_transfer',
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IClaimApprovedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IClaimApprovedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.CLAIM_APPROVED && e.payload.claim.id === testClaim.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.CLAIM_APPROVED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.claim.id).toBe(testClaim.id);
      expect(processedEvent.payload.approvedAmount).toBe(testClaim.amount);
      expect(processedEvent.payload.coveragePercentage).toBe(80);
      expect(processedEvent.payload.paymentMethod).toBe('bank_transfer');
    });
    
    it('should process CLAIM_DENIED events', async () => {
      // Create claim denied event
      const event = createTestEvent<IClaimDeniedEvent['payload']>(
        PlanEventType.CLAIM_DENIED,
        {
          claim: {
            ...testClaim,
            status: ClaimStatus.DENIED,
          },
          denialDate: new Date().toISOString(),
          denialReason: 'Service not covered by plan',
          submittedAmount: testClaim.amount,
          processingDays: 5,
          appealEligible: true,
          appealDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          additionalInfoRequired: ['medical_report', 'prescription'],
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IClaimDeniedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IClaimDeniedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.CLAIM_DENIED && e.payload.claim.id === testClaim.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.CLAIM_DENIED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.claim.id).toBe(testClaim.id);
      expect(processedEvent.payload.denialReason).toBe('Service not covered by plan');
      expect(processedEvent.payload.appealEligible).toBe(true);
      expect(processedEvent.payload.additionalInfoRequired).toContain('medical_report');
    });
  });
  
  describe('Benefit Events', () => {
    it('should process BENEFIT_USED events', async () => {
      // Create benefit used event
      const event = createTestEvent<IBenefitUsedEvent['payload']>(
        PlanEventType.BENEFIT_USED,
        {
          benefit: testBenefit,
          usageDate: new Date().toISOString(),
          provider: 'Clínica São Lucas',
          serviceDescription: 'Annual health check-up',
          amountUsed: 1,
          remainingAmount: 0,
          remainingPercentage: 0,
          isFirstUse: true,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IBenefitUsedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IBenefitUsedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.BENEFIT_USED && e.payload.benefit.id === testBenefit.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.BENEFIT_USED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.benefit.id).toBe(testBenefit.id);
      expect(processedEvent.payload.serviceDescription).toBe('Annual health check-up');
      expect(processedEvent.payload.isFirstUse).toBe(true);
    });
    
    it('should process BENEFIT_LIMIT_REACHED events', async () => {
      // Create benefit limit reached event
      const event = createTestEvent<IBenefitLimitReachedEvent['payload']>(
        PlanEventType.BENEFIT_LIMIT_REACHED,
        {
          benefit: testBenefit,
          reachedDate: new Date().toISOString(),
          limitType: 'visits',
          limitValue: 1,
          renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          alternativeBenefits: [],
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IBenefitLimitReachedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IBenefitLimitReachedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.BENEFIT_LIMIT_REACHED && e.payload.benefit.id === testBenefit.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.BENEFIT_LIMIT_REACHED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.benefit.id).toBe(testBenefit.id);
      expect(processedEvent.payload.limitType).toBe('visits');
      expect(processedEvent.payload.limitValue).toBe(1);
    });
  });
  
  describe('Plan Events', () => {
    it('should process PLAN_SELECTED events', async () => {
      // Create plan selected event
      const event = createTestEvent<IPlanSelectedEvent['payload']>(
        PlanEventType.PLAN_SELECTED,
        {
          plan: testPlan,
          selectionDate: new Date().toISOString(),
          effectiveDate: testPlan.coverageStartDate,
          premium: testPlan.price,
          paymentFrequency: 'monthly',
          isFirstPlan: true,
          comparedPlansCount: 3,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IPlanSelectedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IPlanSelectedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.PLAN_SELECTED && e.payload.plan.id === testPlan.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.PLAN_SELECTED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.plan.id).toBe(testPlan.id);
      expect(processedEvent.payload.premium).toBe(testPlan.price);
      expect(processedEvent.payload.isFirstPlan).toBe(true);
    });
    
    it('should process PLAN_CHANGED events', async () => {
      // Create a new plan for comparison
      const newPlan: IPlan = {
        ...testPlan,
        id: uuidv4(),
        name: 'Premium Plus Health Plan',
        price: 650.00,
      };
      
      // Create plan changed event
      const event = createTestEvent<IPlanChangedEvent['payload']>(
        PlanEventType.PLAN_CHANGED,
        {
          oldPlan: testPlan,
          newPlan: newPlan,
          changeDate: new Date().toISOString(),
          effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          premiumDifference: newPlan.price - testPlan.price,
          changeReason: 'Upgrade to better coverage',
          benefitChanges: {
            added: ['Dental coverage', 'Vision care'],
            removed: [],
            improved: ['Annual check-up limit increased'],
            reduced: [],
          },
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IPlanChangedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IPlanChangedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.PLAN_CHANGED && e.payload.newPlan.id === newPlan.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.PLAN_CHANGED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.oldPlan.id).toBe(testPlan.id);
      expect(processedEvent.payload.newPlan.id).toBe(newPlan.id);
      expect(processedEvent.payload.premiumDifference).toBe(150);
      expect(processedEvent.payload.benefitChanges.added).toContain('Dental coverage');
    });
    
    it('should process PLAN_RENEWED events', async () => {
      // Create plan renewed event
      const event = createTestEvent<IPlanRenewedEvent['payload']>(
        PlanEventType.PLAN_RENEWED,
        {
          plan: testPlan,
          renewalDate: new Date().toISOString(),
          previousEndDate: testPlan.coverageEndDate,
          newEndDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years from now
          premiumChange: 25.00,
          premiumChangePercentage: 5,
          benefitChanges: true,
          yearsWithPlan: 1,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IPlanRenewedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IPlanRenewedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.PLAN_RENEWED && e.payload.plan.id === testPlan.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.PLAN_RENEWED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.plan.id).toBe(testPlan.id);
      expect(processedEvent.payload.premiumChange).toBe(25.00);
      expect(processedEvent.payload.premiumChangePercentage).toBe(5);
      expect(processedEvent.payload.yearsWithPlan).toBe(1);
    });
    
    it('should process PLAN_COMPARED events', async () => {
      // Create alternative plans for comparison
      const alternativePlans: IPlan[] = [
        {
          ...testPlan,
          id: uuidv4(),
          name: 'Basic Health Plan',
          price: 300.00,
          type: 'Basic',
        },
        {
          ...testPlan,
          id: uuidv4(),
          name: 'Standard Health Plan',
          price: 400.00,
          type: 'Standard',
        },
        testPlan,
      ];
      
      // Create plan compared event
      const event = createTestEvent<IPlanComparedEvent['payload']>(
        PlanEventType.PLAN_COMPARED,
        {
          plansCompared: alternativePlans,
          comparisonDate: new Date().toISOString(),
          comparisonCriteria: ['price', 'coverage', 'network'],
          selectedPlanId: testPlan.id,
          comparisonDuration: 300, // 5 minutes in seconds
          userPreferences: {
            prioritizeCoverage: true,
            maxBudget: 600,
            preferredHospitals: ['Hospital São Paulo'],
          },
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IPlanComparedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IPlanComparedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.PLAN_COMPARED && e.payload.selectedPlanId === testPlan.id,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.PLAN_COMPARED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.plansCompared.length).toBe(3);
      expect(processedEvent.payload.selectedPlanId).toBe(testPlan.id);
      expect(processedEvent.payload.comparisonCriteria).toContain('price');
    });
  });
  
  describe('Reward Events', () => {
    it('should process REWARD_REDEEMED events', async () => {
      // Create reward redeemed event
      const event = createTestEvent<IRewardRedeemedEvent['payload']>(
        PlanEventType.REWARD_REDEEMED,
        {
          rewardId: uuidv4(),
          rewardName: 'Premium Discount',
          rewardType: 'discount',
          redemptionDate: new Date().toISOString(),
          pointsUsed: 1000,
          monetaryValue: 50.00,
          expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
          isFirstRedemption: true,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IRewardRedeemedEvent;
      
      // Publish event
      await publishTestEvent(testContext, event, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait for event to be processed
      const processedEvent = await waitForEvent<IRewardRedeemedEvent>(testContext, {
        topic: KAFKA_TOPIC,
        timeout: 5000,
        filter: (e) => e.type === PlanEventType.REWARD_REDEEMED && e.payload.rewardId === event.payload.rewardId,
      });
      
      // Verify event was processed correctly
      expect(processedEvent).not.toBeNull();
      expect(processedEvent.type).toBe(PlanEventType.REWARD_REDEEMED);
      expect(processedEvent.journeyType).toBe(JourneyType.PLAN);
      expect(processedEvent.userId).toBe(userId);
      expect(processedEvent.payload.rewardId).toBe(event.payload.rewardId);
      expect(processedEvent.payload.rewardName).toBe('Premium Discount');
      expect(processedEvent.payload.pointsUsed).toBe(1000);
      expect(processedEvent.payload.isFirstRedemption).toBe(true);
    });
  });
  
  describe('Error Cases', () => {
    it('should reject events with missing required fields', async () => {
      // Create an invalid event missing required fields
      const invalidEvent = {
        eventId: uuidv4(),
        timestamp: new Date().toISOString(),
        version: '1.0.0' as EventVersion,
        source: 'test',
        type: PlanEventType.CLAIM_SUBMITTED,
        // Missing journeyType and userId
        payload: {
          // Missing claim and other required fields
          submissionDate: new Date().toISOString(),
        },
      } as IEvent;
      
      // Publish invalid event
      await publishTestEvent(testContext, invalidEvent, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait a short time to ensure event processing is attempted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify that no valid event was processed (should be rejected by validation)
      const processedEvent = await waitForEvent<IClaimSubmittedEvent>(testContext, {
        topic: 'error.events', // Check error topic if available
        timeout: 1000,
        filter: (e) => e.eventId === invalidEvent.eventId,
      });
      
      // Event should not be processed successfully
      expect(processedEvent).toBeNull();
    });
    
    it('should reject events with invalid field values', async () => {
      // Create an event with invalid field values
      const invalidEvent = createTestEvent<any>(
        PlanEventType.CLAIM_SUBMITTED,
        {
          claim: {
            ...testClaim,
            status: 'INVALID_STATUS', // Invalid enum value
          },
          submissionDate: 'not-a-date', // Invalid date format
          amount: 'not-a-number', // Invalid number
          serviceDate: testClaim.serviceDate,
          provider: testClaim.provider,
          hasDocuments: 'not-a-boolean', // Invalid boolean
          documentCount: -1, // Invalid negative count
          isFirstClaim: true,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IEvent;
      
      // Publish invalid event
      await publishTestEvent(testContext, invalidEvent, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait a short time to ensure event processing is attempted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify that no valid event was processed (should be rejected by validation)
      const processedEvent = await waitForEvent<IClaimSubmittedEvent>(testContext, {
        topic: 'error.events', // Check error topic if available
        timeout: 1000,
        filter: (e) => e.eventId === invalidEvent.eventId,
      });
      
      // Event should not be processed successfully
      expect(processedEvent).toBeNull();
    });
    
    it('should reject events with invalid event type', async () => {
      // Create an event with invalid event type
      const invalidEvent = createTestEvent<any>(
        'plan.invalid.event.type', // Invalid event type
        {
          claim: testClaim,
          submissionDate: new Date().toISOString(),
          amount: testClaim.amount,
          serviceDate: testClaim.serviceDate,
          provider: testClaim.provider,
          hasDocuments: false,
          documentCount: 0,
          isFirstClaim: true,
        },
        {
          journeyType: JourneyType.PLAN,
          userId,
          version: '1.0.0' as EventVersion,
        }
      ) as IEvent;
      
      // Publish invalid event
      await publishTestEvent(testContext, invalidEvent, {
        topic: KAFKA_TOPIC,
        waitForAck: true,
      });
      
      // Wait a short time to ensure event processing is attempted
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify that no valid event was processed (should be rejected by validation)
      const processedEvent = await waitForEvent<IEvent>(testContext, {
        topic: 'error.events', // Check error topic if available
        timeout: 1000,
        filter: (e) => e.eventId === invalidEvent.eventId,
      });
      
      // Event should not be processed successfully
      expect(processedEvent).toBeNull();
    });
  });
});