import { Test, TestingModule } from '@nestjs/testing'; // @nestjs/testing v10.3.0+
import { INestApplication, HttpStatus, Logger } from '@nestjs/common'; // @nestjs/common v10.3.0+
import * as request from 'supertest'; // supertest v6.3.3
import { SuperAgentTest } from 'supertest'; // supertest v6.3.3

// Import using TypeScript path aliases for consistent code organization
import { HealthController } from '@app/health/health.controller';
import { HealthService } from '@app/health/health.service';
import { DevicesService } from '@app/devices/devices.service';

// Import from @austa/interfaces for type-safe health metric data models
import { IHealthMetric, MetricType, MetricSource } from '@austa/interfaces/journey/health';
import { CreateMetricDto, UpdateMetricDto } from '@app/health/dto';

// Import enhanced services with connection pooling and error handling
import { PrismaService } from '@austa/database';
import { KafkaService } from '@austa/events';

// Import improved error handling with standardized exception filters
import { AllExceptionsFilter } from '@austa/errors/nest';
import { HEALTH_ERROR_CODES } from '@austa/errors/journey/health';

// Import jest for mocking
import { jest } from '@jest/globals';

/**
 * Comprehensive end-to-end tests for the Health Service, verifying the correct behavior
 * of its API endpoints, data persistence, and integration with other services.
 * It focuses on validating the core functionalities of the Health Journey, such as
 * creating, retrieving, and updating health metrics.
 *
 * Addresses requirement F-101: My Health Journey
 */
describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let healthService: HealthService;
  let prismaService: PrismaService;
  let kafkaService: KafkaService;
  let agent: SuperAgentTest;
  let logger: Logger;

  beforeEach(async () => {
    // Create a logger for the test
    logger = new Logger('HealthE2ETest');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        DevicesService,
        {
          provide: PrismaService,
          useValue: {
            healthMetric: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
            $connect: jest.fn(),
            $disconnect: jest.fn(),
          },
        },
        {
          provide: KafkaService,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    })
      .overrideProvider(HealthService)
      .useValue({
        createHealthMetric: jest.fn(),
        updateHealthMetric: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Use the enhanced exception filter with proper error classification
    app.useGlobalFilters(new AllExceptionsFilter(logger));
    
    await app.init();
    
    healthService = moduleFixture.get<HealthService>(HealthService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    kafkaService = moduleFixture.get<KafkaService>(KafkaService);
    agent = request.agent(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/health/:recordId (POST)', () => {
    it('should return 201 when creating a valid health metric', async () => {
      const recordId = 'valid-record-id';
      const createMetricDto: CreateMetricDto = {
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
        source: MetricSource.MANUAL,
        notes: 'Resting heart rate',
      };

      const expectedResponse: Partial<IHealthMetric> = {
        id: 'new-metric-id',
        recordId,
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: expect.any(Date),
        source: MetricSource.MANUAL,
        notes: 'Resting heart rate',
      };

      (healthService.createHealthMetric as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await agent
        .post(`/health/${recordId}`)
        .send(createMetricDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual({
        ...expectedResponse,
        timestamp: expectedResponse.timestamp.toISOString(),
      });
      expect(healthService.createHealthMetric).toHaveBeenCalledWith(recordId, createMetricDto);
    });

    it('should return 400 when creating an invalid health metric', async () => {
      const recordId = 'valid-record-id';
      const createMetricDto = {
        type: 'INVALID_TYPE', // Invalid metric type
        value: 'not a number', // Invalid value
        unit: 123, // Invalid unit
        timestamp: 'not a date', // Invalid timestamp
        source: 'WRONG', // Invalid source
        notes: null,
      };

      const response = await agent
        .post(`/health/${recordId}`)
        .send(createMetricDto)
        .expect(HttpStatus.BAD_REQUEST);

      // Verify the error response format matches the standardized error structure
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 when record not found', async () => {
      const recordId = 'non-existent-record';
      const createMetricDto: CreateMetricDto = {
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
        source: MetricSource.MANUAL,
        notes: 'Resting heart rate',
      };

      // Mock the service to throw a not found error
      (healthService.createHealthMetric as jest.Mock).mockRejectedValue({
        code: HEALTH_ERROR_CODES.RECORD_NOT_FOUND,
        message: `Health record with ID ${recordId} not found`,
      });

      const response = await agent
        .post(`/health/${recordId}`)
        .send(createMetricDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('code', HEALTH_ERROR_CODES.RECORD_NOT_FOUND);
    });

    it('should handle transient database errors with retry mechanism', async () => {
      const recordId = 'valid-record-id';
      const createMetricDto: CreateMetricDto = {
        type: MetricType.HEART_RATE,
        value: 72,
        unit: 'bpm',
        timestamp: new Date(),
        source: MetricSource.MANUAL,
        notes: 'Resting heart rate',
      };

      // First call fails with a transient error, second call succeeds
      let callCount = 0;
      (healthService.createHealthMetric as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            code: 'DATABASE_CONNECTION_ERROR',
            message: 'Transient database connection error',
            isTransient: true,
          });
        }
        return Promise.resolve({
          id: 'new-metric-id',
          recordId,
          ...createMetricDto,
        });
      });

      const response = await agent
        .post(`/health/${recordId}`)
        .send(createMetricDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('id', 'new-metric-id');
      expect(healthService.createHealthMetric).toHaveBeenCalledTimes(2);
    });
  });

  describe('/health/:id (PUT)', () => {
    it('should return 200 when updating a valid health metric', async () => {
      const metricId = 'valid-metric-id';
      const updateMetricDto: UpdateMetricDto = {
        value: 75,
        notes: 'Updated resting heart rate',
      };

      const expectedResponse: Partial<IHealthMetric> = {
        id: metricId,
        type: MetricType.HEART_RATE,
        value: 75,
        unit: 'bpm',
        timestamp: new Date(),
        source: MetricSource.MANUAL,
        notes: 'Updated resting heart rate',
      };

      (healthService.updateHealthMetric as jest.Mock).mockResolvedValue(expectedResponse);

      const response = await agent
        .put(`/health/${metricId}`)
        .send(updateMetricDto)
        .expect(HttpStatus.OK);

      expect(response.body).toEqual({
        ...expectedResponse,
        timestamp: expectedResponse.timestamp.toISOString(),
      });
      expect(healthService.updateHealthMetric).toHaveBeenCalledWith(metricId, updateMetricDto);
    });

    it('should return 400 when updating with invalid data', async () => {
      const metricId = 'valid-metric-id';
      const updateMetricDto = {
        value: 'not a number',
        notes: 123, // Notes should be a string
      };

      const response = await agent
        .put(`/health/${metricId}`)
        .send(updateMetricDto)
        .expect(HttpStatus.BAD_REQUEST);

      // Verify the error response format matches the standardized error structure
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return 404 when metric not found', async () => {
      const metricId = 'non-existent-metric';
      const updateMetricDto: UpdateMetricDto = {
        value: 75,
        notes: 'Updated resting heart rate',
      };

      // Mock the service to throw a not found error
      (healthService.updateHealthMetric as jest.Mock).mockRejectedValue({
        code: HEALTH_ERROR_CODES.METRIC_NOT_FOUND,
        message: `Health metric with ID ${metricId} not found`,
      });

      const response = await agent
        .put(`/health/${metricId}`)
        .send(updateMetricDto)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toHaveProperty('code', HEALTH_ERROR_CODES.METRIC_NOT_FOUND);
    });

    it('should handle concurrent update conflicts with proper error response', async () => {
      const metricId = 'valid-metric-id';
      const updateMetricDto: UpdateMetricDto = {
        value: 75,
        notes: 'Updated resting heart rate',
      };

      // Mock the service to throw a conflict error
      (healthService.updateHealthMetric as jest.Mock).mockRejectedValue({
        code: HEALTH_ERROR_CODES.CONCURRENT_MODIFICATION,
        message: 'The health metric was modified by another request',
      });

      const response = await agent
        .put(`/health/${metricId}`)
        .send(updateMetricDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toHaveProperty('code', HEALTH_ERROR_CODES.CONCURRENT_MODIFICATION);
    });
  });
});