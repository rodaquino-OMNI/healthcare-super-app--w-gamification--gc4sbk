/**
 * @file Journey Events Interface Tests
 * @description Unit tests for journey-specific event interfaces (Health, Care, Plan)
 * to validate proper payload structures and type constraints.
 */

import {
  // Base interfaces
  IJourneyEvent,
  JourneyType,
  
  // Health journey interfaces
  IHealthEvent,
  HealthEventType,
  IHealthMetricRecordedPayload,
  IHealthGoalCreatedPayload,
  IHealthGoalAchievedPayload,
  IHealthDeviceConnectedPayload,
  IHealthInsightGeneratedPayload,
  
  // Care journey interfaces
  ICareEvent,
  CareEventType,
  ICareAppointmentBookedPayload,
  ICareMedicationTakenPayload,
  ICareMedicationAdherenceStreakPayload,
  ICareTelemedicineSessionCompletedPayload,
  ICarePlanCompletedPayload,
  
  // Plan journey interfaces
  IPlanEvent,
  PlanEventType,
  IPlanClaimSubmittedPayload,
  IPlanBenefitUtilizedPayload,
  IPlanPlanSelectedPayload,
  IPlanRewardRedeemedPayload,
  
  // Cross-journey utilities
  JourneyEvent,
  isHealthEvent,
  isCareEvent,
  isPlanEvent,
  correlateEvents
} from '../../../src/interfaces/journey-events.interface';

// Import test fixtures
import {
  healthEvents,
  careEvents,
  planEvents
} from '../../../test/fixtures';

describe('Journey Events Interface', () => {
  
  describe('Base Journey Event Interface', () => {
    it('should define the base journey event structure', () => {
      // Create a minimal valid journey event
      const baseEvent: IJourneyEvent = {
        type: 'TEST_EVENT',
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {}
      };
      
      // Verify required properties
      expect(baseEvent).toHaveProperty('type');
      expect(baseEvent).toHaveProperty('userId');
      expect(baseEvent).toHaveProperty('timestamp');
      expect(baseEvent).toHaveProperty('journey');
      expect(baseEvent).toHaveProperty('data');
    });
    
    it('should support optional properties', () => {
      // Create an event with all optional properties
      const fullEvent: IJourneyEvent = {
        id: 'event123',
        type: 'TEST_EVENT',
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'test-service',
        version: '1.0',
        data: { test: 'data' },
        correlationId: 'corr123',
        metadata: { test: 'metadata' }
      };
      
      // Verify optional properties
      expect(fullEvent).toHaveProperty('id');
      expect(fullEvent).toHaveProperty('source');
      expect(fullEvent).toHaveProperty('version');
      expect(fullEvent).toHaveProperty('correlationId');
      expect(fullEvent).toHaveProperty('metadata');
    });
  });
  
  describe('Health Journey Events', () => {
    it('should validate HEALTH_METRIC_RECORDED event structure', () => {
      // Create a health metric recorded event
      const metricEvent: IHealthEvent = {
        id: 'event123',
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'health-service',
        data: {
          metric: {
            id: 'metric123',
            userId: 'user123',
            type: 'HEART_RATE',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            source: 'manual'
          },
          metricType: 'HEART_RATE',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'manual',
          previousValue: 72,
          change: 3,
          isImprovement: false
        } as IHealthMetricRecordedPayload
      };
      
      // Verify event structure
      expect(metricEvent.journey).toBe(JourneyType.HEALTH);
      expect(metricEvent.type).toBe(HealthEventType.METRIC_RECORDED);
      expect(metricEvent.data).toHaveProperty('metric');
      expect(metricEvent.data).toHaveProperty('metricType');
      expect(metricEvent.data).toHaveProperty('value');
      expect(metricEvent.data).toHaveProperty('unit');
    });
    
    it('should validate HEALTH_GOAL_CREATED event structure', () => {
      // Create a health goal created event
      const goalEvent: IHealthEvent = {
        id: 'event123',
        type: HealthEventType.GOAL_CREATED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'health-service',
        data: {
          goal: {
            id: 'goal123',
            userId: 'user123',
            type: 'STEPS',
            targetValue: 10000,
            unit: 'steps',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE'
          },
          goalType: 'STEPS',
          targetValue: 10000,
          unit: 'steps',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } as IHealthGoalCreatedPayload
      };
      
      // Verify event structure
      expect(goalEvent.journey).toBe(JourneyType.HEALTH);
      expect(goalEvent.type).toBe(HealthEventType.GOAL_CREATED);
      expect(goalEvent.data).toHaveProperty('goal');
      expect(goalEvent.data).toHaveProperty('goalType');
      expect(goalEvent.data).toHaveProperty('targetValue');
      expect(goalEvent.data).toHaveProperty('unit');
      expect(goalEvent.data).toHaveProperty('startDate');
    });
    
    it('should validate HEALTH_GOAL_ACHIEVED event structure', () => {
      // Create a health goal achieved event
      const achievedEvent: IHealthEvent = {
        id: 'event123',
        type: HealthEventType.GOAL_ACHIEVED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'health-service',
        data: {
          goal: {
            id: 'goal123',
            userId: 'user123',
            type: 'STEPS',
            targetValue: 10000,
            unit: 'steps',
            startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACHIEVED'
          },
          goalType: 'STEPS',
          achievedValue: 10250,
          targetValue: 10000,
          daysToAchieve: 5,
          isEarlyCompletion: true
        } as IHealthGoalAchievedPayload
      };
      
      // Verify event structure
      expect(achievedEvent.journey).toBe(JourneyType.HEALTH);
      expect(achievedEvent.type).toBe(HealthEventType.GOAL_ACHIEVED);
      expect(achievedEvent.data).toHaveProperty('goal');
      expect(achievedEvent.data).toHaveProperty('goalType');
      expect(achievedEvent.data).toHaveProperty('achievedValue');
      expect(achievedEvent.data).toHaveProperty('targetValue');
      expect(achievedEvent.data).toHaveProperty('daysToAchieve');
    });
    
    it('should validate HEALTH_DEVICE_CONNECTED event structure', () => {
      // Create a device connected event
      const deviceEvent: IHealthEvent = {
        id: 'event123',
        type: HealthEventType.DEVICE_CONNECTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'health-service',
        data: {
          deviceConnection: {
            id: 'conn123',
            userId: 'user123',
            deviceId: 'device123',
            deviceType: 'Smartwatch',
            status: 'CONNECTED',
            lastSyncDate: new Date().toISOString(),
            connectionDate: new Date().toISOString()
          },
          deviceId: 'device123',
          deviceType: 'Smartwatch',
          connectionDate: new Date().toISOString(),
          isFirstConnection: true
        } as IHealthDeviceConnectedPayload
      };
      
      // Verify event structure
      expect(deviceEvent.journey).toBe(JourneyType.HEALTH);
      expect(deviceEvent.type).toBe(HealthEventType.DEVICE_CONNECTED);
      expect(deviceEvent.data).toHaveProperty('deviceConnection');
      expect(deviceEvent.data).toHaveProperty('deviceId');
      expect(deviceEvent.data).toHaveProperty('deviceType');
      expect(deviceEvent.data).toHaveProperty('connectionDate');
      expect(deviceEvent.data).toHaveProperty('isFirstConnection');
    });
    
    it('should validate HEALTH_INSIGHT_GENERATED event structure', () => {
      // Create an insight generated event
      const insightEvent: IHealthEvent = {
        id: 'event123',
        type: HealthEventType.INSIGHT_GENERATED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        source: 'health-service',
        data: {
          insightId: 'insight123',
          insightType: 'SLEEP_PATTERN',
          generationDate: new Date().toISOString(),
          relatedMetrics: ['SLEEP', 'HEART_RATE'],
          severity: 'medium',
          description: 'Your sleep pattern shows inconsistency',
          explanation: 'Irregular sleep patterns can affect overall health',
          recommendations: [
            'Try to maintain a consistent sleep schedule',
            'Avoid screen time before bed'
          ]
        } as IHealthInsightGeneratedPayload
      };
      
      // Verify event structure
      expect(insightEvent.journey).toBe(JourneyType.HEALTH);
      expect(insightEvent.type).toBe(HealthEventType.INSIGHT_GENERATED);
      expect(insightEvent.data).toHaveProperty('insightId');
      expect(insightEvent.data).toHaveProperty('insightType');
      expect(insightEvent.data).toHaveProperty('generationDate');
      expect(insightEvent.data).toHaveProperty('description');
      expect(insightEvent.data).toHaveProperty('recommendations');
    });
  });
  
  describe('Care Journey Events', () => {
    it('should validate CARE_APPOINTMENT_BOOKED event structure', () => {
      // Create an appointment booked event
      const appointmentEvent: ICareEvent = {
        id: 'event123',
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        source: 'care-service',
        data: {
          appointment: {
            id: 'appt123',
            userId: 'user123',
            providerId: 'provider123',
            type: 'IN_PERSON',
            status: 'SCHEDULED',
            scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString()
          },
          appointmentType: 'IN_PERSON',
          providerId: 'provider123',
          scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          isFirstAppointment: true,
          isUrgent: false
        } as ICareAppointmentBookedPayload
      };
      
      // Verify event structure
      expect(appointmentEvent.journey).toBe(JourneyType.CARE);
      expect(appointmentEvent.type).toBe(CareEventType.APPOINTMENT_BOOKED);
      expect(appointmentEvent.data).toHaveProperty('appointment');
      expect(appointmentEvent.data).toHaveProperty('appointmentType');
      expect(appointmentEvent.data).toHaveProperty('providerId');
      expect(appointmentEvent.data).toHaveProperty('scheduledDate');
    });
    
    it('should validate CARE_MEDICATION_TAKEN event structure', () => {
      // Create a medication taken event
      const medicationEvent: ICareEvent = {
        id: 'event123',
        type: CareEventType.MEDICATION_TAKEN,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        source: 'care-service',
        data: {
          medicationId: 'med123',
          medicationName: 'Medication A',
          takenDate: new Date().toISOString(),
          takenOnTime: true,
          dosage: '10mg'
        } as ICareMedicationTakenPayload
      };
      
      // Verify event structure
      expect(medicationEvent.journey).toBe(JourneyType.CARE);
      expect(medicationEvent.type).toBe(CareEventType.MEDICATION_TAKEN);
      expect(medicationEvent.data).toHaveProperty('medicationId');
      expect(medicationEvent.data).toHaveProperty('medicationName');
      expect(medicationEvent.data).toHaveProperty('takenDate');
      expect(medicationEvent.data).toHaveProperty('takenOnTime');
      expect(medicationEvent.data).toHaveProperty('dosage');
    });
    
    it('should validate CARE_MEDICATION_ADHERENCE_STREAK event structure', () => {
      // Create a medication adherence streak event
      const streakEvent: ICareEvent = {
        id: 'event123',
        type: CareEventType.MEDICATION_ADHERENCE_STREAK,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        source: 'care-service',
        data: {
          medicationId: 'med123',
          medicationName: 'Medication A',
          streakDays: 7,
          adherencePercentage: 95,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        } as ICareMedicationAdherenceStreakPayload
      };
      
      // Verify event structure
      expect(streakEvent.journey).toBe(JourneyType.CARE);
      expect(streakEvent.type).toBe(CareEventType.MEDICATION_ADHERENCE_STREAK);
      expect(streakEvent.data).toHaveProperty('medicationId');
      expect(streakEvent.data).toHaveProperty('medicationName');
      expect(streakEvent.data).toHaveProperty('streakDays');
      expect(streakEvent.data).toHaveProperty('adherencePercentage');
      expect(streakEvent.data).toHaveProperty('startDate');
      expect(streakEvent.data).toHaveProperty('endDate');
    });
    
    it('should validate CARE_TELEMEDICINE_SESSION_COMPLETED event structure', () => {
      // Create a telemedicine session completed event
      const telemedicineEvent: ICareEvent = {
        id: 'event123',
        type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        source: 'care-service',
        data: {
          session: {
            id: 'session123',
            userId: 'user123',
            providerId: 'provider123',
            appointmentId: 'appt123',
            startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            endTime: new Date().toISOString(),
            status: 'COMPLETED'
          },
          sessionId: 'session123',
          providerId: 'provider123',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          endTime: new Date().toISOString(),
          duration: 30,
          appointmentId: 'appt123',
          technicalIssues: false
        } as ICareTelemedicineSessionCompletedPayload
      };
      
      // Verify event structure
      expect(telemedicineEvent.journey).toBe(JourneyType.CARE);
      expect(telemedicineEvent.type).toBe(CareEventType.TELEMEDICINE_SESSION_COMPLETED);
      expect(telemedicineEvent.data).toHaveProperty('session');
      expect(telemedicineEvent.data).toHaveProperty('sessionId');
      expect(telemedicineEvent.data).toHaveProperty('providerId');
      expect(telemedicineEvent.data).toHaveProperty('startTime');
      expect(telemedicineEvent.data).toHaveProperty('endTime');
      expect(telemedicineEvent.data).toHaveProperty('duration');
    });
    
    it('should validate CARE_PLAN_COMPLETED event structure', () => {
      // Create a care plan completed event
      const planEvent: ICareEvent = {
        id: 'event123',
        type: CareEventType.CARE_PLAN_COMPLETED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        source: 'care-service',
        data: {
          treatmentPlan: {
            id: 'plan123',
            userId: 'user123',
            name: 'Recovery Plan',
            description: 'Post-surgery recovery plan',
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString(),
            status: 'COMPLETED'
          },
          planId: 'plan123',
          planType: 'RECOVERY',
          completionDate: new Date().toISOString(),
          fullyCompleted: true,
          completionPercentage: 100,
          daysActive: 30
        } as ICarePlanCompletedPayload
      };
      
      // Verify event structure
      expect(planEvent.journey).toBe(JourneyType.CARE);
      expect(planEvent.type).toBe(CareEventType.CARE_PLAN_COMPLETED);
      expect(planEvent.data).toHaveProperty('treatmentPlan');
      expect(planEvent.data).toHaveProperty('planId');
      expect(planEvent.data).toHaveProperty('planType');
      expect(planEvent.data).toHaveProperty('completionDate');
      expect(planEvent.data).toHaveProperty('fullyCompleted');
      expect(planEvent.data).toHaveProperty('completionPercentage');
      expect(planEvent.data).toHaveProperty('daysActive');
    });
  });
  
  describe('Plan Journey Events', () => {
    it('should validate PLAN_CLAIM_SUBMITTED event structure', () => {
      // Create a claim submitted event
      const claimEvent: IPlanEvent = {
        id: 'event123',
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        source: 'plan-service',
        data: {
          claim: {
            id: 'claim123',
            userId: 'user123',
            planId: 'plan123',
            amount: 150.00,
            status: 'SUBMITTED',
            submissionDate: new Date().toISOString(),
            claimType: 'MEDICAL_CONSULTATION'
          },
          submissionDate: new Date().toISOString(),
          amount: 150.00,
          claimType: 'MEDICAL_CONSULTATION',
          hasDocuments: true,
          isComplete: true
        } as IPlanClaimSubmittedPayload
      };
      
      // Verify event structure
      expect(claimEvent.journey).toBe(JourneyType.PLAN);
      expect(claimEvent.type).toBe(PlanEventType.CLAIM_SUBMITTED);
      expect(claimEvent.data).toHaveProperty('claim');
      expect(claimEvent.data).toHaveProperty('submissionDate');
      expect(claimEvent.data).toHaveProperty('amount');
      expect(claimEvent.data).toHaveProperty('claimType');
      expect(claimEvent.data).toHaveProperty('hasDocuments');
      expect(claimEvent.data).toHaveProperty('isComplete');
    });
    
    it('should validate PLAN_BENEFIT_UTILIZED event structure', () => {
      // Create a benefit utilized event
      const benefitEvent: IPlanEvent = {
        id: 'event123',
        type: PlanEventType.BENEFIT_UTILIZED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        source: 'plan-service',
        data: {
          benefit: {
            id: 'benefit123',
            planId: 'plan123',
            name: 'Annual Check-up',
            description: 'Yearly preventive health check-up',
            coverageLimit: 1,
            coveragePeriod: 'YEARLY'
          },
          utilizationDate: new Date().toISOString(),
          serviceProvider: 'Provider A',
          amount: 200.00,
          remainingCoverage: 0,
          isFirstUtilization: true
        } as IPlanBenefitUtilizedPayload
      };
      
      // Verify event structure
      expect(benefitEvent.journey).toBe(JourneyType.PLAN);
      expect(benefitEvent.type).toBe(PlanEventType.BENEFIT_UTILIZED);
      expect(benefitEvent.data).toHaveProperty('benefit');
      expect(benefitEvent.data).toHaveProperty('utilizationDate');
      expect(benefitEvent.data).toHaveProperty('serviceProvider');
      expect(benefitEvent.data).toHaveProperty('amount');
      expect(benefitEvent.data).toHaveProperty('remainingCoverage');
      expect(benefitEvent.data).toHaveProperty('isFirstUtilization');
    });
    
    it('should validate PLAN_PLAN_SELECTED event structure', () => {
      // Create a plan selected event
      const planSelectedEvent: IPlanEvent = {
        id: 'event123',
        type: PlanEventType.PLAN_SELECTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        source: 'plan-service',
        data: {
          plan: {
            id: 'plan123',
            name: 'Premium Health Plan',
            description: 'Comprehensive health coverage',
            provider: 'Insurance Company A',
            premium: 350.00,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'ACTIVE'
          },
          planId: 'plan123',
          planName: 'Premium Health Plan',
          selectionDate: new Date().toISOString(),
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          premium: 350.00,
          isUpgrade: true
        } as IPlanPlanSelectedPayload
      };
      
      // Verify event structure
      expect(planSelectedEvent.journey).toBe(JourneyType.PLAN);
      expect(planSelectedEvent.type).toBe(PlanEventType.PLAN_SELECTED);
      expect(planSelectedEvent.data).toHaveProperty('plan');
      expect(planSelectedEvent.data).toHaveProperty('planId');
      expect(planSelectedEvent.data).toHaveProperty('planName');
      expect(planSelectedEvent.data).toHaveProperty('selectionDate');
      expect(planSelectedEvent.data).toHaveProperty('startDate');
      expect(planSelectedEvent.data).toHaveProperty('endDate');
      expect(planSelectedEvent.data).toHaveProperty('premium');
    });
    
    it('should validate PLAN_REWARD_REDEEMED event structure', () => {
      // Create a reward redeemed event
      const rewardEvent: IPlanEvent = {
        id: 'event123',
        type: PlanEventType.REWARD_REDEEMED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        source: 'plan-service',
        data: {
          rewardId: 'reward123',
          rewardName: 'Fitness Tracker Discount',
          redemptionDate: new Date().toISOString(),
          pointValue: 500,
          monetaryValue: 50.00,
          rewardType: 'DISCOUNT',
          isPremiumReward: false
        } as IPlanRewardRedeemedPayload
      };
      
      // Verify event structure
      expect(rewardEvent.journey).toBe(JourneyType.PLAN);
      expect(rewardEvent.type).toBe(PlanEventType.REWARD_REDEEMED);
      expect(rewardEvent.data).toHaveProperty('rewardId');
      expect(rewardEvent.data).toHaveProperty('rewardName');
      expect(rewardEvent.data).toHaveProperty('redemptionDate');
      expect(rewardEvent.data).toHaveProperty('pointValue');
      expect(rewardEvent.data).toHaveProperty('monetaryValue');
      expect(rewardEvent.data).toHaveProperty('rewardType');
      expect(rewardEvent.data).toHaveProperty('isPremiumReward');
    });
  });
  
  describe('Cross-Journey Capabilities', () => {
    it('should correctly identify event types using type guards', () => {
      // Create events from different journeys
      const healthEvent: IHealthEvent = {
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {} as IHealthMetricRecordedPayload
      };
      
      const careEvent: ICareEvent = {
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        data: {} as ICareAppointmentBookedPayload
      };
      
      const planEvent: IPlanEvent = {
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        data: {} as IPlanClaimSubmittedPayload
      };
      
      // Test type guards
      expect(isHealthEvent(healthEvent)).toBe(true);
      expect(isHealthEvent(careEvent)).toBe(false);
      expect(isHealthEvent(planEvent)).toBe(false);
      
      expect(isCareEvent(careEvent)).toBe(true);
      expect(isCareEvent(healthEvent)).toBe(false);
      expect(isCareEvent(planEvent)).toBe(false);
      
      expect(isPlanEvent(planEvent)).toBe(true);
      expect(isPlanEvent(healthEvent)).toBe(false);
      expect(isPlanEvent(careEvent)).toBe(false);
    });
    
    it('should support the JourneyEvent union type', () => {
      // Create events from different journeys
      const healthEvent: IHealthEvent = {
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {} as IHealthMetricRecordedPayload
      };
      
      const careEvent: ICareEvent = {
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        data: {} as ICareAppointmentBookedPayload
      };
      
      const planEvent: IPlanEvent = {
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        data: {} as IPlanClaimSubmittedPayload
      };
      
      // Create an array of journey events
      const events: JourneyEvent[] = [healthEvent, careEvent, planEvent];
      
      // Verify the array contains all events
      expect(events).toHaveLength(3);
      expect(events[0].journey).toBe(JourneyType.HEALTH);
      expect(events[1].journey).toBe(JourneyType.CARE);
      expect(events[2].journey).toBe(JourneyType.PLAN);
    });
    
    it('should correlate events across journeys', () => {
      // Create events from different journeys
      const healthEvent: IHealthEvent = {
        type: HealthEventType.METRIC_RECORDED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.HEALTH,
        data: {} as IHealthMetricRecordedPayload
      };
      
      const careEvent: ICareEvent = {
        type: CareEventType.APPOINTMENT_BOOKED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.CARE,
        data: {} as ICareAppointmentBookedPayload
      };
      
      const planEvent: IPlanEvent = {
        type: PlanEventType.CLAIM_SUBMITTED,
        userId: 'user123',
        timestamp: new Date().toISOString(),
        journey: JourneyType.PLAN,
        data: {} as IPlanClaimSubmittedPayload
      };
      
      // Create an array of journey events
      const events: JourneyEvent[] = [healthEvent, careEvent, planEvent];
      
      // Correlate events with a specific correlation ID
      const correlationId = 'test-correlation-123';
      const correlatedEvents = correlateEvents(events, correlationId);
      
      // Verify all events have the same correlation ID
      expect(correlatedEvents).toHaveLength(3);
      expect(correlatedEvents[0].correlationId).toBe(correlationId);
      expect(correlatedEvents[1].correlationId).toBe(correlationId);
      expect(correlatedEvents[2].correlationId).toBe(correlationId);
      
      // Correlate events without a specific correlation ID (auto-generated)
      const autoCorrelatedEvents = correlateEvents(events);
      
      // Verify all events have the same auto-generated correlation ID
      expect(autoCorrelatedEvents).toHaveLength(3);
      expect(autoCorrelatedEvents[0].correlationId).toBe(autoCorrelatedEvents[1].correlationId);
      expect(autoCorrelatedEvents[1].correlationId).toBe(autoCorrelatedEvents[2].correlationId);
      expect(autoCorrelatedEvents[0].correlationId).toMatch(/^corr_\d+_[a-z0-9]+$/);
    });
  });
});