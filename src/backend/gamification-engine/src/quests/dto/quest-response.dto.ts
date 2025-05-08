import { ApiProperty } from '@nestjs/swagger';
import { QuestInterface } from '../interfaces/quest.interface';

/**
 * Data Transfer Object for standardizing quest data in API responses.
 * This DTO ensures consistent structure when returning quest information
 * through controller endpoints like findAll and findOne.
 *
 * @implements {QuestInterface}
 */
export class QuestResponseDto implements QuestInterface {
  /**
   * Unique identifier for the quest.
   * Generated as a UUID when a new quest is created.
   * 
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Unique identifier for the quest',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  id: string;

  /**
   * The title of the quest that will be displayed to users.
   * This should be concise and descriptive of the quest's objective.
   * 
   * @example "Complete Your Health Profile"
   */
  @ApiProperty({
    description: 'The title of the quest',
    example: 'Complete Your Health Profile',
    type: String,
  })
  title: string;

  /**
   * A detailed description of what the quest entails.
   * This provides users with information about how to complete the quest.
   * 
   * @example "Fill out all sections of your health profile to earn XP and unlock health insights."
   */
  @ApiProperty({
    description: 'Detailed description of the quest',
    example: 'Fill out all sections of your health profile to earn XP and unlock health insights.',
    type: String,
  })
  description: string;

  /**
   * The journey to which the quest belongs (e.g., 'health', 'care', 'plan').
   * This allows for journey-specific quests and filtering.
   * 
   * @example "health"
   */
  @ApiProperty({
    description: 'The journey to which the quest belongs',
    example: 'health',
    enum: ['health', 'care', 'plan'],
    type: String,
  })
  journey: string;

  /**
   * The name of the icon to display for the quest.
   * This references an icon in the design system.
   * 
   * @example "health-profile"
   */
  @ApiProperty({
    description: 'The name of the icon to display for the quest',
    example: 'health-profile',
    type: String,
  })
  icon: string;

  /**
   * The amount of XP (experience points) awarded for completing the quest.
   * Limited to a maximum of 1000 XP per quest.
   * 
   * @example 100
   */
  @ApiProperty({
    description: 'The amount of XP awarded for completing the quest',
    example: 100,
    minimum: 0,
    maximum: 1000,
    type: Number,
  })
  xpReward: number;
}