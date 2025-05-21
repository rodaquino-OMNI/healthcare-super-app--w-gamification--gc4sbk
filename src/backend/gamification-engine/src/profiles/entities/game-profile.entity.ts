import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { 
  IsString, 
  IsUUID, 
  IsNumber, 
  IsDate, 
  Min,
  IsOptional
} from 'class-validator';
import { UserAchievement } from '../../../achievements/entities/user-achievement.entity';
import { IGameProfile } from '@austa/interfaces/gamification';
import { IUser } from '@austa/interfaces/auth';

/**
 * Entity representing a user's gamification profile.
 * Stores level, experience points, and relationships to achievements.
 * Used by the gamification engine to track user progress and rewards.
 * 
 * This entity supports both TypeORM and Prisma through shared interfaces.
 */
@Entity('game_profiles')
export class GameProfile implements IGameProfile {
  /**
   * Unique identifier for the game profile
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * ID of the user this profile belongs to
   * References the User entity from the auth service
   */
  @Column()
  @IsString()
  userId: IUser['id'];

  /**
   * Current level of the user
   * Starts at 1 and increases as the user gains XP
   */
  @Column({ default: 1 })
  @IsNumber()
  @Min(1)
  level: number;

  /**
   * Current experience points of the user
   * Accumulates as the user completes actions and unlocks achievements
   */
  @Column({ default: 0 })
  @IsNumber()
  @Min(0)
  xp: number;

  /**
   * Collection of achievements unlocked by the user
   * Managed through the UserAchievement entity
   * 
   * Note: In the database schema, this is represented by UserAchievement records
   * that share the same userId as this profile.
   * This is a virtual relationship based on the userId field.
   */
  @OneToMany(() => UserAchievement, (achievement) => achievement.userId, {
    createForeignKeyConstraints: false
  })
  @IsOptional()
  achievements?: UserAchievement[];

  /**
   * Timestamp when the profile was created
   */
  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  /**
   * Timestamp when the profile was last updated
   */
  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;

  /**
   * Calculates the XP required to reach the next level
   * Uses a progressive scaling formula based on current level
   * @returns The XP required for the next level
   */
  getNextLevelXp(): number {
    // Simple formula: 100 * level^1.5
    return Math.floor(100 * Math.pow(this.level, 1.5));
  }

  /**
   * Adds XP to the user's profile and levels up if necessary
   * @param amount The amount of XP to add
   * @returns True if the user leveled up, false otherwise
   */
  addXp(amount: number): boolean {
    if (amount <= 0) return false;
    
    this.xp += amount;
    let leveledUp = false;
    
    // Check if user should level up
    while (this.xp >= this.getNextLevelXp()) {
      this.level += 1;
      leveledUp = true;
    }
    
    return leveledUp;
  }

  /**
   * Resets the user's level and XP to default values
   * Used for testing or administrative purposes
   */
  resetProgress(): void {
    this.level = 1;
    this.xp = 0;
  }
}