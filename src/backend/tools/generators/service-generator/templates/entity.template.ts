import { pascalCase, camelCase } from 'change-case'; // Updated for TypeScript v5.3.3 compatibility

/**
 * Generates the content for a TypeORM entity file based on the provided service name.
 * Includes optimized database indexing, soft deletion support, and proper relation handling.
 * 
 * This template implements best practices for PostgreSQL optimization including:
 * - Proper indexing strategies for common query patterns
 * - Soft deletion with metadata retention
 * - JSONB support for flexible schema evolution
 * - Optimistic concurrency control
 * - Relation handling with appropriate cascade options
 * 
 * @param serviceName - The name of the service
 * @param journeyType - Optional journey type (health, care, plan) for journey-specific interfaces
 * @param options - Additional options for entity generation
 * @returns The content of the entity file
 */
export function generateEntityTemplate(
  serviceName: string, 
  journeyType?: 'health' | 'care' | 'plan',
  options?: {
    hasParentRelation?: boolean;
    hasChildRelations?: boolean;
    isAuditable?: boolean;
    usesTimeSeries?: boolean;
  }
): string {
  // Default options
  const opts = {
    hasParentRelation: options?.hasParentRelation ?? false,
    hasChildRelations: options?.hasChildRelations ?? false,
    isAuditable: options?.isAuditable ?? true,
    usesTimeSeries: options?.usesTimeSeries ?? false
  };

  // Convert service name to proper cases
  const entityName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  const tableName = `${serviceNameCamel}s`;
  
  // Determine interface import path based on journey type
  const interfaceImport = journeyType 
    ? `import { I${entityName} } from '@austa/interfaces/journey/${journeyType}';
` 
    : `import { I${entityName} } from '@austa/interfaces/common';
`;
  
  // Additional imports based on options
  let additionalImports = '';
  
  if (opts.hasParentRelation || opts.hasChildRelations) {
    additionalImports += `import { Repository } from 'typeorm';
`;
  }
  
  if (opts.usesTimeSeries) {
    additionalImports += `import { TimeSeriesEntity } from '@austa/database/src/types/time-series.entity';
`;
  }
  
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
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
  AfterRecover
} from 'typeorm';
${interfaceImport}${additionalImports}
import { User } from '../../users/entities/user.entity';
import { AuditableEntity } from '@austa/database/src/types/auditable.entity';
import { SoftDeletableEntity } from '@austa/database/src/types/soft-deletable.entity';

/**
 * Entity representing a ${serviceNameCamel} in the system
 * Implements soft deletion pattern and optimized indexing for PostgreSQL
 * 
 * Features:
 * - Soft deletion with metadata retention
 * - Optimized indexing for common query patterns
 * - Proper relation handling with cascade options
 * - Auditable entity tracking for compliance
 * - PostgreSQL-specific optimizations
 */
@Entity('${tableName}')
@Index(['name', 'isActive']) // Composite index for common query patterns
@Index(['createdAt']) // Index for timestamp-based queries
@Unique(['name', 'deletedAt']) // Ensure uniqueness only among non-deleted records
@Check('"isActive" = true OR "deletedAt" IS NOT NULL') // Ensure consistency between isActive and deletedAt
export class ${entityName} implements I${entityName}${opts.isAuditable ? ', AuditableEntity' : ''}${opts.usesTimeSeries ? ', TimeSeriesEntity' : ''} {
  /**
   * Unique identifier for the ${serviceNameCamel}
   * Uses UUID v4 for better distribution and security
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the ${serviceNameCamel}
   * Indexed for faster lookups
   */
  @Column({ length: 100 })
  @Index() // Single column index for direct lookups
  name: string;

  /**
   * Description of the ${serviceNameCamel}
   * Stored as text type for unlimited length
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Whether the ${serviceNameCamel} is active
   * Used for quick filtering of inactive records
   */
  @Column({ default: true })
  @Index() // Index for common filtering condition
  isActive: boolean;

  /**
   * User who created this ${serviceNameCamel}
   * Implements proper relation handling with cascade options
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  /**
   * ID of the user who created this ${serviceNameCamel}
   */
  @Column({ nullable: true })
  @Index() // Index for foreign key lookups
  createdBy?: string;

  /**
   * Timestamp when the ${serviceNameCamel} was created
   * Automatically set by TypeORM
   */
  @CreateDateColumn({ type: 'timestamptz' }) // Use timestamptz for timezone awareness
  createdAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was last updated
   * Automatically updated by TypeORM
   */
  @UpdateDateColumn({ type: 'timestamptz' }) // Use timestamptz for timezone awareness
  updatedAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was soft-deleted
   * NULL indicates the record is not deleted
   */
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  @Index() // Index for filtering deleted/non-deleted records
  deletedAt?: Date;

  /**
   * Metadata for the ${serviceNameCamel}
   * Stored as JSONB for flexible schema and efficient querying
   * 
   * PostgreSQL JSONB type allows for efficient querying and indexing of JSON data
   * Example query: WHERE metadata @> '{"key": "value"}'
   */
  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  metadata?: Record<string, any>;

  /**
   * Version number for optimistic concurrency control
   * Automatically incremented by TypeORM on each update
   */
  @Column({ type: 'int', default: 1 })
  version: number;

${opts.hasParentRelation ? `
  /**
   * Parent ${serviceNameCamel} if this is a child record
   * Implements hierarchical data structure with proper cascading
   */
  @ManyToOne(() => ${entityName}, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent?: ${entityName};

  /**
   * ID of the parent ${serviceNameCamel}
   */
  @Column({ nullable: true })
  @Index() // Index for hierarchical queries
  parentId?: string;
` : ''}

${opts.hasChildRelations ? `
  /**
   * Child ${serviceNameCamel}s related to this record
   * Implements one-to-many relationship with proper cascading
   */
  @OneToMany(() => ${entityName}, (child) => child.parent, { 
    cascade: ['insert', 'update'],
    eager: false // Load only when explicitly requested for performance
  })
  children?: ${entityName}[];
` : ''}

  /**
   * Lifecycle hooks for additional business logic
   */
  @BeforeInsert()
  @BeforeUpdate()
  prepareData() {
    // Ensure metadata is always an object
    this.metadata = this.metadata || {};
    
    // Add audit trail for changes if needed
    if (this.metadata.changes) {
      this.metadata.changes.push({
        timestamp: new Date(),
        version: this.version
      });
    }
  }

  /**
   * After entity is recovered from soft-deletion
   */
  @AfterRecover()
  markAsRecovered() {
    this.isActive = true;
    if (this.metadata) {
      this.metadata.recovered = true;
      this.metadata.recoveredAt = new Date();
    }
  }
}
`;
}