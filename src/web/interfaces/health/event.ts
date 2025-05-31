/**
 * Medical Event Interface for the AUSTA SuperApp Health Journey
 * 
 * This file defines the MedicalEvent interface and its corresponding Zod validation schema.
 * Medical events represent significant healthcare occurrences in a user's medical history,
 * such as doctor visits, diagnoses, procedures, vaccinations, and hospitalizations.
 * 
 * These events are displayed in the Medical History timeline within the Health Journey
 * and can be referenced by other components of the application.
 */

import { z } from 'zod'; // v3.22.4

/**
 * Represents a medical event in a user's health history
 * 
 * Medical events are significant healthcare occurrences that are tracked
 * as part of a user's comprehensive medical history. These events provide
 * context for health metrics and support care coordination across providers.
 * 
 * @example
 * // Doctor visit example
 * const doctorVisit: MedicalEvent = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   userId: '123e4567-e89b-12d3-a456-426614174001',
 *   type: 'DOCTOR_VISIT',
 *   description: 'Annual physical examination',
 *   date: '2023-04-15T10:30:00Z',
 *   provider: 'Dr. Maria Silva, Family Medicine',
 *   documents: ['lab_results.pdf', 'prescription.pdf']
 * };
 */
export interface MedicalEvent {
  /**
   * Unique identifier for the medical event
   * Used for referencing specific events in the timeline and for updates
   */
  id: string;

  /**
   * User identifier that owns this medical event
   * Links the event to a specific user account
   */
  userId: string;

  /**
   * Category of medical event
   * Common types include: DOCTOR_VISIT, DIAGNOSIS, PROCEDURE, VACCINATION,
   * HOSPITALIZATION, MEDICATION_CHANGE, LAB_TEST, IMAGING, EMERGENCY
   */
  type: string;

  /**
   * Detailed description of the medical event
   * Provides context and specific information about what occurred
   */
  description: string;

  /**
   * Date and time when the medical event occurred
   * Stored in ISO 8601 format for consistent sorting and display
   */
  date: string;

  /**
   * Healthcare provider associated with this event
   * Can include provider name, specialty, and facility information
   */
  provider: string;

  /**
   * Array of document references related to this medical event
   * May include lab results, clinical notes, prescriptions, imaging reports,
   * discharge summaries, or other healthcare documentation
   */
  documents: string[];
}

/**
 * Zod schema for validating medical event data
 * 
 * This schema ensures data consistency and integrity for the medical history timeline.
 * It performs runtime validation of medical event data before storage or display.
 */
export const medicalEventSchema = z.object({
  id: z.string().uuid({
    message: "Medical event ID must be a valid UUID"
  }),
  userId: z.string().uuid({
    message: "User ID must be a valid UUID"
  }),
  type: z.string().min(1, {
    message: "Event type is required"
  }),
  description: z.string().min(3, {
    message: "Description must be at least 3 characters"
  }).max(500, {
    message: "Description cannot exceed 500 characters"
  }),
  date: z.string().datetime({
    message: "Date must be a valid ISO 8601 datetime string"
  }),
  provider: z.string().min(1, {
    message: "Provider information is required"
  }),
  documents: z.array(
    z.string().url({
      message: "Document must be a valid URL or file reference"
    })
  ).optional().default([]),
});

/**
 * Type for the result of validating a medical event with Zod
 * Useful for handling validation results in forms and API endpoints
 */
export type MedicalEventValidationResult = z.infer<typeof medicalEventSchema>;