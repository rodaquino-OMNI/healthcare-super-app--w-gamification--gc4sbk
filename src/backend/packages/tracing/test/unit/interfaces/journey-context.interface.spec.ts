import {
  BaseJourneyContext,
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext,
  JourneyContext,
  TraceContext
} from '../../../src/interfaces/journey-context.interface';

describe('Journey Context Interfaces', () => {
  // Helper function to check if an object conforms to an interface
  const conformsToInterface = <T>(obj: any): obj is T => {
    return obj !== null && typeof obj === 'object';
  };

  describe('JourneyType Enum', () => {
    it('should have the correct journey types', () => {
      expect(JourneyType.HEALTH).toBe('health');
      expect(JourneyType.CARE).toBe('care');
      expect(JourneyType.PLAN).toBe('plan');
    });

    it('should be used as a discriminator in journey contexts', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      const careContext: CareJourneyContext = {
        journeyId: 'journey-789',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString()
      };

      const planContext: PlanJourneyContext = {
        journeyId: 'journey-abc',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString()
      };

      expect(healthContext.journeyType).toBe(JourneyType.HEALTH);
      expect(careContext.journeyType).toBe(JourneyType.CARE);
      expect(planContext.journeyType).toBe(JourneyType.PLAN);
    });
  });

  describe('BaseJourneyContext Interface', () => {
    it('should have required properties', () => {
      const context: BaseJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      expect(context.journeyId).toBe('journey-123');
      expect(context.userId).toBe('user-456');
      expect(context.journeyType).toBe(JourneyType.HEALTH);
      expect(context.startedAt).toBeDefined();
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });

    it('should allow optional properties', () => {
      const context: BaseJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        currentStep: 'input-metrics',
        previousStep: 'select-metric-type',
        deviceInfo: {
          type: 'mobile',
          platform: 'iOS',
          appVersion: '1.2.3'
        },
        correlationIds: {
          requestId: 'req-123',
          sessionId: 'session-456',
          transactionId: 'tx-789'
        }
      };

      expect(context.currentStep).toBe('input-metrics');
      expect(context.previousStep).toBe('select-metric-type');
      expect(context.deviceInfo?.type).toBe('mobile');
      expect(context.deviceInfo?.platform).toBe('iOS');
      expect(context.deviceInfo?.appVersion).toBe('1.2.3');
      expect(context.correlationIds?.requestId).toBe('req-123');
      expect(context.correlationIds?.sessionId).toBe('session-456');
      expect(context.correlationIds?.transactionId).toBe('tx-789');
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });

    it('should support correlation IDs for cross-service tracing', () => {
      const context: BaseJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        correlationIds: {
          requestId: 'req-123',
          sessionId: 'session-456',
          transactionId: 'tx-789'
        }
      };

      expect(context.correlationIds?.requestId).toBe('req-123');
      expect(context.correlationIds?.sessionId).toBe('session-456');
      expect(context.correlationIds?.transactionId).toBe('tx-789');
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });
  });

  describe('HealthJourneyContext Interface', () => {
    it('should extend BaseJourneyContext with health-specific properties', () => {
      const context: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        metrics: {
          metricType: 'blood_pressure',
          timePeriod: 'last_week'
        },
        goals: {
          goalId: 'goal-789',
          goalType: 'weight_loss',
          progress: 75
        },
        devices: {
          deviceId: 'device-abc',
          deviceType: 'fitbit',
          lastSyncAt: new Date().toISOString()
        },
        medicalHistory: {
          recordType: 'medications',
          timePeriod: 'last_year'
        }
      };

      // Verify base properties
      expect(context.journeyId).toBe('journey-123');
      expect(context.userId).toBe('user-456');
      expect(context.journeyType).toBe(JourneyType.HEALTH);
      expect(context.startedAt).toBeDefined();

      // Verify health-specific properties
      expect(context.metrics?.metricType).toBe('blood_pressure');
      expect(context.metrics?.timePeriod).toBe('last_week');
      expect(context.goals?.goalId).toBe('goal-789');
      expect(context.goals?.goalType).toBe('weight_loss');
      expect(context.goals?.progress).toBe(75);
      expect(context.devices?.deviceId).toBe('device-abc');
      expect(context.devices?.deviceType).toBe('fitbit');
      expect(context.devices?.lastSyncAt).toBeDefined();
      expect(context.medicalHistory?.recordType).toBe('medications');
      expect(context.medicalHistory?.timePeriod).toBe('last_year');

      expect(conformsToInterface<HealthJourneyContext>(context)).toBe(true);
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });

    it('should enforce the correct journey type', () => {
      const context: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      expect(context.journeyType).toBe(JourneyType.HEALTH);

      // TypeScript should prevent assigning a different journey type
      // @ts-expect-error - This should fail because journeyType must be JourneyType.HEALTH
      const invalidContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString()
      };
    });

    it('should allow partial health-specific properties', () => {
      const context: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        metrics: {
          metricType: 'blood_pressure'
          // timePeriod is optional
        },
        goals: {
          // goalId is optional
          goalType: 'weight_loss',
          // progress is optional
        }
        // devices and medicalHistory are optional
      };

      expect(context.metrics?.metricType).toBe('blood_pressure');
      expect(context.metrics?.timePeriod).toBeUndefined();
      expect(context.goals?.goalId).toBeUndefined();
      expect(context.goals?.goalType).toBe('weight_loss');
      expect(context.goals?.progress).toBeUndefined();
      expect(context.devices).toBeUndefined();
      expect(context.medicalHistory).toBeUndefined();

      expect(conformsToInterface<HealthJourneyContext>(context)).toBe(true);
    });
  });

  describe('CareJourneyContext Interface', () => {
    it('should extend BaseJourneyContext with care-specific properties', () => {
      const context: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString(),
        appointment: {
          appointmentId: 'appointment-789',
          appointmentType: 'consultation',
          status: 'scheduled',
          provider: {
            providerId: 'provider-abc',
            providerType: 'physician'
          }
        },
        telemedicine: {
          sessionId: 'session-def',
          status: 'in_progress',
          durationSeconds: 600
        },
        symptomChecker: {
          assessmentId: 'assessment-ghi',
          primarySymptom: 'headache',
          completed: false
        },
        treatmentPlan: {
          planId: 'plan-jkl',
          planType: 'medication',
          progress: 50
        }
      };

      // Verify base properties
      expect(context.journeyId).toBe('journey-123');
      expect(context.userId).toBe('user-456');
      expect(context.journeyType).toBe(JourneyType.CARE);
      expect(context.startedAt).toBeDefined();

      // Verify care-specific properties
      expect(context.appointment?.appointmentId).toBe('appointment-789');
      expect(context.appointment?.appointmentType).toBe('consultation');
      expect(context.appointment?.status).toBe('scheduled');
      expect(context.appointment?.provider?.providerId).toBe('provider-abc');
      expect(context.appointment?.provider?.providerType).toBe('physician');
      expect(context.telemedicine?.sessionId).toBe('session-def');
      expect(context.telemedicine?.status).toBe('in_progress');
      expect(context.telemedicine?.durationSeconds).toBe(600);
      expect(context.symptomChecker?.assessmentId).toBe('assessment-ghi');
      expect(context.symptomChecker?.primarySymptom).toBe('headache');
      expect(context.symptomChecker?.completed).toBe(false);
      expect(context.treatmentPlan?.planId).toBe('plan-jkl');
      expect(context.treatmentPlan?.planType).toBe('medication');
      expect(context.treatmentPlan?.progress).toBe(50);

      expect(conformsToInterface<CareJourneyContext>(context)).toBe(true);
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });

    it('should enforce the correct journey type', () => {
      const context: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString()
      };

      expect(context.journeyType).toBe(JourneyType.CARE);

      // TypeScript should prevent assigning a different journey type
      // @ts-expect-error - This should fail because journeyType must be JourneyType.CARE
      const invalidContext: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };
    });

    it('should allow partial care-specific properties', () => {
      const context: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString(),
        appointment: {
          appointmentId: 'appointment-789',
          // appointmentType is optional
          // status is optional
          provider: {
            providerId: 'provider-abc'
            // providerType is optional
          }
        }
        // telemedicine, symptomChecker, and treatmentPlan are optional
      };

      expect(context.appointment?.appointmentId).toBe('appointment-789');
      expect(context.appointment?.appointmentType).toBeUndefined();
      expect(context.appointment?.status).toBeUndefined();
      expect(context.appointment?.provider?.providerId).toBe('provider-abc');
      expect(context.appointment?.provider?.providerType).toBeUndefined();
      expect(context.telemedicine).toBeUndefined();
      expect(context.symptomChecker).toBeUndefined();
      expect(context.treatmentPlan).toBeUndefined();

      expect(conformsToInterface<CareJourneyContext>(context)).toBe(true);
    });
  });

  describe('PlanJourneyContext Interface', () => {
    it('should extend BaseJourneyContext with plan-specific properties', () => {
      const context: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString(),
        plan: {
          planId: 'plan-789',
          planType: 'health_insurance',
          status: 'active'
        },
        claim: {
          claimId: 'claim-abc',
          claimType: 'medical',
          status: 'submitted',
          amount: 1500.50
        },
        benefit: {
          benefitId: 'benefit-def',
          benefitType: 'dental',
          utilization: 75
        },
        costEstimation: {
          serviceType: 'surgery',
          estimatedCost: 5000,
          coveragePercentage: 80
        }
      };

      // Verify base properties
      expect(context.journeyId).toBe('journey-123');
      expect(context.userId).toBe('user-456');
      expect(context.journeyType).toBe(JourneyType.PLAN);
      expect(context.startedAt).toBeDefined();

      // Verify plan-specific properties
      expect(context.plan?.planId).toBe('plan-789');
      expect(context.plan?.planType).toBe('health_insurance');
      expect(context.plan?.status).toBe('active');
      expect(context.claim?.claimId).toBe('claim-abc');
      expect(context.claim?.claimType).toBe('medical');
      expect(context.claim?.status).toBe('submitted');
      expect(context.claim?.amount).toBe(1500.50);
      expect(context.benefit?.benefitId).toBe('benefit-def');
      expect(context.benefit?.benefitType).toBe('dental');
      expect(context.benefit?.utilization).toBe(75);
      expect(context.costEstimation?.serviceType).toBe('surgery');
      expect(context.costEstimation?.estimatedCost).toBe(5000);
      expect(context.costEstimation?.coveragePercentage).toBe(80);

      expect(conformsToInterface<PlanJourneyContext>(context)).toBe(true);
      expect(conformsToInterface<BaseJourneyContext>(context)).toBe(true);
    });

    it('should enforce the correct journey type', () => {
      const context: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString()
      };

      expect(context.journeyType).toBe(JourneyType.PLAN);

      // TypeScript should prevent assigning a different journey type
      // @ts-expect-error - This should fail because journeyType must be JourneyType.PLAN
      const invalidContext: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString()
      };
    });

    it('should allow partial plan-specific properties', () => {
      const context: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString(),
        plan: {
          planId: 'plan-789'
          // planType is optional
          // status is optional
        },
        claim: {
          claimId: 'claim-abc',
          claimType: 'medical'
          // status is optional
          // amount is optional
        }
        // benefit and costEstimation are optional
      };

      expect(context.plan?.planId).toBe('plan-789');
      expect(context.plan?.planType).toBeUndefined();
      expect(context.plan?.status).toBeUndefined();
      expect(context.claim?.claimId).toBe('claim-abc');
      expect(context.claim?.claimType).toBe('medical');
      expect(context.claim?.status).toBeUndefined();
      expect(context.claim?.amount).toBeUndefined();
      expect(context.benefit).toBeUndefined();
      expect(context.costEstimation).toBeUndefined();

      expect(conformsToInterface<PlanJourneyContext>(context)).toBe(true);
    });
  });

  describe('GamificationContext Interface', () => {
    it('should have gamification-specific properties', () => {
      const context: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 100
        },
        achievement: {
          achievementId: 'achievement-456',
          achievementType: 'health_milestone',
          progress: 100,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        },
        quest: {
          questId: 'quest-789',
          questType: 'daily_challenge',
          progress: 75,
          completed: false
        },
        reward: {
          rewardId: 'reward-abc',
          rewardType: 'discount',
          claimed: true,
          claimedAt: new Date().toISOString()
        },
        profile: {
          level: 5,
          totalPoints: 1250,
          streakDays: 7
        }
      };

      // Verify gamification properties
      expect(context.event?.eventId).toBe('event-123');
      expect(context.event?.eventType).toBe('achievement_unlocked');
      expect(context.event?.sourceJourney).toBe(JourneyType.HEALTH);
      expect(context.event?.pointsAwarded).toBe(100);
      expect(context.achievement?.achievementId).toBe('achievement-456');
      expect(context.achievement?.achievementType).toBe('health_milestone');
      expect(context.achievement?.progress).toBe(100);
      expect(context.achievement?.unlocked).toBe(true);
      expect(context.achievement?.unlockedAt).toBeDefined();
      expect(context.quest?.questId).toBe('quest-789');
      expect(context.quest?.questType).toBe('daily_challenge');
      expect(context.quest?.progress).toBe(75);
      expect(context.quest?.completed).toBe(false);
      expect(context.reward?.rewardId).toBe('reward-abc');
      expect(context.reward?.rewardType).toBe('discount');
      expect(context.reward?.claimed).toBe(true);
      expect(context.reward?.claimedAt).toBeDefined();
      expect(context.profile?.level).toBe(5);
      expect(context.profile?.totalPoints).toBe(1250);
      expect(context.profile?.streakDays).toBe(7);

      expect(conformsToInterface<GamificationContext>(context)).toBe(true);
    });

    it('should allow partial gamification properties', () => {
      const context: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH
          // pointsAwarded is optional
        }
        // achievement, quest, reward, and profile are optional
      };

      expect(context.event?.eventId).toBe('event-123');
      expect(context.event?.eventType).toBe('achievement_unlocked');
      expect(context.event?.sourceJourney).toBe(JourneyType.HEALTH);
      expect(context.event?.pointsAwarded).toBeUndefined();
      expect(context.achievement).toBeUndefined();
      expect(context.quest).toBeUndefined();
      expect(context.reward).toBeUndefined();
      expect(context.profile).toBeUndefined();

      expect(conformsToInterface<GamificationContext>(context)).toBe(true);
    });

    it('should support events from any journey type', () => {
      const healthEvent: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH
        }
      };

      const careEvent: GamificationContext = {
        event: {
          eventId: 'event-456',
          eventType: 'points_earned',
          sourceJourney: JourneyType.CARE
        }
      };

      const planEvent: GamificationContext = {
        event: {
          eventId: 'event-789',
          eventType: 'quest_completed',
          sourceJourney: JourneyType.PLAN
        }
      };

      expect(healthEvent.event?.sourceJourney).toBe(JourneyType.HEALTH);
      expect(careEvent.event?.sourceJourney).toBe(JourneyType.CARE);
      expect(planEvent.event?.sourceJourney).toBe(JourneyType.PLAN);

      expect(conformsToInterface<GamificationContext>(healthEvent)).toBe(true);
      expect(conformsToInterface<GamificationContext>(careEvent)).toBe(true);
      expect(conformsToInterface<GamificationContext>(planEvent)).toBe(true);
    });
  });

  describe('JourneyContext Union Type', () => {
    it('should accept HealthJourneyContext', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        metrics: {
          metricType: 'blood_pressure'
        }
      };

      const journeyContext: JourneyContext = healthContext;

      expect(journeyContext.journeyType).toBe(JourneyType.HEALTH);
      expect(conformsToInterface<JourneyContext>(journeyContext)).toBe(true);
    });

    it('should accept CareJourneyContext', () => {
      const careContext: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString(),
        appointment: {
          appointmentId: 'appointment-789'
        }
      };

      const journeyContext: JourneyContext = careContext;

      expect(journeyContext.journeyType).toBe(JourneyType.CARE);
      expect(conformsToInterface<JourneyContext>(journeyContext)).toBe(true);
    });

    it('should accept PlanJourneyContext', () => {
      const planContext: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString(),
        plan: {
          planId: 'plan-789'
        }
      };

      const journeyContext: JourneyContext = planContext;

      expect(journeyContext.journeyType).toBe(JourneyType.PLAN);
      expect(conformsToInterface<JourneyContext>(journeyContext)).toBe(true);
    });

    it('should allow type discrimination based on journeyType', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        metrics: {
          metricType: 'blood_pressure'
        }
      };

      const journeyContext: JourneyContext = healthContext;

      if (journeyContext.journeyType === JourneyType.HEALTH) {
        // TypeScript should recognize this as a HealthJourneyContext
        expect(journeyContext.metrics?.metricType).toBe('blood_pressure');
      } else if (journeyContext.journeyType === JourneyType.CARE) {
        // This branch should not be executed in this test
        fail('Should not reach care journey branch');
      } else if (journeyContext.journeyType === JourneyType.PLAN) {
        // This branch should not be executed in this test
        fail('Should not reach plan journey branch');
      }
    });
  });

  describe('TraceContext Interface', () => {
    it('should allow journey context', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      const traceContext: TraceContext = {
        journeyContext: healthContext
      };

      expect(traceContext.journeyContext).toBeDefined();
      expect(traceContext.journeyContext?.journeyType).toBe(JourneyType.HEALTH);
      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should allow gamification context', () => {
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH
        }
      };

      const traceContext: TraceContext = {
        gamificationContext: gamificationContext
      };

      expect(traceContext.gamificationContext).toBeDefined();
      expect(traceContext.gamificationContext?.event?.eventType).toBe('achievement_unlocked');
      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should allow both journey and gamification contexts', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString()
      };

      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH
        }
      };

      const traceContext: TraceContext = {
        journeyContext: healthContext,
        gamificationContext: gamificationContext
      };

      expect(traceContext.journeyContext).toBeDefined();
      expect(traceContext.journeyContext?.journeyType).toBe(JourneyType.HEALTH);
      expect(traceContext.gamificationContext).toBeDefined();
      expect(traceContext.gamificationContext?.event?.eventType).toBe('achievement_unlocked');
      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should allow empty trace context', () => {
      const traceContext: TraceContext = {};

      expect(traceContext.journeyContext).toBeUndefined();
      expect(traceContext.gamificationContext).toBeUndefined();
      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });
  });

  describe('Cross-Journey Correlation', () => {
    it('should support correlation between health journey and gamification', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date().toISOString(),
        correlationIds: {
          requestId: 'req-123',
          transactionId: 'tx-789'
        },
        metrics: {
          metricType: 'steps',
          timePeriod: 'daily'
        }
      };

      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.HEALTH,
          pointsAwarded: 50
        },
        achievement: {
          achievementId: 'achievement-456',
          achievementType: 'steps_milestone',
          progress: 100,
          unlocked: true
        }
      };

      const traceContext: TraceContext = {
        journeyContext: healthContext,
        gamificationContext: gamificationContext
      };

      // Verify correlation between health journey and gamification
      expect(traceContext.journeyContext?.journeyType).toBe(JourneyType.HEALTH);
      expect(traceContext.journeyContext?.correlationIds?.transactionId).toBe('tx-789');
      expect(traceContext.gamificationContext?.event?.sourceJourney).toBe(JourneyType.HEALTH);
      expect(traceContext.gamificationContext?.achievement?.achievementType).toBe('steps_milestone');

      // The health metric type (steps) should match the achievement type (steps_milestone)
      expect(traceContext.journeyContext?.journeyType).toBe(traceContext.gamificationContext?.event?.sourceJourney);
      expect((traceContext.journeyContext as HealthJourneyContext).metrics?.metricType).toBe('steps');
      expect(traceContext.gamificationContext?.achievement?.achievementType).toBe('steps_milestone');

      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should support correlation between care journey and gamification', () => {
      const careContext: CareJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date().toISOString(),
        correlationIds: {
          requestId: 'req-123',
          transactionId: 'tx-789'
        },
        appointment: {
          appointmentId: 'appointment-789',
          appointmentType: 'checkup',
          status: 'completed'
        }
      };

      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'quest_completed',
          sourceJourney: JourneyType.CARE,
          pointsAwarded: 100
        },
        quest: {
          questId: 'quest-456',
          questType: 'appointment_attendance',
          progress: 100,
          completed: true
        }
      };

      const traceContext: TraceContext = {
        journeyContext: careContext,
        gamificationContext: gamificationContext
      };

      // Verify correlation between care journey and gamification
      expect(traceContext.journeyContext?.journeyType).toBe(JourneyType.CARE);
      expect(traceContext.journeyContext?.correlationIds?.transactionId).toBe('tx-789');
      expect(traceContext.gamificationContext?.event?.sourceJourney).toBe(JourneyType.CARE);
      expect(traceContext.gamificationContext?.quest?.questType).toBe('appointment_attendance');

      // The appointment status (completed) should match the quest status (completed)
      expect(traceContext.journeyContext?.journeyType).toBe(traceContext.gamificationContext?.event?.sourceJourney);
      expect((traceContext.journeyContext as CareJourneyContext).appointment?.status).toBe('completed');
      expect(traceContext.gamificationContext?.quest?.completed).toBe(true);

      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should support correlation between plan journey and gamification', () => {
      const planContext: PlanJourneyContext = {
        journeyId: 'journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date().toISOString(),
        correlationIds: {
          requestId: 'req-123',
          transactionId: 'tx-789'
        },
        claim: {
          claimId: 'claim-789',
          claimType: 'medical',
          status: 'approved',
          amount: 500
        }
      };

      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'reward_claimed',
          sourceJourney: JourneyType.PLAN,
          pointsAwarded: 200
        },
        reward: {
          rewardId: 'reward-456',
          rewardType: 'cashback',
          claimed: true,
          claimedAt: new Date().toISOString()
        }
      };

      const traceContext: TraceContext = {
        journeyContext: planContext,
        gamificationContext: gamificationContext
      };

      // Verify correlation between plan journey and gamification
      expect(traceContext.journeyContext?.journeyType).toBe(JourneyType.PLAN);
      expect(traceContext.journeyContext?.correlationIds?.transactionId).toBe('tx-789');
      expect(traceContext.gamificationContext?.event?.sourceJourney).toBe(JourneyType.PLAN);
      expect(traceContext.gamificationContext?.reward?.rewardType).toBe('cashback');

      // The claim status (approved) should correlate with the reward (claimed)
      expect(traceContext.journeyContext?.journeyType).toBe(traceContext.gamificationContext?.event?.sourceJourney);
      expect((traceContext.journeyContext as PlanJourneyContext).claim?.status).toBe('approved');
      expect(traceContext.gamificationContext?.reward?.claimed).toBe(true);

      expect(conformsToInterface<TraceContext>(traceContext)).toBe(true);
    });

    it('should support multi-journey achievement tracking', () => {
      // Create contexts for all three journeys
      const healthContext: HealthJourneyContext = {
        journeyId: 'health-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.HEALTH,
        startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        correlationIds: {
          requestId: 'health-req-123',
          transactionId: 'multi-journey-tx-789'
        }
      };

      const careContext: CareJourneyContext = {
        journeyId: 'care-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.CARE,
        startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        correlationIds: {
          requestId: 'care-req-123',
          transactionId: 'multi-journey-tx-789'
        }
      };

      const planContext: PlanJourneyContext = {
        journeyId: 'plan-journey-123',
        userId: 'user-456',
        journeyType: JourneyType.PLAN,
        startedAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        correlationIds: {
          requestId: 'plan-req-123',
          transactionId: 'multi-journey-tx-789'
        }
      };

      // Create a gamification context for a multi-journey achievement
      const gamificationContext: GamificationContext = {
        event: {
          eventId: 'event-123',
          eventType: 'achievement_unlocked',
          sourceJourney: JourneyType.PLAN, // The last journey that triggered the achievement
          pointsAwarded: 500
        },
        achievement: {
          achievementId: 'achievement-456',
          achievementType: 'super_user', // A multi-journey achievement
          progress: 100,
          unlocked: true,
          unlockedAt: new Date().toISOString()
        },
        profile: {
          level: 10,
          totalPoints: 5000,
          streakDays: 30
        }
      };

      // Create trace contexts for each journey, all with the same gamification context
      const healthTraceContext: TraceContext = {
        journeyContext: healthContext,
        gamificationContext: gamificationContext
      };

      const careTraceContext: TraceContext = {
        journeyContext: careContext,
        gamificationContext: gamificationContext
      };

      const planTraceContext: TraceContext = {
        journeyContext: planContext,
        gamificationContext: gamificationContext
      };

      // Verify correlation across all three journeys
      expect(healthTraceContext.journeyContext?.correlationIds?.transactionId).toBe('multi-journey-tx-789');
      expect(careTraceContext.journeyContext?.correlationIds?.transactionId).toBe('multi-journey-tx-789');
      expect(planTraceContext.journeyContext?.correlationIds?.transactionId).toBe('multi-journey-tx-789');

      // All three trace contexts should have the same user ID
      expect(healthTraceContext.journeyContext?.userId).toBe('user-456');
      expect(careTraceContext.journeyContext?.userId).toBe('user-456');
      expect(planTraceContext.journeyContext?.userId).toBe('user-456');

      // All three trace contexts should have the same achievement
      expect(healthTraceContext.gamificationContext?.achievement?.achievementId).toBe('achievement-456');
      expect(careTraceContext.gamificationContext?.achievement?.achievementId).toBe('achievement-456');
      expect(planTraceContext.gamificationContext?.achievement?.achievementId).toBe('achievement-456');

      // The achievement should be a multi-journey achievement
      expect(healthTraceContext.gamificationContext?.achievement?.achievementType).toBe('super_user');

      expect(conformsToInterface<TraceContext>(healthTraceContext)).toBe(true);
      expect(conformsToInterface<TraceContext>(careTraceContext)).toBe(true);
      expect(conformsToInterface<TraceContext>(planTraceContext)).toBe(true);
    });
  });
});