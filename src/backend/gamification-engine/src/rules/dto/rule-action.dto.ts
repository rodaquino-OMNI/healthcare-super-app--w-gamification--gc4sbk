import { IsNotEmpty, IsString, IsUUID, IsOptional, IsEnum, IsInt, ValidateNested, IsObject, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Enum defining the types of actions that can be triggered when a rule's conditions are met.
 * Each action type requires specific parameters in the payload.
 */
export enum RuleActionType {
  /**
   * Awards experience points to the user.
   * Required payload parameters: points (number)
   * Optional payload parameters: multiplier (number)
   */
  AWARD_XP = 'AWARD_XP',
  
  /**
   * Unlocks an achievement for the user.
   * Required payload parameters: achievementId (string)
   */
  UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
  
  /**
   * Progresses a quest for the user.
   * Required payload parameters: questId (string), progress (number)
   */
  PROGRESS_QUEST = 'PROGRESS_QUEST'
}

/**
 * DTO for the payload of an AWARD_XP action.
 * Contains the number of points to award and an optional multiplier.
 */
export class AwardXpPayloadDto {
  /**
   * The number of experience points to award to the user.
   * Must be a positive integer.
   * @example 100
   */
  @IsInt({ message: 'Points must be an integer' })
  @Min(1, { message: 'Points must be at least 1' })
  @ApiProperty({
    description: 'The number of experience points to award to the user',
    example: 100,
    minimum: 1
  })
  points: number;

  /**
   * Optional multiplier to apply to the points.
   * If provided, the final points awarded will be points * multiplier.
   * @example 1.5
   */
  @IsOptional()
  @Min(0.1, { message: 'Multiplier must be at least 0.1' })
  @ApiProperty({
    description: 'Optional multiplier to apply to the points',
    example: 1.5,
    required: false,
    minimum: 0.1
  })
  multiplier?: number;
}

/**
 * DTO for the payload of an UNLOCK_ACHIEVEMENT action.
 * Contains the ID of the achievement to unlock.
 */
export class UnlockAchievementPayloadDto {
  /**
   * The UUID of the achievement to unlock for the user.
   * Must reference an existing achievement in the system.
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsNotEmpty({ message: 'Achievement ID is required' })
  @IsUUID(4, { message: 'Achievement ID must be a valid UUID' })
  @ApiProperty({
    description: 'The UUID of the achievement to unlock for the user',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  achievementId: string;
}

/**
 * DTO for the payload of a PROGRESS_QUEST action.
 * Contains the ID of the quest to progress and the amount of progress to add.
 */
export class ProgressQuestPayloadDto {
  /**
   * The UUID of the quest to progress for the user.
   * Must reference an existing quest in the system.
   * @example '123e4567-e89b-12d3-a456-426614174000'
   */
  @IsNotEmpty({ message: 'Quest ID is required' })
  @IsUUID(4, { message: 'Quest ID must be a valid UUID' })
  @ApiProperty({
    description: 'The UUID of the quest to progress for the user',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  questId: string;

  /**
   * The amount of progress to add to the quest.
   * Must be a positive integer.
   * @example 1
   */
  @IsInt({ message: 'Progress must be an integer' })
  @Min(1, { message: 'Progress must be at least 1' })
  @ApiProperty({
    description: 'The amount of progress to add to the quest',
    example: 1,
    minimum: 1
  })
  progress: number;
}

/**
 * DTO for rule actions that can be triggered when a rule's conditions are met.
 * The action type determines which payload is required and how it will be processed.
 * 
 * This DTO uses conditional validation to ensure that the appropriate payload
 * is provided for each action type.
 * 
 * @example
 * // Award XP action
 * {
 *   type: RuleActionType.AWARD_XP,
 *   payload: {
 *     points: 100,
 *     multiplier: 1.5
 *   }
 * }
 * 
 * // Unlock achievement action
 * {
 *   type: RuleActionType.UNLOCK_ACHIEVEMENT,
 *   payload: {
 *     achievementId: '123e4567-e89b-12d3-a456-426614174000'
 *   }
 * }
 * 
 * // Progress quest action
 * {
 *   type: RuleActionType.PROGRESS_QUEST,
 *   payload: {
 *     questId: '123e4567-e89b-12d3-a456-426614174000',
 *     progress: 1
 *   }
 * }
 */
export class RuleActionDto {
  /**
   * The type of action to perform when the rule's conditions are met.
   * Determines which payload is required and how it will be processed.
   */
  @IsNotEmpty({ message: 'Action type is required' })
  @IsEnum(RuleActionType, { message: 'Action type must be a valid RuleActionType' })
  @ApiProperty({
    description: 'The type of action to perform when the rule\'s conditions are met',
    enum: RuleActionType,
    example: RuleActionType.AWARD_XP
  })
  type: RuleActionType;

  /**
   * The payload for the action, containing action-specific parameters.
   * The required fields depend on the action type.
   */
  @IsNotEmpty({ message: 'Action payload is required' })
  @IsObject({ message: 'Action payload must be an object' })
  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: 'type',
      subTypes: [
        { value: AwardXpPayloadDto, name: RuleActionType.AWARD_XP },
        { value: UnlockAchievementPayloadDto, name: RuleActionType.UNLOCK_ACHIEVEMENT },
        { value: ProgressQuestPayloadDto, name: RuleActionType.PROGRESS_QUEST }
      ]
    }
  })
  @ApiProperty({
    description: 'The payload for the action, containing action-specific parameters',
    example: { points: 100, multiplier: 1.5 }
  })
  payload: AwardXpPayloadDto | UnlockAchievementPayloadDto | ProgressQuestPayloadDto;

  /**
   * Validates that the payload is appropriate for the action type.
   * This method is called by class-validator during validation.
   */
  @ValidateIf(o => o.type === RuleActionType.AWARD_XP)
  @ValidateNested()
  @Type(() => AwardXpPayloadDto)
  get awardXpPayload(): AwardXpPayloadDto | undefined {
    return this.type === RuleActionType.AWARD_XP
      ? this.payload as AwardXpPayloadDto
      : undefined;
  }

  /**
   * Validates that the payload is appropriate for the action type.
   * This method is called by class-validator during validation.
   */
  @ValidateIf(o => o.type === RuleActionType.UNLOCK_ACHIEVEMENT)
  @ValidateNested()
  @Type(() => UnlockAchievementPayloadDto)
  get unlockAchievementPayload(): UnlockAchievementPayloadDto | undefined {
    return this.type === RuleActionType.UNLOCK_ACHIEVEMENT
      ? this.payload as UnlockAchievementPayloadDto
      : undefined;
  }

  /**
   * Validates that the payload is appropriate for the action type.
   * This method is called by class-validator during validation.
   */
  @ValidateIf(o => o.type === RuleActionType.PROGRESS_QUEST)
  @ValidateNested()
  @Type(() => ProgressQuestPayloadDto)
  get progressQuestPayload(): ProgressQuestPayloadDto | undefined {
    return this.type === RuleActionType.PROGRESS_QUEST
      ? this.payload as ProgressQuestPayloadDto
      : undefined;
  }
}