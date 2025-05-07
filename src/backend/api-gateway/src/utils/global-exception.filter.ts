import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GqlArgumentsHost } from '@nestjs/graphql';
import { Tracer } from '@opentelemetry/api';
import { handleApiGatewayError } from './error-handling.util';

/**
 * Global exception filter for the API Gateway
 * Catches all exceptions and formats them for client response
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly tracer?: Tracer) {}

  /**
   * Catches exceptions and formats them for client response
   * 
   * @param exception - The caught exception
   * @param host - The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost) {
    let request: Request | undefined;
    let response: Response | undefined;

    // Handle different types of requests (HTTP, GraphQL, WebSocket)
    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      request = ctx.getRequest<Request>();
      response = ctx.getResponse<Response>();
    } else if (host.getType() === 'graphql') {
      // For GraphQL requests
      const gqlHost = GqlArgumentsHost.create(host);
      const ctx = gqlHost.getContext();
      request = ctx.req;
      
      // For GraphQL, we'll rethrow a formatted error instead of using the response
      const formattedError = handleApiGatewayError(exception, request, this.tracer);
      
      // For GraphQL errors, we need to throw an HttpException with the formatted error
      throw new HttpException(
        formattedError,
        formattedError.statusCode
      );
    }

    // If we couldn't get the request or response, log the error and return
    if (!request || !response) {
      this.logger.error(
        `Could not handle exception: ${exception instanceof Error ? exception.message : 'Unknown error'}`,
        exception instanceof Error ? exception.stack : undefined
      );
      return;
    }

    // Handle the error using the error handling utilities
    const formattedError = handleApiGatewayError(exception, request, this.tracer);

    // Send the formatted error response
    response.status(formattedError.statusCode).json(formattedError);
  }
}