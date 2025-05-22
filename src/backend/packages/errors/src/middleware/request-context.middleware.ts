import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { JourneyType } from '../base';
import { JourneyErrorContext, RequestErrorContext, UserErrorContext } from '../types';

/**
 * Interface extending Express Request to include context properties
 */
export interface RequestWithContext extends Request {
  /**
   * Unique identifier for the request
   */
  requestId?: string;

  /**
   * User context information
   */
  userContext?: UserErrorContext;

  /**
   * Request context information
   */
  requestContext?: RequestErrorContext;

  /**
   * Journey context information
   */
  journeyContext?: JourneyErrorContext;
}

/**
 * Configuration options for the request context middleware
 */
export interface RequestContextOptions {
  /**
   * Header name for the request ID
   * @default 'x-request-id'
   */
  requestIdHeader?: string;

  /**
   * Header name for the correlation ID
   * @default 'x-correlation-id'
   */
  correlationIdHeader?: string;

  /**
   * Header name for the journey type
   * @default 'x-journey-type'
   */
  journeyTypeHeader?: string;

  /**
   * Header name for the journey step
   * @default 'x-journey-step'
   */
  journeyStepHeader?: string;

  /**
   * Whether to include request body in context
   * @default false
   */
  includeBody?: boolean;

  /**
   * List of headers to include in context
   * @default ['user-agent']
   */
  includeHeaders?: string[];

  /**
   * Whether to extract user information from JWT token
   * @default true
   */
  extractUserFromToken?: boolean;
}

/**
 * Default options for the request context middleware
 */
const defaultOptions: RequestContextOptions = {
  requestIdHeader: 'x-request-id',
  correlationIdHeader: 'x-correlation-id',
  journeyTypeHeader: 'x-journey-type',
  journeyStepHeader: 'x-journey-step',
  includeBody: false,
  includeHeaders: ['user-agent'],
  extractUserFromToken: true
};

/**
 * Middleware that attaches essential contextual information to each request,
 * enabling richer error tracking and debugging capabilities.
 * 
 * This middleware:
 * - Generates and assigns a unique request ID if not already present
 * - Extracts user information from authentication tokens
 * - Identifies the current journey context
 * - Stores all this metadata on the request object for downstream error handlers and loggers
 * 
 * @param options Configuration options for the middleware
 * @returns Express middleware function
 */
export function requestContextMiddleware(options?: Partial<RequestContextOptions>) {
  const config = { ...defaultOptions, ...options };

  return (req: RequestWithContext, res: Response, next: NextFunction) => {
    try {
      // Extract or generate request ID
      const requestId = extractOrGenerateRequestId(req, config);
      req.requestId = requestId;

      // Extract correlation ID if present
      const correlationId = extractCorrelationId(req, config);

      // Extract user context
      const userContext = extractUserContext(req, config);
      req.userContext = userContext;

      // Extract journey context
      const journeyContext = extractJourneyContext(req, config);
      req.journeyContext = journeyContext;

      // Create request context
      const requestContext = createRequestContext(req, config, correlationId);
      req.requestContext = requestContext;

      // Add request ID to response headers for traceability
      res.setHeader(config.requestIdHeader || 'x-request-id', requestId);

      // If correlation ID exists, add it to response headers
      if (correlationId) {
        res.setHeader(config.correlationIdHeader || 'x-correlation-id', correlationId);
      }

      next();
    } catch (error) {
      // If context extraction fails, continue with the request but log the error
      console.error('Error in request context middleware:', error);
      next();
    }
  };
}

/**
 * Extracts or generates a request ID
 * @param req Express request object
 * @param config Middleware configuration
 * @returns Request ID string
 */
function extractOrGenerateRequestId(req: Request, config: RequestContextOptions): string {
  const headerName = config.requestIdHeader || 'x-request-id';
  const existingId = req.headers[headerName.toLowerCase()];
  
  if (existingId && typeof existingId === 'string') {
    return existingId;
  }
  
  return uuidv4();
}

/**
 * Extracts correlation ID from request headers
 * @param req Express request object
 * @param config Middleware configuration
 * @returns Correlation ID string or undefined
 */
function extractCorrelationId(req: Request, config: RequestContextOptions): string | undefined {
  const headerName = config.correlationIdHeader || 'x-correlation-id';
  const correlationId = req.headers[headerName.toLowerCase()];
  
  if (correlationId && typeof correlationId === 'string') {
    return correlationId;
  }
  
  return undefined;
}

/**
 * Extracts user context from the request
 * @param req Express request object
 * @param config Middleware configuration
 * @returns User context object
 */
function extractUserContext(req: Request, config: RequestContextOptions): UserErrorContext {
  const userContext: UserErrorContext = {};
  
  // Extract IP address
  userContext.ipAddress = getClientIp(req);
  
  // Extract user agent
  if (req.headers['user-agent']) {
    userContext.userAgent = req.headers['user-agent'] as string;
  }
  
  // Extract user information from request.user if available
  if (req.user) {
    if ('id' in req.user) {
      userContext.userId = req.user.id as string;
    }
    
    if ('roles' in req.user) {
      userContext.roles = req.user.roles as string[];
    }
    
    if ('sessionId' in req.user) {
      userContext.sessionId = req.user.sessionId as string;
    }
  }
  
  // Extract user information from authorization header if enabled
  if (config.extractUserFromToken && req.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '');
      const decodedToken = decodeJwt(token);
      
      if (decodedToken) {
        if (!userContext.userId && decodedToken.sub) {
          userContext.userId = decodedToken.sub;
        }
        
        if (!userContext.roles && decodedToken.roles) {
          userContext.roles = Array.isArray(decodedToken.roles) 
            ? decodedToken.roles 
            : [decodedToken.roles];
        }
        
        if (!userContext.sessionId && decodedToken.sessionId) {
          userContext.sessionId = decodedToken.sessionId;
        }
      }
    } catch (error) {
      // Ignore token decoding errors
    }
  }
  
  return userContext;
}

/**
 * Extracts journey context from the request
 * @param req Express request object
 * @param config Middleware configuration
 * @returns Journey context object
 */
function extractJourneyContext(req: Request, config: RequestContextOptions): JourneyErrorContext | undefined {
  // Extract journey type from headers
  const journeyTypeHeader = config.journeyTypeHeader || 'x-journey-type';
  const journeyType = req.headers[journeyTypeHeader.toLowerCase()];
  
  if (!journeyType) {
    // Try to infer journey from URL path
    const journeyFromPath = inferJourneyFromPath(req.path);
    if (!journeyFromPath) {
      return undefined;
    }
    
    return {
      journeyType: journeyFromPath
    };
  }
  
  // Create journey context
  const journeyContext: JourneyErrorContext = {
    journeyType: mapToJourneyType(journeyType as string)
  };
  
  // Extract journey step if available
  const journeyStepHeader = config.journeyStepHeader || 'x-journey-step';
  const journeyStep = req.headers[journeyStepHeader.toLowerCase()];
  
  if (journeyStep && typeof journeyStep === 'string') {
    journeyContext.journeyStep = journeyStep;
  }
  
  // Extract previous step if available
  const previousStepHeader = 'x-previous-step';
  const previousStep = req.headers[previousStepHeader.toLowerCase()];
  
  if (previousStep && typeof previousStep === 'string') {
    journeyContext.previousStep = previousStep;
  }
  
  return journeyContext;
}

/**
 * Creates request context from the request
 * @param req Express request object
 * @param config Middleware configuration
 * @param correlationId Correlation ID if available
 * @returns Request context object
 */
function createRequestContext(
  req: Request, 
  config: RequestContextOptions,
  correlationId?: string
): RequestErrorContext {
  const requestContext: RequestErrorContext = {
    method: req.method,
    url: req.originalUrl || req.url,
    correlationId: correlationId
  };
  
  // Include headers if configured
  if (config.includeHeaders && config.includeHeaders.length > 0) {
    requestContext.headers = {};
    
    for (const headerName of config.includeHeaders) {
      const headerValue = req.headers[headerName.toLowerCase()];
      if (headerValue) {
        requestContext.headers[headerName] = Array.isArray(headerValue) 
          ? headerValue[0] 
          : headerValue as string;
      }
    }
  }
  
  // Include query parameters
  if (Object.keys(req.query).length > 0) {
    requestContext.params = { ...req.query };
  }
  
  // Include route parameters
  if (req.params && Object.keys(req.params).length > 0) {
    requestContext.params = { ...requestContext.params, ...req.params };
  }
  
  // Include body if configured and available
  if (config.includeBody && req.body && Object.keys(req.body).length > 0) {
    // Sanitize sensitive information from body
    requestContext.body = sanitizeRequestBody(req.body);
  }
  
  return requestContext;
}

/**
 * Sanitizes request body to remove sensitive information
 * @param body Request body
 * @returns Sanitized body
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }
  
  const sensitiveFields = [
    'password',
    'passwordConfirmation',
    'currentPassword',
    'newPassword',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'authorization',
    'creditCard',
    'cardNumber',
    'cvv',
    'ssn',
    'socialSecurityNumber'
  ];
  
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Gets client IP address from request
 * @param req Express request object
 * @returns IP address string
 */
function getClientIp(req: Request): string {
  // Check for forwarded IP addresses
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor as string;
    
    return ips.split(',')[0].trim();
  }
  
  // Check for real IP
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp as string;
  }
  
  // Fallback to connection remote address
  return req.socket.remoteAddress || '0.0.0.0';
}

/**
 * Decodes JWT token without verification
 * @param token JWT token string
 * @returns Decoded token payload or null
 */
function decodeJwt(token: string): any {
  try {
    // Simple JWT decoding without verification
    // Format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * Maps string journey type to JourneyType enum
 * @param journeyType Journey type string
 * @returns JourneyType enum value
 */
function mapToJourneyType(journeyType: string): 'health' | 'care' | 'plan' {
  const normalized = journeyType.toLowerCase();
  
  switch (normalized) {
    case 'health':
    case 'minha-saude':
    case 'minha_saude':
      return 'health';
    
    case 'care':
    case 'cuidar-me':
    case 'cuidar_me':
    case 'cuidar-me-agora':
    case 'cuidar_me_agora':
      return 'care';
    
    case 'plan':
    case 'plano':
    case 'meu-plano':
    case 'meu_plano':
    case 'beneficios':
    case 'meu-plano-e-beneficios':
    case 'meu_plano_e_beneficios':
      return 'plan';
    
    default:
      // Default to health if unknown
      return 'health';
  }
}

/**
 * Infers journey type from request path
 * @param path Request path
 * @returns JourneyType or undefined if cannot be inferred
 */
function inferJourneyFromPath(path: string): 'health' | 'care' | 'plan' | undefined {
  const normalized = path.toLowerCase();
  
  if (
    normalized.includes('/health') ||
    normalized.includes('/saude') ||
    normalized.includes('/metrics') ||
    normalized.includes('/goals') ||
    normalized.includes('/devices')
  ) {
    return 'health';
  }
  
  if (
    normalized.includes('/care') ||
    normalized.includes('/cuidar') ||
    normalized.includes('/appointments') ||
    normalized.includes('/providers') ||
    normalized.includes('/medications') ||
    normalized.includes('/treatments') ||
    normalized.includes('/telemedicine')
  ) {
    return 'care';
  }
  
  if (
    normalized.includes('/plan') ||
    normalized.includes('/plano') ||
    normalized.includes('/benefits') ||
    normalized.includes('/beneficios') ||
    normalized.includes('/coverage') ||
    normalized.includes('/claims')
  ) {
    return 'plan';
  }
  
  return undefined;
}