/**
 * Medication Interface
 * 
 * Defines the Medication interface for the AUSTA SuperApp Care journey.
 * This interface represents medications that users need to track, including
 * properties for medication details, dosage instructions, schedule, reminders,
 * and adherence tracking.
 * 
 * @example
 * // Example of a medication object
 * const medication: Medication = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   name: 'Lisinopril',
 *   genericName: 'Lisinopril',
 *   strength: '10mg',
 *   medicationType: MedicationType.TABLET,
 *   prescribedBy: 'Dr. Maria Silva',
 *   prescriptionDate: new Date('2023-05-15'),
 *   instructions: 'Take with food in the morning',
 *   purpose: 'Blood pressure control',
 *   dosage: {
 *     amount: 1,
 *     unit: 'tablet',
 *     frequency: {
 *       times: 1,
 *       period: FrequencyPeriod.DAY,
 *     },
 *     timing: [{
 *       time: '08:00',
 *       withFood: true,
 *     }],
 *   },
 *   schedule: {
 *     startDate: new Date('2023-05-16'),
 *     endDate: new Date('2023-11-16'),
 *     daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
 *     isIndefinite: false,
 *   },
 *   reminders: [{
 *     id: '123e4567-e89b-12d3-a456-426614174002',
 *     enabled: true,
 *     time: '07:45',
 *     channels: [NotificationChannel.PUSH, NotificationChannel.IN_APP],
 *     priority: NotificationPriority.HIGH,
 *     advanceNotice: 15,
 *     snoozeOptions: [5, 10, 15],
 *   }],
 *   adherence: {
 *     totalDoses: 180,
 *     dosesTaken: 45,
 *     lastTaken: new Date('2023-06-30T08:05:00Z'),
 *     missedDoses: 2,
 *     streak: 15,
 *   },
 *   sideEffects: ['Dry cough', 'Dizziness'],
 *   interactions: ['Avoid potassium supplements', 'Limit alcohol consumption'],
 *   notes: 'Experiencing mild dizziness in the morning after taking',
 *   refills: {
 *     total: 5,
 *     remaining: 4,
 *     lastRefillDate: new Date('2023-05-15'),
 *     nextRefillDate: new Date('2023-06-15'),
 *   },
 *   pharmacy: {
 *     name: 'Farmácia Central',
 *     phone: '+55 11 3456-7890',
 *     address: 'Av. Paulista, 1000, São Paulo, SP',
 *   },
 *   createdAt: new Date('2023-05-15T14:30:00Z'),
 *   updatedAt: new Date('2023-06-30T08:05:00Z'),
 * };
 */

import { NotificationChannel, NotificationPriority } from '../notification/types';

/**
 * Enum representing different types of medications
 */
export enum MedicationType {
  /** Solid oral dose in tablet form */
  TABLET = 'tablet',
  
  /** Solid oral dose in capsule form */
  CAPSULE = 'capsule',
  
  /** Liquid oral medication */
  LIQUID = 'liquid',
  
  /** Topical cream or ointment */
  TOPICAL = 'topical',
  
  /** Medication delivered via injection */
  INJECTION = 'injection',
  
  /** Inhaled medication */
  INHALER = 'inhaler',
  
  /** Medication in patch form */
  PATCH = 'patch',
  
  /** Medication in drop form (eye, ear) */
  DROPS = 'drops',
  
  /** Medication in spray form */
  SPRAY = 'spray',
  
  /** Other medication types not listed */
  OTHER = 'other',
}

/**
 * Enum representing frequency periods for medication dosing
 */
export enum FrequencyPeriod {
  /** Once per day */
  DAY = 'day',
  
  /** Once per week */
  WEEK = 'week',
  
  /** Once per month */
  MONTH = 'month',
  
  /** As needed */
  AS_NEEDED = 'as_needed',
}

/**
 * Interface for medication dosage timing
 */
export interface DosageTiming {
  /** Time of day to take the medication (24-hour format, HH:MM) */
  time: string;
  
  /** Whether the medication should be taken with food */
  withFood?: boolean;
  
  /** Whether the medication should be taken on an empty stomach */
  onEmptyStomach?: boolean;
  
  /** Additional timing instructions */
  instructions?: string;
}

/**
 * Interface for medication dosage frequency
 */
export interface DosageFrequency {
  /** Number of times to take the medication */
  times: number;
  
  /** Period over which to take the medication */
  period: FrequencyPeriod;
  
  /** Specific days of the week (1-7, where 1 is Monday) if period is WEEK */
  specificDays?: number[];
  
  /** Specific dates of the month if period is MONTH */
  specificDates?: number[];
  
  /** Maximum doses allowed in a 24-hour period for AS_NEEDED medications */
  maxDosesPerDay?: number;
  
  /** Minimum hours between doses for AS_NEEDED medications */
  minHoursBetweenDoses?: number;
}

/**
 * Interface for medication dosage information
 */
export interface MedicationDosage {
  /** Amount of medication per dose */
  amount: number;
  
  /** Unit of measurement for the dose (tablet, ml, mg, etc.) */
  unit: string;
  
  /** Frequency of medication dosing */
  frequency: DosageFrequency;
  
  /** Specific timing details for each dose */
  timing: DosageTiming[];
  
  /** Whether dosage can be adjusted by the user */
  isAdjustable?: boolean;
  
  /** Additional dosage instructions */
  instructions?: string;
}

/**
 * Interface for medication schedule information
 */
export interface MedicationSchedule {
  /** Date to start taking the medication */
  startDate: Date;
  
  /** Date to stop taking the medication (if not indefinite) */
  endDate?: Date;
  
  /** Days of the week to take the medication (1-7, where 1 is Monday) */
  daysOfWeek?: number[];
  
  /** Whether the medication is to be taken indefinitely */
  isIndefinite: boolean;
  
  /** Whether the schedule is currently active */
  isActive?: boolean;
  
  /** Reason for pausing the schedule, if applicable */
  pauseReason?: string;
}

/**
 * Interface for medication reminder settings
 */
export interface MedicationReminder {
  /** Unique identifier for the reminder */
  id: string;
  
  /** Whether the reminder is enabled */
  enabled: boolean;
  
  /** Time to send the reminder (24-hour format, HH:MM) */
  time: string;
  
  /** Notification channels to use for the reminder */
  channels: NotificationChannel[];
  
  /** Priority level for the reminder notification */
  priority: NotificationPriority;
  
  /** Minutes before scheduled dose to send the reminder */
  advanceNotice?: number;
  
  /** Available snooze durations in minutes */
  snoozeOptions?: number[];
  
  /** Custom message for the reminder */
  customMessage?: string;
  
  /** Whether to include medication instructions in the reminder */
  includeInstructions?: boolean;
}

/**
 * Interface for medication adherence tracking
 */
export interface MedicationAdherence {
  /** Total number of doses scheduled */
  totalDoses: number;
  
  /** Number of doses taken */
  dosesTaken: number;
  
  /** Date and time when the medication was last taken */
  lastTaken?: Date;
  
  /** Number of doses missed */
  missedDoses: number;
  
  /** Current streak of consecutive doses taken as scheduled */
  streak: number;
  
  /** Adherence rate as a percentage (calculated) */
  adherenceRate?: number;
  
  /** History of dose taking events */
  history?: Array<{
    /** Date and time the dose was taken or missed */
    timestamp: Date;
    /** Whether the dose was taken */
    taken: boolean;
    /** Reason for missing the dose, if applicable */
    missedReason?: string;
  }>;
}

/**
 * Interface for medication refill information
 */
export interface MedicationRefill {
  /** Total number of refills authorized */
  total: number;
  
  /** Number of refills remaining */
  remaining: number;
  
  /** Date of the last refill */
  lastRefillDate?: Date;
  
  /** Expected date for the next refill */
  nextRefillDate?: Date;
  
  /** Whether automatic refills are enabled */
  autoRefill?: boolean;
  
  /** Number of days supply in each refill */
  daysSupply?: number;
  
  /** Prescription number for refills */
  prescriptionNumber?: string;
}

/**
 * Interface for pharmacy information
 */
export interface Pharmacy {
  /** Name of the pharmacy */
  name: string;
  
  /** Phone number of the pharmacy */
  phone?: string;
  
  /** Address of the pharmacy */
  address?: string;
  
  /** Hours of operation */
  hours?: string;
  
  /** Whether the pharmacy delivers */
  delivers?: boolean;
}

/**
 * Main interface for medication tracking in the Care journey
 */
export interface Medication {
  /** Unique identifier for the medication */
  id: string;
  
  /** ID of the user this medication belongs to */
  userId: string;
  
  /** Name of the medication */
  name: string;
  
  /** Generic name of the medication */
  genericName?: string;
  
  /** Strength of the medication (e.g., "10mg") */
  strength?: string;
  
  /** Type of medication */
  medicationType: MedicationType;
  
  /** Name of the prescribing healthcare provider */
  prescribedBy?: string;
  
  /** Date the medication was prescribed */
  prescriptionDate?: Date;
  
  /** Special instructions for taking the medication */
  instructions?: string;
  
  /** Medical purpose of the medication */
  purpose?: string;
  
  /** Detailed dosage information */
  dosage: MedicationDosage;
  
  /** Schedule for taking the medication */
  schedule: MedicationSchedule;
  
  /** Reminder settings for the medication */
  reminders?: MedicationReminder[];
  
  /** Adherence tracking information */
  adherence?: MedicationAdherence;
  
  /** Reported side effects */
  sideEffects?: string[];
  
  /** Known drug interactions */
  interactions?: string[];
  
  /** Additional notes about the medication */
  notes?: string;
  
  /** Refill information */
  refills?: MedicationRefill;
  
  /** Pharmacy information */
  pharmacy?: Pharmacy;
  
  /** Whether this is a prescription medication */
  isPrescription?: boolean;
  
  /** Whether this medication is currently active */
  isActive?: boolean;
  
  /** Date and time the medication was created */
  createdAt: Date;
  
  /** Date and time the medication was last updated */
  updatedAt: Date;
}

/**
 * Type guard to check if a string is a valid MedicationType
 * @param value - The string value to check
 * @returns True if the value is a valid MedicationType
 */
export function isMedicationType(value: string): value is MedicationType {
  return Object.values(MedicationType).includes(value as MedicationType);
}

/**
 * Type guard to check if a string is a valid FrequencyPeriod
 * @param value - The string value to check
 * @returns True if the value is a valid FrequencyPeriod
 */
export function isFrequencyPeriod(value: string): value is FrequencyPeriod {
  return Object.values(FrequencyPeriod).includes(value as FrequencyPeriod);
}

/**
 * Calculates the adherence rate for a medication
 * @param medication - The medication to calculate adherence for
 * @returns The adherence rate as a percentage
 */
export function calculateAdherenceRate(medication: Medication): number {
  if (!medication.adherence || medication.adherence.totalDoses === 0) {
    return 0;
  }
  
  return (medication.adherence.dosesTaken / medication.adherence.totalDoses) * 100;
}

/**
 * Determines if a medication needs a refill soon (within the next 7 days)
 * @param medication - The medication to check
 * @returns True if the medication needs a refill soon
 */
export function needsRefillSoon(medication: Medication): boolean {
  if (!medication.refills || !medication.refills.nextRefillDate) {
    return false;
  }
  
  const nextRefill = new Date(medication.refills.nextRefillDate);
  const today = new Date();
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);
  
  return nextRefill <= sevenDaysFromNow && medication.refills.remaining > 0;
}

/**
 * Creates a medication reminder notification data object
 * @param medication - The medication to create a reminder for
 * @param reminder - The specific reminder configuration
 * @returns A medication reminder notification data object
 */
export function createMedicationReminderData(medication: Medication, reminder: MedicationReminder): {
  medicationName: string;
  dosage: {
    amount: number;
    unit: string;
    instructions?: string;
  };
  scheduledTime: string;
  isRecurring: boolean;
  importance: 'low' | 'medium' | 'high';
  actions: Array<{
    type: 'taken' | 'snooze' | 'skip';
    label: string;
    url?: string;
  }>;
  currentStreak?: number;
  isActive: boolean;
} {
  // Map notification priority to importance
  let importance: 'low' | 'medium' | 'high' = 'medium';
  switch (reminder.priority) {
    case NotificationPriority.LOW:
      importance = 'low';
      break;
    case NotificationPriority.MEDIUM:
      importance = 'medium';
      break;
    case NotificationPriority.HIGH:
    case NotificationPriority.CRITICAL:
      importance = 'high';
      break;
  }
  
  return {
    medicationName: medication.name,
    dosage: {
      amount: medication.dosage.amount,
      unit: medication.dosage.unit,
      instructions: medication.instructions,
    },
    scheduledTime: reminder.time,
    isRecurring: medication.schedule.isIndefinite || !!medication.schedule.endDate,
    importance,
    actions: [
      {
        type: 'taken',
        label: 'Mark as Taken',
        url: `/care/medications/${medication.id}/taken`,
      },
      {
        type: 'snooze',
        label: 'Snooze',
        url: `/care/medications/${medication.id}/snooze`,
      },
      {
        type: 'skip',
        label: 'Skip',
        url: `/care/medications/${medication.id}/skip`,
      },
    ],
    currentStreak: medication.adherence?.streak,
    isActive: medication.isActive !== false && (medication.schedule.isActive !== false),
  };
}