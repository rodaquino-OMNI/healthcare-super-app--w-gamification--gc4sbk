import { pascalCase, camelCase } from 'change-case';

/**
 * Generates the content for an interface file based on the provided service name.
 * @param serviceName - The name of the service
 * @param journey - Optional journey name
 * @returns The content of the interface file
 */
export function generateInterfaceTemplate(serviceName: string, journey?: string): string {
  // Convert service name to proper cases
  const interfaceName = pascalCase(serviceName);
  const serviceNameCamel = camelCase(serviceName);
  
  // Construct the interface file content
  return `/**
 * Interface representing a ${serviceNameCamel} in the system
 */
export interface I${interfaceName} {
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
}`;
}