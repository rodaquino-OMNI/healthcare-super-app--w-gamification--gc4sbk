import { pascalCase, paramCase } from 'change-case';

/**
 * Generates the content for a module file based on the provided service name.
 * @param serviceName - The name of the service
 * @param journey - Optional journey name
 * @param usePrisma - Whether to use Prisma instead of TypeORM
 * @param useInterfaces - Whether to use @austa/interfaces
 * @returns The content of the module file
 */
export function generateModuleTemplate(serviceName: string, journey?: string, usePrisma = false, useInterfaces = false): string {
  // Convert service name to proper cases
  const moduleName = pascalCase(serviceName);
  const serviceNameParam = paramCase(serviceName);
  
  // Construct the module file content based on options
  if (usePrisma) {
    return `import { Module } from '@nestjs/common';
import { ${moduleName}Controller } from './controllers/${serviceNameParam}.controller';
import { ${moduleName}Service } from './services/${serviceNameParam}.service';
import { PrismaService } from '@austa/database';
import { LoggerService } from '@app/shared/logging';

@Module({
  imports: [],
  controllers: [${moduleName}Controller],
  providers: [
    ${moduleName}Service, 
    PrismaService,
    LoggerService
  ],
  exports: [${moduleName}Service],
})
export class ${moduleName}Module {}
`;
  } else {
    return `import { Module } from '@nestjs/common';
import { ${moduleName}Controller } from './controllers/${serviceNameParam}.controller';
import { ${moduleName}Service } from './services/${serviceNameParam}.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ${moduleName} } from './entities/${serviceNameParam}.entity';
import { LoggerService } from '@app/shared/logging';

@Module({
  imports: [
    TypeOrmModule.forFeature([${moduleName}]),
  ],
  controllers: [${moduleName}Controller],
  providers: [${moduleName}Service, LoggerService],
  exports: [${moduleName}Service],
})
export class ${moduleName}Module {}
`;
  }
}