/**
 * Health goal entity definition for the AUSTA SuperApp.
 * Represents a specific health objective set by a user that can be tracked over time.
 * This enables the F-101-RQ-005 requirement to allow users to set and track health-related goals
 * and contributes to F-301-RQ-003 for tracking user progress toward achievements.
 */

import { 
  Column, 
  Entity, 
  PrimaryGeneratedColumn, 
  ManyToOne, 
  JoinColumn
} from 'typeorm'; // version 0.3.17

// Import enums from @austa/interfaces package instead of defining them locally
import { 
  GoalType, 
  GoalStatus, 
  GoalPeriod 
} from '@austa/interfaces/journey/health';

/**
 * Represents a health goal set by a user.
 * Maps to the 'health_goals' table in the database.
 */
@Entity('health_goals', {
  indices: [
    { columns: ['recordId', 'type'] },
    { columns: ['status'] },
    { columns: ['period'] }
  ]
})
export class HealthGoal {
  /**
   * Unique identifier for the health goal.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Reference to the health record this goal belongs to.
   */
  @Column({ type: 'uuid', nullable: false })
  recordId: string;

  /**
   * Type of health goal (e.g., steps, sleep, weight).
   */
  @Column({ type: 'enum', enum: GoalType, nullable: false })
  type: GoalType;

  /**
   * Title or name of the goal.
   */
  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  /**
   * Optional description of the goal.
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Target value to achieve for this goal.
   */
  @Column({ type: 'float', nullable: false })
  targetValue: number;

  /**
   * Unit of measurement for the goal (e.g., steps, hours, kg).
   */
  @Column({ type: 'varchar', length: 50, nullable: false })
  unit: string;

  /**
   * Current progress value toward the goal.
   */
  @Column({ type: 'float', nullable: false, default: 0 })
  currentValue: number;

  /**
   * Current status of the goal (active, completed, abandoned).
   */
  @Column({ 
    type: 'enum', 
    enum: GoalStatus, 
    nullable: false, 
    default: GoalStatus.ACTIVE 
  })
  status: GoalStatus;

  /**
   * Period for the goal (daily, weekly, monthly, custom).
   */
  @Column({ type: 'enum', enum: GoalPeriod, nullable: false })
  period: GoalPeriod;

  /**
   * Date when the goal was started or became active.
   */
  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  /**
   * Optional target end date for the goal.
   */
  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  /**
   * Date when the goal was completed, if applicable.
   */
  @Column({ type: 'timestamp', nullable: true })
  completedDate: Date;

  /**
   * Date when the goal was created in the system.
   */
  @Column({ 
    type: 'timestamp', 
    nullable: false, 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  createdAt: Date;

  /**
   * Date when the goal was last updated.
   */
  @Column({ 
    type: 'timestamp', 
    nullable: false, 
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP' 
  })
  updatedAt: Date;

  /**
   * Updates the goal's progress with error handling.
   * @param value The new progress value
   * @returns True if the update was successful, false otherwise
   */
  updateProgress(value: number): boolean {
    try {
      if (value < 0) {
        throw new Error('Progress value cannot be negative');
      }
      
      this.currentValue = value;
      
      // Check if goal is completed
      if (this.currentValue >= this.targetValue && this.status === GoalStatus.ACTIVE) {
        this.status = GoalStatus.COMPLETED;
        this.completedDate = new Date();
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to update goal progress: ${error.message}`);
      return false;
    }
  }

  /**
   * Abandons the goal with error handling.
   * @returns True if the goal was successfully abandoned, false otherwise
   */
  abandonGoal(): boolean {
    try {
      if (this.status === GoalStatus.COMPLETED) {
        throw new Error('Cannot abandon a completed goal');
      }
      
      this.status = GoalStatus.ABANDONED;
      return true;
    } catch (error) {
      console.error(`Failed to abandon goal: ${error.message}`);
      return false;
    }
  }
}