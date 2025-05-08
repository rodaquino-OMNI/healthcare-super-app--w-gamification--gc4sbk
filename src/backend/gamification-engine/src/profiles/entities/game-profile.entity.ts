import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  VersionColumn
} from 'typeorm'; // typeorm 0.3.17
import { 
  IsString, 
  IsUUID, 
  IsNumber, 
  IsDate, 
  IsOptional, 
  IsObject,
  Min
} from 'class-validator'; // class-validator 0.14.1
import { UserAchievement } from '@app/achievements/entities/user-achievement.entity';
import { User } from '@austa/interfaces/auth'; // @austa/interfaces 1.0.0
import { GameProfile as IGameProfile } from '@austa/interfaces/gamification'; // @austa/interfaces 1.0.0

/**
 * GameProfile Entity
 * 
 * Represents a user's gamification profile, tracking their level, experience points (XP),
 * and associated achievements. This entity is central to the gamification system and
 * serves as the foundation for tracking user progression across all journeys.
 * 
 * The entity implements the standardized GameProfile interface from @austa/interfaces
 * to ensure consistency between backend storage and frontend display. It uses TypeORM
 * decorators for database mapping and includes comprehensive validation.
 *
 * @implements {IGameProfile} GameProfile interface from @austa/interfaces
 */
@Entity('game_profiles')
export class GameProfile implements IGameProfile {
  /**
   * Unique identifier for the game profile
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  /**
   * Reference to the user who owns this game profile
   * Uses the standardized User interface from @austa/interfaces/auth
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @Column()
  @IsString()
  @IsUUID()
  @Index({ unique: true })
  userId: string;

  /**
   * The user's current level in the gamification system
   * Starts at level 1 and increases as the user gains XP
   * @default 1
   * @minimum 1
   */
  @Column({ type: 'integer', default: 1 })
  @IsNumber()
  @Min(1)
  level: number;

  /**
   * The user's current experience points
   * Accumulates as the user completes actions, achievements, and quests
   * @default 0
   * @minimum 0
   */
  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  @Min(0)
  xp: number;

  /**
   * The total XP required to reach the next level
   * This is calculated based on the current level
   * @default 100
   * @minimum 100
   */
  @Column({ type: 'integer', default: 100 })
  @IsNumber()
  @Min(100)
  nextLevelXp: number;

  /**
   * Date when the profile was created
   */
  @CreateDateColumn({ type: 'timestamptz' })
  @IsDate()
  createdAt: Date;

  /**
   * Date when the profile was last updated
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  @IsDate()
  updatedAt: Date;

  /**
   * Optional metadata for additional profile properties
   * Stored as a JSON object
   * @example { "lastJourney": "health", "preferences": { "notifications": true } }
   */
  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  /**
   * Version number, automatically incremented when the entity is updated
   * Used for optimistic concurrency control
   */
  @VersionColumn()
  version: number;

  /**
   * One-to-many relationship with UserAchievement entities
   * Represents all achievements that the user has unlocked or is progressing towards
   */
  @OneToMany(() => UserAchievement, userAchievement => userAchievement.userId)
  achievements: UserAchievement[];

  /**
   * Adds experience points to the user's profile
   * If the user gains enough XP to level up, their level is increased
   * 
   * @param amount The amount of XP to add
   * @returns The updated GameProfile
   */
  addXp(amount: number): GameProfile {
    if (amount <= 0) {
      return this;
    }

    this.xp += amount;
    
    // Check if the user has enough XP to level up
    while (this.xp >= this.nextLevelXp) {
      this.levelUp();
    }

    return this;
  }

  /**
   * Increases the user's level by 1 and recalculates the XP required for the next level
   * 
   * @returns The updated GameProfile
   */
  levelUp(): GameProfile {
    this.level += 1;
    this.calculateNextLevelXp();
    return this;
  }

  /**
   * Calculates the XP required to reach the next level
   * The formula increases the required XP for each level, making higher levels
   * progressively more difficult to achieve
   * 
   * @returns The XP required for the next level
   */
  calculateNextLevelXp(): number {
    // Formula: 100 * level^1.5
    // Level 1: 100 XP
    // Level 2: 283 XP
    // Level 3: 520 XP
    // Level 4: 800 XP
    // Level 5: 1118 XP
    // etc.
    this.nextLevelXp = Math.floor(100 * Math.pow(this.level, 1.5));
    return this.nextLevelXp;
  }

  /**
   * Resets the user's level and XP
   * Useful for testing or when implementing seasonal resets
   * 
   * @param newLevel The new level to set (defaults to 1)
   * @param newXp The new XP to set (defaults to 0)
   * @returns The updated GameProfile
   */
  reset(newLevel: number = 1, newXp: number = 0): GameProfile {
    this.level = Math.max(1, newLevel);
    this.xp = Math.max(0, newXp);
    this.calculateNextLevelXp();
    return this;
  }

  /**
   * Updates the profile's metadata
   * 
   * @param newMetadata The new metadata to merge with existing metadata
   * @returns The updated GameProfile
   */
  updateMetadata(newMetadata: Record<string, any>): GameProfile {
    this.metadata = {
      ...this.metadata,
      ...newMetadata
    };
    return this;
  }
}