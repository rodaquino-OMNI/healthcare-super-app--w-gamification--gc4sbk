# NestJS Service Generator

A CLI tool for generating NestJS service modules with controllers, services, entities/models, DTOs, and interfaces.

## Features

- Generates complete NestJS service modules with all required components
- Supports both TypeORM and Prisma for database access
- Integrates with @austa/interfaces for type-safe models
- Supports journey-specific error handling and database contexts
- Generates comprehensive documentation with JSDoc comments
- Implements standardized path aliases (@app/shared, @austa/*)

## Installation

This tool is included in the AUSTA SuperApp monorepo and can be used directly from the command line.

```bash
npm install -g src/backend/tools/generators/service-generator
```

Or you can run it directly with npx:

```bash
npx src/backend/tools/generators/service-generator <name> [options]
```

## Usage

```bash
service-generator <name> [options]
```

### Arguments

- `<name>`: Service name (e.g., "health-metric")

### Options

- `-o, --output <directory>`: Output directory (default: "./src")
- `-j, --journey <journey>`: Journey name (health, care, plan) (default: "")
- `-p, --prisma`: Generate Prisma schema instead of TypeORM entity (default: false)
- `-i, --interfaces`: Use @austa/interfaces for type-safe models (default: false)
- `-h, --help`: Display help for command
- `-V, --version`: Output the version number

## Examples

### Generate a basic service

```bash
service-generator health-metric
```

### Generate a service for a specific journey

```bash
service-generator health-metric -j health
```

### Generate a service with Prisma

```bash
service-generator health-metric -j health -p
```

### Generate a service with @austa/interfaces

```bash
service-generator health-metric -j health -i
```

### Generate a service with Prisma and @austa/interfaces

```bash
service-generator health-metric -j health -p -i
```

## Generated Files

The generator creates the following files:

### With TypeORM

- `controllers/<name>.controller.ts`: Controller with CRUD endpoints
- `services/<name>.service.ts`: Service with business logic
- `entities/<name>.entity.ts`: TypeORM entity
- `dtos/create-<name>.dto.ts`: DTO for creating entities
- `dtos/update-<name>.dto.ts`: DTO for updating entities
- `dtos/<name>.dto.ts`: DTO for returning entities
- `interfaces/<name>.interface.ts`: Interface for the entity (if not using @austa/interfaces)
- `<name>.module.ts`: Module that ties everything together

### With Prisma

- `controllers/<name>.controller.ts`: Controller with CRUD endpoints
- `services/<name>.service.ts`: Service with business logic
- `models/<name>.model.ts`: Prisma model wrapper
- `models/<name>.prisma`: Prisma schema extension
- `dtos/create-<name>.dto.ts`: DTO for creating entities
- `dtos/update-<name>.dto.ts`: DTO for updating entities
- `dtos/<name>.dto.ts`: DTO for returning entities
- `interfaces/<name>.interface.ts`: Interface for the entity (if not using @austa/interfaces)
- `<name>.module.ts`: Module that ties everything together

### With @austa/interfaces

When using @austa/interfaces, the generator creates a reference file instead of actual DTOs:

- `dtos/<name>.dto.reference.ts`: Reference file for DTOs from @austa/interfaces

## License

This project is licensed under the MIT License - see the LICENSE file for details.