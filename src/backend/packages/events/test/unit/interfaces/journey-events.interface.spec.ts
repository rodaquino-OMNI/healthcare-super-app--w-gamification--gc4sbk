import { expect } from 'chai';
import {
  BaseEvent,
  HealthJourneyEvent,
  CareJourneyEvent,
  PlanJourneyEvent,
  JourneyEventType,
  JourneyType,
  HealthMetricRecordedEvent,
  HealthGoalAchievedEvent,
  HealthInsightGeneratedEvent,
  HealthDeviceSyncedEvent,
  CareAppointmentBookedEvent,
  CareMedicationAdherenceEvent,
  CareTelemedicineSessionEvent,
  CarePlanProgressEvent,
  PlanClaimSubmittedEvent,
  PlanBenefitUtilizedEvent,
  PlanSelectionEvent,
  PlanRewardRedeemedEvent,
  CrossJourneyEvent
} from '../../../src/interfaces/journey-events.interface';
import { MetricType } from '@austa/interfaces/journey/health';
import { AppointmentType } from '@austa/interfaces/journey/care';
import { ClaimStatus } from '@austa/interfaces/journey/plan';

describe('Journey Events Interfaces', () => {
  describe('Base Event Structure', () => {
    it('should validate the base event structure', () => {
      const baseEvent: BaseEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'test-service',
        type: 'TEST_EVENT',
        payload: { test: 'data' },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(baseEvent).to.have.property('eventId').that.is.a('string');
      expect(baseEvent).to.have.property('timestamp').that.is.a('string');
      expect(baseEvent).to.have.property('version').that.is.a('string');
      expect(baseEvent).to.have.property('source').that.is.a('string');
      expect(baseEvent).to.have.property('type').that.is.a('string');
      expect(baseEvent).to.have.property('payload').that.is.an('object');
      expect(baseEvent).to.have.property('metadata').that.is.an('object');
    });
  });

  describe('Health Journey Events', () => {
    it('should validate health metric recorded event structure', () => {
      const healthMetricEvent: HealthMetricRecordedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174001',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: JourneyEventType.HEALTH_METRIC_RECORDED,
        journeyType: JourneyType.HEALTH,
        payload: {
          userId: 'user-123',
          metricId: 'metric-123',
          metricType: MetricType.HEART_RATE,
          value: 75,
          unit: 'bpm',
          recordedAt: new Date().toISOString(),
          source: 'manual-entry'
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(healthMetricEvent).to.have.property('journeyType').that.equals(JourneyType.HEALTH);
      expect(healthMetricEvent).to.have.property('type').that.equals(JourneyEventType.HEALTH_METRIC_RECORDED);
      expect(healthMetricEvent.payload).to.have.property('metricType').that.is.a('string');
      expect(healthMetricEvent.payload).to.have.property('value');
      expect(healthMetricEvent.payload).to.have.property('unit').that.is.a('string');
    });

    it('should validate health goal achieved event structure', () => {
      const goalAchievedEvent: HealthGoalAchievedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174002',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: JourneyEventType.HEALTH_GOAL_ACHIEVED,
        journeyType: JourneyType.HEALTH,
        payload: {
          userId: 'user-123',
          goalId: 'goal-123',
          goalType: 'STEPS',
          targetValue: 10000,
          achievedValue: 10500,
          achievedAt: new Date().toISOString()
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(goalAchievedEvent).to.have.property('journeyType').that.equals(JourneyType.HEALTH);
      expect(goalAchievedEvent).to.have.property('type').that.equals(JourneyEventType.HEALTH_GOAL_ACHIEVED);
      expect(goalAchievedEvent.payload).to.have.property('goalId').that.is.a('string');
      expect(goalAchievedEvent.payload).to.have.property('goalType').that.is.a('string');
      expect(goalAchievedEvent.payload).to.have.property('targetValue').that.is.a('number');
      expect(goalAchievedEvent.payload).to.have.property('achievedValue').that.is.a('number');
    });

    it('should validate health insight generated event structure', () => {
      const insightEvent: HealthInsightGeneratedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174003',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: JourneyEventType.HEALTH_INSIGHT_GENERATED,
        journeyType: JourneyType.HEALTH,
        payload: {
          userId: 'user-123',
          insightId: 'insight-123',
          insightType: 'TREND_ANALYSIS',
          metricType: MetricType.BLOOD_PRESSURE,
          description: 'Your blood pressure has been consistently improving over the last month.',
          severity: 'INFORMATIONAL',
          generatedAt: new Date().toISOString()
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(insightEvent).to.have.property('journeyType').that.equals(JourneyType.HEALTH);
      expect(insightEvent).to.have.property('type').that.equals(JourneyEventType.HEALTH_INSIGHT_GENERATED);
      expect(insightEvent.payload).to.have.property('insightId').that.is.a('string');
      expect(insightEvent.payload).to.have.property('insightType').that.is.a('string');
      expect(insightEvent.payload).to.have.property('description').that.is.a('string');
      expect(insightEvent.payload).to.have.property('severity').that.is.a('string');
    });

    it('should validate health device synced event structure', () => {
      const deviceSyncEvent: HealthDeviceSyncedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174004',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'health-service',
        type: JourneyEventType.HEALTH_DEVICE_SYNCED,
        journeyType: JourneyType.HEALTH,
        payload: {
          userId: 'user-123',
          deviceId: 'device-123',
          deviceType: 'SMARTWATCH',
          syncedAt: new Date().toISOString(),
          metricsCount: 42,
          syncDuration: 3.5, // seconds
          syncStatus: 'SUCCESS'
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(deviceSyncEvent).to.have.property('journeyType').that.equals(JourneyType.HEALTH);
      expect(deviceSyncEvent).to.have.property('type').that.equals(JourneyEventType.HEALTH_DEVICE_SYNCED);
      expect(deviceSyncEvent.payload).to.have.property('deviceId').that.is.a('string');
      expect(deviceSyncEvent.payload).to.have.property('deviceType').that.is.a('string');
      expect(deviceSyncEvent.payload).to.have.property('metricsCount').that.is.a('number');
      expect(deviceSyncEvent.payload).to.have.property('syncStatus').that.is.a('string');
    });
  });

  describe('Care Journey Events', () => {
    it('should validate care appointment booked event structure', () => {
      const appointmentEvent: CareAppointmentBookedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174005',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        type: JourneyEventType.CARE_APPOINTMENT_BOOKED,
        journeyType: JourneyType.CARE,
        payload: {
          userId: 'user-123',
          appointmentId: 'appointment-123',
          appointmentType: AppointmentType.IN_PERSON,
          providerId: 'provider-123',
          providerName: 'Dr. Jane Smith',
          specialty: 'Cardiologia',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          duration: 30, // minutes
          location: 'Clínica Central, Sala 302'
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(appointmentEvent).to.have.property('journeyType').that.equals(JourneyType.CARE);
      expect(appointmentEvent).to.have.property('type').that.equals(JourneyEventType.CARE_APPOINTMENT_BOOKED);
      expect(appointmentEvent.payload).to.have.property('appointmentId').that.is.a('string');
      expect(appointmentEvent.payload).to.have.property('appointmentType').that.is.a('string');
      expect(appointmentEvent.payload).to.have.property('providerId').that.is.a('string');
      expect(appointmentEvent.payload).to.have.property('scheduledAt').that.is.a('string');
    });

    it('should validate care medication adherence event structure', () => {
      const medicationEvent: CareMedicationAdherenceEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174006',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        type: JourneyEventType.CARE_MEDICATION_ADHERENCE,
        journeyType: JourneyType.CARE,
        payload: {
          userId: 'user-123',
          medicationId: 'medication-123',
          medicationName: 'Losartana 50mg',
          dosage: '1 comprimido',
          scheduledTime: new Date().toISOString(),
          takenTime: new Date().toISOString(),
          adherenceStatus: 'TAKEN_ON_TIME', // TAKEN_ON_TIME, TAKEN_LATE, MISSED
          streak: 7 // days in a row
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(medicationEvent).to.have.property('journeyType').that.equals(JourneyType.CARE);
      expect(medicationEvent).to.have.property('type').that.equals(JourneyEventType.CARE_MEDICATION_ADHERENCE);
      expect(medicationEvent.payload).to.have.property('medicationId').that.is.a('string');
      expect(medicationEvent.payload).to.have.property('medicationName').that.is.a('string');
      expect(medicationEvent.payload).to.have.property('adherenceStatus').that.is.a('string');
      expect(medicationEvent.payload).to.have.property('streak').that.is.a('number');
    });

    it('should validate care telemedicine session event structure', () => {
      const telemedicineEvent: CareTelemedicineSessionEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174007',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        type: JourneyEventType.CARE_TELEMEDICINE_SESSION,
        journeyType: JourneyType.CARE,
        payload: {
          userId: 'user-123',
          sessionId: 'session-123',
          appointmentId: 'appointment-123',
          providerId: 'provider-123',
          providerName: 'Dr. Carlos Mendes',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 1800000).toISOString(), // 30 minutes later
          duration: 30, // minutes
          status: 'COMPLETED', // SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
          quality: 'GOOD' // POOR, FAIR, GOOD, EXCELLENT
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(telemedicineEvent).to.have.property('journeyType').that.equals(JourneyType.CARE);
      expect(telemedicineEvent).to.have.property('type').that.equals(JourneyEventType.CARE_TELEMEDICINE_SESSION);
      expect(telemedicineEvent.payload).to.have.property('sessionId').that.is.a('string');
      expect(telemedicineEvent.payload).to.have.property('appointmentId').that.is.a('string');
      expect(telemedicineEvent.payload).to.have.property('startTime').that.is.a('string');
      expect(telemedicineEvent.payload).to.have.property('status').that.is.a('string');
    });

    it('should validate care plan progress event structure', () => {
      const carePlanEvent: CarePlanProgressEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174008',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'care-service',
        type: JourneyEventType.CARE_PLAN_PROGRESS,
        journeyType: JourneyType.CARE,
        payload: {
          userId: 'user-123',
          planId: 'plan-123',
          planName: 'Recuperação Cardíaca',
          activityId: 'activity-456',
          activityName: 'Caminhada leve',
          completedAt: new Date().toISOString(),
          progress: 75, // percentage
          status: 'IN_PROGRESS' // NOT_STARTED, IN_PROGRESS, COMPLETED, CANCELLED
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(carePlanEvent).to.have.property('journeyType').that.equals(JourneyType.CARE);
      expect(carePlanEvent).to.have.property('type').that.equals(JourneyEventType.CARE_PLAN_PROGRESS);
      expect(carePlanEvent.payload).to.have.property('planId').that.is.a('string');
      expect(carePlanEvent.payload).to.have.property('activityId').that.is.a('string');
      expect(carePlanEvent.payload).to.have.property('progress').that.is.a('number');
      expect(carePlanEvent.payload).to.have.property('status').that.is.a('string');
    });
  });

  describe('Plan Journey Events', () => {
    it('should validate plan claim submitted event structure', () => {
      const claimEvent: PlanClaimSubmittedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174009',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        type: JourneyEventType.PLAN_CLAIM_SUBMITTED,
        journeyType: JourneyType.PLAN,
        payload: {
          userId: 'user-123',
          claimId: 'claim-123',
          planId: 'plan-123',
          claimType: 'Consulta Médica',
          providerName: 'Clínica São Lucas',
          serviceDate: new Date().toISOString(),
          amount: 250.00,
          receiptUrl: 'https://storage.austa.com.br/receipts/receipt-123.pdf',
          status: ClaimStatus.SUBMITTED,
          submittedAt: new Date().toISOString()
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(claimEvent).to.have.property('journeyType').that.equals(JourneyType.PLAN);
      expect(claimEvent).to.have.property('type').that.equals(JourneyEventType.PLAN_CLAIM_SUBMITTED);
      expect(claimEvent.payload).to.have.property('claimId').that.is.a('string');
      expect(claimEvent.payload).to.have.property('planId').that.is.a('string');
      expect(claimEvent.payload).to.have.property('amount').that.is.a('number');
      expect(claimEvent.payload).to.have.property('status').that.is.a('string');
    });

    it('should validate plan benefit utilized event structure', () => {
      const benefitEvent: PlanBenefitUtilizedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174010',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        type: JourneyEventType.PLAN_BENEFIT_UTILIZED,
        journeyType: JourneyType.PLAN,
        payload: {
          userId: 'user-123',
          benefitId: 'benefit-123',
          benefitName: 'Desconto em Farmácia',
          planId: 'plan-123',
          utilizationId: 'utilization-123',
          providerName: 'Drogaria São Paulo',
          utilizationDate: new Date().toISOString(),
          savingsAmount: 45.60,
          utilizationType: 'IN_STORE' // IN_STORE, ONLINE, PHONE
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(benefitEvent).to.have.property('journeyType').that.equals(JourneyType.PLAN);
      expect(benefitEvent).to.have.property('type').that.equals(JourneyEventType.PLAN_BENEFIT_UTILIZED);
      expect(benefitEvent.payload).to.have.property('benefitId').that.is.a('string');
      expect(benefitEvent.payload).to.have.property('benefitName').that.is.a('string');
      expect(benefitEvent.payload).to.have.property('savingsAmount').that.is.a('number');
      expect(benefitEvent.payload).to.have.property('utilizationType').that.is.a('string');
    });

    it('should validate plan selection event structure', () => {
      const planSelectionEvent: PlanSelectionEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174011',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        type: JourneyEventType.PLAN_SELECTION,
        journeyType: JourneyType.PLAN,
        payload: {
          userId: 'user-123',
          planId: 'plan-123',
          planName: 'Plano Premium',
          planType: 'Premium',
          monthlyPrice: 450.00,
          coverageStartDate: new Date().toISOString(),
          selectionType: 'NEW', // NEW, UPGRADE, DOWNGRADE, RENEWAL
          previousPlanId: 'plan-122', // only for UPGRADE, DOWNGRADE, RENEWAL
          comparisonIds: ['plan-121', 'plan-122', 'plan-123'] // plans that were compared
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(planSelectionEvent).to.have.property('journeyType').that.equals(JourneyType.PLAN);
      expect(planSelectionEvent).to.have.property('type').that.equals(JourneyEventType.PLAN_SELECTION);
      expect(planSelectionEvent.payload).to.have.property('planId').that.is.a('string');
      expect(planSelectionEvent.payload).to.have.property('planName').that.is.a('string');
      expect(planSelectionEvent.payload).to.have.property('monthlyPrice').that.is.a('number');
      expect(planSelectionEvent.payload).to.have.property('selectionType').that.is.a('string');
    });

    it('should validate plan reward redeemed event structure', () => {
      const rewardEvent: PlanRewardRedeemedEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174012',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'plan-service',
        type: JourneyEventType.PLAN_REWARD_REDEEMED,
        journeyType: JourneyType.PLAN,
        payload: {
          userId: 'user-123',
          rewardId: 'reward-123',
          rewardName: 'Desconto na mensalidade',
          rewardType: 'DISCOUNT',
          pointsUsed: 5000,
          redemptionId: 'redemption-123',
          redemptionDate: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(), // 30 days later
          status: 'REDEEMED' // PENDING, REDEEMED, EXPIRED, CANCELLED
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(rewardEvent).to.have.property('journeyType').that.equals(JourneyType.PLAN);
      expect(rewardEvent).to.have.property('type').that.equals(JourneyEventType.PLAN_REWARD_REDEEMED);
      expect(rewardEvent.payload).to.have.property('rewardId').that.is.a('string');
      expect(rewardEvent.payload).to.have.property('rewardName').that.is.a('string');
      expect(rewardEvent.payload).to.have.property('pointsUsed').that.is.a('number');
      expect(rewardEvent.payload).to.have.property('status').that.is.a('string');
    });
  });

  describe('Cross-Journey Events', () => {
    it('should validate cross-journey event correlation', () => {
      const crossJourneyEvent: CrossJourneyEvent = {
        eventId: '123e4567-e89b-12d3-a456-426614174013',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        source: 'gamification-engine',
        type: JourneyEventType.CROSS_JOURNEY_ACHIEVEMENT,
        journeyType: JourneyType.CROSS_JOURNEY,
        payload: {
          userId: 'user-123',
          achievementId: 'achievement-123',
          achievementName: 'Cuidado Completo',
          description: 'Completou ações em todas as jornadas em um único dia',
          relatedEvents: [
            {
              eventId: '123e4567-e89b-12d3-a456-426614174001', // health metric event
              journeyType: JourneyType.HEALTH,
              type: JourneyEventType.HEALTH_METRIC_RECORDED
            },
            {
              eventId: '123e4567-e89b-12d3-a456-426614174006', // medication adherence event
              journeyType: JourneyType.CARE,
              type: JourneyEventType.CARE_MEDICATION_ADHERENCE
            },
            {
              eventId: '123e4567-e89b-12d3-a456-426614174010', // benefit utilized event
              journeyType: JourneyType.PLAN,
              type: JourneyEventType.PLAN_BENEFIT_UTILIZED
            }
          ],
          pointsAwarded: 500,
          achievedAt: new Date().toISOString(),
          level: 1
        },
        metadata: {
          correlationId: 'corr-123',
          userId: 'user-123'
        }
      };

      expect(crossJourneyEvent).to.have.property('journeyType').that.equals(JourneyType.CROSS_JOURNEY);
      expect(crossJourneyEvent).to.have.property('type').that.equals(JourneyEventType.CROSS_JOURNEY_ACHIEVEMENT);
      expect(crossJourneyEvent.payload).to.have.property('achievementId').that.is.a('string');
      expect(crossJourneyEvent.payload).to.have.property('relatedEvents').that.is.an('array');
      expect(crossJourneyEvent.payload.relatedEvents).to.have.lengthOf(3);
      
      // Verify that related events come from different journeys
      const journeyTypes = crossJourneyEvent.payload.relatedEvents.map(event => event.journeyType);
      expect(journeyTypes).to.include(JourneyType.HEALTH);
      expect(journeyTypes).to.include(JourneyType.CARE);
      expect(journeyTypes).to.include(JourneyType.PLAN);
    });

    it('should validate that cross-journey events can correlate events from any journey', () => {
      // Create a function to generate a related event reference
      const createRelatedEvent = (journeyType: JourneyType, eventType: JourneyEventType) => ({
        eventId: `event-${Math.random().toString(36).substring(2, 9)}`,
        journeyType,
        type: eventType
      });

      // Test with different combinations of journey events
      const testCombinations = [
        // Health + Care
        [createRelatedEvent(JourneyType.HEALTH, JourneyEventType.HEALTH_GOAL_ACHIEVED),
         createRelatedEvent(JourneyType.CARE, JourneyEventType.CARE_APPOINTMENT_BOOKED)],
        
        // Health + Plan
        [createRelatedEvent(JourneyType.HEALTH, JourneyEventType.HEALTH_DEVICE_SYNCED),
         createRelatedEvent(JourneyType.PLAN, JourneyEventType.PLAN_CLAIM_SUBMITTED)],
        
        // Care + Plan
        [createRelatedEvent(JourneyType.CARE, JourneyEventType.CARE_TELEMEDICINE_SESSION),
         createRelatedEvent(JourneyType.PLAN, JourneyEventType.PLAN_SELECTION)],
        
        // All three journeys
        [createRelatedEvent(JourneyType.HEALTH, JourneyEventType.HEALTH_INSIGHT_GENERATED),
         createRelatedEvent(JourneyType.CARE, JourneyEventType.CARE_PLAN_PROGRESS),
         createRelatedEvent(JourneyType.PLAN, JourneyEventType.PLAN_REWARD_REDEEMED)]
      ];

      testCombinations.forEach((relatedEvents, index) => {
        const crossJourneyEvent: CrossJourneyEvent = {
          eventId: `123e4567-e89b-12d3-a456-42661417${4014 + index}`,
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          source: 'gamification-engine',
          type: JourneyEventType.CROSS_JOURNEY_ACHIEVEMENT,
          journeyType: JourneyType.CROSS_JOURNEY,
          payload: {
            userId: 'user-123',
            achievementId: `achievement-${index}`,
            achievementName: `Cross Journey Achievement ${index}`,
            description: `Achievement combining events from different journeys - test ${index}`,
            relatedEvents,
            pointsAwarded: 100 * (index + 1),
            achievedAt: new Date().toISOString(),
            level: index + 1
          },
          metadata: {
            correlationId: `corr-${index}`,
            userId: 'user-123'
          }
        };

        expect(crossJourneyEvent).to.have.property('journeyType').that.equals(JourneyType.CROSS_JOURNEY);
        expect(crossJourneyEvent.payload.relatedEvents).to.have.lengthOf(relatedEvents.length);
        
        // Verify that each related event has the required properties
        crossJourneyEvent.payload.relatedEvents.forEach(event => {
          expect(event).to.have.property('eventId').that.is.a('string');
          expect(event).to.have.property('journeyType').that.is.a('string');
          expect(event).to.have.property('type').that.is.a('string');
        });
      });
    });
  });
});