import { ApiProperty } from '@nestjs/swagger';

/**
 * Base DTO for <%= className %> responses
 */
export class <%= className %>Dto {
  /**
   * Unique identifier
   */
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  /**
   * Name of the entity
   */
  @ApiProperty({
    description: 'Name of the entity',
    example: 'Example Name'
  })
  name: string;

  /**
   * Description of the entity
   */
  @ApiProperty({
    description: 'Description of the entity',
    example: 'This is an example description',
    nullable: true
  })
  description?: string;

  /**
   * Whether the entity is active
   */
  @ApiProperty({
    description: 'Whether the entity is active',
    example: true
  })
  isActive: boolean;

  /**
   * Creation timestamp
   */
  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00Z'
  })
  createdAt: Date;

  /**
   * Last update timestamp
   */
  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00Z'
  })
  updatedAt: Date;
}