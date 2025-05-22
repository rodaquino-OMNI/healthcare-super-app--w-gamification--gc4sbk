/**
 * @file plan-journey-events.e2e-spec.ts
 * @description End-to-end tests for Plan Journey events, validating the complete flow
 * of plan-related events from production to consumption. This file tests event publishing,
 * validation, and processing for claim submission, benefit utilization, plan selection,
 * and reward redemption events.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { KafkaService } from '../../src/kafka/kafka.service';
import { KafkaProducer } from '../../src/kafka/kafka.producer';
import { KafkaConsumer } from '../../src/kafka/kafka.consumer';
import { EventsModule } from '../../src/events.module';
import { PrismaService } from '@austa/database';
import { BaseEvent } from '../../src/interfaces/base-event.interface';
import { KafkaEvent } from '../../src/interfaces/kafka-event.interface';
import { ClaimStatus, IClaimEvent } from '@austa/interfaces/journey/plan';
import {
  createTestEnvironment,
  createTestConsumer,
  publishTestEvent,
  waitForEvent,
  waitForEvents,
  createJourneyEventFactories,
  assertEventsEqual,
  TestEnvironment,
} from './test-helpers';

// Constants for test configuration
const PLAN_EVENTS_TOPIC = 'plan-events';
const GAMIFICATION_EVENTS_TOPIC = 'gamification-events';
const NOTIFICATION_EVENTS_TOPIC = 'notification-events';

// Test timeout (increased for e2e tests)
jest.setTimeout(30000);

describe('Plan Journey Events (E2E)', () => {
  let testEnv: TestEnvironment;
  let kafkaProducer: KafkaProducer;
  let planEventsConsumer: KafkaConsumer;
  let gamificationEventsConsumer: KafkaConsumer;
  let notificationEventsConsumer: KafkaConsumer;
  let eventFactories: ReturnType<typeof createJourneyEventFactories>;

  beforeAll(async () => {
    // Create test environment with Kafka and database
    testEnv = await createTestEnvironment({
      useRealKafka: true,
      seedDatabase: true,
    });

    kafkaProducer = testEnv.kafkaProducer;

    // Create consumers for different event topics
    planEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      PLAN_EVENTS_TOPIC,
      'plan-events-test-consumer'
    );

    gamificationEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      GAMIFICATION_EVENTS_TOPIC,
      'gamification-events-test-consumer'
    );

    notificationEventsConsumer = await createTestConsumer(
      testEnv.kafkaService,
      NOTIFICATION_EVENTS_TOPIC,
      'notification-events-test-consumer'
    );

    // Create event factories for test data generation
    eventFactories = createJourneyEventFactories();
  });

  afterAll(async () => {
    // Disconnect consumers
    await planEventsConsumer.disconnect();
    await gamificationEventsConsumer.disconnect();
    await notificationEventsConsumer.disconnect();

    // Clean up test environment
    await testEnv.cleanup();
  });

  describe('Claim Submission Events', () => {
    it('should publish and consume claim submission events', async () => {
      // Create a claim submission event
      const claimEvent = eventFactories.plan.claimSubmitted({
        payload: {
          userId: randomUUID(),
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, claimEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        planEventsConsumer,
        (event) => event.type === 'plan.claim.submitted',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, claimEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by claim submission
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === claimEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.achievementType).toBe('claim-master');
      expect(gamificationEvent.payload.userId).toBe(claimEvent.payload.userId);
    });

    it('should validate claim submission event schema', async () => {
      // Create an invalid claim submission event (missing required fields)
      const invalidClaimEvent = eventFactories.plan.claimSubmitted({
        payload: {
          // Missing userId
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        } as any,
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, invalidClaimEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidClaimEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'userId',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should process claim status updates', async () => {
      // Create a claim ID to track through the process
      const claimId = randomUUID();
      const userId = randomUUID();

      // Create a claim submission event
      const submissionEvent = eventFactories.plan.claimSubmitted({
        payload: {
          userId,
          claimId,
          claimTypeId: randomUUID(),
          amount: 200.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        },
      });

      // Publish the submission event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, submissionEvent);

      // Create a claim approval event for the same claim
      const approvalEvent = eventFactories.plan.claimSubmitted({
        type: 'plan.claim.approved',
        payload: {
          userId,
          claimId,
          claimTypeId: submissionEvent.payload.claimTypeId,
          amount: submissionEvent.payload.amount,
          currency: submissionEvent.payload.currency,
          approvedAt: new Date().toISOString(),
          status: ClaimStatus.APPROVED,
        },
      });

      // Publish the approval event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, approvalEvent);

      // Wait for notification event triggered by claim approval
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'claim-approved' &&
          event.payload.userId === userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          claimId,
          amount: approvalEvent.payload.amount,
          currency: approvalEvent.payload.currency,
        })
      );
    });
  });

  describe('Benefit Utilization Events', () => {
    it('should publish and consume benefit utilization events', async () => {
      // Create a benefit utilization event
      const benefitEvent = eventFactories.plan.benefitUtilized({
        payload: {
          userId: randomUUID(),
          benefitId: randomUUID(),
          utilizedAt: new Date().toISOString(),
          value: 50.0,
          currency: 'BRL',
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, benefitEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        planEventsConsumer,
        (event) => event.type === 'plan.benefit.utilized',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, benefitEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by benefit utilization
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === benefitEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.userId).toBe(benefitEvent.payload.userId);
    });

    it('should validate benefit utilization event schema', async () => {
      // Create an invalid benefit utilization event (invalid value type)
      const invalidBenefitEvent = eventFactories.plan.benefitUtilized({
        payload: {
          userId: randomUUID(),
          benefitId: randomUUID(),
          utilizedAt: new Date().toISOString(),
          value: 'not-a-number' as any, // Invalid value type
          currency: 'BRL',
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, invalidBenefitEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidBenefitEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'payload.value',
          message: expect.stringContaining('number'),
        })
      );
    });
  });

  describe('Plan Selection Events', () => {
    it('should publish and consume plan selection events', async () => {
      // Create a plan selection event
      const planEvent = eventFactories.plan.planSelected({
        payload: {
          userId: randomUUID(),
          planId: randomUUID(),
          planTypeId: randomUUID(),
          selectedAt: new Date().toISOString(),
          startDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, planEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        planEventsConsumer,
        (event) => event.type === 'plan.plan.selected',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, planEvent, ['eventId', 'timestamp']);

      // Wait for notification event triggered by plan selection
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'plan-selected' &&
          event.payload.userId === planEvent.payload.userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          planId: planEvent.payload.planId,
          startDate: planEvent.payload.startDate,
        })
      );
    });

    it('should handle plan comparison events', async () => {
      // Create a plan comparison event
      const comparisonEvent = eventFactories.plan.planSelected({
        type: 'plan.plan.compared',
        payload: {
          userId: randomUUID(),
          planIds: [randomUUID(), randomUUID()],
          comparedAt: new Date().toISOString(),
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, comparisonEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        planEventsConsumer,
        (event) => event.type === 'plan.plan.compared',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, comparisonEvent, ['eventId', 'timestamp']);

      // Wait for gamification event triggered by plan comparison
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.progress.updated' && 
          event.payload.sourceEventId === comparisonEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.userId).toBe(comparisonEvent.payload.userId);
      expect(gamificationEvent.payload.achievementType).toBe('plan-explorer');
    });
  });

  describe('Reward Redemption Events', () => {
    it('should publish and consume reward redemption events', async () => {
      // Create a reward redemption event
      const redemptionEvent = eventFactories.plan.planSelected({
        type: 'plan.reward.redeemed',
        payload: {
          userId: randomUUID(),
          rewardId: randomUUID(),
          redeemedAt: new Date().toISOString(),
          value: 100.0,
          currency: 'BRL',
          description: 'Premium plan discount',
        },
      });

      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, redemptionEvent);

      // Wait for the event to be consumed
      const consumedEvent = await waitForEvent<BaseEvent>(
        planEventsConsumer,
        (event) => event.type === 'plan.reward.redeemed',
        5000
      );

      // Assert that the event was consumed correctly
      expect(consumedEvent).not.toBeNull();
      assertEventsEqual(consumedEvent, redemptionEvent, ['eventId', 'timestamp']);

      // Wait for notification event triggered by reward redemption
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'reward-redeemed' &&
          event.payload.userId === redemptionEvent.payload.userId,
        5000
      );

      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          rewardId: redemptionEvent.payload.rewardId,
          value: redemptionEvent.payload.value,
          currency: redemptionEvent.payload.currency,
          description: redemptionEvent.payload.description,
        })
      );

      // Wait for gamification event triggered by reward redemption
      const gamificationEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.reward.redeemed' && 
          event.payload.sourceEventId === redemptionEvent.eventId,
        5000
      );

      // Assert that the gamification event was triggered
      expect(gamificationEvent).not.toBeNull();
      expect(gamificationEvent.payload.userId).toBe(redemptionEvent.payload.userId);
      expect(gamificationEvent.payload.rewardId).toBe(redemptionEvent.payload.rewardId);
    });

    it('should validate reward redemption event schema', async () => {
      // Create an invalid reward redemption event (missing required fields)
      const invalidRedemptionEvent = eventFactories.plan.planSelected({
        type: 'plan.reward.redeemed',
        payload: {
          userId: randomUUID(),
          // Missing rewardId
          redeemedAt: new Date().toISOString(),
          value: 100.0,
          currency: 'BRL',
        } as any,
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, invalidRedemptionEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidRedemptionEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'payload.rewardId',
          message: expect.stringContaining('required'),
        })
      );
    });
  });

  describe('Cross-Journey Integration', () => {
    it('should trigger gamification achievements from plan events', async () => {
      const userId = randomUUID();
      
      // Create multiple claim submission events for the same user
      const claimEvents = [];
      
      for (let i = 0; i < 3; i++) {
        const claimEvent = eventFactories.plan.claimSubmitted({
          payload: {
            userId,
            claimId: randomUUID(),
            claimTypeId: randomUUID(),
            amount: 150.0 + i * 50,
            currency: 'BRL',
            submittedAt: new Date().toISOString(),
            status: ClaimStatus.SUBMITTED,
          },
        });
        
        claimEvents.push(claimEvent);
        
        // Publish the event
        await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, claimEvent);
      }
      
      // Wait for achievement unlocked event
      const achievementEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.achievement.unlocked' && 
          event.payload.userId === userId &&
          event.payload.achievementType === 'claim-master',
        10000
      );
      
      // Assert that the achievement was unlocked
      expect(achievementEvent).not.toBeNull();
      expect(achievementEvent.payload.level).toBe(1);
      expect(achievementEvent.payload.points).toBeGreaterThan(0);
      
      // Wait for notification about the achievement
      const notificationEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'notification.send' && 
          event.payload.templateId === 'achievement-unlocked' &&
          event.payload.userId === userId,
        5000
      );
      
      // Assert that the notification was triggered
      expect(notificationEvent).not.toBeNull();
      expect(notificationEvent.payload.data).toEqual(
        expect.objectContaining({
          achievementType: 'claim-master',
          level: 1,
          title: expect.any(String),
        })
      );
    });
    
    it('should update user profile based on plan journey events', async () => {
      const userId = randomUUID();
      
      // Create a plan selection event
      const planEvent = eventFactories.plan.planSelected({
        payload: {
          userId,
          planId: randomUUID(),
          planTypeId: randomUUID(),
          planName: 'Premium',
          selectedAt: new Date().toISOString(),
          startDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
        },
      });
      
      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, planEvent);
      
      // Create a claim submission event for the same user
      const claimEvent = eventFactories.plan.claimSubmitted({
        payload: {
          userId,
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 300.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        },
      });
      
      // Publish the event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, claimEvent);
      
      // Wait for profile updated event
      const profileEvent = await waitForEvent<BaseEvent>(
        gamificationEventsConsumer,
        (event) => 
          event.type === 'gamification.profile.updated' && 
          event.payload.userId === userId,
        10000
      );
      
      // Assert that the profile was updated
      expect(profileEvent).not.toBeNull();
      expect(profileEvent.payload.profile).toEqual(
        expect.objectContaining({
          planName: 'Premium',
          claimsSubmitted: 1,
          totalClaimAmount: 300.0,
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed events gracefully', async () => {
      // Create a malformed event (missing required type field)
      const malformedEvent = {
        eventId: randomUUID(),
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        // Missing type field
        journey: 'plan',
        payload: {
          userId: randomUUID(),
          planId: randomUUID(),
        },
      } as any;

      // Publish the malformed event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, malformedEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === malformedEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'type',
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should handle events with invalid journey type', async () => {
      // Create an event with invalid journey type
      const invalidJourneyEvent = eventFactories.plan.claimSubmitted({
        journey: 'invalid-journey' as any,
        payload: {
          userId: randomUUID(),
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        },
      });

      // Publish the invalid event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, invalidJourneyEvent);

      // Wait for error event in the notification topic
      const errorEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.validation.failed' && 
          event.payload.originalEventId === invalidJourneyEvent.eventId,
        5000
      );

      // Assert that validation error was detected
      expect(errorEvent).not.toBeNull();
      expect(errorEvent.payload.errors).toContainEqual(
        expect.objectContaining({
          field: 'journey',
          message: expect.stringContaining('valid'),
        })
      );
    });

    it('should handle duplicate events', async () => {
      // Create a claim submission event
      const claimEvent = eventFactories.plan.claimSubmitted({
        payload: {
          userId: randomUUID(),
          claimId: randomUUID(),
          claimTypeId: randomUUID(),
          amount: 150.0,
          currency: 'BRL',
          submittedAt: new Date().toISOString(),
          status: ClaimStatus.SUBMITTED,
        },
      });

      // Publish the event twice
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, claimEvent);
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, claimEvent);

      // Wait for duplicate event detection
      const duplicateEvent = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.event.duplicate' && 
          event.payload.originalEventId === claimEvent.eventId,
        5000
      );

      // Assert that duplicate was detected
      expect(duplicateEvent).not.toBeNull();
      expect(duplicateEvent.payload.eventType).toBe(claimEvent.type);
    });
  });

  describe('Health Checks', () => {
    it('should verify event processing pipeline health', async () => {
      // Create a health check event
      const healthCheckEvent = {
        eventId: randomUUID(),
        type: 'system.health.check',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test',
        journey: 'plan',
        payload: {
          component: 'plan-journey-events',
          checkId: randomUUID(),
          timestamp: new Date().toISOString(),
        },
      };

      // Publish the health check event
      await publishTestEvent(kafkaProducer, PLAN_EVENTS_TOPIC, healthCheckEvent);

      // Wait for health check response
      const healthResponse = await waitForEvent<BaseEvent>(
        notificationEventsConsumer,
        (event) => 
          event.type === 'system.health.response' && 
          event.payload.checkId === healthCheckEvent.payload.checkId,
        5000
      );

      // Assert that health check response was received
      expect(healthResponse).not.toBeNull();
      expect(healthResponse.payload.status).toBe('healthy');
      expect(healthResponse.payload.component).toBe('plan-journey-events');
      expect(healthResponse.payload.metrics).toEqual(
        expect.objectContaining({
          processingTime: expect.any(Number),
          queueSize: expect.any(Number),
        })
      );
    });
  });
});