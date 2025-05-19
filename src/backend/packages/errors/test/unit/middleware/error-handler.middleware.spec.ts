import { Request, Response, NextFunction } from 'express';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorType, AppException } from '../../../src/categories/app.exception';
import { errorHandlerMiddleware } from '../../../src/middleware/error-handler.middleware';
import { LoggerService } from '@austa/logging';

// Mock the LoggerService
jest.mock('@austa/logging', () => {
  return {
    LoggerService: jest.fn().mockImplementation(() => {
      return {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        log: jest.fn()
      };
    })
  };
});

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let loggerService: LoggerService;
  
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Create mock request object
    mockRequest = {
      method: 'GET',
      url: '/test',
      headers: {},
      user: { id: 'test-user-id' }
    };
    
    // Create mock response object with spy methods
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    // Create next function
    nextFunction = jest.fn();
    
    // Create logger service
    loggerService = new LoggerService();
  });
  
  describe('AppException handling', () => {
    it('should handle validation errors with 400 status code', () => {
      // Arrange
      const validationError = new AppException(
        'Invalid input data',
        ErrorType.VALIDATION,
        'API_002',
        { field: 'email', constraint: 'isEmail' }
      );
      
      // Act
      errorHandlerMiddleware(loggerService)(validationError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION,
          code: 'API_002',
          message: 'Invalid input data',
          details: { field: 'email', constraint: 'isEmail' }
        }
      });
      expect(loggerService.debug).toHaveBeenCalled();
    });
    
    it('should handle business errors with 422 status code', () => {
      // Arrange
      const businessError = new AppException(
        'Cannot schedule appointment in the past',
        ErrorType.BUSINESS,
        'CARE_002',
        { appointmentDate: '2023-01-01' }
      );
      
      // Act
      errorHandlerMiddleware(loggerService)(businessError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.BUSINESS,
          code: 'CARE_002',
          message: 'Cannot schedule appointment in the past',
          details: { appointmentDate: '2023-01-01' }
        }
      });
      expect(loggerService.warn).toHaveBeenCalled();
    });
    
    it('should handle technical errors with 500 status code', () => {
      // Arrange
      const technicalError = new AppException(
        'Database connection failed',
        ErrorType.TECHNICAL,
        'SYS_001',
        { service: 'PostgreSQL' }
      );
      
      // Act
      errorHandlerMiddleware(loggerService)(technicalError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'SYS_001',
          message: 'Database connection failed',
          details: { service: 'PostgreSQL' }
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
    });
    
    it('should handle external errors with 502 status code', () => {
      // Arrange
      const externalError = new AppException(
        'External API unavailable',
        ErrorType.EXTERNAL,
        'HEALTH_002',
        { service: 'FitbitAPI' }
      );
      
      // Act
      errorHandlerMiddleware(loggerService)(externalError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.EXTERNAL,
          code: 'HEALTH_002',
          message: 'External API unavailable',
          details: { service: 'FitbitAPI' }
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
  
  describe('HttpException handling', () => {
    it('should handle NestJS HttpException with 400 status code', () => {
      // Arrange
      const httpException = new HttpException(
        { message: 'Bad request', error: 'Validation failed' },
        HttpStatus.BAD_REQUEST
      );
      
      // Act
      errorHandlerMiddleware(loggerService)(httpException, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Bad request',
          error: 'Validation failed',
          type: ErrorType.VALIDATION
        }
      });
      expect(loggerService.warn).toHaveBeenCalled();
    });
    
    it('should handle NestJS HttpException with string response', () => {
      // Arrange
      const httpException = new HttpException('Not found', HttpStatus.NOT_FOUND);
      
      // Act
      errorHandlerMiddleware(loggerService)(httpException, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.VALIDATION,
          message: 'Not found'
        }
      });
      expect(loggerService.warn).toHaveBeenCalled();
    });
    
    it('should handle NestJS HttpException with 500 status code', () => {
      // Arrange
      const httpException = new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      // Act
      errorHandlerMiddleware(loggerService)(httpException, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          message: 'Internal server error'
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
    });
    
    it('should handle NestJS HttpException with 502 status code', () => {
      // Arrange
      const httpException = new HttpException('Bad gateway', HttpStatus.BAD_GATEWAY);
      
      // Act
      errorHandlerMiddleware(loggerService)(httpException, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.EXTERNAL,
          message: 'Bad gateway'
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
  
  describe('Generic Error handling', () => {
    it('should handle generic Error with 500 status code', () => {
      // Arrange
      const genericError = new Error('Something went wrong');
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Act
      errorHandlerMiddleware(loggerService)(genericError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
          // No details in production
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
    
    it('should include error details in non-production environment', () => {
      // Arrange
      const genericError = new Error('Database query failed');
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      // Act
      errorHandlerMiddleware(loggerService)(genericError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          type: ErrorType.TECHNICAL,
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: {
            name: 'Error',
            message: 'Database query failed'
          }
        }
      });
      expect(loggerService.error).toHaveBeenCalled();
      
      // Restore NODE_ENV
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
  
  describe('Request context handling', () => {
    it('should include request context in error logging', () => {
      // Arrange
      mockRequest.headers['x-journey-id'] = 'health-journey';
      const genericError = new Error('Something went wrong');
      
      // Act
      errorHandlerMiddleware(loggerService)(genericError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Unhandled exception'),
        expect.any(String),
        expect.stringContaining('ErrorHandlerMiddleware')
      );
      // The first argument to the error method should be the logger context
      const errorCall = (loggerService.error as jest.Mock).mock.calls[0];
      expect(errorCall[0]).toContain('Unhandled exception');
    });
    
    it('should handle requests without user information', () => {
      // Arrange
      mockRequest.user = undefined;
      const genericError = new Error('Something went wrong');
      
      // Act
      errorHandlerMiddleware(loggerService)(genericError, mockRequest as Request, mockResponse as Response, nextFunction);
      
      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalled();
      expect(loggerService.error).toHaveBeenCalled();
    });
  });
  
  describe('Error response format', () => {
    it('should always return error responses in the standard format', () => {
      // Arrange
      const errors = [
        new AppException('App error', ErrorType.BUSINESS, 'BUS_001'),
        new HttpException('Http error', HttpStatus.BAD_REQUEST),
        new Error('Generic error')
      ];
      
      // Act & Assert
      errors.forEach(error => {
        errorHandlerMiddleware(loggerService)(error, mockRequest as Request, mockResponse as Response, nextFunction);
        
        // Verify the response has the standard error structure
        const jsonCall = (mockResponse.json as jest.Mock).mock.calls.pop()[0];
        expect(jsonCall).toHaveProperty('error');
        expect(jsonCall.error).toHaveProperty('type');
        expect(jsonCall.error).toHaveProperty('message');
        
        // Reset mocks for next iteration
        jest.clearAllMocks();
      });
    });
  });
});