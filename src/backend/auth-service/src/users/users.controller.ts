import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { JwtAuthGuard } from '@app/auth/guards/jwt-auth.guard';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { RolesGuard } from '@app/auth/guards/roles.guard';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { IUserProfile } from '@austa/interfaces';
import { AppException, ErrorType } from '@app/shared/exceptions';

/**
 * Controller for managing users in the AUSTA SuperApp.
 * Provides endpoints for user creation, retrieval, update, and deletion.
 * Most endpoints are secured with JWT authentication and role-based access control.
 */
@Controller('users')
export class UsersController {
  /**
   * Constructor
   * @param usersService The service for user management operations
   */
  constructor(private readonly usersService: UsersService) {}

  /**
   * Creates a new user
   * This endpoint is public to allow user registration
   * 
   * @param createUserDto Data for creating a new user
   * @returns The created user (without password)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  /**
   * Retrieves all users
   * This endpoint is restricted to administrators
   * 
   * @returns Array of users (without passwords)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.usersService.findAll();
  }

  /**
   * Retrieves the profile of the authenticated user
   * 
   * @param currentUser The authenticated user making the request
   * @returns The user's profile
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() currentUser: IUserProfile) {
    return this.usersService.getUserProfile(currentUser.id);
  }

  /**
   * Updates the password of the authenticated user
   * 
   * @param currentUser The authenticated user making the request
   * @param updatePasswordDto The current and new passwords
   * @returns The updated user (without password)
   */
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @CurrentUser() currentUser: IUserProfile,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    return this.usersService.updatePassword(
      currentUser.id,
      updatePasswordDto.currentPassword,
      updatePasswordDto.newPassword
    );
  }

  /**
   * Updates the settings of the authenticated user
   * 
   * @param currentUser The authenticated user making the request
   * @param updateSettingsDto The settings to update
   * @returns The updated user (without password)
   */
  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  async updateSettings(
    @CurrentUser() currentUser: IUserProfile,
    @Body() updateSettingsDto: UpdateSettingsDto
  ) {
    return this.usersService.updateSettings(currentUser.id, updateSettingsDto.settings);
  }

  /**
   * Retrieves a user by ID
   * 
   * @param id The ID of the user to retrieve
   * @returns The user (without password)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    
    if (!user) {
      throw new AppException(
        'User not found',
        ErrorType.BUSINESS,
        'USER_404',
        { id }
      );
    }
    
    return user;
  }

  /**
   * Updates a user
   * Users can only update their own profile unless they have admin role
   * 
   * @param id The ID of the user to update
   * @param updateUserDto The data to update
   * @param currentUser The authenticated user making the request
   * @returns The updated user (without password)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'user')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: IUserProfile
  ) {
    // Check if user is updating their own profile or has admin role
    if (currentUser.id !== id && !currentUser.roles.includes('admin')) {
      throw new AppException(
        'You can only update your own profile',
        ErrorType.BUSINESS,
        'USER_403',
        null
      );
    }
    
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Deletes a user
   * Only administrators can delete users
   * 
   * @param id The ID of the user to delete
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.usersService.delete(id);
  }
}