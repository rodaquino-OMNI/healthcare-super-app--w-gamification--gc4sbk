import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '@app/auth';
import { ProvidersService } from './providers.service';
import { Provider } from './entities/provider.entity';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { CurrentUser } from '@app/auth/decorators/current-user.decorator';
import { Roles } from '@app/auth/decorators/roles.decorator';
import { IProvider } from '@austa/interfaces/journey/care';
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
} from '@austa/errors/journey/care';
import { ErrorType } from '@austa/errors/types';
import { IUser } from '@austa/interfaces/auth';

/**
 * Controller for managing healthcare provider-related endpoints in the Care Now journey.
 */
@Controller('providers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProvidersController {
  private readonly logger = new Logger(ProvidersController.name);

  /**
   * Initializes the ProvidersController with required dependencies.
   * 
   * @param providersService Service for managing provider data and operations
   */
  constructor(private readonly providersService: ProvidersService) {}

  /**
   * Retrieves a list of providers based on search criteria and pagination options.
   * 
   * @param searchDto Search criteria for filtering providers
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  @Get()
  @Roles('user', 'provider', 'admin')
  async findAll(
    @Query() searchDto: SearchProvidersDto,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ providers: IProvider[]; total: number }> {
    this.logger.log({
      message: 'Finding providers with search criteria',
      searchCriteria: searchDto,
      journey: 'care',
      operation: 'findAllProviders'
    });
    return this.providersService.findAll(searchDto, paginationDto);
  }

  /**
   * Searches for providers that offer telemedicine services.
   * 
   * @param paginationDto Pagination options
   * @returns List of telemedicine providers and total count
   */
  @Get('telemedicine')
  @Roles('user', 'provider', 'admin')
  async getTelemedicineProviders(
    @Query() paginationDto: PaginationDto,
  ): Promise<{ providers: IProvider[]; total: number }> {
    this.logger.log({
      message: 'Getting providers with telemedicine capabilities',
      journey: 'care',
      operation: 'getTelemedicineProviders'
    });
    return this.providersService.getTelemedicineProviders(paginationDto);
  }

  /**
   * Searches for providers by medical specialty.
   * 
   * @param specialty Specialty to search for
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  @Get('specialty/:specialty')
  @Roles('user', 'provider', 'admin')
  async searchBySpecialty(
    @Param('specialty') specialty: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ providers: IProvider[]; total: number }> {
    this.logger.log({
      message: 'Searching providers by specialty',
      specialty,
      journey: 'care',
      operation: 'searchBySpecialty'
    });
    return this.providersService.searchBySpecialty(specialty, paginationDto);
  }

  /**
   * Searches for providers by location.
   * 
   * @param location Location to search for
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  @Get('location/:location')
  @Roles('user', 'provider', 'admin')
  async searchByLocation(
    @Param('location') location: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<{ providers: IProvider[]; total: number }> {
    this.logger.log({
      message: 'Searching providers by location',
      location,
      journey: 'care',
      operation: 'searchByLocation'
    });
    return this.providersService.searchByLocation(location, paginationDto);
  }

  /**
   * Retrieves a provider by their unique identifier.
   * 
   * @param id Provider ID
   * @returns The provider if found
   */
  @Get(':id')
  @Roles('user', 'provider', 'admin')
  async findById(@Param('id') id: string): Promise<IProvider> {
    this.logger.log({
      message: 'Finding provider by ID',
      providerId: id,
      journey: 'care',
      operation: 'findProviderById'
    });
    return this.providersService.findById(id);
  }

  /**
   * Checks a provider's availability for a specific date and time.
   * 
   * @param id Provider ID
   * @param dateTime Date and time to check availability (ISO string)
   * @returns Availability status
   */
  @Get(':id/availability')
  @Roles('user', 'provider', 'admin')
  async checkAvailability(
    @Param('id') id: string,
    @Query('dateTime') dateTime: string,
  ): Promise<{ available: boolean }> {
    this.logger.log({
      message: 'Checking provider availability',
      providerId: id,
      dateTime,
      journey: 'care',
      operation: 'checkProviderAvailability'
    });
    
    try {
      const date = new Date(dateTime);
      if (isNaN(date.getTime())) {
        throw new ProviderUnavailableError(
          'Invalid date format',
          { dateTime },
          'CARE_019'
        );
      }
      
      const available = await this.providersService.checkAvailability(id, date);
      return { available };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      
      this.logger.error({
        message: 'Error checking provider availability',
        providerId: id,
        dateTime,
        error: error.message,
        stack: error.stack,
        journey: 'care',
        operation: 'checkProviderAvailability'
      });
      
      throw new ProviderUnavailableError(
        'Failed to check provider availability',
        { id, dateTime },
        'CARE_020',
        error
      );
    }
  }

  /**
   * Retrieves available time slots for a provider on a specific date.
   * 
   * @param id Provider ID
   * @param date Date to check availability (ISO string)
   * @returns List of time slots with availability
   */
  @Get(':id/time-slots')
  @Roles('user', 'provider', 'admin')
  async getAvailableTimeSlots(
    @Param('id') id: string,
    @Query('date') date: string,
  ): Promise<{ timeSlots: { time: string; available: boolean }[] }> {
    this.logger.log({
      message: 'Getting available time slots for provider',
      providerId: id,
      date,
      journey: 'care',
      operation: 'getProviderTimeSlots'
    });
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new ProviderUnavailableError(
          'Invalid date format',
          { date },
          'CARE_021'
        );
      }
      
      const timeSlots = await this.providersService.getAvailableTimeSlots(id, dateObj);
      return { timeSlots };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      
      this.logger.error({
        message: 'Error getting provider time slots',
        providerId: id,
        date,
        error: error.message,
        stack: error.stack,
        journey: 'care',
        operation: 'getProviderTimeSlots'
      });
      
      throw new ProviderUnavailableError(
        'Failed to get provider time slots',
        { id, date },
        'CARE_022',
        error
      );
    }
  }

  /**
   * Creates a new provider in the system.
   * 
   * @param providerData Provider data
   * @param user Current user (admin)
   * @returns The newly created provider
   */
  @Post()
  @Roles('admin')
  async create(
    @Body() providerData: Provider,
    @CurrentUser() user: IUser,
  ): Promise<IProvider> {
    this.logger.log({
      message: 'Creating new provider',
      providerData: { ...providerData, id: undefined }, // Exclude ID for security
      userId: user.id,
      userRole: user.role,
      journey: 'care',
      operation: 'createProvider'
    });
    return this.providersService.create(providerData);
  }

  /**
   * Updates an existing provider's information.
   * 
   * @param id Provider ID
   * @param providerData Updated provider data
   * @param user Current user (admin)
   * @returns The updated provider
   */
  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() providerData: Provider,
    @CurrentUser() user: IUser,
  ): Promise<IProvider> {
    this.logger.log({
      message: 'Updating provider',
      providerId: id,
      providerData: { ...providerData, id: undefined }, // Exclude ID for security
      userId: user.id,
      userRole: user.role,
      journey: 'care',
      operation: 'updateProvider'
    });
    return this.providersService.update(id, providerData);
  }

  /**
   * Removes a provider from the system.
   * 
   * @param id Provider ID
   * @param user Current user (admin)
   * @returns Success status of the deletion
   */
  @Delete(':id')
  @Roles('admin')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
  ): Promise<{ success: boolean }> {
    this.logger.log({
      message: 'Deleting provider',
      providerId: id,
      userId: user.id,
      userRole: user.role,
      journey: 'care',
      operation: 'deleteProvider'
    });
    const success = await this.providersService.delete(id);
    return { success };
  }