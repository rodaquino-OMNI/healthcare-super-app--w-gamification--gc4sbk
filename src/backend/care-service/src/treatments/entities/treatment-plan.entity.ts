import { Appointment } from '@app/care/appointments/entities/appointment.entity';
import { ITreatmentPlan } from '@austa/interfaces/journey/care';

/**
 * Represents a treatment plan for a patient.
 * This entity is part of the Care Journey and allows tracking and display
 * of prescribed treatment plans as specified in the Care Now journey requirements.
 * 
 * It implements the ITreatmentPlan interface from @austa/interfaces
 * to ensure type consistency across the application.
 * 
 * @prisma This maps to the TreatmentPlan model in the Prisma schema
 */
export class TreatmentPlan implements ITreatmentPlan {
  /**
   * Unique identifier for the treatment plan.
   * @prisma @id @default(uuid())
   */
  id: string;

  /**
   * Name of the treatment plan.
   * @prisma @db.VarChar(255)
   */
  name: string;

  /**
   * Description of the treatment plan.
   * @prisma @db.Text
   */
  description: string;

  /**
   * Start date of the treatment plan.
   * @prisma @db.Timestamp
   */
  startDate: Date;

  /**
   * End date of the treatment plan.
   * @prisma @db.Timestamp
   */
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * @prisma @db.Float @default(0)
   */
  progress: number;

  /**
   * ID of the appointment this treatment plan is associated with.
   * @prisma @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
   */
  appointmentId: string;

  /**
   * Reference to the appointment this treatment plan is associated with.
   * This replaces the previous careActivity relationship to align with the
   * standardized data model.
   * @prisma @relation(fields: [appointmentId], references: [id])
   */
  appointment: Appointment;

  /**
   * Date and time when the treatment plan was created.
   * @prisma @default(now())
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   * @prisma @updatedAt
   */
  updatedAt: Date;

  /**
   * Generates a treatment plan event for the gamification system.
   * This method creates a standardized event object that can be processed
   * by the gamification engine to award points or achievements.
   * 
   * @returns An object conforming to the treatment plan event schema
   */
  toGamificationEvent(): Record<string, any> {
    return {
      eventType: 'treatment_plan_created',
      journeyType: 'care',
      userId: this.appointment.userId,
      metadata: {
        treatmentPlanId: this.id,
        appointmentId: this.appointmentId,
        startDate: this.startDate.toISOString(),
        endDate: this.endDate?.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}