import { Injectable, Logger } from '@nestjs/common';
import { IProvider } from '@austa/interfaces/journey/care';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { PrismaService } from '@austa/database';
import { retry } from '@austa/errors/utils';
import { CircuitBreaker } from '@austa/errors/circuit-breaker';
import {
  ProviderNotFoundError,
  ProviderUnavailableError,
  ProviderPersistenceError,
  ProviderValidationError
} from '@austa/errors/journey/care';

/**
 * Service responsible for managing healthcare providers, including search, 
 * availability checking, and provider data management.
 */
@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  private readonly providerSystemBreaker: CircuitBreaker;

  /**
   * Initializes the ProvidersService with required dependencies.
   * 
   * @param prisma Enhanced database service for provider data access with connection pooling
   */
  constructor(private readonly prisma: PrismaService) {
    // Initialize circuit breaker for external provider system integrations
    this.providerSystemBreaker = new CircuitBreaker({
      name: 'provider-system',
      failureThreshold: 5,
      resetTimeout: 30000, // 30 seconds
      fallback: () => null
    });
  }

  /**
   * Retrieves a list of providers based on search criteria and pagination options.
   *
   * @param searchDto Search criteria for filtering providers
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  async findAll(
    searchDto: SearchProvidersDto, 
    paginationDto: PaginationDto
  ): Promise<{ providers: IProvider[]; total: number }> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      // Build filter based on search criteria
      const where: Record<string, any> = {};
      
      if (searchDto.specialty) {
        where.specialty = {
          contains: searchDto.specialty,
          mode: 'insensitive'
        };
      }
      
      if (searchDto.location) {
        where.location = {
          contains: searchDto.location,
          mode: 'insensitive'
        };
      }
      
      if (searchDto.name) {
        where.name = {
          contains: searchDto.name,
          mode: 'insensitive'
        };
      }

      // Apply custom where conditions if provided
      if (searchDto.where) {
        Object.assign(where, searchDto.where);
      }

      // Use retry with exponential backoff for database operations
      const providers = await retry(
        () => this.prisma.provider.findMany({
          where,
          skip,
          take: limit,
          orderBy: searchDto.orderBy || { name: 'asc' },
          include: searchDto.include,
          select: searchDto.select
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2,
          onRetry: (error, attempt) => {
            this.logger.warn(`Retrying findAll providers (attempt ${attempt}): ${error.message}`);
          }
        }
      );

      // Count total for pagination with retry
      const total = await retry(
        () => this.prisma.provider.count({ where }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );

      return { providers, total };
    } catch (error) {
      this.logger.error(`Failed to find providers: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        'Failed to retrieve providers',
        { searchDto, paginationDto },
        error
      );
    }
  }

  /**
   * Retrieves a provider by their unique identifier.
   *
   * @param id Provider ID
   * @returns The provider if found
   */
  async findById(id: string): Promise<IProvider> {
    try {
      // Use retry with exponential backoff for database operations
      const provider = await retry(
        () => this.prisma.provider.findUnique({
          where: { id }
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );

      if (!provider) {
        throw new ProviderNotFoundError(
          `Provider with ID ${id} not found`,
          { id }
        );
      }

      return provider;
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to find provider: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        `Failed to retrieve provider with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Creates a new provider in the system.
   *
   * @param providerData Provider data without ID
   * @returns The newly created provider
   */
  async create(providerData: Omit<IProvider, 'id'>): Promise<IProvider> {
    try {
      // Validate provider data
      this.validateProviderData(providerData);

      // Create provider with retry for transient database errors
      const provider = await retry(
        () => this.prisma.provider.create({
          data: providerData
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2,
          onRetry: (error, attempt) => {
            this.logger.warn(`Retrying provider creation (attempt ${attempt}): ${error.message}`);
          }
        }
      );

      this.logger.log(`Provider created: ${provider.id}`);
      return provider;
    } catch (error) {
      if (error instanceof ProviderValidationError) {
        throw error;
      }
      
      this.logger.error(`Failed to create provider: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        'Failed to create provider',
        { providerData },
        error
      );
    }
  }

  /**
   * Updates an existing provider's information.
   *
   * @param id Provider ID
   * @param providerData Updated provider data
   * @returns The updated provider
   */
  async update(id: string, providerData: Partial<IProvider>): Promise<IProvider> {
    try {
      // Check if provider exists
      await this.findById(id);

      // Update provider with retry for transient database errors
      const updatedProvider = await retry(
        () => this.prisma.provider.update({
          where: { id },
          data: providerData
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2,
          onRetry: (error, attempt) => {
            this.logger.warn(`Retrying provider update (attempt ${attempt}): ${error.message}`);
          }
        }
      );

      this.logger.log(`Provider updated: ${id}`);
      return updatedProvider;
    } catch (error) {
      if (error instanceof ProviderNotFoundError || error instanceof ProviderValidationError) {
        throw error;
      }
      
      this.logger.error(`Failed to update provider: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        `Failed to update provider with ID ${id}`,
        { id, providerData },
        error
      );
    }
  }

  /**
   * Removes a provider from the system.
   *
   * @param id Provider ID
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Check if provider exists
      await this.findById(id);
      
      // Use a transaction to ensure data consistency
      return await this.prisma.$transaction(async (tx) => {
        // Check if provider has any active appointments
        const activeAppointments = await tx.appointment.count({
          where: {
            providerId: id,
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        });
        
        if (activeAppointments > 0) {
          throw new ProviderUnavailableError(
            `Cannot delete provider with ID ${id} due to ${activeAppointments} active appointments`,
            { id, activeAppointments }
          );
        }

        // Delete provider
        await tx.provider.delete({
          where: { id }
        });

        return true;
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError || error instanceof ProviderUnavailableError) {
        throw error;
      }
      
      this.logger.error(`Failed to delete provider: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        `Failed to delete provider with ID ${id}`,
        { id },
        error
      );
    }
  }

  /**
   * Checks a provider's availability for a specific date and time.
   *
   * @param providerId Provider ID
   * @param dateTime Date and time to check availability
   * @returns True if the provider is available
   */
  async checkAvailability(providerId: string, dateTime: Date): Promise<boolean> {
    try {
      // Check if provider exists
      await this.findById(providerId);
      
      // Check for existing appointments at the requested time with retry
      const existingAppointment = await retry(
        () => this.prisma.appointment.findFirst({
          where: {
            providerId,
            dateTime: {
              // Check for appointments that overlap with the requested time
              // (assuming appointments are 1 hour long)
              gte: new Date(dateTime.getTime() - 30 * 60000), // 30 minutes before
              lte: new Date(dateTime.getTime() + 30 * 60000), // 30 minutes after
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );
      
      // Provider is available if no appointments exist at the requested time
      return !existingAppointment;
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to check provider availability: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        `Failed to check availability for provider with ID ${providerId}`,
        { providerId, dateTime },
        error
      );
    }
  }

  /**
   * Retrieves available time slots for a provider on a specific date.
   *
   * @param providerId Provider ID
   * @param date Date to check availability
   * @returns List of time slots with availability status
   */
  async getAvailableTimeSlots(
    providerId: string, 
    date: Date
  ): Promise<{ time: string; available: boolean }[]> {
    try {
      // Check if provider exists
      await this.findById(providerId);

      // Generate all possible time slots for the day (9AM to 5PM, 1-hour slots)
      const timeSlots: { time: string; available: boolean }[] = [];
      const startHour = 9; // 9 AM
      const endHour = 17; // 5 PM

      date.setHours(0, 0, 0, 0); // Reset time to start of day
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setDate(dateEnd.getDate() + 1); // Next day

      // Get all appointments for the provider on the specified day with retry
      const appointments = await retry(
        () => this.prisma.appointment.findMany({
          where: {
            providerId,
            dateTime: {
              gte: dateStart,
              lt: dateEnd
            },
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );

      // Generate hourly time slots
      for (let hour = startHour; hour < endHour; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour);
        
        const timeString = slotTime.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        // Check if there's an appointment at this time slot
        const isBooked = appointments.some(appointment => {
          const apptHour = appointment.dateTime.getHours();
          return apptHour === hour;
        });
        
        timeSlots.push({
          time: timeString,
          available: !isBooked
        });
      }

      return timeSlots;
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to get provider time slots: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        `Failed to retrieve time slots for provider with ID ${providerId}`,
        { providerId, date },
        error
      );
    }
  }

  /**
   * Searches for providers by medical specialty.
   *
   * @param specialty Specialty to search for
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  async searchBySpecialty(
    specialty: string, 
    paginationDto: PaginationDto
  ): Promise<{ providers: IProvider[]; total: number }> {
    const searchDto: SearchProvidersDto = { specialty };
    return this.findAll(searchDto, paginationDto);
  }

  /**
   * Searches for providers by location.
   *
   * @param location Location to search for
   * @param paginationDto Pagination options
   * @returns List of providers and total count
   */
  async searchByLocation(
    location: string, 
    paginationDto: PaginationDto
  ): Promise<{ providers: IProvider[]; total: number }> {
    const searchDto: SearchProvidersDto = { location };
    return this.findAll(searchDto, paginationDto);
  }

  /**
   * Retrieves providers that offer telemedicine services.
   * Uses circuit breaker pattern for external provider system integration.
   *
   * @param paginationDto Pagination options
   * @returns List of telemedicine providers and total count
   */
  async getTelemedicineProviders(
    paginationDto: PaginationDto
  ): Promise<{ providers: IProvider[]; total: number }> {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      // Use circuit breaker for external provider system integration
      // This is a simulated external call wrapped in a circuit breaker
      const externalProviderCheck = await this.providerSystemBreaker.execute(
        async () => {
          // Simulated external call to verify telemedicine system status
          // In a real implementation, this would be an actual API call
          return { status: 'ONLINE' };
        }
      );

      // If external system is unavailable, fall back to local database only
      const useExternalData = externalProviderCheck && externalProviderCheck.status === 'ONLINE';

      // Query providers that offer telemedicine with retry
      const providers = await retry(
        () => this.prisma.provider.findMany({
          where: {
            telemedicineAvailable: true
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          }
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );

      // Count total for pagination with retry
      const total = await retry(
        () => this.prisma.provider.count({
          where: {
            telemedicineAvailable: true
          }
        }),
        {
          retries: 3,
          minTimeout: 300,
          factor: 2
        }
      );

      // If external system is available, we could enrich the data here
      // This is a placeholder for where that enrichment would happen
      if (useExternalData) {
        this.logger.log('Using external provider system data for telemedicine providers');
        // In a real implementation, we would enrich the provider data here
      }

      return { providers, total };
    } catch (error) {
      this.logger.error(`Failed to find telemedicine providers: ${error.message}`, error.stack);
      throw new ProviderPersistenceError(
        'Failed to retrieve telemedicine providers',
        { paginationDto },
        error
      );
    }
  }

  /**
   * Validates provider data for creation or update.
   * 
   * @param providerData Provider data to validate
   * @private
   */
  private validateProviderData(providerData: Partial<IProvider>): void {
    // Check required fields
    if (!providerData.name) {
      throw new ProviderValidationError(
        'Provider name is required',
        { providerData }
      );
    }
    
    if (!providerData.specialty) {
      throw new ProviderValidationError(
        'Provider specialty is required',
        { providerData }
      );
    }
    
    if (!providerData.location) {
      throw new ProviderValidationError(
        'Provider location is required',
        { providerData }
      );
    }
    
    // Validate email format
    if (providerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerData.email)) {
      throw new ProviderValidationError(
        'Invalid email format',
        { email: providerData.email }
      );
    }
    
    // Validate phone format (simple validation)
    if (providerData.phone && !/^\+?[0-9\s()-]{8,20}$/.test(providerData.phone)) {
      throw new ProviderValidationError(
        'Invalid phone number format',
        { phone: providerData.phone }
      );
    }
  }
}