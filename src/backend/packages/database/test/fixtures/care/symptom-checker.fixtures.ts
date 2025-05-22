/**
 * @file Contains test fixtures for symptom checker queries and responses with varying severity levels,
 * recommended actions, and emergency flags.
 * 
 * These fixtures enable testing of symptom evaluation logic, emergency detection, and recommendation
 * generation in the Care journey. They provide standardized test data for unit, integration, and e2e tests.
 */

/**
 * Enum representing the severity level of symptoms
 */
export enum SymptomSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL'
}

/**
 * Enum representing the recommended actions based on symptom severity
 */
export enum RecommendedAction {
  SELF_CARE = 'SELF_CARE',
  CONTACT_PROVIDER = 'CONTACT_PROVIDER',
  SCHEDULE_APPOINTMENT = 'SCHEDULE_APPOINTMENT',
  URGENT_CARE = 'URGENT_CARE',
  EMERGENCY_SERVICES = 'EMERGENCY_SERVICES'
}

/**
 * Interface for symptom input data provided by the user
 */
export interface SymptomInput {
  /** Unique identifier for the symptom */
  id: string;
  /** Name of the symptom */
  name: string;
  /** Description of the symptom */
  description: string;
  /** Duration of the symptom in hours */
  durationHours: number;
  /** Intensity of the symptom on a scale of 1-10 */
  intensity: number;
  /** Additional symptoms that may be related */
  relatedSymptoms?: string[];
  /** Body location of the symptom */
  bodyLocation?: string;
  /** Whether the symptom is worsening */
  isWorsening?: boolean;
  /** Additional notes provided by the user */
  notes?: string;
}

/**
 * Interface for symptom evaluation results
 */
export interface SymptomEvaluation {
  /** Unique identifier for the evaluation */
  id: string;
  /** Reference to the symptom input */
  symptomInputId: string;
  /** Assessed severity level */
  severity: SymptomSeverity;
  /** Recommended action based on severity */
  recommendedAction: RecommendedAction;
  /** Whether this is considered an emergency situation */
  isEmergency: boolean;
  /** Potential conditions that may be related to the symptoms */
  potentialConditions?: string[];
  /** Additional information or context for the evaluation */
  additionalInfo?: string;
  /** Timestamp of the evaluation */
  evaluatedAt: Date;
}

/**
 * Interface for a complete symptom checker session
 */
export interface SymptomCheckerSession {
  /** Unique identifier for the session */
  id: string;
  /** User ID associated with the session */
  userId: string;
  /** Symptom inputs provided by the user */
  inputs: SymptomInput[];
  /** Evaluation results for the symptoms */
  evaluation: SymptomEvaluation;
  /** Timestamp when the session was created */
  createdAt: Date;
  /** Whether emergency services were notified */
  emergencyNotified?: boolean;
  /** Whether the user followed the recommended action */
  actionTaken?: boolean;
}

/**
 * Factory function to create a symptom input with customizable properties
 * 
 * @param overrides - Optional properties to override defaults
 * @returns A symptom input object
 */
export function createSymptomInput(overrides?: Partial<SymptomInput>): SymptomInput {
  return {
    id: `symptom-${Date.now()}`,
    name: 'Headache',
    description: 'Pain in the head region',
    durationHours: 4,
    intensity: 5,
    relatedSymptoms: ['Nausea', 'Sensitivity to light'],
    bodyLocation: 'Head',
    isWorsening: false,
    notes: 'Started after lunch',
    ...overrides
  };
}

/**
 * Factory function to create a symptom evaluation with customizable properties
 * 
 * @param symptomInputId - ID of the associated symptom input
 * @param overrides - Optional properties to override defaults
 * @returns A symptom evaluation object
 */
export function createSymptomEvaluation(
  symptomInputId: string,
  overrides?: Partial<SymptomEvaluation>
): SymptomEvaluation {
  return {
    id: `eval-${Date.now()}`,
    symptomInputId,
    severity: SymptomSeverity.MODERATE,
    recommendedAction: RecommendedAction.CONTACT_PROVIDER,
    isEmergency: false,
    potentialConditions: ['Tension headache', 'Migraine'],
    additionalInfo: 'Consider over-the-counter pain relief if appropriate',
    evaluatedAt: new Date(),
    ...overrides
  };
}

/**
 * Factory function to create a complete symptom checker session
 * 
 * @param userId - ID of the user associated with the session
 * @param overrides - Optional properties to override defaults
 * @returns A symptom checker session object
 */
export function createSymptomCheckerSession(
  userId: string,
  overrides?: Partial<SymptomCheckerSession>
): SymptomCheckerSession {
  const symptomInput = createSymptomInput();
  const evaluation = createSymptomEvaluation(symptomInput.id);
  
  return {
    id: `session-${Date.now()}`,
    userId,
    inputs: [symptomInput],
    evaluation,
    createdAt: new Date(),
    emergencyNotified: false,
    actionTaken: false,
    ...overrides
  };
}

// Pre-defined fixtures with different severity levels

/**
 * Mild headache scenario - Self-care recommended
 */
export const mildHeadacheSession: SymptomCheckerSession = {
  id: 'session-mild-headache',
  userId: 'user-123',
  inputs: [
    {
      id: 'symptom-mild-headache',
      name: 'Headache',
      description: 'Mild pain in the forehead',
      durationHours: 2,
      intensity: 3,
      relatedSymptoms: ['Slight fatigue'],
      bodyLocation: 'Forehead',
      isWorsening: false,
      notes: 'Started after working on computer'
    }
  ],
  evaluation: {
    id: 'eval-mild-headache',
    symptomInputId: 'symptom-mild-headache',
    severity: SymptomSeverity.MILD,
    recommendedAction: RecommendedAction.SELF_CARE,
    isEmergency: false,
    potentialConditions: ['Tension headache', 'Eye strain'],
    additionalInfo: 'Take a break from screens, stay hydrated, and consider over-the-counter pain relief if needed',
    evaluatedAt: new Date('2023-06-15T10:30:00Z')
  },
  createdAt: new Date('2023-06-15T10:25:00Z'),
  emergencyNotified: false,
  actionTaken: true
};

/**
 * Moderate fever scenario - Contact provider recommended
 */
export const moderateFeverSession: SymptomCheckerSession = {
  id: 'session-moderate-fever',
  userId: 'user-456',
  inputs: [
    {
      id: 'symptom-moderate-fever',
      name: 'Fever',
      description: 'Elevated temperature with chills',
      durationHours: 24,
      intensity: 6,
      relatedSymptoms: ['Fatigue', 'Body aches', 'Headache'],
      bodyLocation: 'Whole body',
      isWorsening: true,
      notes: 'Temperature of 38.5°C (101.3°F)'
    }
  ],
  evaluation: {
    id: 'eval-moderate-fever',
    symptomInputId: 'symptom-moderate-fever',
    severity: SymptomSeverity.MODERATE,
    recommendedAction: RecommendedAction.CONTACT_PROVIDER,
    isEmergency: false,
    potentialConditions: ['Viral infection', 'Influenza', 'COVID-19'],
    additionalInfo: 'Monitor temperature, stay hydrated, and contact healthcare provider for guidance',
    evaluatedAt: new Date('2023-06-16T14:45:00Z')
  },
  createdAt: new Date('2023-06-16T14:40:00Z'),
  emergencyNotified: false,
  actionTaken: true
};

/**
 * Severe abdominal pain scenario - Urgent care recommended
 */
export const severeAbdominalPainSession: SymptomCheckerSession = {
  id: 'session-severe-abdominal',
  userId: 'user-789',
  inputs: [
    {
      id: 'symptom-severe-abdominal',
      name: 'Abdominal Pain',
      description: 'Sharp pain in lower right abdomen',
      durationHours: 8,
      intensity: 8,
      relatedSymptoms: ['Nausea', 'Loss of appetite', 'Fever'],
      bodyLocation: 'Lower right abdomen',
      isWorsening: true,
      notes: 'Pain increases with movement'
    }
  ],
  evaluation: {
    id: 'eval-severe-abdominal',
    symptomInputId: 'symptom-severe-abdominal',
    severity: SymptomSeverity.SEVERE,
    recommendedAction: RecommendedAction.URGENT_CARE,
    isEmergency: false,
    potentialConditions: ['Appendicitis', 'Kidney stone', 'Diverticulitis'],
    additionalInfo: 'Seek medical attention promptly. Do not eat or drink until evaluated.',
    evaluatedAt: new Date('2023-06-17T20:15:00Z')
  },
  createdAt: new Date('2023-06-17T20:10:00Z'),
  emergencyNotified: false,
  actionTaken: true
};

/**
 * Critical chest pain scenario - Emergency services recommended
 */
export const criticalChestPainSession: SymptomCheckerSession = {
  id: 'session-critical-chest',
  userId: 'user-101',
  inputs: [
    {
      id: 'symptom-critical-chest',
      name: 'Chest Pain',
      description: 'Severe crushing pain in center of chest with radiation to left arm',
      durationHours: 1,
      intensity: 9,
      relatedSymptoms: ['Shortness of breath', 'Sweating', 'Nausea', 'Dizziness'],
      bodyLocation: 'Center of chest and left arm',
      isWorsening: true,
      notes: 'Sudden onset while resting'
    }
  ],
  evaluation: {
    id: 'eval-critical-chest',
    symptomInputId: 'symptom-critical-chest',
    severity: SymptomSeverity.CRITICAL,
    recommendedAction: RecommendedAction.EMERGENCY_SERVICES,
    isEmergency: true,
    potentialConditions: ['Myocardial infarction (heart attack)', 'Unstable angina', 'Aortic dissection'],
    additionalInfo: 'EMERGENCY: Call emergency services (911) immediately. Do not drive yourself to the hospital.',
    evaluatedAt: new Date('2023-06-18T03:05:00Z')
  },
  createdAt: new Date('2023-06-18T03:00:00Z'),
  emergencyNotified: true,
  actionTaken: true
};

/**
 * Critical stroke symptoms scenario - Emergency services recommended
 */
export const criticalStrokeSession: SymptomCheckerSession = {
  id: 'session-critical-stroke',
  userId: 'user-202',
  inputs: [
    {
      id: 'symptom-critical-stroke',
      name: 'Facial Drooping',
      description: 'Sudden drooping of the right side of face',
      durationHours: 0.5,
      intensity: 8,
      relatedSymptoms: ['Slurred speech', 'Weakness in right arm', 'Confusion'],
      bodyLocation: 'Face and right side of body',
      isWorsening: true,
      notes: 'Cannot raise right arm fully'
    }
  ],
  evaluation: {
    id: 'eval-critical-stroke',
    symptomInputId: 'symptom-critical-stroke',
    severity: SymptomSeverity.CRITICAL,
    recommendedAction: RecommendedAction.EMERGENCY_SERVICES,
    isEmergency: true,
    potentialConditions: ['Stroke', 'Transient ischemic attack (TIA)'],
    additionalInfo: 'EMERGENCY: Call emergency services (911) immediately. Note the time symptoms started.',
    evaluatedAt: new Date('2023-06-19T15:35:00Z')
  },
  createdAt: new Date('2023-06-19T15:30:00Z'),
  emergencyNotified: true,
  actionTaken: true
};

/**
 * Multiple symptoms scenario - Appointment recommended
 */
export const multipleSymptomSession: SymptomCheckerSession = {
  id: 'session-multiple-symptoms',
  userId: 'user-303',
  inputs: [
    {
      id: 'symptom-cough',
      name: 'Cough',
      description: 'Persistent dry cough',
      durationHours: 72,
      intensity: 6,
      bodyLocation: 'Chest',
      isWorsening: false,
      notes: 'Worse at night'
    },
    {
      id: 'symptom-sore-throat',
      name: 'Sore Throat',
      description: 'Pain when swallowing',
      durationHours: 48,
      intensity: 5,
      bodyLocation: 'Throat',
      isWorsening: false,
      notes: 'Started after the cough'
    },
    {
      id: 'symptom-fatigue',
      name: 'Fatigue',
      description: 'General tiredness and lack of energy',
      durationHours: 72,
      intensity: 4,
      bodyLocation: 'Whole body',
      isWorsening: true,
      notes: 'Affecting daily activities'
    }
  ],
  evaluation: {
    id: 'eval-multiple-symptoms',
    symptomInputId: 'symptom-cough', // Primary symptom ID
    severity: SymptomSeverity.MODERATE,
    recommendedAction: RecommendedAction.SCHEDULE_APPOINTMENT,
    isEmergency: false,
    potentialConditions: ['Upper respiratory infection', 'Bronchitis', 'COVID-19', 'Influenza'],
    additionalInfo: 'Schedule an appointment with your healthcare provider within the next 1-2 days.',
    evaluatedAt: new Date('2023-06-20T09:15:00Z')
  },
  createdAt: new Date('2023-06-20T09:10:00Z'),
  emergencyNotified: false,
  actionTaken: true
};

/**
 * Collection of all pre-defined symptom checker sessions
 */
export const symptomCheckerSessions = {
  mildHeadacheSession,
  moderateFeverSession,
  severeAbdominalPainSession,
  criticalChestPainSession,
  criticalStrokeSession,
  multipleSymptomSession
};

/**
 * Collection of symptom checker sessions by severity level
 */
export const sessionsBySeverity = {
  [SymptomSeverity.MILD]: [mildHeadacheSession],
  [SymptomSeverity.MODERATE]: [moderateFeverSession, multipleSymptomSession],
  [SymptomSeverity.SEVERE]: [severeAbdominalPainSession],
  [SymptomSeverity.CRITICAL]: [criticalChestPainSession, criticalStrokeSession]
};

/**
 * Collection of emergency symptom checker sessions
 */
export const emergencySessions = [
  criticalChestPainSession,
  criticalStrokeSession
];

/**
 * Default export providing all symptom checker fixtures
 */
export default {
  // Enums
  SymptomSeverity,
  RecommendedAction,
  
  // Factory functions
  createSymptomInput,
  createSymptomEvaluation,
  createSymptomCheckerSession,
  
  // Pre-defined fixtures
  sessions: symptomCheckerSessions,
  sessionsBySeverity,
  emergencySessions,
  
  // Individual sessions
  mildHeadacheSession,
  moderateFeverSession,
  severeAbdominalPainSession,
  criticalChestPainSession,
  criticalStrokeSession,
  multipleSymptomSession
};