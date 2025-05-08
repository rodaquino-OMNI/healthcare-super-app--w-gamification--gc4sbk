#!/usr/bin/env node

const { pascalCase, camelCase, paramCase } = require('change-case');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

// Create a simple logger since we can't use the NestJS LoggerService directly in this script
class Logger {
  log(message, context = 'ServiceGenerator') {
    console.log(`[${context}] ${message}`);
  }

  error(message, trace, context = 'ServiceGenerator') {
    console.error(`[${context}] ERROR: ${message}`);
    if (trace) console.error(trace);
  }
}

const logger = new Logger();

// Define CLI command
program
  .name('service-generator')
  .description('Generate NestJS service components (controller, service, entity, DTOs)')
  .version('1.0.0')
  .argument('<name>', 'Service name (e.g., "health-metric")')
  .option('-o, --output <directory>', 'Output directory', './src')
  .option('-j, --journey <journey>', 'Journey name (health, care, plan)', '')
  .option('-p, --prisma', 'Generate Prisma schema instead of TypeORM entity', false)
  .option('-i, --interfaces', 'Use @austa/interfaces for type-safe models', false)
  .action((name, options) => {
    try {
      generateService(name, options.output, options.journey, options.prisma, options.interfaces);
    } catch (error) {
      logger.error(`Failed to generate service: ${error.message}`, error.stack);
      process.exit(1);
    }
  });

program.parse();

/**
 * Generates a complete service with all required components
 * @param {string} name - Service name
 * @param {string} outputDir - Base output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} usePrisma - Whether to use Prisma instead of TypeORM
 * @param {boolean} useInterfaces - Whether to use @austa/interfaces
 */
function generateService(name, outputDir, journey, usePrisma = false, useInterfaces = false) {
  logger.log(`Generating service: ${name}${journey ? ` for ${journey} journey` : ''}`);
  logger.log(`Using Prisma: ${usePrisma}, Using @austa/interfaces: ${useInterfaces}`);
  
  // Determine target directory based on journey
  let serviceDir;
  if (journey) {
    serviceDir = path.join(outputDir, `${journey}-service`, 'src', 'modules', paramCase(name));
  } else {
    serviceDir = path.join(outputDir, 'modules', paramCase(name));
  }
  
  // Create directory structure
  const controllersDir = path.join(serviceDir, 'controllers');
  const servicesDir = path.join(serviceDir, 'services');
  const entitiesDir = usePrisma ? path.join(serviceDir, 'models') : path.join(serviceDir, 'entities');
  const dtosDir = path.join(serviceDir, 'dtos');
  const interfacesDir = path.join(serviceDir, 'interfaces');
  
  createDirectoryIfNotExists(serviceDir);
  createDirectoryIfNotExists(controllersDir);
  createDirectoryIfNotExists(servicesDir);
  createDirectoryIfNotExists(entitiesDir);
  createDirectoryIfNotExists(dtosDir);
  
  if (!useInterfaces) {
    createDirectoryIfNotExists(interfacesDir);
  }
  
  // Generate files
  generateControllerFile(name, controllersDir, journey, useInterfaces);
  generateServiceFile(name, servicesDir, journey, usePrisma, useInterfaces);
  
  if (usePrisma) {
    generatePrismaModelFile(name, entitiesDir, journey);
  } else {
    generateEntityFile(name, entitiesDir);
  }
  
  generateDtoFiles(name, dtosDir, journey, useInterfaces);
  
  if (!useInterfaces) {
    generateInterfaceFiles(name, interfacesDir, journey);
  }
  
  generateModuleFile(name, serviceDir, journey, usePrisma, useInterfaces);
  
  logger.log(`Service ${name} generated successfully at ${serviceDir}`);
  logger.log(`Don't forget to add ${pascalCase(name)}Module to your app.module.ts imports!`);
}

/**
 * Creates a directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function createDirectoryIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.log(`Created directory: ${dir}`);
  }
}

/**
 * Generates controller file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} useInterfaces - Whether to use @austa/interfaces
 */
function generateControllerFile(name, dir, journey, useInterfaces) {
  const filename = `${paramCase(name)}.controller.ts`;
  const filePath = path.join(dir, filename);
  
  // Read controller template
  const templatePath = path.join(__dirname, 'templates', 'controller.template.ts');
  let template;
  
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger.error(`Failed to read controller template: ${error.message}`, error.stack);
    throw new Error(`Failed to read controller template: ${error.message}`);
  }
  
  // Process template with service name and journey
  let content = processTemplate(template, name);
  
  // Replace journey-specific imports if needed
  if (journey) {
    content = content.replace(/import \{ LoggerService \} from '\.\.\.\/\.\.\.\/shared\/src\/logging\/logger\.service';/g, 
      `import { LoggerService } from '@app/shared/logging';`);
    
    content = content.replace(/import \{ JwtAuthGuard, RolesGuard \} from '@nestjs\/passport';/g, 
      `import { JwtAuthGuard, RolesGuard } from '@austa/auth';`);
    
    content = content.replace(/import \{ Roles, Role \} from '@nestjs\/common';/g, 
      `import { Roles } from '@austa/auth/decorators';
import { Role } from '@austa/interfaces/auth';`);
  }
  
  // Replace DTO imports if using interfaces
  if (useInterfaces) {
    const dtoImports = `import { Create${pascalCase(name)}Dto, Update${pascalCase(name)}Dto, ${pascalCase(name)}Dto } from '@austa/interfaces/${journey}';`;
    content = content.replace(/\/\*\* DTO imports \*\//g, dtoImports);
    
    // Replace return types
    content = content.replace(/Promise<any\[\]>/g, `Promise<${pascalCase(name)}Dto[]>`);
    content = content.replace(/Promise<any>/g, `Promise<${pascalCase(name)}Dto>`);
    
    // Replace parameter types
    content = content.replace(/@Body\(\) data: any/g, `@Body() data: Create${pascalCase(name)}Dto`);
    content = content.replace(/@Body\(\) data: any/g, `@Body() data: Update${pascalCase(name)}Dto`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated controller: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write controller file: ${error.message}`, error.stack);
    throw new Error(`Failed to write controller file: ${error.message}`);
  }
}

/**
 * Generates service file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} usePrisma - Whether to use Prisma instead of TypeORM
 * @param {boolean} useInterfaces - Whether to use @austa/interfaces
 */
function generateServiceFile(name, dir, journey, usePrisma, useInterfaces) {
  const filename = `${paramCase(name)}.service.ts`;
  const filePath = path.join(dir, filename);
  
  // Read service template
  const templatePath = path.join(__dirname, 'templates', 'service.template.ts');
  let template;
  
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger.error(`Failed to read service template: ${error.message}`, error.stack);
    throw new Error(`Failed to read service template: ${error.message}`);
  }
  
  // Process template with service name
  let content = processTemplate(template, name);
  
  // Replace imports based on options
  if (journey) {
    // Update imports for shared modules
    content = content.replace(/import \{ LoggerService \} from '\.\.\.\/\.\.\.\/shared\/src\/logging\/logger\.service';/g, 
      `import { LoggerService } from '@app/shared/logging';`);
    
    // Update error handling imports
    content = content.replace(/import \{ AppException, ErrorType \} from '\.\.\.\/\.\.\.\/shared\/src\/exceptions\/exceptions\.types';/g, 
      `import { BaseError, ErrorType } from '@austa/errors';`);
    
    content = content.replace(/import \{ SYS_INTERNAL_SERVER_ERROR \} from '\.\.\.\/\.\.\.\/shared\/src\/constants\/error-codes\.constants';/g, 
      `import { ErrorCodes } from '@austa/errors/constants';`);
    
    // Update repository imports for Prisma
    if (usePrisma) {
      content = content.replace(/import \{ Repository \} from '\.\.\.\/\.\.\.\/shared\/src\/interfaces\/repository\.interface';/g, 
        `import { PrismaService } from '@austa/database';`);
      
      // Replace repository with PrismaService
      content = content.replace(/private readonly {{ camelCase name }}Repository: Repository<{{ pascalCase name }}>,/g, 
        `private readonly prisma: PrismaService,`);
      
      // Replace repository methods with Prisma methods
      content = content.replace(/this\.{{ camelCase name }}Repository\.create\(create{{ pascalCase name }}Dto\);/g, 
        `this.prisma.${camelCase(name)}.create({
        data: create${pascalCase(name)}Dto,
      });`);
      
      content = content.replace(/this\.{{ camelCase name }}Repository\.findAll\(\);/g, 
        `this.prisma.${camelCase(name)}.findMany();`);
      
      content = content.replace(/this\.{{ camelCase name }}Repository\.findById\(id\);/g, 
        `this.prisma.${camelCase(name)}.findUnique({
        where: { id },
      });`);
      
      content = content.replace(/this\.{{ camelCase name }}Repository\.update\(id, update{{ pascalCase name }}Dto\);/g, 
        `this.prisma.${camelCase(name)}.update({
        where: { id },
        data: update${pascalCase(name)}Dto,
      });`);
      
      content = content.replace(/this\.{{ camelCase name }}Repository\.delete\(id\);/g, 
        `this.prisma.${camelCase(name)}.delete({
        where: { id },
      });`);
    }
    
    // Add journey-specific error handling
    content = content.replace(/new AppException\(/g, `new BaseError(`);
    content = content.replace(/ErrorType\.TECHNICAL/g, `ErrorType.System`);
    content = content.replace(/ErrorType\.BUSINESS/g, `ErrorType.Client`);
    content = content.replace(/SYS_INTERNAL_SERVER_ERROR/g, `ErrorCodes.SYSTEM.INTERNAL_ERROR`);
    content = content.replace(/'ENTITY_NOT_FOUND'/g, `ErrorCodes.${journey.toUpperCase()}.ENTITY_NOT_FOUND`);
    
    // Add retry mechanism
    content = content.replace(/try {/g, `try {
      // Use retry mechanism for database operations
      const retryOptions = {
        maxRetries: 3,
        retryInterval: 300,
        exponentialBackoff: true,
      };`);
  }
  
  // Replace DTO imports if using interfaces
  if (useInterfaces) {
    const dtoImports = `import { Create${pascalCase(name)}Dto, Update${pascalCase(name)}Dto, ${pascalCase(name)}Dto } from '@austa/interfaces/${journey}';`;
    content = content.replace(/\/\*\* DTO imports \*\//g, dtoImports);
    
    // Replace return types
    content = content.replace(/Promise<{{ pascalCase name }}\[\]>/g, `Promise<${pascalCase(name)}Dto[]>`);
    content = content.replace(/Promise<{{ pascalCase name }}>/g, `Promise<${pascalCase(name)}Dto>`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated service: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write service file: ${error.message}`, error.stack);
    throw new Error(`Failed to write service file: ${error.message}`);
  }
}

/**
 * Generates entity file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 */
function generateEntityFile(name, dir) {
  const filename = `${paramCase(name)}.entity.ts`;
  const filePath = path.join(dir, filename);
  
  // Import the entity template generator function
  const { generateEntityTemplate } = require('./templates/entity.template');
  
  // Generate entity content
  let content;
  try {
    content = generateEntityTemplate(name);
  } catch (error) {
    logger.error(`Failed to generate entity content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate entity content: ${error.message}`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated entity: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write entity file: ${error.message}`, error.stack);
    throw new Error(`Failed to write entity file: ${error.message}`);
  }
}

/**
 * Generates Prisma model file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 */
function generatePrismaModelFile(name, dir, journey) {
  const filename = `${paramCase(name)}.model.ts`;
  const filePath = path.join(dir, filename);
  
  // Import the Prisma model template generator function
  const { generatePrismaModelTemplate, generatePrismaSchemaTemplate } = require('./templates/prisma.template');
  
  // Generate Prisma model content
  let modelContent, schemaContent;
  try {
    modelContent = generatePrismaModelTemplate(name, journey);
    schemaContent = generatePrismaSchemaTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate Prisma model content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate Prisma model content: ${error.message}`);
  }
  
  try {
    fs.writeFileSync(filePath, modelContent);
    logger.log(`Generated Prisma model: ${filePath}`);
    
    // Also generate Prisma schema extension file
    const schemaFilename = `${paramCase(name)}.prisma`;
    const schemaFilePath = path.join(dir, schemaFilename);
    
    fs.writeFileSync(schemaFilePath, schemaContent);
    logger.log(`Generated Prisma schema extension: ${schemaFilePath}`);
  } catch (error) {
    logger.error(`Failed to write Prisma model file: ${error.message}`, error.stack);
    throw new Error(`Failed to write Prisma model file: ${error.message}`);
  }
}

/**
 * Generates DTO files
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} useInterfaces - Whether to use @austa/interfaces
 */
function generateDtoFiles(name, dir, journey, useInterfaces) {
  if (useInterfaces) {
    // Generate a reference file for @austa/interfaces
    const referenceFilename = `${paramCase(name)}.dto.reference.ts`;
    const referenceContent = `/**
 * Reference file for DTOs from @austa/interfaces/${journey}
 * 
 * These DTOs are imported from the shared interfaces package:
 * - Create${pascalCase(name)}Dto
 * - Update${pascalCase(name)}Dto
 * - ${pascalCase(name)}Dto
 * 
 * Example usage:
 * import { Create${pascalCase(name)}Dto, Update${pascalCase(name)}Dto, ${pascalCase(name)}Dto } from '@austa/interfaces/${journey}';
 */

// This file is for reference only and does not contain actual implementations
`;
    
    try {
      fs.writeFileSync(path.join(dir, referenceFilename), referenceContent);
      logger.log(`Generated DTO reference: ${referenceFilename}`);
    } catch (error) {
      logger.error(`Failed to write DTO reference file: ${error.message}`, error.stack);
      throw new Error(`Failed to write DTO reference file: ${error.message}`);
    }
    
    return;
  }
  
  const createDtoFilename = `create-${paramCase(name)}.dto.ts`;
  const updateDtoFilename = `update-${paramCase(name)}.dto.ts`;
  const dtoDtoFilename = `${paramCase(name)}.dto.ts`;
  
  const createDtoContent = generateCreateDtoContent(name, journey);
  const updateDtoContent = generateUpdateDtoContent(name, journey);
  const dtoDtoContent = generateDtoDtoContent(name, journey);
  
  try {
    fs.writeFileSync(path.join(dir, createDtoFilename), createDtoContent);
    fs.writeFileSync(path.join(dir, updateDtoFilename), updateDtoContent);
    fs.writeFileSync(path.join(dir, dtoDtoFilename), dtoDtoContent);
    logger.log(`Generated DTOs: ${createDtoFilename}, ${updateDtoFilename}, ${dtoDtoFilename}`);
  } catch (error) {
    logger.error(`Failed to write DTO files: ${error.message}`, error.stack);
    throw new Error(`Failed to write DTO files: ${error.message}`);
  }
}

/**
 * Generates interface files
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 */
function generateInterfaceFiles(name, dir, journey) {
  const interfaceFilename = `${paramCase(name)}.interface.ts`;
  const filePath = path.join(dir, interfaceFilename);
  
  // Import the interface template generator function
  const { generateInterfaceTemplate } = require('./templates/interface.template');
  
  // Generate interface content
  let content;
  try {
    content = generateInterfaceTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate interface content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate interface content: ${error.message}`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated interface: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write interface file: ${error.message}`, error.stack);
    throw new Error(`Failed to write interface file: ${error.message}`);
  }
}

/**
 * Generates module file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} usePrisma - Whether to use Prisma instead of TypeORM
 * @param {boolean} useInterfaces - Whether to use @austa/interfaces
 */
function generateModuleFile(name, dir, journey, usePrisma, useInterfaces) {
  const filename = `${paramCase(name)}.module.ts`;
  const filePath = path.join(dir, filename);
  
  // Import the module template generator function
  const { generateModuleTemplate } = require('./templates/module.template');
  
  // Generate module content
  let content;
  try {
    content = generateModuleTemplate(name, journey, usePrisma, useInterfaces);
  } catch (error) {
    logger.error(`Failed to generate module content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate module content: ${error.message}`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated module: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to write module file: ${error.message}`, error.stack);
    throw new Error(`Failed to write module file: ${error.message}`);
  }
}

/**
 * Processes a template by replacing placeholders
 * @param {string} template - Template content
 * @param {string} name - Service name
 * @returns {string} Processed template
 */
function processTemplate(template, name) {
  let content = template;
  
  // Replace placeholders with actual values
  content = content.replace(/{{ pascalCase name }}/g, pascalCase(name));
  content = content.replace(/{{ camelCase name }}/g, camelCase(name));
  content = content.replace(/{{ dashCase name }}/g, paramCase(name));
  
  return content;
}

/**
 * Generates content for Create DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateCreateDtoContent(name, journey) {
  // Import the DTO template generator function
  const { generateCreateDtoTemplate } = require('./templates/dto.template');
  
  try {
    return generateCreateDtoTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate Create DTO content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate Create DTO content: ${error.message}`);
  }
}

/**
 * Generates content for Update DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateUpdateDtoContent(name, journey) {
  // Import the DTO template generator function
  const { generateUpdateDtoTemplate } = require('./templates/dto.template');
  
  try {
    return generateUpdateDtoTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate Update DTO content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate Update DTO content: ${error.message}`);
  }
}

/**
 * Generates content for DTO DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateDtoDtoContent(name, journey) {
  // Import the DTO template generator function
  const { generateDtoTemplate } = require('./templates/dto.template');
  
  try {
    return generateDtoTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate DTO content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate DTO content: ${error.message}`);
  }
}