/**
 * @file mock-journey-services.ts
 * 
 * Provides mock implementations for journey-specific services (Health, Care, Plan) 
 * that produce and consume events. This comprehensive mock allows testing of 
 * cross-journey event flows and gamification integration without requiring the 
 * actual microservices.
 * 
 * Key features:
 * - Mock implementations for all three journeys (Health, Care, Plan)
 * - Event production for journey-specific user actions
 * - Event consumption simulation for cross-journey scenarios
 * - Achievement notification handling
 * - User profile state tracking across journeys
 * - Gamification response simulation
 * 
 * The mock services simulate the event-driven architecture of the AUSTA SuperApp,
 * where user actions in different journeys generate events that are processed by
 * the gamification engine. The engine evaluates these events against achievement
 * rules and sends notifications back to the appropriate journey services.
 * 
 * This cross-journey achievement system allows for testing complex scenarios where
 * actions in one journey can influence achievements and rewards in another journey,
 * providing a comprehensive testing environment for the gamification features.
 */

import { EventEmitter } from 'events';

/**
 * Event types for the Health journey
 */
export enum HealthEventType {
  HEALTH_METRIC_RECORDED = 'HEALTH_METRIC_RECORDED',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  GOAL_CREATED = 'GOAL_CREATED',
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  HEALTH_CHECK_COMPLETED = 'HEALTH_CHECK_COMPLETED',
}

/**
 * Event types for the Care journey
 */
export enum CareEventType {
  APPOINTMENT_BOOKED = 'APPOINTMENT_BOOKED',
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  MEDICATION_ADDED = 'MEDICATION_ADDED',
  TELEMEDICINE_SESSION_COMPLETED = 'TELEMEDICINE_SESSION_COMPLETED',
  TREATMENT_PLAN_UPDATED = 'TREATMENT_PLAN_UPDATED',
}

/**
 * Event types for the Plan journey
 */
export enum PlanEventType {
  CLAIM_SUBMITTED = 'CLAIM_SUBMITTED',
  CLAIM_APPROVED = 'CLAIM_APPROVED',
  BENEFIT_USED = 'BENEFIT_USED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  PLAN_SELECTED = 'PLAN_SELECTED',
}

/**
 * Event types for gamification responses
 */
export enum GamificationEventType {
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  POINTS_AWARDED = 'POINTS_AWARDED',
  LEVEL_UP = 'LEVEL_UP',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  REWARD_EARNED = 'REWARD_EARNED',
}

/**
 * Journey types in the AUSTA SuperApp
 */
export enum JourneyType {
  HEALTH = 'health',
  CARE = 'care',
  PLAN = 'plan',
}

/**
 * Interface for event data structure
 */
export interface EventData {
  type: string;
  userId: string;
  data: Record<string, any>;
  journey: JourneyType;
  timestamp?: Date;
}

/**
 * Interface for achievement notification
 */
export interface AchievementNotification {
  userId: string;
  achievementId: string;
  achievementName: string;
  achievementTitle: string;
  level: number;
  journey: JourneyType;
  timestamp: Date;
  points: number;
}

/**
 * Interface for user profile state
 */
export interface UserProfileState {
  userId: string;
  level: number;
  totalXp: number;
  achievements: {
    id: string;
    name: string;
    title: string;
    level: number;
    journey: JourneyType;
    unlockedAt: Date;
  }[];
  journeyStats: {
    [JourneyType.HEALTH]: {
      metricsRecorded: number;
      goalsAchieved: number;
      devicesConnected: number;
      healthChecksCompleted: number;
    };
    [JourneyType.CARE]: {
      appointmentsBooked: number;
      appointmentsCompleted: number;
      medicationsTaken: number;
      medicationsAdded: number;
      telemedicineSessionsCompleted: number;
    };
    [JourneyType.PLAN]: {
      claimsSubmitted: number;
      claimsApproved: number;
      benefitsUsed: number;
      documentsUploaded: number;
    };
  };
}

/**
 * Base class for all journey service mocks
 */
export abstract class BaseJourneyServiceMock {
  protected eventEmitter: EventEmitter;
  protected userProfiles: Map<string, UserProfileState>;
  protected journey: JourneyType;
  
  constructor(eventEmitter: EventEmitter, userProfiles: Map<string, UserProfileState>, journey: JourneyType) {
    this.eventEmitter = eventEmitter;
    this.userProfiles = userProfiles;
    this.journey = journey;
  }

  /**
   * Emit an event to the event bus
   */
  protected emitEvent(eventData: EventData): void {
    // Add timestamp if not provided
    if (!eventData.timestamp) {
      eventData.timestamp = new Date();
    }
    
    // Ensure journey is set
    eventData.journey = this.journey;
    
    // Emit the event
    this.eventEmitter.emit('journey-event', eventData);
    console.log(`[${this.journey}] Emitted event: ${eventData.type}`);
  }

  /**
   * Handle achievement notifications from the gamification engine
   */
  public handleAchievementNotification(notification: AchievementNotification): void {
    console.log(`[${this.journey}] Received achievement notification: ${notification.achievementTitle} (Level ${notification.level})`);
    
    // Update user profile with the achievement
    const userProfile = this.getUserProfile(notification.userId);
    
    // Add the achievement if it doesn't exist
    const existingAchievement = userProfile.achievements.find(a => a.id === notification.achievementId);
    if (!existingAchievement) {
      userProfile.achievements.push({
        id: notification.achievementId,
        name: notification.achievementName,
        title: notification.achievementTitle,
        level: notification.level,
        journey: notification.journey,
        unlockedAt: notification.timestamp,
      });
    } else {
      // Update the level if it's higher
      if (notification.level > existingAchievement.level) {
        existingAchievement.level = notification.level;
        existingAchievement.unlockedAt = notification.timestamp;
      }
    }
    
    // Update XP
    userProfile.totalXp += notification.points;
    
    // Check for level up
    const newLevel = Math.floor(userProfile.totalXp / 1000) + 1;
    if (newLevel > userProfile.level) {
      userProfile.level = newLevel;
      console.log(`[${this.journey}] User ${notification.userId} leveled up to ${newLevel}!`);
    }
  }

  /**
   * Get or create a user profile
   */
  protected getUserProfile(userId: string): UserProfileState {
    if (!this.userProfiles.has(userId)) {
      // Create a new user profile with default values
      const newProfile: UserProfileState = {
        userId,
        level: 1,
        totalXp: 0,
        achievements: [],
        journeyStats: {
          [JourneyType.HEALTH]: {
            metricsRecorded: 0,
            goalsAchieved: 0,
            devicesConnected: 0,
            healthChecksCompleted: 0,
          },
          [JourneyType.CARE]: {
            appointmentsBooked: 0,
            appointmentsCompleted: 0,
            medicationsTaken: 0,
            medicationsAdded: 0,
            telemedicineSessionsCompleted: 0,
          },
          [JourneyType.PLAN]: {
            claimsSubmitted: 0,
            claimsApproved: 0,
            benefitsUsed: 0,
            documentsUploaded: 0,
          },
        },
      };
      
      this.userProfiles.set(userId, newProfile);
    }
    
    return this.userProfiles.get(userId)!;
  }
}

/**
 * Mock implementation of the Health journey service
 */
export class HealthJourneyServiceMock extends BaseJourneyServiceMock {
  constructor(eventEmitter: EventEmitter, userProfiles: Map<string, UserProfileState>) {
    super(eventEmitter, userProfiles, JourneyType.HEALTH);
  }

  /**
   * Record a health metric for a user
   */
  public recordHealthMetric(userId: string, metricType: string, value: number, unit: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.HEALTH].metricsRecorded++;
    
    // Emit the event
    this.emitEvent({
      type: HealthEventType.HEALTH_METRIC_RECORDED,
      userId,
      journey: JourneyType.HEALTH,
      data: {
        metricType,
        value,
        unit,
        timestamp: new Date(),
      },
    });
    
    // Check if this metric achieves any goals
    this.checkGoalAchievement(userId, metricType, value);
  }

  /**
   * Create a health goal for a user
   */
  public createHealthGoal(userId: string, metricType: string, targetValue: number, deadline?: Date): void {
    // Update user profile
    const userProfile = this.getUserProfile(userId);
    
    // Emit the event
    this.emitEvent({
      type: HealthEventType.GOAL_CREATED,
      userId,
      journey: JourneyType.HEALTH,
      data: {
        metricType,
        targetValue,
        deadline: deadline?.toISOString(),
        createdAt: new Date(),
      },
    });
  }

  /**
   * Connect a device for a user
   */
  public connectDevice(userId: string, deviceType: string, deviceId: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.HEALTH].devicesConnected++;
    
    // Emit the event
    this.emitEvent({
      type: HealthEventType.DEVICE_CONNECTED,
      userId,
      journey: JourneyType.HEALTH,
      data: {
        deviceType,
        deviceId,
        connectedAt: new Date(),
      },
    });
  }

  /**
   * Complete a health check for a user
   */
  public completeHealthCheck(userId: string, checkType: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.HEALTH].healthChecksCompleted++;
    
    // Emit the event
    this.emitEvent({
      type: HealthEventType.HEALTH_CHECK_COMPLETED,
      userId,
      journey: JourneyType.HEALTH,
      data: {
        checkType,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Check if a metric achieves any goals
   */
  private checkGoalAchievement(userId: string, metricType: string, value: number): void {
    // This is a simplified mock implementation
    // In a real implementation, we would check against stored goals
    // For testing purposes, we'll simulate goal achievements based on thresholds
    
    let goalAchieved = false;
    let goalName = '';
    
    // Simulate goal achievements based on metric type and value
    if (metricType === 'STEPS' && value >= 10000) {
      goalAchieved = true;
      goalName = 'Daily Steps Goal';
    } else if (metricType === 'HEART_RATE' && value >= 60 && value <= 100) {
      goalAchieved = true;
      goalName = 'Healthy Heart Rate';
    } else if (metricType === 'SLEEP' && value >= 8) {
      goalAchieved = true;
      goalName = 'Sleep Duration Goal';
    }
    
    if (goalAchieved) {
      // Update user profile stats
      const userProfile = this.getUserProfile(userId);
      userProfile.journeyStats[JourneyType.HEALTH].goalsAchieved++;
      
      // Emit the goal achieved event
      this.emitEvent({
        type: HealthEventType.GOAL_ACHIEVED,
        userId,
        journey: JourneyType.HEALTH,
        data: {
          metricType,
          value,
          goalName,
          achievedAt: new Date(),
        },
      });
    }
  }
}

/**
 * Mock implementation of the Care journey service
 */
export class CareJourneyServiceMock extends BaseJourneyServiceMock {
  constructor(eventEmitter: EventEmitter, userProfiles: Map<string, UserProfileState>) {
    super(eventEmitter, userProfiles, JourneyType.CARE);
  }

  /**
   * Book an appointment for a user
   */
  public bookAppointment(userId: string, providerId: string, specialtyName: string, appointmentDate: Date): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.CARE].appointmentsBooked++;
    
    // Emit the event
    this.emitEvent({
      type: CareEventType.APPOINTMENT_BOOKED,
      userId,
      journey: JourneyType.CARE,
      data: {
        providerId,
        specialtyName,
        appointmentDate: appointmentDate.toISOString(),
        bookedAt: new Date(),
      },
    });
  }

  /**
   * Complete an appointment for a user
   */
  public completeAppointment(userId: string, appointmentId: string, providerId: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.CARE].appointmentsCompleted++;
    
    // Emit the event
    this.emitEvent({
      type: CareEventType.APPOINTMENT_COMPLETED,
      userId,
      journey: JourneyType.CARE,
      data: {
        appointmentId,
        providerId,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Add a medication for a user
   */
  public addMedication(userId: string, medicationName: string, dosage: string, frequency: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.CARE].medicationsAdded++;
    
    // Emit the event
    this.emitEvent({
      type: CareEventType.MEDICATION_ADDED,
      userId,
      journey: JourneyType.CARE,
      data: {
        medicationName,
        dosage,
        frequency,
        addedAt: new Date(),
      },
    });
  }

  /**
   * Record medication taken by a user
   */
  public takeMedication(userId: string, medicationName: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.CARE].medicationsTaken++;
    
    // Emit the event
    this.emitEvent({
      type: CareEventType.MEDICATION_TAKEN,
      userId,
      journey: JourneyType.CARE,
      data: {
        medicationName,
        takenAt: new Date(),
      },
    });
  }

  /**
   * Complete a telemedicine session for a user
   */
  public completeTelemedicineSession(userId: string, providerId: string, duration: number): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.CARE].telemedicineSessionsCompleted++;
    
    // Emit the event
    this.emitEvent({
      type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
      userId,
      journey: JourneyType.CARE,
      data: {
        providerId,
        duration, // in minutes
        completedAt: new Date(),
      },
    });
  }

  /**
   * Update a treatment plan for a user
   */
  public updateTreatmentPlan(userId: string, treatmentPlanId: string, updates: Record<string, any>): void {
    // Emit the event
    this.emitEvent({
      type: CareEventType.TREATMENT_PLAN_UPDATED,
      userId,
      journey: JourneyType.CARE,
      data: {
        treatmentPlanId,
        updates,
        updatedAt: new Date(),
      },
    });
  }
}

/**
 * Mock implementation of the Plan journey service
 */
export class PlanJourneyServiceMock extends BaseJourneyServiceMock {
  constructor(eventEmitter: EventEmitter, userProfiles: Map<string, UserProfileState>) {
    super(eventEmitter, userProfiles, JourneyType.PLAN);
  }

  /**
   * Submit a claim for a user
   */
  public submitClaim(userId: string, claimType: string, amount: number, serviceDate: Date): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.PLAN].claimsSubmitted++;
    
    // Emit the event
    this.emitEvent({
      type: PlanEventType.CLAIM_SUBMITTED,
      userId,
      journey: JourneyType.PLAN,
      data: {
        claimType,
        amount,
        serviceDate: serviceDate.toISOString(),
        submittedAt: new Date(),
      },
    });
  }

  /**
   * Approve a claim for a user
   */
  public approveClaim(userId: string, claimId: string, approvedAmount: number): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.PLAN].claimsApproved++;
    
    // Emit the event
    this.emitEvent({
      type: PlanEventType.CLAIM_APPROVED,
      userId,
      journey: JourneyType.PLAN,
      data: {
        claimId,
        approvedAmount,
        approvedAt: new Date(),
      },
    });
  }

  /**
   * Use a benefit for a user
   */
  public useBenefit(userId: string, benefitType: string, benefitId: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.PLAN].benefitsUsed++;
    
    // Emit the event
    this.emitEvent({
      type: PlanEventType.BENEFIT_USED,
      userId,
      journey: JourneyType.PLAN,
      data: {
        benefitType,
        benefitId,
        usedAt: new Date(),
      },
    });
  }

  /**
   * Upload a document for a user
   */
  public uploadDocument(userId: string, documentType: string, fileName: string): void {
    // Update user profile stats
    const userProfile = this.getUserProfile(userId);
    userProfile.journeyStats[JourneyType.PLAN].documentsUploaded++;
    
    // Emit the event
    this.emitEvent({
      type: PlanEventType.DOCUMENT_UPLOADED,
      userId,
      journey: JourneyType.PLAN,
      data: {
        documentType,
        fileName,
        uploadedAt: new Date(),
      },
    });
  }

  /**
   * Select a plan for a user
   */
  public selectPlan(userId: string, planId: string, planName: string): void {
    // Emit the event
    this.emitEvent({
      type: PlanEventType.PLAN_SELECTED,
      userId,
      journey: JourneyType.PLAN,
      data: {
        planId,
        planName,
        selectedAt: new Date(),
      },
    });
  }
}

/**
 * Mock implementation of the Gamification engine service
 */
export class GamificationEngineMock {
  private eventEmitter: EventEmitter;
  private userProfiles: Map<string, UserProfileState>;
  private healthService: HealthJourneyServiceMock;
  private careService: CareJourneyServiceMock;
  private planService: PlanJourneyServiceMock;
  
  constructor() {
    this.eventEmitter = new EventEmitter();
    this.userProfiles = new Map<string, UserProfileState>();
    
    // Create journey services
    this.healthService = new HealthJourneyServiceMock(this.eventEmitter, this.userProfiles);
    this.careService = new CareJourneyServiceMock(this.eventEmitter, this.userProfiles);
    this.planService = new PlanJourneyServiceMock(this.eventEmitter, this.userProfiles);
    
    // Listen for journey events
    this.eventEmitter.on('journey-event', this.processEvent.bind(this));
  }

  /**
   * Process an event from any journey
   */
  private processEvent(eventData: EventData): void {
    console.log(`[Gamification] Processing event: ${eventData.type} from ${eventData.journey} journey`);
    
    // Simulate processing delay
    setTimeout(() => {
      // Determine if this event should trigger an achievement
      const achievement = this.checkForAchievement(eventData);
      
      if (achievement) {
        // Notify the appropriate journey service
        switch (achievement.journey) {
          case JourneyType.HEALTH:
            this.healthService.handleAchievementNotification(achievement);
            break;
          case JourneyType.CARE:
            this.careService.handleAchievementNotification(achievement);
            break;
          case JourneyType.PLAN:
            this.planService.handleAchievementNotification(achievement);
            break;
        }
      }
    }, 100); // Simulate a small processing delay
  }

  /**
   * Check if an event triggers an achievement
   */
  private checkForAchievement(eventData: EventData): AchievementNotification | null {
    // This is a simplified mock implementation
    // In a real implementation, we would check against defined achievement rules
    
    // Get user profile
    const userProfile = this.getUserProfile(eventData.userId);
    
    // Check for achievements based on event type and journey
    switch (eventData.journey) {
      case JourneyType.HEALTH:
        return this.checkHealthAchievements(eventData, userProfile);
      case JourneyType.CARE:
        return this.checkCareAchievements(eventData, userProfile);
      case JourneyType.PLAN:
        return this.checkPlanAchievements(eventData, userProfile);
      default:
        return null;
    }
  }

  /**
   * Check for Health journey achievements
   */
  private checkHealthAchievements(eventData: EventData, userProfile: UserProfileState): AchievementNotification | null {
    const stats = userProfile.journeyStats[JourneyType.HEALTH];
    
    // Check for health-check-streak achievement
    if (eventData.type === HealthEventType.HEALTH_CHECK_COMPLETED && stats.healthChecksCompleted % 5 === 0) {
      const level = Math.min(3, Math.floor(stats.healthChecksCompleted / 5));
      return {
        userId: eventData.userId,
        achievementId: 'health-check-streak',
        achievementName: 'health-check-streak',
        achievementTitle: 'Monitor de Saúde',
        level,
        journey: JourneyType.HEALTH,
        timestamp: new Date(),
        points: level * 100,
      };
    }
    
    // Check for steps-goal achievement
    if (eventData.type === HealthEventType.GOAL_ACHIEVED && 
        eventData.data.metricType === 'STEPS') {
      const level = Math.min(3, Math.floor(stats.goalsAchieved / 3));
      return {
        userId: eventData.userId,
        achievementId: 'steps-goal',
        achievementName: 'steps-goal',
        achievementTitle: 'Caminhante Dedicado',
        level,
        journey: JourneyType.HEALTH,
        timestamp: new Date(),
        points: level * 150,
      };
    }
    
    return null;
  }

  /**
   * Check for Care journey achievements
   */
  private checkCareAchievements(eventData: EventData, userProfile: UserProfileState): AchievementNotification | null {
    const stats = userProfile.journeyStats[JourneyType.CARE];
    
    // Check for appointment-keeper achievement
    if (eventData.type === CareEventType.APPOINTMENT_COMPLETED && stats.appointmentsCompleted % 3 === 0) {
      const level = Math.min(3, Math.floor(stats.appointmentsCompleted / 3));
      return {
        userId: eventData.userId,
        achievementId: 'appointment-keeper',
        achievementName: 'appointment-keeper',
        achievementTitle: 'Compromisso com a Saúde',
        level,
        journey: JourneyType.CARE,
        timestamp: new Date(),
        points: level * 120,
      };
    }
    
    // Check for medication-adherence achievement
    if (eventData.type === CareEventType.MEDICATION_TAKEN && stats.medicationsTaken % 7 === 0) {
      const level = Math.min(3, Math.floor(stats.medicationsTaken / 7));
      return {
        userId: eventData.userId,
        achievementId: 'medication-adherence',
        achievementName: 'medication-adherence',
        achievementTitle: 'Aderência ao Tratamento',
        level,
        journey: JourneyType.CARE,
        timestamp: new Date(),
        points: level * 130,
      };
    }
    
    return null;
  }

  /**
   * Check for Plan journey achievements
   */
  private checkPlanAchievements(eventData: EventData, userProfile: UserProfileState): AchievementNotification | null {
    const stats = userProfile.journeyStats[JourneyType.PLAN];
    
    // Check for claim-master achievement
    if (eventData.type === PlanEventType.CLAIM_SUBMITTED && stats.claimsSubmitted % 2 === 0) {
      const level = Math.min(3, Math.floor(stats.claimsSubmitted / 2));
      return {
        userId: eventData.userId,
        achievementId: 'claim-master',
        achievementName: 'claim-master',
        achievementTitle: 'Mestre em Reembolsos',
        level,
        journey: JourneyType.PLAN,
        timestamp: new Date(),
        points: level * 110,
      };
    }
    
    return null;
  }

  /**
   * Get or create a user profile
   */
  private getUserProfile(userId: string): UserProfileState {
    if (!this.userProfiles.has(userId)) {
      // Create a new user profile with default values
      const newProfile: UserProfileState = {
        userId,
        level: 1,
        totalXp: 0,
        achievements: [],
        journeyStats: {
          [JourneyType.HEALTH]: {
            metricsRecorded: 0,
            goalsAchieved: 0,
            devicesConnected: 0,
            healthChecksCompleted: 0,
          },
          [JourneyType.CARE]: {
            appointmentsBooked: 0,
            appointmentsCompleted: 0,
            medicationsTaken: 0,
            medicationsAdded: 0,
            telemedicineSessionsCompleted: 0,
          },
          [JourneyType.PLAN]: {
            claimsSubmitted: 0,
            claimsApproved: 0,
            benefitsUsed: 0,
            documentsUploaded: 0,
          },
        },
      };
      
      this.userProfiles.set(userId, newProfile);
    }
    
    return this.userProfiles.get(userId)!;
  }

  /**
   * Get the Health journey service mock
   */
  public getHealthService(): HealthJourneyServiceMock {
    return this.healthService;
  }

  /**
   * Get the Care journey service mock
   */
  public getCareService(): CareJourneyServiceMock {
    return this.careService;
  }

  /**
   * Get the Plan journey service mock
   */
  public getPlanService(): PlanJourneyServiceMock {
    return this.planService;
  }

  /**
   * Get a user's profile state
   */
  public getUserProfileState(userId: string): UserProfileState | undefined {
    return this.userProfiles.get(userId);
  }

  /**
   * Reset all user profiles and stats
   */
  public reset(): void {
    this.userProfiles.clear();
  }
}

/**
 * Create a mock gamification engine with all journey services
 */
export function createMockJourneyServices(): GamificationEngineMock {
  return new GamificationEngineMock();
}

/**
 * Example usage of the mock journey services
 * 
 * @example
 * ```typescript
 * // Create the mock services
 * const mockServices = createMockJourneyServices();
 * 
 * // Get individual journey services
 * const healthService = mockServices.getHealthService();
 * const careService = mockServices.getCareService();
 * const planService = mockServices.getPlanService();
 * 
 * // Generate events for a user
 * const userId = '123e4567-e89b-12d3-a456-426614174000';
 * 
 * // Health journey events
 * healthService.recordHealthMetric(userId, 'STEPS', 10000, 'steps');
 * healthService.createHealthGoal(userId, 'WEIGHT', 75, new Date('2023-12-31'));
 * healthService.connectDevice(userId, 'Smartwatch', 'device-123');
 * healthService.completeHealthCheck(userId, 'Annual Checkup');
 * 
 * // Care journey events
 * careService.bookAppointment(userId, 'provider-123', 'Cardiologia', new Date('2023-06-15T10:00:00Z'));
 * careService.completeAppointment(userId, 'appointment-123', 'provider-123');
 * careService.addMedication(userId, 'Aspirin', '100mg', 'Once daily');
 * careService.takeMedication(userId, 'Aspirin');
 * careService.completeTelemedicineSession(userId, 'provider-456', 30);
 * 
 * // Plan journey events
 * planService.submitClaim(userId, 'Consulta Médica', 150.00, new Date('2023-05-10'));
 * planService.approveClaim(userId, 'claim-123', 120.00);
 * planService.useBenefit(userId, 'Dental', 'benefit-123');
 * planService.uploadDocument(userId, 'Medical Receipt', 'receipt.pdf');
 * planService.selectPlan(userId, 'plan-123', 'Premium');
 * 
 * // Get the user's profile state with achievements and stats
 * const userProfile = mockServices.getUserProfileState(userId);
 * console.log(userProfile);
 * ```
 */