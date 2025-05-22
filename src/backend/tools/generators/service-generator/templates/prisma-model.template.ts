import { pascalCase, camelCase } from 'change-case'; // change-case v4.1.2

/**
 * Generates the content for a Prisma model file based on the provided service name.
 * @param serviceName - The name of the service
 * @param journey - Optional journey name
 * @returns The content of the Prisma model file
 */
export function generatePrismaModelTemplate(serviceName: string, journey?: string): string {
  // Convert service name to proper cases
  const modelName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  
  // Determine if we need to import journey-specific interfaces
  const journeyImport = journey 
    ? `import { ${pascalCase(journey)}Model } from '@austa/interfaces/journey/${journey}';
` 
    : '';
  
  // Determine if we need to extend a journey-specific model
  const journeyExtends = journey ? ` implements ${pascalCase(journey)}Model` : '';
  
  // Construct the Prisma model file content
  return `import { Prisma } from '@prisma/client';
import { I${modelName} } from '../interfaces/${camelCase(serviceName)}.interface';
${journeyImport}
/**
 * Type representing a ${serviceNameCamel} from Prisma schema
 */
export type ${modelName} = Prisma.${modelName}GetPayload<{}>;

/**
 * Class representing a ${serviceNameCamel} model with utility methods
 */
export class ${modelName}Model${journeyExtends} implements I${modelName} {
  /**
   * Unique identifier for the ${serviceNameCamel}
   */
  id: string;

  /**
   * Name of the ${serviceNameCamel}
   */
  name: string;

  /**
   * Description of the ${serviceNameCamel}
   */
  description?: string;

  /**
   * Whether the ${serviceNameCamel} is active
   */
  isActive: boolean;

  /**
   * Timestamp when the ${serviceNameCamel} was created
   */
  createdAt: Date;

  /**
   * Timestamp when the ${serviceNameCamel} was last updated
   */
  updatedAt: Date;

  /**
   * Creates a new ${modelName}Model instance from a Prisma ${modelName}
   * @param data - The Prisma ${modelName} data
   * @returns A new ${modelName}Model instance
   */
  static fromPrisma(data: ${modelName}): ${modelName}Model {
    const model = new ${modelName}Model();
    
    model.id = data.id;
    model.name = data.name;
    model.description = data.description;
    model.isActive = data.isActive;
    model.createdAt = data.createdAt;
    model.updatedAt = data.updatedAt;
    
    return model;
  }

  /**
   * Converts this model to a plain object
   * @returns A plain object representation of this model
   */
  toObject(): I${modelName} {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
`;
}