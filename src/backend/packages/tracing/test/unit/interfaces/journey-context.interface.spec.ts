/**
 * @file journey-context.interface.spec.ts
 * @description Unit tests for journey-specific tracing context interfaces
 */

import {
  JourneyContext,
  JourneyType,
  HealthJourneyContext,
  CareJourneyContext,
  PlanJourneyContext,
  GamificationContext,
  HealthJourneyWithGamification,
  CareJourneyWithGamification,
  PlanJourneyWithGamification,
  createJourneyContext
} from '../../../src/interfaces/journey-context.interface';

describe('Journey Context Interfaces', () => {
  describe('JourneyType Enum', () => {
    it('should define the correct journey types', () => {
      expect(JourneyType.HEALTH).toBe('health');
      expect(JourneyType.CARE).toBe('care');
      expect(JourneyType.PLAN).toBe('plan');
    });

    it('should have exactly three journey types', () => {
      const journeyTypeValues = Object.values(JourneyType);
      expect(journeyTypeValues).toHaveLength(3);
      expect(journeyTypeValues).toContain('health');
      expect(journeyTypeValues).toContain('care');
      expect(journeyTypeValues).toContain('plan');
    });
  });

  describe('Base JourneyContext Interface', () => {
    it('should define a valid journey context object', () => {
      const journeyContext: JourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.HEALTH,
        userId: 'user-456',
        sessionId: 'session-789',
        startedAt: new Date().toISOString(),
        currentStep: 'view-metrics',
        deviceInfo: 'iPhone 13',
        appVersion: '1.2.3'
      };

      // Verify required properties
      expect(journeyContext.journeyId).toBeDefined();
      expect(journeyContext.journeyType).toBeDefined();
      expect(journeyContext.userId).toBeDefined();

      // Verify optional properties
      expect(journeyContext.sessionId).toBeDefined();
      expect(journeyContext.startedAt).toBeDefined();
      expect(journeyContext.currentStep).toBeDefined();
      expect(journeyContext.deviceInfo).toBeDefined();
      expect(journeyContext.appVersion).toBeDefined();

      // Type checking (compile-time verification)
      // These assertions verify the structure at compile time
      const _journeyId: string = journeyContext.journeyId;
      const _journeyType: JourneyType = journeyContext.journeyType;
      const _userId: string = journeyContext.userId;
      const _sessionId: string | undefined = journeyContext.sessionId;
      const _startedAt: string | undefined = journeyContext.startedAt;
      const _currentStep: string | undefined = journeyContext.currentStep;
      const _deviceInfo: string | undefined = journeyContext.deviceInfo;
      const _appVersion: string | undefined = journeyContext.appVersion;
    });

    it('should allow minimal valid journey context with only required properties', () => {
      const minimalContext: JourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.CARE,
        userId: 'user-456'
      };

      expect(minimalContext.journeyId).toBeDefined();
      expect(minimalContext.journeyType).toBeDefined();
      expect(minimalContext.userId).toBeDefined();
      expect(minimalContext.sessionId).toBeUndefined();
      expect(minimalContext.startedAt).toBeUndefined();
    });
  });

  describe('Health Journey Context Interface', () => {
    it('should extend the base JourneyContext with health-specific attributes', () => {
      const healthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.HEALTH,
        userId: 'user-456',
        sessionId: 'session-789',
        metricType: 'blood-pressure',
        dataSource: 'connected-device',
        deviceId: 'device-123',
        goalId: 'goal-456',
        medicalEventId: 'event-789',
        integrationId: 'integration-123',
        fhirResourceType: 'Observation',
        isCritical: false
      };

      // Verify base properties
      expect(healthContext.journeyId).toBeDefined();
      expect(healthContext.journeyType).toBe(JourneyType.HEALTH);
      expect(healthContext.userId).toBeDefined();

      // Verify health-specific properties
      expect(healthContext.metricType).toBeDefined();
      expect(healthContext.dataSource).toBeDefined();
      expect(healthContext.deviceId).toBeDefined();
      expect(healthContext.goalId).toBeDefined();
      expect(healthContext.medicalEventId).toBeDefined();
      expect(healthContext.integrationId).toBeDefined();
      expect(healthContext.fhirResourceType).toBeDefined();
      expect(healthContext.isCritical).toBeDefined();

      // Type checking (compile-time verification)
      const _metricType: string | undefined = healthContext.metricType;
      const _dataSource: string | undefined = healthContext.dataSource;
      const _deviceId: string | undefined = healthContext.deviceId;
      const _goalId: string | undefined = healthContext.goalId;
      const _medicalEventId: string | undefined = healthContext.medicalEventId;
      const _integrationId: string | undefined = healthContext.integrationId;
      const _fhirResourceType: string | undefined = healthContext.fhirResourceType;
      const _isCritical: boolean | undefined = healthContext.isCritical;
    });

    it('should allow a minimal health journey context with only required base properties', () => {
      const minimalHealthContext: HealthJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.HEALTH,
        userId: 'user-456'
      };

      expect(minimalHealthContext.journeyId).toBeDefined();
      expect(minimalHealthContext.journeyType).toBe(JourneyType.HEALTH);
      expect(minimalHealthContext.userId).toBeDefined();
      expect(minimalHealthContext.metricType).toBeUndefined();
      expect(minimalHealthContext.dataSource).toBeUndefined();
    });
  });

  describe('Care Journey Context Interface', () => {
    it('should extend the base JourneyContext with care-specific attributes', () => {
      const careContext: CareJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.CARE,
        userId: 'user-456',
        sessionId: 'session-789',
        appointmentId: 'appointment-123',
        providerId: 'provider-456',
        telemedicineSessionId: 'telemedicine-789',
        medicationId: 'medication-123',
        treatmentPlanId: 'treatment-456',
        symptomCheckerSessionId: 'symptom-789',
        urgencyLevel: 'high',
        isFollowUp: true
      };

      // Verify base properties
      expect(careContext.journeyId).toBeDefined();
      expect(careContext.journeyType).toBe(JourneyType.CARE);
      expect(careContext.userId).toBeDefined();

      // Verify care-specific properties
      expect(careContext.appointmentId).toBeDefined();
      expect(careContext.providerId).toBeDefined();
      expect(careContext.telemedicineSessionId).toBeDefined();
      expect(careContext.medicationId).toBeDefined();
      expect(careContext.treatmentPlanId).toBeDefined();
      expect(careContext.symptomCheckerSessionId).toBeDefined();
      expect(careContext.urgencyLevel).toBeDefined();
      expect(careContext.isFollowUp).toBeDefined();

      // Type checking (compile-time verification)
      const _appointmentId: string | undefined = careContext.appointmentId;
      const _providerId: string | undefined = careContext.providerId;
      const _telemedicineSessionId: string | undefined = careContext.telemedicineSessionId;
      const _medicationId: string | undefined = careContext.medicationId;
      const _treatmentPlanId: string | undefined = careContext.treatmentPlanId;
      const _symptomCheckerSessionId: string | undefined = careContext.symptomCheckerSessionId;
      const _urgencyLevel: string | undefined = careContext.urgencyLevel;
      const _isFollowUp: boolean | undefined = careContext.isFollowUp;
    });

    it('should allow a minimal care journey context with only required base properties', () => {
      const minimalCareContext: CareJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.CARE,
        userId: 'user-456'
      };

      expect(minimalCareContext.journeyId).toBeDefined();
      expect(minimalCareContext.journeyType).toBe(JourneyType.CARE);
      expect(minimalCareContext.userId).toBeDefined();
      expect(minimalCareContext.appointmentId).toBeUndefined();
      expect(minimalCareContext.providerId).toBeUndefined();
    });
  });

  describe('Plan Journey Context Interface', () => {
    it('should extend the base JourneyContext with plan-specific attributes', () => {
      const planContext: PlanJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.PLAN,
        userId: 'user-456',
        sessionId: 'session-789',
        planId: 'plan-123',
        claimId: 'claim-456',
        benefitId: 'benefit-789',
        documentId: 'document-123',
        coverageId: 'coverage-456',
        transactionId: 'transaction-789',
        verificationStatus: 'approved',
        isHighValue: true
      };

      // Verify base properties
      expect(planContext.journeyId).toBeDefined();
      expect(planContext.journeyType).toBe(JourneyType.PLAN);
      expect(planContext.userId).toBeDefined();

      // Verify plan-specific properties
      expect(planContext.planId).toBeDefined();
      expect(planContext.claimId).toBeDefined();
      expect(planContext.benefitId).toBeDefined();
      expect(planContext.documentId).toBeDefined();
      expect(planContext.coverageId).toBeDefined();
      expect(planContext.transactionId).toBeDefined();
      expect(planContext.verificationStatus).toBeDefined();
      expect(planContext.isHighValue).toBeDefined();

      // Type checking (compile-time verification)
      const _planId: string | undefined = planContext.planId;
      const _claimId: string | undefined = planContext.claimId;
      const _benefitId: string | undefined = planContext.benefitId;
      const _documentId: string | undefined = planContext.documentId;
      const _coverageId: string | undefined = planContext.coverageId;
      const _transactionId: string | undefined = planContext.transactionId;
      const _verificationStatus: string | undefined = planContext.verificationStatus;
      const _isHighValue: boolean | undefined = planContext.isHighValue;
    });

    it('should allow a minimal plan journey context with only required base properties', () => {
      const minimalPlanContext: PlanJourneyContext = {
        journeyId: 'journey-123',
        journeyType: JourneyType.PLAN,
        userId: 'user-456'
      };

      expect(minimalPlanContext.journeyId).toBeDefined();
      expect(minimalPlanContext.journeyType).toBe(JourneyType.PLAN);
      expect(minimalPlanContext.userId).toBeDefined();
      expect(minimalPlanContext.planId).toBeUndefined();
      expect(minimalPlanContext.claimId).toBeUndefined();
    });
  });

  describe('Gamification Context Interface', () => {
    it('should define a valid gamification context object', () => {
      const gamificationContext: GamificationContext = {
        eventId: 'event-123',
        eventType: 'achievement-unlocked',
        achievementId: 'achievement-456',
        questId: 'quest-789',
        rewardId: 'reward-123',
        pointsEarned: 100,
        userLevel: 5,
        isLevelUp: true,
        isCrossJourney: true,
        involvedJourneys: [JourneyType.HEALTH, JourneyType.CARE]
      };

      // Verify gamification properties
      expect(gamificationContext.eventId).toBeDefined();
      expect(gamificationContext.eventType).toBeDefined();
      expect(gamificationContext.achievementId).toBeDefined();
      expect(gamificationContext.questId).toBeDefined();
      expect(gamificationContext.rewardId).toBeDefined();
      expect(gamificationContext.pointsEarned).toBeDefined();
      expect(gamificationContext.userLevel).toBeDefined();
      expect(gamificationContext.isLevelUp).toBeDefined();
      expect(gamificationContext.isCrossJourney).toBeDefined();
      expect(gamificationContext.involvedJourneys).toBeDefined();
      expect(gamificationContext.involvedJourneys).toHaveLength(2);

      // Type checking (compile-time verification)
      const _eventId: string | undefined = gamificationContext.eventId;
      const _eventType: string | undefined = gamificationContext.eventType;
      const _achievementId: string | undefined = gamificationContext.achievementId;
      const _questId: string | undefined = gamificationContext.questId;
      const _rewardId: string | undefined = gamificationContext.rewardId;
      const _pointsEarned: number | undefined = gamificationContext.pointsEarned;
      const _userLevel: number | undefined = gamificationContext.userLevel;
      const _isLevelUp: boolean | undefined = gamificationContext.isLevelUp;
      const _isCrossJourney: boolean | undefined = gamificationContext.isCrossJourney;
      const _involvedJourneys: JourneyType[] | undefined = gamificationContext.involvedJourneys;
    });

    it('should allow an empty gamification context', () => {
      const emptyGamificationContext: GamificationContext = {};
      
      expect(emptyGamificationContext.eventId).toBeUndefined();
      expect(emptyGamificationContext.eventType).toBeUndefined();
      expect(emptyGamificationContext.achievementId).toBeUndefined();
    });
  });

  describe('Combined Journey with Gamification Interfaces', () => {
    it('should combine Health Journey with Gamification context', () => {
      const healthWithGamification: HealthJourneyWithGamification = {
        journeyId: 'journey-123',
        journeyType: JourneyType.HEALTH,
        userId: 'user-456',
        metricType: 'steps',
        dataSource: 'fitbit',
        deviceId: 'device-123',
        eventId: 'event-123',
        eventType: 'daily-goal-achieved',
        achievementId: 'achievement-456',
        pointsEarned: 50,
        userLevel: 3,
        isLevelUp: false,
        isCrossJourney: false
      };

      // Verify base journey properties
      expect(healthWithGamification.journeyId).toBeDefined();
      expect(healthWithGamification.journeyType).toBe(JourneyType.HEALTH);
      expect(healthWithGamification.userId).toBeDefined();

      // Verify health-specific properties
      expect(healthWithGamification.metricType).toBeDefined();
      expect(healthWithGamification.dataSource).toBeDefined();
      expect(healthWithGamification.deviceId).toBeDefined();

      // Verify gamification properties
      expect(healthWithGamification.eventId).toBeDefined();
      expect(healthWithGamification.eventType).toBeDefined();
      expect(healthWithGamification.achievementId).toBeDefined();
      expect(healthWithGamification.pointsEarned).toBeDefined();
      expect(healthWithGamification.userLevel).toBeDefined();
      expect(healthWithGamification.isLevelUp).toBeDefined();
      expect(healthWithGamification.isCrossJourney).toBeDefined();
    });

    it('should combine Care Journey with Gamification context', () => {
      const careWithGamification: CareJourneyWithGamification = {
        journeyId: 'journey-123',
        journeyType: JourneyType.CARE,
        userId: 'user-456',
        appointmentId: 'appointment-123',
        providerId: 'provider-456',
        eventId: 'event-123',
        eventType: 'appointment-completed',
        achievementId: 'achievement-456',
        pointsEarned: 75,
        userLevel: 4,
        isLevelUp: true,
        isCrossJourney: false
      };

      // Verify base journey properties
      expect(careWithGamification.journeyId).toBeDefined();
      expect(careWithGamification.journeyType).toBe(JourneyType.CARE);
      expect(careWithGamification.userId).toBeDefined();

      // Verify care-specific properties
      expect(careWithGamification.appointmentId).toBeDefined();
      expect(careWithGamification.providerId).toBeDefined();

      // Verify gamification properties
      expect(careWithGamification.eventId).toBeDefined();
      expect(careWithGamification.eventType).toBeDefined();
      expect(careWithGamification.achievementId).toBeDefined();
      expect(careWithGamification.pointsEarned).toBeDefined();
      expect(careWithGamification.userLevel).toBeDefined();
      expect(careWithGamification.isLevelUp).toBeDefined();
      expect(careWithGamification.isCrossJourney).toBeDefined();
    });

    it('should combine Plan Journey with Gamification context', () => {
      const planWithGamification: PlanJourneyWithGamification = {
        journeyId: 'journey-123',
        journeyType: JourneyType.PLAN,
        userId: 'user-456',
        planId: 'plan-123',
        claimId: 'claim-456',
        eventId: 'event-123',
        eventType: 'claim-submitted',
        achievementId: 'achievement-456',
        pointsEarned: 60,
        userLevel: 2,
        isLevelUp: false,
        isCrossJourney: false
      };

      // Verify base journey properties
      expect(planWithGamification.journeyId).toBeDefined();
      expect(planWithGamification.journeyType).toBe(JourneyType.PLAN);
      expect(planWithGamification.userId).toBeDefined();

      // Verify plan-specific properties
      expect(planWithGamification.planId).toBeDefined();
      expect(planWithGamification.claimId).toBeDefined();

      // Verify gamification properties
      expect(planWithGamification.eventId).toBeDefined();
      expect(planWithGamification.eventType).toBeDefined();
      expect(planWithGamification.achievementId).toBeDefined();
      expect(planWithGamification.pointsEarned).toBeDefined();
      expect(planWithGamification.userLevel).toBeDefined();
      expect(planWithGamification.isLevelUp).toBeDefined();
      expect(planWithGamification.isCrossJourney).toBeDefined();
    });
  });

  describe('Cross-Journey Correlation', () => {
    it('should support cross-journey achievement tracking', () => {
      const crossJourneyContext: GamificationContext = {
        eventId: 'event-123',
        eventType: 'cross-journey-achievement',
        achievementId: 'achievement-456',
        pointsEarned: 200,
        userLevel: 7,
        isLevelUp: true,
        isCrossJourney: true,
        involvedJourneys: [JourneyType.HEALTH, JourneyType.CARE, JourneyType.PLAN]
      };

      expect(crossJourneyContext.isCrossJourney).toBe(true);
      expect(crossJourneyContext.involvedJourneys).toBeDefined();
      expect(crossJourneyContext.involvedJourneys).toHaveLength(3);
      expect(crossJourneyContext.involvedJourneys).toContain(JourneyType.HEALTH);
      expect(crossJourneyContext.involvedJourneys).toContain(JourneyType.CARE);
      expect(crossJourneyContext.involvedJourneys).toContain(JourneyType.PLAN);
    });

    it('should allow correlation between health and care journeys', () => {
      const healthContext: HealthJourneyWithGamification = {
        journeyId: 'journey-health-123',
        journeyType: JourneyType.HEALTH,
        userId: 'user-456',
        metricType: 'blood-pressure',
        eventId: 'event-123',
        isCrossJourney: true,
        involvedJourneys: [JourneyType.HEALTH, JourneyType.CARE]
      };

      const careContext: CareJourneyWithGamification = {
        journeyId: 'journey-care-789',
        journeyType: JourneyType.CARE,
        userId: 'user-456',
        appointmentId: 'appointment-123',
        eventId: 'event-123', // Same event ID for correlation
        isCrossJourney: true,
        involvedJourneys: [JourneyType.HEALTH, JourneyType.CARE]
      };

      // Verify correlation through shared event ID and involved journeys
      expect(healthContext.eventId).toBe(careContext.eventId);
      expect(healthContext.userId).toBe(careContext.userId);
      expect(healthContext.isCrossJourney).toBe(true);
      expect(careContext.isCrossJourney).toBe(true);
      expect(healthContext.involvedJourneys).toContain(JourneyType.CARE);
      expect(careContext.involvedJourneys).toContain(JourneyType.HEALTH);
    });
  });

  describe('createJourneyContext Helper Function', () => {
    it('should create a valid journey context with required properties', () => {
      const userId = 'user-123';
      const journeyType = JourneyType.HEALTH;
      
      const context = createJourneyContext(userId, journeyType);
      
      expect(context).toBeDefined();
      expect(context.journeyId).toBeDefined();
      expect(context.journeyId).toMatch(/^journey-\d+-[a-z0-9]+$/);
      expect(context.userId).toBe(userId);
      expect(context.journeyType).toBe(journeyType);
      expect(context.startedAt).toBeDefined();
      
      // Verify ISO date format
      expect(() => new Date(context.startedAt as string)).not.toThrow();
    });
    
    it('should create unique journey IDs for different contexts', () => {
      const userId = 'user-123';
      
      const context1 = createJourneyContext(userId, JourneyType.HEALTH);
      const context2 = createJourneyContext(userId, JourneyType.CARE);
      
      expect(context1.journeyId).not.toBe(context2.journeyId);
    });
    
    it('should create contexts for all journey types', () => {
      const userId = 'user-123';
      
      const healthContext = createJourneyContext(userId, JourneyType.HEALTH);
      const careContext = createJourneyContext(userId, JourneyType.CARE);
      const planContext = createJourneyContext(userId, JourneyType.PLAN);
      
      expect(healthContext.journeyType).toBe(JourneyType.HEALTH);
      expect(careContext.journeyType).toBe(JourneyType.CARE);
      expect(planContext.journeyType).toBe(JourneyType.PLAN);
    });
  });
});