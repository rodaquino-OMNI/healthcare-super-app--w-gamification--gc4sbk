import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsInt, IsBoolean, IsString, IsDate, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { UserQuest } from '../entities/user-quest.entity';
import { Quest } from '../entities/quest.entity';
import { Expose, Transform } from 'class-transformer';

// Import interfaces from @austa/interfaces package
import { UserQuestResponse, QuestDetails } from '@austa/interfaces/gamification';

/**
 * DTO representing quest details within a user quest response.
 * Contains essential information about the quest itself.
 */
@Expose()
export class QuestDetailsDto implements QuestDetails {
  @ApiProperty({
    description: 'Unique identifier of the quest',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Title of the quest',
    example: 'Track Blood Pressure for 7 Days'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the quest',
    example: 'Record your blood pressure daily for one week to earn XP.'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Journey to which the quest belongs',
    example: 'health',
    enum: ['health', 'care', 'plan', 'cross-journey']
  })
  @IsString()
  journey: string;

  @ApiProperty({
    description: 'Icon name for the quest',
    example: 'heart-pulse'
  })
  @IsString()
  icon: string;

  @ApiProperty({
    description: 'XP reward for completing the quest',
    example: 500,
    minimum: 0,
    maximum: 1000
  })
  @IsInt()
  @Min(0)
  @Max(1000)
  xpReward: number;

  @ApiPropertyOptional({
    description: 'Optional deadline for the quest',
    example: '2023-12-31T23:59:59Z',
    nullable: true
  })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? (value instanceof Date ? value : new Date(value)) : null)
  deadline?: Date | null;
}

/**
 * DTO representing a user's participation in a specific quest.
 * Combines data from the UserQuest entity with related Quest information,
 * providing a comprehensive view of quest progress, completion status,
 * and associated reward details.
 * 
 * Used by the controller's startQuest and completeQuest endpoints to return
 * consistent response structures.
 * 
 * @example
 * ```typescript
 * // Example response from startQuest endpoint
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "progress": 0,
 *   "completed": false,
 *   "startedAt": "2023-06-15T10:30:00Z",
 *   "completedAt": null,
 *   "quest": {
 *     "id": "098f6bcd-4621-3373-8ade-4e832627b4f6",
 *     "title": "Track Blood Pressure for 7 Days",
 *     "description": "Record your blood pressure daily for one week to earn XP.",
 *     "journey": "health",
 *     "icon": "heart-pulse",
 *     "xpReward": 500,
 *     "deadline": "2023-12-31T23:59:59Z"
 *   }
 * }
 * ```
 */
@Expose()
export class UserQuestResponseDto implements UserQuestResponse {
  /**
   * Static factory method to create a UserQuestResponseDto from a UserQuest entity.
   * This simplifies the transformation from entity to DTO in service and controller methods.
   * 
   * @param userQuest The UserQuest entity with populated quest relationship
   * @returns A new UserQuestResponseDto instance
   */
  static fromEntity(userQuest: UserQuest): UserQuestResponseDto {
    if (!userQuest.quest) {
      throw new Error('UserQuest entity must have quest relationship loaded');
    }
    
    const dto = new UserQuestResponseDto();
    dto.id = userQuest.id;
    dto.progress = userQuest.progress;
    dto.completed = userQuest.completed;
    dto.startedAt = userQuest.createdAt || new Date();
    dto.completedAt = userQuest.completed ? userQuest.updatedAt : null;
    
    dto.quest = {
      id: userQuest.quest.id,
      title: userQuest.quest.title,
      description: userQuest.quest.description,
      journey: userQuest.quest.journey,
      icon: userQuest.quest.icon,
      xpReward: userQuest.quest.xpReward,
      deadline: userQuest.quest.deadline
    };
    
    return dto;
  }
  
  /**
   * Creates a list of UserQuestResponseDto objects from an array of UserQuest entities.
   * Useful for transforming lists of quests returned from repository queries.
   * 
   * @param userQuests Array of UserQuest entities with populated quest relationships
   * @returns Array of UserQuestResponseDto objects
   */
  static fromEntities(userQuests: UserQuest[]): UserQuestResponseDto[] {
    return userQuests.map(userQuest => UserQuestResponseDto.fromEntity(userQuest));
  }
  @ApiProperty({
    description: 'Unique identifier of the user quest relationship',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'User\'s progress toward completing the quest (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100
  })
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({
    description: 'Whether the user has completed the quest',
    example: false
  })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({
    description: 'Detailed information about the quest',
    type: QuestDetailsDto
  })
  @Type(() => QuestDetailsDto)
  quest: QuestDetailsDto;

  @ApiProperty({
    description: 'Timestamp when the user started the quest',
    example: '2023-06-15T10:30:00Z'
  })
  @IsDate()
  @Transform(({ value }) => value instanceof Date ? value : new Date(value))
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when the user completed the quest',
    example: '2023-06-22T14:45:00Z',
    nullable: true
  })
  @IsDate()
  @IsOptional()
  @Transform(({ value }) => value ? (value instanceof Date ? value : new Date(value)) : null)
  completedAt?: Date | null;

  /**
   * Calculates the remaining time until the quest deadline, if one exists.
   * Returns null if there is no deadline or if the quest is already expired.
   * 
   * @returns The remaining time in milliseconds, or null if no deadline or expired
   */
  @Expose()
  @ApiPropertyOptional({
    description: 'Remaining time until deadline in milliseconds',
    example: 604800000, // 7 days in milliseconds
    nullable: true
  })
  getRemainingTime(): number | null {
    if (!this.quest.deadline) {
      return null;
    }

    const now = new Date();
    const deadline = new Date(this.quest.deadline);
    const remaining = deadline.getTime() - now.getTime();

    return remaining > 0 ? remaining : null;
  }

  /**
   * Determines if the quest is expired based on its deadline.
   * 
   * @returns True if the quest has a deadline and it has passed, false otherwise
   */
  @Expose()
  @ApiProperty({
    description: 'Whether the quest deadline has passed',
    example: false
  })
  isExpired(): boolean {
    if (!this.quest.deadline) {
      return false;
    }

    const now = new Date();
    const deadline = new Date(this.quest.deadline);
    return now > deadline;
  }

  /**
   * Calculates the estimated completion date based on current progress rate.
   * Returns null if the quest is already completed or if there's insufficient data.
   * 
   * @returns Estimated completion date or null
   */
  @Expose()
  @ApiPropertyOptional({
    description: 'Estimated completion date based on current progress rate',
    example: '2023-06-22T14:45:00Z',
    nullable: true
  })
  getEstimatedCompletionDate(): Date | null {
    if (this.completed || !this.startedAt || this.progress === 0) {
      return null;
    }

    const now = new Date();
    const startDate = new Date(this.startedAt);
    const elapsedTime = now.getTime() - startDate.getTime();
    const progressRate = this.progress / elapsedTime;
    const remainingProgress = 100 - this.progress;
    
    if (progressRate <= 0) {
      return null;
    }
    
    const estimatedRemainingTime = remainingProgress / progressRate;
    const estimatedCompletionDate = new Date(now.getTime() + estimatedRemainingTime);
    
    return estimatedCompletionDate;
  }
  
  /**
   * Calculates the visual progress segments for achievement visualization.
   * Divides the progress into segments that can be used for UI rendering.
   * 
   * @param segments Number of segments to divide the progress into (default: 5)
   * @returns Array of segment objects with completion status
   */
  @Expose()
  @ApiProperty({
    description: 'Visual progress segments for achievement visualization',
    example: [
      { index: 0, completed: true },
      { index: 1, completed: true },
      { index: 2, completed: true },
      { index: 3, completed: false },
      { index: 4, completed: false }
    ]
  })
  getProgressSegments(segments: number = 5): Array<{ index: number; completed: boolean }> {
    const result = [];
    const segmentSize = 100 / segments;
    
    for (let i = 0; i < segments; i++) {
      const segmentThreshold = (i + 1) * segmentSize;
      result.push({
        index: i,
        completed: this.progress >= segmentThreshold
      });
    }
    
    return result;
  }
}