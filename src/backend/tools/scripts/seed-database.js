/**
 * @fileoverview Seeds the database with initial data for development and testing.
 * @requires Node.js ≥18.0.0
 * @requires TypeScript 5.3.3
 * @requires NestJS 10.3.0
 */

import { NestFactory } from '@nestjs/core'; // @nestjs/core@10.3.0
import { Logger } from '@nestjs/common'; // @nestjs/common@10.3.0
import { PrismaService } from '@app/database';
import { RoleService } from '@app/auth/roles';
import { PermissionService } from '@app/auth/permissions';
import { UsersService } from '@app/auth/users';
import { CreateUserDto } from '@app/auth/users/dto';
import { defaultAdminUser } from '@app/auth/config';
import { DatabaseErrorType, DatabaseException } from '@app/database/errors';

/**
 * Seeds the database with initial data, including roles, permissions, and a default admin user.
 * This function is used for development and testing purposes.
 * @returns {Promise<void>} A promise that resolves when the database seeding is complete
 */
async function seedDatabase() {
  const logger = new Logger('SeedDatabase');
  logger.log('Starting database seeding process');
  
  let app;
  try {
    // Import the AppModule using the standardized path resolution
    const { AppModule } = await import('@app/auth');
    
    // Create a NestJS application context
    app = await NestFactory.createApplicationContext(AppModule);
    
    // Get service instances
    const prismaService = app.get(PrismaService);
    const roleService = app.get(RoleService);
    const permissionService = app.get(PermissionService);
    const usersService = app.get(UsersService);
    
    // Step 1: Seed initial roles
    logger.log('Seeding initial roles...');
    
    const roles = [
      // Core roles
      { name: 'Administrator', description: 'System administrator with full access', isDefault: false },
      { name: 'User', description: 'Standard user access to own data', isDefault: true },
      { name: 'Caregiver', description: 'Delegated access to specific user health data', isDefault: false },
      { name: 'Provider', description: 'Healthcare provider access', isDefault: false },
      
      // Health journey roles
      { name: 'Health Viewer', description: 'Read-only access to health data', isDefault: false, journey: 'health' },
      { name: 'Health Manager', description: 'Can update health goals and connect devices', isDefault: false, journey: 'health' },
      { name: 'Health Researcher', description: 'Can analyze anonymized health data', isDefault: false, journey: 'health' },
      
      // Care journey roles
      { name: 'Care Scheduler', description: 'Can book appointments', isDefault: false, journey: 'care' },
      { name: 'Care Provider', description: 'Can conduct telemedicine sessions', isDefault: false, journey: 'care' },
      { name: 'Care Coordinator', description: 'Can manage care plans and treatments', isDefault: false, journey: 'care' },
      
      // Plan journey roles
      { name: 'Plan Viewer', description: 'Can view coverage and benefits', isDefault: false, journey: 'plan' },
      { name: 'Claim Submitter', description: 'Can submit and track claims', isDefault: false, journey: 'plan' },
      { name: 'Benefit Manager', description: 'Can manage plan benefits and coverage', isDefault: false, journey: 'plan' }
    ];
    
    for (const role of roles) {
      try {
        const existingRole = await prismaService.role.findFirst({ where: { name: role.name } });
        if (!existingRole) {
          await roleService.create(role);
          logger.log(`Created role: ${role.name}`);
        } else {
          logger.log(`Role already exists: ${role.name}`);
        }
      } catch (error) {
        // Enhanced error handling using the new database error framework
        const dbError = error instanceof DatabaseException 
          ? error 
          : new DatabaseException(
              `Error processing role ${role.name}`, 
              DatabaseErrorType.QUERY, 
              { originalError: error }
            );
        
        logger.warn(`Failed to process role ${role.name}: ${dbError.message}`);
        logger.debug(dbError.stack);
      }
    }
    
    // Step 2: Seed initial permissions
    logger.log('Seeding initial permissions...');
    
    const permissions = [
      // Health journey permissions
      'health:metrics:read',
      'health:metrics:write',
      'health:history:read',
      'health:history:write',
      'health:goals:manage',
      'health:devices:connect',
      'health:insights:view',
      'health:reports:generate',
      
      // Care journey permissions
      'care:appointment:read',
      'care:appointment:create',
      'care:appointment:cancel',
      'care:telemedicine:initiate',
      'care:telemedicine:join',
      'care:medication:manage',
      'care:treatment:view',
      'care:treatment:update',
      'care:provider:search',
      
      // Plan journey permissions
      'plan:coverage:read',
      'plan:claims:read',
      'plan:claims:create',
      'plan:claims:appeal',
      'plan:benefits:read',
      'plan:documents:upload',
      'plan:documents:download',
      
      // System permissions
      'system:users:read',
      'system:users:create',
      'system:users:update',
      'system:users:delete',
      'system:roles:manage',
      'system:permissions:manage',
      'system:settings:read',
      'system:settings:update'
    ];
    
    for (const permission of permissions) {
      try {
        const existingPermission = await prismaService.permission.findFirst({ where: { name: permission } });
        if (!existingPermission) {
          await permissionService.create(permission);
          logger.log(`Created permission: ${permission}`);
        } else {
          logger.log(`Permission already exists: ${permission}`);
        }
      } catch (error) {
        // Enhanced error handling using the new database error framework
        const dbError = error instanceof DatabaseException 
          ? error 
          : new DatabaseException(
              `Error processing permission ${permission}`, 
              DatabaseErrorType.QUERY, 
              { originalError: error }
            );
        
        logger.warn(`Failed to process permission ${permission}: ${dbError.message}`);
        logger.debug(dbError.stack);
      }
    }
    
    // Step 3: Create default admin user if not exists
    logger.log('Checking for default admin user...');
    
    // Use the admin email from configuration or fallback to default
    const adminEmail = defaultAdminUser?.email || 'admin@austa.com.br';
    
    try {
      // Try to find admin user by email
      await usersService.findByEmail(adminEmail);
      logger.log('Default admin user already exists, skipping creation');
    } catch (error) {
      // Only proceed if the error indicates the user doesn't exist
      if (error.message?.includes('not found') || error.status === 404) {
        // Admin user doesn't exist, create it
        logger.log('Creating default admin user...');
        
        const adminData = new CreateUserDto();
        adminData.name = defaultAdminUser?.name || 'System Administrator';
        adminData.email = adminEmail;
        adminData.password = defaultAdminUser?.password || 'Admin@123456';
        adminData.phone = defaultAdminUser?.phone;
        adminData.cpf = defaultAdminUser?.cpf;
        
        try {
          const admin = await usersService.create(adminData);
          
          // Assign Administrator role to the new admin user
          try {
            const adminRole = await prismaService.role.findFirst({
              where: { name: 'Administrator' }
            });
            
            if (adminRole) {
              await usersService.assignRole(admin.id, adminRole.id.toString());
              logger.log(`Assigned Administrator role to user with ID: ${admin.id}`);
            }
          } catch (roleError) {
            // Enhanced error handling for role assignment
            const dbError = roleError instanceof DatabaseException 
              ? roleError 
              : new DatabaseException(
                  'Failed to assign Administrator role', 
                  DatabaseErrorType.QUERY, 
                  { originalError: roleError }
                );
            
            logger.error(`Failed to assign Administrator role: ${dbError.message}`);
            logger.debug(dbError.stack);
          }
          
          logger.log(`Created default admin user with ID: ${admin.id}`);
        } catch (createError) {
          // Enhanced error handling for user creation
          const dbError = createError instanceof DatabaseException 
            ? createError 
            : new DatabaseException(
                'Failed to create admin user', 
                DatabaseErrorType.QUERY, 
                { originalError: createError }
              );
          
          logger.error(`Failed to create admin user: ${dbError.message}`);
          logger.debug(dbError.stack);
        }
      } else {
        // Some other error occurred when checking for the admin user
        const dbError = error instanceof DatabaseException 
          ? error 
          : new DatabaseException(
              'Error checking for admin user', 
              DatabaseErrorType.QUERY, 
              { originalError: error }
            );
        
        logger.error(`Error checking for admin user: ${dbError.message}`);
        logger.debug(dbError.stack);
      }
    }
    
    // Step 4: Assign default permissions to roles
    logger.log('Assigning default permissions to roles...');
    
    const rolePermissions = [
      // Administrator gets all permissions
      { role: 'Administrator', permissions: permissions },
      
      // Health journey role permissions
      { role: 'Health Viewer', permissions: [
        'health:metrics:read',
        'health:history:read',
        'health:insights:view'
      ]},
      { role: 'Health Manager', permissions: [
        'health:metrics:read',
        'health:metrics:write',
        'health:history:read',
        'health:history:write',
        'health:goals:manage',
        'health:devices:connect',
        'health:insights:view',
        'health:reports:generate'
      ]},
      
      // Care journey role permissions
      { role: 'Care Scheduler', permissions: [
        'care:appointment:read',
        'care:appointment:create',
        'care:appointment:cancel',
        'care:provider:search'
      ]},
      { role: 'Care Provider', permissions: [
        'care:appointment:read',
        'care:telemedicine:initiate',
        'care:telemedicine:join',
        'care:treatment:view',
        'care:treatment:update',
        'health:metrics:read',
        'health:history:read'
      ]},
      
      // Plan journey role permissions
      { role: 'Plan Viewer', permissions: [
        'plan:coverage:read',
        'plan:benefits:read',
        'plan:claims:read'
      ]},
      { role: 'Claim Submitter', permissions: [
        'plan:coverage:read',
        'plan:claims:read',
        'plan:claims:create',
        'plan:claims:appeal',
        'plan:documents:upload',
        'plan:documents:download'
      ]}
    ];
    
    for (const { role, permissions } of rolePermissions) {
      try {
        const roleEntity = await prismaService.role.findFirst({ where: { name: role } });
        
        if (roleEntity) {
          for (const permission of permissions) {
            const permissionEntity = await prismaService.permission.findFirst({ 
              where: { name: permission } 
            });
            
            if (permissionEntity) {
              // Check if the permission is already assigned to the role
              const existing = await prismaService.rolePermission.findFirst({
                where: {
                  roleId: roleEntity.id,
                  permissionId: permissionEntity.id
                }
              });
              
              if (!existing) {
                await prismaService.rolePermission.create({
                  data: {
                    roleId: roleEntity.id,
                    permissionId: permissionEntity.id
                  }
                });
                logger.log(`Assigned permission ${permission} to role ${role}`);
              } else {
                logger.log(`Permission ${permission} already assigned to role ${role}`);
              }
            }
          }
        }
      } catch (error) {
        // Enhanced error handling for permission assignment
        const dbError = error instanceof DatabaseException 
          ? error 
          : new DatabaseException(
              `Error assigning permissions to role ${role}`, 
              DatabaseErrorType.QUERY, 
              { originalError: error }
            );
        
        logger.warn(`Failed to assign permissions to role ${role}: ${dbError.message}`);
        logger.debug(dbError.stack);
      }
    }
    
    logger.log('Database seeding completed successfully');
  } catch (error) {
    // Enhanced error handling for the overall seeding process
    const dbError = error instanceof DatabaseException 
      ? error 
      : new DatabaseException(
          'Database seeding failed', 
          DatabaseErrorType.QUERY, 
          { originalError: error }
        );
    
    logger.error(`Database seeding failed: ${dbError.message}`, dbError.stack);
  } finally {
    // Close the application context to release resources
    if (app) {
      await app.close();
    }
  }
}

// Execute the seed function
seedDatabase()
  .then(() => {
    Logger.log('Seed script execution completed successfully', 'SeedDatabase');
    process.exit(0);
  })
  .catch((error) => {
    // Final error handling for the script execution
    const finalError = error instanceof DatabaseException 
      ? error 
      : new DatabaseException(
          'Seed script execution failed', 
          DatabaseErrorType.QUERY, 
          { originalError: error }
        );
    
    Logger.error(`Seed script execution failed: ${finalError.message}`, 'SeedDatabase');
    process.exit(1);
  });