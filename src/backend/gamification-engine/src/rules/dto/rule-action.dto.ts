import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsPositive, IsString, IsUUID, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Enum representing the types of actions that can be triggered by a rule.
 */
export enum RuleActionType {
  /**
   * Awards experience points to the user.
   * Requires 'points' parameter.
   */
  AWARD_XP = 'AWARD_XP',
  
  /**
   * Unlocks an achievement for the user.
   * Requires 'achievementId' parameter.
   */
  UNLOCK_ACHIEVEMENT = 'UNLOCK_ACHIEVEMENT',
  
  /**
   * Progresses a quest for the user.
   * Requires 'questId' and 'progress' parameters.
   */
  PROGRESS_QUEST = 'PROGRESS_QUEST'
}

/**
 * Data transfer object for rule actions.
 * 
 * Rule actions define what happens when a rule's conditions are met.
 * Different action types require different parameters.
 */
export class RuleActionDto {
  /**
   * The type of action to perform when the rule conditions are met.
   */
  @IsNotEmpty()
  @IsEnum(RuleActionType)
  type: RuleActionType;

  /**
   * Number of experience points to award to the user.
   * Required when type is AWARD_XP.
   */
  @ValidateIf(o => o.type === RuleActionType.AWARD_XP)
  @IsNotEmpty({ message: 'Points are required for AWARD_XP action type' })
  @IsNumber({}, { message: 'Points must be a number' })
  @IsPositive({ message: 'Points must be a positive number' })
  points?: number;

  /**
   * ID of the achievement to unlock.
   * Required when type is UNLOCK_ACHIEVEMENT.
   */
  @ValidateIf(o => o.type === RuleActionType.UNLOCK_ACHIEVEMENT)
  @IsNotEmpty({ message: 'Achievement ID is required for UNLOCK_ACHIEVEMENT action type' })
  @IsUUID('4', { message: 'Achievement ID must be a valid UUID' })
  achievementId?: string;

  /**
   * ID of the quest to progress.
   * Required when type is PROGRESS_QUEST.
   */
  @ValidateIf(o => o.type === RuleActionType.PROGRESS_QUEST)
  @IsNotEmpty({ message: 'Quest ID is required for PROGRESS_QUEST action type' })
  @IsUUID('4', { message: 'Quest ID must be a valid UUID' })
  questId?: string;

  /**
   * Amount of progress to add to the quest.
   * Required when type is PROGRESS_QUEST.
   */
  @ValidateIf(o => o.type === RuleActionType.PROGRESS_QUEST)
  @IsNotEmpty({ message: 'Progress amount is required for PROGRESS_QUEST action type' })
  @IsNumber({}, { message: 'Progress must be a number' })
  @IsPositive({ message: 'Progress must be a positive number' })
  progress?: number;

  /**
   * Optional metadata for the action.
   * Can contain additional information specific to the action type.
   */
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  metadata?: Record<string, any>;
}