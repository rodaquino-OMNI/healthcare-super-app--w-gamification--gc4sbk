/**
 * @file mock-journey-services.ts
 * @description Provides mock implementations for journey-specific services (Health, Care, Plan) 
 * that produce and consume events. This comprehensive mock allows testing of cross-journey event 
 * flows and gamification integration without requiring the actual microservices.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  Events,
  Achievements,
  Profiles,
} from '@austa/interfaces/gamification';
import {
  GoalType,
  GoalStatus,
  GoalPeriod,
  MetricType,
  MetricSource,
  DeviceType,
  ConnectionStatus,
} from '@austa/interfaces/journey/health';
import {
  AppointmentType,
  AppointmentStatus,
} from '@austa/interfaces/journey/care';
import {
  ClaimStatus,
  ClaimType,
} from '@austa/interfaces/journey/plan';

/**
 * Base interface for all mock journey services
 */
interface MockJourneyService {
  /**
   * Produces an event for the gamification engine
   */
  produceEvent(eventType: Events.EventType, userId: string, data: Record<string, any>): Promise<Events.EventProcessingResult>;
  
  /**
   * Consumes an event from the gamification engine
   */
  consumeEvent(event: Events.GamificationEvent): Promise<void>;
  
  /**
   * Subscribes to events from the mock event bus
   */
  subscribeToEvents(): void;
  
  /**
   * Gets the current state of the mock service
   */
  getState(): Record<string, any>;
}

/**
 * Mock event bus for simulating Kafka event streaming between services
 */
export class MockEventBus extends EventEmitter {
  private static instance: MockEventBus;
  
  private constructor() {
    super();
  }
  
  /**
   * Gets the singleton instance of the mock event bus
   */
  public static getInstance(): MockEventBus {
    if (!MockEventBus.instance) {
      MockEventBus.instance = new MockEventBus();
    }
    return MockEventBus.instance;
  }
  
  /**
   * Publishes an event to the mock event bus
   */
  public publishEvent(event: Events.GamificationEvent): void {
    this.emit('event', event);
    this.emit(`event:${event.type}`, event);
    this.emit(`event:${event.journey}`, event);
    this.emit(`event:${event.userId}`, event);
  }
  
  /**
   * Subscribes to all events on the mock event bus
   */
  public subscribeToAllEvents(callback: (event: Events.GamificationEvent) => void): void {
    this.on('event', callback);
  }
  
  /**
   * Subscribes to events of a specific type
   */
  public subscribeToEventType(eventType: Events.EventType, callback: (event: Events.GamificationEvent) => void): void {
    this.on(`event:${eventType}`, callback);
  }
  
  /**
   * Subscribes to events from a specific journey
   */
  public subscribeToJourney(journey: Events.EventJourney, callback: (event: Events.GamificationEvent) => void): void {
    this.on(`event:${journey}`, callback);
  }
  
  /**
   * Subscribes to events for a specific user
   */
  public subscribeToUser(userId: string, callback: (event: Events.GamificationEvent) => void): void {
    this.on(`event:${userId}`, callback);
  }
  
  /**
   * Clears all event listeners
   */
  public clearAllListeners(): void {
    this.removeAllListeners();
  }
}

/**
 * Mock gamification engine for testing event processing
 */
export class MockGamificationEngine {
  private static instance: MockGamificationEngine;
  private eventBus: MockEventBus;
  private userProfiles: Map<string, Profiles.IGameProfile> = new Map();
  private achievements: Map<string, Achievements.Achievement> = new Map();
  
  private constructor() {
    this.eventBus = MockEventBus.getInstance();
    this.initializeAchievements();
    this.subscribeToEvents();
  }
  
  /**
   * Gets the singleton instance of the mock gamification engine
   */
  public static getInstance(): MockGamificationEngine {
    if (!MockGamificationEngine.instance) {
      MockGamificationEngine.instance = new MockGamificationEngine();
    }
    return MockGamificationEngine.instance;
  }
  
  /**
   * Initializes predefined achievements
   */
  private initializeAchievements(): void {
    // Health journey achievements
    this.achievements.set('health-check-streak', {
      id: 'health-check-streak',
      name: 'health-check-streak',
      title: 'Monitor de Saúde',
      description: 'Registre suas métricas de saúde por dias consecutivos',
      journey: 'health',
      icon: 'heart-pulse',
      levels: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    this.achievements.set('steps-goal', {
      id: 'steps-goal',
      name: 'steps-goal',
      title: 'Caminhante Dedicado',
      description: 'Atinja sua meta diária de passos',
      journey: 'health',
      icon: 'footprints',
      levels: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Care journey achievements
    this.achievements.set('appointment-keeper', {
      id: 'appointment-keeper',
      name: 'appointment-keeper',
      title: 'Compromisso com a Saúde',
      description: 'Compareça às consultas agendadas',
      journey: 'care',
      icon: 'calendar-check',
      levels: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    this.achievements.set('medication-adherence', {
      id: 'medication-adherence',
      name: 'medication-adherence',
      title: 'Aderência ao Tratamento',
      description: 'Tome seus medicamentos conforme prescrito',
      journey: 'care',
      icon: 'pill',
      levels: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Plan journey achievements
    this.achievements.set('claim-master', {
      id: 'claim-master',
      name: 'claim-master',
      title: 'Mestre em Reembolsos',
      description: 'Submeta solicitações de reembolso completas',
      journey: 'plan',
      icon: 'receipt',
      levels: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  /**
   * Subscribes to events from the mock event bus
   */
  private subscribeToEvents(): void {
    this.eventBus.subscribeToAllEvents(this.processEvent.bind(this));
  }
  
  /**
   * Processes an event from the mock event bus
   */
  private async processEvent(event: Events.GamificationEvent): Promise<Events.EventProcessingResult> {
    console.log(`[MockGamificationEngine] Processing event: ${event.type} for user ${event.userId}`);
    
    // Initialize user profile if it doesn't exist
    if (!this.userProfiles.has(event.userId)) {
      this.userProfiles.set(event.userId, this.createInitialProfile(event.userId));
    }
    
    const profile = this.userProfiles.get(event.userId)!;
    let xpEarned = 0;
    const achievementsUnlocked: Array<{ achievementId: string; achievementTitle: string; xpEarned: number }> = [];
    
    // Process event based on type
    switch (event.type) {
      // Health journey events
      case Events.EventType.HEALTH_METRIC_RECORDED:
        xpEarned = 5;
        profile.metrics.healthMetricsRecorded += 1;
        
        // Check for health-check-streak achievement
        if (profile.metrics.healthMetricsRecorded % 5 === 0) {
          const achievement = this.achievements.get('health-check-streak')!;
          achievementsUnlocked.push({
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            xpEarned: 20,
          });
          xpEarned += 20;
        }
        break;
        
      case Events.EventType.HEALTH_GOAL_ACHIEVED:
        xpEarned = 10;
        profile.metrics.healthGoalsAchieved += 1;
        
        // Check for steps-goal achievement if it's a steps goal
        if ((event.payload as Events.HealthGoalAchievedPayload).goalType === GoalType.STEPS) {
          const achievement = this.achievements.get('steps-goal')!;
          achievementsUnlocked.push({
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            xpEarned: 15,
          });
          xpEarned += 15;
        }
        break;
        
      // Care journey events
      case Events.EventType.APPOINTMENT_ATTENDED:
        xpEarned = 15;
        profile.metrics.appointmentsAttended += 1;
        
        // Check for appointment-keeper achievement
        if (profile.metrics.appointmentsAttended % 3 === 0) {
          const achievement = this.achievements.get('appointment-keeper')!;
          achievementsUnlocked.push({
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            xpEarned: 25,
          });
          xpEarned += 25;
        }
        break;
        
      case Events.EventType.MEDICATION_TAKEN:
        xpEarned = 5;
        profile.metrics.medicationsTaken += 1;
        
        // Check for medication-adherence achievement
        if (profile.metrics.medicationsTaken % 7 === 0) {
          const achievement = this.achievements.get('medication-adherence')!;
          achievementsUnlocked.push({
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            xpEarned: 20,
          });
          xpEarned += 20;
        }
        break;
        
      // Plan journey events
      case Events.EventType.CLAIM_SUBMITTED:
        xpEarned = 10;
        profile.metrics.claimsSubmitted += 1;
        
        // Check for claim-master achievement
        if (profile.metrics.claimsSubmitted % 3 === 0) {
          const achievement = this.achievements.get('claim-master')!;
          achievementsUnlocked.push({
            achievementId: achievement.id,
            achievementTitle: achievement.title,
            xpEarned: 30,
          });
          xpEarned += 30;
        }
        break;
        
      default:
        xpEarned = 1; // Default XP for unhandled events
    }
    
    // Update user profile
    profile.xp += xpEarned;
    
    // Check for level up
    const oldLevel = profile.level;
    profile.level = Math.floor(profile.xp / 100) + 1;
    const levelUp = profile.level > oldLevel ? {
      newLevel: profile.level,
      previousLevel: oldLevel,
    } : undefined;
    
    // Publish achievement events if any were unlocked
    for (const achievement of achievementsUnlocked) {
      const achievementEvent: Events.GamificationEvent = {
        eventId: uuidv4(),
        type: Events.EventType.ACHIEVEMENT_UNLOCKED,
        userId: event.userId,
        journey: Events.EventJourney.CROSS_JOURNEY,
        payload: {
          timestamp: new Date().toISOString(),
          achievementId: achievement.achievementId,
          achievementTitle: achievement.achievementTitle,
          achievementDescription: this.achievements.get(achievement.achievementId)?.description || '',
          xpEarned: achievement.xpEarned,
          relatedJourney: event.journey,
        },
        version: { major: 1, minor: 0, patch: 0 },
        createdAt: new Date().toISOString(),
        source: 'gamification-engine',
        correlationId: event.correlationId,
      };
      
      this.eventBus.publishEvent(achievementEvent);
    }
    
    // Publish level up event if user leveled up
    if (levelUp) {
      const levelUpEvent: Events.GamificationEvent = {
        eventId: uuidv4(),
        type: Events.EventType.LEVEL_UP,
        userId: event.userId,
        journey: Events.EventJourney.CROSS_JOURNEY,
        payload: {
          timestamp: new Date().toISOString(),
          newLevel: levelUp.newLevel,
          previousLevel: levelUp.previousLevel,
          totalXp: profile.xp,
        },
        version: { major: 1, minor: 0, patch: 0 },
        createdAt: new Date().toISOString(),
        source: 'gamification-engine',
        correlationId: event.correlationId,
      };
      
      this.eventBus.publishEvent(levelUpEvent);
    }
    
    // Update the user profile in the map
    this.userProfiles.set(event.userId, profile);
    
    // Return the event processing result
    return {
      success: true,
      results: {
        xpEarned,
        achievementsUnlocked,
        levelUp,
      },
    };
  }
  
  /**
   * Creates an initial game profile for a user
   */
  private createInitialProfile(userId: string): Profiles.IGameProfile {
    return {
      id: uuidv4(),
      userId,
      level: 1,
      xp: 0,
      streaks: [],
      badges: [],
      settings: {
        notificationsEnabled: true,
        shareAchievements: true,
        showOnLeaderboard: true,
      },
      metrics: {
        healthMetricsRecorded: 0,
        healthGoalsAchieved: 0,
        appointmentsAttended: 0,
        medicationsTaken: 0,
        claimsSubmitted: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Processes a gamification event and returns the result
   */
  public async processGamificationEvent(dto: Events.ProcessGamificationEventDto): Promise<Events.EventProcessingResult> {
    const event: Events.GamificationEvent = {
      eventId: uuidv4(),
      type: dto.type as Events.EventType,
      userId: dto.userId,
      journey: (dto.journey as Events.EventJourney) || this.getJourneyFromEventType(dto.type as Events.EventType),
      payload: {
        ...dto.data,
        timestamp: new Date().toISOString(),
      },
      version: dto.version || { major: 1, minor: 0, patch: 0 },
      createdAt: new Date().toISOString(),
      source: dto.source || 'test',
      correlationId: dto.correlationId || uuidv4(),
    };
    
    this.eventBus.publishEvent(event);
    return this.processEvent(event);
  }
  
  /**
   * Gets the journey from an event type
   */
  private getJourneyFromEventType(eventType: Events.EventType): Events.EventJourney {
    if (eventType.startsWith('HEALTH_')) {
      return Events.EventJourney.HEALTH;
    } else if (eventType.startsWith('APPOINTMENT_') || eventType.startsWith('MEDICATION_') || eventType.startsWith('TELEMEDICINE_') || eventType.startsWith('TREATMENT_')) {
      return Events.EventJourney.CARE;
    } else if (eventType.startsWith('CLAIM_') || eventType.startsWith('BENEFIT_') || eventType.startsWith('PLAN_')) {
      return Events.EventJourney.PLAN;
    } else {
      return Events.EventJourney.CROSS_JOURNEY;
    }
  }
  
  /**
   * Gets a user's game profile
   */
  public getUserProfile(userId: string): Profiles.IGameProfile | undefined {
    return this.userProfiles.get(userId);
  }
  
  /**
   * Gets all achievements
   */
  public getAchievements(): Achievements.Achievement[] {
    return Array.from(this.achievements.values());
  }
  
  /**
   * Resets the mock gamification engine state
   */
  public reset(): void {
    this.userProfiles.clear();
    this.achievements.clear();
    this.initializeAchievements();
  }
}

/**
 * Mock Health Journey Service for testing health-related events
 */
export class MockHealthJourneyService implements MockJourneyService {
  private eventBus: MockEventBus;
  private gamificationEngine: MockGamificationEngine;
  private userHealthData: Map<string, {
    metrics: Map<string, any[]>;
    goals: Map<string, any>;
    devices: Map<string, any>;
  }> = new Map();
  
  constructor() {
    this.eventBus = MockEventBus.getInstance();
    this.gamificationEngine = MockGamificationEngine.getInstance();
    this.subscribeToEvents();
  }
  
  /**
   * Subscribes to events from the mock event bus
   */
  public subscribeToEvents(): void {
    this.eventBus.subscribeToJourney(Events.EventJourney.HEALTH, this.consumeEvent.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.LEVEL_UP, this.handleLevelUp.bind(this));
  }
  
  /**
   * Produces a health journey event
   */
  public async produceEvent(eventType: Events.EventType, userId: string, data: Record<string, any>): Promise<Events.EventProcessingResult> {
    // Initialize user health data if it doesn't exist
    if (!this.userHealthData.has(userId)) {
      this.userHealthData.set(userId, {
        metrics: new Map(),
        goals: new Map(),
        devices: new Map(),
      });
    }
    
    // Update user health data based on event type
    const userHealth = this.userHealthData.get(userId)!;
    
    switch (eventType) {
      case Events.EventType.HEALTH_METRIC_RECORDED:
        const metricType = data.metricType || MetricType.STEPS;
        if (!userHealth.metrics.has(metricType)) {
          userHealth.metrics.set(metricType, []);
        }
        
        const metric = {
          id: uuidv4(),
          userId,
          type: metricType,
          value: data.value,
          unit: data.unit || 'steps',
          timestamp: new Date(),
          source: data.source || MetricSource.MANUAL_ENTRY,
          isAbnormal: data.isWithinHealthyRange === false,
        };
        
        userHealth.metrics.get(metricType)!.push(metric);
        break;
        
      case Events.EventType.HEALTH_GOAL_CREATED:
        const goal = {
          id: data.goalId || uuidv4(),
          recordId: userId,
          type: data.goalType || GoalType.STEPS,
          title: data.title || 'Daily Steps Goal',
          description: data.description,
          targetValue: data.targetValue,
          unit: data.unit || 'steps',
          currentValue: 0,
          status: GoalStatus.ACTIVE,
          period: data.period || GoalPeriod.DAILY,
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        userHealth.goals.set(goal.id, goal);
        break;
        
      case Events.EventType.HEALTH_GOAL_ACHIEVED:
        const goalId = data.goalId;
        if (userHealth.goals.has(goalId)) {
          const existingGoal = userHealth.goals.get(goalId)!;
          existingGoal.currentValue = existingGoal.targetValue;
          existingGoal.status = GoalStatus.COMPLETED;
          existingGoal.completedDate = new Date();
          existingGoal.updatedAt = new Date();
          userHealth.goals.set(goalId, existingGoal);
        }
        break;
        
      case Events.EventType.DEVICE_CONNECTED:
        const device = {
          id: data.deviceId || uuidv4(),
          recordId: userId,
          deviceType: data.deviceType || DeviceType.SMARTWATCH,
          deviceId: data.deviceId || `device-${uuidv4()}`,
          status: ConnectionStatus.CONNECTED,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        userHealth.devices.set(device.id, device);
        break;
    }
    
    // Update user health data
    this.userHealthData.set(userId, userHealth);
    
    // Process the event through the gamification engine
    return this.gamificationEngine.processGamificationEvent({
      type: eventType,
      userId,
      data,
      journey: Events.EventJourney.HEALTH,
    });
  }
  
  /**
   * Consumes an event from the mock event bus
   */
  public async consumeEvent(event: Events.GamificationEvent): Promise<void> {
    console.log(`[MockHealthJourneyService] Consuming event: ${event.type} for user ${event.userId}`);
    
    // Handle specific events that affect the health journey
    switch (event.type) {
      case Events.EventType.APPOINTMENT_ATTENDED:
        // For example, after an appointment, we might want to create a health goal
        if (Math.random() > 0.7) { // 30% chance to create a goal after appointment
          await this.produceEvent(Events.EventType.HEALTH_GOAL_CREATED, event.userId, {
            goalType: GoalType.STEPS,
            title: 'Increase Daily Steps',
            targetValue: 10000,
            unit: 'steps',
            period: GoalPeriod.DAILY,
          });
        }
        break;
    }
  }
  
  /**
   * Handles achievement unlocked events
   */
  private async handleAchievementUnlocked(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.AchievementUnlockedPayload;
    
    // Only handle health-related achievements
    if (payload.relatedJourney === Events.EventJourney.HEALTH) {
      console.log(`[MockHealthJourneyService] User ${event.userId} unlocked achievement: ${payload.achievementTitle}`);
      
      // Could trigger special actions in the health journey based on achievements
    }
  }
  
  /**
   * Handles level up events
   */
  private async handleLevelUp(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.LevelUpPayload;
    console.log(`[MockHealthJourneyService] User ${event.userId} leveled up to ${payload.newLevel}`);
    
    // Could unlock special health features based on level
  }
  
  /**
   * Records a health metric for a user
   */
  public async recordHealthMetric(userId: string, metricType: MetricType, value: number, unit: string, source: MetricSource = MetricSource.MANUAL_ENTRY): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.HEALTH_METRIC_RECORDED, userId, {
      metricType,
      value,
      unit,
      source,
      isWithinHealthyRange: this.isMetricWithinHealthyRange(metricType, value),
    });
  }
  
  /**
   * Creates a health goal for a user
   */
  public async createHealthGoal(userId: string, goalType: GoalType, targetValue: number, unit: string, period: GoalPeriod = GoalPeriod.DAILY): Promise<Events.EventProcessingResult> {
    const goalId = uuidv4();
    return this.produceEvent(Events.EventType.HEALTH_GOAL_CREATED, userId, {
      goalId,
      goalType,
      targetValue,
      unit,
      period,
      title: `${goalType.charAt(0).toUpperCase() + goalType.slice(1)} Goal`,
    });
  }
  
  /**
   * Achieves a health goal for a user
   */
  public async achieveHealthGoal(userId: string, goalId: string, goalType: GoalType): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.HEALTH_GOAL_ACHIEVED, userId, {
      goalId,
      goalType,
      completionPercentage: 100,
      isFirstTimeAchievement: true,
    });
  }
  
  /**
   * Connects a device for a user
   */
  public async connectDevice(userId: string, deviceType: DeviceType): Promise<Events.EventProcessingResult> {
    const deviceId = uuidv4();
    return this.produceEvent(Events.EventType.DEVICE_CONNECTED, userId, {
      deviceId,
      deviceType,
      manufacturer: 'Mock Device Manufacturer',
    });
  }
  
  /**
   * Checks if a metric is within the healthy range
   */
  private isMetricWithinHealthyRange(metricType: MetricType, value: number): boolean {
    switch (metricType) {
      case MetricType.HEART_RATE:
        return value >= 60 && value <= 100;
      case MetricType.BLOOD_GLUCOSE:
        return value >= 70 && value <= 100;
      case MetricType.STEPS:
        return value >= 5000;
      case MetricType.SLEEP:
        return value >= 7 && value <= 9;
      default:
        return true;
    }
  }
  
  /**
   * Gets the current state of the mock health journey service
   */
  public getState(): Record<string, any> {
    const state: Record<string, any> = {};
    
    this.userHealthData.forEach((userData, userId) => {
      state[userId] = {
        metrics: {},
        goals: {},
        devices: {},
      };
      
      userData.metrics.forEach((metrics, metricType) => {
        state[userId].metrics[metricType] = metrics;
      });
      
      userData.goals.forEach((goal, goalId) => {
        state[userId].goals[goalId] = goal;
      });
      
      userData.devices.forEach((device, deviceId) => {
        state[userId].devices[deviceId] = device;
      });
    });
    
    return state;
  }
}

/**
 * Mock Care Journey Service for testing care-related events
 */
export class MockCareJourneyService implements MockJourneyService {
  private eventBus: MockEventBus;
  private gamificationEngine: MockGamificationEngine;
  private userCareData: Map<string, {
    appointments: Map<string, any>;
    medications: Map<string, any>;
    telemedicineSessions: Map<string, any>;
    treatmentPlans: Map<string, any>;
  }> = new Map();
  
  constructor() {
    this.eventBus = MockEventBus.getInstance();
    this.gamificationEngine = MockGamificationEngine.getInstance();
    this.subscribeToEvents();
  }
  
  /**
   * Subscribes to events from the mock event bus
   */
  public subscribeToEvents(): void {
    this.eventBus.subscribeToJourney(Events.EventJourney.CARE, this.consumeEvent.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.LEVEL_UP, this.handleLevelUp.bind(this));
  }
  
  /**
   * Produces a care journey event
   */
  public async produceEvent(eventType: Events.EventType, userId: string, data: Record<string, any>): Promise<Events.EventProcessingResult> {
    // Initialize user care data if it doesn't exist
    if (!this.userCareData.has(userId)) {
      this.userCareData.set(userId, {
        appointments: new Map(),
        medications: new Map(),
        telemedicineSessions: new Map(),
        treatmentPlans: new Map(),
      });
    }
    
    // Update user care data based on event type
    const userCare = this.userCareData.get(userId)!;
    
    switch (eventType) {
      case Events.EventType.APPOINTMENT_BOOKED:
        const appointment = {
          id: data.appointmentId || uuidv4(),
          userId,
          providerId: data.providerId || uuidv4(),
          dateTime: new Date(data.dateTime || new Date().toISOString()),
          type: data.appointmentType || AppointmentType.IN_PERSON,
          status: AppointmentStatus.SCHEDULED,
          notes: data.notes || '',
        };
        
        userCare.appointments.set(appointment.id, appointment);
        break;
        
      case Events.EventType.APPOINTMENT_ATTENDED:
        const appointmentId = data.appointmentId;
        if (userCare.appointments.has(appointmentId)) {
          const existingAppointment = userCare.appointments.get(appointmentId)!;
          existingAppointment.status = AppointmentStatus.COMPLETED;
          userCare.appointments.set(appointmentId, existingAppointment);
        }
        break;
        
      case Events.EventType.MEDICATION_ADDED:
        const medication = {
          id: data.medicationId || uuidv4(),
          userId,
          name: data.medicationName,
          dosage: data.dosage || 1,
          frequency: data.frequency || 'daily',
          startDate: new Date(),
          reminderEnabled: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        userCare.medications.set(medication.id, medication);
        break;
        
      case Events.EventType.MEDICATION_TAKEN:
        const medicationId = data.medicationId;
        if (userCare.medications.has(medicationId)) {
          // Record that medication was taken
          const medication = userCare.medications.get(medicationId)!;
          if (!medication.takenHistory) {
            medication.takenHistory = [];
          }
          medication.takenHistory.push({
            timestamp: new Date(),
            takenOnTime: data.takenOnTime !== false,
          });
          userCare.medications.set(medicationId, medication);
        }
        break;
        
      case Events.EventType.TELEMEDICINE_SESSION_STARTED:
        const session = {
          id: data.sessionId || uuidv4(),
          userId,
          providerId: data.providerId || uuidv4(),
          startTime: new Date(),
          status: 'in-progress',
        };
        
        userCare.telemedicineSessions.set(session.id, session);
        break;
        
      case Events.EventType.TELEMEDICINE_SESSION_COMPLETED:
        const sessionId = data.sessionId;
        if (userCare.telemedicineSessions.has(sessionId)) {
          const existingSession = userCare.telemedicineSessions.get(sessionId)!;
          existingSession.status = 'completed';
          existingSession.endTime = new Date();
          existingSession.durationMinutes = data.durationMinutes || 15;
          userCare.telemedicineSessions.set(sessionId, existingSession);
        }
        break;
    }
    
    // Update user care data
    this.userCareData.set(userId, userCare);
    
    // Process the event through the gamification engine
    return this.gamificationEngine.processGamificationEvent({
      type: eventType,
      userId,
      data,
      journey: Events.EventJourney.CARE,
    });
  }
  
  /**
   * Consumes an event from the mock event bus
   */
  public async consumeEvent(event: Events.GamificationEvent): Promise<void> {
    console.log(`[MockCareJourneyService] Consuming event: ${event.type} for user ${event.userId}`);
    
    // Handle specific events that affect the care journey
    switch (event.type) {
      case Events.EventType.HEALTH_METRIC_RECORDED:
        const payload = event.payload as Events.HealthMetricRecordedPayload;
        
        // If abnormal health metric is detected, potentially schedule an appointment
        if (payload.isWithinHealthyRange === false && Math.random() > 0.7) {
          const appointmentId = uuidv4();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 3); // 3 days in the future
          
          await this.produceEvent(Events.EventType.APPOINTMENT_BOOKED, event.userId, {
            appointmentId,
            appointmentType: AppointmentType.IN_PERSON,
            providerId: uuidv4(),
            dateTime: futureDate.toISOString(),
            notes: `Follow-up for abnormal ${payload.metricType} reading of ${payload.value} ${payload.unit}`,
          });
        }
        break;
    }
  }
  
  /**
   * Handles achievement unlocked events
   */
  private async handleAchievementUnlocked(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.AchievementUnlockedPayload;
    
    // Only handle care-related achievements
    if (payload.relatedJourney === Events.EventJourney.CARE) {
      console.log(`[MockCareJourneyService] User ${event.userId} unlocked achievement: ${payload.achievementTitle}`);
      
      // Could trigger special actions in the care journey based on achievements
    }
  }
  
  /**
   * Handles level up events
   */
  private async handleLevelUp(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.LevelUpPayload;
    console.log(`[MockCareJourneyService] User ${event.userId} leveled up to ${payload.newLevel}`);
    
    // Could unlock special care features based on level
  }
  
  /**
   * Books an appointment for a user
   */
  public async bookAppointment(userId: string, appointmentType: AppointmentType, dateTime: string, providerId?: string): Promise<Events.EventProcessingResult> {
    const appointmentId = uuidv4();
    return this.produceEvent(Events.EventType.APPOINTMENT_BOOKED, userId, {
      appointmentId,
      appointmentType,
      providerId: providerId || uuidv4(),
      dateTime,
    });
  }
  
  /**
   * Marks an appointment as attended
   */
  public async attendAppointment(userId: string, appointmentId: string): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.APPOINTMENT_ATTENDED, userId, {
      appointmentId,
      isFirstAppointment: false,
    });
  }
  
  /**
   * Adds a medication for a user
   */
  public async addMedication(userId: string, medicationName: string, dosage: number, frequency: string): Promise<Events.EventProcessingResult> {
    const medicationId = uuidv4();
    return this.produceEvent(Events.EventType.MEDICATION_ADDED, userId, {
      medicationId,
      medicationName,
      dosage,
      frequency,
    });
  }
  
  /**
   * Records a medication as taken
   */
  public async takeMedication(userId: string, medicationId: string, takenOnTime: boolean = true): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.MEDICATION_TAKEN, userId, {
      medicationId,
      takenOnTime,
    });
  }
  
  /**
   * Starts a telemedicine session
   */
  public async startTelemedicineSession(userId: string, providerId?: string): Promise<Events.EventProcessingResult> {
    const sessionId = uuidv4();
    return this.produceEvent(Events.EventType.TELEMEDICINE_SESSION_STARTED, userId, {
      sessionId,
      providerId: providerId || uuidv4(),
      isFirstSession: false,
    });
  }
  
  /**
   * Completes a telemedicine session
   */
  public async completeTelemedicineSession(userId: string, sessionId: string, durationMinutes: number = 15): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.TELEMEDICINE_SESSION_COMPLETED, userId, {
      sessionId,
      durationMinutes,
    });
  }
  
  /**
   * Gets the current state of the mock care journey service
   */
  public getState(): Record<string, any> {
    const state: Record<string, any> = {};
    
    this.userCareData.forEach((userData, userId) => {
      state[userId] = {
        appointments: {},
        medications: {},
        telemedicineSessions: {},
        treatmentPlans: {},
      };
      
      userData.appointments.forEach((appointment, appointmentId) => {
        state[userId].appointments[appointmentId] = appointment;
      });
      
      userData.medications.forEach((medication, medicationId) => {
        state[userId].medications[medicationId] = medication;
      });
      
      userData.telemedicineSessions.forEach((session, sessionId) => {
        state[userId].telemedicineSessions[sessionId] = session;
      });
      
      userData.treatmentPlans.forEach((plan, planId) => {
        state[userId].treatmentPlans[planId] = plan;
      });
    });
    
    return state;
  }
}

/**
 * Mock Plan Journey Service for testing plan-related events
 */
export class MockPlanJourneyService implements MockJourneyService {
  private eventBus: MockEventBus;
  private gamificationEngine: MockGamificationEngine;
  private userPlanData: Map<string, {
    claims: Map<string, any>;
    benefits: Map<string, any>;
    plans: Map<string, any>;
  }> = new Map();
  
  constructor() {
    this.eventBus = MockEventBus.getInstance();
    this.gamificationEngine = MockGamificationEngine.getInstance();
    this.subscribeToEvents();
  }
  
  /**
   * Subscribes to events from the mock event bus
   */
  public subscribeToEvents(): void {
    this.eventBus.subscribeToJourney(Events.EventJourney.PLAN, this.consumeEvent.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.ACHIEVEMENT_UNLOCKED, this.handleAchievementUnlocked.bind(this));
    this.eventBus.subscribeToEventType(Events.EventType.LEVEL_UP, this.handleLevelUp.bind(this));
  }
  
  /**
   * Produces a plan journey event
   */
  public async produceEvent(eventType: Events.EventType, userId: string, data: Record<string, any>): Promise<Events.EventProcessingResult> {
    // Initialize user plan data if it doesn't exist
    if (!this.userPlanData.has(userId)) {
      this.userPlanData.set(userId, {
        claims: new Map(),
        benefits: new Map(),
        plans: new Map(),
      });
    }
    
    // Update user plan data based on event type
    const userPlan = this.userPlanData.get(userId)!;
    
    switch (eventType) {
      case Events.EventType.CLAIM_SUBMITTED:
        const claim = {
          id: data.claimId || uuidv4(),
          userId,
          planId: data.planId || uuidv4(),
          type: data.claimType || 'medical',
          amount: data.amount || 100,
          status: ClaimStatus.SUBMITTED,
          submittedAt: new Date(),
          processedAt: new Date(),
          documents: data.documents || [],
        };
        
        userPlan.claims.set(claim.id, claim);
        break;
        
      case Events.EventType.CLAIM_APPROVED:
        const claimId = data.claimId;
        if (userPlan.claims.has(claimId)) {
          const existingClaim = userPlan.claims.get(claimId)!;
          existingClaim.status = ClaimStatus.APPROVED;
          existingClaim.processedAt = new Date();
          userPlan.claims.set(claimId, existingClaim);
        }
        break;
        
      case Events.EventType.BENEFIT_UTILIZED:
        const benefit = {
          id: data.benefitId || uuidv4(),
          userId,
          type: data.benefitType || 'wellness',
          value: data.value || 50,
          utilizedAt: new Date(),
        };
        
        userPlan.benefits.set(benefit.id, benefit);
        break;
        
      case Events.EventType.PLAN_SELECTED:
        const plan = {
          id: data.planId || uuidv4(),
          userId,
          type: data.planType || 'PPO',
          isUpgrade: data.isUpgrade || false,
          selectedAt: new Date(),
        };
        
        userPlan.plans.set(plan.id, plan);
        break;
    }
    
    // Update user plan data
    this.userPlanData.set(userId, userPlan);
    
    // Process the event through the gamification engine
    return this.gamificationEngine.processGamificationEvent({
      type: eventType,
      userId,
      data,
      journey: Events.EventJourney.PLAN,
    });
  }
  
  /**
   * Consumes an event from the mock event bus
   */
  public async consumeEvent(event: Events.GamificationEvent): Promise<void> {
    console.log(`[MockPlanJourneyService] Consuming event: ${event.type} for user ${event.userId}`);
    
    // Handle specific events that affect the plan journey
    switch (event.type) {
      case Events.EventType.APPOINTMENT_ATTENDED:
        // After an appointment, potentially submit a claim
        if (Math.random() > 0.5) { // 50% chance to submit a claim after appointment
          const claimId = uuidv4();
          await this.produceEvent(Events.EventType.CLAIM_SUBMITTED, event.userId, {
            claimId,
            claimType: 'medical_visit',
            amount: 150 + Math.floor(Math.random() * 200), // Random amount between 150-350
            documents: [{ id: uuidv4(), type: 'receipt', url: 'https://example.com/receipt.pdf' }],
          });
        }
        break;
    }
  }
  
  /**
   * Handles achievement unlocked events
   */
  private async handleAchievementUnlocked(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.AchievementUnlockedPayload;
    
    // Only handle plan-related achievements
    if (payload.relatedJourney === Events.EventJourney.PLAN) {
      console.log(`[MockPlanJourneyService] User ${event.userId} unlocked achievement: ${payload.achievementTitle}`);
      
      // Could trigger special actions in the plan journey based on achievements
    }
  }
  
  /**
   * Handles level up events
   */
  private async handleLevelUp(event: Events.GamificationEvent): Promise<void> {
    const payload = event.payload as Events.LevelUpPayload;
    console.log(`[MockPlanJourneyService] User ${event.userId} leveled up to ${payload.newLevel}`);
    
    // Could unlock special plan features based on level
  }
  
  /**
   * Submits a claim for a user
   */
  public async submitClaim(userId: string, claimType: ClaimType, amount: number, documents: any[] = []): Promise<Events.EventProcessingResult> {
    const claimId = uuidv4();
    return this.produceEvent(Events.EventType.CLAIM_SUBMITTED, userId, {
      claimId,
      claimType,
      amount,
      documents,
    });
  }
  
  /**
   * Approves a claim
   */
  public async approveClaim(userId: string, claimId: string): Promise<Events.EventProcessingResult> {
    return this.produceEvent(Events.EventType.CLAIM_APPROVED, userId, {
      claimId,
    });
  }
  
  /**
   * Utilizes a benefit for a user
   */
  public async utilizeBenefit(userId: string, benefitType: string, value: number): Promise<Events.EventProcessingResult> {
    const benefitId = uuidv4();
    return this.produceEvent(Events.EventType.BENEFIT_UTILIZED, userId, {
      benefitId,
      benefitType,
      value,
    });
  }
  
  /**
   * Selects a plan for a user
   */
  public async selectPlan(userId: string, planType: string, isUpgrade: boolean = false): Promise<Events.EventProcessingResult> {
    const planId = uuidv4();
    return this.produceEvent(Events.EventType.PLAN_SELECTED, userId, {
      planId,
      planType,
      isUpgrade,
    });
  }
  
  /**
   * Gets the current state of the mock plan journey service
   */
  public getState(): Record<string, any> {
    const state: Record<string, any> = {};
    
    this.userPlanData.forEach((userData, userId) => {
      state[userId] = {
        claims: {},
        benefits: {},
        plans: {},
      };
      
      userData.claims.forEach((claim, claimId) => {
        state[userId].claims[claimId] = claim;
      });
      
      userData.benefits.forEach((benefit, benefitId) => {
        state[userId].benefits[benefitId] = benefit;
      });
      
      userData.plans.forEach((plan, planId) => {
        state[userId].plans[planId] = plan;
      });
    });
    
    return state;
  }
}

/**
 * Creates a complete mock journey environment for testing
 */
export function createMockJourneyEnvironment() {
  const eventBus = MockEventBus.getInstance();
  const gamificationEngine = MockGamificationEngine.getInstance();
  const healthJourney = new MockHealthJourneyService();
  const careJourney = new MockCareJourneyService();
  const planJourney = new MockPlanJourneyService();
  
  return {
    eventBus,
    gamificationEngine,
    healthJourney,
    careJourney,
    planJourney,
    
    /**
     * Resets the entire mock environment
     */
    reset() {
      eventBus.clearAllListeners();
      gamificationEngine.reset();
      
      // Re-subscribe services to events
      healthJourney.subscribeToEvents();
      careJourney.subscribeToEvents();
      planJourney.subscribeToEvents();
    },
    
    /**
     * Simulates a complete user journey across all services
     */
    async simulateUserJourney(userId: string) {
      // Health journey actions
      await healthJourney.recordHealthMetric(userId, MetricType.STEPS, 8000, 'steps');
      await healthJourney.createHealthGoal(userId, GoalType.STEPS, 10000, 'steps');
      await healthJourney.connectDevice(userId, DeviceType.SMARTWATCH);
      
      // Care journey actions
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const appointmentResult = await careJourney.bookAppointment(userId, AppointmentType.IN_PERSON, futureDate.toISOString());
      const appointmentId = appointmentResult.results?.achievementsUnlocked?.[0]?.achievementId || '';
      
      const medicationResult = await careJourney.addMedication(userId, 'Test Medication', 500, 'daily');
      const medicationId = medicationResult.results?.achievementsUnlocked?.[0]?.achievementId || '';
      
      await careJourney.takeMedication(userId, medicationId);
      await careJourney.attendAppointment(userId, appointmentId);
      
      // Plan journey actions
      await planJourney.selectPlan(userId, 'PPO');
      await planJourney.submitClaim(userId, 'medical' as ClaimType, 250);
      await planJourney.utilizeBenefit(userId, 'wellness', 100);
      
      // Get user profile after all actions
      return gamificationEngine.getUserProfile(userId);
    }
  };
}