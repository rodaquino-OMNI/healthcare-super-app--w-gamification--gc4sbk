import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { JwtAuthGuard } from '@nestjs/passport';
import { AppModule } from '../src/app.module';
import { DlqService } from '../src/retry/dlq/dlq.service';
import { QueryDlqEntriesDto } from '../src/retry/dlq/dto/query-dlq-entries.dto';
import { ProcessDlqEntryDto } from '../src/retry/dlq/dto/process-dlq-entry.dto';
import { DlqEntryResponseDto } from '../src/retry/dlq/dto/dlq-entry-response.dto';
import { DlqStatisticsResponseDto } from '../src/retry/dlq/dto/dlq-statistics-response.dto';

describe('DlqController (e2e)', () => {
  let app: INestApplication;
  const mockDlqService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    process: jest.fn(),
    getStatistics: jest.fn(),
  };

  // Mock DLQ entries for testing
  const mockDlqEntries: DlqEntryResponseDto[] = [
    {
      id: '1',
      notificationId: '123e4567-e89b-12d3-a456-426614174001',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      channel: 'email',
      errorType: 'external',
      errorMessage: 'SMTP server connection failed',
      errorStack: 'Error: SMTP server connection failed\n    at SMTPClient.connect (/app/node_modules/smtp-client/index.js:125:23)',
      payload: JSON.stringify({
        to: 'user@example.com',
        subject: 'Appointment Reminder',
        template: 'appointment-reminder',
        data: { appointmentId: '456', provider: 'Dr. Santos', time: '10:00 AM' },
      }),
      retryHistory: [
        { timestamp: new Date('2023-04-10T10:00:00Z').toISOString(), error: 'Connection timeout' },
        { timestamp: new Date('2023-04-10T10:05:00Z').toISOString(), error: 'SMTP server connection failed' },
        { timestamp: new Date('2023-04-10T10:10:00Z').toISOString(), error: 'SMTP server connection failed' },
      ],
      status: 'pending',
      createdAt: new Date('2023-04-10T09:58:00Z').toISOString(),
      updatedAt: new Date('2023-04-10T10:10:00Z').toISOString(),
    },
    {
      id: '2',
      notificationId: '123e4567-e89b-12d3-a456-426614174002',
      userId: '123e4567-e89b-12d3-a456-426614174000',
      channel: 'push',
      errorType: 'client',
      errorMessage: 'Invalid device token',
      errorStack: 'Error: Invalid device token\n    at PushService.sendNotification (/app/src/channels/push/push.service.ts:45:11)',
      payload: JSON.stringify({
        token: 'invalid-token-123',
        title: 'Achievement Unlocked!',
        body: 'You unlocked the Daily Steps achievement!',
        data: { achievementId: 'daily-steps', xp: 50 },
      }),
      retryHistory: [
        { timestamp: new Date('2023-04-11T14:00:00Z').toISOString(), error: 'Invalid device token' },
        { timestamp: new Date('2023-04-11T14:05:00Z').toISOString(), error: 'Invalid device token' },
      ],
      status: 'pending',
      createdAt: new Date('2023-04-11T13:58:00Z').toISOString(),
      updatedAt: new Date('2023-04-11T14:05:00Z').toISOString(),
    },
    {
      id: '3',
      notificationId: '123e4567-e89b-12d3-a456-426614174003',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      channel: 'sms',
      errorType: 'system',
      errorMessage: 'Database connection error',
      errorStack: 'Error: Database connection error\n    at PrismaClient.connect (/app/node_modules/@prisma/client/index.js:125:23)',
      payload: JSON.stringify({
        to: '+1234567890',
        body: 'Your appointment with Dr. Santos is tomorrow at 10:00 AM',
      }),
      retryHistory: [
        { timestamp: new Date('2023-04-12T09:00:00Z').toISOString(), error: 'Database connection error' },
      ],
      status: 'resolved',
      createdAt: new Date('2023-04-12T08:58:00Z').toISOString(),
      updatedAt: new Date('2023-04-12T10:15:00Z').toISOString(),
    },
    {
      id: '4',
      notificationId: '123e4567-e89b-12d3-a456-426614174004',
      userId: '123e4567-e89b-12d3-a456-426614174002',
      channel: 'in-app',
      errorType: 'transient',
      errorMessage: 'Service temporarily unavailable',
      errorStack: 'Error: Service temporarily unavailable\n    at InAppService.deliver (/app/src/channels/in-app/in-app.service.ts:67:9)',
      payload: JSON.stringify({
        userId: '123e4567-e89b-12d3-a456-426614174002',
        title: 'New Message',
        body: 'You have a new message from your doctor',
        data: { messageId: '789', sender: 'Dr. Santos' },
      }),
      retryHistory: [
        { timestamp: new Date('2023-04-13T11:00:00Z').toISOString(), error: 'Service temporarily unavailable' },
        { timestamp: new Date('2023-04-13T11:05:00Z').toISOString(), error: 'Service temporarily unavailable' },
      ],
      status: 'reprocessed',
      createdAt: new Date('2023-04-13T10:58:00Z').toISOString(),
      updatedAt: new Date('2023-04-13T11:30:00Z').toISOString(),
    },
  ];

  // Mock DLQ statistics for testing
  const mockDlqStatistics: DlqStatisticsResponseDto = {
    totalEntries: 4,
    entriesByErrorType: {
      client: 1,
      system: 1,
      transient: 1,
      external: 1,
    },
    entriesByChannel: {
      email: 1,
      sms: 1,
      push: 1,
      'in-app': 1,
    },
    entriesByStatus: {
      pending: 2,
      resolved: 1,
      reprocessed: 1,
    },
    entriesByTimePeriod: {
      last24Hours: 2,
      last7Days: 4,
      last30Days: 4,
    },
    averageTimeInQueue: '2.5 hours',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideProvider(DlqService)
      .useValue(mockDlqService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /dlq', () => {
    it('should return a list of DLQ entries with default pagination', () => {
      mockDlqService.findAll.mockResolvedValue({
        items: mockDlqEntries,
        total: mockDlqEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get('/dlq')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total', 4);
          expect(res.body).toHaveProperty('page', 1);
          expect(res.body).toHaveProperty('limit', 10);
          expect(res.body.items).toHaveLength(4);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            page: 1,
            limit: 10,
          });
        });
    });

    it('should filter DLQ entries by userId', () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const filteredEntries = mockDlqEntries.filter(entry => entry.userId === userId);
      
      mockDlqService.findAll.mockResolvedValue({
        items: filteredEntries,
        total: filteredEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get(`/dlq?userId=${userId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(2);
          expect(res.body.items[0].userId).toBe(userId);
          expect(res.body.items[1].userId).toBe(userId);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            userId,
            page: 1,
            limit: 10,
          });
        });
    });

    it('should filter DLQ entries by errorType', () => {
      const errorType = 'external';
      const filteredEntries = mockDlqEntries.filter(entry => entry.errorType === errorType);
      
      mockDlqService.findAll.mockResolvedValue({
        items: filteredEntries,
        total: filteredEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get(`/dlq?errorType=${errorType}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].errorType).toBe(errorType);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            errorType,
            page: 1,
            limit: 10,
          });
        });
    });

    it('should filter DLQ entries by channel', () => {
      const channel = 'email';
      const filteredEntries = mockDlqEntries.filter(entry => entry.channel === channel);
      
      mockDlqService.findAll.mockResolvedValue({
        items: filteredEntries,
        total: filteredEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get(`/dlq?channel=${channel}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].channel).toBe(channel);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            channel,
            page: 1,
            limit: 10,
          });
        });
    });

    it('should filter DLQ entries by status', () => {
      const status = 'pending';
      const filteredEntries = mockDlqEntries.filter(entry => entry.status === status);
      
      mockDlqService.findAll.mockResolvedValue({
        items: filteredEntries,
        total: filteredEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get(`/dlq?status=${status}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(2);
          expect(res.body.items[0].status).toBe(status);
          expect(res.body.items[1].status).toBe(status);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            status,
            page: 1,
            limit: 10,
          });
        });
    });

    it('should support pagination parameters', () => {
      const page = 2;
      const limit = 2;
      const paginatedEntries = mockDlqEntries.slice(2, 4); // Simulating page 2 with limit 2
      
      mockDlqService.findAll.mockResolvedValue({
        items: paginatedEntries,
        total: mockDlqEntries.length,
        page,
        limit,
        totalPages: 2,
      });

      return request(app.getHttpServer())
        .get(`/dlq?page=${page}&limit=${limit}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(2);
          expect(res.body.page).toBe(page);
          expect(res.body.limit).toBe(limit);
          expect(res.body.total).toBe(4);
          expect(res.body.totalPages).toBe(2);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            page,
            limit,
          });
        });
    });

    it('should handle date range filters', () => {
      const createdAfter = '2023-04-11T00:00:00Z';
      const createdBefore = '2023-04-13T00:00:00Z';
      const filteredEntries = mockDlqEntries.filter(
        entry => new Date(entry.createdAt) >= new Date(createdAfter) && 
                new Date(entry.createdAt) <= new Date(createdBefore)
      );
      
      mockDlqService.findAll.mockResolvedValue({
        items: filteredEntries,
        total: filteredEntries.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      return request(app.getHttpServer())
        .get(`/dlq?createdAfter=${createdAfter}&createdBefore=${createdBefore}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.items).toHaveLength(2);
          expect(mockDlqService.findAll).toHaveBeenCalledWith({
            createdAfter,
            createdBefore,
            page: 1,
            limit: 10,
          });
        });
    });

    it('should return 400 when query parameters are invalid', () => {
      return request(app.getHttpServer())
        .get('/dlq?page=invalid')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /dlq/:id', () => {
    it('should return a specific DLQ entry by ID', () => {
      const entryId = '1';
      const entry = mockDlqEntries.find(e => e.id === entryId);
      
      mockDlqService.findOne.mockResolvedValue(entry);

      return request(app.getHttpServer())
        .get(`/dlq/${entryId}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(entry);
          expect(mockDlqService.findOne).toHaveBeenCalledWith(entryId);
        });
    });

    it('should return 404 when DLQ entry is not found', () => {
      const entryId = 'non-existent';
      
      mockDlqService.findOne.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get(`/dlq/${entryId}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /dlq/:id/process', () => {
    it('should resolve a DLQ entry', () => {
      const entryId = '1';
      const processDto: ProcessDlqEntryDto = {
        action: 'resolve',
        comments: 'Issue resolved manually',
      };
      
      mockDlqService.process.mockResolvedValue({
        ...mockDlqEntries[0],
        status: 'resolved',
        updatedAt: new Date().toISOString(),
      });

      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(processDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.status).toBe('resolved');
          expect(mockDlqService.process).toHaveBeenCalledWith(entryId, processDto);
        });
    });

    it('should reprocess a DLQ entry', () => {
      const entryId = '2';
      const processDto: ProcessDlqEntryDto = {
        action: 'reprocess',
        comments: 'Fixed device token',
        overrideParams: {
          token: 'new-valid-token-456',
        },
      };
      
      mockDlqService.process.mockResolvedValue({
        ...mockDlqEntries[1],
        status: 'reprocessed',
        updatedAt: new Date().toISOString(),
      });

      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(processDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.status).toBe('reprocessed');
          expect(mockDlqService.process).toHaveBeenCalledWith(entryId, processDto);
        });
    });

    it('should return 400 when action is invalid', () => {
      const entryId = '1';
      const invalidDto = {
        action: 'invalid-action',
        comments: 'This action is not supported',
      };

      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(invalidDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 when DLQ entry is not found', () => {
      const entryId = 'non-existent';
      const processDto: ProcessDlqEntryDto = {
        action: 'resolve',
        comments: 'Issue resolved manually',
      };
      
      mockDlqService.process.mockRejectedValue(new Error('DLQ entry not found'));

      return request(app.getHttpServer())
        .post(`/dlq/${entryId}/process`)
        .send(processDto)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /dlq/statistics', () => {
    it('should return DLQ statistics', () => {
      mockDlqService.getStatistics.mockResolvedValue(mockDlqStatistics);

      return request(app.getHttpServer())
        .get('/dlq/statistics')
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockDlqStatistics);
          expect(mockDlqService.getStatistics).toHaveBeenCalled();
        });
    });

    it('should filter statistics by time range', () => {
      const startDate = '2023-04-01T00:00:00Z';
      const endDate = '2023-04-30T23:59:59Z';
      
      mockDlqService.getStatistics.mockResolvedValue(mockDlqStatistics);

      return request(app.getHttpServer())
        .get(`/dlq/statistics?startDate=${startDate}&endDate=${endDate}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toEqual(mockDlqStatistics);
          expect(mockDlqService.getStatistics).toHaveBeenCalledWith({
            startDate,
            endDate,
          });
        });
    });
  });
});