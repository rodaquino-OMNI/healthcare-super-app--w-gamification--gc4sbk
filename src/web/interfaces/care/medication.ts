/**
 * @file Medication interface for the AUSTA SuperApp Care journey
 * 
 * This file defines the Medication interface and related types for tracking medications,
 * dosage instructions, schedules, reminders, and adherence in the Care journey.
 */

/**
 * Frequency type for medication schedules
 * Defines how often a medication should be taken
 */
export enum MedicationFrequency {
  /** Take once daily */
  DAILY = 'DAILY',
  /** Take twice daily (morning and evening) */
  TWICE_DAILY = 'TWICE_DAILY',
  /** Take three times daily (morning, afternoon, evening) */
  THREE_TIMES_DAILY = 'THREE_TIMES_DAILY',
  /** Take four times daily */
  FOUR_TIMES_DAILY = 'FOUR_TIMES_DAILY',
  /** Take every other day */
  EVERY_OTHER_DAY = 'EVERY_OTHER_DAY',
  /** Take weekly */
  WEEKLY = 'WEEKLY',
  /** Take monthly */
  MONTHLY = 'MONTHLY',
  /** Take as needed */
  AS_NEEDED = 'AS_NEEDED',
  /** Custom schedule defined in the schedule field */
  CUSTOM = 'CUSTOM',
}

/**
 * Medication form/type
 * Describes the physical form of the medication
 */
export enum MedicationForm {
  /** Tablet to be swallowed */
  TABLET = 'TABLET',
  /** Capsule to be swallowed */
  CAPSULE = 'CAPSULE',
  /** Liquid to be swallowed */
  LIQUID = 'LIQUID',
  /** Topical application to skin */
  TOPICAL = 'TOPICAL',
  /** Inhaled medication */
  INHALER = 'INHALER',
  /** Injection */
  INJECTION = 'INJECTION',
  /** Drops (eye, ear) */
  DROPS = 'DROPS',
  /** Spray (nasal, oral) */
  SPRAY = 'SPRAY',
  /** Patch applied to skin */
  PATCH = 'PATCH',
  /** Other forms not listed */
  OTHER = 'OTHER',
}

/**
 * Status of a medication in the user's regimen
 */
export enum MedicationStatus {
  /** Currently active medication */
  ACTIVE = 'ACTIVE',
  /** Medication that has been completed */
  COMPLETED = 'COMPLETED',
  /** Medication that has been discontinued */
  DISCONTINUED = 'DISCONTINUED',
  /** Medication that is on hold */
  ON_HOLD = 'ON_HOLD',
}

/**
 * Time of day for medication reminders
 */
export enum MedicationTime {
  /** Morning reminder */
  MORNING = 'MORNING',
  /** Noon reminder */
  NOON = 'NOON',
  /** Afternoon reminder */
  AFTERNOON = 'AFTERNOON',
  /** Evening reminder */
  EVENING = 'EVENING',
  /** Bedtime reminder */
  BEDTIME = 'BEDTIME',
}

/**
 * Reminder settings for medication
 */
export interface MedicationReminder {
  /** Unique identifier for the reminder */
  id: string;
  /** Whether the reminder is enabled */
  enabled: boolean;
  /** Time of day for the reminder */
  time: MedicationTime | string;
  /** Specific time for the reminder (ISO string or HH:MM format) */
  specificTime?: string;
  /** Days of the week for the reminder (0 = Sunday, 6 = Saturday) */
  daysOfWeek?: number[];
  /** Whether to send a notification for this reminder */
  sendNotification: boolean;
  /** Custom message for the notification */
  notificationMessage?: string;
  /** Notification ID for tracking in the notification system */
  notificationId?: string;
}

/**
 * Medication adherence tracking
 */
export interface MedicationAdherence {
  /** Date of the adherence record (ISO string) */
  date: string;
  /** Whether the medication was taken */
  taken: boolean;
  /** Time the medication was taken (ISO string) */
  takenAt?: string;
  /** Whether the medication was taken on time */
  takenOnTime?: boolean;
  /** Notes about the adherence (e.g., side effects, reasons for missing) */
  notes?: string;
}

/**
 * Medication interface for tracking medications in the Care journey
 * 
 * @example
 * // Regular daily medication with morning and evening reminders
 * const metformin: Medication = {
 *   id: '123',
 *   userId: 'user-456',
 *   name: 'Metformin',
 *   genericName: 'Metformin Hydrochloride',
 *   dosage: '500mg',
 *   form: MedicationForm.TABLET,
 *   instructions: 'Take with food to reduce stomach upset',
 *   frequency: MedicationFrequency.TWICE_DAILY,
 *   startDate: '2023-01-15',
 *   endDate: '2023-07-15',
 *   prescribedBy: 'Dr. Maria Silva',
 *   pharmacy: 'Farmácia São Paulo',
 *   status: MedicationStatus.ACTIVE,
 *   reminders: [
 *     {
 *       id: 'rem-1',
 *       enabled: true,
 *       time: MedicationTime.MORNING,
 *       specificTime: '08:00',
 *       sendNotification: true,
 *       notificationMessage: 'Time to take your Metformin with breakfast',
 *       notificationId: 'notif-123'
 *     },
 *     {
 *       id: 'rem-2',
 *       enabled: true,
 *       time: MedicationTime.EVENING,
 *       specificTime: '20:00',
 *       sendNotification: true,
 *       notificationMessage: 'Time to take your Metformin with dinner',
 *       notificationId: 'notif-124'
 *     }
 *   ],
 *   adherenceRecords: [
 *     {
 *       date: '2023-01-15',
 *       taken: true,
 *       takenAt: '2023-01-15T08:15:00Z',
 *       takenOnTime: true
 *     },
 *     {
 *       date: '2023-01-15',
 *       taken: true,
 *       takenAt: '2023-01-15T20:30:00Z',
 *       takenOnTime: false,
 *       notes: 'Took 30 minutes late due to dinner delay'
 *     }
 *   ]
 * };
 * 
 * @example
 * // As-needed pain medication with custom schedule
 * const painMedication: Medication = {
 *   id: '456',
 *   userId: 'user-456',
 *   name: 'Ibuprofen',
 *   genericName: 'Ibuprofen',
 *   dosage: '400mg',
 *   form: MedicationForm.TABLET,
 *   instructions: 'Take as needed for pain, not to exceed 3 tablets in 24 hours',
 *   frequency: MedicationFrequency.AS_NEEDED,
 *   startDate: '2023-02-10',
 *   prescribedBy: 'Dr. Carlos Mendes',
 *   status: MedicationStatus.ACTIVE,
 *   maxDailyDose: '1200mg',
 *   reminders: [],
 *   adherenceRecords: [
 *     {
 *       date: '2023-02-10',
 *       taken: true,
 *       takenAt: '2023-02-10T14:20:00Z',
 *       notes: 'Taken for headache'
 *     }
 *   ]
 * };
 */
export interface Medication {
  /** Unique identifier for the medication */
  id: string;
  /** User ID associated with this medication */
  userId: string;
  /** Name of the medication */
  name: string;
  /** Generic name of the medication */
  genericName?: string;
  /** Dosage amount (e.g., "500mg", "10ml") */
  dosage: string;
  /** Physical form of the medication */
  form: MedicationForm;
  /** Special instructions for taking the medication */
  instructions?: string;
  /** How often the medication should be taken */
  frequency: MedicationFrequency;
  /** Custom schedule details for CUSTOM frequency */
  customSchedule?: string;
  /** Date when medication regimen starts (ISO string) */
  startDate: string;
  /** Date when medication regimen ends (ISO string), if applicable */
  endDate?: string;
  /** Healthcare provider who prescribed the medication */
  prescribedBy?: string;
  /** Pharmacy where the prescription was filled */
  pharmacy?: string;
  /** Current status of the medication in the user's regimen */
  status: MedicationStatus;
  /** Reason for discontinuation if status is DISCONTINUED */
  discontinuationReason?: string;
  /** Maximum daily dose for AS_NEEDED medications */
  maxDailyDose?: string;
  /** Whether the medication is a controlled substance */
  isControlled?: boolean;
  /** Array of reminders for this medication */
  reminders: MedicationReminder[];
  /** Array of adherence records for this medication */
  adherenceRecords?: MedicationAdherence[];
  /** Notes about the medication */
  notes?: string;
  /** Image URL of the medication for visual identification */
  imageUrl?: string;
  /** Potential side effects of the medication */
  sideEffects?: string[];
  /** Potential interactions with other medications */
  interactions?: string[];
  /** Whether the medication should be taken with food */
  takeWithFood?: boolean;
  /** Whether the medication should be taken with water */
  takeWithWater?: boolean;
  /** Whether the medication should be stored in a refrigerator */
  refrigerate?: boolean;
  /** Whether the medication is a refill */
  isRefill?: boolean;
  /** Number of refills remaining */
  refillsRemaining?: number;
  /** Date when the next refill is due (ISO string) */
  nextRefillDate?: string;
  /** Whether to send a notification for refill reminders */
  sendRefillReminders?: boolean;
  /** Days in advance to send refill reminders */
  refillReminderDays?: number;
  /** Treatment plan ID if this medication is part of a treatment plan */
  treatmentPlanId?: string;
}