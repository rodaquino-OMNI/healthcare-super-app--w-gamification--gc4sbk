import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { TOPICS } from '../../src/constants/topics.constants';
import { KafkaService } from '../../src/kafka/kafka.service';
import { EventSchemaRegistry } from '../../src/schema/schema-registry.service';
import {
  TestEnvironment,
  createTestUser,
  createTestClaim,
  createTestEvent,
  assertEvent,
  retry,
  waitForCondition,
  seedTestDatabase
} from './test-helpers';

/**
 * Journey type enum for test usage
 */
enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
  USER = 'user',
  GAMIFICATION = 'gamification'
}

/**
 * End-to-end tests for Plan Journey events
 * 
 * These tests validate the complete flow of plan-related events from production to consumption,
 * ensuring proper event schema validation and processing through the event pipeline.
 */
describe('Plan Journey Events (e2e)', () => {
  let app: INestApplication;
  let testEnv: TestEnvironment;
  let prisma: PrismaClient;
  let kafkaService: KafkaService;
  let schemaRegistry: EventSchemaRegistry;
  let userId: string;
  let claimId: string;
  
  // Setup test environment before all tests
  beforeAll(async () => {
    // Create test environment with plan-specific topics
    testEnv = new TestEnvironment({
      topics: [
        TOPICS.PLAN.EVENTS,
        TOPICS.PLAN.CLAIMS,
        TOPICS.PLAN.BENEFITS,
        TOPICS.PLAN.SELECTION,
        TOPICS.GAMIFICATION.EVENTS,
      ],
    });
    
    await testEnv.setup();
    
    // Get NestJS app and services
    app = testEnv.getApp();
    prisma = testEnv.getPrisma();
    
    // Get Kafka service from the app
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [KafkaService, ConfigService, EventSchemaRegistry],
    }).compile();
    
    kafkaService = moduleRef.get<KafkaService>(KafkaService);
    schemaRegistry = moduleRef.get<EventSchemaRegistry>(EventSchemaRegistry);
    
    // Seed test database
    await seedTestDatabase(prisma);
    
    // Create test user
    const user = await createTestUser(prisma);
    userId = user.id;
    
    // Create test claim
    const claim = await createTestClaim(prisma, userId);
    claimId = claim.id;
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await testEnv.teardown();
  });
  
  // Clear consumed messages before each test
  beforeEach(() => {
    testEnv.clearConsumedMessages();
  });
  
  /**
   * Test for PLAN_CLAIM_SUBMITTED event
   */
  describe('Claim Submission Events', () => {
    it('should process PLAN_CLAIM_SUBMITTED event', async () => {
      // Create claim submission event data
      const claimData = {
        claimId,
        claimType: 'medical',
        providerId: uuidv4(),
        serviceDate: new Date().toISOString(),
        amount: 150.75,
        submittedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_CLAIM_SUBMITTED,
        JourneyType.PLAN,
        userId,
        claimData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.CLAIMS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_CLAIM_SUBMITTED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_CLAIM_SUBMITTED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(claimData);
      
      // Verify gamification points event is triggered
      const pointsEvent = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data.sourceType).toBe('plan');
      expect(pointsEvent?.data.sourceId).toBe(claimId);
    });
    
    it('should reject invalid PLAN_CLAIM_SUBMITTED event', async () => {
      // Create invalid claim submission event (missing required fields)
      const invalidClaimData = {
        // Missing claimId and other required fields
        amount: 150.75,
        submittedAt: new Date().toISOString()
      };
      
      // Create and publish invalid test event
      const event = createTestEvent(
        EventType.PLAN_CLAIM_SUBMITTED,
        JourneyType.PLAN,
        userId,
        invalidClaimData
      );
      
      // Expect error when publishing invalid event
      await expect(kafkaService.produce(
        TOPICS.PLAN.CLAIMS,
        event,
        userId
      )).rejects.toThrow();
    });
    
    it('should process PLAN_CLAIM_PROCESSED event', async () => {
      // Create claim processed event data
      const claimProcessedData = {
        claimId,
        status: 'approved',
        amount: 150.75,
        coveredAmount: 120.60,
        processedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_CLAIM_PROCESSED,
        JourneyType.PLAN,
        userId,
        claimProcessedData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.CLAIMS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_CLAIM_PROCESSED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_CLAIM_PROCESSED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(claimProcessedData);
      
      // Verify claim status is updated in database
      await retry(async () => {
        const updatedClaim = await prisma.insuranceClaim.findUnique({
          where: { id: claimId },
        });
        
        expect(updatedClaim?.status).toBe('APPROVED');
        return true;
      });
    });
  });
  
  /**
   * Test for PLAN_BENEFIT_UTILIZED event
   */
  describe('Benefit Utilization Events', () => {
    it('should process PLAN_BENEFIT_UTILIZED event', async () => {
      // Create benefit ID for test
      const benefitId = uuidv4();
      
      // Create benefit utilization event data
      const benefitData = {
        benefitId,
        benefitType: 'wellness',
        providerId: uuidv4(),
        utilizationDate: new Date().toISOString(),
        savingsAmount: 50.00
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_BENEFIT_UTILIZED,
        JourneyType.PLAN,
        userId,
        benefitData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.BENEFITS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_BENEFIT_UTILIZED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_BENEFIT_UTILIZED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(benefitData);
      
      // Verify gamification points event is triggered
      const pointsEvent = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data.sourceType).toBe('plan');
      expect(pointsEvent?.data.sourceId).toBe(benefitId);
    });
    
    it('should handle benefit utilization with missing optional fields', async () => {
      // Create benefit ID for test
      const benefitId = uuidv4();
      
      // Create benefit utilization event data with missing optional fields
      const benefitData = {
        benefitId,
        benefitType: 'preventive',
        utilizationDate: new Date().toISOString(),
        // Missing providerId and savingsAmount (optional fields)
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_BENEFIT_UTILIZED,
        JourneyType.PLAN,
        userId,
        benefitData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.BENEFITS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_BENEFIT_UTILIZED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_BENEFIT_UTILIZED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(benefitData);
    });
  });
  
  /**
   * Test for PLAN_SELECTED event
   */
  describe('Plan Selection Events', () => {
    it('should process PLAN_SELECTED event', async () => {
      // Create plan ID for test
      const planId = uuidv4();
      
      // Create plan selection event data
      const planData = {
        planId,
        planType: 'health',
        coverageLevel: 'family',
        premium: 350.00,
        startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        selectedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_SELECTED,
        JourneyType.PLAN,
        userId,
        planData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.SELECTION);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_SELECTED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_SELECTED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(planData);
      
      // Verify gamification points event is triggered for plan selection
      const pointsEvent = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data.sourceType).toBe('plan');
      expect(pointsEvent?.data.reason).toContain('plan selection');
    });
    
    it('should reject PLAN_SELECTED event with invalid date format', async () => {
      // Create plan ID for test
      const planId = uuidv4();
      
      // Create plan selection event data with invalid date format
      const planData = {
        planId,
        planType: 'health',
        coverageLevel: 'individual',
        premium: 150.00,
        startDate: '2023-13-45', // Invalid date format
        selectedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_SELECTED,
        JourneyType.PLAN,
        userId,
        planData
      );
      
      // Expect error when publishing invalid event
      await expect(kafkaService.produce(
        TOPICS.PLAN.SELECTION,
        event,
        userId
      )).rejects.toThrow();
    });
  });
  
  /**
   * Test for PLAN_REWARD_REDEEMED event
   */
  describe('Reward Redemption Events', () => {
    it('should process PLAN_REWARD_REDEEMED event', async () => {
      // Create reward ID for test
      const rewardId = uuidv4();
      
      // Create reward redemption event data
      const rewardData = {
        rewardId,
        rewardType: 'gift_card',
        pointsRedeemed: 500,
        value: 25.00,
        redeemedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_REWARD_REDEEMED,
        JourneyType.PLAN,
        userId,
        rewardData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.EVENTS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_REWARD_REDEEMED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_REWARD_REDEEMED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(rewardData);
      
      // Verify points are deducted in gamification system
      // This would typically update a user's points balance in the database
      // For this test, we'll just verify the event was processed
      const pointsEvent = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data.points).toBeLessThan(0); // Points should be negative for redemption
      expect(Math.abs(pointsEvent?.data.points)).toBe(rewardData.pointsRedeemed);
    });
    
    it('should reject PLAN_REWARD_REDEEMED event with insufficient points', async () => {
      // Create reward ID for test
      const rewardId = uuidv4();
      
      // Create reward redemption event data with excessive points
      const rewardData = {
        rewardId,
        rewardType: 'premium_discount',
        pointsRedeemed: 1000000, // Unreasonably high point value
        value: 500.00,
        redeemedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_REWARD_REDEEMED,
        JourneyType.PLAN,
        userId,
        rewardData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.EVENTS);
      
      // Wait for event to be processed
      // In this case, we expect the event to be processed but rejected by business logic
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_REWARD_REDEEMED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_REWARD_REDEEMED, JourneyType.PLAN, userId);
      
      // We should not see a points deduction event since the redemption should be rejected
      const pointsDeductionReceived = await waitForCondition(async () => {
        const messages = testEnv.getConsumedMessages();
        return messages.some(msg => {
          try {
            const event = JSON.parse(msg.value.toString());
            return event.type === EventType.GAMIFICATION_POINTS_EARNED && 
                   event.userId === userId && 
                   event.data.points < 0;
          } catch (e) {
            return false;
          }
        });
      }, 5000);
      
      expect(pointsDeductionReceived).toBe(false);
    });
  });
  
  /**
   * Test for PLAN_DOCUMENT_COMPLETED event
   */
  describe('Document Completion Events', () => {
    it('should process PLAN_DOCUMENT_COMPLETED event', async () => {
      // Create document ID for test
      const documentId = uuidv4();
      
      // Create document completion event data
      const documentData = {
        documentId,
        documentType: 'enrollment',
        completedAt: new Date().toISOString()
      };
      
      // Create and publish test event
      const event = createTestEvent(
        EventType.PLAN_DOCUMENT_COMPLETED,
        JourneyType.PLAN,
        userId,
        documentData
      );
      
      await testEnv.publishEvent(event, TOPICS.PLAN.EVENTS);
      
      // Wait for event to be processed
      const receivedEvent = await testEnv.waitForEvent(EventType.PLAN_DOCUMENT_COMPLETED, userId);
      
      // Assert event properties
      assertEvent(receivedEvent, EventType.PLAN_DOCUMENT_COMPLETED, JourneyType.PLAN, userId);
      expect(receivedEvent?.data).toMatchObject(documentData);
      
      // Verify gamification points event is triggered
      const pointsEvent = await testEnv.waitForEvent(EventType.GAMIFICATION_POINTS_EARNED, userId);
      expect(pointsEvent).not.toBeNull();
      expect(pointsEvent?.data.sourceType).toBe('plan');
      expect(pointsEvent?.data.sourceId).toBe(documentId);
    });
  });
  
  /**
   * Test for cross-journey interactions with Plan events
   */
  describe('Cross-Journey Interactions', () => {
    it('should trigger achievement when multiple plan events occur', async () => {
      // Create multiple plan events to trigger an achievement
      
      // 1. Create claim submission event
      const claimData = {
        claimId: uuidv4(),
        claimType: 'medical',
        providerId: uuidv4(),
        serviceDate: new Date().toISOString(),
        amount: 200.50,
        submittedAt: new Date().toISOString()
      };
      
      const claimEvent = createTestEvent(
        EventType.PLAN_CLAIM_SUBMITTED,
        JourneyType.PLAN,
        userId,
        claimData
      );
      
      // 2. Create benefit utilization event
      const benefitData = {
        benefitId: uuidv4(),
        benefitType: 'wellness',
        utilizationDate: new Date().toISOString()
      };
      
      const benefitEvent = createTestEvent(
        EventType.PLAN_BENEFIT_UTILIZED,
        JourneyType.PLAN,
        userId,
        benefitData
      );
      
      // 3. Create document completion event
      const documentData = {
        documentId: uuidv4(),
        documentType: 'consent',
        completedAt: new Date().toISOString()
      };
      
      const documentEvent = createTestEvent(
        EventType.PLAN_DOCUMENT_COMPLETED,
        JourneyType.PLAN,
        userId,
        documentData
      );
      
      // Publish all events
      await testEnv.publishEvent(claimEvent, TOPICS.PLAN.CLAIMS);
      await testEnv.publishEvent(benefitEvent, TOPICS.PLAN.BENEFITS);
      await testEnv.publishEvent(documentEvent, TOPICS.PLAN.EVENTS);
      
      // Wait for achievement unlocked event
      // This tests that the gamification engine correctly processes multiple plan events
      // and triggers achievements based on cross-event criteria
      const achievementEvent = await retry(async () => {
        const event = await testEnv.waitForEvent(EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED, userId);
        if (!event) {
          throw new Error('Achievement event not received');
        }
        return event;
      }, 3, 2000);
      
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent?.data.achievementType).toBe('claim-master');
      expect(achievementEvent?.journey).toBe(JourneyType.GAMIFICATION);
    });
  });
  
  /**
   * Test for health check system with Plan events
   */
  describe('Health Check System', () => {
    it('should verify Plan event processing pipeline is healthy', async () => {
      // Create a simple health check event
      const healthCheckData = {
        checkId: uuidv4(),
        timestamp: new Date().toISOString(),
        service: 'plan-journey-events-test'
      };
      
      // Create and publish test event to each Plan topic
      const topics = [
        TOPICS.PLAN.EVENTS,
        TOPICS.PLAN.CLAIMS,
        TOPICS.PLAN.BENEFITS,
        TOPICS.PLAN.SELECTION
      ];
      
      // Track successful topics
      const successfulTopics = [];
      
      // Test each topic
      for (const topic of topics) {
        // Clear messages before each topic test
        testEnv.clearConsumedMessages();
        
        // Create a unique event for this topic
        const event = createTestEvent(
          EventType.USER_FEEDBACK_SUBMITTED, // Using a neutral event type for health check
          JourneyType.USER,
          'health-check-user',
          { ...healthCheckData, topic }
        );
        
        // Publish to the topic
        await testEnv.publishEvent(event, topic);
        
        // Wait for event to be consumed
        const received = await waitForCondition(async () => {
          const messages = testEnv.getConsumedMessages();
          return messages.some(msg => {
            try {
              const parsedEvent = JSON.parse(msg.value.toString());
              return parsedEvent.data?.checkId === healthCheckData.checkId &&
                     parsedEvent.data?.topic === topic;
            } catch (e) {
              return false;
            }
          });
        }, 5000);
        
        if (received) {
          successfulTopics.push(topic);
        }
      }
      
      // All topics should be healthy
      expect(successfulTopics.length).toBe(topics.length);
      expect(successfulTopics).toEqual(expect.arrayContaining(topics));
    });
  });
});