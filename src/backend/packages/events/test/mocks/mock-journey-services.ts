/**
 * @file mock-journey-services.ts
 * @description Provides mock implementations for journey-specific services (Health, Care, Plan) 
 * that produce and consume events. This comprehensive mock allows testing of cross-journey 
 * event flows and gamification integration without requiring the actual microservices.
 * 
 * It includes mock event generation based on user actions and simulated reactions to events 
 * from other services.
 */

import { EventEmitter } from 'events';
import { Subject, Observable } from 'rxjs';
import { EventType, JourneyEvents } from '../../src/dto/event-types.enum';
import { 
  HealthMetricData, 
  HealthGoalData, 
  DeviceSyncData, 
  HealthInsightData,
  HealthMetricType,
  HealthGoalType,
  DeviceType,
  HealthInsightType
} from '../../src/dto/health-event.dto';

/**
 * Interface for a generic event payload
 */
export interface EventPayload {
  type: string;
  journey: string;
  userId: string;
  timestamp: string;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * Interface for user profile data shared across journeys
 */
export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  points: number;
  level: number;
  achievements: Achievement[];
  healthMetrics: Record<string, any>[];
  appointments: Record<string, any>[];
  medications: Record<string, any>[];
  claims: Record<string, any>[];
  devices: Record<string, any>[];
  goals: Record<string, any>[];
}

/**
 * Interface for achievement data
 */
export interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  journey: string;
  unlockedAt: string;
  tier: 'bronze' | 'silver' | 'gold';
  points: number;
  icon: string;
}

/**
 * Base class for all mock journey services
 */
export abstract class BaseMockJourneyService {
  protected eventEmitter = new EventEmitter();
  protected eventSubject = new Subject<EventPayload>();
  protected userProfiles: Map<string, UserProfile> = new Map();
  protected journeyName: string;
  
  constructor(journeyName: string) {
    this.journeyName = journeyName;
  }
  
  /**
   * Gets the event stream as an Observable
   */
  public getEventStream(): Observable<EventPayload> {
    return this.eventSubject.asObservable();
  }
  
  /**
   * Emits an event to the event stream
   */
  protected emitEvent(event: EventPayload): void {
    this.eventSubject.next(event);
    this.eventEmitter.emit('event', event);
    console.log(`[${this.journeyName}] Event emitted:`, event.type);
  }
  
  /**
   * Handles an incoming event from another service
   */
  public handleEvent(event: EventPayload): void {
    console.log(`[${this.journeyName}] Handling event:`, event.type);
    
    // Update user profile based on the event
    if (event.userId && this.userProfiles.has(event.userId)) {
      this.updateUserProfile(event.userId, event);
    }
    
    // Handle achievement notifications
    if (event.type === EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED) {
      this.handleAchievementNotification(event);
    }
    
    // Handle journey-specific events
    this.handleJourneySpecificEvent(event);
  }
  
  /**
   * Updates the user profile based on an event
   */
  protected updateUserProfile(userId: string, event: EventPayload): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;
    
    // Update points and level from gamification events
    if (event.type === EventType.GAMIFICATION_POINTS_EARNED) {
      profile.points += event.data.points;
      console.log(`[${this.journeyName}] User ${userId} earned ${event.data.points} points. Total: ${profile.points}`);
    }
    
    if (event.type === EventType.GAMIFICATION_LEVEL_UP) {
      profile.level = event.data.newLevel;
      console.log(`[${this.journeyName}] User ${userId} leveled up to ${event.data.newLevel}!`);
    }
    
    if (event.type === EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED) {
      profile.achievements.push({
        id: event.data.achievementId,
        type: event.data.achievementType,
        title: event.data.title || 'Achievement Unlocked',
        description: event.data.description || '',
        journey: event.data.journey || 'cross-journey',
        unlockedAt: event.data.unlockedAt,
        tier: event.data.tier,
        points: event.data.points,
        icon: event.data.icon || 'trophy'
      });
      console.log(`[${this.journeyName}] User ${userId} unlocked achievement: ${event.data.title || event.data.achievementType}`);
    }
    
    this.userProfiles.set(userId, profile);
  }
  
  /**
   * Handles achievement notifications
   */
  protected handleAchievementNotification(event: EventPayload): void {
    console.log(`[${this.journeyName}] Achievement notification:`, event.data.title || event.data.achievementType);
    // In a real implementation, this would trigger UI notifications
  }
  
  /**
   * Handles journey-specific events - to be implemented by subclasses
   */
  protected abstract handleJourneySpecificEvent(event: EventPayload): void;
  
  /**
   * Creates a new user profile or returns an existing one
   */
  public createUserProfile(userId: string, name: string, email: string): UserProfile {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }
    
    const profile: UserProfile = {
      userId,
      name,
      email,
      points: 0,
      level: 1,
      achievements: [],
      healthMetrics: [],
      appointments: [],
      medications: [],
      claims: [],
      devices: [],
      goals: []
    };
    
    this.userProfiles.set(userId, profile);
    return profile;
  }
  
  /**
   * Gets a user profile by ID
   */
  public getUserProfile(userId: string): UserProfile | undefined {
    return this.userProfiles.get(userId);
  }
  
  /**
   * Creates a base event payload
   */
  protected createEventPayload(userId: string, type: string, data: any): EventPayload {
    return {
      type,
      journey: this.journeyName,
      userId,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        source: `mock-${this.journeyName}-service`,
        version: '1.0.0'
      }
    };
  }
}

/**
 * Mock Health Journey Service
 */
export class MockHealthJourneyService extends BaseMockJourneyService {
  constructor() {
    super('health');
  }
  
  /**
   * Records a health metric for a user
   */
  public recordHealthMetric(userId: string, metricData: Partial<HealthMetricData>): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const metric: HealthMetricData = {
      metricType: metricData.metricType || HealthMetricType.HEART_RATE,
      value: metricData.value || 0,
      unit: metricData.unit || 'bpm',
      recordedAt: metricData.recordedAt || new Date().toISOString(),
      notes: metricData.notes,
      deviceId: metricData.deviceId,
      validateMetricRange: function() { return true; }
    };
    
    // Add to user profile
    profile.healthMetrics.push(metric);
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.HEALTH_METRIC_RECORDED, metric);
    this.emitEvent(event);
    
    // Check for streak achievements
    this.checkHealthMetricStreak(userId, metric.metricType);
  }
  
  /**
   * Creates a health goal for a user
   */
  public createHealthGoal(userId: string, goalData: Partial<HealthGoalData>): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const goalId = goalData.goalId || `goal-${Date.now()}`;
    
    const goal: HealthGoalData = {
      goalId,
      goalType: goalData.goalType || HealthGoalType.STEPS_TARGET,
      description: goalData.description || 'Default goal description',
      targetValue: goalData.targetValue,
      unit: goalData.unit,
      progressPercentage: goalData.progressPercentage || 0,
      isAchieved: function() { return this.progressPercentage >= 100; },
      markAsAchieved: function() { 
        this.progressPercentage = 100; 
        this.achievedAt = new Date().toISOString(); 
      }
    };
    
    // Add to user profile
    profile.goals.push(goal);
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.HEALTH_GOAL_CREATED, goal);
    this.emitEvent(event);
  }
  
  /**
   * Updates progress on a health goal
   */
  public updateGoalProgress(userId: string, goalId: string, progressPercentage: number): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const goalIndex = profile.goals.findIndex(g => g.goalId === goalId);
    if (goalIndex === -1) {
      throw new Error(`Goal not found with ID: ${goalId}`);
    }
    
    const goal = profile.goals[goalIndex] as HealthGoalData;
    goal.progressPercentage = progressPercentage;
    
    // Check if goal is achieved
    if (progressPercentage >= 100 && !goal.achievedAt) {
      goal.achievedAt = new Date().toISOString();
      
      // Emit goal achieved event
      const event = this.createEventPayload(userId, EventType.HEALTH_GOAL_ACHIEVED, goal);
      this.emitEvent(event);
    }
    
    // Update in profile
    profile.goals[goalIndex] = goal;
  }
  
  /**
   * Syncs a device for a user
   */
  public syncDevice(userId: string, deviceData: Partial<DeviceSyncData>): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const deviceId = deviceData.deviceId || `device-${Date.now()}`;
    
    const device: DeviceSyncData = {
      deviceId,
      deviceType: deviceData.deviceType || DeviceType.SMARTWATCH,
      deviceName: deviceData.deviceName || 'Default Device',
      syncedAt: deviceData.syncedAt || new Date().toISOString(),
      syncSuccessful: deviceData.syncSuccessful !== undefined ? deviceData.syncSuccessful : true,
      dataPointsCount: deviceData.dataPointsCount,
      metricTypes: deviceData.metricTypes,
      errorMessage: deviceData.errorMessage,
      markAsFailed: function(errorMessage: string) {
        this.syncSuccessful = false;
        this.errorMessage = errorMessage;
      },
      markAsSuccessful: function(dataPointsCount: number, metricTypes: HealthMetricType[]) {
        this.syncSuccessful = true;
        this.dataPointsCount = dataPointsCount;
        this.metricTypes = metricTypes;
        this.errorMessage = undefined;
      }
    };
    
    // Add to user profile
    const existingDeviceIndex = profile.devices.findIndex(d => d.deviceId === deviceId);
    if (existingDeviceIndex >= 0) {
      profile.devices[existingDeviceIndex] = device;
    } else {
      profile.devices.push(device);
    }
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.HEALTH_DEVICE_CONNECTED, device);
    this.emitEvent(event);
  }
  
  /**
   * Generates a health insight for a user
   */
  public generateHealthInsight(userId: string, insightData: Partial<HealthInsightData>): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const insightId = insightData.insightId || `insight-${Date.now()}`;
    
    const insight: HealthInsightData = {
      insightId,
      insightType: insightData.insightType || HealthInsightType.TREND_ANALYSIS,
      title: insightData.title || 'Default Insight Title',
      description: insightData.description || 'Default insight description',
      relatedMetricTypes: insightData.relatedMetricTypes,
      confidenceScore: insightData.confidenceScore || 75,
      generatedAt: insightData.generatedAt || new Date().toISOString(),
      userAcknowledged: insightData.userAcknowledged || false,
      acknowledgeByUser: function() { this.userAcknowledged = true; },
      isHighPriority: function() {
        return (this.insightType === HealthInsightType.ANOMALY_DETECTION || 
               this.insightType === HealthInsightType.HEALTH_RISK_ASSESSMENT) && 
               this.confidenceScore > 75;
      }
    };
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.HEALTH_INSIGHT_GENERATED, insight);
    this.emitEvent(event);
  }
  
  /**
   * Checks for health metric streak achievements
   */
  private checkHealthMetricStreak(userId: string, metricType: HealthMetricType): void {
    // This would contain logic to check for streaks and trigger achievements
    // For mock purposes, we'll randomly trigger streak achievements
    if (Math.random() > 0.7) {
      console.log(`[health] User ${userId} has a streak for ${metricType}!`);
      
      // This would be handled by the gamification engine in a real implementation
      // Here we're simulating the response
      setTimeout(() => {
        const achievementEvent = {
          type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          journey: 'gamification',
          userId,
          timestamp: new Date().toISOString(),
          data: {
            achievementId: `streak-${Date.now()}`,
            achievementType: 'health-check-streak',
            title: 'Monitor de Saúde',
            description: 'Registre suas métricas de saúde por dias consecutivos',
            journey: 'health',
            unlockedAt: new Date().toISOString(),
            tier: Math.random() > 0.5 ? 'silver' : 'bronze',
            points: Math.floor(Math.random() * 50) + 10,
            icon: 'heart-pulse'
          },
          metadata: {
            source: 'mock-gamification-engine',
            version: '1.0.0'
          }
        };
        
        this.handleEvent(achievementEvent);
      }, 500);
    }
  }
  
  /**
   * Handles journey-specific events
   */
  protected handleJourneySpecificEvent(event: EventPayload): void {
    // Handle health-specific events
    switch (event.type) {
      case EventType.HEALTH_GOAL_ACHIEVED:
        console.log(`[health] Goal achieved: ${event.data.description}`);
        break;
        
      case EventType.HEALTH_INSIGHT_GENERATED:
        if (event.data.isHighPriority && event.data.isHighPriority()) {
          console.log(`[health] High priority insight generated: ${event.data.title}`);
        }
        break;
        
      case EventType.HEALTH_DEVICE_CONNECTED:
        if (event.data.syncSuccessful) {
          console.log(`[health] Device connected successfully: ${event.data.deviceName}`);
        } else {
          console.log(`[health] Device connection failed: ${event.data.deviceName} - ${event.data.errorMessage}`);
        }
        break;
    }
  }
}

/**
 * Mock Care Journey Service
 */
export class MockCareJourneyService extends BaseMockJourneyService {
  constructor() {
    super('care');
  }
  
  /**
   * Books an appointment for a user
   */
  public bookAppointment(userId: string, appointmentData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const appointment = {
      appointmentId: appointmentData.appointmentId || `appointment-${Date.now()}`,
      providerId: appointmentData.providerId || `provider-${Math.floor(Math.random() * 1000)}`,
      specialtyType: appointmentData.specialtyType || 'General',
      appointmentType: appointmentData.appointmentType || 'in_person',
      scheduledAt: appointmentData.scheduledAt || new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      bookedAt: appointmentData.bookedAt || new Date().toISOString(),
      status: 'scheduled'
    };
    
    // Add to user profile
    profile.appointments.push(appointment);
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.CARE_APPOINTMENT_BOOKED, appointment);
    this.emitEvent(event);
    
    // Check for appointment booking achievements
    this.checkAppointmentAchievements(userId);
  }
  
  /**
   * Completes an appointment for a user
   */
  public completeAppointment(userId: string, appointmentId: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const appointmentIndex = profile.appointments.findIndex(a => a.appointmentId === appointmentId);
    if (appointmentIndex === -1) {
      throw new Error(`Appointment not found with ID: ${appointmentId}`);
    }
    
    const appointment = profile.appointments[appointmentIndex];
    appointment.status = 'completed';
    appointment.completedAt = new Date().toISOString();
    appointment.duration = Math.floor(Math.random() * 30) + 15; // 15-45 minutes
    
    // Update in profile
    profile.appointments[appointmentIndex] = appointment;
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.CARE_APPOINTMENT_COMPLETED, appointment);
    this.emitEvent(event);
    
    // Check for appointment completion achievements
    this.checkAppointmentCompletionAchievements(userId);
  }
  
  /**
   * Records medication taken by a user
   */
  public recordMedicationTaken(userId: string, medicationData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const medication = {
      medicationId: medicationData.medicationId || `medication-${Date.now()}`,
      medicationName: medicationData.medicationName || 'Default Medication',
      dosage: medicationData.dosage || '1 pill',
      takenAt: medicationData.takenAt || new Date().toISOString(),
      adherence: medicationData.adherence || 'on_time'
    };
    
    // Add to user profile
    profile.medications.push(medication);
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.CARE_MEDICATION_TAKEN, medication);
    this.emitEvent(event);
    
    // Check for medication adherence achievements
    this.checkMedicationAdherenceAchievements(userId);
  }
  
  /**
   * Starts a telemedicine session for a user
   */
  public startTelemedicineSession(userId: string, sessionData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const session = {
      sessionId: sessionData.sessionId || `session-${Date.now()}`,
      appointmentId: sessionData.appointmentId,
      providerId: sessionData.providerId || `provider-${Math.floor(Math.random() * 1000)}`,
      startedAt: sessionData.startedAt || new Date().toISOString(),
      deviceType: sessionData.deviceType || 'mobile',
      status: 'in_progress'
    };
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.CARE_TELEMEDICINE_STARTED, session);
    this.emitEvent(event);
  }
  
  /**
   * Completes a telemedicine session for a user
   */
  public completeTelemedicineSession(userId: string, sessionId: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const session = {
      sessionId,
      endedAt: new Date().toISOString(),
      duration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
      quality: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
      status: 'completed'
    };
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.CARE_TELEMEDICINE_COMPLETED, session);
    this.emitEvent(event);
  }
  
  /**
   * Checks for appointment booking achievements
   */
  private checkAppointmentAchievements(userId: string): void {
    // This would contain logic to check for appointment-related achievements
    // For mock purposes, we'll randomly trigger achievements
    if (Math.random() > 0.7) {
      console.log(`[care] User ${userId} has booked multiple appointments!`);
      
      // Simulate gamification engine response
      setTimeout(() => {
        const achievementEvent = {
          type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          journey: 'gamification',
          userId,
          timestamp: new Date().toISOString(),
          data: {
            achievementId: `appointment-${Date.now()}`,
            achievementType: 'appointment-keeper',
            title: 'Compromisso com a Saúde',
            description: 'Compareça às consultas agendadas',
            journey: 'care',
            unlockedAt: new Date().toISOString(),
            tier: 'bronze',
            points: Math.floor(Math.random() * 30) + 10,
            icon: 'calendar-check'
          },
          metadata: {
            source: 'mock-gamification-engine',
            version: '1.0.0'
          }
        };
        
        this.handleEvent(achievementEvent);
      }, 500);
    }
  }
  
  /**
   * Checks for appointment completion achievements
   */
  private checkAppointmentCompletionAchievements(userId: string): void {
    // This would contain logic to check for appointment completion achievements
    // For mock purposes, we'll randomly trigger achievements
    if (Math.random() > 0.6) {
      console.log(`[care] User ${userId} has completed multiple appointments!`);
      
      // Simulate gamification engine response
      setTimeout(() => {
        const achievementEvent = {
          type: EventType.GAMIFICATION_POINTS_EARNED,
          journey: 'gamification',
          userId,
          timestamp: new Date().toISOString(),
          data: {
            points: Math.floor(Math.random() * 20) + 5,
            sourceType: 'care',
            sourceId: `appointment-completion-${Date.now()}`,
            reason: 'Appointment completed',
            earnedAt: new Date().toISOString()
          },
          metadata: {
            source: 'mock-gamification-engine',
            version: '1.0.0'
          }
        };
        
        this.handleEvent(achievementEvent);
      }, 500);
    }
  }
  
  /**
   * Checks for medication adherence achievements
   */
  private checkMedicationAdherenceAchievements(userId: string): void {
    // This would contain logic to check for medication adherence achievements
    // For mock purposes, we'll randomly trigger achievements
    if (Math.random() > 0.7) {
      console.log(`[care] User ${userId} has good medication adherence!`);
      
      // Simulate gamification engine response
      setTimeout(() => {
        const achievementEvent = {
          type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          journey: 'gamification',
          userId,
          timestamp: new Date().toISOString(),
          data: {
            achievementId: `medication-${Date.now()}`,
            achievementType: 'medication-adherence',
            title: 'Aderência ao Tratamento',
            description: 'Tome seus medicamentos conforme prescrito',
            journey: 'care',
            unlockedAt: new Date().toISOString(),
            tier: Math.random() > 0.7 ? 'silver' : 'bronze',
            points: Math.floor(Math.random() * 40) + 15,
            icon: 'pill'
          },
          metadata: {
            source: 'mock-gamification-engine',
            version: '1.0.0'
          }
        };
        
        this.handleEvent(achievementEvent);
      }, 500);
    }
  }
  
  /**
   * Handles journey-specific events
   */
  protected handleJourneySpecificEvent(event: EventPayload): void {
    // Handle care-specific events
    switch (event.type) {
      case EventType.CARE_APPOINTMENT_BOOKED:
        console.log(`[care] Appointment booked for ${event.data.scheduledAt}`);
        break;
        
      case EventType.CARE_APPOINTMENT_COMPLETED:
        console.log(`[care] Appointment completed: ${event.data.appointmentId}`);
        break;
        
      case EventType.CARE_MEDICATION_TAKEN:
        console.log(`[care] Medication taken: ${event.data.medicationName}`);
        break;
        
      case EventType.CARE_TELEMEDICINE_COMPLETED:
        console.log(`[care] Telemedicine session completed: ${event.data.sessionId}`);
        break;
    }
  }
}

/**
 * Mock Plan Journey Service
 */
export class MockPlanJourneyService extends BaseMockJourneyService {
  constructor() {
    super('plan');
  }
  
  /**
   * Submits a claim for a user
   */
  public submitClaim(userId: string, claimData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const claim = {
      claimId: claimData.claimId || `claim-${Date.now()}`,
      claimType: claimData.claimType || 'medical',
      providerId: claimData.providerId || `provider-${Math.floor(Math.random() * 1000)}`,
      serviceDate: claimData.serviceDate || new Date().toISOString(),
      amount: claimData.amount || Math.floor(Math.random() * 500) + 100,
      submittedAt: claimData.submittedAt || new Date().toISOString(),
      status: 'submitted'
    };
    
    // Add to user profile
    profile.claims.push(claim);
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.PLAN_CLAIM_SUBMITTED, claim);
    this.emitEvent(event);
    
    // Check for claim submission achievements
    this.checkClaimSubmissionAchievements(userId);
    
    // Simulate claim processing after a delay
    setTimeout(() => {
      this.processClaim(userId, claim.claimId);
    }, 2000);
  }
  
  /**
   * Processes a claim for a user
   */
  public processClaim(userId: string, claimId: string): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const claimIndex = profile.claims.findIndex(c => c.claimId === claimId);
    if (claimIndex === -1) {
      throw new Error(`Claim not found with ID: ${claimId}`);
    }
    
    const claim = profile.claims[claimIndex];
    const amount = claim.amount;
    const coveredAmount = Math.floor(amount * (Math.random() * 0.3 + 0.7)); // 70-100% coverage
    
    claim.status = Math.random() > 0.9 ? 'denied' : 'approved';
    claim.processedAt = new Date().toISOString();
    claim.coveredAmount = claim.status === 'approved' ? coveredAmount : 0;
    
    // Update in profile
    profile.claims[claimIndex] = claim;
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.PLAN_CLAIM_PROCESSED, claim);
    this.emitEvent(event);
  }
  
  /**
   * Selects a plan for a user
   */
  public selectPlan(userId: string, planData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const plan = {
      planId: planData.planId || `plan-${Date.now()}`,
      planType: planData.planType || 'health',
      coverageLevel: planData.coverageLevel || 'individual',
      premium: planData.premium || Math.floor(Math.random() * 500) + 200,
      startDate: planData.startDate || new Date().toISOString(),
      selectedAt: planData.selectedAt || new Date().toISOString()
    };
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.PLAN_SELECTED, plan);
    this.emitEvent(event);
  }
  
  /**
   * Utilizes a benefit for a user
   */
  public utilizeBenefit(userId: string, benefitData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const benefit = {
      benefitId: benefitData.benefitId || `benefit-${Date.now()}`,
      benefitType: benefitData.benefitType || 'wellness',
      providerId: benefitData.providerId,
      utilizationDate: benefitData.utilizationDate || new Date().toISOString(),
      savingsAmount: benefitData.savingsAmount || Math.floor(Math.random() * 200) + 50
    };
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.PLAN_BENEFIT_UTILIZED, benefit);
    this.emitEvent(event);
  }
  
  /**
   * Redeems a reward for a user
   */
  public redeemReward(userId: string, rewardData: any): void {
    const profile = this.getUserProfile(userId);
    if (!profile) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    const pointsToRedeem = rewardData.pointsRedeemed || Math.min(profile.points, 100);
    if (pointsToRedeem > profile.points) {
      throw new Error(`Not enough points. Required: ${pointsToRedeem}, Available: ${profile.points}`);
    }
    
    const reward = {
      rewardId: rewardData.rewardId || `reward-${Date.now()}`,
      rewardType: rewardData.rewardType || 'gift_card',
      pointsRedeemed: pointsToRedeem,
      value: rewardData.value || Math.floor(pointsToRedeem / 10),
      redeemedAt: rewardData.redeemedAt || new Date().toISOString()
    };
    
    // Update points in profile
    profile.points -= pointsToRedeem;
    
    // Emit event
    const event = this.createEventPayload(userId, EventType.PLAN_REWARD_REDEEMED, reward);
    this.emitEvent(event);
  }
  
  /**
   * Checks for claim submission achievements
   */
  private checkClaimSubmissionAchievements(userId: string): void {
    // This would contain logic to check for claim-related achievements
    // For mock purposes, we'll randomly trigger achievements
    if (Math.random() > 0.7) {
      console.log(`[plan] User ${userId} has submitted multiple claims!`);
      
      // Simulate gamification engine response
      setTimeout(() => {
        const achievementEvent = {
          type: EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED,
          journey: 'gamification',
          userId,
          timestamp: new Date().toISOString(),
          data: {
            achievementId: `claim-${Date.now()}`,
            achievementType: 'claim-master',
            title: 'Mestre em Reembolsos',
            description: 'Submeta solicitações de reembolso completas',
            journey: 'plan',
            unlockedAt: new Date().toISOString(),
            tier: Math.random() > 0.8 ? 'silver' : 'bronze',
            points: Math.floor(Math.random() * 35) + 15,
            icon: 'receipt'
          },
          metadata: {
            source: 'mock-gamification-engine',
            version: '1.0.0'
          }
        };
        
        this.handleEvent(achievementEvent);
      }, 500);
    }
  }
  
  /**
   * Handles journey-specific events
   */
  protected handleJourneySpecificEvent(event: EventPayload): void {
    // Handle plan-specific events
    switch (event.type) {
      case EventType.PLAN_CLAIM_SUBMITTED:
        console.log(`[plan] Claim submitted: ${event.data.claimId} for $${event.data.amount}`);
        break;
        
      case EventType.PLAN_CLAIM_PROCESSED:
        if (event.data.status === 'approved') {
          console.log(`[plan] Claim approved: ${event.data.claimId} for $${event.data.coveredAmount}`);
        } else {
          console.log(`[plan] Claim denied: ${event.data.claimId}`);
        }
        break;
        
      case EventType.PLAN_BENEFIT_UTILIZED:
        console.log(`[plan] Benefit utilized: ${event.data.benefitType} with savings of $${event.data.savingsAmount}`);
        break;
        
      case EventType.PLAN_REWARD_REDEEMED:
        console.log(`[plan] Reward redeemed: ${event.data.rewardType} for ${event.data.pointsRedeemed} points`);
        break;
    }
  }
}

/**
 * Mock Gamification Engine Service
 * This service simulates the gamification engine that processes events from all journeys
 */
export class MockGamificationEngineService extends BaseMockJourneyService {
  private healthService: MockHealthJourneyService;
  private careService: MockCareJourneyService;
  private planService: MockPlanJourneyService;
  
  constructor(
    healthService: MockHealthJourneyService,
    careService: MockCareJourneyService,
    planService: MockPlanJourneyService
  ) {
    super('gamification');
    this.healthService = healthService;
    this.careService = careService;
    this.planService = planService;
    
    // Subscribe to events from all journey services
    this.subscribeToJourneyEvents();
  }
  
  /**
   * Subscribes to events from all journey services
   */
  private subscribeToJourneyEvents(): void {
    // Subscribe to health journey events
    this.healthService.getEventStream().subscribe(event => {
      this.processJourneyEvent(event);
    });
    
    // Subscribe to care journey events
    this.careService.getEventStream().subscribe(event => {
      this.processJourneyEvent(event);
    });
    
    // Subscribe to plan journey events
    this.planService.getEventStream().subscribe(event => {
      this.processJourneyEvent(event);
    });
  }
  
  /**
   * Processes events from journey services
   */
  private processJourneyEvent(event: EventPayload): void {
    console.log(`[gamification] Processing event: ${event.type} from ${event.journey} journey`);
    
    // Process different event types
    switch (event.type) {
      // Health journey events
      case EventType.HEALTH_METRIC_RECORDED:
        this.processHealthMetricRecorded(event);
        break;
        
      case EventType.HEALTH_GOAL_ACHIEVED:
        this.processHealthGoalAchieved(event);
        break;
        
      // Care journey events
      case EventType.CARE_APPOINTMENT_BOOKED:
        this.processAppointmentBooked(event);
        break;
        
      case EventType.CARE_APPOINTMENT_COMPLETED:
        this.processAppointmentCompleted(event);
        break;
        
      case EventType.CARE_MEDICATION_TAKEN:
        this.processMedicationTaken(event);
        break;
        
      // Plan journey events
      case EventType.PLAN_CLAIM_SUBMITTED:
        this.processClaimSubmitted(event);
        break;
        
      case EventType.PLAN_CLAIM_PROCESSED:
        this.processClaimProcessed(event);
        break;
        
      case EventType.PLAN_BENEFIT_UTILIZED:
        this.processBenefitUtilized(event);
        break;
    }
  }
  
  /**
   * Processes health metric recorded events
   */
  private processHealthMetricRecorded(event: EventPayload): void {
    // Award points for recording health metrics
    const points = Math.floor(Math.random() * 5) + 1;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'health',
      sourceId: `metric-${Date.now()}`,
      reason: `Recorded ${event.data.metricType} metric`,
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
  }
  
  /**
   * Processes health goal achieved events
   */
  private processHealthGoalAchieved(event: EventPayload): void {
    // Award points for achieving health goals
    const points = Math.floor(Math.random() * 20) + 10;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'health',
      sourceId: `goal-${event.data.goalId}`,
      reason: `Achieved health goal: ${event.data.description}`,
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
    
    // Check if user should level up
    this.checkForLevelUp(event.userId, points);
  }
  
  /**
   * Processes appointment booked events
   */
  private processAppointmentBooked(event: EventPayload): void {
    // Award points for booking appointments
    const points = Math.floor(Math.random() * 8) + 3;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'care',
      sourceId: `appointment-${event.data.appointmentId}`,
      reason: 'Booked a medical appointment',
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
  }
  
  /**
   * Processes appointment completed events
   */
  private processAppointmentCompleted(event: EventPayload): void {
    // Award points for completing appointments
    const points = Math.floor(Math.random() * 15) + 10;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'care',
      sourceId: `appointment-completion-${event.data.appointmentId}`,
      reason: 'Completed a medical appointment',
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
    
    // Check if user should level up
    this.checkForLevelUp(event.userId, points);
  }
  
  /**
   * Processes medication taken events
   */
  private processMedicationTaken(event: EventPayload): void {
    // Award points for taking medications
    const points = Math.floor(Math.random() * 5) + 2;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'care',
      sourceId: `medication-${event.data.medicationId}`,
      reason: `Took medication: ${event.data.medicationName}`,
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
  }
  
  /**
   * Processes claim submitted events
   */
  private processClaimSubmitted(event: EventPayload): void {
    // Award points for submitting claims
    const points = Math.floor(Math.random() * 10) + 5;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'plan',
      sourceId: `claim-${event.data.claimId}`,
      reason: `Submitted a ${event.data.claimType} claim`,
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
  }
  
  /**
   * Processes claim processed events
   */
  private processClaimProcessed(event: EventPayload): void {
    if (event.data.status === 'approved') {
      // Award points for approved claims
      const points = Math.floor(Math.random() * 12) + 8;
      
      const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
        points,
        sourceType: 'plan',
        sourceId: `claim-processed-${event.data.claimId}`,
        reason: 'Claim approved',
        earnedAt: new Date().toISOString()
      });
      
      // Emit points earned event
      this.emitEvent(pointsEvent);
      
      // Notify all journey services
      this.notifyAllJourneyServices(pointsEvent);
      
      // Check if user should level up
      this.checkForLevelUp(event.userId, points);
    }
  }
  
  /**
   * Processes benefit utilized events
   */
  private processBenefitUtilized(event: EventPayload): void {
    // Award points for utilizing benefits
    const points = Math.floor(Math.random() * 15) + 5;
    
    const pointsEvent = this.createEventPayload(event.userId, EventType.GAMIFICATION_POINTS_EARNED, {
      points,
      sourceType: 'plan',
      sourceId: `benefit-${event.data.benefitId}`,
      reason: `Utilized ${event.data.benefitType} benefit`,
      earnedAt: new Date().toISOString()
    });
    
    // Emit points earned event
    this.emitEvent(pointsEvent);
    
    // Notify all journey services
    this.notifyAllJourneyServices(pointsEvent);
  }
  
  /**
   * Checks if a user should level up based on their points
   */
  private checkForLevelUp(userId: string, pointsEarned: number): void {
    const profile = this.getUserProfile(userId);
    if (!profile) return;
    
    const currentLevel = profile.level;
    const totalPoints = profile.points + pointsEarned;
    
    // Simple level calculation: level = 1 + Math.floor(totalPoints / 100)
    const newLevel = 1 + Math.floor(totalPoints / 100);
    
    if (newLevel > currentLevel) {
      // User has leveled up
      const levelUpEvent = this.createEventPayload(userId, EventType.GAMIFICATION_LEVEL_UP, {
        previousLevel: currentLevel,
        newLevel,
        totalPoints,
        leveledUpAt: new Date().toISOString()
      });
      
      // Emit level up event
      this.emitEvent(levelUpEvent);
      
      // Notify all journey services
      this.notifyAllJourneyServices(levelUpEvent);
      
      console.log(`[gamification] User ${userId} leveled up from ${currentLevel} to ${newLevel}!`);
    }
  }
  
  /**
   * Notifies all journey services about an event
   */
  private notifyAllJourneyServices(event: EventPayload): void {
    // Notify health service
    this.healthService.handleEvent(event);
    
    // Notify care service
    this.careService.handleEvent(event);
    
    // Notify plan service
    this.planService.handleEvent(event);
  }
  
  /**
   * Handles journey-specific events
   */
  protected handleJourneySpecificEvent(event: EventPayload): void {
    // Handle gamification-specific events
    switch (event.type) {
      case EventType.GAMIFICATION_POINTS_EARNED:
        console.log(`[gamification] User ${event.userId} earned ${event.data.points} points for: ${event.data.reason}`);
        break;
        
      case EventType.GAMIFICATION_ACHIEVEMENT_UNLOCKED:
        console.log(`[gamification] User ${event.userId} unlocked achievement: ${event.data.title || event.data.achievementType}`);
        break;
        
      case EventType.GAMIFICATION_LEVEL_UP:
        console.log(`[gamification] User ${event.userId} leveled up from ${event.data.previousLevel} to ${event.data.newLevel}!`);
        break;
    }
  }
}

/**
 * Creates a test environment with all mock journey services
 */
export function createMockJourneyEnvironment() {
  // Create journey services
  const healthService = new MockHealthJourneyService();
  const careService = new MockCareJourneyService();
  const planService = new MockPlanJourneyService();
  
  // Create gamification engine service
  const gamificationService = new MockGamificationEngineService(
    healthService,
    careService,
    planService
  );
  
  return {
    healthService,
    careService,
    planService,
    gamificationService
  };
}

/**
 * Example usage:
 * 
 * const { healthService, careService, planService, gamificationService } = createMockJourneyEnvironment();
 * 
 * // Create a user profile
 * const userId = 'user-123';
 * healthService.createUserProfile(userId, 'Test User', 'test@example.com');
 * careService.createUserProfile(userId, 'Test User', 'test@example.com');
 * planService.createUserProfile(userId, 'Test User', 'test@example.com');
 * 
 * // Record a health metric
 * healthService.recordHealthMetric(userId, {
 *   metricType: HealthMetricType.HEART_RATE,
 *   value: 75,
 *   unit: 'bpm'
 * });
 * 
 * // Book an appointment
 * careService.bookAppointment(userId, {
 *   specialtyType: 'Cardiologia',
 *   appointmentType: 'in_person'
 * });
 * 
 * // Submit a claim
 * planService.submitClaim(userId, {
 *   claimType: 'medical',
 *   amount: 250
 * });
 */