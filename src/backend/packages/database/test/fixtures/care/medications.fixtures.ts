/**
 * @file Medication Test Fixtures for Care Journey
 * 
 * This file provides test fixtures for medication tracking with various dosage regimens,
 * frequencies, reminder settings, and adherence patterns. These fixtures are used to test
 * medication management, reminder functionality, adherence tracking, and refill notification
 * features in the Care journey.
 * 
 * The fixtures include:
 * - Medications with different dosage regimens (daily, multiple times per day, interval-based)
 * - Various frequencies and schedules (morning, evening, as needed, etc.)
 * - Different reminder settings (enabled/disabled)
 * - Various adherence patterns (perfect, good, moderate, poor, variable)
 * - Different medication statuses (active/inactive)
 * - Factory functions to generate medication records with customizable properties
 * 
 * These fixtures support testing for:
 * - Medication management CRUD operations
 * - Reminder functionality and scheduling
 * - Adherence tracking and reporting
 * - Refill notification and management
 * - Gamification integration for medication adherence
 */

import { IMedication } from '@austa/interfaces/journey/care';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended medication interface for test fixtures with adherence data
 */
/**
 * Extended medication interface that includes adherence tracking data
 * 
 * This interface extends the base medication interface to include adherence metrics
 * for testing adherence tracking, reporting, and gamification features.
 */
export interface MedicationFixtureWithAdherence extends IMedication {
  /**
   * Adherence rate as a percentage (0-100)
   */
  adherenceRate: number;
  
  /**
   * Adherence pattern description
   */
  adherencePattern: 'perfect' | 'good' | 'moderate' | 'poor' | 'variable';
  
  /**
   * Number of doses taken
   */
  dosesTaken: number;
  
  /**
   * Number of doses missed
   */
  dosesMissed: number;
}

/**
 * Frequency type for medication dosing
 */
/**
 * Frequency type for medication dosing
 * 
 * Defines all possible frequency patterns for medication administration,
 * supporting various dosing schedules from once daily to as-needed.
 */
export type MedicationFrequency = 
  | 'once_daily'
  | 'twice_daily'
  | 'three_times_daily'
  | 'four_times_daily'
  | 'every_morning'
  | 'every_evening'
  | 'every_8_hours'
  | 'every_12_hours'
  | 'every_other_day'
  | 'weekly'
  | 'as_needed';

/**
 * Dosage unit for medications
 */
/**
 * Dosage unit for medications
 * 
 * Defines all possible units for medication dosages,
 * supporting various medication forms and administration routes.
 */
export type DosageUnit = 'mg' | 'g' | 'mcg' | 'mL' | 'tablet' | 'capsule' | 'unit' | 'spray' | 'drop';

/**
 * Base medications with different regimens and frequencies
 * 
 * This collection provides a diverse set of medication fixtures covering various
 * dosage regimens, frequencies, durations, and reminder settings. It includes:
 * - Daily medications (morning, evening)
 * - Multiple-times-per-day medications
 * - Interval-based medications (every 8 hours, every 12 hours)
 * - Weekly medications
 * - As-needed medications
 * - Medications with and without end dates
 * - Medications with and without reminders
 * - Active and inactive medications
 * 
 * These fixtures serve as the foundation for more specialized test scenarios.
 */
const baseMedications: IMedication[] = [
  // Daily medications
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    userId: 'user-123',
    name: 'Atorvastatin',
    dosage: 20,
    frequency: 'once_daily',
    startDate: new Date('2023-01-01'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take in the evening with food',
    active: true,
    createdAt: new Date('2023-01-01T10:00:00Z'),
    updatedAt: new Date('2023-01-01T10:00:00Z')
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    userId: 'user-123',
    name: 'Lisinopril',
    dosage: 10,
    frequency: 'once_daily',
    startDate: new Date('2023-01-15'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take in the morning',
    active: true,
    createdAt: new Date('2023-01-15T09:30:00Z'),
    updatedAt: new Date('2023-01-15T09:30:00Z')
  },
  
  // Multiple times per day medications
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    userId: 'user-123',
    name: 'Metformin',
    dosage: 500,
    frequency: 'twice_daily',
    startDate: new Date('2023-02-01'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take with breakfast and dinner',
    active: true,
    createdAt: new Date('2023-02-01T08:15:00Z'),
    updatedAt: new Date('2023-02-01T08:15:00Z')
  },
  {
    id: '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s',
    userId: 'user-123',
    name: 'Ibuprofen',
    dosage: 400,
    frequency: 'three_times_daily',
    startDate: new Date('2023-02-15'),
    endDate: new Date('2023-02-28'),
    reminderEnabled: true,
    notes: 'Take with food for pain relief',
    active: false,
    createdAt: new Date('2023-02-15T14:20:00Z'),
    updatedAt: new Date('2023-03-01T09:00:00Z')
  },
  
  // Interval-based medications
  {
    id: '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t',
    userId: 'user-123',
    name: 'Amoxicillin',
    dosage: 500,
    frequency: 'every_8_hours',
    startDate: new Date('2023-03-10'),
    endDate: new Date('2023-03-17'),
    reminderEnabled: true,
    notes: 'Complete full course of antibiotics',
    active: false,
    createdAt: new Date('2023-03-10T11:45:00Z'),
    updatedAt: new Date('2023-03-17T18:30:00Z')
  },
  {
    id: '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u',
    userId: 'user-123',
    name: 'Levothyroxine',
    dosage: 75,
    frequency: 'every_morning',
    startDate: new Date('2023-01-05'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take on empty stomach 30 minutes before breakfast',
    active: true,
    createdAt: new Date('2023-01-05T08:00:00Z'),
    updatedAt: new Date('2023-01-05T08:00:00Z')
  },
  
  // Less frequent medications
  {
    id: '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v',
    userId: 'user-123',
    name: 'Alendronate',
    dosage: 70,
    frequency: 'weekly',
    startDate: new Date('2023-01-07'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take on Saturday morning with water, remain upright for 30 minutes',
    active: true,
    createdAt: new Date('2023-01-07T07:30:00Z'),
    updatedAt: new Date('2023-01-07T07:30:00Z')
  },
  {
    id: '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w',
    userId: 'user-123',
    name: 'Vitamin D',
    dosage: 50000,
    frequency: 'weekly',
    startDate: new Date('2023-02-05'),
    endDate: new Date('2023-04-30'),
    reminderEnabled: false,
    notes: 'Take on Sundays',
    active: true,
    createdAt: new Date('2023-02-05T12:00:00Z'),
    updatedAt: new Date('2023-02-05T12:00:00Z')
  },
  
  // As needed medications
  {
    id: '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x',
    userId: 'user-123',
    name: 'Loratadine',
    dosage: 10,
    frequency: 'as_needed',
    startDate: new Date('2023-03-01'),
    endDate: null,
    reminderEnabled: false,
    notes: 'Take for allergy symptoms, not more than once daily',
    active: true,
    createdAt: new Date('2023-03-01T15:45:00Z'),
    updatedAt: new Date('2023-03-01T15:45:00Z')
  },
  {
    id: '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y',
    userId: 'user-123',
    name: 'Salbutamol Inhaler',
    dosage: 100,
    frequency: 'as_needed',
    startDate: new Date('2023-01-20'),
    endDate: null,
    reminderEnabled: false,
    notes: 'Use for shortness of breath or wheezing, 2 puffs as needed',
    active: true,
    createdAt: new Date('2023-01-20T16:30:00Z'),
    updatedAt: new Date('2023-01-20T16:30:00Z')
  },
  
  // Medications for different user
  {
    id: '1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6z',
    userId: 'user-456',
    name: 'Simvastatin',
    dosage: 40,
    frequency: 'once_daily',
    startDate: new Date('2023-02-10'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take in the evening',
    active: true,
    createdAt: new Date('2023-02-10T19:00:00Z'),
    updatedAt: new Date('2023-02-10T19:00:00Z')
  },
  {
    id: '2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7a',
    userId: 'user-456',
    name: 'Omeprazole',
    dosage: 20,
    frequency: 'once_daily',
    startDate: new Date('2023-01-25'),
    endDate: null,
    reminderEnabled: true,
    notes: 'Take before breakfast',
    active: true,
    createdAt: new Date('2023-01-25T08:45:00Z'),
    updatedAt: new Date('2023-01-25T08:45:00Z')
  }
];

/**
 * Medications with adherence data for testing adherence tracking and gamification
 * 
 * This collection extends the base medications with adherence metrics to support
 * testing of adherence tracking, reporting, and gamification features. It includes:
 * - Perfect adherence (100% of doses taken)
 * - Good adherence (90-95% of doses taken)
 * - Moderate adherence (70-75% of doses taken)
 * - Poor adherence (40-50% of doses taken)
 * - Variable adherence (60-65% of doses taken)
 * 
 * These fixtures can be used to test adherence calculations, achievement eligibility,
 * gamification rewards, and adherence improvement interventions.
 */
const medicationsWithAdherence: MedicationFixtureWithAdherence[] = [
  // Perfect adherence
  {
    ...baseMedications[0],
    adherenceRate: 100,
    adherencePattern: 'perfect',
    dosesTaken: 90,
    dosesMissed: 0
  },
  {
    ...baseMedications[5],
    adherenceRate: 100,
    adherencePattern: 'perfect',
    dosesTaken: 90,
    dosesMissed: 0
  },
  
  // Good adherence
  {
    ...baseMedications[1],
    adherenceRate: 95,
    adherencePattern: 'good',
    dosesTaken: 85,
    dosesMissed: 5
  },
  {
    ...baseMedications[2],
    adherenceRate: 90,
    adherencePattern: 'good',
    dosesTaken: 162,
    dosesMissed: 18
  },
  
  // Moderate adherence
  {
    ...baseMedications[6],
    adherenceRate: 75,
    adherencePattern: 'moderate',
    dosesTaken: 10,
    dosesMissed: 3
  },
  {
    ...baseMedications[7],
    adherenceRate: 70,
    adherencePattern: 'moderate',
    dosesTaken: 9,
    dosesMissed: 4
  },
  
  // Poor adherence
  {
    ...baseMedications[3],
    adherenceRate: 40,
    adherencePattern: 'poor',
    dosesTaken: 16,
    dosesMissed: 24
  },
  {
    ...baseMedications[4],
    adherenceRate: 50,
    adherencePattern: 'poor',
    dosesTaken: 10,
    dosesMissed: 10
  },
  
  // Variable adherence
  {
    ...baseMedications[8],
    adherenceRate: 60,
    adherencePattern: 'variable',
    dosesTaken: 18,
    dosesMissed: 12
  },
  {
    ...baseMedications[9],
    adherenceRate: 65,
    adherencePattern: 'variable',
    dosesTaken: 20,
    dosesMissed: 10
  }
];

/**
 * Get all medication fixtures
 * 
 * @returns Array of all medication fixtures
 */
export function getAllMedications(): IMedication[] {
  return [...baseMedications];
}

/**
 * Get medications by active status
 * 
 * @param active Whether to get active or inactive medications
 * @returns Array of medications filtered by active status
 */
export function getMedicationsByStatus(active: boolean): IMedication[] {
  return baseMedications.filter(med => med.active === active);
}

/**
 * Get medications by reminder status
 * 
 * @param reminderEnabled Whether to get medications with reminders enabled or disabled
 * @returns Array of medications filtered by reminder status
 */
export function getMedicationsByReminderStatus(reminderEnabled: boolean): IMedication[] {
  return baseMedications.filter(med => med.reminderEnabled === reminderEnabled);
}

/**
 * Get medications by user ID
 * 
 * @param userId The user ID to filter by
 * @returns Array of medications for the specified user
 */
export function getMedicationsByUserId(userId: string): IMedication[] {
  return baseMedications.filter(med => med.userId === userId);
}

/**
 * Get medications by frequency
 * 
 * @param frequency The medication frequency to filter by
 * @returns Array of medications with the specified frequency
 */
export function getMedicationsByFrequency(frequency: MedicationFrequency): IMedication[] {
  return baseMedications.filter(med => med.frequency === frequency);
}

/**
 * Get medications by date range
 * 
 * @param startDate The start date of the range
 * @param endDate The end date of the range
 * @returns Array of medications active within the specified date range
 */
export function getMedicationsByDateRange(startDate: Date, endDate: Date): IMedication[] {
  return baseMedications.filter(med => {
    const medStartDate = new Date(med.startDate);
    const medEndDate = med.endDate ? new Date(med.endDate) : null;
    
    // Medication starts before or on the end date of the range
    const startsBeforeRangeEnd = medStartDate <= endDate;
    
    // Medication ends after or on the start date of the range, or has no end date
    const endsAfterRangeStart = !medEndDate || medEndDate >= startDate;
    
    return startsBeforeRangeEnd && endsAfterRangeStart;
  });
}

/**
 * Get medications by ID
 * 
 * @param id The medication ID to find
 * @returns The medication with the specified ID, or undefined if not found
 */
export function getMedicationById(id: string): IMedication | undefined {
  return baseMedications.find(med => med.id === id);
}

/**
 * Get medications with adherence data
 * 
 * @returns Array of medications with adherence data
 */
export function getMedicationsWithAdherence(): MedicationFixtureWithAdherence[] {
  return [...medicationsWithAdherence];
}

/**
 * Get medications with adherence data by adherence pattern
 * 
 * @param pattern The adherence pattern to filter by
 * @returns Array of medications with the specified adherence pattern
 */
export function getMedicationsByAdherencePattern(
  pattern: 'perfect' | 'good' | 'moderate' | 'poor' | 'variable'
): MedicationFixtureWithAdherence[] {
  return medicationsWithAdherence.filter(med => med.adherencePattern === pattern);
}

/**
 * Get medications with adherence data by adherence rate range
 * 
 * @param minRate The minimum adherence rate (inclusive)
 * @param maxRate The maximum adherence rate (inclusive)
 * @returns Array of medications within the specified adherence rate range
 */
export function getMedicationsByAdherenceRateRange(
  minRate: number,
  maxRate: number
): MedicationFixtureWithAdherence[] {
  return medicationsWithAdherence.filter(
    med => med.adherenceRate >= minRate && med.adherenceRate <= maxRate
  );
}

/**
 * Create a custom medication fixture
 * 
 * @param overrides Properties to override in the base medication
 * @returns A new medication fixture with the specified overrides
 */
export function createMedicationFixture(overrides: Partial<IMedication> = {}): IMedication {
  const now = new Date();
  
  // Default base medication
  const baseMedication: IMedication = {
    id: uuidv4(),
    userId: 'user-test',
    name: 'Test Medication',
    dosage: 100,
    frequency: 'once_daily',
    startDate: now,
    endDate: null,
    reminderEnabled: true,
    notes: 'Test medication notes',
    active: true,
    createdAt: now,
    updatedAt: now
  };
  
  return {
    ...baseMedication,
    ...overrides
  };
}

/**
 * Create a custom medication fixture with adherence data
 * 
 * @param overrides Properties to override in the base medication with adherence
 * @returns A new medication fixture with adherence data and the specified overrides
 */
export function createMedicationWithAdherenceFixture(
  overrides: Partial<MedicationFixtureWithAdherence> = {}
): MedicationFixtureWithAdherence {
  const baseMedication = createMedicationFixture();
  
  // Default adherence data
  const baseWithAdherence: MedicationFixtureWithAdherence = {
    ...baseMedication,
    adherenceRate: 80,
    adherencePattern: 'good',
    dosesTaken: 24,
    dosesMissed: 6
  };
  
  return {
    ...baseWithAdherence,
    ...overrides
  };
}

/**
 * Create a batch of medication fixtures
 * 
 * @param count Number of fixtures to create
 * @param baseOverrides Properties to override in all created fixtures
 * @param individualOverrides Array of individual overrides for specific fixtures
 * @returns Array of medication fixtures
 */
export function createMedicationFixtureBatch(
  count: number,
  baseOverrides: Partial<IMedication> = {},
  individualOverrides: Partial<IMedication>[] = []
): IMedication[] {
  return Array.from({ length: count }, (_, index) => {
    const individual = individualOverrides[index] || {};
    return createMedicationFixture({
      ...baseOverrides,
      ...individual,
      id: uuidv4()
    });
  });
}

/**
 * Create a medication regimen fixture set with multiple related medications
 * 
 * This function creates a set of related medications that form a complete treatment regimen
 * for a user. This is useful for testing scenarios where users have multiple medications
 * that need to be taken together or as part of a comprehensive treatment plan.
 * 
 * The created medications will have different frequencies but the same start date,
 * simulating a regimen prescribed together.
 * 
 * @param userId User ID for the medication regimen
 * @param count Number of medications in the regimen
 * @returns Array of related medications forming a regimen
 */
export function createMedicationRegimenFixture(
  userId: string,
  count: number = 3
): IMedication[] {
  const now = new Date();
  const frequencies: MedicationFrequency[] = [
    'once_daily',
    'twice_daily',
    'every_morning',
    'every_evening',
    'weekly'
  ];
  
  return Array.from({ length: count }, (_, index) => {
    const frequency = frequencies[index % frequencies.length];
    return createMedicationFixture({
      userId,
      frequency,
      startDate: now,
      id: uuidv4()
    });
  });
}

/**
 * Get a set of fixtures for testing medication reminders
 * 
 * This function provides fixtures for testing the reminder system with various scenarios:
 * - Medications due at different times of the day
 * - Medications with multiple daily doses
 * - Medications starting in the future
 * - Medications that have ended
 * - Medications with reminders disabled
 * - As-needed medications
 * - Medications that need refills
 * 
 * @returns Object containing different categories of medications for reminder testing
 */
export function getMedicationReminderTestFixtures() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Create medications with different reminder scenarios
  const dueTodayMorning = createMedicationFixture({
    name: 'Morning Medication',
    frequency: 'every_morning',
    reminderEnabled: true,
    startDate: yesterday
  });
  
  const dueTodayEvening = createMedicationFixture({
    name: 'Evening Medication',
    frequency: 'every_evening',
    reminderEnabled: true,
    startDate: yesterday
  });
  
  const dueMultipleTimesToday = createMedicationFixture({
    name: 'Multiple Times Medication',
    frequency: 'three_times_daily',
    reminderEnabled: true,
    startDate: yesterday
  });
  
  const startsTomorrow = createMedicationFixture({
    name: 'Starting Tomorrow',
    frequency: 'once_daily',
    reminderEnabled: true,
    startDate: tomorrow
  });
  
  const endedYesterday = createMedicationFixture({
    name: 'Ended Yesterday',
    frequency: 'twice_daily',
    reminderEnabled: true,
    startDate: new Date(yesterday.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week before yesterday
    endDate: yesterday,
    active: false
  });
  
  const reminderDisabled = createMedicationFixture({
    name: 'No Reminders',
    frequency: 'once_daily',
    reminderEnabled: false,
    startDate: yesterday
  });
  
  const asNeeded = createMedicationFixture({
    name: 'As Needed Medication',
    frequency: 'as_needed',
    reminderEnabled: false,
    startDate: yesterday
  });
  
  const almostEmpty = createMedicationFixture({
    name: 'Almost Empty Medication',
    frequency: 'once_daily',
    reminderEnabled: true,
    startDate: yesterday,
    notes: 'Only 3 pills remaining, needs refill'
  });
  
  return {
    dueToday: {
      morning: dueTodayMorning,
      evening: dueTodayEvening,
      multipleTimes: dueMultipleTimesToday
    },
    upcoming: {
      startsTomorrow,
      asNeeded
    },
    completed: {
      endedYesterday
    },
    special: {
      reminderDisabled,
      almostEmpty
    },
    all: [
      dueTodayMorning,
      dueTodayEvening,
      dueMultipleTimesToday,
      startsTomorrow,
      endedYesterday,
      reminderDisabled,
      asNeeded,
      almostEmpty
    ]
  };
}

/**
 * Get a set of fixtures for testing medication adherence tracking and gamification
 * 
 * This function provides a comprehensive set of fixtures for testing adherence tracking,
 * gamification integration, achievement eligibility, and adherence reporting. It includes
 * medications with various adherence patterns and a user scenario with mixed adherence.
 * 
 * @returns Object containing different adherence patterns for testing
 */
export function getMedicationAdherenceTestFixtures() {
  // Get medications with different adherence patterns
  const perfectAdherence = getMedicationsByAdherencePattern('perfect');
  const goodAdherence = getMedicationsByAdherencePattern('good');
  const moderateAdherence = getMedicationsByAdherencePattern('moderate');
  const poorAdherence = getMedicationsByAdherencePattern('poor');
  const variableAdherence = getMedicationsByAdherencePattern('variable');
  
  // Create a user with multiple medications and mixed adherence
  const userId = 'adherence-test-user';
  const userMedications = createMedicationFixtureBatch(5, { userId });
  const userMedicationsWithAdherence = userMedications.map((med, index) => {
    const adherenceRates = [100, 90, 75, 50, 30];
    const adherencePatterns: Array<'perfect' | 'good' | 'moderate' | 'poor' | 'variable'> = [
      'perfect', 'good', 'moderate', 'poor', 'variable'
    ];
    const dosesTaken = [30, 27, 22, 15, 9];
    const dosesMissed = [0, 3, 8, 15, 21];
    
    return {
      ...med,
      adherenceRate: adherenceRates[index],
      adherencePattern: adherencePatterns[index],
      dosesTaken: dosesTaken[index],
      dosesMissed: dosesMissed[index]
    } as MedicationFixtureWithAdherence;
  });
  
  return {
    byPattern: {
      perfect: perfectAdherence,
      good: goodAdherence,
      moderate: moderateAdherence,
      poor: poorAdherence,
      variable: variableAdherence
    },
    byRate: {
      excellent: getMedicationsByAdherenceRateRange(90, 100),
      good: getMedicationsByAdherenceRateRange(75, 89),
      moderate: getMedicationsByAdherenceRateRange(50, 74),
      poor: getMedicationsByAdherenceRateRange(0, 49)
    },
    userScenario: {
      userId,
      medications: userMedicationsWithAdherence,
      overallAdherenceRate: 69, // Average of the 5 medications
      achievementEligible: false // Below 80% threshold for achievement
    }
  };
}

/**
 * Get a set of fixtures for testing medication refill reminders
 * 
 * This function provides fixtures for testing the refill reminder system with various scenarios:
 * - Medications that need urgent refills
 * - Medications that need refills soon
 * - Recently refilled medications
 * - Medications with auto-refill enabled
 * - Medications with expired prescriptions
 * 
 * These fixtures can be used to test refill notification timing, urgency classification,
 * and integration with notification services.
 * 
 * @returns Object containing medications in different refill states
 */
export function getMedicationRefillTestFixtures() {
  const now = new Date();
  
  // Create medications with different refill scenarios
  const needsRefillUrgent = createMedicationFixture({
    name: 'Urgent Refill Needed',
    notes: 'Only 2 pills remaining, refill needed urgently',
    active: true
  });
  
  const needsRefillSoon = createMedicationFixture({
    name: 'Refill Needed Soon',
    notes: '7 pills remaining, refill needed within a week',
    active: true
  });
  
  const recentlyRefilled = createMedicationFixture({
    name: 'Recently Refilled',
    notes: 'Refilled on ' + now.toISOString().split('T')[0] + ', 30 pills',
    active: true
  });
  
  const autoRefillEnabled = createMedicationFixture({
    name: 'Auto-Refill Enabled',
    notes: 'Auto-refill scheduled for next week',
    active: true
  });
  
  const refillExpired = createMedicationFixture({
    name: 'Prescription Expired',
    notes: 'Prescription expired, needs doctor appointment',
    active: true
  });
  
  return {
    urgent: needsRefillUrgent,
    soon: needsRefillSoon,
    recent: recentlyRefilled,
    auto: autoRefillEnabled,
    expired: refillExpired,
    all: [
      needsRefillUrgent,
      needsRefillSoon,
      recentlyRefilled,
      autoRefillEnabled,
      refillExpired
    ]
  };
}

/**
 * Default export for easier importing
 * 
 * Provides a convenient way to import all medication fixture functions
 * as a single object, improving developer experience and code organization.
 */
export default {
  getAllMedications,
  getMedicationsByStatus,
  getMedicationsByReminderStatus,
  getMedicationsByUserId,
  getMedicationsByFrequency,
  getMedicationsByDateRange,
  getMedicationById,
  getMedicationsWithAdherence,
  getMedicationsByAdherencePattern,
  getMedicationsByAdherenceRateRange,
  createMedicationFixture,
  createMedicationWithAdherenceFixture,
  createMedicationFixtureBatch,
  createMedicationRegimenFixture,
  getMedicationReminderTestFixtures,
  getMedicationAdherenceTestFixtures,
  getMedicationRefillTestFixtures
};