import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { ErrorType } from '../../src/types';
import { BaseError } from '../../src/base';

// Import error categories
import {
  ValidationError,
  MissingParameterError,
  InvalidParameterError
} from '../../src/categories/validation.errors';
import {
  BusinessError,
  ResourceNotFoundError,
  BusinessRuleViolationError
} from '../../src/categories/business.errors';
import {
  TechnicalError,
  DatabaseError,
  InternalServerError
} from '../../src/categories/technical.errors';
import {
  ExternalError,
  ExternalApiError,
  ExternalDependencyUnavailableError
} from '../../src/categories/external.errors';

// Create a simple controller for testing error classification
class TestController {
  throwValidationError() {
    throw new ValidationError('Validation failed', 'TEST_001');
  }

  throwMissingParameterError() {
    throw new MissingParameterError('userId');
  }

  throwInvalidParameterError() {
    throw new InvalidParameterError('email', 'Invalid email format');
  }

  throwBusinessError() {
    throw new BusinessError('Business rule violated', 'TEST_002');
  }

  throwResourceNotFoundError() {
    throw new ResourceNotFoundError('User', '123');
  }

  throwBusinessRuleViolationError() {
    throw new BusinessRuleViolationError('Cannot delete active subscription', 'SUBSCRIPTION_ACTIVE');
  }

  throwTechnicalError() {
    throw new TechnicalError('Technical error occurred', 'TEST_003');
  }

  throwDatabaseError() {
    throw new DatabaseError('Failed to execute query', 'SELECT_USERS', { cause: new Error('Connection timeout') });
  }

  throwInternalServerError() {
    throw new InternalServerError('Unexpected server error', { cause: new Error('Stack trace') });
  }

  throwExternalError() {
    throw new ExternalError('External system error', 'TEST_004');
  }

  throwExternalApiError() {
    throw new ExternalApiError(
      'Payment gateway error',
      'PAYMENT_API',
      'https://api.payment.com/process',
      HttpStatus.SERVICE_UNAVAILABLE,
      { error: 'Service unavailable' }
    );
  }

  throwExternalDependencyUnavailableError() {
    throw new ExternalDependencyUnavailableError(
      'Health data provider unavailable',
      'HEALTH_API',
      true, // isTransient
      { retryAfter: 30 }
    );
  }

  throwTransientError() {
    const error = new ExternalDependencyUnavailableError(
      'Temporary network issue',
      'NETWORK',
      true, // isTransient
      { retryAfter: 5 }
    );
    error.isTransient = true;
    throw error;
  }
}

// Create a test module
describe('Error Classification (e2e)', () => {
  let app: INestApplication;
  let testController: TestController;

  beforeAll(async () => {
    // Create a test module with our controller
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        {
          provide: TestController,
          useClass: TestController,
        },
      ],
    }).compile();

    // Create the NestJS application
    app = moduleFixture.createNestApplication();
    
    // Get the test controller instance
    testController = moduleFixture.get<TestController>(TestController);
    
    // Setup error handling routes for testing
    app.use('/api/errors/validation', (req, res) => {
      try {
        testController.throwValidationError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/missing-parameter', (req, res) => {
      try {
        testController.throwMissingParameterError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/invalid-parameter', (req, res) => {
      try {
        testController.throwInvalidParameterError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/business', (req, res) => {
      try {
        testController.throwBusinessError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/resource-not-found', (req, res) => {
      try {
        testController.throwResourceNotFoundError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/business-rule-violation', (req, res) => {
      try {
        testController.throwBusinessRuleViolationError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/technical', (req, res) => {
      try {
        testController.throwTechnicalError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/database', (req, res) => {
      try {
        testController.throwDatabaseError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/internal-server', (req, res) => {
      try {
        testController.throwInternalServerError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/external', (req, res) => {
      try {
        testController.throwExternalError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/external-api', (req, res) => {
      try {
        testController.throwExternalApiError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/external-dependency', (req, res) => {
      try {
        testController.throwExternalDependencyUnavailableError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    app.use('/api/errors/transient', (req, res) => {
      try {
        testController.throwTransientError();
      } catch (error) {
        if (error instanceof BaseError) {
          const httpException = error.toHttpException();
          return res.status(httpException.getStatus()).json(httpException.getResponse());
        }
        return res.status(500).json({ message: 'Unexpected error' });
      }
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Client Errors (4xx)', () => {
    describe('Validation Errors', () => {
      it('should return 400 Bad Request for ValidationError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/validation')
          .expect(HttpStatus.BAD_REQUEST)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.VALIDATION);
            expect(res.body.error.code).toBe('TEST_001');
            expect(res.body.error.message).toBe('Validation failed');
          });
      });

      it('should return 400 Bad Request for MissingParameterError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/missing-parameter')
          .expect(HttpStatus.BAD_REQUEST)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.VALIDATION);
            expect(res.body.error.message).toContain('userId');
          });
      });

      it('should return 400 Bad Request for InvalidParameterError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/invalid-parameter')
          .expect(HttpStatus.BAD_REQUEST)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.VALIDATION);
            expect(res.body.error.message).toContain('email');
            expect(res.body.error.details).toBeDefined();
          });
      });
    });

    describe('Business Errors', () => {
      it('should return 422 Unprocessable Entity for BusinessError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/business')
          .expect(HttpStatus.UNPROCESSABLE_ENTITY)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.BUSINESS);
            expect(res.body.error.code).toBe('TEST_002');
            expect(res.body.error.message).toBe('Business rule violated');
          });
      });

      it('should return 422 Unprocessable Entity for ResourceNotFoundError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/resource-not-found')
          .expect(HttpStatus.UNPROCESSABLE_ENTITY)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.BUSINESS);
            expect(res.body.error.message).toContain('User');
            expect(res.body.error.message).toContain('123');
          });
      });

      it('should return 422 Unprocessable Entity for BusinessRuleViolationError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/business-rule-violation')
          .expect(HttpStatus.UNPROCESSABLE_ENTITY)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.BUSINESS);
            expect(res.body.error.message).toContain('Cannot delete active subscription');
            expect(res.body.error.details).toBeDefined();
            expect(res.body.error.details.rule).toBe('SUBSCRIPTION_ACTIVE');
          });
      });
    });
  });

  describe('System Errors (5xx)', () => {
    describe('Technical Errors', () => {
      it('should return 500 Internal Server Error for TechnicalError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/technical')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.TECHNICAL);
            expect(res.body.error.code).toBe('TEST_003');
            expect(res.body.error.message).toBe('Technical error occurred');
          });
      });

      it('should return 500 Internal Server Error for DatabaseError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/database')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.TECHNICAL);
            expect(res.body.error.message).toContain('Failed to execute query');
            expect(res.body.error.details).toBeDefined();
            expect(res.body.error.details.operation).toBe('SELECT_USERS');
          });
      });

      it('should return 500 Internal Server Error for InternalServerError', () => {
        return request(app.getHttpServer())
          .get('/api/errors/internal-server')
          .expect(HttpStatus.INTERNAL_SERVER_ERROR)
          .expect(res => {
            expect(res.body.error).toBeDefined();
            expect(res.body.error.type).toBe(ErrorType.TECHNICAL);
            expect(res.body.error.message).toBe('Unexpected server error');
          });
      });
    });
  });

  describe('External Dependency Errors', () => {
    it('should return 502 Bad Gateway for ExternalError', () => {
      return request(app.getHttpServer())
        .get('/api/errors/external')
        .expect(HttpStatus.BAD_GATEWAY)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.code).toBe('TEST_004');
          expect(res.body.error.message).toBe('External system error');
        });
    });

    it('should return 502 Bad Gateway for ExternalApiError', () => {
      return request(app.getHttpServer())
        .get('/api/errors/external-api')
        .expect(HttpStatus.BAD_GATEWAY)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.message).toContain('Payment gateway error');
          expect(res.body.error.details).toBeDefined();
          expect(res.body.error.details.service).toBe('PAYMENT_API');
          expect(res.body.error.details.endpoint).toBe('https://api.payment.com/process');
          expect(res.body.error.details.statusCode).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        });
    });

    it('should return 502 Bad Gateway for ExternalDependencyUnavailableError', () => {
      return request(app.getHttpServer())
        .get('/api/errors/external-dependency')
        .expect(HttpStatus.BAD_GATEWAY)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.message).toContain('Health data provider unavailable');
          expect(res.body.error.details).toBeDefined();
          expect(res.body.error.details.service).toBe('HEALTH_API');
          expect(res.body.error.details.isTransient).toBe(true);
          expect(res.body.error.details.retryAfter).toBe(30);
        });
    });
  });

  describe('Transient Errors', () => {
    it('should identify transient errors and include retry information', () => {
      return request(app.getHttpServer())
        .get('/api/errors/transient')
        .expect(HttpStatus.BAD_GATEWAY)
        .expect(res => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.type).toBe(ErrorType.EXTERNAL);
          expect(res.body.error.message).toContain('Temporary network issue');
          expect(res.body.error.details).toBeDefined();
          expect(res.body.error.details.isTransient).toBe(true);
          expect(res.body.error.details.retryAfter).toBe(5);
        });
    });
  });
});