import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Tracer } from '@opentelemetry/api';
import { handleApiGatewayError } from '../utils/error-handling.util';

/**
 * Middleware for handling errors in the API Gateway
 * Captures errors, enriches them with context, and formats them for client response
 */
@Injectable()
export class ErrorHandlingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ErrorHandlingMiddleware.name);

  constructor(private readonly tracer?: Tracer) {}

  /**
   * Middleware implementation
   * 
   * @param req - The HTTP request
   * @param res - The HTTP response
   * @param next - The next middleware function
   */
  use(req: Request, res: Response, next: NextFunction) {
    // Store the original send method
    const originalSend = res.send;

    // Override the send method to handle errors
    res.send = function(body: any) {
      // Check if the response is an error (status >= 400)
      if (res.statusCode >= 400 && body) {
        try {
          // Parse the body if it's a string
          const errorBody = typeof body === 'string' ? JSON.parse(body) : body;
          
          // Handle the error using the error handling utilities
          const formattedError = handleApiGatewayError(errorBody, req);
          
          // Set the status code based on the formatted error
          res.status(formattedError.statusCode);
          
          // Call the original send method with the formatted error
          return originalSend.call(this, JSON.stringify(formattedError));
        } catch (err) {
          // If there's an error in error handling, log it and continue with the original response
          Logger.error(`Error in error handling middleware: ${err.message}`, err.stack);
        }
      }
      
      // Call the original send method for non-error responses
      return originalSend.call(this, body);
    }.bind(res);

    // Continue to the next middleware
    next();
  }
}