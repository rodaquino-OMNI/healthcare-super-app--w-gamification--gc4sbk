import { ITreatmentPlan } from '@austa/interfaces/journey/care';
import { Appointment } from '@app/appointments/entities/appointment.entity';

/**
 * Represents a treatment plan for a patient.
 * This entity is part of the Care Journey and allows tracking and display
 * of prescribed treatment plans as specified in the Care Now journey requirements.
 * 
 * @prisma
 * model TreatmentPlan {
 *   id          String      @id @default(uuid())
 *   name        String      @db.VarChar(255)
 *   description String?     @db.Text
 *   startDate   DateTime    @db.Timestamp()
 *   endDate     DateTime?   @db.Timestamp()
 *   progress    Float       @default(0)
 *   appointmentId String?
 *   appointment Appointment? @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
 *   createdAt   DateTime    @default(now()) @db.Timestamp()
 *   updatedAt   DateTime    @updatedAt @db.Timestamp()
 * }
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
  description?: string;

  /**
   * Start date of the treatment plan.
   * @prisma @db.Timestamp()
   */
  startDate: Date;

  /**
   * End date of the treatment plan.
   * @prisma @db.Timestamp()
   */
  endDate?: Date;

  /**
   * Progress of the treatment plan (percentage from 0 to 100).
   * @prisma @default(0)
   */
  progress: number;

  /**
   * ID of the appointment this treatment plan is associated with.
   * @prisma
   */
  appointmentId?: string;

  /**
   * Reference to the appointment this treatment plan is associated with.
   * @prisma @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
   */
  appointment?: Appointment;

  /**
   * Date and time when the treatment plan was created.
   * @prisma @default(now()) @db.Timestamp()
   */
  createdAt: Date;

  /**
   * Date and time when the treatment plan was last updated.
   * @prisma @updatedAt @db.Timestamp()
   */
  updatedAt: Date;
}