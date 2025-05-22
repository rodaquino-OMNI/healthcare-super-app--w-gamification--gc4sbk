/**
 * @file Care Journey Scenarios for Gamification Testing
 * @description Contains complex end-to-end test scenarios for the Care journey in the gamification system.
 * Provides fixtures that simulate users managing healthcare appointments, medication adherence, and
 * telemedicine sessions, triggering gamification events, and earning achievements.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';

// Import interfaces from @austa/interfaces
import {
  IAppointment,
  IMedication,
  AppointmentStatus,
  AppointmentType
} from '@austa/interfaces/journey/care';

// Import event interfaces
import {
  ICareEvent,
  CareEventType,
  ICareAppointmentBookedPayload,
  ICareAppointmentCompletedPayload,
  ICareMedicationAddedPayload,
  ICareMedicationTakenPayload,
  ICareMedicationAdherenceStreakPayload,
  ICareTelemedicineSessionCompletedPayload
} from '@austa/interfaces/journey/care/events';

// Import gamification interfaces
import {
  IAchievement,
  IUserAchievement,
  AchievementStatus
} from '@austa/interfaces/gamification';

// Import shared test utilities
import { createTestUser } from '../../common/user-fixtures';
import { createTestAchievement } from '../achievement-fixtures';

/**
 * Interface for Care Journey Scenario
 */
export interface ICareJourneyScenario {
  /** Unique identifier for the scenario */
  id: string;
  /** Descriptive name of the scenario */
  name: string;
  /** User associated with the scenario */
  userId: string;
  /** Events that occur in the scenario */
  events: ICareEvent[];
  /** Expected achievements to be unlocked */
  expectedAchievements?: IAchievement[];
  /** Expected user achievement status after events */
  expectedUserAchievements?: IUserAchievement[];
}

/**
 * Creates a basic appointment booking event
 * 
 * @param userId - The user ID
 * @param appointmentType - The type of appointment
 * @param daysInFuture - Days in the future for the appointment
 * @returns An appointment booking event
 */
export function createAppointmentBookedEvent(
  userId: string,
  appointmentType: AppointmentType = AppointmentType.IN_PERSON,
  daysInFuture: number = 7
): ICareEvent {
  const appointmentId = uuidv4();
  const providerId = uuidv4();
  const scheduledDate = addDays(new Date(), daysInFuture);
  
  const appointment: IAppointment = {
    id: appointmentId,
    userId,
    providerId,
    type: appointmentType,
    status: AppointmentStatus.SCHEDULED,
    scheduledDate: scheduledDate,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const payload: ICareAppointmentBookedPayload = {
    appointment,
    appointmentType,
    providerId,
    scheduledDate,
    isFirstAppointment: false
  };
  
  return {
    type: CareEventType.APPOINTMENT_BOOKED,
    userId,
    timestamp: new Date(),
    journey: 'care',
    data: payload
  };
}

/**
 * Creates an appointment completed event
 * 
 * @param userId - The user ID
 * @param appointmentType - The type of appointment
 * @param daysInPast - Days in the past when the appointment was completed
 * @returns An appointment completed event
 */
export function createAppointmentCompletedEvent(
  userId: string,
  appointmentType: AppointmentType = AppointmentType.IN_PERSON,
  daysInPast: number = 0
): ICareEvent {
  const appointmentId = uuidv4();
  const providerId = uuidv4();
  const completionDate = subDays(new Date(), daysInPast);
  
  const appointment: IAppointment = {
    id: appointmentId,
    userId,
    providerId,
    type: appointmentType,
    status: AppointmentStatus.COMPLETED,
    scheduledDate: subDays(completionDate, 7), // Scheduled a week before completion
    completedDate: completionDate,
    createdAt: subDays(completionDate, 14), // Created two weeks before completion
    updatedAt: completionDate
  };
  
  const payload: ICareAppointmentCompletedPayload = {
    appointment,
    appointmentType,
    providerId,
    completionDate,
    duration: 30, // 30 minutes
    followUpScheduled: false
  };
  
  return {
    type: CareEventType.APPOINTMENT_COMPLETED,
    userId,
    timestamp: completionDate,
    journey: 'care',
    data: payload
  };
}

/**
 * Creates a medication added event
 * 
 * @param userId - The user ID
 * @param isChronicMedication - Whether this is a chronic medication
 * @returns A medication added event
 */
export function createMedicationAddedEvent(
  userId: string,
  isChronicMedication: boolean = false
): ICareEvent {
  const medicationId = uuidv4();
  const startDate = new Date();
  const endDate = isChronicMedication ? undefined : addDays(startDate, 14); // 2 weeks for non-chronic
  
  const medication: IMedication = {
    id: medicationId,
    userId,
    name: isChronicMedication ? 'Losartan 50mg' : 'Amoxicillin 500mg',
    dosage: isChronicMedication ? '1 tablet' : '1 capsule',
    frequency: isChronicMedication ? 'Once daily' : 'Three times daily',
    startDate,
    endDate,
    instructions: isChronicMedication 
      ? 'Take in the morning with food' 
      : 'Take every 8 hours with or without food',
    isActive: true,
    createdAt: startDate,
    updatedAt: startDate
  };
  
  const payload: ICareMedicationAddedPayload = {
    medication,
    startDate,
    endDate,
    dosage: medication.dosage,
    frequency: medication.frequency,
    isChronicMedication
  };
  
  return {
    type: CareEventType.MEDICATION_ADDED,
    userId,
    timestamp: startDate,
    journey: 'care',
    data: payload
  };
}

/**
 * Creates a medication taken event
 * 
 * @param userId - The user ID
 * @param medicationId - The medication ID
 * @param medicationName - The medication name
 * @param takenOnTime - Whether the medication was taken on time
 * @param daysInPast - Days in the past when the medication was taken
 * @returns A medication taken event
 */
export function createMedicationTakenEvent(
  userId: string,
  medicationId: string = uuidv4(),
  medicationName: string = 'Losartan 50mg',
  takenOnTime: boolean = true,
  daysInPast: number = 0
): ICareEvent {
  const takenDate = subDays(new Date(), daysInPast);
  
  const payload: ICareMedicationTakenPayload = {
    medicationId,
    medicationName,
    takenDate,
    takenOnTime,
    dosage: '1 tablet'
  };
  
  return {
    type: CareEventType.MEDICATION_TAKEN,
    userId,
    timestamp: takenDate,
    journey: 'care',
    data: payload
  };
}

/**
 * Creates a medication adherence streak event
 * 
 * @param userId - The user ID
 * @param medicationId - The medication ID
 * @param medicationName - The medication name
 * @param streakDays - Number of days in the streak
 * @param adherencePercentage - Percentage of adherence (0-100)
 * @returns A medication adherence streak event
 */
export function createMedicationAdherenceStreakEvent(
  userId: string,
  medicationId: string = uuidv4(),
  medicationName: string = 'Losartan 50mg',
  streakDays: number = 7,
  adherencePercentage: number = 100
): ICareEvent {
  const endDate = new Date();
  const startDate = subDays(endDate, streakDays);
  
  const payload: ICareMedicationAdherenceStreakPayload = {
    medicationId,
    medicationName,
    streakDays,
    adherencePercentage,
    startDate,
    endDate
  };
  
  return {
    type: CareEventType.MEDICATION_ADHERENCE_STREAK,
    userId,
    timestamp: endDate,
    journey: 'care',
    data: payload
  };
}

/**
 * Creates a telemedicine session completed event
 * 
 * @param userId - The user ID
 * @param duration - Duration of the session in minutes
 * @param daysInPast - Days in the past when the session was completed
 * @returns A telemedicine session completed event
 */
export function createTelemedicineSessionCompletedEvent(
  userId: string,
  duration: number = 20,
  daysInPast: number = 0
): ICareEvent {
  const sessionId = uuidv4();
  const providerId = uuidv4();
  const endTime = subDays(new Date(), daysInPast);
  const startTime = new Date(endTime.getTime() - duration * 60 * 1000);
  
  const payload: ICareTelemedicineSessionCompletedPayload = {
    sessionId,
    providerId,
    startTime,
    endTime,
    duration,
    technicalIssues: false
  };
  
  return {
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    userId,
    timestamp: endTime,
    journey: 'care',
    data: payload
  };
}

/**
 * Creates a scenario for a user who attends multiple appointments
 * and earns the "Appointment Keeper" achievement
 * 
 * @returns A care journey scenario with appointment events
 */
export function createAppointmentKeeperScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  
  // Create events for booking and completing 3 appointments
  const events: ICareEvent[] = [];
  
  // First appointment (30 days ago)
  events.push(createAppointmentBookedEvent(userId, AppointmentType.IN_PERSON, -37)); // Booked a week before
  events.push(createAppointmentCompletedEvent(userId, AppointmentType.IN_PERSON, 30));
  
  // Second appointment (15 days ago)
  events.push(createAppointmentBookedEvent(userId, AppointmentType.IN_PERSON, -22)); // Booked a week before
  events.push(createAppointmentCompletedEvent(userId, AppointmentType.IN_PERSON, 15));
  
  // Third appointment (today)
  events.push(createAppointmentBookedEvent(userId, AppointmentType.IN_PERSON, -7)); // Booked a week before
  events.push(createAppointmentCompletedEvent(userId, AppointmentType.IN_PERSON, 0));
  
  // Create expected achievement
  const achievement = createTestAchievement({
    name: 'appointment-keeper',
    title: 'Compromisso com a Saúde',
    description: 'Compareça às consultas agendadas',
    journey: 'care',
    level: 1,
    pointValue: 100
  });
  
  // Create expected user achievement
  const userAchievement: IUserAchievement = {
    id: uuidv4(),
    userId,
    achievementId: achievement.id,
    status: AchievementStatus.UNLOCKED,
    progress: 100,
    unlockedAt: new Date(),
    createdAt: subDays(new Date(), 30),
    updatedAt: new Date()
  };
  
  return {
    id: scenarioId,
    name: 'Appointment Keeper Achievement',
    userId,
    events,
    expectedAchievements: [achievement],
    expectedUserAchievements: [userAchievement]
  };
}

/**
 * Creates a scenario for a user who maintains medication adherence
 * and earns the "Medication Adherence" achievement
 * 
 * @returns A care journey scenario with medication events
 */
export function createMedicationAdherenceScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  const medicationId = uuidv4();
  const medicationName = 'Losartan 50mg';
  
  // Create events for adding medication and taking it consistently
  const events: ICareEvent[] = [];
  
  // Add chronic medication
  events.push(createMedicationAddedEvent(userId, true));
  
  // Take medication for 7 consecutive days
  for (let i = 7; i >= 1; i--) {
    events.push(createMedicationTakenEvent(
      userId,
      medicationId,
      medicationName,
      true, // taken on time
      i
    ));
  }
  
  // Generate streak event
  events.push(createMedicationAdherenceStreakEvent(
    userId,
    medicationId,
    medicationName,
    7,
    100
  ));
  
  // Create expected achievement
  const achievement = createTestAchievement({
    name: 'medication-adherence',
    title: 'Aderência ao Tratamento',
    description: 'Tome seus medicamentos conforme prescrito',
    journey: 'care',
    level: 1,
    pointValue: 100
  });
  
  // Create expected user achievement
  const userAchievement: IUserAchievement = {
    id: uuidv4(),
    userId,
    achievementId: achievement.id,
    status: AchievementStatus.UNLOCKED,
    progress: 100,
    unlockedAt: new Date(),
    createdAt: subDays(new Date(), 7),
    updatedAt: new Date()
  };
  
  return {
    id: scenarioId,
    name: 'Medication Adherence Achievement',
    userId,
    events,
    expectedAchievements: [achievement],
    expectedUserAchievements: [userAchievement]
  };
}

/**
 * Creates a scenario for a user who completes telemedicine sessions
 * and earns related achievements
 * 
 * @returns A care journey scenario with telemedicine events
 */
export function createTelemedicineScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  
  // Create events for completing telemedicine sessions
  const events: ICareEvent[] = [];
  
  // Complete 3 telemedicine sessions
  events.push(createTelemedicineSessionCompletedEvent(userId, 25, 30)); // 30 days ago
  events.push(createTelemedicineSessionCompletedEvent(userId, 15, 15)); // 15 days ago
  events.push(createTelemedicineSessionCompletedEvent(userId, 20, 0));  // Today
  
  // Create expected achievement
  const achievement = createTestAchievement({
    name: 'telemedicine-adopter',
    title: 'Consultas Virtuais',
    description: 'Realize consultas por telemedicina',
    journey: 'care',
    level: 1,
    pointValue: 100
  });
  
  // Create expected user achievement
  const userAchievement: IUserAchievement = {
    id: uuidv4(),
    userId,
    achievementId: achievement.id,
    status: AchievementStatus.UNLOCKED,
    progress: 100,
    unlockedAt: new Date(),
    createdAt: subDays(new Date(), 30),
    updatedAt: new Date()
  };
  
  return {
    id: scenarioId,
    name: 'Telemedicine Adopter Achievement',
    userId,
    events,
    expectedAchievements: [achievement],
    expectedUserAchievements: [userAchievement]
  };
}

/**
 * Creates a comprehensive care journey scenario that combines
 * appointments, medications, and telemedicine sessions
 * 
 * @returns A comprehensive care journey scenario
 */
export function createComprehensiveCareScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  const medicationId = uuidv4();
  const medicationName = 'Losartan 50mg';
  
  // Create a mix of care journey events
  const events: ICareEvent[] = [];
  
  // Add chronic medication (30 days ago)
  const medicationAddedEvent = createMedicationAddedEvent(userId, true);
  medicationAddedEvent.timestamp = subDays(new Date(), 30);
  events.push(medicationAddedEvent);
  
  // Take medication for 30 consecutive days
  for (let i = 30; i >= 1; i--) {
    events.push(createMedicationTakenEvent(
      userId,
      medicationId,
      medicationName,
      true, // taken on time
      i
    ));
  }
  
  // Generate streak event
  events.push(createMedicationAdherenceStreakEvent(
    userId,
    medicationId,
    medicationName,
    30,
    100
  ));
  
  // Book and complete 5 appointments over 30 days
  for (let i = 0; i < 5; i++) {
    const daysAgo = 30 - (i * 7); // Every 7 days starting from 30 days ago
    events.push(createAppointmentBookedEvent(userId, AppointmentType.IN_PERSON, -(daysAgo + 7)));
    events.push(createAppointmentCompletedEvent(userId, AppointmentType.IN_PERSON, daysAgo));
  }
  
  // Complete 3 telemedicine sessions
  events.push(createTelemedicineSessionCompletedEvent(userId, 25, 25)); // 25 days ago
  events.push(createTelemedicineSessionCompletedEvent(userId, 15, 15)); // 15 days ago
  events.push(createTelemedicineSessionCompletedEvent(userId, 20, 5));  // 5 days ago
  
  // Create expected achievements
  const achievements = [
    createTestAchievement({
      name: 'medication-adherence',
      title: 'Aderência ao Tratamento',
      description: 'Tome seus medicamentos conforme prescrito',
      journey: 'care',
      level: 2, // Level 2 for 30 days
      pointValue: 200
    }),
    createTestAchievement({
      name: 'appointment-keeper',
      title: 'Compromisso com a Saúde',
      description: 'Compareça às consultas agendadas',
      journey: 'care',
      level: 2, // Level 2 for 5 appointments
      pointValue: 200
    }),
    createTestAchievement({
      name: 'telemedicine-adopter',
      title: 'Consultas Virtuais',
      description: 'Realize consultas por telemedicina',
      journey: 'care',
      level: 1,
      pointValue: 100
    }),
    createTestAchievement({
      name: 'care-journey-master',
      title: 'Mestre do Cuidado',
      description: 'Demonstre excelência em todas as áreas do cuidado',
      journey: 'care',
      level: 1,
      pointValue: 300
    })
  ];
  
  // Create expected user achievements
  const userAchievements = achievements.map(achievement => ({
    id: uuidv4(),
    userId,
    achievementId: achievement.id,
    status: AchievementStatus.UNLOCKED,
    progress: 100,
    unlockedAt: new Date(),
    createdAt: subDays(new Date(), 30),
    updatedAt: new Date()
  }));
  
  return {
    id: scenarioId,
    name: 'Comprehensive Care Journey',
    userId,
    events,
    expectedAchievements: achievements,
    expectedUserAchievements: userAchievements
  };
}

/**
 * Creates a scenario for testing care plan progress events
 * 
 * @returns A care journey scenario with care plan progress events
 */
export function createCarePlanProgressScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  const carePlanId = uuidv4();
  
  // Create events for care plan progress
  const events: ICareEvent[] = [];
  
  // Create care plan created event
  events.push({
    type: 'CARE_PLAN_CREATED',
    userId,
    timestamp: subDays(new Date(), 30),
    journey: 'care',
    data: {
      carePlanId,
      planName: 'Hypertension Management Plan',
      creationDate: subDays(new Date(), 30),
      providerId: uuidv4(),
      targetDuration: 90, // 90 days plan
      goals: [
        'Reduce blood pressure to normal range',
        'Maintain medication adherence',
        'Attend all scheduled appointments'
      ]
    }
  });
  
  // Create care plan progress events
  for (let i = 0; i < 4; i++) {
    const daysAgo = 30 - (i * 7); // Every 7 days starting from 30 days ago
    events.push({
      type: 'CARE_PLAN_PROGRESS_UPDATED',
      userId,
      timestamp: subDays(new Date(), daysAgo),
      journey: 'care',
      data: {
        carePlanId,
        progressDate: subDays(new Date(), daysAgo),
        overallProgress: 25 * (i + 1), // 25%, 50%, 75%, 100%
        goalProgress: [
          { goalIndex: 0, progress: 25 * (i + 1) },
          { goalIndex: 1, progress: 25 * (i + 1) },
          { goalIndex: 2, progress: 25 * (i + 1) }
        ],
        notes: `Week ${i + 1} progress update`
      }
    });
  }
  
  // Create care plan completed event
  events.push({
    type: 'CARE_PLAN_COMPLETED',
    userId,
    timestamp: new Date(),
    journey: 'care',
    data: {
      carePlanId,
      completionDate: new Date(),
      successRate: 100,
      completedEarly: true,
      providerId: uuidv4(),
      followUpRequired: false
    }
  });
  
  // Create expected achievement
  const achievement = createTestAchievement({
    name: 'care-plan-completer',
    title: 'Plano Concluído',
    description: 'Complete um plano de cuidados com sucesso',
    journey: 'care',
    level: 1,
    pointValue: 200
  });
  
  // Create expected user achievement
  const userAchievement: IUserAchievement = {
    id: uuidv4(),
    userId,
    achievementId: achievement.id,
    status: AchievementStatus.UNLOCKED,
    progress: 100,
    unlockedAt: new Date(),
    createdAt: subDays(new Date(), 30),
    updatedAt: new Date()
  };
  
  return {
    id: scenarioId,
    name: 'Care Plan Progress Achievement',
    userId,
    events,
    expectedAchievements: [achievement],
    expectedUserAchievements: [userAchievement]
  };
}

/**
 * Creates a scenario for testing edge cases in the Care journey
 * 
 * @returns A care journey scenario with edge cases
 */
export function createCareJourneyEdgeCaseScenario(): ICareJourneyScenario {
  const userId = uuidv4();
  const scenarioId = uuidv4();
  const medicationId = uuidv4();
  const medicationName = 'Losartan 50mg';
  
  // Create events for edge cases
  const events: ICareEvent[] = [];
  
  // Add medication but miss some doses
  events.push(createMedicationAddedEvent(userId, true));
  
  // Take medication with some missed days (70% adherence)
  for (let i = 10; i >= 1; i--) {
    // Skip days 3, 6, and 9 to simulate missed doses
    if (i !== 3 && i !== 6 && i !== 9) {
      events.push(createMedicationTakenEvent(
        userId,
        medicationId,
        medicationName,
        true,
        i
      ));
    }
  }
  
  // Generate streak event with partial adherence
  events.push(createMedicationAdherenceStreakEvent(
    userId,
    medicationId,
    medicationName,
    10,
    70 // 70% adherence
  ));
  
  // Book appointment but cancel it
  events.push(createAppointmentBookedEvent(userId, AppointmentType.IN_PERSON, -14));
  events.push({
    type: CareEventType.APPOINTMENT_CANCELED,
    userId,
    timestamp: subDays(new Date(), 10),
    journey: 'care',
    data: {
      appointmentId: uuidv4(),
      appointmentType: AppointmentType.IN_PERSON,
      providerId: uuidv4(),
      cancellationDate: subDays(new Date(), 10),
      rescheduled: true,
      reason: 'Schedule conflict'
    }
  });
  
  // Telemedicine session with technical issues
  const sessionWithIssues = createTelemedicineSessionCompletedEvent(userId, 15, 5);
  sessionWithIssues.data.technicalIssues = true;
  events.push(sessionWithIssues);
  
  // No expected achievements due to edge cases
  
  return {
    id: scenarioId,
    name: 'Care Journey Edge Cases',
    userId,
    events,
    expectedAchievements: [],
    expectedUserAchievements: []
  };
}

/**
 * Export all care journey scenarios
 */
export const careJourneyScenarios = {
  appointmentKeeper: createAppointmentKeeperScenario(),
  medicationAdherence: createMedicationAdherenceScenario(),
  telemedicine: createTelemedicineScenario(),
  comprehensive: createComprehensiveCareScenario(),
  carePlanProgress: createCarePlanProgressScenario(),
  edgeCases: createCareJourneyEdgeCaseScenario()
};