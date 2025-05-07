import { Injectable, Logger } from '@nestjs/common';
import { Provider } from '@austa/interfaces/care';
import { SearchProvidersDto } from './dto/search-providers.dto';
import { PrismaService } from '@app/shared/database/prisma.service';
import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { 
  BusinessRuleViolationError,
  ResourceNotFoundError,
  ValidationError,
  ExternalApiError,
  DatabaseError
} from '@austa/errors/categories';
import { ProviderNotFoundError, ProviderUnavailableError } from '@austa/errors/journey/care';
import { retry, RetryOptions } from '@austa/errors/utils/retry';
import { CircuitBreaker, CircuitBreakerOptions } from '@austa/errors/utils/circuit-breaker';

/**
 * Default retry options for database operations
 * Implements exponential backoff strategy for transient database errors
 */
const DB_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  backoffFactor: 2, // Exponential growth factor for retry delays
  initialDelay: 100, // Start with a short delay (100ms)
  maxDelay: 2000, // Cap maximum delay at 2 seconds
  shouldRetry: (error) => {
    // Retry on connection errors or transient database errors
    return error.message.includes('connection') || 
           error.message.includes('timeout') || 
           error.message.includes('deadlock') ||
           error.message.includes('too many connections') ||
           error.message.includes('connection pool') ||
           error.message.includes('PrismaClientRustPanicError');
  }
};

/**
 * Service responsible for managing healthcare providers, including search, 
 * availability checking, and provider data management.
 */
@Injectable()
export class ProvidersService {
  private readonly logger = new Logger(ProvidersService.name);
  
  /**
   * Circuit breaker configuration for external provider directory integration
   */
  private readonly providerDirectoryCircuitBreakerOptions: CircuitBreakerOptions<{ providers: Provider[]; total: number }> = {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 seconds
    fallback: () => ({
      providers: [],
      total: 0
    }),
    onOpen: () => this.logger.warn('Provider directory circuit breaker opened - external provider system may be unavailable'),
    onClose: () => this.logger.log('Provider directory circuit breaker closed - external provider system recovered'),
    onHalfOpen: () => this.logger.log('Provider directory circuit breaker half-open - testing external provider system')
  };

  /**
   * Circuit breaker for external provider directory integration
   * Prevents cascading failures when the external provider system is unavailable
   */
  private readonly providerDirectoryCircuitBreaker = new CircuitBreaker<{ providers: Provider[]; total: number }>(this.providerDirectoryCircuitBreakerOptions);

  /**
   * Initializes the ProvidersService with required dependencies.
   * 
   * @param prisma Enhanced database service for provider data access with proper connection pooling
   */
  constructor(private readonly prisma: PrismaService) {
    // Ensure the care context is initialized with proper connection pooling
    this.prisma.care.$connect();
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
  ): Promise<{ providers: Provider[]; total: number }> {
    try {
      return await retry(async () => {
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

        // Use the journey-specific database context
        const careContext = this.prisma.care;

        // Query providers with pagination
        const providers = await careContext.provider.findMany({
          where,
          skip,
          take: limit,
          orderBy: searchDto.orderBy || { name: 'asc' },
          include: searchDto.include,
          select: searchDto.select
        });

        // Count total for pagination
        const total = await careContext.provider.count({ where });

        return { providers, total };
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      this.logger.error(`Failed to find providers: ${error.message}`, error.stack);
      
      // Classify database-specific errors
      if (error.message.includes('database') || error.message.includes('prisma')) {
        throw new DatabaseError({
          message: 'Database error while retrieving providers',
          code: 'CARE_004_DB',
          context: { searchDto, paginationDto },
          cause: error
        });
      }
      
      throw new BusinessRuleViolationError({
        message: 'Failed to retrieve providers',
        code: 'CARE_004',
        context: { searchDto, paginationDto },
        cause: error
      });
    }
  }

  /**
   * Retrieves a provider by their unique identifier.
   *
   * @param id Provider ID
   * @returns The provider if found
   */
  async findById(id: string): Promise<Provider> {
    try {
      return await retry(async () => {
        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        const provider = await careContext.provider.findUnique({
          where: { id }
        });

        if (!provider) {
          throw new ProviderNotFoundError({
            message: `Provider with ID ${id} not found`,
            code: 'CARE_005',
            context: { id }
          });
        }

        return provider;
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to find provider: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: `Failed to retrieve provider with ID ${id}`,
        code: 'CARE_006',
        context: { id },
        cause: error
      });
    }
  }

  /**
   * Creates a new provider in the system.
   *
   * @param providerData Provider data without ID
   * @returns The newly created provider
   */
  async create(providerData: Omit<Provider, 'id'>): Promise<Provider> {
    try {
      return await retry(async () => {
        // Validate provider data
        this.validateProviderData(providerData);

        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Create provider
        const provider = await careContext.provider.create({
          data: providerData
        });

        this.logger.log(`Provider created: ${provider.id}`);
        return provider;
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      
      this.logger.error(`Failed to create provider: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: 'Failed to create provider',
        code: 'CARE_007',
        context: { providerData },
        cause: error
      });
    }
  }

  /**
   * Updates an existing provider's information.
   *
   * @param id Provider ID
   * @param providerData Updated provider data
   * @returns The updated provider
   */
  async update(id: string, providerData: Partial<Provider>): Promise<Provider> {
    try {
      return await retry(async () => {
        // Check if provider exists
        await this.findById(id);

        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Update provider
        const updatedProvider = await careContext.provider.update({
          where: { id },
          data: providerData
        });

        this.logger.log(`Provider updated: ${id}`);
        return updatedProvider;
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to update provider: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: `Failed to update provider with ID ${id}`,
        code: 'CARE_008',
        context: { id, providerData },
        cause: error
      });
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
      return await retry(async () => {
        // Check if provider exists
        await this.findById(id);
        
        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Check if provider has any active appointments
        const activeAppointments = await careContext.appointment.count({
          where: {
            providerId: id,
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        });
        
        if (activeAppointments > 0) {
          throw new BusinessRuleViolationError({
            message: `Cannot delete provider with ID ${id} due to ${activeAppointments} active appointments`,
            code: 'CARE_009',
            context: { id, activeAppointments }
          });
        }

        // Delete provider
        await careContext.provider.delete({
          where: { id }
        });

        this.logger.log(`Provider deleted: ${id}`);
        return true;
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError || 
          error instanceof BusinessRuleViolationError) {
        throw error;
      }
      
      this.logger.error(`Failed to delete provider: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: `Failed to delete provider with ID ${id}`,
        code: 'CARE_010',
        context: { id },
        cause: error
      });
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
      return await retry(async () => {
        // Check if provider exists
        await this.findById(providerId);
        
        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Check for existing appointments at the requested time
        const existingAppointment = await careContext.appointment.findFirst({
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
        });
        
        // Provider is available if no appointments exist at the requested time
        return !existingAppointment;
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to check provider availability: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: `Failed to check availability for provider with ID ${providerId}`,
        code: 'CARE_011',
        context: { providerId, dateTime },
        cause: error
      });
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
      return await retry(async () => {
        // Check if provider exists
        await this.findById(providerId);

        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Generate all possible time slots for the day (9AM to 5PM, 1-hour slots)
        const timeSlots: { time: string; available: boolean }[] = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM

        date.setHours(0, 0, 0, 0); // Reset time to start of day
        const dateStart = new Date(date);
        const dateEnd = new Date(date);
        dateEnd.setDate(dateEnd.getDate() + 1); // Next day

        // Get all appointments for the provider on the specified day
        const appointments = await careContext.appointment.findMany({
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
        });

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
      }, {
        ...DB_RETRY_OPTIONS,
        logger: this.logger
      });
    } catch (error) {
      if (error instanceof ProviderNotFoundError) {
        throw error;
      }
      
      this.logger.error(`Failed to get provider time slots: ${error.message}`, error.stack);
      throw new BusinessRuleViolationError({
        message: `Failed to retrieve time slots for provider with ID ${providerId}`,
        code: 'CARE_012',
        context: { providerId, date },
        cause: error
      });
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
  ): Promise<{ providers: Provider[]; total: number }> {
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
  ): Promise<{ providers: Provider[]; total: number }> {
    const searchDto: SearchProvidersDto = { location };
    return this.findAll(searchDto, paginationDto);
  }

  /**
   * Retrieves providers that offer telemedicine services.
   * Uses circuit breaker pattern to handle external provider directory failures.
   *
   * @param paginationDto Pagination options
   * @returns List of telemedicine providers and total count
   */
  async getTelemedicineProviders(
    paginationDto: PaginationDto
  ): Promise<{ providers: Provider[]; total: number }> {
    try {
      // Use circuit breaker for this operation as it may involve external provider directory
      return await this.providerDirectoryCircuitBreaker.execute(async () => {
        const { page = 1, limit = 10 } = paginationDto;
        const skip = (page - 1) * limit;

        // Use the journey-specific database context
        const careContext = this.prisma.care;
        
        // Query providers that offer telemedicine
        const providers = await careContext.provider.findMany({
          where: {
            telemedicineAvailable: true
          },
          skip,
          take: limit,
          orderBy: {
            name: 'asc'
          }
        });

        // Count total for pagination
        const total = await careContext.provider.count({
          where: {
            telemedicineAvailable: true
          }
        });

        return { providers, total };
      });
    } catch (error) {
      this.logger.error(`Failed to find telemedicine providers: ${error.message}`, error.stack);
      
      // Handle external provider directory errors specifically
      if (error.message.includes('external') || error.message.includes('provider directory')) {
        throw new ExternalApiError({
          message: 'External provider directory service unavailable',
          code: 'CARE_013_EXT',
          context: { paginationDto },
          cause: error
        });
      }
      
      // Classify database-specific errors
      if (error.message.includes('database') || error.message.includes('prisma')) {
        throw new DatabaseError({
          message: 'Database error while retrieving telemedicine providers',
          code: 'CARE_013_DB',
          context: { paginationDto },
          cause: error
        });
      }
      
      throw new BusinessRuleViolationError({
        message: 'Failed to retrieve telemedicine providers',
        code: 'CARE_013',
        context: { paginationDto },
        cause: error
      });
    }
  }

  /**
   * Validates provider data for creation or update.
   * 
   * @param providerData Provider data to validate
   * @private
   */
  private validateProviderData(providerData: Partial<Provider>): void {
    // Check required fields
    if (!providerData.name) {
      throw new ValidationError({
        message: 'Provider name is required',
        code: 'CARE_014',
        context: { providerData }
      });
    }
    
    if (!providerData.specialty) {
      throw new ValidationError({
        message: 'Provider specialty is required',
        code: 'CARE_015',
        context: { providerData }
      });
    }
    
    if (!providerData.location) {
      throw new ValidationError({
        message: 'Provider location is required',
        code: 'CARE_016',
        context: { providerData }
      });
    }
    
    // Validate email format
    if (providerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(providerData.email)) {
      throw new ValidationError({
        message: 'Invalid email format',
        code: 'CARE_017',
        context: { email: providerData.email }
      });
    }
    
    // Validate phone format (simple validation)
    if (providerData.phone && !/^\+?[0-9\s()-]{8,20}$/.test(providerData.phone)) {
      throw new ValidationError({
        message: 'Invalid phone number format',
        code: 'CARE_018',
        context: { phone: providerData.phone }
      });
    }
  }
}