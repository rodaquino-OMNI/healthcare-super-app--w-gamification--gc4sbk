import { pascalCase, camelCase } from 'change-case'; // change-case v4.1.2

/**
 * Generates the content for a NestJS entity file based on the provided service name.
 * @param serviceName - The name of the service
 * @param journey - Optional journey name
 * @returns The content of the entity file
 */
export function generateEntityTemplate(serviceName: string, journey?: string): string {
  // Convert service name to proper cases
  const entityName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  
  // Determine if we need to import journey-specific interfaces
  const journeyImport = journey 
    ? `import { ${pascalCase(journey)}Entity } from '@austa/interfaces/journey/${journey}';
` 
    : '';
  
  // Determine if we need to extend a journey-specific entity
  const journeyExtends = journey ? ` implements ${pascalCase(journey)}Entity` : '';
  
  // Construct the entity file content
  return `import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { I${entityName} } from '../interfaces/${camelCase(serviceName)}.interface';
${journeyImport}
/**
 * Entity representing a ${serviceNameCamel} in the system
 */
@Entity('${serviceNameCamel}s')
export class ${entityName}${journeyExtends} implements I${entityName} {
  /**
   * Unique identifier for the ${serviceNameCamel}
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Name of the ${serviceNameCamel}
   */
  @Column({ length: 100 })
  name: string;

  /**
   * Description of the ${serviceNameCamel}
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Whether the ${serviceNameCamel} is active
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Timestamp when the ${serviceNameCamel} was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
`;
}