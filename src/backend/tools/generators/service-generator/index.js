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
  .action((name, options) => {
    try {
      generateService(name, options.output, options.journey, options.prisma);
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
 */
function generateService(name, outputDir, journey, usePrisma = false) {
  logger.log(`Generating service: ${name}${journey ? ` for ${journey} journey` : ''}${usePrisma ? ' with Prisma' : ''}`);
  
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
  const entitiesDir = path.join(serviceDir, usePrisma ? 'models' : 'entities');
  const dtosDir = path.join(serviceDir, 'dto');
  const interfacesDir = path.join(serviceDir, 'interfaces');
  
  createDirectoryIfNotExists(serviceDir);
  createDirectoryIfNotExists(controllersDir);
  createDirectoryIfNotExists(servicesDir);
  createDirectoryIfNotExists(entitiesDir);
  createDirectoryIfNotExists(dtosDir);
  createDirectoryIfNotExists(interfacesDir);
  
  // Generate files
  generateControllerFile(name, controllersDir, journey);
  generateServiceFile(name, servicesDir, journey, usePrisma);
  
  if (usePrisma) {
    generatePrismaSchemaFile(name, entitiesDir, journey);
  } else {
    generateEntityFile(name, entitiesDir, journey);
  }
  
  generateDtoFiles(name, dtosDir, journey);
  generateInterfaceFiles(name, interfacesDir, journey);
  generateModuleFile(name, serviceDir, journey, usePrisma);
  
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
 */
function generateControllerFile(name, dir, journey) {
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
  const content = processTemplate(template, name, journey);
  
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
 */
function generateServiceFile(name, dir, journey, usePrisma) {
  const filename = `${paramCase(name)}.service.ts`;
  const filePath = path.join(dir, filename);
  
  // Read service template
  const templatePath = path.join(__dirname, 'templates', usePrisma ? 'service-prisma.template.ts' : 'service.template.ts');
  let template;
  
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (error) {
    logger.error(`Failed to read service template: ${error.message}`, error.stack);
    throw new Error(`Failed to read service template: ${error.message}`);
  }
  
  // Process template with service name and journey
  const content = processTemplate(template, name, journey);
  
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
 * @param {string} journey - Optional journey name
 */
function generateEntityFile(name, dir, journey) {
  const filename = `${paramCase(name)}.entity.ts`;
  const filePath = path.join(dir, filename);
  
  // Import the entity template generator function
  const { generateEntityTemplate } = require('./templates/entity.template');
  
  // Generate entity content
  let content;
  try {
    content = generateEntityTemplate(name, journey);
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
 * Generates Prisma schema file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 */
function generatePrismaSchemaFile(name, dir, journey) {
  const filename = `${paramCase(name)}.model.ts`;
  const filePath = path.join(dir, filename);
  
  // Import the Prisma model template generator function
  const { generatePrismaModelTemplate } = require('./templates/prisma-model.template');
  
  // Generate Prisma model content
  let content;
  try {
    content = generatePrismaModelTemplate(name, journey);
  } catch (error) {
    logger.error(`Failed to generate Prisma model content: ${error.message}`, error.stack);
    throw new Error(`Failed to generate Prisma model content: ${error.message}`);
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logger.log(`Generated Prisma model: ${filePath}`);
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
 */
function generateDtoFiles(name, dir, journey) {
  const createDtoFilename = `create-${paramCase(name)}.dto.ts`;
  const updateDtoFilename = `update-${paramCase(name)}.dto.ts`;
  const responseDtoFilename = `${paramCase(name)}-response.dto.ts`;
  
  const createDtoContent = generateCreateDtoContent(name, journey);
  const updateDtoContent = generateUpdateDtoContent(name, journey);
  const responseDtoContent = generateResponseDtoContent(name, journey);
  
  try {
    fs.writeFileSync(path.join(dir, createDtoFilename), createDtoContent);
    fs.writeFileSync(path.join(dir, updateDtoFilename), updateDtoContent);
    fs.writeFileSync(path.join(dir, responseDtoFilename), responseDtoContent);
    logger.log(`Generated DTOs: ${createDtoFilename}, ${updateDtoFilename}, ${responseDtoFilename}`);
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
  const serviceInterfaceFilename = `${paramCase(name)}-service.interface.ts`;
  
  const interfaceContent = generateInterfaceContent(name, journey);
  const serviceInterfaceContent = generateServiceInterfaceContent(name, journey);
  
  try {
    fs.writeFileSync(path.join(dir, interfaceFilename), interfaceContent);
    fs.writeFileSync(path.join(dir, serviceInterfaceFilename), serviceInterfaceContent);
    logger.log(`Generated interfaces: ${interfaceFilename}, ${serviceInterfaceFilename}`);
  } catch (error) {
    logger.error(`Failed to write interface files: ${error.message}`, error.stack);
    throw new Error(`Failed to write interface files: ${error.message}`);
  }
}

/**
 * Generates module file
 * @param {string} name - Service name
 * @param {string} dir - Output directory
 * @param {string} journey - Optional journey name
 * @param {boolean} usePrisma - Whether to use Prisma instead of TypeORM
 */
function generateModuleFile(name, dir, journey, usePrisma) {
  const filename = `${paramCase(name)}.module.ts`;
  const filePath = path.join(dir, filename);
  
  const pascalCaseName = pascalCase(name);
  const paramCaseName = paramCase(name);
  
  let content;
  if (usePrisma) {
    content = `import { Module } from '@nestjs/common';
import { ${pascalCaseName}Controller } from './controllers/${paramCaseName}.controller';
import { ${pascalCaseName}Service } from './services/${paramCaseName}.service';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@austa/logging';
import { JourneyErrorService } from '@austa/errors';

@Module({
  imports: [],
  controllers: [${pascalCaseName}Controller],
  providers: [
    ${pascalCaseName}Service, 
    PrismaService, 
    LoggerService,
    JourneyErrorService,
  ],
  exports: [${pascalCaseName}Service],
})
export class ${pascalCaseName}Module {}
`;
  } else {
    content = `import { Module } from '@nestjs/common';
import { ${pascalCaseName}Controller } from './controllers/${paramCaseName}.controller';
import { ${pascalCaseName}Service } from './services/${paramCaseName}.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${pascalCaseName} } from './entities/${paramCaseName}.entity';
import { LoggerService } from '@austa/logging';
import { JourneyErrorService } from '@austa/errors';

@Module({
  imports: [
    TypeOrmModule.forFeature([${pascalCaseName}]),
  ],
  controllers: [${pascalCaseName}Controller],
  providers: [
    ${pascalCaseName}Service, 
    LoggerService,
    JourneyErrorService,
  ],
  exports: [${pascalCaseName}Service],
})
export class ${pascalCaseName}Module {}
`;
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
 * @param {string} journey - Optional journey name
 * @returns {string} Processed template
 */
function processTemplate(template, name, journey = '') {
  let content = template;
  
  // Replace placeholders with actual values
  content = content.replace(/{{ pascalCase name }}/g, pascalCase(name));
  content = content.replace(/{{ camelCase name }}/g, camelCase(name));
  content = content.replace(/{{ dashCase name }}/g, paramCase(name));
  content = content.replace(/{{ journey }}/g, journey);
  content = content.replace(/{{ pascalCase journey }}/g, journey ? pascalCase(journey) : '');
  content = content.replace(/{{ camelCase journey }}/g, journey ? camelCase(journey) : '');
  content = content.replace(/{{ dashCase journey }}/g, journey ? paramCase(journey) : '');
  
  return content;
}

/**
 * Generates content for Create DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateCreateDtoContent(name, journey) {
  const pascalCaseName = pascalCase(name);
  const camelCaseName = camelCase(name);
  const journeyImport = journey ? `import { ${pascalCase(journey)}BaseDto } from '@austa/interfaces/journey/${paramCase(journey)}';` : '';
  
  return `import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
${journeyImport}

/**
 * DTO for creating a new ${pascalCaseName}
 */
export class Create${pascalCaseName}Dto {
  /**
   * Name of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Name of the ${camelCaseName}',
    example: 'Example ${pascalCaseName}',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Description of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Description of the ${camelCaseName}',
    example: 'This is an example ${camelCaseName}',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Whether the ${camelCaseName} is active
   */
  @ApiProperty({
    description: 'Whether the ${camelCaseName} is active',
    example: true,
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}`;
}

/**
 * Generates content for Update DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateUpdateDtoContent(name, journey) {
  const pascalCaseName = pascalCase(name);
  const camelCaseName = camelCase(name);
  const journeyImport = journey ? `import { ${pascalCase(journey)}BaseDto } from '@austa/interfaces/journey/${paramCase(journey)}';` : '';
  
  return `import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
${journeyImport}

/**
 * DTO for updating an existing ${pascalCaseName}
 */
export class Update${pascalCaseName}Dto {
  /**
   * Name of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Name of the ${camelCaseName}',
    example: 'Updated ${pascalCaseName}',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  /**
   * Description of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Description of the ${camelCaseName}',
    example: 'This is an updated ${camelCaseName}',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Whether the ${camelCaseName} is active
   */
  @ApiProperty({
    description: 'Whether the ${camelCaseName} is active',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}`;
}

/**
 * Generates content for Response DTO
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} DTO content
 */
function generateResponseDtoContent(name, journey) {
  const pascalCaseName = pascalCase(name);
  const camelCaseName = camelCase(name);
  const journeyImport = journey ? `import { ${pascalCase(journey)}BaseDto } from '@austa/interfaces/journey/${paramCase(journey)}';` : '';
  
  return `import { ApiProperty } from '@nestjs/swagger';
${journeyImport}

/**
 * DTO for ${pascalCaseName} responses
 */
export class ${pascalCaseName}ResponseDto {
  /**
   * Unique identifier
   */
  @ApiProperty({
    description: 'Unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  /**
   * Name of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Name of the ${camelCaseName}',
    example: 'Example ${pascalCaseName}'
  })
  name: string;

  /**
   * Description of the ${camelCaseName}
   */
  @ApiProperty({
    description: 'Description of the ${camelCaseName}',
    example: 'This is an example ${camelCaseName}',
    nullable: true
  })
  description?: string;

  /**
   * Whether the ${camelCaseName} is active
   */
  @ApiProperty({
    description: 'Whether the ${camelCaseName} is active',
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
}`;
}

/**
 * Generates content for entity interface
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} Interface content
 */
function generateInterfaceContent(name, journey) {
  const pascalCaseName = pascalCase(name);
  const camelCaseName = camelCase(name);
  const journeyImport = journey ? `import { ${pascalCase(journey)}Entity } from '@austa/interfaces/journey/${paramCase(journey)}';` : '';
  const journeyExtends = journey ? ` extends ${pascalCase(journey)}Entity` : '';
  
  return `${journeyImport}

/**
 * Interface for ${pascalCaseName} entity
 */
export interface I${pascalCaseName}${journeyExtends} {
  /**
   * Unique identifier
   */
  id: string;

  /**
   * Name of the ${camelCaseName}
   */
  name: string;

  /**
   * Description of the ${camelCaseName}
   */
  description?: string;

  /**
   * Whether the ${camelCaseName} is active
   */
  isActive: boolean;

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}`;
}

/**
 * Generates content for service interface
 * @param {string} name - Service name
 * @param {string} journey - Optional journey name
 * @returns {string} Interface content
 */
function generateServiceInterfaceContent(name, journey) {
  const pascalCaseName = pascalCase(name);
  const journeyImport = journey ? `import { ${pascalCase(journey)}Service } from '@austa/interfaces/journey/${paramCase(journey)}';` : '';
  const journeyExtends = journey ? ` extends ${pascalCase(journey)}Service` : '';
  
  return `import { I${pascalCaseName} } from './${paramCase(name)}.interface';
import { Create${pascalCaseName}Dto } from '../dto/create-${paramCase(name)}.dto';
import { Update${pascalCaseName}Dto } from '../dto/update-${paramCase(name)}.dto';
${journeyImport}

/**
 * Interface for ${pascalCaseName} service
 */
export interface I${pascalCaseName}Service${journeyExtends} {
  /**
   * Creates a new ${pascalCaseName}
   * @param data - The data to create the ${pascalCaseName} with
   * @returns The created ${pascalCaseName}
   */
  create(data: Create${pascalCaseName}Dto): Promise<I${pascalCaseName}>;

  /**
   * Finds all ${pascalCaseName}s
   * @returns A list of ${pascalCaseName}s
   */
  findAll(): Promise<I${pascalCaseName}[]>;

  /**
   * Finds a ${pascalCaseName} by ID
   * @param id - The ID of the ${pascalCaseName} to find
   * @returns The found ${pascalCaseName}
   */
  findOne(id: string): Promise<I${pascalCaseName}>;

  /**
   * Updates a ${pascalCaseName}
   * @param id - The ID of the ${pascalCaseName} to update
   * @param data - The data to update the ${pascalCaseName} with
   * @returns The updated ${pascalCaseName}
   */
  update(id: string, data: Update${pascalCaseName}Dto): Promise<I${pascalCaseName}>;

  /**
   * Removes a ${pascalCaseName}
   * @param id - The ID of the ${pascalCaseName} to remove
   */
  remove(id: string): Promise<void>;
}`;
}