import { pascalCase, camelCase } from 'change-case';

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
  
  // Construct the Prisma model file content
  return `import { ${modelName} } from '@prisma/client';

/**
 * Model representing a ${serviceNameCamel} in the system
 * This is a type-safe wrapper around the Prisma-generated model
 */
export class ${modelName}Model implements ${modelName} {
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

  constructor(partial: Partial<${modelName}>) {
    Object.assign(this, partial);
  }
}
`;
}

/**
 * Generates the content for a Prisma schema extension file based on the provided service name.
 * @param serviceName - The name of the service
 * @param journey - Optional journey name
 * @returns The content of the Prisma schema extension file
 */
export function generatePrismaSchemaTemplate(serviceName: string, journey?: string): string {
  // Convert service name to proper cases
  const modelName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  
  // Construct the Prisma schema extension file content
  return `// Prisma schema extension for ${modelName}
// Add this to your schema.prisma file

model ${modelName} {
  id          String   @id @default(uuid())
  name        String
  description String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("${journey ? journey + '_' : ''}${serviceNameCamel}s")
}
`;
}