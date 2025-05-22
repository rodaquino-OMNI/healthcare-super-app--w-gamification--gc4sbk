import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoggerService } from '@austa/logging';
import { JourneyErrorService } from '@austa/errors';
import { JourneyErrorType } from '@austa/interfaces/common/error/error-type.enum';
import { ErrorCode } from '@austa/interfaces/common/error/error-code.enum';
import { I{{ pascalCase name }}Service } from '../interfaces/{{ dashCase name }}-service.interface';
import { {{ pascalCase name }} } from '../entities/{{ dashCase name }}.entity';
import { Create{{ pascalCase name }}Dto } from '../dto/create-{{ dashCase name }}.dto';
import { Update{{ pascalCase name }}Dto } from '../dto/update-{{ dashCase name }}.dto';
import { {{ pascalCase name }}ResponseDto } from '../dto/{{ dashCase name }}-response.dto';
import { PaginationDto } from '@austa/interfaces/common/dto/pagination.dto';

@Injectable()
export class {{ pascalCase name }}Service implements I{{ pascalCase name }}Service {
  constructor(
    @InjectRepository({{ pascalCase name }})
    private readonly {{ camelCase name }}Repository: Repository<{{ pascalCase name }}>,
    private readonly logger: LoggerService,
    private readonly errorService: JourneyErrorService
  ) {}

  /**
   * Creates a new {{ pascalCase name }}.
   * 
   * @param create{{ pascalCase name }}Dto - The DTO for creating a {{ pascalCase name }}
   * @returns The created {{ pascalCase name }}
   */
  async create(create{{ pascalCase name }}Dto: Create{{ pascalCase name }}Dto): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log(`Creating new {{ camelCase name }}`, '{{ pascalCase name }}Service');
    
    try {
      const {{ camelCase name }} = this.{{ camelCase name }}Repository.create(create{{ pascalCase name }}Dto);
      const created{{ pascalCase name }} = await this.{{ camelCase name }}Repository.save({{ camelCase name }});
      
      this.logger.log(`Successfully created {{ camelCase name }} with id: ${created{{ pascalCase name }}.id}`, '{{ pascalCase name }}Service');
      return this.mapToResponseDto(created{{ pascalCase name }});
    } catch (error) {
      this.logger.error(`Failed to create {{ camelCase name }}: ${error.message}`, error.stack, '{{ pascalCase name }}Service');
      throw this.errorService.createError(
        `Failed to create {{ camelCase name }}`,
        JourneyErrorType.TECHNICAL,
        ErrorCode.DATABASE_ERROR,
        { dto: create{{ pascalCase name }}Dto },
        error
      );
    }
  }

  /**
   * Finds all {{ pascalCase name }}s with pagination.
   * 
   * @param paginationDto - Pagination parameters
   * @returns A list of {{ pascalCase name }}s
   */
  async findAll(paginationDto?: PaginationDto): Promise<{{ pascalCase name }}ResponseDto[]> {
    this.logger.log('Finding all {{ camelCase name }}s', '{{ pascalCase name }}Service');
    const { page = 1, limit = 10 } = paginationDto || {};
    
    try {
      const skip = (page - 1) * limit;
      const [{{ camelCase name }}s, total] = await this.{{ camelCase name }}Repository.findAndCount({
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });
      
      return {{ camelCase name }}s.map({{ camelCase name }} => this.mapToResponseDto({{ camelCase name }}));
    } catch (error) {
      this.logger.error(`Failed to find all {{ camelCase name }}s: ${error.message}`, error.stack, '{{ pascalCase name }}Service');
      throw this.errorService.createError(
        `Failed to find all {{ camelCase name }}s`,
        JourneyErrorType.TECHNICAL,
        ErrorCode.DATABASE_ERROR,
        { pagination: paginationDto },
        error
      );
    }
  }

  /**
   * Finds a {{ pascalCase name }} by ID.
   * 
   * @param id - The ID of the {{ pascalCase name }} to find
   * @returns The found {{ pascalCase name }}
   */
  async findOne(id: string): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log(`Finding {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Service');
    
    try {
      const {{ camelCase name }} = await this.{{ camelCase name }}Repository.findOne({ where: { id } });
      
      if (!{{ camelCase name }}) {
        throw this.errorService.createError(
          `{{ pascalCase name }} with id ${id} not found`,
          JourneyErrorType.BUSINESS,
          ErrorCode.ENTITY_NOT_FOUND,
          { id }
        );
      }
      
      return this.mapToResponseDto({{ camelCase name }});
    } catch (error) {
      if (error.errorType) {
        throw error;
      }
      
      this.logger.error(`Failed to find {{ camelCase name }}: ${error.message}`, error.stack, '{{ pascalCase name }}Service');
      throw this.errorService.createError(
        `Failed to find {{ camelCase name }}`,
        JourneyErrorType.TECHNICAL,
        ErrorCode.DATABASE_ERROR,
        { id },
        error
      );
    }
  }

  /**
   * Updates a {{ pascalCase name }}.
   * 
   * @param id - The ID of the {{ pascalCase name }} to update
   * @param update{{ pascalCase name }}Dto - The DTO for updating the {{ pascalCase name }}
   * @returns The updated {{ pascalCase name }}
   */
  async update(id: string, update{{ pascalCase name }}Dto: Update{{ pascalCase name }}Dto): Promise<{{ pascalCase name }}ResponseDto> {
    this.logger.log(`Updating {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Service');
    
    try {
      // First check if entity exists
      const {{ camelCase name }} = await this.{{ camelCase name }}Repository.findOne({ where: { id } });
      
      if (!{{ camelCase name }}) {
        throw this.errorService.createError(
          `{{ pascalCase name }} with id ${id} not found`,
          JourneyErrorType.BUSINESS,
          ErrorCode.ENTITY_NOT_FOUND,
          { id }
        );
      }
      
      // Update entity
      const updated{{ pascalCase name }} = await this.{{ camelCase name }}Repository.save({
        ...{{ camelCase name }},
        ...update{{ pascalCase name }}Dto
      });
      
      return this.mapToResponseDto(updated{{ pascalCase name }});
    } catch (error) {
      if (error.errorType) {
        throw error;
      }
      
      this.logger.error(`Failed to update {{ camelCase name }}: ${error.message}`, error.stack, '{{ pascalCase name }}Service');
      throw this.errorService.createError(
        `Failed to update {{ camelCase name }}`,
        JourneyErrorType.TECHNICAL,
        ErrorCode.DATABASE_ERROR,
        { id, dto: update{{ pascalCase name }}Dto },
        error
      );
    }
  }

  /**
   * Removes a {{ pascalCase name }}.
   * 
   * @param id - The ID of the {{ pascalCase name }} to remove
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Removing {{ camelCase name }} with id: ${id}`, '{{ pascalCase name }}Service');
    
    try {
      // First check if entity exists
      const {{ camelCase name }} = await this.{{ camelCase name }}Repository.findOne({ where: { id } });
      
      if (!{{ camelCase name }}) {
        throw this.errorService.createError(
          `{{ pascalCase name }} with id ${id} not found`,
          JourneyErrorType.BUSINESS,
          ErrorCode.ENTITY_NOT_FOUND,
          { id }
        );
      }
      
      // Delete entity
      await this.{{ camelCase name }}Repository.remove({{ camelCase name }});
    } catch (error) {
      if (error.errorType) {
        throw error;
      }
      
      this.logger.error(`Failed to remove {{ camelCase name }}: ${error.message}`, error.stack, '{{ pascalCase name }}Service');
      throw this.errorService.createError(
        `Failed to remove {{ camelCase name }}`,
        JourneyErrorType.TECHNICAL,
        ErrorCode.DATABASE_ERROR,
        { id },
        error
      );
    }
  }

  /**
   * Maps a {{ pascalCase name }} entity to a response DTO
   * 
   * @param {{ camelCase name }} - The {{ pascalCase name }} entity to map
   * @returns The mapped response DTO
   */
  private mapToResponseDto({{ camelCase name }}: {{ pascalCase name }}): {{ pascalCase name }}ResponseDto {
    const responseDto = new {{ pascalCase name }}ResponseDto();
    
    responseDto.id = {{ camelCase name }}.id;
    responseDto.name = {{ camelCase name }}.name;
    responseDto.description = {{ camelCase name }}.description;
    responseDto.isActive = {{ camelCase name }}.isActive;
    responseDto.createdAt = {{ camelCase name }}.createdAt;
    responseDto.updatedAt = {{ camelCase name }}.updatedAt;
    
    return responseDto;
  }
}