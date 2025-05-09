/**
 * @file care-journey-scenarios.ts
 * @description Test scenarios for the Care journey in the gamification system.
 * Contains fixtures that simulate users managing healthcare appointments, medication adherence,
 * and telemedicine sessions, triggering gamification events, and earning achievements.
 */

import { v4 as uuidv4 } from 'uuid';
import { addDays, subDays, format } from 'date-fns';
import { 
  GamificationEvent, 
  CareEventType,
  CommonEventType,
  AppointmentBookedPayload,
  AppointmentAttendedPayload,
  MedicationTakenPayload,
  TelemedicineSessionCompletedPayload,
  AchievementUnlockedPayload
} from '@austa/interfaces/gamification';

// Import shared test utilities
import { createTestUser, createTestProfile } from '../utils';

/**
 * Creates a test scenario for a user booking and attending an appointment,
 * earning the "Appointment Keeper" achievement.
 */
export const appointmentKeeperScenario = () => {
  const userId = uuidv4();
  const now = new Date();
  const appointmentId = uuidv4();
  const providerId = uuidv4();
  
  // Create test user and profile
  const user = createTestUser({
    id: userId,
    name: 'Appointment Test User',
    email: `appointment-test-${userId.substring(0, 8)}@example.com`,
  });
  
  const profile = createTestProfile({
    userId: userId,
    level: 1,
    xp: 0,
  });
  
  // Create appointment booking event
  const bookingEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.APPOINTMENT_BOOKED,
    userId: userId,
    journey: 'care',
    timestamp: subDays(now, 7).toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        appointmentId: appointmentId,
        appointmentType: 'consultation',
        providerId: providerId,
        scheduledAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        isFirstAppointment: true,
        specialtyArea: 'Cardiologia',
      } as AppointmentBookedPayload,
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create appointment attended event
  const attendedEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.APPOINTMENT_ATTENDED,
    userId: userId,
    journey: 'care',
    timestamp: now.toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        appointmentId: appointmentId,
        appointmentType: 'consultation',
        providerId: providerId,
        scheduledAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        attendedAt: format(now, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
        duration: 30,
        onTime: true,
      } as AppointmentAttendedPayload,
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create achievement unlocked event
  const achievementEvent: GamificationEvent = {
    id: uuidv4(),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId: userId,
    journey: 'care',
    timestamp: addDays(now, 0.01).toISOString(), // Slightly after attended event
    version: '1.0.0',
    payload: {
      data: {
        achievementId: 'appointment-keeper-level-1',
        achievementName: 'Compromisso com a Saúde',
        unlockedAt: addDays(now, 0.01).toISOString(),
        pointsAwarded: 50,
        journey: 'care',
        rarity: 'common',
      } as AchievementUnlockedPayload,
      metadata: {
        source: 'gamification-engine',
      },
    },
  };
  
  return {
    user,
    profile,
    events: [bookingEvent, attendedEvent, achievementEvent],
    expectedXp: 50,
    expectedLevel: 1,
    expectedAchievements: ['appointment-keeper-level-1'],
  };
};

/**
 * Creates a test scenario for a user maintaining medication adherence,
 * earning the "Medication Adherence" achievement.
 */
export const medicationAdherenceScenario = () => {
  const userId = uuidv4();
  const now = new Date();
  const medicationId = uuidv4();
  
  // Create test user and profile
  const user = createTestUser({
    id: userId,
    name: 'Medication Test User',
    email: `medication-test-${userId.substring(0, 8)}@example.com`,
  });
  
  const profile = createTestProfile({
    userId: userId,
    level: 1,
    xp: 0,
  });
  
  // Create medication events for 7 consecutive days
  const medicationEvents: GamificationEvent[] = [];
  
  for (let i = 0; i < 7; i++) {
    const eventDate = subDays(now, 7 - i);
    
    medicationEvents.push({
      id: uuidv4(),
      type: CareEventType.MEDICATION_TAKEN,
      userId: userId,
      journey: 'care',
      timestamp: eventDate.toISOString(),
      version: '1.0.0',
      payload: {
        data: {
          medicationId: medicationId,
          takenAt: eventDate.toISOString(),
          dosage: '10mg',
          adherencePercentage: 100,
          onSchedule: true,
          streakDays: i + 1,
        } as MedicationTakenPayload,
        metadata: {
          source: 'care-service',
        },
      },
    });
  }
  
  // Create achievement unlocked event
  const achievementEvent: GamificationEvent = {
    id: uuidv4(),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId: userId,
    journey: 'care',
    timestamp: addDays(now, 0.01).toISOString(), // Slightly after last medication event
    version: '1.0.0',
    payload: {
      data: {
        achievementId: 'medication-adherence-level-1',
        achievementName: 'Aderência ao Tratamento',
        unlockedAt: addDays(now, 0.01).toISOString(),
        pointsAwarded: 75,
        journey: 'care',
        rarity: 'common',
      } as AchievementUnlockedPayload,
      metadata: {
        source: 'gamification-engine',
      },
    },
  };
  
  return {
    user,
    profile,
    events: [...medicationEvents, achievementEvent],
    expectedXp: 75,
    expectedLevel: 1,
    expectedAchievements: ['medication-adherence-level-1'],
  };
};

/**
 * Creates a test scenario for a user completing a telemedicine session,
 * contributing to the "Digital Care" achievement.
 */
export const telemedicineSessionScenario = () => {
  const userId = uuidv4();
  const now = new Date();
  const sessionId = uuidv4();
  const providerId = uuidv4();
  
  // Create test user and profile
  const user = createTestUser({
    id: userId,
    name: 'Telemedicine Test User',
    email: `telemedicine-test-${userId.substring(0, 8)}@example.com`,
  });
  
  const profile = createTestProfile({
    userId: userId,
    level: 1,
    xp: 0,
  });
  
  // Create telemedicine session started event
  const sessionStartedEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.TELEMEDICINE_SESSION_STARTED,
    userId: userId,
    journey: 'care',
    timestamp: subDays(now, 0.01).toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        sessionId: sessionId,
        providerId: providerId,
        startTime: subDays(now, 0.01).toISOString(),
        specialtyArea: 'Dermatologia',
      },
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create telemedicine session completed event
  const sessionCompletedEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.TELEMEDICINE_SESSION_COMPLETED,
    userId: userId,
    journey: 'care',
    timestamp: now.toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        sessionId: sessionId,
        providerId: providerId,
        startTime: subDays(now, 0.01).toISOString(),
        endTime: now.toISOString(),
        duration: 15,
        specialtyArea: 'Dermatologia',
      } as TelemedicineSessionCompletedPayload,
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create achievement unlocked event
  const achievementEvent: GamificationEvent = {
    id: uuidv4(),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId: userId,
    journey: 'care',
    timestamp: addDays(now, 0.01).toISOString(), // Slightly after session completed event
    version: '1.0.0',
    payload: {
      data: {
        achievementId: 'digital-care-level-1',
        achievementName: 'Cuidado Digital',
        unlockedAt: addDays(now, 0.01).toISOString(),
        pointsAwarded: 60,
        journey: 'care',
        rarity: 'common',
      } as AchievementUnlockedPayload,
      metadata: {
        source: 'gamification-engine',
      },
    },
  };
  
  return {
    user,
    profile,
    events: [sessionStartedEvent, sessionCompletedEvent, achievementEvent],
    expectedXp: 60,
    expectedLevel: 1,
    expectedAchievements: ['digital-care-level-1'],
  };
};

/**
 * Creates a test scenario for a user completing a treatment plan,
 * earning the "Treatment Completer" achievement.
 */
export const treatmentPlanScenario = () => {
  const userId = uuidv4();
  const now = new Date();
  const treatmentPlanId = uuidv4();
  
  // Create test user and profile
  const user = createTestUser({
    id: userId,
    name: 'Treatment Plan Test User',
    email: `treatment-test-${userId.substring(0, 8)}@example.com`,
  });
  
  const profile = createTestProfile({
    userId: userId,
    level: 1,
    xp: 0,
  });
  
  // Create treatment plan created event
  const planCreatedEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.TREATMENT_PLAN_CREATED,
    userId: userId,
    journey: 'care',
    timestamp: subDays(now, 30).toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        treatmentPlanId: treatmentPlanId,
        planType: 'rehabilitation',
        duration: 30, // days
        startDate: subDays(now, 30).toISOString(),
        expectedEndDate: now.toISOString(),
      },
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create treatment plan completed event
  const planCompletedEvent: GamificationEvent = {
    id: uuidv4(),
    type: CareEventType.TREATMENT_PLAN_COMPLETED,
    userId: userId,
    journey: 'care',
    timestamp: now.toISOString(),
    version: '1.0.0',
    payload: {
      data: {
        treatmentPlanId: treatmentPlanId,
        planType: 'rehabilitation',
        completedDate: now.toISOString(),
        adherencePercentage: 95,
        completedOnTime: true,
      },
      metadata: {
        source: 'care-service',
      },
    },
  };
  
  // Create achievement unlocked event
  const achievementEvent: GamificationEvent = {
    id: uuidv4(),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId: userId,
    journey: 'care',
    timestamp: addDays(now, 0.01).toISOString(), // Slightly after plan completed event
    version: '1.0.0',
    payload: {
      data: {
        achievementId: 'treatment-completer-level-1',
        achievementName: 'Tratamento Concluído',
        unlockedAt: addDays(now, 0.01).toISOString(),
        pointsAwarded: 100,
        journey: 'care',
        rarity: 'uncommon',
      } as AchievementUnlockedPayload,
      metadata: {
        source: 'gamification-engine',
      },
    },
  };
  
  return {
    user,
    profile,
    events: [planCreatedEvent, planCompletedEvent, achievementEvent],
    expectedXp: 100,
    expectedLevel: 2, // Level up due to higher XP
    expectedAchievements: ['treatment-completer-level-1'],
  };
};

/**
 * Creates a comprehensive test scenario for a user engaging with multiple
 * care journey activities, earning multiple achievements.
 */
export const comprehensiveCareJourneyScenario = () => {
  const userId = uuidv4();
  const now = new Date();
  
  // Create test user and profile
  const user = createTestUser({
    id: userId,
    name: 'Comprehensive Care User',
    email: `care-journey-${userId.substring(0, 8)}@example.com`,
  });
  
  const profile = createTestProfile({
    userId: userId,
    level: 1,
    xp: 0,
  });
  
  // Generate individual scenarios
  const appointment = appointmentKeeperScenario();
  const medication = medicationAdherenceScenario();
  const telemedicine = telemedicineSessionScenario();
  const treatment = treatmentPlanScenario();
  
  // Combine all events, but update the userId to match our comprehensive user
  const allEvents = [
    ...appointment.events,
    ...medication.events,
    ...telemedicine.events,
    ...treatment.events,
  ].map(event => ({
    ...event,
    userId: userId,
  }));
  
  // Sort events by timestamp to ensure proper sequence
  const sortedEvents = allEvents.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  // Create a "Care Journey Master" achievement for completing all care activities
  const masterAchievementEvent: GamificationEvent = {
    id: uuidv4(),
    type: CommonEventType.ACHIEVEMENT_UNLOCKED,
    userId: userId,
    journey: 'care',
    timestamp: addDays(now, 1).toISOString(), // After all other events
    version: '1.0.0',
    payload: {
      data: {
        achievementId: 'care-journey-master',
        achievementName: 'Mestre do Cuidado',
        unlockedAt: addDays(now, 1).toISOString(),
        pointsAwarded: 200,
        journey: 'care',
        rarity: 'rare',
      } as AchievementUnlockedPayload,
      metadata: {
        source: 'gamification-engine',
      },
    },
  };
  
  // Add the master achievement to the events
  sortedEvents.push(masterAchievementEvent);
  
  // Calculate total XP from all scenarios plus the master achievement
  const totalXp = 
    appointment.expectedXp + 
    medication.expectedXp + 
    telemedicine.expectedXp + 
    treatment.expectedXp + 
    200; // Master achievement XP
  
  // Determine expected level based on total XP
  // Assuming level thresholds: Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
  let expectedLevel = 1;
  if (totalXp >= 300) {
    expectedLevel = 3;
  } else if (totalXp >= 100) {
    expectedLevel = 2;
  }
  
  return {
    user,
    profile,
    events: sortedEvents,
    expectedXp: totalXp,
    expectedLevel: expectedLevel,
    expectedAchievements: [
      'appointment-keeper-level-1',
      'medication-adherence-level-1',
      'digital-care-level-1',
      'treatment-completer-level-1',
      'care-journey-master',
    ],
  };
};

/**
 * Export all care journey scenarios
 */
export const careJourneyScenarios = {
  appointmentKeeper: appointmentKeeperScenario,
  medicationAdherence: medicationAdherenceScenario,
  telemedicineSession: telemedicineSessionScenario,
  treatmentPlan: treatmentPlanScenario,
  comprehensiveCareJourney: comprehensiveCareJourneyScenario,
};

export default careJourneyScenarios;