/**
 * This file provides examples of how to use the ErrorResponseDto and BaseResponseDto
 * in controllers and services throughout the gamification engine.
 */

import { Controller, Get, HttpException, HttpStatus, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponseDto, ErrorResponseDto, ErrorSeverity, ErrorSource, ValidationErrorResponseDto } from '.';

/**
 * Example controller demonstrating how to use the error response DTOs
 */
@ApiTags('Examples')
@Controller('examples')
export class ErrorResponseExampleController {
  /**
   * Example endpoint that returns a successful response
   */
  @Get('success')
  @ApiOperation({ summary: 'Returns a successful response' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: BaseResponseDto,
  })
  getSuccessExample() {
    const data = {
      id: '123',
      name: 'Example Achievement',
      description: 'This is an example achievement',
      points: 100,
    };
    
    return BaseResponseDto.success(data, {
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Example endpoint that returns a client error response
   */
  @Get('client-error')
  @ApiOperation({ summary: 'Returns a client error response' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: BaseResponseDto,
  })
  getClientErrorExample() {
    const errorResponse = new ErrorResponseDto();
    errorResponse.code = 'GAMIFICATION_INVALID_REQUEST';
    errorResponse.message = 'The request contains invalid parameters';
    errorResponse.severity = ErrorSeverity.WARNING;
    errorResponse.source = ErrorSource.CLIENT;
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.details = {
      reason: 'Missing required parameters',
    };
    errorResponse.journeyContext = {
      journey: 'gamification',
      feature: 'achievements',
    };
    
    const response = BaseResponseDto.error(errorResponse);
    throw new HttpException(response, HttpStatus.BAD_REQUEST);
  }
  
  /**
   * Example endpoint that returns a validation error response
   */
  @Get('validation-error')
  @ApiOperation({ summary: 'Returns a validation error response' })
  @ApiResponse({
    status: 400,
    description: 'Validation Error',
    type: BaseResponseDto,
  })
  getValidationErrorExample() {
    const validationErrors = {
      username: ['must be at least 3 characters', 'must not contain special characters'],
      email: ['must be a valid email address'],
    };
    
    const errorResponse = ValidationErrorResponseDto.fromValidationErrors(
      validationErrors,
      {
        code: 'GAMIFICATION_VALIDATION_ERROR',
        message: 'The request contains validation errors',
        journeyContext: {
          journey: 'gamification',
          feature: 'user-profile',
          action: 'update',
        },
      },
    );
    
    const response = BaseResponseDto.error(errorResponse);
    throw new HttpException(response, HttpStatus.BAD_REQUEST);
  }
  
  /**
   * Example endpoint that returns a not found error response
   */
  @Get('not-found/:id')
  @ApiOperation({ summary: 'Returns a not found error response' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  @ApiResponse({
    status: 404,
    description: 'Not Found',
    type: BaseResponseDto,
  })
  getNotFoundExample(@Param('id') id: string) {
    const errorResponse = new ErrorResponseDto();
    errorResponse.code = 'GAMIFICATION_ACHIEVEMENT_NOT_FOUND';
    errorResponse.message = `Achievement with ID ${id} not found`;
    errorResponse.severity = ErrorSeverity.WARNING;
    errorResponse.source = ErrorSource.CLIENT;
    errorResponse.timestamp = new Date().toISOString();
    errorResponse.journeyContext = {
      journey: 'gamification',
      feature: 'achievements',
      action: 'get-by-id',
    };
    
    throw new NotFoundException(BaseResponseDto.error(errorResponse));
  }
  
  /**
   * Example endpoint that returns a system error response
   */
  @Get('system-error')
  @ApiOperation({ summary: 'Returns a system error response' })
  @ApiResponse({
    status: 500,
    description: 'Internal Server Error',
    type: BaseResponseDto,
  })
  getSystemErrorExample() {
    const error = new Error('Database connection failed');
    
    const errorResponse = ErrorResponseDto.fromError(
      error,
      {
        includeStack: true,
        journeyContext: {
          journey: 'gamification',
          feature: 'achievements',
          action: 'list',
        },
      },
    );
    
    // Override some properties
    errorResponse.code = 'GAMIFICATION_DATABASE_ERROR';
    errorResponse.severity = ErrorSeverity.CRITICAL;
    errorResponse.source = ErrorSource.SYSTEM;
    
    const response = BaseResponseDto.error(errorResponse);
    throw new HttpException(response, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}