import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/shared/database';
import { AppException, ErrorType } from '@app/shared/exceptions';
import { LoggerService } from '@app/shared/logging';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserProfile } from '@austa/interfaces';
import * as bcrypt from 'bcrypt';

/**
 * Service for managing users in the AUSTA SuperApp.
 * Handles user creation, retrieval, update, and deletion operations.
 */
@Injectable()
export class UsersService {
  private readonly logger = new LoggerService();
  private readonly SALT_ROUNDS = 10;

  /**
   * Constructor
   * @param prisma The Prisma database service
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new user
   * 
   * @param createUserDto Data for creating a new user
   * @returns The created user (without password)
   */
  async create(createUserDto: CreateUserDto): Promise<Omit<any, 'password'>> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`, 'UsersService');
    
    try {
      // Check if user with this email already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: createUserDto.email }
      });
      
      if (existingUser) {
        this.logger.warn(`User with email ${createUserDto.email} already exists`, 'UsersService');
        throw new AppException(
          'User with this email already exists',
          ErrorType.BUSINESS,
          'USER_001',
          { email: createUserDto.email }
        );
      }
      
      // Hash the password
      const hashedPassword = await this.hashPassword(createUserDto.password);
      
      // Create the user
      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          password: hashedPassword,
          phone: createUserDto.phone,
          cpf: createUserDto.cpf,
          settings: {}
        }
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to create user: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to create user',
        ErrorType.TECHNICAL,
        'USER_002',
        null,
        error
      );
    }
  }

  /**
   * Retrieves all users
   * 
   * @returns Array of users (without passwords)
   */
  async findAll(): Promise<Omit<any, 'password'>[]> {
    this.logger.log('Retrieving all users', 'UsersService');
    
    try {
      // Get all users
      const users = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      // Remove passwords from the results
      return users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve users: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to retrieve users',
        ErrorType.TECHNICAL,
        'USER_003',
        null,
        error
      );
    }
  }

  /**
   * Finds a user by ID
   * 
   * @param id The ID of the user to find
   * @returns The user (without password) or null if not found
   */
  async findById(id: string): Promise<Omit<any, 'password'> | null> {
    this.logger.log(`Finding user with ID: ${id}`, 'UsersService');
    
    try {
      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { id: Number(id) }
      });
      
      if (!user) {
        return null;
      }
      
      // Remove password from the result
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Failed to find user by ID: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to find user',
        ErrorType.TECHNICAL,
        'USER_004',
        null,
        error
      );
    }
  }

  /**
   * Finds a user by email
   * 
   * @param email The email of the user to find
   * @returns The user (with password for authentication) or null if not found
   */
  async findByEmail(email: string): Promise<any | null> {
    this.logger.log(`Finding user with email: ${email}`, 'UsersService');
    
    try {
      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      
      return user || null;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to find user',
        ErrorType.TECHNICAL,
        'USER_005',
        null,
        error
      );
    }
  }

  /**
   * Updates a user
   * 
   * @param id The ID of the user to update
   * @param updateUserDto The data to update
   * @returns The updated user (without password)
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<Omit<any, 'password'>> {
    this.logger.log(`Updating user with ID: ${id}`, 'UsersService');
    
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingUser) {
        this.logger.warn(`User with ID ${id} not found`, 'UsersService');
        throw new AppException(
          'User not found',
          ErrorType.BUSINESS,
          'USER_006',
          { id }
        );
      }
      
      // Check if email is being updated and if it's already in use
      if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
        const userWithEmail = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email }
        });
        
        if (userWithEmail) {
          this.logger.warn(`Email ${updateUserDto.email} is already in use`, 'UsersService');
          throw new AppException(
            'Email is already in use',
            ErrorType.BUSINESS,
            'USER_007',
            { email: updateUserDto.email }
          );
        }
      }
      
      // Prepare update data
      const updateData: any = {};
      
      // Copy fields from DTO to update data
      if (updateUserDto.name) updateData.name = updateUserDto.name;
      if (updateUserDto.email) updateData.email = updateUserDto.email;
      if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
      if (updateUserDto.cpf) updateData.cpf = updateUserDto.cpf;
      
      // Update the user
      const updatedUser = await this.prisma.user.update({
        where: { id: Number(id) },
        data: updateData
      });
      
      // Remove password from the result
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to update user: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to update user',
        ErrorType.TECHNICAL,
        'USER_008',
        null,
        error
      );
    }
  }

  /**
   * Updates a user's password
   * 
   * @param id The ID of the user
   * @param currentPassword The current password for verification
   * @param newPassword The new password to set
   * @returns The updated user (without password)
   */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<Omit<any, 'password'>> {
    this.logger.log(`Updating password for user with ID: ${id}`, 'UsersService');
    
    try {
      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { id: Number(id) }
      });
      
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`, 'UsersService');
        throw new AppException(
          'User not found',
          ErrorType.BUSINESS,
          'USER_009',
          { id }
        );
      }
      
      // Verify current password
      const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
      
      if (!isPasswordValid) {
        this.logger.warn(`Invalid current password for user with ID: ${id}`, 'UsersService');
        throw new AppException(
          'Current password is incorrect',
          ErrorType.BUSINESS,
          'USER_010',
          null
        );
      }
      
      // Hash the new password
      const hashedPassword = await this.hashPassword(newPassword);
      
      // Update the password
      const updatedUser = await this.prisma.user.update({
        where: { id: Number(id) },
        data: { password: hashedPassword }
      });
      
      // Remove password from the result
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to update password: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to update password',
        ErrorType.TECHNICAL,
        'USER_011',
        null,
        error
      );
    }
  }

  /**
   * Deletes a user
   * 
   * @param id The ID of the user to delete
   */
  async delete(id: string): Promise<void> {
    this.logger.log(`Deleting user with ID: ${id}`, 'UsersService');
    
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingUser) {
        this.logger.warn(`User with ID ${id} not found`, 'UsersService');
        throw new AppException(
          'User not found',
          ErrorType.BUSINESS,
          'USER_012',
          { id }
        );
      }
      
      // Delete the user
      await this.prisma.user.delete({
        where: { id: Number(id) }
      });
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to delete user: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to delete user',
        ErrorType.TECHNICAL,
        'USER_013',
        null,
        error
      );
    }
  }

  /**
   * Verifies if a user's credentials are valid
   * 
   * @param email The user's email
   * @param password The password to verify
   * @returns The user if credentials are valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<Omit<any, 'password'> | null> {
    this.logger.log(`Validating credentials for user with email: ${email}`, 'UsersService');
    
    try {
      // Find the user by email
      const user = await this.findByEmail(email);
      
      if (!user) {
        return null;
      }
      
      // Verify the password
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Remove password from the result
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Failed to validate user: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to validate user',
        ErrorType.TECHNICAL,
        'USER_014',
        null,
        error
      );
    }
  }

  /**
   * Gets a user's profile
   * 
   * @param id The ID of the user
   * @returns The user's profile
   */
  async getUserProfile(id: string): Promise<IUserProfile> {
    this.logger.log(`Getting profile for user with ID: ${id}`, 'UsersService');
    
    try {
      // Find the user
      const user = await this.prisma.user.findUnique({
        where: { id: Number(id) },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (!user) {
        this.logger.warn(`User with ID ${id} not found`, 'UsersService');
        throw new AppException(
          'User not found',
          ErrorType.BUSINESS,
          'USER_015',
          { id }
        );
      }
      
      // Extract permissions from roles
      const permissions = user.roles.flatMap(userRole => 
        userRole.role.permissions.map(rolePermission => 
          rolePermission.permission.name
        )
      );
      
      // Create user profile
      const userProfile: IUserProfile = {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        cpf: user.cpf,
        roles: user.roles.map(userRole => userRole.role.name),
        permissions: [...new Set(permissions)], // Remove duplicates
        settings: user.settings,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return userProfile;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to get user profile: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to get user profile',
        ErrorType.TECHNICAL,
        'USER_016',
        null,
        error
      );
    }
  }

  /**
   * Updates a user's settings
   * 
   * @param id The ID of the user
   * @param settings The settings to update
   * @returns The updated user (without password)
   */
  async updateSettings(id: string, settings: Record<string, any>): Promise<Omit<any, 'password'>> {
    this.logger.log(`Updating settings for user with ID: ${id}`, 'UsersService');
    
    try {
      // Check if user exists
      const existingUser = await this.prisma.user.findUnique({
        where: { id: Number(id) }
      });
      
      if (!existingUser) {
        this.logger.warn(`User with ID ${id} not found`, 'UsersService');
        throw new AppException(
          'User not found',
          ErrorType.BUSINESS,
          'USER_017',
          { id }
        );
      }
      
      // Merge existing settings with new settings
      const updatedSettings = {
        ...existingUser.settings,
        ...settings
      };
      
      // Update the user's settings
      const updatedUser = await this.prisma.user.update({
        where: { id: Number(id) },
        data: { settings: updatedSettings }
      });
      
      // Remove password from the result
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      // If it's already an AppException, rethrow it
      if (error instanceof AppException) {
        throw error;
      }
      
      this.logger.error(`Failed to update user settings: ${error.message}`, error.stack, 'UsersService');
      throw new AppException(
        'Failed to update user settings',
        ErrorType.TECHNICAL,
        'USER_018',
        null,
        error
      );
    }
  }

  /**
   * Hashes a password using bcrypt
   * 
   * @param password The plain text password to hash
   * @returns The hashed password
   * @private
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verifies a password against a hash
   * 
   * @param plainPassword The plain text password to verify
   * @param hashedPassword The hashed password to compare against
   * @returns True if the password matches, false otherwise
   * @private
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}