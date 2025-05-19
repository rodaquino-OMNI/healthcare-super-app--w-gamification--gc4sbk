/**
 * Interface representing a care activity in the Care Journey.
 * This interface defines the structure for healthcare activities that can be associated
 * with treatment plans within the AUSTA SuperApp.
 */
export interface ICareActivity {
  /**
   * Unique identifier for the care activity.
   */
  id: string;

  /**
   * Name of the care activity.
   */
  name: string;

  /**
   * Description of the care activity.
   */
  description?: string;

  /**
   * Type of the care activity (e.g., exercise, medication, therapy).
   */
  type: string;

  /**
   * Frequency of the care activity (e.g., daily, weekly).
   */
  frequency?: string;

  /**
   * Duration of the care activity in minutes.
   */
  durationMinutes?: number;

  /**
   * Date and time when the care activity was created.
   */
  createdAt: Date;

  /**
   * Date and time when the care activity was last updated.
   */
  updatedAt: Date;
}