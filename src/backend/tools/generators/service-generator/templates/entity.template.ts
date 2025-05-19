import { pascalCase, camelCase, paramCase } from 'change-case';

/**
 * Generates the content for a TypeORM entity file based on the provided service name.
 * Includes database optimizations, proper indexing, soft deletion, and integration with @austa/interfaces.
 * 
 * This template implements PostgreSQL-specific optimizations and follows TypeORM best practices
 * for entity design, including proper indexing strategies, relation handling, and soft deletion support.
 * 
 * @param serviceName - The name of the service
 * @returns The content of the entity file
 */
export function generateEntityTemplate(serviceName: string): string {
  // Convert service name to proper cases for different naming conventions
  const entityName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  const serviceNameParam = paramCase(serviceName);
  const entityNamePlural = `${serviceNameCamel}s`;
  const tableName = paramCase(entityNamePlural); // Use kebab-case for table names
  
  // Construct the entity file content
  return `import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index,
  Check,
  Unique,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
// Import shared interface from @austa/interfaces package
import { I${entityName} } from '@austa/interfaces/journey/${serviceNameCamel}';
// Import any related entities needed for relationships
// import { RelatedEntity } from '../related-entity/related-entity.entity';
// import { ParentEntity } from '../parent-entity/parent-entity.entity';

/**
 * Entity representing a ${serviceNameCamel} in the system
 * Implements the I${entityName} interface from @austa/interfaces for type consistency
 */
@Entity('${tableName}')
@Index(['createdAt'], { name: 'idx_${serviceNameParam}_created_at' }) // Index for time-based queries
@Index(['isActive', 'deletedAt'], { name: 'idx_${serviceNameParam}_active_status' }) // Composite index for active record filtering
@Unique(['externalId'], { name: 'uq_${serviceNameParam}_external_id' }) // Ensure uniqueness of external identifiers
@Check('"name" <> \'\'') // Database constraint to prevent empty names
export class ${entityName} implements I${entityName} {
  /**
   * Unique identifier for the ${serviceNameCamel}
   * Uses UUID v4 for better distribution and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * External identifier for integration with external systems
   * Nullable for entities that don't require external mapping
   */
  @Column({ length: 100, nullable: true })
  externalId?: string;

  /**
   * Name of the ${serviceNameCamel}
   * Limited to 100 characters for database optimization
   */
  @Column({ length: 100 })
  name: string;

  /**
   * Description of the ${serviceNameCamel}
   * Uses text type for unlimited length
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * JSON metadata for flexible storage of additional properties
   * Useful for storing non-queryable attributes
   * Uses PostgreSQL JSONB type for efficient storage and querying
   */
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  @Index({ name: 'idx_${serviceNameParam}_metadata_gin', using: 'GIN' }) // GIN index for efficient JSONB querying
  metadata?: Record<string, any>;

  /**
   * Whether the ${serviceNameCamel} is active
   * Used for soft-state management without deletion
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * User ID who created this record
   * Important for audit trails
   */
  @Column({ nullable: true })
  createdBy?: string;

  /**
   * User ID who last updated this record
   * Important for audit trails
   */
  @Column({ nullable: true })
  updatedBy?: string;

  /**
   * Timestamp when the ${serviceNameCamel} was created
   * Automatically managed by TypeORM
   */
  @CreateDateColumn({ type: 'timestamptz' }) // Use timestamptz for timezone awareness
  createdAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was last updated
   * Automatically managed by TypeORM
   */
  @UpdateDateColumn({ type: 'timestamptz' }) // Use timestamptz for timezone awareness
  updatedAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was soft-deleted
   * Null indicates the record is not deleted
   */
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  /**
   * Example of a One-to-Many relationship
   * Uncomment and modify as needed for your specific entity relationships
   * 
   * This demonstrates proper relation handling with cascade options
   * and lazy loading for better performance
   */
  /*
  @OneToMany(() => RelatedEntity, (relatedEntity) => relatedEntity.${serviceNameCamel}, {
    cascade: ['insert', 'update'], // Automatically save related entities when saving this entity
    eager: false, // Lazy load by default for better performance
    onDelete: 'SET NULL', // Options: CASCADE, SET NULL, NO ACTION, etc.
  })
  relatedEntities?: RelatedEntity[];
  */

  /**
   * Example of a Many-to-One relationship
   * Uncomment and modify as needed for your specific entity relationships
   * 
   * This demonstrates proper foreign key handling with explicit column naming
   * and appropriate deletion behavior
   */
  /*
  @ManyToOne(() => ParentEntity, (parentEntity) => parentEntity.${entityNamePlural}, {
    onDelete: 'SET NULL', // Options: CASCADE, SET NULL, NO ACTION, etc.
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' }) // Explicitly name the foreign key column
  parent?: ParentEntity;

  @Column({ nullable: true })
  @Index({ name: 'idx_${serviceNameParam}_parent_id' }) // Index foreign keys for better join performance
  parentId?: string;
  */

  /**
   * Converts entity to a plain object, useful for API responses
   * Implements any custom transformations needed
   */
  toJSON(): Record<string, any> {
    return {
      ...this,
      // Add any custom transformations here
      // For example, format dates or transform nested objects
    };
  }
}
`;
}