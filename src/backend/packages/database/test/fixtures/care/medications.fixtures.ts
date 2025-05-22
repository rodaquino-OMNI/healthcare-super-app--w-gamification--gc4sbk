/**
 * @file Provides test fixtures for medication tracking with various dosage regimens, frequencies, reminder settings, and adherence patterns.
 * 
 * These fixtures are used to test medication management, reminder functionality, adherence tracking, and refill notification features
 * in the Care journey. The file includes standardized medication fixtures with different dosage patterns and frequencies,
 * factory functions for generating medication records with customizable properties, TypeScript interfaces for type-safe medication test data,
 * and various adherence scenarios for testing reminder and gamification features.
 */

import { IMedication } from '@austa/interfaces/journey/care';

/**
 * Interface for medication test fixture data with additional testing properties
 * Extends the base IMedication interface with properties specific to testing scenarios
 */
export interface IMedicationFixture extends IMedication {
  /**
   * Adherence rate for testing scenarios (0-100%)
   */
  adherenceRate?: number;
  
  /**
   * Array of dates when medication was taken (for adherence testing)
   */
  takenDates?: Date[];
  
  /**
   * Array of dates when medication was missed (for adherence testing)
   */
  missedDates?: Date[];
  
  /**
   * Number of refills remaining (for refill notification testing)
   */
  refillsRemaining?: number;
  
  /**
   * Date when refill is needed (for refill notification testing)
   */
  refillNeededDate?: Date;
}

/**
 * Frequency types for medications
 */
export enum MedicationFrequency {
  ONCE_DAILY = 'Once daily',
  TWICE_DAILY = 'Twice daily',
  THREE_TIMES_DAILY = 'Three times daily',
  FOUR_TIMES_DAILY = 'Four times daily',
  EVERY_MORNING = 'Every morning',
  EVERY_EVENING = 'Every evening',
  EVERY_NIGHT = 'Every night before bed',
  EVERY_OTHER_DAY = 'Every other day',
  WEEKLY = 'Once weekly',
  TWICE_WEEKLY = 'Twice weekly',
  MONTHLY = 'Once monthly',
  AS_NEEDED = 'As needed',
  EVERY_4_HOURS = 'Every 4 hours',
  EVERY_6_HOURS = 'Every 6 hours',
  EVERY_8_HOURS = 'Every 8 hours',
  EVERY_12_HOURS = 'Every 12 hours',
}

/**
 * Adherence pattern types for testing different medication adherence scenarios
 */
export enum AdherencePattern {
  PERFECT = 'perfect',           // 100% adherence
  GOOD = 'good',                // 80-99% adherence
  MODERATE = 'moderate',        // 50-79% adherence
  POOR = 'poor',                // 20-49% adherence
  VERY_POOR = 'very_poor',      // 0-19% adherence
  WEEKDAY_ONLY = 'weekday_only', // Only takes medication on weekdays
  WEEKEND_ONLY = 'weekend_only', // Only takes medication on weekends
  MORNING_ONLY = 'morning_only', // Only takes morning doses in multi-dose regimens
  EVENING_ONLY = 'evening_only', // Only takes evening doses in multi-dose regimens
  RANDOM = 'random',            // Random adherence pattern
}

/**
 * Factory function to create a base medication fixture
 * @param overrides - Optional properties to override default values
 * @returns A medication fixture with default values and any provided overrides
 */
export const createMedicationFixture = (overrides?: Partial<IMedicationFixture>): IMedicationFixture => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30); // 30 days ago
  const endDate = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate()); // 2 months from now
  
  return {
    id: `med-${Math.floor(Math.random() * 10000)}`,
    userId: 'user-1234',
    name: 'Test Medication',
    dosage: 500,
    frequency: MedicationFrequency.ONCE_DAILY,
    startDate,
    endDate,
    reminderEnabled: true,
    notes: 'Take with food',
    active: true,
    createdAt: new Date(startDate),
    updatedAt: new Date(startDate),
    adherenceRate: 100,
    takenDates: [],
    missedDates: [],
    refillsRemaining: 3,
    refillNeededDate: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()), // 1 month from now
    ...overrides,
  };
};

/**
 * Factory function to create medication fixtures with specific adherence patterns
 * @param baseFixture - Base medication fixture to apply adherence pattern to
 * @param pattern - Adherence pattern to apply
 * @param daysToGenerate - Number of days to generate adherence data for (default: 30)
 * @returns Medication fixture with adherence data
 */
export const createMedicationWithAdherence = (
  baseFixture: IMedicationFixture,
  pattern: AdherencePattern,
  daysToGenerate = 30
): IMedicationFixture => {
  const takenDates: Date[] = [];
  const missedDates: Date[] = [];
  const startDate = new Date(baseFixture.startDate);
  let adherenceRate = 0;
  
  // Generate dates based on the pattern
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Determine if medication was taken based on the pattern
    let taken = false;
    
    switch (pattern) {
      case AdherencePattern.PERFECT:
        taken = true;
        break;
      case AdherencePattern.GOOD:
        taken = Math.random() < 0.9; // 90% chance of taking
        break;
      case AdherencePattern.MODERATE:
        taken = Math.random() < 0.65; // 65% chance of taking
        break;
      case AdherencePattern.POOR:
        taken = Math.random() < 0.35; // 35% chance of taking
        break;
      case AdherencePattern.VERY_POOR:
        taken = Math.random() < 0.1; // 10% chance of taking
        break;
      case AdherencePattern.WEEKDAY_ONLY:
        taken = !isWeekend;
        break;
      case AdherencePattern.WEEKEND_ONLY:
        taken = isWeekend;
        break;
      case AdherencePattern.MORNING_ONLY:
        // For multi-dose regimens, only morning doses are taken
        if (
          baseFixture.frequency === MedicationFrequency.TWICE_DAILY ||
          baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY ||
          baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY
        ) {
          taken = true;
          // Add only morning dose
          const morningDate = new Date(currentDate);
          morningDate.setHours(8, 0, 0, 0);
          takenDates.push(morningDate);
          
          // Add missed doses for other times
          if (baseFixture.frequency === MedicationFrequency.TWICE_DAILY) {
            const eveningDate = new Date(currentDate);
            eveningDate.setHours(20, 0, 0, 0);
            missedDates.push(eveningDate);
          } else if (baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY) {
            const afternoonDate = new Date(currentDate);
            afternoonDate.setHours(14, 0, 0, 0);
            missedDates.push(afternoonDate);
            
            const eveningDate = new Date(currentDate);
            eveningDate.setHours(20, 0, 0, 0);
            missedDates.push(eveningDate);
          } else if (baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY) {
            const midmorningDate = new Date(currentDate);
            midmorningDate.setHours(12, 0, 0, 0);
            missedDates.push(midmorningDate);
            
            const afternoonDate = new Date(currentDate);
            afternoonDate.setHours(16, 0, 0, 0);
            missedDates.push(afternoonDate);
            
            const eveningDate = new Date(currentDate);
            eveningDate.setHours(20, 0, 0, 0);
            missedDates.push(eveningDate);
          }
          continue; // Skip the normal date adding logic
        } else {
          taken = true;
        }
        break;
      case AdherencePattern.EVENING_ONLY:
        // For multi-dose regimens, only evening doses are taken
        if (
          baseFixture.frequency === MedicationFrequency.TWICE_DAILY ||
          baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY ||
          baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY
        ) {
          taken = true;
          // Add only evening dose
          const eveningDate = new Date(currentDate);
          eveningDate.setHours(20, 0, 0, 0);
          takenDates.push(eveningDate);
          
          // Add missed doses for other times
          if (baseFixture.frequency === MedicationFrequency.TWICE_DAILY) {
            const morningDate = new Date(currentDate);
            morningDate.setHours(8, 0, 0, 0);
            missedDates.push(morningDate);
          } else if (baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY) {
            const morningDate = new Date(currentDate);
            morningDate.setHours(8, 0, 0, 0);
            missedDates.push(morningDate);
            
            const afternoonDate = new Date(currentDate);
            afternoonDate.setHours(14, 0, 0, 0);
            missedDates.push(afternoonDate);
          } else if (baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY) {
            const morningDate = new Date(currentDate);
            morningDate.setHours(8, 0, 0, 0);
            missedDates.push(morningDate);
            
            const midmorningDate = new Date(currentDate);
            midmorningDate.setHours(12, 0, 0, 0);
            missedDates.push(midmorningDate);
            
            const afternoonDate = new Date(currentDate);
            afternoonDate.setHours(16, 0, 0, 0);
            missedDates.push(afternoonDate);
          }
          continue; // Skip the normal date adding logic
        } else {
          taken = true;
        }
        break;
      case AdherencePattern.RANDOM:
        taken = Math.random() < 0.5; // 50% chance of taking
        break;
    }
    
    if (taken) {
      // For multiple daily doses, add multiple taken dates
      if (baseFixture.frequency === MedicationFrequency.ONCE_DAILY || 
          baseFixture.frequency === MedicationFrequency.EVERY_MORNING ||
          baseFixture.frequency === MedicationFrequency.EVERY_EVENING ||
          baseFixture.frequency === MedicationFrequency.EVERY_NIGHT) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0); // Morning dose at 8 AM
        takenDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.TWICE_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0); // Morning dose at 8 AM
        takenDates.push(morningDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0); // Evening dose at 8 PM
        takenDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0); // Morning dose at 8 AM
        takenDates.push(morningDate);
        
        const afternoonDate = new Date(currentDate);
        afternoonDate.setHours(14, 0, 0, 0); // Afternoon dose at 2 PM
        takenDates.push(afternoonDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0); // Evening dose at 8 PM
        takenDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0); // Morning dose at 8 AM
        takenDates.push(morningDate);
        
        const midmorningDate = new Date(currentDate);
        midmorningDate.setHours(12, 0, 0, 0); // Mid-morning dose at 12 PM
        takenDates.push(midmorningDate);
        
        const afternoonDate = new Date(currentDate);
        afternoonDate.setHours(16, 0, 0, 0); // Afternoon dose at 4 PM
        takenDates.push(afternoonDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0); // Evening dose at 8 PM
        takenDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_4_HOURS) {
        for (let hour = 8; hour < 24; hour += 4) {
          const doseDate = new Date(currentDate);
          doseDate.setHours(hour, 0, 0, 0);
          takenDates.push(doseDate);
        }
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_6_HOURS) {
        for (let hour = 6; hour < 24; hour += 6) {
          const doseDate = new Date(currentDate);
          doseDate.setHours(hour, 0, 0, 0);
          takenDates.push(doseDate);
        }
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_8_HOURS) {
        for (let hour = 8; hour < 24; hour += 8) {
          const doseDate = new Date(currentDate);
          doseDate.setHours(hour, 0, 0, 0);
          takenDates.push(doseDate);
        }
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_12_HOURS) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0); // Morning dose at 8 AM
        takenDates.push(morningDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0); // Evening dose at 8 PM
        takenDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.WEEKLY && i % 7 === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        takenDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.TWICE_WEEKLY && (i % 3 === 0 || i % 7 === 0)) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        takenDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.MONTHLY && i === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        takenDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_OTHER_DAY && i % 2 === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        takenDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.AS_NEEDED && Math.random() < 0.3) {
        // For as-needed medications, randomly take on some days (30% chance)
        const doseDate = new Date(currentDate);
        doseDate.setHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0); // Random time between 8 AM and 8 PM
        takenDates.push(doseDate);
      }
    } else {
      // Add to missed dates
      if (baseFixture.frequency === MedicationFrequency.ONCE_DAILY || 
          baseFixture.frequency === MedicationFrequency.EVERY_MORNING ||
          baseFixture.frequency === MedicationFrequency.EVERY_EVENING ||
          baseFixture.frequency === MedicationFrequency.EVERY_NIGHT) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        missedDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.TWICE_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0);
        missedDates.push(morningDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0);
        missedDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.THREE_TIMES_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0);
        missedDates.push(morningDate);
        
        const afternoonDate = new Date(currentDate);
        afternoonDate.setHours(14, 0, 0, 0);
        missedDates.push(afternoonDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0);
        missedDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.FOUR_TIMES_DAILY) {
        const morningDate = new Date(currentDate);
        morningDate.setHours(8, 0, 0, 0);
        missedDates.push(morningDate);
        
        const midmorningDate = new Date(currentDate);
        midmorningDate.setHours(12, 0, 0, 0);
        missedDates.push(midmorningDate);
        
        const afternoonDate = new Date(currentDate);
        afternoonDate.setHours(16, 0, 0, 0);
        missedDates.push(afternoonDate);
        
        const eveningDate = new Date(currentDate);
        eveningDate.setHours(20, 0, 0, 0);
        missedDates.push(eveningDate);
      } else if (baseFixture.frequency === MedicationFrequency.WEEKLY && i % 7 === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        missedDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.TWICE_WEEKLY && (i % 3 === 0 || i % 7 === 0)) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        missedDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.MONTHLY && i === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        missedDates.push(doseDate);
      } else if (baseFixture.frequency === MedicationFrequency.EVERY_OTHER_DAY && i % 2 === 0) {
        const doseDate = new Date(currentDate);
        doseDate.setHours(8, 0, 0, 0);
        missedDates.push(doseDate);
      }
    }
  }
  
  // Calculate adherence rate based on taken vs. missed dates
  const totalDoses = takenDates.length + missedDates.length;
  adherenceRate = totalDoses > 0 ? (takenDates.length / totalDoses) * 100 : 0;
  
  return {
    ...baseFixture,
    takenDates,
    missedDates,
    adherenceRate: Math.round(adherenceRate),
  };
};

/**
 * Factory function to create a medication fixture with refill information
 * @param baseFixture - Base medication fixture to apply refill information to
 * @param refillsRemaining - Number of refills remaining
 * @param daysUntilRefillNeeded - Number of days until refill is needed
 * @returns Medication fixture with refill information
 */
export const createMedicationWithRefill = (
  baseFixture: IMedicationFixture,
  refillsRemaining: number,
  daysUntilRefillNeeded: number
): IMedicationFixture => {
  const now = new Date();
  const refillNeededDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilRefillNeeded);
  
  return {
    ...baseFixture,
    refillsRemaining,
    refillNeededDate,
  };
};

// ===== STANDARD MEDICATION FIXTURES =====

/**
 * Daily medication fixture (once daily)
 */
export const dailyMedication = createMedicationFixture({
  id: 'med-daily-001',
  name: 'Lisinopril',
  dosage: 10,
  frequency: MedicationFrequency.ONCE_DAILY,
  notes: 'Take in the morning with water',
});

/**
 * Twice daily medication fixture
 */
export const twiceDailyMedication = createMedicationFixture({
  id: 'med-twice-001',
  name: 'Metformin',
  dosage: 500,
  frequency: MedicationFrequency.TWICE_DAILY,
  notes: 'Take with meals',
});

/**
 * Three times daily medication fixture
 */
export const threeTimesDailyMedication = createMedicationFixture({
  id: 'med-thrice-001',
  name: 'Amoxicillin',
  dosage: 250,
  frequency: MedicationFrequency.THREE_TIMES_DAILY,
  notes: 'Take with or without food',
  endDate: new Date(new Date().setDate(new Date().getDate() + 10)), // 10 days from now
});

/**
 * Weekly medication fixture
 */
export const weeklyMedication = createMedicationFixture({
  id: 'med-weekly-001',
  name: 'Methotrexate',
  dosage: 15,
  frequency: MedicationFrequency.WEEKLY,
  notes: 'Take on the same day each week',
});

/**
 * As-needed medication fixture
 */
export const asNeededMedication = createMedicationFixture({
  id: 'med-prn-001',
  name: 'Ibuprofen',
  dosage: 400,
  frequency: MedicationFrequency.AS_NEEDED,
  notes: 'Take for pain as needed, not to exceed 3 doses in 24 hours',
  reminderEnabled: false,
  endDate: null,
});

/**
 * Medication with perfect adherence
 */
export const perfectAdherenceMedication = createMedicationWithAdherence(
  createMedicationFixture({
    id: 'med-adherence-perfect',
    name: 'Atorvastatin',
    dosage: 20,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take at bedtime',
  }),
  AdherencePattern.PERFECT,
  30
);

/**
 * Medication with moderate adherence
 */
export const moderateAdherenceMedication = createMedicationWithAdherence(
  createMedicationFixture({
    id: 'med-adherence-moderate',
    name: 'Losartan',
    dosage: 50,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take in the morning',
  }),
  AdherencePattern.MODERATE,
  30
);

/**
 * Medication with poor adherence
 */
export const poorAdherenceMedication = createMedicationWithAdherence(
  createMedicationFixture({
    id: 'med-adherence-poor',
    name: 'Levothyroxine',
    dosage: 75,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take on an empty stomach 30 minutes before breakfast',
  }),
  AdherencePattern.POOR,
  30
);

/**
 * Medication with weekday-only adherence
 */
export const weekdayOnlyAdherenceMedication = createMedicationWithAdherence(
  createMedicationFixture({
    id: 'med-adherence-weekday',
    name: 'Escitalopram',
    dosage: 10,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take in the morning',
  }),
  AdherencePattern.WEEKDAY_ONLY,
  30
);

/**
 * Medication needing refill soon
 */
export const refillNeededSoonMedication = createMedicationWithRefill(
  createMedicationFixture({
    id: 'med-refill-soon',
    name: 'Amlodipine',
    dosage: 5,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take in the evening',
  }),
  1, // 1 refill remaining
  5  // Refill needed in 5 days
);

/**
 * Medication with no refills remaining
 */
export const noRefillsRemainingMedication = createMedicationWithRefill(
  createMedicationFixture({
    id: 'med-no-refills',
    name: 'Sertraline',
    dosage: 100,
    frequency: MedicationFrequency.ONCE_DAILY,
    notes: 'Take in the morning with food',
  }),
  0, // 0 refills remaining
  2  // Refill needed in 2 days
);

/**
 * Collection of all standard medication fixtures
 */
export const standardMedications = {
  dailyMedication,
  twiceDailyMedication,
  threeTimesDailyMedication,
  weeklyMedication,
  asNeededMedication,
  perfectAdherenceMedication,
  moderateAdherenceMedication,
  poorAdherenceMedication,
  weekdayOnlyAdherenceMedication,
  refillNeededSoonMedication,
  noRefillsRemainingMedication,
};

/**
 * Default export providing all medication fixtures
 */
export default standardMedications;